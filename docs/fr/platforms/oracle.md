---
read_when:
    - Configuration d’OpenClaw sur Oracle Cloud
    - Recherche d’un hébergement VPS économique pour OpenClaw
    - Vous voulez OpenClaw 24 h/24 et 7 j/7 sur un petit serveur
summary: OpenClaw sur Oracle Cloud (ARM toujours gratuit)
title: Oracle Cloud (plateforme)
x-i18n:
    generated_at: "2026-04-30T07:36:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: d86af91bd924ad08535a21fa481ce551e8c19f1a6cd82b61c335da7a068a09f0
    source_path: platforms/oracle.md
    workflow: 16
---

# OpenClaw sur Oracle Cloud (OCI)

## Objectif

Exécuter un Gateway OpenClaw persistant sur le niveau ARM **Always Free** d’Oracle Cloud.

Le niveau gratuit d’Oracle peut très bien convenir à OpenClaw (surtout si vous avez déjà un compte OCI), mais il comporte des compromis :

- Architecture ARM (la plupart des éléments fonctionnent, mais certains binaires peuvent être réservés à x86)
- La capacité et l’inscription peuvent être capricieuses

## Comparaison des coûts (2026)

| Fournisseur  | Offre           | Caractéristiques       | Prix/mois | Notes                              |
| ------------ | --------------- | ---------------------- | --------- | ---------------------------------- |
| Oracle Cloud | Always Free ARM | jusqu’à 4 OCPU, 24GB RAM | $0      | ARM, capacité limitée              |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | ~ $4      | Option payante la moins chère      |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | $6        | Interface simple, bonne documentation |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | $6        | Nombreuses régions                 |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | $5        | Fait maintenant partie d’Akamai    |

---

## Prérequis

