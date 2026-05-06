---
read_when:
    - Node-Clients erstellen oder debuggen (iOS-/Android-/macOS-Node-Modus)
    - Untersuchung von Kopplungs- oder Bridge-Authentifizierungsfehlern
    - Audit der vom Gateway offengelegten Node-Schnittstelle
summary: 'Historisches Brückenprotokoll (ältere Nodes): TCP JSONL, Kopplung, bereichsgebundener RPC'
title: Bridge-Protokoll
x-i18n:
    generated_at: "2026-05-06T17:55:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84c4b5c344d880d4283eebd8596e8b5b0aad5cae747694784011deb1547db30
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Die TCP-Bridge wurde **entfernt**. Aktuelle OpenClaw-Builds liefern den Bridge-Listener nicht aus, und `bridge.*`-Konfigurationsschlüssel sind nicht mehr im Schema enthalten. Diese Seite bleibt nur als historische Referenz erhalten. Verwenden Sie das [Gateway-Protokoll](/de/gateway/protocol) für alle Node-/Operator-Clients.
</Warning>

## Warum sie existierte

- **Sicherheitsgrenze**: Die Bridge stellt eine kleine Allowlist statt der
  vollständigen Gateway-API-Oberfläche bereit.
- **Pairing + Node-Identität**: Die Node-Zulassung liegt beim Gateway und ist an
  ein Token pro Node gebunden.
- **Discovery-UX**: Nodes können Gateways über Bonjour im LAN finden oder sich
  direkt über ein Tailnet verbinden.
- **Loopback-WS**: Die vollständige WS-Control-Plane bleibt lokal, außer sie wird über SSH getunnelt.

## Transport

- TCP, ein JSON-Objekt pro Zeile (JSONL).
- Optionales TLS (wenn `bridge.tls.enabled` true ist).
- Der historische Standard-Listener-Port war `18790` (aktuelle Builds starten
  keine TCP-Bridge).

Wenn TLS aktiviert ist, enthalten Discovery-TXT-Einträge `bridgeTls=1` plus
`bridgeTlsSha256` als nicht geheime Information. Beachten Sie, dass Bonjour-/mDNS-TXT-Einträge
nicht authentifiziert sind; Clients dürfen den angekündigten Fingerprint ohne
ausdrückliche Benutzerabsicht oder andere Out-of-Band-Verifizierung nicht als
autoritativen Pin behandeln.

## Handshake + Pairing

1. Client sendet `hello` mit Node-Metadaten + Token (falls bereits gekoppelt).
2. Wenn nicht gekoppelt, antwortet das Gateway mit `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Client sendet `pair-request`.
4. Gateway wartet auf Genehmigung und sendet dann `pair-ok` und `hello-ok`.

Historisch gab `hello-ok` `serverName` zurück und konnte
`canvasHostUrl` enthalten.

## Frames

Client → Gateway:

- `req` / `res`: begrenzter Gateway-RPC (Chat, Sitzungen, Konfiguration, Zustand, Voice-Wake, skills.bins)
- `event`: Node-Signale (Sprachtranskript, Agent-Anfrage, Chat-Abonnement, Exec-Lebenszyklus)

Gateway → Client:

- `invoke` / `invoke-res`: Node-Befehle (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: Chat-Aktualisierungen für abonnierte Sitzungen
- `ping` / `pong`: Keepalive

Die frühere Allowlist-Durchsetzung befand sich in `src/gateway/server-bridge.ts` (entfernt).

## Exec-Lebenszyklusereignisse

Nodes können `exec.finished`- oder `exec.denied`-Ereignisse ausgeben, um system.run-Aktivität sichtbar zu machen.
Diese werden im Gateway system events zugeordnet. (Ältere Nodes können weiterhin `exec.started` ausgeben.)

Payload-Felder (alle optional, sofern nicht anders angegeben):

- `sessionKey` (erforderlich): Agent-Sitzung, die das system event erhalten soll.
- `runId`: eindeutige Exec-ID zur Gruppierung.
- `command`: roher oder formatierter Befehlsstring.
- `exitCode`, `timedOut`, `success`, `output`: Abschlussdetails (nur finished).
- `reason`: Ablehnungsgrund (nur denied).

## Historische Tailnet-Nutzung

- Binden Sie die Bridge an eine Tailnet-IP: `bridge.bind: "tailnet"` in
  `~/.openclaw/openclaw.json` (nur historisch; `bridge.*` ist nicht mehr gültig).
- Clients verbinden sich über den MagicDNS-Namen oder die Tailnet-IP.
- Bonjour überschreitet **keine** Netzwerkgrenzen; verwenden Sie bei Bedarf manuellen Host/Port oder Wide-Area-DNS-SD.

## Versionierung

Die Bridge war **implizit v1** (keine Min-/Max-Aushandlung). Dieser Abschnitt dient
nur als historische Referenz; aktuelle Node-/Operator-Clients verwenden das WebSocket-[Gateway-Protokoll](/de/gateway/protocol).

## Verwandte Themen

- [Gateway-Protokoll](/de/gateway/protocol)
- [Nodes](/de/nodes)
