---
read_when:
    - Erstellen eines Operators, Dashboards oder WebChat-Clients außerhalb des OpenClaw-Repositorys
    - Implementierung von Gateway-Wiederverbindung, Verlauf, Genehmigungen oder Gerätekopplung
    - Aktualisieren eines Drittanbieter-Clients für eine neue Gateway-Wire-Version
summary: Erstellen Sie einen Drittanbieter-Operator oder WebChat-Client für das Gateway-WebSocket-Protokoll
title: Erstellen eines Gateway-Clients
x-i18n:
    generated_at: "2026-07-24T04:24:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fa24b196ff1fa28fb3b64d49ac25597f22cf1945aea56029e78e4375f1bdddb7
    source_path: gateway/clients.md
    workflow: 16
---

Verwenden Sie die veröffentlichten Gateway-Pakete, um Operator-Dashboards, WebChat-Clients
und andere Drittanbieteranwendungen zu entwickeln. Dieser Leitfaden behandelt den Client-Lebenszyklus rund um
den Wire-Vertrag: Authentifizierung, Fähigkeiten, Wiederherstellung nach erneuter Verbindung, Verlauf,
Abonnements und Versionsupgrades.

Informationen zu Frame-Strukturen, Handshake, Fehlern und der vollständigen Methodenoberfläche finden Sie in der
[Gateway-Protokollspezifikation](https://docs.openclaw.ai/gateway/protocol).

## Pakete installieren

```bash
npm install @openclaw/gateway-client @openclaw/gateway-protocol
```

<Note>
Diese Pakete werden mit den OpenClaw-Release-Zyklen ausgeliefert. Während der ersten Einführung kann npm
`E404` zurückgeben, bis das erste OpenClaw-Release mit diesen Paketen veröffentlicht wurde;
installieren Sie sie erst, wenn die unten aufgeführten Registry-Seiten erreichbar sind.
</Note>

- [`@openclaw/gateway-protocol`](https://www.npmjs.com/package/@openclaw/gateway-protocol)
  stellt Schemas, Laufzeit-Validatoren, TypeScript-Typen, Registrys für Client-Identitäten und
  Fähigkeiten, strukturierte Fehlerleser und Protokollversionskonstanten bereit.
  Das npm-Tarball enthält außerdem den generierten
  maschinenlesbaren Vertrag
  [`protocol.schema.json`](https://unpkg.com/@openclaw/gateway-protocol/protocol.schema.json).
- [`@openclaw/gateway-client`](https://www.npmjs.com/package/@openclaw/gateway-client)
  ist die Referenzimplementierung für Verbindungen. Importieren Sie den Paketstamm für den Node-Client
  und `@openclaw/gateway-client/browser` für die browsersicheren Protokoll-, Geräteauthentifizierungs-
  und Wiederverbindungshelfer.

Der Node-Einstiegspunkt verwaltet seinen WebSocket-Transport selbst. Ein Browser-Host stellt einen WebSocket-
Adapter sowie persistente Speicher- und Signierungs-Callbacks für die Geräteidentität und
das Geräte-Token bereit.

## Bereiche auswählen und Gerät koppeln

Ein vollständiger interaktiver Chat-Client, der auch Genehmigungsaufforderungen darstellt, sollte
`role: "operator"` mit diesen Bereichen anfordern:

| Bereich              | Verwendung                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `operator.read`      | `chat.history`, `sessions.list`, `sessions.subscribe`, Modellstatus und schreibgeschützte Ereignisse |
| `operator.write`     | `chat.send` und gewöhnliche Sitzungsänderungen                                              |
| `operator.approvals` | Auflisten, Anzeigen und Auflösen von Ausführungs- oder Plugin-Genehmigungen                  |

Fügen Sie `operator.questions` nur hinzu, wenn der Client interaktive Fragen verarbeitet,
`operator.pairing` nur, wenn er gekoppelte Geräte oder Nodes verwaltet, und
`operator.admin` nur für administrative Vorgänge wie `config.patch`.
Die [Referenz zu Operator-Bereichen](https://docs.openclaw.ai/gateway/operator-scopes)
definiert die vollständigen Regeln für Methoden und Genehmigungszeitpunkte.

Erstellen Sie kein Bearer-Token pro Client, indem Sie `openclaw.json` manuell bearbeiten. Konfigurieren
Sie die gemeinsame Bootstrap-Authentifizierung des Gateways mit `openclaw configure --section
gateway` oder den Optionen `openclaw onboard --gateway-auth ...` und lassen Sie dann durch die Gerätekopplung
das Client-Token ausstellen:

1. Persistieren Sie eine Ed25519-Geräteidentität im Client.
2. Warten Sie auf `connect.challenge`, signieren Sie die an die Challenge gebundene Gerätenutzlast und senden Sie
   `connect` mit der angeforderten Operator-Rolle, den Bereichen und dem gemeinsamen Gateway-Token
   oder Passwort für die Bootstrap-Authentifizierung.
3. Wenn das Gateway strukturierte `PAIRING_REQUIRED`-Details zurückgibt, zeigen Sie die Anfrage-
   ID an und pausieren Sie oder versuchen Sie es gemäß `error.details.recommendedNextStep` erneut.
4. Prüfen Sie die Anfrage auf dem Gateway-Host mit `openclaw devices list` und
   genehmigen Sie anschließend genau diese aktuelle Anfrage mit `openclaw devices approve <requestId>`.
5. Stellen Sie die Verbindung erneut her und persistieren Sie `hello-ok.auth.deviceToken` mit der ausgehandelten Rolle und den
   Bereichen. Verwenden Sie dieses Geräte-Token für spätere Verbindungen.

Upgrades von Bereichen oder Rollen erzeugen eine neue ausstehende Kopplungsanfrage. Eine Token-Rotation kann
den genehmigten Kopplungsvertrag nicht erweitern. Informationen zu Befehlen für Genehmigung, Rotation und
Widerruf finden Sie in der
[Geräte-CLI](https://docs.openclaw.ai/cli/devices).

## Client-Fähigkeiten bekannt geben

`connect.params.caps` beschreibt optionales Verhalten, das der Client nutzen kann. Es
gewährt keine Autorisierung. Importieren Sie Namen aus `GATEWAY_CLIENT_CAPS`, anstatt
String-Literale zu duplizieren:

```ts
import { GATEWAY_CLIENT_CAPS } from "@openclaw/gateway-protocol/client-info";

const caps = [GATEWAY_CLIENT_CAPS.TOOL_EVENTS];
```

Die aktuelle Registry enthält `approvals`, `exec-approvals`, `inline-widgets`,
`run-tool-bindings`, `session-scoped-events`, `plugin-approvals`,
`task-suggestions`, `terminal-offset-seq`, `tool-events` und `ui-commands`.
Geben Sie nur Fähigkeiten bekannt, die der Client tatsächlich implementiert.

<Warning>
`tool-events` steuert das Live-Streaming der Tool-Ausführung. Das Gateway registriert nur
Verbindungen, die diese Fähigkeit bekannt geben, als Empfänger für die strukturierten
Tool-Ereignisse eines Laufs. Ohne sie empfängt die Verbindung keine Live-Tool-Ereignisse und der
Handshake meldet keinen Fehler.
</Warning>

Durch Fähigkeiten gesteuerte Agent-Tools sind eine separate Verwendung derselben Deklaration. Wenn ein
Agent-Tool eine Client-Fähigkeit voraussetzt, lässt das Gateway dieses Tool weg, sofern der
ursprüngliche Client nicht jede erforderliche Fähigkeit bekannt gegeben hat.

## Zustand nach erneuter Verbindung wiederherstellen

Behandeln Sie jede erfolgreiche erneute Verbindung als neue Projektion über den dauerhaften Verlauf und
den aktuellen In-Memory-Laufzustand:

1. Stellen Sie `sessions.subscribe` und das `sessions.messages.subscribe`-Abonnement der ausgewählten Sitzung
   erneut her.
2. Rufen Sie `chat.history` für den ausgewählten `sessionKey` auf und ersetzen Sie lokal persistierte
   Zeilen durch die zurückgegebene `messages`-Projektion.
3. Wenn `inFlightRun` vorhanden ist, übernehmen Sie dessen `runId`, gepuffertes `text` und optionales
   `plan`. Übernehmen Sie den Lauf auch dann, wenn `text` leer ist.
4. Lesen Sie `sessionInfo.hasActiveRun` und `sessionInfo.activeRunIds`. Bevorzugen Sie die exakte
   Zugehörigkeit in `activeRunIds`, wenn Sie entscheiden, ob ein beibehaltener Lauf weiterhin die
   Streaming-Benutzeroberfläche besitzt. Ein wahrer Wert für `hasActiveRun` ohne aufgeführte ID kann eine andere
   aktive Laufzeitprojektion darstellen.
5. Gleichen Sie nachfolgende `agent`-Ereignisse anhand von `payload.runId` und `payload.seq` ab.
   Verwalten Sie die höchste akzeptierte Sequenz für jeden Lauf unabhängig, ignorieren Sie eine
   bereits gesehene oder niedrigere Sequenz und behandeln Sie eine vorwärts gerichtete Lücke als Grund, den
   maßgeblichen Verlauf neu zu laden.

Der äußere Ereignis-Frame verfügt außerdem über ein optionales `seq`, das Ereignisse in der
aktuellen WebSocket-Verbindung ordnet. Bei einer neuen Verbindung wird es zurückgesetzt. Das `seq` innerhalb
der Nutzlast eines `agent`-Ereignisses wird pro Lauf zugewiesen und ordnet die Lebenszyklus-,
Assistenten-, Plan-, Tool- und sonstigen Stream-Ereignisse dieses Laufs.

## Verlaufsmetadaten und stabile Anker verwenden

Von `chat.history` zurückgegebene Zeilen können einen `__openclaw`-Metadatenumschlag enthalten:

- `id` ist die Identität des Transkripteintrags. Verwenden Sie sie für verankerte Verlaufsanfragen,
  jedoch nicht als eindeutigen Schlüssel für Anzeigezeilen.
- `seq` ist die positive Sequenz des Transkriptdatensatzes. Ein gespeicherter Datensatz kann in
  mehr als eine Anzeigezeile projiziert werden; halten Sie daher zusammengehörige Zeilen mit demselben `id` und derselben Sequenz
  zusammen.
- `kind` kennzeichnet synthetische Zeilen. Eine Compaction-Grenze verwendet
  `kind: "compaction"` und kann `tokensBefore` und `tokensAfter` enthalten, wenn ein
  passender Checkpoint diese Metriken aufgezeichnet hat.

Blättern Sie mit den Werten `hasMore` und `nextOffset` der Antwort rückwärts. Numerische
Offsets beschreiben die aktuelle Transkriptprojektion; persistieren Sie sie daher nicht als
langfristige Lesezeichen über Zurücksetzungen oder Compaction hinweg. Persistieren Sie stattdessen `__openclaw.id`.
Um den Bereich um eine bekannte Zeile wiederherzustellen, rufen Sie `chat.history` mit `messageId` und dem
`sessionId` auf, das diesen Wert zurückgegeben hat. Das Gateway kann diesen Anker aus dem Verlauf des
Zurücksetzungsarchivs auflösen; verankerte Antworten lassen numerische Metadaten zur Seitennavigation absichtlich weg.

## Nutzung abonnieren statt abfragen

Laden Sie den anfänglichen Katalog mit `sessions.list` und rufen Sie anschließend `sessions.subscribe` einmal
pro Verbindung auf. Führen Sie `sessions.changed`-Ereignisse anhand von `sessionKey` zusammen. Nutzlasten zu Sitzungsänderungen
können Live-Werte für `inputTokens`, `outputTokens`, `totalTokens`,
`totalTokensFresh`, `contextTokens`, `estimatedCostUsd`, Einstellungen zur Antwortnutzung
und den Zustand aktiver Läufe enthalten.

Einige Änderungsbenachrichtigungen sind lediglich Invalidierungssignale. Wenn ein Ereignis die
Zeilenfelder auslässt, die Ihre Ansicht benötigt, aktualisieren Sie `sessions.list`. Fragen Sie `usage.cost` oder
`sessions.usage` nicht regelmäßig ab, um eine Live-Sitzungsliste aktuell zu halten; verwenden Sie diese Methoden nur für
bei Bedarf erstellte aggregierte oder detaillierte Berichte.

## Ausführungsgenehmigungen nachladen

Ein Client mit `operator.approvals` sollte seinen Ereignis-Listener installieren, sobald
`hello-ok` abgeschlossen ist, und anschließend `exec.approval.list` aufrufen, um Anfragen nachzuladen, die
vor der Verbindung eingegangen sind. Gleichen Sie die Liste und die Live-Ereignisse
`exec.approval.requested` / `exec.approval.resolved` anhand der Genehmigungs-ID ab, damit ein
Übergang, der zeitgleich mit der Listenanfrage erfolgt, weder verloren geht noch wiederhergestellt wird.

## Protokollversionen verfolgen

Die aktuelle Wire-Version ist `4`. Allgemeine Operator- und WebChat-Clients müssen
die exakt aktuelle Version mit `minProtocol: 4` und `maxProtocol: 4` aushandeln.
Nur authentifizierte Node-Clients und leichtgewichtige Prüfroutinen verfügen über das N-1-Akzeptanzfenster,
derzeit von Protokoll `3` bis `4`.

Protokolländerungen sind zunächst additiv. `protocol.schema.json` enthält `since`-
Metadaten zum Release-Stand und Metadaten zu erforderlichen Bereichen für Kernmethoden, aber eine Erhöhung der
Wire-Version ist weiterhin ein explizit inkompatibles Ereignis für Drittanbieter-Clients. Fixieren Sie die
getesteten Paketversionen, aktualisieren Sie Client und Gateway gemeinsam, wenn sich die Wire-
Version ändert, und prüfen Sie vor jedem Upgrade das
[OpenClaw-Änderungsprotokoll](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md).

## Verwandte Themen

- [Gateway-Protokoll](https://docs.openclaw.ai/gateway/protocol)
- [OpenClaw einbetten](https://docs.openclaw.ai/gateway/embedding)
- [Gateway-RPC-Referenz](https://docs.openclaw.ai/reference/rpc)
- [Gateway-Integrationen für externe Apps](https://docs.openclaw.ai/gateway/external-apps)
