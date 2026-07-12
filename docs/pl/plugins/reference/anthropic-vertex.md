---
read_when:
    - Instalujesz, konfigurujesz lub audytujesz plugin anthropic-vertex
summary: Plugin dostawcy Anthropic Vertex dla OpenClaw, przeznaczony do modeli Claude w Google Vertex AI.
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-07-12T15:27:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe5500ca56df49c0ef6ccbf39ced71e3fd0b18776ad23716de8575bc6ba64cb8
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin dostawcy Anthropic Vertex dla OpenClaw, przeznaczony do modeli Claude w Google Vertex AI.

## Dystrybucja

- Pakiet: `@openclaw/anthropic-vertex-provider`
- Sposób instalacji: npm; ClawHub

## Interfejs

dostawcy: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Użyj `anthropic-vertex/claude-fable-5`, jeśli model jest dostępny w Twoim regionie Google Cloud.
Fable 5 zawsze używa adaptacyjnego rozumowania i domyślnie stosuje poziom wysiłku `high`. `/think off` i
`/think minimal` używają poziomu wysiłku `low`, ponieważ model nie obsługuje wyłączania rozumowania.

## Claude Sonnet 5

Użyj `anthropic-vertex/claude-sonnet-5` z punktem końcowym Vertex `global`, `us` lub `eu`.
Sonnet 5 domyślnie używa adaptacyjnego rozumowania z poziomem wysiłku `high` i obsługuje
`/think off` oraz natywne poziomy `/think xhigh|max`. OpenClaw automatycznie udostępnia
okno kontekstu obejmujące 1 000 000 tokenów oraz limit wyjściowy wynoszący 128 000 tokenów.

Cennik katalogowy jest zgodny z promocyjną globalną stawką Vertex wynoszącą `$2/$10` za
milion tokenów wejściowych/wyjściowych do 31 sierpnia 2026 r., a od
1 września wynosi `$3/$15`. Wieloregionalne punkty końcowe `us` i `eu` stosują udokumentowaną przez Vertex
dopłatę w wysokości 10%.

<!-- openclaw-plugin-reference:manual-end -->
