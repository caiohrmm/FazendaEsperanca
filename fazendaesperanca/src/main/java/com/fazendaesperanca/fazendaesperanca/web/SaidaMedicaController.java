package com.fazendaesperanca.fazendaesperanca.web;

import com.fazendaesperanca.fazendaesperanca.domain.Acolhida;
import com.fazendaesperanca.fazendaesperanca.domain.SaidaMedica;
import com.fazendaesperanca.fazendaesperanca.domain.enums.MotivoSaidaMedica;
import com.fazendaesperanca.fazendaesperanca.repository.AcolhidaRepository;
import com.fazendaesperanca.fazendaesperanca.repository.SaidaMedicaRepository;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.OffsetDateTime;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/saidas-medicas")
@RequiredArgsConstructor
public class SaidaMedicaController {

    private final SaidaMedicaRepository repository;
    private final AcolhidaRepository acolhidaRepository;

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL','COLABORADOR')")
    @PostMapping
    @com.fazendaesperanca.fazendaesperanca.audit.AuditableAction(value = com.fazendaesperanca.fazendaesperanca.domain.enums.AuditAction.CREATE, entity = "SaidaMedica")
    public SaidaMedicaDTO create(@Valid @RequestBody CriarSaidaRequest req, @AuthenticationPrincipal UserDetails user) {
        Acolhida acolhida = acolhidaRepository.findById(req.getAcolhidaId()).orElseThrow();
        SaidaMedica s = new SaidaMedica();
        s.setAcolhida(acolhida);
        s.setMotivo(req.getMotivo());
        s.setDestino(req.getDestino());
        s.setProfissional(req.getProfissional());
        s.setDataHoraSaida(req.getDataHoraSaida());
        s.setMeioTransporte(req.getMeioTransporte());
        s.setResponsavel(req.getResponsavel());
        s.setObservacoes(req.getObservacoes());
        if (req.getDataHoraRetorno() != null) {
            if (req.getDataHoraRetorno().isBefore(req.getDataHoraSaida())) {
                throw new IllegalArgumentException("Retorno deve ser após saída");
            }
            s.setDataHoraRetorno(req.getDataHoraRetorno());
        }
        SaidaMedica saved = repository.save(s);
        return toDto(saved);
    }

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL','COLABORADOR','VISUALIZADOR')")
    @Transactional(readOnly = true)
    @GetMapping
    public Page<SaidaMedicaDTO> list(@RequestParam(required = false) Long acolhidaId,
                                     @RequestParam(required = false) OffsetDateTime de,
                                     @RequestParam(required = false) OffsetDateTime ate,
                                     @RequestParam(required = false) MotivoSaidaMedica motivo,
                                     Pageable pageable) {
        Specification<SaidaMedica> spec = (root, q, cb) -> cb.conjunction();
        if (acolhidaId != null) spec = spec.and((root, q, cb) -> cb.equal(root.get("acolhida").get("id"), acolhidaId));
        if (de != null) spec = spec.and((root, q, cb) -> cb.greaterThanOrEqualTo(root.get("dataHoraSaida"), de));
        if (ate != null) spec = spec.and((root, q, cb) -> cb.lessThanOrEqualTo(root.get("dataHoraSaida"), ate));
        if (motivo != null) spec = spec.and((root, q, cb) -> cb.equal(root.get("motivo"), motivo));
        return repository.findAll(spec, pageable).map(SaidaMedicaController::toDto);
    }

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL','COLABORADOR','VISUALIZADOR')")
    @Transactional(readOnly = true)
    @GetMapping("/{id}")
    public SaidaMedicaDTO get(@PathVariable Long id) { return toDto(repository.findById(id).orElseThrow()); }

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL','COLABORADOR')")
    @PutMapping("/{id}")
    @com.fazendaesperanca.fazendaesperanca.audit.AuditableAction(value = com.fazendaesperanca.fazendaesperanca.domain.enums.AuditAction.UPDATE, entity = "SaidaMedica", idParam = "id")
    public SaidaMedicaDTO update(@PathVariable Long id, @Valid @RequestBody EditarSaidaRequest req) {
        SaidaMedica s = repository.findById(id).orElseThrow();
        if (s.getDataHoraRetorno() != null) throw new IllegalArgumentException("Não é permitido editar após retorno");
        s.setMotivo(req.getMotivo());
        s.setDestino(req.getDestino());
        s.setProfissional(req.getProfissional());
        s.setMeioTransporte(req.getMeioTransporte());
        return toDto(repository.save(s));
    }

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL','COLABORADOR')")
    @PutMapping("/{id}/retorno")
    @com.fazendaesperanca.fazendaesperanca.audit.AuditableAction(value = com.fazendaesperanca.fazendaesperanca.domain.enums.AuditAction.UPDATE, entity = "SaidaMedica", idParam = "id")
    public SaidaMedicaDTO registrarRetorno(@PathVariable Long id, @RequestBody RegistrarRetornoRequest req) {
        SaidaMedica s = repository.findById(id).orElseThrow();
        if (s.getDataHoraRetorno() != null) throw new IllegalArgumentException("Retorno já registrado");
        if (req.getDataHoraRetorno().isBefore(s.getDataHoraSaida())) throw new IllegalArgumentException("Retorno deve ser após saída");
        s.setDataHoraRetorno(req.getDataHoraRetorno());
        return toDto(repository.save(s));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    @com.fazendaesperanca.fazendaesperanca.audit.AuditableAction(value = com.fazendaesperanca.fazendaesperanca.domain.enums.AuditAction.DELETE, entity = "SaidaMedica", idParam = "id")
    public ResponseEntity<?> delete(@PathVariable Long id) { repository.deleteById(id); return ResponseEntity.noContent().build(); }

    private static SaidaMedicaDTO toDto(SaidaMedica s) {
        Long duracaoMinutos = null;
        if (s.getDataHoraRetorno() != null) {
            duracaoMinutos = Duration.between(s.getDataHoraSaida(), s.getDataHoraRetorno()).toMinutes();
        }
        SaidaMedicaDTO dto = new SaidaMedicaDTO();
        dto.setId(s.getId());
        dto.setAcolhidaId(s.getAcolhida().getId());
        dto.setAcolhidaNome(s.getAcolhida().getNomeCompleto());
        dto.setMotivo(s.getMotivo());
        dto.setDestino(s.getDestino());
        dto.setProfissional(s.getProfissional());
        dto.setDataHoraSaida(s.getDataHoraSaida());
        dto.setDataHoraRetorno(s.getDataHoraRetorno());
        dto.setMeioTransporte(s.getMeioTransporte());
        dto.setObservacoes(s.getObservacoes());
        dto.setResponsavel(s.getResponsavel());
        dto.setDuracaoMinutos(duracaoMinutos);
        return dto;
    }

    @Data
    public static class CriarSaidaRequest {
        private Long acolhidaId;
        private MotivoSaidaMedica motivo;
        private String destino;
        private String profissional;
        private OffsetDateTime dataHoraSaida;
        private String meioTransporte;
        private String observacoes;
        private com.fazendaesperanca.fazendaesperanca.domain.enums.ResponsavelSaidaMedica responsavel;
        private OffsetDateTime dataHoraRetorno;
    }

    @Data
    public static class EditarSaidaRequest {
        private MotivoSaidaMedica motivo;
        private String destino;
        private String profissional;
        private String meioTransporte;
    }

    @Data
    public static class RegistrarRetornoRequest {
        private OffsetDateTime dataHoraRetorno;
    }

    @Data
    public static class SaidaMedicaDTO {
        private Long id;
        private Long acolhidaId;
        private String acolhidaNome;
        private MotivoSaidaMedica motivo;
        private String destino;
        private String profissional;
        private OffsetDateTime dataHoraSaida;
        private OffsetDateTime dataHoraRetorno;
        private String meioTransporte;
        private String observacoes;
        private com.fazendaesperanca.fazendaesperanca.domain.enums.ResponsavelSaidaMedica responsavel;
        private Long duracaoMinutos;
    }
}


