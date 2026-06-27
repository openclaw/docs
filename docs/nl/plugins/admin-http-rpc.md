---
read_when:
    - Hosttools bouwen die de Gateway WebSocket RPC-client niet kunnen gebruiken
    - Gateway-beheerautomatisering beschikbaar maken achter een private vertrouwde ingress
    - Het beveiligingsmodel voor HTTP-toegang tot Gateway-methoden controleren
summary: Stel geselecteerde Gateway-control-plane-methoden beschikbaar via de gebundelde, opt-in admin-http-rpc-plugin
title: Admin HTTP RPC-Plugin
x-i18n:
    generated_at: "2026-06-27T17:49:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f701ef6be7457cd518ecb80b7ec5dade61bb057d62f4ca90984a4c1aa8fdf700
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

De gebundelde `admin-http-rpc` Plugin stelt geselecteerde Gateway-besturingsvlakmethoden beschikbaar via HTTP voor vertrouwde hostautomatisering die de normale Gateway WebSocket RPC-client niet kan gebruiken.

De Plugin wordt meegeleverd met OpenClaw, maar staat standaard uit. Wanneer deze is uitgeschakeld, wordt de route niet geregistreerd. Wanneer deze is ingeschakeld, voegt deze toe:

- `POST /api/v1/admin/rpc`
- dezelfde listener als de Gateway: `http://<gateway-host>:<port>/api/v1/admin/rpc`

Schakel deze alleen in voor private hosttools, tailnet-automatisering of een vertrouwde interne ingress. Stel deze route niet rechtstreeks bloot aan het openbare internet.

## Voordat u dit inschakelt

Admin HTTP RPC is een volledig operatorbesturingsvlak. Elke caller die slaagt voor Gateway HTTP-authenticatie kan de toegestane methoden op deze pagina aanroepen.

Gebruik dit wanneer al het volgende waar is:

- De caller wordt vertrouwd om de Gateway te beheren.
- De caller kan de WebSocket RPC-client niet gebruiken.
- De route is alleen bereikbaar op loopback, een tailnet of een private geauthenticeerde ingress.
- U hebt de toegestane methoden beoordeeld en ze passen bij de automatisering die u wilt uitvoeren.

Gebruik het WebSocket RPC-pad voor OpenClaw-clients en interactieve tools die een Gateway WebSocket-verbinding open kunnen houden.

## Inschakelen

Schakel de gebundelde Plugin in:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Config">
    ```json5
    {
      plugins: {
        entries: {
          "admin-http-rpc": { enabled: true },
        },
      },
    }
    ```
  </Tab>
</Tabs>

De route wordt geregistreerd tijdens het opstarten van de Plugin. Herstart de Gateway nadat u de Plugin-configuratie hebt gewijzigd.

Schakel deze uit wanneer u het HTTP-oppervlak niet meer nodig hebt:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## De route verifiëren

Gebruik `health` als de kleinste veilige aanvraag:

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

Een succesvolle respons heeft `ok: true`:

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

Wanneer de Plugin is uitgeschakeld, retourneert de route `404` omdat deze niet is geregistreerd.

## Authenticatie

De Plugin-route gebruikt Gateway HTTP-authenticatie.

Veelgebruikte authenticatiepaden:

- gedeeld-geheim-authenticatie (`gateway.auth.mode="token"` of `"password"`): `Authorization: Bearer <token-or-password>`
- vertrouwde identiteitdragende HTTP-authenticatie (`gateway.auth.mode="trusted-proxy"`): routeer via de geconfigureerde identiteitsbewuste proxy en laat deze de vereiste identiteitsheaders injecteren
- open authenticatie via private ingress (`gateway.auth.mode="none"`): geen authenticatieheader vereist

## Beveiligingsmodel

Behandel deze Plugin als een volledig Gateway-operatoroppervlak.

