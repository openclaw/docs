---
read_when:
    - Потрібно встановити Node.js перед установленням OpenClaw
    - Ви встановили OpenClaw, але `openclaw` — команду не знайдено
    - npm install -g завершується помилкою через проблеми з дозволами або PATH
summary: Встановлення та налаштування Node.js для OpenClaw — вимоги до версії, варіанти встановлення та усунення проблем із PATH
title: Node.js
x-i18n:
    generated_at: "2026-06-27T17:42:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90a2461458fd9995df264753259a3297b8aa316f9e4efd8290e527cbb46fc4e3
    source_path: install/node.md
    workflow: 16
---

OpenClaw потребує **Node 22.19 або новішої версії**. **Node 24 є типовим і рекомендованим середовищем виконання** для встановлень, CI та release workflow. Node 22 і далі підтримується через активну лінійку LTS. [Скрипт інсталятора](/uk/install#alternative-install-methods) автоматично виявить і встановить Node - ця сторінка призначена для випадків, коли ви хочете налаштувати Node самостійно й переконатися, що все підключено правильно (версії, PATH, глобальні встановлення).

## Перевірте свою версію

```bash
node -v
```

Якщо це виводить `v24.x.x` або вище, ви використовуєте рекомендоване типове середовище. Якщо це виводить `v22.19.x` або вище, ви використовуєте підтримуваний шлях Node 22 LTS, але ми все одно рекомендуємо оновитися до Node 24, коли буде зручно. Якщо Node не встановлено або версія занадто стара, виберіть спосіб встановлення нижче.

## Установіть Node

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

    Або скористайтеся менеджером версій (див. нижче).

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

<Accordion title="Using a version manager (nvm, fnm, mise, asdf)">
  Менеджери версій дають змогу легко перемикатися між версіями Node. Популярні варіанти:

- [**fnm**](https://github.com/Schniz/fnm) - швидкий, кросплатформний
- [**nvm**](https://github.com/nvm-sh/nvm) - широко використовується на macOS/Linux
- [**mise**](https://mise.jdx.dev/) - поліглотний (Node, Python, Ruby тощо)

Приклад із fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Переконайтеся, що ваш менеджер версій ініціалізовано у файлі запуску оболонки (`~/.zshrc` або `~/.bashrc`). Якщо ні, `openclaw` може не знаходитися в нових сеансах термінала, тому що PATH не міститиме каталог bin Node.
  </Warning>
</Accordion>

## Усунення неполадок

### `openclaw: command not found`

Це майже завжди означає, що глобальний каталог bin npm не входить до вашого PATH.

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

    Шукайте `<npm-prefix>/bin` (macOS/Linux) або `<npm-prefix>` (Windows) у виводі.

  </Step>
  <Step title="Add it to your shell startup file">
    <Tabs>
      <Tab title="macOS / Linux">
        Додайте до `~/.zshrc` або `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Потім відкрийте новий термінал (або виконайте `rehash` у zsh / `hash -r` у bash).
      </Tab>
      <Tab title="Windows">
        Додайте вивід `npm prefix -g` до системного PATH через Параметри → Система → Змінні середовища.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Помилки дозволів для `npm install -g` (Linux)

Якщо ви бачите помилки `EACCES`, перемкніть глобальний prefix npm на каталог, доступний користувачу для запису:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Додайте рядок `export PATH=...` до свого `~/.bashrc` або `~/.zshrc`, щоб зробити це постійним.

## Пов’язане

- [Огляд встановлення](/uk/install) - усі способи встановлення
- [Оновлення](/uk/install/updating) - підтримання OpenClaw в актуальному стані
- [Початок роботи](/uk/start/getting-started) - перші кроки після встановлення
