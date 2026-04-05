---
read_when:
    - Vuoi usare i modelli Grok in OpenClaw
    - Stai configurando l'auth xAI o gli ID modello
summary: Usa i modelli Grok di xAI in OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-05T14:02:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: d11f27b48c69eed6324595977bca3506c7709424eef64cc73899f8d049148b82
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw include un plugin provider `xai` bundled per i modelli Grok.

## Configurazione

1. Crea una chiave API nella console xAI.
2. Imposta `XAI_API_KEY`, oppure esegui:

```bash
openclaw onboard --auth-choice xai-api-key
```

3. Scegli un modello come:

```json5
{
  agents: { defaults: { model: { primary: "xai/grok-4" } } },
}
```

OpenClaw ora usa l'API xAI Responses come trasporto xAI bundled. La stessa
`XAI_API_KEY` può anche alimentare `web_search` basato su Grok, `x_search` di prima classe
e `code_execution` remoto.
Se memorizzi una chiave xAI sotto `plugins.entries.xai.config.webSearch.apiKey`,
anche il provider di modelli xAI bundled ora la riusa come fallback.
La configurazione di `code_execution` si trova sotto `plugins.entries.xai.config.codeExecution`.

## Catalogo di modelli bundled attuale

OpenClaw ora include queste famiglie di modelli xAI pronte all'uso:

- `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`
- `grok-4`, `grok-4-0709`
- `grok-4-fast`, `grok-4-fast-non-reasoning`
- `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`
- `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`
- `grok-code-fast-1`

Il plugin risolve in forward anche gli ID più recenti `grok-4*` e `grok-code-fast*` quando
seguono la stessa forma API.

Note sui modelli fast:

- `grok-4-fast`, `grok-4-1-fast` e le varianti `grok-4.20-beta-*` sono gli
  attuali ref Grok con capacità immagine nel catalogo bundled.
- `/fast on` oppure `agents.defaults.models["xai/<model>"].params.fastMode: true`
  riscrivono le richieste xAI native come segue:
  - `grok-3` -> `grok-3-fast`
  - `grok-3-mini` -> `grok-3-mini-fast`
  - `grok-4` -> `grok-4-fast`
  - `grok-4-0709` -> `grok-4-fast`

Gli alias di compatibilità legacy continuano a normalizzarsi agli ID bundled canonici. Ad
esempio:

- `grok-4-fast-reasoning` -> `grok-4-fast`
- `grok-4-1-fast-reasoning` -> `grok-4-1-fast`
- `grok-4.20-reasoning` -> `grok-4.20-beta-latest-reasoning`
- `grok-4.20-non-reasoning` -> `grok-4.20-beta-latest-non-reasoning`

## Ricerca web

Anche il provider bundled di ricerca web `grok` usa `XAI_API_KEY`:

```bash
openclaw config set tools.web.search.provider grok
```

## Limiti noti

- Oggi l'auth supporta solo la chiave API. In OpenClaw non esiste ancora un flusso xAI OAuth/device-code.
- `grok-4.20-multi-agent-experimental-beta-0304` non è supportato nel normale percorso provider xAI perché richiede una superficie API upstream diversa da quella del trasporto xAI standard di OpenClaw.

## Note

- OpenClaw applica automaticamente correzioni di compatibilità specifiche xAI per schema degli strumenti e tool-call nel percorso runner condiviso.
- Le richieste xAI native usano per impostazione predefinita `tool_stream: true`. Imposta
  `agents.defaults.models["xai/<model>"].params.tool_stream` su `false` per
  disabilitarlo.
- Il wrapper xAI bundled rimuove i flag strict tool-schema non supportati e
  le chiavi del payload reasoning prima di inviare le richieste xAI native.
- `web_search`, `x_search` e `code_execution` sono esposti come strumenti OpenClaw. OpenClaw abilita lo specifico built-in xAI necessario in ogni richiesta dello strumento invece di allegare tutti gli strumenti nativi a ogni turno di chat.
- `x_search` e `code_execution` appartengono al plugin xAI bundled invece di essere codificati rigidamente nel runtime del modello core.
- `code_execution` è esecuzione remota xAI in sandbox, non [`exec`](/tools/exec) locale.
- Per una panoramica più ampia dei provider, vedi [Provider di modelli](/providers/index).
