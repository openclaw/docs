---
read_when:
    - Vous déboguez des rejets de requêtes de fournisseur liés à la structure de la transcription
    - Vous modifiez la logique de nettoyage des transcriptions ou de réparation des appels d’outils
    - Vous examinez les incohérences d’identifiants d’appels d’outils entre fournisseurs
summary: 'Référence : règles propres au fournisseur pour le nettoyage et la réparation des transcriptions'
title: Hygiène de la transcription
x-i18n:
    generated_at: "2026-05-05T01:50:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9441494f3e8bb18d1648acc789a40bf9501fe3f2d32b6293792e6a24710675d0
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw applique des **correctifs propres au fournisseur** aux transcriptions avant une exécution (construction du contexte du modèle). La plupart sont des ajustements **en mémoire** utilisés pour satisfaire des exigences strictes des fournisseurs. Une passe distincte de réparation du fichier de session peut aussi réécrire le JSONL stocké avant le chargement de la session, mais uniquement pour les lignes mal formées ou les tours persistés qui sont des enregistrements durables invalides. Les réponses d’assistant livrées sont préservées sur disque ; la suppression du préremplissage d’assistant propre au fournisseur n’a lieu que lors de la construction des charges utiles sortantes. Lorsqu’une réparation se produit, le fichier d’origine est sauvegardé à côté du fichier de session.

Le périmètre inclut :

- Le contexte d’invite uniquement à l’exécution restant hors des tours de transcription visibles par l’utilisateur
- L’assainissement des identifiants d’appels d’outil
- La validation des entrées d’appels d’outil
- La réparation de l’appariement des résultats d’outil
- La validation / l’ordonnancement des tours
- Le nettoyage des signatures de pensée
- Le nettoyage des signatures de réflexion
- L’assainissement des charges utiles d’image
- Le nettoyage des blocs de texte vides avant la relecture fournisseur
- Le balisage de la provenance des entrées utilisateur (pour les invites routées entre sessions)
- La réparation des tours d’erreur d’assistant vides pour la relecture Bedrock Converse

Si vous avez besoin de détails sur le stockage des transcriptions, consultez :

- [Analyse approfondie de la gestion des sessions](/fr/reference/session-management-compaction)

---

## Règle globale : le contexte d’exécution n’est pas la transcription utilisateur

Le contexte d’exécution/système peut être ajouté à l’invite du modèle pour un tour, mais ce n’est
pas du contenu rédigé par l’utilisateur final. OpenClaw conserve un corps d’invite
distinct destiné à la transcription pour les réponses Gateway, les suivis en file d’attente, ACP, CLI et les exécutions Pi
intégrées. Les tours utilisateur visibles stockés utilisent ce corps de transcription au lieu de l’invite
enrichie à l’exécution.

Pour les sessions héritées qui ont déjà persisté des enveloppes d’exécution, les surfaces d’historique Gateway
appliquent une projection d’affichage avant de renvoyer les messages aux clients WebChat,
TUI, REST ou SSE.

---

## Où cela s’exécute

Toute l’hygiène des transcriptions est centralisée dans l’exécuteur intégré :

- Sélection de la stratégie : `src/agents/transcript-policy.ts`
- Application de l’assainissement/de la réparation : `sanitizeSessionHistory` dans `src/agents/pi-embedded-runner/replay-history.ts`

La stratégie utilise `provider`, `modelApi` et `modelId` pour décider quoi appliquer.

Séparément de l’hygiène des transcriptions, les fichiers de session sont réparés (si nécessaire) avant le chargement :

- `repairSessionFileIfNeeded` dans `src/agents/session-file-repair.ts`
- Appelé depuis `run/attempt.ts` et `compact.ts` (exécuteur intégré)

---

## Règle globale : assainissement des images

Les charges utiles d’image sont toujours assainies pour éviter un rejet côté fournisseur dû aux limites
de taille (réduction d’échelle/recompression des images base64 surdimensionnées).

Cela aide aussi à maîtriser la pression en jetons causée par les images pour les modèles compatibles vision.
Des dimensions maximales plus faibles réduisent généralement l’utilisation de jetons ; des dimensions plus élevées préservent les détails.

Implémentation :

