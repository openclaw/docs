---
read_when:
    - Vous souhaitez modifier les modèles par défaut ou consulter l’état d’authentification du fournisseur
    - Vous voulez analyser les modèles/fournisseurs disponibles et déboguer les profils d’authentification
summary: Référence CLI pour `openclaw models` (status/list/set/scan, alias, solutions de repli, authentification)
title: Modèles
x-i18n:
    generated_at: "2026-05-07T13:14:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e1a7a9304f9d03d11e38262487eae4f0cf8d7e0be7ca71bcc208030784728bf
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Découverte, analyse et configuration des modèles (modèle par défaut, replis, profils d’authentification).

Liés :

- Fournisseurs + modèles : [Modèles](/fr/providers/models)
- Concepts de sélection de modèle + commande slash `/models` : [Concept des modèles](/fr/concepts/models)
- Configuration de l’authentification des fournisseurs : [Bien démarrer](/fr/start/getting-started)

## Commandes courantes

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` affiche le modèle par défaut et les replis résolus, ainsi qu’un aperçu de l’authentification.
Lorsque des instantanés d’utilisation des fournisseurs sont disponibles, la section d’état OAuth/clé API inclut
les fenêtres d’utilisation des fournisseurs et les instantanés de quota.
Fournisseurs actuels avec fenêtre d’utilisation : Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi et z.ai. L’authentification d’utilisation provient de points d’extension propres aux fournisseurs
lorsqu’ils sont disponibles ; sinon, OpenClaw se rabat sur les identifiants OAuth/clé API correspondants
provenant des profils d’authentification, de l’environnement ou de la configuration.
Dans la sortie `--json`, `auth.providers` est l’aperçu des fournisseurs tenant compte de l’environnement, de la configuration et du stockage,
tandis que `auth.oauth` correspond uniquement à la santé des profils du magasin d’authentification.
Ajoutez `--probe` pour exécuter des sondes d’authentification en direct sur chaque profil de fournisseur configuré.
Les sondes sont de vraies requêtes (elles peuvent consommer des tokens et déclencher des limites de débit).
Utilisez `--agent <id>` pour inspecter l’état modèle/authentification d’un agent configuré. Lorsqu’il est omis,
la commande utilise `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` s’ils sont définis, sinon l’agent
par défaut configuré.
Les lignes de sonde peuvent provenir des profils d’authentification, des identifiants d’environnement ou de `models.json`.
Pour diagnostiquer OAuth avec Codex, `openclaw models status`,
`openclaw models auth list --provider openai-codex` et
`openclaw config get agents.defaults.model --json` sont les moyens les plus rapides de
confirmer si un agent dispose d’un profil d’authentification `openai-codex` utilisable pour
`openai/*` via l’exécution native de Codex. Consultez [Configuration du fournisseur OpenAI](/fr/providers/openai#check-and-recover-codex-oauth-routing).

Remarques :

- `models set <model-or-alias>` accepte `provider/model` ou un alias.
- `models list` est en lecture seule : il lit la configuration, les profils d’authentification, l’état de catalogue
  existant et les lignes de catalogue détenues par les fournisseurs, mais il ne réécrit pas
  `models.json`.
- La colonne `Auth` est au niveau du fournisseur et en lecture seule. Elle est calculée à partir des métadonnées
  locales des profils d’authentification, des marqueurs d’environnement, des clés de fournisseur configurées, des marqueurs de fournisseur local,
  des marqueurs d’environnement/profil AWS Bedrock et des métadonnées d’authentification synthétiques des plugins ;
  elle ne charge pas l’exécution du fournisseur, ne lit pas les secrets du trousseau, n’appelle pas les API
  des fournisseurs et ne prouve pas la disponibilité exacte d’exécution par modèle.
- `models list --all --provider <id>` peut inclure des lignes de catalogue statiques détenues par les fournisseurs
  depuis les manifestes de plugins ou les métadonnées de catalogue des fournisseurs groupés, même lorsque vous
  ne vous êtes pas encore authentifié auprès de ce fournisseur. Ces lignes s’affichent quand même comme
  indisponibles jusqu’à ce qu’une authentification correspondante soit configurée.
- `models list` maintient le plan de contrôle réactif lorsque la découverte du catalogue fournisseur
  est lente. Les vues par défaut et configurées se rabattent sur des lignes de modèle configurées ou
  synthétiques après une courte attente et laissent la découverte se terminer en
  arrière-plan. Utilisez `--all` lorsque vous avez besoin du catalogue complet découvert exact et
  que vous êtes prêt à attendre la découverte des fournisseurs.
- Un large `models list --all` fusionne les lignes de catalogue de manifeste par-dessus les lignes de registre
  sans charger les points d’extension de supplément d’exécution du fournisseur. Les chemins rapides de manifeste filtrés par fournisseur
  utilisent uniquement les fournisseurs marqués `static` ; les fournisseurs marqués `refreshable`
  restent adossés au registre/cache et ajoutent les lignes de manifeste comme suppléments, tandis que
  les fournisseurs marqués `runtime` restent sur la découverte via registre/exécution.
- `models list` garde les métadonnées natives des modèles et les capacités d’exécution distinctes. Dans la sortie
  en tableau, `Ctx` affiche `contextTokens/contextWindow` lorsqu’une limite d’exécution effective
  diffère de la fenêtre de contexte native ; les lignes JSON incluent `contextTokens`
  lorsqu’un fournisseur expose cette limite.
- `models list --provider <id>` filtre par identifiant de fournisseur, comme `moonshot` ou
  `openai-codex`. Il n’accepte pas les libellés d’affichage des sélecteurs interactifs de fournisseurs,
  comme `Moonshot AI`.
- Les références de modèle sont analysées en divisant sur le **premier** `/`. Si l’ID du modèle inclut `/` (style OpenRouter), incluez le préfixe du fournisseur (exemple : `openrouter/moonshotai/kimi-k2`).
- Si vous omettez le fournisseur, OpenClaw résout d’abord l’entrée comme alias, puis
  comme correspondance unique d’un fournisseur configuré pour cet identifiant de modèle exact, et seulement ensuite
  se rabat sur le fournisseur par défaut configuré avec un avertissement de dépréciation.
  Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw
  se rabat sur le premier fournisseur/modèle configuré au lieu d’afficher un
  fournisseur par défaut obsolète supprimé.
- `models status` peut afficher `marker(<value>)` dans la sortie d’authentification pour les espaces réservés non secrets (par exemple `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) au lieu de les masquer comme des secrets.

### Analyse des modèles

`models scan` lit le catalogue public `:free` d’OpenRouter et classe les candidats pour
une utilisation comme repli. Le catalogue lui-même est public, donc les analyses limitées aux métadonnées n’ont pas besoin
d’une clé OpenRouter.

Par défaut, OpenClaw essaie de sonder la prise en charge des outils et des images avec des appels de modèle en direct.
Si aucune clé OpenRouter n’est configurée, la commande se rabat sur une sortie limitée aux métadonnées
et explique que les modèles `:free` nécessitent quand même `OPENROUTER_API_KEY` pour
les sondes et l’inférence.

Options :

- `--no-probe` (métadonnées uniquement ; aucune recherche de configuration/secrets)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (délai d’expiration de la requête de catalogue et de chaque sonde)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` et `--set-image` nécessitent des sondes en direct ; les résultats d’analyse limités aux métadonnées
sont informatifs et ne sont pas appliqués à la configuration.

### État des modèles

Options :

- `--json`
- `--plain`
- `--check` (sortie 1=expiré/manquant, 2=expire bientôt)
- `--probe` (sonde en direct des profils d’authentification configurés)
- `--probe-provider <name>` (sonder un fournisseur)
- `--probe-profile <id>` (identifiants de profil répétés ou séparés par des virgules)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (identifiant d’agent configuré ; remplace `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` réserve stdout à la charge utile JSON. Les diagnostics de profil d’authentification, de fournisseur
et de démarrage sont dirigés vers stderr afin que les scripts puissent rediriger stdout directement
vers des outils comme `jq`.

Catégories d’état des sondes :

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Cas de détail/code de raison des sondes à prévoir :

- `excluded_by_auth_order` : un profil stocké existe, mais un
  `auth.order.<provider>` explicite l’a omis ; la sonde signale donc l’exclusion au lieu
  d’essayer de l’utiliser.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref` :
  le profil est présent mais non éligible/résoluble.
- `no_model` : l’authentification du fournisseur existe, mais OpenClaw n’a pas pu résoudre un
  candidat de modèle pouvant être sondé pour ce fournisseur.

## Alias + replis

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Profils d’authentification

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` est l’assistant interactif d’authentification. Il peut lancer un flux d’authentification fournisseur
(OAuth/clé API) ou vous guider vers un collage manuel de token, selon le
fournisseur choisi.

`models auth list` liste les profils d’authentification enregistrés pour l’agent sélectionné sans
afficher de token, de clé API ni de secret OAuth. Utilisez `--provider <id>` pour
filtrer sur un seul fournisseur, comme `openai-codex`, et `--json` pour les scripts.

`models auth login` exécute le flux d’authentification d’un Plugin fournisseur (OAuth/clé API). Utilisez
`openclaw plugins list` pour voir quels fournisseurs sont installés.
Utilisez `openclaw models auth --agent <id> <subcommand>` pour écrire les résultats d’authentification dans un
magasin d’agent configuré spécifique. Le drapeau parent `--agent` est respecté par
`add`, `list`, `login`, `setup-token`, `paste-token` et
`login-github-copilot`.

Exemples :

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

Remarques :

- `setup-token` et `paste-token` restent des commandes de token génériques pour les fournisseurs
  qui exposent des méthodes d’authentification par token.
- `setup-token` nécessite un TTY interactif et exécute la méthode d’authentification par token
  du fournisseur (par défaut la méthode `setup-token` de ce fournisseur lorsqu’il en expose
  une).
- `paste-token` accepte une chaîne de token générée ailleurs ou par automatisation.
- `paste-token` nécessite `--provider`, demande la valeur du token et l’écrit
  dans l’identifiant de profil par défaut `<provider>:manual`, sauf si vous passez
  `--profile-id`.
- `paste-token --expires-in <duration>` enregistre une expiration absolue de token à partir d’une
  durée relative comme `365d` ou `12h`.
- Note Anthropic : le personnel d’Anthropic nous a indiqué que l’utilisation du CLI Claude dans le style OpenClaw est à nouveau autorisée ; OpenClaw traite donc la réutilisation du CLI Claude et l’utilisation de `claude -p` comme approuvées pour cette intégration, sauf si Anthropic publie une nouvelle politique.
- Anthropic `setup-token` / `paste-token` restent disponibles comme chemin de token OpenClaw pris en charge, mais OpenClaw préfère désormais la réutilisation du CLI Claude et `claude -p` lorsque disponible.

## Liés

- [Référence CLI](/fr/cli)
- [Sélection de modèle](/fr/concepts/model-providers)
- [Basculement de modèle](/fr/concepts/model-failover)
