---
read_when:
    - Ви хочете ізолювати OpenClaw від свого основного середовища macOS
    - Вам потрібна інтеграція iMessage в ізольованому середовищі
    - Вам потрібне скидане середовище macOS, яке можна клонувати
    - Ви хочете порівняти локальні та хостингові варіанти ВМ macOS
summary: Запускайте OpenClaw в ізольованій VM macOS (локальній або хостинговій), коли потрібна ізоляція або iMessage
title: Віртуальні машини macOS
x-i18n:
    generated_at: "2026-06-27T17:41:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aee2fa0651b711f29d7d092da931bd924bc8ce8a5ca389cf8f189725fa586f3f
    source_path: install/macos-vm.md
    workflow: 16
---

## Рекомендоване налаштування за замовчуванням (для більшості користувачів)

- **Невеликий Linux VPS** для постійно ввімкненого Gateway і низької вартості. Див. [VPS-хостинг](/uk/vps).
- **Виділене обладнання** (Mac mini або Linux-комп'ютер), якщо вам потрібен повний контроль і **домашня IP-адреса** для автоматизації браузера. Багато сайтів блокують IP-адреси дата-центрів, тому локальний браузинг часто працює краще.
- **Гібридний варіант:** тримайте Gateway на дешевому VPS і підключайте свій Mac як **вузол**, коли потрібна автоматизація браузера/UI. Див. [Вузли](/uk/nodes) і [Віддалений Gateway](/uk/gateway/remote).

Використовуйте macOS VM, коли вам спеціально потрібні можливості, доступні лише в macOS, як-от iMessage, або потрібна сувора ізоляція від вашого щоденного Mac.

## Варіанти macOS VM

### Локальна VM на вашому Apple Silicon Mac (Lume)

Запустіть OpenClaw у ізольованій macOS VM на вашому наявному Apple Silicon Mac за допомогою [Lume](https://cua.ai/docs/lume).

Це дає вам:

- Повне середовище macOS в ізоляції (ваш хост залишається чистим)
- Підтримку iMessage через `imsg` (стандартний локальний шлях неможливий у Linux/Windows)
- Миттєве скидання шляхом клонування VM
- Без додаткового обладнання чи хмарних витрат

### Hosted Mac-провайдери (хмара)

Якщо вам потрібна macOS у хмарі, hosted Mac-провайдери також підходять:

- [MacStadium](https://www.macstadium.com/) (hosted Macs)
- Інші hosted Mac-постачальники також працюють; дотримуйтеся їхньої документації щодо VM + SSH

Коли матимете SSH-доступ до macOS VM, перейдіть до кроку 6 нижче.

---

## Швидкий шлях (Lume, досвідчені користувачі)

1. Установіть Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Завершіть Setup Assistant, увімкніть Remote Login (SSH)
4. `lume run openclaw --no-display`
5. Увійдіть через SSH, установіть OpenClaw, налаштуйте канали
6. Готово

---

## Що потрібно (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia або новіша на хості
- ~60 ГБ вільного дискового простору на кожну VM
- ~20 хвилин

---

## 1) Установіть Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Якщо `~/.local/bin` немає у вашому PATH:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Перевірте:

```bash
lume --version
```

Документація: [Установлення Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Створіть macOS VM

```bash
lume create openclaw --os macos --ipsw latest
```

Це завантажить macOS і створить VM. Вікно VNC відкриється автоматично.

<Note>
Завантаження може тривати певний час залежно від вашого з'єднання.
</Note>

---

## 3) Завершіть Setup Assistant

У вікні VNC:

1. Виберіть мову та регіон
2. Пропустіть Apple ID (або увійдіть, якщо хочете використовувати iMessage пізніше)
3. Створіть обліковий запис користувача (запам'ятайте ім'я користувача й пароль)
4. Пропустіть усі необов'язкові функції

Після завершення налаштування:

1. Увімкніть SSH: відкрийте System Settings -> General -> Sharing і ввімкніть "Remote Login".
2. Для використання VM без дисплея увімкніть автоматичний вхід: відкрийте System Settings -> Users & Groups, виберіть "Automatically log in as:" і виберіть користувача VM.

---

## 4) Отримайте IP-адресу VM

```bash
lume get openclaw
```

Знайдіть IP-адресу (зазвичай `192.168.64.x`).

---

## 5) Підключіться до VM через SSH

```bash
ssh youruser@192.168.64.X
```

Замініть `youruser` на створений обліковий запис, а IP — на IP вашої VM.

---

## 6) Установіть OpenClaw

Усередині VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Дотримуйтеся підказок onboarding, щоб налаштувати постачальника моделей (Anthropic, OpenAI тощо).

---

## 7) Налаштуйте канали

Відредагуйте файл конфігурації:

```bash
nano ~/.openclaw/openclaw.json
```

Додайте свої канали:

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

Потім увійдіть у WhatsApp (скануйте QR):

```bash
openclaw channels login
```

---

## 8) Запустіть VM без дисплея

Зупиніть VM і перезапустіть без дисплея:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM працює у фоновому режимі. Демон OpenClaw підтримує роботу Gateway.

Щоб перевірити статус:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Бонус: інтеграція iMessage

Це головна перевага запуску на macOS. Використовуйте [iMessage](/uk/channels/imessage) з `imsg`, щоб додати Messages до OpenClaw.

Усередині VM:

1. Увійдіть у Messages.
2. Установіть `imsg`.
3. Надайте Full Disk Access і дозвіл Automation для процесу, який запускає OpenClaw/`imsg`.
4. Перевірте підтримку RPC за допомогою `imsg rpc --help`.

Додайте до конфігурації OpenClaw:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
    },
  },
}
```

Перезапустіть Gateway. Тепер ваш агент може надсилати й отримувати iMessages.

Повні деталі налаштування: [канал iMessage](/uk/channels/imessage)

---

## Збережіть золотий образ

Перш ніж продовжувати налаштування, створіть знімок чистого стану:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Скидання будь-коли:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## Робота 24/7

Підтримуйте роботу VM так:

- Тримайте Mac підключеним до живлення
- Вимкніть sleep у System Settings → Energy Saver
- Використовуйте `caffeinate`, якщо потрібно

Для справді постійної роботи розгляньте виділений Mac mini або невеликий VPS. Див. [VPS-хостинг](/uk/vps).

---

## Усунення несправностей

| Проблема                  | Рішення                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Не вдається підключитися до VM через SSH | Перевірте, що "Remote Login" увімкнено в System Settings VM                       |
| IP VM не відображається   | Дочекайтеся повного завантаження VM, потім знову виконайте `lume get openclaw`     |
| Команду Lume не знайдено  | Додайте `~/.local/bin` до свого PATH                                               |
| QR WhatsApp не сканується | Переконайтеся, що ви ввійшли у VM (а не на хості), коли виконуєте `openclaw channels login` |

---

## Пов'язана документація

- [VPS-хостинг](/uk/vps)
- [Вузли](/uk/nodes)
- [Віддалений Gateway](/uk/gateway/remote)
- [канал iMessage](/uk/channels/imessage)
- [Швидкий старт Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Довідник Lume CLI](https://cua.ai/docs/lume/reference/cli-reference)
- [Налаштування VM без нагляду](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (розширено)
- [Ізоляція Docker](/uk/install/docker) (альтернативний підхід до ізоляції)
