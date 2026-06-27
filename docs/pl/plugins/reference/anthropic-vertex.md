---
read_when:
    - Instalujesz, konfigurujesz lub audytujesz Plugin anthropic-vertex
summary: Plugin dostawcy Anthropic Vertex dla OpenClaw do modeli Claude w Google Vertex AI.
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-06-27T17:58:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f772c9a5bf1edd6a270b7ba5e6d695290fe96648c9ac38d0bc90bb1504f50cd7
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin dostawcy OpenClaw Anthropic Vertex dla modeli Claude w Google Vertex AI.

## Dystrybucja

- Pakiet: `@openclaw/anthropic-vertex-provider`
- Ścieżka instalacji: npm; ClawHub

## Interfejs

providers: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Używaj `anthropic-vertex/claude-fable-5` tam, gdzie model jest dostępny w Twoim regionie Google Cloud.
Fable 5 zawsze używa myślenia adaptacyjnego i domyślnie ustawia `high` poziom wysiłku. `/think off` i
`/think minimal` używają `low` poziomu wysiłku, ponieważ model nie obsługuje wyłączania myślenia.

<!-- openclaw-plugin-reference:manual-end -->
