---
read_when:
    - Si desidera abilitare o configurare code_execution
    - Vuoi un'analisi remota senza accesso alla shell locale
    - Vuoi combinare x_search o web_search con l'analisi Python remota
summary: code_execution -- esegui analisi Python remota in sandbox con xAI
title: Esecuzione del codice
x-i18n:
    generated_at: "2026-04-30T09:15:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe635ec65aaf593a5bd63c139fbfc69e1ba3ea7c58c2bba639ec1ebd70dba1a9
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` esegue analisi Python remote in sandbox sull'API Responses di xAI.
Questo è diverso da [`exec`](/it/tools/exec) locale:

- `exec` esegue comandi shell sulla tua macchina o sul tuo nodo
- `code_execution` esegue Python nella sandbox remota di xAI

Usa `code_execution` per:

- calcoli
- tabulazioni
- statistiche rapide
- analisi in stile grafico
- analizzare dati restituiti da `x_search` o `web_search`

**Non** usarlo quando hai bisogno di file locali, della tua shell, del tuo repo o di dispositivi associati. Usa [`exec`](/it/tools/exec) per quello.

## Configurazione

Ti serve una chiave API xAI. Va bene una qualunque di queste:

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

Esempio:

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## Come usarlo

Chiedi in modo naturale e rendi esplicita l'intenzione dell'analisi:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Lo strumento accetta internamente un solo parametro `task`, quindi l'agent deve inviare la richiesta di analisi completa e tutti i dati inline in un unico prompt.

## Limiti

- Questa è un'esecuzione remota di xAI, non un'esecuzione di processi locali.
- Va trattata come analisi effimera, non come notebook persistente.
- Non presumere l'accesso ai file locali o al tuo workspace.
- Per dati X aggiornati, usa prima [`x_search`](/it/tools/web#x_search).

## Correlati

- [Strumento Exec](/it/tools/exec)
- [Approvazioni Exec](/it/tools/exec-approvals)
- [Strumento apply_patch](/it/tools/apply-patch)
- [Strumenti Web](/it/tools/web)
- [xAI](/it/providers/xai)
