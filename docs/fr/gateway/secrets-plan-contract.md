---
read_when:
    - Génération ou révision des plans `openclaw secrets apply`
    - Débogage des erreurs `Invalid plan target path`
    - Comprendre le comportement de validation du type de cible et du chemin
summary: 'Contrat pour les plans `secrets apply` : validation de la cible, correspondance des chemins et périmètre de cible `auth-profiles.json`'
title: Contrat de plan d’application des secrets
x-i18n:
    generated_at: "2026-06-27T17:33:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03f0ca9b433553a2f6d86d01b8c227a24b6f53ef7034a94bd648fbf04c81f13e
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Cette page définit le contrat strict appliqué par `openclaw secrets apply`.

Si une cible ne respecte pas ces règles, l’application échoue avant de modifier la configuration.

## Forme du fichier de plan

`openclaw secrets apply --from <plan.json>` attend un tableau `targets` de cibles de plan :

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

## Ajouts/mises à jour et suppressions de fournisseurs

Les plans peuvent aussi inclure deux champs optionnels de premier niveau qui modifient la carte `secrets.providers` en plus des écritures par cible :

- `providerUpserts` — un objet indexé par alias de fournisseur. Chaque valeur est une définition de fournisseur (la même forme que celle acceptée sous `secrets.providers.<alias>` dans `openclaw.json`, par exemple un fournisseur `exec` ou `file`).
- `providerDeletes` — un tableau d’alias de fournisseurs à supprimer.

`providerUpserts` s’exécute avant `targets`, de sorte qu’un `target.ref.provider` peut référencer un alias de fournisseur que le même plan introduit dans `providerUpserts`. Sans cela, les plans qui référencent un alias pas encore configuré dans `openclaw.json` échouent avec `provider "<alias>" is not configured`.

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

Les fournisseurs Exec introduits via `providerUpserts` restent soumis aux règles de consentement exec dans [Comportement du consentement du fournisseur Exec](#exec-provider-consent-behavior) : les plans contenant des fournisseurs exec nécessitent `--allow-exec` en mode écriture.

## Portée de cible prise en charge

Les cibles de plan sont acceptées pour les chemins d’identifiants pris en charge dans :

- [Surface des identifiants SecretRef](/fr/reference/secretref-credential-surface)

## Comportement des types de cible

Règle générale :

- `target.type` doit être reconnu et doit correspondre à la forme normalisée de `target.path`.

Les alias de compatibilité restent acceptés pour les plans existants :

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Règles de validation des chemins

Chaque cible est validée avec tous les contrôles suivants :

- `type` doit être un type de cible reconnu.
- `path` doit être un chemin à points non vide.
- `pathSegments` peut être omis. S’il est fourni, il doit se normaliser exactement vers le même chemin que `path`.
- Les segments interdits sont rejetés : `__proto__`, `prototype`, `constructor`.
- Le chemin normalisé doit correspondre à la forme de chemin enregistrée pour le type de cible.
- Si `providerId` ou `accountId` est défini, il doit correspondre à l’identifiant encodé dans le chemin.
- Les cibles `auth-profiles.json` exigent `agentId`.
- Lors de la création d’un nouveau mappage `auth-profiles.json`, incluez `authProfileProvider`.

## Comportement en cas d’échec

Si la validation d’une cible échoue, apply se termine avec une erreur comme :

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Aucune écriture n’est validée pour un plan invalide.

## Comportement du consentement du fournisseur Exec

- `--dry-run` ignore les vérifications des SecretRef exec par défaut.
- Les plans contenant des SecretRefs/fournisseurs exec sont rejetés en mode écriture, sauf si `--allow-exec` est défini.
- Lors de la validation/de l’application de plans contenant exec, passez `--allow-exec` dans les commandes dry-run et d’écriture.

## Notes sur la portée d’exécution et d’audit

- Les entrées `auth-profiles.json` uniquement par référence (`keyRef`/`tokenRef`) sont incluses dans la résolution d’exécution et la couverture d’audit.
- `secrets apply` écrit les cibles `openclaw.json` prises en charge, les cibles `auth-profiles.json` prises en charge et les cibles de nettoyage optionnelles.

## Vérifications opérateur

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Si l’application échoue avec un message de chemin de cible invalide, régénérez le plan avec `openclaw secrets configure` ou corrigez le chemin de cible vers une forme prise en charge ci-dessus.

## Documents associés

- [Gestion des secrets](/fr/gateway/secrets)
- [CLI `secrets`](/fr/cli/secrets)
- [Surface des identifiants SecretRef](/fr/reference/secretref-credential-surface)
- [Référence de configuration](/fr/gateway/configuration-reference)
