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
// import removed
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
// import removed: MultipartFile no longer used

import java.math.BigDecimal;
// import removed: Path no longer used
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
            // Vincular automaticamente o documento da acolhida à transação
            if (acolhida.getDocumento() != null && !acolhida.getDocumento().isBlank()) {
                t.setOrigemDocumento(acolhida.getDocumento());
            }
        }
        if (req.getValor() == null || req.getValor().compareTo(BigDecimal.ZERO) <= 0) throw new IllegalArgumentException("valor deve ser > 0");
        t.setValor(req.getValor());
        t.setDataHora(req.getDataHora() != null ? req.getDataHora() : OffsetDateTime.now());
        t.setFormaPagamento(req.getFormaPagamento());
        t.setDescricao(req.getDescricao());
        t.setNumeroRecibo(reciboSequenciaService.gerarNumeroReciboUnico());
        var user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        t.setResponsavel(user);
        // Status conforme tipo
        if (t.getTipo() == TipoTransacao.DOACAO_EXTERNA) {
            t.setStatus(StatusTransacao.CONCLUIDA);
        } else {
        t.setStatus(StatusTransacao.PENDENTE_ASSINATURA);
        }
        return repository.save(t);
    }

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL','COLABORADOR','VISUALIZADOR')")
    @GetMapping("/{id}/recibo/pdf")
    @Transactional
    @com.fazendaesperanca.fazendaesperanca.audit.AuditableAction(value = com.fazendaesperanca.fazendaesperanca.domain.enums.AuditAction.EXPORT, entity = "TransacaoFinanceira", idParam = "id")
    public ResponseEntity<ByteArrayResource> gerarReciboPdf(@PathVariable Long id) {
        TransacaoFinanceira t = repository.findById(id).orElseThrow();
        String html = buildReciboHtml(t);
        byte[] pdf = pdfService.renderHtmlToPdf(html);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=recibo-"+t.getNumeroRecibo()+".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(new ByteArrayResource(pdf));
    }

    private String buildReciboHtml(TransacaoFinanceira t) {
        String logoImg = resolveLogoDataUri();
        String orgNome = "OBRA SOCIAL NOSSA SENHORA DA GLÓRIA – FAZENDA DA ESPERANÇA SÃO DOMINGOS GUSMÃO";
        String orgCnpj = "CNPJ: 48.555.775/0109-70";
        String orgEndereco = "Endereço: Rua Rafael Basílio, nº 155 – Bairro Sodrélia";
        String orgCidade = "CEP: 18920-014 – Santa Cruz do Rio Pardo/SP";
        String orgFone = "Telefone: (14) 99817-6257";

        java.util.Locale localeBR = new java.util.Locale("pt", "BR");
        java.text.NumberFormat moeda = java.text.NumberFormat.getCurrencyInstance(localeBR);
        java.time.ZoneId zoneBR = java.time.ZoneId.of("America/Sao_Paulo");
        String tipoLabel = t.getTipo().name().equals("DOACAO_EXTERNA") ? "Doação Externa" : "Recebimento de Acolhida";
        String valorStr = moeda.format(t.getValor());
        java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter
                .ofPattern("dd/MM/yyyy HH:mm")
                .withLocale(localeBR)
                .withZone(zoneBR);
        String dataStr = t.getDataHora() != null ? fmt.format(t.getDataHora().atZoneSameInstant(zoneBR)) : "";
        String formaLabel;
        switch (t.getFormaPagamento()) {
            case PIX -> formaLabel = "Pix";
            case DINHEIRO -> formaLabel = "Dinheiro";
            case DEPOSITO -> formaLabel = "Depósito";
            case CARTAO -> formaLabel = "Cartão";
            case TRANSFERENCIA -> formaLabel = "Transferência";
            default -> formaLabel = t.getFormaPagamento().name();
        }

        StringBuilder destinatario = new StringBuilder();
        if (t.getTipo().name().equals("DOACAO_EXTERNA")) {
            destinatario.append("<div class=\"row\"><span class=\"lbl\">Doador:</span> ")
                    .append(escape(t.getOrigemNome() != null ? t.getOrigemNome() : "")).append("</div>");
            if (t.getOrigemDocumento() != null && !t.getOrigemDocumento().isBlank()) {
                destinatario.append("<div class=\"row\"><span class=\"lbl\">Documento:</span> ")
                        .append(escape(t.getOrigemDocumento())).append("</div>");
            }
        } else {
            String nome = t.getAcolhida() != null ? t.getAcolhida().getNomeCompleto() : "";
            String doc = t.getAcolhida() != null ? (t.getAcolhida().getDocumento() != null ? t.getAcolhida().getDocumento() : "") : "";
            destinatario.append("<div class=\"row\"><span class=\"lbl\">Acolhida:</span> ")
                    .append(escape(nome)).append("</div>")
                    .append("<div class=\"row\"><span class=\"lbl\">CPF:</span> ")
                    .append(escape(doc)).append("</div>");
        }

        String descricao = t.getDescricao() != null ? escape(t.getDescricao()) : "-";

        String logoHtml = logoImg != null ? ("<img class=\"logo\" src='" + logoImg + "' alt='Logo' />") : "";
        String linhaReconhecimento;
        if (t.getTipo().name().equals("DOACAO_EXTERNA")) {
            linhaReconhecimento = "Recebemos a importância de "+escape(valorStr)+" a título de Doação Externa.";
        } else {
            String nome = t.getAcolhida() != null ? t.getAcolhida().getNomeCompleto() : "";
            String doc = t.getAcolhida() != null ? (t.getAcolhida().getDocumento() != null ? t.getAcolhida().getDocumento() : "") : "";
            linhaReconhecimento = "Recebemos de "+escape(nome)+" – CPF "+escape(doc)+" a importância de "+escape(valorStr)+".";
        }

        String assinaturaNome = "Alcileia Figueredo";
        String assinaturaTitulo = "Presidente da Filial e Agente Terapêutica";
        String assinaturaCPF = "CPF 851.130.187-91";

        return "" +
                "<?xml version='1.0' encoding='UTF-8'?>" +
                "<html xmlns='http://www.w3.org/1999/xhtml' lang='pt-BR'><head><meta charset='UTF-8'/>" +
                "<style>" +
                "body{font-family:Arial, Helvetica, sans-serif;color:#111;margin:28px;}" +
                ".header{border-bottom:2px solid #555;padding-bottom:12px;margin-bottom:16px;}" +
                ".tbl{width:100%;border-collapse:collapse;}" +
                ".logo{height:56px;}" +
                ".org{font-weight:800;font-size:18px;line-height:1.25;}" +
                ".muted{color:#444;font-size:12px;}" +
                ".title{font-size:22px;font-weight:800;margin:14px 0;text-align:center;}" +
                ".kv{border:1px solid #bbb;border-radius:6px;padding:12px;margin:10px 0;background:#fafafa;}" +
                ".row{margin:6px 0;} .lbl{display:inline-block;min-width:170px;color:#333;font-weight:600;}" +
                ".paragraph{margin:12px 0;line-height:1.4;}" +
                ".sign{margin-top:48px;text-align:center;} .line{margin-top:36px;border-top:1px solid #333;width:320px;margin-left:auto;margin-right:auto;}" +
                ".foot{margin-top:18px;font-size:12px;color:#444;text-align:center;}" +
                "</style></head><body>" +
                "<div class='header'>" +
                "<table class='tbl'><tr>"+
                "<td style='width:70px;vertical-align:top'>"+logoHtml+"</td>"+
                "<td style='vertical-align:top'>"+
                "<div class='org'>"+orgNome+"</div>"+
                "<div class='muted'>"+orgCnpj+"</div>"+
                "<div class='muted'>"+orgEndereco+"</div>"+
                "<div class='muted'>"+orgCidade+" – "+orgFone+"</div>"+
                "</td></tr></table>"+
                "</div>"+
                "<div class='title'>Recibo nº "+escape(t.getNumeroRecibo())+"</div>"+
                "<div class='kv'>"+
                "<div class='row'><span class='lbl'>Tipo:</span> "+tipoLabel+"</div>"+
                "<div class='row'><span class='lbl'>Valor:</span> "+valorStr+"</div>"+
                "<div class='row'><span class='lbl'>Forma de pagamento:</span> "+formaLabel+"</div>"+
                "<div class='row'><span class='lbl'>Data:</span> "+escape(dataStr)+"</div>"+
                destinatario.toString()+
                "<div class='row'><span class='lbl'>Descrição:</span> "+descricao+"</div>"+
                "</div>"+
                "<div class='paragraph'>"+linhaReconhecimento+"</div>"+
                "<div class='sign'>"+
                "<div class='line'></div>"+
                "<div>"+escape(assinaturaNome)+"</div>"+
                "<div class='muted'>"+escape(assinaturaTitulo)+" – "+escape(assinaturaCPF)+"</div>"+
                "</div>"+
                "<div class='foot'>Documento gerado automaticamente em "+fmt.format(java.time.ZonedDateTime.now(zoneBR))+".</div>"+
                "</body></html>";
    }

    private String resolveLogoDataUri() {
        try {
            java.io.InputStream in = getClass().getResourceAsStream("/logo.png");
            if (in == null) in = getClass().getResourceAsStream("/static/logo.png");
            if (in == null) return null;
            byte[] bytes = in.readAllBytes();
            String b64 = java.util.Base64.getEncoder().encodeToString(bytes);
            return "data:image/png;base64," + b64;
        } catch (Exception e) {
            return null;
        }
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    // Upload de recibo assinado descontinuado (assinatura digital interna no recibo)

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL','COLABORADOR','VISUALIZADOR')")
    @GetMapping
    @Transactional(readOnly = true)
    public Page<TransacaoResumoDTO> list(@RequestParam(required = false) TipoTransacao tipo,
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
        Page<TransacaoFinanceira> page = repository.findAll(spec, pageable);
        return page.map(t -> {
            TransacaoResumoDTO dto = new TransacaoResumoDTO();
            dto.setId(t.getId());
            dto.setTipo(t.getTipo());
            dto.setValor(t.getValor());
            dto.setFormaPagamento(t.getFormaPagamento());
            dto.setNumeroRecibo(t.getNumeroRecibo());
            dto.setDataHora(t.getDataHora());
            dto.setAcolhidaNome(t.getAcolhida() != null ? t.getAcolhida().getNomeCompleto() : null);
            dto.setOrigemNome(t.getOrigemNome());
            return dto;
        });
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

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    @com.fazendaesperanca.fazendaesperanca.audit.AuditableAction(value = com.fazendaesperanca.fazendaesperanca.domain.enums.AuditAction.DELETE, entity = "TransacaoFinanceira", idParam = "id")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
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

    @Data
    public static class TransacaoResumoDTO {
        private Long id;
        private TipoTransacao tipo;
        private java.math.BigDecimal valor;
        private FormaPagamento formaPagamento;
        private String numeroRecibo;
        private OffsetDateTime dataHora;
        private String origemNome;
        private String acolhidaNome;
    }
}


