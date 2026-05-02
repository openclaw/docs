---
read_when:
    - Vous utilisez encore `openclaw daemon ...` dans les scripts
    - Vous avez besoin des commandes du cycle de vie du service (install/start/stop/restart/status)
summary: Référence CLI pour `openclaw daemon` (alias hérité pour la gestion du service Gateway)
title: Démon
x-i18n:
    generated_at: "2026-05-02T22:17:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f11b75bf2781e69f6f59b23364f06cf359f9f24407f25f19b9d2186f7158512
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias hérité pour les commandes de gestion du service Gateway.

`openclaw daemon ...` correspond à la même surface de contrôle de service que les commandes de service `openclaw gateway ...`.

## Utilisation

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Sous-commandes

- `status` : afficher l’état d’installation du service et sonder l’état de santé du Gateway
- `install` : installer le service (`launchd`/`systemd`/`schtasks`)
- `uninstall` : supprimer le service
- `start` : démarrer le service
- `stop` : arrêter le service
- `restart` : redémarrer le service

## Options courantes

- `status` : `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install` : `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart` : `--force`, `--wait <duration>`, `--json`
- cycle de vie (`uninstall|start|stop`) : `--json`

Remarques :

- `status` résout les SecretRefs d’authentification configurés pour l’authentification de sonde lorsque c’est possible.
- Si un SecretRef d’authentification requis n’est pas résolu dans ce chemin de commande, `daemon status --json` signale `rpc.authWarning` lorsque la connectivité ou l’authentification de la sonde échoue ; passez explicitement `--token`/`--password` ou résolvez d’abord la source du secret.
- Si la sonde réussit, les avertissements d’auth-ref non résolues sont supprimés pour éviter les faux positifs.
- `status --deep` ajoute une analyse au niveau système, au mieux, du service. Lorsqu’elle trouve d’autres services similaires à un gateway, la sortie lisible affiche des indications de nettoyage et avertit qu’un seul gateway par machine reste la recommandation normale.
- Sur les installations Linux systemd, les vérifications de dérive du jeton de `status` incluent à la fois les sources d’unité `Environment=` et `EnvironmentFile=`.
- Les vérifications de dérive résolvent les SecretRefs `gateway.auth.token` à l’aide de l’environnement d’exécution fusionné (d’abord l’environnement de commande du service, puis l’environnement du processus en recours).
- Si l’authentification par jeton n’est pas effectivement active (`gateway.auth.mode` explicite défini sur `password`/`none`/`trusted-proxy`, ou mode non défini quand le mot de passe peut l’emporter et qu’aucun candidat de jeton ne peut l’emporter), les vérifications de dérive du jeton ignorent la résolution du jeton de configuration.
- Lorsque l’authentification par jeton exige un jeton et que `gateway.auth.token` est géré par SecretRef, `install` valide que le SecretRef est résoluble, mais ne persiste pas le jeton résolu dans les métadonnées d’environnement du service.
- Si l’authentification par jeton exige un jeton et que le SecretRef de jeton configuré n’est pas résolu, l’installation échoue de manière fermée.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation est bloquée jusqu’à ce que le mode soit défini explicitement.
- Sur macOS, `install` conserve les plists LaunchAgent réservées au propriétaire et charge les valeurs d’environnement du service géré via un fichier et un wrapper réservés au propriétaire, au lieu de sérialiser des clés API ou des références d’environnement de profil d’authentification dans `EnvironmentVariables`.
- Si vous exécutez intentionnellement plusieurs gateways sur un même hôte, isolez les ports, la configuration/l’état et les espaces de travail ; consultez [/gateway#multiple-gateways-same-host](/fr/gateway#multiple-gateways-same-host).

## Préférer

Utilisez [`openclaw gateway`](/fr/cli/gateway) pour la documentation et les exemples actuels.

## Associé

- [Référence CLI](/fr/cli)
- [Runbook Gateway](/fr/gateway)
