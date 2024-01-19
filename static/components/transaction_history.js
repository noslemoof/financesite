function getCsrfToken() {
    const csrfTokenCookie = document.cookie.split(';')
        .find(row => row.trim().startsWith('csrftoken='));
    if (!csrfTokenCookie) {
        console.error('CSRF token cookie not found!');
        return null;
    }
    return csrfTokenCookie.split('=')[1];
}

function generateHourOptions(start, end) {
    var options = [];
    for (var hour = start; hour <= end; hour++) {
        var displayHour = hour < 10 ? '0' + hour : hour.toString();
        options.push(m('option', { value: displayHour }, displayHour + ':00'));
    }
    return options;
}

var TransactionHistory = {
    selectedBuyer: '',
    selectedDate: '', // Add this for the selected date
    selectedHourFrom: '08', // Add this for the starting hour
    selectedHourTo: '22', // Add this for the ending hour

    oninit: function(vnode) {
        vnode.state.latestTransactions = [];
        vnode.state.showDetails = false; // New state property
        vnode.state.currentTransactionDetails = [];
        m.request({
            method: 'GET',
            url: '/api/get_full_transactions/',
        }).then(function(transactions) {
            vnode.state.latestTransactions = transactions;
        }).catch(function(error) {
            console.error('Error fetching latest transactions:', error.message);
            vnode.state.latestTransactions = [];
        });
    },

    fetchFilteredTransaction: async function (vnode) {
        var queryParams = [];

        if (this.selectedBuyer.trim()) {
            queryParams.push(`buyer_name=${encodeURIComponent(this.selectedBuyer.trim())}`);
        }
        if (this.selectedDate.trim()) {
            queryParams.push(`date=${encodeURIComponent(this.selectedDate.trim())}`);
        }
        if (this.selectedHourFrom && this.selectedHourTo) {
            queryParams.push(`hour_from=${encodeURIComponent(this.selectedHourFrom)}`);
            queryParams.push(`hour_to=${encodeURIComponent(this.selectedHourTo)}`);
        }

        var queryString = queryParams.join('&');
        var url = `/api/get_full_transactions/?${queryString}`;

        try {
            var historicDataResponse = await m.request({
                method: "GET",
                url: url,
            });

            // Update the latestTransactions property using vnode
            vnode.state.latestTransactions = Array.isArray(historicDataResponse) ? historicDataResponse : [historicDataResponse];
            m.redraw();

        } catch (error) {
            console.error("Error fetching data:", error);
            // Update the latestTransactions property using vnode
            vnode.state.latestTransactions = [];
            m.redraw();
        }
    },


    handleBuyerInput: function (event) {
        TransactionHistory.selectedBuyer = event.target.value;
        m.redraw(); // Explicitly redraw if necessary
    },

    handleKeyPress: function (vnode, event) {
        if (event.keyCode === 13) { // Enter key code is 13
            TransactionHistory.fetchFilteredTransaction(vnode);
        }
    },

    fetchTransactionDetails: function(dataStorageId) {
        if (!dataStorageId) {
            console.error('DataStorage ID is undefined.');
            return;
        }

        const component = this; // Capture the correct 'this' reference

        m.request({
            method: 'GET',
            url: `/api/get_items_ds/`,
            params: { data_storage_id: dataStorageId } // Pass the DataStorage ID as a query parameter
        }).then((details) => {
            component.state.showDetails = true; // Show details view
            component.state.currentTransactionDetails = details; // Store the fetched details
            m.redraw(); // Redraw the component
        }).catch((error) => {
            console.error('Error fetching transaction details:', error);
        });
    },

    showTransactionHistory: function() {
        this.state.showDetails = false; // Hide details view
        this.state.currentTransactionDetails = []; // Clear the details
        m.redraw(); // Redraw the component
    },

    deleteTransaction: function(transactionId) {
        if (!transactionId) {
            console.error('Transaction ID is undefined.');
            return;
        }
        if (!confirm('Are you sure you want to delete this transaction and restore item stock?')) {
            return;
        }

        m.request({
            method: 'DELETE',
            url: `/api/delete_transaction/${transactionId}/`,
            headers: {
                'X-CSRFToken': getCsrfToken()
            },
        }).then((result) => {
            console.log('Transaction deleted:', result);
            alert(`Transaction deleted. Items restored: ${result.items_restored.join(', ')}`);
            // Directly invoke Mithril to redraw the component which will call oninit
            m.redraw();
        }).catch((error) => {
            console.error('Error deleting transaction:', error);
        });
    },

    view: function(vnode) {
        if (vnode.state.showDetails) {
            // Render transaction details view
            return m('div', {
                style: {
                    marginTop: '20px',
                    margin: '10px',
                    overflowY: 'auto',
                    maxHeight: '800px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    background: 'white',
                    padding: '10px'
                }
            }, [
                m('button', {
                    onclick: () => {
                        TransactionHistory.showTransactionHistory.call(vnode);
                    },
                    style: { marginBottom: '10px' }
                }, 'Back'),
                // Render the list of items and quantities
                vnode.state.currentTransactionDetails.map((detail) => {
                    return m('div', {
                        style: { marginBottom: '5px' }
                    }, `${detail.item_name} - Quantity: ${detail.quantity}`);
                })
            ]);
        } else {
            return m('div', { class: 'employee-data-view' }, [
                m('div', { class: 'Field-middle' }, [
                    m('div', { class: 'Input-container' }, [
                        m('h5', { style: 'font-size: 14px; padding-right:5px;' }, 'Buyer name:'),
                        m('input', {
                            type: 'text',
                            placeholder: 'Enter Buyer Name',
                            value: TransactionHistory.selectedBuyer,
                            oninput: TransactionHistory.handleBuyerInput,
                            onkeypress: (event) => TransactionHistory.handleKeyPress(vnode, event),
                            style: 'font-size: 14px; padding: 5px;',
                        }),
                        m('input', {
                            type: 'date',
                            value: TransactionHistory.selectedDate,
                            onchange: (e) => { TransactionHistory.selectedDate = e.target.value; }
                        }),

                        // Hour range selectors
                        m('select', {
                            onchange: (e) => { TransactionHistory.selectedHourFrom = e.target.value; },
                            value: TransactionHistory.selectedHourFrom
                        }, generateHourOptions(8, 22)),
                        m('select', {
                            style: {marginRight:'20px'} ,
                            onchange: (e) => { TransactionHistory.selectedHourTo = e.target.value; },
                            value: TransactionHistory.selectedHourTo
                        }, generateHourOptions(8, 22)),
                        m('button', {
                            onclick: () => this.fetchFilteredTransaction(vnode),
                            style: 'font-size: 14px; padding: 5px;',
                        }, 'Fetch Historic Data'),
                    ]),
                ]),
                m('div', {
                    style: {
                        marginTop: '20px',
                        position: 'relative',
                        overflowY: 'auto',
                        maxHeight: '800px',
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                        background: 'white',
                        width: '100%',
                    }
                }, [
                m('h3', {style: {marginLeft: '10px'}}, 'Transaction History'),
                vnode.state.latestTransactions.length === 0
                    ? m('p', 'No transactions found')
                    : m('table', {
                        style: {
                            width: '100%',
                            maxWidth: '100%', /* Ensures the table is not wider than its container */
                            tableLayout: 'fixed',
                            margin: '10px',
                        }
                    }, [
                        m('thead',
                            m('tr', {style: {background: '#f2f2f2', textAlign: 'left'}}, [
                                m('th', {style: {padding: '3px'}}, 'Date'),
                                m('th', {style: {padding: '3px'}}, 'Time'),
                                m('th', {style: {padding: '3px'}}, 'Items Sold'),
                                m('th', {style: {padding: '3px'}}, 'Total Price'),
                                m('th', {style: {padding: '3px'}}, 'Salesperson'),
                                m('th', {style: {padding: '3px'}}, 'Buyer'),
                                m('th', {style: {padding: '3px'}}, 'Payment Method'),
                                m('th', {style: {padding: '3px'}}, 'View Details'), // New column for viewing details
                                m('th', {style: {padding: '3px'}}, 'Delete') // New column for delete action
                            ])
                        ),
                        m('tbody',
                            vnode.state.latestTransactions.map(function (transaction, index) {
                                return m('tr', {style: {background: index % 2 === 0 ? '#f9f9f9' : 'white'}}, [
                                    m('td', {style: {padding: '3px'}}, transaction.date),
                                    m('td', {style: {padding: '3px'}}, transaction.time),
                                    m('td', {style: {padding: '3px'}}, transaction.number_of_items_sold.toString()),
                                    m('td', {style: {padding: '3px'}}, `$${transaction.total_price.toFixed(2)}`),
                                    m('td', {style: {padding: '3px'}}, transaction.salesperson),
                                    m('td', {style: {padding: '3px'}}, transaction.buyer),
                                    m('td', {style: {padding: '3px'}}, transaction.payment_method),
                                    m('td', {style: {padding: '3px'}},
                                        m('button', {
                                            onclick: () => {
                                                TransactionHistory.fetchTransactionDetails.call(vnode, transaction.id);
                                            }
                                        }, 'View Details')
                                    ),


                                    m('td', {style: {padding: '5px'}},
                                        m('button', {
                                            onclick: function () {
                                                TransactionHistory.deleteTransaction(transaction.id);
                                            }
                                        }, 'Delete')) // Placeholder button for delete action
                                  ]);
                                })
                            )
                        ]) // Closing brackets for the table
                    ]) // Closing brackets for the div containing the table
                ]); // Closing brackets for the div with class 'employee-data-view'
            }
        },

};

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOMContentLoaded event fired");
    var transactionHistoryElement = document.getElementById('transaction-history');
    if (transactionHistoryElement) {
        // Mount TransactionHistory only if 'transaction-history' element exists
        m.mount(transactionHistoryElement, TransactionHistory);
    }
});
