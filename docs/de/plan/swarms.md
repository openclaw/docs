---
x-i18n:
    generated_at: "2026-07-24T03:54:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 90c6c85a837448f4e5ceccdccf73489db801ad502cbbb2f3eb04d6aff7e902f0
    source_path: plan/swarms.md
    workflow: 16
---

# Swarms — Agent-Fan-out und Orchestrierung im Code-Modus

Status: Ausgeliefert — ersetzt durch `docs/tools/swarm.md`. Dieses Dokument bleibt als
Entwurfsprotokoll der Implementierung erhalten.

## 1. Was und warum

Ein **Swarm** besteht aus vielen Subagenten, die deterministisch von einem Skript im
Code-Modus orchestriert werden: N Leser per Fan-out starten, Erkenntnisse adversarial überprüfen,
durch einen zustandsbehafteten Priorisierer synthetisieren und Entscheidungsschranken in Schleifen
durchlaufen. Der Kontrollfluss (`Promise.all`,
`while`, `if`) _ist_ die Orchestrierung — bewusst gibt es **keine Graph-DSL,
keinen neuen Modus und keine neue Top-Level-Tool-Oberfläche**.

Der OpenClaw-Code-Modus (QuickJS-WASI, Snapshot/Fortsetzung, Bridge-Anfragen) bildet die
Grundlage. Ein geparkter Bridge-Aufruf übersteht einen VM-Snapshot und einen Gateway-Neustart
und wird exakt an der Stelle fortgesetzt, an der er angehalten wurde — stärker als Designs mit
Journal-Wiedergabe und ohne Determinismusanforderungen an Skripte.

Benennung: Der Name in Produkt und Dokumentation lautet **Swarm**. Code-Bezeichner bleiben unverändert:
`agents.*`-Gast-API, `tools.swarm`-Konfiguration, `swarm`-Gruppenspalten.

## 2. Entscheidungen (Maintainer, 2026-07-17)

- Kosten: erzwungene Konfigurationsobergrenzen; Token-Budget pro Swarm optional. Kein verpflichtendes Budget.
- Genehmigungen: Unterprozesse werden **geschlossen fehlschlagend / nicht interaktiv** ausgeführt. Aktionen,
  die eine Genehmigung erfordern, werden abgelehnt; die Ablehnung wird im Ergebnis des Unterprozesses
  gemeldet; das Skript entscheidet. Keine Flut von Bedienerabfragen durch Fan-out.
- v1 umfasst ausschließlich vom Modell geschriebene Ad-hoc-Skripte. Gespeicherte/benannte Workflows sowie
  CLI-/Cron-Einstieg: später (der Headless-Code-Modus ist für Cron bereits vorhanden).
- Identität des Unterprozesses: standardmäßig ein dedizierter Worker-Agent über die
  `tools.swarm.defaultAgentId`-Konfiguration (gegen die vorhandene Zulassungsliste für Subagent-Ziele validiert);
  `agentId`-Überschreibung pro Spawn. Der Core liefert keine gebündelte Agent-ID aus;
  die Dokumentation empfiehlt eine schlanke `worker`-Agent-Konfiguration.
- Keine Änderungen am Codex-Quellcode. Das Codex-Harness verwendet das Spawn-/Wait-Muster (§8).

## 3. Architekturübersicht

```
Skript im Code-Modus (QuickJS-VM, Gateway)       Codex-V8-Skript (Codex-Prozess)
  agents.run(...) ── geparkter Bridge-Aufruf       tools.sessions_spawn / tools.agents_wait
        │                                                │ Item-/Tool-/Aufruf-RPC (jeweils ≤600s)
        ▼                                                ▼
             CORE (Harness-unabhängig, dieses Repository)
  sessions_spawn {collect:true, outputSchema, fastMode, groupId}
  agents_wait {ids, timeoutSeconds}
        │
  Subagent-Registry (SQLite): Collector-Abschlussdatensätze, Swarm-Gruppen-ID
        │
  Unterprozesse = gewöhnliche Subagent-Sitzungen (Lane-begrenzt, Genehmigungen geschlossen fehlschlagend)
        │
  sessions.changed SSE ──► Punkte in Control UI / Seitenleiste / Kanalstatusmeldung
```

