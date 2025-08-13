package com.fazendaesperanca.fazendaesperanca.repository;

import com.fazendaesperanca.fazendaesperanca.domain.TransacaoFinanceira;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface TransacaoFinanceiraRepository extends JpaRepository<TransacaoFinanceira, Long>, JpaSpecificationExecutor<TransacaoFinanceira> {
    boolean existsByNumeroRecibo(String numeroRecibo);
}


