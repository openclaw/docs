---
read_when:
    - Integration von Clients, die die OpenResponses-API verwenden
    - Sie möchten elementbasierte Eingaben, clientseitige Tool-Aufrufe oder SSE-Ereignisse.
summary: Stellen Sie über den Gateway einen OpenResponses-kompatiblen HTTP-Endpunkt unter /v1/responses bereit
title: OpenResponses-API
x-i18n:
    generated_at: "2026-07-12T01:40:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fcf5016d1455383181923ec31b26cf31533b990045df300f0356f135c95579
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Das Gateway kann einen OpenResponses-kompatiblen Endpunkt `POST /v1/responses` bereitstellen. Er ist **standardmäßig deaktiviert** und verwendet denselben Port wie das Gateway (WS- und HTTP-Multiplexing): `http://<gateway-host>:<port>/v1/responses`.

Anfragen werden als normale Gateway-Agentenausführung verarbeitet (derselbe Codepfad wie bei `openclaw agent`), sodass Routing, Berechtigungen und Konfiguration Ihrem Gateway entsprechen.

Aktivieren oder deaktivieren Sie den Endpunkt mit `gateway.http.endpoints.responses.enabled`. Wenn er aktiviert ist, stellt dieselbe Kompatibilitätsschnittstelle auch `GET /v1/models`, `GET /v1/models/{id}`, `POST /v1/embeddings` und `POST /v1/chat/completions` bereit.

## Authentifizierung, Sicherheit und Routing

Das Betriebsverhalten entspricht [OpenAI Chat Completions](/de/gateway/openai-http-api):

