---
read_when:
    - Vous souhaitez automatiser le déploiement du serveur avec un renforcement de la sécurité
    - Vous avez besoin d’une configuration isolée par un pare-feu avec un accès VPN
    - Vous effectuez un déploiement sur des serveurs Debian/Ubuntu distants
summary: Installation automatisée et renforcée d’OpenClaw avec Ansible, le VPN Tailscale et l’isolation par pare-feu
title: Ansible
x-i18n:
    generated_at: "2026-07-12T15:25:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8d3626ab364169609f92f636cb6b86cb980dca2b235500e748296128765444ae
    source_path: install/ansible.md
    workflow: 16
---

Déployez OpenClaw sur des serveurs de production avec **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**, un programme d’installation automatisé dont l’architecture donne la priorité à la sécurité.

<Info>
Le dépôt [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) constitue la source de référence pour le déploiement avec Ansible. Cette page en donne un aperçu rapide.
</Info>

## Prérequis

| Exigence    | Détails                                                                     |
| ----------- | --------------------------------------------------------------------------- |
| Système     | Debian 11+ ou Ubuntu 20.04+                                                 |
| Accès       | Privilèges root ou sudo                                                     |
| Réseau      | Connexion Internet pour l’installation des paquets                          |
| Ansible     | 2.14+ (installé automatiquement par le script de démarrage rapide)          |

## Ce que vous obtenez

- Sécurité donnant la priorité au pare-feu : UFW + isolation Docker (seuls SSH + Tailscale sont accessibles)
- VPN Tailscale pour l’accès à distance sans exposer publiquement les services
- Docker pour des conteneurs de bac à sable isolés avec des liaisons limitées à localhost
- Intégration à systemd avec renforcement de la sécurité et démarrage automatique au lancement du système
- Installation en une seule commande

## Démarrage rapide

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Éléments installés

1. Tailscale (VPN maillé pour un accès à distance sécurisé)
2. Pare-feu UFW (uniquement les ports SSH + Tailscale)
3. Docker CE + Compose V2 (moteur de bac à sable par défaut des agents)
4. Node.js et pnpm (OpenClaw nécessite Node 22.19+ ou 23.11+ ; Node 24 est recommandé)
5. OpenClaw, installé directement sur l’hôte et non conteneurisé
6. Un service systemd avec renforcement de la sécurité

<Note>
Le Gateway s’exécute directement sur l’hôte, et non dans Docker. La mise en bac à sable des agents est
facultative ; ce playbook installe Docker, car il s’agit du moteur de bac à sable
par défaut. Consultez [Mise en bac à sable](/fr/gateway/sandboxing) pour découvrir les autres moteurs.
</Note>

## Configuration après l’installation

<Steps>
  <Step title="Passer à l’utilisateur openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Exécuter l’assistant d’intégration">
    Le script de post-installation vous guide dans la configuration d’OpenClaw.
  </Step>
  <Step title="Connecter les canaux de messagerie">
    Connectez-vous à WhatsApp, Telegram, Discord ou Signal :
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="Vérifier l’installation">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Se connecter à Tailscale">
    Rejoignez votre réseau VPN maillé pour bénéficier d’un accès à distance sécurisé.
  </Step>
</Steps>

### Commandes rapides

```bash
# Vérifier l’état du service
sudo systemctl status openclaw

# Afficher les journaux en temps réel
sudo journalctl -u openclaw -f

# Redémarrer le Gateway
sudo systemctl restart openclaw

# Connexion à un canal (à exécuter en tant qu’utilisateur openclaw)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## Architecture de sécurité

Modèle de défense à quatre couches :

1. Pare-feu (UFW) : seuls SSH (22) et Tailscale (41641/udp) sont exposés publiquement
2. VPN (Tailscale) : le Gateway est accessible uniquement via le réseau VPN maillé
3. Isolation Docker : la chaîne iptables `DOCKER-USER` empêche l’exposition externe des ports
4. Renforcement de systemd : `NoNewPrivileges`, `PrivateTmp`, utilisateur non privilégié

Vérifiez votre surface d’attaque externe :

```bash
nmap -p- YOUR_SERVER_IP
```

Seul le port 22 (SSH) doit être ouvert. Le Gateway et Docker restent verrouillés.

Docker est installé pour les bacs à sable des agents (exécution isolée des outils), et non pour exécuter le Gateway. Consultez [Bac à sable multi-agent et outils](/fr/tools/multi-agent-sandbox-tools) pour configurer le bac à sable.

## Installation manuelle

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

    Vous pouvez également exécuter directement le playbook, puis lancer manuellement le script de configuration :
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Exécutez ensuite : /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Mise à jour

Le programme d’installation Ansible configure OpenClaw pour permettre les mises à jour manuelles ; consultez [Mise à jour](/fr/install/updating) pour connaître la procédure standard.

Pour réexécuter le playbook (par exemple, après des modifications de configuration) :

```bash
cd openclaw-ansible
./run-playbook.sh
```

Cette opération est idempotente et peut être exécutée plusieurs fois en toute sécurité.

## Dépannage

<AccordionGroup>
  <Accordion title="Le pare-feu bloque ma connexion">
    - Connectez-vous d’abord via le VPN Tailscale ; par conception, le Gateway n’est accessible que de cette manière.
    - SSH (port 22) est toujours autorisé.

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
  <Accordion title="Problèmes liés au bac à sable Docker">
    ```bash
    # Vérifier que Docker est en cours d’exécution
    sudo systemctl status docker

    # Vérifier l’image du bac à sable
    sudo docker images | grep openclaw-sandbox

    # Construire l’image du bac à sable si elle est absente (nécessite une copie de travail du code source)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # Pour les installations npm sans copie de travail du code source, consultez
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="La connexion au canal échoue">
    Assurez-vous d’exécuter les commandes en tant qu’utilisateur `openclaw` :
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## Configuration avancée

Pour obtenir des informations détaillées sur l’architecture de sécurité et le dépannage, consultez le dépôt openclaw-ansible :

- [Architecture de sécurité](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Détails techniques](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Guide de dépannage](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Ressources associées

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) : guide de déploiement complet
- [Docker](/fr/install/docker) : configuration conteneurisée du Gateway
- [Mise en bac à sable](/fr/gateway/sandboxing) : configuration du bac à sable des agents
- [Bac à sable multi-agent et outils](/fr/tools/multi-agent-sandbox-tools) : isolation par agent
