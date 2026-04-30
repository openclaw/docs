---
read_when:
    - Werken aan auth-profielresolutie of routering van aanmeldgegevens
    - Fouten in modelauthenticatie of profielvolgorde opsporen
summary: Canonieke geschiktheid van inloggegevens en resolutiesemantiek voor authenticatieprofielen
title: Semantiek van authenticatiegegevens
x-i18n:
    generated_at: "2026-04-30T21:02:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39b9f96159d5a7b793983d07c37a73139a0904abbbc8831267807d6acf5c0037
    source_path: auth-credential-semantics.md
    workflow: 16
---

Dit document definieert de canonieke semantiek voor credential-geschiktheid en -resolutie die wordt gebruikt in:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Het doel is om gedrag tijdens selectie en runtimegedrag op elkaar afgestemd te houden.

## Stabiele reden-codes voor probes

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Tokencredentials

Tokencredentials (`type: "token"`) ondersteunen inline `token` en/of `tokenRef`.

### Geschiktheidsregels

1. Een tokenprofiel is niet geschikt wanneer zowel `token` als `tokenRef` ontbreken.
2. `expires` is optioneel.
3. Als `expires` aanwezig is, moet het een eindig getal groter dan `0` zijn.
4. Als `expires` ongeldig is (`NaN`, `0`, negatief, niet-eindig of verkeerd type), is het profiel niet geschikt met `invalid_expires`.
5. Als `expires` in het verleden ligt, is het profiel niet geschikt met `expired`.
6. `tokenRef` omzeilt de validatie van `expires` niet.

### Resolutieregels

1. Resolversemantiek komt overeen met de geschiktheidssemantiek voor `expires`.
2. Voor geschikte profielen kan tokenmateriaal worden opgelost vanuit een inline waarde of `tokenRef`.
3. Niet-oplosbare refs produceren `unresolved_ref` in de uitvoer van `models status --probe`.

## Portabiliteit van agentkopieën

Overerving van agent-auth is read-through. Wanneer een agent geen lokaal profiel heeft, kan deze
tijdens runtime profielen oplossen vanuit de standaard-/hoofdagentopslag zonder
geheim materiaal naar zijn eigen `auth-profiles.json` te kopiëren.

Expliciete kopieerstromen, zoals `openclaw agents add`, gebruiken dit portabiliteitsbeleid:

- `api_key`-profielen zijn portabel tenzij `copyToAgents: false`.
- `token`-profielen zijn portabel tenzij `copyToAgents: false`.
- `oauth`-profielen zijn standaard niet portabel omdat refreshtokens
  eenmalig bruikbaar of rotatiegevoelig kunnen zijn.
- OAuth-stromen die eigendom zijn van providers kunnen zich aanmelden met `copyToAgents: true`, alleen wanneer
  bekend is dat het kopiëren van refreshmateriaal tussen agents veilig is.

Niet-portabele profielen blijven beschikbaar via read-through-overerving tenzij
de doelagent zich afzonderlijk aanmeldt en zijn eigen lokale profiel aanmaakt.

## Expliciete filtering op auth-volgorde

- Wanneer `auth.order.<provider>` of de volgorde-override van de auth-opslag is ingesteld voor een
  provider, voert `models status --probe` alleen probes uit op profiel-id's die in de
  opgeloste auth-volgorde voor die provider blijven.
- Een opgeslagen profiel voor die provider dat uit de expliciete volgorde is weggelaten, wordt
  later niet stilzwijgend alsnog geprobeerd. Probe-uitvoer rapporteert dit met
  `reasonCode: excluded_by_auth_order` en het detail
  `Excluded by auth.order for this provider.`

## Resolutie van probe-doelen

- Probe-doelen kunnen afkomstig zijn uit auth-profielen, omgevingscredentials of
  `models.json`.
- Als een provider credentials heeft maar OpenClaw er geen geschikt model
  voor een probe voor kan oplossen, rapporteert `models status --probe` `status: no_model` met
  `reasonCode: no_model`.

## Detectie van credentials van externe CLI's

- Runtime-only credentials die eigendom zijn van externe CLI's worden alleen gedetecteerd wanneer de
  provider, runtime of het auth-profiel binnen het bereik van de huidige bewerking valt, of
  wanneer er al een opgeslagen lokaal profiel voor die externe bron bestaat.
- Callers van de auth-opslag moeten een expliciete detectiemodus voor externe CLI's kiezen:
  `none` voor alleen persistente/Plugin-auth, `existing` voor het vernieuwen van al
  opgeslagen externe CLI-profielen, of `scoped` voor een concrete provider-/profielset.
- Read-only/statuspaden geven `allowKeychainPrompt: false` door; ze gebruiken alleen bestandsgebaseerde
  externe CLI-credentials en lezen of hergebruiken geen macOS Keychain-resultaten.

## Beleidsbewaking voor OAuth SecretRef

- SecretRef-invoer is alleen voor statische credentials.
- Als een profielcredential `type: "oauth"` is, worden SecretRef-objecten niet ondersteund voor dat profielcredentialmateriaal.
- Als `auth.profiles.<id>.mode` `"oauth"` is, wordt SecretRef-gebaseerde `keyRef`/`tokenRef`-invoer voor dat profiel geweigerd.
- Schendingen zijn harde fouten in auth-resolutiepaden voor opstarten/herladen.

## Legacy-compatibele berichten

Voor scriptcompatibiliteit houden probe-fouten deze eerste regel ongewijzigd:

`Auth profile credentials are missing or expired.`

Mensvriendelijke details en stabiele reden-codes kunnen op volgende regels worden toegevoegd.

## Gerelateerd

- [Geheimenbeheer](/nl/gateway/secrets)
- [Auth-opslag](/nl/concepts/oauth)
