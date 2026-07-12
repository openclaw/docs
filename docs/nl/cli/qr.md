---
read_when:
    - Je wilt snel een mobiele Node-app aan een Gateway koppelen
    - U hebt uitvoer van de installatiecode nodig om deze op afstand/handmatig te delen
summary: CLI-referentie voor `openclaw qr` (QR-code voor mobiele koppeling + installatiecode genereren)
title: QR
x-i18n:
    generated_at: "2026-07-12T08:44:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32641ff4e8035f6ca2eda849a59146125763af21c4105ae6cfa584da31ac070f
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Genereer een QR-code en installatiecode voor mobiele koppeling op basis van je huidige Gateway-configuratie.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

Officiële OpenClaw-apps voor iOS en Android maken automatisch verbinding wanneer de metagegevens van hun installatiecode overeenkomen. Als een aanvraag in behandeling blijft (bijvoorbeeld voor een niet-officiële client of niet-overeenkomende metagegevens), controleer en keur je deze goed:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Opties

- `--remote`: geeft de voorkeur aan `gateway.remote.url`; valt terug op `gateway.tailscale.mode=serve|funnel` als die URL niet is ingesteld. Negeert `publicUrl` van de Plugin `device-pair`.
- `--url <url>`: overschrijft de Gateway-URL die in de payload wordt gebruikt
- `--public-url <url>`: overschrijft de openbare URL die in de payload wordt gebruikt
- `--token <token>`: overschrijft het Gateway-token waarmee de bootstrapprocedure zich verifieert
- `--password <password>`: overschrijft het Gateway-wachtwoord waarmee de bootstrapprocedure zich verifieert
- `--setup-code-only`: geeft alleen de installatiecode weer
- `--no-ascii`: slaat de ASCII-weergave van de QR-code over
- `--json`: voert JSON uit (`setupCode`, `gatewayUrl`, optioneel `gatewayUrls`, `auth`, `urlSource`)

`--token` en `--password` sluiten elkaar uit.

## Inhoud van de installatiecode

De installatiecode bevat een ondoorzichtig, kortlevend `bootstrapToken`, niet het gedeelde Gateway-token/-wachtwoord. De ingebouwde bootstrapprocedure verstrekt:

- een primair `node`-token met `scopes: []`
- een begrensd `operator`-overdrachtstoken dat is beperkt tot `operator.approvals`, `operator.read`, `operator.talk.secrets` en `operator.write`

Bereiken voor koppelingsmutaties en `operator.admin` vereisen nog steeds een afzonderlijk goedgekeurde operatorkoppeling of tokenprocedure.

## Bepaling van de Gateway-URL

Mobiele koppeling wordt standaard geweigerd voor Tailscale-/openbare `ws://`-Gateway-URL's: gebruik daarvoor Tailscale Serve/Funnel of een `wss://`-Gateway-URL. Privé-LAN-adressen en `.local`-Bonjour-hosts blijven via gewone `ws://` ondersteund.

Wanneer de geselecteerde Gateway-URL afkomstig is van `gateway.bind=lan`, controleert OpenClaw ook permanente routes uit `tailscale serve status --json`. Elke HTTPS-Serve-hoofdroute die als proxy voor de local loopback-poort van de actieve Gateway fungeert, wordt als terugvaloptie opgenomen. De QR-opdracht voegt deze terugvaloptie alleen toe voor `lan`; `custom` en `tailnet` behouden hun expliciet aangekondigde routes. Huidige iOS-clients testen de aangekondigde routes op volgorde en slaan de eerste bereikbare route op; het verouderde veld `url` blijft ongewijzigd voor oudere clients.

Met `--remote` is `gateway.remote.url` of `gateway.tailscale.mode=serve|funnel` vereist.

## Verificatiebepaling (zonder `--remote`)

Wanneer geen CLI-overschrijving voor verificatie wordt doorgegeven, worden lokale SecretRefs voor Gateway-verificatie als volgt omgezet:

| Voorwaarde                                                                                                                   | Wordt omgezet naar                         |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `gateway.auth.mode="token"`, of afgeleide modus zonder doorslaggevende wachtwoordbron                                        | `gateway.auth.token`                       |
| `gateway.auth.mode="password"`, of afgeleide modus zonder doorslaggevend token uit verificatie/omgeving                      | `gateway.auth.password`                    |
| Zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd (inclusief SecretRefs) en `gateway.auth.mode` is niet ingesteld | mislukt; stel `gateway.auth.mode` expliciet in |

## Verificatiebepaling (`--remote`)

Als de daadwerkelijk actieve externe aanmeldgegevens als SecretRefs zijn geconfigureerd en noch `--token` noch `--password` wordt doorgegeven, zet de opdracht deze om vanuit de actieve Gateway-momentopname. Als de Gateway niet beschikbaar is, wordt de opdracht onmiddellijk afgebroken.

<Note>
Voor dit opdrachtpad is een Gateway vereist die de RPC-methode `secrets.resolve` ondersteunt. Oudere Gateways retourneren een fout voor een onbekende methode.
</Note>

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Apparaten](/nl/cli/devices)
- [Koppeling](/nl/cli/pairing)
