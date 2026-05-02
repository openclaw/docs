---
read_when:
    - Vous voulez comprendre de quels outils de session l’agent dispose
    - Vous souhaitez configurer l’accès intersessions ou le lancement de sous-agents
    - Vous voulez consulter l’état ou contrôler les sous-agents lancés
summary: Outils d’agent pour l’état intersessions, le rappel, la messagerie et l’orchestration de sous-agents
title: Outils de session
x-i18n:
    generated_at: "2026-05-02T07:05:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb8a3ab7fd1036ccd97940fc9824684d7b27ded0136f6a69416eb144bbfc64be
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw donne aux agents des outils pour travailler entre les sessions, inspecter l’état et
orchestrer des sous-agents.

## Outils disponibles

| Outil              | Ce qu’il fait                                                               |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Liste les sessions avec des filtres facultatifs (type, libellé, agent, récence, aperçu) |
| `sessions_history` | Lit la transcription d’une session précise                                  |
| `sessions_send`    | Envoie un message à une autre session et attend facultativement             |
| `sessions_spawn`   | Lance une session de sous-agent isolée pour du travail en arrière-plan      |
| `sessions_yield`   | Termine le tour actuel et attend les résultats de suivi des sous-agents     |
| `subagents`        | Liste, guide ou tue les sous-agents lancés pour cette session               |
| `session_status`   | Affiche une carte de style `/status` et définit facultativement une substitution de modèle par session |

Ces outils restent soumis au profil d’outils actif et à la politique
d’autorisation/refus. `tools.profile: "coding"` inclut l’ensemble complet
d’orchestration de sessions, notamment `sessions_spawn`, `sessions_yield` et
`subagents`. `tools.profile: "messaging"` inclut les outils de messagerie
entre sessions (`sessions_list`, `sessions_history`, `sessions_send`,
`session_status`), mais n’inclut pas le lancement de sous-agents. Pour conserver
un profil de messagerie tout en autorisant la délégation native, ajoutez :

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Les politiques de groupe, de fournisseur, de bac à sable et propres à chaque
agent peuvent toujours retirer ces outils après l’étape du profil. Utilisez
`/tools` depuis la session concernée pour inspecter la liste effective des
outils.

## Lister et lire les sessions

`sessions_list` renvoie les sessions avec leur clé, agentId, type, canal,
modèle, compteurs de tokens et horodatages. Filtrez par type (`main`, `group`,
`cron`, `hook`, `node`), `label` exact, `agentId` exact, texte de recherche ou
récence (`activeMinutes`). Quand vous avez besoin d’un triage de type boîte aux
lettres, il peut aussi demander un titre dérivé limité à la visibilité, un
extrait d’aperçu du dernier message ou des messages récents bornés sur chaque
ligne. Les titres dérivés et les aperçus ne sont produits que pour les sessions
que l’appelant peut déjà voir selon la politique de visibilité configurée pour
les outils de session ; les sessions sans rapport restent donc masquées.

`sessions_history` récupère la transcription de conversation pour une session
précise. Par défaut, les résultats d’outils sont exclus -- passez
`includeTools: true` pour les voir. La vue renvoyée est volontairement bornée et
filtrée pour la sécurité :

- le texte de l’assistant est normalisé avant le rappel :
  - les balises de réflexion sont supprimées
  - les blocs d’échafaudage `<relevant-memories>` / `<relevant_memories>` sont supprimés
  - les blocs de charge utile XML d’appels d’outils en texte brut comme `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` et
    `<function_calls>...</function_calls>` sont supprimés, y compris les charges
    tronquées qui ne se ferment jamais correctement
  - l’échafaudage dégradé d’appels/résultats d’outils comme `[Tool Call: ...]`,
    `[Tool Result ...]` et `[Historical context ...]` est supprimé
  - les tokens de contrôle de modèle divulgués comme `<|assistant|>`, les autres
    tokens ASCII `<|...|>` et les variantes pleine chasse `<｜...｜>` sont supprimés
  - le XML mal formé d’appels d’outils MiniMax comme `<invoke ...>` /
    `</minimax:tool_call>` est supprimé
- le texte ressemblant à des identifiants ou tokens est caviardé avant d’être renvoyé
- les longs blocs de texte sont tronqués
- les historiques très volumineux peuvent abandonner les lignes les plus anciennes ou remplacer une ligne surdimensionnée par
  `[sessions_history omitted: message too large]`
- l’outil signale des indicateurs de résumé comme `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` et `bytes`

Les deux outils acceptent soit une **clé de session** (comme `"main"`), soit un
**ID de session** issu d’un précédent appel de liste.

Si vous avez besoin de la transcription exacte octet par octet, inspectez le
fichier de transcription sur disque au lieu de traiter `sessions_history` comme
un vidage brut.

## Envoyer des messages entre sessions

`sessions_send` transmet un message à une autre session et attend
facultativement la réponse :

- **Envoyer sans attendre :** définissez `timeoutSeconds: 0` pour mettre en file d’attente et revenir
  immédiatement.
- **Attendre la réponse :** définissez un délai d’expiration et obtenez la réponse en ligne.

