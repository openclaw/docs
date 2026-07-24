---
read_when:
    - Integration von Tools, die OpenAI Chat Completions erwarten
summary: Einen OpenAI-kompatiblen HTTP-Endpunkt `/v1/chat/completions` über das Gateway bereitstellen
title: OpenAI-Chatvervollständigungen
x-i18n:
    generated_at: "2026-07-24T04:55:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cc5a1a56972bb9070da0f8f60d6efd673cc1d1d516b730c55bc9d171fc7a5b3
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Das Gateway kann eine kleine, mit OpenAI kompatible Chat-Completions-Schnittstelle bereitstellen. Sie ist **standardmäßig deaktiviert**.

Nach der Aktivierung stellt es all diese Endpunkte über denselben Port wie das Gateway bereit (WS- und HTTP-Multiplexing):

| Methode | Pfad                   |
| ------ | ---------------------- |
| POST   | `/v1/chat/completions` |
| GET    | `/v1/models`           |
| GET    | `/v1/models/{id}`      |
| POST   | `/v1/embeddings`       |
| POST   | `/v1/responses`        |

Anfragen werden wie ein normaler Gateway-Agentenlauf ausgeführt (derselbe Codepfad wie `openclaw agent`), sodass Routing, Berechtigungen und Konfiguration Ihrem Gateway entsprechen.

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

Legen Sie zum Deaktivieren `enabled: false` fest (oder lassen Sie die Option weg).

## Sicherheitsgrenze (wichtig)

Behandeln Sie diesen Endpunkt als **vollständigen Operatorzugriff** auf die Gateway-Instanz:

- Ein gültiges Gateway-Token bzw. -Passwort für diesen Endpunkt entspricht einer Zugangsberechtigung für Eigentümer oder Operatoren und nicht einem eingeschränkten benutzerspezifischen Geltungsbereich.
- Anfragen durchlaufen denselben Agentenpfad der Steuerungsebene wie vertrauenswürdige Operatoraktionen. Wenn die Richtlinie des Zielagenten sensible Tools zulässt, kann dieser Endpunkt sie daher verwenden.
- Beschränken Sie ihn auf Loopback, Tailnet oder privaten Eingang. Stellen Sie ihn nicht im öffentlichen Internet bereit.

Authentifizierungsmatrix:

| Authentifizierungspfad                                                                                            | Verhalten                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"` oder `"password"` + `Authorization: Bearer ...`                            | Weist den Besitz des gemeinsamen Gateway-Geheimnisses nach. Ignoriert jeden `x-openclaw-scopes`-Header und stellt den vollständigen standardmäßigen Operator-Geltungsbereich wieder her: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Behandelt Chat-Beiträge als Beiträge des Eigentümers. |
| Vertrauenswürdiges identitätstragendes HTTP (Trusted-Proxy-Authentifizierung oder `gateway.auth.mode="none"` bei privatem Eingang) | Berücksichtigt `x-openclaw-scopes`, sofern vorhanden; andernfalls wird auf den standardmäßigen Operator-Geltungsbereich zurückgegriffen. Die Eigentümersemantik geht nur verloren, wenn der Aufrufer die Geltungsbereiche ausdrücklich einschränkt und `operator.admin` auslässt. Erfordert `operator.admin` für Steuerungsmöglichkeiten auf Eigentümerebene wie `x-openclaw-model`.                        |

Siehe [Operator-Geltungsbereiche](/de/gateway/operator-scopes), [Sicherheit](/de/gateway/security) und [Remotezugriff](/de/gateway/remote).

## Authentifizierung

Verwendet die Gateway-Authentifizierungskonfiguration (Einzelheiten zu diesem Modus finden Sie unter [Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth)):

| Modus                                | Authentifizierung                                                                                                                                                                     |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"`         | `Authorization: Bearer <token>`. Wird über `gateway.auth.token` oder `OPENCLAW_GATEWAY_TOKEN` festgelegt.                                                                                              |
| `gateway.auth.mode="password"`      | `Authorization: Bearer <password>`. Wird über `gateway.auth.password` oder `OPENCLAW_GATEWAY_PASSWORD` festgelegt.                                                                                     |
| `gateway.auth.mode="trusted-proxy"` | Leiten Sie die Anfrage durch den konfigurierten identitätsbewussten Proxy; dieser fügt die erforderlichen Identitäts-Header ein. Loopback-Proxys auf demselben Host benötigen ausdrücklich `gateway.auth.trustedProxy.allowLoopback = true`. |
| `gateway.auth.mode="none"`          | Kein Authentifizierungs-Header erforderlich (nur privater Eingang).                                                                                                                                         |

Hinweise:

