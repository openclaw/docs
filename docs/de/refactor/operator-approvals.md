---
read_when:
    - Änderung des Genehmigungslebenszyklus, der Speicherung, des Protokolls oder der Autorisierung für exec oder Plugins
    - Hinzufügen von Genehmigungslinks oder nativen Genehmigungssteuerelementen zu einem Kanal
    - Übertragung von Genehmigungen untergeordneter Sitzungen in übergeordnete oder Orchestrator-Ansichten
summary: Konzept für dauerhafte, direkt verlinkbare Genehmigungen in der Control UI, nativen Apps, Kanälen und übergeordneten Sitzungen
title: Bedienerfreigaben über mehrere Oberflächen hinweg
x-i18n:
    generated_at: "2026-07-24T04:08:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9defdaada1911df1184f64429e1787c4881e735c433d6dbc30a5946e11cc7cce
    source_path: refactor/operator-approvals.md
    workflow: 16
---

# Betreiberfreigaben über mehrere Oberflächen hinweg

Dieser Entwurf verfolgt [#103505](https://github.com/openclaw/openclaw/issues/103505). Er ersetzt die prozesslokale Freigabeautorität durch einen einzigen, dem Gateway zugeordneten, SQLite-gestützten Lebenszyklus. Jede dem Gateway zugeordnete Ausführungs- oder Plugin-/Tool-Freigabe erhält eine stabile ID, eine authentifizierte Control-UI-Route, eine atomare Auflösung nach dem Prinzip „die erste Antwort gewinnt“ sowie ausschließlich für Betreiber bestimmte Projektionen in die Sitzungs-Streams ihrer Quell- und übergeordneten Sitzungen.

Inline-Aktionen und Deep Links bestehen nebeneinander. Es gibt keinen Umschalter für den Freigabemodus.

## Ziele

- Ein dauerhaftes Freigabeobjekt für Ausführungs- und Plugin-/Tool-Sperren.
- Stabile `${controlUiBasePath}/approve/{approvalId}`-Route.
- Auflösung über jede autorisierte Control UI, native App oder Kanaloberfläche.
- Atomares Verhalten nach dem Prinzip „die erste Antwort gewinnt“ über gleichzeitig verwendete Oberflächen hinweg.
- Idempotente identische Wiederholungsversuche; widersprüchliche verspätete Antworten können die Gewinnerantwort nicht überschreiben.
- Zeitüberschreitungen, fehlerhafte vertrauenswürdige Entscheidungen, fehlende Routen, Abbrüche und Neustarts führen zu einer sicheren Ablehnung.
- Anforderungs- und Abschlussereignisse erreichen die Quellsitzung und alle relevanten übergeordneten bzw. Orchestrator-Eigentümer.
- Kanäle erhalten typisierte Freigabe- und Navigationsaktionen; Transport-Rückrufdaten bleiben kanalprivat.
- Bestehende Gateway-Methoden für Ausführungen und Plugins bleiben kompatibel, während ihre Implementierung in einem einzigen Dienst zusammengeführt wird.

## Nichtziele

- Persistieren oder Fortsetzen der blockierten Tool-Ausführung selbst über einen Gateway-Neustart hinweg.
- Verwendung einer Freigabe-ID oder URL als Bearer-Anmeldedaten.
- Anhängen von Freigabeaufforderungen an für das Modell sichtbare Transkripte oder Aktivieren übergeordneter Agenten.
- Verlagern von Freigaberichtlinien, Produktbefehlen oder Prüferautorisierung in Kanal-Plugins.
- Klonen des Freigabestatus pro Kanal, Gerät oder übergeordneter Instanz.
- Neugestaltung von Ausführungs-Zulassungslisten, der Zusammensetzung von Plugin-Richtlinien oder der `allow-always`-Persistenz, außer soweit dies erforderlich ist, um abschließende Ergebnisse eindeutig zu machen.
- Remote-Erreichbarkeit einer eingebetteten TUI ohne Gateway im ersten Ausbauschritt. Sie bleibt ausschließlich lokal und muss sicher ablehnen, wenn kein Prüfer vorhanden ist.

## Ausgangsbasis vor der Einführung und Evidenzübersicht

Diese Tabelle dokumentiert den Implementierungsstand zum Zeitpunkt der Eröffnung von #103505. Die nachfolgenden Einführungsabschnitte beschreiben die dauerhafte Registry, typisierte Aktionen, die Deep-Link-Seite und die auf dieser Ausgangsbasis aufbauenden Erweiterungen nativer Clients.

| Oberfläche        | Einstiegspunkt und Eigentümer der Ausgangsbasis                                                                                                                | Verhalten und Lücke der Ausgangsbasis                                                                                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agentenausführung | `src/agents/bash-tools.exec-approval-request.ts`, `src/agents/bash-tools.exec-host-shared.ts`                                                                   | Die zweiphasige `exec.approval.*`-Registrierung verhindert einen frühen `/approve`-Race, eine Zeitüberschreitung kann über `askFallback` jedoch weiterhin zu einer Zulassung führen.        |
| Plugin-Tool-Sperre | `src/agents/agent-tools.before-tool-call.ts`                                                                                                                    | Fordert `plugin.approval.*` an; `timeoutBehavior: "allow"` kann eine Sperre nach einer Zeitüberschreitung freigeben. Der eingebettete Modus besitzt in `src/infra/embedded-plugin-approval-broker.ts` eine separate prozesslokale Autorität. |
| Plugin-Node-Sperre | `src/gateway/node-invoke-plugin-policy.ts`                                                                                                                     | Erstellt und überträgt direkt über den Plugin-Manager und dupliziert dadurch einen Teil des Lebenszyklus der Servermethode.                                                                  |
| Gateway-Autorität | `src/gateway/server-aux-handlers.ts`, `src/gateway/exec-approval-manager.ts`, `src/gateway/server-methods/approval-shared.ts`                                   | Separate Manager für Ausführungen und Plugins verwenden prozesslokale Maps. Abschlusseinträge bleiben 15 Sekunden erhalten. Das Prinzip „die erste Antwort gewinnt“ gilt nur innerhalb eines Prozesses. |
| Gateway-Protokoll | `packages/gateway-protocol/src/schema/exec-approvals.ts`, `packages/gateway-protocol/src/schema/plugin-approvals.ts`, `src/gateway/methods/core-descriptors.ts` | Für Ausführungen gibt es nur für ausstehende Einträge `get`; für Plugins gibt es kein `get`; eine typunabhängige Abschlusssuche für einen Deep Link fehlt.                     |
| Zustellung        | `src/infra/exec-approval-channel-runtime.ts`, `src/infra/approval-native-runtime.ts`, `src/infra/approval-handler-runtime.ts`                                   | Unterstützt Ursprungsrouting, Direktnachrichten an Freigebende, Wiedergabe ausstehender Einträge, native Handler und prozessinterne Abschlussbereinigung. Eine separate Folgeänderung ergänzt den dauerhaften Abschlussabgleich. |
| Portable Aktionen | `src/interactive/payload.ts`, `src/plugin-sdk/interactive-runtime.ts`, `src/plugin-sdk/approval-reply-runtime.ts`                                               | Freigabeschaltflächen sind Befehlsaktionen mit `/approve ...`; URL- und Web-App-Ziele sind untypisierte Schaltflächenfelder.                                                                    |
| Telegram          | `extensions/telegram/src/approval-handler.runtime.ts`, `extensions/telegram/src/button-types.ts`                                                                | Der Renderer analysiert Befehlstext, um die Freigabesemantik zu erkennen, bevor er private Rückrufdaten erzeugt.                                                                              |
| Control UI        | `ui/src/app/exec-approval.ts`, `ui/src/app/overlays.ts`, `ui/src/components/exec-approval.ts`                                                                   | Die Freigabeoberfläche ist ein globales modales Fenster. `ui/src/app-route-paths.ts` und `ui/src/app-routes.ts` verwenden exakte Routen und leiten unbekannte Pfade zu Chat um.                   |
| Sitzungseigentum  | `src/agents/subagent-registry.types.ts`, `src/agents/subagent-registry-read.ts`, `src/config/sessions/types.ts`                                                 | Controller-, Anforderer-, explizites übergeordnetes und Legacy-Spawn-Eigentum sind vorhanden, Freigabeereignisse werden jedoch nicht in diese Sitzungs-Streams projiziert.                    |
| Gemeinsamer Status | `src/state/openclaw-state-schema.sql`, `src/state/openclaw-state-db.ts`                                                                                        | Bestehende unmittelbare Transaktionen und bedingte Kysely-Aktualisierungen unterstützen dauerhaftes Compare-and-Set in `state/openclaw.sqlite`.                                                |

Repräsentative aktuelle Tests umfassen `src/gateway/exec-approval-manager.test.ts`, `src/gateway/server-methods/approval-shared.test.ts`, `src/agents/bash-tools.exec-gateway-approval.e2e.test.ts`, `extensions/telegram/src/approval-handler.runtime.test.ts` und `ui/src/e2e/approval-flow.e2e.test.ts`.

Das Plugin-SDK bleibt die einzige Kanal-/Plugin-Grenze. Änderungen an Freigabelaufzeit und -darstellung müssen über die bestehenden Unterpfade `src/plugin-sdk/approval-*.ts` und `src/plugin-sdk/interactive-runtime.ts` exportiert werden; der Produktionscode von Plugins darf keine Gateway-Interna importieren.

## Bestehende Ansätze

Omnigent bietet nützliche UX- und Fehlersemantiken:

- [`approval.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/runtime/policies/approval.py) hält ASK an, wendet Zeitüberschreitungen pro Richtlinie an und behandelt nur eine exakte Annahme als Freigabe.
- [`sessions.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/routes/sessions.py) enthält die serverseitige native Harness-Sperre und die Projektion von Anforderungen und Auflösungen auf übergeordnete Instanzen.
- [`ApprovePage.tsx`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/web/src/pages/ApprovePage.tsx) stellt die eigenständige mobile Freigabeseite bereit.

Die Aussage zur Speicherung darf nicht unkritisch übernommen werden. Der derzeit aktive ausstehende Status ist in [`_elicitation_registry.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/_elicitation_registry.py) prozesslokal, und die ungenutzte Tabelle für ausstehende Einträge wird durch [`e3b1f2a4c9d7_drop_pending_tool_calls_table.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/db/migrations/versions/e3b1f2a4c9d7_drop_pending_tool_calls_table.py) entfernt. OpenClaw geht bewusst weiter: SQLite ist maßgeblich, und jeder abschließende Übergang ist ein Compare-and-Set in der Datenbank.

## Architektur und Eigentum

Das Gateway ist für den Lebenszyklus verantwortlich:

1. Ein Agent, Plugin-Hook oder eine Node-Richtlinie stellt eine typspezifische Anforderung und eine prozesslokale Ausführungsbindung bereit.
2. Das Gateway validiert sie und erstellt eine bereinigte Projektion für Prüfer.
3. Der Freigabedienst berechnet eine Zielgruppe aus Quelle und Eigentümern, fügt die kanonische Zeile ein und registriert anschließend den prozessinternen Wartemechanismus.
4. Nach dem dauerhaften Einfügen veröffentlicht das Gateway bestehende Freigabeereignisse, Sitzungsprojektionen, Kanalbenachrichtigungen und native Push-Benachrichtigungen.
5. Jede Oberfläche löst über denselben Dienst auf.
6. Der Dienst schreibt einen abschließenden Übergang fest, aktiviert den Laufzeit-Wartemechanismus und veröffentlicht die Abschlussprojektionen.
7. Eine fehlgeschlagene Ereigniszustellung macht die festgeschriebene Entscheidung niemals rückgängig; Clients stellen den Zustand über `approval.get` oder die Listenwiedergabe wieder her.

Eigentumsgrenzen:

- `src/gateway/`: Freigabedienst, Autorisierung, RPC-Adapter, URL-Erstellung, Lebenszyklus des Wartemechanismus und Ereignisveröffentlichung.
- `src/state/`: gemeinsames Schema und generierte Kysely-Typen.
- `src/infra/`: bereinigte Freigabe-View-Models und Erstellung portabler Darstellungen.
- `src/agents/`: Anfordern, Warten und Anwenden der zurückgegebenen Entscheidung; keine Persistenz.
- `src/channels/` und `extensions/*`: typisierte Aktionen darstellen, Kanalbenutzer autorisieren, private Rückrufe codieren und zugestellte Steuerelemente aktualisieren.
- `src/plugin-sdk/`: ausschließlich öffentliche Freigabe- und Darstellungsverträge.
- `ui/`: eigenständige Seite und bestehende Warteschlangen-/Modal-Clients.

Der prozessinterne Wartemechanismus dient der Benachrichtigung und ist keine Autorität. Die Registrierung fügt die Zeile ein und installiert den Wartemechanismus synchron, bevor die Anforderung veröffentlicht wird, sodass sich zwischen diesen Schritten keine Auflösung einschieben kann. Jeder spätere Auflöser schreibt die Entscheidung über SQLite fest, bevor er diesen Wartemechanismus beendet.

## Persistenter Datensatz

Eine einzelne `operator_approvals`-Tabelle zur gemeinsamen Statusdatenbank hinzufügen.

| Spalte                                             | Zweck                                                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval_id`                                      | Global eindeutige kanonische ID. Bestehende Ausführungs-IDs und `plugin:`-IDs zur Protokollkompatibilität beibehalten, aber niemals die Art aus dem Präfix ableiten.      |
| `resolution_ref`                                   | Eindeutiger vollständiger SHA-256-base64url-Lokator für Transport-Callbacks, die die kanonische ID nicht übertragen können. Er stellt weder eine Autorisierung noch eine öffentliche URL-ID dar. |
| `kind`                                             | Geschlossener `exec \| plugin`-Diskriminator.                                                                                                        |
| `status`                                           | Geschlossener `pending \| allowed \| denied \| expired \| cancelled`-Zustand.                                                                          |
| `presentation_json`                                | Validierte, mit der Art gekennzeichnete Prüferprojektion. Unverarbeitete Laufzeitanfragen, Befehlsbindungen und Callback-Nutzdaten bleiben prozesslokal.               |
| `source_agent_id`, `source_session_key`            | Quellidentität und Anker der Sitzungsprojektion. Der Sitzungsschlüssel ist dauerhaft, die rotierende Sitzungs-UUID hingegen nicht.                                          |
| `audience_session_keys_json`                       | Geordnetes, dedupliziertes JSON-Array, das durch die begrenzte Breitensuche durch die Eigentümerstruktur erzeugt wird. Angeforderte und terminale Ereignisse verwenden denselben Snapshot. |
| `requested_by_device_id`, `requested_by_client_id` | Dauerhafte Anforderer-/Audit-Metadaten. Die Verbindungs-ID verbleibt im Arbeitsspeicher und ist kein oberflächenübergreifender Principal.                                         |
| `reviewer_device_ids_json`                         | Optionale, ausdrücklich als Ziel angegebene Prüfergeräte, die ausschließlich von der vertrauenswürdigen Genehmigungslaufzeit bereitgestellt werden.                                                  |
| `runtime_epoch`                                    | Prozessepoche, der die geparkte Ausführung gehört; wird verwendet, um verwaiste Zeilen nach einem Neustart abzubrechen.                                                     |
| `created_at_ms`, `expires_at_ms`, `updated_at_ms`  | Maßgebliche Zeitangaben.                                                                                                                         |
| `decision`                                         | Explizite Benutzerentscheidung, sofern eine vorliegt.                                                                                                       |
| `terminal_reason`                                  | Geschlossener Grund wie `user`, `timeout`, `malformed-verdict`, `no-route`, `run-aborted` oder `gateway-restart`.                                |
| `resolved_at_ms`, `resolver_kind`, `resolver_id`   | Gewinner- und Audit-Identität werden serverseitig aufbewahrt. Prüferprojektionen lassen unverarbeitete Resolver-IDs aus.                                           |
| `consumed_at_ms`, `consumed_by`                    | Separate Wiederholungssperre für `allow-once`; das Verbrauchen darf die aufgezeichnete Entscheidung nicht löschen.                                                       |

Erforderliche Indizes:

| Index                                      | Zweck                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| Eindeutiger `(resolution_ref)`                  | Spaltenübergreifende Mehrdeutigkeit von `approval_id`/`resolution_ref` beim Einfügen zurückweisen. |
| `(status, expires_at_ms)`                  | Ausstehende Genehmigungen finden und maßgebliche Fristen abgleichen.               |
| `(source_session_key, created_at_ms DESC)` | Kürzlich erfolgte Genehmigungen für eine Quellsitzung erneut wiedergeben.                             |
| `(resolved_at_ms)`                         | Aufbewahrte terminale Genehmigungen gemäß der festen Aufbewahrungsrichtlinie bereinigen.  |

Zielgruppen-Arrays sind klein und begrenzt. Die nach Sitzungen gefilterte Wiederholung wählt zunächst über Kysely sichtbare ausstehende Zeilen aus und dekodiert und filtert anschließend die begrenzten Zielgruppen-Arrays im Anwendungscode; sie verwendet weder Zeichenfolgenabgleiche noch rohe SQL-JSON-Abfragen.

Terminale Zeilen werden 30 Tage lang aufbewahrt, entsprechend der Aufbewahrungsdauer für Metadaten-Audits in `src/audit/audit-event-store.ts`. Die Bereinigung ist eine feste Wartungsrichtlinie und keine neue Konfigurationsoberfläche. Die Datenbank ist privater lokaler Control-Plane-Zustand, doch Prüfer-APIs dürfen niemals die vollständige gespeicherte Anfrage oder Laufzeitbindung offenlegen.

## Zustandsautomat und Compare-and-Set

Nur diese Übergänge sind gültig:

- `pending -> allowed`: explizites `allow-once` oder `allow-always`.
- `pending -> denied`: explizite Ablehnung, vertrauenswürdiges fehlerhaftes terminales Urteil oder kein Zustellungsweg.
- `pending -> expired`: maßgebliche Frist erreicht.
- `pending -> cancelled`: Ausführungsabbruch, ordnungsgemäßes Herunterfahren oder Wiederherstellung verwaister Einträge nach einem Neustart.

Jeder nicht zugelassene terminale Zustand hat als wirksames Urteil eine Ablehnung.

Die Auflösung verwendet eine einzige sofortige SQLite-Transaktion und eine bedingte Kysely-Aktualisierung, die Folgendem entspricht:

```sql
UPDATE operator_approvals
SET status = ?, decision = ?, terminal_reason = ?, resolved_at_ms = ?
WHERE approval_id = ?
  AND status = 'pending'
  AND expires_at_ms > ?;
```

Wenn die Aktualisierung keine Zeile betrifft, liest dieselbe Transaktion den Datensatz:

- Fehlend oder nicht autorisiert: „Nicht gefunden“ zurückgeben; die Existenz nicht offenlegen.
- Noch ausstehend, aber Frist erreicht: per Compare-and-Set auf `expired` setzen und anschließend diese terminale Zeile zurückgeben.
- Dieselbe aufgezeichnete Entscheidung: idempotenten Erfolg mit dem aufgezeichneten Gewinner zurückgeben.
- Abweichende Entscheidung: Die einheitliche API gibt `applied: false` mit dem aufgezeichneten Gewinner zurück; Legacy-Adapter behalten `APPROVAL_ALREADY_RESOLVED` bei, sofern ihr ausgelieferter Vertrag dies erfordert.
- Beliebiger terminaler Zustand: niemals ändern.

`now == expires_at_ms` ist abgelaufen. Die Gateway-Zeit ist maßgeblich.

Die Ausführung von `allow-once` verwendet ein zweites CAS über `consumed_at_ms IS NULL`, das an den bestehenden exakten Befehls-/Systemausführungskontext gebunden ist. Die Genehmigungszeile bleibt nach dem Verbrauch als Audit-Datensatz erhalten.

Fehlerhafte HTTP-/RPC-Eingaben, die nicht authentifiziert werden können oder keine Genehmigung identifizieren, werden ohne Änderung zurückgewiesen und können niemals eine Genehmigung erteilen. Ein fehlerhaftes terminales Urteil, das von einem vertrauenswürdigen Harness/Waiter für eine bekannte Genehmigung empfangen wird, führt zum Übergang nach `denied`.

## Gateway-API

Artunabhängige Prüfermethoden hinzufügen:

| Methode                                    | Vertrag                                                                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval.get { id }`                     | Gibt eine sichtbare ausstehende oder aufbewahrte terminale Projektion zurück.                                                                                                                                                          |
| `approval.resolve { id, kind, decision }` | Akzeptiert die kanonische ID oder eine Transportreferenz fester Größe und führt anschließend Autorisierung, Validierung der Art und zulässigen Entscheidung, Fristabgleich und terminales CAS aus. Die Antwort enthält immer die kanonische ID. |

Nach einem erfolgreichen CAS wird die gespeicherte Projektion sofort zurückgegeben. Legacy-Ereignisse, Kanalweiterleitungen und Push-Terminalisierer sind nachgelagerte Best-Effort-Vorgänge; eine langsame oder fehlgeschlagene Oberfläche darf die erfolgreiche Antwort weder verzögern noch zurückrollen.

Die artspezifische Anfragevalidierung verbleibt in `exec.approval.request` und `plugin.approval.request`. Bestehende `exec.approval.get/list/waitDecision/resolve` und `plugin.approval.list/waitDecision/resolve` werden zu Protokollgrenzen-Adaptern für den kanonischen Dienst, da sie ausgelieferte Gateway-API sind. Interne Aufrufer werden in derselben Änderung zum Dienst migriert.

Eine Prüferprojektion ist eine gekennzeichnete Union:

```ts
type OperatorApproval = {
  id: string;
  status: OperatorApprovalStatus;
  presentation:
    | { kind: "exec"; commandText: string /* safe exec preview */ }
    | { kind: "plugin"; title: string; description: string /* safe plugin preview */ };
  // common lifecycle fields
};
```

Der stabile Pfad wird abgeleitet und nicht gespeichert. `approval.get` gibt `urlPath` zurück; Oberflächen, denen ein genehmigter öffentlicher Ursprung bekannt ist, können zusätzlich einen absoluten `url` erhalten. Prüfer-Snapshots lassen Quell- und Zielgruppen-Sitzungsschlüssel aus. Das Gateway hält diese Routing-Schlüssel serverseitig für die separate `session.approval`-Projektion vor.

## Ereignisse und portable Aktionen

PR 1 behält die ausgelieferten Ereignisnamen, Nutzdaten und bestehenden datensatzbezogenen Empfängerfilter bei:

- `exec.approval.requested`
- `exec.approval.resolved`
- `plugin.approval.requested`
- `plugin.approval.resolved`

Diese Legacy-Ereignisse können die vollständige Laufzeitanfrage enthalten und dürfen daher nicht an alle genehmigungsbezogenen Clients verteilt werden. PR 5 fügt gekennzeichnete Lebenszyklusfelder (`status`, `sourceSessionKey`, `urlPath`, terminale Metadaten und einen darstellungsbezogenen `kind`) über die bereinigte Lebenszyklusprojektion hinzu, anstatt die Zustellung von Legacy-Ereignissen auszuweiten.

Ein genehmigungsbezogenes `session.approval`-Projektionsereignis hinzufügen. Das kanonische Ereignis wird einmal mit den gespeicherten Zielgruppenschlüsseln veröffentlicht; Abonnenten der exakten Sitzung erhalten dasselbe Ereignis für jeden übereinstimmenden Schlüssel:

- `sessionKey`: Stream, der die Projektion empfängt.
- `sourceSessionKey`: untergeordnete Instanz/Quelle, die die Sperre ausgelöst hat.
- `phase`: `pending \| terminal`, anhand des Genehmigungsstatus unterschieden.
- eine sichere `OperatorApproval`-Projektion.

Clients melden sich mit `sessions.messages.subscribe { key, agentId?, includeApprovals: true }` an. Die erfolgreiche Antwort fügt einen `approvalReplay` hinzu, der bis zu 1.000 derzeit ausstehende Genehmigungen für genau diesen Stream-Schlüssel enthält, zu deren Prüfung der abonnierende Client ebenfalls datensatzbezogen autorisiert ist. `truncated: false` macht die gefilterte Wiederholung maßgeblich, und Clients, die die Verbindung wiederherstellen, ersetzen ihren lokalen Satz ausstehender Einträge damit; `truncated: true` ist ein Überlastungssignal, und Clients müssen noch nicht gesehene lokale Einträge beibehalten, bis sie durch eine kanonische Suche oder spätere Lebenszyklusereignisse geklärt werden. Ein späterer dauerhafter Timeout, der während der Wiederholung erkannt wird, sendet terminale Tombstones ausschließlich an abonnierte, datensatzbezogen autorisierte Zielgruppen, bevor der neue Snapshot zurückgegeben wird. `operator.admin` kann sich direkt anmelden; enger gefasste Clients benötigen sowohl eine gekoppelte Geräteidentität als auch `operator.approvals`. Ein Sitzungsabonnement allein gewährt niemals Sichtbarkeit von Genehmigungen.

Das Ereignis unter `operator.approvals` in `src/gateway/server-broadcast.ts` registrieren. Die Projektion ist rein beobachtend: Sie hängt niemals Transkriptzeilen an, gibt kein `sessions.changed` aus und weckt keinen Agenten.

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

Core erstellt typisierte Entscheidungsaktionen und einen separaten Review-Link, wenn ein genehmigter absoluter Control-UI-Ursprung verfügbar ist. Channels kodieren eine Genehmigungsaktion in ihrem eigenen Callback-Format und senden die Entscheidung an den kanonischen Dienst. Ein Callback verwendet die exakte kanonische ID, wenn sie hineinpasst; andernfalls verwendet er den eindeutigen vollständigen Digest `resolution_ref` der Zeile. Die Referenz ist nur ein kompakter Suchschlüssel: Die normale Gateway-Authentifizierung, Datensatzautorisierung, explizite Art, Validierung zulässiger Entscheidungen, Fristabgleich und First-Answer-CAS gelten weiterhin. Channels dürfen IDs nicht kürzen, Hash-Präfixe auflösen, `/approve`-Text parsen oder die Art aus einem ID-Präfix ableiten.

Behalten Sie `button.url`, `button.webApp` und befehlsbasierte Genehmigungssteuerelemente als veraltete Kompatibilitätseingaben des Plugin SDK bei. Normalisieren Sie sie an der SDK-Grenze; migrieren Sie jeden gebündelten internen Aufrufer im selben PR. `/approve {id} {decision}` bleibt ein Text-Fallback und CLI-/Chat-Befehl, nicht der semantische Vertrag für Schaltflächen.

## Control UI

Die Route lautet `${basePath}/approve/{approvalId}`. Die ID ist der einzige Pfadparameter; die Identität der Quellsitzung stammt aus dem Datensatz.

Da der aktuelle Router exakte statische Routen verwendet und unbekannte Pfade zu Chat umschreibt, muss dieser Deep Link in `ui/src/app/bootstrap.ts` vor der normalen Routennormalisierung erkannt werden. Verwenden Sie die normale Gateway-/Authentifizierungseinrichtung wieder, rendern Sie jedoch eine eigenständige Genehmigungsseite außerhalb der Seitenleisten-Shell und des globalen Modals.

Das Dokument gehört dem Gateway, das seine URL bereitgestellt hat. Seine anfängliche Verbindung ignoriert die persistierte Remote-Gateway-Auswahl der vollständigen App, ohne die Einstellungen dieser Auswahl zu ändern oder zu kopieren; nur die Authentifizierung bleibt auf die Sitzung des bereitstellenden Gateway beschränkt. Vertrauenswürdige native Authentifizierung oder eine separat bestätigte `gatewayUrl`-Überschreibung kann das Ziel ändern. Core reserviert den einsegmentigen Namensraum `/approve` vor Plugin-HTTP-Routen und der Erkennung statischer Erweiterungen, einschließlich IDs, die auf `.json` oder `.js` enden; wenn die Bereitstellung der Control UI deaktiviert ist, schlägt die reservierte Route geschlossen mit `404` fehl. Behalten Sie die Seite im Haupt-Bundle der Control UI, damit ein fehlgeschlagener Lazy Chunk eine Sicherheitsentscheidung nicht dauerhaft auf einem Spinner festhält.

Seitenzustände:

- wird geladen
- Authentifizierung erforderlich
- ausstehend
- wird entschieden
- hier genehmigt oder abgelehnt
- anderweitig entschieden
- abgelaufen
- abgebrochen
- verboten/nicht gefunden
- Verbindungsfehler mit Wiederholungsoption

Die Seite ruft Gateway-RPC auf, keine zweite nicht authentifizierte REST-API. Beim Aktualisieren des Browsers wird der persistente Zustand erneut gelesen. Gateway-Anmeldedaten werden niemals in der URL, der Abfrage oder dem Fragment platziert.

## Autorisierung und Datenschutz

Die URL ist ein Locator, keine Autorität. Die Entscheidung erfordert:

1. authentifizierte Gateway-Verbindung;
2. `operator.approvals` oder `operator.admin`;
3. Autorisierung des Prüfers auf Datensatzebene.

Regeln auf Datensatzebene:

- `operator.admin` darf prüfen.
- `reviewer_device_ids` ist maßgeblich, wenn vorhanden. Nur ein aufgeführtes gekoppeltes
  `operator.approvals`-Gerät darf prüfen; das anfordernde Gerät hat keinen impliziten
  Zugriff, sofern es nicht ebenfalls aufgeführt ist.
- Ohne explizite Prüferliste darf das anfordernde gekoppelte
  `operator.approvals`-Gerät seinen eigenen Datensatz prüfen.
- Echte Legacy-Datensätze ohne Bindung an Anforderer oder Prüfer behalten eine breite
  Sichtbarkeit für gekoppelte Geräte, damit Upgrades bereits ausstehende Arbeit nicht unerreichbar machen.
- Interne Laufzeitumgebungen ohne Gerät dürfen über die bereichsgebundene
  Genehmigungs-Laufzeitverbindung entscheiden, aber nicht lesen. Diese Autorität stammt ausschließlich vom
  serverseitig authentifizierten Laufzeittoken; öffentliche `approval.resolve`-Felder können
  es nicht ausstellen.
- Die Eigentümerschaft der aktiven Anfordererverbindung bleibt für Legacy-Adapter gültig; sie wird
  niemals aus einem übereinstimmenden Clientnamen abgeleitet.
- Die Zielgruppenzugehörigkeit ändert nur die Darstellung. Sie erweitert niemals die Autorisierung.

`approval.get` stellt nur die bereinigte Prüferprojektion bereit und lässt interne Routing-Schlüssel für Quelle und Zielgruppe aus. Das `session.approval`-Ereignis von PR 5 enthält sein einziges Ziel `sessionKey` sowie `sourceSessionKey`, nachdem das Gateway den persistierten Zielgruppen-Snapshot serverseitig angewendet hat. Bestehende Exec-/Plugin-Ereignisse behalten ihre historischen Nutzdaten und eingeschränkten Empfänger bei, bis die Verbraucher migriert sind. Die ausführbare Anforderung, Befehlsbindung und Fortsetzung verbleiben ausschließlich im prozesslokalen Waiter. Die persistente Zeile enthält die sichere Darstellung sowie Lebenszyklus-, Routing- und Audit-Metadaten; sie speichert niemals unverarbeitete Umgebungswerte, Anmeldedaten, Authentifizierungsheader oder Channel-Callback-Daten.

## Zielgruppenprojektion

Berechnen Sie die Zielgruppe einmal vor dem Einfügen und persistieren Sie den geordneten Snapshot. Eigentümerschaft ist ein Graph und nicht immer eine einzelne übergeordnete Kette: Ein untergeordnetes Element kann sowohl einen aktuellen Controller als auch einen ursprünglichen Anforderer haben, und diese Eigentümer können zu unterschiedlichen Wurzeln führen.

Verwenden Sie eine deterministische Breitensuche:

1. Initialisieren Sie die Warteschlange mit dem Schlüssel der Quellsitzung.
2. Lesen Sie für jeden aus der Warteschlange entnommenen Schlüssel die neueste Zeile der Subagent-Registry und fügen Sie beide unterschiedlichen Eigentümerschaftskanten in fester Reihenfolge zur Warteschlange hinzu: `controllerSessionKey`, dann `requesterSessionKey`.
3. Wenn eine verwendbare Registry-Zeile vorhanden ist, folgen Sie nicht zusätzlich der möglicherweise nach einer Steuerung veralteten Abstammung des Sitzungseintrags. Fügen Sie andernfalls die einzelne aktuelle Fallback-Kante `parentSessionKey ?? spawnedBy` zur Warteschlange hinzu.
4. Normalisieren und deduplizieren Sie beim Einreihen, sodass der erste und kürzeste Pfad gewinnt.
5. Beenden Sie bei 64 eindeutigen Schlüsseln; diese Begrenzung der Zielgruppengröße begrenzt zugleich die Traversierungstiefe.

Die Registry-Quelle ist `src/agents/subagent-registry-read.ts`; Eigentümerschaftsfelder sind in `src/agents/subagent-registry.types.ts` definiert. Sitzungs-Fallback-Felder sind in `src/config/sessions/types.ts` definiert.

Anforderungs- und Abschlussprojektionen verwenden dieselbe persistierte Zielgruppe, selbst wenn sich Fokus- oder Controller-Eigentümerschaft ändert, während die Genehmigung aussteht. Dies gewährleistet die abschließende Bereinigung für jeden Zielgruppen-Sitzungsstream, der die Anforderungsprojektion erhalten hat. Die Entscheidung zielt immer auf die ID der Quellgenehmigung; Zielgruppensitzungen erhalten niemals einen geklonten Genehmigungszustand. Die Bereinigung weitergeleiteter Channel-Nachrichten bleibt die nachstehende separate Nacharbeit mit Zustellungs-Locator.

Schreiben Sie nicht ausschließlich aufgrund einer Genehmigung Transkriptnachrichten, injizieren Sie keine System-Prompts, starten Sie keine Eigentümer-Turns und geben Sie kein `sessions.changed` aus.

## Konvergenz bereitgestellter Oberflächen

Native Genehmigungs-Handler bewahren ihre Einträge für zugestellte Nachrichten bereits lange genug auf, um aktive Steuerelemente zu ersetzen oder außer Betrieb zu nehmen. Generische weitergeleitete Genehmigungsnachrichten verwerfen derzeit `MessageReceipt`, sodass eine Entscheidung auf einer anderen Oberfläche ihre alten Steuerelemente weiterhin als ausstehend erscheinen lassen kann. Eine separate Nacharbeit schließt diese Lücke mit einer untergeordneten Tabelle `operator_approval_deliveries` in der gemeinsamen Zustandsdatenbank.

Jede Zeile speichert die Genehmigungs-ID, eine eindeutige Zustellungs-ID, Channel/Konto/exakte Route, einen begrenzten JSON-validierten Channel-privaten Nachrichten-Locator, Zustellungszeitstempel und den Abschlusszustand. Sie speichert niemals Callback-Daten, Entscheidungstoken oder unverarbeitete Genehmigungsanforderungen. Der Channel besitzt die Locator-Kodierung und Nachrichtenmutation; Core besitzt den kanonischen Status, die Zielauswahl, die Wiederholungsrichtlinie und den abschließenden Fallback-Text.

Zustellungsregistrierung und abschließende Entscheidung sind sicher gegenüber Wettlaufsituationen:

1. Nachdem das Senden einer ausstehenden Nachricht seine Empfangsbestätigung zurückgegeben hat, fügen Sie den Zustellungs-Locator ein und lesen Sie den Status der übergeordneten Genehmigung in einer Transaktion.
2. Wenn das übergeordnete Element bereits abgeschlossen ist, planen Sie eine sofortige Finalisierung, statt die verspätete Zustellung als ausstehend zu belassen.
3. Jeder bestätigte Abschlussübergang plant separat alle nicht finalisierten Zustellungszeilen; verwerfbare Broadcasts sind nicht der Auslöser.
4. Ein Channel-Finalisierer meldet `replaced`, `retired` oder `unsupported`. „Ersetzt“ unterdrückt eine doppelte Abschlussnachricht; „außer Betrieb genommen“ sendet die bestehende abschließende Folgenachricht; „nicht unterstützt“ oder ein Fehler greift auf den Fallback zurück, ohne das Genehmigungs-CAS zurückzusetzen.
5. Beim Start werden abgeschlossene Genehmigungen mit unfertigen Zustellungen erneut versucht, wodurch die Bereinigung einen Gateway-Neustart übersteht.

Dieser Transportlebenszyklus ist ein optionaler Hook für Zustellungsadapter, kein Renderer und keine modellseitige Nachrichtenaktion. QQ-C2C-/Gruppennachrichten verfügen derzeit über keine API zum Bearbeiten, Löschen oder Leeren der Tastatur; dieser Adapter bleibt nicht unterstützt und kann die kanonische Wahrheit erst nach einem späteren Klick anzeigen, bis der Transport eine Mutations-API erhält.

## Neustart-, Zeitüberschreitungs- und Routensemantik

SQLite-Persistenz impliziert keine Wiederaufnahme der Ausführung. Befehls-/Tool-Bindungen verbleiben im Arbeitsspeicher, da sie sicherheitsrelevante Laufzeitinformationen enthalten können und keinen Vertrag für wiederaufnehmbare Aufträge darstellen.

Beim Start des Gateway:

- eine neue Laufzeitepoche generieren;
- ausstehende Zeilen aus älteren Epochen atomar in `cancelled` mit dem Grund `gateway-restart` überführen;
- Zeilen beibehalten, damit ihre URLs erklären, was geschehen ist;
- eine spätere Genehmigung niemals gegen eine fehlende Laufzeitbindung ausführen.

Timer sind Optimierungen für das Aufwecken. Die maßgebliche Frist wird in `expires_at_ms` gespeichert; Lese-, Warte- und Entscheidungsvorgänge führen jeweils einen Ablaufabgleich aus.

Abschließendes striktes Verhalten:

- Zeitüberschreitung -> `expired`, ablehnen;
- keine Route -> `denied`, ablehnen;
- Ausführungsabbruch -> `cancelled`, ablehnen;
- fehlerhaftes vertrauenswürdiges Urteil -> `denied`, ablehnen;
- nur eine zulässige explizite Zulassungsentscheidung -> `allowed`.

Das aktuell ausgelieferte Exec-Verhalten steht weiterhin im Widerspruch zu diesem Vertrag:

- `src/agents/bash-tools.exec-host-shared.ts` kann `askFallback` anwenden.
- `docs/tools/exec-approvals.md` und `docs/cli/approvals.md` dokumentieren diese Oberfläche.

Plugin-Genehmigungen schlagen jetzt bei Zeitüberschreitungen und fehlerhaften Urteilen geschlossen fehl; das veraltete
Feld `timeoutBehavior` wird weiterhin akzeptiert, aber ignoriert. Die Nacharbeit für die strikte Exec-Semantik
muss Code, Typen, Dokumentation, Tests und Changelog gemeinsam aktualisieren, mit
expliziter Prüfung durch Eigentümer und Sicherheitsteam. `askFallback` darf während
der Migration weiterhin die Richtlinienauswahl vor dem Gate beschreiben, darf aber die Zeitüberschreitung
eines erstellten ausstehenden Datensatzes nicht in eine Genehmigung umwandeln.

## Kompatibilitätsplan

- Additives Gateway-Protokoll; keine Erhöhung der Protokollversion.
- Bestehende Exec-/Plugin-Methoden und -Ereignisse an der externen Grenze beibehalten.
- Bestehende IDs einschließlich `plugin:`-Präfixen beibehalten, Präfixe jedoch nicht mehr als Typinformationen verwenden.
- Verhalten des Textbefehls `/approve` beibehalten.
- Legacy-URL-/Web-App-Felder und Befehlsaktionen für Schaltflächen als Kompatibilitätseingaben des Plugin SDK beibehalten; die neue Core-Ausgabe ist typisiert.
- Alle gebündelten Channels und internen Aufrufer in derselben Änderung für typisierte Aktionen migrieren.
- Einen Changelog-Eintrag für die neue URL/Seite und für die spätere Änderung des Zeitüberschreitungsverhaltens hinzufügen.
- Keine Einstellung für den Elicitation-Modus hinzufügen.

## Rollout

### PR 1: Persistenter Lebenszyklus

- Dieser Designhinweis.
- Gemeinsames SQLite-Schema, Kysely-Generierung, Store und Bereinigung nach 30 Tagen.
- Gateway-Genehmigungsdienst, Laufzeit-Waiter-Bridge und Behandlung verwaister Einträge nach Neustarts.
- Vereinheitlichtes `approval.get/resolve`.
- Exec-/Plugin-Methodenadapter.
- Tests für „erste Antwort gewinnt“, Idempotenz, Ablauf, Autorisierung und Verbrauch.
- Noch keine Änderung des UI- oder Channel-Verhaltens.

### PR 2: Typisierte Aktionen und Channel-Callbacks

- Typisierte Genehmigungs-, URL- und Web-App-Aktionen.
- Zentrale Präsentations-Builder und Exporte des Plugin-SDK.
- Transportprivate Callback-Codierung mit expliziter Eigentümerart.
- Dauerhafte Callback-Referenzen fester Größe für kanonische IDs jenseits der Transportgrenzen.
- Migration gebündelter Kanäle weg von der Ableitung aus Befehlstext und Genehmigungs-ID.
- Kanonische Wahrheit der ersten Antwort auf der angeklickten Oberfläche und nach bestem Bemühen ausgeführte terminale Aktualisierungen aktiver nativer Oberflächen; die dauerhafte Terminalisierung von Kanalnachrichten bleibt eine Folgeaufgabe.
- Tests für SDK und gebündelte Kanäle.

### PR 3: Deep Link der Control UI

- Eigenständige authentifizierte Genehmigungsseite und Basispfad-berücksichtigendes Start-Routing.
- Bindung an den bereitstellenden Gateway, ohne die gespeicherte Remote-Auswahl des Betreibers zu verändern.
- Vom Kern verwalteter HTTP-Namensraum für Genehmigungen, einschließlich Asset-ähnlicher IDs.
- Vom Gateway erstellte URL-Nutzlast und Abfrage des ausstehenden Zustands, bis Lebenszyklusereignisse verfügbar sind.
- Nachweise für mobile Breite, erneute Verbindung, konkurrierende Antwort, Neuladen und eingebundenen Pfad.

### PR 4: native Clients

- iOS- und Android-Prüfoberflächen verwenden artabhängig `approval.get/resolve`; watchOS leitet prüfersichere Eingabeaufforderungen und Entscheidungen über das gekoppelte iPhone weiter.
- Die Watch bietet die von ihrem kompakten Weiterleitungsvertrag unterstützten Ausführungsentscheidungen: einmalig erlauben und ablehnen.
- Die kanonische terminale Wahrheit der ersten Antwort ersetzt den lokalen Zustand des versuchten Entscheids.
- Verlorene oder mehrdeutige Bestätigungen der Auflösung sperren die Bedienelemente bis zum kanonischen Rücklesen.
- Zuvor veröffentlichte Gateway-v4-Instanzen behalten die Ausführungsprüfung über einen eng begrenzten Fallback auf Legacy-Methoden bei; ein oberflächenübergreifend beibehaltener terminaler Zustand erfordert die vereinheitlichten Methoden.
- Warnungen für Prüfer und Eigentümerkontext bleiben auf iPhone, Watch und Android sichtbar.
- Nachweise für native Einheitentests, Builds und Plattformen.

### PR 5: Weitergabe des Vorfahren-Lebenszyklus

- Ausstehende/terminale Zustellung von `session.approval` aus dem in PR 1 persistierten Zielgruppen-Snapshot.
- Abonnement der exakten Sitzung, Wiederholung nach erneuter Verbindung und terminale Tombstones ohne Transkriptmutation oder Aktivierung des Agenten.
- Lebenszyklus-Callbacks werden nach dauerhaftem Einfügen/CAS ausgeführt und erhalten niemals Genehmigungsautorität.
- Nachweise für verschachtelte Subagenten und erneute Verbindungen.

### PR 6: Fehlergeschlossenes Verhalten

- Migration von `node-invoke-plugin-policy.ts` und des eingebetteten Plugin-Brokers weg von doppelter Autorität.
- Strikte Semantik für Zeitüberschreitungen, fehlerhafte Daten, fehlende Routen, Bindungen und den Verbrauch einmaliger Genehmigungen.
- Veröffentlichte permissive Zeitüberschreitungseinstellungen als veraltet markieren, ohne sie zu berücksichtigen, nachdem eine Anfrage aussteht.
- Nachweise für Konflikte zwischen mehreren Oberflächen und Fehlerinjektion.

### Folgeaufgabe: dauerhafte Bereinigung von Remote-Nachrichten

- Locators weitergeleiteter Zustellungen persistieren und jede zugestellte Kanalnachricht nach einem Neustart terminalisieren.
- Diesen Transportlebenszyklus von kanonischer Genehmigungsautorität und typisierten Präsentationsaktionen getrennt halten.

## Tests

Erforderliche fokussierte Abdeckung:

- Das erneute Öffnen von SQLite bewahrt ausstehende und terminale Projektionen.
- Zwei gleichzeitige Auflöser ergeben genau einen CAS-Gewinner.
- Eine Wiederholung derselben Entscheidung ist idempotent erfolgreich; eine widersprüchliche Wiederholung gibt den aufgezeichneten Gewinner zurück.
- Eine Auflösung zum oder nach dem Ablaufzeitpunkt kann keine Genehmigung erteilen.
- `allow-once` kann genau einmal verbraucht werden, ohne den terminalen Audit-Zustand zu löschen.
- Beim Start werden ältere Laufzeitepochen abgebrochen.
- Nicht autorisierte Abfragen und Auflösungen legen die Existenz des Datensatzes nicht offen.
- Explizite Prüfer-Zulassungsliste und allgemeines gekoppeltes Verhalten von `operator.approvals`.
- Legacy-Methoden für Ausführung und Plugins verwenden denselben Speicher.
- Gateway-Schemas für Anforderung/Auflistung/Abruf/Auflösung und additive Ereignisnutzlasten.
- Normalisierung typisierter Aktionen, Fallback-Darstellung, SDK-Exporte und Umschaltungen gebündelter Kanäle.
- Die Telegram-Callback-Codierung enthält transportprivate Daten und keine Ableitung aus Befehlszeichenfolgen.
- Direktes untergeordnetes Element, verzweigte Controller-/Anforderer-Eigentümer, verschachtelte Eigentümer, Neuzuweisung, Fallback auf Sitzungsfelder, Zyklus und Obergrenze der Zielgruppengröße.
- Angeforderte und terminale Zielgruppen-Arrays sind identisch.
- Eigentümerprojektionen verursachen weder Transkriptmutationen noch eine Aktivierung des Agenten.
- Die Control-UI-Route funktioniert unter `/` und einem konfigurierten Basispfad; eine Aktualisierung zeigt die ausstehende oder terminale Wahrheit.
- Gleichzeitige Antworten über Control UI und Telegram zeigen einen Gewinner und beim Verlierer „anderweitig aufgelöst“.
- Native Genehmigungskennungen und Gateway-Eigentümerkennungen bewahren beim Routing und Abgleich die exakten UTF-8-Bytes.
- Die Aushandlung der nativen RPC-Familie bindet jede zugelassene Gateway-Route an genau eine kanonische oder Legacy-Familie und führt nach der Verwendung niemals stillschweigend ein Downgrade durch.
- Verlorene native Auflösungsbestätigungen sperren Aktionen bis zum kanonischen Rücklesen; ein fehlgeschlagenes Rücklesen kann weder einen Gewinner vortäuschen noch eine Watch-Aktualisierung bestätigen.
- Die Korrelation von Watch-Snapshot-Anforderungen wird nur für den exakt gekoppelten Gateway-Eigentümer und nach einem abgeschlossenen kanonischen Rücklesen auf dem iPhone akzeptiert.
- Nachweis des Benutzerpfads über Testbox/Crabbox, einschließlich einer Genehmigungsseite in mobiler Breite, Bereinigung von Telegram-Aktionen und eines vollständigen Durchlaufs mit ausstehender Anfrage, Auflösung und später Verliererantwort über Android, iPhone und Watch.

## Beobachtbarkeit

Strukturierte, inhaltsfreie Übergangsprotokolle mit Genehmigungs-ID, Art, Quellsitzungsschlüssel, Status, Grund und Latenz ausgeben. Niemals die Vorschau oder die unverarbeitete Bindung protokollieren.

Erfassen:

- Anzahl der Anforderungen nach Art;
- terminale Anzahl nach Art/Status/Grund;
- Messwert für ausstehende Vorgänge;
- Latenz von der Anforderung bis zum terminalen Zustand;
- Ergebnisse von Auflösungsrennen: Gewinner, idempotente Wiederholung, Konflikt, abgelaufen;
- Anzahl der Zustellrouten und Ablehnungen wegen fehlender Route;
- Abbrüche verwaister Vorgänge beim Start;
- Zielgruppengröße.

Ein bestätigter Übergang gilt als erfolgreich, selbst wenn die spätere Ereigniszustellung fehlschlägt. Lebenszyklusabonnenten stellen den Zustand über die Wiederholung aus PR 5 und die kanonische Abfrage wieder her. Die dauerhafte Terminalisierung von Kanalnachrichten bleibt die separate oben genannte Folgeaufgabe.

## Offene Entscheidungen

1. **Extern erreichbarer Ursprung der Control UI.** Jeder Snapshot enthält den stabilen relativen Pfad `urlPath`. Eine absolute URL darf erst dann von einem zwischengespeicherten Tailscale-Serve-/Funnel-Standort bekannt gegeben werden, nachdem die Gateway-Freigabe erfolgreich war; `allowedOrigins`, Host-Header von Anforderungen, `gateway.remote.url` und ausschließlich zur Anzeige bestimmte Loopback-/LAN-Kandidaten sind keine kanonischen Ursprünge. Telegram kann seinen authentifizierten Mini-App-Wrapper verwenden, um den Genehmigungspfad während des Bootstrappings beizubehalten. Beliebige Reverse-Proxys bleiben ausschließlich relativ, bis ein separat geprüfter expliziter Vertrag für öffentliche URLs vorliegt. Ein Kanal darf den Ursprung niemals erraten.
2. **Kompatibilitätsumstellung für strikte Ausführungszeitüberschreitungen.** Zeitüberschreitungen bei Plugin-Genehmigungen schlagen jetzt fehlergeschlossen fehl und `timeoutBehavior` ist veraltet. Der verbleibende veröffentlichte Vertrag `askFallback` erfordert eine explizite Prüfung durch Eigentümer und Sicherheitsteam, einen Changelog-Eintrag, Dokumentation sowie eine Migrations-/Veraltungsentscheidung, bevor er nach einer Zeitüberschreitung bei einer ausstehenden Anfrage keine Ausführung mehr autorisiert.
3. **Eingebetteter Modus ohne Gateway.** Empfehlung: zunächst ausschließlich lokal belassen und ihn anschließend zu einem Client des kanonischen Dienstes machen, sobald ein Gateway vorhanden ist. Keinen Deep Link bekannt geben, den kein Server auflösen kann.
