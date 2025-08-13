package com.fazendaesperanca.fazendaesperanca.repository;

import com.fazendaesperanca.fazendaesperanca.domain.Acolhida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AcolhidaRepository extends JpaRepository<Acolhida, Long>, JpaSpecificationExecutor<Acolhida> {}


