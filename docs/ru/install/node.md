---
read_when:
    - Перед установкой OpenClaw необходимо установить Node.js
    - Вы установили OpenClaw, но команда `openclaw` не найдена
    - npm install -g завершается с ошибкой из-за проблем с правами доступа или PATH
summary: Установка и настройка Node.js для OpenClaw — требования к версии, варианты установки и устранение неполадок с PATH
title: Node.js
x-i18n:
    generated_at: "2026-06-28T23:08:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90a2461458fd9995df264753259a3297b8aa316f9e4efd8290e527cbb46fc4e3
    source_path: install/node.md
    workflow: 16
---

OpenClaw требует **Node 22.19 или новее**. **Node 24 — среда выполнения по умолчанию и рекомендуемая среда** для установок, CI и рабочих процессов выпуска. Node 22 остается поддерживаемым через активную ветку LTS. [Скрипт установки](/ru/install#alternative-install-methods) автоматически обнаружит и установит Node — эта страница предназначена для случаев, когда вы хотите настроить Node самостоятельно и убедиться, что все подключено правильно (версии, PATH, глобальные установки).

## Проверьте свою версию

```bash
node -v
```

Если команда выводит `v24.x.x` или выше, вы используете рекомендуемую версию по умолчанию. Если она выводит `v22.19.x` или выше, вы используете поддерживаемый путь Node 22 LTS, но мы все равно рекомендуем перейти на Node 24, когда это будет удобно. Если Node не установлен или версия слишком старая, выберите способ установки ниже.

## Установите Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (рекомендуется):

    ```bash
    brew install node
    ```

    Или скачайте установщик для macOS с [nodejs.org](https://nodejs.org/).

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    Или используйте менеджер версий (см. ниже).

  </Tab>
  <Tab title="Windows">
    **winget** (рекомендуется):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    Или скачайте установщик для Windows с [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Using a version manager (nvm, fnm, mise, asdf)">
  Менеджеры версий позволяют легко переключаться между версиями Node. Популярные варианты:

- [**fnm**](https://github.com/Schniz/fnm) — быстрый, кроссплатформенный
- [**nvm**](https://github.com/nvm-sh/nvm) — широко используется в macOS/Linux
- [**mise**](https://mise.jdx.dev/) — многоязычный (Node, Python, Ruby и т. д.)

Пример с fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Убедитесь, что ваш менеджер версий инициализируется в файле запуска оболочки (`~/.zshrc` или `~/.bashrc`). Если это не так, `openclaw` может не находиться в новых сеансах терминала, потому что PATH не будет включать каталог bin Node.
  </Warning>
</Accordion>

## Устранение неполадок

### `openclaw: command not found`

Это почти всегда означает, что глобальный каталог bin npm не находится в вашем PATH.

<Steps>
  <Step title="Find your global npm prefix">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Check if it's on your PATH">
    ```bash
    echo "$PATH"
    ```

    Найдите в выводе `<npm-prefix>/bin` (macOS/Linux) или `<npm-prefix>` (Windows).

  </Step>
  <Step title="Add it to your shell startup file">
    <Tabs>
      <Tab title="macOS / Linux">
        Добавьте в `~/.zshrc` или `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Затем откройте новый терминал (или выполните `rehash` в zsh / `hash -r` в bash).
      </Tab>
      <Tab title="Windows">
        Добавьте вывод `npm prefix -g` в системный PATH через Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Ошибки разрешений при `npm install -g` (Linux)

Если вы видите ошибки `EACCES`, переключите глобальный префикс npm на каталог, доступный пользователю для записи:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Добавьте строку `export PATH=...` в `~/.bashrc` или `~/.zshrc`, чтобы сделать изменение постоянным.

## Связанные материалы

- [Обзор установки](/ru/install) — все способы установки
- [Обновление](/ru/install/updating) — поддержание OpenClaw в актуальном состоянии
- [Начало работы](/ru/start/getting-started) — первые шаги после установки
