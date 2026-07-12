---
read_when:
    - Integration von Tools, die OpenAI Chat Completions erwarten
summary: Einen OpenAI-kompatiblen HTTP-Endpunkt `/v1/chat/completions` über das Gateway bereitstellen
title: OpenAI-Chatvervollständigungen
x-i18n:
    generated_at: "2026-07-12T15:20:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9b1fffd2ce3da881ecd91adbb7c5d10b1d7adbd99af9b2ea4544b62ecbaf1f32
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Der Gateway kann eine kleine, OpenAI-kompatible Chat-Completions-Schnittstelle bereitstellen. Sie ist **standardmäßig deaktiviert**.

Nach der Aktivierung stellt sie alle folgenden Endpunkte auf demselben Port wie der Gateway bereit (WS- und HTTP-Multiplexing):

| Methode | Pfad                   |
| ------- | ---------------------- |
| POST    | `/v1/chat/completions` |
| GET     | `/v1/models`           |
| GET     | `/v1/models/{id}`      |
| POST    | `/v1/embeddings`       |
| POST    | `/v1/responses`        |

Anfragen werden als normaler Gateway-Agentenlauf ausgeführt (derselbe Codepfad wie bei `openclaw agent`), sodass Routing, Berechtigungen und Konfiguration Ihrem Gateway entsprechen.

## Endpunkt aktivieren

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

Legen Sie `enabled: false` fest (oder lassen Sie die Option weg), um den Endpunkt zu deaktivieren.

## Sicherheitsgrenze (wichtig)

Behandeln Sie diesen Endpunkt als **vollständigen Operatorzugriff** auf die Gateway-Instanz:

- Ein gültiges Gateway-Token/-Passwort für diesen Endpunkt entspricht einer Zugangsinformation für Eigentümer/Operatoren und nicht einem eingeschränkten benutzerspezifischen Geltungsbereich.
- Anfragen durchlaufen denselben Agentenpfad der Steuerungsebene wie vertrauenswürdige Operatoraktionen. Wenn die Richtlinie des Zielagenten sensible Tools zulässt, kann dieser Endpunkt sie daher verwenden.
- Beschränken Sie ihn auf Loopback, Tailnet oder privaten Ingress. Machen Sie ihn nicht über das öffentliche Internet zugänglich.

Authentifizierungsmatrix:

| Authentifizierungspfad                                                                               | Verhalten                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"` oder `"password"` + `Authorization: Bearer ...`                          | Weist den Besitz des gemeinsamen Gateway-Geheimnisses nach. Ignoriert jeden `x-openclaw-scopes`-Header und stellt den vollständigen standardmäßigen Operator-Geltungsbereich wieder her: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Behandelt Chat-Interaktionen als Interaktionen eines Eigentümers. |
| Vertrauenswürdiges identitätstragendes HTTP (Trusted-Proxy-Authentifizierung oder `gateway.auth.mode="none"` bei privatem Ingress) | Berücksichtigt `x-openclaw-scopes`, sofern vorhanden; verwendet andernfalls den standardmäßigen Operator-Geltungsbereich. Verliert die Eigentümersemantik nur, wenn der Aufrufer die Geltungsbereiche ausdrücklich einschränkt und `operator.admin` auslässt. Erfordert `operator.admin` für Steuerungsfunktionen auf Eigentümerebene wie `x-openclaw-model`.                    |

Siehe [Operator-Geltungsbereiche](/de/gateway/operator-scopes), [Sicherheit](/de/gateway/security) und [Remotezugriff](/de/gateway/remote).

## Authentifizierung

Verwendet die Gateway-Authentifizierungskonfiguration (Details zu diesem Modus finden Sie unter [Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth)):

