---
read_when:
    - Chcesz, aby OpenClaw działał 24/7 na Azure z utwardzaniem Network Security Group
    - Chcesz produkcyjnej, zawsze działającej bramy OpenClaw Gateway na własnej maszynie wirtualnej Azure Linux
    - Chcesz bezpiecznej administracji z użyciem SSH przez Azure Bastion
summary: Uruchamiaj OpenClaw Gateway 24/7 na maszynie wirtualnej Azure Linux z trwałym stanem
title: Azure
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T09:15:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: e42e1a35e0340b959b73c548bc1efd6366bee38cf4c8cd23d986c5f14e5da0e0
    source_path: install/azure.md
    workflow: 15
---

# OpenClaw na maszynie wirtualnej Azure Linux

Ten przewodnik konfiguruje maszynę wirtualną Azure Linux przy użyciu Azure CLI, stosuje utwardzanie Network Security Group (NSG), konfiguruje Azure Bastion do dostępu SSH i instaluje OpenClaw.

## Co zrobisz

- Utworzysz zasoby sieciowe Azure (VNet, subnety, NSG) i zasoby obliczeniowe przy użyciu Azure CLI
- Zastosujesz reguły Network Security Group tak, aby SSH do VM było dozwolone tylko z Azure Bastion
- Użyjesz Azure Bastion do dostępu SSH (bez publicznego IP na VM)
- Zainstalujesz OpenClaw za pomocą skryptu instalacyjnego
- Zweryfikujesz Gateway

## Czego potrzebujesz

