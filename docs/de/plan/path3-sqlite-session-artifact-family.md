---
read_when:
    - Sie implementieren clawdbot-d63.2 / clawdbot-04b
    - Sie bearbeiten die SQLite-Sitzungsaufbewahrung, das Zurücksetzen, Löschen oder die Archivierung bei Agent-Löschung
    - Sie müssen Artefaktfamilien aus der SQLite-Ära von älteren JSONL-Sidecars unterscheiden.
summary: Pfad-3-Plan zur Archivierung aller SQLite-Transkriptartefakte, die zu einer Sitzung gehören
title: 'Pfad 3: Familie der SQLite-Sitzungsartefakte'
x-i18n:
    generated_at: "2026-07-24T03:56:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 29f4d541b2df5a06468fd0cee620b4340ee33eea1064f7d3ee823580c7b5760e
    source_path: plan/path3-sqlite-session-artifact-family.md
    workflow: 16
---

# Pfad 3: SQLite-Sitzungsartefaktfamilie

Diese Notiz grenzt `clawdbot-d63.2` ab, während `clawdbot-d63.1` für die überlappende
Hilfsfunktion zum Archivieren beim Zurücksetzen/Löschen in `src/config/sessions/session-accessor.sqlite.ts` zuständig ist.
Die Implementierungsdatei enthielt während dieses Durchlaufs nicht committete Änderungen, daher hält dieses Artefakt
den genauen Vertrag und die Änderungspunkte fest, ohne mit dem parallel arbeitenden Worker in Konflikt zu geraten.

## Maßgebliche Familie

Nach der Umstellung auf SQLite sind aktive Sitzungstranskripte SQLite-Zeilen. Die
Archivfamilie einer Sitzung umfasst:

- Die Zeilen `transcript_events`, `transcript_event_identities` und `sessions`
  für den aktuellen `sessionId` des Eintrags.
- Dieselbe SQLite-Transkriptzeilenmenge für jeden `sessionId`, auf den
  `entry.compactionCheckpoints[*].preCompaction.sessionId` verweist.
- Dieselbe SQLite-Transkriptzeilenmenge für jeden `sessionId`, auf den
  `entry.compactionCheckpoints[*].postCompaction.sessionId` verweist.
- Dieselbe SQLite-Transkriptzeilenmenge für jeden `sessionId` in
  `entry.usageFamilySessionIds`.

Archivieren Sie nur Zeilen, auf die weder eine verbleibende
`session_entries`-Zeile noch die Compaction- oder Nutzungsfamilienmetadaten eines verbleibenden Eintrags
verweisen. Dadurch bleiben der Zustand für Checkpoint-Verzweigungen/-Wiederherstellungen und Nutzungs-Rollups erhalten, bis
die letzte aktive Referenz entfernt wurde.

## Artefakte außerhalb der Familie nach der Umstellung

Generierte themenspezifische Transkriptdateivarianten und Trajektorien-Sidecars sind kein aktiver
SQLite-Laufzeitstatus. Sie sind veraltete Dateiartefakte:

- Themenvarianten wie `<sessionId>-topic-<thread>.jsonl` existieren nur für das
  dateibasierte Transkriptformat. SQLite verwendet die kanonische Sitzungs-ID sowie
  `session_routes`-/Eintragszustellungsmetadaten anstelle themenspezifischer JSONL-Dateien.
- Trajektorien-Sidecars wie `.trajectory.jsonl` und `.trajectory-path.json`
  werden anhand echter JSONL-`sessionFile`-Pfade benannt. SQLite-`sessionFile`-Werte sind
  `sqlite:<agentId>:<sessionId>:<storePath>`-Marker und bezeichnen keine Sidecar-
  Dateien.
- Leser der Archivierungsebene müssen weiterhin veraltete archivierte JSONL-Dateien lesen, aber
  die Laufzeitaufbewahrung darf weder Verzeichnisse aktiver Sitzungen durchsuchen noch JSONL-
  Transkriptdateien für SQLite-Sitzungen erneut öffnen.

Der Doctor-Import bleibt für die Migration veralteter primärer JSONL-Dateien und
ihrer angrenzenden Trajektorien-Sidecars zuständig. Die SQLite-Laufzeitaufbewahrung darf keinen
zweiten Importer oder Datei-Fallback hinzufügen.

## Änderungspunkte

Erweitern Sie die durch `clawdbot-d63.1` eingeführte SQLite-Archivierungshilfsfunktion, anstatt
einen parallelen Pfad hinzuzufügen.

1. Fügen Sie nahe `deleteSqliteSessionStateIfUnreferenced` einen lokalen Collector hinzu:
   - `collectSqliteSessionArtifactFamily(entry: SessionEntry): Set<string>`
   - Beziehen Sie `entry.sessionId`, die Sitzungs-IDs vor und nach dem Checkpoint sowie
     `usageFamilySessionIds` ein.
   - Filtern Sie leere Zeichenfolgen heraus und entfernen Sie Duplikate deterministisch.

2. Fügen Sie einen Referenz-Collector für den Store nach der Entfernung hinzu:
   - `readReferencedSqliteSessionArtifactFamilyIds(database): Set<string>`
   - Durchlaufen Sie die aktuellen `session_entries`, parsen Sie jeden `entry_json` und erfassen Sie
     dieselben Familien-IDs aus jedem verbleibenden Eintrag.

3. Ändern Sie die Aufrufer für Zurücksetzen, Löschen und Wartung, die derzeit einen
   entfernten `sessionId` archivieren, sodass sie die vollständige Familie des entfernten Eintrags übergeben.

4. Archivieren Sie für jede Familien-ID die SQLite-Transkriptzeilen mit dem vom Aufrufer angegebenen
   Grund (`reset` oder `deleted`) und löschen Sie anschließend die `sessions`-Zeile nur, wenn die
   Familien-ID nicht in der Referenzmenge nach der Entfernung enthalten ist.

5. Belassen Sie das Löschen von Transkriptereignissen zentral im vorhandenen SQLite-
   Bereinigungspfad für Sitzungszeilen. Fügen Sie keine aktiven JSONL-Lesevorgänge hinzu.

## Fokussierte Tests

Fügen Sie reine SQLite-Tests zu `src/config/sessions/session-accessor.conformance.test.ts`
oder nach dem Commit von `clawdbot-d63.1` zum benachbarten Lebenszyklustest hinzu:

- Beim Löschen eines Eintrags mit einem Transkript vor der Compaction werden sowohl die aktuelle
  Sitzung als auch die Sitzung vor der Compaction archiviert und anschließend beide SQLite-Zeilenmengen entfernt.
- Beim Löschen eines von zwei Einträgen, die sich eine Sitzung vor der Compaction teilen, wird
  nichts für die gemeinsam verwendete Sitzung vor der Compaction archiviert, bis der letzte referenzierende Eintrag
  entfernt wurde.
- Beim Löschen eines Eintrags mit `usageFamilySessionIds` werden die SQLite-
  Transkriptzeilen des Vorgängers archiviert, wenn kein anderer Eintrag auf diese Nutzungsfamilie verweist.
- Ein themenförmiger Sitzungsschlüssel mit einem SQLite-Marker verursacht weder das Lesen einer generierten
  themenspezifischen JSONL-Datei noch die Suche nach einem Sidecar.

Für den fokussierten Nachweis sollte Folgendes verwendet werden:

```bash
node scripts/run-vitest.mjs src/config/sessions/session-accessor.conformance.test.ts
```

Umfassende `pnpm`-Prüfungen sollten für diesen Codex-Worktree auf Crabbox/Testbox verbleiben.
