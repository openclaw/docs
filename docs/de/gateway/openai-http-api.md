---
read_when:
    - Integrieren von Tools, die OpenAI Chat Completions erwarten
summary: Einen OpenAI-kompatiblen HTTP-Endpunkt /v1/chat/completions über das Gateway bereitstellen
title: OpenAI-Chatvervollständigungen
x-i18n:
    generated_at: "2026-05-06T06:49:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8cd0995cf5f897ae8f99f35fc4b8ea28ebde3cba41da0f3e768ec1de7874b2f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaws Gateway kann einen kleinen OpenAI-kompatiblen Chat-Completions-Endpunkt bereitstellen.

Dieser Endpunkt ist **standardmäßig deaktiviert**. Aktivieren Sie ihn zuerst in der Konfiguration.

- `POST /v1/chat/completions`
- Derselbe Port wie der Gateway (WS + HTTP-Multiplex): `http://<gateway-host>:<port>/v1/chat/completions`

Wenn die OpenAI-kompatible HTTP-Oberfläche des Gateways aktiviert ist, stellt sie außerdem Folgendes bereit:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Intern werden Anfragen als normaler Gateway-Agent-Lauf ausgeführt (derselbe Codepfad wie `openclaw agent`), sodass Routing/Berechtigungen/Konfiguration Ihrem Gateway entsprechen.

## Authentifizierung

Verwendet die Authentifizierungskonfiguration des Gateways.

Gängige HTTP-Authentifizierungspfade:

- Shared-Secret-Authentifizierung (`gateway.auth.mode="token"` oder `"password"`):
  `Authorization: Bearer <token-or-password>`
- vertrauenswürdige, identitätstragende HTTP-Authentifizierung (`gateway.auth.mode="trusted-proxy"`):
  Leiten Sie über den konfigurierten identitätsbewussten Proxy weiter und lassen Sie ihn die
  erforderlichen Identitäts-Header einfügen
- offene Authentifizierung für privaten Eingang (`gateway.auth.mode="none"`):
  kein Authentifizierungs-Header erforderlich

Hinweise:

- Wenn `gateway.auth.mode="token"` gilt, verwenden Sie `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
- Wenn `gateway.auth.mode="password"` gilt, verwenden Sie `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
- Wenn `gateway.auth.mode="trusted-proxy"` gilt, muss die HTTP-Anfrage von einer
  konfigurierten vertrauenswürdigen Proxy-Quelle kommen; Same-Host-loopback-Proxys erfordern explizit
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Wenn `gateway.auth.rateLimit` konfiguriert ist und zu viele Authentifizierungsfehler auftreten, gibt der Endpunkt `429` mit `Retry-After` zurück.

## Sicherheitsgrenze (wichtig)

Behandeln Sie diesen Endpunkt als Oberfläche mit **vollständigem Operator-Zugriff** für die Gateway-Instanz.

- HTTP-Bearer-Authentifizierung ist hier kein enges Pro-Benutzer-Scope-Modell.
- Ein gültiges Gateway-Token/-Passwort für diesen Endpunkt sollte wie ein Owner-/Operator-Zugangsnachweis behandelt werden.
- Anfragen laufen über denselben Control-Plane-Agent-Pfad wie vertrauenswürdige Operator-Aktionen.
- Für diesen Endpunkt gibt es keine separate Nicht-Owner-/Pro-Benutzer-Tool-Grenze; sobald ein Aufrufer hier die Gateway-Authentifizierung besteht, behandelt OpenClaw diesen Aufrufer als vertrauenswürdigen Operator für diesen Gateway.
- Für Shared-Secret-Authentifizierungsmodi (`token` und `password`) stellt der Endpunkt die normalen vollständigen Operator-Standardwerte wieder her, selbst wenn der Aufrufer einen engeren `x-openclaw-scopes`-Header sendet.
- Vertrauenswürdige, identitätstragende HTTP-Modi (zum Beispiel vertrauenswürdige Proxy-Authentifizierung oder `gateway.auth.mode="none"`) berücksichtigen `x-openclaw-scopes`, wenn vorhanden, und fallen andernfalls auf den normalen Operator-Standard-Scope-Satz zurück.
- Wenn die Ziel-Agent-Policy sensible Tools zulässt, kann dieser Endpunkt sie verwenden.
- Halten Sie diesen Endpunkt nur auf loopback/Tailnet/privatem Eingang; setzen Sie ihn nicht direkt dem öffentlichen Internet aus.

Authentifizierungsmatrix:

- `gateway.auth.mode="token"` oder `"password"` + `Authorization: Bearer ...`
  - weist den Besitz des gemeinsamen Gateway-Operator-Secrets nach
  - ignoriert engere `x-openclaw-scopes`
  - stellt den vollständigen Standard-Operator-Scope-Satz wieder her:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt Chat-Turns auf diesem Endpunkt als Owner-Sender-Turns
- vertrauenswürdige, identitätstragende HTTP-Modi (zum Beispiel vertrauenswürdige Proxy-Authentifizierung oder `gateway.auth.mode="none"` auf privatem Eingang)
  - authentifizieren eine äußere vertrauenswürdige Identität oder Bereitstellungsgrenze
  - berücksichtigen `x-openclaw-scopes`, wenn der Header vorhanden ist
  - fallen auf den normalen Operator-Standard-Scope-Satz zurück, wenn der Header fehlt
  - verlieren Owner-Semantik nur, wenn der Aufrufer Scopes explizit verengt und `operator.admin` auslässt

Siehe [Sicherheit](/de/gateway/security) und [Remote-Zugriff](/de/gateway/remote).

