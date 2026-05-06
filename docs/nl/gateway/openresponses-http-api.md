---
read_when:
    - Clients integreren die de OpenResponses API ondersteunen
    - Je wilt op items gebaseerde invoer, aanroepen van clienttools of SSE-gebeurtenissen
summary: Stel vanuit de Gateway een OpenResponses-compatibel HTTP-eindpunt /v1/responses beschikbaar
title: OpenResponses-API
x-i18n:
    generated_at: "2026-05-06T09:14:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69d46dc448a8856a6f3213f2fbfdba000a342ec4dcf258435b7029102cfb8119
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw's Gateway kan een OpenResponses-compatibel `POST /v1/responses`-endpoint aanbieden.

Dit endpoint is **standaard uitgeschakeld**. Schakel het eerst in de configuratie in.

- `POST /v1/responses`
- Dezelfde poort als de Gateway (WS + HTTP-multiplex): `http://<gateway-host>:<port>/v1/responses`

Onder de motorkap worden verzoeken uitgevoerd als een normale Gateway-agentrun (hetzelfde codepad als
`openclaw agent`), zodat routing/machtigingen/configuratie overeenkomen met je Gateway.

## Authenticatie, beveiliging en routing

Operationeel gedrag komt overeen met [OpenAI Chat Completions](/nl/gateway/openai-http-api):

- gebruik het overeenkomende HTTP-authenticatiepad van de Gateway:
  - authenticatie met gedeeld geheim (`gateway.auth.mode="token"` of `"password"`): `Authorization: Bearer <token-or-password>`
  - authenticatie met vertrouwde proxy (`gateway.auth.mode="trusted-proxy"`): identiteitsbewuste proxyheaders van een geconfigureerde vertrouwde proxybron; same-host loopback-proxy's vereisen expliciet `gateway.auth.trustedProxy.allowLoopback = true`
  - open authenticatie voor private ingress (`gateway.auth.mode="none"`): geen auth-header
- behandel het endpoint als volledige operator-toegang voor de gateway-instantie
- negeer voor authenticatiemodi met gedeeld geheim (`token` en `password`) smallere bearer-opgegeven `x-openclaw-scopes`-waarden en herstel de normale volledige operator-standaarden
- respecteer voor vertrouwde HTTP-modi met identiteit (bijvoorbeeld authenticatie met vertrouwde proxy of `gateway.auth.mode="none"`) `x-openclaw-scopes` wanneer aanwezig en val anders terug op de normale standaardset operatorscopes
- selecteer agents met `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"`, of `x-openclaw-agent-id`
- gebruik `x-openclaw-model` wanneer je het backendmodel van de geselecteerde agent wilt overschrijven
- gebruik `x-openclaw-session-key` voor expliciete sessierouting
- gebruik `x-openclaw-message-channel` wanneer je een niet-standaard synthetische ingress-kanaalcontext wilt

Auth-matrix:

- `gateway.auth.mode="token"` of `"password"` + `Authorization: Bearer ...`
  - bewijst bezit van het gedeelde gateway-operatorgeheim
  - negeert smallere `x-openclaw-scopes`
  - herstelt de volledige standaardset operatorscopes:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt chatbeurten op dit endpoint als beurten van eigenaar-afzender
- vertrouwde HTTP-modi met identiteit (bijvoorbeeld authenticatie met vertrouwde proxy, of `gateway.auth.mode="none"` op private ingress)
  - respecteren `x-openclaw-scopes` wanneer de header aanwezig is
  - vallen terug op de normale standaardset operatorscopes wanneer de header afwezig is
  - verliezen alleen eigenaarsemantiek wanneer de aanroeper scopes expliciet beperkt en `operator.admin` weglaat

Schakel dit endpoint in of uit met `gateway.http.endpoints.responses.enabled`.

