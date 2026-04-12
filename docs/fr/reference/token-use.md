---
read_when:
    - Expliquer l’utilisation des tokens, les coûts ou les fenêtres de contexte
    - Déboguer la croissance du contexte ou le comportement de compactage
summary: Comment OpenClaw construit le contexte du prompt et rapporte l’utilisation des tokens ainsi que les coûts
title: Utilisation des tokens et coûts
x-i18n:
    generated_at: "2026-04-12T06:50:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: f8c856549cd28b8364a640e6fa9ec26aa736895c7a993e96cbe85838e7df2dfb
    source_path: reference/token-use.md
    workflow: 15
---

# Utilisation des tokens et coûts

OpenClaw suit les **tokens**, pas les caractères. Les tokens sont spécifiques au modèle, mais la plupart des modèles de style OpenAI ont une moyenne d’environ 4 caractères par token pour le texte anglais.

## Comment le prompt système est construit

OpenClaw assemble son propre prompt système à chaque exécution. Il inclut :

- Liste des outils + courtes descriptions
- Liste des Skills (métadonnées uniquement ; les instructions sont chargées à la demande avec `read`)
- Instructions d’auto-mise à jour
- Fichiers de l’espace de travail + d’initialisation (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` lorsqu’il est nouveau, ainsi que `MEMORY.md` lorsqu’il est présent ou `memory.md` comme solution de secours en minuscules). Les fichiers volumineux sont tronqués par `agents.defaults.bootstrapMaxChars` (par défaut : 20000), et l’injection totale d’initialisation est plafonnée par `agents.defaults.bootstrapTotalMaxChars` (par défaut : 150000). Les fichiers quotidiens `memory/*.md` ne font pas partie du prompt d’initialisation normal ; ils restent accessibles à la demande via les outils de mémoire lors des tours ordinaires, mais `/new` et `/reset` seuls peuvent préfixer un bloc de contexte de démarrage à usage unique avec la mémoire quotidienne récente pour ce premier tour. Ce préambule de démarrage est contrôlé par `agents.defaults.startupContext`.
- Heure (UTC + fuseau horaire de l’utilisateur)
- Balises de réponse + comportement heartbeat
- Métadonnées d’exécution (hôte/OS/modèle/réflexion)

Voir le détail complet dans [Prompt système](/fr/concepts/system-prompt).

## Ce qui compte dans la fenêtre de contexte

Tout ce que le modèle reçoit compte dans la limite de contexte :

- Prompt système (toutes les sections listées ci-dessus)
- Historique de conversation (messages utilisateur + assistant)
- Appels d’outils et résultats d’outils
- Pièces jointes/transcriptions (images, audio, fichiers)
- Résumés de compactage et artefacts d’élagage
- Wrappers fournisseur ou en-têtes de sécurité (non visibles, mais quand même comptés)

Pour les images, OpenClaw réduit la taille des charges utiles d’image des transcriptions/outils avant les appels au fournisseur.
Utilisez `agents.defaults.imageMaxDimensionPx` (par défaut : `1200`) pour ajuster cela :

- Des valeurs plus faibles réduisent généralement l’utilisation de vision tokens et la taille des charges utiles.
- Des valeurs plus élevées préservent davantage de détails visuels pour l’OCR/les captures d’écran d’interface lourdes.

Pour un découpage pratique (par fichier injecté, outils, Skills et taille du prompt système), utilisez `/context list` ou `/context detail`. Voir [Contexte](/fr/concepts/context).

## Comment voir l’utilisation actuelle des tokens

Utilisez ceci dans le chat :

- `/status` → **carte d’état riche en emoji** avec le modèle de session, l’utilisation du contexte, les tokens d’entrée/sortie de la dernière réponse et le **coût estimé** (clé API uniquement).
- `/usage off|tokens|full` → ajoute un **pied de page d’utilisation par réponse** à chaque réponse.
  - Persiste par session (stocké comme `responseUsage`).
  - L’auth OAuth **masque le coût** (tokens uniquement).
- `/usage cost` → affiche un résumé local des coûts à partir des journaux de session OpenClaw.

Autres interfaces :

- **TUI/Web TUI :** `/status` + `/usage` sont pris en charge.
- **CLI :** `openclaw status --usage` et `openclaw channels list` affichent
  des fenêtres de quota fournisseur normalisées (`X% restants`, pas les coûts par réponse).
  Fournisseurs actuels avec fenêtre d’utilisation : Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi et z.ai.

Les interfaces d’utilisation normalisent les alias de champs natifs des fournisseurs avant affichage.
Pour le trafic OpenAI-family Responses, cela inclut à la fois `input_tokens` /
`output_tokens` et `prompt_tokens` / `completion_tokens`, afin que les noms de champs
spécifiques au transport ne modifient pas `/status`, `/usage` ni les résumés de session.
L’utilisation JSON de Gemini CLI est également normalisée : le texte de réponse vient de `response`, et
`stats.cached` est mappé à `cacheRead`, avec `stats.input_tokens - stats.cached`
utilisé lorsque la CLI omet un champ explicite `stats.input`.
Pour le trafic natif OpenAI-family Responses, les alias d’utilisation WebSocket/SSE sont
normalisés de la même manière, et les totaux retombent sur les valeurs normalisées d’entrée + sortie lorsque
`total_tokens` est absent ou vaut `0`.
Lorsque l’instantané de la session en cours est peu détaillé, `/status` et `session_status` peuvent
également récupérer les compteurs de tokens/cache et l’étiquette du modèle d’exécution actif à partir du
journal d’utilisation de transcription le plus récent. Les valeurs actives non nulles existantes restent prioritaires
sur les valeurs de secours issues de la transcription, et des totaux de transcription plus élevés
orientés prompt peuvent l’emporter lorsque les totaux stockés sont absents ou plus faibles.
L’authentification d’utilisation pour les fenêtres de quota fournisseur provient de hooks spécifiques au fournisseur lorsque
disponible ; sinon OpenClaw retombe sur les identifiants OAuth/clé API correspondants provenant des profils d’authentification,
de l’environnement ou de la configuration.

## Estimation des coûts (lorsqu’elle est affichée)

Les coûts sont estimés à partir de votre configuration tarifaire de modèle :

```
models.providers.<provider>.models[].cost
```

Il s’agit de **USD par 1M tokens** pour `input`, `output`, `cacheRead` et
`cacheWrite`. Si la tarification est absente, OpenClaw n’affiche que les tokens. Les tokens OAuth
n’affichent jamais de coût en dollars.

## Impact du TTL du cache et de l’élagage

La mise en cache des prompts fournisseur ne s’applique que dans la fenêtre TTL du cache. OpenClaw peut
facultativement exécuter un **élagage cache-ttl** : il élague la session une fois le TTL du cache
expiré, puis réinitialise la fenêtre de cache afin que les requêtes suivantes puissent réutiliser le
contexte fraîchement mis en cache au lieu de remettre en cache tout l’historique. Cela permet de limiter les
coûts d’écriture dans le cache lorsqu’une session reste inactive au-delà du TTL.

Configurez cela dans [Configuration de la gateway](/fr/gateway/configuration) et consultez les
détails du comportement dans [Élagage de session](/fr/concepts/session-pruning).

Heartbeat peut maintenir le cache **chaud** pendant les périodes d’inactivité. Si le TTL de cache de votre modèle
est de `1h`, régler l’intervalle heartbeat juste en dessous (par exemple `55m`) peut éviter de
remettre en cache l’intégralité du prompt, ce qui réduit les coûts d’écriture dans le cache.

Dans les configurations multi-agent, vous pouvez conserver une configuration de modèle partagée et ajuster le comportement du cache
par agent avec `agents.list[].params.cacheRetention`.

Pour un guide complet paramètre par paramètre, voir [Prompt Caching](/fr/reference/prompt-caching).

Pour la tarification de l’API Anthropic, les lectures du cache sont significativement moins chères que les
tokens d’entrée, tandis que les écritures du cache sont facturées avec un multiplicateur plus élevé. Consultez la tarification Anthropic du prompt caching pour connaître les tarifs et multiplicateurs TTL les plus récents :
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Exemple : garder un cache de 1h chaud avec heartbeat

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
        every: "55m" # garde le cache long chaud pour les sessions approfondies
    - id: "alerts"
      params:
        cacheRetention: "none" # évite les écritures de cache pour les notifications par rafales
```

`agents.list[].params` fusionne au-dessus des `params` du modèle sélectionné, ce qui vous permet
de ne remplacer que `cacheRetention` et d’hériter inchangés des autres paramètres par défaut du modèle.

### Exemple : activer l’en-tête bêta Anthropic 1M context

La fenêtre de contexte Anthropic de 1M est actuellement protégée par une bêta. OpenClaw peut injecter la
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

Cela correspond à l’en-tête bêta Anthropic `context-1m-2025-08-07`.

Cela s’applique uniquement lorsque `context1m: true` est défini sur cette entrée de modèle.

Exigence : l’identifiant doit être éligible à l’utilisation long contexte. Dans le cas contraire,
Anthropic répond avec une erreur de limitation de débit côté fournisseur pour cette requête.

Si vous authentifiez Anthropic avec des tokens OAuth/d’abonnement (`sk-ant-oat-*`),
OpenClaw ignore l’en-tête bêta `context-1m-*` car Anthropic rejette actuellement
cette combinaison avec une erreur HTTP 401.

## Conseils pour réduire la pression sur les tokens

- Utilisez `/compact` pour résumer les longues sessions.
- Réduisez les sorties d’outils volumineuses dans vos workflows.
- Diminuez `agents.defaults.imageMaxDimensionPx` pour les sessions riches en captures d’écran.
- Gardez les descriptions de Skills courtes (la liste des Skills est injectée dans le prompt).
- Préférez des modèles plus petits pour le travail verbeux et exploratoire.

Voir [Skills](/fr/tools/skills) pour la formule exacte de surcharge de la liste des Skills.
