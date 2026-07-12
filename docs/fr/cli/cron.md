---
read_when:
    - Vous souhaitez des tâches planifiées et des réveils
    - Vous déboguez l’exécution de Cron et les journaux
summary: Référence de la CLI pour `openclaw cron` (planifier et exécuter des tâches en arrière-plan)
title: Cron
x-i18n:
    generated_at: "2026-07-12T02:25:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e16335b13f92229df0ba49c320e2714e39ab3e503e8e72f376ec2c5b0803cf7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gérez les tâches Cron du planificateur du Gateway.

<Tip>
Exécutez `openclaw cron --help` pour afficher l’ensemble des commandes disponibles. Consultez [Tâches Cron](/fr/automation/cron-jobs) pour le guide conceptuel.
</Tip>

<Note>
Toutes les modifications Cron (`add`/`create`, `update`/`edit`, `remove`, `run`) nécessitent `operator.admin`. Les exécutions de charges utiles de commande s’effectuent directement dans le processus du Gateway, et non sous forme d’appel à l’outil `tools.exec` d’un agent ; `tools.exec.*` et les approbations d’exécution continuent de régir les outils d’exécution visibles par le modèle.
</Note>

## Créer rapidement des tâches

`openclaw cron create` est un alias de `openclaw cron add`. Pour les nouvelles tâches, indiquez d’abord la planification, puis le prompt :

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Utilisez `--webhook <url>` lorsque la tâche doit envoyer la charge utile terminée par une requête POST plutôt que la transmettre à une cible de discussion :

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Utilisez `--command` pour les tâches déterministes de type shell exécutées dans Cron d’OpenClaw sans démarrer une exécution isolée d’agent ou de modèle :

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` stocke `argv: ["sh", "-lc", <shell>]`. Utilisez `--command-argv '["node","scripts/report.mjs"]'` pour une exécution exacte du tableau d’arguments. Les tâches de commande capturent stdout/stderr, enregistrent l’historique Cron normal et acheminent la sortie à l’aide des mêmes modes de transmission `announce`, `webhook` ou `none` que les tâches isolées. Une commande qui affiche uniquement `NO_REPLY` est ignorée.

## Sessions

`--session` accepte `main`, `isolated`, `current` ou `session:<id>`.

<AccordionGroup>
  <Accordion title="Clés de session">
    - `main` se lie à la session principale de l’agent.
    - `isolated` crée une nouvelle transcription et un nouvel identifiant de session pour chaque exécution.
    - `current` se lie à la session active au moment de la création.
    - `session:<id>` s’attache à une clé de session persistante explicite.

  </Accordion>
  <Accordion title="Sémantique des sessions isolées">
    Les exécutions isolées réinitialisent le contexte ambiant de la conversation. Le routage des canaux et des groupes, la politique d’envoi et de mise en file d’attente, l’élévation, l’origine et la liaison à l’environnement d’exécution ACP sont réinitialisés pour la nouvelle exécution. Les préférences sûres et les remplacements explicites de modèle ou d’authentification sélectionnés par l’utilisateur peuvent être conservés entre les exécutions.
  </Accordion>
</AccordionGroup>

## Transmission

`openclaw cron list` et `openclaw cron show <job-id>` affichent un aperçu de la route de transmission résolue. Pour `channel: "last"`, l’aperçu indique si la route a été résolue à partir de la session principale ou actuelle, ou si elle échouera en mode fermé.

Les cibles préfixées par un fournisseur peuvent lever l’ambiguïté entre les canaux d’annonce non résolus. Par exemple, `to: "telegram:123"` sélectionne Telegram lorsque `delivery.channel` est omis ou vaut `last`. Seuls les préfixes annoncés par le Plugin chargé servent de sélecteurs de fournisseur. Si `delivery.channel` est explicite, le préfixe doit correspondre à ce canal ; `channel: "whatsapp"` avec `to: "telegram:123"` est rejeté. Les préfixes de service tels que `imessage:` et `sms:` restent une syntaxe de cible appartenant au canal.

<Note>
Les tâches isolées créées avec `cron add` utilisent par défaut la transmission `--announce`. Utilisez `--no-deliver` pour conserver la sortie en interne. `--deliver` reste un alias obsolète de `--announce`.
</Note>

### Responsabilité de la transmission

La transmission des discussions Cron isolées est partagée entre l’agent et le lanceur :

- L’agent peut envoyer directement à l’aide de l’outil `message` lorsqu’une route de discussion est disponible.
- Le mécanisme de repli `announce` transmet la réponse finale uniquement lorsque l’agent ne l’a pas envoyée directement à la cible résolue.
- `webhook` envoie la charge utile terminée à une URL.
- `none` désactive la transmission de repli du lanceur.

Utilisez `cron add|create --webhook <url>` ou `cron edit <job-id> --webhook <url>` pour configurer la transmission par Webhook. Ne combinez pas `--webhook` avec des options de transmission vers une discussion telles que `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` ou `--account`.

`cron edit <job-id>` peut désactiver individuellement les champs de routage de transmission à l’aide de `--clear-channel`, `--clear-to`, `--clear-thread-id` et `--clear-account` (chacun est rejeté s’il est combiné avec l’option de définition correspondante). Contrairement à `--no-deliver`, qui désactive uniquement la transmission de repli du lanceur, ces options suppriment le champ stocké afin que la tâche résolve de nouveau cette partie de sa route à partir des valeurs par défaut.

`--announce` correspond à la transmission de repli de la réponse finale par le lanceur. `--no-deliver` désactive ce repli, mais ne supprime pas l’outil `message` de l’agent lorsqu’une route de discussion est disponible.

Les rappels créés depuis une discussion active conservent la cible de transmission de la discussion en direct pour la transmission d’annonce de repli. Les clés de session internes peuvent être en minuscules ; ne les utilisez pas comme source de vérité pour les identifiants de fournisseur sensibles à la casse, tels que les identifiants de salon Matrix.

### Transmission des échecs

Les destinations des notifications d’échec sont résolues dans cet ordre :

1. `delivery.failureDestination` dans la tâche.
2. La valeur globale `cron.failureDestination`.
3. La cible d’annonce principale de la tâche (lorsqu’aucune des deux précédentes ne correspond à une destination concrète).

<Note>
Les tâches de la session principale ne peuvent utiliser `delivery.failureDestination` que lorsque le mode de transmission principal est `webhook`. Les tâches isolées l’acceptent dans tous les modes.
</Note>

Les exécutions Cron isolées traitent les échecs d’agent au niveau de l’exécution comme des erreurs de tâche, même lorsqu’aucune charge utile de réponse n’est produite ; les échecs du modèle ou du fournisseur incrémentent donc tout de même les compteurs d’erreurs et déclenchent les notifications d’échec.

Les tâches Cron de commande ne démarrent pas de tour d’agent isolé. Un code de sortie nul enregistre `ok` ; une sortie non nulle, un signal, un délai d’expiration ou un délai d’expiration sans sortie enregistre `error` et peut déclencher le même mécanisme de notification d’échec.

Si une exécution isolée dépasse le délai avant la première requête au modèle, `openclaw cron show` et `openclaw cron runs` incluent une erreur propre à la phase, telle que `setup timed out before runner start`, ou un message de blocage indiquant la dernière phase de démarrage connue (par exemple `context-engine`). Pour les fournisseurs reposant sur une CLI, le mécanisme de surveillance préalable au modèle reste actif jusqu’au démarrage du tour de la CLI externe ; les blocages liés à la recherche de session, aux hooks, à l’authentification, au prompt et à la configuration de la CLI sont donc signalés comme des échecs Cron préalables au modèle.

## Planification

### Tâches ponctuelles

`--at <datetime>` planifie une exécution ponctuelle. Les dates et heures sans décalage sont interprétées en UTC, sauf si vous transmettez également `--tz <iana>`, auquel cas l’heure locale est interprétée dans le fuseau horaire indiqué.

<Note>
Par défaut, les tâches ponctuelles sont supprimées après une exécution réussie. Utilisez `--keep-after-run` pour les conserver.
</Note>

### Tâches récurrentes

Après des erreurs consécutives, les tâches récurrentes utilisent un délai de nouvelle tentative exponentiel : 30 s, 1 min, 5 min, 15 min, 60 min. La planification revient à la normale après l’exécution réussie suivante.

Les exécutions ignorées sont suivies séparément des erreurs d’exécution. Elles n’affectent pas le délai de nouvelle tentative, mais `openclaw cron edit <job-id> --failure-alert-include-skipped` permet d’inclure dans les alertes d’échec des notifications répétées d’exécutions ignorées.

Pour les tâches isolées qui ciblent un fournisseur de modèle local configuré (URL de base sur local loopback, un réseau privé ou `.local`), Cron effectue une vérification préalable légère du fournisseur avant de démarrer le tour de l’agent : les fournisseurs `api: "ollama"` sont interrogés sur `/api/tags` ; les autres fournisseurs locaux compatibles avec OpenAI (`api: "openai-completions"`, par exemple vLLM, SGLang et LM Studio) sont interrogés sur `/models`. Si le point de terminaison est inaccessible, l’exécution est enregistrée comme `skipped` et une nouvelle tentative est effectuée lors d’une planification ultérieure ; le résultat d’accessibilité est mis en cache pendant 5 minutes pour chaque point de terminaison afin que de nombreuses tâches ciblant le même serveur local ne le surchargent pas de vérifications répétées.

Les tâches Cron, l’état d’exécution en attente et l’historique des exécutions résident dans la base de données d’état SQLite partagée. Les anciens fichiers `jobs.json`, `<name>-state.json` et `runs/*.jsonl` sont importés une seule fois et renommés avec le suffixe `.migrated`. Après l’importation, modifiez les planifications avec `openclaw cron add|edit|remove` au lieu de modifier les fichiers JSON.

### Exécutions manuelles

`openclaw cron run <job-id>` force l’exécution par défaut et renvoie une réponse dès que l’exécution manuelle est mise en file d’attente. Les réponses réussies incluent `{ ok: true, enqueued: true, runId }`. Utilisez la valeur `runId` renvoyée pour consulter ultérieurement le résultat :

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Ajoutez `--wait` lorsqu’un script doit rester bloqué jusqu’à ce que cette exécution précise mise en file d’attente enregistre un état terminal :

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Avec `--wait`, la CLI appelle toujours `cron.run` en premier, puis interroge `cron.runs` pour la valeur `runId` renvoyée. La commande se termine avec le code `0` uniquement lorsque l’exécution se termine avec l’état `ok`. Elle se termine avec un code non nul lorsque l’exécution se termine avec `error` ou `skipped`, lorsque la réponse du Gateway ne contient pas de `runId`, ou lorsque le délai `--wait-timeout` expire (valeur par défaut : `10m`, avec une interrogation toutes les `2s` par défaut). `--poll-interval` doit être supérieur à zéro.

<Note>
Utilisez `--due` lorsque vous souhaitez que la commande manuelle s’exécute uniquement si la tâche est actuellement arrivée à échéance. Si `--due --wait` ne met aucune exécution en file d’attente, la commande renvoie la réponse normale d’absence d’exécution au lieu de lancer une interrogation.
</Note>

## Modèles

`cron add|edit --model <ref>` sélectionne un modèle autorisé pour la tâche. `cron add|edit --fallbacks <list>` définit les modèles de repli propres à la tâche, par exemple `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5` ; transmettez `--fallbacks ""` pour une exécution stricte sans solution de repli. `cron edit <job-id> --clear-fallbacks` supprime le remplacement des modèles de repli propre à la tâche. `cron edit <job-id> --clear-model` supprime le remplacement de modèle propre à la tâche afin que celle-ci suive l’ordre de priorité normal de sélection du modèle Cron (un remplacement stocké dans la session Cron, le cas échéant, sinon le modèle de l’agent ou le modèle par défaut) ; cette option ne peut pas être combinée avec `--model`. `cron add|edit --thinking <level>` définit un remplacement du niveau de réflexion propre à la tâche ; `cron edit <job-id> --clear-thinking` le supprime afin que la tâche suive l’ordre de priorité normal du niveau de réflexion Cron, et ne peut pas être combiné avec `--thinking`.

<Warning>
Si le modèle n’est pas autorisé ou ne peut pas être résolu, Cron fait échouer l’exécution avec une erreur de validation explicite au lieu de revenir à la sélection du modèle de l’agent de la tâche ou du modèle par défaut.
</Warning>

L’option Cron `--model` définit un **modèle principal de tâche**, et non un remplacement `/model` de session de discussion. Cela signifie que :

- Les modèles de repli configurés continuent de s’appliquer lorsque le modèle sélectionné pour la tâche échoue.
- La valeur `fallbacks` de la charge utile propre à la tâche remplace la liste de repli configurée lorsqu’elle est présente.
- Une liste de repli vide propre à la tâche (`--fallbacks ""` ou `fallbacks: []` dans la charge utile ou l’API de la tâche) rend l’exécution Cron stricte.
- Lorsqu’une tâche comporte `--model`, mais qu’aucune liste de repli n’est configurée, OpenClaw transmet un remplacement de repli explicitement vide afin que le modèle principal de l’agent ne soit pas ajouté comme cible de nouvelle tentative masquée.
- Les vérifications préalables des fournisseurs locaux parcourent les modèles de repli configurés avant de marquer une exécution Cron comme `skipped`.

`openclaw doctor` signale les tâches dont `payload.model` est déjà défini, notamment le nombre d’espaces de noms de fournisseurs et les divergences par rapport à `agents.defaults.model`. Utilisez cette vérification lorsque le comportement de l’authentification, du fournisseur ou de la facturation semble différer entre les discussions en direct et les tâches planifiées.

### Ordre de priorité des modèles Cron isolés

Cron isolé résout le modèle actif dans l’ordre suivant :

1. Remplacement du hook Gmail.
2. Option `--model` propre à la tâche.
3. Remplacement de modèle stocké dans la session Cron (lorsque l’utilisateur en a sélectionné un).
4. Sélection du modèle de l’agent ou du modèle par défaut.

### Mode rapide

Le mode rapide de Cron isolé suit la sélection résolue du modèle en direct. Le paramètre de configuration du modèle `params.fastMode` s’applique par défaut, mais un remplacement `fastMode` stocké dans la session prévaut toujours sur la configuration. Lorsque le mode résolu vaut `auto`, le seuil utilise la valeur `params.fastAutoOnSeconds` du modèle sélectionné, avec une valeur par défaut de 60 secondes.

### Nouvelles tentatives après un changement de modèle en direct

Si une exécution isolée lève `LiveSessionModelSwitchError`, Cron conserve le fournisseur et le modèle sélectionnés (ainsi que le remplacement de profil d’authentification sélectionné, le cas échéant) pour l’exécution active avant d’effectuer une nouvelle tentative. La boucle de nouvelle tentative externe est limitée à deux nouvelles tentatives de changement après la tentative initiale, puis s’interrompt au lieu de boucler indéfiniment.

## Sortie d’exécution et refus

### Suppression des accusés de réception obsolètes

Les tours Cron isolés suppriment les réponses obsolètes qui ne contiennent qu’un accusé de réception. Si le premier résultat est seulement une mise à jour d’état intermédiaire et qu’aucune exécution de sous-agent descendante n’est responsable de la réponse finale, Cron relance une fois le prompt afin d’obtenir le véritable résultat avant sa transmission.

### Suppression des jetons silencieux

Si une exécution Cron isolée renvoie uniquement le jeton silencieux (`NO_REPLY` ou `no_reply`), Cron supprime à la fois l’envoi sortant direct et le mécanisme de secours de résumé mis en file d’attente ; rien n’est donc publié dans la conversation.

### Refus structurés

Les exécutions Cron isolées utilisent les métadonnées structurées de refus d’exécution provenant de l’exécution intégrée (erreurs fatales de l’outil d’exécution portant le code `SYSTEM_RUN_DENIED` ou `INVALID_REQUEST`) comme signal de refus faisant autorité. Elles prennent également en compte les enveloppes `UNAVAILABLE` de l’hôte Node autour d’une erreur structurée imbriquée portant l’un de ces codes.

Cron ne considère pas comme des refus le texte de sortie finale ni les formulations de refus ressemblant à une demande d’approbation, sauf si l’exécution intégrée fournit également des métadonnées structurées de refus. Ainsi, le texte ordinaire de l’assistant n’est pas traité comme une commande bloquée.

`cron list` et l’historique des exécutions affichent le motif du refus au lieu d’indiquer `ok` pour une commande bloquée.

## Conservation

La conservation et l’élagage sont contrôlés dans la configuration :

- `cron.sessionRetention` (valeur par défaut : `24h`, ou `false` pour désactiver) élague les sessions terminées d’exécutions isolées.
- `cron.runLog.keepLines` (valeur par défaut : `2000`) élague, pour chaque tâche, les lignes SQLite conservées dans l’historique des exécutions. `cron.runLog.maxBytes` (valeur par défaut : `2000000`) reste accepté pour assurer la compatibilité avec les anciens journaux d’exécution basés sur des fichiers ; l’élagage SQLite repose sur le nombre de lignes.

## Migration des anciennes tâches

<Note>
Si vous avez des tâches Cron antérieures au format actuel d’envoi et de stockage, exécutez `openclaw doctor --fix`. Doctor normalise les anciens champs Cron (`jobId`, `schedule.cron`, les champs d’envoi de premier niveau, notamment l’ancien `threadId`, et les alias d’envoi `provider` de la charge utile) et migre les tâches de secours Webhook avec `notify: true` de `cron.webhook` vers un envoi Webhook explicite. Les tâches qui publient déjà dans une conversation conservent cet envoi et reçoivent une destination Webhook de fin d’exécution. Lorsque `cron.webhook` n’est pas défini, le marqueur inactif `notify` de premier niveau est supprimé pour les tâches sans cible de migration (l’envoi existant est conservé sans modification), afin que `doctor --fix` ne continue plus à émettre des avertissements à leur sujet.
</Note>

## Modifications courantes

Mettre à jour les paramètres d’envoi sans modifier le message :

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Désactiver l’envoi pour une tâche isolée :

```bash
openclaw cron edit <job-id> --no-deliver
```

Activer un contexte d’amorçage allégé pour une tâche isolée :

```bash
openclaw cron edit <job-id> --light-context
```

Publier sur un canal précis :

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Publier dans un sujet de forum Telegram :

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Créer une tâche isolée avec un contexte d’amorçage allégé :

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` s’applique uniquement aux tâches isolées exécutant un tour d’agent. Pour les exécutions Cron, le mode allégé conserve un contexte d’amorçage vide au lieu d’injecter l’ensemble complet des éléments d’amorçage de l’espace de travail.

Créer une tâche de commande avec des valeurs exactes pour argv, le répertoire de travail, l’environnement, l’entrée standard et les limites de sortie :

```bash
openclaw cron create "*/30 * * * *" \
  --name "Position export" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## Commandes d’administration courantes

