---
read_when:
    - Vous rencontrez des problèmes de connectivité/d’authentification et souhaitez des correctifs guidés
    - Vous avez effectué une mise à jour et souhaitez une vérification rapide
summary: Référence CLI pour `openclaw doctor` (contrôles d’intégrité + réparations guidées)
title: Diagnostic
x-i18n:
    generated_at: "2026-05-07T13:14:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7683a974eb9406e5ca071612c96c7db05247a69e253ef4293c57e7707aa5fd4
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Contrôles de santé + correctifs rapides pour le Gateway et les canaux.

Liens associés :

- Dépannage : [Dépannage](/fr/gateway/troubleshooting)
- Audit de sécurité : [Sécurité](/fr/gateway/security)

## Exemples

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

Pour les permissions propres aux canaux, utilisez les sondes de canal au lieu de `doctor` :

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

La sonde ciblée des capacités Discord signale les permissions effectives du bot sur le canal ; la sonde de statut audite les canaux Discord configurés et les cibles de jonction automatique vocale.

## Options

- `--no-workspace-suggestions` : désactiver les suggestions de mémoire/recherche de l’espace de travail
- `--yes` : accepter les valeurs par défaut sans demande de confirmation
- `--repair` : appliquer les réparations non liées au service recommandées sans demande de confirmation ; les installations et réécritures du service Gateway nécessitent toujours une confirmation interactive ou des commandes Gateway explicites
- `--fix` : alias de `--repair`
- `--force` : appliquer des réparations agressives, y compris l’écrasement de la configuration de service personnalisée si nécessaire
- `--non-interactive` : exécuter sans invites ; migrations sûres et réparations non liées au service uniquement
- `--generate-gateway-token` : générer et configurer un jeton de Gateway
- `--deep` : analyser les services système pour trouver des installations Gateway supplémentaires et signaler les transferts récents de redémarrage du superviseur Gateway

Remarques :

