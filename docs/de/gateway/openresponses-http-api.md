---
read_when:
    - Clients integrieren, die die OpenResponses API sprechen
    - Sie möchten elementbasierte Eingaben, Client-Tool-Aufrufe oder SSE-Ereignisse
summary: Einen OpenResponses-kompatiblen HTTP-Endpunkt /v1/responses vom Gateway bereitstellen
title: OpenResponses-API
x-i18n:
    generated_at: "2026-06-27T17:31:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbc41a14f5c585a0fb0aae96fb3d2376f94cdb77f41bcd7cc5e7998a27673c44
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw's Gateway kann einen OpenResponses-kompatiblen Endpunkt `POST /v1/responses` bereitstellen.

Dieser Endpunkt ist **standardmäßig deaktiviert**. Aktivieren Sie ihn zuerst in der Konfiguration.

- `POST /v1/responses`
- Derselbe Port wie der Gateway (WS- + HTTP-Multiplex): `http://<gateway-host>:<port>/v1/responses`

Im Hintergrund werden Anfragen als normaler Gateway-Agentenlauf ausgeführt (derselbe Codepfad wie
`openclaw agent`), daher entsprechen Routing/Berechtigungen/Konfiguration Ihrem Gateway.

## Authentifizierung, Sicherheit und Routing

Das Betriebsverhalten entspricht [OpenAI Chat Completions](/de/gateway/openai-http-api):

- Verwenden Sie den passenden Gateway-HTTP-Authentifizierungspfad:
  - Shared-Secret-Authentifizierung (`gateway.auth.mode="token"` oder `"password"`): `Authorization: Bearer <token-or-password>`
  - Trusted-Proxy-Authentifizierung (`gateway.auth.mode="trusted-proxy"`): identitätsbewusste Proxy-Header aus einer konfigurierten vertrauenswürdigen Proxy-Quelle; Same-Host-loopback-Proxys erfordern explizit `gateway.auth.trustedProxy.allowLoopback = true`
  - lokaler direkter Fallback für trusted-proxy: Same-Host-Aufrufer ohne `Forwarded`-, `X-Forwarded-*`- oder `X-Real-IP`-Header können `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` verwenden
  - offene private-ingress-Authentifizierung (`gateway.auth.mode="none"`): kein Authentifizierungs-Header
- Behandeln Sie den Endpunkt als vollständigen Operatorzugriff für die Gateway-Instanz
- Ignorieren Sie bei Shared-Secret-Authentifizierungsmodi (`token` und `password`) engere, vom Bearer deklarierte `x-openclaw-scopes`-Werte und stellen Sie die normalen vollständigen Operator-Standardwerte wieder her
- Berücksichtigen Sie bei vertrauenswürdigen identitätstragenden HTTP-Modi (zum Beispiel trusted-proxy-Authentifizierung oder `gateway.auth.mode="none"`) `x-openclaw-scopes`, wenn vorhanden, und greifen Sie andernfalls auf den normalen Standardscope-Satz für Operatoren zurück
- Wählen Sie Agenten mit `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` oder `x-openclaw-agent-id` aus
- Verwenden Sie `x-openclaw-model`, wenn Sie das Backend-Modell des ausgewählten Agenten überschreiben möchten
- Verwenden Sie `x-openclaw-session-key` für explizites Sitzungsrouting
- Verwenden Sie `x-openclaw-message-channel`, wenn Sie einen nicht standardmäßigen synthetischen Ingress-Kanalkontext möchten

Auth-Matrix:

- `gateway.auth.mode="token"` oder `"password"` + `Authorization: Bearer ...`
  - weist den Besitz des gemeinsamen Gateway-Operator-Geheimnisses nach
  - ignoriert engere `x-openclaw-scopes`
  - stellt den vollständigen Standard-Operator-Scope-Satz wieder her:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt Chat-Turns auf diesem Endpunkt als Owner-Sender-Turns
- Vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel trusted-proxy-Authentifizierung oder `gateway.auth.mode="none"` bei privatem Ingress)
  - berücksichtigen `x-openclaw-scopes`, wenn der Header vorhanden ist
  - greifen auf den normalen Standard-Operator-Scope-Satz zurück, wenn der Header fehlt
  - verlieren Owner-Semantik nur, wenn der Aufrufer Scopes explizit einschränkt und `operator.admin` auslässt

Aktivieren oder deaktivieren Sie diesen Endpunkt mit `gateway.http.endpoints.responses.enabled`.

