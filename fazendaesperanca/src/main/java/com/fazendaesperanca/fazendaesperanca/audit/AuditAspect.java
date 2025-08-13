package com.fazendaesperanca.fazendaesperanca.audit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fazendaesperanca.fazendaesperanca.domain.User;
import com.fazendaesperanca.fazendaesperanca.repository.UserRepository;
import com.fazendaesperanca.fazendaesperanca.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
public class AuditAspect {

    private final AuditService auditService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @AfterReturning("@annotation(auditable)")
    public void after(JoinPoint jp, AuditableAction auditable) {
        try {
            String entity = auditable.entity();
            String id = extractId(jp, auditable.idParam());
            String payload = objectMapper.writeValueAsString(jp.getArgs());
            auditService.log(entity, id, auditable.value(), getCurrentUserOrNull(), payload);
        } catch (Exception ignored) { }
    }

    private User getCurrentUserOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof org.springframework.security.core.userdetails.User springUser)) return null;
        return userRepository.findByEmail(springUser.getUsername()).orElse(null);
    }

    private String extractId(JoinPoint jp, String idParam) {
        Object[] args = jp.getArgs();
        for (Object a : args) {
            if (a instanceof Long l) return String.valueOf(l);
        }
        return "";
    }
}


