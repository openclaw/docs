---
read_when:
    - Vous déboguez des rejets de requêtes de fournisseur liés à la forme de la transcription
    - Vous modifiez la sanitisation des transcriptions ou la logique de réparation des appels d’outils
    - Vous examinez les incohérences d’identifiants d’appels d’outils entre fournisseurs
summary: 'Référence : règles de nettoyage et de réparation des transcriptions propres aux fournisseurs'
title: Hygiène des transcriptions
x-i18n:
    generated_at: "2026-06-27T18:12:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca1c747b33dc0d6730281d6c91d28a0f8a85bcc5e5cb00dbdebdb55157871a7d
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw applique des **correctifs propres aux fournisseurs** aux transcriptions avant une exécution (lors de la construction du contexte du modèle). La plupart sont des ajustements **en mémoire** utilisés pour satisfaire des exigences strictes des fournisseurs. Une passe distincte de réparation des fichiers de session peut aussi réécrire le JSONL stocké avant le chargement de la session, mais seulement pour les lignes mal formées ou les tours persistés qui ne sont pas des enregistrements durables valides. Les réponses assistant livrées sont conservées sur disque ; la suppression du préremplissage assistant propre au fournisseur n’a lieu que lors de la construction des charges utiles sortantes. Lorsqu’une réparation a lieu, le fichier original est écrit dans un fichier frère transitoire `*.bak-<pid>-<ts>` avant le remplacement atomique, puis supprimé une fois le remplacement réussi ; la sauvegarde n’est conservée que si le nettoyage échoue lui-même (auquel cas le chemin est renvoyé).

Le périmètre comprend :

- Le contexte d’invite uniquement runtime qui reste hors des tours de transcription visibles par l’utilisateur
- L’assainissement des identifiants d’appel d’outil
- La validation des entrées d’appel d’outil
- La réparation de l’appariement des résultats d’outil
- La validation / l’ordonnancement des tours
- Le nettoyage des signatures de pensée
- Le nettoyage des signatures de réflexion
- L’assainissement des charges utiles d’image
- Le nettoyage des blocs de texte vides avant la relecture fournisseur
- Le nettoyage des tours de longueur incomplets uniquement composés de raisonnement avant la relecture fournisseur
- Le balisage de provenance des entrées utilisateur (pour les invites routées entre sessions)
- La réparation des tours d’erreur assistant vides pour la relecture Bedrock Converse

Si vous avez besoin de détails sur le stockage des transcriptions, consultez :

- [Analyse approfondie de la gestion des sessions](/fr/reference/session-management-compaction)

---

## Règle globale : le contexte runtime n’est pas la transcription utilisateur

Le contexte runtime/système peut être ajouté à l’invite du modèle pour un tour, mais ce n’est pas du contenu rédigé par l’utilisateur final. OpenClaw conserve un corps d’invite distinct orienté transcription pour les réponses Gateway, les suivis en file d’attente, ACP, CLI et les exécutions OpenClaw intégrées. Les tours utilisateur visibles stockés utilisent ce corps de transcription au lieu de l’invite enrichie par le runtime.

Pour les sessions héritées qui ont déjà persisté des enveloppes runtime, les surfaces d’historique Gateway appliquent une projection d’affichage avant de renvoyer les messages aux clients WebChat, TUI, REST ou SSE.

---

## Où cela s’exécute

Toute l’hygiène des transcriptions est centralisée dans le runner intégré :

- Sélection de la politique : `src/agents/transcript-policy.ts`
- Application de l’assainissement/réparation : `sanitizeSessionHistory` dans `src/agents/embedded-agent-runner/replay-history.ts`

La politique utilise `provider`, `modelApi` et `modelId` pour décider quoi appliquer.

Séparément de l’hygiène des transcriptions, les fichiers de session sont réparés (si nécessaire) avant le chargement :

- `repairSessionFileIfNeeded` dans `src/agents/session-file-repair.ts`
- Appelé depuis `run/attempt.ts` et `compact.ts` (runner intégré)

---

## Règle globale : assainissement des images

Les charges utiles d’image sont toujours assainies pour éviter un rejet côté fournisseur dû aux limites de taille (réduction d’échelle/recompression des images base64 trop volumineuses).

Cela aide également à contrôler la pression en tokens induite par les images pour les modèles capables de vision. Des dimensions maximales plus faibles réduisent généralement l’usage de tokens ; des dimensions plus élevées préservent les détails.

Implémentation :

- `sanitizeSessionMessagesImages` dans `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` dans `src/agents/tool-images.ts`
- Le côté maximal de l’image est configurable via `agents.defaults.imageMaxDimensionPx` (par défaut : `1200`).
- Les blocs de texte vides sont supprimés pendant que cette passe parcourt le contenu de relecture. Les tours assistant qui deviennent vides sont retirés de la copie de relecture ; les tours utilisateur et résultat d’outil qui deviennent vides reçoivent un placeholder non vide de contenu omis.

