---
read_when:
    - Vous utilisez encore `openclaw daemon ...` dans les scripts
    - Vous avez besoin des commandes de cycle de vie du service (install/start/stop/restart/status)
summary: Référence CLI pour `openclaw daemon` (alias hérité pour la gestion du service Gateway)
title: Démon
x-i18n:
    generated_at: "2026-04-30T07:17:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51839f7cbc180cc0c43caa2d7e83cc2add7cbca40665f83f64e6ce9dde8574dd
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

- `status` : affiche l’état d’installation du service et sonde l’état de santé du Gateway
- `install` : installe le service (`launchd`/`systemd`/`schtasks`)
- `uninstall` : supprime le service
- `start` : démarre le service
- `stop` : arrête le service
- `restart` : redémarre le service

## Options courantes

- `status` : `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install` : `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- cycle de vie (`uninstall|start|stop|restart`) : `--json`

Notes :

- `status` résout les SecretRefs d’authentification configurées pour l’authentification de la sonde lorsque c’est possible.
- Si une SecretRef d’authentification requise n’est pas résolue dans ce chemin de commande, `daemon status --json` signale `rpc.authWarning` lorsque la connectivité ou l’authentification de la sonde échoue ; passez explicitement `--token`/`--password` ou résolvez d’abord la source du secret.
- Si la sonde réussit, les avertissements d’auth-ref non résolue sont supprimés afin d’éviter les faux positifs.
- `status --deep` ajoute une analyse au niveau système, au mieux possible, du service. Lorsqu’elle trouve d’autres services de type Gateway, la sortie lisible par l’humain affiche des indications de nettoyage et avertit qu’un seul Gateway par machine reste la recommandation normale.
- Sur les installations systemd Linux, les vérifications de dérive de jeton de `status` incluent les deux sources d’unité `Environment=` et `EnvironmentFile=`.
- Les vérifications de dérive résolvent les SecretRefs `gateway.auth.token` à l’aide de l’environnement d’exécution fusionné (environnement de la commande de service d’abord, puis environnement de processus en repli).
- Si l’authentification par jeton n’est pas effectivement active (`gateway.auth.mode` explicite avec `password`/`none`/`trusted-proxy`, ou mode non défini lorsque le mot de passe peut l’emporter et qu’aucun candidat de jeton ne peut l’emporter), les vérifications de dérive de jeton ignorent la résolution du jeton de configuration.
- Lorsqu’une authentification par jeton nécessite un jeton et que `gateway.auth.token` est géré par SecretRef, `install` vérifie que la SecretRef peut être résolue, mais ne persiste pas le jeton résolu dans les métadonnées d’environnement du service.
- Si une authentification par jeton nécessite un jeton et que la SecretRef de jeton configurée n’est pas résolue, l’installation échoue de manière fermée.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation est bloquée jusqu’à ce que le mode soit défini explicitement.
- Sur macOS, `install` garde les plists LaunchAgent accessibles uniquement au propriétaire et charge les valeurs d’environnement du service géré via un fichier et un wrapper accessibles uniquement au propriétaire, au lieu de sérialiser des clés d’API ou des références d’environnement de profil d’authentification dans `EnvironmentVariables`.
- Si vous exécutez intentionnellement plusieurs Gateways sur un même hôte, isolez les ports, la configuration/l’état et les espaces de travail ; consultez [/gateway#multiple-gateways-same-host](/fr/gateway#multiple-gateways-same-host).

## Préférer

Utilisez [`openclaw gateway`](/fr/cli/gateway) pour la documentation et les exemples actuels.

## Connexe

- [Référence CLI](/fr/cli)
- [Runbook Gateway](/fr/gateway)
