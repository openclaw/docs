---
read_when:
    - Configurer ou déboguer le contrôle à distance d’un Mac
summary: Flux de l’application macOS pour contrôler un Gateway OpenClaw distant
title: Contrôle à distance
x-i18n:
    generated_at: "2026-06-28T00:12:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96ac4af5af9d3250f907818751120984106c3c7bcb1f3349d3f0678b4fefb120
    source_path: platforms/mac/remote.md
    workflow: 16
---

Ce flux permet à l’app macOS d’agir comme une télécommande complète pour un Gateway OpenClaw exécuté sur un autre hôte (ordinateur de bureau/serveur). L’app peut se connecter directement à des URL de Gateway LAN/Tailnet approuvées ou gérer un tunnel SSH lorsque le Gateway distant est limité à la boucle locale. Les contrôles d’intégrité, le transfert Voice Wake et le Chat Web réutilisent la même configuration distante depuis _Réglages → Général_.

## Modes

- **Local (ce Mac)** : tout s’exécute sur l’ordinateur portable. Aucun SSH n’est impliqué.
- **Distant via SSH (par défaut)** : les commandes OpenClaw sont exécutées sur l’hôte distant. L’app Mac ouvre une connexion SSH avec `-o BatchMode`, ainsi que l’identité/la clé choisie et un transfert de port local.
- **Distant direct (ws/wss)** : aucun tunnel SSH. L’app Mac se connecte directement à l’URL du Gateway (par exemple via le LAN, Tailscale, Tailscale Serve ou un proxy inverse HTTPS public).

## Transports distants

Le mode distant prend en charge deux transports :

- **Tunnel SSH** (par défaut) : utilise `ssh -N -L ...` pour transférer le port du Gateway vers localhost. Le Gateway verra l’IP du nœud comme `127.0.0.1`, car le tunnel utilise la boucle locale.
- **Direct (ws/wss)** : se connecte directement à l’URL du Gateway. Le Gateway voit l’IP réelle du client.

En mode tunnel SSH, les noms d’hôte LAN/tailnet découverts sont enregistrés comme
`gateway.remote.sshTarget`. L’app conserve `gateway.remote.url` sur le point de
terminaison du tunnel local, par exemple `ws://127.0.0.1:18789`, afin que la CLI, le Chat Web et
le service local d’hôte de nœud utilisent tous le même transport sûr en boucle locale.
Lorsque la découverte renvoie à la fois des IP Tailnet brutes et des noms d’hôte stables, l’app
préfère Tailscale MagicDNS ou les noms LAN afin que les connexions distantes résistent mieux
aux changements d’adresse.
Si le port du tunnel local diffère du port du Gateway distant, définissez
`gateway.remote.remotePort` sur le port de l’hôte distant.

L’automatisation du navigateur en mode distant appartient à l’hôte de nœud CLI, pas au
nœud natif de l’app macOS. L’app démarre le service d’hôte de nœud installé lorsque
possible ; si vous avez besoin de contrôler le navigateur depuis ce Mac, installez/démarrez-le avec
`openclaw node install ...` et `openclaw node start` (ou exécutez
`openclaw node run ...` au premier plan), puis ciblez ce nœud compatible avec le navigateur.

## Prérequis sur l’hôte distant

1. Installez Node + pnpm et construisez/installez la CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Assurez-vous que `openclaw` est dans PATH pour les shells non interactifs (créez un lien symbolique dans `/usr/local/bin` ou `/opt/homebrew/bin` si nécessaire).
3. Pour le transport SSH uniquement : ouvrez SSH avec une authentification par clé. Nous recommandons les IP **Tailscale** pour une accessibilité stable hors LAN.

## Configuration de l’app macOS

Pour préconfigurer l’app sans passer par le flux de bienvenue :

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Pour un Gateway déjà accessible sur un LAN ou Tailnet approuvé, ignorez entièrement SSH :

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Cette commande écrit la configuration distante, marque l’onboarding comme terminé et laisse l’app contrôler
le transport sélectionné à son démarrage.

1. Ouvrez _Réglages → Général_.
2. Sous **OpenClaw s’exécute**, choisissez **Distant** et définissez :
   - **Transport** : **Tunnel SSH** ou **Direct (ws/wss)**.
   - **Cible SSH** : `user@host` (`:port` facultatif).
     - Si le Gateway se trouve sur le même LAN et annonce Bonjour, choisissez-le dans la liste découverte pour renseigner automatiquement ce champ.
   - **URL du Gateway** (Direct uniquement) : `wss://gateway.example.ts.net` (ou `ws://...` pour local/LAN).
   - **Fichier d’identité** (avancé) : chemin vers votre clé.
   - **Racine du projet** (avancé) : chemin distant du checkout utilisé pour les commandes.
   - **Chemin de la CLI** (avancé) : chemin facultatif vers un point d’entrée/binaire `openclaw` exécutable (renseigné automatiquement lorsqu’il est annoncé).
