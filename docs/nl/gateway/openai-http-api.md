---
read_when:
    - Tools integreren die OpenAI Chat Completions verwachten
summary: Stel een met OpenAI compatibel HTTP-eindpunt /v1/chat/completions beschikbaar vanuit de Gateway
title: OpenAI-chatvoltooiingen
x-i18n:
    generated_at: "2026-06-27T17:35:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8746f4f5964a5d0b948877b64b5d20440dea3aa45b36813c404cd06660792cf
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw's Gateway kan een klein OpenAI-compatibel Chat Completions-eindpunt aanbieden.

Dit eindpunt is **standaard uitgeschakeld**. Schakel het eerst in de configuratie in.

- `POST /v1/chat/completions`
- Dezelfde poort als de Gateway (WS + HTTP-multiplex): `http://<gateway-host>:<port>/v1/chat/completions`

Wanneer het OpenAI-compatibele HTTP-oppervlak van de Gateway is ingeschakeld, biedt het ook:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Onder de motorkap worden aanvragen uitgevoerd als een normale Gateway-agentrun (hetzelfde codepad als `openclaw agent`), zodat routering/machtigingen/configuratie overeenkomen met je Gateway.

## Authenticatie

Gebruikt de Gateway-authenticatieconfiguratie.

Veelvoorkomende HTTP-authenticatiepaden:

- authenticatie met gedeeld geheim (`gateway.auth.mode="token"` of `"password"`):
  `Authorization: Bearer <token-or-password>`
- vertrouwde identiteitsdragende HTTP-authenticatie (`gateway.auth.mode="trusted-proxy"`):
  routeer via de geconfigureerde identiteitsbewuste proxy en laat die de
  vereiste identiteitsheaders injecteren
- open authenticatie via private ingress (`gateway.auth.mode="none"`):
  geen authenticatieheader vereist

Opmerkingen:

