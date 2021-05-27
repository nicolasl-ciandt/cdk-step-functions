import { APIGatewayProxyResult } from 'aws-lambda'

/* eslint-disable  @typescript-eslint/require-await*/
export const handler = async (): Promise<any> => {

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        serviceName: 'test',
        version: 'test',
        status: 'SUCCEEDED',
        guid: "12121",
        waitSeconds: 10,
        WaitTime: {
            time: "10"
        }
    }
}
