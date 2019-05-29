var request = require("request");
var sql = require("mssql");
module.exports = function (context, req) {
    context.log(' Save To DB Function Started');
    const resData = req.body.data.responseDetails.responseWithQuestions;
    let name_of_reporting_person;
    let reporting_person_phone;
    let incident_category;
    let incident_title;
    let incident_location;
    let incident_affected;
    let incident_id;
    let incident_date_and_time;
    let from_user_id = req.body.fromUserId;
    const refreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cm46bWljcm9zb2Z0OmNyZWRlbnRpYWxzIjoie1wicGhvbmVOdW1iZXJcIjpcIisyNTQ3MDU1NTAwNjRcIixcImNJZFwiOlwiXCIsXCJ0ZXN0U2VuZGVyXCI6XCJmYWxzZVwiLFwiYXBwTmFtZVwiOlwiY29tLm1pY3Jvc29mdC5tb2JpbGUua2FpemFsYWFwaVwiLFwiYXBwbGljYXRpb25JZFwiOlwiNjI5MjM5NmEtYmFiNy00ZjU3LTlmMWQtNWQxZTJjZTkyMTVhXCIsXCJwZXJtaXNzaW9uc1wiOlwiOC40XCIsXCJhcHBsaWNhdGlvblR5cGVcIjotMSxcImRhdGFcIjpcIntcXFwiQXBwTmFtZVxcXCI6XFxcIkphbWlpIFRlbGtvbVxcXCJ9XCJ9IiwidWlkIjoiTW9iaWxlQXBwc1NlcnZpY2U6ZjJjODhiZGYtZWI4OS00NzIxLWI2MTUtOTc2ODYxMDQ0NDJiIiwidmVyIjoiMiIsIm5iZiI6MTU1MDQ5NjY1MywiZXhwIjoxNTgyMDMyNjUzLCJpYXQiOjE1NTA0OTY2NTMsImlzcyI6InVybjptaWNyb3NvZnQ6d2luZG93cy1henVyZTp6dW1vIiwiYXVkIjoidXJuOm1pY3Jvc29mdDp3aW5kb3dzLWF6dXJlOnp1bW8ifQ.wGByd_0lm4cwm_wgx59UGzK9mB8L_WasX_rxH1FQZek"

    const config = {
        user: 'Eugene@kaizalaprojects-server',
        password: 'r6r5bb!!',
        server: 'kaizalaprojects-server.database.windows.net',
        database: 'kaizalaProjectsdb',
     
        options: {
            encrypt: true 
        }
    }

    // resData[0].title == "Name of injured person" ? savePersonnel() : resData[0].title == "Name of reporting person" ? saveNotification(): saveCargo();
    
    if( resData[0].title == "Name of reporting person" ) {
        saveNotification();
    } else if( resData[1].title == "Name of injured person"){
        savePersonnel();
    } else {
        saveCargo();
    }

    function saveNotification() {
        // const name_of_reporting_person = resData[0].answer;
        const reporting_person_check = resData[1].answer;
        const incident_type = resData[2].answer;
        incident_location = resData[3].answer;
        const specific_location = resData[4].answer;
        const brief_summary = resData[5].answer;
        incident_date_and_time = resData[6].answer;
        name_of_reporting_person = resData[0].answer;
        reporting_person_phone = resData[8].answer;
        incident_affected = "Incident: " + incident_type;
        const incident_status = 1;
        incident_category = incident_type;

        var userIdshort = from_user_id.split("-")[1];
        var timspshort = incident_date_and_time.toString().substr(4);
        incident_id = userIdshort + "-" + timspshort;

        var query = `INSERT INTO dbo.kpa_incidents (
            location_of_incident,
            specific_location,
            brief_summary,
            name_of_reporting_person,
            reporting_person_check,
            reporting_person_phone,
            incident_status,
            incident_number,
            incident_type
            )
            VALUES (
            '${incident_location}',
            '${specific_location}',
            '${brief_summary}',
            '${name_of_reporting_person}',
            '${reporting_person_check}',
            '${reporting_person_phone}',
            '${incident_status}',
            '${incident_id}',
            '${incident_type}'
        );SELECT SCOPE_IDENTITY()`;

        saveToDb(query);

    }
   
    function savePersonnel() {
        const name_of_injured_person = resData[1].answer;
        const injured_person_check_number = resData[2].answer;
        const injury_extent = resData[3].answer;
        const part_of_body_injured = resData[4].answer;
        const injured_person_working_area = resData[5].answer;
        const injured_person_designation = resData[6].answer;
        const injury_caused_by = resData[7].answer ? resData[7].answer : resData[8].answer;
        const injury_causative_agent = resData[9].answer ? resData[9].answer : resData[10].answer;
        const location_of_incident = resData[11].answer;
        const specific_location = resData[12].answer;
        incident_title = name_of_injured_person + " injured at " + location_of_incident;
        incident_affected = "CASUALTY: " + name_of_injured_person;
        incident_location = location_of_incident;
        const brief_summary = resData[13].answer;
        incident_date_and_time = resData[14].answer;
        const attachment_url_array = resData[15].answer;
        const attachment_url = attachment_url_array ? attachment_url_array[0].mediaUrl + "/" + attachment_url_array[0].mediaFileName : "attachmentimage.jpg"
        name_of_reporting_person = resData[16].answer;
        reporting_person_phone = resData[17].answer;
        incident_id = resData[0].answer;
        incident_category = "Personnel";
        const incident_status = 6;
        
        // var userIdshort = from_user_id.split("-")[1];
        // var timspshort = incident_date_and_time.toString().substr(4);
        // incident_id = userIdshort + "-" + timspshort;

        var query = `UPDATE dbo.kpa_incidents SET 
            incident_category = '${incident_category}',
            name_of_injured_person = '${name_of_injured_person}',
            injured_person_check_number = '${injured_person_check_number}',
            injury_extent = '${injury_extent}',
            part_of_body_injured = '${part_of_body_injured}',
            injured_person_working_area = '${injured_person_working_area}',
            injured_person_designation = '${injured_person_designation}',
            injury_caused_by = '${injury_caused_by}',
            injury_causative_agent = '${injury_causative_agent}',
            location_of_incident = '${location_of_incident}',
            specific_location = '${specific_location}',
            brief_summary = '${brief_summary}',
            attachment_url = '${attachment_url}',
            name_of_reporting_person = '${name_of_reporting_person}',
            reporting_person_phone = '${reporting_person_phone}',
            incident_status = '${incident_status}' 
            WHERE incident_number = '${incident_id}';`;
            
        saveToDb(query, "personnel");
    }

    function saveCargo() {
        const damage_category = resData[1].answer;
        const equipment_involved = resData[2].answer;
        const equipment_marks = resData[3].answer;
        const operator_involved = resData[4].answer;
        const operator_check_number = resData[5].answer;
        const operator_designation = resData[6].answer;
        const operator_working_area = resData[7].answer;
        const location_of_incident = resData[8].answer;
        const specific_location = resData[9].answer;
        incident_title = equipment_involved + " Damaged at " + location_of_incident;
        incident_affected = "EQUIPMENT: " + equipment_involved;
        incident_location = location_of_incident;
        const brief_summary = resData[10].answer;
        incident_date_and_time = resData[11].answer;
        const attachment_url_array = resData[12].answer;
        const attachment_url = attachment_url_array ? attachment_url_array[0].mediaUrl + "/" + attachment_url_array[0].mediaFileName : "cargoImage.jpg"
        name_of_reporting_person = resData[13].answer;
        reporting_person_phone = resData[14].answer;
        incident_id = resData[0].answer;
        incident_category = "Cargo/Machinery";
        const incident_status = 6;

        // var userIdshort = from_user_id.split("-")[1];
        // var timspshort = incident_date_and_time.toString().substr(4);
        // incident_id = userIdshort + "-" + timspshort;

        var query = `UPDATE dbo.kpa_incidents SET
            incident_category = '${incident_category}',
            damage_category = '${damage_category}',
            equipment_involved = '${equipment_involved}',
            equipment_marks = '${equipment_marks}',
            name_of_operator = '${operator_involved}',
            operator_check_number = '${operator_check_number}',
            operator_designation = '${operator_designation}',
            operator_working_area = '${operator_working_area}',
            location_of_incident = '${location_of_incident}',
            specific_location = '${specific_location}',
            brief_summary = '${brief_summary}',
            attachment_url = '${attachment_url}',
            name_of_reporting_person = '${name_of_reporting_person}',
            reporting_person_phone = '${reporting_person_phone}',
            incident_status = '${incident_status}'
            WHERE incident_number = '${incident_id}';`;

        saveToDb(query, "cargo");
    }

    function saveToDb(query, sendAction) {
        context.log(query);
        sql.connect(config).then(() => {
            return sql.query(query)
        }).then(result => {
            // let idArray = Object.values(result.recordsets[0][0]);
            // context.log(idArray[0]);
            // incident_id = idArray[0];
            context.log(result);
            sql.close();
            if(sendAction) {
                context.log("Done saving...");
                context.done();
            }
            sendActionToUserWithoutError();
        }).catch(err => {
            context.log(err)
            // sendActionToUserWithError();
            context.res = {
                body: err
            }
            sql.close();
            context.done();
        })
        
        sql.on('error', err => {
            context.log(err)
            // sendActionToUserWithError();
            context.res = {
                body: err
            }
            sql.close();
            context.done();
        })
        
    }

    function sendActionToUserWithoutError(){
        const data = {
            "groupId": "ec8b65a6-a746-4000-ae64-92c84c102e5c",
            "subscriberNumber": reporting_person_phone,
            "propertiesArray": [
                {
                    "name":"incidentCategory",
                    "value":"CATEGORY: " + incident_category + " Incident",
                    "type":"Text"
                },
                {
                    "name":"incidentaffected",
                    "value": incident_affected,
                    "type":"Text"
                },
                {
                    "name":"location",
                    "value": "LOCATION: " + incident_location,
                    "type":"Text"
                },
                {
                    "name":"incidentId",
                    "value": "INCIDENT ID: " + incident_id,
                    "type":"Text"
                },
                {
                    "name":"incidentStatus",
                    "value":"STATUS: Pending",
                    "type":"Text"
                },
                {
                    "name":"approxWait",
                    "value":"APPROXIMATE WAITING: 5 minutes",
                    "type":"Text"
                }
            ],
            "actionId": "com.kpa.incidentstatus.2",
            "appSecret": "X7UAXNS5F9",
            "appId": "6292396a-bab7-4f57-9f1d-5d1e2ce9215a",
            "refreshToken": refreshToken,
            "sendToAll": false,
            "incident_id": incident_id
        }
        const options = {
            uri: /*'http://localhost:7071/api/sendActioncard',*/ 'https://safety-incidents-app.azurewebsites.net/api/sendActioncard?code=xSaMGcIftsValMnVekDClKjYvwcGus4Kosswcl74qwrffu0eEhJSvA==',
            method: 'POST',
            json: data
        };

        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
              context.log("Done");
              context.res = {
                body: body
                };
              context.done();
            }
        });
    }

    function sendActionToUserWithError(){
        const data = {
            "subscriberName": name_of_reporting_person,
            "subscriberPhone": reporting_person_phone,
            "error": "true"
        }
        const options = {
            uri: 'http://localhost:7071/api/sendCardToSubscriber',
            method: 'POST',
            json: data
        };

        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
              context.log("Done");
              return;
            }
        });
    }
};