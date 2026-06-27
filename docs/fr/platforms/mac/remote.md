---
read_when:
    - Configurer ou déboguer le contrôle distant d’un Mac
summary: flux de l’application macOS pour contrôler un Gateway OpenClaw distant
title: Contrôle à distance
x-i18n:
    generated_at: "2026-06-27T17:43:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3634785f797af55f7dc6d217e0116313e8ef7d314c503275fbc66b54eb29a69
    source_path: platforms/mac/remote.md
    workflow: 16
---

Ce flux permet à l’app macOS d’agir comme une télécommande complète pour un Gateway OpenClaw exécuté sur un autre hôte (ordinateur de bureau/serveur). L’app peut se connecter directement à des URL de Gateway LAN/Tailnet approuvées ou gérer un tunnel SSH lorsque le Gateway distant est uniquement en loopback. Les contrôles de santé, le transfert Voice Wake et Web Chat réutilisent la même configuration distante depuis _Réglages → Général_.

## Modes

- **Local (ce Mac)** : tout s’exécute sur l’ordinateur portable. Aucun SSH impliqué.
- **Distant via SSH (par défaut)** : les commandes OpenClaw sont exécutées sur l’hôte distant. L’app mac ouvre une connexion SSH avec `-o BatchMode`, ainsi que l’identité/la clé choisie et une redirection de port locale.
- **Distant direct (ws/wss)** : aucun tunnel SSH. L’app mac se connecte directement à l’URL du Gateway (par exemple via LAN, Tailscale, Tailscale Serve ou un proxy inverse HTTPS public).

## Transports distants

Le mode distant prend en charge deux transports :

- **Tunnel SSH** (par défaut) : utilise `ssh -N -L ...` pour rediriger le port du Gateway vers localhost. Le Gateway verra l’IP du Node comme `127.0.0.1`, car le tunnel est en loopback.
- **Direct (ws/wss)** : se connecte directement à l’URL du Gateway. Le Gateway voit l’IP réelle du client.

En mode tunnel SSH, les noms d’hôte LAN/tailnet découverts sont enregistrés comme
`gateway.remote.sshTarget`. L’app conserve `gateway.remote.url` sur le point de terminaison
du tunnel local, par exemple `ws://127.0.0.1:18789`, afin que la CLI, Web Chat et
le service node-host local utilisent tous le même transport loopback sûr.
Si le port de tunnel local diffère du port du Gateway distant, définissez
`gateway.remote.remotePort` sur le port de l’hôte distant.

L’automatisation du navigateur en mode distant appartient à l’hôte Node CLI, pas au
Node de l’app macOS native. L’app démarre le service d’hôte Node installé quand
possible ; si vous avez besoin du contrôle du navigateur depuis ce Mac, installez/démarrez-le avec
`openclaw node install ...` et `openclaw node start` (ou exécutez
`openclaw node run ...` au premier plan), puis ciblez ce Node capable d’utiliser le navigateur.

## Prérequis sur l’hôte distant

1. Installez Node + pnpm et construisez/installez la CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Assurez-vous que `openclaw` est dans PATH pour les shells non interactifs (créez un lien symbolique dans `/usr/local/bin` ou `/opt/homebrew/bin` si nécessaire).
3. Pour le transport SSH uniquement : ouvrez SSH avec authentification par clé. Nous recommandons les IP **Tailscale** pour une joignabilité stable hors LAN.

## Configuration de l’app macOS

Pour préconfigurer l’app sans le flux d’accueil :

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Pour un Gateway déjà joignable sur un LAN ou Tailnet approuvé, ignorez entièrement SSH :

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Cela écrit la configuration distante, marque l’intégration comme terminée et laisse l’app gérer
le transport sélectionné au démarrage.

1. Ouvrez _Réglages → Général_.
2. Sous **OpenClaw s’exécute**, choisissez **Distant** et définissez :
   - **Transport** : **Tunnel SSH** ou **Direct (ws/wss)**.
   - **Cible SSH** : `user@host` (`:port` facultatif).
     - Si le Gateway est sur le même LAN et annonce Bonjour, choisissez-le dans la liste découverte pour remplir automatiquement ce champ.
   - **URL du Gateway** (Direct uniquement) : `wss://gateway.example.ts.net` (ou `ws://...` pour local/LAN).
   - **Fichier d’identité** (avancé) : chemin vers votre clé.
   - **Racine du projet** (avancé) : chemin du checkout distant utilisé pour les commandes.
   - **Chemin CLI** (avancé) : chemin facultatif vers un point d’entrée/binaire `openclaw` exécutable (rempli automatiquement lorsqu’il est annoncé).