| Modus                               | Authentifizierung                                                                                                                                                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"`         | `Authorization: Bearer <token>`. Festgelegt über `gateway.auth.token` oder `OPENCLAW_GATEWAY_TOKEN`.                                                                                                               |
| `gateway.auth.mode="password"`      | `Authorization: Bearer <password>`. Festgelegt über `gateway.auth.password` oder `OPENCLAW_GATEWAY_PASSWORD`.                                                                                                      |
| `gateway.auth.mode="trusted-proxy"` | Leiten Sie die Anfrage über den konfigurierten identitätsbewussten Proxy weiter; dieser fügt die erforderlichen Identitätsheader ein. Loopback-Proxys auf demselben Host benötigen ausdrücklich `gateway.auth.trustedProxy.allowLoopback = true`. |
| `gateway.auth.mode="none"`          | Kein Authentifizierungsheader erforderlich (nur privater Ingress).                                                                                                                                                 |

Hinweise:

- Aufrufer auf demselben Host, die den Proxy eines `trusted-proxy`-Gateways umgehen, können direkt auf `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` zurückgreifen. Jegliche Hinweise durch Header vom Typ `Forwarded`, `X-Forwarded-*` oder `X-Real-IP` sorgen stattdessen dafür, dass die Anfrage auf dem Trusted-Proxy-Pfad bleibt.
- Wenn `gateway.auth.rateLimit` konfiguriert ist und zu viele Authentifizierungsversuche fehlschlagen, gibt der Endpunkt `429` mit einem `Retry-After`-Header zurück.

## Wann Sie diesen Endpunkt verwenden sollten

- Bevorzugen Sie diesen Ansatz gegenüber dem Hinzufügen eines neuen integrierten Kanals, wenn Ihre Integration lediglich eine weitere Operator-/Client-Schnittstelle für denselben Gateway ist.
- Für native mobile Clients, die sich direkt mit einem entfernten Gateway verbinden, sollten Sie [WebChat](/de/web/webchat) oder das [Gateway-Protokoll](/de/gateway/protocol) mit dem Bootstrap-/Gerätetoken-Ablauf für gekoppelte Geräte bevorzugen, damit das Gerät kein gemeinsames HTTP-Token/-Passwort benötigt.
- Erstellen Sie stattdessen ein Kanal-Plugin, wenn Sie ein externes Nachrichtennetzwerk mit eigenen Benutzern, Räumen, Webhook-Zustellung oder ausgehendem Transport integrieren. Siehe [Plugins erstellen](/de/plugins/building-plugins).

## Agentenorientierter Modellvertrag

OpenClaw behandelt das OpenAI-Feld `model` als **Agentenziel** und nicht als unverarbeitete Modell-ID des Providers.

| `model`-Wert                                  | Weiterleitung an                                                                                                                         |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw`                                    | Konfigurierter Standardagent                                                                                                              |
| `openclaw/default`                            | Konfigurierter Standardagent (stabiler Alias; kann auch dann sicher fest codiert werden, wenn sich die tatsächliche ID des Standardagenten zwischen Umgebungen ändert) |
| `openclaw/<agentId>` oder `openclaw:<agentId>` | Bestimmter Agent                                                                                                                         |
| `agent:<agentId>`                             | Bestimmter Agent (Kompatibilitätsalias)                                                                                                   |

Optionale Anfrageheader:

| Header                                          | Wirkung                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-openclaw-model: <provider/model-or-bare-id>` | Überschreibt das Backend-Modell für den ausgewählten Agenten. Aufrufer mit gemeinsamem Bearer-Geheimnis können dies direkt verwenden; identitätstragende Aufrufer (Trusted Proxy oder privater Ingress ohne Authentifizierung mit `x-openclaw-scopes`) benötigen `operator.admin`, andernfalls `403 missing scope: operator.admin`. |
| `x-openclaw-agent-id: <agentId>`                | Kompatibilitätsüberschreibung für die Agentenauswahl.                                                                                                                                                                                                                                                            |
| `x-openclaw-session-key: <sessionKey>`          | Explizites Sitzungsrouting. Wird mit `400 invalid_request_error` abgelehnt, wenn ein reservierter interner Namensraum (`subagent:`, `cron:`, `acp:`) verwendet wird.                                                                                                                                                 |
| `x-openclaw-message-channel: <channel>`         | Legt den synthetischen Ingress-Kanalkontext für kanalabhängige Prompts/Richtlinien fest.                                                                                                                                                                                                                          |

