---
read_when:
    - Expliquer l’utilisation des tokens, les coûts ou les fenêtres de contexte
    - Débogage de la croissance du contexte ou du comportement de Compaction
summary: Comment OpenClaw construit le contexte d’invite et signale l’utilisation des tokens et les coûts
title: Utilisation des tokens et coûts
x-i18n:
    generated_at: "2026-06-27T18:12:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0035ec9cf8d97aa6e78b9d95549cfb458af3bc2b5a4e2db83708281465c7e1af
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw suit les **tokens**, pas les caractères. Les tokens dépendent du modèle, mais la plupart des modèles de type OpenAI ont une moyenne d’environ 4 caractères par token pour le texte anglais.

## Comment l’invite système est construite

OpenClaw assemble sa propre invite système à chaque exécution. Elle inclut :

- Liste des outils + descriptions courtes
- Liste des Skills (métadonnées uniquement ; les instructions sont chargées à la demande avec `read`).
  Les tours Codex natifs reçoivent le bloc compact des skills comme instructions développeur de collaboration limitées au tour ; les autres harnais le reçoivent dans la surface d’invite normale. Il est borné par `skills.limits.maxSkillsPromptChars`, avec une surcharge facultative par agent à `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instructions d’auto-mise à jour
- Espace de travail + fichiers d’amorçage (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` lorsqu’ils sont nouveaux, plus `MEMORY.md` lorsqu’il est présent). Les tours Codex natifs ne collent pas le `MEMORY.md` brut depuis l’espace de travail d’agent configuré lorsque les outils de mémoire sont disponibles pour cet espace de travail ; ils incluent un petit pointeur mémoire dans les instructions développeur de collaboration limitées au tour et utilisent les outils de mémoire à la demande. Si les outils sont désactivés, que la recherche mémoire est indisponible, ou que l’espace de travail actif diffère de l’espace de travail mémoire de l’agent, `MEMORY.md` utilise le chemin normal borné du contexte de tour. La racine en minuscules `memory.md` n’est pas injectée ; c’est une entrée de réparation héritée pour `openclaw doctor --fix` lorsqu’elle est associée à `MEMORY.md`. Les grands fichiers injectés sont tronqués par `agents.defaults.bootstrapMaxChars` (valeur par défaut : 20000), et l’injection totale d’amorçage est plafonnée par `agents.defaults.bootstrapTotalMaxChars` (valeur par défaut : 60000). Les fichiers quotidiens `memory/*.md` ne font pas partie de l’invite d’amorçage normale ; ils restent disponibles à la demande via les outils de mémoire lors des tours ordinaires, mais les exécutions de modèle de réinitialisation/démarrage peuvent préfixer un bloc unique de contexte de démarrage contenant la mémoire quotidienne récente pour ce premier tour. Les commandes de chat nues `/new` et `/reset` sont acquittées sans invoquer le modèle. Le préambule de démarrage est contrôlé par `agents.defaults.startupContext`. Les extraits AGENTS.md après Compaction sont séparés et nécessitent une activation explicite via `agents.defaults.compaction.postCompactionSections`.
- Heure (UTC + fuseau horaire utilisateur)
- Balises de réponse + comportement Heartbeat
- Métadonnées d’exécution (hôte/OS/modèle/raisonnement)

Consultez la décomposition complète dans [Invite système](/fr/concepts/system-prompt).

Lorsque vous documentez des identifiants ou des extraits d’authentification, utilisez les
[Conventions de placeholders de secrets](/fr/reference/secret-placeholder-conventions) pour
éviter les faux positifs des scanners de secrets dans les changements de documentation uniquement.

## Ce qui compte dans la fenêtre de contexte

Tout ce que le modèle reçoit compte dans la limite de contexte :

- Invite système (toutes les sections listées ci-dessus)
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

Les surcharges par agent se trouvent sous `agents.list[].contextLimits`. Ces réglages servent aux extraits d’exécution bornés et aux blocs injectés appartenant à l’exécution. Ils sont séparés des limites d’amorçage, des limites de contexte de démarrage et des limites d’invite des Skills.

`toolResultMaxChars` est un plafond avancé (jusqu’à `1000000` caractères). Lorsqu’il n’est pas défini, OpenClaw choisit le plafond de résultats d’outils en direct à partir de la fenêtre de contexte effective du modèle : `16000` caractères sous 100K tokens, `32000` caractères à 100K+ tokens, et `64000` caractères à 200K+ tokens, toujours borné par la garde de part de contexte d’exécution.

Pour les images, OpenClaw réduit la taille des charges utiles d’images de transcription/d’outil avant les appels fournisseur.
Utilisez `agents.defaults.imageMaxDimensionPx` (valeur par défaut : `1200`) pour ajuster cela :

