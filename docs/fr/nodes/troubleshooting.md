---
read_when:
    - Node est connecté, mais les outils camera/canvas/screen/exec échouent
    - Vous avez besoin du modèle mental de l’appairage de Node par rapport aux approbations
summary: Résoudre les problèmes d’appairage de nœuds, d’exigences de premier plan, d’autorisations et d’échecs d’outils
title: Dépannage de Node
x-i18n:
    generated_at: "2026-05-11T20:43:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: d53f06367b63125f04b4b542c322e6e50e1f33153e0fbdd09e7a38772c69a438
    source_path: nodes/troubleshooting.md
    workflow: 16
---

Utilisez cette page lorsqu’un nœud est visible dans le statut, mais que les outils du nœud échouent.

## Échelle de commandes

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Exécutez ensuite les vérifications propres au nœud :

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Signaux sains :

- Le nœud est connecté et appairé pour le rôle `node`.
- `nodes describe` inclut la capacité que vous appelez.
- Les approbations d’exécution affichent le mode/la liste d’autorisation attendus.

## Exigences de premier plan

`canvas.*`, `camera.*` et `screen.*` nécessitent le premier plan sur les nœuds iOS/Android.

Vérification et correction rapides :

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Si vous voyez `NODE_BACKGROUND_UNAVAILABLE`, placez l’application du nœud au premier plan et réessayez.

## Matrice des autorisations

| Capacité                     | iOS                                             | Android                                             | Application de nœud macOS           | Code d’échec typique           |
| ---------------------------- | ----------------------------------------------- | --------------------------------------------------- | ----------------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | Caméra (+ micro pour l’audio du clip)           | Caméra (+ micro pour l’audio du clip)               | Caméra (+ micro pour l’audio du clip) | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | Enregistrement de l’écran (+ micro facultatif)  | Invite de capture d’écran (+ micro facultatif)      | Enregistrement de l’écran           | `*_PERMISSION_REQUIRED`        |
| `location.get`               | Lors de l’utilisation ou Toujours (selon le mode) | Position au premier plan/en arrière-plan selon le mode | Autorisation de localisation        | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a (chemin de l’hôte du nœud)                  | n/a (chemin de l’hôte du nœud)                      | Approbations d’exécution requises   | `SYSTEM_RUN_DENIED`            |

## Appairage versus approbations

Ce sont des barrières différentes :

1. **Appairage de l’appareil** : ce nœud peut-il se connecter au Gateway ?
2. **Politique de commande des nœuds du Gateway** : l’ID de commande RPC est-il autorisé par `gateway.nodes.allowCommands` / `denyCommands` et les valeurs par défaut de la plateforme ?
3. **Approbations d’exécution** : ce nœud peut-il exécuter localement une commande shell spécifique ?

Vérifications rapides :

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Si l’appairage est manquant, approuvez d’abord l’appareil du nœud.
Si `nodes describe` ne contient pas une commande, vérifiez la politique de commande des nœuds du Gateway et si le nœud a réellement déclaré cette commande lors de la connexion.
Si l’appairage est correct, mais que `system.run` échoue, corrigez les approbations d’exécution/la liste d’autorisation sur ce nœud.

L’appairage des nœuds est une barrière d’identité/de confiance, pas une surface d’approbation par commande. Pour `system.run`, la politique par nœud se trouve dans le fichier d’approbations d’exécution de ce nœud (`openclaw approvals get --node ...`), pas dans l’enregistrement d’appairage du Gateway.

Pour les exécutions `host=node` adossées à une approbation, le Gateway lie aussi l’exécution au
`systemRunPlan` canonique préparé. Si un appelant ultérieur modifie la commande/le cwd ou les
métadonnées de session avant que l’exécution approuvée soit transférée, le Gateway rejette
l’exécution comme non-concordance d’approbation au lieu de faire confiance à la charge utile modifiée.

## Codes d’erreur courants des nœuds

- `NODE_BACKGROUND_UNAVAILABLE` → l’application est en arrière-plan ; ramenez-la au premier plan.
- `CAMERA_DISABLED` → le bouton caméra est désactivé dans les paramètres du nœud.
- `*_PERMISSION_REQUIRED` → autorisation du système d’exploitation manquante/refusée.
- `LOCATION_DISABLED` → le mode de localisation est désactivé.
- `LOCATION_PERMISSION_REQUIRED` → le mode de localisation demandé n’a pas été accordé.
- `LOCATION_BACKGROUND_UNAVAILABLE` → l’application est en arrière-plan, mais seule l’autorisation Lors de l’utilisation existe.
- `SYSTEM_RUN_DENIED: approval required` → la demande d’exécution nécessite une approbation explicite.
- `SYSTEM_RUN_DENIED: allowlist miss` → commande bloquée par le mode liste d’autorisation.
  Sur les hôtes de nœud Windows, les formes d’enveloppe shell comme `cmd.exe /c ...` sont traitées comme des absences de liste d’autorisation en
  mode liste d’autorisation, sauf si elles sont approuvées via le flux de demande.

## Boucle de récupération rapide

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Si vous êtes toujours bloqué :

- Réapprouvez l’appairage de l’appareil.
- Rouvrez l’application du nœud (premier plan).
- Réaccordez les autorisations du système d’exploitation.
- Recréez/ajustez la politique d’approbation d’exécution.

## Connexe

- [Vue d’ensemble des nœuds](/fr/nodes)
- [Nœuds caméra](/fr/nodes/camera)
- [Commande de localisation](/fr/nodes/location-command)
- [Approbations d’exécution](/fr/tools/exec-approvals)
- [Appairage du Gateway](/fr/gateway/pairing)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
- [Dépannage des canaux](/fr/channels/troubleshooting)
