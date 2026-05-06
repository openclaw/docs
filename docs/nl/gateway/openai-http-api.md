---
read_when:
    - Tools integreren die OpenAI Chat Completions verwachten
summary: Stel een OpenAI-compatibel /v1/chat/completions HTTP-eindpunt beschikbaar vanuit de Gateway
title: OpenAI-chatvoltooiingen
x-i18n:
    generated_at: "2026-05-06T09:14:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8cd0995cf5f897ae8f99f35fc4b8ea28ebde3cba41da0f3e768ec1de7874b2f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw's Gateway kan een klein OpenAI-compatibel Chat Completions-eindpunt aanbieden.

Dit eindpunt is **standaard uitgeschakeld**. Schakel het eerst in de configuratie in.

- `POST /v1/chat/completions`
- Dezelfde poort als de Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/v1/chat/completions`

Wanneer het OpenAI-compatibele HTTP-oppervlak van de Gateway is ingeschakeld, biedt het ook:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Onder de motorkap worden verzoeken uitgevoerd als een normale Gateway-agentrun (hetzelfde codepad als `openclaw agent`), dus routering/machtigingen/configuratie komen overeen met je Gateway.

## Authenticatie

Gebruikt de Gateway-authenticatieconfiguratie.

Veelgebruikte HTTP-authenticatiepaden:

- gedeeld-geheim-authenticatie (`gateway.auth.mode="token"` of `"password"`):
  `Authorization: Bearer <token-or-password>`
- vertrouwde HTTP-authenticatie met identiteit (`gateway.auth.mode="trusted-proxy"`):
  routeer via de geconfigureerde identiteitsbewuste proxy en laat die de
  vereiste identiteitsheaders injecteren
- open authenticatie voor privé-ingress (`gateway.auth.mode="none"`):
  geen authenticatieheader vereist

Opmerkingen:

- Wanneer `gateway.auth.mode="token"` is, gebruik je `gateway.auth.token` (of `OPENCLAW_GATEWAY_TOKEN`).
- Wanneer `gateway.auth.mode="password"` is, gebruik je `gateway.auth.password` (of `OPENCLAW_GATEWAY_PASSWORD`).
- Wanneer `gateway.auth.mode="trusted-proxy"` is, moet het HTTP-verzoek afkomstig zijn van een
  geconfigureerde vertrouwde proxybron; loopback-proxy's op dezelfde host vereisen expliciet
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Als `gateway.auth.rateLimit` is geconfigureerd en er te veel authenticatiefouten optreden, retourneert het eindpunt `429` met `Retry-After`.

## Beveiligingsgrens (belangrijk)

Behandel dit eindpunt als een **oppervlak met volledige operatortoegang** voor de gateway-instantie.

- HTTP-bearer-authenticatie hier is geen smal scopemodel per gebruiker.
- Een geldige Gateway-token/wachtwoord voor dit eindpunt moet worden behandeld als een eigenaar-/operatorreferentie.
- Verzoeken lopen via hetzelfde control-plane-agentpad als vertrouwde operatoracties.
- Er is geen afzonderlijke niet-eigenaar-/per-gebruiker-toolgrens op dit eindpunt; zodra een aanroeper hier Gateway-authenticatie doorstaat, behandelt OpenClaw die aanroeper als een vertrouwde operator voor deze gateway.
- Voor gedeeld-geheim-authenticatiemodi (`token` en `password`) herstelt het eindpunt de normale volledige operatorstandaarden, zelfs als de aanroeper een smallere `x-openclaw-scopes`-header verzendt.
- Vertrouwde HTTP-modi met identiteit (bijvoorbeeld vertrouwde proxy-authenticatie of `gateway.auth.mode="none"`) respecteren `x-openclaw-scopes` wanneer aanwezig en vallen anders terug op de normale standaardset operatorscopes.
- Als het doelagentbeleid gevoelige tools toestaat, kan dit eindpunt ze gebruiken.
- Houd dit eindpunt alleen op loopback/tailnet/privé-ingress; stel het niet rechtstreeks bloot aan het openbare internet.

Authenticatiematrix:

- `gateway.auth.mode="token"` of `"password"` + `Authorization: Bearer ...`
  - bewijst bezit van het gedeelde gateway-operatorgeheim
  - negeert smallere `x-openclaw-scopes`
  - herstelt de volledige standaardset operatorscopes:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt chatbeurten op dit eindpunt als beurten van de eigenaar-afzender
- vertrouwde HTTP-modi met identiteit (bijvoorbeeld vertrouwde proxy-authenticatie, of `gateway.auth.mode="none"` op privé-ingress)
  - authenticeren een externe vertrouwde identiteit of implementatiegrens
  - respecteren `x-openclaw-scopes` wanneer de header aanwezig is
  - vallen terug op de normale standaardset operatorscopes wanneer de header ontbreekt
  - verliezen alleen eigenaarsemantiek wanneer de aanroeper scopes expliciet versmalt en `operator.admin` weglaat

Zie [Beveiliging](/nl/gateway/security) en [Externe toegang](/nl/gateway/remote).

## Agent-first modelcontract

OpenClaw behandelt het OpenAI-veld `model` als een **agentdoel**, niet als een ruwe providermodel-id.

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

## Sessiegerag

Standaard is het eindpunt **staatloos per verzoek** (bij elke aanroep wordt een nieuwe sessiesleutel gegenereerd).

Als het verzoek een OpenAI-`user`-tekenreeks bevat, leidt de Gateway daar een stabiele sessiesleutel uit af, zodat herhaalde aanroepen een agentsessie kunnen delen.

## Waarom dit oppervlak belangrijk is

Dit is de compatibiliteitsset met de grootste hefboomwerking voor zelfgehoste frontends en tooling:

- De meeste Open WebUI-, LobeChat- en LibreChat-setups verwachten `/v1/models`.
- Veel RAG-systemen verwachten `/v1/embeddings`.
- Bestaande OpenAI-chatclients kunnen meestal beginnen met `/v1/chat/completions`.
- Meer agent-native clients geven steeds vaker de voorkeur aan `/v1/responses`.

## Modellijst en agentroutering

<AccordionGroup>
  <Accordion title="What does `/v1/models` return?">
    Een lijst met OpenClaw-agentdoelen.

    De geretourneerde ids zijn `openclaw`, `openclaw/default` en `openclaw/<agentId>`-items.
    Gebruik ze rechtstreeks als OpenAI-`model`-waarden.

  </Accordion>
  <Accordion title="Does `/v1/models` list agents or sub-agents?">
    Het vermeldt agentdoelen op topniveau, geen backendprovidermodellen en geen subagents.

    Subagents blijven interne uitvoeringstopologie. Ze verschijnen niet als pseudomodellen.

  </Accordion>
  <Accordion title="Why is `openclaw/default` included?">
    `openclaw/default` is de stabiele alias voor de geconfigureerde standaardagent.

    Dat betekent dat clients één voorspelbare id kunnen blijven gebruiken, zelfs als de echte standaardagent-id tussen omgevingen verandert.

  </Accordion>
  <Accordion title="How do I override the backend model?">
    Gebruik `x-openclaw-model`.

    Voorbeelden:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Als je dit weglaat, draait de geselecteerde agent met zijn normale geconfigureerde modelkeuze.

  </Accordion>
  <Accordion title="How do embeddings fit this contract?">
    `/v1/embeddings` gebruikt dezelfde `model`-ids voor agentdoelen.

    Gebruik `model: "openclaw/default"` of `model: "openclaw/<agentId>"`.
    Wanneer je een specifiek embeddingmodel nodig hebt, stuur je dit mee in `x-openclaw-model`.
    Zonder die header wordt het verzoek doorgegeven aan de normale embeddingsetup van de geselecteerde agent.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Stel `stream: true` in om Server-Sent Events (SSE) te ontvangen:

- `Content-Type: text/event-stream`
- Elke eventregel is `data: <json>`
- De stream eindigt met `data: [DONE]`

## Snelle Open WebUI-installatie

Voor een basisverbinding met Open WebUI:

- Basis-URL: `http://127.0.0.1:18789/v1`
- Basis-URL voor Docker op macOS: `http://host.docker.internal:18789/v1`
- API-sleutel: je Gateway-bearertoken
- Model: `openclaw/default`

Verwacht gedrag:

- `GET /v1/models` moet `openclaw/default` vermelden
- Open WebUI moet `openclaw/default` gebruiken als chatmodel-id
- Als je voor die agent een specifieke backendprovider/model wilt, stel dan het normale standaardmodel van de agent in of stuur `x-openclaw-model`

Snelle smoke-test:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Als dat `openclaw/default` retourneert, kunnen de meeste Open WebUI-setups verbinding maken met dezelfde basis-URL en token.

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
- Backendprovider-/modeloverschrijvingen horen in `x-openclaw-model`, niet in het OpenAI-veld `model`.
- `/v1/embeddings` ondersteunt `input` als een tekenreeks of een array van tekenreeksen.

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [OpenAI](/nl/providers/openai)
