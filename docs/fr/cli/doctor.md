---
read_when:
    - Vous rencontrez des problèmes de connectivité/d’authentification et souhaitez des correctifs guidés
    - Vous avez effectué une mise à jour et souhaitez une vérification de cohérence
summary: Référence CLI pour `openclaw doctor` (contrôles d’intégrité + réparations guidées)
title: Diagnostic
x-i18n:
    generated_at: "2026-05-03T21:28:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4baab5b0cd4d046d12ae5bd14ccf05224115856d45e630a57e77a2be15e5db0
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

## Options

- `--no-workspace-suggestions` : désactiver les suggestions de mémoire/recherche d’espace de travail
- `--yes` : accepter les valeurs par défaut sans demander de confirmation
- `--repair` : appliquer les réparations recommandées hors service sans demander de confirmation ; les installations et réécritures du service Gateway nécessitent toujours une confirmation interactive ou des commandes Gateway explicites
- `--fix` : alias de `--repair`
- `--force` : appliquer des réparations agressives, y compris l’écrasement de la configuration personnalisée du service lorsque nécessaire
- `--non-interactive` : exécuter sans invites ; migrations sûres et réparations hors service uniquement
- `--generate-gateway-token` : générer et configurer un jeton Gateway
- `--deep` : analyser les services système à la recherche d’installations Gateway supplémentaires

Remarques :

