const path = require('path');
module.exports = {
    mode:'development',
    entry:path.resolve(__dirname,'src/MVVM_entry.js'),
    output: {
        path: path.resolve(__dirname,'dist'),
        filename: 'MVVM.js'
    }
}