---
read_when:
    - Vous souhaitez utiliser le Gateway depuis un navigateur
    - Vous souhaitez accéder au Tailnet sans tunnels SSH
sidebarTitle: Control UI
summary: Interface de contrôle web pour le Gateway (chat, activité, nœuds, configuration)
title: Interface de contrôle
x-i18n:
    generated_at: "2026-07-12T16:07:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5e9902cd8c2b7af0f47eaeec73cf365dd0f3963900b28880d4150939a1f447a2
    source_path: web/control-ui.md
    workflow: 16
---

L’interface de contrôle est une petite application monopage **Vite + Lit** servie par le Gateway :

- par défaut : `http://<host>:18789/`
- préfixe facultatif : définissez `gateway.controlUi.basePath` (par ex. `/openclaw`)

Elle communique **directement avec le WebSocket du Gateway** sur le même port.

## Ouverture rapide (en local)

Si le Gateway s’exécute sur le même ordinateur, ouvrez [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/)).

Si la page ne se charge pas, démarrez d’abord le Gateway : `openclaw gateway`.

<Note>
Pour les liaisons LAN Windows natives, le pare-feu Windows ou une stratégie de groupe gérée par l’organisation peut toujours bloquer l’URL LAN annoncée, même si `127.0.0.1` fonctionne sur l’hôte du Gateway. Exécutez `openclaw gateway status --deep` sur l’hôte Windows ; la commande signale les ports probablement bloqués, les incompatibilités de profils et les règles de pare-feu locales que la stratégie peut ignorer.
</Note>

L’authentification est fournie pendant la négociation WebSocket via :

- `connect.params.auth.token`
- `connect.params.auth.password`
- les en-têtes d’identité Tailscale Serve lorsque `gateway.auth.allowTailscale: true`
- les en-têtes d’identité du proxy de confiance lorsque `gateway.auth.mode: "trusted-proxy"`

Le panneau des paramètres du tableau de bord conserve un jeton pour la session de l’onglet actuel du navigateur et l’URL du Gateway sélectionnée ; les mots de passe ne sont pas conservés. L’intégration initiale génère généralement un jeton de Gateway pour l’authentification par secret partagé lors de la première connexion, mais l’authentification par mot de passe fonctionne également lorsque `gateway.auth.mode` vaut `"password"`.

## Appairage d’un appareil (première connexion)

La connexion depuis un nouveau navigateur ou appareil nécessite généralement une **approbation d’appairage unique**, affichée sous la forme `disconnected (1008): pairing required`.

<Steps>
  <Step title="Répertorier les demandes en attente">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Approuver à l’aide de l’ID de demande">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Si le navigateur retente l’appairage avec des informations d’authentification modifiées (rôle/portées/clé publique), la demande en attente précédente est remplacée et un nouveau `requestId` est créé ; exécutez de nouveau `openclaw devices list` avant d’approuver.

Le passage d’un navigateur déjà appairé d’un accès en lecture à un accès en écriture/administrateur est traité comme une élévation d’approbation, et non comme une reconnexion silencieuse : OpenClaw maintient l’ancienne approbation active, bloque la reconnexion avec des droits plus étendus et vous demande d’approuver explicitement le nouvel ensemble de portées.

Une fois approuvé, l’appareil est mémorisé et ne nécessite plus de nouvelle approbation, sauf si vous la révoquez avec `openclaw devices revoke --device <id> --role <role>`. Consultez la [CLI des appareils](/fr/cli/devices) pour la rotation et la révocation des jetons, ainsi que le flux d’approbation à la première exécution de Paperclip / `openclaw_gateway`.

<Note>
- Les connexions directes du navigateur via l’interface de bouclage locale (`127.0.0.1` / `localhost`) sont approuvées automatiquement.
- Tailscale Serve peut éviter l’aller-retour d’appairage pour les sessions d’opérateur de l’interface de contrôle lorsque `gateway.auth.allowTailscale: true`, que l’identité Tailscale est vérifiée et que le navigateur présente son identité d’appareil. Les navigateurs sans appareil et les connexions avec un rôle de Node suivent toujours les vérifications d’appareil normales.
- Les liaisons directes au Tailnet, les connexions de navigateur via le LAN et les profils de navigateur sans identité d’appareil nécessitent toujours une approbation explicite.
- Chaque profil de navigateur génère un ID d’appareil unique ; changer de navigateur ou effacer les données du navigateur nécessite donc un nouvel appairage.

</Note>

## Appairer un appareil mobile

Un administrateur déjà appairé peut créer le code QR de connexion iOS/Android sans ouvrir de terminal :

<Steps>
  <Step title="Ouvrir l’appairage mobile">
    Sélectionnez **Appareils**, puis cliquez sur **Appairer un appareil mobile** dans la carte **Appareils**.
  </Step>
  <Step title="Connecter le téléphone">
    Dans l’application mobile OpenClaw, ouvrez **Paramètres** → **Gateway** et scannez le code QR. Vous pouvez aussi copier et coller le code de configuration.
  </Step>
  <Step title="Confirmer la connexion">
    L’application iOS/Android officielle se connecte automatiquement. Si **Approbation en attente** affiche une demande, vérifiez son rôle et ses portées avant de l’approuver.
  </Step>
</Steps>

