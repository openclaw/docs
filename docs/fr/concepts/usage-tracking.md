---
read_when:
    - Vous connectez les interfaces d’utilisation et de quota du fournisseur
    - Vous devez expliquer le comportement du suivi de l’utilisation ou les exigences d’authentification.
summary: Surfaces de suivi de l’utilisation et exigences relatives aux identifiants de connexion
title: Suivi de l’utilisation
x-i18n:
    generated_at: "2026-07-12T02:49:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c413dcbe838d94c57ba3f6ef9609331e139de6d0abbdb3860753a519bd490314
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Présentation

- Récupère l’utilisation et les quotas directement depuis le point de terminaison d’utilisation de chaque fournisseur. Aucune estimation de facturation du fournisseur : uniquement les noms de forfaits, fenêtres de quota, soldes, dépenses, budgets, historique des coûts quotidiens, attribution aux jetons/modèles ou résumés de l’état du compte communiqués par le fournisseur.
- La sortie lisible des fenêtres de quota est normalisée sous la forme `X% restant`, même lorsqu’un fournisseur indique le quota consommé, le quota restant ou uniquement des valeurs brutes. Les fournisseurs sans fenêtres de quota réinitialisables affichent à la place un texte récapitulatif du fournisseur, par exemple un solde.
- La commande `/status` au niveau de la session et l’outil `session_status` se rabattent sur le journal de transcription de la session lorsque l’instantané de session en direct ne contient pas les données de jetons ou de modèle. Ce mécanisme complète les compteurs de jetons et de cache manquants, peut retrouver le libellé du modèle d’exécution actif et privilégie le total orienté invite le plus élevé lorsque les métadonnées de session sont absentes ou indiquent une valeur inférieure (`totalTokensFresh !== true`, zéro ou une valeur inférieure à celle dérivée de la transcription). Les valeurs en direct non nulles prévalent toujours sur les valeurs de repli.

## Emplacements d’affichage

- `/status` dans les conversations : carte d’état indiquant les jetons de la session et le coût estimé (uniquement pour les modèles utilisant une clé d’API). L’utilisation du fournisseur s’affiche pour le **fournisseur du modèle actuel** lorsqu’elle est disponible, sous la forme d’une fenêtre normalisée `X% restant` ou d’un texte récapitulatif du fournisseur.
- `/usage off|tokens|full` dans les conversations : pied de page d’utilisation pour chaque réponse.
- `/usage cost` dans les conversations : récapitulatif local des coûts, agrégé à partir des journaux de session OpenClaw.
- CLI : `openclaw status --usage` affiche une ventilation complète de l’utilisation et des quotas par fournisseur.
- CLI : `openclaw models status` répertorie les profils d’authentification OAuth/par jeton et affiche un récapitulatif des fenêtres d’utilisation à côté de chaque fournisseur qui en possède un.
- Interface de contrôle : **Utilisation** affiche les cartes de forfait et de facturation du fournisseur au-dessus de l’analyse des jetons et des coûts estimés dérivée des sessions OpenClaw. Les identifiants de l’API d’administration Anthropic et OpenAI ajoutent les dépenses du jour, des 7 derniers jours et des 30 derniers jours communiquées par le fournisseur, ainsi que les tendances quotidiennes, les totaux de jetons, les principaux modèles et les catégories de coûts.
- Interface de contrôle : la fenêtre contextuelle de l’anneau de contexte du champ de rédaction affiche l’**utilisation du forfait** pour les fournisseurs par abonnement — barres par fenêtre (5 heures, hebdomadaire, propre au modèle) avec les heures de réinitialisation, le forfait du fournisseur lorsqu’il est connu (par exemple `Max (20x)`) et les crédits d’utilisation supplémentaire. Les sessions facturées dans le cadre d’un forfait masquent les estimations monétaires par jeton ; les sessions facturées via l’API conservent `Coût estimé` et la ventilation des coûts par type. Les configurations de la CLI Claude Code (`claude-cli`) réutilisent la même utilisation d’abonnement Anthropic.
- Barre de menus macOS : une section racine « Utilisation » apparaît sous Contexte lorsque des instantanés d’utilisation des fournisseurs sont disponibles. Consultez [Barre de menus](/fr/platforms/mac/menu-bar).

`openclaw channels list` n’affiche plus l’utilisation des fournisseurs ; la commande oriente désormais les utilisateurs vers `openclaw status` ou `openclaw models list`.

## Historique des coûts Anthropic et OpenAI

