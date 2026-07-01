---
read_when:
    - Expliquer l’utilisation des jetons, les coûts ou les fenêtres de contexte
    - Débogage de la croissance du contexte ou du comportement de Compaction
summary: Comment OpenClaw construit le contexte de prompt et rapporte l’utilisation des tokens + les coûts
title: Utilisation des jetons et coûts
x-i18n:
    generated_at: "2026-07-01T18:11:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99e3de70aeb447bb58ae414c2c5908945e8173b9b8f2bf7e4c2eb9781657c44c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw suit les **tokens**, pas les caractères. Les tokens sont propres au modèle, mais la plupart des modèles de type OpenAI ont une moyenne d’environ 4 caractères par token pour le texte anglais.

## Construction du prompt système

OpenClaw assemble son propre prompt système à chaque exécution. Il inclut :

- Liste des outils + descriptions courtes
- Liste des Skills (métadonnées uniquement ; les instructions sont chargées à la demande avec `read`).
  Les tours Codex natifs reçoivent le bloc compact des Skills comme instructions développeur de collaboration limitées au tour ; les autres harnais le reçoivent dans la surface de prompt normale. Il est limité par `skills.limits.maxSkillsPromptChars`, avec une surcharge facultative par agent à `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instructions d’auto-mise à jour
- Espace de travail + fichiers d’amorçage (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` lorsqu’il est nouveau, plus `MEMORY.md` lorsqu’il est présent). Les tours Codex natifs ne collent pas le `MEMORY.md` brut depuis l’espace de travail d’agent configuré lorsque des outils de mémoire sont disponibles pour cet espace de travail ; ils incluent un petit pointeur mémoire dans les instructions développeur de collaboration limitées au tour et utilisent les outils de mémoire à la demande. Si les outils sont désactivés, si la recherche mémoire est indisponible, ou si l’espace de travail actif diffère de l’espace de travail de mémoire de l’agent, `MEMORY.md` utilise le chemin normal borné de contexte de tour. Le fichier racine en minuscules `memory.md` n’est pas injecté ; c’est une entrée de réparation héritée pour `openclaw doctor --fix` lorsqu’il est associé à `MEMORY.md`. Les gros fichiers injectés sont tronqués par `agents.defaults.bootstrapMaxChars` (par défaut : 20000), et l’injection totale d’amorçage est plafonnée par `agents.defaults.bootstrapTotalMaxChars` (par défaut : 60000). Les fichiers quotidiens `memory/*.md` ne font pas partie du prompt d’amorçage normal ; ils restent accessibles à la demande via les outils de mémoire lors des tours ordinaires, mais les exécutions de modèle de réinitialisation/démarrage peuvent préfixer un bloc ponctuel de contexte de démarrage avec la mémoire quotidienne récente pour ce premier tour. Les commandes de discussion simples `/new` et `/reset` sont accusées réception sans invoquer le modèle. Le prélude de démarrage est contrôlé par `agents.defaults.startupContext`. Les extraits AGENTS.md après Compaction sont séparés et nécessitent une activation explicite via `agents.defaults.compaction.postCompactionSections`.
- Heure (UTC + fuseau horaire utilisateur)
- Balises de réponse + comportement Heartbeat
- Métadonnées d’exécution (hôte/OS/modèle/raisonnement)

Voir la répartition complète dans [Prompt système](/fr/concepts/system-prompt).

Lorsque vous documentez des identifiants ou des extraits d’authentification, utilisez les [Conventions de marqueurs de secret](/fr/reference/secret-placeholder-conventions) pour éviter les faux positifs du détecteur de secrets dans les changements concernant uniquement la documentation.

## Ce qui compte dans la fenêtre de contexte

Tout ce que le modèle reçoit compte dans la limite de contexte :

- Prompt système (toutes les sections listées ci-dessus)
- Historique de conversation (messages utilisateur + assistant)
- Appels d’outils et résultats d’outils
- Pièces jointes/transcriptions (images, audio, fichiers)
- Résumés de Compaction et artefacts d’élagage
- Enveloppes fournisseur ou en-têtes de sécurité (non visibles, mais tout de même comptabilisés)

Certaines surfaces lourdes à l’exécution ont leurs propres plafonds explicites :

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Les surcharges par agent se trouvent sous `agents.list[].contextLimits`. Ces réglages servent aux extraits d’exécution bornés et aux blocs injectés appartenant à l’exécution. Ils sont distincts des limites d’amorçage, des limites de contexte de démarrage et des limites de prompt des Skills.

`toolResultMaxChars` est un plafond avancé (jusqu’à `1000000` caractères). Lorsqu’il n’est pas défini, OpenClaw choisit le plafond réel des résultats d’outils à partir de la fenêtre de contexte effective du modèle : `16000` caractères sous 100K tokens, `32000` caractères à 100K+ tokens, et `64000` caractères à 200K+ tokens, tout en restant borné par la garde de part de contexte d’exécution.

