---
read_when:
    - Tools integreren die OpenAI Chat Completions verwachten
summary: Stel vanuit de Gateway een OpenAI-compatibel HTTP-eindpunt `/v1/chat/completions` beschikbaar
title: OpenAI-chatvoltooiingen
x-i18n:
    generated_at: "2026-07-12T08:51:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9b1fffd2ce3da881ecd91adbb7c5d10b1d7adbd99af9b2ea4544b62ecbaf1f32
    source_path: gateway/openai-http-api.md
    workflow: 16
---

De Gateway kan een klein, OpenAI-compatibel Chat Completions-oppervlak aanbieden. Dit is **standaard uitgeschakeld**.

Na inschakeling biedt deze alle onderstaande eindpunten aan op dezelfde poort als de Gateway (WS + HTTP-multiplexing):

| Methode | Pad                    |
| ------- | ---------------------- |
| POST    | `/v1/chat/completions` |
| GET     | `/v1/models`           |
| GET     | `/v1/models/{id}`      |
| POST    | `/v1/embeddings`       |
| POST    | `/v1/responses`        |

Aanvragen worden uitgevoerd als een normale agentuitvoering van de Gateway (hetzelfde codepad als `openclaw agent`), zodat routering, machtigingen en configuratie overeenkomen met die van je Gateway.

## Het eindpunt inschakelen

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

Stel `enabled: false` in (of laat het weg) om het uit te schakelen.

## Beveiligingsgrens (belangrijk)

Behandel dit eindpunt als **volledige operatortoegang** tot de Gateway-instantie:

- Een geldig Gateway-token of -wachtwoord voor dit eindpunt is gelijkwaardig aan een legitimatie voor een eigenaar/operator, niet aan een beperkte reikwijdte per gebruiker.
- Aanvragen doorlopen hetzelfde agentpad in het besturingsvlak als vertrouwde operatoracties. Als het beleid van de doelagent gevoelige hulpmiddelen toestaat, kan dit eindpunt deze dus gebruiken.
- Houd het uitsluitend beschikbaar via local loopback, tailnet of privé-inkomend verkeer. Stel het niet bloot aan het openbare internet.

Authenticatiematrix:

| Authenticatiepad                                                                                    | Gedrag                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"` of `"password"` + `Authorization: Bearer ...`                            | Bewijst het bezit van het gedeelde Gateway-geheim. Negeert elke `x-openclaw-scopes`-header en herstelt de volledige standaardset operatorreikwijdten: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Behandelt chatbeurten als beurten van de eigenaar als afzender. |
| Vertrouwde HTTP met identiteit (trusted-proxy-authenticatie, of `gateway.auth.mode="none"` bij privé-inkomend verkeer) | Respecteert `x-openclaw-scopes` indien aanwezig; gebruikt bij afwezigheid de standaardset operatorreikwijdten. Verliest de eigenaarsemantiek alleen wanneer de aanroeper de reikwijdten expliciet beperkt en `operator.admin` weglaat. Vereist `operator.admin` voor besturing op eigenaarsniveau, zoals `x-openclaw-model`.                                 |

Zie [Operatorreikwijdten](/nl/gateway/operator-scopes), [Beveiliging](/nl/gateway/security) en [Externe toegang](/nl/gateway/remote).

## Authenticatie

Gebruikt de authenticatieconfiguratie van de Gateway (zie [Authenticatie via een vertrouwde proxy](/nl/gateway/trusted-proxy-auth) voor details over die modus):

| Modus                               | Authenticatiemethode                                                                                                                                                                                                |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"`         | `Authorization: Bearer <token>`. Stel dit in via `gateway.auth.token` of `OPENCLAW_GATEWAY_TOKEN`.                                                                                                                   |
| `gateway.auth.mode="password"`      | `Authorization: Bearer <password>`. Stel dit in via `gateway.auth.password` of `OPENCLAW_GATEWAY_PASSWORD`.                                                                                                          |
| `gateway.auth.mode="trusted-proxy"` | Routeer via de geconfigureerde identiteitsbewuste proxy; deze voegt de vereiste identiteitsheaders toe. local loopback-proxy's op dezelfde host vereisen expliciet `gateway.auth.trustedProxy.allowLoopback = true`. |
| `gateway.auth.mode="none"`          | Geen authenticatieheader vereist (alleen bij privé-inkomend verkeer).                                                                                                                                                |

Opmerkingen:

