---
read_when: Connecting the macOS app to a remote gateway over SSH
summary: Konfiguracja tunelu SSH dla OpenClaw.app łączącej się ze zdalnym Gatewayem
title: Konfiguracja zdalnego Gateway
x-i18n:
    generated_at: "2026-07-12T15:11:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 842578eb74e99d115b04abff5e9673a6454fa6d2cf7905d056999469e1c6b66d
    source_path: gateway/remote-gateway-readme.md
    workflow: 16
---

<Note>
Ta treść znajduje się teraz na stronie [Dostęp zdalny](/pl/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent). Aktualny przewodnik jest dostępny na tamtej stronie; ta strona pozostaje celem przekierowania.
</Note>

# Uruchamianie OpenClaw.app ze zdalnym Gateway

OpenClaw.app łączy się ze zdalnym Gateway przez tunel SSH: dyrektywa SSH `LocalForward` mapuje port lokalny na port WebSocket Gateway na zdalnym hoście.

```mermaid
flowchart TB
    subgraph Client["Komputer kliencki"]
        direction TB
        A["OpenClaw.app"]
        B["ws://127.0.0.1:18789\n(port lokalny)"]
        T["Tunel SSH"]

        A --> B
        B --> T
    end
    subgraph Remote["Komputer zdalny"]
        direction TB
        C["WebSocket Gateway"]
        D["ws://127.0.0.1:18789"]

        C --> D
    end
    T --> C
```

## Konfiguracja

1. Dodaj wpis do konfiguracji SSH z dyrektywą `LocalForward 18789 127.0.0.1:18789` (pełny blok konfiguracji znajdziesz na stronie [Dostęp zdalny](/pl/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent)).
2. Skopiuj swój klucz SSH na zdalny host za pomocą polecenia `ssh-copy-id`.
3. Ustaw `gateway.remote.token` (lub `gateway.remote.password`) za pomocą polecenia `openclaw config set gateway.remote.token "<your-token>"`.
4. Uruchom tunel: `ssh -N remote-gateway &`.
5. Zamknij i ponownie otwórz OpenClaw.app.

Aby tunel działał po ponownym uruchomieniu systemu i automatycznie wznawiał połączenie, zamiast ręcznego polecenia `ssh -N` użyj konfiguracji LaunchAgent opisanej na stronie [Dostęp zdalny](/pl/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent).

## Jak to działa

| Komponent                            | Działanie                                                               |
| ------------------------------------ | ----------------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | Przekierowuje lokalny port 18789 na zdalny port 18789                    |
| `ssh -N`                             | Uruchamia SSH bez wykonywania zdalnych poleceń (tylko przekierowanie portów) |
| `KeepAlive`                          | Automatycznie ponownie uruchamia tunel w razie awarii (LaunchAgent)      |
| `RunAtLoad`                          | Uruchamia tunel podczas ładowania LaunchAgent (LaunchAgent)              |

OpenClaw.app łączy się z adresem `ws://127.0.0.1:18789` na komputerze klienckim. Tunel przekierowuje to połączenie na port 18789 zdalnego hosta, na którym działa Gateway.

## Powiązane

- [Dostęp zdalny](/pl/gateway/remote)
- [Tailscale](/pl/gateway/tailscale)
