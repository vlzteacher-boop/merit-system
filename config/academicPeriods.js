/**
 * Учебные периоды MERIT.
 *
 * Фактические даты четвертей школы:
 *
 * I   : 1 сентября — 30 октября
 * II  : 9 ноября — 23 декабря
 * III : 11 января — 5 марта
 * IV  : 15 марта — 25 июня
 *
 * Даты окончания включительные.
 *
 * Учебный год для статистики:
 *   1 сентября — 25 июня включительно.
 *
 * Во время каникул колонка «за четверть» показывает
 * последнюю завершённую четверть.
 */

function startOfDay(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

function makeDate(year, monthIndex, day) {
    return new Date(
        year,
        monthIndex,
        day,
        0,
        0,
        0,
        0
    );
}

function getAcademicContext(now = new Date()) {
    const current =
        startOfDay(now);

    const month =
        current.getMonth();

    const year =
        current.getFullYear();

    /*
     * Новый учебный год начинается 1 сентября.
     *
     * Январь–август относятся к учебному году,
     * который начался в предыдущем календарном году.
     */
    const academicStartYear =
        month >= 8
            ? year
            : year - 1;

    const academicEndYear =
        academicStartYear + 1;


    // ------------------------------------------------------------
    // УЧЕБНЫЙ ГОД
    //
    // SQL использует:
    // created_at >= academicYearStart
    // created_at < academicYearEnd
    //
    // Поэтому 26 июня 00:00 — техническая граница,
    // чтобы 25 июня учитывалось целиком.
    // ------------------------------------------------------------

    const academicYearStart =
        makeDate(
            academicStartYear,
            8,
            1
        );

    const academicYearEnd =
        makeDate(
            academicEndYear,
            5,
            26
        );


    // ------------------------------------------------------------
    // ЧЕТВЕРТИ
    //
    // end — НЕ включительная техническая дата.
    // Например, I четверть заканчивается 30 октября включительно,
    // значит end = 31 октября 00:00.
    // ------------------------------------------------------------

    const quarters = [
        {
            number: 1,

            start:
                makeDate(
                    academicStartYear,
                    8,
                    1
                ),

            end:
                makeDate(
                    academicStartYear,
                    9,
                    31
                )
        },

        {
            number: 2,

            start:
                makeDate(
                    academicStartYear,
                    10,
                    9
                ),

            end:
                makeDate(
                    academicStartYear,
                    11,
                    24
                )
        },

        {
            number: 3,

            start:
                makeDate(
                    academicEndYear,
                    0,
                    11
                ),

            end:
                makeDate(
                    academicEndYear,
                    2,
                    6
                )
        },

        {
            number: 4,

            start:
                makeDate(
                    academicEndYear,
                    2,
                    15
                ),

            end:
                makeDate(
                    academicEndYear,
                    5,
                    26
                )
        }
    ];


    // ------------------------------------------------------------
    // ТЕКУЩАЯ ЧЕТВЕРТЬ
    // ------------------------------------------------------------

    let selectedQuarter =
        quarters.find(
            quarter =>
                current >= quarter.start &&
                current < quarter.end
        );


    // ------------------------------------------------------------
    // КАНИКУЛЫ
    //
    // Если сегодня не входит ни в одну четверть,
    // показываем последнюю уже завершившуюся четверть.
    //
    // Примеры:
    // 31 октября — 8 ноября   -> I
    // 24 декабря — 10 января -> II
    // 6 марта — 14 марта     -> III
    // 26 июня — 31 августа   -> IV
    // ------------------------------------------------------------

    if (!selectedQuarter) {

        const completedQuarters =
            quarters.filter(
                quarter =>
                    current >= quarter.end
            );

        if (completedQuarters.length > 0) {

            selectedQuarter =
                completedQuarters[
                    completedQuarters.length - 1
                ];

        } else {

            /*
             * Теоретический fallback.
             * Для нормального учебного календаря практически
             * не используется.
             */
            selectedQuarter =
                quarters[0];
        }
    }


    return {
        academicStartYear,
        academicEndYear,

        academicYearStart,
        academicYearEnd,

        quarterNumber:
            selectedQuarter.number,

        quarterStart:
            selectedQuarter.start,

        quarterEnd:
            selectedQuarter.end,

        quarters,

        academicYearLabel:
            `${academicStartYear}/${String(
                academicEndYear
            ).slice(-2)}`
    };
}


module.exports = {
    getAcademicContext
};
