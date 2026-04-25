---
read_when:
    - Clients integrieren, die die OpenResponses API sprechen
    - Sie möchten elementbasierte Eingaben, clientseitige Tool-Aufrufe oder SSE-Ereignisse
summary: Einen OpenResponses-kompatiblen HTTP-Endpunkt `/v1/responses` über das Gateway bereitstellen
title: OpenResponses API
x-i18n:
    generated_at: "2026-04-25T13:47:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: b48685ab42d6f031849990b60a57af9501c216f058dc38abce184b963b05cedb
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

Das Gateway von OpenClaw kann einen mit OpenResponses kompatiblen Endpunkt `POST /v1/responses` bereitstellen.

Dieser Endpunkt ist **standardmäßig deaktiviert**. Aktivieren Sie ihn zuerst in der Konfiguration.

- `POST /v1/responses`
- Derselbe Port wie das Gateway (WS + HTTP-Multiplex): `http://<gateway-host>:<port>/v1/responses`

Intern werden Anfragen als normaler Gateway-Agentenlauf ausgeführt (derselbe Codepfad wie
`openclaw agent`), sodass Routing/Berechtigungen/Konfiguration zu Ihrem Gateway passen.

## Authentifizierung, Sicherheit und Routing

Das Betriebsverhalten entspricht [OpenAI Chat Completions](/de/gateway/openai-http-api):

- Verwenden Sie den passenden HTTP-Authentifizierungspfad des Gateway:
  - Authentifizierung mit gemeinsamem Geheimnis (`gateway.auth.mode="token"` oder `"password"`): `Authorization: Bearer <token-or-password>`
  - Trusted-Proxy-Authentifizierung (`gateway.auth.mode="trusted-proxy"`): identitätsbezogene Proxy-Header von einer konfigurierten vertrauenswürdigen Proxy-Quelle, die nicht loopback ist
  - offene Authentifizierung für privaten Ingress (`gateway.auth.mode="none"`): kein Auth-Header
- Behandeln Sie den Endpunkt als vollen Operatorzugriff für die Gateway-Instanz
- Für Authentifizierungsmodi mit gemeinsamem Geheimnis (`token` und `password`) werden engere, per Bearer deklarierte Werte in `x-openclaw-scopes` ignoriert und die normalen vollständigen Operator-Standards wiederhergestellt
- Für HTTP-Modi mit vertrauenswürdiger Identität (zum Beispiel Trusted-Proxy-Authentifizierung oder `gateway.auth.mode="none"`) werden `x-openclaw-scopes` berücksichtigt, wenn vorhanden, und andernfalls wird auf den normalen Standardumfang für Operatoren zurückgegriffen
- Wählen Sie Agenten mit `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` oder `x-openclaw-agent-id`
- Verwenden Sie `x-openclaw-model`, wenn Sie das Backend-Modell des ausgewählten Agenten überschreiben möchten
- Verwenden Sie `x-openclaw-session-key` für explizites Sitzungs-Routing
- Verwenden Sie `x-openclaw-message-channel`, wenn Sie einen nicht standardmäßigen synthetischen Ingress-Kanal-Kontext möchten

Authentifizierungsmatrix:

- `gateway.auth.mode="token"` oder `"password"` + `Authorization: Bearer ...`
  - weist den Besitz des gemeinsam genutzten Gateway-Operator-Geheimnisses nach
  - ignoriert engere `x-openclaw-scopes`
  - stellt den vollständigen Standardumfang für Operatoren wieder her:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt Chat-Turns an diesem Endpunkt als Turns eines Eigentümer-Absenders
- HTTP-Modi mit vertrauenswürdiger Identität (zum Beispiel Trusted-Proxy-Authentifizierung oder `gateway.auth.mode="none"` bei privatem Ingress)
  - berücksichtigen `x-openclaw-scopes`, wenn der Header vorhanden ist
  - greifen auf den normalen Standardumfang für Operatoren zurück, wenn der Header fehlt
  - verlieren Eigentümer-Semantik nur dann, wenn der Aufrufer die Scopes explizit einschränkt und `operator.admin` weglässt

