---
read_when:
    - Vous souhaitez des tâches planifiées et des réveils
    - Vous déboguez l’exécution et les journaux de Cron
summary: Référence de la CLI pour `openclaw cron` (planifier et exécuter des tâches en arrière-plan)
title: Cron
x-i18n:
    generated_at: "2026-07-12T15:06:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
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
Toutes les mutations Cron (`add`/`create`, `update`/`edit`, `remove`, `run`) nécessitent `operator.admin`. Les exécutions de charges utiles de commande s’effectuent directement dans le processus du Gateway, et non sous forme d’un appel à l’outil `tools.exec` de l’agent ; `tools.exec.*` et les approbations d’exécution continuent de régir les outils d’exécution visibles par le modèle.
</Note>

## Créer rapidement des tâches

`openclaw cron create` est un alias de `openclaw cron add`. Pour les nouvelles tâches, placez d’abord la planification, puis le prompt :

```bash
openclaw cron create "0 7 * * *" \
  "Résumez les mises à jour de la nuit." \
  --name "Briefing du matin" \
  --agent ops
```

Utilisez `--webhook <url>` lorsque la tâche doit envoyer la charge utile finale par POST au lieu de la transmettre à une cible de discussion :

```bash
openclaw cron create "0 18 * * 1-5" \
  "Résumez les déploiements d’aujourd’hui au format JSON." \
  --name "Synthèse des déploiements" \
  --webhook "https://example.invalid/openclaw/cron"
```

Utilisez `--command` pour les tâches déterministes de type shell qui s’exécutent dans Cron d’OpenClaw sans démarrer une exécution isolée d’agent ou de modèle :

```bash
openclaw cron create "*/15 * * * *" \
  --name "Sonde de profondeur de file d’attente" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` stocke `argv: ["sh", "-lc", <shell>]`. Utilisez `--command-argv '["node","scripts/report.mjs"]'` pour une exécution avec des arguments exacts. Les tâches de commande capturent stdout/stderr, enregistrent l’historique Cron normal et acheminent la sortie au moyen des mêmes modes de livraison `announce`, `webhook` ou `none` que les tâches isolées. Une commande qui affiche uniquement `NO_REPLY` est supprimée.

## Sessions

`--session` accepte `main`, `isolated`, `current` ou `session:<id>`.

<AccordionGroup>
  <Accordion title="Clés de session">
    - `main` est associé à la session principale de l’agent.
    - `isolated` crée une nouvelle transcription et un nouvel identifiant de session à chaque exécution.
    - `current` est associé à la session active au moment de la création.
    - `session:<id>` est lié à une clé de session persistante explicite.

  </Accordion>
  <Accordion title="Sémantique des sessions isolées">
    Les exécutions isolées réinitialisent le contexte ambiant de la conversation. Le routage des canaux et des groupes, la politique d’envoi et de mise en file d’attente, l’élévation, l’origine et la liaison à l’environnement d’exécution ACP sont réinitialisés pour la nouvelle exécution. Les préférences sûres et les remplacements explicites de modèle ou d’authentification sélectionnés par l’utilisateur peuvent être conservés d’une exécution à l’autre.
  </Accordion>
</AccordionGroup>

## Livraison

`openclaw cron list` et `openclaw cron show <job-id>` affichent un aperçu de la route de livraison résolue. Pour `channel: "last"`, l’aperçu indique si la route a été résolue à partir de la session principale ou actuelle, ou si elle échouera en mode fermé.

Les cibles préfixées par un fournisseur permettent de lever l’ambiguïté des canaux d’annonce non résolus. Par exemple, `to: "telegram:123"` sélectionne Telegram lorsque `delivery.channel` est omis ou vaut `last`. Seuls les préfixes annoncés par le Plugin chargé servent de sélecteurs de fournisseur. Si `delivery.channel` est explicite, le préfixe doit correspondre à ce canal ; `channel: "whatsapp"` avec `to: "telegram:123"` est rejeté. Les préfixes de service tels que `imessage:` et `sms:` restent une syntaxe de cible propre au canal.

<Note>
Les tâches isolées créées avec `cron add` utilisent par défaut la livraison `--announce`. Utilisez `--no-deliver` pour conserver la sortie en interne. `--deliver` demeure un alias obsolète de `--announce`.
</Note>

