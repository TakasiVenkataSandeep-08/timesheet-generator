const OutputFormatter = require('./base/OutputFormatter');
const PDFDocument = require('pdfkit');
const { formatDate, formatTime } = require('../utils/dateUtils');

/**
 * PDF Formatter - generates professional PDF reports
 */
class PDFFormatter extends OutputFormatter {
  async format(timesheet) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 50,
          size: 'LETTER',
        });

        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title page
        this._addTitlePage(doc, timesheet);

        // Summary page
        this._addSummaryPage(doc, timesheet);

        // Sessions detail
        this._addSessionsPage(doc, timesheet);

        // Project breakdown (if available)
        if (timesheet.byProject) {
          this._addProjectBreakdown(doc, timesheet);
        }

        // Ticket breakdown (if available)
        if (timesheet.byTicket) {
          this._addTicketBreakdown(doc, timesheet);
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  _addTitlePage(doc, timesheet) {
    // Header
    doc.fontSize(24)
      .text('Timesheet Report', { align: 'center' })
      .moveDown();

    doc.fontSize(16)
      .text(`Period: ${timesheet.period.start} to ${timesheet.period.end}`, {
        align: 'center',
      })
      .moveDown();

    // Repository information
    if (timesheet.repositories && timesheet.repositories.repository) {
      doc.fontSize(14)
        .text(`Repository: ${timesheet.repositories.repository}`, {
          align: 'center',
        });
      if (timesheet.repositories.repoType) {
        doc.fontSize(12)
          .text(`Type: ${timesheet.repositories.repoType}`, {
            align: 'center',
          });
      }
    } else if (timesheet.repositories && timesheet.repositories.repositories && timesheet.repositories.repositories.length > 0) {
      doc.fontSize(14)
        .text(`Repositories: ${timesheet.repositories.repositories.join(", ")}`, {
          align: 'center',
        });
    }

    doc.moveDown(2);

    // Summary box
    const summaryY = doc.y;
    doc.rect(50, summaryY, 500, 150)
      .stroke();

    doc.fontSize(14)
      .text('Summary', 70, summaryY + 20, { bold: true })
      .fontSize(12)
      .text(`Total Hours: ${timesheet.totalHours.toFixed(2)}h`, 70, summaryY + 50)
      .text(`Total Sessions: ${timesheet.totalSessions}`, 70, summaryY + 70)
      .text(`Total Commits: ${timesheet.totalCommits}`, 70, summaryY + 90);

    doc.moveDown(3);
  }

  _addSummaryPage(doc, timesheet) {
    doc.addPage();

    doc.fontSize(18)
      .text('Summary', { underline: true })
      .moveDown();

    // Time distribution chart (simple bar representation)
    doc.fontSize(14)
      .text('Time Distribution by Date', { bold: true })
      .moveDown(0.5);

    if (timesheet.byDate) {
      const dates = Object.keys(timesheet.byDate).sort();
      let y = doc.y;
      const maxHours = Math.max(
        ...dates.map((date) =>
          timesheet.byDate[date].reduce((sum, s) => sum + s.duration, 0)
        )
      );

      dates.forEach((date) => {
        const sessions = timesheet.byDate[date];
        const totalHours = sessions.reduce((sum, s) => sum + s.duration, 0);
        const barWidth = (totalHours / maxHours) * 300;

        doc.fontSize(10)
          .text(date, 70, y)
          .text(`${totalHours.toFixed(2)}h`, 150, y);

        // Simple bar chart
        doc.rect(250, y + 2, barWidth, 12).fill('#4A90E2');

        y += 20;

        if (y > 700) {
          doc.addPage();
          y = 50;
        }
      });
    }

    doc.moveDown();
  }

  _addSessionsPage(doc, timesheet) {
    doc.addPage();

    doc.fontSize(18)
      .text('Work Sessions', { underline: true })
      .moveDown();

    let y = doc.y;
    timesheet.sessions.forEach((session, index) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.fontSize(12)
        .text(`Session ${session.id}: ${formatDate(session.startTime)}`, {
          bold: true,
        })
        .fontSize(10)
        .text(
          `Time: ${formatTime(session.startTime)} - ${formatTime(session.endTime)}`,
          70,
          y + 20
        )
        .text(`Duration: ${session.duration.toFixed(2)}h`, 70, y + 35)
        .text(`Commits: ${session.commits}`, 70, y + 50)
        .text(`Confidence: ${(session.confidence * 100).toFixed(0)}%`, 70, y + 65)
        .text(`Summary: ${session.summary || 'No summary'}`, 70, y + 80, {
          width: 450,
        });

      y += 130;
    });
  }

  _addProjectBreakdown(doc, timesheet) {
    if (!timesheet.byProject) return;

    doc.addPage();

    doc.fontSize(18)
      .text('Project Breakdown', { underline: true })
      .moveDown();

    const projects = Object.keys(timesheet.byProject);
    let y = doc.y;

    projects.forEach((project) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      const hours = timesheet.hoursByProject
        ? timesheet.hoursByProject[project] || 0
        : 0;

      doc.fontSize(12)
        .text(project, { bold: true })
        .fontSize(10)
        .text(`Hours: ${hours.toFixed(2)}h`, 70, y + 20)
        .text(
          `Commits: ${timesheet.byProject[project].length}`,
          70,
          y + 35
        );

      y += 60;
    });
  }

  _addTicketBreakdown(doc, timesheet) {
    if (!timesheet.byTicket) return;

    doc.addPage();

    doc.fontSize(18)
      .text('Ticket Breakdown', { underline: true })
      .moveDown();

    const tickets = Object.keys(timesheet.byTicket);
    let y = doc.y;

    tickets.forEach((ticket) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.fontSize(12)
        .text(ticket, { bold: true })
        .fontSize(10)
        .text(
          `Commits: ${timesheet.byTicket[ticket].length}`,
          70,
          y + 20
        );

      y += 40;
    });
  }
}

module.exports = PDFFormatter;

