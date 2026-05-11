---
read_when:
    - Vous déboguez des rejets de requêtes du fournisseur liés à la structure de la transcription
    - Vous modifiez la logique d’assainissement des transcriptions ou de réparation des appels d’outil
    - Vous examinez les incohérences d’identifiants d’appels d’outils entre fournisseurs
summary: 'Référence : règles de nettoyage et de réparation des transcriptions propres aux fournisseurs'
title: Hygiène de la transcription
x-i18n:
    generated_at: "2026-05-11T20:55:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 197081fe829cf6463e84c5ead9b4c631a8088e771e68163a35ed39d9efbdbf6a
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw applique des **correctifs propres aux fournisseurs** aux transcriptions avant une exécution (construction du contexte du modèle). La plupart sont des ajustements **en mémoire** utilisés pour satisfaire les exigences strictes des fournisseurs. Une passe distincte de réparation des fichiers de session peut aussi réécrire le JSONL stocké avant le chargement de la session, mais uniquement pour les lignes mal formées ou les tours persistés qui ne sont pas des enregistrements durables valides. Les réponses d’assistant livrées sont conservées sur disque ; la suppression du préremplissage d’assistant propre au fournisseur se produit uniquement pendant la construction des payloads sortants. Lorsqu’une réparation a lieu, le fichier d’origine est sauvegardé à côté du fichier de session.

Le périmètre comprend :

- Le contexte d’invite uniquement à l’exécution qui reste en dehors des tours de transcription visibles par l’utilisateur
- La normalisation des identifiants d’appels d’outils
- La validation des entrées d’appels d’outils
- La réparation de l’appariement des résultats d’outils
- La validation / l’ordonnancement des tours
- Le nettoyage des signatures de pensée
- Le nettoyage des signatures de réflexion
- La normalisation des payloads d’image
- Le nettoyage des blocs de texte vides avant la relecture par le fournisseur
- Le marquage de provenance des entrées utilisateur (pour les invites routées entre sessions)
- La réparation des tours d’erreur d’assistant vides pour la relecture Bedrock Converse

Si vous avez besoin des détails de stockage des transcriptions, consultez :

- [Analyse approfondie de la gestion des sessions](/fr/reference/session-management-compaction)

---

## Règle globale : le contexte d’exécution n’est pas la transcription utilisateur

Le contexte d’exécution/système peut être ajouté à l’invite du modèle pour un tour, mais ce n’est
pas du contenu rédigé par l’utilisateur final. OpenClaw conserve un corps d’invite distinct destiné à la transcription
pour les réponses Gateway, les suivis en file d’attente, ACP, CLI et les exécutions Pi intégrées.
Les tours utilisateur visibles stockés utilisent ce corps de transcription au lieu de l’invite
enrichie par le contexte d’exécution.

Pour les sessions héritées qui ont déjà persisté des enveloppes d’exécution, les surfaces d’historique
Gateway appliquent une projection d’affichage avant de renvoyer les messages aux clients WebChat,
TUI, REST ou SSE.

---

## Où cela s’exécute

Toute l’hygiène des transcriptions est centralisée dans le runner intégré :

- Sélection de la politique : `src/agents/transcript-policy.ts`
- Application de la normalisation/réparation : `sanitizeSessionHistory` dans `src/agents/pi-embedded-runner/replay-history.ts`

La politique utilise `provider`, `modelApi` et `modelId` pour décider quoi appliquer.

Indépendamment de l’hygiène des transcriptions, les fichiers de session sont réparés (si nécessaire) avant le chargement :

- `repairSessionFileIfNeeded` dans `src/agents/session-file-repair.ts`
- Appelé depuis `run/attempt.ts` et `compact.ts` (runner intégré)

---

## Règle globale : normalisation des images

Les payloads d’image sont toujours normalisés afin d’éviter un rejet côté fournisseur dû aux limites de taille
(réduction d’échelle/recompression des images base64 trop volumineuses).

