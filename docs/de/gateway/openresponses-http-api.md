---
read_when:
    - Clients integrieren, die die OpenResponses API unterstützen
    - Sie möchten elementbasierte Eingaben, Client-Tool-Aufrufe oder SSE-Ereignisse
summary: Einen OpenResponses-kompatiblen HTTP-Endpunkt /v1/responses über das Gateway bereitstellen
title: OpenResponses-API
x-i18n:
    generated_at: "2026-04-30T06:55:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1cfba4c2572fab2d2ef6bceecd1ae0a022850c46125c62d5a5f3969d07d03aff
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaws Gateway kann einen OpenResponses-kompatiblen `POST /v1/responses`-Endpunkt bereitstellen.

Dieser Endpunkt ist **standardmäßig deaktiviert**. Aktivieren Sie ihn zuerst in der Konfiguration.

- `POST /v1/responses`
- Derselbe Port wie der Gateway (WS + HTTP-Multiplex): `http://<gateway-host>:<port>/v1/responses`

Im Hintergrund werden Anfragen als normaler Gateway-Agent-Lauf ausgeführt (derselbe Codepfad wie
`openclaw agent`), sodass Routing/Berechtigungen/Konfiguration Ihrem Gateway entsprechen.

## Authentifizierung, Sicherheit und Routing

Das Betriebsverhalten entspricht [OpenAI Chat Completions](/de/gateway/openai-http-api):

- verwenden Sie den passenden Gateway-HTTP-Auth-Pfad:
  - Shared-Secret-Auth (`gateway.auth.mode="token"` oder `"password"`): `Authorization: Bearer <token-or-password>`
  - Trusted-Proxy-Auth (`gateway.auth.mode="trusted-proxy"`): identitätsbewusste Proxy-Header aus einer konfigurierten vertrauenswürdigen Proxy-Quelle; Same-Host-Loopback-Proxys erfordern explizit `gateway.auth.trustedProxy.allowLoopback = true`
  - Private-Ingress-Open-Auth (`gateway.auth.mode="none"`): kein Auth-Header
- behandeln Sie den Endpunkt als vollständigen Operatorzugriff für die Gateway-Instanz
- ignorieren Sie bei Shared-Secret-Auth-Modi (`token` und `password`) enger gefasste, vom Bearer deklarierte `x-openclaw-scopes`-Werte und stellen Sie die normalen vollständigen Operator-Standardwerte wieder her
- berücksichtigen Sie bei vertrauenswürdigen identitätstragenden HTTP-Modi (zum Beispiel Trusted-Proxy-Auth oder `gateway.auth.mode="none"`) `x-openclaw-scopes`, wenn vorhanden, und fallen Sie andernfalls auf den normalen Operator-Standardumfang zurück
- wählen Sie Agenten mit `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` oder `x-openclaw-agent-id` aus
- verwenden Sie `x-openclaw-model`, wenn Sie das Backend-Modell des ausgewählten Agenten überschreiben möchten
- verwenden Sie `x-openclaw-session-key` für explizites Sitzungsrouting
- verwenden Sie `x-openclaw-message-channel`, wenn Sie einen nicht standardmäßigen synthetischen Ingress-Kanalkontext möchten

Auth-Matrix:

- `gateway.auth.mode="token"` oder `"password"` + `Authorization: Bearer ...`
  - weist den Besitz des gemeinsamen Gateway-Operator-Secrets nach
  - ignoriert enger gefasste `x-openclaw-scopes`
  - stellt den vollständigen Standard-Operatorumfang wieder her:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt Chat-Turns an diesem Endpunkt als Owner-Sender-Turns
- vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel Trusted-Proxy-Auth oder `gateway.auth.mode="none"` bei privatem Ingress)
  - berücksichtigen `x-openclaw-scopes`, wenn der Header vorhanden ist
  - fallen auf den normalen Operator-Standardumfang zurück, wenn der Header fehlt
  - verlieren Owner-Semantik nur, wenn der Aufrufer Scopes explizit einschränkt und `operator.admin` weglässt

Aktivieren oder deaktivieren Sie diesen Endpunkt mit `gateway.http.endpoints.responses.enabled`.

