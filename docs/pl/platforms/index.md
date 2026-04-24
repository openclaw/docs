---
read_when:
    - Szukasz obsługi systemów operacyjnych albo ścieżek instalacji.
    - Decydowanie, gdzie uruchomić Gateway.
summary: Przegląd obsługi platform (Gateway + aplikacje towarzyszące)
title: Platformy
x-i18n:
    generated_at: "2026-04-24T09:20:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ebed9f219f3072ef760006eef47ca78f87169c40a6098c3585dfaf6169fc594
    source_path: platforms/index.md
    workflow: 15
---

Rdzeń OpenClaw jest napisany w TypeScript. **Node to zalecany runtime**.
Bun nie jest zalecany dla Gateway — znane problemy z kanałami WhatsApp i
Telegram; szczegóły znajdziesz w [Bun (eksperymentalnie)](/pl/install/bun).

Istnieją aplikacje towarzyszące dla macOS (aplikacja w pasku menu) i mobilne node (iOS/Android). Aplikacje towarzyszące dla Windows i
Linux są planowane, ale sam Gateway jest już dziś w pełni obsługiwany.
Natywne aplikacje towarzyszące dla Windows są również planowane; dla Gateway zalecane jest WSL2.

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
- Azure (Linux VM): [Azure](/pl/install/azure)
- exe.dev (VM + proxy HTTPS): [exe.dev](/pl/install/exe-dev)

## Typowe linki

- Przewodnik instalacji: [Pierwsze kroki](/pl/start/getting-started)
- Runbook Gateway: [Gateway](/pl/gateway)
- Konfiguracja Gateway: [Konfiguracja](/pl/gateway/configuration)
- Status usługi: `openclaw gateway status`

## Instalacja usługi Gateway (CLI)

Użyj jednej z poniższych metod (wszystkie są obsługiwane):

- Kreator (zalecane): `openclaw onboard --install-daemon`
- Bezpośrednio: `openclaw gateway install`
- Przepływ konfiguracji: `openclaw configure` → wybierz **Gateway service**
- Naprawa/migracja: `openclaw doctor` (proponuje instalację albo naprawę usługi)

Cel usługi zależy od systemu operacyjnego:

- macOS: LaunchAgent (`ai.openclaw.gateway` albo `ai.openclaw.<profile>`; starsze `com.openclaw.*`)
- Linux/WSL2: usługa użytkownika `systemd` (`openclaw-gateway[-<profile>].service`)
- Natywny Windows: Scheduled Task (`OpenClaw Gateway` albo `OpenClaw Gateway (<profile>)`) z fallbackiem do elementu logowania w folderze Startup per użytkownik, jeśli utworzenie zadania zostanie odrzucone

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Aplikacja macOS](/pl/platforms/macos)
- [Aplikacja iOS](/pl/platforms/ios)
