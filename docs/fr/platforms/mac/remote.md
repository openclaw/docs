---
read_when:
    - Configuration ou débogage du contrôle à distance d’un Mac
summary: Flux de l’application macOS pour contrôler un Gateway OpenClaw distant
title: Contrôle à distance
x-i18n:
    generated_at: "2026-07-12T02:48:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd3ee71838737c1b8cf67d91d00b135283f4284400c75309646e62921e8c3633
    source_path: platforms/mac/remote.md
    workflow: 16
---

Ce flux permet à l’app macOS de servir de télécommande complète pour un Gateway OpenClaw exécuté sur un autre hôte (ordinateur de bureau/serveur). L’app se connecte directement aux URL de Gateway approuvées du réseau local/Tailnet, ou gère un tunnel SSH lorsque le Gateway distant est accessible uniquement en local loopback. Les contrôles d’intégrité, le transfert de l’activation vocale et le chat web réutilisent la même configuration distante depuis _Settings -> General_.

## Modes

- **Local (ce Mac)** : tout s’exécute sur l’ordinateur portable ; SSH n’intervient pas.
- **Distant via SSH (par défaut)** : les commandes OpenClaw s’exécutent sur l’hôte distant. L’app ouvre une connexion SSH avec `-o BatchMode`, l’identité ou la clé choisie et une redirection de port locale.
- **Distant direct (ws/wss)** : aucun tunnel SSH ; l’app se connecte directement à l’URL du Gateway (réseau local, Tailscale, Tailscale Serve ou proxy inverse HTTPS public).

## Transports distants

- **Tunnel SSH** (par défaut) : utilise `ssh -N -L ...` pour rediriger le port du Gateway vers localhost. Le Gateway voit l’adresse IP du Node comme `127.0.0.1`, car le tunnel est en local loopback.
- **Direct (ws/wss)** : se connecte directement à l’URL du Gateway. Le Gateway voit l’adresse IP réelle du client.

L’app désactive la mutualisation des connexions SSH et le passage en arrière-plan après authentification pour ses propres processus SSH, afin de pouvoir surveiller et redémarrer le processus exact, même si l’alias sélectionné active `ControlMaster` ou `ForkAfterAuthentication`.

La vérification de la clé d’hôte SSH est stricte par défaut, car les identifiants du Gateway transitent par ce tunnel. Pour adopter le comportement d’approbation propre à un alias SSH géré, définissez `--ssh-host-key-policy openssh` avec `openclaw-mac configure-remote`, ou définissez directement `gateway.remote.sshHostKeyPolicy` sur `"openssh"`. Vérifiez l’alias ainsi que toute configuration `Host *` correspondante ou configuration système avant d’activer cette option. La modification de la cible SSH (dans l’app ou avec `configure-remote`) rétablit la politique `strict`, sauf si vous réactivez explicitement cette option pour la nouvelle cible.

En mode tunnel SSH, les noms d’hôte du réseau local/Tailnet détectés sont enregistrés dans `gateway.remote.sshTarget`. L’app conserve `gateway.remote.url` sur le point de terminaison du tunnel local (par exemple `ws://127.0.0.1:18789`), afin que la CLI, le chat web et le service local d’hébergement du Node utilisent tous le même transport local loopback. Lorsque la détection renvoie à la fois des adresses IP Tailnet brutes et des noms d’hôte stables, l’app privilégie les noms Tailscale MagicDNS ou du réseau local afin que les connexions résistent mieux aux changements d’adresse. Si le port du tunnel local diffère de celui du Gateway distant, définissez `gateway.remote.remotePort` sur le port de l’hôte distant.

En mode distant, l’automatisation du navigateur relève de l’hôte de Node de la CLI, et non du Node natif de l’app macOS. L’app démarre si possible le service d’hébergement du Node installé ; pour activer le contrôle du navigateur depuis ce Mac, installez-le et démarrez-le avec `openclaw node install ...` et `openclaw node start` (ou exécutez `openclaw node run ...` au premier plan), puis ciblez ce Node doté de fonctionnalités de navigateur.

## Prérequis sur l’hôte distant

1. Installez Node + pnpm, puis compilez et installez la CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Vérifiez que `openclaw` figure dans PATH pour les interpréteurs de commandes non interactifs (créez si nécessaire un lien symbolique dans `/usr/local/bin` ou `/opt/homebrew/bin`).
3. Pour le transport SSH : configurez l’authentification SSH par clé. Les adresses IP Tailscale sont recommandées pour garantir une accessibilité stable hors du réseau local.

## Configuration de l’app macOS

Pour préconfigurer l’app sans passer par le processus d’accueil, via SSH :

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Ou, pour un Gateway déjà accessible sur un réseau local ou un Tailnet approuvé, ignorez entièrement SSH :

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Les deux formes écrivent dans `~/.openclaw/openclaw.json`, marquent l’intégration comme terminée et permettent à l’app de prendre en charge le transport sélectionné au prochain démarrage. `--local-port`/`--remote-port` utilisent `18789` par défaut. Autres options : `--password`, `--identity <path>`, `--ssh-host-key-policy <strict|openssh>`, `--project-root <path>`, `--cli-path <path>`, `--json`. Exécutez `openclaw-mac configure-remote --help` pour obtenir la référence complète.

Pour effectuer plutôt la configuration depuis l’interface :

