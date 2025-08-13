package com.fazendaesperanca.fazendaesperanca.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

import java.time.ZoneId;
import java.util.Locale;
import java.util.TimeZone;

@Configuration
public class LocaleTimezoneConfig {

    @PostConstruct
    public void init() {
        Locale.setDefault(new Locale("pt", "BR"));
        TimeZone.setDefault(TimeZone.getTimeZone(ZoneId.of("America/Sao_Paulo")));
    }
}


