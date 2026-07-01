---
read_when:
    - Vous voulez des tâches planifiées et des réveils
    - Vous déboguez l’exécution de Cron et les journaux
summary: Référence CLI pour `openclaw cron` (planifier et exécuter des tâches en arrière-plan)
title: Cron
x-i18n:
    generated_at: "2026-07-01T05:39:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aed39843e183b3d441908ad4ac0578d44b6f0d482905871efc3421fd9820a1cc
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gérer les tâches Cron pour le planificateur du Gateway.

<Tip>
Exécutez `openclaw cron --help` pour afficher l’ensemble complet des commandes. Consultez [Tâches Cron](/fr/automation/cron-jobs) pour le guide conceptuel.
</Tip>

## Créer des tâches rapidement

`openclaw cron create` est un alias de `openclaw cron add`. Pour les nouvelles tâches, placez d’abord le planning, puis le prompt :

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Utilisez `--webhook <url>` lorsque la tâche doit envoyer le payload terminé en POST au lieu de le livrer à une cible de chat :

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Utilisez `--command` pour les tâches déterministes de style shell qui doivent s’exécuter dans OpenClaw cron sans démarrer une exécution isolée d’agent/modèle :

<Note>
Les tâches Cron de commande sont des automatisations Gateway rédigées par un administrateur. Leur création, modification,
suppression ou exécution manuelle nécessite `operator.admin` ; l’exécution planifiée
s’exécute ensuite dans le processus Gateway, et non comme un appel d’outil agent `tools.exec`.
`tools.exec.*` et les approbations exec continuent de régir les outils exec visibles par le modèle.
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

`--command <shell>` stocke `argv: ["sh", "-lc", <shell>]`. Utilisez `--command-argv '["node","scripts/report.mjs"]'` pour une exécution argv exacte. Les tâches de commande capturent stdout/stderr, enregistrent l’historique Cron normal et acheminent la sortie via les mêmes modes de livraison `announce`, `webhook` ou `none` que les tâches isolées. Une commande qui imprime uniquement `NO_REPLY` est supprimée.

## Sessions

`--session` accepte `main`, `isolated`, `current` ou `session:<id>`.

<AccordionGroup>
  <Accordion title="Clés de session">
    - `main` se lie à la session principale de l’agent.
    - `isolated` crée une nouvelle transcription et un identifiant de session pour chaque exécution.
    - `current` se lie à la session active au moment de la création.
    - `session:<id>` épingle une clé de session persistante explicite.

  </Accordion>
  <Accordion title="Sémantique des sessions isolées">
    Les exécutions isolées réinitialisent le contexte de conversation ambiant. Le routage de canal et de groupe, la politique d’envoi/file d’attente, l’élévation, l’origine et la liaison d’exécution ACP sont réinitialisés pour la nouvelle exécution. Les préférences sûres ainsi que les remplacements explicites de modèle ou d’authentification sélectionnés par l’utilisateur peuvent être conservés entre les exécutions.
  </Accordion>
</AccordionGroup>

## Livraison

`openclaw cron list` et `openclaw cron show <job-id>` prévisualisent la route de livraison résolue. Pour `channel: "last"`, l’aperçu indique si la route est résolue depuis la session principale ou courante, ou si elle échouera en mode fermé.

Les cibles préfixées par fournisseur peuvent désambiguïser les canaux d’annonce non résolus. Par exemple, `to: "telegram:123"` sélectionne Telegram lorsque `delivery.channel` est omis ou vaut `last`. Seuls les préfixes annoncés par le Plugin chargé sont des sélecteurs de fournisseur. Si `delivery.channel` est explicite, le préfixe doit correspondre à ce canal ; `channel: "whatsapp"` avec `to: "telegram:123"` est rejeté. Les préfixes de service comme `imessage:` et `sms:` restent une syntaxe de cible appartenant au canal.

<Note>
Les tâches `cron add` isolées utilisent par défaut la livraison `--announce`. Utilisez `--no-deliver` pour conserver la sortie en interne. `--deliver` reste un alias obsolète de `--announce`.
</Note>

### Propriété de la livraison

La livraison de chat Cron isolée est partagée entre l’agent et le runner :

- L’agent peut envoyer directement avec l’outil `message` lorsqu’une route de chat est disponible.
- `announce` livre en repli la réponse finale uniquement lorsque l’agent n’a pas envoyé directement à la cible résolue.
- `webhook` publie le payload terminé vers une URL.
- `none` désactive la livraison de repli du runner.

Utilisez `cron add|create --webhook <url>` ou `cron edit <job-id> --webhook <url>` pour configurer la livraison Webhook. Ne combinez pas `--webhook` avec des indicateurs de livraison de chat tels que `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` ou `--account`.

