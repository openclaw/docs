---
read_when:
    - Vuoi una memoria persistente che funzioni tra sessioni e canali
    - Vuoi richiamo basato sull'AI e modellazione dell'utente
summary: Memoria cross-session nativa per l'AI tramite il plugin Honcho
title: Memoria Honcho
x-i18n:
    generated_at: "2026-04-05T13:49:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83ae3561152519a23589f754e0625f1e49c43e38f85de07686b963170a6cf229
    source_path: concepts/memory-honcho.md
    workflow: 15
---

# Memoria Honcho

[Honcho](https://honcho.dev) aggiunge memoria nativa per l'AI a OpenClaw. Mantiene
le conversazioni in modo persistente in un servizio dedicato e costruisce nel tempo modelli dell'utente e dell'agente,
fornendo al tuo agente un contesto cross-session che va oltre i file Markdown
del workspace.

## Cosa fornisce

- **Memoria cross-session** -- le conversazioni vengono mantenute in modo persistente dopo ogni turno, quindi
  il contesto continua tra reset di sessione, compattazione e cambi di canale.
- **Modellazione dell'utente** -- Honcho mantiene un profilo per ciascun utente (preferenze,
  fatti, stile di comunicazione) e per l'agente (personalità, comportamenti
  appresi).
- **Ricerca semantica** -- ricerca tra osservazioni di conversazioni passate, non
  solo nella sessione corrente.
- **Consapevolezza multi-agente** -- gli agenti genitori tracciano automaticamente i
  sotto-agenti generati, con i genitori aggiunti come osservatori nelle sessioni figlie.

## Strumenti disponibili

Honcho registra strumenti che l'agente può usare durante la conversazione:

**Recupero dati (rapido, senza chiamata LLM):**

| Tool                        | Cosa fa                                                |
| --------------------------- | ------------------------------------------------------ |
| `honcho_context`            | Rappresentazione completa dell'utente tra le sessioni  |
| `honcho_search_conclusions` | Ricerca semantica sulle conclusioni archiviate         |
| `honcho_search_messages`    | Trova messaggi tra le sessioni (filtra per mittente, data) |
| `honcho_session`            | Cronologia e riepilogo della sessione corrente         |

**Domande e risposte (basato su LLM):**

| Tool         | Cosa fa                                                                       |
| ------------ | ----------------------------------------------------------------------------- |
| `honcho_ask` | Fai una domanda sull'utente. `depth='quick'` per i fatti, `'thorough'` per la sintesi |

## Per iniziare

Installa il plugin ed esegui la configurazione:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

Il comando di configurazione richiede le tue credenziali API, scrive la configurazione e
facoltativamente migra i file di memoria esistenti del workspace.

<Info>
Honcho può funzionare interamente in locale (self-hosted) oppure tramite l'API gestita su
`api.honcho.dev`. Non sono richieste dipendenze esterne per l'opzione
self-hosted.
</Info>

## Configurazione

Le impostazioni si trovano in `plugins.entries["openclaw-honcho"].config`:

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // omit for self-hosted
          workspaceId: "openclaw", // memory isolation
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

Per le istanze self-hosted, imposta `baseUrl` sul tuo server locale (ad esempio
`http://localhost:8000`) e ometti la chiave API.

## Migrazione della memoria esistente

Se hai file di memoria esistenti del workspace (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), `openclaw honcho setup` li rileva e
offre di migrarli.

<Info>
La migrazione non è distruttiva -- i file vengono caricati su Honcho. Gli originali non vengono
mai eliminati né spostati.
</Info>

## Come funziona

Dopo ogni turno dell'AI, la conversazione viene mantenuta in modo persistente su Honcho. Sia i messaggi dell'utente sia quelli
dell'agente vengono osservati, consentendo a Honcho di costruire e perfezionare nel tempo i propri modelli.

Durante la conversazione, gli strumenti Honcho interrogano il servizio nella fase `before_prompt_build`,
iniettando contesto pertinente prima che il modello veda il prompt. Questo garantisce
confini di turno accurati e un richiamo pertinente.

## Honcho vs memoria integrata

|                   | Integrata / QMD               | Honcho                              |
| ----------------- | ----------------------------- | ----------------------------------- |
| **Archiviazione** | File Markdown del workspace   | Servizio dedicato (locale o ospitato) |
| **Cross-session** | Tramite file di memoria       | Automatico, integrato               |
| **Modellazione dell'utente** | Manuale (scrivere in MEMORY.md) | Profili automatici         |
| **Ricerca**       | Vettoriale + parola chiave (ibrida) | Semantica sulle osservazioni   |
| **Multi-agente**  | Non tracciato                 | Consapevolezza genitore/figlio      |
| **Dipendenze**    | Nessuna (integrata) o binario QMD | Installazione del plugin        |

Honcho e il sistema di memoria integrato possono funzionare insieme. Quando QMD è configurato,
diventano disponibili strumenti aggiuntivi per cercare nei file Markdown locali insieme
alla memoria cross-session di Honcho.

## Comandi CLI

```bash
openclaw honcho setup                        # Configura la chiave API e migra i file
openclaw honcho status                       # Controlla lo stato della connessione
openclaw honcho ask <question>               # Interroga Honcho sull'utente
openclaw honcho search <query> [-k N] [-d D] # Ricerca semantica nella memoria
```

## Ulteriori letture

- [Codice sorgente del plugin](https://github.com/plastic-labs/openclaw-honcho)
- [Documentazione di Honcho](https://docs.honcho.dev)
- [Guida all'integrazione di Honcho con OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)
- [Memory](/concepts/memory) -- panoramica della memoria di OpenClaw
- [Motori di contesto](/concepts/context-engine) -- come funzionano i motori di contesto dei plugin
