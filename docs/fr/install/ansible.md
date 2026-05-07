---
read_when:
    - Vous souhaitez un déploiement automatisé de serveur avec renforcement de la sécurité
    - Vous avez besoin d’une configuration isolée par pare-feu avec un accès VPN
    - Vous déployez sur des serveurs Debian/Ubuntu distants
summary: Installation OpenClaw automatisée et renforcée avec Ansible, VPN Tailscale et isolation par pare-feu
title: Ansible
x-i18n:
    generated_at: "2026-05-07T13:20:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f7a2a0c575529fd45804e160299239339100ec37979a17162cee9537ddb4653
    source_path: install/ansible.md
    workflow: 16
---

Déployez OpenClaw sur des serveurs de production avec **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- un installateur automatisé doté d’une architecture axée sur la sécurité.

<Info>
Le dépôt [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) est la source de vérité pour le déploiement Ansible. Cette page en donne un aperçu rapide.
</Info>

## Prérequis

| Exigence    | Détails                                                   |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ ou Ubuntu 20.04+                               |
| **Accès**   | Privilèges root ou sudo                                   |
| **Réseau**  | Connexion Internet pour l’installation des paquets        |
| **Ansible** | 2.14+ (installé automatiquement par le script de démarrage rapide) |

## Ce que vous obtenez

- **Sécurité axée sur le pare-feu** -- isolation UFW + Docker (seuls SSH + Tailscale sont accessibles)
- **VPN Tailscale** -- accès distant sécurisé sans exposer publiquement les services
- **Docker** -- conteneurs sandbox isolés, liaisons uniquement sur localhost
- **Défense en profondeur** -- architecture de sécurité à 4 couches
- **Intégration Systemd** -- démarrage automatique au boot avec durcissement
- **Configuration en une commande** -- déploiement complet en quelques minutes

## Démarrage rapide

Installation en une commande :

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Ce qui est installé

Le playbook Ansible installe et configure :

1. **Tailscale** -- VPN maillé pour un accès distant sécurisé
2. **Pare-feu UFW** -- ports SSH + Tailscale uniquement
3. **Docker CE + Compose V2** -- pour le backend de sandbox d’agent par défaut
4. **Node.js 24 + pnpm** -- dépendances d’exécution (Node 22 LTS, actuellement `22.16+`, reste pris en charge)
5. **OpenClaw** -- hébergé sur l’hôte, non conteneurisé
6. **Service Systemd** -- démarrage automatique avec durcissement de sécurité

<Note>
Le Gateway s’exécute directement sur l’hôte (pas dans Docker). Le sandboxing des agents est
facultatif ; ce playbook installe Docker parce qu’il s’agit du backend de sandbox
par défaut. Consultez [Sandboxing](/fr/gateway/sandboxing) pour plus de détails et d’autres backends.
</Note>

## Configuration après installation

<Steps>
  <Step title="Basculer vers l’utilisateur openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Exécuter l’assistant d’onboarding">
    Le script de post-installation vous guide dans la configuration des paramètres OpenClaw.
  </Step>
  <Step title="Connecter les fournisseurs de messagerie">
    Connectez-vous à WhatsApp, Telegram, Discord ou Signal :
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Vérifier l’installation">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Se connecter à Tailscale">
    Rejoignez votre maillage VPN pour un accès distant sécurisé.
  </Step>
</Steps>

### Commandes rapides

```bash
# Vérifier l’état du service
sudo systemctl status openclaw

# Afficher les journaux en direct
sudo journalctl -u openclaw -f

# Redémarrer le gateway
sudo systemctl restart openclaw

# Connexion au fournisseur (à exécuter en tant qu’utilisateur openclaw)
sudo -i -u openclaw
openclaw channels login
```

## Architecture de sécurité

Le déploiement utilise un modèle de défense à 4 couches :

1. **Pare-feu (UFW)** -- seuls SSH (22) + Tailscale (41641/udp) sont exposés publiquement
2. **VPN (Tailscale)** -- gateway accessible uniquement via le maillage VPN
3. **Isolation Docker** -- la chaîne iptables DOCKER-USER empêche l’exposition de ports externes
4. **Durcissement Systemd** -- NoNewPrivileges, PrivateTmp, utilisateur non privilégié

Pour vérifier votre surface d’attaque externe :

```bash
nmap -p- YOUR_SERVER_IP
```

Seul le port 22 (SSH) devrait être ouvert. Tous les autres services (gateway, Docker) sont verrouillés.

Docker est installé pour les sandboxes d’agents (exécution d’outils isolée), pas pour exécuter le gateway lui-même. Consultez [Sandbox multi-agent et outils](/fr/tools/multi-agent-sandbox-tools) pour la configuration du sandbox.

## Installation manuelle

Si vous préférez un contrôle manuel plutôt que l’automatisation :

<Steps>
  <Step title="Installer les prérequis">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Cloner le dépôt">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Installer les collections Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Exécuter le playbook">
    ```bash
    ./run-playbook.sh
    ```

    Vous pouvez aussi l’exécuter directement, puis lancer manuellement le script de configuration ensuite :
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Puis exécuter : /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Mise à jour

L’installateur Ansible configure OpenClaw pour les mises à jour manuelles. Consultez [Mise à jour](/fr/install/updating) pour le flux de mise à jour standard.

Pour relancer le playbook Ansible (par exemple, pour des changements de configuration) :

```bash
cd openclaw-ansible
./run-playbook.sh
```

Cette opération est idempotente et peut être exécutée plusieurs fois en toute sécurité.

## Dépannage

<AccordionGroup>
  <Accordion title="Le pare-feu bloque ma connexion">
    - Assurez-vous d’abord de pouvoir accéder via le VPN Tailscale
    - L’accès SSH (port 22) est toujours autorisé
    - Le gateway est accessible uniquement via Tailscale par conception

  </Accordion>
  <Accordion title="Le service ne démarre pas">
    ```bash
    # Vérifier les journaux
    sudo journalctl -u openclaw -n 100

    # Vérifier les autorisations
    sudo ls -la /opt/openclaw

    # Tester le démarrage manuel
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Problèmes de sandbox Docker">
    ```bash
    # Vérifier que Docker est en cours d’exécution
    sudo systemctl status docker

    # Vérifier l’image de sandbox
    sudo docker images | grep openclaw-sandbox

    # Construire l’image de sandbox si elle manque (nécessite un checkout des sources)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # Pour les installations npm sans checkout des sources, consultez
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="La connexion au fournisseur échoue">
    Assurez-vous d’exécuter la commande en tant qu’utilisateur `openclaw` :
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Configuration avancée

Pour une architecture de sécurité détaillée et le dépannage, consultez le dépôt openclaw-ansible :

- [Architecture de sécurité](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Détails techniques](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Guide de dépannage](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Articles connexes

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- guide de déploiement complet
- [Docker](/fr/install/docker) -- configuration du gateway conteneurisé
- [Sandboxing](/fr/gateway/sandboxing) -- configuration du sandbox d’agent
- [Sandbox multi-agent et outils](/fr/tools/multi-agent-sandbox-tools) -- isolation par agent
