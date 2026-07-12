---
read_when:
    - Sie implementieren clawdbot-d63.2 / clawdbot-04b
    - Sie bearbeiten die SQLite-Sitzungsaufbewahrung, das Zurücksetzen, Löschen oder die Archivierung bei der Agentenlöschung
    - Sie müssen Artefaktfamilien aus der SQLite-Ära von veralteten JSONL-Sidecars unterscheiden
summary: Pfad-3-Plan zur Archivierung aller SQLite-Transkriptartefakte, die zu einer Sitzung gehören
title: 'Pfad 3: Familie der SQLite-Sitzungsartefakte'
x-i18n:
    generated_at: "2026-07-12T15:37:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: adb2c31293ab63cb80449d037600d78fbb228e91f380d1ccaf15fb00728a9057
    source_path: plan/path3-sqlite-session-artifact-family.md
    workflow: 16
---

# Pfad 3: Familie der SQLite-Sitzungsartefakte

Diese Notiz grenzt `clawdbot-d63.2` ab, während `clawdbot-d63.1` für die sich überschneidende
Hilfsfunktion zum Archivieren bei Zurücksetzen/Löschen in `src/config/sessions/session-accessor.sqlite.ts`
zuständig ist. Die Implementierungsdatei enthielt während dieses Durchlaufs nicht übernommene Änderungen, daher dokumentiert dieses Artefakt
den exakten Vertrag und die Änderungspunkte, ohne mit dem parallel arbeitenden Worker in Konflikt zu geraten.

## Maßgebliche Familie

Nach der Umstellung auf SQLite sind aktive Sitzungstranskripte SQLite-Zeilen. Die
Archivfamilie einer Sitzung umfasst:

- Die Zeilen in `transcript_events`, `transcript_event_identities` und `sessions`
  für die aktuelle `sessionId` des Eintrags.
- Dieselbe Menge von SQLite-Transkriptzeilen für jede `sessionId`, auf die
  `entry.compactionCheckpoints[*].preCompaction.sessionId` verweist.
- Dieselbe Menge von SQLite-Transkriptzeilen für jede `sessionId`, auf die
  `entry.compactionCheckpoints[*].postCompaction.sessionId` verweist.
- Dieselbe Menge von SQLite-Transkriptzeilen für jede `sessionId` in
  `entry.usageFamilySessionIds`.

Archivieren Sie nur Zeilen, auf die weder eine verbleibende
`session_entries`-Zeile noch die Compaction- oder Nutzungsfamilien-Metadaten
eines verbleibenden Eintrags verweisen. Dadurch bleiben der Verzweigungs-/Wiederherstellungszustand
von Prüfpunkten und der Nutzungsaggregationszustand erhalten, bis die
letzte aktive Referenz entfernt wurde.

## Artefakte außerhalb der Familie nach der Umstellung

Generierte Varianten von Themen-Transkriptdateien und Trajektorien-Sidecars sind kein aktiver
SQLite-Laufzeitzustand. Es handelt sich um Legacy-Dateiartefakte:

- Themenvarianten wie `<sessionId>-topic-<thread>.jsonl` existieren nur für das
  dateibasierte Transkriptformat. SQLite verwendet die kanonische Sitzungs-ID sowie
  `session_routes`/Zustellungsmetadaten des Eintrags anstelle themenspezifischer JSONL-Dateien.
- Trajektorien-Sidecars wie `.trajectory.jsonl` und `.trajectory-path.json`
  werden anhand tatsächlicher JSONL-`sessionFile`-Pfade benannt. SQLite-`sessionFile`-Werte sind
  `sqlite:<agentId>:<sessionId>:<storePath>`-Marker und benennen keine Sidecar-
  Dateien.
- Lesekomponenten der Archivebene müssen weiterhin archivierte Legacy-JSONL-Dateien lesen, aber
  die Laufzeitaufbewahrung darf weder aktive Sitzungsverzeichnisse durchsuchen noch JSONL-
  Transkriptdateien für SQLite-Sitzungen erneut öffnen.

