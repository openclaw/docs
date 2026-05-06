---
read_when:
    - Clients integrieren, die die OpenResponses API unterstützen
    - Sie möchten itembasierte Eingaben, Client-Tool-Aufrufe oder SSE-Ereignisse
summary: OpenResponses-kompatiblen /v1/responses-HTTP-Endpunkt über den Gateway bereitstellen
title: OpenResponses-API
x-i18n:
    generated_at: "2026-05-06T06:49:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69d46dc448a8856a6f3213f2fbfdba000a342ec4dcf258435b7029102cfb8119
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw's Gateway kann einen OpenResponses-kompatiblen `POST /v1/responses`-Endpoint bereitstellen.

Dieser Endpoint ist **standardmäßig deaktiviert**. Aktivieren Sie ihn zuerst in der Konfiguration.

- `POST /v1/responses`
- Derselbe Port wie der Gateway (WS + HTTP-Multiplex): `http://<gateway-host>:<port>/v1/responses`

Im Hintergrund werden Anfragen als normaler Gateway-Agent-Lauf ausgeführt (derselbe Codepfad wie
`openclaw agent`), sodass Routing/Berechtigungen/Konfiguration Ihrem Gateway entsprechen.

## Authentifizierung, Sicherheit und Routing

Das Betriebsverhalten entspricht [OpenAI Chat Completions](/de/gateway/openai-http-api):

- verwenden Sie den passenden Gateway-HTTP-Authentifizierungspfad:
  - Shared-Secret-Authentifizierung (`gateway.auth.mode="token"` oder `"password"`): `Authorization: Bearer <token-or-password>`
  - Trusted-Proxy-Authentifizierung (`gateway.auth.mode="trusted-proxy"`): identitätsbewusste Proxy-Header aus einer konfigurierten vertrauenswürdigen Proxy-Quelle; local loopback-Proxys auf demselben Host erfordern explizit `gateway.auth.trustedProxy.allowLoopback = true`
  - offene Private-Ingress-Authentifizierung (`gateway.auth.mode="none"`): kein Authentifizierungs-Header
- behandeln Sie den Endpoint als vollständigen Operator-Zugriff für die Gateway-Instanz
- ignorieren Sie für Shared-Secret-Authentifizierungsmodi (`token` und `password`) enger gefasste, vom Bearer deklarierte `x-openclaw-scopes`-Werte und stellen Sie die normalen vollständigen Operator-Standardwerte wieder her
- berücksichtigen Sie für vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel Trusted-Proxy-Authentifizierung oder `gateway.auth.mode="none"`) `x-openclaw-scopes`, wenn vorhanden, und fallen Sie andernfalls auf den normalen Operator-Standardumfang zurück
- wählen Sie Agents mit `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` oder `x-openclaw-agent-id` aus
- verwenden Sie `x-openclaw-model`, wenn Sie das Backend-Modell des ausgewählten Agents überschreiben möchten
- verwenden Sie `x-openclaw-session-key` für explizites Sitzungs-Routing
- verwenden Sie `x-openclaw-message-channel`, wenn Sie einen nicht standardmäßigen synthetischen Ingress-Kanalkontext möchten

Authentifizierungsmatrix:

- `gateway.auth.mode="token"` oder `"password"` + `Authorization: Bearer ...`
  - weist den Besitz des gemeinsamen Gateway-Operator-Geheimnisses nach
  - ignoriert enger gefasste `x-openclaw-scopes`
  - stellt den vollständigen Standard-Operator-Umfang wieder her:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt Chat-Turns auf diesem Endpoint als Owner-Sender-Turns
- vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel Trusted-Proxy-Authentifizierung oder `gateway.auth.mode="none"` bei privatem Ingress)
  - berücksichtigen `x-openclaw-scopes`, wenn der Header vorhanden ist
  - fallen auf den normalen Operator-Standardumfang zurück, wenn der Header fehlt
  - verlieren Owner-Semantik nur dann, wenn der Aufrufer Scopes explizit einschränkt und `operator.admin` weglässt

Aktivieren oder deaktivieren Sie diesen Endpoint mit `gateway.http.endpoints.responses.enabled`.

