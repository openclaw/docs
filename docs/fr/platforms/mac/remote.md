---
read_when:
    - Configuration ou débogage du contrôle à distance d’un Mac
summary: Flux de l’application macOS pour contrôler un Gateway OpenClaw distant
title: Contrôle à distance
x-i18n:
    generated_at: "2026-07-12T15:30:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bd3ee71838737c1b8cf67d91d00b135283f4284400c75309646e62921e8c3633
    source_path: platforms/mac/remote.md
    workflow: 16
---

Ce flux permet à l’app macOS de servir de télécommande complète pour un Gateway OpenClaw exécuté sur un autre hôte (ordinateur de bureau/serveur). L’app se connecte directement aux URL de Gateway approuvées sur le LAN/Tailnet, ou gère un tunnel SSH lorsque le Gateway distant écoute uniquement sur l’interface de bouclage. Les vérifications d’état, le transfert de l’activation vocale et le chat Web réutilisent la même configuration distante depuis _Settings -> General_.

## Modes

- **Local (ce Mac)** : tout s’exécute sur l’ordinateur portable ; aucun accès SSH n’est utilisé.
- **À distance via SSH (par défaut)** : les commandes OpenClaw s’exécutent sur l’hôte distant. L’app ouvre une connexion SSH avec `-o BatchMode`, l’identité/la clé choisie et une redirection de port local.
- **Connexion distante directe (ws/wss)** : aucun tunnel SSH ; l’app se connecte directement à l’URL du Gateway (LAN, Tailscale, Tailscale Serve ou proxy inverse HTTPS public).

## Transports distants

- **Tunnel SSH** (par défaut) : utilise `ssh -N -L ...` pour rediriger le port du Gateway vers localhost. Le Gateway voit l’adresse IP du Node comme `127.0.0.1`, car le tunnel utilise l’interface de bouclage.
- **Direct (ws/wss)** : se connecte directement à l’URL du Gateway. Le Gateway voit l’adresse IP réelle du client.

L’app désactive le multiplexage des connexions SSH et le passage en arrière-plan après authentification pour ses propres processus SSH afin de pouvoir surveiller et redémarrer le processus exact, même si l’alias sélectionné active `ControlMaster` ou `ForkAfterAuthentication`.

La vérification de la clé d’hôte SSH est stricte par défaut, car les identifiants du Gateway transitent par ce tunnel. Pour utiliser le comportement d’approbation propre à un alias SSH géré, définissez `--ssh-host-key-policy openssh` via `openclaw-mac configure-remote`, ou définissez directement `gateway.remote.sshHostKeyPolicy` sur `"openssh"`. Vérifiez l’alias ainsi que toute configuration `Host *` correspondante ou toute configuration système avant d’activer cette option. La modification de la cible SSH (dans l’app ou via `configure-remote`) rétablit la stratégie `strict`, sauf si vous réactivez explicitement cette option pour la nouvelle cible.

En mode tunnel SSH, les noms d’hôte LAN/Tailnet découverts sont enregistrés dans `gateway.remote.sshTarget`. L’app conserve `gateway.remote.url` sur le point de terminaison du tunnel local (par exemple `ws://127.0.0.1:18789`) afin que la CLI, le chat Web et le service local d’hébergement du Node utilisent tous le même transport par interface de bouclage. Lorsque la découverte renvoie à la fois des adresses IP Tailnet brutes et des noms d’hôte stables, l’app privilégie les noms Tailscale MagicDNS ou LAN afin que les connexions résistent mieux aux changements d’adresse. Si le port du tunnel local diffère de celui du Gateway distant, définissez `gateway.remote.remotePort` sur le port de l’hôte distant.

En mode distant, l’automatisation du navigateur est gérée par l’hôte Node de la CLI, et non par le Node natif de l’app macOS. L’app démarre le service d’hébergement du Node installé lorsque cela est possible ; pour activer le contrôle du navigateur depuis ce Mac, installez/démarrez-le avec `openclaw node install ...` et `openclaw node start` (ou exécutez `openclaw node run ...` au premier plan), puis ciblez ce Node doté de fonctions de navigation.

## Prérequis sur l’hôte distant

1. Installez Node + pnpm et compilez/installez la CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Vérifiez que `openclaw` figure dans le PATH des shells non interactifs (créez si nécessaire un lien symbolique dans `/usr/local/bin` ou `/opt/homebrew/bin`).
3. Pour le transport SSH : configurez l’authentification SSH par clé. Les adresses IP Tailscale sont recommandées pour assurer une accessibilité stable hors du LAN.

## Configuration de l’app macOS

Pour préconfigurer l’app sans passer par le processus d’accueil, via SSH :

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Ou, pour un Gateway déjà accessible sur un LAN ou Tailnet approuvé, n’utilisez pas SSH :

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Les deux formes écrivent dans `~/.openclaw/openclaw.json`, marquent l’intégration comme terminée et permettent à l’app de gérer le transport sélectionné au prochain démarrage. La valeur par défaut de `--local-port`/`--remote-port` est `18789`. Autres options : `--password`, `--identity <path>`, `--ssh-host-key-policy <strict|openssh>`, `--project-root <path>`, `--cli-path <path>`, `--json`. Exécutez `openclaw-mac configure-remote --help` pour consulter la référence complète.

Pour effectuer la configuration depuis l’interface utilisateur :

