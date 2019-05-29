//-------------------------------------------------
var form;
var currentUserInfo = null;
var isValidPhoneNumber = true;
var optionsJson = {};
var attachments = [];
var feedbackStarRating = 0;
var current_page = 1;
var optionalArray = [];
var strings = null;

var _isLocationRefreshing = false;
var _currentLocation = {};
var _postalCode = "";
var _district = "";
var _isLocationRefreshing = false;
var _longAddress = "";
var _shortAddress = "";
var _isLocationNotFetched = true;
var LOCATION_TIMEOUT = 10000;
var _isAnonymous = false;

/*
onPageLoad(): Loads the creation view of the card
*/
function onPageLoad() {
    KASClient.App.getLocalizedStringsAsync(function(localizedStrings, error) {
        if (error != null) {
            return;
        }
        for (var i = 1; i <= TOTAL_PAGES; i++) {
            if (i == 1)
                document.getElementById("page_" + i).className = "show-page";
            else
                document.getElementById("page_" + i).className = "hide-page";
        }
        strings = localizedStrings;
        KASClient.Form.initFormAsync(function(formDetails, error) {
            if (error != null)
                return;
            form = formDetails;
            setHeader();
            if (SHOW_SUBMIT_IN_HEADER_SINGLEPAGE && TOTAL_PAGES == 1) {
                document.getElementById('submit').textContent = strings['submitString'];
                setFooterButtons(-1);
                document.getElementById('submit').addEventListener('click', submitData);
            } else {
                document.getElementById('footer-submit').textContent = strings['submitString'];
                document.getElementById('footer-submit').addEventListener('click', submitData);
            }
            setFooterButtons(current_page);

            var elements = document.getElementById('container').getElementsByTagName('*');
            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];

                if (strings[element.id + '_placeholder']) {
                    element.placeholder = strings[element.id + '_placeholder'];
                }

                if (strings[element.id + '_sideicon']) {
                    element.parentElement.lastElementChild.style.backgroundImage = "url(" + strings[element.id + '_sideicon'] +
                        ")";
                }

                if (element.id.startsWith("CHECKBOX") && element.id.indexOf("_") == -1) {
                    setEventListeners(element);
                } else if (element.nodeName.toLowerCase() == "select") {
                    setOptionsToSelectElement(element);
                } else if (element.nodeName.toLowerCase() == "input") {
                    if (element.type == "range")
                        initializeSlider(element);
                    else if (element.type == "time") {
                        var requiredElement = element.parentElement.parentElement.children[1];
                        requiredElement.innerText = strings[requiredElement.id + "_placeholder"];
                    } else if (element.type == "date") {
                        var requiredElement = element.parentElement.parentElement.children[1];
                        requiredElement.innerText = strings[requiredElement.id + "_placeholder"];
                    }
                } else if (element.title == "TapBasedSlider") {
                    addTapBasedSlider(element);
                } else if (element.title == "StarRating") {
                    setStarRating(0, element);
                } else if (strings[element.id]) {
                    element.innerText = strings[element.id];
                }
            }
            setOptionalEvents();
            checkOptionalQuestions();
            if (document.getElementById("attachment-img"))
                document.getElementById("attachment-img").addEventListener('click', addAttachment);
            if (document.getElementById("location")) {
                refreshLocation();
                document.getElementById("refresh-location-text").innerText = strings["RefreshLocationText"];
            }
            autoFillDetails();
        });
    });
}

function refreshLocation() {
    if (_isLocationRefreshing == true)
        return;
    _isLocationRefreshing = true
    KASClient.App.getCurrentDeviceLocationAsync(function(location, error) {
        if (error != null) {
            _isLocationRefreshing = false;
            inflateLocationView();
            return;
        }

        _currentLocation = JSON.parse(location);
        fetchAndPopulateAddress();
    });

    setTimeout(function() {
        if (_isLocationRefreshing == true) {
            _isLocationRefreshing = false;
            inflateLocationView();
        }
    }, LOCATION_TIMEOUT);
}

