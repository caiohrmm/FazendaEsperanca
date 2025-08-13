package com.fazendaesperanca.fazendaesperanca.domain;

import com.fazendaesperanca.fazendaesperanca.domain.enums.StatusAcolhida;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "acolhida")
public class Acolhida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome_completo", nullable = false, length = 180)
    private String nomeCompleto;

    private LocalDate dataNascimento;

    private LocalDate dataEntrada;

    @Column(length = 30)
    private String documento;

    @Column(length = 30)
    private String telefone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusAcolhida status;

    @Column(name = "foto_url", length = 500)
    private String fotoUrl;

    @Column(columnDefinition = "text")
    private String observacoes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}


