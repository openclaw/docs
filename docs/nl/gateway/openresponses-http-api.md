---
read_when:
    - Clients integreren die de OpenResponses-API gebruiken
    - U wilt invoer op basis van items, toolaanroepen van de client of SSE-gebeurtenissen
summary: Stel vanuit de Gateway een met OpenResponses compatibel HTTP-eindpunt /v1/responses beschikbaar
title: OpenResponses-API
x-i18n:
    generated_at: "2026-07-12T08:55:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fcf5016d1455383181923ec31b26cf31533b990045df300f0356f135c95579
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

De Gateway kan een met OpenResponses compatibel `POST /v1/responses`-eindpunt aanbieden. Dit is **standaard uitgeschakeld** en deelt zijn poort met de Gateway (WS + HTTP-multiplexing): `http://<gateway-host>:<port>/v1/responses`.

Aanvragen worden uitgevoerd als een normale Gateway-agentuitvoering (hetzelfde codepad als `openclaw agent`), zodat routering, machtigingen en configuratie overeenkomen met die van uw Gateway.

Schakel dit in of uit met `gateway.http.endpoints.responses.enabled`. Wanneer dit is ingeschakeld, biedt hetzelfde compatibiliteitsoppervlak ook `GET /v1/models`, `GET /v1/models/{id}`, `POST /v1/embeddings` en `POST /v1/chat/completions`.

## Authenticatie, beveiliging en routering

Het operationele gedrag komt overeen met [OpenAI Chat Completions](/nl/gateway/openai-http-api):

