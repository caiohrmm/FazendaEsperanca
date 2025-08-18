package com.fazendaesperanca.fazendaesperanca.repository;

import com.fazendaesperanca.fazendaesperanca.domain.TransacaoFinanceira;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface TransacaoFinanceiraRepository extends JpaRepository<TransacaoFinanceira, Long>, JpaSpecificationExecutor<TransacaoFinanceira> {
    boolean existsByNumeroRecibo(String numeroRecibo);

    @Query("select t from TransacaoFinanceira t left join fetch t.acolhida left join fetch t.responsavel where t.dataHora between :de and :ate")
    List<TransacaoFinanceira> findAllWithJoinsBetween(@Param("de") OffsetDateTime de, @Param("ate") OffsetDateTime ate);
}


