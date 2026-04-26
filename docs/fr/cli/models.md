---
read_when:
    - Vous souhaitez modifier les modèles par défaut ou afficher l’état d’authentification du fournisseur
    - Vous souhaitez analyser les modèles/fournisseurs disponibles et déboguer les profils d’authentification
summary: Référence CLI pour `openclaw models` (status/list/set/scan, alias, solutions de repli, auth)
title: Modèles
x-i18n:
    generated_at: "2026-04-26T11:26:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5acf5972251ee7aa22d1f9222f1a497822fb1f25f29f827702f8b37dda8dadf
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Découverte, analyse et configuration des modèles (modèle par défaut, solutions de repli, profils d’authentification).

Liens utiles :

- Fournisseurs + modèles : [Modèles](/fr/providers/models)
- Concepts de sélection de modèle + commande slash `/models` : [Concept des modèles](/fr/concepts/models)
- Configuration de l’authentification du fournisseur : [Bien démarrer](/fr/start/getting-started)

## Commandes courantes

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` affiche la résolution du modèle par défaut/des solutions de repli ainsi qu’une vue d’ensemble de l’authentification.
Lorsque des instantanés d’utilisation des fournisseurs sont disponibles, la section d’état OAuth/clé API inclut
les fenêtres d’utilisation du fournisseur et les instantanés de quota.
Fournisseurs actuels avec fenêtre d’utilisation : Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi et z.ai. L’authentification d’utilisation provient de hooks spécifiques au fournisseur
lorsqu’ils sont disponibles ; sinon, OpenClaw revient à la correspondance des
identifiants OAuth/clé API depuis les profils d’authentification, l’environnement ou la config.
Dans la sortie `--json`, `auth.providers` est la vue d’ensemble des fournisseurs tenant compte de l’environnement/de la config/du store,
tandis que `auth.oauth` correspond uniquement à l’état de santé des profils du store d’authentification.
Ajoutez `--probe` pour exécuter des sondes d’authentification live sur chaque profil de fournisseur configuré.
Les sondes sont de vraies requêtes (elles peuvent consommer des tokens et déclencher des limites de débit).
Utilisez `--agent <id>` pour inspecter l’état modèle/authentification d’un agent configuré. Lorsqu’il est omis,
la commande utilise `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` s’ils sont définis ; sinon, elle utilise
l’agent par défaut configuré.
Les lignes de sonde peuvent provenir des profils d’authentification, des identifiants de l’environnement ou de `models.json`.

Remarques :

- `models set <model-or-alias>` accepte `provider/model` ou un alias.
- `models list` est en lecture seule : il lit la config, les profils d’authentification, l’état du catalogue
  existant et les lignes de catalogue détenues par le fournisseur, mais il ne réécrit pas
  `models.json`.
- `models list --all --provider <id>` peut inclure des lignes de catalogue statique détenues par le fournisseur
  issues des manifestes de Plugin ou des métadonnées de catalogue de fournisseur incluses, même lorsque vous
  ne vous êtes pas encore authentifié auprès de ce fournisseur. Ces lignes apparaissent toujours comme
  indisponibles tant qu’une authentification correspondante n’est pas configurée.
- `models list` garde distincts les métadonnées natives du modèle et les plafonds de runtime. Dans la
  sortie en tableau, `Ctx` affiche `contextTokens/contextWindow` lorsqu’un plafond de runtime effectif diffère de la fenêtre de contexte native ; les lignes JSON incluent `contextTokens`
  lorsqu’un fournisseur expose ce plafond.
- `models list --provider <id>` filtre par identifiant de fournisseur, tel que `moonshot` ou
  `openai-codex`. Il n’accepte pas les libellés d’affichage des sélecteurs interactifs de fournisseur,
  tels que `Moonshot AI`.
- Les références de modèle sont analysées en séparant sur le **premier** `/`. Si l’identifiant du modèle inclut `/` (style OpenRouter), incluez le préfixe du fournisseur (exemple : `openrouter/moonshotai/kimi-k2`).
- Si vous omettez le fournisseur, OpenClaw résout d’abord l’entrée comme alias, puis
  comme correspondance unique de fournisseur configuré pour cet identifiant exact de modèle, et ensuite seulement
  revient au fournisseur par défaut configuré avec un avertissement de dépréciation.
  Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw
  revient au premier fournisseur/modèle configuré au lieu d’afficher une
  valeur par défaut obsolète d’un fournisseur supprimé.
- `models status` peut afficher `marker(<value>)` dans la sortie d’authentification pour des espaces réservés non secrets (par exemple `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) au lieu de les masquer comme des secrets.