Cela aide aussi à contrôler la pression en tokens liée aux images pour les modèles compatibles vision.
Des dimensions maximales plus faibles réduisent généralement l’utilisation de tokens ; des dimensions plus élevées préservent les détails.

Implémentation :

- `sanitizeSessionMessagesImages` dans `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` dans `src/agents/tool-images.ts`
- Le côté maximal d’une image est configurable via `agents.defaults.imageMaxDimensionPx` (par défaut : `1200`).
- Les blocs de texte vides sont supprimés pendant que cette passe parcourt le contenu de relecture. Les tours d’assistant
  qui deviennent vides sont retirés de la copie de relecture ; les tours utilisateur et de résultat d’outil
  qui deviennent vides reçoivent un placeholder non vide de contenu omis.

---

## Règle globale : appels d’outils mal formés

Les blocs d’appels d’outils d’assistant auxquels il manque à la fois `input` et `arguments` sont supprimés
avant la construction du contexte du modèle. Cela évite les rejets des fournisseurs dus à des appels d’outils
partiellement persistés (par exemple, après un échec lié à une limite de débit).

Implémentation :

- `sanitizeToolCallInputs` dans `src/agents/session-transcript-repair.ts`
- Appliqué dans `sanitizeSessionHistory` dans `src/agents/pi-embedded-runner/replay-history.ts`

---

## Règle globale : provenance des entrées entre sessions

Lorsqu’un agent envoie une invite dans une autre session via `sessions_send` (y compris
les étapes de réponse/annonce agent-à-agent), OpenClaw persiste le tour utilisateur créé avec :

- `message.provenance.kind = "inter_session"`

OpenClaw préfixe aussi le texte de l’invite routée, dans le même tour, avec un marqueur `[Inter-session message ... isUser=false]`
afin que l’appel du modèle actif puisse distinguer la sortie d’une session étrangère
des instructions externes de l’utilisateur final. Ce marqueur inclut la session source, le canal
et l’outil lorsqu’ils sont disponibles. La transcription utilise toujours `role: "user"` pour la compatibilité fournisseur,
mais le texte visible et les métadonnées de provenance marquent tous deux le tour comme des données entre sessions.

Pendant la reconstruction du contexte, OpenClaw applique le même marqueur aux anciens
tours utilisateur entre sessions persistés qui ne disposent que de métadonnées de provenance.

---

## Matrice des fournisseurs (comportement actuel)

**OpenAI / OpenAI Codex**

- Normalisation des images uniquement.
- Supprimer les signatures de raisonnement orphelines (éléments de raisonnement autonomes sans bloc de contenu suivant) pour les transcriptions OpenAI Responses/Codex, et supprimer le raisonnement OpenAI rejouable après un changement de route de modèle.
- Conserver les payloads d’éléments de raisonnement OpenAI Responses rejouables, y compris les éléments chiffrés à résumé vide, afin que la relecture manuelle/WebSocket conserve l’état `rs_*` requis apparié aux éléments de sortie d’assistant.
- Native ChatGPT Codex Responses suit la parité filaire Codex en rejouant les payloads Responses précédents de raisonnement/message/fonction sans identifiants d’éléments précédents, tout en préservant le `prompt_cache_key` de session.
- Aucune normalisation des identifiants d’appels d’outils.
- La réparation de l’appariement des résultats d’outils peut déplacer de vraies sorties correspondantes et synthétiser des sorties `aborted` de style Codex pour les appels d’outils manquants.
- Aucune validation ni réorganisation des tours.
- Les sorties d’outils manquantes de la famille OpenAI Responses sont synthétisées sous forme de `aborted` pour correspondre à la normalisation de relecture Codex.
- Aucune suppression des signatures de pensée.

**OpenAI-compatible Chat Completions**

- Les blocs historiques de réflexion/raisonnement d’assistant sont supprimés avant la relecture afin que
  les serveurs locaux et de style proxy compatibles OpenAI ne reçoivent pas les champs de raisonnement des tours précédents,
  tels que `reasoning` ou `reasoning_content`.
