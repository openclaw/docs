---
read_when:
    - Configurer OpenClaw sur un Raspberry Pi
    - Exécuter OpenClaw sur des appareils ARM
    - Construire une IA personnelle économique et toujours active
summary: Hébergez OpenClaw sur un Raspberry Pi pour un auto-hébergement toujours actif
title: Raspberry Pi
x-i18n:
    generated_at: "2026-06-27T17:40:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9cd90b4cc70c8fe7eab2a0abadc0e2969c7dc1c09657a0819bc004280ec32ba3
    source_path: install/raspberry-pi.md
    workflow: 16
---

Exécutez un Gateway OpenClaw persistant et toujours actif sur un Raspberry Pi. Comme le Pi n’est que le Gateway (les modèles s’exécutent dans le cloud via API), même un Pi modeste gère bien la charge de travail — le coût matériel typique est de **35 à 80 $ en une seule fois**, sans frais mensuels.

## Compatibilité matérielle

| Modèle de Pi | RAM    | Fonctionne ? | Notes                                      |
| ------------ | ------ | ------------ | ------------------------------------------ |
| Pi 5         | 4/8 Go | Meilleur     | Le plus rapide, recommandé.                |
| Pi 4         | 4 Go   | Bon          | Meilleur compromis pour la plupart des utilisateurs. |
| Pi 4         | 2 Go   | OK           | Ajoutez de la swap.                        |
| Pi 4         | 1 Go   | Limité       | Possible avec swap, configuration minimale. |
| Pi 3B+       | 1 Go   | Lent         | Fonctionne, mais manque de réactivité.     |
| Pi Zero 2 W  | 512 Mo | Non          | Non recommandé.                            |

**Minimum :** 1 Go de RAM, 1 cœur, 500 Mo d’espace disque libre, OS 64 bits.
**Recommandé :** 2 Go+ de RAM, carte SD 16 Go+ (ou SSD USB), Ethernet.

## Prérequis

- Raspberry Pi 4 ou 5 avec 2 Go+ de RAM (4 Go recommandés)
- Carte microSD (16 Go+) ou SSD USB (meilleures performances)
- Alimentation officielle Pi
- Connexion réseau (Ethernet ou WiFi)
- Raspberry Pi OS 64 bits (requis -- n’utilisez pas la version 32 bits)
- Environ 30 minutes

## Configuration

