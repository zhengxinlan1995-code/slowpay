// 慢薪 · iPhone 桌面小组件
// 安装：将本文件放入 iCloud Drive/Scriptable，然后在桌面添加 Scriptable 小组件并选择本脚本。

const APP_URL = 'https://zhengxinlan1995-code.github.io/slowpay/?action=start-slack'
const ART_URL = 'https://zhengxinlan1995-code.github.io/slowpay/widget-crayon-bg.webp?v=2'
const STORE_KEY = 'slowpay-widget-settings-v1'

const holidayDates = new Set([
  '2026-01-01', '2026-01-02', '2026-01-03',
  '2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', '2026-02-21', '2026-02-22', '2026-02-23',
  '2026-04-04', '2026-04-05', '2026-04-06',
  '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05',
  '2026-06-19', '2026-06-20', '2026-06-21',
  '2026-09-25', '2026-09-26', '2026-09-27',
  '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07',
])
const makeupDates = new Set(['2026-01-04', '2026-02-14', '2026-02-28', '2026-05-09', '2026-09-20', '2026-10-10'])

function dateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isWorkday(date) {
  const key = dateKey(date)
  if (makeupDates.has(key)) return true
  if (holidayDates.has(key)) return false
  return date.getDay() !== 0 && date.getDay() !== 6
}

function monthWorkdays(date) {
  const cursor = new Date(date.getFullYear(), date.getMonth(), 1)
  let total = 0
  while (cursor.getMonth() === date.getMonth()) {
    if (isWorkday(cursor)) total += 1
    cursor.setDate(cursor.getDate() + 1)
  }
  return total
}

function minutesOf(value) {
  const [hour, minute] = String(value).split(':').map(Number)
  return hour * 60 + minute
}

function todayProgress(now, settings) {
  if (!isWorkday(now)) return 0
  const current = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
  const start = minutesOf(settings.start)
  const end = minutesOf(settings.end)
  const lunchStart = 12 * 60
  const lunchEnd = lunchStart + settings.lunch
  const total = Math.max(1, end - start - settings.lunch)
  let elapsed = Math.max(0, Math.min(current, end) - start)
  elapsed -= Math.max(0, Math.min(current, lunchEnd) - Math.max(start, lunchStart))
  return Math.max(0, Math.min(1, elapsed / total))
}

async function loadSettings() {
  if (Keychain.contains(STORE_KEY)) return JSON.parse(Keychain.get(STORE_KEY))
  return await editSettings({ salary: 10000, start: '09:30', end: '18:30', lunch: 60 })
}

async function editSettings(current) {
  const alert = new Alert()
  alert.title = '慢薪小组件设置'
  alert.message = '这些信息只保存在你的 iPhone 上。'
  alert.addTextField('每月税前工资', String(current.salary))
  alert.addTextField('上班时间，例如 09:30', current.start)
  alert.addTextField('下班时间，例如 18:30', current.end)
  alert.addTextField('午休分钟', String(current.lunch))
  alert.addAction('保存')
  const result = await alert.presentAlert()
  if (result < 0) return current
  const next = {
    salary: Math.max(0, Number(alert.textFieldValue(0)) || 0),
    start: alert.textFieldValue(1) || '09:30',
    end: alert.textFieldValue(2) || '18:30',
    lunch: Math.max(0, Number(alert.textFieldValue(3)) || 0),
  }
  Keychain.set(STORE_KEY, JSON.stringify(next))
  return next
}

function money(amount) {
  return `¥${amount.toFixed(2)}`
}

function addText(stack, value, size, color, weight = 'regular') {
  const text = stack.addText(value)
  text.font = weight === 'bold' ? Font.boldRoundedSystemFont(size) : Font.regularRoundedSystemFont(size)
  text.textColor = new Color(color)
  return text
}

async function loadArtwork() {
  try {
    return await new Request(ART_URL).loadImage()
  } catch {
    return null
  }
}

async function makeWidget(settings) {
  const now = new Date()
  const workdays = monthWorkdays(now)
  const daily = settings.salary / Math.max(1, workdays)
  const earned = daily * todayProgress(now, settings)
  const workingMinutes = Math.max(1, minutesOf(settings.end) - minutesOf(settings.start) - settings.lunch)
  const hourly = daily / (workingMinutes / 60)
  const widget = new ListWidget()
  widget.url = APP_URL
  widget.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1000)
  widget.setPadding(14, 15, 14, 15)
  const artwork = await loadArtwork()
  if (artwork) {
    widget.backgroundImage = artwork
  } else {
    widget.backgroundGradient = new LinearGradient()
    widget.backgroundGradient.colors = [new Color('#F5F0DF'), new Color('#DDE5CF')]
    widget.backgroundGradient.locations = [0, 1]
  }

  const header = widget.addStack()
  header.centerAlignContent()
  header.backgroundColor = new Color('#F8F2DD', 0.82)
  header.cornerRadius = 9
  header.setPadding(4, 7, 4, 7)
  const symbol = SFSymbol.named('fish.fill').image
  const fish = header.addImage(symbol)
  fish.imageSize = new Size(13, 13)
  fish.tintColor = new Color('#285842')
  header.addSpacer(5)
  addText(header, '慢薪 · 摸鱼记薪', 11, '#263B2D', 'bold')

  widget.addSpacer(9)
  addText(widget, money(earned), config.widgetFamily === 'small' ? 25 : 30, '#20342A', 'bold')
  const subtitle = addText(widget, isWorkday(now) ? `今日到账 · ${money(hourly)}/小时` : '今天休息，工资也要喘口气', 10, '#647064')
  subtitle.lineLimit = 1

  widget.addSpacer()
  const action = widget.addStack()
  action.url = APP_URL
  action.centerAlignContent()
  action.backgroundColor = new Color('#E7C75E')
  action.cornerRadius = 12
  action.setPadding(8, 11, 8, 11)
  const coffee = action.addImage(SFSymbol.named('cup.and.saucer.fill').image)
  coffee.imageSize = new Size(12, 12)
  coffee.tintColor = new Color('#234735')
  action.addSpacer(6)
  addText(action, '开始摸鱼  ↗', 11, '#234735', 'bold')
  return widget
}

let settings = await loadSettings()
if (!config.runsInWidget) {
  const menu = new Alert()
  menu.title = '慢薪小组件'
  menu.message = '设置完成后，请在 iPhone 桌面添加 Scriptable 小组件并选择 SlowPayWidget。'
  menu.addAction('预览小组件')
  menu.addAction('修改工资与时间')
  const choice = await menu.presentSheet()
  if (choice === 1) settings = await editSettings(settings)
}

const widget = await makeWidget(settings)
if (config.runsInWidget) Script.setWidget(widget)
else await widget.presentMedium()
Script.complete()
