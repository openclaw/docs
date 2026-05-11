---
read_when:
    - Hulpmiddelen aanroepen zonder een volledige agentbeurt uit te voeren
    - Automatiseringen bouwen die afdwinging van toolbeleid vereisen
summary: Roep één hulpmiddel rechtstreeks aan via het Gateway-HTTP-eindpunt
title: API voor het aanroepen van tools
x-i18n:
    generated_at: "2026-05-11T20:33:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 531e77673fb9c06d0cc8f8145d874e22f7e590dc3e4c5dee1574874af5666886
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw's Gateway biedt een eenvoudig HTTP-eindpunt om één tool direct aan te roepen. Het is altijd ingeschakeld en gebruikt Gateway-authenticatie plus toolbeleid. Net als het OpenAI-compatibele `/v1/*`-oppervlak wordt gedeelde-geheim bearer-authenticatie behandeld als vertrouwde operatortoegang voor de hele Gateway.

- `POST /tools/invoke`
- Zelfde poort als de Gateway (WS + HTTP-multiplex): `http://<gateway-host>:<port>/tools/invoke`

De standaard maximale payloadgrootte is 2 MB.

## Authenticatie

Gebruikt de Gateway-authenticatieconfiguratie.

Gangbare HTTP-authenticatiepaden:

- gedeelde-geheim-authenticatie (`gateway.auth.mode="token"` of `"password"`):
  `Authorization: Bearer <token-or-password>`
- vertrouwde identiteitsdragende HTTP-authenticatie (`gateway.auth.mode="trusted-proxy"`):
  routeer via de geconfigureerde identiteitsbewuste proxy en laat deze de
  vereiste identiteitsheaders injecteren
- open authenticatie voor private ingress (`gateway.auth.mode="none"`):
  geen authenticatieheader vereist

Opmerkingen:

- Wanneer `gateway.auth.mode="token"` is, gebruik `gateway.auth.token` (of `OPENCLAW_GATEWAY_TOKEN`).
- Wanneer `gateway.auth.mode="password"` is, gebruik `gateway.auth.password` (of `OPENCLAW_GATEWAY_PASSWORD`).
- Wanneer `gateway.auth.mode="trusted-proxy"` is, moet het HTTP-verzoek afkomstig zijn van een
  geconfigureerde vertrouwde proxybron; loopback-proxy's op dezelfde host vereisen expliciet
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Als `gateway.auth.rateLimit` is geconfigureerd en er te veel authenticatiefouten optreden, retourneert het eindpunt `429` met `Retry-After`.

## Beveiligingsgrens (belangrijk)

Behandel dit eindpunt als een oppervlak met **volledige operatortoegang** voor de Gateway-instantie.

- HTTP bearer-authenticatie is hier geen beperkt scope-model per gebruiker.
- Een geldig Gateway-token/wachtwoord voor dit eindpunt moet worden behandeld als een eigenaar-/operatorreferentie.
- Voor gedeelde-geheim-authenticatiemodi (`token` en `password`) herstelt het eindpunt de normale volledige operatorstandaarden, zelfs als de aanroeper een beperktere `x-openclaw-scopes`-header verzendt.
- Gedeelde-geheim-authenticatie behandelt directe toolaanroepen op dit eindpunt ook als eigenaar-afzenderbeurten.
- Vertrouwde identiteitsdragende HTTP-modi (bijvoorbeeld vertrouwde-proxy-authenticatie of `gateway.auth.mode="none"` op een private ingress) respecteren `x-openclaw-scopes` wanneer aanwezig en vallen anders terug op de normale standaardset operatorscopes.
- Houd dit eindpunt alleen op loopback/tailnet/private ingress; stel het niet direct bloot aan het openbare internet.

Authenticatiematrix:

