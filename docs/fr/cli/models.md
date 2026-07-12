---
read_when:
    - Vous souhaitez modifier les modèles par défaut ou consulter l’état d’authentification du fournisseur
    - Vous souhaitez analyser les modèles/fournisseurs disponibles et déboguer les profils d’authentification
summary: Référence de la CLI pour `openclaw models` (état/liste/définition/analyse, alias, solutions de repli, authentification)
title: Modèles
x-i18n:
    generated_at: "2026-07-12T15:15:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 330598225664ff961ab41bf6358226ad64eb43e941be7f422cfde0fe9d93cea8
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Découverte, analyse et configuration des modèles (modèle par défaut, modèles de secours, profils d’authentification).

Voir aussi :

- Fournisseurs et modèles : [Modèles](/fr/providers/models)
- Concepts de sélection de modèle et commande slash `/models` : [Concept des modèles](/fr/concepts/models)
- Configuration de l’authentification des fournisseurs : [Bien démarrer](/fr/start/getting-started)

## Commandes courantes

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
openclaw models scan
```

Les sous-commandes `status` et `auth` acceptent `--agent <id>` pour cibler un agent configuré ; `list`, `scan`, `aliases` et `fallbacks`/`image-fallbacks` utilisent toujours l’agent par défaut configuré, tandis que `set`/`set-image` refusent systématiquement `--agent`. Lorsque l’option est omise, les commandes prenant en charge `--agent` utilisent `OPENCLAW_AGENT_DIR` si cette variable est définie, sinon l’agent par défaut configuré.

### État

`openclaw models status` affiche le modèle par défaut résolu, les modèles de secours ainsi qu’une vue d’ensemble de l’authentification. Lorsque des instantanés d’utilisation des fournisseurs sont disponibles, la section sur l’état OAuth/des clés API inclut les fenêtres d’utilisation et les instantanés de quotas des fournisseurs. Fournisseurs actuels disposant de fenêtres d’utilisation : Anthropic, GitHub Copilot, Gemini CLI, OpenAI, MiniMax, Xiaomi et z.ai. Les données d’authentification liées à l’utilisation proviennent des hooks propres aux fournisseurs lorsqu’ils sont disponibles ; sinon, OpenClaw se rabat sur les identifiants OAuth/clés API correspondants provenant des profils d’authentification, de l’environnement ou de la configuration.

Dans la sortie `--json`, `auth.providers` est la vue d’ensemble des fournisseurs tenant compte de l’environnement, de la configuration et du magasin, tandis que `auth.oauth` concerne uniquement l’état des profils dans le magasin d’authentification.

Options :

| Indicateur                | Effet                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `--json`                  | Sortie JSON ; les diagnostics des profils d’authentification, des fournisseurs et du démarrage sont envoyés à stderr afin que stdout puisse être transmis à `jq`. |
| `--plain`                 | Sortie en texte brut.                                                                                                          |
| `--check`                 | Quitte avec un code différent de zéro si l’authentification expire bientôt ou a expiré : `1` = expirée/manquante, `2` = expiration prochaine. |
| `--probe`                 | Test en direct des profils d’authentification configurés. Requêtes réelles ; peut consommer des tokens et déclencher des limites de débit. |
| `--probe-provider <name>` | Teste uniquement un fournisseur.                                                                                               |
| `--probe-profile <id>`    | Teste des identifiants de profils d’authentification précis (option répétable ou valeurs séparées par des virgules).            |
| `--probe-timeout <ms>`    | Délai d’expiration par test.                                                                                                   |
| `--probe-concurrency <n>` | Tests simultanés.                                                                                                              |
| `--probe-max-tokens <n>`  | Nombre maximal de tokens du test (dans la mesure du possible).                                                                 |
| `--agent <id>`            | Identifiant de l’agent configuré ; remplace `OPENCLAW_AGENT_DIR`.                                                               |

Les lignes de test peuvent provenir de profils d’authentification, d’identifiants définis dans l’environnement ou de `models.json`. Catégories d’état des tests : `ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`.

Codes de détail/motif à prévoir lorsqu’un test n’atteint jamais un appel de modèle :

- `excluded_by_auth_order` : un profil enregistré existe, mais la valeur explicite `auth.order.<provider>` l’a omis ; le test signale donc l’exclusion au lieu de tenter de l’utiliser.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref` : le profil est présent, mais il n’est pas éligible ou ne peut pas être résolu.
- `ineligible_profile` : le profil est incompatible avec la configuration du fournisseur pour une autre raison.
- `no_model` : une authentification du fournisseur existe, mais OpenClaw n’a pas pu résoudre de modèle candidat pouvant être testé pour ce fournisseur.

