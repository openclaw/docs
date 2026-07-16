---
summary: 'Come OpenClaw struttura il runtime dell’agente integrato: organizzazione del codice, confini, manifest delle risorse e selezione del runtime.'
title: Architettura del runtime dell'agente
x-i18n:
    generated_at: "2026-07-16T13:48:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 071a0cb076230ce02f2c2c1c21971379cf617f24faa8a9733570aae30a062019
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw gestisce il runtime dell'agente integrato. Il codice del runtime si trova in `src/agents/`, il trasporto per modelli/provider si trova in `src/llm/` e i contratti destinati ai plugin sono esposti tramite i barrel `openclaw/plugin-sdk/*`.

## Struttura del runtime

| Percorso                            | Responsabilità                                                                                                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/agents/embedded-agent-runner/` | Ciclo di tentativi integrato (`run.ts`, `run/`), selezione del modello e normalizzazione del provider (`model*.ts`), parametri delle richieste per ciascun provider (`extra-params.*`), Compaction, collegamento di trascrizioni e sessioni. |
| `src/agents/sessions/`              | Persistenza delle sessioni (`session-manager.ts`), individuazione delle risorse (`package-manager.ts`, `resource-loader.ts`), caricamento di `extensions` nella sessione, modelli di prompt, Skills, temi e renderer degli strumenti basati sulla TUI (`tools/`). |
| `packages/agent-core/`              | Core riutilizzabile dell'agente (`@openclaw/agent-core`): ciclo dell'agente, tipi dell'harness, messaggi, helper per la Compaction, modelli di prompt, Skills e contratti di archiviazione delle sessioni. |
| `src/agents/runtime/`               | Facade OpenClaw che collega `@openclaw/agent-core` al runtime LLM dell'SDK dei plugin e lo riesporta insieme alle utilità proxy locali.                                                                                       |
| `src/agents/agent-tools*.ts`        | Definizioni degli strumenti gestite da OpenClaw, schemi dei parametri, criteri degli strumenti, adattatori precedenti/successivi alle chiamate degli strumenti e strumenti di modifica dell'host/sandbox.                   |
| `src/agents/agent-hooks/`           | Hook del runtime integrato: protezione della Compaction, istruzioni per la Compaction, eliminazione selettiva del contesto.                                                                                                  |
| `src/agents/harness/`               | Registro degli harness, criteri di selezione e ciclo di vita degli harness integrati e registrati dai plugin.                                                                                                               |
| `src/llm/`                          | Registro di modelli/provider, helper di trasporto e implementazioni dei flussi specifiche per provider (`src/llm/providers/`).                                                                                              |

## Confini

Il core chiama il runtime integrato tramite i moduli OpenClaw e i barrel dell'SDK; non rimane alcun pacchetto di framework esterno per agenti. I plugin utilizzano gli entry point `openclaw/plugin-sdk/*` documentati e non importano componenti interni di `src/**`.

`@earendil-works/pi-tui` rimane una dipendenza di terze parti: un toolkit di componenti per terminale utilizzato dalla TUI locale e dai renderer degli strumenti di sessione. La sua internalizzazione richiederebbe un'attività distinta di incorporamento del codice di terze parti.

## Manifest

I pacchetti di risorse dichiarano le risorse OpenClaw nei metadati `package.json`. Le voci sono percorsi di file o glob relativi alla radice del pacchetto:

```json
{
  "openclaw": {
    "extensions": ["extensions/index.ts"],
    "skills": ["skills/*.md"],
    "prompts": ["prompts/*.md"],
    "themes": ["themes/*.json"]
  }
}
```

Per i tipi di risorse non elencati in un manifest, viene usata come fallback l'individuazione delle directory convenzionali `extensions/`, `skills/`, `prompts/` e `themes/`.

## Selezione del runtime

- L'ID del runtime integrato è `openclaw`. L'alias legacy `pi` viene normalizzato in `openclaw`; `codex-app-server` viene normalizzato in `codex`.
- Gli harness dei plugin registrano ID di runtime aggiuntivi (ad esempio `codex`).
- I criteri del runtime sono definiti dalla configurazione `agentRuntime.id` con ambito modello/provider (la voce del modello ha la precedenza su quella del provider). Un valore non impostato o `default` viene risolto in `auto`.
- `auto` seleziona un harness di plugin registrato che supporta la route effettiva del provider; in caso contrario, seleziona il runtime OpenClaw integrato. Il solo prefisso di un provider o modello non seleziona mai un harness.
- OpenAI può selezionare implicitamente `codex` soltanto per una route HTTPS ufficiale e corrispondente esattamente a Platform Responses o ChatGPT Responses, senza alcuna sostituzione della richiesta definita dall'utente. Gli adattatori Completions, gli endpoint personalizzati e le route con comportamento della richiesta definito dall'utente rimangono su `openclaw`; gli endpoint HTTP ufficiali in testo non cifrato vengono rifiutati. Consultare [runtime implicito dell'agente OpenAI](/it/providers/openai#implicit-agent-runtime).

## Argomenti correlati

- [Flusso di lavoro del runtime dell'agente OpenClaw](/it/openclaw-agent-runtime)
- [Runtime degli agenti](/it/concepts/agent-runtimes)
