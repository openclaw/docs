---
read_when:
    - Tools integreren die OpenAI Chat Completions verwachten
summary: Stel een OpenAI-compatibel /v1/chat/completions-HTTP-eindpunt beschikbaar vanuit de Gateway
title: OpenAI-chatvoltooiingen
x-i18n:
    generated_at: "2026-05-11T20:30:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71e25fc1299754ebc65d3998834dc5e9c03acfbd005387aef96f946be1d04a1
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

Onder de motorkap worden verzoeken uitgevoerd als een normale Gateway-agentrun (hetzelfde codepad als `openclaw agent`), zodat routering/machtigingen/configuratie overeenkomen met je Gateway.

## Authenticatie

Gebruikt de Gateway-authconfiguratie.

Veelvoorkomende HTTP-authpaden:

- authenticatie met gedeeld geheim (`gateway.auth.mode="token"` of `"password"`):
  `Authorization: Bearer <token-or-password>`
- vertrouwde identiteitsdragende HTTP-authenticatie (`gateway.auth.mode="trusted-proxy"`):
  routeer via de geconfigureerde identiteitsbewuste proxy en laat die de
  vereiste identiteitsheaders injecteren
- open authenticatie via private ingress (`gateway.auth.mode="none"`):
  geen authheader vereist

Opmerkingen:

- Wanneer `gateway.auth.mode="token"` is, gebruik `gateway.auth.token` (of `OPENCLAW_GATEWAY_TOKEN`).
- Wanneer `gateway.auth.mode="password"` is, gebruik `gateway.auth.password` (of `OPENCLAW_GATEWAY_PASSWORD`).
- Wanneer `gateway.auth.mode="trusted-proxy"` is, moet het HTTP-verzoek afkomstig zijn van een
  geconfigureerde vertrouwde proxybron; same-host loopback-proxy's vereisen expliciet
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Als `gateway.auth.rateLimit` is geconfigureerd en er te veel authenticatiefouten optreden, retourneert het eindpunt `429` met `Retry-After`.

## Beveiligingsgrens (belangrijk)

Behandel dit eindpunt als een oppervlak met **volledige operatortoegang** voor de gateway-instantie.

- HTTP-bearer-authenticatie hier is geen beperkt per-gebruiker scope-model.
- Een geldige Gateway-token/wachtwoord voor dit eindpunt moet worden behandeld als een eigenaar-/operatorcredential.
- Verzoeken lopen via hetzelfde control-plane-agentpad als vertrouwde operatoracties.
- Er is geen afzonderlijke niet-eigenaar/per-gebruiker toolgrens op dit eindpunt; zodra een aanroeper hier door Gateway-authenticatie komt, behandelt OpenClaw die aanroeper als een vertrouwde operator voor deze gateway.
- Voor authenticatiemodi met gedeeld geheim (`token` en `password`) herstelt het eindpunt de normale volledige operatorstandaarden, zelfs als de aanroeper een beperktere `x-openclaw-scopes`-header meestuurt.
- Vertrouwde identiteitsdragende HTTP-modi (bijvoorbeeld trusted proxy-authenticatie of `gateway.auth.mode="none"`) respecteren `x-openclaw-scopes` wanneer aanwezig en vallen anders terug op de normale standaardscopeset voor operators.
- Als het doelagentbeleid gevoelige tools toestaat, kan dit eindpunt ze gebruiken.
- Houd dit eindpunt alleen op loopback/tailnet/private ingress; stel het niet rechtstreeks bloot aan het openbare internet.

Authmatrix:

- `gateway.auth.mode="token"` of `"password"` + `Authorization: Bearer ...`
  - bewijst bezit van het gedeelde gateway-operatorgeheim
  - negeert beperktere `x-openclaw-scopes`
  - herstelt de volledige standaardscopeset voor operators:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt chatbeurten op dit eindpunt als beurten van de eigenaar-afzender
