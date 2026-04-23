---
read_when:
    - Вам потрібно встановити Node.js перед встановленням OpenClaw
    - Ви встановили OpenClaw, але `openclaw` — command not found
    - '`npm install -g` завершується помилкою через проблеми з дозволами або PATH'
summary: Встановлення й налаштування Node.js для OpenClaw — вимоги до версії, варіанти встановлення та усунення несправностей PATH
title: Node.js
x-i18n:
    generated_at: "2026-04-23T20:57:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99c72b917fa8beba136ee6010799c0183cff8b2420b5a1bd256d9155e50f065a
    source_path: install/node.md
    workflow: 15
---

OpenClaw потребує **Node 22.14 або новішої версії**. **Node 24 — типовий і рекомендований runtime** для встановлень, CI і робочих процесів релізу. Node 22 залишається підтримуваним через активну гілку LTS. [Скрипт інсталятора](/uk/install#alternative-install-methods) автоматично визначить і встановить Node — ця сторінка призначена для випадків, коли ви хочете налаштувати Node самостійно й переконатися, що все підключено правильно (версії, PATH, глобальні встановлення).

## Перевірте свою версію

```bash
node -v
```

Якщо це виводить `v24.x.x` або вище, ви використовуєте рекомендоване типове значення. Якщо виводить `v22.14.x` або вище, ви на підтримуваному шляху Node 22 LTS, але ми все одно рекомендуємо перейти на Node 24, коли це буде зручно. Якщо Node не встановлено або версія занадто стара, виберіть один із варіантів встановлення нижче.

## Встановлення Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (рекомендовано):

    ```bash
    brew install node
    ```

    Або завантажте інсталятор для macOS з [nodejs.org](https://nodejs.org/).

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

    Або використовуйте менеджер версій (див. нижче).

  </Tab>
  <Tab title="Windows">
    **winget** (рекомендовано):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    Або завантажте інсталятор для Windows з [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Використання менеджера версій (nvm, fnm, mise, asdf)">
  Менеджери версій дають змогу легко перемикатися між версіями Node. Популярні варіанти:

- [**fnm**](https://github.com/Schniz/fnm) — швидкий, кросплатформний
- [**nvm**](https://github.com/nvm-sh/nvm) — широко використовується на macOS/Linux
- [**mise**](https://mise.jdx.dev/) — поліглотний (Node, Python, Ruby тощо)

Приклад із fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Переконайтеся, що ваш менеджер версій ініціалізується у файлі запуску shell (`~/.zshrc` або `~/.bashrc`). Якщо ні, `openclaw` може не знаходитися в нових сесіях термінала, тому що PATH не міститиме каталог bin для Node.
  </Warning>
</Accordion>

## Усунення несправностей

### `openclaw: command not found`

Майже завжди це означає, що глобальний каталог bin для npm відсутній у вашому PATH.

<Steps>
  <Step title="Знайдіть свій глобальний npm prefix">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Перевірте, чи є він у вашому PATH">
    ```bash
    echo "$PATH"
    ```

    Шукайте `<npm-prefix>/bin` (macOS/Linux) або `<npm-prefix>` (Windows) у виводі.

  </Step>
  <Step title="Додайте його у файл запуску shell">
    <Tabs>
      <Tab title="macOS / Linux">
        Додайте в `~/.zshrc` або `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Потім відкрийте новий термінал (або виконайте `rehash` у zsh / `hash -r` у bash).
      </Tab>
      <Tab title="Windows">
        Додайте вивід `npm prefix -g` до системного PATH через Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Помилки дозволів під час `npm install -g` (Linux)

Якщо ви бачите помилки `EACCES`, перемкніть глобальний prefix npm на каталог, доступний для запису користувачем:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Додайте рядок `export PATH=...` у `~/.bashrc` або `~/.zshrc`, щоб зробити це постійним.

## Пов’язане

- [Огляд встановлення](/uk/install) — усі способи встановлення
- [Оновлення](/uk/install/updating) — як підтримувати OpenClaw в актуальному стані
- [Початок роботи](/uk/start/getting-started) — перші кроки після встановлення
