---
read_when:
    - Explication de l’utilisation des tokens, des coûts ou des fenêtres de contexte
    - Débogage de la croissance du contexte ou du comportement de Compaction
summary: Comment OpenClaw construit le contexte du prompt et indique l’utilisation des tokens et les coûts
title: Utilisation des tokens et coûts
x-i18n:
    generated_at: "2026-07-12T15:59:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 07c79e137d6809ccf8c435ef62641c0cc7579b3ec43acd513e430a7ab91cd47c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw comptabilise les **tokens**, pas les caractères. Les tokens dépendent du modèle, mais la plupart des modèles de type OpenAI utilisent en moyenne environ 4 caractères par token pour le texte anglais.

## Construction du prompt système

OpenClaw assemble son propre prompt système à chaque exécution. Il comprend :

- La liste des outils avec de courtes descriptions
- La liste des Skills (métadonnées uniquement ; les instructions sont chargées à la demande avec `read`). Les tours Codex natifs reçoivent le bloc compact des Skills sous forme d’instructions de développement collaboratif limitées au tour ; les autres environnements d’exécution le reçoivent dans la surface normale du prompt. Sa taille est limitée par `skills.limits.maxSkillsPromptChars`, avec un remplacement facultatif par agent dans `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Les instructions d’auto-mise à jour
- L’espace de travail et les fichiers d’amorçage (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` lorsqu’il est nouveau, ainsi que `MEMORY.md` lorsqu’il est présent). Les fichiers injectés volumineux sont tronqués selon `agents.defaults.bootstrapMaxChars` (valeur par défaut : `20000`) ; l’injection totale des fichiers d’amorçage est limitée par `agents.defaults.bootstrapTotalMaxChars` (valeur par défaut : `60000`).
  - Les tours Codex natifs n’incluent pas le contenu brut de `MEMORY.md` lorsque les outils de mémoire sont disponibles pour cet espace de travail ; ils reçoivent à la place un petit pointeur vers la mémoire dans les instructions de développement collaboratif limitées au tour et utilisent les outils de mémoire à la demande. Si les outils sont désactivés, si la recherche dans la mémoire est indisponible ou si l’espace de travail actif diffère de l’espace de travail de mémoire de l’agent, `MEMORY.md` revient au chemin normal et limité du contexte du tour.
  - Le fichier racine `memory.md` en minuscules n’est jamais injecté. Il sert d’entrée de réparation héritée pour `openclaw doctor --fix`, qui le migre vers `MEMORY.md`.
  - Les fichiers quotidiens `memory/*.md` ne font pas partie du prompt d’amorçage normal ; lors des tours ordinaires, ils restent disponibles à la demande via les outils de mémoire. Les exécutions du modèle lors d’une réinitialisation ou d’un démarrage peuvent ajouter au début un bloc de contexte de démarrage ponctuel contenant la mémoire quotidienne récente pour ce premier tour, contrôlé par `agents.defaults.startupContext`. Les commandes de chat simples `/new` et `/reset` sont confirmées sans invoquer le modèle.
  - Les extraits de `AGENTS.md` après Compaction sont distincts et nécessitent l’activation explicite de `agents.defaults.compaction.postCompactionSections`.
- L’heure (UTC et fuseau horaire de l’utilisateur)
- Les balises de réponse et le comportement de Heartbeat
- Les métadonnées d’exécution (hôte/système d’exploitation/modèle/raisonnement)

Consultez la répartition complète dans [Prompt système](/fr/concepts/system-prompt).

Lorsque vous documentez des identifiants ou des extraits d’authentification, utilisez les [conventions relatives aux espaces réservés pour les secrets](/fr/reference/secret-placeholder-conventions) afin d’éviter les faux positifs des analyseurs de secrets dans les modifications portant uniquement sur la documentation.

## Éléments comptabilisés dans la fenêtre de contexte

Tout ce que reçoit le modèle est comptabilisé dans la limite du contexte :

- Le prompt système (toutes les sections ci-dessus)
- L’historique de la conversation (messages de l’utilisateur et de l’assistant)
- Les appels d’outils et leurs résultats
- Les pièces jointes et transcriptions (images, audio, fichiers)
- Les résumés de Compaction et les artefacts d’élagage
- Les enveloppes du fournisseur ou les en-têtes de sécurité (non visibles, mais néanmoins comptabilisés)