// Fetching address from location
function fetchAndPopulateAddress() {
    if (_currentLocation.hasOwnProperty("lt") == true && _currentLocation.hasOwnProperty("lg") == true) {

        var params = new KASClient.KASLocationAddressParams();
        params.latitude = _currentLocation["lt"];
        params.longitude = _currentLocation["lg"];
        KASClient.App.getLocationAddressAsync(params,
            function(address, error) {
                if (!error) {
                    populateAddress(address);
                }

                _isLocationRefreshing = false;
                inflateLocationView();


            });
    } else {
        inflateLocationView();
    }
}

function populateAddress(address) {
    _longAddress = address["formatted_address"];

    var state = "";
    _district = "";
    _postalCode = "";
    var address_components = address["address_components"];
    for (var component in address_components) {
        var types = address_components[component]["types"];
        for (var type in types) {
            if (types[type] == "administrative_area_level_2") {
                _district = address_components[component]["long_name"];
            } else if (types[type] == "administrative_area_level_1") {
                state = address_components[component]["long_name"];
            } else if (types[type] == "postal_code") {
                _postalCode = address_components[component]["long_name"];
            }
        }
    }
    _shortAddress = "";
    if (_postalCode != "") {
        _shortAddress += _postalCode + ", ";
    }
    if (_district != "") {
        _shortAddress += _district + ", ";
    }
    if (state != "") {
        _shortAddress += state;
    }
}

function inflateLocationView() {
    var locationMapView = document.getElementById('location');
    if (!_isAnonymous && _currentLocation.hasOwnProperty("lt") == true && _currentLocation.hasOwnProperty("lg") == true) {
        var params = new KASClient.KASLocationStaticMapImageParams();
        params.latitude = _currentLocation["lt"];
        params.longitude = _currentLocation["lg"];

        KASClient.App.getMapImageAsBase64Async(params, function(attachmentString, error) {
            if (!error) {
                locationMapView.src = "data:image/jpeg;base64," + attachmentString;
                //use blobString as base64 data
            }
        });

    }
    var locationAddress = document.getElementById('location_text');

    if (!(_currentLocation.hasOwnProperty("lt") == true && _currentLocation.hasOwnProperty("lg") == true)) {
        if (!_isLocationRefreshing) {
            locationAddress.innerText = strings["LocNotFound"];
        } else {
            locationAddress.innerText = strings["LocWaitText"];
        }
    } else {
        if (_longAddress == "" && _shortAddress == "") {
            if (_isAnonymous) {
                locationAddress.innerText = strings["NoLocation"];
            } else {
                locationAddress.innerText = _currentLocation["lt"] + ", " + _currentLocation["lg"];
            }
        } else {
            if (_isAnonymous) {
                locationAddress.innerText = _shortAddress;
            } else {
                locationAddress.innerText = _longAddress == "" ? _shortAddress : _longAddress;
            }
        }
    }
    _currentLocation["n"] = locationAddress.innerText;

}

function setOptionalEvents() {

    for (var page_id = 1; page_id <= TOTAL_PAGES; page_id++) {
        var pageId = "page_" + page_id;
        if (OPTIONAL_IDS[pageId]) {
            for (var i = 0; i < OPTIONAL_IDS[pageId].length; i++) {
                optionalArray.push(OPTIONAL_IDS[pageId][i]);
            }
        }
    }
    for (var j = 0; j < submitIds.length; j++) {
        if (!optionalArray.includes(submitIds[j])) {
            document.getElementById(submitIds[j]).addEventListener('change', checkOptionalQuestions);
            document.getElementById(submitIds[j]).addEventListener('keyup', checkOptionalQuestions);
        }
    }

    for (var k = 0; k < optionalArray.length; k++) {
        document.getElementById(optionalArray[k]).parentElement.firstElementChild.innerText += " (Optional)";
    }
}

function checkOptionalQuestions() {
    var pageId = "page_" + current_page;
    var j = 0;
    var disableFlag = 0;
    for (; j < submitIds.length; j++) {
        if (!optionalArray.includes(submitIds[j]) && elementExistsInPage(pageId, submitIds[j])) {
            if (document.getElementById(submitIds[j]).value == "" || document.getElementById(submitIds[j]).value == strings["DEFAULT_SELECT_OPTION"] ||
                document.getElementById(submitIds[j]).value == undefined) {
                disableNextButton(current_page);
                disableFlag = 1;
                break;
            }
        }
    }
    if (disableFlag == 0)
        enableNextButton(current_page);
}

