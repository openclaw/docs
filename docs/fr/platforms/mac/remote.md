---
read_when:
    - Configuration ou débogage du contrôle Mac distant
summary: Flux de l’application macOS pour contrôler un Gateway OpenClaw distant
title: Contrôle à distance
x-i18n:
    generated_at: "2026-07-03T23:31:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d1ac5065011ef16085b3349ee7224fe3e806a6de61feaac2dcd5c9ed264227e
    source_path: platforms/mac/remote.md
    workflow: 16
---

Ce flux permet à l’application macOS d’agir comme une télécommande complète pour un Gateway OpenClaw exécuté sur un autre hôte (ordinateur de bureau/serveur). L’application peut se connecter directement à des URL de Gateway LAN/Tailnet approuvées ou gérer un tunnel SSH lorsque le Gateway distant est limité au loopback. Les contrôles d’intégrité, le transfert Voice Wake et Web Chat réutilisent la même configuration distante depuis _Réglages → Général_.

## Modes

- **Local (ce Mac)** : tout s’exécute sur l’ordinateur portable. Aucun SSH n’est impliqué.
- **Distant via SSH (par défaut)** : les commandes OpenClaw sont exécutées sur l’hôte distant. L’application Mac ouvre une connexion SSH avec `-o BatchMode` plus l’identité/la clé choisie et une redirection de port locale.
- **Distant direct (ws/wss)** : aucun tunnel SSH. L’application Mac se connecte directement à l’URL du Gateway (par exemple via LAN, Tailscale, Tailscale Serve ou un proxy inverse HTTPS public).

## Transports distants

Le mode distant prend en charge deux transports :

- **Tunnel SSH** (par défaut) : utilise `ssh -N -L ...` pour rediriger le port du Gateway vers localhost. Le Gateway verra l’IP du Node comme `127.0.0.1`, car le tunnel est en loopback.
- **Direct (ws/wss)** : se connecte directement à l’URL du Gateway. Le Gateway voit la véritable IP du client.

L’application désactive le multiplexage de connexion SSH et l’exécution en arrière-plan après authentification pour les processus SSH qu’elle possède, afin de pouvoir surveiller et redémarrer le processus exact même lorsque l’alias sélectionné active `ControlMaster` ou `ForkAfterAuthentication`.

La vérification de clé d’hôte SSH est stricte par défaut, car les identifiants du Gateway transitent par ce tunnel. Pour un alias SSH géré dont vous voulez explicitement utiliser le comportement de confiance, activez-le avec `openclaw-mac configure-remote --ssh-target <alias> --ssh-host-key-policy openssh` ou définissez `gateway.remote.sshHostKeyPolicy` sur `"openssh"`. Cette activation utilise la politique effective de clé d’hôte OpenSSH ; examinez d’abord l’alias et toute configuration `Host *` ou système correspondante. Changer la cible SSH dans l’application ou avec `configure-remote` réinitialise la politique à `strict`, sauf si vous l’activez explicitement à nouveau.

En mode tunnel SSH, les noms d’hôte LAN/tailnet découverts sont enregistrés comme
`gateway.remote.sshTarget`. L’application conserve `gateway.remote.url` sur le point de terminaison
local du tunnel, par exemple `ws://127.0.0.1:18789`, afin que la CLI, Web Chat et
le service local d’hôte de Node utilisent tous le même transport local loopback sûr.
Lorsque la découverte renvoie à la fois des IP Tailnet brutes et des noms d’hôte stables, l’application
préfère les noms Tailscale MagicDNS ou LAN afin que les connexions distantes résistent mieux aux
changements d’adresse.
Si le port local du tunnel diffère du port distant du Gateway, définissez
`gateway.remote.remotePort` sur le port de l’hôte distant.

L’automatisation du navigateur en mode distant appartient à l’hôte Node de la CLI, pas au
Node natif de l’application macOS. L’application démarre le service d’hôte Node installé lorsque
c’est possible ; si vous avez besoin du contrôle du navigateur depuis ce Mac, installez/démarrez-le avec
`openclaw node install ...` et `openclaw node start` (ou exécutez
`openclaw node run ...` au premier plan), puis ciblez ce Node compatible avec le navigateur.

## Prérequis sur l’hôte distant

1. Installez Node + pnpm et construisez/installez la CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Assurez-vous que `openclaw` est dans PATH pour les shells non interactifs (lien symbolique dans `/usr/local/bin` ou `/opt/homebrew/bin` si nécessaire).
3. Pour le transport SSH uniquement : ouvrez SSH avec une authentification par clé. Nous recommandons les IP **Tailscale** pour une joignabilité stable hors LAN.

## Configuration de l’application macOS

Pour préconfigurer l’application sans le flux d’accueil :

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

Cela écrit la configuration distante, marque l’onboarding comme terminé et permet à l’application de posséder
le transport sélectionné au démarrage.