- Aufrufer auf demselben Host, die den Proxy bei einem `trusted-proxy`-Gateway umgehen, können direkt auf `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` zurückgreifen. Jeglicher Nachweis durch die Header `Forwarded`, `X-Forwarded-*` oder `X-Real-IP` sorgt stattdessen dafür, dass die Anfrage auf dem Trusted-Proxy-Pfad bleibt.
- Wenn `gateway.auth.rateLimit` konfiguriert ist und zu viele Authentifizierungsversuche fehlschlagen, gibt der Endpunkt `429` mit einem `Retry-After`-Header zurück.

## Wann dieser Endpunkt verwendet werden sollte

- Bevorzugen Sie diesen Endpunkt gegenüber dem Hinzufügen eines neuen integrierten Kanals, wenn Ihre Integration lediglich eine weitere Operator- oder Clientoberfläche für dasselbe Gateway ist.
- Für native mobile Clients, die sich direkt mit einem entfernten Gateway verbinden, sollten Sie [WebChat](/de/web/webchat) oder das [Gateway-Protokoll](/de/gateway/protocol) mit dem Bootstrap- und Geräte-Token-Ablauf für gekoppelte Geräte bevorzugen, damit das Gerät kein gemeinsames HTTP-Token bzw. -Passwort benötigt.
- Erstellen Sie stattdessen ein Kanal-Plugin, wenn Sie ein externes Nachrichtennetzwerk mit eigenen Benutzern, Räumen, Webhook-Zustellung oder ausgehendem Transport integrieren. Siehe [Plugins erstellen](/de/plugins/building-plugins).

## Agentenorientierter Modellvertrag

OpenClaw behandelt das OpenAI-Feld `model` als **Agentenziel** und nicht als rohe Modell-ID eines Providers.

| Wert von `model`                                | Weiterleitung an                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `openclaw`                                   | Konfigurierter Standardagent                                                                                                 |
| `openclaw/default`                           | Konfigurierter Standardagent (stabiler Alias; kann sicher fest codiert werden, selbst wenn sich die tatsächliche ID des Standardagenten zwischen Umgebungen ändert) |
| `openclaw/<agentId>` oder `openclaw:<agentId>` | Bestimmter Agent                                                                                                           |
| `agent:<agentId>`                            | Bestimmter Agent (Kompatibilitätsalias)                                                                                     |

Optionale Anfrage-Header:

