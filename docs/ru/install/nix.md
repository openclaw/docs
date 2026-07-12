---
read_when:
    - Вам нужны воспроизводимые установки с возможностью отката
    - Вы уже используете Nix/NixOS/Home Manager
    - Вы хотите, чтобы все версии были зафиксированы, а управление осуществлялось декларативно
summary: Установите OpenClaw декларативно с помощью Nix
title: Nix
x-i18n:
    generated_at: "2026-07-12T11:30:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
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

- Gateway, приложение для macOS и инструменты (whisper, spotify, камеры) с зафиксированными версиями
- Служба launchd, которая продолжает работать после перезагрузок
- Система Plugin с декларативной конфигурацией
- Мгновенный откат: `home-manager switch --rollback`

## Быстрый старт

<Steps>
  <Step title="Установите Determinate Nix">
    Если Nix ещё не установлен, следуйте инструкциям по использованию [установщика Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Создайте локальный flake">
    Используйте шаблон, ориентированный на агента, из репозитория nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Скопируйте templates/agent-first/flake.nix из репозитория nix-openclaw
    ```
  </Step>
  <Step title="Настройте секреты">
    Настройте токен бота для обмена сообщениями и API-ключ поставщика модели. Подойдут обычные файлы в `~/.secrets/`.
  </Step>
  <Step title="Заполните заполнители шаблона и примените конфигурацию">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Проверьте">
    Убедитесь, что служба launchd запущена и бот отвечает на сообщения.
  </Step>
</Steps>

Полный список параметров модуля и примеры см. в [README nix-openclaw](https://github.com/openclaw/nix-openclaw).

## Поведение среды выполнения в режиме Nix

Если задана переменная `OPENCLAW_NIX_MODE=1` (при использовании nix-openclaw это происходит автоматически), OpenClaw переходит в детерминированный режим для установок под управлением Nix. Другие пакеты Nix также могут включать этот режим; nix-openclaw является официальной эталонной реализацией.

Его также можно включить вручную:

```bash
export OPENCLAW_NIX_MODE=1
```

В macOS приложение с графическим интерфейсом не наследует переменные окружения оболочки. Вместо этого включите режим Nix с помощью `defaults`:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Что меняется в режиме Nix

- Автоматическая установка и механизмы самоизменения отключаются.
- Файл `openclaw.json` считается неизменяемым. Значения по умолчанию, вычисляемые при запуске, существуют только во время выполнения, а механизмы записи конфигурации (первоначальная настройка, адаптация, изменяющий конфигурацию `openclaw update`, установка, обновление, удаление и включение Plugin, `doctor --fix`, `doctor --generate-gateway-token`, `openclaw config set`) отказываются изменять файл.
- Вместо этого изменяйте исходный код Nix. Для nix-openclaw используйте ориентированное на агента руководство [«Быстрый старт»](https://github.com/openclaw/nix-openclaw#quick-start) и задайте конфигурацию в `programs.openclaw.config` или `instances.<name>.config`.
- При отсутствии зависимостей выводятся сообщения по устранению проблемы, предназначенные специально для Nix.
- В пользовательском интерфейсе отображается баннер режима Nix «только для чтения».

### Пути конфигурации и состояния

OpenClaw считывает конфигурацию JSON5 из `OPENCLAW_CONFIG_PATH` и хранит изменяемые данные в `OPENCLAW_STATE_DIR`. При использовании Nix явно задайте для них расположения под управлением Nix, чтобы состояние среды выполнения и конфигурация не попадали в неизменяемое хранилище.

| Переменная             | Значение по умолчанию                   |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Обнаружение PATH для службы

Служба Gateway в launchd/systemd автоматически обнаруживает исполняемые файлы профиля Nix, поэтому Plugin и инструменты, запускающие установленные через `nix` исполняемые файлы в оболочке, работают без ручной настройки PATH:

- Если задана переменная `NIX_PROFILES`, каждая её запись добавляется в PATH службы с приоритетом справа налево (в соответствии с приоритетом оболочки Nix: крайняя справа запись имеет наивысший приоритет).
- Если переменная `NIX_PROFILES` не задана, в качестве резервного пути добавляется `~/.nix-profile/bin`.

Это относится к окружениям служб launchd в macOS и systemd в Linux.

## Связанные материалы

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Основной модуль Home Manager и полное руководство по настройке.
  </Card>
  <Card title="Мастер настройки" href="/ru/start/wizard" icon="wand-magic-sparkles">
    Пошаговая настройка через CLI без использования Nix.
  </Card>
  <Card title="Docker" href="/ru/install/docker" icon="docker">
    Контейнерная установка как альтернатива без использования Nix.
  </Card>
  <Card title="Обновление" href="/ru/install/updating" icon="arrow-up-right-from-square">
    Обновление установок под управлением Home Manager вместе с пакетом.
  </Card>
</CardGroup>