- Des valeurs plus faibles réduisent généralement l’usage de tokens de vision et la taille de charge utile.
- Des valeurs plus élevées préservent davantage de détails visuels pour les captures d’écran riches en OCR/UI.

Pour une décomposition pratique (par fichier injecté, outils, Skills et taille de l’invite système), utilisez `/context list` ou `/context detail`. Consultez [Contexte](/fr/concepts/context).

## Comment voir l’usage actuel des tokens

Utilisez ces commandes dans le chat :

- `/status` → **carte d’état riche en emoji** avec le modèle de session, l’usage du contexte,
  les tokens d’entrée/sortie de la dernière réponse et le **coût estimé** lorsque la tarification locale est
  configurée pour le modèle actif.
- `/usage off|tokens|full` → ajoute un **pied de page d’usage par réponse** à chaque réponse.
  - Persiste par session (stocké comme `responseUsage`).
  - `/usage reset` (alias : `inherit`, `clear`, `default`) — efface la surcharge de session
    afin que la session hérite à nouveau de la valeur par défaut configurée.
  - `/usage full` affiche le coût estimé uniquement lorsqu’OpenClaw dispose des métadonnées d’usage et
    d’une tarification locale pour le modèle actif. Sinon, il affiche uniquement les tokens.
- `/usage cost` → affiche un résumé de coût local à partir des journaux de session OpenClaw.

Autres surfaces :

- **TUI/Web TUI :** `/status` + `/usage` sont pris en charge.
- **CLI :** `openclaw status --usage` et `openclaw channels list` affichent
  des fenêtres de quota fournisseur normalisées (`X% left`, pas les coûts par réponse).
  Fournisseurs actuels avec fenêtre d’usage : Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi et z.ai.

Les surfaces d’usage normalisent les alias courants de champs natifs des fournisseurs avant l’affichage.
Pour le trafic Responses de la famille OpenAI, cela inclut à la fois `input_tokens` /
`output_tokens` et `prompt_tokens` / `completion_tokens`, de sorte que les noms de champs propres au transport ne modifient pas `/status`, `/usage` ni les résumés de session.
L’usage Gemini CLI est également normalisé : l’analyseur `stream-json` par défaut lit les événements `message` de l’assistant, et `stats.cached` correspond à `cacheRead`, avec `stats.input_tokens - stats.cached` utilisé lorsque la CLI omet un champ `stats.input` explicite. Les surcharges JSON héritées lisent toujours le texte de réponse depuis `response`.
Pour le trafic Responses natif de la famille OpenAI, les alias d’usage WebSocket/SSE sont normalisés de la même manière, et les totaux se rabattent sur l’entrée + la sortie normalisées lorsque `total_tokens` est absent ou vaut `0`.
Lorsque l’instantané de session actuel est clairsemé, `/status` et `session_status` peuvent aussi récupérer les compteurs de tokens/cache et l’étiquette du modèle d’exécution actif depuis le journal d’usage de transcription le plus récent. Les valeurs en direct non nulles existantes conservent la priorité sur les valeurs de repli issues des transcriptions, et les totaux de transcription plus grands orientés invite peuvent l’emporter lorsque les totaux stockés sont absents ou plus petits.
L’authentification d’usage pour les fenêtres de quota fournisseur provient de hooks propres au fournisseur lorsqu’ils sont disponibles ; sinon, OpenClaw se rabat sur les identifiants OAuth/API-key correspondants depuis les profils d’authentification, l’environnement ou la configuration.
Les entrées de transcription de l’assistant conservent la même forme d’usage normalisée, y compris `usage.cost` lorsque le modèle actif dispose d’une tarification configurée et que le fournisseur renvoie des métadonnées d’usage. Cela donne à `/usage cost` et à l’état de session adossé aux transcriptions une source stable même après disparition de l’état d’exécution en direct.

OpenClaw garde la comptabilité d’usage fournisseur séparée de l’instantané de contexte actuel. `usage.total` du fournisseur peut inclure l’entrée en cache, la sortie et plusieurs appels de modèle dans une boucle d’outils ; il est donc utile pour les coûts et la télémétrie, mais peut surestimer la fenêtre de contexte en direct. Les affichages de contexte et les diagnostics utilisent le dernier instantané d’invite (`promptTokens`, ou le dernier appel de modèle lorsqu’aucun instantané d’invite n’est disponible) pour `context.used`.

## Estimation des coûts (lorsqu’elle est affichée)

Les coûts sont estimés à partir de votre configuration de tarification du modèle :

```
models.providers.<provider>.models[].cost
```

