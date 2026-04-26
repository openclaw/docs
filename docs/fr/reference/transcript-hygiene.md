---
read_when:
    - Vous déboguez des rejets de requêtes du fournisseur liés à la forme de la transcription
    - Vous modifiez la logique de nettoyage des transcriptions ou de correction des appels d’outils
    - Vous enquêtez sur des incompatibilités d’identifiants d’appels d’outils entre fournisseurs
summary: 'Référence : règles de nettoyage et de correction des transcriptions spécifiques au fournisseur'
title: Hygiène des transcriptions
x-i18n:
    generated_at: "2026-04-26T11:38:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: e380be2b011afca5fedf89579e702c6d221d42e777c23bd766c8df07ff05ed18
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

Ce document décrit les **correctifs spécifiques au fournisseur** appliqués aux transcriptions avant une exécution
(construction du contexte du modèle). La plupart sont des ajustements **en mémoire** utilisés pour satisfaire
des exigences strictes des fournisseurs. Une passe distincte de correction des fichiers de session peut aussi réécrire
le JSONL stocké avant le chargement de la session, soit en supprimant des lignes JSONL mal formées, soit
en corrigeant des tours persistés qui sont syntaxiquement valides mais connus pour être rejetés par un
fournisseur lors de la relecture. Lorsqu’une correction a lieu, le fichier d’origine est sauvegardé à côté
du fichier de session.

Le périmètre inclut :

- Le contexte d’invite uniquement à l’exécution, hors des tours de transcription visibles par l’utilisateur
- Le nettoyage des identifiants d’appels d’outils
- La validation des entrées d’appels d’outils
- La correction de l’appariement des résultats d’outils
- La validation / l’ordre des tours
- Le nettoyage des signatures de réflexion
- Le nettoyage des signatures de thinking
- Le nettoyage des charges utiles d’image
- Le marquage de provenance des entrées utilisateur (pour les invites routées entre sessions)
- La correction des tours d’erreur assistant vides pour la relecture Bedrock Converse

Si vous avez besoin de détails sur le stockage des transcriptions, consultez :

- [Analyse approfondie de la gestion des sessions](/fr/reference/session-management-compaction)

---

## Règle globale : le contexte d’exécution n’est pas la transcription utilisateur

Le contexte d’exécution/système peut être ajouté à l’invite du modèle pour un tour, mais il
ne s’agit pas de contenu rédigé par l’utilisateur final. OpenClaw conserve un corps
d’invite distinct orienté transcription pour les réponses Gateway, les suivis en file d’attente, ACP, CLI,
et les exécutions Pi intégrées. Les tours utilisateur visibles stockés utilisent ce corps de transcription au lieu de
l’invite enrichie à l’exécution.

Pour les anciennes sessions qui ont déjà persisté des enveloppes d’exécution, les
surfaces d’historique Gateway appliquent une projection d’affichage avant de renvoyer les messages à WebChat,
TUI, REST, ou aux clients SSE.

---

## Où cela s’exécute

Toute l’hygiène des transcriptions est centralisée dans le runner intégré :

- Sélection de politique : `src/agents/transcript-policy.ts`
- Application du nettoyage/de la correction : `sanitizeSessionHistory` dans `src/agents/pi-embedded-runner/replay-history.ts`

La politique utilise `provider`, `modelApi`, et `modelId` pour décider de ce qu’il faut appliquer.

Séparément de l’hygiène des transcriptions, les fichiers de session sont corrigés (si nécessaire) avant le chargement :

- `repairSessionFileIfNeeded` dans `src/agents/session-file-repair.ts`
- Appelé depuis `run/attempt.ts` et `compact.ts` (runner intégré)

---

## Règle globale : nettoyage des images

Les charges utiles d’image sont toujours nettoyées pour empêcher un rejet côté fournisseur à cause de limites
de taille (réduction/recompression des images base64 trop volumineuses).

Cela aide aussi à contrôler la pression en tokens induite par les images pour les modèles compatibles vision.
Des dimensions maximales plus faibles réduisent généralement l’usage de tokens ; des dimensions plus élevées préservent davantage de détails.

Implémentation :

- `sanitizeSessionMessagesImages` dans `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` dans `src/agents/tool-images.ts`
- Le côté maximal de l’image est configurable via `agents.defaults.imageMaxDimensionPx` (par défaut : `1200`).

---

## Règle globale : appels d’outils mal formés

Les blocs d’appels d’outils assistant auxquels il manque à la fois `input` et `arguments` sont supprimés
avant la construction du contexte du modèle. Cela évite les rejets de fournisseurs dus à des appels d’outils
partiellement persistés (par exemple, après un échec lié à une limitation de débit).

Implémentation :

- `sanitizeToolCallInputs` dans `src/agents/session-transcript-repair.ts`
- Appliqué dans `sanitizeSessionHistory` dans `src/agents/pi-embedded-runner/replay-history.ts`

---

## Règle globale : provenance des entrées inter-sessions

Lorsqu’un agent envoie une invite dans une autre session via `sessions_send` (y compris
les étapes de réponse/annonce d’agent à agent), OpenClaw persiste le tour utilisateur créé avec :

