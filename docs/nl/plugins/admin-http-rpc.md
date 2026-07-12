---
read_when:
    - Hosthulpmiddelen bouwen die geen gebruik kunnen maken van de Gateway WebSocket-RPC-client
    - Gateway-beheerautomatisering beschikbaar maken achter een privé, vertrouwde ingang
    - Het beveiligingsmodel voor HTTP-toegang tot Gateway-methoden controleren
summary: Stel geselecteerde methoden van het Gateway-beheervlak beschikbaar via de meegeleverde, optionele Plugin admin-http-rpc
title: Beheer-HTTP-RPC-plugin
x-i18n:
    generated_at: "2026-07-12T09:05:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0709081efd0ce65cef7edac54df9a71978cbad17e2b25df83ac9075de938376c
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

De gebundelde Plugin `admin-http-rpc` stelt via HTTP een allowlist van Gateway-controlplanemethoden beschikbaar voor vertrouwde hostautomatisering die geen Gateway-WebSocketverbinding open kan houden.

Deze wordt met OpenClaw meegeleverd, maar is standaard uitgeschakeld; wanneer deze is uitgeschakeld, wordt de route niet geregistreerd. Wanneer deze is ingeschakeld, wordt `POST /api/v1/admin/rpc` toegevoegd aan dezelfde listener als de Gateway (`http://<gateway-host>:<port>/api/v1/admin/rpc`).

Schakel deze alleen in voor privéhosttools, automatisering op een tailnet of een vertrouwde interne ingress. Stel deze route nooit rechtstreeks bloot aan het openbare internet.

## Voordat u deze inschakelt

Admin HTTP RPC is een volledig operator-controlplaneoppervlak: elke aanroeper die slaagt voor Gateway-HTTP-authenticatie kan de hieronder opgenomen methoden aanroepen. Schakel dit alleen in wanneer aan al deze voorwaarden is voldaan:

- De aanroeper wordt vertrouwd om de Gateway te beheren.
- De aanroeper kan de WebSocket-RPC-client niet gebruiken.
- De route is alleen bereikbaar via local loopback, een tailnet of een privé-ingress met authenticatie.
- U hebt de toegestane methoden beoordeeld en deze komen overeen met de automatisering die u wilt uitvoeren.

Gebruik in plaats daarvan WebSocket-RPC voor OpenClaw-clients en interactieve tools die een Gateway-WebSocketverbinding open kunnen houden.

## Inschakelen

Schakel de gebundelde Plugin in:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Configuratie">
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

De route wordt tijdens het opstarten van de Plugin geregistreerd. Start daarom de Gateway opnieuw nadat u de Plugin-configuratie hebt gewijzigd.

Schakel deze uit wanneer u het HTTP-oppervlak niet meer nodig hebt:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## De route verifiëren

Gebruik `health` als het kleinste veilige verzoek:

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

Een geslaagd antwoord heeft `ok: true`:

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

Wanneer de Plugin is uitgeschakeld, retourneert de route `404`, omdat deze niet is geregistreerd.

## Authenticatie

De Plugin-route gebruikt Gateway-HTTP-authenticatie.

Veelgebruikte authenticatiemethoden:

- authenticatie met een gedeeld geheim (`gateway.auth.mode="token"` of `"password"`): `Authorization: Bearer <token-or-password>`
- vertrouwde identiteitsdragende HTTP-authenticatie (`gateway.auth.mode="trusted-proxy"`): leid de route door de geconfigureerde identiteitsbewuste proxy en laat deze de vereiste identiteitsheaders invoegen
- open authenticatie via een privé-ingress (`gateway.auth.mode="none"`): geen authenticatieheader vereist

## Beveiligingsmodel

Behandel deze Plugin als een volledig Gateway-operatoroppervlak.

- Als u de Plugin inschakelt, biedt u bewust toegang tot de beheer-RPC-methoden op de allowlist via `/api/v1/admin/rpc`.
- De Plugin declareert het gereserveerde manifestcontract `contracts.gatewayMethodDispatch: ["authenticated-request"]`, waardoor de met Gateway geauthenticeerde HTTP-route controlplanemethoden binnen het proces kan dispatchen. Dit is geen sandbox: het contract voorkomt onbedoeld gebruik van gereserveerde SDK-helpers, maar vertrouwde Plugins worden nog steeds in het Gateway-proces uitgevoerd.
- Bearer-authenticatie met een gedeeld geheim (modi `token`/`password`) bewijst het bezit van het Gateway-operatorgeheim; beperktere `x-openclaw-scopes`-headers worden op dat pad genegeerd en de normale standaardinstellingen voor volledige operatortoegang worden hersteld.
- Vertrouwde identiteitsdragende HTTP-authenticatie (modus `trusted-proxy`) respecteert `x-openclaw-scopes` wanneer deze aanwezig is.
- `gateway.auth.mode="none"` betekent dat deze route niet is geauthenticeerd als de Plugin is ingeschakeld. Gebruik dit alleen achter een privé-ingress die u volledig vertrouwt.
- Nadat de authenticatie van de Plugin-route is geslaagd, worden verzoeken gedispatcht via dezelfde Gateway-methodehandlers en bereikcontroles als WebSocket-RPC.
- De route blijft bereikbaar tijdens een voorbereide opschortingslease. Begrensde verzoekvalidatie en het lokale discovery-antwoord van `commands.list` blijven beschikbaar. Van de methoden die naar de Gateway worden gedispatcht, mogen alleen `gateway.suspend.prepare`, `gateway.suspend.status` en `gateway.suspend.resume` worden uitgevoerd zolang de toelating is gesloten; andere methoden op de allowlist retourneren het normale, opnieuw te proberen Gateway-antwoord `UNAVAILABLE`.
- Houd deze route op local loopback, een tailnet of een vertrouwde privé-ingress. Stel deze niet rechtstreeks bloot aan het openbare internet. Gebruik afzonderlijke Gateways wanneer aanroepers vertrouwensgrenzen overschrijden.

