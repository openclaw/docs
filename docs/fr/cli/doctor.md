---
read_when:
    - Vous rencontrez des problèmes de connectivité/d’authentification et souhaitez des correctifs guidés
    - Vous avez effectué une mise à jour et souhaitez un contrôle de cohérence
summary: Référence CLI pour `openclaw doctor` (contrôles d’intégrité + réparations guidées)
title: Diagnostic
x-i18n:
    generated_at: "2026-05-02T20:42:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: c64cefee8f36b38657b72912271e3734411870376d2bd5a374d23a77a080035d
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Contrôles de santé + corrections rapides pour le Gateway et les canaux.

Associé :

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

- `--no-workspace-suggestions` : désactiver les suggestions de mémoire/recherche d’espace de travail
- `--yes` : accepter les valeurs par défaut sans demander de confirmation
- `--repair` : appliquer les réparations recommandées hors service sans demander de confirmation ; les installations et réécritures du service Gateway nécessitent toujours une confirmation interactive ou des commandes Gateway explicites
- `--fix` : alias de `--repair`
- `--force` : appliquer des réparations agressives, y compris l’écrasement de la configuration de service personnalisée si nécessaire
- `--non-interactive` : exécuter sans invites ; migrations sûres et réparations hors service uniquement
- `--generate-gateway-token` : générer et configurer un jeton Gateway
- `--deep` : analyser les services système à la recherche d’installations Gateway supplémentaires

Remarques :

