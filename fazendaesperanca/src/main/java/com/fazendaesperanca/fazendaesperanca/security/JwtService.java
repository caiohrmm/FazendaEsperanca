package com.fazendaesperanca.fazendaesperanca.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;
import java.nio.charset.StandardCharsets;

@Service
public class JwtService {

    @Value("${app.security.jwt.secret}")
    private String secret;

    @Value("${app.security.jwt.issuer:fazenda-esperanca}")
    private String issuer;

    @Value("${app.security.jwt.access-token-ttl-minutes:30}")
    private long accessTtlMinutes;

    @Value("${app.security.jwt.refresh-token-ttl-days:7}")
    private long refreshTtlDays;

    public String generateAccessToken(String subject, Map<String, Object> claims) {
        return generateToken(subject, claims, Instant.now().plus(accessTtlMinutes, ChronoUnit.MINUTES));
    }

    public String generateRefreshToken(String subject) {
        return generateToken(subject, Map.of("type", "refresh"), Instant.now().plus(refreshTtlDays, ChronoUnit.DAYS));
    }

    public Claims parse(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .requireIssuer(issuer)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private String generateToken(String subject, Map<String, Object> claims, Instant expiry) {
        return Jwts.builder()
                .setIssuer(issuer)
                .setSubject(subject)
                .addClaims(claims)
                .setIssuedAt(new Date())
                .setExpiration(Date.from(expiry))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    private Key getKey() {
        String s = secret != null ? secret.trim() : "";
        if (isLikelyBase64(s)) {
            try {
                byte[] keyBytes = Decoders.BASE64.decode(s);
                return Keys.hmacShaKeyFor(keyBytes);
            } catch (IllegalArgumentException ignore) {
                // cai para bytes diretos
            }
        }
        return Keys.hmacShaKeyFor(s.getBytes(StandardCharsets.UTF_8));
    }

    private boolean isLikelyBase64(String s) {
        if (s.isEmpty()) return false;
        if ((s.length() % 4) != 0) return false;
        return s.matches("^[A-Za-z0-9+/=]+$");
    }
}


