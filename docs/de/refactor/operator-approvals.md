---
read_when:
    - Änderung des Genehmigungslebenszyklus, der Speicherung, des Protokolls oder der Autorisierung für exec oder Plugins
    - Hinzufügen von Genehmigungslinks oder nativen Genehmigungssteuerelementen zu einem Kanal
    - Genehmigungen von untergeordneten Sitzungen in übergeordneten oder Orchestrator-Ansichten darstellen
summary: Konzept für dauerhafte, direkt verlinkbare Genehmigungen in Control UI, nativen Apps, Kanälen und übergeordneten Sitzungen
title: Bedienerfreigaben über mehrere Oberflächen hinweg
x-i18n:
    generated_at: "2026-07-12T15:50:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3f3dfc5d503d46bfc7a5eb94960baf2a81216ac973ef1bb1e6a0ef63f0bec6d5
    source_path: refactor/operator-approvals.md
    workflow: 16
---

# Betreiberfreigaben über mehrere Oberflächen hinweg

Dieses Design bezieht sich auf [#103505](https://github.com/openclaw/openclaw/issues/103505). Es ersetzt die prozesslokale Freigabeautorität durch einen einzigen, vom Gateway verwalteten und SQLite-gestützten Lebenszyklus. Jede vom Gateway verwaltete Freigabe für eine Ausführung oder ein Plugin/Tool erhält eine stabile ID, eine authentifizierte Control-UI-Route, eine atomare Auflösung nach dem Prinzip „die erste Antwort gewinnt“ sowie ausschließlich für Betreiber bestimmte Projektionen in die Sitzungsstreams ihrer Quell- und übergeordneten Sitzungen.

Inline-Aktionen und Deep Links bestehen nebeneinander. Es gibt keinen Umschalter für den Freigabemodus.

## Ziele

- Ein einziges dauerhaftes Freigabeobjekt für Ausführungs- und Plugin/Tool-Sperren.
- Stabile Route `${controlUiBasePath}/approve/{approvalId}`.
- Auflösung über jede autorisierte Control UI, native App oder Kanaloberfläche.
- Atomares Verhalten nach dem Prinzip „die erste Antwort gewinnt“ über gleichzeitig verwendete Oberflächen hinweg.
- Idempotente identische Wiederholungsversuche; widersprüchliche spätere Antworten können die Gewinnerantwort nicht überschreiben.
- Zeitüberschreitungen, fehlerhafte vertrauenswürdige Entscheidungen, fehlende Routen, Abbrüche und Neustarts führen zu einer geschlossenen Ablehnung.
- Anforderungs- und Abschlussereignisse erreichen die Quellsitzung und alle relevanten übergeordneten bzw. Orchestrator-Eigentümer.
- Kanäle erhalten typisierte Freigabe- und Navigationsaktionen; Callback-Daten des Transports bleiben kanalintern.
- Bestehende Gateway-Methoden für Ausführungen und Plugins bleiben kompatibel, während ihre Implementierung in einem einzigen Dienst zusammengeführt wird.

## Nichtziele

- Persistieren oder Fortsetzen der blockierten Tool-Ausführung selbst über einen Gateway-Neustart hinweg.
- Verwenden einer Freigabe-ID oder URL als Bearer-Anmeldedaten.
- Anhängen von Freigabeaufforderungen an für das Modell sichtbare Transkripte oder Aktivieren übergeordneter Agenten.
- Verlagern von Freigaberichtlinien, Produktbefehlen oder der Autorisierung von Prüfern in Kanal-Plugins.
- Klonen des Freigabestatus pro Kanal, Gerät oder übergeordneter Instanz.
- Neugestalten von Ausführungs-Positivlisten, der Zusammensetzung von Plugin-Richtlinien oder der Persistenz von `allow-always`, außer soweit erforderlich, um abschließende Ergebnisse eindeutig zu machen.
- Fernzugriff auf eine eingebettete TUI ohne Gateway im ersten Ausbauschritt. Sie bleibt ausschließlich lokal und muss geschlossen ablehnen, wenn kein Prüfer vorhanden ist.

## Ausgangsbasis vor der Einführung und Evidenzübersicht

Diese Tabelle dokumentiert den Implementierungsstand zum Zeitpunkt der Eröffnung von #103505. Die nachfolgenden Einführungsabschnitte behandeln das dauerhafte Register, typisierte Aktionen, die Deep-Link-Seite und Erweiterungen nativer Clients, die auf dieser Ausgangsbasis aufbauen.

| Oberfläche           | Ausgangseinstiegspunkt und Eigentümer                                                                                                                                  | Ausgangsverhalten und Lücke                                                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agentenausführung        | `src/agents/bash-tools.exec-approval-request.ts`, `src/agents/bash-tools.exec-host-shared.ts`                                                                   | Die zweiphasige Registrierung über `exec.approval.*` verhindert ein vorzeitiges `/approve`-Race, doch eine Zeitüberschreitung kann über `askFallback` weiterhin zu einer Erlaubnis führen.                                                        |
| Plugin-Tool-Sperre  | `src/agents/agent-tools.before-tool-call.ts`                                                                                                                    | Fordert `plugin.approval.*` an; `timeoutBehavior: "allow"` kann eine zeitüberschrittene Sperre freigeben. Der eingebettete Modus verfügt in `src/infra/embedded-plugin-approval-broker.ts` über eine separate prozesslokale Autorität. |
| Plugin-Node-Sperre  | `src/gateway/node-invoke-plugin-policy.ts`                                                                                                                      | Erstellt und überträgt direkt über den Plugin-Manager und dupliziert dadurch einen Teil des Lebenszyklus der Servermethode.                                                                                 |
| Gateway-Autorität | `src/gateway/server-aux-handlers.ts`, `src/gateway/exec-approval-manager.ts`, `src/gateway/server-methods/approval-shared.ts`                                   | Separate Manager für Ausführungen und Plugins verwenden prozesslokale Maps. Abschlusseinträge bleiben 15 Sekunden erhalten. Das Prinzip „die erste Antwort gewinnt“ gilt nur innerhalb eines Prozesses.                                          |
| Gateway-Protokoll  | `packages/gateway-protocol/src/schema/exec-approvals.ts`, `packages/gateway-protocol/src/schema/plugin-approvals.ts`, `src/gateway/methods/core-descriptors.ts` | Für Ausführungen gibt es ein nur für ausstehende Einträge vorgesehenes `get`; für Plugins gibt es kein `get`; für einen Deep Link existiert keine typunabhängige Suche nach Abschlusseinträgen.                                                                                   |
| Zustellung          | `src/infra/exec-approval-channel-runtime.ts`, `src/infra/approval-native-runtime.ts`, `src/infra/approval-handler-runtime.ts`                                   | Unterstützt Ursprungsrouting, Direktnachrichten an Freigabeberechtigte, Wiedergabe ausstehender Einträge, native Handler und prozessinterne Abschlussbereinigung. Eine separate Folgeänderung ergänzt den dauerhaften Abgleich von Abschlusseinträgen.                          |
| Portable Aktionen  | `src/interactive/payload.ts`, `src/plugin-sdk/interactive-runtime.ts`, `src/plugin-sdk/approval-reply-runtime.ts`                                               | Freigabeschaltflächen sind Befehlsaktionen, die `/approve ...` enthalten; URL- und Web-App-Ziele sind untypisierte Schaltflächenfelder.                                                                           |
| Telegram          | `extensions/telegram/src/approval-handler.runtime.ts`, `extensions/telegram/src/button-types.ts`                                                                | Der Renderer analysiert Befehlstext, um die Semantik von Freigaben zu erkennen, bevor er private Callback-Daten erzeugt.                                                                                     |
| Control UI        | `ui/src/app/exec-approval.ts`, `ui/src/app/overlays.ts`, `ui/src/components/exec-approval.ts`                                                                   | Die Freigabeoberfläche ist ein globales modales Fenster. `ui/src/app-route-paths.ts` und `ui/src/app-routes.ts` verwenden exakte Routen und leiten unbekannte Pfade zu Chat um.                                                    |
| Sitzungseigentümerschaft | `src/agents/subagent-registry.types.ts`, `src/agents/subagent-registry-read.ts`, `src/config/sessions/types.ts`                                                 | Controller, Anforderer, explizit übergeordnete Instanz und veraltete Erzeugungseigentümerschaft sind vorhanden, Freigabeereignisse werden jedoch nicht in diese Sitzungsstreams projiziert.                                                    |
| Gemeinsamer Status      | `src/state/openclaw-state-schema.sql`, `src/state/openclaw-state-db.ts`                                                                                         | Vorhandene Immediate-Transaktionen und bedingte Kysely-Aktualisierungen unterstützen dauerhaftes Compare-and-Set in `state/openclaw.sqlite`.                                                                   |

Zu den repräsentativen aktuellen Tests gehören `src/gateway/exec-approval-manager.test.ts`, `src/gateway/server-methods/approval-shared.test.ts`, `src/agents/bash-tools.exec-gateway-approval.e2e.test.ts`, `extensions/telegram/src/approval-handler.runtime.test.ts` und `ui/src/e2e/approval-flow.e2e.test.ts`.

Das Plugin-SDK bleibt die einzige Grenze für Kanäle und Plugins. Änderungen an Freigabelaufzeit und Darstellung müssen über die bestehenden Unterpfade `src/plugin-sdk/approval-*.ts` und `src/plugin-sdk/interactive-runtime.ts` exportiert werden; produktiver Plugin-Code darf keine Gateway-Interna importieren.

## Vorbilder

Omnigent bietet nützliche UX- und Fehlersemantiken:

- [`approval.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/runtime/policies/approval.py) hält ASK an, wendet Zeitüberschreitungen pro Richtlinie an und behandelt nur eine exakte Annahme als Freigabe.
- [`sessions.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/routes/sessions.py) enthält die serverseitige Sperre für das native Testsystem sowie die Projektion von Anforderungen und Auflösungen auf übergeordnete Instanzen.
- [`ApprovePage.tsx`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/web/src/pages/ApprovePage.tsx) stellt die eigenständige mobile Freigabeseite bereit.

Übernehmen Sie die Aussage zur Speicherung nicht unkritisch. Der derzeit aktive ausstehende Status ist in [`_elicitation_registry.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/_elicitation_registry.py) prozesslokal, und die nicht verwendete Tabelle für ausstehende Einträge wird durch [`e3b1f2a4c9d7_drop_pending_tool_calls_table.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/db/migrations/versions/e3b1f2a4c9d7_drop_pending_tool_calls_table.py) entfernt. OpenClaw geht bewusst weiter: SQLite ist maßgeblich, und jeder Abschlussübergang ist ein Compare-and-Set in der Datenbank.

## Architektur und Eigentümerschaft

Das Gateway verwaltet den Lebenszyklus:

1. Ein Agent, Plugin-Hook oder eine Node-Richtlinie stellt eine typspezifische Anforderung und eine prozesslokale Ausführungsbindung bereit.
2. Das Gateway validiert sie und erstellt eine bereinigte Projektion für Prüfer.
3. Der Freigabedienst berechnet die Zielgruppe aus Quelle und Eigentümern, fügt die kanonische Zeile ein und registriert anschließend den prozessinternen Wartenden.
4. Nach dem dauerhaften Einfügen veröffentlicht das Gateway bestehende Freigabeereignisse, Sitzungsprojektionen, Kanalbenachrichtigungen und native Push-Mitteilungen.
5. Jede Oberfläche löst die Freigabe über denselben Dienst auf.
6. Der Dienst schreibt einen einzigen Abschlussübergang fest, aktiviert den zur Laufzeit Wartenden und veröffentlicht Abschlussprojektionen.
7. Eine fehlgeschlagene Ereigniszustellung macht die festgeschriebene Entscheidung niemals rückgängig; Clients stellen den Status über `approval.get` oder die Wiedergabe einer Liste wieder her.

Eigentumsgrenzen:

- `src/gateway/`: Freigabedienst, Autorisierung, RPC-Adapter, URL-Erstellung, Lebenszyklus von Wartenden und Ereignisveröffentlichung.
- `src/state/`: gemeinsames Schema und generierte Kysely-Typen.
- `src/infra/`: bereinigte Freigabe-Viewmodels und Erstellung portabler Darstellungen.
- `src/agents/`: Entscheidung anfordern, darauf warten und zurückgegebene Entscheidung anwenden; keine Persistenz.
- `src/channels/` und `extensions/*`: typisierte Aktionen rendern, Kanalbenutzer autorisieren, private Callbacks codieren und bereitgestellte Steuerelemente aktualisieren.
- `src/plugin-sdk/`: ausschließlich öffentliche Freigabe- und Darstellungsverträge.
- `ui/`: eigenständige Seite sowie bestehende Clients für Warteschlangen und modale Fenster.

Der prozessinterne Wartende ist ein Benachrichtigungsmechanismus, keine Autorität. Die Registrierung fügt die Zeile ein und installiert den Wartenden synchron vor der Veröffentlichung der Anforderung, sodass sich kein Auflöser zwischen diese Schritte schieben kann. Jeder spätere Auflöser schreibt die Entscheidung über SQLite fest, bevor er diesen Wartenden beendet.

## Persistenter Datensatz

Fügen Sie der gemeinsamen Statusdatenbank eine einzelne Tabelle `operator_approvals` hinzu.

| Spalte                                             | Zweck                                                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval_id`                                      | Global eindeutige kanonische ID. Bestehende Exec-IDs und `plugin:`-IDs bleiben für die Protokollkompatibilität erhalten, aber die Art darf niemals aus dem Präfix abgeleitet werden.      |
| `resolution_ref`                                   | Eindeutiger vollständiger SHA-256-base64url-Locator für Transport-Callbacks, die die kanonische ID nicht übertragen können. Er ist weder eine Autorisierung noch eine öffentliche URL-ID. |
| `kind`                                             | Geschlossener Diskriminator `exec \| plugin`.                                                                                                        |
| `status`                                           | Geschlossener Zustand `pending \| allowed \| denied \| expired \| cancelled`.                                                                          |
| `presentation_json`                                | Validierte, mit der Art gekennzeichnete Prüferprojektion. Unverarbeitete Laufzeitanfragen, Befehlsbindungen und Callback-Payloads bleiben prozesslokal.               |
| `source_agent_id`, `source_session_key`            | Quellidentität und Anker der Sitzungsprojektion. Der Sitzungsschlüssel ist dauerhaft, die rotierende Sitzungs-UUID nicht.                                          |
| `audience_session_keys_json`                       | Geordnetes, dedupliziertes JSON-Array, das durch die begrenzte breitenorientierte Eigentümerschaftssuche erzeugt wird. Angeforderte und terminale Ereignisse verwenden denselben Snapshot. |
| `requested_by_device_id`, `requested_by_client_id` | Dauerhafte Metadaten für Anforderer und Audit. Die Verbindungs-ID bleibt im Speicher und ist kein oberflächenübergreifender Principal.                                         |
| `reviewer_device_ids_json`                         | Optionale, explizit adressierte Prüfergeräte, die ausschließlich von der vertrauenswürdigen Genehmigungslaufzeit bereitgestellt werden.                                                  |
| `runtime_epoch`                                    | Prozessepoche, der die geparkte Ausführung gehört; wird verwendet, um verwaiste Zeilen nach einem Neustart abzubrechen.                                                     |
| `created_at_ms`, `expires_at_ms`, `updated_at_ms`  | Maßgebliche Zeitangaben.                                                                                                                         |
| `decision`                                         | Explizite Benutzerentscheidung, sofern vorhanden.                                                                                                       |
| `terminal_reason`                                  | Geschlossener Grund wie `user`, `timeout`, `malformed-verdict`, `no-route`, `run-aborted` oder `gateway-restart`.                                |
| `resolved_at_ms`, `resolver_kind`, `resolver_id`   | Gewinner und Audit-Identität werden serverseitig aufbewahrt. Prüferprojektionen lassen unverarbeitete Resolver-Identifikatoren aus.                                           |
| `consumed_at_ms`, `consumed_by`                    | Separate Wiederholungssperre für `allow-once`; der Verbrauch darf die aufgezeichnete Entscheidung nicht löschen.                                                       |

Erforderliche Indizes:

- eindeutig `(resolution_ref)`; Einfügungen weisen außerdem spaltenübergreifende Mehrdeutigkeiten zwischen `approval_id` und `resolution_ref` zurück
- `(status, expires_at_ms)`
- `(source_session_key, created_at_ms DESC)`
- `(resolved_at_ms)` für die Aufbewahrungsbereinigung

Zielgruppen-Arrays sind klein und begrenzt. Die sitzungsgefilterte Wiederholung wählt zunächst über Kysely sichtbare ausstehende Zeilen aus und dekodiert und filtert anschließend die begrenzten Zielgruppen-Arrays im Anwendungscode; sie verwendet weder Zeichenfolgenabgleich noch direkte SQL-JSON-Abfragen.

Terminale Zeilen werden 30 Tage lang aufbewahrt, entsprechend der Aufbewahrungsdauer für Metadaten-Audits in `src/audit/audit-event-store.ts`. Die Bereinigung ist eine feste Wartungsrichtlinie und keine neue Konfigurationsoberfläche. Die Datenbank ist privater lokaler Control-Plane-Zustand, aber Prüfer-APIs dürfen niemals die vollständig gespeicherte Anfrage oder Laufzeitbindung offenlegen.

## Zustandsautomat und Compare-and-Set

Nur diese Übergänge sind gültig:

- `pending -> allowed`: explizites `allow-once` oder `allow-always`.
- `pending -> denied`: explizite Ablehnung, vertrauenswürdiges fehlerhaftes terminales Urteil oder kein Zustellungsweg.
- `pending -> expired`: maßgebliche Frist erreicht.
- `pending -> cancelled`: Ausführungsabbruch, ordnungsgemäßes Herunterfahren oder Wiederherstellung verwaister Einträge nach einem Neustart.

Jeder nicht zugelassene terminale Zustand hat als wirksames Urteil eine Ablehnung.

Die Auflösung verwendet eine unmittelbare SQLite-Transaktion und eine bedingte Kysely-Aktualisierung entsprechend:

```sql
UPDATE operator_approvals
SET status = ?, decision = ?, terminal_reason = ?, resolved_at_ms = ?
WHERE approval_id = ?
  AND status = 'pending'
  AND expires_at_ms > ?;
```

Wenn die Aktualisierung keine Zeile betrifft, liest dieselbe Transaktion den Datensatz:

- Fehlend oder nicht autorisiert: Nicht gefunden zurückgeben; Existenz nicht offenlegen.
- Noch ausstehend, aber Frist erreicht: per Compare-and-Set auf `expired` setzen und anschließend diese terminale Zeile zurückgeben.
- Dieselbe aufgezeichnete Entscheidung: idempotenten Erfolg mit dem aufgezeichneten Gewinner zurückgeben.
- Abweichende Entscheidung: Die vereinheitlichte API gibt `applied: false` mit dem aufgezeichneten Gewinner zurück; Legacy-Adapter behalten `APPROVAL_ALREADY_RESOLVED` bei, wo ihr ausgelieferter Vertrag dies erfordert.
- Beliebiger terminaler Zustand: niemals verändern.

`now == expires_at_ms` gilt als abgelaufen. Die Gateway-Zeit ist maßgeblich.

Die Ausführung von `allow-once` verwendet ein zweites CAS über `consumed_at_ms IS NULL`, das an den bestehenden exakten Befehls-/Systemausführungskontext gebunden ist. Die Genehmigungszeile bleibt nach dem Verbrauch als Auditdatensatz erhalten.

Fehlerhafte HTTP-/RPC-Eingaben, die nicht authentifiziert werden können oder keine Genehmigung identifizieren, werden ohne Änderung zurückgewiesen und können niemals genehmigen. Ein fehlerhaftes terminales Urteil, das von einem vertrauenswürdigen Harness/Waiter für eine bekannte Genehmigung empfangen wird, führt zum Übergang zu `denied`.

## Gateway-API

Artenunabhängige Prüfermethoden hinzufügen:

| Methode                                    | Vertrag                                                                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval.get { id }`                     | Gibt eine sichtbare ausstehende oder aufbewahrte terminale Projektion zurück.                                                                                                                                                          |
| `approval.resolve { id, kind, decision }` | Akzeptiert die kanonische ID oder eine Transportreferenz fester Größe und führt anschließend Autorisierung, Validierung der Art und der zulässigen Entscheidung, Fristabgleich und terminales CAS aus. Die Antwort enthält immer die kanonische ID. |

Nach einem erfolgreichen CAS wird die bestätigte Projektion sofort zurückgegeben. Legacy-Ereignisse, Kanalweiterleitungen und Push-Terminalisierungen sind nachgelagerte Best-Effort-Schritte; eine langsame oder fehlgeschlagene Oberfläche darf die gewinnende Antwort weder verzögern noch zurücksetzen.

Die artenspezifische Anfragevalidierung verbleibt in `exec.approval.request` und `plugin.approval.request`. Bestehende Methoden `exec.approval.get/list/waitDecision/resolve` und `plugin.approval.list/waitDecision/resolve` werden zu Adaptern an der Protokollgrenze für den kanonischen Dienst, da sie ausgelieferte Gateway-API sind. Interne Aufrufer werden in derselben Änderung zum Dienst migriert.

Eine Prüferprojektion ist eine gekennzeichnete Union:

```ts
type OperatorApproval = {
  id: string;
  status: OperatorApprovalStatus;
  presentation:
    | { kind: "exec"; commandText: string /* sichere Exec-Vorschau */ }
    | { kind: "plugin"; title: string; description: string /* sichere Plugin-Vorschau */ };
  // gemeinsame Lebenszyklusfelder
};
```

Der stabile Pfad wird abgeleitet und nicht persistiert. `approval.get` gibt `urlPath` zurück; Oberflächen, denen ein genehmigter öffentlicher Ursprung bekannt ist, können zusätzlich eine absolute `url` erhalten. Prüfer-Snapshots lassen Quell- und Zielgruppen-Sitzungsschlüssel aus. Das Gateway behält diese Routing-Schlüssel serverseitig für die separate Projektion `session.approval`.

## Ereignisse und portable Aktionen

PR 1 behält die ausgelieferten Ereignisnamen, Payloads und bestehenden empfängerbezogenen Filter auf Datensatzebene bei:

- `exec.approval.requested`
- `exec.approval.resolved`
- `plugin.approval.requested`
- `plugin.approval.resolved`

Diese Legacy-Ereignisse können die vollständige Laufzeitanfrage enthalten und dürfen daher nicht an jeden genehmigungsbezogenen Client verteilt werden. PR 5 fügt gekennzeichnete Lebenszyklusfelder (`status`, `sourceSessionKey`, `urlPath`, terminale Metadaten und ein `kind` auf Präsentationsebene) über die bereinigte Lebenszyklusprojektion hinzu, anstatt die Zustellung von Legacy-Ereignissen auszuweiten.

Ein genehmigungsbezogenes Projektionsereignis `session.approval` hinzufügen. Das kanonische Ereignis wird einmal mit den persistierten Zielgruppenschlüsseln veröffentlicht; Abonnenten exakter Sitzungen erhalten dasselbe Ereignis für jeden übereinstimmenden Schlüssel:

- `sessionKey`: Stream, der die Projektion empfängt.
- `sourceSessionKey`: untergeordnete/Quellsitzung, die die Sperre ausgelöst hat.
- `phase`: `pending \| terminal`, anhand des Genehmigungsstatus unterschieden.
- eine sichere `OperatorApproval`-Projektion.

Clients melden sich mit `sessions.messages.subscribe { key, agentId?, includeApprovals: true }` an. Die erfolgreiche Antwort fügt ein `approvalReplay` hinzu, das bis zu 1.000 aktuell ausstehende Genehmigungen für genau diesen Stream-Schlüssel enthält, zu deren Prüfung der abonnierende Client auch datensatzbezogen autorisiert ist. `truncated: false` macht die gefilterte Wiederholung maßgeblich, und erneut verbundene Clients ersetzen damit ihre lokale Menge ausstehender Einträge; `truncated: true` ist ein Überlastungssignal, und Clients müssen ungesehene lokale Einträge beibehalten, bis eine kanonische Abfrage oder spätere Lebenszyklusereignisse sie abschließend klären. Ein späterer dauerhafter Timeout, der während der Wiederholung entdeckt wird, sendet terminale Tombstones ausschließlich an abonnierte, datensatzbezogen autorisierte Zielgruppen, bevor der neue Snapshot zurückgegeben wird. `operator.admin` kann sich direkt anmelden; Clients mit engeren Berechtigungen benötigen sowohl eine gekoppelte Geräteidentität als auch `operator.approvals`. Ein Sitzungsabonnement allein gewährt niemals Sichtbarkeit von Genehmigungen.

Das Ereignis unter `operator.approvals` in `src/gateway/server-broadcast.ts` registrieren. Die Projektion ist rein beobachtend: Sie hängt niemals Transkriptzeilen an, emittiert kein `sessions.changed` und weckt keinen Agenten.

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

Der Kern erstellt typisierte Entscheidungsaktionen sowie einen separaten Prüfungslink, wenn ein genehmigter absoluter Ursprung der Control UI verfügbar ist. Kanäle kodieren eine Genehmigungsaktion in ihr eigenes Callback-Format und senden die Auflösung an den kanonischen Dienst. Ein Callback verwendet die exakte kanonische ID, wenn sie hineinpasst; andernfalls verwendet er die eindeutige Voll-Digest-`resolution_ref` der Zeile. Die Referenz ist lediglich ein kompakter Suchschlüssel: Die normale Gateway-Authentifizierung, datensatzbezogene Autorisierung, explizite Art, Validierung zulässiger Entscheidungen, der Fristabgleich und das CAS nach dem Prinzip „erste Antwort gewinnt“ gelten weiterhin. Kanäle dürfen IDs nicht kürzen, Hashpräfixe nicht auflösen, keinen `/approve`-Text parsen und die Art nicht aus einem ID-Präfix ableiten.

`button.url`, `button.webApp` und befehlsbasierte Genehmigungssteuerelemente bleiben als veraltete Kompatibilitätseingaben des Plugin-SDK erhalten. Sie werden an der SDK-Grenze normalisiert; jeder gebündelte interne Aufrufer wird im selben PR migriert. `/approve {id} {decision}` bleibt ein Text-Fallback und CLI-/Chatbefehl, nicht der semantische Vertrag für Schaltflächen.

## Control UI

Die Route lautet `${basePath}/approve/{approvalId}`. Die ID ist der einzige Pfadparameter; die Identität der Quellsitzung stammt aus dem Datensatz.

Da der aktuelle Router über exakte statische Routen verfügt und unbekannte Pfade auf Chat umschreibt, muss dieser Deep Link in `ui/src/app/bootstrap.ts` vor der normalen Routennormalisierung erkannt werden. Verwenden Sie die normale Gateway-/Authentifizierungseinrichtung wieder, stellen Sie jedoch eine eigenständige Genehmigungsseite außerhalb der Seitenleisten-Shell und des globalen Modals dar.

Das Dokument gehört dem Gateway, das seine URL bereitgestellt hat. Seine initiale Verbindung ignoriert die persistierte Auswahl des Remote-Gateways der vollständigen App, ohne die Einstellungen dieser Auswahl zu ändern oder zu kopieren; nur die Authentifizierung bleibt auf die Sitzung des bereitstellenden Gateways beschränkt. Vertrauenswürdige native Authentifizierung oder eine separat bestätigte `gatewayUrl`-Überschreibung kann das Ziel ändern. Der Core reserviert den einsegmentigen Namensraum `/approve` vor Plugin-HTTP-Routen und der Erkennung statischer Erweiterungen, einschließlich IDs, die auf `.json` oder `.js` enden; wenn die Bereitstellung der Control UI deaktiviert ist, schlägt die reservierte Route geschlossen mit `404` fehl. Belassen Sie die Seite im Haupt-Bundle der Control UI, damit ein fehlgeschlagener Lazy-Chunk eine Sicherheitsentscheidung nicht dauerhaft auf einem Ladeindikator blockiert.

Seitenzustände:

- Wird geladen
- Authentifizierung erforderlich
- ausstehend
- wird aufgelöst
- hier genehmigt oder abgelehnt
- andernorts aufgelöst
- abgelaufen
- abgebrochen
- verboten/nicht gefunden
- Verbindungsfehler mit Wiederholungsoption

Die Seite ruft Gateway-RPC auf, nicht eine zweite, nicht authentifizierte REST-API. Beim Aktualisieren des Browsers wird der dauerhafte Zustand erneut gelesen. Gateway-Anmeldedaten werden niemals in der URL, der Abfrage oder dem Fragment platziert.

## Autorisierung und Datenschutz

Die URL ist ein Locator, keine Autorität. Die Auflösung erfordert:

1. eine authentifizierte Gateway-Verbindung;
2. `operator.approvals` oder `operator.admin`;
3. eine Autorisierung des Prüfers auf Datensatzebene.

Regeln auf Datensatzebene:

- `operator.admin` darf prüfen.
- `reviewer_device_ids` ist maßgeblich, wenn vorhanden. Nur ein aufgeführtes gekoppeltes
  `operator.approvals`-Gerät darf prüfen; das anfragende Gerät hat keinen impliziten
  Zugriff, sofern es nicht ebenfalls aufgeführt ist.
- Ohne eine explizite Prüferliste darf das anfragende gekoppelte
  `operator.approvals`-Gerät seinen eigenen Datensatz prüfen.
- Tatsächlich veraltete Datensätze ohne Bindung an einen Anfragenden oder Prüfer behalten eine breite
  Sichtbarkeit für gekoppelte Geräte, damit Upgrades bereits ausstehende Arbeit nicht blockieren.
- Interne Laufzeitumgebungen ohne Gerät dürfen über die bereichsbeschränkte
  Genehmigungslaufzeit-Verbindung auflösen, jedoch nicht lesen. Diese Autorität stammt ausschließlich vom
  serverseitig authentifizierten Laufzeit-Token; öffentliche `approval.resolve`-Felder können
  sie nicht erzeugen.
- Die Eigentümerschaft einer aktiven Verbindung des Anfragenden bleibt für ältere Adapter gültig; sie wird
  niemals aus einem übereinstimmenden Clientnamen abgeleitet.
- Die Zielgruppenzugehörigkeit ändert nur die Darstellung. Sie erweitert niemals die Autorisierung.

`approval.get` stellt nur die bereinigte Prüferprojektion bereit und lässt interne Routing-Schlüssel für Quelle und Zielgruppe aus. Das PR-5-Ereignis `session.approval` enthält seinen einen Ziel-`sessionKey` sowie `sourceSessionKey`, nachdem das Gateway den persistierten Zielgruppen-Snapshot serverseitig angewendet hat. Bestehende Exec-/Plugin-Ereignisse behalten ihre bisherigen Nutzdaten und eingeschränkten Empfänger, bis die Verbraucher migriert sind. Die ausführbare Anfrage, die Befehlsbindung und die Fortsetzung verbleiben ausschließlich im prozesslokalen Waiter. Die dauerhafte Zeile enthält die sichere Darstellung sowie Lebenszyklus-, Routing- und Audit-Metadaten; sie speichert niemals rohe Umgebungswerte, Anmeldedaten, Authentifizierungsheader oder Channel-Callback-Daten.

## Zielgruppenprojektion

Berechnen Sie die Zielgruppe einmal vor dem Einfügen und persistieren Sie den geordneten Snapshot. Eigentümerschaft ist ein Graph und nicht immer eine einzelne übergeordnete Kette: Ein untergeordneter Agent kann sowohl einen aktuellen Controller als auch einen ursprünglichen Anforderer haben, und diese Eigentümer können zu unterschiedlichen Wurzeln führen.

Verwenden Sie eine deterministische Breitensuche:

1. Initialisieren Sie die Warteschlange mit dem Quellsitzungsschlüssel.
2. Lesen Sie für jeden aus der Warteschlange entnommenen Schlüssel den neuesten Eintrag der Subagent-Registry und fügen Sie beide unterschiedlichen Eigentümerschaftskanten in fester Reihenfolge in die Warteschlange ein: `controllerSessionKey`, dann `requesterSessionKey`.
3. Wenn ein verwendbarer Registry-Eintrag vorhanden ist, folgen Sie nicht zusätzlich der Abstammung des Sitzungseintrags, die nach einer Steuerungsänderung veraltet sein kann. Andernfalls fügen Sie die einzelne aktuelle Ausweichkante `parentSessionKey ?? spawnedBy` in die Warteschlange ein.
4. Normalisieren und deduplizieren Sie beim Einfügen in die Warteschlange, damit der zuerst gefundene, kürzeste Pfad Vorrang hat.
5. Stoppen Sie bei 64 eindeutigen Schlüsseln; diese Obergrenze für die Zielgruppengröße begrenzt zugleich die Traversierungstiefe.

Die Registry-Quelle ist `src/agents/subagent-registry-read.ts`; die Eigentümerschaftsfelder sind in `src/agents/subagent-registry.types.ts` definiert. Die Felder für den Sitzungsausweichpfad sind in `src/config/sessions/types.ts` definiert.

Die Projektionen für Anforderung und Abschluss verwenden dieselbe persistierte Zielgruppe, selbst wenn sich die Fokus-/Controller-Eigentümerschaft ändert, während die Genehmigung aussteht. Dies gewährleistet die abschließende Bereinigung für jeden Sitzungsstream der Zielgruppe, der die Anforderungsprojektion erhalten hat. Die Auflösung bezieht sich immer auf die Quell-Genehmigungs-ID; Zielgruppensitzungen erhalten niemals einen geklonten Genehmigungsstatus. Die Bereinigung weitergeleiteter Kanalnachrichten bleibt die separate, nachfolgend beschriebene Zustellungs-Locator-Nachverfolgung.

Schreiben Sie nicht allein aufgrund einer Genehmigung Transkriptnachrichten, fügen Sie keine System-Prompts ein, starten Sie keine Eigentümer-Turns und geben Sie kein `sessions.changed`-Ereignis aus.

## Konvergenz der ausgelieferten Oberflächen

Native Genehmigungs-Handler bewahren die Einträge ihrer ausgelieferten Nachrichten bereits lange genug auf, um aktive Steuerelemente zu ersetzen oder außer Betrieb zu nehmen. Generische weitergeleitete Genehmigungsnachrichten verwerfen derzeit den `MessageReceipt`, sodass bei einer Entscheidung auf einer anderen Oberfläche ihre alten Steuerelemente weiterhin als ausstehend erscheinen können. Ein separater Folgebeitrag schließt diese Lücke mit einer untergeordneten Tabelle `operator_approval_deliveries` in der gemeinsamen Zustandsdatenbank.

Jede Zeile speichert die Genehmigungs-ID, eine eindeutige Auslieferungs-ID, den Kanal, das Konto und die exakte Route, einen größenbeschränkten, JSON-validierten kanalprivaten Nachrichten-Locator, Auslieferungszeitstempel und den Finalisierungsstatus. Sie speichert niemals Callback-Daten, Entscheidungstoken oder unverarbeitete Genehmigungsanfragen. Der Kanal ist für die Codierung des Locators und die Änderung der Nachricht zuständig; der Core ist für den kanonischen Status, die Zielauswahl, die Wiederholungsrichtlinie und den abschließenden Fallback-Text zuständig.

Die Zustellungsregistrierung und die Ermittlung des Endstatus erfolgen ohne Race Conditions:

1. Nachdem ein ausstehender Sendevorgang seine Empfangsbestätigung zurückgibt, fügen Sie den Zustellungs-Locator ein und lesen Sie den Genehmigungsstatus des übergeordneten Elements in einer einzigen Transaktion.
2. Wenn das übergeordnete Element bereits einen Endzustand erreicht hat, planen Sie die sofortige Finalisierung, statt die verspätete Zustellung ausstehend zu lassen.
3. Jeder bestätigte Übergang in einen Endzustand plant separat alle noch nicht finalisierten Zustellungszeilen ein; verwerfbare Broadcasts sind nicht der Auslöser.
4. Ein Kanal-Finalisierer meldet `replaced`, `retired` oder `unsupported`. „Ersetzt“ unterdrückt eine doppelte Abschlussnachricht; „ausgemustert“ sendet die vorhandene abschließende Folgenachricht; „nicht unterstützt“ oder ein Fehler löst einen Fallback aus, ohne den Genehmigungs-CAS zurückzusetzen.
5. Beim Start werden Genehmigungen im Endzustand mit unvollständigen Zustellungen erneut verarbeitet, sodass die Bereinigung auch bei einem Neustart des Gateway zuverlässig erfolgt.

Dieser Transportlebenszyklus ist ein optionaler Hook für Zustellungsadapter, kein Renderer und keine modellseitige Nachrichtenaktion. QQ-C2C-/Gruppennachrichten verfügen derzeit über keine API zum Bearbeiten, Löschen oder Leeren der Tastatur; dieser Adapter wird weiterhin nicht unterstützt und kann den kanonischen Zustand erst nach einem späteren Klick anzeigen, bis der Transport eine Mutations-API erhält.

## Semantik von Neustart, Zeitüberschreitung und Routing

SQLite-Persistenz impliziert keine Wiederaufnahme der Ausführung. Befehls-/Tool-Bindungen verbleiben im Arbeitsspeicher, da sie sicherheitskritische Laufzeitinformationen enthalten können und keinen Vertrag für einen wiederaufnehmbaren Auftrag darstellen.

Beim Start des Gateways:

- eine neue Laufzeitepoche generieren;
- ausstehende Zeilen aus älteren Epochen atomar mit dem Grund `gateway-restart` in `cancelled` überführen;
- Zeilen beibehalten, damit ihre URLs erklären, was geschehen ist;
- niemals eine spätere Genehmigung für eine fehlende Laufzeitbindung ausführen.

Timer sind Optimierungen für das Aufwecken. Die maßgebliche Ablauffrist ist im gespeicherten Wert `expires_at_ms` hinterlegt; Lese-, Warte- und Auflösungsvorgänge führen jeweils einen Abgleich des Ablaufstatus durch.

Endgültiges striktes Verhalten:

- Zeitüberschreitung -> `expired`, ablehnen;
- keine Route -> `denied`, ablehnen;
- Abbruch der Ausführung -> `cancelled`, ablehnen;
- fehlerhaftes vertrauenswürdiges Urteil -> `denied`, ablehnen;
- nur eine zulässige explizite Erlaubnisentscheidung -> `allowed`.

Das aktuell ausgelieferte Ausführungsverhalten steht weiterhin im Widerspruch zu diesem Vertrag:

- `src/agents/bash-tools.exec-host-shared.ts` kann `askFallback` anwenden.
- `docs/tools/exec-approvals.md` und `docs/cli/approvals.md` dokumentieren diese Oberfläche.

Plugin-Genehmigungen schlagen bei Zeitüberschreitungen und fehlerhaften Urteilen nun geschlossen fehl; das veraltete Feld
`timeoutBehavior` wird weiterhin akzeptiert, aber ignoriert. Die nachfolgende Änderung für eine strikte Ausführungssemantik
muss Code, Typen, Dokumentation, Tests und Changelog gemeinsam aktualisieren und
ausdrücklich von den zuständigen Verantwortlichen und dem Sicherheitsteam geprüft werden. `askFallback` darf während der Migration weiterhin
die Richtlinienauswahl vor dem Gate beschreiben, darf aber die Zeitüberschreitung eines erstellten
ausstehenden Datensatzes nicht in eine Genehmigung umwandeln.

## Kompatibilitätsplan

- Additives Gateway-Protokoll; keine Erhöhung der Protokollversion.
- Bestehende Ausführungs-/Plugin-Methoden und -Ereignisse an der externen Grenze beibehalten.
- Bestehende IDs einschließlich der Präfixe `plugin:` beibehalten, Präfixe jedoch nicht mehr als Typinformationen verwenden.
- Verhalten des Textbefehls `/approve` beibehalten.
- Veraltete Schaltflächen-URL-/Web-App-Felder und Befehlsaktionen als Kompatibilitätseingaben für das Plugin SDK beibehalten; neue Kernausgaben sind typisiert.
- Alle gebündelten Kanäle und internen Aufrufer mit derselben Änderung für typisierte Aktionen migrieren.
- Einen Changelog-Eintrag für die neue URL/Seite und für die spätere Änderung des Zeitüberschreitungsverhaltens hinzufügen.
- Keine Einstellung für einen Abfragemodus hinzufügen.

## Einführung

### PR 1: dauerhafter Lebenszyklus

- Dieser Designhinweis.
- Gemeinsames SQLite-Schema, Kysely-Generierung, Speicher und Bereinigung nach 30 Tagen.
- Gateway-Genehmigungsdienst, Brücke für Laufzeit-Wartende und Behandlung verwaister Vorgänge nach einem Neustart.
- Vereinheitlichte Methoden `approval.get/resolve`.
- Adapter für Ausführungs-/Plugin-Methoden.
- Tests für das Prinzip „erste Antwort gewinnt“, Idempotenz, Ablauf, Autorisierung und Verbrauch.
- Noch keine Änderung des UI- oder Kanalverhaltens.

### PR 2: typisierte Aktionen und Kanal-Callbacks

- Typisierte Genehmigungs-, URL- und Web-App-Aktionen.
- Präsentations-Builder im Kern und Exporte des Plugin SDK.
- Transportprivate Callback-Codierung mit expliziter Eigentümerart.
- Dauerhafte Callback-Referenzen fester Größe für kanonische IDs, die Transportgrenzen überschreiten.
- Migration gebündelter Kanäle weg von der Ableitung aus Befehlstext und Genehmigungs-ID.
- Die kanonische Wahrheit der ersten Antwort auf der angeklickten Oberfläche sowie bestmögliche terminale Aktualisierungen aktiver nativer Oberflächen; die dauerhafte Terminalisierung von Kanalnachrichten bleibt eine nachfolgende Aufgabe.
- Tests für SDK und gebündelte Kanäle.

### PR 3: Deeplink für die Control UI

- Eigenständige authentifizierte Genehmigungsseite und Basispfad-berücksichtigendes Start-Routing.
- Bindung an das bereitstellende Gateway, ohne die gespeicherte Remote-Auswahl des Betreibers zu verändern.
- Genehmigungs-HTTP-Namensraum im Besitz des Kerns, einschließlich assetähnlicher IDs.
- Vom Gateway erstellte URL-Nutzlast und Abfrage des ausstehenden Status, bis Lebenszyklusereignisse bereitgestellt werden.
- Nachweise für mobile Breite, erneute Verbindung, konkurrierende Antworten, Neuladen und eingebundene Pfade.

### PR 4: native Clients

- iOS- und Android-Prüfoberflächen verwenden artbezogene Methoden `approval.get/resolve`; watchOS leitet prüfersichere Eingabeaufforderungen und Entscheidungen über das gekoppelte iPhone weiter.
- Die Watch bietet die von ihrem kompakten Weiterleitungsvertrag unterstützten Ausführungsentscheidungen: einmalig erlauben und ablehnen.
- Die kanonische terminale Wahrheit der ersten Antwort ersetzt den lokalen Status des versuchten Entscheids.
- Bei verlorenen oder mehrdeutigen Bestätigungen einer Auflösung bleiben Steuerelemente bis zum kanonischen Rücklesen gesperrt.
- Zuvor ausgelieferte Gateway-v4-Instanzen behalten die Ausführungsprüfung über einen eng begrenzten Fallback auf veraltete Methoden bei; ein oberflächenübergreifend beibehaltener terminaler Status erfordert die vereinheitlichten Methoden.
- Warnungen für Prüfende und Eigentümerkontext bleiben auf iPhone, Watch und Android sichtbar.
- Native Unit-, Build- und Plattformnachweise.

### PR 5: Weitergabe des Lebenszyklus an Vorfahren

- Ausstehende/terminale Zustellung von `session.approval` aus dem in PR 1 persistierten Zielgruppen-Snapshot.
- Abonnement der exakten Sitzung, Wiedergabe bei erneuter Verbindung und terminale Tombstones ohne Transkriptmutation oder Aufwecken des Agenten.
- Lebenszyklus-Callbacks werden nach dauerhaftem Einfügen/CAS ausgeführt und werden niemals zur Genehmigungsinstanz.
- Nachweise für verschachtelte Subagenten und erneute Verbindungen.

### PR 6: geschlossen fehlschlagendes Verhalten

- `node-invoke-plugin-policy.ts` und den eingebetteten Plugin-Broker von doppelter Entscheidungsbefugnis wegmigrieren.
- Strikte Semantik für Zeitüberschreitung, fehlerhafte Urteile, fehlende Routen, Bindungen und den Verbrauch einmaliger Erlaubnisse.
- Ausgelieferte freizügige Zeitüberschreitungseinstellungen als veraltet kennzeichnen, ohne sie zu berücksichtigen, nachdem eine Anfrage ausstehend ist.
- Nachweise für Konkurrenz zwischen mehreren Oberflächen und Fehlerinjektion.

### Nachfolgende Aufgabe: dauerhafte Bereinigung entfernter Nachrichten

- Zustellungs-Locators für weitergeleitete Nachrichten dauerhaft speichern und jede zugestellte Kanalnachricht nach einem Neustart in einen terminalen Zustand überführen.
- Diesen Transportlebenszyklus von der kanonischen Genehmigungsautorität und typisierten Präsentationsaktionen getrennt halten.

## Tests

Erforderliche fokussierte Abdeckung:

- Das erneute Öffnen von SQLite erhält ausstehende und terminale Projektionen.
- Zwei nebenläufige Resolver erzeugen genau einen CAS-Gewinner.
- Eine Wiederholung derselben Entscheidung ist idempotent erfolgreich; eine widersprüchliche Wiederholung gibt den protokollierten Gewinner zurück.
- Eine Auflösung zum oder nach dem Ablaufzeitpunkt kann nicht genehmigen.
- `allow-once` kann genau einmal verbraucht werden, ohne den terminalen Auditstatus zu löschen.
- Beim Start werden ältere Laufzeitepochen abgebrochen.
- Nicht autorisierte Suche und Auflösung legen die Existenz eines Datensatzes nicht offen.
- Verhalten der expliziten Prüfer-Zulassungsliste und des allgemeinen gekoppelten `operator.approvals`.
- Exec- und Plugin-Legacymethoden verwenden denselben Speicher.
- Gateway-Schemata für Anfordern/Auflisten/Abrufen/Auflösen und additive Ereignis-Payloads.
- Normalisierung typisierter Aktionen, Fallback-Darstellung, SDK-Exporte und Umschaltungen gebündelter Kanäle.
- Die Telegram-Callback-Codierung enthält transportinterne Daten und keine Ableitung aus Befehlszeichenfolgen.
- Direktes untergeordnetes Element, verzweigte Controller-/Anforderer-Eigentümer, verschachtelte Eigentümer, Neuzuweisung, Fallback auf Sitzungsfelder, Zyklus und Obergrenze der Zielgruppengröße.
- Angeforderte und terminale Zielgruppen-Arrays sind identisch.
- Eigentümerprojektionen verursachen weder Transkriptänderungen noch ein Aufwecken des Agenten.
- Die Control-UI-Route funktioniert unter `/` und einem konfigurierten Basispfad; eine Aktualisierung zeigt den ausstehenden oder terminalen Wahrheitszustand.
- Gleichzeitige Antworten über Control UI und Telegram zeigen einen Gewinner und beim Verlierer „anderweitig aufgelöst“.
- Native Genehmigungskennungen und Gateway-Eigentümerkennungen erhalten beim Routing und Abgleich die exakten UTF-8-Bytes.
- Die Aushandlung der nativen RPC-Familie bindet jede zugelassene Gateway-Route an genau eine kanonische oder Legacy-Familie und führt nach deren Verwendung niemals stillschweigend ein Downgrade durch.
- Verlorene native Auflösungsbestätigungen sperren Aktionen bis zum kanonischen Rücklesen; ein fehlgeschlagenes Rücklesen darf weder einen Gewinner erfinden noch eine Watch-Aktualisierung bestätigen.
- Die Korrelation von Watch-Snapshot-Anfragen wird nur für den exakt gekoppelten Gateway-Eigentümer und ein abgeschlossenes kanonisches iPhone-Rücklesen akzeptiert.
- Nachweis des Benutzerpfads über Testbox/Crabbox, einschließlich einer Genehmigungsseite für mobile Breite, Bereinigung von Telegram-Aktionen und eines vollständigen Durchlaufs für ausstehend/Auflösung/verspäteter Verlierer über Android, iPhone und Watch.

## Beobachtbarkeit

Strukturierte, inhaltsfreie Übergangsprotokolle mit Genehmigungs-ID, Art, Quellsitzungsschlüssel, Status, Grund und Latenz ausgeben. Niemals die Vorschau oder die unformatierte Bindung protokollieren.

Erfassen:

- Anzahl der Anforderungen nach Art;
- Anzahl terminaler Zustände nach Art/Status/Grund;
- Messwert für ausstehende Vorgänge;
- Latenz von der Anforderung bis zum terminalen Zustand;
- Ergebnisse von Auflösungsrennen: Gewinner, idempotente Wiederholung, Konflikt, abgelaufen;
- Anzahl der Zustellrouten und Ablehnungen wegen fehlender Route;
- Abbrüche verwaister Vorgänge beim Start;
- Zielgruppengröße.

Ein festgeschriebener Übergang gilt als erfolgreich, selbst wenn die spätere Ereigniszustellung fehlschlägt. Lebenszyklus-Abonnenten stellen den Zustand durch die Wiedergabe aus PR 5 und die kanonische Suche wieder her. Die dauerhafte Terminalisierung von Kanalnachrichten bleibt die oben genannte separate Folgeaufgabe.

## Offene Entscheidungen

1. **Extern erreichbarer Ursprung der Control UI.** Jeder Snapshot enthält den stabilen relativen `urlPath`. Eine absolute URL darf nur von einem zwischengespeicherten Tailscale-Serve-/Funnel-Standort bekannt gegeben werden, nachdem die Gateway-Freigabe erfolgreich war; `allowedOrigins`, Host-Header von Anfragen, `gateway.remote.url` und ausschließlich zur Anzeige dienende Loopback-/LAN-Kandidaten sind keine kanonischen Ursprünge. Telegram kann seinen authentifizierten Mini-App-Wrapper verwenden, um den Genehmigungspfad während des Bootstraps beizubehalten. Beliebige Reverse-Proxys bleiben ausschließlich relativ, bis ein separat geprüfter, expliziter Vertrag für öffentliche URLs vorliegt. Ein Kanal darf den Ursprung niemals erraten.
2. **Kompatibilitätsumstellung für strikte Exec-Zeitüberschreitungen.** Zeitüberschreitungen bei Plugin-Genehmigungen schlagen nun geschlossen fehl, und `timeoutBehavior` ist veraltet. Der verbleibende ausgelieferte `askFallback`-Vertrag erfordert eine explizite Prüfung durch Eigentümer und Sicherheitsverantwortliche, einen Changelog-Eintrag, Dokumentation sowie eine Migrations-/Veraltungsentscheidung, bevor er nach einer Zeitüberschreitung einer ausstehenden Anfrage die Ausführung nicht mehr autorisiert.
3. **Eingebetteter Modus ohne Gateway.** Empfehlung: zunächst ausschließlich lokal halten und ihn anschließend zum Client des kanonischen Dienstes machen, sobald ein Gateway vorhanden ist. Keinen Deep Link bewerben, den kein Server auflösen kann.
