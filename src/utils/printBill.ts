
export const printBill = (order: any) => {
    const tenant = order.tenantId;
    const items = order.items;
    const customer = order.customerId;
    const cashier = order.cashierId;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
        <html>
        <head>
            <title>Receipt #${order.orderId}</title>
            <style>
                @page { margin: 0; }
                body {
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    width: 58mm; /* Standard thermal paper width */
                    margin: 0;
                    padding: 10px;
                    color: #000;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .text-bold { font-weight: bold; }
                .divider { border-top: 1px dashed #000; margin: 5px 0; }
                .items-table { width: 100%; border-collapse: collapse; }
                .items-table td { vertical-align: top; }
                .mb-1 { margin-bottom: 4px; }
            </style>
        </head>
        <body>
            <div class="text-center">
                ${tenant.logo ? `<img src="${tenant.logo}" style="max-height: 50px; margin-bottom: 5px;" />` : ''}
                <div class="text-bold" style="font-size: 14px;">${tenant.shopName || tenant.name || 'My Shop'}</div>
                <div>${tenant.address || ''}</div>
                <div>Tel: ${tenant.phone || ''}</div>
            </div>

            <div class="divider"></div>

            <div>
                <div>Order: #${order.orderId}</div>
                <div>Date: ${new Date(order.createdAt).toLocaleString()}</div>
                <div>Cashier: ${cashier?.name || 'Staff'}</div>
                ${customer ? `<div>Customer: ${customer.name}</div>` : ''}
            </div>

            <div class="divider"></div>

            <table class="items-table">
                ${items.map((item: any) => `
                    <tr>
                        <td colspan="3" class="text-bold">${item.name}</td>
                    </tr>
                    <tr>
                        <td>${item.quantity} x ${item.price.toLocaleString()}</td>
                        <td class="text-right">${(item.quantity * item.price).toLocaleString()}</td>
                    </tr>
                `).join('')}
            </table>

            <div class="divider"></div>

            <table class="items-table">
                <tr>
                    <td>Subtotal:</td>
                    <td class="text-right">${(order.total + order.discount).toLocaleString()}</td>
                </tr>
                ${order.discount > 0 ? `
                <tr>
                    <td>Discount:</td>
                    <td class="text-right">-${order.discount.toLocaleString()}</td>
                </tr>
                ` : ''}
                <tr class="text-bold" style="font-size: 14px;">
                    <td>TOTAL:</td>
                    <td class="text-right">${order.total.toLocaleString()}</td>
                </tr>
            </table>

            <div class="divider"></div>

            <table class="items-table">
                <tr>
                    <td>Pay (${order.paymentMethod}):</td>
                    <td class="text-right">${order.paidAmount.toLocaleString()}</td>
                </tr>
                <tr>
                    <td>Change:</td>
                    <td class="text-right">${order.change.toLocaleString()}</td>
                </tr>
                ${order.paymentMethod === 'DEBT' ? `
                <tr>
                    <td>Remaining Debt:</td>
                    <td class="text-right">${order.remainingAmount.toLocaleString()}</td>
                </tr>
                ` : ''}
            </table>

            <div class="divider"></div>
            <div class="text-center mb-1">Thank you!</div>
            <div class="text-center">Powered by SKV POS</div>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    // Auto print then close
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
};
