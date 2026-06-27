---
read_when:
    - Werken aan het oplossen van authenticatieprofielen of routering van inloggegevens
    - Modelauthenticatiefouten of profielvolgorde debuggen
summary: Canonieke geschiktheid van inloggegevens en resolutiesemantiek voor auth-profielen
title: Referentiesemantiek voor authenticatie
x-i18n:
    generated_at: "2026-06-27T17:08:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 591c0384e1d43512252aaa7b362141b6bc93183b30b5847168758f86127f0663
    source_path: auth-credential-semantics.md
    workflow: 16
---

Dit document definieert de canonieke semantiek voor geschiktheid en resolutie van referenties die wordt gebruikt in:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Het doel is om gedrag tijdens selectie en runtimegedrag op elkaar afgestemd te houden.

## Stabiele redencodes voor probes

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
3. Als `expires` aanwezig is, moet het een eindig getal groter dan `0` zijn.
4. Als `expires` ongeldig is (`NaN`, `0`, negatief, niet-eindig of verkeerd type), is het profiel niet geschikt met `invalid_expires`.
5. Als `expires` in het verleden ligt, is het profiel niet geschikt met `expired`.
6. `tokenRef` omzeilt de validatie van `expires` niet.

### Resolutieregels

1. De semantiek van de resolver komt overeen met de geschiktheidssemantiek voor `expires`.
2. Voor geschikte profielen kan tokenmateriaal worden opgelost vanuit een inline waarde of `tokenRef`.
3. Niet-oplosbare refs produceren `unresolved_ref` in de uitvoer van `models status --probe`.

## Portabiliteit van agentkopieën

Overerving van agentauthenticatie is read-through. Wanneer een agent geen lokaal profiel heeft, kan deze tijdens runtime profielen oplossen vanuit de standaard-/hoofdagentopslag zonder geheim materiaal naar zijn eigen `auth-profiles.json` te kopiëren.

Expliciete kopieerstromen, zoals `openclaw agents add`, gebruiken dit portabiliteitsbeleid:

- `api_key`-profielen zijn portable tenzij `copyToAgents: false`.
- `token`-profielen zijn portable tenzij `copyToAgents: false`.
- `oauth`-profielen zijn standaard niet portable, omdat vernieuwingstokens eenmalig bruikbaar of rotatiegevoelig kunnen zijn.
- OAuth-stromen die eigendom zijn van de provider mogen zich alleen aanmelden met `copyToAgents: true` wanneer bekend is dat het kopiëren van vernieuwingsmateriaal tussen agents veilig is.

Niet-portable profielen blijven beschikbaar via read-through overerving, tenzij de doelagent afzonderlijk inlogt en zijn eigen lokale profiel aanmaakt.

## Configuratie-only authroutes

`auth.profiles`-items met `mode: "aws-sdk"` zijn routeringsmetadata, geen opgeslagen referenties. Ze zijn geldig wanneer de doelprovider `models.providers.<id>.auth: "aws-sdk"` gebruikt of de door de Plugin beheerde Amazon Bedrock-installatie de AWS SDK-route gebruikt. Deze profiel-id’s mogen voorkomen in `auth.order` en sessie-overschrijvingen, zelfs wanneer er geen overeenkomend item bestaat in `auth-profiles.json`.

Schrijf geen `type: "aws-sdk"` naar `auth-profiles.json`. Als een oudere installatie zo’n marker heeft, verplaatst `openclaw doctor --fix` deze naar `auth.profiles` en verwijdert de marker uit de referentieopslag.

## Expliciete filtering van authvolgorde

- Wanneer `auth.order.<provider>` of de volgorde-overschrijving van de authopslag voor een provider is ingesteld, probet `models status --probe` alleen profiel-id’s die in de opgeloste authvolgorde voor die provider blijven.
- Een opgeslagen profiel voor die provider dat uit de expliciete volgorde is weggelaten, wordt later niet stilzwijgend geprobeerd. Probe-uitvoer rapporteert het met `reasonCode: excluded_by_auth_order` en de detailmelding `Excluded by auth.order for this provider.`

## Resolutie van probedoelen

- Probedoelen kunnen afkomstig zijn van authprofielen, omgevingsreferenties of `models.json`.
- Als een provider referenties heeft maar OpenClaw er geen probeerbare modelkandidaat voor kan oplossen, rapporteert `models status --probe` `status: no_model` met `reasonCode: no_model`.

## Ontdekking van externe CLI-referenties

- Runtime-only referenties die eigendom zijn van externe CLI’s worden alleen ontdekt wanneer de provider, runtime of het authprofiel binnen scope is voor de huidige bewerking, of wanneer er al een opgeslagen lokaal profiel voor die externe bron bestaat.
- Aanroepers van authopslag moeten een expliciete ontdekkingsmodus voor externe CLI’s kiezen: `none` voor alleen persistente/Plugin-auth, `existing` voor het vernieuwen van al opgeslagen externe CLI-profielen, of `scoped` voor een concrete provider-/profielset.
- Read-only-/statuspaden geven `allowKeychainPrompt: false` door; ze gebruiken alleen bestandsgedragen externe CLI-referenties en lezen of hergebruiken geen macOS Keychain-resultaten.

## Beleidsbewaking voor OAuth SecretRef

- SecretRef-invoer is alleen bedoeld voor statische referenties.
- Als een profielreferentie `type: "oauth"` is, worden SecretRef-objecten niet ondersteund voor het referentiemateriaal van dat profiel.
- Als `auth.profiles.<id>.mode` `"oauth"` is, wordt door SecretRef ondersteunde `keyRef`/`tokenRef`-invoer voor dat profiel geweigerd.
- Overtredingen zijn harde fouten in authresolutiepaden voor opstarten/herladen.

## Legacy-compatibele berichten

Voor scriptcompatibiliteit blijft deze eerste regel van probefouten ongewijzigd:

`Auth profile credentials are missing or expired.`

Mensvriendelijke details en stabiele redencodes kunnen op volgende regels worden toegevoegd.

## Gerelateerd

- [Geheimenbeheer](/nl/gateway/secrets)
- [Authopslag](/nl/concepts/oauth)
