---
read_when:
    - Zalo Personal instellen voor OpenClaw
    - Aanmelding of berichtenstroom van Zalo Personal debuggen
summary: Ondersteuning voor persoonlijke Zalo-accounts via de systeemeigen zca-js (inloggen met QR-code), mogelijkheden en configuratie
title: Zalo persoonlijk
x-i18n:
    generated_at: "2026-07-12T08:41:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 962697c4a56dfb733fe4973e23129ccb365506e35c09e673365842f45a837949
    source_path: channels/zalouser.md
    workflow: 16
---

Status: experimenteel. Deze integratie automatiseert een **persoonlijk Zalo-account** via de native `zca-js`, binnen het proces en zonder extern CLI-programma.

<Warning>
Dit is een onofficiële integratie en kan leiden tot opschorting of blokkering van het account. Gebruik is op eigen risico.
</Warning>

## Installatie

Zalo Personal is een officiële externe plugin en wordt niet met de kern meegeleverd. Installeer deze vóór gebruik:

```bash
openclaw plugins install @openclaw/zalouser
```

- Een versie vastzetten: `openclaw plugins install @openclaw/zalouser@<version>`
- Vanuit een broncodecheckout: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Details: [Plugins](/nl/tools/plugin)

## Snelle configuratie

1. Installeer de plugin (hierboven).
2. Meld u aan (via QR, op de Gateway-machine):
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

4. Start de Gateway opnieuw (of voltooi de configuratie).
5. Toegang tot privéberichten gebruikt standaard koppeling; keur bij het eerste contact de koppelingscode goed.

## Wat het is

- Draait volledig binnen het proces via de bibliotheek `zca-js` (zonder extern programma `zca`/`openzca`).
- Gebruikt native gebeurtenislisteners (`message`, `error`) om inkomende berichten te ontvangen.
- Verstuurt antwoorden rechtstreeks via de JS-API (tekst/media/koppeling).
- Ontworpen voor gebruiksscenario's met een persoonlijk account waarin de Zalo Bot API niet beschikbaar is.

## Naamgeving

De kanaal-id is `zalouser` om expliciet te maken dat hiermee een **persoonlijk Zalo-gebruikersaccount** wordt geautomatiseerd (onofficieel). `zalo` is gereserveerd voor een mogelijke toekomstige officiële integratie met de Zalo-API.

## ID's vinden (adresboek)

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Beperkingen

- Uitgaande tekst wordt opgesplitst in stukken van 2000 tekens (limiet van de Zalo-client).
- Streaming wordt niet ondersteund.

## Toegangsbeheer (privéberichten)

`channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled` (standaard: `pairing`).

`channels.zalouser.allowFrom` moet stabiele Zalo-gebruikers-ID's gebruiken. Het kan ook verwijzen naar statische afzenderstoegangsgroepen (`accessGroup:<name>`). Tijdens de interactieve configuratie kunnen ingevoerde namen worden omgezet in ID's via de contactzoekfunctie van de plugin binnen het proces.

Als een onbewerkte naam in de configuratie blijft staan, wordt deze bij het opstarten alleen omgezet wanneer `channels.zalouser.dangerouslyAllowNameMatching: true` is ingeschakeld. Zonder deze expliciete toestemming controleren runtimecontroles voor afzenders uitsluitend ID's en worden onbewerkte namen genegeerd voor autorisatie.

Goedkeuren via:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Groepstoegang (optioneel)

- Standaard: `channels.zalouser.groupPolicy = "allowlist"` (groepen vereisen een expliciete vermelding in de toelatingslijst).
- Alle groepen openen: `channels.zalouser.groupPolicy = "open"`.
- Alle groepen blokkeren: `channels.zalouser.groupPolicy = "disabled"`.
- Met `groupPolicy = "allowlist"`:
  - De sleutels van `channels.zalouser.groups` moeten stabiele groeps-ID's zijn; namen worden bij het opstarten alleen omgezet in ID's wanneer `channels.zalouser.dangerouslyAllowNameMatching: true` is ingeschakeld.
  - `channels.zalouser.groupAllowFrom` bepaalt welke afzenders in toegestane groepen de bot kunnen activeren; naar statische afzenderstoegangsgroepen kan worden verwezen met `accessGroup:<name>`.
- De configuratiewizard kan om toelatingslijsten voor groepen vragen.
- Vergelijking met de toelatingslijst voor groepen gebeurt standaard uitsluitend op basis van ID's. Niet-omgezette namen worden voor autorisatie genegeerd, tenzij `channels.zalouser.dangerouslyAllowNameMatching: true` is ingeschakeld.
- `channels.zalouser.dangerouslyAllowNameMatching: true` is een compatibiliteitsmodus voor noodgevallen die veranderlijke naamomzetting bij het opstarten en runtimevergelijking van groepsnamen opnieuw inschakelt.
- `groupAllowFrom` valt voor normale groepsberichten **niet** terug op `allowFrom`: als dit leeg blijft voor een groep op de toelatingslijst, wordt die groep opengesteld voor elke afzender. Geautoriseerde beheeropdrachten (bijvoorbeeld `/new`) vormen de uitzondering; controles van afzenders van opdrachten vallen terug op `allowFrom` wanneer `groupAllowFrom` leeg is.

