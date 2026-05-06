---
read_when:
    - Configurer ou déboguer le contrôle Mac à distance
summary: Flux de l’application macOS pour contrôler un Gateway OpenClaw distant via SSH
title: Contrôle à distance
x-i18n:
    generated_at: "2026-05-06T07:31:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd7eb110f4c3e6a52b4b9baeccce4ef9d02c01104c188940c28f245bc161894a
    source_path: platforms/mac/remote.md
    workflow: 16
---

Ce flux permet à l’application macOS d’agir comme une télécommande complète pour un Gateway OpenClaw exécuté sur un autre hôte (ordinateur de bureau/serveur). C’est la fonctionnalité **Remote over SSH** (exécution distante) de l’application. Toutes les fonctionnalités, contrôles d’état, transfert de Voice Wake et Web Chat, réutilisent la même configuration SSH distante depuis _Réglages → Général_.

## Modes

- **Local (ce Mac)** : tout s’exécute sur l’ordinateur portable. Aucun SSH n’est impliqué.
- **Remote over SSH (par défaut)** : les commandes OpenClaw sont exécutées sur l’hôte distant. L’application Mac ouvre une connexion SSH avec `-o BatchMode`, ainsi que l’identité/clé choisie et un transfert de port local.
- **Remote direct (ws/wss)** : aucun tunnel SSH. L’application Mac se connecte directement à l’URL du Gateway (par exemple via Tailscale Serve ou un proxy inverse HTTPS public).

## Transports distants

Le mode distant prend en charge deux transports :

- **Tunnel SSH** (par défaut) : utilise `ssh -N -L ...` pour transférer le port du Gateway vers localhost. Le Gateway verra l’adresse IP du nœud comme `127.0.0.1`, car le tunnel est en loopback.
- **Direct (ws/wss)** : se connecte directement à l’URL du Gateway. Le Gateway voit l’adresse IP réelle du client.

En mode tunnel SSH, les noms d’hôtes LAN/tailnet découverts sont enregistrés comme
`gateway.remote.sshTarget`. L’application conserve `gateway.remote.url` sur le point de terminaison
du tunnel local, par exemple `ws://127.0.0.1:18789`, afin que la CLI, Web Chat et
le service local d’hôte de nœud utilisent tous le même transport loopback sûr.

L’automatisation du navigateur en mode distant appartient à l’hôte de nœud de la CLI, et non au
nœud natif de l’application macOS. L’application démarre le service d’hôte de nœud installé lorsque
c’est possible ; si vous avez besoin du contrôle du navigateur depuis ce Mac, installez-le/démarrez-le avec
`openclaw node install ...` et `openclaw node start` (ou exécutez
`openclaw node run ...` au premier plan), puis ciblez ce nœud compatible avec le navigateur.

## Prérequis sur l’hôte distant

1. Installez Node + pnpm et compilez/installez la CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Vérifiez que `openclaw` est dans le PATH pour les shells non interactifs (créez un lien symbolique dans `/usr/local/bin` ou `/opt/homebrew/bin` si nécessaire).
3. Ouvrez SSH avec une authentification par clé. Nous recommandons les IP **Tailscale** pour une joignabilité stable hors LAN.

## Configuration de l’application macOS

1. Ouvrez _Réglages → Général_.
2. Sous **OpenClaw s’exécute**, choisissez **Remote over SSH** et définissez :
   - **Transport** : **Tunnel SSH** ou **Direct (ws/wss)**.
   - **Cible SSH** : `user@host` (`:port` facultatif).
     - Si le Gateway est sur le même LAN et annonce Bonjour, choisissez-le dans la liste découverte pour remplir automatiquement ce champ.
   - **URL du Gateway** (Direct uniquement) : `wss://gateway.example.ts.net` (ou `ws://...` pour local/LAN).
   - **Fichier d’identité** (avancé) : chemin vers votre clé.
   - **Racine du projet** (avancé) : chemin de checkout distant utilisé pour les commandes.
   - **Chemin de la CLI** (avancé) : chemin facultatif vers un point d’entrée/binaire `openclaw` exécutable (rempli automatiquement lorsqu’il est annoncé).
