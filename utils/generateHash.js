const bcrypt = require('bcrypt');

async function generate() {
    const curatorPassword = '123456';          // Пароль для входа куратора в админку
    const studentTempPin = '1234';             // Временный PIN для учеников (они его сменят при первом входе)

    const passwordHash = await bcrypt.hash(curatorPassword, 10);
    const pinHash = await bcrypt.hash(studentTempPin, 10);

    console.log('Куратор (пароль 123456):', passwordHash);
    console.log('Ученик (PIN 1234):', pinHash);
}

generate();