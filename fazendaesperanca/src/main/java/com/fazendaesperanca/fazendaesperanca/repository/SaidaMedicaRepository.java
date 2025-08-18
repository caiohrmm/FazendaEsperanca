package com.fazendaesperanca.fazendaesperanca.repository;

import com.fazendaesperanca.fazendaesperanca.domain.SaidaMedica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface SaidaMedicaRepository extends JpaRepository<SaidaMedica, Long>, JpaSpecificationExecutor<SaidaMedica> {

    @Query("select s from SaidaMedica s join fetch s.acolhida where s.dataHoraSaida between :de and :ate")
    List<SaidaMedica> findAllWithAcolhidaBetween(@Param("de") OffsetDateTime de, @Param("ate") OffsetDateTime ate);
}