Der Doctor-Import bleibt für die Migration von primären Legacy-JSONL-Dateien und
ihren angrenzenden Trajektorien-Sidecars zuständig. Die SQLite-Laufzeitaufbewahrung darf keinen
zweiten Importer oder Datei-Fallback hinzufügen.

## Änderungspunkte

Erweitern Sie die durch `clawdbot-d63.1` eingeführte SQLite-Archivhilfsfunktion, statt
einen parallelen Pfad hinzuzufügen.

1. Fügen Sie nahe `deleteSqliteSessionStateIfUnreferenced` einen lokalen Collector hinzu:
   - `collectSqliteSessionArtifactFamily(entry: SessionEntry): Set<string>`
   - Beziehen Sie `entry.sessionId`, die Sitzungs-IDs vor/nach den Prüfpunkten und
     `usageFamilySessionIds` ein.
   - Filtern Sie leere Zeichenfolgen und entfernen Sie Duplikate deterministisch.

2. Fügen Sie einen Referenz-Collector für den Store nach der Entfernung hinzu:
   - `readReferencedSqliteSessionArtifactFamilyIds(database): Set<string>`
   - Durchlaufen Sie die aktuellen `session_entries`, parsen Sie jeweils `entry_json` und erfassen Sie
     dieselben Familien-IDs aus jedem verbleibenden Eintrag.

3. Ändern Sie die Aufrufer für Zurücksetzen/Löschen/Wartung, die derzeit eine
   entfernte `sessionId` archivieren, sodass sie die vollständige Familie des entfernten Eintrags übergeben.

4. Archivieren Sie für jede Familien-ID die SQLite-Transkriptzeilen mit dem
   Grund des Aufrufers (`reset` oder `deleted`) und löschen Sie anschließend die `sessions`-Zeile nur, wenn die
   Familien-ID nicht in der Referenzmenge nach der Entfernung enthalten ist.

5. Halten Sie das Löschen von Transkriptereignissen über den vorhandenen SQLite-
   Bereinigungspfad für Sitzungszeilen zentralisiert. Fügen Sie keine aktiven JSONL-Lesezugriffe hinzu.

## Fokussierte Tests

Fügen Sie nach dem Commit von `clawdbot-d63.1` reine SQLite-Tests zu
`src/config/sessions/session-accessor.conformance.test.ts`
oder zum benachbarten Lebenszyklustest hinzu:

- Beim Löschen eines Eintrags mit einem Transkript vor der Compaction werden sowohl die aktuelle
  Sitzung als auch die Sitzung vor der Compaction archiviert und anschließend beide SQLite-Zeilenmengen entfernt.
- Beim Löschen eines von zwei Einträgen, die sich eine Sitzung vor der Compaction teilen, wird
  für die gemeinsam verwendete Sitzung vor der Compaction nichts archiviert, bis der letzte referenzierende Eintrag
  entfernt wurde.
- Beim Löschen eines Eintrags mit `usageFamilySessionIds` werden die SQLite-
  Transkriptzeilen des Vorgängers archiviert, wenn kein anderer Eintrag auf diese Nutzungsfamilie verweist.
- Ein themenförmiger Sitzungsschlüssel mit einem SQLite-Marker verursacht weder das Lesen einer generierten
  Themen-JSONL-Datei noch die Suche nach einem Sidecar.

Für den fokussierten Nachweis sollte Folgendes verwendet werden:

```bash
node scripts/run-vitest.mjs src/config/sessions/session-accessor.conformance.test.ts
```

Wenn sich die finalen Tests in `store.session-lifecycle-mutation.test.ts` befinden, führen Sie diese
Datei ausdrücklich mit demselben Wrapper aus. Umfassende `pnpm`-Prüfungen sollten für diesen
Codex-Worktree auf Crabbox/Testbox verbleiben.
