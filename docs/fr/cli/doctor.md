---
read_when:
    - Vous rencontrez des problèmes de connectivité/d’authentification et souhaitez des corrections guidées
    - Vous avez effectué une mise à jour et souhaitez une vérification de cohérence
summary: Référence CLI pour `openclaw doctor` (contrôles d’intégrité + réparations guidées)
title: Diagnostic
x-i18n:
    generated_at: "2026-04-30T20:05:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 265d82a10da086cf89687886e491be018a720b70021e0b26bd8f39b25a907e14
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Contrôles de santé + corrections rapides pour le Gateway et les canaux.

Connexe :

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
- `--repair` : appliquer les réparations recommandées sans demander de confirmation
- `--fix` : alias de `--repair`
- `--force` : appliquer des réparations agressives, y compris l’écrasement de la configuration de service personnalisée si nécessaire
- `--non-interactive` : exécuter sans invites ; migrations sûres uniquement
- `--generate-gateway-token` : générer et configurer un jeton de Gateway
- `--deep` : analyser les services système pour détecter des installations supplémentaires du Gateway

Notes :

- Les invites interactives (comme les corrections de trousseau/OAuth) ne s’exécutent que lorsque stdin est un TTY et que `--non-interactive` n’est **pas** défini. Les exécutions sans interface (Cron, Telegram, sans terminal) ignorent les invites.
- Performances : les exécutions non interactives de `doctor` ignorent le chargement anticipé des plugins afin que les contrôles de santé sans interface restent rapides. Les sessions interactives chargent toujours entièrement les plugins lorsqu’un contrôle a besoin de leur contribution.
- `--fix` (alias de `--repair`) écrit une sauvegarde dans `~/.openclaw/openclaw.json.bak` et supprime les clés de configuration inconnues, en listant chaque suppression.
- Les contrôles d’intégrité d’état détectent désormais les fichiers de transcription orphelins dans le répertoire des sessions. Leur archivage en tant que `.deleted.<timestamp>` nécessite une confirmation interactive ; `--fix`, `--yes` et les exécutions sans interface les laissent en place.
- Doctor analyse aussi `~/.openclaw/cron/jobs.json` (ou `cron.store`) pour détecter les formes héritées de tâches Cron et peut les réécrire sur place avant que le planificateur doive les normaliser automatiquement à l’exécution.
- Doctor répare les dépendances d’exécution manquantes des plugins intégrés sans écrire dans les installations globales empaquetées. Pour les installations npm appartenant à root ou les unités systemd renforcées, définissez `OPENCLAW_PLUGIN_STAGE_DIR` sur un répertoire accessible en écriture comme `/var/lib/openclaw/plugin-runtime-deps` ; il peut aussi s’agir d’une liste de chemins comme `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps`, où les racines précédentes sont des couches de recherche en lecture seule et la racine finale est la cible de réparation.
- Doctor répare la configuration de plugin obsolète en supprimant les identifiants de plugin manquants de `plugins.allow`/`plugins.entries`, ainsi que la configuration de canal pendante correspondante, les cibles de Heartbeat et les remplacements de modèle de canal lorsque la découverte des plugins est saine.
- Doctor met en quarantaine la configuration de plugin invalide en désactivant l’entrée `plugins.entries.<id>` affectée et en supprimant sa charge utile `config` invalide. Le démarrage du Gateway ignore déjà uniquement ce mauvais plugin afin que les autres plugins et canaux puissent continuer à fonctionner.
- Définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un autre superviseur possède le cycle de vie du Gateway. Doctor signale toujours la santé du Gateway/service et applique les réparations qui ne concernent pas le service, mais ignore l’installation/le démarrage/le redémarrage/l’amorçage du service et le nettoyage des services hérités.
- Sous Linux, doctor ignore les unités systemd inactives supplémentaires ressemblant à un Gateway et ne réécrit pas les métadonnées de commande/point d’entrée pour un service Gateway systemd en cours d’exécution pendant la réparation. Arrêtez d’abord le service ou utilisez `openclaw gateway install --force` lorsque vous voulez intentionnellement remplacer le lanceur actif.
- Doctor migre automatiquement l’ancienne configuration Talk plate (`talk.voiceId`, `talk.modelId` et similaires) vers `talk.provider` + `talk.providers.<provider>`.
- Les exécutions répétées de `doctor --fix` ne signalent/n’appliquent plus la normalisation de Talk lorsque la seule différence est l’ordre des clés d’objet.
- Doctor inclut un contrôle de préparation de recherche en mémoire et peut recommander `openclaw configure --section model` lorsque les identifiants d’embedding sont manquants.
- Doctor avertit lorsqu’aucun propriétaire de commande n’est configuré. Le propriétaire de commande est le compte d’opérateur humain autorisé à exécuter les commandes réservées au propriétaire et à approuver les actions dangereuses. L’appairage en DM permet seulement à quelqu’un de parler au bot ; si vous avez approuvé un expéditeur avant l’existence de l’amorçage du premier propriétaire, définissez explicitement `commands.ownerAllowFrom`.
- Doctor avertit lorsque des agents en mode Codex sont configurés et que des ressources personnelles de la CLI Codex existent dans le répertoire Codex de l’opérateur. Les lancements locaux du serveur d’application Codex utilisent des répertoires isolés par agent ; utilisez donc `openclaw migrate codex --dry-run` pour inventorier les ressources qui doivent être promues délibérément.
- Si le mode bac à sable est activé mais que Docker n’est pas disponible, doctor signale un avertissement très pertinent avec une remédiation (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Si `gateway.auth.token`/`gateway.auth.password` sont gérés par SecretRef et indisponibles dans le chemin de commande actuel, doctor signale un avertissement en lecture seule et n’écrit pas d’identifiants de secours en texte brut.
- Si l’inspection SecretRef du canal échoue dans un chemin de correction, doctor continue et signale un avertissement au lieu de quitter prématurément.
- La résolution automatique des noms d’utilisateur Telegram `allowFrom` (`doctor --fix`) nécessite un jeton Telegram résolvable dans le chemin de commande actuel. Si l’inspection du jeton est indisponible, doctor signale un avertissement et ignore la résolution automatique pour cette passe.

## macOS : remplacements d’environnement `launchctl`

Si vous avez précédemment exécuté `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), cette valeur remplace votre fichier de configuration et peut provoquer des erreurs « non autorisé » persistantes.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Connexe

- [Référence CLI](/fr/cli)
- [Doctor du Gateway](/fr/gateway/doctor)
