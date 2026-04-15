import { Order } from './types';

export const printOrder = (order: Order) => {
  const printWindow = window.open('', '_blank', 'width=300,height=600');
  if (!printWindow) return;

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 2px 0; font-size: 14px;">${item.quantity}x - ${item.productName}</td>
      <td style="text-align: right; font-size: 14px;"> R$ ${(item.quantity * item.unitPrice).toFixed(2)}</td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <html>
      <head>
        <style>
          /* FORÇA O TAMANHO DA BOBINA DE 58mm */
          @page { 
            size: 58mm auto; 
            margin: 0; 
          }
          body { 
            width: 54mm; /* Um pouquinho menor que 58 para não cortar a borda */
            font-family: 'Courier New', Courier, monospace; 
            padding: 5px; 
            margin: 0; 
            color: #000;
            background: #fff;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-bottom: 1px dashed #000; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; }
          .obs { background: #eee; padding: 4px; margin-top: 4px; font-size: 12px; border: 1px solid #000; }
          
          /* Esconde elementos desnecessários na impressão */
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 16px;">GARDENS LANCHES</div>
        <div class="center" style="font-size: 10px;">PRODUCAO COZINHA</div>
        <div class="line"></div>
        <div class="bold italic text-center">PEDIDO: #${String(order.id).slice(-4).toUpperCase()}</div>
        <div style="font-size: 11px;">DATA: ${new Date(order.createdAt).toLocaleTimeString('pt-BR')}</div>
        <div style="font-size: 11px;">CLIENTE: ${order.customerName}</div>
        <div class="line"></div>
        <table> ${itemsHtml}</table>
        <div class="line"></div>
        <div class="bold" style="font-size: 14px; text-align: right;">TOTAL: R$ ${order.total.toFixed(2)}</div>
        
        ${order.notes ? `
          <div class="line"></div>
          <div class="bold" style="font-size: 11px;">OBS: </div>
          <div class="obs">${order.notes}</div>
        ` : ''}
        
        <br>
        <br>
        
        
        <br>
        <br>
        <br>
        <div class="center bold" style="font-size: 12px;">(Gardens)</div>
        <br>
        
        <div class="center" style="font-size: 5px;">.</div> 
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};