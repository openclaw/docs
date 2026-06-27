---
read_when:
    - '`openclaw secrets apply`-plannen genereren of beoordelen'
    - '`Invalid plan target path`-fouten debuggen'
    - Gedrag voor validatie van doeltype en pad begrijpen
summary: 'Contract voor `secrets apply`-plannen: doelvalidatie, padmatching en doelbereik van `auth-profiles.json`'
title: Contract voor het toepassingsplan van geheimen
x-i18n:
    generated_at: "2026-06-27T17:37:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03f0ca9b433553a2f6d86d01b8c227a24b6f53ef7034a94bd648fbf04c81f13e
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Deze pagina definieert het strikte contract dat wordt afgedwongen door `openclaw secrets apply`.

Als een doel niet aan deze regels voldoet, mislukt apply voordat de configuratie wordt gewijzigd.

## Vorm van planbestand

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

## Provider-upserts en verwijderingen

Plannen kunnen ook twee optionele velden op het hoogste niveau bevatten die de
`secrets.providers`-map wijzigen naast de schrijfbewerkingen per doel:

- `providerUpserts` — een object met provideralias als sleutel. Elke waarde is een
  providerdefinitie (dezelfde vorm die wordt geaccepteerd onder
  `secrets.providers.<alias>` in `openclaw.json`, bijvoorbeeld een `exec`- of `file`-
  provider).
- `providerDeletes` — een array met provideraliassen die moeten worden verwijderd.

`providerUpserts` wordt uitgevoerd vóór `targets`, zodat een `target.ref.provider` kan
verwijzen naar een provideralias die hetzelfde plan introduceert in
`providerUpserts`. Zonder dit mislukken plannen die verwijzen naar een alias die nog niet
is geconfigureerd in `openclaw.json` met `provider "<alias>" is not
configured`.

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

Exec-providers die via `providerUpserts` worden geïntroduceerd, blijven onderworpen aan de
exec-toestemmingsregels in [Toestemmingsgedrag voor exec-providers](#exec-provider-consent-behavior):
plannen met exec-providers vereisen `--allow-exec` in schrijfmodus.

## Ondersteund doelbereik

Plandoelen worden geaccepteerd voor ondersteunde paden voor referenties in:

- [SecretRef-referentieoppervlak](/nl/reference/secretref-credential-surface)

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
- `pathSegments` mag worden weggelaten. Als het is opgegeven, moet het normaliseren naar exact hetzelfde pad als `path`.
- Verboden segmenten worden geweigerd: `__proto__`, `prototype`, `constructor`.
- Het genormaliseerde pad moet overeenkomen met de geregistreerde padvorm voor het doeltype.
- Als `providerId` of `accountId` is ingesteld, moet dit overeenkomen met de id die in het pad is gecodeerd.
- `auth-profiles.json`-doelen vereisen `agentId`.
- Neem `authProfileProvider` op bij het maken van een nieuwe `auth-profiles.json`-toewijzing.

## Foutgedrag

Als een doel niet door de validatie komt, sluit apply af met een fout zoals:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Er worden geen schrijfbewerkingen vastgelegd voor een ongeldig plan.

## Toestemmingsgedrag voor exec-providers

- `--dry-run` slaat standaard exec-SecretRef-controles over.
- Plannen met exec-SecretRefs/providers worden in schrijfmodus geweigerd tenzij `--allow-exec` is ingesteld.
- Geef bij het valideren/toepassen van plannen met exec `--allow-exec` door in zowel dry-run- als schrijfopdrachten.

## Opmerkingen over runtime- en auditbereik

- Alleen-ref-vermeldingen in `auth-profiles.json` (`keyRef`/`tokenRef`) worden opgenomen in runtime-resolutie en auditdekking.
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

- [Geheimenbeheer](/nl/gateway/secrets)
- [CLI `secrets`](/nl/cli/secrets)
- [SecretRef-referentieoppervlak](/nl/reference/secretref-credential-surface)
- [Configuratiereferentie](/nl/gateway/configuration-reference)
