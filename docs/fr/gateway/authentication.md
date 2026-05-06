---
read_when:
    - Débogage de l’authentification du modèle ou de l’expiration OAuth
    - Documenter l’authentification ou le stockage des identifiants
summary: 'Authentification des modèles : OAuth, clés API, réutilisation du Claude CLI et setup-token d’Anthropic'
title: Authentification
x-i18n:
    generated_at: "2026-05-06T07:21:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34c83f8d2bb2016e20e5c0bbd65f8972f543aebdecdc5ad47b1f7df6d02ed783
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Cette page est la référence d’authentification des **fournisseurs de modèles** (clés API, OAuth, réutilisation de Claude CLI et setup-token Anthropic). Pour l’authentification de **connexion au Gateway** (jeton, mot de passe, trusted-proxy), consultez [Configuration](/fr/gateway/configuration) et [Authentification Trusted Proxy](/fr/gateway/trusted-proxy-auth).
</Note>

OpenClaw prend en charge OAuth et les clés API pour les fournisseurs de modèles. Pour les hôtes Gateway
toujours actifs, les clés API sont généralement l’option la plus prévisible. Les flux
d’abonnement/OAuth sont également pris en charge lorsqu’ils correspondent au modèle de compte de votre fournisseur.

Consultez [/concepts/oauth](/fr/concepts/oauth) pour le flux OAuth complet et la disposition
du stockage.
Pour l’authentification basée sur SecretRef (fournisseurs `env`/`file`/`exec`), consultez [Gestion des secrets](/fr/gateway/secrets).
Pour les règles d’éligibilité des identifiants et de codes de raison utilisées par `models status --probe`, consultez
[Sémantique des identifiants d’authentification](/fr/auth-credential-semantics).

## Configuration recommandée (clé API, tout fournisseur)

Si vous exécutez un Gateway à longue durée de vie, commencez par une clé API pour le fournisseur
choisi.
Pour Anthropic en particulier, l’authentification par clé API reste la configuration serveur
la plus prévisible, mais OpenClaw prend également en charge la réutilisation d’une connexion Claude CLI locale.

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

Redémarrez ensuite le daemon (ou redémarrez votre processus Gateway) et revérifiez :

```bash
openclaw models status
openclaw doctor
```

Si vous préférez ne pas gérer vous-même les variables d’environnement, l’onboarding peut stocker
les clés API pour l’utilisation par le daemon : `openclaw onboard`.

