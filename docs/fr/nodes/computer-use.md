---
read_when:
    - Permettre à l’agent Gateway de voir et de contrôler le bureau d’un Mac
    - Activation, autorisations ou sécurité pour l’utilisation d’un ordinateur
    - Extension de la commande de nœud computer.act ou de ses mécanismes d’exécution
summary: Contrôle du bureau piloté par un agent sur un nœud macOS appairé via l’outil computer et la commande de nœud computer.act
title: Utilisation de l’ordinateur
x-i18n:
    generated_at: "2026-07-12T15:28:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2457d15a59857ffd9c7b160ea4ebed85c8372754abfc7bf75faafc963ecb6547
    source_path: nodes/computer-use.md
    workflow: 16
---

L’utilisation de l’ordinateur permet à l’agent du Gateway de voir et de contrôler un ordinateur de bureau **macOS** appairé : il capture une copie d’écran à l’aide de la commande de Node existante `screen.snapshot` et contrôle le pointeur et le clavier au moyen d’une unique commande de Node dangereuse, `computer.act`. L’ensemble d’actions suit les actions principales d’utilisation de l’ordinateur d’Anthropic ; le zoom facultatif de `computer_20251124` n’est pas exposé. Un modèle doté de capacités visuelles le contrôle au moyen de l’outil d’agent `computer` intégré.

L’agent émet une commande uniforme unique, `computer.act` ; il ne peut pas savoir comment un Node l’exécute. Un Node macOS exécute `computer.act` dans le processus à l’aide des services Peekaboo intégrés et de primitives CoreGraphics limitées (autorisations TCC appropriées, aucun processus supplémentaire). D’autres plateformes pourront exécuter la même commande ultérieurement sans modifier le contrat exposé à l’agent.

## Prérequis

- Un Node **macOS** appairé (l’application macOS OpenClaw exécutée en mode Node).
- Le réglage **Autoriser le contrôle de l’ordinateur** activé dans l’application macOS (valeur par défaut : désactivé).
- L’autorisation macOS **Accessibility** accordée à OpenClaw (pour l’injection des actions du pointeur et du clavier) ainsi que l’autorisation **Screen Recording** (pour `screen.snapshot`).
- La commande `computer.act` armée sur le Gateway (elle est dangereuse et désarmée par défaut).
- Un modèle d’agent doté de capacités visuelles.
- Une stratégie d’outils qui expose `computer`. Le profil `coding` par défaut ne l’expose pas. Ajoutez `computer` à `tools.alsoAllow` ; les agents en bac à sable doivent également l’avoir dans `tools.sandbox.tools.alsoAllow`.

## L’outil d’agent `computer`

L’outil `computer` intégré accepte une action par appel. Les coordonnées sont des pixels entiers non négatifs dans la copie d’écran la plus récente ; le Node les convertit en points d’affichage. Les actions utilisant des coordonnées doivent renvoyer le `frameId` du résultat de la copie d’écran, et un `screenIndex` explicite doit correspondre à cette image. OpenClaw transmet également dans l’action une identité d’écran fournie par le Node à partir de la copie d’écran, afin qu’une reconnexion de l’écran ou une modification de sa géométrie entraîne un refus sécurisé plutôt qu’un reciblage silencieux du même index. Ces vérifications rejettent les jetons devinés ainsi que les jetons provenant d’une autre image ou d’un autre écran transmis. Un jeton ne garantit pas l’actualité de l’image : les applications peuvent modifier les pixels du même écran après la capture ; prenez donc une nouvelle copie d’écran chaque fois que la scène peut avoir changé.

- Lecture : `screenshot`.
- Pointeur : `left_click`, `right_click`, `middle_click`, `double_click`, `triple_click`, `mouse_move`, `left_click_drag` (avec `startCoordinate`), `left_mouse_down`, `left_mouse_up`.
- Défilement : `scroll` avec `scrollDirection` (`up|down|left|right`) et `scrollAmount` (crans de molette).
- Clavier : `type` (texte), `key` (combinaison telle que `cmd+shift+t` ou `Return`), `hold_key` (combinaison `text` maintenue pendant `duration` secondes).
- Temporisation : `wait` (`duration` secondes).

Les touches de modification sont transmises dans le champ `text` des actions de clic et de défilement (`shift`, `ctrl`, `alt`, `cmd`). Après une action de saisie, l’outil renvoie une nouvelle copie d’écran afin que le modèle puisse observer le résultat. Si plusieurs Nodes capables de contrôler l’ordinateur sont connectés, transmettez explicitement `node`.

