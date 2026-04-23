---
read_when:
    - Vous voulez modifier les modèles par défaut ou voir l’état d’authentification du fournisseur
    - Vous voulez analyser les modèles/fournisseurs disponibles et déboguer les profils d’authentification
summary: Référence CLI pour `openclaw models` (status/list/set/scan, alias, replis, authentification)
title: models
x-i18n:
    generated_at: "2026-04-23T07:01:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4ba72ca8acb7cc31796c119fce3816e6a919eb28a4ed4b03664d3b222498f5a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Découverte, analyse et configuration des modèles (modèle par défaut, replis, profils d’authentification).

Liens associés :

- Fournisseurs + modèles : [Models](/fr/providers/models)
- Concepts de sélection de modèles + commande slash `/models` : [Concept Models](/fr/concepts/models)
- Configuration de l’authentification des fournisseurs : [Premiers pas](/fr/start/getting-started)

## Commandes courantes

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` affiche les valeurs résolues du modèle par défaut/des replis ainsi qu’un aperçu de l’authentification.
Lorsque des instantanés d’usage des fournisseurs sont disponibles, la section d’état OAuth/clé API inclut
les fenêtres d’usage du fournisseur et les instantanés de quota.
Fournisseurs actuels avec fenêtre d’usage : Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi et z.ai. L’authentification d’usage provient de hooks spécifiques au fournisseur
lorsqu’ils sont disponibles ; sinon OpenClaw se replie sur les identifiants OAuth/clé API
correspondants issus des profils d’authentification, de l’env ou de la configuration.
Dans la sortie `--json`, `auth.providers` est l’aperçu des fournisseurs tenant compte de l’env/de la configuration/du store,
tandis que `auth.oauth` correspond uniquement à l’état des profils du store d’authentification.
Ajoutez `--probe` pour exécuter des sondes d’authentification en direct sur chaque profil de fournisseur configuré.
Les sondes sont de vraies requêtes (elles peuvent consommer des jetons et déclencher des limites de débit).
Utilisez `--agent <id>` pour inspecter l’état modèle/authentification d’un agent configuré. Si omis,
la commande utilise `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` s’ils sont définis, sinon
l’agent par défaut configuré.
Les lignes de sonde peuvent provenir des profils d’authentification, des identifiants d’environnement ou de `models.json`.

Remarques :

- `models set <model-or-alias>` accepte `provider/model` ou un alias.
- `models list --all` inclut les lignes statiques du catalogue intégrées appartenant aux fournisseurs, même
  si vous ne vous êtes pas encore authentifié auprès de ce fournisseur. Ces lignes restent malgré tout affichées
  comme indisponibles tant qu’une authentification correspondante n’est pas configurée.
- `models list --provider <id>` filtre par identifiant de fournisseur, tel que `moonshot` ou
  `openai-codex`. Il n’accepte pas les libellés d’affichage des sélecteurs interactifs de fournisseurs,
  tels que `Moonshot AI`.
- Les références de modèle sont analysées en découpant sur le **premier** `/`. Si l’identifiant du modèle inclut `/` (style OpenRouter), incluez le préfixe du fournisseur (exemple : `openrouter/moonshotai/kimi-k2`).
- Si vous omettez le fournisseur, OpenClaw résout d’abord l’entrée comme un alias, puis
  comme une correspondance unique de fournisseur configuré pour cet identifiant de modèle exact, et seulement ensuite
  se replie sur le fournisseur par défaut configuré avec un avertissement de dépréciation.
  Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw
  se replie sur le premier fournisseur/modèle configuré au lieu d’exposer une
  valeur par défaut obsolète d’un fournisseur supprimé.
- `models status` peut afficher `marker(<value>)` dans la sortie d’authentification pour des espaces réservés non secrets (par exemple `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) au lieu de les masquer comme des secrets.

### `models status`

Options :

- `--json`
- `--plain`
- `--check` (code de sortie 1=expiré/manquant, 2=expiration proche)
- `--probe` (sonde en direct de profils d’authentification configurés)
- `--probe-provider <name>` (sonder un fournisseur)
- `--probe-profile <id>` (répétable ou identifiants de profil séparés par des virgules)
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

- `excluded_by_auth_order` : un profil stocké existe, mais un
  `auth.order.<provider>` explicite l’a omis, donc la sonde signale l’exclusion au lieu
  de l’essayer.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref` :
  le profil est présent mais n’est pas éligible/résoluble.
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

`models auth add` est l’assistant d’authentification interactif. Il peut lancer un flux d’authentification fournisseur
(OAuth/clé API) ou vous guider vers un collage manuel de jeton, selon le
fournisseur choisi.

`models auth login` exécute le flux d’authentification d’un plugin fournisseur (OAuth/clé API). Utilisez
`openclaw plugins list` pour voir quels fournisseurs sont installés.

Exemples :

```bash
openclaw models auth login --provider openai-codex --set-default
```

Remarques :

- `setup-token` et `paste-token` restent des commandes génériques de jeton pour les fournisseurs
  qui exposent des méthodes d’authentification par jeton.
- `setup-token` exige un TTY interactif et exécute la méthode d’authentification par jeton du fournisseur
  (en utilisant par défaut la méthode `setup-token` de ce fournisseur lorsqu’il en expose
  une).
- `paste-token` accepte une chaîne de jeton générée ailleurs ou par automatisation.
- `paste-token` exige `--provider`, demande la valeur du jeton, puis l’écrit
  dans l’identifiant de profil par défaut `<provider>:manual` sauf si vous passez
  `--profile-id`.
- `paste-token --expires-in <duration>` stocke une expiration absolue du jeton à partir d’une
  durée relative telle que `365d` ou `12h`.
- Remarque Anthropic : le personnel d’Anthropic nous a indiqué que l’usage de Claude CLI de style OpenClaw est de nouveau autorisé, donc OpenClaw traite la réutilisation de Claude CLI et l’usage de `claude -p` comme autorisés pour cette intégration tant qu’Anthropic ne publie pas de nouvelle politique.
- `setup-token` / `paste-token` Anthropic restent disponibles comme chemin de jeton OpenClaw pris en charge, mais OpenClaw préfère désormais la réutilisation de Claude CLI et `claude -p` lorsqu’ils sont disponibles.