| Header                                          | Wirkung                                                                                                                                                                                                                                                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-openclaw-model: <provider/model-or-bare-id>` | Überschreibt das Backend-Modell für den ausgewählten Agenten. Bearer-Aufrufer mit gemeinsamem Geheimnis können dies direkt verwenden; identitätstragende Aufrufer (Trusted Proxy oder privater Eingang ohne Authentifizierung mit `x-openclaw-scopes`) benötigen `operator.admin`, andernfalls `403 missing scope: operator.admin`. |
| `x-openclaw-agent-id: <agentId>`                | Kompatibilitätsüberschreibung für die Agentenauswahl.                                                                                                                                                                                                                                 |
| `x-openclaw-session-key: <sessionKey>`          | Explizites Sitzungsrouting. Wird mit `400 invalid_request_error` abgelehnt, wenn ein reservierter interner Namensraum verwendet wird (`subagent:`, `cron:`, `acp:`).                                                                                                                                |
| `x-openclaw-message-channel: <channel>`         | Legt den synthetischen Eingangskanalkontext für kanalbezogene Prompts und Richtlinien fest.                                                                                                                                                                                              |

`/v1/models` listet Agentenziele der obersten Ebene (`openclaw`, `openclaw/default`, `openclaw/<agentId>`) auf, nicht Backend-Modelle von Providern und keine Unteragenten; Unteragenten bleiben Teil der internen Ausführungstopologie. Wenn Sie `x-openclaw-model` auslassen, wird der ausgewählte Agent mit seinem normal konfigurierten Modell ausgeführt.

`/v1/embeddings` verwendet dieselben `model`-IDs für Agentenziele. Senden Sie `x-openclaw-model` (von einem Aufrufer mit gemeinsamem Geheimnis oder einem identitätstragenden Aufrufer mit `operator.admin`), um ein bestimmtes Einbettungsmodell auszuwählen; andernfalls verwendet die Anfrage die normale Einbettungskonfiguration des ausgewählten Agenten.

## Sitzungsverhalten

Standardmäßig ist der Endpunkt **für jede Anfrage zustandslos** (bei jedem Aufruf wird ein neuer Sitzungsschlüssel erzeugt).

Wenn die Anfrage eine OpenAI-Zeichenfolge `user` enthält, leitet das Gateway daraus einen stabilen Sitzungsschlüssel ab, sodass wiederholte Aufrufe dieselbe Agentensitzung verwenden können. Verwenden Sie bei benutzerdefinierten Apps für jeden Konversationsthread denselben Wert für `user`; vermeiden Sie Kennungen auf Kontoebene, es sei denn, mehrere Konversationen oder Geräte sollen dieselbe OpenClaw-Sitzung verwenden. Verwenden Sie `x-openclaw-session-key` nur, wenn Sie eine explizite Routingsteuerung über mehrere Clients oder Threads hinweg benötigen, und nutzen Sie dabei anwendungseigene Schlüssel, die die oben genannten reservierten Namensräume vermeiden.

## Anfragelimits

Der Endpunkt verwendet integrierte Limits von 20 MB pro Anfrageinhalt, 8 `image_url`-
Teilen aus der neuesten Benutzernachricht und insgesamt 20 MB an decodierten Bilddaten.
Die Richtlinie für Bildquellen bleibt unter
`gateway.http.endpoints.chatCompletions.images` konfigurierbar:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: {
          enabled: true,
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

Standardeinstellungen für Bilder:

| Schlüssel                   | Standardwert                                                             |
| --------------------- | ------------------------------------------------------------------- |
| `images.allowUrl`     | `false` (aus URLs stammende `image_url`-Teile werden abgelehnt, sofern sie nicht aktiviert sind) |
| `images.maxBytes`     | 10MB pro Bild                                                      |
| `images.maxRedirects` | 3                                                                   |
| `images.timeoutMs`    | 10s                                                                 |

HEIC/HEIF-Quellen des Typs `image_url` werden akzeptiert und vor der Übermittlung an den Provider durch den gemeinsamen OpenClaw-Bildprozessor (Rastermill) in JPEG normalisiert. Dieser greift bei Formaten, die externe Codec-Unterstützung benötigen, auf einen Systemkonverter (`sips`, ImageMagick, GraphicsMagick oder ffmpeg) zurück.

Sicherheitshinweis: Das Setzen eines Hostnamens auf die Zulassungsliste umgeht nicht die Sperrung privater oder interner IP-Adressen. Wenden Sie bei Gateways, die über das Internet erreichbar sind, zusätzlich zu den Schutzmaßnahmen auf Anwendungsebene Kontrollen für ausgehenden Netzwerkverkehr an. Siehe [Sicherheit](/de/gateway/security).

## Vertrag für Chat-Tools

`/v1/chat/completions` unterstützt eine Teilmenge von Funktionstools, die mit gängigen OpenAI-Chat-Clients kompatibel ist.

### Unterstützte Anfragefelder

| Feld                       | Hinweise                                                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools`                    | Array von `{ "type": "function", "function": { ... } }`                                                                                     |
| `tool_choice`              | `"auto"`, `"none"`, `"required"` oder `{ "type": "function", "function": { "name": "..." } }`                                                |
| `messages[*].role: "tool"` | Nachfolgende Interaktionen                                                                                                                    |
| `messages[*].tool_call_id` | Verknüpft ein Werkzeugergebnis wieder mit einem vorherigen Werkzeugaufruf                                                                     |
| `max_completion_tokens`    | Zahl; Obergrenze pro Aufruf für die Gesamtzahl der Completion-Tokens (einschließlich Reasoning-Tokens). Aktueller Feldname; wird verwendet, wenn sowohl dieses Feld als auch `max_tokens` gesendet werden. |
| `max_tokens`               | Zahl; veralteter Alias, wird ignoriert, wenn auch `max_completion_tokens` vorhanden ist.                                                      |
| `temperature`              | Zahl 0-2; nach bestem Bemühen an den vorgelagerten Provider weitergeleitet. `400 invalid_request_error` bei Überschreitung des Bereichs.       |
| `top_p`                    | Zahl 0-1; nach bestem Bemühen. `400 invalid_request_error` bei Überschreitung des Bereichs.                                                   |
| `frequency_penalty`        | Zahl -2.0 bis 2.0; nach bestem Bemühen. `400 invalid_request_error` bei Überschreitung des Bereichs.                                          |
| `presence_penalty`         | Zahl -2.0 bis 2.0; nach bestem Bemühen. `400 invalid_request_error` bei Überschreitung des Bereichs.                                          |
| `seed`                     | Ganzzahl; nach bestem Bemühen. `400 invalid_request_error` bei Werten, die keine Ganzzahlen sind.                                             |
| `stop`                     | Zeichenfolge oder Array mit bis zu 4 Zeichenfolgen; nach bestem Bemühen. `400 invalid_request_error` bei mehr als 4 Sequenzen oder Einträgen, die keine Zeichenfolgen oder leer sind. |

Alle Sampling- und Token-Obergrenzenfelder verwenden denselben Kanal für Agent-Stream-Parameter und werden nach bestem Bemühen weitergeleitet:

