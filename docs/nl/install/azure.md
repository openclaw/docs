---
read_when:
    - Je wilt OpenClaw 24/7 op Azure laten draaien met een geharde netwerkbeveiligingsgroep
    - U wilt een productieklare, altijd actieve OpenClaw Gateway op uw eigen Azure Linux-VM
    - Je wilt veilig beheer met Azure Bastion SSH
summary: Voer OpenClaw Gateway 24/7 uit op een Azure Linux-VM met persistente status
title: Azure
x-i18n:
    generated_at: "2026-04-29T22:52:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: e42e1a35e0340b959b73c548bc1efd6366bee38cf4c8cd23d986c5f14e5da0e0
    source_path: install/azure.md
    workflow: 16
---

# OpenClaw op Azure Linux VM

Deze handleiding zet een Azure Linux VM op met de Azure CLI, past Network Security Group (NSG)-hardening toe, configureert Azure Bastion voor SSH-toegang en installeert OpenClaw.

## Wat je gaat doen

- Azure-netwerken (VNet, subnetten, NSG) en rekenresources maken met de Azure CLI
- Network Security Group-regels toepassen zodat VM-SSH alleen is toegestaan vanaf Azure Bastion
- Azure Bastion gebruiken voor SSH-toegang (geen openbaar IP-adres op de VM)
- OpenClaw installeren met het installatiescript
- De Gateway verifiëren

## Wat je nodig hebt

- Een Azure-abonnement met toestemming om reken- en netwerkresources te maken
- Azure CLI geïnstalleerd (zie [Azure CLI-installatiestappen](https://learn.microsoft.com/cli/azure/install-azure-cli) indien nodig)
- Een SSH-sleutelpaar (de handleiding behandelt het genereren ervan indien nodig)
- ~20-30 minuten

## Implementatie configureren

<Steps>
  <Step title="Meld je aan bij Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    De `ssh`-extensie is vereist voor native SSH-tunneling via Azure Bastion.

  </Step>

  <Step title="Registreer vereiste resourceproviders (eenmalig)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Verifieer de registratie. Wacht tot beide `Registered` tonen.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Stel implementatievariabelen in">
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

    Pas namen en CIDR-bereiken aan zodat ze bij je omgeving passen. Het Bastion-subnet moet minimaal `/26` zijn.

  </Step>

  <Step title="Selecteer SSH-sleutel">
    Gebruik je bestaande openbare sleutel als je er een hebt:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Als je nog geen SSH-sleutel hebt, genereer er dan een:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Selecteer VM-grootte en grootte van OS-schijf">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    Kies een VM-grootte en OS-schijfgrootte die beschikbaar zijn in je abonnement en regio:

    - Begin kleiner voor licht gebruik en schaal later op
    - Gebruik meer vCPU/RAM/schijf voor zwaardere automatisering, meer kanalen of grotere model-/toolworkloads
    - Als een VM-grootte niet beschikbaar is in je regio of abonnementquota, kies dan de dichtstbijzijnde beschikbare SKU

    Lijst met VM-groottes die beschikbaar zijn in je doelregio:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Controleer je huidige vCPU- en schijfgebruik/quota:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Azure-resources implementeren

<Steps>
  <Step title="Maak de resourcegroep">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Maak de netwerkbeveiligingsgroep">
    Maak de NSG en voeg regels toe zodat alleen het Bastion-subnet via SSH verbinding kan maken met de VM.

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

    De regels worden geëvalueerd op prioriteit (laagste nummer eerst): Bastion-verkeer wordt toegestaan op 100, daarna wordt alle andere SSH geblokkeerd op 110 en 120.

  </Step>

  <Step title="Maak het virtuele netwerk en de subnetten">
    Maak het VNet met het VM-subnet (NSG gekoppeld) en voeg daarna het Bastion-subnet toe.

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

    # AzureBastionSubnet — name is required by Azure
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="Maak de VM">
    De VM heeft geen openbaar IP-adres. SSH-toegang loopt uitsluitend via Azure Bastion.

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

    `--public-ip-address ""` voorkomt dat een openbaar IP-adres wordt toegewezen. `--nsg ""` slaat het maken van een NSG per NIC over (de NSG op subnetniveau regelt de beveiliging).

    **Reproduceerbaarheid:** De bovenstaande opdracht gebruikt `latest` voor de Ubuntu-image. Om een specifieke versie vast te pinnen, lijst je beschikbare versies op en vervang je `latest`:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Maak Azure Bastion">
    Azure Bastion biedt beheerde SSH-toegang tot de VM zonder een openbaar IP-adres bloot te stellen. Standard SKU met tunneling is vereist voor CLI-gebaseerde `az network bastion ssh`.

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

    Het inrichten van Bastion duurt doorgaans 5-10 minuten, maar kan in sommige regio's oplopen tot 15-30 minuten.

  </Step>
</Steps>

## OpenClaw installeren

<Steps>
  <Step title="Maak via Azure Bastion met SSH verbinding met de VM">
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

  <Step title="Installeer OpenClaw (in de VM-shell)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    Het installatieprogramma installeert Node LTS en afhankelijkheden als die nog niet aanwezig zijn, installeert OpenClaw en start de onboardingwizard. Zie [Installeren](/nl/install) voor details.

  </Step>

  <Step title="Verifieer de Gateway">
    Nadat onboarding is voltooid:

    ```bash
    openclaw gateway status
    ```

    De meeste zakelijke Azure-teams hebben al GitHub Copilot-licenties. Als dat voor jou geldt, raden we aan de GitHub Copilot-provider te kiezen in de OpenClaw-onboardingwizard. Zie [GitHub Copilot-provider](/nl/providers/github-copilot).

  </Step>
</Steps>

## Kostenoverwegingen

Azure Bastion Standard SKU kost ongeveer **\$140/maand** en de VM (Standard_B2as_v2) kost ongeveer **\$55/maand**.

Om kosten te verlagen:

- **Dealloceer de VM** wanneer deze niet in gebruik is (stopt rekenfacturering; schijfkosten blijven bestaan). De OpenClaw Gateway is niet bereikbaar zolang de VM is gedealloceerd — start hem opnieuw wanneer je hem weer live nodig hebt:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- **Verwijder Bastion wanneer het niet nodig is** en maak het opnieuw wanneer je SSH-toegang nodig hebt. Bastion is de grootste kostencomponent en heeft slechts een paar minuten nodig om in te richten.
- **Gebruik de Basic Bastion SKU** (~\$38/maand) als je alleen op Portal gebaseerde SSH nodig hebt en geen CLI-tunneling (`az network bastion ssh`) vereist.

## Opschonen

Om alle resources te verwijderen die door deze handleiding zijn gemaakt:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Dit verwijdert de resourcegroep en alles daarin (VM, VNet, NSG, Bastion, openbaar IP-adres).

## Volgende stappen

- Stel berichtenkanalen in: [Kanalen](/nl/channels)
- Koppel lokale apparaten als nodes: [Nodes](/nl/nodes)
- Configureer de Gateway: [Gateway-configuratie](/nl/gateway/configuration)
- Voor meer details over OpenClaw Azure-implementatie met de GitHub Copilot-modelprovider: [OpenClaw op Azure met GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [GCP](/nl/install/gcp)
- [DigitalOcean](/nl/install/digitalocean)
