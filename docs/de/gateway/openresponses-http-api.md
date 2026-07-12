---
read_when:
    - Clients integrieren, die die OpenResponses API verwenden
    - Sie möchten elementbasierte Eingaben, clientseitige Tool-Aufrufe oder SSE-Ereignisse
summary: Einen OpenResponses-kompatiblen HTTP-Endpunkt `/v1/responses` über das Gateway bereitstellen
title: OpenResponses-API
x-i18n:
    generated_at: "2026-07-12T15:26:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 37fcf5016d1455383181923ec31b26cf31533b990045df300f0356f135c95579
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Der Gateway kann einen mit OpenResponses kompatiblen Endpunkt `POST /v1/responses` bereitstellen. Er ist **standardmäßig deaktiviert** und verwendet denselben Port wie der Gateway (WS- und HTTP-Multiplexing): `http://<gateway-host>:<port>/v1/responses`.

Anfragen werden wie ein normaler Gateway-Agentenlauf ausgeführt (derselbe Codepfad wie bei `openclaw agent`), sodass Routing, Berechtigungen und Konfiguration Ihrem Gateway entsprechen.

Aktivieren oder deaktivieren Sie ihn mit `gateway.http.endpoints.responses.enabled`. Wenn er aktiviert ist, stellt dieselbe Kompatibilitätsschnittstelle auch `GET /v1/models`, `GET /v1/models/{id}`, `POST /v1/embeddings` und `POST /v1/chat/completions` bereit.

## Authentifizierung, Sicherheit und Routing

Das Betriebsverhalten entspricht [OpenAI Chat Completions](/de/gateway/openai-http-api):

