---
read_when:
    - OpenAI Chat Completions erwartende Tools integrieren
summary: Stellen Sie einen OpenAI-kompatiblen HTTP-Endpunkt /v1/chat/completions über den Gateway bereit
title: OpenAI-Chat-Completions
x-i18n:
    generated_at: "2026-06-27T17:31:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8746f4f5964a5d0b948877b64b5d20440dea3aa45b36813c404cd06660792cf
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Der Gateway von OpenClaw kann einen kleinen OpenAI-kompatiblen Chat-Completions-Endpunkt bereitstellen.

Dieser Endpunkt ist **standardmäßig deaktiviert**. Aktivieren Sie ihn zuerst in der Konfiguration.

- `POST /v1/chat/completions`
- Derselbe Port wie der Gateway (WS- und HTTP-Multiplex): `http://<gateway-host>:<port>/v1/chat/completions`

Wenn die OpenAI-kompatible HTTP-Oberfläche des Gateways aktiviert ist, stellt sie außerdem Folgendes bereit:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Intern werden Anfragen als normaler Gateway-Agent-Lauf ausgeführt (derselbe Codepfad wie `openclaw agent`), daher entsprechen Routing/Berechtigungen/Konfiguration Ihrem Gateway.

## Authentifizierung

Verwendet die Authentifizierungskonfiguration des Gateways.

Gängige HTTP-Authentifizierungspfade:

- Authentifizierung mit gemeinsamem Secret (`gateway.auth.mode="token"` oder `"password"`):
  `Authorization: Bearer <token-or-password>`
- vertrauenswürdige HTTP-Authentifizierung mit Identität (`gateway.auth.mode="trusted-proxy"`):
  Leiten Sie über den konfigurierten identitätsbewussten Proxy weiter und lassen Sie ihn die
  erforderlichen Identitäts-Header einfügen
- offene Authentifizierung bei privatem Ingress (`gateway.auth.mode="none"`):
  kein Authentifizierungs-Header erforderlich

Hinweise:

