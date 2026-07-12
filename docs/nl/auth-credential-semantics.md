---
read_when:
    - Werken aan het bepalen van authenticatieprofielen of de routering van inloggegevens
    - Fouten opsporen bij modelauthenticatie of profielvolgorde
summary: Canonieke semantiek voor de geschiktheid en resolutie van inloggegevens voor authenticatieprofielen
title: Semantiek van authenticatiegegevens
x-i18n:
    generated_at: "2026-07-12T08:34:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0516b1bb23f400d5ac5fd39a628736034440216ac22823eef061b38564dff0
    source_path: auth-credential-semantics.md
    workflow: 16
---

Deze semantiek houdt het authenticatiegedrag tijdens selectie en runtime op elkaar afgestemd. Ze wordt gedeeld door:

- `resolveAuthProfileOrder` (profielvolgorde)
- `resolveApiKeyForProfile` (oplossen van runtime-aanmeldgegevens)
- `openclaw models status --probe`
- authenticatiecontroles van `openclaw doctor` (`doctor-auth`)

## Stabiele redencodes voor probes

Proberesultaten bevatten een `status`-categorie (`ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`) en een stabiele `reasonCode` wanneer de probe nooit een modelaanroep heeft bereikt:

| `reasonCode`             | Betekenis                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `excluded_by_auth_order` | Profiel weggelaten uit de expliciete authenticatievolgorde voor de bijbehorende provider.      |
| `missing_credential`     | Er is geen inline-aanmeldgegeven of SecretRef geconfigureerd.                                  |
| `expired`                | De waarde `expires` van het token ligt in het verleden.                                        |
| `invalid_expires`        | `expires` is geen geldige positieve Unix-tijdstempel in milliseconden.                          |
| `unresolved_ref`         | De geconfigureerde SecretRef kon niet worden opgelost.                                         |
| `ineligible_profile`     | Het profiel is incompatibel met de providerconfiguratie (inclusief onjuist gevormde sleutelinvoer). |
| `no_model`               | Er zijn aanmeldgegevens, maar er is geen modelkandidaat opgelost dat kan worden geprobed.       |

Geschiktheidscontroles rapporteren `ok` als redencode voor bruikbare aanmeldgegevens.

## Tokenaanmeldgegevens

Tokenaanmeldgegevens (`type: "token"`) ondersteunen inline `token` en/of `tokenRef`.

### Geschiktheidsregels

1. Een tokenprofiel is ongeschikt wanneer zowel `token` als `tokenRef` ontbreken (`missing_credential`).
2. `expires` is optioneel. Indien aanwezig, moet het een eindig aantal milliseconden sinds de Unix-epoch zijn, groter dan `0` en niet groter dan de maximale JavaScript-`Date`-tijdstempel (8640000000000000).
3. Als `expires` ongeldig is (verkeerd type, `NaN`, `0`, negatief, niet-eindig of groter dan dat maximum), is het profiel ongeschikt met `invalid_expires`.
4. Als `expires` in het verleden ligt, is het profiel ongeschikt met `expired`.
5. `tokenRef` omzeilt de validatie van `expires` niet.

### Oplosregels

1. De semantiek van de resolver komt voor `expires` overeen met de geschiktheidssemantiek.
2. Voor geschikte profielen kan tokenmateriaal worden opgelost vanuit de inline-waarde of `tokenRef`.
3. Niet-oplosbare verwijzingen leveren `unresolved_ref` op in de uitvoer van `models status --probe`.

## Overdraagbaarheid bij het kopiëren van agents

Overerving van agentauthenticatie werkt via doorlezing. Wanneer een agent geen lokaal profiel heeft, worden profielen tijdens runtime opgelost vanuit de opslag van de standaard-/hoofdagent, zonder geheim materiaal naar de eigen opslag voor aanmeldgegevens (`agents/<agentId>/agent/openclaw-agent.sqlite`) te kopiëren.

Expliciete kopieerstromen, zoals `openclaw agents add`, gebruiken dit overdraagbaarheidsbeleid:

- Profielen van het type `api_key` en `token` zijn overdraagbaar, tenzij `copyToAgents: false`.
- Profielen van het type `oauth` zijn standaard niet overdraagbaar, omdat vernieuwingstokens eenmalig bruikbaar of gevoelig voor rotatie kunnen zijn.
- OAuth-stromen die eigendom zijn van de provider mogen alleen met `copyToAgents: true` hiervoor kiezen wanneer bekend is dat het veilig is om vernieuwingsmateriaal tussen agents te kopiëren; deze expliciete inschakeling is alleen van toepassing wanneer het profiel inline toegangs-/vernieuwingsmateriaal bevat.

