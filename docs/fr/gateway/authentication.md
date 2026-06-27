---
read_when:
    - Débogage de l’authentification du modèle ou de l’expiration OAuth
    - Documenter l’authentification ou le stockage des identifiants
summary: 'Authentification des modèles : OAuth, clés API, réutilisation de Claude CLI et setup-token Anthropic'
title: Authentification
x-i18n:
    generated_at: "2026-06-27T17:28:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4b33eff2386ba48797c96b99f3eb80df4df2d5baab9c42b73fc8e5e722f0767b
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Cette page est la référence d’authentification des **fournisseurs de modèles** (clés API, OAuth, réutilisation de Claude CLI et setup-token Anthropic). Pour l’authentification de **connexion au Gateway** (jeton, mot de passe, trusted-proxy), consultez [Configuration](/fr/gateway/configuration) et [Authentification par proxy approuvé](/fr/gateway/trusted-proxy-auth).
</Note>

OpenClaw prend en charge OAuth et les clés API pour les fournisseurs de modèles. Pour les hôtes Gateway
toujours actifs, les clés API sont généralement l’option la plus prévisible. Les flux
abonnement/OAuth sont également pris en charge lorsqu’ils correspondent au modèle de compte de votre fournisseur.

Consultez [/concepts/oauth](/fr/concepts/oauth) pour le flux OAuth complet et la disposition
du stockage.
Pour l’authentification basée sur SecretRef (fournisseurs `env`/`file`/`exec`), consultez [Gestion des secrets](/fr/gateway/secrets).
Pour les règles d’éligibilité des identifiants et de codes de raison utilisées par `models status --probe`, consultez
[Sémantique des identifiants d’authentification](/fr/auth-credential-semantics).

## Configuration recommandée (clé API, tout fournisseur)

Si vous exécutez un Gateway longue durée, commencez avec une clé API pour le
fournisseur choisi.
Pour Anthropic en particulier, l’authentification par clé API reste la configuration serveur la plus prévisible,
mais OpenClaw prend également en charge la réutilisation d’une connexion locale Claude CLI.

