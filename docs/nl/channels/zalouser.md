---
read_when:
    - Zalo Personal instellen voor OpenClaw
    - Fouten opsporen in de aanmeldings- of berichtenstroom van Zalo Personal
summary: Ondersteuning voor persoonlijke Zalo-accounts via native zca-js (QR-login), mogelijkheden en configuratie
title: Zalo persoonlijk
x-i18n:
    generated_at: "2026-05-10T19:24:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b55f980b92a17f6a8de39df0ce49fc5705b5cb2bf4d69589c07d84a854e863a
    source_path: channels/zalouser.md
    workflow: 16
---

Status: experimenteel. Deze integratie automatiseert een **persoonlijk Zalo-account** via native `zca-js` binnen OpenClaw.

<Warning>
Dit is een onofficiële integratie en kan leiden tot opschorting of verbanning van je account. Gebruik op eigen risico.
</Warning>

## Gebundelde Plugin

Zalo Personal wordt als gebundelde Plugin meegeleverd in huidige OpenClaw-releases, dus normale
gepackageerde builds hebben geen afzonderlijke installatie nodig.

Als je een oudere build gebruikt of een aangepaste installatie die Zalo Personal uitsluit,
installeer dan het npm-pakket rechtstreeks:

- Installeren via CLI: `openclaw plugins install @openclaw/zalouser`
- Vastgezette versie: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Of vanuit een source-checkout: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Details: [Plugins](/nl/tools/plugin)

Er is geen externe `zca`/`openzca` CLI-binary vereist.

## Snelle setup (beginner)

1. Zorg dat de Zalo Personal-Plugin beschikbaar is.
   - Huidige gepackageerde OpenClaw-releases bundelen deze al.
   - Oudere/aangepaste installaties kunnen deze handmatig toevoegen met de bovenstaande commando's.
2. Inloggen (QR, op de Gateway-machine):
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

4. Herstart de Gateway (of rond de setup af).
5. DM-toegang gebruikt standaard koppelen; keur de koppelcode goed bij het eerste contact.

## Wat het is

- Draait volledig in-process via `zca-js`.
- Gebruikt native eventlisteners om inkomende berichten te ontvangen.
- Stuurt antwoorden rechtstreeks via de JS-API (tekst/media/link).
- Ontworpen voor gebruikssituaties met een "persoonlijk account" waarin de Zalo Bot API niet beschikbaar is.

## Naamgeving

De kanaal-id is `zalouser` om expliciet te maken dat dit een **persoonlijk Zalo-gebruikersaccount** automatiseert (onofficieel). We houden `zalo` gereserveerd voor een mogelijke toekomstige officiële Zalo API-integratie.

## ID's vinden (directory)

Gebruik de directory-CLI om peers/groepen en hun ID's te ontdekken:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limieten

- Uitgaande tekst wordt opgedeeld in stukken van ongeveer 2000 tekens (limieten van de Zalo-client).
- Streaming is standaard geblokkeerd.

## Toegangscontrole (DM's)

`channels.zalouser.dmPolicy` ondersteunt: `pairing | allowlist | open | disabled` (standaard: `pairing`).

`channels.zalouser.allowFrom` moet stabiele Zalo-gebruikers-ID's gebruiken. Het kan ook verwijzen naar statische afzenderstoegangsgroepen (`accessGroup:<name>`). Tijdens interactieve setup kunnen ingevoerde namen worden omgezet naar ID's via de in-process contactlookup van de Plugin.

Als er een ruwe naam in de configuratie blijft staan, wordt die bij het opstarten alleen omgezet wanneer `channels.zalouser.dangerouslyAllowNameMatching: true` is ingeschakeld. Zonder die opt-in zijn runtime-afzendercontroles uitsluitend op ID gebaseerd en worden ruwe namen genegeerd voor autorisatie.

Goedkeuren via:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Groepstoegang (optioneel)