Les sessions de discussion limitées à un fil, comme les clés Slack ou Discord se
terminant par `:thread:<id>`, ne sont pas des cibles valides pour
`sessions_send`. Utilisez la clé de session du canal parent pour la coordination
entre agents afin que les messages routés par outil n’apparaissent pas dans un
fil actif visible par des humains.

Les messages et les réponses de suivi A2A sont marqués comme des données
inter-sessions dans le prompt de réception (`[Inter-session message ... isUser=false]`)
et dans la provenance de la transcription. L’agent récepteur doit les traiter
comme des données routées par outil, et non comme une instruction directement
rédigée par l’utilisateur final.

Après la réponse de la cible, OpenClaw peut exécuter une **boucle de réponse en retour** où les
agents alternent les messages (jusqu’à 5 tours). L’agent cible peut répondre
`REPLY_SKIP` pour arrêter plus tôt.

## Assistants d’état et d’orchestration

`session_status` est l’outil léger équivalent à `/status` pour la session
actuelle ou une autre session visible. Il signale l’utilisation, l’heure,
l’état du modèle/de l’environnement d’exécution et le contexte de tâche en
arrière-plan lié lorsqu’il existe. Comme `/status`, il peut renseigner a
posteriori des compteurs clairsemés de tokens/cache depuis la dernière entrée
d’utilisation de transcription, et `model=default` efface une substitution par
session. Utilisez `sessionKey="current"` pour la session actuelle de l’appelant ;
les libellés client visibles comme `openclaw-tui` ne sont pas des clés de
session.

`sessions_yield` termine volontairement le tour actuel afin que le message
suivant puisse être l’événement de suivi que vous attendez. Utilisez-le après
avoir lancé des sous-agents lorsque vous voulez que les résultats d’achèvement
arrivent comme message suivant au lieu de construire des boucles d’interrogation.

`subagents` est l’assistant de plan de contrôle pour les sous-agents OpenClaw
déjà lancés. Il prend en charge :

- `action: "list"` pour inspecter les exécutions actives/récentes
- `action: "steer"` pour envoyer des consignes de suivi à un enfant en cours d’exécution
- `action: "kill"` pour arrêter un enfant ou `all`

## Lancer des sous-agents

`sessions_spawn` crée par défaut une session isolée pour une tâche en arrière-plan.
Il est toujours non bloquant -- il revient immédiatement avec un `runId` et une
`childSessionKey`.

Options principales :

- `runtime: "subagent"` (par défaut) ou `"acp"` pour les agents de harnais externes.
- Substitutions `model` et `thinking` pour la session enfant.
- `thread: true` pour lier le lancement à un fil de discussion (Discord, Slack, etc.).
- `sandbox: "require"` pour imposer le bac à sable à l’enfant.
- `context: "fork"` pour les sous-agents natifs lorsque l’enfant a besoin de la transcription du demandeur actuel ; omettez-le ou utilisez `context: "isolated"` pour un enfant propre.
  Les sous-agents natifs liés à un fil utilisent par défaut `context: "fork"` sauf si
  `threadBindings.defaultSpawnContext` indique autre chose.

Les sous-agents feuilles par défaut ne reçoivent pas d’outils de session. Quand
`maxSpawnDepth >= 2`, les sous-agents orchestrateurs de profondeur 1 reçoivent
en plus `sessions_spawn`, `subagents`, `sessions_list` et `sessions_history` afin de
pouvoir gérer leurs propres enfants. Les exécutions feuilles ne reçoivent
toujours pas d’outils d’orchestration récursive.

Après l’achèvement, une étape d’annonce publie le résultat dans le canal du
demandeur. La livraison d’achèvement préserve le routage de fil/sujet lié quand
il est disponible, et si l’origine de l’achèvement n’identifie qu’un canal,
OpenClaw peut toujours réutiliser la route stockée de la session demandeuse
(`lastChannel` / `lastTo`) pour une livraison directe.

Pour le comportement propre à ACP, consultez [Agents ACP](/fr/tools/acp-agents).

## Visibilité

Les outils de session sont limités afin de restreindre ce que l’agent peut voir :

| Niveau  | Portée                                   |
| ------- | ---------------------------------------- |
| `self`  | Uniquement la session actuelle           |
| `tree`  | Session actuelle + sous-agents lancés    |
| `agent` | Toutes les sessions de cet agent         |
| `all`   | Toutes les sessions (entre agents si configuré) |

La valeur par défaut est `tree`. Les sessions en bac à sable sont plafonnées à
`tree` quelle que soit la configuration.

## Pour aller plus loin

- [Gestion des sessions](/fr/concepts/session) -- routage, cycle de vie, maintenance
- [Agents ACP](/fr/tools/acp-agents) -- lancement par harnais externe
- [Multi-agent](/fr/concepts/multi-agent) -- architecture multi-agent
- [Configuration du Gateway](/fr/gateway/configuration) -- paramètres de configuration des outils de session

## Connexe

- [Gestion des sessions](/fr/concepts/session)
- [Élagage des sessions](/fr/concepts/session-pruning)
