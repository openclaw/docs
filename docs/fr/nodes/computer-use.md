---
read_when:
    - Permettre à l’agent Gateway de voir et de contrôler le bureau d’un Mac
    - Armement, autorisations ou sécurité pour l’utilisation de l’ordinateur
    - Extension de la commande de nœud computer.act ou de ses exécutants
summary: Contrôle du bureau piloté par un agent sur un Node macOS appairé via l’outil computer et la commande de Node computer.act
title: Utilisation de l’ordinateur
x-i18n:
    generated_at: "2026-07-12T02:46:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2457d15a59857ffd9c7b160ea4ebed85c8372754abfc7bf75faafc963ecb6547
    source_path: nodes/computer-use.md
    workflow: 16
---

L’utilisation de l’ordinateur permet à l’agent du Gateway de voir et de contrôler un bureau **macOS** appairé : il capture une image de l’écran avec la commande Node existante `screen.snapshot` et pilote le pointeur et le clavier au moyen d’une unique commande Node dangereuse, `computer.act`. L’ensemble d’actions reprend les actions principales d’utilisation de l’ordinateur d’Anthropic ; le zoom facultatif `computer_20251124` n’est pas exposé. Un modèle doté de capacités de vision le pilote au moyen de l’outil d’agent `computer` intégré.

L’agent émet une commande uniforme, `computer.act` ; il ne peut pas savoir comment un Node l’exécute. Un Node macOS exécute `computer.act` dans le processus grâce aux services Peekaboo intégrés et à des primitives CoreGraphics limitées (autorisations TCC appropriées, aucun processus supplémentaire). D’autres plateformes pourront ultérieurement exécuter la même commande sans modifier le contrat exposé à l’agent.

## Prérequis

- Un Node **macOS** appairé (l’application OpenClaw pour macOS exécutée en mode Node).
- Le réglage **Allow Computer Control** activé dans l’application macOS (désactivé par défaut).
- L’autorisation macOS **Accessibility** accordée à OpenClaw (pour l’injection des actions du pointeur et du clavier), ainsi que l’autorisation **Screen Recording** (pour `screen.snapshot`).
- La commande `computer.act` armée sur le Gateway (elle est dangereuse et désarmée par défaut).
- Un modèle d’agent doté de capacités de vision.
- Une stratégie d’outils qui expose `computer`. Le profil `coding` par défaut ne l’expose pas. Ajoutez `computer` à `tools.alsoAllow` ; les agents en bac à sable doivent également l’avoir dans `tools.sandbox.tools.alsoAllow`.

## L’outil d’agent `computer`

L’outil `computer` intégré accepte une action par appel. Les coordonnées sont des pixels entiers non négatifs dans la capture d’écran la plus récente ; le Node les convertit en points d’affichage. Les actions basées sur des coordonnées doivent renvoyer le `frameId` du résultat de la capture d’écran, et un `screenIndex` explicite doit correspondre à cette image. OpenClaw transmet également de la capture d’écran à l’action une identité d’affichage émise par le Node, afin qu’une reconnexion de l’écran ou une modification de sa géométrie entraîne un échec sécurisé au lieu de recibler silencieusement le même index. Ces vérifications rejettent les jetons devinés ainsi que ceux provenant d’une autre image ou d’un autre écran transmis. Un jeton ne garantit pas l’actualité de l’image : les applications peuvent modifier les pixels du même écran après la capture ; effectuez donc une nouvelle capture chaque fois que la scène a pu changer.

- Lecture : `screenshot`.
- Pointeur : `left_click`, `right_click`, `middle_click`, `double_click`, `triple_click`, `mouse_move`, `left_click_drag` (avec `startCoordinate`), `left_mouse_down`, `left_mouse_up`.
- Défilement : `scroll` avec `scrollDirection` (`up|down|left|right`) et `scrollAmount` (crans de molette).
- Clavier : `type` (texte), `key` (combinaison telle que `cmd+shift+t` ou `Return`), `hold_key` (combinaison `text` maintenue pendant `duration` secondes).
- Temporisation : `wait` (`duration` secondes).

Les touches de modification sont transmises dans le champ `text` des actions de clic et de défilement (`shift`, `ctrl`, `alt`, `cmd`). Après une action d’entrée, l’outil renvoie une nouvelle capture d’écran afin que le modèle puisse en observer le résultat. Si plusieurs Nodes compatibles avec l’utilisation de l’ordinateur sont connectés, transmettez explicitement `node`.

