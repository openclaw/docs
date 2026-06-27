---
read_when:
    - Clients integreren die de OpenResponses API spreken
    - Je wilt invoer op basis van items, clienttoolaanroepen of SSE-gebeurtenissen
summary: Stel een met OpenResponses compatibel HTTP-eindpunt /v1/responses beschikbaar vanuit de Gateway
title: OpenResponses API
x-i18n:
    generated_at: "2026-06-27T17:35:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbc41a14f5c585a0fb0aae96fb3d2376f94cdb77f41bcd7cc5e7998a27673c44
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw's Gateway kan een OpenResponses-compatibel `POST /v1/responses`-eindpunt aanbieden.

Dit eindpunt is **standaard uitgeschakeld**. Schakel het eerst in de configuratie in.

- `POST /v1/responses`
- Dezelfde poort als de Gateway (WS + HTTP-multiplex): `http://<gateway-host>:<port>/v1/responses`

Onder de motorkap worden verzoeken uitgevoerd als een normale Gateway-agentrun (dezelfde codepath als
`openclaw agent`), dus routing/machtigingen/configuratie komen overeen met je Gateway.

## Authenticatie, beveiliging en routing

Operationeel gedrag komt overeen met [OpenAI Chat Completions](/nl/gateway/openai-http-api):

- gebruik het overeenkomende Gateway HTTP-authenticatiepad:
  - shared-secret-authenticatie (`gateway.auth.mode="token"` of `"password"`): `Authorization: Bearer <token-or-password>`
  - trusted-proxy-authenticatie (`gateway.auth.mode="trusted-proxy"`): identiteitsbewuste proxyheaders van een geconfigureerde vertrouwde proxybron; same-host loopback-proxy's vereisen expliciet `gateway.auth.trustedProxy.allowLoopback = true`
  - trusted-proxy lokale directe fallback: same-host aanroepers zonder `Forwarded`-, `X-Forwarded-*`- of `X-Real-IP`-headers kunnen `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` gebruiken
  - private-ingress open authenticatie (`gateway.auth.mode="none"`): geen auth-header
- behandel het eindpunt als volledige operatortoegang voor de gateway-instantie
- negeer voor shared-secret-authenticatiemodi (`token` en `password`) smallere bearer-gedeclareerde `x-openclaw-scopes`-waarden en herstel de normale volledige operatorstandaarden
- respecteer voor vertrouwde identiteitsdragende HTTP-modi (bijvoorbeeld trusted-proxy-authenticatie of `gateway.auth.mode="none"`) `x-openclaw-scopes` wanneer aanwezig en val anders terug op de normale standaardset operatorscopes
- selecteer agents met `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` of `x-openclaw-agent-id`
- gebruik `x-openclaw-model` wanneer je het backendmodel van de geselecteerde agent wilt overschrijven
- gebruik `x-openclaw-session-key` voor expliciete sessierouting
- gebruik `x-openclaw-message-channel` wanneer je een niet-standaard synthetische ingress-kanaalcontext wilt

Auth-matrix:

- `gateway.auth.mode="token"` of `"password"` + `Authorization: Bearer ...`
  - bewijst bezit van het gedeelde operatorgeheim van de gateway
  - negeert smallere `x-openclaw-scopes`
  - herstelt de volledige standaardset operatorscopes:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt chatbeurten op dit eindpunt als beurten van de eigenaar-afzender
- vertrouwde identiteitsdragende HTTP-modi (bijvoorbeeld trusted-proxy-authenticatie, of `gateway.auth.mode="none"` op private ingress)
  - respecteren `x-openclaw-scopes` wanneer de header aanwezig is
  - vallen terug op de normale standaardset operatorscopes wanneer de header ontbreekt
  - verliezen alleen eigenaarssemantiek wanneer de aanroeper scopes expliciet vernauwt en `operator.admin` weglaat

Schakel dit eindpunt in of uit met `gateway.http.endpoints.responses.enabled`.

