---
read_when:
    - Vous déboguez des rejets de requêtes du fournisseur liés à la structure de la transcription
    - Vous modifiez la logique de nettoyage des transcriptions ou de réparation des appels d’outil
    - Vous examinez les incohérences d’ID d’appel d’outil entre les fournisseurs
summary: 'Référence : règles d’assainissement et de réparation des transcriptions propres à chaque fournisseur'
title: Hygiène des transcriptions
x-i18n:
    generated_at: "2026-05-02T07:19:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6976d4349e47954f49c9dbf300822013851b604ed665f4ab647c62025760a96c
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw applique des **correctifs propres aux fournisseurs** aux transcriptions avant une exécution (construction du contexte du modèle). La plupart sont des ajustements **en mémoire** utilisés pour satisfaire les exigences strictes des fournisseurs. Une passe distincte de réparation des fichiers de session peut également réécrire le JSONL stocké avant le chargement de la session, soit en supprimant les lignes JSONL mal formées, soit en réparant les tours persistés qui sont syntaxiquement valides mais connus pour être rejetés par un
fournisseur pendant la relecture. Lorsqu’une réparation a lieu, le fichier d’origine est sauvegardé à côté
du fichier de session.

Le périmètre inclut :

- Le contexte d’invite uniquement runtime qui reste hors des tours de transcription visibles par l’utilisateur
- La sanitisation des identifiants d’appel d’outil
- La validation des entrées d’appel d’outil
- La réparation de l’appariement des résultats d’outil
- La validation / l’ordonnancement des tours
- Le nettoyage des signatures de pensée
- Le nettoyage des signatures de réflexion
- La sanitisation des charges utiles d’image
- Le nettoyage des blocs de texte vides avant la relecture par le fournisseur
- Le balisage de provenance des entrées utilisateur (pour les invites routées entre sessions)
- La réparation des tours d’erreur assistant vides pour la relecture Bedrock Converse

Si vous avez besoin des détails de stockage des transcriptions, consultez :

- [Analyse approfondie de la gestion des sessions](/fr/reference/session-management-compaction)

---

## Règle globale : le contexte runtime n’est pas la transcription utilisateur

Le contexte runtime/système peut être ajouté à l’invite du modèle pour un tour, mais il ne s’agit
pas de contenu rédigé par l’utilisateur final. OpenClaw conserve un corps d’invite distinct
destiné à la transcription pour les réponses Gateway, les suivis mis en file d’attente, ACP, CLI et les exécutions Pi
intégrées. Les tours utilisateur visibles stockés utilisent ce corps de transcription au lieu de
l’invite enrichie par le runtime.

Pour les sessions héritées qui ont déjà persisté des enveloppes runtime, les surfaces d’historique
Gateway appliquent une projection d’affichage avant de renvoyer les messages aux clients WebChat,
TUI, REST ou SSE.

---

## Où cela s’exécute

Toute l’hygiène des transcriptions est centralisée dans le runner intégré :

- Sélection de la politique : `src/agents/transcript-policy.ts`
- Application de la sanitisation/réparation : `sanitizeSessionHistory` dans `src/agents/pi-embedded-runner/replay-history.ts`

La politique utilise `provider`, `modelApi` et `modelId` pour décider quoi appliquer.

Indépendamment de l’hygiène des transcriptions, les fichiers de session sont réparés (si nécessaire) avant le chargement :

- `repairSessionFileIfNeeded` dans `src/agents/session-file-repair.ts`
- Appelé depuis `run/attempt.ts` et `compact.ts` (runner intégré)

---

## Règle globale : sanitisation des images

Les charges utiles d’image sont toujours sanitisées afin d’éviter les rejets côté fournisseur dus aux limites
de taille (réduction d’échelle/recompression des images base64 surdimensionnées).

Cela aide aussi à maîtriser la pression de tokens liée aux images pour les modèles capables de vision.
Des dimensions maximales plus faibles réduisent généralement l’utilisation de tokens ; des dimensions plus élevées préservent les détails.

Implémentation :

