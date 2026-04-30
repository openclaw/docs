---
read_when:
    - Configuration ou débogage du contrôle à distance du Mac
summary: Flux de l’application macOS pour contrôler un Gateway OpenClaw distant via SSH
title: Contrôle à distance
x-i18n:
    generated_at: "2026-04-30T16:28:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c63f752c3636a253220310c7c8e57a28549704b74b2f0370bac432bae28a7d3
    source_path: platforms/mac/remote.md
    workflow: 16
---

# OpenClaw distant (macOS ⇄ hôte distant)

Ce flux permet à l’app macOS d’agir comme une télécommande complète pour un Gateway OpenClaw exécuté sur un autre hôte (ordinateur de bureau/serveur). C’est la fonctionnalité **Distant via SSH** (exécution distante) de l’app. Toutes les fonctionnalités — vérifications de santé, transfert Voice Wake et Web Chat — réutilisent la même configuration SSH distante depuis _Réglages → Général_.

## Modes

- **Local (ce Mac)** : tout s’exécute sur l’ordinateur portable. Aucun SSH impliqué.
- **Distant via SSH (par défaut)** : les commandes OpenClaw sont exécutées sur l’hôte distant. L’app mac ouvre une connexion SSH avec `-o BatchMode`, ainsi que l’identité/la clé choisie et un transfert de port local.
- **Distant direct (ws/wss)** : aucun tunnel SSH. L’app mac se connecte directement à l’URL du Gateway (par exemple via Tailscale Serve ou un proxy inverse HTTPS public).

## Transports distants

Le mode distant prend en charge deux transports :

- **Tunnel SSH** (par défaut) : utilise `ssh -N -L ...` pour transférer le port du Gateway vers localhost. Le Gateway verra l’IP du Node comme `127.0.0.1` parce que le tunnel est en loopback.
- **Direct (ws/wss)** : se connecte directement à l’URL du Gateway. Le Gateway voit l’IP réelle du client.

En mode tunnel SSH, les noms d’hôte LAN/tailnet découverts sont enregistrés comme
`gateway.remote.sshTarget`. L’app conserve `gateway.remote.url` sur le point de terminaison du tunnel local, par exemple `ws://127.0.0.1:18789`, afin que la CLI, Web Chat et le service d’hôte Node local utilisent tous le même transport loopback sûr.

L’automatisation du navigateur en mode distant appartient à l’hôte Node de la CLI, pas au Node de l’app macOS native. L’app démarre le service d’hôte Node installé lorsque c’est possible ; si vous avez besoin de contrôler un navigateur depuis ce Mac, installez-le/démarrez-le avec `openclaw node install ...` et `openclaw node start` (ou exécutez `openclaw node run ...` au premier plan), puis ciblez ce Node compatible avec le navigateur.

## Prérequis sur l’hôte distant

1. Installez Node + pnpm et construisez/installez la CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Assurez-vous que `openclaw` est dans le PATH pour les shells non interactifs (créez un lien symbolique dans `/usr/local/bin` ou `/opt/homebrew/bin` si nécessaire).
3. Ouvrez SSH avec une authentification par clé. Nous recommandons les IP **Tailscale** pour une joignabilité stable hors LAN.

## Configuration de l’app macOS

1. Ouvrez _Réglages → Général_.
2. Sous **OpenClaw s’exécute**, choisissez **Distant via SSH** et définissez :
   - **Transport** : **Tunnel SSH** ou **Direct (ws/wss)**.
   - **Cible SSH** : `user@host` (`:port` facultatif).
     - Si le Gateway est sur le même LAN et annonce Bonjour, choisissez-le dans la liste découverte pour remplir automatiquement ce champ.
   - **URL du Gateway** (Direct uniquement) : `wss://gateway.example.ts.net` (ou `ws://...` pour local/LAN).
   - **Fichier d’identité** (avancé) : chemin vers votre clé.
   - **Racine du projet** (avancé) : chemin du checkout distant utilisé pour les commandes.
   - **Chemin CLI** (avancé) : chemin facultatif vers un point d’entrée/binaire `openclaw` exécutable (rempli automatiquement lorsqu’il est annoncé).