Les surfaces à forte activité d’exécution disposent de leurs propres limites explicites sous `agents.defaults.contextLimits` (avec des remplacements par agent sous `agents.list[].contextLimits`) :

| Clé                      | Objectif                                                                 |
| ------------------------ | ------------------------------------------------------------------------ |
| `memoryGetMaxChars`      | Nombre maximal de caractères renvoyés par `memory_get` avant troncature. |
| `memoryGetDefaultLines`  | Fenêtre de lignes par défaut de `memory_get` lorsqu’une requête omet `lines`. |
| `toolResultMaxChars`     | Plafond avancé pour un seul résultat d’outil en direct (jusqu’à `1000000` caractères). |
| `postCompactionMaxChars` | Nombre maximal de caractères conservés depuis `AGENTS.md` lors de l’actualisation après Compaction. |

Il s’agit d’extraits d’exécution limités et de blocs injectés appartenant à l’environnement d’exécution, distincts des limites d’amorçage, des limites du contexte de démarrage et des limites du prompt des Skills.

`toolResultMaxChars` n’est pas défini par défaut ; OpenClaw déduit donc la limite des résultats d’outils en direct à partir de la fenêtre de contexte effective du modèle : `16000` caractères en dessous de 100K tokens, `32000` caractères à partir de 100K tokens et `64000` caractères à partir de 200K tokens. Le garde-fou relatif à la part du contexte d’exécution limite toujours un résultat d’outil unique à 30 % de la fenêtre de contexte, même lorsqu’un plafond explicite supérieur est configuré.

Pour les images, OpenClaw réduit la résolution des charges utiles d’images provenant des transcriptions ou des outils avant les appels au fournisseur. Ajustez ce comportement avec `agents.defaults.imageMaxDimensionPx` (valeur par défaut : `1200`) :

- Des valeurs inférieures réduisent l’utilisation des tokens de vision et la taille des charges utiles.
- Des valeurs supérieures préservent davantage de détails visuels pour les captures d’écran contenant beaucoup de texte à reconnaître ou d’éléments d’interface.

Pour obtenir une répartition pratique (par fichier injecté, outils, Skills et taille du prompt système), utilisez `/context list` ou `/context detail`. Consultez [Contexte](/fr/concepts/context).

## Affichage de l’utilisation actuelle des tokens

Dans le chat :

- `/status` -> carte d’état enrichie d’émojis indiquant le modèle de la session, l’utilisation du contexte, les tokens d’entrée et de sortie de la dernière réponse, ainsi que le coût estimé lorsque des tarifs locaux sont configurés pour le modèle actif.
- `/usage off|tokens|full` -> ajoute à chaque réponse un pied de page indiquant son utilisation. Ce réglage persiste pour la session (stocké sous `responseUsage`).
  - `/usage reset` (alias : `inherit`, `clear`, `default`) efface le remplacement de la session afin qu’elle hérite de nouveau de la valeur par défaut configurée.
  - `/usage tokens` affiche les détails des tokens et du cache du tour.
  - `/usage full` affiche des détails compacts sur le modèle, le contexte et le coût ; le coût estimé n’apparaît que lorsqu’OpenClaw dispose des métadonnées d’utilisation et des tarifs locaux du modèle actif. Les mises en page personnalisées de `messages.usageTemplate` peuvent inclure des champs relatifs aux tokens et au cache.
- `/usage cost` -> résumé local des coûts issu des journaux de session OpenClaw.

Autres surfaces :

- **TUI/TUI Web :** `/status` et `/usage` sont pris en charge.
- **CLI :** `openclaw status --usage` et `openclaw channels list` affichent les fenêtres normalisées de quota des fournisseurs (`X% left`, et non les coûts par réponse). Les fournisseurs actuels de fenêtres d’utilisation sont : Claude (Anthropic), ClawRouter, Copilot (GitHub), DeepSeek, Gemini (Google Gemini CLI), MiniMax, OpenAI, Xiaomi, Xiaomi Token Plan et z.ai.

