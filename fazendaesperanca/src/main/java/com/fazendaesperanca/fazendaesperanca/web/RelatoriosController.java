package com.fazendaesperanca.fazendaesperanca.web;

import com.fazendaesperanca.fazendaesperanca.domain.SaidaMedica;
import com.fazendaesperanca.fazendaesperanca.domain.TransacaoFinanceira;
import com.fazendaesperanca.fazendaesperanca.repository.SaidaMedicaRepository;
import com.fazendaesperanca.fazendaesperanca.repository.TransacaoFinanceiraRepository;
import com.fazendaesperanca.fazendaesperanca.service.ExportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/relatorios")
@RequiredArgsConstructor
@Slf4j
public class RelatoriosController {

    private final SaidaMedicaRepository saidaRepo;
    private final TransacaoFinanceiraRepository transRepo;
    private final ExportService exportService;
    

    private static final DateTimeFormatter DATE_TIME_BR = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static String prettyEnum(String name) {
        if (name == null) return "";
        String spaced = name.replace('_', ' ').toLowerCase();
        StringBuilder sb = new StringBuilder(spaced.length());
        boolean cap = true;
        for (char ch : spaced.toCharArray()) {
            if (Character.isWhitespace(ch)) {
                cap = true; sb.append(ch);
            } else {
                sb.append(cap ? Character.toUpperCase(ch) : ch);
                cap = false;
            }
        }
        return sb.toString();
    }

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL')")
    @GetMapping(value = "/saidas-medicas.csv", produces = "text/csv")
    public ResponseEntity<ByteArrayResource> saidasCsv(@RequestParam OffsetDateTime de, @RequestParam OffsetDateTime ate) {
        log.info("Relatorio saidas-medicas.csv requisitado: de={} ate={}", de, ate);
        List<SaidaMedica> list = saidaRepo.findAllWithAcolhidaBetween(de, ate);
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[]{"ID","AcolhidaId","AcolhidaNome","Motivo","Destino","Profissional","Saída","Retorno","Duração (min)","Meio Transporte","Responsável","Observações"});
        list.forEach(s -> {
            Long dur = s.getDataHoraRetorno() != null ? java.time.Duration.between(s.getDataHoraSaida(), s.getDataHoraRetorno()).toMinutes() : null;
            rows.add(new String[]{
                    String.valueOf(s.getId()),
                    String.valueOf(s.getAcolhida().getId()),
                    s.getAcolhida().getNomeCompleto(),
                    prettyEnum(s.getMotivo().name()),
                    s.getDestino()!=null? s.getDestino() : "",
                    s.getProfissional()!=null? s.getProfissional() : "",
                    s.getDataHoraSaida()!=null ? DATE_TIME_BR.format(s.getDataHoraSaida()) : "",
                    s.getDataHoraRetorno()!=null ? DATE_TIME_BR.format(s.getDataHoraRetorno()) : "",
                    dur!=null ? String.valueOf(dur) : "",
                    s.getMeioTransporte()!=null? s.getMeioTransporte() : "",
                    s.getResponsavel()!=null? prettyEnum(s.getResponsavel().name()) : "",
                    s.getObservacoes()!=null? s.getObservacoes() : ""
            });
        });
        byte[] csv = exportService.toCsv(rows);
        log.info("Relatorio saidas-medicas.csv gerado com {} linhas", rows.size());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=relatorio-saidas.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(new ByteArrayResource(csv));
    }

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL')")
    @GetMapping(value = "/financeiro.csv", produces = "text/csv")
    public ResponseEntity<ByteArrayResource> financeiroCsv(@RequestParam OffsetDateTime de, @RequestParam OffsetDateTime ate) {
        log.info("Relatorio financeiro.csv requisitado: de={} ate={}", de, ate);
        List<TransacaoFinanceira> list = transRepo.findAllWithJoinsBetween(de, ate);
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[]{"ID","Tipo","Valor","Forma","Acolhida","Origem","Documento","Recibo","Data","Descrição","Responsável"});
        list.forEach(t -> {
            rows.add(new String[]{
                    String.valueOf(t.getId()),
                    prettyEnum(t.getTipo().name()),
                    t.getValor()!=null? t.getValor().toPlainString() : "",
                    prettyEnum(t.getFormaPagamento().name()),
                    t.getAcolhida()!=null?t.getAcolhida().getNomeCompleto():"",
                    t.getOrigemNome()!=null?t.getOrigemNome():"",
                    t.getOrigemDocumento()!=null?t.getOrigemDocumento():"",
                    t.getNumeroRecibo(),
                    t.getDataHora()!=null? DATE_TIME_BR.format(t.getDataHora()):"",
                    t.getDescricao()!=null?t.getDescricao():"",
                    t.getResponsavel()!=null? t.getResponsavel().getNome() : ""
            });
        });
        byte[] csv = exportService.toCsv(rows);
        log.info("Relatorio financeiro.csv gerado com {} linhas", rows.size());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=relatorio-financeiro.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(new ByteArrayResource(csv));
    }

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL')")
    @GetMapping(value = "/saidas-medicas.xlsx")
    public ResponseEntity<ByteArrayResource> saidasExcel(@RequestParam OffsetDateTime de, @RequestParam OffsetDateTime ate) {
        log.info("Relatorio saidas-medicas.xlsx requisitado: de={} ate={}", de, ate);
        List<SaidaMedica> list = saidaRepo.findAllWithAcolhidaBetween(de, ate);
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[]{"ID","AcolhidaId","AcolhidaNome","Motivo","Destino","Profissional","Saída","Retorno","Duração (min)","Meio Transporte","Responsável","Observações"});
        list.forEach(s -> {
            Long dur = s.getDataHoraRetorno() != null ? java.time.Duration.between(s.getDataHoraSaida(), s.getDataHoraRetorno()).toMinutes() : null;
            rows.add(new String[]{
                    String.valueOf(s.getId()),
                    String.valueOf(s.getAcolhida().getId()),
                    s.getAcolhida().getNomeCompleto(),
                    prettyEnum(s.getMotivo().name()),
                    s.getDestino()!=null? s.getDestino() : "",
                    s.getProfissional()!=null? s.getProfissional() : "",
                    s.getDataHoraSaida()!=null ? DATE_TIME_BR.format(s.getDataHoraSaida()) : "",
                    s.getDataHoraRetorno()!=null ? DATE_TIME_BR.format(s.getDataHoraRetorno()) : "",
                    dur!=null ? String.valueOf(dur) : "",
                    s.getMeioTransporte()!=null? s.getMeioTransporte() : "",
                    s.getResponsavel()!=null? prettyEnum(s.getResponsavel().name()) : "",
                    s.getObservacoes()!=null? s.getObservacoes() : ""
            });
        });
        String subtitle = String.format("Período: %s até %s", DATE_TIME_BR.format(de), DATE_TIME_BR.format(ate));
        byte[] xlsx = exportService.toExcelStyled(rows, "SaidasMedicas", "Fazenda Esperança - Saídas Médicas", subtitle);
        log.info("Relatorio saidas-medicas.xlsx gerado com {} linhas", rows.size());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=relatorio-saidas.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new ByteArrayResource(xlsx));
    }

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL')")
    @GetMapping(value = "/financeiro.xlsx")
    public ResponseEntity<ByteArrayResource> financeiroExcel(@RequestParam OffsetDateTime de, @RequestParam OffsetDateTime ate) {
        log.info("Relatorio financeiro.xlsx requisitado: de={} ate={}", de, ate);
        List<TransacaoFinanceira> list = transRepo.findAllWithJoinsBetween(de, ate);
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[]{"ID","Tipo","Valor","Forma","Acolhida","Origem","Documento","Recibo","Data","Descrição","Responsável"});
        list.forEach(t -> {
            rows.add(new String[]{
                    String.valueOf(t.getId()),
                    prettyEnum(t.getTipo().name()),
                    t.getValor()!=null? t.getValor().toPlainString() : "",
                    prettyEnum(t.getFormaPagamento().name()),
                    t.getAcolhida()!=null?t.getAcolhida().getNomeCompleto():"",
                    t.getOrigemNome()!=null?t.getOrigemNome():"",
                    t.getOrigemDocumento()!=null?t.getOrigemDocumento():"",
                    t.getNumeroRecibo(),
                    t.getDataHora()!=null? DATE_TIME_BR.format(t.getDataHora()):"",
                    t.getDescricao()!=null?t.getDescricao():"",
                    t.getResponsavel()!=null? t.getResponsavel().getNome() : ""
            });
        });
        String subtitle = String.format("Período: %s até %s", DATE_TIME_BR.format(de), DATE_TIME_BR.format(ate));
        byte[] xlsx = exportService.toExcelStyled(rows, "Financeiro", "Fazenda Esperança - Financeiro", subtitle);
        log.info("Relatorio financeiro.xlsx gerado com {} linhas", rows.size());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=relatorio-financeiro.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new ByteArrayResource(xlsx));
    }
}


