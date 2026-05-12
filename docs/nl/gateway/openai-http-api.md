---
read_when:
    - Hulpmiddelen integreren die OpenAI Chat Completions verwachten
summary: Maak een OpenAI-compatibel HTTP-eindpunt /v1/chat/completions beschikbaar vanuit de Gateway
title: OpenAI-chatvoltooiingen
x-i18n:
    generated_at: "2026-05-12T15:43:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 21d901ab70908d6e4e3770e716319b961348c2a7ff6ef9bb2d0ffc6952a073f2
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

Gebruikt de authenticatieconfiguratie van de Gateway.

Veelvoorkomende HTTP-authenticatiepaden:

- authenticatie met gedeeld geheim (`gateway.auth.mode="token"` of `"password"`):
  `Authorization: Bearer <token-or-password>`
- vertrouwde identiteitsdragende HTTP-authenticatie (`gateway.auth.mode="trusted-proxy"`):
  routeer via de geconfigureerde identiteitsbewuste proxy en laat die de
  vereiste identiteitsheaders injecteren
- open authenticatie voor private ingress (`gateway.auth.mode="none"`):
  geen authenticatieheader vereist

Opmerkingen:

- Wanneer `gateway.auth.mode="token"` is, gebruik `gateway.auth.token` (of `OPENCLAW_GATEWAY_TOKEN`).
- Wanneer `gateway.auth.mode="password"` is, gebruik `gateway.auth.password` (of `OPENCLAW_GATEWAY_PASSWORD`).
- Wanneer `gateway.auth.mode="trusted-proxy"` is, moet de HTTP-aanvraag afkomstig zijn van een
  geconfigureerde vertrouwde proxybron; loopback-proxy's op dezelfde host vereisen expliciet
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Als `gateway.auth.rateLimit` is geconfigureerd en er te veel authenticatiefouten optreden, retourneert het eindpunt `429` met `Retry-After`.

## Beveiligingsgrens (belangrijk)

Behandel dit eindpunt als een oppervlak met **volledige operatortoegang** voor de gatewayinstantie.

- HTTP-bearer-authenticatie is hier geen smal scopemodel per gebruiker.
- Een geldig Gateway-token/wachtwoord voor dit eindpunt moet worden behandeld als een eigenaar-/operatorcredential.
- Aanvragen lopen via hetzelfde control-plane-agentpad als vertrouwde operatoracties.
- Er is geen afzonderlijke niet-eigenaar/per-gebruiker-toolgrens op dit eindpunt; zodra een aanroeper hier slaagt voor Gateway-authenticatie, behandelt OpenClaw die aanroeper als een vertrouwde operator voor deze gateway.
- Voor authenticatiemodi met gedeeld geheim (`token` en `password`) herstelt het eindpunt de normale volledige operatorstandaarden, zelfs als de aanroeper een smallere `x-openclaw-scopes`-header meestuurt.
- Vertrouwde identiteitsdragende HTTP-modi (bijvoorbeeld trusted proxy-authenticatie of `gateway.auth.mode="none"`) respecteren `x-openclaw-scopes` wanneer die aanwezig is en vallen anders terug op de normale standaardscopeset voor operators.
- Als het beleid van de doelagent gevoelige tools toestaat, kan dit eindpunt die gebruiken.
- Houd dit eindpunt alleen op loopback/tailnet/private ingress; stel het niet rechtstreeks bloot aan het openbare internet.

Authenticatiematrix:

- `gateway.auth.mode="token"` of `"password"` + `Authorization: Bearer ...`
  - bewijst bezit van het gedeelde gatewayoperatorgeheim
  - negeert smallere `x-openclaw-scopes`
  - herstelt de volledige standaardoperatorscopeset:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt chatbeurten op dit eindpunt als beurten van de eigenaar-afzender
- vertrouwde identiteitsdragende HTTP-modi (bijvoorbeeld trusted proxy-authenticatie, of `gateway.auth.mode="none"` op private ingress)
  - authenticeren een externe vertrouwde identiteit of implementatiegrens
  - respecteren `x-openclaw-scopes` wanneer de header aanwezig is
  - vallen terug op de normale standaardoperatorscopeset wanneer de header ontbreekt
  - verliezen alleen eigenaarsemantiek wanneer de aanroeper scopes expliciet vernauwt en `operator.admin` weglaat