`/v1/models` listet Agentenziele der obersten Ebene (`openclaw`, `openclaw/default`, `openclaw/<agentId>`) auf, keine Backend-Provider-Modelle und keine Unteragenten; Unteragenten bleiben Teil der internen Ausführungstopologie. Wenn Sie `x-openclaw-model` weglassen, wird der ausgewählte Agent mit seinem normal konfigurierten Modell ausgeführt.

`/v1/embeddings` verwendet dieselben Agentenziel-IDs für `model`. Senden Sie `x-openclaw-model` (von einem Aufrufer mit gemeinsamem Geheimnis oder einem identitätstragenden Aufrufer mit `operator.admin`), um ein bestimmtes Einbettungsmodell auszuwählen; andernfalls verwendet die Anfrage die normale Einbettungskonfiguration des ausgewählten Agenten.

## Sitzungsverhalten

Standardmäßig ist der Endpunkt **für jede Anfrage zustandslos** (bei jedem Aufruf wird ein neuer Sitzungsschlüssel erzeugt).

Wenn die Anfrage eine OpenAI-Zeichenfolge `user` enthält, leitet der Gateway daraus einen stabilen Sitzungsschlüssel ab, sodass wiederholte Aufrufe dieselbe Agentensitzung verwenden können. Verwenden Sie bei benutzerdefinierten Anwendungen für jeden Konversationsthread denselben `user`-Wert; vermeiden Sie Kennungen auf Kontoebene, sofern nicht mehrere Konversationen/Geräte dieselbe OpenClaw-Sitzung gemeinsam verwenden sollen. Verwenden Sie `x-openclaw-session-key` nur, wenn Sie eine explizite Routingsteuerung über mehrere Clients/Threads hinweg benötigen, und nutzen Sie dabei anwendungseigene Schlüssel, welche die oben genannten reservierten Namensräume vermeiden.

## Anfragelimits (Konfiguration)

