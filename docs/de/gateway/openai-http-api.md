---
read_when:
    - Tools integrieren, die OpenAI Chat Completions erwarten.
summary: Einen OpenAI-kompatiblen HTTP-Endpunkt `/v1/chat/completions` über das Gateway bereitstellen
title: OpenAI-Chat-Completions
x-i18n:
    generated_at: "2026-04-25T13:47:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a2f45abfc0aef8f73ab909bc3007de4078177214e5e0e5cf27a4c6ad0918172
    source_path: gateway/openai-http-api.md
    workflow: 15
---

Das Gateway von OpenClaw kann einen kleinen OpenAI-kompatiblen Endpunkt für Chat Completions bereitstellen.

Dieser Endpunkt ist **standardmäßig deaktiviert**. Aktivieren Sie ihn zuerst in der Konfiguration.

- `POST /v1/chat/completions`
- Derselbe Port wie das Gateway (WS + HTTP-Multiplexing): `http://<gateway-host>:<port>/v1/chat/completions`

Wenn die OpenAI-kompatible HTTP-Oberfläche des Gateways aktiviert ist, stellt sie außerdem Folgendes bereit:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Intern werden Anfragen als normaler Gateway-Agent-Lauf ausgeführt (derselbe Codepfad wie `openclaw agent`), sodass Routing/Berechtigungen/Konfiguration Ihrem Gateway entsprechen.

## Authentifizierung

Verwendet die Gateway-Authentifizierungskonfiguration.

Häufige HTTP-Authentifizierungspfade:

- Shared-Secret-Authentifizierung (`gateway.auth.mode="token"` oder `"password"`):
  `Authorization: Bearer <token-or-password>`
- vertrauenswürdige identitätstragende HTTP-Authentifizierung (`gateway.auth.mode="trusted-proxy"`):
  über den konfigurierten identitätsbewussten Proxy routen und ihn die
  erforderlichen Identitäts-Header einfügen lassen
- offene Authentifizierung für privaten Ingress (`gateway.auth.mode="none"`):
  kein Authentifizierungs-Header erforderlich

Hinweise:

- Wenn `gateway.auth.mode="token"` gilt, verwenden Sie `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
- Wenn `gateway.auth.mode="password"` gilt, verwenden Sie `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
- Wenn `gateway.auth.mode="trusted-proxy"` gilt, muss die HTTP-Anfrage von einer
  konfigurierten vertrauenswürdigen Nicht-loopback-Proxy-Quelle kommen; Proxys
  auf demselben Host über loopback erfüllen diesen Modus nicht.
- Wenn `gateway.auth.rateLimit` konfiguriert ist und zu viele Authentifizierungsfehler auftreten, gibt der Endpunkt `429` mit `Retry-After` zurück.

## Sicherheitsgrenze (wichtig)

Behandeln Sie diesen Endpunkt als Oberfläche mit **vollständigem Operatorzugriff** für die Gateway-Instanz.

- Bearer-Authentifizierung über HTTP ist hier kein enges Modell mit Bereich pro Benutzer.
- Ein gültiges Gateway-Token/-Passwort für diesen Endpunkt sollte wie eine Eigentümer-/Operator-Anmeldeinformation behandelt werden.
- Anfragen laufen durch denselben Agent-Pfad der Control Plane wie vertrauenswürdige Operatoraktionen.
- Für diesen Endpunkt gibt es keine getrennte Nicht-Eigentümer-/Pro-Benutzer-Tool-Grenze; sobald ein Aufrufer hier die Gateway-Authentifizierung besteht, behandelt OpenClaw diesen Aufrufer als vertrauenswürdigen Operator für dieses Gateway.
- Für Authentifizierungsmodi mit Shared Secret (`token` und `password`) stellt der Endpunkt die normalen vollständigen Operator-Standardeinstellungen wieder her, selbst wenn der Aufrufer einen engeren Header `x-openclaw-scopes` sendet.
- Vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel vertrauenswürdige Proxy-Authentifizierung oder `gateway.auth.mode="none"`) berücksichtigen `x-openclaw-scopes`, wenn vorhanden, und greifen andernfalls auf die normale Standardmenge von Operator-Scopes zurück.
- Wenn die Richtlinie des Ziel-Agent sensible Tools zulässt, kann dieser Endpunkt sie verwenden.
- Halten Sie diesen Endpunkt nur auf loopback/tailnet/privatem Ingress; setzen Sie ihn nicht direkt dem öffentlichen Internet aus.

Auth-Matrix:

- `gateway.auth.mode="token"` oder `"password"` + `Authorization: Bearer ...`
  - weist den Besitz des gemeinsamen Gateway-Operator-Secrets nach
  - ignoriert engere `x-openclaw-scopes`
  - stellt die vollständige Standardmenge an Operator-Scopes wieder her:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt Chat-Turns auf diesem Endpunkt als Turns eines Eigentümer-Absenders
- vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel vertrauenswürdige Proxy-Authentifizierung oder `gateway.auth.mode="none"` bei privatem Ingress)
  - authentifizieren eine äußere vertrauenswürdige Identität oder Deployment-Grenze
  - berücksichtigen `x-openclaw-scopes`, wenn der Header vorhanden ist
  - greifen auf die normale Standardmenge an Operator-Scopes zurück, wenn der Header fehlt
  - verlieren die Eigentümer-Semantik nur, wenn der Aufrufer die Scopes ausdrücklich einschränkt und `operator.admin` weglässt

Siehe [Sicherheit](/de/gateway/security) und [Remote access](/de/gateway/remote).

## Agent-first-Modellvertrag

OpenClaw behandelt das OpenAI-Feld `model` als **Agent-Ziel**, nicht als rohe Provider-Modell-ID.