Les captures d’écran restent **réservées au modèle** : elles ne sont jamais transmises automatiquement au canal de discussion. Considérez tout contenu affiché à l’écran comme une entrée non fiable ; l’outil avertit le modèle de ne pas suivre les instructions affichées qui contredisent la demande de l’utilisateur.

## La commande Node `computer.act`

`computer.act` est l’unique commande Node par laquelle l’outil achemine les entrées (`node.invoke` avec `command: "computer.act"`). Elle est :

- **Dangereuse par défaut** : elle figure parmi les commandes Node dangereuses intégrées et reste exclue de la liste d’autorisation d’exécution jusqu’à ce qu’elle soit explicitement armée. Un Node macOS peut néanmoins la déclarer lors de l’appairage afin que cette capacité soit approuvée une seule fois.
- **Réservée à macOS** pour le moment : elle est uniquement annoncée par un Node macOS dont le réglage **Allow Computer Control** est activé.

Les lectures réutilisent `screen.snapshot` ; il n’existe pas de second chemin de capture. Consultez [Nodes de caméra et d’écran](/fr/nodes/camera) pour en savoir plus sur la commande de capture partagée.

## Activer et armer

1. Dans l’application macOS, activez **Settings → Allow Computer Control**. Ouvrez ensuite **Settings → Permissions** et accordez **Accessibility** et **Screen Recording** dans les Réglages Système de macOS.
2. Approuvez la mise à jour de l’appairage sur le Gateway (une nouvelle commande impose un nouvel appairage).
3. Exposez l’outil à l’agent doté de capacités de vision. Pour le profil `coding` par défaut :

   ```json5
   {
     tools: {
       alsoAllow: ["computer"],
       // Les agents en bac à sable nécessitent également cette seconde autorisation :
       sandbox: { tools: { alsoAllow: ["computer"] } },
     },
   }
   ```

4. Armez `computer.act` pendant une durée limitée. Le Plugin `phone-control` expose un groupe `computer` :

   ```text
   /phone arm computer 30m
   /phone status
   /phone disarm
   ```

   L’armement nécessite `operator.admin` (ou le propriétaire) et expire automatiquement. L’ancien groupe `/phone arm all` exclut intentionnellement le contrôle du bureau ; utilisez explicitement le groupe `computer`. L’armement détermine uniquement ce que le Gateway peut invoquer ; l’application macOS continue d’appliquer son réglage **Allow Computer Control** ainsi que les autorisations du système d’exploitation.

Pour une autorisation persistante, ajoutez `computer.act` à `gateway.nodes.allowCommands` **et retirez-le de** `gateway.nodes.denyCommands` ; la liste de refus prévaut. Une autorisation persistante n’expire pas automatiquement. Les entrées déjà présentes avant `/phone arm` subsistent après `/phone disarm` ; ne convertissez pas une autorisation temporaire en autorisation persistante pendant qu’elle est armée.

L’autorisation est délibérément séparée entre l’activation et l’utilisation. Armer ou
configurer durablement `computer.act` nécessite des droits administratifs.
Une fois la commande armée, un opérateur authentifié disposant de `operator.write` peut invoquer
`computer.act` au moyen de `node.invoke` jusqu’à l’expiration ou au désarmement
de l’autorisation ; aucune vérification administrative n’est effectuée pour chaque action. Approuver un Node qui déclare
`computer.act` enregistre uniquement cette capacité afin qu’elle puisse être armée ultérieurement et
n’en autorise pas l’invocation à lui seul.

## Sécurité

- Avant l’autorisation, toutes les couches (stratégie d’outils, stratégie de commandes du Gateway, réglage macOS, Accessibility et Screen Recording) doivent donner leur accord. Une fois la commande armée, les actions s’exécutent sans confirmation individuelle jusqu’à l’expiration ou à l’exécution de `/phone disarm`.
- Le texte est saisi graphème par graphème. Une annulation, une déconnexion, une mise en pause, une désactivation ou le remplacement du point de terminaison interrompt la saisie avant le graphème suivant, au lieu de laisser le reste obsolète se poursuivre.
- Les captures d’écran sont réservées au modèle et ne sont jamais envoyées automatiquement dans la discussion (problème [#44759](https://github.com/openclaw/openclaw/issues/44759)).
- Considérez le contenu de l’écran comme non fiable ; il peut contenir une injection de prompt.

## Relation avec les autres mécanismes de contrôle du bureau

Il s’agit du mécanisme piloté par l’agent. Consultez [Passerelle Peekaboo](/fr/platforms/mac/peekaboo) pour comprendre sa relation avec l’hôte PeekabooBridge, Codex Computer Use et le MCP `cua-driver` direct.
