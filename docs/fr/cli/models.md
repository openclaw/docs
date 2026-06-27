---
read_when:
    - Vous voulez modifier les modèles par défaut ou afficher l’état d’authentification du fournisseur
    - Vous voulez analyser les modèles/fournisseurs disponibles et déboguer les profils d’authentification
summary: Référence CLI pour `openclaw models` (status/list/set/scan, alias, solutions de repli, authentification)
title: Modèles
x-i18n:
    generated_at: "2026-06-27T17:19:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15d0a01e0f8f971996359413306a1c694e5a787eaef69b13eb8ac63c2a7c8990
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Découverte, analyse et configuration des modèles (modèle par défaut, solutions de repli, profils d’authentification).

Voir aussi :

- Fournisseurs + modèles : [Modèles](/fr/providers/models)
- Concepts de sélection de modèle + commande slash `/models` : [Concept Modèles](/fr/concepts/models)
- Configuration de l’authentification fournisseur : [Bien démarrer](/fr/start/getting-started)

## Commandes courantes

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` affiche les valeurs par défaut/solutions de repli résolues ainsi qu’un aperçu de l’authentification.
Lorsque des instantanés d’utilisation des fournisseurs sont disponibles, la section de statut OAuth/clé d’API inclut
les fenêtres d’utilisation des fournisseurs et les instantanés de quota.
Fournisseurs avec fenêtre d’utilisation actuels : Anthropic, GitHub Copilot, Gemini CLI, OpenAI,
MiniMax, Xiaomi et z.ai. L’authentification d’utilisation provient de hooks propres au fournisseur
lorsqu’ils sont disponibles ; sinon OpenClaw se rabat sur les identifiants OAuth/clé d’API correspondants
provenant des profils d’authentification, de l’environnement ou de la configuration.
Dans la sortie `--json`, `auth.providers` est l’aperçu des fournisseurs tenant compte de l’environnement, de la configuration et du stockage,
tandis que `auth.oauth` correspond uniquement à la santé des profils du magasin d’authentification.
Ajoutez `--probe` pour exécuter des sondes d’authentification en direct sur chaque profil fournisseur configuré.
Les sondes sont de vraies requêtes (elles peuvent consommer des tokens et déclencher des limites de débit).
Utilisez `--agent <id>` pour inspecter l’état modèle/authentification d’un agent configuré. En cas d’omission,
la commande utilise `OPENCLAW_AGENT_DIR` s’il est défini, sinon l’agent
par défaut configuré.
Les lignes de sonde peuvent provenir de profils d’authentification, d’identifiants d’environnement ou de `models.json`.
Pour le dépannage OAuth OpenAI ChatGPT/Codex, `openclaw models status`,
`openclaw models auth list --provider openai` et
`openclaw config get agents.defaults.model --json` sont le moyen le plus rapide de
confirmer si un agent dispose d’un profil OAuth `openai` utilisable pour
`openai/*` via le runtime Codex natif. Consultez [Configuration du fournisseur OpenAI](/fr/providers/openai#check-and-recover-codex-oauth-routing).

Notes :

- `models set <model-or-alias>` accepte `provider/model` ou un alias.
- `models list` est en lecture seule : elle lit la configuration, les profils d’authentification, l’état du catalogue
  existant et les lignes de catalogue détenues par les fournisseurs, mais elle ne réécrit pas
  `models.json`.
- La colonne `Auth` est au niveau fournisseur et en lecture seule. Elle est calculée à partir des métadonnées
  locales des profils d’authentification, des marqueurs d’environnement, des clés fournisseur configurées, des marqueurs
  de fournisseur local, des marqueurs d’environnement/profil AWS Bedrock et des métadonnées d’authentification synthétique des Plugins ;
  elle ne charge pas le runtime fournisseur, ne lit pas les secrets du trousseau, n’appelle pas les API
  fournisseur et ne prouve pas la disponibilité exacte de l’exécution par modèle.
- `models list --all --provider <id>` peut inclure des lignes de catalogue statique détenues par le fournisseur
  depuis les manifestes de Plugin ou les métadonnées de catalogue fournisseur intégrées, même lorsque vous
  ne vous êtes pas encore authentifié auprès de ce fournisseur. Ces lignes restent affichées comme
  indisponibles jusqu’à ce qu’une authentification correspondante soit configurée.
- `models list` garde le plan de contrôle réactif lorsque la découverte du catalogue fournisseur
  est lente. Les vues par défaut et configurées se rabattent sur des lignes de modèle configurées ou
  synthétiques après une courte attente et laissent la découverte se terminer en
  arrière-plan. Utilisez `--all` lorsque vous avez besoin du catalogue découvert complet exact et
  que vous êtes prêt à attendre la découverte fournisseur.
- Un large `models list --all` fusionne les lignes de catalogue de manifeste par-dessus les lignes de registre
  sans charger les hooks de complément du runtime fournisseur. Les chemins rapides de manifeste filtrés par fournisseur
  utilisent uniquement les fournisseurs marqués `static` ; les fournisseurs marqués `refreshable`
  restent adossés au registre/cache et ajoutent les lignes de manifeste comme compléments, tandis que
  les fournisseurs marqués `runtime` restent sur la découverte registre/runtime.
- `models list` conserve les métadonnées de modèle natives et les limites du runtime séparées. Dans la sortie
  tableau, `Ctx` affiche `contextTokens/contextWindow` lorsqu’une limite effective du runtime
  diffère de la fenêtre de contexte native ; les lignes JSON incluent `contextTokens`
  lorsqu’un fournisseur expose cette limite.
- `models list --provider <id>` filtre par identifiant de fournisseur, comme `moonshot` ou
  `openai`. Elle n’accepte pas les libellés d’affichage des sélecteurs interactifs de fournisseurs,
  comme `Moonshot AI`.
- Les références de modèle sont analysées en séparant sur le **premier** `/`. Si l’ID de modèle inclut `/` (style OpenRouter), incluez le préfixe fournisseur (exemple : `openrouter/moonshotai/kimi-k2`).
- Si vous omettez le fournisseur, OpenClaw résout d’abord l’entrée comme un alias, puis
  comme une correspondance unique de fournisseur configuré pour cet identifiant de modèle exact, et seulement ensuite
  se rabat sur le fournisseur par défaut configuré avec un avertissement de dépréciation.
  Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw
  se rabat sur le premier fournisseur/modèle configuré au lieu d’afficher une valeur par défaut
  obsolète d’un fournisseur supprimé.
- `models status` peut afficher `marker(<value>)` dans la sortie d’authentification pour les placeholders non secrets (par exemple `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) au lieu de les masquer comme des secrets.

### Analyse des modèles

`models scan` lit le catalogue public `:free` d’OpenRouter et classe les candidats pour
une utilisation comme solution de repli. Le catalogue lui-même est public, donc les analyses limitées aux métadonnées n’ont pas besoin
d’une clé OpenRouter.

Par défaut, OpenClaw tente de sonder la prise en charge des outils et des images avec des appels de modèle en direct.
Si aucune clé OpenRouter n’est configurée, la commande se rabat sur une sortie limitée aux métadonnées
et explique que les modèles `:free` nécessitent toujours `OPENROUTER_API_KEY` pour les
sondes et l’inférence.

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

`--set-default` et `--set-image` nécessitent des sondes en direct ; les résultats d’analyse
limités aux métadonnées sont informatifs et ne sont pas appliqués à la configuration.

### Statut des modèles

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
- `--agent <id>` (identifiant d’agent configuré ; remplace `OPENCLAW_AGENT_DIR`)

`--json` réserve stdout à la charge utile JSON. Les diagnostics de profil d’authentification, de fournisseur
et de démarrage sont dirigés vers stderr afin que les scripts puissent rediriger stdout directement
vers des outils comme `jq`.

Catégories de statut des sondes :

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Cas de détail/code de raison des sondes à prévoir :

- `excluded_by_auth_order` : un profil stocké existe, mais `auth.order.<provider>` explicite
  l’a omis ; la sonde signale donc l’exclusion au lieu de
  l’essayer.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref` :
  le profil est présent mais non éligible/résoluble.
- `no_model` : l’authentification fournisseur existe, mais OpenClaw n’a pas pu résoudre de
  candidat de modèle sondable pour ce fournisseur.

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
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` est l’assistant d’authentification interactif. Il peut lancer un flux d’authentification fournisseur
(OAuth/clé d’API) ou vous guider vers un collage manuel de token, selon le
fournisseur choisi.

`models auth list` liste les profils d’authentification enregistrés pour l’agent sélectionné sans
imprimer de token, de clé d’API ni de matériel secret OAuth. Utilisez `--provider <id>` pour
filtrer sur un fournisseur, comme `openai`, et `--json` pour les scripts.

`models auth login` exécute le flux d’authentification d’un Plugin fournisseur (OAuth/clé d’API). Utilisez
`openclaw plugins list` pour voir quels fournisseurs sont installés.
Utilisez `openclaw models auth --agent <id> <subcommand>` pour écrire les résultats d’authentification dans un
stockage d’agent configuré spécifique. Le flag parent `--agent` est respecté par
`add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token` et
`login-github-copilot`.

Pour les modèles OpenAI, `--provider openai` utilise par défaut la connexion au compte ChatGPT/Codex.
Utilisez `--method api-key` uniquement lorsque vous voulez ajouter un profil de clé d’API OpenAI,
généralement comme secours pour les limites d’abonnement Codex. Exécutez `openclaw doctor --fix`
pour migrer l’ancien état d’authentification/profil avec préfixe hérité OpenAI Codex vers `openai`.

Exemples :

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

Notes :

- `login` accepte `--profile-id <id>` pour les fournisseurs qui prennent en charge les profils
  nommés pendant la connexion. Utilisez-le pour garder plusieurs connexions au même
  fournisseur séparées.
- `paste-api-key` accepte les clés d’API générées ailleurs, demande la valeur de la clé
  et l’écrit dans l’identifiant de profil par défaut `<provider>:manual`, sauf si vous
  passez `--profile-id`. En automatisation, redirigez la clé sur stdin, par exemple
  `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` et `paste-token` restent des commandes de token génériques pour les fournisseurs
  qui exposent des méthodes d’authentification par token.
- `setup-token` nécessite un TTY interactif et exécute la méthode d’authentification par token du fournisseur
  (par défaut la méthode `setup-token` de ce fournisseur lorsqu’il en expose
  une).
- `paste-token` accepte une chaîne de token générée ailleurs ou issue d’une automatisation.
- `paste-token` nécessite `--provider`, demande la valeur du token par défaut
  et l’écrit dans l’identifiant de profil par défaut `<provider>:manual`, sauf si vous passez
  `--profile-id`.
- En automatisation, redirigez le token sur stdin au lieu de le passer comme argument afin que
  les identifiants fournisseur n’apparaissent pas dans l’historique du shell ni dans les listes de processus.
- `paste-token --expires-in <duration>` stocke une expiration absolue du token à partir d’une
  durée relative comme `365d` ou `12h`.
- Pour `openai`, les clés d’API OpenAI et le matériel de token ChatGPT/OAuth sont
  des formes d’authentification différentes. Utilisez `paste-api-key` pour les clés d’API OpenAI `sk-...` et
  `paste-token` uniquement pour le matériel d’authentification par token.
- Note Anthropic : le personnel d’Anthropic nous a indiqué que l’utilisation de type OpenClaw de Claude CLI est à nouveau autorisée ; OpenClaw traite donc la réutilisation de Claude CLI et l’utilisation de `claude -p` comme approuvées pour cette intégration, sauf si Anthropic publie une nouvelle politique.
- Anthropic `setup-token` / `paste-token` restent disponibles comme chemin de token OpenClaw pris en charge, mais OpenClaw privilégie désormais la réutilisation de Claude CLI et `claude -p` lorsque disponibles.

## Connexe

- [Référence CLI](/fr/cli)
- [Sélection de modèle](/fr/concepts/model-providers)
- [Basculement de modèle](/fr/concepts/model-failover)
