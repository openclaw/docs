---
read_when:
    - Ви хочете зрозуміти `openclaw.ai/install.sh`
    - Ви хочете автоматизувати встановлення (CI / headless)
    - Ви хочете встановити з checkout GitHub
summary: Як працюють скрипти інсталятора (install.sh, install-cli.sh, install.ps1), прапорці та автоматизація
title: Внутрішні механізми інсталятора
x-i18n:
    generated_at: "2026-06-27T17:41:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72182472f423e64b33afa071feda76c2c9abdf896bffa269f2148124c49a451c
    source_path: install/installer.md
    workflow: 16
---

OpenClaw постачається з трьома сценаріями інсталятора, які обслуговуються з `openclaw.ai`.

| Сценарій                          | Платформа            | Що він робить                                                                                                  |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | За потреби встановлює Node, встановлює OpenClaw через npm (типово) або git і може запустити онбординг.         |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Встановлює Node + OpenClaw у локальний префікс (`~/.openclaw`) у режимах npm або git checkout. Root не потрібен. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | За потреби встановлює Node, встановлює OpenClaw через npm (типово) або git і може запустити онбординг.         |

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
Якщо інсталяція успішна, але `openclaw` не знайдено в новому терміналі, див. [усунення несправностей Node.js](/uk/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Рекомендовано для більшості інтерактивних інсталяцій на macOS/Linux/WSL.
</Tip>

### Процес (install.sh)

<Steps>
  <Step title="Виявити ОС">
    Підтримує macOS і Linux (включно з WSL).
  </Step>
  <Step title="Забезпечити Node.js 24 типово">
    Перевіряє версію Node і встановлює Node 24 за потреби (Homebrew на macOS, сценарії налаштування NodeSource на Linux apt/dnf/yum). На macOS Homebrew встановлюється лише тоді, коли інсталятору він потрібен для Node або Git. OpenClaw досі підтримує Node 22 LTS, наразі `22.19+`, для сумісності.
    На Alpine/musl Linux інсталятор використовує пакети apk замість NodeSource; налаштовані репозиторії Alpine мають надавати Node `22.19+` (Alpine 3.21 або новішу на момент написання).
  </Step>
  <Step title="Забезпечити Git">
    Встановлює Git, якщо його немає, за допомогою виявленого менеджера пакетів, включно з Homebrew на macOS і apk на Alpine.
  </Step>
  <Step title="Встановити OpenClaw">
    - метод `npm` (типово): глобальна інсталяція npm
    - метод `git`: клонувати/оновити репозиторій, встановити залежності за допомогою pnpm, зібрати, потім встановити обгортку в `~/.local/bin/openclaw`

  </Step>
  <Step title="Завдання після інсталяції">
    - За можливості оновлює завантажену службу gateway (`openclaw gateway install --force`, потім перезапуск)
    - Запускає `openclaw doctor --non-interactive` під час оновлень і git-інсталяцій (за можливості)
    - Намагається запустити онбординг, коли це доречно (TTY доступний, онбординг не вимкнено, а перевірки bootstrap/config пройдено)

  </Step>
</Steps>

### Виявлення вихідного checkout

Якщо запущено всередині checkout OpenClaw (`package.json` + `pnpm-workspace.yaml`), сценарій пропонує:

- використовувати checkout (`git`), або
- використовувати глобальну інсталяцію (`npm`)

Якщо TTY недоступний і метод інсталяції не задано, типово використовується `npm` і виводиться попередження.

Сценарій завершується з кодом `2` для недійсного вибору методу або недійсних значень `--install-method`.

### Приклади (install.sh)

<Tabs>
  <Tab title="Типово">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Пропустити онбординг">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git-інсталяція">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="Checkout main з GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Пробний запуск">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Довідник прапорців">

| Прапорець                            | Опис                                                       |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Вибрати метод інсталяції (типово: `npm`). Псевдонім: `--method` |
| `--npm`                               | Скорочення для методу npm                                  |
| `--git`                               | Скорочення для методу git. Псевдонім: `--github`           |
| `--version <version\|dist-tag\|spec>` | Версія npm, dist-tag або специфікація пакета (типово: `latest`) |
| `--beta`                              | Використати beta dist-tag, якщо доступний, інакше fallback до `latest` |
| `--git-dir <path>`                    | Каталог checkout (типово: `~/openclaw`). Псевдонім: `--dir` |
| `--no-git-update`                     | Пропустити `git pull` для наявного checkout                |
| `--no-prompt`                         | Вимкнути підказки                                          |
| `--no-onboard`                        | Пропустити онбординг                                       |
| `--onboard`                           | Увімкнути онбординг                                        |
| `--dry-run`                           | Вивести дії без застосування змін                          |
| `--verbose`                           | Увімкнути debug-вивід (`set -x`, журнали npm рівня notice) |
| `--help`                              | Показати використання (`-h`)                               |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Змінна                                            | Опис                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Метод інсталяції                                                   |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Версія npm, dist-tag або специфікація пакета                       |
| `OPENCLAW_BETA=0\|1`                              | Використати beta, якщо доступна                                    |
| `OPENCLAW_HOME=<path>`                            | Базовий каталог для стану OpenClaw і типових шляхів git/онбордингу |
| `OPENCLAW_GIT_DIR=<path>`                         | Каталог checkout                                                   |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Перемкнути оновлення git                                           |
| `OPENCLAW_NO_PROMPT=1`                            | Вимкнути підказки                                                  |
| `OPENCLAW_NO_ONBOARD=1`                           | Пропустити онбординг                                               |
| `OPENCLAW_DRY_RUN=1`                              | Режим пробного запуску                                             |
| `OPENCLAW_VERBOSE=1`                              | Режим debug                                                        |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Рівень журналювання npm                                            |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Призначено для середовищ, де потрібно тримати все під локальним префіксом
(типово `~/.openclaw`) і без системної залежності Node. Типово підтримує npm-інсталяції,
а також git-checkout інсталяції в межах того самого процесу з префіксом.
</Info>

### Процес (install-cli.sh)

<Steps>
  <Step title="Встановити локальне середовище виконання Node">
    Завантажує зафіксований підтримуваний tarball Node LTS (версію вбудовано в сценарій і оновлюється незалежно) до `<prefix>/tools/node-v<version>` і перевіряє SHA-256.
    На Alpine/musl Linux, де Node не публікує сумісні tarball для зафіксованого середовища виконання, встановлює `nodejs` і `npm` через `apk` та прив’язує це середовище виконання до шляху обгортки в префіксі. Репозиторії Alpine мають надавати Node `22.19+`; використовуйте Alpine 3.21 або новішу, якщо старіші репозиторії надають лише Node 20 або 21.
  </Step>
  <Step title="Забезпечити Git">
    Якщо Git відсутній, намагається встановити його через apt/dnf/yum/apk на Linux або Homebrew на macOS.
  </Step>
  <Step title="Встановити OpenClaw під префіксом">
    - метод `npm` (типово): встановлює під префіксом за допомогою npm, потім записує обгортку до `<prefix>/bin/openclaw`
    - метод `git`: клонує/оновлює checkout (типово `~/openclaw`) і все одно записує обгортку до `<prefix>/bin/openclaw`

  </Step>
  <Step title="Оновити завантажену службу gateway">
    Якщо службу gateway уже завантажено з того самого префікса, сценарій запускає
    `openclaw gateway install --force`, потім `openclaw gateway restart`, і
    за можливості перевіряє працездатність gateway.
  </Step>
</Steps>

### Приклади (install-cli.sh)

<Tabs>
  <Tab title="Типово">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Власний префікс + версія">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git-інсталяція">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="JSON-вивід для автоматизації">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Запустити онбординг">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Довідник прапорців">

| Прапорець                   | Опис                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------- |
| `--prefix <path>`           | Префікс установлення (за замовчуванням: `~/.openclaw`)                                                |
| `--install-method npm\|git` | Вибрати метод установлення (за замовчуванням: `npm`). Псевдонім: `--method`                          |
| `--npm`                     | Скорочення для методу npm                                                                             |
| `--git`, `--github`         | Скорочення для методу git                                                                             |
| `--git-dir <path>`          | Директорія checkout Git (за замовчуванням: `~/openclaw`). Псевдонім: `--dir`                         |
| `--version <ver>`           | Версія OpenClaw або dist-tag (за замовчуванням: `latest`)                                             |
| `--node-version <ver>`      | Версія Node (за замовчуванням: `22.22.0`)                                                             |
| `--json`                    | Виводити події NDJSON                                                                                 |
| `--onboard`                 | Запустити `openclaw onboard` після встановлення                                                       |
| `--no-onboard`              | Пропустити початкове налаштування (за замовчуванням)                                                  |
| `--set-npm-prefix`          | У Linux примусово встановити префікс npm на `~/.npm-global`, якщо поточний префікс недоступний на запис |
| `--help`                    | Показати використання (`-h`)                                                                          |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Змінна                                      | Опис                                                                        |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Префікс установлення                                                        |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Метод установлення                                                          |
| `OPENCLAW_VERSION=<ver>`                    | Версія OpenClaw або dist-tag                                                |
| `OPENCLAW_NODE_VERSION=<ver>`               | Версія Node                                                                 |
| `OPENCLAW_HOME=<path>`                      | Базова директорія для стану OpenClaw і стандартних шляхів git/onboarding    |
| `OPENCLAW_GIT_DIR=<path>`                   | Директорія checkout Git для встановлень через git                           |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Перемикач оновлень git для наявних checkout                                 |
| `OPENCLAW_NO_ONBOARD=1`                     | Пропустити початкове налаштування                                           |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Рівень журналювання npm                                                     |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Потік (install.ps1)

<Steps>
  <Step title="Забезпечити середовище PowerShell + Windows">
    Потрібен PowerShell 5+.
  </Step>
  <Step title="Забезпечити Node.js 24 за замовчуванням">
    Якщо відсутній, виконується спроба встановлення через winget, потім Chocolatey, потім Scoop. Якщо жоден менеджер пакетів недоступний, скрипт завантажує офіційний Windows zip Node.js у `%LOCALAPPDATA%\OpenClaw\deps\portable-node` і додає його до PATH поточного процесу та користувача. Node 22 LTS, наразі `22.19+`, залишається підтримуваним для сумісності.
  </Step>
  <Step title="Встановити OpenClaw">
    - Метод `npm` (за замовчуванням): глобальне встановлення npm з використанням вибраного `-Tag`, запущене з тимчасової директорії інсталятора, доступної на запис, щоб оболонки, відкриті в захищених папках, як-от `C:\`, усе одно працювали
    - Метод `git`: клонування/оновлення репозиторію, встановлення/збірка з pnpm і встановлення wrapper у `%USERPROFILE%\.local\bin\openclaw.cmd`. Якщо Git відсутній, скрипт початково налаштовує локальний для користувача MinGit у `%LOCALAPPDATA%\OpenClaw\deps\portable-git` і додає його до PATH поточного процесу та користувача.

  </Step>
  <Step title="Завдання після встановлення">
    - Додає потрібну директорію bin до PATH користувача, коли це можливо
    - Оновлює завантажений сервіс Gateway за принципом best-effort (`openclaw gateway install --force`, потім перезапуск)
    - Запускає `openclaw doctor --non-interactive` під час оновлень і встановлень через git (best effort)

  </Step>
  <Step title="Обробити збої">
    Встановлення через `iwr ... | iex` і scriptblock повідомляють про критичну помилку без закриття поточного сеансу PowerShell. Прямі встановлення через `powershell -File` / `pwsh -File` все одно завершуються з ненульовим кодом для автоматизації.
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
  <Tab title="Checkout GitHub main">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="Власна директорія git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Пробний запуск">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Трасування налагодження">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Довідник прапорців">

| Прапорець                   | Опис                                                        |
| --------------------------- | ----------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Метод установлення (за замовчуванням: `npm`)                |
| `-Tag <tag\|version\|spec>` | dist-tag npm, версія або специфікація пакета (за замовчуванням: `latest`) |
| `-GitDir <path>`            | Директорія checkout (за замовчуванням: `%USERPROFILE%\openclaw`) |
| `-NoOnboard`                | Пропустити початкове налаштування                           |
| `-NoGitUpdate`              | Пропустити `git pull`                                       |
| `-DryRun`                   | Лише вивести дії                                            |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Змінна                             | Опис                                  |
| ---------------------------------- | ------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Метод установлення                    |
| `OPENCLAW_GIT_DIR=<path>`          | Директорія checkout                   |
| `OPENCLAW_NO_ONBOARD=1`            | Пропустити початкове налаштування     |
| `OPENCLAW_GIT_UPDATE=0`            | Вимкнути git pull                     |
| `OPENCLAW_DRY_RUN=1`               | Режим пробного запуску                |

  </Accordion>
</AccordionGroup>

<Note>
Якщо використовується `-InstallMethod git` і Git відсутній, скрипт спочатку пробує початково налаштувати локальний для користувача MinGit, перш ніж вивести посилання Git for Windows.
</Note>

---

## CI та автоматизація

Використовуйте неінтерактивні прапорці/змінні середовища для передбачуваних запусків.

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
    Git потрібен для методу встановлення `git`. Для встановлень через `npm` Git усе одно перевіряється/встановлюється, щоб уникнути збоїв `spawn git ENOENT`, коли залежності використовують URL-адреси git.
  </Accordion>

  <Accordion title="Чому npm отримує EACCES у Linux?">
    Деякі конфігурації Linux спрямовують глобальний префікс npm на шляхи, що належать root. `install.sh` може перемкнути префікс на `~/.npm-global` і додати експорти PATH до rc-файлів оболонки (коли ці файли існують).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Повторно запустіть інсталятор, щоб він міг початково налаштувати локальний для користувача MinGit, або встановіть Git for Windows і знову відкрийте PowerShell.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Запустіть `npm config get prefix` і додайте цю директорію до PATH користувача (у Windows суфікс `\bin` не потрібен), потім знову відкрийте PowerShell.
  </Accordion>

  <Accordion title="Windows: як отримати докладний вивід інсталятора">
    `install.ps1` наразі не надає перемикач `-Verbose`.
    Використовуйте трасування PowerShell для діагностики на рівні скрипта:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw не знайдено після встановлення">
    Зазвичай це проблема PATH. Див. [усунення несправностей Node.js](/uk/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд установлення](/uk/install)
- [Оновлення](/uk/install/updating)
- [Видалення](/uk/install/uninstall)