## Verzoek

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

- `id` (tekenreeks, optioneel): wordt naar het antwoord gekopieerd. Er wordt een UUID gegenereerd wanneer dit veld wordt weggelaten.
- `method` (tekenreeks, vereist): naam van een toegestane Gateway-methode.
- `params` (willekeurig type, optioneel): methodespecifieke parameters.

De standaard maximale grootte van de verzoekbody is 1 MB.

## Antwoord

Geslaagde antwoorden gebruiken de Gateway-RPC-structuur:

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

De HTTP-status volgt de foutcode:

| Foutcode                   | HTTP-status |
| -------------------------- | ----------- |
| `INVALID_REQUEST`          | 400         |
| `APPROVAL_NOT_FOUND`       | 404         |
| `NOT_LINKED`, `NOT_PAIRED` | 409         |
| `UNAVAILABLE`              | 503         |
| `AGENT_TIMEOUT`            | 504         |
| elke andere code           | 500         |

## Toegestane methoden

- discovery: `commands.list`
  Retourneert de namen van de HTTP-RPC-methoden die door deze Plugin zijn toegestaan.
- Gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`, `gateway.suspend.prepare`, `gateway.suspend.status`, `gateway.suspend.resume`
- configuratie: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- kanalen: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- web: `web.login.start`, `web.login.wait`
- modellen: `models.list`, `models.authStatus`
- agents: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- goedkeuringen: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- Cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- apparaten: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- Nodes: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- taken: `tasks.list`, `tasks.get`, `tasks.cancel`
- diagnostiek: `doctor.memory.status`, `update.status`

Andere Gateway-methoden worden geblokkeerd totdat ze bewust worden toegevoegd.

## Vergelijking met WebSocket

Het normale Gateway-WebSocket-RPC-pad blijft de voorkeurs-API voor het controlplane voor OpenClaw-clients. Gebruik Admin HTTP RPC alleen voor hosttools die een HTTP-verzoek/antwoordoppervlak nodig hebben.

WebSocket-clients met een gedeelde token zonder vertrouwde apparaatidentiteit kunnen tijdens het verbinden niet zelf beheerbereiken declareren. Admin HTTP RPC volgt bewust het bestaande model voor vertrouwde HTTP-operators: wanneer de Plugin is ingeschakeld, wordt bearer-authenticatie met een gedeeld geheim voor dit beheeroppervlak behandeld als volledige operatortoegang.

## Probleemoplossing

`404 Not Found`

: De Plugin is uitgeschakeld, de Gateway is niet opnieuw gestart nadat deze is ingeschakeld, of het verzoek gaat naar een ander Gateway-proces.

`401 Unauthorized`

: Het verzoek voldeed niet aan de Gateway-HTTP-authenticatie. Controleer het bearer-token of de identiteitsheaders van de vertrouwde proxy.

`405 Method Not Allowed`

: Voor het verzoek is iets anders dan `POST` gebruikt.

`413 Payload Too Large`

: De verzoekbody overschreed de limiet van 1 MB.

`400 INVALID_REQUEST`

: De verzoekbody is geen geldige JSON, het veld `method` ontbreekt, de methode staat niet op de allowlist van de Plugin of een hervattings-ID voor een opschorting komt niet overeen met de actieve lease.

`503 UNAVAILABLE`

: De Gateway-methode wordt gestart, is beperkt door een snelheidslimiet, is opgeschort of wacht op een concurrerende opschortings- of hervattingsbewerking. Controleer `error.details` wanneer dit aanwezig is en wacht `error.retryAfterMs` voordat u het opnieuw probeert.

## Gerelateerd

- [Operatorbereiken](/nl/gateway/operator-scopes)
- [Gateway-beveiliging](/nl/gateway/security)
- [Externe toegang](/nl/gateway/remote)
- [Plugin-manifest](/nl/plugins/manifest#contracts-reference)
- [SDK-subpaden](/nl/plugins/sdk-subpaths)