- Token-Obergrenze: Der Feldname im Übertragungsformat wird vom Provider-Transport gewählt: `max_completion_tokens` für Endpunkte der OpenAI-Familie, `max_tokens` für Provider, die nur den veralteten Namen akzeptieren (Mistral, Chutes).
- `stop` wird dem Stop-Feld des Transports zugeordnet: `stop` für Chat-Completions-Backends, `stop_sequences` für Anthropic. Die OpenAI Responses API hat keinen Stop-Parameter, daher wird `stop` bei Responses-basierten Modellen nicht angewendet.
- Das ChatGPT-basierte Codex-Responses-Backend verwendet serverseitig festgelegtes Sampling und entfernt `temperature`/`top_p` (zusammen mit `max_output_tokens`, `metadata`, `prompt_cache_retention`, `service_tier`), bevor die Anfrage dieses Backend erreicht.

### Nicht unterstützte Varianten

Gibt `400 invalid_request_error` zurück für:

- `tools`, die keine Arrays sind, Werkzeug-Einträge, die keine Funktionen sind, oder fehlende `tool.function.name`
- `tool_choice`-Varianten wie `allowed_tools` und `custom`
- `tool_choice.function.name`-Werte, die keinem bereitgestellten Werkzeug entsprechen

Für `tool_choice: "required"` und funktionsgebundene `tool_choice` schränkt der Endpunkt die offengelegte Menge der Client-Funktionswerkzeuge ein, weist die Laufzeit an, vor der Antwort ein Client-Werkzeug aufzurufen, und gibt einen Fehler aus, wenn die Agent-Antwort keinen passenden strukturierten Client-Werkzeugaufruf enthält. Dies gilt für die vom Aufrufer bereitgestellte HTTP-Liste `tools`, nicht für jedes interne OpenClaw-Agent-Werkzeug.

### Form der nicht gestreamten Werkzeugantwort

Wenn der Agent Werkzeuge aufruft, verwendet die Antwort:

- `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]`-Einträge mit `id`, `type: "function"`, `function.name`, `function.arguments` (JSON-Zeichenfolge)
- Assistentenkommentar vor dem Werkzeugaufruf in `choices[0].message.content` (möglicherweise leer)

### Form der gestreamten Werkzeugantwort

Wenn `stream: true`, treffen Werkzeugaufrufe als inkrementelle SSE-Blöcke ein: ein anfängliches Assistentenrollen-Delta, optionale Deltas für Assistentenkommentare, ein oder mehrere `delta.tool_calls`-Blöcke mit Werkzeugidentität und Argumentfragmenten und anschließend ein letzter Block mit `finish_reason: "tool_calls"` und `data: [DONE]`.

Wenn `stream_options.include_usage=true`, wird vor `[DONE]` ein abschließender Nutzungsblock ausgegeben.

### Nachfolgeschleife für Werkzeuge

Führen Sie nach dem Empfang von `tool_calls` die angeforderte(n) Funktion(en) aus und senden Sie eine Folgeanfrage, die die vorherige Assistentennachricht zum Werkzeugaufruf sowie eine oder mehrere `role: "tool"`-Nachrichten mit übereinstimmenden `tool_call_id` enthält. Dadurch wird dieselbe Reasoning-Schleife des Agenten fortgesetzt, um die endgültige Antwort zu erzeugen.

## Streaming (SSE)

Setzen Sie `stream: true`, um Server-Sent Events zu empfangen:

- `Content-Type: text/event-stream`
- Jede Ereigniszeile ist `data: <json>`
- Der Stream endet mit `data: [DONE]`

## Open WebUI-Schnelleinrichtung

- Basis-URL: `http://127.0.0.1:18789/v1`
- Basis-URL für Docker unter macOS: `http://host.docker.internal:18789/v1`
- API-Schlüssel: Ihr Gateway-Bearer-Token
- Modell: `openclaw/default`

Erwartetes Verhalten: `GET /v1/models` listet `openclaw/default` auf, und Open WebUI verwendet diesen Wert als Chat-Modell-ID. Legen Sie für einen bestimmten Backend-Provider bzw. ein bestimmtes Backend-Modell das normale Standardmodell des Agenten fest oder senden Sie `x-openclaw-model` (Aufrufer mit gemeinsamem Geheimnis oder identitätstragender Aufrufer mit `operator.admin`).

Schneller Funktionstest:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Wenn dies `openclaw/default` zurückgibt, können die meisten Open-WebUI-Einrichtungen mit derselben Basis-URL und demselben Token eine Verbindung herstellen.

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

Verwenden Sie bei späteren Aufrufen für diese Unterhaltung denselben `user`-Wert erneut, um dieselbe Agent-Sitzung fortzusetzen.

Ohne Streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"Hallo"}]
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

Einbettungen erstellen:

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

`/v1/embeddings` unterstützt `input` als Zeichenfolge oder Array von Zeichenfolgen.

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Operator-Berechtigungsbereiche](/de/gateway/operator-scopes)
- [OpenAI](/de/providers/openai)
