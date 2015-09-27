/**
 * Created by airrex on 9/21/15.
 */

var qs = require('querystring');

var s = qs.stringify({thing: 'http://localhost:3000/'});
console.log(s);