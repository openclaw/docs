---
read_when:
    - Tools aanroepen zonder een volledige agentbeurt uit te voeren
    - Automatiseringen bouwen waarvoor handhaving van toolbeleid nodig is
summary: Roep één tool rechtstreeks aan via het Gateway-HTTP-eindpunt
title: Tools roepen API aan
x-i18n:
    generated_at: "2026-07-12T08:53:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d07f765d63255e718d5e558b662589e77b2992538f43288cd83e6e3f2a06dda
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

De Gateway van OpenClaw biedt een HTTP-eindpunt waarmee één tool rechtstreeks kan worden aangeroepen. Het is altijd ingeschakeld en gebruikt Gateway-authenticatie in combinatie met toolbeleid. Net als bij het OpenAI-compatibele `/v1/*`-oppervlak wordt bearer-authenticatie met een gedeeld geheim beschouwd als vertrouwde operatortoegang tot de volledige Gateway.

- `POST /tools/invoke`
- Dezelfde poort als de Gateway (WS + HTTP-multiplexing): `http://<gateway-host>:<port>/tools/invoke`
- Standaard maximale grootte van de aanvraagbody: 2 MB

## Authenticatie

Gebruikt de authenticatieconfiguratie van de Gateway.

Veelgebruikte HTTP-authenticatiepaden:

- authenticatie met een gedeeld geheim (`gateway.auth.mode="token"` of `"password"`): `Authorization: Bearer <token-or-password>`
- vertrouwde HTTP-authenticatie met identiteit (`gateway.auth.mode="trusted-proxy"`): routeer via de geconfigureerde identiteitsbewuste proxy en laat deze de vereiste identiteitsheaders invoegen
- open authenticatie via privé-ingang (`gateway.auth.mode="none"`): geen authenticatieheader vereist

Opmerkingen:

- `mode="token"` gebruikt `gateway.auth.token` (of `OPENCLAW_GATEWAY_TOKEN`).
- `mode="password"` gebruikt `gateway.auth.password` (of `OPENCLAW_GATEWAY_PASSWORD`).
- `mode="trusted-proxy"` vereist dat de HTTP-aanvraag afkomstig is van een geconfigureerde vertrouwde proxybron; local loopback-proxy's op dezelfde host vereisen expliciet `gateway.auth.trustedProxy.allowLoopback = true`.
- Interne aanroepers op dezelfde host die de proxy omzeilen, kunnen `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` gebruiken als lokale directe terugvaloptie. Elk bewijs in een `Forwarded`-, `X-Forwarded-*`- of `X-Real-IP`-header zorgt er in plaats daarvan voor dat de aanvraag het pad van de vertrouwde proxy blijft volgen.
- Als `gateway.auth.rateLimit` is geconfigureerd en er te veel authenticatiefouten optreden, retourneert het eindpunt `429` met `Retry-After`.

## Beveiligingsgrens (belangrijk)

Beschouw dit eindpunt als een oppervlak met **volledige operatortoegang** tot de Gateway-instantie.

- HTTP-bearer-authenticatie is hier geen beperkt scopemodel per gebruiker.
- Een geldig Gateway-token of -wachtwoord voor dit eindpunt moet worden behandeld als een referentie van een eigenaar/operator.
- Voor authenticatiemodi met een gedeeld geheim (`token` en `password`) herstelt het eindpunt de normale volledige standaardinstellingen voor operators, zelfs als de aanroeper een beperktere `x-openclaw-scopes`-header verstuurt.
- Authenticatie met een gedeeld geheim behandelt rechtstreekse toolaanroepen op dit eindpunt ook als beurten van de eigenaar-afzender.
- Vertrouwde HTTP-modi met identiteit (authenticatie via een vertrouwde proxy, of `gateway.auth.mode="none"` via een privé-ingang) respecteren `x-openclaw-scopes` indien aanwezig en vallen anders terug op de normale standaardset operatorscopes.
- Houd dit eindpunt uitsluitend op local loopback/tailnet/privé-ingang; stel het niet rechtstreeks bloot aan het openbare internet.

Authenticatiematrix:

