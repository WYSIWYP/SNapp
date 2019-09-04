export default class Config {
    static baseURL: string;

    static setup(){
        Config.baseURL = "http://localhost:8081/api"
    }
}
Config.setup();
