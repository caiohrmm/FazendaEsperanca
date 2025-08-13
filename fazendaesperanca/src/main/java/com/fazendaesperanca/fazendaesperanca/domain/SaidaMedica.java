package com.fazendaesperanca.fazendaesperanca.domain;

import com.fazendaesperanca.fazendaesperanca.domain.enums.MotivoSaidaMedica;
import com.fazendaesperanca.fazendaesperanca.domain.enums.ResponsavelSaidaMedica;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "saida_medica", indexes = {
        @Index(name = "idx_saida_medica_data_saida", columnList = "data_hora_saida")
})
public class SaidaMedica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "acolhida_id")
    private Acolhida acolhida;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MotivoSaidaMedica motivo;

    @Column(nullable = false)
    private String destino;

    private String profissional;

    @Column(name = "data_hora_saida", nullable = false)
    private OffsetDateTime dataHoraSaida;

    @Column(name = "data_hora_retorno")
    private OffsetDateTime dataHoraRetorno;

    @Column(name = "meio_transporte")
    private String meioTransporte;

    @Enumerated(EnumType.STRING)
    @Column(name = "responsavel", nullable = false, length = 40)
    private ResponsavelSaidaMedica responsavel;

    @Column(columnDefinition = "text")
    private String observacoes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}


