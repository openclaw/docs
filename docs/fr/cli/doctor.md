---
read_when:
    - Vous rencontrez des problèmes de connectivité ou d’authentification et souhaitez une résolution guidée
    - Vous avez effectué une mise à jour et souhaitez une vérification de cohérence
summary: Référence CLI pour `openclaw doctor` (contrôles d’intégrité + réparations guidées)
title: Diagnostic
x-i18n:
    generated_at: "2026-05-12T08:45:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90050276597a50abcc3638e7b7b50f29ef0682f5da30d33d5dca3ad6117173e0
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Contrôles de santé + correctifs rapides pour le Gateway et les canaux.

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

Pour les autorisations propres à un canal, utilisez les sondes de canal au lieu de `doctor` :

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

La sonde de capacités Discord ciblée signale les autorisations effectives du bot dans le canal ; la sonde d’état audite les canaux Discord configurés et les cibles de jonction automatique vocale.

## Options

- `--no-workspace-suggestions` : désactiver les suggestions de mémoire/recherche de l’espace de travail
- `--yes` : accepter les valeurs par défaut sans demander de confirmation
- `--repair` : appliquer les réparations recommandées hors service sans demander de confirmation ; les installations et réécritures du service Gateway nécessitent toujours une confirmation interactive ou des commandes Gateway explicites
- `--fix` : alias de `--repair`
- `--force` : appliquer des réparations agressives, y compris l’écrasement de la configuration de service personnalisée si nécessaire
- `--non-interactive` : exécuter sans invites ; migrations sûres et réparations hors service uniquement
- `--generate-gateway-token` : générer et configurer un jeton Gateway
- `--deep` : analyser les services système pour rechercher des installations Gateway supplémentaires et signaler les transferts récents de redémarrage du superviseur Gateway

Remarques :

