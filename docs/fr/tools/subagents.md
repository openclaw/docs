---
read_when:
    - Vous souhaitez un travail d’arrière-plan/en parallèle via l’agent
    - Vous modifiez `sessions_spawn` ou la politique d’outil des sous-agents
    - Vous implémentez ou dépannez des sessions de sous-agent liées à un fil
summary: 'Sous-agents : lancement d’exécutions d’agent isolées qui annoncent les résultats au chat demandeur'
title: Sous-agents
x-i18n:
    generated_at: "2026-04-25T13:59:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: b262edf46b9c823dcf0ad6514e560d2d1a718e9081015ea8bb5c081206b88fce
    source_path: tools/subagents.md
    workflow: 15
---

Les sous-agents sont des exécutions d’agent d’arrière-plan lancées à partir d’une exécution d’agent existante. Ils s’exécutent dans leur propre session (`agent:<agentId>:subagent:<uuid>`) et, une fois terminés, **annoncent** leur résultat dans le canal de chat demandeur. Chaque exécution de sous-agent est suivie comme une [tâche d’arrière-plan](/fr/automation/tasks).

## Commande slash

Utilisez `/subagents` pour inspecter ou contrôler les exécutions de sous-agent de la **session actuelle** :

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Contrôles d’association à un fil :

