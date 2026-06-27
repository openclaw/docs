---
read_when:
    - Zalo Personal instellen voor OpenClaw
    - Zalo Personal-login of berichtenstroom debuggen
summary: Ondersteuning voor persoonlijke Zalo-accounts via native zca-js (QR-login), mogelijkheden en configuratie
title: Zalo persoonlijk
x-i18n:
    generated_at: "2026-06-27T17:13:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdd331d118bfc0d9aba90ac5e42c2ba52e010eafba1342bd3523c64642057dc6
    source_path: channels/zalouser.md
    workflow: 16
---

Status: experimenteel. Deze integratie automatiseert een **persoonlijk Zalo-account** via native `zca-js` binnen OpenClaw.

<Warning>
Dit is een onofficiële integratie en kan leiden tot opschorting of blokkering van je account. Gebruik op eigen risico.
</Warning>

## Gebundelde Plugin

Zalo Personal wordt meegeleverd als gebundelde Plugin in huidige OpenClaw-releases, dus normale
gepakte builds hebben geen aparte installatie nodig.

Als je een oudere build gebruikt of een aangepaste installatie die Zalo Personal uitsluit,
installeer dan het npm-pakket rechtstreeks:

- Installeren via CLI: `openclaw plugins install @openclaw/zalouser`
- Vastgezette versie: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Of vanuit een source checkout: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Details: [Plugins](/nl/tools/plugin)

Er is geen externe `zca`/`openzca` CLI-binary vereist.

## Snelle configuratie (beginner)

1. Zorg dat de Zalo Personal-Plugin beschikbaar is.
   - Huidige gepakte OpenClaw-releases bundelen deze al.
   - Oudere/aangepaste installaties kunnen deze handmatig toevoegen met de bovenstaande opdrachten.
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

4. Herstart de Gateway (of rond de configuratie af).
5. DM-toegang gebruikt standaard pairing; keur de pairingcode goed bij het eerste contact.

## Wat het is

- Draait volledig in-process via `zca-js`.
- Gebruikt native event listeners om inkomende berichten te ontvangen.
- Verstuurt antwoorden rechtstreeks via de JS-API (tekst/media/link).
- Ontworpen voor gebruikssituaties met een "persoonlijk account" waar de Zalo Bot API niet beschikbaar is.

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

- Uitgaande tekst wordt opgesplitst in stukken van ongeveer 2000 tekens (limieten van de Zalo-client).
- Streaming is standaard geblokkeerd.

## Toegangscontrole (DM's)

`channels.zalouser.dmPolicy` ondersteunt: `pairing | allowlist | open | disabled` (standaard: `pairing`).

`channels.zalouser.allowFrom` moet stabiele Zalo-gebruikers-ID's gebruiken. Het kan ook verwijzen naar statische toegangsgroepen voor afzenders (`accessGroup:<name>`). Tijdens interactieve configuratie kunnen ingevoerde namen worden omgezet naar ID's met de in-process contact lookup van de Plugin.

Als een ruwe naam in de configuratie blijft staan, lost startup die alleen op wanneer `channels.zalouser.dangerouslyAllowNameMatching: true` is ingeschakeld. Zonder die opt-in zijn runtime-controles voor afzenders alleen op ID gebaseerd en worden ruwe namen genegeerd voor autorisatie.

Goedkeuren via:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Groepstoegang (optioneel)

- Standaard: `channels.zalouser.groupPolicy = "open"` (groepen toegestaan). Gebruik `channels.defaults.groupPolicy` om de standaardwaarde te overschrijven wanneer deze niet is ingesteld.
- Beperk tot een allowlist met:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (sleutels moeten stabiele groeps-ID's zijn; namen worden bij startup alleen naar ID's omgezet wanneer `channels.zalouser.dangerouslyAllowNameMatching: true` is ingeschakeld)
  - `channels.zalouser.groupAllowFrom` (bepaalt welke afzenders in toegestane groepen de bot kunnen activeren; statische toegangsgroepen voor afzenders kunnen worden verwezen met `accessGroup:<name>`)
