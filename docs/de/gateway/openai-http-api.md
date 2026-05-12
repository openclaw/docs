---
read_when:
    - Integration von Tools, die OpenAI Chat Completions erwarten
summary: Einen OpenAI-kompatiblen HTTP-Endpunkt /v1/chat/completions über das Gateway bereitstellen
title: OpenAI-Chat-Vervollständigungen
x-i18n:
    generated_at: "2026-05-12T15:43:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 21d901ab70908d6e4e3770e716319b961348c2a7ff6ef9bb2d0ffc6952a073f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Das Gateway von OpenClaw kann einen kleinen OpenAI-kompatiblen Chat-Completions-Endpunkt bereitstellen.

Dieser Endpunkt ist **standardmäßig deaktiviert**. Aktivieren Sie ihn zuerst in der Konfiguration.

- `POST /v1/chat/completions`
- Derselbe Port wie das Gateway (WS + HTTP-Multiplex): `http://<gateway-host>:<port>/v1/chat/completions`

Wenn die OpenAI-kompatible HTTP-Oberfläche des Gateways aktiviert ist, stellt sie außerdem Folgendes bereit:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Im Hintergrund werden Anfragen als normaler Gateway-Agentenlauf ausgeführt (derselbe Codepfad wie `openclaw agent`), sodass Routing/Berechtigungen/Konfiguration Ihrem Gateway entsprechen.

## Authentifizierung

Verwendet die Authentifizierungskonfiguration des Gateways.

Übliche HTTP-Authentifizierungspfade:

- Shared-Secret-Authentifizierung (`gateway.auth.mode="token"` oder `"password"`):
  `Authorization: Bearer <token-or-password>`
- vertrauenswürdige identitätstragende HTTP-Authentifizierung (`gateway.auth.mode="trusted-proxy"`):
  Leiten Sie über den konfigurierten identitätsbewussten Proxy weiter und lassen Sie ihn die
  erforderlichen Identitäts-Header einfügen
- offene Authentifizierung für privaten Ingress (`gateway.auth.mode="none"`):
  kein Authentifizierungs-Header erforderlich

Hinweise:

- Wenn `gateway.auth.mode="token"` ist, verwenden Sie `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
- Wenn `gateway.auth.mode="password"` ist, verwenden Sie `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
- Wenn `gateway.auth.mode="trusted-proxy"` ist, muss die HTTP-Anfrage von einer
  konfigurierten vertrauenswürdigen Proxy-Quelle kommen; local loopback-Proxys auf demselben Host erfordern explizit
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Wenn `gateway.auth.rateLimit` konfiguriert ist und zu viele Authentifizierungsfehler auftreten, gibt der Endpunkt `429` mit `Retry-After` zurück.

## Sicherheitsgrenze (wichtig)

Behandeln Sie diesen Endpunkt als Oberfläche mit **vollständigem Operator-Zugriff** für die Gateway-Instanz.

- HTTP-Bearer-Authentifizierung ist hier kein enges Scope-Modell pro Benutzer.
- Ein gültiges Gateway-Token/Passwort für diesen Endpunkt sollte wie Owner-/Operator-Anmeldedaten behandelt werden.
- Anfragen laufen über denselben Control-Plane-Agentenpfad wie vertrauenswürdige Operator-Aktionen.
- Für diesen Endpunkt gibt es keine separate Nicht-Owner-/Pro-Benutzer-Tool-Grenze; sobald ein Aufrufer hier die Gateway-Authentifizierung besteht, behandelt OpenClaw diesen Aufrufer als vertrauenswürdigen Operator für dieses Gateway.
- Für Shared-Secret-Authentifizierungsmodi (`token` und `password`) stellt der Endpunkt die normalen vollständigen Operator-Standardwerte wieder her, selbst wenn der Aufrufer einen engeren `x-openclaw-scopes`-Header sendet.
- Vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel vertrauenswürdige Proxy-Authentifizierung oder `gateway.auth.mode="none"`) berücksichtigen `x-openclaw-scopes`, wenn vorhanden, und fallen andernfalls auf die normale Standard-Scope-Menge für Operatoren zurück.
- Wenn die Richtlinie des Ziel-Agenten sensible Tools erlaubt, kann dieser Endpunkt sie verwenden.
- Halten Sie diesen Endpunkt ausschließlich auf Loopback/Tailnet/privatem Ingress; setzen Sie ihn nicht direkt dem öffentlichen Internet aus.

Authentifizierungsmatrix:

