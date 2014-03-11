document.addEventListener('DOMContentLoaded', function restore_options() {
    chrome.runtime.sendMessage({type: "getSettings"}, function (response) {
        var key;
        for (key in response) {
            if (response.hasOwnProperty(key)) {
                var input = document.querySelector('#' + key);
                if (!input) {
                    console.error("input with id '" + key + "'' not found");
                } else {
                    var valueProp = "value"
                    if (input.type === "checkbox") {
                        valueProp = "checked";
                    }
                    input[valueProp] = response[key];
                }
            }
        }
    });


    var inputs = document.querySelectorAll('input');
    for (var i = 0; i <inputs.length; i += 1) {
        inputs[i].addEventListener('change', function apply_option(e) {
            var name = e.target.id;
            var value = e.target.value;
            if (e.target.type === "checkbox") {
                value = e.target.checked;
            }
            chrome.runtime.sendMessage({type: "settingUpdated", name: name, value: value });
            console.log("message sent from popup");
        });
    }
});