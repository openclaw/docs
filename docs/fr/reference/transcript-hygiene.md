---
read_when:
    - Vous déboguez des rejets de requêtes par le fournisseur liés à la structure de la transcription
    - Vous modifiez la logique d’assainissement des transcriptions ou de réparation des appels d’outils
    - Vous examinez les incohérences d’identifiants d’appels d’outils entre les fournisseurs
summary: 'Référence : règles d’assainissement et de réparation des transcriptions propres aux fournisseurs'
title: Hygiène des transcriptions
x-i18n:
    generated_at: "2026-07-12T03:19:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c78d718106498e92c34e3ad6af452a340f230fa88fbf3da36a568e9814ec759
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw applique des **correctifs propres à chaque fournisseur** aux transcriptions avant une exécution
(lors de la construction du contexte du modèle). La plupart sont des ajustements **en mémoire** utilisés pour
satisfaire les exigences strictes des fournisseurs. Une passe distincte de réparation du fichier de session peut
également réécrire le JSONL stocké avant le chargement de la session, mais uniquement pour les
lignes malformées ou les tours persistés qui ne constituent pas des enregistrements durables valides.
Les réponses de l’assistant transmises sont conservées sur disque ; la suppression du préremplissage
de l’assistant propre au fournisseur n’a lieu que lors de la construction des charges utiles
sortantes.

Lorsqu’une réparation est effectuée, le fichier d’origine est écrit dans un fichier frère temporaire
`*.bak-<pid>-<ts>` avant le remplacement atomique, puis supprimé une fois le
remplacement réussi. La sauvegarde n’est conservée que si son nettoyage échoue,
auquel cas son chemin est signalé.

La portée comprend :

- L’exclusion du contexte d’invite réservé à l’exécution des tours de transcription visibles par l’utilisateur
- L’assainissement des identifiants d’appels d’outils
- La validation des entrées d’appels d’outils
- La réparation de l’association des résultats d’outils
- La validation et l’ordre des tours
- Le nettoyage des signatures de réflexion
- Le nettoyage des signatures de raisonnement
- L’assainissement des charges utiles d’images
- Le nettoyage des blocs de texte vides avant leur relecture par le fournisseur
- Le nettoyage des tours incomplets limités en longueur et contenant uniquement du raisonnement avant leur relecture par le fournisseur
- Le marquage de la provenance des entrées utilisateur (pour les invites acheminées entre sessions)
- La réparation des tours d’erreur vides de l’assistant pour la relecture par Bedrock Converse

Pour plus de détails sur le stockage des transcriptions, consultez
[Présentation approfondie de la gestion des sessions](/fr/reference/session-management-compaction).

---

## Règle globale : le contexte d’exécution n’est pas une transcription utilisateur

Le contexte d’exécution ou système peut être ajouté à l’invite du modèle pour un tour, mais il ne
s’agit pas de contenu rédigé par l’utilisateur final. OpenClaw conserve un corps
d’invite distinct destiné à la transcription pour les réponses du Gateway, les suivis mis en file d’attente, ACP, la CLI et les exécutions
OpenClaw intégrées. Les tours utilisateur visibles stockés utilisent ce corps de transcription au lieu de
l’invite enrichie par le contexte d’exécution.

Pour les anciennes sessions qui ont déjà persisté des enveloppes d’exécution, les surfaces d’historique du Gateway
appliquent une projection d’affichage avant de renvoyer les messages aux clients WebChat,
TUI, REST ou SSE.

---

## Emplacement de l’exécution

Toute l’hygiène des transcriptions est centralisée dans l’exécuteur intégré :

- Sélection de la politique : `src/agents/transcript-policy.ts`
  (`resolveTranscriptPolicy`, indexée par `provider`, `modelApi` et `modelId`)
- Application de l’assainissement et des réparations : `sanitizeSessionHistory` dans
  `src/agents/embedded-agent-runner/replay-history.ts`