Voorbeeld:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { enabled: true },
        "Work Chat": { enabled: true },
      },
    },
  },
}
```

<Note>
`channels.zalouser.groups.<id>.allow` is een verouderde veldnaam; de huidige configuratie gebruikt `enabled`. `openclaw doctor --fix` migreert `allow` automatisch naar `enabled`.
</Note>

### Vermeldingsvereiste voor groepen

- `channels.zalouser.groups.<group>.requireMention` bepaalt of voor antwoorden in groepen een vermelding vereist is.
- Volgorde van omzetting: groeps-ID -> alias `group:<id>` -> groepsnaam/slug (kandidaten op basis van namen zijn alleen van toepassing wanneer `dangerouslyAllowNameMatching: true`) -> `*` -> standaard (`true`).
- Geldt zowel voor groepen op de toelatingslijst als voor de modus met open groepen.
- Het citeren van een botbericht geldt als een impliciete vermelding voor groepsactivering.
- Geautoriseerde beheeropdrachten (bijvoorbeeld `/new`) kunnen de vermeldingsvereiste omzeilen.
- Wanneer een groepsbericht wordt overgeslagen omdat een vermelding vereist is, slaat OpenClaw dit op als wachtende groepsgeschiedenis en neemt het dit op bij het volgende verwerkte groepsbericht.
- Limiet voor groepsgeschiedenis: `channels.zalouser.historyLimit`, vervolgens `messages.groupChat.historyLimit` en daarna een terugvalwaarde van `50`.

Voorbeeld:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { enabled: true, requireMention: true },
        "Work Chat": { enabled: true, requireMention: false },
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

## Omgevingsvariabelen

De profielselectie kan ook afkomstig zijn uit omgevingsvariabelen:

| Variabele          | Doel                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `ZALOUSER_PROFILE` | Te gebruiken profielnaam wanneer geen `profile` is ingesteld in de kanaal- of accountconfiguratie. |
| `ZCA_PROFILE`      | Verouderde terugvaloptie, alleen gebruikt wanneer `ZALOUSER_PROFILE` niet is ingesteld.         |

Profielnamen selecteren de opgeslagen Zalo-aanmeldgegevens in de OpenClaw-status. Volgorde van omzetting:

1. Expliciete `profile` in de configuratie.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. De account-id voor niet-standaardaccounts, of `default` voor het standaardaccount.

Voor configuraties met meerdere accounts verdient het de voorkeur om `profile` voor elk account in de configuratie in te stellen, zodat één omgevingsvariabele er niet toe leidt dat meerdere accounts dezelfde aanmeldsessie delen.

## Typen, reacties en ontvangstbevestigingen

- OpenClaw verstuurt een typgebeurtenis voordat een antwoord wordt verzonden (naar beste vermogen).
- De berichtreactieactie `react` wordt ondersteund voor `zalouser` in kanaalacties.
  - Gebruik `remove: true` om een specifieke reactie-emoji van een bericht te verwijderen.
  - Betekenis van reacties: [Reacties](/nl/tools/reactions)
- Voor inkomende berichten die gebeurtenismetadata bevatten, verstuurt OpenClaw bevestigingen voor afgeleverd en gezien (naar beste vermogen).

## Probleemoplossing

**Aanmelding blijft niet behouden:**

- `openclaw channels status --probe`
- Opnieuw aanmelden: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Naam in toelatingslijst/groepsnaam kon niet worden omgezet:**

- Gebruik numerieke ID's in `allowFrom`/`groupAllowFrom` en stabiele groeps-ID's in `groups`. Als u bewust exacte namen van vrienden/groepen nodig hebt, schakel dan `channels.zalouser.dangerouslyAllowNameMatching: true` in.

**Bijgewerkt vanuit een oude externe configuratie op basis van `zca`/CLI:**

- Verwijder alle aannames over een extern `zca`-proces; het kanaal draait nu volledig binnen het proces via `zca-js`, zonder extern CLI-programma.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) - alle ondersteunde kanalen
- [Koppeling](/nl/channels/pairing) - authenticatie voor privéberichten en koppelingsproces
- [Groepen](/nl/channels/groups) - gedrag van groepschats en vermeldingsvereiste
- [Kanaalroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) - toegangsmodel en beveiligingsversterking
