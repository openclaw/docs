---
read_when:
    - Vous rencontrez des problèmes de connectivité/d’authentification et souhaitez des corrections guidées
    - Vous avez fait une mise à jour et souhaitez une vérification rapide
summary: Référence CLI pour `openclaw doctor` (contrôles d’état + réparations guidées)
title: Diagnostic
x-i18n:
    generated_at: "2026-05-05T08:25:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6101008d1cb7e08f9902a8a29785710f325966524b003b87b5c628fe906ab78
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Contrôles de santé + corrections rapides pour le Gateway et les canaux.

Liés :

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

## Options

- `--no-workspace-suggestions` : désactiver les suggestions de mémoire/recherche de l’espace de travail
- `--yes` : accepter les valeurs par défaut sans invite
- `--repair` : appliquer les réparations hors service recommandées sans invite ; les installations et réécritures du service Gateway nécessitent toujours une confirmation interactive ou des commandes Gateway explicites
- `--fix` : alias de `--repair`
- `--force` : appliquer des réparations agressives, y compris l’écrasement de la configuration de service personnalisée si nécessaire
- `--non-interactive` : exécuter sans invites ; migrations sûres et réparations hors service uniquement
- `--generate-gateway-token` : générer et configurer un jeton Gateway
- `--deep` : analyser les services système pour trouver des installations Gateway supplémentaires et signaler les récents transferts de redémarrage du superviseur Gateway

Remarques :