Indépendamment de l’hygiène des transcriptions, les fichiers de session sont réparés (si nécessaire)
avant leur chargement :

- `repairSessionFileIfNeeded` dans `src/agents/session-file-repair.ts`
- Appelée depuis `src/agents/embedded-agent-runner/run/attempt.ts` et
  `src/agents/embedded-agent-runner/compact.ts`

---

## Règle globale : assainissement des images

Les charges utiles d’images sont toujours assainies afin d’éviter leur rejet côté fournisseur en raison des
limites de taille (réduction des dimensions et recompression des images base64 trop volumineuses). Cela aide également à
maîtriser la pression sur les tokens causée par les images pour les modèles capables de vision : des dimensions
maximales plus faibles réduisent l’utilisation des tokens, tandis que des dimensions plus élevées préservent les détails.

Implémentation :

- `sanitizeSessionMessagesImages` dans
  `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` dans `src/agents/tool-images.ts`
- La dimension maximale d’un côté de l’image est configurable via `agents.defaults.imageMaxDimensionPx`
  (valeur par défaut : `1200`)
- Les blocs de texte vides sont supprimés pendant que cette passe parcourt le contenu à relire.
  Les tours de l’assistant qui deviennent vides sont retirés de la copie destinée à la relecture ; les tours
  utilisateur et de résultats d’outils qui deviennent vides reçoivent un texte de remplacement non vide
  indiquant que le contenu a été omis.

---

## Règle globale : appels d’outils malformés

Les blocs d’appels d’outils de l’assistant auxquels manquent à la fois `input` et `arguments` sont supprimés
avant la construction du contexte du modèle. Cela évite les rejets du fournisseur dus à des
appels d’outils partiellement persistés (par exemple, après un échec lié à une limitation de débit).

Implémentation :

- `sanitizeToolCallInputs` dans `src/agents/session-transcript-repair.ts`
- Appliquée dans `sanitizeSessionHistory`
  (`src/agents/embedded-agent-runner/replay-history.ts`)

---

## Règle globale : tours incomplets contenant uniquement du raisonnement

Les tours de l’assistant qui atteignent la limite de sortie du fournisseur avec uniquement du contenu de raisonnement ou
de raisonnement expurgé sont omis de la copie de relecture en mémoire. Ces
tours contiennent un état incomplet du fournisseur et peuvent comporter une signature de raisonnement
partielle.

Les tours vides limités en longueur restent inchangés, tout comme ceux contenant du texte visible,
des appels d’outils ou des blocs de contenu inconnus. Les transcriptions stockées ne sont pas réécrites.

Implémentation : `normalizeAssistantReplayContent` dans
`src/agents/embedded-agent-runner/replay-history.ts`

---

## Règle globale : provenance des entrées intersessions

Lorsqu’un agent envoie une invite à une autre session via `sessions_send`
(y compris lors des étapes de réponse ou d’annonce entre agents), OpenClaw persiste le
tour utilisateur créé avec `message.provenance.kind = "inter_session"`.

OpenClaw ajoute également au même tour un marqueur `[Message intersession] ... isUser=false`
avant le texte de l’invite acheminée, afin que l’appel actif au modèle puisse
distinguer la sortie d’une session étrangère des instructions externes de l’utilisateur final. Ce
marqueur inclut la session source, le canal et l’outil lorsqu’ils sont disponibles. La
transcription continue d’utiliser `role: "user"` pour assurer la compatibilité avec le fournisseur, mais le
texte visible et les métadonnées de provenance identifient tous deux le tour comme des données
intersessions.

Lors de la reconstruction du contexte, OpenClaw applique le même marqueur aux anciens tours
utilisateur intersessions persistés qui ne disposent que des métadonnées de provenance.

---

## Matrice des fournisseurs (comportement actuel)

**OpenAI / OpenAI Codex**

