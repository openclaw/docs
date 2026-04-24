---
read_when:
    - Vuoi abilitare o configurare code_execution
    - Vuoi analisi remota senza accesso alla shell locale
    - Vuoi combinare x_search o web_search con analisi Python remota
summary: code_execution -- esegui analisi Python remota in sandbox con xAI
title: Esecuzione del codice
x-i18n:
    generated_at: "2026-04-24T09:04:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 332afbbef15eaa832d87f263eb095eff680e8f941b9e123add9b37f9b4fa5e00
    source_path: tools/code-execution.md
    workflow: 15
---

`code_execution` esegue analisi Python remota in sandbox sull'API Responses di xAI.
Questo è diverso da [`exec`](/it/tools/exec) locale:

- `exec` esegue comandi shell sulla tua macchina o sul tuo Node
- `code_execution` esegue Python nella sandbox remota di xAI

Usa `code_execution` per:

- calcoli
- tabulazione
- statistiche rapide
- analisi in stile grafico
- analizzare dati restituiti da `x_search` o `web_search`

**Non** usarlo quando ti servono file locali, la tua shell, il tuo repo o dispositivi associati. Usa invece [`exec`](/it/tools/exec).

## Configurazione

Ti serve una chiave API xAI. Va bene una qualsiasi di queste:

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

Chiedilo in modo naturale e rendi esplicita l'intenzione di analisi:

```text
Usa code_execution per calcolare la media mobile a 7 giorni per questi numeri: ...
```

```text
Usa x_search per trovare i post che menzionano OpenClaw questa settimana, poi usa code_execution per contarli per giorno.
```

```text
Usa web_search per raccogliere gli ultimi benchmark AI, poi usa code_execution per confrontare le variazioni percentuali.
```

Internamente lo strumento accetta un solo parametro `task`, quindi l'agente dovrebbe inviare
l'intera richiesta di analisi e tutti i dati inline in un unico prompt.

## Limiti

- Questa è esecuzione remota xAI, non esecuzione di processi locali.
- Va trattata come analisi effimera, non come notebook persistente.
- Non assumere accesso a file locali o al tuo workspace.
- Per dati X aggiornati, usa prima [`x_search`](/it/tools/web#x_search).

## Correlati

- [Strumento Exec](/it/tools/exec)
- [Approvazioni exec](/it/tools/exec-approvals)
- [Strumento apply_patch](/it/tools/apply-patch)
- [Strumenti web](/it/tools/web)
- [xAI](/it/providers/xai)