Les quotas d’abonnement et la facturation d’API correspondent à des interfaces distinctes du fournisseur :

- Les identifiants d’abonnement ou de configuration Anthropic continuent d’afficher les fenêtres de quota Claude et les budgets facultatifs d’utilisation supplémentaire. Définissez `ANTHROPIC_ADMIN_KEY` ou `ANTHROPIC_ADMIN_API_KEY` pour afficher à la place l’historique des API Usage et Cost de l’organisation. Un identifiant de fournisseur Anthropic commençant par `sk-ant-admin` est détecté automatiquement.
- OAuth OpenAI ChatGPT/Codex continue d’afficher le forfait, les fenêtres de quota et le solde de crédits. Définissez `OPENAI_ADMIN_KEY` pour afficher à la place l’historique des coûts et de l’utilisation des complétions de l’organisation ; vous pouvez également définir `OPENAI_PROJECT_ID` pour limiter les données à un seul projet. OpenClaw n’envoie jamais aux API d’organisation les identifiants d’inférence provenant de `OPENAI_API_KEY`, de la configuration du fournisseur ou des profils d’authentification, car ces clés peuvent appartenir à des points de terminaison personnalisés.

Les identifiants d’administration sont prioritaires, car ils fournissent la facturation réelle de l’organisation. OpenClaw ne combine pas ces totaux communiqués par le fournisseur avec ses estimations locales de session ; les deux sections répondent volontairement à des questions différentes.

## Mode par défaut du pied de page d’utilisation

`/usage off|tokens|full` définit le pied de page d’une session et ce choix est mémorisé pour cette
session. `messages.responseUsage` initialise ce mode pour les sessions qui n’en ont pas
choisi, afin que le pied de page puisse être activé par défaut sans saisir `/usage` à chaque fois.