- Het inschakelen van de Plugin biedt bewust toegang tot de toegestane admin-RPC-methoden op `/api/v1/admin/rpc`.
- De Plugin declareert het gereserveerde `contracts.gatewayMethodDispatch: ["authenticated-request"]` manifestcontract zodat de met Gateway geauthenticeerde HTTP-route besturingsvlakmethoden binnen het proces kan dispatchen.
- Bearer-authenticatie met gedeeld geheim bewijst bezit van het gateway-operatorgeheim.
- Voor `token`- en `password`-authenticatie worden smallere `x-openclaw-scopes`-headers genegeerd en worden de normale volledige operatorstandaarden hersteld.
- Vertrouwde identiteitdragende HTTP-modi respecteren `x-openclaw-scopes` wanneer aanwezig.
- `gateway.auth.mode="none"` betekent dat deze route niet geauthenticeerd is als de Plugin is ingeschakeld. Gebruik dat alleen achter een private ingress die u volledig vertrouwt.
- Aanvragen worden, nadat de authenticatie van de Plugin-route is geslaagd, via dezelfde Gateway-method handlers en scopecontroles gedispatcht als WebSocket RPC.
- Houd deze route op loopback, tailnet of een private vertrouwde ingress. Stel deze niet rechtstreeks bloot aan het openbare internet.
- Plugin-manifestcontracten zijn geen sandbox. Ze voorkomen onbedoeld gebruik van gereserveerde SDK-helpers; vertrouwde Plugins draaien nog steeds in het Gateway-proces.

Gebruik afzonderlijke gateways wanneer callers vertrouwensgrenzen overschrijden.

## Aanvraag

```http
POST /api/v1/admin/rpc
Authorization: Bearer <gateway-token>
Content-Type: application/json
```

```json
{
  "id": "optional-request-id",
  "method": "health",
  "params": {}
}
```

Velden:

- `id` (string, optioneel): wordt naar de respons gekopieerd. Er wordt een UUID gegenereerd wanneer dit is weggelaten.
- `method` (string, vereist): toegestane Gateway-methodenaam.
- `params` (any, optioneel): methode-specifieke parameters.

De standaard maximale grootte van de aanvraagbody is 1 MB.

## Respons

Succesvolle responses gebruiken de Gateway RPC-vorm:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Gateway-methodefouten gebruiken:

```json
{
  "id": "optional-request-id",
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "bad params"
  }
}
```

De HTTP-status volgt waar mogelijk de Gateway-fout. `INVALID_REQUEST` retourneert bijvoorbeeld `400`, en `UNAVAILABLE` retourneert `503`.

## Toegestane methoden

- discovery: `commands.list`
  Retourneert de HTTP RPC-methodenamen die door deze Plugin zijn toegestaan.
- gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`
- config: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- channels: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- web: `web.login.start`, `web.login.wait`
- models: `models.list`, `models.authStatus`
- agents: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- approvals: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- Cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- devices: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- nodes: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- tasks: `tasks.list`, `tasks.get`, `tasks.cancel`
- diagnostics: `doctor.memory.status`, `update.status`

Andere Gateway-methoden worden geblokkeerd totdat ze bewust worden toegevoegd.

## WebSocket-vergelijking

Het normale Gateway WebSocket RPC-pad blijft de voorkeurs-API voor het besturingsvlak voor OpenClaw-clients. Gebruik admin HTTP RPC alleen voor hosttools die een HTTP-oppervlak voor aanvraag/respons nodig hebben.

WebSocket-clients met gedeeld token zonder vertrouwde apparaatidentiteit kunnen tijdens het verbinden niet zelf admin-scopes declareren. Admin HTTP RPC volgt bewust het bestaande vertrouwde HTTP-operatormodel: wanneer de Plugin is ingeschakeld, wordt bearer-authenticatie met gedeeld geheim behandeld als volledige operatortoegang voor dit admin-oppervlak.

## Probleemoplossing

`404 Not Found`

: De Plugin is uitgeschakeld, de Gateway is niet opnieuw gestart sinds het inschakelen ervan, of de aanvraag gaat naar een ander Gateway-proces.

`401 Unauthorized`

: De aanvraag voldeed niet aan Gateway HTTP-authenticatie. Controleer het bearer-token of de trusted-proxy-identiteitsheaders.

`400 INVALID_REQUEST`

: De aanvraagbody is geen geldige JSON, het veld `method` ontbreekt, of de methode staat niet in de allowlist van de Plugin.

`503 UNAVAILABLE`

: De Gateway-method handler is niet beschikbaar. Controleer de Gateway-logs en probeer het opnieuw nadat de Gateway klaar is met opstarten.

## Gerelateerd

- [Operatorscopes](/nl/gateway/operator-scopes)
- [Gateway-beveiliging](/nl/gateway/security)
- [Externe toegang](/nl/gateway/remote)
- [Plugin-manifest](/nl/plugins/manifest#contracts)
- [SDK-subpaden](/nl/plugins/sdk-subpaths)
