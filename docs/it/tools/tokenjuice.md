---
read_when:
    - Vuoi risultati degli strumenti `exec` o `bash` più brevi in OpenClaw
    - Vuoi installare o abilitare il plugin Tokenjuice
    - Devi capire cosa modifica tokenjuice e cosa lascia invariato.
summary: Compatta i risultati verbosi degli strumenti exec e bash con il Plugin opzionale Tokenjuice
title: Succo di token
x-i18n:
    generated_at: "2026-07-12T07:35:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96b110563a2600429dd9f0d38997cf7cc5ae4952b7f146a6ab64c96f2f202440
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` è un plugin esterno facoltativo che compatta i risultati verbosi degli strumenti `exec` e `bash`
dopo che il comando è già stato eseguito.

Modifica il `tool_result` restituito, non il comando stesso. Tokenjuice non
riscrive l'input della shell, non riesegue i comandi e non modifica i codici di uscita.

Attualmente ciò si applica alle esecuzioni integrate di OpenClaw e agli strumenti dinamici di OpenClaw nell'harness
app-server di Codex. Tokenjuice si collega al middleware dei risultati degli strumenti di OpenClaw e
riduce l'output prima che venga reimmesso nella sessione attiva dell'harness.

## Abilitare il plugin

Esegui l'installazione una sola volta:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

Quindi abilitalo:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Comando equivalente:

```bash
openclaw plugins enable tokenjuice
```

Se preferisci modificare direttamente la configurazione:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## Cosa modifica tokenjuice

- Compatta i risultati verbosi di `exec` e `bash` prima che vengano reimmessi nella sessione.
- Mantiene inalterata l'esecuzione del comando originale.
- Applica una politica sicura per l'inventario: le letture esatte del contenuto dei file rimangono in formato grezzo, i comandi autonomi di inventario del repository possono essere compattati e le sequenze miste di comandi non sicure rimangono in formato grezzo.
- Rimane facoltativo: disabilita il plugin se desideri sempre un output letterale.

## Verificare che funzioni

1. Abilita il plugin.
2. Avvia una sessione che possa chiamare `exec`.
3. Esegui un comando verboso, ad esempio `git status`.
4. Verifica che il risultato restituito dallo strumento sia più breve e strutturato rispetto all'output grezzo della shell.

## Disabilitare il plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Oppure:

```bash
openclaw plugins disable tokenjuice
```

## Argomenti correlati

- [Strumento Exec](/it/tools/exec)
- [Livelli di ragionamento](/it/tools/thinking)
- [Motore del contesto](/it/concepts/context-engine)
