---
read_when:
    - Vuoi una memoria persistente che funzioni tra sessioni e canali
    - Vuoi una funzione di richiamo e una modellazione dell'utente basate sull'IA
summary: Memoria tra sessioni nativa per l'IA tramite il plugin Honcho
title: Memoria Honcho
x-i18n:
    generated_at: "2026-07-12T06:56:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fadcf6d8e2505ab4fe6a81340695b7c8fee49c3cb4889665af13389941619117
    source_path: concepts/memory-honcho.md
    workflow: 16
---

[Honcho](https://honcho.dev) aggiunge a OpenClaw una memoria nativa per l'IA tramite un
Plugin esterno. Salva le conversazioni in un servizio dedicato e crea nel
tempo modelli dell'utente e dell'agente, fornendo all'agente un contesto tra
sessioni che va oltre i file Markdown dell'area di lavoro.

## Cosa offre

- **Memoria tra sessioni** - le conversazioni vengono conservate dopo ogni
  turno, così il contesto persiste anche dopo la reimpostazione della sessione,
  la Compaction e il passaggio da un canale all'altro.
- **Modellazione dell'utente** - Honcho mantiene un profilo per ogni utente
  (preferenze, informazioni, stile di comunicazione) e per l'agente
  (personalità, comportamenti appresi).
- **Ricerca semantica** - consente di cercare tra le osservazioni ricavate
  dalle conversazioni precedenti, non solo nella sessione corrente.
- **Consapevolezza multi-agente** - gli agenti principali tengono
  automaticamente traccia dei sottoagenti avviati e vengono aggiunti come
  osservatori nelle sessioni degli agenti secondari.

## Strumenti disponibili

Honcho registra strumenti che l'agente può utilizzare durante la conversazione:

**Recupero dei dati (rapido, senza chiamate al modello linguistico):**

| Strumento                   | Funzione                                                        |
| --------------------------- | --------------------------------------------------------------- |
| `honcho_context`            | Rappresentazione completa dell'utente tra le diverse sessioni   |
| `honcho_search_conclusions` | Ricerca semantica tra le conclusioni archiviate                 |
| `honcho_search_messages`    | Ricerca dei messaggi tra le sessioni (per mittente, data)       |
| `honcho_session`            | Cronologia e riepilogo della sessione corrente                  |

**Domande e risposte (basate sul modello linguistico):**

| Strumento    | Funzione                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------- |
| `honcho_ask` | Pone domande sull'utente. `depth='quick'` per i fatti, `'thorough'` per una sintesi dettagliata |

## Per iniziare

Installa il Plugin ed esegui la configurazione:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

Il comando di configurazione richiede le credenziali API, scrive la
configurazione e, facoltativamente, migra i file di memoria esistenti
dell'area di lavoro.

<Info>
Honcho può essere eseguito interamente in locale (con hosting autonomo) oppure
tramite l'API gestita all'indirizzo `api.honcho.dev`. L'opzione con hosting
autonomo non richiede dipendenze esterne.
</Info>

## Configurazione

Le impostazioni si trovano in `plugins.entries["openclaw-honcho"].config`:

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // ometti per l'hosting autonomo
          workspaceId: "openclaw", // isolamento della memoria
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

Per le istanze con hosting autonomo, imposta `baseUrl` sul server locale (ad
esempio `http://localhost:8000`) e ometti la chiave API.

## Migrazione della memoria esistente

Se disponi di file di memoria esistenti nell'area di lavoro (`USER.md`,
`MEMORY.md`, `IDENTITY.md`, `memory/`, `canvas/`), `openclaw honcho setup` li
rileva e propone di migrarli.

<Info>
La migrazione non è distruttiva: i file vengono caricati su Honcho. Gli
originali non vengono mai eliminati né spostati.
</Info>

## Funzionamento

Dopo ogni turno dell'IA, la conversazione viene salvata in Honcho. Vengono
osservati sia i messaggi dell'utente sia quelli dell'agente, consentendo a
Honcho di creare e perfezionare i propri modelli nel tempo.

Durante la conversazione, gli strumenti di Honcho interrogano il servizio
tramite l'hook del Plugin `before_prompt_build` di OpenClaw, inserendo il
contesto pertinente prima che il modello riceva il prompt.

## Honcho e la memoria integrata a confronto

|                   | Integrata / QMD                         | Honcho                                       |
| ----------------- | --------------------------------------- | -------------------------------------------- |
| **Archiviazione** | File Markdown dell'area di lavoro       | Servizio dedicato (locale o in hosting)      |
| **Tra sessioni**  | Tramite file di memoria                 | Automatica e integrata                       |
| **Modellazione dell'utente** | Manuale (scrittura in MEMORY.md) | Profili automatici                           |
| **Ricerca**       | Vettoriale + parole chiave (ibrida)     | Semantica sulle osservazioni                 |
| **Multi-agente**  | Nessun tracciamento                     | Consapevolezza delle relazioni padre/figlio  |
| **Dipendenze**    | Nessuna (integrata) o binario QMD       | Installazione del Plugin                     |

Honcho e il sistema di memoria integrato possono funzionare insieme. Quando
QMD è configurato, diventano disponibili strumenti aggiuntivi per cercare nei
file Markdown locali insieme alla memoria tra sessioni di Honcho.

## Comandi CLI

```bash
openclaw honcho setup                        # Configura la chiave API e migra i file
openclaw honcho status                       # Verifica lo stato della connessione
openclaw honcho ask <question>               # Interroga Honcho sull'utente
openclaw honcho search <query> [-k N] [-d D] # Ricerca semantica nella memoria
```

## Ulteriori letture

- [Codice sorgente del Plugin](https://github.com/plastic-labs/openclaw-honcho)
- [Documentazione di Honcho](https://docs.honcho.dev)
- [Guida all'integrazione di Honcho con OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)

## Contenuti correlati

- [Panoramica della memoria](/it/concepts/memory)
- [Motore di memoria integrato](/it/concepts/memory-builtin)
- [Motore di memoria QMD](/it/concepts/memory-qmd)
- [Motori di contesto](/it/concepts/context-engine)
