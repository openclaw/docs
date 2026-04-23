---
read_when:
    - Vous déboguez des rejets de requêtes fournisseur liés à la forme de la transcription
    - Vous modifiez le nettoyage des transcriptions ou la logique de réparation des appels d’outils
    - Vous enquêtez sur des incohérences d’ID d’appel d’outil entre fournisseurs
summary: 'Référence : règles de nettoyage et de réparation des transcriptions spécifiques au fournisseur'
title: Hygiène des transcriptions
x-i18n:
    generated_at: "2026-04-23T07:11:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b528099b547155e5cf25be19e64a017d338b6f7b9c7ef51dc3ce2c2963193b8
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Hygiène des transcriptions (correctifs fournisseur)

Ce document décrit les **correctifs spécifiques au fournisseur** appliqués aux transcriptions avant une exécution
(construction du contexte du modèle). Ces ajustements d’hygiène sont **en mémoire** et servent à satisfaire
des exigences strictes des fournisseurs. Ces étapes d’hygiène **ne** réécrivent **pas** la transcription JSONL stockée
sur disque ; cependant, un passage séparé de réparation des fichiers de session peut réécrire des fichiers JSONL
malformés en supprimant les lignes invalides avant le chargement de la session. Lorsqu’une réparation a lieu, le fichier
d’origine est sauvegardé à côté du fichier de session.

La portée inclut :

- Assainissement des identifiants d’appel d’outil
- Validation des entrées d’appel d’outil
- Réparation de l’appariement des résultats d’outil
- Validation / ordonnancement des tours
- Nettoyage des signatures de pensée
- Assainissement des charges utiles d’image
- Marquage de provenance des entrées utilisateur (pour les prompts routés entre sessions)

Si vous avez besoin de détails sur le stockage des transcriptions, voir :

- [/reference/session-management-compaction](/fr/reference/session-management-compaction)

---

## Où cela s’exécute

Toute l’hygiène des transcriptions est centralisée dans l’exécuteur intégré :

- Sélection de politique : `src/agents/transcript-policy.ts`
- Application de l’assainissement/de la réparation : `sanitizeSessionHistory` dans `src/agents/pi-embedded-runner/replay-history.ts`

La politique utilise `provider`, `modelApi`, et `modelId` pour décider quoi appliquer.

Séparément de l’hygiène des transcriptions, les fichiers de session sont réparés (si nécessaire) avant chargement :

- `repairSessionFileIfNeeded` dans `src/agents/session-file-repair.ts`
- Appelé depuis `run/attempt.ts` et `compact.ts` (exécuteur intégré)

---

## Règle globale : assainissement des images

Les charges utiles d’image sont toujours assainies pour éviter les rejets côté fournisseur dus à des
limites de taille (réduction/récompression des images base64 surdimensionnées).

Cela aide aussi à contrôler la pression sur les jetons induite par les images pour les modèles compatibles vision.
Des dimensions maximales plus faibles réduisent généralement l’usage des jetons ; des dimensions plus élevées préservent davantage de détails.

Implémentation :

- `sanitizeSessionMessagesImages` dans `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` dans `src/agents/tool-images.ts`
- Le côté maximal d’image est configurable via `agents.defaults.imageMaxDimensionPx` (par défaut : `1200`).

---

## Règle globale : appels d’outil malformés

Les blocs d’appel d’outil assistant auxquels il manque à la fois `input` et `arguments` sont supprimés
avant la construction du contexte du modèle. Cela évite les rejets fournisseur dus à des appels d’outil
partiellement persistés (par exemple, après un échec de limite de débit).

Implémentation :

- `sanitizeToolCallInputs` dans `src/agents/session-transcript-repair.ts`
- Appliqué dans `sanitizeSessionHistory` dans `src/agents/pi-embedded-runner/replay-history.ts`

---

## Règle globale : provenance des entrées inter-sessions

Lorsqu’un agent envoie un prompt dans une autre session via `sessions_send` (y compris
les étapes de réponse/annonce d’agent à agent), OpenClaw persiste le tour utilisateur créé avec :

- `message.provenance.kind = "inter_session"`

Cette métadonnée est écrite au moment de l’ajout à la transcription et ne change pas le rôle
(`role: "user"` est conservé pour la compatibilité fournisseur). Les lecteurs de transcription peuvent utiliser
cela pour éviter de traiter les prompts internes routés comme des instructions rédigées par un utilisateur final.

Lors de la reconstruction du contexte, OpenClaw préfixe aussi en mémoire un court marqueur
`[Inter-session message]` à ces tours utilisateur afin que le modèle puisse les distinguer des
instructions externes d’utilisateur final.

---

## Matrice des fournisseurs (comportement actuel)

**OpenAI / OpenAI Codex**

- Assainissement des images uniquement.
- Supprime les signatures de raisonnement orphelines (éléments de raisonnement autonomes sans bloc de contenu suivant) pour les transcriptions OpenAI Responses/Codex.
- Pas d’assainissement des identifiants d’appel d’outil.
- Pas de réparation de l’appariement des résultats d’outil.
- Pas de validation ni de réordonnancement des tours.
- Pas de résultats d’outil synthétiques.
- Pas de suppression des signatures de pensée.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Assainissement des identifiants d’appel d’outil : alphanumérique strict.
- Réparation de l’appariement des résultats d’outil et résultats d’outil synthétiques.
- Validation des tours (alternance de tours de style Gemini).
- Correctif d’ordonnancement des tours Google (préfixe un minuscule bootstrap utilisateur si l’historique commence par assistant).
- Antigravity Claude : normalise les signatures de pensée ; supprime les blocs de pensée non signés.

**Anthropic / Minimax (compatibles Anthropic)**

- Réparation de l’appariement des résultats d’outil et résultats d’outil synthétiques.
- Validation des tours (fusionne les tours utilisateur consécutifs pour satisfaire une alternance stricte).

**Mistral (y compris détection basée sur l’ID de modèle)**

- Assainissement des identifiants d’appel d’outil : strict9 (alphanumérique longueur 9).

**OpenRouter Gemini**

- Nettoyage des signatures de pensée : supprime les valeurs `thought_signature` non base64 (conserve base64).

**Tout le reste**

- Assainissement des images uniquement.

---

## Comportement historique (avant 2026.1.22)

Avant la version 2026.1.22, OpenClaw appliquait plusieurs couches d’hygiène des transcriptions :

- Une extension **transcript-sanitize** s’exécutait à chaque construction de contexte et pouvait :
  - Réparer l’appariement utilisation/résultat d’outil.
  - Assainir les identifiants d’appel d’outil (y compris un mode non strict qui conservait `_`/`-`).
- L’exécuteur effectuait aussi un assainissement spécifique au fournisseur, ce qui dupliquait le travail.
- Des mutations supplémentaires se produisaient en dehors de la politique fournisseur, notamment :
  - Suppression des balises `<final>` du texte assistant avant persistance.
  - Suppression des tours d’erreur assistant vides.
  - Tronquage du contenu assistant après les appels d’outil.

Cette complexité a provoqué des régressions inter-fournisseurs (notamment sur l’appariement `openai-responses`
`call_id|fc_id`). Le nettoyage de 2026.1.22 a supprimé l’extension, centralisé
la logique dans l’exécuteur, et rendu OpenAI **intouché** au-delà de l’assainissement des images.
