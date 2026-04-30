---
read_when:
    - Vous voulez modifier les modèles par défaut ou consulter le statut d’authentification du fournisseur
    - Vous voulez analyser les modèles/fournisseurs disponibles et déboguer les profils d’authentification
summary: Référence CLI pour `openclaw models` (status/list/set/scan, alias, solutions de repli, authentification)
title: Modèles
x-i18n:
    generated_at: "2026-04-30T07:19:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95e2361989b583f7f52947dad1faaaba44dc6a5f58719cc2e83c13fce7c33adc
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Découverte, analyse et configuration des modèles (modèle par défaut, solutions de secours, profils d’authentification).

Associés :

- Fournisseurs + modèles : [Modèles](/fr/providers/models)
- Concepts de sélection de modèle + commande slash `/models` : [Concept des modèles](/fr/concepts/models)
- Configuration de l’authentification fournisseur : [Bien démarrer](/fr/start/getting-started)

## Commandes courantes

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` affiche le modèle par défaut et les solutions de secours résolus, ainsi qu’un aperçu de l’authentification.
Lorsque des instantanés d’utilisation des fournisseurs sont disponibles, la section d’état OAuth/clé d’API inclut
les fenêtres d’utilisation des fournisseurs et les instantanés de quotas.
Fournisseurs actuels de fenêtres d’utilisation : Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi et z.ai. L’authentification d’utilisation provient de hooks propres au fournisseur
lorsqu’ils sont disponibles ; sinon OpenClaw se rabat sur les identifiants
OAuth/clé d’API correspondants provenant des profils d’authentification, de l’environnement ou de la configuration.
Dans la sortie `--json`, `auth.providers` est l’aperçu fournisseur tenant compte de l’environnement, de la configuration et du magasin,
tandis que `auth.oauth` correspond uniquement à l’état des profils du magasin d’authentification.
Ajoutez `--probe` pour exécuter des sondes d’authentification en direct sur chaque profil fournisseur configuré.
Les sondes sont de vraies requêtes (elles peuvent consommer des jetons et déclencher des limites de débit).
Utilisez `--agent <id>` pour inspecter l’état de modèle/authentification d’un agent configuré. Si l’option est omise,
la commande utilise `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` s’ils sont définis, sinon l’agent
par défaut configuré.
Les lignes de sonde peuvent provenir de profils d’authentification, d’identifiants d’environnement ou de `models.json`.

Notes :

- `models set <model-or-alias>` accepte `provider/model` ou un alias.
- `models list` est en lecture seule : elle lit la configuration, les profils d’authentification, l’état
  existant du catalogue et les lignes de catalogue appartenant aux fournisseurs, mais elle ne réécrit pas
  `models.json`.
- La colonne `Auth` est au niveau du fournisseur et en lecture seule. Elle est calculée à partir des
  métadonnées locales de profils d’authentification, des marqueurs d’environnement, des clés fournisseur configurées, des marqueurs
  de fournisseur local, des marqueurs d’environnement/profil AWS Bedrock et des métadonnées d’authentification synthétique de Plugin ;
  elle ne charge pas le runtime du fournisseur, ne lit pas les secrets du trousseau, n’appelle pas les API
  du fournisseur et ne prouve pas que l’exécution exacte par modèle est prête.
- `models list --all --provider <id>` peut inclure des lignes de catalogue statiques appartenant au fournisseur
  issues de manifestes de Plugins ou de métadonnées de catalogue fournisseur intégrées, même si vous
  ne vous êtes pas encore authentifié auprès de ce fournisseur. Ces lignes apparaissent toujours comme
  indisponibles jusqu’à ce qu’une authentification correspondante soit configurée.
- Le large `models list --all` fusionne les lignes de catalogue de manifeste par-dessus les lignes de registre
  sans charger les hooks de supplément du runtime fournisseur. Les chemins rapides de manifeste filtrés par fournisseur
  utilisent uniquement les fournisseurs marqués `static` ; les fournisseurs marqués `refreshable`
  restent adossés au registre/cache et ajoutent les lignes de manifeste comme suppléments, tandis que
  les fournisseurs marqués `runtime` restent sur la découverte registre/runtime.
- `models list` garde les métadonnées natives du modèle et les limites du runtime distinctes. Dans la sortie
  tableau, `Ctx` affiche `contextTokens/contextWindow` lorsqu’une limite effective du runtime
  diffère de la fenêtre de contexte native ; les lignes JSON incluent `contextTokens`
  lorsqu’un fournisseur expose cette limite.
- `models list --provider <id>` filtre par identifiant de fournisseur, comme `moonshot` ou
  `openai-codex`. Elle n’accepte pas les libellés d’affichage des sélecteurs interactifs de fournisseurs,
  comme `Moonshot AI`.
- Les références de modèle sont analysées en scindant sur le **premier** `/`. Si l’ID de modèle inclut `/` (style OpenRouter), incluez le préfixe du fournisseur (exemple : `openrouter/moonshotai/kimi-k2`).
- Si vous omettez le fournisseur, OpenClaw résout d’abord l’entrée comme un alias, puis
  comme une correspondance unique de fournisseur configuré pour cet identifiant exact de modèle, puis seulement ensuite
  se rabat sur le fournisseur par défaut configuré avec un avertissement d’obsolescence.
  Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw
  se rabat sur le premier fournisseur/modèle configuré au lieu d’exposer un
  défaut obsolète de fournisseur supprimé.
- `models status` peut afficher `marker(<value>)` dans la sortie d’authentification pour les espaces réservés non secrets (par exemple `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) au lieu de les masquer comme des secrets.

