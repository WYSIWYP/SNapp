export default class Config {
    static baseURL: string;

    static setup(){
        Config.baseURL = "http://localhost:3000"
    }
}
Config.setup();
