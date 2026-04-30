---
read_when:
    - Expliquer l’utilisation des tokens, les coûts ou les fenêtres de contexte
    - Débogage de la croissance du contexte ou du comportement de Compaction
summary: Comment OpenClaw construit le contexte d’invite et indique l’utilisation des jetons + les coûts
title: Utilisation et coûts des jetons
x-i18n:
    generated_at: "2026-04-30T07:48:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3807ccae3313a731c2673edace8a5b37dc22259d436a67b4d787e45682dad3c
    source_path: reference/token-use.md
    workflow: 16
---

# Utilisation des jetons et coûts

OpenClaw suit les **jetons**, pas les caractères. Les jetons dépendent du modèle, mais la plupart
des modèles de style OpenAI font en moyenne environ 4 caractères par jeton pour le texte anglais.

## Comment l’invite système est construite

OpenClaw assemble sa propre invite système à chaque exécution. Elle comprend :

- Liste des outils + descriptions courtes
- Liste des Skills (uniquement les métadonnées ; les instructions sont chargées à la demande avec `read`).
  Le bloc compact des Skills est limité par `skills.limits.maxSkillsPromptChars`,
  avec une surcharge facultative par agent dans
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instructions d’auto-mise à jour
- Espace de travail + fichiers d’amorçage (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` lorsqu’il est nouveau, plus `MEMORY.md` lorsqu’il est présent). La racine en minuscules `memory.md` n’est pas injectée ; c’est une entrée de réparation héritée pour `openclaw doctor --fix` lorsqu’elle est associée à `MEMORY.md`. Les grands fichiers sont tronqués par `agents.defaults.bootstrapMaxChars` (par défaut : 12000), et l’injection totale d’amorçage est plafonnée par `agents.defaults.bootstrapTotalMaxChars` (par défaut : 60000). Les fichiers quotidiens `memory/*.md` ne font pas partie de l’invite d’amorçage normale ; ils restent disponibles à la demande via les outils de mémoire pendant les tours ordinaires, mais les exécutions du modèle de réinitialisation/démarrage peuvent préfixer un bloc unique de contexte de démarrage avec la mémoire quotidienne récente pour ce premier tour. Les commandes de chat simples `/new` et `/reset` sont confirmées sans invoquer le modèle. Le préambule de démarrage est contrôlé par `agents.defaults.startupContext`.
- Heure (UTC + fuseau horaire de l’utilisateur)
- Balises de réponse + comportement Heartbeat
- Métadonnées d’exécution (hôte/OS/modèle/raisonnement)

Voir la ventilation complète dans [Invite système](/fr/concepts/system-prompt).

## Ce qui compte dans la fenêtre de contexte

Tout ce que le modèle reçoit compte dans la limite de contexte :

- Invite système (toutes les sections listées ci-dessus)
- Historique de conversation (messages utilisateur + assistant)
- Appels d’outils et résultats d’outils
- Pièces jointes/transcriptions (images, audio, fichiers)
- Résumés de Compaction et artefacts d’élagage
- Enveloppes fournisseur ou en-têtes de sécurité (non visibles, mais tout de même comptés)

Certaines surfaces lourdes à l’exécution ont leurs propres plafonds explicites :

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Les surcharges par agent se trouvent sous `agents.list[].contextLimits`. Ces réglages servent
aux extraits d’exécution bornés et aux blocs injectés appartenant à l’exécution. Ils sont
distincts des limites d’amorçage, des limites de contexte de démarrage et des limites de l’invite
des Skills.

Pour les images, OpenClaw réduit les charges utiles d’images de transcription/d’outils avant les appels fournisseur.
Utilisez `agents.defaults.imageMaxDimensionPx` (par défaut : `1200`) pour régler cela :

- Des valeurs plus faibles réduisent généralement l’utilisation de jetons de vision et la taille de la charge utile.
- Des valeurs plus élevées préservent davantage de détails visuels pour l’OCR et les captures d’écran riches en UI.

Pour une ventilation pratique (par fichier injecté, outils, Skills et taille de l’invite système), utilisez `/context list` ou `/context detail`. Voir [Contexte](/fr/concepts/context).

## Comment voir l’utilisation actuelle des jetons

Utilisez ceci dans le chat :

- `/status` → **carte d’état riche en émojis** avec le modèle de session, l’utilisation du contexte,
  les jetons d’entrée/sortie de la dernière réponse et le **coût estimé** (clé API uniquement).
- `/usage off|tokens|full` → ajoute un **pied d’utilisation par réponse** à chaque réponse.
  - Persiste par session (stocké sous `responseUsage`).
  - L’authentification OAuth **masque le coût** (jetons uniquement).
- `/usage cost` → affiche un résumé local des coûts à partir des journaux de session OpenClaw.

Autres surfaces :

- **TUI/Web TUI :** `/status` + `/usage` sont pris en charge.
- **CLI :** `openclaw status --usage` et `openclaw channels list` affichent
  des fenêtres de quota fournisseur normalisées (`X% left`, pas les coûts par réponse).
  Fournisseurs actuels avec fenêtre d’utilisation : Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi et z.ai.

Les surfaces d’utilisation normalisent les alias courants de champs natifs des fournisseurs avant l’affichage.
Pour le trafic Responses de la famille OpenAI, cela inclut à la fois `input_tokens` /
`output_tokens` et `prompt_tokens` / `completion_tokens`, afin que les noms de champs propres au transport
ne modifient pas `/status`, `/usage` ni les résumés de session.
L’utilisation JSON de Gemini CLI est également normalisée : le texte de réponse provient de `response`, et
`stats.cached` correspond à `cacheRead`, avec `stats.input_tokens - stats.cached`
utilisé lorsque la CLI omet un champ explicite `stats.input`.
Pour le trafic Responses natif de la famille OpenAI, les alias d’utilisation WebSocket/SSE sont
normalisés de la même manière, et les totaux se rabattent sur l’entrée + sortie normalisées lorsque
`total_tokens` est absent ou vaut `0`.
Lorsque l’instantané de session actuel est parcellaire, `/status` et `session_status` peuvent
aussi récupérer les compteurs de jetons/cache et le libellé du modèle d’exécution actif à partir du
journal d’utilisation de transcription le plus récent. Les valeurs actives non nulles existantes gardent
la priorité sur les valeurs de repli de transcription, et les totaux de transcription plus grands orientés invite
peuvent l’emporter lorsque les totaux stockés sont absents ou plus petits.
L’authentification d’utilisation pour les fenêtres de quota fournisseur provient des hooks propres au fournisseur lorsqu’ils sont
disponibles ; sinon OpenClaw se rabat sur les identifiants OAuth/clé API correspondants
depuis les profils d’authentification, l’environnement ou la configuration.
Les entrées de transcription de l’assistant conservent la même forme d’utilisation normalisée, y compris
`usage.cost` lorsque le modèle actif a une tarification configurée et que le fournisseur
renvoie des métadonnées d’utilisation. Cela donne à `/usage cost` et à l’état de session adossé aux transcriptions
une source stable même après la disparition de l’état d’exécution actif.

OpenClaw garde la comptabilité d’utilisation fournisseur séparée de l’instantané de contexte actuel.
`usage.total` du fournisseur peut inclure les entrées mises en cache, les sorties et plusieurs
appels de modèle en boucle d’outils ; il est donc utile pour les coûts et la télémétrie, mais peut surestimer
la fenêtre de contexte active. Les affichages et diagnostics de contexte utilisent le dernier instantané d’invite
(`promptTokens`, ou le dernier appel de modèle lorsqu’aucun instantané d’invite n’est
disponible) pour `context.used`.

## Estimation des coûts (lorsqu’elle est affichée)

Les coûts sont estimés à partir de votre configuration de tarification des modèles :

```
models.providers.<provider>.models[].cost
```

Ce sont des **USD par 1 M de jetons** pour `input`, `output`, `cacheRead` et
`cacheWrite`. Si la tarification est absente, OpenClaw affiche uniquement les jetons. Les jetons OAuth
n’affichent jamais de coût en dollars.

Le démarrage du Gateway effectue aussi un amorçage facultatif de tarification en arrière-plan pour
les références de modèles configurées qui n’ont pas déjà une tarification locale. Cet amorçage
récupère les catalogues de tarification distants OpenRouter et LiteLLM. Définissez
`models.pricing.enabled: false` pour ignorer ces récupérations de catalogues au démarrage sur les réseaux hors ligne
ou restreints ; les entrées explicites `models.providers.*.models[].cost`
continuent d’alimenter les estimations locales de coûts.

## TTL du cache et impact de l’élagage

La mise en cache des invites par le fournisseur ne s’applique que dans la fenêtre de TTL du cache. OpenClaw peut
facultativement exécuter un **élagage cache-ttl** : il élague la session une fois le TTL du cache
expiré, puis réinitialise la fenêtre de cache afin que les requêtes suivantes puissent réutiliser le
contexte fraîchement mis en cache au lieu de remettre en cache tout l’historique. Cela maintient les coûts
d’écriture en cache plus bas lorsqu’une session reste inactive au-delà du TTL.

Configurez cela dans [Configuration du Gateway](/fr/gateway/configuration) et consultez les
détails du comportement dans [Élagage de session](/fr/concepts/session-pruning).

Heartbeat peut garder le cache **chaud** pendant les intervalles d’inactivité. Si le TTL du cache de votre modèle
est `1h`, définir l’intervalle Heartbeat juste en dessous (par exemple, `55m`) peut éviter
de remettre en cache toute l’invite, réduisant ainsi les coûts d’écriture en cache.

Dans les configurations multi-agents, vous pouvez garder une configuration de modèle partagée et régler le comportement du cache
par agent avec `agents.list[].params.cacheRetention`.

Pour un guide complet réglage par réglage, voir [Mise en cache des invites](/fr/reference/prompt-caching).

Pour la tarification de l’API Anthropic, les lectures de cache sont nettement moins chères que les jetons
d’entrée, tandis que les écritures de cache sont facturées avec un multiplicateur plus élevé. Consultez la
tarification de mise en cache des invites d’Anthropic pour les derniers tarifs et multiplicateurs de TTL :
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Exemple : garder le cache 1 h chaud avec Heartbeat

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

`agents.list[].params` fusionne par-dessus les `params` du modèle sélectionné, vous pouvez donc
surcharger uniquement `cacheRetention` et hériter les autres valeurs par défaut du modèle sans changement.

### Exemple : activer l’en-tête bêta de contexte 1 M d’Anthropic

La fenêtre de contexte 1 M d’Anthropic est actuellement soumise à un accès bêta. OpenClaw peut injecter la
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

Si vous authentifiez Anthropic avec des jetons OAuth/abonnement (`sk-ant-oat-*`),
OpenClaw ignore l’en-tête bêta `context-1m-*` car Anthropic rejette actuellement
cette combinaison avec HTTP 401.

## Conseils pour réduire la pression sur les jetons

- Utilisez `/compact` pour résumer les longues sessions.
- Réduisez les grandes sorties d’outils dans vos flux de travail.
- Abaissez `agents.defaults.imageMaxDimensionPx` pour les sessions riches en captures d’écran.
- Gardez les descriptions des Skills courtes (la liste des Skills est injectée dans l’invite).
- Préférez des modèles plus petits pour le travail verbeux et exploratoire.

Voir [Skills](/fr/tools/skills) pour la formule exacte du surcoût de la liste des Skills.

## Connexe

- [Utilisation de l’API et coûts](/fr/reference/api-usage-costs)
- [Mise en cache des invites](/fr/reference/prompt-caching)
- [Suivi de l’utilisation](/fr/concepts/usage-tracking)