Ein kanonischer Eigentümer der Spawn-/Abschluss-/Erledigungssemantik (Core-Tools + Registry).
Zwei Await-Transporte: QuickJS parkt einen Bridge-Aufruf unbegrenzt (Snapshot);
Codex fragt `agents_wait` über begrenzte RPCs ab.

## 4. Konfigurationsschranke (v1)

Neu: `tools.swarm` (global + Überschreibung pro Agent, dasselbe Zusammenführungsmuster wie
`tools.codeMode`):

```jsonc
"tools": {
  "swarm": {
    "enabled": false,            // Hauptschranke, standardmäßig AUS
    "maxConcurrent": 8,          // gleichzeitig ausgeführte Unterprozesse (Swarm-Lane-Obergrenze)
    "maxChildrenPerGroup": 50,   // aktive Unterprozesse pro Swarm-Gruppe
    "maxTotalPerGroup": 200,     // lebenslange Spawn-Anzahl pro Gruppe (Sicherung gegen unkontrollierte Ausführung)
    "waitTimeoutSecondsMax": 600,
    "defaultAgentId": ""         // optional; Agent-ID des Unterprozesses, wenn agentId beim Spawn fehlt
  }
}
```

- Zod: Union `boolean | strict object` wie `CodeModeSchema`
  (`src/config/zod-schema.agent-runtime.ts`); `swarm: true` → `{enabled: true}`.
- Typen in `src/config/types.tools.ts` (sowohl pro Agent als auch Top-Level `tools`),
  Bezeichnungen in `schema.labels.ts`, Hilfe in `schema.help.runtime.ts`.
- Auflösungshelfer `resolveSwarmConfig(cfg, agentId)` analog zu
  `resolveCodeModeConfig` (`src/agents/code-mode.ts:215`), der alle Zahlen begrenzt.
- Auswirkungen bei deaktivierter Schranke: Das Tool `agents_wait` fehlt in Katalogen;
  die Parameter `collect`/`outputSchema`/`fastMode`/`groupId` für `sessions_spawn`
  werden mit einem eindeutigen Fehler abgelehnt, der den Konfigurationsschlüssel nennt. Keine weitere Verhaltensänderung.
- `defaultAgentId` wird über `resolveSubagentAllowedTargetIds`
  (`src/agents/subagent-target-policy.ts`) validiert; unbekannte ID → Spawn-Fehler, kein Fallback.

## 5. Core: Spawn im Collector-Modus + `agents_wait` (v1)

### 5.1 Ergänzungen für `sessions_spawn` (alle an aktivierten Swarm gekoppelt)

- `collect: boolean` — wenn wahr, wird die Ausführung des Unterprozesses mit
  `expectsCompletionMessage: false` und einem **Collector-Abschlussdatensatz**
  statt mit Ankündigungs-/Steuerungszustellung registriert. Das Tool gibt `{ runId, sessionKey }`
  sofort zurück. Keine Kanal-/Thread-Bindung.
- `outputSchema: object` — JSON Schema. Dem Unterprozess wird ein synthetisches
  `structured_output`-Tool zu seiner Tool-Oberfläche hinzugefügt; ein Zusatz zum System-Prompt
  weist ihn an, es genau einmal mit seinem Endergebnis aufzurufen. Bei einem Validierungsfehler
  erhält der Unterprozess einen einmaligen erneuten Hinweis; danach enthält der Abschlussdatensatz
  `structured: undefined` zusammen mit dem Rohtext und einem `schemaError`.
- `fastMode: true | "auto" | false` — wird neben Modell/Denken über
  `resolveSubagentModelAndThinkingPlan` (`src/agents/subagent-spawn-plan.ts`) in den Sitzungs-Patch des Unterprozesses
  übernommen, wobei die vorhandene `FastMode`-Achse
  (`src/shared/fast-mode.ts`) verwendet wird. Ausgelassen = erben.
- `groupId: string` — Stempel der Swarm-Gruppe. Standardwert:
  `swarm:<requesterSessionKey>:<runId-of-requesting-run>`. Wird im
  Registry-Datensatz und in der Sitzungszeile des Unterprozesses persistiert. Wird für Obergrenzen,
  Auflistung, Batch-Archivierung und die Punkte verwendet.