function elementExistsInPage(pageId, elementId) {
    var nodes = document.getElementById(pageId).querySelectorAll('*');
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].id == elementId)
            return true;
    }
    return false;
}

/*
setInitialText(): Sets the static text in the page
*/
function setHeader() {
    document.getElementById('header-label').textContent = strings['displayName'];
    var backButton = document.getElementById('back-button');
    backButton.addEventListener('click', KASClient.App.dismissCurrentScreen);
}

function setEventListeners(element) {
    var allOptionLabels = element.querySelectorAll("label");

    for (var j = 1; j <= allOptionLabels.length; j++) {
        var optionName = strings[allOptionLabels[j - 1].id];
        allOptionLabels[j - 1].innerText = optionName;
    }

    var allOptionDivs = element.querySelectorAll("div");
    element.value = allOptionLabels[0].innerText;
    for (var j = 1; j <= allOptionDivs.length; j++) {
        var optionName = strings[allOptionDivs[j - 1].id];
        allOptionDivs[j - 1].onclick = manageCheckBoxes;
    }
}

function manageCheckBoxes(event) {
    var current = event.target.id;
    var parent = document.getElementById(current.split('_')[0]);

    var allOptionLabels = parent.querySelectorAll("label");

    for (var j = 0; j < allOptionLabels.length; j++) {
        if (current == allOptionLabels[j].id) {
            allOptionLabels[j].className = "selected-label";
            parent.value = strings[current];
        } else {
            allOptionLabels[j].className = 'unselected-label';
        }
    }
}

function setDateTimeEventListeners(element) {
    element.addEventListener('change', removePlaceholder);
}

function setSwitchValue(event) {
    var checkBox = event.target.parentElement.querySelectorAll('input[type="checkbox"]')[0];
    if (checkBox.value == "true")
        checkBox.value = "false";
    else
        checkBox.value = "true";
}
/*
addAttachment(): Allows user to add attachment from device
*/
function addAttachment() {
    KASClient.App.showAttachmentPickerAsync([KASClient.KASAttachmentType.Image, KASClient.KASAttachmentType.Document], null, function(selectedAttachments, error) {
        if (error != null) {
            return;
        }
        for (var i = 0; i < selectedAttachments.length; i++) {
            if (attachments.length < MAX_ATTACHMENT_COUNT) {
                showSelectedImage(selectedAttachments[i]);
                attachments.push(selectedAttachments[i]);

                var attachmentIcon = document.getElementById("attachment-img");
                if (attachments.length >= MAX_ATTACHMENT_COUNT) {
                    attachmentIcon.parentElement.style.display = "none";
                }
            }
        }
    });
}

/*
showSelectedImage(attachment): Show the attachment as thumbnails
*/
function showSelectedImage(attachment) {
    var descriptionImage;
    var horizontalAttachmentDiv = document.getElementById("horizontal-attachment-div");
    if (attachment.type == KASClient.KASAttachmentType.Image) {
        descriptionImage = document.createElement("img");
        descriptionImage.className = "section-selected-img";
        descriptionImage.id = attachments.length;
        descriptionImage.src = attachment.localPath;
    } else {
        descriptionImage = getDocumentThumbnail(attachment);
    }

    var cancelImage = document.createElement("img");
    cancelImage.className = "cancel-img";
    cancelImage.id = attachment.localPath;
    cancelImage.onclick = function() {
        removeSpecificAttachment();
    };

    var imageDiv = document.createElement("div");
    imageDiv.className = "img-div";
    imageDiv.id = attachment.localPath + "div";
    imageDiv.appendChild(descriptionImage);
    imageDiv.appendChild(cancelImage);
    horizontalAttachmentDiv.insertBefore(imageDiv, horizontalAttachmentDiv.lastElementChild);
}

