---
read_when:
    - Szukasz obsługiwanych systemów operacyjnych lub ścieżek instalacji
    - Decydujesz, gdzie uruchomić Gateway
summary: Przegląd obsługi platform (Gateway + aplikacje towarzyszące)
title: Platformy
x-i18n:
    generated_at: "2026-04-05T13:59:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5be4743fd39eca426d65db940f04f3a8fc3ff2c5e10b0e82bc55fc35a7d1399
    source_path: platforms/index.md
    workflow: 15
---

# Platformy

Rdzeń OpenClaw jest napisany w TypeScript. **Node jest zalecanym środowiskiem uruchomieniowym**.
Bun nie jest zalecany dla Gateway (błędy WhatsApp/Telegram).

Aplikacje towarzyszące istnieją dla macOS (aplikacja na pasku menu) oraz mobilnych węzłów (iOS/Android). Aplikacje towarzyszące dla Windows i
Linux są planowane, ale sam Gateway jest już dziś w pełni wspierany.
Natywne aplikacje towarzyszące dla Windows są również planowane; dla Gateway zalecane jest WSL2.

## Wybierz swój system operacyjny

- macOS: [macOS](/platforms/macos)
- iOS: [iOS](/platforms/ios)
- Android: [Android](/platforms/android)
- Windows: [Windows](/platforms/windows)
- Linux: [Linux](/platforms/linux)

## VPS i hosting

- Centrum VPS: [Hosting VPS](/vps)
- Fly.io: [Fly.io](/install/fly)
- Hetzner (Docker): [Hetzner](/install/hetzner)
- GCP (Compute Engine): [GCP](/install/gcp)
- Azure (Linux VM): [Azure](/install/azure)
- exe.dev (VM + proxy HTTPS): [exe.dev](/install/exe-dev)

## Typowe linki

- Przewodnik instalacji: [Pierwsze kroki](/start/getting-started)
- Runbook Gateway: [Gateway](/gateway)
- Konfiguracja Gateway: [Konfiguracja](/gateway/configuration)
- Stan usługi: `openclaw gateway status`

## Instalacja usługi Gateway (CLI)

Użyj jednej z tych opcji (wszystkie są wspierane):

- Kreator (zalecane): `openclaw onboard --install-daemon`
- Bezpośrednio: `openclaw gateway install`
- Przepływ konfiguracji: `openclaw configure` → wybierz **Usługa Gateway**
- Naprawa/migracja: `openclaw doctor` (oferuje instalację lub naprawę usługi)

Cel usługi zależy od systemu operacyjnego:

- macOS: LaunchAgent (`ai.openclaw.gateway` lub `ai.openclaw.<profile>`; starsze `com.openclaw.*`)
- Linux/WSL2: usługa użytkownika systemd (`openclaw-gateway[-<profile>].service`)
- Natywny Windows: Scheduled Task (`OpenClaw Gateway` lub `OpenClaw Gateway (<profile>)`), z awaryjnym fallbackiem do elementu logowania per użytkownik w folderze Startup, jeśli utworzenie zadania zostanie odrzucone
