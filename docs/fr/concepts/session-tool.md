---
read_when:
    - Vous voulez comprendre de quels outils de session dispose l’agent
    - Vous souhaitez configurer l’accès intersessions ou la création de sous-agents
    - Vous souhaitez inspecter l’état ou contrôler les sous-agents lancés
summary: Outils d’agent pour l’état entre sessions, le rappel, la messagerie et l’orchestration de sous-agents
title: Outils de session
x-i18n:
    generated_at: "2026-04-30T07:23:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0464116d42e271da12cbe90529e06e9f51605981be85b54bb5850ee9b8fb7824
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw donne aux agents des outils pour travailler entre les sessions, inspecter l’état et
orchestrer des sous-agents.

## Outils disponibles

| Outil              | Ce qu’il fait                                                               |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Liste les sessions avec des filtres facultatifs (kind, label, agent, récence, aperçu) |
| `sessions_history` | Lit la transcription d’une session spécifique                               |
| `sessions_send`    | Envoie un message à une autre session et attend éventuellement              |
| `sessions_spawn`   | Lance une session de sous-agent isolée pour un travail en arrière-plan      |
| `sessions_yield`   | Termine le tour actuel et attend les résultats de suivi du sous-agent       |
| `subagents`        | Liste, oriente ou tue les sous-agents lancés pour cette session             |
| `session_status`   | Affiche une carte de style `/status` et définit éventuellement une surcharge de modèle par session |

Ces outils restent soumis au profil d’outils actif et à la politique
d’autorisation/refus. `tools.profile: "coding"` inclut l’ensemble complet
d’orchestration de sessions, y compris `sessions_spawn`, `sessions_yield` et
`subagents`. `tools.profile: "messaging"` inclut les outils de messagerie entre
sessions (`sessions_list`, `sessions_history`, `sessions_send`,
`session_status`) mais n’inclut pas le lancement de sous-agents. Pour conserver
un profil de messagerie tout en autorisant la délégation native, ajoutez :

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Les politiques de groupe, de fournisseur, de sandbox et par agent peuvent
toujours retirer ces outils après l’étape du profil. Utilisez `/tools` depuis la
session concernée pour inspecter la liste effective des outils.

## Lister et lire les sessions

`sessions_list` renvoie les sessions avec leur clé, agentId, kind, canal,
modèle, nombres de jetons et horodatages. Filtrez par kind (`main`, `group`,
`cron`, `hook`, `node`), `label` exact, `agentId` exact, texte de recherche ou
récence (`activeMinutes`). Lorsque vous avez besoin d’un tri de type boîte de
réception, il peut aussi demander un titre dérivé limité par la visibilité, un
extrait d’aperçu du dernier message ou des messages récents bornés sur chaque
ligne. Les titres dérivés et les aperçus ne sont produits que pour les sessions
que l’appelant peut déjà voir selon la politique de visibilité configurée pour
les outils de session, afin que les sessions sans rapport restent masquées.

`sessions_history` récupère la transcription de conversation d’une session
spécifique. Par défaut, les résultats d’outils sont exclus -- passez
`includeTools: true` pour les voir. La vue renvoyée est volontairement bornée et
filtrée pour la sécurité :

- le texte de l’assistant est normalisé avant rappel :
  - les balises de réflexion sont supprimées
  - les blocs d’échafaudage `<relevant-memories>` / `<relevant_memories>` sont supprimés
  - les blocs de charge utile XML d’appels d’outils en texte brut comme `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` et
    `<function_calls>...</function_calls>` sont supprimés, y compris les charges utiles tronquées
    qui ne se ferment jamais proprement
  - les échafaudages d’appels/résultats d’outils déclassés comme `[Tool Call: ...]`,
    `[Tool Result ...]` et `[Historical context ...]` sont supprimés
  - les jetons de contrôle de modèle divulgués comme `<|assistant|>`, les autres jetons ASCII
    `<|...|>` et les variantes pleine chasse `<｜...｜>` sont supprimés
  - le XML d’appel d’outil MiniMax mal formé comme `<invoke ...>` /
    `</minimax:tool_call>` est supprimé
- le texte ressemblant à des identifiants ou jetons est caviardé avant d’être renvoyé
- les longs blocs de texte sont tronqués
- les très grands historiques peuvent supprimer des lignes plus anciennes ou remplacer une ligne surdimensionnée par
  `[sessions_history omitted: message too large]`
- l’outil signale des indicateurs de résumé comme `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` et `bytes`

Les deux outils acceptent soit une **clé de session** (comme `"main"`), soit un
**ID de session** provenant d’un appel de liste précédent.

Si vous avez besoin de la transcription exacte octet pour octet, inspectez le
fichier de transcription sur disque au lieu de traiter `sessions_history` comme
un vidage brut.

## Envoyer des messages entre sessions