Pour résoudre les problèmes liés à l’OAuth OpenAI ChatGPT/Codex, `openclaw models status`, `openclaw models auth list --provider openai` et `openclaw config get agents.defaults.model --json` constituent le moyen le plus rapide de vérifier si un agent dispose d’un profil OAuth `openai` utilisable pour `openai/*` via l’environnement d’exécution Codex natif. Consultez [Configuration du fournisseur OpenAI](/fr/providers/openai#check-and-recover-codex-oauth-routing).

### Liste

`openclaw models list` est en lecture seule : la commande lit la configuration, les profils d’authentification, l’état existant du catalogue et les lignes de catalogue détenues par les fournisseurs, mais ne réécrit jamais `models.json`.

Options : `--all` (catalogue complet), `--local` (filtrer les modèles locaux), `--provider <id>`, `--json`, `--plain`.

Remarques :

- La colonne `Auth` est en lecture seule. Pour les routes de modèles détenues par un fournisseur, comme celles d’OpenAI, elle associe la route API/URL de base de chaque ligne aux profils éligibles dans l’ordre `auth.order` effectif, aux identifiants de l’environnement ou de la configuration et aux SecretRefs résolues pour la portée de la commande. Une ligne OpenAI concrète conserve un état inconnu lorsque sa politique de routage n’est pas disponible, au lieu d’emprunter l’authentification au niveau du fournisseur ; les anciennes vérifications au niveau du fournisseur uniquement et les autres fournisseurs conservent le comportement au niveau du fournisseur. Les métadonnées d’authentification synthétique d’un Plugin indiquent uniquement une capacité d’exécution et ne prouvent pas l’authentification native d’un compte ; les routes dépendant d’un compte restent donc inconnues sans preuve positive du registre. La commande ne charge pas l’environnement d’exécution du fournisseur, ne lit pas les secrets du trousseau, n’appelle pas les API du fournisseur et ne prouve pas que l’exécution exacte est prête.
- `models list --all --provider <id>` peut inclure des lignes de catalogue statiques détenues par un fournisseur provenant des manifestes de Plugins ou des métadonnées de catalogue de fournisseurs intégrées, même si vous ne vous êtes pas encore authentifié auprès de ce fournisseur. Ces lignes restent indiquées comme indisponibles jusqu’à la configuration d’une authentification correspondante.
- `models list` maintient le plan de contrôle réactif lorsque la découverte du catalogue des fournisseurs est lente. Après une courte attente, les vues par défaut et configurées se rabattent sur les lignes de modèles configurées ou synthétiques et laissent la découverte se terminer en arrière-plan. Utilisez `--all` si vous avez besoin du catalogue découvert complet exact et acceptez d’attendre la découverte des fournisseurs.
- La commande générale `models list --all` fusionne les lignes de catalogue des manifestes par-dessus celles du registre sans charger les hooks complémentaires d’exécution des fournisseurs. Les chemins rapides de manifeste filtrés par fournisseur utilisent uniquement les fournisseurs marqués `static` ; ceux marqués `refreshable` continuent de s’appuyer sur le registre/cache et ajoutent les lignes de manifeste comme compléments, tandis que ceux marqués `runtime` continuent d’utiliser la découverte par registre/environnement d’exécution.
- `models list` distingue les métadonnées natives du modèle des limites de l’environnement d’exécution. Dans la sortie tabulaire, `Ctx` affiche `contextTokens/contextWindow` lorsqu’une limite d’exécution effective diffère de la fenêtre de contexte native ; les lignes JSON incluent `contextTokens` lorsqu’un fournisseur expose cette limite.
- Pour les routes détenues par un fournisseur, `models list` projette une ligne logique fournisseur/modèle sur la route sélectionnée. `Input` et `Ctx` proviennent uniquement d’une ligne de catalogue correspondant exactement à la route physique, les remplacements logiques configurés explicitement étant appliqués en dernier ; si la sélection de route n’est pas résolue, les champs de capacité sont indiqués comme inconnus au lieu d’emprunter les métadonnées d’une route sœur.
- `models list --provider <id>` filtre par identifiant de fournisseur, comme `moonshot` ou `openai`. Il n’accepte pas les libellés d’affichage des sélecteurs interactifs de fournisseurs, comme `Moonshot AI`.
- Les références de modèle sont analysées en les divisant au **premier** `/`. Si l’identifiant du modèle contient `/` (à la manière d’OpenRouter), incluez le préfixe du fournisseur (exemple : `openrouter/moonshotai/kimi-k2`).
- Si vous omettez le fournisseur, OpenClaw résout d’abord l’entrée comme un alias, puis comme une correspondance unique parmi les fournisseurs configurés pour cet identifiant de modèle exact, et se rabat seulement ensuite sur le fournisseur par défaut configuré avec un avertissement d’obsolescence. Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw se rabat sur le premier fournisseur/modèle configuré au lieu de présenter un modèle par défaut obsolète provenant d’un fournisseur supprimé.
- `models status` peut afficher `marker(<value>)` dans la sortie d’authentification pour les espaces réservés non secrets (par exemple `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) au lieu de les masquer comme des secrets.

### Définir le modèle par défaut / d’image

```bash
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
```

`set` écrit dans `agents.defaults.model.primary` ; `set-image` écrit dans `agents.defaults.imageModel.primary`. Les deux acceptent `provider/model` ou un alias configuré. `set` répare également les installations des Plugins d’exécution Codex/Copilot lorsque le nouveau modèle sélectionné en nécessite un ; `set-image` ne le fait pas. Aucune de ces commandes n’accepte `--agent` ; elles écrivent toujours dans les valeurs par défaut des agents.

### Analyse

`models scan` lit le catalogue public `:free` d’OpenRouter et classe les candidats en vue de leur utilisation comme modèles de secours. Le catalogue lui-même étant public, les analyses limitées aux métadonnées ne nécessitent pas de clé OpenRouter.

Par défaut, OpenClaw tente de tester la prise en charge des outils et des images à l’aide d’appels de modèles en direct. Si aucune clé OpenRouter n’est configurée, la commande se rabat sur une sortie limitée aux métadonnées et explique que les modèles `:free` nécessitent tout de même `OPENROUTER_API_KEY` pour les tests et l’inférence.

Options :

- `--no-probe` (métadonnées uniquement ; aucune recherche dans la configuration ni les secrets)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (délai d’expiration de la requête de catalogue et de chaque test)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` et `--set-image` nécessitent des tests en direct ; les résultats d’analyse limités aux métadonnées sont informatifs et ne sont pas appliqués à la configuration.

## Alias

```bash
openclaw models aliases list [--json] [--plain]
openclaw models aliases add <alias> <model-or-alias>
openclaw models aliases remove <alias>
```

Les alias sont enregistrés par entrée de modèle sous `agents.defaults.models.<key>.alias`. `add` résout d’abord `<model-or-alias>` en clé canonique fournisseur/modèle ; ainsi, créer un alias à partir d’un alias le repointe au lieu de former une chaîne.

## Modèles de secours

```bash
openclaw models fallbacks list [--json] [--plain]
openclaw models fallbacks add <model-or-alias>
openclaw models fallbacks remove <model-or-alias>
openclaw models fallbacks clear
```

Gère `agents.defaults.model.fallbacks`. `openclaw models image-fallbacks list|add|remove|clear` gère la liste parallèle `agents.defaults.imageModel.fallbacks` avec les mêmes sous-commandes.

## Profils d’authentification

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth login-github-copilot
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token --provider <id>
openclaw models auth order get --provider <id>
openclaw models auth order set --provider <id> <profileIds...>
openclaw models auth order clear --provider <id>
```

`models auth add` est l’assistant interactif d’authentification. Selon le fournisseur choisi, il peut lancer un flux d’authentification du fournisseur (OAuth/clé API) ou vous guider pour coller manuellement un token.

`models auth list` répertorie les profils d’authentification enregistrés pour l’agent sélectionné sans afficher les tokens, les clés API ni les secrets OAuth. Utilisez `--provider <id>` pour filtrer un fournisseur, comme `openai`, et `--json` pour les scripts.

`models auth login` exécute le flux d’authentification d’un Plugin de fournisseur (OAuth/clé API). Utilisez `openclaw plugins list` pour voir quels fournisseurs sont installés. `login` accepte `--profile-id <id>` pour les fournisseurs qui prennent en charge les profils nommés lors de la connexion (utilisez cette option pour séparer plusieurs connexions auprès du même fournisseur), `--method <id>` pour choisir une méthode d’authentification précise, `--device-code` comme raccourci pour `--method device-code`, `--set-default` pour appliquer le modèle par défaut recommandé par le fournisseur et `--force` pour supprimer d’abord les profils existants de ce fournisseur (à utiliser lorsqu’un profil OAuth en cache est bloqué ou si vous souhaitez changer de compte).

`models auth login-github-copilot` est un raccourci pour `models auth login --provider github-copilot --method device` (flux d’appareil GitHub) ; il accepte `--yes` pour remplacer un profil existant sans demander de confirmation.

Utilisez `openclaw models auth --agent <id> <subcommand>` pour écrire les résultats d’authentification dans le magasin d’un agent configuré spécifique. L’option parente `--agent` est prise en compte par `add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token`, `login-github-copilot` et `order get`/`set`/`clear`.

Pour les modèles OpenAI, `--provider openai` utilise par défaut la connexion à un compte ChatGPT/Codex. Utilisez `--method api-key` uniquement lorsque vous souhaitez ajouter un profil de clé API OpenAI, généralement comme solution de secours en cas d’atteinte des limites de l’abonnement Codex. Exécutez `openclaw doctor --fix` pour migrer l’ancien état d’authentification/de profil utilisant le préfixe OpenAI Codex vers `openai`.

Exemples :

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

Remarques :

- `paste-api-key` accepte les clés API générées ailleurs, demande la valeur de la clé et l’écrit dans l’identifiant de profil par défaut `<provider>:manual`, sauf si vous transmettez `--profile-id`. Pour l’automatisation, transmettez la clé via l’entrée standard, par exemple `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` et `paste-token` restent des commandes génériques de jeton pour les fournisseurs qui proposent des méthodes d’authentification par jeton.
- `setup-token` nécessite un TTY interactif et exécute la méthode d’authentification par jeton du fournisseur (en utilisant par défaut la méthode `setup-token` de ce fournisseur lorsqu’il en propose une).
- `paste-token` nécessite `--provider`, demande par défaut la valeur du jeton et l’écrit dans l’identifiant de profil par défaut `<provider>:manual`, sauf si vous transmettez `--profile-id`. Pour l’automatisation, transmettez le jeton via l’entrée standard plutôt que comme argument, afin que les identifiants du fournisseur n’apparaissent ni dans l’historique du shell ni dans les listes de processus.
- `paste-token --expires-in <duration>` enregistre une expiration absolue du jeton à partir d’une durée relative telle que `365d` ou `12h`.
- Pour `openai`, les clés API OpenAI et les données de jeton ChatGPT/OAuth correspondent à des formes d’authentification différentes. Utilisez `paste-api-key` pour les clés API OpenAI `sk-...` et `paste-token` uniquement pour les données d’authentification par jeton.
- Anthropic : `setup-token`/`paste-token` sont des méthodes d’authentification OpenClaw prises en charge pour `anthropic`, mais OpenClaw préfère réutiliser la CLI Claude (`claude -p`) sur l’hôte lorsqu’elle est disponible.
- `auth order get/set/clear` gère une substitution de l’ordre des profils d’authentification par agent pour un fournisseur, stockée dans `auth-state.json` (séparément de la clé de configuration `auth.order.<provider>`). `set` accepte un ou plusieurs identifiants de profil par ordre de priorité ; `clear` rétablit l’ordre défini par la configuration ou la rotation circulaire.

## Liens connexes

- [Référence de la CLI](/fr/cli)
- [Sélection du modèle](/fr/concepts/model-providers)
- [Basculement de modèle](/fr/concepts/model-failover)