- Standaard: `channels.zalouser.groupPolicy = "open"` (groepen toegestaan). Gebruik `channels.defaults.groupPolicy` om de standaardwaarde te overschrijven wanneer deze niet is ingesteld.
- Beperk tot een allowlist met:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (sleutels moeten stabiele groeps-ID's zijn; namen worden bij het opstarten alleen naar ID's omgezet wanneer `channels.zalouser.dangerouslyAllowNameMatching: true` is ingeschakeld)
  - `channels.zalouser.groupAllowFrom` (bepaalt welke afzenders in toegestane groepen de bot kunnen activeren; statische afzenderstoegangsgroepen kunnen worden gerefereerd met `accessGroup:<name>`)
- Alle groepen blokkeren: `channels.zalouser.groupPolicy = "disabled"`.
- De configuratiewizard kan vragen om allowlists voor groepen.
- Bij het opstarten zet OpenClaw groeps-/gebruikersnamen in allowlists om naar ID's en logt de mapping alleen wanneer `channels.zalouser.dangerouslyAllowNameMatching: true` is ingeschakeld.
- Matching van groeps-allowlists is standaard uitsluitend op ID gebaseerd. Niet-opgeloste namen worden genegeerd voor auth, tenzij `channels.zalouser.dangerouslyAllowNameMatching: true` is ingeschakeld.
- `channels.zalouser.dangerouslyAllowNameMatching: true` is een break-glass-compatibiliteitsmodus die veranderlijke naamresolutie bij het opstarten en runtime-matching op groepsnaam opnieuw inschakelt.
- Als `groupAllowFrom` niet is ingesteld, valt runtime terug op `allowFrom` voor afzendercontroles in groepen.
- Afzendercontroles gelden voor zowel normale groepsberichten als controlecommando's (bijvoorbeeld `/new`, `/reset`).

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

### Gate voor groepsvermeldingen

- `channels.zalouser.groups.<group>.requireMention` bepaalt of groepsantwoorden een vermelding vereisen.
- Resolutievolgorde: exacte groeps-id/naam -> genormaliseerde groepsslug -> `*` -> standaard (`true`).
- Dit geldt zowel voor groepen in de allowlist als voor de open groepsmodus.
- Het citeren van een botbericht telt als een impliciete vermelding voor groepsactivatie.
- Geautoriseerde controlecommando's (bijvoorbeeld `/new`) kunnen de vermeldingsgate omzeilen.
- Wanneer een groepsbericht wordt overgeslagen omdat een vermelding vereist is, slaat OpenClaw het op als wachtende groepsgeschiedenis en neemt het op in het volgende verwerkte groepsbericht.
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

Accounts mappen naar `zalouser`-profielen in de OpenClaw-status. Voorbeeld:

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

- OpenClaw stuurt een typgebeurtenis voordat een antwoord wordt verzonden (best-effort).
- De berichtreactieactie `react` wordt ondersteund voor `zalouser` in kanaalacties.
  - Gebruik `remove: true` om een specifieke reactie-emoji uit een bericht te verwijderen.
  - Reactiesemantiek: [Reacties](/nl/tools/reactions)
- Voor inkomende berichten die eventmetadata bevatten, stuurt OpenClaw afgeleverd- en gezien-bevestigingen (best-effort).

## Problemen oplossen

**Inloggen blijft niet behouden:**

- `openclaw channels status --probe`
- Opnieuw inloggen: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist-/groepsnaam is niet omgezet:**

- Gebruik numerieke ID's in `allowFrom`/`groupAllowFrom` en stabiele groeps-ID's in `groups`. Als je bewust exacte vriend-/groepsnamen nodig hebt, schakel dan `channels.zalouser.dangerouslyAllowNameMatching: true` in.

**Geüpgraded vanaf oude CLI-gebaseerde setup:**

- Verwijder alle oude aannames over externe `zca`-processen.
- Het kanaal draait nu volledig in OpenClaw zonder externe CLI-binaries.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — gedrag van groepschats en vermeldingsgate
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
