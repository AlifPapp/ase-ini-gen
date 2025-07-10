var site_url = "https://alifpapp.me/ase-ini-gen";

var editor_settings = {};
var editor_preview = {};

var editor_settings1 = {};
var editor_preview1 = {};


function ready(a) {
    "loading" != document.readyState ? a() : document.addEventListener("DOMContentLoaded", a);
}

function start() {
    // Set default config
    $.ajax({
        url: "./json/EditorSettings1.json",
        async: false,
        dataType: "json",
        success: function (data) {
            editor_settings = data;
            editor_settings1 = data;
        },
    });
    $.ajax({
        url: "./json/EditorPreview1.json",
        async: false,
        dataType: "json",
        success: function (data) {
            editor_preview = data;
            editor_preview1 = data;
        },
    });

    // Build buttons
    $("#editor").append(build_editor());

    // Generate preview
    generate_preview();

    // Setup stepper buttons
    document.addEventListener("touchstart", function () { }, false);
    stepper_setInputButtonState();
}
ready(start);

// Build editor
function build_editor() {
    var data = editor_settings1;
    var data2;
    var html = '<div id="editor_table"><table><tbody>';
    for (var key in data) {
        html += "<!-- " + key + " -->";
        html += '<tr><td class="collapsible-section-header td-1"><a data-bs-toggle="collapse" class="collapsed" href="#' + key + '">';
        html += data[key]["Title"];
        html += '</a></td><td class="collapsible-section-header py-1 td-1">';
        html += data[key]["Description"];
        html += '</td><td class="collapsible-section-header td-1">';
        // Build switch
        html += build_switch(key, data[key]["Default"]);
        html += "</td></tr>";

        html += "<!-- Console_Variables -->";
        html += '<tr><td class="p-0 td-1" colspan="3">';
        html += '<div id="' + key + '" class="collapse multi-collapse">';
        html += '<table style="width:100%">';
        for (var key2 in data[key]["Console_Variables"]) {
            data2 = data[key]["Console_Variables"][key2];
            html += '<tr><td class="border-end-0 td-1" style="font-family: Andale Mono, monospace;">';
            html += data2["Name"];
            if (data2["Type"] == "none") {
                html += '</td></tr>';
            } else {
                html += '</td><td class="py-1 border-start-0 td-1">';
                if (data2["Type"] == "bool") {
                    html += build_switch(data2["Id"], data2["Value"]);
                }
                else if (data2["Type"] == "int") {
                    html += build_stepper(
                        data2["Id"],
                        data2["Value"],
                        data2["Min"],
                        data2["Max"],
                        data2["DataStep"]
                    );
                }
                html += "</td></tr>";
            }
        }
        html += "</table></div></td></tr>";
    }
    html += "</tbody></table></div>";
    return html;
}
function build_switch(id, default_state) {
    var checked = "";
    if (default_state.toLowerCase() == "true") {
        checked = "checked";
    }
    var html = '<div class="ms-auto me-0" style="width: 80px;"><label class="switch">';
    html += '<input type="checkbox" class="switch-input" oninput="switch_ValueUpdate(event)" id="' + id + '" value="' + default_state + '" ' + checked + ">";
    html += '<span class="switch-label" data-on="On" data-off="Off"></span><span class="switch-handle"></span></label></div>';
    return html;
}
function build_stepper(id, default_value, min, max, datastep) {
    var html = '<div class="number-input-container ms-auto me-0">';
    html += '<button type="button" class="button-decrement" onclick="stepper_onbutton(event)" data-input-id="' + id + '" data-operation="decrement"></button>';

    html += '<div class="number-input"><input type="number" class="number-input-field" oninput="stepper_oninput(event)" onblur="stepper_onblur(event)" ';
    html += 'id="' + id + '" value="' + default_value + '" min="' + min + '" max="' + max + '" data-step="' + datastep + '"></div>';

    html += '<button type="button" class="button-increment" onclick="stepper_onbutton(event)" data-input-id="' + id + '" data-operation="increment"></button>';
    html += "</div>";

    return html;
}

// Build consolevariable.ini string
function build_consolevariable_ini() { 
    var consolevariable_ini = ";Created with:\n;" + site_url + "\n";

    // Check editor_settings1
    if (editor_settings1.constructor !== Object){
        console.log("Error building consolevariable.ini");
        $("#consolevariables_ini").text(consolevariable_ini);
        return;
    }

    // Read editor_settings1 and collect values by going through ids
    var data = editor_settings1;
    for (var key in data) {
        // if setting is enabled
        if ($("#" + key).val() == "true") {
            // Add header
            consolevariable_ini += "\n;[" + data[key]["Title"] + "]\n";
            // for each console variable
            for (var key2 in data[key]["Console_Variables"]) {
                // get value
                if (data[key]["Console_Variables"][key2]["Type"] != "none") {
                    consolevariable_ini += "+CVars=" + data[key]["Console_Variables"][key2]["Name"] + "=" + $("#" + data[key]["Console_Variables"][key2]["Id"]).val() + "\n";
                } else {
                    consolevariable_ini += "+CVars=" + data[key]["Console_Variables"][key2]["Name"] + "\n";
                }
            }
        }
    }
    console.log("Built consolevariable.ini");
    $("#consolevariables_ini").val(consolevariable_ini);
    return;
}