- Les invites interactives (comme les correctifs de trousseau/OAuth) ne s’exécutent que lorsque stdin est un TTY et que `--non-interactive` n’est **pas** défini. Les exécutions sans interface (cron, Telegram, sans terminal) ignoreront les invites.
- Performances : les exécutions non interactives de `doctor` ignorent le chargement anticipé des plugins afin que les contrôles de santé sans interface restent rapides. Les sessions interactives chargent toujours complètement les plugins lorsqu’un contrôle a besoin de leur contribution.
- `--fix` (alias de `--repair`) écrit une sauvegarde dans `~/.openclaw/openclaw.json.bak` et supprime les clés de configuration inconnues, en listant chaque suppression.
- `doctor --fix --non-interactive` signale les définitions de service Gateway manquantes ou obsolètes, mais ne les installe ni ne les réécrit hors du mode de réparation de mise à jour. Exécutez `openclaw gateway install` pour un service manquant, ou `openclaw gateway install --force` lorsque vous voulez intentionnellement remplacer le lanceur.
- Les contrôles d’intégrité d’état détectent désormais les fichiers de transcription orphelins dans le répertoire des sessions. Leur archivage sous la forme `.deleted.<timestamp>` nécessite une confirmation interactive ; `--fix`, `--yes` et les exécutions sans interface les laissent en place.
- Doctor analyse aussi `~/.openclaw/cron/jobs.json` (ou `cron.store`) pour détecter les anciens formats de tâches cron et peut les réécrire sur place avant que le planificateur n’ait à les auto-normaliser à l’exécution.
- Sous Linux, doctor avertit lorsque le crontab de l’utilisateur exécute encore l’ancien `~/.openclaw/bin/ensure-whatsapp.sh` ; ce script n’est plus maintenu et peut journaliser de fausses pannes du Gateway WhatsApp lorsque cron ne dispose pas de l’environnement du bus utilisateur systemd.
- Doctor nettoie l’état hérité de préparation des dépendances de plugins créé par les anciennes versions d’OpenClaw. Il répare aussi les plugins téléchargeables configurés manquants lorsque le registre peut les résoudre, et le passage doctor 2026.5.2 installe automatiquement les plugins téléchargeables qu’une ancienne configuration utilise déjà avant de marquer la configuration comme touchée pour cette version.
- Doctor répare la configuration de plugins obsolète en supprimant les ids de plugins manquants de `plugins.allow`/`plugins.entries`, ainsi que la configuration de canal pendante correspondante, les cibles Heartbeat et les surcharges de modèle de canal lorsque la découverte des plugins est saine.
- Doctor met en quarantaine la configuration de plugin invalide en désactivant l’entrée `plugins.entries.<id>` concernée et en supprimant sa charge utile `config` invalide. Le démarrage du Gateway ignore déjà uniquement ce mauvais plugin afin que les autres plugins et canaux puissent continuer à s’exécuter.
- Définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un autre superviseur possède le cycle de vie du Gateway. Doctor signale toujours la santé du Gateway/service et applique les réparations hors service, mais ignore l’installation/le démarrage/le redémarrage/le bootstrap du service et le nettoyage des services hérités.
- Sous Linux, doctor ignore les unités systemd inactives ressemblant à des Gateways supplémentaires et ne réécrit pas les métadonnées de commande/point d’entrée pour un service Gateway systemd en cours d’exécution pendant la réparation. Arrêtez d’abord le service ou utilisez `openclaw gateway install --force` lorsque vous voulez intentionnellement remplacer le lanceur actif.
- Doctor migre automatiquement l’ancienne configuration Talk plate (`talk.voiceId`, `talk.modelId` et éléments associés) vers `talk.provider` + `talk.providers.<provider>`.
- Les exécutions répétées de `doctor --fix` ne signalent/appliquent plus la normalisation Talk lorsque la seule différence est l’ordre des clés d’objet.
- Doctor inclut un contrôle de préparation de la recherche mémoire et peut recommander `openclaw configure --section model` lorsque les identifiants d’embedding sont manquants.
- Doctor avertit lorsqu’aucun propriétaire de commande n’est configuré. Le propriétaire de commande est le compte opérateur humain autorisé à exécuter les commandes réservées au propriétaire et à approuver les actions dangereuses. L’appairage par DM permet seulement à quelqu’un de parler au bot ; si vous avez approuvé un expéditeur avant l’existence du bootstrap du premier propriétaire, définissez explicitement `commands.ownerAllowFrom`.
- Doctor avertit lorsque des agents en mode Codex sont configurés et que des ressources personnelles du CLI Codex existent dans le répertoire personnel Codex de l’opérateur. Les lancements locaux du serveur d’application Codex utilisent des répertoires personnels isolés par agent ; utilisez donc `openclaw migrate codex --dry-run` pour inventorier les ressources qui doivent être promues délibérément.
- Doctor avertit lorsque des skills autorisées pour l’agent par défaut ne sont pas disponibles dans l’environnement d’exécution actuel parce que des binaires, variables d’environnement, configurations ou exigences d’OS manquent. `doctor --fix` peut désactiver ces skills indisponibles avec `skills.entries.<skill>.enabled=false` ; installez/configurez plutôt l’exigence manquante lorsque vous voulez garder la skill active.
- Si le mode sandbox est activé mais que Docker est indisponible, doctor signale un avertissement à fort signal avec une remédiation (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Si d’anciens fichiers de registre sandbox (`~/.openclaw/sandbox/containers.json` ou `~/.openclaw/sandbox/browsers.json`) sont présents, doctor les signale ; `openclaw doctor --fix` migre les entrées valides vers des répertoires de registre fragmentés et met en quarantaine les anciens fichiers invalides.
- Si `gateway.auth.token`/`gateway.auth.password` sont gérés par SecretRef et indisponibles dans le chemin de commande actuel, doctor signale un avertissement en lecture seule et n’écrit pas d’identifiants de repli en texte clair.
- Si l’inspection SecretRef du canal échoue dans un chemin de correction, doctor continue et signale un avertissement au lieu de quitter prématurément.
- Après les migrations de répertoire d’état, doctor avertit lorsque les comptes Telegram ou Discord par défaut activés dépendent d’un repli par variable d’environnement et que `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` est indisponible pour le processus doctor.
- La résolution automatique des noms d’utilisateur `allowFrom` Telegram (`doctor --fix`) nécessite un jeton Telegram résoluble dans le chemin de commande actuel. Si l’inspection du jeton est indisponible, doctor signale un avertissement et ignore la résolution automatique pour ce passage.

## macOS : remplacements d’environnement `launchctl`

Si vous avez précédemment exécuté `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), cette valeur remplace votre fichier de configuration et peut provoquer des erreurs « non autorisé » persistantes.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Liens associés

- [Référence CLI](/fr/cli)
- [Doctor du Gateway](/fr/gateway/doctor)