- Compte Oracle Cloud ([inscription](https://www.oracle.com/cloud/free/)) — consultez le [guide d’inscription de la communauté](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) si vous rencontrez des problèmes
- Compte Tailscale (gratuit sur [tailscale.com](https://tailscale.com))
- ~30 minutes

## 1) Créer une instance OCI

1. Connectez-vous à la [console Oracle Cloud](https://cloud.oracle.com/)
2. Accédez à **Compute → Instances → Create Instance**
3. Configurez :
   - **Nom :** `openclaw`
   - **Image :** Ubuntu 24.04 (aarch64)
   - **Shape :** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPUs :** 2 (ou jusqu’à 4)
   - **Mémoire :** 12 GB (ou jusqu’à 24 GB)
   - **Volume de démarrage :** 50 GB (jusqu’à 200 GB gratuits)
   - **Clé SSH :** Ajoutez votre clé publique
4. Cliquez sur **Create**
5. Notez l’adresse IP publique

**Astuce :** Si la création de l’instance échoue avec « Out of capacity », essayez un autre domaine de disponibilité ou réessayez plus tard. La capacité du niveau gratuit est limitée.

## 2) Se connecter et mettre à jour

```bash
# Connect via public IP
ssh ubuntu@YOUR_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Remarque :** `build-essential` est requis pour la compilation ARM de certaines dépendances.

## 3) Configurer l’utilisateur et le nom d’hôte

```bash
# Set hostname
sudo hostnamectl set-hostname openclaw

# Set password for ubuntu user
sudo passwd ubuntu

# Enable lingering (keeps user services running after logout)
sudo loginctl enable-linger ubuntu
```

## 4) Installer Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Cela active SSH Tailscale, afin que vous puissiez vous connecter avec `ssh openclaw` depuis n’importe quel appareil de votre tailnet — aucune IP publique n’est nécessaire.

Vérifiez :

```bash
tailscale status
```

**À partir de maintenant, connectez-vous via Tailscale :** `ssh ubuntu@openclaw` (ou utilisez l’IP Tailscale).

## 5) Installer OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

Lorsque l’invite « How do you want to hatch your bot? » s’affiche, sélectionnez **« Do this later »**.

> Remarque : Si vous rencontrez des problèmes de build natif ARM, commencez par les paquets système (par exemple `sudo apt install -y build-essential`) avant d’utiliser Homebrew.

## 6) Configurer le Gateway (loopback + authentification par jeton) et activer Tailscale Serve

Utilisez l’authentification par jeton par défaut. Elle est prévisible et évite d’avoir besoin de flags Control UI d’« authentification non sécurisée ».

```bash
# Keep the Gateway private on the VM
openclaw config set gateway.bind loopback

# Require auth for the Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Expose over Tailscale Serve (HTTPS + tailnet access)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` ici sert uniquement à la gestion par le proxy local Tailscale Serve des IP transférées et des clients locaux. Ce n’est **pas** `gateway.auth.mode: "trusted-proxy"`. Les routes de visualisation de diff conservent un comportement de fermeture en cas d’échec dans cette configuration : les requêtes brutes de visualiseur `127.0.0.1` sans en-têtes de proxy transférés peuvent renvoyer `Diff not found`. Utilisez `mode=file` / `mode=both` pour les pièces jointes, ou activez intentionnellement les visualiseurs distants et définissez `plugins.entries.diffs.config.viewerBaseUrl` (ou passez un `baseUrl` de proxy) si vous avez besoin de liens de visualiseur partageables.

## 7) Vérifier

```bash
# Check version
openclaw --version

# Check daemon status
systemctl --user status openclaw-gateway.service

# Check Tailscale Serve
tailscale serve status

# Test local response
curl http://localhost:18789
```

## 8) Verrouiller la sécurité du VCN

Maintenant que tout fonctionne, verrouillez le VCN pour bloquer tout le trafic sauf Tailscale. Le Virtual Cloud Network d’OCI agit comme un pare-feu à la périphérie du réseau — le trafic est bloqué avant d’atteindre votre instance.

1. Accédez à **Networking → Virtual Cloud Networks** dans la console OCI
2. Cliquez sur votre VCN → **Security Lists** → Default Security List
3. **Supprimez** toutes les règles d’entrée sauf :
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Conservez les règles de sortie par défaut (autoriser tout le trafic sortant)

Cela bloque SSH sur le port 22, HTTP, HTTPS et tout le reste à la périphérie du réseau. À partir de maintenant, vous ne pouvez vous connecter que via Tailscale.

---

## Accéder à la Control UI

Depuis n’importe quel appareil sur votre réseau Tailscale :

```
https://openclaw.<tailnet-name>.ts.net/
```

Remplacez `<tailnet-name>` par le nom de votre tailnet (visible dans `tailscale status`).

Aucun tunnel SSH n’est nécessaire. Tailscale fournit :

- Chiffrement HTTPS (certificats automatiques)
- Authentification via l’identité Tailscale
- Accès depuis n’importe quel appareil de votre tailnet (ordinateur portable, téléphone, etc.)

---

## Sécurité : VCN + Tailscale (base recommandée)

Avec le VCN verrouillé (seul UDP 41641 ouvert) et le Gateway lié au loopback, vous obtenez une défense en profondeur solide : le trafic public est bloqué à la périphérie du réseau, et l’accès administrateur passe par votre tailnet.

Cette configuration supprime souvent le _besoin_ de règles de pare-feu supplémentaires au niveau de l’hôte uniquement pour arrêter les tentatives de force brute SSH depuis Internet — mais vous devez tout de même maintenir l’OS à jour, exécuter `openclaw security audit` et vérifier que vous n’écoutez pas accidentellement sur des interfaces publiques.

### Déjà protégé

| Étape traditionnelle          | Nécessaire ?       | Pourquoi                                                                      |
| ----------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| Pare-feu UFW                  | Non                | Le VCN bloque avant que le trafic n’atteigne l’instance                       |
| fail2ban                      | Non                | Pas de force brute si le port 22 est bloqué au niveau du VCN                  |
| Durcissement de sshd          | Non                | Tailscale SSH n’utilise pas sshd                                              |
| Désactiver la connexion root  | Non                | Tailscale utilise l’identité Tailscale, pas les utilisateurs système          |
| Authentification par clé SSH uniquement | Non      | Tailscale authentifie via votre tailnet                                       |
| Durcissement IPv6             | Généralement non   | Dépend de vos paramètres VCN/sous-réseau ; vérifiez ce qui est réellement attribué/exposé |

### Toujours recommandé

- **Permissions des identifiants :** `chmod 700 ~/.openclaw`
- **Audit de sécurité :** `openclaw security audit`
- **Mises à jour système :** `sudo apt update && sudo apt upgrade` régulièrement
- **Surveiller Tailscale :** examinez les appareils dans la [console d’administration Tailscale](https://login.tailscale.com/admin)

### Vérifier la posture de sécurité

```bash
# Confirm no public ports listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely
sudo systemctl disable --now ssh
```

---

## Solution de repli : tunnel SSH

Si Tailscale Serve ne fonctionne pas, utilisez un tunnel SSH :

```bash
# From your local machine (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Ouvrez ensuite `http://localhost:18789`.

---

## Dépannage

### La création de l’instance échoue (« Out of capacity »)

Les instances ARM du niveau gratuit sont populaires. Essayez :

- Un autre domaine de disponibilité
- De réessayer pendant les heures creuses (tôt le matin)
- D’utiliser le filtre « Always Free » lors de la sélection du shape

### Tailscale ne se connecte pas

```bash
# Check status
sudo tailscale status

# Re-authenticate
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Le Gateway ne démarre pas

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Impossible d’accéder à la Control UI

```bash
# Verify Tailscale Serve is running
tailscale serve status

# Check gateway is listening
curl http://localhost:18789

# Restart if needed
systemctl --user restart openclaw-gateway.service
```

### Problèmes de binaires ARM

Certains outils peuvent ne pas avoir de builds ARM. Vérifiez :

```bash
uname -m  # Should show aarch64
```

La plupart des paquets npm fonctionnent correctement. Pour les binaires, recherchez des versions `linux-arm64` ou `aarch64`.

---

## Persistance

Tout l’état réside dans :

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` par agent, état des canaux/fournisseurs et données de session
- `~/.openclaw/workspace/` — espace de travail (SOUL.md, mémoire, artefacts)

Sauvegardez régulièrement :

```bash
openclaw backup create
```

---

## Connexe

- [Accès distant au Gateway](/fr/gateway/remote) — autres modèles d’accès distant
- [Intégration Tailscale](/fr/gateway/tailscale) — documentation Tailscale complète
- [Configuration du Gateway](/fr/gateway/configuration) — toutes les options de configuration
- [Guide DigitalOcean](/fr/install/digitalocean) — si vous voulez une option payante avec une inscription plus simple
- [Guide Hetzner](/fr/install/hetzner) — alternative basée sur Docker
