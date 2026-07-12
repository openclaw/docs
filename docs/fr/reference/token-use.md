---
read_when:
    - Expliquer l’utilisation des jetons, les coûts ou les fenêtres de contexte
    - Débogage de l’augmentation du contexte ou du comportement de Compaction
summary: Comment OpenClaw construit le contexte du prompt et indique l’utilisation des tokens ainsi que les coûts
title: Utilisation des jetons et coûts
x-i18n:
    generated_at: "2026-07-12T03:07:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07c79e137d6809ccf8c435ef62641c0cc7579b3ec43acd513e430a7ab91cd47c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw comptabilise les **tokens**, et non les caractères. Les tokens dépendent du modèle, mais la plupart des modèles de type OpenAI comptent en moyenne environ 4 caractères par token pour le texte anglais.

## Construction du prompt système

OpenClaw assemble son propre prompt système à chaque exécution. Il comprend :

- La liste des outils et de brèves descriptions
- La liste des Skills (métadonnées uniquement ; les instructions sont chargées à la demande avec `read`). Les tours Codex natifs reçoivent le bloc compact des Skills sous forme d’instructions de développement collaboratif limitées au tour ; les autres environnements d’exécution le reçoivent dans la surface normale du prompt. La taille est limitée par `skills.limits.maxSkillsPromptChars`, avec un remplacement facultatif par agent dans `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Les instructions de mise à jour automatique
- L’espace de travail et les fichiers d’amorçage (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` lorsqu’il est nouveau, ainsi que `MEMORY.md` lorsqu’il est présent). Les fichiers injectés volumineux sont tronqués selon `agents.defaults.bootstrapMaxChars` (valeur par défaut : `20000`) ; l’injection totale des fichiers d’amorçage est plafonnée par `agents.defaults.bootstrapTotalMaxChars` (valeur par défaut : `60000`).
  - Les tours Codex natifs n’incluent pas le contenu brut de `MEMORY.md` lorsque des outils de mémoire sont disponibles pour cet espace de travail ; ils reçoivent plutôt un bref pointeur vers la mémoire dans les instructions de développement collaboratif limitées au tour et utilisent les outils de mémoire à la demande. Si les outils sont désactivés, si la recherche dans la mémoire est indisponible ou si l’espace de travail actif diffère de celui de la mémoire de l’agent, `MEMORY.md` revient au chemin normal du contexte de tour, avec limitation de taille.
  - Le fichier racine `memory.md` en minuscules n’est jamais injecté. Il constitue une entrée de réparation héritée pour `openclaw doctor --fix`, qui le migre vers `MEMORY.md`.
  - Les fichiers quotidiens `memory/*.md` ne font pas partie du prompt d’amorçage normal ; lors des tours ordinaires, ils restent accessibles à la demande par les outils de mémoire. Les exécutions du modèle lors d’une réinitialisation ou d’un démarrage peuvent ajouter au début un bloc ponctuel de contexte de démarrage contenant la mémoire quotidienne récente pour ce premier tour, selon le paramètre `agents.defaults.startupContext`. Les commandes de conversation simples `/new` et `/reset` sont confirmées sans invoquer le modèle.
  - Les extraits de `AGENTS.md` après Compaction sont distincts et nécessitent l’activation explicite de `agents.defaults.compaction.postCompactionSections`.
- L’heure (UTC et fuseau horaire de l’utilisateur)
- Les balises de réponse et le comportement du Heartbeat
- Les métadonnées d’exécution (hôte, système d’exploitation, modèle, réflexion)

Consultez la description complète dans [Prompt système](/fr/concepts/system-prompt).

Lorsque vous documentez des identifiants ou des extraits d’authentification, utilisez les [conventions relatives aux espaces réservés pour les secrets](/fr/reference/secret-placeholder-conventions) afin d’éviter les faux positifs des analyseurs de secrets dans les modifications portant uniquement sur la documentation.

## Éléments comptabilisés dans la fenêtre de contexte

Tout ce que reçoit le modèle compte dans la limite du contexte :

- Le prompt système (toutes les sections ci-dessus)
- L’historique de la conversation (messages de l’utilisateur et de l’assistant)
- Les appels d’outils et leurs résultats
- Les pièces jointes et transcriptions (images, audio, fichiers)
- Les résumés de Compaction et les artefacts d’élagage
- Les enveloppes du fournisseur ou les en-têtes de sécurité (non visibles, mais tout de même comptabilisés)