- Les continuations d’appels d’outils du même tour actuel conservent le bloc de raisonnement d’assistant
  attaché à l’appel d’outil jusqu’à ce que le résultat d’outil ait été rejoué.
- Les exceptions détenues par les fournisseurs peuvent se désinscrire lorsque leur protocole filaire exige
  des métadonnées de raisonnement rejouées.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Normalisation des identifiants d’appels d’outils : alphanumérique strict.
- Réparation de l’appariement des résultats d’outils et résultats d’outils synthétiques.
- Validation des tours (alternance de tours de style Gemini).
- Correctif d’ordonnancement des tours Google (préfixer un minuscule bootstrap utilisateur si l’historique commence par l’assistant).
- Antigravity Claude : normaliser les signatures de réflexion ; supprimer les blocs de réflexion non signés.

**Anthropic / Minimax (compatible Anthropic)**

- Réparation de l’appariement des résultats d’outils et résultats d’outils synthétiques.
- Validation des tours (fusionner les tours utilisateur consécutifs pour satisfaire l’alternance stricte).
- Les tours de préremplissage d’assistant finaux sont supprimés des payloads Anthropic Messages
  sortants lorsque la réflexion est activée, y compris les routes Cloudflare AI Gateway.
- Les blocs de réflexion avec des signatures de relecture manquantes, vides ou blanches sont supprimés
  avant la conversion fournisseur. Si cela vide un tour d’assistant, OpenClaw conserve
  la forme du tour avec un texte de raisonnement omis non vide.
- Les anciens tours d’assistant constitués uniquement de réflexion qui doivent être supprimés sont remplacés par
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
- Les anciens tours d’assistant constitués uniquement de réflexion qui doivent être supprimés sont remplacés par
  un texte de raisonnement omis non vide afin que la relecture Converse conserve la forme stricte des tours.
- La relecture filtre les tours d’assistant miroir de livraison OpenClaw et injectés par le Gateway.
- La normalisation des images s’applique via la règle globale.

**Mistral (y compris la détection basée sur l’identifiant de modèle)**

- Normalisation des identifiants d’appels d’outils : strict9 (alphanumérique de longueur 9).

**OpenRouter Gemini**

- Nettoyage des signatures de pensée : supprimer les valeurs `thought_signature` non base64 (conserver base64).

**OpenRouter Anthropic**

- Les tours de préremplissage d’assistant finaux sont supprimés des payloads de modèles Anthropic
  compatibles OpenAI vérifiés d’OpenRouter lorsque le raisonnement est activé, conformément au
  comportement de relecture Anthropic direct et Cloudflare Anthropic.

**Tout le reste**

- Normalisation des images uniquement.

---

## Comportement historique (avant 2026.1.22)

Avant la version 2026.1.22, OpenClaw appliquait plusieurs couches d’hygiène des transcriptions :

- Une **extension transcript-sanitize** s’exécutait à chaque construction de contexte et pouvait :
  - Réparer l’appariement utilisation/résultat d’outil.
  - Normaliser les identifiants d’appels d’outils (y compris un mode non strict qui conservait `_`/`-`).
- Le runner effectuait aussi une normalisation propre au fournisseur, ce qui dupliquait le travail.
- Des mutations supplémentaires se produisaient en dehors de la politique fournisseur, notamment :
  - Supprimer les balises `<final>` du texte d’assistant avant la persistance.
  - Supprimer les tours d’erreur d’assistant vides.
  - Tronquer le contenu d’assistant après les appels d’outils.

Cette complexité a provoqué des régressions entre fournisseurs (notamment l’appariement `call_id|fc_id` de
`openai-responses`). Le nettoyage de 2026.1.22 a supprimé l’extension, centralisé
la logique dans le runner et rendu OpenAI **intact** au-delà de la normalisation des images.

## Connexe

- [Gestion des sessions](/fr/concepts/session)
- [Élagage des sessions](/fr/concepts/session-pruning)
