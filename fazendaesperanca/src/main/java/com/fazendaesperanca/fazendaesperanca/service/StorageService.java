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
        Path dir = resolveBaseDir().resolve(assinaturasDir).resolve(String.valueOf(transacaoId));
        return save(file, dir);
    }

    public Path saveAnexo(Long transacaoId, MultipartFile file) throws IOException {
        Path dir = resolveBaseDir().resolve(anexosDir).resolve(String.valueOf(transacaoId));
        return save(file, dir);
    }

    public byte[] loadAsBytes(Path path) throws IOException {
        return Files.readAllBytes(path);
    }

    private Path save(MultipartFile file, Path dir) throws IOException {
        Files.createDirectories(dir);
        String original = file.getOriginalFilename();
        if (original == null || original.isBlank()) original = "upload.bin";
        String safeName = UUID.randomUUID() + "-" + original.replace('\\', '_').replace('/', '_');
        Path dest = dir.resolve(safeName).normalize();
        file.transferTo(dest.toFile());
        return dest;
    }

    private Path resolveBaseDir() {
        Path p = Paths.get(basePath);
        if (!p.isAbsolute()) {
            String userDir = System.getProperty("user.dir");
            if (userDir != null && !userDir.isBlank()) {
                p = Paths.get(userDir).resolve(p).normalize();
            } else {
                p = p.toAbsolutePath().normalize();
            }
        }
        return p;
    }
}


