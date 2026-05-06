---
read_when:
    - Szukanie informacji o obsługiwanych systemach operacyjnych lub ścieżkach instalacji
    - Wybór miejsca uruchomienia Gateway
summary: Przegląd obsługi platform (Gateway + aplikacje towarzyszące)
title: Platformy
x-i18n:
    generated_at: "2026-05-06T09:20:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1fbd1af8b03a12014d91b2f300fb8ec65b9c42c38ada2b9ca089181140a75c
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw core jest napisany w TypeScript. **Node to zalecane środowisko uruchomieniowe**.
Bun nie jest zalecany dla Gateway — znane problemy z kanałami WhatsApp i
Telegram; szczegóły znajdziesz w [Bun (eksperymentalny)](/pl/install/bun).

Aplikacje towarzyszące istnieją dla macOS (aplikacja paska menu) i węzłów mobilnych (iOS/Android). Aplikacje towarzyszące dla Windows i
Linux są planowane, ale Gateway jest dziś w pełni obsługiwany.
Planowane są też natywne aplikacje towarzyszące dla Windows; zalecane jest używanie Gateway przez WSL2.

## Wybierz system operacyjny

- macOS: [macOS](/pl/platforms/macos)
- iOS: [iOS](/pl/platforms/ios)
- Android: [Android](/pl/platforms/android)
- Windows: [Windows](/pl/platforms/windows)
- Linux: [Linux](/pl/platforms/linux)

## VPS i hosting

- Centrum VPS: [Hosting VPS](/pl/vps)
- Fly.io: [Fly.io](/pl/install/fly)
- Hetzner (Docker): [Hetzner](/pl/install/hetzner)
- GCP (Compute Engine): [GCP](/pl/install/gcp)
- Azure (Linux VM): [Azure](/pl/install/azure)
- exe.dev (VM + proxy HTTPS): [exe.dev](/pl/install/exe-dev)

## Często używane linki

- Przewodnik instalacji: [Pierwsze kroki](/pl/start/getting-started)
- Runbook Gateway: [Gateway](/pl/gateway)
- Konfiguracja Gateway: [Konfiguracja](/pl/gateway/configuration)
- Status usługi: `openclaw gateway status`

## Instalacja usługi Gateway (CLI)

Użyj jednej z tych opcji (wszystkie są obsługiwane):

- Kreator (zalecane): `openclaw onboard --install-daemon`
- Bezpośrednio: `openclaw gateway install`
- Przepływ konfiguracji: `openclaw configure` → wybierz **Usługa Gateway**
- Naprawa/migracja: `openclaw doctor` (proponuje instalację lub naprawę usługi)

Docelowa usługa zależy od systemu operacyjnego:

- macOS: LaunchAgent (`ai.openclaw.gateway` lub `ai.openclaw.<profile>`; starsze `com.openclaw.*`)
- Linux/WSL2: usługa użytkownika systemd (`openclaw-gateway[-<profile>].service`)
- Natywny Windows: Zaplanowane zadanie (`OpenClaw Gateway` lub `OpenClaw Gateway (<profile>)`), z awaryjnym elementem logowania w folderze Startup dla użytkownika, jeśli tworzenie zadania zostanie odmówione

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Aplikacja macOS](/pl/platforms/macos)
- [Aplikacja iOS](/pl/platforms/ios)
