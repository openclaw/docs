---
read_when:
    - Vuoi abilitare o configurare `code_execution`
    - Vuoi analisi remote senza accesso alla shell locale
    - Vuoi combinare `x_search` o `web_search` con analisi Python remote
summary: code_execution -- esegue analisi Python remote sandboxed con xAI
title: Esecuzione del codice
x-i18n:
    generated_at: "2026-04-05T14:05:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48ca1ddd026cb14837df90ee74859eb98ba6d1a3fbc78da8a72390d0ecee5e40
    source_path: tools/code-execution.md
    workflow: 15
---

# Esecuzione del codice

`code_execution` esegue analisi Python remote sandboxed sull'API Responses di xAI.
È diverso da [`exec`](/tools/exec) locale:

- `exec` esegue comandi shell sulla tua macchina o nodo
- `code_execution` esegue Python nella sandbox remota di xAI

Usa `code_execution` per:

- calcoli
- tabulazione
- statistiche rapide
- analisi in stile grafico
- analizzare dati restituiti da `x_search` o `web_search`

**Non** usarlo quando ti servono file locali, la tua shell, il tuo repository o dispositivi associati. Per questo usa [`exec`](/tools/exec).

## Configurazione

Ti serve una chiave API xAI. Funziona una qualsiasi di queste:

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

Fai la richiesta in modo naturale e rendi esplicito l'obiettivo dell'analisi:

```text
Usa code_execution per calcolare la media mobile a 7 giorni per questi numeri: ...
```

```text
Usa x_search per trovare i post che menzionano OpenClaw questa settimana, poi usa code_execution per contarli per giorno.
```

```text
Usa web_search per raccogliere i numeri più recenti dei benchmark AI, poi usa code_execution per confrontare le variazioni percentuali.
```

Internamente lo strumento accetta un solo parametro `task`, quindi l'agente dovrebbe inviare la richiesta di analisi completa e tutti gli eventuali dati inline in un unico prompt.

## Limiti

- Si tratta di esecuzione remota xAI, non di esecuzione di processi locali.
- Deve essere trattata come analisi effimera, non come notebook persistente.
- Non presumere l'accesso a file locali o al tuo workspace.
- Per dati X aggiornati, usa prima [`x_search`](/tools/web#x_search).

## Vedi anche

- [Strumenti web](/tools/web)
- [Exec](/tools/exec)
- [xAI](/it/providers/xai)
