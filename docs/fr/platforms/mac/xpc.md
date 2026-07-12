---
read_when:
    - Modification des contrats IPC ou de l’IPC de l’application de barre de menus
summary: Architecture IPC macOS pour l’app OpenClaw, le transport du nœud Gateway et PeekabooBridge
title: IPC macOS
x-i18n:
    generated_at: "2026-07-12T15:31:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 39e11af2bb9348d1c1f6e4fe6be95e825d23d5c1aa66e32dae713a89afb12b4f
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# Architecture IPC d’OpenClaw pour macOS

Un socket Unix local connecte le service hôte Node à l’application macOS pour les approbations d’exécution et `system.run`. Une CLI de débogage `openclaw-mac` (`apps/macos/Sources/OpenClawMacCLI`) permet d’effectuer des vérifications de découverte et de connexion ; les actions de l’agent transitent toujours par le WebSocket du Gateway et `node.invoke`. Le chemin `computer.act` adossé à Node exécute l’automatisation Peekaboo intégrée dans le processus ; les clients Peekaboo autonomes utilisent PeekabooBridge.

## Objectifs

- Une seule instance de l’application avec interface graphique, qui prend en charge toutes les opérations nécessitant TCC (notifications, enregistrement de l’écran, microphone, parole, AppleScript).
- Une surface réduite pour l’automatisation : Gateway + commandes Node, `computer.act` dans le processus, ainsi que PeekabooBridge pour les clients autonomes d’automatisation de l’interface utilisateur.
- Des autorisations prévisibles : toujours le même ID de bundle signé, lancé par launchd, afin que les autorisations TCC persistent.

## Fonctionnement

### Transport Gateway + Node

- L’application exécute le Gateway (en mode local) et s’y connecte en tant que Node.
- Les actions de l’agent sont effectuées via `node.invoke` (par exemple, `system.run`, `system.notify`, `canvas.*`).
- Les commandes Node comprennent `canvas.*`, `camera.snap`, `camera.clip`, `screen.snapshot`, `screen.record`, `computer.act`, `system.run` et `system.notify`.
- Le Node transmet une table `permissions` afin que les agents puissent déterminer si l’accès à l’écran, à la caméra, au microphone, à la parole, à l’automatisation ou aux fonctionnalités d’accessibilité est disponible.

### Service Node + IPC de l’application

- Un service hôte Node sans interface graphique se connecte au WebSocket du Gateway.
- Les requêtes `system.run` sont transférées à l’application macOS via un socket Unix local (`ExecApprovalsSocket.swift`).
- L’application effectue l’exécution dans le contexte de l’interface utilisateur, sollicite une confirmation si nécessaire et renvoie la sortie.

Diagramme (SCI) :

```text
Agent -> Gateway -> Service Node (WS)
                      |  IPC (UDS + jeton + HMAC + TTL)
                      v
                  Application Mac (interface utilisateur + TCC + system.run)
```

### PeekabooBridge (automatisation de l’interface utilisateur)

- L’outil `computer` intégré à l’agent n’utilise **pas** ce socket. Un Node macOS appairé exécute `computer.act` dans le processus de l’application à l’aide des services Peekaboo intégrés.
- L’automatisation de l’interface utilisateur utilise un socket UNIX distinct (`~/Library/Application Support/OpenClaw/<socket>`) et le protocole JSON PeekabooBridge.
- Ordre de préférence des hôtes (côté client) : Peekaboo.app -> Claude.app -> OpenClaw.app -> exécution locale.
- Sécurité : les hôtes du pont exigent un TeamID figurant dans la liste d’autorisation (le `PeekabooBridgeHostCoordinator` intégré autorise une équipe fixe ainsi que l’équipe de signature propre à l’application) ; une échappatoire réservée au mode DEBUG pour le même UID est contrôlée par `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (convention Peekaboo).
- Voir : [utilisation de PeekabooBridge](/fr/platforms/mac/peekaboo) pour plus de détails.

## Flux opérationnels

- Redémarrage/recompilation : `scripts/restart-mac.sh` arrête les instances existantes, recompile avec Swift, recrée le paquet et relance l’application. Il détecte automatiquement une identité de signature disponible et utilise `--no-sign` par défaut si aucune n’est trouvée ; transmettez `--sign` pour exiger une signature (échec si aucune clé n’est disponible) ou `--no-sign` pour imposer le chemin non signé. La variable `SIGN_IDENTITY` définie dans l’environnement est supprimée sur le chemin signé, afin que la détection automatique d’identité propre à `scripts/codesign-mac-app.sh` sélectionne le certificat.
- Instance unique : l’application recherche dans `NSWorkspace.runningApplications` un ID de bundle en double et se ferme si plusieurs instances sont détectées (`isDuplicateInstance()` dans `MenuBar.swift`).

## Notes de durcissement

- Privilégiez l’exigence d’une correspondance de TeamID pour toutes les surfaces privilégiées.
- PeekabooBridge : `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (mode DEBUG uniquement) peut autoriser les appelants ayant le même UID pour le développement local.
- Toutes les communications restent strictement locales ; aucun socket réseau n’est exposé.
- Les invites TCC proviennent uniquement du bundle de l’application avec interface graphique ; conservez un ID de bundle signé stable entre les recompilations.
- Durcissement du socket d’approbation des exécutions : mode de fichier `0600`, jeton partagé, vérification de l’UID du pair (`getpeereid`), mécanisme défi-réponse HMAC-SHA256 et TTL court pour les requêtes.

## Voir aussi

- [application macOS](/fr/platforms/macos)
- [flux IPC macOS (approbations d’exécution)](/fr/tools/exec-approvals-advanced#macos-ipc-flow)
