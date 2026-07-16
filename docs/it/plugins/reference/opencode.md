---
read_when:
    - Si sta installando, configurando o verificando il plugin opencode
summary: Aggiunge a OpenClaw il supporto per il provider di modelli OpenCode.
title: Plugin OpenCode
x-i18n:
    generated_at: "2026-07-16T14:46:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aecf396cfc645e4a036b8130ed7f33db9081dffda120c6d06ebe863dd3be3730
    source_path: plugins/reference/opencode.md
    workflow: 16
---

# Plugin OpenCode

Aggiunge a OpenClaw il supporto per il provider di modelli OpenCode.

## Distribuzione

- Pacchetto: `@openclaw/opencode-provider`
- Percorso di installazione: incluso in OpenClaw

## Superficie

provider: `opencode`; contratti: `mediaUnderstandingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## Sessioni native

OpenClaw rileva automaticamente la CLI `opencode` sul Gateway e sui nodi associati. Le sessioni
archiviate vengono quindi visualizzate nel gruppo **OpenCode** della barra laterale delle sessioni, con la
consultazione in sola lettura delle trascrizioni tramite i comandi ufficiali `opencode --pure db ... --format json`
e `opencode --pure export`. L'ambiente con restrizioni e la modalità `--pure`
impediscono che la consultazione del catalogo carichi Plugin del progetto o erediti credenziali
del Gateway non correlate.

Disattivare **OpenCode Session Catalog** in **Config > Plugins > OpenCode** per
disabilitare il rilevamento. È abilitato per impostazione predefinita.

<!-- openclaw-plugin-reference:manual-end -->

## Documentazione correlata

- [OpenCode](/it/providers/opencode)
