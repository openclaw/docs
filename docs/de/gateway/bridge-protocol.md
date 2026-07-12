---
read_when:
    - Untersuchung von altem Node-Client-Code oder archivierten Kopplungsprotokollen
    - Prüfen, was die bisherige Node-Oberfläche früher bereitstellte
summary: 'Historisches Bridge-Protokoll (Legacy-Nodes): TCP-JSONL, Kopplung, bereichsgebundener RPC'
title: Bridge-Protokoll
x-i18n:
    generated_at: "2026-07-12T01:39:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e8b69c59f2170439f0e7b139bf5bbdb429d7c9d8dde7b36cd64aab63939c95d
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Die TCP-Bridge wurde **entfernt**. Aktuelle OpenClaw-Builds enthalten den Bridge-Listener nicht mehr, und `bridge.*`-Konfigurationsschlüssel sind nicht mehr im Schema enthalten. Diese Seite dient ausschließlich als historische Referenz. Verwenden Sie das [Gateway-Protokoll](/de/gateway/protocol) für alle Node-/Operator-Clients.
</Warning>

## Warum sie existierte

- **Sicherheitsgrenze**: stellte anstelle der vollständigen Gateway-API-Oberfläche eine kleine Positivliste bereit.
- **Kopplung und Node-Identität**: Die Zulassung von Nodes wurde vom Gateway verwaltet und war an ein Node-spezifisches Token gebunden.
- **Benutzerfreundliche Erkennung**: Nodes konnten Gateways über Bonjour im LAN erkennen oder sich direkt über ein Tailnet verbinden.
- **Loopback-WS**: Die vollständige WS-Steuerungsebene blieb lokal, sofern sie nicht über SSH getunnelt wurde.

## Transport

- TCP, ein JSON-Objekt pro Zeile (JSONL).
- Optionales TLS (`bridge.tls.enabled: true`).
- Der standardmäßige Listener-Port war `18790`.

Bei aktiviertem TLS enthielten die TXT-Einträge für die Erkennung `bridgeTls=1` sowie `bridgeTlsSha256` als nicht geheimen Hinweis. Bonjour-/mDNS-TXT-Einträge sind nicht authentifiziert; Clients konnten den angekündigten Fingerabdruck ohne eine anderweitige Verifizierung über einen separaten Kanal nicht als verbindlichen Pin betrachten.

## Handshake und Kopplung

1. Der Client sendet `hello` mit Node-Metadaten und einem Token (falls bereits gekoppelt).
2. Falls keine Kopplung bestand, antwortete das Gateway mit `error` (`NOT_PAIRED` / `UNAUTHORIZED`).
3. Der Client sendet `pair-request`.
4. Das Gateway wartet auf die Genehmigung und sendet anschließend `pair-ok` und `hello-ok`.

`hello-ok` gab früher `serverName` zurück; bereitgestellte Plugin-Oberflächen werden im aktuellen Gateway-Protokoll nun über `pluginSurfaceUrls` angekündigt (Canvas/A2UI verwendet `pluginSurfaceUrls.canvas`).

## Frames

Vom Client zum Gateway:

- `req` / `res`: begrenzte Gateway-RPCs (Chat, Sitzungen, Konfiguration, Status, Sprachaktivierung, skills.bins).
- `event`: Node-Signale (Sprachtranskript, Agent-Anfrage, Chat-Abonnement, Ausführungslebenszyklus).

Vom Gateway zum Client:

- `invoke` / `invoke-res`: Node-Befehle (`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`).
- `event`: Chat-Aktualisierungen für abonnierte Sitzungen.
- `ping` / `pong`: Verbindungsaufrechterhaltung.

Die Durchsetzung der Positivliste befand sich in `src/gateway/server-bridge.ts` (entfernt).

## Ereignisse des Ausführungslebenszyklus

Nodes sendeten `exec.finished`, um abgeschlossene `system.run`-Aktivitäten sichtbar zu machen, die vom Gateway Systemereignissen zugeordnet wurden (ältere Nodes konnten außerdem `exec.started` senden). `exec.denied` kennzeichnete einen abgelehnten `system.run`-Versuch als endgültige Ablehnung, ohne ein Systemereignis in die Warteschlange einzureihen oder Agent-Aufgaben zu aktivieren.

Nutzlastfelder (alle optional, sofern nicht anders angegeben):

| Feld                             | Hinweise                                                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `sessionKey`                     | Erforderlich. Agent-Sitzung für die Ereigniskorrelation und bei `exec.finished` für die Zustellung des Systemereignisses.         |
| `runId`                          | Eindeutige Ausführungs-ID zur Gruppierung.                                                                                        |
| `command`                        | Unformatierte oder formatierte Befehlszeichenfolge.                                                                               |
| `exitCode`, `timedOut`, `output` | Abschlussdetails (nur bei Abschluss).                                                                                             |
| `reason`                         | Ablehnungsgrund (nur bei Ablehnung).                                                                                              |

## Historische Tailnet-Nutzung

- Binden Sie die Bridge an eine Tailnet-IP: `bridge.bind: "tailnet"` in `~/.openclaw/openclaw.json` (nur historisch; `bridge.*` ist keine gültige Konfiguration mehr).
- Clients stellten die Verbindung über den MagicDNS-Namen oder die Tailnet-IP her.
- Bonjour funktioniert nicht netzwerkübergreifend; andernfalls waren Wide-Area-DNS-SD oder ein manuell angegebener Host und Port erforderlich.

## Versionierung

Die Bridge verwendete implizit Version 1 ohne Aushandlung von Mindest- und Höchstversion. Aktuelle Node-/Operator-Clients verwenden das WebSocket-[Gateway-Protokoll](/de/gateway/protocol), das einen Protokollversionsbereich aushandelt.

## Verwandte Themen

- [Gateway-Protokoll](/de/gateway/protocol)
- [Nodes](/de/nodes)