### Responsabilité de la livraison

La livraison des discussions Cron isolées est partagée entre l’agent et l’exécuteur :

- L’agent peut envoyer directement à l’aide de l’outil `message` lorsqu’une route de discussion est disponible.
- En solution de repli, `announce` livre la réponse finale uniquement lorsque l’agent ne l’a pas envoyée directement à la cible résolue.
- `webhook` envoie la charge utile finale à une URL.
- `none` désactive la livraison de repli par l’exécuteur.

Utilisez `cron add|create --webhook <url>` ou `cron edit <job-id> --webhook <url>` pour configurer la livraison par Webhook. Ne combinez pas `--webhook` avec des indicateurs de livraison vers une discussion tels que `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` ou `--account`.

`cron edit <job-id>` peut supprimer des champs individuels de routage de livraison avec `--clear-channel`, `--clear-to`, `--clear-thread-id` et `--clear-account` (chacun est rejeté lorsqu’il est combiné avec l’indicateur de définition correspondant). Contrairement à `--no-deliver`, qui désactive uniquement la livraison de repli par l’exécuteur, ces options suppriment le champ stocké afin que cette partie de la route de la tâche soit de nouveau résolue à partir des valeurs par défaut.

`--announce` correspond à la livraison de repli par l’exécuteur pour la réponse finale. `--no-deliver` désactive ce mécanisme de repli, mais ne supprime pas l’outil `message` de l’agent lorsqu’une route de discussion est disponible.

Les rappels créés depuis une discussion active conservent la cible de livraison de la discussion en cours pour la livraison d’annonce de repli. Les clés de session internes peuvent être en minuscules ; ne les utilisez pas comme source de vérité pour les identifiants de fournisseur sensibles à la casse, tels que les identifiants de salon Matrix.

### Livraison des échecs

Les notifications d’échec sont résolues dans l’ordre suivant :

1. `delivery.failureDestination` sur la tâche.
2. La valeur globale `cron.failureDestination`.
3. La cible d’annonce principale de la tâche (lorsqu’aucune des valeurs précédentes ne correspond à une destination concrète).

<Note>
Les tâches de session principale ne peuvent utiliser `delivery.failureDestination` que lorsque le mode de livraison principal est `webhook`. Les tâches isolées l’acceptent dans tous les modes.
</Note>

Les exécutions Cron isolées traitent les échecs de l’agent au niveau de l’exécution comme des erreurs de tâche, même lorsqu’aucune charge utile de réponse n’est produite ; les échecs de modèle ou de fournisseur incrémentent donc tout de même les compteurs d’erreurs et déclenchent les notifications d’échec.

Les tâches Cron de commande ne démarrent pas un tour d’agent isolé. Un code de sortie nul enregistre `ok` ; un code de sortie non nul, un signal, un dépassement de délai ou un dépassement de délai sans sortie enregistre `error` et peut déclencher le même mécanisme de notification d’échec.

Si une exécution isolée dépasse le délai avant la première requête au modèle, `openclaw cron show` et `openclaw cron runs` incluent une erreur propre à la phase, telle que `setup timed out before runner start`, ou un message de blocage nommant la dernière phase de démarrage connue (par exemple `context-engine`). Pour les fournisseurs basés sur la CLI, le mécanisme de surveillance préalable au modèle reste actif jusqu’au démarrage du tour de la CLI externe ; les blocages de recherche de session, de hook, d’authentification, de prompt et de configuration de la CLI sont donc signalés comme des échecs Cron préalables au modèle.

## Planification

### Tâches ponctuelles

`--at <datetime>` planifie une exécution ponctuelle. Les dates et heures sans décalage sont traitées comme étant en UTC, sauf si vous transmettez également `--tz <iana>`, qui interprète l’heure locale dans le fuseau horaire indiqué.

<Note>
Par défaut, les tâches ponctuelles sont supprimées après une exécution réussie. Utilisez `--keep-after-run` pour les conserver.
</Note>

### Tâches récurrentes

Les tâches récurrentes utilisent un délai exponentiel entre les nouvelles tentatives après des erreurs consécutives : 30s, 1m, 5m, 15m, 60m. La planification revient à la normale après la prochaine exécution réussie.