Définissez un mode pour tous les canaux ou une table par canal avec `default` comme valeur de repli :

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // ou : { "default": "off", "discord": "full" }
  },
}
```

Valeurs acceptées : `"off"`, `"tokens"`, `"full"` et l’ancien alias `"on"` (traité comme `"tokens"`).

### Trois états de session distincts

Le champ `responseUsage` d’une session peut représenter trois états, chacun ayant
une sémantique différente :

| État                         | Valeur stockée                   | Mode effectif                                                                        |
| ---------------------------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| **Non défini / hérité**      | `undefined` (absente)            | Utilise la valeur par défaut de `messages.responseUsage`, puis `off`.                 |
| **Désactivation explicite**  | `"off"` (stockée)                | Toujours désactivé ; une valeur par défaut active ne peut pas réactiver le pied de page. |
| **Activation explicite**     | `"tokens"` ou `"full"` (stockée) | Ce mode, quelle que soit la valeur par défaut de la configuration.                    |

### Priorité

Mode effectif = remplacement de session → entrée de configuration du canal → `default` → `off`.

Une commande explicite `/usage off` est **conservée** sous la valeur littérale `"off"` dans la
session ; elle ne correspond pas à un état « non défini ». Une valeur par défaut active de
`messages.responseUsage` ne peut pas réactiver le pied de page après sa désactivation explicite par l’utilisateur.

### Réinitialisation ou désactivation

- `/usage off` force la désactivation du pied de page et conserve ce choix. Une valeur par défaut
  active configurée ne peut pas le remplacer.
- `/usage reset` (alias : `default`, `inherit`, `inherited`, `clear`, `unpin`) efface le remplacement de session.
  La session **hérite** alors de la valeur par défaut effective de la configuration
  (`messages.responseUsage`). Si aucune valeur par défaut n’est configurée, le pied de page reste désactivé.
- Une réinitialisation complète de la session (`/reset` ou `/new`) ou un renouvellement de session **conserve**
  la préférence explicite du mode d’utilisation, afin que le choix d’affichage de l’utilisateur persiste
  après les renouvellements de session. Seule la commande `/usage reset` (et ses alias) efface le remplacement.

### Comportement du basculement

`/usage` sans argument parcourt les modes : désactivé → jetons → complet → désactivé. Le point de départ
du cycle est le mode actuel **effectif** (le remplacement de session utilisant
la valeur par défaut de la configuration lorsqu’il n’est pas défini), afin que le cycle corresponde toujours à ce que
l’utilisateur voit actuellement dans le pied de page.

### Configuration

Sans configuration, le comportement précédent est conservé : le pied de page reste désactivé jusqu’à l’utilisation de `/usage`. Utilisez
`/usage reset` pour effacer un remplacement de session et hériter de nouveau de la valeur par défaut configurée.

## Pied de page personnalisé pour `/usage full`

`/usage tokens` affiche toujours une simple ligne `Utilisation : X en entrée / Y en sortie` (avec les suffixes relatifs au cache et
au coût estimé lorsqu’ils sont disponibles). Seule la commande `/usage full` affiche le pied de page plus riche
décrit ci-dessous.

`/usage full` affiche un pied de page compact intégré avec le modèle, le raisonnement, le mode rapide/lent,
la fenêtre de contexte et le coût lorsque ces champs sont disponibles. Aucun fichier de modèle
n’est requis pour le pied de page intégré.

`messages.usageTemplate` est réservé aux mises en page personnalisées avancées. Sa valeur est un
chemin de fichier JSON (prenant en charge `~`) ou un objet en ligne ; lorsqu’elle est valide, elle remplace le pied de page
intégré. Un chemin de fichier est surveillé et rechargé à chaud lors des modifications.

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Les modèles absents ou vides utilisent silencieusement le pied de page intégré. Les modèles configurés
illisibles ou non valides (JSON incorrect ou structure ne contenant aucun élément affichable)
utilisent également le pied de page intégré et émettent un avertissement à l’intention de l’opérateur.

Pour créer des modèles personnalisés, partez de la structure intégrée, puis modifiez les parties que vous souhaitez
changer :

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": {
    "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿",
    "block": "░▏▎▍▌▋▊▉█",
    "shade": "░▒▓█",
    "moon": "🌑🌘🌗🌖🌕",
    "level": "▁▂▃▄▅▆▇█",
    "weather": ["🥶", "☁️", "🌥", "⛅️", "🌤", "☀️"],
    "plants": ["🪾", "🍂", "🌱", "☘️", "🍀", "🌿"],
    "moons6": ["🌑", "🌚", "🌘", "🌗", "🌖", "🌝"],
  },
  "aliases": {
    "models": {
      "claude-opus-4-6": "opus46",
      "claude-opus-4-8": "opus48",
      "claude-sonnet-4-6": "sonnet46",
      "claude-haiku-4-5": "haiku45",
      "gpt-5.5": "gpt5.5",
    },
    "reasoning": {
      "off": "🌑",
      "minimal": "🌚",
      "low": "🌘",
      "medium": "🌗",
      "high": "🌕",
      "xhigh": "🌝",
    },
  },
  "output": {
    "sep": "",
    "default": [
      { "text": "{model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": "🔄" } },
      { "map": "model.is_override", "cases": { "true": "📌" } },
      { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### Structure

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // chaîne (1 glyphe/caractère) ou tableau
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // concatène les éléments conservés
    "default": [/* éléments */], // valeur de repli pour toute surface
    "surfaces": {
      "discord": [/* éléments */],
      "telegram": [/* éléments */],
    },
  },
}
```

Chaque surface est une liste ordonnée d’**éléments** ; le moteur affiche chacun d’eux, supprime
ceux qui sont vides et concatène les éléments restants avec `sep`. Une surface sans entrée utilise
`output.default`.

### Chemins du contrat

Un élément lit les valeurs du contrat de chaque tour au moyen d’un chemin à points. Les valeurs absentes sont
vides, afin qu’une condition `when` ou une valeur `|fallback` garde l’élément propre.

| Chemin                                                                              | Signification                                                                                              |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `surface`                                                                           | identifiant du canal (`discord`/`telegram`/etc.)                                                           |
| `agentId` / `chat_type`                                                             | identifiant de l’agent propriétaire / type de surface de discussion                                       |
| `model.id` / `model.display_name` / `model.provider`                                | identifiant du modèle / nom d’affichage / identifiant du fournisseur                                      |
| `model.actual`, `model.resolved_ref`                                                | référence fournisseur/modèle réellement utilisée pour le tour                                             |
| `model.requested`                                                                   | référence fournisseur/modèle demandée (avant le repli)                                                    |
| `model.reasoning`                                                                   | effort (de `off` à `xhigh`)                                                                                |
| `model.is_fallback` / `model.is_override`                                           | booléen : repli utilisé / modèle épinglé                                                                   |
| `model.override_source` / `model.auth_mode`                                         | libellé de la source de remplacement / mode d’identification (`oauth`, `api-key`, `token`, `mixed`, `aws-sdk`, `unknown`) |
| `state.fast_mode`                                                                   | booléen : rapide ou lent                                                                                   |
| `state.compactions`                                                                 | nombre de Compactions pour la session                                                                      |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | budget de la fenêtre / jetons occupés / pourcentage utilisé de 0 à 100                                    |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | agrégat du tour                                                                                            |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | jetons lus et écrits dans le cache pour le tour                                                            |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | conditions d’affichage des jetons                                                                          |
| `usage.cache_hit_pct`                                                               | part des lectures du cache dans le total des jetons du prompt                                              |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | dernier appel au modèle uniquement (comprend aussi `cache_read_tokens`, `cache_write_tokens`, `total_tokens`) |
| `cost.turn_usd` / `cost.available`                                                  | coût estimé du tour / indique si une grille tarifaire a été trouvée                                        |
| `timing.duration_ms`                                                                | durée réelle du tour                                                                                        |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | nom d’identité de l’agent / émoji / avatar                                                                 |
| `session.id`                                                                        | identifiant de session                                                                                      |

