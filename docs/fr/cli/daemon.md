---
read_when:
    - Vous utilisez encore `openclaw daemon ...` dans les scripts
    - Vous avez besoin de commandes de gestion du cycle de vie du service (installation/démarrage/arrêt/redémarrage/état)
summary: Référence de la CLI pour `openclaw daemon` (ancien alias pour la gestion du service Gateway)
title: Démon
x-i18n:
    generated_at: "2026-07-12T02:29:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4933885078d067ff2e077f25f14483aa5a10e3cd36951d0dc25c625d8b4d78e6
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Ancien alias pour la gestion du service Gateway. `openclaw daemon ...` correspond aux mêmes commandes de contrôle du service que `openclaw gateway ...`. Privilégiez [`openclaw gateway`](/fr/cli/gateway) pour la documentation et les exemples actuels.

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

| Sous-commande | Options                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `status`      | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`                                     |
| `install`     | `--port`, `--runtime <node\|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`                                                |
| `uninstall`   | `--json`                                                                                                                             |
| `start`       | `--json`                                                                                                                             |
| `stop`        | `--json`, `--disable` (launchd uniquement : désactive durablement KeepAlive/RunAtLoad jusqu'au prochain démarrage)                   |
| `restart`     | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                                                                |

- `status` : affiche l'état d'installation du service (launchd/systemd/schtasks) et vérifie le bon fonctionnement du Gateway.
- `install` : installe le service ; `--force` réinstalle ou remplace une installation existante.
- `restart --safe` : demande au Gateway en cours d'exécution de vérifier préalablement les tâches actives et de programmer un redémarrage unique et regroupé une fois celles-ci terminées, dans la limite définie par `gateway.reload.deferralTimeoutMs` (300000 ms/5 minutes par défaut ; définissez la valeur sur `0` pour attendre indéfiniment). À l'expiration de ce délai, le redémarrage est tout de même forcé. La commande `restart` seule utilise directement le gestionnaire de services ; `--force` permet un redémarrage immédiat.
- `restart --safe --skip-deferral` : contourne le mécanisme de report lié aux tâches actives afin que le Gateway redémarre immédiatement, même si des blocages sont signalés. Nécessite `--safe`.

## Remarques

- `status` résout, lorsque cela est possible, les SecretRefs d'authentification configurées pour authentifier la vérification. Si une SecretRef requise n'est pas résolue, `status --json` le signale dans `rpc.authWarning` ; transmettez explicitement `--token`/`--password` ou résolvez d'abord la source du secret. Les avertissements d'authentification non résolue sont supprimés dès lors que la vérification réussit par ailleurs.
- `status --deep` ajoute une analyse système, sans garantie de résultat, afin de détecter d'autres services similaires à un Gateway (elle affiche des conseils de nettoyage ; il reste recommandé de n'utiliser qu'un seul Gateway par machine) et exécute la validation de la configuration en tenant compte des plugins, ce qui fait apparaître les avertissements des manifestes de plugins ignorés par le parcours rapide utilisé par défaut.
- Pour les installations systemd sous Linux, les vérifications de divergence du jeton examinent les sources d'unité `Environment=` et `EnvironmentFile=`.
- Les vérifications de divergence du jeton résolvent les SecretRefs de `gateway.auth.token` à l'aide de l'environnement d'exécution fusionné (d'abord l'environnement de la commande du service, puis celui du processus). Si l'authentification par jeton n'est pas réellement active (`gateway.auth.mode` défini sur `password`/`none`/`trusted-proxy`, ou non défini alors que le mot de passe peut prévaloir), la résolution du jeton de configuration est ignorée.
- `install` vérifie qu'un `gateway.auth.token` géré par une SecretRef peut être résolu, mais ne conserve jamais la valeur résolue dans les métadonnées d'environnement du service ; si la résolution échoue, l'installation est bloquée par sécurité.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés alors que `gateway.auth.mode` n'est pas défini, `install` reste bloqué jusqu'à ce que vous définissiez explicitement le mode.
- Sous macOS, `install` réserve au propriétaire l'accès aux fichiers plist LaunchAgent ainsi qu'au fichier d'environnement et au wrapper générés (modes `0600`/`0700`), au lieu d'intégrer les secrets dans `EnvironmentVariables`.
- Pour exécuter plusieurs Gateways sur un même hôte, isolez les ports, la configuration, l'état et les espaces de travail. Consultez [Plusieurs Gateways](/fr/gateway#multiple-gateways-same-host).

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Guide opérationnel du Gateway](/fr/gateway)
