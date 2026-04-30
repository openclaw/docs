---
read_when:
    - Integration von Tools, die OpenAI Chat Completions erwarten
summary: Einen OpenAI-kompatiblen /v1/chat/completions-HTTP-Endpunkt über das Gateway bereitstellen
title: OpenAI-Chatvervollständigungen
x-i18n:
    generated_at: "2026-04-30T06:55:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a19f9d9d6d8ce6d605f8af5324ae3eb0c100c167609341c8dfb569970b0b2c9
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw’s Gateway kann einen kleinen OpenAI-kompatiblen Chat-Completions-Endpunkt bereitstellen.

Dieser Endpunkt ist **standardmäßig deaktiviert**. Aktivieren Sie ihn zuerst in der Konfiguration.

- `POST /v1/chat/completions`
- Derselbe Port wie der Gateway (WS + HTTP-Multiplex): `http://<gateway-host>:<port>/v1/chat/completions`

Wenn die OpenAI-kompatible HTTP-Oberfläche des Gateway aktiviert ist, stellt sie außerdem Folgendes bereit:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Intern werden Anfragen als normaler Gateway-Agent-Lauf ausgeführt (derselbe Codepfad wie `openclaw agent`), daher entsprechen Routing/Berechtigungen/Konfiguration Ihrem Gateway.

## Authentifizierung

Verwendet die Authentifizierungskonfiguration des Gateway.

Übliche HTTP-Authentifizierungspfade:

- Shared-Secret-Authentifizierung (`gateway.auth.mode="token"` oder `"password"`):
  `Authorization: Bearer <token-or-password>`
- vertrauenswürdige identitätstragende HTTP-Authentifizierung (`gateway.auth.mode="trusted-proxy"`):
  leiten Sie über den konfigurierten identitätsbewussten Proxy und lassen Sie ihn die
  erforderlichen Identitäts-Header einfügen
- offene Authentifizierung für privaten Ingress (`gateway.auth.mode="none"`):
  kein Authentifizierungs-Header erforderlich

Hinweise:

- Wenn `gateway.auth.mode="token"` gilt, verwenden Sie `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
- Wenn `gateway.auth.mode="password"` gilt, verwenden Sie `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
- Wenn `gateway.auth.mode="trusted-proxy"` gilt, muss die HTTP-Anfrage von einer
  konfigurierten vertrauenswürdigen Proxy-Quelle kommen; local loopback-Proxys auf demselben Host erfordern ausdrücklich
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Wenn `gateway.auth.rateLimit` konfiguriert ist und zu viele Authentifizierungsfehler auftreten, gibt der Endpunkt `429` mit `Retry-After` zurück.

## Sicherheitsgrenze (wichtig)

Behandeln Sie diesen Endpunkt als Oberfläche mit **vollem Operator-Zugriff** für die Gateway-Instanz.

- Die HTTP-Bearer-Authentifizierung ist hier kein enges Scope-Modell pro Benutzer.
- Ein gültiges Gateway-Token/-Passwort für diesen Endpunkt sollte wie Zugangsdaten eines Owners/Operators behandelt werden.
- Anfragen laufen über denselben Control-Plane-Agent-Pfad wie vertrauenswürdige Operator-Aktionen.
- Es gibt an diesem Endpunkt keine separate Tool-Grenze für Nicht-Owner/pro Benutzer; sobald ein Aufrufer hier die Gateway-Authentifizierung besteht, behandelt OpenClaw diesen Aufrufer als vertrauenswürdigen Operator für diesen Gateway.
- Für Shared-Secret-Authentifizierungsmodi (`token` und `password`) stellt der Endpunkt die normalen vollständigen Operator-Standardeinstellungen wieder her, auch wenn der Aufrufer einen engeren `x-openclaw-scopes`-Header sendet.
- Vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel Trusted-Proxy-Authentifizierung oder `gateway.auth.mode="none"`) berücksichtigen `x-openclaw-scopes`, wenn vorhanden, und fallen andernfalls auf das normale Operator-Standard-Scope-Set zurück.
- Wenn die Ziel-Agent-Richtlinie sensible Tools erlaubt, kann dieser Endpunkt sie verwenden.
- Halten Sie diesen Endpunkt nur auf loopback/tailnet/privatem Ingress; setzen Sie ihn nicht direkt dem öffentlichen Internet aus.

Authentifizierungsmatrix:

- `gateway.auth.mode="token"` oder `"password"` + `Authorization: Bearer ...`
  - weist den Besitz des gemeinsamen Gateway-Operator-Secrets nach
  - ignoriert engere `x-openclaw-scopes`
  - stellt das vollständige Standard-Operator-Scope-Set wieder her:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt Chat-Turns an diesem Endpunkt als Owner-Sender-Turns
- vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel Trusted-Proxy-Authentifizierung oder `gateway.auth.mode="none"` auf privatem Ingress)
  - authentifizieren eine äußere vertrauenswürdige Identität oder Bereitstellungsgrenze
  - berücksichtigen `x-openclaw-scopes`, wenn der Header vorhanden ist
  - fallen auf das normale Operator-Standard-Scope-Set zurück, wenn der Header fehlt
  - verlieren Owner-Semantik nur, wenn der Aufrufer Scopes ausdrücklich einschränkt und `operator.admin` auslässt

