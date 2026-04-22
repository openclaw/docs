---
read_when:
    - Vous voulez exécuter un travail en arrière-plan/en parallèle via l'agent
    - Vous modifiez `sessions_spawn` ou la politique d'outils des sous-agents
    - Vous implémentez ou dépannez des sessions de sous-agents liées à un fil
summary: 'Sous-agents : lancer des exécutions d''agent isolées qui annoncent les résultats dans la discussion du demandeur'
title: Sous-agents
x-i18n:
    generated_at: "2026-04-22T04:28:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef8d8faa296bdc1b56079bd4a24593ba2e1aa02b9929a7a191b0d8498364ce4e
    source_path: tools/subagents.md
    workflow: 15
---

# Sous-agents

Les sous-agents sont des exécutions d'agent en arrière-plan créées à partir d'une exécution d'agent existante. Ils s'exécutent dans leur propre session (`agent:<agentId>:subagent:<uuid>`) et, une fois terminés, **annoncent** leur résultat dans le canal de discussion du demandeur. Chaque exécution de sous-agent est suivie comme une [tâche en arrière-plan](/fr/automation/tasks).

## Commande slash

Utilisez `/subagents` pour inspecter ou contrôler les exécutions de sous-agents pour la **session actuelle** :

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Contrôles de liaison de fil :