- Het authenticatiepad komt overeen met `gateway.auth.mode`: een gedeeld geheim (`token`/`password`) gebruikt `Authorization: Bearer <token-or-password>`; trusted-proxy gebruikt proxyheaders met identiteitsgegevens (local loopback-proxy's op dezelfde host vereisen `gateway.auth.trustedProxy.allowLoopback = true`, met een directe terugval op dezelfde host via `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` wanneer geen header `Forwarded`/`X-Forwarded-*`/`X-Real-IP` aanwezig is); `none` bij particuliere inkomende toegang vereist geen authenticatieheader. Zie [Authenticatie via vertrouwde proxy](/nl/gateway/trusted-proxy-auth).
- Behandel het eindpunt als volledige operatortoegang tot de Gateway-instantie.
- Authenticatiemodi met een gedeeld geheim negeren een beperktere, door het bearer-token opgegeven `x-openclaw-scopes` en herstellen de volledige standaardset operatorbereiken: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Chatbeurten op dit eindpunt worden behandeld als beurten die door de eigenaar zijn verzonden.
- Vertrouwde HTTP-modi die identiteit doorgeven (trusted-proxy of `gateway.auth.mode="none"`) respecteren `x-openclaw-scopes` indien aanwezig en vallen anders terug op de standaardset operatorbereiken. Eigenaarssemantiek gaat alleen verloren wanneer de aanroeper de bereiken expliciet beperkt en `operator.admin` weglaat.
- Selecteer agents met `model: "openclaw"`, `"openclaw/default"`, `"openclaw/<agentId>"` of de header `x-openclaw-agent-id`.
- Gebruik `x-openclaw-model` om het backendmodel van de geselecteerde agent te overschrijven (vereist `operator.admin` bij authenticatiepaden die identiteit doorgeven).
- Gebruik `x-openclaw-session-key` voor expliciete sessieroutering (wordt geweigerd met `400 invalid_request_error` als deze een gereserveerde naamruimte gebruikt: `subagent:`, `cron:`, `acp:`).
- Gebruik `x-openclaw-message-channel` voor een niet-standaard synthetische context voor het inkomende kanaal.

Zie [OpenAI Chat Completions](/nl/gateway/openai-http-api#agent-first-model-contract) voor de canonieke uitleg over agentdoelmodellen, `openclaw/default`, het doorgeven van embeddings en het overschrijven van backendmodellen.

Zie [Operatorbereiken](/nl/gateway/operator-scopes) en [Beveiliging](/nl/gateway/security).

## Sessiegedrag

Het eindpunt is standaard **staatloos per aanvraag** (bij elke aanroep wordt een nieuwe sessiesleutel gegenereerd).

Als de aanvraag een OpenResponses-`user`-tekenreeks bevat, leidt de Gateway daaruit een stabiele sessiesleutel af, zodat herhaalde aanroepen een agentsessie kunnen delen.

`previous_response_id` hergebruikt de sessie van het eerdere antwoord wanneer de aanvraag binnen hetzelfde bereik van agent, gebruiker en aangevraagde sessie blijft (vergeleken op authenticatiesubject, agent-id en `x-openclaw-session-key`).

## Aanvraagstructuur

| Veld                                                             | Ondersteuning                                                                                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `input`                                                          | Tekenreeks of array met itemobjecten.                                                                                                                     |
| `instructions`                                                   | Wordt samengevoegd met de systeemprompt.                                                                                                                  |
| `tools`                                                          | Tooldefinities van de client (functietools).                                                                                                              |
| `tool_choice`                                                    | `"auto"`, `"none"`, `"required"` of `{ "type": "function", "name": "..." }` om clienttools te filteren of verplicht te stellen.                            |
| `stream`                                                         | Schakelt SSE-streaming in.                                                                                                                                |
| `max_output_tokens`                                              | Uitvoerlimiet op basis van beste inspanning (afhankelijk van de provider).                                                                                |
| `temperature`                                                    | Samplingtemperatuur op basis van beste inspanning. Wordt genegeerd door de op ChatGPT gebaseerde Codex Responses-backend, die vaste server-side sampling gebruikt. |
| `top_p`                                                          | Nucleus-sampling op basis van beste inspanning. Dezelfde kanttekening voor Codex Responses als bij `temperature`.                                         |
| `user`                                                           | Stabiele sessieroutering.                                                                                                                                 |
| `previous_response_id`                                           | Sessiecontinuïteit (zie hierboven).                                                                                                                       |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | Geaccepteerd, maar momenteel genegeerd.                                                                                                                   |

## Items (invoer)

### `message`

Rollen: `system`, `developer`, `user`, `assistant`.

- `system` en `developer` worden aan de systeemprompt toegevoegd.
- Het meest recente item `user` of `function_call_output` wordt het 'huidige bericht'.
- Eerdere berichten van gebruiker en assistent worden als geschiedenis voor context opgenomen.

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

Worden geaccepteerd voor schemacompatibiliteit, maar genegeerd bij het opbouwen van de prompt.

## Tools (functietools aan clientzijde)

Lever tools aan met `tools: [{ type: "function", name, description?, parameters? }]`.

Als de agent een tool aanroept, retourneert het antwoord een `function_call`-uitvoeritem. Stuur een vervolgaanvraag met `function_call_output` om de beurt voort te zetten.

Voor `tool_choice: "required"` en een aan een functie vastgemaakte `tool_choice` beperkt het eindpunt de aangeboden set clientfunctietools, geeft het de runtime opdracht om vóór het antwoorden een clienttool aan te roepen en weigert het de beurt als deze geen overeenkomende gestructureerde clienttoolaanroep bevat, overeenkomstig het contract van `/v1/chat/completions`. Niet-streamende aanvragen retourneren `502` met een `api_error`; streamende aanvragen verzenden een gebeurtenis `response.failed`.

## Afbeeldingen (`input_image`)

Ondersteunt base64- of URL-bronnen:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Toegestane MIME-typen (standaard): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`. Maximale grootte (standaard): 10 MB.

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

Toegestane MIME-typen (standaard): `text/plain`, `text/markdown`, `text/html`, `text/csv`, `application/json`, `application/pdf`. Maximale grootte (standaard): 5 MB.

Huidig gedrag:

- De bestandsinhoud wordt gedecodeerd en aan de **systeemprompt** toegevoegd, niet aan het gebruikersbericht, zodat deze tijdelijk blijft (niet opgeslagen in de sessiegeschiedenis).
- Gedecodeerde bestandstekst wordt verpakt als **niet-vertrouwde externe inhoud** voordat deze wordt toegevoegd, zodat bestandsbytes als gegevens en niet als vertrouwde instructies worden behandeld. Het ingevoegde blok gebruikt expliciete grensmarkeringen (`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`) en een metadataregel `Source: External`. De lange banner `SECURITY NOTICE:` wordt bewust weggelaten om het promptbudget te behouden; de grensmarkeringen en metadata blijven van toepassing.
- PDF's worden eerst op tekst geparseerd. Als weinig tekst wordt gevonden, worden de eerste pagina's gerasterd tot afbeeldingen en aan het model doorgegeven, en gebruikt het ingevoegde bestandsblok de tijdelijke aanduiding `[PDF content rendered to images]`.

PDF-parsing wordt geleverd door de meegeleverde Plugin `document-extract`, die `clawpdf` en de bijbehorende verpakte PDFium WebAssembly-runtime gebruikt voor tekstextractie en paginarendering.

Standaardinstellingen voor ophalen via URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (totaal aantal op URL gebaseerde `input_file`- en `input_image`-onderdelen per aanvraag)
- Aanvragen worden beveiligd (DNS-resolutie, blokkering van particuliere IP-adressen, limieten voor omleidingen en time-outs).
- Optionele toelatingslijsten voor hostnamen worden per invoertype ondersteund (`files.urlAllowlist`, `images.urlAllowlist`): exacte host (`"cdn.example.com"`) of jokertekens voor subdomeinen (`"*.assets.example.com"`, komt niet overeen met het hoofddomein). Lege of weggelaten toelatingslijsten betekenen dat er geen beperking door een toelatingslijst voor hostnamen geldt.
- Om ophalen via URL volledig uit te schakelen, stelt u `files.allowUrl: false` en/of `images.allowUrl: false` in.

## Limieten voor bestanden en afbeeldingen (configuratie)

Standaardwaarden kunnen onder `gateway.http.endpoints.responses` worden aangepast:

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

Standaardwaarden indien weggelaten:

| Sleutel                  | Standaard |
| ------------------------ | --------- |
| `maxBodyBytes`           | 20 MB     |
| `maxUrlParts`            | 8         |
| `files.maxBytes`         | 5 MB      |
| `files.maxChars`         | 60k       |
| `files.maxRedirects`     | 3         |
| `files.timeoutMs`        | 10 s      |
| `files.pdf.maxPages`     | 4         |
| `files.pdf.maxPixels`    | 4.000.000 |
| `files.pdf.minTextChars` | 200       |
| `images.maxBytes`        | 10 MB     |
| `images.maxRedirects`    | 3         |
| `images.timeoutMs`       | 10 s      |

HEIC/HEIF-`input_image`-bronnen worden vóór levering aan de provider genormaliseerd naar JPEG via de gedeelde OpenClaw-afbeeldingsprocessor (Rastermill), die voor indelingen waarvoor externe codecondersteuning nodig is, terugvalt op een systeemconverter (`sips`, ImageMagick, GraphicsMagick of ffmpeg).

Beveiligingsopmerking: URL-toelatingslijsten worden vóór het ophalen en bij elke omleidingsstap afgedwongen. Het toelaten van een hostnaam omzeilt de blokkering van particuliere/interne IP-adressen niet. Pas voor Gateways die via internet toegankelijk zijn naast beveiligingen op applicatieniveau ook netwerkcontroles voor uitgaand verkeer toe. Zie [Beveiliging](/nl/gateway/security).

## Streaming (SSE)

Stel `stream: true` in om Server-Sent Events te ontvangen:

- `Content-Type: text/event-stream`
- Elke gebeurtenisregel is `event: <type>` en `data: <json>`
- De stream eindigt met `data: [DONE]`

Gebeurtenistypen die momenteel worden uitgestuurd: `response.created`, `response.in_progress`, `response.output_item.added`, `response.content_part.added`, `response.output_text.delta`, `response.output_text.done`, `response.content_part.done`, `response.output_item.done`, `response.completed`, `response.failed` (bij een fout).

## Gebruik

`usage` wordt ingevuld wanneer de onderliggende provider aantallen tokens rapporteert. OpenClaw normaliseert gangbare aliassen in OpenAI-stijl voordat die tellers stroomafwaartse status- en sessieoppervlakken bereiken, waaronder `input_tokens` / `output_tokens` en `prompt_tokens` / `completion_tokens`.

## Fouten

Fouten gebruiken een JSON-object zoals:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Veelvoorkomende gevallen: `400` ongeldige aanvraagbody, `401` ontbrekende/ongeldige authenticatie, `403` ontbrekend operatorbereik, `405` onjuiste methode, `429` te veel mislukte authenticatiepogingen (met `Retry-After`).

## Voorbeelden

Zonder streaming:

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

Met streaming:

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
- [Operatorbereiken](/nl/gateway/operator-scopes)
- [OpenAI](/nl/providers/openai)
