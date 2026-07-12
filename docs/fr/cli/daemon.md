---
read_when:
    - Vous utilisez toujours `openclaw daemon ...` dans les scripts
    - Vous avez besoin de commandes de gestion du cycle de vie du service (install/start/stop/restart/status)
summary: Référence de la CLI pour `openclaw daemon` (ancien alias pour la gestion du service Gateway)
title: Démon
x-i18n:
    generated_at: "2026-07-12T15:09:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4933885078d067ff2e077f25f14483aa5a10e3cd36951d0dc25c625d8b4d78e6
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias hérité pour la gestion du service Gateway. `openclaw daemon ...` correspond aux mêmes commandes de contrôle du service que `openclaw gateway ...`. Préférez [`openclaw gateway`](/fr/cli/gateway) pour la documentation et les exemples actuels.

## Utilisation

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Sous-commandes et options

| Sous-commande | Options                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `status`      | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install`     | `--port`, `--runtime <node\|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`            |
| `uninstall`   | `--json`                                                                                         |
| `start`       | `--json`                                                                                         |
| `stop`        | `--json`, `--disable` (launchd uniquement : désactive durablement KeepAlive/RunAtLoad jusqu'au prochain démarrage) |
| `restart`     | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status` : affiche l'état d'installation du service (launchd/systemd/schtasks) et vérifie l'état de santé du Gateway.
- `install` : installe le service ; `--force` réinstalle ou remplace une installation existante.
- `restart --safe` : demande au Gateway en cours d'exécution de vérifier au préalable les tâches actives et de planifier un redémarrage unique et regroupé après leur achèvement, dans la limite de `gateway.reload.deferralTimeoutMs` (valeur par défaut : 300000ms/5 minutes ; définissez-la sur `0` pour attendre indéfiniment). Lorsque ce délai expire, le redémarrage est tout de même forcé. Un simple `restart` utilise directement le gestionnaire de services ; `--force` permet un redémarrage immédiat.
- `restart --safe --skip-deferral` : contourne le mécanisme de report lié aux tâches actives afin que le Gateway redémarre immédiatement, même si des blocages sont signalés. Nécessite `--safe`.

## Remarques

- `status` résout, lorsque cela est possible, les SecretRefs d'authentification configurées pour l'authentification de la vérification. Si une SecretRef requise ne peut pas être résolue, `status --json` signale `rpc.authWarning` ; transmettez explicitement `--token`/`--password` ou résolvez d'abord la source du secret. Les avertissements d'authentification non résolue sont supprimés dès que la vérification réussit par ailleurs.
- `status --deep` ajoute une analyse système de bonne foi pour rechercher d'autres services similaires au Gateway (affiche des conseils de nettoyage ; il reste recommandé de n'utiliser qu'un seul Gateway par machine) et exécute la validation de la configuration en mode tenant compte des plugins, ce qui fait apparaître les avertissements des manifestes de plugins ignorés par le chemin rapide utilisé par défaut.
- Sur les installations Linux avec systemd, les vérifications de divergence du jeton inspectent les sources d'unité `Environment=` et `EnvironmentFile=`.
- Les vérifications de divergence du jeton résolvent les SecretRefs de `gateway.auth.token` à l'aide de l'environnement d'exécution fusionné (d'abord l'environnement de la commande du service, puis celui du processus). Si l'authentification par jeton n'est pas effectivement active (`gateway.auth.mode` défini sur `password`/`none`/`trusted-proxy`, ou non défini alors que le mot de passe peut être prioritaire), la résolution du jeton de configuration est ignorée.
- `install` vérifie qu'un `gateway.auth.token` géré par SecretRef peut être résolu, mais ne conserve jamais la valeur résolue dans les métadonnées d'environnement du service ; si la résolution échoue, l'installation est bloquée par sécurité.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés alors que `gateway.auth.mode` n'est pas défini, `install` reste bloqué jusqu'à ce que vous définissiez explicitement le mode.
- Sur macOS, `install` réserve au propriétaire l'accès aux fichiers plist LaunchAgent ainsi qu'au fichier d'environnement et au wrapper générés (mode `0600`/`0700`), au lieu d'intégrer les secrets dans `EnvironmentVariables`.
- Pour exécuter plusieurs Gateways sur un même hôte, isolez les ports, la configuration, l'état et les espaces de travail. Consultez [Plusieurs gateways](/fr/gateway#multiple-gateways-same-host).

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Guide d'exploitation du Gateway](/fr/gateway)
