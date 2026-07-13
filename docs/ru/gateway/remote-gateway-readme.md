---
read_when: Connecting the macOS app to a remote gateway over SSH
summary: Настройка SSH-туннеля для подключения OpenClaw.app к удалённому Gateway
title: Настройка удалённого Gateway
x-i18n:
    generated_at: "2026-07-13T18:13:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 842578eb74e99d115b04abff5e9673a6454fa6d2cf7905d056999469e1c6b66d
    source_path: gateway/remote-gateway-readme.md
    workflow: 16
---

<Note>
Теперь это содержимое находится в разделе [Удалённый доступ](/ru/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent). Актуальное руководство приведено на той странице; эта страница сохранена как цель перенаправления.
</Note>

# Запуск OpenClaw.app с удалённым Gateway

OpenClaw.app подключается к удалённому Gateway через SSH-туннель: SSH `LocalForward` сопоставляет локальный порт с портом WebSocket Gateway на удалённом узле.

```mermaid
flowchart TB
    subgraph Client["Клиентский компьютер"]
        direction TB
        A["OpenClaw.app"]
        B["ws://127.0.0.1:18789\n(локальный порт)"]
        T["SSH-туннель"]

        A --> B
        B --> T
    end
    subgraph Remote["Удалённый компьютер"]
        direction TB
        C["WebSocket Gateway"]
        D["ws://127.0.0.1:18789"]

        C --> D
    end
    T --> C
```

## Настройка

1. Добавьте запись в конфигурацию SSH с `LocalForward 18789 127.0.0.1:18789` (полный блок конфигурации см. в разделе [Удалённый доступ](/ru/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent)).
2. Скопируйте свой SSH-ключ на удалённый узел с помощью `ssh-copy-id`.
3. Задайте `gateway.remote.token` (или `gateway.remote.password`) с помощью `openclaw config set gateway.remote.token "<your-token>"`.
4. Запустите туннель: `ssh -N remote-gateway &`.
5. Закройте и снова откройте OpenClaw.app.

Чтобы туннель сохранялся после перезагрузок и автоматически переподключался, используйте настройку LaunchAgent со страницы [Удалённый доступ](/ru/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent) вместо ручного запуска `ssh -N`.

## Принцип работы

| Компонент                            | Назначение                                                    |
| ------------------------------------ | ------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | Перенаправляет локальный порт 18789 на удалённый порт 18789   |
| `ssh -N`                             | SSH без выполнения удалённых команд (только перенаправление портов) |
| `KeepAlive`                          | Автоматически перезапускает туннель при сбое (LaunchAgent)    |
| `RunAtLoad`                          | Запускает туннель при загрузке LaunchAgent (LaunchAgent)      |

OpenClaw.app подключается к `ws://127.0.0.1:18789` на клиенте. Туннель перенаправляет это соединение на порт 18789 удалённого узла, на котором работает Gateway.

## См. также

- [Удалённый доступ](/ru/gateway/remote)
- [Tailscale](/ru/gateway/tailscale)
