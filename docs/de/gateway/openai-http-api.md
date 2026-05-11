---
read_when:
    - Tools integrieren, die OpenAI Chat Completions erwarten
summary: Einen OpenAI-kompatiblen /v1/chat/completions-HTTP-Endpunkt über das Gateway bereitstellen
title: OpenAI-Chatvervollständigungen
x-i18n:
    generated_at: "2026-05-11T20:29:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71e25fc1299754ebc65d3998834dc5e9c03acfbd005387aef96f946be1d04a1
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaws Gateway kann einen kleinen OpenAI-kompatiblen Chat-Completions-Endpunkt bereitstellen.

Dieser Endpunkt ist **standardmäßig deaktiviert**. Aktivieren Sie ihn zuerst in der Konfiguration.

- `POST /v1/chat/completions`
- Derselbe Port wie der Gateway (WS + HTTP-Multiplex): `http://<gateway-host>:<port>/v1/chat/completions`

Wenn die OpenAI-kompatible HTTP-Oberfläche des Gateway aktiviert ist, stellt er außerdem Folgendes bereit:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Intern werden Anfragen als normaler Gateway-Agent-Lauf ausgeführt (derselbe Codepfad wie `openclaw agent`), daher entsprechen Routing/Berechtigungen/Konfiguration Ihrem Gateway.

## Authentifizierung

Verwendet die Gateway-Authentifizierungskonfiguration.

Gängige HTTP-Authentifizierungspfade:

- Authentifizierung mit gemeinsamem Secret (`gateway.auth.mode="token"` oder `"password"`):
  `Authorization: Bearer <token-or-password>`
- vertrauenswürdige identitätstragende HTTP-Authentifizierung (`gateway.auth.mode="trusted-proxy"`):
  über den konfigurierten identitätsbewussten Proxy routen und ihn die
  erforderlichen Identitätsheader einfügen lassen
- offene Authentifizierung für privaten Ingress (`gateway.auth.mode="none"`):
  kein Authentifizierungsheader erforderlich

Hinweise:

- Wenn `gateway.auth.mode="token"` gilt, verwenden Sie `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
- Wenn `gateway.auth.mode="password"` gilt, verwenden Sie `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
- Wenn `gateway.auth.mode="trusted-proxy"` gilt, muss die HTTP-Anfrage von einer
  konfigurierten vertrauenswürdigen Proxy-Quelle kommen; Loopback-Proxys auf demselben Host erfordern explizit
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Wenn `gateway.auth.rateLimit` konfiguriert ist und zu viele Authentifizierungsfehler auftreten, gibt der Endpunkt `429` mit `Retry-After` zurück.

## Sicherheitsgrenze (wichtig)

Behandeln Sie diesen Endpunkt als Oberfläche mit **vollständigem Operator-Zugriff** für die Gateway-Instanz.

- HTTP-Bearer-Authentifizierung ist hier kein enges Scope-Modell pro Benutzer.
- Ein gültiges Gateway-Token/Passwort für diesen Endpunkt sollte wie ein Owner-/Operator-Zugangsdatenpaar behandelt werden.
- Anfragen laufen über denselben Control-Plane-Agent-Pfad wie vertrauenswürdige Operator-Aktionen.
- Es gibt keine separate Tool-Grenze für Nicht-Owner/pro Benutzer an diesem Endpunkt; sobald ein Aufrufer hier die Gateway-Authentifizierung besteht, behandelt OpenClaw diesen Aufrufer als vertrauenswürdigen Operator für diesen Gateway.
- Für Authentifizierungsmodi mit gemeinsamem Secret (`token` und `password`) stellt der Endpunkt die normalen vollständigen Operator-Standardwerte wieder her, selbst wenn der Aufrufer einen engeren `x-openclaw-scopes`-Header sendet.
- Vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel Trusted-Proxy-Authentifizierung oder `gateway.auth.mode="none"`) berücksichtigen `x-openclaw-scopes`, wenn vorhanden, und fallen andernfalls auf den normalen Operator-Standard-Scope-Satz zurück.
- Wenn die Ziel-Agent-Richtlinie sensitive Tools erlaubt, kann dieser Endpunkt sie verwenden.
- Halten Sie diesen Endpunkt nur auf Loopback/Tailnet/privatem Ingress; setzen Sie ihn nicht direkt dem öffentlichen Internet aus.

Authentifizierungsmatrix:

