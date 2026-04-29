---
read_when:
    - Clients integreren die de OpenResponses API ondersteunen
    - Je wilt itemgebaseerde invoer, client-toolaanroepen of SSE-gebeurtenissen
summary: Maak een OpenResponses-compatibel /v1/responses-HTTP-eindpunt beschikbaar vanuit de Gateway
title: OpenResponses-API
x-i18n:
    generated_at: "2026-04-29T22:46:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1cfba4c2572fab2d2ef6bceecd1ae0a022850c46125c62d5a5f3969d07d03aff
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw’s Gateway kan een OpenResponses-compatibel `POST /v1/responses`-endpoint aanbieden.

Dit endpoint is **standaard uitgeschakeld**. Schakel het eerst in de configuratie in.

- `POST /v1/responses`
- Dezelfde poort als de Gateway (WS + HTTP-multiplex): `http://<gateway-host>:<port>/v1/responses`

Onder de motorkap worden verzoeken uitgevoerd als een normale Gateway-agent-run (hetzelfde codepad als
`openclaw agent`), zodat routering/rechten/configuratie overeenkomen met je Gateway.

## Authenticatie, beveiliging en routering

Operationeel gedrag komt overeen met [OpenAI-chatvoltooiingen](/nl/gateway/openai-http-api):

- gebruik het overeenkomende Gateway HTTP-authenticatiepad:
  - shared-secret-authenticatie (`gateway.auth.mode="token"` of `"password"`): `Authorization: Bearer <token-or-password>`
  - trusted-proxy-authenticatie (`gateway.auth.mode="trusted-proxy"`): identiteitsbewuste proxyheaders van een geconfigureerde vertrouwde proxybron; local loopback-proxy's op dezelfde host vereisen expliciet `gateway.auth.trustedProxy.allowLoopback = true`
  - open authenticatie voor private ingress (`gateway.auth.mode="none"`): geen auth-header
- behandel het endpoint als volledige operatortoegang voor de gateway-instantie
- negeer voor shared-secret-authenticatiemodi (`token` en `password`) nauwere door bearer gedeclareerde `x-openclaw-scopes`-waarden en herstel de normale standaardinstellingen voor volledige operatorrechten
- honoreer voor vertrouwde identiteitsdragende HTTP-modi (bijvoorbeeld trusted-proxy-authenticatie of `gateway.auth.mode="none"`) `x-openclaw-scopes` wanneer aanwezig en val anders terug op de normale standaardset operatorscopes
- selecteer agents met `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"`, of `x-openclaw-agent-id`
- gebruik `x-openclaw-model` wanneer je het backendmodel van de geselecteerde agent wilt overschrijven
- gebruik `x-openclaw-session-key` voor expliciete sessieroutering
- gebruik `x-openclaw-message-channel` wanneer je een niet-standaard synthetische ingresskanaalcontext wilt

Auth-matrix:

- `gateway.auth.mode="token"` of `"password"` + `Authorization: Bearer ...`
  - bewijst bezit van het gedeelde gateway-operatorgeheim
  - negeert nauwere `x-openclaw-scopes`
  - herstelt de volledige standaardset operatorscopes:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt chatbeurten op dit endpoint als owner-sender-beurten
- vertrouwde identiteitsdragende HTTP-modi (bijvoorbeeld trusted-proxy-authenticatie, of `gateway.auth.mode="none"` op private ingress)
  - honoreren `x-openclaw-scopes` wanneer de header aanwezig is
  - vallen terug op de normale standaardset operatorscopes wanneer de header ontbreekt
  - verliezen owner-semantiek alleen wanneer de caller expliciet scopes vernauwt en `operator.admin` weglaat

Schakel dit endpoint in of uit met `gateway.http.endpoints.responses.enabled`.