- En mode Nix (`OPENCLAW_NIX_MODE=1`), les contrôles `doctor` en lecture seule fonctionnent toujours, mais `doctor --fix`, `doctor --repair`, `doctor --yes` et `doctor --generate-gateway-token` sont désactivés, car `openclaw.json` est immuable. Modifiez plutôt la source Nix de cette installation ; pour nix-openclaw, utilisez le [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) centré sur l’agent.
- Les invites interactives (comme les correctifs keychain/OAuth) ne s’exécutent que lorsque stdin est un TTY et que `--non-interactive` n’est **pas** défini. Les exécutions sans interface (cron, Telegram, sans terminal) ignorent les invites.
- Performance : les exécutions non interactives de `doctor` ignorent le chargement anticipé des plugins afin que les contrôles de santé sans interface restent rapides. Les sessions interactives chargent toujours complètement les plugins lorsqu’un contrôle a besoin de leur contribution.
- `--fix` (alias de `--repair`) écrit une sauvegarde dans `~/.openclaw/openclaw.json.bak` et supprime les clés de configuration inconnues, en listant chaque suppression.
- `doctor --fix --non-interactive` signale les définitions de service Gateway manquantes ou obsolètes, mais ne les installe ni ne les réécrit en dehors du mode de réparation de mise à jour. Exécutez `openclaw gateway install` pour un service manquant, ou `openclaw gateway install --force` lorsque vous voulez intentionnellement remplacer le lanceur.
- Les contrôles d’intégrité d’état détectent désormais les fichiers de transcription orphelins dans le répertoire des sessions. Leur archivage sous forme de `.deleted.<timestamp>` nécessite une confirmation interactive ; `--fix`, `--yes` et les exécutions sans interface les laissent en place.
- Doctor analyse également `~/.openclaw/cron/jobs.json` (ou `cron.store`) à la recherche d’anciens formats de tâches cron et peut les réécrire sur place avant que le planificateur ne doive les normaliser automatiquement à l’exécution.
- Sous Linux, doctor avertit lorsque la crontab de l’utilisateur exécute encore l’ancien `~/.openclaw/bin/ensure-whatsapp.sh` ; ce script n’est plus maintenu et peut consigner à tort des pannes du Gateway WhatsApp lorsque cron n’a pas l’environnement de bus utilisateur systemd.
- Lorsque WhatsApp est activé, doctor recherche une boucle d’événements Gateway dégradée avec des clients `openclaw-tui` locaux encore en cours d’exécution. `doctor --fix` n’arrête que les clients TUI locaux vérifiés, afin que les réponses WhatsApp ne soient pas mises en file derrière des boucles d’actualisation TUI obsolètes.
- Doctor réécrit les références de modèle héritées `openai-codex/*` en références canoniques `openai/*` dans les modèles principaux, les fallbacks, les remplacements heartbeat/sous-agent/compaction, les hooks, les remplacements de modèle par canal et les anciens routages de session figés. `--fix` déplace l’intention Codex vers des entrées `agentRuntime.id: "codex"` à portée fournisseur/modèle, préserve les rattachements de profil d’authentification de session comme `openai-codex:...`, supprime les anciens rattachements d’exécution au niveau agent complet/session, et conserve les références d’agent OpenAI réparées sur le routage d’authentification Codex au lieu de l’authentification directe par clé API OpenAI.
- Doctor nettoie l’état hérité de préparation des dépendances de Plugin créé par d’anciennes versions d’OpenClaw et relie à nouveau le package hôte `openclaw` pour les plugins npm gérés qui le déclarent comme dépendance pair. Il répare aussi les plugins téléchargeables manquants qui sont référencés par la configuration, comme `plugins.entries`, les canaux configurés, les paramètres de fournisseur/recherche configurés ou les runtimes d’agent configurés. Pendant les mises à jour de package, doctor ignore la réparation des plugins par le gestionnaire de packages jusqu’à la fin du remplacement du package ; réexécutez ensuite `openclaw doctor --fix` si un plugin configuré doit encore être récupéré. Si le téléchargement échoue, doctor signale l’erreur d’installation et préserve l’entrée de plugin configurée pour la prochaine tentative de réparation.
- Doctor répare la configuration de plugin obsolète en supprimant les identifiants de plugins manquants de `plugins.allow`/`plugins.deny`/`plugins.entries`, ainsi que la configuration de canal pendante correspondante, les cibles heartbeat et les remplacements de modèle par canal lorsque la découverte de plugins est saine.
- Doctor met en quarantaine la configuration de plugin invalide en désactivant l’entrée `plugins.entries.<id>` concernée et en supprimant sa charge utile `config` invalide. Le démarrage du Gateway ignore déjà uniquement ce mauvais plugin afin que les autres plugins et canaux puissent continuer à fonctionner.
- Définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un autre superviseur possède le cycle de vie du Gateway. Doctor signale toujours la santé du Gateway/service et applique les réparations hors service, mais ignore l’installation, le démarrage, le redémarrage, l’amorçage du service et le nettoyage des services hérités.
- Sous Linux, doctor ignore les unités systemd inactives supplémentaires semblables au Gateway et ne réécrit pas les métadonnées de commande/point d’entrée d’un service Gateway systemd en cours d’exécution pendant la réparation. Arrêtez d’abord le service ou utilisez `openclaw gateway install --force` lorsque vous voulez intentionnellement remplacer le lanceur actif.
- Doctor migre automatiquement l’ancienne configuration Talk plate (`talk.voiceId`, `talk.modelId` et éléments associés) vers `talk.provider` + `talk.providers.<provider>`.
- Les exécutions répétées de `doctor --fix` ne signalent/appliquent plus la normalisation Talk lorsque la seule différence est l’ordre des clés d’objet.
- Doctor inclut un contrôle de préparation de la recherche mémoire et peut recommander `openclaw configure --section model` lorsque les identifiants d’embedding sont manquants.
- Doctor avertit lorsqu’aucun propriétaire de commande n’est configuré. Le propriétaire de commande est le compte opérateur humain autorisé à exécuter les commandes réservées au propriétaire et à approuver les actions dangereuses. L’appairage par DM permet seulement à quelqu’un de parler au bot ; si vous avez approuvé un expéditeur avant l’existence de l’amorçage du premier propriétaire, définissez explicitement `commands.ownerAllowFrom`.
- Doctor avertit lorsque des agents en mode Codex sont configurés et que des ressources personnelles Codex CLI existent dans le répertoire Codex home de l’opérateur. Les lancements locaux du serveur d’application Codex utilisent des répertoires home isolés par agent ; utilisez donc `openclaw migrate codex --dry-run` pour inventorier les ressources qui doivent être promues délibérément.
- Doctor supprime `plugins.entries.codex.config.codexDynamicToolsProfile`, qui est retiré ; le serveur d’application Codex conserve toujours les outils d’espace de travail natifs de Codex en mode natif.
- Doctor avertit lorsque les Skills autorisées pour l’agent par défaut sont indisponibles dans l’environnement d’exécution actuel parce que des binaires, variables d’environnement, configurations ou exigences d’OS manquent. `doctor --fix` peut désactiver ces skills indisponibles avec `skills.entries.<skill>.enabled=false` ; installez/configurez plutôt l’exigence manquante lorsque vous voulez garder la skill active.
- Si le mode sandbox est activé mais que Docker est indisponible, doctor signale un avertissement à fort signal avec une remédiation (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Si des fichiers de registre sandbox hérités (`~/.openclaw/sandbox/containers.json` ou `~/.openclaw/sandbox/browsers.json`) sont présents, doctor les signale ; `openclaw doctor --fix` migre les entrées valides vers des répertoires de registre segmentés et met en quarantaine les fichiers hérités invalides.
- Si `gateway.auth.token`/`gateway.auth.password` sont gérés par SecretRef et indisponibles dans le chemin de commande actuel, doctor signale un avertissement en lecture seule et n’écrit pas d’identifiants de secours en texte clair.
- Si l’inspection SecretRef du canal échoue dans un chemin de correction, doctor continue et signale un avertissement au lieu de quitter prématurément.
- Après les migrations du répertoire d’état, doctor avertit lorsque des comptes Telegram ou Discord par défaut activés dépendent d’un fallback d’environnement et que `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` est indisponible pour le processus doctor.
- La résolution automatique des noms d’utilisateur Telegram `allowFrom` (`doctor --fix`) nécessite un jeton Telegram résoluble dans le chemin de commande actuel. Si l’inspection du jeton est indisponible, doctor signale un avertissement et ignore la résolution automatique pour ce passage.

## macOS : remplacements d’environnement `launchctl`

Si vous avez précédemment exécuté `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), cette valeur remplace votre fichier de configuration et peut provoquer des erreurs « unauthorized » persistantes.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Associé

- [Référence CLI](/fr/cli)
- [Doctor du Gateway](/fr/gateway/doctor)
