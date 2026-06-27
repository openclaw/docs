---
read_when:
    - Vuoi risultati degli strumenti `exec` o `bash` più brevi in OpenClaw
    - Vuoi installare o abilitare il plugin Tokenjuice
    - Devi capire che cosa modifica tokenjuice e che cosa lascia grezzo
summary: Compatta i risultati rumorosi degli strumenti exec e bash con il Plugin Tokenjuice opzionale
title: Tokenjuice
x-i18n:
    generated_at: "2026-06-27T18:24:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 183ab08d2a1150b446245514423b893cff9a85581980c15600cc16aec10eeae7
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` è un Plugin esterno opzionale che compatta i risultati rumorosi degli strumenti `exec` e `bash`
dopo che il comando è già stato eseguito.

Modifica il `tool_result` restituito, non il comando stesso. Tokenjuice non
riscrive l'input della shell, non riesegue i comandi e non modifica i codici di uscita.

Oggi questo si applica alle esecuzioni incorporate di OpenClaw e agli strumenti dinamici di OpenClaw nell'harness app-server di Codex. Tokenjuice si aggancia al middleware dei risultati degli strumenti di OpenClaw e
riduce l'output prima che rientri nella sessione harness attiva.

## Abilitare il Plugin

Installalo una volta:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

Poi abilitalo:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Equivalente:

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

- Compatta i risultati rumorosi di `exec` e `bash` prima che vengano reimmessi nella sessione.
- Mantiene intatta l'esecuzione originale del comando.
- Preserva le letture esatte del contenuto dei file e altri comandi che tokenjuice deve lasciare grezzi.
- Resta opt-in: disabilita il Plugin se vuoi output letterale ovunque.

## Verificare che funzioni

1. Abilita il Plugin.
2. Avvia una sessione che possa chiamare `exec`.
3. Esegui un comando rumoroso come `git status`.
4. Controlla che il risultato dello strumento restituito sia più breve e più strutturato dell'output grezzo della shell.

## Disabilitare il Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Oppure:

```bash
openclaw plugins disable tokenjuice
```

## Correlati

- [Strumento Exec](/it/tools/exec)
- [Livelli di ragionamento](/it/tools/thinking)
- [Motore di contesto](/it/concepts/context-engine)
