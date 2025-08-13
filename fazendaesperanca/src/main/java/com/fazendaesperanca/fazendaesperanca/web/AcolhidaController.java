package com.fazendaesperanca.fazendaesperanca.web;

import com.fazendaesperanca.fazendaesperanca.domain.Acolhida;
import com.fazendaesperanca.fazendaesperanca.domain.enums.StatusAcolhida;
import com.fazendaesperanca.fazendaesperanca.repository.AcolhidaRepository;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/acolhidas")
@RequiredArgsConstructor
public class AcolhidaController {

    private final AcolhidaRepository repository;

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL','COLABORADOR')")
    @PostMapping
    @com.fazendaesperanca.fazendaesperanca.audit.AuditableAction(value = com.fazendaesperanca.fazendaesperanca.domain.enums.AuditAction.CREATE, entity = "Acolhida")
    public Acolhida create(@Valid @RequestBody AcolhidaRequest req) {
        Acolhida a = new Acolhida();
        a.setNomeCompleto(req.getNomeCompleto());
        a.setDataNascimento(req.getDataNascimento());
        a.setDataEntrada(req.getDataEntrada());
        a.setDocumento(req.getDocumento());
        a.setTelefone(req.getTelefone());
        a.setStatus(req.getStatus());
        a.setFotoUrl(req.getFotoUrl());
        a.setObservacoes(req.getObservacoes());
        return repository.save(a);
    }

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL','COLABORADOR','VISUALIZADOR')")
    @GetMapping
    public Page<Acolhida> list(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) StatusAcolhida status,
            @RequestParam(required = false, name = "dataEntradaDe") LocalDate dataEntradaDe,
            @RequestParam(required = false, name = "dataEntradaAte") LocalDate dataEntradaAte,
            Pageable pageable
    ) {
        Specification<Acolhida> spec = (root, q, cb) -> cb.conjunction();
        if (nome != null && !nome.isBlank()) {
            spec = spec.and((root, q, cb) -> cb.like(cb.lower(root.get("nomeCompleto")), "%" + nome.toLowerCase() + "%"));
        }
        if (status != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
        }
        if (dataEntradaDe != null) {
            spec = spec.and((root, q, cb) -> cb.greaterThanOrEqualTo(root.get("dataEntrada"), dataEntradaDe));
        }
        if (dataEntradaAte != null) {
            spec = spec.and((root, q, cb) -> cb.lessThanOrEqualTo(root.get("dataEntrada"), dataEntradaAte));
        }
        return repository.findAll(spec, pageable);
    }

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL','COLABORADOR','VISUALIZADOR')")
    @GetMapping("/{id}")
    public Acolhida get(@PathVariable Long id) { return repository.findById(id).orElseThrow(); }

    @PreAuthorize("hasAnyRole('ADMIN','RESPONSAVEL','COLABORADOR')")
    @PutMapping("/{id}")
    @com.fazendaesperanca.fazendaesperanca.audit.AuditableAction(value = com.fazendaesperanca.fazendaesperanca.domain.enums.AuditAction.UPDATE, entity = "Acolhida", idParam = "id")
    public Acolhida update(@PathVariable Long id, @Valid @RequestBody AcolhidaRequest req) {
        Acolhida a = repository.findById(id).orElseThrow();
        a.setNomeCompleto(req.getNomeCompleto());
        a.setDataNascimento(req.getDataNascimento());
        a.setDataEntrada(req.getDataEntrada());
        a.setDocumento(req.getDocumento());
        a.setTelefone(req.getTelefone());
        a.setStatus(req.getStatus());
        a.setFotoUrl(req.getFotoUrl());
        a.setObservacoes(req.getObservacoes());
        return repository.save(a);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    @com.fazendaesperanca.fazendaesperanca.audit.AuditableAction(value = com.fazendaesperanca.fazendaesperanca.domain.enums.AuditAction.DELETE, entity = "Acolhida", idParam = "id")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class AcolhidaRequest {
        @jakarta.validation.constraints.NotBlank
        private String nomeCompleto;
        private LocalDate dataNascimento;
        private LocalDate dataEntrada;
        private String documento;
        private String telefone;
        private StatusAcolhida status;
        private String fotoUrl;
        private String observacoes;
    }
}