Les copies d’écran restent **réservées au modèle** : elles ne sont jamais transmises automatiquement au canal de discussion. Considérez tout le contenu affiché à l’écran comme une entrée non fiable ; l’outil avertit le modèle de ne pas suivre les instructions affichées qui contredisent la demande de l’utilisateur.

## La commande de Node `computer.act`

`computer.act` est l’unique commande de Node par laquelle l’outil achemine les entrées (`node.invoke` avec `command: "computer.act"`). Elle est :

- **Dangereuse par défaut** : elle figure parmi les commandes de Node dangereuses intégrées et est exclue de la liste d’autorisation d’exécution jusqu’à ce qu’elle soit explicitement armée. Un Node macOS peut néanmoins la déclarer lors de l’appairage afin que cette surface ne doive être approuvée qu’une seule fois.
- **Réservée à macOS** actuellement : elle n’est annoncée que par un Node macOS sur lequel **Autoriser le contrôle de l’ordinateur** est activé.

Les lectures réutilisent `screen.snapshot` ; il n’existe aucun second chemin de capture. Consultez [Nodes de caméra et d’écran](/fr/nodes/camera) pour connaître la commande de capture partagée.

## Activer et armer

1. Dans l’application macOS, activez **Réglages → Autoriser le contrôle de l’ordinateur**. Ouvrez ensuite **Réglages → Autorisations**, puis accordez **Accessibility** et **Screen Recording** dans macOS System Settings.
2. Approuvez la mise à jour de l’appairage sur le Gateway (une nouvelle commande impose un nouvel appairage).
3. Exposez l’outil à l’agent doté de capacités visuelles. Pour le profil `coding` par défaut :

   ```json5
   {
     tools: {
       alsoAllow: ["computer"],
       // Les agents en bac à sable ont également besoin de cette seconde autorisation :
       sandbox: { tools: { alsoAllow: ["computer"] } },
     },
   }
   ```

4. Armez `computer.act` pour une période limitée. Le plugin `phone-control` expose un groupe `computer` :

   ```text
   /phone arm computer 30m
   /phone status
   /phone disarm
   ```

   L’armement nécessite `operator.admin` (ou le propriétaire) et expire automatiquement. L’ancien groupe `/phone arm all` exclut intentionnellement le contrôle de l’ordinateur de bureau ; utilisez explicitement le groupe `computer`. L’armement détermine uniquement ce que le Gateway peut invoquer ; l’application macOS continue d’appliquer son réglage **Autoriser le contrôle de l’ordinateur** et les autorisations du système d’exploitation.

Pour une autorisation persistante, ajoutez `computer.act` à `gateway.nodes.allowCommands` **et supprimez-le de** `gateway.nodes.denyCommands` ; la liste de refus est prioritaire. Une autorisation persistante n’expire pas automatiquement. Les entrées déjà présentes avant `/phone arm` restent en place après `/phone disarm` ; ne convertissez pas une autorisation temporaire en autorisation persistante pendant qu’elle est armée.

L’autorisation est délibérément séparée entre l’activation et l’utilisation. L’armement ou
la configuration persistante de `computer.act` nécessite des droits administratifs.
Une fois la commande armée, un opérateur authentifié disposant de `operator.write` peut invoquer
`computer.act` au moyen de `node.invoke` jusqu’à l’expiration ou au désarmement de l’autorisation ;
aucune vérification administrative n’est effectuée pour chaque action. L’approbation d’un Node qui déclare
`computer.act` enregistre uniquement la surface afin qu’elle puisse être armée ultérieurement et
n’autorise pas à elle seule son invocation.

## Sécurité

- Avant l’autorisation, toutes les couches (stratégie d’outils, stratégie de commandes du Gateway, réglage macOS, Accessibility et Screen Recording) doivent donner leur accord. Une fois la commande armée, les actions sont exécutées sans confirmation individuelle jusqu’à l’expiration ou à l’exécution de `/phone disarm`.
- Le texte est saisi graphème par graphème. Une annulation, une déconnexion, une mise en pause, une désactivation ou un remplacement du point de terminaison interrompt la saisie avant le graphème suivant au lieu de laisser la partie restante obsolète se poursuivre.
- Les copies d’écran sont réservées au modèle et ne sont jamais envoyées automatiquement dans la discussion (problème [#44759](https://github.com/openclaw/openclaw/issues/44759)).
- Considérez le contenu de l’écran comme non fiable ; il peut contenir une injection de prompt.

## Relation avec les autres méthodes de contrôle de l’ordinateur de bureau

Il s’agit de la méthode pilotée par l’agent. Consultez [Pont Peekaboo](/fr/platforms/mac/peekaboo) pour comprendre sa relation avec l’hôte PeekabooBridge, Codex Computer Use et le MCP `cua-driver` direct.
