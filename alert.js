window.showAlert = function(message) {
    let alertDiv = document.createElement('div');
    alertDiv.style.position = 'fixed';
    alertDiv.style.bottom = '10px';
    alertDiv.style.left = '10px';
    alertDiv.style.backgroundColor = 'red';
    alertDiv.style.color = 'white';
    alertDiv.style.padding = '10px';
    alertDiv.textContent = message;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        document.body.removeChild(alertDiv);
    }, 5000); // After 5 seconds, remove the alert.
}
