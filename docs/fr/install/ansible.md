---
read_when:
    - Vous souhaitez automatiser le déploiement du serveur avec un renforcement de la sécurité
    - Vous avez besoin d’une configuration isolée par un pare-feu avec un accès VPN
    - Vous effectuez un déploiement sur des serveurs Debian/Ubuntu distants
summary: Installation automatisée et renforcée d’OpenClaw avec Ansible, le VPN Tailscale et l’isolation par pare-feu
title: Ansible
x-i18n:
    generated_at: "2026-07-16T13:26:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f6b473cd5a8b80389b5ed746c4e2f2729d95bb15a2daaaa183fbdfbe144e647
    source_path: install/ansible.md
    workflow: 16
---

Déployez OpenClaw sur des serveurs de production avec **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**, un programme d’installation automatisé doté d’une architecture privilégiant la sécurité.

<Info>
Le dépôt [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) constitue la source de référence pour le déploiement Ansible. Cette page en donne un aperçu rapide.
</Info>

## Prérequis

| Exigence | Détails                                                    |
| -------- | ---------------------------------------------------------- |
| Système d’exploitation | Debian 11+ ou Ubuntu 20.04+                    |
| Accès    | Privilèges root ou sudo                                    |
| Réseau   | Connexion Internet pour l’installation des paquets         |
| Ansible  | 2.14+ (installé automatiquement par le script de démarrage rapide) |

## Ce que vous obtenez

- Sécurité privilégiant le pare-feu : UFW + isolation Docker (seuls SSH + Tailscale sont accessibles)
- VPN Tailscale pour l’accès à distance sans exposer publiquement les services
- Docker pour des conteneurs sandbox isolés avec des liaisons limitées à localhost
- Intégration à systemd avec renforcement de la sécurité et démarrage automatique au démarrage du système
- Configuration en une seule commande

## Démarrage rapide

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Éléments installés

1. Tailscale (VPN maillé pour un accès à distance sécurisé)
2. Pare-feu UFW (ports SSH + Tailscale uniquement)
3. Docker CE + Compose V2 (backend sandbox par défaut des agents)
4. Node.js et pnpm (OpenClaw nécessite Node 22.22.3+, 24.15+ ou 25.9+ ; Node 24 est recommandé)
5. OpenClaw, installé directement sur l’hôte et non conteneurisé
6. Un service systemd avec renforcement de la sécurité

<Note>
Le Gateway s’exécute directement sur l’hôte, et non dans Docker. La mise en sandbox des agents est
facultative ; ce playbook installe Docker, car il s’agit du backend sandbox
par défaut. Consultez [Mise en sandbox](/fr/gateway/sandboxing) pour découvrir les autres backends.
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
    Rejoignez votre maillage VPN pour bénéficier d’un accès à distance sécurisé.
  </Step>
</Steps>

### Commandes rapides

```bash
# Vérifier l’état du service
sudo systemctl status openclaw

# Afficher les journaux en direct
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
2. VPN (Tailscale) : le Gateway est accessible uniquement via le maillage VPN
3. Isolation Docker : la chaîne iptables `DOCKER-USER` empêche l’exposition externe des ports
4. Renforcement de systemd : `NoNewPrivileges`, `PrivateTmp`, utilisateur non privilégié

Vérifiez votre surface d’attaque externe :

```bash
nmap -p- YOUR_SERVER_IP
```

Seul le port 22 (SSH) doit être ouvert. Le Gateway et Docker restent verrouillés.

Docker est installé pour les sandbox d’agents (exécution isolée des outils), et non pour exécuter le Gateway. Consultez [Sandbox multi-agent et outils](/fr/tools/multi-agent-sandbox-tools) pour configurer la sandbox.

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

Le programme d’installation Ansible configure OpenClaw pour les mises à jour manuelles ; consultez [Mise à jour](/fr/install/updating) pour connaître la procédure standard.

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
  <Accordion title="Problèmes liés à la sandbox Docker">
    ```bash
    # Vérifier que Docker est en cours d’exécution
    sudo systemctl status docker

    # Vérifier l’image de la sandbox
    sudo docker images | grep openclaw-sandbox

    # Construire l’image de la sandbox si elle est absente (nécessite un checkout des sources)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # Pour les installations npm sans checkout des sources, consultez
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Échec de la connexion au canal">
    Vérifiez que vous exécutez les commandes en tant qu’utilisateur `openclaw` :
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
- [Docker](/fr/install/docker) : configuration d’un Gateway conteneurisé
- [Mise en sandbox](/fr/gateway/sandboxing) : configuration de la sandbox des agents
- [Sandbox multi-agent et outils](/fr/tools/multi-agent-sandbox-tools) : isolation par agent
