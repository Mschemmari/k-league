import * as cherio from 'cheerio'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
const URLS = {
    leaderBoard: 'https://kingsleague.pro/estadisticas/clasificacion/'
}

const scrape = async (url) => {
    const res = await fetch(url)
    const html = await res.text()
    return cherio.load(html)
}

const getLeaderBoard = async () => {
    const $ = await scrape(URLS.leaderBoard)
    const $rows = $('table tbody tr')

    const LEADERBOARD_SELECTORS = {
        team: { selector: '.fs-table-text_3', typeof: 'string' },
        wins: { selector: '.fs-table-text_4', typeof: 'number' },
        loses: { selector: '.fs-table-text_5', typeof: 'number' },
        scoredGoals: { selector: '.fs-table-text_6', typeof: 'number' },
        concededGoals: { selector: '.fs-table-text_7', typeof: 'number' },
        yelloCards: { selector: '.fs-table-text_8', typeof: 'number' },
        redCards: { selector: '.fs-table-text_9', typeof: 'number' },
    }

    const cleanText = text => text
        .replace(/\t|\n|\s:/g, '')
        .replace(/.*:/g, ' ')
        .trim()

    const leadBoardSelectorEntries = Object.entries(LEADERBOARD_SELECTORS)
    let leaderBoard = []
    $rows.each((_, el) => {
        const leaderBoardEntries = leadBoardSelectorEntries.map(([key, { selector, typeOf }]) => {
            const rawValue = $(el).find(selector).text()
            const cleanedValue = cleanText(rawValue)

            const value = typeOf === 'number'
                ? Number(cleanedValue)
                : cleanedValue

            return [key, value]
        })
        leaderBoard.push(Object.fromEntries(leaderBoardEntries))
    })
    return leaderBoard
}

const leaderBoard = await getLeaderBoard()
const filePath = path.join(process.cwd(), 'db/leaderboard.json')
await writeFile(filePath, JSON.stringify(leaderBoard, null, 2), 'utf-8')