Ces commandes fonctionnent sur les canaux qui prennent en charge les associations persistantes à un fil. Voir **Canaux prenant en charge les fils** ci-dessous.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` affiche les métadonnées de l’exécution (état, horodatages, identifiant de session, chemin de transcription, nettoyage).
Utilisez `sessions_history` pour une vue de rappel bornée et filtrée pour la sécurité ; inspectez le
chemin de transcription sur disque lorsque vous avez besoin de la transcription brute complète.

### Comportement au lancement

`/subagents spawn` démarre un sous-agent d’arrière-plan comme commande utilisateur, et non comme relais interne, et il envoie une mise à jour finale d’achèvement dans le chat demandeur lorsque l’exécution se termine.

- La commande de lancement n’est pas bloquante ; elle renvoie immédiatement un identifiant d’exécution.
- À la fin, le sous-agent annonce un message de résumé/résultat dans le canal de chat demandeur.
- La livraison de fin est basée sur le push. Une fois lancé, ne sondez pas `/subagents list`,
  `sessions_list` ou `sessions_history` en boucle juste pour attendre la fin ;
  inspectez l’état uniquement à la demande pour le débogage ou une intervention.
- À la fin, OpenClaw ferme au mieux les onglets/processus de navigateur suivis ouverts par cette session de sous-agent avant que le flux de nettoyage d’annonce ne se poursuive.
- Pour les lancements manuels, la livraison est résiliente :
  - OpenClaw essaie d’abord la livraison directe `agent` avec une clé d’idempotence stable.
  - Si la livraison directe échoue, il bascule vers le routage par file d’attente.
  - Si le routage par file d’attente n’est toujours pas disponible, l’annonce est retentée avec un court backoff exponentiel avant abandon final.
- La livraison de fin conserve la route demandeuse résolue :
  - les routes de fin associées à un fil ou à une conversation l’emportent lorsqu’elles sont disponibles
  - si l’origine de fin ne fournit qu’un canal, OpenClaw remplit la cible/le compte manquant à partir de la route résolue de la session demandeuse (`lastChannel` / `lastTo` / `lastAccountId`) afin que la livraison directe continue de fonctionner
- Le transfert de fin vers la session demandeuse est un contexte interne généré au runtime (et non un texte rédigé par l’utilisateur) et inclut :
  - `Result` (dernier texte de réponse `assistant` visible, sinon dernier texte `tool`/`toolResult` nettoyé ; les exécutions terminales en échec ne réutilisent pas le texte de réponse capturé)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - statistiques compactes de runtime/tokens
  - une instruction de livraison demandant à l’agent demandeur de reformuler avec une voix normale d’assistant (et non de transférer les métadonnées internes brutes)
- `--model` et `--thinking` remplacent les valeurs par défaut pour cette exécution spécifique.
- Utilisez `info`/`log` pour inspecter les détails et la sortie après la fin.
- `/subagents spawn` est en mode one-shot (`mode: "run"`). Pour des sessions persistantes associées à un fil, utilisez `sessions_spawn` avec `thread: true` et `mode: "session"`.
- Pour les sessions de harnais ACP (Codex, Claude Code, Gemini CLI), utilisez `sessions_spawn` avec `runtime: "acp"` et consultez [Agents ACP](/fr/tools/acp-agents), en particulier le [modèle de livraison ACP](/fr/tools/acp-agents#delivery-model) lors du débogage des fins ou des boucles agent à agent.

Objectifs principaux :

- Paralléliser le travail de « recherche / tâche longue / outil lent » sans bloquer l’exécution principale.
- Garder les sous-agents isolés par défaut (séparation des sessions + sandboxing facultatif).
- Garder la surface d’outils difficile à mal utiliser : les sous-agents **n’obtiennent pas** les outils de session par défaut.
- Prendre en charge une profondeur d’imbrication configurable pour les modèles d’orchestration.

Remarque sur les coûts : chaque sous-agent a par défaut son **propre** contexte et sa propre consommation de tokens. Pour les tâches lourdes ou
répétitives, définissez un modèle moins coûteux pour les sous-agents et conservez votre agent principal sur un
modèle de meilleure qualité. Vous pouvez configurer cela via `agents.defaults.subagents.model` ou des
remplacements par agent. Lorsqu’un enfant a réellement besoin de la transcription courante du demandeur, l’agent peut demander
`context: "fork"` pour ce lancement uniquement.

## Modes de contexte

Les sous-agents natifs démarrent isolés à moins que l’appelant ne demande explicitement à forker la
transcription courante.

| Mode       | Quand l’utiliser                                                                                                                        | Comportement                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `isolated` | Recherche fraîche, implémentation indépendante, travail avec outil lent, ou tout ce qui peut être expliqué dans le texte de la tâche  | Crée une transcription enfant propre. C’est la valeur par défaut et cela réduit l’usage des tokens. |
| `fork`     | Travail qui dépend de la conversation actuelle, de résultats d’outils précédents ou d’instructions nuancées déjà présentes dans la transcription du demandeur | Branche la transcription du demandeur dans la session enfant avant son démarrage. |

Utilisez `fork` avec parcimonie. Il sert à une délégation sensible au contexte, pas à remplacer
la rédaction d’un prompt de tâche clair.

## Outil

Utilisez `sessions_spawn` :

- Démarre une exécution de sous-agent (`deliver: false`, lane globale : `subagent`)
- Puis exécute une étape d’annonce et publie la réponse d’annonce dans le canal de chat demandeur
- Modèle par défaut : hérite de l’appelant sauf si vous définissez `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` par agent) ; un `sessions_spawn.model` explicite reste prioritaire.
- Thinking par défaut : hérite de l’appelant sauf si vous définissez `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` par agent) ; un `sessions_spawn.thinking` explicite reste prioritaire.
- Délai d’exécution par défaut : si `sessions_spawn.runTimeoutSeconds` est omis, OpenClaw utilise `agents.defaults.subagents.runTimeoutSeconds` lorsqu’il est défini ; sinon il revient à `0` (pas de délai d’expiration).

Paramètres de l’outil :

- `task` (obligatoire)
- `label?` (facultatif)
- `agentId?` (facultatif ; lancer sous un autre identifiant d’agent si autorisé)
- `model?` (facultatif ; remplace le modèle du sous-agent ; les valeurs non valides sont ignorées et le sous-agent s’exécute sur le modèle par défaut avec un avertissement dans le résultat de l’outil)
- `thinking?` (facultatif ; remplace le niveau de thinking pour l’exécution du sous-agent)
- `runTimeoutSeconds?` (prend par défaut `agents.defaults.subagents.runTimeoutSeconds` lorsqu’il est défini, sinon `0` ; lorsqu’il est défini, l’exécution du sous-agent est interrompue après N secondes)
- `thread?` (par défaut `false` ; lorsque `true`, demande le flux d’association à un fil pour cette session de sous-agent)
- `mode?` (`run|session`)
  - la valeur par défaut est `run`
  - si `thread: true` et que `mode` est omis, la valeur par défaut devient `session`
  - `mode: "session"` requiert `thread: true`
- `cleanup?` (`delete|keep`, `keep` par défaut)
- `sandbox?` (`inherit|require`, `inherit` par défaut ; `require` rejette le lancement sauf si le runtime enfant cible est sandboxé)
- `context?` (`isolated|fork`, `isolated` par défaut ; sous-agents natifs uniquement)
  - `isolated` crée une transcription enfant propre et constitue la valeur par défaut.
  - `fork` branche la transcription actuelle du demandeur dans la session enfant afin que l’enfant démarre avec le même contexte de conversation.
  - Utilisez `fork` uniquement lorsque l’enfant a besoin de la transcription actuelle. Pour un travail circonscrit, omettez `context`.
- `sessions_spawn` n’accepte **pas** les paramètres de livraison de canal (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Pour la livraison, utilisez `message`/`sessions_send` depuis l’exécution lancée.

## Sessions liées à un fil

Lorsque les associations à un fil sont activées pour un canal, un sous-agent peut rester associé à un fil afin que les messages de suivi de l’utilisateur dans ce fil continuent d’être acheminés vers la même session de sous-agent.

### Canaux prenant en charge les fils

- Discord (actuellement le seul canal pris en charge) : prend en charge les sessions persistantes de sous-agent associées à un fil (`sessions_spawn` avec `thread: true`), les contrôles manuels de fil (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) et les clés d’adaptateur `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` et `channels.discord.threadBindings.spawnSubagentSessions`.

Flux rapide :

1. Lancez avec `sessions_spawn` en utilisant `thread: true` (et éventuellement `mode: "session"`).
2. OpenClaw crée ou associe un fil à cette cible de session dans le canal actif.
3. Les réponses et messages de suivi dans ce fil sont acheminés vers la session associée.
4. Utilisez `/session idle` pour inspecter/mettre à jour la perte automatique de focus par inactivité et `/session max-age` pour contrôler la limite stricte.
5. Utilisez `/unfocus` pour détacher manuellement.

Contrôles manuels :

- `/focus <target>` associe le fil actuel (ou en crée un) à une cible de sous-agent/session.
- `/unfocus` supprime l’association du fil actuellement associé.
- `/agents` liste les exécutions actives et l’état de l’association (`thread:<id>` ou `unbound`).
- `/session idle` et `/session max-age` fonctionnent uniquement pour les fils associés avec focus.

Commutateurs de configuration :

- Valeurs globales par défaut : `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Les remplacements par canal et les clés d’association automatique au lancement sont spécifiques à l’adaptateur. Voir **Canaux prenant en charge les fils** ci-dessus.

