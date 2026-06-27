---
read_when:
    - Vous rencontrez des problèmes de connectivité/d’authentification et souhaitez des corrections guidées
    - Vous avez effectué une mise à jour et souhaitez une vérification rapide
summary: Référence CLI pour `openclaw doctor` (contrôles de santé + réparations guidées)
title: Diagnostic
x-i18n:
    generated_at: "2026-06-27T17:18:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf7c07cd39053fce7efa81d968ef0f2666f6f5331581e72d2684843519c63b43
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Contrôles d’état + correctifs rapides pour le Gateway et les canaux.

Connexe :

- Dépannage : [Dépannage](/fr/gateway/troubleshooting)
- Audit de sécurité : [Sécurité](/fr/gateway/security)

## Pourquoi l’utiliser

`openclaw doctor` est la surface de santé d’OpenClaw. Utilisez-la lorsque le Gateway,
les canaux, les Plugins, les Skills, le routage de modèles, l’état local ou les migrations de configuration ne
se comportent pas comme prévu et que vous voulez une commande capable d’expliquer ce qui ne
va pas.

Doctor a trois postures :

| Posture | Commande                 | Comportement                                                                   |
| ------- | ------------------------ | ------------------------------------------------------------------------------- |
| Inspecter | `openclaw doctor`        | Contrôles orientés humain et invites guidées.                                  |
| Réparer | `openclaw doctor --fix`  | Applique les réparations prises en charge, avec des invites sauf si la réparation non interactive est sûre. |
| Lint    | `openclaw doctor --lint` | Résultats structurés en lecture seule pour la CI, les précontrôles et les portes de revue. |

Préférez `--lint` lorsque l’automatisation a besoin d’un résultat stable. Préférez `--fix` lorsqu’un
opérateur humain veut intentionnellement que doctor modifie la configuration ou l’état.

## Exemples

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
```

Pour les permissions propres à un canal, utilisez les sondes de canal plutôt que `doctor` :

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

La sonde ciblée des capacités Discord signale les permissions effectives du bot dans le canal ; la sonde d’état audite les canaux Discord configurés et les cibles de connexion automatique vocale.

## Options

- `--no-workspace-suggestions` : désactiver les suggestions de mémoire/recherche de l’espace de travail
- `--yes` : accepter les valeurs par défaut sans invite
- `--repair` : appliquer les réparations non liées au service recommandées sans invite ; les installations et réécritures du service Gateway nécessitent toujours une confirmation interactive ou des commandes Gateway explicites
- `--fix` : alias de `--repair`
- `--force` : appliquer des réparations agressives, y compris l’écrasement de la configuration de service personnalisée si nécessaire
- `--non-interactive` : exécuter sans invites ; migrations sûres et réparations non liées au service uniquement
- `--generate-gateway-token` : générer et configurer un jeton Gateway
- `--allow-exec` : autoriser doctor à exécuter les SecretRefs exec configurés lors de la vérification des secrets
- `--deep` : analyser les services système pour trouver des installations Gateway supplémentaires et signaler les récents transferts de redémarrage du superviseur Gateway
- `--lint` : exécuter les contrôles d’état modernisés en mode lecture seule et émettre des diagnostics
- `--post-upgrade` : exécuter les sondes de compatibilité des Plugins après mise à niveau ; émet les résultats vers stdout ; se termine avec le code 1 si des résultats de niveau error sont présents
- `--json` : avec `--lint`, émettre des résultats JSON plutôt qu’une sortie humaine ; avec `--post-upgrade`, émettre une enveloppe JSON lisible par machine (`{ probesRun, findings }`)
- `--severity-min <level>` : avec `--lint`, ignorer les résultats inférieurs à `info`, `warning` ou `error`
- `--all` : avec `--lint`, exécuter tous les contrôles enregistrés, y compris les contrôles optionnels exclus de l’ensemble d’automatisation par défaut
- `--skip <id>` : avec `--lint`, ignorer un id de contrôle ; répéter pour en ignorer plusieurs
- `--only <id>` : avec `--lint`, exécuter uniquement un id de contrôle ; répéter pour exécuter un petit ensemble sélectionné

## Mode Lint

`openclaw doctor --lint` est la posture d’automatisation en lecture seule pour les contrôles doctor.
Elle utilise le chemin de contrôle d’état structuré, ne lance aucune invite et ne répare
ni ne réécrit la configuration/l’état. Utilisez-la dans la CI, les scripts de précontrôle et les workflows
de revue lorsque vous voulez des résultats lisibles par machine plutôt que des invites de réparation guidées.
Les options de sortie lint comme `--json`, `--severity-min`, `--all`, `--only` et `--skip`
ne sont acceptées qu’avec `--lint`.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
```

