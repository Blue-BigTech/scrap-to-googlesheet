const axios = require('axios');
const appID = "f884040f-e63e-4411-b719-3e783a56246a"
const tblName = "Sunroof"
const apiKey = "V2-LLNRU-9isZM-tSdhw-nDOMO-l2Mym-RQVLq-L6TPL-1gPpk"
const url = 'https://api.appsheet.com/api/v2/apps/' + appID + '/tables/'+ tblName +'/Action?applicationAccessKey=' + apiKey
const read = () => {
    axios({
        method: 'post',
        url: url,
        data: {
            "Action": "Find",
            "Properties": {
                "Locale": "en-US",
            },
            "Rows": [
            ]
        }
    }).then(response => {
        console.log(response.data)
    })
}

const write = () => {
    axios({
        method: 'post',
        url: url,
        data: {
            "Action": "Edit",
            "Properties": {
                "Locale": "en-US",
            },
            "Rows": [
                {
                    "Id": "1",
                    "Total hours": 111,
                    "Total Sqft": 222,
                    "Total KW": 100.235,
                }
            ]            
        }
    }).then(response => {
        console.log(response.data)
    })
}
read()
// write()