- `sanitizeSessionMessagesImages` dans `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` dans `src/agents/tool-images.ts`
- Le côté maximal de l’image est configurable via `agents.defaults.imageMaxDimensionPx` (par défaut : `1200`).
- Les blocs de texte vides sont supprimés pendant que cette passe parcourt le contenu de relecture. Les tours assistant
  qui deviennent vides sont supprimés de la copie de relecture ; les tours utilisateur et de résultat d’outil
  qui deviennent vides reçoivent un espace réservé non vide pour contenu omis.

---

## Règle globale : appels d’outil mal formés

Les blocs d’appel d’outil assistant auxquels il manque à la fois `input` et `arguments` sont supprimés
avant la construction du contexte du modèle. Cela évite les rejets fournisseur dus à des appels d’outil partiellement
persistés (par exemple après un échec lié à une limite de débit).

Implémentation :

- `sanitizeToolCallInputs` dans `src/agents/session-transcript-repair.ts`
- Appliqué dans `sanitizeSessionHistory` dans `src/agents/pi-embedded-runner/replay-history.ts`

---

## Règle globale : provenance des entrées intersessions

Lorsqu’un agent envoie une invite dans une autre session via `sessions_send` (y compris
les étapes de réponse/annonce d’agent à agent), OpenClaw persiste le tour utilisateur créé avec :

- `message.provenance.kind = "inter_session"`

OpenClaw préfixe aussi le même tour avec un marqueur `[Message intersession ... isUser=false]`
avant le texte de l’invite routée afin que l’appel au modèle actif puisse distinguer
la sortie d’une session étrangère des instructions externes de l’utilisateur final. Ce marqueur inclut
la session source, le canal et l’outil lorsqu’ils sont disponibles. La transcription utilise toujours
`role: "user"` pour la compatibilité fournisseur, mais le texte visible et les métadonnées
de provenance marquent tous deux le tour comme données intersessions.

Lors de la reconstruction du contexte, OpenClaw applique le même marqueur aux anciens tours utilisateur
intersessions persistés qui ne disposent que de métadonnées de provenance.

---

## Matrice des fournisseurs (comportement actuel)

**OpenAI / OpenAI Codex**

- Sanitisation des images uniquement.
- Supprime les signatures de raisonnement orphelines (éléments de raisonnement autonomes sans bloc de contenu suivant) pour les transcriptions OpenAI Responses/Codex, et supprime le raisonnement OpenAI rejouable après un changement de route de modèle.
- Préserve les charges utiles d’éléments de raisonnement OpenAI Responses rejouables, y compris les éléments de résumé vide chiffrés, afin que la relecture manuelle/WebSocket conserve l’état `rs_*` requis associé aux éléments de sortie assistant.
- Pas de sanitisation des identifiants d’appel d’outil.
- La réparation de l’appariement des résultats d’outil peut déplacer les sorties réelles appariées et synthétiser des sorties `aborted` de style Codex pour les appels d’outil manquants.
- Pas de validation ni de réordonnancement des tours.
- Les sorties d’outil manquantes de la famille OpenAI Responses sont synthétisées comme `aborted` pour correspondre à la normalisation de relecture Codex.
- Pas de suppression des signatures de pensée.

**Gemma 4 compatible OpenAI**

- Les blocs historiques de réflexion/raisonnement assistant sont supprimés avant la relecture afin que les serveurs Gemma 4 locaux
  compatibles OpenAI ne reçoivent pas de contenu de raisonnement de tours précédents.
- Les continuations d’appel d’outil du même tour courant conservent le bloc de raisonnement assistant
  attaché à l’appel d’outil jusqu’à ce que le résultat d’outil ait été rejoué.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitisation des identifiants d’appel d’outil : strictement alphanumérique.
- Réparation de l’appariement des résultats d’outil et résultats d’outil synthétiques.
- Validation des tours (alternance de tours de style Gemini).
- Correction de l’ordonnancement des tours Google (ajout en tête d’un minuscule amorçage utilisateur si l’historique commence par l’assistant).
- Antigravity Claude : normalise les signatures de réflexion ; supprime les blocs de réflexion non signés.