// Generate preview image
function generate_preview() {
    // Check if editor_preview1 or editor_settings1 is an object
    if (editor_preview1.constructor !== Object || editor_settings1.constructor !== Object) {
        set_preview("PreviewUnavailable");
        return;
    }

    var SettingsEnabled = " ";
    for (var key in editor_settings1) {
        if ($("#" + key).val() == "true") {
            SettingsEnabled += key + " ";
        }
    }
    // find closest matching key to SettingsEnabled in editor_preview
    var closest_key = "preview_1";
    var closest_key_distance = 10000;
    for (var key in editor_preview1) {
        var distance = LevenshteinDistance(SettingsEnabled, editor_preview[key]["SettingsEnabled"]);
        if (distance < closest_key_distance) {
            closest_key = key;
            closest_key_distance = distance;
        }
    }
    console.log('Generated preview:\nSettings Enabled: "' + SettingsEnabled + '"\nClosest Match: "' + editor_preview1[closest_key]["SettingsEnabled"] + '"');

    // Preview the images
    set_preview(closest_key);

    if (editor_preview1[closest_key]["Images"]["Image_2"] != SettingsEnabled) {
        // Warning 1: Preview image is not a perfect match [more info]
    }
}

function set_preview(key) {
    // Remove old preview images
    $(".slider_img").each(function () {
        $(this).remove();
    });
    $(".img_slider-dot").each(function () {
        $(this).remove();
    });

    // Set new preview images
    var i = 0;
    if (key == "PreviewUnavailable") {
        i++;
        var html = '<div id="img_slider-1" class="slider_img active">';
        html += '<img class="slider_img2" src="./images/PreviewUnavailable.png"/></div>';
        $(".img_slider").prepend(html);
        var html2 = '<div class="img_slider-dot active"></div>';
        $(".img_slider-dots").prepend(html2);
    } else {
        var images = editor_preview1[key]["Images"];
        for (var key2 in images) {
            i++;
            // Set first image as active
            var active = "";
            if (i == 1) {
                active = "active";
            }

            var url = images[key2];
            if(images[key2] == ""){
                url = "./images/PreviewUnavailable.png";
            }

           // Add image
            var html = '<div id="img_slider-' + i + '" class="slider_img ' + active + '">';
            html += '<img class="slider_img2" src="' + url + '"/></div>';
            $(".img_slider").prepend(html);

            // Add dot
            var html2 = '<div class="img_slider-dot ' + active + '" onclick="SlideImage_dot(event)" value="' + i + '"></div>'
            $(".img_slider-dots").append(html2);
        }
    }

    // Update Values
    $(".img_slider").attr("value", "1");
    $(".img_slider").attr("max", i);

    // log to console
    console.log("Preview set to: " + key);
}

// On Editor Value updates
function ValueUpdate(type, id, value) {
    console.log("ValueUpdate:\ntype: " + type + ":\nid: " + id + "\nvalue: " + value);
    if (type == "switch") {
        if (id.startsWith("Setting_")) {
            generate_preview();
        }
    }
}

// On button click
function button_settings(event) {
    $("#popup_settings").addClass("is-visible");
    if (editor_settings1.constructor !== Object) {
        $("#editor_settings").val(editor_settings1);
    } else { 
        $("#editor_settings").val(JSON.stringify(editor_settings1, null, 2));
    }

    if (editor_preview1.constructor !== Object) {
        $("#editor_preview").val(editor_preview1);
    } else {
        $("#editor_preview").val(JSON.stringify(editor_preview1, null, 2));
    }
}
function button_createfile(event) {
    $("#popup_createfile").addClass("is-visible");
    build_consolevariable_ini();
}
function closepopup(event) {
    if ($(event.target).is(".popup-close") || $(event.target).is(".popup")) {
        $(".popup").removeClass("is-visible");
    }
    var data_id = $(event.target).attr("data-id");
    if (data_id == "settings") {
        try {
            var data = $("#editor_preview").val();
            editor_preview1 = JSON.parse(data);
        } catch (e) {
            console.log("Error parsing JSON for editor_preview1");
            editor_preview1 = data
        }
        try {
            data = $("#editor_settings").val();
            editor_settings1 = JSON.parse(data);
        } catch (e) {
            console.log("Error parsing JSON for editor_settings1");
            editor_settings1 = data
        }
        
        // Rebuild Editor
        $("#editor").html("");
        $("#editor").append(build_editor());
        // Rebuild Preview
        generate_preview();

        // log to console
        console.log("Settings Updated");
    }
}