- En mode Nix (`OPENCLAW_NIX_MODE=1`), les contrôles doctor en lecture seule fonctionnent toujours, mais `doctor --fix`, `doctor --repair`, `doctor --yes` et `doctor --generate-gateway-token` sont désactivés, car `openclaw.json` est immuable. Modifiez plutôt la source Nix de cette installation ; pour nix-openclaw, utilisez le [Démarrage rapide](https://github.com/openclaw/nix-openclaw#quick-start) orienté agent.
- Les invites interactives (comme les correctifs keychain/OAuth) ne s’exécutent que lorsque stdin est un TTY et que `--non-interactive` n’est **pas** défini. Les exécutions sans interface (cron, Telegram, sans terminal) ignoreront les invites.
- Performances : les exécutions non interactives de `doctor` ignorent le chargement anticipé des Plugins afin que les contrôles de santé sans interface restent rapides. Les sessions interactives chargent toujours complètement les Plugins lorsqu’un contrôle a besoin de leur contribution.
- `--fix` (alias de `--repair`) écrit une sauvegarde dans `~/.openclaw/openclaw.json.bak` et supprime les clés de configuration inconnues, en listant chaque suppression.
- `doctor --fix --non-interactive` signale les définitions de service Gateway manquantes ou obsolètes, mais ne les installe ni ne les réécrit en dehors du mode de réparation de mise à jour. Exécutez `openclaw gateway install` pour un service manquant, ou `openclaw gateway install --force` lorsque vous voulez intentionnellement remplacer le lanceur.
- Les contrôles d’intégrité de l’état détectent désormais les fichiers de transcription orphelins dans le répertoire des sessions. Leur archivage sous la forme `.deleted.<timestamp>` nécessite une confirmation interactive ; `--fix`, `--yes` et les exécutions sans interface les laissent en place.
- Doctor analyse également `~/.openclaw/cron/jobs.json` (ou `cron.store`) pour repérer les anciens formats de tâches cron et peut les réécrire sur place avant que le planificateur doive les normaliser automatiquement à l’exécution.
- Sous Linux, doctor avertit lorsque le crontab de l’utilisateur exécute encore l’ancien `~/.openclaw/bin/ensure-whatsapp.sh` ; ce script n’est plus maintenu et peut journaliser de fausses pannes du Gateway WhatsApp lorsque cron n’a pas l’environnement du bus utilisateur systemd.
- Lorsque WhatsApp est activé, doctor vérifie s’il existe une boucle d’événements Gateway dégradée avec des clients `openclaw-tui` locaux toujours en cours d’exécution. `doctor --fix` arrête uniquement les clients TUI locaux vérifiés afin que les réponses WhatsApp ne soient pas mises en file derrière des boucles d’actualisation TUI obsolètes.
- Doctor réécrit les références de modèles héritées `openai-codex/*` en références canoniques `openai/*` dans les modèles principaux, les solutions de repli, les remplacements heartbeat/sous-agent/compaction, les hooks, les remplacements de modèle par canal et les anciennes épingles de routage de session. `--fix` sélectionne `agentRuntime.id: "codex"` uniquement lorsque le Plugin Codex est installé, activé, contribue le harnais `codex` et dispose d’un OAuth utilisable ; sinon, il sélectionne `agentRuntime.id: "pi"` afin que la route reste sur l’exécuteur OpenClaw par défaut.
- Doctor nettoie l’état de préparation des dépendances de Plugins hérité créé par d’anciennes versions d’OpenClaw. Il répare aussi les Plugins téléchargeables manquants référencés par la configuration, comme `plugins.entries`, les canaux configurés, les paramètres de fournisseur/recherche configurés ou les environnements d’exécution d’agents configurés. Pendant les mises à jour de paquet, doctor ignore la réparation des Plugins par le gestionnaire de paquets jusqu’à la fin du remplacement du paquet ; réexécutez ensuite `openclaw doctor --fix` si un Plugin configuré nécessite encore une récupération. Si le téléchargement échoue, doctor signale l’erreur d’installation et conserve l’entrée de Plugin configurée pour la tentative de réparation suivante.
- Doctor répare les configurations de Plugins obsolètes en supprimant les identifiants de Plugins manquants de `plugins.allow`/`plugins.entries`, ainsi que la configuration de canal pendante correspondante, les cibles heartbeat et les remplacements de modèle par canal lorsque la découverte des Plugins est saine.
- Doctor met en quarantaine la configuration de Plugin invalide en désactivant l’entrée `plugins.entries.<id>` concernée et en supprimant sa charge utile `config` invalide. Le démarrage du Gateway ignore déjà uniquement ce mauvais Plugin afin que les autres Plugins et canaux puissent continuer à fonctionner.
- Définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un autre superviseur possède le cycle de vie du Gateway. Doctor signale toujours l’état du Gateway/service et applique les réparations non liées au service, mais ignore l’installation/le démarrage/le redémarrage/le bootstrap du service et le nettoyage des services hérités.
- Sous Linux, doctor ignore les unités systemd inactives supplémentaires ressemblant à un Gateway et ne réécrit pas les métadonnées de commande/point d’entrée d’un service Gateway systemd en cours d’exécution pendant la réparation. Arrêtez d’abord le service ou utilisez `openclaw gateway install --force` lorsque vous voulez intentionnellement remplacer le lanceur actif.
- Doctor migre automatiquement l’ancienne configuration Talk plate (`talk.voiceId`, `talk.modelId` et assimilés) vers `talk.provider` + `talk.providers.<provider>`.
- Les exécutions répétées de `doctor --fix` ne signalent/n’appliquent plus la normalisation Talk lorsque la seule différence est l’ordre des clés d’objet.
- Doctor inclut un contrôle de préparation de la recherche mémoire et peut recommander `openclaw configure --section model` lorsque les identifiants d’embedding sont manquants.
- Doctor avertit lorsqu’aucun propriétaire de commande n’est configuré. Le propriétaire de commande est le compte opérateur humain autorisé à exécuter les commandes réservées au propriétaire et à approuver les actions dangereuses. L’appairage en DM permet seulement à quelqu’un de parler au bot ; si vous avez approuvé un expéditeur avant l’existence du bootstrap du premier propriétaire, définissez explicitement `commands.ownerAllowFrom`.
- Doctor avertit lorsque des agents en mode Codex sont configurés et que des ressources personnelles Codex CLI existent dans le répertoire personnel Codex de l’opérateur. Les lancements locaux du serveur d’application Codex utilisent des répertoires personnels isolés par agent ; utilisez donc `openclaw migrate codex --dry-run` pour inventorier les ressources à promouvoir volontairement.
- Doctor avertit lorsque les skills autorisés pour l’agent par défaut sont indisponibles dans l’environnement d’exécution actuel parce que des binaires, des variables d’environnement, une configuration ou des exigences d’OS manquent. `doctor --fix` peut désactiver ces skills indisponibles avec `skills.entries.<skill>.enabled=false` ; installez/configurez plutôt l’exigence manquante lorsque vous voulez garder le skill actif.
- Si le mode bac à sable est activé mais que Docker est indisponible, doctor signale un avertissement à fort signal avec correction (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Si d’anciens fichiers de registre de bac à sable (`~/.openclaw/sandbox/containers.json` ou `~/.openclaw/sandbox/browsers.json`) sont présents, doctor les signale ; `openclaw doctor --fix` migre les entrées valides vers des répertoires de registre partitionnés et met en quarantaine les anciens fichiers invalides.
- Si `gateway.auth.token`/`gateway.auth.password` sont gérés par SecretRef et indisponibles dans le chemin de commande actuel, doctor signale un avertissement en lecture seule et n’écrit pas d’identifiants de repli en texte clair.
- Si l’inspection SecretRef du canal échoue dans un chemin de correction, doctor continue et signale un avertissement au lieu de quitter prématurément.
- Après les migrations de répertoires d’état, doctor avertit lorsque les comptes Telegram ou Discord par défaut activés dépendent du repli par variables d’environnement et que `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` est indisponible pour le processus doctor.
- La résolution automatique des noms d’utilisateur Telegram `allowFrom` (`doctor --fix`) nécessite un jeton Telegram résoluble dans le chemin de commande actuel. Si l’inspection du jeton est indisponible, doctor signale un avertissement et ignore la résolution automatique pour cette passe.

## macOS : remplacements d’environnement `launchctl`

Si vous avez précédemment exécuté `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), cette valeur remplace votre fichier de configuration et peut provoquer des erreurs « unauthorized » persistantes.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Liens associés

- [Référence CLI](/fr/cli)
- [Doctor Gateway](/fr/gateway/doctor)
