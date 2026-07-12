---
read_when:
    - Résolution à nouveau des références de secrets à l’exécution
    - Audit des résidus en texte brut et des références non résolues
    - Configuration des SecretRefs et application de modifications de nettoyage irréversibles
summary: Référence de la CLI pour `openclaw secrets` (recharger, auditer, configurer, appliquer)
title: Secrets
x-i18n:
    generated_at: "2026-07-12T02:27:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

Gérez les SecretRefs et maintenez l’intégrité de l’instantané d’exécution actif.

| Commande    | Rôle                                                                                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | RPC du Gateway (`secrets.reload`) : résout de nouveau les références et remplace l’instantané d’exécution uniquement en cas de réussite complète (sans écrire dans la configuration)                  |
| `audit`     | Analyse en lecture seule de la configuration, des magasins d’authentification et de modèles générés, ainsi que des résidus hérités, afin de détecter le texte en clair, les références non résolues et les dérives de priorité (références `exec` ignorées sauf avec `--allow-exec`) |
| `configure` | Assistant interactif pour configurer les fournisseurs, associer les cibles et effectuer les contrôles préalables (nécessite un TTY)                                                                 |
| `apply`     | Exécute un plan enregistré (`--dry-run` effectue uniquement la validation et ignore par défaut les contrôles `exec` ; le mode écriture refuse les plans contenant des éléments `exec` sans `--allow-exec`), puis supprime les résidus de texte en clair ciblés |

Boucle recommandée pour l’opérateur :

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Si votre plan comprend des SecretRefs ou des fournisseurs `exec`, transmettez `--allow-exec` aux deux commandes `apply`, en simulation et en écriture.

Codes de sortie pour la CI et les contrôles :

- `audit --check` renvoie `1` si des problèmes sont détectés.
- Les références non résolues renvoient `2` (indépendamment de `--check`).

Voir aussi : [Gestion des secrets](/fr/gateway/secrets) · [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface) · [Sécurité](/fr/gateway/security)

## Recharger l’instantané d’exécution

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Utilise la méthode RPC du Gateway `secrets.reload`. Si la résolution échoue, le Gateway conserve son dernier instantané valide connu et renvoie une erreur (aucune activation partielle). La réponse JSON comprend `warningCount`.

Options : `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## Audit

Analyse l’état d’OpenClaw afin de détecter :

- le stockage de secrets en texte en clair
- les références non résolues
- les dérives de priorité (des identifiants dans `auth-profiles.json` masquant les références de `openclaw.json`)
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
- codes des problèmes détectés : `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## Configurer (assistant interactif)

Créez interactivement les modifications apportées aux fournisseurs et aux SecretRefs, exécutez les contrôles préalables et appliquez-les éventuellement :

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Déroulement : configuration des fournisseurs en premier (ajout, modification ou suppression des alias `secrets.providers`), puis association des identifiants (sélection des champs et attribution de références `{source, provider, id}`), suivie des contrôles préalables et de l’application facultative.

Indicateurs :

- `--providers-only` : configure uniquement `secrets.providers` et ignore l’association des identifiants
- `--skip-provider-setup` : ignore la configuration des fournisseurs et associe les identifiants aux fournisseurs existants
- `--agent <id>` : limite la découverte des cibles et les écritures dans `auth-profiles.json` au magasin d’un seul agent
- `--allow-exec` : autorise les contrôles des SecretRefs `exec` pendant les contrôles préalables et l’application (peut exécuter des commandes de fournisseur)

`--providers-only` et `--skip-provider-setup` ne peuvent pas être combinés.

Remarques :

- Nécessite un TTY interactif.
- Cible les champs contenant des secrets dans `openclaw.json`, ainsi que `auth-profiles.json` pour la portée d’agent sélectionnée ; surface canonique prise en charge : [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface).
- Permet de créer directement de nouvelles associations dans `auth-profiles.json` au cours du processus de sélection.
- Exécute la résolution préalable avant l’application.
- Les plans générés activent par défaut les options de suppression (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). L’application est irréversible pour les valeurs en texte en clair supprimées.
- Sans `--apply`, la CLI affiche tout de même l’invite `Apply this plan now?` après les contrôles préalables.
- Avec `--apply` (et sans `--yes`), la CLI affiche une confirmation supplémentaire pour la migration irréversible.
- `--json` affiche le plan et le rapport des contrôles préalables, mais nécessite toujours un TTY interactif.

### Sécurité des fournisseurs Exec

Les installations Homebrew exposent souvent des binaires accessibles par des liens symboliques sous `/opt/homebrew/bin/*`. Définissez `allowSymlinkCommand: true` uniquement lorsque cela est nécessaire pour des chemins de gestionnaires de paquets fiables, en l’associant à `trustedDirs` (par exemple `["/opt/homebrew"]`). Sous Windows, si la vérification des ACL n’est pas disponible pour le chemin d’un fournisseur, OpenClaw adopte un comportement de refus sécurisé ; uniquement pour les chemins fiables, définissez `allowInsecurePath: true` sur ce fournisseur afin de contourner le contrôle de sécurité du chemin.

## Appliquer un plan enregistré

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` valide les contrôles préalables sans écrire de fichiers ; les contrôles des SecretRefs `exec` sont ignorés par défaut en mode simulation. Le mode écriture refuse les plans contenant des SecretRefs ou des fournisseurs `exec` sans `--allow-exec`. Utilisez `--allow-exec` pour autoriser explicitement les contrôles ou l’exécution des fournisseurs `exec` dans l’un ou l’autre mode.

Éléments que `apply` peut mettre à jour :

- `openclaw.json` (cibles SecretRef et ajout, mise à jour ou suppression de fournisseurs)
- `auth-profiles.json` (suppression des données des cibles de fournisseurs)
- les résidus de l’ancien fichier `auth.json`
- les clés de secrets connues dans `~/.openclaw/.env` dont les valeurs ont été migrées

Détails du contrat du plan (chemins cibles autorisés, règles de validation, sémantique des échecs) : [Contrat du plan d’application des secrets](/fr/gateway/secrets-plan-contract).

### Pourquoi aucune sauvegarde de restauration

`secrets apply` n’écrit intentionnellement aucune sauvegarde de restauration contenant les anciennes valeurs en texte en clair. La sécurité repose sur des contrôles préalables stricts et une application quasi atomique, avec une restauration en mémoire selon le principe du meilleur effort en cas d’échec.

## Exemple

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Si `audit --check` signale encore des problèmes de texte en clair, mettez à jour les chemins cibles restants indiqués, puis relancez l’audit.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Gestion des secrets](/fr/gateway/secrets)
- [SecretRefs de Vault](/plugins/vault)
