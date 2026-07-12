---
read_when:
    - Vous déboguez des rejets de requêtes du fournisseur liés à la structure de la transcription
    - Vous modifiez la logique d’assainissement des transcriptions ou de réparation des appels d’outils
    - Vous examinez les incohérences d’identifiants d’appels d’outils entre les fournisseurs
summary: 'Référence : règles de nettoyage et de réparation des transcriptions propres au fournisseur'
title: Hygiène des transcriptions
x-i18n:
    generated_at: "2026-07-12T15:54:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4c78d718106498e92c34e3ad6af452a340f230fa88fbf3da36a568e9814ec759
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw applique des **corrections propres aux fournisseurs** aux transcriptions avant une exécution
(lors de la création du contexte du modèle). La plupart sont des ajustements **en mémoire** utilisés pour
satisfaire aux exigences strictes des fournisseurs. Une passe distincte de réparation du fichier de session peut
également réécrire le JSONL stocké avant le chargement de la session, mais uniquement pour les
lignes mal formées ou les tours persistés qui constituent des enregistrements durables non valides.
Les réponses de l’assistant effectivement transmises sont conservées sur le disque ; la suppression
du préremplissage de l’assistant propre au fournisseur ne se produit que lors de la construction des
charges utiles sortantes.

Lorsqu’une réparation a lieu, le fichier d’origine est écrit dans un fichier frère temporaire
`*.bak-<pid>-<ts>` avant le remplacement atomique, puis supprimé lorsque le
remplacement réussit. La sauvegarde n’est conservée que si son nettoyage échoue,
auquel cas son chemin est signalé.

Le périmètre comprend :

- L’exclusion du contexte d’invite réservé à l’exécution des tours de transcription visibles par l’utilisateur
- L’assainissement des identifiants d’appels d’outils
- La validation des entrées d’appels d’outils
- La réparation de l’appariement des résultats d’outils
- La validation et l’ordonnancement des tours
- Le nettoyage des signatures de réflexion
- Le nettoyage des signatures de raisonnement
- L’assainissement des charges utiles d’images
- Le nettoyage des blocs de texte vides avant la relecture par le fournisseur
- Le nettoyage des tours incomplets limités au raisonnement avant la relecture par le fournisseur
- Le balisage de la provenance des entrées utilisateur (pour les invites acheminées entre sessions)
- La réparation des tours d’erreur vides de l’assistant pour la relecture Bedrock Converse

Pour plus de détails sur le stockage des transcriptions, consultez
[Présentation détaillée de la gestion des sessions](/fr/reference/session-management-compaction).

---

## Règle globale : le contexte d’exécution n’est pas la transcription de l’utilisateur

Le contexte d’exécution/système peut être ajouté à l’invite du modèle pour un tour, mais il ne
s’agit pas de contenu rédigé par l’utilisateur final. OpenClaw conserve un corps d’invite distinct,
destiné à la transcription, pour les réponses du Gateway, les suivis mis en file d’attente, ACP, la CLI et les
exécutions OpenClaw intégrées. Les tours utilisateur visibles stockés utilisent ce corps de transcription plutôt que
l’invite enrichie par le contexte d’exécution.

Pour les sessions héritées qui ont déjà persisté des enveloppes d’exécution, les surfaces d’historique du Gateway
appliquent une projection d’affichage avant de renvoyer les messages aux clients WebChat,
TUI, REST ou SSE.

---

## Emplacement de l’exécution

Toute l’hygiène des transcriptions est centralisée dans l’exécuteur intégré :

- Sélection de la politique : `src/agents/transcript-policy.ts`
  (`resolveTranscriptPolicy`, indexée sur `provider`, `modelApi` et `modelId`)
- Application de l’assainissement/réparation : `sanitizeSessionHistory` dans
  `src/agents/embedded-agent-runner/replay-history.ts`

Indépendamment de l’hygiène des transcriptions, les fichiers de session sont réparés (si nécessaire)
avant leur chargement :