`cron edit <job-id>` peut annuler des champs individuels de routage de livraison avec `--clear-channel`, `--clear-to`, `--clear-thread-id` et `--clear-account` (chacun est rejeté lorsqu’il est combiné avec son indicateur de définition correspondant). Contrairement à `--no-deliver`, qui désactive seulement la livraison de repli du runner, ces options suppriment le champ stocké afin que la tâche résolve de nouveau cette partie de sa route depuis les valeurs par défaut.

`--announce` est la livraison de repli du runner pour la réponse finale. `--no-deliver` désactive ce repli, mais ne supprime pas l’outil `message` de l’agent lorsqu’une route de chat est disponible.

Les rappels créés depuis un chat actif conservent la cible de livraison de chat en direct pour la livraison d’annonce de repli. Les clés de session internes peuvent être en minuscules ; ne les utilisez pas comme source de vérité pour les identifiants de fournisseur sensibles à la casse, comme les identifiants de salons Matrix.

### Livraison des échecs

Les notifications d’échec sont résolues dans cet ordre :

1. `delivery.failureDestination` sur la tâche.
2. `cron.failureDestination` global.
3. La cible d’annonce principale de la tâche (lorsqu’aucune destination d’échec explicite n’est définie).

<Note>
Les tâches de session principale ne peuvent utiliser `delivery.failureDestination` que lorsque le mode de livraison principal est `webhook`. Les tâches isolées l’acceptent dans tous les modes.
</Note>

Remarque : les exécutions Cron isolées traitent les échecs d’agent au niveau de l’exécution comme des erreurs de tâche, même lorsqu’
aucun payload de réponse n’est produit ; les échecs de modèle/fournisseur incrémentent donc quand même les
compteurs d’erreurs et déclenchent les notifications d’échec.

Les tâches Cron de commande ne démarrent pas de tour d’agent isolé. Un code de sortie zéro enregistre
`ok` ; une sortie non nulle, un signal, un délai d’expiration ou un délai d’expiration sans sortie enregistre `error` et
peut déclencher le même chemin de notification d’échec.

Si une exécution isolée expire avant la première requête au modèle, `openclaw cron show`
et `openclaw cron runs` incluent une erreur propre à la phase, comme
`setup timed out before runner start` ou
`stalled before first model call (last phase: context-engine)`.
Pour les fournisseurs adossés à une CLI, le chien de garde pré-modèle reste actif jusqu’au démarrage du tour de CLI externe ; les blocages de recherche de session, hook, authentification, prompt et configuration CLI sont donc
signalés comme des échecs Cron pré-modèle.

## Planification

### Tâches ponctuelles

`--at <datetime>` planifie une exécution ponctuelle. Les dates-heures sans décalage sont traitées comme UTC, sauf si vous passez aussi `--tz <iana>`, qui interprète l’heure murale dans le fuseau horaire donné.

<Note>
Les tâches ponctuelles sont supprimées après réussite par défaut. Utilisez `--keep-after-run` pour les conserver.
</Note>

### Tâches récurrentes

Les tâches récurrentes utilisent un backoff de nouvelle tentative exponentiel après des erreurs consécutives : 30s, 1m, 5m, 15m, 60m. Le planning revient à la normale après la prochaine exécution réussie.

Les exécutions ignorées sont suivies séparément des erreurs d’exécution. Elles n’affectent pas le backoff de nouvelle tentative, mais `openclaw cron edit <job-id> --failure-alert-include-skipped` peut inclure les alertes d’échec dans les notifications répétées d’exécutions ignorées.

Pour les tâches isolées qui ciblent un fournisseur de modèle local configuré, cron exécute un précontrôle léger du fournisseur avant de démarrer le tour d’agent. Les fournisseurs `api: "ollama"` en local loopback, réseau privé et `.local` sont sondés sur `/api/tags` ; les fournisseurs locaux compatibles OpenAI comme vLLM, SGLang et LM Studio sont sondés sur `/models`. Si le point de terminaison est inaccessible, l’exécution est enregistrée comme `skipped` et retentée lors d’un planning ultérieur ; les points de terminaison morts correspondants sont mis en cache pendant 5 minutes pour éviter que de nombreuses tâches ne martèlent le même serveur local.

Remarque : les tâches Cron, l’état d’exécution en attente et l’historique des exécutions résident dans la base de données d’état SQLite partagée. Les anciens fichiers `jobs.json`, `jobs-state.json` et `runs/*.jsonl` sont importés une fois, puis renommés avec un suffixe `.migrated`. Après l’importation, modifiez les plannings avec `openclaw cron add|edit|remove` plutôt qu’en modifiant des fichiers JSON.

### Exécutions manuelles

