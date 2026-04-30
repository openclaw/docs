---
read_when:
    - Vous déboguez des rejets de requêtes du fournisseur liés à la structure de la transcription
    - Vous modifiez la logique de nettoyage des transcriptions ou de réparation des appels d’outils
    - Vous examinez des discordances d’identifiants d’appels d’outils entre les fournisseurs
summary: 'Référence : règles d’assainissement et de réparation des transcriptions spécifiques aux fournisseurs'
title: Hygiène de la transcription
x-i18n:
    generated_at: "2026-04-30T07:48:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: d95f065d87ce58019ff2e6cdd6801879404d3b4fa402d26fc6fed9d51966b0a1
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw applique des **correctifs propres aux fournisseurs** aux transcriptions avant une exécution (construction du contexte du modèle). La plupart sont des ajustements **en mémoire** utilisés pour satisfaire des exigences strictes des fournisseurs. Une passe distincte de réparation du fichier de session peut aussi réécrire le JSONL stocké avant le chargement de la session, soit en supprimant les lignes JSONL mal formées, soit en réparant des tours persistés syntaxiquement valides mais connus pour être rejetés par un
fournisseur pendant la relecture. Lorsqu’une réparation a lieu, le fichier d’origine est sauvegardé à côté
du fichier de session.

Le périmètre inclut :

- Le contexte d’invite utilisé uniquement à l’exécution reste hors des tours de transcription visibles par l’utilisateur
- Nettoyage des identifiants d’appel d’outil
- Validation des entrées d’appel d’outil
- Réparation de l’association des résultats d’outil
- Validation / ordonnancement des tours
- Nettoyage des signatures de pensée
- Nettoyage des signatures de raisonnement
- Nettoyage des charges utiles d’image
- Nettoyage des blocs de texte vides avant la relecture par le fournisseur
- Marquage de provenance des entrées utilisateur (pour les invites routées entre sessions)
- Réparation des tours d’erreur d’assistant vides pour la relecture Bedrock Converse

Si vous avez besoin de détails sur le stockage des transcriptions, consultez :

- [Analyse approfondie de la gestion des sessions](/fr/reference/session-management-compaction)

---

## Règle globale : le contexte d’exécution n’est pas la transcription utilisateur

Le contexte d’exécution/système peut être ajouté à l’invite du modèle pour un tour, mais ce n’est
pas du contenu rédigé par l’utilisateur final. OpenClaw conserve un corps d’invite
distinct destiné à la transcription pour les réponses Gateway, les suivis en file d’attente, ACP, CLI et les
exécutions Pi intégrées. Les tours utilisateur visibles stockés utilisent ce corps de transcription au lieu de
l’invite enrichie par le contexte d’exécution.

Pour les sessions historiques qui ont déjà persisté des enveloppes d’exécution, les surfaces d’historique
Gateway appliquent une projection d’affichage avant de renvoyer les messages aux clients WebChat,
TUI, REST ou SSE.

---

## Où cela s’exécute

Toute l’hygiène des transcriptions est centralisée dans l’exécuteur intégré :

- Sélection de la politique : `src/agents/transcript-policy.ts`
- Application du nettoyage/de la réparation : `sanitizeSessionHistory` dans `src/agents/pi-embedded-runner/replay-history.ts`

La politique utilise `provider`, `modelApi` et `modelId` pour décider quoi appliquer.

Indépendamment de l’hygiène des transcriptions, les fichiers de session sont réparés (si nécessaire) avant le chargement :

- `repairSessionFileIfNeeded` dans `src/agents/session-file-repair.ts`
- Appelé depuis `run/attempt.ts` et `compact.ts` (exécuteur intégré)

---

## Règle globale : nettoyage des images

Les charges utiles d’image sont toujours nettoyées pour éviter les rejets côté fournisseur dus aux limites
de taille (réduction d’échelle/recompression des images base64 surdimensionnées).

Cela aide aussi à contrôler la pression sur les jetons induite par les images pour les modèles capables de vision.
Des dimensions maximales plus faibles réduisent généralement l’utilisation des jetons ; des dimensions plus élevées préservent les détails.