- Wenn `gateway.auth.mode="token"` ist, verwenden Sie `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
- Wenn `gateway.auth.mode="password"` ist, verwenden Sie `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
- Wenn `gateway.auth.mode="trusted-proxy"` ist, muss die HTTP-Anfrage von einer
  konfigurierten vertrauenswürdigen Proxy-Quelle kommen; Loopback-Proxys auf demselben Host erfordern explizit
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Interne Aufrufer auf demselben Host, die den Proxy umgehen, können
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` als lokalen direkten
  Fallback verwenden. Hinweise in Headern wie `Forwarded`, `X-Forwarded-*` oder `X-Real-IP`
  halten die Anfrage stattdessen auf dem Trusted-Proxy-Pfad.
- Wenn `gateway.auth.rateLimit` konfiguriert ist und zu viele Authentifizierungsfehler auftreten, gibt der Endpunkt `429` mit `Retry-After` zurück.

## Sicherheitsgrenze (wichtig)

Behandeln Sie diesen Endpunkt als Oberfläche mit **vollständigem Operator-Zugriff** für die Gateway-Instanz.

- HTTP-Bearer-Authentifizierung ist hier kein enges Scope-Modell pro Benutzer.
- Ein gültiges Gateway-Token/Passwort für diesen Endpunkt sollte wie ein Owner-/Operator-Zugang behandelt werden.
- Anfragen laufen über denselben Control-Plane-Agent-Pfad wie vertrauenswürdige Operator-Aktionen.
- Es gibt an diesem Endpunkt keine separate Tool-Grenze für Nicht-Owner/pro Benutzer; sobald ein Aufrufer hier die Gateway-Authentifizierung besteht, behandelt OpenClaw diesen Aufrufer als vertrauenswürdigen Operator für diesen Gateway.
- Für Authentifizierungsmodi mit gemeinsamem Secret (`token` und `password`) stellt der Endpunkt die normalen vollständigen Operator-Standards wieder her, selbst wenn der Aufrufer einen engeren `x-openclaw-scopes`-Header sendet.
- Vertrauenswürdige HTTP-Modi mit Identität (zum Beispiel Trusted-Proxy-Authentifizierung oder `gateway.auth.mode="none"`) berücksichtigen `x-openclaw-scopes`, wenn vorhanden, und fallen andernfalls auf die normale Operator-Standardmenge von Scopes zurück.
- Wenn die Ziel-Agent-Richtlinie sensible Tools erlaubt, kann dieser Endpunkt sie verwenden.
- Halten Sie diesen Endpunkt ausschließlich auf Loopback/Tailnet/privatem Ingress; setzen Sie ihn nicht direkt dem öffentlichen Internet aus.

Authentifizierungsmatrix:

- `gateway.auth.mode="token"` oder `"password"` + `Authorization: Bearer ...`
  - weist den Besitz des gemeinsamen Gateway-Operator-Secrets nach
  - ignoriert engere `x-openclaw-scopes`
  - stellt die vollständige Standardmenge von Operator-Scopes wieder her:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt Chat-Turns an diesem Endpunkt als Owner-Sender-Turns
- vertrauenswürdige HTTP-Modi mit Identität (zum Beispiel Trusted-Proxy-Authentifizierung oder `gateway.auth.mode="none"` bei privatem Ingress)
  - authentifizieren eine äußere vertrauenswürdige Identität oder Deployment-Grenze
  - berücksichtigen `x-openclaw-scopes`, wenn der Header vorhanden ist
  - fallen auf die normale Operator-Standardmenge von Scopes zurück, wenn der Header fehlt
  - verlieren Owner-Semantik nur, wenn der Aufrufer Scopes explizit einschränkt und `operator.admin` auslässt
  - erfordern `operator.admin` für Request-Steuerungen auf Owner-Ebene wie `x-openclaw-model`

Siehe [Sicherheit](/de/gateway/security) und [Remote-Zugriff](/de/gateway/remote).

## Wann Sie diesen Endpunkt verwenden sollten

Verwenden Sie `/v1/chat/completions`, wenn Sie Tooling oder ein vertrauenswürdiges App-seitiges Backend in einen vorhandenen Gateway integrieren und Gateway-Operator-Zugangsdaten sicher vorhalten können.

- Bevorzugen Sie dies gegenüber dem Hinzufügen eines neuen eingebauten Channels, wenn Ihre Integration nur eine weitere Operator-/Client-Oberfläche für denselben Gateway ist.
- Für native mobile Clients, die sich direkt mit einem entfernten Gateway verbinden, bevorzugen Sie [WebChat](/de/web/webchat) oder das [Gateway Protocol](/de/gateway/protocol) und implementieren Sie den Bootstrap-/Device-Token-Flow für gekoppelte Geräte, damit das Gerät kein gemeinsames HTTP-Token/Passwort benötigt.
- Erstellen Sie stattdessen ein Channel-Plugin, wenn Sie ein externes Messaging-Netzwerk mit eigenen Benutzern, Räumen, Webhook-Zustellung oder ausgehendem Transport integrieren. Siehe [Plugins erstellen](/de/plugins/building-plugins).

## Agent-first-Modellvertrag

OpenClaw behandelt das OpenAI-Feld `model` als **Agent-Ziel**, nicht als rohe Provider-Modell-ID.

- `model: "openclaw"` routet zum konfigurierten Standard-Agent.
- `model: "openclaw/default"` routet ebenfalls zum konfigurierten Standard-Agent.
- `model: "openclaw/<agentId>"` routet zu einem bestimmten Agent.

Optionale Anfrage-Header:

- `x-openclaw-model: <provider/model-or-bare-id>` überschreibt das Backend-Modell für den ausgewählten Agent. Aufrufer mit Shared-Secret-Bearer können diesen Header verwenden. Aufrufer mit Identität, etwa Trusted-Proxy- oder private No-Auth-Ingress-Anfragen mit `x-openclaw-scopes`, benötigen `operator.admin`; reine Schreibaufrufer erhalten `403 missing scope: operator.admin`.
- `x-openclaw-agent-id: <agentId>` bleibt als Kompatibilitäts-Override unterstützt.
- `x-openclaw-session-key: <sessionKey>` steuert das Session-Routing explizit. Der Wert darf keine reservierten internen Session-Namespaces wie `subagent:`, `cron:` oder `acp:` verwenden; solche Anfragen werden mit `400 invalid_request_error` abgelehnt.
- `x-openclaw-message-channel: <channel>` legt den synthetischen Ingress-Channel-Kontext für channelbewusste Prompts und Richtlinien fest.

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

Standardmäßig ist der Endpunkt **pro Anfrage zustandslos** (bei jedem Aufruf wird ein neuer Session-Schlüssel erzeugt).

Wenn die Anfrage einen OpenAI-`user`-String enthält, leitet der Gateway daraus einen stabilen Session-Schlüssel ab, sodass wiederholte Aufrufe eine Agent-Session teilen können.

Für eigene Apps ist die sicherste Standardeinstellung, denselben `user`-Wert pro Unterhaltungsthread wiederzuverwenden. Vermeiden Sie Kennungen auf Kontoebene, sofern Sie nicht ausdrücklich möchten, dass mehrere Unterhaltungen oder Geräte eine OpenClaw-Session teilen. Verwenden Sie `x-openclaw-session-key` nur, wenn Sie explizite Routing-Steuerung über mehrere Clients oder Threads hinweg benötigen, und wählen Sie anwendungseigene Schlüssel, die nicht mit reservierten internen Namespaces wie `subagent:`, `cron:` oder `acp:` beginnen.

## Warum diese Oberfläche wichtig ist

Dies ist die wirkungsvollste Kompatibilitätsmenge für selbst gehostete Frontends und Tooling:

- Die meisten Open WebUI-, LobeChat- und LibreChat-Setups erwarten `/v1/models`.
- Viele RAG-Systeme erwarten `/v1/embeddings`.
- Vorhandene OpenAI-Chat-Clients können normalerweise mit `/v1/chat/completions` beginnen.
- Agent-nativere Clients bevorzugen zunehmend `/v1/responses`.

## Modellliste und Agent-Routing

<AccordionGroup>
  <Accordion title="What does `/v1/models` return?">
    Eine OpenClaw-Agent-Zielliste.

    Die zurückgegebenen IDs sind `openclaw`, `openclaw/default` und `openclaw/<agentId>`-Einträge.
    Verwenden Sie sie direkt als OpenAI-`model`-Werte.

  </Accordion>
  <Accordion title="Does `/v1/models` list agents or sub-agents?">
    Es listet Top-Level-Agent-Ziele auf, keine Backend-Provider-Modelle und keine Sub-Agents.

    Sub-Agents bleiben interne Ausführungstopologie. Sie erscheinen nicht als Pseudo-Modelle.

  </Accordion>
  <Accordion title="Why is `openclaw/default` included?">
    `openclaw/default` ist der stabile Alias für den konfigurierten Standard-Agent.

    Das bedeutet, dass Clients weiterhin eine vorhersagbare ID verwenden können, selbst wenn sich die echte Standard-Agent-ID zwischen Umgebungen ändert.

  </Accordion>
  <Accordion title="How do I override the backend model?">
    Verwenden Sie `x-openclaw-model`. Dies ist ein Override auf Owner-Ebene: Er funktioniert mit dem Shared-Secret-Bearer-Token-/Passwortpfad des Gateways und erfordert `operator.admin` auf HTTP-Pfaden mit Identität wie Trusted-Proxy-Authentifizierung.

    Beispiele:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Wenn Sie ihn weglassen, läuft der ausgewählte Agent mit seiner normal konfigurierten Modellauswahl.

  </Accordion>
  <Accordion title="How do embeddings fit this contract?">
    `/v1/embeddings` verwendet dieselben Agent-Ziel-`model`-IDs.

    Verwenden Sie `model: "openclaw/default"` oder `model: "openclaw/<agentId>"`.
    Wenn Sie ein bestimmtes Embedding-Modell benötigen, senden Sie es in `x-openclaw-model` von einem Shared-Secret-Aufrufer oder einem Aufrufer mit Identität und `operator.admin`.
    Ohne diesen Header wird die Anfrage an die normale Embedding-Einrichtung des ausgewählten Agent weitergegeben.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Setzen Sie `stream: true`, um Server-Sent Events (SSE) zu empfangen:

- `Content-Type: text/event-stream`
- Jede Ereigniszeile ist `data: <json>`
- Der Stream endet mit `data: [DONE]`

## Chat-Tool-Vertrag

`/v1/chat/completions` unterstützt eine Teilmenge von Function-Tools, die mit gängigen OpenAI-Chat-Clients kompatibel ist.

### Unterstützte Anfragefelder

- `tools`: Array von `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`, `"required"` oder `{ "type": "function", "function": { "name": "..." } }`
- `messages[*].role: "tool"`-Folge-Turns
- `messages[*].tool_call_id` zum Binden von Tool-Ergebnissen an einen vorherigen Tool-Aufruf
- `max_completion_tokens`: Zahl; Limit pro Aufruf für die gesamten Completion-Tokens (Reasoning-Tokens eingeschlossen). Aktueller OpenAI-Chat-Completions-Feldname; bevorzugt, wenn sowohl `max_completion_tokens` als auch `max_tokens` gesendet werden.
- `max_tokens`: Zahl; Legacy-Alias, der aus Gründen der Abwärtskompatibilität akzeptiert wird. Wird ignoriert, wenn auch `max_completion_tokens` vorhanden ist.
- `temperature`: Zahl; Best-Effort-Sampling-Temperatur, die über den Agent-Stream-Param-Channel an den Upstream-Provider weitergeleitet wird.
- `top_p`: Zahl; Best-Effort-Nucleus-Sampling, das über den Agent-Stream-Param-Channel an den Upstream-Provider weitergeleitet wird.
- `frequency_penalty`: Zahl; Best-Effort-Frequenzstrafe, die über den Agent-Stream-Param-Channel an den Upstream-Provider weitergeleitet wird. Validierter Bereich: -2.0 bis 2.0. Gibt `400 invalid_request_error` für Werte außerhalb des Bereichs zurück.
- `presence_penalty`: Zahl; Best-Effort-Präsenzstrafe, die über den Agent-Stream-Param-Channel an den Upstream-Provider weitergeleitet wird. Validierter Bereich: -2.0 bis 2.0. Gibt `400 invalid_request_error` für Werte außerhalb des Bereichs zurück.
- `seed`: Zahl (Ganzzahl); Best-Effort-Seed, der über den Agent-Stream-Param-Channel an den Upstream-Provider weitergeleitet wird. Gibt `400 invalid_request_error` für Nicht-Ganzzahlwerte zurück.
- `stop`: String oder Array mit bis zu 4 Strings; Best-Effort-Stoppsequenzen, die über den Agent-Stream-Param-Channel an den Upstream-Provider weitergeleitet werden. Gibt `400 invalid_request_error` für mehr als 4 Sequenzen oder Nicht-String-/leere Einträge zurück.

Wenn eines der Token-Cap-Felder gesetzt ist, wird der Wert über den stream-param-Kanal des Agenten an den Upstream-Provider weitergeleitet. Der tatsächliche Wire-Feldname, der an den Upstream-Provider gesendet wird, wird vom Provider-Transport gewählt: `max_completion_tokens` für OpenAI-Familien-Endpunkte und `max_tokens` für Provider, die nur den Legacy-Namen akzeptieren (wie Mistral und Chutes). Sampling-Felder (`temperature`, `top_p`, `frequency_penalty`, `presence_penalty`, `seed`) verwenden denselben stream-param-Kanal; das ChatGPT-basierte Codex-Responses-Backend entfernt sie serverseitig, da es festes Sampling verwendet. `stop` läuft ebenfalls über den stream-param-Kanal und wird dem Stop-Feld des Transports zugeordnet (`stop` für Chat-Completions-Backends, `stop_sequences` für Anthropic); die OpenAI Responses API hat keinen Stop-Parameter, daher wird `stop` bei Responses-gestützten Modellen nicht angewendet.

### Nicht unterstützte Varianten

Der Endpunkt gibt `400 invalid_request_error` für nicht unterstützte Tool-Varianten zurück, darunter:

- Nicht-Array-`tools`
- Nicht-Funktions-Tool-Einträge
- fehlendes `tool.function.name`
- `tool_choice`-Varianten wie `allowed_tools` und `custom`
- `tool_choice.function.name`-Werte, die nicht zu den bereitgestellten `tools` passen

Für `tool_choice: "required"` und funktionsgebundenes `tool_choice` grenzt der Endpunkt die offengelegte Client-Function-Tool-Menge ein, weist die Runtime an, vor der Antwort ein Client-Tool aufzurufen, und gibt einen Fehler zurück, wenn die Agentenantwort keinen passenden strukturierten Client-Tool-Aufruf enthält. Dieser Vertrag gilt für die vom Aufrufer bereitgestellte HTTP-`tools`-Liste, nicht für jedes interne OpenClaw-Agent-Tool.

### Tool-Antwortform ohne Streaming

Wenn der Agent entscheidet, Tools aufzurufen, verwendet die Antwort:

- `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]`-Einträge mit:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (JSON-Zeichenfolge)

Assistentenkommentar vor dem Tool-Aufruf wird in `choices[0].message.content` zurückgegeben (möglicherweise leer).

### Tool-Antwortform mit Streaming

Wenn `stream: true` gesetzt ist, werden Tool-Aufrufe als inkrementelle SSE-Chunks ausgegeben:

- anfängliches Delta für die Assistentenrolle
- optionale Deltas für Assistentenkommentare
- ein oder mehrere `delta.tool_calls`-Chunks mit Tool-Identität und Argumentfragmenten
- finaler Chunk mit `finish_reason: "tool_calls"`
- `data: [DONE]`

Wenn `stream_options.include_usage=true` gesetzt ist, wird vor `[DONE]` ein abschließender Nutzungs-Chunk ausgegeben.

### Tool-Follow-up-Schleife

Nach Empfang von `tool_calls` sollte der Client die angeforderte(n) Funktion(en) ausführen und eine Follow-up-Anfrage senden, die Folgendes enthält:

- vorherige Assistenten-Tool-Aufruf-Nachricht
- eine oder mehrere `role: "tool"`-Nachrichten mit passender `tool_call_id`

Dadurch kann der Gateway-Agentenlauf dieselbe Reasoning-Schleife fortsetzen und die endgültige Assistentenantwort erzeugen.

## Schnelleinrichtung für Open WebUI

Für eine einfache Open WebUI-Verbindung:

- Basis-URL: `http://127.0.0.1:18789/v1`
- Docker-auf-macOS-Basis-URL: `http://host.docker.internal:18789/v1`
- API-Schlüssel: Ihr Gateway-Bearer-Token
- Modell: `openclaw/default`