Hetzelfde compatibiliteitsoppervlak bevat ook:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Zie [OpenAI-chatvoltooiingen](/nl/gateway/openai-http-api#agent-first-model-contract) en [Modellijst en agentroutering](/nl/gateway/openai-http-api#model-list-and-agent-routing) voor de canonieke uitleg van hoe agentgerichte modellen, `openclaw/default`, embeddings-pass-through en overschrijvingen van backendmodellen samenhangen.

## Sessergedrag

Standaard is het endpoint **stateless per verzoek** (elke aanroep genereert een nieuwe sessiesleutel).

Als het verzoek een OpenResponses `user`-string bevat, leidt de Gateway daaruit een stabiele sessiesleutel af,
zodat herhaalde aanroepen een agentsessie kunnen delen.

## Verzoekvorm (ondersteund)

Het verzoek volgt de OpenResponses API met itemgebaseerde invoer. Huidige ondersteuning:

- `input`: string of array van itemobjecten.
- `instructions`: samengevoegd in de systeemprompt.
- `tools`: tooldefinities van de client (functietools).
- `tool_choice`: clienttools filteren of vereisen.
- `stream`: schakelt SSE-streaming in.
- `max_output_tokens`: best-effort uitvoerlimiet (providerafhankelijk).
- `user`: stabiele sessieroutering.

Geaccepteerd maar **momenteel genegeerd**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Ondersteund:

- `previous_response_id`: OpenClaw hergebruikt de eerdere responsesessie wanneer het verzoek binnen dezelfde agent-/user-/aangevraagde-sessiescope blijft.

## Items (invoer)

### `message`

Rollen: `system`, `developer`, `user`, `assistant`.

- `system` en `developer` worden toegevoegd aan de systeemprompt.
- Het meest recente `user`- of `function_call_output`-item wordt het “huidige bericht.”
- Eerdere user-/assistant-berichten worden als geschiedenis opgenomen voor context.

### `function_call_output` (beurtgebaseerde tools)

Stuur toolresultaten terug naar het model:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` en `item_reference`

Geaccepteerd voor schemacompatibiliteit, maar genegeerd bij het bouwen van de prompt.

## Tools (client-side functietools)

Lever tools aan met `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Als de agent besluit een tool aan te roepen, retourneert de response een `function_call`-uitvoeritem.
Vervolgens stuur je een vervolgverzoek met `function_call_output` om de beurt voort te zetten.

## Afbeeldingen (`input_image`)

Ondersteunt base64- of URL-bronnen:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Toegestane MIME-typen (huidig): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Maximale grootte (huidig): 10MB.

## Bestanden (`input_file`)

Ondersteunt base64- of URL-bronnen:

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

Toegestane MIME-typen (huidig): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Maximale grootte (huidig): 5MB.

Huidig gedrag:

- Bestandsinhoud wordt gedecodeerd en toegevoegd aan de **systeemprompt**, niet aan het gebruikersbericht,
  zodat deze tijdelijk blijft (niet opgeslagen in de sessiegeschiedenis).
- Gedecodeerde bestandstekst wordt verpakt als **niet-vertrouwde externe inhoud** voordat deze wordt toegevoegd,
  zodat bestandsbytes als data worden behandeld, niet als vertrouwde instructies.
- Het geïnjecteerde blok gebruikt expliciete grensmarkeringen zoals
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` en bevat een
  `Source: External`-metadataregel.
- Dit bestandinvoerpad laat bewust de lange `SECURITY NOTICE:`-banner weg om
  promptbudget te behouden; de grensmarkeringen en metadata blijven wel aanwezig.
- PDF's worden eerst op tekst geparset. Als er weinig tekst wordt gevonden, worden de eerste pagina's
  gerasterd naar afbeeldingen en aan het model doorgegeven, en gebruikt het geïnjecteerde bestandsblok
  de placeholder `[PDF content rendered to images]`.

PDF-parsing wordt geleverd door de gebundelde `document-extract`-plugin, die de
Node-vriendelijke legacy-build van `pdfjs-dist` gebruikt (geen worker). De moderne PDF.js-build
verwacht browserworkers/DOM-globals en wordt daarom niet gebruikt in de Gateway.

URL-fetch-standaarden:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (totaal aantal URL-gebaseerde `input_file` + `input_image`-onderdelen per verzoek)
- Verzoeken worden afgeschermd (DNS-resolutie, blokkering van private IP's, redirectlimieten, time-outs).
- Optionele hostnaam-allowlists worden per invoertype ondersteund (`files.urlAllowlist`, `images.urlAllowlist`).
  - Exacte host: `"cdn.example.com"`
  - Wildcard-subdomeinen: `"*.assets.example.com"` (matcht de apex niet)
  - Lege of weggelaten allowlists betekenen geen hostnaam-allowlistbeperking.
- Stel `files.allowUrl: false` en/of `images.allowUrl: false` in om URL-gebaseerde fetches volledig uit te schakelen.

## Limieten voor bestanden + afbeeldingen (config)

Standaarden kunnen worden aangepast onder `gateway.http.endpoints.responses`:

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

Standaarden wanneer weggelaten:

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
- HEIC/HEIF `input_image`-bronnen worden geaccepteerd en vóór levering aan de provider genormaliseerd naar JPEG.

Beveiligingsopmerking:

- URL-allowlists worden afgedwongen vóór fetch en bij redirect-hops.
- Het allowlisten van een hostnaam omzeilt de blokkering van private/interne IP's niet.
- Pas voor gateways die aan internet zijn blootgesteld netwerk-egresscontroles toe naast guards op applicatieniveau.
  Zie [Beveiliging](/nl/gateway/security).

## Streaming (SSE)

Stel `stream: true` in om Server-Sent Events (SSE) te ontvangen:

- `Content-Type: text/event-stream`
- Elke eventregel is `event: <type>` en `data: <json>`
- Stream eindigt met `data: [DONE]`

Eventtypen die momenteel worden uitgezonden:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (bij fout)

## Gebruik

`usage` wordt gevuld wanneer de onderliggende provider tokenaantallen rapporteert.
OpenClaw normaliseert gangbare OpenAI-achtige aliassen voordat die tellers
downstream status-/sessieoppervlakken bereiken, inclusief `input_tokens` / `output_tokens`
en `prompt_tokens` / `completion_tokens`.

## Fouten

Fouten gebruiken een JSON-object zoals:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Veelvoorkomende gevallen:

- `401` ontbrekende/ongeldige authenticatie
- `400` ongeldige request body
- `405` verkeerde methode

## Voorbeelden

Niet-streaming:

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

## Gerelateerd

- [OpenAI-chatvoltooiingen](/nl/gateway/openai-http-api)
- [OpenAI](/nl/providers/openai)
