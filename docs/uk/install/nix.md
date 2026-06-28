---
read_when:
    - Вам потрібні відтворювані встановлення з можливістю відкату
    - Ви вже використовуєте Nix/NixOS/Home Manager
    - Ви хочете, щоб усе було закріплено й керувалося декларативно
summary: Установіть OpenClaw декларативно за допомогою Nix
title: Nix
x-i18n:
    generated_at: "2026-05-06T12:51:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b4c2eca298ac7ae60baea4d06855edb73c0b8bfe253a3f478d93e934b31253b
    source_path: install/nix.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Встановіть OpenClaw декларативно за допомогою **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** - офіційного, повністю укомплектованого модуля Home Manager.

<Info>
Репозиторій [nix-openclaw](https://github.com/openclaw/nix-openclaw) є джерелом істини для встановлення Nix. Ця сторінка - короткий огляд.
</Info>

## Що ви отримуєте

- Gateway + застосунок macOS + інструменти (whisper, spotify, cameras) -- усе зафіксовано
- Сервіс launchd, який зберігається після перезавантажень
- Система Plugin із декларативною конфігурацією
- Миттєве відкочування: `home-manager switch --rollback`

## Швидкий старт

<Steps>
  <Step title="Встановіть Determinate Nix">
    Якщо Nix ще не встановлено, дотримуйтеся інструкцій [інсталятора Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Створіть локальний flake">
    Використайте шаблон agent-first із репозиторію nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Налаштуйте секрети">
    Налаштуйте токен бота для обміну повідомленнями та API-ключ постачальника моделі. Звичайні файли в `~/.secrets/` цілком підходять.
  </Step>
  <Step title="Заповніть заповнювачі шаблону й перемкніться">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Перевірте">
    Переконайтеся, що сервіс launchd працює, а ваш бот відповідає на повідомлення.
  </Step>
</Steps>

Повні параметри модуля та приклади див. у [README nix-openclaw](https://github.com/openclaw/nix-openclaw).

## Поведінка середовища виконання в режимі Nix

Коли встановлено `OPENCLAW_NIX_MODE=1` (автоматично з nix-openclaw), OpenClaw переходить у детермінований режим для встановлень, керованих Nix. Інші пакети Nix можуть встановлювати той самий режим; nix-openclaw є офіційною референсною реалізацією.

Ви також можете встановити його вручну:

```bash
export OPENCLAW_NIX_MODE=1
```

У macOS GUI-застосунок не успадковує автоматично змінні середовища оболонки. Натомість увімкніть режим Nix через defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Що змінюється в режимі Nix

- Потоки автоматичного встановлення та самомодифікації вимкнено
- `openclaw.json` вважається незмінним. Типові значення, отримані під час запуску, залишаються лише в середовищі виконання, а засоби запису конфігурації, як-от setup, onboarding, мутаційний `openclaw update`, встановлення/оновлення/видалення/увімкнення Plugin, `doctor --fix`, `doctor --generate-gateway-token` і `openclaw config set`, відмовляються редагувати файл.
- Натомість агенти мають редагувати джерело Nix. Для nix-openclaw скористайтеся agent-first [Швидким стартом](https://github.com/openclaw/nix-openclaw#quick-start) і задайте конфігурацію в `programs.openclaw.config` або `instances.<name>.config`.
- Відсутні залежності показують повідомлення з інструкціями для Nix
- UI показує банер режиму Nix лише для читання

### Шляхи конфігурації та стану

OpenClaw читає конфігурацію JSON5 з `OPENCLAW_CONFIG_PATH` і зберігає змінювані дані в `OPENCLAW_STATE_DIR`. Під час роботи під Nix задавайте їх явно як розташування, керовані Nix, щоб стан середовища виконання та конфігурація залишалися поза незмінним сховищем.

| Змінна                 | Типове значення                         |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Виявлення PATH сервісу

Сервіс Gateway launchd/systemd автоматично виявляє бінарні файли Nix-профілю, щоб
plugins та інструменти, які запускають виконувані файли, встановлені через `nix`, працювали без
ручного налаштування PATH:

- Коли `NIX_PROFILES` встановлено, кожен запис додається до PATH сервісу з
  пріоритетом справа наліво (відповідає пріоритету оболонки Nix - перемагає найправіший).
- Коли `NIX_PROFILES` не встановлено, `~/.nix-profile/bin` додається як резервний варіант.

Це застосовується до середовищ сервісів macOS launchd і Linux systemd.

## Пов’язане

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Джерело істини для модуля Home Manager і повний посібник із налаштування.
  </Card>
  <Card title="Майстер налаштування" href="/uk/start/wizard" icon="wand-magic-sparkles">
    Покрокове налаштування CLI без Nix.
  </Card>
  <Card title="Docker" href="/uk/install/docker" icon="docker">
    Контейнеризоване налаштування як альтернатива без Nix.
  </Card>
  <Card title="Оновлення" href="/uk/install/updating" icon="arrow-up-right-from-square">
    Оновлення встановлень, керованих Home Manager, разом із пакетом.
  </Card>
</CardGroup>