Les exécutions ignorées sont suivies séparément des erreurs d’exécution. Elles n’affectent pas le délai entre les nouvelles tentatives, mais `openclaw cron edit <job-id> --failure-alert-include-skipped` permet d’inclure dans les alertes d’échec des notifications répétées d’exécutions ignorées.

Pour les tâches isolées qui ciblent un fournisseur de modèle local configuré (URL de base sur l’interface de bouclage, un réseau privé ou `.local`), Cron effectue une vérification préalable légère du fournisseur avant de démarrer le tour de l’agent : les fournisseurs `api: "ollama"` sont testés sur `/api/tags` ; les autres fournisseurs locaux compatibles avec OpenAI (`api: "openai-completions"`, par exemple vLLM, SGLang, LM Studio) sont testés sur `/models`. Si le point de terminaison est inaccessible, l’exécution est enregistrée comme `skipped` et réessayée lors d’une planification ultérieure ; le résultat d’accessibilité est mis en cache par point de terminaison pendant 5 minutes afin que de nombreuses tâches ciblant le même serveur local ne le sollicitent pas avec des vérifications répétées.

Les tâches Cron, l’état d’exécution en attente et l’historique des exécutions résident dans la base de données d’état SQLite partagée. Les anciens fichiers `jobs.json`, `<name>-state.json` et `runs/*.jsonl` sont importés une fois, puis renommés avec le suffixe `.migrated`. Après l’importation, modifiez les planifications avec `openclaw cron add|edit|remove` plutôt qu’en modifiant les fichiers JSON.

### Exécutions manuelles

`openclaw cron run <job-id>` force l’exécution par défaut et renvoie dès que l’exécution manuelle est mise en file d’attente. Les réponses réussies incluent `{ ok: true, enqueued: true, runId }`. Utilisez le `runId` renvoyé pour consulter le résultat ultérieurement :

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Ajoutez `--wait` lorsqu’un script doit rester bloqué jusqu’à ce que cette exécution mise en file d’attente enregistre un état terminal précis :

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Avec `--wait`, la CLI appelle toujours `cron.run` en premier, puis interroge `cron.runs` pour le `runId` renvoyé. La commande se termine avec le code `0` uniquement lorsque l’exécution s’achève avec l’état `ok`. Elle se termine avec un code non nul lorsque l’exécution s’achève avec `error` ou `skipped`, lorsque la réponse du Gateway n’inclut pas de `runId`, ou lorsque `--wait-timeout` expire (valeur par défaut : `10m`, interrogation toutes les `2s` par défaut). `--poll-interval` doit être supérieur à zéro.

<Note>
Utilisez `--due` lorsque vous souhaitez que la commande manuelle ne s’exécute que si la tâche doit actuellement être exécutée. Si `--due --wait` ne met aucune exécution en file d’attente, la commande renvoie la réponse normale de non-exécution au lieu d’effectuer des interrogations.
</Note>

## Modèles

`cron add|edit --model <ref>` sélectionne un modèle autorisé pour la tâche. `cron add|edit --fallbacks <list>` définit les modèles de repli propres à la tâche, par exemple `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5` ; transmettez `--fallbacks ""` pour une exécution stricte sans modèle de repli. `cron edit <job-id> --clear-fallbacks` supprime le remplacement des modèles de repli propre à la tâche. `cron edit <job-id> --clear-model` supprime le remplacement de modèle propre à la tâche afin qu’elle suive la priorité normale de sélection du modèle Cron (un remplacement de session Cron stocké s’il existe, sinon le modèle de l’agent ou le modèle par défaut) ; cette option ne peut pas être combinée avec `--model`. `cron add|edit --thinking <level>` définit un remplacement du niveau de réflexion propre à la tâche ; `cron edit <job-id> --clear-thinking` le supprime afin que la tâche suive la priorité normale du niveau de réflexion Cron, et cette option ne peut pas être combinée avec `--thinking`.

<Warning>
Si le modèle n’est pas autorisé ou ne peut pas être résolu, Cron fait échouer l’exécution avec une erreur de validation explicite au lieu de se rabattre sur la sélection du modèle de l’agent de la tâche ou du modèle par défaut.
</Warning>