Les surfaces très sollicitées à l’exécution disposent de leurs propres plafonds explicites sous `agents.defaults.contextLimits` (avec des remplacements par agent sous `agents.list[].contextLimits`) :

| Clé                      | Fonction                                                                  |
| ------------------------ | ------------------------------------------------------------------------- |
| `memoryGetMaxChars`      | Nombre maximal de caractères renvoyés par `memory_get` avant troncature.  |
| `memoryGetDefaultLines`  | Fenêtre de lignes par défaut de `memory_get` lorsqu’une requête omet `lines`. |
| `toolResultMaxChars`     | Plafond avancé pour un résultat unique d’outil actif (jusqu’à `1000000` caractères). |
| `postCompactionMaxChars` | Nombre maximal de caractères conservés depuis `AGENTS.md` lors de l’actualisation après Compaction. |

Il s’agit d’extraits d’exécution limités et de blocs injectés appartenant à l’environnement d’exécution, distincts des limites d’amorçage, des limites du contexte de démarrage et des limites du prompt des Skills.

Par défaut, `toolResultMaxChars` n’est pas défini ; OpenClaw déduit donc le plafond des résultats d’outils actifs à partir de la fenêtre de contexte effective du modèle : `16000` caractères en dessous de 100 000 tokens, `32000` caractères à partir de 100 000 tokens et `64000` caractères à partir de 200 000 tokens. Le garde-fou relatif à la part du contexte utilisée à l’exécution limite toujours un résultat d’outil unique à 30 % de la fenêtre de contexte, même lorsqu’un plafond explicite plus élevé est configuré.

Pour les images, OpenClaw réduit la résolution des charges utiles d’images provenant des transcriptions ou des outils avant les appels au fournisseur. Réglez ce comportement avec `agents.defaults.imageMaxDimensionPx` (valeur par défaut : `1200`) :

- Des valeurs plus faibles réduisent l’utilisation des tokens de vision et la taille des charges utiles.
- Des valeurs plus élevées préservent davantage de détails visuels pour les captures d’écran riches en éléments OCR ou d’interface utilisateur.

Pour obtenir une répartition pratique (par fichier injecté, outils, Skills et taille du prompt système), utilisez `/context list` ou `/context detail`. Consultez [Contexte](/fr/concepts/context).

## Affichage de l’utilisation actuelle des tokens

Dans la conversation :

- `/status` -> affiche une fiche d’état riche en emoji indiquant le modèle de la session, l’utilisation du contexte, les tokens d’entrée et de sortie de la dernière réponse, ainsi que le coût estimé lorsqu’une tarification locale est configurée pour le modèle actif.
- `/usage off|tokens|full` -> ajoute à chaque réponse un pied de page indiquant l’utilisation correspondante. Ce réglage persiste pour chaque session (stocké sous `responseUsage`).
  - `/usage reset` (alias : `inherit`, `clear`, `default`) efface le remplacement propre à la session afin que celle-ci hérite de nouveau de la valeur par défaut configurée.
  - `/usage tokens` affiche les détails des tokens et du cache pour le tour.
  - `/usage full` affiche des détails compacts sur le modèle, le contexte et le coût ; le coût estimé n’apparaît que lorsqu’OpenClaw dispose de métadonnées d’utilisation et d’une tarification locale pour le modèle actif. Les mises en page personnalisées de `messages.usageTemplate` peuvent inclure des champs relatifs aux tokens et au cache.
- `/usage cost` -> affiche un récapitulatif local des coûts à partir des journaux de session OpenClaw.

Autres surfaces :

- **TUI/TUI Web :** `/status` et `/usage` sont pris en charge.
- **CLI :** `openclaw status --usage` et `openclaw channels list` affichent les fenêtres normalisées de quota des fournisseurs (`X% left`, et non les coûts par réponse). Les fournisseurs disposant actuellement de fenêtres d’utilisation sont Claude (Anthropic), ClawRouter, Copilot (GitHub), DeepSeek, Gemini (Google Gemini CLI), MiniMax, OpenAI, Xiaomi, Xiaomi Token Plan et z.ai.

