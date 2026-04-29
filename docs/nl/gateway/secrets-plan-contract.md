---
read_when:
    - Genereren of beoordelen van `openclaw secrets apply`-plannen
    - Fouten met `Invalid plan target path` debuggen
    - Doeltype en padvalidatiegedrag begrijpen
summary: 'Contract voor `secrets apply`-plannen: doelvalidatie, padmatching en `auth-profiles.json` doelscope'
title: Contract voor het toepassen-plan van geheimen
x-i18n:
    generated_at: "2026-04-29T22:48:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 80214353a1368b249784aa084c714e043c2d515706357d4ba1f111a3c68d1a84
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Deze pagina definieert het strikte contract dat wordt afgedwongen door `openclaw secrets apply`.

Als een doel niet aan deze regels voldoet, mislukt apply voordat de configuratie wordt gewijzigd.

## Vorm van het planbestand

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

## Ondersteunde doel-scope

Plandoelen worden geaccepteerd voor ondersteunde paden voor inloggegevens in:

- [SecretRef-referentieoppervlak voor inloggegevens](/nl/reference/secretref-credential-surface)

## Gedrag van doeltype

Algemene regel:

- `target.type` moet worden herkend en moet overeenkomen met de genormaliseerde vorm van `target.path`.

Compatibiliteitsaliassen blijven geaccepteerd voor bestaande plannen:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Padvalidatieregels

Elk doel wordt gevalideerd met al het volgende:

- `type` moet een herkend doeltype zijn.
- `path` moet een niet-leeg puntpad zijn.
- `pathSegments` mag worden weggelaten. Als het wordt opgegeven, moet het normaliseren naar exact hetzelfde pad als `path`.
- Verboden segmenten worden geweigerd: `__proto__`, `prototype`, `constructor`.
- Het genormaliseerde pad moet overeenkomen met de geregistreerde padvorm voor het doeltype.
- Als `providerId` of `accountId` is ingesteld, moet dit overeenkomen met de id die in het pad is gecodeerd.
- `auth-profiles.json`-doelen vereisen `agentId`.
- Neem bij het maken van een nieuwe `auth-profiles.json`-mapping `authProfileProvider` op.

## Foutgedrag

Als validatie van een doel mislukt, sluit apply af met een fout zoals:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Er worden geen schrijfacties vastgelegd voor een ongeldig plan.

## Consentgedrag voor exec-provider

- `--dry-run` slaat exec SecretRef-controles standaard over.
- Plannen die exec SecretRefs/providers bevatten, worden in schrijfmodus geweigerd tenzij `--allow-exec` is ingesteld.
- Geef bij het valideren/toepassen van plannen die exec bevatten `--allow-exec` mee in zowel dry-run- als schrijfopdrachten.

## Opmerkingen over runtime- en auditscope

- Ref-only `auth-profiles.json`-vermeldingen (`keyRef`/`tokenRef`) worden meegenomen in runtimeresolutie en auditdekking.
- `secrets apply` schrijft ondersteunde `openclaw.json`-doelen, ondersteunde `auth-profiles.json`-doelen en optionele scrubdoelen.

## Operatorcontroles

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Als apply mislukt met een bericht over een ongeldig doelpad, genereer het plan dan opnieuw met `openclaw secrets configure` of corrigeer het doelpad naar een ondersteunde vorm hierboven.

## Gerelateerde documentatie

- [Beheer van geheimen](/nl/gateway/secrets)
- [CLI `secrets`](/nl/cli/secrets)
- [SecretRef-referentieoppervlak voor inloggegevens](/nl/reference/secretref-credential-surface)
- [Configuratiereferentie](/nl/gateway/configuration-reference)