Niet-overdraagbare profielen blijven beschikbaar via overerving door doorlezing, tenzij de doelagent zich afzonderlijk aanmeldt en een eigen lokaal profiel maakt.

## Authenticatieroutes die alleen in de configuratie bestaan

Vermeldingen in `auth.profiles` met `mode: "aws-sdk"` zijn routeringsmetadata, geen opgeslagen aanmeldgegevens. Ze zijn geldig wanneer de doelprovider `models.providers.<id>.auth: "aws-sdk"` gebruikt, de route die door de Plugin beheerde Amazon Bedrock-installatie schrijft. Deze profiel-ID's mogen voorkomen in `auth.order` en sessieoverschrijvingen, zelfs wanneer er geen overeenkomende vermelding in de opslag voor aanmeldgegevens bestaat.

Schrijf geen `type: "aws-sdk"` naar de opslag voor aanmeldgegevens; opgeslagen aanmeldgegevens zijn uitsluitend `api_key`, `token` of `oauth`. Als een verouderd `auth-profiles.json` zo'n markering bevat, verplaatst `openclaw doctor --fix` deze naar `auth.profiles` en verwijdert het de markering uit de opslag.

## Expliciete filtering op authenticatievolgorde

- Wanneer `auth.order.<provider>` of de volgordeoverschrijving van de authenticatieopslag voor een provider is ingesteld, probet `models status --probe` alleen profiel-ID's die in de opgeloste authenticatievolgorde voor die provider overblijven. De opgeslagen overschrijving heeft voorrang op de configuratie van `auth.order`.
- Een opgeslagen profiel voor die provider dat uit de expliciete volgorde is weggelaten, wordt later niet stilzwijgend geprobeerd. De probe-uitvoer rapporteert het met `reasonCode: excluded_by_auth_order` en het detail `Uitgesloten door auth.order voor deze provider.`

## Oplossen van probedoelen

- Probedoelen kunnen afkomstig zijn van authenticatieprofielen, omgevingsaanmeldgegevens of `models.json` (`source` in het resultaat: `profile`, `env`, `models.json`).
- Als een provider aanmeldgegevens heeft, maar OpenClaw er geen modelkandidaat voor kan oplossen dat kan worden geprobed, rapporteert `models status --probe` `status: no_model` met `reasonCode: no_model`.

## Detectie van aanmeldgegevens van externe CLI's

- Aanmeldgegevens die uitsluitend tijdens runtime worden gebruikt en eigendom zijn van externe CLI's (Claude CLI voor `claude-cli`, Codex CLI voor `openai`, MiniMax CLI voor `minimax-portal`) worden alleen gedetecteerd wanneer de provider, runtime of het authenticatieprofiel binnen het bereik van de huidige bewerking valt, of wanneer er al een opgeslagen lokaal profiel voor die externe bron bestaat.
- Aanroepers van de authenticatieopslag kiezen een expliciete detectiemodus voor externe CLI's: `none` voor alleen permanente/Plugin-authenticatie, `existing` voor het vernieuwen van reeds opgeslagen externe CLI-profielen, of `scoped` voor een concrete set providers/profielen.
- Alleen-lezen-/statuspaden geven `allowKeychainPrompt: false` door; ze gebruiken alleen bestandsgebaseerde aanmeldgegevens van externe CLI's en lezen of hergebruiken geen resultaten uit macOS Keychain.

## Beleidsbeveiliging voor OAuth-SecretRef

SecretRef-invoer is uitsluitend bedoeld voor statische aanmeldgegevens. OAuth-aanmeldgegevens zijn tijdens runtime wijzigbaar (vernieuwingsstromen slaan geroteerde tokens op), waardoor OAuth-materiaal op basis van SecretRef de wijzigbare status over meerdere opslaglocaties zou verdelen.

- Als een profielaanmeldgegeven `type: "oauth"` heeft, worden SecretRef-objecten voor elk veld met aanmeldgegevensmateriaal in dat profiel geweigerd.
- Als `auth.profiles.<id>.mode` gelijk is aan `"oauth"`, wordt invoer voor `keyRef`/`tokenRef` op basis van SecretRef voor dat profiel geweigerd.
- Overtredingen zijn harde fouten (opgeworpen fouten) in de paden voor het voorbereiden van geheimen bij opstarten/herladen en voor het oplossen van profielen.

## Berichten die compatibel zijn met oudere versies

Voor compatibiliteit met scripts blijft deze eerste regel van probefouten ongewijzigd:

`Auth profile credentials are missing or expired.`

Gebruiksvriendelijke details en de stabiele redencode volgen op de daaropvolgende regels in de vorm `↳ Auth reason [code]: ...`.

## Gerelateerd

- [Beheer van geheimen](/nl/gateway/secrets)
- [Authenticatieopslag](/nl/concepts/oauth)