- Wanneer `gateway.auth.mode="token"` is, gebruik `gateway.auth.token` (of `OPENCLAW_GATEWAY_TOKEN`).
- Wanneer `gateway.auth.mode="password"` is, gebruik `gateway.auth.password` (of `OPENCLAW_GATEWAY_PASSWORD`).
- Wanneer `gateway.auth.mode="trusted-proxy"` is, moet de HTTP-aanvraag afkomstig zijn van een
  geconfigureerde vertrouwde proxybron; loopback-proxy's op dezelfde host vereisen expliciet
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Interne callers op dezelfde host die de proxy omzeilen, kunnen
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` gebruiken als lokale directe
  fallback. Elk bewijs in een `Forwarded`-, `X-Forwarded-*`- of `X-Real-IP`-header
  houdt de aanvraag in plaats daarvan op het trusted-proxy-pad.
- Als `gateway.auth.rateLimit` is geconfigureerd en er te veel authenticatiefouten optreden, retourneert het eindpunt `429` met `Retry-After`.

## Beveiligingsgrens (belangrijk)

Behandel dit eindpunt als een **volledig operator-toegangsoppervlak** voor de gateway-instantie.

- HTTP-bearer-authenticatie hier is geen smal scopemodel per gebruiker.
- Een geldig Gateway-token/wachtwoord voor dit eindpunt moet worden behandeld als een eigenaar-/operatorreferentie.
- Aanvragen lopen via hetzelfde control-plane-agentpad als vertrouwde operatoracties.
- Er is geen afzonderlijke toolgrens voor niet-eigenaars/per gebruiker op dit eindpunt; zodra een caller hier door Gateway-authenticatie komt, behandelt OpenClaw die caller als een vertrouwde operator voor deze gateway.
- Voor authenticatiemodi met gedeeld geheim (`token` en `password`) herstelt het eindpunt de normale volledige operatorstandaarden, zelfs als de caller een smallere `x-openclaw-scopes`-header verstuurt.
- Vertrouwde identiteitsdragende HTTP-modi (bijvoorbeeld trusted-proxy-authenticatie of `gateway.auth.mode="none"`) respecteren `x-openclaw-scopes` wanneer aanwezig en vallen anders terug op de normale standaardset operatorscopes.
- Als het doelagentbeleid gevoelige tools toestaat, kan dit eindpunt die gebruiken.
- Houd dit eindpunt alleen op loopback/tailnet/private ingress; stel het niet rechtstreeks bloot aan het openbare internet.

Authenticatiematrix:

- `gateway.auth.mode="token"` of `"password"` + `Authorization: Bearer ...`
  - bewijst bezit van het gedeelde gateway-operatorgeheim
  - negeert smallere `x-openclaw-scopes`
  - herstelt de volledige standaardset operatorscopes:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt chatbeurten op dit eindpunt als eigenaar-afzenderbeurten
- vertrouwde identiteitsdragende HTTP-modi (bijvoorbeeld trusted-proxy-authenticatie, of `gateway.auth.mode="none"` op private ingress)
  - authenticeren een externe vertrouwde identiteit of implementatiegrens
  - respecteren `x-openclaw-scopes` wanneer de header aanwezig is
  - vallen terug op de normale standaardset operatorscopes wanneer de header ontbreekt
  - verliezen eigenaarsemantiek alleen wanneer de caller scopes expliciet versmalt en `operator.admin` weglaat
  - vereisen `operator.admin` voor aanvraagbesturing op eigenaarniveau, zoals `x-openclaw-model`

Zie [Beveiliging](/nl/gateway/security) en [Externe toegang](/nl/gateway/remote).

## Wanneer je dit eindpunt gebruikt

Gebruik `/v1/chat/completions` wanneer je tooling of een vertrouwde app-side backend integreert met een bestaande gateway en gateway-operatorreferenties veilig kunt bewaren.

- Geef hier de voorkeur aan boven het toevoegen van een nieuw ingebouwd kanaal wanneer je integratie slechts een ander operator-/clientoppervlak is voor dezelfde gateway.
- Voor native mobiele clients die rechtstreeks verbinding maken met een externe gateway, geef de voorkeur aan [WebChat](/nl/web/webchat) of het [Gateway Protocol](/nl/gateway/protocol) en implementeer de bootstrap-/device-token-flow voor gekoppelde apparaten, zodat het apparaat geen gedeeld HTTP-token/wachtwoord nodig heeft.
- Bouw in plaats daarvan een kanaal-Plugin wanneer je een extern berichtennetwerk integreert met eigen gebruikers, ruimtes, Webhook-aflevering of uitgaand transport. Zie [Plugins bouwen](/nl/plugins/building-plugins).

## Agent-first modelcontract

OpenClaw behandelt het OpenAI-veld `model` als een **agentdoel**, niet als een ruwe provider-model-id.

- `model: "openclaw"` routeert naar de geconfigureerde standaardagent.
- `model: "openclaw/default"` routeert ook naar de geconfigureerde standaardagent.
- `model: "openclaw/<agentId>"` routeert naar een specifieke agent.

Optionele aanvraagheaders:

- `x-openclaw-model: <provider/model-or-bare-id>` overschrijft het backendmodel voor de geselecteerde agent. Shared-secret bearer-callers kunnen deze header gebruiken. Identiteitsdragende callers, zoals trusted-proxy- of private no-auth ingress-aanvragen met `x-openclaw-scopes`, hebben `operator.admin` nodig; write-only callers krijgen `403 missing scope: operator.admin`.
- `x-openclaw-agent-id: <agentId>` blijft ondersteund als compatibiliteitsoverschrijving.
- `x-openclaw-session-key: <sessionKey>` regelt sessieroutering expliciet. De waarde mag geen gereserveerde interne sessienaamruimten gebruiken, zoals `subagent:`, `cron:` of `acp:`; die aanvragen worden geweigerd met `400 invalid_request_error`.
- `x-openclaw-message-channel: <channel>` stelt de synthetische ingress-kanaalcontext in voor kanaalbewuste prompts en beleidsregels.

Compatibiliteitsaliassen die nog worden geaccepteerd:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Het eindpunt inschakelen

Stel `gateway.http.endpoints.chatCompletions.enabled` in op `true`:

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

## Het eindpunt uitschakelen

Stel `gateway.http.endpoints.chatCompletions.enabled` in op `false`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## Sessiesgedrag

Standaard is het eindpunt **stateless per aanvraag** (bij elke call wordt een nieuwe sessiesleutel gegenereerd).

Als de aanvraag een OpenAI-`user`-string bevat, leidt de Gateway daaruit een stabiele sessiesleutel af, zodat herhaalde calls een agentsessie kunnen delen.

Voor aangepaste apps is de veiligste standaard om dezelfde `user`-waarde per gespreksdraad te hergebruiken. Vermijd identifiers op accountniveau, tenzij je expliciet wilt dat meerdere gesprekken of apparaten één OpenClaw-sessie delen. Gebruik `x-openclaw-session-key` alleen wanneer je expliciete routeringscontrole nodig hebt over meerdere clients of threads, en kies applicatie-eigen sleutels die niet beginnen met gereserveerde interne naamruimten zoals `subagent:`, `cron:` of `acp:`.

## Waarom dit oppervlak belangrijk is

Dit is de compatibiliteitsset met de meeste hefboomwerking voor self-hosted frontends en tooling:

- De meeste Open WebUI-, LobeChat- en LibreChat-setups verwachten `/v1/models`.
- Veel RAG-systemen verwachten `/v1/embeddings`.
- Bestaande OpenAI-chatclients kunnen meestal beginnen met `/v1/chat/completions`.
- Meer agent-native clients geven steeds vaker de voorkeur aan `/v1/responses`.

## Modellijst en agentroutering

<AccordionGroup>
  <Accordion title="Wat retourneert `/v1/models`?">
    Een lijst met OpenClaw-agentdoelen.

    De geretourneerde id's zijn `openclaw`, `openclaw/default` en vermeldingen voor `openclaw/<agentId>`.
    Gebruik ze rechtstreeks als OpenAI-`model`-waarden.

  </Accordion>
  <Accordion title="Vermeldt `/v1/models` agents of subagents?">
    Het vermeldt agentdoelen op topniveau, geen backend-provider-modellen en geen subagents.

    Subagents blijven interne uitvoeringstopologie. Ze verschijnen niet als pseudomodellen.

  </Accordion>
  <Accordion title="Waarom is `openclaw/default` opgenomen?">
    `openclaw/default` is de stabiele alias voor de geconfigureerde standaardagent.

    Dat betekent dat clients één voorspelbare id kunnen blijven gebruiken, zelfs als de echte standaardagent-id tussen omgevingen verandert.

  </Accordion>
  <Accordion title="Hoe overschrijf ik het backendmodel?">
    Gebruik `x-openclaw-model`. Dit is een overschrijving op eigenaarniveau: het werkt met het Gateway shared-secret bearer-token-/wachtwoordpad, en het vereist `operator.admin` op identiteitsdragende HTTP-paden zoals trusted-proxy-authenticatie.

    Voorbeelden:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Als je het weglaat, draait de geselecteerde agent met zijn normale geconfigureerde modelkeuze.

  </Accordion>
  <Accordion title="Hoe passen embeddings in dit contract?">
    `/v1/embeddings` gebruikt dezelfde agentdoel-`model`-id's.

    Gebruik `model: "openclaw/default"` of `model: "openclaw/<agentId>"`.
    Wanneer je een specifiek embeddingmodel nodig hebt, stuur het dan in `x-openclaw-model` vanuit een shared-secret caller of een identiteitsdragende caller met `operator.admin`.
    Zonder die header wordt de aanvraag doorgegeven aan de normale embeddingconfiguratie van de geselecteerde agent.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Stel `stream: true` in om Server-Sent Events (SSE) te ontvangen:

- `Content-Type: text/event-stream`
- Elke eventregel is `data: <json>`
- Stream eindigt met `data: [DONE]`

## Chat-toolcontract

`/v1/chat/completions` ondersteunt een subset van function-tools die compatibel is met gangbare OpenAI Chat-clients.

### Ondersteunde aanvraagvelden

- `tools`: array van `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`, `"required"` of `{ "type": "function", "function": { "name": "..." } }`
- `messages[*].role: "tool"` vervolgbaarbeurten
- `messages[*].tool_call_id` om toolresultaten terug te koppelen aan een eerdere toolcall
- `max_completion_tokens`: getal; limiet per call voor het totale aantal completion-tokens (inclusief reasoning-tokens). Huidige veldnaam voor OpenAI Chat Completions; aanbevolen wanneer zowel `max_completion_tokens` als `max_tokens` worden verzonden.
- `max_tokens`: getal; legacy-alias geaccepteerd voor achterwaartse compatibiliteit. Wordt genegeerd wanneer `max_completion_tokens` ook aanwezig is.
- `temperature`: getal; best-effort samplingtemperatuur die via het agent-stream-param-kanaal wordt doorgestuurd naar de upstreamprovider.
- `top_p`: getal; best-effort nucleus sampling die via het agent-stream-param-kanaal wordt doorgestuurd naar de upstreamprovider.
- `frequency_penalty`: getal; best-effort frequentiepenalty die via het agent-stream-param-kanaal wordt doorgestuurd naar de upstreamprovider. Gevalideerd bereik: -2.0 tot 2.0. Retourneert `400 invalid_request_error` voor waarden buiten bereik.
- `presence_penalty`: getal; best-effort presence penalty die via het agent-stream-param-kanaal wordt doorgestuurd naar de upstreamprovider. Gevalideerd bereik: -2.0 tot 2.0. Retourneert `400 invalid_request_error` voor waarden buiten bereik.
- `seed`: getal (integer); best-effort seed die via het agent-stream-param-kanaal wordt doorgestuurd naar de upstreamprovider. Retourneert `400 invalid_request_error` voor niet-integer waarden.
- `stop`: string of array van maximaal 4 strings; best-effort stopsequenties die via het agent-stream-param-kanaal worden doorgestuurd naar de upstreamprovider. Retourneert `400 invalid_request_error` voor meer dan 4 sequenties of niet-string/lege items.

Wanneer een van beide tokenlimietvelden is ingesteld, wordt de waarde via het agent-stream-param-kanaal doorgestuurd naar de upstream provider. De daadwerkelijke wire-veldnaam die naar de upstream provider wordt verzonden, wordt gekozen door de providertransportlaag: `max_completion_tokens` voor OpenAI-familie-eindpunten, en `max_tokens` voor providers die alleen de legacy naam accepteren (zoals Mistral en Chutes). Sampling-velden (`temperature`, `top_p`, `frequency_penalty`, `presence_penalty`, `seed`) volgen hetzelfde stream-param-kanaal; de op ChatGPT gebaseerde Codex Responses-backend verwijdert ze server-side omdat die vaste sampling gebruikt. `stop` loopt ook via het stream-param-kanaal en wordt gekoppeld aan het stopveld van de transportlaag (`stop` voor Chat Completions-backends, `stop_sequences` voor Anthropic); de OpenAI Responses API heeft geen stopparameter, dus `stop` wordt niet toegepast op modellen die door Responses worden ondersteund.

### Niet-ondersteunde varianten

Het eindpunt retourneert `400 invalid_request_error` voor niet-ondersteunde toolvarianten, waaronder:

- niet-array `tools`
- niet-function tool-items
- ontbrekende `tool.function.name`
- `tool_choice`-varianten zoals `allowed_tools` en `custom`
- `tool_choice.function.name`-waarden die niet overeenkomen met opgegeven `tools`

Voor `tool_choice: "required"` en functie-vastgezette `tool_choice` vernauwt het eindpunt de blootgestelde clientset met function-tools, instrueert het de runtime om een clienttool aan te roepen voordat er wordt geantwoord, en retourneert het een fout als het agentantwoord geen overeenkomende gestructureerde clienttool-aanroep bevat. Dit contract geldt voor de door de aanroeper aangeleverde HTTP-`tools`-lijst, niet voor elke interne OpenClaw-agenttool.

### Vorm van niet-streaming toolrespons

Wanneer de agent besluit tools aan te roepen, gebruikt de respons:

- `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]`-items met:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (JSON-tekenreeks)

Assistant-commentaar vóór de toolaanroep wordt geretourneerd in `choices[0].message.content` (mogelijk leeg).

### Vorm van streaming toolrespons

Wanneer `stream: true`, worden toolaanroepen als incrementele SSE-chunks uitgegeven:

- initiële assistant-rol-delta
- optionele assistant-commentaar-delta's
- een of meer `delta.tool_calls`-chunks met toolidentiteit en argumentfragmenten
- laatste chunk met `finish_reason: "tool_calls"`
- `data: [DONE]`

Als `stream_options.include_usage=true`, wordt er vóór `[DONE]` een afsluitende usage-chunk uitgegeven.

### Toolopvolgingslus

Na ontvangst van `tool_calls` moet de client de gevraagde functie(s) uitvoeren en een opvolgverzoek sturen dat het volgende bevat:

- eerder assistant-toolaanroepbericht
- een of meer `role: "tool"`-berichten met overeenkomende `tool_call_id`

Hierdoor kan de gateway-agentrun dezelfde redeneerlus voortzetten en het uiteindelijke assistant-antwoord produceren.

## Snelle installatie voor Open WebUI

Voor een eenvoudige Open WebUI-verbinding:

- Basis-URL: `http://127.0.0.1:18789/v1`
- Docker op macOS basis-URL: `http://host.docker.internal:18789/v1`
- API-sleutel: je Gateway bearer-token
- Model: `openclaw/default`