Consultez [Aide](/fr/help) pour plus de détails sur l’héritage de l’environnement (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic : compatibilité avec Claude CLI et les jetons

L’authentification par setup-token Anthropic reste disponible dans OpenClaw comme chemin de jeton
pris en charge. Le personnel d’Anthropic nous a depuis indiqué que l’utilisation de Claude CLI façon OpenClaw est
à nouveau autorisée ; OpenClaw considère donc la réutilisation de Claude CLI et l’utilisation de `claude -p` comme
approuvées pour cette intégration, sauf si Anthropic publie une nouvelle politique. Lorsque
la réutilisation de Claude CLI est disponible sur l’hôte, c’est désormais le chemin recommandé.

Pour les hôtes Gateway à longue durée de vie, une clé API Anthropic reste la configuration la plus prévisible.
Si vous voulez réutiliser une connexion Claude existante sur le même hôte, utilisez le chemin
Anthropic Claude CLI dans l’onboarding/la configuration.

Configuration d’hôte recommandée pour la réutilisation de Claude CLI :

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Il s’agit d’une configuration en deux étapes :

1. Connectez Claude Code lui-même à Anthropic sur l’hôte Gateway.
2. Indiquez à OpenClaw de basculer la sélection de modèles Anthropic vers le moteur local `claude-cli`
   et de stocker le profil d’authentification OpenClaw correspondant.

Si `claude` n’est pas dans `PATH`, installez d’abord Claude Code ou définissez
`agents.defaults.cliBackends.claude-cli.command` sur le chemin réel du binaire.

Saisie manuelle de jeton (tout fournisseur ; écrit `auth-profiles.json` et met à jour la configuration) :

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` stocke uniquement les identifiants. La forme canonique est :

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

OpenClaw attend à l’exécution la forme canonique `version` + `profiles`. Si une installation plus ancienne possède encore un fichier plat tel que `{ "openrouter": { "apiKey": "..." } }`, exécutez `openclaw doctor --fix` pour le réécrire sous forme de profil de clé API `openrouter:default` ; doctor conserve une copie `.legacy-flat.*.bak` à côté de l’original. Les détails de point de terminaison tels que `baseUrl`, `api`, les identifiants de modèles, les en-têtes et les délais d’expiration doivent se trouver sous `models.providers.<id>` dans `openclaw.json` ou `models.json`, pas dans `auth-profiles.json`.

Les références de profils d’authentification sont également prises en charge pour les identifiants statiques :

- Les identifiants `api_key` peuvent utiliser `keyRef: { source, provider, id }`
- Les identifiants `token` peuvent utiliser `tokenRef: { source, provider, id }`
- Les profils en mode OAuth ne prennent pas en charge les identifiants SecretRef ; si `auth.profiles.<id>.mode` est défini sur `"oauth"`, l’entrée `keyRef`/`tokenRef` adossée à SecretRef pour ce profil est rejetée.

Vérification adaptée à l’automatisation (sortie `1` si expiré/manquant, `2` si expiration proche) :

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
  `excluded_by_auth_order` pour ce profil au lieu d’essayer de l’utiliser.
- Si l’authentification existe mais qu’OpenClaw ne peut pas résoudre un candidat de modèle sondable pour
  ce fournisseur, la sonde signale `status: no_model`.
- Les délais de récupération après limitation de débit peuvent être liés à un modèle. Un profil en récupération pour un
  modèle peut encore être utilisable pour un modèle frère chez le même fournisseur.

Les scripts d’exploitation facultatifs (systemd/Termux) sont documentés ici :
[Scripts de surveillance de l’authentification](/fr/help/scripts#auth-monitoring-scripts)

## Note Anthropic

Le moteur Anthropic `claude-cli` est à nouveau pris en charge.

- Le personnel d’Anthropic nous a indiqué que ce chemin d’intégration OpenClaw est à nouveau autorisé.
- OpenClaw considère donc la réutilisation de Claude CLI et l’utilisation de `claude -p` comme approuvées
  pour les exécutions appuyées par Anthropic, sauf si Anthropic publie une nouvelle politique.
- Les clés API Anthropic restent le choix le plus prévisible pour les hôtes Gateway
  à longue durée de vie et le contrôle explicite de la facturation côté serveur.

## Vérification de l’état d’authentification des modèles

```bash
openclaw models status
openclaw doctor
```

## Comportement de rotation des clés API (Gateway)

Certains fournisseurs prennent en charge la relance d’une requête avec des clés alternatives lorsqu’un appel API
atteint une limite de débit du fournisseur.

- Ordre de priorité :
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (surcharge unique)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Les fournisseurs Google incluent également `GOOGLE_API_KEY` comme solution de secours supplémentaire.
- La même liste de clés est dédupliquée avant utilisation.
- OpenClaw réessaie avec la clé suivante uniquement pour les erreurs de limitation de débit (par exemple
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` ou
  `workers_ai ... quota limit exceeded`).
- Les erreurs qui ne relèvent pas d’une limitation de débit ne sont pas relancées avec des clés alternatives.
- Si toutes les clés échouent, l’erreur finale de la dernière tentative est renvoyée.

## Contrôler quel identifiant est utilisé

### Par session (commande de discussion)

Utilisez `/model <alias-or-id>@<profileId>` pour épingler un identifiant fournisseur spécifique pour la session actuelle (exemples d’identifiants de profil : `anthropic:default`, `anthropic:work`).

Utilisez `/model` (ou `/model list`) pour un sélecteur compact ; utilisez `/model status` pour la vue complète (candidats + prochain profil d’authentification, ainsi que les détails du point de terminaison fournisseur lorsqu’ils sont configurés).

### Par agent (surcharge CLI)

Définissez une surcharge explicite de l’ordre des profils d’authentification pour un agent (stockée dans le `auth-state.json` de cet agent) :

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Utilisez `--agent <id>` pour cibler un agent spécifique ; omettez-le pour utiliser l’agent par défaut configuré.
Lorsque vous déboguez des problèmes d’ordre, `openclaw models status --probe` affiche les profils
stockés omis comme `excluded_by_auth_order` au lieu de les ignorer silencieusement.
Lorsque vous déboguez des problèmes de récupération après limitation de débit, gardez à l’esprit que ces délais peuvent être liés
à un identifiant de modèle plutôt qu’à tout le profil fournisseur.

## Dépannage

### « Aucun identifiant trouvé »

Si le profil Anthropic est manquant, configurez une clé API Anthropic sur
l’**hôte Gateway** ou configurez le chemin setup-token Anthropic, puis revérifiez :

```bash
openclaw models status
```

### Jeton arrivant à expiration/expiré

Exécutez `openclaw models status` pour confirmer quel profil arrive à expiration. Si un
profil de jeton Anthropic est manquant ou expiré, actualisez cette configuration via
setup-token ou migrez vers une clé API Anthropic.

## Connexe

- [Gestion des secrets](/fr/gateway/secrets)
- [Accès distant](/fr/gateway/remote)
- [Stockage d’authentification](/fr/concepts/oauth)