Hetzelfde compatibiliteitsoppervlak bevat ook:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Zie [OpenAI Chat Completions](/nl/gateway/openai-http-api#agent-first-model-contract) en [Modellijst en agentrouting](/nl/gateway/openai-http-api#model-list-and-agent-routing) voor de canonieke uitleg over hoe agentdoelmodellen, `openclaw/default`, embeddings-doorvoer en overschrijvingen van backendmodellen samenhangen.

## Sessiebegedrag

Standaard is het endpoint **statusloos per verzoek** (bij elke aanroep wordt een nieuwe sessiesleutel gegenereerd).

Als het verzoek een OpenResponses-`user`-string bevat, leidt de Gateway daaruit een stabiele sessiesleutel af,
zodat herhaalde aanroepen een agentsessie kunnen delen.

## Verzoekvorm (ondersteund)

Het verzoek volgt de OpenResponses-API met itemgebaseerde invoer. Huidige ondersteuning:

- `input`: string of array van itemobjecten.
- `instructions`: samengevoegd in de systeemprompt.
- `tools`: clienttooldefinities (function tools).
- `tool_choice`: filtert of vereist clienttools.
- `stream`: schakelt SSE-streaming in.
- `max_output_tokens`: best-effort uitvoerlimiet (providerafhankelijk).
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

## Tools (clientzijdige functietools)

Lever tools aan met `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Als de agent besluit een tool aan te roepen, retourneert de response een `function_call`-uitvoeritem.
Daarna stuur je een vervolgverzoek met `function_call_output` om de beurt voort te zetten.

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
  zodat deze vluchtig blijft (niet opgeslagen in de sessiegeschiedenis).
- Gedecodeerde bestandstekst wordt verpakt als **niet-vertrouwde externe inhoud** voordat deze wordt toegevoegd,
  zodat bestandsbytes als data worden behandeld, niet als vertrouwde instructies.
- Het geinjecteerde blok gebruikt expliciete grensmarkeringen zoals
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` en bevat een
  `Source: External`-metadataregel.
- Dit bestandsinvoerpad laat de lange `SECURITY NOTICE:`-banner bewust weg om
  promptbudget te behouden; de grensmarkeringen en metadata blijven wel aanwezig.
- PDF's worden eerst geparsed op tekst. Als er weinig tekst wordt gevonden, worden de eerste pagina's
  gerasterd naar afbeeldingen en doorgegeven aan het model, en gebruikt het geinjecteerde bestandsblok
  de placeholder `[PDF content rendered to images]`.

PDF-parsing wordt geleverd door de gebundelde `document-extract`-Plugin, die de
Node-vriendelijke legacybuild van `pdfjs-dist` gebruikt (geen worker). De moderne PDF.js-build
verwacht browserworkers/DOM-globals, dus die wordt niet gebruikt in de Gateway.

Standaarden voor URL-fetch:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (totaal aantal URL-gebaseerde `input_file` + `input_image`-delen per verzoek)
- Verzoeken worden bewaakt (DNS-resolutie, blokkering van private IP's, redirectlimieten, time-outs).
- Optionele allowlists voor hostnamen worden per invoertype ondersteund (`files.urlAllowlist`, `images.urlAllowlist`).
  - Exacte host: `"cdn.example.com"`
  - Wildcard-subdomeinen: `"*.assets.example.com"` (komt niet overeen met apex)
  - Lege of weggelaten allowlists betekenen geen allowlistbeperking voor hostnamen.
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
- HEIC/HEIF-`input_image`-bronnen worden geaccepteerd en genormaliseerd naar JPEG voordat ze aan de provider worden geleverd.

Beveiligingsopmerking:

- URL-allowlists worden afgedwongen voor fetch en bij redirect-hops.
- Het allowlisten van een hostnaam omzeilt blokkering van private/interne IP's niet.
- Pas voor gateways die aan internet zijn blootgesteld netwerk-egresscontroles toe naast app-level beveiligingen.
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

`usage` wordt ingevuld wanneer de onderliggende provider tokentellingen rapporteert.
OpenClaw normaliseert veelvoorkomende OpenAI-stijl aliassen voordat die tellers
downstream status-/sessieoppervlakken bereiken, waaronder `input_tokens` / `output_tokens`
en `prompt_tokens` / `completion_tokens`.

## Fouten

Fouten gebruiken een JSON-object zoals:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Veelvoorkomende gevallen:

- `401` ontbrekende/ongeldige auth
- `400` ongeldige requestbody
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

- [OpenAI-chatcompletions](/nl/gateway/openai-http-api)
- [OpenAI](/nl/providers/openai)
