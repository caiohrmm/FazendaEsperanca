package com.fazendaesperanca.fazendaesperanca.domain;

import com.fazendaesperanca.fazendaesperanca.domain.enums.AuditAction;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String entity;

    @Column(name = "entity_id", nullable = false, length = 120)
    private String entityId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AuditAction action;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private OffsetDateTime timestamp;

    @Column(name = "payload_snapshot", columnDefinition = "json")
    private String payloadSnapshot;
}


