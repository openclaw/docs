---
read_when:
    - Je wilt snel een mobiele Node-app met een Gateway koppelen
    - Je hebt uitvoer van de installatiecode nodig om deze op afstand/handmatig te delen
summary: CLI-referentie voor `openclaw qr` (QR-code voor mobiele koppeling + installatiecode genereren)
title: QR
x-i18n:
    generated_at: "2026-07-16T15:38:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f9d60a58126eae7eec5979f28bb511a09fa52b68cdd73727fca0b2de74efa84a
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Genereer een QR-code voor mobiele koppeling en een installatiecode op basis van je huidige Gateway-configuratie.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --limited
openclaw qr --url wss://gateway.example/ws
```

Officiële OpenClaw-apps voor iOS en Android maken automatisch verbinding wanneer de metadata van hun installatiecode overeenkomt. Als een aanvraag in behandeling blijft (bijvoorbeeld voor een niet-officiële client of niet-overeenkomende metadata), controleer en keur je deze goed:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Opties

- `--remote`: geef de voorkeur aan `gateway.remote.url`; valt terug op `gateway.tailscale.mode=serve|funnel` als die URL niet is ingesteld. Negeert Plugin `publicUrl` van `device-pair`.
- `--url <url>`: overschrijf de Gateway-URL die in de payload wordt gebruikt
- `--public-url <url>`: overschrijf de openbare URL die in de payload wordt gebruikt
- `--token <token>`: overschrijf het Gateway-token waarmee de bootstrapstroom zich verifieert
- `--password <password>`: overschrijf het Gateway-wachtwoord waarmee de bootstrapstroom zich verifieert
- `--limited`: laat administratieve Gateway-toegang weg uit het overgedragen operatortoken
- `--setup-code-only`: druk alleen de installatiecode af
- `--no-ascii`: sla de ASCII-weergave van de QR-code over
- `--json`: voer JSON uit (`setupCode`, `gatewayUrl`, optioneel `gatewayUrls`, `auth`, `access`, optioneel `accessDowngraded`, `urlSource`)

`--token` en `--password` sluiten elkaar uit.

## Inhoud van de installatiecode

De installatiecode bevat een ondoorzichtige, kortlevende `bootstrapToken`, niet het gedeelde Gateway-token/wachtwoord. Voor een `wss://`-eindpunt (of een loopback op dezelfde host) verstrekt de standaard-bootstrapstroom:

- een primair `node`-token met `scopes: []`
- een volledig native mobiel `operator`-overdrachtstoken met `operator.admin`, `operator.approvals`, `operator.read`, `operator.talk.secrets` en `operator.write`

Gebruik `--limited` om hetzelfde Node-token te behouden en tegelijkertijd `operator.admin` uit de overdracht aan de operator weg te laten. Het bereik voor koppelingswijzigingen wordt nooit via een installatiecode overgedragen.

Installatie via `ws://` in platte tekst op het LAN blijft beschikbaar, maar OpenClaw gebruikt automatisch het beperkte profiel omdat een netwerkwaarnemer het bearer-bootstrap-token kan onderscheppen en eerder kan gebruiken. Configureer `wss://` of Tailscale Serve en genereer vervolgens een nieuwe code om volledige toegang te krijgen.

## Gateway-URL bepalen

Mobiele koppeling weigert standaard Tailscale-/openbare `ws://`-Gateway-URL's: gebruik daarvoor Tailscale Serve/Funnel of een `wss://`-Gateway-URL. Privé-LAN-adressen en `.local`-Bonjour-hosts blijven ondersteund via `ws://` in platte tekst, met beperkte operatortoegang zoals hierboven beschreven.

Wanneer de geselecteerde Gateway-URL afkomstig is van `gateway.bind=lan`, controleert OpenClaw ook permanente `tailscale serve status --json`-routes. Elke HTTPS Serve-root die de loopbackpoort van de actieve Gateway proxyt, wordt als terugvaloptie opgenomen. De QR-opdracht voegt deze terugvaloptie alleen toe voor `lan`; `custom` en `tailnet` behouden hun expliciet aangekondigde routes. Huidige iOS-clients proberen de aangekondigde routes in volgorde en slaan de eerste bereikbare route op; het verouderde veld `url` blijft ongewijzigd voor oudere clients.

Met `--remote` is `gateway.remote.url` of `gateway.tailscale.mode=serve|funnel` vereist.

## Authenticatie bepalen (geen `--remote`)

Wanneer geen overschrijving voor CLI-authenticatie wordt doorgegeven, worden lokale SecretRefs voor Gateway-authenticatie als volgt opgelost:

| Voorwaarde                                                                                                                    | Wordt opgelost als                         |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `gateway.auth.mode="token"`, of afgeleide modus zonder doorslaggevende wachtwoordbron                                                | `gateway.auth.token`                         |
| `gateway.auth.mode="password"`, of afgeleide modus zonder doorslaggevend token uit authenticatie/omgeving                              | `gateway.auth.password`                         |
| Zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd (inclusief SecretRefs) en `gateway.auth.mode` is niet ingesteld | mislukt; stel `gateway.auth.mode` expliciet in |

## Authenticatie bepalen (`--remote`)

Als daadwerkelijk actieve externe referenties als SecretRefs zijn geconfigureerd en noch `--token` noch `--password` wordt doorgegeven, haalt de opdracht ze op uit de momentopname van de actieve Gateway. Als de Gateway niet beschikbaar is, mislukt de opdracht onmiddellijk.

<Note>
Voor dit opdrachtpad is een Gateway vereist die de RPC-methode `secrets.resolve` ondersteunt. Oudere Gateways retourneren een fout voor een onbekende methode.
</Note>

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Apparaten](/nl/cli/devices)
- [Koppeling](/nl/cli/pairing)
