package com.fazendaesperanca.fazendaesperanca.service;

import com.opencsv.CSVWriter;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.ss.util.CellRangeAddress;
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
            // Ajuste de tamanho das colunas para melhor impressão
            if (!rows.isEmpty()) {
                for (int c = 0; c < rows.get(0).length; c++) sheet.autoSizeColumn(c);
            }
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar Excel", e);
        }
    }

    public byte[] toExcelStyled(List<String[]> rows, String sheetName, String title, String subtitle) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(sheetName);
            int numCols = rows.isEmpty() ? 1 : rows.get(0).length;

            // Estilos
            Font titleFont = workbook.createFont(); titleFont.setBold(true); titleFont.setFontHeightInPoints((short)14);
            CellStyle titleStyle = workbook.createCellStyle(); titleStyle.setAlignment(HorizontalAlignment.CENTER); titleStyle.setFont(titleFont);

            Font subtitleFont = workbook.createFont(); subtitleFont.setBold(false); subtitleFont.setFontHeightInPoints((short)10);
            CellStyle subtitleStyle = workbook.createCellStyle(); subtitleStyle.setAlignment(HorizontalAlignment.CENTER); subtitleStyle.setFont(subtitleFont);

            Font headerFont = workbook.createFont(); headerFont.setBold(true);
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);
            headerStyle.setFont(headerFont);

            CellStyle bodyStyle = workbook.createCellStyle();
            bodyStyle.setBorderBottom(BorderStyle.HAIR);
            bodyStyle.setBorderTop(BorderStyle.HAIR);
            bodyStyle.setBorderLeft(BorderStyle.HAIR);
            bodyStyle.setBorderRight(BorderStyle.HAIR);

            int r = 0;
            // Título
            Row titleRow = sheet.createRow(r++);
            titleRow.createCell(0).setCellValue(title);
            sheet.addMergedRegion(new CellRangeAddress(0,0,0,Math.max(0, numCols-1)));
            titleRow.getCell(0).setCellStyle(titleStyle);
            // Subtítulo
            Row subRow = sheet.createRow(r++);
            subRow.createCell(0).setCellValue(subtitle);
            sheet.addMergedRegion(new CellRangeAddress(1,1,0,Math.max(0, numCols-1)));
            subRow.getCell(0).setCellStyle(subtitleStyle);

            if (!rows.isEmpty()) {
                // Cabeçalho
                Row header = sheet.createRow(r++);
                for (int c = 0; c < rows.get(0).length; c++) {
                    Cell cell = header.createCell(c);
                    cell.setCellValue(rows.get(0)[c]);
                    cell.setCellStyle(headerStyle);
                }
                // Corpo
                for (int i = 1; i < rows.size(); i++) {
                    Row row = sheet.createRow(r++);
                    String[] rowData = rows.get(i);
                    for (int c = 0; c < rowData.length; c++) {
                        Cell cell = row.createCell(c);
                        cell.setCellValue(rowData[c] == null ? "" : rowData[c]);
                        cell.setCellStyle(bodyStyle);
                    }
                }
                // Ajuste de colunas
                for (int c = 0; c < rows.get(0).length; c++) sheet.autoSizeColumn(c);
                // Congelar cabeçalho
                sheet.createFreezePane(0, 3);
                // Ajuste de impressão
                sheet.getPrintSetup().setFitWidth((short)1);
                sheet.setFitToPage(true);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar Excel", e);
        }
    }
}


