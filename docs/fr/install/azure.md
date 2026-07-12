---
read_when:
    - Vous souhaitez qu’OpenClaw fonctionne 24 h/24 et 7 j/7 sur Azure avec un renforcement de la sécurité via un groupe de sécurité réseau
    - Vous souhaitez disposer d’un Gateway OpenClaw de qualité production, toujours actif, sur votre propre machine virtuelle Linux Azure
    - Vous souhaitez une administration sécurisée avec Azure Bastion SSH
summary: Exécutez le Gateway OpenClaw 24 h/24 et 7 j/7 sur une machine virtuelle Linux Azure avec un état persistant
title: Azure
x-i18n:
    generated_at: "2026-07-12T02:44:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8598014cdc2786a47039ffb42ddd85354da9c87fd55ea46bb6dad7714171a14
    source_path: install/azure.md
    workflow: 16
---

Configurez une machine virtuelle Linux Azure avec Azure CLI, appliquez un renforcement du groupe de sécurité réseau (NSG), configurez Azure Bastion pour l’accès SSH et installez OpenClaw.

## Ce que vous allez faire

- Créer les ressources réseau Azure (VNet, sous-réseaux, NSG) et de calcul avec Azure CLI
- Appliquer des règles NSG afin que l’accès SSH à la machine virtuelle soit autorisé uniquement depuis Azure Bastion
- Utiliser Azure Bastion pour l’accès SSH (sans adresse IP publique sur la machine virtuelle)
- Installer OpenClaw avec le script d’installation
- Vérifier le Gateway

## Prérequis

- Un abonnement Azure autorisé à créer des ressources de calcul et de réseau
- Azure CLI installé (consultez les [étapes d’installation d’Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli))
- Une paire de clés SSH (ce guide explique comment en générer une si nécessaire)
- Environ 20 à 30 minutes

## Configurer le déploiement

<Steps>
  <Step title="Se connecter à Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    L’extension `ssh` est requise pour la création native de tunnels SSH avec Azure Bastion.

  </Step>

  <Step title="Inscrire les fournisseurs de ressources requis (une seule fois)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Vérifiez l’inscription ; attendez que les deux affichent `Registered`.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Définir les variables de déploiement">
    ```bash
    RG="rg-openclaw"
    LOCATION="westus2"
    VNET_NAME="vnet-openclaw"
    VNET_PREFIX="10.40.0.0/16"
    VM_SUBNET_NAME="snet-openclaw-vm"
    VM_SUBNET_PREFIX="10.40.2.0/24"
    BASTION_SUBNET_PREFIX="10.40.1.0/26"
    NSG_NAME="nsg-openclaw-vm"
    VM_NAME="vm-openclaw"
    ADMIN_USERNAME="openclaw"
    BASTION_NAME="bas-openclaw"
    BASTION_PIP_NAME="pip-openclaw-bastion"
    ```

    Adaptez les noms et les plages CIDR à votre environnement. Le sous-réseau Bastion doit être au minimum en `/26`.

  </Step>

  <Step title="Sélectionner une clé SSH">
    Utilisez votre clé publique existante si vous en avez une :

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Sinon, générez-en une :

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Sélectionner la taille de la machine virtuelle et celle du disque du système d’exploitation">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    - Commencez avec une taille réduite pour une utilisation légère, puis augmentez-la ultérieurement.
    - Utilisez davantage de processeurs virtuels, de RAM et d’espace disque pour une automatisation plus intensive, davantage de canaux ou des charges de travail de modèles et d’outils plus importantes.
    - Si une taille n’est pas disponible dans votre région ou dans le quota de votre abonnement, choisissez la référence disponible la plus proche.

    Répertoriez les tailles de machines virtuelles disponibles dans votre région cible :

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Vérifiez votre utilisation et votre quota actuels de processeurs virtuels et de disques :

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Déployer les ressources Azure

