---
read_when:
    - Installation de l’application macOS
    - Choisir entre le mode Gateway local et distant sur macOS
    - Recherche des téléchargements de version de l’application macOS
summary: Installer et utiliser l’app OpenClaw de la barre des menus macOS
title: application macOS
x-i18n:
    generated_at: "2026-07-04T06:30:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b693bb8ebced46bac173f47cdd90d1b69948ccf2388fda449c77a47ae2a4fb4
    source_path: platforms/macos.md
    workflow: 16
---

L’application macOS est le **compagnon de barre de menus** d’OpenClaw. Utilisez-la lorsque vous souhaitez une
interface native dans la zone de notification, des invites d’autorisation macOS, des notifications, WebChat, la saisie vocale,
Canvas, ou des outils de nœud hébergés sur Mac tels que `system.run`.

Si vous avez seulement besoin de la CLI et du Gateway, commencez par [Bien démarrer](/fr/start/getting-started).

## Télécharger

Téléchargez les versions de l’application macOS depuis les
[versions GitHub d’OpenClaw](https://github.com/openclaw/openclaw/releases).
Lorsqu’une version inclut des ressources d’application macOS, cherchez :

- `OpenClaw-<version>.dmg` (recommandé)
- `OpenClaw-<version>.zip`

Certaines versions incluent uniquement des ressources CLI, de preuve ou Windows. Si la version la plus récente
ne contient aucune ressource d’application macOS, utilisez la version la plus récente qui en contient une, ou compilez
l’application depuis la source avec [configuration de développement macOS](/fr/platforms/mac/dev-setup).

## Premier lancement

1. Installez et lancez **OpenClaw.app**.
2. Choisissez **Ce Mac** pour un Gateway local, ou connectez-vous à un Gateway distant.
3. En mode local, patientez pendant que l’application installe son runtime en espace utilisateur et le Gateway.
4. Terminez la configuration du fournisseur et la checklist des autorisations macOS.
5. Envoyez le message de test d’intégration.

Pour le parcours de configuration CLI/Gateway, utilisez [Bien démarrer](/fr/start/getting-started).
Pour récupérer les autorisations, utilisez [autorisations macOS](/fr/platforms/mac/permissions).

## Choisir un mode de Gateway

| Mode   | Utilisez-le lorsque                                                                                 | Page de détails                                      |
| ------ | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Local  | Ce Mac doit exécuter le Gateway et le maintenir actif avec launchd.                                  | [Gateway sur macOS](/fr/platforms/mac/bundled-gateway)  |
| Distant | Un autre hôte exécute le Gateway et ce Mac doit le contrôler via SSH, LAN ou Tailnet.               | [Contrôle distant](/fr/platforms/mac/remote)            |

Le mode local nécessite une CLI `openclaw` installée. Sur un Mac neuf, l’application installe
automatiquement la CLI et le runtime correspondants avant de démarrer l’assistant Gateway.
Consultez [Gateway sur macOS](/fr/platforms/mac/bundled-gateway) pour une récupération manuelle.

## Ce que l’application gère

- État de la barre de menus, notifications, santé et WebChat.
- Invites d’autorisation macOS pour l’écran, le microphone, la parole, l’automatisation et l’accessibilité.
- Outils de nœud locaux tels que Canvas, capture caméra/écran, notifications et `system.run`.
- Invites d’approbation Exec pour les commandes hébergées sur Mac.
- Tunnels SSH en mode distant ou connexions directes au Gateway.

L’application ne remplace **pas** le Gateway OpenClaw ni la documentation générale de la CLI. La configuration
principale du Gateway, les fournisseurs, les plugins, les canaux, les outils et la sécurité disposent de
leur propre documentation.

## Pages de détail macOS

| Tâche                                    | Lire                                                                                         |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| Installer ou déboguer le service CLI/Gateway | [Gateway sur macOS](/fr/platforms/mac/bundled-gateway)                                      |
| Garder l’état hors des dossiers synchronisés avec le cloud | [Gateway sur macOS](/fr/platforms/mac/bundled-gateway#state-directory-on-macos)       |
| Déboguer la découverte et la connectivité de l’application | [Gateway sur macOS](/fr/platforms/mac/bundled-gateway#debug-app-connectivity)          |
| Comprendre le comportement de launchd    | [Cycle de vie du Gateway](/fr/platforms/mac/child-process)                                      |
| Corriger les autorisations ou les problèmes de signature/TCC | [autorisations macOS](/fr/platforms/mac/permissions)                                  |
| Se connecter à un Gateway distant        | [Contrôle distant](/fr/platforms/mac/remote)                                                     |
| Lire l’état de la barre de menus et les contrôles de santé | [Barre de menus](/fr/platforms/mac/menu-bar), [Contrôles de santé](/fr/platforms/mac/health) |
| Utiliser l’interface de chat intégrée    | [WebChat](/fr/platforms/mac/webchat)                                                            |
| Utiliser le réveil vocal ou le push-to-talk | [Réveil vocal](/fr/platforms/mac/voicewake)                                                  |
| Utiliser Canvas et les liens profonds Canvas | [Canvas](/fr/platforms/mac/canvas)                                                           |
| Héberger PeekabooBridge pour l’automatisation d’interface utilisateur | [Pont Peekaboo](/fr/platforms/mac/peekaboo)                                      |
| Configurer les approbations de commandes | [Approbations Exec](/fr/tools/exec-approvals), [détails avancés](/fr/tools/exec-approvals-advanced) |
| Inspecter les commandes de nœud Mac et l’IPC de l’application | [IPC macOS](/fr/platforms/mac/xpc)                                                  |
| Capturer les journaux                    | [Journalisation macOS](/fr/platforms/mac/logging)                                                |
| Compiler depuis la source                | [configuration de développement macOS](/fr/platforms/mac/dev-setup)                              |

## Connexe

- [Plateformes](/fr/platforms)
- [Bien démarrer](/fr/start/getting-started)
- [Gateway](/fr/gateway)
- [Approbations Exec](/fr/tools/exec-approvals)