Ces commandes fonctionnent sur les canaux qui prennent en charge les liaisons persistantes de fils. Voir **Canaux prenant en charge les fils** ci-dessous.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` affiche les métadonnées d'exécution (état, horodatages, ID de session, chemin de transcription, nettoyage).
Utilisez `sessions_history` pour une vue de rappel bornée et filtrée pour la sécurité ; inspectez le
chemin de transcription sur disque lorsque vous avez besoin de la transcription brute complète.

### Comportement de création

`/subagents spawn` démarre un sous-agent en arrière-plan comme commande utilisateur, pas comme relais interne, et envoie une mise à jour finale d'achèvement dans la discussion du demandeur lorsque l'exécution se termine.

- La commande de création n'est pas bloquante ; elle renvoie immédiatement un ID d'exécution.
- À l'achèvement, le sous-agent annonce un message de résumé/résultat dans le canal de discussion du demandeur.
- La livraison à l'achèvement est pilotée par push. Une fois lancé, ne bouclez pas sur `/subagents list`,
  `sessions_list` ou `sessions_history` juste pour attendre qu'il
  se termine ; n'inspectez l'état qu'à la demande pour le débogage ou l'intervention.
- À l'achèvement, OpenClaw ferme au mieux les onglets/processus navigateur suivis ouverts par cette session de sous-agent avant que le flux de nettoyage d'annonce ne continue.
- Pour les créations manuelles, la livraison est résiliente :
  - OpenClaw essaie d'abord une livraison directe `agent` avec une clé d'idempotence stable.
  - Si la livraison directe échoue, il bascule vers le routage par file d'attente.
  - Si le routage par file d'attente n'est toujours pas disponible, l'annonce est retentée avec un court backoff exponentiel avant abandon final.
- La livraison à l'achèvement conserve la route résolue du demandeur :
  - les routes d'achèvement liées à un fil ou à une conversation sont prioritaires lorsqu'elles sont disponibles
  - si l'origine d'achèvement ne fournit qu'un canal, OpenClaw remplit la cible/le compte manquants depuis la route résolue de la session du demandeur (`lastChannel` / `lastTo` / `lastAccountId`) afin que la livraison directe fonctionne quand même
- Le transfert d'achèvement vers la session du demandeur est un contexte interne généré à l'exécution (pas du texte rédigé par l'utilisateur) et inclut :
  - `Result` (dernier texte de réponse `assistant` visible, sinon dernier texte nettoyé de `tool`/`toolResult` ; les exécutions terminales en échec ne réutilisent pas le texte de réponse capturé)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - statistiques compactes d'exécution/jetons
  - une instruction de livraison disant à l'agent demandeur de reformuler avec une voix normale d'assistant (et non de transmettre les métadonnées internes brutes)
- `--model` et `--thinking` remplacent les valeurs par défaut pour cette exécution spécifique.
- Utilisez `info`/`log` pour inspecter les détails et la sortie après achèvement.
- `/subagents spawn` est un mode à usage unique (`mode: "run"`). Pour les sessions persistantes liées à un fil, utilisez `sessions_spawn` avec `thread: true` et `mode: "session"`.
- Pour les sessions de harnais ACP (Codex, Claude Code, Gemini CLI), utilisez `sessions_spawn` avec `runtime: "acp"` et consultez [ACP Agents](/fr/tools/acp-agents), en particulier le [modèle de livraison ACP](/fr/tools/acp-agents#delivery-model) lorsque vous déboguez les achèvements ou les boucles agent-à-agent.

Objectifs principaux :

- Paralléliser le travail de type « recherche / tâche longue / outil lent » sans bloquer l'exécution principale.
- Garder les sous-agents isolés par défaut (séparation de session + sandboxing facultatif).
- Garder la surface d'outils difficile à mal utiliser : les sous-agents **n'obtiennent pas** les outils de session par défaut.
- Prendre en charge une profondeur d'imbrication configurable pour les modèles d'orchestration.

Note sur le coût : chaque sous-agent a son **propre** contexte et sa propre consommation de jetons. Pour les tâches lourdes ou répétitives, définissez un modèle moins coûteux pour les sous-agents et gardez votre agent principal sur un modèle de meilleure qualité.
Vous pouvez configurer cela via `agents.defaults.subagents.model` ou avec des substitutions par agent.

## Outil

Utilisez `sessions_spawn` :

- Démarre une exécution de sous-agent (`deliver: false`, voie globale : `subagent`)
- Exécute ensuite une étape d'annonce et publie la réponse d'annonce dans le canal de discussion du demandeur
- Modèle par défaut : hérite de l'appelant sauf si vous définissez `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` par agent) ; un `sessions_spawn.model` explicite reste prioritaire.
- Niveau de réflexion par défaut : hérite de l'appelant sauf si vous définissez `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` par agent) ; un `sessions_spawn.thinking` explicite reste prioritaire.
- Délai d'expiration d'exécution par défaut : si `sessions_spawn.runTimeoutSeconds` est omis, OpenClaw utilise `agents.defaults.subagents.runTimeoutSeconds` lorsqu'il est défini ; sinon il revient à `0` (pas de délai d'expiration).

Paramètres de l'outil :

- `task` (obligatoire)
- `label?` (facultatif)
- `agentId?` (facultatif ; création sous un autre ID d'agent si autorisé)
- `model?` (facultatif ; remplace le modèle du sous-agent ; les valeurs invalides sont ignorées et le sous-agent s'exécute avec le modèle par défaut avec un avertissement dans le résultat de l'outil)
- `thinking?` (facultatif ; remplace le niveau de réflexion pour l'exécution du sous-agent)
- `runTimeoutSeconds?` (par défaut `agents.defaults.subagents.runTimeoutSeconds` lorsqu'il est défini, sinon `0` ; lorsqu'il est défini, l'exécution du sous-agent est interrompue après N secondes)
- `thread?` (par défaut `false` ; lorsque `true`, demande une liaison de fil de canal pour cette session de sous-agent)
- `mode?` (`run|session`)
  - la valeur par défaut est `run`
  - si `thread: true` et `mode` omis, la valeur par défaut devient `session`
  - `mode: "session"` exige `thread: true`
- `cleanup?` (`delete|keep`, par défaut `keep`)
- `sandbox?` (`inherit|require`, par défaut `inherit` ; `require` rejette la création si l'environnement enfant cible n'est pas sandboxé)
- `sessions_spawn` n'accepte **pas** les paramètres de livraison de canal (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Pour la livraison, utilisez `message`/`sessions_send` depuis l'exécution créée.

## Sessions liées à un fil

Lorsque les liaisons de fils sont activées pour un canal, un sous-agent peut rester lié à un fil afin que les messages de suivi de l'utilisateur dans ce fil continuent d'être routés vers la même session de sous-agent.

### Canaux prenant en charge les fils

- Discord (actuellement le seul canal pris en charge) : prend en charge les sessions persistantes de sous-agents liées à un fil (`sessions_spawn` avec `thread: true`), les contrôles manuels de fil (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), et les clés d'adaptateur `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` et `channels.discord.threadBindings.spawnSubagentSessions`.

Flux rapide :

1. Créez avec `sessions_spawn` en utilisant `thread: true` (et éventuellement `mode: "session"`).
2. OpenClaw crée ou lie un fil à cette cible de session dans le canal actif.
3. Les réponses et messages de suivi dans ce fil sont routés vers la session liée.
4. Utilisez `/session idle` pour inspecter/mettre à jour le retrait automatique du focus en cas d'inactivité et `/session max-age` pour contrôler la limite stricte.
5. Utilisez `/unfocus` pour détacher manuellement.

Contrôles manuels :

- `/focus <target>` lie le fil actuel (ou en crée un) à une cible de sous-agent/session.
- `/unfocus` supprime la liaison pour le fil actuellement lié.
- `/agents` liste les exécutions actives et l'état de liaison (`thread:<id>` ou `unbound`).
- `/session idle` et `/session max-age` ne fonctionnent que pour les fils liés avec focus.

Options de configuration :

- Valeurs globales par défaut : `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Les substitutions de canal et les clés de liaison automatique à la création sont spécifiques à l'adaptateur. Voir **Canaux prenant en charge les fils** ci-dessus.