Erwartetes Verhalten:

- `GET /v1/models` sollte `openclaw/default` auflisten
- Open WebUI sollte `openclaw/default` als Chat-Modell-ID verwenden
- Wenn Sie einen bestimmten Backend-Provider bzw. ein bestimmtes Backend-Modell für diesen Agenten wünschen, setzen Sie das normale Standardmodell des Agenten oder senden Sie `x-openclaw-model` von einem Aufrufer mit gemeinsamem Geheimnis oder einem identitätsführenden Aufrufer mit `operator.admin`

Schneller Smoke-Test:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Wenn dies `openclaw/default` zurückgibt, können die meisten Open WebUI-Setups mit derselben Basis-URL und demselben Token eine Verbindung herstellen.

## Beispiele

Stabile Sitzung für eine App-Unterhaltung:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"Summarize my tasks for today"}]
  }'
```

Verwenden Sie denselben `user`-Wert bei späteren Aufrufen für diese Unterhaltung erneut, um dieselbe Agentensitzung fortzusetzen.

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

Mit Streaming:

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

- `/v1/models` gibt OpenClaw-Agentenziele zurück, keine rohen Provider-Kataloge.
- `openclaw/default` ist immer vorhanden, sodass eine stabile ID über Umgebungen hinweg funktioniert.
- Backend-Provider-/Modell-Überschreibungen gehören in `x-openclaw-model`, nicht in das OpenAI-`model`-Feld. Auf identitätsführenden HTTP-Auth-Pfaden erfordert dieser Header `operator.admin`.
- `/v1/embeddings` unterstützt `input` als Zeichenfolge oder als Array von Zeichenfolgen.

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [OpenAI](/de/providers/openai)
