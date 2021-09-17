let db;
const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;

    db.createObjectStore('new_transaction', { autoIncrement: true });
};

//upon a successful
request.onsuccess = function(event) {
    //when db is successfully created with its object store/establish a connection, save reference tp db in global variable
    db = event.target.result;

    //if app is online, run uploadTransaction()
    if(navigator.onLine) {
        uploadTransaction();
    };
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// this function will execute if we attempt to submit a new transaction without internet connection
function saveRecord(record) {

    //open new transaction w/ db w/ read and write permission
    const transaction = db.transaction([ 'new_transaction' ], 'readwrite');

    //access the object store
    const budgetObjectStore = transaction.objectStore('new_transaction');

    // add record to object store
    budgetObjectStore.add(record);
};

function uploadTransaction() {
    const transaction = db.transaction([ 'new_transaction' ], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_transaction');

    //get all records from object store and set to a variable
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        //if there was data in IndexedDB's store, send it to the api server
        if(getAll.result.length > 0) {
            fetch('api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    "Content-Type": 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message) {
                    throw new Error({ serverResponse });
                }
                //open transaction and clear all data in object store
                const transaction = db.transaction([ 'new_transaction' ], 'readwrite');
                const budgetObjectStore = transaction.objectStore('new_transaction');
                //clear data
                budgetObjectStore.clear();

                alert('All saved transaction(s) have been submitted!')
            })
            .catch(err => console.log(err))
        }
    }
}

//listen for app coming back online
window.addEventListener('online', uploadTransaction);