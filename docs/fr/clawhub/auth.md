---
read_when:
    - Connexion à ClawHub
    - Utilisation de la CLI ClawHub
    - Débogage des erreurs 401
summary: Connexion à ClawHub, jetons d’API, connexion à la CLI, stockage des jetons et révocation.
x-i18n:
    generated_at: "2026-07-12T21:37:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Authentification

ClawHub utilise GitHub pour la connexion sur le Web. La CLI utilise des jetons d’API ClawHub créés
via ce compte connecté.

## Connexion sur le Web

Utilisez GitHub pour vous connecter sur [clawhub.ai](https://clawhub.ai).

Les comptes supprimés, bannis ou désactivés ne peuvent pas effectuer la procédure normale de connexion à ClawHub.
Si la connexion vous ramène à un état déconnecté, votre compte n’est peut-être pas en règle.
Si votre compte a été banni ou désactivé, utilisez le
[formulaire de recours ClawHub](https://appeals.openclaw.ai/) si vous pensez qu’il s’agit d’une
erreur.

## Connexion à la CLI

La procédure de connexion par défaut de la CLI ouvre votre navigateur :

```bash
clawhub login
clawhub whoami
```

Déroulement :

1. La CLI démarre un serveur de rappel temporaire sur `127.0.0.1`.
2. Votre navigateur ouvre la page de connexion à ClawHub.
3. Après la connexion à GitHub, ClawHub crée un jeton d’API.
4. Le navigateur est redirigé vers le rappel local.
5. La CLI stocke le jeton dans votre fichier de configuration ClawHub.

Si votre navigateur ne peut pas atteindre le rappel local en raison des règles du pare-feu, du VPN ou
du proxy, utilisez la procédure par jeton sans interface graphique.

## Connexion sans interface graphique

Créez un jeton dans l’interface Web de ClawHub, puis transmettez-le à la CLI :

```bash
clawhub login --token clh_...
```

Utilisez cette procédure pour les serveurs, les tâches de CI ou les environnements limités au terminal.

Pour les shells distants où vous pouvez ouvrir un navigateur ailleurs, exécutez :

```bash
clawhub login --device
```

La CLI affiche un code à usage unique et attend que vous l’autorisiez sur
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

Affichez le jeton stocké pour la configuration de la CI avec :

```bash
clawhub token
```

## Révocation

Vous pouvez révoquer les jetons d’API dans l’interface Web de ClawHub.

Les jetons révoqués, non valides ou manquants renvoient `401 Unauthorized`. Reconnectez-vous
avec `clawhub login` ou fournissez un nouveau jeton avec `clawhub login --token`.

Les comptes supprimés, bannis ou désactivés ne peuvent pas continuer à utiliser les jetons d’API existants.
Si votre compte a été banni ou désactivé, utilisez le
[formulaire de recours ClawHub](https://appeals.openclaw.ai/) si vous pensez qu’il s’agit d’une
erreur.
