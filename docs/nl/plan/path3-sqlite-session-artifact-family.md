---
read_when:
    - Je implementeert clawdbot-d63.2 / clawdbot-04b
    - Je werkt aan het bewaren, opnieuw instellen, verwijderen of archiveren bij agentverwijdering van SQLite-sessies
    - Je moet artefactfamilies uit het SQLite-tijdperk onderscheiden van verouderde JSONL-sidecars
summary: Plan voor pad 3 voor het archiveren van alle SQLite-transcriptartefacten die bij een sessie horen
title: Pad 3 SQLite-sessieartefactfamilie
x-i18n:
    generated_at: "2026-07-16T16:01:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: adb2c31293ab63cb80449d037600d78fbb228e91f380d1ccaf15fb00728a9057
    source_path: plan/path3-sqlite-session-artifact-family.md
    workflow: 16
---

# Pad 3 SQLite-sessieartefactfamilie

Deze notitie bakent `clawdbot-d63.2` af, terwijl `clawdbot-d63.1` verantwoordelijk is voor de overlappende
helper voor het archiveren bij resetten/verwijderen in `src/config/sessions/session-accessor.sqlite.ts`.
Het implementatiebestand bevatte tijdens deze ronde niet-vastgelegde wijzigingen, dus dit artefact legt
het exacte contract en de wijzigingspunten vast zonder de parallelle worker in de weg te zitten.

## Gezaghebbende familie

Na de overstap naar SQLite zijn actieve sessietranscripten SQLite-rijen. De
archieffamilie van een sessie is:

- De rijen `transcript_events`, `transcript_event_identities` en `sessions`
  voor de huidige `sessionId` van de vermelding.
- Dezelfde set SQLite-transcriptrijen voor elke `sessionId` waarnaar
  `entry.compactionCheckpoints[*].preCompaction.sessionId` verwijst.
- Dezelfde set SQLite-transcriptrijen voor elke `sessionId` waarnaar
  `entry.compactionCheckpoints[*].postCompaction.sessionId` verwijst.
- Dezelfde set SQLite-transcriptrijen voor elke `sessionId` in
  `entry.usageFamilySessionIds`.

Archiveer alleen rijen waarnaar niet langer wordt verwezen door een resterende
`session_entries`-rij of door de Compaction- of gebruiksfamiliemetadata van een resterende vermelding.
Hierdoor blijven de status voor checkpointvertakkingen/-herstel en gebruiksaggregatie behouden totdat
de laatste actieve verwijzing verdwenen is.

## Artefacten buiten de familie na de overstap

Gegenereerde varianten van onderwerptranscriptbestanden en trajectsidecars zijn geen actieve
SQLite-runtimestatus. Het zijn verouderde bestandsartefacten:

- Onderwerpvarianten zoals `<sessionId>-topic-<thread>.jsonl` bestaan alleen voor de
  bestandsgebaseerde transcriptindeling. SQLite gebruikt de canonieke sessie-id plus
  `session_routes`/afleveringsmetadata van de vermelding in plaats van JSONL-bestanden per onderwerp.
- Trajectsidecars zoals `.trajectory.jsonl` en `.trajectory-path.json`
  worden benoemd op basis van echte JSONL-`sessionFile`-paden. SQLite-waarden van `sessionFile` zijn
  `sqlite:<agentId>:<sessionId>:<storePath>`-markeringen en benoemen geen sidecarbestanden.
- Lezers van het archiefniveau moeten verouderde gearchiveerde JSONL-bestanden blijven lezen, maar
  runtimebewaring mag geen actieve sessiemappen scannen of JSONL-transcriptbestanden
  voor SQLite-sessies opnieuw openen.

Doctor-import blijft de migratie-eigenaar voor verouderde primaire JSONL-bestanden en
de aangrenzende trajectsidecars. Runtimebewaring in SQLite mag geen
tweede importfunctie of bestandsterugval toevoegen.

## Wijzigingspunten

Breid de door `clawdbot-d63.1` geïntroduceerde SQLite-archiefhelper uit in plaats van
een parallel pad toe te voegen.

1. Voeg een lokale verzamelaar toe nabij `deleteSqliteSessionStateIfUnreferenced`:
   - `collectSqliteSessionArtifactFamily(entry: SessionEntry): Set<string>`
   - Neem `entry.sessionId`, sessie-id's vóór/na checkpoints en
     `usageFamilySessionIds` op.
   - Filter lege tekenreeksen en verwijder duplicaten deterministisch.

2. Voeg een verwijzingsverzamelaar toe voor de opslag na verwijdering:
   - `readReferencedSqliteSessionArtifactFamilyIds(database): Set<string>`
   - Doorloop de huidige `session_entries`, parse elke `entry_json` en verzamel
     dezelfde familie-id's uit elke overblijvende vermelding.

3. Wijzig de aanroepers voor resetten/verwijderen/onderhoud die momenteel één
   verwijderde `sessionId` archiveren, zodat ze de volledige familie van de verwijderde vermelding doorgeven.

4. Archiveer voor elke familie-id de SQLite-transcriptrijen met de reden van de aanroeper
   (`reset` of `deleted`) en verwijder vervolgens de `sessions`-rij alleen wanneer de
   familie-id niet voorkomt in de verwijzingsset na verwijdering.

5. Houd het verwijderen van transcriptgebeurtenissen gecentraliseerd via het bestaande opschoningspad
   voor SQLite-sessierijen. Voeg geen actieve JSONL-lezingen toe.

## Gerichte tests

Voeg uitsluitend op SQLite gerichte tests toe aan `src/config/sessions/session-accessor.conformance.test.ts`
of aan de parallelle levenscyclustest nadat `clawdbot-d63.1` is vastgelegd:

- Bij het verwijderen van een vermelding met een transcript van vóór Compaction worden zowel de huidige
  sessie als de sessie van vóór Compaction gearchiveerd en vervolgens beide sets SQLite-rijen verwijderd.
- Bij het verwijderen van een van twee vermeldingen die een pre-sessie voor Compaction delen, wordt
  niets voor de gedeelde pre-sessie gearchiveerd totdat de laatste verwijzende vermelding is
  verwijderd.
- Bij het verwijderen van een vermelding met `usageFamilySessionIds` worden de SQLite-
  transcriptrijen van voorgangers gearchiveerd wanneer geen andere vermelding naar die gebruiksfamilie verwijst.
- Een sessiesleutel in onderwerpvorm met een SQLite-markering veroorzaakt geen lezing van een gegenereerd
  JSONL-onderwerpbestand of zoekactie naar een sidecar.

Het gerichte bewijs moet het volgende gebruiken:

```bash
node scripts/run-vitest.mjs src/config/sessions/session-accessor.conformance.test.ts
```

Als de uiteindelijke tests in `store.session-lifecycle-mutation.test.ts` staan, voer dat
bestand dan expliciet uit met dezelfde wrapper. Brede `pnpm`-controles moeten voor deze
Codex-worktree op Crabbox/Testbox blijven.