Pour les images, OpenClaw réduit les charges utiles d’images de transcription/outil avant les appels au fournisseur. Utilisez `agents.defaults.imageMaxDimensionPx` (par défaut : `1200`) pour ajuster cela :

- Les valeurs plus faibles réduisent généralement l’utilisation de tokens de vision et la taille de charge utile.
- Les valeurs plus élevées préservent davantage de détails visuels pour les captures d’écran riches en OCR/UI.

Pour une répartition pratique (par fichier injecté, outils, Skills et taille du prompt système), utilisez `/context list` ou `/context detail`. Voir [Contexte](/fr/concepts/context).

## Comment voir l’utilisation actuelle des tokens

Utilisez ceci dans la discussion :

- `/status` → **carte d’état riche en emoji** avec le modèle de session, l’utilisation du contexte, les tokens d’entrée/sortie de la dernière réponse et le **coût estimé** lorsque la tarification locale est configurée pour le modèle actif.
- `/usage off|tokens|full` → ajoute un **pied de page d’utilisation par réponse** à chaque réponse.
  - Persiste par session (stocké sous `responseUsage`).
  - `/usage reset` (alias : `inherit`, `clear`, `default`) — efface la surcharge de session afin que la session hérite à nouveau de la valeur par défaut configurée.
  - `/usage tokens` affiche les détails de tokens/cache du tour.
  - `/usage full` affiche les détails compacts de modèle/contexte/coût ; le coût estimé apparaît uniquement lorsqu’OpenClaw dispose de métadonnées d’utilisation et d’une tarification locale pour le modèle actif. Les mises en page personnalisées `messages.usageTemplate` peuvent inclure des champs de tokens/cache.
- `/usage cost` → affiche un résumé local des coûts à partir des journaux de session OpenClaw.

Autres surfaces :

- **TUI/Web TUI :** `/status` + `/usage` sont pris en charge.
- **CLI :** `openclaw status --usage` et `openclaw channels list` affichent les fenêtres de quota fournisseur normalisées (`X% left`, pas les coûts par réponse).
  Fournisseurs actuels avec fenêtre d’utilisation : Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi et z.ai.

Les surfaces d’utilisation normalisent les alias de champs natifs fournisseur courants avant l’affichage. Pour le trafic Responses de la famille OpenAI, cela inclut à la fois `input_tokens` / `output_tokens` et `prompt_tokens` / `completion_tokens`, afin que les noms de champs propres au transport ne changent pas `/status`, `/usage` ni les résumés de session.
L’utilisation de Gemini CLI est également normalisée : l’analyseur `stream-json` par défaut lit les événements `message` de l’assistant, et `stats.cached` correspond à `cacheRead`, avec `stats.input_tokens - stats.cached` utilisé lorsque la CLI omet un champ explicite `stats.input`. Les surcharges JSON héritées lisent encore le texte de réponse depuis `response`.
Pour le trafic Responses natif de la famille OpenAI, les alias d’utilisation WebSocket/SSE sont normalisés de la même façon, et les totaux se rabattent sur l’entrée + la sortie normalisées lorsque `total_tokens` est absent ou vaut `0`.
Lorsque l’instantané de session actuel est clairsemé, `/status` et `session_status` peuvent aussi récupérer les compteurs de tokens/cache et le libellé du modèle d’exécution actif depuis le journal d’utilisation de transcription le plus récent. Les valeurs actives non nulles existantes gardent la priorité sur les valeurs de repli de transcription, et les totaux de transcription plus grands orientés prompt peuvent l’emporter lorsque les totaux stockés sont absents ou plus petits.
L’authentification d’utilisation pour les fenêtres de quota fournisseur provient de hooks propres au fournisseur lorsqu’ils sont disponibles ; sinon, OpenClaw se rabat sur les identifiants OAuth/API-key correspondants depuis les profils d’authentification, l’environnement ou la configuration.
Les entrées de transcription de l’assistant persistent la même forme d’utilisation normalisée, y compris `usage.cost` lorsque le modèle actif a une tarification configurée et que le fournisseur renvoie des métadonnées d’utilisation. Cela fournit à `/usage cost` et au statut de session adossé aux transcriptions une source stable même après la disparition de l’état d’exécution actif.

OpenClaw garde la comptabilisation de l’utilisation fournisseur séparée de l’instantané de contexte actuel. `usage.total` du fournisseur peut inclure l’entrée mise en cache, la sortie et plusieurs appels de modèle en boucle d’outils ; c’est donc utile pour les coûts et la télémétrie, mais cela peut surestimer la fenêtre de contexte active. Les affichages et diagnostics de contexte utilisent le dernier instantané de prompt (`promptTokens`, ou le dernier appel de modèle lorsqu’aucun instantané de prompt n’est disponible) pour `context.used`.

## Estimation des coûts (lorsqu’elle est affichée)

Les coûts sont estimés depuis votre configuration de tarification des modèles :