L’option `--model` de Cron désigne un **modèle principal de la tâche**, et non un remplacement `/model` de session de discussion. Cela signifie que :

- Les modèles de repli configurés s’appliquent toujours lorsque le modèle sélectionné pour la tâche échoue.
- La valeur `fallbacks` de la charge utile propre à la tâche remplace la liste des modèles de repli configurée lorsqu’elle est présente.
- Une liste vide de modèles de repli propre à la tâche (`--fallbacks ""` ou `fallbacks: []` dans la charge utile ou l’API de la tâche) rend l’exécution Cron stricte.
- Lorsqu’une tâche possède `--model`, mais qu’aucune liste de modèles de repli n’est configurée, OpenClaw transmet un remplacement explicite par une liste de repli vide afin que le modèle principal de l’agent ne soit pas ajouté comme cible cachée de nouvelle tentative.
- Les vérifications préalables des fournisseurs locaux parcourent les modèles de repli configurés avant de marquer une exécution Cron comme `skipped`.

`openclaw doctor` signale les tâches dont `payload.model` est déjà défini, y compris le nombre d’espaces de noms de fournisseur et les incohérences avec `agents.defaults.model`. Utilisez cette vérification lorsque le comportement d’authentification, de fournisseur ou de facturation diffère entre les discussions en direct et les tâches planifiées.

### Priorité des modèles pour les tâches Cron isolées

Cron isolé résout le modèle actif dans l’ordre suivant :

1. Remplacement du hook Gmail.
2. Option `--model` propre à la tâche.
3. Remplacement du modèle de session Cron stocké (lorsque l’utilisateur en a sélectionné un).
4. Sélection du modèle de l’agent ou du modèle par défaut.

### Mode rapide

Le mode rapide des tâches Cron isolées suit la sélection résolue du modèle en direct. La configuration du modèle `params.fastMode` s’applique par défaut, mais un remplacement `fastMode` stocké dans la session prévaut toujours sur la configuration. Lorsque le mode résolu est `auto`, le seuil utilise la valeur `params.fastAutoOnSeconds` du modèle sélectionné, avec une valeur par défaut de 60 secondes.

### Nouvelles tentatives après un changement de modèle en direct

Si une exécution isolée lève `LiveSessionModelSwitchError`, Cron conserve le fournisseur et le modèle sélectionnés après le changement (ainsi que le remplacement du profil d’authentification sélectionné, le cas échéant) pour l’exécution active avant de réessayer. La boucle externe de nouvelles tentatives est limitée à deux nouvelles tentatives de changement après la tentative initiale, puis s’interrompt au lieu de boucler indéfiniment.

## Sortie des exécutions et refus

### Suppression des accusés de réception obsolètes

Les tours Cron isolés suppriment les réponses obsolètes qui ne contiennent qu’un accusé de réception. Si le premier résultat est uniquement une mise à jour d’état intermédiaire et qu’aucune exécution de sous-agent descendante n’est responsable de la réponse finale, Cron relance une fois le prompt pour obtenir le résultat réel avant la livraison.

### Suppression du jeton silencieux

Si une exécution Cron isolée renvoie uniquement le jeton silencieux (`NO_REPLY` ou `no_reply`), Cron supprime à la fois l’envoi sortant direct et le chemin de secours de résumé mis en file d’attente, de sorte que rien n’est publié dans la conversation.

### Refus structurés

Les exécutions Cron isolées utilisent les métadonnées structurées de refus d’exécution provenant de l’exécution intégrée (erreurs fatales de l’outil d’exécution portant le code `SYSTEM_RUN_DENIED` ou `INVALID_REQUEST`) comme signal de refus faisant autorité. Elles prennent également en charge les enveloppes `UNAVAILABLE` de l’hôte Node autour d’une erreur structurée imbriquée portant l’un de ces codes.

Cron ne classe pas comme refus le texte en sortie finale ni les formulations de refus ressemblant à une demande d’approbation, sauf si l’exécution intégrée fournit également des métadonnées structurées de refus. Le texte ordinaire de l’assistant n’est donc pas traité comme une commande bloquée.

`cron list` et l’historique des exécutions affichent le motif du refus au lieu de signaler une commande bloquée comme `ok`.

## Conservation

La conservation et l’élagage sont contrôlés dans la configuration :

