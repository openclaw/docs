---
read_when:
    - Вы хотите понять `openclaw.ai/install.sh`
    - Вы хотите автоматизировать установку (CI / без пользовательского интерфейса)
    - Вы хотите установить из рабочей копии GitHub
summary: Как работают сценарии установки (`install.sh`, `install-cli.sh`, `install.ps1`), флаги и автоматизация
title: Внутреннее устройство установщика
x-i18n:
    generated_at: "2026-06-28T23:06:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72182472f423e64b33afa071feda76c2c9abdf896bffa269f2148124c49a451c
    source_path: install/installer.md
    workflow: 16
---

OpenClaw поставляется с тремя скриптами установки, доступными с `openclaw.ai`.

| Скрипт                            | Платформа            | Что он делает                                                                                                            |
| --------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [`install.sh`](#installsh)        | macOS / Linux / WSL  | Устанавливает Node при необходимости, устанавливает OpenClaw через npm (по умолчанию) или git и может запустить онбординг. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Устанавливает Node + OpenClaw в локальный префикс (`~/.openclaw`) в режимах npm или git checkout. Root не требуется.     |
| [`install.ps1`](#installps1)      | Windows (PowerShell) | Устанавливает Node при необходимости, устанавливает OpenClaw через npm (по умолчанию) или git и может запустить онбординг. |

## Быстрые команды

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
Если установка завершилась успешно, но `openclaw` не найден в новом терминале, см. [устранение неполадок Node.js](/ru/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Рекомендуется для большинства интерактивных установок на macOS/Linux/WSL.
</Tip>

### Процесс (install.sh)

<Steps>
  <Step title="Определение ОС">
    Поддерживает macOS и Linux (включая WSL).
  </Step>
  <Step title="Обеспечение Node.js 24 по умолчанию">
    Проверяет версию Node и устанавливает Node 24 при необходимости (Homebrew на macOS, установочные скрипты NodeSource на Linux apt/dnf/yum). На macOS Homebrew устанавливается только тогда, когда он нужен установщику для Node или Git. OpenClaw по-прежнему поддерживает Node 22 LTS, сейчас `22.19+`, для совместимости.
    На Alpine/musl Linux установщик использует пакеты apk вместо NodeSource; настроенные репозитории Alpine должны предоставлять Node `22.19+` (Alpine 3.21 или новее на момент написания).
  </Step>
  <Step title="Обеспечение Git">
    Устанавливает Git, если он отсутствует, с помощью обнаруженного менеджера пакетов, включая Homebrew на macOS и apk на Alpine.
  </Step>
  <Step title="Установка OpenClaw">
    - метод `npm` (по умолчанию): глобальная установка npm
    - метод `git`: клонирование/обновление репозитория, установка зависимостей через pnpm, сборка, затем установка обертки в `~/.local/bin/openclaw`

  </Step>
  <Step title="Задачи после установки">
    - По возможности обновляет загруженную службу Gateway (`openclaw gateway install --force`, затем перезапуск)
    - Запускает `openclaw doctor --non-interactive` при обновлениях и установках через git (по возможности)
    - Пытается выполнить онбординг, когда это уместно (доступен TTY, онбординг не отключен, проверки bootstrap/config пройдены)

  </Step>
</Steps>

### Обнаружение исходного checkout

Если скрипт запущен внутри checkout OpenClaw (`package.json` + `pnpm-workspace.yaml`), он предлагает:

- использовать checkout (`git`) или
- использовать глобальную установку (`npm`)

Если TTY недоступен и метод установки не задан, по умолчанию используется `npm` с предупреждением.

Скрипт завершается с кодом `2` при недопустимом выборе метода или недопустимых значениях `--install-method`.

### Примеры (install.sh)

<Tabs>
  <Tab title="По умолчанию">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Пропустить онбординг">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Установка Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="Checkout GitHub main">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Пробный запуск">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Справочник флагов">

| Флаг                                  | Описание                                                       |
| ------------------------------------- | -------------------------------------------------------------- |
| `--install-method npm\|git`           | Выбрать метод установки (по умолчанию: `npm`). Псевдоним: `--method` |
| `--npm`                               | Сокращение для метода npm                                      |
| `--git`                               | Сокращение для метода git. Псевдоним: `--github`               |
| `--version <version\|dist-tag\|spec>` | Версия npm, dist-tag или спецификация пакета (по умолчанию: `latest`) |
| `--beta`                              | Использовать beta dist-tag, если доступен, иначе откатиться к `latest` |
| `--git-dir <path>`                    | Каталог checkout (по умолчанию: `~/openclaw`). Псевдоним: `--dir` |
| `--no-git-update`                     | Пропустить `git pull` для существующего checkout               |
| `--no-prompt`                         | Отключить запросы                                              |
| `--no-onboard`                        | Пропустить онбординг                                           |
| `--onboard`                           | Включить онбординг                                             |
| `--dry-run`                           | Печатать действия без применения изменений                     |
| `--verbose`                           | Включить отладочный вывод (`set -x`, журналы npm уровня notice) |
| `--help`                              | Показать использование (`-h`)                                  |

  </Accordion>

  <Accordion title="Справочник переменных окружения">

| Переменная                                        | Описание                                                               |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Метод установки                                                        |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Версия npm, dist-tag или спецификация пакета                           |
| `OPENCLAW_BETA=0\|1`                              | Использовать beta, если доступна                                       |
| `OPENCLAW_HOME=<path>`                            | Базовый каталог для состояния OpenClaw и путей git/онбординга по умолчанию |
| `OPENCLAW_GIT_DIR=<path>`                         | Каталог checkout                                                       |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Переключить обновления git                                             |
| `OPENCLAW_NO_PROMPT=1`                            | Отключить запросы                                                      |
| `OPENCLAW_NO_ONBOARD=1`                           | Пропустить онбординг                                                   |
| `OPENCLAW_DRY_RUN=1`                              | Режим пробного запуска                                                 |
| `OPENCLAW_VERBOSE=1`                              | Режим отладки                                                          |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Уровень журналирования npm                                             |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Предназначен для сред, где нужно разместить все под локальным префиксом
(по умолчанию `~/.openclaw`) и без системной зависимости Node. По умолчанию
поддерживает установки npm, а также установки из git checkout в том же потоке префикса.
</Info>

### Процесс (install-cli.sh)

<Steps>
  <Step title="Установка локальной среды выполнения Node">
    Загружает закрепленный поддерживаемый tarball Node LTS (версия встроена в скрипт и обновляется независимо) в `<prefix>/tools/node-v<version>` и проверяет SHA-256.
    На Alpine/musl Linux, где Node не публикует совместимые tarball для закрепленной среды выполнения, устанавливает `nodejs` и `npm` через `apk` и связывает эту среду выполнения с путем обертки префикса. Репозитории Alpine должны предоставлять Node `22.19+`; используйте Alpine 3.21 или новее, если старые репозитории предоставляют только Node 20 или 21.
  </Step>
  <Step title="Обеспечение Git">
    Если Git отсутствует, пытается установить его через apt/dnf/yum/apk на Linux или Homebrew на macOS.
  </Step>
  <Step title="Установка OpenClaw под префиксом">
    - метод `npm` (по умолчанию): устанавливает под префиксом с помощью npm, затем записывает обертку в `<prefix>/bin/openclaw`
    - метод `git`: клонирует/обновляет checkout (по умолчанию `~/openclaw`) и все равно записывает обертку в `<prefix>/bin/openclaw`

  </Step>
  <Step title="Обновление загруженной службы Gateway">
    Если служба Gateway уже загружена из того же префикса, скрипт запускает
    `openclaw gateway install --force`, затем `openclaw gateway restart` и
    по возможности проверяет работоспособность Gateway.
  </Step>
</Steps>

### Примеры (install-cli.sh)

<Tabs>
  <Tab title="По умолчанию">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Пользовательский префикс + версия">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Установка Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="JSON-вывод для автоматизации">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Запустить онбординг">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Справочник флагов">

| Флаг                        | Описание                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Префикс установки (по умолчанию: `~/.openclaw`)                                         |
| `--install-method npm\|git` | Выбрать метод установки (по умолчанию: `npm`). Псевдоним: `--method`                       |
| `--npm`                     | Сокращение для метода npm                                                         |
| `--git`, `--github`         | Сокращение для метода git                                                         |
| `--git-dir <path>`          | Каталог checkout Git (по умолчанию: `~/openclaw`). Псевдоним: `--dir`                  |
| `--version <ver>`           | Версия OpenClaw или dist-tag (по умолчанию: `latest`)                                |
| `--node-version <ver>`      | Версия Node (по умолчанию: `22.22.0`)                                               |
| `--json`                    | Выводить события NDJSON                                                              |
| `--onboard`                 | Запустить `openclaw onboard` после установки                                            |
| `--no-onboard`              | Пропустить онбординг (по умолчанию)                                                       |
| `--set-npm-prefix`          | В Linux принудительно задать префикс npm как `~/.npm-global`, если текущий префикс недоступен для записи |
| `--help`                    | Показать использование (`-h`)                                                               |

  </Accordion>

  <Accordion title="Справочник переменных окружения">

| Переменная                                    | Описание                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | Префикс установки                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Метод установки                                                     |
| `OPENCLAW_VERSION=<ver>`                    | Версия OpenClaw или dist-tag                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | Версия Node                                                       |
| `OPENCLAW_HOME=<path>`                      | Базовый каталог для состояния OpenClaw и путей git/онбординга по умолчанию |
| `OPENCLAW_GIT_DIR=<path>`                   | Каталог checkout Git для установок через git                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Включить или отключить обновления git для существующих checkout                          |
| `OPENCLAW_NO_ONBOARD=1`                     | Пропустить онбординг                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Уровень логирования npm                                                      |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Поток (install.ps1)

<Steps>
  <Step title="Проверить окружение PowerShell + Windows">
    Требуется PowerShell 5+.
  </Step>
  <Step title="Обеспечить Node.js 24 по умолчанию">
    Если отсутствует, выполняется попытка установки через winget, затем Chocolatey, затем Scoop. Если менеджер пакетов недоступен, скрипт загружает официальный Windows zip Node.js в `%LOCALAPPDATA%\OpenClaw\deps\portable-node` и добавляет его в PATH текущего процесса и пользователя. Node 22 LTS, сейчас `22.19+`, остается поддерживаемым для совместимости.
  </Step>
  <Step title="Установить OpenClaw">
    - Метод `npm` (по умолчанию): глобальная установка npm с выбранным `-Tag`, запускается из доступного для записи временного каталога установщика, поэтому оболочки, открытые в защищенных папках, таких как `C:\`, продолжают работать
    - Метод `git`: клонировать/обновить репозиторий, установить/собрать с pnpm и установить wrapper в `%USERPROFILE%\.local\bin\openclaw.cmd`. Если Git отсутствует, скрипт подготавливает user-local MinGit в `%LOCALAPPDATA%\OpenClaw\deps\portable-git` и добавляет его в PATH текущего процесса и пользователя.

  </Step>
  <Step title="Задачи после установки">
    - По возможности добавляет нужный каталог bin в PATH пользователя
    - По мере возможности обновляет загруженную службу Gateway (`openclaw gateway install --force`, затем перезапуск)
    - Запускает `openclaw doctor --non-interactive` при обновлениях и установках через git (по мере возможности)

  </Step>
  <Step title="Обработать сбои">
    Установки через `iwr ... | iex` и scriptblock сообщают о завершающей ошибке, не закрывая текущий сеанс PowerShell. Прямые установки через `powershell -File` / `pwsh -File` по-прежнему завершаются с ненулевым кодом для автоматизации.
  </Step>
</Steps>

### Примеры (install.ps1)

<Tabs>
  <Tab title="По умолчанию">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Установка через Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="Checkout GitHub main">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="Пользовательский каталог git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Пробный запуск">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Трассировка отладки">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Справочник флагов">

| Флаг                        | Описание                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Метод установки (по умолчанию: `npm`)                            |
| `-Tag <tag\|version\|spec>` | npm dist-tag, версия или спецификация пакета (по умолчанию: `latest`) |
| `-GitDir <path>`            | Каталог checkout (по умолчанию: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | Пропустить онбординг                                            |
| `-NoGitUpdate`              | Пропустить `git pull`                                            |
| `-DryRun`                   | Только вывести действия                                         |

  </Accordion>

  <Accordion title="Справочник переменных окружения">

| Переменная                           | Описание        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Метод установки     |
| `OPENCLAW_GIT_DIR=<path>`          | Каталог checkout |
| `OPENCLAW_NO_ONBOARD=1`            | Пропустить онбординг    |
| `OPENCLAW_GIT_UPDATE=0`            | Отключить git pull   |
| `OPENCLAW_DRY_RUN=1`               | Режим пробного запуска       |

  </Accordion>
</AccordionGroup>

<Note>
Если используется `-InstallMethod git` и Git отсутствует, скрипт пытается подготовить user-local MinGit, прежде чем вывести ссылку на Git for Windows.
</Note>

---

## CI и автоматизация

Используйте неинтерактивные флаги/переменные окружения для предсказуемых запусков.

<Tabs>
  <Tab title="install.sh (неинтерактивный npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (неинтерактивный git)">
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
  <Tab title="install.ps1 (пропуск онбординга)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Почему требуется Git?">
    Git требуется для метода установки `git`. Для установок через `npm` Git все равно проверяется/устанавливается, чтобы избежать сбоев `spawn git ENOENT`, когда зависимости используют URL git.
  </Accordion>

  <Accordion title="Почему npm получает EACCES в Linux?">
    Некоторые конфигурации Linux указывают глобальный префикс npm на пути, принадлежащие root. `install.sh` может переключить префикс на `~/.npm-global` и добавить экспорты PATH в rc-файлы оболочки (если эти файлы существуют).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Повторно запустите установщик, чтобы он мог подготовить user-local MinGit, или установите Git for Windows и заново откройте PowerShell.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Выполните `npm config get prefix` и добавьте этот каталог в пользовательский PATH (суффикс `\bin` в Windows не нужен), затем заново откройте PowerShell.
  </Accordion>

  <Accordion title="Windows: как получить подробный вывод установщика">
    `install.ps1` сейчас не предоставляет переключатель `-Verbose`.
    Используйте трассировку PowerShell для диагностики на уровне скрипта:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw не найден после установки">
    Обычно это проблема PATH. См. [устранение неполадок Node.js](/ru/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Связанное

- [Обзор установки](/ru/install)
- [Обновление](/ru/install/updating)
- [Удаление](/ru/install/uninstall)
