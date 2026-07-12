---
read_when:
    - Débogage de l’authentification du modèle ou de l’expiration OAuth
    - Documenter l’authentification ou le stockage des identifiants
summary: 'Authentification des modèles : OAuth, clés API, réutilisation de la CLI Claude et jeton de configuration Anthropic'
title: Authentification
x-i18n:
    generated_at: "2026-07-12T15:16:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 002877002323297f0ff24fdeb5283bf998215f902b0cbd3b152f7ba9085a852a
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Cette page traite de l’authentification auprès des **fournisseurs de modèles** (clés API, OAuth, réutilisation de la CLI Claude, jeton de configuration Anthropic). Pour l’authentification de la **connexion au Gateway** (jeton, mot de passe, proxy de confiance), consultez [Configuration](/fr/gateway/configuration) et [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth).
</Note>

OpenClaw prend en charge OAuth et les clés API pour les fournisseurs de modèles. Pour un hôte Gateway fonctionnant en permanence, une clé API constitue l’option la plus prévisible ; les flux d’abonnement/OAuth fonctionnent également lorsqu’ils correspondent au modèle de compte de votre fournisseur.

- Flux OAuth complet et organisation du stockage : [/concepts/oauth](/fr/concepts/oauth)
- Authentification basée sur SecretRef (fournisseurs `env`/`file`/`exec`) : [Gestion des secrets](/fr/gateway/secrets)
- Éligibilité des identifiants et codes de motif utilisés par `models status --probe` : [Sémantique des identifiants d’authentification](/fr/auth-credential-semantics)

## Configuration recommandée : clé API (tout fournisseur)

1. Créez une clé API dans la console de votre fournisseur.
2. Placez-la sur l’**hôte Gateway** (la machine exécutant `openclaw gateway`) :

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Si le Gateway s’exécute sous systemd/launchd, placez la clé dans `~/.openclaw/.env` afin que le démon puisse la lire :

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

4. Redémarrez le processus Gateway (ou le démon), puis vérifiez à nouveau :

```bash
openclaw models status
openclaw doctor
```

