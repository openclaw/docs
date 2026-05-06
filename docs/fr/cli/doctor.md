---
read_when:
    - Vous rencontrez des problèmes de connectivité/d’authentification et souhaitez des correctifs guidés
    - Vous avez effectué une mise à jour et souhaitez une vérification rapide
summary: Référence CLI pour `openclaw doctor` (contrôles d’intégrité + réparations guidées)
title: Diagnostic
x-i18n:
    generated_at: "2026-05-06T17:53:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: eed73ecbec848ae3071448f2444735e2564680fee94cf1e22a73d1e7beaede80
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Contrôles de santé + corrections rapides pour le Gateway et les canaux.

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

- `--no-workspace-suggestions` : désactive les suggestions de mémoire/recherche de l’espace de travail
- `--yes` : accepte les valeurs par défaut sans demander de confirmation
- `--repair` : applique les réparations recommandées hors service sans demander de confirmation ; les installations et réécritures du service Gateway nécessitent toujours une confirmation interactive ou des commandes Gateway explicites
- `--fix` : alias de `--repair`
- `--force` : applique des réparations agressives, y compris l’écrasement de la configuration de service personnalisée si nécessaire
- `--non-interactive` : exécute sans invites ; migrations sûres et réparations hors service uniquement
- `--generate-gateway-token` : génère et configure un jeton Gateway
- `--deep` : analyse les services système à la recherche d’installations Gateway supplémentaires et signale les récents transferts de redémarrage du superviseur Gateway

Remarques :