Hetzelfde compatibiliteitsoppervlak bevat ook:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Zie voor de canonieke uitleg over hoe agentgerichte modellen, `openclaw/default`, embeddings-pass-through en backendmodeloverschrijvingen samenhangen [OpenAI Chat Completions](/nl/gateway/openai-http-api#agent-first-model-contract) en [Modellijst en agentrouting](/nl/gateway/openai-http-api#model-list-and-agent-routing).

## Sessgedrag

Standaard is het eindpunt **stateless per verzoek** (bij elke aanroep wordt een nieuwe sessiesleutel gegenereerd).

Als het verzoek een OpenResponses-`user`-tekenreeks bevat, leidt de Gateway daaruit een stabiele sessiesleutel af,
zodat herhaalde aanroepen een agentsessie kunnen delen.

## Verzoekvorm (ondersteund)

Het verzoek volgt de OpenResponses-API met itemgebaseerde invoer. Huidige ondersteuning:

- `input`: tekenreeks of array van itemobjecten.
- `instructions`: samengevoegd in de systeemprompt.
- `tools`: clienttooldefinities (functietools).
- `tool_choice`: `"auto"`, `"none"`, `"required"` of `{ "type": "function", "name": "..." }` om clienttools te filteren of te vereisen.
- `stream`: schakelt SSE-streaming in.
- `max_output_tokens`: best-effort uitvoerlimiet (providerafhankelijk).
- `temperature`: best-effort samplingtemperatuur doorgestuurd naar de provider. Genegeerd door de op ChatGPT gebaseerde Codex Responses-backend, die vaste server-side sampling gebruikt.
- `top_p`: best-effort nucleus-sampling doorgestuurd naar de provider. Dezelfde Codex Responses-kanttekening als bij `temperature`.
- `user`: stabiele sessierouting.

Geaccepteerd maar **momenteel genegeerd**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Ondersteund:

- `previous_response_id`: OpenClaw hergebruikt de eerdere responsesessie wanneer het verzoek binnen dezelfde agent-/gebruiker-/aangevraagde-sessiescope blijft.

## Items (invoer)

### `message`

Rollen: `system`, `developer`, `user`, `assistant`.

- `system` en `developer` worden toegevoegd aan de systeemprompt.
- Het meest recente `user`- of `function_call_output`-item wordt het "huidige bericht."
- Eerdere gebruikers-/assistentberichten worden als geschiedenis opgenomen voor context.

### `function_call_output` (turn-based tools)

Stuur toolresultaten terug naar het model:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` en `item_reference`

Geaccepteerd voor schemacompatibiliteit maar genegeerd bij het opbouwen van de prompt.

## Tools (client-side functietools)

Lever tools aan met `tools: [{ type: "function", name, description?, parameters? }]`.

Als de agent besluit een tool aan te roepen, retourneert de response een `function_call`-uitvoeritem.
Je stuurt daarna een vervolgverzoek met `function_call_output` om de beurt voort te zetten.

Voor `tool_choice: "required"` en functie-vastgezette `tool_choice` vernauwt het eindpunt de blootgestelde set clientfunctietools, instrueert het de runtime om een clienttool aan te roepen voordat er wordt geantwoord, en wijst het de beurt af als deze geen overeenkomende gestructureerde clienttoolaanroep bevat. Dit contract geldt voor de door de aanroeper aangeleverde HTTP-`tools`-lijst, niet voor elke interne OpenClaw-agenttool. Niet-streaming verzoeken retourneren `502` met een `api_error`; streamingverzoeken zenden een `response.failed`-event uit. Dit komt overeen met het `/v1/chat/completions`-contract.

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
  zodat deze vluchtig blijft (niet persistent in de sessiegeschiedenis).
- Gedecodeerde bestandstekst wordt verpakt als **niet-vertrouwde externe inhoud** voordat deze wordt toegevoegd,
  zodat bestandsbytes als data worden behandeld, niet als vertrouwde instructies.
- Het geïnjecteerde blok gebruikt expliciete grensmarkeringen zoals
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` en bevat een
  `Source: External`-metadataregel.
- Dit bestandsinvoerpad laat bewust de lange `SECURITY NOTICE:`-banner weg om
  promptbudget te behouden; de grensmarkeringen en metadata blijven wel aanwezig.
- PDF's worden eerst op tekst geparsed. Als er weinig tekst wordt gevonden, worden de eerste pagina's
  gerasterd naar afbeeldingen en aan het model doorgegeven, en gebruikt het geïnjecteerde bestandsblok
  de placeholder `[PDF content rendered to images]`.

PDF-parsing wordt geleverd door de gebundelde `document-extract`-Plugin, die
`clawpdf` en de meegeleverde PDFium WebAssembly-runtime gebruikt voor tekstextractie en
paginaweergave.

Standaarden voor URL-ophalen:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (totaal aantal URL-gebaseerde `input_file` + `input_image`-onderdelen per verzoek)
- Verzoeken worden bewaakt (DNS-resolutie, blokkering van private IP's, redirectlimieten, time-outs).
- Optionele hostnaam-allowlists worden per invoertype ondersteund (`files.urlAllowlist`, `images.urlAllowlist`).
  - Exacte host: `"cdn.example.com"`
  - Wildcard-subdomeinen: `"*.assets.example.com"` (matcht de apex niet)
  - Lege of weggelaten allowlists betekenen geen hostnaam-allowlistbeperking.
- Stel `files.allowUrl: false` en/of `images.allowUrl: false` in om URL-gebaseerd ophalen volledig uit te schakelen.

## Limieten voor bestanden + afbeeldingen (configuratie)

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
- HEIC/HEIF-`input_image`-bronnen worden geaccepteerd wanneer een systeemconverter beschikbaar is en worden genormaliseerd naar JPEG voordat ze aan de provider worden geleverd. Ondersteunde converters zijn macOS `sips`, ImageMagick, GraphicsMagick of ffmpeg.

Beveiligingsopmerking:

- URL-allowlists worden afgedwongen vóór het ophalen en bij redirect-hops.
- Het allowlisten van een hostnaam omzeilt blokkering van private/interne IP's niet.
- Pas voor internetblootgestelde gateways netwerk-egresscontroles toe naast app-niveau bewaking.
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
OpenClaw normaliseert veelvoorkomende OpenAI-achtige aliassen voordat die tellers
downstream status-/sessieoppervlakken bereiken, waaronder `input_tokens` / `output_tokens`
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