Les surfaces d’utilisation normalisent les alias courants des champs natifs des fournisseurs avant l’affichage. Pour le trafic Responses de la famille OpenAI, cela comprend à la fois `input_tokens`/`output_tokens` et `prompt_tokens`/`completion_tokens` ; les noms de champs propres au transport ne modifient donc pas `/status`, `/usage` ni les résumés de session. L’utilisation de Gemini CLI est également normalisée : l’analyseur `stream-json` par défaut lit les événements `message` de l’assistant, et `stats.cached` est associé à `cacheRead`, tandis que `stats.input_tokens - stats.cached` est utilisé lorsque la CLI omet un champ `stats.input` explicite. Les remplacements JSON hérités continuent de lire le texte de la réponse depuis `response`.

Pour le trafic Responses natif de la famille OpenAI, les alias d’utilisation WebSocket/SSE sont normalisés de la même manière, et le total est calculé à partir de la somme normalisée des entrées et des sorties lorsque `total_tokens` est absent ou vaut `0`.

Lorsque l’instantané de la session actuelle contient peu d’informations, `/status` et `session_status` peuvent récupérer les compteurs de tokens et de cache ainsi que le libellé du modèle actif à l’exécution depuis le journal d’utilisation le plus récent de la transcription. Les valeurs actives non nulles existantes restent prioritaires sur les valeurs de repli de la transcription, et les totaux de transcription plus élevés orientés vers le prompt peuvent l’emporter lorsque les totaux stockés sont absents ou inférieurs.

L’authentification utilisée pour les fenêtres de quota des fournisseurs provient d’abord des points d’extension propres au fournisseur ; si un fournisseur ne possède aucun point d’extension, ou si celui-ci ne permet pas d’obtenir un token, OpenClaw recherche des identifiants OAuth ou de clé API correspondants dans les profils d’authentification, les variables d’environnement ou la configuration.

Les entrées de transcription de l’assistant conservent la même structure d’utilisation normalisée, notamment `usage.cost` lorsque le modèle actif possède une tarification configurée et que le fournisseur renvoie des métadonnées d’utilisation. Cela fournit à `/usage cost` et à l’état de session fondé sur la transcription une source stable, même après la disparition de l’état actif de l’environnement d’exécution.

OpenClaw sépare la comptabilisation de l’utilisation du fournisseur de l’instantané actuel du contexte. La valeur `usage.total` du fournisseur peut inclure les entrées mises en cache, les sorties et plusieurs appels au modèle dans une boucle d’outils ; elle est donc utile pour les coûts et la télémétrie, mais peut surestimer la fenêtre de contexte active. Les affichages et diagnostics du contexte utilisent le dernier instantané du prompt (`promptTokens`, ou le dernier appel au modèle lorsqu’aucun instantané du prompt n’est disponible) pour `context.used`.

## Estimation des coûts (lorsqu’elle est affichée)

Les coûts sont estimés à partir de la configuration tarifaire de votre modèle :

```text
models.providers.<provider>.models[].cost
```

Il s’agit de montants en **USD par million de tokens** pour `input`, `output`, `cacheRead` et `cacheWrite`. Si la tarification est absente, `/usage full` omet le coût ; utilisez `/usage tokens` ou un modèle personnalisé `messages.usageTemplate` lorsque vous avez besoin des détails relatifs aux tokens et au cache dans chaque réponse. L’affichage des coûts n’est pas limité à l’authentification par clé API : les fournisseurs sans clé API, comme `aws-sdk`, peuvent afficher un coût estimé lorsque l’entrée configurée de leur modèle comprend une tarification locale et que le fournisseur renvoie des métadonnées d’utilisation.

Une fois que les processus auxiliaires et les canaux ont atteint l’état prêt du Gateway, OpenClaw lance un amorçage facultatif de la tarification en arrière-plan pour les références de modèles configurées qui ne possèdent pas encore de tarification locale. Cet amorçage récupère les catalogues tarifaires distants d’OpenRouter et de LiteLLM. Définissez `models.pricing.enabled: false` pour ignorer la récupération de ces catalogues sur les réseaux hors ligne ou restreints ; les entrées explicites `models.providers.*.models[].cost` continuent d’alimenter les estimations locales des coûts.

