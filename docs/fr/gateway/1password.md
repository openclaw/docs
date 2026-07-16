---
read_when:
    - Vous souhaitez retirer les clés API de openclaw.json et les stocker dans 1Password
    - Vous exécutez le Gateway sans interface graphique et avez besoin d’une authentification par compte de service pour op
    - Vous souhaitez que les agents lisent ou injectent des secrets avec la CLI `op`
summary: Résolvez les secrets du Gateway avec la CLI 1Password et permettez aux agents d’utiliser le skill 1password intégré
title: 1Password
x-i18n:
    generated_at: "2026-07-16T13:10:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dbe92009cd4409ae8e7235f5462f059783d5ca863557f1a7b12cacd47ee718c9
    source_path: gateway/1password.md
    workflow: 16
---

OpenClaw s’associe à **1Password** de deux manières indépendantes :

- **Secrets de configuration :** tout champ [SecretRef](/fr/gateway/secrets) dans `openclaw.json` peut être résolu à l’exécution par la CLI `op`, afin que les clés API ne figurent jamais dans le fichier de configuration.
- **Workflows des agents :** la compétence `1password` intégrée apprend aux agents à se connecter et à lire ou injecter des secrets avec `op` pour leurs propres tâches.

## Prérequis

- La [CLI 1Password](https://developer.1password.com/docs/cli/get-started/) (`op`) doit être installée sur l’hôte du Gateway (`brew install 1password-cli` sous macOS).
- Un mode d’authentification pour `op` :
  - **Compte de service** (recommandé pour les Gateways sans interface graphique) : exportez `OP_SERVICE_ACCOUNT_TOKEN` dans l’environnement du service Gateway. Aucune application de bureau ni connexion interactive.
  - **Intégration à l’application de bureau** : l’application 1Password s’exécute sur la même machine avec l’intégration à la CLI activée. Les premiers appels peuvent déclencher Touch ID ou l’authentification système.
  - **Connexion autonome** : `op signin` affiche une invite à chaque session. Cette méthode convient aux agents grâce à la compétence, mais pas à la résolution des secrets de configuration sur un Gateway sans interface graphique.

## Résoudre les secrets de configuration avec op

Déclarez un fournisseur de secrets exec qui exécute `op read` avec une référence `op://vault/item/field`, puis faites pointer tout champ compatible avec SecretRef vers celui-ci :

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // requis pour les binaires Homebrew liés symboliquement
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

Fonctionnement des différents éléments :

- `command` doit être un chemin absolu ; `trustedDirs` marque son répertoire comme fiable, et `allowSymlinkCommand` est nécessaire, car Homebrew installe `op` sous forme de lien symbolique.
- `args` transmet la référence `op://vault/item/field` telle quelle. OpenClaw n’analyse pas lui-même le schéma `op://` ; le binaire `op` le résout.
- `passEnv` transmet les variables répertoriées depuis l’environnement du Gateway. L’intégration à l’application de bureau nécessite `HOME` ; les comptes de service nécessitent également que `OP_SERVICE_ACCOUNT_TOKEN` soit présent dans l’environnement du service Gateway (ajoutez-le à `passEnv`, ou définissez-le via `env` uniquement si vous acceptez que le jeton soit lisible dans le fichier de configuration).
- Pour une sortie à valeur unique, conservez `id: "value"`. Avec `jsonOnly: true` et une charge utile JSON, référencez plutôt les champs à l’aide d’un identifiant de pointeur JSON.
- Une entrée de fournisseur par secret permet de maintenir la traçabilité des références ; nommez les fournisseurs d’après leur consommateur (`onepassword_openai`, `onepassword_telegram`).

Consultez [Secrets du Gateway](/fr/gateway/secrets) pour connaître l’ordre de résolution, la mise en cache et la sémantique des échecs, ainsi que [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface) pour connaître tous les champs qui acceptent les SecretRefs.

## Configuration d’un compte de service pour les Gateways sans interface graphique

1. Créez un compte de service dans votre compte 1Password et accordez-lui un accès en lecture uniquement aux éléments de coffre dont le Gateway a besoin.
2. Fournissez `OP_SERVICE_ACCOUNT_TOKEN` au service Gateway (plist launchd, unité systemd ou environnement du conteneur).
3. Ajoutez `"OP_SERVICE_ACCOUNT_TOKEN"` à la liste `passEnv` du fournisseur.
4. Effectuez la vérification depuis l’environnement de l’hôte du Gateway : `op whoami` doit afficher le compte de service sans présenter d’invite.

Les lectures par compte de service nécessitent que le coffre soit explicitement nommé dans la référence `op://`. Limitez strictement la portée du compte ; il s’agit d’un identifiant d’accès au porteur.

## La compétence 1password pour les agents

OpenClaw intègre une compétence `1password` qui permet aux agents de maîtriser `op` : elle détecte le mode d’authentification disponible (compte de service, intégration à l’application de bureau ou connexion autonome), vérifie l’accès avec `op whoami` avant toute lecture et privilégie `op run` / `op inject` plutôt que l’écriture des valeurs secrètes sur le disque. La compétence nécessite le binaire `op` et propose une installation avec Homebrew s’il est absent.

Les agents l’utilisent pour leurs propres workflows, par exemple pour lire un jeton de déploiement au cours d’une tâche ou injecter des variables d’environnement dans une commande. Elle est indépendante de la résolution des secrets de configuration ; le Gateway résout les SecretRefs sans intervention d’une compétence.

## Remarques de sécurité

- Les valeurs secrètes résolues par les fournisseurs exec restent dans la mémoire du Gateway ; les instantanés de configuration et les réponses `config.get` masquent les champs SecretRef.
- Ne placez jamais de valeurs secrètes dans `openclaw.json`, les journaux ou les conversations. Conservez les noms des éléments dans la configuration et les valeurs dans 1Password.
- La piste d’audit de 1Password affiche chaque lecture effectuée par un compte de service, ce qui facilite la rotation des clés et l’examen des incidents.

## Dépannage

- `command not found` ou erreurs de lancement de processus : utilisez le chemin `op` absolu et incluez son répertoire dans `trustedDirs`.
- `op` est résolu, mais les lectures échouent avec des erreurs de lien symbolique : définissez `allowSymlinkCommand: true` pour les installations Homebrew.
- `account is not signed in` : pour les comptes de service, vérifiez que `OP_SERVICE_ACCOUNT_TOKEN` parvient au service Gateway et figure dans `passEnv` ; pour l’intégration à l’application de bureau, vérifiez que l’application est en cours d’exécution et déverrouillée.
- Premières lectures lentes : augmentez `timeoutMs` sur le fournisseur ; les démarrages à froid de `op` peuvent dépasser les délais d’expiration stricts sur les hôtes très sollicités.
