class RichTextEditor {
  constructor() {
      this.initializeQuill();
      this.initializeEventListeners();
  }

  initializeQuill() {
      const toolbarOptions = [
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote', 'code-block'],
          [{ 'header': 1 }, { 'header': 2 }, { 'header': 3 }],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'script': 'sub'}, { 'script': 'super' }],
          [{ 'indent': '-1'}, { 'indent': '+1' }],
          [{ 'direction': 'rtl' }],
          [{ 'size': ['small', false, 'large', 'huge'] }],
          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'font': [] }],
          [{ 'align': [] }],
          ['clean'],
          ['link', 'image']
      ];

      this.quill = new Quill('#editor', {
          theme: 'snow',
          modules: {
              toolbar: toolbarOptions
          },
          placeholder: 'Comienza a escribir tu documento aquí...'
      });

      // Contenido inicial
      this.quill.setContents([
          { insert: 'Bienvenido a InDOC\n', attributes: { header: 1, color: '#2c3e50' } },
          { insert: '\nEste es tu editor de texto enriquecido con múltiples opciones de exportación.\n\n' },
          { insert: 'Características disponibles:\n', attributes: { bold: true } },
          { insert: '• Exportar a PDF con texto seleccionable\n' },
          { insert: '• Exportar a documento Word (.docx)\n' },
          { insert: '• Exportar a texto plano (.txt)\n' },
          { insert: '• Todas las herramientas de formato de texto\n\n' },
          { insert: '¡Comienza a escribir y usa los botones de exportación cuando termines!', attributes: { italic: true, color: '#7f8c8d' } }
      ]);
  }

  initializeEventListeners() {
      document.getElementById('exportPdfBtn').addEventListener('click', () => this.exportToPDF());
      document.getElementById('exportWordBtn').addEventListener('click', () => this.exportToWord());
      document.getElementById('exportTextBtn').addEventListener('click', () => this.exportToText());
  }

  async exportToPDF() {
      try {
          const btn = document.getElementById('exportPdfBtn');
          this.setButtonLoading(btn, '⏳ Generando...');

          const editorContent = this.quill.root.innerHTML;
          const tempDiv = this.createPDFContainer(editorContent);
          
          document.body.appendChild(tempDiv);

          const options = {
              margin: [15, 15, 15, 15],
              filename: `documento_${this.getDateString()}.pdf`,
              image: { 
                  type: 'jpeg', 
                  quality: 0.95 
              },
              html2canvas: { 
                  scale: 2, 
                  useCORS: true,
                  letterRendering: true,
                  allowTaint: true
              },
              jsPDF: { 
                  unit: 'mm', 
                  format: 'a4', 
                  orientation: 'portrait',
                  putOnlyUsedFonts: true,
                  floatPrecision: 16
              }
          };

          await html2pdf().set(options).from(tempDiv).save();
          
          document.body.removeChild(tempDiv);
          this.resetButton(btn, '📄', 'PDF');
          this.showNotification('¡PDF generado exitosamente!', 'success');

      } catch (error) {
          console.error('Error al generar PDF:', error);
          this.resetButton(document.getElementById('exportPdfBtn'), '📄', 'PDF');
          this.showNotification('Error al generar el PDF. Inténtalo de nuevo.', 'error');
      }
  }

  createPDFContainer(content) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      tempDiv.style.cssText = `
          font-family: 'Times New Roman', Times, serif;
          font-size: 14px;
          line-height: 1.6;
          color: #000;
          padding: 20px;
          background: white;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          box-shadow: none;
          border: none;
      `;

      // Aplicar estilos para elementos específicos
      this.applyPDFStyles(tempDiv);
      return tempDiv;
  }

  applyPDFStyles(container) {
      // Encabezados
      container.querySelectorAll('h1').forEach(h => {
          h.style.cssText += 'font-size: 24px; font-weight: bold; margin: 20px 0 15px 0; page-break-after: avoid;';
      });
      container.querySelectorAll('h2').forEach(h => {
          h.style.cssText += 'font-size: 20px; font-weight: bold; margin: 18px 0 12px 0; page-break-after: avoid;';
      });
      container.querySelectorAll('h3').forEach(h => {
          h.style.cssText += 'font-size: 16px; font-weight: bold; margin: 15px 0 10px 0; page-break-after: avoid;';
      });

      // Párrafos y listas
      container.querySelectorAll('p').forEach(p => {
          p.style.cssText += 'margin: 0 0 12px 0; text-align: justify;';
      });
      container.querySelectorAll('ul, ol').forEach(list => {
          list.style.cssText += 'margin: 10px 0 15px 20px;';
      });
      container.querySelectorAll('li').forEach(li => {
          li.style.cssText += 'margin: 5px 0;';
      });

      // Blockquotes y código
      container.querySelectorAll('blockquote').forEach(bq => {
          bq.style.cssText += 'border-left: 4px solid #ccc; margin: 15px 0; padding-left: 15px; font-style: italic;';
      });
      container.querySelectorAll('pre').forEach(pre => {
          pre.style.cssText += 'background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; margin: 10px 0;';
      });
  }

  async exportToWord() {
      try {
          const btn = document.getElementById('exportWordBtn');
          this.setButtonLoading(btn, '⏳ Generando...');

          const content = this.quill.root.innerHTML;
          const wordContent = this.convertToWordHTML(content);
          
          // Crear blob con el tipo MIME correcto para Word
          const blob = new Blob(['\ufeff', wordContent], {
              type: 'application/msword'
          });
          
          const filename = `documento_${this.getDateString()}.doc`;
          this.downloadBlob(blob, filename);
          
          this.resetButton(btn, '📘', 'Word');
          this.showNotification('¡Documento Word generado exitosamente!', 'success');

      } catch (error) {
          console.error('Error al generar Word:', error);
          this.resetButton(document.getElementById('exportWordBtn'), '📘', 'Word');
          this.showNotification('Error al generar el documento Word.', 'error');
      }
  }

  convertToWordHTML(content) {
      // Limpiar y procesar el contenido HTML
      const cleanContent = this.cleanHTMLForWord(content);
      
      const wordHTML = `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml"
xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="Microsoft Word 15">
<meta name="Originator" content="Microsoft Word 15">
<title>Documento</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>90</w:Zoom>
  <w:DoNotPromptForConvert/>
  <w:DoNotShowRevisions/>
  <w:DoNotPrintRevisions/>
  <w:DoNotShowMarkup/>
  <w:DoNotShowComments/>
  <w:DoNotShowInsertionsAndDeletions/>
  <w:DoNotShowPropertyChanges/>
  <w:ValidateAgainstSchemas/>
  <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
  <w:IgnoreMixedContent>false</w:IgnoreMixedContent>
  <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>
  <w:DoNotUnderlineInvalidFields/>
  <w:CharacterSpacingControl>DontCompress</w:CharacterSpacingControl>
  <w:CompatibilityFlags>
      <w:BreakWrappedTables/>
      <w:SnapToGridInCell/>
      <w:WrapTextWithPunct/>
      <w:UseAsianBreakRules/>
      <w:DontGrowAutofit/>
      <w:SplitPgBreakAndParaMark/>
      <w:EnableOpenTypeKerning/>
      <w:DontFlipMirrorIndents/>
      <w:OverrideTableStyleHAlign/>
  </w:CompatibilityFlags>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page WordSection1 {
  size: 612.0pt 792.0pt;
  margin: 72.0pt 72.0pt 72.0pt 72.0pt;
  mso-header-margin: 35.4pt;
  mso-footer-margin: 35.4pt;
  mso-paper-source: 0;
}
div.WordSection1 {
  page: WordSection1;
}
@page {
  margin: 1.0in 1.0in 1.0in 1.0in;
  mso-header-margin: 0.5in;
  mso-footer-margin: 0.5in;
}
body {
  font-family: 'Calibri', sans-serif;
  font-size: 11.0pt;
  line-height: 115%;
  margin: 0;
  padding: 0;
  color: black;
  mso-line-height-rule: exactly;
}
p {
  margin: 0pt 0pt 8pt 0pt;
  font-family: 'Calibri', sans-serif;
  font-size: 11.0pt;
  color: black;
}
h1 {
  margin: 12pt 0pt 3pt 0pt;
  page-break-after: avoid;
  font-family: 'Calibri Light', sans-serif;
  font-size: 16.0pt;
  font-weight: normal;
  color: #2F5496;
}
h2 {
  margin: 10pt 0pt 0pt 0pt;
  page-break-after: avoid;
  font-family: 'Calibri Light', sans-serif;
  font-size: 13.0pt;
  font-weight: normal;
  color: #2F5496;
}
h3 {
  margin: 9pt 0pt 0pt 0pt;
  page-break-after: avoid;
  font-family: 'Calibri Light', sans-serif;
  font-size: 12.0pt;
  font-weight: normal;
  color: #1F3763;
}
strong, b {
  font-weight: bold;
}
em, i {
  font-style: italic;
}
u {
  text-decoration: underline;
}
ul, ol {
  margin: 0pt 0pt 8pt 36pt;
  padding: 0;
}
li {
  margin: 0pt 0pt 0pt 0pt;
  font-family: 'Calibri', sans-serif;
  font-size: 11.0pt;
}
blockquote {
  margin: 5pt 0pt 5pt 0pt;
  padding: 0pt 0pt 0pt 36pt;
  border-left: 3pt solid #CCCCCC;
  font-style: italic;
}
pre, code {
  font-family: 'Consolas', monospace;
  font-size: 10.0pt;
  background: #F2F2F2;
  border: 1pt solid #CCCCCC;
  padding: 2pt 4pt;
}
pre {
  margin: 0pt 0pt 8pt 0pt;
  padding: 8pt;
  white-space: pre-wrap;
}
a {
  color: #0563C1;
  text-decoration: underline;
}
table {
  border-collapse: collapse;
  margin: 0pt 0pt 8pt 0pt;
  width: 100%;
}
td, th {
  border: 1pt solid #CCCCCC;
  padding: 3pt 7pt;
  vertical-align: top;
}
th {
  background: #F2F2F2;
  font-weight: bold;
}
.ql-align-center {
  text-align: center;
}
.ql-align-right {
  text-align: right;
}
.ql-align-justify {
  text-align: justify;
}
.ql-indent-1 {
  padding-left: 36pt;
}
.ql-indent-2 {
  padding-left: 72pt;
}
.ql-indent-3 {
  padding-left: 108pt;
}
</style>
</head>
<body lang="ES-ES" style="word-wrap: break-word;">
<div class="WordSection1">
${cleanContent}
</div>
</body>
</html>`;
      return wordHTML;
  }

  cleanHTMLForWord(html) {
      // Crear un elemento temporal para manipular el HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      // Limpiar elementos problemáticos
      tempDiv.querySelectorAll('script, style, meta, link').forEach(el => el.remove());

      // Convertir <br> a párrafos
      let content = tempDiv.innerHTML;
      content = content.replace(/<br\s*\/?>/gi, '</p><p>');
      content = content.replace(/<p>\s*<\/p>/gi, '');

      // Limpiar atributos problemáticos pero mantener estilos inline importantes
      tempDiv.innerHTML = content;
      tempDiv.querySelectorAll('*').forEach(el => {
          // Mantener solo atributos esenciales
          const allowedAttrs = ['class', 'style', 'href', 'src', 'alt', 'title'];
          const attrs = Array.from(el.attributes);
          attrs.forEach(attr => {
              if (!allowedAttrs.includes(attr.name)) {
                  el.removeAttribute(attr.name);
              }
          });

          // Limpiar estilos inline problemáticos
          if (el.style) {
              // Remover propiedades CSS problemáticas para Word
              el.style.removeProperty('display');
              el.style.removeProperty('position');
              el.style.removeProperty('float');
              el.style.removeProperty('clear');
              el.style.removeProperty('overflow');
              el.style.removeProperty('z-index');
              el.style.removeProperty('opacity');
              el.style.removeProperty('transform');
              el.style.removeProperty('transition');
              el.style.removeProperty('animation');
          }
      });

      // Asegurar que el contenido esté envuelto en párrafos
      let finalContent = tempDiv.innerHTML;
      if (!finalContent.trim().startsWith('<p') && !finalContent.trim().startsWith('<h')) {
          finalContent = `<p>${finalContent}</p>`;
      }

      // Limpiar HTML malformado
      finalContent = finalContent.replace(/&nbsp;/g, ' ');
      finalContent = finalContent.replace(/\s+/g, ' ');
      finalContent = finalContent.replace(/<p>\s*<\/p>/gi, '');
      finalContent = finalContent.replace(/<div>/gi, '<p>');
      finalContent = finalContent.replace(/<\/div>/gi, '</p>');

      return finalContent;
  }

  exportToText() {
      try {
          const btn = document.getElementById('exportTextBtn');
          this.setButtonLoading(btn, '⏳ Generando...');

          const content = this.quill.getText();
          const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
          const filename = `documento_${this.getDateString()}.txt`;
          
          this.downloadBlob(blob, filename);
          
          this.resetButton(btn, '📝', 'Texto');
          this.showNotification('¡Archivo de texto generado exitosamente!', 'success');

      } catch (error) {
          console.error('Error al generar texto:', error);
          this.resetButton(document.getElementById('exportTextBtn'), '📝', 'Texto');
          this.showNotification('Error al generar el archivo de texto.', 'error');
      }
  }

  downloadBlob(blob, filename) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
  }

  setButtonLoading(button, text) {
      button.innerHTML = text;
      button.disabled = true;
  }

  resetButton(button, icon, text) {
      button.innerHTML = `<span>${icon}</span> ${text}`;
      button.disabled = false;
  }

  getDateString() {
      return new Date().toISOString().split('T')[0];
  }

  showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.textContent = message;

      document.body.appendChild(notification);

      setTimeout(() => {
          notification.style.transform = 'translateX(0)';
          notification.style.opacity = '1';
      }, 10);

      setTimeout(() => {
          notification.style.transform = 'translateX(100%)';
          notification.style.opacity = '0';
          setTimeout(() => {
              if (document.body.contains(notification)) {
                  document.body.removeChild(notification);
              }
          }, 300);
      }, 3000);
  }
}

// Inicializar el editor cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new RichTextEditor();
});