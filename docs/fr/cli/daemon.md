---
read_when:
    - Vous utilisez encore `openclaw daemon ...` dans les scripts
    - Vous avez besoin des commandes de cycle de vie du service (install/start/stop/restart/status)
summary: Référence CLI pour `openclaw daemon` (alias historique pour la gestion du service Gateway)
title: Démon
x-i18n:
    generated_at: "2026-05-04T18:23:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84e11fc50bdf38da518a8fcf415ae461a2688c2299f996eee384357c0d04a05
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

- `status` : afficher l’état d’installation du service et vérifier la santé du Gateway
- `install` : installer le service (`launchd`/`systemd`/`schtasks`)
- `uninstall` : supprimer le service
- `start` : démarrer le service
- `stop` : arrêter le service
- `restart` : redémarrer le service

## Options courantes

- `status` : `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install` : `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart` : `--safe`, `--force`, `--wait <duration>`, `--json`
- cycle de vie (`uninstall|start|stop`) : `--json`

Notes :

- `status` résout les SecretRefs d’authentification configurées pour l’authentification de vérification lorsque c’est possible.
- Si une SecretRef d’authentification requise n’est pas résolue dans ce chemin de commande, `daemon status --json` signale `rpc.authWarning` lorsque la connectivité ou l’authentification de vérification échoue ; passez explicitement `--token`/`--password` ou résolvez d’abord la source secrète.
- Si la vérification réussit, les avertissements d’auth-ref non résolue sont supprimés pour éviter les faux positifs.
- `status --deep` ajoute une analyse de service au niveau système au mieux. Lorsqu’elle trouve d’autres services de type gateway, la sortie lisible affiche des conseils de nettoyage et avertit qu’un gateway par machine reste la recommandation normale.
- Sur les installations Linux systemd, les vérifications de dérive de jeton de `status` incluent les sources d’unité `Environment=` et `EnvironmentFile=`.
- Les vérifications de dérive résolvent les SecretRefs `gateway.auth.token` en utilisant l’environnement d’exécution fusionné (d’abord l’environnement de commande de service, puis l’environnement du processus en repli).
- Si l’authentification par jeton n’est pas effectivement active (`gateway.auth.mode` explicite défini sur `password`/`none`/`trusted-proxy`, ou mode non défini lorsque le mot de passe peut l’emporter et qu’aucun candidat de jeton ne peut l’emporter), les vérifications de dérive de jeton ignorent la résolution du jeton de configuration.
- Lorsque l’authentification par jeton exige un jeton et que `gateway.auth.token` est géré par SecretRef, `install` vérifie que la SecretRef peut être résolue, mais ne persiste pas le jeton résolu dans les métadonnées d’environnement du service.
- Si l’authentification par jeton exige un jeton et que la SecretRef de jeton configurée n’est pas résolue, l’installation échoue de façon fermée.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation est bloquée jusqu’à ce que le mode soit défini explicitement.
- Sur macOS, `install` conserve les plists LaunchAgent accessibles uniquement au propriétaire et charge les valeurs d’environnement de service gérées via un fichier et un wrapper accessibles uniquement au propriétaire au lieu de sérialiser des clés API ou des références d’environnement de profil d’authentification dans `EnvironmentVariables`.
- Si vous exécutez intentionnellement plusieurs gateways sur un même hôte, isolez les ports, la configuration/l’état et les espaces de travail ; consultez [/gateway#multiple-gateways-same-host](/fr/gateway#multiple-gateways-same-host).
- `restart --safe` demande au Gateway en cours d’exécution de précontrôler le travail actif et de planifier un redémarrage coalescé une fois le travail actif écoulé. `restart` simple conserve le comportement existant du gestionnaire de service ; `--force` reste le chemin de remplacement immédiat.

## Préférer

Utilisez [`openclaw gateway`](/fr/cli/gateway) pour la documentation et les exemples actuels.

## Voir aussi

- [Référence CLI](/fr/cli)
- [Runbook Gateway](/fr/gateway)