- `repairSessionFileIfNeeded` dans `src/agents/session-file-repair.ts`
- Appelé depuis `src/agents/embedded-agent-runner/run/attempt.ts` et
  `src/agents/embedded-agent-runner/compact.ts`

---

## Règle globale : assainissement des images

Les charges utiles d’images sont toujours assainies afin d’éviter leur rejet par le fournisseur en raison des
limites de taille (réduction des dimensions/recompression des images base64 surdimensionnées). Cela permet également de
maîtriser la pression sur les jetons induite par les images pour les modèles dotés de capacités visuelles : des dimensions
maximales plus faibles réduisent l’utilisation des jetons, tandis que des dimensions plus élevées préservent les détails.

Implémentation :

- `sanitizeSessionMessagesImages` dans
  `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` dans `src/agents/tool-images.ts`
- La dimension maximale d’un côté de l’image est configurable via `agents.defaults.imageMaxDimensionPx`
  (valeur par défaut : `1200`)
- Les blocs de texte vides sont supprimés pendant que cette passe parcourt le contenu à relire.
  Les tours de l’assistant devenus vides sont retirés de la copie destinée à la relecture ; les tours
  utilisateur et de résultats d’outils devenus vides reçoivent un texte de remplacement non vide
  indiquant que le contenu a été omis.

---

## Règle globale : appels d’outils mal formés

Les blocs d’appels d’outils de l’assistant auxquels manquent à la fois `input` et `arguments` sont supprimés
avant la création du contexte du modèle. Cela évite les rejets par les fournisseurs dus à des
appels d’outils partiellement persistés (par exemple, après un échec lié à une limite de débit).

Implémentation :

- `sanitizeToolCallInputs` dans `src/agents/session-transcript-repair.ts`
- Appliqué dans `sanitizeSessionHistory`
  (`src/agents/embedded-agent-runner/replay-history.ts`)

---

## Règle globale : tours incomplets limités au raisonnement

Les tours de l’assistant qui atteignent la limite de sortie du fournisseur avec uniquement du contenu de raisonnement ou
de raisonnement expurgé sont omis de la copie de relecture en mémoire. Ces
tours contiennent un état de fournisseur incomplet et peuvent inclure une signature de raisonnement
partielle.

Les tours de longueur vides restent inchangés, tout comme ceux comportant du texte visible,
des appels d’outils ou des blocs de contenu inconnus. Les transcriptions stockées ne sont pas réécrites.

Implémentation : `normalizeAssistantReplayContent` dans
`src/agents/embedded-agent-runner/replay-history.ts`

---

## Règle globale : provenance des entrées entre sessions

Lorsqu’un agent envoie une invite dans une autre session via `sessions_send`
(y compris lors des étapes de réponse/annonce entre agents), OpenClaw persiste le
tour utilisateur créé avec `message.provenance.kind = "inter_session"`.

OpenClaw ajoute également avant le texte de l’invite acheminée, au sein du même tour, un marqueur
`[Inter-session message] ... isUser=false` afin que l’appel actif au modèle puisse
distinguer la sortie d’une session externe des instructions de l’utilisateur final externe. Ce
marqueur comprend la session source, le canal et l’outil lorsqu’ils sont disponibles. La
transcription utilise toujours `role: "user"` à des fins de compatibilité avec le fournisseur, mais le
texte visible et les métadonnées de provenance marquent tous deux le tour comme des données
intersessions.

Lors de la reconstruction du contexte, OpenClaw applique le même marqueur aux anciens tours
utilisateur intersessions persistés qui ne disposent que de métadonnées de provenance.

---

## Matrice des fournisseurs (comportement actuel)

**OpenAI / OpenAI Codex**

- Assainissement des images uniquement.
- Suppression des signatures de raisonnement orphelines (éléments de raisonnement autonomes sans
  bloc de contenu suivant) pour les transcriptions OpenAI Responses/Codex, et suppression
  du raisonnement OpenAI susceptible d’être relu après un changement de routage du modèle.