Voir [Référence de configuration](/fr/gateway/configuration-reference) et [Commandes slash](/fr/tools/slash-commands) pour les détails actuels par adaptateur.

Liste d’autorisation :

- `agents.list[].subagents.allowAgents` : liste d’identifiants d’agent pouvant être ciblés via `agentId` (`["*"]` pour tout autoriser). Par défaut : uniquement l’agent demandeur.
- `agents.defaults.subagents.allowAgents` : liste d’autorisation par défaut des agents cibles utilisée lorsque l’agent demandeur ne définit pas sa propre valeur `subagents.allowAgents`.
- Garde d’héritage de sandbox : si la session demandeuse est sandboxée, `sessions_spawn` rejette les cibles qui s’exécuteraient hors sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId` : lorsqu’à `true`, bloque les appels `sessions_spawn` qui omettent `agentId` (force une sélection explicite de profil). Par défaut : false.

Découverte :

- Utilisez `agents_list` pour voir quels identifiants d’agent sont actuellement autorisés pour `sessions_spawn`.

Archivage automatique :

- Les sessions de sous-agent sont automatiquement archivées après `agents.defaults.subagents.archiveAfterMinutes` (60 par défaut).
- L’archivage utilise `sessions.delete` et renomme la transcription en `*.deleted.<timestamp>` (dans le même dossier).
- `cleanup: "delete"` archive immédiatement après l’annonce (tout en conservant quand même la transcription via renommage).
- L’archivage automatique est effectué au mieux ; les temporisateurs en attente sont perdus si Gateway redémarre.
- `runTimeoutSeconds` **n’archive pas** automatiquement ; il ne fait qu’arrêter l’exécution. La session reste jusqu’à l’archivage automatique.
- L’archivage automatique s’applique de la même manière aux sessions de profondeur 1 et 2.
- Le nettoyage du navigateur est distinct du nettoyage d’archive : les onglets/processus de navigateur suivis sont fermés au mieux à la fin de l’exécution, même si l’enregistrement de transcription/session est conservé.

## Sous-agents imbriqués

Par défaut, les sous-agents ne peuvent pas lancer leurs propres sous-agents (`maxSpawnDepth: 1`). Vous pouvez activer un niveau d’imbrication en définissant `maxSpawnDepth: 2`, ce qui autorise le **modèle d’orchestration** : principal → sous-agent orchestrateur → sous-sous-agents workers.

### Comment l’activer

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // autoriser les sous-agents à lancer des enfants (par défaut : 1)
        maxChildrenPerAgent: 5, // nombre max d’enfants actifs par session d’agent (par défaut : 5)
        maxConcurrent: 8, // plafond global de concurrence des lanes (par défaut : 8)
        runTimeoutSeconds: 900, // délai d’expiration par défaut pour sessions_spawn lorsqu’omis (0 = pas de délai)
      },
    },
  },
}
```

