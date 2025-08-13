package com.fazendaesperanca.fazendaesperanca.config;

import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.UUID;

@Component
public class LoggingConfig implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        try {
            String traceId = UUID.randomUUID().toString();
            MDC.put("traceId", traceId);
            if (request instanceof HttpServletRequest req) {
                MDC.put("path", req.getRequestURI());
                MDC.put("method", req.getMethod());
            }
            chain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }
}