- Conservation des charges utiles des éléments de raisonnement OpenAI Responses susceptibles d’être relus, y compris
  les éléments chiffrés avec résumé vide, afin que la relecture manuelle/WebSocket conserve l’état
  `rs_*` requis associé aux éléments de sortie de l’assistant.
- Le mode natif ChatGPT Codex Responses respecte la parité du protocole Codex en relisant
  les charges utiles antérieures de raisonnement/message/fonction de Responses sans identifiants d’éléments
  antérieurs, tout en préservant le `prompt_cache_key` de la session.
- La relecture de la famille OpenAI Responses préserve les paires canoniques `call_*|fc_*`
  de raisonnement pour un même modèle, mais normalise de façon déterministe les identifiants
  `call_id`/d’éléments d’appels de fonctions mal formés ou trop longs avant la conversion de la charge utile pi-ai.
- La réparation de l’appariement des résultats d’outils peut déplacer les sorties réelles correspondantes et synthétiser
  des sorties `aborted` de style Codex pour les appels d’outils manquants.
- Aucune validation ni réorganisation des tours ; aucune suppression des signatures de réflexion.

**Chat Completions compatibles avec OpenAI**

- Les blocs historiques de raisonnement/réflexion de l’assistant sont supprimés avant la relecture
  afin que les serveurs locaux et de type proxy compatibles avec OpenAI ne reçoivent pas
  les champs de raisonnement des tours antérieurs tels que `reasoning` ou `reasoning_content`.
- Les continuations d’appels d’outils au sein du même tour actuel conservent le bloc de raisonnement
  de l’assistant attaché à l’appel d’outil jusqu’à la relecture du résultat de l’outil.
- Les entrées de modèles personnalisés/auto-hébergés avec `reasoning: true` conservent les
  métadonnées de raisonnement relues.
- Les exceptions appartenant au fournisseur peuvent désactiver ce comportement lorsque leur protocole filaire exige
  la relecture des métadonnées de raisonnement.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Assainissement des identifiants d’appels d’outils : strictement alphanumériques.
- Réparation de l’appariement des résultats d’outils et résultats d’outils synthétiques.
- Validation des tours (alternance des tours de style Gemini).
- Correction de l’ordre des tours Google (ajout initial d’un minuscule tour utilisateur d’amorçage si l’historique
  commence par l’assistant).
- Antigravity Claude : normalisation des signatures de raisonnement ; suppression des blocs de raisonnement
  non signés.

**Anthropic / Minimax (compatible avec Anthropic)**

- Réparation de l’appariement des résultats d’outils et résultats d’outils synthétiques.
- Validation des tours (fusion des tours utilisateur consécutifs afin de respecter l’alternance
  stricte).
- Les tours de préremplissage finaux de l’assistant sont supprimés des charges utiles Anthropic
  Messages sortantes lorsque le raisonnement est activé, y compris pour les routes Cloudflare AI
  Gateway.
- Les signatures de raisonnement de l’assistant antérieures à la Compaction sont supprimées avant la relecture par le fournisseur
  lorsqu’une session a fait l’objet d’une Compaction. Les signatures de raisonnement sont
  liées cryptographiquement au préfixe de la conversation au moment de leur génération ;
  après la Compaction, le préfixe change (un contenu résumé remplace le
  contenu d’origine), et la relecture des signatures d’origine conduit donc Anthropic à
  rejeter la requête avec « Invalid signature in thinking block ». Le
  texte du raisonnement est conservé sous forme de bloc non signé, puis traité selon la
  règle ci-dessous.
- Les blocs de raisonnement dont les signatures de relecture sont absentes, vides ou uniquement composées d’espaces sont
  supprimés avant la conversion pour le fournisseur. Si cela vide un tour de l’assistant,
  OpenClaw conserve la structure du tour avec un texte non vide indiquant que le raisonnement a été omis.
