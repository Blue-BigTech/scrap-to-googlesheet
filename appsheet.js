const axios = require('axios');

const url = 'https://api.appsheet.com/api/v2/apps/c3cc4f34-fbd3-4874-b02d-fb62343bf80d/tables/sunroof/Action?applicationAccessKey=V2-7JulX-pqnrF-oDwlD-NsCai-1hJhS-uQ5YN-1ah6d-iRxFC'
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
                {
                    "Id": "1",
                    "Bills": "450",
                }
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
write()