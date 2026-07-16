---
read_when:
    - Перед встановленням OpenClaw потрібно встановити Node.js
    - Ви встановили OpenClaw, але команда `openclaw` не знайдена
    - Глобальне встановлення через `npm install -g` завершується помилкою через проблеми з дозволами або `PATH`
summary: Установлення та налаштування Node.js для OpenClaw — вимоги до версії, варіанти встановлення й усунення несправностей із PATH
title: Node.js
x-i18n:
    generated_at: "2026-07-16T18:11:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef4df255c24a11a549c757b597a07b00852e60973a5e513bdcf60796037a462a
    source_path: install/node.md
    workflow: 16
---

OpenClaw потребує **Node 22.22.3+, Node 24.15+ або Node 25.9+**. **Node 24 — стандартне та рекомендоване середовище виконання** для встановлення, CI й робочих процесів випуску; Node 22 залишається підтримуваним у межах активної гілки LTS. Node 23 не підтримується. [Сценарій встановлення](/uk/install#alternative-install-methods) автоматично виявляє та встановлює Node — скористайтеся цією сторінкою, якщо хочете налаштувати Node самостійно (версії, PATH, глобальні встановлення).

## Перевірте версію

```bash
node -v
```

Рекомендований стандартний варіант — `v24.15.0` або новіша версія 24.x. `v22.22.3` або новіша версія 22.x — підтримуваний варіант Node 22 LTS; Node `v25.9.0+` також підтримується. Node 23 не підтримується. Якщо Node відсутній або його версія не належить до підтримуваного діапазону, виберіть нижче спосіб встановлення.

## Установіть Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (рекомендовано):

    ```bash
    brew install node
    ```

    Або завантажте інсталятор для macOS із [nodejs.org](https://nodejs.org/).

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

    Або завантажте інсталятор для Windows із [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Використання менеджера версій (nvm, fnm, mise, asdf)">
  Менеджери версій дають змогу легко перемикатися між версіями Node. Популярні варіанти:

- [**fnm**](https://github.com/Schniz/fnm) — швидкий і кросплатформний
- [**nvm**](https://github.com/nvm-sh/nvm) — широко використовується в macOS/Linux
- [**mise**](https://mise.jdx.dev/) — багатомовний (Node, Python, Ruby тощо)

Приклад із fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Ініціалізуйте менеджер версій у файлі запуску оболонки (`~/.zshrc` або `~/.bashrc`). Якщо пропустити цей крок, у нових сеансах термінала команда `openclaw` може бути недоступною, оскільки PATH не міститиме каталогу виконуваних файлів Node.
  </Warning>
</Accordion>

## Усунення несправностей

### `openclaw: command not found`

Це майже завжди означає, що каталог глобальних виконуваних файлів npm відсутній у PATH.

<Steps>
  <Step title="Знайдіть глобальний префікс npm">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Перевірте, чи є він у PATH">
    ```bash
    echo "$PATH"
    ```

    Знайдіть у виведених даних `<npm-prefix>/bin` (macOS/Linux) або `<npm-prefix>` (Windows).

  </Step>
  <Step title="Додайте його до файлу запуску оболонки">
    <Tabs>
      <Tab title="macOS / Linux">
        Додайте до `~/.zshrc` або `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Потім відкрийте новий термінал (або виконайте `rehash` у zsh / `hash -r` у bash).
      </Tab>
      <Tab title="Windows">
        Додайте результат виконання `npm prefix -g` до системного PATH через Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Помилки дозволів під час виконання `npm install -g` (Linux)

Якщо виникають помилки `EACCES`, змініть глобальний префікс npm на каталог, доступний користувачеві для запису:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Додайте рядок `export PATH=...` до `~/.bashrc` або `~/.zshrc`, щоб зберегти цю зміну назавжди.

## Пов’язані матеріали

- [Огляд встановлення](/uk/install) — усі способи встановлення
- [Оновлення](/uk/install/updating) — підтримання OpenClaw в актуальному стані
- [Початок роботи](/uk/start/getting-started) — перші кроки після встановлення