Siehe [Sicherheit](/de/gateway/security) und [Remotezugriff](/de/gateway/remote).

## Agent-first-Modellvertrag

OpenClaw behandelt das OpenAI-Feld `model` als **Agent-Ziel**, nicht als rohe Provider-Modell-ID.

- `model: "openclaw"` leitet an den konfigurierten Standard-Agent weiter.
- `model: "openclaw/default"` leitet ebenfalls an den konfigurierten Standard-Agent weiter.
- `model: "openclaw/<agentId>"` leitet an einen bestimmten Agent weiter.

Optionale Anfrage-Header:

- `x-openclaw-model: <provider/model-or-bare-id>` überschreibt das Backend-Modell für den ausgewählten Agent.
- `x-openclaw-agent-id: <agentId>` bleibt als Kompatibilitätsüberschreibung unterstützt.
- `x-openclaw-session-key: <sessionKey>` steuert das Sitzungsrouting vollständig.
- `x-openclaw-message-channel: <channel>` legt den synthetischen Ingress-Kanalkontext für kanalbewusste Prompts und Richtlinien fest.

Kompatibilitätsaliasnamen werden weiterhin akzeptiert:

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

## Sitzungsverhalten

Standardmäßig ist der Endpunkt **pro Anfrage zustandslos** (bei jedem Aufruf wird ein neuer Sitzungsschlüssel erzeugt).

Wenn die Anfrage eine OpenAI-`user`-Zeichenfolge enthält, leitet der Gateway daraus einen stabilen Sitzungsschlüssel ab, sodass wiederholte Aufrufe eine Agent-Sitzung teilen können.

## Warum diese Oberfläche wichtig ist

Dies ist das wirksamste Kompatibilitätsset für selbst gehostete Frontends und Tools:

- Die meisten Setups mit Open WebUI, LobeChat und LibreChat erwarten `/v1/models`.
- Viele RAG-Systeme erwarten `/v1/embeddings`.
- Bestehende OpenAI-Chat-Clients können in der Regel mit `/v1/chat/completions` beginnen.
- Agent-nativere Clients bevorzugen zunehmend `/v1/responses`.

## Modellliste und Agent-Routing

<AccordionGroup>
  <Accordion title="Was gibt `/v1/models` zurück?">
    Eine OpenClaw-Agent-Zielliste.

    Die zurückgegebenen IDs sind `openclaw`, `openclaw/default` und `openclaw/<agentId>`-Einträge.
    Verwenden Sie sie direkt als OpenAI-`model`-Werte.

  </Accordion>
  <Accordion title="Listet `/v1/models` Agents oder Sub-Agents auf?">
    Es listet Top-Level-Agent-Ziele auf, keine Backend-Provider-Modelle und keine Sub-Agents.

    Sub-Agents bleiben eine interne Ausführungstopologie. Sie erscheinen nicht als Pseudo-Modelle.

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

    Wenn Sie ihn auslassen, läuft der ausgewählte Agent mit seiner normal konfigurierten Modellwahl.

  </Accordion>
  <Accordion title="Wie passen Embeddings in diesen Vertrag?">
    `/v1/embeddings` verwendet dieselben Agent-Ziel-`model`-IDs.

    Verwenden Sie `model: "openclaw/default"` oder `model: "openclaw/<agentId>"`.
    Wenn Sie ein bestimmtes Embedding-Modell benötigen, senden Sie es in `x-openclaw-model`.
    Ohne diesen Header wird die Anfrage an die normale Embedding-Einrichtung des ausgewählten Agent weitergegeben.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Setzen Sie `stream: true`, um Server-Sent Events (SSE) zu empfangen:

- `Content-Type: text/event-stream`
- Jede Ereigniszeile lautet `data: <json>`
- Der Stream endet mit `data: [DONE]`

## Open WebUI-Schnelleinrichtung

Für eine einfache Open WebUI-Verbindung:

- Basis-URL: `http://127.0.0.1:18789/v1`
- Docker-auf-macOS-Basis-URL: `http://host.docker.internal:18789/v1`
- API-Schlüssel: Ihr Gateway-Bearer-Token
- Modell: `openclaw/default`

Erwartetes Verhalten:

- `GET /v1/models` sollte `openclaw/default` auflisten
- Open WebUI sollte `openclaw/default` als Chat-Modell-ID verwenden
- Wenn Sie einen bestimmten Backend-Provider/ein bestimmtes Backend-Modell für diesen Agent möchten, legen Sie das normale Standardmodell des Agent fest oder senden Sie `x-openclaw-model`

Kurzer Smoke-Test:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Wenn dies `openclaw/default` zurückgibt, können die meisten Open WebUI-Setups mit derselben Basis-URL und demselben Token verbinden.

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
- `openclaw/default` ist immer vorhanden, sodass eine stabile ID über Umgebungen hinweg funktioniert.
- Überschreibungen für Backend-Provider/-Modell gehören in `x-openclaw-model`, nicht in das OpenAI-Feld `model`.
- `/v1/embeddings` unterstützt `input` als Zeichenfolge oder als Array von Zeichenfolgen.

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [OpenAI](/de/providers/openai)
