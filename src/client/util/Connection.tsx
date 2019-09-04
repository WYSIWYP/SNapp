import Config from './Config';

export default class Connection {
    static async get(path: string, body: any = {}){
        if(Object.keys(body).length>0){
            path += `?${Object.keys(body).map(key=>`${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(body[key]))}`).join('&')}`;
        }
        return await (await fetch(`${Config.baseURL}/${path}`)).json();
    }
    static async post(path: string, body: any = {}){
        return await (await fetch(`${Config.baseURL}/${path}`,{
            method: 'post',
            body: JSON.stringify(body),
        })).json();
    }
}
