package com.fazendaesperanca.fazendaesperanca.domain;

import com.fazendaesperanca.fazendaesperanca.domain.enums.FormaPagamento;
import com.fazendaesperanca.fazendaesperanca.domain.enums.StatusTransacao;
import com.fazendaesperanca.fazendaesperanca.domain.enums.TipoTransacao;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "transacao_financeira", indexes = {
        @Index(name = "idx_transacao_data", columnList = "data_hora"),
        @Index(name = "idx_transacao_tipo", columnList = "tipo")
})
public class TransacaoFinanceira {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoTransacao tipo;

    @Column(name = "origem_nome", length = 180)
    private String origemNome;

    @Column(name = "origem_documento", length = 30)
    private String origemDocumento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnore
    @JoinColumn(name = "acolhida_id")
    private Acolhida acolhida;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal valor;

    @Column(name = "data_hora", nullable = false)
    private OffsetDateTime dataHora;

    @Enumerated(EnumType.STRING)
    @Column(name = "forma_pagamento", nullable = false, length = 20)
    private FormaPagamento formaPagamento;

    @Column(columnDefinition = "text")
    private String descricao;

    @Column(name = "numero_recibo", nullable = false, unique = true, length = 40)
    private String numeroRecibo;

    @Column(name = "arquivo_assinado_path", length = 500)
    private String arquivoAssinadoPath;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JsonIgnore
    @JoinColumn(name = "responsavel_id")
    private User responsavel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusTransacao status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}