- `gateway.auth.mode="token"` oder `"password"` + `Authorization: Bearer ...`
  - weist den Besitz des gemeinsamen Gateway-Operator-Secrets nach
  - ignoriert engere `x-openclaw-scopes`
  - stellt den vollständigen Standard-Operator-Scope-Satz wieder her:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt Chat-Turns an diesem Endpunkt als Owner-Sender-Turns
- vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel Trusted-Proxy-Authentifizierung oder `gateway.auth.mode="none"` auf privatem Ingress)
  - authentifizieren eine äußere vertrauenswürdige Identität oder Deployment-Grenze
  - berücksichtigen `x-openclaw-scopes`, wenn der Header vorhanden ist
  - fallen auf den normalen Operator-Standard-Scope-Satz zurück, wenn der Header fehlt
  - verlieren Owner-Semantik nur, wenn der Aufrufer Scopes ausdrücklich einschränkt und `operator.admin` auslässt

Siehe [Sicherheit](/de/gateway/security) und [Remote-Zugriff](/de/gateway/remote).

## Agent-first-Modellvertrag

OpenClaw behandelt das OpenAI-`model`-Feld als **Agent-Ziel**, nicht als rohe Provider-Modell-ID.

- `model: "openclaw"` routet zum konfigurierten Standard-Agent.
- `model: "openclaw/default"` routet ebenfalls zum konfigurierten Standard-Agent.
- `model: "openclaw/<agentId>"` routet zu einem bestimmten Agent.

Optionale Anfrageheader:

- `x-openclaw-model: <provider/model-or-bare-id>` überschreibt das Backend-Modell für den ausgewählten Agent.
- `x-openclaw-agent-id: <agentId>` bleibt als Kompatibilitätsüberschreibung unterstützt.
- `x-openclaw-session-key: <sessionKey>` steuert das Sitzungsrouting vollständig.
- `x-openclaw-message-channel: <channel>` legt den synthetischen Ingress-Channel-Kontext für channel-bewusste Prompts und Richtlinien fest.

Kompatibilitätsaliasse werden weiterhin akzeptiert:

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

Standardmäßig ist der Endpunkt **pro Anfrage zustandslos** (bei jedem Aufruf wird ein neuer Sitzungsschlüssel generiert).

Wenn die Anfrage eine OpenAI-`user`-Zeichenfolge enthält, leitet der Gateway daraus einen stabilen Sitzungsschlüssel ab, sodass wiederholte Aufrufe eine Agent-Sitzung teilen können.

## Warum diese Oberfläche wichtig ist

Dies ist der wirkungsvollste Kompatibilitätssatz für selbst gehostete Frontends und Tools:

- Die meisten Open WebUI-, LobeChat- und LibreChat-Setups erwarten `/v1/models`.
- Viele RAG-Systeme erwarten `/v1/embeddings`.
- Bestehende OpenAI-Chat-Clients können üblicherweise mit `/v1/chat/completions` starten.
- Stärker agent-native Clients bevorzugen zunehmend `/v1/responses`.

## Modellliste und Agent-Routing

<AccordionGroup>
  <Accordion title="What does `/v1/models` return?">
    Eine OpenClaw-Agent-Zielliste.

    Die zurückgegebenen IDs sind Einträge für `openclaw`, `openclaw/default` und `openclaw/<agentId>`.
    Verwenden Sie sie direkt als OpenAI-`model`-Werte.

  </Accordion>
  <Accordion title="Does `/v1/models` list agents or sub-agents?">
    Es listet Agent-Ziele der obersten Ebene auf, keine Backend-Provider-Modelle und keine Sub-Agents.

    Sub-Agents bleiben interne Ausführungstopologie. Sie erscheinen nicht als Pseudo-Modelle.

  </Accordion>
  <Accordion title="Why is `openclaw/default` included?">
    `openclaw/default` ist der stabile Alias für den konfigurierten Standard-Agent.

    Das bedeutet, dass Clients weiterhin eine vorhersehbare ID verwenden können, selbst wenn sich die tatsächliche Standard-Agent-ID zwischen Umgebungen ändert.

  </Accordion>
  <Accordion title="How do I override the backend model?">
    Verwenden Sie `x-openclaw-model`.

    Beispiele:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Wenn Sie ihn auslassen, läuft der ausgewählte Agent mit seiner normal konfigurierten Modellauswahl.

  </Accordion>
  <Accordion title="How do embeddings fit this contract?">
    `/v1/embeddings` verwendet dieselben Agent-Ziel-`model`-IDs.

    Verwenden Sie `model: "openclaw/default"` oder `model: "openclaw/<agentId>"`.
    Wenn Sie ein bestimmtes Embedding-Modell benötigen, senden Sie es in `x-openclaw-model`.
    Ohne diesen Header wird die Anfrage an die normale Embedding-Einrichtung des ausgewählten Agent weitergereicht.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Setzen Sie `stream: true`, um Server-Sent Events (SSE) zu empfangen:

