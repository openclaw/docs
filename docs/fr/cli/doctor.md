---
read_when:
    - Vous rencontrez des problèmes de connectivité/d’authentification et souhaitez des correctifs guidés
    - Vous avez effectué une mise à jour et souhaitez une vérification de cohérence
summary: Référence CLI pour `openclaw doctor` (contrôles d’intégrité + réparations guidées)
title: Diagnostic
x-i18n:
    generated_at: "2026-04-30T07:17:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9985c84d23861dd9468a4659ee00519573fe6d540c436548da0a68067dbabc4c
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Contrôles d’intégrité + corrections rapides pour le Gateway et les canaux.

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

- `--no-workspace-suggestions` : désactive les suggestions de mémoire/recherche de l’espace de travail
- `--yes` : accepte les valeurs par défaut sans demander de confirmation
- `--repair` : applique les réparations recommandées sans demander de confirmation
- `--fix` : alias de `--repair`
- `--force` : applique des réparations agressives, y compris l’écrasement de la configuration de service personnalisée si nécessaire
- `--non-interactive` : exécute sans invites ; migrations sûres uniquement
- `--generate-gateway-token` : génère et configure un jeton de Gateway
- `--deep` : analyse les services système à la recherche d’installations supplémentaires du Gateway

Remarques :

- Les invites interactives (comme les corrections de trousseau/OAuth) ne s’exécutent que lorsque stdin est un TTY et que `--non-interactive` n’est **pas** défini. Les exécutions sans interface (Cron, Telegram, sans terminal) ignoreront les invites.
- Performances : les exécutions non interactives de `doctor` ignorent le chargement anticipé des Plugins afin que les contrôles d’intégrité sans interface restent rapides. Les sessions interactives chargent toujours complètement les Plugins lorsqu’un contrôle nécessite leur contribution.
- `--fix` (alias de `--repair`) écrit une sauvegarde dans `~/.openclaw/openclaw.json.bak` et supprime les clés de configuration inconnues, en listant chaque suppression.
- Les contrôles d’intégrité d’état détectent désormais les fichiers de transcription orphelins dans le répertoire des sessions. Les archiver sous forme de `.deleted.<timestamp>` nécessite une confirmation interactive ; `--fix`, `--yes` et les exécutions sans interface les laissent en place.
- Doctor analyse également `~/.openclaw/cron/jobs.json` (ou `cron.store`) pour détecter les anciens formats de tâches Cron et peut les réécrire sur place avant que le planificateur doive les normaliser automatiquement à l’exécution.
- Doctor répare les dépendances d’exécution manquantes des Plugins intégrés sans écrire dans les installations globales empaquetées. Pour les installations npm détenues par root ou les unités systemd renforcées, définissez `OPENCLAW_PLUGIN_STAGE_DIR` sur un répertoire accessible en écriture comme `/var/lib/openclaw/plugin-runtime-deps` ; il peut aussi s’agir d’une liste de chemins comme `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps`, où les racines précédentes sont des couches de recherche en lecture seule et la racine finale est la cible de réparation.
- Doctor répare les configurations de Plugin obsolètes en supprimant les identifiants de Plugin manquants de `plugins.allow`/`plugins.entries`, ainsi que la configuration de canal pendante correspondante, les cibles Heartbeat et les remplacements de modèle de canal lorsque la découverte des Plugins est saine.
- Doctor met en quarantaine les configurations de Plugin invalides en désactivant l’entrée `plugins.entries.<id>` concernée et en supprimant sa charge utile `config` invalide. Le démarrage du Gateway ignore déjà uniquement ce mauvais Plugin afin que les autres Plugins et canaux puissent continuer à fonctionner.
- Définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un autre superviseur gère le cycle de vie du Gateway. Doctor signale toujours l’état du Gateway/service et applique les réparations hors service, mais ignore l’installation/le démarrage/le redémarrage/le bootstrap du service et le nettoyage des anciens services.
- Sous Linux, doctor ignore les unités systemd supplémentaires de type Gateway inactives et ne réécrit pas les métadonnées de commande/point d’entrée pour un service Gateway systemd en cours d’exécution pendant la réparation. Arrêtez d’abord le service ou utilisez `openclaw gateway install --force` lorsque vous voulez intentionnellement remplacer le lanceur actif.
- Doctor migre automatiquement l’ancienne configuration Talk plate (`talk.voiceId`, `talk.modelId` et éléments associés) vers `talk.provider` + `talk.providers.<provider>`.
- Les exécutions répétées de `doctor --fix` ne signalent/appliquent plus la normalisation Talk lorsque la seule différence est l’ordre des clés d’objet.
- Doctor inclut un contrôle de préparation de la recherche mémoire et peut recommander `openclaw configure --section model` lorsque les identifiants d’embedding sont manquants.
- Doctor avertit lorsqu’aucun propriétaire de commande n’est configuré. Le propriétaire de commande est le compte opérateur humain autorisé à exécuter les commandes réservées au propriétaire et à approuver les actions dangereuses. L’association par DM permet seulement à quelqu’un de parler au bot ; si vous avez approuvé un expéditeur avant l’existence du bootstrap du premier propriétaire, définissez explicitement `commands.ownerAllowFrom`.
- Si le mode sandbox est activé mais que Docker est indisponible, doctor signale un avertissement à fort signal avec une remédiation (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Si `gateway.auth.token`/`gateway.auth.password` sont gérés par SecretRef et indisponibles dans le chemin de commande actuel, doctor signale un avertissement en lecture seule et n’écrit pas d’identifiants de secours en clair.
- Si l’inspection SecretRef d’un canal échoue dans un chemin de correction, doctor continue et signale un avertissement au lieu de quitter prématurément.
- La résolution automatique des noms d’utilisateur Telegram `allowFrom` (`doctor --fix`) nécessite un jeton Telegram résoluble dans le chemin de commande actuel. Si l’inspection du jeton est indisponible, doctor signale un avertissement et ignore la résolution automatique pour cette passe.

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