- `sanitizeSessionMessagesImages` dans `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` dans `src/agents/tool-images.ts`
- Le côté maximal de l’image est configurable via `agents.defaults.imageMaxDimensionPx` (par défaut : `1200`).
- Les blocs de texte vides sont supprimés pendant que cette passe parcourt le contenu de relecture. Les tours
  d’assistant qui deviennent vides sont retirés de la copie de relecture ; les tours utilisateur et de résultat
  d’outil qui deviennent vides reçoivent un espace réservé de contenu omis non vide.

---

## Règle globale : appels d’outil mal formés

Les blocs d’appels d’outil d’assistant auxquels il manque à la fois `input` et `arguments` sont supprimés
avant la construction du contexte du modèle. Cela évite les rejets fournisseur dus à des appels d’outil
partiellement persistés (par exemple, après un échec de limite de débit).

Implémentation :

- `sanitizeToolCallInputs` dans `src/agents/session-transcript-repair.ts`
- Appliqué dans `sanitizeSessionHistory` dans `src/agents/pi-embedded-runner/replay-history.ts`

---

## Règle globale : provenance des entrées entre sessions

Lorsqu’un agent envoie une invite dans une autre session via `sessions_send` (y compris
les étapes de réponse/annonce d’agent à agent), OpenClaw persiste le tour utilisateur créé avec :

- `message.provenance.kind = "inter_session"`

OpenClaw préfixe aussi le texte de l’invite routée par un marqueur de même tour `[Inter-session message ... isUser=false]`
afin que l’appel de modèle actif puisse distinguer
la sortie de session étrangère des instructions externes de l’utilisateur final. Ce marqueur inclut
la session source, le canal et l’outil lorsqu’ils sont disponibles. La transcription utilise toujours
`role: "user"` pour la compatibilité fournisseur, mais le texte visible et les métadonnées de provenance
marquent tous deux le tour comme des données entre sessions.

Lors de la reconstruction du contexte, OpenClaw applique le même marqueur aux anciens tours utilisateur
entre sessions persistés qui ne disposent que de métadonnées de provenance.

---

## Matrice des fournisseurs (comportement actuel)

**OpenAI / OpenAI Codex**

- Assainissement des images uniquement.
- Supprimer les signatures de raisonnement orphelines (éléments de raisonnement autonomes sans bloc de contenu suivant) pour les transcriptions OpenAI Responses/Codex, et supprimer le raisonnement OpenAI rejouable après un changement de route de modèle.
- Préserver les charges utiles d’éléments de raisonnement rejouables OpenAI Responses, y compris les éléments chiffrés à résumé vide, afin que la relecture manuelle/WebSocket conserve l’état `rs_*` requis apparié aux éléments de sortie de l’assistant.
- Native ChatGPT Codex Responses suit la parité filaire Codex en rejouant les charges utiles de raisonnement/message/fonction Responses antérieures sans identifiants d’éléments antérieurs tout en préservant la session `prompt_cache_key`.
- Aucun assainissement des identifiants d’appels d’outil.
- La réparation de l’appariement des résultats d’outil peut déplacer les sorties réelles appariées et synthétiser des sorties `aborted` de style Codex pour les appels d’outil manquants.
- Aucune validation ni réorganisation des tours.
- Les sorties d’outil manquantes de la famille OpenAI Responses sont synthétisées comme `aborted` pour correspondre à la normalisation de relecture Codex.
- Aucune suppression de signature de pensée.

**Gemma 4 compatible OpenAI**

- Les blocs historiques de réflexion/raisonnement d’assistant sont supprimés avant la relecture afin que les serveurs
  Gemma 4 locaux compatibles OpenAI ne reçoivent pas le contenu de raisonnement des tours précédents.
- Les continuations d’appels d’outil du même tour actuel conservent le bloc de raisonnement de l’assistant
  attaché à l’appel d’outil jusqu’à ce que le résultat d’outil ait été rejoué.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Assainissement des identifiants d’appels d’outil : alphanumérique strict.
- Réparation de l’appariement des résultats d’outil et résultats d’outil synthétiques.
- Validation des tours (alternance de tours de style Gemini).
- Correction de l’ordre des tours Google (préfixer un minuscule amorçage utilisateur si l’historique commence par l’assistant).
- Antigravity Claude : normaliser les signatures de réflexion ; supprimer les blocs de réflexion non signés.

