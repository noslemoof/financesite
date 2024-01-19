function getCsrfToken() {
    const csrfTokenCookie = document.cookie.split(';')
        .find(row => row.trim().startsWith('csrftoken='));
    if (!csrfTokenCookie) {
        console.error('CSRF token cookie not found!');
        return null;
    }
    return csrfTokenCookie.split('=')[1];
}

var AddToBasket = {
    oninit: function(vnode) {
        vnode.state.basketItems = [];
        vnode.state.discount = 0;
        vnode.state.totalPrice = 0;
        vnode.state.selectedItemId = 5;
        vnode.state.quantity = 1;
        vnode.state.buyerName = '';
        vnode.state.paymentMethod = 'PYL'; // Default payment method
        vnode.state.latestTransactions = []; // Initialize latestTransactions

        // Fetch the latest transactions
        m.request({
            method: 'GET',
            url: '/api/get_latest_transactions/',
        }).then(function(transactions) {
            vnode.state.latestTransactions = transactions;
        }).catch(function(error) {
            console.error('Error fetching latest transactions:', error.message);
        });
    },

    recalculateTotalPrice: function(vnode) {
        vnode.state.totalPrice = vnode.state.basketItems.reduce((acc, item) => {
            return acc + (item.price * item.quantity);
        }, 0);

        // Apply discount
        vnode.state.totalPrice -= vnode.state.discount;
        if (vnode.state.totalPrice < 0) {
            vnode.state.totalPrice = 0; // Ensure total price is not negative
        }

        vnode.state.totalPrice = parseFloat(vnode.state.totalPrice.toFixed(2));
    },

    clearBasket: function(vnode) {
        vnode.state.basketItems = [];
        vnode.state.totalPrice = 0;
        vnode.state.discount = 0; // Reset discount if implemented
        // Reset any other state variables if needed
    },


    view: function(vnode) {
        if (!vnode.attrs.sales_items) {
            return m.fragment;
        }

        var salespersonName = "{{ username }}";
        var paymentOptions = [
            { value: 'PYL', label: 'PayLah' },
            { value: 'PNW', label: 'PayNow' },
            { value: 'CSH', label: 'Cash' },
            { value: 'BKT', label: 'BankTransfer' },
        ];

        return m('div', { class: 'app-container' }, [
            m('div.item-selection', [
                // Item Selector
                m('div.selection-box', [
                    m('label', { for: 'selected_item' }, 'Select Item:'),
                    m('select', {
                        class: 'item-dropdown',
                        id: 'selected_item',
                        onchange: function(e) { vnode.state.selectedItemId = e.target.value },
                    }, [
                        vnode.attrs.sales_items.map(function(item) {
                            return m('option', { value: item.id }, item.item_name);
                        })
                    ]),
                ]),

                m('div.selection-box', [
                    m('label', { for: 'quantity' }, 'Quantity:'),
                    m('input[type=number]', {
                        id: 'quantity',
                        min: 1,
                        value: vnode.state.quantity,
                        oninput: function(e) { vnode.state.quantity = parseInt(e.target.value) },
                    }),
                ]),

                m('div.selection-box', [
                    m('label', { for: 'discount' }, 'Discount:'),
                    m('input[type=number]', {
                        id: 'discount',
                        min: 0,
                        value: vnode.state.discount,
                        oninput: function(e) { vnode.state.discount = parseFloat(e.target.value); },
                    }),
                ]),


                m('div.selection-box', [
                    m('label', { for: 'buyer_name' }, 'Buyer Name:'),
                    m('input', {
                        id: 'buyer_name',
                        type: 'text',
                        value: vnode.state.buyerName,
                        oninput: function(e) { vnode.state.buyerName = e.target.value },
                    }),
                ]),

                m('div.selection-box', [
                    m('label', { for: 'payment_method' }, 'Payment Method:'),
                    m('select', {
                        id: 'payment_method',
                        onchange: function(e) { vnode.state.paymentMethod = e.target.value },
                    }, paymentOptions.map(function(option) {
                        return m('option', { value: option.value }, option.label);
                    })),
                ]),

                // Add to Basket Button
                m('button.add-to-basket', { onclick: function() { vnode.state.addItemToBasket(vnode) } }, 'Add to Basket'),
            ]),

            m('div', { class: 'basket-payment' },[
                m('h3', 'Basket Items:'),
                m('ul.list-none', [
                    vnode.state.basketItems.map(function(item) {
                        return m('li.basket-item', [
                            m('span', item.itemName + ' - Quantity: ' + item.quantity + ' - Price: $' + item.price + ' - Total: $' + item.total),
                        ]);
                    }),
                ]),
                m('h3', 'Total Price: $' + vnode.state.totalPrice.toFixed(2)),
                m('button.clear-basket-button', { onclick: function() { vnode.state.clearBasket(vnode) } }, 'Clear Basket'),
                m('button.pay-button', { onclick: function() { vnode.state.pay(vnode) } }, 'Pay'),
            ]),

            m('div', { class: 'latest-transactions' }, [
                m('h3', { class: 'transactions-title' }, 'Latest Transactions'),
                vnode.state.latestTransactions.length === 0 ?
                    m('p.no-transactions', 'No transactions found') :
                    m('table.transactions-table', [
                    m('thead',
                        m('tr', { style: { background: '#f2f2f2', textAlign: 'left' } }, [
                            m('th', { style: { padding: '5px', textAlign: 'left' } }, 'Date'),
                            m('th', { style: { padding: '5px', textAlign: 'left' } }, 'Time'),
                            m('th', { style: { padding: '5px', textAlign: 'left' } }, 'Items Sold'),
                            m('th', { style: { padding: '5px', textAlign: 'left' } }, 'Total Price'),
                            m('th', { style: { padding: '5px', textAlign: 'left' } }, 'Salesperson'),
                            m('th', { style: { padding: '5px', textAlign: 'left' } }, 'Buyer'),
                            m('th', { style: { padding: '5px', textAlign: 'left' } }, 'Payment Method')
                        ])
                    ),
                    m('tbody',
                        vnode.state.latestTransactions.map(function(transaction, index) {
                            return m('tr', { style: { background: index % 2 === 0 ? '#f9f9f9' : 'white' } }, [
                                m('td', { style: { padding: '5px' } }, transaction.date),
                                m('td', { style: { padding: '5px' } }, transaction.time),
                                m('td', { style: { padding: '5px' } }, transaction.number_of_items_sold.toString()),
                                m('td', { style: { padding: '5px' } }, `$${transaction.total_price.toFixed(2)}`),
                                m('td', { style: { padding: '5px' } }, transaction.salesperson),
                                m('td', { style: { padding: '5px' } }, transaction.buyer),
                                m('td', { style: { padding: '5px' } }, transaction.payment_method)
                            ]);
                        })
                    )
                ])
            ]),
        ])
    },


    addItemToBasket: function(vnode) {
        if (!vnode.state.selectedItemId) {
            console.error('No item selected');
            return;
        }

        var quantity = vnode.state.quantity;
        var selectedItem = vnode.attrs.sales_items.find(item => item.id == vnode.state.selectedItemId);

        if (selectedItem) {
            if (selectedItem.item_stock < quantity) {
                alert('Item out of stock');
                return;
            }

            var itemTotalPrice = selectedItem.item_price * quantity;
            vnode.state.basketItems.push({
                id: selectedItem.id,
                itemName: selectedItem.item_name,
                quantity: quantity,
                price: selectedItem.item_price,
                total: itemTotalPrice,
            });

            vnode.state.recalculateTotalPrice(vnode);
            console.log("Updated Total Price: $", vnode.state.totalPrice);
        }
    },


    pay: function(vnode) {
        // Check if the basket is empty
        if (vnode.state.basketItems.length === 0) {
            alert('Fill your basket first!');
            return;
        }

        vnode.state.recalculateTotalPrice(vnode);

        var csrfToken = getCsrfToken();
        if (!csrfToken) {
            console.error('CSRF token is not available');
            return;
        }

        if (vnode.state.totalPrice <= 0) {
            console.error('Total price is not set or invalid');
            return;
        }

        // Create a FormData object to send the data
        var formData = new FormData();
            formData.append('buyer_name', vnode.state.buyerName);
            formData.append('payment_method', vnode.state.paymentMethod);
            formData.append('total_price', vnode.state.totalPrice.toFixed(2));

            // Aggregate sales items data
            var salesItemsData = vnode.state.basketItems.map(function(item) {
                return {
                    id: item.id,  // Assuming 'id' is the identifier of the SalesItem
                    quantity: item.quantity
                };
            });

            // Append the stringified sales items array
            formData.append('sales_items', JSON.stringify(salesItemsData));

            // Sending the request
            m.request({
                method: 'POST',
                url: '/api/create_transaction/',
                headers: {
                    'X-CSRFToken': csrfToken
                },
                body: formData,
            }).then(response => {

                vnode.state.basketItems.forEach(item => {
                    m.request({
                        method: 'PATCH', // Use PATCH method
                        url: `/api/update_item_stock/${item.id}/`,
                        headers: {
                            'X-CSRFToken': csrfToken
                        },
                        body: { quantity: item.quantity },
                    }).then(() => {
                        // Stock updated successfully
                    }).catch(error => {
                        console.error(`Failed to update stock for item ${item.id}:`, error);
                    });
                });

                console.log('Transaction created with ID:', response.id);
                vnode.state.basketItems = [];
                vnode.state.totalPrice = 0; // Resetting total price after payment

                // Fetch latest transactions to update the list
                m.request({
                    method: 'GET',
                    url: '/api/get_latest_transactions/',
                }).then(function(transactions) {
                    vnode.state.latestTransactions = transactions;
                });

            }).catch(error => {
                console.error('Transaction failed:', error);
            });
        },

};

document.addEventListener("DOMContentLoaded", function() {
    m.request({
        method: 'GET',
        url: '/api/SalesItems/',
    })
    .then(function(response) {
        var sales_items = response;
        console.log('Sales Items:', sales_items);

        var appElement = document.getElementById('app');
        if (appElement && sales_items) {
            m.mount(appElement, { view: function() { return m(AddToBasket, { sales_items: sales_items}); } });
        }
    })
    .catch(function(error) {
        console.error('Error fetching sales items:', error.message);
    });
});
