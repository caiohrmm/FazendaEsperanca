package com.fazendaesperanca.fazendaesperanca.web;

import com.fazendaesperanca.fazendaesperanca.domain.SaidaMedica;
import com.fazendaesperanca.fazendaesperanca.domain.TransacaoFinanceira;
import com.fazendaesperanca.fazendaesperanca.repository.SaidaMedicaRepository;
import com.fazendaesperanca.fazendaesperanca.repository.TransacaoFinanceiraRepository;
import com.fazendaesperanca.fazendaesperanca.service.ExportService;
import com.fazendaesperanca.fazendaesperanca.service.PdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/relatorios")
@RequiredArgsConstructor
public class RelatoriosController {

    private final SaidaMedicaRepository saidaRepo;
    private final TransacaoFinanceiraRepository transRepo;
    private final ExportService exportService;
    private final PdfService pdfService;

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL')")
    @GetMapping(value = "/saidas-medicas.csv", produces = "text/csv")
    public ResponseEntity<ByteArrayResource> saidasCsv(@RequestParam OffsetDateTime de, @RequestParam OffsetDateTime ate) {
        Specification<SaidaMedica> spec = (r,q,cb)->cb.between(r.get("dataHoraSaida"), de, ate);
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[]{"ID","AcolhidaId","Motivo","Saída","Retorno","DuraçãoMin"});
        saidaRepo.findAll(spec).forEach(s -> {
            Long dur = s.getDataHoraRetorno() != null ? java.time.Duration.between(s.getDataHoraSaida(), s.getDataHoraRetorno()).toMinutes() : null;
            rows.add(new String[]{String.valueOf(s.getId()), String.valueOf(s.getAcolhida().getId()), s.getMotivo().name(), String.valueOf(s.getDataHoraSaida()), String.valueOf(s.getDataHoraRetorno()), String.valueOf(dur)});
        });
        byte[] csv = exportService.toCsv(rows);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=relatorio-saidas.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(new ByteArrayResource(csv));
    }

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL')")
    @GetMapping(value = "/financeiro.csv", produces = "text/csv")
    public ResponseEntity<ByteArrayResource> financeiroCsv(@RequestParam OffsetDateTime de, @RequestParam OffsetDateTime ate) {
        Specification<TransacaoFinanceira> spec = (r,q,cb)->cb.between(r.get("dataHora"), de, ate);
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[]{"ID","Tipo","Valor","Forma","AcolhidaId","Recibo","Status","Data"});
        transRepo.findAll(spec).forEach(t -> {
            rows.add(new String[]{String.valueOf(t.getId()), t.getTipo().name(), String.valueOf(t.getValor()), t.getFormaPagamento().name(), t.getAcolhida()!=null?String.valueOf(t.getAcolhida().getId()):"", t.getNumeroRecibo(), t.getStatus().name(), String.valueOf(t.getDataHora())});
        });
        byte[] csv = exportService.toCsv(rows);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=relatorio-financeiro.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(new ByteArrayResource(csv));
    }
}