Exécution manuelle et inspection :

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron run <job-id> --wait --wait-timeout 10m
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
openclaw cron runs --id <job-id> --limit 50
openclaw cron runs --id <job-id> --run-id <run-id>
```

Par défaut, `openclaw cron list` affiche toutes les tâches correspondantes. Passez `--agent <id>` pour n’afficher que les tâches dont l’identifiant d’agent normalisé effectif correspond ; les tâches sans identifiant d’agent enregistré sont considérées comme utilisant l’agent par défaut configuré.

`openclaw cron get <job-id>` renvoie directement le JSON enregistré de la tâche. Utilisez `cron show <job-id>` pour obtenir une vue lisible avec un aperçu de la route d’envoi.

`cron list --json` et `cron show <job-id> --json` incluent pour chaque tâche un champ de premier niveau `status`, calculé à partir de `enabled`, `state.runningAtMs` et `state.lastRunStatus`. Valeurs : `disabled`, `running`, `ok`, `error`, `skipped` ou `idle`. Dans le JSON, l’état reste canonique et sans décoration afin que les outils externes puissent lire l’état de la tâche sans le recalculer ; la sortie destinée aux utilisateurs peut agrémenter les états `error` répétés d’un nombre d’échecs.

Les entrées de `cron runs` incluent des diagnostics d’envoi indiquant la cible Cron prévue, la cible résolue, les envois effectués par l’outil de messagerie, l’utilisation du mécanisme de secours et l’état de livraison.

Réaffectation de l’agent et de la session :

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` émet un avertissement lorsque `--agent` est omis pour les tâches exécutant un tour d’agent et utilise alors l’agent par défaut (`main`). Passez `--agent <id>` lors de la création pour associer la tâche à un agent précis.

Ajustements de l’envoi :

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Tâches planifiées](/fr/automation/cron-jobs)
