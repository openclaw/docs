---
read_when:
    - Vuoi una memoria persistente che funzioni tra sessioni e canali
    - Vuoi richiamo basato su AI e modellazione dell'utente
summary: Memoria cross-session nativa per l'AI tramite il Plugin Honcho
title: Memoria Honcho
x-i18n:
    generated_at: "2026-04-24T08:36:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: d77af5c7281a4abafc184e426b1c37205a6d06a196b50353c1abbf67cc93bb97
    source_path: concepts/memory-honcho.md
    workflow: 15
---

[Honcho](https://honcho.dev) aggiunge memoria nativa per l'AI a OpenClaw. Mantiene in modo persistente le
conversazioni in un servizio dedicato e costruisce nel tempo modelli dell'utente e dell'agente,
fornendo al tuo agente un contesto cross-session che va oltre i file Markdown
del workspace.

## Cosa fornisce

- **Memoria cross-session** -- le conversazioni vengono mantenute in modo persistente dopo ogni turno, così
  il contesto si conserva tra reset di sessione, Compaction e cambi di canale.
- **Modellazione dell'utente** -- Honcho mantiene un profilo per ogni utente (preferenze,
  fatti, stile di comunicazione) e per l'agente (personalità, comportamenti
  appresi).
- **Ricerca semantica** -- ricerca tra osservazioni di conversazioni passate, non
  solo nella sessione corrente.
- **Consapevolezza multi-agente** -- gli agenti padre tracciano automaticamente i
  subagenti generati, con i padri aggiunti come osservatori nelle sessioni figlie.

## Strumenti disponibili

Honcho registra strumenti che l'agente può usare durante la conversazione:

**Recupero dati (veloce, nessuna chiamata LLM):**

| Tool                        | Cosa fa                                               |
| --------------------------- | ----------------------------------------------------- |
| `honcho_context`            | Rappresentazione completa dell'utente tra le sessioni |
| `honcho_search_conclusions` | Ricerca semantica tra le conclusioni archiviate       |
| `honcho_search_messages`    | Trova messaggi tra le sessioni (filtra per mittente, data) |
| `honcho_session`            | Cronologia e riepilogo della sessione corrente        |

**Q&A (basato su LLM):**

| Tool         | Cosa fa                                                                  |
| ------------ | ------------------------------------------------------------------------ |
| `honcho_ask` | Fa domande sull'utente. `depth='quick'` per i fatti, `'thorough'` per la sintesi |

## Per iniziare

Installa il Plugin ed esegui la configurazione:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

Il comando di configurazione chiede le tue credenziali API, scrive la configurazione e
facoltativamente migra i file di memoria esistenti del workspace.

<Info>
Honcho può essere eseguito interamente in locale (self-hosted) oppure tramite l'API gestita su
`api.honcho.dev`. Per l'opzione self-hosted non sono richieste dipendenze
esterne.
</Info>

## Configurazione

Le impostazioni si trovano sotto `plugins.entries["openclaw-honcho"].config`:

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // ometti per self-hosted
          workspaceId: "openclaw", // isolamento della memoria
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

Per istanze self-hosted, punta `baseUrl` al tuo server locale (per esempio
`http://localhost:8000`) e ometti la chiave API.

## Migrare la memoria esistente

Se hai file di memoria del workspace esistenti (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), `openclaw honcho setup` li rileva e
offre di migrarli.

<Info>
La migrazione non è distruttiva -- i file vengono caricati su Honcho. Gli originali
non vengono mai eliminati né spostati.
</Info>

## Come funziona

Dopo ogni turno AI, la conversazione viene mantenuta in modo persistente in Honcho. Sia i messaggi dell'utente sia
quelli dell'agente vengono osservati, consentendo a Honcho di costruire e perfezionare i propri modelli nel
tempo.

Durante la conversazione, gli strumenti Honcho interrogano il servizio nella fase `before_prompt_build`,
iniettando contesto rilevante prima che il modello veda il prompt. Questo garantisce
confini di turno accurati e richiamo pertinente.

## Honcho vs memoria integrata

|                   | Integrata / QMD               | Honcho                              |
| ----------------- | ----------------------------- | ----------------------------------- |
| **Archiviazione** | File Markdown del workspace   | Servizio dedicato (locale o hosted) |
| **Cross-session** | Tramite file di memoria       | Automatica, integrata               |
| **Modellazione dell'utente** | Manuale (scrittura in MEMORY.md) | Profili automatici                  |
| **Ricerca**       | Vettoriale + parola chiave (ibrida) | Semantica sulle osservazioni        |
| **Multi-agente**  | Non tracciato                 | Consapevolezza padre/figlio         |
| **Dipendenze**    | Nessuna (integrata) o binario QMD | Installazione del Plugin            |

Honcho e il sistema di memoria integrato possono lavorare insieme. Quando è configurato QMD,
diventano disponibili strumenti aggiuntivi per cercare nei file Markdown locali insieme
alla memoria cross-session di Honcho.

## Comandi CLI

```bash
openclaw honcho setup                        # Configura la chiave API e migra i file
openclaw honcho status                       # Controlla lo stato della connessione
openclaw honcho ask <question>               # Interroga Honcho sull'utente
openclaw honcho search <query> [-k N] [-d D] # Ricerca semantica nella memoria
```

## Per approfondire

- [Codice sorgente del Plugin](https://github.com/plastic-labs/openclaw-honcho)
- [Documentazione Honcho](https://docs.honcho.dev)
- [Guida all'integrazione di Honcho con OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)
- [Memoria](/it/concepts/memory) -- panoramica della memoria di OpenClaw
- [Context Engines](/it/concepts/context-engine) -- come funzionano i motori di contesto dei plugin

## Correlati

- [Panoramica della memoria](/it/concepts/memory)
- [Motore di memoria integrato](/it/concepts/memory-builtin)
- [Motore di memoria QMD](/it/concepts/memory-qmd)