function getDocumentThumbnail(attachment) {
    var descriptionImage = document.createElement("div");
    descriptionImage.className = "section-selected-img";
    descriptionImage.id = attachment.localPath + "image";

    var documentDiv = document.createElement("div");
    documentDiv.className = "doc-video-audio-type";
    if (attachment.type == KASClient.KASAttachmentType.Audio) {
        documentDiv.innerHTML = "AUDIO";
    } else if (attachment.type == KASClient.KASAttachmentType.Video) {
        documentDiv.innerHTML = "VIDEO";
    } else {
        documentDiv.innerHTML = "DOCUMENT";
    }

    var documentName = document.createElement("div");
    documentName.className = "doc-video-audio-name";
    documentName.innerHTML = attachment.fileName;

    var fileExt = attachment.fileName.split('.').pop().toLowerCase();
    var documentIcon = document.createElement("img");
    documentIcon.className = "document-icon";
    documentIcon.src = getIconName(fileExt);

    var documentSize = document.createElement("div");
    documentSize.className = "doc-video-audio-size";
    documentSize.innerText = attachment.size / 1000 + " KB";

    var iconSizeDiv = document.createElement("div");
    iconSizeDiv.style.display = "flex";
    iconSizeDiv.appendChild(documentIcon);
    iconSizeDiv.appendChild(documentSize);
    descriptionImage.appendChild(documentDiv);
    descriptionImage.appendChild(documentName);
    descriptionImage.appendChild(iconSizeDiv);
    return descriptionImage;
}

function getIconName(attachmentExtension) {
    switch (attachmentExtension) {
        case "pdf":
            return "pdf.png";
        case "ppt":
        case "pptx":
            return "ppt.png";
        case "xls":
        case "xlsx":
            return "excel.png";
        case "doc":
        case "docx":
            return "word.png";
        default:
            return "document.png";
    }
}
/*
removeSpecificAttachment(): Remove an attachment
*/
function removeSpecificAttachment() {
    var value = event.target.id;

    var imgDiv = document.getElementById(value + "div");
    var horizontalAttachmentDiv = document.getElementById("horizontal-attachment-div");
    horizontalAttachmentDiv.removeChild(imgDiv);

    var pathIndex = attachments.map(function(e) { return e.localPath; }).indexOf(value);
    attachments.splice(pathIndex, 1);

    var attachmentIcon = document.getElementById("attachment-img");
    if (attachments.length < MAX_ATTACHMENT_COUNT) {
        attachmentIcon.parentElement.style.display = "block";
    }
}

function setOptionsToSelectElement(element) {
    var options = [];
    var el = document.createElement("option");
    el.textContent = strings["DEFAULT_SELECT_OPTION"];
    el.selected = true;
    el.disabled = true;
    element.appendChild(el);

    for (var i = 0; i < Object.keys(strings).length; i++) {
        if (Object.keys(strings)[i].startsWith(element.id)) {
            options.push(Object.keys(strings)[i]);
        }
    }
    options.sort();

    for (var i = 0; i < options.length; i++) {
        var opt = strings[options[i]].trim();
        var el = document.createElement("option");
        el.textContent = opt;
        element.appendChild(el);
    }
}

/*
submitData(): Submit data to Kaizala
*/
function submitData() {
    var questionToAnswerMap = {};
    var i = 0;
    var idIterator = 0;

    for (; i < form.questions.length; i++) {
        if (form.questions[i].type == 2) {
            questionToAnswerMap[i] = document.getElementById(submitIds[idIterator]).value;
            idIterator++;
        } else if (form.questions[i].type == 8) {
            questionToAnswerMap[i] = attachments;
        } else if (form.questions[i].type == 4) {
            if (!_currentLocation.hasOwnProperty("lt")) {
                _currentLocation["lt"] = 0.0;
            }
            if (!_currentLocation.hasOwnProperty("lg")) {
                _currentLocation["lg"] = 0.0;
            }
            if (!_currentLocation.hasOwnProperty("n")) {
                _currentLocation["n"] = "";
            }
            questionToAnswerMap[i] = _currentLocation;
        }
    }
    KASClient.Form.sumbitFormResponse(questionToAnswerMap, null, false, true, false);
}

