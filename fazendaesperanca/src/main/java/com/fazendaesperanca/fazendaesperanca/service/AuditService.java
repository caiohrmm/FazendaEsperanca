package com.fazendaesperanca.fazendaesperanca.service;

import com.fazendaesperanca.fazendaesperanca.domain.AuditLog;
import com.fazendaesperanca.fazendaesperanca.domain.User;
import com.fazendaesperanca.fazendaesperanca.domain.enums.AuditAction;
import com.fazendaesperanca.fazendaesperanca.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditRepo;

    public void log(String entity, String entityId, AuditAction action, User user, String snapshotJson) {
        AuditLog log = AuditLog.builder()
                .entity(entity)
                .entityId(entityId)
                .action(action)
                .user(user)
                .timestamp(OffsetDateTime.now())
                .payloadSnapshot(snapshotJson)
                .build();
        auditRepo.save(log);
    }
}


