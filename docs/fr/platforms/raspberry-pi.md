---
read_when:
    - Configurer OpenClaw sur un Raspberry Pi
    - Exécuter OpenClaw sur des appareils ARM
    - Créer une IA personnelle économique toujours active
summary: OpenClaw sur Raspberry Pi (configuration auto-hébergée économique)
title: Raspberry Pi (plateforme)
x-i18n:
    generated_at: "2026-04-30T07:36:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5a277499ee8759f766984b3fd2097dbd55f2f34ba6169fdfc2eb9dd53d6bb7c
    source_path: platforms/raspberry-pi.md
    workflow: 16
---

# OpenClaw sur Raspberry Pi

## Objectif

Exécuter un Gateway OpenClaw persistant, toujours actif, sur un Raspberry Pi pour un coût unique de **~35-80 $** (sans frais mensuels).

Idéal pour :

- Assistant IA personnel 24/7
- Hub domotique
- Bot Telegram/WhatsApp basse consommation, toujours disponible

## Prérequis matériels

| Modèle de Pi    | RAM     | Fonctionne ? | Notes                                      |
| --------------- | ------- | ------------ | ------------------------------------------ |
| **Pi 5**        | 4GB/8GB | ✅ Meilleur  | Le plus rapide, recommandé                 |
| **Pi 4**        | 4GB     | ✅ Bon       | Le meilleur compromis pour la plupart des utilisateurs |
| **Pi 4**        | 2GB     | ✅ OK        | Fonctionne, ajoutez du swap                |
| **Pi 4**        | 1GB     | ⚠️ Limité    | Possible avec swap, configuration minimale |
| **Pi 3B+**      | 1GB     | ⚠️ Lent      | Fonctionne mais poussif                    |
| **Pi Zero 2 W** | 512MB   | ❌           | Non recommandé                             |

**Spécifications minimales :** 1GB de RAM, 1 cœur, 500MB de disque  
**Recommandé :** 2GB+ de RAM, OS 64 bits, carte SD 16GB+ (ou SSD USB)

## Ce dont vous avez besoin

- Raspberry Pi 4 ou 5 (2GB+ recommandé)
- Carte MicroSD (16GB+) ou SSD USB (meilleures performances)
- Alimentation (bloc d’alimentation officiel Pi recommandé)
- Connexion réseau (Ethernet ou WiFi)
- ~30 minutes

## 1) Flasher l’OS

Utilisez **Raspberry Pi OS Lite (64 bits)** — aucun bureau n’est nécessaire pour un serveur headless.