`openclaw cron run <job-id>` force l’exécution par défaut et retourne dès que l’exécution manuelle est mise en file d’attente. Les réponses réussies incluent `{ ok: true, enqueued: true, runId }`. Utilisez le `runId` retourné pour inspecter le résultat ultérieur :

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Ajoutez `--wait` lorsqu’un script doit bloquer jusqu’à ce que cette exécution mise en file exacte enregistre un statut terminal :

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Avec `--wait`, la CLI appelle toujours d’abord `cron.run`, puis interroge `cron.runs` pour le `runId` retourné. La commande quitte avec `0` uniquement lorsque l’exécution se termine avec le statut `ok`. Elle quitte avec un code non nul lorsque l’exécution se termine avec `error` ou `skipped`, lorsque la réponse du Gateway n’inclut pas de `runId`, ou lorsque `--wait-timeout` expire. `--poll-interval` doit être supérieur à zéro.

<Note>
Utilisez `--due` lorsque vous voulez que la commande manuelle ne s’exécute que si la tâche est actuellement due. Si `--due --wait` ne met pas d’exécution en file d’attente, la commande retourne la réponse normale sans exécution au lieu d’interroger.
</Note>

## Modèles

`cron add|edit --model <ref>` sélectionne un modèle autorisé pour la tâche. `cron add|edit --fallbacks <list>` définit les modèles de repli par tâche, par exemple `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5` ; passez `--fallbacks ""` pour une exécution stricte sans replis. `cron edit <job-id> --clear-fallbacks` supprime le remplacement de repli par tâche. `cron edit <job-id> --clear-model` supprime le remplacement de modèle par tâche afin que la tâche suive la priorité normale de sélection de modèle Cron (un remplacement de session Cron stocké s’il est présent, sinon le modèle d’agent/par défaut) ; il ne peut pas être combiné avec `--model`. `cron add|edit --thinking <level>` définit un remplacement de thinking par tâche ; `cron edit <job-id> --clear-thinking` le supprime afin que la tâche suive la priorité normale du thinking Cron, et il ne peut pas être combiné avec `--thinking`.

<Warning>
Si le modèle n’est pas autorisé ou ne peut pas être résolu, cron fait échouer l’exécution avec une erreur de validation explicite au lieu de revenir à la sélection de modèle de l’agent ou par défaut de la tâche.
</Warning>

Le `--model` de Cron est un **principal de tâche**, pas un remplacement `/model` de session de chat. Cela signifie :

- Les replis de modèle configurés s’appliquent toujours lorsque le modèle de tâche sélectionné échoue.
- Le payload par tâche `fallbacks` remplace la liste de replis configurée lorsqu’il est présent.
- Une liste de replis par tâche vide (`--fallbacks ""` ou `fallbacks: []` dans le payload/API de la tâche) rend l’exécution Cron stricte.
- Lorsqu’une tâche a `--model` mais qu’aucune liste de replis n’est configurée, OpenClaw transmet un remplacement de repli vide explicite afin que le modèle principal de l’agent ne soit pas ajouté comme cible de nouvelle tentative cachée.
- Les contrôles de prévol du fournisseur local parcourent les replis configurés avant de marquer une exécution Cron comme `skipped`.

`openclaw doctor` signale les tâches qui ont déjà `payload.model` défini, y compris les décomptes par espace de noms de fournisseur et les incompatibilités avec `agents.defaults.model`. Utilisez ce contrôle lorsque le comportement d’authentification, de fournisseur ou de facturation semble différent entre le chat en direct et les tâches planifiées.

### Priorité des modèles Cron isolés

Cron isolé résout le modèle actif dans cet ordre :

1. Remplacement du hook Gmail.
2. `--model` par tâche.
3. Remplacement de modèle de session Cron stocké (lorsque l’utilisateur en a sélectionné un).
4. Sélection de modèle d’agent ou par défaut.

### Mode rapide

Le mode rapide de Cron isolé suit la sélection de modèle en direct résolue. La configuration du modèle `params.fastMode` s’applique par défaut, mais un remplacement de session `fastMode` stocké prime toujours sur la configuration. Lorsque le mode résolu est `auto`, le seuil utilise la valeur `params.fastAutoOnSeconds` du modèle sélectionné, avec une valeur par défaut de 60 secondes.

### Nouvelles tentatives de changement de modèle en direct

Si une exécution isolée lève `LiveSessionModelSwitchError`, cron persiste le fournisseur et le modèle basculés (ainsi que le remplacement de profil d’authentification basculé lorsqu’il est présent) pour l’exécution active avant de réessayer. La boucle de nouvelle tentative externe est limitée à deux nouvelles tentatives de bascule après la tentative initiale, puis abandonne au lieu de boucler indéfiniment.

## Sortie d’exécution et refus

### Suppression des accusés de réception obsolètes

Les tours Cron isolés suppriment les réponses obsolètes qui ne sont que des accusés de réception. Si le premier résultat est seulement une mise à jour de statut intermédiaire et qu’aucune exécution de sous-agent descendante n’est responsable de la réponse finale, cron redemande une fois le résultat réel avant la livraison.

