---
read_when:
    - Installation de l’application macOS
    - Choisir entre le mode Gateway local et distant sur macOS
    - Recherche des téléchargements de l’application macOS
summary: Installer et utiliser l’application OpenClaw de la barre de menus macOS
title: appli macOS
x-i18n:
    generated_at: "2026-06-28T00:13:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42cd610465f2e60736da4681e028bca3ed3ed00b424028554ea098acc8ea980c
    source_path: platforms/macos.md
    workflow: 16
---

L’application macOS est le **compagnon de barre de menus** d’OpenClaw. Utilisez-la lorsque vous voulez une
interface native dans la zone de notification, des demandes d’autorisation macOS, des notifications, WebChat, la saisie vocale,
Canvas, ou des outils de nœud hébergés sur Mac comme `system.run`.

Si vous avez seulement besoin de la CLI et du Gateway, commencez par [Bien démarrer](/fr/start/getting-started).

## Télécharger

Téléchargez les builds de l’application macOS depuis les
[versions GitHub d’OpenClaw](https://github.com/openclaw/openclaw/releases).
Lorsqu’une version inclut des ressources d’application macOS, cherchez :

- `OpenClaw-<version>.dmg` (préféré)
- `OpenClaw-<version>.zip`

Certaines versions n’incluent que des ressources CLI, de preuve ou Windows. Si la toute dernière
version ne contient aucune ressource d’application macOS, utilisez la version la plus récente qui en contient une, ou compilez
l’application depuis les sources avec la [configuration de développement macOS](/fr/platforms/mac/dev-setup).

## Premier lancement

1. Installez et lancez **OpenClaw.app**.
2. Terminez la liste de vérification des autorisations macOS.
3. Choisissez le mode **Local** ou **Distant**.
4. Installez la CLI `openclaw` si l’application vous le demande.
5. Ouvrez WebChat depuis la barre de menus et envoyez un message de test.

Pour le parcours de configuration CLI/Gateway, utilisez [Bien démarrer](/fr/start/getting-started).
Pour récupérer les autorisations, utilisez [autorisations macOS](/fr/platforms/mac/permissions).

## Choisir un mode Gateway

| Mode    | À utiliser lorsque                                                                         | Page de détail                                      |
| ------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| Local   | Ce Mac doit exécuter le Gateway et le maintenir actif avec launchd.                        | [Gateway sur macOS](/fr/platforms/mac/bundled-gateway) |
| Distant | Un autre hôte exécute le Gateway et ce Mac doit le contrôler via SSH, le LAN ou Tailnet.   | [Contrôle distant](/fr/platforms/mac/remote)          |

Le mode local nécessite une CLI `openclaw` installée. L’application peut l’installer, ou vous
pouvez suivre [Gateway sur macOS](/fr/platforms/mac/bundled-gateway).

## Ce que l’application gère

- État de la barre de menus, notifications, santé et WebChat.
- Demandes d’autorisation macOS pour l’écran, le microphone, la dictée, l’automatisation et l’accessibilité.
- Outils de nœud locaux comme Canvas, la capture caméra/écran, les notifications et `system.run`.
- Demandes d’approbation d’exécution pour les commandes hébergées sur Mac.
- Tunnels SSH en mode distant ou connexions directes au Gateway.

L’application ne remplace **pas** le Gateway OpenClaw ni la documentation générale de la CLI. La configuration
du Gateway principal, les fournisseurs, les plugins, les canaux, les outils et la sécurité figurent dans
leurs propres documentations.

## Pages de détail macOS

| Tâche                                           | Lire                                                                                        |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Installer ou déboguer le service CLI/Gateway    | [Gateway sur macOS](/fr/platforms/mac/bundled-gateway)                                         |
| Garder l’état hors des dossiers synchronisés dans le cloud | [Gateway sur macOS](/fr/platforms/mac/bundled-gateway#state-directory-on-macos)        |
| Déboguer la découverte et la connectivité de l’application | [Gateway sur macOS](/fr/platforms/mac/bundled-gateway#debug-app-connectivity)          |
| Comprendre le comportement de launchd           | [Cycle de vie du Gateway](/fr/platforms/mac/child-process)                                     |
| Corriger les autorisations ou les problèmes de signature/TCC | [autorisations macOS](/fr/platforms/mac/permissions)                                  |
| Se connecter à un Gateway distant               | [Contrôle distant](/fr/platforms/mac/remote)                                                   |
| Lire l’état de la barre de menus et les contrôles de santé | [Barre de menus](/fr/platforms/mac/menu-bar), [Contrôles de santé](/fr/platforms/mac/health) |
| Utiliser l’interface de chat intégrée           | [WebChat](/fr/platforms/mac/webchat)                                                           |
| Utiliser l’activation vocale ou l’appuyer-pour-parler | [Activation vocale](/fr/platforms/mac/voicewake)                                      |
| Utiliser Canvas et les liens profonds Canvas    | [Canvas](/fr/platforms/mac/canvas)                                                             |
| Héberger PeekabooBridge pour l’automatisation d’interface utilisateur | [Pont Peekaboo](/fr/platforms/mac/peekaboo)                               |
| Configurer les approbations de commandes        | [Approbations d’exécution](/fr/tools/exec-approvals), [détails avancés](/fr/tools/exec-approvals-advanced) |
| Inspecter les commandes de nœud Mac et l’IPC de l’application | [IPC macOS](/fr/platforms/mac/xpc)                                                    |
| Capturer les journaux                           | [Journalisation macOS](/fr/platforms/mac/logging)                                             |
| Compiler depuis les sources                     | [Configuration de développement macOS](/fr/platforms/mac/dev-setup)                           |

## Liens connexes

- [Plateformes](/fr/platforms)
- [Bien démarrer](/fr/start/getting-started)
- [Gateway](/fr/gateway)
- [Approbations d’exécution](/fr/tools/exec-approvals)
