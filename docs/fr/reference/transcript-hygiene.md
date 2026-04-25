---
read_when:
    - Vous déboguez des rejets de requêtes du fournisseur liés à la forme de la transcription
    - Vous modifiez la logique de nettoyage des transcriptions ou de réparation des appels d’outils
    - Vous enquêtez sur des incohérences d’ID d’appel d’outil entre fournisseurs
summary: 'Référence : règles de nettoyage et de réparation des transcriptions spécifiques aux fournisseurs'
title: Hygiène des transcriptions
x-i18n:
    generated_at: "2026-04-25T13:57:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00cac47fb9a238e3cb8b6ea69b47210685ca6769a31973b4aeef1d18e75d78e6
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

Ce document décrit les **correctifs spécifiques aux fournisseurs** appliqués aux transcriptions avant une exécution
(construction du contexte du modèle). Il s’agit d’ajustements **en mémoire** utilisés pour satisfaire des
exigences strictes des fournisseurs. Ces étapes d’hygiène ne **réécrivent pas** la transcription JSONL stockée
sur disque ; toutefois, un passage distinct de réparation des fichiers de session peut réécrire des fichiers JSONL mal formés
en supprimant les lignes invalides avant le chargement de la session. Lorsqu’une réparation a lieu, le fichier original
est sauvegardé à côté du fichier de session.

Le périmètre inclut :

- Le contexte de prompt uniquement à l’exécution, qui reste hors des tours de transcription visibles par l’utilisateur
- La sanitation des ID d’appel d’outil
- La validation des entrées d’appel d’outil
- La réparation de l’appariement des résultats d’outil
- La validation / l’ordonnancement des tours
- Le nettoyage des signatures de réflexion
- La sanitation des charges utiles d’images
- Le balisage de provenance des entrées utilisateur (pour les prompts routés inter-sessions)

Si vous avez besoin de détails sur le stockage des transcriptions, consultez :

- [Analyse approfondie de la gestion des sessions](/fr/reference/session-management-compaction)

---

## Règle globale : le contexte d’exécution n’est pas la transcription utilisateur

Le contexte d’exécution/système peut être ajouté au prompt du modèle pour un tour, mais ce
n’est pas du contenu rédigé par l’utilisateur final. OpenClaw conserve un corps de prompt séparé,
orienté transcription, pour les réponses Gateway, les suivis en file d’attente, ACP, la CLI, et les exécutions Pi
embarquées. Les tours utilisateur visibles stockés utilisent ce corps de transcription au lieu du
prompt enrichi par le contexte d’exécution.

Pour les sessions héritées qui ont déjà persisté des wrappers d’exécution, les
surfaces d’historique Gateway appliquent une projection d’affichage avant de renvoyer les messages à WebChat,
TUI, REST ou aux clients SSE.

---

## Où cela s’exécute

Toute l’hygiène de transcription est centralisée dans l’exécuteur embarqué :

- Sélection de politique : `src/agents/transcript-policy.ts`
- Application de la sanitation/réparation : `sanitizeSessionHistory` dans `src/agents/pi-embedded-runner/replay-history.ts`

La politique utilise `provider`, `modelApi`, et `modelId` pour décider quoi appliquer.

Séparément de l’hygiène de transcription, les fichiers de session sont réparés (si nécessaire) avant chargement :

- `repairSessionFileIfNeeded` dans `src/agents/session-file-repair.ts`
- Appelé depuis `run/attempt.ts` et `compact.ts` (exécuteur embarqué)

---

## Règle globale : sanitation des images

Les charges utiles d’images sont toujours nettoyées pour éviter un rejet côté fournisseur dû à des
limites de taille (réduction / recompression d’images base64 surdimensionnées).

Cela aide aussi à contrôler la pression de jetons induite par les images pour les modèles compatibles vision.
Des dimensions maximales plus faibles réduisent généralement l’utilisation de jetons ; des dimensions plus élevées préservent davantage de détails.

Implémentation :

- `sanitizeSessionMessagesImages` dans `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` dans `src/agents/tool-images.ts`
- Le côté maximal de l’image est configurable via `agents.defaults.imageMaxDimensionPx` (par défaut : `1200`).

---

## Règle globale : appels d’outil mal formés

Les blocs d’appel d’outil d’assistant qui n’ont ni `input` ni `arguments` sont supprimés
avant la construction du contexte du modèle. Cela évite les rejets du fournisseur dus à des
appels d’outil partiellement persistés (par exemple après un échec de limite de débit).