- `gateway.auth.mode="token"` oder `"password"` + `Authorization: Bearer ...`
  - weist den Besitz des gemeinsamen Gateway-Operator-Secrets nach
  - ignoriert engere `x-openclaw-scopes`
  - stellt die vollständige Standard-Scope-Menge für Operatoren wieder her:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt Chat-Turns auf diesem Endpunkt als Owner-Sender-Turns
- vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel vertrauenswürdige Proxy-Authentifizierung oder `gateway.auth.mode="none"` auf privatem Ingress)
  - authentifizieren eine äußere vertrauenswürdige Identität oder Deployment-Grenze
  - berücksichtigen `x-openclaw-scopes`, wenn der Header vorhanden ist
  - fallen auf die normale Standard-Scope-Menge für Operatoren zurück, wenn der Header fehlt
  - verlieren Owner-Semantik nur, wenn der Aufrufer Scopes explizit einschränkt und `operator.admin` auslässt

Siehe [Sicherheit](/de/gateway/security) und [Remote-Zugriff](/de/gateway/remote).

## Agent-First-Modellvertrag

OpenClaw behandelt das OpenAI-Feld `model` als **Agentenziel**, nicht als rohe Provider-Modell-ID.

- `model: "openclaw"` leitet an den konfigurierten Standard-Agenten weiter.
- `model: "openclaw/default"` leitet ebenfalls an den konfigurierten Standard-Agenten weiter.
- `model: "openclaw/<agentId>"` leitet an einen bestimmten Agenten weiter.

Optionale Anfrage-Header:

- `x-openclaw-model: <provider/model-or-bare-id>` überschreibt das Backend-Modell für den ausgewählten Agenten.
- `x-openclaw-agent-id: <agentId>` bleibt als Kompatibilitätsüberschreibung unterstützt.
- `x-openclaw-session-key: <sessionKey>` steuert das Sitzungsrouting vollständig.
- `x-openclaw-message-channel: <channel>` legt den synthetischen Ingress-Channel-Kontext für Channel-bewusste Prompts und Richtlinien fest.

Kompatibilitäts-Aliasse werden weiterhin akzeptiert:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Aktivieren des Endpunkts

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

## Deaktivieren des Endpunkts

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

Wenn die Anfrage eine OpenAI-`user`-Zeichenfolge enthält, leitet das Gateway daraus einen stabilen Sitzungsschlüssel ab, sodass wiederholte Aufrufe eine Agentensitzung gemeinsam nutzen können.

## Warum diese Oberfläche wichtig ist

Dies ist das wirkungsvollste Kompatibilitätsset für selbst gehostete Frontends und Tooling:

- Die meisten Setups von Open WebUI, LobeChat und LibreChat erwarten `/v1/models`.
- Viele RAG-Systeme erwarten `/v1/embeddings`.
- Bestehende OpenAI-Chat-Clients können in der Regel mit `/v1/chat/completions` starten.
- Stärker agentennative Clients bevorzugen zunehmend `/v1/responses`.

## Modellliste und Agentenrouting

<AccordionGroup>
  <Accordion title="Was gibt `/v1/models` zurück?">
    Eine OpenClaw-Agentenziel-Liste.

    Die zurückgegebenen IDs sind Einträge für `openclaw`, `openclaw/default` und `openclaw/<agentId>`.
    Verwenden Sie sie direkt als OpenAI-`model`-Werte.

  </Accordion>
  <Accordion title="Listet `/v1/models` Agenten oder Sub-Agenten auf?">
    Es listet Top-Level-Agentenziele auf, keine Backend-Provider-Modelle und keine Sub-Agenten.

    Sub-Agenten bleiben interne Ausführungstopologie. Sie erscheinen nicht als Pseudo-Modelle.

  </Accordion>
  <Accordion title="Warum ist `openclaw/default` enthalten?">
    `openclaw/default` ist der stabile Alias für den konfigurierten Standard-Agenten.

    Das bedeutet, dass Clients weiterhin eine vorhersehbare ID verwenden können, selbst wenn sich die echte Standard-Agenten-ID zwischen Umgebungen ändert.

  </Accordion>
  <Accordion title="Wie überschreibe ich das Backend-Modell?">
    Verwenden Sie `x-openclaw-model`.

    Beispiele:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Wenn Sie ihn weglassen, läuft der ausgewählte Agent mit seiner normal konfigurierten Modellauswahl.

  </Accordion>
  <Accordion title="Wie passen Embeddings in diesen Vertrag?">
    `/v1/embeddings` verwendet dieselben Agentenziel-`model`-IDs.

    Verwenden Sie `model: "openclaw/default"` oder `model: "openclaw/<agentId>"`.
    Wenn Sie ein bestimmtes Embedding-Modell benötigen, senden Sie es in `x-openclaw-model`.
    Ohne diesen Header wird die Anfrage an das normale Embedding-Setup des ausgewählten Agenten weitergereicht.

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
- `messages[*].role: "tool"`-Folge-Turns
- `messages[*].tool_call_id` zum Binden von Tool-Ergebnissen an einen vorherigen Tool-Aufruf
- `max_completion_tokens`: Zahl; Obergrenze pro Aufruf für die gesamten Completion-Tokens (Reasoning-Tokens eingeschlossen). Aktueller OpenAI-Chat-Completions-Feldname; bevorzugt, wenn sowohl `max_completion_tokens` als auch `max_tokens` gesendet werden.
- `max_tokens`: Zahl; Legacy-Alias, der aus Gründen der Abwärtskompatibilität akzeptiert wird. Wird ignoriert, wenn `max_completion_tokens` ebenfalls vorhanden ist.