- Les anciens tours de l’assistant limités au raisonnement qui doivent être supprimés sont remplacés
  par un texte non vide indiquant que le raisonnement a été omis, afin que les adaptateurs du fournisseur ne suppriment pas
  le tour lors de la relecture.

**Amazon Bedrock (API Converse)**

- Les tours d’erreur de flux vides de l’assistant sont réparés avec un bloc de texte de secours
  non vide avant la relecture. Bedrock Converse rejette les messages de l’assistant
  avec `content: []` ; les tours persistés de l’assistant avec `stopReason:
"error"` et un contenu vide sont donc également réparés sur le disque avant le chargement.
- Les tours d’erreur de flux de l’assistant ne comportant que des blocs de texte vides sont supprimés de
  la copie de relecture en mémoire au lieu de relire un bloc vide non valide.
- Les signatures de raisonnement de l’assistant antérieures à la Compaction sont supprimées avant la relecture Converse
  lorsqu’une session a fait l’objet d’une Compaction, pour la même raison que pour
  Anthropic ci-dessus.
- Les blocs de raisonnement Claude dont les signatures de relecture sont absentes, vides ou uniquement composées d’espaces
  sont supprimés avant la relecture Converse. Si cela vide un tour de l’assistant,
  OpenClaw conserve la structure du tour avec un texte non vide indiquant que le raisonnement a été omis.
- Les anciens tours de l’assistant limités au raisonnement qui doivent être supprimés sont remplacés
  par un texte non vide indiquant que le raisonnement a été omis, afin que la relecture Converse conserve
  la structure stricte des tours.
- La relecture filtre les tours de l’assistant provenant du miroir de remise OpenClaw et ceux injectés
  par le Gateway.
- L’assainissement des images s’applique conformément à la règle globale.

**Mistral (y compris la détection basée sur l’identifiant du modèle)**

- Assainissement des identifiants d’appels d’outils : strict9 (alphanumériques, longueur 9).

**OpenRouter Gemini**

- Nettoyage des signatures de réflexion : suppression des valeurs `thought_signature` qui ne sont pas en base64
  (conservation de celles en base64).

**OpenRouter Anthropic**

- Les tours de préremplissage finaux de l’assistant sont supprimés des charges utiles vérifiées de modèles Anthropic
  OpenRouter compatibles avec OpenAI lorsque le raisonnement est activé,
  conformément au comportement de relecture d’Anthropic direct et d’Anthropic via Cloudflare.

**Tous les autres**

- Assainissement des images uniquement.

---

## Comportement historique (antérieur à 2026.1.22)

Avant la version 2026.1.22, OpenClaw appliquait plusieurs couches d’hygiène
des transcriptions :

- Une **extension d’assainissement des transcriptions** s’exécutait à chaque création de contexte et pouvait :
  - Réparer l’appariement entre l’utilisation d’un outil et son résultat.
  - Assainir les identifiants d’appels d’outils (y compris dans un mode non strict qui conservait
    `_`/`-`).
- L’exécuteur effectuait également un assainissement propre au fournisseur, ce qui
  dupliquait le traitement.
- Des mutations supplémentaires avaient lieu en dehors de la politique du fournisseur, notamment
  la suppression des balises `<final>` du texte de l’assistant avant la persistance, la suppression
  des tours d’erreur vides de l’assistant et la troncature du contenu de l’assistant après les appels
  d’outils.

Cette complexité provoquait des régressions entre fournisseurs (notamment dans
l’appariement `call_id|fc_id` d’`openai-responses`). Le nettoyage de la version 2026.1.22 a supprimé
l’extension, centralisé la logique dans l’exécuteur et rendu OpenAI **inchangé**
au-delà de l’assainissement des images.

## Voir aussi

- [Gestion des sessions](/fr/concepts/session)
- [Élagage des sessions](/fr/concepts/session-pruning)