Dieselbe Kompatibilitätsoberfläche enthält außerdem:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Die kanonische Erklärung dazu, wie Agent-Target-Modelle, `openclaw/default`, Embeddings-Pass-through und Backend-Modellüberschreibungen zusammenpassen, finden Sie unter [OpenAI Chat Completions](/de/gateway/openai-http-api#agent-first-model-contract) und [Modellliste und Agentenrouting](/de/gateway/openai-http-api#model-list-and-agent-routing).

## Sitzungsverhalten

Standardmäßig ist der Endpunkt **pro Anfrage zustandslos** (bei jedem Aufruf wird ein neuer Sitzungsschlüssel generiert).

Wenn die Anfrage eine OpenResponses-`user`-Zeichenfolge enthält, leitet der Gateway daraus einen stabilen Sitzungsschlüssel ab, sodass wiederholte Aufrufe eine Agentensitzung teilen können.

## Anfrageform (unterstützt)

Die Anfrage folgt der OpenResponses-API mit elementbasierter Eingabe. Derzeit unterstützt:

- `input`: Zeichenfolge oder Array von Elementobjekten.
- `instructions`: wird in den System-Prompt zusammengeführt.
- `tools`: Client-Tooldefinitionen (Funktionstools).
- `tool_choice`: `"auto"`, `"none"`, `"required"` oder `{ "type": "function", "name": "..." }`, um Client-Tools zu filtern oder zu erzwingen.
- `stream`: aktiviert SSE-Streaming.
- `max_output_tokens`: Best-Effort-Ausgabelimit (Provider-abhängig).
- `temperature`: Best-Effort-Sampling-Temperatur, die an den Provider weitergeleitet wird. Wird vom ChatGPT-basierten Codex-Responses-Backend ignoriert, das festes serverseitiges Sampling verwendet.
- `top_p`: Best-Effort-Nucleus-Sampling, das an den Provider weitergeleitet wird. Dieselbe Einschränkung für Codex Responses wie bei `temperature`.
- `user`: stabiles Sitzungsrouting.

Akzeptiert, aber **derzeit ignoriert**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Unterstützt:

- `previous_response_id`: OpenClaw verwendet die frühere Antwortsitzung erneut, wenn die Anfrage innerhalb desselben Agent-/Benutzer-/angeforderten Sitzungsbereichs bleibt.

## Elemente (Eingabe)

### `message`

Rollen: `system`, `developer`, `user`, `assistant`.

- `system` und `developer` werden an den System-Prompt angehängt.
- Das neueste `user`- oder `function_call_output`-Element wird zur „aktuellen Nachricht“.
- Frühere Benutzer-/Assistentennachrichten werden als Historie für den Kontext einbezogen.

### `function_call_output` (turn-basierte Tools)

Senden Sie Toolergebnisse zurück an das Modell:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` und `item_reference`

Aus Gründen der Schemakompatibilität akzeptiert, aber beim Erstellen des Prompts ignoriert.

## Tools (clientseitige Funktionstools)

Stellen Sie Tools mit `tools: [{ type: "function", name, description?, parameters? }]` bereit.

Wenn der Agent entscheidet, ein Tool aufzurufen, gibt die Antwort ein `function_call`-Ausgabeelement zurück.
Anschließend senden Sie eine Folgeanfrage mit `function_call_output`, um den Turn fortzusetzen.

Bei `tool_choice: "required"` und funktionsgebundenem `tool_choice` schränkt der Endpunkt die bereitgestellte Menge clientseitiger Funktionstools ein, weist die Laufzeit an, vor der Antwort ein Client-Tool aufzurufen, und lehnt den Turn ab, wenn er keinen passenden strukturierten Client-Tool-Aufruf enthält. Dieser Vertrag gilt für die vom Aufrufer bereitgestellte HTTP-`tools`-Liste, nicht für jedes interne OpenClaw-Agententool. Nicht streamende Anfragen geben `502` mit einem `api_error` zurück; streamende Anfragen geben ein `response.failed`-Ereignis aus. Dies entspricht dem Vertrag von `/v1/chat/completions`.

## Bilder (`input_image`)

Unterstützt Base64- oder URL-Quellen:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Zulässige MIME-Typen (aktuell): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Maximale Größe (aktuell): 10 MB.

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

Zulässige MIME-Typen (aktuell): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Maximale Größe (aktuell): 5 MB.

Aktuelles Verhalten:

- Dateiinhalte werden dekodiert und dem **System-Prompt** hinzugefügt, nicht der Benutzernachricht,
  sodass sie flüchtig bleiben (nicht in der Sitzungshistorie persistiert).
- Dekodierter Dateitext wird als **nicht vertrauenswürdiger externer Inhalt** eingeschlossen, bevor er hinzugefügt wird,
  sodass Dateibytes als Daten behandelt werden, nicht als vertrauenswürdige Anweisungen.
- Der injizierte Block verwendet explizite Begrenzungsmarker wie
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` und enthält eine
  `Source: External`-Metadatenzeile.
- Dieser Datei-Eingabepfad lässt das lange `SECURITY NOTICE:`-Banner bewusst weg, um
  Prompt-Budget zu sparen; die Begrenzungsmarker und Metadaten bleiben dennoch vorhanden.
- PDFs werden zuerst auf Text geparst. Wenn wenig Text gefunden wird, werden die ersten Seiten
  in Bilder gerastert und an das Modell übergeben, und der injizierte Dateiblock verwendet
  den Platzhalter `[PDF content rendered to images]`.

PDF-Parsing wird vom gebündelten `document-extract`-Plugin bereitgestellt, das
`clawpdf` und dessen paketierte PDFium-WebAssembly-Laufzeit für Textextraktion und
Seitenrendering verwendet.

Standardwerte für URL-Fetches:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (Gesamtzahl URL-basierter `input_file`- und `input_image`-Teile pro Anfrage)
- Anfragen werden geschützt (DNS-Auflösung, Blockieren privater IPs, Redirect-Obergrenzen, Timeouts).
- Optionale Hostnamen-Allowlists werden pro Eingabetyp unterstützt (`files.urlAllowlist`, `images.urlAllowlist`).
  - Exakter Host: `"cdn.example.com"`
  - Wildcard-Subdomains: `"*.assets.example.com"` (entspricht nicht der Apex-Domain)
  - Leere oder ausgelassene Allowlists bedeuten keine Einschränkung durch Hostnamen-Allowlist.
- Um URL-basierte Fetches vollständig zu deaktivieren, setzen Sie `files.allowUrl: false` und/oder `images.allowUrl: false`.

## Datei- und Bildlimits (Konfiguration)

Standardwerte können unter `gateway.http.endpoints.responses` angepasst werden:

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

Standardwerte bei Auslassung:

- `maxBodyBytes`: 20 MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5 MB
- `files.maxChars`: 200.000
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10 s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4.000.000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10 MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10 s
- HEIC/HEIF-`input_image`-Quellen werden akzeptiert, wenn ein Systemkonverter verfügbar ist, und vor der Provider-Auslieferung zu JPEG normalisiert. Unterstützte Konverter sind macOS-`sips`, ImageMagick, GraphicsMagick oder ffmpeg.

Sicherheitshinweis:

- URL-Allowlists werden vor dem Fetch und bei Redirect-Hops durchgesetzt.
- Das Allowlisting eines Hostnamens umgeht nicht das Blockieren privater/interner IPs.
- Wenden Sie bei internetexponierten Gateways zusätzlich zu Schutzmechanismen auf Anwendungsebene Netzwerk-Egress-Kontrollen an.
  Siehe [Sicherheit](/de/gateway/security).

## Streaming (SSE)

Setzen Sie `stream: true`, um Server-Sent Events (SSE) zu empfangen:

- `Content-Type: text/event-stream`
- Jede Ereigniszeile ist `event: <type>` und `data: <json>`
- Stream endet mit `data: [DONE]`

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
- `response.failed` (bei Fehler)

## Nutzung

`usage` wird gefüllt, wenn der zugrunde liegende Provider Tokenzahlen meldet.
OpenClaw normalisiert gängige OpenAI-artige Aliase, bevor diese Zähler
nachgelagerte Status-/Sitzungsoberflächen erreichen, einschließlich `input_tokens` / `output_tokens`
und `prompt_tokens` / `completion_tokens`.

## Fehler

Fehler verwenden ein JSON-Objekt wie:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Häufige Fälle:

- `401` fehlende/ungültige Authentifizierung
- `400` ungültiger Anfrage-Body
- `405` falsche Methode

## Beispiele

Nicht streamend:

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

Streaming:

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

- [OpenAI-Chat-Completions](/de/gateway/openai-http-api)
- [OpenAI](/de/providers/openai)
