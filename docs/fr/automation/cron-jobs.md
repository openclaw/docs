---
read_when:
    - Planification de tâches en arrière-plan ou de réveils
    - Connexion de déclencheurs externes (webhooks, Gmail) à OpenClaw
    - Choisir entre Heartbeat et Cron pour les tâches planifiées
sidebarTitle: Scheduled tasks
summary: Tâches planifiées, Webhooks et déclencheurs Gmail PubSub pour le planificateur du Gateway
title: Tâches planifiées
x-i18n:
    generated_at: "2026-07-16T12:52:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9a419d4376fa08df1c429c167ead6918262cc34b986a85ffec024023f6da1eef
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron est le planificateur intégré du Gateway. Il conserve les tâches, réveille l’agent au moment opportun et peut envoyer la sortie vers un canal de discussion, un Webhook ou nulle part.

## Démarrage rapide

<Steps>
  <Step title="Ajouter un rappel ponctuel">
    ```bash
    openclaw cron create "2027-02-01T16:00:00Z" \
      --name "Rappel" \
      --session main \
      --system-event "Rappel : vérifier le brouillon de la documentation de Cron" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Vérifier vos tâches">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Consulter l’historique des exécutions">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Fonctionnement de Cron

- Cron s’exécute **dans le processus du Gateway**, et non dans le modèle. Le Gateway doit être en cours d’exécution pour que les planifications se déclenchent.
- Les définitions des tâches, l’état d’exécution et l’historique des exécutions sont conservés dans la base de données d’état SQLite partagée d’OpenClaw, de sorte que les redémarrages ne font pas perdre les planifications.
- Chaque exécution de Cron crée un enregistrement de [tâche en arrière-plan](/fr/automation/tasks).
- Les tâches ponctuelles (`--at`) sont supprimées automatiquement après une exécution réussie par défaut ; transmettez `--keep-after-run` pour les conserver.
- Budget de temps écoulé par exécution : `--timeout-seconds` lorsqu’il est défini. Sinon, les tâches de tour d’agent isolées/détachées sont limitées par le propre mécanisme de surveillance de 60 minutes de Cron avant que le délai d’expiration du tour d’agent sous-jacent (`agents.defaults.timeoutSeconds`, 48 heures par défaut) puisse s’appliquer ; la durée par défaut des tâches de commande est de 10 minutes.
- Au démarrage du Gateway, les tâches de tour d’agent isolées en retard sont replanifiées au lieu d’être immédiatement réexécutées, afin que le travail d’initialisation du modèle et des outils n’empiète pas sur la fenêtre de connexion au canal.
- Si vous pilotez `openclaw agent` depuis le Cron système ou un autre planificateur externe, encapsulez-le avec une escalade vers un arrêt forcé, même si la CLI gère déjà `SIGTERM`/`SIGINT`. Les exécutions gérées par le Gateway lui demandent d’interrompre les exécutions acceptées ; les exécutions locales et intégrées de secours reçoivent le même signal d’interruption. Pour GNU `timeout`, préférez `timeout -k 60 600 openclaw agent ...` à la simple option `timeout 600 ...` — la valeur `-k` sert de dernier recours si le processus ne peut pas se terminer proprement à temps. Pour les unités systemd, utilisez un signal d’arrêt `SIGTERM` avec une période de grâce (`TimeoutStopSec`) avant l’arrêt définitif. La réutilisation d’un `--run-id` alors que l’exécution d’origine du Gateway est toujours active signale le doublon comme étant en cours au lieu de lancer une seconde exécution.

<AccordionGroup>
  <Accordion title="Durcissement des exécutions isolées">
    - À leur terme, les exécutions isolées tentent, dans la mesure du possible, de fermer les onglets/processus de navigateur suivis pour leur session `cron:<jobId>` et libèrent toutes les instances d’exécution MCP intégrées créées pour la tâche via le même chemin de nettoyage partagé que celui utilisé par les exécutions de la session principale et des sessions personnalisées. Les échecs de nettoyage sont ignorés afin que le résultat de Cron reste prioritaire.
    - Les exécutions isolées disposant de l’autorisation restreinte d’autonettoyage de Cron peuvent consulter l’état du planificateur, une liste filtrée ne contenant que leur propre tâche et l’historique d’exécution de cette tâche, et ne peuvent supprimer que leur propre tâche.
    - Les exécutions isolées se prémunissent contre les réponses d’accusé de réception obsolètes : si le premier résultat n’est qu’une mise à jour d’état intermédiaire (`on it`, `pulling everything together` et indications similaires) et qu’aucun sous-agent descendant n’est encore responsable de la réponse finale, OpenClaw relance une fois la demande pour obtenir le résultat réel avant la livraison.
    - Les métadonnées structurées de refus d’exécution (y compris les encapsulations `UNAVAILABLE` de l’hôte Node dont l’erreur imbriquée commence par `SYSTEM_RUN_DENIED` ou `INVALID_REQUEST`) sont reconnues afin qu’une commande bloquée ne soit pas signalée comme une exécution réussie, sans pour autant confondre le texte ordinaire de l’assistant avec un refus.
    - Les échecs d’agent au niveau de l’exécution sont considérés comme des erreurs de tâche, même en l’absence de contenu de réponse ; les échecs du modèle ou du fournisseur incrémentent donc les compteurs d’erreurs et déclenchent des notifications d’échec au lieu de marquer la tâche comme réussie.
    - Lorsqu’une tâche atteint `timeoutSeconds`, Cron interrompt l’exécution et lui accorde une courte fenêtre de nettoyage. Si elle ne se termine pas proprement, le nettoyage géré par le Gateway libère de force la propriété de session de cette exécution avant que Cron n’enregistre l’expiration du délai, afin que les travaux de discussion en file d’attente ne restent pas bloqués derrière une session de traitement obsolète.
    - Les blocages pendant la configuration ou le démarrage disposent d’un délai d’expiration propre à leur phase (par exemple `cron: isolated agent setup timed out before runner start` ou `cron: isolated agent run stalled before execution start (last phase: context-engine)`). Ces mécanismes de surveillance couvrent les fournisseurs intégrés et ceux gérés par la CLI, même avant le démarrage de leur processus CLI externe, et leur limite est indépendante des longues valeurs de `timeoutSeconds`, afin que les échecs de démarrage à froid, d’authentification ou de contexte apparaissent rapidement.

  </Accordion>
  <Accordion title="Réconciliation des tâches">
    La réconciliation des tâches Cron repose d’abord sur l’environnement d’exécution, puis sur l’historique durable : une tâche Cron active reste en cours tant que l’environnement d’exécution de Cron considère encore cette tâche comme active, même si une ancienne ligne de session enfant existe toujours. Lorsque l’environnement d’exécution cesse de posséder la tâche et qu’une période de grâce de 5 minutes s’est écoulée, les vérifications de maintenance consultent les journaux d’exécution conservés et l’état de la tâche pour l’exécution `cron:<jobId>:<startedAt>` correspondante. Un résultat terminal y finalise le registre des tâches ; dans le cas contraire, la maintenance gérée par le Gateway peut marquer la tâche comme `lost`. L’audit hors ligne de la CLI peut effectuer une récupération à partir de l’historique durable, mais le fait que son propre ensemble de tâches actives en cours de traitement soit vide ne prouve pas qu’une exécution gérée par le Gateway a disparu.
  </Accordion>
</AccordionGroup>

## Types de planification

| Type      | Option CLI    | Description                                                                                              |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`      | Horodatage ponctuel (ISO 8601 ou relatif, comme `20m`)                                                     |
| `every`   | `--every`   | Intervalle fixe (`10m`, `1h`, `1d`)                                                                       |
| `cron`    | `--cron`    | Expression Cron à 5 ou 6 champs avec `--tz` facultatif                                                  |
| `on-exit` | `--on-exit` | Déclenchement unique à la fin d’une commande surveillée (déclencheur d’événement ; persiste après la fin du tour ; `--on-exit-cwd` facultatif) |

