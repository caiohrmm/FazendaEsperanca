package com.fazendaesperanca.fazendaesperanca.service;

import com.fazendaesperanca.fazendaesperanca.repository.TransacaoFinanceiraRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;

@Service
@RequiredArgsConstructor
public class ReciboSequenciaService {

    private final TransacaoFinanceiraRepository transacaoRepo;

    // Gera sequência: REC-{YYYY}-{sequencial}
    @Transactional
    public String gerarNumeroReciboUnico() {
        int ano = Year.now().getValue();
        int tentativa = 1;
        while (true) {
            String numero = String.format("REC-%d-%05d", ano, tentativa);
            if (!transacaoRepo.existsByNumeroRecibo(numero)) {
                return numero;
            }
            tentativa++;
            if (tentativa > 99999) {
                throw new IllegalStateException("Limite de recibos atingido para o ano " + ano);
            }
        }
    }
}