3. Cliquez sur **Tester le distant**. Un succès indique que le `openclaw status --json` distant s’exécute correctement. Les échecs signifient généralement des problèmes de PATH/CLI ; le code de sortie 127 signifie que la CLI est introuvable à distance.
4. Les vérifications de santé et Web Chat passeront maintenant automatiquement par ce tunnel SSH.

## Web Chat

- **Tunnel SSH** : Web Chat se connecte au Gateway via le port de contrôle WebSocket transféré (18789 par défaut).
- **Direct (ws/wss)** : Web Chat se connecte directement à l’URL du Gateway configurée.
- Il n’existe plus de serveur HTTP WebChat séparé.

## Autorisations

- L’hôte distant a besoin des mêmes approbations TCC que le local (Automation, Accessibilité, Enregistrement de l’écran, Microphone, Reconnaissance vocale, Notifications). Exécutez l’onboarding sur cette machine pour les accorder une fois.
- Les Nodes annoncent leur état d’autorisation via `node.list` / `node.describe` afin que les agents sachent ce qui est disponible.

## Notes de sécurité

- Préférez les liaisons loopback sur l’hôte distant et connectez-vous via SSH ou Tailscale.
- Le tunneling SSH utilise une vérification stricte de la clé d’hôte ; approuvez d’abord la clé d’hôte afin qu’elle existe dans `~/.ssh/known_hosts`.
- Si vous liez le Gateway à une interface non loopback, exigez une authentification Gateway valide : jeton, mot de passe ou proxy inverse sensible à l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- Voir [Sécurité](/fr/gateway/security) et [Tailscale](/fr/gateway/tailscale).

## Flux de connexion WhatsApp (distant)

- Exécutez `openclaw channels login --verbose` **sur l’hôte distant**. Scannez le QR avec WhatsApp sur votre téléphone.
- Relancez la connexion sur cet hôte si l’authentification expire. La vérification de santé signalera les problèmes de liaison.

## Dépannage

- **code de sortie 127 / introuvable** : `openclaw` n’est pas dans le PATH pour les shells sans connexion. Ajoutez-le à `/etc/paths`, à votre rc de shell, ou créez un lien symbolique dans `/usr/local/bin`/`/opt/homebrew/bin`.
- **Échec de la sonde de santé** : vérifiez la joignabilité SSH, le PATH et que Baileys est connecté (`openclaw status --json`).
- **Web Chat bloqué** : confirmez que le Gateway s’exécute sur l’hôte distant et que le port transféré correspond au port WS du Gateway ; l’interface utilisateur exige une connexion WS saine.
- **L’IP du Node affiche 127.0.0.1** : attendu avec le tunnel SSH. Basculez **Transport** vers **Direct (ws/wss)** si vous voulez que le Gateway voie l’IP réelle du client.
- **Le tableau de bord fonctionne mais les capacités Mac sont hors ligne** : cela signifie que la connexion opérateur/contrôle de l’app est saine, mais que la connexion du Node compagnon n’est pas connectée ou qu’il lui manque sa surface de commande. Ouvrez la section des appareils dans la barre de menus et vérifiez si le Mac est `paired · disconnected`. Pour les points de terminaison Tailscale Serve `wss://*.ts.net`, l’app détecte les anciens épinglages TLS de certificat feuille devenus obsolètes après rotation du certificat, efface l’épinglage obsolète lorsque macOS fait confiance au nouveau certificat, puis réessaie automatiquement. Si le certificat n’est pas approuvé par le système ou si l’hôte n’est pas un nom Tailscale Serve, examinez le certificat ou basculez vers **Distant via SSH**.
- **Voice Wake** : les phrases de déclenchement sont transférées automatiquement en mode distant ; aucun forwarder séparé n’est nécessaire.

## Sons de notification

Choisissez les sons par notification depuis des scripts avec `openclaw` et `node.invoke`, par exemple :

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Il n’existe plus de bascule globale « son par défaut » dans l’app ; les appelants choisissent un son (ou aucun) pour chaque requête.

## Associé

- [app macOS](/fr/platforms/macos)
- [Accès distant](/fr/gateway/remote)
