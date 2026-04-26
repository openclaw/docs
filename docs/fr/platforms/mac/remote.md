---
read_when:
    - Configuration ou débogage du contrôle distant macOS
summary: Flux de l’application macOS pour contrôler une Gateway OpenClaw distante via SSH
title: Contrôle à distance
x-i18n:
    generated_at: "2026-04-26T11:33:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4de4980fe378fc9b685cf7732d21a80c640088191308b8ef1d3df9f468cb5be2
    source_path: platforms/mac/remote.md
    workflow: 15
---

# OpenClaw distant (macOS ⇄ hôte distant)

Ce flux permet à l’application macOS d’agir comme un contrôle à distance complet pour une Gateway OpenClaw exécutée sur un autre hôte (poste de travail/serveur). C’est la fonctionnalité **Remote over SSH** (exécution distante) de l’application. Toutes les fonctionnalités — vérifications de santé, transfert de Voice Wake et Web Chat — réutilisent la même configuration SSH distante depuis _Réglages → Général_.

## Modes

- **Local (ce Mac)** : tout s’exécute sur l’ordinateur portable. Aucun SSH n’est impliqué.
- **Remote over SSH (par défaut)** : les commandes OpenClaw sont exécutées sur l’hôte distant. L’application Mac ouvre une connexion SSH avec `-o BatchMode` plus votre identité/clé choisie et un transfert de port local.
- **Remote direct (ws/wss)** : pas de tunnel SSH. L’application Mac se connecte directement à l’URL Gateway (par exemple via Tailscale Serve ou un proxy inverse HTTPS public).

## Transports distants

Le mode distant prend en charge deux transports :

- **Tunnel SSH** (par défaut) : utilise `ssh -N -L ...` pour transférer le port Gateway vers localhost. La Gateway verra l’IP du nœud comme `127.0.0.1` parce que le tunnel passe par loopback.
- **Direct (ws/wss)** : se connecte directement à l’URL Gateway. La Gateway voit la véritable IP du client.

En mode tunnel SSH, les noms d’hôte LAN/tailnet découverts sont enregistrés comme
`gateway.remote.sshTarget`. L’application conserve `gateway.remote.url` sur le point de terminaison du tunnel local, par exemple `ws://127.0.0.1:18789`, de sorte que la CLI, Web Chat et
le service local node-host utilisent tous le même transport loopback sécurisé.

L’automatisation navigateur en mode distant est gérée par le CLI node host, et non par le nœud natif de l’application macOS. L’application démarre le service node host installé lorsque
possible ; si vous avez besoin du contrôle du navigateur depuis ce Mac, installez/démarrez-le avec
`openclaw node install ...` et `openclaw node start` (ou exécutez
`openclaw node run ...` au premier plan), puis ciblez ce nœud compatible navigateur.

## Prérequis sur l’hôte distant

1. Installez Node + pnpm et construisez/installez la CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Assurez-vous que `openclaw` est dans le PATH pour les shells non interactifs (symlink vers `/usr/local/bin` ou `/opt/homebrew/bin` si nécessaire).
3. Ouvrez SSH avec authentification par clé. Nous recommandons les IP **Tailscale** pour une joignabilité stable hors LAN.

## Configuration de l’application macOS

1. Ouvrez _Réglages → Général_.
2. Sous **OpenClaw runs**, choisissez **Remote over SSH** et définissez :
   - **Transport** : **Tunnel SSH** ou **Direct (ws/wss)**.
   - **Cible SSH** : `user@host` (`:port` facultatif).
     - Si la Gateway est sur le même LAN et annonce Bonjour, choisissez-la dans la liste découverte pour remplir automatiquement ce champ.
   - **URL Gateway** (direct uniquement) : `wss://gateway.example.ts.net` (ou `ws://...` pour local/LAN).
   - **Fichier d’identité** (avancé) : chemin vers votre clé.
   - **Racine du projet** (avancé) : chemin du checkout distant utilisé pour les commandes.
   - **Chemin CLI** (avancé) : chemin facultatif vers un point d’entrée/binaire `openclaw` exécutable (rempli automatiquement lorsqu’il est annoncé).
3. Cliquez sur **Test remote**. Le succès indique que la commande distante `openclaw status --json` s’exécute correctement. Les échecs signifient généralement des problèmes de PATH/CLI ; le code de sortie 127 signifie que la CLI est introuvable à distance.
4. Les vérifications de santé et Web Chat passeront désormais automatiquement par ce tunnel SSH.

## Web Chat

- **Tunnel SSH** : Web Chat se connecte à la Gateway via le port de contrôle WebSocket transféré (par défaut 18789).
- **Direct (ws/wss)** : Web Chat se connecte directement à l’URL Gateway configurée.
- Il n’y a plus de serveur HTTP WebChat séparé.

## Autorisations

- L’hôte distant a besoin des mêmes approbations TCC qu’en local (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Exécutez l’intégration sur cette machine pour les accorder une fois.
- Les nœuds annoncent leur état d’autorisations via `node.list` / `node.describe` afin que les agents sachent ce qui est disponible.

## Remarques de sécurité

- Préférez les liaisons loopback sur l’hôte distant et connectez-vous via SSH ou Tailscale.
- Le tunneling SSH utilise une vérification stricte des clés d’hôte ; faites d’abord confiance à la clé d’hôte pour qu’elle existe dans `~/.ssh/known_hosts`.
- Si vous liez la Gateway à une interface non loopback, exigez une authentification Gateway valide : jeton, mot de passe ou proxy inverse sensible à l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- Voir [Sécurité](/fr/gateway/security) et [Tailscale](/fr/gateway/tailscale).

## Flux de connexion WhatsApp (distant)

- Exécutez `openclaw channels login --verbose` **sur l’hôte distant**. Scannez le QR avec WhatsApp sur votre téléphone.
- Relancez la connexion sur cet hôte si l’authentification expire. La vérification de santé mettra en évidence les problèmes de liaison.

## Dépannage

- **exit 127 / not found** : `openclaw` n’est pas dans le PATH pour les shells non login. Ajoutez-le à `/etc/paths`, au rc de votre shell, ou créez un symlink vers `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed** : vérifiez la joignabilité SSH, le PATH, et que Baileys est connecté (`openclaw status --json`).
- **Web Chat bloqué** : confirmez que la Gateway est en cours d’exécution sur l’hôte distant et que le port transféré correspond au port WS Gateway ; l’UI nécessite une connexion WS saine.
- **L’IP du nœud affiche 127.0.0.1** : c’est attendu avec le tunnel SSH. Basculez **Transport** sur **Direct (ws/wss)** si vous voulez que la Gateway voie la véritable IP client.
- **Voice Wake** : les phrases de déclenchement sont transférées automatiquement en mode distant ; aucun redirecteur séparé n’est nécessaire.

## Sons de notification

Choisissez des sons par notification depuis les scripts avec `openclaw` et `node.invoke`, par exemple :

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Il n’existe plus de bascule globale « son par défaut » dans l’application ; les appelants choisissent un son (ou aucun) pour chaque requête.

## Liens connexes

- [Application macOS](/fr/platforms/macos)
- [Accès à distance](/fr/gateway/remote)