1. Téléchargez [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Choisissez l’OS : **Raspberry Pi OS Lite (64-bit)**
3. Cliquez sur l’icône d’engrenage (⚙️) pour préconfigurer :
   - Définir le nom d’hôte : `gateway-host`
   - Activer SSH
   - Définir le nom d’utilisateur/mot de passe
   - Configurer le WiFi (si vous n’utilisez pas Ethernet)
4. Flashez votre carte SD / lecteur USB
5. Insérez-le et démarrez le Pi

## 2) Se connecter via SSH

```bash
ssh user@gateway-host
# or use the IP address
ssh user@192.168.x.x
```

## 3) Configuration système

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y git curl build-essential

# Set timezone (important for cron/reminders)
sudo timedatectl set-timezone America/Chicago  # Change to your timezone
```

## 4) Installer Node.js 24 (ARM64)

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v24.x.x
npm --version
```

## 5) Ajouter du swap (important pour 2GB ou moins)

Le swap évite les plantages par manque de mémoire :

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize for low RAM (reduce swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) Installer OpenClaw

### Option A : installation standard (recommandée)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Option B : installation modifiable (pour bidouiller)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

L’installation modifiable vous donne un accès direct aux logs et au code — utile pour déboguer les problèmes propres à ARM.

## 7) Lancer l’onboarding

```bash
openclaw onboard --install-daemon
```

Suivez l’assistant :

1. **Mode Gateway :** local
2. **Authentification :** clés API recommandées (OAuth peut être capricieux sur un Pi headless)
3. **Canaux :** Telegram est le plus simple pour commencer
4. **Démon :** oui (systemd)

## 8) Vérifier l’installation

```bash
# Check status
openclaw status

# Check service (standard install = systemd user unit)
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 9) Accéder au tableau de bord OpenClaw

Remplacez `user@gateway-host` par le nom d’utilisateur et le nom d’hôte ou l’adresse IP de votre Pi.

Sur votre ordinateur, demandez au Pi d’afficher une nouvelle URL de tableau de bord :

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

La commande affiche `Dashboard URL:`. Selon la configuration de `gateway.auth.token`,
l’URL peut être un simple lien `http://127.0.0.1:18789/` ou un lien
incluant `#token=...`.

Dans un autre terminal sur votre ordinateur, créez le tunnel SSH :

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Ouvrez ensuite l’URL du tableau de bord affichée dans votre navigateur local.

Si l’interface demande une authentification par secret partagé, collez le jeton ou le mot de passe configuré
dans les paramètres de Control UI. Pour l’authentification par jeton, utilisez `gateway.auth.token` (ou
`OPENCLAW_GATEWAY_TOKEN`).

Pour un accès distant toujours actif, consultez [Tailscale](/fr/gateway/tailscale).

---

## Optimisations des performances

### Utiliser un SSD USB (énorme amélioration)

Les cartes SD sont lentes et s’usent. Un SSD USB améliore considérablement les performances :

```bash
# Check if booting from USB
lsblk
```

Consultez le [guide de démarrage USB pour Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) pour la configuration.

### Accélérer le démarrage de la CLI (cache de compilation des modules)

Sur les hôtes Pi moins puissants, activez le cache de compilation des modules de Node afin que les exécutions répétées de la CLI soient plus rapides :

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Notes :

- `NODE_COMPILE_CACHE` accélère les exécutions suivantes (`status`, `health`, `--help`).
- `/var/tmp` survit mieux aux redémarrages que `/tmp`.
- `OPENCLAW_NO_RESPAWN=1` évite le coût de démarrage supplémentaire lié au relancement automatique de la CLI.
- La première exécution prépare le cache ; les suivantes en profitent le plus.

### Réglage du démarrage systemd (facultatif)

Si ce Pi exécute principalement OpenClaw, ajoutez un drop-in de service pour réduire la
variabilité des redémarrages et stabiliser l’environnement de démarrage :

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

Appliquez ensuite :

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

Si possible, conservez l’état/le cache d’OpenClaw sur un stockage adossé à un SSD pour éviter les
goulots d’étranglement d’E/S aléatoires de la carte SD lors des démarrages à froid.

Si c’est un Pi headless, activez une fois le maintien de session afin que le service utilisateur survive
à la déconnexion :

```bash
sudo loginctl enable-linger "$(whoami)"
```

Comment les politiques `Restart=` facilitent la récupération automatisée :
[systemd peut automatiser la récupération des services](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Réduire l’utilisation mémoire

```bash
# Disable GPU memory allocation (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Disable Bluetooth if not needed
sudo systemctl disable bluetooth
```

### Surveiller les ressources

```bash
# Check memory
free -h

# Check CPU temperature
vcgencmd measure_temp

# Live monitoring
htop
```

---

## Notes propres à ARM

### Compatibilité binaire

La plupart des fonctionnalités d’OpenClaw fonctionnent sur ARM64, mais certains binaires externes peuvent nécessiter des versions ARM :

| Outil              | Statut ARM64 | Notes                               |
| ------------------ | ------------ | ----------------------------------- |
| Node.js            | ✅           | Fonctionne très bien                |
| WhatsApp (Baileys) | ✅           | JS pur, aucun problème              |
| Telegram           | ✅           | JS pur, aucun problème              |
| gog (CLI Gmail)    | ⚠️           | Vérifiez l’existence d’une version ARM |
| Chromium (navigateur) | ✅        | `sudo apt install chromium-browser` |

Si une skill échoue, vérifiez si son binaire dispose d’une version ARM. De nombreux outils Go/Rust en ont une ; certains non.

### 32 bits ou 64 bits

**Utilisez toujours un OS 64 bits.** Node.js et de nombreux outils modernes l’exigent. Vérifiez avec :

```bash
uname -m
# Should show: aarch64 (64-bit) not armv7l (32-bit)
```

---

## Configuration de modèle recommandée

Puisque le Pi sert uniquement de Gateway (les modèles s’exécutent dans le cloud), utilisez des modèles basés sur API :

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

**N’essayez pas d’exécuter des LLM locaux sur un Pi** — même les petits modèles sont trop lents. Laissez Claude/GPT faire le gros du travail.

---

## Démarrage automatique au boot

L’onboarding configure cela, mais pour vérifier :

```bash
# Check service is enabled
systemctl --user is-enabled openclaw-gateway.service

# Enable if not
systemctl --user enable openclaw-gateway.service

# Start on boot
systemctl --user start openclaw-gateway.service
```

---

## Dépannage

### Mémoire insuffisante (OOM)

```bash
# Check memory
free -h

# Add more swap (see Step 5)
# Or reduce services running on the Pi
```

### Performances lentes

- Utilisez un SSD USB au lieu d’une carte SD
- Désactivez les services inutilisés : `sudo systemctl disable cups bluetooth avahi-daemon`
- Vérifiez le bridage CPU : `vcgencmd get_throttled` (doit renvoyer `0x0`)

### Le service ne démarre pas

```bash
# Check logs
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Common fix: rebuild
cd ~/openclaw  # if using hackable install
npm run build
systemctl --user restart openclaw-gateway.service
```

### Problèmes de binaires ARM

Si une skill échoue avec « exec format error » :

1. Vérifiez si le binaire dispose d’une version ARM64
2. Essayez de compiler depuis les sources
3. Ou utilisez un conteneur Docker avec prise en charge ARM

### Coupures WiFi

Pour les Pi headless en WiFi :

```bash
# Disable WiFi power management
sudo iwconfig wlan0 power off

# Make permanent
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Comparaison des coûts

| Configuration  | Coût unique | Coût mensuel | Notes                     |
| -------------- | ----------- | ------------ | ------------------------- |
| **Pi 4 (2GB)** | ~45 $       | 0 $          | + électricité (~5 $/an)   |
| **Pi 4 (4GB)** | ~55 $       | 0 $          | Recommandé                |
| **Pi 5 (4GB)** | ~60 $       | 0 $          | Meilleures performances   |
| **Pi 5 (8GB)** | ~80 $       | 0 $          | Surdimensionné mais pérenne |
| DigitalOcean   | 0 $         | 6 $/mois     | 72 $/an                   |
| Hetzner        | 0 $         | 3,79 €/mois  | ~50 $/an                  |

**Seuil de rentabilité :** un Pi s’amortit en ~6 à 12 mois par rapport à un VPS cloud.

---

## Associés

- [Guide Linux](/fr/platforms/linux) — configuration Linux générale
- [Guide DigitalOcean](/fr/install/digitalocean) — alternative cloud
- [Guide Hetzner](/fr/install/hetzner) — configuration Docker
- [Tailscale](/fr/gateway/tailscale) — accès distant
- [Nodes](/fr/nodes) — associer votre ordinateur portable/téléphone au Gateway du Pi