- vertrouwde identiteitsdragende HTTP-modi (bijvoorbeeld trusted proxy-authenticatie, of `gateway.auth.mode="none"` op private ingress)
  - authenticeren een externe vertrouwde identiteit of implementatiegrens
  - respecteren `x-openclaw-scopes` wanneer de header aanwezig is
  - vallen terug op de normale standaardscopeset voor operators wanneer de header ontbreekt
  - verliezen alleen eigenaarssemantiek wanneer de aanroeper expliciet scopes beperkt en `operator.admin` weglaat

Zie [Beveiliging](/nl/gateway/security) en [Externe toegang](/nl/gateway/remote).

## Agent-first modelcontract

OpenClaw behandelt het OpenAI-veld `model` als een **agentdoel**, niet als een ruwe provider-model-id.

- `model: "openclaw"` routeert naar de geconfigureerde standaardagent.
- `model: "openclaw/default"` routeert ook naar de geconfigureerde standaardagent.
- `model: "openclaw/<agentId>"` routeert naar een specifieke agent.

Optionele verzoekheaders:

- `x-openclaw-model: <provider/model-or-bare-id>` overschrijft het backendmodel voor de geselecteerde agent.
- `x-openclaw-agent-id: <agentId>` blijft ondersteund als compatibiliteitsoverschrijving.
- `x-openclaw-session-key: <sessionKey>` beheert sessieroutering volledig.
- `x-openclaw-message-channel: <channel>` stelt de synthetische ingress-kanaalcontext in voor kanaalbewuste prompts en beleidsregels.

Compatibiliteitsaliassen die nog steeds worden geaccepteerd:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Het eindpunt inschakelen

Zet `gateway.http.endpoints.chatCompletions.enabled` op `true`:

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

Zet `gateway.http.endpoints.chatCompletions.enabled` op `false`:

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

## Sessiegedrag

Standaard is het eindpunt **stateless per verzoek** (bij elke aanroep wordt een nieuwe sessiesleutel gegenereerd).

Als het verzoek een OpenAI-`user`-string bevat, leidt de Gateway daar een stabiele sessiesleutel uit af, zodat herhaalde aanroepen een agentsessie kunnen delen.

## Waarom dit oppervlak belangrijk is

Dit is de compatibiliteitsset met de hoogste hefboomwerking voor self-hosted frontends en tooling:

- De meeste Open WebUI-, LobeChat- en LibreChat-setups verwachten `/v1/models`.
- Veel RAG-systemen verwachten `/v1/embeddings`.
- Bestaande OpenAI-chatclients kunnen meestal beginnen met `/v1/chat/completions`.
- Meer agent-native clients geven steeds vaker de voorkeur aan `/v1/responses`.

## Modellijst en agentroutering

<AccordionGroup>
  <Accordion title="Wat retourneert `/v1/models`?">
    Een OpenClaw-agentdoellijst.

    De geretourneerde id's zijn `openclaw`, `openclaw/default` en `openclaw/<agentId>`-items.
    Gebruik ze rechtstreeks als OpenAI-`model`-waarden.

  </Accordion>
  <Accordion title="Vermeldt `/v1/models` agents of subagents?">
    Het vermeldt agentdoelen op topniveau, geen backendprovidermodellen en geen subagents.

    Subagents blijven interne uitvoeringstopologie. Ze verschijnen niet als pseudomodellen.

  </Accordion>
  <Accordion title="Waarom is `openclaw/default` opgenomen?">
    `openclaw/default` is de stabiele alias voor de geconfigureerde standaardagent.

    Dit betekent dat clients één voorspelbare id kunnen blijven gebruiken, zelfs als de echte standaardagent-id tussen omgevingen verandert.

  </Accordion>
  <Accordion title="Hoe overschrijf ik het backendmodel?">
    Gebruik `x-openclaw-model`.

    Voorbeelden:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Als je dit weglaat, draait de geselecteerde agent met zijn normale geconfigureerde modelkeuze.

  </Accordion>
  <Accordion title="Hoe passen embeddings in dit contract?">
    `/v1/embeddings` gebruikt dezelfde agentdoel-`model`-id's.

    Gebruik `model: "openclaw/default"` of `model: "openclaw/<agentId>"`.
    Wanneer je een specifiek embeddingmodel nodig hebt, stuur je dit mee in `x-openclaw-model`.
    Zonder die header wordt het verzoek doorgegeven aan de normale embeddingsetup van de geselecteerde agent.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Zet `stream: true` om Server-Sent Events (SSE) te ontvangen:

- `Content-Type: text/event-stream`
- Elke eventregel is `data: <json>`
- Stream eindigt met `data: [DONE]`

## Chat-toolcontract

`/v1/chat/completions` ondersteunt een subset van functie-tools die compatibel is met gangbare OpenAI Chat-clients.

### Ondersteunde verzoekvelden

- `tools`: array van `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`
- `messages[*].role: "tool"` vervolgbeurten
- `messages[*].tool_call_id` voor het koppelen van toolresultaten terug aan een eerdere toolaanroep

### Niet-ondersteunde varianten

Het eindpunt retourneert `400 invalid_request_error` voor niet-ondersteunde toolvarianten, waaronder:

- niet-array `tools`
- niet-function-toolitems
- ontbrekende `tool.function.name`
- `tool_choice`-varianten zoals `allowed_tools` en `custom`
- `tool_choice: "required"` (nog niet afgedwongen tijdens runtime; wordt ondersteund zodra harde afdwinging is geïmplementeerd)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (dezelfde rationale als `required`)
- `tool_choice.function.name`-waarden die niet overeenkomen met opgegeven `tools`

### Vorm van niet-streaming toolrespons

Wanneer de agent besluit tools aan te roepen, gebruikt de respons:

- `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]`-items met:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (JSON-string)

Assistentcommentaar vóór de toolaanroep wordt geretourneerd in `choices[0].message.content` (mogelijk leeg).

### Vorm van streaming toolrespons

Wanneer `stream: true`, worden toolaanroepen uitgezonden als incrementele SSE-chunks:

- initiële assistentroldelta
- optionele assistentcommentaardelta's
- één of meer `delta.tool_calls`-chunks met toolidentiteit en argumentfragmenten
- laatste chunk met `finish_reason: "tool_calls"`
- `data: [DONE]`

Als `stream_options.include_usage=true`, wordt vóór `[DONE]` een afsluitende usage-chunk uitgezonden.

### Tool-vervolglus

Na ontvangst van `tool_calls` moet de client de gevraagde functie(s) uitvoeren en een vervolgverzoek sturen dat het volgende bevat:

- eerder assistentbericht met toolaanroep
- één of meer `role: "tool"`-berichten met overeenkomende `tool_call_id`

Hierdoor kan de gateway-agentrun dezelfde redeneerlus voortzetten en het uiteindelijke assistentantwoord produceren.

## Snelle setup voor Open WebUI

Voor een basisverbinding met Open WebUI:

- Base URL: `http://127.0.0.1:18789/v1`
- Docker op macOS base URL: `http://host.docker.internal:18789/v1`
- API-sleutel: je Gateway-bearer-token
- Model: `openclaw/default`

Verwacht gedrag:

- `GET /v1/models` moet `openclaw/default` tonen
- Open WebUI moet `openclaw/default` gebruiken als chatmodel-id
- Als je een specifieke backendprovider/model voor die agent wilt, stel dan het normale standaardmodel van de agent in of stuur `x-openclaw-model`

Snelle smoke-test:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Als dit `openclaw/default` retourneert, kunnen de meeste Open WebUI-setups verbinding maken met dezelfde base URL en token.

## Voorbeelden

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
- `openclaw/default` is altijd aanwezig, zodat één stabiele id in alle omgevingen werkt.
- Backendprovider/model-overschrijvingen horen in `x-openclaw-model`, niet in het OpenAI-veld `model`.
- `/v1/embeddings` ondersteunt `input` als een string of array van strings.

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [OpenAI](/nl/providers/openai)