Dieselbe Kompatibilitätsoberfläche umfasst außerdem:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Die kanonische Erklärung dazu, wie Agent-Zielmodelle, `openclaw/default`, Embeddings-Passthrough und Backend-Modellüberschreibungen zusammenpassen, finden Sie unter [OpenAI Chat Completions](/de/gateway/openai-http-api#agent-first-model-contract) und [Modellliste und Agent-Routing](/de/gateway/openai-http-api#model-list-and-agent-routing).

## Sitzungsverhalten

Standardmäßig ist der Endpoint **pro Anfrage zustandslos** (bei jedem Aufruf wird ein neuer Sitzungsschlüssel erzeugt).

Wenn die Anfrage eine OpenResponses-`user`-Zeichenfolge enthält, leitet der Gateway daraus einen stabilen Sitzungsschlüssel ab, sodass wiederholte Aufrufe eine Agent-Sitzung gemeinsam nutzen können.

## Anfrageform (unterstützt)

Die Anfrage folgt der OpenResponses API mit elementbasierter Eingabe. Aktuelle Unterstützung:

- `input`: Zeichenfolge oder Array von Elementobjekten.
- `instructions`: wird in den System-Prompt zusammengeführt.
- `tools`: Client-Tool-Definitionen (Function Tools).
- `tool_choice`: Client-Tools filtern oder verlangen.
- `stream`: aktiviert SSE-Streaming.
- `max_output_tokens`: Best-Effort-Ausgabelimit (Provider-abhängig).
- `user`: stabiles Sitzungs-Routing.

Akzeptiert, aber **derzeit ignoriert**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Unterstützt:

- `previous_response_id`: OpenClaw verwendet die frühere Antwortsitzung wieder, wenn die Anfrage im selben Agent-/Benutzer-/angeforderten Sitzungsumfang bleibt.

## Elemente (Eingabe)

### `message`

Rollen: `system`, `developer`, `user`, `assistant`.

- `system` und `developer` werden an den System-Prompt angehängt.
- Das neueste `user`- oder `function_call_output`-Element wird zur „aktuellen Nachricht“.
- Frühere Benutzer-/Assistant-Nachrichten werden als Verlauf für den Kontext einbezogen.

### `function_call_output` (Turn-basierte Tools)

Senden Sie Tool-Ergebnisse zurück an das Modell:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` und `item_reference`

Werden für Schemakompatibilität akzeptiert, aber beim Erstellen des Prompts ignoriert.

## Tools (clientseitige Function Tools)

Stellen Sie Tools mit `tools: [{ type: "function", function: { name, description?, parameters? } }]` bereit.

Wenn der Agent entscheidet, ein Tool aufzurufen, gibt die Antwort ein `function_call`-Ausgabeelement zurück.
Anschließend senden Sie eine Folgeanfrage mit `function_call_output`, um den Turn fortzusetzen.

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
  sodass sie flüchtig bleiben (nicht im Sitzungsverlauf persistiert).
- Dekodierter Dateitext wird als **nicht vertrauenswürdiger externer Inhalt** umschlossen, bevor er hinzugefügt wird,
  sodass Datei-Bytes als Daten behandelt werden, nicht als vertrauenswürdige Anweisungen.
- Der eingefügte Block verwendet explizite Begrenzungsmarker wie
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` und enthält eine
  `Source: External`-Metadatenzeile.
- Dieser Dateieingabepfad lässt das lange `SECURITY NOTICE:`-Banner absichtlich weg, um
  Prompt-Budget zu sparen; die Begrenzungsmarker und Metadaten bleiben dennoch erhalten.
- PDFs werden zuerst auf Text geparst. Wenn wenig Text gefunden wird, werden die ersten Seiten
  in Bilder gerastert und an das Modell übergeben, und der eingefügte Dateiblock verwendet
  den Platzhalter `[PDF content rendered to images]`.

PDF-Parsing wird durch das gebündelte `document-extract`-Plugin bereitgestellt, das den
Node-freundlichen Legacy-Build von `pdfjs-dist` verwendet (kein Worker). Der moderne PDF.js-Build
erwartet Browser-Worker/DOM-Globals, daher wird er im Gateway nicht verwendet.

URL-Abruf-Standards:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (gesamte URL-basierte `input_file`- + `input_image`-Teile pro Anfrage)
- Anfragen werden geschützt (DNS-Auflösung, Blockieren privater IPs, Redirect-Obergrenzen, Timeouts).
- Optionale Hostname-Allowlists werden pro Eingabetyp unterstützt (`files.urlAllowlist`, `images.urlAllowlist`).
  - Exakter Host: `"cdn.example.com"`
  - Wildcard-Subdomains: `"*.assets.example.com"` (passt nicht auf Apex)
  - Leere oder ausgelassene Allowlists bedeuten keine Hostname-Allowlist-Einschränkung.
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
- HEIC/HEIF-`input_image`-Quellen werden akzeptiert und vor der Provider-Übermittlung zu JPEG normalisiert.

Sicherheitshinweis:

- URL-Allowlists werden vor dem Abruf und bei Redirect-Sprüngen durchgesetzt.
- Das Allowlisting eines Hostnamens umgeht nicht das Blockieren privater/interner IPs.
- Für internetexponierte Gateways sollten Sie zusätzlich zu Schutzmechanismen auf Anwendungsebene Netzwerk-Egress-Kontrollen anwenden.
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

`usage` wird befüllt, wenn der zugrunde liegende Provider Token-Zählungen meldet.
OpenClaw normalisiert gängige Aliasnamen im OpenAI-Stil, bevor diese Zähler nachgelagerte
Status-/Sitzungsoberflächen erreichen, darunter `input_tokens` / `output_tokens`
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

Nicht-streaming:

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

- [OpenAI Chat Completions](/de/gateway/openai-http-api)
- [OpenAI](/de/providers/openai)
