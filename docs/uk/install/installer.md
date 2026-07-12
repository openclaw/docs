---
read_when:
    - Ви хочете зрозуміти `openclaw.ai/install.sh`
    - Ви хочете автоматизувати встановлення (CI / без графічного інтерфейсу)
    - Ви хочете встановити з робочої копії GitHub
summary: Як працюють скрипти інсталятора (install.sh, install-cli.sh, install.ps1), прапорці та автоматизація
title: Внутрішня будова інсталятора
x-i18n:
    generated_at: "2026-07-12T13:23:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 59b38a2eecbf15cc966beada81acf1824229a3825c73ae33ea0f8e89612bdf5b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw постачається з трьома сценаріями встановлення, доступними на `openclaw.ai`.

| Сценарій                          | Платформа            | Що він робить                                                                                                 |
| --------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | За потреби встановлює Node, встановлює OpenClaw через npm (типово) або git, може запустити початкове налаштування. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Встановлює Node і OpenClaw у локальний префікс (`~/.openclaw`) через npm або git. Права root не потрібні.      |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | За потреби встановлює Node, встановлює OpenClaw через npm (типово) або git, може запустити початкове налаштування. |

Усі три підтримують Node **22.19+, 23.11+ або 24+**; Node 24 є типовою цільовою версією для нових установлень.