Les surfaces d’utilisation normalisent les alias de champs natifs courants des fournisseurs avant l’affichage. Pour le trafic Responses de la famille OpenAI, cela inclut aussi bien `input_tokens`/`output_tokens` que `prompt_tokens`/`completion_tokens`, de sorte que les noms de champs propres au transport ne modifient pas `/status`, `/usage` ni les résumés de session. L’utilisation de Gemini CLI est également normalisée : l’analyseur `stream-json` par défaut lit les événements `message` de l’assistant et `stats.cached` est associé à `cacheRead`, avec `stats.input_tokens - stats.cached` utilisé lorsque la CLI omet un champ `stats.input` explicite. Les remplacements JSON hérités continuent de lire le texte de la réponse depuis `response`.

Pour le trafic Responses natif de la famille OpenAI, les alias d’utilisation WebSocket/SSE sont normalisés de la même manière, et les totaux sont calculés à partir de l’entrée normalisée plus la sortie lorsque `total_tokens` est absent ou vaut `0`.

Lorsque l’instantané de la session actuelle est incomplet, `/status` et `session_status` peuvent récupérer les compteurs de tokens et de cache, ainsi que le libellé du modèle d’exécution actif, à partir du journal d’utilisation de la transcription le plus récent. Les valeurs actives non nulles existantes restent prioritaires sur les valeurs de repli de la transcription, et les totaux de transcription plus élevés orientés vers le prompt peuvent prévaloir lorsque les totaux stockés sont absents ou inférieurs.

L’authentification d’utilisation pour les fenêtres de quota des fournisseurs provient d’abord des hooks propres à chaque fournisseur ; si un fournisseur ne possède aucun hook, ou si le hook ne renvoie aucun token, OpenClaw se rabat sur les identifiants OAuth ou les clés d’API correspondants issus des profils d’authentification, de l’environnement ou de la configuration.

Les entrées de transcription de l’assistant conservent la même structure d’utilisation normalisée, y compris `usage.cost` lorsque le modèle actif possède des tarifs configurés et que le fournisseur renvoie des métadonnées d’utilisation. Cela fournit à `/usage cost` et à l’état de session fondé sur la transcription une source stable, même après la disparition de l’état d’exécution actif.

OpenClaw sépare la comptabilisation de l’utilisation du fournisseur de l’instantané actuel du contexte. La valeur `usage.total` du fournisseur peut inclure les entrées mises en cache, les sorties et plusieurs appels du modèle dans des boucles d’outils ; elle est donc utile pour les coûts et la télémétrie, mais peut surestimer la fenêtre de contexte active. Les affichages et diagnostics du contexte utilisent le dernier instantané du prompt (`promptTokens`, ou le dernier appel au modèle lorsqu’aucun instantané du prompt n’est disponible) pour `context.used`.

## Estimation des coûts (lorsqu’elle est affichée)

Les coûts sont estimés à partir de votre configuration tarifaire du modèle :

```text
models.providers.<provider>.models[].cost
```

Ces valeurs sont exprimées en **USD par million de tokens** pour `input`, `output`, `cacheRead` et `cacheWrite`. Si les tarifs sont absents, `/usage full` omet le coût ; utilisez `/usage tokens` ou un `messages.usageTemplate` personnalisé lorsque vous avez besoin des détails relatifs aux tokens et au cache dans chaque réponse. L’affichage des coûts n’est pas limité à l’authentification par clé d’API : les fournisseurs sans clé d’API, tels que `aws-sdk`, peuvent afficher un coût estimé lorsque l’entrée de modèle configurée inclut des tarifs locaux et que le fournisseur renvoie des métadonnées d’utilisation.

Une fois que les processus auxiliaires et les canaux ont atteint l’état prêt du Gateway, OpenClaw lance un amorçage facultatif des tarifs en arrière-plan pour les références de modèles configurées qui ne disposent pas encore de tarifs locaux. Cet amorçage récupère à distance les catalogues tarifaires d’OpenRouter et de LiteLLM. Définissez `models.pricing.enabled: false` pour ignorer la récupération de ces catalogues sur les réseaux hors ligne ou restreints ; les entrées explicites `models.providers.*.models[].cost` continuent d’alimenter les estimations locales des coûts.

## Incidence du TTL du cache et de l’élagage