`sessions_send` livre un message à une autre session et attend éventuellement la
réponse :

- **Envoi sans attente :** définissez `timeoutSeconds: 0` pour mettre en file d’attente et renvoyer
  immédiatement.
- **Attendre la réponse :** définissez un délai d’expiration et obtenez la réponse en ligne.

Les messages et les réponses de suivi A2A sont marqués comme données entre
sessions dans le prompt de réception (`[Inter-session message ... isUser=false]`)
et dans la provenance de la transcription. L’agent récepteur doit les traiter
comme des données routées par outil, et non comme une instruction directement
rédigée par l’utilisateur final.

Une fois que la cible a répondu, OpenClaw peut exécuter une **boucle de réponse
en retour** où les agents alternent les messages (jusqu’à 5 tours). L’agent
cible peut répondre `REPLY_SKIP` pour arrêter plus tôt.

## Assistants d’état et d’orchestration

`session_status` est l’outil léger équivalent à `/status` pour la session
actuelle ou une autre session visible. Il indique l’utilisation, l’heure, l’état
du modèle/runtime et le contexte de tâche en arrière-plan lié lorsqu’il existe.
Comme `/status`, il peut compléter les compteurs épars de jetons/cache à partir
de la dernière entrée d’utilisation de la transcription, et `model=default`
efface une surcharge par session. Utilisez `sessionKey="current"` pour la
session actuelle de l’appelant ; les libellés client visibles comme
`openclaw-tui` ne sont pas des clés de session.

`sessions_yield` termine volontairement le tour actuel afin que le prochain
message puisse être l’événement de suivi que vous attendez. Utilisez-le après
avoir lancé des sous-agents lorsque vous voulez que les résultats d’achèvement
arrivent comme prochain message au lieu de construire des boucles de sondage.

`subagents` est l’assistant de plan de contrôle pour les sous-agents OpenClaw
déjà lancés. Il prend en charge :

- `action: "list"` pour inspecter les exécutions actives/récentes
- `action: "steer"` pour envoyer des consignes de suivi à un enfant en cours d’exécution
- `action: "kill"` pour arrêter un enfant ou `all`

## Lancer des sous-agents

`sessions_spawn` crée par défaut une session isolée pour une tâche en
arrière-plan. Il est toujours non bloquant -- il renvoie immédiatement un
`runId` et une `childSessionKey`.

Options clés :

- `runtime: "subagent"` (par défaut) ou `"acp"` pour les agents de harnais externes.
- Surcharges `model` et `thinking` pour la session enfant.
- `thread: true` pour lier le lancement à un fil de discussion (Discord, Slack, etc.).
- `sandbox: "require"` pour imposer le sandboxing à l’enfant.
- `context: "fork"` pour les sous-agents natifs lorsque l’enfant a besoin de la
  transcription actuelle du demandeur ; omettez-le ou utilisez `context: "isolated"` pour un enfant propre.

Les sous-agents feuilles par défaut ne reçoivent pas d’outils de session.
Lorsque `maxSpawnDepth >= 2`, les sous-agents orchestrateurs de profondeur 1
reçoivent en plus `sessions_spawn`, `subagents`, `sessions_list` et
`sessions_history` afin de pouvoir gérer leurs propres enfants. Les exécutions
feuilles ne reçoivent toujours pas d’outils d’orchestration récursive.

Après l’achèvement, une étape d’annonce publie le résultat sur le canal du
demandeur. La livraison de l’achèvement préserve le routage de fil/sujet lié
lorsqu’il est disponible, et si l’origine de l’achèvement n’identifie qu’un
canal, OpenClaw peut tout de même réutiliser la route stockée de la session du
demandeur (`lastChannel` / `lastTo`) pour une livraison directe.

Pour le comportement propre à ACP, consultez [Agents ACP](/fr/tools/acp-agents).

## Visibilité

Les outils de session sont limités pour restreindre ce que l’agent peut voir :

| Niveau  | Portée                                   |
| ------- | ---------------------------------------- |
| `self`  | Seulement la session actuelle            |
| `tree`  | Session actuelle + sous-agents lancés    |
| `agent` | Toutes les sessions de cet agent         |
| `all`   | Toutes les sessions (inter-agents si configuré) |

La valeur par défaut est `tree`. Les sessions sandboxées sont limitées à `tree`
quelle que soit la configuration.

## Pour aller plus loin

- [Gestion des sessions](/fr/concepts/session) -- routage, cycle de vie, maintenance
- [Agents ACP](/fr/tools/acp-agents) -- lancement de harnais externes
- [Multi-agent](/fr/concepts/multi-agent) -- architecture multi-agent
- [Configuration du Gateway](/fr/gateway/configuration) -- paramètres de configuration des outils de session

## Connexe

- [Gestion des sessions](/fr/concepts/session)
- [Élagage des sessions](/fr/concepts/session-pruning)
