---
read_when:
    - Vous rencontrez des problèmes de connectivité/d’authentification et souhaitez des correctifs guidés
    - Vous avez effectué une mise à jour et souhaitez un contrôle de cohérence
summary: Référence CLI pour `openclaw doctor` (contrôles d’intégrité + réparations guidées)
title: Diagnostic
x-i18n:
    generated_at: "2026-05-02T07:01:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: e861fa105737088eafa55815faa1a37ccd61e154e8dbe811cf4b988bc1c571e5
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Contrôles d’intégrité + correctifs rapides pour le Gateway et les canaux.

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

- `--no-workspace-suggestions` : désactive les suggestions de mémoire/recherche d’espace de travail
- `--yes` : accepte les valeurs par défaut sans invite
- `--repair` : applique les réparations recommandées hors service sans invite ; les installations et réécritures du service Gateway nécessitent toujours une confirmation interactive ou des commandes Gateway explicites
- `--fix` : alias de `--repair`
- `--force` : applique des réparations agressives, y compris l’écrasement de la configuration de service personnalisée si nécessaire
- `--non-interactive` : exécute sans invites ; migrations sûres et réparations hors service uniquement
- `--generate-gateway-token` : génère et configure un jeton Gateway
- `--deep` : analyse les services système pour détecter des installations Gateway supplémentaires

Notes :

- Les invites interactives (comme les correctifs de trousseau/OAuth) s’exécutent uniquement lorsque stdin est un TTY et que `--non-interactive` n’est **pas** défini. Les exécutions sans interface (cron, Telegram, sans terminal) ignoreront les invites.
- Performances : les exécutions non interactives de `doctor` ignorent le chargement anticipé des plugins afin que les contrôles d’intégrité sans interface restent rapides. Les sessions interactives chargent toujours entièrement les plugins lorsqu’un contrôle a besoin de leur contribution.
- `--fix` (alias de `--repair`) écrit une sauvegarde dans `~/.openclaw/openclaw.json.bak` et supprime les clés de configuration inconnues, en listant chaque suppression.
- `doctor --fix --non-interactive` signale les définitions de service Gateway manquantes ou obsolètes, mais ne les installe ni ne les réécrit en dehors du mode de réparation de mise à jour. Exécutez `openclaw gateway install` pour un service manquant, ou `openclaw gateway install --force` lorsque vous voulez intentionnellement remplacer le lanceur.
- Les contrôles d’intégrité de l’état détectent désormais les fichiers de transcription orphelins dans le répertoire des sessions. Leur archivage en tant que `.deleted.<timestamp>` nécessite une confirmation interactive ; `--fix`, `--yes` et les exécutions sans interface les laissent en place.
- Doctor analyse aussi `~/.openclaw/cron/jobs.json` (ou `cron.store`) pour rechercher les anciens formats de tâches Cron et peut les réécrire sur place avant que le planificateur doive les normaliser automatiquement à l’exécution.
- Sous Linux, doctor avertit lorsque la crontab de l’utilisateur exécute encore l’ancien `~/.openclaw/bin/ensure-whatsapp.sh` ; ce script n’est plus maintenu et peut journaliser de fausses pannes du Gateway WhatsApp lorsque Cron ne dispose pas de l’environnement user-bus de systemd.
- Doctor nettoie l’état hérité de préparation des dépendances de plugins créé par d’anciennes versions d’OpenClaw. Il répare aussi les plugins téléchargeables configurés manquants lorsque le registre peut les résoudre.
- Doctor répare la configuration obsolète des plugins en supprimant les identifiants de plugins manquants de `plugins.allow`/`plugins.entries`, ainsi que la configuration de canal pendante correspondante, les cibles Heartbeat et les remplacements de modèle de canal lorsque la découverte des plugins est saine.
- Doctor met en quarantaine la configuration de plugin invalide en désactivant l’entrée `plugins.entries.<id>` concernée et en supprimant sa charge utile `config` invalide. Le démarrage du Gateway ignore déjà uniquement ce mauvais plugin afin que les autres plugins et canaux puissent continuer à fonctionner.
- Définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un autre superviseur possède le cycle de vie du Gateway. Doctor signale toujours l’intégrité du Gateway/service et applique les réparations hors service, mais ignore l’installation/le démarrage/le redémarrage/l’amorçage du service et le nettoyage de service hérité.
- Sous Linux, doctor ignore les unités systemd inactives supplémentaires ressemblant au Gateway et ne réécrit pas les métadonnées de commande/point d’entrée d’un service Gateway systemd en cours d’exécution pendant la réparation. Arrêtez d’abord le service ou utilisez `openclaw gateway install --force` lorsque vous voulez intentionnellement remplacer le lanceur actif.
- Doctor migre automatiquement l’ancienne configuration Talk plate (`talk.voiceId`, `talk.modelId` et éléments associés) vers `talk.provider` + `talk.providers.<provider>`.
- Les exécutions répétées de `doctor --fix` ne signalent/appliquent plus la normalisation Talk lorsque la seule différence est l’ordre des clés d’objet.
- Doctor inclut un contrôle de préparation de la recherche mémoire et peut recommander `openclaw configure --section model` lorsque les identifiants d’embedding sont manquants.
- Doctor avertit lorsqu’aucun propriétaire de commande n’est configuré. Le propriétaire de commande est le compte d’opérateur humain autorisé à exécuter les commandes réservées au propriétaire et à approuver les actions dangereuses. L’appairage par DM permet seulement à quelqu’un de parler au bot ; si vous avez approuvé un expéditeur avant l’existence de l’amorçage du premier propriétaire, définissez explicitement `commands.ownerAllowFrom`.
- Doctor avertit lorsque des agents en mode Codex sont configurés et que des ressources personnelles du CLI Codex existent dans le répertoire personnel Codex de l’opérateur. Les lancements locaux du serveur d’application Codex utilisent des répertoires personnels isolés par agent, utilisez donc `openclaw migrate codex --dry-run` pour inventorier les ressources à promouvoir délibérément.
- Si le mode sandbox est activé mais que Docker n’est pas disponible, doctor signale un avertissement à fort signal avec une remédiation (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Si `gateway.auth.token`/`gateway.auth.password` sont gérés par SecretRef et indisponibles dans le chemin de commande actuel, doctor signale un avertissement en lecture seule et n’écrit pas d’identifiants de secours en texte clair.
- Si l’inspection SecretRef du canal échoue dans un chemin de correction, doctor continue et signale un avertissement au lieu de quitter prématurément.
- Après les migrations du répertoire d’état, doctor avertit lorsque les comptes Telegram ou Discord par défaut activés dépendent du repli env et que `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` n’est pas disponible pour le processus doctor.
- La résolution automatique des noms d’utilisateur `allowFrom` Telegram (`doctor --fix`) nécessite un jeton Telegram résolvable dans le chemin de commande actuel. Si l’inspection du jeton est indisponible, doctor signale un avertissement et ignore la résolution automatique pour ce passage.

## macOS : remplacements d’env `launchctl`

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