Wenn eines der Felder gesetzt ist, wird der Wert über den Agenten-Stream-Param-Channel an den Upstream-Provider weitergeleitet. Der tatsächliche Wire-Feldname, der an den Upstream-Provider gesendet wird, wird vom Provider-Transport gewählt: `max_completion_tokens` für Endpunkte der OpenAI-Familie und `max_tokens` für Provider, die nur den Legacy-Namen akzeptieren (wie Mistral und Chutes).

### Nicht unterstützte Varianten

Der Endpunkt gibt `400 invalid_request_error` für nicht unterstützte Tool-Varianten zurück, darunter:

- Nicht-Array-`tools`
- Nicht-Function-Tool-Einträge
- fehlendes `tool.function.name`
- `tool_choice`-Varianten wie `allowed_tools` und `custom`
- `tool_choice: "required"` (zur Laufzeit noch nicht erzwungen; wird unterstützt, sobald harte Erzwingung implementiert ist)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (gleiche Begründung wie bei `required`)
- `tool_choice.function.name`-Werte, die nicht zu den bereitgestellten `tools` passen

### Antwortform bei nicht streamenden Tools

Wenn der Agent entscheidet, Tools aufzurufen, verwendet die Antwort:

- `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]`-Einträge mit:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (JSON-Zeichenfolge)

Assistant-Kommentare vor dem Tool-Aufruf werden in `choices[0].message.content` zurückgegeben (möglicherweise leer).

### Antwortform bei streamenden Tools

Wenn `stream: true`, werden Tool-Aufrufe als inkrementelle SSE-Chunks ausgegeben:

- initiales Assistant-Rollen-Delta
- optionale Assistant-Kommentar-Deltas
- ein oder mehrere `delta.tool_calls`-Chunks mit Tool-Identität und Argumentfragmenten
- finaler Chunk mit `finish_reason: "tool_calls"`
- `data: [DONE]`

Wenn `stream_options.include_usage=true`, wird vor `[DONE]` ein abschließender Nutzungs-Chunk ausgegeben.

### Tool-Follow-up-Schleife

Nach dem Empfang von `tool_calls` sollte der Client die angeforderte(n) Funktion(en) ausführen und eine Folgeanfrage senden, die Folgendes enthält:

- vorherige Assistant-Tool-Call-Nachricht
- eine oder mehrere `role: "tool"`-Nachrichten mit passender `tool_call_id`

Dadurch kann der Gateway-Agentenlauf dieselbe Reasoning-Schleife fortsetzen und die endgültige Assistant-Antwort erzeugen.

## Open WebUI-Schnelleinrichtung

Für eine einfache Open WebUI-Verbindung:

- Basis-URL: `http://127.0.0.1:18789/v1`
- Docker-auf-macOS-Basis-URL: `http://host.docker.internal:18789/v1`
- API-Schlüssel: Ihr Gateway-Bearer-Token
- Modell: `openclaw/default`

Erwartetes Verhalten:

- `GET /v1/models` sollte `openclaw/default` auflisten
- Open WebUI sollte `openclaw/default` als Chat-Modell-ID verwenden
- Wenn Sie einen bestimmten Backend-Provider/ein bestimmtes Backend-Modell für diesen Agenten wünschen, setzen Sie das normale Standardmodell des Agenten oder senden Sie `x-openclaw-model`

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

- `/v1/models` gibt OpenClaw-Agent-Ziele zurück, nicht rohe Provider-Kataloge.
- `openclaw/default` ist immer vorhanden, sodass eine stabile ID über Umgebungen hinweg funktioniert.
- Backend-Provider-/Modellüberschreibungen gehören in `x-openclaw-model`, nicht in das OpenAI-Feld `model`.
- `/v1/embeddings` unterstützt `input` als Zeichenfolge oder als Array von Zeichenfolgen.

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [OpenAI](/de/providers/openai)