La sortie humaine est compacte :

```text
doctor --lint: ran 6 check(s), 1 finding(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode is unset; gateway start will be blocked.
    fix: Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`.
```

La sortie JSON est la surface de script pour les exécutions lint :

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode is unset; gateway start will be blocked.",
      "path": "gateway.mode",
      "fixHint": "Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`."
    }
  ]
}
```

Comportement de sortie :

- `0` : aucun résultat au niveau ou au-dessus du seuil de gravité sélectionné
- `1` : au moins un résultat atteint le seuil sélectionné
- `2` : échec de commande/runtime avant que les résultats lint puissent être produits

`--severity-min` contrôle à la fois les résultats visibles et le seuil de sortie. Par
exemple, `openclaw doctor --lint --severity-min error` peut n’afficher aucun résultat et
sortir avec `0` même lorsque des résultats `info` ou `warning` de gravité inférieure existent.

`--all` contrôle les contrôles sélectionnés avant le filtrage par gravité. L’exécution
lint par défaut est la porte d’automatisation stable et exclut les contrôles qui sont
intentionnellement optionnels parce qu’ils sont profonds, historiques ou plus susceptibles de
faire remonter des résidus hérités réparables. Utilisez `--all` lorsque vous voulez l’inventaire lint
complet sans lister chaque id de contrôle. `--only <id>` reste le sélecteur le plus précis
et peut exécuter n’importe quel contrôle enregistré par id.

## Contrôles d’état structurés

Les contrôles doctor modernes utilisent un petit contrat structuré :

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` alimente `doctor --lint`. `repair()` est facultatif et n’est pris en compte que
par `doctor --fix` / `doctor --repair`. Les contrôles qui n’ont pas migré vers cette
forme continuent d’utiliser le flux de contribution doctor hérité.

La séparation est intentionnelle : `detect()` possède le diagnostic, tandis que `repair()` possède
le signalement de ce qu’il a modifié ou modifierait. Les contextes de réparation peuvent porter des
requêtes `dryRun`/`diff`, et les résultats de réparation peuvent renvoyer des `diffs` structurés pour
les modifications de configuration/fichier ainsi que des `effects` pour les effets de bord de service, processus, package, état ou autres.
Cela permet aux contrôles convertis d’évoluer vers `doctor --fix --dry-run`
et le rapport de diff sans déplacer la planification des mutations dans `detect()`.

`repair()` signale s’il a tenté la réparation demandée avec `status:
"repaired" | "skipped" | "failed"`. L’absence de statut signifie `repaired`, donc les contrôles de
réparation simples n’ont besoin de renvoyer que les modifications. Lorsque repair renvoie `skipped` ou
`failed`, doctor signale la raison et n’exécute pas la validation pour ce contrôle.

Après une réparation structurée réussie, doctor réexécute `detect()` avec les
résultats réparés comme périmètre. Les contrôles peuvent utiliser les résultats sélectionnés, les chemins ou les valeurs `ocPath`
pour une validation ciblée. Si le résultat est toujours présent, doctor signale un
avertissement de réparation au lieu de traiter le changement comme silencieusement terminé.

Un résultat inclut :

| Champ             | Objectif                                               |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | Id stable pour les filtres skip/only et les allowlists CI. |
| `severity`        | `info`, `warning` ou `error`.                         |
| `message`         | Énoncé du problème lisible par un humain.              |
| `path`            | Chemin de configuration, fichier ou logique si disponible. |
| `line` / `column` | Emplacement source si disponible.                      |
| `ocPath`          | Adresse `oc://` précise lorsqu’un contrôle peut en pointer une. |
| `fixHint`         | Action opérateur suggérée ou résumé de réparation.     |

