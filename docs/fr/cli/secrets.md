---
read_when:
    - Nouvelle résolution des références de secrets à l’exécution
    - Audit des résidus en texte brut et des références non résolues
    - Configuration des SecretRefs et application des modifications de nettoyage irréversibles
summary: Référence de la CLI pour `openclaw secrets` (recharger, auditer, configurer, appliquer)
title: Secrets
x-i18n:
    generated_at: "2026-07-12T15:10:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

Gérez les SecretRefs et maintenez l’intégrité de l’instantané d’exécution actif.

| Commande    | Rôle                                                                                                                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | RPC du Gateway (`secrets.reload`) : résout à nouveau les références et remplace l’instantané d’exécution uniquement en cas de réussite complète (aucune écriture dans la configuration)       |
| `audit`     | Analyse en lecture seule des magasins de configuration, d’authentification et de modèles générés, ainsi que des résidus hérités, afin de détecter le texte en clair, les références non résolues et les dérives de priorité (références exec ignorées sauf avec `--allow-exec`) |
| `configure` | Planificateur interactif pour la configuration des fournisseurs, le mappage des cibles et le contrôle préalable (nécessite un TTY)                                                            |
| `apply`     | Exécute un plan enregistré (`--dry-run` effectue uniquement la validation et ignore par défaut les contrôles exec ; le mode écriture rejette les plans contenant des éléments exec sauf avec `--allow-exec`), puis élimine les résidus de texte en clair ciblés |

Boucle recommandée pour l’opérateur :

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Si votre plan comprend des SecretRefs ou fournisseurs `exec`, transmettez `--allow-exec` aux commandes `apply` de simulation et d’écriture.

Codes de sortie pour la CI et les contrôles :

- `audit --check` renvoie `1` en cas de résultats.
- Les références non résolues renvoient `2` (indépendamment de `--check`).

Voir aussi : [Gestion des secrets](/fr/gateway/secrets) · [Surface des identifiants SecretRef](/fr/reference/secretref-credential-surface) · [Sécurité](/fr/gateway/security)

## Recharger l’instantané d’exécution

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Utilise la méthode RPC du Gateway `secrets.reload`. Si la résolution échoue, le Gateway conserve son dernier instantané valide connu et renvoie une erreur (aucune activation partielle). La réponse JSON inclut `warningCount`.

Options : `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## Audit

Analyse l’état d’OpenClaw pour détecter :

- le stockage de secrets en texte en clair
- les références non résolues
- les dérives de priorité (les identifiants de `auth-profiles.json` masquent les références de `openclaw.json`)
- les résidus dans les fichiers `agents/*/agent/models.json` générés (valeurs `apiKey` des fournisseurs et en-têtes sensibles des fournisseurs)
- les résidus hérités (entrées de l’ancien magasin d’authentification, rappels OAuth)

La détection des en-têtes sensibles des fournisseurs repose sur une heuristique fondée sur leur nom : elle signale les en-têtes dont le nom correspond à des fragments courants liés à l’authentification ou aux identifiants (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Structure du rapport :

- `status` : `clean | findings | unresolved`
- `resolution` : `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary` : `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- codes de résultat : `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## Configurer (assistant interactif)

Créez de manière interactive les modifications des fournisseurs et des SecretRefs, exécutez le contrôle préalable et, si vous le souhaitez, appliquez-les :

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Déroulement : d’abord la configuration des fournisseurs (ajout, modification ou suppression des alias `secrets.providers`), puis le mappage des identifiants (sélection des champs et attribution des références `{source, provider, id}`), puis le contrôle préalable et l’application facultative.

Options :

- `--providers-only` : configure uniquement `secrets.providers` et ignore le mappage des identifiants
- `--skip-provider-setup` : ignore la configuration des fournisseurs et mappe les identifiants aux fournisseurs existants
- `--agent <id>` : limite la découverte des cibles et les écritures dans `auth-profiles.json` au magasin d’un seul agent
- `--allow-exec` : autorise les contrôles des SecretRefs exec pendant le contrôle préalable et l’application (peut exécuter des commandes de fournisseurs)

`--providers-only` et `--skip-provider-setup` ne peuvent pas être combinés.

Remarques :

- Nécessite un TTY interactif.
- Cible les champs contenant des secrets dans `openclaw.json`, ainsi que `auth-profiles.json` pour la portée d’agent sélectionnée ; surface canonique prise en charge : [Surface des identifiants SecretRef](/fr/reference/secretref-credential-surface).
- Permet de créer de nouveaux mappages `auth-profiles.json` directement dans le processus de sélection.
- Exécute la résolution de contrôle préalable avant l’application.
- Les plans générés activent par défaut les options de nettoyage (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). L’application est irréversible pour les valeurs en texte en clair nettoyées.
- Sans `--apply`, la CLI affiche tout de même l’invite `Apply this plan now?` après le contrôle préalable.
- Avec `--apply` (et sans `--yes`), la CLI affiche une confirmation supplémentaire pour la migration irréversible.
- `--json` affiche le plan et le rapport de contrôle préalable, mais nécessite toujours un TTY interactif.

### Sécurité des fournisseurs exec

Les installations Homebrew exposent souvent des binaires par l’intermédiaire de liens symboliques sous `/opt/homebrew/bin/*`. Définissez `allowSymlinkCommand: true` uniquement lorsque cela est nécessaire pour des chemins de gestionnaires de paquets de confiance, en l’associant à `trustedDirs` (par exemple `["/opt/homebrew"]`). Sous Windows, si la vérification des ACL n’est pas disponible pour le chemin d’un fournisseur, OpenClaw adopte un comportement de refus sécurisé ; uniquement pour les chemins de confiance, définissez `allowInsecurePath: true` sur ce fournisseur afin de contourner le contrôle de sécurité du chemin.

## Appliquer un plan enregistré

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` valide le contrôle préalable sans écrire de fichiers ; les contrôles des SecretRefs exec sont ignorés par défaut lors d’une simulation. Le mode écriture rejette les plans contenant des SecretRefs ou fournisseurs exec sauf avec `--allow-exec`. Utilisez `--allow-exec` pour autoriser explicitement les contrôles ou l’exécution des fournisseurs exec dans l’un ou l’autre mode.

Éléments que `apply` peut mettre à jour :

- `openclaw.json` (cibles SecretRef, ainsi qu’ajouts, mises à jour et suppressions de fournisseurs)
- `auth-profiles.json` (nettoyage des cibles de fournisseurs)
- les résidus dans l’ancien fichier `auth.json`
- les clés de secrets connues dans `~/.openclaw/.env` dont les valeurs ont été migrées

Détails du contrat du plan (chemins cibles autorisés, règles de validation, sémantique des échecs) : [Contrat du plan d’application des secrets](/fr/gateway/secrets-plan-contract).

### Pourquoi aucune sauvegarde de restauration

`secrets apply` n’écrit volontairement aucune sauvegarde de restauration contenant les anciennes valeurs en texte en clair. La sécurité repose sur un contrôle préalable strict et une application quasi atomique, avec une restauration en mémoire au mieux en cas d’échec.

## Exemple

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Si `audit --check` signale encore des résultats contenant du texte en clair, mettez à jour les autres chemins cibles signalés et relancez l’audit.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Gestion des secrets](/fr/gateway/secrets)
- [SecretRefs de Vault](/plugins/vault)
