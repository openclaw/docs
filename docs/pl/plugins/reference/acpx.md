---
read_when:
    - Instalowanie, konfigurowanie lub audytowanie pluginu acpx
summary: Backend środowiska uruchomieniowego ACP dla OpenClaw z zarządzaniem sesjami i transportem należącym do pluginu.
title: Plugin ACPx
x-i18n:
    generated_at: "2026-07-16T18:55:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9816ca3ada81eb44883b641f3d761b76f894bd83c8aa978c516125c77842f664
    source_path: plugins/reference/acpx.md
    workflow: 16
---

# Plugin ACPx

Backend środowiska uruchomieniowego ACP OpenClaw z zarządzaniem sesjami i transportem należącym do pluginu.

## Dystrybucja

- Pakiet: `@openclaw/acpx`
- Sposób instalacji: npm; ClawHub

## Powierzchnia

Skills

<!-- openclaw-plugin-reference:manual-start -->

## Natywne sesje Pi

Dołączone środowisko uruchomieniowe automatycznie wykrywa magazyn sesji Pi w Gateway i sparowanych
węzłach. Zapisane sesje pojawiają się w grupie **Pi** na pasku bocznym sesji, z
możliwością przeglądania transkrypcji tylko do odczytu w udokumentowanym przez Pi formacie sesji JSONL.
Katalog uwzględnia projektowe i globalne katalogi sesji `settings.json`, a także
`PI_CODING_AGENT_DIR` i `PI_CODING_AGENT_SESSION_DIR`. Ścieżki względne są rozwiązywane
względem katalogu zawierającego ich plik `settings.json`.

Wyłącz **Pi Session Catalog** w **Config > Plugins > ACPX Runtime**, aby
wyłączyć wykrywanie. Domyślnie jest ono włączone.

<!-- openclaw-plugin-reference:manual-end -->

## Powiązana dokumentacja

- [acpx](/pl/tools/acp-agents-setup)