3. Cliquez sur **Tester le distant**. Une réussite indique que le `openclaw status --json` distant s’exécute correctement. Les échecs signifient généralement des problèmes de PATH/CLI ; le code de sortie 127 signifie que la CLI est introuvable à distance.
4. Les contrôles d’état et Web Chat passeront désormais automatiquement par ce tunnel SSH.

## Web Chat

- **Tunnel SSH** : Web Chat se connecte au Gateway via le port de contrôle WebSocket transféré (18789 par défaut).
- **Direct (ws/wss)** : Web Chat se connecte directement à l’URL du Gateway configurée.
- Il n’y a plus de serveur HTTP WebChat séparé.

## Autorisations

- L’hôte distant a besoin des mêmes approbations TCC qu’en local (Automatisation, Accessibilité, Enregistrement de l’écran, Microphone, Reconnaissance vocale, Notifications). Exécutez l’intégration sur cette machine pour les accorder une fois.
- Les nœuds annoncent leur état d’autorisation via `node.list` / `node.describe` afin que les agents sachent ce qui est disponible.

## Notes de sécurité

- Préférez les liaisons loopback sur l’hôte distant et connectez-vous via SSH ou Tailscale.
- Le tunneling SSH utilise une vérification stricte de la clé d’hôte ; approuvez d’abord la clé d’hôte afin qu’elle existe dans `~/.ssh/known_hosts`.
- Si vous liez le Gateway à une interface non-loopback, exigez une authentification Gateway valide : jeton, mot de passe ou proxy inverse sensible à l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- Consultez [Sécurité](/fr/gateway/security) et [Tailscale](/fr/gateway/tailscale).

## Flux de connexion WhatsApp (distant)

- Exécutez `openclaw channels login --verbose` **sur l’hôte distant**. Scannez le QR avec WhatsApp sur votre téléphone.
- Réexécutez la connexion sur cet hôte si l’authentification expire. Le contrôle d’état fera remonter les problèmes de liaison.

## Dépannage

- **exit 127 / introuvable** : `openclaw` n’est pas dans le PATH pour les shells non-login. Ajoutez-le à `/etc/paths`, au rc de votre shell, ou créez un lien symbolique dans `/usr/local/bin`/`/opt/homebrew/bin`.
- **Échec de la sonde d’état** : vérifiez la joignabilité SSH, le PATH, et que Baileys est connecté (`openclaw status --json`).
- **Web Chat bloqué** : confirmez que le Gateway s’exécute sur l’hôte distant et que le port transféré correspond au port WS du Gateway ; l’interface utilisateur nécessite une connexion WS saine.
- **L’IP du nœud affiche 127.0.0.1** : attendu avec le tunnel SSH. Passez **Transport** à **Direct (ws/wss)** si vous voulez que le Gateway voie l’adresse IP réelle du client.
- **Le tableau de bord fonctionne mais les capacités du Mac sont hors ligne** : cela signifie que la connexion opérateur/contrôle de l’application est saine, mais que la connexion du nœud compagnon n’est pas connectée ou qu’il lui manque sa surface de commandes. Ouvrez la section des appareils dans la barre de menus et vérifiez si le Mac est `paired · disconnected`. Pour les points de terminaison Tailscale Serve `wss://*.ts.net`, l’application détecte les anciennes épingles de feuille TLS obsolètes après rotation du certificat, efface l’épingle obsolète lorsque macOS approuve le nouveau certificat, puis réessaie automatiquement. Si le certificat n’est pas approuvé par le système ou si l’hôte n’est pas un nom Tailscale Serve, examinez le certificat ou passez à **Remote over SSH**.
- **Voice Wake** : les phrases de déclenchement sont transférées automatiquement en mode distant ; aucun transitaire séparé n’est nécessaire.

## Sons de notification

Choisissez les sons par notification depuis des scripts avec `openclaw` et `node.invoke`, par exemple :

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Il n’y a plus de bouton global « son par défaut » dans l’application ; les appelants choisissent un son (ou aucun) par requête.

## Connexe

- [Application macOS](/fr/platforms/macos)
- [Accès distant](/fr/gateway/remote)