function button_copy(event) {
    // Get id
    var id = $(event.target).attr("data-id");

    // Change text to Copied! for 2 seconds
    $(event.target).text("Copied!");
    setTimeout(function() {
        $(event.target).text("Copy");
    }, 2000);

    // Copy to clipboard
    var text = $("#" + id).val();
    var textarea = document.createElement('textarea');
    textarea.textContent = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();

    // log to console
    console.log("Copied " + id + " to clipboard");
}
// function button_download(event) {
//     // Get id
//     var id = $(event.target).attr("data-id");
//     var filename = $(event.target).attr("data-filename");

//     // Change text to Downloaded! for 2 seconds
//     $(event.target).text("Downloaded!");
//     setTimeout(function() {
//         $(event.target).text("Download");
//     }, 2000);

//     // Downloads ini file
//     var text = $("#" + id).text();
//     var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
//     let newLink = document.createElement("a");
//     newLink.download = filename;

//     if (window.webkitURL != null) {
//         newLink.href = window.webkitURL.createObjectURL(blob);
//     } else {
//         newLink.href = window.URL.createObjectURL(blob);
//         newLink.style.display = "none";
//         document.body.appendChild(newLink);
//     }
//     newLink.click();

//     // log to console
//     console.log("Downloaded " + filename);
// }
function button_reset(event) {
    // Get id
    var id = $(event.target).attr("data-id");

    // Change text to Reseted! for 2 seconds
    $(event.target).text("Reseted!");
    setTimeout(function() {
        $(event.target).text("Reset");
    }, 2000);

    // Reset var and text to default
    if (id == "editor_settings") {
        editor_settings1 = editor_settings;
        $("#editor_settings").val(JSON.stringify(editor_settings, null, 2));
    }
    if (id == "editor_preview") {
        editor_preview1 = editor_preview;
        $("#editor_preview").val(JSON.stringify(editor_preview, null, 2));
    }

    // log to console
    console.log("Reset " + id);
}
function button_process(event) {
    // Change text to Processed! for 2 seconds
    $(event.target).text("Processed!");
    setTimeout(function() {
        $(event.target).text("Process");
    }, 2000);

    // Process ini string
    var ini = $("#ini2json_1").val();
    ini = ini.replace(/\+CVars=/g, '')
    var json = {};
    // split by newline
    var lines = ini.split("\n");
    // remove empty lines and comments
    lines = lines.filter(function(line) {
        return line.trim() != "" && line.trim().startsWith(";") == false;
    }
    );

    for (var i = 0; i < lines.length; i++) {
        json["Variable_" + i] = {}
        // if line containts starts with TEXTUREGROUP
        if (lines[i].toLowerCase().startsWith("texturegroup")) {
            json["Variable_" + i]["Name"] = lines[i];
            json["Variable_" + i]["Type"] = "none";
        } else {
            var before = lines[i].substring(0, lines[i].indexOf("=")); 
            var after = lines[i].substring(lines[i].indexOf("=") + 1);
            json["Variable_" + i]["Name"] = before;
            if (before.indexOf(".") > -1) {
                before = before.replace(".", "_");
            }
            json["Variable_" + i]["Id"] = before;
            
            if (isNumber(after)) {
                json["Variable_" + i]["Type"] = "int";
                json["Variable_" + i]["Value"] = after;
                json["Variable_" + i]["Min"] = "0";
                json["Variable_" + i]["Max"] = "999";
                if (after.indexOf(".") > -1) {
                    json["Variable_" + i]["DataStep"] = 0.1;
                } else {
                    json["Variable_" + i]["DataStep"] = 1;
                }
            } else {
                json["Variable_" + i]["Type"] = "bool";
                json["Variable_" + i]["Value"] = after;
            }
        }
    }
    $("#ini2json_2").val(JSON.stringify(json, null, 2));
    // log to console
    console.log("Process ini2json");
}

// Toggle button
function switch_ValueUpdate(event) {
    event.target.value = event.target.checked;
    ValueUpdate("switch", event.target.id, event.target.value);
}

