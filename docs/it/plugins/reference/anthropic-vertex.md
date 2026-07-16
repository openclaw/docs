---
read_when:
    - Si sta installando, configurando o verificando il plugin anthropic-vertex
summary: Plugin provider Anthropic Vertex di OpenClaw per i modelli Claude su Google Vertex AI.
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-07-16T14:43:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bd73b80b4e49a85cd6b1d8e47df6bf8d2d791c36a677124112f299027bfd9af5
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin provider Anthropic Vertex di OpenClaw per i modelli Claude su Google Vertex AI.

## Distribuzione

- Pacchetto: `@openclaw/anthropic-vertex-provider`
- Modalità di installazione: npm; ClawHub

## Superficie

provider: `anthropic-vertex`

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Usare `anthropic-vertex/claude-fable-5` dove il modello è disponibile nella propria regione Google Cloud.
Fable 5 usa sempre il ragionamento adattivo e per impostazione predefinita applica un livello di impegno `high`. `/think off` e
`/think minimal` applicano un livello di impegno `low` perché il modello non supporta la disattivazione del ragionamento.

## Claude Sonnet 5

Usare `anthropic-vertex/claude-sonnet-5` con l'endpoint `global`, `us` o `eu`
di Vertex. Sonnet 5 usa per impostazione predefinita il ragionamento adattivo con un livello di impegno `high` e supporta
`/think off` o i livelli nativi `/think xhigh|max`. OpenClaw pubblica automaticamente la sua
finestra di contesto da 1.000.000 di token e il limite di output di 128.000 token.

I prezzi del catalogo seguono la tariffa globale introduttiva di Vertex pari a `$2/$10` per
milione di token di input/output fino al 31 agosto 2026, quindi `$3/$15` dal
1° settembre. Gli endpoint multiregione `us` e `eu` applicano il sovrapprezzo
documentato da Vertex del 10%.

<!-- openclaw-plugin-reference:manual-end -->
