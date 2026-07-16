---
read_when:
    - Stai implementando clawdbot-d63.2 / clawdbot-04b
    - Si interviene sulla conservazione, la reimpostazione, l’eliminazione o l’archiviazione in caso di eliminazione dell’agente delle sessioni SQLite
    - È necessario distinguere le famiglie di artefatti dell'era SQLite dai file collaterali JSONL legacy
summary: Piano del percorso 3 per archiviare tutti gli artefatti delle trascrizioni SQLite appartenenti a una sessione
title: Famiglia di artefatti di sessione SQLite del percorso 3
x-i18n:
    generated_at: "2026-07-16T14:34:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: adb2c31293ab63cb80449d037600d78fbb228e91f380d1ccaf15fb00728a9057
    source_path: plan/path3-sqlite-session-artifact-family.md
    workflow: 16
---

# Percorso 3: famiglia di artefatti di sessione SQLite

Questa nota delimita `clawdbot-d63.2`, mentre `clawdbot-d63.1` gestisce l'helper sovrapposto
per l'archiviazione durante il ripristino/l'eliminazione in `src/config/sessions/session-accessor.sqlite.ts`.
Il file di implementazione presentava modifiche non salvate durante questa fase, pertanto questo artefatto registra
il contratto esatto e i punti di modifica senza entrare in conflitto con il worker parallelo.

## Famiglia autorevole

Dopo il passaggio a SQLite, le trascrizioni delle sessioni attive sono righe SQLite. La famiglia
di archiviazione di una sessione è:

- Le righe `transcript_events`, `transcript_event_identities` e `sessions`
  per l'attuale `sessionId` della voce.
- Lo stesso insieme di righe della trascrizione SQLite per ogni `sessionId` a cui fa riferimento
  `entry.compactionCheckpoints[*].preCompaction.sessionId`.
- Lo stesso insieme di righe della trascrizione SQLite per ogni `sessionId` a cui fa riferimento
  `entry.compactionCheckpoints[*].postCompaction.sessionId`.
- Lo stesso insieme di righe della trascrizione SQLite per ogni `sessionId` in
  `entry.usageFamilySessionIds`.

Archiviare solo le righe a cui non fa più riferimento alcuna riga
`session_entries` rimanente né i metadati della famiglia di Compaction o di utilizzo
di alcuna voce rimanente. Ciò preserva lo stato di diramazione/ripristino dei checkpoint e di aggregazione dell'utilizzo finché
non viene eliminato l'ultimo riferimento attivo.

## Artefatti esterni alla famiglia dopo il passaggio

Le varianti generate dei file di trascrizione degli argomenti e i file sidecar delle traiettorie non costituiscono
stato di runtime SQLite attivo. Sono artefatti di file legacy:

- Le varianti degli argomenti come `<sessionId>-topic-<thread>.jsonl` esistono solo per il
  formato di trascrizione basato su file. SQLite utilizza l'ID canonico della sessione più
  `session_routes`/i metadati di consegna della voce invece di file JSONL per ogni argomento.
- I file sidecar delle traiettorie come `.trajectory.jsonl` e `.trajectory-path.json`
  prendono il nome da percorsi `sessionFile` JSONL reali. I valori `sessionFile` di SQLite sono
  marcatori `sqlite:<agentId>:<sessionId>:<storePath>` e non indicano file
  sidecar.
- I lettori del livello di archiviazione devono continuare a leggere i file JSONL legacy archiviati, ma
  la conservazione in fase di runtime non deve esaminare le directory delle sessioni attive né riaprire i file
  di trascrizione JSONL per le sessioni SQLite.

L'importazione di Doctor resta responsabile della migrazione dei file JSONL primari legacy e
dei relativi file sidecar delle traiettorie adiacenti. La conservazione SQLite in fase di runtime non deve aggiungere un
secondo importatore né un fallback su file.

## Punti di modifica

Estendere l'helper di archiviazione SQLite introdotto da `clawdbot-d63.1` invece di
aggiungere un percorso parallelo.

1. Aggiungere un raccoglitore locale vicino a `deleteSqliteSessionStateIfUnreferenced`:
   - `collectSqliteSessionArtifactFamily(entry: SessionEntry): Set<string>`
   - Includere `entry.sessionId`, gli ID di sessione precedenti/successivi al checkpoint e
     `usageFamilySessionIds`.
   - Filtrare le stringhe vuote ed eliminare i duplicati in modo deterministico.

2. Aggiungere un raccoglitore di riferimenti per l'archivio successivo alla rimozione:
   - `readReferencedSqliteSessionArtifactFamilyIds(database): Set<string>`
   - Iterare l'attuale `session_entries`, analizzare ogni `entry_json` e raccogliere
     gli stessi ID di famiglia da ogni voce superstite.

3. Modificare i chiamanti di ripristino/eliminazione/manutenzione che attualmente archiviano un solo
   `sessionId` rimosso affinché passino l'intera famiglia della voce rimossa.

4. Per ogni ID di famiglia, archiviare le righe della trascrizione SQLite con il motivo specificato dal chiamante
   (`reset` o `deleted`), quindi eliminare la riga `sessions` solo quando
   l'ID di famiglia è assente dall'insieme di riferimenti successivo alla rimozione.

5. Mantenere centralizzata l'eliminazione degli eventi della trascrizione tramite il percorso esistente
   di pulizia delle righe di sessione SQLite. Non aggiungere letture JSONL attive.

## Test mirati

Aggiungere test esclusivi per SQLite a `src/config/sessions/session-accessor.conformance.test.ts`
o al test del ciclo di vita parallelo dopo il commit di `clawdbot-d63.1`:

- L'eliminazione di una voce con una trascrizione precedente alla Compaction archivia sia la sessione corrente
  sia la sessione precedente alla Compaction, quindi rimuove entrambi gli insiemi di righe SQLite.
- L'eliminazione di una delle due voci che condividono una pre-sessione di Compaction non archivia
  nulla per la pre-sessione condivisa finché non viene rimossa l'ultima voce
  che vi fa riferimento.
- L'eliminazione di una voce con `usageFamilySessionIds` archivia le righe della trascrizione SQLite
  del predecessore quando nessun'altra voce fa riferimento a tale famiglia di utilizzo.
- Una chiave di sessione con struttura da argomento e un marcatore SQLite non causa alcuna lettura
  del JSONL generato per l'argomento né alcuna ricerca di file sidecar.

Per la verifica mirata utilizzare:

```bash
node scripts/run-vitest.mjs src/config/sessions/session-accessor.conformance.test.ts
```

Se i test finali si trovano in `store.session-lifecycle-mutation.test.ts`, eseguire esplicitamente tale
file con lo stesso wrapper. I gate generali `pnpm` devono rimanere su
Crabbox/Testbox per questo worktree Codex.
