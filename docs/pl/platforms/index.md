---
read_when:
    - Szukasz obsługi systemów operacyjnych lub ścieżek instalacji
    - Decydowanie, gdzie uruchomić Gateway
summary: Przegląd obsługi platform (Gateway + aplikacje towarzyszące)
title: Platformy
x-i18n:
    generated_at: "2026-06-27T17:46:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d6edfaf9c4b1f1bc824d4bddf8263244902676dd5df98da556a8a5f35afe566
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw core jest napisany w TypeScript. **Node jest zalecanym środowiskiem uruchomieniowym**.
Bun nie jest zalecany dla Gateway — znane problemy z kanałami WhatsApp i
Telegram; szczegóły znajdziesz w [Bun (eksperymentalny)](/pl/install/bun).

Aplikacje towarzyszące istnieją dla Windows Hub, macOS (aplikacja paska menu) oraz węzłów mobilnych
(iOS/Android). Aplikacje towarzyszące dla Linuksa są planowane, ale Gateway jest dziś w pełni
obsługiwany. W systemie Windows wybierz Windows Hub jako aplikację desktopową, natywną
instalację PowerShell do użycia przede wszystkim w terminalu albo WSL2, aby uzyskać najbardziej
zgodne z Linuksem środowisko uruchomieniowe Gateway.

## Wybierz swój system operacyjny

- macOS: [macOS](/pl/platforms/macos)
- iOS: [iOS](/pl/platforms/ios)
- Android: [Android](/pl/platforms/android)
- Windows: [Windows](/pl/platforms/windows)
- Linux: [Linux](/pl/platforms/linux)

## VPS i hosting

- Hub VPS: [Hosting VPS](/pl/vps)
- Fly.io: [Fly.io](/pl/install/fly)
- Hetzner (Docker): [Hetzner](/pl/install/hetzner)
- GCP (Compute Engine): [GCP](/pl/install/gcp)
- Azure (maszyna wirtualna Linux): [Azure](/pl/install/azure)
- exe.dev (maszyna wirtualna + proxy HTTPS): [exe.dev](/pl/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/pl/platforms/easyrunner)

## Typowe linki

- Przewodnik instalacji: [Pierwsze kroki](/pl/start/getting-started)
- Windows Hub: [Windows](/pl/platforms/windows)
- Runbook Gateway: [Gateway](/pl/gateway)
- Konfiguracja Gateway: [Konfiguracja](/pl/gateway/configuration)
- Status usługi: `openclaw gateway status`

## Instalacja usługi Gateway (CLI)

Użyj jednego z tych sposobów (wszystkie są obsługiwane):

- Kreator (zalecane): `openclaw onboard --install-daemon`
- Bezpośrednio: `openclaw gateway install`
- Przepływ konfiguracji: `openclaw configure` → wybierz **usługę Gateway**
- Naprawa/migracja: `openclaw doctor` (proponuje zainstalowanie lub naprawienie usługi)

Docelowa usługa zależy od systemu operacyjnego:

- macOS: LaunchAgent (`ai.openclaw.gateway` lub `ai.openclaw.<profile>`; starsze `com.openclaw.*`)
- Linux/WSL2: usługa użytkownika systemd (`openclaw-gateway[-<profile>].service`)
- Natywny Windows: Zaplanowane zadanie (`OpenClaw Gateway` lub `OpenClaw Gateway (<profile>)`), z awaryjnym elementem logowania w folderze Autostart użytkownika, jeśli utworzenie zadania zostanie odrzucone

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Windows Hub](/pl/platforms/windows)
- [Aplikacja macOS](/pl/platforms/macos)
- [Aplikacja iOS](/pl/platforms/ios)