Zie [Beveiliging](/nl/gateway/security) en [Externe toegang](/nl/gateway/remote).

## Agent-first modelcontract

OpenClaw behandelt het OpenAI-veld `model` als een **agentdoel**, niet als een ruwe providermodel-id.

- `model: "openclaw"` routeert naar de geconfigureerde standaardagent.
- `model: "openclaw/default"` routeert ook naar de geconfigureerde standaardagent.
- `model: "openclaw/<agentId>"` routeert naar een specifieke agent.

Optionele aanvraagheaders:

- `x-openclaw-model: <provider/model-or-bare-id>` overschrijft het backendmodel voor de geselecteerde agent.
- `x-openclaw-agent-id: <agentId>` blijft ondersteund als compatibiliteitsoverschrijving.
- `x-openclaw-session-key: <sessionKey>` beheert sessieroutering volledig.
- `x-openclaw-message-channel: <channel>` stelt de synthetische ingress-kanaalcontext in voor kanaalbewuste prompts en beleidsregels.

Compatibiliteitsaliassen die nog steeds worden geaccepteerd:

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

Standaard is het eindpunt **stateless per aanvraag** (bij elke aanroep wordt een nieuwe sessiesleutel gegenereerd).

Als de aanvraag een OpenAI-`user`-string bevat, leidt de Gateway daar een stabiele sessiesleutel uit af, zodat herhaalde aanroepen een agentsessie kunnen delen.

## Waarom dit oppervlak belangrijk is

Dit is de compatibiliteitsset met de hoogste hefboomwerking voor zelfgehoste frontends en tooling:

- De meeste Open WebUI-, LobeChat- en LibreChat-installaties verwachten `/v1/models`.
- Veel RAG-systemen verwachten `/v1/embeddings`.
- Bestaande OpenAI-chatclients kunnen meestal beginnen met `/v1/chat/completions`.
- Meer agent-native clients geven steeds vaker de voorkeur aan `/v1/responses`.

## Modellijst en agentroutering

<AccordionGroup>
  <Accordion title="Wat retourneert `/v1/models`?">
    Een OpenClaw-agentdoellijst.

    De geretourneerde id's zijn `openclaw`, `openclaw/default` en `openclaw/<agentId>`-vermeldingen.
    Gebruik ze rechtstreeks als OpenAI-`model`-waarden.

  </Accordion>
  <Accordion title="Vermeldt `/v1/models` agenten of subagenten?">
    Het vermeldt agentdoelen op topniveau, geen backendprovidermodellen en geen subagenten.

    Subagenten blijven interne uitvoeringstopologie. Ze verschijnen niet als pseudomodellen.

  </Accordion>
  <Accordion title="Waarom is `openclaw/default` opgenomen?">
    `openclaw/default` is de stabiele alias voor de geconfigureerde standaardagent.

    Dat betekent dat clients één voorspelbare id kunnen blijven gebruiken, zelfs als de echte standaardagent-id tussen omgevingen verandert.

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
    Wanneer je een specifiek embeddingmodel nodig hebt, stuur dat in `x-openclaw-model`.
    Zonder die header wordt de aanvraag doorgegeven aan de normale embeddingsconfiguratie van de geselecteerde agent.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Stel `stream: true` in om Server-Sent Events (SSE) te ontvangen:

- `Content-Type: text/event-stream`
- Elke eventregel is `data: <json>`
- Stream eindigt met `data: [DONE]`

## Chat-toolcontract

`/v1/chat/completions` ondersteunt een functie-toolsubset die compatibel is met gangbare OpenAI Chat-clients.

### Ondersteunde aanvraagvelden