- Aanroepers op dezelfde host die de proxy omzeilen bij een `trusted-proxy`-Gateway, kunnen rechtstreeks terugvallen op `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Bewijs in een `Forwarded`-, `X-Forwarded-*`- of `X-Real-IP`-header houdt de aanvraag in plaats daarvan op het trusted-proxy-pad.
- Als `gateway.auth.rateLimit` is geconfigureerd en te veel authenticatiepogingen mislukken, retourneert het eindpunt `429` met een `Retry-After`-header.

## Wanneer je dit eindpunt gebruikt

- Geef hieraan de voorkeur boven het toevoegen van een nieuw ingebouwd kanaal wanneer je integratie slechts een ander operator-/clientoppervlak voor dezelfde Gateway is.
- Geef voor systeemeigen mobiele clients die rechtstreeks verbinding maken met een externe Gateway de voorkeur aan [WebChat](/nl/web/webchat) of het [Gateway-protocol](/nl/gateway/protocol) met de bootstrap-/apparaattokenstroom voor gekoppelde apparaten, zodat het apparaat geen gedeeld HTTP-token of -wachtwoord nodig heeft.
- Bouw in plaats daarvan een kanaalplugin wanneer je een extern berichtennetwerk integreert met eigen gebruikers, ruimten, Webhook-bezorging of uitgaand transport. Zie [Plugins bouwen](/nl/plugins/building-plugins).

## Agentgericht modelcontract

OpenClaw behandelt het OpenAI-veld `model` als een **agentdoel**, niet als een onbewerkte model-id van een provider.

| Waarde van `model`                           | Routeert naar                                                                                                                                |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw`                                   | Geconfigureerde standaardagent                                                                                                               |
| `openclaw/default`                           | Geconfigureerde standaardagent (stabiele alias; kan veilig hardgecodeerd worden, zelfs als de echte id van de standaardagent per omgeving verschilt) |
| `openclaw/<agentId>` of `openclaw:<agentId>` | Specifieke agent                                                                                                                             |
| `agent:<agentId>`                            | Specifieke agent (compatibiliteitsalias)                                                                                                     |

Optionele aanvraagheaders:

| Header                                          | Effect                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-openclaw-model: <provider/model-or-bare-id>` | Overschrijft het backendmodel voor de geselecteerde agent. Aanroepers met een bearer-token voor een gedeeld geheim kunnen dit rechtstreeks gebruiken; aanroepers met identiteit (trusted-proxy, of privé-inkomend verkeer zonder authenticatie met `x-openclaw-scopes`) hebben `operator.admin` nodig, anders volgt `403 missing scope: operator.admin`. |
| `x-openclaw-agent-id: <agentId>`                | Compatibiliteitsoverschrijving voor agentselectie.                                                                                                                                                                                                                                                                                                                |
| `x-openclaw-session-key: <sessionKey>`          | Expliciete sessieroutering. Wordt geweigerd met `400 invalid_request_error` als een gereserveerde interne naamruimte wordt gebruikt (`subagent:`, `cron:`, `acp:`).                                                                                                                                                                                                |
| `x-openclaw-message-channel: <channel>`         | Stelt de synthetische context van het inkomende kanaal in voor kanaalbewuste prompts en beleidsregels.                                                                                                                                                                                                                                                            |

`/v1/models` vermeldt agentdoelen op het hoogste niveau (`openclaw`, `openclaw/default`, `openclaw/<agentId>`), geen backendmodellen van providers en geen subagents; subagents blijven onderdeel van de interne uitvoeringstopologie. Als je `x-openclaw-model` weglaat, wordt de geselecteerde agent uitgevoerd met het normaal geconfigureerde model.

`/v1/embeddings` gebruikt dezelfde agentdoel-id's voor `model`. Stuur `x-openclaw-model` (vanuit een aanroeper met een gedeeld geheim, of een aanroeper met identiteit en `operator.admin`) om een specifiek embeddingmodel te kiezen; anders gebruikt de aanvraag de normale embeddingconfiguratie van de geselecteerde agent.

## Sessiegedrag

Standaard is het eindpunt **toestandsloos per aanvraag** (bij elke aanroep wordt een nieuwe sessiesleutel gegenereerd).

Als de aanvraag een OpenAI-tekenreeks `user` bevat, leidt de Gateway daaruit een stabiele sessiesleutel af, zodat herhaalde aanroepen een agentsessie kunnen delen. Hergebruik voor aangepaste apps dezelfde `user`-waarde per gespreksthread; vermijd identificatoren op accountniveau, tenzij je wilt dat meerdere gesprekken of apparaten één OpenClaw-sessie delen. Gebruik `x-openclaw-session-key` alleen wanneer je expliciete controle over de routering tussen meerdere clients of threads nodig hebt, met sleutels die eigendom zijn van de toepassing en de bovenstaande gereserveerde naamruimten vermijden.

## Aanvraaglimieten (configuratie)

Standaardwaarden kunnen worden aangepast onder `gateway.http.endpoints.chatCompletions`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxImageParts: 8,
          maxTotalImageBytes: 20000000,
          images: {
            allowUrl: false,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
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

| Sleutel                | Standaardwaarde                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| `maxBodyBytes`         | 20 MB                                                                                               |
| `maxImageParts`        | 8 (maximaal aantal `image_url`-delen dat uit het nieuwste gebruikersbericht wordt gelezen)          |
| `maxTotalImageBytes`   | 20 MB (cumulatief aantal gedecodeerde bytes van alle `image_url`-delen in één aanvraag)              |
| `images.allowUrl`      | `false` (van URL's afkomstige `image_url`-delen worden geweigerd tenzij dit is ingeschakeld)         |
| `images.maxBytes`      | 10 MB per afbeelding                                                                                |
| `images.maxRedirects`  | 3                                                                                                   |
| `images.timeoutMs`     | 10 s                                                                                                |

HEIC/HEIF-bronnen voor `image_url` worden geaccepteerd en vóór levering aan de provider genormaliseerd naar JPEG via de gedeelde OpenClaw-afbeeldingsverwerker (Rastermill). Deze valt voor indelingen die externe codec-ondersteuning vereisen terug op een systeemconverter (`sips`, ImageMagick, GraphicsMagick of ffmpeg).

Beveiligingsopmerking: het toestaan van een hostnaam omzeilt de blokkering van privé-/interne IP-adressen niet. Pas voor Gateways die aan internet zijn blootgesteld naast beveiligingen op applicatieniveau ook netwerkcontroles voor uitgaand verkeer toe. Zie [Beveiliging](/nl/gateway/security).

## Contract voor chattools

`/v1/chat/completions` ondersteunt een subset van functietools die compatibel is met gangbare OpenAI Chat-clients.

### Ondersteunde aanvraagvelden

| Veld                       | Opmerkingen                                                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tools`                    | Array van `{ "type": "function", "function": { ... } }`                                                                                                            |
| `tool_choice`              | `"auto"`, `"none"`, `"required"` of `{ "type": "function", "function": { "name": "..." } }`                                                                         |
| `messages[*].role: "tool"` | Vervolgbeurten                                                                                                                                                      |
| `messages[*].tool_call_id` | Koppelt een toolresultaat terug aan een eerdere toolaanroep                                                                                                         |
| `max_completion_tokens`    | Getal; limiet per aanroep voor het totale aantal voltooiingstokens (inclusief redeneertokens). Huidige veldnaam; wordt gebruikt wanneer dit veld en `max_tokens` worden verzonden. |
| `max_tokens`               | Getal; verouderde alias, genegeerd wanneer `max_completion_tokens` ook aanwezig is.                                                                                 |
| `temperature`              | Getal 0-2; naar beste vermogen doorgestuurd naar de bovenliggende provider. `400 invalid_request_error` indien buiten het bereik.                                   |
| `top_p`                    | Getal 0-1; naar beste vermogen. `400 invalid_request_error` indien buiten het bereik.                                                                               |
| `frequency_penalty`        | Getal -2.0 tot 2.0; naar beste vermogen. `400 invalid_request_error` indien buiten het bereik.                                                                      |
| `presence_penalty`         | Getal -2.0 tot 2.0; naar beste vermogen. `400 invalid_request_error` indien buiten het bereik.                                                                      |
| `seed`                     | Geheel getal; naar beste vermogen. `400 invalid_request_error` voor niet-gehele waarden.                                                                            |
| `stop`                     | Tekenreeks of array van maximaal 4 tekenreeksen; naar beste vermogen. `400 invalid_request_error` voor meer dan 4 reeksen of voor items die geen tekenreeks zijn of leeg zijn. |

Alle velden voor steekproefinstellingen en tokenlimieten gebruiken hetzelfde kanaal voor streamparameters van de agent en worden naar beste vermogen doorgestuurd:

- Tokenlimiet: de transportlaag van de provider kiest de veldnaam in het protocol: `max_completion_tokens` voor eindpunten uit de OpenAI-familie en `max_tokens` voor providers die alleen de verouderde naam accepteren (Mistral, Chutes).
- `stop` wordt gekoppeld aan het stopveld van de transportlaag: `stop` voor backends met Chat Completions en `stop_sequences` voor Anthropic. De OpenAI Responses API heeft geen stopparameter, dus `stop` wordt niet toegepast op modellen die op Responses zijn gebaseerd.
- De op ChatGPT gebaseerde Codex Responses-backend gebruikt vaste steekproefinstellingen aan de serverzijde en verwijdert `temperature`/`top_p` (samen met `max_output_tokens`, `metadata`, `prompt_cache_retention`, `service_tier`) voordat de aanvraag die backend bereikt.

### Niet-ondersteunde varianten

Retourneert `400 invalid_request_error` voor:

- `tools` die geen array is, toolitems die geen functietools zijn of ontbrekende `tool.function.name`
- varianten van `tool_choice` zoals `allowed_tools` en `custom`
- waarden van `tool_choice.function.name` die niet overeenkomen met een aangeboden tool

Voor `tool_choice: "required"` en een aan een functie vastgezette `tool_choice` beperkt het eindpunt de aangeboden verzameling clientfunctietools, krijgt de runtime de instructie om vóór een antwoord een clienttool aan te roepen en treedt een fout op als het antwoord van de agent geen overeenkomende gestructureerde clienttoolaanroep bevat. Dit geldt voor de door de aanroeper opgegeven HTTP-lijst `tools`, niet voor elke interne agenttool van OpenClaw.

### Vorm van een niet-streamend toolantwoord

Wanneer de agent tools aanroept, gebruikt het antwoord:

- `choices[0].finish_reason = "tool_calls"`
- items in `choices[0].message.tool_calls[]` met `id`, `type: "function"`, `function.name`, `function.arguments` (JSON-tekenreeks)
- Commentaar van de assistent vóór de toolaanroep in `choices[0].message.content` (mogelijk leeg)

### Vorm van een streamend toolantwoord

Wanneer `stream: true` komen toolaanroepen binnen als incrementele SSE-fragmenten: een eerste delta met de assistentrol, optionele delta's met assistentcommentaar, een of meer `delta.tool_calls`-fragmenten met de identiteit van de tool en fragmenten van de argumenten, gevolgd door een laatste fragment met `finish_reason: "tool_calls"` en `data: [DONE]`.

Als `stream_options.include_usage=true`, wordt vóór `[DONE]` een afsluitend gebruiksfragment verzonden.

### Vervolglus voor tools

Voer na ontvangst van `tool_calls` de aangevraagde functie(s) uit en verzend een vervolgaanvraag met het eerdere assistentbericht met de toolaanroep plus een of meer berichten met `role: "tool"` en een overeenkomende `tool_call_id`. Hiermee wordt dezelfde redeneerlus van de agent voortgezet om het definitieve antwoord te produceren.

## Streaming (SSE)

Stel `stream: true` in om Server-Sent Events te ontvangen:

- `Content-Type: text/event-stream`
- Elke gebeurtenisregel is `data: <json>`
- De stream eindigt met `data: [DONE]`

## Open WebUI snel instellen

- Basis-URL: `http://127.0.0.1:18789/v1`
- Basis-URL voor Docker op macOS: `http://host.docker.internal:18789/v1`
- API-sleutel: uw bearer-token voor de Gateway
- Model: `openclaw/default`

Verwacht gedrag: `GET /v1/models` vermeldt `openclaw/default` en Open WebUI gebruikt dit als model-id voor chat. Stel voor een specifieke backendprovider en een specifiek model het normale standaardmodel van de agent in, of verzend `x-openclaw-model` (aanroeper met een gedeeld geheim of een aanroeper met identiteit en `operator.admin`).

Snelle rooktest:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Als dit `openclaw/default` retourneert, kunnen de meeste Open WebUI-installaties verbinding maken met dezelfde basis-URL en hetzelfde token.

## Voorbeelden

Stabiele sessie voor één appgesprek:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"Summarize my tasks for today"}]
  }'
```

Gebruik bij latere aanroepen voor dat gesprek opnieuw dezelfde `user`-waarde om dezelfde agentsessie voort te zetten.

Niet-streamend:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Streamend:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Modellen weergeven:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Eén model ophalen:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Embeddings maken:

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

`/v1/embeddings` ondersteunt `input` als tekenreeks of als array van tekenreeksen.

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Operatorbereiken](/nl/gateway/operator-scopes)
- [OpenAI](/nl/providers/openai)