(Les fenêtres de limitation de débit du fournisseur ne font **pas** partie de ce contrat ; aucun chemin ne contient actuellement de tableau, donc un élément `each` n’a rien à parcourir.)

### Verbes

Appliquez les verbes à une valeur de gauche à droite dans le pipeline ; un segment qui n’est pas un verbe constitue la valeur de repli.

| Verbe           | Effet                                       | Exemple                           |
| --------------- | ------------------------------------------- | --------------------------------- |
| `num`           | nombre compact                              | `272000 -> 272k`                  |
| `fixed:N`       | N décimales (2 par défaut)                  | `0.0377`                          |
| `dur`           | conversion des secondes en durée            | `14820 -> 4h07m`                  |
| `pct`           | ajout de `%`                                | `96 -> 96%`                       |
| `inv`           | `100 - x`                                   | pour passer de l’utilisé au restant |
| `alias:TABLE`   | recherche dans `aliases`, valeur inchangée si absente | `medium -> 🌗`          |
| `meter:W:SCALE` | barre de glyphes de W cellules pour une valeur de 0 à 100 | `[⣿⣿⠐⠐⠐]` (`meter:1` = un glyphe) |

### Formes des éléments

- `{ "text": "📚 {context.max_tokens|num}" }` : texte littéral + interpolation.
- `{ "when": "<path>", "text": "..." }` : affichage uniquement si le chemin est vrai.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }` : conversion d’une valeur en glyphe (un cas `_default` couvre les valeurs sans correspondance).
- `{ "each": "<array-path>", "item": "{label}" }` : parcours d’un chemin contenant un tableau (aucun chemin du contrat actuel n’est un tableau).

### Exemple

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿" },
  "aliases": { "reasoning": { "medium": "🌗", "high": "🌕" } },
  "output": {
    "surfaces": {
      "discord": [
        { "text": "{model.display_name}" },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
      ],
    },
  },
}
```

