---
read_when:
    - '`openclaw secrets apply`-plannen genereren of beoordelen'
    - Fouten met `Invalid plan target path` opsporen
    - Inzicht in het gedrag van doeltype- en padvalidatie
summary: 'Contract voor `secrets apply`-plannen: doelvalidatie, padvergelijking en doelbereik van `auth-profiles.json`'
title: Contract voor het plan voor het toepassen van geheimen
x-i18n:
    generated_at: "2026-07-12T08:56:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ddaf3df7f0be326fa1c8dc8c360b03697fb58329d03c4eb8106a8740ddf6c47a
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Deze pagina definieert het strikte contract dat wordt afgedwongen door `openclaw secrets apply`. Als een doel niet aan deze regels voldoet, mislukt apply voordat een bestand wordt gewijzigd.

## Structuur van het planbestand

`openclaw secrets apply --from <plan.json>` verwacht een `targets`-array met plandoelen:

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

`openclaw secrets configure` genereert plannen met deze structuur. U kunt er ook handmatig een schrijven of bewerken.

## Providers toevoegen of bijwerken en verwijderen

Plannen kunnen ook twee optionele velden op het hoogste niveau bevatten die de `secrets.providers`-toewijzing naast de schrijfbewerkingen per doel wijzigen:

- `providerUpserts` -- een object met provideraliassen als sleutels. Elke waarde is een providerdefinitie (dezelfde structuur die wordt geaccepteerd onder `secrets.providers.<alias>` in `openclaw.json`, bijvoorbeeld een `exec`- of `file`-provider).
- `providerDeletes` -- een array met provideraliassen die moeten worden verwijderd.

`providerUpserts` wordt vóór `targets` uitgevoerd, zodat een `target.ref.provider` kan verwijzen naar een provideralias die door hetzelfde plan in `providerUpserts` wordt geïntroduceerd. Zonder deze volgorde mislukken plannen die verwijzen naar een alias die nog niet in `openclaw.json` is geconfigureerd met `provider "<alias>" is not configured`.

```json5
{
  version: 1,
  protocolVersion: 1,
  providerUpserts: {
    onepassword_anthropic: {
      source: "exec",
      command: "/usr/bin/op",
      args: ["read", "op://Vault/Anthropic/credential"],
    },
  },
  providerDeletes: ["legacy_unused_alias"],
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.anthropic.apiKey",
      pathSegments: ["models", "providers", "anthropic", "apiKey"],
      providerId: "anthropic",
      ref: { source: "exec", provider: "onepassword_anthropic", id: "credential" },
    },
  ],
}
```

Exec-providers die via `providerUpserts` worden geïntroduceerd, blijven onderworpen aan de toestemmingsregels voor exec in [Toestemmingsgedrag voor exec-providers](#exec-provider-consent-behavior): voor plannen die exec-providers bevatten, is `--allow-exec` vereist in de schrijfmodus.

## Ondersteund doelbereik

Plandoelen worden geaccepteerd voor ondersteunde referentiepaden in [Referentieoppervlak voor SecretRef-referenties](/nl/reference/secretref-credential-surface).

## Gedrag van doeltypen

`target.type` moet een herkend doeltype zijn en het genormaliseerde `target.path` moet overeenkomen met de geregistreerde padstructuur van dat type.

Sommige doeltypen accepteren naast hun canonieke typenaam ook een compatibiliteitsalias als `target.type` voor bestaande plannen:

| Canoniek type                        | Geaccepteerde alias                              |
| ------------------------------------ | ----------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`              | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.*.serviceAccount` |

## Regels voor padvalidatie

Elk doel wordt aan de hand van alle volgende regels gevalideerd:

- `type` moet een herkend doeltype zijn.
- `path` moet een niet-leeg, door punten gescheiden pad zijn.
- `pathSegments` mag worden weggelaten. Indien opgegeven, moet het na normalisatie exact hetzelfde pad opleveren als `path`.
- Verboden segmenten worden geweigerd: `__proto__`, `prototype`, `constructor`.
- Het genormaliseerde pad moet overeenkomen met de geregistreerde padstructuur voor het doeltype.
- Als `providerId` of `accountId` is ingesteld, moet deze overeenkomen met de id die in het pad is opgenomen.
- Doelen voor `auth-profiles.json` vereisen `agentId`.
- Neem `authProfileProvider` op wanneer u een nieuwe toewijzing in `auth-profiles.json` maakt.

## Gedrag bij fouten

Als de validatie van een doel mislukt, wordt apply afgesloten met een fout zoals:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Voor een ongeldig plan worden geen schrijfbewerkingen vastgelegd: doelresolutie en padvalidatie worden uitgevoerd voordat een bestand wordt aangeraakt. Zodra een geldig plan begint te schrijven, maakt apply bovendien eerst een momentopname van elk betrokken bestand en herstelt het die momentopnamen als een latere schrijfbewerking binnen dezelfde uitvoering mislukt. Daardoor kunnen configuratie-, authenticatieprofiel- en omgevingsstatus nooit door een gedeeltelijke schrijfbewerking uit synchronisatie raken.

## Toestemmingsgedrag voor exec-providers

- `--dry-run` slaat controles voor exec-SecretRefs standaard over.
- Plannen met exec-SecretRefs/providers worden in de schrijfmodus geweigerd, tenzij `--allow-exec` is ingesteld.
- Geef bij het valideren/toepassen van plannen die exec bevatten `--allow-exec` door aan zowel de proefuitvoer- als de schrijfopdracht.

## Opmerkingen over runtime- en auditbereik

- Alleen uit verwijzingen bestaande vermeldingen in `auth-profiles.json` (`keyRef`/`tokenRef`) vallen onder het oplossen van referenties tijdens runtime en onder de auditdekking.
- `secrets apply` schrijft ondersteunde doelen in `openclaw.json`, ondersteunde doelen in `auth-profiles.json` en voert drie optionele opschoningsrondes uit, die elk standaard zijn ingeschakeld: `scrubEnv` (verwijdert gemigreerde waarden in platte tekst uit `.env`), `scrubAuthProfilesForProviderTargets` (verwijdert resten in platte tekst en ongebruikte verwijzingen uit `auth-profiles.json` voor providers die zojuist door een plan zijn gemigreerd) en `scrubLegacyAuthJson` (verwijdert gemigreerde `api_key`-vermeldingen uit verouderde `auth.json`-opslaglocaties). Stel `options.scrubEnv`, `options.scrubAuthProfilesForProviderTargets` of `options.scrubLegacyAuthJson` in het plan in op `false` om de betreffende ronde over te slaan.

## Controles voor beheerders

```bash
# Plan valideren zonder te schrijven
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Daarna daadwerkelijk toepassen
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Voor plannen die exec bevatten, in beide modi expliciet toestemming geven
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Als apply mislukt met een melding over een ongeldig doelpad, genereert u het plan opnieuw met `openclaw secrets configure` of corrigeert u het doelpad naar een hierboven ondersteunde structuur.

## Gerelateerde documentatie

- [Beheer van geheimen](/nl/gateway/secrets)
- [CLI `secrets`](/nl/cli/secrets)
- [Referentieoppervlak voor SecretRef-referenties](/nl/reference/secretref-credential-surface)
- [Configuratiereferentie](/nl/gateway/configuration-reference)