Consultez [Référence de configuration](/fr/gateway/configuration-reference) et [Commandes slash](/fr/tools/slash-commands) pour les détails actuels de l'adaptateur.

Liste d'autorisation :

- `agents.list[].subagents.allowAgents` : liste des IDs d'agent pouvant être ciblés via `agentId` (`["*"]` pour autoriser n'importe lequel). Par défaut : uniquement l'agent demandeur.
- `agents.defaults.subagents.allowAgents` : liste d'autorisation d'agents cibles par défaut utilisée lorsque l'agent demandeur ne définit pas sa propre valeur `subagents.allowAgents`.
- Garde-fou d'héritage du sandbox : si la session demandeuse est sandboxée, `sessions_spawn` rejette les cibles qui s'exécuteraient sans sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId` : lorsqu'ils valent true, bloquent les appels `sessions_spawn` qui omettent `agentId` (force une sélection explicite de profil). Par défaut : false.

Découverte :

- Utilisez `agents_list` pour voir quels IDs d'agent sont actuellement autorisés pour `sessions_spawn`.

Archivage automatique :

- Les sessions de sous-agents sont automatiquement archivées après `agents.defaults.subagents.archiveAfterMinutes` (par défaut : 60).
- L'archivage utilise `sessions.delete` et renomme la transcription en `*.deleted.<timestamp>` (dans le même dossier).
- `cleanup: "delete"` archive immédiatement après l'annonce (conserve toujours la transcription via renommage).
- L'archivage automatique est au mieux ; les minuteurs en attente sont perdus si la Gateway redémarre.
- `runTimeoutSeconds` n'archive **pas** automatiquement ; il arrête seulement l'exécution. La session reste jusqu'à l'archivage automatique.
- L'archivage automatique s'applique de la même manière aux sessions de profondeur 1 et de profondeur 2.
- Le nettoyage du navigateur est distinct du nettoyage d'archive : les onglets/processus navigateur suivis sont fermés au mieux lorsque l'exécution se termine, même si l'enregistrement de transcription/session est conservé.

## Sous-agents imbriqués

Par défaut, les sous-agents ne peuvent pas créer leurs propres sous-agents (`maxSpawnDepth: 1`). Vous pouvez activer un niveau d'imbrication en définissant `maxSpawnDepth: 2`, ce qui autorise le **modèle d'orchestration** : principal → sous-agent orchestrateur → sous-sous-agents workers.

### Comment l'activer

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // autoriser les sous-agents à créer des enfants (par défaut : 1)
        maxChildrenPerAgent: 5, // nombre max d'enfants actifs par session d'agent (par défaut : 5)
        maxConcurrent: 8, // limite globale de concurrence de la voie (par défaut : 8)
        runTimeoutSeconds: 900, // délai d'expiration par défaut pour sessions_spawn lorsqu'il est omis (0 = pas de délai)
      },
    },
  },
}
```

### Niveaux de profondeur

