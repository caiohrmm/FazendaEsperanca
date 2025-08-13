package com.fazendaesperanca.fazendaesperanca.web;

import com.fazendaesperanca.fazendaesperanca.domain.User;
import com.fazendaesperanca.fazendaesperanca.domain.enums.Role;
import com.fazendaesperanca.fazendaesperanca.repository.UserRepository;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.fazendaesperanca.fazendaesperanca.security.JwtService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @PostMapping("/register")
    @org.springframework.security.access.prepost.PreAuthorize("permitAll()")
    public ResponseEntity<?> register(@RequestBody CreateUserRequest req) {
        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new IllegalArgumentException("E-mail já cadastrado");
        }
        User user = User.builder()
                .nome(req.getNome())
                .email(req.getEmail())
                .senhaHash(passwordEncoder.encode(req.getSenha()))
                .role(req.getRole())
                .ativo(true)
                .build();
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/login")
    @org.springframework.security.access.prepost.PreAuthorize("permitAll()")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getSenha())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String access = jwtService.generateAccessToken(req.getEmail(), java.util.Map.of());
        String refresh = jwtService.generateRefreshToken(req.getEmail());
        return ResponseEntity.ok(new TokenResponse(access, refresh));
    }

    @PostMapping("/refresh")
    @org.springframework.security.access.prepost.PreAuthorize("permitAll()")
    public ResponseEntity<?> refresh(@RequestBody RefreshRequest req) {
        var claims = jwtService.parse(req.getRefreshToken());
        if (!"refresh".equals(String.valueOf(claims.get("type")))) {
            throw new IllegalArgumentException("Token inválido");
        }
        String email = claims.getSubject();
        String access = jwtService.generateAccessToken(email, java.util.Map.of());
        String refresh = jwtService.generateRefreshToken(email);
        return ResponseEntity.ok(new TokenResponse(access, refresh));
    }

    @Data
    public static class CreateUserRequest {
        @NotBlank
        private String nome;
        @NotBlank @Email
        private String email;
        @NotBlank
        private String senha;
        private Role role = Role.VISUALIZADOR;
    }

    @Data
    public static class LoginRequest {
        @NotBlank @Email
        private String email;
        @NotBlank
        private String senha;
    }

    @Data
    public static class RefreshRequest {
        @NotBlank
        private String refreshToken;
    }

    @Data
    public static class TokenResponse {
        private final String accessToken;
        private final String refreshToken;
    }
}


