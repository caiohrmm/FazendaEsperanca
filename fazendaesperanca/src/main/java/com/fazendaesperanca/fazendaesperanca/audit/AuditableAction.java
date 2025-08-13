package com.fazendaesperanca.fazendaesperanca.audit;

import com.fazendaesperanca.fazendaesperanca.domain.enums.AuditAction;

import java.lang.annotation.*;

@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface AuditableAction {
    AuditAction value();
    String entity();
    String idParam() default "id";
}