// Stepper functions
function stepper_oninput(event) {
    stepper_setInputButtonState();
    ValueUpdate("stepper", event.target.id, event.target.value);
}
function stepper_onblur(event) {
    const value = event.target.value;

    if (event.target.hasAttribute("min") && value < parseFloat(event.target.min))
        event.target.value = event.target.min;

    if (event.target.hasAttribute("max") && value > parseFloat(event.target.max))
        event.target.value = event.target.max;
    ValueUpdate("stepper", event.target.id, event.target.value);
}
function stepper_onbutton(event) {
    let button = event.target;
    let input = document.getElementById(button.dataset.inputId);

    if (input) {
        let value = parseFloat(input.value);
        let step = parseFloat(input.dataset.step);

        if (button.dataset.operation === "decrement") {
            value -= isNaN(step) ? 1 : step;
        } else if (button.dataset.operation === "increment") {
            value += isNaN(step) ? 1 : step;
        }

        if (input.hasAttribute("min") && value < parseFloat(input.min)) {
            value = input.min;
        }

        if (input.hasAttribute("max") && value > parseFloat(input.max)) {
            value = input.max;
        }

        if (input.value !== value) {
            stepper_setInputValue(input, value);
            input.value = value;
            ValueUpdate("stepper", button.dataset.inputId, value);
            stepper_setInputButtonState();
        }
    }
}
function stepper_setInputValue(input, value) {
    let newInput = input.cloneNode(true);
    const parentBox = input.parentElement.getBoundingClientRect();

    input.id = "";

    newInput.value = value;

    if (value > input.value) {
        // right to left
        input.parentElement.appendChild(newInput);
        input.style.marginLeft = -parentBox.width + "px";
    } else if (value < input.value) {
        // left to right
        newInput.style.marginLeft = -parentBox.width + "px";
        input.parentElement.prepend(newInput);
        window.setTimeout(function () {
            newInput.style.marginLeft = 0;
        }, 20);
    }

    window.setTimeout(function () {
        input.parentElement.removeChild(input);
    }, 250);
}
function stepper_setInputButtonState() {
    const inputs = document.getElementsByClassName("number-input-text-box");

    for (let input of inputs) {
        if (input.id.length > 0) {
            // during value transition the old input won't have an id
            const value = input.value;
            const parent = input.parentElement.parentElement;

            if (parent.children[0] && input.hasAttribute("min"))
                parent.children[0].disabled = value <= parseFloat(input.min);

            if (parent.children[2] && input.hasAttribute("max"))
                parent.children[2].disabled = value >= parseFloat(input.max);
        }
    }
}

// logo hovered
function logo(image) {
    image.src = "images/gear.png";
}
function logo_hovered(image) {
    image.src = "images/gear_hovered.png";
}

// Levenshtein distance
function LevenshteinDistance(a, b) {
    var split1 = a.split(" ");
    var split2 = b.split(" ");
    // Set longer array to split1
    if (split1.length < split2.length) {
        var temp = split1;
        split1 = split2;
        split2 = temp;
    }
    var distance = 0;
    for (var i = 0; i < split1.length; i++) {
        var found = false;
        for (var j = 0; j < split2.length; j++) {
            if (split1[i] == split2[j]) {
                found = true;
                break;
            }
        }
        if (!found) {
            distance++;
        }
    }
    return distance;
}

function isNumber(n) { return /^-?[\d.]+(?:e-?\d+)?$/.test(n); } 

// Preview image slider
function SlideImage(event) {
    var parent = event.target.parentElement;
    var value = parent.getAttribute("value");
    var max_value = parent.getAttribute("max");

    if (max_value == 1) {
        return;
    }

    // Determine next image
    var new_value = value;
    var className = event.target.className;
    if (className.includes("left")) {
        new_value--;
        if (new_value < 1) {
            new_value = max_value;
        }
    } else if (className.includes("right")) {
        new_value++;
        if (new_value > max_value) {
            new_value = 1;
        }
    }
    // Set new value to parent element
    parent.setAttribute("value", new_value);

    // Remove class "active" from old dot
    $('.img_slider-dot').each(function () {
        this.classList.remove("active");
    });

    // Add class "active" to new dot
    $('.img_slider-dot').each(function () {
        if (this.getAttribute("value") == new_value) {
            this.classList.add("active");
        }
    });

    // Set new image opacity to 1
    $('#img_slider-' + new_value).css('opacity', '1');

    // Set old image opacity to 0
    $('#img_slider-' + value).css('opacity', '0');

    // log to console
    console.log("Image Slider:\nNew image: " + new_value);
}
// if clicked on class "img_slider-dot"
function SlideImage_dot(event) {
    var parent = event.target.parentElement.parentElement;
    var value = parent.getAttribute("value");
    var new_value = event.target.getAttribute("value");
    if (new_value == value) {
        return;
    }

    // Set new value to parent element
    parent.setAttribute("value", new_value);

    // Remove class "active" from old dot
    $('.img_slider-dot').each(function () {
        this.classList.remove("active");
    });

    // Add class "active" to dot
    event.target.classList.add("active");

    // Set new image opacity to 1
    $('#img_slider-' + new_value).css('opacity', '1');

    // Set old image opacity to 0
    $('#img_slider-' + value).css('opacity', '0');

    // log to console
    console.log("Image Slider:\nNew image: " + new_value);
}



