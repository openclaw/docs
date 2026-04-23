---
read_when:
    - Débogage de l’authentification du modèle ou de l’expiration OAuth
    - Documentation de l’authentification ou du stockage des identifiants
summary: 'Authentification du modèle : OAuth, clés API, réutilisation du CLI Claude et jeton de configuration Anthropic'
title: Authentification
x-i18n:
    generated_at: "2026-04-23T14:55:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a7c20872b915d1d079f0578c933e43cbdb97eca1c60d8c4e6e5137ca83f8b2
    source_path: gateway/authentication.md
    workflow: 15
---

# Authentification (fournisseurs de modèles)

<Note>
Cette page couvre l’authentification des **fournisseurs de modèles** (clés API, OAuth, réutilisation du CLI Claude et jeton de configuration Anthropic). Pour l’authentification de la **connexion Gateway** (jeton, mot de passe, trusted-proxy), voir [Configuration](/fr/gateway/configuration) et [Authentification Trusted Proxy](/fr/gateway/trusted-proxy-auth).
</Note>

OpenClaw prend en charge OAuth et les clés API pour les fournisseurs de modèles. Pour les hôtes Gateway toujours actifs, les clés API sont généralement l’option la plus prévisible. Les flux par abonnement/OAuth sont également pris en charge lorsqu’ils correspondent au modèle de compte de votre fournisseur.

Voir [/concepts/oauth](/fr/concepts/oauth) pour le flux OAuth complet et la structure de stockage.
Pour l’authentification basée sur SecretRef (fournisseurs `env`/`file`/`exec`), voir [Gestion des secrets](/fr/gateway/secrets).
Pour les règles d’éligibilité des identifiants et de code de raison utilisées par `models status --probe`, voir
[Auth Credential Semantics](/fr/auth-credential-semantics).

## Configuration recommandée (clé API, n’importe quel fournisseur)

Si vous exécutez une Gateway de longue durée, commencez avec une clé API pour le fournisseur de votre choix.
Pour Anthropic en particulier, l’authentification par clé API reste la configuration serveur la plus prévisible, mais OpenClaw prend aussi en charge la réutilisation d’une connexion locale au CLI Claude.