- `model: "openclaw"` routet zum konfigurierten Standard-Agent.
- `model: "openclaw/default"` routet ebenfalls zum konfigurierten Standard-Agent.
- `model: "openclaw/<agentId>"` routet zu einem bestimmten Agent.

Optionale Anfrage-Header:

- `x-openclaw-model: <provider/model-or-bare-id>` überschreibt das Backend-Modell für den ausgewählten Agent.
- `x-openclaw-agent-id: <agentId>` wird weiterhin als Kompatibilitäts-Überschreibung unterstützt.
- `x-openclaw-session-key: <sessionKey>` steuert das Sitzungsrouting vollständig.
- `x-openclaw-message-channel: <channel>` setzt den synthetischen Ingress-Channel-Kontext für Channel-bewusste Prompts und Richtlinien.

Kompatibilitäts-Aliasse, die weiterhin akzeptiert werden:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Den Endpunkt aktivieren

Setzen Sie `gateway.http.endpoints.chatCompletions.enabled` auf `true`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## Den Endpunkt deaktivieren

Setzen Sie `gateway.http.endpoints.chatCompletions.enabled` auf `false`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## Sitzungsverhalten

Standardmäßig ist der Endpunkt **pro Anfrage zustandslos** (bei jedem Aufruf wird ein neuer Sitzungsschlüssel erzeugt).

Wenn die Anfrage einen OpenAI-String `user` enthält, leitet das Gateway daraus einen stabilen Sitzungsschlüssel ab, sodass wiederholte Aufrufe eine Agent-Sitzung gemeinsam nutzen können.

## Warum diese Oberfläche wichtig ist

Dies ist die Kompatibilitätsmenge mit dem größten Hebel für selbst gehostete Frontends und Tools:

- Die meisten Setups mit Open WebUI, LobeChat und LibreChat erwarten `/v1/models`.
- Viele RAG-Systeme erwarten `/v1/embeddings`.
- Vorhandene OpenAI-Chat-Clients können in der Regel mit `/v1/chat/completions` starten.
- Immer mehr agent-native Clients bevorzugen `/v1/responses`.

## Modellliste und Agent-Routing

<AccordionGroup>
  <Accordion title="Was gibt `/v1/models` zurück?">
    Eine OpenClaw-Agent-Zielliste.

    Die zurückgegebenen IDs sind `openclaw`, `openclaw/default` und `openclaw/<agentId>`.
    Verwenden Sie diese direkt als OpenAI-Werte für `model`.

  </Accordion>
  <Accordion title="Listet `/v1/models` Agents oder Subagents auf?">
    Es listet Agent-Ziele der obersten Ebene auf, nicht Backend-Provider-Modelle und keine Subagents.

    Subagents bleiben interne Ausführungstopologie. Sie erscheinen nicht als Pseudo-Modelle.

  </Accordion>
  <Accordion title="Warum ist `openclaw/default` enthalten?">
    `openclaw/default` ist der stabile Alias für den konfigurierten Standard-Agent.

    Das bedeutet, dass Clients weiterhin eine vorhersehbare ID verwenden können, selbst wenn sich die echte Standard-Agent-ID zwischen Umgebungen ändert.

  </Accordion>
  <Accordion title="Wie überschreibe ich das Backend-Modell?">
    Verwenden Sie `x-openclaw-model`.

    Beispiele:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Wenn Sie den Header weglassen, läuft der ausgewählte Agent mit seiner normal konfigurierten Modellauswahl.

  </Accordion>
  <Accordion title="Wie passen Embeddings in diesen Vertrag?">
    `/v1/embeddings` verwendet dieselben Agent-Ziel-IDs im Feld `model`.

    Verwenden Sie `model: "openclaw/default"` oder `model: "openclaw/<agentId>"`.
    Wenn Sie ein bestimmtes Embedding-Modell benötigen, senden Sie es in `x-openclaw-model`.
    Ohne diesen Header wird die Anfrage an das normale Embedding-Setup des ausgewählten Agent weitergereicht.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Setzen Sie `stream: true`, um Server-Sent Events (SSE) zu empfangen:

- `Content-Type: text/event-stream`
- Jede Ereigniszeile ist `data: <json>`
- Der Stream endet mit `data: [DONE]`

## Schnelleinrichtung für Open WebUI

Für eine grundlegende Open-WebUI-Verbindung:

- Basis-URL: `http://127.0.0.1:18789/v1`
- Basis-URL für Docker auf macOS: `http://host.docker.internal:18789/v1`
- API-Schlüssel: Ihr Gateway-Bearer-Token
- Modell: `openclaw/default`

Erwartetes Verhalten:

- `GET /v1/models` sollte `openclaw/default` auflisten
- Open WebUI sollte `openclaw/default` als ID des Chat-Modells verwenden
- Wenn Sie ein bestimmtes Backend-Provider-/Modell für diesen Agent möchten, legen Sie das normale Standardmodell des Agent fest oder senden Sie `x-openclaw-model`

Schneller Smoke-Test:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Wenn dies `openclaw/default` zurückgibt, können die meisten Open-WebUI-Setups mit derselben Basis-URL und demselben Token eine Verbindung herstellen.

## Beispiele

Nicht streamend:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Streaming:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Modelle auflisten:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Ein Modell abrufen:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Embeddings erstellen:

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

Hinweise:

- `/v1/models` gibt OpenClaw-Agent-Ziele zurück, keine rohen Provider-Kataloge.
- `openclaw/default` ist immer vorhanden, sodass eine stabile ID über Umgebungen hinweg funktioniert.
- Überschreibungen für Backend-Provider/-Modell gehören in `x-openclaw-model`, nicht in das OpenAI-Feld `model`.
- `/v1/embeddings` unterstützt `input` als String oder als Array von Strings.

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [OpenAI](/de/providers/openai)