- Assainissement des images uniquement.
- Suppression des signatures de raisonnement orphelines (éléments de raisonnement autonomes sans
  bloc de contenu suivant) pour les transcriptions OpenAI Responses/Codex, ainsi que du
  raisonnement OpenAI relisible après un changement de route du modèle.
- Conservation des charges utiles des éléments de raisonnement OpenAI Responses relisibles, y compris
  les éléments chiffrés avec un résumé vide, afin que la relecture manuelle ou par WebSocket conserve l’état
  `rs_*` requis associé aux éléments de sortie de l’assistant.
- Les Responses natives de ChatGPT Codex respectent la parité du protocole Codex en relisant
  les charges utiles précédentes de raisonnement, de message et de fonction de Responses sans les identifiants
  d’éléments antérieurs, tout en préservant le `prompt_cache_key` de la session.
- La relecture de la famille OpenAI Responses préserve les paires canoniques de raisonnement
  `call_*|fc_*` du même modèle, mais normalise de façon déterministe les `call_id` ou identifiants
  d’éléments d’appels de fonction malformés ou trop longs avant la conversion de la charge utile pi-ai.
- La réparation de l’association des résultats d’outils peut déplacer les sorties réelles correspondantes et synthétiser
  des sorties `aborted` au format Codex pour les appels d’outils manquants.
- Aucune validation ni réorganisation des tours ; aucune suppression des signatures de réflexion.

**Chat Completions compatibles avec OpenAI**

- Les blocs historiques de raisonnement de l’assistant sont supprimés avant la relecture,
  afin que les serveurs locaux et mandataires compatibles avec OpenAI ne reçoivent pas
  les champs de raisonnement des tours précédents tels que `reasoning` ou `reasoning_content`.
- Les continuations d’appels d’outils du même tour en cours conservent le bloc de raisonnement de l’assistant
  associé à l’appel d’outil jusqu’à ce que le résultat de l’outil ait été relu.
- Les entrées de modèles personnalisés ou auto-hébergés avec `reasoning: true` conservent les
  métadonnées de raisonnement relues.
- Les exceptions propres aux fournisseurs peuvent désactiver ce comportement lorsque leur protocole exige
  la relecture des métadonnées de raisonnement.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Assainissement des identifiants d’appels d’outils : caractères alphanumériques stricts.
- Réparation de l’association des résultats d’outils et résultats d’outils synthétiques.
- Validation des tours (alternance des tours au format Gemini).
- Correction de l’ordre des tours Google (ajout au début d’un court message d’initialisation utilisateur si l’historique
  commence par l’assistant).
- Antigravity Claude : normalisation des signatures de raisonnement ; suppression des blocs de raisonnement
  non signés.

**Anthropic / Minimax (compatibles avec Anthropic)**

- Réparation de l’association des résultats d’outils et résultats d’outils synthétiques.
- Validation des tours (fusion des tours utilisateur consécutifs pour respecter une
  alternance stricte).
- Les tours finaux de préremplissage de l’assistant sont supprimés des charges utiles Anthropic
  Messages sortantes lorsque le raisonnement est activé, y compris pour les routes du
  Gateway IA de Cloudflare.
- Les signatures de raisonnement de l’assistant antérieures à la Compaction sont supprimées avant la
  relecture par le fournisseur lorsqu’une session a été compactée. Les signatures de raisonnement sont
  liées cryptographiquement au préfixe de la conversation au moment de leur génération ;
  après la Compaction, le préfixe change (le contenu résumé remplace le
  contenu d’origine), de sorte que la relecture des signatures d’origine conduit Anthropic à
  rejeter la requête avec « Signature non valide dans le bloc de raisonnement ». Le
  texte du raisonnement est conservé sous la forme d’un bloc non signé, puis traité par la
  règle ci-dessous.
- Les blocs de raisonnement dont les signatures de relecture sont absentes, vides ou ne contiennent que des espaces sont
  supprimés avant la conversion par le fournisseur. Si cela vide un tour de l’assistant,
  OpenClaw conserve la structure du tour avec un texte non vide indiquant que le raisonnement a été omis.
