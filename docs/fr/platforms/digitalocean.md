---
read_when:
    - Configurer OpenClaw sur DigitalOcean
    - À la recherche d’un hébergement VPS bon marché pour OpenClaw
summary: OpenClaw sur DigitalOcean (option simple de VPS payant)
title: DigitalOcean (plateforme)
x-i18n:
    generated_at: "2026-04-30T07:35:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13df486b81590d6350f4b33f5460069fee21881631970d5f4ae34f6ce956407e
    source_path: platforms/digitalocean.md
    workflow: 16
---

# OpenClaw sur DigitalOcean

## Objectif

Exécuter un Gateway OpenClaw persistant sur DigitalOcean pour **6 $/mois** (ou 4 $/mois avec la tarification réservée).

Si vous voulez une option à 0 $/mois et que la configuration ARM + spécifique au fournisseur ne vous dérange pas, consultez le [guide Oracle Cloud](/fr/install/oracle).

## Comparaison des coûts (2026)

| Fournisseur  | Offre           | Caractéristiques       | Prix/mois   | Remarques                             |
| ------------ | --------------- | ---------------------- | ----------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM | jusqu’à 4 OCPU, 24 Go de RAM | 0 $         | ARM, capacité limitée / particularités à l’inscription |
| Hetzner      | CX22            | 2 vCPU, 4 Go de RAM    | 3,79 € (~4 $) | Option payante la moins chère         |
| DigitalOcean | Basic           | 1 vCPU, 1 Go de RAM    | 6 $         | Interface simple, bonne documentation |
| Vultr        | Cloud Compute   | 1 vCPU, 1 Go de RAM    | 6 $         | Nombreux emplacements                 |
| Linode       | Nanode          | 1 vCPU, 1 Go de RAM    | 5 $         | Fait maintenant partie d’Akamai       |

**Choisir un fournisseur :**

- DigitalOcean : expérience utilisateur la plus simple + configuration prévisible (ce guide)
- Hetzner : bon rapport prix/performances (voir le [guide Hetzner](/fr/install/hetzner))
- Oracle Cloud : peut coûter 0 $/mois, mais est plus capricieux et limité à ARM (voir le [guide Oracle](/fr/install/oracle))

---

## Prérequis

- Compte DigitalOcean ([inscription avec 200 $ de crédit gratuit](https://m.do.co/c/signup))
- Paire de clés SSH (ou volonté d’utiliser l’authentification par mot de passe)
- ~20 minutes

## 1) Créer un Droplet

<Warning>
Utilisez une image de base propre (Ubuntu 24.04 LTS). Évitez les images 1-click tierces du Marketplace, sauf si vous avez examiné leurs scripts de démarrage et leurs paramètres de pare-feu par défaut.
</Warning>

1. Connectez-vous à [DigitalOcean](https://cloud.digitalocean.com/)
2. Cliquez sur **Create → Droplets**
3. Choisissez :
   - **Région :** la plus proche de vous (ou de vos utilisateurs)
   - **Image :** Ubuntu 24.04 LTS
   - **Taille :** Basic → Regular → **6 $/mois** (1 vCPU, 1 Go de RAM, SSD 25 Go)
   - **Authentification :** clé SSH (recommandé) ou mot de passe
4. Cliquez sur **Create Droplet**
5. Notez l’adresse IP

## 2) Se connecter via SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) Installer OpenClaw

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4) Exécuter l’onboarding

```bash
openclaw onboard --install-daemon
```

L’assistant vous guidera dans :

- L’authentification au modèle (clés API ou OAuth)
- La configuration des canaux (Telegram, WhatsApp, Discord, etc.)
- Le jeton du Gateway (généré automatiquement)
- L’installation du daemon (systemd)

## 5) Vérifier le Gateway

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) Accéder au tableau de bord

Le Gateway se lie à loopback par défaut. Pour accéder à l’interface de contrôle :

**Option A : tunnel SSH (recommandé)**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**Option B : Tailscale Serve (HTTPS, loopback uniquement)**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

Ouvrez : `https://<magicdns>/`

Remarques :

- Serve garde le Gateway en loopback uniquement et authentifie le trafic de l’interface de contrôle/WebSocket via les en-têtes d’identité Tailscale (l’authentification sans jeton suppose un hôte Gateway de confiance ; les API HTTP n’utilisent pas ces en-têtes Tailscale et suivent plutôt le mode d’authentification HTTP normal du gateway).
- Pour exiger plutôt des identifiants explicites avec secret partagé, définissez `gateway.auth.allowTailscale: false` et utilisez `gateway.auth.mode: "token"` ou `"password"`.

**Option C : liaison Tailnet (sans Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Ouvrez : `http://<tailscale-ip>:18789` (jeton requis).

## 7) Connecter vos canaux

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

Consultez [Canaux](/fr/channels) pour les autres fournisseurs.

---

## Optimisations pour 1 Go de RAM

Le droplet à 6 $ ne dispose que de 1 Go de RAM. Pour assurer un fonctionnement fluide :

### Ajouter du swap (recommandé)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Utiliser un modèle plus léger

Si vous rencontrez des erreurs OOM, envisagez :

- D’utiliser des modèles basés sur API (Claude, GPT) plutôt que des modèles locaux
- De définir `agents.defaults.model.primary` sur un modèle plus petit

### Surveiller la mémoire

```bash
free -h
htop
```

---

## Persistance

Tout l’état se trouve dans :

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` par agent, état des canaux/fournisseurs et données de session
- `~/.openclaw/workspace/` — espace de travail (SOUL.md, mémoire, etc.)

Ces éléments survivent aux redémarrages. Sauvegardez-les périodiquement :

```bash
openclaw backup create
```

---

## Alternative gratuite Oracle Cloud

Oracle Cloud propose des instances ARM **Always Free** nettement plus puissantes que n’importe quelle option payante ici — pour 0 $/mois.

| Ce que vous obtenez | Caractéristiques       |
| ------------------- | ---------------------- |
| **4 OCPU**          | ARM Ampere A1          |
| **24 Go de RAM**    | Largement suffisant    |
| **200 Go de stockage** | Volume bloc          |
| **Gratuit pour toujours** | Aucun débit sur carte bancaire |

**Mises en garde :**

- L’inscription peut être capricieuse (réessayez si elle échoue)
- Architecture ARM — la plupart des choses fonctionnent, mais certains binaires nécessitent des builds ARM

Pour le guide de configuration complet, consultez [Oracle Cloud](/fr/install/oracle). Pour des conseils d’inscription et le dépannage du processus d’inscription, consultez ce [guide communautaire](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

---

## Dépannage

### Le Gateway ne démarre pas

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### Port déjà utilisé

```bash
lsof -i :18789
kill <PID>
```

### Mémoire insuffisante

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## Connexe

- [Guide Hetzner](/fr/install/hetzner) — moins cher, plus puissant
- [Installation Docker](/fr/install/docker) — configuration conteneurisée
- [Tailscale](/fr/gateway/tailscale) — accès distant sécurisé
- [Configuration](/fr/gateway/configuration) — référence complète de la configuration