---

## Règle globale : appels d’outil mal formés

Les blocs d’appel d’outil assistant auxquels il manque à la fois `input` et `arguments` sont supprimés avant la construction du contexte du modèle. Cela évite les rejets fournisseur dus à des appels d’outil partiellement persistés (par exemple après un échec de limite de débit).

Implémentation :

- `sanitizeToolCallInputs` dans `src/agents/session-transcript-repair.ts`
- Appliqué dans `sanitizeSessionHistory` dans `src/agents/embedded-agent-runner/replay-history.ts`

---

## Règle globale : tours incomplets uniquement composés de raisonnement

Les tours assistant qui atteignent la limite de sortie du fournisseur avec uniquement du contenu de réflexion ou de réflexion masquée sont omis de la copie de relecture en mémoire. Ces tours contiennent un état fournisseur incomplet et peuvent porter une signature de réflexion partielle.

Les tours de longueur vides restent inchangés, tout comme les tours de longueur avec du texte visible, des appels d’outil ou des blocs de contenu inconnus. Les transcriptions stockées ne sont pas réécrites.

Implémentation :

- `normalizeAssistantReplayContent` dans `src/agents/embedded-agent-runner/replay-history.ts`

---

## Règle globale : provenance des entrées entre sessions

Lorsqu’un agent envoie une invite dans une autre session via `sessions_send` (y compris les étapes de réponse/annonce agent à agent), OpenClaw persiste le tour utilisateur créé avec :

- `message.provenance.kind = "inter_session"`

OpenClaw préfixe également le texte de l’invite routée par un marqueur du même tour `[Inter-session message ... isUser=false]` afin que l’appel actif au modèle puisse distinguer une sortie de session étrangère d’instructions externes de l’utilisateur final. Ce marqueur inclut la session source, le canal et l’outil lorsqu’ils sont disponibles. La transcription utilise toujours `role: "user"` pour la compatibilité fournisseur, mais le texte visible et les métadonnées de provenance marquent tous deux le tour comme données inter-session.

Lors de la reconstruction du contexte, OpenClaw applique le même marqueur aux anciens tours utilisateur inter-session persistés qui n’ont que des métadonnées de provenance.

---

## Matrice des fournisseurs (comportement actuel)

**OpenAI / OpenAI Codex**

- Assainissement des images uniquement.
- Supprime les signatures de raisonnement orphelines (éléments de raisonnement autonomes sans bloc de contenu suivant) pour les transcriptions OpenAI Responses/Codex, et supprime le raisonnement OpenAI rejouable après un changement de route de modèle.
- Préserve les charges utiles d’éléments de raisonnement rejouables OpenAI Responses, y compris les éléments chiffrés à résumé vide, afin que la relecture manuelle/WebSocket conserve l’état `rs_*` requis apparié aux éléments de sortie assistant.
- Native ChatGPT Codex Responses suit la parité filaire Codex en rejouant les charges utiles antérieures Responses de raisonnement/message/fonction sans identifiants d’éléments antérieurs tout en préservant le `prompt_cache_key` de session.
- La relecture de la famille OpenAI Responses préserve les paires de raisonnement canoniques `call_*|fc_*` du même modèle, mais normalise de façon déterministe les `call_id` / identifiants d’éléments d’appel de fonction mal formés ou trop longs avant la conversion de charge utile pi-ai.
- La réparation de l’appariement des résultats d’outil peut déplacer de vraies sorties appariées et synthétiser des sorties Codex de style `aborted` pour les appels d’outil manquants.
- Aucune validation ni réorganisation des tours.
- Les sorties d’outil manquantes de la famille OpenAI Responses sont synthétisées en `aborted` pour correspondre à la normalisation de relecture Codex.
- Aucune suppression de signature de pensée.

**OpenAI-compatible Chat Completions**

- Les blocs historiques de réflexion/raisonnement assistant sont supprimés avant la relecture afin que les serveurs locaux et de type proxy compatibles OpenAI ne reçoivent pas de champs de raisonnement des tours précédents comme `reasoning` ou `reasoning_content`.
- Les continuations d’appel d’outil du même tour actuel conservent le bloc de raisonnement assistant attaché à l’appel d’outil jusqu’à ce que le résultat d’outil ait été rejoué.
- Les entrées de modèles personnalisés/auto-hébergés avec `reasoning: true` préservent les métadonnées de raisonnement rejouées.
- Les exceptions détenues par le fournisseur peuvent se désinscrire lorsque leur protocole filaire exige les métadonnées de raisonnement rejouées.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Assainissement des identifiants d’appel d’outil : alphanumérique strict.
- Réparation de l’appariement des résultats d’outil et résultats d’outil synthétiques.
- Validation des tours (alternance de tours de style Gemini).
- Correction d’ordonnancement des tours Google (préfixe un minuscule amorçage utilisateur si l’historique commence par assistant).
- Antigravity Claude : normalise les signatures de réflexion ; supprime les blocs de réflexion non signés.

