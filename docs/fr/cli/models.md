---
read_when:
    - Vous souhaitez changer les modèles par défaut ou afficher l’état de l’authentification du fournisseur
    - Vous souhaitez analyser les modèles/fournisseurs disponibles et déboguer les profils d’authentification
summary: Référence CLI pour `openclaw models` (status/list/set/scan, alias, replis, authentification)
title: Models
x-i18n:
    generated_at: "2026-04-25T13:44:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c8040159e23789221357dd60232012759ee540ebfd3e5d192a0a09419d40c9a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Découverte, analyse et configuration des modèles (modèle par défaut, replis, profils d’authentification).

Associé :

- Fournisseurs + modèles : [Models](/fr/providers/models)
- Concepts de sélection de modèle + commande slash `/models` : [Concept des modèles](/fr/concepts/models)
- Configuration de l’authentification du fournisseur : [Premiers pas](/fr/start/getting-started)

## Commandes courantes

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` affiche la résolution du modèle par défaut/des replis ainsi qu’une vue d’ensemble de l’authentification.
Lorsque des instantanés d’utilisation du fournisseur sont disponibles, la section d’état OAuth/clé API inclut
les fenêtres d’utilisation du fournisseur et les instantanés de quota.
Fournisseurs actuels avec fenêtre d’utilisation : Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi et z.ai. L’authentification d’utilisation provient de hooks spécifiques au fournisseur
lorsqu’ils sont disponibles ; sinon OpenClaw retombe sur la correspondance des identifiants
OAuth/clé API à partir des profils d’authentification, de l’environnement ou de la configuration.
Dans la sortie `--json`, `auth.providers` est la vue d’ensemble du fournisseur tenant compte de
l’environnement/de la configuration/du store, tandis que `auth.oauth` concerne uniquement l’état
des profils du store d’authentification.
Ajoutez `--probe` pour exécuter des sondes d’authentification live sur chaque profil de fournisseur configuré.
Les sondes sont de vraies requêtes (elles peuvent consommer des jetons et déclencher des limites de débit).
Utilisez `--agent <id>` pour inspecter l’état modèle/authentification d’un agent configuré. S’il est omis,
la commande utilise `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` si défini, sinon
l’agent par défaut configuré.
Les lignes de sonde peuvent provenir des profils d’authentification, des identifiants d’environnement ou de `models.json`.

Remarques :

- `models set <model-or-alias>` accepte `provider/model` ou un alias.
- `models list` est en lecture seule : il lit la configuration, les profils d’authentification, l’état
  existant du catalogue et les lignes de catalogue détenues par le fournisseur, mais il ne réécrit
  pas `models.json`.
- `models list --all` inclut les lignes statiques du catalogue détenues par le fournisseur et incluses
  même lorsque vous ne vous êtes pas encore authentifié auprès de ce fournisseur. Ces lignes s’affichent toujours
  comme indisponibles tant que l’authentification correspondante n’est pas configurée.
- `models list` maintient distincts les métadonnées natives du modèle et les plafonds de runtime. Dans la sortie
  tabulaire, `Ctx` affiche `contextTokens/contextWindow` lorsqu’un plafond effectif de runtime
  diffère de la fenêtre de contexte native ; les lignes JSON incluent `contextTokens`
  lorsqu’un fournisseur expose ce plafond.
- `models list --provider <id>` filtre par identifiant de fournisseur, tel que `moonshot` ou
  `openai-codex`. Il n’accepte pas les libellés d’affichage des sélecteurs interactifs de fournisseur,
  comme `Moonshot AI`.
- Les références de modèle sont analysées en séparant sur le **premier** `/`. Si l’ID de modèle inclut `/` (style OpenRouter), incluez le préfixe du fournisseur (exemple : `openrouter/moonshotai/kimi-k2`).
- Si vous omettez le fournisseur, OpenClaw résout d’abord l’entrée comme un alias, puis
  comme une correspondance unique de fournisseur configuré pour cet ID de modèle exact, et ensuite seulement
  revient au fournisseur par défaut configuré avec un avertissement de dépréciation.
  Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw
  revient au premier fournisseur/modèle configuré au lieu d’exposer une valeur par défaut obsolète d’un fournisseur supprimé.
- `models status` peut afficher `marker(<value>)` dans la sortie d’authentification pour des espaces réservés non secrets (par exemple `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) au lieu de les masquer comme des secrets.

