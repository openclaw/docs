---
read_when:
    - Instalowanie, konfigurowanie lub audytowanie pluginu anthropic-vertex
summary: Plugin dostawcy Anthropic Vertex dla OpenClaw, umożliwiający korzystanie z modeli Claude w Google Vertex AI.
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-07-16T18:46:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bd73b80b4e49a85cd6b1d8e47df6bf8d2d791c36a677124112f299027bfd9af5
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin dostawcy Anthropic Vertex dla OpenClaw, przeznaczony do modeli Claude w Google Vertex AI.

## Dystrybucja

- Pakiet: `@openclaw/anthropic-vertex-provider`
- Sposób instalacji: npm; ClawHub

## Powierzchnia

dostawcy: `anthropic-vertex`

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Należy użyć `anthropic-vertex/claude-fable-5`, jeśli model jest dostępny w danym regionie Google Cloud.
Fable 5 zawsze korzysta z adaptacyjnego myślenia i domyślnie używa poziomu wysiłku `high`. `/think off` i
`/think minimal` używają poziomu wysiłku `low`, ponieważ model nie obsługuje wyłączania myślenia.

## Claude Sonnet 5

Należy użyć `anthropic-vertex/claude-sonnet-5` z punktem końcowym Vertex `global`, `us` lub `eu`.
Sonnet 5 domyślnie korzysta z adaptacyjnego myślenia przy poziomie wysiłku `high` i obsługuje
`/think off` lub natywne poziomy `/think xhigh|max`. OpenClaw automatycznie udostępnia
okno kontekstu obejmujące 1,000,000 tokenów oraz limit wyjściowy wynoszący 128,000 tokenów.

Ceny katalogowe są zgodne z globalną stawką promocyjną Vertex wynoszącą `$2/$10` za
milion tokenów wejściowych/wyjściowych do 31 sierpnia 2026 r., a następnie `$3/$15` od
1 września. Wieloregionalne punkty końcowe `us` i `eu` korzystają z udokumentowanej
przez Vertex dopłaty w wysokości 10%.

<!-- openclaw-plugin-reference:manual-end -->
