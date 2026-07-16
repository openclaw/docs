---
read_when:
    - Informacje o obsłudze systemów operacyjnych i ścieżkach instalacji
    - Wybór miejsca uruchomienia Gateway
summary: Przegląd obsługiwanych platform (Gateway + aplikacje towarzyszące)
title: Platformy
x-i18n:
    generated_at: "2026-07-16T18:36:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 40494f8567c0159d9b6024c174cf0f316a45b46c633a578efaf2388f679a88f2
    source_path: platforms/index.md
    workflow: 16
---

Rdzeń OpenClaw jest napisany w TypeScript. **Node jest wymaganym środowiskiem uruchomieniowym**, ponieważ
kanoniczny magazyn stanu korzysta z `node:sqlite`. Bun pozostaje dostępny do
instalowania zależności i uruchamiania skryptów pakietów; zobacz [Bun](/pl/install/bun).

Aplikacje towarzyszące są dostępne dla Windows Hub, systemu macOS (aplikacja na pasku menu) oraz mobilnych węzłów
(iOS/Android). Aplikacje towarzyszące dla systemu Linux są planowane, ale Gateway jest już
w pełni obsługiwany. W systemie Windows należy wybrać Windows Hub jako aplikację komputerową, natywną
instalację w PowerShell do pracy głównie w terminalu albo WSL2, aby uzyskać środowisko uruchomieniowe Gateway
najbardziej zgodne z systemem Linux.

## Wybór systemu operacyjnego

- macOS: [macOS](/pl/platforms/macos)
- iOS: [iOS](/pl/platforms/ios)
- Android: [Android](/pl/platforms/android)
- Windows: [Windows](/pl/platforms/windows)
- Linux: [Linux](/pl/platforms/linux)

## VPS i hosting

- Węzeł centralny VPS: [Hosting VPS](/pl/vps)
- Fly.io: [Fly.io](/pl/install/fly)
- Hetzner (Docker): [Hetzner](/pl/install/hetzner)
- GCP (Compute Engine): [GCP](/pl/install/gcp)
- Azure (maszyna wirtualna z systemem Linux): [Azure](/pl/install/azure)
- exe.dev (maszyna wirtualna + serwer proxy HTTPS): [exe.dev](/pl/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/pl/platforms/easyrunner)

## Typowe odnośniki

- Przewodnik instalacji: [Pierwsze kroki](/pl/start/getting-started)
- Windows Hub: [Windows](/pl/platforms/windows)
- Podręcznik operacyjny Gateway: [Gateway](/pl/gateway)
- Konfiguracja Gateway: [Konfiguracja](/pl/gateway/configuration)
- Stan usługi: `openclaw gateway status`

## Instalacja usługi Gateway (CLI)

Należy użyć jednej z tych metod (wszystkie są obsługiwane):

- Kreator (zalecany): `openclaw onboard --install-daemon`
- Bezpośrednio: `openclaw gateway install`
- Proces konfiguracji: `openclaw configure` → wybierz **usługę Gateway**
- Naprawa/migracja: `openclaw doctor` (oferuje instalację lub naprawę usługi)

Docelowy typ usługi zależy od systemu operacyjnego:

- macOS: LaunchAgent (`ai.openclaw.gateway` lub `ai.openclaw.<profile>` w przypadku profilu nazwanego)
- Linux/WSL2: usługa użytkownika systemd (`openclaw-gateway[-<profile>].service`)
- Natywny system Windows: zaplanowane zadanie (`OpenClaw Gateway` lub `OpenClaw Gateway (<profile>)`), z awaryjnym elementem logowania w folderze Autostart danego użytkownika, jeśli odmówiono utworzenia zadania

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Windows Hub](/pl/platforms/windows)
- [Aplikacja macOS](/pl/platforms/macos)
- [Aplikacja iOS](/pl/platforms/ios)