- `message.provenance.kind = "inter_session"`

Cette métadonnée est écrite au moment de l’ajout à la transcription et ne change pas le rôle
(`role: "user"` est conservé pour la compatibilité fournisseur). Les lecteurs de transcription peuvent utiliser
cela pour éviter de traiter les invites internes routées comme des instructions rédigées par l’utilisateur final.

Lors de la reconstruction du contexte, OpenClaw préfixe aussi en mémoire ces tours utilisateur
par un court marqueur `[Inter-session message]` afin que le modèle puisse les distinguer des
instructions externes de l’utilisateur final.

---

## Matrice des fournisseurs (comportement actuel)

**OpenAI / OpenAI Codex**

- Nettoyage des images uniquement.
- Supprime les signatures de raisonnement orphelines (éléments de raisonnement autonomes sans bloc de contenu suivant) pour les transcriptions OpenAI Responses/Codex, et supprime le raisonnement OpenAI rejouable après un changement de routage du modèle.
- Aucun nettoyage des identifiants d’appels d’outils.
- La correction de l’appariement des résultats d’outils peut déplacer les sorties réelles correspondantes et synthétiser des sorties `aborted` de style Codex pour les appels d’outils manquants.
- Aucune validation ni réordonnancement des tours.
- Les sorties d’outils manquantes de la famille OpenAI Responses sont synthétisées comme `aborted` pour correspondre à la normalisation de relecture Codex.
- Aucun retrait des signatures de réflexion.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Nettoyage des identifiants d’appels d’outils : alphanumérique strict.
- Correction de l’appariement des résultats d’outils et résultats d’outils synthétiques.
- Validation des tours (alternance de tours de style Gemini).
- Correction de l’ordre des tours Google (préfixe d’un minuscule bootstrap utilisateur si l’historique commence par assistant).
- Antigravity Claude : normalise les signatures de thinking ; supprime les blocs de thinking non signés.

**Anthropic / Minimax (compatibles Anthropic)**

- Correction de l’appariement des résultats d’outils et résultats d’outils synthétiques.
- Validation des tours (fusion des tours utilisateur consécutifs pour satisfaire l’alternance stricte).
- Les blocs thinking avec des signatures de relecture manquantes, vides ou blanches sont supprimés
  avant la conversion fournisseur. Si cela vide un tour assistant, OpenClaw conserve
  la forme du tour avec un texte de raisonnement omis non vide.
- Les anciens tours assistant ne contenant que du thinking et qui doivent être supprimés sont remplacés par
  un texte de raisonnement omis non vide afin que les adaptateurs fournisseur ne suppriment pas le tour rejoué.

**Amazon Bedrock (API Converse)**

- Les tours d’erreur de flux assistant vides sont corrigés en un bloc de texte de repli non vide
  avant la relecture. Bedrock Converse rejette les messages assistant avec `content: []`, donc
  les tours assistant persistés avec `stopReason: "error"` et un contenu vide sont aussi
  corrigés sur disque avant le chargement.
- Les blocs thinking Claude avec des signatures de relecture manquantes, vides ou blanches sont
  supprimés avant la relecture Converse. Si cela vide un tour assistant, OpenClaw
  conserve la forme du tour avec un texte de raisonnement omis non vide.
- Les anciens tours assistant ne contenant que du thinking et qui doivent être supprimés sont remplacés par
  un texte de raisonnement omis non vide afin que la relecture Converse conserve une forme de tour stricte.
- La relecture filtre les tours assistant miroir de livraison OpenClaw et injectés par Gateway.
- Le nettoyage des images s’applique via la règle globale.

**Mistral (y compris la détection basée sur l’identifiant du modèle)**

- Nettoyage des identifiants d’appels d’outils : strict9 (alphanumérique de longueur 9).

**OpenRouter Gemini**

- Nettoyage des signatures de pensée : supprime les valeurs `thought_signature` non base64 (conserve le base64).

**Tout le reste**

- Nettoyage des images uniquement.

---

## Comportement historique (avant 2026.1.22)

Avant la version 2026.1.22, OpenClaw appliquait plusieurs couches d’hygiène de transcription :

- Une extension **transcript-sanitize** s’exécutait à chaque construction de contexte et pouvait :
  - Corriger l’appariement des utilisations/résultats d’outils.
  - Nettoyer les identifiants d’appels d’outils (y compris un mode non strict qui préservait `_`/`-`).
- Le runner effectuait aussi un nettoyage spécifique au fournisseur, ce qui dupliquait le travail.
- Des mutations supplémentaires se produisaient hors de la politique fournisseur, notamment :
  - Le retrait des balises `<final>` du texte assistant avant persistance.
  - La suppression des tours d’erreur assistant vides.
  - La troncature du contenu assistant après les appels d’outils.

Cette complexité a causé des régressions entre fournisseurs (notamment l’appariement
`openai-responses` `call_id|fc_id`). Le nettoyage de 2026.1.22 a supprimé l’extension, centralisé
la logique dans le runner, et rendu OpenAI **intouché** au-delà du nettoyage des images.

## Lié

- [Gestion des sessions](/fr/concepts/session)
- [Élagage des sessions](/fr/concepts/session-pruning)
