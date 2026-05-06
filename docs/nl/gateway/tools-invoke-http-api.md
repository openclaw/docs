---
read_when:
    - Hulpmiddelen aanroepen zonder een volledige agentbeurt uit te voeren
    - Automatiseringen bouwen die handhaving van beleid voor hulpmiddelen vereisen
summary: Roep één tool rechtstreeks aan via het Gateway-HTTP-eindpunt
title: API voor het aanroepen van hulpmiddelen
x-i18n:
    generated_at: "2026-05-06T09:16:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fcd490d4eaa63f23b0d502e537c4094ade88afcdd04e2b7df1a5f0484a11c57
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw's Gateway biedt een eenvoudig HTTP-endpoint om één tool direct aan te roepen. Het is altijd ingeschakeld en gebruikt Gateway-authenticatie plus toolbeleid. Net als het OpenAI-compatibele `/v1/*`-oppervlak wordt bearer-authenticatie met een gedeeld geheim behandeld als vertrouwde operatortoegang voor de hele gateway.

- `POST /tools/invoke`
- Dezelfde poort als de Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/tools/invoke`

De standaard maximale payloadgrootte is 2 MB.

## Authenticatie

Gebruikt de Gateway-authenticatieconfiguratie.

Veelgebruikte HTTP-authenticatiepaden:

- authenticatie met gedeeld geheim (`gateway.auth.mode="token"` of `"password"`):
  `Authorization: Bearer <token-or-password>`
- vertrouwde HTTP-authenticatie met identiteit (`gateway.auth.mode="trusted-proxy"`):
  routeer via de geconfigureerde identiteitsbewuste proxy en laat die de
  vereiste identiteitsheaders injecteren
- open authenticatie via private ingress (`gateway.auth.mode="none"`):
  geen authenticatieheader vereist

Opmerkingen:

- Wanneer `gateway.auth.mode="token"` is, gebruik `gateway.auth.token` (of `OPENCLAW_GATEWAY_TOKEN`).
- Wanneer `gateway.auth.mode="password"` is, gebruik `gateway.auth.password` (of `OPENCLAW_GATEWAY_PASSWORD`).
- Wanneer `gateway.auth.mode="trusted-proxy"` is, moet het HTTP-verzoek afkomstig zijn van een
  geconfigureerde vertrouwde proxybron; loopback-proxy's op dezelfde host vereisen expliciet
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Als `gateway.auth.rateLimit` is geconfigureerd en er te veel authenticatiefouten optreden, retourneert het endpoint `429` met `Retry-After`.

## Beveiligingsgrens (belangrijk)

Behandel dit endpoint als een oppervlak met **volledige operatortoegang** voor de gateway-instantie.

- HTTP-bearer-authenticatie hier is geen smal scopemodel per gebruiker.
- Een geldig Gateway-token/-wachtwoord voor dit endpoint moet worden behandeld als een eigenaars-/operatorreferentie.
- Voor authenticatiemodi met gedeeld geheim (`token` en `password`) herstelt het endpoint de normale volledige operatorstandaarden, zelfs als de aanroeper een smallere `x-openclaw-scopes`-header meestuurt.
- Authenticatie met gedeeld geheim behandelt directe toolaanroepen op dit endpoint ook als owner-sender-beurten.
- Vertrouwde HTTP-modi met identiteit (bijvoorbeeld vertrouwde proxy-authenticatie of `gateway.auth.mode="none"` op een private ingress) respecteren `x-openclaw-scopes` wanneer aanwezig en vallen anders terug op de normale standaardscopeset voor operators.
- Houd dit endpoint alleen op loopback/tailnet/private ingress; stel het niet direct bloot aan het openbare internet.

Authenticatiematrix:

- `gateway.auth.mode="token"` of `"password"` + `Authorization: Bearer ...`
  - bewijst bezit van het gedeelde operatorgeheim van de gateway
  - negeert smallere `x-openclaw-scopes`
  - herstelt de volledige standaardscopeset voor operators:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt directe toolaanroepen op dit endpoint als owner-sender-beurten
- vertrouwde HTTP-modi met identiteit (bijvoorbeeld vertrouwde proxy-authenticatie, of `gateway.auth.mode="none"` op private ingress)
  - authenticeren een vertrouwde externe identiteit of implementatiegrens
  - respecteren `x-openclaw-scopes` wanneer de header aanwezig is
  - vallen terug op de normale standaardscopeset voor operators wanneer de header ontbreekt
  - verliezen eigenaarssemantiek alleen wanneer de aanroeper scopes expliciet vernauwt en `operator.admin` weglaat

## Request-body

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

Velden:

- `tool` (string, vereist): naam van de tool die moet worden aangeroepen.
- `action` (string, optioneel): wordt naar args gemapt als het toolschema `action` ondersteunt en de args-payload dit heeft weggelaten.
- `args` (object, optioneel): toolspecifieke argumenten.
- `sessionKey` (string, optioneel): doelsessiesleutel. Indien weggelaten of `"main"`, gebruikt de Gateway de geconfigureerde hoofdsessiesleutel (respecteert `session.mainKey` en standaardagent, of `global` in globale scope).
- `dryRun` (boolean, optioneel): gereserveerd voor toekomstig gebruik; wordt momenteel genegeerd.

## Beleid + routeringsgedrag

Toolbeschikbaarheid wordt gefilterd via dezelfde beleidsketen die door Gateway-agents wordt gebruikt:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- groepsbeleid (als de sessiesleutel naar een groep of kanaal verwijst)
- subagentbeleid (wanneer aangeroepen met een subagentsessiesleutel)

Als een tool niet door beleid is toegestaan, retourneert het endpoint **404**.

Belangrijke grensopmerkingen:

- Exec-goedkeuringen zijn operatorvangrails, geen afzonderlijke autorisatiegrens voor dit HTTP-endpoint. Als een tool hier bereikbaar is via Gateway-authenticatie + toolbeleid, voegt `/tools/invoke` geen extra goedkeuringsprompt per aanroep toe.
- Deel Gateway-bearerreferenties niet met onvertrouwde aanroepers. Als je scheiding over vertrouwensgrenzen heen nodig hebt, voer dan afzonderlijke gateways uit (en idealiter afzonderlijke OS-gebruikers/hosts).

Gateway HTTP past standaard ook een harde deny-lijst toe (zelfs als het sessiebeleid de tool toestaat):

- `exec` - directe opdrachtuitvoering (RCE-oppervlak)
- `spawn` - willekeurige aanmaak van childprocessen (RCE-oppervlak)
- `shell` - uitvoering van shellopdrachten (RCE-oppervlak)
- `fs_write` - willekeurige bestandsmutatie op de host
- `fs_delete` - willekeurige bestandsverwijdering op de host
- `fs_move` - willekeurige bestandsverplaatsing/-hernoeming op de host
- `apply_patch` - patchtoepassing kan willekeurige bestanden herschrijven
- `sessions_spawn` - sessieorkestratie; agents op afstand spawnen is RCE
- `sessions_send` - berichtinjectie tussen sessies
- `cron` - persistent automatiseringsbesturingsvlak
- `gateway` - gatewaybesturingsvlak; voorkomt herconfiguratie via HTTP
- `nodes` - node-opdrachtrelay kan system.run bereiken op gekoppelde hosts
- `whatsapp_login` - interactieve setup die een terminal-QR-scan vereist; blijft hangen op HTTP

Je kunt deze deny-lijst aanpassen via `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
      allow: ["gateway"],
    },
  },
}
```

Om groepsbeleid context te helpen bepalen, kun je optioneel instellen:

- `x-openclaw-message-channel: <channel>` (voorbeeld: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (wanneer er meerdere accounts bestaan)

## Responsen

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (ongeldig verzoek of fout in toolinvoer)
- `401` → niet geautoriseerd
- `429` → authenticatie is rate-limited (`Retry-After` ingesteld)
- `404` → tool niet beschikbaar (niet gevonden of niet op de allowlist)
- `405` → methode niet toegestaan
- `500` → `{ ok: false, error: { type, message } }` (onverwachte fout bij tooluitvoering; opgeschoond bericht)

## Voorbeeld

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## Gerelateerd

- [Gateway-protocol](/nl/gateway/protocol)
- [Tools en plugins](/nl/tools)