## Agent-first-Modellvertrag

OpenClaw behandelt das OpenAI-Feld `model` als **Agent-Ziel**, nicht als rohe Provider-Modell-ID.

- `model: "openclaw"` leitet an den konfigurierten Standard-Agent weiter.
- `model: "openclaw/default"` leitet ebenfalls an den konfigurierten Standard-Agent weiter.
- `model: "openclaw/<agentId>"` leitet an einen bestimmten Agent weiter.

Optionale Anfrage-Header:

- `x-openclaw-model: <provider/model-or-bare-id>` überschreibt das Backend-Modell für den ausgewählten Agent.
- `x-openclaw-agent-id: <agentId>` wird weiterhin als Kompatibilitäts-Override unterstützt.
- `x-openclaw-session-key: <sessionKey>` steuert das Session-Routing vollständig.
- `x-openclaw-message-channel: <channel>` legt den synthetischen Eingangskanal-Kontext für kanalbewusste Prompts und Policies fest.

Weiterhin akzeptierte Kompatibilitätsaliasse:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Endpunkt aktivieren

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

## Endpunkt deaktivieren

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

## Session-Verhalten

Standardmäßig ist der Endpunkt **pro Anfrage zustandslos** (bei jedem Aufruf wird ein neuer Session-Schlüssel generiert).

Wenn die Anfrage eine OpenAI-`user`-Zeichenfolge enthält, leitet der Gateway daraus einen stabilen Session-Schlüssel ab, sodass wiederholte Aufrufe eine Agent-Session teilen können.

## Warum diese Oberfläche wichtig ist

Dies ist der Kompatibilitätssatz mit der größten Wirkung für selbst gehostete Frontends und Tooling:

- Die meisten Open WebUI-, LobeChat- und LibreChat-Setups erwarten `/v1/models`.
- Viele RAG-Systeme erwarten `/v1/embeddings`.
- Bestehende OpenAI-Chat-Clients können in der Regel mit `/v1/chat/completions` starten.
- Agent-nativere Clients bevorzugen zunehmend `/v1/responses`.

## Modellliste und Agent-Routing

<AccordionGroup>
  <Accordion title="Was gibt `/v1/models` zurück?">
    Eine OpenClaw-Agent-Zielliste.

    Die zurückgegebenen IDs sind Einträge wie `openclaw`, `openclaw/default` und `openclaw/<agentId>`.
    Verwenden Sie sie direkt als OpenAI-`model`-Werte.

  </Accordion>
  <Accordion title="Listet `/v1/models` Agents oder Sub-Agents auf?">
    Es listet Top-Level-Agent-Ziele auf, keine Backend-Provider-Modelle und keine Sub-Agents.

    Sub-Agents bleiben interne Ausführungstopologie. Sie erscheinen nicht als Pseudomodelle.

  </Accordion>
  <Accordion title="Warum ist `openclaw/default` enthalten?">
    `openclaw/default` ist der stabile Alias für den konfigurierten Standard-Agent.

    Das bedeutet, dass Clients weiterhin eine vorhersehbare ID verwenden können, auch wenn sich die tatsächliche Standard-Agent-ID zwischen Umgebungen ändert.

  </Accordion>
  <Accordion title="Wie überschreibe ich das Backend-Modell?">
    Verwenden Sie `x-openclaw-model`.

    Beispiele:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Wenn Sie ihn auslassen, wird der ausgewählte Agent mit seiner normal konfigurierten Modellauswahl ausgeführt.

  </Accordion>
  <Accordion title="Wie passen Embeddings in diesen Vertrag?">
    `/v1/embeddings` verwendet dieselben Agent-Ziel-`model`-IDs.

    Verwenden Sie `model: "openclaw/default"` oder `model: "openclaw/<agentId>"`.
    Wenn Sie ein bestimmtes Embedding-Modell benötigen, senden Sie es in `x-openclaw-model`.
    Ohne diesen Header wird die Anfrage an die normale Embedding-Konfiguration des ausgewählten Agent weitergereicht.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Setzen Sie `stream: true`, um Server-Sent Events (SSE) zu empfangen:

- `Content-Type: text/event-stream`
- Jede Ereigniszeile ist `data: <json>`
- Der Stream endet mit `data: [DONE]`

## Schnelleinrichtung für Open WebUI

Für eine einfache Open WebUI-Verbindung:

- Basis-URL: `http://127.0.0.1:18789/v1`
- Docker-Basis-URL unter macOS: `http://host.docker.internal:18789/v1`
- API-Schlüssel: Ihr Gateway-Bearer-Token
- Modell: `openclaw/default`

Erwartetes Verhalten:

- `GET /v1/models` sollte `openclaw/default` auflisten
- Open WebUI sollte `openclaw/default` als Chat-Modell-ID verwenden
- Wenn Sie ein bestimmtes Backend-Provider/-Modell für diesen Agent wünschen, legen Sie das normale Standardmodell des Agent fest oder senden Sie `x-openclaw-model`

Schneller Smoke-Test:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Wenn das `openclaw/default` zurückgibt, können die meisten Open WebUI-Setups mit derselben Basis-URL und demselben Token verbinden.

## Beispiele

Ohne Streaming:

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
- `openclaw/default` ist immer vorhanden, sodass eine stabile ID umgebungsübergreifend funktioniert.
- Backend-Provider/-Modell-Overrides gehören in `x-openclaw-model`, nicht in das OpenAI-Feld `model`.
- `/v1/embeddings` unterstützt `input` als Zeichenfolge oder als Array von Zeichenfolgen.

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [OpenAI](/de/providers/openai)