| Authenticatiemodus                                                                       | Gedrag                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token` of `password` + `Authorization: Bearer ...`                                       | Bewijst het bezit van het gedeelde operatorgeheim van de Gateway. Negeert beperktere `x-openclaw-scopes`. Herstelt de volledige standaardset operatorscopes: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Behandelt rechtstreekse toolaanroepen als beurten van de eigenaar-afzender. |
| Vertrouwde HTTP met identiteit (vertrouwde proxy-authenticatie, of `mode="none"` op privé-ingang) | Authenticeert een externe vertrouwde identiteit of implementatiegrens. Respecteert `x-openclaw-scopes` indien aanwezig. Valt terug op de normale standaardset operatorscopes wanneer de header ontbreekt. Verliest alleen eigenaarsemantiek wanneer de aanroeper scopes expliciet beperkt en `operator.admin` weglaat.                                                        |

## Aanvraagbody

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

- `tool` / `name` (tekenreeks, vereist): naam van de aan te roepen tool. `name` heeft voorrang als beide worden verstuurd.
- `action` (tekenreeks, optioneel): wordt samengevoegd in `args.action` als het toolschema een eigenschap `action` ondersteunt en deze nog niet in `args` was ingesteld.
- `args` (object, optioneel): toolspecifieke argumenten.
- `sessionKey` (tekenreeks, optioneel): sleutel van de doelsessie. Als deze wordt weggelaten of `"main"` is, gebruikt de Gateway de geconfigureerde hoofdsessiesleutel (respecteert `session.mainKey` en de standaardagent, of `global` in het globale sessiebereik).
- `agentId` (tekenreeks, optioneel): bepaalt de sessiesleutel voor die agent. Geeft een fout met `400` als deze conflicteert met een expliciete `sessionKey` die al naar een andere agent verwijst.
- `idempotencyKey` (tekenreeks, optioneel): wordt gebruikt om een stabiele toolaanroep-ID voor de aanroep af te leiden.
- `dryRun` (booleaans, optioneel): gereserveerd voor toekomstig gebruik; wordt momenteel genegeerd.

## Gedrag van beleid en routering

De beschikbaarheid van tools wordt gefilterd via dezelfde beleidsketen die door Gateway-agenten wordt gebruikt:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- groepsbeleid (als de sessiesleutel naar een groep of kanaal verwijst)
- subagentbeleid (bij aanroep met de sessiesleutel van een subagent)

Als een tool niet door het beleid is toegestaan, retourneert het eindpunt **404**.

Belangrijke opmerkingen over de grens:

- Goedkeuringen voor uitvoerbewerkingen zijn operatorbeveiligingen, geen afzonderlijke autorisatiegrens voor dit HTTP-eindpunt. Als een tool hier bereikbaar is via Gateway-authenticatie en toolbeleid, voegt `/tools/invoke` geen extra goedkeuringsprompt per aanroep toe.
- Als `exec` hier bereikbaar is, beschouw dit dan als een muterend shell-oppervlak. Het weigeren van `write`, `edit`, `apply_patch` of HTTP-tools die naar het bestandssysteem schrijven, maakt shell-uitvoering niet alleen-lezen.
- Deel bearer-referenties van de Gateway niet met niet-vertrouwde aanroepers. Als u scheiding tussen vertrouwensgrenzen nodig hebt, voert u afzonderlijke Gateways uit (bij voorkeur onder afzonderlijke gebruikers van het besturingssysteem of op afzonderlijke hosts).

Gateway HTTP past standaard ook een harde weigeringslijst toe (zelfs als het sessiebeleid de tool toestaat):

| Tool             | Reden                                                               |
| ---------------- | ------------------------------------------------------------------- |
| `exec`           | Rechtstreekse opdrachtuitvoering (RCE-oppervlak)                    |
| `spawn`          | Willekeurig onderliggend proces maken (RCE-oppervlak)               |
| `shell`          | Shell-opdracht uitvoeren (RCE-oppervlak)                            |
| `fs_write`       | Willekeurige bestandswijziging op de host                           |
| `fs_delete`      | Willekeurige bestandsverwijdering op de host                        |
| `fs_move`        | Willekeurig bestand verplaatsen/hernoemen op de host                |
| `apply_patch`    | Het toepassen van patches kan willekeurige bestanden herschrijven   |
| `sessions_spawn` | Sessieorkestratie; agenten op afstand starten is RCE                |
| `sessions_send`  | Berichten tussen sessies injecteren                                 |
| `cron`           | Besturingsvlak voor permanente automatisering                      |
| `gateway`        | Besturingsvlak van de Gateway; voorkomt herconfiguratie via HTTP    |
| `nodes`          | Node-opdrachtrelay kan `system.run` bereiken op gekoppelde hosts    |

`cron`, `gateway` en `nodes` zijn ook uitsluitend voor eigenaren: zelfs buiten deze standaardweigeringslijst kunnen niet-eigenaren ze niet via dit oppervlak aanroepen.

Pas de algemene weigeringslijst aan via `gateway.tools`:

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

`gateway.tools.allow` is een overschrijving van de blootstelling, geen uitbreiding van scopes. In HTTP-modi met identiteit blijven `cron`, `gateway` en `nodes` niet beschikbaar voor aanroepers zonder eigenaar-/beheerdersidentiteit (`operator.admin`), zelfs wanneer ze in `gateway.tools.allow` staan. Bearer-authenticatie met een gedeeld geheim blijft de regel voor volledig vertrouwde operators hierboven volgen.

Om groepsbeleid te helpen de context te bepalen, kunt u optioneel het volgende instellen:

- `x-openclaw-message-channel: <channel>` (voorbeeld: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (wanneer er meerdere accounts zijn)
- `x-openclaw-message-to: <target>` (afleverdoel voor beleid van berichttools)
- `x-openclaw-thread-id: <threadId>` (threadcontext voor beleid van berichttools)

## Antwoorden

| Status | Betekenis                                                                                                  |
| ------ | ---------------------------------------------------------------------------------------------------------- |
| `200`  | `{ ok: true, result }`                                                                                     |
| `400`  | `{ ok: false, error: { type, message } }` (ongeldige aanvraag of fout in toolinvoer)                       |
| `401`  | Niet geautoriseerd                                                                                         |
| `403`  | `{ ok: false, error: { type, message, requiresApproval? } }` (toolaanroep geblokkeerd door beleid)         |
| `404`  | Tool niet beschikbaar (niet gevonden of niet op de toestemmingslijst)                                     |
| `405`  | Methode niet toegestaan                                                                                   |
| `408`  | Time-out bij het lezen van de aanvraagbody                                                                 |
| `413`  | Aanvraagbody overschreed de maximale payloadgrootte                                                       |
| `429`  | Authenticatie beperkt wegens te veel aanvragen (`Retry-After` ingesteld)                                  |
| `500`  | `{ ok: false, error: { type, message } }` (onverwachte fout bij tooluitvoering; opgeschoond bericht)       |

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