<Steps>
  <Step title="Flasher l’OS">
    Utilisez **Raspberry Pi OS Lite (64-bit)** -- aucun bureau n’est nécessaire pour un serveur sans écran.

    1. Téléchargez [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Choisissez l’OS : **Raspberry Pi OS Lite (64-bit)**.
    3. Dans la boîte de dialogue des paramètres, préconfigurez :
       - Nom d’hôte : `gateway-host`
       - Activer SSH
       - Définir le nom d’utilisateur et le mot de passe
       - Configurer le WiFi (si vous n’utilisez pas Ethernet)
    4. Flashez votre carte SD ou votre disque USB, insérez-le, puis démarrez le Pi.

  </Step>

  <Step title="Se connecter via SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Mettre à jour le système">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Installer Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Ajouter de la swap (important pour 2 Go ou moins)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Reduce swappiness for low-RAM devices
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="Installer OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Lancer l’intégration">
    ```bash
    openclaw onboard --install-daemon
    ```

    Suivez l’assistant. Les clés API sont recommandées plutôt que OAuth pour les appareils sans écran. Telegram est le canal le plus simple pour commencer.

  </Step>

  <Step title="Vérifier">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Accéder à l’interface de contrôle">
    Sur votre ordinateur, obtenez une URL de tableau de bord depuis le Pi :

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Créez ensuite un tunnel SSH dans un autre terminal :

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Ouvrez l’URL affichée dans votre navigateur local. Pour un accès distant toujours actif, consultez [l’intégration Tailscale](/fr/gateway/tailscale).

  </Step>
</Steps>

## Conseils de performance

**Utilisez un SSD USB** -- Les cartes SD sont lentes et s’usent. Un SSD USB améliore nettement les performances. Consultez le [guide de démarrage USB du Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Activez le cache de compilation des modules** -- Accélère les invocations répétées de la CLI sur les hôtes Pi moins puissants :

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

`OPENCLAW_NO_RESPAWN=1` conserve les redémarrages courants du Gateway dans le même processus, ce qui évite des transferts de processus supplémentaires et simplifie le suivi du PID sur les petits hôtes.

**Réduisez l’utilisation de la mémoire** -- Pour les configurations sans écran, libérez la mémoire GPU et désactivez les services inutilisés :

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**Drop-in systemd pour des redémarrages stables** -- Si ce Pi exécute principalement OpenClaw, ajoutez un drop-in de service :

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

Exécutez ensuite `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. Sur un Pi sans écran, activez aussi lingering une fois afin que le service utilisateur survive à la déconnexion : `sudo loginctl enable-linger "$(whoami)"`.

## Configuration de modèle recommandée

Comme le Pi n’exécute que le Gateway, utilisez des modèles API hébergés dans le cloud :

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

N’exécutez pas de LLM locaux sur un Pi — même les petits modèles sont trop lents pour être utiles. Laissez Claude ou GPT effectuer le travail de modèle.

## Notes sur les binaires ARM

La plupart des fonctionnalités OpenClaw fonctionnent sur ARM64 sans modification (Node.js, Telegram, WhatsApp/Baileys, Chromium). Les binaires qui manquent parfois de builds ARM sont généralement des outils CLI Go/Rust facultatifs fournis par les Skills. Vérifiez la page de publication d’un binaire manquant pour des artefacts `linux-arm64` / `aarch64` avant de vous rabattre sur une compilation depuis la source.

## Persistance et sauvegardes

L’état OpenClaw se trouve sous :

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` par agent, état des canaux/fournisseurs, sessions.
- `~/.openclaw/workspace/` — espace de travail de l’agent (SOUL.md, mémoire, artefacts).

Ces données survivent aux redémarrages. Créez un instantané portable avec :

```bash
openclaw backup create
```

Si vous les conservez sur un SSD, les performances comme la longévité s’améliorent par rapport à une carte SD.

## Dépannage

**Mémoire insuffisante** -- Vérifiez que la swap est active avec `free -h`. Désactivez les services inutilisés (`sudo systemctl disable cups bluetooth avahi-daemon`). Utilisez uniquement des modèles basés sur API.

**Performances lentes** -- Utilisez un SSD USB au lieu d’une carte SD. Vérifiez l’étranglement CPU avec `vcgencmd get_throttled` (devrait retourner `0x0`).

**Le service ne démarre pas** -- Consultez les journaux avec `journalctl --user -u openclaw-gateway.service --no-pager -n 100` et exécutez `openclaw doctor --non-interactive`. S’il s’agit d’un Pi sans écran, vérifiez aussi que lingering est activé : `sudo loginctl enable-linger "$(whoami)"`.

**Problèmes de binaires ARM** -- Si un Skill échoue avec « exec format error », vérifiez si le binaire dispose d’un build ARM64. Vérifiez l’architecture avec `uname -m` (devrait afficher `aarch64`).

**Coupures WiFi** -- Désactivez la gestion de l’alimentation WiFi : `sudo iwconfig wlan0 power off`.

## Étapes suivantes

- [Canaux](/fr/channels) -- connectez Telegram, WhatsApp, Discord et plus encore
- [Configuration du Gateway](/fr/gateway/configuration) -- toutes les options de configuration
- [Mise à jour](/fr/install/updating) -- gardez OpenClaw à jour

## Liens associés

- [Vue d’ensemble de l’installation](/fr/install)
- [Serveur Linux](/fr/vps)
- [Plateformes](/fr/platforms)
