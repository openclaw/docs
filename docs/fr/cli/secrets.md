---
read_when:
    - Résolution à nouveau des références de secret à l’exécution
    - Audit des résidus en texte brut et des références non résolues
    - Configuration des SecretRef et application de modifications de nettoyage à sens unique
summary: Référence CLI pour `openclaw secrets` (recharger, auditer, configurer, appliquer)
title: Secrets
x-i18n:
    generated_at: "2026-04-24T07:05:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fe1933ca6a9f2a24fbbe20fa3b83bf8f6493ea6c94061e135b4e1b48c33d62c
    source_path: cli/secrets.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# `openclaw secrets`

Utilisez `openclaw secrets` pour gérer les SecretRef et maintenir un instantané d’exécution actif sain.

Rôles des commandes :

- `reload` : RPC Gateway (`secrets.reload`) qui résout à nouveau les références et remplace l’instantané d’exécution uniquement en cas de succès complet (aucune écriture de configuration).
- `audit` : analyse en lecture seule des magasins de configuration/authentification/modèles générés et des résidus hérités pour détecter le texte brut, les références non résolues et la dérive de précédence (les références exec sont ignorées sauf si `--allow-exec` est défini).
- `configure` : planificateur interactif pour la configuration de fournisseur, le mappage de cibles et la prévalidation (TTY requis).
- `apply` : exécute un plan enregistré (`--dry-run` pour validation uniquement ; le mode dry-run ignore par défaut les vérifications exec, et le mode écriture rejette les plans contenant exec sauf si `--allow-exec` est défini), puis nettoie les résidus de texte brut ciblés.

Boucle opérateur recommandée :

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Si votre plan inclut des SecretRef/fournisseurs `exec`, passez `--allow-exec` sur les commandes apply en dry-run et en écriture.

Remarque sur les codes de sortie pour CI/barrières :

- `audit --check` renvoie `1` en présence de résultats.
- les références non résolues renvoient `2`.

Liens associés :

- Guide des secrets : [Gestion des secrets](/fr/gateway/secrets)
- Surface des identifiants : [Surface des identifiants SecretRef](/fr/reference/secretref-credential-surface)
- Guide de sécurité : [Sécurité](/fr/gateway/security)

## Recharger l’instantané d’exécution

Résoudre à nouveau les références de secret et remplacer atomiquement l’instantané d’exécution.

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Remarques :

- Utilise la méthode RPC Gateway `secrets.reload`.
- Si la résolution échoue, la Gateway conserve le dernier instantané valide connu et renvoie une erreur (aucune activation partielle).
- La réponse JSON inclut `warningCount`.

Options :

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## Audit

Analyser l’état OpenClaw pour détecter :

- le stockage de secrets en texte brut
- les références non résolues
- la dérive de précédence (les identifiants dans `auth-profiles.json` masquent les références de `openclaw.json`)
- les résidus générés dans `agents/*/agent/models.json` (valeurs `apiKey` de fournisseur et en-têtes sensibles de fournisseur)
- les résidus hérités (entrées de magasin d’authentification hérité, rappels OAuth)

Remarque sur les résidus d’en-tête :

