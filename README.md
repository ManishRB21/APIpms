#APIpms
## How to use on postman
## GET req : localhost:3000/checkin
- output 
```json
{
    "count": 2,
    "guests": [
        {
            "id": 1,
            "name": "manish",
            "roomId": 200
        },
        {
            "id": 2,
            "name": "m r behera",
            "roomId": 12
        }
    ]
}
```
## GET req : on the basis of room number localhost:3000/checkin/room/:roomId
- output
```json
{
    "status": "success",
    "data": {
        "id": 2,
        "guests": [
            {
                "name": {
                    "prefix": null,
                    "first": "m",
                    "middle": "r",
                    "last": "behera",
                    "suffix": null,
                    "full": [
                        "m",
                        "r",
                        "behera"
                    ]
                },
                "balance": null,
                "language": null,
                "email": "mrb@t.com",
                "phone": 123456,
                "no_post": null,
                "vip_status": null,
                "id": 2,
                "checkout": null,
                "option": null,
                "channel_preference": null
            }
        ],
        "folios": {}
    }
}
```
## POST req : localhost:3000/checkin
- input
```json
{
    "name":"manish",
    "roomId":200
}
```
- output 
```json
{
    "Subscription": 1,
    "request": {
        "type": "checkin",
        "room": 200,
        "checkin": {
            "room": 200,
            "guest": null
        },
        "source": {
            "type": "live"
        },
        "created": "2023-03-25T11:36:00.677Z"
    },
    "response": {
        "statusCode": 200,
        "statusMessage": "success"
    }
}
``` 
## POST req : localhost:3000/checkin2
- input
```json
{
        "name" : "m r behera",
        "roomId": 12,
        "lang ": "en_US",
        "email": "mrb@t.com",
        "phone": 123456
}
```
- output
```json
{
    "Subscription": 2,
    "request": {
        "type": "checkin",
        "room": 12,
        "checkin": {
            "room": 12,
            "guest": null
        },
        "source": {
            "type": "live"
        },
        "created": "2023-03-25T11:37:36.357Z"
    },
    "response": {
        "statusCode": 200,
        "statusMessage": "success"
    }
}
```
## DELETE req : on the basis of room number localhost:3000/checkin/room/:roomId
- output
```json
{
    "response": {
        "statusCode": 200,
        "statusMessage": "success"
    }
}
```


