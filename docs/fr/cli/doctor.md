---
read_when:
    - Vous avez des problèmes de connectivité/authentification et souhaitez des correctifs guidés
    - Vous avez effectué une mise à jour et souhaitez une vérification de cohérence
summary: Référence CLI pour `openclaw doctor` (vérifications d'état + réparations guidées)
title: Doctor
x-i18n:
    generated_at: "2026-04-26T11:26:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e2c21765f8c287c8d2aa066004ac516566c76a455337c377cf282551619e92a
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Vérifications d'état + correctifs rapides pour la gateway et les canaux.

Liens associés :

- Résolution des problèmes : [Résolution des problèmes](/fr/gateway/troubleshooting)
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

- `--no-workspace-suggestions` : désactiver les suggestions de mémoire/recherche de l'espace de travail
- `--yes` : accepter les valeurs par défaut sans demander
- `--repair` : appliquer les réparations recommandées sans demander
- `--fix` : alias de `--repair`
- `--force` : appliquer des réparations agressives, y compris l'écrasement de la configuration de service personnalisée si nécessaire
- `--non-interactive` : exécuter sans invites ; migrations sûres uniquement
- `--generate-gateway-token` : générer et configurer un jeton de gateway
- `--deep` : analyser les services système à la recherche d'installations supplémentaires de la gateway

Remarques :

- Les invites interactives (comme les correctifs de trousseau/OAuth) ne s'exécutent que lorsque stdin est un TTY et que `--non-interactive` n'est **pas** défini. Les exécutions sans interface (cron, Telegram, sans terminal) ignorent les invites.
- Performances : les exécutions non interactives de `doctor` ignorent le chargement anticipé des Plugins afin que les vérifications d'état sans interface restent rapides. Les sessions interactives chargent toujours complètement les Plugins lorsqu'une vérification a besoin de leur contribution.
- `--fix` (alias de `--repair`) écrit une sauvegarde dans `~/.openclaw/openclaw.json.bak` et supprime les clés de configuration inconnues, en listant chaque suppression.
- Les vérifications d'intégrité de l'état détectent désormais les fichiers de transcription orphelins dans le répertoire des sessions et peuvent les archiver en `.deleted.<timestamp>` pour récupérer de l'espace en toute sécurité.
- Doctor analyse aussi `~/.openclaw/cron/jobs.json` (ou `cron.store`) à la recherche d'anciens formats de tâches cron et peut les réécrire sur place avant que le planificateur n'ait à les auto-normaliser à l'exécution.
- Doctor répare les dépendances d'exécution manquantes des Plugins inclus sans écrire dans les installations globales packagées. Pour les installations npm détenues par root ou les unités systemd renforcées, définissez `OPENCLAW_PLUGIN_STAGE_DIR` sur un répertoire accessible en écriture tel que `/var/lib/openclaw/plugin-runtime-deps`.
- Définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu'un autre superviseur gère le cycle de vie de la gateway. Doctor continue de signaler l'état de santé de la gateway/du service et applique les réparations hors service, mais ignore l'installation/démarrage/redémarrage/amorce du service et le nettoyage des anciens services.
- Doctor migre automatiquement l'ancienne configuration Talk plate (`talk.voiceId`, `talk.modelId` et similaires) vers `talk.provider` + `talk.providers.<provider>`.
- Les exécutions répétées de `doctor --fix` ne signalent/appliquent plus de normalisation Talk lorsque la seule différence concerne l'ordre des clés de l'objet.
- Doctor inclut une vérification de préparation de la recherche mémoire et peut recommander `openclaw configure --section model` lorsque les identifiants d'embedding sont manquants.
- Si le mode sandbox est activé mais que Docker n'est pas disponible, doctor signale un avertissement à fort signal avec remédiation (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Si `gateway.auth.token`/`gateway.auth.password` sont gérés par SecretRef et indisponibles dans le chemin de commande actuel, doctor signale un avertissement en lecture seule et n'écrit pas d'identifiants de secours en clair.
- Si l'inspection de SecretRef du canal échoue dans un chemin de correctif, doctor continue et signale un avertissement au lieu de quitter prématurément.
- La résolution automatique des noms d'utilisateur Telegram `allowFrom` (`doctor --fix`) nécessite un jeton Telegram résolvable dans le chemin de commande actuel. Si l'inspection du jeton n'est pas disponible, doctor signale un avertissement et ignore la résolution automatique pour ce passage.

## macOS : surcharges d'environnement `launchctl`

Si vous avez déjà exécuté `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), cette valeur remplace votre fichier de configuration et peut provoquer des erreurs persistantes « unauthorized ».

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Liens associés

- [Référence CLI](/fr/cli)
- [Doctor de la gateway](/fr/gateway/doctor)
