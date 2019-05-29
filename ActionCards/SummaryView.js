var form;
var formResponses = {};
var imageQuestionId;

/*
onPageLoad(): Loads the response-results view of the card
*/
function onPageLoad() {
    KASClient.App.registerHardwareBackPressCallback(function() {
        KASClient.App.dismissCurrentScreen();
    });
    KASClient.App.getLocalizedStringsAsync(function(localizedStrings, error) {
        if (error != null) {
            return;
        }
        strings = localizedStrings;
        KASClient.Form.initFormAsync(function(formDetails, error) {
            if (error != null) {
                return;
            }
            form = formDetails;
            KASClient.Form.getMyFormResponsesAsync(function(responses, error) {
                if (error != null) {
                    return;
                }
                formResponses = responses[0];
                initializeEventListeners();
                setInitialText();

                for (var i = 0; i < form.questions.length; i++) {
                    var id = "ANSWER_" + (i + 1);
                    if (form.questions[i].type == 2) {
                        document.getElementById(id).innerText = form.questions[i].title;
                        document.getElementById(id).parentElement.lastElementChild.innerText = formResponses.questionToAnswerMap[i];
                    } else if (form.questions[i].type == 8) {
                        imageQuestionId = i;
                        showImagesIfAny();
                    } else if (form.questions[i].type == 4) {
                        document.getElementById(id).innerText = form.questions[i].title;
                        if (JSON.parse(formResponses.questionToAnswerMap[i]).n != "")
                            document.getElementById(id).parentElement.lastElementChild.innerText = JSON.parse(formResponses.questionToAnswerMap[i]).n;
                        else
                            document.getElementById(id).parentElement.lastElementChild.innerText = JSON.parse(formResponses.questionToAnswerMap[15]).lt + ',' + JSON.parse(formResponses.questionToAnswerMap[15]).lg
                    }
                }
            });
        });
    });
}

function initializeEventListeners() {
    var backButton = document.getElementById('back-button');
    backButton.addEventListener('click', KASClient.App.dismissCurrentScreen);
}

function setInitialText() {
    document.getElementById('header-label').textContent = strings['displayName'];
}

function showImagesIfAny() {
    var imageUrls = formResponses.questionToAnswerMap[imageQuestionId];
    var imageContainer = document.createElement('div');
    var id = "ANSWER_" + (imageQuestionId + 1);
    imageContainer.className = "images";
    var index = 0;
    document.getElementById(id).innerText = form.questions[imageQuestionId].title;
    if (imageUrls != "[]") {
        JSON.parse(imageUrls).forEach(function(imageUrl) {
            var imageDiv = document.createElement('img');
            if (imageUrl.ty == 1) {
                imageDiv.src = imageUrl.spu;
                imageDiv.addEventListener('click', showImageImmersiveView);
            } else if (imageUrl.ty == 3) {
                KASClient.Internal.generateThumbnailForPDFAsync(imageUrl.lpu, x => {
                    imageDiv.src = 'data:image/png;base64,' + x;
                }, true);
                imageDiv.addEventListener('click', openPDF);
            } else if (imageUrl.ty == 6) {
                imageDiv.className = "video";
                imageDiv.src = "play.png";
                imageDiv.addEventListener('click', openVideo);
            }

            imageDiv.id = index;
            imageContainer.appendChild(imageDiv);
            index++;
        });
    } else {
        document.getElementById(id).parentElement.lastElementChild.innerText = "NO IMAGES";
    }
    document.getElementById(id).appendChild(imageContainer);
}

function openPDF(event) {
    var imageUrls = JSON.parse(formResponses.questionToAnswerMap[imageQuestionId]);
    KASClient.App.openLinkInBrowser(imageUrls[event.target.id].spu);
}

function openVideo(event) {
    var imageUrls = JSON.parse(formResponses.questionToAnswerMap[imageQuestionId]);
    attachment = KASClient.KASAttachmentFactory.fromJSON(imageUrls[event.target.id]);
    KASClient.App.openAttachmentImmersiveView(attachment);
}
/*
showImageImmersiveView(event): Open the full image
*/
function showImageImmersiveView(event) {
    var imageUrls = formResponses.questionToAnswerMap[imageQuestionId];
    var attachments = [];
    JSON.parse(imageUrls).forEach(function(imageUrl) {
        attachments.push(imageUrl.lpu);
    });
    KASClient.App.showImageImmersiveView(attachments, parseInt(event.target.id));
}