**Anthropic / Minimax (compatible Anthropic)**

- Réparation de l’appariement des résultats d’outil et résultats d’outil synthétiques.
- Validation des tours (fusionne les tours utilisateur consécutifs pour satisfaire l’alternance stricte).
- Les tours de préremplissage assistant finaux sont supprimés des charges utiles Anthropic Messages sortantes lorsque la réflexion est activée, y compris les routes Cloudflare AI Gateway.
- Les signatures de réflexion assistant antérieures à la Compaction sont supprimées avant la relecture fournisseur lorsqu’une session a été compactée. Les signatures de réflexion sont liées cryptographiquement au préfixe de conversation au moment de la génération ; après la Compaction, le préfixe change (le contenu résumé est remplacé par un résumé de compaction), donc rejouer les signatures originales conduit Anthropic à rejeter la requête avec "Invalid signature in thinking block". Le texte de réflexion est conservé comme bloc non signé, puis traité par la règle ci-dessous.
- Les blocs de réflexion avec des signatures de relecture manquantes, vides ou blanches sont supprimés avant la conversion fournisseur. Si cela vide un tour assistant, OpenClaw conserve la forme du tour avec un texte non vide de raisonnement omis.
- Les anciens tours assistant uniquement composés de réflexion qui doivent être supprimés sont remplacés par un texte non vide de raisonnement omis afin que les adaptateurs fournisseur ne suppriment pas le tour de relecture.

**Amazon Bedrock (Converse API)**

- Les tours d’erreur de flux assistant vides sont réparés en un bloc de texte de secours non vide avant la relecture. Bedrock Converse rejette les messages assistant avec `content: []`, donc les tours assistant persistés avec `stopReason: "error"` et un contenu vide sont également réparés sur disque avant le chargement.
- Les tours d’erreur de flux assistant qui ne contiennent que des blocs de texte blancs sont supprimés de la copie de relecture en mémoire au lieu de rejouer un bloc blanc invalide.
- Les signatures de réflexion assistant antérieures à la Compaction sont supprimées avant la relecture Converse lorsqu’une session a été compactée, pour la même raison qu’Anthropic ci-dessus.
- Les blocs de réflexion Claude avec des signatures de relecture manquantes, vides ou blanches sont supprimés avant la relecture Converse. Si cela vide un tour assistant, OpenClaw conserve la forme du tour avec un texte non vide de raisonnement omis.
- Les anciens tours assistant uniquement composés de réflexion qui doivent être supprimés sont remplacés par un texte non vide de raisonnement omis afin que la relecture Converse conserve une forme de tour stricte.
- La relecture filtre les tours assistant miroir de livraison OpenClaw et injectés par Gateway.
- L’assainissement des images s’applique via la règle globale.

**Mistral (y compris la détection basée sur l’identifiant de modèle)**

- Assainissement des identifiants d’appel d’outil : strict9 (longueur alphanumérique 9).

**OpenRouter Gemini**

- Nettoyage des signatures de pensée : supprime les valeurs `thought_signature` non base64 (conserve le base64).

**OpenRouter Anthropic**

- Les tours de préremplissage assistant finaux sont supprimés des charges utiles de modèles Anthropic compatibles OpenAI OpenRouter vérifiés lorsque le raisonnement est activé, ce qui correspond au comportement de relecture Anthropic direct et Cloudflare Anthropic.

**Tout le reste**

- Assainissement des images uniquement.

---

## Comportement historique (avant 2026.1.22)

Avant la version 2026.1.22, OpenClaw appliquait plusieurs couches d’hygiène des transcriptions :

- Une **extension transcript-sanitize** s’exécutait à chaque construction de contexte et pouvait :
  - Réparer l’appariement utilisation/résultat d’outil.
  - Assainir les identifiants d’appel d’outil (y compris un mode non strict qui préservait `_`/`-`).
- Le runner effectuait également un assainissement propre aux fournisseurs, ce qui dupliquait le travail.
- Des mutations supplémentaires avaient lieu hors de la politique fournisseur, notamment :
  - La suppression des balises `<final>` du texte assistant avant la persistance.
  - La suppression des tours d’erreur assistant vides.
  - La troncature du contenu assistant après les appels d’outil.

Cette complexité a provoqué des régressions entre fournisseurs (notamment l’appariement `call_id|fc_id` d’`openai-responses`). Le nettoyage de 2026.1.22 a supprimé l’extension, centralisé la logique dans le runner et rendu OpenAI **sans modification** au-delà de l’assainissement des images.

## Connexe

- [Gestion des sessions](/fr/concepts/session)
- [Élagage des sessions](/fr/concepts/session-pruning)