- Blokkeer alle groepen: `channels.zalouser.groupPolicy = "disabled"`.
- De configuratiewizard kan vragen om allowlists voor groepen.
- Bij startup zet OpenClaw groeps-/gebruikersnamen in allowlists om naar ID's en logt de mapping alleen wanneer `channels.zalouser.dangerouslyAllowNameMatching: true` is ingeschakeld.
- Matching van groeps-allowlists is standaard alleen op ID gebaseerd. Niet-opgeloste namen worden genegeerd voor auth, tenzij `channels.zalouser.dangerouslyAllowNameMatching: true` is ingeschakeld.
- `channels.zalouser.dangerouslyAllowNameMatching: true` is een break-glass compatibiliteitsmodus die wijzigbare naamresolutie bij startup en runtime-matching op groepsnamen opnieuw inschakelt.
- Als `groupAllowFrom` niet is ingesteld, valt runtime terug op `allowFrom` voor controles van groepsafzenders.
- Afzendercontroles gelden zowel voor normale groepsberichten als voor beheeropdrachten (bijvoorbeeld `/new`, `/reset`).

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

### Mention gating voor groepen

- `channels.zalouser.groups.<group>.requireMention` bepaalt of groepsantwoorden een vermelding vereisen.
- Oplosvolgorde: exacte groeps-id/-naam -> genormaliseerde groepsslug -> `*` -> standaard (`true`).
- Dit geldt zowel voor allowlisted groepen als voor open groepsmodus.
- Het citeren van een botbericht telt als een impliciete vermelding voor groepsactivatie.
- Geautoriseerde beheeropdrachten (bijvoorbeeld `/new`) kunnen mention gating omzeilen.
- Wanneer een groepsbericht wordt overgeslagen omdat een vermelding vereist is, slaat OpenClaw dit op als openstaande groepsgeschiedenis en neemt het op bij het volgende verwerkte groepsbericht.
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

Accounts worden gekoppeld aan `zalouser`-profielen in de OpenClaw-state. Voorbeeld:

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

## Omgevingsvariabelen

De Zalo Personal-Plugin kan profielselectie ook lezen uit omgevingsvariabelen:

- `ZALOUSER_PROFILE`: profielnaam om te gebruiken wanneer er geen `profile` is ingesteld in de kanaal- of accountconfiguratie.
- `ZCA_PROFILE`: verouderde fallback-profielnaam, alleen gebruikt wanneer `ZALOUSER_PROFILE` niet is ingesteld.

Profielnamen selecteren de opgeslagen Zalo-inloggegevens in de OpenClaw-state. De oplosvolgorde is:

1. Expliciet `profile` in configuratie.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. De account-id voor niet-standaardaccounts, of `default` voor het standaardaccount.

Voor configuraties met meerdere accounts geef je bij voorkeur op elk account in de configuratie `profile` op, zodat
één omgevingsvariabele er niet voor zorgt dat meerdere accounts dezelfde inlogsessie delen.

## Typen, reacties en afleverbevestigingen

- OpenClaw stuurt een typing-event voordat een antwoord wordt verzonden (best-effort).
- Berichtreactieactie `react` wordt ondersteund voor `zalouser` in kanaalacties.
  - Gebruik `remove: true` om een specifieke reactie-emoji van een bericht te verwijderen.
  - Reactiesemantiek: [Reacties](/nl/tools/reactions)
- Voor inkomende berichten die eventmetadata bevatten, stuurt OpenClaw afgeleverd- en gezien-bevestigingen (best-effort).

## Probleemoplossing

**Login blijft niet behouden:**

- `openclaw channels status --probe`
- Opnieuw inloggen: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist-/groepsnaam is niet opgelost:**

- Gebruik numerieke ID's in `allowFrom`/`groupAllowFrom` en stabiele groeps-ID's in `groups`. Als je bewust exacte vriend-/groepsnamen nodig hebt, schakel dan `channels.zalouser.dangerouslyAllowNameMatching: true` in.

**Geüpgraded vanaf oude CLI-gebaseerde configuratie:**

- Verwijder alle oude aannames over een extern `zca`-proces.
- Het kanaal draait nu volledig in OpenClaw zonder externe CLI-binaries.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) — alle ondersteunde kanalen
- [Pairing](/nl/channels/pairing) — DM-authenticatie en pairing-flow
- [Groepen](/nl/channels/groups) — gedrag van groepschats en mention gating
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