### Analyse des modèles

`models scan` lit le catalogue public `:free` d’OpenRouter et classe les candidats pour une
utilisation comme solution de secours. Le catalogue lui-même est public, donc les analyses limitées aux métadonnées ne nécessitent pas
de clé OpenRouter.

Par défaut, OpenClaw tente de sonder la prise en charge des outils et des images avec des appels de modèle en direct.
Si aucune clé OpenRouter n’est configurée, la commande se rabat sur une sortie limitée aux métadonnées
et explique que les modèles `:free` nécessitent toujours `OPENROUTER_API_KEY` pour
les sondes et l’inférence.

Options :

- `--no-probe` (métadonnées uniquement ; aucune recherche de configuration/secrets)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (requête de catalogue et délai d’expiration par sonde)
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
- `--check` (code de sortie 1=expiré/manquant, 2=bientôt expiré)
- `--probe` (sonde en direct des profils d’authentification configurés)
- `--probe-provider <name>` (sonder un fournisseur)
- `--probe-profile <id>` (identifiants de profils répétés ou séparés par des virgules)
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

Cas de détail/code de raison de sonde à prévoir :

- `excluded_by_auth_order` : un profil stocké existe, mais l’ordre explicite
  `auth.order.<provider>` l’a omis, donc la sonde signale l’exclusion au lieu
  de l’essayer.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref` :
  le profil est présent mais non admissible/résoluble.
- `no_model` : l’authentification du fournisseur existe, mais OpenClaw n’a pas pu résoudre un candidat
  de modèle sondable pour ce fournisseur.

## Alias + solutions de secours

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Profils d’authentification

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` est l’assistant interactif d’authentification. Il peut lancer un flux d’authentification
fournisseur (OAuth/clé d’API) ou vous guider vers un collage manuel de jeton, selon le
fournisseur choisi.

`models auth login` exécute le flux d’authentification d’un Plugin fournisseur (OAuth/clé d’API). Utilisez
`openclaw plugins list` pour voir quels fournisseurs sont installés.
Utilisez `openclaw models auth --agent <id> <subcommand>` pour écrire les résultats d’authentification dans un
magasin d’agent configuré spécifique. L’option parente `--agent` est respectée par
`add`, `login`, `setup-token`, `paste-token` et `login-github-copilot`.

Exemples :

```bash
openclaw models auth login --provider openai-codex --set-default
```

Notes :

- `setup-token` et `paste-token` restent des commandes génériques de jeton pour les fournisseurs
  qui exposent des méthodes d’authentification par jeton.
- `setup-token` nécessite un TTY interactif et exécute la méthode d’authentification par jeton du fournisseur
  (par défaut la méthode `setup-token` de ce fournisseur lorsqu’il en expose
  une).
- `paste-token` accepte une chaîne de jeton générée ailleurs ou par automatisation.
- `paste-token` nécessite `--provider`, demande la valeur du jeton et l’écrit
  dans l’identifiant de profil par défaut `<provider>:manual`, sauf si vous passez
  `--profile-id`.
- `paste-token --expires-in <duration>` stocke une expiration absolue de jeton à partir d’une
  durée relative comme `365d` ou `12h`.
- Note Anthropic : le personnel d’Anthropic nous a indiqué que l’utilisation de Claude CLI façon OpenClaw est de nouveau autorisée, donc OpenClaw considère la réutilisation de Claude CLI et l’usage de `claude -p` comme approuvés pour cette intégration, sauf si Anthropic publie une nouvelle politique.
- Anthropic `setup-token` / `paste-token` restent disponibles comme chemin de jeton OpenClaw pris en charge, mais OpenClaw privilégie désormais la réutilisation de Claude CLI et `claude -p` lorsqu’ils sont disponibles.

## Associés

- [Référence CLI](/fr/cli)
- [Sélection de modèle](/fr/concepts/model-providers)
- [Basculement de modèle](/fr/concepts/model-failover)
