---
read_when:
    - Vous rencontrez des problèmes de connectivité/d’authentification et souhaitez des correctifs guidés
    - Vous avez effectué une mise à jour et souhaitez une vérification de cohérence
summary: Référence CLI pour `openclaw doctor` (contrôles d’intégrité + réparations guidées)
title: Diagnostic
x-i18n:
    generated_at: "2026-05-04T02:22:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd7fb09d373c313e4be45ad9e3b19ceb187a5787ef3e70fcd2b1f1f01b50c905
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Contrôles de santé + correctifs rapides pour le Gateway et les canaux.

Associés :

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
- `--yes` : accepter les valeurs par défaut sans demander de confirmation
- `--repair` : appliquer les réparations recommandées hors service sans demander de confirmation ; les installations et réécritures du service Gateway nécessitent toujours une confirmation interactive ou des commandes Gateway explicites
- `--fix` : alias de `--repair`
- `--force` : appliquer des réparations agressives, y compris l’écrasement de la configuration de service personnalisée si nécessaire
- `--non-interactive` : exécuter sans invites ; migrations sûres et réparations hors service uniquement
- `--generate-gateway-token` : générer et configurer un jeton Gateway
- `--deep` : analyser les services système pour détecter des installations Gateway supplémentaires

Remarques :