- `gateway.auth.mode="token"` of `"password"` + `Authorization: Bearer ...`
  - bewijst bezit van het gedeelde Gateway-operatorgeheim
  - negeert beperktere `x-openclaw-scopes`
  - herstelt de volledige standaardset operatorscopes:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt directe toolaanroepen op dit eindpunt als eigenaar-afzenderbeurten
- vertrouwde identiteitsdragende HTTP-modi (bijvoorbeeld vertrouwde-proxy-authenticatie, of `gateway.auth.mode="none"` op private ingress)
  - authenticeren een externe vertrouwde identiteit of implementatiegrens
  - respecteren `x-openclaw-scopes` wanneer de header aanwezig is
  - vallen terug op de normale standaardset operatorscopes wanneer de header ontbreekt
  - verliezen eigenaarsemantiek alleen wanneer de aanroeper scopes expliciet beperkt en `operator.admin` weglaat

## Verzoekbody

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
- `dryRun` (boolean, optioneel): gereserveerd voor toekomstig gebruik; momenteel genegeerd.

## Beleid + routeringsgedrag

Beschikbaarheid van tools wordt gefilterd via dezelfde beleidsketen die door Gateway-agenten wordt gebruikt:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- groepsbeleid (als de sessiesleutel naar een groep of kanaal verwijst)
- subagentbeleid (bij aanroepen met een subagent-sessiesleutel)

Als een tool niet door beleid is toegestaan, retourneert het eindpunt **404**.

Belangrijke grensopmerkingen:

- Exec-goedkeuringen zijn operatorvangrails, geen afzonderlijke autorisatiegrens voor dit HTTP-eindpunt. Als een tool hier bereikbaar is via Gateway-authenticatie + toolbeleid, voegt `/tools/invoke` geen extra goedkeuringsprompt per aanroep toe.
- Als `exec` hier bereikbaar is, behandel het dan als een muterend shell-oppervlak. Het weigeren van `write`, `edit`, `apply_patch` of HTTP-bestandssysteemschrijftools maakt shell-uitvoering niet alleen-lezen.
- Deel Gateway bearer-referenties niet met niet-vertrouwde aanroepers. Als je scheiding tussen vertrouwensgrenzen nodig hebt, draai dan afzonderlijke Gateways (en idealiter afzonderlijke OS-gebruikers/hosts).

Gateway HTTP past standaard ook een harde weigeringslijst toe (zelfs als sessiebeleid de tool toestaat):

- `exec` - directe opdrachtuitvoering (RCE-oppervlak)
- `spawn` - willekeurige creatie van childprocessen (RCE-oppervlak)
- `shell` - uitvoering van shell-opdrachten (RCE-oppervlak)
- `fs_write` - willekeurige bestandsmutatie op de host
- `fs_delete` - willekeurige bestandsverwijdering op de host
- `fs_move` - willekeurige bestandsverplaatsing/-hernoeming op de host
- `apply_patch` - toepassen van patches kan willekeurige bestanden herschrijven
- `sessions_spawn` - sessieorkestratie; agents op afstand starten is RCE
- `sessions_send` - berichtinjectie tussen sessies
- `cron` - persistent automatiseringscontrolevlak
- `gateway` - Gateway-controlevlak; voorkomt herconfiguratie via HTTP
- `nodes` - node-opdrachtrelay kan `system.run` bereiken op gekoppelde hosts
- `whatsapp_login` - interactieve installatie die een QR-scan in de terminal vereist; loopt vast via HTTP

Je kunt deze weigeringslijst aanpassen via `gateway.tools`:

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

Om groepsbeleid te helpen context op te lossen, kun je optioneel instellen:

- `x-openclaw-message-channel: <channel>` (voorbeeld: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (wanneer er meerdere accounts bestaan)

## Antwoorden

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (ongeldig verzoek of invoerfout voor tool)
- `401` → niet geautoriseerd
- `429` → authenticatie beperkt door rate limit (`Retry-After` ingesteld)
- `404` → tool niet beschikbaar (niet gevonden of niet op de toelatingslijst)
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