`openclaw onboard` peut également stocker les clés API pour le démon si vous ne souhaitez pas gérer vous-même les variables d’environnement. Consultez [Variables d’environnement](/fr/help/environment) pour connaître l’ordre de priorité complet du chargement de l’environnement (`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd).

## Anthropic : réutilisation de la CLI Claude

L’authentification par jeton de configuration Anthropic reste prise en charge. La réutilisation de la CLI Claude (utilisation de type `claude -p`) est également autorisée pour cette intégration ; lorsqu’une connexion à la CLI Claude est disponible sur l’hôte, il s’agit de la méthode recommandée pour une utilisation locale/sur ordinateur. Pour les hôtes Gateway de longue durée, une clé API Anthropic reste le choix le plus prévisible, avec un contrôle explicite de la facturation côté serveur.

Configuration de l’hôte pour réutiliser la CLI Claude :

```bash
# Exécuter sur l’hôte Gateway
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Cette opération comporte deux étapes : connecter Claude Code à Anthropic sur l’hôte, puis indiquer à OpenClaw d’acheminer la sélection des modèles Anthropic via le moteur local `claude-cli` et de stocker le profil d’authentification OpenClaw correspondant.

Si `claude` n’est pas disponible dans `PATH`, installez Claude Code ou définissez `agents.defaults.cliBackends.claude-cli.command` sur le chemin du binaire.

## Saisie manuelle du jeton

Fonctionne avec n’importe quel fournisseur ; écrit dans le stockage d’authentification SQLite propre à l’agent et met à jour la configuration :

```bash
openclaw models auth paste-token --provider openrouter
```

OpenClaw lit les profils d’authentification dans le fichier `openclaw-agent.sqlite` de chaque agent. Les détails des points de terminaison (`baseUrl`, `api`, identifiants de modèle, en-têtes, délais d’expiration) doivent se trouver sous `models.providers.<id>` dans `openclaw.json` ou `models.json`, et non dans les profils d’authentification.

Si une ancienne installation contient encore `auth-profiles.json`, `auth-state.json` ou une structure plate telle que `{ "openrouter": { "apiKey": "..." } }`, exécutez `openclaw doctor --fix` pour l’importer dans SQLite ; doctor conserve des sauvegardes horodatées à côté des fichiers JSON d’origine.

Les mécanismes d’authentification externes comme `auth: "aws-sdk"` de Bedrock ne sont pas des identifiants. Pour un mécanisme Bedrock nommé, définissez `auth.profiles.<id>.mode: "aws-sdk"` dans `openclaw.json` — n’écrivez pas `type: "aws-sdk"` dans le stockage des profils d’authentification. `openclaw doctor --fix` déplace les anciens marqueurs AWS SDK du stockage des identifiants vers les métadonnées de configuration.

### Identifiants basés sur SecretRef

- Les identifiants `api_key` peuvent utiliser `keyRef: { source, provider, id }`
- Les identifiants `token` peuvent utiliser `tokenRef: { source, provider, id }`
- Les profils en mode OAuth refusent les identifiants SecretRef : si `auth.profiles.<id>.mode` vaut `"oauth"`, un `keyRef`/`tokenRef` basé sur SecretRef pour ce profil est refusé.

## Vérification de l’état d’authentification des modèles

```bash
openclaw models status
openclaw doctor
```

Vérification adaptée à l’automatisation, avec le code de sortie `1` en cas d’expiration/d’absence et `2` en cas d’expiration imminente :

```bash
openclaw models status --check
```

Sondes d’authentification en direct (ajoutez `--probe-provider`, `--probe-profile`, `--probe-timeout`, `--probe-concurrency` ou `--probe-max-tokens` pour réduire le périmètre) :

```bash
openclaw models status --probe
```

Remarques :

- Les lignes des sondes peuvent provenir des profils d’authentification, des identifiants d’environnement ou de `models.json`.
- Si `auth.order.<provider>` omet un profil stocké, la sonde signale `excluded_by_auth_order` pour ce profil au lieu de tenter de l’utiliser.
- Si l’authentification existe, mais qu’OpenClaw ne peut pas déterminer de modèle pouvant être sondé pour ce fournisseur, la sonde signale `status: no_model`.
- Les périodes de temporisation après limitation de débit peuvent être propres à un modèle : un profil en temporisation pour un modèle peut encore desservir un modèle apparenté chez le même fournisseur.

Scripts d’exploitation facultatifs (systemd/Termux) : [Scripts de surveillance de l’authentification](/fr/help/scripts#auth-monitoring-scripts).

## Rotation des clés API (Gateway)

Certains fournisseurs retentent une requête avec une autre clé configurée lorsqu’un appel rencontre une limitation de débit imposée par le fournisseur.

Ordre de priorité des clés pour chaque fournisseur :

1. `OPENCLAW_LIVE_<PROVIDER>_KEY` (remplacement unique, impose une seule clé)
2. `<PROVIDER>_API_KEYS` (liste séparée par des virgules, espaces ou points-virgules)
3. `<PROVIDER>_API_KEY`
4. `<PROVIDER>_API_KEY_*` (toute variable d’environnement avec ce préfixe)

Les fournisseurs Google (`google`, `google-vertex`) utilisent également `GOOGLE_API_KEY` comme solution de repli. Les doublons sont supprimés de la liste combinée avant son utilisation.

OpenClaw ne passe à la clé suivante que lorsque le message d’erreur correspond à : `rate_limit`, `rate limit`, `429`, `quota exceeded`/`quota_exceeded`, `resource exhausted`/`resource_exhausted` ou `too many requests`. Les autres erreurs ne donnent pas lieu à une nouvelle tentative avec d’autres clés. Si toutes les clés échouent, l’erreur finale de la dernière tentative est renvoyée.

<Note>
Les expressions propres aux fournisseurs, telles que `ThrottlingException`, `concurrency limit reached` ou `workers_ai ... quota limit exceeded`, déterminent la **classification du basculement/des nouvelles tentatives** (changement de modèle ou de fournisseur après des échecs répétés), un mécanisme distinct de la rotation des clés API décrite ci-dessus.
</Note>

La suppression de l’authentification enregistrée ne révoque pas la clé auprès du fournisseur — effectuez sa rotation ou révoquez-la dans le tableau de bord du fournisseur lorsque vous avez besoin de l’invalider côté fournisseur.

## Suppression de l’authentification d’un fournisseur pendant l’exécution du Gateway

Lorsque vous supprimez l’authentification d’un fournisseur par l’intermédiaire du plan de contrôle du Gateway, OpenClaw supprime les profils d’authentification enregistrés pour ce fournisseur et interrompt les exécutions de discussions/agents actives dont le fournisseur du modèle sélectionné correspond à celui qui a été supprimé. Les exécutions interrompues émettent les événements habituels d’annulation et de cycle de vie avec `stopReason: "auth-revoked"`, afin que les clients connectés puissent indiquer que l’exécution s’est arrêtée en raison de la suppression des identifiants.

## Contrôle de l’identifiant utilisé

### OpenAI et anciens identifiants `openai-codex`

Les profils de clé API OpenAI et les profils OAuth ChatGPT/Codex utilisent tous deux l’identifiant de fournisseur canonique `openai`. Utilisez des identifiants de profil `openai:*` et `auth.order.openai` pour toute nouvelle configuration.

Si vous voyez `openai-codex` dans une ancienne configuration, dans des identifiants de profils d’authentification ou dans `auth.order.openai-codex`, considérez-le comme une entrée de migration héritée — ne créez pas de nouveaux profils `openai-codex`. Exécutez :

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor réécrit les anciens identifiants de profil `openai-codex:*` et les entrées `auth.order.openai-codex` vers le mécanisme canonique `openai`. Pour l’acheminement propre aux modèles et à l’environnement d’exécution OpenAI, consultez [OpenAI](/fr/providers/openai).

### Pendant la connexion (CLI)

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

`--profile-id` permet de conserver séparément plusieurs connexions OAuth au même fournisseur au sein d’un même agent.

`--force` supprime les profils d’authentification enregistrés pour ce fournisseur dans le répertoire de l’agent sélectionné, puis relance le même flux d’authentification. Utilisez cette option lorsqu’un profil enregistré est bloqué, expiré ou associé au mauvais compte. Elle ne révoque pas les identifiants auprès du fournisseur.

```bash
openclaw models auth login --provider anthropic --force
```

### Par session (commande de discussion)

- `/model <alias-or-id>@<profileId>` impose un identifiant de fournisseur précis pour la session en cours (exemples d’identifiants de profil : `anthropic:default`, `anthropic:work`).
- `/model` (ou `/model list`) affiche un sélecteur compact ; `/model status` affiche la vue complète (candidats + prochain profil d’authentification, ainsi que les détails du point de terminaison du fournisseur lorsqu’ils sont configurés).

Si vous modifiez l’ordre d’authentification ou l’épinglage d’un profil pour une discussion déjà en cours, envoyez `/new` ou `/reset` pour démarrer une nouvelle session — les sessions existantes conservent leur sélection actuelle de modèle/profil jusqu’à leur réinitialisation.

### Par agent (remplacement via la CLI)

Les remplacements de l’ordre d’authentification sont stockés dans l’état d’authentification SQLite de cet agent :

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Utilisez `--agent <id>` pour cibler un agent précis ; omettez cette option pour utiliser l’agent configuré par défaut. `openclaw models status --probe` affiche les profils stockés omis comme `excluded_by_auth_order` au lieu de les ignorer silencieusement.

## Résolution des problèmes

### « Aucun identifiant trouvé »

Configurez une clé API Anthropic sur l’**hôte Gateway**, ou configurez le mécanisme par jeton de configuration Anthropic, puis vérifiez à nouveau :

```bash
openclaw models status
```

### Jeton arrivant à expiration/expiré

Exécutez `openclaw models status` pour déterminer quel profil arrive à expiration. Si un profil de jeton Anthropic est absent ou expiré, actualisez-le à l’aide du jeton de configuration ou migrez vers une clé API Anthropic.

## Voir aussi

- [Gestion des secrets](/fr/gateway/secrets)
- [Accès distant](/fr/gateway/remote)
- [Stockage de l’authentification](/fr/concepts/oauth)
