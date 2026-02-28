import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Message {
    message_id: string;
    sender: 'user' | 'ai';
    message_text: string;
    references?: any[];
}

interface ExportOptions {
    includeCitations: boolean;
    fontSize: 'small' | 'medium' | 'large';
}

// Token types for our simple Markdown parser
type TokenType = 'text' | 'bold' | 'italic' | 'code' | 'h1' | 'h2' | 'h3' | 'list-item' | 'hr' | 'code-block';

interface Token {
    type: TokenType;
    content: string;
    style?: any;
}

export const exportToPDF = (messages: Message[], sessionName: string, options: ExportOptions) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 25;
    const maxLineWidth = pageWidth - (margin * 2);

    // Colors
    const COLOR_TITLE = [33, 37, 41];
    const COLOR_TEXT = [55, 65, 81];
    const COLOR_USER_LABEL = [37, 99, 235];
    const COLOR_AI_LABEL = [0, 0, 0];
    const COLOR_CITATION = [107, 114, 128];
    const COLOR_CODE_BG = [243, 244, 246];

    // Helper: Add Header
    const addHeader = (pageNo: number) => {
        if (pageNo === 1) {
            doc.setFontSize(24);
            doc.setTextColor(COLOR_TITLE[0], COLOR_TITLE[1], COLOR_TITLE[2]);
            doc.setFont('helvetica', 'bold');
            doc.text(sessionName || 'Chat Session', margin, 30);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(COLOR_CITATION[0], COLOR_CITATION[1], COLOR_CITATION[2]);
            doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, 40);
            return 55;
        } else {
            doc.setFontSize(9);
            doc.setTextColor(COLOR_CITATION[0], COLOR_CITATION[1], COLOR_CITATION[2]);
            doc.text(sessionName, margin, 15);
            doc.text(`Page ${pageNo}`, pageWidth - margin, 15, { align: 'right' });
            return 25;
        }
    };

    // Helper: Add Footer
    const addFooter = (pageNo: number) => {
        doc.setFontSize(8);
        doc.setTextColor(COLOR_CITATION[0], COLOR_CITATION[1], COLOR_CITATION[2]);
        doc.text(`Chat With PDF Report`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        if (pageNo === 1) {
            doc.text(`Page ${pageNo}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        }
    };

    let pageNo = 1;
    let y = addHeader(pageNo);
    addFooter(pageNo);

    const fontSizeMap = {
        small: 9,
        medium: 10,
        large: 12,
    };
    const baseFontSize = fontSizeMap[options.fontSize];
    const lineHeight = baseFontSize * 0.5 + 2; // Adjusted line height

    // Simple Markdown Parser
    const parseMarkdown = (text: string): Token[] => {
        const tokens: Token[] = [];
        const lines = text.split('\n');

        let inCodeBlock = false;
        let codeBlockContent = '';

        for (let line of lines) {
            // Handle Code Blocks
            if (line.trim().startsWith('```')) {
                if (inCodeBlock) {
                    tokens.push({ type: 'code-block', content: codeBlockContent });
                    codeBlockContent = '';
                    inCodeBlock = false;
                } else {
                    inCodeBlock = true;
                }
                continue;
            }

            if (inCodeBlock) {
                codeBlockContent += line + '\n';
                continue;
            }

            // Handle Headers
            if (line.startsWith('# ')) {
                tokens.push({ type: 'h1', content: line.substring(2) });
                continue;
            }
            if (line.startsWith('## ')) {
                tokens.push({ type: 'h2', content: line.substring(3) });
                continue;
            }
            if (line.startsWith('### ')) {
                tokens.push({ type: 'h3', content: line.substring(4) });
                continue;
            }

            // Handle Horizontal Rule
            if (line.trim() === '---' || line.trim() === '***') {
                tokens.push({ type: 'hr', content: '' });
                continue;
            }

            // Handle Lists
            if (line.trim().match(/^[-*] /)) {
                tokens.push({ type: 'list-item', content: line.trim().substring(2) });
                continue;
            }
            if (line.trim().match(/^\d+\. /)) {
                tokens.push({ type: 'list-item', content: line.trim().replace(/^\d+\. /, '') });
                continue;
            }

            // Regular Text (with inline styles)
            let remaining = line;
            while (remaining.length > 0) {
                const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
                const italicMatch = remaining.match(/\*(.*?)\*/);
                const codeMatch = remaining.match(/`(.*?)`/);

                let firstMatchIndex = -1;
                let matchType: 'bold' | 'italic' | 'code' | null = null;
                let matchLength = 0;
                let matchContent = '';
                let matchFull = '';

                if (boldMatch && (firstMatchIndex === -1 || boldMatch.index! < firstMatchIndex)) {
                    firstMatchIndex = boldMatch.index!;
                    matchType = 'bold';
                    matchContent = boldMatch[1];
                    matchFull = boldMatch[0];
                }
                if (italicMatch && (firstMatchIndex === -1 || italicMatch.index! < firstMatchIndex)) {
                    firstMatchIndex = italicMatch.index!;
                    matchType = 'italic';
                    matchContent = italicMatch[1];
                    matchFull = italicMatch[0];
                }
                if (codeMatch && (firstMatchIndex === -1 || codeMatch.index! < firstMatchIndex)) {
                    firstMatchIndex = codeMatch.index!;
                    matchType = 'code';
                    matchContent = codeMatch[1];
                    matchFull = codeMatch[0];
                }

                if (firstMatchIndex !== -1 && matchType) {
                    if (firstMatchIndex > 0) {
                        tokens.push({ type: 'text', content: remaining.substring(0, firstMatchIndex) });
                    }
                    tokens.push({ type: matchType, content: matchContent });
                    remaining = remaining.substring(firstMatchIndex + matchFull.length);
                } else {
                    tokens.push({ type: 'text', content: remaining });
                    remaining = '';
                }
            }
            tokens.push({ type: 'text', content: '\n' });
        }
        return tokens;
    };

    const checkPageBreak = (heightNeeded: number = 0) => {
        if (y + heightNeeded > pageHeight - 20) {
            doc.addPage();
            pageNo++;
            y = addHeader(pageNo);
            addFooter(pageNo);
            return true;
        }
        return false;
    };

    const renderTokens = (tokens: Token[], startX: number) => {
        let currentX = startX;

        tokens.forEach(token => {
            checkPageBreak();
            doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);

            switch (token.type) {
                case 'h1':
                    y += 6;
                    checkPageBreak(baseFontSize + 10);
                    doc.setFontSize(baseFontSize + 6);
                    doc.setFont('helvetica', 'bold');
                    doc.text(token.content, margin, y);
                    y += baseFontSize + 6;
                    currentX = margin;
                    break;
                case 'h2':
                    y += 5;
                    checkPageBreak(baseFontSize + 8);
                    doc.setFontSize(baseFontSize + 4);
                    doc.setFont('helvetica', 'bold');
                    doc.text(token.content, margin, y);
                    y += baseFontSize + 5;
                    currentX = margin;
                    break;
                case 'h3':
                    y += 4;
                    checkPageBreak(baseFontSize + 6);
                    doc.setFontSize(baseFontSize + 2);
                    doc.setFont('helvetica', 'bold');
                    doc.text(token.content, margin, y);
                    y += baseFontSize + 4;
                    currentX = margin;
                    break;
                case 'hr':
                    y += 4;
                    checkPageBreak(10);
                    doc.setDrawColor(200, 200, 200);
                    doc.line(margin, y, pageWidth - margin, y);
                    y += 8;
                    currentX = margin;
                    break;
                case 'code-block':
                    y += 4;
                    doc.setFontSize(baseFontSize - 1);
                    doc.setFont('courier', 'normal');
                    const codeLines = doc.splitTextToSize(token.content, maxLineWidth - 10);
                    const blockHeight = codeLines.length * (baseFontSize * 0.5 + 2) + 10;

                    checkPageBreak(blockHeight);

                    // Background for code block
                    doc.setFillColor(COLOR_CODE_BG[0], COLOR_CODE_BG[1], COLOR_CODE_BG[2]);
                    doc.rect(margin, y, maxLineWidth, blockHeight, 'F');

                    doc.text(codeLines, margin + 5, y + 7);
                    y += blockHeight + 6;
                    doc.setFont('helvetica', 'normal'); // Reset font
                    currentX = margin;
                    break;
                case 'list-item':
                    doc.setFontSize(baseFontSize);
                    doc.setFont('helvetica', 'normal');
                    const bullet = '• ';
                    const listLines = doc.splitTextToSize(bullet + token.content, maxLineWidth);
                    checkPageBreak(listLines.length * lineHeight);
                    doc.text(listLines, margin + 5, y);
                    y += listLines.length * lineHeight + 2;
                    currentX = margin;
                    break;
                case 'bold':
                case 'italic':
                case 'code':
                case 'text':
                    if (token.type === 'bold') doc.setFont('helvetica', 'bold');
                    else if (token.type === 'italic') doc.setFont('helvetica', 'italic');
                    else if (token.type === 'code') doc.setFont('courier', 'normal');
                    else doc.setFont('helvetica', 'normal');

                    doc.setFontSize(baseFontSize);

                    if (token.content === '\n') {
                        y += lineHeight + 2;
                        currentX = margin;
                        return;
                    }

                    // Word-level wrapping for ALL inline text types
                    const words = token.content.split(' ');
                    words.forEach((word, idx) => {
                        const wordWithSpace = idx === words.length - 1 ? word : word + ' ';
                        const wordWidth = doc.getTextWidth(wordWithSpace);

                        if (currentX + wordWidth > pageWidth - margin) {
                            y += lineHeight + 2;
                            currentX = margin;
                            checkPageBreak(lineHeight);
                        }

                        // Highlight inline code
                        if (token.type === 'code') {
                            doc.setFillColor(COLOR_CODE_BG[0], COLOR_CODE_BG[1], COLOR_CODE_BG[2]);
                            doc.rect(currentX, y - baseFontSize + 2, wordWidth, baseFontSize, 'F');
                        }

                        doc.text(wordWithSpace, currentX, y);
                        currentX += wordWidth;
                    });

                    // Reset font after inline code
                    if (token.type === 'code') doc.setFont('helvetica', 'normal');
                    break;
            }
        });
    };

    messages.forEach((msg) => {
        const isUser = msg.sender === 'user';

        checkPageBreak(20);

        // Sender Label
        doc.setFontSize(baseFontSize + 1);
        doc.setFont('helvetica', 'bold');
        if (isUser) {
            doc.setTextColor(COLOR_USER_LABEL[0], COLOR_USER_LABEL[1], COLOR_USER_LABEL[2]);
            doc.text('You', margin, y);
        } else {
            doc.setTextColor(COLOR_AI_LABEL[0], COLOR_AI_LABEL[1], COLOR_AI_LABEL[2]);
            doc.text('AI', margin, y);
        }
        y += 6;

        // Render Markdown Message
        const tokens = parseMarkdown(msg.message_text);
        renderTokens(tokens, margin);

        // Ensure we move down after the message
        y += 12;

        // Citations
        if (!isUser && options.includeCitations && msg.references && msg.references.length > 0) {
            y += 2;
            doc.setFontSize(baseFontSize - 1);
            doc.setTextColor(COLOR_CITATION[0], COLOR_CITATION[1], COLOR_CITATION[2]);
            doc.setFont('helvetica', 'italic');

            checkPageBreak(10);

            doc.text('Sources:', margin, y);
            y += 5;

            msg.references.forEach((ref: any, i: number) => {
                checkPageBreak(10);
                const fileName = ref.pdf_name.length > 60 ? ref.pdf_name.substring(0, 60) + '...' : ref.pdf_name;
                doc.text(`[${i + 1}] ${fileName} (Page ${ref.page_number})`, margin + 5, y);
                y += 5;
            });
        }

        y += 12; // Spacing between messages
    });

    doc.save(`${sessionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`);
};