1. Ouvrez _Settings -> General_.
2. Sous **OpenClaw runs**, sélectionnez **Remote**, puis définissez :
   - **Transport** : **SSH tunnel** ou **Direct (ws/wss)**.
   - **SSH target** : `user@host` (`:port` facultatif). Si le Gateway se trouve sur le même réseau local et s’annonce via Bonjour, sélectionnez-le dans la liste des appareils détectés pour remplir automatiquement ce champ.
   - **Gateway URL** (mode Direct uniquement) : `wss://gateway.example.ts.net` (ou `ws://...` pour une connexion locale/sur le réseau local).
   - **Identity file** (avancé) : chemin d’accès à votre clé.
   - **Project root** (avancé) : chemin d’accès distant utilisé pour les commandes.
   - **CLI path** (avancé) : chemin facultatif vers un point d’entrée ou un binaire `openclaw` exécutable (rempli automatiquement lorsqu’il est annoncé).
3. Cliquez sur **Test remote**. Une réussite signifie que la commande distante `openclaw status --json` s’est exécutée correctement. Les échecs indiquent généralement des problèmes liés à PATH ou à la CLI ; le code de sortie 127 signifie que la CLI est introuvable sur l’hôte distant.
4. Les contrôles d’intégrité et le chat web utilisent désormais automatiquement le transport sélectionné.

## Chat web

- **Tunnel SSH** : se connecte au Gateway via le port de contrôle WebSocket redirigé (18789 par défaut).
- **Direct (ws/wss)** : se connecte directement à l’URL configurée du Gateway.
- Il n’existe aucun serveur HTTP distinct pour le chat web.

## Autorisations

- L’hôte distant nécessite les mêmes autorisations TCC que l’hôte local (automatisation, accessibilité, enregistrement de l’écran, microphone, reconnaissance vocale, notifications). Exécutez une fois l’intégration sur cette machine pour les accorder.
- Les Nodes annoncent l’état de leurs autorisations via `node.list` / `node.describe`, afin que les agents sachent ce qui est disponible.

## Remarques de sécurité

- Privilégiez les liaisons local loopback sur l’hôte distant et connectez-vous via SSH, Tailscale Serve ou une URL directe approuvée du Tailnet/réseau local.
- Par défaut, la tunnellisation SSH exige une clé d’hôte déjà approuvée. Approuvez d’abord la clé d’hôte (ajoutez-la au fichier des hôtes connus configuré), ou définissez explicitement `gateway.remote.sshHostKeyPolicy: "openssh"` pour un alias géré dont vous acceptez la politique d’approbation OpenSSH.
- Si vous liez le Gateway à une interface autre que local loopback, exigez une authentification valide du Gateway : jeton, mot de passe ou proxy inverse tenant compte de l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- Consultez [Sécurité](/fr/gateway/security) et [Tailscale](/fr/gateway/tailscale).

## Processus de connexion à WhatsApp (distant)

- Exécutez `openclaw channels login --channel whatsapp --verbose` **sur l’hôte distant**. Scannez le code QR avec WhatsApp sur votre téléphone.
- Relancez la connexion sur cet hôte si l’authentification expire. Le contrôle d’intégrité signale les problèmes de liaison.

## Dépannage

| Symptôme                                         | Cause / solution                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exit 127` / introuvable                         | `openclaw` ne figure pas dans le PATH des shells sans connexion. Ajoutez-le à `/etc/paths` ou au fichier rc de votre shell, ou créez un lien symbolique dans `/usr/local/bin`/`/opt/homebrew/bin`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Échec de la sonde d’état                         | Vérifiez l’accessibilité via SSH, le PATH et que Baileys (WhatsApp) est connecté (`openclaw status --json`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Chat Web bloqué                                  | Vérifiez que le Gateway s’exécute sur l’hôte distant et que le port transféré correspond au port WS du Gateway ; l’interface utilisateur nécessite une connexion WS fonctionnelle.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| L’adresse IP du Node affiche `127.0.0.1`         | Comportement attendu avec le tunnel SSH. Réglez **Transport** sur **Direct (ws/wss)** si vous souhaitez que le Gateway voie l’adresse IP réelle du client.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Le tableau de bord fonctionne, mais les fonctionnalités du Mac sont hors ligne | La connexion de commande/contrôle fonctionne, mais la connexion du Node compagnon n’est pas établie ou ne dispose pas de son interface de commandes. Ouvrez la section des appareils dans la barre des menus et vérifiez si le Mac est indiqué comme `paired · disconnected`. Pour les points de terminaison Tailscale Serve `wss://*.ts.net`, l’application détecte les anciennes empreintes obsolètes des certificats TLS finaux après la rotation du certificat, supprime l’empreinte obsolète dès que macOS approuve le nouveau certificat, puis réessaie automatiquement. Si le certificat n’est pas approuvé par le système ou si l’hôte n’est pas un nom Tailscale Serve, définissez `gateway.remote.tlsFingerprint` sur l’empreinte attendue du certificat, examinez le certificat ou passez à **Remote over SSH**. |
| Réveil vocal                                     | Les phrases de déclenchement sont transférées automatiquement en mode distant ; aucun dispositif de transfert distinct n’est nécessaire.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

## Sons de notification

Choisissez un son pour chaque notification depuis des scripts avec `openclaw nodes notify`, par exemple :

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

L’application ne propose aucun réglage global du son par défaut ; les appelants choisissent un son (ou aucun) pour chaque requête.

## Voir aussi

- [Application macOS](/fr/platforms/macos)
- [Accès à distance](/fr/gateway/remote)
