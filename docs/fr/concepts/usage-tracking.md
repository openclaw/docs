---
read_when:
    - Vous configurez les surfaces d’utilisation et de quota du fournisseur
    - Vous devez expliquer le comportement du suivi de l’utilisation ou les exigences d’authentification
summary: Surfaces de suivi de l’utilisation et exigences relatives aux identifiants
title: Suivi de l’utilisation
x-i18n:
    generated_at: "2026-07-01T18:10:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa9b2b0b19ca0b4beeea40bfd50b07a92155178d5ec0e1877013843e0caba4fb
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Ce que c’est

- Récupère l’utilisation et le quota des fournisseurs directement depuis leurs points de terminaison d’utilisation.
- Aucun coût estimé ; uniquement des fenêtres de quota signalées par le fournisseur ou des résumés d’état du compte.
- La sortie d’état de fenêtre de quota lisible par un humain est normalisée en `X% left`, même lorsqu’une API amont signale le quota consommé, le quota restant ou seulement des comptes bruts. Les fournisseurs sans fenêtres de quota réinitialisables peuvent afficher à la place un texte récapitulatif du fournisseur, comme un solde.
- Les commandes `/status` et `session_status` au niveau de la session peuvent se rabattre sur la dernière entrée d’utilisation du transcript lorsque l’instantané de session en direct est lacunaire. Ce repli complète les compteurs de jetons/cache manquants, peut récupérer le libellé du modèle d’exécution actif et préfère le total orienté prompt le plus élevé lorsque les métadonnées de session sont absentes ou plus petites. Les valeurs en direct non nulles existantes restent prioritaires.

## Où cela apparaît

- `/status` dans les discussions : carte d’état riche en emoji avec jetons de session + coût estimé (clé API uniquement). L’utilisation du fournisseur s’affiche pour le **fournisseur du modèle actuel** lorsqu’elle est disponible, sous forme de fenêtre normalisée `X% left` ou de texte récapitulatif du fournisseur.
- `/usage off|tokens|full` dans les discussions : pied de page d’utilisation par réponse.
- `/usage cost` dans les discussions : résumé des coûts locaux agrégé à partir des journaux de session OpenClaw.
- CLI : `openclaw status --usage` imprime une ventilation complète par fournisseur.
- CLI : `openclaw channels list` imprime le même instantané d’utilisation avec la configuration du fournisseur (utilisez `--no-usage` pour l’ignorer).
- Barre de menus macOS : section « Utilisation » sous Contexte (uniquement si disponible).

## Mode par défaut du pied de page d’utilisation

`/usage off|tokens|full` définit le pied de page pour une session et est mémorisé pour cette session. `messages.responseUsage` initialise ce mode pour les sessions qui n’en ont pas choisi, afin que le pied de page puisse être activé par défaut sans saisir `/usage` à chaque fois.

Définissez un mode pour chaque canal, ou une carte par canal avec un repli `default` :

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### Trois états de session distincts

Le champ `responseUsage` d’une session possède trois états représentables, chacun avec une sémantique différente :

| État                       | Valeur stockée                  | Mode effectif                                                               |
| -------------------------- | ------------------------------- | --------------------------------------------------------------------------- |
| **Non défini / hérité**    | `undefined` (absent)            | Passe au défaut de configuration `messages.responseUsage`, puis à `off`.    |
| **Désactivation explicite** | `"off"` (stocké)                | Toujours désactivé — un défaut de configuration différent de `off` ne peut pas réactiver le pied de page. |
| **Activation explicite**   | `"tokens"` ou `"full"` (stocké) | Ce mode, quel que soit le défaut de configuration.                          |

### Priorité

Mode effectif = remplacement de session → entrée de configuration du canal → `default` → `off`.

Un `/usage off` explicite est **persisté** comme valeur littérale `"off"` dans la session, ce qui n’est pas équivalent à « non défini ». Cela signifie qu’un défaut `messages.responseUsage` différent de `off` ne peut pas réactiver le pied de page une fois que l’utilisateur l’a explicitement désactivé.