- Les invites interactives (comme les corrections de trousseau/OAuth) ne s’exécutent que lorsque stdin est un TTY et que `--non-interactive` n’est **pas** défini. Les exécutions sans interface (cron, Telegram, sans terminal) ignorent les invites.
- Performances : les exécutions non interactives de `doctor` ignorent le chargement anticipé des plugins afin que les contrôles de santé sans interface restent rapides. Les sessions interactives chargent toujours entièrement les plugins lorsqu’un contrôle a besoin de leur contribution.
- `--fix` (alias de `--repair`) écrit une sauvegarde dans `~/.openclaw/openclaw.json.bak` et supprime les clés de configuration inconnues, en listant chaque suppression.
- `doctor --fix --non-interactive` signale les définitions de service Gateway manquantes ou obsolètes, mais ne les installe ni ne les réécrit en dehors du mode de réparation de mise à jour. Exécutez `openclaw gateway install` pour un service manquant, ou `openclaw gateway install --force` lorsque vous voulez intentionnellement remplacer le lanceur.
- Les contrôles d’intégrité de l’état détectent désormais les fichiers de transcription orphelins dans le répertoire des sessions. Leur archivage en tant que `.deleted.<timestamp>` nécessite une confirmation interactive ; `--fix`, `--yes` et les exécutions sans interface les laissent en place.
- Doctor analyse aussi `~/.openclaw/cron/jobs.json` (ou `cron.store`) pour détecter les anciennes formes de tâches cron et peut les réécrire sur place avant que le planificateur doive les normaliser automatiquement à l’exécution.
- Sous Linux, doctor avertit lorsque la crontab de l’utilisateur exécute encore l’ancien `~/.openclaw/bin/ensure-whatsapp.sh` ; ce script n’est plus maintenu et peut journaliser de fausses indisponibilités du Gateway WhatsApp lorsque cron ne dispose pas de l’environnement du bus utilisateur systemd.
- Lorsque WhatsApp est activé, doctor vérifie si une boucle d’événements Gateway dégradée existe avec des clients locaux `openclaw-tui` encore en cours d’exécution. `doctor --fix` arrête uniquement les clients TUI locaux vérifiés afin que les réponses WhatsApp ne soient pas mises en file derrière des boucles d’actualisation TUI obsolètes.
- Doctor nettoie l’état intermédiaire des dépendances de plugins hérité, créé par d’anciennes versions d’OpenClaw. Il répare aussi les plugins téléchargeables manquants référencés par la configuration, comme `plugins.entries`, les canaux configurés, les paramètres de fournisseur/recherche configurés ou les runtimes d’agents configurés. Pendant les mises à jour de paquet, doctor ignore la réparation des plugins par le gestionnaire de paquets jusqu’à la fin du remplacement du paquet ; réexécutez ensuite `openclaw doctor --fix` si un plugin configuré nécessite encore une récupération. Si le téléchargement échoue, doctor signale l’erreur d’installation et conserve l’entrée de plugin configurée pour la prochaine tentative de réparation.
- Doctor répare la configuration de plugin obsolète en supprimant les identifiants de plugins manquants de `plugins.allow`/`plugins.entries`, ainsi que la configuration de canal pendante correspondante, les cibles Heartbeat et les remplacements de modèles de canal lorsque la découverte des plugins est saine.
- Doctor met en quarantaine la configuration de plugin invalide en désactivant l’entrée `plugins.entries.<id>` concernée et en supprimant sa charge utile `config` invalide. Le démarrage du Gateway ignore déjà seulement ce mauvais plugin afin que les autres plugins et canaux puissent continuer à fonctionner.
- Définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un autre superviseur gère le cycle de vie du Gateway. Doctor signale toujours la santé du Gateway/service et applique les réparations hors service, mais ignore l’installation/le démarrage/le redémarrage/l’amorçage du service et le nettoyage de l’ancien service.
- Sous Linux, doctor ignore les unités systemd inactives supplémentaires ressemblant au Gateway et ne réécrit pas les métadonnées de commande/point d’entrée pour un service Gateway systemd en cours d’exécution pendant la réparation. Arrêtez d’abord le service ou utilisez `openclaw gateway install --force` lorsque vous voulez intentionnellement remplacer le lanceur actif.
- Doctor migre automatiquement l’ancienne configuration Talk plate (`talk.voiceId`, `talk.modelId` et éléments apparentés) vers `talk.provider` + `talk.providers.<provider>`.
- Les exécutions répétées de `doctor --fix` ne signalent/n’appliquent plus la normalisation Talk lorsque la seule différence est l’ordre des clés d’objet.
- Doctor inclut un contrôle de disponibilité de la recherche mémoire et peut recommander `openclaw configure --section model` lorsque les identifiants d’embedding sont manquants.
- Doctor avertit lorsqu’aucun propriétaire de commande n’est configuré. Le propriétaire de commande est le compte opérateur humain autorisé à exécuter des commandes réservées au propriétaire et à approuver des actions dangereuses. L’appairage par message direct permet seulement à quelqu’un de parler au bot ; si vous avez approuvé un expéditeur avant l’existence de l’amorçage du premier propriétaire, définissez explicitement `commands.ownerAllowFrom`.
- Doctor avertit lorsque des agents en mode Codex sont configurés et que des ressources personnelles de la CLI Codex existent dans le répertoire Codex de l’opérateur. Les lancements locaux du serveur d’application Codex utilisent des répertoires isolés par agent, utilisez donc `openclaw migrate codex --dry-run` pour inventorier les ressources à promouvoir délibérément.
- Doctor avertit lorsque les skills autorisées pour l’agent par défaut ne sont pas disponibles dans l’environnement d’exécution actuel parce que des binaires, des variables d’environnement, une configuration ou des exigences d’OS sont manquants. `doctor --fix` peut désactiver ces skills indisponibles avec `skills.entries.<skill>.enabled=false` ; installez/configurez plutôt l’exigence manquante lorsque vous voulez garder la skill active.
- Si le mode bac à sable est activé mais que Docker n’est pas disponible, doctor signale un avertissement très informatif avec une remédiation (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Si d’anciens fichiers de registre du bac à sable (`~/.openclaw/sandbox/containers.json` ou `~/.openclaw/sandbox/browsers.json`) sont présents, doctor les signale ; `openclaw doctor --fix` migre les entrées valides vers des répertoires de registre fragmentés et met en quarantaine les anciens fichiers invalides.
- Si `gateway.auth.token`/`gateway.auth.password` sont gérés par SecretRef et indisponibles dans le chemin de commande actuel, doctor signale un avertissement en lecture seule et n’écrit pas d’identifiants de secours en clair.
- Si l’inspection SecretRef d’un canal échoue dans un chemin de correction, doctor continue et signale un avertissement au lieu de quitter prématurément.
- Après les migrations de répertoires d’état, doctor avertit lorsque des comptes Telegram ou Discord par défaut activés dépendent d’un repli d’environnement et que `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` n’est pas disponible pour le processus doctor.
- L’auto-résolution des noms d’utilisateur Telegram `allowFrom` (`doctor --fix`) nécessite un jeton Telegram résolvable dans le chemin de commande actuel. Si l’inspection du jeton est indisponible, doctor signale un avertissement et ignore l’auto-résolution pour ce passage.

## macOS : remplacements d’environnement `launchctl`

Si vous avez précédemment exécuté `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), cette valeur remplace votre fichier de configuration et peut provoquer des erreurs « unauthorized » persistantes.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Liés

- [Référence CLI](/fr/cli)
- [Doctor Gateway](/fr/gateway/doctor)