- Les invites interactives (comme les corrections de trousseau/OAuth) ne s’exécutent que lorsque stdin est un TTY et que `--non-interactive` n’est **pas** défini. Les exécutions sans interface (cron, Telegram, sans terminal) ignoreront les invites.
- Performances : les exécutions non interactives de `doctor` ignorent le chargement anticipé des plugins afin que les contrôles de santé sans interface restent rapides. Les sessions interactives chargent toujours complètement les plugins lorsqu’un contrôle a besoin de leur contribution.
- `--fix` (alias de `--repair`) écrit une sauvegarde dans `~/.openclaw/openclaw.json.bak` et supprime les clés de configuration inconnues, en listant chaque suppression.
- `doctor --fix --non-interactive` signale les définitions de service Gateway manquantes ou obsolètes, mais ne les installe ni ne les réécrit en dehors du mode de réparation de mise à jour. Exécutez `openclaw gateway install` pour un service manquant, ou `openclaw gateway install --force` lorsque vous voulez intentionnellement remplacer le lanceur.
- Les contrôles d’intégrité de l’état détectent désormais les fichiers de transcription orphelins dans le répertoire des sessions. Leur archivage sous la forme `.deleted.<timestamp>` nécessite une confirmation interactive ; `--fix`, `--yes` et les exécutions sans interface les laissent en place.
- Doctor analyse aussi `~/.openclaw/cron/jobs.json` (ou `cron.store`) pour détecter les anciennes formes de tâches cron et peut les réécrire sur place avant que le planificateur doive les normaliser automatiquement à l’exécution.
- Sous Linux, Doctor avertit lorsque le crontab de l’utilisateur exécute encore l’ancien `~/.openclaw/bin/ensure-whatsapp.sh` ; ce script n’est plus maintenu et peut consigner de fausses indisponibilités du Gateway WhatsApp lorsque cron ne dispose pas de l’environnement de bus utilisateur systemd.
- Doctor nettoie l’ancien état de préparation des dépendances de plugins créé par d’anciennes versions d’OpenClaw. Il répare aussi les plugins téléchargeables configurés mais manquants lorsque le registre peut les résoudre, et la passe Doctor 2026.5.2 installe automatiquement les plugins téléchargeables qu’une ancienne configuration utilise déjà avant de marquer la configuration comme touchée pour cette version.
- Doctor répare la configuration de plugins obsolète en supprimant les identifiants de plugins manquants de `plugins.allow`/`plugins.entries`, ainsi que la configuration de canal correspondante pendante, les cibles Heartbeat et les remplacements de modèle de canal lorsque la découverte des plugins est saine.
- Doctor met en quarantaine la configuration de plugin invalide en désactivant l’entrée `plugins.entries.<id>` concernée et en supprimant sa charge utile `config` invalide. Le démarrage du Gateway ignore déjà uniquement ce mauvais plugin afin que les autres plugins et canaux puissent continuer à fonctionner.
- Définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un autre superviseur possède le cycle de vie du Gateway. Doctor signale toujours la santé du Gateway/service et applique les réparations hors service, mais ignore l’installation, le démarrage, le redémarrage, l’amorçage du service et le nettoyage des anciens services.
- Sous Linux, Doctor ignore les unités systemd supplémentaires de type Gateway qui sont inactives et ne réécrit pas les métadonnées de commande/point d’entrée d’un service Gateway systemd en cours d’exécution pendant la réparation. Arrêtez d’abord le service ou utilisez `openclaw gateway install --force` lorsque vous voulez intentionnellement remplacer le lanceur actif.
- Doctor migre automatiquement l’ancienne configuration Talk plate (`talk.voiceId`, `talk.modelId` et apparentés) vers `talk.provider` + `talk.providers.<provider>`.
- Les exécutions répétées de `doctor --fix` ne signalent/appliquent plus la normalisation Talk lorsque la seule différence est l’ordre des clés d’objet.
- Doctor inclut un contrôle de disponibilité de recherche mémoire et peut recommander `openclaw configure --section model` lorsque les identifiants d’embedding sont manquants.
- Doctor avertit lorsqu’aucun propriétaire de commande n’est configuré. Le propriétaire de commande est le compte opérateur humain autorisé à exécuter des commandes réservées au propriétaire et à approuver des actions dangereuses. L’appairage par message direct permet seulement à quelqu’un de parler au bot ; si vous avez approuvé un expéditeur avant que l’amorçage du premier propriétaire existe, définissez explicitement `commands.ownerAllowFrom`.
- Doctor avertit lorsque des agents en mode Codex sont configurés et que des ressources personnelles de la CLI Codex existent dans le répertoire personnel Codex de l’opérateur. Les lancements du serveur d’application Codex local utilisent des répertoires personnels isolés par agent ; utilisez donc `openclaw migrate codex --dry-run` pour inventorier les ressources qui devraient être promues délibérément.
- Doctor avertit lorsque les skills autorisées pour l’agent par défaut sont indisponibles dans l’environnement d’exécution actuel parce que des binaires, des variables d’environnement, une configuration ou des exigences de système d’exploitation sont manquants. `doctor --fix` peut désactiver ces skills indisponibles avec `skills.entries.<skill>.enabled=false` ; installez/configurez plutôt l’exigence manquante lorsque vous voulez garder la skill active.
- Si le mode sandbox est activé mais que Docker est indisponible, Doctor signale un avertissement à forte valeur informative avec une remédiation (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Si `gateway.auth.token`/`gateway.auth.password` sont gérés par SecretRef et indisponibles dans le chemin de commande actuel, Doctor signale un avertissement en lecture seule et n’écrit pas d’identifiants de secours en texte clair.
- Si l’inspection SecretRef de canal échoue dans un chemin de correction, Doctor continue et signale un avertissement au lieu de quitter tôt.
- Après les migrations de répertoire d’état, Doctor avertit lorsque des comptes Telegram ou Discord par défaut activés dépendent d’un repli par variable d’environnement et que `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` est indisponible pour le processus Doctor.
- La résolution automatique du nom d’utilisateur Telegram `allowFrom` (`doctor --fix`) nécessite un jeton Telegram résolvable dans le chemin de commande actuel. Si l’inspection du jeton est indisponible, Doctor signale un avertissement et ignore la résolution automatique pour cette passe.

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
- [Doctor du Gateway](/fr/gateway/doctor)