### Réinitialiser ou désactiver

- `/usage off` — force la désactivation du pied de page et persiste ce choix. Un défaut configuré différent de `off` ne peut pas le remplacer.
- `/usage reset` (alias : `inherit`, `clear`, `default`) — efface le remplacement de session. La session **hérite** alors du défaut de configuration effectif (`messages.responseUsage`). Si aucun défaut n’est configuré, le pied de page est désactivé (inchangé par rapport à avant). Utilisez ceci pour « revenir au défaut » sans activer explicitement le pied de page.
- Une réinitialisation complète de session (`/reset` ou `/new`) ou un rollover de session **préserve** la préférence explicite du mode d’utilisation afin que le choix d’affichage de l’utilisateur survive aux rollovers de session. Seul `/usage reset` (et ses alias) efface réellement le remplacement.

### Comportement du basculement

`/usage` sans argument cycle ainsi : off → tokens → full → off. Le point de départ du cycle est le mode actuel **effectif** (le remplacement de session passant au défaut de configuration lorsqu’il n’est pas défini), de sorte que le cycle reste toujours cohérent avec ce que l’utilisateur voit dans le pied de page.

### Configuration

Sans configuration, le comportement précédent reste valable (pied de page désactivé jusqu’à `/usage`). Utilisez `/usage reset` pour effacer un remplacement de session et hériter à nouveau du défaut configuré.

## Pied de page `/usage full` personnalisé

`/usage full` affiche un pied de page compact intégré avec le modèle, le raisonnement, rapide/lent, la fenêtre de contexte et le coût lorsque ces champs sont disponibles. Les champs de jetons et de cache restent disponibles pour les modèles personnalisés. Aucun fichier de modèle n’est requis.

`messages.usageTemplate` est réservé aux mises en page personnalisées avancées. La valeur est un chemin de fichier JSON (prend en charge `~`) ou un objet inline, et elle remplace le pied de page intégré lorsqu’elle est valide :

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Les modèles manquants ou vides se rabattent silencieusement sur le pied de page intégré. Les modèles configurés illisibles ou invalides se rabattent également sur le pied de page intégré et émettent un avertissement opérateur.

Démarrez les modèles personnalisés à partir de la forme intégrée, puis modifiez les parties que vous voulez changer :

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
        "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
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
          "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### Forme

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [
      /* pieces */
    ], // fallback for any surface
    "surfaces": {
      "discord": [
        /* pieces */
      ],
      "telegram": [
        /* pieces */
      ],
    },
  },
}
```

Chaque surface est une liste ordonnée de **morceaux** ; le moteur rend chacun d’eux, supprime les vides et joint les survivants avec `sep`. Une surface sans entrée utilise `output.default`.

### Chemins de contrat

Un morceau lit les valeurs du contrat par tour via un chemin à points. Les valeurs absentes sont vides (ainsi, une garde `when` ou un `|fallback` garde le morceau propre).

| Chemin                                                                              | Signification                          |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface`                                                                           | id du canal (`discord`/`telegram`/etc.) |
| `model.provider` / `model.display_name`                                             | id du fournisseur / id du modèle       |
| `model.reasoning`                                                                   | effort (`off` à `xhigh`)               |
| `model.is_fallback` / `model.is_override`                                           | booléen : repli utilisé / modèle épinglé |
| `state.fast_mode`                                                                   | booléen : rapide ou lent               |
| `context.max_tokens` / `context.pct_used`                                           | budget de fenêtre / 0-100 utilisé      |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | agrégat du tour                        |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`    | gardes d’affichage des jetons et pourcentage de cache |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | dernier appel de modèle uniquement     |
| `cost.turn_usd`                                                                     | coût estimé du tour                    |
| `identity.name` / `identity.emoji`                                                  | nom de l’agent / emoji choisi          |

(Les fenêtres de limite de débit des fournisseurs ne sont **pas** dans ce contrat.)

### Verbes

Faites passer une valeur dans les verbes de gauche à droite ; un segment qui n’est pas un verbe est le repli.

| Verbe           | Effet                                 | Exemple                           |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | compte compact                        | `272000 -> 272k`                  |
| `fixed:N`       | N décimales (2 par défaut)            | `0.0377`                          |
| `dur`           | secondes en durée                     | `14820 -> 4h07m`                  |
| `pct`           | ajoute `%`                            | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | pour convertir utilisé en restant |
| `alias:TABLE`   | recherche dans `aliases`, renvoie tel quel si absent | `medium -> 🌗`                    |
| `meter:W:SCALE` | barre de glyphes W cellules sur une valeur 0-100 | `[⣿⣿⠐⠐⠐]` (`meter:1` = un glyphe) |

### Formes des morceaux

- `{ "text": "📚 {context.max_tokens|num}" }` : littéral + interpolation.
- `{ "when": "<path>", "text": "..." }` : rendre uniquement si le chemin est truthy.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }` : valeur vers glyphe.
- `{ "each": "limits.windows", "item": "{label}" }` : itérer sur un tableau.

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