1. Créez une clé API dans la console de votre fournisseur.
2. Placez-la sur l’**hôte Gateway** (la machine qui exécute `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Si le Gateway s’exécute sous systemd/launchd, préférez placer la clé dans
   `~/.openclaw/.env` afin que le daemon puisse la lire :

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Redémarrez ensuite le daemon (ou redémarrez votre processus Gateway), puis vérifiez à nouveau :

```bash
openclaw models status
openclaw doctor
```

Si vous préférez ne pas gérer vous-même les variables d’environnement, l’onboarding peut stocker
les clés API pour une utilisation par le daemon : `openclaw onboard`.

Consultez [Aide](/fr/help) pour plus de détails sur l’héritage de l’environnement (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic : compatibilité avec Claude CLI et les jetons

L’authentification Anthropic par setup-token reste disponible dans OpenClaw comme chemin de jeton
pris en charge. Le personnel d’Anthropic nous a depuis indiqué que l’utilisation de Claude CLI à la manière d’OpenClaw est
de nouveau autorisée ; OpenClaw traite donc la réutilisation de Claude CLI et l’utilisation de `claude -p` comme
autorisées pour cette intégration, sauf si Anthropic publie une nouvelle politique. Lorsque
la réutilisation de Claude CLI est disponible sur l’hôte, c’est désormais le chemin recommandé.

Pour les hôtes Gateway longue durée, une clé API Anthropic reste la configuration la plus prévisible.
Si vous souhaitez réutiliser une connexion Claude existante sur le même hôte, utilisez le
chemin Anthropic Claude CLI dans onboarding/configure.

Configuration d’hôte recommandée pour la réutilisation de Claude CLI :

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Il s’agit d’une configuration en deux étapes :

1. Connectez Claude Code lui-même à Anthropic sur l’hôte Gateway.
2. Demandez à OpenClaw de basculer la sélection de modèles Anthropic vers le backend local `claude-cli`
   et de stocker le profil d’authentification OpenClaw correspondant.

Si `claude` n’est pas dans `PATH`, installez d’abord Claude Code ou définissez
`agents.defaults.cliBackends.claude-cli.command` sur le chemin réel du binaire.

Saisie manuelle d’un jeton (tout fournisseur ; écrit dans le stockage d’authentification SQLite par agent + met à jour la configuration) :

```bash
openclaw models auth paste-token --provider openrouter
```

Le stockage des profils d’authentification ne conserve que les identifiants. Les anciens fichiers `auth-profiles.json` utilisaient cette forme canonique :

```json
{
  "version": 1,
  "profiles": {
    "openrouter:default": {
      "type": "api_key",
      "provider": "openrouter",
      "key": "OPENROUTER_API_KEY"
    }
  }
}
```

OpenClaw lit désormais les profils d’authentification depuis le fichier `openclaw-agent.sqlite` de chaque agent. Si une ancienne installation contient encore `auth-profiles.json`, `auth-state.json` ou un fichier de profil d’authentification plat comme `{ "openrouter": { "apiKey": "..." } }`, exécutez `openclaw doctor --fix` pour l’importer dans SQLite ; doctor conserve des sauvegardes horodatées à côté des fichiers JSON d’origine. Les détails d’endpoint comme `baseUrl`, `api`, les identifiants de modèles, les en-têtes et les délais d’expiration doivent se trouver sous `models.providers.<id>` dans `openclaw.json` ou `models.json`, pas dans les profils d’authentification.

Les routes d’authentification externes comme Bedrock `auth: "aws-sdk"` ne sont pas non plus des identifiants. Si vous voulez une route Bedrock nommée, placez `auth.profiles.<id>.mode: "aws-sdk"` dans `openclaw.json` ; n’écrivez pas `type: "aws-sdk"` dans le stockage des profils d’authentification. `openclaw doctor --fix` déplace les anciens marqueurs AWS SDK du stockage des identifiants vers les métadonnées de configuration.

Les références de profils d’authentification sont également prises en charge pour les identifiants statiques :

- Les identifiants `api_key` peuvent utiliser `keyRef: { source, provider, id }`
- Les identifiants `token` peuvent utiliser `tokenRef: { source, provider, id }`
- Les profils en mode OAuth ne prennent pas en charge les identifiants SecretRef ; si `auth.profiles.<id>.mode` est défini sur `"oauth"`, l’entrée `keyRef`/`tokenRef` adossée à SecretRef pour ce profil est rejetée.

Vérification adaptée à l’automatisation (sortie `1` si expiré/manquant, `2` si proche de l’expiration) :

```bash
openclaw models status --check
```

Sondes d’authentification en direct :

```bash
openclaw models status --probe
```

Notes :

- Les lignes de sonde peuvent provenir de profils d’authentification, d’identifiants d’environnement ou de `models.json`.
- Si `auth.order.<provider>` explicite omet un profil stocké, la sonde signale
  `excluded_by_auth_order` pour ce profil au lieu de l’essayer.
- Si l’authentification existe mais qu’OpenClaw ne peut pas résoudre de candidat de modèle sondable pour
  ce fournisseur, la sonde signale `status: no_model`.
- Les délais de refroidissement de limitation de débit peuvent être propres à un modèle. Un profil en refroidissement pour un
  modèle peut encore être utilisable pour un modèle apparenté chez le même fournisseur.

Les scripts d’exploitation facultatifs (systemd/Termux) sont documentés ici :
[Scripts de surveillance de l’authentification](/fr/help/scripts#auth-monitoring-scripts)

## Note Anthropic

Le backend Anthropic `claude-cli` est de nouveau pris en charge.

- Le personnel d’Anthropic nous a indiqué que ce chemin d’intégration OpenClaw est de nouveau autorisé.
- OpenClaw traite donc la réutilisation de Claude CLI et l’utilisation de `claude -p` comme autorisées
  pour les exécutions adossées à Anthropic, sauf si Anthropic publie une nouvelle politique.
- Les clés API Anthropic restent le choix le plus prévisible pour les hôtes Gateway
  longue durée et le contrôle explicite de la facturation côté serveur.

## Vérification de l’état d’authentification des modèles

```bash
openclaw models status
openclaw doctor
```

## Comportement de rotation des clés API (Gateway)

Certains fournisseurs prennent en charge la nouvelle tentative d’une requête avec des clés alternatives lorsqu’un appel API
atteint une limite de débit du fournisseur.

- Ordre de priorité :
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (remplacement unique)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Les fournisseurs Google incluent également `GOOGLE_API_KEY` comme fallback supplémentaire.
- La même liste de clés est dédupliquée avant utilisation.
- OpenClaw réessaie avec la clé suivante uniquement pour les erreurs de limite de débit (par exemple
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` ou
  `workers_ai ... quota limit exceeded`).
- Les erreurs qui ne sont pas des limites de débit ne sont pas réessayées avec des clés alternatives.
- Si toutes les clés échouent, l’erreur finale de la dernière tentative est renvoyée.

## Suppression de l’authentification fournisseur pendant l’exécution du Gateway