- La détection d’en-têtes sensibles de fournisseur est heuristique et fondée sur le nom (noms/fragments d’en-tête d’authentification ou d’identifiants courants tels que `authorization`, `x-api-key`, `token`, `secret`, `password` et `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Comportement de sortie :

- `--check` se termine avec un code non nul en présence de résultats.
- les références non résolues se terminent avec un code non nul de priorité supérieure.

Éléments marquants de la forme du rapport :

- `status` : `clean | findings | unresolved`
- `resolution` : `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary` : `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- codes de résultat :
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configure (assistant interactif)

Construisez interactivement les modifications de fournisseur et de SecretRef, exécutez la prévalidation et appliquez éventuellement :

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Flux :

- Configuration du fournisseur d’abord (`add/edit/remove` pour les alias `secrets.providers`).
- Mappage des identifiants ensuite (sélection des champs et attribution des références `{source, provider, id}`).
- Prévalidation et application facultative en dernier.

Indicateurs :

- `--providers-only` : configure uniquement `secrets.providers`, ignore le mappage des identifiants.
- `--skip-provider-setup` : ignore la configuration du fournisseur et mappe les identifiants vers des fournisseurs existants.
- `--agent <id>` : limite la découverte des cibles et les écritures dans `auth-profiles.json` à un seul magasin d’agent.
- `--allow-exec` : autorise les vérifications de SecretRef exec pendant la prévalidation/l’application (peut exécuter des commandes de fournisseur).

Remarques :

- Nécessite un TTY interactif.
- Vous ne pouvez pas combiner `--providers-only` avec `--skip-provider-setup`.
- `configure` cible les champs contenant des secrets dans `openclaw.json` ainsi que `auth-profiles.json` pour le périmètre d’agent sélectionné.
- `configure` prend en charge la création directe de nouveaux mappages `auth-profiles.json` dans le flux de sélection.
- Surface prise en charge canonique : [Surface des identifiants SecretRef](/fr/reference/secretref-credential-surface).
- Il effectue une résolution de prévalidation avant l’application.
- Si la prévalidation/l’application inclut des références exec, laissez `--allow-exec` défini pour les deux étapes.
- Les plans générés activent par défaut les options de nettoyage (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` tous activés).
- Le chemin d’application est à sens unique pour les valeurs de texte brut nettoyées.
- Sans `--apply`, la CLI demande quand même `Apply this plan now?` après la prévalidation.
- Avec `--apply` (et sans `--yes`), la CLI demande une confirmation supplémentaire irréversible.
- `--json` affiche le plan + le rapport de prévalidation, mais la commande nécessite toujours un TTY interactif.

Remarque de sécurité sur les fournisseurs exec :

- Les installations Homebrew exposent souvent des binaires liés symboliquement sous `/opt/homebrew/bin/*`.
- Définissez `allowSymlinkCommand: true` uniquement si nécessaire pour des chemins fiables de gestionnaire de paquets, et associez-le à `trustedDirs` (par exemple `["/opt/homebrew"]`).
- Sous Windows, si la vérification ACL n’est pas disponible pour un chemin de fournisseur, OpenClaw échoue de manière stricte. Pour des chemins de confiance uniquement, définissez `allowInsecurePath: true` sur ce fournisseur afin de contourner les vérifications de sécurité de chemin.

## Appliquer un plan enregistré

Appliquer ou prévalider un plan généré précédemment :

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Comportement exec :

- `--dry-run` valide la prévalidation sans écrire de fichiers.
- les vérifications de SecretRef exec sont ignorées par défaut en dry-run.
- le mode écriture rejette les plans qui contiennent des SecretRef/fournisseurs exec sauf si `--allow-exec` est défini.
- Utilisez `--allow-exec` pour activer explicitement les vérifications/exécutions de fournisseur exec dans l’un ou l’autre mode.

Détails du contrat de plan (chemins cibles autorisés, règles de validation et sémantique d’échec) :

- [Contrat de plan d’application des secrets](/fr/gateway/secrets-plan-contract)

Ce que `apply` peut mettre à jour :

- `openclaw.json` (cibles SecretRef + upserts/suppressions de fournisseur)
- `auth-profiles.json` (nettoyage des cibles de fournisseur)
- résidus hérités de `auth.json`
- `~/.openclaw/.env` pour les clés secrètes connues dont les valeurs ont été migrées

## Pourquoi pas de sauvegardes de retour arrière

`secrets apply` n’écrit volontairement pas de sauvegardes de retour arrière contenant d’anciennes valeurs en texte brut.

La sécurité repose sur une prévalidation stricte + une application quasi atomique avec restauration mémoire au mieux en cas d’échec.

## Exemple

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Si `audit --check` signale encore des résultats de texte brut, mettez à jour les chemins cibles restants signalés puis relancez l’audit.

## Liens associés

- [Référence CLI](/fr/cli)
- [Gestion des secrets](/fr/gateway/secrets)