1. Ouvrez _Settings -> General_.
2. Sous **OpenClaw runs**, sélectionnez **Remote**, puis définissez :
   - **Transport** : **SSH tunnel** ou **Direct (ws/wss)**.
   - **SSH target** : `user@host` (`:port` facultatif). Si le Gateway se trouve sur le même LAN et s’annonce via Bonjour, sélectionnez-le dans la liste des appareils détectés pour remplir automatiquement ce champ.
   - **Gateway URL** (uniquement en mode Direct) : `wss://gateway.example.ts.net` (ou `ws://...` pour une connexion locale/LAN).
   - **Identity file** (avancé) : chemin vers votre clé.
   - **Project root** (avancé) : chemin distant du dépôt utilisé pour les commandes.
   - **CLI path** (avancé) : chemin facultatif vers un point d’entrée/binaire `openclaw` exécutable (rempli automatiquement lorsqu’il est annoncé).
3. Cliquez sur **Test remote**. Une réussite signifie que la commande distante `openclaw status --json` s’est correctement exécutée. Les échecs indiquent généralement des problèmes de PATH/CLI ; le code de sortie 127 signifie que la CLI n’a pas été trouvée à distance.
4. Les vérifications d’état et le chat Web utilisent désormais automatiquement le transport sélectionné.

## Chat Web

- **Tunnel SSH** : se connecte au Gateway via le port de contrôle WebSocket redirigé (18789 par défaut).
- **Direct (ws/wss)** : se connecte directement à l’URL du Gateway configurée.
- Il n’existe aucun serveur HTTP distinct pour le chat Web.

## Autorisations

- L’hôte distant nécessite les mêmes autorisations TCC que l’hôte local (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Exécutez une fois le processus d’intégration sur cette machine pour les accorder.
- Les Nodes annoncent l’état de leurs autorisations via `node.list` / `node.describe` afin que les agents sachent ce qui est disponible.

## Notes de sécurité

- Privilégiez les liaisons avec l’interface de bouclage sur l’hôte distant et connectez-vous via SSH, Tailscale Serve ou une URL directe Tailnet/LAN approuvée.
- Par défaut, le tunneling SSH nécessite une clé d’hôte déjà approuvée. Approuvez d’abord la clé d’hôte (ajoutez-la au fichier known-hosts configuré), ou définissez explicitement `gateway.remote.sshHostKeyPolicy: "openssh"` pour un alias géré dont vous acceptez la stratégie d’approbation OpenSSH.
- Si vous liez le Gateway à une interface autre que celle de bouclage, exigez une authentification valide du Gateway : jeton, mot de passe ou proxy inverse tenant compte de l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- Consultez [Sécurité](/fr/gateway/security) et [Tailscale](/fr/gateway/tailscale).

## Processus de connexion à WhatsApp (à distance)

- Exécutez `openclaw channels login --channel whatsapp --verbose` **sur l’hôte distant**. Scannez le code QR avec WhatsApp sur votre téléphone.
- Réexécutez la connexion sur cet hôte si l’authentification expire. La vérification d’état signale les problèmes de liaison.

## Dépannage

| Symptôme                                         | Cause / solution                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exit 127` / introuvable                         | `openclaw` ne figure pas dans le PATH des shells sans connexion. Ajoutez-le à `/etc/paths` ou au fichier rc de votre shell, ou créez un lien symbolique dans `/usr/local/bin`/`/opt/homebrew/bin`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Échec de la sonde d’intégrité                    | Vérifiez l’accessibilité SSH, le PATH et que Baileys (WhatsApp) est connecté (`openclaw status --json`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Web Chat bloqué                                  | Vérifiez que le Gateway s’exécute sur l’hôte distant et que le port transféré correspond au port WS du Gateway ; l’interface utilisateur nécessite une connexion WS fonctionnelle.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| L’adresse IP du Node indique `127.0.0.1`         | Comportement attendu avec le tunnel SSH. Définissez **Transport** sur **Direct (ws/wss)** si vous souhaitez que le Gateway voie l’adresse IP réelle du client.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Le tableau de bord fonctionne, mais les fonctionnalités du Mac sont hors ligne | La connexion d’exploitation/de contrôle fonctionne correctement, mais la connexion du Node compagnon n’est pas établie ou sa surface de commandes est absente. Ouvrez la section des appareils dans la barre des menus et vérifiez si le Mac est `paired · disconnected`. Pour les points de terminaison Tailscale Serve `wss://*.ts.net`, l’application détecte les anciennes empreintes obsolètes du certificat TLS terminal après la rotation du certificat, efface une fois l’empreinte obsolète lorsque macOS approuve le nouveau certificat, puis réessaie automatiquement. Si le certificat n’est pas approuvé par le système ou si l’hôte n’est pas un nom Tailscale Serve, définissez `gateway.remote.tlsFingerprint` sur l’empreinte attendue du certificat, examinez le certificat ou passez à **Remote over SSH**. |
| Réveil vocal                                     | Les phrases de déclenchement sont transférées automatiquement en mode distant ; aucun dispositif de transfert distinct n’est nécessaire.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

## Sons de notification

Choisissez un son pour chaque notification dans les scripts avec `openclaw nodes notify`, par exemple :

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Gateway distant prêt" --sound Glass
```

L’application ne propose aucun réglage global du son par défaut ; les appelants choisissent un son (ou aucun) pour chaque requête.

## Pages connexes

- [Application macOS](/fr/platforms/macos)
- [Accès distant](/fr/gateway/remote)