- `label: string` ist bereits vorhanden — wird in den Punkten und in `subagents list` angezeigt.
- Agent-ID des Unterprozesses: `params.agentId` → andernfalls `tools.swarm.defaultAgentId` → andernfalls
  anfordernder Agent (vorhandenes Verhalten).

### 5.2 Genehmigungen schlagen geschlossen fehl

Collector-Unterprozesse werden mit einem nicht interaktiven Genehmigungskontext ausgeführt: Jeder
Tool-Aufruf, der eine Genehmigung durch den Bediener erfordern würde, wird als strukturierte Ablehnung
(`approval_required`) aufgelöst, die für den Unterprozess sichtbar ist; von diesem wird erwartet, dass er
die Blockierung in seinem Ergebnis meldet. Implementierung: Die vorhandene Genehmigungsrichtlinien-
Infrastruktur für Exec/Tools wird mit einem erzwungenen `deny`-Resolver für Unterprozessausführungen
im Collector-Modus wiederverwendet. Von Collector-Unterprozessen werden keine Genehmigungsereignisse
an Bedieneroberflächen ausgegeben.

### 5.3 Tool `agents_wait` (neu, an Schranke gekoppelt)

```
agents_wait({ ids: string[], timeoutSeconds?: number })
→ {
    completed: [{ runId, status: "done"|"failed"|"killed"|"timeout",
                  result: string, structured?: unknown, schemaError?: string,
                  sessionKey, label?, usage?: {inputTokens, outputTokens} }],
    pending: string[]
  }
```

- Kehrt zurück, sobald **mindestens eine** ID abgeschlossen ist (Erstabschluss-/Race-
  Semantik, ermöglicht Pipelines), oder bei Zeitüberschreitung mit `completed: []`.
- `timeoutSeconds` standardmäßig 30, begrenzt auf `waitTimeoutSecondsMax`.
- Idempotent: Bereits abgeschlossene IDs geben ihre Datensätze erneut zurück (Datensätze
  bleiben bis zur Gruppenarchivierung erhalten). Unbekannte ID → Fehlereintrag pro ID, kein Throw.
- Eigentümerschaft: Nur die Sitzung, die eine Ausführung erzeugt hat (oder ihre Elternkette), darf
  darauf warten — dieselbe Eigentümerschaftsregel wie für `wait` im Code-Modus (`code-mode.ts:1684`).
- Registry: Abschlussdatensätze befinden sich im vorhandenen SQLite-Speicher der
  Subagent-Registry (`subagent-registry.store.sqlite.ts`) — neue Felder, kein neuer Speicher,
  keine Erhöhung der Schemaversion (nur additive Spalten; siehe Einschränkung in §9).

### 5.4 Durchsetzung der Obergrenzen

- `maxConcurrent`: Collector-Unterprozesse laufen auf der vorhandenen Subagent-Lane, werden
  jedoch pro Swarm-Gruppe gezählt; Spawns über der Obergrenze werden nach FIFO eingereiht (hostseitig im
  Spawn-Pfad — runId sofort zurückgeben, Ausführung beginnt, sobald ein Platz frei wird).
- `maxChildrenPerGroup` / `maxTotalPerGroup`: Spawn wird nach Überschreitung mit einem typisierten Fehler
  abgelehnt; der Fehlertext nennt den Konfigurationsschlüssel.
- Tiefe: Collector-Unterprozesse behalten die `DEFAULT_SUBAGENT_MAX_SPAWN_DEPTH`-Semantik bei
  (Unterprozesse sind Blätter, sofern Verschachtelung nicht ausdrücklich konfiguriert ist).

## 6. Testvertrag (v1, Lane A)

- Unit: Konfigurationsauflösung/-begrenzung; Ablehnungen durch die Schranke bei Deaktivierung;
  Standardbelegung von groupId; Durchsetzung der Obergrenzen (Einreihung + Ablehnung); Wait-Race-Semantik;
  Wait-Idempotenz; Ablehnung wegen Eigentümerschaft; Validierung strukturierter Ausgabe + erneuter Hinweis +
  schemaError-Pfad; Weitergabe von fastMode in den Sitzungs-Patch; Validierung von defaultAgentId.