Les contrôles doctor de cœur modernisés restent rattachés à la contribution doctor ordonnée
qui possède leur comportement humain `doctor` / `doctor --fix`. Le registre partagé de
santé structurée est le point d’extension : les contrôles groupés et adossés à des Plugins s’exécutent
après les contrôles doctor de cœur une fois que leur package propriétaire les enregistre dans le chemin
de commande actif. Le sous-chemin `openclaw/plugin-sdk/health` expose le même
contrat pour ces consommateurs d’extension.

## Sélection des contrôles

Utilisez `--only` et `--skip` lorsqu’un workflow veut une porte ciblée :

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` et `--skip` acceptent des ids de contrôle complets et peuvent être répétés. Si un id `--only`
n’est pas enregistré, aucun contrôle ne s’exécute pour cet id ; utilisez les champs `checksRun`
et `checksSkipped` de la commande pour vérifier qu’une porte ciblée sélectionne les contrôles que vous
attendez.

## Mode post-mise à niveau

`openclaw doctor --post-upgrade` exécute des sondes de compatibilité des Plugins destinées à être
enchaînées après une build ou une mise à niveau. Les résultats sont émis vers stdout ; la commande
se termine avec le code 1 si un résultat a `level: "error"`. Ajoutez `--json` pour recevoir une
enveloppe lisible par machine (`{ probesRun, findings }`) adaptée à la CI, au Skill communautaire
`fork-upgrade` et aux autres outils smoke après mise à niveau. Si l’index des Plugins installés est manquant ou mal formé, le mode JSON émet tout de même cette
enveloppe avec un résultat d’erreur `plugin.index_unavailable`.

Notes :

- En mode Nix (`OPENCLAW_NIX_MODE=1`), les vérifications doctor en lecture seule fonctionnent toujours, mais `doctor --fix`, `doctor --repair`, `doctor --yes` et `doctor --generate-gateway-token` sont désactivés, car `openclaw.json` est immuable. Modifiez plutôt la source Nix de cette installation ; pour nix-openclaw, utilisez le [démarrage rapide](https://github.com/openclaw/nix-openclaw#quick-start) centré sur l’agent.
- Les invites interactives (comme les corrections keychain/OAuth) ne s’exécutent que lorsque stdin est un TTY et que `--non-interactive` n’est **pas** défini. Les exécutions headless (cron, Telegram, sans terminal) ignorent les invites.
- Performance : les exécutions non interactives de `doctor` ignorent le chargement anticipé des plugins afin que les contrôles d’intégrité headless restent rapides. Les sessions doctor interactives chargent toujours les surfaces de plugin nécessaires à l’ancien flux d’intégrité et de réparation.
- `--lint` est plus strict que `--non-interactive` : il est toujours en lecture seule, ne demande jamais de confirmation et n’applique jamais les migrations sûres. Exécutez `doctor --fix` ou `doctor --repair` lorsque vous voulez que doctor apporte des modifications.
- Par défaut, doctor n’exécute pas les SecretRefs `exec` lors de la vérification des secrets. Utilisez `openclaw doctor --allow-exec` ou `openclaw doctor --lint --allow-exec` uniquement lorsque vous voulez intentionnellement que doctor exécute ces résolveurs de secrets configurés.
- `--fix` (alias de `--repair`) écrit une sauvegarde dans `~/.openclaw/openclaw.json.bak` et supprime les clés de configuration inconnues, en listant chaque suppression.
- Les contrôles d’intégrité modernisés peuvent exposer un chemin `repair()` pour `doctor --fix` ; les contrôles qui n’en exposent pas continuent de passer par le flux de réparation doctor existant.
- `doctor --fix --non-interactive` signale les définitions de service Gateway manquantes ou obsolètes, mais ne les installe pas ni ne les réécrit en dehors du mode de réparation de mise à jour. Exécutez `openclaw gateway install` pour un service manquant, ou `openclaw gateway install --force` lorsque vous voulez intentionnellement remplacer le lanceur.
- Les contrôles d’intégrité de l’état détectent désormais les fichiers de transcription orphelins dans le répertoire des sessions. Leur archivage sous la forme `.deleted.<timestamp>` nécessite une confirmation interactive ; `--fix`, `--yes` et les exécutions headless les laissent en place.
- Doctor analyse aussi `~/.openclaw/cron/jobs.json` (ou `cron.store`) à la recherche d’anciennes formes de tâches cron et les réécrit avant d’importer les lignes canoniques dans SQLite.
- Doctor signale les tâches cron avec des remplacements explicites `payload.model`, y compris le nombre par espace de noms de fournisseur et les incohérences avec `agents.defaults.model`, afin que les tâches planifiées qui n’héritent pas du modèle par défaut soient visibles lors des investigations d’authentification ou de facturation.
- Sous Linux, doctor avertit lorsque la crontab de l’utilisateur exécute encore l’ancien `~/.openclaw/bin/ensure-whatsapp.sh` ; ce script n’est plus maintenu et peut consigner de fausses pannes de Gateway WhatsApp lorsque cron ne dispose pas de l’environnement du bus utilisateur systemd.
- Lorsque WhatsApp est activé, doctor vérifie la présence d’une boucle d’événements Gateway dégradée alors que des clients `openclaw-tui` locaux sont encore en cours d’exécution. `doctor --fix` arrête uniquement les clients TUI locaux vérifiés afin que les réponses WhatsApp ne soient pas mises en file derrière d’anciennes boucles d’actualisation TUI.
- Doctor réécrit les anciennes références de modèle `openai-codex/*` vers les références canoniques `openai/*` pour les modèles principaux, les solutions de repli, les modèles de génération d’images/vidéos, les remplacements heartbeat/sous-agent/compaction, les hooks, les remplacements de modèle de canal et les anciens verrouillages de route de session. `--fix` migre aussi les anciens profils d’authentification `openai-codex:*` et les entrées `auth.order.openai-codex` vers `openai:*`, déplace l’intention Codex vers des entrées `agentRuntime.id: "codex"` limitées au fournisseur/modèle, supprime les anciens verrouillages d’exécution d’agent entier/session et conserve les références d’agent OpenAI réparées sur le routage d’authentification Codex au lieu d’une authentification directe par clé API OpenAI.
- Doctor nettoie l’ancien état de préparation des dépendances de plugins créé par d’anciennes versions d’OpenClaw et relie à nouveau le paquet hôte `openclaw` pour les plugins npm gérés qui le déclarent comme dépendance pair. Il répare aussi les plugins téléchargeables manquants référencés par la configuration, tels que `plugins.entries`, les canaux configurés, les paramètres de fournisseur/recherche configurés ou les environnements d’exécution d’agent configurés. Pendant les mises à jour de paquets, doctor ignore la réparation des plugins par le gestionnaire de paquets jusqu’à ce que le remplacement du paquet soit terminé ; relancez ensuite `openclaw doctor --fix` si un plugin configuré doit encore être récupéré. Si le téléchargement échoue, doctor signale l’erreur d’installation et conserve l’entrée de plugin configurée pour la prochaine tentative de réparation.
- Doctor répare les configurations de plugin obsolètes en supprimant les identifiants de plugin manquants de `plugins.allow`/`plugins.deny`/`plugins.entries`, ainsi que les configurations de canal pendantes correspondantes, les cibles heartbeat et les remplacements de modèle de canal lorsque la découverte des plugins est saine.
- Doctor met en quarantaine les configurations de plugin invalides en désactivant l’entrée `plugins.entries.<id>` concernée et en supprimant sa charge utile `config` invalide. Le démarrage du Gateway ignore déjà uniquement ce mauvais plugin, afin que les autres plugins et canaux puissent continuer à fonctionner.
- Définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un autre superviseur possède le cycle de vie du gateway. Doctor signale toujours l’intégrité du gateway/service et applique les réparations hors service, mais ignore l’installation/le démarrage/le redémarrage/l’amorçage du service et le nettoyage des anciens services.
- Sous Linux, doctor ignore les unités systemd supplémentaires inactives de type gateway et ne réécrit pas les métadonnées de commande/point d’entrée pour un service Gateway systemd en cours d’exécution pendant la réparation. Arrêtez d’abord le service ou utilisez `openclaw gateway install --force` lorsque vous voulez intentionnellement remplacer le lanceur actif.
- Doctor migre automatiquement l’ancienne configuration Talk plate (`talk.voiceId`, `talk.modelId` et éléments associés) vers `talk.provider` + `talk.providers.<provider>`.
- Les exécutions répétées de `doctor --fix` ne signalent/n’appliquent plus la normalisation Talk lorsque la seule différence est l’ordre des clés d’objet.
- Doctor inclut un contrôle de préparation à la recherche mémoire et peut recommander `openclaw configure --section model` lorsque les identifiants d’embedding sont manquants.
- Doctor avertit lorsqu’aucun propriétaire de commande n’est configuré. Le propriétaire de commande est le compte opérateur humain autorisé à exécuter les commandes réservées au propriétaire et à approuver les actions dangereuses. L’appairage par MP permet seulement à quelqu’un de parler au bot ; si vous avez approuvé un expéditeur avant l’existence de l’amorçage du premier propriétaire, définissez explicitement `commands.ownerAllowFrom`.
- Doctor signale une note d’information lorsque des agents en mode Codex sont configurés et que des ressources personnelles Codex CLI existent dans le répertoire Codex de l’opérateur. Les lancements locaux du serveur d’application Codex utilisent des répertoires isolés par agent ; installez donc d’abord le plugin Codex si nécessaire, puis utilisez `openclaw migrate plan codex` pour inventorier les ressources à promouvoir délibérément.
- Doctor supprime l’ancien `plugins.entries.codex.config.codexDynamicToolsProfile` ; le serveur d’application Codex garde toujours les outils d’espace de travail natifs Codex en natif.
- Doctor avertit lorsque les Skills autorisées pour l’agent par défaut sont indisponibles dans l’environnement d’exécution actuel, car des binaires, variables d’environnement, configurations ou exigences d’OS sont manquants. `doctor --fix` peut désactiver ces skills indisponibles avec `skills.entries.<skill>.enabled=false` ; installez/configurez plutôt l’exigence manquante lorsque vous voulez garder la skill active.
- Si le mode sandbox est activé mais que Docker est indisponible, doctor signale un avertissement à fort signal avec correction (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Si d’anciens fichiers de registre sandbox ou répertoires de fragments sont présents (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` ou `~/.openclaw/sandbox/browsers/`), doctor les signale ; `openclaw doctor --fix` migre les entrées valides vers SQLite et met en quarantaine les anciens fichiers invalides.
- Si `gateway.auth.token`/`gateway.auth.password` sont gérés par SecretRef et indisponibles dans le chemin de commande actuel, doctor signale un avertissement en lecture seule et n’écrit pas d’identifiants de secours en clair. Pour les SecretRefs adossées à exec, doctor ignore l’exécution sauf si `--allow-exec` est présent.
- Si l’inspection des SecretRef de canal échoue dans un chemin de correction, doctor continue et signale un avertissement au lieu de quitter prématurément.
- Après les migrations de répertoire d’état, doctor avertit lorsque les comptes Telegram ou Discord par défaut activés dépendent d’un repli par variable d’environnement et que `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` est indisponible pour le processus doctor.
- La résolution automatique des noms d’utilisateur Telegram `allowFrom` (`doctor --fix`) nécessite un jeton Telegram résoluble dans le chemin de commande actuel. Si l’inspection du jeton est indisponible, doctor signale un avertissement et ignore la résolution automatique pour ce passage.

## macOS : remplacements d’environnement `launchctl`

Si vous avez précédemment exécuté `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), cette valeur remplace votre fichier de configuration et peut provoquer des erreurs « non autorisé » persistantes.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Associé

- [Référence CLI](/fr/cli)
- [Doctor Gateway](/fr/gateway/doctor)
