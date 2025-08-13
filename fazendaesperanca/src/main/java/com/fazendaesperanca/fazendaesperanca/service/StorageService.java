package com.fazendaesperanca.fazendaesperanca.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class StorageService {

    @Value("${app.storage.base-path:./storage}")
    private String basePath;

    @Value("${app.storage.assinaturas-dir:assinaturas}")
    private String assinaturasDir;

    @Value("${app.storage.anexos-dir:anexos}")
    private String anexosDir;

    public Path saveAssinatura(Long transacaoId, MultipartFile file) throws IOException {
        return save(file, Paths.get(basePath, assinaturasDir, String.valueOf(transacaoId)));
    }

    public Path saveAnexo(Long transacaoId, MultipartFile file) throws IOException {
        return save(file, Paths.get(basePath, anexosDir, String.valueOf(transacaoId)));
    }

    public byte[] loadAsBytes(Path path) throws IOException {
        return Files.readAllBytes(path);
    }

    private Path save(MultipartFile file, Path dir) throws IOException {
        Files.createDirectories(dir);
        String safeName = UUID.randomUUID() + "-" + file.getOriginalFilename();
        Path dest = dir.resolve(safeName);
        file.transferTo(dest.toFile());
        return dest;
    }
}


