---
read_when:
    - Installation de l’application macOS
    - Choisir entre le mode Gateway local et distant sous macOS
    - Recherche des téléchargements de la version de l’app macOS
summary: Installer et utiliser l’app OpenClaw dans la barre des menus de macOS
title: application macOS
x-i18n:
    generated_at: "2026-07-12T15:37:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6f15d0840b7ceb8ac4d82f2c67c060c4b7e8bd25cbb12c216b93be31cb2604b0
    source_path: platforms/macos.md
    workflow: 16
---

L’app macOS est le **compagnon de barre des menus** d’OpenClaw : interface native dans la zone de notification, demandes d’autorisation macOS, notifications, WebChat, saisie vocale, Canvas et outils de Node hébergés sur le Mac, tels que `system.run`.

Vous avez seulement besoin de la CLI et du Gateway ? Commencez par [Bien démarrer](/fr/start/getting-started).

## Téléchargement

Téléchargez les versions de l’app macOS depuis les [versions GitHub d’OpenClaw](https://github.com/openclaw/openclaw/releases).
Lorsqu’une version comprend des ressources pour l’app macOS, recherchez :

- `OpenClaw-<version>.dmg` (recommandé)
- `OpenClaw-<version>.zip`

Certaines versions ne comprennent que la CLI, des éléments de preuve ou des ressources Windows. Si la version la plus récente
ne contient aucune ressource pour l’app macOS, utilisez la plus récente qui en contient une, ou compilez l’app depuis les sources avec
la [configuration de développement macOS](/fr/platforms/mac/dev-setup).

## Premier lancement

1. Installez et lancez **OpenClaw.app**.
2. Choisissez **This Mac** pour un Gateway local, ou connectez-vous à un Gateway distant.
3. Mode local : patientez pendant que l’app installe son environnement d’exécution dans l’espace utilisateur et le Gateway.
4. Établissez l’inférence au moyen d’une vérification avec un modèle actif. Une fois celle-ci réussie, Crestodian
   prend en charge le reste de la configuration.
5. Suivez la liste de contrôle des autorisations macOS et envoyez le message de test d’intégration.

Si l’app accède à un Gateway existant dont l’agent par défaut dispose d’un
modèle configuré, elle considère que ce Gateway est déjà configuré, ignore l’intégration du fournisseur et
Crestodian, puis ouvre le tableau de bord. Si la connexion au Gateway échoue ou si son
agent par défaut ne dispose d’aucun modèle, l’intégration de l’inférence reste disponible pour
la récupération.

Pour la procédure de configuration de la CLI et du Gateway, consultez [Bien démarrer](/fr/start/getting-started).
Pour restaurer les autorisations, consultez [Autorisations macOS](/fr/platforms/mac/permissions).

## Mises à jour

La carte de mise à jour du tableau de bord met d’abord à jour l’app macOS signée par l’intermédiaire de Sparkle.
Après le redémarrage de l’app, celle-ci met automatiquement à jour et redémarre le
Gateway local correspondant qu’elle gère. Les installations de la CLI gérées par l’utilisateur avec Homebrew ou d’autres outils conservent
le processus normal de mise à jour du Gateway (la carte exécute directement la mise à jour du Gateway),
et la réparation automatique ne rétrograde jamais un Gateway plus récent ni ne remplace
l’épinglage sur le canal `extended-stable`.

Sparkle suit le paramètre `update.channel` du Gateway. `beta` et `dev` activent
les versions bêta de l’app ; `stable`, `extended-stable` et les valeurs absentes ou inconnues
restent sur les versions stables de l’app.

## Ouvrir les liens du tableau de bord

Dans le tableau de bord intégré à l’app macOS, cliquer sur un lien web externe l’ouvre dans une barre latérale de navigateur redimensionnable. Chaque lien s’ouvre dans son propre onglet ; cliquer à nouveau sur le même lien réutilise l’onglet existant. Faites glisser les onglets pour les réorganiser, fermez-les avec le bouton de fermeture de l’onglet ou avec un clic du bouton central, puis faites un clic droit sur un onglet pour accéder à **Open in Default Browser**, **Copy Link**, **Reload**, **Close Tab** et **Close Other Tabs**. Les commandes précédent/suivant de la barre de titre de la fenêtre et les balayages sur le pavé tactile permettent de parcourir l’historique du tableau de bord ; les propres commandes précédent/suivant de la barre latérale permettent de parcourir l’historique de l’onglet actif. La barre latérale comporte également des commandes permettant de recharger la page, de l’ouvrir dans le navigateur par défaut et de la fermer, et elle mémorise sa largeur.

Les commandes de la barre de titre suivent la barre latérale de l’app : lorsqu’elle est développée, les boutons précédent/suivant se trouvent sur son bord droit, à côté du bouton permettant de l’afficher ou de la masquer ; lorsqu’elle est réduite, ils laissent place à un bouton de recherche (qui ouvre la palette de commandes) et à un bouton de nouvelle session.

Faites un clic droit sur un lien externe pour choisir **Open in Sidebar**, **Open in Default Browser** ou **Copy Link**. Les clics avec touche de modification et les liens du tableau de bord activés par l’utilisateur qui ouvrent une nouvelle fenêtre continuent de s’ouvrir dans le navigateur par défaut ; les liens ouvrant une nouvelle fenêtre depuis la barre latérale s’ouvrent dans de nouveaux onglets de celle-ci. Les pages ordinaires de l’interface de contrôle hébergées dans un navigateur conservent le comportement normal de ce dernier pour les liens et les menus contextuels.

## Importer les connexions du navigateur

Lorsque l’app utilise un Gateway local et qu’un profil de la famille Chrome contenant des cookies existe sur le Mac, la fenêtre du tableau de bord affiche une bannière pouvant être fermée qui propose de copier ces cookies dans un profil géré isolé utilisé par les agents pour la navigation. Choisissez un profil depuis la commande **Import** de la bannière (Touch ID peut être requis) ; la progression et le nombre de cookies importés s’affichent directement dans celle-ci, et seuls les cookies sont copiés — les mots de passe ne quittent jamais le navigateur source. La fermeture de la bannière enregistre ce choix ; **Settings → General → Browser login → Import…** permet de la réafficher à tout moment. Consultez [Navigateur](/fr/cli/browser) pour connaître le processus d’importation sous-jacent et le contrôle `browser.allowSystemProfileImport`.

## Choisir un mode de Gateway

| Mode     | Utilisez-le lorsque                                                               | Page détaillée                                      |
| -------- | --------------------------------------------------------------------------------- | --------------------------------------------------- |
| Local    | Ce Mac doit exécuter le Gateway et le maintenir actif avec launchd.               | [Gateway sur macOS](/fr/platforms/mac/bundled-gateway) |
| Distant  | Un autre hôte exécute le Gateway ; ce Mac le contrôle via SSH, le LAN ou Tailnet. | [Contrôle à distance](/fr/platforms/mac/remote)        |

Le mode local nécessite l’installation de la CLI `openclaw`. Sur un Mac neuf, l’app installe
automatiquement la CLI et l’environnement d’exécution correspondants avant de démarrer l’assistant du Gateway.
Consultez [Gateway sur macOS](/fr/platforms/mac/bundled-gateway) pour une récupération manuelle.

## Ce que l’app gère

- L’état de la barre des menus, les notifications, le fonctionnement et WebChat.
- Les demandes d’autorisation macOS pour l’écran, le microphone, la parole, l’automatisation et l’accessibilité.
- Les outils de Node locaux : Canvas, capture de la caméra et de l’écran, notifications et `system.run`.
- Les demandes d’approbation d’exécution pour les commandes hébergées sur le Mac.
- Les tunnels SSH en mode distant ou les connexions directes au Gateway.

L’app ne remplace **pas** la documentation générale sur le Gateway ou la CLI. La configuration du Gateway,
les fournisseurs, les plugins, les canaux, les outils et la sécurité disposent de leur
propre documentation.

## Pages détaillées sur macOS

| Tâche                                                | Documentation                                                                                |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Installer ou déboguer le service CLI/Gateway         | [Gateway sur macOS](/fr/platforms/mac/bundled-gateway)                                          |
| Conserver l’état hors des dossiers synchronisés dans le cloud | [Gateway sur macOS](/fr/platforms/mac/bundled-gateway#state-directory-on-macos)          |
| Déboguer la détection de l’app et la connectivité    | [Gateway sur macOS](/fr/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| Comprendre le comportement de launchd                | [Cycle de vie du Gateway](/fr/platforms/mac/child-process)                                      |
| Résoudre les problèmes d’autorisation ou de signature/TCC | [Autorisations macOS](/fr/platforms/mac/permissions)                                        |
| Détecter le Mac utilisé le plus récemment            | [Présence de l’ordinateur actif](/nodes/presence)                                            |
| Se connecter à un Gateway distant                    | [Contrôle à distance](/fr/platforms/mac/remote)                                                 |
| Consulter l’état de la barre des menus et les vérifications de fonctionnement | [Barre des menus](/fr/platforms/mac/menu-bar), [Vérifications de fonctionnement](/fr/platforms/mac/health) |
| Utiliser l’interface de discussion intégrée          | [WebChat](/fr/platforms/mac/webchat)                                                            |
| Utiliser l’activation vocale ou le mode appuyer-pour-parler | [Activation vocale](/fr/platforms/mac/voicewake)                                          |
| Utiliser Canvas et ses liens profonds                | [Canvas](/fr/platforms/mac/canvas)                                                              |
| Héberger PeekabooBridge pour automatiser l’interface | [Pont Peekaboo](/fr/platforms/mac/peekaboo)                                                     |
| Configurer les approbations de commandes             | [Approbations d’exécution](/fr/tools/exec-approvals), [détails avancés](/fr/tools/exec-approvals-advanced) |
| Examiner les commandes du Node Mac et l’IPC de l’app | [IPC macOS](/fr/platforms/mac/xpc)                                                              |
| Capturer les journaux                                | [Journalisation macOS](/fr/platforms/mac/logging)                                               |
| Compiler depuis les sources                          | [Configuration de développement macOS](/fr/platforms/mac/dev-setup)                             |

## Pages connexes

- [Plateformes](/fr/platforms)
- [Bien démarrer](/fr/start/getting-started)
- [Gateway](/fr/gateway)
- [Approbations d’exécution](/fr/tools/exec-approvals)
