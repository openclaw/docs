---
read_when:
    - Вам нужны воспроизводимые установки с возможностью отката
    - Вы уже используете Nix/NixOS/Home Manager
    - Вы хотите, чтобы всё было закреплено по версиям и управлялось декларативно
summary: Установите OpenClaw декларативно с помощью Nix
title: Nix
x-i18n:
    generated_at: "2026-07-13T18:20:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 6f74e259ec3d909c73d9184db24d236135db04c29c2e7fab9be9e6fa7f98ba91
    source_path: install/nix.md
    workflow: 16
---

Установите OpenClaw декларативно с помощью **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** — официального полнофункционального модуля Home Manager.

<Info>
Репозиторий [nix-openclaw](https://github.com/openclaw/nix-openclaw) — основной источник сведений об установке через Nix. На этой странице приведён краткий обзор.
</Info>

## Что вы получите

- Gateway + приложение для macOS + инструменты (whisper, spotify, камеры), все версии зафиксированы
- Служба launchd, продолжающая работать после перезагрузки
- Система плагинов с декларативной конфигурацией
- Мгновенный откат: `home-manager switch --rollback`

## Быстрый старт

<Steps>
  <Step title="Установите Determinate Nix">
    Если Nix ещё не установлен, следуйте инструкциям [установщика Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Создайте локальный flake">
    Используйте шаблон с приоритетом агента из репозитория nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Скопируйте templates/agent-first/flake.nix из репозитория nix-openclaw
    ```
  </Step>
  <Step title="Настройте секреты">
    Укажите токен бота для обмена сообщениями и API-ключ поставщика моделей. Обычные файлы в `~/.secrets/` вполне подходят.
  </Step>
  <Step title="Заполните заполнители шаблона и примените конфигурацию">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Проверьте">
    Убедитесь, что служба launchd работает, а бот отвечает на сообщения.
  </Step>
</Steps>

Полный список параметров модуля и примеры см. в [README nix-openclaw](https://github.com/openclaw/nix-openclaw).

## Поведение среды выполнения в режиме Nix

Когда задано `OPENCLAW_NIX_MODE=1` (при использовании nix-openclaw это происходит автоматически), OpenClaw переходит в детерминированный режим для установок под управлением Nix. Другие пакеты Nix также могут включать этот режим; nix-openclaw является официальной эталонной реализацией.

Его также можно включить вручную:

```bash
export OPENCLAW_NIX_MODE=1
```

В macOS приложение с графическим интерфейсом не наследует переменные окружения оболочки. Вместо этого включите режим Nix с помощью `defaults`:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Что меняется в режиме Nix

- Механизмы автоматической установки и самоизменения отключены.
- `openclaw.json` считается неизменяемым. Значения по умолчанию, определяемые при запуске, применяются только во время выполнения, а средства записи конфигурации (первоначальная настройка, ввод в эксплуатацию, изменяющие операции `openclaw update`, установка, обновление, удаление и включение плагинов, `doctor --fix`, `doctor --generate-gateway-token`, `openclaw config set`) отказываются изменять файл.
- Вместо этого измените исходный код Nix. Для nix-openclaw используйте ориентированный на агента раздел [«Быстрый старт»](https://github.com/openclaw/nix-openclaw#quick-start) и задайте конфигурацию в `programs.openclaw.config` или `instances.<name>.config`.
- При отсутствии зависимостей отображаются специальные сообщения Nix с инструкциями по устранению проблемы.
- В интерфейсе отображается баннер режима Nix «только для чтения».

### Пути конфигурации и состояния

OpenClaw считывает конфигурацию JSON5 из `OPENCLAW_CONFIG_PATH` и хранит изменяемые данные в `OPENCLAW_STATE_DIR`. При использовании Nix явно задайте для них расположения под управлением Nix, чтобы состояние среды выполнения и конфигурация не попадали в неизменяемое хранилище.

| Переменная             | Значение по умолчанию                   |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Обнаружение PATH для службы

Служба Gateway для launchd/systemd автоматически обнаруживает исполняемые файлы профиля Nix, поэтому плагины и инструменты, запускающие исполняемые файлы, установленные через `nix`, работают без ручной настройки PATH:

- Когда задано `NIX_PROFILES`, каждая запись добавляется в PATH службы с приоритетом справа налево (как в оболочке Nix: побеждает крайняя справа).
- Если `NIX_PROFILES` не задано, в качестве резервного варианта добавляется `~/.nix-profile/bin`.

Это относится как к окружению службы launchd в macOS, так и к окружению службы systemd в Linux.

## Связанные материалы

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Основной модуль Home Manager и полное руководство по настройке.
  </Card>
  <Card title="Мастер настройки" href="/ru/start/wizard" icon="wand-magic-sparkles">
    Пошаговая настройка через CLI без использования Nix.
  </Card>
  <Card title="Docker" href="/ru/install/docker" icon="docker">
    Контейнерная установка как альтернатива Nix.
  </Card>
  <Card title="Обновление" href="/ru/install/updating" icon="arrow-up-right-from-square">
    Обновление установок под управлением Home Manager вместе с пакетом.
  </Card>
</CardGroup>