- Der Authentifizierungspfad entspricht `gateway.auth.mode`: Ein gemeinsames Geheimnis (`token`/`password`) verwendet `Authorization: Bearer <token-or-password>`; ein vertrauenswürdiger Proxy verwendet identitätsbezogene Proxy-Header (Loopback-Proxys auf demselben Host benötigen `gateway.auth.trustedProxy.allowLoopback = true`, mit einem direkten Fallback auf demselben Host über `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, wenn kein Header `Forwarded`/`X-Forwarded-*`/`X-Real-IP` vorhanden ist); `none` benötigt bei privatem Ingress keinen Authentifizierungsheader. Siehe [Authentifizierung über vertrauenswürdige Proxys](/de/gateway/trusted-proxy-auth).
- Behandeln Sie den Endpunkt als vollständigen Operatorzugriff auf die Gateway-Instanz.
- Authentifizierungsmodi mit gemeinsamem Geheimnis ignorieren engere, vom Bearer deklarierte `x-openclaw-scopes` und stellen den vollständigen Standardsatz an Operator-Berechtigungsbereichen wieder her: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Chat-Dialogschritte an diesem Endpunkt werden als Dialogschritte eines Eigentümer-Absenders behandelt.
- Vertrauenswürdige identitätsbezogene HTTP-Modi (vertrauenswürdiger Proxy oder `gateway.auth.mode="none"`) berücksichtigen `x-openclaw-scopes`, sofern vorhanden, und greifen andernfalls auf den Standardsatz an Operator-Berechtigungsbereichen zurück. Die Eigentümersemantik geht nur verloren, wenn der Aufrufer die Berechtigungsbereiche ausdrücklich einschränkt und `operator.admin` auslässt.
- Wählen Sie Agenten mit `model: "openclaw"`, `"openclaw/default"`, `"openclaw/<agentId>"` oder dem Header `x-openclaw-agent-id` aus.
- Verwenden Sie `x-openclaw-model`, um das Backend-Modell des ausgewählten Agenten zu überschreiben (erfordert `operator.admin` bei identitätsbezogenen Authentifizierungspfaden).
- Verwenden Sie `x-openclaw-session-key` für explizites Sitzungsrouting (wird mit `400 invalid_request_error` abgelehnt, wenn ein reservierter Namensraum verwendet wird: `subagent:`, `cron:`, `acp:`).
- Verwenden Sie `x-openclaw-message-channel` für einen vom Standard abweichenden synthetischen Ingress-Kanalkontext.

Die maßgebliche Erläuterung zu Modellen für Agentenziele, `openclaw/default`, der Durchleitung von Embeddings und Überschreibungen von Backend-Modellen finden Sie unter [OpenAI Chat Completions](/de/gateway/openai-http-api#agent-first-model-contract).

Siehe [Operator-Berechtigungsbereiche](/de/gateway/operator-scopes) und [Sicherheit](/de/gateway/security).

## Sitzungsverhalten

Standardmäßig ist der Endpunkt **für jede Anfrage zustandslos** (bei jedem Aufruf wird ein neuer Sitzungsschlüssel erzeugt).

Wenn die Anfrage eine OpenResponses-Zeichenfolge `user` enthält, leitet der Gateway daraus einen stabilen Sitzungsschlüssel ab, sodass wiederholte Aufrufe dieselbe Agentensitzung verwenden können.

`previous_response_id` verwendet die Sitzung der früheren Antwort erneut, wenn die Anfrage innerhalb desselben Agenten-, Benutzer- und angeforderten Sitzungsbereichs bleibt (Abgleich anhand von Authentifizierungssubjekt, Agenten-ID und `x-openclaw-session-key`).

## Anfrageformat

| Feld                                                             | Unterstützung                                                                                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `input`                                                          | Zeichenfolge oder Array von Elementobjekten.                                                                                                              |
| `instructions`                                                   | Wird mit dem System-Prompt zusammengeführt.                                                                                                               |
| `tools`                                                          | Tooldefinitionen des Clients (Funktionstools).                                                                                                            |
| `tool_choice`                                                    | `"auto"`, `"none"`, `"required"` oder `{ "type": "function", "name": "..." }`, um Client-Tools zu filtern oder vorzuschreiben.                            |
| `stream`                                                         | Aktiviert SSE-Streaming.                                                                                                                                  |
| `max_output_tokens`                                              | Bestmögliche Begrenzung der Ausgabe (Provider-abhängig).                                                                                                  |
| `temperature`                                                    | Bestmögliche Sampling-Temperatur. Wird vom ChatGPT-basierten Codex-Responses-Backend ignoriert, das festes serverseitiges Sampling verwendet.              |
| `top_p`                                                          | Bestmögliches Nucleus-Sampling. Für Codex Responses gilt derselbe Hinweis wie bei `temperature`.                                                          |
| `user`                                                           | Stabiles Sitzungsrouting.                                                                                                                                 |
| `previous_response_id`                                           | Sitzungskontinuität (siehe oben).                                                                                                                         |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | Wird akzeptiert, derzeit jedoch ignoriert.                                                                                                                |

## Elemente (Eingabe)

### `message`

Rollen: `system`, `developer`, `user`, `assistant`.

- `system` und `developer` werden an den System-Prompt angehängt.
- Das neueste Element `user` oder `function_call_output` wird zur „aktuellen Nachricht“.
- Frühere Benutzer- und Assistentennachrichten werden als Verlauf für den Kontext einbezogen.

### `function_call_output` (dialogschrittbasierte Tools)

Senden Sie Toolergebnisse an das Modell zurück:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` und `item_reference`

Werden aus Gründen der Schemakompatibilität akzeptiert, beim Erstellen des Prompts jedoch ignoriert.

## Tools (clientseitige Funktionstools)

Stellen Sie Tools mit `tools: [{ type: "function", name, description?, parameters? }]` bereit.

Wenn der Agent ein Tool aufruft, enthält die Antwort ein Ausgabeelement `function_call`. Senden Sie eine Folgeanfrage mit `function_call_output`, um den Dialogschritt fortzusetzen.

Bei `tool_choice: "required"` und einem auf eine Funktion festgelegten `tool_choice` schränkt der Endpunkt die bereitgestellte Menge clientseitiger Funktionstools ein, weist die Laufzeit an, vor der Antwort ein Client-Tool aufzurufen, und lehnt den Dialogschritt ab, wenn er keinen passenden strukturierten Client-Tool-Aufruf enthält, entsprechend dem Vertrag von `/v1/chat/completions`. Nicht gestreamte Anfragen geben `502` mit einem `api_error` zurück; gestreamte Anfragen senden ein Ereignis `response.failed`.

## Bilder (`input_image`)

Unterstützt Base64- oder URL-Quellen:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Zulässige MIME-Typen (Standard): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`. Maximale Größe (Standard): 10MB.

## Dateien (`input_file`)

Unterstützt Base64- oder URL-Quellen:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

Zulässige MIME-Typen (Standard): `text/plain`, `text/markdown`, `text/html`, `text/csv`, `application/json`, `application/pdf`. Maximale Größe (Standard): 5MB.

Aktuelles Verhalten:

- Dateiinhalte werden dekodiert und dem **System-Prompt** hinzugefügt, nicht der Benutzernachricht, sodass sie flüchtig bleiben (sie werden nicht im Sitzungsverlauf gespeichert).
- Dekodierter Dateitext wird als **nicht vertrauenswürdiger externer Inhalt** umschlossen, bevor er hinzugefügt wird, sodass Dateibytes als Daten und nicht als vertrauenswürdige Anweisungen behandelt werden. Der eingefügte Block verwendet explizite Begrenzungsmarkierungen (`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`) und eine Metadatenzeile `Source: External`. Das lange Banner `SECURITY NOTICE:` wird absichtlich ausgelassen, um das Prompt-Budget zu schonen; die Begrenzungsmarkierungen und Metadaten gelten weiterhin.
- PDFs werden zunächst auf Text untersucht. Wenn nur wenig Text gefunden wird, werden die ersten Seiten in Rasterbilder umgewandelt und an das Modell übergeben; der eingefügte Dateiblock verwendet dann den Platzhalter `[PDF content rendered to images]`.

Die PDF-Verarbeitung wird vom gebündelten Plugin `document-extract` bereitgestellt, das `clawpdf` und dessen mitgelieferte PDFium-WebAssembly-Laufzeit für die Textextraktion und das Rendern von Seiten verwendet.

Standardeinstellungen für URL-Abrufe:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (Gesamtzahl URL-basierter `input_file`- und `input_image`-Teile pro Anfrage)
- Anfragen werden abgesichert (DNS-Auflösung, Blockierung privater IP-Adressen, Weiterleitungsbegrenzungen, Zeitüberschreitungen).
- Optionale Hostnamen-Zulassungslisten werden je Eingabetyp unterstützt (`files.urlAllowlist`, `images.urlAllowlist`): exakter Host (`"cdn.example.com"`) oder Platzhalter-Subdomains (`"*.assets.example.com"`, stimmt nicht mit der Stammdomain überein). Leere oder ausgelassene Zulassungslisten bedeuten, dass keine Einschränkung durch eine Hostnamen-Zulassungsliste besteht.
- Um URL-basierte Abrufe vollständig zu deaktivieren, setzen Sie `files.allowUrl: false` und/oder `images.allowUrl: false`.

## Datei- und Bildbegrenzungen (Konfiguration)

Die Standardwerte können unter `gateway.http.endpoints.responses` angepasst werden:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 60000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
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

| Schlüssel                 | Standardwert |
| ------------------------- | ------------ |
| `maxBodyBytes`            | 20MB         |
| `maxUrlParts`             | 8            |
| `files.maxBytes`          | 5MB          |
| `files.maxChars`          | 60k          |
| `files.maxRedirects`      | 3            |
| `files.timeoutMs`         | 10s          |
| `files.pdf.maxPages`      | 4            |
| `files.pdf.maxPixels`     | 4,000,000    |
| `files.pdf.minTextChars`  | 200          |
| `images.maxBytes`         | 10MB         |
| `images.maxRedirects`     | 3            |
| `images.timeoutMs`        | 10s          |

HEIC/HEIF-Quellen für `input_image` werden vor der Übergabe an den Provider durch den gemeinsamen OpenClaw-Bildprozessor (Rastermill) in JPEG normalisiert. Dieser greift für Formate, die externe Codec-Unterstützung benötigen, auf einen Systemkonverter (`sips`, ImageMagick, GraphicsMagick oder ffmpeg) zurück.

Sicherheitshinweis: URL-Zulassungslisten werden vor dem Abruf und bei Weiterleitungsschritten durchgesetzt. Die Aufnahme eines Hostnamens in die Zulassungsliste umgeht nicht die Blockierung privater/interner IP-Adressen. Wenden Sie bei Gateways, die über das Internet erreichbar sind, zusätzlich zu den Schutzmechanismen auf Anwendungsebene Kontrollen für ausgehenden Netzwerkverkehr an. Siehe [Sicherheit](/de/gateway/security).

## Streaming (SSE)

Setzen Sie `stream: true`, um Server-Sent Events zu empfangen:

- `Content-Type: text/event-stream`
- Jede Ereigniszeile besteht aus `event: <type>` und `data: <json>`
- Der Stream endet mit `data: [DONE]`

Derzeit ausgegebene Ereignistypen: `response.created`, `response.in_progress`, `response.output_item.added`, `response.content_part.added`, `response.output_text.delta`, `response.output_text.done`, `response.content_part.done`, `response.output_item.done`, `response.completed`, `response.failed` (bei einem Fehler).

## Verwendung

`usage` wird ausgefüllt, wenn der zugrunde liegende Provider Token-Anzahlen meldet. OpenClaw normalisiert gängige Aliasse im OpenAI-Stil, bevor diese Zähler nachgelagerte Status-/Sitzungsoberflächen erreichen, darunter `input_tokens` / `output_tokens` und `prompt_tokens` / `completion_tokens`.

## Fehler

Fehler verwenden ein JSON-Objekt wie dieses:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Häufige Fälle: `400` ungültiger Anfrageinhalt, `401` fehlende/ungültige Authentifizierung, `403` fehlender Operator-Berechtigungsumfang, `405` falsche Methode, `429` zu viele fehlgeschlagene Authentifizierungsversuche (mit `Retry-After`).

## Beispiele

Ohne Streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

Mit Streaming:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## Verwandte Themen

- [OpenAI-Chat-Completions](/de/gateway/openai-http-api)
- [Operator-Berechtigungsumfänge](/de/gateway/operator-scopes)
- [OpenAI](/de/providers/openai)
