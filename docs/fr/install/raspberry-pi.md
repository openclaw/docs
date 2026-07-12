---
read_when:
    - Configuration d’OpenClaw sur un Raspberry Pi
    - Exécution d’OpenClaw sur des appareils ARM
    - Créer une IA personnelle économique et toujours active
summary: Hébergez OpenClaw sur un Raspberry Pi pour un auto-hébergement permanent
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-12T02:45:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

Exécutez un Gateway OpenClaw persistant et toujours actif sur un Raspberry Pi. Comme le Pi sert uniquement de Gateway (les modèles s’exécutent dans le cloud via une API), même un Pi modeste gère bien la charge de travail — le coût matériel habituel est de **35 à 80 $ en une seule fois**, sans frais mensuels.

## Compatibilité matérielle

| Modèle de Pi | RAM    | Fonctionne ? | Remarques                                         |
| ------------ | ------ | ------------ | ------------------------------------------------- |
| Pi 5         | 4/8 Go | Idéal        | Le plus rapide, recommandé.                       |
| Pi 4         | 4 Go   | Bien         | Le meilleur compromis pour la plupart des utilisateurs. |
| Pi 4         | 2 Go   | Correct      | Ajoutez de l’espace d’échange.                    |
| Pi 4         | 1 Go   | Limite       | Possible avec de l’espace d’échange et une configuration minimale. |
| Pi 3B+       | 1 Go   | Lent         | Fonctionne, mais avec lenteur.                    |
| Pi Zero 2 W  | 512 Mo | Non          | Non recommandé.                                   |

**Minimum :** 1 Go de RAM, 1 cœur, 500 Mo d’espace disque libre, système d’exploitation 64 bits.
**Recommandé :** au moins 2 Go de RAM, carte SD d’au moins 16 Go (ou SSD USB), Ethernet.

## Prérequis

- Raspberry Pi 4 ou 5 avec au moins 2 Go de RAM (4 Go recommandés)
- Carte microSD (au moins 16 Go) ou SSD USB (meilleures performances)
- Alimentation officielle pour Pi
- Connexion réseau (Ethernet ou Wi-Fi)
- Raspberry Pi OS 64 bits (obligatoire — n’utilisez pas la version 32 bits)
- Environ 30 minutes

## Configuration

