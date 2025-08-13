package com.fazendaesperanca.fazendaesperanca.repository;

import com.fazendaesperanca.fazendaesperanca.domain.SaidaMedica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface SaidaMedicaRepository extends JpaRepository<SaidaMedica, Long>, JpaSpecificationExecutor<SaidaMedica> {}


