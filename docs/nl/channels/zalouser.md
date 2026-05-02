---
read_when:
    - Zalo Personal instellen voor OpenClaw
    - Debuggen van Zalo Personal-aanmelding of berichtenstroom
summary: Ondersteuning voor persoonlijke Zalo-accounts via native zca-js (QR-login), mogelijkheden en configuratie
title: Zalo persoonlijk
x-i18n:
    generated_at: "2026-05-02T22:17:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0096775e0017e504130f2e19e05ab8114eadb873a9e11f79ea8f0dd91297567f
    source_path: channels/zalouser.md
    workflow: 16
---

Status: experimenteel. Deze integratie automatiseert een **persoonlijk Zalo-account** via native `zca-js` binnen OpenClaw.

<Warning>
Dit is een onofficiële integratie en kan leiden tot opschorting of verbanning van je account. Gebruik op eigen risico.
</Warning>

## Gebundelde Plugin

Zalo Personal wordt meegeleverd als gebundelde Plugin in huidige OpenClaw-releases, dus normale
verpakte builds hebben geen aparte installatie nodig.

Als je een oudere build gebruikt of een aangepaste installatie waarin Zalo Personal is uitgesloten,
installeer dan het npm-pakket rechtstreeks:

- Installeer via CLI: `openclaw plugins install @openclaw/zalouser`
- Vastgezette versie: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Of vanuit een source-checkout: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Details: [Plugins](/nl/tools/plugin)

Er is geen externe `zca`/`openzca` CLI-binary vereist.

## Snelle installatie (beginner)

1. Zorg ervoor dat de Zalo Personal-Plugin beschikbaar is.
   - Huidige verpakte OpenClaw-releases bundelen deze al.
   - Oudere/aangepaste installaties kunnen deze handmatig toevoegen met de opdrachten hierboven.
2. Log in (QR, op de Gateway-machine):
   - `openclaw channels login --channel zalouser`
   - Scan de QR-code met de mobiele Zalo-app.
3. Schakel het kanaal in:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Herstart de Gateway (of voltooi de installatie).
5. DM-toegang gebruikt standaard koppelen; keur de koppelcode goed bij het eerste contact.

## Wat het is

- Draait volledig in-process via `zca-js`.
- Gebruikt native eventlisteners om inkomende berichten te ontvangen.
- Verstuurt antwoorden rechtstreeks via de JS-API (tekst/media/link).
- Ontworpen voor gebruiksscenario's met een “persoonlijk account” waar de Zalo Bot API niet beschikbaar is.

## Naamgeving

De kanaal-id is `zalouser` om expliciet te maken dat dit een **persoonlijk Zalo-gebruikersaccount** automatiseert (onofficieel). We houden `zalo` gereserveerd voor een mogelijke toekomstige officiële Zalo API-integratie.

## ID's vinden (directory)

Gebruik de directory-CLI om peers/groepen en hun ID's te vinden:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limieten

- Uitgaande tekst wordt opgesplitst in stukken van ~2000 tekens (Zalo-clientlimieten).
- Streaming is standaard geblokkeerd.

## Toegangscontrole (DM's)

`channels.zalouser.dmPolicy` ondersteunt: `pairing | allowlist | open | disabled` (standaard: `pairing`).

`channels.zalouser.allowFrom` accepteert gebruikers-ID's of namen. Tijdens de installatie worden namen naar ID's omgezet via de in-process contact lookup van de Plugin.

Goedkeuren via:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Groepstoegang (optioneel)

- Standaard: `channels.zalouser.groupPolicy = "open"` (groepen toegestaan). Gebruik `channels.defaults.groupPolicy` om de standaardwaarde te overschrijven wanneer deze niet is ingesteld.
- Beperk tot een allowlist met:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (sleutels moeten stabiele groeps-ID's zijn; namen worden bij het opstarten waar mogelijk naar ID's omgezet)
  - `channels.zalouser.groupAllowFrom` (bepaalt welke afzenders in toegestane groepen de bot kunnen activeren)
- Blokkeer alle groepen: `channels.zalouser.groupPolicy = "disabled"`.
- De configuratiewizard kan om allowlists voor groepen vragen.
- Bij het opstarten zet OpenClaw groeps-/gebruikersnamen in allowlists om naar ID's en logt de mapping.
- Matching voor groeps-allowlists gebeurt standaard alleen op ID. Niet-opgeloste namen worden genegeerd voor auth, tenzij `channels.zalouser.dangerouslyAllowNameMatching: true` is ingeschakeld.
- `channels.zalouser.dangerouslyAllowNameMatching: true` is een break-glass compatibiliteitsmodus die matching op veranderlijke groepsnamen opnieuw inschakelt.
- Als `groupAllowFrom` niet is ingesteld, valt runtime terug op `allowFrom` voor controles van groepsafzenders.
- Afzendercontroles gelden zowel voor normale groepsberichten als voor besturingsopdrachten (bijvoorbeeld `/new`, `/reset`).

Voorbeeld:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Poortwachter voor groepsvermeldingen

- `channels.zalouser.groups.<group>.requireMention` bepaalt of groepsantwoorden een vermelding vereisen.
- Volgorde van oplossen: exacte groeps-id/naam -> genormaliseerde groeps-slug -> `*` -> standaard (`true`).
- Dit geldt zowel voor groepen op de allowlist als voor de open groepsmodus.
- Het citeren van een botbericht telt als een impliciete vermelding voor groepsactivatie.
- Geautoriseerde besturingsopdrachten (bijvoorbeeld `/new`) kunnen de vermeldingsvereiste omzeilen.
- Wanneer een groepsbericht wordt overgeslagen omdat een vermelding vereist is, slaat OpenClaw het op als wachtende groepsgeschiedenis en neemt het mee in het volgende verwerkte groepsbericht.
- De limiet voor groepsgeschiedenis is standaard `messages.groupChat.historyLimit` (fallback `50`). Je kunt dit per account overschrijven met `channels.zalouser.historyLimit`.

Voorbeeld:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Meerdere accounts

Accounts worden gekoppeld aan `zalouser`-profielen in de OpenClaw-status. Voorbeeld:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Typen, reacties en ontvangstbevestigingen

- OpenClaw stuurt een typing-event voordat een antwoord wordt verzonden (best-effort).
- Berichtreactieactie `react` wordt ondersteund voor `zalouser` in kanaalacties.
  - Gebruik `remove: true` om een specifieke reactie-emoji van een bericht te verwijderen.
  - Reactiesemantiek: [Reacties](/nl/tools/reactions)
- Voor inkomende berichten die eventmetadata bevatten, stuurt OpenClaw afgeleverd- en gezien-bevestigingen (best-effort).

## Probleemoplossing

**Inloggen blijft niet actief:**

- `openclaw channels status --probe`
- Opnieuw inloggen: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist-/groepsnaam is niet opgelost:**

- Gebruik numerieke ID's in `allowFrom`/`groupAllowFrom`/`groups`, of exacte vriend-/groepsnamen.

**Geüpgraded vanaf oude CLI-gebaseerde installatie:**

- Verwijder alle oude aannames over een extern `zca`-proces.
- Het kanaal draait nu volledig in OpenClaw zonder externe CLI-binaries.

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — gedrag van groepschats en vermeldingsvereiste
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
