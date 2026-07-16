---
read_when:
    - Ви хочете зрозуміти `openclaw.ai/install.sh`
    - Потрібно автоматизувати встановлення (CI / без графічного інтерфейсу)
    - Ви хочете встановити з робочої копії GitHub
summary: Як працюють сценарії встановлення (install.sh, install-cli.sh, install.ps1), прапорці та автоматизація
title: Внутрішня будова інсталятора
x-i18n:
    generated_at: "2026-07-16T18:03:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7878f10903893b4e1902bbc79991f43edaa436bd802d5fecde41421e3e05bc2b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw постачається з трьома сценаріями встановлення, доступними з `openclaw.ai`.

| Сценарій                          | Платформа            | Що він робить                                                                                          |
| --------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------ |
| [`install.sh`](#installsh)  | macOS / Linux / WSL  | За потреби встановлює Node, встановлює OpenClaw через npm (типово) або git, може запустити початкове налаштування. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL | Встановлює Node і OpenClaw у локальний префікс (`~/.openclaw`) через npm або git. Права root не потрібні. |
| [`install.ps1`](#installps1) | Windows (PowerShell) | За потреби встановлює Node, встановлює OpenClaw через npm (типово) або git, може запустити початкове налаштування. |

Усі три підтримують Node **22.22.3+, 24.15+ або 25.9+**; Node 24 є типовою цільовою версією для нових установлень.

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
Якщо встановлення завершилося успішно, але `openclaw` не знайдено в новому терміналі, див. [усунення несправностей Node.js](/uk/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Рекомендовано для більшості інтерактивних установлень у macOS/Linux/WSL.
</Tip>

### Послідовність (install.sh)

<Steps>
  <Step title="Виявлення ОС">
    Підтримує macOS і Linux (зокрема WSL).
  </Step>
  <Step title="Типове забезпечення Node.js 24">
    Перевіряє версію Node і за потреби встановлює Node 24 (Homebrew у macOS, сценарії налаштування NodeSource у Linux із apt/dnf/yum). У macOS Homebrew встановлюється лише тоді, коли він потрібен інсталятору для Node або Git. Підтримуються Node 22.22.3+, Node 24.15+ і Node 25.9+; Node 23 не підтримується.
    В Alpine/musl Linux інсталятор використовує пакунки apk замість NodeSource і перевіряє фактичну версію пов’язаної бібліотеки SQLite. Поточні стабільні потоки пакунків Alpine можуть надавати достатньо нову версію Node із вразливою системною SQLite; у такому разі натомість використовуйте офіційний контейнер `node:24-alpine` або хост на основі glibc.
  </Step>
  <Step title="Забезпечення Git">
    Якщо Git відсутній, встановлює його за допомогою виявленого менеджера пакунків, зокрема Homebrew у macOS і apk в Alpine.
  </Step>
  <Step title="Встановлення OpenClaw">
    - Метод `npm` (типово): глобальне встановлення через npm
    - Метод `git`: клонування/оновлення репозиторію, встановлення залежностей за допомогою pnpm, збирання, а потім встановлення обгортки в `~/.local/bin/openclaw`

  </Step>
  <Step title="Завдання після встановлення">
    - Визначає щойно встановлений виконуваний файл `openclaw` для подальших команд
    - Для неналаштованого встановлення запускає початкове налаштування перед перевірками doctor або Gateway. З `--no-onboard` або без TTY виводить команду для завершення налаштування пізніше.
    - Для налаштованого встановлення намагається оновити й перезапустити завантажену службу Gateway та запускає doctor. Під час оновлення за можливості оновлює плагіни або виводить команду для ручного виконання в безголовому запуску з увімкненими запитами.
    - Під час виконання `--verify` перевіряє встановлену версію, а стан Gateway — лише за наявності конфігурації.

  </Step>
</Steps>

### Виявлення робочої копії вихідного коду

Якщо сценарій запущено всередині робочої копії OpenClaw (`package.json` + `pnpm-workspace.yaml`), він пропонує:

- використати робочу копію (`git`) або
- використати глобальне встановлення (`npm`)

Якщо TTY недоступний і метод встановлення не задано, типовим стає `npm`, а сценарій виводить попередження.

Сценарій завершується з кодом `2`, якщо вибрано недійсний метод або вказано недійсні значення `--install-method`.

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
  <Tab title="Робоча копія main із GitHub">
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

| Прапорець                               | Опис                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | Вибрати метод встановлення (типово: `npm`)                            |
| `--npm`                                 | Скорочення для методу npm                                               |
| `--git \| --github`                     | Скорочення для методу git                                               |
| `--version <version\|dist-tag\|spec>`   | Версія npm, dist-tag або специфікація пакунка (типово: `latest`)       |
| `--beta`                                | Використати dist-tag beta, якщо доступний, інакше повернутися до `latest` |
| `--git-dir \| --dir <path>`             | Каталог робочої копії (типово: `~/openclaw`)                            |
| `--no-git-update`                       | Пропустити `git pull` для наявної робочої копії                         |
| `--no-prompt`                           | Вимкнути запити                                                        |
| `--no-onboard`                          | Пропустити початкове налаштування                                       |
| `--onboard`                             | Увімкнути початкове налаштування                                        |
| `--verify`                              | Виконати базову перевірку після встановлення (`--version`, стан Gateway, якщо завантажено) |
| `--dry-run`                             | Вивести дії без застосування змін                                       |
| `--verbose`                             | Увімкнути налагоджувальне виведення (`set -x`, журнали npm рівня notice) |
| `--help \| -h`                          | Показати довідку                                                        |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Змінна                                            | Опис                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Метод встановлення                                                 |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Версія npm, dist-tag або специфікація пакунка                      |
| `OPENCLAW_BETA=0\|1`                              | Використати beta, якщо доступна                                     |
| `OPENCLAW_HOME=<path>`                            | Базовий каталог для стану OpenClaw і типових шляхів git/початкового налаштування |
| `OPENCLAW_GIT_DIR=<path>`                         | Каталог робочої копії                                               |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Увімкнути або вимкнути оновлення git                                |
| `OPENCLAW_NO_PROMPT=1`                            | Вимкнути запити                                                     |
| `OPENCLAW_VERIFY_INSTALL=1`                       | Виконати базову перевірку після встановлення                        |
| `OPENCLAW_NO_ONBOARD=1`                           | Пропустити початкове налаштування                                   |
| `OPENCLAW_DRY_RUN=1`                              | Режим пробного запуску                                              |
| `OPENCLAW_VERBOSE=1`                              | Режим налагодження                                                  |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Рівень журналювання npm (типово: `error`, приховує повідомлення npm про застарілі функції) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Призначено для середовищ, у яких потрібно розмістити все під локальним префіксом
(типово `~/.openclaw`) без залежності від системного Node. Типово підтримує
встановлення через npm, а також встановлення робочої копії git у межах тієї самої послідовності з префіксом.
</Info>

### Послідовність (install-cli.sh)

<Steps>
  <Step title="Встановлення локального середовища виконання Node">
    Завантажує закріплений підтримуваний tar-архів Node LTS (версію вбудовано в сценарій і оновлюється незалежно, типово `24.15.0`) до `<prefix>/tools/node-v<version>` та перевіряє SHA-256.
    Linux ARMv7 використовує Node `22.22.3`, оскільки офіційні двійкові файли Node 24+ для ARMv7 недоступні.
    В Alpine/musl Linux, для якого Node не публікує сумісні tar-архіви закріпленого середовища виконання, встановлює `nodejs` і `npm` за допомогою `apk`, а потім перевіряє Node і фактично пов’язану бібліотеку SQLite. Поточні стабільні потоки пакунків Alpine усе ще можуть компонуватися з вразливою SQLite навіть за достатньо нової версії Node; якщо перевірка безпеки відхиляє пакунок, використовуйте офіційний контейнер `node:24-alpine` або хост на основі glibc.
  </Step>
  <Step title="Забезпечення Git">
    Якщо Git відсутній, намагається встановити його через apt/dnf/yum/apk у Linux або Homebrew у macOS.
  </Step>
  <Step title="Встановлення OpenClaw під префіксом">
    - Метод `npm` (типово): встановлює під префіксом за допомогою npm, а потім записує обгортку до `<prefix>/bin/openclaw`
    - Метод `git`: клонує/оновлює робочу копію (типово `~/openclaw`) і так само записує обгортку до `<prefix>/bin/openclaw`

  </Step>
  <Step title="Оновлення завантаженої служби Gateway">
    Якщо службу Gateway уже завантажено з того самого префікса, сценарій виконує
    `openclaw gateway install --force`, що активує замінену службу,
    а потім намагається перевірити стан Gateway.
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
  <Tab title="Запустити початкове налаштування">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Довідник прапорців">

| Прапорець                               | Опис                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`                       | Префікс встановлення (за замовчуванням: `~/.openclaw`)                                         |
| `--install-method \| --method npm\|git` | Вибір способу встановлення (за замовчуванням: `npm`)                                          |
| `--npm`                                 | Скорочений варіант для способу npm                                                         |
| `--git \| --github`                     | Скорочений варіант для способу git                                                         |
| `--git-dir \| --dir <path>`             | Каталог робочої копії Git (за замовчуванням: `~/openclaw`)                                  |
| `--version <ver>`                       | Версія або dist-tag OpenClaw (за замовчуванням: `latest`)                                |
| `--node-version <ver>`                  | Версія Node (за замовчуванням: `24.15.0`; `22.22.3` у Linux ARMv7)                     |
| `--json`                                | Виводити події NDJSON                                                              |
| `--onboard`                             | Запустити `openclaw onboard` після встановлення                                            |
| `--no-onboard`                          | Пропустити початкове налаштування (за замовчуванням)                                                       |
| `--set-npm-prefix`                      | У Linux примусово встановити префікс npm у `~/.npm-global`, якщо поточний префікс недоступний для запису |
| `--help \| -h`                          | Показати довідку з використання                                                                      |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Змінна                                      | Опис                                                               |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | Префікс встановлення                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Спосіб встановлення                                                     |
| `OPENCLAW_VERSION=<ver>`                    | Версія або dist-tag OpenClaw                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | Версія Node                                                       |
| `OPENCLAW_HOME=<path>`                      | Базовий каталог для стану OpenClaw і стандартних шляхів git/початкового налаштування |
| `OPENCLAW_GIT_DIR=<path>`                   | Каталог робочої копії Git для встановлень через git                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Увімкнення або вимкнення оновлень git для наявних робочих копій                          |
| `OPENCLAW_NO_ONBOARD=1`                     | Пропустити початкове налаштування                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Рівень журналювання npm (за замовчуванням: `error`)                                   |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` та інші специфікації джерел GitHub не є припустимими цілями `--version` для встановлення через npm. Натомість використовуйте `--install-method git --version main`.
</Note>

---

<a id="installps1"></a>

## install.ps1

### Послідовність (install.ps1)

<Steps>
  <Step title="Перевірка середовища PowerShell і Windows">
    Потрібен PowerShell 5+.
  </Step>
  <Step title="Забезпечення Node.js 24 за замовчуванням">
    Якщо його немає, виконується спроба встановлення через winget, потім Chocolatey, а потім Scoop. Якщо жоден менеджер пакетів недоступний, скрипт завантажує офіційний zip-архів Node.js 24 для Windows у `%LOCALAPPDATA%\OpenClaw\deps\portable-node` і додає його до PATH поточного процесу та користувача. Підтримуються Node 22.22.3+, Node 24.15+ і Node 25.9+; Node 23 не підтримується.
  </Step>
  <Step title="Встановлення OpenClaw">
    - Спосіб `npm` (за замовчуванням): глобальне встановлення через npm із використанням вибраного `-Tag`, запущене з тимчасового каталогу інсталятора, доступного для запису, щоб оболонки, відкриті в захищених каталогах, як-от `C:\`, усе одно працювали
    - Спосіб `git`: клонувати або оновити репозиторій, установити й зібрати за допомогою pnpm та встановити обгортку в `%USERPROFILE%\.local\bin\openclaw.cmd`. Якщо Git відсутній, скрипт завантажує локальний для користувача MinGit у `%LOCALAPPDATA%\OpenClaw\deps\portable-git` і додає його до PATH поточного процесу та користувача.

  </Step>
  <Step title="Завдання після встановлення">
    - За можливості додає потрібний каталог виконуваних файлів до PATH користувача
    - Намагається оновити завантажену службу Gateway (`openclaw gateway install --force`, потім перезапуск)
    - Запускає `openclaw doctor --non-interactive` під час оновлень і встановлень через git (за можливості)

  </Step>
  <Step title="Обробка помилок">
    Встановлення через `iwr ... | iex` і блок скрипту повідомляють про завершальну помилку, не закриваючи поточний сеанс PowerShell. Безпосередні встановлення через `powershell -File` / `pwsh -File` і далі завершуються з ненульовим кодом для автоматизації.
  </Step>
</Steps>

### Приклади (install.ps1)

<Tabs>
  <Tab title="За замовчуванням">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Встановлення через Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="Робоча копія гілки main з GitHub">
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
  <Accordion title="Довідник прапорців">

| Прапорець                   | Опис                                                       |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Спосіб встановлення (за замовчуванням: `npm`)                            |
| `-Tag <tag\|version\|spec>` | dist-tag, версія або специфікація пакета npm (за замовчуванням: `latest`) |
| `-GitDir <path>`            | Каталог робочої копії (за замовчуванням: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | Пропустити початкове налаштування                                            |
| `-NoGitUpdate`              | Пропустити `git pull`                                            |
| `-DryRun`                   | Лише вивести дії                                         |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Змінна                             | Опис               |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Спосіб встановлення     |
| `OPENCLAW_GIT_DIR=<path>`          | Каталог робочої копії |
| `OPENCLAW_NO_ONBOARD=1`            | Пропустити початкове налаштування    |
| `OPENCLAW_GIT_UPDATE=0`            | Вимкнути git pull   |
| `OPENCLAW_DRY_RUN=1`               | Режим пробного запуску       |

  </Accordion>
</AccordionGroup>

<Note>
Якщо використовується `-InstallMethod git`, а Git відсутній, скрипт намагається спочатку завантажити локальний для користувача MinGit, а вже потім виводить посилання на Git for Windows.
</Note>

---

## CI та автоматизація

Для передбачуваних запусків використовуйте неінтерактивні прапорці та змінні середовища.

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
  <Tab title="install.ps1 (пропустити початкове налаштування)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Чому потрібен Git?">
    Git потрібен для способу встановлення `git`. Для встановлень `npm` Git також перевіряється та встановлюється, щоб уникнути помилок `spawn git ENOENT`, коли залежності використовують URL-адреси git.
  </Accordion>

  <Accordion title="Чому npm повертає EACCES у Linux?">
    У деяких конфігураціях Linux глобальний префікс npm указує на шляхи, що належать користувачу root. `install.sh` може змінити префікс на `~/.npm-global` і додати експортування PATH до rc-файлів оболонки (якщо ці файли існують).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Повторно запустіть інсталятор, щоб він міг завантажити локальний для користувача MinGit, або встановіть Git for Windows і знову відкрийте PowerShell.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Запустіть `npm config get prefix` і додайте цей каталог до PATH користувача (суфікс `\bin` у Windows не потрібен), а потім знову відкрийте PowerShell.
  </Accordion>

  <Accordion title="Windows: як отримати докладний вивід інсталятора">
    `install.ps1` не надає перемикача `-Verbose`.
    Для діагностики на рівні скрипту використовуйте трасування PowerShell:

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
