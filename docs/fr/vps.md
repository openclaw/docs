---
read_when:
    - Vous voulez exécuter la Gateway sur un serveur Linux ou un VPS cloud
    - Vous avez besoin d’un aperçu rapide des guides d’hébergement
    - Vous voulez une optimisation générique de serveur Linux pour OpenClaw
sidebarTitle: Linux Server
summary: Exécuter OpenClaw sur un serveur Linux ou un VPS cloud — sélecteur de fournisseur, architecture et optimisation
title: Serveur Linux
x-i18n:
    generated_at: "2026-04-23T07:12:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 759428cf20204207a5505a73c880aa776ddd0eabf969fc0dcf444fc8ce6991b2
    source_path: vps.md
    workflow: 15
---

# Serveur Linux

Exécutez la Gateway OpenClaw sur n’importe quel serveur Linux ou VPS cloud. Cette page vous aide à
choisir un fournisseur, explique le fonctionnement des déploiements cloud et couvre les optimisations Linux
génériques qui s’appliquent partout.

## Choisir un fournisseur

<CardGroup cols={2}>
  <Card title="Railway" href="/fr/install/railway">Déploiement en un clic, configuration dans le navigateur</Card>
  <Card title="Northflank" href="/fr/install/northflank">Déploiement en un clic, configuration dans le navigateur</Card>
  <Card title="DigitalOcean" href="/fr/install/digitalocean">VPS payant simple</Card>
  <Card title="Oracle Cloud" href="/fr/install/oracle">Niveau ARM Always Free</Card>
  <Card title="Fly.io" href="/fr/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/fr/install/hetzner">Docker sur VPS Hetzner</Card>
  <Card title="Hostinger" href="/fr/install/hostinger">VPS avec configuration en un clic</Card>
  <Card title="GCP" href="/fr/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/fr/install/azure">VM Linux</Card>
  <Card title="exe.dev" href="/fr/install/exe-dev">VM avec proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/fr/install/raspberry-pi">ARM auto-hébergé</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** fonctionne aussi très bien.
Une vidéo communautaire pas à pas est disponible sur
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(ressource communautaire -- peut devenir indisponible).

## Fonctionnement des configurations cloud

- La **Gateway s’exécute sur le VPS** et possède l’état + l’espace de travail.
- Vous vous connectez depuis votre ordinateur portable ou votre téléphone via la **Control UI** ou **Tailscale/SSH**.
- Traitez le VPS comme la source de vérité et effectuez régulièrement des **sauvegardes** de l’état + de l’espace de travail.
- Réglage sécurisé par défaut : gardez la Gateway sur loopback et accédez-y via un tunnel SSH ou Tailscale Serve.
  Si vous la liez à `lan` ou `tailnet`, exigez `gateway.auth.token` ou `gateway.auth.password`.

Pages associées : [Accès distant à la Gateway](/fr/gateway/remote), [Hub des plateformes](/fr/platforms).

## Agent d’entreprise partagé sur un VPS

Exécuter un seul agent pour une équipe est une configuration valable lorsque tous les utilisateurs se trouvent dans le même périmètre de confiance et que l’agent est strictement métier.

- Gardez-le sur un runtime dédié (VPS/VM/conteneur + utilisateur/comptes OS dédiés).
- Ne connectez pas ce runtime à des comptes Apple/Google personnels ni à des profils personnels de navigateur/gestionnaire de mots de passe.
- Si les utilisateurs sont adversaires les uns des autres, séparez par Gateway/hôte/utilisateur OS.

Détails du modèle de sécurité : [Sécurité](/fr/gateway/security).

## Utilisation de Nodes avec un VPS

Vous pouvez garder la Gateway dans le cloud et appairer des **Nodes** sur vos appareils locaux
(Mac/iOS/Android/headless). Les Nodes fournissent des capacités locales d’écran/caméra/canvas et `system.run`
tandis que la Gateway reste dans le cloud.

Documentation : [Nodes](/fr/nodes), [CLI Nodes](/fr/cli/nodes).

## Optimisation du démarrage pour petites VM et hôtes ARM

Si les commandes CLI semblent lentes sur des VM peu puissantes (ou des hôtes ARM), activez le cache de compilation de modules de Node :

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` améliore les temps de démarrage des commandes répétées.
- `OPENCLAW_NO_RESPAWN=1` évite la surcharge de démarrage supplémentaire due à un chemin d’auto-redémarrage.
- La première exécution d’une commande réchauffe le cache ; les exécutions suivantes sont plus rapides.
- Pour les spécificités Raspberry Pi, voir [Raspberry Pi](/fr/install/raspberry-pi).

### Liste de contrôle d’optimisation systemd (facultatif)

Pour les hôtes VM utilisant `systemd`, envisagez :

- Ajouter un env de service pour un chemin de démarrage stable :
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Garder un comportement de redémarrage explicite :
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Préférer des disques adossés à un SSD pour les chemins d’état/cache afin de réduire les pénalités de démarrage à froid liées aux E/S aléatoires.

Pour le chemin standard `openclaw onboard --install-daemon`, modifiez l’unité utilisateur :

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Si vous avez délibérément installé une unité système à la place, modifiez
`openclaw-gateway.service` via `sudo systemctl edit openclaw-gateway.service`.

Comment les politiques `Restart=` aident la récupération automatisée :
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

Pour le comportement OOM sous Linux, la sélection de victimes de processus enfants, et les diagnostics `exit 137`,
voir [Pression mémoire Linux et terminaisons OOM](/fr/platforms/linux#memory-pressure-and-oom-kills).