Les horodatages sans fuseau horaire sont interprétés comme étant en UTC. Ajoutez `--tz America/New_York` pour interpréter une date et heure `--at` sans décalage, ou pour évaluer une expression Cron, dans ce fuseau horaire IANA. Les expressions Cron sans `--tz` utilisent le fuseau horaire de l’hôte du Gateway. `--tz` n’est pas valide avec `--every` ou `--on-exit`.

Les expressions récurrentes au début de l’heure (minute `0` avec un champ d’heure générique) sont automatiquement décalées de 5 minutes au maximum pour réduire les pics de charge. Utilisez `--exact` pour imposer une exécution précise, ou `--stagger 30s` pour définir une fenêtre explicite (planifications Cron uniquement).

### Le jour du mois et le jour de la semaine utilisent une logique OU

Les expressions Cron sont analysées par [croner](https://github.com/Hexagon/croner). Lorsque les champs du jour du mois et du jour de la semaine ne sont ni l’un ni l’autre génériques, croner considère qu’il y a correspondance si **l’un ou l’autre** des champs correspond, et non les deux. Il s’agit du comportement standard de Vixie cron.

```bash
# Intention : « 9 h le 15, uniquement s’il s’agit d’un lundi »
# Réalité :  « 9 h chaque 15 du mois, ET 9 h chaque lundi »
0 9 15 * 1
```

Cette expression se déclenche environ 5 à 6 fois par mois au lieu de 0 à 1 fois par mois. Pour exiger les deux conditions, utilisez le modificateur de jour de la semaine `+` de croner (`0 9 15 * +1`), ou planifiez selon un champ et vérifiez l’autre dans l’invite ou la commande de votre tâche.

## Déclencheurs d’événements (surveillance de conditions)

Un déclencheur d’événement ajoute un script de condition sans interface à une planification `every` ou `cron`. Cron évalue le script lorsque la tâche arrive à échéance et exécute le contenu normal uniquement lorsque le script renvoie `fire: true` :

```json5
{
  schedule: { kind: "every", everyMs: 30000 },
  trigger: {
    // Se déclenche uniquement lorsque l’état observé diffère de celui de la dernière évaluation.
    script: "const res = await tools.call('exec', { command: 'gh pr checks 123 --json state -q \\'.[].state\\' | sort -u' }); const status = String(res?.result?.details?.aggregated ?? '').trim(); json({ fire: status !== trigger.state?.status, message: `CI de la PR 123 : ${trigger.state?.status ?? 'inconnu'} -> ${status}`, state: { status } });",
    once: false,
  },
  payload: { kind: "agentTurn", message: "Examiner la modification de l’état de la CI." },
}
```

Le script doit renvoyer `{ fire, message?, state? }`. L’état JSON précédent est disponible sous la forme de l’objet profondément figé `trigger.state` ; renvoyez une nouvelle valeur `state` pour la conserver. La taille de l’état est limitée à 16 Ko. Lorsqu’un résultat déclencheur contient `message`, Cron l’ajoute au texte de l’événement système ou au message du tour d’agent avant l’exécution. `once: true` désactive la tâche après la première exécution réussie de son contenu déclenché.

`fire: false` conserve l’état d’évaluation et les compteurs, puis replanifie sans créer d’historique d’exécution. Si l’exécution d’un contenu déclenché échoue, la valeur `state` renvoyée n’est **pas** conservée — l’évaluation suivante voit l’état précédent et peut se déclencher de nouveau ; écrivez donc les scripts comme des vérifications en lecture seule et conservez les actions dans le contenu. Les planifications avec déclencheur disposent d’un intervalle minimal configurable (30 secondes par défaut). Chaque évaluation possède un budget de temps écoulé de 30 secondes et peut effectuer jusqu’à 5 appels d’outils.

<Warning>
L’activation de `cron.triggers.enabled` permet aux scripts créés par un agent de s’exécuter sans interface avec la **politique d’outils complète de l’agent propriétaire, y compris `exec`**. Considérez cela comme une exécution de code sans surveillance avec les autorisations de cet agent ; laissez cette option désactivée, sauf si chaque agent autorisé à créer des tâches Cron est jugé suffisamment fiable.
</Warning>

Créez une surveillance à partir d’un fichier de script local (`-` lit le script depuis l’entrée standard) :

```bash
openclaw cron add \
  --name "Surveillance de la CI de la PR" \
  --every 30s \
  --trigger-script ./watch-pr-ci.js \
  --message "Répondre à la modification de l’état de la CI" \
  --session isolated
```

## Contenus

Chaque tâche contient exactement un type de contenu, choisi au moyen d’une option :

| Contenu       | Option                                           | Exécution                                                    |
| ------------- | ---------------------------------------------- | ------------------------------------------------------- |
| Événement système  | `--system-event <text>`                        | Mis en file d’attente dans la session principale, sans appel de modèle à lui seul |
| Message d’agent | `--message <text>`                             | Un tour d’agent reposant sur un modèle                               |
| Commande       | `--command <shell>` ou `--command-argv <json>` | Un shell/processus sur l’hôte du Gateway, sans appel de modèle      |

### Options des tours d’agent

<ParamField path="--message" type="string" required>
  Texte du prompt (requis pour les tâches isolées, de session actuelle ou de session personnalisée).
</ParamField>
<ParamField path="--model" type="string">
  Remplacement du modèle ; doit correspondre à un modèle autorisé, sinon l’exécution échoue avec une erreur de validation.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Liste des modèles de secours propre à la tâche, par exemple `--fallbacks openai/gpt-5.6-sol,openrouter/meta-llama/llama-3.3-70b-instruct:free`. Transmettez `--fallbacks ""` pour une exécution stricte sans modèle de secours.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Avec `cron edit`, supprime le remplacement des modèles de secours propre à la tâche afin que celle-ci suive l’ordre de priorité configuré pour les modèles de secours. Ne peut pas être combiné avec `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Avec `cron edit`, supprime le remplacement du modèle propre à la tâche afin que celle-ci suive l’ordre de priorité normal des modèles Cron (remplacement stocké pour la session Cron, sinon modèle de l’agent/par défaut). Ne peut pas être combiné avec `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Remplacement du niveau de raisonnement (`off|minimal|low|medium|high|xhigh|adaptive|max|ultra`). Les niveaux disponibles dépendent toujours du modèle sélectionné et de l’environnement d’exécution de l’agent.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Avec `cron edit`, supprime le remplacement du niveau de raisonnement propre à la tâche. Ne peut pas être combiné avec `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Ignore l’injection des fichiers d’initialisation de l’espace de travail.
</ParamField>
<ParamField path="--tools" type="string">
  Limite les outils que la tâche peut utiliser, par exemple `--tools exec,read`.
</ParamField>

`--model` définit le modèle principal de la tâche ; il ne remplace pas un remplacement `/model` de session, de sorte que les chaînes de modèles de secours configurées continuent de s’appliquer par-dessus. Un modèle introuvable ou non autorisé fait échouer l’exécution avec une erreur de validation explicite au lieu de revenir silencieusement au modèle par défaut. Si une tâche comporte `--model`, mais aucune liste de modèles de secours explicite ou configurée, OpenClaw transmet un remplacement vide des modèles de secours au lieu d’ajouter silencieusement le modèle principal de l’agent comme cible de nouvelle tentative masquée.

Ordre de priorité de sélection du modèle pour les tâches isolées, du plus élevé au plus faible :

1. Charge utile `model` propre à la tâche (configuration explicite ; un modèle non autorisé fait échouer l’exécution)
2. Remplacement du modèle par le hook Gmail (uniquement lorsque l’exécution provient de Gmail et que ce remplacement est autorisé)
3. Remplacement du modèle de session Cron stocké et sélectionné par l’utilisateur
4. Sélection du modèle de l’agent/par défaut

Le mode rapide suit la sélection active résolue. Si la configuration du modèle sélectionné comporte `params.fastMode`, le Cron isolé l’utilise par défaut ; un remplacement `fastMode` stocké pour la session (puis un `fastModeDefault` de l’agent) reste prioritaire sur la configuration du modèle dans les deux sens. Le mode automatique utilise le seuil `params.fastAutoOnSeconds` du modèle, avec une valeur par défaut de 60 secondes.

Si une exécution rencontre un transfert actif de changement de modèle, Cron effectue une nouvelle tentative avec le fournisseur/modèle sélectionné et conserve cette sélection (ainsi que tout nouveau profil d’authentification) pour l’exécution active. Le nombre de tentatives est limité : après la tentative initiale et 2 nouvelles tentatives de changement, Cron abandonne au lieu de boucler.

Avant le démarrage d’une exécution isolée, OpenClaw vérifie les points de terminaison locaux accessibles pour les fournisseurs `api: "ollama"` et `api: "openai-completions"` configurés dont `baseUrl` est une adresse de bouclage, de réseau privé ou `.local`. Cette vérification préalable parcourt la chaîne de modèles de secours configurée pour la tâche et ne marque l’exécution `skipped` qu’une fois tous les candidats inaccessibles ; `--fallbacks ""` limite strictement ce parcours au seul modèle principal. Un point de terminaison indisponible enregistre l’exécution comme `skipped` avec une erreur claire au lieu de lancer un appel au modèle. Le résultat est mis en cache pendant 5 minutes par point de terminaison (et non par tâche ou modèle), de sorte que de nombreuses tâches arrivant à échéance et partageant un serveur local Ollama/vLLM/SGLang/LM Studio indisponible n’occasionnent qu’une seule sonde au lieu d’une rafale de requêtes. Les exécutions ignorées lors de la vérification préalable n’augmentent pas le délai exponentiel après erreur d’exécution ; définissez `failureAlert.includeSkipped` pour activer les alertes répétées d’omission.

### Charges utiles de commande

Les charges utiles de commande exécutent des scripts déterministes dans le planificateur du Gateway sans démarrer de tour reposant sur un modèle. Elles s’exécutent sur l’hôte du Gateway, capturent stdout/stderr, enregistrent l’exécution dans l’historique Cron et réutilisent les mêmes modes de livraison `announce`, `webhook` et `none` que les tâches de tour d’agent.

<Note>
Le Cron de commande est une surface d’automatisation du Gateway destinée aux opérateurs administrateurs, et non un appel `tools.exec` d’agent. La création, la mise à jour, la suppression ou l’exécution manuelle de tâches Cron nécessite `operator.admin` ; les exécutions de commande planifiées s’exécutent ensuite dans le processus du Gateway en tant qu’automatisation créée par cet administrateur. La politique d’exécution de l’agent (`tools.exec.mode`, demandes d’approbation, listes d’outils autorisés par agent) régit les outils d’exécution visibles par le modèle, et non les charges utiles du Cron de commande.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` stocke `argv: ["sh", "-lc", <shell>]`. Utilisez `--command-argv '["node","scripts/report.mjs"]'` pour une exécution exacte des arguments argv sans analyse par l’interpréteur de commandes. Les options facultatives `--command-env KEY=VALUE` (répétable), `--command-input`, `--timeout-seconds` (10 minutes par défaut), `--no-output-timeout-seconds` et `--output-max-bytes` contrôlent l’environnement du processus, stdin et les limites de sortie.

Le texte livré est dérivé de la sortie du processus : une sortie stdout non vide est prioritaire ; si stdout est vide et stderr non vide, stderr est livré ; si les deux sont présents, Cron envoie un petit bloc `stdout:` / `stderr:`. Le code de sortie `0` enregistre l’exécution comme `ok` ; une sortie non nulle, un signal, un dépassement de délai ou un dépassement du délai sans sortie l’enregistre comme `error` et peut déclencher des alertes d’échec. Une commande qui affiche uniquement `NO_REPLY` utilise la suppression normale du jeton silencieux de Cron et ne publie rien dans la discussion.

## Styles d’exécution

| Style           | Valeur de `--session`   | S’exécute dans                  | Idéal pour                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Session principale    | `main`              | Voie de réveil Cron dédiée | Rappels, événements système        |
| Isolée        | `isolated`          | `cron:<jobId>` dédié | Rapports, tâches d’arrière-plan      |
| Session actuelle | `current`           | Liée au moment de la création   | Travaux récurrents tenant compte du contexte    |
| Session personnalisée  | `session:custom-id` | Session nommée persistante | Flux de travail s’appuyant sur l’historique |

<AccordionGroup>
  <Accordion title="Session principale, isolée ou personnalisée">
    Les tâches de **session principale** mettent en file d’attente un événement système dans une voie d’exécution appartenant à Cron et réveillent éventuellement le Heartbeat (`--wake now` ou `--wake next-heartbeat`). Elles peuvent utiliser le dernier contexte de livraison de la session principale cible pour les réponses, mais n’ajoutent pas les tours Cron ordinaires à la voie de discussion humaine et ne prolongent pas la fraîcheur de la réinitialisation quotidienne ou pour inactivité de la session cible. Les tâches **isolées** exécutent un tour d’agent dédié avec une nouvelle session. Les **sessions personnalisées** (`session:xxx`) conservent le contexte entre les exécutions, ce qui permet des flux de travail tels que des points quotidiens s’appuyant sur les résumés précédents.

    Les événements Cron de session principale sont des rappels autonomes sous forme d’événements système. Ils n’incluent pas automatiquement l’instruction « Read HEARTBEAT.md » du prompt de Heartbeat par défaut ; indiquez-la explicitement dans le texte de l’événement Cron si un rappel doit consulter `HEARTBEAT.md`.

  </Accordion>
  <Accordion title="Signification de « nouvelle session » pour les tâches isolées">
    Un nouvel identifiant de transcription/session est créé à chaque exécution. OpenClaw conserve les préférences sûres (paramètres de raisonnement/mode rapide/verbosité, libellés, remplacements explicites du modèle/de l’authentification sélectionnés par l’utilisateur), mais n’hérite pas du contexte ambiant de conversation d’une ancienne ligne Cron : routage du canal/groupe, politique d’envoi ou de mise en file d’attente, élévation, origine ou liaison à l’environnement d’exécution ACP. Utilisez `current` ou `session:<id>` lorsqu’une tâche récurrente doit délibérément s’appuyer sur le même contexte de conversation.
  </Accordion>
  <Accordion title="Livraison des sous-agents et de Discord">
    Lorsque des exécutions Cron isolées orchestrent des sous-agents, la livraison privilégie la sortie finale du dernier descendant plutôt qu’un texte intermédiaire obsolète du parent. Si des descendants sont encore en cours d’exécution, OpenClaw supprime cette mise à jour partielle du parent au lieu de l’annoncer.

    Pour les cibles d’annonce Discord uniquement textuelles, OpenClaw envoie une seule fois le texte final canonique de l’assistant au lieu de rejouer à la fois le texte diffusé/intermédiaire et la réponse finale. Les médias et les charges utiles Discord structurées sont toujours livrés séparément afin de ne pas perdre les pièces jointes et les composants.

  </Accordion>
</AccordionGroup>

## Livraison et sortie

| Mode       | Comportement                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Livre en secours le texte final à la cible si l’agent ne l’a pas envoyé |
| `webhook`  | Envoie par POST la charge utile de l’événement terminé à une URL                                |
| `none`     | Aucune livraison de secours par l’exécuteur                                         |

Utilisez `--announce --channel telegram --to "-1001234567890"` pour la livraison au canal. Pour les sujets de forum Telegram, utilisez `-1001234567890:topic:123` ; OpenClaw accepte également la forme abrégée `-1001234567890:123` propre à Telegram. Les appelants RPC/config directs peuvent transmettre `delivery.threadId` sous forme de chaîne ou de nombre. Les cibles Slack/Discord/Mattermost utilisent des préfixes explicites (`channel:<id>`, `user:<id>`). Les identifiants de salon Matrix sont sensibles à la casse ; utilisez l’identifiant exact du salon ou la forme `room:!room:server` de Matrix.

Lorsque la livraison d’annonce utilise `channel: "last"` ou omet `channel`, une cible préfixée par le fournisseur telle que `telegram:123` peut sélectionner le canal avant que Cron ne revienne à l’historique de session ou à un canal configuré unique. Seuls les préfixes annoncés par le Plugin chargé servent de sélecteurs de fournisseur. Si `delivery.channel` est explicite, le préfixe de la cible doit désigner le même fournisseur ; `channel: "whatsapp"` avec `to: "telegram:123"` est rejeté au lieu de laisser WhatsApp interpréter l’identifiant Telegram comme un numéro de téléphone. Les préfixes de type de cible et de service (`channel:<id>`, `user:<id>`, `imessage:<handle>`, `sms:<number>`) restent une syntaxe de cible propre au canal, et non des sélecteurs de fournisseur.

Pour les tâches isolées, la livraison dans la discussion est partagée : si une route de discussion est disponible, l’agent peut utiliser l’outil `message` même avec `--no-deliver`. Si l’agent envoie le message à la cible configurée/actuelle, OpenClaw ignore l’annonce de secours. Sinon, `announce`, `webhook` et `none` déterminent uniquement ce que l’exécuteur fait de la réponse finale après le tour de l’agent.

Lorsqu’un agent crée un rappel isolé depuis une discussion active, OpenClaw stocke la cible de livraison active conservée pour la route d’annonce de secours. Les clés de session internes peuvent être en minuscules ; les cibles de livraison du fournisseur ne sont pas reconstruites à partir de ces clés lorsque le contexte de discussion actuel est disponible.

La livraison d’annonce implicite utilise les listes de canaux autorisés configurées pour valider et rerouter les cibles obsolètes. Les approbations du magasin d’association de messages privés ne sont pas des destinataires d’automatisation de secours ; définissez `delivery.to` ou configurez l’entrée `allowFrom` du canal lorsqu’une tâche planifiée doit envoyer proactivement un message privé.

### Notifications d’échec

Les notifications d’échec suivent un chemin de destination distinct :

- `cron.failureDestination` définit une valeur globale par défaut pour les notifications d’échec.
- `job.delivery.failureDestination` remplace cette valeur pour chaque tâche.
- Si aucun des deux n’est défini et que la tâche effectue déjà une livraison via `announce`, les notifications d’échec utilisent en dernier recours cette cible d’annonce principale.
- `delivery.failureDestination` n’est pris en charge que pour les tâches `sessionTarget="isolated"`, sauf si le mode de livraison principal est `webhook`.
- `failureAlert.includeSkipped: true` active les alertes répétées d’exécutions ignorées pour une tâche ou une politique globale d’alertes cron. Les exécutions ignorées conservent un compteur distinct d’exécutions ignorées consécutives et n’affectent donc pas le délai exponentiel après les erreurs d’exécution.
- `openclaw cron edit` permet d’ajuster les alertes pour chaque tâche : `--failure-alert`/`--no-failure-alert`, `--failure-alert-after <n>`, `--failure-alert-channel`, `--failure-alert-to`, `--failure-alert-cooldown`, `--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`, `--failure-alert-mode` et `--failure-alert-account-id`.

### Langue de sortie

Les tâches Cron ne déduisent pas la langue de réponse à partir du canal, des paramètres régionaux ou des messages précédents. Ajoutez la règle linguistique au message planifié ou au modèle :

```bash
openclaw cron edit <jobId> \
  --message "Résumez les mises à jour. Répondez en chinois ; ne modifiez pas les URL, le code et les noms de produits."
```

Pour les fichiers modèles, conservez l’instruction linguistique dans l’invite générée et vérifiez que les espaces réservés tels que `{{language}}` sont renseignés avant l’exécution de la tâche. Si la sortie mélange plusieurs langues, rendez la règle explicite, par exemple : « Utilisez le chinois pour le texte narratif et conservez les termes techniques en anglais. »

## Exemples de CLI

<Tabs>
  <Tab title="Rappel ponctuel">
    ```bash
    openclaw cron add \
      --name "Vérification du calendrier" \
      --at "20m" \
      --session main \
      --system-event "Prochain heartbeat : vérifiez le calendrier." \
      --wake now
    ```
  </Tab>
  <Tab title="Tâche isolée récurrente">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Résumez les mises à jour de la nuit." \
      --name "Résumé du matin" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Remplacement du modèle et du niveau de réflexion">
    ```bash
    openclaw cron add \
      --name "Analyse approfondie" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Analyse approfondie hebdomadaire de l’avancement du projet." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Sortie Webhook">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Résumez les déploiements du jour au format JSON." \
      --name "Synthèse des déploiements" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Sortie de commande">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Sonde de profondeur de file d’attente" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Gestion des tâches

```bash
# Répertorier toutes les tâches
openclaw cron list

# Obtenir une tâche enregistrée au format JSON
openclaw cron get <jobId>

# Afficher une tâche, y compris l’itinéraire de livraison résolu
openclaw cron show <jobId>

# Activer ou désactiver sans supprimer
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# Modifier une tâche
openclaw cron edit <jobId> --message "Invite mise à jour" --model "opus"

# Forcer l’exécution immédiate d’une tâche
openclaw cron run <jobId>

# Forcer l’exécution immédiate d’une tâche et attendre son état final
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Exécuter uniquement si l’échéance est atteinte
openclaw cron run <jobId> --due

# Afficher l’historique des exécutions
openclaw cron runs --id <jobId> --limit 50

# Afficher une exécution précise
openclaw cron runs --id <jobId> --run-id <runId>

# Supprimer une tâche
openclaw cron remove <jobId>

# Sélection de l’agent (configurations multi-agents)
openclaw cron create "0 6 * * *" "Vérifiez la file d’attente des opérations" --name "Passage en revue des opérations" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

L’archivage d’une session (depuis l’interface de contrôle ou via `sessions.patch { archived: true }` par un appelant administrateur opérateur) désactive toutes les tâches Cron activées liées à cette session : sa session isolée `cron:<jobId>`, une cible `session:<key>` ou un canal de livraison/réveil `sessionKey`. La restauration de la session ne réactive pas ces tâches ; utilisez `openclaw cron enable <jobId>`. Les sessions auxquelles une tâche activée est liée affichent un badge d’horloge dans la barre latérale de l’interface de contrôle.

`openclaw cron run <jobId>` renvoie la réponse après la mise en file d’attente de l’exécution manuelle. Utilisez `--wait` pour les points d’arrêt, les scripts de maintenance ou toute autre automatisation qui doit rester bloquée jusqu’à la fin de l’exécution mise en file d’attente ; cette option interroge périodiquement le `runId` renvoyé (délai d’expiration par défaut : `10m`, intervalle d’interrogation : `2s`) et se termine avec `0` pour l’état `ok`, ou avec une valeur différente de zéro pour `error`, `skipped` ou l’expiration du délai d’attente.

L’outil d’agent `cron` renvoie depuis `cron(action: "list")` des résumés compacts des tâches (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) ; utilisez `cron(action: "get", jobId: "...")` pour obtenir la définition complète d’une tâche. Les appelants directs du Gateway peuvent transmettre `compact: true` à `cron.list` ; si cette valeur est omise, la réponse complète avec les aperçus de livraison est conservée.

`openclaw cron create` est un alias de `openclaw cron add`. Les nouvelles tâches peuvent utiliser une planification positionnelle (`"0 9 * * 1"`, `"every 1h"`, `"20m"` ou un horodatage ISO), suivie d’une invite d’agent positionnelle. Utilisez `--webhook <url>` avec `cron add|create` ou `cron edit` pour envoyer par requête POST la charge utile de l’exécution terminée à un point de terminaison HTTP ; la livraison par Webhook ne peut pas être combinée avec les indicateurs de livraison par discussion (`--announce`, `--channel`, `--to`, `--thread-id`, `--account`). Avec `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` et `--clear-account`, désactivez individuellement ces champs de routage (chacun est rejeté s’il est utilisé avec l’indicateur correspondant qui le définit) — contrairement à `--no-deliver`, qui désactive uniquement la livraison de secours de l’exécuteur.

<Note>
Remarque sur le remplacement du modèle :

- `openclaw cron add|edit --model ...` modifie le modèle sélectionné pour la tâche.
- Si le modèle est autorisé, ce fournisseur/modèle exact est utilisé pour l’exécution isolée de l’agent.
- S’il n’est pas autorisé ou ne peut pas être résolu, Cron fait échouer l’exécution avec une erreur de validation explicite.
- Les correctifs de charge utile `cron.update` de l’API peuvent définir `model: null` pour effacer le remplacement de modèle enregistré pour une tâche.
- `openclaw cron edit <job-id> --clear-model` efface ce remplacement depuis la CLI (avec le même effet que le correctif `model: null`) et ne peut pas être combiné avec `--model`.
- Les chaînes de secours configurées restent applicables, car le `--model` Cron est le modèle principal d’une tâche, et non un remplacement `/model` de session.
- `openclaw cron add|edit --fallbacks ...` définit la charge utile `fallbacks` et remplace les modèles de secours configurés pour cette tâche ; `--fallbacks ""` désactive le mécanisme de secours et impose une exécution stricte. `openclaw cron edit <job-id> --clear-fallbacks` efface le remplacement propre à la tâche.
- Un simple `--model` sans liste de modèles de secours explicite ou configurée ne revient pas silencieusement au modèle principal de l’agent comme cible de nouvelle tentative supplémentaire.

</Note>

## Webhooks

Le Gateway peut exposer des points de terminaison Webhook HTTP pour les déclencheurs externes. Activez-les dans la configuration :

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Authentification

Chaque requête doit inclure le jeton du hook dans un en-tête :

- `Authorization: Bearer <token>` (recommandé)
- `x-openclaw-token: <token>`

Les jetons dans la chaîne de requête sont rejetés.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Mettre en file d’attente un événement système pour la session principale :

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"Nouvel e-mail reçu","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Description de l’événement.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` ou `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Exécuter un tour d’agent isolé :

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Résumez la boîte de réception","name":"E-mail","model":"openai/gpt-5.6-sol"}'
    ```

    Champs : `message` (obligatoire), `name`, `agentId`, `sessionKey` (nécessite `hooks.allowRequestSessionKey=true`), `idempotencyKey`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hooks mappés (POST /hooks/<name>)">
    Les noms de hooks personnalisés sont résolus via `hooks.mappings` dans la configuration. Les mappages peuvent transformer des charges utiles arbitraires en actions `wake` ou `agent` à l’aide de modèles ou de transformations de code.
  </Accordion>
</AccordionGroup>

<Warning>
Conservez les points de terminaison des hooks derrière l’interface de bouclage, le tailnet ou un proxy inverse de confiance.

- Utilisez un jeton dédié aux hooks ; ne réutilisez pas les jetons d’authentification du Gateway.
- Conservez `hooks.path` sur un sous-chemin dédié ; `/` est rejeté.
- Définissez `hooks.allowedAgentIds` pour limiter l’agent effectif qu’un hook peut cibler, y compris l’agent par défaut lorsque `agentId` est omis.
- Conservez `hooks.allowRequestSessionKey=false`, sauf si vous avez besoin que l’appelant puisse sélectionner les sessions.
- Si vous activez `hooks.allowRequestSessionKey`, définissez également `hooks.allowedSessionKeyPrefixes` pour restreindre les formes de clés de session autorisées.
- Les charges utiles des hooks sont entourées par défaut de limites de sécurité.

</Warning>

## Intégration Gmail PubSub

Reliez les déclencheurs de la boîte de réception Gmail à OpenClaw via Google PubSub.

<Note>
**Prérequis :** CLI `gcloud`, `gog` (gogcli), hooks OpenClaw activés et Tailscale pour le point de terminaison HTTPS public.
</Note>

### Configuration avec l’assistant (recommandée)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Cette commande écrit la configuration `hooks.gmail`, active le préréglage Gmail et utilise par défaut Tailscale Funnel pour le point de terminaison push (`--tailscale funnel|serve|off`).

<Warning>
La session par message du préréglage Gmail sépare le contexte des conversations ; elle ne restreint pas les outils ni l’espace de travail de l’agent cible. Sans mappage personnalisé définissant `agentId`, les hooks Gmail s’exécutent en tant qu’agent par défaut.

Pour les boîtes de réception non fiables, acheminez le hook vers un agent de lecture dédié, accordez à cet agent un accès en lecture seule à l’espace de travail ou aucun accès, et interdisez-lui l’écriture dans le système de fichiers, le shell, le navigateur et les autres outils inutiles. S’il doit avertir l’agent principal, autorisez uniquement le transfert nécessaire entre agents. Consultez [Injection d’invite](/fr/gateway/security#prompt-injection), [Bac à sable et outils multi-agents](/fr/tools/multi-agent-sandbox-tools) et [`tools.agentToAgent`](/fr/gateway/config-tools#toolsagenttoagent).
</Warning>

### Démarrage automatique du Gateway

Lorsque `hooks.enabled=true` et `hooks.gmail.account` sont définis, le Gateway démarre `gog gmail watch serve` au démarrage et renouvelle automatiquement la surveillance. Définissez `OPENCLAW_SKIP_GMAIL_WATCHER=1` pour désactiver ce comportement.

### Configuration manuelle ponctuelle

<Steps>
  <Step title="Sélectionner le projet GCP">
    Sélectionnez le projet GCP propriétaire du client OAuth utilisé par `gog` :

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Créer le sujet et accorder l’accès push à Gmail">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Démarrer la surveillance">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Remplacement du modèle Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openai/gpt-5.6-sol",
      thinking: "high",
    },
  },
}
```

Pour les boîtes de réception non fiables, utilisez le modèle de dernière génération de la meilleure gamme disponible auprès de votre fournisseur. La valeur ci-dessus est un exemple ; le modèle doit exister dans votre catalogue configuré et votre liste d’autorisation.

## Configuration

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    triggers: {
      enabled: false,
      minIntervalMs: 30000,
    },
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
  },
}
```

Les valeurs `retry` ci-dessus sont les valeurs par défaut : jusqu’à 3 nouvelles tentatives avec une temporisation `30s/60s/5m`, pour les cinq catégories d’erreurs transitoires. `webhookToken` est envoyé sous la forme `Authorization: Bearer <token>` dans les requêtes POST des Webhooks Cron.

`maxConcurrentRuns` limite à la fois le déclenchement planifié de Cron et l’exécution isolée des tours d’agent, avec une valeur par défaut de 8. Les tours d’agent Cron isolés utilisent en interne la voie d’exécution dédiée `cron-nested` de la file d’attente. L’augmentation de cette valeur permet donc aux exécutions LLM Cron indépendantes de progresser en parallèle, au lieu de seulement démarrer leurs enveloppes Cron externes. Ce paramètre n’élargit pas la voie partagée non-Cron `nested`.

`cron.store` est une clé logique de stockage et un chemin de migration de doctor, et non un fichier JSON actif à modifier manuellement. Les données des tâches résident dans SQLite ; utilisez la CLI ou l’API du Gateway pour les modifier.

Désactiver Cron : `cron.enabled: false` ou `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportement des nouvelles tentatives">
    **Nouvelle tentative ponctuelle** : les erreurs transitoires (limite de débit, surcharge, réseau, délai d’attente, erreur serveur) sont retentées jusqu’à `retry.maxAttempts` fois (3 par défaut) en utilisant `retry.backoffMs` (30 s, 60 s, 5 min par défaut). Les erreurs permanentes désactivent immédiatement la tâche.

    **Nouvelle tentative récurrente** : les erreurs d’exécution consécutives appliquent une temporisation selon un calendrier étendu (30 s, 60 s, 5 min, 15 min, 60 min). La temporisation est réinitialisée après l’exécution réussie suivante.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (valeur par défaut : `24h` ; `false` désactive cette fonction) purge les entrées de session d’exécution isolées. L’historique d’exécution conserve les 2000 lignes terminales les plus récentes par tâche ; les lignes perdues conservent leur fenêtre de nettoyage de 24 heures.
  </Accordion>
  <Accordion title="Migration de l’ancien stockage">
    Lors de la mise à niveau, exécutez `openclaw doctor --fix` pour importer les anciens fichiers `~/.openclaw/cron/jobs.json`, `jobs-state.json` et `runs/*.jsonl` dans SQLite, puis les renommer avec le suffixe `.migrated`. Les lignes de tâches mal formées sont ignorées à l’exécution et copiées dans `jobs-quarantine.json` pour être réparées ou examinées ultérieurement.
  </Accordion>
