---
read_when:
    - Aggiunta di una checklist BOOT.md
summary: Modello dell'area di lavoro per BOOT.md
title: Modello BOOT.md
x-i18n:
    generated_at: "2026-07-12T07:31:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1adfb4d71f1f03716a1ddc4774a4cb6ead4b8be65bd9bb34066a9e1929a36b21
    source_path: reference/templates/BOOT.md
    workflow: 16
---

# BOOT.md

Aggiungi qui istruzioni di avvio brevi ed esplicite. L'hook `boot-md` incluso esegue questo file una volta per ogni spazio di lavoro dell'agente ogni volta che il Gateway si avvia, se il file esiste e contiene caratteri diversi dagli spazi bianchi. Più agenti che condividono uno spazio di lavoro attivano una sola esecuzione.

L'hook è fornito disabilitato. Prima abilitalo:

```bash
openclaw hooks enable boot-md
```

Se un elemento dell'elenco di controllo invia un messaggio, usa lo strumento per i messaggi, quindi rispondi con l'esatto token silenzioso `NO_REPLY` (senza distinzione tra maiuscole e minuscole).

## Correlati

- [Spazio di lavoro dell'agente](/it/concepts/agent-workspace)
- [Hook](/it/automation/hooks#boot-md)