Standardwerte können unter `gateway.http.endpoints.chatCompletions` angepasst werden:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxImageParts: 8,
          maxTotalImageBytes: 20000000,
          images: {
            allowUrl: false,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

Standardwerte bei Auslassung:

| Schlüssel              | Standardwert                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `maxBodyBytes`         | 20MB                                                                                          |
| `maxImageParts`        | 8 (maximal aus der neuesten Benutzernachricht gelesene `image_url`-Teile)                     |
| `maxTotalImageBytes`   | 20MB (kumulierte decodierte Bytes aller `image_url`-Teile in einer Anfrage)                   |
| `images.allowUrl`      | `false` (aus URLs stammende `image_url`-Teile werden abgelehnt, sofern nicht aktiviert)       |
| `images.maxBytes`      | 10MB pro Bild                                                                                 |
| `images.maxRedirects`  | 3                                                                                             |
| `images.timeoutMs`     | 10s                                                                                           |

HEIC-/HEIF-Quellen für `image_url` werden akzeptiert und vor der Übermittlung an den Provider über den gemeinsamen OpenClaw-Bildprozessor (Rastermill) in JPEG normalisiert. Dieser greift bei Formaten, die externe Codec-Unterstützung benötigen, auf einen Systemkonverter (`sips`, ImageMagick, GraphicsMagick oder ffmpeg) zurück.

Sicherheitshinweis: Das Zulassen eines Hostnamens umgeht nicht die Blockierung privater/interner IP-Adressen. Wenden Sie bei über das Internet erreichbaren Gateways zusätzlich zu Schutzmaßnahmen auf Anwendungsebene auch Kontrollen für ausgehenden Netzwerkverkehr an. Siehe [Sicherheit](/de/gateway/security).

## Vertrag des Chat-Tools

`/v1/chat/completions` unterstützt eine Teilmenge von Funktions-Tools, die mit gängigen OpenAI-Chat-Clients kompatibel ist.

### Unterstützte Anfragefelder

| Feld                       | Hinweise                                                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tools`                    | Array aus `{ "type": "function", "function": { ... } }`                                                                                                      |
| `tool_choice`              | `"auto"`, `"none"`, `"required"` oder `{ "type": "function", "function": { "name": "..." } }`                                                                |
| `messages[*].role: "tool"` | Nachfolgende Aufrufe                                                                                                                                          |
| `messages[*].tool_call_id` | Ordnet ein Tool-Ergebnis einem vorherigen Tool-Aufruf zu                                                                                                      |
| `max_completion_tokens`    | Zahl; Begrenzung der gesamten Completion-Tokens pro Aufruf (einschließlich Reasoning-Tokens). Aktueller Feldname; wird verwendet, wenn dieses Feld und `max_tokens` gesendet werden. |
| `max_tokens`               | Zahl; veralteter Alias, wird ignoriert, wenn zugleich `max_completion_tokens` vorhanden ist.                                                                 |
| `temperature`              | Zahl 0-2; nach bestem Bemühen an den vorgelagerten Provider weitergeleitet. `400 invalid_request_error`, wenn außerhalb des Bereichs.                         |
| `top_p`                    | Zahl 0-1; nach bestem Bemühen. `400 invalid_request_error`, wenn außerhalb des Bereichs.                                                                      |
| `frequency_penalty`        | Zahl -2.0 bis 2.0; nach bestem Bemühen. `400 invalid_request_error`, wenn außerhalb des Bereichs.                                                             |
| `presence_penalty`         | Zahl -2.0 bis 2.0; nach bestem Bemühen. `400 invalid_request_error`, wenn außerhalb des Bereichs.                                                             |
| `seed`                     | Ganzzahl; nach bestem Bemühen. `400 invalid_request_error` bei Werten, die keine Ganzzahlen sind.                                                             |
| `stop`                     | Zeichenfolge oder Array aus bis zu 4 Zeichenfolgen; nach bestem Bemühen. `400 invalid_request_error` bei mehr als 4 Sequenzen oder Einträgen, die keine Zeichenfolgen oder leer sind. |

Alle Felder für Sampling und Token-Begrenzungen verwenden denselben Stream-Parameterkanal des Agenten und werden nach bestem Bemühen weitergeleitet:

- Token-Begrenzung: Der Feldname im Übertragungsformat wird vom Provider-Transport bestimmt: `max_completion_tokens` für Endpunkte der OpenAI-Familie, `max_tokens` für Provider, die nur den veralteten Namen akzeptieren (Mistral, Chutes).
- `stop` wird dem Stop-Feld des Transports zugeordnet: `stop` für Chat-Completions-Backends, `stop_sequences` für Anthropic. Die OpenAI Responses API hat keinen Stop-Parameter, daher wird `stop` bei Modellen mit Responses-Backend nicht angewendet.
- Das ChatGPT-basierte Codex-Responses-Backend verwendet festes serverseitiges Sampling und entfernt `temperature`/`top_p` (zusammen mit `max_output_tokens`, `metadata`, `prompt_cache_retention`, `service_tier`), bevor die Anfrage dieses Backend erreicht.

### Nicht unterstützte Varianten

Gibt `400 invalid_request_error` zurück bei:

- `tools`, das kein Array ist, Einträgen, die keine Funktions-Tools sind, oder fehlendem `tool.function.name`
- Varianten von `tool_choice` wie `allowed_tools` und `custom`
- Werten von `tool_choice.function.name`, die keinem bereitgestellten Tool entsprechen

Bei `tool_choice: "required"` und einem auf eine Funktion festgelegten `tool_choice` schränkt der Endpunkt die verfügbaren Client-Funktions-Tools ein, weist die Runtime an, vor der Antwort ein Client-Tool aufzurufen, und gibt einen Fehler zurück, wenn die Agentenantwort keinen passenden strukturierten Client-Tool-Aufruf enthält. Dies gilt für die vom Aufrufer bereitgestellte HTTP-Liste `tools`, nicht für jedes interne Agenten-Tool von OpenClaw.

### Form einer nicht gestreamten Tool-Antwort

Wenn der Agent Tools aufruft, verwendet die Antwort:

- `choices[0].finish_reason = "tool_calls"`
- Einträge in `choices[0].message.tool_calls[]` mit `id`, `type: "function"`, `function.name`, `function.arguments` (JSON-Zeichenfolge)
- Kommentar des Assistenten vor dem Tool-Aufruf in `choices[0].message.content` (möglicherweise leer)

### Form einer gestreamten Tool-Antwort

Wenn `stream: true` gesetzt ist, treffen Tool-Aufrufe als inkrementelle SSE-Chunks ein: ein anfängliches Delta mit der Assistentenrolle, optionale Deltas mit Kommentaren des Assistenten, ein oder mehrere `delta.tool_calls`-Chunks mit Tool-Identität und Argumentfragmenten, dann ein abschließender Chunk mit `finish_reason: "tool_calls"` und `data: [DONE]`.

Wenn `stream_options.include_usage=true` gesetzt ist, wird vor `[DONE]` ein abschließender Nutzungs-Chunk ausgegeben.

### Schleife für Tool-Folgeaufrufe

Nachdem Sie `tool_calls` empfangen haben, führen Sie die angeforderte(n) Funktion(en) aus und senden Sie eine Folgeanfrage, die die vorherige Tool-Aufrufnachricht des Assistenten sowie eine oder mehrere Nachrichten mit `role: "tool"` und passender `tool_call_id` enthält. Dadurch wird dieselbe Reasoning-Schleife des Agenten fortgesetzt, um die endgültige Antwort zu erzeugen.

## Streaming (SSE)

Setzen Sie `stream: true`, um Server-Sent Events zu empfangen:

- `Content-Type: text/event-stream`
- Jede Ereigniszeile lautet `data: <json>`
- Der Stream endet mit `data: [DONE]`

## Open WebUI – Schnelleinrichtung

- Basis-URL: `http://127.0.0.1:18789/v1`
- Basis-URL für Docker unter macOS: `http://host.docker.internal:18789/v1`
- API-Schlüssel: Ihr Gateway-Bearer-Token
- Modell: `openclaw/default`

Erwartetes Verhalten: `GET /v1/models` führt `openclaw/default` auf, und Open WebUI verwendet es als ID des Chat-Modells. Legen Sie für einen bestimmten Backend-Provider bzw. ein bestimmtes Backend-Modell das normale Standardmodell des Agenten fest oder senden Sie `x-openclaw-model` (Aufrufer mit gemeinsamem Geheimnis oder identitätstragender Aufrufer mit `operator.admin`).

Kurzer Funktionstest:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Wenn dies `openclaw/default` zurückgibt, können die meisten Open-WebUI-Konfigurationen mit derselben Basis-URL und demselben Token eine Verbindung herstellen.

## Beispiele

Stabile Sitzung für eine App-Unterhaltung:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"Fasse meine Aufgaben für heute zusammen"}]
  }'
```

Verwenden Sie bei späteren Aufrufen für diese Unterhaltung denselben `user`-Wert, um dieselbe Agentensitzung fortzusetzen.

Nicht gestreamt:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"Hallo"}]
  }'
```

Gestreamt:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"Hallo"}]
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

`/v1/embeddings` unterstützt `input` als Zeichenfolge oder als Array von Zeichenfolgen.

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Operator-Berechtigungsbereiche](/de/gateway/operator-scopes)
- [OpenAI](/de/providers/openai)