export const exportToMarkdown = (messages: Message[], sessionName: string) => {
    let content = `# ${sessionName}\n\n`;
    content += `*Exported on: ${new Date().toLocaleString()}*\n\n---\n\n`;

    messages.forEach((msg) => {
        const sender = msg.sender === 'user' ? '**You**' : '**AI**';
        content += `${sender}:\n${msg.message_text}\n\n`;

        if (msg.references && msg.references.length > 0) {
            content += `> **Citations:**\n`;
            msg.references.forEach((ref, index) => {
                content += `> [${index + 1}] Page ${ref.page_number}\n`;
            });
            content += `\n`;
        }
        content += `---\n\n`;
    });

    downloadFile(content, `${sessionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`, 'text/markdown');
};

export const exportToText = (messages: Message[], sessionName: string) => {
    let content = `${sessionName}\n`;
    content += `Exported on: ${new Date().toLocaleString()}\n\n========================================\n\n`;

    messages.forEach((msg) => {
        const sender = msg.sender === 'user' ? 'You' : 'AI';
        content += `${sender}:\n${msg.message_text}\n\n`;

        if (msg.references && msg.references.length > 0) {
            content += `Citations:\n`;
            msg.references.forEach((ref, index) => {
                content += `[${index + 1}] Page ${ref.page_number}\n`;
            });
            content += `\n`;
        }
        content += `----------------------------------------\n\n`;
    });

    downloadFile(content, `${sessionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`, 'text/plain');
};

const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
