import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, FileText, FileType } from 'lucide-react';
import { exportToPDF, exportToMarkdown, exportToText } from '@/lib/exportUtils';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    messages: any[];
    sessionName: string;
}

export function ExportModal({ isOpen, onClose, messages, sessionName }: ExportModalProps) {
    const [format, setFormat] = useState<'pdf' | 'markdown' | 'text'>('pdf');
    const [includeCitations, setIncludeCitations] = useState(true);
    const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');

    const handleExport = () => {
        switch (format) {
            case 'pdf':
                exportToPDF(messages, sessionName, { includeCitations, fontSize });
                break;
            case 'markdown':
                exportToMarkdown(messages, sessionName);
                break;
            case 'text':
                exportToText(messages, sessionName);
                break;
        }
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
                <DialogHeader>
                    <DialogTitle>Export Chat History</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="format" className="text-right">
                            Format
                        </Label>
                        <Select value={format} onValueChange={(val: any) => setFormat(val)}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pdf">
                                    <div className="flex items-center">
                                        <FileType className="mr-2 h-4 w-4" /> PDF Document
                                    </div>
                                </SelectItem>
                                <SelectItem value="markdown">
                                    <div className="flex items-center">
                                        <FileText className="mr-2 h-4 w-4" /> Markdown File
                                    </div>
                                </SelectItem>
                                <SelectItem value="text">
                                    <div className="flex items-center">
                                        <FileText className="mr-2 h-4 w-4" /> Plain Text
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {format === 'pdf' && (
                        <>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="fontSize" className="text-right">
                                    Font Size
                                </Label>
                                <Select value={fontSize} onValueChange={(val: any) => setFontSize(val)}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="small">Small</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="large">Large</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="citations" className="text-right">
                                    Citations
                                </Label>
                                <div className="flex items-center space-x-2 col-span-3">
                                    <Checkbox
                                        id="citations"
                                        checked={includeCitations}
                                        onCheckedChange={(checked) => setIncludeCitations(checked as boolean)}
                                    />
                                    <label
                                        htmlFor="citations"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Include Citations in Export
                                    </label>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