### Niveaux de profondeur

| Profondeur | Forme de clé de session                      | Rôle                                          | Peut lancer ?                |
| ---------- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0          | `agent:<id>:main`                            | Agent principal                               | Toujours                     |
| 1          | `agent:<id>:subagent:<uuid>`                 | Sous-agent (orchestrateur si profondeur 2 autorisée) | Uniquement si `maxSpawnDepth >= 2` |
| 2          | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sous-sous-agent (worker feuille)              | Jamais                       |

### Chaîne d’annonce

Les résultats remontent la chaîne :

1. Le worker de profondeur 2 termine → annonce à son parent (orchestrateur de profondeur 1)
2. L’orchestrateur de profondeur 1 reçoit l’annonce, synthétise les résultats, termine → annonce à l’agent principal
3. L’agent principal reçoit l’annonce et la livre à l’utilisateur

Chaque niveau ne voit que les annonces de ses enfants directs.

Conseils opérationnels :

- Démarrez le travail enfant une fois et attendez les événements de fin au lieu de construire des boucles de sondage
  autour de `sessions_list`, `sessions_history`, `/subagents list` ou
  des commandes `exec` avec sleep.
- `sessions_list` et `/subagents list` gardent les relations de session enfant focalisées
  sur le travail en cours : les enfants actifs restent attachés, les enfants terminés restent visibles pendant une
  courte fenêtre récente, et les liens enfants obsolètes présents uniquement dans le stockage sont ignorés après leur
  fenêtre de fraîcheur. Cela empêche d’anciennes métadonnées `spawnedBy` / `parentSessionKey`
  de ressusciter des enfants fantômes après un redémarrage.
- Si un événement de fin d’enfant arrive après que vous avez déjà envoyé la réponse finale,
  le suivi correct est le jeton silencieux exact `NO_REPLY` / `no_reply`.

### Politique d’outils par profondeur

- Le rôle et la portée de contrôle sont écrits dans les métadonnées de session au moment du lancement. Cela empêche que des clés de session aplaties ou restaurées ne retrouvent accidentellement des privilèges d’orchestrateur.
- **Profondeur 1 (orchestrateur, lorsque `maxSpawnDepth >= 2`)** : obtient `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` afin de pouvoir gérer ses enfants. Les autres outils de session/système restent refusés.
- **Profondeur 1 (feuille, lorsque `maxSpawnDepth == 1`)** : pas d’outils de session (comportement par défaut actuel).
- **Profondeur 2 (worker feuille)** : pas d’outils de session — `sessions_spawn` est toujours refusé en profondeur 2. Ne peut pas lancer d’autres enfants.

### Limite de lancement par agent

Chaque session d’agent (à n’importe quelle profondeur) peut avoir au plus `maxChildrenPerAgent` (5 par défaut) enfants actifs à la fois. Cela empêche un éventail incontrôlé depuis un seul orchestrateur.

### Arrêt en cascade

L’arrêt d’un orchestrateur de profondeur 1 arrête automatiquement tous ses enfants de profondeur 2 :