1. Créez une clé API dans la console de votre fournisseur.
2. Placez-la sur l’**hôte Gateway** (la machine qui exécute `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Si la Gateway s’exécute sous systemd/launchd, il est préférable de placer la clé dans
   `~/.openclaw/.env` afin que le démon puisse la lire :

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Redémarrez ensuite le démon (ou redémarrez votre processus Gateway) et vérifiez de nouveau :

```bash
openclaw models status
openclaw doctor
```

Si vous préférez ne pas gérer vous-même les variables d’environnement, l’onboarding peut stocker
les clés API pour l’utilisation par le démon : `openclaw onboard`.

Voir [Aide](/fr/help) pour les détails sur l’héritage de l’environnement (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic : compatibilité du CLI Claude et des jetons

L’authentification par jeton de configuration Anthropic reste disponible dans OpenClaw comme méthode de jeton prise en charge. Le personnel d’Anthropic nous a depuis indiqué que l’utilisation du CLI Claude à la manière d’OpenClaw est de nouveau autorisée ; OpenClaw considère donc la réutilisation du CLI Claude et l’utilisation de `claude -p` comme autorisées pour cette intégration, sauf si Anthropic publie une nouvelle politique. Lorsque la réutilisation du CLI Claude est disponible sur l’hôte, c’est désormais la méthode recommandée.

Pour les hôtes Gateway de longue durée, une clé API Anthropic reste la configuration la plus prévisible. Si vous souhaitez réutiliser une connexion Claude existante sur le même hôte, utilisez le parcours Anthropic Claude CLI dans onboarding/configure.

Configuration hôte recommandée pour la réutilisation du CLI Claude :

```bash
# Exécuter sur l’hôte Gateway
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Il s’agit d’une configuration en deux étapes :

1. Connectez Claude Code lui-même à Anthropic sur l’hôte Gateway.
2. Indiquez à OpenClaw de basculer la sélection du modèle Anthropic vers le backend local `claude-cli`
   et de stocker le profil d’authentification OpenClaw correspondant.

Si `claude` n’est pas dans `PATH`, installez d’abord Claude Code ou définissez
`agents.defaults.cliBackends.claude-cli.command` sur le chemin réel du binaire.

Saisie manuelle de jeton (n’importe quel fournisseur ; écrit dans `auth-profiles.json` + met à jour la config) :

```bash
openclaw models auth paste-token --provider openrouter
```

Les références de profil d’authentification sont également prises en charge pour les identifiants statiques :

- les identifiants `api_key` peuvent utiliser `keyRef: { source, provider, id }`
- les identifiants `token` peuvent utiliser `tokenRef: { source, provider, id }`
- Les profils en mode OAuth ne prennent pas en charge les identifiants SecretRef ; si `auth.profiles.<id>.mode` est défini sur `"oauth"`, les entrées `keyRef`/`tokenRef` adossées à SecretRef pour ce profil sont rejetées.

Vérification adaptée à l’automatisation (code de sortie `1` si expiré/absent, `2` si sur le point d’expirer) :

```bash
openclaw models status --check
```

Sondes d’authentification en direct :

```bash
openclaw models status --probe
```

Remarques :

- Les lignes de sonde peuvent provenir de profils d’authentification, d’identifiants d’environnement ou de `models.json`.
- Si `auth.order.<provider>` explicite omet un profil stocké, la sonde signale
  `excluded_by_auth_order` pour ce profil au lieu de l’essayer.
- Si une authentification existe mais qu’OpenClaw ne peut pas résoudre un candidat de modèle sondable pour
  ce fournisseur, la sonde signale `status: no_model`.
- Les délais de récupération liés aux limites de débit peuvent être spécifiques à un modèle. Un profil en période de récupération pour un
  modèle peut encore être utilisable pour un modèle apparenté chez le même fournisseur.

Les scripts d’exploitation facultatifs (systemd/Termux) sont documentés ici :
[Scripts de surveillance de l’authentification](/fr/help/scripts#auth-monitoring-scripts)

## Remarque sur Anthropic

Le backend Anthropic `claude-cli` est de nouveau pris en charge.

- Le personnel d’Anthropic nous a indiqué que ce chemin d’intégration OpenClaw est de nouveau autorisé.
- OpenClaw considère donc la réutilisation du CLI Claude et l’utilisation de `claude -p` comme autorisées
  pour les exécutions adossées à Anthropic, sauf si Anthropic publie une nouvelle politique.
- Les clés API Anthropic restent le choix le plus prévisible pour les hôtes Gateway
  de longue durée et pour un contrôle explicite de la facturation côté serveur.

## Vérification de l’état d’authentification du modèle

```bash
openclaw models status
openclaw doctor
```

## Comportement de rotation des clés API (Gateway)

Certains fournisseurs prennent en charge la nouvelle tentative d’une requête avec d’autres clés lorsqu’un appel API
atteint une limite de débit du fournisseur.

- Ordre de priorité :
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (remplacement unique)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Les fournisseurs Google incluent aussi `GOOGLE_API_KEY` comme solution de repli supplémentaire.
- La même liste de clés est dédupliquée avant utilisation.
- OpenClaw ne réessaie avec la clé suivante qu’en cas d’erreurs de limite de débit (par exemple
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached`, ou
  `workers_ai ... quota limit exceeded`).
- Les erreurs autres que les limites de débit ne sont pas réessayées avec des clés alternatives.
- Si toutes les clés échouent, l’erreur finale de la dernière tentative est renvoyée.

## Contrôler quel identifiant est utilisé

### Par session (commande de chat)

Utilisez `/model <alias-or-id>@<profileId>` pour épingler un identifiant fournisseur spécifique pour la session en cours (exemples d’identifiants de profil : `anthropic:default`, `anthropic:work`).

Utilisez `/model` (ou `/model list`) pour un sélecteur compact ; utilisez `/model status` pour la vue complète (candidats + profil d’authentification suivant, ainsi que les détails du point de terminaison fournisseur lorsqu’ils sont configurés).

### Par agent (remplacement CLI)

Définissez un remplacement explicite de l’ordre des profils d’authentification pour un agent (stocké dans le `auth-state.json` de cet agent) :

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Utilisez `--agent <id>` pour cibler un agent spécifique ; omettez-le pour utiliser l’agent par défaut configuré.
Lorsque vous déboguez des problèmes d’ordre, `openclaw models status --probe` affiche les
profils stockés omis comme `excluded_by_auth_order` au lieu de les ignorer silencieusement.
Lorsque vous déboguez des problèmes de récupération, souvenez-vous que les délais de récupération liés aux limites de débit peuvent être liés
à un identifiant de modèle plutôt qu’à l’ensemble du profil fournisseur.

## Dépannage

### "Aucun identifiant trouvé"

Si le profil Anthropic est absent, configurez une clé API Anthropic sur l’**hôte Gateway**
ou mettez en place le parcours de jeton de configuration Anthropic, puis vérifiez de nouveau :

```bash
openclaw models status
```

### Jeton sur le point d’expirer/expiré

Exécutez `openclaw models status` pour confirmer quel profil est sur le point d’expirer. Si un
profil de jeton Anthropic est absent ou expiré, actualisez cette configuration via
setup-token ou migrez vers une clé API Anthropic.