**Anthropic / Minimax (compatible Anthropic)**

- Réparation de l’appariement des résultats d’outil et résultats d’outil synthétiques.
- Validation des tours (fusion des tours utilisateur consécutifs pour satisfaire l’alternance stricte).
- Les tours de préremplissage d’assistant finaux sont supprimés des charges utiles Anthropic Messages
  sortantes lorsque la réflexion est activée, y compris les routes Cloudflare AI Gateway.
- Les blocs de réflexion avec des signatures de relecture manquantes, vides ou blanches sont supprimés
  avant la conversion fournisseur. Si cela vide un tour d’assistant, OpenClaw conserve
  la forme du tour avec un texte de raisonnement omis non vide.
- Les anciens tours d’assistant contenant uniquement de la réflexion qui doivent être supprimés sont remplacés par
  un texte de raisonnement omis non vide afin que les adaptateurs fournisseur ne suppriment pas le tour
  de relecture.

**Amazon Bedrock (Converse API)**

- Les tours d’erreur de flux d’assistant vides sont réparés en un bloc de texte de secours non vide
  avant la relecture. Bedrock Converse rejette les messages d’assistant avec `content: []`, donc
  les tours d’assistant persistés avec `stopReason: "error"` et un contenu vide sont aussi
  réparés sur disque avant le chargement.
- Les tours d’erreur de flux d’assistant qui ne contiennent que des blocs de texte blancs sont supprimés
  de la copie de relecture en mémoire au lieu de rejouer un bloc blanc invalide.
- Les blocs de réflexion Claude avec des signatures de relecture manquantes, vides ou blanches sont
  supprimés avant la relecture Converse. Si cela vide un tour d’assistant, OpenClaw
  conserve la forme du tour avec un texte de raisonnement omis non vide.
- Les anciens tours d’assistant contenant uniquement de la réflexion qui doivent être supprimés sont remplacés par
  un texte de raisonnement omis non vide afin que la relecture Converse conserve une forme de tour stricte.
- La relecture filtre les tours d’assistant miroir de livraison OpenClaw et injectés par Gateway.
- L’assainissement des images s’applique via la règle globale.

**Mistral (y compris la détection basée sur l’identifiant de modèle)**

- Assainissement des identifiants d’appels d’outil : strict9 (alphanumérique de longueur 9).

**OpenRouter Gemini**

- Nettoyage des signatures de pensée : supprimer les valeurs `thought_signature` non base64 (conserver base64).

**OpenRouter Anthropic**

- Les tours de préremplissage d’assistant finaux sont supprimés des charges utiles de modèle Anthropic
  compatibles OpenAI OpenRouter vérifiées lorsque le raisonnement est activé, conformément
  au comportement de relecture Anthropic direct et Cloudflare Anthropic.

**Tout le reste**

- Assainissement des images uniquement.

---

## Comportement historique (avant 2026.1.22)

Avant la version 2026.1.22, OpenClaw appliquait plusieurs couches d’hygiène des transcriptions :

- Une **extension d’assainissement de transcription** s’exécutait à chaque construction de contexte et pouvait :
  - Réparer l’appariement utilisation/résultat d’outil.
  - Assainir les identifiants d’appels d’outil (y compris un mode non strict qui préservait `_`/`-`).
- L’exécuteur effectuait aussi un assainissement propre au fournisseur, ce qui dupliquait le travail.
- Des mutations supplémentaires se produisaient hors de la stratégie fournisseur, notamment :
  - Suppression des balises `<final>` du texte d’assistant avant persistance.
  - Suppression des tours d’erreur d’assistant vides.
  - Troncature du contenu d’assistant après les appels d’outil.

Cette complexité a provoqué des régressions entre fournisseurs (notamment l’appariement `call_id|fc_id`
`openai-responses`). Le nettoyage de 2026.1.22 a supprimé l’extension, centralisé
la logique dans l’exécuteur et rendu OpenAI **sans modification** au-delà de l’assainissement des images.

## Connexe

- [Gestion des sessions](/fr/concepts/session)
- [Élagage des sessions](/fr/concepts/session-pruning)
