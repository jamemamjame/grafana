module.exports = {
    entry: "/src/module.ts",
    mode: "development",
    output: {
        path: '/Users/aphankosol/.go/src/github.com/grafana/grafana/data/plugins/whitefalcon/dist',
        filename: "bundle.js"
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".json"]
    },
    module: {
        rules: [
            // all files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'
            { test: /\.tsx?$/, use: ["ts-loader"], exclude: /node_modules/ }
        ]
    }
}
