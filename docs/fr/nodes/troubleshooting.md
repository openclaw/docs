---
read_when:
    - Le Node est connecté, mais les outils de caméra, de canevas, d’écran et d’exécution échouent
    - Vous devez comprendre le modèle mental qui distingue l’appairage des nodes des approbations.
summary: Résoudre les problèmes d’appairage des Node, d’exécution au premier plan, d’autorisations et de défaillances des outils
title: Dépannage de Node
x-i18n:
    generated_at: "2026-07-12T02:47:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53d082dcd2f4bb022eb683d72d193dbb6800b5a81a8f5ab9506d82feaa0dbc49
    source_path: nodes/troubleshooting.md
    workflow: 16
---

Utilisez cette page lorsqu’un Node est visible dans l’état, mais que les outils du Node échouent.

## Séquence de commandes

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Exécutez ensuite les vérifications propres au Node :

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Signes de bon fonctionnement :

- Le Node est connecté et appairé pour le rôle `node`.
- `nodes describe` inclut la fonctionnalité que vous appelez.
- Les approbations d’exécution indiquent le mode et la liste d’autorisation attendus.

## Exigences relatives au premier plan

`canvas.*`, `camera.*` et `screen.*` fonctionnent uniquement au premier plan sur les Nodes iOS/Android.

Vérification et correction rapides :

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Si vous voyez `NODE_BACKGROUND_UNAVAILABLE`, placez l’application du Node au premier plan et réessayez.

## Matrice des autorisations

| Fonctionnalité                | iOS                                                 | Android                                                        | Application Node macOS                         | Code d’échec courant                           |
| ----------------------------- | --------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| `camera.snap`, `camera.clip`  | Appareil photo (+ micro pour le son de l’extrait)   | Appareil photo (+ micro pour le son de l’extrait)              | Appareil photo (+ micro pour le son de l’extrait) | `*_PERMISSION_REQUIRED`                     |
| `screen.record`               | Enregistrement de l’écran (+ micro facultatif)      | Invite de capture d’écran (+ micro facultatif)                 | Enregistrement de l’écran                      | `*_PERMISSION_REQUIRED`                        |
| `computer.act`                | s.o.                                                | s.o.                                                           | Accessibilité + Enregistrement de l’écran      | `COMPUTER_DISABLED`, `ACCESSIBILITY_REQUIRED`  |
| `location.get`                | While Using ou Always (selon le mode)               | Localisation au premier plan/en arrière-plan selon le mode     | Autorisation de localisation                   | `LOCATION_PERMISSION_REQUIRED`                 |
| `system.run`                  | s.o. (chemin de l’hôte du Node)                     | s.o. (chemin de l’hôte du Node)                                | Approbations d’exécution requises              | `SYSTEM_RUN_DENIED`                            |

## Appairage et approbations

Trois contrôles distincts déterminent si une commande de Node aboutit :

1. **Appairage de l’appareil** : ce Node peut-il se connecter au Gateway ?
2. **Politique des commandes de Node du Gateway** : l’identifiant de commande RPC est-il autorisé par `gateway.nodes.allowCommands` / `denyCommands` et par les valeurs par défaut de la plateforme ?
3. **Approbations d’exécution** : ce Node peut-il exécuter localement une commande shell précise ?

L’appairage du Node est un contrôle d’identité et de confiance, pas une interface d’approbation par commande. Pour `system.run`, la politique propre au Node se trouve dans le fichier d’approbations d’exécution de ce Node (`openclaw approvals get --node ...`), et non dans l’enregistrement d’appairage du Gateway.

Vérifications rapides :

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- Appairage manquant : approuvez d’abord l’appareil du Node.
- Commande absente de `nodes describe` : vérifiez la politique des commandes de Node du Gateway et si le Node a effectivement déclaré cette commande lors de la connexion.
- Appairage correct, mais échec de `system.run` : corrigez les approbations d’exécution ou la liste d’autorisation sur ce Node.

Pour les exécutions `host=node` soumises à approbation, le Gateway lie également l’exécution au `systemRunPlan` canonique préparé. Si un appelant ultérieur modifie la commande, le répertoire de travail ou les métadonnées de session avant la transmission de l’exécution approuvée, le Gateway rejette l’exécution en raison d’une non-correspondance avec l’approbation au lieu de faire confiance à la charge utile modifiée.

## Codes d’erreur courants des Nodes

| Code                                   | Signification                                                                                                                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NODE_BACKGROUND_UNAVAILABLE`          | L’application est en arrière-plan ; placez-la au premier plan.                                                                                                                                                           |
| `CAMERA_DISABLED`                      | Le bouton de l’appareil photo est désactivé dans les réglages du Node.                                                                                                                                                   |
| `*_PERMISSION_REQUIRED`                | Une autorisation du système d’exploitation est manquante ou refusée.                                                                                                                                                     |
| `LOCATION_DISABLED`                    | Le mode de localisation est désactivé.                                                                                                                                                                                   |
| `LOCATION_PERMISSION_REQUIRED`         | Le mode de localisation demandé n’est pas autorisé.                                                                                                                                                                      |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | L’application est en arrière-plan, mais seule l’autorisation While Using est accordée.                                                                                                                                   |
| `COMPUTER_DISABLED`                    | Activez **Allow Computer Control** dans l’application macOS, puis approuvez la mise à jour de l’appairage.                                                                                                               |
| `ACCESSIBILITY_REQUIRED`               | Accordez l’autorisation Accessibility au paquet actuel de l’application OpenClaw dans macOS System Settings.                                                                                                             |
| `SYSTEM_RUN_DENIED: approval required` | La demande d’exécution nécessite une approbation explicite.                                                                                                                                                              |
| `SYSTEM_RUN_DENIED: allowlist miss`    | La commande est bloquée par le mode liste d’autorisation. Sur les hôtes Node Windows, les formes utilisant un interpréteur comme `cmd.exe /c ...` sont considérées comme absentes de la liste d’autorisation dans ce mode, sauf si elles sont approuvées via le flux de demande. |

## Boucle de récupération rapide

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Si le problème persiste :

- Réapprouvez l’appairage de l’appareil.
- Rouvrez l’application du Node au premier plan.
- Accordez de nouveau les autorisations du système d’exploitation.
- Recréez ou ajustez la politique d’approbation des exécutions.

Pour le contrôle de l’ordinateur, vérifiez également qu’un agent doté de capacités de vision expose l’outil `computer`, que `screen.snapshot` aboutit avec l’autorisation Screen Recording et que `/phone status` affiche l’autorisation temporaire ou persistante du Gateway que vous souhaitiez. Une entrée `gateway.nodes.denyCommands` prévaut toujours sur `allowCommands`.

## Voir aussi

- [Présentation des Nodes](/fr/nodes)
- [Nodes avec appareil photo](/fr/nodes/camera)
- [Commande de localisation](/fr/nodes/location-command)
- [Utilisation de l’ordinateur](/fr/nodes/computer-use)
- [Approbations d’exécution](/fr/tools/exec-approvals)
- [Appairage du Gateway](/fr/gateway/pairing)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
- [Dépannage des canaux](/fr/channels/troubleshooting)
