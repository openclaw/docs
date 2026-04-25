---
read_when:
    - Erstellen oder Debuggen von Node-Clients (iOS/Android/macOS-Node-Modus)
    - Untersuchung von Kopplungs- oder Bridge-Authentifizierungsfehlern
    - Prüfung der vom Gateway exponierten Node-Oberfläche
summary: 'Historisches Bridge-Protokoll (Legacy-Nodes): TCP JSONL, Kopplung, bereichsgebundenes RPC'
title: Bridge-Protokoll
x-i18n:
    generated_at: "2026-04-25T13:45:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb07ec4dab4394dd03b4c0002d6a842a9d77d12a1fc2f141f01d5a306fab1615
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

<Warning>
Die TCP-Bridge wurde **entfernt**. Aktuelle OpenClaw-Builds enthalten keinen Bridge-Listener mehr, und `bridge.*`-Konfigurationsschlüssel sind nicht mehr im Schema vorhanden. Diese Seite wird nur zur historischen Referenz beibehalten. Verwenden Sie für alle Node-/Operator-Clients das [Gateway Protocol](/de/gateway/protocol).
</Warning>

## Warum sie existierte

- **Sicherheitsgrenze**: Die Bridge stellt eine kleine Allowlist statt der
  vollständigen API-Oberfläche des Gateway bereit.
- **Kopplung + Node-Identität**: Die Node-Zulassung wird vom Gateway verwaltet und
  ist an ein Token pro Node gebunden.
- **Discovery-UX**: Nodes können Gateways per Bonjour im LAN entdecken oder sich
  direkt über ein Tailnet verbinden.
- **Loopback-WS**: Die vollständige WS-Control-Plane bleibt lokal, sofern sie nicht per SSH getunnelt wird.

## Transport

- TCP, ein JSON-Objekt pro Zeile (JSONL).
- Optional TLS (wenn `bridge.tls.enabled` auf true gesetzt ist).
- Der historische Standardport des Listeners war `18790` (aktuelle Builds starten
  keine TCP-Bridge).

Wenn TLS aktiviert ist, enthalten TXT-Records für die Discovery `bridgeTls=1` sowie
`bridgeTlsSha256` als nicht geheimen Hinweis. Beachten Sie, dass Bonjour-/mDNS-TXT-Records nicht
authentifiziert sind; Clients dürfen den angekündigten Fingerprint nicht ohne ausdrückliche Benutzerabsicht oder andere Verifizierung außerhalb des Kanals als verbindlichen Pin behandeln.

## Handshake + Kopplung

1. Der Client sendet `hello` mit Node-Metadaten + Token (falls bereits gekoppelt).
2. Wenn keine Kopplung besteht, antwortet das Gateway mit `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Der Client sendet `pair-request`.
4. Das Gateway wartet auf Genehmigung und sendet dann `pair-ok` und `hello-ok`.

Historisch gab `hello-ok` `serverName` zurück und konnte
`canvasHostUrl` enthalten.

## Frames

Client → Gateway:

- `req` / `res`: bereichsgebundenes Gateway-RPC (chat, sessions, config, health, voicewake, skills.bins)
- `event`: Node-Signale (Sprachtranskript, Agentenanfrage, Chat-Abonnement, Exec-Lebenszyklus)

Gateway → Client:

- `invoke` / `invoke-res`: Node-Befehle (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: Chat-Updates für abonnierte Sitzungen
- `ping` / `pong`: Keepalive

Die Durchsetzung der Legacy-Allowlist befand sich in `src/gateway/server-bridge.ts` (entfernt).

## Exec-Lebenszyklusereignisse

Nodes können `exec.finished`- oder `exec.denied`-Ereignisse senden, um `system.run`-Aktivitäten sichtbar zu machen.
Diese werden im Gateway auf Systemereignisse abgebildet. (Legacy-Nodes können weiterhin `exec.started` senden.)

Payload-Felder (alle optional, sofern nicht anders angegeben):

- `sessionKey` (erforderlich): Agentensitzung, die das Systemereignis erhalten soll.
- `runId`: eindeutige Exec-ID zur Gruppierung.
- `command`: roher oder formatierter Befehlsstring.
- `exitCode`, `timedOut`, `success`, `output`: Abschlussdetails (nur bei `finished`).
- `reason`: Grund für die Ablehnung (nur bei `denied`).

## Historische Tailnet-Nutzung

- Die Bridge an eine Tailnet-IP binden: `bridge.bind: "tailnet"` in
  `~/.openclaw/openclaw.json` (nur historisch; `bridge.*` ist nicht mehr gültig).
- Clients verbinden sich über den MagicDNS-Namen oder die Tailnet-IP.
- Bonjour überschreitet **keine** Netzwerke; verwenden Sie bei Bedarf manuellen Host/Port oder Wide-Area-DNS-SD.

## Versionierung

Die Bridge war **implizit v1** (keine Min-/Max-Aushandlung). Dieser Abschnitt dient
nur der historischen Referenz; aktuelle Node-/Operator-Clients verwenden das WebSocket-
[Gateway Protocol](/de/gateway/protocol).

## Verwandt

- [Gateway protocol](/de/gateway/protocol)
- [Nodes](/de/nodes)
