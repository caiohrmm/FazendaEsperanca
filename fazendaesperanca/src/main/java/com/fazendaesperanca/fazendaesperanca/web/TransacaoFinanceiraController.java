package com.fazendaesperanca.fazendaesperanca.web;

import com.fazendaesperanca.fazendaesperanca.domain.Acolhida;
import com.fazendaesperanca.fazendaesperanca.domain.TransacaoFinanceira;
import com.fazendaesperanca.fazendaesperanca.domain.enums.FormaPagamento;
import com.fazendaesperanca.fazendaesperanca.domain.enums.StatusTransacao;
import com.fazendaesperanca.fazendaesperanca.domain.enums.TipoTransacao;
import com.fazendaesperanca.fazendaesperanca.repository.AcolhidaRepository;
import com.fazendaesperanca.fazendaesperanca.repository.TransacaoFinanceiraRepository;
import com.fazendaesperanca.fazendaesperanca.repository.UserRepository;
import com.fazendaesperanca.fazendaesperanca.service.PdfService;
import com.fazendaesperanca.fazendaesperanca.service.ReciboSequenciaService;
import com.fazendaesperanca.fazendaesperanca.service.StorageService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.nio.file.Path;
import java.time.OffsetDateTime;

@RestController
@RequestMapping("/transacoes")
@RequiredArgsConstructor
public class TransacaoFinanceiraController {

