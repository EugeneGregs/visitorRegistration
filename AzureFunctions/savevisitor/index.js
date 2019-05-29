var sql = require("mssql");
module.exports = function (context, req) {
    context.log(' Save To DB Function Started');
    const resData = req.body.data.responseDetails.responseWithQuestions;
    let filling_person_name = resData[0].answer;
    let filling_person_contact = resData[1].answer;
    let filling_person_role = resData[2].answer;
    let visitor_name = resData[3].answer;
    let id_number = resData[4].answer;
    let phone_number = resData[5].answer;
    let visit_reason = resData[6].answer;
    let visit_date = resData[7].answer;
    let visit_time = resData[8].answer;
    let image_url = resData[9].answer[0].mediaUrl;
    let visit_location = resData[10].answer;
    let dbCompatibleDate = (new Date(`${visit_date} ${visit_time}`).toLocaleString()).replace(/,/g, "");
    let visit_status = 1;
    
    const config = {
        user: 'Eugene@kaizalaprojects-server',
        password: 'r6r5bb!!',
        server: 'kaizalaprojects-server.database.windows.net',
        database: 'kaizalaProjectsdb',
     
        options: {
            encrypt: true 
        }
    }

    saveVisitorDetails();

    function saveVisitorDetails() {
        var locJson = typeof visit_location == "object" ? visit_location : JSON.parse(visit_location);
        var lat = locJson.lt;
        var lng = locJson.lg;
        var loc = locJson.n;

        
        var query = `INSERT INTO dbo.security_visitor_details (
            visitor_name,
            visitor_phone,
            national_id,
            visit_reason,
            visit_date,
            visitor_id_image_url,
            visit_status,
            visit_lat,
            visit_lng,
            visit_loc,
            filling_person_name,
            filling_person_phone,
            filling_person_role
            )
            VALUES (
            '${visitor_name}',
            '${phone_number}',
            '${id_number}',
            '${visit_reason}',
            '${dbCompatibleDate}',
            '${image_url}',
            '${visit_status}',
            '${lat}',
            '${lng}',
            '${loc}',
            '${filling_person_name}',
            '${filling_person_contact}',
            '${filling_person_role}'
        );SELECT SCOPE_IDENTITY()`;

        saveToDb(query);

    }

    function saveToDb(query) {
        context.log(query);
        sql.connect(config).then(() => {
            return sql.query(query)
        }).then(result => {
            context.log(result);
            sql.close();
            context.done();
        }).catch(err => {
            context.log(err)
            context.res = {
                body: err
            }
            sql.close();
            context.done();
        })
        
        sql.on('error', err => {
            context.log(err)
            context.res = {
                body: err
            }
            sql.close();
            context.done();
        })
        
    }
}