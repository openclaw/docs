---
read_when:
    - Vous souhaitez un déploiement automatisé du serveur avec renforcement de la sécurité
    - Vous avez besoin d’une configuration isolée par pare-feu avec accès VPN
    - Vous effectuez un déploiement vers des serveurs Debian/Ubuntu distants
summary: Installation automatisée et renforcée d’OpenClaw avec Ansible, VPN Tailscale et isolation par pare-feu
title: Ansible
x-i18n:
    generated_at: "2026-04-21T07:01:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2a23374c971a1f3163dd18c32e553ebaad55b2542c1f25f49bcc9ae464d679e8
    source_path: install/ansible.md
    workflow: 15
---

# Installation Ansible

Déployez OpenClaw sur des serveurs de production avec **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- un installateur automatisé avec une architecture orientée sécurité.

<Info>
Le dépôt [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) est la source de vérité pour le déploiement Ansible. Cette page est un aperçu rapide.
</Info>

## Prérequis

| Exigence | Détails                                                   |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ ou Ubuntu 20.04+                               |
| **Accès**  | Privilèges root ou sudo                                   |
| **Réseau** | Connexion Internet pour l’installation des paquets              |
| **Ansible** | 2.14+ (installé automatiquement par le script de démarrage rapide) |

## Ce que vous obtenez

- **Sécurité orientée pare-feu** -- isolation UFW + Docker (seuls SSH + Tailscale sont accessibles)
- **VPN Tailscale** -- accès distant sécurisé sans exposer publiquement les services
- **Docker** -- conteneurs sandbox isolés, liaisons localhost uniquement
- **Défense en profondeur** -- architecture de sécurité à 4 couches
- **Intégration systemd** -- démarrage automatique au boot avec renforcement
- **Configuration en une commande** -- déploiement complet en quelques minutes

## Démarrage rapide

Installation en une commande :

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Ce qui est installé

Le playbook Ansible installe et configure :

1. **Tailscale** -- VPN maillé pour un accès distant sécurisé
2. **Pare-feu UFW** -- ports SSH + Tailscale uniquement
3. **Docker CE + Compose V2** -- pour le backend sandbox par défaut de l’agent
4. **Node.js 24 + pnpm** -- dépendances runtime (Node 22 LTS, actuellement `22.14+`, reste pris en charge)
5. **OpenClaw** -- basé sur l’hôte, non conteneurisé
6. **Service systemd** -- démarrage automatique avec renforcement de la sécurité

<Note>
La gateway s’exécute directement sur l’hôte (pas dans Docker). Le sandboxing des agents est
facultatif ; ce playbook installe Docker parce que c’est le backend sandbox
par défaut. Voir [Sandboxing](/fr/gateway/sandboxing) pour les détails et les autres backends.
</Note>

## Configuration après installation

<Steps>
  <Step title="Passer à l’utilisateur openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Exécuter l’assistant d’onboarding">
    Le script post-installation vous guide dans la configuration des paramètres OpenClaw.
  </Step>
  <Step title="Connecter les providers de messagerie">
    Connectez-vous à WhatsApp, Telegram, Discord ou Signal :
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

# Afficher les logs en direct
sudo journalctl -u openclaw -f

# Redémarrer la gateway
sudo systemctl restart openclaw

# Connexion provider (à exécuter comme utilisateur openclaw)
sudo -i -u openclaw
openclaw channels login
```

## Architecture de sécurité

Le déploiement utilise un modèle de défense à 4 couches :

1. **Pare-feu (UFW)** -- seuls SSH (22) + Tailscale (41641/udp) sont exposés publiquement
2. **VPN (Tailscale)** -- gateway accessible uniquement via le maillage VPN
3. **Isolation Docker** -- la chaîne iptables DOCKER-USER empêche l’exposition de ports externes
4. **Renforcement systemd** -- NoNewPrivileges, PrivateTmp, utilisateur non privilégié

Pour vérifier votre surface d’attaque externe :

```bash
nmap -p- YOUR_SERVER_IP
```

Seul le port 22 (SSH) doit être ouvert. Tous les autres services (gateway, Docker) sont verrouillés.

Docker est installé pour les sandbox des agents (exécution isolée des outils), et non pour exécuter la gateway elle-même. Voir [Multi-Agent Sandbox and Tools](/fr/tools/multi-agent-sandbox-tools) pour la configuration du sandbox.

## Installation manuelle

Si vous préférez garder le contrôle manuel sur l’automatisation :

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

    Vous pouvez aussi l’exécuter directement, puis lancer manuellement le script de configuration ensuite :
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Ensuite exécutez : /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Mise à jour

L’installateur Ansible configure OpenClaw pour des mises à jour manuelles. Voir [Updating](/fr/install/updating) pour le flux de mise à jour standard.

Pour réexécuter le playbook Ansible (par exemple pour des changements de configuration) :

```bash
cd openclaw-ansible
./run-playbook.sh
```

Cette opération est idempotente et peut être exécutée en toute sécurité plusieurs fois.

## Dépannage

<AccordionGroup>
  <Accordion title="Le pare-feu bloque ma connexion">
    - Assurez-vous d’abord de pouvoir accéder via le VPN Tailscale
    - L’accès SSH (port 22) est toujours autorisé
    - La gateway n’est accessible que via Tailscale, par conception

  </Accordion>
  <Accordion title="Le service ne démarre pas">
    ```bash
    # Vérifier les logs
    sudo journalctl -u openclaw -n 100

    # Vérifier les permissions
    sudo ls -la /opt/openclaw

    # Tester un démarrage manuel
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Problèmes de sandbox Docker">
    ```bash
    # Vérifier que Docker est en cours d’exécution
    sudo systemctl status docker

    # Vérifier l’image sandbox
    sudo docker images | grep openclaw-sandbox

    # Construire l’image sandbox si elle est manquante
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="La connexion au provider échoue">
    Assurez-vous d’exécuter la commande comme utilisateur `openclaw` :
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Configuration avancée

Pour l’architecture de sécurité détaillée et le dépannage, consultez le dépôt openclaw-ansible :

- [Architecture de sécurité](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Détails techniques](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Guide de dépannage](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Liens associés

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- guide complet de déploiement
- [Docker](/fr/install/docker) -- configuration de gateway conteneurisée
- [Sandboxing](/fr/gateway/sandboxing) -- configuration du sandbox des agents
- [Multi-Agent Sandbox and Tools](/fr/tools/multi-agent-sandbox-tools) -- isolation par agent
