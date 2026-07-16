---
read_when:
    - Vous utilisez encore `openclaw daemon ...` dans les scripts
    - Vous avez besoin de commandes de gestion du cycle de vie du service (installation/démarrage/arrêt/redémarrage/état)
summary: Référence de la CLI pour `openclaw daemon` (ancien alias pour la gestion du service Gateway)
title: Démon
x-i18n:
    generated_at: "2026-07-16T13:04:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a5e08114a8a0de959b54fcb0fcef88b880424fd89c133f7c383f254d18f0d71d
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias historique pour la gestion du service Gateway. `openclaw daemon ...` correspond aux mêmes commandes de contrôle du service que `openclaw gateway ...`. Préférez [`openclaw gateway`](/fr/cli/gateway) pour la documentation et les exemples actuels.

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

| Sous-commande  | Options                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install`   | `--port`, `--runtime <node>`, `--token`, `--wrapper <path>`, `--force`, `--json`                 |
| `uninstall` | `--json`                                                                                         |
| `start`     | `--json`                                                                                         |
| `stop`      | `--json`, `--disable` (launchd uniquement : désactive durablement KeepAlive/RunAtLoad jusqu’au prochain démarrage) |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status` : affiche l’état d’installation du service (launchd/systemd/schtasks) et vérifie l’état du Gateway.
- `install` : installe le service ; `--force` réinstalle ou remplace une installation existante.
- `restart --safe` : demande au Gateway en cours d’exécution de contrôler préalablement les travaux actifs et de planifier un redémarrage regroupé une fois ceux-ci terminés, dans la limite de `gateway.reload.deferralTimeoutMs` (par défaut 300000ms/5 minutes ; définissez cette valeur sur `0` pour attendre indéfiniment). Lorsque ce délai expire, le redémarrage est tout de même forcé. La commande `restart` sans option utilise directement le gestionnaire de services ; `--force` permet un remplacement immédiat.
- `restart --safe --skip-deferral` : contourne le mécanisme de report lié aux travaux actifs afin que le Gateway redémarre immédiatement, même si des blocages sont signalés. Nécessite `--safe`.

## Remarques

- `status` résout si possible les SecretRefs d’authentification configurées pour l’authentification de la vérification. Si une SecretRef requise n’est pas résolue, `status --json` signale `rpc.authWarning` ; transmettez explicitement `--token`/`--password` ou résolvez d’abord la source du secret. Les avertissements d’authentification non résolue sont supprimés dès que la vérification réussit par ailleurs.
- `status --deep` ajoute une analyse système au mieux pour rechercher d’autres services similaires à un Gateway (affiche des conseils de nettoyage ; la recommandation reste d’utiliser un seul Gateway par machine) et exécute la validation de la configuration en mode tenant compte des plugins, afin d’afficher les avertissements des manifestes de plugins ignorés par le chemin rapide utilisé par défaut.
- Sur les installations Linux utilisant systemd, les contrôles de divergence des jetons examinent les sources d’unités `Environment=` et `EnvironmentFile=`.
- Les contrôles de divergence des jetons résolvent les SecretRefs `gateway.auth.token` à l’aide de l’environnement d’exécution fusionné (d’abord l’environnement de la commande du service, puis celui du processus). Si l’authentification par jeton n’est pas effectivement active (`gateway.auth.mode` parmi `password`/`none`/`trusted-proxy`, ou non défini lorsqu’un mot de passe peut prévaloir), la résolution du jeton de configuration est ignorée.
- `install` vérifie qu’un `gateway.auth.token` géré par SecretRef peut être résolu, mais ne conserve jamais la valeur résolue dans les métadonnées d’environnement du service ; si la résolution échoue, l’installation échoue de manière sécurisée.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, `install` reste bloqué jusqu’à ce que vous définissiez explicitement le mode.
- Sous macOS, `install` réserve au propriétaire l’accès aux fichiers plist LaunchAgent ainsi qu’au fichier d’environnement et au wrapper générés (mode `0600`/`0700`), au lieu d’intégrer les secrets dans `EnvironmentVariables`.
- Pour exécuter plusieurs Gateways sur un même hôte, isolez les ports, la configuration et l’état, ainsi que les espaces de travail. Consultez [Plusieurs Gateways](/fr/gateway#multiple-gateways-same-host).

## Pages connexes

- [Référence de la CLI](/fr/cli)
- [Guide opérationnel du Gateway](/fr/gateway)
