---
read_when:
    - Вы хотите изолировать OpenClaw от основной среды macOS
    - Вам нужна интеграция iMessage в изолированной среде
    - Вам нужна сбрасываемая среда macOS, которую можно клонировать
    - Вы хотите сравнить локальные и размещенные варианты виртуальных машин macOS
summary: Запускайте OpenClaw в изолированной виртуальной машине macOS (локальной или размещенной), когда вам нужна изоляция или iMessage
title: Виртуальные машины macOS
x-i18n:
    generated_at: "2026-06-28T23:06:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aee2fa0651b711f29d7d092da931bd924bc8ce8a5ca389cf8f189725fa586f3f
    source_path: install/macos-vm.md
    workflow: 16
---

## Рекомендуемый вариант по умолчанию (для большинства пользователей)

- **Небольшой Linux VPS** для постоянно включенного Gateway и низкой стоимости. См. [хостинг VPS](/ru/vps).
- **Выделенное оборудование** (Mac mini или Linux-компьютер), если вам нужен полный контроль и **домашний IP-адрес** для автоматизации браузера. Многие сайты блокируют IP-адреса дата-центров, поэтому локальный браузинг часто работает лучше.
- **Гибридный вариант:** держите Gateway на дешевом VPS и подключайте свой Mac как **Node**, когда нужна автоматизация браузера или UI. См. [Nodes](/ru/nodes) и [удаленный Gateway](/ru/gateway/remote).

Используйте macOS VM, когда вам специально нужны возможности, доступные только в macOS, например iMessage, или нужна строгая изоляция от вашего повседневного Mac.

## Варианты macOS VM

### Локальная VM на вашем Apple Silicon Mac (Lume)

Запустите OpenClaw в изолированной macOS VM на существующем Apple Silicon Mac с помощью [Lume](https://cua.ai/docs/lume).

Это дает вам:

- Полноценную среду macOS в изоляции (хост остается чистым)
- Поддержку iMessage через `imsg` (локальный путь по умолчанию невозможен в Linux/Windows)
- Мгновенный сброс через клонирование VM
- Без дополнительного оборудования или облачных затрат

### Размещенные Mac-провайдеры (облако)

Если вам нужна macOS в облаке, размещенные Mac-провайдеры тоже подходят:

- [MacStadium](https://www.macstadium.com/) (размещенные Mac)
- Другие поставщики размещенных Mac также работают; следуйте их документации по VM + SSH

Когда у вас появится SSH-доступ к macOS VM, переходите к шагу 6 ниже.

---

## Быстрый путь (Lume, опытные пользователи)

1. Установите Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Завершите Ассистент настройки, включите удаленный вход (SSH)
4. `lume run openclaw --no-display`
5. Подключитесь по SSH, установите OpenClaw, настройте каналы
6. Готово

---

## Что вам понадобится (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia или новее на хосте
- ~60 ГБ свободного места на диске на каждую VM
- ~20 минут

---

## 1) Установите Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Если `~/.local/bin` нет в вашем PATH:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Проверьте:

```bash
lume --version
```

Документация: [установка Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Создайте macOS VM

```bash
lume create openclaw --os macos --ipsw latest
```

Это загрузит macOS и создаст VM. Окно VNC откроется автоматически.

<Note>
Загрузка может занять некоторое время в зависимости от вашего соединения.
</Note>

---

## 3) Завершите Ассистент настройки

В окне VNC:

1. Выберите язык и регион
2. Пропустите Apple ID (или войдите, если позже хотите использовать iMessage)
3. Создайте учетную запись пользователя (запомните имя пользователя и пароль)
4. Пропустите все дополнительные функции

После завершения настройки:

1. Включите SSH: откройте Системные настройки -> Основные -> Общий доступ и включите «Удаленный вход».
2. Для использования VM без графического окна включите автоматический вход: откройте Системные настройки -> Пользователи и группы, выберите «Автоматически входить как:» и выберите пользователя VM.

---

## 4) Получите IP-адрес VM

```bash
lume get openclaw
```

Найдите IP-адрес (обычно `192.168.64.x`).

---

## 5) Подключитесь к VM по SSH

```bash
ssh youruser@192.168.64.X
```

Замените `youruser` на учетную запись, которую вы создали, а IP-адрес — на IP вашей VM.

---

## 6) Установите OpenClaw

Внутри VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Следуйте подсказкам начальной настройки, чтобы настроить поставщика модели (Anthropic, OpenAI и т. д.).

---

## 7) Настройте каналы

Отредактируйте файл конфигурации:

```bash
nano ~/.openclaw/openclaw.json
```

Добавьте свои каналы:

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

Затем войдите в WhatsApp (отсканируйте QR-код):

```bash
openclaw channels login
```

---

## 8) Запустите VM без графического окна

Остановите VM и перезапустите без дисплея:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM работает в фоне. Демон OpenClaw поддерживает работу Gateway.

Чтобы проверить статус:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Бонус: интеграция iMessage

Это главное преимущество запуска на macOS. Используйте [iMessage](/ru/channels/imessage) с `imsg`, чтобы добавить Сообщения в OpenClaw.

Внутри VM:

1. Войдите в Сообщения.
2. Установите `imsg`.
3. Предоставьте полный доступ к диску и разрешение на автоматизацию для процесса, запускающего OpenClaw/`imsg`.
4. Проверьте поддержку RPC с помощью `imsg rpc --help`.

Добавьте в конфигурацию OpenClaw:

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

Перезапустите Gateway. Теперь ваш агент может отправлять и получать iMessage.

Полные сведения по настройке: [канал iMessage](/ru/channels/imessage)

---

## Сохраните эталонный образ

Перед дальнейшей настройкой сделайте снимок чистого состояния:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Сброс в любое время:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## Работа 24/7

Поддерживайте VM в рабочем состоянии так:

- Держите Mac подключенным к питанию
- Отключите сон в Системных настройках → Экономия энергии
- Используйте `caffeinate` при необходимости

Для настоящего постоянно включенного режима рассмотрите выделенный Mac mini или небольшой VPS. См. [хостинг VPS](/ru/vps).

---

## Устранение неполадок

| Проблема                    | Решение                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| Не удается подключиться к VM по SSH | Проверьте, что «Удаленный вход» включен в Системных настройках VM                                |
| IP VM не отображается       | Подождите, пока VM полностью загрузится, затем снова выполните `lume get openclaw`               |
| Команда Lume не найдена     | Добавьте `~/.local/bin` в ваш PATH                                                               |
| QR-код WhatsApp не сканируется | Убедитесь, что вы вошли в VM (а не на хост), когда выполняете `openclaw channels login`          |

---

## Связанная документация

- [хостинг VPS](/ru/vps)
- [Nodes](/ru/nodes)
- [удаленный Gateway](/ru/gateway/remote)
- [канал iMessage](/ru/channels/imessage)
- [быстрый старт Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [справочник CLI Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [настройка VM без участия пользователя](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (для продвинутых)
- [изоляция Docker](/ru/install/docker) (альтернативный подход к изоляции)