/*
navigateToNextPage(): Goes to next page if any
*/
function navigateToNextPage() {
    var pages = document.getElementById('container').querySelectorAll('div[type="page"]');
    var changeNext = false;
    pages.forEach(function(page) {
        if (changeNext) {
            page.classList.replace("hide-page", "show-page");
            changeNext = false;
            current_page = parseInt(page.id.split('_')[1]);
        } else if (page.classList.contains("show-page")) {
            if (parseInt(page.id.split('_')[1]) < TOTAL_PAGES) {
                page.classList.replace("show-page", "hide-page");
                changeNext = true;
            }
        }
    });
    setFooterButtons(current_page);
    checkOptionalQuestions();
}

/*
navigateToNextPage(): Goes to next page if any
*/
function navigateToPreviousPage() {
    var pages = document.getElementById('container').querySelectorAll('div[type="page"]');
    var changeNext = false;
    [].slice.call(pages, 0).reverse().forEach(function(page) {
        if (changeNext) {
            page.classList.replace("hide-page", "show-page");
            changeNext = false;
            current_page = parseInt(page.id.split('_')[1]);
        } else if (page.classList.contains("show-page")) {
            if (parseInt(page.id.split('_')[1]) > 1) {
                page.classList.replace("show-page", "hide-page");
                changeNext = true;
            }
        }
    });
    setFooterButtons(current_page);
    checkOptionalQuestions();
}

function setFooterButtons(current_page) {
    if (current_page == -1) {
        document.getElementById("footer").style.display = 'none';
    }
    if (current_page == 1)
        document.getElementById("previous-page").disabled = true;
    else
        document.getElementById("previous-page").disabled = false;

    if (current_page == TOTAL_PAGES) {
        document.getElementById("next-page").disabled = true;
        document.getElementById("next-page").style.display = 'none';
        document.getElementById('footer-submit').style.display = 'block';
    } else {
        document.getElementById("next-page").style.display = 'block';
        document.getElementById('footer-submit').style.display = 'none';
        document.getElementById("next-page").disabled = false;
    }
    document.getElementById("progressbar-inner-div").style.width = (current_page * 100 / TOTAL_PAGES) + '%';
    document.getElementById("progress-text").innerText = current_page + " of " + TOTAL_PAGES;
}

function disableNextButton(current_page) {
    document.getElementById("next-page").disabled = true;
    document.getElementById('footer-submit').style.pointerEvents = "none";
    document.getElementById('submit').style.pointerEvents = "none";
    document.getElementById('footer-submit').style.color = "#c0c0c0";
    document.getElementById('submit').style.color = "#c0c0c0";
}


function enableNextButton(current_page) {
    document.getElementById("next-page").disabled = false;
    document.getElementById('footer-submit').style.pointerEvents = "all";
    document.getElementById('submit').style.pointerEvents = "all";
    document.getElementById('footer-submit').style.color = "#ffffff";
    document.getElementById('submit').style.color = "#0078d4";
}

function setStarRating(rating, ratingContainer) {
    // cache the selected star rating to be used while form submission.
    feedbackStarRating = rating;
    var widthOfEachStar = 0;
    var totalWidth = ratingContainer.clientWidth;
    ratingContainer.value = rating;
    checkOptionalQuestions();
    while (ratingContainer.firstChild) {
        ratingContainer.removeChild(ratingContainer.firstChild);
    }


    //render new star rating
    for (var i = 1; i <= 5; i++) {
        var star = document.createElement('img');
        star.classList.add(i <= rating ? 'star-on' : 'star-off');
        // the id of the star is to identify the star that is clicked.
        star.id = ratingContainer.id + "_" + i;
        star.addEventListener('click', selectStar);
        ratingContainer.appendChild(star);
        widthOfEachStar = star.clientWidth;
    }
    if (rating > 0) {
        ratingContainer.parentElement.lastElementChild.style.marginLeft = ((rating * totalWidth / 10) - (widthOfEachStar / 2)) + 'px';
        ratingContainer.parentElement.lastElementChild.innerText = rating;
    }
    // validateSubmitButton();
}

function event_click(element) {
    element.parentElement.lastElementChild.firstElementChild.click();
    element.parentElement.lastElementChild.firstElementChild.focus();
}

