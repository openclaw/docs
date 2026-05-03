---
read_when:
    - Vous déboguez des rejets de requêtes par le fournisseur liés à la structure de la transcription
    - Vous modifiez la logique de nettoyage des transcriptions ou de réparation des appels d’outils
    - Vous examinez les incohérences d’identifiants d’appels d’outil entre fournisseurs
summary: 'Référence : règles d’assainissement et de réparation des transcriptions propres aux fournisseurs'
title: Hygiène des transcriptions
x-i18n:
    generated_at: "2026-05-03T07:15:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff3a364a4c4d1c0d1e03b2860396c2d7e32c554d7acd0791ed2eaadae06d35ab
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw applique des **correctifs propres aux fournisseurs** aux transcriptions avant une exécution (création du contexte du modèle). La plupart sont des ajustements **en mémoire** utilisés pour satisfaire des exigences strictes des fournisseurs. Une passe séparée de réparation des fichiers de session peut aussi réécrire le JSONL stocké avant le chargement de la session, mais uniquement pour les lignes mal formées ou les tours persistés qui ne sont pas des enregistrements durables valides. Les réponses d’assistant livrées sont préservées sur disque ; la suppression du préremplissage d’assistant propre au fournisseur se produit uniquement lors de la construction des charges utiles sortantes. Lorsqu’une réparation a lieu, le fichier original est sauvegardé à côté du fichier de session.

La portée inclut :

- Maintien du contexte d’invite uniquement runtime hors des tours de transcription visibles par l’utilisateur
- Assainissement des identifiants d’appel d’outil
- Validation des entrées d’appel d’outil
- Réparation de l’association des résultats d’outil
- Validation / ordonnancement des tours
- Nettoyage des signatures de pensée
- Nettoyage des signatures de raisonnement
- Assainissement des charges utiles d’image
- Nettoyage des blocs de texte vides avant la relecture fournisseur
- Marquage de provenance des entrées utilisateur (pour les invites routées entre sessions)
- Réparation des tours d’erreur assistant vides pour la relecture Bedrock Converse

Si vous avez besoin des détails de stockage des transcriptions, consultez :

- [Présentation détaillée de la gestion des sessions](/fr/reference/session-management-compaction)

---

## Règle globale : le contexte runtime n’est pas la transcription utilisateur

Le contexte runtime/système peut être ajouté à l’invite du modèle pour un tour, mais ce n’est
pas du contenu rédigé par l’utilisateur final. OpenClaw conserve un corps d’invite séparé
destiné à la transcription pour les réponses Gateway, les suivis en file d’attente, ACP, CLI et les
exécutions Pi intégrées. Les tours utilisateur visibles stockés utilisent ce corps de transcription
au lieu de l’invite enrichie par le runtime.

Pour les sessions héritées qui ont déjà persisté des enveloppes runtime, les surfaces d’historique
Gateway appliquent une projection d’affichage avant de renvoyer les messages aux clients WebChat,
TUI, REST ou SSE.

---

## Où cela s’exécute

Toute l’hygiène des transcriptions est centralisée dans le runner intégré :

- Sélection de la politique : `src/agents/transcript-policy.ts`
- Application de l’assainissement/réparation : `sanitizeSessionHistory` dans `src/agents/pi-embedded-runner/replay-history.ts`

La politique utilise `provider`, `modelApi` et `modelId` pour décider quoi appliquer.

Séparément de l’hygiène des transcriptions, les fichiers de session sont réparés (si nécessaire) avant le chargement :

- `repairSessionFileIfNeeded` dans `src/agents/session-file-repair.ts`
- Appelé depuis `run/attempt.ts` et `compact.ts` (runner intégré)

---

## Règle globale : assainissement des images

Les charges utiles d’image sont toujours assainies afin d’éviter le rejet côté fournisseur dû aux limites
de taille (réduction d’échelle/recompression des images base64 trop grandes).

Cela aide aussi à contrôler la pression des jetons due aux images pour les modèles compatibles vision.
Des dimensions maximales plus faibles réduisent généralement l’utilisation de jetons ; des dimensions plus élevées préservent les détails.