- `cron.sessionRetention` (valeur par défaut : `24h`, ou `false` pour désactiver) élague les sessions d’exécutions isolées terminées.
- `cron.runLog.keepLines` (valeur par défaut : `2000`) élague, pour chaque tâche, les lignes conservées de l’historique des exécutions SQLite. `cron.runLog.maxBytes` (valeur par défaut : `2000000`) reste accepté pour assurer la compatibilité avec les anciens journaux d’exécution sur fichiers ; l’élagage SQLite repose sur le nombre de lignes.

## Migration des anciennes tâches

<Note>
Si vos tâches Cron sont antérieures au format actuel de stockage et d’envoi, exécutez `openclaw doctor --fix`. Doctor normalise les anciens champs Cron (`jobId`, `schedule.cron`, les champs d’envoi de premier niveau, notamment l’ancien `threadId`, ainsi que les alias d’envoi `provider` de la charge utile) et migre les tâches de Webhook de secours avec `notify: true` depuis `cron.webhook` vers un envoi explicite par Webhook. Les tâches qui publient déjà une annonce dans une conversation conservent cet envoi et reçoivent une destination Webhook de fin d’exécution. Lorsque `cron.webhook` n’est pas défini, le marqueur inactif `notify` de premier niveau est supprimé des tâches sans cible de migration (l’envoi existant est conservé sans modification), de sorte que `doctor --fix` ne réaffiche plus continuellement d’avertissement à leur sujet.
</Note>

## Modifications courantes

Mettez à jour les paramètres d’envoi sans modifier le message :

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Désactivez l’envoi pour une tâche isolée :

```bash
openclaw cron edit <job-id> --no-deliver
```

Activez un contexte d’amorçage léger pour une tâche isolée :

```bash
openclaw cron edit <job-id> --light-context
```

Publiez une annonce sur un canal spécifique :

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Publiez une annonce dans un sujet de forum Telegram :

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Créez une tâche isolée avec un contexte d’amorçage léger :

```bash
openclaw cron create "0 7 * * *" \
  "Résumer les mises à jour de la nuit." \
  --name "Synthèse matinale légère" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` s’applique uniquement aux tâches isolées de tour d’agent. Pour les exécutions Cron, le mode léger laisse le contexte d’amorçage vide au lieu d’injecter l’ensemble complet d’amorçage de l’espace de travail.

Créez une tâche de commande avec des valeurs exactes pour argv, cwd, l’environnement, stdin et les limites de sortie :

```bash
openclaw cron create "*/30 * * * *" \
  --name "Export de position" \
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

`openclaw cron list` affiche par défaut toutes les tâches correspondantes. Transmettez `--agent <id>` pour afficher uniquement les tâches dont l’identifiant d’agent normalisé effectif correspond ; les tâches sans identifiant d’agent stocké sont considérées comme appartenant à l’agent par défaut configuré.

`openclaw cron get <job-id>` renvoie directement le JSON stocké de la tâche. Utilisez `cron show <job-id>` pour obtenir une vue lisible avec un aperçu de la route d’envoi.

`cron list --json` et `cron show <job-id> --json` incluent pour chaque tâche un champ de premier niveau `status`, calculé à partir de `enabled`, `state.runningAtMs` et `state.lastRunStatus`. Valeurs : `disabled`, `running`, `ok`, `error`, `skipped` ou `idle`. Le statut JSON reste canonique et sans décoration afin que les outils externes puissent lire l’état de la tâche sans avoir à le recalculer ; la sortie lisible peut accompagner les statuts `error` répétés d’un nombre d’échecs.

Les entrées de `cron runs` incluent des diagnostics d’envoi indiquant la cible Cron prévue, la cible résolue, les envois de l’outil de messagerie, l’utilisation du mécanisme de secours et l’état de l’envoi.

Reciblage de l’agent et de la session :

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` affiche un avertissement lorsque `--agent` est omis pour les tâches de tour d’agent et utilise l’agent par défaut (`main`). Transmettez `--agent <id>` lors de la création pour fixer un agent spécifique.

Ajustements de l’envoi :

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Ressources connexes

- [Référence de la CLI](/fr/cli)
- [Tâches planifiées](/fr/automation/cron-jobs)
