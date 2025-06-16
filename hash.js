const bcrypt = require('bcryptjs');

const password = 'ZahJaf@321';
const hash = bcrypt.hashSync(password, 10);

console.log('Hash for password:', password);
console.log(hash);