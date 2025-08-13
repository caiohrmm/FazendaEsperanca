package com.fazendaesperanca.fazendaesperanca.service;

import com.opencsv.CSVWriter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.StringWriter;
import java.io.IOException;
import java.util.List;

@Service
public class ExportService {

    public byte[] toCsv(List<String[]> rows) {
        StringWriter sw = new StringWriter();
        try (CSVWriter writer = new CSVWriter(sw)) {
            for (String[] row : rows) {
                writer.writeNext(row);
            }
        } catch (IOException e) {
            throw new RuntimeException("Erro ao gerar CSV", e);
        }
        return sw.toString().getBytes();
    }

    public byte[] toExcel(List<String[]> rows, String sheetName) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(sheetName);
            int r = 0;
            for (String[] rowData : rows) {
                Row row = sheet.createRow(r++);
                for (int c = 0; c < rowData.length; c++) {
                    row.createCell(c).setCellValue(rowData[c]);
                }
            }
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar Excel", e);
        }
    }
}