**Anthropic / Minimax (compatible Anthropic)**

- Réparation de l’appariement des résultats d’outil et résultats d’outil synthétiques.
- Validation des tours (fusionne les tours utilisateur consécutifs pour satisfaire une alternance stricte).
- Les tours de préremplissage assistant finaux sont supprimés des charges utiles Anthropic Messages
  sortantes lorsque la réflexion est activée, y compris les routes Cloudflare AI Gateway.
- Les blocs de réflexion avec des signatures de relecture manquantes, vides ou blanches sont supprimés
  avant la conversion fournisseur. Si cela vide un tour assistant, OpenClaw conserve
  la forme du tour avec un texte non vide de raisonnement omis.
- Les anciens tours assistant composés uniquement de réflexion qui doivent être supprimés sont remplacés par
  un texte non vide de raisonnement omis afin que les adaptateurs fournisseur ne suppriment pas le tour
  de relecture.

**Amazon Bedrock (Converse API)**

- Les tours d’erreur de flux assistant vides sont réparés en un bloc de texte de secours non vide
  avant la relecture. Bedrock Converse rejette les messages assistant avec `content: []`, donc
  les tours assistant persistés avec `stopReason: "error"` et un contenu vide sont aussi
  réparés sur disque avant le chargement.
- Les tours d’erreur de flux assistant qui ne contiennent que des blocs de texte blancs sont supprimés
  de la copie de relecture en mémoire au lieu de rejouer un bloc blanc invalide.
- Les blocs de réflexion Claude avec des signatures de relecture manquantes, vides ou blanches sont
  supprimés avant la relecture Converse. Si cela vide un tour assistant, OpenClaw
  conserve la forme du tour avec un texte non vide de raisonnement omis.
- Les anciens tours assistant composés uniquement de réflexion qui doivent être supprimés sont remplacés par
  un texte non vide de raisonnement omis afin que la relecture Converse conserve une forme de tour stricte.
- La relecture filtre les tours assistant miroir de livraison OpenClaw et injectés par Gateway.
- La sanitisation des images s’applique via la règle globale.

**Mistral (y compris la détection basée sur l’identifiant de modèle)**

- Sanitisation des identifiants d’appel d’outil : strict9 (alphanumérique, longueur 9).

**OpenRouter Gemini**

- Nettoyage des signatures de pensée : supprime les valeurs `thought_signature` non base64 (conserve la base64).

**OpenRouter Anthropic**

- Les tours de préremplissage assistant finaux sont supprimés des charges utiles de modèles Anthropic
  compatibles OpenAI vérifiés d’OpenRouter lorsque le raisonnement est activé, conformément
  au comportement de relecture Anthropic direct et Cloudflare Anthropic.

**Tout le reste**

- Sanitisation des images uniquement.

---

## Comportement historique (avant 2026.1.22)

Avant la version 2026.1.22, OpenClaw appliquait plusieurs couches d’hygiène des transcriptions :

- Une **extension transcript-sanitize** s’exécutait à chaque construction de contexte et pouvait :
  - Réparer l’appariement utilisation/résultat d’outil.
  - Sanitiser les identifiants d’appel d’outil (y compris un mode non strict qui préservait `_`/`-`).
- Le runner effectuait aussi une sanitisation propre au fournisseur, ce qui dupliquait le travail.
- Des mutations supplémentaires se produisaient en dehors de la politique fournisseur, notamment :
  - La suppression des balises `<final>` du texte assistant avant la persistance.
  - La suppression des tours d’erreur assistant vides.
  - Le rognage du contenu assistant après les appels d’outil.

Cette complexité a provoqué des régressions interfournisseurs (notamment l’appariement `call_id|fc_id`
d’`openai-responses`). Le nettoyage de 2026.1.22 a supprimé l’extension, centralisé
la logique dans le runner et rendu OpenAI **sans modification** au-delà de la sanitisation des images.

## Connexe

- [Gestion des sessions](/fr/concepts/session)
- [Élagage des sessions](/fr/concepts/session-pruning)