Aktivieren oder deaktivieren Sie diesen Endpunkt mit `gateway.http.endpoints.responses.enabled`.

Zur selben Kompatibilitätsoberfläche gehören auch:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Für die kanonische Erklärung, wie agentenbezogene Zielmodelle, `openclaw/default`, Embeddings-Passthrough und Überschreibungen von Backend-Modellen zusammenpassen, siehe [OpenAI Chat Completions](/de/gateway/openai-http-api#agent-first-model-contract) und [Model list and agent routing](/de/gateway/openai-http-api#model-list-and-agent-routing).

## Sitzungsverhalten

Standardmäßig ist der Endpunkt **pro Anfrage zustandslos** (bei jedem Aufruf wird ein neuer Sitzungsschlüssel erzeugt).

Wenn die Anfrage einen OpenResponses-String `user` enthält, leitet das Gateway daraus einen stabilen Sitzungsschlüssel ab,
sodass wiederholte Aufrufe eine Agentensitzung gemeinsam nutzen können.

## Anfrageformat (unterstützt)

Die Anfrage folgt der OpenResponses API mit elementbasierten Eingaben. Aktuell unterstützt:

- `input`: String oder Array von Elementobjekten.
- `instructions`: wird in den Systemprompt zusammengeführt.
- `tools`: clientseitige Tool-Definitionen (Function tools).
- `tool_choice`: clientseitige Tools filtern oder verlangen.
- `stream`: aktiviert SSE-Streaming.
- `max_output_tokens`: Best-Effort-Ausgabelimit (providerabhängig).
- `user`: stabiles Sitzungs-Routing.

Akzeptiert, aber **derzeit ignoriert**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Unterstützt:

- `previous_response_id`: OpenClaw verwendet die frühere Antwortsitzung wieder, wenn die Anfrage innerhalb desselben Bereichs von Agent/Benutzer/angeforderter Sitzung bleibt.

## Elemente (`input`)

### `message`

Rollen: `system`, `developer`, `user`, `assistant`.

- `system` und `developer` werden an den Systemprompt angehängt.
- Das aktuellste Element vom Typ `user` oder `function_call_output` wird zur „aktuellen Nachricht“.
- Frühere Nachrichten von Benutzer/Assistant werden als Verlauf für den Kontext einbezogen.

### `function_call_output` (turn-basierte Tools)

Senden Sie Tool-Ergebnisse an das Modell zurück:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` und `item_reference`

Werden aus Gründen der Schema-Kompatibilität akzeptiert, beim Aufbau des Prompts aber ignoriert.

## Tools (clientseitige Function tools)

Stellen Sie Tools mit `tools: [{ type: "function", function: { name, description?, parameters? } }]` bereit.

Wenn der Agent entscheidet, ein Tool aufzurufen, gibt die Antwort ein Ausgabeelement vom Typ `function_call` zurück.
Sie senden dann eine Folgeanfrage mit `function_call_output`, um den Turn fortzusetzen.

## Bilder (`input_image`)

Unterstützt Base64- oder URL-Quellen:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Erlaubte MIME-Typen (aktuell): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Maximale Größe (aktuell): 10MB.

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

Erlaubte MIME-Typen (aktuell): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Maximale Größe (aktuell): 5MB.

Aktuelles Verhalten:

- Dateiinhalte werden dekodiert und dem **Systemprompt** hinzugefügt, nicht der Benutzernachricht,
  sodass sie ephemer bleiben (nicht im Sitzungsverlauf gespeichert werden).
- Dekodierter Dateitext wird vor dem Hinzufügen als **nicht vertrauenswürdiger externer Inhalt** eingeschlossen,
  sodass Dateibytes als Daten und nicht als vertrauenswürdige Anweisungen behandelt werden.
- Der eingefügte Block verwendet explizite Begrenzungsmarkierungen wie
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` und enthält eine
  Metadatenzeile `Source: External`.
- Dieser Pfad für Dateieingaben lässt das lange Banner `SECURITY NOTICE:` bewusst weg, um
  Prompt-Budget zu sparen; die Begrenzungsmarkierungen und Metadaten bleiben dennoch erhalten.
- PDFs werden zuerst auf Text geparst. Wenn wenig Text gefunden wird, werden die ersten Seiten
  in Bilder gerastert und an das Modell übergeben, und der eingefügte Dateiblock verwendet
  den Platzhalter `[PDF content rendered to images]`.

Das PDF-Parsing wird vom gebündelten Plugin `document-extract` bereitgestellt, das den
Node-freundlichen Legacy-Build von `pdfjs-dist` verwendet (ohne Worker). Der moderne PDF.js-Build
erwartet Browser-Worker/DOM-Globals und wird deshalb im Gateway nicht verwendet.

Standardwerte für URL-Abrufe:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (Gesamtzahl URL-basierter Teile `input_file` + `input_image` pro Anfrage)
- Anfragen werden geschützt (DNS-Auflösung, Blockierung privater IPs, Redirect-Limits, Timeouts).
- Optionale Hostname-Allowlists werden pro Eingabetyp unterstützt (`files.urlAllowlist`, `images.urlAllowlist`).
  - Exakter Host: `"cdn.example.com"`
  - Wildcard-Subdomains: `"*.assets.example.com"` (passt nicht auf die Apex-Domain)
  - Leere oder weggelassene Allowlists bedeuten keine Einschränkung durch eine Hostname-Allowlist.
- Um URL-basierte Abrufe vollständig zu deaktivieren, setzen Sie `files.allowUrl: false` und/oder `images.allowUrl: false`.

## Limits für Dateien und Bilder (Konfiguration)

Standards können unter `gateway.http.endpoints.responses` angepasst werden:

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
            maxChars: 200000,
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

Standardwerte, wenn weggelassen:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- Quellen vom Typ HEIC/HEIF für `input_image` werden akzeptiert und vor der Zustellung an den Provider nach JPEG normalisiert.

Sicherheitshinweis:

- URL-Allowlists werden vor dem Abruf und bei Redirect-Sprüngen durchgesetzt.
- Das Zulassen eines Hostnamens umgeht nicht die Blockierung privater/interner IPs.
- Für öffentlich erreichbare Gateways wenden Sie zusätzlich zu den Schutzmaßnahmen auf Anwendungsebene auch Kontrollen für ausgehenden Netzwerkverkehr an.
  Siehe [Security](/de/gateway/security).

## Streaming (SSE)

Setzen Sie `stream: true`, um Server-Sent Events (SSE) zu empfangen:

- `Content-Type: text/event-stream`
- Jede Ereigniszeile ist `event: <type>` und `data: <json>`
- Der Stream endet mit `data: [DONE]`

Derzeit ausgegebene Ereignistypen:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (bei Fehlern)

## Nutzung

`usage` wird befüllt, wenn der zugrunde liegende Provider Token-Zähler meldet.
OpenClaw normalisiert gebräuchliche OpenAI-artige Aliasse, bevor diese Zähler
nachgelagerte Status-/Sitzungsoberflächen erreichen, einschließlich `input_tokens` / `output_tokens`
und `prompt_tokens` / `completion_tokens`.

## Fehler

Fehler verwenden ein JSON-Objekt wie dieses:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Häufige Fälle:

- `401` fehlende/ungültige Authentifizierung
- `400` ungültiger Anfrage-Body
- `405` falsche Methode

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

## Verwandt

- [OpenAI chat completions](/de/gateway/openai-http-api)
- [OpenAI](/de/providers/openai)
