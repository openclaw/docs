---
read_when:
    - Vous souhaitez exécuter le Gateway sur un serveur Linux ou un VPS cloud
    - Vous avez besoin d’un aperçu rapide des guides d’hébergement
    - Vous souhaitez des réglages génériques de serveur Linux pour OpenClaw
sidebarTitle: Linux Server
summary: Exécuter OpenClaw sur un serveur Linux ou un VPS cloud — sélecteur de fournisseur, architecture et optimisation
title: Serveur Linux
x-i18n:
    generated_at: "2026-04-30T07:55:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e8535af0b6d14123acd46436c2e942008cdb8485ae680fb42e9b175723b2232
    source_path: vps.md
    workflow: 16
---

Exécutez le Gateway OpenClaw sur n'importe quel serveur Linux ou VPS cloud. Cette page vous aide à
choisir un fournisseur, explique le fonctionnement des déploiements cloud et couvre l’optimisation
Linux générique applicable partout.

## Choisir un fournisseur

<CardGroup cols={2}>
  <Card title="Railway" href="/fr/install/railway">Configuration en un clic dans le navigateur</Card>
  <Card title="Northflank" href="/fr/install/northflank">Configuration en un clic dans le navigateur</Card>
  <Card title="DigitalOcean" href="/fr/install/digitalocean">VPS payant simple</Card>
  <Card title="Oracle Cloud" href="/fr/install/oracle">Niveau ARM Always Free</Card>
  <Card title="Fly.io" href="/fr/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/fr/install/hetzner">Docker sur VPS Hetzner</Card>
  <Card title="Hostinger" href="/fr/install/hostinger">VPS avec configuration en un clic</Card>
  <Card title="GCP" href="/fr/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/fr/install/azure">VM Linux</Card>
  <Card title="exe.dev" href="/fr/install/exe-dev">VM avec proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/fr/install/raspberry-pi">Auto-hébergement ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / offre gratuite)** fonctionne également très bien.
Un tutoriel vidéo de la communauté est disponible sur
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(ressource communautaire -- peut devenir indisponible).

## Fonctionnement des configurations cloud

- Le **Gateway s’exécute sur le VPS** et possède l’état + l’espace de travail.
- Vous vous connectez depuis votre ordinateur portable ou votre téléphone via l’**interface utilisateur de contrôle** ou **Tailscale/SSH**.
- Traitez le VPS comme la source de vérité et **sauvegardez** régulièrement l’état + l’espace de travail.
- Valeur par défaut sécurisée : gardez le Gateway sur l’interface de bouclage et accédez-y via un tunnel SSH ou Tailscale Serve.
  Si vous l’associez à `lan` ou `tailnet`, exigez `gateway.auth.token` ou `gateway.auth.password`.

Pages connexes : [accès distant au Gateway](/fr/gateway/remote), [hub des plateformes](/fr/platforms).

## Sécuriser d’abord l’accès administrateur

Avant d’installer OpenClaw sur un VPS public, décidez comment vous voulez administrer
la machine elle-même.

- Si vous voulez un accès administrateur limité au tailnet, installez d’abord Tailscale, joignez le VPS
  à votre tailnet, vérifiez une deuxième session SSH via l’IP Tailscale ou le
  nom MagicDNS, puis restreignez le SSH public.
- Si vous n’utilisez pas Tailscale, appliquez le durcissement équivalent à votre chemin
  SSH avant d’exposer davantage de services.
- Cela est distinct de l’accès au Gateway. Vous pouvez toujours garder OpenClaw lié
  à l’interface de bouclage et utiliser un tunnel SSH ou Tailscale Serve pour le tableau de bord.

Les options Gateway propres à Tailscale se trouvent dans [Tailscale](/fr/gateway/tailscale).

## Agent d’entreprise partagé sur un VPS

Exécuter un seul agent pour une équipe est une configuration valide lorsque chaque utilisateur appartient au même périmètre de confiance et que l’agent est réservé à un usage professionnel.

- Gardez-le sur un environnement d’exécution dédié (VPS/VM/conteneur + utilisateur/comptes OS dédiés).
- Ne connectez pas cet environnement d’exécution à des comptes Apple/Google personnels ni à des profils personnels de navigateur/gestionnaire de mots de passe.
- Si les utilisateurs sont adversaires entre eux, séparez-les par gateway/hôte/utilisateur OS.

Détails du modèle de sécurité : [Sécurité](/fr/gateway/security).

## Utiliser des nœuds avec un VPS

Vous pouvez garder le Gateway dans le cloud et associer des **nœuds** sur vos appareils locaux
(Mac/iOS/Android/headless). Les nœuds fournissent les capacités locales écran/caméra/canvas et `system.run`
pendant que le Gateway reste dans le cloud.

Docs : [Nœuds](/fr/nodes), [CLI des nœuds](/fr/cli/nodes).

## Optimisation du démarrage pour les petites VM et les hôtes ARM

Si les commandes CLI semblent lentes sur des VM peu puissantes (ou des hôtes ARM), activez le cache de compilation des modules de Node :

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` améliore les temps de démarrage des commandes répétées.
- `OPENCLAW_NO_RESPAWN=1` évite un surcoût de démarrage supplémentaire dû à un chemin d’auto-relance.
- La première exécution d’une commande prépare le cache ; les exécutions suivantes sont plus rapides.
- Pour les spécificités de Raspberry Pi, consultez [Raspberry Pi](/fr/install/raspberry-pi).

### Liste de contrôle d’optimisation systemd (facultatif)

Pour les hôtes VM utilisant `systemd`, envisagez :

- Ajouter des variables d’environnement de service pour un chemin de démarrage stable :
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Garder le comportement de redémarrage explicite :
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
[systemd peut automatiser la récupération des services](https://www.redhat.com/en/blog/systemd-automate-recovery).

Pour le comportement OOM sous Linux, la sélection du processus enfant victime et les diagnostics `exit 137`,
consultez [pression mémoire Linux et arrêts OOM](/fr/platforms/linux#memory-pressure-and-oom-kills).

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [DigitalOcean](/fr/install/digitalocean)
- [Fly.io](/fr/install/fly)
- [Hetzner](/fr/install/hetzner)