### Suppression silencieuse des jetons

Si une exécution cron isolée ne renvoie que le jeton silencieux (`NO_REPLY` ou `no_reply`), cron supprime à la fois la livraison sortante directe et le chemin de résumé en file d’attente de secours, donc rien n’est publié dans le chat.

### Refus structurés

Les exécutions cron isolées utilisent les métadonnées structurées de refus d’exécution provenant de l’exécution intégrée comme signal de refus faisant autorité. Elles honorent aussi les enveloppes `UNAVAILABLE` de l’hôte de nœud lorsque le message d’erreur structuré imbriqué commence par `SYSTEM_RUN_DENIED` ou `INVALID_REQUEST`.

Cron ne classe pas la prose de sortie finale ni les phrases de refus ressemblant à une approbation comme des refus, sauf si l’exécution intégrée fournit aussi des métadonnées structurées de refus ; ainsi, le texte ordinaire de l’assistant n’est pas traité comme une commande bloquée.

`cron list` et l’historique des exécutions affichent la raison du refus au lieu de signaler une commande bloquée comme `ok`.

## Rétention

La rétention et l’élagage sont contrôlés dans la configuration :

- `cron.sessionRetention` (par défaut `24h`) élague les sessions d’exécution isolée terminées.
- `cron.runLog.keepLines` élague les lignes conservées de l’historique des exécutions SQLite par tâche. `cron.runLog.maxBytes` reste accepté pour compatibilité avec les anciens journaux d’exécution adossés à des fichiers.

## Migration d’anciennes tâches

<Note>
Si vous avez des tâches cron datant d’avant le format actuel de livraison et de stockage, exécutez `openclaw doctor --fix`. Doctor normalise les anciens champs cron (`jobId`, `schedule.cron`, les champs de livraison de premier niveau dont l’ancien `threadId`, les alias de livraison `provider` de charge utile) et migre les tâches de secours Webhook avec `notify: true` de `cron.webhook` vers une livraison Webhook explicite. Les tâches qui annoncent déjà dans un chat conservent cette livraison et reçoivent une destination Webhook d’achèvement. Lorsque `cron.webhook` n’est pas défini, le marqueur inerte de premier niveau `notify` est retiré pour les tâches sans cible de migration (la livraison existante est conservée telle quelle), de sorte que `doctor --fix` ne continue plus à émettre des avertissements à leur sujet.
</Note>

## Modifications courantes

Mettre à jour les paramètres de livraison sans modifier le message :

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Désactiver la livraison pour une tâche isolée :

```bash
openclaw cron edit <job-id> --no-deliver
```

Activer le contexte d’amorçage léger pour une tâche isolée :

```bash
openclaw cron edit <job-id> --light-context
```

Annoncer dans un canal spécifique :

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Annoncer dans un sujet de forum Telegram :

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Créer une tâche isolée avec un contexte d’amorçage léger :

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` s’applique uniquement aux tâches de tour d’agent isolées. Pour les exécutions cron, le mode léger garde le contexte d’amorçage vide au lieu d’injecter l’ensemble complet d’amorçage de l’espace de travail.

Créer une tâche de commande avec argv, cwd, env, stdin et limites de sortie exacts :

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

`openclaw cron list` affiche par défaut toutes les tâches correspondantes. Passez `--agent <id>` pour afficher uniquement les tâches dont l’identifiant d’agent normalisé effectif correspond ; les tâches sans identifiant d’agent stocké comptent comme l’agent par défaut configuré.

`openclaw cron get <job-id>` renvoie directement le JSON de tâche stocké. Utilisez `cron show <job-id>` lorsque vous voulez la vue lisible par l’humain avec l’aperçu de la route de livraison.

`cron list --json` et `cron show <job-id> --json` incluent un champ `status` de premier niveau sur chaque tâche, calculé à partir de `enabled`, `state.runningAtMs` et `state.lastRunStatus`. Valeurs : `disabled`, `running`, `ok`, `error`, `skipped` ou `idle`. Cela reflète la colonne d’état lisible par l’humain afin que les outils externes puissent lire l’état des tâches sans le recalculer.

Les entrées `cron runs` incluent des diagnostics de livraison avec la cible cron prévue, la cible résolue, les envois d’outils de message, l’utilisation du secours et l’état livré.

Reciblage d’agent et de session :

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` avertit lorsque `--agent` est omis sur les tâches de tour d’agent et se rabat sur l’agent par défaut (`main`). Passez `--agent <id>` à la création pour épingler un agent spécifique.

Ajustements de livraison :

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Connexe

- [Référence CLI](/fr/cli)
- [Tâches planifiées](/fr/automation/cron-jobs)
