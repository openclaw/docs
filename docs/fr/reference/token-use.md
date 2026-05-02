---
read_when:
    - Explication de l’utilisation des tokens, des coûts ou des fenêtres de contexte
    - Débogage de la croissance du contexte ou du comportement de Compaction
summary: Comment OpenClaw construit le contexte d’invite et rapporte l’utilisation des jetons + les coûts
title: Utilisation et coûts des jetons
x-i18n:
    generated_at: "2026-05-02T21:02:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 648c1624aa81e896dacdbdc10784ca10fba2e43114823903da6455e7de512ace
    source_path: reference/token-use.md
    workflow: 16
---

# Utilisation des tokens et coûts

OpenClaw suit les **tokens**, pas les caractères. Les tokens dépendent du modèle, mais la plupart
des modèles de style OpenAI ont une moyenne d’environ 4 caractères par token pour le texte anglais.

## Comment le prompt système est construit

OpenClaw assemble son propre prompt système à chaque exécution. Il inclut :

- Liste des outils + brèves descriptions
- Liste des Skills (métadonnées uniquement ; les instructions sont chargées à la demande avec `read`).
  Le bloc compact des Skills est limité par `skills.limits.maxSkillsPromptChars`,
  avec une surcharge facultative par agent à
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instructions d’auto-mise à jour
- Espace de travail + fichiers d’amorçage (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` lorsqu’il est nouveau, plus `MEMORY.md` lorsqu’il est présent). Le fichier racine en minuscules `memory.md` n’est pas injecté ; il s’agit d’une entrée de réparation héritée pour `openclaw doctor --fix` lorsqu’il est associé à `MEMORY.md`. Les fichiers volumineux sont tronqués par `agents.defaults.bootstrapMaxChars` (par défaut : 12000), et l’injection totale d’amorçage est plafonnée par `agents.defaults.bootstrapTotalMaxChars` (par défaut : 60000). Les fichiers quotidiens `memory/*.md` ne font pas partie du prompt d’amorçage normal ; ils restent disponibles à la demande via les outils de mémoire lors des tours ordinaires, mais les exécutions de modèle de réinitialisation/démarrage peuvent préfixer un bloc de contexte de démarrage ponctuel avec la mémoire quotidienne récente pour ce premier tour. Les commandes de chat brutes `/new` et `/reset` sont reconnues sans invoquer le modèle. Le préambule de démarrage est contrôlé par `agents.defaults.startupContext`.
- Heure (UTC + fuseau horaire de l’utilisateur)
- Balises de réponse + comportement de Heartbeat
- Métadonnées d’exécution (hôte/OS/modèle/raisonnement)

Consultez la répartition complète dans [Prompt système](/fr/concepts/system-prompt).

## Ce qui compte dans la fenêtre de contexte

Tout ce que le modèle reçoit compte dans la limite de contexte :

- Prompt système (toutes les sections listées ci-dessus)
- Historique de conversation (messages utilisateur + assistant)
- Appels d’outils et résultats d’outils
- Pièces jointes/transcriptions (images, audio, fichiers)
- Résumés de Compaction et artefacts d’élagage
- Enveloppes fournisseur ou en-têtes de sécurité (non visibles, mais quand même comptés)

Certaines surfaces lourdes à l’exécution ont leurs propres plafonds explicites :

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Les surcharges par agent se trouvent sous `agents.list[].contextLimits`. Ces réglages servent
aux extraits d’exécution bornés et aux blocs injectés appartenant à l’exécution. Ils sont
distincts des limites d’amorçage, des limites de contexte de démarrage et des limites de prompt
des Skills.

Pour les images, OpenClaw réduit les charges utiles d’images de transcription/outil avant les appels fournisseur.
Utilisez `agents.defaults.imageMaxDimensionPx` (par défaut : `1200`) pour ajuster ce comportement :

- Des valeurs plus basses réduisent généralement l’utilisation de tokens de vision et la taille de la charge utile.
- Des valeurs plus élevées préservent davantage de détails visuels pour les captures d’écran riches en OCR/UI.

Pour une répartition pratique (par fichier injecté, outils, Skills et taille du prompt système), utilisez `/context list` ou `/context detail`. Consultez [Contexte](/fr/concepts/context).

## Comment voir l’utilisation actuelle des tokens

Utilisez ceci dans le chat :

- `/status` → **carte d’état riche en emoji** avec le modèle de session, l’utilisation du contexte,
  les tokens d’entrée/sortie de la dernière réponse et le **coût estimé** (clé API uniquement).
- `/usage off|tokens|full` → ajoute un **pied de page d’utilisation par réponse** à chaque réponse.
  - Persiste par session (stocké sous `responseUsage`).
  - L’authentification OAuth **masque le coût** (tokens uniquement).
- `/usage cost` → affiche un résumé local des coûts à partir des journaux de session OpenClaw.

Autres surfaces :

- **TUI/Web TUI :** `/status` + `/usage` sont pris en charge.
- **CLI :** `openclaw status --usage` et `openclaw channels list` affichent
  des fenêtres de quota fournisseur normalisées (`X% left`, pas les coûts par réponse).
  Fournisseurs actuels de fenêtres d’utilisation : Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi et z.ai.

Les surfaces d’utilisation normalisent les alias courants de champs natifs aux fournisseurs avant l’affichage.
Pour le trafic Responses de la famille OpenAI, cela inclut à la fois `input_tokens` /
`output_tokens` et `prompt_tokens` / `completion_tokens`, de sorte que les noms de champs propres
au transport ne changent pas `/status`, `/usage` ni les résumés de session.
L’utilisation JSON de Gemini CLI est également normalisée : le texte de réponse vient de `response`, et
`stats.cached` correspond à `cacheRead`, avec `stats.input_tokens - stats.cached`
utilisé lorsque la CLI omet un champ explicite `stats.input`.
Pour le trafic Responses natif de la famille OpenAI, les alias d’utilisation WebSocket/SSE sont
normalisés de la même façon, et les totaux se rabattent sur l’entrée + la sortie normalisées lorsque
`total_tokens` est absent ou vaut `0`.
Lorsque l’instantané de session actuel est parcellaire, `/status` et `session_status` peuvent
aussi récupérer les compteurs de tokens/cache et le libellé du modèle d’exécution actif à partir du
journal d’utilisation de transcription le plus récent. Les valeurs actives non nulles existantes gardent
la priorité sur les valeurs de repli de transcription, et les totaux de transcription plus élevés orientés prompt
peuvent l’emporter lorsque les totaux stockés sont absents ou plus petits.
L’authentification d’utilisation pour les fenêtres de quota fournisseur provient de hooks propres aux fournisseurs lorsqu’ils sont
disponibles ; sinon OpenClaw se rabat sur les identifiants OAuth/clé API correspondants
provenant des profils d’authentification, de l’environnement ou de la configuration.
Les entrées de transcription de l’assistant persistent la même forme d’utilisation normalisée, y compris
`usage.cost` lorsque le modèle actif a une tarification configurée et que le fournisseur
renvoie des métadonnées d’utilisation. Cela donne à `/usage cost` et à l’état de session appuyé par les transcriptions
une source stable même après la disparition de l’état d’exécution actif.

OpenClaw garde la comptabilité d’utilisation fournisseur séparée de l’instantané de contexte actuel.
`usage.total` du fournisseur peut inclure l’entrée mise en cache, la sortie et plusieurs
appels de modèle de boucle d’outils ; il est donc utile pour les coûts et la télémétrie, mais peut surestimer
la fenêtre de contexte active. Les affichages et diagnostics de contexte utilisent le dernier instantané de prompt
(`promptTokens`, ou le dernier appel de modèle lorsqu’aucun instantané de prompt n’est
disponible) pour `context.used`.

## Estimation des coûts (lorsqu’elle est affichée)

Les coûts sont estimés à partir de votre configuration de tarification des modèles :

```
models.providers.<provider>.models[].cost
```

Il s’agit de **USD par 1M de tokens** pour `input`, `output`, `cacheRead` et
`cacheWrite`. Si la tarification est absente, OpenClaw affiche seulement les tokens. Les tokens OAuth
n’affichent jamais de coût en dollars.

Une fois que les processus auxiliaires et les canaux atteignent le chemin prêt du Gateway, OpenClaw démarre un
amorçage facultatif de tarification en arrière-plan pour les références de modèles configurées qui n’ont
pas déjà de tarification locale. Cet amorçage récupère les catalogues de tarification distants OpenRouter et LiteLLM.
Définissez `models.pricing.enabled: false` pour ignorer ces récupérations de catalogues
sur les réseaux hors ligne ou restreints ; les entrées explicites
`models.providers.*.models[].cost` continuent de piloter les estimations de coût locales.

## TTL du cache et impact de l’élagage

La mise en cache des prompts par le fournisseur ne s’applique que dans la fenêtre TTL du cache. OpenClaw peut
exécuter facultativement un **élagage cache-ttl** : il élague la session une fois le TTL du cache
expiré, puis réinitialise la fenêtre de cache afin que les requêtes suivantes puissent réutiliser le
contexte fraîchement mis en cache au lieu de remettre en cache tout l’historique. Cela réduit les coûts
d’écriture de cache lorsqu’une session reste inactive au-delà du TTL.

Configurez-le dans [Configuration du Gateway](/fr/gateway/configuration) et consultez les
détails du comportement dans [Élagage de session](/fr/concepts/session-pruning).

Heartbeat peut garder le cache **chaud** pendant les périodes d’inactivité. Si le TTL du cache de votre modèle
est `1h`, définir l’intervalle Heartbeat juste en dessous (par exemple, `55m`) peut éviter
de remettre en cache tout le prompt, réduisant ainsi les coûts d’écriture de cache.

Dans les configurations multi-agents, vous pouvez conserver une configuration de modèle partagée et ajuster le comportement du cache
par agent avec `agents.list[].params.cacheRetention`.

Pour un guide complet réglage par réglage, consultez [Mise en cache des prompts](/fr/reference/prompt-caching).

Pour la tarification de l’API Anthropic, les lectures de cache sont nettement moins chères que les tokens
d’entrée, tandis que les écritures de cache sont facturées avec un multiplicateur plus élevé. Consultez la
tarification de la mise en cache des prompts d’Anthropic pour les derniers tarifs et multiplicateurs TTL :
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

`agents.list[].params` fusionne par-dessus les `params` du modèle sélectionné, ce qui vous permet de
surcharger uniquement `cacheRetention` et d’hériter les autres valeurs par défaut du modèle sans changement.

### Exemple : activer l’en-tête bêta de contexte 1M d’Anthropic

La fenêtre de contexte 1M d’Anthropic est actuellement protégée par un accès bêta. OpenClaw peut injecter la
valeur `anthropic-beta` requise lorsque vous activez `context1m` sur les modèles Opus
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
Anthropic répond avec une erreur de limite de débit côté fournisseur pour cette requête.

Si vous authentifiez Anthropic avec des tokens OAuth/abonnement (`sk-ant-oat-*`),
OpenClaw ignore l’en-tête bêta `context-1m-*` car Anthropic rejette actuellement
cette combinaison avec HTTP 401.

## Conseils pour réduire la pression sur les tokens

- Utilisez `/compact` pour résumer les longues sessions.
- Réduisez les sorties d’outils volumineuses dans vos workflows.
- Baissez `agents.defaults.imageMaxDimensionPx` pour les sessions riches en captures d’écran.
- Gardez les descriptions de Skills courtes (la liste des Skills est injectée dans le prompt).
- Préférez des modèles plus petits pour le travail verbeux et exploratoire.

Consultez [Skills](/fr/tools/skills) pour la formule exacte de surcharge de la liste des Skills.

## Connexe

- [Utilisation de l’API et coûts](/fr/reference/api-usage-costs)
- [Mise en cache des prompts](/fr/reference/prompt-caching)
- [Suivi de l’utilisation](/fr/concepts/usage-tracking)
