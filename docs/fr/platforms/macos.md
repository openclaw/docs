---
read_when:
    - Installation de l’application macOS
    - Choisir entre le mode Gateway local et distant sous macOS
    - Recherche de téléchargements de versions de l’application macOS
summary: Installer et utiliser l’app OpenClaw dans la barre des menus de macOS
title: application macOS
x-i18n:
    generated_at: "2026-07-12T21:43:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ef3ea75aa2f158829da643ca016681e40102cc4fad84e207e80b377d023c2e1f
    source_path: platforms/macos.md
    workflow: 16
---

L’app macOS est le **compagnon de barre des menus** d’OpenClaw : interface native dans la zone de notification, demandes d’autorisation macOS, notifications, WebChat, saisie vocale, Canvas et outils de Node hébergés sur Mac tels que `system.run`.

Vous avez uniquement besoin de la CLI et du Gateway ? Commencez par [Bien démarrer](/fr/start/getting-started).

## Téléchargement

Téléchargez les versions de l’app macOS depuis les [versions GitHub d’OpenClaw](https://github.com/openclaw/openclaw/releases).
Lorsqu’une version contient des ressources pour l’app macOS, recherchez :

- `OpenClaw-<version>.dmg` (recommandé)
- `OpenClaw-<version>.zip`

Certaines versions ne contiennent que la CLI, des éléments de preuve ou des ressources Windows. Si la version la plus récente ne contient aucune ressource pour l’app macOS, utilisez la plus récente qui en propose une, ou compilez-la depuis le code source en suivant la [configuration de développement macOS](/fr/platforms/mac/dev-setup).

## Premier lancement

1. Installez et lancez **OpenClaw.app**.
2. Choisissez **This Mac** pour un Gateway local, ou connectez-vous à un Gateway distant.
3. Patientez pendant que l’app installe l’environnement d’exécution CLI correspondant. En mode local, elle installe et démarre également le Gateway.
4. Établissez l’inférence au moyen d’une vérification avec un modèle actif. Une fois celle-ci réussie, Crestodian prend en charge le reste de la configuration.
5. Complétez la liste de contrôle des autorisations macOS et envoyez le message de test d’intégration.

Si l’app accède à un Gateway existant dont l’agent par défaut dispose d’un modèle configuré, elle considère que ce Gateway est déjà configuré, ignore l’intégration du fournisseur et Crestodian, puis ouvre le tableau de bord. Si la connexion au Gateway échoue ou si son agent par défaut ne dispose d’aucun modèle, l’intégration de l’inférence reste disponible à des fins de récupération.

Pour le parcours de configuration de la CLI et du Gateway, consultez [Bien démarrer](/fr/start/getting-started).
Pour restaurer les autorisations, consultez [Autorisations macOS](/fr/platforms/mac/permissions).

## Mises à jour

La carte de mise à jour du tableau de bord met d’abord à jour l’app macOS signée par l’intermédiaire de Sparkle.
Après le redémarrage de l’app, celle-ci met automatiquement à jour et redémarre le Gateway local correspondant qu’elle gère. Les installations de la CLI gérées par l’utilisateur avec Homebrew ou d’autres outils conservent le processus normal de mise à jour du Gateway (la carte exécute directement la mise à jour du Gateway), et la réparation automatique ne rétrograde jamais un Gateway plus récent ni ne remplace l’épinglage du canal `extended-stable`.

Sparkle suit le paramètre `update.channel` du Gateway. `beta` et `dev` activent les versions bêta de l’app ; `stable`, `extended-stable` ainsi que les valeurs absentes ou inconnues restent sur les versions stables de l’app.

## Ouverture des liens du tableau de bord

Dans le tableau de bord intégré à l’app macOS, cliquer sur un lien web externe l’ouvre dans une barre latérale de navigateur redimensionnable. Chaque lien s’ouvre dans son propre onglet ; cliquer à nouveau sur le même lien réutilise l’onglet existant. Faites glisser les onglets pour les réorganiser, fermez-les avec le bouton de fermeture de l’onglet ou un clic du bouton central, et faites un clic droit sur un onglet pour accéder à **Open in Default Browser**, **Copy Link**, **Reload**, **Close Tab** et **Close Other Tabs**. Les commandes précédent/suivant de la barre de titre de la fenêtre et les balayages sur le pavé tactile permettent de parcourir l’historique du tableau de bord ; les commandes précédent/suivant propres à la barre latérale permettent de parcourir l’historique de l’onglet actif. La barre latérale comporte également des commandes pour recharger, ouvrir dans le navigateur par défaut et fermer, et mémorise sa largeur.

Les commandes de la barre de titre suivent la barre latérale de l’app : lorsqu’elle est déployée, les boutons précédent/suivant se trouvent sur son bord droit, à côté du bouton permettant de l’afficher ou de la masquer ; lorsqu’elle est réduite, ils laissent place à un bouton de recherche (qui ouvre la palette de commandes) et à un bouton permettant de créer une session.

Faites un clic droit sur un lien externe pour choisir **Open in Sidebar**, **Open in Default Browser** ou **Copy Link**. Les clics avec touche de modification et les liens du tableau de bord activés par l’utilisateur qui ouvrent une nouvelle fenêtre continuent de s’ouvrir dans le navigateur par défaut ; les liens qui ouvrent une nouvelle fenêtre depuis la barre latérale s’ouvrent dans de nouveaux onglets de cette barre. Les pages ordinaires de l’interface de contrôle hébergées dans un navigateur conservent le comportement normal du navigateur pour les liens et les menus contextuels.

## Importation des connexions du navigateur

Lorsque l’app utilise un Gateway local et qu’un profil de la famille Chrome contenant des cookies existe sur le Mac, la fenêtre du tableau de bord affiche une bannière pouvant être masquée, proposant de copier ces cookies dans un profil géré et isolé que les agents utilisent pour naviguer. Choisissez un profil à l’aide de la commande **Import** de la bannière (Touch ID peut être requis) ; la progression et le nombre de cookies importés s’affichent directement dans la bannière, et seuls les cookies sont copiés — les mots de passe ne quittent jamais le navigateur source. Masquer la bannière enregistre ce choix ; **Settings → General → Browser login → Import…** permet de l’afficher de nouveau à tout moment. Consultez [Navigateur](/fr/cli/browser) pour connaître le processus d’importation sous-jacent et le contrôle `browser.allowSystemProfileImport`.

## Choix d’un mode de Gateway

| Mode    | À utiliser lorsque                                                                                         | Page détaillée                                      |
| ------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Local   | Ce Mac doit exécuter le Gateway et le maintenir actif avec launchd.                                       | [Gateway sur macOS](/fr/platforms/mac/bundled-gateway) |
| Distant | Un autre hôte exécute le Gateway ; ce Mac le contrôle par SSH, sur le réseau local ou via un réseau privé. | [Contrôle à distance](/fr/platforms/mac/remote)         |

Les deux modes nécessitent l’installation de la CLI `openclaw`, car l’app réutilise son environnement d’exécution hôte de Node.
Sur un nouveau Mac, l’app installe automatiquement la CLI correspondante ; le mode local démarre ensuite l’assistant du Gateway, tandis que le mode distant se connecte au Gateway sélectionné sans démarrer un second Gateway local.
Consultez [Gateway sur macOS](/fr/platforms/mac/bundled-gateway) pour effectuer une récupération manuelle.

## Responsabilités de l’app

- État de la barre des menus, notifications, intégrité et WebChat.
- Demandes d’autorisation macOS pour l’écran, le microphone, la reconnaissance vocale, l’automatisation et l’accessibilité.
- Un Node Mac combinant Canvas natif, la capture de la caméra et de l’écran, les notifications, la localisation et le contrôle de l’ordinateur avec les commandes système, de navigateur, de Plugin, de compétence et MCP de l’hôte de Node de la CLI.
- Demandes d’approbation d’exécution pour les commandes hébergées sur Mac.
- Exécution dans le contexte de l’app pour les commandes shell approuvées, préservant l’attribution des autorisations macOS à l’app tandis que l’environnement d’exécution CLI gère la politique partagée du Node.
- Tunnels SSH en mode distant ou connexions directes au Gateway.

L’app ne remplace **pas** la documentation générale de la CLI ni celle du Gateway. La configuration du Gateway, les fournisseurs, les plugins, les canaux, les outils et la sécurité disposent de leur propre documentation.

## Pages détaillées sur macOS

| Tâche                                              | Documentation                                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Installer ou déboguer le service CLI/Gateway       | [Gateway sur macOS](/fr/platforms/mac/bundled-gateway)                                         |
| Conserver l’état hors des dossiers synchronisés dans le cloud | [Gateway sur macOS](/fr/platforms/mac/bundled-gateway#state-directory-on-macos)       |
| Déboguer la détection et la connectivité de l’app  | [Gateway sur macOS](/fr/platforms/mac/bundled-gateway#debug-app-connectivity)                  |
| Comprendre le comportement de launchd              | [Cycle de vie du Gateway](/fr/platforms/mac/child-process)                                     |
| Corriger les problèmes d’autorisation, de signature ou de TCC | [Autorisations macOS](/fr/platforms/mac/permissions)                                 |
| Détecter le Mac utilisé le plus récemment          | [Présence de l’ordinateur actif](/fr/nodes/presence)                                           |
| Se connecter à un Gateway distant                  | [Contrôle à distance](/fr/platforms/mac/remote)                                                |
| Consulter l’état de la barre des menus et les vérifications d’intégrité | [Barre des menus](/fr/platforms/mac/menu-bar), [Vérifications d’intégrité](/fr/platforms/mac/health) |
| Utiliser l’interface de discussion intégrée        | [WebChat](/fr/platforms/mac/webchat)                                                           |
| Utiliser l’activation vocale ou la fonction appuyer-pour-parler | [Activation vocale](/fr/platforms/mac/voicewake)                                    |
| Utiliser Canvas et ses liens profonds              | [Canvas](/fr/platforms/mac/canvas)                                                             |
| Héberger PeekabooBridge pour automatiser l’interface utilisateur | [Pont Peekaboo](/fr/platforms/mac/peekaboo)                                        |
| Configurer les approbations de commandes           | [Approbations d’exécution](/fr/tools/exec-approvals), [informations avancées](/fr/tools/exec-approvals-advanced) |
| Examiner les commandes du Node Mac et l’IPC de l’app | [IPC macOS](/fr/platforms/mac/xpc)                                                           |
| Capturer les journaux                              | [Journalisation macOS](/fr/platforms/mac/logging)                                              |
| Compiler depuis le code source                     | [Configuration de développement macOS](/fr/platforms/mac/dev-setup)                            |

## Voir aussi

- [Plateformes](/fr/platforms)
- [Bien démarrer](/fr/start/getting-started)
- [Gateway](/fr/gateway)
- [Approbations d’exécution](/fr/tools/exec-approvals)