Ce sont les **USD par 1M de tokens** pour `input`, `output`, `cacheRead` et
`cacheWrite`. Si la tarification est absente, OpenClaw affiche uniquement les tokens. L’affichage des coûts
n’est pas limité à l’authentification par clé d’API : les fournisseurs sans clé d’API tels que `aws-sdk` peuvent afficher
un coût estimé lorsque leur entrée de modèle configurée inclut une tarification locale et que le
fournisseur renvoie les métadonnées d’utilisation.

Une fois que les sidecars et les canaux atteignent le chemin prêt du Gateway, OpenClaw démarre un
amorçage optionnel de la tarification en arrière-plan pour les références de modèles configurées qui ne
disposent pas déjà d’une tarification locale. Cet amorçage récupère les catalogues de tarification distants OpenRouter et LiteLLM.
Définissez `models.pricing.enabled: false` pour ignorer ces récupérations de catalogue
sur les réseaux hors ligne ou restreints ; les entrées explicites
`models.providers.*.models[].cost` continuent à alimenter les estimations de coût locales.

## Impact du TTL du cache et de l’élagage

La mise en cache des prompts par le fournisseur ne s’applique que dans la fenêtre de TTL du cache. OpenClaw peut
optionnellement exécuter un **élagage cache-ttl** : il élague la session une fois le TTL du cache
expiré, puis réinitialise la fenêtre de cache afin que les requêtes suivantes puissent réutiliser le
contexte fraîchement mis en cache au lieu de remettre en cache tout l’historique. Cela réduit les coûts
d’écriture en cache lorsqu’une session reste inactive au-delà du TTL.

Configurez-le dans [Configuration du Gateway](/fr/gateway/configuration) et consultez les
détails du comportement dans [Élagage de session](/fr/concepts/session-pruning).

Heartbeat peut garder le cache **chaud** entre les périodes d’inactivité. Si le TTL du cache de votre modèle
est `1h`, définir l’intervalle Heartbeat juste en dessous de cette durée (par exemple, `55m`) peut éviter
de remettre en cache tout le prompt, réduisant ainsi les coûts d’écriture en cache.

Dans les configurations multi-agents, vous pouvez conserver une configuration de modèle partagée et ajuster le comportement du cache
par agent avec `agents.list[].params.cacheRetention`.

Pour un guide complet option par option, consultez [Mise en cache des prompts](/fr/reference/prompt-caching).

Pour la tarification de l’API Anthropic, les lectures de cache sont nettement moins chères que les tokens
d’entrée, tandis que les écritures de cache sont facturées avec un multiplicateur plus élevé. Consultez la
tarification de la mise en cache des prompts d’Anthropic pour connaître les derniers tarifs et multiplicateurs de TTL :
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Exemple : garder un cache de 1 h chaud avec Heartbeat

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

`agents.list[].params` fusionne par-dessus les `params` du modèle sélectionné, ce qui vous permet
de remplacer uniquement `cacheRetention` et d’hériter des autres valeurs par défaut du modèle sans modification.

### Contexte 1M d’Anthropic

OpenClaw dimensionne les modèles Claude 4.x compatibles GA tels qu’Opus 4.8, Opus 4.7, Opus 4.6 et
Sonnet 4.6 avec la fenêtre de contexte 1M d’Anthropic. Vous n’avez pas besoin de
`params.context1m: true` pour ces modèles.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Les anciennes configurations peuvent conserver `context1m: true`, mais OpenClaw n’envoie plus
l’en-tête bêta Anthropic retiré `context-1m-2025-08-07` pour ce paramètre et
n’étend pas les anciens modèles Claude non pris en charge à 1M.

Exigence : l’identifiant doit être éligible à l’utilisation en contexte long. Dans le cas contraire,
Anthropic répond avec une erreur de limite de débit côté fournisseur pour cette requête.

Si vous authentifiez Anthropic avec des tokens OAuth/abonnement (`sk-ant-oat-*`),
OpenClaw conserve les en-têtes bêta Anthropic requis par OAuth tout en supprimant le
bêta retiré `context-1m-*` s’il reste dans une ancienne configuration.

## Conseils pour réduire la pression sur les tokens

- Utilisez `/compact` pour résumer les longues sessions.
- Réduisez les sorties volumineuses des outils dans vos workflows.
- Réduisez `agents.defaults.imageMaxDimensionPx` pour les sessions riches en captures d’écran.
- Gardez les descriptions de Skills courtes (la liste des Skills est injectée dans le prompt).
- Préférez des modèles plus petits pour le travail verbeux et exploratoire.

Consultez [Skills](/fr/tools/skills) pour la formule exacte de surcharge de la liste des Skills.

## Connexe

- [Utilisation de l’API et coûts](/fr/reference/api-usage-costs)
- [Mise en cache des prompts](/fr/reference/prompt-caching)
- [Suivi de l’utilisation](/fr/concepts/usage-tracking)
