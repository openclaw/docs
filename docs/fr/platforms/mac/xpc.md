---
read_when:
    - Modification des contrats IPC ou de l’IPC de l’application de barre de menus
summary: Architecture IPC macOS pour l’application OpenClaw, le transport des nœuds Gateway et PeekabooBridge
title: IPC macOS
x-i18n:
    generated_at: "2026-06-28T00:13:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 436ea0a01dc544d246b4f2f506a2950fd05b36a8cf79f6f03cffe2843eef8c0d
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# Architecture IPC macOS d’OpenClaw

**Modèle actuel :** un socket Unix local connecte le **service hôte node** à l’**application macOS** pour les approbations d’exécution + `system.run`. Une CLI de débogage `openclaw-mac` existe pour les vérifications de découverte/connexion ; les actions d’agent passent toujours par le WebSocket Gateway et `node.invoke`. L’automatisation de l’interface utilisateur utilise PeekabooBridge.

## Objectifs

- Une instance unique de l’application GUI qui prend en charge tout le travail lié à TCC (notifications, enregistrement de l’écran, micro, parole, AppleScript).
- Une petite surface pour l’automatisation : Gateway + commandes node, plus PeekabooBridge pour l’automatisation de l’interface utilisateur.
- Des autorisations prévisibles : toujours le même ID de bundle signé, lancé par launchd, afin que les autorisations TCC persistent.

## Fonctionnement

### Transport Gateway + node

- L’application exécute le Gateway (mode local) et s’y connecte en tant que node.
- Les actions d’agent sont effectuées via `node.invoke` (par ex. `system.run`, `system.notify`, `canvas.*`).
- Les commandes node Mac courantes incluent `canvas.*`, `camera.snap`, `camera.clip`,
  `screen.snapshot`, `screen.record`, `system.run` et `system.notify`.
- Le node signale une carte `permissions` afin que les agents puissent voir si l’accès à l’écran,
  à la caméra, au microphone, à la parole, à l’automatisation ou à l’accessibilité est disponible.

### Service node + IPC de l’application

- Un service hôte node sans interface se connecte au WebSocket Gateway.
- Les requêtes `system.run` sont transférées à l’application macOS via un socket Unix local.
- L’application effectue l’exécution dans le contexte de l’interface utilisateur, demande une confirmation si nécessaire, puis renvoie la sortie.

Diagramme (SCI) :

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (automatisation de l’interface utilisateur)

- L’automatisation de l’interface utilisateur utilise un socket UNIX distinct nommé `bridge.sock` et le protocole JSON PeekabooBridge.
- Ordre de préférence des hôtes (côté client) : Peekaboo.app → Claude.app → OpenClaw.app → exécution locale.
- Sécurité : les hôtes bridge exigent un TeamID autorisé ; l’échappatoire DEBUG uniquement pour le même UID est protégée par `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (convention Peekaboo).
- Voir : [utilisation de PeekabooBridge](/fr/platforms/mac/peekaboo) pour plus de détails.

## Flux opérationnels

- Redémarrer/recompiler : `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Tue les instances existantes
  - Compilation Swift + paquet
  - Écrit/initialise/relance le LaunchAgent
- Instance unique : l’application quitte tôt si une autre instance avec le même ID de bundle est en cours d’exécution.

## Notes de durcissement

- Préférer l’exigence d’une correspondance de TeamID pour toutes les surfaces privilégiées.
- PeekabooBridge : `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (DEBUG uniquement) peut autoriser les appelants du même UID pour le développement local.
- Toutes les communications restent strictement locales ; aucun socket réseau n’est exposé.
- Les invites TCC proviennent uniquement du bundle de l’application GUI ; garder l’ID de bundle signé stable entre les recompilations.
- Durcissement IPC : mode de socket `0600`, token, vérifications du peer-UID, défi/réponse HMAC, TTL court.

## Connexe

- [application macOS](/fr/platforms/macos)
- [Flux IPC macOS (approbations d’exécution)](/fr/tools/exec-approvals-advanced#macos-ipc-flow)
