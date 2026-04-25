---
read_when:
    - Vous avez des problèmes de connectivité/authentification et souhaitez des correctifs guidés
    - Vous avez effectué une mise à jour et souhaitez une vérification rapide de cohérence
summary: Référence CLI pour `openclaw doctor` (contrôles d’intégrité + réparations guidées)
title: Doctor
x-i18n:
    generated_at: "2026-04-25T13:43:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e185d17d91d1677d0b16152d022b633d012d22d484bd9961820b200d5c4ce5
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Contrôles d’intégrité + correctifs rapides pour la gateway et les canaux.

Voir aussi :

- Dépannage : [Troubleshooting](/fr/gateway/troubleshooting)
- Audit de sécurité : [Security](/fr/gateway/security)

## Exemples

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Options

- `--no-workspace-suggestions` : désactiver les suggestions de mémoire/recherche de l’espace de travail
- `--yes` : accepter les valeurs par défaut sans demander de confirmation
- `--repair` : appliquer les réparations recommandées sans demander de confirmation
- `--fix` : alias de `--repair`
- `--force` : appliquer des réparations agressives, y compris l’écrasement de configurations de service personnalisées si nécessaire
- `--non-interactive` : exécuter sans invites ; migrations sûres uniquement
- `--generate-gateway-token` : générer et configurer un jeton de gateway
- `--deep` : analyser les services système pour détecter des installations supplémentaires de gateway

Remarques :

- Les invites interactives (comme les correctifs de trousseau/OAuth) ne s’exécutent que lorsque stdin est un TTY et que `--non-interactive` n’est **pas** défini. Les exécutions headless (Cron, Telegram, sans terminal) ignoreront les invites.
- Performances : les exécutions non interactives de `doctor` ignorent le chargement anticipé des plugins afin que les contrôles d’intégrité headless restent rapides. Les sessions interactives continuent à charger complètement les plugins lorsqu’un contrôle a besoin de leur contribution.
- `--fix` (alias de `--repair`) écrit une sauvegarde dans `~/.openclaw/openclaw.json.bak` et supprime les clés de configuration inconnues, en listant chaque suppression.
- Les vérifications d’intégrité d’état détectent désormais les fichiers de transcription orphelins dans le répertoire des sessions et peuvent les archiver en `.deleted.<timestamp>` afin de récupérer de l’espace en toute sécurité.
- Doctor analyse aussi `~/.openclaw/cron/jobs.json` (ou `cron.store`) à la recherche d’anciens formats de tâches Cron et peut les réécrire sur place avant que le planificateur n’ait à les auto-normaliser à l’exécution.
- Doctor répare les dépendances d’exécution manquantes des plugins inclus sans écrire dans les installations globales packagées. Pour les installations npm appartenant à root ou les unités systemd renforcées, définissez `OPENCLAW_PLUGIN_STAGE_DIR` vers un répertoire accessible en écriture comme `/var/lib/openclaw/plugin-runtime-deps`.
- Doctor migre automatiquement l’ancienne configuration Talk plate (`talk.voiceId`, `talk.modelId` et autres) vers `talk.provider` + `talk.providers.<provider>`.
- Les exécutions répétées de `doctor --fix` ne signalent/n’appliquent plus la normalisation Talk lorsque la seule différence est l’ordre des clés d’objet.
- Doctor inclut un contrôle d’état de préparation de la recherche mémoire et peut recommander `openclaw configure --section model` lorsque les identifiants d’embedding sont manquants.
- Si le mode sandbox est activé mais que Docker n’est pas disponible, doctor signale un avertissement à fort signal avec une remédiation (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Si `gateway.auth.token`/`gateway.auth.password` sont gérés par SecretRef et indisponibles dans le chemin de commande actuel, doctor signale un avertissement en lecture seule et n’écrit pas d’identifiants de secours en clair.
- Si l’inspection SecretRef d’un canal échoue dans un chemin de correction, doctor continue et signale un avertissement au lieu de quitter prématurément.
- La résolution automatique des noms d’utilisateur Telegram dans `allowFrom` (`doctor --fix`) nécessite un jeton Telegram résoluble dans le chemin de commande actuel. Si l’inspection du jeton n’est pas disponible, doctor signale un avertissement et ignore la résolution automatique pour cette exécution.

## macOS : remplacements d’environnement `launchctl`

Si vous avez déjà exécuté `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), cette valeur remplace votre fichier de configuration et peut provoquer des erreurs persistantes de type « unauthorized ».

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Voir aussi

- [Référence CLI](/fr/cli)
- [Gateway doctor](/fr/gateway/doctor)
