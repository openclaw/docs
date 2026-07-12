---
read_when:
    - Szukasz obsługi systemów operacyjnych lub ścieżek instalacji
    - Wybór miejsca uruchomienia Gateway
summary: Przegląd obsługiwanych platform (Gateway + aplikacje towarzyszące)
title: Platformy
x-i18n:
    generated_at: "2026-07-12T15:16:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c91bf7fd41bf5433b9f1efb768a44dcf5fa55917cfc45f463688d00f23e725d
    source_path: platforms/index.md
    workflow: 16
---

Rdzeń OpenClaw jest napisany w TypeScript. **Node jest zalecanym środowiskiem uruchomieniowym**.
Bun nie jest zalecany dla Gateway — występują znane problemy z kanałami WhatsApp i
Telegram; szczegółowe informacje zawiera strona [Bun (eksperymentalny)](/pl/install/bun).

Dostępne są aplikacje towarzyszące dla Windows Hub, macOS (aplikacja na pasku menu) oraz węzłów mobilnych
(iOS/Android). Aplikacje towarzyszące dla systemu Linux są planowane, ale Gateway jest już
w pełni obsługiwany. W systemie Windows wybierz Windows Hub jako aplikację komputerową, natywną
instalację PowerShell, jeśli korzystasz głównie z terminala, albo WSL2, aby uzyskać środowisko uruchomieniowe Gateway
najbardziej zgodne z systemem Linux.

## Wybierz system operacyjny

- macOS: [macOS](/pl/platforms/macos)
- iOS: [iOS](/pl/platforms/ios)
- Android: [Android](/pl/platforms/android)
- Windows: [Windows](/pl/platforms/windows)
- Linux: [Linux](/pl/platforms/linux)

## VPS i hosting

- Węzeł VPS: [Hosting VPS](/pl/vps)
- Fly.io: [Fly.io](/pl/install/fly)
- Hetzner (Docker): [Hetzner](/pl/install/hetzner)
- GCP (Compute Engine): [GCP](/pl/install/gcp)
- Azure (maszyna wirtualna z systemem Linux): [Azure](/pl/install/azure)
- exe.dev (maszyna wirtualna + serwer proxy HTTPS): [exe.dev](/pl/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/pl/platforms/easyrunner)

## Popularne odnośniki

- Przewodnik instalacji: [Pierwsze kroki](/pl/start/getting-started)
- Windows Hub: [Windows](/pl/platforms/windows)
- Instrukcja obsługi Gateway: [Gateway](/pl/gateway)
- Konfiguracja Gateway: [Konfiguracja](/pl/gateway/configuration)
- Stan usługi: `openclaw gateway status`

## Instalacja usługi Gateway (CLI)

Użyj jednej z poniższych metod (wszystkie są obsługiwane):

- Kreator (zalecany): `openclaw onboard --install-daemon`
- Bezpośrednio: `openclaw gateway install`
- Proces konfiguracji: `openclaw configure` → wybierz **Usługa Gateway**
- Naprawa/migracja: `openclaw doctor` (oferuje zainstalowanie lub naprawienie usługi)

Docelowy typ usługi zależy od systemu operacyjnego:

- macOS: LaunchAgent (`ai.openclaw.gateway` lub `ai.openclaw.<profile>` dla nazwanego profilu)
- Linux/WSL2: usługa użytkownika systemd (`openclaw-gateway[-<profile>].service`)
- Natywny Windows: zaplanowane zadanie (`OpenClaw Gateway` lub `OpenClaw Gateway (<profile>)`), z awaryjnym elementem logowania w folderze Autostart użytkownika, jeśli utworzenie zadania zostanie odrzucone

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Windows Hub](/pl/platforms/windows)
- [Aplikacja dla macOS](/pl/platforms/macos)
- [Aplikacja dla iOS](/pl/platforms/ios)
