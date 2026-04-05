---
read_when:
    - Chcesz uruchomić OpenClaw 24/7 na Azure z utwardzeniem Network Security Group
    - Chcesz mieć produkcyjny, zawsze aktywny OpenClaw Gateway na własnej maszynie wirtualnej Azure Linux
    - Chcesz bezpiecznej administracji przez Azure Bastion SSH
summary: Uruchom OpenClaw Gateway 24/7 na maszynie wirtualnej Azure Linux z trwałym stanem
title: Azure
x-i18n:
    generated_at: "2026-04-05T13:56:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: dcdcf6dcf5096cd21e1b64f455656f7d77b477d03e9a088db74c6e988c3031db
    source_path: install/azure.md
    workflow: 15
---

# OpenClaw na Azure Linux VM

Ten przewodnik konfiguruje maszynę wirtualną Azure Linux przy użyciu Azure CLI, stosuje utwardzenie Network Security Group (NSG), konfiguruje Azure Bastion do dostępu SSH i instaluje OpenClaw.

## Co zrobisz

- Utworzysz zasoby sieciowe Azure (VNet, podsieci, NSG) i zasoby obliczeniowe przy użyciu Azure CLI
- Zastosujesz reguły Network Security Group, aby SSH do maszyny wirtualnej było dozwolone tylko z Azure Bastion
- Użyjesz Azure Bastion do dostępu SSH (bez publicznego IP na maszynie wirtualnej)
- Zainstalujesz OpenClaw przy użyciu skryptu instalacyjnego
- Zweryfikujesz Gateway

## Czego potrzebujesz

- Subskrypcji Azure z uprawnieniami do tworzenia zasobów obliczeniowych i sieciowych
- Zainstalowanego Azure CLI (w razie potrzeby zobacz [instrukcję instalacji Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli))
- Pary kluczy SSH (przewodnik obejmuje też ich wygenerowanie, jeśli to potrzebne)
- Około 20-30 minut

## Skonfiguruj wdrożenie

<Steps>
  <Step title="Zaloguj się do Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    Rozszerzenie `ssh` jest wymagane do natywnego tunelowania SSH przez Azure Bastion.

  </Step>

  <Step title="Zarejestruj wymaganych dostawców zasobów (jednorazowo)">
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

  <Step title="Ustaw zmienne wdrożenia">
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

    Dostosuj nazwy i zakresy CIDR do swojego środowiska. Podsieć Bastion musi mieć co najmniej `/26`.

  </Step>

  <Step title="Wybierz klucz SSH">
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

  <Step title="Wybierz rozmiar maszyny wirtualnej i rozmiar dysku systemowego">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    Wybierz rozmiar maszyny wirtualnej i rozmiar dysku systemowego dostępne w Twojej subskrypcji i regionie:

    - Zacznij od mniejszego rozmiaru przy lekkim użyciu i skaluj później
    - Użyj większej liczby vCPU/RAM/dysku przy cięższej automatyzacji, większej liczbie kanałów lub większych obciążeniach modelu/narzędzi
    - Jeśli dany rozmiar maszyny wirtualnej jest niedostępny w Twoim regionie albo przekracza limit subskrypcji, wybierz najbliższy dostępny SKU

    Wyświetl rozmiary maszyn wirtualnych dostępne w docelowym regionie:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Sprawdź bieżące użycie/limit vCPU i dysków:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Wdróż zasoby Azure