</AccordionGroup>

## Dépannage

### Séquence de commandes

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="Cron ne se déclenche pas">
    - Vérifiez `cron.enabled` et la variable d’environnement `OPENCLAW_SKIP_CRON`.
    - Vérifiez que le Gateway fonctionne en continu.
    - Pour les planifications `cron`, vérifiez le fuseau horaire (`--tz`) par rapport à celui de l’hôte.
    - `reason: not-due` dans la sortie d’exécution signifie que l’exécution manuelle a été vérifiée avec `openclaw cron run <jobId> --due` et que la tâche n’était pas encore arrivée à échéance.

  </Accordion>
  <Accordion title="Cron s’est déclenché, mais rien n’a été livré">
    - Le mode de livraison `none` signifie qu’aucun envoi de secours par l’exécuteur n’est attendu. L’agent peut toujours effectuer un envoi direct avec l’outil `message` lorsqu’une route de discussion est disponible.
    - Une cible de livraison manquante ou non valide (`channel`/`to`) signifie que l’envoi sortant a été ignoré.
    - Pour Matrix, les tâches copiées ou anciennes dont les identifiants de salle `delivery.to` sont en minuscules peuvent échouer, car les identifiants de salle Matrix sont sensibles à la casse. Modifiez la tâche afin d’utiliser la valeur exacte `!room:server` ou `room:!room:server` provenant de Matrix.
    - Les erreurs d’authentification du canal (`unauthorized`, `Forbidden`) signifient que la livraison a été bloquée par les identifiants d’accès.
    - Si l’exécution isolée renvoie uniquement le jeton silencieux (`NO_REPLY` / `no_reply`), OpenClaw supprime la livraison sortante directe ainsi que le chemin de secours du résumé mis en file d’attente ; rien n’est donc renvoyé dans la discussion.
    - Si l’agent doit lui-même envoyer un message à l’utilisateur, vérifiez que la tâche dispose d’une route utilisable (`channel: "last"` avec une discussion précédente, ou un canal et une cible explicites).

  </Accordion>
  <Accordion title="Cron ou Heartbeat semble empêcher le renouvellement de type /new">
    - L’état récent des réinitialisations quotidiennes et après inactivité ne repose pas sur `updatedAt` ; consultez [Gestion des sessions](/fr/concepts/session#session-lifecycle).
    - Les réveils Cron, les exécutions Heartbeat, les notifications d’exécution et la tenue des registres du Gateway peuvent mettre à jour la ligne de session pour le routage ou l’état, mais ils ne prolongent pas `sessionStartedAt` ni `lastInteractionAt`.
    - Pour les anciennes lignes créées avant l’existence de ces champs, OpenClaw peut récupérer `sessionStartedAt` depuis l’en-tête de session du transcript JSONL lorsque le fichier est toujours disponible. Les anciennes lignes inactives sans `lastInteractionAt` utilisent cette heure de début récupérée comme référence d’inactivité.

  </Accordion>
  <Accordion title="Pièges liés aux fuseaux horaires">
    - Cron sans `--tz` utilise le fuseau horaire de l’hôte du Gateway.
    - Les planifications `at` sans fuseau horaire sont traitées comme étant en UTC.
    - Heartbeat `activeHours` utilise la résolution du fuseau horaire configurée.

  </Accordion>
</AccordionGroup>

## Ressources connexes

- [Automatisation](/fr/automation) — tous les mécanismes d’automatisation en un coup d’œil
- [Tâches en arrière-plan](/fr/automation/tasks) — registre des tâches pour les exécutions Cron
- [Heartbeat](/fr/gateway/heartbeat) — tours périodiques de la session principale
- [Fuseau horaire](/fr/concepts/timezone) — configuration du fuseau horaire
