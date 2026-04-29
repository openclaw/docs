---
read_when:
    - Werken aan het bepalen van authenticatieprofielen of het routeren van aanmeldgegevens
    - Fouten in modelauthenticatie of profielvolgorde opsporen
summary: Canonieke geschiktheid van inloggegevens en resolutiesemantiek voor authenticatieprofielen
title: Semantiek van authenticatiegegevens
x-i18n:
    generated_at: "2026-04-29T22:23:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0525a71d3f08b7aa95e2f06acc6c23d87cd92d6b5fe4fc050ecf2b7caff84b3f
    source_path: auth-credential-semantics.md
    workflow: 16
---

Dit document definieert de canonieke semantiek voor geschiktheid en resolutie van referenties die wordt gebruikt in:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Het doel is om gedrag tijdens selectie en tijdens runtime op elkaar afgestemd te houden.

## Stabiele redencodes voor probes

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Token-referenties

Token-referenties (`type: "token"`) ondersteunen inline `token` en/of `tokenRef`.

### Geschiktheidsregels

1. Een token-profiel is ongeschikt wanneer zowel `token` als `tokenRef` ontbreken.
2. `expires` is optioneel.
3. Als `expires` aanwezig is, moet het een eindig getal groter dan `0` zijn.
4. Als `expires` ongeldig is (`NaN`, `0`, negatief, niet-eindig of het verkeerde type), is het profiel ongeschikt met `invalid_expires`.
5. Als `expires` in het verleden ligt, is het profiel ongeschikt met `expired`.
6. `tokenRef` omzeilt de validatie van `expires` niet.

### Resolutieregels

1. Resolver-semantiek komt overeen met geschiktheidssemantiek voor `expires`.
2. Voor geschikte profielen kan tokenmateriaal worden opgelost vanuit een inline waarde of `tokenRef`.
3. Niet-oplosbare refs leveren `unresolved_ref` op in de uitvoer van `models status --probe`.

## Portabiliteit van agentkopieën

Overerving van agent-authenticatie werkt als read-through. Wanneer een agent geen lokaal profiel heeft, kan deze tijdens runtime profielen oplossen vanuit de standaard-/hoofdagentopslag zonder geheim materiaal naar zijn eigen `auth-profiles.json` te kopiëren.

Expliciete kopieerstromen, zoals `openclaw agents add`, gebruiken dit portabiliteitsbeleid:

- `api_key`-profielen zijn portabel tenzij `copyToAgents: false`.
- `token`-profielen zijn portabel tenzij `copyToAgents: false`.
- `oauth`-profielen zijn standaard niet portabel omdat vernieuwingstokens voor eenmalig gebruik kunnen zijn of gevoelig kunnen zijn voor rotatie.
- OAuth-stromen die eigendom zijn van providers mogen zich alleen aanmelden met `copyToAgents: true` wanneer bekend is dat het kopiëren van vernieuwingsmateriaal tussen agents veilig is.

Niet-portabele profielen blijven beschikbaar via read-through-overerving, tenzij de doelagent zich afzonderlijk aanmeldt en zijn eigen lokale profiel maakt.

## Expliciete filtering van authenticatievolgorde

- Wanneer `auth.order.<provider>` of de volgorde-override van de auth-opslag is ingesteld voor een provider, voert `models status --probe` alleen probes uit op profiel-id's die in de opgeloste authenticatievolgorde voor die provider blijven.
- Een opgeslagen profiel voor die provider dat uit de expliciete volgorde is weggelaten, wordt later niet stilzwijgend geprobeerd. Probe-uitvoer rapporteert dit met `reasonCode: excluded_by_auth_order` en de details `Excluded by auth.order for this provider.`

## Resolutie van probe-doelen

- Probe-doelen kunnen afkomstig zijn van authenticatieprofielen, omgevingsreferenties of `models.json`.
- Als een provider referenties heeft maar OpenClaw er geen probe-bare modelkandidaat voor kan oplossen, rapporteert `models status --probe` `status: no_model` met `reasonCode: no_model`.

## Detectie van externe CLI-referenties

- Runtime-only referenties die eigendom zijn van externe CLI's worden alleen gedetecteerd wanneer de provider, runtime of het authenticatieprofiel binnen de scope van de huidige bewerking valt, of wanneer er al een opgeslagen lokaal profiel voor die externe bron bestaat.
- Read-only-/statuspaden geven `allowKeychainPrompt: false` door; ze gebruiken alleen bestandsgestuurde externe CLI-referenties en lezen of hergebruiken geen resultaten uit macOS Keychain.

## OAuth SecretRef-beleidsbescherming

- SecretRef-invoer is alleen bedoeld voor statische referenties.
- Als een profielreferentie `type: "oauth"` is, worden SecretRef-objecten niet ondersteund voor het referentiemateriaal van dat profiel.
- Als `auth.profiles.<id>.mode` `"oauth"` is, wordt door SecretRef ondersteunde `keyRef`-/`tokenRef`-invoer voor dat profiel geweigerd.
- Schendingen zijn harde fouten in authenticatieresolutiepaden voor startup/reload.

## Legacy-compatibele berichten

Voor scriptcompatibiliteit blijft deze eerste regel van probe-fouten ongewijzigd:

`Auth profile credentials are missing or expired.`

Mensvriendelijke details en stabiele redencodes kunnen op volgende regels worden toegevoegd.

## Gerelateerd

- [Geheimenbeheer](/nl/gateway/secrets)
- [Authenticatieopslag](/nl/concepts/oauth)