### `models scan`

`models scan` lit le catalogue public `:free` d’OpenRouter et classe les candidats pour
une utilisation en repli. Le catalogue lui-même est public, donc les analyses de métadonnées seules n’ont pas besoin
d’une clé OpenRouter.

Par défaut, OpenClaw essaie de sonder la prise en charge des outils et des images avec des appels live au modèle.
Si aucune clé OpenRouter n’est configurée, la commande revient à une sortie de métadonnées seules et explique
que les modèles `:free` nécessitent quand même `OPENROUTER_API_KEY` pour les sondes et l’inférence.

Options :

- `--no-probe` (métadonnées uniquement ; pas de recherche dans la configuration/les secrets)
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

`--set-default` et `--set-image` nécessitent des sondes live ; les résultats
d’analyse en métadonnées seules sont informatifs et ne sont pas appliqués à la configuration.

### `models status`

Options :

- `--json`
- `--plain`
- `--check` (code de sortie 1=expiré/manquant, 2=expire bientôt)
- `--probe` (sonde live des profils d’authentification configurés)
- `--probe-provider <name>` (sonder un fournisseur)
- `--probe-profile <id>` (répétable ou IDs séparés par des virgules)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (ID d’agent configuré ; remplace `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

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
  `auth.order.<provider>` explicite l’a omis, donc la sonde signale l’exclusion au lieu
  de l’essayer.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref` :
  le profil est présent mais non éligible/non résoluble.
- `no_model` : l’authentification du fournisseur existe, mais OpenClaw n’a pas pu résoudre un
  candidat de modèle sondable pour ce fournisseur.

## Alias + replis

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

`models auth add` est l’assistant interactif d’authentification. Il peut lancer un flux d’authentification du fournisseur
(OAuth/clé API) ou vous guider vers un collage manuel de jeton, selon le
fournisseur que vous choisissez.

`models auth login` exécute le flux d’authentification d’un Plugin fournisseur (OAuth/clé API). Utilisez
`openclaw plugins list` pour voir quels fournisseurs sont installés.

Exemples :

```bash
openclaw models auth login --provider openai-codex --set-default
```

Remarques :

- `setup-token` et `paste-token` restent des commandes génériques de jeton pour les fournisseurs
  qui exposent des méthodes d’authentification par jeton.
- `setup-token` nécessite un TTY interactif et exécute la méthode d’authentification par jeton du fournisseur
  (par défaut la méthode `setup-token` de ce fournisseur lorsqu’il en expose
  une).
- `paste-token` accepte une chaîne de jeton générée ailleurs ou par automatisation.
- `paste-token` nécessite `--provider`, demande la valeur du jeton et l’écrit
  dans l’ID de profil par défaut `<provider>:manual` sauf si vous passez
  `--profile-id`.
- `paste-token --expires-in <duration>` stocke une expiration absolue du jeton à partir d’une
  durée relative telle que `365d` ou `12h`.
- Remarque Anthropic : le personnel Anthropic nous a indiqué que l’usage de Claude CLI de style OpenClaw est de nouveau autorisé, donc OpenClaw traite la réutilisation de Claude CLI et l’usage de `claude -p` comme approuvés pour cette intégration tant qu’Anthropic ne publie pas une nouvelle politique.
- `setup-token` / `paste-token` Anthropic restent disponibles comme chemin de jeton OpenClaw pris en charge, mais OpenClaw privilégie désormais la réutilisation de Claude CLI et `claude -p` lorsqu’ils sont disponibles.

## Associé

- [Référence CLI](/fr/cli)
- [Sélection de modèle](/fr/concepts/model-providers)
- [Basculement de modèle](/fr/concepts/model-failover)