<Steps>
  <Step title="Flasher le système d’exploitation">
    Utilisez **Raspberry Pi OS Lite (64-bit)** — aucun environnement de bureau n’est nécessaire pour un serveur sans écran.

    1. Téléchargez [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Choisissez le système d’exploitation : **Raspberry Pi OS Lite (64-bit)**.
    3. Dans la boîte de dialogue des paramètres, préconfigurez :
       - Nom d’hôte : `gateway-host`
       - Activez SSH
       - Définissez le nom d’utilisateur et le mot de passe
       - Configurez le Wi-Fi (si vous n’utilisez pas Ethernet)
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

    # Définir le fuseau horaire (important pour cron et les rappels)
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

  <Step title="Ajouter de l’espace d’échange (important avec 2 Go ou moins)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Réduire la propension à utiliser l’espace d’échange sur les appareils disposant de peu de RAM
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="Installer OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Exécuter la configuration initiale">
    ```bash
    openclaw onboard --install-daemon
    ```

    Suivez l’assistant. Les clés d’API sont recommandées plutôt qu’OAuth pour les appareils sans écran. Telegram est le canal le plus simple pour commencer.

  </Step>

  <Step title="Vérifier">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Accéder à l’interface de contrôle">
    Sur votre ordinateur, obtenez une URL du tableau de bord depuis le Pi :

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Créez ensuite un tunnel SSH dans un autre terminal :

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Ouvrez l’URL affichée dans votre navigateur local. Pour un accès distant permanent, consultez l’[intégration Tailscale](/fr/gateway/tailscale).

  </Step>
</Steps>

## Conseils de performance

**Utilisez un SSD USB** — les cartes SD sont lentes et s’usent. Un SSD USB améliore considérablement les performances et supporte davantage de cycles d’écriture ; utilisez-le pour `OPENCLAW_STATE_DIR` si vous conservez le système d’exploitation sur la carte SD. Consultez le [guide de démarrage USB du Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Activez le cache de compilation des modules** — cela accélère les appels répétés à la CLI sur les hôtes Pi moins puissants. `OPENCLAW_NO_RESPAWN=1` maintient les redémarrages courants du Gateway dans le même processus, évitant ainsi des transferts supplémentaires entre processus et simplifiant le suivi du PID sur les petits hôtes :

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Utilisez `/var/tmp`, et non `/tmp` — certaines distributions effacent `/tmp` au démarrage, ce qui supprime le cache préchauffé.

**Réduisez l’utilisation de la mémoire** — pour les installations sans écran, libérez de la mémoire GPU et désactivez les services inutilisés :

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**Surcharge systemd pour des redémarrages stables** — si ce Pi exécute principalement OpenClaw, ajoutez une surcharge au service :

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

Exécutez ensuite `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. Sur un Pi sans écran, activez également une fois la persistance de session afin que le service utilisateur reste actif après la déconnexion : `sudo loginctl enable-linger "$(whoami)"`.

## Configuration de modèle recommandée

Comme le Pi exécute uniquement le Gateway, utilisez des modèles d’API hébergés dans le cloud — n’exécutez pas de LLM locaux sur un Pi, car même les petits modèles sont trop lents pour être utiles :

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

## Remarques sur les binaires ARM

La plupart des fonctionnalités d’OpenClaw fonctionnent sur ARM64 sans modification (Node.js, Telegram, WhatsApp/Baileys, Chromium). Les binaires pour lesquels une version ARM est parfois indisponible sont généralement des outils CLI facultatifs en Go ou Rust fournis par des Skills. Vérifiez l’architecture avec `uname -m` (qui doit afficher `aarch64`), puis consultez la page des versions du binaire manquant pour rechercher des artefacts `linux-arm64` / `aarch64` avant de vous rabattre sur une compilation depuis le code source.

## Persistance et sauvegardes

L’état d’OpenClaw se trouve dans :

- `~/.openclaw/` — `openclaw.json`, fichiers `auth-profiles.json` propres à chaque agent, état des canaux et fournisseurs, sessions.
- `~/.openclaw/workspace/` — espace de travail de l’agent (SOUL.md, mémoire, artefacts).

Ces données persistent après les redémarrages et bénéficient de l’utilisation d’un SSD plutôt que d’une carte SD, tant pour les performances que pour la longévité. Créez un instantané portable avec :

```bash
openclaw backup create
```

## Dépannage

**Mémoire insuffisante** — vérifiez que l’espace d’échange est actif avec `free -h`. Désactivez les services inutilisés (`sudo systemctl disable cups bluetooth avahi-daemon`). Utilisez uniquement des modèles accessibles via API.

**Performances lentes** — utilisez un SSD USB plutôt qu’une carte SD. Vérifiez si le processeur est bridé avec `vcgencmd get_throttled` (la commande doit renvoyer `0x0`).

**Le service ne démarre pas** — consultez les journaux avec `journalctl --user -u openclaw-gateway.service --no-pager -n 100` et exécutez `openclaw doctor --non-interactive`. S’il s’agit d’un Pi sans écran, vérifiez également que la persistance de session est activée : `sudo loginctl enable-linger "$(whoami)"`.

**Problèmes de binaires ARM** — si une skill échoue avec « exec format error », vérifiez si le binaire dispose d’une version ARM64. Vérifiez l’architecture avec `uname -m` (qui doit afficher `aarch64`).

**Déconnexions Wi-Fi** — désactivez la gestion de l’alimentation Wi-Fi : `sudo iwconfig wlan0 power off`.

## Étapes suivantes

- [Canaux](/fr/channels) — connectez Telegram, WhatsApp, Discord et d’autres services
- [Configuration du Gateway](/fr/gateway/configuration) — toutes les options de configuration
- [Mise à jour](/fr/install/updating) — maintenez OpenClaw à jour

## Pages connexes

- [Présentation de l’installation](/fr/install)
- [Serveur Linux](/fr/vps)
- [Plateformes](/fr/platforms)
