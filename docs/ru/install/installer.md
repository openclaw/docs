---
read_when:
    - Вы хотите разобраться в `openclaw.ai/install.sh`
    - Вы хотите автоматизировать установку (CI / без графического интерфейса)
    - Вы хотите выполнить установку из рабочей копии репозитория GitHub
summary: Как работают скрипты установки (install.sh, install-cli.sh, install.ps1), флаги и автоматизация
title: Внутреннее устройство установщика
x-i18n:
    generated_at: "2026-07-12T11:30:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 59b38a2eecbf15cc966beada81acf1824229a3825c73ae33ea0f8e89612bdf5b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw поставляется с тремя сценариями установки, доступными с `openclaw.ai`.

| Сценарий                          | Платформа            | Назначение                                                                                                                       |
| --------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | При необходимости устанавливает Node, устанавливает OpenClaw через npm (по умолчанию) или git, может запустить первоначальную настройку. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Устанавливает Node и OpenClaw в локальный префикс (`~/.openclaw`) через npm или git. Права root не требуются.                     |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | При необходимости устанавливает Node, устанавливает OpenClaw через npm (по умолчанию) или git, может запустить первоначальную настройку. |

Все три сценария поддерживают Node **22.19+, 23.11+ или 24+**; для новых установок по умолчанию используется Node 24.

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
Если установка завершилась успешно, но команда `openclaw` не обнаруживается в новом терминале, см. раздел [Устранение неполадок Node.js](/ru/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Рекомендуется для большинства интерактивных установок в macOS, Linux и WSL.
</Tip>

### Процесс установки (install.sh)

<Steps>
  <Step title="Определение ОС">
    Поддерживаются macOS и Linux, включая WSL.
  </Step>
  <Step title="Установка Node.js 24 по умолчанию">
    Проверяет версию Node и при необходимости устанавливает Node 24 (с помощью Homebrew в macOS и сценариев настройки NodeSource в Linux с apt/dnf/yum). В macOS Homebrew устанавливается только в том случае, если он необходим установщику для Node или Git. Для совместимости также поддерживаются Node 22.19+ и 23.11+.
    В Alpine и Linux на базе musl установщик вместо NodeSource использует пакеты apk; настроенные репозитории Alpine должны предоставлять поддерживаемую версию Node (на момент написания документации — Alpine 3.21 или новее).
  </Step>
  <Step title="Установка Git">
    Если Git отсутствует, устанавливает его с помощью обнаруженного менеджера пакетов, включая Homebrew в macOS и apk в Alpine.
  </Step>
  <Step title="Установка OpenClaw">
    - Метод `npm` (по умолчанию): глобальная установка через npm
    - Метод `git`: клонирование или обновление репозитория, установка зависимостей с помощью pnpm, сборка и последующая установка оболочки в `~/.local/bin/openclaw`

  </Step>
  <Step title="Действия после установки">
    - Определяет путь к только что установленному исполняемому файлу `openclaw` для последующих команд
    - Для ненастроенной установки запускает первоначальную настройку до диагностики или проверок Gateway. При использовании `--no-onboard` или отсутствии TTY выводит команду, позволяющую завершить настройку позже.
    - Для настроенной установки по возможности обновляет и перезапускает загруженную службу Gateway, а затем запускает диагностику. При обновлении по возможности обновляет плагины либо в безголовом запуске с включёнными запросами выводит команду для ручного выполнения.
    - При использовании `--verify` проверяет установленную версию, а состояние Gateway — только при наличии конфигурации.

  </Step>
</Steps>

### Обнаружение рабочей копии исходного кода

При запуске внутри рабочей копии OpenClaw (`package.json` + `pnpm-workspace.yaml`) сценарий предлагает:

- использовать рабочую копию (`git`) или
- использовать глобальную установку (`npm`)

Если TTY недоступен и метод установки не задан, по умолчанию выбирается `npm` и выводится предупреждение.

При выборе недопустимого метода или недопустимом значении `--install-method` сценарий завершается с кодом `2`.

### Примеры (install.sh)

<Tabs>
  <Tab title="По умолчанию">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Пропустить первоначальную настройку">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Установка через Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="Рабочая копия основной ветки GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Пробный запуск">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="Проверка после установки">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Справочник по флагам">

| Флаг                                    | Описание                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------ |
| `--install-method \| --method npm\|git` | Выбор метода установки (по умолчанию: `npm`)                                                |
| `--npm`                                 | Сокращение для метода npm                                                                  |
| `--git \| --github`                     | Сокращение для метода git                                                                  |
| `--version <version\|dist-tag\|spec>`   | Версия npm, тег дистрибутива или спецификация пакета (по умолчанию: `latest`)               |
| `--beta`                                | Использовать тег дистрибутива beta, если он доступен, иначе вернуться к `latest`            |
| `--git-dir \| --dir <path>`             | Каталог рабочей копии (по умолчанию: `~/openclaw`)                                         |
| `--no-git-update`                       | Пропустить `git pull` для существующей рабочей копии                                        |
| `--no-prompt`                           | Отключить запросы                                                                          |
| `--no-onboard`                          | Пропустить первоначальную настройку                                                        |
| `--onboard`                             | Включить первоначальную настройку                                                          |
| `--verify`                              | Выполнить быструю проверку после установки (`--version` и состояние Gateway, если он загружен) |
| `--dry-run`                             | Вывести действия без применения изменений                                                  |
| `--verbose`                             | Включить отладочный вывод (`set -x`, журналы npm уровня notice)                             |
| `--help \| -h`                          | Показать справку                                                                           |

  </Accordion>

  <Accordion title="Справочник по переменным окружения">

| Переменная                                        | Описание                                                                                      |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Метод установки                                                                               |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Версия npm, тег дистрибутива или спецификация пакета                                           |
| `OPENCLAW_BETA=0\|1`                              | Использовать beta, если она доступна                                                           |
| `OPENCLAW_HOME=<path>`                            | Базовый каталог для состояния OpenClaw и стандартных путей git и первоначальной настройки      |
| `OPENCLAW_GIT_DIR=<path>`                         | Каталог рабочей копии                                                                          |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Включение или отключение обновлений git                                                        |
| `OPENCLAW_NO_PROMPT=1`                            | Отключить запросы                                                                              |
| `OPENCLAW_VERIFY_INSTALL=1`                       | Выполнить быструю проверку после установки                                                     |
| `OPENCLAW_NO_ONBOARD=1`                           | Пропустить первоначальную настройку                                                            |
| `OPENCLAW_DRY_RUN=1`                              | Режим пробного запуска                                                                         |
| `OPENCLAW_VERBOSE=1`                              | Режим отладки                                                                                  |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Уровень журналирования npm (по умолчанию: `error`, скрывает сообщения npm об устаревших функциях) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Предназначен для сред, где всё должно находиться в локальном префиксе
(по умолчанию `~/.openclaw`) без зависимости от системной установки Node. По умолчанию
поддерживает установку через npm, а также установку из рабочей копии git в рамках того же процесса с префиксом.
</Info>

### Процесс установки (install-cli.sh)

<Steps>
  <Step title="Установка локальной среды выполнения Node">
    Загружает архив tar с закреплённой поддерживаемой версией Node LTS (версия встроена в сценарий и обновляется независимо; по умолчанию `22.22.2`) в `<prefix>/tools/node-v<version>` и проверяет SHA-256.
    В Alpine и Linux на базе musl, для которых Node не публикует совместимые архивы с закреплённой средой выполнения, устанавливает `nodejs` и `npm` с помощью `apk` и связывает эту среду выполнения с путём оболочки в префиксе. Репозитории Alpine должны предоставлять поддерживаемую версию Node (22.19+, 23.11+ или 24+); используйте Alpine 3.21 или новее, если старые репозитории предоставляют только Node 20 или 21.
  </Step>
  <Step title="Установка Git">
    Если Git отсутствует, пытается установить его через apt/dnf/yum/apk в Linux или Homebrew в macOS.
  </Step>
  <Step title="Установка OpenClaw в префикс">
    - Метод `npm` (по умолчанию): устанавливает OpenClaw в префикс с помощью npm, затем записывает оболочку в `<prefix>/bin/openclaw`
    - Метод `git`: клонирует или обновляет рабочую копию (по умолчанию `~/openclaw`) и также записывает оболочку в `<prefix>/bin/openclaw`

  </Step>
  <Step title="Обновление загруженной службы Gateway">
    Если служба Gateway уже загружена из того же префикса, сценарий выполняет
    `openclaw gateway install --force`, затем `openclaw gateway restart` и
    по возможности проверяет состояние Gateway.
  </Step>
</Steps>

### Примеры (install-cli.sh)

<Tabs>
  <Tab title="По умолчанию">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Пользовательский префикс и версия">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Установка через Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Вывод JSON для автоматизации">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Запуск первоначальной настройки">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Справочник по флагам">

| Флаг                                    | Описание                                                                                       |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `--prefix <path>`                       | Префикс установки (по умолчанию: `~/.openclaw`)                                                |
| `--install-method \| --method npm\|git` | Выбрать способ установки (по умолчанию: `npm`)                                                 |
| `--npm`                                 | Сокращение для способа установки через npm                                                     |
| `--git \| --github`                     | Сокращение для способа установки через git                                                     |
| `--git-dir \| --dir <path>`             | Каталог рабочей копии Git (по умолчанию: `~/openclaw`)                                         |
| `--version <ver>`                       | Версия или тег дистрибутива OpenClaw (по умолчанию: `latest`)                                  |
| `--node-version <ver>`                  | Версия Node (по умолчанию: `22.22.2`)                                                          |
| `--json`                                | Выводить события NDJSON                                                                        |
| `--onboard`                             | Запустить `openclaw onboard` после установки                                                   |
| `--no-onboard`                          | Пропустить первоначальную настройку (по умолчанию)                                             |
| `--set-npm-prefix`                      | В Linux принудительно задать префикс npm `~/.npm-global`, если текущий префикс недоступен для записи |
| `--help \| -h`                          | Показать справку по использованию                                                               |

  </Accordion>

  <Accordion title="Справочник переменных окружения">

| Переменная                                  | Описание                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | Префикс установки                                                        |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Способ установки                                                         |
| `OPENCLAW_VERSION=<ver>`                    | Версия или тег дистрибутива OpenClaw                                     |
| `OPENCLAW_NODE_VERSION=<ver>`               | Версия Node                                                              |
| `OPENCLAW_HOME=<path>`                      | Базовый каталог для состояния OpenClaw и путей git/первоначальной настройки по умолчанию |
| `OPENCLAW_GIT_DIR=<path>`                   | Каталог рабочей копии Git для установок через git                        |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Включить или отключить обновления git для существующих рабочих копий     |
| `OPENCLAW_NO_ONBOARD=1`                     | Пропустить первоначальную настройку                                      |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Уровень журналирования npm (по умолчанию: `error`)                        |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` и другие спецификации исходного кода GitHub нельзя указывать в `--version` при установке через npm. Вместо этого используйте `--install-method git --version main`.
</Note>

---

<a id="installps1"></a>

## install.ps1

### Процесс работы (install.ps1)

<Steps>
  <Step title="Проверка PowerShell и среды Windows">
    Требуется PowerShell 5 или новее.
  </Step>
  <Step title="Установка Node.js 24 по умолчанию">
    Если Node.js отсутствует, предпринимается попытка установить его сначала через winget, затем через Chocolatey и Scoop. Если ни один менеджер пакетов недоступен, скрипт загружает официальный ZIP-архив Node.js 24 для Windows в `%LOCALAPPDATA%\OpenClaw\deps\portable-node` и добавляет его в PATH текущего процесса и пользователя. Для совместимости по-прежнему поддерживаются Node 22.19+ и 23.11+.
  </Step>
  <Step title="Установка OpenClaw">
    - Способ `npm` (по умолчанию): глобальная установка через npm с выбранным значением `-Tag`, запускаемая из доступного для записи временного каталога установщика, чтобы команда работала даже в оболочках, открытых в защищённых каталогах, например `C:\`
    - Способ `git`: клонирование или обновление репозитория, установка и сборка с помощью pnpm, а также установка командного файла-обёртки в `%USERPROFILE%\.local\bin\openclaw.cmd`. Если Git отсутствует, скрипт устанавливает локальный для пользователя MinGit в `%LOCALAPPDATA%\OpenClaw\deps\portable-git` и добавляет его в PATH текущего процесса и пользователя.

  </Step>
  <Step title="Задачи после установки">
    - По возможности добавляет необходимый каталог исполняемых файлов в пользовательский PATH
    - По возможности обновляет загруженную службу Gateway (`openclaw gateway install --force`, затем перезапуск)
    - При обновлениях и установках через git запускает `openclaw doctor --non-interactive` (по возможности)

  </Step>
  <Step title="Обработка сбоев">
    При установке через `iwr ... | iex` и блоки скриптов выдаётся завершающая ошибка без закрытия текущего сеанса PowerShell. При прямом запуске через `powershell -File` / `pwsh -File` процесс по-прежнему завершается с ненулевым кодом, что подходит для автоматизации.
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
  <Tab title="Рабочая копия основной ветви GitHub">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="Пользовательский каталог Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Пробный запуск">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Справочник флагов">

| Флаг                        | Описание                                                               |
| --------------------------- | ---------------------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Способ установки (по умолчанию: `npm`)                                 |
| `-Tag <tag\|version\|spec>` | Тег дистрибутива npm, версия или спецификация пакета (по умолчанию: `latest`) |
| `-GitDir <path>`            | Каталог рабочей копии (по умолчанию: `%USERPROFILE%\openclaw`)         |
| `-NoOnboard`                | Пропустить первоначальную настройку                                    |
| `-NoGitUpdate`              | Пропустить `git pull`                                                   |
| `-DryRun`                   | Только вывести выполняемые действия                                    |

  </Accordion>

  <Accordion title="Справочник переменных окружения">

| Переменная                         | Описание                              |
| ---------------------------------- | ------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Способ установки                      |
| `OPENCLAW_GIT_DIR=<path>`          | Каталог рабочей копии                 |
| `OPENCLAW_NO_ONBOARD=1`            | Пропустить первоначальную настройку   |
| `OPENCLAW_GIT_UPDATE=0`            | Отключить `git pull`                  |
| `OPENCLAW_DRY_RUN=1`               | Режим пробного запуска                |

  </Accordion>
</AccordionGroup>

<Note>
Если используется `-InstallMethod git`, а Git отсутствует, перед выводом ссылки на Git for Windows скрипт пытается установить локальный для пользователя MinGit.
</Note>

---

## Непрерывная интеграция и автоматизация

Для предсказуемого выполнения используйте неинтерактивные флаги и переменные окружения.

<Tabs>
  <Tab title="install.sh (неинтерактивная установка через npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (неинтерактивная установка через git)">
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
  <Tab title="install.ps1 (без первоначальной настройки)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Почему требуется Git?">
    Git требуется для способа установки `git`. При установке через `npm` наличие Git также проверяется, и при необходимости он устанавливается, чтобы избежать ошибок `spawn git ENOENT`, когда зависимости используют URL-адреса git.
  </Accordion>

  <Accordion title="Почему npm выдаёт ошибку EACCES в Linux?">
    В некоторых конфигурациях Linux глобальный префикс npm указывает на каталоги, принадлежащие пользователю root. `install.sh` может изменить префикс на `~/.npm-global` и добавить команды экспорта PATH в файлы конфигурации оболочки, если они существуют.
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Повторно запустите установщик, чтобы он мог установить локальный для пользователя MinGit, либо установите Git for Windows и заново откройте PowerShell.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Выполните `npm config get prefix`, добавьте полученный каталог в пользовательский PATH (в Windows суффикс `\bin` не требуется), затем заново откройте PowerShell.
  </Accordion>

  <Accordion title="Windows: как получить подробный вывод установщика">
    `install.ps1` не предоставляет параметр `-Verbose`.
    Для диагностики на уровне скрипта используйте трассировку PowerShell:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw не найден после установки">
    Обычно проблема связана с PATH. См. раздел [Устранение неполадок Node.js](/ru/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Связанные материалы

- [Обзор установки](/ru/install)
- [Обновление](/ru/install/updating)
- [Удаление](/ru/install/uninstall)
