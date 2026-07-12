---
read_when:
    - Génération ou révision des plans `openclaw secrets apply`
    - Débogage des erreurs `Invalid plan target path`
    - Comprendre le comportement de validation du type de cible et du chemin
summary: 'Contrat pour les plans `secrets apply` : validation des cibles, correspondance des chemins et portée des cibles `auth-profiles.json`'
title: Contrat du plan d’application des secrets
x-i18n:
    generated_at: "2026-07-12T15:27:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ddaf3df7f0be326fa1c8dc8c360b03697fb58329d03c4eb8106a8740ddf6c47a
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Cette page définit le contrat strict appliqué par `openclaw secrets apply`. Si une cible ne respecte pas ces règles, l’application échoue avant de modifier un fichier.

## Structure du fichier de plan

`openclaw secrets apply --from <plan.json>` attend un tableau `targets` contenant les cibles du plan :

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

`openclaw secrets configure` génère des plans sous cette forme. Vous pouvez également en rédiger ou en modifier un manuellement.

## Ajouts ou mises à jour et suppressions de fournisseurs

Les plans peuvent également inclure deux champs facultatifs de premier niveau qui modifient la table `secrets.providers` en plus des écritures propres à chaque cible :

- `providerUpserts` -- un objet indexé par alias de fournisseur. Chaque valeur est une définition de fournisseur (de la même forme que celle acceptée sous `secrets.providers.<alias>` dans `openclaw.json`, par exemple un fournisseur `exec` ou `file`).
- `providerDeletes` -- un tableau d’alias de fournisseurs à supprimer.

`providerUpserts` s’exécute avant `targets`. Ainsi, `target.ref.provider` peut référencer un alias de fournisseur que le même plan introduit dans `providerUpserts`. Sans cet ordre, les plans qui référencent un alias pas encore configuré dans `openclaw.json` échouent avec `provider "<alias>" is not configured`.

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

Les fournisseurs Exec introduits via `providerUpserts` restent soumis aux règles de consentement à l’exécution décrites dans [Comportement du consentement pour les fournisseurs Exec](#exec-provider-consent-behavior) : les plans contenant des fournisseurs Exec nécessitent `--allow-exec` en mode écriture.

## Périmètre des cibles prises en charge

Les cibles de plan sont acceptées pour les chemins d’identifiants pris en charge dans [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface).

## Comportement des types de cible

`target.type` doit être un type de cible reconnu et le `target.path` normalisé doit correspondre à la structure de chemin enregistrée pour ce type.

Certains types de cible acceptent, pour les plans existants, un alias de compatibilité comme `target.type`, en plus de leur nom de type canonique :

| Type canonique                       | Alias accepté                                   |
| ------------------------------------ | ----------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`              | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.*.serviceAccount` |

## Règles de validation des chemins

Chaque cible est validée selon toutes les règles suivantes :

- `type` doit être un type de cible reconnu.
- `path` doit être un chemin à points non vide.
- `pathSegments` peut être omis. S’il est fourni, sa normalisation doit produire exactement le même chemin que `path`.
- Les segments interdits sont rejetés : `__proto__`, `prototype`, `constructor`.
- Le chemin normalisé doit correspondre à la structure de chemin enregistrée pour le type de cible.
- Si `providerId` ou `accountId` est défini, il doit correspondre à l’identifiant encodé dans le chemin.
- Les cibles de `auth-profiles.json` nécessitent `agentId`.
- Lors de la création d’une nouvelle association dans `auth-profiles.json`, incluez `authProfileProvider`.

## Comportement en cas d’échec

Si la validation d’une cible échoue, l’application se termine avec une erreur telle que :

```text
Chemin de cible de plan non valide pour models.providers.apiKey : models.providers.openai.baseUrl
```

Aucune écriture n’est validée pour un plan non valide : la résolution des cibles et la validation des chemins s’exécutent avant toute modification de fichier. Par ailleurs, dès qu’un plan valide commence à écrire, l’application crée d’abord un instantané de chaque fichier concerné et restaure ces instantanés si une écriture ultérieure de la même exécution échoue. Ainsi, une écriture partielle ne laisse jamais la configuration, les profils d’authentification ou l’état des variables d’environnement désynchronisés.

## Comportement du consentement pour les fournisseurs Exec

- `--dry-run` ignore par défaut les vérifications des SecretRef Exec.
- Les plans contenant des SecretRef ou fournisseurs Exec sont rejetés en mode écriture, sauf si `--allow-exec` est défini.
- Lors de la validation ou de l’application de plans contenant des éléments Exec, transmettez `--allow-exec` aux commandes d’exécution à blanc et d’écriture.

## Remarques sur le périmètre d’exécution et d’audit

- Les entrées de `auth-profiles.json` contenant uniquement des références (`keyRef`/`tokenRef`) sont incluses dans la résolution des identifiants à l’exécution et dans la couverture d’audit.
- `secrets apply` écrit les cibles prises en charge dans `openclaw.json`, les cibles prises en charge dans `auth-profiles.json` et effectue trois passes facultatives de nettoyage, toutes activées par défaut : `scrubEnv` (supprime de `.env` les valeurs en clair migrées), `scrubAuthProfilesForProviderTargets` (supprime dans `auth-profiles.json` les résidus en clair ou les références inutilisées pour les fournisseurs qu’un plan vient de migrer) et `scrubLegacyAuthJson` (supprime les entrées `api_key` migrées des anciens stockages `auth.json`). Définissez `options.scrubEnv`, `options.scrubAuthProfilesForProviderTargets` ou `options.scrubLegacyAuthJson` sur `false` dans le plan pour ignorer la passe correspondante.

## Vérifications par l’opérateur

```bash
# Valider le plan sans effectuer d’écriture
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Puis l’appliquer réellement
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Pour les plans contenant des éléments exec, donner explicitement son accord dans les deux modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Si l’application échoue avec un message indiquant un chemin de cible non valide, régénérez le plan avec `openclaw secrets configure` ou corrigez le chemin de la cible afin qu’il corresponde à l’une des structures prises en charge ci-dessus.

## Documentation associée

- [Gestion des secrets](/fr/gateway/secrets)
- [CLI `secrets`](/fr/cli/secrets)
- [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface)
- [Référence de configuration](/fr/gateway/configuration-reference)
