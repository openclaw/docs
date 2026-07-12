---
read_when:
    - Stai installando, configurando o verificando il plugin anthropic-vertex
summary: Plugin del provider Anthropic Vertex di OpenClaw per i modelli Claude su Google Vertex AI.
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-07-12T07:21:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe5500ca56df49c0ef6ccbf39ced71e3fd0b18776ad23716de8575bc6ba64cb8
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin provider Anthropic Vertex di OpenClaw per i modelli Claude su Google Vertex AI.

## Distribuzione

- Pacchetto: `@openclaw/anthropic-vertex-provider`
- Modalità di installazione: npm; ClawHub

## Superficie

provider: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Usa `anthropic-vertex/claude-fable-5` dove il modello è disponibile nella tua regione Google Cloud.
Fable 5 usa sempre il ragionamento adattivo e per impostazione predefinita impiega un livello di intensità `high`. `/think off` e
`/think minimal` usano un livello di intensità `low`, perché il modello non supporta la disattivazione del ragionamento.

## Claude Sonnet 5

Usa `anthropic-vertex/claude-sonnet-5` con l'endpoint `global`, `us` o `eu`
di Vertex. Sonnet 5 usa per impostazione predefinita il ragionamento adattivo con un livello di intensità `high` e supporta
`/think off` o i livelli nativi `/think xhigh|max`. OpenClaw pubblica automaticamente
la finestra di contesto da 1.000.000 di token e il limite di output da 128.000 token.

I prezzi del catalogo seguono la tariffa globale introduttiva di Vertex pari a `$2/$10` per
milione di token di input/output fino al 31 agosto 2026, quindi `$3/$15` dal
1º settembre. Gli endpoint multiregione `us` ed `eu` applicano il sovrapprezzo
del 10% documentato da Vertex.

<!-- openclaw-plugin-reference:manual-end -->