Lorsque l’authentification fournisseur est supprimée via le plan de contrôle du Gateway, OpenClaw supprime
les profils d’authentification enregistrés pour ce fournisseur et interrompt les discussions ou exécutions d’agent actives
dont le fournisseur de modèles sélectionné correspond au fournisseur supprimé. Les exécutions interrompues émettent
les événements normaux d’annulation de discussion et de cycle de vie avec
`stopReason: "auth-revoked"`, afin que les clients connectés puissent indiquer que l’exécution a été
arrêtée parce que les identifiants ont été supprimés.

La suppression de l’authentification enregistrée ne révoque pas les clés chez le fournisseur. Faites pivoter ou révoquez la
clé dans le tableau de bord du fournisseur lorsque vous avez besoin d’une invalidation côté fournisseur.

## Contrôle de l’identifiant utilisé

### OpenAI et anciens identifiants `openai-codex`

Les profils de clé API OpenAI et les profils OAuth ChatGPT/Codex utilisent tous deux l’identifiant canonique
de fournisseur `openai`. La nouvelle configuration doit utiliser des identifiants de profil `openai:*` et
`auth.order.openai`.

Si vous voyez `openai-codex` dans une ancienne configuration, des identifiants de profils d’authentification ou
`auth.order.openai-codex`, traitez-le comme une entrée de migration héritée. Ne créez pas de nouveaux
profils `openai-codex`. Exécutez :

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor réécrit les anciens identifiants de profil `openai-codex:*` et les entrées
`auth.order.openai-codex` vers la route d’authentification canonique `openai`. Pour
le routage modèle/runtime propre à OpenAI, consultez [OpenAI](/fr/providers/openai).

### Pendant la connexion (CLI)

Utilisez `openclaw models auth login --provider <id> --profile-id <profileId>` pour les
fournisseurs qui prennent en charge les profils d’authentification nommés pendant la connexion.

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

C’est le moyen le plus simple de conserver plusieurs connexions OAuth pour le même fournisseur
séparées dans un même agent.

Utilisez `--force` lorsqu’un profil fournisseur enregistré est bloqué, expiré ou lié au
mauvais compte et que la commande de connexion normale continue à le réutiliser. `--force` supprime
les profils d’authentification enregistrés pour ce fournisseur dans le répertoire de l’agent sélectionné, puis
relance le même flux d’authentification fournisseur. Cela ne révoque pas les identifiants chez le
fournisseur ; faites-les pivoter ou révoquez-les dans le tableau de bord du fournisseur lorsque vous avez besoin
d’une invalidation côté fournisseur.

```bash
openclaw models auth login --provider anthropic --force
```

### Par session (commande de discussion)

Utilisez `/model <alias-or-id>@<profileId>` pour fixer un identifiant fournisseur spécifique pour la session actuelle (exemples d’identifiants de profil : `anthropic:default`, `anthropic:work`).

Utilisez `/model` (ou `/model list`) pour un sélecteur compact ; utilisez `/model status` pour la vue complète (candidats + prochain profil d’authentification, ainsi que les détails d’endpoint du fournisseur lorsqu’ils sont configurés).

### Par agent (remplacement CLI)

Définissez un remplacement explicite de l’ordre des profils d’authentification pour un agent (stocké dans l’état d’authentification SQLite de cet agent) :

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Utilisez `--agent <id>` pour cibler un agent spécifique ; omettez-le pour utiliser l’agent par défaut configuré.
Lorsque vous déboguez des problèmes d’ordre, `openclaw models status --probe` affiche les profils stockés omis
comme `excluded_by_auth_order` au lieu de les ignorer silencieusement.
Lorsque vous déboguez des problèmes de refroidissement, souvenez-vous que les délais de refroidissement de limitation de débit peuvent être liés
à un identifiant de modèle plutôt qu’à tout le profil fournisseur.

Si vous modifiez l’ordre d’authentification ou l’épinglage de profil pour une discussion déjà en cours,
envoyez `/new` ou `/reset` dans cette discussion pour démarrer une nouvelle session. Les sessions existantes
peuvent conserver leur sélection actuelle de modèle/profil jusqu’à réinitialisation.

## Dépannage

### « Aucun identifiant trouvé »

Si le profil Anthropic est manquant, configurez une clé API Anthropic sur l’
**hôte Gateway** ou configurez le chemin setup-token Anthropic, puis vérifiez à nouveau :

```bash
openclaw models status
```

### Jeton proche de l’expiration/expiré

Exécutez `openclaw models status` pour confirmer quel profil arrive à expiration. Si un
profil de jeton Anthropic est manquant ou expiré, actualisez cette configuration via
setup-token ou migrez vers une clé API Anthropic.

## Connexe

- [Gestion des secrets](/fr/gateway/secrets)
- [Accès à distance](/fr/gateway/remote)
- [Stockage de l’authentification](/fr/concepts/oauth)