produit par exemple `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## Fournisseurs et identifiants

L’utilisation est masquée lorsqu’aucun identifiant d’utilisation exploitable ne peut être trouvé pour le fournisseur. OpenClaw
détecte automatiquement les Plugins de fournisseur activés qui déclarent
`contracts.usageProviders` et implémentent à la fois `resolveUsageAuth` et
`fetchUsageSnapshot` ; le cœur ne possède aucune liste d’autorisation distincte pour les fournisseurs. Le contrat
statique limite la portée de la détection sans importer chaque Plugin de fournisseur. Chaque
Plugin gère son point de terminaison en amont et la mise en correspondance de sa réponse. L’instantané
partagé conserve une représentation indépendante du fournisseur pour les noms des offres, les fenêtres de quota, les soldes, les dépenses et les budgets,
à destination des consommateurs de la CLI, de l’application et de l’interface de contrôle.

- **Anthropic (Claude)** : jetons OAuth dans les profils d’identification. Si le jeton OAuth ne dispose pas de la
  portée `user:profile`, repli sur une session web `claude.ai` (`CLAUDE_AI_SESSION_KEY`,
  `CLAUDE_WEB_SESSION_KEY` ou un cookie `sessionKey=` dans `CLAUDE_WEB_COOKIE`) lorsqu’elle est définie.
  Les limites propres aux modèles ainsi que les dépenses et budgets mensuels d’utilisation supplémentaire activée sont inclus
  lorsqu’Anthropic les communique. Une clé explicite de l’API d’administration Anthropic, ou un
  profil de fournisseur `sk-ant-admin...` détecté automatiquement, affiche à la place le coût de
  l’organisation sur 30 jours et l’historique de l’API Messages.
- **ClawRouter** : clé API (`CLAWROUTER_API_KEY`). Affiche une fenêtre budgétaire mensuelle
  et un budget typé en USD lorsqu’ils sont configurés ; sinon, affiche les dépenses cumulées et un
  récapitulatif des requêtes, jetons et coûts.
- **DeepSeek** : clé API via l’environnement, la configuration ou le magasin d’identifiants (`DEEPSEEK_API_KEY`).
  Affiche le solde de chaque devise communiqué par le fournisseur.
- **GitHub Copilot** : jetons OAuth dans les profils d’identification.
- **Gemini CLI** : jetons OAuth dans les profils d’identification.
- **MiniMax** : clé API ou profil d’identification OAuth MiniMax. OpenClaw considère
  `minimax`, `minimax-cn` et `minimax-portal` comme une même surface de quota MiniMax,
  privilégie les identifiants OAuth MiniMax enregistrés lorsqu’ils sont présents, puis se replie
  sur `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` ou `MINIMAX_API_KEY`.
  L’interrogation de l’utilisation déduit l’hôte de l’offre Coding Plan à partir de `models.providers.minimax-portal.baseUrl`
  ou de `models.providers.minimax.baseUrl` lorsqu’il est configuré ; sinon, elle utilise
  l’hôte MiniMax CN.
  Les champs bruts `usage_percent` / `usagePercent` de MiniMax représentent le quota **restant** ;
  OpenClaw les inverse donc avant l’affichage. Les champs basés sur un nombre sont prioritaires lorsqu’ils
  sont présents.
  - Les libellés des fenêtres proviennent des champs d’heures ou de minutes du fournisseur lorsqu’ils sont présents, puis
    se replient sur l’intervalle `start_time` / `end_time`.
  - Si le point de terminaison de l’offre de codage renvoie `model_remains`, OpenClaw privilégie
    l’entrée du modèle de discussion, déduit le libellé de la fenêtre à partir des horodatages lorsque les champs explicites
    `window_hours` / `window_minutes` sont absents et inclut le nom du modèle
    dans le libellé de l’offre.
- **OpenAI (offre Codex/ChatGPT)** : jetons OAuth dans les profils d’identification (en-tête `ChatGPT-Account-Id`
  envoyé lorsqu’un identifiant de compte est présent). Affiche l’offre ChatGPT, les fenêtres Codex
  réinitialisables et un solde de crédits lorsqu’il est communiqué. Les crédits restent des crédits du fournisseur ;
  OpenClaw ne les présente pas comme des dollars. `OPENAI_ADMIN_KEY` ajoute
  le coût de l’organisation sur 30 jours et l’historique d’utilisation des complétions lorsque la clé dispose d’un accès au
  tableau de bord d’utilisation. Les identifiants d’inférence ne sont jamais transmis aux API de l’organisation.
- **OpenRouter** : clé API ou clé API adossée à OAuth (`OPENROUTER_API_KEY` ou un profil
  d’identification). Combine le point de terminaison des crédits du compte avec celui du quota de la clé,
  afin d’afficher le solde et les dépenses du compte, le budget de la clé et l’utilisation quotidienne, hebdomadaire ou mensuelle
  lorsque les identifiants permettent d’y accéder. Chaque point de terminaison peut enrichir l’instantané
  indépendamment.
- **Venice** : clé API via l’environnement, la configuration ou le magasin d’identifiants (`VENICE_API_KEY`). Affiche les soldes en USD et
  en DIEM, ainsi que l’utilisation de l’allocation DIEM pour l’époque lorsqu’elle est communiquée.
- **Xiaomi MiMo** : deux surfaces d’utilisation distinctes. Le paiement à l’usage emploie une clé API
  (`XIAOMI_API_KEY`) ; l’offre Token Plan utilise une clé distincte (`XIAOMI_TOKEN_PLAN_API_KEY`).
  Aucune ne communique actuellement de fenêtres de quota.
- **z.ai** : clé API via l’environnement, la configuration ou le magasin d’identifiants (`ZAI_API_KEY` ou `Z_AI_API_KEY`).

## Liens associés

- [Utilisation et coûts des jetons](/fr/reference/token-use)
- [Utilisation et coûts de l’API](/fr/reference/api-usage-costs)
- [Mise en cache des prompts](/fr/reference/prompt-caching)
- [Barre des menus](/fr/platforms/mac/menu-bar)
