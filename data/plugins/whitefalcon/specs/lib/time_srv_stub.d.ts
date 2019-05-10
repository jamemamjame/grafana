export default class TimeSrvStub {
    init: any;
    time: {
        from: string;
        to: string;
    };
    timeRange(parse: any): {
        from: any;
        to: any;
    };
    replace(target: any): any;
    setTime(time: any): void;
}
