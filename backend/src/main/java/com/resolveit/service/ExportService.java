package com.resolveit.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.opencsv.CSVWriter;
import com.resolveit.dto.ComplaintExportData;
import com.resolveit.dto.DashboardStatsResponse;
import com.resolveit.dto.ReportFilterRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.StringWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Service for exporting reports in various formats
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExportService {
    
    private final ReportService reportService;
    
    /**
     * Export complaints data as CSV
     */
    public String exportToCSV(ReportFilterRequest filter) {
        log.info("Exporting complaints to CSV for period: {} to {}", filter.getStartDate(), filter.getEndDate());
        
        try {
            List<ComplaintExportData> exportData = reportService.getExportData(filter);
            
            StringWriter stringWriter = new StringWriter();
            try (CSVWriter csvWriter = new CSVWriter(stringWriter)) {
                
                // Write header
                csvWriter.writeNext(ComplaintExportData.getCSVHeaders());
                
                // Write data
                for (ComplaintExportData data : exportData) {
                    csvWriter.writeNext(data.toCSVArray());
                }
                
                csvWriter.flush();
            }
            
            return stringWriter.toString();
            
        } catch (Exception e) {
            log.error("Error exporting to CSV", e);
            throw new RuntimeException("Failed to export data to CSV: " + e.getMessage());
        }
    }
    
    /**
     * Export complaints data and dashboard stats as PDF
     */
    public byte[] exportToPDF(ReportFilterRequest filter) {
        log.info("Exporting complaints to PDF for period: {} to {}", filter.getStartDate(), filter.getEndDate());
        
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfDocument pdfDoc = new PdfDocument(new PdfWriter(baos));
            Document document = new Document(pdfDoc);
            
            // Title
            Paragraph title = new Paragraph("Complaints Report")
                    .setFontSize(20)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20);
            document.add(title);
            
            // Report period
            Paragraph period = new Paragraph(String.format("Report Period: %s to %s", 
                    filter.getStartDate(), filter.getEndDate()))
                    .setFontSize(12)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20);
            document.add(period);
            
            // Generated timestamp
            Paragraph timestamp = new Paragraph("Generated on: " + 
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss")))
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setMarginBottom(20);
            document.add(timestamp);
            
            // Dashboard Stats
            addDashboardStatsSection(document, filter);
            
            // Complaints Table
            addComplaintsTableSection(document, filter);
            
            document.close();
            return baos.toByteArray();
            
        } catch (Exception e) {
            log.error("Error exporting to PDF", e);
            throw new RuntimeException("Failed to export data to PDF: " + e.getMessage());
        }
    }
    
    private void addDashboardStatsSection(Document document, ReportFilterRequest filter) {
        DashboardStatsResponse stats = reportService.generateDashboardStats(filter);
        
        // Stats section title
        Paragraph statsTitle = new Paragraph("Summary Statistics")
                .setFontSize(16)
                .setBold()
                .setMarginBottom(10);
        document.add(statsTitle);
        
        // Create stats table
        Table statsTable = new Table(UnitValue.createPercentArray(new float[]{3, 1}))
                .useAllAvailableWidth()
                .setMarginBottom(20);
        
        // Add stats rows
        addStatsRow(statsTable, "Total Complaints", stats.getTotalComplaints().toString());
        addStatsRow(statsTable, "Pending Complaints", stats.getPendingComplaints().toString());
        addStatsRow(statsTable, "Resolved Complaints", stats.getResolvedComplaints().toString());
        addStatsRow(statsTable, "Escalated Complaints", stats.getEscalatedComplaints().toString());
        addStatsRow(statsTable, "Resolution Rate", String.format("%.1f%%", stats.getResolutionRate()));
        addStatsRow(statsTable, "Average Resolution Days", String.format("%.1f days", stats.getAverageResolutionDays()));
        
        document.add(statsTable);
        
        // Category breakdown
        if (!stats.getComplaintsByCategory().isEmpty()) {
            Paragraph categoryTitle = new Paragraph("Complaints by Category")
                    .setFontSize(14)
                    .setBold()
                    .setMarginBottom(10)
                    .setMarginTop(20);
            document.add(categoryTitle);
            
            Table categoryTable = new Table(UnitValue.createPercentArray(new float[]{2, 1, 1, 1}))
                    .useAllAvailableWidth()
                    .setMarginBottom(20);
            
            // Category table headers
            categoryTable.addHeaderCell(createHeaderCell("Category"));
            categoryTable.addHeaderCell(createHeaderCell("Total"));
            categoryTable.addHeaderCell(createHeaderCell("Resolved"));
            categoryTable.addHeaderCell(createHeaderCell("Rate"));
            
            // Category data
            for (DashboardStatsResponse.CategoryStatsPoint category : stats.getComplaintsByCategory()) {
                categoryTable.addCell(category.getCategory());
                categoryTable.addCell(category.getCount().toString());
                categoryTable.addCell(category.getResolved().toString());
                categoryTable.addCell(String.format("%.1f%%", category.getResolutionRate()));
            }
            
            document.add(categoryTable);
        }
    }
    
    private void addComplaintsTableSection(Document document, ReportFilterRequest filter) {
        List<ComplaintExportData> complaints = reportService.getExportData(filter);
        
        if (complaints.isEmpty()) {
            Paragraph noData = new Paragraph("No complaints found for the selected criteria.")
                    .setFontSize(12)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(20);
            document.add(noData);
            return;
        }
        
        // Complaints section title
        Paragraph complaintsTitle = new Paragraph("Detailed Complaints List")
                .setFontSize(16)
                .setBold()
                .setMarginTop(20)
                .setMarginBottom(10);
        document.add(complaintsTitle);
        
        // Create complaints table with essential columns
        Table complaintsTable = new Table(UnitValue.createPercentArray(new float[]{1, 2, 3, 1, 1, 2, 1}))
                .useAllAvailableWidth()
                .setMarginBottom(20);
        
        // Headers
        complaintsTable.addHeaderCell(createHeaderCell("ID"));
        complaintsTable.addHeaderCell(createHeaderCell("Category"));
        complaintsTable.addHeaderCell(createHeaderCell("Description"));
        complaintsTable.addHeaderCell(createHeaderCell("Urgency"));
        complaintsTable.addHeaderCell(createHeaderCell("Status"));
        complaintsTable.addHeaderCell(createHeaderCell("Submitted By"));
        complaintsTable.addHeaderCell(createHeaderCell("Created"));
        
        // Data rows (limit to prevent huge PDFs)
        int maxRows = Math.min(complaints.size(), 100);
        for (int i = 0; i < maxRows; i++) {
            ComplaintExportData complaint = complaints.get(i);
            
            complaintsTable.addCell(complaint.getId().toString());
            complaintsTable.addCell(complaint.getCategory());
            
            // Truncate long descriptions
            String description = complaint.getDescription();
            if (description.length() > 50) {
                description = description.substring(0, 47) + "...";
            }
            complaintsTable.addCell(description);
            
            complaintsTable.addCell(complaint.getUrgency());
            complaintsTable.addCell(complaint.getStatus());
            complaintsTable.addCell(complaint.getSubmittedBy() != null ? complaint.getSubmittedBy() : "Anonymous");
            complaintsTable.addCell(complaint.getCreatedAt().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")));
        }
        
        document.add(complaintsTable);
        
        // Add note if truncated
        if (complaints.size() > 100) {
            Paragraph note = new Paragraph(String.format("Note: Showing first 100 of %d complaints. Use CSV export for complete data.", 
                    complaints.size()))
                    .setFontSize(10)
                    .setItalic()
                    .setMarginTop(10);
            document.add(note);
        }
    }
    
    private void addStatsRow(Table table, String label, String value) {
        table.addCell(new Cell().add(new Paragraph(label).setBold()));
        table.addCell(new Cell().add(new Paragraph(value)));
    }
    
    private Cell createHeaderCell(String text) {
        return new Cell().add(new Paragraph(text).setBold())
                .setBackgroundColor(ColorConstants.LIGHT_GRAY)
                .setTextAlignment(TextAlignment.CENTER);
    }
}