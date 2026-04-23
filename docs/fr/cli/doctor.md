---
read_when:
    - Vous avez des problèmes de connectivité/authentification et souhaitez des correctifs guidés
    - Vous avez effectué une mise à jour et souhaitez une vérification de bon sens
summary: Référence CLI pour `openclaw doctor` (contrôles d’état + réparations guidées)
title: doctor
x-i18n:
    generated_at: "2026-04-23T07:01:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4b858e8726094c950edcde1e3bdff05d03ae2bd216c3519bbee4805955cf851
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Contrôles d’état + correctifs rapides pour la Gateway et les canaux.

Lié :

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
- `--repair` : appliquer les réparations recommandées sans demander de confirmation
- `--fix` : alias de `--repair`
- `--force` : appliquer des réparations agressives, y compris l’écrasement de configurations de service personnalisées si nécessaire
- `--non-interactive` : exécuter sans invites ; migrations sûres uniquement
- `--generate-gateway-token` : générer et configurer un jeton de Gateway
- `--deep` : analyser les services système à la recherche d’installations supplémentaires de la Gateway

Remarques :

- Les invites interactives (comme les correctifs keychain/OAuth) ne s’exécutent que lorsque stdin est un TTY et que `--non-interactive` n’est **pas** défini. Les exécutions sans interface (Cron, Telegram, sans terminal) ignoreront les invites.
- Performances : les exécutions non interactives de `doctor` ignorent le chargement anticipé des Plugins afin que les contrôles d’état sans interface restent rapides. Les sessions interactives chargent toujours entièrement les Plugins lorsqu’une vérification a besoin de leur contribution.
- `--fix` (alias de `--repair`) écrit une sauvegarde dans `~/.openclaw/openclaw.json.bak` et supprime les clés de configuration inconnues, en listant chaque suppression.
- Les contrôles d’intégrité d’état détectent désormais les fichiers de transcription orphelins dans le répertoire des sessions et peuvent les archiver en `.deleted.<timestamp>` pour récupérer de l’espace en toute sécurité.
- Doctor analyse également `~/.openclaw/cron/jobs.json` (ou `cron.store`) à la recherche d’anciens formats de tâches Cron et peut les réécrire sur place avant que le planificateur n’ait à les normaliser automatiquement à l’exécution.
- Doctor répare les dépendances d’exécution manquantes des Plugins intégrés sans nécessiter d’accès en écriture au package OpenClaw installé. Pour les installations npm détenues par root ou les unités systemd renforcées, définissez `OPENCLAW_PLUGIN_STAGE_DIR` sur un répertoire accessible en écriture tel que `/var/lib/openclaw/plugin-runtime-deps`.
- Doctor migre automatiquement l’ancienne configuration Talk plate (`talk.voiceId`, `talk.modelId` et assimilés) vers `talk.provider` + `talk.providers.<provider>`.
- Les exécutions répétées de `doctor --fix` ne signalent ni n’appliquent plus de normalisation Talk lorsque la seule différence est l’ordre des clés d’objet.
- Doctor inclut une vérification de préparation de la recherche mémoire et peut recommander `openclaw configure --section model` lorsque les identifiants d’intégration sont manquants.
- Si le mode sandbox est activé mais que Docker n’est pas disponible, doctor signale un avertissement à fort signal avec correction (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Si `gateway.auth.token`/`gateway.auth.password` sont gérés par SecretRef et indisponibles dans le chemin de commande actuel, doctor signale un avertissement en lecture seule et n’écrit pas d’identifiants de secours en clair.
- Si l’inspection SecretRef d’un canal échoue dans un chemin de correction, doctor continue et signale un avertissement au lieu de quitter prématurément.
- La résolution automatique des noms d’utilisateur Telegram `allowFrom` (`doctor --fix`) requiert un jeton Telegram résoluble dans le chemin de commande actuel. Si l’inspection du jeton n’est pas disponible, doctor signale un avertissement et ignore la résolution automatique pour ce passage.

## macOS : remplacements d’environnement `launchctl`

Si vous avez déjà exécuté `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), cette valeur remplace votre fichier de configuration et peut provoquer des erreurs persistantes de type « non autorisé ».

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
