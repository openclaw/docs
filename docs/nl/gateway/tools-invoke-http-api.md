---
read_when:
    - Tools aanroepen zonder een volledige agentbeurt uit te voeren
    - Automatiseringen bouwen die handhaving van toolbeleid vereisen
summary: Roep één tool rechtstreeks aan via het Gateway-HTTP-eindpunt
title: API voor toolaanroepen
x-i18n:
    generated_at: "2026-06-27T17:38:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2023505f5a705b62e2fd685d64d3f9bd7788d09adfe89ac99604e6660c78ad8a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw's Gateway biedt een eenvoudig HTTP-eindpunt om één tool direct aan te roepen. Het is altijd ingeschakeld en gebruikt Gateway-authenticatie plus toolbeleid. Net als het OpenAI-compatibele `/v1/*`-oppervlak wordt shared-secret bearer-authenticatie behandeld als vertrouwde operatortoegang voor de hele Gateway.

- `POST /tools/invoke`
- Dezelfde poort als de Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/tools/invoke`

De standaard maximale payloadgrootte is 2 MB.

## Authenticatie

Gebruikt de Gateway-authenticatieconfiguratie.

Veelvoorkomende HTTP-authenticatiepaden:

- shared-secret-authenticatie (`gateway.auth.mode="token"` of `"password"`):
  `Authorization: Bearer <token-or-password>`
- vertrouwde HTTP-authenticatie met identiteit (`gateway.auth.mode="trusted-proxy"`):
  routeer via de geconfigureerde identity-aware proxy en laat die de
  vereiste identiteitsheaders injecteren
- open authenticatie via private ingress (`gateway.auth.mode="none"`):
  geen authenticatieheader vereist

Opmerkingen:

- Wanneer `gateway.auth.mode="token"`, gebruik `gateway.auth.token` (of `OPENCLAW_GATEWAY_TOKEN`).
- Wanneer `gateway.auth.mode="password"`, gebruik `gateway.auth.password` (of `OPENCLAW_GATEWAY_PASSWORD`).
- Wanneer `gateway.auth.mode="trusted-proxy"`, moet het HTTP-verzoek afkomstig zijn van een
  geconfigureerde vertrouwde proxybron; same-host loopback-proxy's vereisen expliciet
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Interne same-host aanroepers die de proxy omzeilen kunnen
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` gebruiken als lokale directe
  fallback. Elk bewijs in een `Forwarded`-, `X-Forwarded-*`- of `X-Real-IP`-header
  houdt het verzoek in plaats daarvan op het trusted-proxy-pad.
- Als `gateway.auth.rateLimit` is geconfigureerd en er te veel authenticatiefouten optreden, retourneert het eindpunt `429` met `Retry-After`.

## Beveiligingsgrens (belangrijk)

Behandel dit eindpunt als een oppervlak met **volledige operatortoegang** voor de Gateway-instantie.

- HTTP bearer-authenticatie hier is geen nauw scope-model per gebruiker.
- Een geldig Gateway-token/wachtwoord voor dit eindpunt moet worden behandeld als een owner/operator-referentie.
- Voor shared-secret-authenticatiemodi (`token` en `password`) herstelt het eindpunt de normale volledige operatorstandaarden, zelfs als de aanroeper een smallere `x-openclaw-scopes`-header verzendt.
- Shared-secret-authenticatie behandelt directe toolaanroepen op dit eindpunt ook als owner-sender-beurten.
- Vertrouwde HTTP-modi met identiteit (bijvoorbeeld trusted-proxy-authenticatie of `gateway.auth.mode="none"` op een private ingress) respecteren `x-openclaw-scopes` wanneer aanwezig en vallen anders terug op de normale standaardset operatorscopes.
- Houd dit eindpunt alleen op loopback/tailnet/private ingress; stel het niet direct bloot aan het openbare internet.

Authenticatiematrix:

- `gateway.auth.mode="token"` of `"password"` + `Authorization: Bearer ...`
  - bewijst bezit van het gedeelde Gateway-operatorgeheim
  - negeert smallere `x-openclaw-scopes`
  - herstelt de volledige standaardset operatorscopes:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt directe toolaanroepen op dit eindpunt als owner-sender-beurten