| Profondeur | Forme de clé de session                      | Rôle                                          | Peut créer ?                |
| ----- | -------------------------------------------- | --------------------------------------------- | --------------------------- |
| 0     | `agent:<id>:main`                            | Agent principal                               | Toujours                    |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sous-agent (orchestrateur si profondeur 2 autorisée) | Uniquement si `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sous-sous-agent (worker feuille)              | Jamais                      |

### Chaîne d'annonce

Les résultats remontent dans la chaîne :

1. Le worker de profondeur 2 se termine → annonce à son parent (orchestrateur de profondeur 1)
2. L'orchestrateur de profondeur 1 reçoit l'annonce, synthétise les résultats, se termine → annonce au principal
3. L'agent principal reçoit l'annonce et la livre à l'utilisateur

Chaque niveau ne voit que les annonces de ses enfants directs.

Recommandations opérationnelles :

- Démarrez le travail enfant une seule fois et attendez les événements d'achèvement au lieu de construire des boucles de polling autour de `sessions_list`, `sessions_history`, `/subagents list` ou des commandes `exec` de type sleep.
- Si un événement d'achèvement enfant arrive après que vous avez déjà envoyé la réponse finale, le bon suivi est le jeton silencieux exact `NO_REPLY` / `no_reply`.

### Politique d'outils par profondeur

- Le rôle et la portée de contrôle sont écrits dans les métadonnées de session au moment de la création. Cela empêche les clés de session aplaties ou restaurées de récupérer accidentellement des privilèges d'orchestrateur.
- **Profondeur 1 (orchestrateur, lorsque `maxSpawnDepth >= 2`)** : reçoit `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` afin de pouvoir gérer ses enfants. Les autres outils de session/système restent refusés.
- **Profondeur 1 (feuille, lorsque `maxSpawnDepth == 1`)** : aucun outil de session (comportement par défaut actuel).
- **Profondeur 2 (worker feuille)** : aucun outil de session — `sessions_spawn` est toujours refusé à la profondeur 2. Ne peut pas créer d'autres enfants.

### Limite de création par agent

Chaque session d'agent (à n'importe quelle profondeur) peut avoir au plus `maxChildrenPerAgent` (par défaut : 5) enfants actifs à la fois. Cela empêche une diffusion incontrôlée à partir d'un seul orchestrateur.

### Arrêt en cascade

L'arrêt d'un orchestrateur de profondeur 1 arrête automatiquement tous ses enfants de profondeur 2 :

- `/stop` dans la discussion principale arrête tous les agents de profondeur 1 et cascade vers leurs enfants de profondeur 2.
- `/subagents kill <id>` arrête un sous-agent spécifique et cascade vers ses enfants.
- `/subagents kill all` arrête tous les sous-agents du demandeur et cascade.

## Authentification

L'authentification des sous-agents est résolue par **ID d'agent**, pas par type de session :

- La clé de session du sous-agent est `agent:<agentId>:subagent:<uuid>`.
- Le stockage d'authentification est chargé depuis `agentDir` de cet agent.
- Les profils d'authentification de l'agent principal sont fusionnés comme **repli** ; les profils de l'agent remplacent les profils principaux en cas de conflit.

Remarque : la fusion est additive, donc les profils principaux sont toujours disponibles comme solutions de repli. Une authentification totalement isolée par agent n'est pas encore prise en charge.

## Annonce

Les sous-agents remontent l'information via une étape d'annonce :

- L'étape d'annonce s'exécute à l'intérieur de la session du sous-agent (pas dans la session du demandeur).
- Si le sous-agent répond exactement `ANNOUNCE_SKIP`, rien n'est publié.
- Si le dernier texte assistant est exactement le jeton silencieux `NO_REPLY` / `no_reply`,
  la sortie d'annonce est supprimée même si une progression visible antérieure existait.
- Sinon, la livraison dépend de la profondeur du demandeur :
  - les sessions demandeuses de niveau supérieur utilisent un appel `agent` de suivi avec livraison externe (`deliver=true`)
  - les sessions de sous-agent demandeuses imbriquées reçoivent une injection interne de suivi (`deliver=false`) afin que l'orchestrateur puisse synthétiser les résultats enfants dans la session
  - si une session de sous-agent demandeuse imbriquée a disparu, OpenClaw se replie sur le demandeur de cette session lorsque c'est possible
- Pour les sessions demandeuses de niveau supérieur, la livraison directe en mode achèvement résout d'abord toute route de conversation/fil liée et toute substitution de hook, puis remplit les champs cible de canal manquants depuis la route stockée de la session demandeuse. Cela maintient les achèvements dans la bonne discussion/le bon sujet même lorsque l'origine d'achèvement n'identifie que le canal.
- L'agrégation des achèvements enfants est limitée à l'exécution demandeuse actuelle lors de la construction des constats d'achèvement imbriqués, empêchant que d'anciennes sorties d'enfants issues d'exécutions précédentes fuient dans l'annonce actuelle.
- Les réponses d'annonce préservent le routage de fil/sujet lorsqu'il est disponible sur les adaptateurs de canal.
- Le contexte d'annonce est normalisé en un bloc d'événement interne stable :
  - source (`subagent` ou `cron`)
  - clé/ID de session enfant
  - type d'annonce + étiquette de tâche
  - ligne d'état dérivée du résultat d'exécution (`success`, `error`, `timeout` ou `unknown`)
  - contenu de résultat sélectionné depuis le dernier texte assistant visible, sinon depuis le dernier texte nettoyé de `tool`/`toolResult` ; les exécutions terminales en échec signalent l'état d'échec sans rejouer le texte de réponse capturé
  - une instruction de suivi décrivant quand répondre ou rester silencieux
- `Status` n'est pas déduit de la sortie du modèle ; il provient des signaux du résultat d'exécution.
- En cas de délai d'expiration, si l'enfant n'est allé que jusqu'aux appels d'outils, l'annonce peut réduire cet historique à un court résumé de progression partielle au lieu de rejouer la sortie brute des outils.

Les charges utiles d'annonce incluent une ligne de statistiques à la fin (même lorsqu'elles sont encapsulées) :

- Temps d'exécution (par exemple `runtime 5m12s`)
- Utilisation de jetons (entrée/sortie/total)
- Coût estimé lorsque la tarification du modèle est configurée (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` et chemin de transcription (afin que l'agent principal puisse récupérer l'historique via `sessions_history` ou inspecter le fichier sur disque)
- Les métadonnées internes sont destinées uniquement à l'orchestration ; les réponses destinées à l'utilisateur doivent être reformulées avec une voix normale d'assistant.

