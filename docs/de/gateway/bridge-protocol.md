---
read_when:
    - Node-Clients erstellen oder debuggen (iOS-/Android-/macOS-Node-Modus)
    - Untersuchung von Kopplungs- oder Bridge-Authentifizierungsfehlern
    - Überprüfen der vom Gateway exponierten Node-Oberfläche
summary: 'Historisches Bridge-Protokoll (Legacy-Knoten): TCP JSONL, Pairing, bereichsgebundene RPC'
title: Brückenprotokoll
x-i18n:
    generated_at: "2026-05-07T13:16:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc906ca3a8a4ebef9b39c53187bcb4d06b287875b8e8748a168812f9a52e6152
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Die TCP-Bridge wurde **entfernt**. Aktuelle OpenClaw-Builds liefern den Bridge-Listener nicht mehr aus, und `bridge.*`-Konfigurationsschlüssel sind nicht mehr im Schema enthalten. Diese Seite wird nur zur historischen Referenz beibehalten. Verwenden Sie das [Gateway-Protokoll](/de/gateway/protocol) für alle Node-/Operator-Clients.
</Warning>

## Warum sie existierte

- **Sicherheitsgrenze**: Die Bridge stellt eine kleine Allowlist statt der
  vollständigen Gateway-API-Oberfläche bereit.
- **Pairing + Node-Identität**: Die Node-Zulassung liegt beim Gateway und ist an
  ein token pro Node gebunden.
- **Discovery-UX**: Nodes können Gateways über Bonjour im LAN erkennen oder sich
  direkt über ein Tailnet verbinden.
- **Loopback-WS**: Die vollständige WS-Steuerungsebene bleibt lokal, sofern sie nicht über SSH getunnelt wird.

## Transport

- TCP, ein JSON-Objekt pro Zeile (JSONL).
- Optionales TLS (wenn `bridge.tls.enabled` true ist).
- Der historische Standard-Listener-Port war `18790` (aktuelle Builds starten keine
  TCP-Bridge).

Wenn TLS aktiviert ist, enthalten Discovery-TXT-Records `bridgeTls=1` plus
`bridgeTlsSha256` als nicht geheimen Hinweis. Beachten Sie, dass Bonjour-/mDNS-TXT-Records
nicht authentifiziert sind; Clients dürfen den angekündigten Fingerprint ohne ausdrückliche Benutzerabsicht oder andere Out-of-Band-Verifizierung nicht als
autoritatives Pinning behandeln.

## Handshake + Pairing

1. Der Client sendet `hello` mit Node-Metadaten + token (falls bereits gekoppelt).
2. Wenn nicht gekoppelt, antwortet das Gateway mit `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Der Client sendet `pair-request`.
4. Das Gateway wartet auf die Freigabe und sendet dann `pair-ok` und `hello-ok`.

Historisch gab `hello-ok` `serverName` zurück; gehostete Plugin-Oberflächen werden jetzt
über `pluginSurfaceUrls` angekündigt. Canvas/A2UI verwendet
`pluginSurfaceUrls.canvas`; der veraltete Alias `canvasHostUrl` ist nicht Teil des
überarbeiteten Protokolls.

## Frames

Client → Gateway:

- `req` / `res`: begrenztes Gateway-RPC (Chat, Sitzungen, Konfiguration, Zustand, Voicewake, skills.bins)
- `event`: Node-Signale (Sprachtranskript, Agent-Anfrage, Chat-Abonnement, Exec-Lebenszyklus)

Gateway → Client:

- `invoke` / `invoke-res`: Node-Befehle (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: Chat-Aktualisierungen für abonnierte Sitzungen
- `ping` / `pong`: Keepalive

Die Legacy-Allowlist-Durchsetzung lag in `src/gateway/server-bridge.ts` (entfernt).

## Exec-Lebenszyklusereignisse

Nodes können `exec.finished`- oder `exec.denied`-Ereignisse ausgeben, um system.run-Aktivität sichtbar zu machen.
Diese werden im Gateway Systemereignissen zugeordnet. (Legacy-Nodes können weiterhin `exec.started` ausgeben.)

Payload-Felder (alle optional, sofern nicht anders angegeben):

- `sessionKey` (erforderlich): Agent-Sitzung, die das Systemereignis erhalten soll.
- `runId`: eindeutige Exec-ID für die Gruppierung.
- `command`: rohe oder formatierte Befehlszeichenfolge.
- `exitCode`, `timedOut`, `success`, `output`: Abschlussdetails (nur finished).
- `reason`: Ablehnungsgrund (nur denied).

## Historische Tailnet-Nutzung

- Binden Sie die Bridge an eine Tailnet-IP: `bridge.bind: "tailnet"` in
  `~/.openclaw/openclaw.json` (nur historisch; `bridge.*` ist nicht mehr gültig).
- Clients verbinden sich über den MagicDNS-Namen oder die Tailnet-IP.
- Bonjour funktioniert **nicht** netzwerkübergreifend; verwenden Sie bei Bedarf manuellen Host/Port oder Wide-Area-DNS-SD.

## Versionierung

Die Bridge war **implizit v1** (keine Min-/Max-Aushandlung). Dieser Abschnitt dient
nur als historische Referenz; aktuelle Node-/Operator-Clients verwenden das WebSocket-
[Gateway-Protokoll](/de/gateway/protocol).

## Verwandt

- [Gateway-Protokoll](/de/gateway/protocol)
- [Nodes](/de/nodes)
