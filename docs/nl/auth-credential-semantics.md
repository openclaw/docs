---
read_when:
    - Werken aan auth-profielresolutie of routering van aanmeldgegevens
    - Modelauthenticatiefouten of profielvolgorde debuggen
summary: Canonieke geschiktheid van inloggegevens en resolutiesemantiek voor authenticatieprofielen
title: Semantiek van authenticatiegegevens
x-i18n:
    generated_at: "2026-05-07T13:13:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d916ff95ca2ac1fe21e66f64b887b1df1e6b97d7dcc681e5bb9a9dee8ce9473
    source_path: auth-credential-semantics.md
    workflow: 16
---

Dit document definieert de canonieke semantiek voor geschiktheid en resolutie van referenties die wordt gebruikt in:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Het doel is om gedrag tijdens selectie en runtime op elkaar afgestemd te houden.

## Stabiele reden-codes voor probes

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Tokenreferenties

Tokenreferenties (`type: "token"`) ondersteunen inline `token` en/of `tokenRef`.

### Geschiktheidsregels

1. Een tokenprofiel is niet geschikt wanneer zowel `token` als `tokenRef` ontbreken.
2. `expires` is optioneel.
3. Als `expires` aanwezig is, moet dit een eindig getal groter dan `0` zijn.
4. Als `expires` ongeldig is (`NaN`, `0`, negatief, niet-eindig of van het verkeerde type), is het profiel niet geschikt met `invalid_expires`.
5. Als `expires` in het verleden ligt, is het profiel niet geschikt met `expired`.
6. `tokenRef` omzeilt de validatie van `expires` niet.

### Resolutieregels

1. Resolversemantiek komt overeen met geschiktheidssemantiek voor `expires`.
2. Voor geschikte profielen kan tokenmateriaal worden opgelost vanuit een inline waarde of `tokenRef`.
3. Niet-oplosbare referenties produceren `unresolved_ref` in de uitvoer van `models status --probe`.

## Overdraagbaarheid van agentkopieën

Overerving van agentverificatie is read-through. Wanneer een agent geen lokaal profiel heeft, kan deze tijdens runtime profielen oplossen vanuit de standaard-/hoofdopslag van de agent zonder geheim materiaal naar zijn eigen `auth-profiles.json` te kopiëren.

Expliciete kopieerstromen, zoals `openclaw agents add`, gebruiken dit overdraagbaarheidsbeleid:

- `api_key`-profielen zijn overdraagbaar, tenzij `copyToAgents: false`.
- `token`-profielen zijn overdraagbaar, tenzij `copyToAgents: false`.
- `oauth`-profielen zijn standaard niet overdraagbaar omdat refreshtokens eenmalig bruikbaar of rotatiegevoelig kunnen zijn.
- OAuth-stromen die eigendom zijn van providers kunnen zich aanmelden met `copyToAgents: true` alleen wanneer bekend is dat het kopiëren van refreshmateriaal tussen agents veilig is.

Niet-overdraagbare profielen blijven beschikbaar via read-through overerving, tenzij de doelagent afzonderlijk inlogt en zijn eigen lokale profiel maakt.

## Config-only verificatieroutes

`auth.profiles`-vermeldingen met `mode: "aws-sdk"` zijn routeringsmetadata, geen opgeslagen referenties. Ze zijn geldig wanneer de doelprovider `models.providers.<id>.auth: "aws-sdk"` gebruikt of de ingebouwde standaard AWS SDK-route van Amazon Bedrock. Deze profiel-id's mogen voorkomen in `auth.order` en sessie-overschrijvingen, zelfs wanneer er geen overeenkomende vermelding bestaat in `auth-profiles.json`.

Schrijf `type: "aws-sdk"` niet naar `auth-profiles.json`. Als een verouderde installatie zo'n markering heeft, verplaatst `openclaw doctor --fix` deze naar `auth.profiles` en verwijdert de markering uit de referentieopslag.

## Expliciete filtering op verificatievolgorde

- Wanneer `auth.order.<provider>` of de volgorde-overschrijving van de auth-store is ingesteld voor een provider, probet `models status --probe` alleen profiel-id's die in de opgeloste verificatievolgorde voor die provider blijven.
- Een opgeslagen profiel voor die provider dat is weggelaten uit de expliciete volgorde, wordt later niet stilzwijgend geprobeerd. Probe-uitvoer rapporteert dit met `reasonCode: excluded_by_auth_order` en de details `Excluded by auth.order for this provider.`

## Resolutie van probedoelen

- Probedoelen kunnen afkomstig zijn van verificatieprofielen, omgevingsreferenties of `models.json`.
- Als een provider referenties heeft maar OpenClaw geen probeerbare modelkandidaat ervoor kan oplossen, rapporteert `models status --probe` `status: no_model` met `reasonCode: no_model`.

## Externe CLI-referentiedetectie

- Runtime-only referenties die eigendom zijn van externe CLI's worden alleen ontdekt wanneer de provider, runtime of het verificatieprofiel binnen bereik is voor de huidige bewerking, of wanneer er al een opgeslagen lokaal profiel voor die externe bron bestaat.
- Auth-store-aanroepers moeten een expliciete detectiemodus voor externe CLI's kiezen: `none` voor alleen persistente/plugin-verificatie, `existing` voor het vernieuwen van al opgeslagen externe CLI-profielen, of `scoped` voor een concrete provider-/profielset.
- Alleen-lezen/statuspaden geven `allowKeychainPrompt: false` door; ze gebruiken alleen bestandsgebaseerde externe CLI-referenties en lezen of hergebruiken geen macOS Keychain-resultaten.

## OAuth SecretRef-beleidsbescherming

- SecretRef-invoer is alleen voor statische referenties.
- Als een profielreferentie `type: "oauth"` is, worden SecretRef-objecten niet ondersteund voor dat profielreferentiemateriaal.
- Als `auth.profiles.<id>.mode` `"oauth"` is, wordt SecretRef-gebaseerde `keyRef`/`tokenRef`-invoer voor dat profiel geweigerd.
- Schendingen zijn harde fouten in verificatieresolutiepaden voor opstarten/herladen.

## Legacy-compatibele berichten

Voor scriptcompatibiliteit behouden probe-fouten deze eerste regel ongewijzigd:

`Auth profile credentials are missing or expired.`

Mensvriendelijke details en stabiele reden-codes kunnen op volgende regels worden toegevoegd.

## Gerelateerd

- [Geheimenbeheer](/nl/gateway/secrets)
- [Verificatieopslag](/nl/concepts/oauth)
