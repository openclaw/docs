---
read_when:
    - Vous souhaitez des tâches planifiées et des réveils
    - Vous déboguez l’exécution et les journaux de Cron
summary: Référence de la CLI pour `openclaw cron` (planifier et exécuter des tâches en arrière-plan)
title: Cron
x-i18n:
    generated_at: "2026-07-16T13:06:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eb897fde0798563144703cd2f3a2bc6c20229aa4135af9c6db41995e66ffd2d1
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gérez les tâches Cron du planificateur du Gateway.

<Tip>
Exécutez `openclaw cron --help` pour afficher l’ensemble des commandes disponibles. Consultez [Tâches Cron](/fr/automation/cron-jobs) pour le guide conceptuel.
</Tip>

<Note>
Toutes les modifications Cron (`add`/`create`, `update`/`edit`, `remove`, `run`) nécessitent `operator.admin`. Les exécutions de charges utiles de commande s’effectuent directement dans le processus du Gateway, et non comme un appel à l’outil `tools.exec` d’un agent ; `tools.exec.*` et les approbations d’exécution continuent de régir les outils d’exécution visibles par le modèle.
</Note>

## Créer rapidement des tâches

`openclaw cron create` est un alias de `openclaw cron add`. Pour les nouvelles tâches, indiquez d’abord la planification, puis le prompt :

```bash
openclaw cron create "0 7 * * *" \
  "Résumez les mises à jour de la nuit." \
  --name "Briefing du matin" \
  --agent ops
```

Utilisez `--webhook <url>` lorsque la tâche doit envoyer la charge utile finale par POST au lieu de la transmettre à une cible de discussion :