    private final TransacaoFinanceiraRepository repository;
    private final AcolhidaRepository acolhidaRepository;
    private final UserRepository userRepository;
    private final ReciboSequenciaService reciboSequenciaService;
    private final PdfService pdfService;
    private final StorageService storageService;

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL','COLABORADOR')")
    @PostMapping
    @Transactional
    @com.fazendaesperanca.fazendaesperanca.audit.AuditableAction(value = com.fazendaesperanca.fazendaesperanca.domain.enums.AuditAction.CREATE, entity = "TransacaoFinanceira")
    public TransacaoFinanceira create(@Valid @RequestBody CriarTransacaoRequest req, @AuthenticationPrincipal UserDetails principal) {
        TransacaoFinanceira t = new TransacaoFinanceira();
        t.setTipo(req.getTipo());
        if (t.getTipo() == TipoTransacao.DOACAO_EXTERNA) {
            if (req.getOrigemNome() == null || req.getOrigemNome().isBlank()) throw new IllegalArgumentException("origemNome é obrigatório para doação externa");
            t.setOrigemNome(req.getOrigemNome());
            t.setOrigemDocumento(req.getOrigemDocumento());
        } else {
            if (req.getAcolhidaId() == null) throw new IllegalArgumentException("acolhidaId é obrigatório");
            Acolhida acolhida = acolhidaRepository.findById(req.getAcolhidaId()).orElseThrow();
            t.setAcolhida(acolhida);
        }
        if (req.getValor() == null || req.getValor().compareTo(BigDecimal.ZERO) <= 0) throw new IllegalArgumentException("valor deve ser > 0");
        t.setValor(req.getValor());
        t.setDataHora(req.getDataHora() != null ? req.getDataHora() : OffsetDateTime.now());
        t.setFormaPagamento(req.getFormaPagamento());
        t.setDescricao(req.getDescricao());
        t.setNumeroRecibo(reciboSequenciaService.gerarNumeroReciboUnico());
        var user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        t.setResponsavel(user);
        t.setStatus(StatusTransacao.PENDENTE_ASSINATURA);
        return repository.save(t);
    }

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL','COLABORADOR','VISUALIZADOR')")
    @GetMapping("/{id}/recibo/pdf")
    @com.fazendaesperanca.fazendaesperanca.audit.AuditableAction(value = com.fazendaesperanca.fazendaesperanca.domain.enums.AuditAction.EXPORT, entity = "TransacaoFinanceira", idParam = "id")
    public ResponseEntity<ByteArrayResource> gerarReciboPdf(@PathVariable Long id) {
        TransacaoFinanceira t = repository.findById(id).orElseThrow();
        String html = "<html><body><h1>Recibo "+t.getNumeroRecibo()+"</h1><p>Tipo: "+t.getTipo()+"</p><p>Valor: R$ "+t.getValor()+"</p><p>Assinatura: ________________________</p></body></html>";
        byte[] pdf = pdfService.renderHtmlToPdf(html);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=recibo-"+t.getNumeroRecibo()+".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(new ByteArrayResource(pdf));
    }

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL','COLABORADOR')")
    @PostMapping(value = "/{id}/recibo-assinado", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    @com.fazendaesperanca.fazendaesperanca.audit.AuditableAction(value = com.fazendaesperanca.fazendaesperanca.domain.enums.AuditAction.UPDATE, entity = "TransacaoFinanceira", idParam = "id")
    public TransacaoFinanceira uploadAssinado(@PathVariable Long id, @RequestPart("file") MultipartFile file) throws Exception {
        TransacaoFinanceira t = repository.findById(id).orElseThrow();
        Path path = storageService.saveAssinatura(id, file);
        t.setArquivoAssinadoPath(path.toString());
        t.setStatus(StatusTransacao.CONCLUIDA);
        return repository.save(t);
    }

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL','COLABORADOR','VISUALIZADOR')")
    @GetMapping
    public Page<TransacaoFinanceira> list(@RequestParam(required = false) TipoTransacao tipo,
                                          @RequestParam(required = false) FormaPagamento formaPagamento,
                                          @RequestParam(required = false) Long acolhidaId,
                                          @RequestParam(required = false) StatusTransacao status,
                                          @RequestParam(required = false) OffsetDateTime de,
                                          @RequestParam(required = false) OffsetDateTime ate,
                                          Pageable pageable) {
        Specification<TransacaoFinanceira> spec = (root, q, cb) -> cb.conjunction();
        if (tipo != null) spec = spec.and((r,q,cb) -> cb.equal(r.get("tipo"), tipo));
        if (formaPagamento != null) spec = spec.and((r,q,cb) -> cb.equal(r.get("formaPagamento"), formaPagamento));
        if (acolhidaId != null) spec = spec.and((r,q,cb) -> cb.equal(r.get("acolhida").get("id"), acolhidaId));
        if (status != null) spec = spec.and((r,q,cb) -> cb.equal(r.get("status"), status));
        if (de != null) spec = spec.and((r,q,cb) -> cb.greaterThanOrEqualTo(r.get("dataHora"), de));
        if (ate != null) spec = spec.and((r,q,cb) -> cb.lessThanOrEqualTo(r.get("dataHora"), ate));
        return repository.findAll(spec, pageable);
    }

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL','COLABORADOR','VISUALIZADOR')")
    @GetMapping("/{id}")
    public TransacaoFinanceira get(@PathVariable Long id) { return repository.findById(id).orElseThrow(); }

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL')")
    @PostMapping("/{id}/cancelar")
    @Transactional
    @com.fazendaesperanca.fazendaesperanca.audit.AuditableAction(value = com.fazendaesperanca.fazendaesperanca.domain.enums.AuditAction.UPDATE, entity = "TransacaoFinanceira", idParam = "id")
    public TransacaoFinanceira cancelar(@PathVariable Long id) {
        TransacaoFinanceira t = repository.findById(id).orElseThrow();
        t.setStatus(StatusTransacao.CANCELADA);
        return repository.save(t);
    }

    @Data
    public static class CriarTransacaoRequest {
        @NotNull
        private TipoTransacao tipo;
        private String origemNome;
        private String origemDocumento;
        private Long acolhidaId;
        @NotNull
        private BigDecimal valor;
        private OffsetDateTime dataHora;
        @NotNull
        private FormaPagamento formaPagamento;
        private String descricao;
    }
}


