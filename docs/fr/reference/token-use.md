---
read_when:
    - Expliquer l’utilisation des tokens, les coûts ou les fenêtres de contexte
    - Déboguer la croissance du contexte ou le comportement de Compaction
summary: Comment OpenClaw construit le contexte du prompt et rapporte l’utilisation des tokens et les coûts
title: Utilisation des tokens et coûts
x-i18n:
    generated_at: "2026-04-15T19:42:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a706d3df8b2ea1136b3535d216c6b358e43aee2a31a4759824385e1345e6fe5
    source_path: reference/token-use.md
    workflow: 15
---

# Utilisation des tokens et coûts

OpenClaw suit les **tokens**, pas les caractères. Les tokens dépendent du modèle, mais la plupart
des modèles de style OpenAI font en moyenne ~4 caractères par token pour le texte en anglais.

## Comment le prompt système est construit

OpenClaw assemble son propre prompt système à chaque exécution. Il comprend :

- Liste des outils + courtes descriptions
- Liste des Skills (métadonnées uniquement ; les instructions sont chargées à la demande avec `read`).
  Le bloc compact des Skills est limité par `skills.limits.maxSkillsPromptChars`,
  avec une surcharge facultative par agent dans
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instructions de mise à jour automatique
- Fichiers d’espace de travail + d’amorçage (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quand ils sont nouveaux, ainsi que `MEMORY.md` lorsqu’il est présent ou `memory.md` comme solution de repli en minuscules). Les fichiers volumineux sont tronqués par `agents.defaults.bootstrapMaxChars` (par défaut : 12000), et l’injection totale d’amorçage est plafonnée par `agents.defaults.bootstrapTotalMaxChars` (par défaut : 60000). Les fichiers quotidiens `memory/*.md` ne font pas partie du prompt d’amorçage normal ; ils restent accessibles à la demande via les outils de mémoire lors des tours ordinaires, mais les commandes `/new` et `/reset` sans argument peuvent préfixer un bloc de contexte de démarrage à usage unique avec la mémoire quotidienne récente pour ce premier tour. Ce préambule de démarrage est contrôlé par `agents.defaults.startupContext`.
- Heure (UTC + fuseau horaire de l’utilisateur)
- Balises de réponse + comportement Heartbeat
- Métadonnées d’exécution (hôte/OS/modèle/réflexion)

Consultez la ventilation complète dans [Prompt système](/fr/concepts/system-prompt).

## Ce qui compte dans la fenêtre de contexte

Tout ce que le modèle reçoit compte dans la limite de contexte :

- Prompt système (toutes les sections listées ci-dessus)
- Historique de conversation (messages utilisateur + assistant)
- Appels d’outils et résultats d’outils
- Pièces jointes/transcriptions (images, audio, fichiers)
- Résumés de Compaction et artefacts d’élagage
- Wrappers de fournisseur ou en-têtes de sécurité (non visibles, mais quand même comptabilisés)

Certaines surfaces d’exécution volumineuses ont leurs propres limites explicites :

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Les surcharges par agent se trouvent sous `agents.list[].contextLimits`. Ces paramètres
servent pour les extraits d’exécution limités et les blocs injectés appartenant à l’exécution.
Ils sont distincts des limites d’amorçage, des limites de contexte de démarrage et des limites
du prompt des Skills.

Pour les images, OpenClaw réduit les payloads d’image de transcription/d’outil avant les appels au fournisseur.
Utilisez `agents.defaults.imageMaxDimensionPx` (par défaut : `1200`) pour ajuster cela :

- Des valeurs plus basses réduisent généralement l’utilisation des vision-tokens et la taille des payloads.
- Des valeurs plus élevées préservent davantage de détails visuels pour l’OCR/les captures d’écran riches en UI.

Pour une ventilation pratique (par fichier injecté, outils, Skills et taille du prompt système), utilisez `/context list` ou `/context detail`. Voir [Contexte](/fr/concepts/context).

## Comment voir l’utilisation actuelle des tokens

Utilisez ceci dans le chat :

- `/status` → **carte d’état riche en emoji** avec le modèle de session, l’utilisation du contexte,
  les tokens d’entrée/sortie de la dernière réponse et le **coût estimé** (clé API uniquement).
- `/usage off|tokens|full` → ajoute un **pied de page d’utilisation par réponse** à chaque réponse.
  - Persistant par session (stocké comme `responseUsage`).
  - L’authentification OAuth **masque le coût** (tokens uniquement).
- `/usage cost` → affiche un résumé local des coûts à partir des journaux de session OpenClaw.

Autres surfaces :

- **TUI/Web TUI :** `/status` + `/usage` sont pris en charge.
- **CLI :** `openclaw status --usage` et `openclaw channels list` affichent
  des fenêtres de quota fournisseur normalisées (`X% left`, et non des coûts par réponse).
  Fournisseurs actuels de fenêtre d’utilisation : Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi et z.ai.

