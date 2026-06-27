---
read_when:
    - Node-Clients erstellen oder debuggen (iOS-/Android-/macOS-Node-Modus)
    - Pairing- oder Bridge-Authentifizierungsfehler untersuchen
    - Prüfung der vom Gateway offengelegten Node-Oberfläche
summary: 'Historisches Bridge-Protokoll (Legacy-Knoten): TCP JSONL, Kopplung, scoped RPC'
title: Brückenprotokoll
x-i18n:
    generated_at: "2026-06-27T17:27:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 485d18f94b731018c6e0df493068b0b6aceff9afba6bebf1350db63c04cee98c
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Die TCP-Bridge wurde **entfernt**. Aktuelle OpenClaw-Builds liefern den Bridge-Listener nicht aus, und `bridge.*`-Konfigurationsschlüssel sind nicht mehr im Schema enthalten. Diese Seite wird nur als historische Referenz beibehalten. Verwenden Sie das [Gateway-Protokoll](/de/gateway/protocol) für alle Node-/Operator-Clients.
</Warning>

## Warum es sie gab

- **Sicherheitsgrenze**: Die Bridge stellt eine kleine Zulassungsliste statt der
  vollständigen Gateway-API-Oberfläche bereit.
- **Pairing + Node-Identität**: Die Node-Zulassung gehört dem Gateway und ist an
  ein Token pro Node gebunden.
- **Discovery-UX**: Nodes können Gateways per Bonjour im LAN erkennen oder sich
  direkt über ein Tailnet verbinden.
- **Loopback-WS**: Die vollständige WS-Steuerungsebene bleibt lokal, sofern sie nicht per SSH getunnelt wird.

## Transport

- TCP, ein JSON-Objekt pro Zeile (JSONL).
- Optionales TLS (wenn `bridge.tls.enabled` true ist).
- Der historische Standard-Listener-Port war `18790` (aktuelle Builds starten keine
  TCP-Bridge).

Wenn TLS aktiviert ist, enthalten Discovery-TXT-Einträge `bridgeTls=1` plus
`bridgeTlsSha256` als nicht geheime Kennung. Beachten Sie, dass Bonjour-/mDNS-TXT-Einträge
nicht authentifiziert sind; Clients dürfen den beworbenen Fingerprint ohne ausdrückliche Nutzerabsicht oder andere Out-of-Band-Verifizierung nicht als
autoritativen Pin behandeln.

## Handshake + Pairing

1. Der Client sendet `hello` mit Node-Metadaten + Token (falls bereits gepairt).
2. Wenn nicht gepairt, antwortet das Gateway mit `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Der Client sendet `pair-request`.
4. Das Gateway wartet auf Genehmigung und sendet dann `pair-ok` und `hello-ok`.

Historisch gab `hello-ok` `serverName` zurück; gehostete Plugin-Oberflächen werden jetzt
über `pluginSurfaceUrls` bekanntgegeben. Canvas/A2UI verwendet
`pluginSurfaceUrls.canvas`; der veraltete Alias `canvasHostUrl` ist nicht Teil des
überarbeiteten Protokolls.

## Frames

Client → Gateway:

- `req` / `res`: Gateway-RPC mit begrenztem Scope (Chat, Sitzungen, Konfiguration, Zustand, Voicewake, skills.bins)
- `event`: Node-Signale (Sprachtranskript, Agent-Anforderung, Chat-Abonnement, Exec-Lifecycle)

Gateway → Client:

- `invoke` / `invoke-res`: Node-Befehle (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: Chat-Aktualisierungen für abonnierte Sitzungen
- `ping` / `pong`: Keepalive

Die Legacy-Durchsetzung der Zulassungsliste befand sich in `src/gateway/server-bridge.ts` (entfernt).

## Exec-Lifecycle-Ereignisse

Nodes können `exec.finished`-Ereignisse ausgeben, um abgeschlossene `system.run`-Aktivität sichtbar zu machen.
Diese werden im Gateway auf Systemereignisse abgebildet. (Legacy-Nodes können weiterhin `exec.started` ausgeben.)
Nodes können `exec.denied` für abgelehnte `system.run`-Versuche ausgeben; das Gateway akzeptiert
das Ereignis als terminale Ablehnung und stellt kein Systemereignis ein und weckt keine Agent-Arbeit.

Payload-Felder (alle optional, sofern nicht angegeben):

- `sessionKey` (erforderlich): Agent-Sitzung für Ereigniskorrelation und, für
  `exec.finished`, Systemereigniszustellung.
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
nur als historische Referenz; aktuelle Node-/Operator-Clients verwenden das WebSocket-
[Gateway-Protokoll](/de/gateway/protocol).

## Verwandt

- [Gateway-Protokoll](/de/gateway/protocol)
- [Nodes](/de/nodes)