- Les anciens tours de l’assistant contenant uniquement du raisonnement et devant être supprimés sont remplacés
  par un texte non vide indiquant que le raisonnement a été omis, afin que les adaptateurs du fournisseur ne suppriment pas
  le tour relu.

**Amazon Bedrock (API Converse)**

- Les tours d’erreur de diffusion vides de l’assistant sont réparés avec un bloc de texte de remplacement
  non vide avant la relecture. Bedrock Converse rejette les messages de l’assistant
  avec `content: []` ; les tours persistés de l’assistant avec `stopReason:
"error"` et un contenu vide sont donc également réparés sur disque avant leur chargement.
- Les tours d’erreur de diffusion de l’assistant contenant uniquement des blocs de texte vides sont retirés de
  la copie de relecture en mémoire au lieu de relire un bloc vide non valide.
- Les signatures de raisonnement de l’assistant antérieures à la Compaction sont supprimées avant la relecture
  par Converse lorsqu’une session a été compactée, pour la même raison que pour
  Anthropic ci-dessus.
- Les blocs de raisonnement Claude dont les signatures de relecture sont absentes, vides ou ne contiennent que des espaces
  sont supprimés avant la relecture par Converse. Si cela vide un tour de l’assistant,
  OpenClaw conserve la structure du tour avec un texte non vide indiquant que le raisonnement a été omis.
- Les anciens tours de l’assistant contenant uniquement du raisonnement et devant être supprimés sont remplacés
  par un texte non vide indiquant que le raisonnement a été omis, afin que la relecture par Converse conserve
  une structure stricte des tours.
- La relecture filtre les tours de l’assistant issus du miroir de distribution d’OpenClaw et injectés par le Gateway.
- L’assainissement des images s’applique conformément à la règle globale.

**Mistral (y compris la détection fondée sur l’identifiant du modèle)**

- Assainissement des identifiants d’appels d’outils : strict9 (caractères alphanumériques, longueur 9).

**OpenRouter Gemini**

- Nettoyage des signatures de réflexion : suppression des valeurs `thought_signature` qui ne sont pas
  en base64 (conservation de celles en base64).

**OpenRouter Anthropic**

- Les tours finaux de préremplissage de l’assistant sont supprimés des charges utiles vérifiées des modèles Anthropic
  compatibles avec OpenAI sur OpenRouter lorsque le raisonnement est activé,
  conformément au comportement de relecture d’Anthropic direct et d’Anthropic via Cloudflare.

**Tous les autres**

- Assainissement des images uniquement.

---

## Comportement historique (avant la version 2026.1.22)

Avant la version 2026.1.22, OpenClaw appliquait plusieurs couches d’hygiène des
transcriptions :

- Une **extension d’assainissement des transcriptions** s’exécutait lors de chaque construction du contexte et pouvait :
  - Réparer l’association entre l’utilisation des outils et leurs résultats.
  - Assainir les identifiants d’appels d’outils (y compris dans un mode non strict qui conservait
    `_`/`-`).
- L’exécuteur effectuait également un assainissement propre au fournisseur, ce qui
  dupliquait le travail.
- D’autres mutations avaient lieu en dehors de la politique du fournisseur, notamment
  la suppression des balises `<final>` du texte de l’assistant avant la persistance, la suppression
  des tours d’erreur vides de l’assistant et la troncature du contenu de l’assistant après les appels
  d’outils.

Cette complexité provoquait des régressions entre fournisseurs (notamment pour
l’association `call_id|fc_id` d’`openai-responses`). Le nettoyage de la version 2026.1.22 a supprimé
l’extension, centralisé la logique dans l’exécuteur et fait en sorte qu’OpenAI ne soit **pas modifié**
au-delà de l’assainissement des images.

## Ressources associées

- [Gestion des sessions](/fr/concepts/session)
- [Élagage des sessions](/fr/concepts/session-pruning)