### `models scan`

`models scan` lit le catalogue public `:free` d’OpenRouter et classe les candidats pour
une utilisation en solution de repli. Le catalogue lui-même est public, donc les analyses de métadonnées seules ne nécessitent pas de clé OpenRouter.

Par défaut, OpenClaw essaie de sonder la prise en charge des outils et des images avec des appels live au modèle.
Si aucune clé OpenRouter n’est configurée, la commande revient à une sortie de métadonnées seules et explique que les
modèles `:free` nécessitent malgré tout `OPENROUTER_API_KEY` pour les sondes et l’inférence.

Options :

- `--no-probe` (métadonnées uniquement ; aucune recherche de config/secrets)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (délai d’expiration pour la requête de catalogue et pour chaque sonde)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` et `--set-image` nécessitent des sondes live ; les résultats d’analyse
en métadonnées seules sont informatifs et ne sont pas appliqués à la config.

### `models status`

Options :

- `--json`
- `--plain`
- `--check` (code de sortie 1=expiré/absent, 2=expire bientôt)
- `--probe` (sonde live des profils d’authentification configurés)
- `--probe-provider <name>` (sonder un seul fournisseur)
- `--probe-profile <id>` (répété ou identifiants de profils séparés par des virgules)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (identifiant d’agent configuré ; remplace `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Catégories d’état de sonde :

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Cas de détail/raison à prévoir pour les sondes :

- `excluded_by_auth_order` : un profil stocké existe, mais `auth.order.<provider>` explicite
  l’a omis ; la sonde signale donc l’exclusion au lieu de
  essayer de l’utiliser.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref` :
  le profil est présent mais n’est pas admissible/résoluble.
- `no_model` : l’authentification du fournisseur existe, mais OpenClaw n’a pas pu résoudre
  un candidat de modèle sondable pour ce fournisseur.

## Alias + solutions de repli

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

`models auth add` est l’assistant interactif d’authentification. Il peut lancer un flux d’authentification de fournisseur
(OAuth/clé API) ou vous guider vers un collage manuel de token, selon le
fournisseur choisi.

`models auth login` exécute un flux d’authentification de Plugin fournisseur (OAuth/clé API). Utilisez
`openclaw plugins list` pour voir quels fournisseurs sont installés.
Utilisez `openclaw models auth --agent <id> <subcommand>` pour écrire les résultats d’authentification dans le
store d’un agent configuré spécifique. Le drapeau parent `--agent` est pris en compte par
`add`, `login`, `setup-token`, `paste-token` et `login-github-copilot`.

Exemples :

```bash
openclaw models auth login --provider openai-codex --set-default
```

Remarques :

- `setup-token` et `paste-token` restent des commandes de token génériques pour les fournisseurs
  qui exposent des méthodes d’authentification par token.
- `setup-token` nécessite un TTY interactif et exécute la méthode d’authentification par token du fournisseur
  (par défaut la méthode `setup-token` de ce fournisseur lorsqu’il en expose
  une).
- `paste-token` accepte une chaîne de token générée ailleurs ou par automatisation.
- `paste-token` nécessite `--provider`, demande la valeur du token et l’écrit
  dans l’identifiant de profil par défaut `<provider>:manual` sauf si vous passez
  `--profile-id`.
- `paste-token --expires-in <duration>` stocke une expiration absolue de token à partir d’une
  durée relative telle que `365d` ou `12h`.
- Remarque Anthropic : le personnel d’Anthropic nous a indiqué que l’utilisation de Claude CLI dans le style OpenClaw est de nouveau autorisée ; OpenClaw considère donc la réutilisation de Claude CLI et l’usage de `claude -p` comme approuvés pour cette intégration, sauf si Anthropic publie une nouvelle politique.
- Anthropic `setup-token` / `paste-token` restent disponibles comme chemin de token OpenClaw pris en charge, mais OpenClaw préfère désormais la réutilisation de Claude CLI et `claude -p` lorsqu’ils sont disponibles.

## Lié

- [Référence CLI](/fr/cli)
- [Sélection du modèle](/fr/concepts/model-providers)
- [Basculement du modèle](/fr/concepts/model-failover)
