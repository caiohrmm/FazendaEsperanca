package com.fazendaesperanca.fazendaesperanca.repository;

import com.fazendaesperanca.fazendaesperanca.domain.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AttachmentRepository extends JpaRepository<Attachment, Long>, JpaSpecificationExecutor<Attachment> {}


