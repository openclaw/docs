---
read_when:
    - Vuoi risultati degli strumenti `exec` o `bash` più brevi in OpenClaw
    - Vuoi abilitare il Plugin tokenjuice incluso
    - Hai bisogno di capire cosa modifica tokenjuice e cosa lascia grezzo
summary: Compatta risultati rumorosi degli strumenti exec e bash con un Plugin incluso facoltativo
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-24T09:08:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ff542095eb730f06eadec213289b93e31f1afa179160b7d4e915329f09ad5f1
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` è un Plugin incluso facoltativo che compatta i risultati rumorosi degli strumenti `exec` e `bash`
dopo che il comando è già stato eseguito.

Modifica il `tool_result` restituito, non il comando stesso. Tokenjuice non
riscrive l'input della shell, non riesegue i comandi e non cambia i codici di uscita.

Oggi questo si applica alle esecuzioni embedded di Pi, dove tokenjuice intercetta il percorso
embedded di `tool_result` e riduce l'output che torna nella sessione.

## Abilitare il Plugin

Percorso rapido:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Equivalente:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw distribuisce già il Plugin. Non esiste un passaggio separato `plugins install`
o `tokenjuice install openclaw`.

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

## Cosa cambia tokenjuice

- Compatta i risultati rumorosi di `exec` e `bash` prima che vengano reinseriti nella sessione.
- Lascia invariata l'esecuzione originale del comando.
- Preserva le letture esatte del contenuto dei file e altri comandi che tokenjuice deve lasciare grezzi.
- Resta opt-in: disabilita il Plugin se vuoi output letterale ovunque.

## Verificare che funzioni

1. Abilita il Plugin.
2. Avvia una sessione che possa chiamare `exec`.
3. Esegui un comando rumoroso come `git status`.
4. Controlla che il risultato dello strumento restituito sia più breve e più strutturato rispetto all'output raw della shell.

## Disabilitare il Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Oppure:

```bash
openclaw plugins disable tokenjuice
```

## Correlati

- [Strumento exec](/it/tools/exec)
- [Thinking levels](/it/tools/thinking)
- [Context engine](/it/concepts/context-engine)