`sessions_history` est le chemin d'orchestration le plus sûr :

- le rappel assistant est d'abord normalisé :
  - les balises de réflexion sont supprimées
  - les blocs d'échafaudage `<relevant-memories>` / `<relevant_memories>` sont supprimés
  - les blocs de charge utile XML d'appel d'outil en texte brut tels que `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` et
    `<function_calls>...</function_calls>` sont supprimés, y compris les charges
    utiles tronquées qui ne se ferment jamais correctement
  - les échafaudages dégradés d'appel/résultat d'outil et les marqueurs de contexte historique sont supprimés
  - les jetons de contrôle de modèle divulgués tels que `<|assistant|>`, d'autres jetons ASCII
    `<|...|>` et les variantes pleine largeur `<｜...｜>` sont supprimés
  - le XML mal formé d'appel d'outil MiniMax est supprimé
- le texte ressemblant à des identifiants/jetons est expurgé
- les longs blocs peuvent être tronqués
- les historiques très volumineux peuvent supprimer les lignes plus anciennes ou remplacer une ligne surdimensionnée par
  `[sessions_history omitted: message too large]`
- l'inspection brute de la transcription sur disque reste la solution de repli lorsque vous avez besoin de la transcription complète octet par octet

## Politique d'outils (outils de sous-agent)

Par défaut, les sous-agents obtiennent **tous les outils sauf les outils de session** et les outils système :

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` reste ici aussi une vue de rappel bornée et nettoyée ; ce n'est
pas une extraction brute de transcription.

Lorsque `maxSpawnDepth >= 2`, les sous-agents orchestrateurs de profondeur 1 reçoivent en plus `sessions_spawn`, `subagents`, `sessions_list` et `sessions_history` afin de pouvoir gérer leurs enfants.

Remplacer via la configuration :

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
        // deny est prioritaire
        deny: ["gateway", "cron"],
        // si allow est défini, cela devient une liste d'autorisation stricte (deny reste prioritaire)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Concurrence

Les sous-agents utilisent une voie de file dédiée dans le processus :

- Nom de la voie : `subagent`
- Concurrence : `agents.defaults.subagents.maxConcurrent` (par défaut `8`)

## Arrêt

- Envoyer `/stop` dans la discussion du demandeur interrompt la session du demandeur et arrête toutes les exécutions actives de sous-agents créées depuis celle-ci, avec cascade vers les enfants imbriqués.
- `/subagents kill <id>` arrête un sous-agent spécifique et cascade vers ses enfants.

## Limitations

- L'annonce du sous-agent est **au mieux**. Si la Gateway redémarre, le travail d'« annonce de retour » en attente est perdu.
- Les sous-agents partagent toujours les mêmes ressources du processus Gateway ; considérez `maxConcurrent` comme une soupape de sécurité.
- `sessions_spawn` est toujours non bloquant : il renvoie immédiatement `{ status: "accepted", runId, childSessionKey }`.
- Le contexte de sous-agent n'injecte que `AGENTS.md` + `TOOLS.md` (pas de `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`).
- La profondeur d'imbrication maximale est 5 (plage `maxSpawnDepth` : 1–5). La profondeur 2 est recommandée pour la plupart des cas d'usage.
- `maxChildrenPerAgent` limite les enfants actifs par session (par défaut : 5, plage : 1–20).