- `/stop` dans le chat principal arrête tous les agents de profondeur 1 et se propage à leurs enfants de profondeur 2.
- `/subagents kill <id>` arrête un sous-agent spécifique et se propage à ses enfants.
- `/subagents kill all` arrête tous les sous-agents du demandeur et se propage.

## Authentification

L’authentification du sous-agent est résolue par **identifiant d’agent**, pas par type de session :

- La clé de session du sous-agent est `agent:<agentId>:subagent:<uuid>`.
- Le stockage d’authentification est chargé depuis le `agentDir` de cet agent.
- Les profils d’authentification de l’agent principal sont fusionnés comme **fallback** ; les profils d’agent remplacent les profils principaux en cas de conflit.

Remarque : la fusion est additive, donc les profils principaux restent toujours disponibles comme fallbacks. Une authentification entièrement isolée par agent n’est pas encore prise en charge.

## Annonce

Les sous-agents font leur retour via une étape d’annonce :

- L’étape d’annonce s’exécute dans la session du sous-agent (pas dans la session du demandeur).
- Si le sous-agent répond exactement `ANNOUNCE_SKIP`, rien n’est publié.
- Si le dernier texte d’assistant est le jeton silencieux exact `NO_REPLY` / `no_reply`,
  la sortie d’annonce est supprimée même si une progression visible plus ancienne existait.
- Sinon, la livraison dépend de la profondeur du demandeur :
  - les sessions demandeuses de niveau supérieur utilisent un appel de suivi `agent` avec livraison externe (`deliver=true`)
  - les sessions demandeuses de sous-agent imbriquées reçoivent une injection interne de suivi (`deliver=false`) afin que l’orchestrateur puisse synthétiser les résultats enfants dans la session
  - si une session demandeuse de sous-agent imbriquée a disparu, OpenClaw bascule vers le demandeur de cette session lorsqu’il est disponible
- Pour les sessions demandeuses de niveau supérieur, la livraison directe en mode fin résout d’abord toute route de conversation/fil associée ainsi que toute surcharge de hook, puis remplit les champs de cible de canal manquants à partir de la route stockée de la session demandeuse. Cela maintient les fins sur le bon chat/sujet même lorsque l’origine de fin n’identifie que le canal.
- L’agrégation des fins enfant est limitée à l’exécution demandeuse actuelle lors de la construction des résultats de fin imbriqués, empêchant que d’anciennes sorties d’enfants d’exécutions précédentes ne fuient dans l’annonce actuelle.
- Les réponses d’annonce préservent le routage vers le fil/sujet lorsqu’il est disponible sur les adaptateurs de canal.
- Le contexte d’annonce est normalisé en un bloc d’événement interne stable :
  - source (`subagent` ou `cron`)
  - clé/id de session enfant
  - type d’annonce + libellé de tâche
  - ligne d’état dérivée du résultat du runtime (`success`, `error`, `timeout` ou `unknown`)
  - contenu de résultat sélectionné à partir du dernier texte d’assistant visible, sinon du dernier texte `tool`/`toolResult` nettoyé ; les exécutions terminales en échec signalent un état d’échec sans rejouer le texte de réponse capturé
  - une instruction de suivi décrivant quand répondre ou rester silencieux
- `Status` n’est pas déduit de la sortie du modèle ; il provient des signaux de résultat du runtime.
- En cas de délai d’expiration, si l’enfant n’a fait que des appels d’outil, l’annonce peut condenser cet historique en un court résumé de progression partielle au lieu de rejouer la sortie brute des outils.

Les charges utiles d’annonce incluent une ligne de statistiques à la fin (même lorsqu’elles sont encapsulées) :