La création d’un code de configuration nécessite `operator.admin` ; le bouton est désactivé pour les sessions qui ne disposent pas de cette portée. Un code de configuration contient un identifiant d’amorçage à courte durée de vie ; traitez donc le code QR et le code copié comme un mot de passe tant qu’ils sont valides. Pour l’appairage à distance, le Gateway doit être accessible via `wss://` (par exemple au moyen de Tailscale Serve/Funnel) ; le protocole `ws://` en clair est limité à l’interface de bouclage et aux adresses LAN privées. Consultez [Appairage](/fr/channels/pairing#pair-from-the-control-ui-recommended) pour obtenir tous les détails sur la sécurité et les solutions de repli.

## Identité personnelle (locale au navigateur)

L’interface de contrôle prend en charge une identité personnelle propre à chaque navigateur (nom d’affichage et avatar), jointe aux messages sortants afin d’identifier leur auteur dans les sessions partagées. Elle réside dans le stockage du navigateur, limitée au profil de navigateur actuel, et n’est ni synchronisée avec d’autres appareils ni conservée côté serveur au-delà des métadonnées habituelles d’auteur de la transcription pour les messages que vous envoyez. L’effacement des données du site ou le changement de navigateur la réinitialise à une valeur vide.

Le remplacement de l’avatar de l’assistant suit le même modèle local au navigateur : les remplacements téléversés se superposent localement à l’identité résolue par le Gateway et ne transitent jamais par `config.patch`. Le champ de configuration partagé `ui.assistant.avatar` reste disponible pour les clients autres que l’interface utilisateur qui écrivent directement dans ce champ.

## Point de terminaison de la configuration d’exécution

L’interface de contrôle récupère ses paramètres d’exécution depuis `/control-ui-config.json`, résolu par rapport au chemin de base de l’interface de contrôle du Gateway (par exemple `/__openclaw__/control-ui-config.json` avec le chemin de base `/__openclaw__/`). Ce point de terminaison est protégé par la même authentification du Gateway que le reste de la surface HTTP : les navigateurs non authentifiés ne peuvent pas le récupérer, et une récupération réussie nécessite un jeton ou un mot de passe de Gateway valide, une identité Tailscale Serve ou une identité de proxy de confiance.

## État de l’hôte du Gateway

Ouvrez **Paramètres** dans la vue Simple pour afficher la carte **Hôte du Gateway**, qui indique la machine du Gateway, l’adresse LAN, le système d’exploitation, l’environnement d’exécution, la durée de fonctionnement, la charge du processeur, la mémoire et l’espace disque du volume d’état. Tant qu’elle est visible, la carte s’actualise toutes les 10 secondes via le RPC `system.info` du Gateway, qui nécessite la portée `operator.read`. Les anciens Gateways et les connexions ne disposant pas de cette portée n’affichent pas la carte.

## Prise en charge des langues

Lors du premier chargement, l’interface de contrôle se localise en fonction des paramètres régionaux de votre navigateur. Pour les remplacer ultérieurement, ouvrez **Paramètres -> Général -> Langue** (le sélecteur se trouve dans la carte des paramètres rapides Général, et non sous Apparence).

- Paramètres régionaux pris en charge : `en`, `ar`, `de`, `es`, `fa`, `fr`, `hi`, `id`, `it`, `ja-JP`, `ko`, `nl`, `pl`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`
- Les traductions autres que l’anglais sont chargées à la demande dans le navigateur.
- Les paramètres régionaux sélectionnés sont enregistrés dans le stockage du navigateur et réutilisés lors des visites ultérieures.
- Les clés de traduction manquantes utilisent l’anglais comme solution de repli.

Les traductions de la documentation sont générées pour le même ensemble de paramètres régionaux autres que l’anglais, mais le sélecteur de langue Mintlify intégré au site de documentation ne répertorie que les codes de paramètres régionaux acceptés par Mintlify. Les documentations en thaï (`th`) et en persan (`fa`) sont tout de même générées dans le dépôt de publication ; elles peuvent ne pas apparaître dans ce sélecteur tant que Mintlify ne prend pas en charge ces codes.

## Thèmes d’apparence

Le panneau Apparence comprend les thèmes intégrés Claw, Knot et Dash (Claw est le thème par défaut), ainsi qu’un emplacement d’importation tweakcn propre au navigateur. Pour importer un thème, ouvrez l’[éditeur tweakcn](https://tweakcn.com/editor/theme), choisissez ou créez un thème, cliquez sur **Share**, puis collez le lien copié dans Apparence. L’outil d’importation accepte également les URL de registre `https://tweakcn.com/r/themes/<id>`, les URL de l’éditeur telles que `https://tweakcn.com/editor/theme?theme=amethyst-haze`, les chemins relatifs `/themes/<id>`, les ID de thème bruts et les noms de thème par défaut tels que `amethyst-haze`.

Les thèmes importés sont stockés uniquement dans le profil de navigateur actuel ; ils ne sont pas écrits dans la configuration du Gateway et ne sont pas synchronisés entre les appareils. Le remplacement du thème importé met à jour l’unique emplacement local ; son effacement réactive Claw si le thème importé était actif.

Apparence comprend également un paramètre Taille du texte propre au navigateur, stocké avec les autres préférences de l’interface de contrôle. Il s’applique au texte des discussions, au texte de l’éditeur de message, aux cartes d’outils et aux barres latérales des discussions, et conserve une taille minimale de 16px pour les champs de saisie afin d’éviter que Safari mobile n’effectue un zoom automatique lors de leur activation.

## Gérer les plugins

Ouvrez **Plugins** dans la barre latérale, ou utilisez `/settings/plugins` par rapport au
chemin de base configuré de l’interface de contrôle, pour parcourir et gérer les plugins sans quitter
l’interface de contrôle. Par exemple, un chemin de base `/openclaw` utilise
`/openclaw/settings/plugins`. La page est toujours disponible, même lorsque tous les
plugins facultatifs sont désactivés.

Plugins est un espace central comprenant quatre onglets : **Installés** et **Découvrir** gèrent le code des plugins
dans `/settings/plugins`, **Skills** héberge le gestionnaire de Skills par agent dans
`/skills`, et **Atelier** héberge l’examen des propositions de l’Atelier de Skills dans
`/skills/workshop`. Chaque onglet conserve sa propre URL, et la barre latérale affiche
une seule entrée Plugins pour l’ensemble de ces onglets.

L’onglet **Installés** affiche l’inventaire local complet regroupé par catégorie, avec
des nombres récapitulatifs. Chaque ligne ouvre une vue détaillée ; son menu de débordement (`…`)
permet d’activer ou de désactiver le plugin et propose **Supprimer** pour les plugins installés depuis une source externe.
Il répertorie également les [serveurs MCP](/fr/cli/mcp) configurés et permet de les ajouter, de les désactiver
et de les supprimer directement. L’onglet **Découvrir** constitue la boutique : plugins mis en avant
inclus avec OpenClaw, plugins externes officiels et connecteurs MCP en un clic
pour les services populaires. La saisie dans le champ de recherche interroge
[ClawHub](https://clawhub.ai/plugins) directement et ajoute une section **Depuis ClawHub**
avec le nombre de téléchargements et des badges de vérification de la source. Les liens profonds peuvent
cibler directement la boutique avec `/settings/plugins?tab=discover`.

L’onglet **Skills** conserve le rapport d’état des Skills, les boutons d’activation/désactivation, la saisie de la clé
d’API et la recherche intégrée de Skills dans ClawHub, le tout limité à l’agent sélectionné. L’onglet
**Atelier** conserve le tableau de l’Atelier de Skills et le flux d’examen du jour pour les
[propositions de Skills](/fr/tools/skill-workshop).

Les plugins inclus sont déjà présents sur le Gateway et affichent **Activer** ou
**Désactiver** au lieu de **Installer**. Par exemple, Workboard est inclus avec
OpenClaw, mais désactivé par défaut ; son action est donc **Activer**. Les plugins intégrés
ne peuvent pas être supprimés, seulement désactivés.

La lecture du catalogue et la recherche dans ClawHub nécessitent `operator.read`. L’installation,
l’activation, la désactivation ou la suppression d’un plugin, ainsi que la modification des serveurs MCP, nécessitent
`operator.admin` ; ces actions restent désactivées pour les opérateurs disposant uniquement d’un accès en lecture.

Les installations depuis ClawHub s’effectuent par l’intermédiaire du Gateway et appliquent les mêmes contrôles
de confiance, d’intégrité et de stratégie d’installation des plugins que les autres installations gérées par le Gateway. L’installation
ou la suppression du code d’un plugin nécessite le redémarrage du Gateway. L’activation ou la désactivation d’un
plugin installé peut s’appliquer sans redémarrage lorsque le plugin et l’environnement d’exécution actuel du
Gateway le permettent ; sinon, l’interface utilisateur indique qu’un redémarrage est
nécessaire. Les connecteurs MCP reposant sur OAuth nécessitent une exécution unique de
`openclaw mcp login <name>` depuis la CLI après leur ajout.

La page se concentre volontairement sur l’inventaire, la découverte, l’installation, l’activation
et la suppression. Utilisez [`openclaw plugins`](/fr/cli/plugins) pour les sources npm, git ou
les chemins locaux arbitraires, les mises à jour et la configuration avancée des plugins.

## Navigation dans la barre latérale

La barre latérale épingle la navigation au-dessus d’une liste de sessions défilante. Dans les configurations multi-agents, chaque agent apparaît comme une section de premier niveau repliable ; le développement d’un agent permet de parcourir ses sessions sans quitter la conversation ouverte, et les agents repliés affichent un indicateur de messages non lus. Pour chaque agent, la liste est divisée entre **Épinglées**, une section intégrée pour chaque canal connecté (Telegram, Slack, WhatsApp, ...), une section intégrée **Travail** pour les sessions liées à un worktree géré ou à un nœud d’exécution (les lignes affichent une ligne `repo ⎇ branch` ainsi que l’hôte du nœud), les groupes personnalisés (la `category` de la session) et **Conversations** pour le reste. Les sections de canaux et Travail classent automatiquement les lignes ; l’affectation d’une session à un groupe personnalisé prévaut toujours. L’ouverture d’une session déplace la surbrillance de sélection sans réordonner les lignes. Les sessions ayant connu une nouvelle activité depuis leur dernière lecture affichent un point de non-lecture, et leur ouverture les marque comme lues. Chaque ligne de session comporte un menu contextuel (bouton à trois points verticaux ou clic droit) proposant Épingler/Désépingler, Marquer comme non lue/lue, Renommer, Dupliquer, Déplacer vers le groupe (y compris Nouveau groupe et Retirer du groupe), Archiver et Supprimer ; sur les interfaces tactiles, les commandes directes d’épinglage et de menu restent visibles. Un Cmd/Ctrl-clic ajoute ou retire des lignes d’une sélection multiple, et un Maj-clic étend celle-ci selon l’ordre visible ; l’ouverture du menu sur une ligne sélectionnée propose alors des actions groupées (Marquer N comme non lues/lues, Déplacer N vers le groupe, Archiver N, Supprimer N) qui s’appliquent à toutes les sessions sélectionnées, avec une seule confirmation pour la suppression groupée. Faites glisser une session vers un groupe personnalisé ou **Conversations** pour la déplacer. Les en-têtes des groupes personnalisés peuvent être repliés, développés ou déplacés par glisser-déposer pour modifier leur ordre ; les noms des groupes et leur ordre sont stockés dans le Gateway (`sessions.groups.*`) et vous suivent donc d’un navigateur à l’autre, tandis que l’état replié reste dans le profil du navigateur. Les en-têtes de groupe comportent également un menu (bouton à trois points verticaux ou clic droit) proposant Renommer le groupe, Nouveau groupe et Supprimer le groupe ; renommer ou supprimer un groupe met à jour côté serveur toutes les sessions qui en sont membres, y compris celles archivées, et la suppression d’un groupe conserve ses sessions et les replace dans Conversations. L’unique bouton **+** dans l’en-tête de la liste des sessions ouvre la page Nouvelle session (voir ci-dessous). La commande de tri comporte également une option Grouper par : Groupées (par défaut) ou Aucun pour obtenir une seule liste non groupée (**Épinglées** reste séparée) ; ce choix est stocké dans le profil du navigateur actuel. **Utilisation**, **Automatisations** et **Plugins** sont épinglés par défaut ; développez **Plus** pour accéder à toutes les autres destinations. Sélectionnez **Modifier les éléments épinglés** sous Plus, ou cliquez avec le bouton droit sur la zone de navigation, pour épingler ou désépingler des destinations et restaurer les valeurs par défaut. L’ensemble des éléments épinglés et l’état de développement de Plus sont stockés dans le profil du navigateur actuel et persistent après les rechargements.

## Page Nouvelle session

Le bouton **+** dans l’en-tête de la liste des sessions de la barre latérale ouvre un brouillon en pleine page à l’adresse `/new` : rien n’est créé avant l’envoi du premier message. Une ligne de destination située au-dessus de la zone de message permet de choisir où la session s’exécute : l’agent (dans les configurations multi-agents), l’emplacement d’exécution des commandes (**Gateway · local** ou un nœud appairé qui expose `system.run` ; nécessite `operator.admin`), le dossier (par défaut, l’espace de travail de l’agent ; les autres chemins absolus du Gateway nécessitent `operator.admin` et un worktree), ainsi qu’une option **Worktree** facultative avec un sélecteur de branche de base (alimenté par `worktrees.branches`, sans effectuer de récupération) et un nom de worktree facultatif (la branche devient `openclaw/<name>`). Le bouton de parcours de la puce du dossier ouvre un sélecteur de répertoire intégré reposant sur la méthode `fs.listDir`, réservée aux administrateurs. Son niveau supérieur affiche le Gateway et tous les nœuds connus ; les nœuds hors ligne et ceux qui ne prennent pas en charge la navigation dans les répertoires restent visibles, mais désactivés. La sélection du Gateway commence à partir du dossier actuel ou du répertoire personnel du Gateway. La sélection d’un nœud compatible permet de parcourir le système de fichiers de son hôte, d’y lier l’exécution des commandes et d’utiliser directement le chemin absolu sélectionné sur le nœud (les worktrees gérés restent réservés au Gateway). L’envoi appelle `sessions.create` avec le premier message, de sorte que l’exécution démarre au cours du même aller-retour et que l’interface accède directement à la conversation de la nouvelle session. Si le Gateway crée la session, mais rejette ce premier envoi, la conversation conserve l’invite et l’erreur après les rechargements ; **Réessayer** l’envoie par l’intermédiaire de la session déjà créée au lieu d’en créer une autre.

Dans **Paramètres**, la barre latérale dédiée commence par un champ **Rechercher dans les paramètres** permettant de trouver rapidement les sections de paramètres.

Un champ **Rechercher** en haut de la barre latérale ouvre la palette de commandes (⌘K). Cliquer sur la marque OpenClaw dans l’en-tête de la barre latérale ouvre l’écran épuré de démarrage d’une nouvelle session. Lorsqu’un élément nécessite une intervention — tâches Cron échouées ou en retard, authentification de modèle arrivant à expiration ou expirée — des pastilles d’attention compactes apparaissent au-dessus du pied de la barre latérale et permettent d’accéder à la page correspondante. Le pied compact regroupe l’état de la connexion, les **Paramètres**, la **Documentation**, l’association mobile et le sélecteur de mode de couleur clair/sombre/système ; lorsque le Gateway s’exécute depuis un dépôt de code source sur une branche autre que `main`, le pied affiche également le nom de cette branche en rouge afin qu’un Gateway hors version publiée soit immédiatement identifiable (les installations de versions publiées ne l’affichent jamais). Maj-Commande-Virgule ouvre les **Paramètres** sans remplacer le raccourci Commande-Virgule du navigateur. L’en-tête de la barre latérale contient également le bouton de réduction (⌘B) ; la réduction masque entièrement la barre latérale pour offrir un espace de travail en pleine largeur, et un bouton d’agrandissement flottant (ou ⌘B) la rétablit ; dans l’application macOS, ce bouton est intégré nativement à la barre de titre. La barre latérale constitue le seul élément de navigation sur ordinateur, sans barre supérieure. Sur les fenêtres étroites, elle est remplacée par un tiroir coulissant derrière une ligne d’en-tête compacte contenant le bouton du tiroir, la marque et la recherche de la palette de commandes ; dans l’application macOS, cette ligne d’en-tête intègre l’espace réservé à la barre de titre dans une seule bande compacte à côté des commandes de la fenêtre. La navigation utilise l’historique standard du navigateur, de sorte que les boutons précédent/suivant du navigateur permettent de la parcourir ; l’application macOS ajoute un bouton natif pour la barre latérale à côté des commandes de la fenêtre ainsi que des gestes de balayage sur le pavé tactile, avec des boutons précédent/suivant sur le bord droit de la barre latérale lorsqu’elle est déployée, et des boutons natifs de recherche (palette de commandes) et de nouvelle session lorsqu’elle est réduite.

## Ce qu’il peut faire (aujourd’hui)

  <AccordionGroup>
  <Accordion title="Chat and Talk">
    - Discutez avec le modèle via le WebSocket du Gateway (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Les actualisations de l’historique des discussions demandent une fenêtre récente de taille limitée, avec des plafonds de texte par message, afin que les sessions volumineuses n’obligent pas le navigateur à afficher l’intégralité de la transcription avant que la discussion devienne utilisable.
    - Le survol ou la sélection au clavier du lien d’un ticket GitHub public ou d’une demande de tirage affiche son état, son titre, son auteur, son activité récente, ses commentaires et les statistiques des modifications. Le Gateway connecté récupère et met en cache les métadonnées publiques sans modifier la cible du lien, y compris lorsque l’interface utilisateur emploie un Gateway distant. Le Gateway utilise `GH_TOKEN` ou `GITHUB_TOKEN` lorsqu’ils sont disponibles, après avoir confirmé que le dépôt est public ; sinon, il utilise l’API anonyme de GitHub avec une durée de mise en cache plus longue.
    - Conversez au moyen de sessions en temps réel dans le navigateur. OpenAI utilise directement WebRTC, Google Live utilise par WebSocket un jeton de navigateur à usage unique et à portée limitée, et les plugins vocaux en temps réel réservés au backend utilisent le transport relais du Gateway. Les sessions de fournisseur détenues par le client commencent par `talk.client.create` ; les sessions relayées par le Gateway commencent par `talk.session.create`. Le relais conserve les identifiants du fournisseur sur le Gateway tandis que le navigateur diffuse le flux PCM du microphone via `talk.session.appendAudio`, transmet les appels d’outils du fournisseur `openclaw_agent_consult` via `talk.client.toolCall` afin d’appliquer la politique du Gateway et d’utiliser le modèle OpenClaw configuré de plus grande taille, et achemine le pilotage vocal de l’exécution active via `talk.client.steer` ou `talk.session.steer`.
    - Diffusez les appels d’outils et les cartes de sortie d’outils en direct dans la discussion (événements de l’agent). L’activité des outils s’affiche sous forme de lignes adaptées à leur type : les commandes shell affichent la commande avec coloration syntaxique et une sortie de style terminal ; les appels de modification et d’écriture pris en charge affichent des différences intégrées de taille limitée, les numéros de ligne lorsqu’ils sont disponibles et les statistiques `+added -removed` ; les appels consécutifs sont regroupés dans un résumé tel que « 13 commandes exécutées, 6 fichiers lus, 9 fichiers modifiés ». Tant qu’une exécution est en cours, le nom de l’appel en cours le plus récent sert d’en-tête au groupe. Développez une ligne pour examiner les arguments restants et la sortie brute.
    - Titres facultatifs générés par l’IA pour indiquer l’objectif des appels d’outils complexes (longues commandes shell, outils de plugin comportant de nombreux arguments), activés avec `gateway.controlUi.toolTitles: true` (désactivés par défaut). Les titres proviennent de la méthode groupée `chat.toolTitles` au moyen du routage standard des modèles utilitaires — un `utilityModel` explicite (fournisseur choisi par l’opérateur, comme pour les autres tâches utilitaires), ou à défaut le petit modèle déclaré par défaut par le fournisseur de la session — et sont mis en cache par agent côté Gateway. Lorsque cette option n’est pas activée ou qu’aucun modèle économique n’est utilisable, les lignes conservent leurs libellés déterministes et aucun appel de modèle n’est effectué.
    - Démarrez ou ignorez les tâches de suivi éphémères suggérées par le modèle ; les suggestions acceptées ouvrent une nouvelle session dans un arbre de travail géré avec l’invite proposée.
    - Onglet Activité présentant des résumés locaux au navigateur, privilégiant la rédaction, de l’activité des outils en direct issue de la diffusion existante de `session.tool` et des événements d’outils.

  </Accordion>
  <Accordion title="Channels, sessions, memory">
    - Canaux : état des canaux intégrés ainsi que des canaux de plugins groupés/externes, connexion par code QR et configuration par canal (`channels.status`, `web.login.*`, `config.patch`).
    - L'actualisation des sondes de canaux maintient l'instantané précédent visible pendant l'exécution des vérifications lentes des fournisseurs et signale les instantanés partiels lorsqu'une sonde ou un audit dépasse le délai imparti par l'interface utilisateur.
    - Sessions : répertoriez par défaut les sessions des agents configurés, épinglez les sessions fréquentes, renommez-les, archivez ou restaurez les sessions inactives, utilisez une solution de repli pour les clés de session obsolètes d'agents non configurés et appliquez des remplacements par session pour le modèle, la réflexion, les modes rapide/détaillé, la trace et le raisonnement (`sessions.list`, `sessions.patch`). Les sessions épinglées sont triées avant les sessions récentes non épinglées ; les sessions archivées se trouvent dans la vue des archives de la page Sessions et conservent leurs transcriptions. Les lignes affichent un point indiquant les sessions non lues ayant eu une activité depuis leur dernière lecture, avec des actions pour les marquer comme non lues ou lues (`sessions.patch { unread }`), ainsi qu'une action de duplication qui crée une branche de la transcription dans une nouvelle session (`sessions.create { parentSessionKey, fork: true }`). Les vignettes de vue d'ensemble au-dessus du tableau résument la liste chargée (nombre de sessions, exécutions actives, sessions non lues, nombre total de jetons), chaque ligne comporte un glyphe de type accompagné d'un point pour les exécutions actives, l'état est représenté par un simple point accompagné d'un libellé, et la colonne Jetons affiche un indicateur d'utilisation de la fenêtre de contexte lorsque la session communique le nombre de jetons et la taille du contexte. Les actions de gestion des lignes se trouvent dans un menu propre à chaque ligne (bouton à trois points verticaux ou clic droit) qui reproduit le menu de session de la barre latérale, et le panneau de la ligne affiche l'environnement d'exécution de l'agent et la durée d'exécution avec les autres détails de la session.
    - Regroupement des sessions : une commande de regroupement organise le tableau des sessions en sections par groupes personnalisés, canal, type, agent ou date. Les groupes personnalisés sont conservés pour chaque session via `sessions.patch` (`category`), ce qui permet également de catégoriser les sessions démarrées depuis des canaux de messagerie (Discord, Telegram, WhatsApp, etc.) ; attribuez des groupes en faisant glisser les lignes vers une section ou au moyen du sélecteur de groupe propre à chaque ligne, et créez des groupes avec l'action de création d'un groupe.
    - Mémoire (un onglet de la page Agents, limité à l'agent sélectionné) : état de Dreaming, commande d'activation/désactivation et lecteur du journal des rêves (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, tâches, plugins, compétences, appareils, approbations d’exécution">
    - Automatisations (tâches Cron) : cartes de statistiques (nombre d’automatisations, nombre d’échecs, état du planificateur, prochain réveil) au-dessus d’un sélecteur d’onglets Automatisations/Historique des exécutions ; l’onglet Automatisations répertorie les tâches dans un tableau filtrable (Toutes/Actives/En pause, recherche, filtres de planification et de dernière exécution, menu d’actions par ligne), avec des suggestions de démarrage en dessous, tandis que l’onglet Historique des exécutions affiche les exécutions récentes de toutes les automatisations (`cron.*`).
    - Tâches : registre en direct des tâches d’arrière-plan actives et récentes, avec sessions liées et possibilité d’annulation (`tasks.*`).
    - Plugins : parcourez l’inventaire installé et la boutique sélectionnée, recherchez dans ClawHub, installez et supprimez le code des plugins, et activez ou désactivez les plugins installés (`plugins.*`) ; les lignes des serveurs MCP modifient `mcp.servers` au moyen des méthodes de configuration.
    - Compétences : état, activation/désactivation, installation et mises à jour des clés API (`skills.*`).
    - Appareils : un inventaire unique regroupe les enregistrements d’appareils appairés, le catalogue des nœuds et la présence en direct (`device.pair.list`, `node.list`, `system-presence`). L’hôte Gateway est épinglé en premier ; les clients appairés affichent l’état de la connexion, les rôles, les jetons, les capacités et les commandes. Les appairages en double sont regroupés dans un groupe extensible, et **Nettoyer N éléments obsolètes** supprime en bloc, après confirmation de l’administrateur, les doublons hors ligne qui ont été approuvés automatiquement (local silencieux, CIDR de confiance ou vérification SSH) ou qui sont antérieurs à la traçabilité des approbations. Les entrées peuvent être supprimées (`node.pair.remove`, `device.pair.remove`), l’appairage des appareils et les nouvelles approbations des nœuds sont gérés directement (`device.pair.*`, `node.pair.approve`/`reject`), et les codes de configuration mobile sont créés depuis la même carte.
    - Approbations d’exécution : modifiez les listes d’autorisation du Gateway ou des nœuds ainsi que la politique de demande pour `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuration">
    - Consultez/modifiez `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Profil : page de paramètres affichant l’identité de l’agent par défaut avec les statistiques d’utilisation cumulées — jetons sur toute la durée de vie, journée de pointe, session la plus longue, séries d’activité, carte thermique des jetons sur un an, principaux outils et temps forts par canal (`usage.cost`, `sessions.usage`).
    - MCP dispose d’une page de paramètres dédiée comprenant des lignes de serveurs en lecture seule (transport, activation, résumés OAuth/filtres/parallélisme), des commandes courantes pour les opérateurs et l’éditeur de configuration limité à `mcp` ; l’ajout, l’activation/désactivation et la suppression de serveurs s’effectuent sur la page Plugins.
    - Fournisseurs de modèles : page de paramètres répertoriant chaque fournisseur de modèles configuré avec son icône de marque, son état d’authentification (`models.authStatus`), la disponibilité des modèles (`models.list`), les données en direct sur le forfait, les quotas et la facturation lorsque le fournisseur les communique (`usage.status`), ainsi que les dépenses locales des sessions sur les 30 derniers jours (`sessions.usage`). Une action Actualiser relit l’état des identifiants et l’utilisation du fournisseur.
    - Connexion : page de paramètres (sous **Connexions**) qui gère la propre liaison au Gateway du tableau de bord — URL WebSocket, jeton du Gateway, mot de passe et clé de session par défaut — ainsi que le dernier instantané de négociation (état, durée de fonctionnement, intervalle d’impulsion, dernière actualisation des canaux). La porte de connexion hors ligne gère le cas déconnecté ; cette page modifie la connexion lorsqu’elle est établie.
    - Appliquez la configuration et redémarrez avec validation (`config.apply`), puis réveillez la dernière session active.
    - Les écritures comprennent une protection par hachage de base afin d’éviter d’écraser des modifications concurrentes.
    - Les écritures (`config.set`/`config.apply`/`config.patch`) vérifient au préalable la résolution des SecretRef actives pour les références de la charge utile de configuration envoyée ; les références actives envoyées qui ne peuvent pas être résolues sont rejetées avant l’écriture.
    - Les enregistrements de formulaire écartent les espaces réservés masqués obsolètes qui ne peuvent pas être restaurés à partir de la configuration enregistrée, tout en conservant les valeurs masquées qui correspondent encore aux secrets enregistrés.
    - Le schéma et le rendu du formulaire proviennent de `config.schema` / `config.schema.lookup`, notamment les champs `title`/`description`, les indications d’interface correspondantes, les résumés des enfants immédiats, les métadonnées de documentation sur les nœuds imbriqués de type objet/joker/tableau/composition, ainsi que les schémas des plugins et des canaux lorsqu’ils sont disponibles. L’éditeur JSON brut n’est disponible que lorsque l’instantané permet un aller-retour brut sûr ; sinon, l’interface de contrôle impose le mode Formulaire.
    - Dans l’éditeur JSON brut, « Réinitialiser à la version enregistrée » conserve la structure créée en mode brut (mise en forme, commentaires, disposition de `$include`) au lieu de restituer un instantané aplati, afin que les modifications externes survivent à une réinitialisation lorsque l’instantané peut effectuer un aller-retour en toute sécurité.
    - Les valeurs d’objet SecretRef structurées sont affichées en lecture seule dans les champs de texte du formulaire afin d’éviter toute conversion accidentelle d’un objet en chaîne.

  </Accordion>
  <Accordion title="Utilisation">
    - L’analyse des jetons et des coûts estimés dérivée des sessions reste distincte de la facturation des fournisseurs.
    - Les cartes des fournisseurs appellent `usage.status` et affichent en direct les noms des forfaits, les périodes de quota, les soldes, les dépenses et les budgets communiqués par les plugins de fournisseurs configurés.
    - Une erreur d’utilisation d’un fournisseur ne bloque pas le tableau de bord des sessions et des coûts ; les cartes de fournisseurs indisponibles affichent leur propre état d’erreur.

  </Accordion>
  <Accordion title="Débogage, journaux, mise à jour">
    - Débogage : instantanés d’état, d’intégrité et de modèles, journal des événements et appels RPC manuels (`status`, `health`, `models.list`).
    - Le journal des événements comprend les durées d’actualisation et d’appels RPC de l’interface de contrôle, les durées de rendu lentes du chat et de la configuration, ainsi que des entrées sur la réactivité du navigateur pour les longues images d’animation ou les tâches longues lorsque le navigateur expose ces types d’entrées PerformanceObserver.
    - Journaux : suivi en direct des journaux de fichiers du Gateway avec filtrage/exportation (`logs.tail`).
    - Mise à jour : exécutez une mise à jour du paquet/dépôt Git suivie d’un redémarrage (`update.run`) avec un rapport de redémarrage, puis interrogez `update.status` après la reconnexion afin de vérifier la version du Gateway en cours d’exécution.

  </Accordion>
  <Accordion title="Remarques sur le panneau des automatisations">
    - La sélection d’une ligne ouvre une vue détaillée en pleine page avec un sélecteur Actif/En pause et Exécuter maintenant dans l’en-tête (exécuter si l’échéance est atteinte, cloner et supprimer dans son menu) ; l’onglet Paramètres modifie directement l’automatisation (invite, détails, fréquence, remplacements avancés) et l’onglet Historique des exécutions affiche les exécutions de cette automatisation.
    - Les automatisations de démarrage sous le tableau préremplissent le formulaire de création avec une invite et une planification modifiables.
    - Pour les tâches isolées, la livraison utilise par défaut l’annonce d’un résumé ; choisissez aucune pour les exécutions uniquement internes.
    - Les champs de canal/cible apparaissent lorsque l’annonce est sélectionnée.
    - Le mode Webhook utilise `delivery.mode = "webhook"` avec `delivery.to` défini sur une URL de Webhook HTTP(S) valide.
    - Pour les tâches de la session principale, les modes de livraison Webhook et aucune sont disponibles.
    - Les commandes de modification avancées comprennent la suppression après exécution, la suppression du remplacement d’agent, les options d’heure exacte/décalage de Cron, les remplacements du modèle/de la réflexion de l’agent et les options de livraison au mieux.
    - La validation du formulaire s’effectue directement avec des erreurs au niveau des champs ; les valeurs non valides désactivent le bouton d’enregistrement jusqu’à leur correction.
    - Définissez `cron.webhookToken` pour envoyer un jeton porteur dédié ; s’il est omis, le Webhook est envoyé sans en-tête d’authentification.
    - `cron.webhook` est un mécanisme de repli ancien et obsolète : exécutez `openclaw doctor --fix` pour migrer les tâches enregistrées qui utilisent encore `notify: true` vers une livraison explicite par Webhook ou en fin d’exécution pour chaque tâche.

  </Accordion>
</AccordionGroup>

## Page MCP

La page MCP dédiée est une vue destinée aux opérateurs pour les serveurs MCP gérés par OpenClaw sous `mcp.servers`. Elle ne démarre pas elle-même les transports MCP ; utilisez-la pour inspecter et modifier la configuration enregistrée, puis utilisez `openclaw mcp doctor --probe` lorsque vous avez besoin d’une preuve du serveur en direct.

Flux de travail type :

1. Ouvrez **MCP** dans la barre latérale.
2. Consultez les cartes récapitulatives pour connaître le nombre total de serveurs, ainsi que le nombre de serveurs activés, OAuth et filtrés.
3. Examinez chaque ligne de serveur pour connaître le transport, l’activation, l’authentification, les filtres, les délais d’expiration et les indications de commandes.
4. Gérez les serveurs (ajout, activation/désactivation, suppression) sur la page **Plugins**, qui est l’unique interface interactive d’écriture de `mcp.servers` ; la liste des lignes affichée ici contient un lien vers cette page.
5. Modifiez la section de configuration limitée à `mcp` pour les définitions de serveurs, les en-têtes, les chemins TLS/mTLS, les métadonnées OAuth, les filtres d’outils et les métadonnées de projection Codex.
6. Utilisez **Enregistrer** pour écrire la configuration, ou **Enregistrer et publier** lorsque le Gateway en cours d’exécution doit appliquer la configuration modifiée.
7. Exécutez `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` ou `openclaw mcp reload` depuis un terminal pour effectuer respectivement des diagnostics statiques, une preuve en direct ou la suppression du cache d’exécution.

La page masque avant le rendu les valeurs de type URL contenant des identifiants et place les noms de serveurs entre guillemets dans les extraits de commandes, afin que les commandes copiées fonctionnent toujours avec des espaces ou des métacaractères d’interpréteur de commandes. Référence complète de la CLI et de la configuration : [MCP](/fr/cli/mcp).

## Onglet Activité

L’onglet Activité se trouve dans **Paramètres › Système**, à côté de Journaux et Débogage. Il s’agit d’un observateur éphémère et local au navigateur de l’activité des outils en direct, dérivé du même flux d’événements Gateway `session.tool` / d’outils qui alimente les cartes d’outils du chat. Il n’ajoute pas d’autre famille d’événements du Gateway, de point de terminaison, de stockage durable de l’activité, de flux de métriques ni de flux d’observation externe.

Les entrées d’activité ne conservent que des résumés assainis et des aperçus de sortie masqués et tronqués. Les valeurs des arguments des outils ne sont pas stockées dans l’état de l’activité ; l’interface indique que les arguments sont masqués et enregistre uniquement le nombre de champs d’arguments. La liste en mémoire suit l’onglet actuel du navigateur, survit à la navigation dans l’interface de contrôle et est réinitialisée lors du rechargement de la page, d’un changement de session ou de l’utilisation de **Effacer**.

## Terminal de l’opérateur

Le terminal de l’opérateur ancrable est désactivé par défaut. Pour l’activer, définissez `gateway.terminal.enabled: true` et redémarrez le Gateway. Le terminal nécessite une connexion `operator.admin` et ouvre un pseudo-terminal de l’hôte dans l’espace de travail de l’agent actif. Les nouveaux onglets suivent l’agent de chat actuellement sélectionné.

<Warning>
Le terminal est un interpréteur de commandes hôte sans confinement et hérite de l’environnement du processus Gateway. Activez-le uniquement pour les déploiements destinés à des opérateurs de confiance. OpenClaw refuse les sessions de terminal pour les agents dont le paramètre est `sandbox.mode: "all"` ; le passage d’un agent actif à ce mode ferme ses sessions de terminal existantes et en cours d’ouverture.
</Warning>

Utilisez **Ctrl + accent grave** pour afficher ou masquer la zone ancrable. La disposition prend en charge l’ancrage en bas et à droite, s’adapte à la fenêtre d’affichage du navigateur et conserve plusieurs onglets d’interpréteur de commandes. Consultez la [configuration du Gateway](/fr/gateway/configuration-reference#gateway) pour `gateway.terminal.enabled` et le remplacement facultatif `gateway.terminal.shell`.

Les sessions survivent aux déconnexions : un rechargement de page, la mise en veille de l’ordinateur portable ou une brève coupure réseau détache la session sur le Gateway au lieu de l’interrompre, et le même onglet du navigateur s’y rattache lors de la reconnexion avec la sortie récente rejouée. Les sessions détachées sont interrompues après `gateway.terminal.detachedSessionTimeoutSeconds` (300 secondes par défaut ; `0` rétablit l’interruption lors de la déconnexion). `terminal.list` affiche les sessions auxquelles il est possible de se rattacher, `terminal.attach` en adopte une (prise de contrôle de type tmux) et `terminal.text` lit la sortie récente d’une session sous forme de texte brut sans s’y rattacher — une fonctionnalité destinée aux agents et aux outils.

Le terminal est également disponible sous la forme d’un document plein écran contenant uniquement le terminal à l’adresse `/?view=terminal`. Les applications iOS et Android intègrent cette page dans leurs écrans Terminal en réutilisant les identifiants du Gateway enregistrés ; la disponibilité dépend des mêmes conditions `gateway.terminal.enabled` et `operator.admin`, et la page affiche un avis lorsque le Gateway connecté ne propose pas le terminal.

## Panneau du navigateur

L’interface de contrôle fournit un panneau de navigateur ancrable qui affiche le navigateur contrôlé par le Gateway (celui que les agents pilotent également au moyen de l’[outil de navigation](/fr/tools/browser-control)) dans n’importe quel navigateur Web standard, sans vue Web native. Il apparaît lorsque le Gateway connecté annonce `browser.request` à une connexion `operator.admin` ; le bouton en forme de globe dans le rail de l’espace de travail de la session permet de l’afficher ou de le masquer. Le panneau présente un instantané en direct de la page avec des onglets, une barre d’URL modifiable, les commandes précédent/suivant/recharger et l’ouverture dans votre navigateur ; il s’ancre à droite ou en bas et transmet à la page distante les clics, le défilement à la molette et la saisie de base.

Deux modes de capture regroupent le contexte de la page pour l’agent :

- **Annoter (crayon)** : dessinez des annotations à main levée sur la page. **Envoyer au chat** intègre les tracés à la capture d’écran, joint l’image à la zone de rédaction du chat actif et préremplit une invite décrivant l’URL et le titre de la page, ainsi que chaque région marquée, afin que l’agent sache exactement ce que vous avez entouré.
- **Inspecter (pointeur)** : survolez un élément pour afficher celui qui se trouve sous le curseur (sélecteur, nom accessible, rôle, taille) ; cliquez pour envoyer les détails de cet élément ainsi qu’une capture d’écran où il est mis en évidence, via le même flux de rédaction. L’inspection, le défilement à la molette et la navigation arrière/avant nécessitent `browser.evaluateEnabled` (activé par défaut).

L’app macOS conserve sa barre latérale native de navigation des liens pour les liens sur lesquels vous cliquez dans le tableau de bord ; le panneau du navigateur y fonctionne également et permet d’annoter des pages sur toutes les autres plateformes.

## Comportement du chat

  <AccordionGroup>
  <Accordion title="Sémantique de l’envoi et de l’historique">
    - `chat.send` est **non bloquant** : il accuse immédiatement réception avec `{ runId, status: "started" }`, puis la réponse est diffusée via des événements `chat`. Les clients Control UI approuvés peuvent également recevoir des métadonnées facultatives sur le délai d’accusé de réception à des fins de diagnostic local.
    - Les téléversements dans le chat acceptent les images ainsi que les fichiers autres que vidéo. Les images conservent le chemin d’image natif ; les autres fichiers sont stockés comme médias gérés et affichés dans l’historique sous forme de liens vers des pièces jointes.
    - Un nouvel envoi avec la même `idempotencyKey` renvoie `{ status: "in_flight" }` pendant l’exécution, puis `{ status: "ok" }` après son achèvement.
    - La taille des réponses de `chat.history` est limitée pour garantir la sécurité de l’interface utilisateur. Lorsque les entrées de transcription sont trop volumineuses, le Gateway peut tronquer les longs champs de texte, omettre les blocs de métadonnées lourds et remplacer les messages surdimensionnés par un espace réservé (`[chat.history omitted: message too large]`).
    - Lorsqu’un message visible de l’assistant a été tronqué dans `chat.history`, le lecteur latéral peut récupérer à la demande l’entrée de transcription complète normalisée pour l’affichage via `chat.message.get`, à l’aide de `sessionKey`, de l’`agentId` actif lorsque nécessaire et du `messageId` de la transcription. Si le Gateway ne peut toujours pas en renvoyer davantage, le lecteur affiche un état d’indisponibilité explicite au lieu de répéter silencieusement l’aperçu tronqué.
    - Les images de l’assistant ou générées sont conservées sous forme de références à des médias gérés et resservies via des URL de médias authentifiées du Gateway, afin que les rechargements ne dépendent pas de la présence durable des charges utiles d’image base64 brutes dans la réponse de l’historique du chat.
    - Lors du rendu de `chat.history`, la Control UI supprime du texte visible de l’assistant les balises de directives intégrées destinées uniquement à l’affichage (par exemple `[[reply_to_*]]` et `[[audio_as_voice]]`), les charges utiles XML d’appels d’outils en texte brut (notamment `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appels d’outils tronqués), ainsi que les jetons de contrôle du modèle ASCII ou pleine chasse divulgués. Elle omet les entrées de l’assistant dont l’intégralité du texte visible se limite au jeton silencieux exact `NO_REPLY` / `no_reply` ou au jeton d’accusé de réception du Heartbeat `HEARTBEAT_OK`.
    - Pendant un envoi actif et l’actualisation finale de l’historique, la vue du chat maintient visibles les messages locaux optimistes de l’utilisateur et de l’assistant si `chat.history` renvoie brièvement un instantané plus ancien ; la transcription canonique remplace ces messages locaux dès que l’historique du Gateway se met à jour.
    - Les événements `chat` en direct représentent l’état de livraison, tandis que `chat.history` est reconstruit à partir de la transcription persistante de la session. Après les événements finaux des outils, la Control UI recharge l’historique et ne fusionne qu’une courte fin optimiste ; la frontière de la transcription est documentée dans [WebChat](/fr/web/webchat).
    - `chat.inject` ajoute une note de l’assistant à la transcription de la session et diffuse un événement `chat` pour les mises à jour réservées à l’interface utilisateur (aucune exécution d’agent, aucune livraison sur un canal).
    - La barre latérale répertorie chaque session active chargée par section d’agent et dans les catégories épinglées/canal/travail/personnalisées/Chats, avec une seule action Nouvelle session qui ouvre la boîte de dialogue de brouillon. L’ouverture d’une ligne visible déplace uniquement la surbrillance. Les groupes personnalisés sont réductibles et réorganisables par glisser-déposer, et les sessions peuvent être déposées dans un groupe ou dans Chats ; les noms et l’ordre des groupes sont synchronisés via le Gateway, tandis que leur état réduit reste enregistré dans le navigateur. Une nouvelle session du tableau de bord reçoit de manière asynchrone un titre concis généré à partir de son premier message qui n’est pas une commande ; les noms explicites ne sont jamais remplacés. Définissez `agents.defaults.utilityModel` (ou `agents.list[].utilityModel`) pour acheminer cet appel de modèle distinct vers un modèle moins coûteux. Le développement de la section d’un autre agent permet de parcourir les sessions de cet agent sans quitter le chat ouvert.
    - La recherche de sessions se trouve dans la palette de commandes (⌘K, ou le champ Recherche en haut de la barre latérale) : la saisie d’une requête parcourt un nombre limité de pages correspondantes parmi les agents, filtre les lignes enfants/Cron internes et répertorie les correspondances visibles à côté des commandes de navigation. La page Sessions conserve la liste exhaustive consultable avec des filtres.
    - Chaque ligne de la barre latérale conserve un accès direct à l’épinglage ainsi qu’un menu contextuel complet pour l’état non lu, le renommage, la bifurcation, le regroupement, l’archivage et la suppression. Les lignes sélectionnées en nombre (clic avec Cmd/Ctrl, clic avec Maj pour les plages) disposent d’un menu d’actions groupées couvrant l’état non lu, le regroupement, l’archivage et la suppression ; l’archivage et la suppression groupés restent désactivés à moins que chaque session sélectionnée puisse être archivée. Une exécution active et la session principale d’un agent ne peuvent pas être archivées. L’archivage ou la suppression de la session actuellement sélectionnée ramène le Chat à la session principale de cet agent.
    - Dans l’application macOS, la marque OpenClaw utilise la bande autrement vide de la barre de titre native, à côté des commandes de la fenêtre, au lieu d’occuper une ligne de la barre latérale.
    - Sur les largeurs d’écran de bureau, les commandes du chat restent sur une seule ligne compacte et se replient lors du défilement vers le bas de la transcription ; le défilement vers le haut, le retour au début ou l’arrivée en bas rétablit les commandes.
    - Les messages consécutifs identiques contenant uniquement du texte sont affichés dans une seule bulle avec un badge indiquant leur nombre. Les messages comportant des images, des pièces jointes, une sortie d’outil ou des aperçus Canvas ne sont pas regroupés.
    - Lorsque le checkout d’une session se trouve sur une branche autre que celle par défaut d’un dépôt GitHub, la vue du chat épingle des pastilles de demandes de tirage au-dessus de la zone de rédaction : numéro de PR, dépôt, branche, nombres de différences, pastille de CI et état brouillon/fusionnée/fermée, chacun renvoyant vers la PR. La ligne affiche au maximum deux pastilles — les PR actives (ouvertes/brouillons) en premier — et un bouton « Afficher plus » révèle l’historique réduit des PR fusionnées/fermées. La pastille de CI ouvre une petite fenêtre contextuelle de surveillance de la CI indiquant le nombre de vérifications réussies/échouées/en cours/ignorées et proposant un lien vers la page des vérifications de la PR. La détection s’exécute côté serveur via `controlUi.sessionPullRequests`, qui réutilise les variables `GH_TOKEN`/`GITHUB_TOKEN` du Gateway lorsqu’elles sont définies. Lorsque la limite de débit de l’API GitHub est atteinte, les pastilles conservent le dernier état connu et affichent un avertissement indiquant que l’état peut être obsolète ; fermer une pastille la masque pour cette session dans le profil de navigateur actuel.
    - Le panneau des différences de session affiche ce que le checkout d’une session a réellement modifié : le bouton de branche (dans l’en-tête du rail de l’espace de travail, l’en-tête du volet fractionné ou le bouton flottant du chat à volet unique) ouvre le panneau de détails avec les différences fichier par fichier des travaux de la branche, non validés et non suivis par rapport à la base de fusion avec la branche par défaut du checkout — point d’état, flèche de renommage, nombres +/− par fichier, fichiers réductibles et marqueurs « N lignes non modifiées » entre les blocs de différences. Les différences sont calculées côté serveur via la méthode `sessions.diff` du Gateway (portée `operator.read`) ; les fichiers binaires et surdimensionnés sont réduits à des entrées contenant uniquement des statistiques, et le bouton n’apparaît que lorsque le Gateway connecté annonce `sessions.diff`.
    - Le rail de l’espace de travail de session de chaque volet Chat répertorie les fichiers de la session, les fichiers du projet et les artefacts. Il est ancré par défaut au bord droit du volet ; faites glisser son en-tête (ou utilisez le bouton d’ancrage) pour le déplacer vers le bas, et ce choix est enregistré dans le profil de navigateur actuel. Un rail réduit n’occupe aucun espace : rouvrez-le avec ⇧⌘B, le bouton des fichiers dans l’en-tête du volet fractionné ou le bouton flottant des fichiers dans le chat à volet unique (les deux comportent un badge indiquant le nombre de fichiers modifiés). Le panneau de détails distinct pour les fichiers, les outils et Canvas n’est pas affecté.
    - Un clic sur une référence de fichier dans le chat, sur un chemin de fichier dans une carte d’outil de lecture/modification/écriture développée ou sur une ligne de fichier dans le rail de l’espace de travail ouvre le panneau de détails du fichier : une vue de code basée sur CodeMirror avec coloration syntaxique, numéros de ligne, accès direct à une ligne, recherche dans le fichier, actions de copie et menu d’ouverture dans un éditeur externe. Lorsque le Gateway annonce `sessions.files.set` à une connexion `operator.admin`, le panneau ajoute un mode Modifier avec suivi des modifications et enregistrement par Cmd/Ctrl-S ; les brouillons non enregistrés persistent pendant la navigation entre fichiers, panneaux et sessions dans l’onglet actuel du navigateur, jusqu’à leur enregistrement ou leur abandon explicite. Les enregistrements utilisent une opération de comparaison et permutation fondée sur le hachage de contenu renvoyé par `sessions.files.get` : si le fichier a changé sur le disque depuis son chargement (par exemple parce que l’agent a continué à travailler), le panneau affiche un avis de conflit avec les actions Recharger (prendre le contenu le plus récent) et Écraser (conserver la modification locale). Les écritures passent par les mêmes protections d’espace de travail sécurisées pour le système de fichiers que les lectures — confinement du chemin, rejet des liens symboliques/physiques et limite UTF-8 de 256 KB — et remplacent uniquement des fichiers existants ; l’éditeur n’en crée ni n’en supprime jamais.
    - Le rail des tâches en arrière-plan de chaque volet Chat répertorie les tâches en arrière-plan et les sous-agents de l’agent actuel (`tasks.list` limité à l’agent, tenu à jour par les événements `task`) : le travail en cours affiche un minuteur en direct du temps écoulé, le nombre d’utilisations d’outils, l’outil actuellement utilisé et une commande d’arrêt ; la section réductible des tâches terminées ajoute les durées d’exécution ; et un lien Afficher la transcription ouvre la session enfant de la tâche dans le volet. Ouvrez-le à l’aide du bouton d’activité dans l’en-tête du volet fractionné ou du bouton flottant d’activité dans le chat à volet unique — l’instantané des tâches est chargé par anticipation, si bien que les deux affichent un badge indiquant le nombre de tâches en cours sans qu’il soit nécessaire d’ouvrir d’abord le rail. La page Tâches reste le registre complet couvrant tous les agents.
    - Le rail de l’espace de travail, le rail des tâches en arrière-plan et le panneau de détails s’adaptent à la largeur propre de chaque volet plutôt qu’à celle de la fenêtre : dans un volet étroit ou une fenêtre compacte, les deux rails prennent la forme de bandes inférieures (les commandes d’ancrage latéral sont masquées jusqu’à ce que le volet s’élargisse ; le rail de l’espace de travail reste prioritaire pour l’emplacement latéral lorsqu’une seule colonne tient), et le panneau de détails s’empile sous le fil avec une poignée de redimensionnement horizontale au lieu de partager la même ligne. Sur les fenêtres d’affichage de la taille d’un téléphone, le panneau de détails s’ouvre toujours en plein écran.
    - Les sélecteurs de modèle et de réflexion de l’en-tête du chat mettent immédiatement à jour la session active via `sessions.patch` ; il s’agit de remplacements persistants propres à la session, et non d’options d’envoi valables pour un seul tour.
    - **Vue fractionnée :** ouvrez-la depuis la rangée de boutons flottants en haut à droite (à côté des boutons des différences de session, des tâches en arrière-plan et des fichiers de session), puis fractionnez le volet actif vers la droite ou vers le bas afin de créer autant de volets que l’espace le permet. Chaque volet possède sa propre session, sa propre transcription, sa propre zone de rédaction et son propre flux d’outils.
    - Faites glisser une session depuis la barre latérale vers le chat pour l’ouvrir dans un volet. Un aperçu animé du dépôt glisse entre les zones et indique le résultat — « Fractionner » sur la moitié exacte qu’occupera un nouveau volet, « Ouvrir ici » sur un volet entier — et le dépôt fonctionne également depuis le mode à volet unique.
    - Le volet fractionné actif détermine la sélection dans la barre latérale et l’URL. Chaque volet possède sa propre ligne d’en-tête avec le titre de la session ainsi que les commandes du rail de l’espace de travail, de fractionnement et de fermeture ; les séparateurs redimensionnent les colonnes et les volets empilés, et le navigateur enregistre localement la disposition entre les rechargements.
    - Sur les écrans étroits, la vue fractionnée conserve la disposition, mais n’affiche que le volet actif, y compris son en-tête avec la commande de fermeture.
    - Si vous envoyez un message alors qu’une modification du sélecteur de modèle pour la même session est encore en cours d’enregistrement, la zone de rédaction attend l’application de cette mise à jour de session avant d’appeler `chat.send`, afin que l’envoi utilise le modèle sélectionné.
    - La saisie de `/new` crée et active la même nouvelle session du tableau de bord que Nouvelle discussion, sauf lorsque `session.dmScope: "main"` est configuré et que le parent actuel est la session principale de l’agent ; dans ce cas, elle réinitialise la session principale sur place. La saisie de `/reset` conserve la réinitialisation explicite sur place du Gateway pour la session actuelle.
    - Le sélecteur de modèle du chat demande la vue des modèles configurée du Gateway. Si `agents.defaults.models` est présent, cette liste d’autorisation détermine le sélecteur, y compris les entrées `provider/*` qui maintiennent dynamiques les catalogues limités au fournisseur. Sinon, le sélecteur affiche les entrées explicites `models.providers.*.models` ainsi que les fournisseurs disposant d’une authentification utilisable. Le catalogue complet reste disponible via le RPC de débogage `models.list` avec `view: "all"`.
    - Lorsque les nouveaux rapports d’utilisation de session du Gateway incluent le nombre actuel de jetons de contexte, la barre d’outils de la zone de rédaction du chat affiche un petit anneau d’utilisation du contexte avec le pourcentage utilisé. Ouvrez l’anneau pour consulter la fenêtre de contexte actuelle, le nombre de jetons de la dernière exécution et le coût total estimé, l’identité du fournisseur/modèle, ainsi que la ventilation des coûts d’entrée/de sortie/de cache de la dernière réponse du fournisseur lorsqu’elle est indiquée. L’anneau adopte un style d’avertissement lorsque la pression sur le contexte est élevée et, aux niveaux de Compaction recommandés, affiche un bouton compact qui exécute le processus normal de Compaction de la session. Les instantanés de jetons obsolètes sont masqués jusqu’à ce que le Gateway signale de nouveau une utilisation récente.

  </Accordion>
  <Accordion title="Mode conversation (temps réel dans le navigateur)">
    Le mode conversation utilise un fournisseur vocal en temps réel enregistré. Configurez OpenAI avec `talk.realtime.provider: "openai"` ainsi qu’un profil de clé API `openai`, `talk.realtime.providers.openai.apiKey` ou `OPENAI_API_KEY`. OpenAI Realtime utilise l’API publique de la plateforme et nécessite une clé API de la plateforme ; une connexion OAuth Codex ne répond pas aux exigences de cette interface. Configurez Google avec `talk.realtime.provider: "google"` ainsi que `talk.realtime.providers.google.apiKey`. Le navigateur ne reçoit jamais de clé API standard du fournisseur : OpenAI reçoit un secret client Realtime éphémère pour WebRTC, tandis que Google Live reçoit un jeton d’authentification à usage unique et restreint pour l’API Live, destiné à une session WebSocket du navigateur, les instructions et les déclarations d’outils étant verrouillées dans le jeton par le Gateway. Les fournisseurs qui exposent uniquement une passerelle en temps réel côté serveur utilisent le transport relais du Gateway, de sorte que les identifiants et les connexions aux fournisseurs restent côté serveur tandis que l’audio du navigateur transite par des RPC Gateway authentifiés. L’invite de session Realtime est assemblée par le Gateway ; `talk.client.create` n’accepte pas le remplacement des instructions par l’appelant.

    Les valeurs par défaut persistantes du fournisseur, du modèle, de la voix, du transport, de l’effort de raisonnement, du seuil VAD exact, de la durée de silence et du remplissage de préfixe se trouvent dans **Settings → Communications → Talk** ; leur modification nécessite l’accès `operator.admin`. La configuration du relais Gateway impose le chemin de relais côté serveur ; la configuration de WebRTC laisse la session sous le contrôle du client et échoue, au lieu de basculer silencieusement vers le relais, si le fournisseur ne peut pas créer de session dans le navigateur.

    La commande Talk elle-même correspond au bouton du microphone dans la barre d’outils de rédaction. Son chevron répertorie **System default** et tous les microphones exposés par le navigateur, notamment les entrées USB, Bluetooth et virtuelles. L’identifiant de l’appareil sélectionné reste local au navigateur et n’est jamais envoyé au Gateway ; si cet appareil précis disparaît, Talk vous demande de choisir une autre entrée au lieu d’enregistrer silencieusement depuis un autre microphone. Lorsque Talk est actif, le bouton du microphone devient une pastille affichant l’indicateur de niveau de l’entrée en direct ; un clic interrompt l’entrée vocale et le survol révèle le glyphe d’arrêt. Les lecteurs d’écran annoncent `Connecting voice input...`, `Listening...` ou `Asking OpenClaw...` pendant qu’un appel d’outil en temps réel consulte le modèle plus puissant configuré via `talk.client.toolCall`. L’arrêt d’une réponse d’agent en cours reste assuré par une commande carrée **Stop** distincte, située à côté de la pastille.

    Test de fumée en conditions réelles pour les mainteneurs : `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` vérifie la passerelle WebSocket côté serveur d’OpenAI, l’échange SDP WebRTC d’OpenAI dans le navigateur, la configuration WebSocket de Google Live dans le navigateur avec un jeton restreint, ainsi que l’adaptateur de navigateur du relais Gateway avec un média de microphone simulé. La commande affiche uniquement l’état du fournisseur et ne journalise aucun secret.

  </Accordion>
  <Accordion title="Arrêt et abandon">
    - Cliquez sur **Stop** (appelle `chat.abort`).
    - Lorsqu’une exécution est active, les suivis ordinaires sont mis en file d’attente. Cliquez sur **Steer** dans un message en attente pour injecter ce suivi dans le tour en cours d’exécution.
    - Saisissez `/stop` (ou des expressions d’abandon autonomes comme `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) pour abandonner hors bande.
    - `chat.abort` prend en charge `{ sessionKey }` (sans `runId`) afin d’abandonner toutes les exécutions actives de cette session.

  </Accordion>
  <Accordion title="Conservation partielle après abandon">
    - Lorsqu’une exécution est abandonnée, le texte partiel de l’assistant peut encore être affiché dans l’interface utilisateur.
    - Le Gateway conserve dans l’historique de la transcription le texte partiel abandonné de l’assistant lorsqu’une sortie mise en mémoire tampon existe.
    - Les entrées conservées incluent des métadonnées d’abandon afin que les consommateurs de la transcription puissent distinguer les sorties partielles dues à un abandon des sorties d’une exécution terminée normalement.

  </Accordion>
</AccordionGroup>

## Perte de connexion et reconnexion

Une fois la session établie, une interruption de la connexion au Gateway ne vous déconnecte pas. Le tableau de bord
reste visible avec une pastille flottante orange « Gateway connection lost — Reconnecting… » sous la barre
supérieure, tandis que le client réessaie automatiquement avec un délai progressif (de 800 ms à 15 s). Les mises à jour en direct et
les actions en temps réel ou liées à la session sont suspendues jusqu’au rétablissement de la connexion ; **Retry now** dans la pastille déclenche
une tentative immédiate. Le chat reste modifiable : les envois ordinaires de texte et de pièces jointes sont conservés dans le
stockage du navigateur de l’onglet actuel, limité au Gateway et à la session, affichés comme étant en attente de reconnexion, puis envoyés
automatiquement lorsque le Gateway redevient disponible. Les commandes en direct et les commandes avec barre oblique restent indisponibles
hors connexion.

Lorsque ce navigateur contient déjà des identifiants (un jeton ou mot de passe configuré, ou un jeton d’appareil
approuvé), les premières ouvertures et les rechargements affichent un petit symbole OpenClaw animé pendant l’établissement de la
connexion au lieu de faire apparaître brièvement l’écran de connexion. Celui-ci ne s’affiche que lorsqu’aucun identifiant
n’est encore enregistré ou lorsque le Gateway les rejette activement (jeton ou mot de passe incorrect, appairage révoqué) —
des états qui nécessitent votre intervention plutôt que de l’attente.

## Installation de la PWA et notifications Web Push

L’interface de contrôle fournit un fichier `manifest.webmanifest` et un service worker, ce qui permet aux navigateurs modernes de l’installer comme une PWA autonome. Web Push permet au Gateway de réveiller la PWA installée avec des notifications, même lorsque l’onglet ou la fenêtre du navigateur n’est pas ouvert.

Si la page affiche **Protocol mismatch** juste après une mise à jour d’OpenClaw, rouvrez d’abord le tableau de bord avec `openclaw dashboard` et effectuez une actualisation forcée. Si l’échec persiste, effacez les données du site pour l’origine du tableau de bord ou effectuez un test dans une fenêtre de navigation privée ; un ancien onglet ou le cache du service worker du navigateur peut continuer à exécuter une version antérieure à la mise à jour de l’interface de contrôle avec le Gateway plus récent.

| Surface                                               | Fonction                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifeste PWA. Les navigateurs proposent « Install app » dès qu’il est accessible. |
| `ui/public/sw.js`                                     | Service worker qui gère les événements `push` et les clics sur les notifications. |
| `push/vapid-keys.json` (dans le répertoire d’état d’OpenClaw) | Paire de clés VAPID générée automatiquement et utilisée pour signer les charges utiles Web Push. |
| `push/web-push-subscriptions.json`                    | Points de terminaison persistants des abonnements du navigateur.   |

Remplacez la paire de clés VAPID au moyen de variables d’environnement dans le processus du Gateway lorsque vous souhaitez fixer les clés (déploiements sur plusieurs hôtes, rotation des secrets ou tests) :

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (valeur par défaut : `https://openclaw.ai`)

L’interface de contrôle utilise ces méthodes du Gateway, soumises à des autorisations limitées, pour enregistrer et tester les abonnements du navigateur :

- `push.web.vapidPublicKey` récupère la clé publique VAPID active.
- `push.web.subscribe` enregistre un `endpoint` ainsi que `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` supprime un point de terminaison enregistré.
- `push.web.test` envoie une notification de test à l’abonnement de l’appelant.

<Note>
Web Push est indépendant du chemin de relais APNS d’iOS (voir [Configuration](/fr/gateway/configuration) pour les notifications push reposant sur un relais) et de la méthode `push.test`, qui cible l’appairage mobile natif.
</Note>

## Intégrations hébergées

Les messages de l’assistant peuvent afficher du contenu Web hébergé directement dans la page avec le code court `[embed ...]`. La politique de bac à sable de l’iframe est contrôlée par `gateway.controlUi.embedSandbox` :

Le Plugin Canvas intégré fournit également [`show_widget`](/tools/show-widget) pour afficher du SVG ou du HTML autonome directement depuis un appel d’outil. Le navigateur annonce la capacité Gateway `inline-widgets`, et le document Canvas produit reste disponible lorsque l’historique du chat est rechargé. Les exécutions provenant d’un canal ne reçoivent pas cet outil.

<Tabs>
  <Tab title="strict">
    Désactive l’exécution de scripts dans les intégrations hébergées.
  </Tab>
  <Tab title="scripts (par défaut)">
    Autorise les intégrations interactives tout en maintenant l’isolation de l’origine ; cela suffit généralement pour les jeux et widgets autonomes dans le navigateur.
  </Tab>
  <Tab title="trusted">
    Ajoute `allow-same-origin` en plus de `allow-scripts` pour les documents du même site qui nécessitent intentionnellement des privilèges plus élevés.
  </Tab>
</Tabs>

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
Utilisez `trusted` uniquement lorsque le document intégré nécessite réellement un comportement de même origine. Pour la plupart des jeux générés par des agents et des canevas interactifs, `scripts` est le choix le plus sûr.
</Warning>

Les URL d’intégration externes absolues en `http(s)` restent bloquées par défaut. Pour permettre à `[embed url="https://..."]` de charger des pages tierces, définissez `gateway.controlUi.allowExternalEmbedUrls: true`.

## Largeur des messages de discussion

La transcription de la discussion utilise un cadre centré et lisible, aligné avec la zone de rédaction. Les sorties de l’assistant et des outils restent alignées à gauche, tandis que les bulles des utilisateurs restent alignées à droite dans ce cadre. Les déploiements sur écrans larges peuvent remplacer la largeur de la transcription sans modifier le CSS fourni en définissant `gateway.controlUi.chatMessageMaxWidth` :

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

La valeur est validée avant d’atteindre le navigateur. Les formes prises en charge comprennent les longueurs simples et les pourcentages tels que `960px` ou `82%`, ainsi que les expressions de largeur contraintes `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` et `fit-content(...)`.

## Accès au tailnet (recommandé)

<Tabs>
  <Tab title="Tailscale Serve intégré (à privilégier)">
    Conservez le Gateway sur l’interface de bouclage et laissez Tailscale Serve agir comme proxy avec HTTPS :

    ```bash
    openclaw gateway --tailscale serve
    ```

    Ouvrez `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré).

    Par défaut, les requêtes Control UI/WebSocket Serve peuvent s’authentifier au moyen des en-têtes d’identité Tailscale (`tailscale-user-login`) lorsque `gateway.auth.allowTailscale` vaut `true`. OpenClaw vérifie l’identité en résolvant l’adresse `x-forwarded-for` avec `tailscale whois` et en la comparant à l’en-tête. Il n’accepte ces requêtes que lorsqu’elles atteignent l’interface de bouclage avec les en-têtes `x-forwarded-*` de Tailscale. Pour les sessions d’opérateur de la Control UI disposant d’une identité d’appareil dans le navigateur, ce chemin Serve vérifié évite également l’aller-retour d’association de l’appareil ; les navigateurs sans appareil et les connexions avec un rôle de Node suivent toujours les vérifications d’appareil normales. Définissez `gateway.auth.allowTailscale: false` si vous souhaitez exiger des identifiants explicites fondés sur un secret partagé, même pour le trafic Serve, puis utilisez `gateway.auth.mode: "token"` ou `"password"`.

    Pour ce chemin asynchrone d’identité Serve, les tentatives d’authentification ayant échoué pour la même adresse IP cliente et la même portée d’authentification sont sérialisées avant les écritures de limitation de débit. Des nouvelles tentatives incorrectes simultanées provenant du même navigateur peuvent donc afficher `retry later` lors de la deuxième requête, au lieu de provoquer deux simples non-correspondances en concurrence parallèle.

    <Warning>
    L’authentification Serve sans jeton suppose que l’hôte du Gateway est fiable. Si du code local non fiable peut s’exécuter sur cet hôte, exigez une authentification par jeton ou mot de passe.
    </Warning>

  </Tab>
  <Tab title="Lier au tailnet + jeton">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Ouvrez `http://<tailscale-ip>:18789/` (ou votre `gateway.controlUi.basePath` configuré).

    Collez le secret partagé correspondant dans les paramètres de l’interface utilisateur (envoyé sous la forme `connect.params.auth.token` ou `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP non sécurisé

Si vous ouvrez le tableau de bord via HTTP non chiffré (`http://<lan-ip>` ou `http://<tailscale-ip>`), le navigateur s’exécute dans un **contexte non sécurisé** et bloque WebCrypto. Par défaut, OpenClaw **bloque** les connexions à la Control UI dépourvues d’identité d’appareil.

Exceptions documentées :

- compatibilité HTTP non sécurisé limitée à localhost avec `gateway.controlUi.allowInsecureAuth=true`
- authentification réussie de l’opérateur dans la Control UI via `gateway.auth.mode: "trusted-proxy"`
- contournement d’urgence `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Solution recommandée :** utilisez HTTPS (Tailscale Serve) ou ouvrez l’interface utilisateur localement à l’adresse `https://<magicdns>/` (Serve) ou `http://127.0.0.1:18789/` (sur l’hôte du Gateway).

<AccordionGroup>
  <Accordion title="Comportement de l’option d’authentification non sécurisée">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` est uniquement une option de compatibilité locale :

    - Elle permet aux sessions de la Control UI sur localhost de fonctionner sans identité d’appareil dans des contextes HTTP non sécurisés.
    - Elle ne contourne pas les vérifications d’appairage.
    - Elle n’assouplit pas les exigences d’identité d’appareil pour les accès distants (hors localhost).

  </Accordion>
  <Accordion title="À utiliser uniquement en dernier recours">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` désactive les vérifications d’identité d’appareil de la Control UI et réduit fortement la sécurité. Rétablissez rapidement la configuration après toute utilisation d’urgence.
    </Warning>

  </Accordion>
  <Accordion title="Remarque sur les proxys de confiance">
    - Une authentification réussie par proxy de confiance peut autoriser des sessions **opérateur** de la Control UI sans identité d’appareil.
    - Cela ne s’étend **pas** aux sessions de la Control UI avec le rôle Node.
    - Les proxys inverses en boucle locale sur le même hôte ne satisfont toujours pas l’authentification par proxy de confiance ; consultez [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consultez [Tailscale](/fr/gateway/tailscale) pour obtenir des conseils sur la configuration de HTTPS.

## Politique de sécurité du contenu

La Control UI applique une politique `img-src` stricte : seuls les éléments provenant de la **même origine**, les URL `data:` et les URL `blob:` générées localement sont autorisés. Les URL d’images distantes en `http(s)` ou relatives au protocole sont rejetées par le navigateur et ne déclenchent jamais de requête réseau.

En pratique :

- Les avatars et images servis sous des chemins relatifs (par exemple `/avatars/<id>`) s’affichent toujours, y compris ceux provenant de routes d’avatar authentifiées que l’interface récupère et convertit en URL `blob:` locales.
- Les URL `data:image/...` intégrées s’affichent toujours.
- Les URL `blob:` locales créées par la Control UI s’affichent toujours.
- Les avatars des aperçus de liens GitHub sont récupérés par le Gateway depuis l’hôte d’avatars fixe de GitHub et renvoyés sous forme d’URL `data:` de taille limitée ; le navigateur de l’opérateur ne contacte jamais l’hôte d’avatars distant.
- Les URL d’avatar distantes émises par les métadonnées des canaux sont supprimées par les utilitaires d’avatar de la Control UI et remplacées par le logo ou le badge intégré, afin qu’un canal compromis ou malveillant ne puisse pas forcer le navigateur d’un opérateur à récupérer des images distantes arbitraires.

Cette protection est toujours active et n’est pas configurable.

## Authentification de la route d’avatar

Lorsque l’authentification du Gateway est configurée, le point de terminaison d’avatar de la Control UI exige le même jeton de Gateway que le reste de l’API :

- `GET /avatar/<agentId>` renvoie l’image de l’avatar uniquement aux appelants authentifiés. `GET /avatar/<agentId>?meta=1` renvoie les métadonnées de l’avatar selon la même règle.
- Les requêtes non authentifiées vers l’une ou l’autre route sont rejetées, comme pour la route voisine des médias de l’assistant, de sorte que la route d’avatar ne puisse pas divulguer l’identité de l’agent sur des hôtes par ailleurs protégés.
- La Control UI transmet le jeton du Gateway dans un en-tête Bearer lors de la récupération des avatars et utilise des URL blob authentifiées afin que l’image continue de s’afficher dans les tableaux de bord.

Si vous désactivez l’authentification du Gateway, ce qui est déconseillé sur les hôtes partagés, la route d’avatar devient également non authentifiée, conformément au reste du Gateway.

## Authentification de la route des médias de l’assistant

Lorsque l’authentification du Gateway est configurée, les aperçus des médias locaux de l’assistant utilisent une route en deux étapes :

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` exige l’authentification opérateur normale de la Control UI ; le navigateur envoie le jeton du Gateway dans un en-tête Bearer lorsqu’il vérifie la disponibilité.
- Les réponses de métadonnées réussies incluent un `mediaTicket` à courte durée de vie, limité à ce chemin source précis.
- Les URL d’images, de contenus audio, de vidéos et de documents affichées par le navigateur utilisent `mediaTicket=<ticket>` au lieu du jeton ou du mot de passe actif du Gateway. Le ticket expire rapidement et ne peut pas autoriser une autre source.

Cela préserve la compatibilité du rendu des médias avec les éléments multimédias natifs du navigateur sans placer d’identifiants réutilisables du Gateway dans des URL de médias visibles.

## Liens d’approbation

Les notifications d’approbation destinées aux opérateurs peuvent contenir un lien profond vers un document d’approbation autonome servi sous l’espace de noms réservé `${controlUiBasePath}/approve/{approvalId}` (par exemple `/approve/<approvalId>`, ou `/openclaw/approve/<approvalId>` avec un chemin de base configuré). L’URL reste stable pendant toute la durée de vie de l’approbation et peut être transmise en toute sécurité entre vos propres appareils : elle identifie l’approbation, mais ne l’autorise jamais.

- L’espace de noms à un segment `/approve/<approvalId>` est réservé par le Gateway avant les routes HTTP des plugins pour **toutes** les méthodes HTTP ; une route de plugin ne peut donc jamais masquer ni intercepter un document d’approbation.
- L’ouverture d’un document d’approbation exige la même authentification du Gateway que le reste de la Control UI (jeton/mot de passe, identité Tailscale Serve ou identité de proxy de confiance) ; les identifiants ne font jamais partie de l’URL d’approbation.
- Lorsque le service de la Control UI est désactivé, les requêtes vers cet espace de noms renvoient `404` au lieu d’être transmises aux gestionnaires de plugins.
- La connexion depuis un document d’approbation est éphémère pour cette page : elle ne remplace ni la sélection du Gateway ni les paramètres enregistrés par la Control UI complète dans le même navigateur.

Le Gateway sert les fichiers statiques depuis `dist/control-ui` :

```bash
pnpm ui:build
```

Base absolue facultative (URL d’éléments fixes) :

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Développement local (serveur de développement distinct) :

```bash
pnpm ui:dev
```

Configurez ensuite l’interface pour qu’elle utilise l’URL WS de votre Gateway (par exemple `ws://127.0.0.1:18789`).

## Page vide de la Control UI

Si le navigateur charge un tableau de bord vide et que les outils de développement n’affichent aucune erreur utile, une extension ou un script de contenu exécuté précocement peut avoir empêché l’évaluation de l’application sous forme de module JavaScript. La page statique comprend un panneau de récupération en HTML simple qui apparaît lorsque `<openclaw-app>` n’est pas enregistré après le démarrage.

Utilisez l’action **Try again** du panneau après avoir modifié l’environnement du navigateur, ou rechargez manuellement la page après avoir effectué les vérifications suivantes :

- Désactivez les extensions qui injectent du contenu dans toutes les pages, en particulier celles qui utilisent des scripts de contenu `<all_urls>`.
- Essayez une fenêtre privée, un profil de navigateur vierge ou un autre navigateur.
- Laissez le Gateway en cours d’exécution et vérifiez la même URL de tableau de bord après avoir changé de navigateur.

## Débogage/tests : serveur de développement + Gateway distant

La Control UI se compose de fichiers statiques ; la cible WebSocket est configurable et peut différer de l’origine HTTP. Cela est pratique lorsque vous souhaitez exécuter localement le serveur de développement Vite tandis que le Gateway s’exécute ailleurs.

<Steps>
  <Step title="Démarrer le serveur de développement de l’interface">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Ouvrir avec gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    Authentification ponctuelle facultative (si nécessaire) :

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Remarques">
    - `gatewayUrl` est stocké dans localStorage après le chargement, puis supprimé de l’URL.
    - Si vous transmettez un point de terminaison `ws://` ou `wss://` complet via `gatewayUrl`, encodez la valeur pour une URL afin que le navigateur analyse correctement la chaîne de requête.
    - Dans la mesure du possible, `token` doit être transmis dans le fragment d’URL (`#token=...`). Les fragments ne sont pas envoyés au serveur, ce qui évite les fuites dans les journaux de requêtes et dans l’en-tête Referer. Les anciens paramètres de requête `?token=` sont encore importés une fois pour des raisons de compatibilité, mais uniquement comme solution de repli, puis sont supprimés immédiatement après l’initialisation.
    - `password` est conservé uniquement en mémoire.
    - Lorsque `gatewayUrl` est défini, l’interface ne se rabat pas sur les identifiants de la configuration ou de l’environnement. Fournissez explicitement `token` (ou `password`) ; l’absence d’identifiants explicites constitue une erreur.
    - Utilisez `wss://` lorsque le Gateway se trouve derrière TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` est accepté uniquement dans une fenêtre de premier niveau, et non dans une fenêtre intégrée, afin d’empêcher le détournement de clic.
    - Les déploiements publics de la Control UI hors boucle locale doivent définir explicitement `gateway.controlUi.allowedOrigins` avec des origines complètes. Les chargements privés depuis le LAN ou le Tailnet, de même origine et provenant d’hôtes en boucle locale, RFC1918/link-local, `.local`, `.ts.net` ou CGNAT Tailscale, sont acceptés sans activer la solution de repli fondée sur l’en-tête Host.
    - Le démarrage du Gateway peut initialiser des origines locales telles que `http://localhost:<port>` et `http://127.0.0.1:<port>` à partir de l’adresse d’écoute et du port effectifs à l’exécution, mais les origines des navigateurs distants doivent toujours être ajoutées explicitement.
    - N’utilisez pas `gateway.controlUi.allowedOrigins: ["*"]`, sauf pour des tests locaux strictement contrôlés ; cette valeur signifie autoriser toute origine de navigateur, et non « faire correspondre l’hôte que j’utilise ».
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` active le mode de repli de l’origine fondé sur l’en-tête Host, mais ce mode présente un risque de sécurité.

  </Accordion>
</AccordionGroup>

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Détails de configuration de l’accès distant : [Accès distant](/fr/gateway/remote).

## Rubriques connexes

- [Tableau de bord](/fr/web/dashboard) — tableau de bord du Gateway
- [Contrôles d’intégrité](/fr/gateway/health) — surveillance de l’état du Gateway
- [TUI](/fr/web/tui) — interface utilisateur de terminal
- [WebChat](/fr/web/webchat) — interface de discussion dans le navigateur