```bash
openclaw cron create "0 18 * * 1-5" \
  "Résumez les déploiements du jour au format JSON." \
  --name "Récapitulatif des déploiements" \
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

`--command <shell>` stocke `argv: ["sh", "-lc", <shell>]`. Utilisez `--command-argv '["node","scripts/report.mjs"]'` pour une exécution argv exacte. Les tâches de commande capturent stdout/stderr, enregistrent l’historique Cron normal et acheminent la sortie à l’aide des mêmes modes de livraison `announce`, `webhook` ou `none` que les tâches isolées. Une commande qui affiche uniquement `NO_REPLY` est supprimée.

## Sessions

`--session` accepte `main`, `isolated`, `current` ou `session:<id>`.

<AccordionGroup>
  <Accordion title="Clés de session">
    - `main` se lie à la session principale de l’agent.
    - `isolated` crée une nouvelle transcription et un nouvel identifiant de session à chaque exécution.
    - `current` se lie à la session active au moment de la création.
    - `session:<id>` s’attache à une clé de session persistante explicite.

  </Accordion>
  <Accordion title="Sémantique des sessions isolées">
    Les exécutions isolées réinitialisent le contexte de conversation ambiant. Le routage des canaux et des groupes, la politique d’envoi et de mise en file d’attente, l’élévation, l’origine et la liaison d’exécution ACP sont réinitialisés pour la nouvelle exécution. Les préférences sûres et les remplacements explicites du modèle ou de l’authentification sélectionnés par l’utilisateur peuvent être conservés d’une exécution à l’autre.
  </Accordion>
</AccordionGroup>

## Livraison

`openclaw cron list` et `openclaw cron show <job-id>` affichent un aperçu de la route de livraison résolue. Pour `channel: "last"`, l’aperçu indique si la route a été résolue depuis la session principale ou actuelle, ou si elle échouera en mode fermé.

Les cibles préfixées par un fournisseur permettent de lever l’ambiguïté des canaux d’annonce non résolus. Par exemple, `to: "telegram:123"` sélectionne Telegram lorsque `delivery.channel` est omis ou vaut `last`. Seuls les préfixes annoncés par le Plugin chargé servent de sélecteurs de fournisseur. Si `delivery.channel` est explicite, le préfixe doit correspondre à ce canal ; `channel: "whatsapp"` avec `to: "telegram:123"` est rejeté. Les préfixes de service tels que `imessage:` et `sms:` restent une syntaxe de cible appartenant au canal.

<Note>
Les tâches `cron add` isolées utilisent par défaut la livraison `--announce`. Utilisez `--no-deliver` pour conserver la sortie en interne. `--deliver` reste un alias obsolète de `--announce`.
</Note>

### Responsabilité de la livraison

La livraison des discussions Cron isolées est partagée entre l’agent et l’exécuteur :

- L’agent peut envoyer directement à l’aide de l’outil `message` lorsqu’une route de discussion est disponible.
- `announce` livre la réponse finale en secours uniquement lorsque l’agent ne l’a pas envoyée directement à la cible résolue.
- `webhook` envoie la charge utile finale à une URL.
- `none` désactive la livraison de secours de l’exécuteur.

Utilisez `cron add|create --webhook <url>` ou `cron edit <job-id> --webhook <url>` pour configurer la livraison par Webhook. Ne combinez pas `--webhook` avec des options de livraison vers une discussion telles que `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` ou `--account`.

`cron edit <job-id>` permet de supprimer individuellement des champs de routage de livraison avec `--clear-channel`, `--clear-to`, `--clear-thread-id` et `--clear-account` (chacun est rejeté lorsqu’il est combiné avec l’option de définition correspondante). Contrairement à `--no-deliver`, qui désactive uniquement la livraison de secours de l’exécuteur, ces options suppriment le champ stocké afin que la tâche résolve à nouveau cette partie de sa route à partir des valeurs par défaut.

`--announce` correspond à la livraison de secours de la réponse finale par l’exécuteur. `--no-deliver` désactive ce secours, mais ne supprime pas l’outil `message` de l’agent lorsqu’une route de discussion est disponible.

Les rappels créés depuis une discussion active conservent la cible de livraison de cette discussion pour la livraison d’annonce de secours. Les clés de session internes peuvent être en minuscules ; ne les utilisez pas comme source de vérité pour les identifiants de fournisseur sensibles à la casse, tels que les identifiants de salon Matrix.

### Livraison en cas d’échec

Les notifications d’échec sont résolues dans l’ordre suivant :

1. `delivery.failureDestination` sur la tâche.
2. `cron.failureDestination` global.
3. La cible d’annonce principale de la tâche (lorsqu’aucun des éléments précédents ne correspond à une destination concrète).

<Note>
Les tâches de la session principale ne peuvent utiliser `delivery.failureDestination` que lorsque le mode de livraison principal est `webhook`. Les tâches isolées l’acceptent dans tous les modes.
</Note>

Les exécutions Cron isolées traitent les échecs d’agent au niveau de l’exécution comme des erreurs de tâche, même lorsqu’aucune charge utile de réponse n’est produite ; les échecs du modèle ou du fournisseur incrémentent donc malgré tout les compteurs d’erreurs et déclenchent les notifications d’échec.

Les tâches Cron de commande ne démarrent pas de tour d’agent isolé. Un code de sortie nul enregistre `ok` ; un code de sortie non nul, un signal, un délai d’expiration ou un délai d’expiration sans sortie enregistre `error` et peut déclencher le même mécanisme de notification d’échec.

Si une exécution isolée expire avant la première requête au modèle, `openclaw cron show` et `openclaw cron runs` incluent une erreur propre à la phase, telle que `setup timed out before runner start`, ou un message de blocage nommant la dernière phase de démarrage connue (par exemple `context-engine`). Pour les fournisseurs reposant sur une CLI, le mécanisme de surveillance antérieur au modèle reste actif jusqu’au démarrage du tour de la CLI externe ; les blocages liés à la recherche de session, aux hooks, à l’authentification, au prompt et à la configuration de la CLI sont donc signalés comme des échecs Cron antérieurs au modèle.

## Planification

### Tâches ponctuelles

`--at <datetime>` planifie une exécution ponctuelle. Les dates et heures sans décalage sont interprétées en UTC, sauf si vous transmettez également `--tz <iana>`, qui interprète l’heure locale dans le fuseau horaire indiqué.

<Note>
Par défaut, les tâches ponctuelles sont supprimées après une exécution réussie. Utilisez `--keep-after-run` pour les conserver.
</Note>

### Tâches récurrentes

Après des erreurs consécutives, les tâches récurrentes utilisent un délai exponentiel entre les nouvelles tentatives : 30s, 1m, 5m, 15m, 60m. La planification revient à la normale après l’exécution réussie suivante.

Les exécutions ignorées sont suivies séparément des erreurs d’exécution. Elles n’ont aucune incidence sur le délai entre les nouvelles tentatives, mais `openclaw cron edit <job-id> --failure-alert-include-skipped` permet d’inclure des notifications répétées d’exécutions ignorées dans les alertes d’échec.

Pour les tâches isolées qui ciblent un fournisseur de modèle local configuré (URL de base sur l’interface de bouclage, un réseau privé ou `.local`), Cron effectue une vérification préalable légère du fournisseur avant de démarrer le tour de l’agent : les fournisseurs `api: "ollama"` sont sondés à l’adresse `/api/tags` ; les autres fournisseurs locaux compatibles avec OpenAI (`api: "openai-completions"`, par exemple vLLM, SGLang, LM Studio) sont sondés à l’adresse `/models`. Si le point de terminaison est inaccessible, l’exécution est enregistrée comme `skipped` et retentée lors d’une planification ultérieure ; le résultat d’accessibilité est mis en cache par point de terminaison pendant 5 minutes afin que de nombreuses tâches utilisant le même serveur local ne le surchargent pas de sondes répétées.

Les tâches Cron, l’état d’exécution en attente et l’historique des exécutions résident dans la base de données d’état SQLite partagée. Les anciens fichiers `jobs.json`, `<name>-state.json` et `runs/*.jsonl` sont importés une seule fois, puis renommés avec un suffixe `.migrated`. Après l’importation, modifiez les planifications avec `openclaw cron add|edit|remove` plutôt qu’en modifiant les fichiers JSON.

### Exécutions manuelles

`openclaw cron run <job-id>` force l’exécution par défaut et retourne dès que l’exécution manuelle est mise en file d’attente. Les réponses réussies incluent `{ ok: true, enqueued: true, runId }`. Utilisez la valeur `runId` retournée pour consulter ultérieurement le résultat :

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Ajoutez `--wait` lorsqu’un script doit rester bloqué jusqu’à ce que cette exécution précise mise en file d’attente enregistre un état terminal :

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Avec `--wait`, la CLI appelle toujours `cron.run` en premier, puis interroge `cron.runs` pour la valeur `runId` retournée. La commande se termine avec `0` uniquement lorsque l’exécution se termine avec l’état `ok`. Elle se termine avec un code non nul lorsque l’exécution se termine avec `error` ou `skipped`, lorsque la réponse du Gateway n’inclut pas de `runId`, ou lorsque `--wait-timeout` expire (valeur par défaut : `10m`, avec une interrogation toutes les `2s` par défaut). `--poll-interval` doit être supérieur à zéro.

<Note>
Utilisez `--due` lorsque vous souhaitez que la commande manuelle s’exécute uniquement si la tâche est actuellement arrivée à échéance. Si `--due --wait` ne met pas d’exécution en file d’attente, la commande retourne la réponse normale d’absence d’exécution au lieu de lancer l’interrogation.
</Note>

## Modèles

`cron add|edit --model <ref>` sélectionne un modèle autorisé pour la tâche. `cron add|edit --fallbacks <list>` définit les modèles de secours propres à la tâche, par exemple `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5` ; transmettez `--fallbacks ""` pour une exécution stricte sans modèle de secours. `cron edit <job-id> --clear-fallbacks` supprime le remplacement des modèles de secours propre à la tâche. `cron edit <job-id> --clear-model` supprime le remplacement du modèle propre à la tâche afin que celle-ci suive la priorité normale de sélection du modèle Cron (un remplacement de session Cron stocké s’il existe, sinon le modèle de l’agent ou le modèle par défaut) ; cette option ne peut pas être combinée avec `--model`. `cron add|edit --thinking <level>` définit un remplacement du niveau de réflexion propre à la tâche ; `cron edit <job-id> --clear-thinking` le supprime afin que la tâche suive la priorité normale du niveau de réflexion Cron, et cette option ne peut pas être combinée avec `--thinking`.

<Warning>
Si le modèle n’est pas autorisé ou ne peut pas être résolu, Cron fait échouer l’exécution avec une erreur de validation explicite au lieu de revenir à la sélection du modèle de l’agent de la tâche ou du modèle par défaut.
</Warning>

Le `--model` de Cron est un **modèle principal de la tâche**, et non un remplacement de `/model` de la session de discussion. Cela signifie que :

- Les modèles de secours configurés continuent de s’appliquer lorsque le modèle sélectionné pour la tâche échoue.
- La valeur `fallbacks` de la charge utile propre à la tâche remplace la liste de modèles de secours configurée lorsqu’elle est présente.
- Une liste vide de modèles de secours propres à la tâche (`--fallbacks ""` ou `fallbacks: []` dans la charge utile ou l’API de la tâche) rend l’exécution Cron stricte.
- Lorsqu’une tâche possède `--model` mais qu’aucune liste de modèles de secours n’est configurée, OpenClaw transmet un remplacement explicite vide des modèles de secours afin que le modèle principal de l’agent ne soit pas ajouté comme cible de nouvelle tentative cachée.
- Les vérifications préalables des fournisseurs locaux parcourent les modèles de secours configurés avant de marquer une exécution Cron comme `skipped`.

`openclaw doctor` signale les tâches pour lesquelles `payload.model` est déjà défini, notamment le nombre d’espaces de noms de fournisseurs et les incohérences avec `agents.defaults.model`. Utilisez cette vérification lorsque le comportement de l’authentification, du fournisseur ou de la facturation diffère entre les discussions en direct et les tâches planifiées.

### Priorité des modèles Cron isolés

Cron isolé résout le modèle actif dans l’ordre suivant :

1. Remplacement du hook Gmail.
2. `--model` propre à la tâche.
3. Remplacement du modèle de session Cron stocké (lorsque l’utilisateur en a sélectionné un).
4. Sélection du modèle de l’agent ou du modèle par défaut.

### Mode rapide

Le mode rapide de Cron isolé suit la sélection du modèle actif résolue. La configuration du modèle `params.fastMode` s’applique par défaut, mais une substitution enregistrée dans la session `fastMode` reste prioritaire sur la configuration. Lorsque le mode résolu est `auto`, le délai limite utilise la valeur `params.fastAutoOnSeconds` du modèle sélectionné, avec une valeur par défaut de 60 secondes.

### Nouvelles tentatives après un changement de modèle actif

Si une exécution isolée déclenche `LiveSessionModelSwitchError`, Cron conserve le fournisseur et le modèle sélectionnés après le changement (ainsi que la substitution du profil d’authentification sélectionné, le cas échéant) pour l’exécution active avant de réessayer. La boucle externe est limitée à deux nouvelles tentatives de changement après la tentative initiale, puis abandonne au lieu de boucler indéfiniment.

## Sortie d’exécution et refus

### Suppression des accusés de réception obsolètes

Les tours Cron isolés suppriment les réponses obsolètes qui ne contiennent qu’un accusé de réception. Si le premier résultat n’est qu’une mise à jour d’état provisoire et qu’aucune exécution d’un sous-agent descendant n’est responsable de la réponse finale, Cron sollicite une fois de plus le résultat réel avant sa livraison.

### Suppression des jetons silencieux

Si une exécution Cron isolée renvoie uniquement le jeton silencieux (`NO_REPLY` ou `no_reply`), Cron supprime à la fois la livraison sortante directe et le chemin de secours du résumé mis en file d’attente, de sorte que rien n’est renvoyé dans la discussion.

### Refus structurés

Les exécutions Cron isolées utilisent les métadonnées structurées de refus d’exécution provenant de l’exécution intégrée (erreurs fatales de l’outil d’exécution portant le code `SYSTEM_RUN_DENIED` ou `INVALID_REQUEST`) comme signal de refus faisant autorité. Elles prennent également en compte les enveloppes `UNAVAILABLE` de l’hôte Node entourant une erreur structurée imbriquée qui porte l’un de ces codes.

Cron ne classe pas comme refus le texte de sortie final ni les formulations de refus ressemblant à une demande d’approbation, sauf si l’exécution intégrée fournit également des métadonnées structurées de refus. Le texte ordinaire de l’assistant n’est donc pas traité comme une commande bloquée.

`cron list` et l’historique des exécutions affichent la raison du refus au lieu de signaler une commande bloquée comme `ok`.

## Conservation

Comportement de conservation :

- `cron.sessionRetention` (valeur par défaut : `24h`, ou `false` pour désactiver) supprime les sessions d’exécution isolées terminées.
- L’historique des exécutions conserve les 2000 lignes terminales les plus récentes pour chaque tâche Cron. Les lignes perdues conservent la fenêtre standard de nettoyage de 24 heures des tâches perdues.

## Migration des anciennes tâches

<Note>
Si vous disposez de tâches Cron antérieures au format actuel de livraison et de stockage, exécutez `openclaw doctor --fix`. Doctor normalise les anciens champs Cron (`jobId`, `schedule.cron`, les champs de livraison de premier niveau, y compris l’ancien `threadId`, et les alias de livraison `provider` de la charge utile) et migre les tâches de Webhook de secours `notify: true` de `cron.webhook` vers une livraison explicite par Webhook. Les tâches qui publient déjà dans une discussion conservent cette livraison et reçoivent une destination Webhook d’achèvement. Lorsque `cron.webhook` n’est pas défini, le marqueur inactif de premier niveau `notify` est supprimé pour les tâches sans cible de migration (la livraison existante est conservée sans modification), afin que `doctor --fix` ne continue plus à afficher des avertissements à leur sujet.
</Note>

## Modifications courantes

Mettez à jour les paramètres de livraison sans modifier le message :

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Désactivez la livraison pour une tâche isolée :

```bash
openclaw cron edit <job-id> --no-deliver
```

Activez un contexte d’amorçage léger pour une tâche isolée :

```bash
openclaw cron edit <job-id> --light-context
```

Publiez sur un canal spécifique :

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Publiez dans un sujet de forum Telegram :

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Créez une tâche isolée avec un contexte d’amorçage léger :

```bash
openclaw cron create "0 7 * * *" \
  "Résumer les mises à jour de la nuit." \
  --name "Briefing matinal léger" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` s’applique uniquement aux tâches isolées de tour d’agent. Pour les exécutions Cron, le mode léger laisse le contexte d’amorçage vide au lieu d’injecter l’ensemble complet d’amorçage de l’espace de travail.

Créez une tâche de commande avec des valeurs exactes pour argv, le répertoire de travail, l’environnement, l’entrée standard et les limites de sortie :

```bash
openclaw cron create "*/30 * * * *" \
  --name "Export des positions" \
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