Implémentation :

- `sanitizeSessionMessagesImages` dans `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` dans `src/agents/tool-images.ts`
- Le côté maximal d’une image est configurable via `agents.defaults.imageMaxDimensionPx` (valeur par défaut : `1200`).
- Les blocs de texte vides sont supprimés pendant que cette passe parcourt le contenu de relecture. Les tours
  d’assistant qui deviennent vides sont supprimés de la copie de relecture ; les tours utilisateur et de résultat
  d’outil qui deviennent vides reçoivent un espace réservé non vide indiquant du contenu omis.

---

## Règle globale : appels d’outil mal formés

Les blocs d’appel d’outil de l’assistant auxquels il manque à la fois `input` et `arguments` sont supprimés
avant la construction du contexte du modèle. Cela évite les rejets de fournisseur provoqués par des appels
d’outil partiellement persistés (par exemple après un échec dû à une limite de débit).

Implémentation :

- `sanitizeToolCallInputs` dans `src/agents/session-transcript-repair.ts`
- Appliqué dans `sanitizeSessionHistory` dans `src/agents/pi-embedded-runner/replay-history.ts`

---

## Règle globale : provenance des entrées entre sessions

Lorsqu’un agent envoie une invite dans une autre session via `sessions_send` (y compris les étapes
de réponse/annonce d’un agent à un autre), OpenClaw persiste le tour utilisateur créé avec :

- `message.provenance.kind = "inter_session"`

OpenClaw préfixe aussi le texte de l’invite routée avec un marqueur du même tour `[Inter-session message ... isUser=false]`
afin que l’appel au modèle actif puisse distinguer la sortie d’une session étrangère des instructions externes
de l’utilisateur final. Ce marqueur inclut la session source, le canal et l’outil lorsqu’ils sont disponibles. La transcription utilise toujours
`role: "user"` pour la compatibilité fournisseur, mais le texte visible et les métadonnées de provenance
marquent tous deux le tour comme données entre sessions.

Pendant la reconstruction du contexte, OpenClaw applique le même marqueur aux anciens tours utilisateur
entre sessions persistés qui n’ont que des métadonnées de provenance.

---

## Matrice des fournisseurs (comportement actuel)

**OpenAI / OpenAI Codex**

- Nettoyage des images uniquement.
- Suppression des signatures de raisonnement orphelines (éléments de raisonnement autonomes sans bloc de contenu suivant) pour les transcriptions OpenAI Responses/Codex, et suppression du raisonnement OpenAI relisible après un changement de route de modèle.
- Conservation des charges utiles des éléments de raisonnement OpenAI Responses relisibles, y compris les éléments chiffrés avec résumé vide, afin que la relecture manuelle/WebSocket conserve l’état `rs_*` requis associé aux éléments de sortie de l’assistant.
- Aucun nettoyage des identifiants d’appel d’outil.
- La réparation de l’association des résultats d’outil peut déplacer les sorties réelles correspondantes et synthétiser des sorties `aborted` de style Codex pour les appels d’outil manquants.
- Aucune validation ni réorganisation des tours.
- Les sorties d’outil manquantes de la famille OpenAI Responses sont synthétisées sous forme de `aborted` pour correspondre à la normalisation de relecture Codex.
- Aucune suppression des signatures de pensée.

**Gemma 4 compatible OpenAI**

- Les blocs historiques de pensée/raisonnement de l’assistant sont supprimés avant la relecture afin que les serveurs Gemma 4 locaux
  compatibles OpenAI ne reçoivent pas de contenu de raisonnement provenant de tours antérieurs.
- Les continuations d’appel d’outil du même tour actuel conservent le bloc de raisonnement de l’assistant
  attaché à l’appel d’outil jusqu’à ce que le résultat d’outil ait été relu.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Nettoyage des identifiants d’appel d’outil : alphanumérique strict.
