---
read_when:
    - Ви хочете зрозуміти `openclaw.ai/install.sh`
    - Ви хочете автоматизувати встановлення (CI / headless)
    - Ви хочете встановити з checkout GitHub
summary: Як працюють скрипти встановлення (`install.sh`, `install-cli.sh`, `install.ps1`), прапорці та автоматизація
title: Внутрішня будова інсталятора
x-i18n:
    generated_at: "2026-04-23T20:57:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 306af29dca0a9e72150cf89bb30aafed4669f8ba29048de197208209bc8445db
    source_path: install/installer.md
    workflow: 15
---

OpenClaw постачається з трьома скриптами встановлення, які роздаються з `openclaw.ai`.

| Script                             | Platform             | What it does                                                                                                     |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Установлює Node за потреби, установлює OpenClaw через npm (типово) або git і може запускати onboarding.         |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Установлює Node + OpenClaw у локальний префікс (`~/.openclaw`) у режимах npm або git checkout. Root не потрібен. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Установлює Node за потреби, установлює OpenClaw через npm (типово) або git і може запускати onboarding.         |

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
Якщо встановлення пройшло успішно, але `openclaw` не знайдено в новому терміналі, див. [Усунення несправностей Node.js](/uk/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Рекомендовано для більшості інтерактивних встановлень на macOS/Linux/WSL.
</Tip>

### Потік виконання (install.sh)

<Steps>
  <Step title="Визначення ОС">
    Підтримує macOS і Linux (включно з WSL). Якщо виявлено macOS, установлює Homebrew, якщо його немає.
  </Step>
  <Step title="Забезпечення Node.js 24 за замовчуванням">
    Перевіряє версію Node і за потреби встановлює Node 24 (Homebrew на macOS, скрипти налаштування NodeSource на Linux apt/dnf/yum). OpenClaw також і надалі підтримує Node 22 LTS, наразі `22.14+`, для сумісності.
  </Step>
  <Step title="Забезпечення Git">
    Установлює Git, якщо його немає.
  </Step>
  <Step title="Установлення OpenClaw">
    - Метод `npm` (типовий): глобальне встановлення npm
    - Метод `git`: clone/update репозиторію, встановлення залежностей через pnpm, збірка, а потім встановлення wrapper у `~/.local/bin/openclaw`
  </Step>
  <Step title="Завдання після встановлення">
    - Оновлює завантажений сервіс gateway у режимі best-effort (`openclaw gateway install --force`, потім restart)
    - Запускає `openclaw doctor --non-interactive` під час оновлень і git-встановлень (у режимі best effort)
    - Намагається виконати onboarding, коли це доречно (доступний TTY, onboarding не вимкнено, і перевірки bootstrap/config пройдено)
    - Типово встановлює `SHARP_IGNORE_GLOBAL_LIBVIPS=1`
  </Step>
</Steps>

### Визначення checkout джерела

Якщо скрипт запускається всередині checkout OpenClaw (`package.json` + `pnpm-workspace.yaml`), він пропонує:

- використовувати checkout (`git`), або
- використовувати глобальне встановлення (`npm`)

Якщо TTY недоступний і метод встановлення не задано, типово використовується `npm` і виводиться попередження.

Скрипт завершується з кодом `2` для невалідного вибору методу або невалідних значень `--install-method`.

### Приклади (install.sh)

<Tabs>
  <Tab title="Типове">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Пропустити onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git-встановлення">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main через npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Dry run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Довідник прапорців">

| Flag                                  | Description                                                           |
| ------------------------------------- | --------------------------------------------------------------------- |
| `--install-method npm\|git`           | Вибрати метод встановлення (типово: `npm`). Псевдонім: `--method`     |
| `--npm`                               | Скорочення для методу npm                                             |
| `--git`                               | Скорочення для методу git. Псевдонім: `--github`                      |
| `--version <version\|dist-tag\|spec>` | Версія npm, dist-tag або package spec (типово: `latest`)              |
| `--beta`                              | Використовувати beta dist-tag, якщо доступний, інакше fallback до `latest` |
| `--git-dir <path>`                    | Каталог checkout (типово: `~/openclaw`). Псевдонім: `--dir`           |
| `--no-git-update`                     | Пропустити `git pull` для наявного checkout                           |
| `--no-prompt`                         | Вимкнути запити                                                       |
| `--no-onboard`                        | Пропустити onboarding                                                 |
| `--onboard`                           | Увімкнути onboarding                                                  |
| `--dry-run`                           | Вивести дії без застосування змін                                     |
| `--verbose`                           | Увімкнути debug-вивід (`set -x`, логи npm рівня notice)               |
| `--help`                              | Показати usage (`-h`)                                                 |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Variable                                                | Description                                  |
| ------------------------------------------------------- | -------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Метод встановлення                           |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | Версія npm, dist-tag або package spec        |
| `OPENCLAW_BETA=0\|1`                                    | Використовувати beta, якщо доступна          |
| `OPENCLAW_GIT_DIR=<path>`                               | Каталог checkout                             |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Перемикання git-оновлень                     |
| `OPENCLAW_NO_PROMPT=1`                                  | Вимкнути запити                              |
| `OPENCLAW_NO_ONBOARD=1`                                 | Пропустити onboarding                        |
| `OPENCLAW_DRY_RUN=1`                                    | Режим dry run                                |
| `OPENCLAW_VERBOSE=1`                                    | Режим debug                                  |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | Рівень журналювання npm                      |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Керування поведінкою sharp/libvips (типово: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Призначено для середовищ, де ви хочете розмістити все під локальним префіксом
(типово `~/.openclaw`) і не залежати від системного Node. Типово підтримує npm-встановлення,
а також git-checkout-встановлення в межах того самого потоку з префіксом.
</Info>

### Потік виконання (install-cli.sh)

<Steps>
  <Step title="Установлення локального runtime Node">
    Завантажує зафіксований tarball підтримуваного Node LTS (версію вбудовано у скрипт і оновлюють незалежно) до `<prefix>/tools/node-v<version>` і перевіряє SHA-256.
  </Step>
  <Step title="Забезпечення Git">
    Якщо Git відсутній, намагається встановити його через apt/dnf/yum на Linux або Homebrew на macOS.
  </Step>
  <Step title="Установлення OpenClaw під префіксом">
    - Метод `npm` (типовий): установлює під префіксом через npm, а потім записує wrapper до `<prefix>/bin/openclaw`
    - Метод `git`: clone/update checkout (типово `~/openclaw`) і все одно записує wrapper до `<prefix>/bin/openclaw`
  </Step>
  <Step title="Оновлення завантаженого сервісу gateway">
    Якщо сервіс gateway уже завантажено з того самого префікса, скрипт виконує
    `openclaw gateway install --force`, потім `openclaw gateway restart` і
    у режимі best-effort перевіряє стан gateway.
  </Step>
</Steps>

### Приклади (install-cli.sh)

<Tabs>
  <Tab title="Типове">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Власний префікс + версія">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git-встановлення">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="JSON-вивід для автоматизації">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Запустити onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Довідник прапорців">

| Flag                        | Description                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------- |
| `--prefix <path>`           | Префікс установлення (типово: `~/.openclaw`)                                      |
| `--install-method npm\|git` | Вибрати метод встановлення (типово: `npm`). Псевдонім: `--method`                 |
| `--npm`                     | Скорочення для методу npm                                                          |
| `--git`, `--github`         | Скорочення для методу git                                                          |
| `--git-dir <path>`          | Каталог git checkout (типово: `~/openclaw`). Псевдонім: `--dir`                   |
| `--version <ver>`           | Версія OpenClaw або dist-tag (типово: `latest`)                                   |
| `--node-version <ver>`      | Версія Node (типово: `22.22.0`)                                                    |
| `--json`                    | Виводити події NDJSON                                                              |
| `--onboard`                 | Запустити `openclaw onboard` після встановлення                                   |
| `--no-onboard`              | Пропустити onboarding (типово)                                                     |
| `--set-npm-prefix`          | На Linux примусово встановити npm prefix у `~/.npm-global`, якщо поточний префікс недоступний для запису |
| `--help`                    | Показати usage (`-h`)                                                              |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Variable                                    | Description                                      |
| ------------------------------------------- | ------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | Префікс установлення                             |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Метод встановлення                               |
| `OPENCLAW_VERSION=<ver>`                    | Версія OpenClaw або dist-tag                     |
| `OPENCLAW_NODE_VERSION=<ver>`               | Версія Node                                      |
| `OPENCLAW_GIT_DIR=<path>`                   | Каталог git checkout для git-встановлень         |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Перемикання git-оновлень для наявних checkout    |
| `OPENCLAW_NO_ONBOARD=1`                     | Пропустити onboarding                            |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Рівень журналювання npm                          |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | Керування поведінкою sharp/libvips (типово: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Потік виконання (install.ps1)

<Steps>
  <Step title="Забезпечення PowerShell + середовища Windows">
    Потрібен PowerShell 5+.
  </Step>
  <Step title="Забезпечення Node.js 24 за замовчуванням">
    Якщо його немає, намагається встановити через winget, потім Chocolatey, потім Scoop. Node 22 LTS, наразі `22.14+`, залишається підтримуваним для сумісності.
  </Step>
  <Step title="Установлення OpenClaw">
    - Метод `npm` (типовий): глобальне встановлення npm з використанням вибраного `-Tag`
    - Метод `git`: clone/update репозиторію, встановлення/збірка через pnpm і встановлення wrapper у `%USERPROFILE%\.local\bin\openclaw.cmd`
  </Step>
  <Step title="Завдання після встановлення">
    - Додає потрібний каталог bin до PATH користувача, коли це можливо
    - Оновлює завантажений сервіс gateway у режимі best-effort (`openclaw gateway install --force`, потім restart)
    - Запускає `openclaw doctor --non-interactive` під час оновлень і git-встановлень (у режимі best effort)
  </Step>
</Steps>

### Приклади (install.ps1)

<Tabs>
  <Tab title="Типове">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git-встановлення">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main через npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="Власний каталог git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Dry run">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Debug trace">
    ```powershell
    # install.ps1 поки не має окремого прапорця -Verbose.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Довідник прапорців">

| Flag                        | Description                                                           |
| --------------------------- | --------------------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Метод встановлення (типово: `npm`)                                    |
| `-Tag <tag\|version\|spec>` | npm dist-tag, версія або package spec (типово: `latest`)              |
| `-GitDir <path>`            | Каталог checkout (типово: `%USERPROFILE%\openclaw`)                   |
| `-NoOnboard`                | Пропустити onboarding                                                 |
| `-NoGitUpdate`              | Пропустити `git pull`                                                 |
| `-DryRun`                   | Лише вивести дії                                                      |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Variable                           | Description          |
| ---------------------------------- | -------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Метод встановлення   |
| `OPENCLAW_GIT_DIR=<path>`          | Каталог checkout     |
| `OPENCLAW_NO_ONBOARD=1`            | Пропустити onboarding |
| `OPENCLAW_GIT_UPDATE=0`            | Вимкнути git pull    |
| `OPENCLAW_DRY_RUN=1`               | Режим dry run        |

  </Accordion>
</AccordionGroup>

<Note>
Якщо використано `-InstallMethod git` і Git відсутній, скрипт завершується та виводить посилання на Git for Windows.
</Note>

---

## CI та автоматизація

Використовуйте неінтерактивні прапорці/змінні середовища для передбачуваного виконання.

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
  <Tab title="install.ps1 (пропустити onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Чому потрібен Git?">
    Git потрібен для методу встановлення `git`. Для встановлень через `npm` Git усе одно перевіряється/встановлюється, щоб уникнути збоїв `spawn git ENOENT`, коли залежності використовують git URL.
  </Accordion>

  <Accordion title="Чому npm отримує EACCES на Linux?">
    Деякі налаштування Linux спрямовують глобальний префікс npm до шляхів, що належать root. `install.sh` може перемкнути префікс на `~/.npm-global` і додати експорти PATH до shell rc-файлів (якщо ці файли існують).
  </Accordion>

  <Accordion title="Проблеми із sharp/libvips">
    Скрипти типово встановлюють `SHARP_IGNORE_GLOBAL_LIBVIPS=1`, щоб уникнути збирання sharp проти системного libvips. Щоб перевизначити:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Установіть Git for Windows, знову відкрийте PowerShell і повторно запустіть інсталятор.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Виконайте `npm config get prefix` і додайте цей каталог до PATH користувача (суфікс `\bin` у Windows не потрібен), а потім знову відкрийте PowerShell.
  </Accordion>

  <Accordion title="Windows: як отримати докладний вивід інсталятора">
    `install.ps1` наразі не має прапорця `-Verbose`.
    Використовуйте трасування PowerShell для діагностики на рівні скрипта:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="Після встановлення openclaw не знайдено">
    Зазвичай це проблема PATH. Див. [Усунення несправностей Node.js](/uk/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>
