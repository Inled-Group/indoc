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
          { insert: '• Exportar a texto plano (.txt)\n' },
          { insert: '• Todas las herramientas de formato de texto\n\n' },
          { insert: '¡Comienza a escribir y usa los botones de exportación cuando termines!', attributes: { italic: true, color: '#7f8c8d' } }
      ]);
  }

  initializeEventListeners() {
      document.getElementById('exportPdfBtn').addEventListener('click', () => this.exportToPDF());
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
          this.resetButton(btn, 'PDF');
          this.showNotification('¡PDF generado exitosamente!', 'success');

      } catch (error) {
          console.error('Error al generar PDF:', error);
          this.resetButton(document.getElementById('exportPdfBtn'), 'PDF');
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
          
          this.resetButton(btn, 'Texto');
          this.showNotification('¡Archivo de texto generado exitosamente!', 'success');

      } catch (error) {
          console.error('Error al generar texto:', error);
          this.resetButton(document.getElementById('exportTextBtn'), 'Texto');
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