- Réparation de l’association des résultats d’outil et résultats d’outil synthétiques.
- Validation des tours (alternance des tours de style Gemini).
- Correction de l’ordre des tours Google (préfixer un petit amorçage utilisateur si l’historique commence par l’assistant).
- Antigravity Claude : normaliser les signatures de raisonnement ; supprimer les blocs de raisonnement non signés.

**Anthropic / Minimax (compatible Anthropic)**

- Réparation de l’association des résultats d’outil et résultats d’outil synthétiques.
- Validation des tours (fusion des tours utilisateur consécutifs pour satisfaire l’alternance stricte).
- Les tours finaux de préremplissage de l’assistant sont supprimés des charges utiles Anthropic Messages
  sortantes lorsque le raisonnement est activé, y compris pour les routes Cloudflare AI Gateway.
- Les blocs de raisonnement dont les signatures de relecture sont manquantes, vides ou blanches sont supprimés
  avant la conversion fournisseur. Si cela vide un tour d’assistant, OpenClaw conserve
  la forme du tour avec un texte non vide indiquant le raisonnement omis.
- Les anciens tours d’assistant contenant uniquement du raisonnement et qui doivent être supprimés sont remplacés par
  un texte non vide indiquant le raisonnement omis afin que les adaptateurs fournisseur ne suppriment pas le tour
  de relecture.

**Amazon Bedrock (Converse API)**

- Les tours d’erreur de flux d’assistant vides sont réparés en un bloc de texte de secours non vide
  avant la relecture. Bedrock Converse rejette les messages d’assistant avec `content: []`, donc
  les tours d’assistant persistés avec `stopReason: "error"` et un contenu vide sont aussi
  réparés sur disque avant le chargement.
- Les tours d’erreur de flux d’assistant qui ne contiennent que des blocs de texte vides sont supprimés
  de la copie de relecture en mémoire au lieu de relire un bloc vide invalide.
- Les blocs de raisonnement Claude dont les signatures de relecture sont manquantes, vides ou blanches sont
  supprimés avant la relecture Converse. Si cela vide un tour d’assistant, OpenClaw
  conserve la forme du tour avec un texte non vide indiquant le raisonnement omis.
- Les anciens tours d’assistant contenant uniquement du raisonnement et qui doivent être supprimés sont remplacés par
  un texte non vide indiquant le raisonnement omis afin que la relecture Converse conserve une forme de tour stricte.
- La relecture filtre les tours d’assistant miroir de livraison OpenClaw et injectés par le Gateway.
- Le nettoyage des images s’applique via la règle globale.

**Mistral (y compris la détection basée sur l’identifiant de modèle)**

- Nettoyage des identifiants d’appel d’outil : strict9 (alphanumérique de longueur 9).

**OpenRouter Gemini**

- Nettoyage des signatures de pensée : supprimer les valeurs `thought_signature` non base64 (conserver le base64).

**Tout le reste**

- Nettoyage des images uniquement.

---

## Comportement historique (avant 2026.1.22)

Avant la version 2026.1.22, OpenClaw appliquait plusieurs couches d’hygiène des transcriptions :

- Une **extension de nettoyage des transcriptions** s’exécutait à chaque construction de contexte et pouvait :
  - Réparer l’association entre utilisation d’outil et résultat.
  - Nettoyer les identifiants d’appel d’outil (y compris un mode non strict qui conservait `_`/`-`).
- L’exécuteur effectuait aussi un nettoyage propre au fournisseur, ce qui dupliquait le travail.
- D’autres mutations se produisaient hors de la politique fournisseur, notamment :
  - Suppression des balises `<final>` du texte de l’assistant avant persistance.
  - Suppression des tours d’erreur d’assistant vides.
  - Rognage du contenu de l’assistant après les appels d’outil.

Cette complexité a provoqué des régressions entre fournisseurs (notamment l’association `call_id|fc_id` de
`openai-responses`). Le nettoyage de 2026.1.22 a supprimé l’extension, centralisé
la logique dans l’exécuteur et rendu OpenAI **sans modification** au-delà du nettoyage des images.

## Connexe

- [Gestion des sessions](/fr/concepts/session)
- [Élagage des sessions](/fr/concepts/session-pruning)