Implémentation :

- `sanitizeSessionMessagesImages` dans `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` dans `src/agents/tool-images.ts`
- Le côté maximal de l’image est configurable via `agents.defaults.imageMaxDimensionPx` (par défaut : `1200`).
- Les blocs de texte vides sont supprimés pendant que cette passe parcourt le contenu de relecture. Les tours assistant
  qui deviennent vides sont retirés de la copie de relecture ; les tours utilisateur et de résultat d’outil
  qui deviennent vides reçoivent un espace réservé non vide de contenu omis.

---

## Règle globale : appels d’outil mal formés

Les blocs d’appel d’outil d’assistant auxquels il manque à la fois `input` et `arguments` sont supprimés
avant la construction du contexte du modèle. Cela évite les rejets fournisseur dus à des appels d’outil
partiellement persistés (par exemple après un échec dû à une limite de débit).

Implémentation :

- `sanitizeToolCallInputs` dans `src/agents/session-transcript-repair.ts`
- Appliqué dans `sanitizeSessionHistory` dans `src/agents/pi-embedded-runner/replay-history.ts`

---

## Règle globale : provenance des entrées entre sessions

Lorsqu’un agent envoie une invite dans une autre session via `sessions_send` (y compris
les étapes de réponse/annonce d’agent à agent), OpenClaw persiste le tour utilisateur créé avec :

- `message.provenance.kind = "inter_session"`

OpenClaw ajoute aussi, au même tour, un marqueur `[Inter-session message ... isUser=false]`
avant le texte de l’invite routée afin que l’appel de modèle actif puisse distinguer
la sortie d’une session étrangère des instructions externes de l’utilisateur final. Ce marqueur inclut
la session source, le canal et l’outil lorsqu’ils sont disponibles. La transcription utilise toujours
`role: "user"` pour la compatibilité fournisseur, mais le texte visible et les métadonnées de provenance
marquent tous deux le tour comme données entre sessions.

Lors de la reconstruction du contexte, OpenClaw applique le même marqueur aux anciens
tours utilisateur entre sessions persistés qui n’ont que les métadonnées de provenance.

---

## Matrice des fournisseurs (comportement actuel)

**OpenAI / OpenAI Codex**

- Assainissement des images uniquement.
- Suppression des signatures de raisonnement orphelines (éléments de raisonnement autonomes sans bloc de contenu suivant) pour les transcriptions OpenAI Responses/Codex, et suppression du raisonnement OpenAI rejouable après un changement de route de modèle.
- Préservation des charges utiles d’éléments de raisonnement OpenAI Responses rejouables, y compris les éléments chiffrés à résumé vide, afin que la relecture manuelle/WebSocket conserve l’état `rs_*` requis associé aux éléments de sortie de l’assistant.
- Aucun assainissement des identifiants d’appel d’outil.
- La réparation de l’association des résultats d’outil peut déplacer de vraies sorties appariées et synthétiser des sorties de style Codex `aborted` pour les appels d’outil manquants.
- Aucune validation ni réorganisation des tours.
- Les sorties d’outil manquantes de la famille OpenAI Responses sont synthétisées sous forme de `aborted` pour correspondre à la normalisation de relecture Codex.
- Aucune suppression des signatures de pensée.

**Gemma 4 compatible OpenAI**

- Les blocs historiques de pensée/raisonnement de l’assistant sont supprimés avant la relecture afin que les serveurs
  Gemma 4 locaux compatibles OpenAI ne reçoivent pas de contenu de raisonnement de tour précédent.
- Les continuations d’appel d’outil du même tour actuel conservent le bloc de raisonnement de l’assistant
  attaché à l’appel d’outil jusqu’à ce que le résultat d’outil ait été rejoué.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Assainissement des identifiants d’appel d’outil : alphanumérique strict.
- Réparation de l’association des résultats d’outil et résultats d’outil synthétiques.
- Validation des tours (alternance de tours de style Gemini).
- Correctif d’ordonnancement des tours Google (ajoute au début un minuscule amorçage utilisateur si l’historique commence par l’assistant).
- Antigravity Claude : normalise les signatures de raisonnement ; supprime les blocs de raisonnement non signés.