function change_date_format(element) {  
    var options = {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    var date = new Date(element.value);
    var requiredElement = element.parentElement.parentElement.children[1];
    if (element.value == "") {
        requiredElement.innerText = strings[requiredElement.id + "_placeholder"];
        requiredElement.value = "";
    } else {
        requiredElement.innerText = date.toLocaleDateString('en-US', options);
        requiredElement.value = date.toLocaleDateString('en-US', options);
    }
    checkOptionalQuestions();
}

function change_time_format(element) {
    var time = element.value;
    var requiredElement = element.parentElement.parentElement.children[1];
    if (element.value == "") {
        requiredElement.innerText = strings[requiredElement.id + "_placeholder"];
        requiredElement.value = "";
    } else {
        requiredElement.innerText = time;
        requiredElement.value = time;
    }
    checkOptionalQuestions();
}

function selectStar(event) {
    var starId = event.target.id;
    var starValue = parseInt(starId.split("_")[1]);
    setStarRating(starValue, event.target.parentElement);
}

function initializeSlider(element) {
    var output = element.parentElement.getElementsByTagName("input")[1];

    element.min = SLIDER_ELEMENT_DETAILS[element.id].min;
    element.max = SLIDER_ELEMENT_DETAILS[element.id].max;
    element.value = SLIDER_ELEMENT_DETAILS[element.id].value;
    output.value = element.value;

    element.oninput = function() {
        output.value = this.value;
    }
    output.onchange = function() {
        element.value = this.value;
    }

    element.parentElement.firstElementChild.innerText += " (" + element.min + " - " + element.max + ")";
}

function addTapBasedSlider(element) {
    var options = [];
    var labels = [];
    for (var i = 0; i < Object.keys(strings).length; i++) {
        if (Object.keys(strings)[i].startsWith(element.id)) {
            options.push(Object.keys(strings)[i]);
        }
    }
    options.sort();
    for (var i = 0; i < options.length; i++) {
        labels.push(strings[options[i]].trim());
    }
    var row = element.insertRow(0);
    for (var i = 0; i < labels.length; i++) {
        var col = row.insertCell(i);
        col.innerText = labels[i];
        col.classList.add('feedback-slider-options');
        col.style.width = 100 / labels.length + '%';
        col.onclick = setFeedbackLabel;
        if (i == parseInt(labels.length / 2)) {
            col.style.fontWeight = "bold";
            element.parentElement.lastElementChild.lastElementChild.style.width = (i + 1) * 100 / labels.length + '%';
            element.value = labels[i];
        }
    }
}

function setFeedbackLabel(event) {
    var curElement = 0;
    for (i = 0; i < event.target.parentElement.childElementCount; i++) {
        event.target.parentElement.childNodes[i].style.fontWeight = 'normal';
        if (event.target == event.target.parentElement.childNodes[i])
            curElement = i;
    }
    event.target.style.fontWeight = 'bold';
    event.target.parentElement.parentElement.parentElement.value = event.target.innerText;
    event.target.parentElement.parentElement.parentElement.parentElement.lastElementChild.lastElementChild.style.width = ((curElement + 1) * 100 / event.target.parentElement.childElementCount) + '%';
}

function autoFillDetails() {
    KASClient.App.getCurrentUserIdAsync(function(userId, error) {
        if (error != null) {
            return;
        }
        KASClient.App.getUsersDetailsAsync([userId], function(users, error) {
            if (error != null) {
                return;
            }
            currentUserInfo = users[userId];
            AUTO_FILL_FIELDS.forEach((keyValuePair) => {
                if (keyValuePair["name"] != null) {
                    var nameId = keyValuePair["name"];
                    document.getElementById(nameId).value = currentUserInfo.originalName;
                } else if (keyValuePair["contact"] != null) {
                    var contactId = keyValuePair["contact"];
                    document.getElementById(contactId).value = currentUserInfo.phoneNumber;
                }
            });
        });
    });
}

function removePlaceholder(event) {
    if (event.target.value != "") {
        event.target.placeholder = "";
        // var options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
        // var date = new Date(event.target.value);
        // event.target.value = date.toLocaleDateString('en-US', options);
    } else {
        if (strings[event.target.id + "_placeholder"])
            event.target.placeholder = strings[event.target.id + "_placeholder"];
    }
}