La mise en cache des prompts par le fournisseur ne s’applique que pendant la fenêtre du TTL du cache. OpenClaw peut éventuellement exécuter un **élagage selon le TTL du cache** : il élague la session une fois le TTL du cache expiré, puis réinitialise la fenêtre du cache afin que les requêtes suivantes réutilisent le contexte fraîchement mis en cache au lieu de remettre en cache tout l’historique. Cela réduit les coûts d’écriture dans le cache lorsqu’une session reste inactive au-delà du TTL.

Configurez ce comportement dans [Configuration du Gateway](/fr/gateway/configuration) et consultez les détails dans [Élagage des sessions](/fr/concepts/session-pruning).

Heartbeat peut maintenir le cache **actif** pendant les périodes d’inactivité. Si le TTL du cache de votre modèle est de `1h`, définir l’intervalle de Heartbeat juste en dessous de cette durée (par exemple `55m`) peut éviter de remettre en cache l’intégralité du prompt et ainsi réduire les coûts d’écriture dans le cache.

Dans les configurations multi-agents, vous pouvez conserver une configuration de modèle partagée et ajuster le comportement du cache par agent avec `agents.list[].params.cacheRetention`.

Pour un guide complet de chaque réglage, consultez [Mise en cache des prompts](/fr/reference/prompt-caching).

Pour la tarification de l’API Anthropic, les lectures du cache sont nettement moins coûteuses que les tokens d’entrée, tandis que les écritures dans le cache sont facturées avec un multiplicateur supérieur. Consultez la tarification de la mise en cache des prompts d’Anthropic pour connaître les tarifs et multiplicateurs de TTL les plus récents :
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Exemple : maintenir actif le cache de 1h avec Heartbeat

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

### Exemple : trafic mixte avec une stratégie de cache par agent

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
        every: "55m" # maintenir actif le cache longue durée pour les sessions approfondies
    - id: "alerts"
      params:
        cacheRetention: "none" # éviter les écritures dans le cache pour les notifications en rafale
```

`agents.list[].params` est fusionné par-dessus les `params` du modèle sélectionné ; vous pouvez donc remplacer uniquement `cacheRetention` et hériter sans modification des autres valeurs par défaut du modèle.

### Contexte Anthropic de 1M

OpenClaw dimensionne les modèles Claude 4.x compatibles avec la disponibilité générale, tels qu’Opus 4.8, Opus 4.7, Opus 4.6 et Sonnet 4.6, avec la fenêtre de contexte de 1M d’Anthropic. Vous n’avez pas besoin de `params.context1m: true` pour ces modèles.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Les anciennes configurations peuvent conserver `context1m: true`, mais OpenClaw n’envoie plus l’en-tête bêta `context-1m-2025-08-07` retiré par Anthropic pour ce paramètre et n’étend pas à 1M les anciens modèles Claude non compatibles.

Exigence : les identifiants doivent être autorisés pour l’utilisation d’un contexte long. Dans le cas contraire,
Anthropic renvoie une erreur de limite de débit côté fournisseur pour cette requête.

Si vous vous authentifiez auprès d’Anthropic avec des jetons OAuth/d’abonnement
(`sk-ant-oat-*`), OpenClaw conserve les en-têtes bêta d’Anthropic requis par OAuth
tout en supprimant l’ancienne version bêta `context-1m-*` si elle subsiste dans
une configuration plus ancienne.

## Conseils pour réduire la pression sur les jetons

- Utilisez `/compact` pour résumer les longues sessions.
- Réduisez les sorties volumineuses des outils dans vos workflows.
- Diminuez `agents.defaults.imageMaxDimensionPx` pour les sessions comportant beaucoup de captures d’écran.
- Gardez les descriptions des Skills courtes (la liste des Skills est injectée dans le prompt).
- Privilégiez les modèles plus petits pour les travaux exploratoires et détaillés.

Consultez [Skills](/fr/tools/skills) pour connaître la formule exacte du surcoût lié à la liste des Skills.

## Rubriques connexes

- [Utilisation et coûts de l’API](/fr/reference/api-usage-costs)
- [Mise en cache du prompt](/fr/reference/prompt-caching)
- [Suivi de l’utilisation](/fr/concepts/usage-tracking)