<Steps>
  <Step title="Utwórz grupę zasobów">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Utwórz network security group">
    Utwórz NSG i dodaj reguły tak, aby tylko podsieć Bastion mogła łączyć się z maszyną wirtualną przez SSH.

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # Zezwól na SSH tylko z podsieci Bastion
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

    Reguły są oceniane według priorytetu (najpierw najniższa liczba): ruch Bastion jest dozwolony przy 100, a następnie cały inny ruch SSH jest blokowany przy 110 i 120.

  </Step>

  <Step title="Utwórz sieć wirtualną i podsieci">
    Utwórz VNet z podsiecią maszyny wirtualnej (z dołączonym NSG), a następnie dodaj podsieć Bastion.

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # Dołącz NSG do podsieci maszyny wirtualnej
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

  <Step title="Utwórz maszynę wirtualną">
    Maszyna wirtualna nie ma publicznego IP. Dostęp SSH odbywa się wyłącznie przez Azure Bastion.

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

    `--public-ip-address ""` zapobiega przypisaniu publicznego IP. `--nsg ""` pomija tworzenie NSG dla pojedynczego NIC (bezpieczeństwo obsługuje NSG na poziomie podsieci).

    **Odtwarzalność:** powyższe polecenie używa `latest` dla obrazu Ubuntu. Aby przypiąć konkretną wersję, wyświetl dostępne wersje i zastąp `latest`:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Utwórz Azure Bastion">
    Azure Bastion zapewnia zarządzany dostęp SSH do maszyny wirtualnej bez wystawiania publicznego IP. Do tunelowania opartego na CLI przez `az network bastion ssh` wymagany jest SKU Standard.

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

    Provisioning Bastion zwykle trwa 5-10 minut, ale w niektórych regionach może potrwać do 15-30 minut.

  </Step>
</Steps>

## Zainstaluj OpenClaw

<Steps>
  <Step title="Połącz się z maszyną wirtualną przez Azure Bastion">
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

  <Step title="Zainstaluj OpenClaw (w powłoce maszyny wirtualnej)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    Instalator instaluje Node LTS i zależności, jeśli nie są jeszcze obecne, instaluje OpenClaw i uruchamia kreator onboardingu. Szczegóły znajdziesz w [Install](/install).

  </Step>

  <Step title="Zweryfikuj Gateway">
    Po zakończeniu onboardingu:

    ```bash
    openclaw gateway status
    ```

    Większość firmowych zespołów Azure ma już licencje GitHub Copilot. Jeśli tak jest w Twoim przypadku, zalecamy wybranie dostawcy GitHub Copilot w kreatorze onboardingu OpenClaw. Zobacz [dostawca GitHub Copilot](/providers/github-copilot).

  </Step>
</Steps>

## Uwagi dotyczące kosztów

Azure Bastion Standard SKU kosztuje około **140 USD/miesiąc**, a maszyna wirtualna (Standard_B2as_v2) około **55 USD/miesiąc**.

Aby obniżyć koszty:

- **Zwolnij maszynę wirtualną**, gdy nie jest używana (zatrzymuje naliczanie kosztów obliczeniowych; opłaty za dysk pozostają). OpenClaw Gateway nie będzie osiągalny, gdy maszyna wirtualna jest zwolniona — uruchom ją ponownie, gdy znów ma być dostępna:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # uruchom ponownie później
  ```

- **Usuń Bastion, gdy nie jest potrzebny**, i utwórz go ponownie, gdy potrzebujesz dostępu SSH. Bastion jest największym składnikiem kosztów i jego provisionowanie trwa tylko kilka minut.
- **Użyj Basic Bastion SKU** (~38 USD/miesiąc), jeśli potrzebujesz tylko SSH przez Portal i nie potrzebujesz tunelowania przez CLI (`az network bastion ssh`).

## Czyszczenie

Aby usunąć wszystkie zasoby utworzone według tego przewodnika:

```bash
az group delete -n "${RG}" --yes --no-wait
```

To usuwa grupę zasobów i wszystko w jej wnętrzu (VM, VNet, NSG, Bastion, publiczne IP).

## Dalsze kroki

- Skonfiguruj kanały wiadomości: [Channels](/pl/channels)
- Sparuj lokalne urządzenia jako węzły: [Nodes](/nodes)
- Skonfiguruj Gateway: [Konfiguracja Gateway](/gateway/configuration)
- Więcej szczegółów o wdrożeniu OpenClaw na Azure z dostawcą modeli GitHub Copilot znajdziesz tutaj: [OpenClaw on Azure with GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)
