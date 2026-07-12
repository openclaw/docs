---
read_when:
    - Je wilt OpenClaw 24/7 op Azure laten draaien met versterkte beveiliging via een Network Security Group
    - U wilt een productierijpe, continu actieve OpenClaw Gateway op uw eigen Azure Linux-VM
    - U wilt veilig beheer met Azure Bastion SSH
summary: Voer OpenClaw Gateway 24/7 uit op een virtuele Azure Linux-machine met duurzame status
title: Azure
x-i18n:
    generated_at: "2026-07-12T09:02:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8598014cdc2786a47039ffb42ddd85354da9c87fd55ea46bb6dad7714171a14
    source_path: install/azure.md
    workflow: 16
---

Stel met de Azure CLI een virtuele Azure Linux-machine in, pas beveiliging voor de Network Security Group (NSG) toe, configureer Azure Bastion voor SSH-toegang en installeer OpenClaw.

## Wat u gaat doen

- Azure-netwerkvoorzieningen (VNet, subnetten, NSG) en rekenresources maken met de Azure CLI
- NSG-regels toepassen zodat SSH naar de VM alleen vanaf Azure Bastion is toegestaan
- Azure Bastion gebruiken voor SSH-toegang (geen openbaar IP-adres op de VM)
- OpenClaw installeren met het installatiescript
- De Gateway verifiëren

## Wat u nodig hebt

- Een Azure-abonnement met toestemming om reken- en netwerkresources te maken
- Een geïnstalleerde Azure CLI (zie [Installatiestappen voor Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli))
- Een SSH-sleutelpaar (deze handleiding behandelt hoe u er zo nodig een genereert)
- Ongeveer 20-30 minuten

## Implementatie configureren

<Steps>
  <Step title="Aanmelden bij Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    De extensie `ssh` is vereist voor systeemeigen SSH-tunneling via Azure Bastion.

  </Step>

  <Step title="Vereiste resourceproviders registreren (eenmalig)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Controleer de registratie en wacht totdat beide `Registered` weergeven.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Implementatievariabelen instellen">
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

    Pas de namen en CIDR-bereiken aan uw omgeving aan. Het Bastion-subnet moet ten minste `/26` zijn.

  </Step>

  <Step title="Een SSH-sleutel selecteren">
    Gebruik uw bestaande openbare sleutel als u die hebt:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Genereer anders een nieuwe:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="VM-grootte en grootte van de besturingssysteemschijf selecteren">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    - Begin kleiner voor licht gebruik en schaal later op.
    - Gebruik meer vCPU, RAM en schijfruimte voor zwaardere automatisering, meer kanalen of grotere model- en toolwerklasten.
    - Als een grootte niet beschikbaar is in uw regio of binnen het quotum van uw abonnement, kiest u de meest vergelijkbare beschikbare SKU.

    Geef de beschikbare VM-grootten in uw doelregio weer:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Controleer uw huidige vCPU- en schijfgebruik en -quotum:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Azure-resources implementeren

<Steps>
  <Step title="De resourcegroep maken">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="De netwerkbeveiligingsgroep maken">
    Maak de NSG en voeg regels toe zodat alleen het Bastion-subnet via SSH verbinding met de VM kan maken.

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

    Regels worden op prioriteit geëvalueerd, met het laagste nummer eerst: Bastion-verkeer wordt bij 100 toegestaan, waarna al het overige SSH-verkeer bij 110 en 120 wordt geblokkeerd.

  </Step>

  <Step title="Het virtuele netwerk en de subnetten maken">
    Maak het VNet met het VM-subnet (waaraan de NSG is gekoppeld) en voeg vervolgens het Bastion-subnet toe.

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

  <Step title="De VM maken">
    De VM krijgt geen openbaar IP-adres. SSH-toegang verloopt uitsluitend via Azure Bastion.

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

    `--public-ip-address ""` voorkomt dat een openbaar IP-adres wordt toegewezen. `--nsg ""` slaat een NSG per NIC over, omdat de NSG op subnetniveau de beveiliging al afhandelt.

    Als u een specifieke versie van een Ubuntu-installatiekopie wilt vastzetten in plaats van `latest`, geeft u eerst de beschikbare versies weer:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Azure Bastion maken">
    Azure Bastion biedt beheerde SSH-toegang zonder een openbaar IP-adres op de VM beschikbaar te stellen. De Standard-SKU met ingeschakelde tunneling is vereist voor het op de CLI gebaseerde `az network bastion ssh`.

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

    Het inrichten van Bastion duurt doorgaans 5-10 minuten, maar kan in sommige regio's tot 15-30 minuten duren.

  </Step>
</Steps>

## OpenClaw installeren

<Steps>
  <Step title="Via Azure Bastion met SSH verbinding maken met de VM">
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

  <Step title="OpenClaw installeren (in de VM-shell)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    Het installatieprogramma installeert Node en afhankelijkheden als die nog niet aanwezig zijn, installeert OpenClaw en start de initiële configuratie. Zie [Installatie](/nl/install) voor details.

  </Step>

  <Step title="De Gateway verifiëren">
    Nadat de initiële configuratie is voltooid:

    ```bash
    openclaw gateway status
    ```

    Als uw organisatie al GitHub Copilot-licenties heeft, kunt u tijdens de initiële configuratie de GitHub Copilot-provider kiezen in plaats van een afzonderlijke API-sleutel voor het model. Zie [GitHub Copilot-provider](/nl/providers/github-copilot).

  </Step>
</Steps>

## Kostenoverwegingen

Geschatte maandelijkse kosten (controleer de actuele prijzen in de Azure-prijscalculator, omdat tarieven per regio verschillen en in de loop van de tijd veranderen):

- Azure Bastion Standard-SKU: ongeveer $140 per maand
- VM (`Standard_B2as_v2`): ongeveer $55 per maand

Om kosten te verlagen:

- Maak de toewijzing van de VM ongedaan wanneer deze niet wordt gebruikt. Hierdoor stopt de facturering voor rekenkracht (schijfkosten blijven gelden). De Gateway is niet bereikbaar zolang de toewijzing ongedaan is gemaakt.

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- Verwijder Bastion wanneer u het niet nodig hebt en maak het opnieuw wanneer u weer SSH-toegang nodig hebt; het is de grootste kostenpost en wordt binnen enkele minuten ingericht.
- Gebruik de Basic-SKU van Bastion (ongeveer $38 per maand) als u alleen SSH via de portal nodig hebt en geen CLI-tunneling (`az network bastion ssh`) nodig hebt.

## Opschonen

Verwijder alle resources die met deze handleiding zijn gemaakt:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Hiermee worden de resourcegroep en alles daarin verwijderd (VM, VNet, NSG, Bastion en openbaar IP-adres).

## Volgende stappen

- Berichtenkanalen instellen: [Kanalen](/nl/channels)
- Lokale apparaten als Nodes koppelen: [Nodes](/nl/nodes)
- De Gateway configureren: [Gateway-configuratie](/nl/gateway/configuration)
- Meer informatie over Azure-implementatie met de GitHub Copilot-modelprovider: [OpenClaw in Azure met GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [GCP](/nl/install/gcp)
- [DigitalOcean](/nl/install/digitalocean)