## Incidence du TTL du cache et de l’élagage

La mise en cache du prompt par le fournisseur ne s’applique que pendant la fenêtre du TTL du cache. OpenClaw peut éventuellement effectuer un **élagage selon le TTL du cache** : il élague la session une fois le TTL du cache expiré, puis réinitialise la fenêtre du cache afin que les requêtes suivantes réutilisent le contexte nouvellement mis en cache au lieu de remettre en cache l’intégralité de l’historique. Cela réduit les coûts d’écriture dans le cache lorsqu’une session reste inactive au-delà du TTL.

Configurez cette fonction dans la [configuration du Gateway](/fr/gateway/configuration) et consultez les détails de son comportement dans [Élagage des sessions](/fr/concepts/session-pruning).

Le Heartbeat peut maintenir le cache **actif** pendant les périodes d’inactivité. Si le TTL du cache de votre modèle est de `1h`, définir l’intervalle du Heartbeat juste en dessous de cette durée (par exemple `55m`) peut éviter de remettre en cache l’intégralité du prompt et ainsi réduire les coûts d’écriture dans le cache.

Dans les configurations multi-agents, vous pouvez conserver une configuration de modèle commune et ajuster le comportement du cache pour chaque agent avec `agents.list[].params.cacheRetention`.

Pour obtenir un guide complet de chaque réglage, consultez [Mise en cache du prompt](/fr/reference/prompt-caching).

Pour la tarification de l’API Anthropic, les lectures du cache sont nettement moins coûteuses que les tokens d’entrée, tandis que les écritures dans le cache sont facturées avec un multiplicateur plus élevé. Consultez la tarification de la mise en cache du prompt d’Anthropic pour connaître les tarifs et multiplicateurs de TTL les plus récents :
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Exemple : maintenir actif un cache de 1 h avec le Heartbeat

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

### Exemple : trafic mixte avec une stratégie de cache propre à chaque agent

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

`agents.list[].params` est fusionné par-dessus les paramètres `params` du modèle sélectionné ; vous pouvez donc remplacer uniquement `cacheRetention` et hériter sans modification des autres valeurs par défaut du modèle.

### Contexte Anthropic de 1 million de tokens

OpenClaw dimensionne les modèles Claude 4.x compatibles avec la disponibilité générale, tels qu’Opus 4.8, Opus 4.7, Opus 4.6 et Sonnet 4.6, avec la fenêtre de contexte d’un million de tokens d’Anthropic. Vous n’avez pas besoin de définir `params.context1m: true` pour ces modèles.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Les anciennes configurations peuvent conserver `context1m: true`, mais OpenClaw n’envoie plus l’en-tête bêta `context-1m-2025-08-07`, désormais retiré par Anthropic, pour ce paramètre et n’étend pas à un million de tokens les anciens modèles Claude non pris en charge.

Exigence : l’identifiant doit être éligible à l’utilisation d’un contexte long. Dans le cas contraire,
Anthropic renvoie une erreur de limite de débit côté fournisseur pour cette requête.

Si vous vous authentifiez auprès d’Anthropic avec des jetons OAuth/d’abonnement
(`sk-ant-oat-*`), OpenClaw conserve les en-têtes bêta Anthropic requis par OAuth
tout en supprimant l’ancienne version bêta `context-1m-*` si elle subsiste dans
une configuration antérieure.

## Conseils pour réduire la pression sur les jetons

- Utilisez `/compact` pour résumer les longues sessions.
- Réduisez les sorties volumineuses des outils dans vos flux de travail.
- Diminuez `agents.defaults.imageMaxDimensionPx` pour les sessions comportant de nombreuses captures d’écran.
- Gardez les descriptions des Skills courtes (la liste des Skills est injectée dans le prompt).
- Privilégiez des modèles plus petits pour les tâches exploratoires et produisant des réponses détaillées.

Consultez [Skills](/fr/tools/skills) pour connaître la formule exacte du surcoût lié à la liste des Skills.

## Contenu connexe

- [Utilisation et coûts de l’API](/fr/reference/api-usage-costs)
- [Mise en cache des prompts](/fr/reference/prompt-caching)
- [Suivi de l’utilisation](/fr/concepts/usage-tracking)