- `tools`: array van `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`
- vervolgbeurten met `messages[*].role: "tool"`
- `messages[*].tool_call_id` om toolresultaten terug te koppelen aan een eerdere toolaanroep
- `max_completion_tokens`: getal; limiet per aanroep voor totale voltooiingstokens (inclusief redeneertokens). Huidige OpenAI Chat Completions-veldnaam; heeft de voorkeur wanneer zowel `max_completion_tokens` als `max_tokens` worden meegestuurd.
- `max_tokens`: getal; legacy-alias die wordt geaccepteerd voor achterwaartse compatibiliteit. Genegeerd wanneer `max_completion_tokens` ook aanwezig is.

Wanneer een van beide velden is ingesteld, wordt de waarde via het agent-streamparamkanaal doorgestuurd naar de upstreamprovider. De daadwerkelijke wire-veldnaam die naar de upstreamprovider wordt gestuurd, wordt gekozen door het providertransport: `max_completion_tokens` voor OpenAI-familie-eindpunten, en `max_tokens` voor providers die alleen de legacy-naam accepteren (zoals Mistral en Chutes).

### Niet-ondersteunde varianten

Het eindpunt retourneert `400 invalid_request_error` voor niet-ondersteunde toolvarianten, waaronder:

- niet-array `tools`
- niet-functie-toolvermeldingen
- ontbrekende `tool.function.name`
- `tool_choice`-varianten zoals `allowed_tools` en `custom`
- `tool_choice: "required"` (nog niet afgedwongen tijdens runtime; wordt ondersteund zodra harde afdwinging is geïmplementeerd)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (zelfde reden als `required`)
- `tool_choice.function.name`-waarden die niet overeenkomen met opgegeven `tools`

### Responsvorm voor niet-streaming tools

Wanneer de agent besluit tools aan te roepen, gebruikt de respons:

- `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]`-vermeldingen met:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (JSON-string)

Assistentcommentaar vóór de toolaanroep wordt geretourneerd in `choices[0].message.content` (mogelijk leeg).

### Responsvorm voor streaming tools

Wanneer `stream: true`, worden toolaanroepen uitgezonden als incrementele SSE-chunks:

- initiële assistentrol-delta
- optionele assistentcommentaar-delta's
- een of meer `delta.tool_calls`-chunks met toolidentiteit en argumentfragmenten
- laatste chunk met `finish_reason: "tool_calls"`
- `data: [DONE]`

Als `stream_options.include_usage=true`, wordt een afsluitende usage-chunk uitgezonden vóór `[DONE]`.

### Vervolgloop voor tools

Na ontvangst van `tool_calls` moet de client de aangevraagde functie(s) uitvoeren en een vervolgaanvraag sturen met:

- eerder assistent-toolaanroepbericht
- een of meer `role: "tool"`-berichten met overeenkomende `tool_call_id`

Hierdoor kan de gatewayagentrun dezelfde redeneerloop voortzetten en het uiteindelijke assistentantwoord produceren.

## Snelle installatie voor Open WebUI

Voor een eenvoudige Open WebUI-verbinding:

- Basis-URL: `http://127.0.0.1:18789/v1`
- Basis-URL voor Docker op macOS: `http://host.docker.internal:18789/v1`
- API-sleutel: je Gateway-bearertoken
- Model: `openclaw/default`

Verwacht gedrag:

- `GET /v1/models` moet `openclaw/default` vermelden
- Open WebUI moet `openclaw/default` gebruiken als chatmodel-id
- Als je een specifieke backendprovider/model voor die agent wilt, stel dan het normale standaardmodel van de agent in of stuur `x-openclaw-model`

Snelle smoke-test:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Als dat `openclaw/default` retourneert, kunnen de meeste Open WebUI-installaties verbinden met dezelfde basis-URL en hetzelfde token.

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

- `/v1/models` retourneert OpenClaw-agentdoelen, geen onbewerkte providercatalogi.
- `openclaw/default` is altijd aanwezig, zodat één stabiele id in verschillende omgevingen werkt.
- Backend-provider-/modeloverschrijvingen horen thuis in `x-openclaw-model`, niet in het OpenAI-veld `model`.
- `/v1/embeddings` ondersteunt `input` als tekenreeks of als array van tekenreeksen.

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [OpenAI](/nl/providers/openai)