**Anthropic / Minimax (compatible Anthropic)**

- Réparation de l’association des résultats d’outil et résultats d’outil synthétiques.
- Validation des tours (fusionne les tours utilisateur consécutifs pour satisfaire l’alternance stricte).
- Les tours de préremplissage assistant finaux sont supprimés des charges utiles Anthropic Messages
  sortantes lorsque le raisonnement est activé, y compris les routes Cloudflare AI Gateway.
- Les blocs de raisonnement dont les signatures de relecture sont manquantes, vides ou blanches sont supprimés
  avant la conversion fournisseur. Si cela vide un tour assistant, OpenClaw conserve
  la forme du tour avec un texte non vide de raisonnement omis.
- Les anciens tours assistant contenant uniquement du raisonnement qui doivent être supprimés sont remplacés par
  un texte non vide de raisonnement omis afin que les adaptateurs fournisseur ne suppriment pas le tour
  de relecture.

**Amazon Bedrock (Converse API)**

- Les tours d’erreur de flux assistant vides sont réparés en un bloc de texte de secours non vide
  avant la relecture. Bedrock Converse rejette les messages assistant avec `content: []`, donc
  les tours assistant persistés avec `stopReason: "error"` et un contenu vide sont aussi
  réparés sur disque avant le chargement.
- Les tours d’erreur de flux assistant qui ne contiennent que des blocs de texte blancs sont supprimés
  de la copie de relecture en mémoire au lieu de rejouer un bloc blanc invalide.
- Les blocs de raisonnement Claude dont les signatures de relecture sont manquantes, vides ou blanches sont
  supprimés avant la relecture Converse. Si cela vide un tour assistant, OpenClaw
  conserve la forme du tour avec un texte non vide de raisonnement omis.
- Les anciens tours assistant contenant uniquement du raisonnement qui doivent être supprimés sont remplacés par
  un texte non vide de raisonnement omis afin que la relecture Converse conserve une forme de tour stricte.
- La relecture filtre les tours assistant miroir de livraison OpenClaw et injectés par Gateway.
- L’assainissement des images s’applique via la règle globale.

**Mistral (y compris la détection basée sur l’identifiant de modèle)**

- Assainissement des identifiants d’appel d’outil : strict9 (alphanumérique de longueur 9).

**OpenRouter Gemini**

- Nettoyage des signatures de pensée : supprime les valeurs `thought_signature` non base64 (conserve base64).

**OpenRouter Anthropic**

- Les tours de préremplissage assistant finaux sont supprimés des charges utiles de modèle Anthropic
  compatibles OpenAI vérifiées d’OpenRouter lorsque le raisonnement est activé, conformément
  au comportement de relecture Anthropic direct et Cloudflare Anthropic.

**Tout le reste**

- Assainissement des images uniquement.

---

## Comportement historique (avant 2026.1.22)

Avant la version 2026.1.22, OpenClaw appliquait plusieurs couches d’hygiène des transcriptions :

- Une **extension transcript-sanitize** s’exécutait à chaque construction de contexte et pouvait :
  - Réparer l’association utilisation/résultat d’outil.
  - Assainir les identifiants d’appel d’outil (y compris un mode non strict qui préservait `_`/`-`).
- Le runner effectuait également un assainissement propre au fournisseur, ce qui dupliquait le travail.
- Des mutations supplémentaires se produisaient en dehors de la politique fournisseur, notamment :
  - Suppression des balises `<final>` du texte assistant avant persistance.
  - Suppression des tours d’erreur assistant vides.
  - Troncature du contenu assistant après les appels d’outil.

Cette complexité a provoqué des régressions inter-fournisseurs (notamment l’association `call_id|fc_id`
`openai-responses`). Le nettoyage de 2026.1.22 a supprimé l’extension, centralisé
la logique dans le runner, et rendu OpenAI **sans modification** au-delà de l’assainissement des images.

## Associé

- [Gestion des sessions](/fr/concepts/session)
- [Élagage des sessions](/fr/concepts/session-pruning)