Verwacht gedrag:

- `GET /v1/models` moet `openclaw/default` tonen
- Open WebUI moet `openclaw/default` gebruiken als chatmodel-id
- Als je een specifieke backendprovider/model voor die agent wilt, stel dan het normale standaardmodel van de agent in of stuur `x-openclaw-model` vanuit een aanroeper met gedeeld geheim of een aanroeper met identiteit en `operator.admin`

Snelle smoke-test:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Als dat `openclaw/default` retourneert, kunnen de meeste Open WebUI-installaties verbinding maken met dezelfde basis-URL en hetzelfde token.

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

Hergebruik dezelfde `user`-waarde bij latere aanroepen voor dat gesprek om dezelfde agentsessie voort te zetten.

Niet-streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Streaming:

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

Opmerkingen:

- `/v1/models` retourneert OpenClaw-agentdoelen, geen ruwe providercatalogi.
- `openclaw/default` is altijd aanwezig, zodat één stabiele id in verschillende omgevingen werkt.
- Backendprovider/model-overschrijvingen horen thuis in `x-openclaw-model`, niet in het OpenAI-veld `model`. Op HTTP-authenticatiepaden met identiteit vereist deze header `operator.admin`.
- `/v1/embeddings` ondersteunt `input` als tekenreeks of array van tekenreeksen.

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [OpenAI](/nl/providers/openai)