- Les invites interactives (comme les correctifs keychain/OAuth) ne s’exécutent que lorsque stdin est un TTY et que `--non-interactive` n’est **pas** défini. Les exécutions sans interface (cron, Telegram, sans terminal) ignoreront les invites.
- Performances : les exécutions non interactives de `doctor` ignorent le chargement anticipé des plugins afin que les contrôles de santé sans interface restent rapides. Les sessions interactives chargent toujours complètement les plugins lorsqu’un contrôle a besoin de leur contribution.
- `--fix` (alias de `--repair`) écrit une sauvegarde dans `~/.openclaw/openclaw.json.bak` et supprime les clés de configuration inconnues, en listant chaque suppression.
- `doctor --fix --non-interactive` signale les définitions de service Gateway manquantes ou obsolètes, mais ne les installe ni ne les réécrit en dehors du mode de réparation de mise à jour. Exécutez `openclaw gateway install` pour un service manquant, ou `openclaw gateway install --force` lorsque vous voulez intentionnellement remplacer le lanceur.
- Les contrôles d’intégrité de l’état détectent désormais les fichiers de transcript orphelins dans le répertoire des sessions. Leur archivage sous la forme `.deleted.<timestamp>` nécessite une confirmation interactive ; `--fix`, `--yes` et les exécutions sans interface les laissent en place.
- Doctor analyse aussi `~/.openclaw/cron/jobs.json` (ou `cron.store`) pour détecter les anciennes formes de tâches cron et peut les réécrire sur place avant que le planificateur n’ait à les normaliser automatiquement à l’exécution.
- Sous Linux, doctor avertit lorsque la crontab de l’utilisateur exécute encore l’ancien `~/.openclaw/bin/ensure-whatsapp.sh` ; ce script n’est plus maintenu et peut journaliser de fausses interruptions du Gateway WhatsApp lorsque cron ne dispose pas de l’environnement user-bus de systemd.
- Doctor nettoie l’état intermédiaire des dépendances de plugins hérité, créé par d’anciennes versions d’OpenClaw. Il répare aussi les plugins téléchargeables configurés manquants lorsque le registre peut les résoudre, et le passage doctor 2026.5.2 installe automatiquement les plugins téléchargeables qu’une ancienne configuration utilise déjà avant de marquer la configuration comme modifiée pour cette version. Si le téléchargement échoue, doctor signale l’erreur d’installation et conserve l’entrée de plugin configurée pour la prochaine tentative de réparation.
- Doctor répare la configuration de plugins obsolète en supprimant les identifiants de plugins manquants de `plugins.allow`/`plugins.entries`, ainsi que la configuration de canal pendante correspondante, les cibles Heartbeat et les remplacements de modèle de canal lorsque la découverte des plugins est saine.
- Doctor met en quarantaine la configuration de plugin invalide en désactivant l’entrée `plugins.entries.<id>` concernée et en supprimant sa charge utile `config` invalide. Le démarrage du Gateway ignore déjà uniquement ce mauvais plugin afin que les autres plugins et canaux puissent continuer à fonctionner.
- Définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un autre superviseur gère le cycle de vie du Gateway. Doctor signale toujours la santé du Gateway/service et applique les réparations hors service, mais ignore l’installation, le démarrage, le redémarrage, le bootstrap du service et le nettoyage des services hérités.
- Sous Linux, doctor ignore les unités systemd supplémentaires inactives de type Gateway et ne réécrit pas les métadonnées de commande/point d’entrée d’un service Gateway systemd en cours d’exécution pendant la réparation. Arrêtez d’abord le service ou utilisez `openclaw gateway install --force` lorsque vous voulez intentionnellement remplacer le lanceur actif.
- Doctor migre automatiquement l’ancienne configuration Talk plate (`talk.voiceId`, `talk.modelId`, et autres) vers `talk.provider` + `talk.providers.<provider>`.
- Les exécutions répétées de `doctor --fix` ne signalent/appliquent plus la normalisation de Talk lorsque la seule différence est l’ordre des clés d’objet.
- Doctor inclut un contrôle de disponibilité de la recherche mémoire et peut recommander `openclaw configure --section model` lorsque les identifiants d’embedding sont manquants.
- Doctor avertit lorsqu’aucun propriétaire de commande n’est configuré. Le propriétaire de commande est le compte opérateur humain autorisé à exécuter les commandes réservées au propriétaire et à approuver les actions dangereuses. L’appairage par DM permet seulement à quelqu’un de parler au bot ; si vous avez approuvé un expéditeur avant l’existence du bootstrap du premier propriétaire, définissez explicitement `commands.ownerAllowFrom`.
- Doctor avertit lorsque des agents en mode Codex sont configurés et que des ressources personnelles du CLI Codex existent dans le répertoire d’accueil Codex de l’opérateur. Les lancements locaux du serveur d’application Codex utilisent des répertoires d’accueil isolés par agent ; utilisez donc `openclaw migrate codex --dry-run` pour inventorier les ressources à promouvoir délibérément.
- Doctor avertit lorsque des Skills autorisées pour l’agent par défaut ne sont pas disponibles dans l’environnement d’exécution actuel parce que des binaires, variables d’environnement, configurations ou exigences d’OS sont manquants. `doctor --fix` peut désactiver ces Skills indisponibles avec `skills.entries.<skill>.enabled=false` ; installez/configurez plutôt l’exigence manquante lorsque vous voulez garder la Skill active.
- Si le mode sandbox est activé mais que Docker n’est pas disponible, doctor signale un avertissement à forte valeur informative avec une remédiation (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Si d’anciens fichiers de registre sandbox (`~/.openclaw/sandbox/containers.json` ou `~/.openclaw/sandbox/browsers.json`) sont présents, doctor les signale ; `openclaw doctor --fix` migre les entrées valides vers des répertoires de registre partitionnés et met en quarantaine les anciens fichiers invalides.
- Si `gateway.auth.token`/`gateway.auth.password` sont gérés par SecretRef et indisponibles dans le chemin de commande actuel, doctor signale un avertissement en lecture seule et n’écrit pas d’identifiants de repli en clair.
- Si l’inspection SecretRef de canal échoue dans un chemin de correction, doctor continue et signale un avertissement au lieu de quitter prématurément.
- Après les migrations du répertoire d’état, doctor avertit lorsque les comptes Telegram ou Discord par défaut activés dépendent d’un repli par variable d’environnement et que `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` n’est pas disponible pour le processus doctor.
- La résolution automatique des noms d’utilisateur `allowFrom` Telegram (`doctor --fix`) nécessite un jeton Telegram résoluble dans le chemin de commande actuel. Si l’inspection du jeton est indisponible, doctor signale un avertissement et ignore la résolution automatique pour ce passage.

## macOS : remplacements d’environnement `launchctl`

Si vous avez précédemment exécuté `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), cette valeur remplace votre fichier de configuration et peut provoquer des erreurs « unauthorized » persistantes.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Associés

- [Référence CLI](/fr/cli)
- [Doctor Gateway](/fr/gateway/doctor)