rend par exemple `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## Fournisseurs + identifiants d’accès

- **Anthropic (Claude)** : jetons OAuth dans les profils d’authentification.
- **GitHub Copilot** : jetons OAuth dans les profils d’authentification.
- **Gemini CLI** : jetons OAuth dans les profils d’authentification.
  - L’utilisation JSON se rabat sur `stats` ; `stats.cached` est normalisé en
    `cacheRead`.
- **OpenAI Codex** : jetons OAuth dans les profils d’authentification (`accountId` utilisé lorsqu’il est présent).
- **MiniMax** : clé API ou profil d’authentification OAuth MiniMax. OpenClaw traite
  `minimax`, `minimax-cn` et `minimax-portal` comme la même surface de quota MiniMax,
  privilégie l’OAuth MiniMax stocké lorsqu’il est présent, et sinon se rabat sur
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` ou `MINIMAX_API_KEY`.
  L’interrogation de l’utilisation déduit l’hôte Coding Plan à partir de `models.providers.minimax-portal.baseUrl`
  ou `models.providers.minimax.baseUrl` lorsqu’il est configuré, et utilise sinon l’hôte
  MiniMax CN.
  Les champs bruts `usage_percent` / `usagePercent` de MiniMax signifient le quota
  **restant**, donc OpenClaw les inverse avant l’affichage ; les champs basés sur des
  décomptes prévalent lorsqu’ils sont présents.
  - Les libellés de fenêtre du coding-plan proviennent des champs heures/minutes du fournisseur lorsqu’ils
    sont présents, puis se rabattent sur l’intervalle `start_time` / `end_time`.
  - Si le point de terminaison du coding-plan renvoie `model_remains`, OpenClaw privilégie l’entrée
    du modèle de chat, déduit le libellé de fenêtre à partir des horodatages lorsque les champs explicites
    `window_hours` / `window_minutes` sont absents, et inclut le nom du modèle
    dans le libellé du plan.
- **Xiaomi MiMo** : clé API via env/config/magasin d’authentification (`XIAOMI_API_KEY`).
- **z.ai** : clé API via env/config/magasin d’authentification.
- **DeepSeek** : clé API via env/config/magasin d’authentification (`DEEPSEEK_API_KEY`).
  OpenClaw appelle le point de terminaison de solde de DeepSeek et affiche le solde
  rapporté par le fournisseur sous forme de texte au lieu d’une fenêtre de quota en pourcentage restant.

L’utilisation est masquée lorsqu’aucune authentification d’utilisation de fournisseur exploitable ne peut être résolue. Les fournisseurs
peuvent fournir une logique d’authentification d’utilisation propre au Plugin ; sinon OpenClaw se rabat sur les
identifiants OAuth/clé API correspondants provenant des profils d’authentification, des variables d’environnement
ou de la configuration.

## Connexe

- [Utilisation des jetons et coûts](/fr/reference/token-use)
- [Utilisation de l’API et coûts](/fr/reference/api-usage-costs)
- [Mise en cache des prompts](/fr/reference/prompt-caching)