- Subskrypcji Azure z uprawnieniami do tworzenia zasobów obliczeniowych i sieciowych
- Zainstalowanego Azure CLI (w razie potrzeby zobacz [Azure CLI install steps](https://learn.microsoft.com/cli/azure/install-azure-cli))
- Pary kluczy SSH (przewodnik obejmuje ich wygenerowanie, jeśli to potrzebne)
- Około 20-30 minut

## Konfiguracja wdrożenia

<Steps>
  <Step title="Sign in to Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    Rozszerzenie `ssh` jest wymagane do natywnego tunelowania SSH przez Azure Bastion.

  </Step>

  <Step title="Register required resource providers (one-time)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Zweryfikuj rejestrację. Poczekaj, aż oba pokażą `Registered`.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Set deployment variables">
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

    Dostosuj nazwy i zakresy CIDR do swojego środowiska. Subnet Bastion musi mieć co najmniej `/26`.

  </Step>

  <Step title="Select SSH key">
    Użyj istniejącego klucza publicznego, jeśli już go masz:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Jeśli nie masz jeszcze klucza SSH, wygeneruj go:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Select VM size and OS disk size">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    Wybierz rozmiar VM i rozmiar dysku systemowego dostępne w Twojej subskrypcji i regionie:

    - Zacznij od mniejszej maszyny dla lekkiego użycia i skaluj później
    - Użyj większej liczby vCPU/RAM/dysku dla cięższej automatyzacji, większej liczby kanałów lub większych obciążeń modeli/narzędzi
    - Jeśli dany rozmiar VM jest niedostępny w Twoim regionie lub limicie subskrypcji, wybierz najbliższy dostępny SKU

    Wyświetl rozmiary VM dostępne w docelowym regionie:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Sprawdź bieżące użycie/limity vCPU i dysków:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Wdrażanie zasobów Azure

<Steps>
  <Step title="Create the resource group">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Create the network security group">
    Utwórz NSG i dodaj reguły, aby tylko subnet Bastion mógł łączyć się przez SSH z VM.

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # Zezwól na SSH tylko z subneta Bastion
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # Zablokuj SSH z publicznego internetu
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # Zablokuj SSH z innych źródeł VNet
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    Reguły są oceniane według priorytetu (najpierw najniższa liczba): ruch Bastion jest dozwolony przy 100, a następnie całe pozostałe SSH jest blokowane przy 110 i 120.

  </Step>

  <Step title="Create the virtual network and subnets">
    Utwórz VNet z subnetem VM (z podłączonym NSG), a następnie dodaj subnet Bastion.

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # Podłącz NSG do subneta VM
    az network vnet subnet update \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n "${VM_SUBNET_NAME}" --nsg "${NSG_NAME}"

    # AzureBastionSubnet — nazwa wymagana przez Azure
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="Create the VM">
    VM nie ma publicznego IP. Dostęp SSH odbywa się wyłącznie przez Azure Bastion.

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

    `--public-ip-address ""` zapobiega przypisaniu publicznego IP. `--nsg ""` pomija tworzenie NSG per NIC (bezpieczeństwo obsługuje NSG na poziomie subneta).

    **Odtwarzalność:** powyższe polecenie używa `latest` dla obrazu Ubuntu. Aby przypiąć konkretną wersję, wyświetl dostępne wersje i zastąp `latest`:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Create Azure Bastion">
    Azure Bastion zapewnia zarządzany dostęp SSH do VM bez wystawiania publicznego IP. SKU Standard z tunelowaniem jest wymagane dla CLI `az network bastion ssh`.

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

    Provisioning Bastion zwykle trwa 5-10 minut, ale w niektórych regionach może zająć nawet 15-30 minut.

  </Step>
</Steps>

## Instalacja OpenClaw

<Steps>
  <Step title="SSH into the VM through Azure Bastion">
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

  <Step title="Install OpenClaw (in the VM shell)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    Instalator instaluje Node LTS i zależności, jeśli nie są jeszcze obecne, instaluje OpenClaw i uruchamia kreator onboardingu. Szczegóły znajdziesz w [Install](/pl/install).

  </Step>

  <Step title="Verify the Gateway">
    Po zakończeniu onboardingu:

    ```bash
    openclaw gateway status
    ```

    Większość zespołów enterprise korzystających z Azure ma już licencje GitHub Copilot. Jeśli to Twój przypadek, zalecamy wybranie providera GitHub Copilot w kreatorze onboardingu OpenClaw. Zobacz [GitHub Copilot provider](/pl/providers/github-copilot).

  </Step>
</Steps>

## Uwagi dotyczące kosztów

Azure Bastion Standard SKU kosztuje około **\$140/miesiąc**, a VM (Standard_B2as_v2) około **\$55/miesiąc**.

Aby obniżyć koszty:

- **Zdeallokuj VM**, gdy nie jest używana (zatrzymuje naliczanie kosztów obliczeń; opłaty za dysk pozostają). OpenClaw Gateway nie będzie osiągalny, gdy VM będzie zdeallokowana — uruchom ją ponownie, gdy znów potrzebujesz działania na żywo:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # uruchom ponownie później
  ```

- **Usuń Bastion, gdy nie jest potrzebny**, i odtwórz go, gdy potrzebujesz dostępu SSH. Bastion jest największym składnikiem kosztów i provisionuje się w ciągu zaledwie kilku minut.
- **Użyj Basic Bastion SKU** (~\$38/miesiąc), jeśli potrzebujesz tylko SSH przez Portal i nie potrzebujesz tunelowania przez CLI (`az network bastion ssh`).

## Czyszczenie

Aby usunąć wszystkie zasoby utworzone przez ten przewodnik:

```bash
az group delete -n "${RG}" --yes --no-wait
```

To usuwa grupę zasobów i wszystko, co się w niej znajduje (VM, VNet, NSG, Bastion, publiczne IP).

## Następne kroki

- Skonfiguruj kanały wiadomości: [Channels](/pl/channels)
- Sparuj urządzenia lokalne jako Node: [Nodes](/pl/nodes)
- Skonfiguruj Gateway: [Gateway configuration](/pl/gateway/configuration)
- Więcej szczegółów o wdrożeniu OpenClaw na Azure z providerem modeli GitHub Copilot: [OpenClaw on Azure with GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Powiązane

- [Install overview](/pl/install)
- [GCP](/pl/install/gcp)
- [DigitalOcean](/pl/install/digitalocean)