- Der Authentifizierungspfad entspricht `gateway.auth.mode`: Ein gemeinsames Geheimnis (`token`/`password`) verwendet `Authorization: Bearer <token-or-password>`; ein vertrauenswürdiger Proxy verwendet identitätsbezogene Proxy-Header (Loopback-Proxys auf demselben Host benötigen `gateway.auth.trustedProxy.allowLoopback = true`, mit einem direkten Fallback auf demselben Host über `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, wenn kein `Forwarded`-/`X-Forwarded-*`-/`X-Real-IP`-Header vorhanden ist); `none` benötigt bei privatem Eingang keinen Authentifizierungs-Header. Siehe [Authentifizierung über vertrauenswürdige Proxys](/de/gateway/trusted-proxy-auth).
- Behandeln Sie den Endpunkt als vollständigen Operatorzugriff auf die Gateway-Instanz.
- Authentifizierungsmodi mit gemeinsamem Geheimnis ignorieren enger gefasste, per Bearer deklarierte `x-openclaw-scopes` und stellen den vollständigen Standardsatz an Operator-Berechtigungsbereichen wieder her: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Chat-Interaktionen an diesem Endpunkt werden als Interaktionen eines Eigentümer-Absenders behandelt.
- Vertrauenswürdige identitätsführende HTTP-Modi (vertrauenswürdiger Proxy oder `gateway.auth.mode="none"`) berücksichtigen `x-openclaw-scopes`, wenn dieser Header vorhanden ist, und greifen andernfalls auf den Standardsatz der Operator-Berechtigungsbereiche zurück. Die Eigentümersemantik geht nur verloren, wenn der Aufrufer die Berechtigungsbereiche ausdrücklich einschränkt und `operator.admin` auslässt.
- Wählen Sie Agenten mit `model: "openclaw"`, `"openclaw/default"`, `"openclaw/<agentId>"` oder dem Header `x-openclaw-agent-id` aus.
- Verwenden Sie `x-openclaw-model`, um das Backend-Modell des ausgewählten Agenten zu überschreiben (erfordert `operator.admin` bei identitätsführenden Authentifizierungspfaden).
- Verwenden Sie `x-openclaw-session-key` für explizites Sitzungs-Routing (wird mit `400 invalid_request_error` abgelehnt, wenn ein reservierter Namensraum verwendet wird: `subagent:`, `cron:`, `acp:`).
- Verwenden Sie `x-openclaw-message-channel` für einen vom Standard abweichenden synthetischen Eingangskanalkontext.

Die maßgebliche Erläuterung zu Agentenzielmodellen, `openclaw/default`, der Durchleitung von Einbettungen und Überschreibungen von Backend-Modellen finden Sie unter [OpenAI Chat Completions](/de/gateway/openai-http-api#agent-first-model-contract).

Siehe [Operator-Berechtigungsbereiche](/de/gateway/operator-scopes) und [Sicherheit](/de/gateway/security).

## Sitzungsverhalten

Standardmäßig ist der Endpunkt **für jede Anfrage zustandslos** (bei jedem Aufruf wird ein neuer Sitzungsschlüssel erzeugt).

Wenn die Anfrage eine OpenResponses-`user`-Zeichenfolge enthält, leitet das Gateway daraus einen stabilen Sitzungsschlüssel ab, sodass wiederholte Aufrufe eine Agentensitzung gemeinsam verwenden können.

`previous_response_id` verwendet die Sitzung der vorherigen Antwort erneut, wenn die Anfrage im selben Agenten-/Benutzer-/angeforderten Sitzungsbereich bleibt (Abgleich anhand von Authentifizierungssubjekt, Agenten-ID und `x-openclaw-session-key`).

## Anfragestruktur

| Feld                                                             | Unterstützung                                                                                                                                                 |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `input`                                                          | Zeichenfolge oder Array von Elementobjekten.                                                                                                                  |
| `instructions`                                                   | Wird mit dem System-Prompt zusammengeführt.                                                                                                                   |
| `tools`                                                          | Clientseitige Werkzeugdefinitionen (Funktionswerkzeuge).                                                                                                      |
| `tool_choice`                                                    | `"auto"`, `"none"`, `"required"` oder `{ "type": "function", "name": "..." }`, um clientseitige Werkzeuge zu filtern oder vorzuschreiben.                     |
| `stream`                                                         | Aktiviert SSE-Streaming.                                                                                                                                      |
| `max_output_tokens`                                              | Ausgabelimit nach bestem Bemühen (Provider-abhängig).                                                                                                         |
| `temperature`                                                    | Sampling-Temperatur nach bestem Bemühen. Wird vom ChatGPT-basierten Codex-Responses-Backend ignoriert, das festes serverseitiges Sampling verwendet.           |
| `top_p`                                                          | Nucleus-Sampling nach bestem Bemühen. Es gilt derselbe Hinweis zum Codex-Responses-Backend wie bei `temperature`.                                              |
| `user`                                                           | Stabiles Sitzungs-Routing.                                                                                                                                    |
| `previous_response_id`                                           | Sitzungskontinuität (siehe oben).                                                                                                                             |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | Wird akzeptiert, derzeit jedoch ignoriert.                                                                                                                    |

## Elemente (`input`)

### `message`

Rollen: `system`, `developer`, `user`, `assistant`.

- `system` und `developer` werden an den System-Prompt angehängt.
- Das neueste `user`- oder `function_call_output`-Element wird zur „aktuellen Nachricht“.
- Frühere Benutzer-/Assistentennachrichten werden als Verlauf für den Kontext einbezogen.

### `function_call_output` (interaktionsbasierte Werkzeuge)

Senden Sie Werkzeugergebnisse an das Modell zurück:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` und `item_reference`

Werden aus Gründen der Schemakompatibilität akzeptiert, beim Erstellen des Prompts jedoch ignoriert.

## Werkzeuge (clientseitige Funktionswerkzeuge)

Stellen Sie Werkzeuge mit `tools: [{ type: "function", name, description?, parameters? }]` bereit.

Wenn der Agent ein Werkzeug aufruft, enthält die Antwort ein `function_call`-Ausgabeelement. Senden Sie zum Fortsetzen der Interaktion eine Folgeanfrage mit `function_call_output`.

Bei `tool_choice: "required"` und einem auf eine Funktion festgelegten `tool_choice` schränkt der Endpunkt die bereitgestellte Menge clientseitiger Funktionswerkzeuge ein, weist die Laufzeit an, vor der Antwort ein clientseitiges Werkzeug aufzurufen, und lehnt die Interaktion ab, wenn sie keinen passenden strukturierten Aufruf eines clientseitigen Werkzeugs enthält. Dies entspricht dem Vertrag von `/v1/chat/completions`. Nicht streamende Anfragen geben `502` mit einem `api_error` zurück; streamende Anfragen senden ein `response.failed`-Ereignis.

## Bilder (`input_image`)

Unterstützt Base64- oder URL-Quellen:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Zulässige MIME-Typen (Standard): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`. Maximale Größe (Standard): 10 MB.

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

Zulässige MIME-Typen (Standard): `text/plain`, `text/markdown`, `text/html`, `text/csv`, `application/json`, `application/pdf`. Maximale Größe (Standard): 5 MB.

Aktuelles Verhalten:

- Der Dateiinhalt wird dekodiert und dem **System-Prompt** hinzugefügt, nicht der Benutzernachricht. Dadurch bleibt er flüchtig und wird nicht im Sitzungsverlauf gespeichert.
- Der dekodierte Dateitext wird vor dem Hinzufügen als **nicht vertrauenswürdiger externer Inhalt** eingeschlossen, sodass Dateibytes als Daten und nicht als vertrauenswürdige Anweisungen behandelt werden. Der eingefügte Block verwendet explizite Begrenzungsmarkierungen (`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`) und eine Metadatenzeile `Source: External`. Das lange Banner `SECURITY NOTICE:` wird absichtlich weggelassen, um das Prompt-Budget zu schonen; die Begrenzungsmarkierungen und Metadaten gelten weiterhin.
- PDFs werden zunächst auf Text analysiert. Wenn nur wenig Text gefunden wird, werden die ersten Seiten in Rasterbilder umgewandelt und an das Modell übergeben; der eingefügte Dateiblock verwendet dann den Platzhalter `[PDF content rendered to images]`.

Die PDF-Analyse wird vom gebündelten Plugin `document-extract` bereitgestellt, das `clawpdf` und dessen mitgelieferte PDFium-WebAssembly-Laufzeit für Textextraktion und Seitendarstellung verwendet.

Standardeinstellungen für URL-Abrufe:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (Gesamtzahl der URL-basierten `input_file`- und `input_image`-Teile pro Anfrage)
- Anfragen werden abgesichert (DNS-Auflösung, Blockierung privater IP-Adressen, Begrenzung von Weiterleitungen, Zeitüberschreitungen).
- Optionale Hostnamen-Zulassungslisten werden pro Eingabetyp unterstützt (`files.urlAllowlist`, `images.urlAllowlist`): exakter Host (`"cdn.example.com"`) oder Platzhalter für Subdomains (`"*.assets.example.com"`, stimmt nicht mit der Stammdomain überein). Leere oder ausgelassene Zulassungslisten bedeuten, dass keine Einschränkung durch eine Hostnamen-Zulassungsliste gilt.
- Um URL-basierte Abrufe vollständig zu deaktivieren, setzen Sie `files.allowUrl: false` und/oder `images.allowUrl: false`.

## Datei- und Bildlimits (Konfiguration)

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

| Schlüssel                  | Standardwert |
| -------------------------- | ------------ |
| `maxBodyBytes`             | 20 MB        |
| `maxUrlParts`              | 8            |
| `files.maxBytes`           | 5 MB         |
| `files.maxChars`           | 60.000       |
| `files.maxRedirects`       | 3            |
| `files.timeoutMs`          | 10 s         |
| `files.pdf.maxPages`       | 4            |
| `files.pdf.maxPixels`      | 4.000.000    |
| `files.pdf.minTextChars`   | 200          |
| `images.maxBytes`          | 10 MB        |
| `images.maxRedirects`      | 3            |
| `images.timeoutMs`         | 10 s         |

HEIC-/HEIF-`input_image`-Quellen werden vor der Übergabe an den Provider durch den gemeinsamen OpenClaw-Bildprozessor (Rastermill) in JPEG normalisiert. Für Formate, die externe Codec-Unterstützung benötigen, greift dieser auf einen Systemkonverter (`sips`, ImageMagick, GraphicsMagick oder ffmpeg) zurück.

Sicherheitshinweis: URL-Zulassungslisten werden vor dem Abruf und bei jedem Weiterleitungsschritt durchgesetzt. Die Aufnahme eines Hostnamens in die Zulassungsliste umgeht nicht die Blockierung privater oder interner IP-Adressen. Wenden Sie bei über das Internet erreichbaren Gateways zusätzlich zu den Schutzmaßnahmen auf Anwendungsebene Kontrollen für ausgehenden Netzwerkverkehr an. Siehe [Sicherheit](/de/gateway/security).

## Streaming (SSE)

Setzen Sie `stream: true`, um Server-Sent Events zu empfangen:

- `Content-Type: text/event-stream`
- Jede Ereigniszeile hat das Format `event: <type>` und `data: <json>`
- Der Stream endet mit `data: [DONE]`

Derzeit ausgegebene Ereignistypen: `response.created`, `response.in_progress`, `response.output_item.added`, `response.content_part.added`, `response.output_text.delta`, `response.output_text.done`, `response.content_part.done`, `response.output_item.done`, `response.completed`, `response.failed` (bei einem Fehler).

## Verwendung

`usage` wird ausgefüllt, wenn der zugrunde liegende Provider Token-Anzahlen meldet. OpenClaw normalisiert gängige Aliasnamen im OpenAI-Stil, bevor diese Zähler nachgelagerte Status- und Sitzungsoberflächen erreichen, darunter `input_tokens` / `output_tokens` und `prompt_tokens` / `completion_tokens`.

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

- [OpenAI-Chatvervollständigungen](/de/gateway/openai-http-api)
- [Operator-Berechtigungsumfänge](/de/gateway/operator-scopes)
- [OpenAI](/de/providers/openai)
