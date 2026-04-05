---
read_when:
    - Chcesz uzyskać pełną mapę dokumentacji
summary: Huby prowadzące do całej dokumentacji OpenClaw
title: Huby dokumentacji
x-i18n:
    generated_at: "2026-04-05T14:06:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4998710e3dc8018a50abc41285caac83df4b3bf8aec2e4a7525a0563649eb06c
    source_path: start/hubs.md
    workflow: 15
---

# Huby dokumentacji

<Note>
Jeśli dopiero zaczynasz korzystać z OpenClaw, zacznij od [Pierwsze kroki](/start/getting-started).
</Note>

Użyj tych hubów, aby odkryć każdą stronę, w tym szczegółowe omówienia i dokumentację referencyjną, które nie pojawiają się w lewym panelu nawigacji.

## Zacznij tutaj

- [Indeks](/pl)
- [Pierwsze kroki](/start/getting-started)
- [Onboarding](/start/onboarding)
- [Onboarding (CLI)](/start/wizard)
- [Konfiguracja](/start/setup)
- [Dashboard (lokalny Gateway)](http://127.0.0.1:18789/)
- [Pomoc](/pl/help)
- [Katalog dokumentacji](/start/docs-directory)
- [Konfiguracja](/pl/gateway/configuration)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
- [Asystent OpenClaw](/start/openclaw)
- [Prezentacja](/start/showcase)
- [Lore](/start/lore)

## Instalacja i aktualizacje

- [Docker](/pl/install/docker)
- [Nix](/pl/install/nix)
- [Aktualizacja / wycofanie](/pl/install/updating)
- [Przepływ pracy Bun (eksperymentalny)](/pl/install/bun)

## Podstawowe pojęcia

- [Architektura](/pl/concepts/architecture)
- [Funkcje](/pl/concepts/features)
- [Hub sieciowy](/pl/network)
- [Środowisko uruchomieniowe agenta](/pl/concepts/agent)
- [Obszar roboczy agenta](/pl/concepts/agent-workspace)
- [Pamięć](/pl/concepts/memory)
- [Pętla agenta](/pl/concepts/agent-loop)
- [Strumieniowanie i dzielenie na fragmenty](/pl/concepts/streaming)
- [Routing wielu agentów](/pl/concepts/multi-agent)
- [Kompaktowanie](/pl/concepts/compaction)
- [Sesje](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Narzędzia sesji](/pl/concepts/session-tool)
- [Kolejka](/pl/concepts/queue)
- [Polecenia slash](/tools/slash-commands)
- [Adaptery RPC](/reference/rpc)
- [Schematy TypeBox](/pl/concepts/typebox)
- [Obsługa stref czasowych](/pl/concepts/timezone)
- [Obecność](/pl/concepts/presence)
- [Wykrywanie i transporty](/pl/gateway/discovery)
- [Bonjour](/pl/gateway/bonjour)
- [Routing kanałów](/pl/channels/channel-routing)
- [Grupy](/pl/channels/groups)
- [Wiadomości grupowe](/pl/channels/group-messages)
- [Failover modeli](/pl/concepts/model-failover)
- [OAuth](/pl/concepts/oauth)

## Dostawcy i wejścia

- [Hub kanałów czatu](/pl/channels)
- [Hub dostawców modeli](/providers/models)
- [WhatsApp](/pl/channels/whatsapp)
- [Telegram](/pl/channels/telegram)
- [Slack](/pl/channels/slack)
- [Discord](/pl/channels/discord)
- [Mattermost](/pl/channels/mattermost)
- [Signal](/pl/channels/signal)
- [BlueBubbles (iMessage)](/pl/channels/bluebubbles)
- [QQ Bot](/pl/channels/qqbot)
- [iMessage (starszy)](/pl/channels/imessage)
- [Parsowanie lokalizacji](/pl/channels/location)
- [WebChat](/web/webchat)
- [Webhooki](/pl/automation/cron-jobs#webhooks)
- [Gmail Pub/Sub](/pl/automation/cron-jobs#gmail-pubsub-integration)

## Gateway i operacje

- [Runbook Gateway](/pl/gateway)
- [Model sieci](/pl/gateway/network-model)
- [Parowanie Gateway](/pl/gateway/pairing)
- [Blokada Gateway](/pl/gateway/gateway-lock)
- [Proces w tle](/pl/gateway/background-process)
- [Stan zdrowia](/pl/gateway/health)
- [Heartbeat](/pl/gateway/heartbeat)
- [Doctor](/pl/gateway/doctor)
- [Logowanie](/pl/gateway/logging)
- [Sandboxing](/pl/gateway/sandboxing)
- [Dashboard](/web/dashboard)
- [Interfejs Control UI](/web/control-ui)
- [Dostęp zdalny](/pl/gateway/remote)
- [README zdalnego gateway](/pl/gateway/remote-gateway-readme)
- [Tailscale](/pl/gateway/tailscale)
- [Bezpieczeństwo](/pl/gateway/security)
- [Rozwiązywanie problemów](/pl/gateway/troubleshooting)

## Narzędzia i automatyzacja

- [Powierzchnia narzędzi](/tools)
- [OpenProse](/prose)
- [Dokumentacja CLI](/cli)
- [Narzędzie exec](/tools/exec)
- [Narzędzie PDF](/tools/pdf)
- [Tryb podwyższonych uprawnień](/tools/elevated)
- [Zadania cron](/pl/automation/cron-jobs)
- [Automatyzacja i zadania](/pl/automation)
- [Thinking i verbose](/tools/thinking)
- [Modele](/pl/concepts/models)
- [Podagenci](/tools/subagents)
- [CLI wysyłania do agenta](/tools/agent-send)
- [Terminalowy interfejs użytkownika](/web/tui)
- [Sterowanie przeglądarką](/tools/browser)
- [Przeglądarka (rozwiązywanie problemów w Linux)](/tools/browser-linux-troubleshooting)
- [Polls](/cli/message)

## Węzły, media, głos

- [Przegląd węzłów](/pl/nodes)
- [Kamera](/pl/nodes/camera)
- [Obrazy](/pl/nodes/images)
- [Audio](/pl/nodes/audio)
- [Polecenie lokalizacji](/pl/nodes/location-command)
- [Voice wake](/pl/nodes/voicewake)
- [Tryb rozmowy](/pl/nodes/talk)

## Platformy

- [Przegląd platform](/pl/platforms)
- [macOS](/platforms/macos)
- [iOS](/pl/platforms/ios)
- [Android](/pl/platforms/android)
- [Windows (WSL2)](/platforms/windows)
- [Linux](/pl/platforms/linux)
- [Powierzchnie webowe](/web)

## Aplikacja towarzysząca macOS (zaawansowane)

- [Konfiguracja deweloperska macOS](/pl/platforms/mac/dev-setup)
- [Pasek menu macOS](/pl/platforms/mac/menu-bar)
- [Voice wake w macOS](/platforms/mac/voicewake)
- [Nakładka głosowa macOS](/pl/platforms/mac/voice-overlay)
- [WebChat w macOS](/pl/platforms/mac/webchat)
- [Canvas w macOS](/pl/platforms/mac/canvas)
- [Proces potomny macOS](/pl/platforms/mac/child-process)
- [Stan zdrowia macOS](/pl/platforms/mac/health)
- [Ikona macOS](/pl/platforms/mac/icon)
- [Logowanie macOS](/pl/platforms/mac/logging)
- [Uprawnienia macOS](/pl/platforms/mac/permissions)
- [Zdalny dostęp macOS](/pl/platforms/mac/remote)
- [Podpisywanie macOS](/pl/platforms/mac/signing)
- [Gateway macOS (launchd)](/pl/platforms/mac/bundled-gateway)
- [XPC w macOS](/pl/platforms/mac/xpc)
- [Skills w macOS](/pl/platforms/mac/skills)
- [Peekaboo w macOS](/pl/platforms/mac/peekaboo)

## Rozszerzenia i wtyczki

- [Przegląd wtyczek](/tools/plugin)
- [Tworzenie wtyczek](/plugins/building-plugins)
- [Manifest wtyczki](/plugins/manifest)
- [Narzędzia agenta](/plugins/building-plugins#registering-agent-tools)
- [Pakiety wtyczek](/plugins/bundles)
- [Wtyczki społeczności](/plugins/community)
- [Książka kucharska możliwości](/tools/capability-cookbook)
- [Wtyczka połączeń głosowych](/plugins/voice-call)
- [Wtyczka użytkownika Zalo](/plugins/zalouser)

## Obszar roboczy i szablony

- [Skills](/tools/skills)
- [ClawHub](/tools/clawhub)
- [Konfiguracja Skills](/tools/skills-config)
- [Domyślny AGENTS](/reference/AGENTS.default)
- [Szablony: AGENTS](/reference/templates/AGENTS)
- [Szablony: BOOTSTRAP](/reference/templates/BOOTSTRAP)
- [Szablony: HEARTBEAT](/reference/templates/HEARTBEAT)
- [Szablony: IDENTITY](/reference/templates/IDENTITY)
- [Szablony: SOUL](/reference/templates/SOUL)
- [Szablony: TOOLS](/reference/templates/TOOLS)
- [Szablony: USER](/reference/templates/USER)

## Projekt

- [Podziękowania](/reference/credits)

## Testowanie i wydania

- [Testowanie](/reference/test)
- [Zasady wydawania](/reference/RELEASING)
- [Modele urządzeń](/reference/device-models)