Les surfaces d’utilisation normalisent les alias courants des champs natifs des fournisseurs avant l’affichage.
Pour le trafic Responses de la famille OpenAI, cela inclut à la fois `input_tokens` /
`output_tokens` et `prompt_tokens` / `completion_tokens`, afin que les noms de champs propres
au transport ne modifient pas `/status`, `/usage` ou les résumés de session.
L’utilisation JSON de Gemini CLI est également normalisée : le texte de réponse provient de `response`, et
`stats.cached` est mappé vers `cacheRead`, avec `stats.input_tokens - stats.cached`
utilisé lorsque la CLI omet un champ explicite `stats.input`.
Pour le trafic Responses natif de la famille OpenAI, les alias d’utilisation WebSocket/SSE sont
normalisés de la même manière, et les totaux reviennent à l’entrée + sortie normalisées lorsque
`total_tokens` est absent ou vaut `0`.
Lorsque l’instantané de la session actuelle est incomplet, `/status` et `session_status` peuvent
également récupérer les compteurs de tokens/cache et l’étiquette du modèle d’exécution actif à partir du
journal d’utilisation de transcription le plus récent. Les valeurs actives non nulles existantes
restent prioritaires sur les valeurs de repli issues de la transcription, et des totaux de transcription
plus élevés orientés prompt peuvent l’emporter lorsque les totaux stockés sont absents ou plus faibles.
L’authentification d’utilisation pour les fenêtres de quota fournisseur provient de hooks spécifiques
au fournisseur lorsqu’ils sont disponibles ; sinon OpenClaw se replie sur des identifiants OAuth/clé API
correspondants issus des profils d’authentification, de l’environnement ou de la configuration.

## Estimation des coûts (lorsqu’elle est affichée)

Les coûts sont estimés à partir de votre configuration tarifaire de modèle :

```
models.providers.<provider>.models[].cost
```

Ce sont des **USD par 1M de tokens** pour `input`, `output`, `cacheRead` et
`cacheWrite`. Si la tarification est absente, OpenClaw n’affiche que les tokens. Les tokens OAuth
n’affichent jamais de coût en dollars.

## Impact du TTL du cache et de l’élagage

Le cache de prompt du fournisseur ne s’applique que dans la fenêtre TTL du cache. OpenClaw peut
facultativement exécuter un **élagage cache-ttl** : il élague la session une fois le TTL du cache
expiré, puis réinitialise la fenêtre de cache afin que les requêtes suivantes puissent réutiliser le
contexte fraîchement mis en cache au lieu de remettre en cache tout l’historique. Cela permet de
maintenir des coûts d’écriture de cache plus faibles lorsqu’une session reste inactive au-delà du TTL.

Configurez cela dans [Configuration du Gateway](/fr/gateway/configuration) et consultez les
détails du comportement dans [Élagage de session](/fr/concepts/session-pruning).

Heartbeat peut garder le cache **chaud** pendant les périodes d’inactivité. Si le TTL du cache de votre modèle
est `1h`, définir l’intervalle Heartbeat juste en dessous (par ex. `55m`) peut éviter de remettre en cache
le prompt complet, ce qui réduit les coûts d’écriture du cache.

Dans les configurations multi-agents, vous pouvez conserver une configuration de modèle partagée et ajuster le comportement du cache
par agent avec `agents.list[].params.cacheRetention`.

Pour un guide complet paramètre par paramètre, voir [Cache de prompt](/fr/reference/prompt-caching).

Pour la tarification de l’API Anthropic, les lectures de cache sont nettement moins coûteuses que les tokens
d’entrée, tandis que les écritures de cache sont facturées avec un multiplicateur plus élevé. Consultez la tarification
du cache de prompt d’Anthropic pour connaître les derniers tarifs et multiplicateurs TTL :
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Exemple : garder un cache de 1h chaud avec Heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Exemple : trafic mixte avec stratégie de cache par agent

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # référence par défaut pour la plupart des agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # garder le cache long chaud pour les sessions profondes
    - id: "alerts"
      params:
        cacheRetention: "none" # éviter les écritures de cache pour les notifications en rafales
```

`agents.list[].params` est fusionné par-dessus le `params` du modèle sélectionné, ce qui vous permet
de surcharger uniquement `cacheRetention` et d’hériter inchangés des autres paramètres par défaut du modèle.

### Exemple : activer l’en-tête bêta Anthropic de contexte 1M

La fenêtre de contexte 1M d’Anthropic est actuellement protégée par une bêta. OpenClaw peut injecter la
valeur `anthropic-beta` requise lorsque vous activez `context1m` sur des modèles Opus
ou Sonnet pris en charge.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Cela correspond à l’en-tête bêta `context-1m-2025-08-07` d’Anthropic.

Cela ne s’applique que lorsque `context1m: true` est défini sur cette entrée de modèle.

Exigence : l’identifiant doit être éligible à l’utilisation de contexte long. Sinon,
Anthropic répond avec une erreur de limitation de débit côté fournisseur pour cette requête.

Si vous authentifiez Anthropic avec des tokens OAuth/d’abonnement (`sk-ant-oat-*`),
OpenClaw ignore l’en-tête bêta `context-1m-*` car Anthropic rejette actuellement
cette combinaison avec HTTP 401.

## Conseils pour réduire la pression des tokens

- Utilisez `/compact` pour résumer les longues sessions.
- Réduisez les sorties d’outils volumineuses dans vos workflows.
- Diminuez `agents.defaults.imageMaxDimensionPx` pour les sessions riches en captures d’écran.
- Gardez les descriptions de Skills courtes (la liste des Skills est injectée dans le prompt).
- Préférez des modèles plus petits pour un travail verbeux et exploratoire.

Voir [Skills](/fr/tools/skills) pour la formule exacte de surcharge de la liste des Skills.