- Integration (Vitest, simulierte Modelllaufzeit): 3 Collector-Unterprozesse erzeugen, in einer
  Schleife warten, Erstabschlussreihenfolge und abschließende Leerung prüfen; Simulation eines Gateway-Neustarts:
  Registry neu laden → Wait wird aus persistiertem Abschluss aufgelöst.
- Alle Tests zusammen mit `*.test.ts`; keine Live-Modellaufrufe.

## 7. QuickJS-Gastoberfläche (Lane B, nach dem Core)

- Gast-Globals werden in `CONTROLLER_SOURCE`
  (`src/agents/code-mode.worker.ts:190-374`) installiert, reservierte Namen werden in
  `code-mode-namespaces.ts` ergänzt:
  - `agents.run(prompt, opts) → Promise<result|structured>` — Komfortfunktion:
    Collector-Spawn + geparktes Await auf einer dedizierten Bridge-Methode (`agentWait`),
    die der Host beim Abschluss erledigt (kein Polling; Snapshot-sicher).
  - `agents.session(system, opts) → Promise<handle>`;
    `handle.send(input, opts) → Promise<...>`; `handle.close()`. (v1.1 —
    wird nach run() ausgeliefert; verwendet `mode:"session"` + Collector-Datensätze pro Turn.)
  - `phase(title)`, `log(message)` — Bridge-Benachrichtigungen ohne Rückmeldung →
    Swarm-Fortschrittsereignisse.
- Zu `CodeModeBridgeMethod` (`code-mode.ts:91`) hinzugefügte Bridge-Methoden:
  `agentSpawn`, `agentWait`, `swarmNote`. `agentSpawn`/`agentWait` sind
  **konstruktionsbedingt** wiedergabesicher: Der Idempotenzschlüssel `(codeModeRunId, bridgeId)`
  wird im Registry-Datensatz gespeichert; ein Neustart erledigt erneut aus persistierten Abschlüssen
  und erzeugt niemals doppelte Spawns.
- Ausstehende `agentWait`-Bridge-Aufrufe verlängern die Snapshot-TTL der Ausführung (die Menge
  ausstehender Agenten ist das Signal; kein Flag).
- Die virtuelle Datei `API.read("agents.d.ts")` dokumentiert die typisierte Oberfläche sowie die
  Fan-out-/Schranken-/Zyklusmuster (`createCodeModeApiVirtualFiles`,
  `code-mode-namespaces.ts:876`).

## 8. Projektion des Codex-Harness (spätere Lane)

- `sessions_spawn` (mit neuen Parametern) und `agents_wait` durchlaufen die
  vorhandene Bridge für dynamische Tools; innerhalb von Codex-Skripten im Code-Modus erscheinen sie automatisch
  als `tools.*` (verifiziert: `codex-rs/code-mode/src/runtime/globals.rs:14-65`,
  `codex-rs/core/src/tools/spec_plan.rs:448-507`).
- `agents_wait` erhält die lange Zeitüberschreitungsklasse für dynamische Tools (Obergrenze 600s;
  `extensions/codex/src/app-server/dynamic-tool-execution.ts:37-39`) und wird
  als zeitüberschreitungs-/wiedergabesicher gekennzeichnet.
- Gruppenschlüssel für Codex-Eltern: `swarm:<parentSessionKey>:<turnId>`.
- Codex-native `spawn_agent`-Subagenten bestehen parallel; ihre Task-Spiegelzeilen speisen
  dieselbe Fortschrittsoberfläche.

## 9. Persistenz und Aufbewahrung

- Keine neuen Speicher. Registry-Datensätze erweitern die vorhandenen SQLite-Tabellen der
  Subagent-Registry; Unterprozesse sind gewöhnliche `sessions`-Zeilen. Nur additive Spalten
  — **jede Änderung, die eine Erhöhung der SQLite-Schemaversion erfordert, benötigt zuerst
  die ausdrückliche Zustimmung eines Maintainers** (Repository-Richtlinie).
