---
read_when:
    - Connexion à ClawHub
    - Utilisation de la CLI ClawHub
    - Débogage des erreurs 401
summary: Connexion à ClawHub, jetons d’API, connexion CLI, stockage des jetons et révocation.
x-i18n:
    generated_at: "2026-07-01T12:58:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Authentification

ClawHub utilise GitHub pour la connexion web. La CLI utilise des jetons d’API ClawHub créés
via ce compte connecté.

## Connexion web

Utilisez GitHub pour vous connecter sur [clawhub.ai](https://clawhub.ai).

Les comptes supprimés, bannis ou désactivés ne peuvent pas terminer la connexion ClawHub normale.
Si la connexion vous renvoie à un état déconnecté, votre compte n’est peut-être pas en règle.
Si votre compte a été banni ou désactivé, utilisez le
[formulaire d’appel ClawHub](https://appeals.openclaw.ai/) si vous pensez qu’il s’agit d’une
erreur.

## Connexion CLI

Le flux de connexion CLI par défaut ouvre votre navigateur :

```bash
clawhub login
clawhub whoami
```

Ce qui se passe :

1. La CLI démarre un serveur de rappel temporaire sur `127.0.0.1`.
2. Votre navigateur ouvre la page de connexion ClawHub.
3. Après la connexion GitHub, ClawHub crée un jeton d’API.
4. Le navigateur redirige vers le rappel local.
5. La CLI stocke le jeton dans votre fichier de configuration ClawHub.

Si votre navigateur ne peut pas atteindre le rappel local en raison de règles de pare-feu,
de VPN ou de proxy, utilisez le flux de jeton sans interface graphique.

## Connexion sans interface graphique

Créez un jeton dans l’interface web ClawHub, puis transmettez-le à la CLI :

```bash
clawhub login --token clh_...
```

Utilisez ce flux pour les serveurs, les tâches CI ou les environnements uniquement terminal.

Pour les shells distants où vous pouvez ouvrir un navigateur ailleurs, exécutez :

```bash
clawhub login --device
```

La CLI affiche un code à usage unique et attend pendant que vous l’autorisez sur
`https://clawhub.ai/cli/device`.

## Stockage des jetons

Chemins de configuration par défaut :

- macOS : `~/Library/Application Support/clawhub/config.json`
- Linux/XDG : `$XDG_CONFIG_HOME/clawhub/config.json` ou `~/.config/clawhub/config.json`
- Windows : `%APPDATA%\\clawhub\\config.json`

Remplacez le chemin avec :

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

Affichez le jeton stocké pour la configuration CI avec :

```bash
clawhub token
```

## Révocation

Vous pouvez révoquer les jetons d’API dans l’interface web ClawHub.

Les jetons révoqués, invalides ou manquants renvoient `401 Unauthorized`. Connectez-vous à nouveau
avec `clawhub login` ou fournissez un nouveau jeton avec `clawhub login --token`.

Les comptes supprimés, bannis ou désactivés ne peuvent pas continuer à utiliser les jetons d’API existants.
Si votre compte a été banni ou désactivé, utilisez le
[formulaire d’appel ClawHub](https://appeals.openclaw.ai/) si vous pensez qu’il s’agit d’une
erreur.
