---
read_when:
    - Modification des contrats IPC ou de l’IPC de l’application de barre de menus
summary: Architecture IPC macOS pour l’application OpenClaw, le transport du Node Gateway et PeekabooBridge
title: IPC macOS
x-i18n:
    generated_at: "2026-07-12T02:49:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 39e11af2bb9348d1c1f6e4fe6be95e825d23d5c1aa66e32dae713a89afb12b4f
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# Architecture IPC d’OpenClaw sous macOS

Un socket Unix local relie le service hôte Node à l’application macOS pour les approbations d’exécution et `system.run`. Une CLI de débogage `openclaw-mac` (`apps/macos/Sources/OpenClawMacCLI`) permet d’effectuer des vérifications de découverte et de connexion ; les actions des agents transitent toujours par le WebSocket du Gateway et `node.invoke`. Le chemin `computer.act` adossé à Node exécute l’automatisation Peekaboo intégrée dans le processus ; les clients Peekaboo autonomes utilisent PeekabooBridge.

## Objectifs

- Une seule instance de l’application avec interface graphique, chargée de toutes les opérations nécessitant TCC (notifications, enregistrement de l’écran, microphone, reconnaissance vocale, AppleScript).
- Une surface d’automatisation réduite : commandes du Gateway et de Node, `computer.act` dans le processus, ainsi que PeekabooBridge pour les clients autonomes d’automatisation de l’interface utilisateur.
- Des autorisations prévisibles : toujours le même identifiant de bundle signé, lancé par launchd, afin que les autorisations TCC restent valides.

## Fonctionnement

### Transport Gateway + Node

- L’application exécute le Gateway (en mode local) et s’y connecte en tant que Node.
- Les actions des agents sont exécutées via `node.invoke` (par exemple, `system.run`, `system.notify`, `canvas.*`).
- Les commandes Node comprennent `canvas.*`, `camera.snap`, `camera.clip`, `screen.snapshot`, `screen.record`, `computer.act`, `system.run` et `system.notify`.
- Le Node fournit une table `permissions` afin que les agents puissent déterminer si l’accès à l’écran, à la caméra, au microphone, à la reconnaissance vocale, à l’automatisation ou à l’accessibilité est disponible.

### Service Node + IPC de l’application

- Un service hôte Node sans interface graphique se connecte au WebSocket du Gateway.
- Les requêtes `system.run` sont transmises à l’application macOS via un socket Unix local (`ExecApprovalsSocket.swift`).
- L’application effectue l’exécution dans le contexte de l’interface utilisateur, demande une confirmation si nécessaire et renvoie la sortie.

Schéma (SCI) :

```text
Agent -> Gateway -> Service Node (WS)
                      |  IPC (UDS + jeton + HMAC + TTL)
                      v
                  Application Mac (interface + TCC + system.run)
```

### PeekabooBridge (automatisation de l’interface utilisateur)

- L’outil `computer` intégré de l’agent n’utilise **pas** ce socket. Un Node macOS appairé exécute `computer.act` dans le processus de l’application à l’aide des services Peekaboo intégrés.
- L’automatisation de l’interface utilisateur utilise un socket UNIX distinct (`~/Library/Application Support/OpenClaw/<socket>`) et le protocole JSON PeekabooBridge.
- Ordre de préférence des hôtes (côté client) : Peekaboo.app -> Claude.app -> OpenClaw.app -> exécution locale.
- Sécurité : les hôtes du pont exigent un TeamID figurant dans la liste d’autorisation (le `PeekabooBridgeHostCoordinator` intégré autorise une équipe fixe ainsi que l’équipe de signature propre à l’application) ; un mécanisme de contournement réservé au mode DEBUG et limité au même UID est contrôlé par `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (convention Peekaboo).
- Pour plus de détails, consultez : [Utilisation de PeekabooBridge](/fr/platforms/mac/peekaboo).

## Flux opérationnels

- Redémarrage/reconstruction : `scripts/restart-mac.sh` arrête les instances existantes, reconstruit l’application avec Swift, la reconditionne et la relance. Il détecte automatiquement une identité de signature disponible et se rabat sur `--no-sign` si aucune n’est trouvée ; transmettez `--sign` pour exiger la signature (la commande échoue si aucune clé n’est disponible) ou `--no-sign` pour imposer le chemin sans signature. La variable `SIGN_IDENTITY` définie dans l’environnement est supprimée sur le chemin signé, afin que la détection automatique d’identité propre à `scripts/codesign-mac-app.sh` sélectionne le certificat.
- Instance unique : l’application recherche dans `NSWorkspace.runningApplications` un identifiant de bundle en double et se ferme si plusieurs instances sont détectées (`isDuplicateInstance()` dans `MenuBar.swift`).

## Notes sur le renforcement de la sécurité

- Exigez de préférence une correspondance du TeamID pour toutes les surfaces privilégiées.
- PeekabooBridge : `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (réservé au mode DEBUG) peut autoriser les appelants possédant le même UID pour le développement local.
- Toutes les communications restent exclusivement locales ; aucun socket réseau n’est exposé.
- Les invites TCC proviennent uniquement du bundle de l’application avec interface graphique ; conservez un identifiant de bundle signé stable entre les reconstructions.
- Renforcement du socket d’approbation des exécutions : mode de fichier `0600`, jeton partagé, vérification de l’UID du pair (`getpeereid`), défi-réponse HMAC-SHA256 et courte durée de vie des requêtes.

## Rubriques connexes

- [Application macOS](/fr/platforms/macos)
- [Flux IPC macOS (approbations d’exécution)](/fr/tools/exec-approvals-advanced#macos-ipc-flow)