- Swarm-Gruppen-ID im Registry-Datensatz + Sitzungsmetadaten des Unterprozesses.
- Aufbewahrung: Abgeschlossene Collector-Datensätze bleiben bis zur **Gruppenarchivierung** erhalten:
  Wenn die übergeordnete Ausführung endet (oder die TTL abläuft), werden die Unterprozesse der Gruppe
  als Batch archiviert (die vorhandene `DEFAULT_SUBAGENT_ARCHIVE_AFTER_MINUTES`-Bereinigung wird
  für die gruppenweise Ausführung erweitert).

## 10. Fortschrittsoberfläche („die Punkte“) — spätere Lane

- Implizit, Harness-gesteuert. Abgeleitet aus vorhandener `sessions.changed`-SSE +
  Registry; Hinweise zu `phase`/`log` ergänzen die Semantik. Kein Agent-gesteuertes Rendering.
- Control UI: `swarm`-Renderer in der Workspace-Widget-Familie
  (`ui/src/lib/workspace/widgets/`) — nach Phase gruppiertes Punkteraster, Erzählerzeile,
  Status/Bezeichnung/Modell pro Punkt; Unterprozessbaum in der Seitenleiste unverändert.
- Kanäle: eine gedrosselte, bearbeitete Statusmeldung pro Gruppe (gemäß
  `docs/concepts/streaming.md`; niemals Meldungen pro Unterprozess).

## 11. Labs-Seite (Control UI, unabhängiger Ausführungspfad)

Settings → **Labs**: Schalter für experimentelle Funktionen, als erste Einträge **Code Mode**
und **Swarm**. Jede Zeile: Name, einzeilige Beschreibung, Dokumentationslink, über
den vorhandenen `config.patch`-RPC angebundener Schalter (RFC-7396-Merge-Patch —
`tools.codeMode.enabled` / `tools.swarm.enabled` setzen) sowie gegebenenfalls ein Hinweis
„Neustart erforderlich“. Auffindbar, wobei die Formulierung den experimentellen
Status klarstellt. i18n: alle Zeichenfolgen über die normale `en.ts`- und Sync-Pipeline.

## 12. Platzierung (später)

- `placement` bei der Erzeugung auswählen: `"local"` (Standard) | `"cloud:<profile>"` über
  die vorhandene Worker-Umgebungsweiterleitung (`sessions.dispatch`); gepoolte Platzierung
  später, falls SSH-Sandbox-Kindprozesse auf gemeinsam genutzten Boxen nicht ausreichen.
- Die Orchestrator-VM verbleibt stets auf dem Gateway; Settle/Dots/Budget sind
  unabhängig von der Platzierung.

## 13. Nicht-Ziele

- Keine Graph-DSL — der Kontrollfluss ist der Graph (bewusst so gestaltet und dokumentiert).
- Keine Änderungen am Codex-Quellcode; keine Wiederverwendung interner Komponenten des Codex-Code-Modus.
- Keine gespeicherten/benannten Workflows in v1; kein CLI-Einstiegspunkt.
- Keine Weiterleitung der Operatorgenehmigung pro untergeordnetem Prozess.
- Keine 1:1-Cloud-Bereitstellung im Fan-out-Maßstab.
- Keine Kompatibilitäts-Shims für den Dauerbetrieb; Swarm ist eine neue, durch ein Gate geschützte Oberfläche.

## 14. Implementierungsphasen / PR-Aufteilung

1. **Lane A (Kern)**: §4 Konfiguration + §5 Erzeugen/Warten/Obergrenzen/Genehmigungen + §6 Tests.
2. **Lane C (Labs-Seite)**: §11 — unabhängig, kann zuerst integriert werden.
3. **Lane B (QuickJS-Oberfläche)**: §7 — nachdem die Verträge aus A integriert wurden.
4. Dots-Renderer (§10), Codex-Projektion (§8), `agents.session` (§7 v1.1),
   Platzierung (§12), Überarbeitung der Benutzerdokumentation — Folge-PRs in dieser Reihenfolge.

Jeder PR: grüne CI, `$autoreview` sauber, standardmäßig durch ein Gate deaktiviert, main auslieferbar.
