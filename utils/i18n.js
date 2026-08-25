const translations = {
    ru: {
        common: {
            appName: 'MERIT',
            ru: 'RU',
            en: 'EN',
            logout: 'Выйти',
            class: 'Класс',
            student: 'Ученик',
            students: 'Ученики',
            balance: 'Баланс',
            merits: 'меритов',
            merit: 'merit',
            number: '№',
            reason: 'за что',
            serverError: 'Ошибка сервера',
            unavailable: 'Сервер недоступен. Попробуй ещё раз.'
        },
        student: {
            loginTitle: 'Вход ученика — MERIT',
            loginSubtitle: 'Вход для учеников',
            loginCard: 'Войти в аккаунт',
            chooseClass: 'Выбери класс',
            noClasses: 'Классы не найдены',
            journalNumber: 'Номер в журнале',
            pin: 'PIN-код',
            login: 'Войти',
            checking: 'Проверяем…',
            notFound: 'Ученик не найден',
            wrongPin: 'Неверный PIN-код',
            loginFailed: 'Не удалось войти',
            balanceLabel: 'Твой баланс',
            shop: 'Магазин',
            rewardsAvailable: 'наград',
            noRewards: 'Пока нет доступных наград',
            noRewardsText: 'Администратор ещё не активировал магазин.',
            buy: 'Купить',
            needMore: 'Ещё {amount}',
            purchases: 'Мои покупки',
            emptyPurchases: 'Пока пусто',
            emptyPurchasesText: 'Здесь появятся купленные награды.',
            purchaseSuccessTitle: 'Готово — награда куплена',
            purchaseSuccessText: '{title}. Осталось {balance} merit.',
            purchaseFailedTitle: 'Покупка не выполнена',
            purchaseFailed: 'Не удалось купить награду',
            purchaseUnavailableTitle: 'Не удалось оформить покупку'
        },
        teacher: {
            loginTitle: 'Вход учителя — MERIT',
            loginSubtitle: 'Вход для учителя',
            loginCard: 'Кабинет учителя',
            email: 'Email',
            password: 'Пароль',
            login: 'Войти',
            invalidLogin: 'Неверный email, пароль или роль',
            dashboardTitle: 'Кабинет учителя',
            students: 'Ученики',
            add: 'Начислить',
            amountPlaceholder: '+5',
            reasonPlaceholder: 'за что',
            noStudents: 'В этом классе пока нет учеников',
            success: 'Мериты начислены',
            invalidData: 'Некорректные данные',
            wrongClass: 'Ученик не относится к выбранному классу',
            addError: 'Ошибка начисления меритов'
        },
        curator: {
            loginTitle: 'Вход куратора — MERIT',
            loginSubtitle: 'Вход для куратора',
            loginCard: 'Кабинет куратора',
            email: 'Email',
            password: 'Пароль',
            login: 'Войти',
            invalidLogin: 'Неверный email, пароль или роль',
            dashboardTitle: 'Кабинет куратора',
            myClass: 'Мой класс',
            noClasses: 'За куратором пока не закреплено ни одного класса.',
            journal: 'Классный журнал',
            print: 'Напечатать билеты',
            issue: 'Выдать',
            tickets: 'Билеты к выдаче',
            noTickets: 'Нет билетов, ожидающих печати',
            noStudents: 'В этом классе пока нет учеников',
            add: 'Начислить',
            amountPlaceholder: '+5',
            reasonPlaceholder: 'за что',
            success: 'Мериты начислены',
            invalidData: 'Некорректные данные',
            forbiddenClass: 'Этот класс не закреплён за куратором',
            wrongStudentClass: 'Ученик не относится к выбранному классу',
            noPrintOrders: 'Нет заказов для печати',
            printError: 'Ошибка генерации PDF',
            issueError: 'Ошибка выдачи',
            reissueError: 'Ошибка перевыпуска',
            earnedQuarter: 'Заработано за четверть',
            earned: 'Заработано',
            statsPeriod: 'Период статистики',
            earnedYear: 'Заработано за учебный год',
            earnedAllTime: 'Заработано всего',
            quarterShort: '{number} четверть'
        },
        status: {
            pending_print: 'Ждёт печати',
            printed: 'Напечатан',
            issued: 'Выдан',
            used: 'Использован',
            void: 'Аннулирован'
        },
        purchase: {
            notAuthorized: 'Не авторизован',
            noReward: 'Не указана награда',
            rewardMissing: 'Награда не найдена или отключена',
            insufficient: 'Не хватает {amount} мерит.',
            generic: 'Ошибка при покупке'
        }
    },
    en: {
        common: {
            appName: 'MERIT',
            ru: 'RU',
            en: 'EN',
            logout: 'Log out',
            class: 'Class',
            student: 'Student',
            students: 'Students',
            balance: 'Balance',
            merits: 'merits',
            merit: 'merit',
            number: 'No.',
            reason: 'reason',
            serverError: 'Server error',
            unavailable: 'The server is unavailable. Please try again.'
        },
        student: {
            loginTitle: 'Student Login — MERIT',
            loginSubtitle: 'Student login',
            loginCard: 'Sign in',
            chooseClass: 'Choose a class',
            noClasses: 'No classes found',
            journalNumber: 'Journal number',
            pin: 'PIN code',
            login: 'Sign in',
            checking: 'Checking…',
            notFound: 'Student not found',
            wrongPin: 'Incorrect PIN code',
            loginFailed: 'Could not sign in',
            balanceLabel: 'Your balance',
            shop: 'Shop',
            rewardsAvailable: 'rewards',
            noRewards: 'No rewards are available yet',
            noRewardsText: 'The administrator has not activated the shop yet.',
            buy: 'Buy',
            needMore: '{amount} more',
            purchases: 'My purchases',
            emptyPurchases: 'Nothing here yet',
            emptyPurchasesText: 'Your purchased rewards will appear here.',
            purchaseSuccessTitle: 'Done — reward purchased',
            purchaseSuccessText: '{title}. You have {balance} merit left.',
            purchaseFailedTitle: 'Purchase not completed',
            purchaseFailed: 'Could not purchase the reward',
            purchaseUnavailableTitle: 'Could not complete the purchase'
        },
        teacher: {
            loginTitle: 'Teacher Login — MERIT',
            loginSubtitle: 'Teacher login',
            loginCard: 'Teacher dashboard',
            email: 'Email',
            password: 'Password',
            login: 'Sign in',
            invalidLogin: 'Incorrect email, password, or role',
            dashboardTitle: 'Teacher dashboard',
            students: 'Students',
            add: 'Award',
            amountPlaceholder: '+5',
            reasonPlaceholder: 'reason',
            noStudents: 'There are no students in this class yet',
            success: 'Merits awarded',
            invalidData: 'Invalid data',
            wrongClass: 'The student does not belong to the selected class',
            addError: 'Could not award merits'
        },
        curator: {
            loginTitle: 'Curator Login — MERIT',
            loginSubtitle: 'Curator login',
            loginCard: 'Curator dashboard',
            email: 'Email',
            password: 'Password',
            login: 'Sign in',
            invalidLogin: 'Incorrect email, password, or role',
            dashboardTitle: 'Curator dashboard',
            myClass: 'My class',
            noClasses: 'No classes are assigned to this curator yet.',
            journal: 'Class register',
            print: 'Print tickets',
            issue: 'Issue',
            tickets: 'Tickets to issue',
            noTickets: 'No tickets are waiting to be printed',
            noStudents: 'There are no students in this class yet',
            add: 'Award',
            amountPlaceholder: '+5',
            reasonPlaceholder: 'reason',
            success: 'Merits awarded',
            invalidData: 'Invalid data',
            forbiddenClass: 'This class is not assigned to the curator',
            wrongStudentClass: 'The student does not belong to the selected class',
            noPrintOrders: 'There are no orders to print',
            printError: 'PDF generation failed',
            issueError: 'Could not issue the ticket',
            reissueError: 'Could not reissue the ticket',
            earnedQuarter: 'Earned this quarter',
            earned: 'Earned',
            statsPeriod: 'Statistics period',
            earnedYear: 'Earned this school year',
            earnedAllTime: 'Earned all time',
            quarterShort: 'Quarter {number}'
        },
        status: {
            pending_print: 'Awaiting print',
            printed: 'Printed',
            issued: 'Issued',
            used: 'Redeemed',
            void: 'Cancelled'
        },
        purchase: {
            notAuthorized: 'Not authorized',
            noReward: 'No reward was selected',
            rewardMissing: 'Reward not found or inactive',
            insufficient: '{amount} more merits required.',
            generic: 'Purchase failed'
        }
    }
};

function normalizeLanguage(value) {
    return value === 'en' ? 'en' : 'ru';
}

function getByPath(object, path) {
    return path.split('.').reduce((current, part) => {
        if (current && Object.prototype.hasOwnProperty.call(current, part)) {
            return current[part];
        }
        return undefined;
    }, object);
}

function interpolate(text, params = {}) {
    return String(text).replace(/\{(\w+)\}/g, (_, key) => {
        return params[key] !== undefined ? String(params[key]) : `{${key}}`;
    });
}

function createTranslator(language) {
    const lang = normalizeLanguage(language);

    return (key, params = {}) => {
        const value =
            getByPath(translations[lang], key) ??
            getByPath(translations.ru, key) ??
            key;

        return interpolate(value, params);
    };
}

module.exports = {
    translations,
    normalizeLanguage,
    createTranslator
};
