---
read_when:
    - Installation de l’application macOS
    - Choisir entre le mode Gateway local et distant sur macOS
    - Recherche des téléchargements de versions de l’application macOS
summary: Installer et utiliser l’app OpenClaw dans la barre des menus de macOS
title: Application macOS
x-i18n:
    generated_at: "2026-07-16T13:27:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c6aaf107eb564dd8a444069fee31bb190efe41da9f26b3c52f42fdbbcaf8690c
    source_path: platforms/macos.md
    workflow: 16
---

L’app macOS est le **compagnon de barre de menus** d’OpenClaw : interface native dans la zone de notification, demandes d’autorisation macOS, notifications, WebChat, saisie vocale, Canvas et outils Node hébergés sur Mac tels que `system.run`.

Vous avez uniquement besoin de la CLI et du Gateway ? Commencez par [Bien démarrer](/fr/start/getting-started).

## Téléchargement

Téléchargez les versions de l’app macOS depuis les [versions GitHub d’OpenClaw](https://github.com/openclaw/openclaw/releases).
Lorsqu’une version contient des ressources pour l’app macOS, recherchez :

- `OpenClaw-<version>.dmg` (recommandé)
- `OpenClaw-<version>.zip`

Certaines versions ne contiennent que la CLI, des éléments de preuve ou des ressources Windows. Si la version la plus récente
ne contient aucune ressource pour l’app macOS, utilisez la plus récente qui en contient une, ou compilez-la depuis les sources avec
la [configuration de développement macOS](/fr/platforms/mac/dev-setup).

## Premier lancement

1. Installez et lancez **OpenClaw.app**.
2. Choisissez **Ce Mac** pour un Gateway local, ou connectez-vous à un Gateway distant.
3. Patientez pendant que l’app installe l’environnement d’exécution CLI correspondant. En mode local, elle
   installe et démarre également le Gateway.
4. Établissez l’inférence au moyen d’une vérification avec un modèle actif. Une fois celle-ci réussie, OpenClaw
   prend en charge le reste de la configuration.
5. Suivez la liste de vérification des autorisations macOS et envoyez le message de test d’intégration.

Si l’app accède à un Gateway existant dont l’agent par défaut dispose d’un
modèle configuré, elle considère que ce Gateway est déjà configuré, ignore l’intégration du fournisseur et
OpenClaw, puis ouvre le tableau de bord. Si le Gateway ne parvient pas à se connecter ou si son
agent par défaut ne dispose d’aucun modèle, l’intégration d’inférence reste disponible pour la
récupération.

Pour le parcours de configuration de la CLI et du Gateway, consultez [Bien démarrer](/fr/start/getting-started).
Pour rétablir les autorisations, consultez [Autorisations macOS](/fr/platforms/mac/permissions).

## Mises à jour

La carte de mise à jour du tableau de bord indique ce que l’app mettra à jour :

- **Mettre à jour l’app Mac et le Gateway** signifie que l’app signée gère le Gateway
  launchd local. Sparkle met d’abord à jour l’app ; après son redémarrage, l’app
  met automatiquement à jour et redémarre son Gateway avec la version correspondante,
  puis vérifie la connexion.
- **Mettre à jour le Gateway** signifie que l’app est connectée à un Gateway distant, à un
  Gateway local géré manuellement ou à une autre installation qu’elle ne gère pas. Le bouton
  exécute le processus de mise à jour normal de ce Gateway au lieu de modifier l’app Mac.

En cas d’échec d’une mise à jour coordonnée, sa fenêtre de configuration reste ouverte et propose de réessayer,
de consulter le [guide de mise à jour](/fr/install/updating) ou d’utiliser les actions Discord. La réparation automatique
ne rétrograde jamais un Gateway plus récent et ne remplace jamais l’épinglage du canal `extended-stable`.

Après une mise à jour réussie, l’app recherche la session directe de premier niveau
utilisée le plus récemment par une personne et transmet à cet agent un événement de mise à jour ponctuel. Les activités Heartbeat
et Cron n’influent pas sur ce choix. L’agent peut alors vous souhaiter un bon retour
depuis la conversation que vous utilisiez probablement. En mode distant, l’app
met uniquement à jour l’environnement d’exécution du Node Mac local et omet la notification lorsque le
Gateway distant est plus ancien que l’app.

Sparkle suit le paramètre `update.channel` du Gateway. `beta` et `dev` activent
les versions bêta de l’app ; `stable`, `extended-stable`, ainsi que les valeurs absentes ou inconnues
restent sur les versions stables de l’app.

## Ouvrir les liens du tableau de bord

Dans le tableau de bord intégré à l’app macOS, un clic sur un lien web externe l’ouvre dans une barre latérale de navigateur redimensionnable occupant la moitié de la largeur de la fenêtre, tout en laissant visible la navigation du tableau de bord. Faites glisser le séparateur pour choisir une autre largeur ; l’app la mémorise. Chaque lien s’ouvre dans son propre onglet, la barre d’onglets apparaît lorsque plusieurs pages sont ouvertes, et un nouveau clic sur le même lien réutilise son onglet existant. Faites glisser les onglets pour les réorganiser, fermez-les à l’aide du bouton de fermeture de l’onglet ou d’un clic avec le bouton du milieu, et faites un clic droit sur un onglet pour accéder à **Open in Default Browser**, **Copy Link**, **Reload**, **Close Tab** et **Close Other Tabs**. Les commandes précédent/suivant de la barre de titre de la fenêtre et les balayages sur le pavé tactile permettent de parcourir l’historique du tableau de bord ; les propres commandes précédent/suivant de la barre latérale permettent de parcourir l’historique de l’onglet actif. La barre latérale comporte également des commandes permettant de recharger la page, de l’ouvrir dans le navigateur par défaut et de la fermer.

Les commandes de la barre de titre suivent la barre latérale de l’app : lorsqu’elle est déployée, les boutons précédent/suivant se trouvent sur son bord droit, à côté du bouton permettant de l’afficher ou de la masquer ; lorsqu’elle est réduite, ils laissent place à un bouton de recherche (qui ouvre la palette de commandes) et à un bouton de nouvelle session.

Faites un clic droit sur un lien externe pour choisir **Open in Sidebar**, **Open in Default Browser** ou **Copy Link**. Les clics avec une touche de modification et les liens de nouvelle fenêtre activés par l’utilisateur depuis le tableau de bord continuent de s’ouvrir dans le navigateur par défaut ; les liens de nouvelle fenêtre dans la barre latérale s’ouvrent dans de nouveaux onglets de la barre latérale. Les pages de la Control UI hébergées dans un navigateur conservent le comportement normal du navigateur pour les liens et le menu contextuel.

## Importer les connexions du navigateur

À la première ouverture de la barre latérale du navigateur lorsque l’app utilise un Gateway local, le tableau de bord affiche une bannière pouvant être ignorée si un profil de la famille Chrome contenant des cookies existe sur le Mac. La bannière propose de copier ces cookies dans un profil géré isolé que les agents utilisent pour naviguer. Choisissez un profil à l’aide de sa commande **Import** (Touch ID peut être requis) ; la progression et le nombre de cookies importés s’affichent directement, et seuls les cookies sont copiés — les mots de passe ne quittent jamais le navigateur source. Ignorer la bannière enregistre ce choix ; **Settings → General → Browser login → Import…** permet de la proposer de nouveau à tout moment. Consultez [Navigateur](/fr/cli/browser) pour le processus d’importation sous-jacent et la condition `browser.allowSystemProfileImport`.

## Choisir un mode de Gateway

| Mode   | À utiliser lorsque                                                                 | Page détaillée                                     |
| ------ | ---------------------------------------------------------------------------------- | -------------------------------------------------- |
| Local  | Ce Mac doit exécuter le Gateway et le maintenir actif avec launchd.                | [Gateway sur macOS](/fr/platforms/mac/bundled-gateway) |
| Distant | Un autre hôte exécute le Gateway ; ce Mac le contrôle par SSH, LAN ou Tailnet.    | [Contrôle à distance](/fr/platforms/mac/remote)       |

Les deux modes nécessitent l’installation de la CLI `openclaw`, car l’app réutilise son environnement d’exécution
d’hôte Node. Sur un Mac neuf, l’app installe automatiquement la CLI correspondante ; le mode
local lance ensuite l’assistant du Gateway, tandis que le mode distant se connecte au
Gateway sélectionné sans démarrer un second Gateway local.
Consultez [Gateway sur macOS](/fr/platforms/mac/bundled-gateway) pour une récupération manuelle.

## Ce que l’app prend en charge

- État de la barre des menus, notifications, santé et WebChat.
- Invites d’autorisation macOS pour l’écran, le microphone, la parole, l’automatisation et l’accessibilité.
- Un Node Mac qui combine Canvas natif, la capture de la caméra et de l’écran, les notifications,
  la localisation et le contrôle de l’ordinateur avec les commandes système, de navigateur,
  de Plugin, de Skills et MCP de l’hôte Node de la CLI.
- Invites d’approbation d’exécution pour les commandes hébergées sur le Mac.
- Exécution dans le contexte de l’app pour les commandes shell approuvées, en préservant l’attribution
  des autorisations macOS de l’app tandis que l’environnement d’exécution de la CLI gère la politique partagée du Node.
- Tunnels SSH en mode distant ou connexions directes au Gateway.

L’app ne remplace **pas** la documentation générale du Gateway ou de la CLI. La configuration du
Gateway, les fournisseurs, les plugins, les canaux, les outils et la sécurité sont décrits dans leurs
propres documentations.

## Pages détaillées sur macOS

| Tâche                                             | Documentation                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Installer ou déboguer le service CLI/Gateway      | [Gateway sur macOS](/fr/platforms/mac/bundled-gateway)                                          |
| Conserver l’état hors des dossiers synchronisés avec le cloud | [Gateway sur macOS](/fr/platforms/mac/bundled-gateway#state-directory-on-macos)       |
| Déboguer la détection de l’app et la connectivité | [Gateway sur macOS](/fr/platforms/mac/bundled-gateway#debug-app-connectivity)                    |
| Comprendre le comportement de launchd             | [Cycle de vie du Gateway](/fr/platforms/mac/child-process)                                      |
| Résoudre les problèmes d’autorisations ou de signature/TCC | [Autorisations macOS](/fr/platforms/mac/permissions)                                    |
| Détecter le Mac utilisé le plus récemment         | [Présence de l’ordinateur actif](/fr/nodes/presence)                                            |
| Se connecter à un Gateway distant                 | [Contrôle à distance](/fr/platforms/mac/remote)                                                  |
| Consulter l’état de la barre des menus et les contrôles de santé | [Barre des menus](/fr/platforms/mac/menu-bar), [Contrôles de santé](/fr/platforms/mac/health) |
| Utiliser l’interface de chat intégrée             | [WebChat](/fr/platforms/mac/webchat)                                                            |
| Utiliser l’activation vocale ou le mode appuyer-pour-parler | [Activation vocale](/fr/platforms/mac/voicewake)                                      |
| Utiliser Canvas et les liens profonds Canvas      | [Canvas](/fr/platforms/mac/canvas)                                                              |
| Héberger PeekabooBridge pour l’automatisation de l’interface | [Pont Peekaboo](/fr/platforms/mac/peekaboo)                                           |
| Configurer les approbations de commandes          | [Approbations d’exécution](/fr/tools/exec-approvals), [détails avancés](/fr/tools/exec-approvals-advanced) |
| Inspecter les commandes du Node Mac et l’IPC de l’app | [IPC macOS](/fr/platforms/mac/xpc)                                                           |
| Capturer les journaux                             | [Journalisation macOS](/fr/platforms/mac/logging)                                               |
| Compiler depuis les sources                       | [Configuration de développement macOS](/fr/platforms/mac/dev-setup)                             |

## Pages connexes

- [Plateformes](/fr/platforms)
- [Bien démarrer](/fr/start/getting-started)
- [Gateway](/fr/gateway)
- [Approbations d’exécution](/fr/tools/exec-approvals)
