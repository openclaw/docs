---
read_when:
    - Vous souhaitez exécuter le Gateway sur un serveur Linux ou un VPS dans le cloud
    - Vous avez besoin d’un aperçu rapide des guides d’hébergement
    - Vous souhaitez optimiser de manière générique un serveur Linux pour OpenClaw
sidebarTitle: Linux Server
summary: Exécutez OpenClaw sur un serveur Linux ou un VPS cloud — choix du fournisseur, architecture et optimisation
title: Serveur Linux
x-i18n:
    generated_at: "2026-07-12T15:56:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

Exécutez le Gateway OpenClaw sur n’importe quel serveur Linux ou VPS cloud. Cette page vous aide à
choisir un fournisseur, explique le fonctionnement des déploiements dans le cloud et présente les réglages Linux
génériques applicables partout.

## Choisir un fournisseur

<CardGroup cols={2}>
  <Card title="Azure" href="/fr/install/azure">Machine virtuelle Linux</Card>
  <Card title="DigitalOcean" href="/fr/install/digitalocean">VPS payant simple</Card>
  <Card title="exe.dev" href="/fr/install/exe-dev">Machine virtuelle avec proxy HTTPS</Card>
  <Card title="Fly.io" href="/fr/install/fly">Machines Fly</Card>
  <Card title="GCP" href="/fr/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/fr/install/hetzner">Docker sur un VPS Hetzner</Card>
  <Card title="Hostinger" href="/fr/install/hostinger">VPS avec configuration en un clic</Card>
  <Card title="Northflank" href="/fr/install/northflank">Configuration en un clic dans le navigateur</Card>
  <Card title="Oracle Cloud" href="/fr/install/oracle">Niveau ARM toujours gratuit</Card>
  <Card title="Railway" href="/fr/install/railway">Configuration en un clic dans le navigateur</Card>
  <Card title="Raspberry Pi" href="/fr/install/raspberry-pi">Auto-hébergement sur ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / niveau gratuit)** fonctionne également très bien.
Un tutoriel vidéo de la communauté est disponible à l’adresse
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(ressource communautaire -- susceptible de devenir indisponible).

## Fonctionnement des configurations cloud

- Le **Gateway s’exécute sur le VPS** et gère l’état ainsi que l’espace de travail.
- Vous vous connectez depuis votre ordinateur portable ou votre téléphone via l’**interface de contrôle** ou **Tailscale/SSH**.
- Considérez le VPS comme la source de référence et **sauvegardez** régulièrement l’état et l’espace de travail.
- Configuration sécurisée par défaut : conservez le Gateway sur l’interface de bouclage et accédez-y via un tunnel SSH ou Tailscale Serve.
  Si vous l’associez à `lan` ou `tailnet`, le Gateway exige un secret partagé
  (`gateway.auth.token` ou `gateway.auth.password`), sauf si l’authentification est déléguée à un
  proxy de confiance.

Pages associées : [Accès distant au Gateway](/fr/gateway/remote), [Centre des plateformes](/fr/platforms).

## Sécuriser d’abord l’accès administrateur

Avant d’installer OpenClaw sur un VPS public, déterminez comment vous souhaitez administrer
la machine elle-même.

- Pour un accès administrateur limité au Tailnet : installez d’abord Tailscale, rattachez le VPS à votre
  tailnet, vérifiez une deuxième session SSH via l’adresse IP Tailscale ou le nom MagicDNS,
  puis restreignez l’accès SSH public.
- Sans Tailscale : appliquez un renforcement équivalent à votre accès SSH avant
  d’exposer davantage de services.
- Cette configuration est distincte de l’accès au Gateway. Vous pouvez toujours conserver OpenClaw lié à
  l’interface de bouclage et utiliser un tunnel SSH ou Tailscale Serve pour le tableau de bord.

Les options du Gateway propres à Tailscale sont présentées dans [Tailscale](/fr/gateway/tailscale).

## Agent d’entreprise partagé sur un VPS

L’exécution d’un agent unique pour une équipe constitue une configuration valide lorsque tous les utilisateurs appartiennent au
même périmètre de confiance et que l’agent est réservé à un usage professionnel.

- Utilisez un environnement d’exécution dédié (VPS/machine virtuelle/conteneur + comptes/utilisateur de système d’exploitation dédiés).
- Ne connectez pas cet environnement d’exécution à des comptes Apple/Google personnels ni à des profils personnels de navigateur ou de gestionnaire de mots de passe.
- Si les utilisateurs sont susceptibles d’agir de manière hostile les uns envers les autres, séparez-les par Gateway/hôte/utilisateur du système d’exploitation.

Détails du modèle de sécurité : [Sécurité](/fr/gateway/security).

## Utilisation de Nodes avec un VPS

Vous pouvez conserver le Gateway dans le cloud et associer des **Nodes** sur vos appareils locaux
(Mac/iOS/Android/sans interface graphique). Les Nodes fournissent des capacités locales d’écran, de caméra, de canevas et `system.run`,
tandis que le Gateway reste dans le cloud.

Documentation : [Nodes](/fr/nodes), [CLI Nodes](/fr/cli/nodes).

## Optimisation du démarrage pour les petites machines virtuelles et les hôtes ARM

Si les commandes CLI semblent lentes sur des machines virtuelles peu puissantes (ou des hôtes ARM), activez le cache de compilation des modules de Node :

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` améliore les temps de démarrage des commandes répétées ; la première exécution initialise le cache.
- `OPENCLAW_NO_RESPAWN=1` maintient les redémarrages courants du Gateway dans le même processus, ce qui évite les transferts de processus supplémentaires et simplifie le suivi des PID sur les petits hôtes.
- Pour les particularités du Raspberry Pi, consultez [Raspberry Pi](/fr/install/raspberry-pi).

### Liste de vérification pour l’optimisation de systemd (facultatif)

Pour les hôtes de machines virtuelles utilisant `systemd`, envisagez les réglages suivants :

- Variables d’environnement du service pour un chemin de démarrage stable : `OPENCLAW_NO_RESPAWN=1` et
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Comportement de redémarrage explicite : `Restart=always`, `RestartSec=2`, `TimeoutStartSec=90`
- Disques SSD pour les chemins d’état et de cache afin de réduire les pénalités de démarrage à froid liées aux E/S aléatoires.

La procédure standard `openclaw onboard --install-daemon` installe une unité utilisateur systemd ;
modifiez-la avec :

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

Si vous avez volontairement installé une unité système à la place, modifiez-la avec
`sudo systemctl edit openclaw-gateway.service`.

Comment les politiques `Restart=` facilitent la récupération automatisée :
[systemd peut automatiser la récupération des services](https://www.redhat.com/en/blog/systemd-automate-recovery).

Pour le comportement de manque de mémoire sous Linux, la sélection des processus enfants victimes et le diagnostic de `exit 137`,
consultez [Pression mémoire et arrêts pour manque de mémoire sous Linux](/fr/platforms/linux#memory-pressure-and-oom-kills).

## Pages associées

- [Vue d’ensemble de l’installation](/fr/install)
- [DigitalOcean](/fr/install/digitalocean)
- [Fly.io](/fr/install/fly)
- [Hetzner](/fr/install/hetzner)
