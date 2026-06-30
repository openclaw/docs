---
read_when:
    - Vous utilisez encore `openclaw daemon ...` dans les scripts
    - Vous avez besoin des commandes de cycle de vie du service (install/start/stop/restart/status)
summary: Référence CLI pour `openclaw daemon` (alias hérité pour la gestion du service Gateway)
title: Démon
x-i18n:
    generated_at: "2026-06-30T13:59:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a3ec72b22907994ecefac84b2b9e5b22bf1d922e5b2822a1c0db80f0362dade
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias hérité pour les commandes de gestion du service Gateway.

`openclaw daemon ...` correspond à la même surface de contrôle du service que les commandes de service `openclaw gateway ...`.

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

- `status` résout les SecretRefs d’authentification configurées pour l’authentification de sonde lorsque c’est possible.
- Si une SecretRef d’authentification requise n’est pas résolue dans ce chemin de commande, `daemon status --json` signale `rpc.authWarning` lorsque la connectivité/l’authentification de la sonde échoue ; passez explicitement `--token`/`--password` ou résolvez d’abord la source du secret.
- Si la sonde réussit, les avertissements liés aux références d’authentification non résolues sont supprimés afin d’éviter les faux positifs.
- `status --deep` ajoute une analyse de service au niveau système au mieux. Lorsqu’elle trouve d’autres services de type gateway, la sortie destinée aux humains affiche des indications de nettoyage et avertit qu’un seul gateway par machine reste la recommandation normale.
- `status --deep` exécute aussi la validation de configuration en mode tenant compte des plugins et expose les avertissements de manifeste des plugins configurés (par exemple des métadonnées de configuration de canal manquantes), afin que les vérifications rapides d’installation et de mise à jour les détectent. Le `status` par défaut conserve le chemin rapide en lecture seule qui ignore la validation des plugins.
- Sur les installations Linux systemd, les contrôles de dérive de jeton de `status` incluent les deux sources d’unité `Environment=` et `EnvironmentFile=`.
- Les contrôles de dérive résolvent les SecretRefs `gateway.auth.token` avec l’environnement d’exécution fusionné (d’abord l’environnement de la commande de service, puis l’environnement du processus en repli).
- Si l’authentification par jeton n’est pas effectivement active (`gateway.auth.mode` explicitement défini sur `password`/`none`/`trusted-proxy`, ou mode non défini lorsque le mot de passe peut prévaloir et qu’aucun candidat jeton ne peut prévaloir), les contrôles de dérive de jeton ignorent la résolution du jeton de configuration.
- Lorsque l’authentification par jeton exige un jeton et que `gateway.auth.token` est géré par SecretRef, `install` vérifie que la SecretRef peut être résolue, mais ne persiste pas le jeton résolu dans les métadonnées d’environnement du service.
- Si l’authentification par jeton exige un jeton et que la SecretRef de jeton configurée n’est pas résolue, l’installation échoue en mode fermé.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation est bloquée jusqu’à ce que le mode soit défini explicitement.
- Sur macOS, `install` garde les plists LaunchAgent réservées au propriétaire et charge les valeurs d’environnement du service géré via un fichier et un wrapper réservés au propriétaire, au lieu de sérialiser des clés API ou des références d’environnement de profil d’authentification dans `EnvironmentVariables`.
- Si vous exécutez intentionnellement plusieurs gateways sur un même hôte, isolez les ports, la configuration/l’état et les espaces de travail ; consultez [/gateway#multiple-gateways-same-host](/fr/gateway#multiple-gateways-same-host).
- `restart --safe` demande au Gateway en cours d’exécution de vérifier au préalable le travail actif et de planifier un redémarrage coalescé après l’évacuation du travail actif. Le redémarrage sûr par défaut attend le travail actif jusqu’au `gateway.reload.deferralTimeoutMs` configuré (5 minutes par défaut) ; lorsque ce budget expire, le redémarrage est forcé. Définissez `gateway.reload.deferralTimeoutMs` sur `0` pour une attente sûre indéfinie qui ne force jamais. `restart` simple conserve le comportement existant du gestionnaire de service ; `--force` reste le chemin de remplacement immédiat.
- `restart --safe --skip-deferral` exécute le redémarrage sûr tenant compte d’OpenClaw, mais contourne la barrière de report du travail actif afin que le Gateway émette le redémarrage immédiatement même lorsque des bloqueurs sont signalés. Échappatoire opérateur lorsqu’une exécution de tâche bloquée empêche le redémarrage sûr ; nécessite `--safe`.

## Préférer

Utilisez [`openclaw gateway`](/fr/cli/gateway) pour la documentation et les exemples actuels.

## Liens connexes

- [Référence CLI](/fr/cli)
- [Guide d’exploitation du Gateway](/fr/gateway)
