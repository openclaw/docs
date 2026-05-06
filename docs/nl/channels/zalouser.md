---
read_when:
    - Zalo Personal instellen voor OpenClaw
    - Debuggen van Zalo Personal-aanmelding of berichtenstroom
summary: Ondersteuning voor persoonlijke Zalo-accounts via native zca-js (QR-login), mogelijkheden en configuratie
title: Zalo persoonlijk
x-i18n:
    generated_at: "2026-05-06T17:52:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: d56cbf0a6300709e9fe23421cd134acc68852d0025f305c73413308f412349e8
    source_path: channels/zalouser.md
    workflow: 16
---

Status: experimenteel. Deze integratie automatiseert een **persoonlijk Zalo-account** via native `zca-js` binnen OpenClaw.

<Warning>
Dit is een onofficiële integratie en kan leiden tot opschorting of blokkering van je account. Gebruik op eigen risico.
</Warning>

## Gebundelde Plugin

Zalo Personal wordt geleverd als gebundelde Plugin in huidige OpenClaw-releases, dus normale
pakketbuilds hebben geen aparte installatie nodig.

Als je een oudere build gebruikt of een aangepaste installatie die Zalo Personal uitsluit,
installeer dan het npm-pakket rechtstreeks:

- Installeren via CLI: `openclaw plugins install @openclaw/zalouser`
- Vastgezette versie: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Of vanuit een source-checkout: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Details: [Plugins](/nl/tools/plugin)

Er is geen externe `zca`/`openzca` CLI-binary vereist.

## Snelle setup (beginner)

1. Zorg dat de Zalo Personal-Plugin beschikbaar is.
   - Huidige verpakte OpenClaw-releases bundelen deze al.
   - Oudere/aangepaste installaties kunnen deze handmatig toevoegen met de bovenstaande opdrachten.
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

4. Herstart de Gateway (of rond de setup af).
5. DM-toegang gebruikt standaard koppeling; keur de koppelingscode goed bij het eerste contact.

## Wat het is

- Draait volledig in-process via `zca-js`.
- Gebruikt native eventlisteners om inkomende berichten te ontvangen.
- Stuurt antwoorden rechtstreeks via de JS-API (tekst/media/link).
- Ontworpen voor gebruikssituaties met een "persoonlijk account" waarin de Zalo Bot API niet beschikbaar is.

## Naamgeving

Kanaal-id is `zalouser` om expliciet te maken dat dit een **persoonlijk Zalo-gebruikersaccount** automatiseert (onofficieel). We houden `zalo` gereserveerd voor een mogelijke toekomstige officiële Zalo API-integratie.

## ID's vinden (directory)

Gebruik de directory-CLI om peers/groepen en hun ID's te ontdekken:

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

`channels.zalouser.allowFrom` moet stabiele Zalo-gebruikers-ID's gebruiken. Tijdens interactieve setup kunnen ingevoerde namen worden omgezet naar ID's met de in-process contactlookup van de Plugin.

Als een ruwe naam in de configuratie blijft staan, lost startup deze alleen op wanneer `channels.zalouser.dangerouslyAllowNameMatching: true` is ingeschakeld. Zonder die opt-in zijn runtime-afzendercontroles alleen op ID gebaseerd en worden ruwe namen genegeerd voor autorisatie.

Goedkeuren via:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Groepstoegang (optioneel)

- Standaard: `channels.zalouser.groupPolicy = "open"` (groepen toegestaan). Gebruik `channels.defaults.groupPolicy` om de standaard te overschrijven wanneer deze niet is ingesteld.
- Beperk tot een allowlist met:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (sleutels moeten stabiele groeps-ID's zijn; namen worden bij startup alleen naar ID's omgezet wanneer `channels.zalouser.dangerouslyAllowNameMatching: true` is ingeschakeld)
  - `channels.zalouser.groupAllowFrom` (bepaalt welke afzenders in toegestane groepen de bot kunnen activeren)
- Blokkeer alle groepen: `channels.zalouser.groupPolicy = "disabled"`.
- De configuratiewizard kan om groeps-allowlists vragen.
- Bij startup zet OpenClaw groeps-/gebruikersnamen in allowlists om naar ID's en logt de mapping alleen wanneer `channels.zalouser.dangerouslyAllowNameMatching: true` is ingeschakeld.
- Groeps-allowlistmatching is standaard alleen op ID gebaseerd. Niet-opgeloste namen worden genegeerd voor autorisatie, tenzij `channels.zalouser.dangerouslyAllowNameMatching: true` is ingeschakeld.
- `channels.zalouser.dangerouslyAllowNameMatching: true` is een noodcompatibiliteitsmodus die veranderlijke startup-naamresolutie en runtime-groepsnaammatching opnieuw inschakelt.
- Als `groupAllowFrom` niet is ingesteld, valt runtime terug op `allowFrom` voor groepsafzendercontroles.
- Afzendercontroles zijn van toepassing op zowel normale groepsberichten als controleopdrachten (bijvoorbeeld `/new`, `/reset`).

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

### Groepsvermelding-gating

- `channels.zalouser.groups.<group>.requireMention` bepaalt of groepsantwoorden een vermelding vereisen.
- Resolutievolgorde: exacte groeps-id/naam -> genormaliseerde groepsslug -> `*` -> standaard (`true`).
- Dit geldt voor zowel allowlist-groepen als open groepsmodus.
- Het citeren van een botbericht telt als een impliciete vermelding voor groepsactivering.
- Geautoriseerde controleopdrachten (bijvoorbeeld `/new`) kunnen vermelding-gating omzeilen.
- Wanneer een groepsbericht wordt overgeslagen omdat een vermelding vereist is, slaat OpenClaw dit op als wachtende groepsgeschiedenis en neemt het dit op in het volgende verwerkte groepsbericht.
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

## Typen, reacties en bezorgbevestigingen

- OpenClaw stuurt een type-event voordat een antwoord wordt verzonden (best-effort).
- Berichtreactieactie `react` wordt ondersteund voor `zalouser` in kanaalacties.
  - Gebruik `remove: true` om een specifieke reactie-emoji uit een bericht te verwijderen.
  - Reactiesemantiek: [Reacties](/nl/tools/reactions)
- Voor inkomende berichten die eventmetadata bevatten, stuurt OpenClaw bezorgd- + gezien-bevestigingen (best-effort).

## Probleemoplossing

**Login blijft niet behouden:**

- `openclaw channels status --probe`
- Opnieuw inloggen: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist-/groepsnaam is niet opgelost:**

- Gebruik numerieke ID's in `allowFrom`/`groupAllowFrom` en stabiele groeps-ID's in `groups`. Als je bewust exacte vriend-/groepsnamen nodig hebt, schakel dan `channels.zalouser.dangerouslyAllowNameMatching: true` in.

**Geüpgraded vanaf oude CLI-gebaseerde setup:**

- Verwijder alle oude aannames over externe `zca`-processen.
- Het kanaal draait nu volledig in OpenClaw zonder externe CLI-binaries.

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppeling](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — groepschatgedrag en vermelding-gating
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
