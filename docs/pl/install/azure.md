---
read_when:
    - Chcesz, aby OpenClaw działał 24/7 na Azure z utwardzeniem Network Security Group
    - Chcesz mieć produkcyjnej klasy, stale działający OpenClaw Gateway na własnej maszynie wirtualnej Azure z systemem Linux
    - Potrzebujesz bezpiecznego administrowania z użyciem Azure Bastion SSH
summary: Uruchamianie OpenClaw Gateway 24/7 na maszynie wirtualnej z systemem Linux w Azure z trwałym stanem
title: Azure
x-i18n:
    generated_at: "2026-05-06T09:17:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ab1b7d09dd66c495983aebd4766ce760d659cc6f362bbcd999d1c1345ae38f7
    source_path: install/azure.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Ten przewodnik konfiguruje maszynę wirtualną Azure Linux za pomocą Azure CLI, stosuje utwardzanie sieciowej grupy zabezpieczeń (NSG), konfiguruje Azure Bastion do dostępu SSH i instaluje OpenClaw.

## Co zrobisz

- Utworzysz zasoby sieciowe Azure (VNet, podsieci, NSG) oraz zasoby obliczeniowe za pomocą Azure CLI
- Zastosujesz reguły sieciowej grupy zabezpieczeń, aby SSH do VM było dozwolone tylko z Azure Bastion
- Użyjesz Azure Bastion do dostępu SSH (bez publicznego adresu IP na VM)
- Zainstalujesz OpenClaw za pomocą skryptu instalacyjnego
- Zweryfikujesz Gateway

## Czego potrzebujesz

- Subskrypcji Azure z uprawnieniami do tworzenia zasobów obliczeniowych i sieciowych
- Zainstalowanego Azure CLI (w razie potrzeby zobacz [kroki instalacji Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli))
- Pary kluczy SSH (przewodnik opisuje generowanie jej w razie potrzeby)
- ~20-30 minut

## Konfiguracja wdrożenia

<Steps>
  <Step title="Zaloguj się do Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    Rozszerzenie `ssh` jest wymagane do natywnego tunelowania SSH w Azure Bastion.

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
    Użyj istniejącego klucza publicznego, jeśli go masz:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Jeśli nie masz jeszcze klucza SSH, wygeneruj go:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Wybierz rozmiar VM i rozmiar dysku systemowego">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    Wybierz rozmiar VM i rozmiar dysku systemowego dostępne w Twojej subskrypcji i regionie:

    - Zacznij od mniejszego rozmiaru przy lekkim użyciu i skaluj w górę później
    - Użyj większej liczby vCPU, więcej RAM lub większego dysku dla cięższej automatyzacji, większej liczby kanałów albo większych obciążeń modeli/narzędzi
    - Jeśli rozmiar VM jest niedostępny w Twoim regionie lub limicie subskrypcji, wybierz najbliższy dostępny SKU

    Wyświetl rozmiary VM dostępne w docelowym regionie:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Sprawdź bieżące użycie i limit vCPU oraz dysku:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Wdrażanie zasobów Azure

<Steps>
  <Step title="Utwórz grupę zasobów">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Utwórz sieciową grupę zabezpieczeń">
    Utwórz NSG i dodaj reguły, aby tylko podsieć Bastion mogła łączyć się z VM przez SSH.

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

    Reguły są oceniane według priorytetu (najniższy numer najpierw): ruch Bastion jest dozwolony przy 100, a następnie cały pozostały ruch SSH jest blokowany przy 110 i 120.

  </Step>

  <Step title="Utwórz sieć wirtualną i podsieci">
    Utwórz VNet z podsiecią VM (z dołączoną NSG), a następnie dodaj podsieć Bastion.

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

  <Step title="Utwórz VM">
    VM nie ma publicznego adresu IP. Dostęp SSH odbywa się wyłącznie przez Azure Bastion.

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

    `--public-ip-address ""` zapobiega przypisaniu publicznego adresu IP. `--nsg ""` pomija tworzenie NSG dla karty sieciowej (zabezpieczenia obsługuje NSG na poziomie podsieci).

    **Odtwarzalność:** Powyższe polecenie używa `latest` dla obrazu Ubuntu. Aby przypiąć konkretną wersję, wyświetl dostępne wersje i zastąp `latest`:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Utwórz Azure Bastion">
    Azure Bastion zapewnia zarządzany dostęp SSH do VM bez wystawiania publicznego adresu IP. SKU Standard z tunelowaniem jest wymagany dla opartego na CLI polecenia `az network bastion ssh`.

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

    Aprowizowanie Bastion zwykle zajmuje 5-10 minut, ale w niektórych regionach może potrwać do 15-30 minut.

  </Step>
</Steps>

## Instalowanie OpenClaw

<Steps>
  <Step title="Połącz się z VM przez SSH za pomocą Azure Bastion">
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

  <Step title="Zainstaluj OpenClaw (w powłoce VM)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    Instalator instaluje Node LTS i zależności, jeśli nie są jeszcze obecne, instaluje OpenClaw oraz uruchamia kreator wdrażania. Szczegóły znajdziesz w sekcji [Instalacja](/pl/install).

  </Step>

  <Step title="Zweryfikuj Gateway">
    Po ukończeniu wdrażania:

    ```bash
    openclaw gateway status
    ```

    Większość zespołów Azure w przedsiębiorstwach ma już licencje GitHub Copilot. Jeśli tak jest w Twoim przypadku, zalecamy wybranie dostawcy GitHub Copilot w kreatorze wdrażania OpenClaw. Zobacz [dostawca GitHub Copilot](/pl/providers/github-copilot).

  </Step>
</Steps>

## Uwagi dotyczące kosztów

Azure Bastion Standard SKU kosztuje około **\$140/miesiąc**, a VM (Standard_B2as_v2) kosztuje około **\$55/miesiąc**.

Aby obniżyć koszty:

- **Cofnij alokację VM**, gdy nie jest używana (zatrzymuje naliczanie opłat za moc obliczeniową; opłaty za dysk pozostają). OpenClaw Gateway nie będzie osiągalny, gdy alokacja VM jest cofnięta — uruchom ją ponownie, gdy znów będzie potrzebna na żywo:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- **Usuń Bastion, gdy nie jest potrzebny**, i utwórz go ponownie, gdy potrzebujesz dostępu SSH. Bastion jest największym składnikiem kosztów, a jego aprowizowanie zajmuje tylko kilka minut.
- **Użyj Basic Bastion SKU** (~\$38/miesiąc), jeśli potrzebujesz tylko SSH przez Portal i nie wymagasz tunelowania CLI (`az network bastion ssh`).

## Czyszczenie

Aby usunąć wszystkie zasoby utworzone przez ten przewodnik:

```bash
az group delete -n "${RG}" --yes --no-wait
```

To usuwa grupę zasobów i wszystko, co się w niej znajduje (VM, VNet, NSG, Bastion, publiczny adres IP).

## Następne kroki

- Skonfiguruj kanały wiadomości: [Kanały](/pl/channels)
- Sparuj lokalne urządzenia jako nodes: [Nodes](/pl/nodes)
- Skonfiguruj Gateway: [Konfiguracja Gateway](/pl/gateway/configuration)
- Więcej szczegółów o wdrożeniu OpenClaw w Azure z dostawcą modelu GitHub Copilot: [OpenClaw w Azure z GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Powiązane

- [Omówienie instalacji](/pl/install)
- [GCP](/pl/install/gcp)
- [DigitalOcean](/pl/install/digitalocean)