- Runtime (par ex. `runtime 5m12s`)
- Utilisation de tokens (entrée/sortie/total)
- Coût estimé lorsque la tarification du modèle est configurée (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` et chemin de transcription (afin que l’agent principal puisse récupérer l’historique via `sessions_history` ou inspecter le fichier sur disque)
- Les métadonnées internes sont destinées uniquement à l’orchestration ; les réponses destinées à l’utilisateur doivent être réécrites avec une voix d’assistant normale.

`sessions_history` est la voie d’orchestration la plus sûre :

- le rappel de l’assistant est d’abord normalisé :
  - les balises de thinking sont supprimées
  - les blocs d’échafaudage `<relevant-memories>` / `<relevant_memories>` sont supprimés
  - les blocs de charge utile XML d’appel d’outil en texte brut tels que `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` et
    `<function_calls>...</function_calls>` sont supprimés, y compris les
    charges utiles tronquées qui ne se ferment jamais proprement
  - l’échafaudage d’appel/résultat d’outil dégradé et les marqueurs de contexte historique sont supprimés
  - les jetons de contrôle de modèle qui fuitent, tels que `<|assistant|>`, les autres jetons ASCII
    `<|...|>` et les variantes en pleine largeur `<｜...｜>`, sont supprimés
  - le XML d’appel d’outil MiniMax mal formé est supprimé
- le texte de type identifiant/secret est caviardé
- les longs blocs peuvent être tronqués
- les très grands historiques peuvent supprimer les lignes plus anciennes ou remplacer une ligne surdimensionnée par
  `[sessions_history omitted: message too large]`
- l’inspection de la transcription brute sur disque est le fallback lorsque vous avez besoin de la transcription complète octet par octet

## Politique d’outils (outils de sous-agent)

Par défaut, les sous-agents obtiennent **tous les outils sauf les outils de session** et les outils système :

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` reste ici aussi une vue de rappel bornée et nettoyée ; ce n’est
pas un dump brut de transcription.

Lorsque `maxSpawnDepth >= 2`, les sous-agents orchestrateurs de profondeur 1 reçoivent en plus `sessions_spawn`, `subagents`, `sessions_list` et `sessions_history` afin de pouvoir gérer leurs enfants.

Remplacement via config :

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny l’emporte
        deny: ["gateway", "cron"],
        // si allow est défini, il devient allow-only (deny l’emporte toujours)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Concurrence

Les sous-agents utilisent une lane de file d’attente dédiée dans le processus :

- Nom de lane : `subagent`
- Concurrence : `agents.defaults.subagents.maxConcurrent` (8 par défaut)

## Vivacité et récupération

OpenClaw ne considère pas l’absence de `endedAt` comme une preuve permanente qu’un sous-agent
est encore vivant. Les exécutions non terminées plus anciennes que la fenêtre des exécutions obsolètes cessent d’être comptées comme
actives/en attente dans `/subagents list`, les résumés d’état, le
blocage des fins de descendants et les contrôles de concurrence par session.

Après un redémarrage de Gateway, les anciennes exécutions restaurées non terminées sont élaguées sauf si leur
session enfant est marquée `abortedLastRun: true`. Ces sessions enfants interrompues au redémarrage restent
récupérables via le flux de récupération d’orphelins de sous-agent, qui
envoie un message de reprise synthétique avant d’effacer le marqueur d’abandon.

## Arrêt

- L’envoi de `/stop` dans le chat demandeur interrompt la session demandeuse et arrête toutes les exécutions de sous-agent actives lancées depuis celle-ci, avec propagation aux enfants imbriqués.
- `/subagents kill <id>` arrête un sous-agent spécifique et se propage à ses enfants.

## Limitations

- L’annonce de sous-agent est effectuée **au mieux**. Si Gateway redémarre, le travail en attente « d’annonce de retour » est perdu.
- Les sous-agents partagent toujours les mêmes ressources de processus Gateway ; considérez `maxConcurrent` comme une soupape de sécurité.
- `sessions_spawn` est toujours non bloquant : il renvoie immédiatement `{ status: "accepted", runId, childSessionKey }`.
- Le contexte de sous-agent n’injecte que `AGENTS.md` + `TOOLS.md` (pas de `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`).
- La profondeur d’imbrication maximale est 5 (plage de `maxSpawnDepth` : 1–5). La profondeur 2 est recommandée pour la plupart des cas d’usage.
- `maxChildrenPerAgent` limite le nombre d’enfants actifs par session (5 par défaut, plage : 1–20).

## Lié

- [Agents ACP](/fr/tools/acp-agents)
- [Outils sandbox multi-agents](/fr/tools/multi-agent-sandbox-tools)
- [Envoi d’agent](/fr/tools/agent-send)