```
models.providers.<provider>.models[].cost
```

Ce sont des **USD par 1M tokens** pour `input`, `output`, `cacheRead` et `cacheWrite`. Si la tarification est absente, `/usage full` omet le coût ; utilisez `/usage tokens` ou un `messages.usageTemplate` personnalisé lorsque vous avez besoin des détails de tokens/cache dans chaque réponse. L’affichage des coûts n’est pas limité à l’authentification par API-key : les fournisseurs sans API-key comme `aws-sdk` peuvent afficher un coût estimé lorsque leur entrée de modèle configurée inclut une tarification locale et que le fournisseur renvoie des métadonnées d’utilisation.

Une fois que les sidecars et les canaux atteignent le chemin Gateway prêt, OpenClaw lance un amorçage de tarification facultatif en arrière-plan pour les références de modèle configurées qui n’ont pas encore de tarification locale. Cet amorçage récupère les catalogues de tarification distants OpenRouter et LiteLLM. Définissez `models.pricing.enabled: false` pour ignorer ces récupérations de catalogues sur des réseaux hors ligne ou restreints ; les entrées explicites `models.providers.*.models[].cost` continuent de piloter les estimations de coût locales.

## TTL de cache et impact de l’élagage

La mise en cache de prompt fournisseur ne s’applique que dans la fenêtre TTL du cache. OpenClaw peut exécuter facultativement un **élagage cache-ttl** : il élague la session une fois le TTL du cache expiré, puis réinitialise la fenêtre de cache afin que les requêtes suivantes puissent réutiliser le contexte fraîchement mis en cache au lieu de remettre en cache tout l’historique. Cela réduit les coûts d’écriture en cache lorsqu’une session reste inactive au-delà du TTL.

Configurez-le dans [Configuration Gateway](/fr/gateway/configuration) et consultez les détails du comportement dans [Élagage de session](/fr/concepts/session-pruning).

Heartbeat peut garder le cache **chaud** pendant les périodes d’inactivité. Si le TTL du cache de votre modèle est `1h`, définir l’intervalle Heartbeat juste en dessous (par exemple `55m`) peut éviter de remettre en cache tout le prompt, réduisant ainsi les coûts d’écriture en cache.

Dans les configurations multi-agents, vous pouvez conserver une configuration de modèle partagée et ajuster le comportement du cache par agent avec `agents.list[].params.cacheRetention`.

Pour un guide complet réglage par réglage, voir [Mise en cache des prompts](/fr/reference/prompt-caching).

Pour la tarification de l’API Anthropic, les lectures de cache sont nettement moins chères que les tokens d’entrée, tandis que les écritures de cache sont facturées à un multiplicateur plus élevé. Consultez la tarification de la mise en cache des prompts d’Anthropic pour les derniers tarifs et multiplicateurs de TTL :
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Exemple : garder chaud un cache de 1h avec Heartbeat

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
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params` fusionne par-dessus les `params` du modèle sélectionné, ce qui vous permet de surcharger uniquement `cacheRetention` et d’hériter inchangées des autres valeurs par défaut du modèle.

### Contexte Anthropic 1M

OpenClaw dimensionne les modèles Claude 4.x compatibles GA, comme Opus 4.8, Opus 4.7, Opus 4.6 et Sonnet 4.6, avec la fenêtre de contexte 1M d’Anthropic. Vous n’avez pas besoin de `params.context1m: true` pour ces modèles.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Les anciennes configurations peuvent conserver `context1m: true`, mais OpenClaw n’envoie plus l’en-tête bêta Anthropic retiré `context-1m-2025-08-07` pour ce paramètre et n’étend pas à 1M les anciens modèles Claude non pris en charge.

Exigence : l’identifiant doit être admissible à l’utilisation de contexte long. Sinon, Anthropic répond avec une erreur de limite de débit côté fournisseur pour cette requête.

Si vous authentifiez Anthropic avec des tokens OAuth/abonnement (`sk-ant-oat-*`), OpenClaw préserve les en-têtes bêta Anthropic requis par OAuth tout en supprimant le bêta retiré `context-1m-*` s’il reste dans une ancienne configuration.

## Conseils pour réduire la pression sur les tokens

- Utilisez `/compact` pour résumer les longues sessions.
- Réduisez les sorties d’outils volumineuses dans vos workflows.
- Diminuez `agents.defaults.imageMaxDimensionPx` pour les sessions riches en captures d’écran.
- Gardez les descriptions de Skills courtes (la liste des Skills est injectée dans le prompt).
- Préférez des modèles plus petits pour les travaux verbeux et exploratoires.

Consultez [Skills](/fr/tools/skills) pour connaître la formule exacte de surcharge de la liste des Skills.

## Associé

- [Utilisation et coûts de l’API](/fr/reference/api-usage-costs)
- [Mise en cache des prompts](/fr/reference/prompt-caching)
- [Suivi de l’utilisation](/fr/concepts/usage-tracking)
