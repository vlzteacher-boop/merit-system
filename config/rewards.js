const rewards = [
    {
        id: 1,
        key: 'no_uniform',
        title: 'День без школьной формы',
        printTitle: 'День без школьной формы',
        description: 'Один учебный день можно прийти без школьной формы.',
        cost: 10,
        category: 'Свобода'
    },
    {
        id: 2,
        key: 'no_board',
        title: 'Не отвечать у доски',
        printTitle: 'Не отвечать у доски',
        description: 'Один раз можно отказаться от ответа у доски. Не действует на контрольные и зачёты.',
        cost: 12,
        category: 'Урок'
    },
    {
        id: 3,
        key: 'music_break',
        title: 'Музыка на перемене',
        printTitle: 'Музыка на перемене',
        description: 'Выбери один подходящий трек для общей перемены.',
        cost: 8,
        category: 'Перемена'
    },
    {
        id: 4,
        key: 'first_in_canteen',
        title: 'Первым в столовую',
        printTitle: 'Первым в столовую',
        description: 'Один раз можно пройти первым в очередь.',
        cost: 6,
        category: 'Бонус'
    },
    {
        id: 5,
        key: 'teacher_seat',
        title: 'Место учителя на урок',
        printTitle: 'Место учителя на урок',
        description: 'Один урок можно сидеть за учительским столом, если учитель разрешит.',
        cost: 15,
        category: 'Урок'
    },
    {
        id: 6,
        key: 'homework_pass',
        title: 'Пропуск домашнего задания',
        printTitle: 'Пропуск домашнего задания',
        description: 'Можно не выполнять одно обычное домашнее задание. Не действует на проекты и контрольные.',
        cost: 20,
        category: 'Учёба'
    },
    {
        id: 7,
        key: 'choose_seat',
        title: 'Выбрать любое место',
        printTitle: 'Выбрать место в классе',
        description: 'На один учебный день выбираешь свободное место в классе.',
        cost: 8,
        category: 'Свобода'
    },
    {
        id: 8,
        key: 'five_minutes',
        title: '+5 минут к перемене',
        printTitle: '+5 минут к перемене',
        description: 'Дополнительная пятиминутная пауза по согласованию с учителем.',
        cost: 25,
        category: 'Для класса'
    },
    {
        id: 9,
        key: 'class_game',
        title: '10 минут игры с классом',
        printTitle: '10 минут игры с классом',
        description: 'В конце урока — короткая игра, если учебный план позволяет.',
        cost: 30,
        category: 'Для класса'
    },
    {
        id: 10,
        key: 'vip_day',
        title: 'VIP-день',
        printTitle: 'VIP-день',
        description: 'Без формы + первым в столовую + выбор места на один день.',
        cost: 40,
        category: 'Спец'
    }
];

function getRewards() {
    return rewards.map(r => ({ ...r }));
}

function getRewardByKey(key) {
    return rewards.find(r => r.key === String(key));
}

function getRewardById(id) {
    return rewards.find(r => Number(r.id) === Number(id));
}

module.exports = {
    getRewards,
    getRewardByKey,
    getRewardById
};
