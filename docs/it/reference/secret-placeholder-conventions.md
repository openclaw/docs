---
read_when:
    - Scrivere documentazione che include token, chiavi API o frammenti di credenziali
    - Aggiornamento di esempi che possono essere analizzati dagli strumenti di rilevamento dei segreti
summary: Convenzioni per placeholder sicuri per secret scanner per documenti ed esempi
title: Convenzioni per i segnaposto dei segreti
x-i18n:
    generated_at: "2026-06-27T18:13:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 87e0db9ad47bf0c9d434da9bdcd6587e0b01d4eddf5ad245cf3dc87a1d166875
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# Convenzioni per i segnaposto dei segreti

Usa segnaposto leggibili da una persona ma che non assomiglino a segreti reali.

## Stile consigliato

- Preferisci valori descrittivi come `example-openai-key-not-real` o `example-discord-bot-token`.
- Per gli snippet shell, preferisci `${OPENAI_API_KEY}` rispetto a stringhe inline che sembrano token.
- Mantieni gli esempi chiaramente fittizi e circoscritti allo scopo (provider, canale, tipo di autenticazione).

## Evita questi pattern nella documentazione

- Testo letterale di intestazione o piè di pagina di una chiave privata PEM.
- Prefissi che assomigliano a credenziali attive, per esempio `sk-...`, `xoxb-...`, `AKIA...`.
- Bearer token dall'aspetto realistico copiati dai log di runtime.

## Esempio

```bash
# Good
export OPENAI_API_KEY="example-openai-key-not-real"

# Better (when the doc is about env wiring)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