1. Ouvrez _Réglages → Général_.
2. Sous **OpenClaw s’exécute**, choisissez **Distant** et définissez :
   - **Transport** : **Tunnel SSH** ou **Direct (ws/wss)**.
   - **Cible SSH** : `user@host` (`:port` facultatif).
     - Si le Gateway est sur le même LAN et annonce Bonjour, choisissez-le dans la liste découverte pour remplir automatiquement ce champ.
   - **URL du Gateway** (Direct uniquement) : `wss://gateway.example.ts.net` (ou `ws://...` pour local/LAN).
   - **Fichier d’identité** (avancé) : chemin vers votre clé.
   - **Racine du projet** (avancé) : chemin du checkout distant utilisé pour les commandes.
   - **Chemin de la CLI** (avancé) : chemin facultatif vers un point d’entrée/binaire `openclaw` exécutable (rempli automatiquement lorsqu’il est annoncé).
3. Cliquez sur **Tester le distant**. Une réussite indique que le `openclaw status --json` distant s’exécute correctement. Les échecs signifient généralement des problèmes de PATH/CLI ; le code de sortie 127 signifie que la CLI est introuvable à distance.
4. Les contrôles d’intégrité et Web Chat passeront désormais automatiquement par le transport sélectionné.

## Web Chat

- **Tunnel SSH** : Web Chat se connecte au Gateway via le port de contrôle WebSocket redirigé (18789 par défaut).
- **Direct (ws/wss)** : Web Chat se connecte directement à l’URL du Gateway configurée.
- Il n’existe plus de serveur HTTP WebChat séparé.

## Autorisations

- L’hôte distant nécessite les mêmes approbations TCC qu’en local (Automatisation, Accessibilité, Enregistrement de l’écran, Microphone, Reconnaissance vocale, Notifications). Exécutez l’onboarding sur cette machine pour les accorder une seule fois.
- Les Nodes annoncent leur état d’autorisation via `node.list` / `node.describe` afin que les agents sachent ce qui est disponible.

## Notes de sécurité

- Préférez les liaisons loopback sur l’hôte distant et connectez-vous via SSH, Tailscale Serve ou une URL directe Tailnet/LAN approuvée.
- Le tunneling SSH nécessite par défaut une clé d’hôte déjà approuvée. Approuvez d’abord la clé d’hôte afin qu’elle existe dans le fichier known-hosts configuré, ou choisissez explicitement `gateway.remote.sshHostKeyPolicy: "openssh"` pour un alias géré dont vous acceptez la politique de confiance OpenSSH.
- Si vous liez le Gateway à une interface non loopback, exigez une authentification Gateway valide : jeton, mot de passe ou proxy inverse sensible à l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- Consultez [Sécurité](/fr/gateway/security) et [Tailscale](/fr/gateway/tailscale).

## Flux de connexion WhatsApp (distant)

- Exécutez `openclaw channels login --verbose` **sur l’hôte distant**. Scannez le QR avec WhatsApp sur votre téléphone.
- Relancez la connexion sur cet hôte si l’authentification expire. Le contrôle d’intégrité signalera les problèmes de liaison.

## Dépannage

- **code de sortie 127 / introuvable** : `openclaw` n’est pas dans PATH pour les shells non login. Ajoutez-le à `/etc/paths`, à votre rc de shell, ou créez un lien symbolique dans `/usr/local/bin`/`/opt/homebrew/bin`.
- **Échec de la sonde d’intégrité** : vérifiez la joignabilité SSH, PATH et que Baileys est connecté (`openclaw status --json`).
- **Web Chat bloqué** : confirmez que le Gateway s’exécute sur l’hôte distant et que le port redirigé correspond au port WS du Gateway ; l’interface utilisateur nécessite une connexion WS saine.
- **L’IP du Node affiche 127.0.0.1** : attendu avec le tunnel SSH. Passez **Transport** à **Direct (ws/wss)** si vous voulez que le Gateway voie la véritable IP du client.
- **Le tableau de bord fonctionne mais les capacités du Mac sont hors ligne** : cela signifie que la connexion opérateur/contrôle de l’application est saine, mais que la connexion du Node compagnon n’est pas connectée ou qu’il lui manque sa surface de commandes. Ouvrez la section appareil de la barre de menus et vérifiez si le Mac est `paired · disconnected`. Pour les points de terminaison Tailscale Serve `wss://*.ts.net`, l’application détecte les anciens pins TLS de feuille devenus obsolètes après rotation de certificat, efface le pin obsolète lorsque macOS fait confiance au nouveau certificat, puis réessaie automatiquement. Si le certificat n’est pas approuvé par le système ou si l’hôte n’est pas un nom Tailscale Serve, définissez `gateway.remote.tlsFingerprint` sur l’empreinte attendue du certificat, examinez le certificat ou passez à **Distant via SSH**.
- **Voice Wake** : les phrases de déclenchement sont transférées automatiquement en mode distant ; aucun transfert séparé n’est nécessaire.

## Sons de notification

Choisissez les sons par notification depuis des scripts avec `openclaw` et `node.invoke`, par exemple :

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Il n’y a plus de bouton global « son par défaut » dans l’application ; les appelants choisissent un son (ou aucun) par requête.

## Connexe

- [Application macOS](/fr/platforms/macos)
- [Accès distant](/fr/gateway/remote)