3. Appuyez sur **Tester le distant**. Un succès indique que le `openclaw status --json` distant s’exécute correctement. Les échecs signifient généralement des problèmes de PATH/CLI ; le code de sortie 127 signifie que la CLI n’est pas trouvée à distance.
4. Les contrôles d’intégrité et le Chat Web passeront désormais automatiquement par le transport sélectionné.

## Chat Web

- **Tunnel SSH** : le Chat Web se connecte au Gateway via le port de contrôle WebSocket transféré (18789 par défaut).
- **Direct (ws/wss)** : le Chat Web se connecte directement à l’URL du Gateway configurée.
- Il n’existe plus de serveur HTTP WebChat séparé.

## Autorisations

- L’hôte distant a besoin des mêmes approbations TCC qu’en local (Automatisation, Accessibilité, Enregistrement de l’écran, Microphone, Reconnaissance vocale, Notifications). Exécutez l’onboarding sur cette machine pour les accorder une fois.
- Les nœuds annoncent leur état d’autorisation via `node.list` / `node.describe` afin que les agents sachent ce qui est disponible.

## Notes de sécurité

- Préférez les liaisons en boucle locale sur l’hôte distant et connectez-vous via SSH, Tailscale Serve ou une URL directe Tailnet/LAN approuvée.
- Le tunneling SSH utilise une vérification stricte de la clé d’hôte ; faites d’abord confiance à la clé d’hôte afin qu’elle existe dans `~/.ssh/known_hosts`.
- Si vous liez le Gateway à une interface qui n’est pas en boucle locale, exigez une authentification Gateway valide : jeton, mot de passe ou proxy inverse sensible à l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- Consultez [Sécurité](/fr/gateway/security) et [Tailscale](/fr/gateway/tailscale).

## Flux de connexion WhatsApp (distant)

- Exécutez `openclaw channels login --verbose` **sur l’hôte distant**. Scannez le QR avec WhatsApp sur votre téléphone.
- Relancez la connexion sur cet hôte si l’authentification expire. Le contrôle d’intégrité fera remonter les problèmes de liaison.

## Dépannage

- **exit 127 / introuvable** : `openclaw` n’est pas dans PATH pour les shells non connectés. Ajoutez-le à `/etc/paths`, à votre rc de shell, ou créez un lien symbolique dans `/usr/local/bin`/`/opt/homebrew/bin`.
- **Échec de la sonde d’intégrité** : vérifiez l’accessibilité SSH, PATH et que Baileys est connecté (`openclaw status --json`).
- **Chat Web bloqué** : confirmez que le Gateway s’exécute sur l’hôte distant et que le port transféré correspond au port WS du Gateway ; l’interface utilisateur nécessite une connexion WS saine.
- **L’IP du nœud affiche 127.0.0.1** : comportement attendu avec le tunnel SSH. Basculez **Transport** sur **Direct (ws/wss)** si vous voulez que le Gateway voie l’IP réelle du client.
- **Le tableau de bord fonctionne, mais les capacités du Mac sont hors ligne** : cela signifie que la connexion opérateur/contrôle de l’app est saine, mais que la connexion du nœud compagnon n’est pas connectée ou qu’il lui manque sa surface de commande. Ouvrez la section de l’appareil dans la barre de menus et vérifiez si le Mac est `paired · disconnected`. Pour les points de terminaison Tailscale Serve `wss://*.ts.net`, l’app détecte les anciens épinglages TLS de certificat feuille devenus obsolètes après une rotation de certificat, efface l’épinglage obsolète lorsque macOS fait confiance au nouveau certificat, puis réessaie automatiquement. Si le certificat n’est pas approuvé par le système ou si l’hôte n’est pas un nom Tailscale Serve, définissez `gateway.remote.tlsFingerprint` sur l’empreinte attendue du certificat, examinez le certificat ou basculez vers **Distant via SSH**.
- **Voice Wake** : les phrases de déclenchement sont transférées automatiquement en mode distant ; aucun redirecteur séparé n’est nécessaire.

## Sons de notification

Choisissez les sons par notification depuis des scripts avec `openclaw` et `node.invoke`, par exemple :

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Il n’existe plus de bascule globale « son par défaut » dans l’app ; les appelants choisissent un son (ou aucun) pour chaque requête.

## Associé

- [App macOS](/fr/platforms/macos)
- [Accès distant](/fr/gateway/remote)