## Швидкі команди

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
Якщо встановлення завершилося успішно, але команда `openclaw` не знаходиться в новому терміналі, див. [усунення проблем із Node.js](/uk/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Рекомендовано для більшості інтерактивних установлень у macOS/Linux/WSL.
</Tip>

### Процес (install.sh)

<Steps>
  <Step title="Виявлення ОС">
    Підтримує macOS і Linux (зокрема WSL).
  </Step>
  <Step title="Забезпечення Node.js 24 за замовчуванням">
    Перевіряє версію Node і за потреби встановлює Node 24 (через Homebrew у macOS, сценарії налаштування NodeSource у Linux із apt/dnf/yum). У macOS Homebrew встановлюється лише тоді, коли він потрібен інсталятору для Node або Git. Node 22.19+ і 23.11+ залишаються підтримуваними для сумісності.
    В Alpine/musl Linux інсталятор використовує пакунки apk замість NodeSource; налаштовані репозиторії Alpine мають надавати підтримувану версію Node (на момент написання — Alpine 3.21 або новішу).
  </Step>
  <Step title="Забезпечення Git">
    Якщо Git відсутній, встановлює його за допомогою виявленого менеджера пакунків, зокрема Homebrew у macOS та apk в Alpine.
  </Step>
  <Step title="Встановлення OpenClaw">
    - Метод `npm` (типово): глобальне встановлення через npm
    - Метод `git`: клонування або оновлення репозиторію, встановлення залежностей через pnpm, збирання, а потім установлення обгортки в `~/.local/bin/openclaw`

  </Step>
  <Step title="Завдання після встановлення">
    - Визначає щойно встановлений виконуваний файл `openclaw` для наступних команд
    - Для неналаштованого встановлення запускає початкове налаштування перед перевірками doctor або Gateway. З `--no-onboard` або без TTY виводить команду для завершення налаштування пізніше.
    - Для налаштованого встановлення за можливості оновлює й перезапускає завантажену службу Gateway та запускає doctor. Під час оновлення за можливості оновлює плагіни або виводить команду для ручного виконання в безголовому запуску з увімкненими запитами.
    - Під час виконання `--verify` перевіряє встановлену версію та стан Gateway лише за наявності конфігурації.

  </Step>
</Steps>

### Виявлення робочої копії вихідного коду

Якщо сценарій запущено всередині робочої копії OpenClaw (`package.json` + `pnpm-workspace.yaml`), він пропонує:

- використати робочу копію (`git`) або
- використати глобальне встановлення (`npm`)

Якщо TTY недоступний і метод встановлення не задано, типовим буде `npm`, а сценарій виведе попередження.

Сценарій завершується з кодом `2`, якщо вибрано неприпустимий метод або передано неприпустиме значення `--install-method`.

### Приклади (install.sh)

<Tabs>
  <Tab title="Типово">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Пропустити початкове налаштування">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Встановлення через Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="Робоча копія основної гілки GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Пробний запуск">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="Перевірка після встановлення">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Довідник прапорців">

| Прапорець                               | Опис                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | Вибрати метод встановлення (типово: `npm`)                                             |
| `--npm`                                 | Скорочення для методу npm                                                             |
| `--git \| --github`                     | Скорочення для методу git                                                             |
| `--version <version\|dist-tag\|spec>`   | Версія npm, dist-tag або специфікація пакунка (типово: `latest`)                       |
| `--beta`                                | Використати dist-tag beta, якщо він доступний, інакше повернутися до `latest`          |
| `--git-dir \| --dir <path>`             | Каталог робочої копії (типово: `~/openclaw`)                                           |
| `--no-git-update`                       | Пропустити `git pull` для наявної робочої копії                                        |
| `--no-prompt`                           | Вимкнути запити                                                                        |
| `--no-onboard`                          | Пропустити початкове налаштування                                                      |
| `--onboard`                             | Увімкнути початкове налаштування                                                       |
| `--verify`                              | Виконати базову перевірку після встановлення (`--version`, стан Gateway, якщо завантажено) |
| `--dry-run`                             | Вивести дії без застосування змін                                                      |
| `--verbose`                             | Увімкнути налагоджувальне виведення (`set -x`, журнали npm рівня notice)               |
| `--help \| -h`                          | Показати довідку з використання                                                       |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Змінна                                            | Опис                                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Метод встановлення                                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Версія npm, dist-tag або специфікація пакунка                                           |
| `OPENCLAW_BETA=0\|1`                              | Використовувати beta, якщо вона доступна                                                |
| `OPENCLAW_HOME=<path>`                            | Базовий каталог для стану OpenClaw і типових шляхів git/початкового налаштування       |
| `OPENCLAW_GIT_DIR=<path>`                         | Каталог робочої копії                                                                   |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Увімкнути або вимкнути оновлення git                                                    |
| `OPENCLAW_NO_PROMPT=1`                            | Вимкнути запити                                                                         |
| `OPENCLAW_VERIFY_INSTALL=1`                       | Виконати базову перевірку після встановлення                                            |
| `OPENCLAW_NO_ONBOARD=1`                           | Пропустити початкове налаштування                                                       |
| `OPENCLAW_DRY_RUN=1`                              | Режим пробного запуску                                                                  |
| `OPENCLAW_VERBOSE=1`                              | Режим налагодження                                                                      |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Рівень журналювання npm (типово: `error`, приховує повідомлення npm про застарілі функції) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Призначено для середовищ, де потрібно розмістити все в локальному префіксі
(типово `~/.openclaw`) без системної залежності від Node. Типово підтримує
встановлення через npm, а також установлення робочої копії git у межах того самого процесу з префіксом.
</Info>

### Процес (install-cli.sh)

<Steps>
  <Step title="Встановлення локального середовища виконання Node">
    Завантажує архів tar із зафіксованою підтримуваною версією Node LTS (версію вбудовано в сценарій і оновлюють незалежно; типово `22.22.2`) до `<prefix>/tools/node-v<version>` та перевіряє SHA-256.
    В Alpine/musl Linux, для якої Node не публікує сумісні архіви tar із зафіксованим середовищем виконання, встановлює `nodejs` і `npm` через `apk` та прив’язує це середовище виконання до шляху обгортки в префіксі. Репозиторії Alpine мають надавати підтримувану версію Node (22.19+, 23.11+ або 24+); використовуйте Alpine 3.21 або новішу, якщо старіші репозиторії надають лише Node 20 або 21.
  </Step>
  <Step title="Забезпечення Git">
    Якщо Git відсутній, намагається встановити його через apt/dnf/yum/apk у Linux або Homebrew у macOS.
  </Step>
  <Step title="Встановлення OpenClaw у префікс">
    - Метод `npm` (типово): встановлює в префікс через npm, а потім записує обгортку до `<prefix>/bin/openclaw`
    - Метод `git`: клонує або оновлює робочу копію (типово `~/openclaw`) і також записує обгортку до `<prefix>/bin/openclaw`

  </Step>
  <Step title="Оновлення завантаженої служби Gateway">
    Якщо службу Gateway уже завантажено з того самого префікса, сценарій виконує
    `openclaw gateway install --force`, потім `openclaw gateway restart` і
    за можливості перевіряє стан Gateway.
  </Step>
</Steps>

### Приклади (install-cli.sh)

<Tabs>
  <Tab title="Типово">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Власний префікс і версія">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Встановлення через Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Виведення JSON для автоматизації">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Запуск початкового налаштування">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Довідник прапорців">

| Прапорець                               | Опис                                                                                         |
| --------------------------------------- | -------------------------------------------------------------------------------------------- |
| `--prefix <path>`                       | Префікс встановлення (типово: `~/.openclaw`)                                                  |
| `--install-method \| --method npm\|git` | Вибрати метод встановлення (типово: `npm`)                                                    |
| `--npm`                                 | Скорочення для методу npm                                                                    |
| `--git \| --github`                     | Скорочення для методу git                                                                    |
| `--git-dir \| --dir <path>`             | Каталог робочої копії Git (типово: `~/openclaw`)                                              |
| `--version <ver>`                       | Версія OpenClaw або dist-тег (типово: `latest`)                                               |
| `--node-version <ver>`                  | Версія Node (типово: `22.22.2`)                                                               |
| `--json`                                | Виводити події NDJSON                                                                         |
| `--onboard`                             | Запустити `openclaw onboard` після встановлення                                               |
| `--no-onboard`                          | Пропустити початкове налаштування (типово)                                                    |
| `--set-npm-prefix`                      | У Linux примусово встановити префікс npm як `~/.npm-global`, якщо поточний недоступний для запису |
| `--help \| -h`                          | Показати довідку з використання                                                               |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Змінна                                      | Опис                                                                              |
| ------------------------------------------- | --------------------------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Префікс встановлення                                                              |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Метод встановлення                                                                |
| `OPENCLAW_VERSION=<ver>`                    | Версія OpenClaw або dist-тег                                                      |
| `OPENCLAW_NODE_VERSION=<ver>`               | Версія Node                                                                       |
| `OPENCLAW_HOME=<path>`                      | Базовий каталог для стану OpenClaw і типових шляхів git/початкового налаштування |
| `OPENCLAW_GIT_DIR=<path>`                   | Каталог робочої копії Git для встановлень через git                               |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Увімкнути або вимкнути оновлення git для наявних робочих копій                   |
| `OPENCLAW_NO_ONBOARD=1`                     | Пропустити початкове налаштування                                                  |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Рівень журналювання npm (типово: `error`)                                          |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` та інші специфікації вихідного коду GitHub не є допустимими значеннями `--version` для встановлень через npm. Натомість використовуйте `--install-method git --version main`.
</Note>

---

<a id="installps1"></a>

## install.ps1

### Послідовність виконання (install.ps1)

<Steps>
  <Step title="Перевірка середовища PowerShell і Windows">
    Потрібен PowerShell 5 або новіший.
  </Step>
  <Step title="Забезпечення Node.js 24 за замовчуванням">
    Якщо його немає, виконується спроба встановлення через winget, потім Chocolatey, а потім Scoop. Якщо жоден менеджер пакунків недоступний, скрипт завантажує офіційний zip-архів Node.js 24 для Windows до `%LOCALAPPDATA%\OpenClaw\deps\portable-node` і додає його до PATH поточного процесу та користувача. Для сумісності також підтримуються Node 22.19+ і 23.11+.
  </Step>
  <Step title="Встановлення OpenClaw">
    - Метод `npm` (типово): глобальне встановлення через npm із вибраним `-Tag`, запущене з доступного для запису тимчасового каталогу інсталятора, щоб оболонки, відкриті в захищених каталогах на кшталт `C:\`, також працювали
    - Метод `git`: клонування або оновлення репозиторію, встановлення та збирання через pnpm і встановлення обгортки в `%USERPROFILE%\.local\bin\openclaw.cmd`. Якщо Git відсутній, скрипт завантажує локальний для користувача MinGit до `%LOCALAPPDATA%\OpenClaw\deps\portable-git` і додає його до PATH поточного процесу та користувача.

  </Step>
  <Step title="Завдання після встановлення">
    - За можливості додає потрібний каталог виконуваних файлів до PATH користувача
    - Намагається оновити завантажену службу Gateway (`openclaw gateway install --force`, а потім перезапуск)
    - Запускає `openclaw doctor --non-interactive` під час оновлень і встановлень через git (за можливості)

  </Step>
  <Step title="Обробка помилок">
    Встановлення через `iwr ... | iex` і блоки скриптів повідомляють про завершальну помилку, не закриваючи поточний сеанс PowerShell. Безпосередні встановлення через `powershell -File` / `pwsh -File` усе ще завершуються з ненульовим кодом для автоматизації.
  </Step>
</Steps>

### Приклади (install.ps1)

<Tabs>
  <Tab title="Типове встановлення">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Встановлення через Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="Робоча копія основної гілки GitHub">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="Власний каталог git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Пробний запуск">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Довідник параметрів">

| Параметр                    | Опис                                                                  |
| --------------------------- | --------------------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Метод встановлення (типово: `npm`)                                    |
| `-Tag <tag\|version\|spec>` | dist-тег npm, версія або специфікація пакунка (типово: `latest`)      |
| `-GitDir <path>`            | Каталог робочої копії (типово: `%USERPROFILE%\openclaw`)              |
| `-NoOnboard`                | Пропустити початкове налаштування                                     |
| `-NoGitUpdate`              | Пропустити `git pull`                                                  |
| `-DryRun`                   | Лише вивести заплановані дії                                          |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Змінна                             | Опис                          |
| ---------------------------------- | ----------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Метод встановлення            |
| `OPENCLAW_GIT_DIR=<path>`          | Каталог робочої копії         |
| `OPENCLAW_NO_ONBOARD=1`            | Пропустити початкове налаштування |
| `OPENCLAW_GIT_UPDATE=0`            | Вимкнути git pull             |
| `OPENCLAW_DRY_RUN=1`               | Режим пробного запуску        |

  </Accordion>
</AccordionGroup>

<Note>
Якщо використовується `-InstallMethod git`, а Git відсутній, скрипт намагається завантажити локальний для користувача MinGit, перш ніж вивести посилання на Git for Windows.
</Note>

---

## CI та автоматизація

Використовуйте неінтерактивні параметри та змінні середовища для передбачуваного виконання.

<Tabs>
  <Tab title="install.sh (неінтерактивний npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (неінтерактивний git)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (без початкового налаштування)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Навіщо потрібен Git?">
    Git потрібен для методу встановлення `git`. Для встановлень через `npm` наявність Git також перевіряється, і за потреби він встановлюється, щоб уникнути помилок `spawn git ENOENT`, коли залежності використовують URL-адреси git.
  </Accordion>

  <Accordion title="Чому npm видає EACCES у Linux?">
    У деяких конфігураціях Linux глобальний префікс npm указує на шляхи, власником яких є root. `install.sh` може змінити префікс на `~/.npm-global` і додати експортування PATH до rc-файлів оболонки, якщо ці файли існують.
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Запустіть інсталятор повторно, щоб він міг завантажити локальний для користувача MinGit, або встановіть Git for Windows і повторно відкрийте PowerShell.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Виконайте `npm config get prefix` і додайте отриманий каталог до PATH користувача (у Windows суфікс `\bin` не потрібен), а потім повторно відкрийте PowerShell.
  </Accordion>

  <Accordion title="Windows: як отримати докладний вивід інсталятора">
    `install.ps1` не надає параметра `-Verbose`.
    Використовуйте трасування PowerShell для діагностики на рівні скрипту:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw не знайдено після встановлення">
    Зазвичай це проблема з PATH. Див. [усунення несправностей Node.js](/uk/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

- [Огляд встановлення](/uk/install)
- [Оновлення](/uk/install/updating)
- [Видалення](/uk/install/uninstall)