- `Content-Type: text/event-stream`
- Jede Ereigniszeile ist `data: <json>`
- Der Stream endet mit `data: [DONE]`

## Chat-Tool-Vertrag

`/v1/chat/completions` unterstützt eine Function-Tool-Teilmenge, die mit gängigen OpenAI-Chat-Clients kompatibel ist.

### Unterstützte Anfragefelder

- `tools`: Array von `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`
- `messages[*].role: "tool"`-Follow-up-Turns
- `messages[*].tool_call_id` zum Zurückbinden von Tool-Ergebnissen an einen vorherigen Tool-Aufruf

### Nicht unterstützte Varianten

Der Endpunkt gibt `400 invalid_request_error` für nicht unterstützte Tool-Varianten zurück, einschließlich:

- nicht als Array vorliegende `tools`
- Nicht-Function-Tool-Einträge
- fehlender `tool.function.name`
- `tool_choice`-Varianten wie `allowed_tools` und `custom`
- `tool_choice: "required"` (zur Laufzeit noch nicht erzwungen; wird unterstützt, sobald harte Erzwingung implementiert ist)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (dieselbe Begründung wie bei `required`)
- `tool_choice.function.name`-Werte, die nicht mit bereitgestellten `tools` übereinstimmen

### Form der nicht streamenden Tool-Antwort

Wenn der Agent entscheidet, Tools aufzurufen, verwendet die Antwort:

- `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]`-Einträge mit:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (JSON-Zeichenfolge)

Assistant-Kommentar vor dem Tool-Aufruf wird in `choices[0].message.content` zurückgegeben (möglicherweise leer).

### Form der streamenden Tool-Antwort

Wenn `stream: true` gilt, werden Tool-Aufrufe als inkrementelle SSE-Chunks ausgegeben:

- anfängliches Assistant-Rollendelta
- optionale Assistant-Kommentardeltas
- ein oder mehrere `delta.tool_calls`-Chunks mit Tool-Identität und Argumentfragmenten
- finaler Chunk mit `finish_reason: "tool_calls"`
- `data: [DONE]`

Wenn `stream_options.include_usage=true` gilt, wird vor `[DONE]` ein nachlaufender Usage-Chunk ausgegeben.

### Tool-Follow-up-Schleife

Nach Empfang von `tool_calls` sollte der Client die angeforderte(n) Funktion(en) ausführen und eine Follow-up-Anfrage senden, die Folgendes enthält:

- vorherige Assistant-Tool-Call-Nachricht
- eine oder mehrere `role: "tool"`-Nachrichten mit passendem `tool_call_id`

Dadurch kann der Gateway-Agent-Lauf dieselbe Reasoning-Schleife fortsetzen und die endgültige Assistant-Antwort erzeugen.

## Open WebUI-Schnelleinrichtung

Für eine grundlegende Open WebUI-Verbindung:

- Basis-URL: `http://127.0.0.1:18789/v1`
- Docker unter macOS Basis-URL: `http://host.docker.internal:18789/v1`
- API-Schlüssel: Ihr Gateway-Bearer-Token
- Modell: `openclaw/default`

Erwartetes Verhalten:

- `GET /v1/models` sollte `openclaw/default` auflisten
- Open WebUI sollte `openclaw/default` als Chat-Modell-ID verwenden
- Wenn Sie einen bestimmten Backend-Provider/ein bestimmtes Backend-Modell für diesen Agent wünschen, legen Sie das normale Standardmodell des Agent fest oder senden Sie `x-openclaw-model`

Schneller Smoke-Test:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Wenn dies `openclaw/default` zurückgibt, können die meisten Open WebUI-Setups mit derselben Basis-URL und demselben Token verbinden.

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

Streamend:

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
- `openclaw/default` ist immer vorhanden, damit eine stabile ID über Umgebungen hinweg funktioniert.
- Überschreibungen für Backend-Provider/Modell gehören in `x-openclaw-model`, nicht in das OpenAI-`model`-Feld.
- `/v1/embeddings` unterstützt `input` als Zeichenfolge oder als Array von Zeichenfolgen.

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [OpenAI](/de/providers/openai)