- En mode Nix (`OPENCLAW_NIX_MODE=1`), les contrôles doctor en lecture seule fonctionnent toujours, mais `doctor --fix`, `doctor --repair`, `doctor --yes` et `doctor --generate-gateway-token` sont désactivés, car `openclaw.json` est immuable. Modifiez plutôt la source Nix de cette installation ; pour nix-openclaw, utilisez le [Démarrage rapide](https://github.com/openclaw/nix-openclaw#quick-start) axé agent.
- Les invites interactives (comme les corrections de trousseau/OAuth) ne s’exécutent que lorsque stdin est un TTY et que `--non-interactive` n’est **pas** défini. Les exécutions sans interface (cron, Telegram, sans terminal) ignoreront les invites.
- Performances : les exécutions non interactives de `doctor` ignorent le chargement anticipé des plugins afin que les contrôles de santé sans interface restent rapides. Les sessions interactives chargent toujours complètement les plugins lorsqu’un contrôle nécessite leur contribution.
- `--fix` (alias de `--repair`) écrit une sauvegarde dans `~/.openclaw/openclaw.json.bak` et supprime les clés de configuration inconnues, en listant chaque suppression.
- `doctor --fix --non-interactive` signale les définitions de service Gateway manquantes ou obsolètes, mais ne les installe ni ne les réécrit en dehors du mode de réparation de mise à jour. Exécutez `openclaw gateway install` pour un service manquant, ou `openclaw gateway install --force` lorsque vous voulez intentionnellement remplacer le lanceur.
- Les contrôles d’intégrité d’état détectent désormais les fichiers de transcription orphelins dans le répertoire des sessions. Leur archivage sous la forme `.deleted.<timestamp>` nécessite une confirmation interactive ; `--fix`, `--yes` et les exécutions sans interface les laissent en place.
- Doctor analyse également `~/.openclaw/cron/jobs.json` (ou `cron.store`) à la recherche d’anciens formats de tâches Cron et peut les réécrire sur place avant que le planificateur doive les normaliser automatiquement à l’exécution.
- Sous Linux, doctor avertit lorsque le crontab de l’utilisateur exécute encore l’ancien `~/.openclaw/bin/ensure-whatsapp.sh` ; ce script n’est plus maintenu et peut journaliser de fausses pannes du Gateway WhatsApp lorsque cron n’a pas l’environnement de bus utilisateur systemd.
- Lorsque WhatsApp est activé, doctor vérifie la présence d’une boucle d’événements Gateway dégradée avec des clients `openclaw-tui` locaux encore en cours d’exécution. `doctor --fix` arrête uniquement les clients TUI locaux vérifiés afin que les réponses WhatsApp ne soient pas mises en file derrière d’anciennes boucles d’actualisation TUI.
- Doctor réécrit les anciennes références de modèles `openai-codex/*` en références canoniques `openai/*` dans les modèles principaux, les modèles de secours, les remplacements Heartbeat/sous-agent/Compaction, les hooks, les remplacements de modèle par canal et les anciennes épingles de route de session. `--fix` sélectionne `agentRuntime.id: "codex"` uniquement lorsque le Plugin Codex est installé, activé, fournit le harnais `codex` et dispose d’un OAuth utilisable ; sinon, il sélectionne `agentRuntime.id: "pi"` afin que la route reste sur l’exécuteur OpenClaw par défaut.
- Doctor nettoie l’ancien état de préparation des dépendances de plugins créé par d’anciennes versions d’OpenClaw. Il répare également les plugins téléchargeables manquants référencés par la configuration, comme `plugins.entries`, les canaux configurés, les paramètres de fournisseur/recherche configurés ou les environnements d’exécution d’agent configurés. Pendant les mises à jour de paquet, doctor ignore la réparation des plugins par le gestionnaire de paquets jusqu’à la fin du remplacement du paquet ; réexécutez ensuite `openclaw doctor --fix` si un plugin configuré nécessite encore une récupération. Si le téléchargement échoue, doctor signale l’erreur d’installation et conserve l’entrée de plugin configurée pour la prochaine tentative de réparation.
- Doctor répare la configuration obsolète des plugins en supprimant les identifiants de plugins manquants de `plugins.allow`/`plugins.entries`, ainsi que la configuration de canal pendante correspondante, les cibles Heartbeat et les remplacements de modèle par canal lorsque la découverte des plugins est saine.
- Doctor met en quarantaine la configuration de plugin invalide en désactivant l’entrée `plugins.entries.<id>` concernée et en supprimant sa charge utile `config` invalide. Le démarrage du Gateway ignore déjà uniquement ce plugin défectueux afin que les autres plugins et canaux puissent continuer à fonctionner.
- Définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un autre superviseur possède le cycle de vie du Gateway. Doctor signale toujours la santé du Gateway/service et applique les réparations hors service, mais ignore l’installation, le démarrage, le redémarrage, l’amorçage du service et le nettoyage des anciens services.
- Sous Linux, doctor ignore les unités systemd supplémentaires inactives ressemblant à un Gateway et ne réécrit pas les métadonnées de commande/point d’entrée d’un service Gateway systemd en cours d’exécution pendant la réparation. Arrêtez d’abord le service ou utilisez `openclaw gateway install --force` lorsque vous voulez intentionnellement remplacer le lanceur actif.
- Doctor migre automatiquement l’ancienne configuration Talk plate (`talk.voiceId`, `talk.modelId` et éléments associés) vers `talk.provider` + `talk.providers.<provider>`.
- Les exécutions répétées de `doctor --fix` ne signalent/appliquent plus la normalisation Talk lorsque la seule différence est l’ordre des clés d’objet.
- Doctor inclut un contrôle de préparation de recherche mémoire et peut recommander `openclaw configure --section model` lorsque les identifiants d’embedding sont manquants.
- Doctor avertit lorsqu’aucun propriétaire de commandes n’est configuré. Le propriétaire de commandes est le compte opérateur humain autorisé à exécuter les commandes réservées au propriétaire et à approuver les actions dangereuses. L’appairage par message privé permet seulement à quelqu’un de parler au bot ; si vous avez approuvé un expéditeur avant l’existence de l’amorçage du premier propriétaire, définissez explicitement `commands.ownerAllowFrom`.
- Doctor avertit lorsque des agents en mode Codex sont configurés et que des ressources personnelles Codex CLI existent dans le répertoire personnel Codex de l’opérateur. Les lancements locaux du serveur d’application Codex utilisent des répertoires personnels isolés par agent ; utilisez donc `openclaw migrate codex --dry-run` pour inventorier les ressources qui doivent être promues délibérément.
- Doctor avertit lorsque des Skills autorisées pour l’agent par défaut sont indisponibles dans l’environnement d’exécution actuel parce que des binaires, variables d’environnement, configurations ou prérequis d’OS sont manquants. `doctor --fix` peut désactiver ces skills indisponibles avec `skills.entries.<skill>.enabled=false` ; installez/configurez plutôt le prérequis manquant lorsque vous voulez garder la skill active.
- Si le mode bac à sable est activé mais que Docker est indisponible, doctor signale un avertissement à fort signal avec une remédiation (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Si d’anciens fichiers de registre de bac à sable (`~/.openclaw/sandbox/containers.json` ou `~/.openclaw/sandbox/browsers.json`) sont présents, doctor les signale ; `openclaw doctor --fix` migre les entrées valides vers des répertoires de registre fragmentés et met en quarantaine les anciens fichiers invalides.
- Si `gateway.auth.token`/`gateway.auth.password` sont gérés par SecretRef et indisponibles dans le chemin de commande actuel, doctor signale un avertissement en lecture seule et n’écrit pas d’identifiants de secours en clair.
- Si l’inspection SecretRef d’un canal échoue dans un chemin de correction, doctor continue et signale un avertissement au lieu de quitter prématurément.
- Après les migrations de répertoire d’état, doctor avertit lorsque des comptes Telegram ou Discord par défaut activés dépendent d’un repli par variable d’environnement et que `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` est indisponible pour le processus doctor.
- La résolution automatique des noms d’utilisateur `allowFrom` de Telegram (`doctor --fix`) nécessite un jeton Telegram résolvable dans le chemin de commande actuel. Si l’inspection du jeton est indisponible, doctor signale un avertissement et ignore la résolution automatique pour cette passe.

## macOS : remplacements d’environnement `launchctl`

Si vous avez précédemment exécuté `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), cette valeur remplace votre fichier de configuration et peut provoquer des erreurs persistantes « unauthorized ».

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Liens associés

- [Référence CLI](/fr/cli)
- [Gateway doctor](/fr/gateway/doctor)
