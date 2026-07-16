---
read_when:
    - Instalowanie, konfigurowanie lub audytowanie pluginu opencode
summary: Dodaje obsługę dostawcy modeli OpenCode do OpenClaw.
title: Plugin OpenCode
x-i18n:
    generated_at: "2026-07-16T18:48:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aecf396cfc645e4a036b8130ed7f33db9081dffda120c6d06ebe863dd3be3730
    source_path: plugins/reference/opencode.md
    workflow: 16
---

# Plugin OpenCode

Dodaje do OpenClaw obsługę dostawcy modeli OpenCode.

## Dystrybucja

- Pakiet: `@openclaw/opencode-provider`
- Sposób instalacji: dołączony do OpenClaw

## Powierzchnia

dostawcy: `opencode`; kontrakty: `mediaUnderstandingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## Sesje natywne

OpenClaw automatycznie wykrywa CLI `opencode` na Gateway i sparowanych węzłach. Zapisane
sesje pojawiają się następnie w grupie **OpenCode** na pasku bocznym sesji, umożliwiając
przeglądanie transkrypcji tylko do odczytu za pomocą oficjalnych poleceń
`opencode --pure db ... --format json` i `opencode --pure export`. Ograniczone środowisko i tryb
`--pure` zapobiegają ładowaniu pluginów projektu lub dziedziczeniu
niepowiązanych danych uwierzytelniających Gateway podczas przeglądania katalogu.

Aby wyłączyć wykrywanie, wyłącz opcję **OpenCode Session Catalog** w sekcji
**Config > Plugins > OpenCode**. Jest ona domyślnie włączona.

<!-- openclaw-plugin-reference:manual-end -->

## Powiązana dokumentacja

- [OpenCode](/pl/providers/opencode)
