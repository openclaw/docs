---
read_when:
    - Vous utilisez encore `openclaw daemon ...` dans les scripts
    - Il vous faut les commandes de cycle de vie du service (install/start/stop/restart/status)
summary: Référence CLI pour `openclaw daemon` (alias hérité pour la gestion du service Gateway)
title: Démon
x-i18n:
    generated_at: "2026-05-11T20:26:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0131c3838ac0240f38e755eb779134d19a935821d90bb2898648b947696be12e
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
- `restart` : `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- cycle de vie (`uninstall|start|stop`) : `--json`

Remarques :

- `status` résout les SecretRefs d’authentification configurées pour l’authentification de sondage lorsque c’est possible.
- Si une SecretRef d’authentification requise n’est pas résolue dans ce chemin de commande, `daemon status --json` signale `rpc.authWarning` lorsque la connectivité ou l’authentification du sondage échoue ; passez explicitement `--token`/`--password` ou résolvez d’abord la source du secret.
- Si le sondage réussit, les avertissements d’auth-ref non résolue sont supprimés pour éviter les faux positifs.
- `status --deep` ajoute une analyse de service au niveau système en mode meilleur effort. Lorsqu’elle trouve d’autres services de type gateway, la sortie lisible par l’humain affiche des conseils de nettoyage et avertit qu’un seul gateway par machine reste la recommandation normale.
- `status --deep` exécute aussi la validation de configuration en mode compatible avec les plugins et fait remonter les avertissements des manifestes de plugins configurés (par exemple des métadonnées de configuration de canal manquantes) afin que les smoke checks d’installation et de mise à jour les détectent. Le `status` par défaut conserve le chemin rapide en lecture seule qui ignore la validation des plugins.
- Sur les installations systemd Linux, les vérifications de dérive de jeton de `status` incluent les sources d’unité `Environment=` et `EnvironmentFile=`.
- Les vérifications de dérive résolvent les SecretRefs `gateway.auth.token` avec l’environnement d’exécution fusionné (d’abord l’environnement de commande de service, puis l’environnement de processus en repli).
- Si l’authentification par jeton n’est pas effectivement active (`gateway.auth.mode` explicite défini sur `password`/`none`/`trusted-proxy`, ou mode non défini où le mot de passe peut l’emporter et où aucun candidat de jeton ne peut l’emporter), les vérifications de dérive de jeton ignorent la résolution du jeton de configuration.
- Lorsqu’une authentification par jeton exige un jeton et que `gateway.auth.token` est géré par SecretRef, `install` valide que la SecretRef est résoluble, mais ne persiste pas le jeton résolu dans les métadonnées d’environnement du service.
- Si une authentification par jeton exige un jeton et que la SecretRef de jeton configurée n’est pas résolue, l’installation échoue de façon fermée.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation est bloquée jusqu’à ce que le mode soit défini explicitement.
- Sur macOS, `install` garde les plists LaunchAgent réservés au propriétaire et charge les valeurs d’environnement du service géré via un fichier et un wrapper réservés au propriétaire, au lieu de sérialiser des clés d’API ou des références d’environnement de profil d’authentification dans `EnvironmentVariables`.
- Si vous exécutez intentionnellement plusieurs gateways sur un même hôte, isolez les ports, la configuration/l’état et les espaces de travail ; consultez [/gateway#multiple-gateways-same-host](/fr/gateway#multiple-gateways-same-host).
- `restart --safe` demande au Gateway en cours d’exécution de faire un précontrôle du travail actif et de planifier un redémarrage unique coalescé après l’écoulement du travail actif. `restart` simple conserve le comportement existant du gestionnaire de service ; `--force` reste le chemin de contournement immédiat.
- `restart --safe --skip-deferral` exécute le redémarrage sûr compatible OpenClaw, mais contourne la porte de report liée au travail actif afin que le Gateway émette le redémarrage immédiatement même lorsque des bloqueurs sont signalés. C’est une échappatoire opérateur lorsqu’une exécution de tâche bloquée immobilise le redémarrage sûr ; nécessite `--safe`.

## Préférer

Utilisez [`openclaw gateway`](/fr/cli/gateway) pour la documentation et les exemples actuels.

## Connexe

- [Référence CLI](/fr/cli)
- [Runbook Gateway](/fr/gateway)
