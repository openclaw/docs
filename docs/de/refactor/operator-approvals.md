---
read_when:
    - Ändern des Genehmigungslebenszyklus, der Speicherung, des Protokolls oder der Autorisierung für exec oder Plugins
    - Hinzufügen von Genehmigungslinks oder nativen Genehmigungssteuerelementen zu einem Kanal
    - Genehmigungen von untergeordneten Sitzungen in übergeordneten oder Orchestratoransichten abbilden
summary: Konzept für dauerhafte, direkt verlinkbare Genehmigungen in Control UI, nativen Apps, Kanälen und übergeordneten Sitzungen
title: Operatorgenehmigungen über mehrere Oberflächen hinweg
x-i18n:
    generated_at: "2026-07-16T13:13:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9defdaada1911df1184f64429e1787c4881e735c433d6dbc30a5946e11cc7cce
    source_path: refactor/operator-approvals.md
    workflow: 16
---

# Betreiberfreigaben über mehrere Oberflächen hinweg

Dieser Entwurf verfolgt [#103505](https://github.com/openclaw/openclaw/issues/103505). Er ersetzt die prozesslokale Freigabeautorität durch einen einzigen, vom Gateway verwalteten und SQLite-gestützten Lebenszyklus. Jede vom Gateway verwaltete Freigabe für eine Ausführung oder ein Plugin/Tool erhält eine stabile ID, eine authentifizierte Control-UI-Route, eine atomare Auflösung nach dem Prinzip „die erste Antwort gewinnt“ sowie ausschließlich für Betreiber bestimmte Projektionen in die Sitzungsdatenströme ihrer Quell- und übergeordneten Sitzungen.

Inline-Aktionen und Deep Links bestehen nebeneinander. Es gibt keinen Umschalter für den Freigabemodus.

## Ziele

- Ein dauerhaftes Freigabeobjekt für Ausführungs- und Plugin/Tool-Sperren.
- Stabile `${controlUiBasePath}/approve/{approvalId}`-Route.
- Auflösung über jede autorisierte Control UI, native App oder Kanaloberfläche.
- Atomare Funktionsweise nach dem Prinzip „die erste Antwort gewinnt“ über gleichzeitig verwendete Oberflächen hinweg.
- Idempotente identische Wiederholungsversuche; widersprüchliche verspätete Antworten können die gewinnende Antwort nicht überschreiben.
- Zeitüberschreitungen, fehlerhafte vertrauenswürdige Entscheidungen, fehlende Routen, Abbruch und Neustart führen zu einer sicheren Ablehnung.
- Anforderungs- und Abschlussereignisse erreichen die Quellsitzung sowie alle relevanten übergeordneten bzw. Orchestrator-Verantwortlichen.
- Kanäle erhalten typisierte Freigabe- und Navigationsaktionen; Callback-Daten des Transports bleiben kanalprivat.
- Bestehende Gateway-Methoden für Ausführungen und Plugins bleiben kompatibel, während ihre Implementierungen in einem gemeinsamen Dienst zusammengeführt werden.

## Nichtziele

- Persistieren oder Fortsetzen der blockierten Tool-Ausführung selbst über einen Gateway-Neustart hinweg.
- Verwenden einer Freigabe-ID oder URL als Bearer-Anmeldedaten.
- Anhängen von Freigabeaufforderungen an für das Modell sichtbare Transkripte oder Aktivieren übergeordneter Agenten.
- Verlagern von Freigaberichtlinien, Produktbefehlen oder der Autorisierung von Prüfenden in Kanal-Plugins.
- Klonen des Freigabestatus pro Kanal, Gerät oder übergeordneter Instanz.
- Neugestalten von Ausführungs-Zulassungslisten, der Zusammensetzung von Plugin-Richtlinien oder der Persistenz von `allow-always`, außer soweit dies für eindeutige Abschlussresultate erforderlich ist.
- Remote-Zugänglichmachen einer eingebetteten TUI ohne Gateway in der ersten Ausbaustufe. Sie bleibt ausschließlich lokal und muss sicher ablehnen, wenn keine prüfende Person verfügbar ist.

## Ausgangsbasis vor der Einführung und Evidenzübersicht

Diese Tabelle dokumentiert den Implementierungsstand zum Zeitpunkt der Eröffnung von #103505. Die nachfolgenden Einführungsabschnitte behandeln die dauerhafte Registry, typisierte Aktionen, die Deep-Link-Seite und die auf dieser Ausgangsbasis aufbauenden Erweiterungen nativer Clients.

| Oberfläche        | Ausgangs-Einstiegspunkt und Verantwortlicher                                                                                                                    | Ausgangsverhalten und Lücke                                                                                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agentenausführung | `src/agents/bash-tools.exec-approval-request.ts`, `src/agents/bash-tools.exec-host-shared.ts`                                                                   | Die zweiphasige Registrierung von `exec.approval.*` verhindert eine frühe Race Condition bei `/approve`, aber eine Zeitüberschreitung kann über `askFallback` weiterhin zu einer Genehmigung führen. |
| Plugin-Tool-Sperre | `src/agents/agent-tools.before-tool-call.ts`                                                                                                                    | Fordert `plugin.approval.*` an; `timeoutBehavior: "allow"` kann eine zeitlich abgelaufene Sperre genehmigen. Der eingebettete Modus besitzt in `src/infra/embedded-plugin-approval-broker.ts` eine separate prozesslokale Autorität. |
| Plugin-Node-Sperre | `src/gateway/node-invoke-plugin-policy.ts`                                                                                                                      | Erstellt und sendet direkt über den Plugin-Manager und dupliziert dadurch einen Teil des Lebenszyklus der Servermethode.                                                                      |
| Gateway-Autorität | `src/gateway/server-aux-handlers.ts`, `src/gateway/exec-approval-manager.ts`, `src/gateway/server-methods/approval-shared.ts`                                   | Separate Ausführungs- und Plugin-Manager verwenden prozesslokale Maps. Abschlusseinträge bleiben 15 Sekunden erhalten. Das Prinzip „die erste Antwort gewinnt“ gilt nur innerhalb eines Prozesses. |
| Gateway-Protokoll | `packages/gateway-protocol/src/schema/exec-approvals.ts`, `packages/gateway-protocol/src/schema/plugin-approvals.ts`, `src/gateway/methods/core-descriptors.ts` | Für Ausführungen gibt es `get` nur für ausstehende Vorgänge; für Plugins gibt es kein `get`; für einen Deep Link existiert keine typunabhängige Abschlusssuche. |
| Zustellung        | `src/infra/exec-approval-channel-runtime.ts`, `src/infra/approval-native-runtime.ts`, `src/infra/approval-handler-runtime.ts`                                   | Unterstützt Ursprungsrouting, Direktnachrichten an Genehmigende, Wiedergabe ausstehender Vorgänge, native Handler und prozessinterne Abschlussbereinigung. Eine separate Folgeänderung ergänzt den dauerhaften Abgleich von Abschlüssen. |
| Portable Aktionen | `src/interactive/payload.ts`, `src/plugin-sdk/interactive-runtime.ts`, `src/plugin-sdk/approval-reply-runtime.ts`                                               | Freigabeschaltflächen sind Befehlsaktionen, die `/approve ...` enthalten; URL- und Web-App-Ziele sind nicht typisierte Schaltflächenfelder. |
| Telegram          | `extensions/telegram/src/approval-handler.runtime.ts`, `extensions/telegram/src/button-types.ts`                                                                | Der Renderer analysiert den Befehlstext, um die Freigabesemantik zu erkennen, bevor private Callback-Daten erzeugt werden.                                                                    |
| Control UI        | `ui/src/app/exec-approval.ts`, `ui/src/app/overlays.ts`, `ui/src/components/exec-approval.ts`                                                                   | Die Freigabeoberfläche ist ein globaler modaler Dialog. `ui/src/app-route-paths.ts` und `ui/src/app-routes.ts` verwenden exakte Routen und leiten unbekannte Pfade zu Chat um. |
| Sitzungsverantwortung | `src/agents/subagent-registry.types.ts`, `src/agents/subagent-registry-read.ts`, `src/config/sessions/types.ts`                                                 | Verantwortlichkeiten für Controller, Anfordernden, explizite übergeordnete Instanz und Legacy-Erzeugung sind vorhanden, Freigabeereignisse werden jedoch nicht in diese Sitzungsdatenströme projiziert. |
| Gemeinsamer Status | `src/state/openclaw-state-schema.sql`, `src/state/openclaw-state-db.ts`                                                                                         | Vorhandene unmittelbare Transaktionen und bedingte Kysely-Aktualisierungen unterstützen dauerhaftes Compare-and-Set in `state/openclaw.sqlite`. |

Zu den repräsentativen aktuellen Tests gehören `src/gateway/exec-approval-manager.test.ts`, `src/gateway/server-methods/approval-shared.test.ts`, `src/agents/bash-tools.exec-gateway-approval.e2e.test.ts`, `extensions/telegram/src/approval-handler.runtime.test.ts` und `ui/src/e2e/approval-flow.e2e.test.ts`.

Das Plugin-SDK bleibt die einzige Grenze für Kanäle und Plugins. Änderungen an Freigabelaufzeit und Darstellung müssen über die vorhandenen Unterpfade `src/plugin-sdk/approval-*.ts` und `src/plugin-sdk/interactive-runtime.ts` exportiert werden; Produktionscode von Plugins darf keine internen Gateway-Komponenten importieren.

## Vorbilder

Omnigent bietet hilfreiche UX- und Fehlersemantiken:

- [`approval.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/runtime/policies/approval.py) hält ASK an, wendet Zeitüberschreitungen pro Richtlinie an und behandelt ausschließlich eine exakte Annahme als Genehmigung.
- [`sessions.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/routes/sessions.py) enthält die serverseitige Sperre des nativen Testsystems sowie die Projektion von Anforderungen und Auflösungen auf übergeordnete Instanzen.
- [`ApprovePage.tsx`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/web/src/pages/ApprovePage.tsx) stellt die eigenständige mobile Freigabeseite bereit.

Die Aussage zur Speicherung darf nicht unkritisch übernommen werden. Der aktuell aktive ausstehende Status ist in [`_elicitation_registry.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/_elicitation_registry.py) prozesslokal, und die nicht verwendete Tabelle für ausstehende Vorgänge wird durch [`e3b1f2a4c9d7_drop_pending_tool_calls_table.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/db/migrations/versions/e3b1f2a4c9d7_drop_pending_tool_calls_table.py) entfernt. OpenClaw geht bewusst weiter: SQLite ist maßgeblich, und jeder Abschlussübergang ist ein Compare-and-Set der Datenbank.

## Architektur und Verantwortlichkeit

Das Gateway verwaltet den Lebenszyklus:

1. Ein Agent, Plugin-Hook oder eine Node-Richtlinie liefert eine typspezifische Anforderung und eine prozesslokale Ausführungsbindung.
2. Das Gateway validiert sie und erstellt eine bereinigte Projektion für Prüfende.
3. Der Freigabedienst berechnet die Zielgruppe aus Quelle und Verantwortlichen, fügt die kanonische Zeile ein und registriert anschließend den prozessinternen Wartemechanismus.
4. Nach dem dauerhaften Einfügen veröffentlicht das Gateway vorhandene Freigabeereignisse, Sitzungsprojektionen, Kanalbenachrichtigungen und native Push-Benachrichtigungen.
5. Jede Oberfläche löst über denselben Dienst auf.
6. Der Dienst schreibt einen Abschlussübergang fest, aktiviert den Laufzeit-Wartemechanismus und veröffentlicht Abschlussprojektionen.
7. Eine fehlgeschlagene Ereigniszustellung setzt die festgeschriebene Entscheidung niemals zurück; Clients stellen den Status über `approval.get` oder die Listenwiedergabe wieder her.

Verantwortungsgrenzen:

- `src/gateway/`: Freigabedienst, Autorisierung, RPC-Adapter, URL-Erstellung, Lebenszyklus des Wartemechanismus und Ereignisveröffentlichung.
- `src/state/`: gemeinsames Schema und generierte Kysely-Typen.
- `src/infra/`: bereinigte Freigabeansichtsmodelle und Erstellung portabler Darstellungen.
- `src/agents/`: fordert die zurückgegebene Entscheidung an, wartet darauf und wendet sie an; keine Persistenz.
- `src/channels/` und `extensions/*`: stellen typisierte Aktionen dar, autorisieren Kanalbenutzer, kodieren private Callbacks und aktualisieren zugestellte Steuerelemente.
- `src/plugin-sdk/`: ausschließlich öffentliche Freigabe- und Darstellungsverträge.
- `ui/`: eigenständige Seite und vorhandene Warteschlangen-/Modal-Clients.

Der prozessinterne Wartemechanismus dient der Benachrichtigung und ist keine Autorität. Die Registrierung fügt die Zeile ein und richtet den Wartemechanismus synchron ein, bevor die Anforderung veröffentlicht wird, sodass sich zwischen diesen Schritten keine Auflösung einschieben kann. Jeder spätere Auflöser schreibt die Entscheidung über SQLite fest, bevor dieser Wartemechanismus abgeschlossen wird.

## Persistenter Datensatz

Fügen Sie der gemeinsamen Statusdatenbank eine Tabelle `operator_approvals` hinzu.

| Spalte                                             | Zweck                                                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval_id`                                      | Global eindeutige kanonische ID. Bestehende Ausführungs-IDs und `plugin:`-IDs aus Gründen der Protokollkompatibilität beibehalten, aber die Art niemals aus dem Präfix ableiten.      |
| `resolution_ref`                                   | Eindeutiger vollständiger SHA-256-base64url-Lokator für Transport-Callbacks, die die kanonische ID nicht übertragen können. Er dient weder zur Autorisierung noch als öffentliche URL-ID. |
| `kind`                                             | Geschlossener `exec \| plugin`-Diskriminator.                                                                                                        |
| `status`                                           | Geschlossener `pending \| allowed \| denied \| expired \| cancelled`-Status.                                                                          |
| `presentation_json`                                | Validierte, nach Art gekennzeichnete Prüferprojektion. Unverarbeitete Laufzeitanforderungen, Befehlsbindungen und Callback-Nutzdaten bleiben prozesslokal.               |
| `source_agent_id`, `source_session_key`            | Quellidentität und Anker der Sitzungsprojektion. Der Sitzungsschlüssel ist dauerhaft, die rotierende Sitzungs-UUID dagegen nicht.                                          |
| `audience_session_keys_json`                       | Geordnetes, dedupliziertes JSON-Array, das durch die begrenzte Breitensuche der Eigentümerschaft erzeugt wird. Angeforderte und abschließende Ereignisse verwenden denselben Snapshot. |
| `requested_by_device_id`, `requested_by_client_id` | Dauerhafte Anforderer-/Audit-Metadaten. Die Verbindungs-ID verbleibt im Arbeitsspeicher und ist kein oberflächenübergreifender Principal.                                         |
| `reviewer_device_ids_json`                         | Optionale, explizit ausgewählte Prüfergeräte, die ausschließlich von der vertrauenswürdigen Genehmigungslaufzeit bereitgestellt werden.                                                  |
| `runtime_epoch`                                    | Prozessepoche, der die geparkte Ausführung gehört; wird verwendet, um verwaiste Zeilen nach einem Neustart abzubrechen.                                                     |
| `created_at_ms`, `expires_at_ms`, `updated_at_ms`  | Maßgebliche Zeitangaben.                                                                                                                         |
| `decision`                                         | Explizite Benutzerentscheidung, sofern eine vorliegt.                                                                                                       |
| `terminal_reason`                                  | Geschlossener Grund wie `user`, `timeout`, `malformed-verdict`, `no-route`, `run-aborted` oder `gateway-restart`.                                |
| `resolved_at_ms`, `resolver_kind`, `resolver_id`   | Gewinner- und Audit-Identität werden serverseitig aufbewahrt. Prüferprojektionen lassen unverarbeitete Resolver-Bezeichner weg.                                           |
| `consumed_at_ms`, `consumed_by`                    | Separater Wiederholungsschutz für `allow-once`; die Nutzung darf die aufgezeichnete Entscheidung nicht löschen.                                                       |

Erforderliche Indizes:

| Index                                      | Zweck                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| eindeutiger `(resolution_ref)`                  | Spaltenübergreifende Mehrdeutigkeit zwischen `approval_id` und `resolution_ref` beim Einfügen zurückweisen. |
| `(status, expires_at_ms)`                  | Ausstehende Genehmigungen finden und maßgebliche Fristen abgleichen.               |
| `(source_session_key, created_at_ms DESC)` | Kürzlich erteilte Genehmigungen für eine Quellsitzung erneut wiedergeben.                             |
| `(resolved_at_ms)`                         | Aufbewahrte abgeschlossene Genehmigungen gemäß der festen Aufbewahrungsrichtlinie bereinigen.  |

Zielgruppen-Arrays sind klein und begrenzt. Die nach Sitzung gefilterte Wiederholung wählt zunächst über Kysely sichtbare ausstehende Zeilen aus und dekodiert und filtert anschließend die begrenzten Zielgruppen-Arrays im Anwendungscode; sie verwendet weder Zeichenfolgenabgleich noch JSON-Abfragen mit unverarbeitetem SQL.

Abgeschlossene Zeilen werden 30 Tage lang aufbewahrt, entsprechend der Aufbewahrungsdauer für Metadaten-Audits in `src/audit/audit-event-store.ts`. Die Bereinigung ist eine feste Wartungsrichtlinie und keine neue Konfigurationsoberfläche. Die Datenbank ist privater lokaler Zustand der Steuerungsebene, aber Prüfer-APIs dürfen niemals die vollständige gespeicherte Anforderung oder Laufzeitbindung offenlegen.

## Zustandsautomat und Compare-and-Set

Nur diese Übergänge sind gültig:

- `pending -> allowed`: explizites `allow-once` oder `allow-always`.
- `pending -> denied`: explizite Ablehnung, vertrauenswürdiges fehlerhaftes abschließendes Urteil oder kein Zustellweg.
- `pending -> expired`: maßgebliche Frist erreicht.
- `pending -> cancelled`: Ausführungsabbruch, ordnungsgemäßes Herunterfahren oder Wiederherstellung verwaister Einträge nach einem Neustart.

Jeder nicht zulässige Endzustand hat als effektives Urteil „Ablehnen“.

Die Auflösung verwendet eine einzelne unmittelbare SQLite-Transaktion und eine bedingte Kysely-Aktualisierung entsprechend:

```sql
UPDATE operator_approvals
SET status = ?, decision = ?, terminal_reason = ?, resolved_at_ms = ?
WHERE approval_id = ?
  AND status = 'pending'
  AND expires_at_ms > ?;
```

Wenn die Aktualisierung keine Zeile betrifft, liest dieselbe Transaktion den Datensatz:

- Fehlend oder nicht autorisiert: „Nicht gefunden“ zurückgeben; Existenz nicht offenlegen.
- Noch ausstehend, aber Frist erreicht: per Compare-and-Set auf `expired` setzen und anschließend diese abgeschlossene Zeile zurückgeben.
- Dieselbe aufgezeichnete Entscheidung: idempotenten Erfolg mit dem aufgezeichneten Gewinner zurückgeben.
- Abweichende Entscheidung: Die einheitliche API gibt `applied: false` mit dem aufgezeichneten Gewinner zurück; Legacy-Adapter behalten `APPROVAL_ALREADY_RESOLVED` bei, sofern ihr ausgelieferter Vertrag dies erfordert.
- Jeder abgeschlossene Zustand: niemals verändern.

`now == expires_at_ms` ist abgelaufen. Die Gateway-Zeit ist maßgeblich.

Die Ausführung von `allow-once` verwendet ein zweites CAS über `consumed_at_ms IS NULL`, das an den bestehenden exakten Befehls-/Systemausführungskontext gebunden ist. Die Genehmigungszeile bleibt nach der Nutzung als Audit-Datensatz erhalten.

Fehlerhafte HTTP-/RPC-Eingaben, die nicht authentifiziert werden können oder keine Genehmigung identifizieren, werden ohne Änderung zurückgewiesen und können niemals eine Genehmigung erteilen. Ein fehlerhaftes abschließendes Urteil, das von einem vertrauenswürdigen Harness/Waiter für eine bekannte Genehmigung empfangen wird, führt zum Übergang auf `denied`.

## Gateway-API

Artenunabhängige Prüfermethoden hinzufügen:

| Methode                                    | Vertrag                                                                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval.get { id }`                     | Gibt eine sichtbare ausstehende oder aufbewahrte abgeschlossene Projektion zurück.                                                                                                                                                          |
| `approval.resolve { id, kind, decision }` | Akzeptiert die kanonische ID oder eine Transportreferenz fester Größe und führt anschließend Autorisierung, Validierung der Art und der zulässigen Entscheidung, Fristabgleich und abschließendes CAS aus. Die Antwort enthält stets die kanonische ID. |

Nach einem erfolgreichen CAS die bestätigte Projektion sofort zurückgeben. Legacy-Ereignisse, Kanalweiterleitungen und Push-Abschlussoperationen sind nachgelagerte Best-Effort-Schritte; eine langsame oder fehlgeschlagene Oberfläche darf die erfolgreiche Antwort weder verzögern noch zurückrollen.

Die artspezifische Anforderungsvalidierung verbleibt in `exec.approval.request` und `plugin.approval.request`. Bestehende `exec.approval.get/list/waitDecision/resolve` und `plugin.approval.list/waitDecision/resolve` werden zu Protokollgrenzen-Adaptern für den kanonischen Dienst, da sie ausgelieferte Gateway-API sind. Interne Aufrufer werden mit derselben Änderung auf den Dienst migriert.

Eine Prüferprojektion ist eine gekennzeichnete Union:

```ts
type OperatorApproval = {
  id: string;
  status: OperatorApprovalStatus;
  presentation:
    | { kind: "exec"; commandText: string /* sichere Ausführungsvorschau */ }
    | { kind: "plugin"; title: string; description: string /* sichere Plugin-Vorschau */ };
  // gemeinsame Lebenszyklusfelder
};
```

Der stabile Pfad wird abgeleitet und nicht persistiert. `approval.get` gibt `urlPath` zurück; Oberflächen, denen ein genehmigter öffentlicher Ursprung bekannt ist, können zusätzlich ein absolutes `url` erhalten. Prüfer-Snapshots lassen Quell- und Zielgruppensitzungsschlüssel weg. Das Gateway hält diese Routing-Schlüssel serverseitig für die separate `session.approval`-Projektion vor.

## Ereignisse und portable Aktionen

PR 1 bewahrt die ausgelieferten Ereignisnamen, Nutzdaten und bestehenden empfängerbezogenen Filter auf Datensatzebene:

- `exec.approval.requested`
- `exec.approval.resolved`
- `plugin.approval.requested`
- `plugin.approval.resolved`

Diese Legacy-Ereignisse können die vollständige Laufzeitanforderung enthalten und dürfen daher nicht an jeden genehmigungsbezogenen Client verteilt werden. PR 5 fügt gekennzeichnete Lebenszyklusfelder (`status`, `sourceSessionKey`, `urlPath`, Abschlussmetadaten und ein `kind` auf Präsentationsebene) über die bereinigte Lebenszyklusprojektion hinzu, anstatt die Zustellung von Legacy-Ereignissen auszuweiten.

Ein genehmigungsbezogenes `session.approval`-Projektionsereignis hinzufügen. Das kanonische Ereignis einmal mit den persistierten Zielgruppenschlüsseln veröffentlichen; Abonnenten einer exakten Sitzung erhalten dasselbe Ereignis für jeden übereinstimmenden Schlüssel:

- `sessionKey`: Stream, der die Projektion empfängt.
- `sourceSessionKey`: untergeordnete Instanz/Quelle, die die Sperre ausgelöst hat.
- `phase`: `pending \| terminal`, differenziert nach dem Genehmigungsstatus.
- eine sichere `OperatorApproval`-Projektion.

Clients aktivieren dies mit `sessions.messages.subscribe { key, agentId?, includeApprovals: true }`. Die erfolgreiche Antwort fügt ein `approvalReplay` hinzu, das bis zu 1.000 derzeit ausstehende Genehmigungen für genau diesen Stream-Schlüssel enthält, zu deren Prüfung der abonnierende Client auch auf Datensatzebene autorisiert ist. `truncated: false` macht die gefilterte Wiederholung maßgeblich, und Clients, die die Verbindung wiederherstellen, ersetzen damit ihre lokale Menge ausstehender Einträge; `truncated: true` ist ein Überlastungssignal, und Clients müssen ungesehene lokale Einträge beibehalten, bis die kanonische Suche oder spätere Lebenszyklusereignisse sie klären. Eine spätere dauerhafte Zeitüberschreitung, die während der Wiederholung erkannt wird, sendet abschließende Tombstones ausschließlich an abonnierte, auf Datensatzebene autorisierte Zielgruppen, bevor der neue Snapshot zurückgegeben wird. `operator.admin` kann dies direkt aktivieren; Clients mit engerem Umfang benötigen sowohl eine gekoppelte Geräteidentität als auch `operator.approvals`. Ein Sitzungsabonnement allein gewährt niemals Einsicht in Genehmigungen.

Das Ereignis unter `operator.approvals` in `src/gateway/server-broadcast.ts` registrieren. Die Projektion dient ausschließlich der Beobachtung: Sie hängt niemals Transkriptzeilen an, gibt kein `sessions.changed` aus und weckt keinen Agenten.

`MessagePresentationAction` in `src/interactive/payload.ts` erweitern:

```ts
type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: ExecApprovalDecision;
    }
  | { type: "url"; url: string }
  | { type: "web-app"; url: string };
```

Core erstellt typisierte Entscheidungsaktionen und einen separaten Review-Link, wenn ein genehmigter absoluter Ursprung der Control UI verfügbar ist. Kanäle codieren eine Genehmigungsaktion in ihr eigenes Callback-Format und senden die Entscheidung an den kanonischen Dienst. Ein Callback verwendet die exakte kanonische ID, wenn sie passt; andernfalls verwendet er den eindeutigen vollständigen Digest `resolution_ref` der Zeile. Die Referenz ist nur ein kompakter Suchschlüssel: Die normale Gateway-Authentifizierung, Datensatzautorisierung, explizite Art, Validierung zulässiger Entscheidungen, Fristabgleich und CAS nach dem Prinzip „erste Antwort gewinnt“ gelten weiterhin. Kanäle dürfen IDs nicht kürzen, Hash-Präfixe nicht auflösen, `/approve`-Text nicht parsen und die Art nicht aus einem ID-Präfix ableiten.

Behalten Sie `button.url`, `button.webApp` und befehlsbasierte Genehmigungssteuerelemente als veraltete Kompatibilitätseingaben des Plugin SDK bei. Normalisieren Sie sie an der SDK-Grenze; migrieren Sie jeden gebündelten internen Aufrufer im selben PR. `/approve {id} {decision}` bleibt ein Text-Fallback und CLI-/Chat-Befehl, nicht der semantische Vertrag für Schaltflächen.

## Control UI

Die Route lautet `${basePath}/approve/{approvalId}`. Die ID ist der einzige Pfadparameter; die Identität der Quellsitzung stammt aus dem Datensatz.

Da der aktuelle Router exakte statische Routen besitzt und unbekannte Pfade auf Chat umschreibt, muss dieser Deep Link in `ui/src/app/bootstrap.ts` vor der normalen Routennormalisierung erkannt werden. Verwenden Sie die normale Gateway-/Authentifizierungseinrichtung wieder, rendern Sie jedoch eine eigenständige Genehmigungsseite außerhalb der Seitenleisten-Shell und des globalen Modals.

Das Dokument gehört dem Gateway, das seine URL ausgeliefert hat. Seine anfängliche Verbindung ignoriert die persistierte Auswahl des entfernten Gateways der vollständigen App, ohne die Einstellungen dieser Auswahl zu ändern oder zu kopieren; lediglich die Authentifizierung bleibt auf die Sitzung des ausliefernden Gateways beschränkt. Vertrauenswürdige native Authentifizierung oder eine separat bestätigte `gatewayUrl`-Überschreibung darf das Ziel ändern. Der Core reserviert den einsegmentigen Namensraum `/approve` vor Plugin-HTTP-Routen und der Erkennung statischer Erweiterungen, einschließlich IDs, die auf `.json` oder `.js` enden; wenn die Bereitstellung der Control UI deaktiviert ist, schlägt die reservierte Route geschlossen mit `404` fehl. Lassen Sie die Seite im Haupt-Bundle der Control UI, damit ein fehlgeschlagener Lazy-Chunk eine Sicherheitsentscheidung nicht dauerhaft bei einer Ladeanzeige stranden lässt.

Seitenzustände:

- wird geladen
- Authentifizierung erforderlich
- ausstehend
- wird entschieden
- hier genehmigt oder abgelehnt
- anderswo entschieden
- abgelaufen
- abgebrochen
- verboten/nicht gefunden
- Verbindungsfehler mit Wiederholung

Die Seite ruft Gateway-RPC auf, keine zweite nicht authentifizierte REST-API. Beim Aktualisieren des Browsers wird der dauerhafte Zustand erneut gelesen. Gateway-Anmeldedaten werden niemals in URL, Abfrage oder Fragment eingefügt.

## Autorisierung und Datenschutz

Die URL ist ein Ortungsbezeichner, keine Berechtigung. Eine Entscheidung erfordert:

1. authentifizierte Gateway-Verbindung;
2. `operator.approvals` oder `operator.admin`;
3. Autorisierung des Prüfers auf Datensatzebene.

Regeln auf Datensatzebene:

- `operator.admin` darf prüfen.
- `reviewer_device_ids` ist maßgeblich, wenn vorhanden. Nur ein aufgeführtes gekoppeltes
  `operator.approvals`-Gerät darf prüfen; das anfordernde Gerät hat keinen impliziten
  Zugriff, sofern es nicht ebenfalls aufgeführt ist.
- Ohne eine explizite Prüferliste darf das anfordernde gekoppelte
  `operator.approvals`-Gerät seinen eigenen Datensatz prüfen.
- Tatsächlich veraltete Datensätze ohne Bindung an Anforderer oder Prüfer behalten eine breite
  Sichtbarkeit für gekoppelte Geräte, damit Upgrades bereits ausstehende Arbeit nicht blockieren.
- Interne Laufzeiten ohne Gerät dürfen über die bereichsbeschränkte
  Genehmigungslaufzeit-Verbindung entscheiden, jedoch nicht lesen. Diese Berechtigung stammt ausschließlich aus dem
  serverseitig authentifizierten Laufzeittoken; öffentliche `approval.resolve`-Felder können
  sie nicht erzeugen.
- Die Eigentümerschaft einer aktiven Anfordererverbindung bleibt für veraltete Adapter gültig; sie wird
  niemals aus einem übereinstimmenden Clientnamen abgeleitet.
- Die Zielgruppenzugehörigkeit ändert nur die Darstellung. Sie erweitert niemals die Autorisierung.

`approval.get` stellt nur die bereinigte Prüferprojektion bereit und lässt interne Routing-Schlüssel für Quelle und Zielgruppe aus. Das PR-5-Ereignis `session.approval` enthält sein einziges Ziel `sessionKey` sowie `sourceSessionKey`, nachdem das Gateway den persistierten Zielgruppen-Snapshot serverseitig angewendet hat. Bestehende Exec-/Plugin-Ereignisse behalten ihre historischen Nutzdaten und eingeschränkten Empfänger, bis die Verbraucher migriert sind. Die ausführbare Anfrage, Befehlsbindung und Fortsetzung verbleiben ausschließlich im prozesslokalen Wartenden. Die dauerhafte Zeile enthält die sichere Darstellung sowie Lebenszyklus-, Routing- und Audit-Metadaten; sie speichert niemals rohe Umgebungswerte, Anmeldedaten, Authentifizierungsheader oder Kanal-Callback-Daten.

## Zielgruppenprojektion

Berechnen Sie die Zielgruppe einmal vor dem Einfügen und persistieren Sie den geordneten Snapshot. Eigentümerschaft ist ein Graph und nicht immer eine einzelne übergeordnete Kette: Ein untergeordnetes Element kann sowohl einen aktuellen Controller als auch einen ursprünglichen Anforderer besitzen, und diese Eigentümer können zu unterschiedlichen Wurzeln führen.

Verwenden Sie eine deterministische Breitensuche:

1. Initialisieren Sie die Warteschlange mit dem Schlüssel der Quellsitzung.
2. Lesen Sie für jeden aus der Warteschlange entnommenen Schlüssel die neueste Zeile der Subagenten-Registry und stellen Sie beide unterschiedlichen Eigentumskanten in fester Reihenfolge in die Warteschlange: `controllerSessionKey`, dann `requesterSessionKey`.
3. Wenn eine verwendbare Registry-Zeile vorhanden ist, folgen Sie nicht zusätzlich der Abstammung des Sitzungseintrags, die nach einer Steuerungsänderung veraltet sein kann. Stellen Sie andernfalls die einzelne aktuelle Fallback-Kante `parentSessionKey ?? spawnedBy` in die Warteschlange.
4. Normalisieren und deduplizieren Sie beim Einreihen, sodass der erste, kürzeste Pfad gewinnt.
5. Beenden Sie bei 64 eindeutigen Schlüsseln; diese Obergrenze der Zielgruppengröße begrenzt zugleich die Traversierungstiefe.

Die Registry-Quelle ist `src/agents/subagent-registry-read.ts`; Eigentumsfelder sind in `src/agents/subagent-registry.types.ts` definiert. Sitzungs-Fallback-Felder sind in `src/config/sessions/types.ts` definiert.

Anfrage- und Abschlussprojektionen verwenden dieselbe persistierte Zielgruppe, selbst wenn sich Fokus-/Controller-Eigentümerschaft ändert, während die Genehmigung aussteht. Dies gewährleistet die abschließende Bereinigung für jeden Zielgruppen-Sitzungsstream, der die Anfrageprojektion empfangen hat. Eine Entscheidung zielt immer auf die ID der Quellgenehmigung; Zielgruppensitzungen erhalten niemals einen geklonten Genehmigungszustand. Die Bereinigung weitergeleiteter Kanalnachrichten bleibt die nachfolgend beschriebene separate Folgeaktion für den Auslieferungsbezeichner.

Schreiben Sie nicht allein wegen einer Genehmigung Transkriptnachrichten, injizieren Sie keine System-Prompts, starten Sie keine Eigentümer-Turns und emittieren Sie kein `sessions.changed`.

## Konvergenz ausgelieferter Oberflächen

Native Genehmigungshandler bewahren ihre ausgelieferten Nachrichteneinträge bereits lange genug auf, um aktive Steuerelemente zu ersetzen oder zurückzuziehen. Generische weitergeleitete Genehmigungsnachrichten verwerfen derzeit `MessageReceipt`, sodass eine Entscheidung auf einer anderen Oberfläche ihre alten Steuerelemente weiterhin als ausstehend erscheinen lassen kann. Eine separate Folgeaktion schließt diese Lücke mit einer untergeordneten Tabelle `operator_approval_deliveries` in der gemeinsamen Zustandsdatenbank.

Jede Zeile speichert die Genehmigungs-ID, eine eindeutige Auslieferungs-ID, Kanal/Konto/exakte Route, einen größenbeschränkten und JSON-validierten kanalprivaten Nachrichtenbezeichner, Auslieferungszeitstempel und den Abschlusszustand. Sie speichert niemals Callback-Daten, Entscheidungstoken oder rohe Genehmigungsanfragen. Der Kanal ist für die Codierung des Bezeichners und die Mutation der Nachricht zuständig; der Core ist für den kanonischen Status, die Zielauswahl, die Wiederholungsrichtlinie und den Fallback-Abschlusstext zuständig.

Auslieferungsregistrierung und abschließende Entscheidung sind sicher gegenüber Race Conditions:

1. Nachdem das Senden einer ausstehenden Nachricht seinen Beleg zurückgegeben hat, fügen Sie den Auslieferungsbezeichner ein und lesen Sie den Status der übergeordneten Genehmigung in einer Transaktion.
2. Wenn das übergeordnete Element bereits abgeschlossen ist, planen Sie eine sofortige Finalisierung, statt die verspätete Auslieferung ausstehend zu lassen.
3. Jeder übertragene Abschlussübergang plant separat alle noch nicht finalisierten Auslieferungszeilen ein; verwerfbare Broadcasts sind nicht der Auslöser.
4. Ein Kanal-Finalisierer meldet `replaced`, `retired` oder `unsupported`. „Ersetzt“ unterdrückt eine doppelte Abschlussnachricht; „zurückgezogen“ sendet die vorhandene Abschluss-Folgenachricht; „nicht unterstützt“ oder ein Fehler greift auf den Fallback zurück, ohne das Genehmigungs-CAS zurückzusetzen.
5. Beim Start werden abgeschlossene Genehmigungen mit unvollständigen Auslieferungen erneut versucht, wodurch die Bereinigung einen Gateway-Neustart übersteht.

Dieser Transportlebenszyklus ist ein optionaler Hook des Auslieferungsadapters, kein Renderer und keine modellseitige Nachrichtenaktion. QQ-C2C-/Gruppennachrichten verfügen derzeit über keine API zum Bearbeiten, Löschen oder Leeren der Tastatur; dieser Adapter bleibt nicht unterstützt und kann erst nach einem späteren Klick die kanonische Wahrheit anzeigen, bis der Transport eine Mutations-API erhält.

## Semantik von Neustart, Zeitüberschreitung und Route

SQLite-Persistenz impliziert keine Wiederaufnahme der Ausführung. Befehls-/Tool-Bindungen verbleiben im Arbeitsspeicher, da sie sicherheitsrelevante Laufzeitfakten enthalten können und keinen Vertrag für wiederaufnehmbare Jobs darstellen.

Beim Start des Gateways:

- eine neue Laufzeitepoche erzeugen;
- ausstehende Zeilen aus älteren Epochen atomar in `cancelled` mit dem Grund `gateway-restart` überführen;
- Zeilen beibehalten, damit ihre URLs erklären, was geschehen ist;
- eine spätere Genehmigung niemals ohne vorhandene Laufzeitbindung ausführen.

Timer sind Optimierungen zum Aufwecken. Die maßgebliche Frist wird in `expires_at_ms` gespeichert; Lese-, Warte- und Entscheidungsvorgänge führen sämtlich einen Ablaufabgleich durch.

Endgültiges striktes Verhalten:

- Zeitüberschreitung -> `expired`, ablehnen;
- keine Route -> `denied`, ablehnen;
- Laufabbruch -> `cancelled`, ablehnen;
- fehlerhaftes vertrauenswürdiges Urteil -> `denied`, ablehnen;
- nur eine zulässige explizite Erlaubnisentscheidung -> `allowed`.

Das derzeit ausgelieferte Exec-Verhalten steht weiterhin im Widerspruch zu diesem Vertrag:

- `src/agents/bash-tools.exec-host-shared.ts` kann `askFallback` anwenden.
- `docs/tools/exec-approvals.md` und `docs/cli/approvals.md` dokumentieren diese Oberfläche.

Plugin-Genehmigungen schlagen bei Zeitüberschreitungen und fehlerhaften Urteilen nun geschlossen fehl; das veraltete
Feld `timeoutBehavior` wird weiterhin akzeptiert, aber ignoriert. Die Folgeänderung
für die strikte Exec-Semantik muss Code, Typen, Dokumentation, Tests und Changelog gemeinsam aktualisieren, mit
expliziter Prüfung durch Eigentümer und Sicherheitsteam. `askFallback` darf während
der Migration weiterhin die Richtlinienauswahl vor dem Gate beschreiben, darf jedoch die Zeitüberschreitung eines erstellten
ausstehenden Datensatzes nicht in eine Genehmigung umwandeln.

## Kompatibilitätsplan

- Additives Gateway-Protokoll; keine Erhöhung der Protokollversion.
- Bestehende Exec-/Plugin-Methoden und -Ereignisse an der externen Grenze beibehalten.
- Bestehende IDs einschließlich `plugin:`-Präfixen beibehalten, Präfixe jedoch nicht mehr als Typinformationen verwenden.
- Das Verhalten des Textbefehls `/approve` beibehalten.
- Veraltete URL-/Web-App-Felder für Schaltflächen und Befehlsaktionen als Kompatibilitätseingaben des Plugin SDK beibehalten; neue Core-Ausgaben sind typisiert.
- Alle gebündelten Kanäle und internen Aufrufer in derselben Änderung für typisierte Aktionen migrieren.
- Einen Changelog-Eintrag für die neue URL/Seite und für die spätere Änderung des Zeitüberschreitungsverhaltens hinzufügen.
- Keine Einstellung für den Elicitationsmodus hinzufügen.

## Einführung

### PR 1: dauerhafter Lebenszyklus

- Dieser Designhinweis.
- Gemeinsames SQLite-Schema, Kysely-Generierung, Speicher und 30-tägige Bereinigung.
- Gateway-Genehmigungsdienst, Laufzeit-Waiter-Bridge und Behandlung verwaister Einträge nach Neustarts.
- Vereinheitlichtes `approval.get/resolve`.
- Exec-/Plugin-Methodenadapter.
- Tests für „erste Antwort gewinnt“, Idempotenz, Ablauf, Autorisierung und Verbrauch.
- Noch keine Änderung des UI- oder Kanalverhaltens.

### PR 2: typisierte Aktionen und Kanal-Callbacks

- Typisierte Genehmigungs-, URL- und Web-App-Aktionen.
- Zentrale Präsentations-Builder und Plugin-SDK-Exporte.
- Transportprivate Callback-Codierung mit expliziter Eigentümerart.
- Dauerhafte Callback-Referenzen fester Größe für kanonische IDs, die Transportlimits überschreiten.
- Migration gebündelter Kanäle weg von der Ableitung aus Befehlstext und Genehmigungs-ID.
- Kanonische Wahrheit der ersten Antwort auf der angeklickten Oberfläche und nach bestem Bemühen ausgeführte terminale Aktualisierungen aktiver nativer Oberflächen; die dauerhafte Terminalisierung von Kanalnachrichten bleibt eine Folgeaufgabe.
- SDK- und Tests für gebündelte Kanäle.

### PR 3: Deep Link der Control UI

- Eigenständige authentifizierte Genehmigungsseite und Basispfad-berücksichtigendes Start-Routing.
- Bindung an den bereitstellenden Gateway, ohne die gespeicherte Remote-Auswahl des Betreibers zu verändern.
- Vom Core verwalteter Genehmigungs-HTTP-Namensraum einschließlich Asset-ähnlicher IDs.
- Vom Gateway erstellte URL-Nutzlast und Abfrage des ausstehenden Status, bis Lebenszyklusereignisse bereitgestellt werden.
- Nachweise für mobile Breite, Wiederverbindung, konkurrierende Antworten, Neuladen und eingebundenen Pfad.

### PR 4: Native Clients

- iOS- und Android-Prüfoberflächen verwenden das artbezogene `approval.get/resolve`; watchOS leitet prüfersichere Aufforderungen und Entscheidungen über das gekoppelte iPhone weiter.
- Die Watch bietet die Ausführungsentscheidungen, die ihr kompakter Weiterleitungsvertrag unterstützt: einmal zulassen und ablehnen.
- Die kanonische terminale Wahrheit der ersten Antwort ersetzt den lokalen Status des versuchten Entscheids.
- Verlorene oder mehrdeutige Auflösungsbestätigungen sperren die Steuerelemente bis zum kanonischen Rücklesen.
- Zuvor veröffentlichte Gateway-v4-Instanzen behalten die Ausführungsprüfung über einen eng begrenzten Fallback auf die Legacy-Methode bei; ein über Oberflächen hinweg beibehaltener terminaler Status erfordert die vereinheitlichten Methoden.
- Warnungen für Prüfer und Eigentümerkontext bleiben auf iPhone, Watch und Android sichtbar.
- Native Unit-, Build- und Plattformnachweise.

### PR 5: Weitergabe des Lebenszyklus an Vorfahren

- `session.approval` Zustellung des ausstehenden/terminalen Status aus dem in PR 1 persistierten Zielgruppen-Snapshot.
- Abonnement der exakten Sitzung, Wiedergabe nach Wiederverbindung und terminale Tombstones ohne Transkriptmutation oder Aktivierung des Agenten.
- Lebenszyklus-Callbacks werden nach dauerhaftem Einfügen/CAS ausgeführt und werden niemals zur Genehmigungsautorität.
- Nachweise für verschachtelte Subagenten und Wiederverbindungen.

### PR 6: Fail-Closed-Verhalten

- `node-invoke-plugin-policy.ts` und den eingebetteten Plugin-Broker von doppelter Autorität wegmigrieren.
- Strikte Semantik für Zeitüberschreitungen, fehlerhafte Daten, fehlende Routen, Bindungen und den einmaligen Verbrauch von Genehmigungen.
- Veröffentlichte freizügige Zeitüberschreitungseinstellungen als veraltet markieren, ohne sie zu berücksichtigen, nachdem eine Anfrage aussteht.
- Nachweise für Konflikte zwischen mehreren Oberflächen und Fehlerinjektion.

### Folgeaufgabe: Dauerhafte Bereinigung entfernter Nachrichten

- Weitergeleitete Zustellungs-Locators persistieren und jede zugestellte Kanalnachricht nach einem Neustart terminalisieren.
- Diesen Transportlebenszyklus von der kanonischen Genehmigungsautorität und typisierten Präsentationsaktionen getrennt halten.

## Tests

Erforderliche fokussierte Abdeckung:

- Erneutes Öffnen von SQLite erhält ausstehende und terminale Projektionen.
- Zwei gleichzeitige Auflöser erzeugen genau einen CAS-Gewinner.
- Die Wiederholung derselben Entscheidung gelingt idempotent; eine widersprüchliche Wiederholung gibt den aufgezeichneten Gewinner zurück.
- Eine Auflösung zum oder nach dem Ablaufzeitpunkt kann keine Genehmigung erteilen.
- `allow-once` kann genau einmal verbraucht werden, ohne den terminalen Auditstatus zu löschen.
- Der Start bricht ältere Laufzeitepochen ab.
- Nicht autorisierte Abfragen und Auflösungen offenbaren nicht die Existenz des Datensatzes.
- Explizite Prüfer-Zulassungsliste und allgemeines gekoppeltes `operator.approvals`-Verhalten.
- Legacy-Methoden für Ausführung und Plugins verwenden denselben Speicher.
- Gateway-Schemas für Anforderung/Auflistung/Abruf/Auflösung und additive Ereignisnutzlasten.
- Normalisierung typisierter Aktionen, Fallback-Darstellung, SDK-Exporte und Umschaltungen gebündelter Kanäle.
- Die Telegram-Callback-Codierung enthält transportprivate Daten und keine Ableitung aus Befehlszeichenfolgen.
- Direktes Kind, verzweigte Controller-/Anforderer-Eigentümer, verschachtelte Eigentümer, Neuzuweisung, Fallback auf Sitzungsfelder, Zyklus und Obergrenze der Zielgruppengröße.
- Angeforderte und terminale Zielgruppen-Arrays sind identisch.
- Eigentümerprojektionen verursachen weder Transkriptmutationen noch eine Aktivierung des Agenten.
- Die Control-UI-Route funktioniert unter `/` und einem konfigurierten Basispfad; nach dem Aktualisieren wird die ausstehende oder terminale Wahrheit angezeigt.
- Gleichzeitige Antworten über Control UI und Telegram zeigen einen Gewinner und beim Verlierer „anderweitig aufgelöst“ an.
- Native Genehmigungskennungen und Gateway-Eigentümerkennungen bewahren beim Routing und Abgleich die exakten UTF-8-Bytes.
- Die Aushandlung der nativen RPC-Familie legt pro zugelassener Gateway-Route eine kanonische oder Legacy-Familie fest und führt nach der Verwendung niemals stillschweigend ein Downgrade durch.
- Verlorene native Auflösungsbestätigungen sperren Aktionen bis zum kanonischen Rücklesen; ein fehlgeschlagenes Rücklesen kann weder einen Gewinner erfinden noch eine Watch-Aktualisierung bestätigen.
- Die Korrelation von Watch-Snapshot-Anforderungen wird nur für den exakten gekoppelten Gateway-Eigentümer und ein abgeschlossenes kanonisches iPhone-Rücklesen akzeptiert.
- Nachweis des Benutzerpfads über Testbox/Crabbox, einschließlich einer Genehmigungsseite in mobiler Breite, der Bereinigung von Telegram-Aktionen und eines vollständigen Durchlaufs aus ausstehender Anfrage, Auflösung und verspätetem Verlierer über Android, iPhone und Watch.

## Beobachtbarkeit

Strukturierte, inhaltsfreie Übergangsprotokolle mit Genehmigungs-ID, Art, Quellsitzungsschlüssel, Status, Grund und Latenz ausgeben. Niemals die Vorschau oder die unverarbeitete Bindung protokollieren.

Erfassen:

- Anzahl der Anforderungen nach Art;
- terminale Anzahl nach Art/Status/Grund;
- Messwert für ausstehende Vorgänge;
- Latenz von der Anforderung bis zum terminalen Status;
- Ergebnisse von Auflösungsrennen: Gewinner, idempotente Wiederholung, Konflikt, abgelaufen;
- Anzahl der Zustellungsrouten und Ablehnungen wegen fehlender Route;
- Abbrüche verwaister Vorgänge beim Start;
- Zielgruppengröße.

Ein bestätigter Übergang gilt als erfolgreich, selbst wenn die spätere Ereigniszustellung fehlschlägt. Lebenszyklusabonnenten stellen den Zustand durch die Wiedergabe aus PR 5 und kanonische Abfragen wieder her. Die dauerhafte Terminalisierung von Kanalnachrichten bleibt die oben genannte separate Folgeaufgabe.

## Offene Entscheidungen

1. **Extern erreichbarer Ursprung der Control UI.** Jeder Snapshot enthält das stabile relative `urlPath`. Eine absolute URL darf erst aus einem zwischengespeicherten Tailscale-Serve-/Funnel-Speicherort bekannt gegeben werden, nachdem die Gateway-Freigabe erfolgreich war; `allowedOrigins`, Host-Header von Anforderungen, `gateway.remote.url` und ausschließlich zur Anzeige bestimmte Loopback-/LAN-Kandidaten sind keine kanonischen Ursprünge. Telegram kann seinen authentifizierten Mini-App-Wrapper verwenden, um den Genehmigungspfad während des Bootstrappings beizubehalten. Beliebige Reverse-Proxys bleiben ausschließlich relativ, bis ein separat geprüfter expliziter Vertrag für öffentliche URLs besteht. Ein Kanal darf den Ursprung niemals erraten.
2. **Kompatibilitätsumstellung für strikte Ausführungszeitüberschreitungen.** Zeitüberschreitungen bei Plugin-Genehmigungen führen jetzt zu Fail-Closed-Verhalten, und `timeoutBehavior` ist veraltet. Der verbleibende veröffentlichte `askFallback`-Vertrag benötigt eine explizite Prüfung durch Eigentümer und Sicherheitsteam, einen Changelog-Eintrag, Dokumentation sowie eine Migrations-/Veraltungsentscheidung, bevor er nach Ablauf einer ausstehenden Anfrage keine Ausführung mehr autorisiert.
3. **Eingebetteter Modus ohne Gateway.** Empfehlung: zunächst ausschließlich lokal belassen und anschließend zu einem Client des kanonischen Dienstes machen, wenn ein Gateway vorhanden ist. Keinen Deep Link bekannt geben, den kein Server auflösen kann.