<Steps>
  <Step title="Créer le groupe de ressources">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Créer le groupe de sécurité réseau">
    Créez le NSG et ajoutez des règles afin que seul le sous-réseau Bastion puisse établir une connexion SSH avec la machine virtuelle.

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # Allow SSH from the Bastion subnet only
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # Deny SSH from the public internet
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # Deny SSH from other VNet sources
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    Les règles sont évaluées par ordre de priorité, en commençant par le nombre le plus faible : le trafic Bastion est autorisé avec la priorité 100, puis tout autre trafic SSH est bloqué avec les priorités 110 et 120.

  </Step>

  <Step title="Créer le réseau virtuel et les sous-réseaux">
    Créez le VNet avec le sous-réseau de la machine virtuelle (auquel le NSG est associé), puis ajoutez le sous-réseau Bastion.

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # Attach the NSG to the VM subnet
    az network vnet subnet update \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n "${VM_SUBNET_NAME}" --nsg "${NSG_NAME}"

    # AzureBastionSubnet: this exact name is required by Azure
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="Créer la machine virtuelle">
    Aucune adresse IP publique n’est attribuée à la machine virtuelle. L’accès SSH passe exclusivement par Azure Bastion.

    ```bash
    az vm create \
      -g "${RG}" -n "${VM_NAME}" -l "${LOCATION}" \
      --image "Canonical:ubuntu-24_04-lts:server:latest" \
      --size "${VM_SIZE}" \
      --os-disk-size-gb "${OS_DISK_SIZE_GB}" \
      --storage-sku StandardSSD_LRS \
      --admin-username "${ADMIN_USERNAME}" \
      --ssh-key-values "${SSH_PUB_KEY}" \
      --vnet-name "${VNET_NAME}" \
      --subnet "${VM_SUBNET_NAME}" \
      --public-ip-address "" \
      --nsg ""
    ```

    `--public-ip-address ""` empêche l’attribution d’une adresse IP publique. `--nsg ""` évite de créer un NSG propre à l’interface réseau, puisque le NSG du sous-réseau assure déjà la sécurité.

    Pour épingler une version précise de l’image Ubuntu au lieu de `latest`, commencez par répertorier les versions disponibles :

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Créer Azure Bastion">
    Azure Bastion fournit un accès SSH géré sans exposer d’adresse IP publique sur la machine virtuelle. La référence Standard avec la création de tunnels activée est requise pour utiliser `az network bastion ssh` depuis la CLI.

    ```bash
    az network public-ip create \
      -g "${RG}" -n "${BASTION_PIP_NAME}" -l "${LOCATION}" \
      --sku Standard --allocation-method Static

    az network bastion create \
      -g "${RG}" -n "${BASTION_NAME}" -l "${LOCATION}" \
      --vnet-name "${VNET_NAME}" \
      --public-ip-address "${BASTION_PIP_NAME}" \
      --sku Standard --enable-tunneling true
    ```

    Le provisionnement de Bastion prend généralement 5 à 10 minutes, mais peut prendre jusqu’à 15 à 30 minutes dans certaines régions.

  </Step>
</Steps>

## Installer OpenClaw

<Steps>
  <Step title="Se connecter à la machine virtuelle par SSH via Azure Bastion">
    ```bash
    VM_ID="$(az vm show -g "${RG}" -n "${VM_NAME}" --query id -o tsv)"

    az network bastion ssh \
      --name "${BASTION_NAME}" \
      --resource-group "${RG}" \
      --target-resource-id "${VM_ID}" \
      --auth-type ssh-key \
      --username "${ADMIN_USERNAME}" \
      --ssh-key ~/.ssh/id_ed25519
    ```

  </Step>

  <Step title="Installer OpenClaw (dans l’interpréteur de commandes de la machine virtuelle)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    Le programme d’installation installe Node et les dépendances s’ils ne sont pas déjà présents, installe OpenClaw et lance la configuration initiale. Consultez [Installation](/fr/install) pour plus de détails.

  </Step>

  <Step title="Vérifier le Gateway">
    Une fois la configuration initiale terminée :

    ```bash
    openclaw gateway status
    ```

    Si votre organisation dispose déjà de licences GitHub Copilot, vous pouvez choisir le fournisseur GitHub Copilot pendant la configuration initiale au lieu d’utiliser une clé d’API distincte pour le modèle. Consultez [Fournisseur GitHub Copilot](/fr/providers/github-copilot).

  </Step>
</Steps>

## Considérations relatives aux coûts

Coûts mensuels approximatifs (vérifiez les tarifs actuels dans le calculateur de prix Azure, car ils varient selon la région et évoluent au fil du temps) :

- Référence Standard d’Azure Bastion : environ 140 $/mois
- Machine virtuelle (`Standard_B2as_v2`) : environ 55 $/mois

Pour réduire les coûts :

- Libérez la machine virtuelle lorsqu’elle n’est pas utilisée. Cela interrompt la facturation du calcul (les frais de disque restent applicables). Le Gateway est inaccessible tant que la machine virtuelle est libérée.

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- Supprimez Bastion lorsqu’il n’est pas nécessaire, puis recréez-le lorsque vous avez de nouveau besoin d’un accès SSH ; il représente la plus grande part des coûts et son provisionnement ne prend que quelques minutes.
- Utilisez la référence Basic de Bastion (environ 38 $/mois) si vous avez uniquement besoin d’un accès SSH depuis le portail et n’avez pas besoin de créer des tunnels avec la CLI (`az network bastion ssh`).

## Nettoyage

Supprimez toutes les ressources créées par ce guide :

```bash
az group delete -n "${RG}" --yes --no-wait
```

Cette commande supprime le groupe de ressources et tout ce qu’il contient (machine virtuelle, VNet, NSG, Bastion et adresse IP publique).

## Étapes suivantes

- Configurer les canaux de messagerie : [Canaux](/fr/channels)
- Associer des appareils locaux comme des nœuds : [Nœuds](/fr/nodes)
- Configurer le Gateway : [Configuration du Gateway](/fr/gateway/configuration)
- Plus de détails sur le déploiement Azure avec le fournisseur de modèles GitHub Copilot : [OpenClaw sur Azure avec GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Ressources connexes

- [Présentation de l’installation](/fr/install)
- [GCP](/fr/install/gcp)
- [DigitalOcean](/fr/install/digitalocean)