3. Appuyez sur **Tester le distant**. Un succès indique que le `openclaw status --json` distant s’exécute correctement. Les échecs indiquent généralement des problèmes de PATH/CLI ; le code de sortie 127 signifie que la CLI est introuvable à distance.
4. Les contrôles de santé et Web Chat s’exécuteront désormais automatiquement via le transport sélectionné.

## Web Chat

- **Tunnel SSH** : Web Chat se connecte au Gateway via le port de contrôle WebSocket redirigé (18789 par défaut).
- **Direct (ws/wss)** : Web Chat se connecte directement à l’URL du Gateway configurée.
- Il n’y a plus de serveur HTTP WebChat séparé.

## Autorisations

- L’hôte distant a besoin des mêmes approbations TCC qu’en local (Automatisation, Accessibilité, Enregistrement de l’écran, Microphone, Reconnaissance vocale, Notifications). Exécutez l’intégration sur cette machine pour les accorder une fois.
- Les Nodes annoncent leur état d’autorisation via `node.list` / `node.describe` afin que les agents sachent ce qui est disponible.

## Notes de sécurité

- Préférez les liaisons loopback sur l’hôte distant et connectez-vous via SSH, Tailscale Serve ou une URL directe Tailnet/LAN approuvée.
- Le tunneling SSH utilise une vérification stricte de la clé d’hôte ; approuvez d’abord la clé d’hôte afin qu’elle existe dans `~/.ssh/known_hosts`.
- Si vous liez le Gateway à une interface non-loopback, exigez une authentification Gateway valide : jeton, mot de passe ou proxy inverse tenant compte de l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- Voir [Sécurité](/fr/gateway/security) et [Tailscale](/fr/gateway/tailscale).

## Flux de connexion WhatsApp (distant)

- Exécutez `openclaw channels login --verbose` **sur l’hôte distant**. Scannez le QR avec WhatsApp sur votre téléphone.
- Relancez la connexion sur cet hôte si l’authentification expire. Le contrôle de santé signalera les problèmes de liaison.

## Dépannage

- **exit 127 / introuvable** : `openclaw` n’est pas dans PATH pour les shells non-login. Ajoutez-le à `/etc/paths`, au rc de votre shell, ou créez un lien symbolique dans `/usr/local/bin`/`/opt/homebrew/bin`.
- **Échec de la sonde de santé** : vérifiez la joignabilité SSH, PATH et que Baileys est connecté (`openclaw status --json`).
- **Web Chat bloqué** : confirmez que le Gateway s’exécute sur l’hôte distant et que le port redirigé correspond au port WS du Gateway ; l’interface utilisateur nécessite une connexion WS saine.
- **L’IP du Node affiche 127.0.0.1** : attendu avec le tunnel SSH. Passez **Transport** à **Direct (ws/wss)** si vous voulez que le Gateway voie l’IP réelle du client.
- **Le tableau de bord fonctionne mais les capacités Mac sont hors ligne** : cela signifie que la connexion opérateur/contrôle de l’app est saine, mais que la connexion du Node compagnon n’est pas connectée ou qu’il lui manque sa surface de commandes. Ouvrez la section d’appareil de la barre de menus et vérifiez si le Mac est `paired · disconnected`. Pour les points de terminaison Tailscale Serve `wss://*.ts.net`, l’app détecte les anciens pins de feuille TLS obsolètes après rotation du certificat, efface le pin obsolète lorsque macOS approuve le nouveau certificat et réessaie automatiquement. Si le certificat n’est pas approuvé par le système ou si l’hôte n’est pas un nom Tailscale Serve, définissez `gateway.remote.tlsFingerprint` sur l’empreinte de certificat attendue, examinez le certificat ou passez à **Distant via SSH**.
- **Voice Wake** : les phrases de déclenchement sont transférées automatiquement en mode distant ; aucun forwarder séparé n’est nécessaire.

## Sons de notification

Choisissez les sons par notification depuis des scripts avec `openclaw` et `node.invoke`, par exemple :

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Il n’y a plus de bascule globale « son par défaut » dans l’app ; les appelants choisissent un son (ou aucun) par requête.

## Connexe

- [app macOS](/fr/platforms/macos)
- [Accès distant](/fr/gateway/remote)
