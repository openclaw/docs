---
read_when:
    - Vous souhaitez modifier les modèles par défaut ou consulter l’état d’authentification du fournisseur
    - Vous voulez analyser les modèles/fournisseurs disponibles et déboguer les profils d’authentification
summary: Référence CLI pour `openclaw models` (status/list/set/scan, alias, solutions de repli, auth)
title: Modèles
x-i18n:
    generated_at: "2026-05-12T00:58:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 532bccd19b53517447ad784a1103fa65efe890bf35100bb88161a88aeb3c67b1
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Découverte, analyse et configuration des modèles (modèle par défaut, solutions de repli, profils d’authentification).

Associé :

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

`openclaw models status` affiche les valeurs par défaut/solutions de repli résolues ainsi qu’un aperçu de l’authentification.
Lorsque des instantanés d’utilisation des fournisseurs sont disponibles, la section d’état OAuth/clé API inclut
les fenêtres d’utilisation des fournisseurs et les instantanés de quotas.
Fournisseurs de fenêtres d’utilisation actuels : Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi et z.ai. L’authentification d’utilisation provient des hooks propres au fournisseur
lorsqu’ils sont disponibles ; sinon, OpenClaw se rabat sur les identifiants
OAuth/clé API correspondants provenant des profils d’authentification, de l’environnement ou de la configuration.
Dans la sortie `--json`, `auth.providers` est l’aperçu des fournisseurs tenant compte de l’environnement/de la configuration/du magasin,
tandis que `auth.oauth` correspond uniquement à l’état des profils du magasin d’authentification.
Ajoutez `--probe` pour exécuter des sondes d’authentification réelles sur chaque profil de fournisseur configuré.
Les sondes sont de vraies requêtes (elles peuvent consommer des jetons et déclencher des limites de débit).
Utilisez `--agent <id>` pour inspecter l’état modèle/authentification d’un agent configuré. En cas d’omission,
la commande utilise `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` s’ils sont définis, sinon l’agent
par défaut configuré.
Les lignes de sonde peuvent provenir de profils d’authentification, d’identifiants d’environnement ou de `models.json`.
Pour diagnostiquer OAuth avec Codex, `openclaw models status`,
`openclaw models auth list --provider openai-codex` et
`openclaw config get agents.defaults.model --json` sont le moyen le plus rapide de
confirmer si un agent possède un profil d’authentification `openai-codex` utilisable pour
`openai/*` via le runtime Codex natif. Voir [Configuration du fournisseur OpenAI](/fr/providers/openai#check-and-recover-codex-oauth-routing).

Remarques :

- `models set <model-or-alias>` accepte `provider/model` ou un alias.
- `models list` est en lecture seule : il lit la configuration, les profils d’authentification, l’état de catalogue
  existant et les lignes de catalogue appartenant aux fournisseurs, mais ne réécrit pas
  `models.json`.
- La colonne `Auth` est au niveau fournisseur et en lecture seule. Elle est calculée à partir des
  métadonnées de profils d’authentification locaux, des marqueurs d’environnement, des clés fournisseur configurées, des marqueurs de fournisseur local, des marqueurs d’environnement/profil AWS Bedrock et des métadonnées d’authentification synthétiques de plugin ;
  elle ne charge pas le runtime du fournisseur, ne lit pas les secrets du trousseau, n’appelle pas les
  API des fournisseurs et ne prouve pas l’aptitude exacte à l’exécution modèle par modèle.
- `models list --all --provider <id>` peut inclure des lignes de catalogue statiques appartenant au fournisseur
  provenant de manifestes de plugins ou des métadonnées de catalogue de fournisseurs intégrés, même lorsque vous
  ne vous êtes pas encore authentifié auprès de ce fournisseur. Ces lignes restent affichées comme
  indisponibles jusqu’à ce qu’une authentification correspondante soit configurée.
- `models list` maintient le plan de contrôle réactif lorsque la découverte du catalogue fournisseur
  est lente. Les vues par défaut et configurées se rabattent sur des lignes de modèles configurées ou
  synthétiques après une courte attente et laissent la découverte se terminer en
  arrière-plan. Utilisez `--all` lorsque vous avez besoin du catalogue découvert complet exact et
  que vous êtes prêt à attendre la découverte fournisseur.
- Un large `models list --all` fusionne les lignes de catalogue de manifeste par-dessus les lignes de registre
  sans charger les hooks de supplément du runtime fournisseur. Les chemins rapides de manifeste filtrés par fournisseur
  utilisent uniquement les fournisseurs marqués `static` ; les fournisseurs marqués `refreshable`
  restent adossés au registre/cache et ajoutent les lignes de manifeste comme suppléments, tandis que
  les fournisseurs marqués `runtime` restent sur la découverte registre/runtime.
- `models list` garde distinctes les métadonnées natives du modèle et les plafonds du runtime. Dans la sortie tableau,
  `Ctx` affiche `contextTokens/contextWindow` lorsqu’un plafond effectif du runtime
  diffère de la fenêtre de contexte native ; les lignes JSON incluent `contextTokens`
  lorsqu’un fournisseur expose ce plafond.
- `models list --provider <id>` filtre par identifiant de fournisseur, comme `moonshot` ou
  `openai-codex`. Il n’accepte pas les libellés d’affichage des sélecteurs interactifs de fournisseurs,
  comme `Moonshot AI`.
- Les références de modèle sont analysées en scindant sur le **premier** `/`. Si l’ID de modèle inclut `/` (style OpenRouter), incluez le préfixe du fournisseur (exemple : `openrouter/moonshotai/kimi-k2`).
- Si vous omettez le fournisseur, OpenClaw résout d’abord l’entrée comme un alias, puis
  comme une correspondance unique de fournisseur configuré pour cet ID de modèle exact, et seulement ensuite
  se rabat sur le fournisseur par défaut configuré avec un avertissement d’obsolescence.
  Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw
  se rabat sur le premier fournisseur/modèle configuré au lieu d’exposer une
  valeur par défaut obsolète d’un fournisseur supprimé.
- `models status` peut afficher `marker(<value>)` dans la sortie d’authentification pour les espaces réservés non secrets (par exemple `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) au lieu de les masquer comme des secrets.

### Analyse des modèles

`models scan` lit le catalogue public `:free` d’OpenRouter et classe les candidats pour
une utilisation en solution de repli. Le catalogue lui-même est public, les analyses limitées aux métadonnées ne nécessitent donc pas
de clé OpenRouter.

Par défaut, OpenClaw essaie de sonder la prise en charge des outils et des images avec des appels de modèle réels.
Si aucune clé OpenRouter n’est configurée, la commande se rabat sur une sortie limitée aux métadonnées
et explique que les modèles `:free` nécessitent toujours `OPENROUTER_API_KEY` pour
les sondes et l’inférence.

Options :

- `--no-probe` (métadonnées uniquement ; aucune recherche de configuration/secrets)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (requête de catalogue et délai d’attente par sonde)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` et `--set-image` nécessitent des sondes réelles ; les résultats d’analyse limités aux métadonnées
sont informatifs et ne sont pas appliqués à la configuration.

### État des modèles

Options :

- `--json`
- `--plain`
- `--check` (sortie 1=expiré/manquant, 2=expire bientôt)
- `--probe` (sonde réelle des profils d’authentification configurés)
- `--probe-provider <name>` (sonder un fournisseur)
- `--probe-profile <id>` (identifiants de profils répétés ou séparés par des virgules)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (identifiant d’agent configuré ; remplace `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` réserve stdout à la charge utile JSON. Les diagnostics de profil d’authentification, de fournisseur
et de démarrage sont routés vers stderr afin que les scripts puissent transmettre stdout directement
à des outils comme `jq`.

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

- `excluded_by_auth_order` : un profil stocké existe, mais
  `auth.order.<provider>` explicite l’a omis ; la sonde signale donc l’exclusion au lieu
  d’essayer ce profil.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref` :
  le profil est présent mais non éligible/résolvable.
- `no_model` : l’authentification fournisseur existe, mais OpenClaw n’a pas pu résoudre un candidat
  de modèle sondable pour ce fournisseur.

## Alias + solutions de repli

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

`models auth add` est l’assistant d’authentification interactif. Il peut lancer un flux d’authentification fournisseur
(OAuth/clé API) ou vous guider vers un collage manuel de jeton, selon le
fournisseur choisi.

`models auth list` liste les profils d’authentification enregistrés pour l’agent sélectionné sans
afficher de jeton, de clé API ou de matériel secret OAuth. Utilisez `--provider <id>` pour
filtrer sur un fournisseur, comme `openai-codex`, et `--json` pour les scripts.

`models auth login` exécute le flux d’authentification d’un plugin de fournisseur (OAuth/clé API). Utilisez
`openclaw plugins list` pour voir quels fournisseurs sont installés.
Utilisez `openclaw models auth --agent <id> <subcommand>` pour écrire les résultats d’authentification dans un
magasin d’agent configuré spécifique. Le drapeau parent `--agent` est respecté par
`add`, `list`, `login`, `setup-token`, `paste-token` et
`login-github-copilot`.

Pour les modèles OpenAI, `--provider openai` utilise par défaut la connexion au compte ChatGPT/Codex.
Utilisez `--method api-key` uniquement lorsque vous voulez ajouter un profil de clé API OpenAI,
généralement comme secours pour les limites d’abonnement Codex. L’ancienne graphie
`--provider openai-codex` fonctionne toujours pour les scripts existants.

Exemples :

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth list --provider openai
```

Remarques :

- `setup-token` et `paste-token` restent des commandes de jeton génériques pour les fournisseurs
  qui exposent des méthodes d’authentification par jeton.
- `setup-token` nécessite un TTY interactif et exécute la méthode d’authentification par jeton du fournisseur
  (par défaut la méthode `setup-token` de ce fournisseur lorsqu’il en expose
  une).
- `paste-token` accepte une chaîne de jeton générée ailleurs ou par automatisation.
- `paste-token` nécessite `--provider`, demande la valeur du jeton et l’écrit
  dans l’identifiant de profil par défaut `<provider>:manual`, sauf si vous passez
  `--profile-id`.
- `paste-token --expires-in <duration>` stocke une expiration absolue du jeton à partir d’une
  durée relative comme `365d` ou `12h`.
- Note Anthropic : le personnel d’Anthropic nous a indiqué que l’utilisation de Claude CLI de type OpenClaw est à nouveau autorisée ; OpenClaw traite donc la réutilisation de Claude CLI et l’utilisation de `claude -p` comme autorisées pour cette intégration, sauf si Anthropic publie une nouvelle politique.
- Anthropic `setup-token` / `paste-token` restent disponibles comme chemin de jeton OpenClaw pris en charge, mais OpenClaw privilégie désormais la réutilisation de Claude CLI et `claude -p` lorsqu’ils sont disponibles.

## Associé

- [Référence CLI](/fr/cli)
- [Sélection de modèle](/fr/concepts/model-providers)
- [Basculement de modèle](/fr/concepts/model-failover)