`openclaw cron list` affiche par défaut toutes les tâches correspondantes. Transmettez `--agent <id>` pour n’afficher que les tâches dont l’identifiant d’agent normalisé effectif correspond ; les tâches sans identifiant d’agent enregistré sont considérées comme utilisant l’agent par défaut configuré.

`openclaw cron get <job-id>` renvoie directement le JSON enregistré de la tâche. Utilisez `cron show <job-id>` pour obtenir une vue lisible avec un aperçu de l’itinéraire de livraison.

`cron list --json` et `cron show <job-id> --json` incluent pour chaque tâche un champ de premier niveau `status`, calculé à partir de `enabled`, `state.runningAtMs` et `state.lastRunStatus`. Valeurs : `disabled`, `running`, `ok`, `error`, `skipped` ou `idle`. L’état JSON reste canonique et sans décoration afin que les outils externes puissent lire l’état de la tâche sans avoir à le recalculer ; la sortie destinée aux humains peut enrichir les états `error` répétés avec un nombre d’échecs.

Les entrées `cron runs` incluent des diagnostics de livraison avec la cible Cron prévue, la cible résolue, les envois de l’outil de messagerie, l’utilisation du mécanisme de secours et l’état de livraison.

Réaffectation de l’agent et de la session :

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` affiche un avertissement lorsque `--agent` est omis pour les tâches de tour d’agent et utilise alors l’agent par défaut (`main`). Transmettez `--agent <id>` lors de la création pour associer la tâche à un agent précis.

Ajustements de la livraison :

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Pages connexes

- [Référence de la CLI](/fr/cli)
- [Tâches planifiées](/fr/automation/cron-jobs)