Implémentation :

- `sanitizeToolCallInputs` dans `src/agents/session-transcript-repair.ts`
- Appliqué dans `sanitizeSessionHistory` dans `src/agents/pi-embedded-runner/replay-history.ts`

---

## Règle globale : provenance des entrées inter-sessions

Lorsqu’un agent envoie un prompt dans une autre session via `sessions_send` (y compris
les étapes de réponse/annonce agent-à-agent), OpenClaw persiste le tour utilisateur créé avec :

- `message.provenance.kind = "inter_session"`

Ces métadonnées sont écrites au moment de l’ajout à la transcription et ne modifient pas le rôle
(`role: "user"` reste pour la compatibilité fournisseur). Les lecteurs de transcription peuvent utiliser cela
pour éviter de traiter des prompts internes routés comme des instructions rédigées par l’utilisateur final.

Pendant la reconstruction du contexte, OpenClaw ajoute aussi en préfixe un court marqueur `[Inter-session message]`
à ces tours utilisateur en mémoire afin que le modèle puisse les distinguer des
instructions externes de l’utilisateur final.

---

## Matrice des fournisseurs (comportement actuel)

**OpenAI / OpenAI Codex**

- Sanitation des images uniquement.
- Suppression des signatures de raisonnement orphelines (éléments de raisonnement autonomes sans bloc de contenu suivant) pour les transcriptions OpenAI Responses/Codex, et suppression du raisonnement OpenAI rejouable après un changement de routage de modèle.
- Aucune sanitation des ID d’appel d’outil.
- La réparation de l’appariement des résultats d’outil peut déplacer des sorties réelles correspondantes et synthétiser des sorties de style Codex `aborted` pour les appels d’outil manquants.
- Aucune validation ni réordonnancement des tours.
- Les sorties d’outil manquantes de la famille OpenAI Responses sont synthétisées comme `aborted` pour correspondre à la normalisation de relecture Codex.
- Aucune suppression des signatures de réflexion.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitation des ID d’appel d’outil : alphanumérique stricte.
- Réparation de l’appariement des résultats d’outil et résultats d’outil synthétiques.
- Validation des tours (alternance de tours de style Gemini).
- Correctif d’ordonnancement des tours Google (ajout en préfixe d’un minuscule bootstrap utilisateur si l’historique commence par l’assistant).
- Antigravity Claude : normalisation des signatures de réflexion ; suppression des blocs de réflexion non signés.

**Anthropic / Minimax (compatibles Anthropic)**

- Réparation de l’appariement des résultats d’outil et résultats d’outil synthétiques.
- Validation des tours (fusion des tours utilisateur consécutifs pour satisfaire l’alternance stricte).

**Mistral (y compris la détection basée sur l’ID de modèle)**

- Sanitation des ID d’appel d’outil : strict9 (alphanumérique de longueur 9).

**OpenRouter Gemini**

- Nettoyage des signatures de réflexion : suppression des valeurs `thought_signature` non base64 (conserver base64).

**Tout le reste**

- Sanitation des images uniquement.

---

## Comportement historique (avant 2026.1.22)

Avant la version 2026.1.22, OpenClaw appliquait plusieurs couches d’hygiène de transcription :

- Une extension **transcript-sanitize** s’exécutait à chaque construction de contexte et pouvait :
  - Réparer l’appariement utilisation/résultat des outils.
  - Nettoyer les ID d’appel d’outil (y compris un mode non strict qui conservait `_`/`-`).
- L’exécuteur effectuait aussi une sanitation spécifique au fournisseur, ce qui faisait doublon.
- Des mutations supplémentaires avaient lieu en dehors de la politique fournisseur, notamment :
  - Suppression des balises `<final>` du texte assistant avant persistance.
  - Suppression des tours d’erreur assistant vides.
  - Tronquage du contenu assistant après les appels d’outil.

Cette complexité a provoqué des régressions inter-fournisseurs (notamment l’appariement `openai-responses`
`call_id|fc_id`). Le nettoyage de 2026.1.22 a supprimé l’extension, centralisé la
logique dans l’exécuteur, et rendu OpenAI **sans intervention** au-delà de la sanitation des images.

## Liens connexes

- [Gestion des sessions](/fr/concepts/session)
- [Élagage des sessions](/fr/concepts/session-pruning)
