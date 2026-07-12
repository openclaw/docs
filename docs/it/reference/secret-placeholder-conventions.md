---
read_when:
    - Scrivere documentazione che includa token, chiavi API o frammenti di credenziali
    - Aggiornamento degli esempi che potrebbero essere analizzati da strumenti di rilevamento dei segreti
summary: Convenzioni per segnaposto sicuri per gli scanner di segreti nella documentazione e negli esempi
title: Convenzioni per i segnaposto dei segreti
x-i18n:
    generated_at: "2026-07-12T07:31:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0864f0fcc6fb1e4a3147b4b2ce0aac475437a19d694f3d059374782428c7f248
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# Convenzioni per i segnaposto dei segreti

Usa segnaposto leggibili dalle persone, ma che non assomiglino a segreti reali.

## Stile consigliato

- Preferisci valori descrittivi come `example-openai-key-not-real` o `example-discord-bot-token`.
- Per i frammenti di shell, preferisci `${OPENAI_API_KEY}` alle stringhe simili a token inserite direttamente.
- Mantieni gli esempi palesemente fittizi e limitati allo scopo previsto (provider, canale, tipo di autenticazione).

## Schemi da evitare nella documentazione

- Testo letterale dell'intestazione o del piè di pagina di una chiave privata PEM.
- Prefissi che assomigliano a credenziali attive, ad esempio `sk-...`, `xoxb-...`, `AKIA...`.
- Token bearer dall'aspetto realistico copiati dai log di runtime.

## Esempio

```bash
# Buono
export OPENAI_API_KEY="example-openai-key-not-real"

# Migliore (quando il documento riguarda il collegamento delle variabili di ambiente)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