- vertrouwde HTTP-modi met identiteit (bijvoorbeeld trusted-proxy-authenticatie, of `gateway.auth.mode="none"` op private ingress)
  - authenticeren een externe vertrouwde identiteit of deploymentgrens
  - respecteren `x-openclaw-scopes` wanneer de header aanwezig is
  - vallen terug op de normale standaardset operatorscopes wanneer de header afwezig is
  - verliezen owner-semantiek alleen wanneer de aanroeper scopes expliciet vernauwt en `operator.admin` weglaat

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

- `tool` (string, vereist): toolnaam om aan te roepen.
- `action` (string, optioneel): wordt naar args gemapt als het toolschema `action` ondersteunt en de args-payload dit heeft weggelaten.
- `args` (object, optioneel): toolspecifieke argumenten.
- `sessionKey` (string, optioneel): doelsessiesleutel. Indien weggelaten of `"main"`, gebruikt de Gateway de geconfigureerde hoofdsessiesleutel (respecteert `session.mainKey` en standaardagent, of `global` in globale scope).
- `dryRun` (boolean, optioneel): gereserveerd voor toekomstig gebruik; momenteel genegeerd.

## Beleid + routinggedrag

Toolbeschikbaarheid wordt gefilterd via dezelfde beleidsketen die door Gateway-agenten wordt gebruikt:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- groepsbeleid (als de sessiesleutel naar een groep of kanaal verwijst)
- subagentbeleid (bij aanroepen met een subagent-sessiesleutel)

Als een tool niet door beleid is toegestaan, retourneert het eindpunt **404**.

Belangrijke grensopmerkingen:

- Exec-goedkeuringen zijn operatorvangrails, geen aparte autorisatiegrens voor dit HTTP-eindpunt. Als een tool hier bereikbaar is via Gateway-authenticatie + toolbeleid, voegt `/tools/invoke` geen extra goedkeuringsprompt per aanroep toe.
- Als `exec` hier bereikbaar is, behandel het dan als een muterend shelloppervlak. Het weigeren van `write`, `edit`, `apply_patch` of HTTP-tools voor filesystem-write maakt shelluitvoering niet alleen-lezen.
- Deel Gateway-bearer-referenties niet met niet-vertrouwde aanroepers. Als je scheiding tussen vertrouwensgrenzen nodig hebt, voer dan aparte gateways uit (en idealiter aparte OS-gebruikers/hosts).

Gateway HTTP past standaard ook een harde denylist toe (zelfs als sessiebeleid de tool toestaat):

- `exec` - directe opdrachtuitvoering (RCE-oppervlak)
- `spawn` - willekeurige aanmaak van childprocessen (RCE-oppervlak)
- `shell` - uitvoering van shellopdrachten (RCE-oppervlak)
- `fs_write` - willekeurige bestandsmutatie op de host
- `fs_delete` - willekeurige bestandsverwijdering op de host
- `fs_move` - willekeurige bestandsverplaatsing/-hernoeming op de host
- `apply_patch` - patchtoepassing kan willekeurige bestanden herschrijven
- `sessions_spawn` - sessieorkestratie; agents op afstand starten is RCE
- `sessions_send` - berichtinjectie tussen sessies
- `cron` - persistent automatiseringsbesturingsvlak
- `gateway` - Gateway-besturingsvlak; voorkomt herconfiguratie via HTTP
- `nodes` - node-opdrachtdoorsturing kan system.run bereiken op gekoppelde hosts
- `whatsapp_login` - interactieve setup waarvoor een terminal-QR-scan nodig is; blijft hangen via HTTP

Je kunt deze denylist aanpassen via `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list for owner/admin callers
      allow: ["gateway"],
    },
  },
}
```

`gateway.tools.allow` is een exposure-override, geen scope-upgrade. In
HTTP-modi met identiteit blijven `cron`, `gateway` en `nodes` niet beschikbaar
voor aanroepers die geen owner/admin-identiteit (`operator.admin`) hebben, zelfs wanneer
ze in `gateway.tools.allow` staan. Shared-secret bearer-authenticatie volgt nog steeds
de volledige trusted-operator-regel hierboven.

Om groepsbeleid context te helpen oplossen, kun je optioneel instellen:

- `x-openclaw-message-channel: <channel>` (voorbeeld: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (wanneer er meerdere accounts bestaan)

## Responses

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (ongeldig verzoek of fout in toolinvoer)
- `401` → unauthorized
- `429` → authenticatie rate-limited (`Retry-After` ingesteld)
- `404` → tool niet beschikbaar (niet gevonden of niet op allowlist)
- `405` → method not allowed
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
