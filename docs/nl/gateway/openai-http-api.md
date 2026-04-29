---
read_when:
    - Tools integreren die OpenAI Chat Completions verwachten
summary: Stel vanuit de Gateway een OpenAI-compatibel /v1/chat/completions-HTTP-eindpunt beschikbaar
title: OpenAI-chatvoltooiingen
x-i18n:
    generated_at: "2026-04-29T22:46:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a19f9d9d6d8ce6d605f8af5324ae3eb0c100c167609341c8dfb569970b0b2c9
    source_path: gateway/openai-http-api.md
    workflow: 16
---

De Gateway van OpenClaw kan een klein OpenAI-compatibel Chat Completions-eindpunt aanbieden.

Dit eindpunt is **standaard uitgeschakeld**. Schakel het eerst in de configuratie in.

- `POST /v1/chat/completions`
- Dezelfde poort als de Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/v1/chat/completions`

Wanneer het OpenAI-compatibele HTTP-oppervlak van de Gateway is ingeschakeld, biedt het ook:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Onder de motorkap worden aanvragen uitgevoerd als een normale Gateway-agentrun (hetzelfde codepad als `openclaw agent`), zodat routering/rechten/configuratie overeenkomen met je Gateway.

## Authenticatie

Gebruikt de Gateway-authconfiguratie.

Veelvoorkomende HTTP-authpaden:

- authenticatie met gedeeld geheim (`gateway.auth.mode="token"` of `"password"`):
  `Authorization: Bearer <token-or-password>`
- vertrouwde HTTP-authenticatie met identiteit (`gateway.auth.mode="trusted-proxy"`):
  routeer via de geconfigureerde identiteitsbewuste proxy en laat die de
  vereiste identiteitsheaders injecteren
- open authenticatie via private ingress (`gateway.auth.mode="none"`):
  geen authheader vereist

Opmerkingen:

- Wanneer `gateway.auth.mode="token"` is, gebruik `gateway.auth.token` (of `OPENCLAW_GATEWAY_TOKEN`).
- Wanneer `gateway.auth.mode="password"` is, gebruik `gateway.auth.password` (of `OPENCLAW_GATEWAY_PASSWORD`).
- Wanneer `gateway.auth.mode="trusted-proxy"` is, moet de HTTP-aanvraag afkomstig zijn van een
  geconfigureerde vertrouwde proxybron; local loopback-proxy's op dezelfde host vereisen expliciet
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Als `gateway.auth.rateLimit` is geconfigureerd en er te veel authfouten optreden, retourneert het eindpunt `429` met `Retry-After`.

## Beveiligingsgrens (belangrijk)

Behandel dit eindpunt als een oppervlak met **volledige operatortoegang** voor de Gateway-instantie.

- HTTP-bearer-authenticatie hier is geen smal scopemodel per gebruiker.
- Een geldig Gateway-token/-wachtwoord voor dit eindpunt moet worden behandeld als een eigenaar-/operatorreferentie.
- Aanvragen lopen via hetzelfde control-plane-agentpad als vertrouwde operatoracties.
- Er is geen afzonderlijke toolgrens voor niet-eigenaren/per gebruiker op dit eindpunt; zodra een aanroeper hier door Gateway-authenticatie komt, behandelt OpenClaw die aanroeper als een vertrouwde operator voor deze Gateway.
- Voor authmodi met gedeeld geheim (`token` en `password`) herstelt het eindpunt de normale volledige operatorstandaarden, zelfs als de aanroeper een smallere `x-openclaw-scopes`-header meestuurt.
- Vertrouwde HTTP-modi met identiteit (bijvoorbeeld vertrouwde proxy-authenticatie of `gateway.auth.mode="none"`) respecteren `x-openclaw-scopes` wanneer aanwezig en vallen anders terug op de normale standaardscopeset voor operators.
- Als het beleid van de doelagent gevoelige tools toestaat, kan dit eindpunt die gebruiken.
- Houd dit eindpunt alleen op loopback/tailnet/private ingress; stel het niet rechtstreeks bloot aan het openbare internet.

Authmatrix:

- `gateway.auth.mode="token"` of `"password"` + `Authorization: Bearer ...`
  - bewijst bezit van het gedeelde Gateway-operatorgeheim
  - negeert smallere `x-openclaw-scopes`
  - herstelt de volledige standaardscopeset voor operators:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt chatbeurten op dit eindpunt als beurten van de eigenaar-afzender
- vertrouwde HTTP-modi met identiteit (bijvoorbeeld vertrouwde proxy-authenticatie, of `gateway.auth.mode="none"` op private ingress)
  - authenticeren een externe vertrouwde identiteit of implementatiegrens
  - respecteren `x-openclaw-scopes` wanneer de header aanwezig is
  - vallen terug op de normale standaardscopeset voor operators wanneer de header afwezig is
  - verliezen eigenaarssemantiek alleen wanneer de aanroeper scopes expliciet versmalt en `operator.admin` weglaat

Zie [Beveiliging](/nl/gateway/security) en [Externe toegang](/nl/gateway/remote).

## Agent-first modelcontract

OpenClaw behandelt het OpenAI-veld `model` als een **agentdoel**, niet als een onbewerkte model-id van een provider.

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

## Sessiegedrag

Standaard is het eindpunt **stateless per aanvraag** (bij elke aanroep wordt een nieuwe sessiesleutel gegenereerd).

Als de aanvraag een OpenAI-`user`-tekenreeks bevat, leidt de Gateway daar een stabiele sessiesleutel uit af, zodat herhaalde aanroepen een agentsessie kunnen delen.

## Waarom dit oppervlak belangrijk is

Dit is de compatibiliteitsset met de meeste hefboomwerking voor zelfgehoste frontends en tooling:

- De meeste Open WebUI-, LobeChat- en LibreChat-setups verwachten `/v1/models`.
- Veel RAG-systemen verwachten `/v1/embeddings`.
- Bestaande OpenAI-chatclients kunnen meestal beginnen met `/v1/chat/completions`.
- Meer agent-native clients geven steeds vaker de voorkeur aan `/v1/responses`.

## Modellijst en agentroutering

<AccordionGroup>
  <Accordion title="Wat retourneert `/v1/models`?">
    Een lijst met OpenClaw-agentdoelen.

    De geretourneerde id's zijn vermeldingen voor `openclaw`, `openclaw/default` en `openclaw/<agentId>`.
    Gebruik ze rechtstreeks als OpenAI-`model`-waarden.

  </Accordion>
  <Accordion title="Vermeldt `/v1/models` agents of subagents?">
    Het vermeldt agentdoelen op het hoogste niveau, geen backendprovidermodellen en geen subagents.

    Subagents blijven interne uitvoeringstopologie. Ze verschijnen niet als pseudomodellen.

  </Accordion>
  <Accordion title="Waarom is `openclaw/default` opgenomen?">
    `openclaw/default` is de stabiele alias voor de geconfigureerde standaardagent.

    Dat betekent dat clients één voorspelbare id kunnen blijven gebruiken, zelfs als de echte id van de standaardagent tussen omgevingen verandert.

  </Accordion>
  <Accordion title="Hoe overschrijf ik het backendmodel?">
    Gebruik `x-openclaw-model`.

    Voorbeelden:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Als je dit weglaat, draait de geselecteerde agent met zijn normaal geconfigureerde modelkeuze.

  </Accordion>
  <Accordion title="Hoe passen embeddings in dit contract?">
    `/v1/embeddings` gebruikt dezelfde `model`-id's voor agentdoelen.

    Gebruik `model: "openclaw/default"` of `model: "openclaw/<agentId>"`.
    Wanneer je een specifiek embeddingmodel nodig hebt, stuur je dat in `x-openclaw-model`.
    Zonder die header wordt de aanvraag doorgestuurd naar de normale embeddingconfiguratie van de geselecteerde agent.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Stel `stream: true` in om Server-Sent Events (SSE) te ontvangen:

- `Content-Type: text/event-stream`
- Elke eventregel is `data: <json>`
- De stream eindigt met `data: [DONE]`

## Snelle Open WebUI-configuratie

Voor een basisverbinding met Open WebUI:

- Base URL: `http://127.0.0.1:18789/v1`
- Docker op macOS Base URL: `http://host.docker.internal:18789/v1`
- API-sleutel: je Gateway-bearer-token
- Model: `openclaw/default`

Verwacht gedrag:

- `GET /v1/models` zou `openclaw/default` moeten vermelden
- Open WebUI zou `openclaw/default` moeten gebruiken als chatmodel-id
- Als je een specifieke backendprovider/model voor die agent wilt, stel dan het normale standaardmodel van de agent in of stuur `x-openclaw-model`

Snelle rooktest:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Als dat `openclaw/default` retourneert, kunnen de meeste Open WebUI-setups verbinden met dezelfde Base URL en hetzelfde token.

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
- `openclaw/default` is altijd aanwezig, zodat één stabiele id in alle omgevingen werkt.
- Overschrijvingen voor backendprovider/model horen in `x-openclaw-model`, niet in het OpenAI-veld `model`.
- `/v1/embeddings` ondersteunt `input` als tekenreeks of array van tekenreeksen.

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [OpenAI](/nl/providers/openai)