Dieselbe Kompatibilitätsoberfläche umfasst außerdem:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Die kanonische Erklärung dazu, wie agentenzielgerichtete Modelle, `openclaw/default`, Embeddings-Pass-through und Backend-Modellüberschreibungen zusammenpassen, finden Sie unter [OpenAI Chat Completions](/de/gateway/openai-http-api#agent-first-model-contract) und [Modellliste und Agentenrouting](/de/gateway/openai-http-api#model-list-and-agent-routing).

## Sitzungsverhalten

Standardmäßig ist der Endpunkt **pro Anfrage zustandslos** (bei jedem Aufruf wird ein neuer Sitzungsschlüssel generiert).

Wenn die Anfrage eine OpenResponses-`user`-Zeichenfolge enthält, leitet der Gateway daraus einen stabilen Sitzungsschlüssel ab, sodass wiederholte Aufrufe eine Agentensitzung gemeinsam nutzen können.

## Anfrageformat (unterstützt)

Die Anfrage folgt der OpenResponses-API mit elementbasiertem Input. Aktuelle Unterstützung:

- `input`: Zeichenfolge oder Array von Elementobjekten.
- `instructions`: wird in den System-Prompt zusammengeführt.
- `tools`: Client-Tool-Definitionen (Funktionstools).
- `tool_choice`: Client-Tools filtern oder erzwingen.
- `stream`: aktiviert SSE-Streaming.
- `max_output_tokens`: Best-Effort-Ausgabelimit (Provider-abhängig).
- `user`: stabiles Sitzungsrouting.

Akzeptiert, aber **derzeit ignoriert**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Unterstützt:

- `previous_response_id`: OpenClaw verwendet die frühere Antwortsitzung erneut, wenn die Anfrage innerhalb desselben Agenten-/Benutzer-/angeforderten Sitzungsumfangs bleibt.

## Elemente (Input)

### `message`

Rollen: `system`, `developer`, `user`, `assistant`.

- `system` und `developer` werden an den System-Prompt angehängt.
- Das neueste `user`- oder `function_call_output`-Element wird zur „aktuellen Nachricht“.
- Frühere Benutzer-/Assistentennachrichten werden als Verlauf für den Kontext einbezogen.

### `function_call_output` (turnbasierte Tools)

Senden Sie Tool-Ergebnisse zurück an das Modell:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` und `item_reference`

Werden aus Gründen der Schemakompatibilität akzeptiert, aber beim Erstellen des Prompts ignoriert.

## Tools (clientseitige Funktionstools)

Stellen Sie Tools mit `tools: [{ type: "function", function: { name, description?, parameters? } }]` bereit.

Wenn der Agent entscheidet, ein Tool aufzurufen, gibt die Antwort ein `function_call`-Ausgabeelement zurück.
Senden Sie anschließend eine Folgeanfrage mit `function_call_output`, um den Turn fortzusetzen.

## Bilder (`input_image`)

Unterstützt Base64- oder URL-Quellen:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Zulässige MIME-Typen (aktuell): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
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

Zulässige MIME-Typen (aktuell): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Maximale Größe (aktuell): 5MB.

Aktuelles Verhalten:

- Dateiinhalte werden dekodiert und dem **System-Prompt** hinzugefügt, nicht der Benutzernachricht,
  sodass sie kurzlebig bleiben (nicht im Sitzungsverlauf persistiert).
- Dekodierter Dateitext wird als **nicht vertrauenswürdiger externer Inhalt** umschlossen, bevor er hinzugefügt wird,
  sodass Dateibytes als Daten behandelt werden, nicht als vertrauenswürdige Anweisungen.
- Der eingefügte Block verwendet explizite Begrenzungsmarker wie
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` und enthält eine
  `Source: External`-Metadatenzeile.
- Dieser Datei-Input-Pfad lässt das lange `SECURITY NOTICE:`-Banner absichtlich aus, um
  Prompt-Budget zu sparen; die Begrenzungsmarker und Metadaten bleiben dennoch erhalten.
- PDFs werden zuerst nach Text geparst. Wenn wenig Text gefunden wird, werden die ersten Seiten
  in Bilder gerastert und an das Modell übergeben, und der eingefügte Dateiblock verwendet
  den Platzhalter `[PDF content rendered to images]`.

PDF-Parsing wird vom gebündelten `document-extract`-Plugin bereitgestellt, das den
Node-freundlichen Legacy-Build von `pdfjs-dist` verwendet (ohne Worker). Der moderne PDF.js-Build
erwartet Browser-Worker/DOM-Globals und wird daher im Gateway nicht verwendet.

URL-Abrufstandardwerte:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (gesamte URL-basierte `input_file`- + `input_image`-Teile pro Anfrage)
- Anfragen werden geschützt (DNS-Auflösung, Blockieren privater IPs, Redirect-Begrenzungen, Timeouts).
- Optionale Hostnamen-Allowlists werden pro Input-Typ unterstützt (`files.urlAllowlist`, `images.urlAllowlist`).
  - Exakter Host: `"cdn.example.com"`
  - Wildcard-Subdomains: `"*.assets.example.com"` (stimmt nicht mit Apex überein)
  - Leere oder ausgelassene Allowlists bedeuten keine Hostnamen-Allowlist-Einschränkung.
- Um URL-basierte Abrufe vollständig zu deaktivieren, setzen Sie `files.allowUrl: false` und/oder `images.allowUrl: false`.

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
- HEIC/HEIF-`input_image`-Quellen werden akzeptiert und vor der Zustellung an den Provider zu JPEG normalisiert.

Sicherheitshinweis:

- URL-Allowlists werden vor dem Abruf und bei Redirect-Sprüngen durchgesetzt.
- Das Aufnehmen eines Hostnamens in die Allowlist umgeht nicht das Blockieren privater/interner IPs.
- Wenden Sie bei internetexponierten Gateways zusätzlich zu App-Level-Schutzmechanismen Netzwerk-Egress-Kontrollen an.
  Siehe [Sicherheit](/de/gateway/security).

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
- `response.failed` (bei Fehler)

## Nutzung

`usage` wird befüllt, wenn der zugrunde liegende Provider Token-Zählungen meldet.
OpenClaw normalisiert gängige Aliase im OpenAI-Stil, bevor diese Zähler nachgelagerte
Status-/Sitzungsoberflächen erreichen, einschließlich `input_tokens` / `output_tokens`
und `prompt_tokens` / `completion_tokens`.

## Fehler

Fehler verwenden ein JSON-Objekt wie:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Häufige Fälle:

- `401` fehlende/ungültige Authentifizierung
- `400` ungültiger Anfragebody
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

Streamend:

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

- [OpenAI Chat Completions](/de/gateway/openai-http-api)
- [OpenAI](/de/providers/openai)
