---
read_when:
    - Zalo Personal instellen voor OpenClaw
    - Fouten opsporen in de aanmelding of berichtstroom van Zalo Personal
summary: Ondersteuning voor persoonlijke Zalo-accounts via native zca-js (QR-login), mogelijkheden en configuratie
title: Zalo persoonlijk
x-i18n:
    generated_at: "2026-04-29T22:29:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 581a427f7fa37b0fa204f6b813c767eaa7af1f577baf2ac6ea3a31bf23ca6a49
    source_path: channels/zalouser.md
    workflow: 16
---

Status: experimenteel. Deze integratie automatiseert een **persoonlijk Zalo-account** via native `zca-js` binnen OpenClaw.

<Warning>
Dit is een onofficiële integratie en kan leiden tot opschorting of blokkering van je account. Gebruik op eigen risico.
</Warning>

## Gebundelde plugin

Zalo Personal wordt geleverd als gebundelde plugin in huidige OpenClaw-releases, dus normale
verpakte builds hebben geen aparte installatie nodig.

Als je een oudere build gebruikt of een aangepaste installatie die Zalo Personal uitsluit,
installeer dan een huidig npm-pakket zodra er een is gepubliceerd:

- Installeren via CLI: `openclaw plugins install @openclaw/zalouser`
- Of vanuit een source-checkout: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Details: [Plugins](/nl/tools/plugin)

Als npm meldt dat het OpenClaw-pakket als deprecated is gemarkeerd, gebruik dan een huidige verpakte
OpenClaw-build of het lokale checkout-pad totdat een nieuwer npm-pakket is
gepubliceerd.

Er is geen externe `zca`/`openzca` CLI-binary vereist.

## Snelle configuratie (beginner)

1. Zorg dat de Zalo Personal-plugin beschikbaar is.
   - Huidige verpakte OpenClaw-releases bundelen deze al.
   - Oudere/aangepaste installaties kunnen deze handmatig toevoegen met de bovenstaande commando's.
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

4. Herstart de Gateway (of rond de configuratie af).
5. DM-toegang gebruikt standaard koppelen; keur de koppelcode goed bij het eerste contact.

## Wat het is

- Draait volledig in-process via `zca-js`.
- Gebruikt native event listeners om inkomende berichten te ontvangen.
- Verstuurt antwoorden rechtstreeks via de JS API (tekst/media/link).
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

- Uitgaande tekst wordt opgesplitst in stukken van ongeveer 2000 tekens (Zalo-clientlimieten).
- Streaming is standaard geblokkeerd.

## Toegangsbeheer (DM's)

`channels.zalouser.dmPolicy` ondersteunt: `pairing | allowlist | open | disabled` (standaard: `pairing`).

`channels.zalouser.allowFrom` accepteert gebruikers-ID's of namen. Tijdens de configuratie worden namen omgezet naar ID's met behulp van de in-process contactlookup van de plugin.

Goedkeuren via:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Groepstoegang (optioneel)

- Standaard: `channels.zalouser.groupPolicy = "open"` (groepen toegestaan). Gebruik `channels.defaults.groupPolicy` om de standaard te overschrijven wanneer deze niet is ingesteld.
- Beperk tot een allowlist met:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (sleutels moeten stabiele groeps-ID's zijn; namen worden bij het opstarten waar mogelijk naar ID's omgezet)
  - `channels.zalouser.groupAllowFrom` (bepaalt welke afzenders in toegestane groepen de bot kunnen activeren)
- Alle groepen blokkeren: `channels.zalouser.groupPolicy = "disabled"`.
- De configuratiewizard kan om allowlists voor groepen vragen.
- Bij het opstarten zet OpenClaw groeps-/gebruikersnamen in allowlists om naar ID's en logt de mapping.
- Matching van groeps-allowlists is standaard alleen op ID. Niet-opgeloste namen worden genegeerd voor auth, tenzij `channels.zalouser.dangerouslyAllowNameMatching: true` is ingeschakeld.
- `channels.zalouser.dangerouslyAllowNameMatching: true` is een break-glass-compatibiliteitsmodus die matching op veranderlijke groepsnamen opnieuw inschakelt.
- Als `groupAllowFrom` niet is ingesteld, valt runtime terug op `allowFrom` voor controles van groepsafzenders.
- Afzendercontroles zijn van toepassing op zowel normale groepsberichten als controlecommando's (bijvoorbeeld `/new`, `/reset`).

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

### Groepsvermeldingsgating

- `channels.zalouser.groups.<group>.requireMention` bepaalt of groepsantwoorden een vermelding vereisen.
- Volgorde van resolving: exacte groeps-id/naam -> genormaliseerde groeps-slug -> `*` -> standaard (`true`).
- Dit geldt zowel voor groepen op de allowlist als voor open groepsmodus.
- Het citeren van een botbericht telt als een impliciete vermelding voor groepsactivatie.
- Geautoriseerde controlecommando's (bijvoorbeeld `/new`) kunnen vermeldingsgating omzeilen.
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

Accounts worden gemapt naar `zalouser`-profielen in de OpenClaw-status. Voorbeeld:

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

## Typen, reacties en afleverbevestigingen

- OpenClaw verstuurt een typing-event voordat een antwoord wordt verzonden (best-effort).
- Berichtreactieactie `react` wordt ondersteund voor `zalouser` in kanaalacties.
  - Gebruik `remove: true` om een specifieke reactie-emoji van een bericht te verwijderen.
  - Reactiesemantiek: [Reacties](/nl/tools/reactions)
- Voor inkomende berichten die eventmetadata bevatten, verstuurt OpenClaw delivered- en seen-bevestigingen (best-effort).

## Problemen oplossen

**Inloggen blijft niet behouden:**

- `openclaw channels status --probe`
- Opnieuw inloggen: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist-/groepsnaam is niet omgezet:**

- Gebruik numerieke ID's in `allowFrom`/`groupAllowFrom`/`groups`, of exacte vriend-/groepsnamen.

**Geüpgraded vanaf oude CLI-gebaseerde configuratie:**

- Verwijder aannames over oude externe `zca`-processen.
- Het kanaal draait nu volledig in OpenClaw zonder externe CLI-binaries.

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — gedrag van groepschats en vermeldingsgating
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
