---
read_when:
    - Chcesz, aby OpenClaw działał całodobowo na platformie Azure, z zabezpieczeniami za pomocą sieciowej grupy zabezpieczeń (Network Security Group)
    - Potrzebujesz gotowego do zastosowań produkcyjnych, stale działającego Gateway OpenClaw na własnej maszynie wirtualnej z systemem Linux w Azure
    - Chcesz bezpiecznie administrować za pomocą Azure Bastion SSH
summary: Uruchamiaj OpenClaw Gateway przez całą dobę na maszynie wirtualnej z systemem Linux na platformie Azure, z trwałym przechowywaniem stanu
title: Azure
x-i18n:
    generated_at: "2026-07-12T15:13:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8598014cdc2786a47039ffb42ddd85354da9c87fd55ea46bb6dad7714171a14
    source_path: install/azure.md
    workflow: 16
---

Skonfiguruj maszynę wirtualną z systemem Linux na platformie Azure za pomocą Azure CLI, zastosuj zabezpieczenia grupy zabezpieczeń sieciowych (NSG), skonfiguruj Azure Bastion na potrzeby dostępu przez SSH i zainstaluj OpenClaw.

## Co zrobisz

- Utworzysz zasoby sieciowe Azure (VNet, podsieci, NSG) oraz zasoby obliczeniowe za pomocą Azure CLI
- Zastosujesz reguły NSG, aby dostęp SSH do maszyny wirtualnej był dozwolony wyłącznie z Azure Bastion
- Użyjesz Azure Bastion do dostępu przez SSH (bez publicznego adresu IP maszyny wirtualnej)
- Zainstalujesz OpenClaw za pomocą skryptu instalacyjnego
- Zweryfikujesz Gateway

## Czego potrzebujesz

- Subskrypcji Azure z uprawnieniami do tworzenia zasobów obliczeniowych i sieciowych
- Zainstalowanego Azure CLI (zobacz [instrukcję instalacji Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli))
- Pary kluczy SSH (w tym przewodniku opisano sposób jej wygenerowania w razie potrzeby)
- Około 20–30 minut

## Konfigurowanie wdrożenia

<Steps>
  <Step title="Zaloguj się w Azure CLI">
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

    Zweryfikuj rejestrację; poczekaj, aż dla obu zostanie wyświetlony stan `Registered`.

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

    Dostosuj nazwy i zakresy CIDR do swojego środowiska. Podsieć Bastion musi mieć rozmiar co najmniej `/26`.

  </Step>

  <Step title="Wybierz klucz SSH">
    Jeśli masz już klucz publiczny, użyj go:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    W przeciwnym razie wygeneruj klucz:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Wybierz rozmiar maszyny wirtualnej i dysku systemu operacyjnego">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    - W przypadku niewielkiego obciążenia zacznij od mniejszego rozmiaru i zwiększ go później.
    - W przypadku bardziej intensywnej automatyzacji, większej liczby kanałów lub większych obciążeń związanych z modelami i narzędziami użyj większej liczby procesorów vCPU, większej ilości pamięci RAM i większego dysku.
    - Jeśli dany rozmiar jest niedostępny w Twoim regionie lub w ramach limitu subskrypcji, wybierz najbliższą dostępną jednostkę SKU.

    Wyświetl rozmiary maszyn wirtualnych dostępne w regionie docelowym:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Sprawdź bieżące wykorzystanie i limity procesorów vCPU oraz dysków:

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

  <Step title="Utwórz grupę zabezpieczeń sieciowych">
    Utwórz NSG i dodaj reguły, aby tylko podsieć Bastion mogła nawiązywać połączenia SSH z maszyną wirtualną.

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # Zezwól na SSH wyłącznie z podsieci Bastion
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # Odrzuć SSH z publicznego Internetu
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # Odrzuć SSH z innych źródeł w VNet
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    Reguły są oceniane według priorytetu, począwszy od najniższej liczby: ruch z Bastion jest dozwolony z priorytetem 100, a następnie cały pozostały ruch SSH jest blokowany z priorytetami 110 i 120.

  </Step>

  <Step title="Utwórz sieć wirtualną i podsieci">
    Utwórz VNet z podsiecią maszyny wirtualnej (z dołączoną NSG), a następnie dodaj podsieć Bastion.

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

    # AzureBastionSubnet: Azure wymaga dokładnie tej nazwy
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="Utwórz maszynę wirtualną">
    Maszyna wirtualna nie otrzymuje publicznego adresu IP. Dostęp przez SSH odbywa się wyłącznie przez Azure Bastion.

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

    Opcja `--public-ip-address ""` zapobiega przypisaniu publicznego adresu IP. Opcja `--nsg ""` pomija tworzenie NSG dla pojedynczego interfejsu sieciowego, ponieważ zabezpieczeniami zarządza już NSG na poziomie podsieci.

    Aby przypiąć konkretną wersję obrazu Ubuntu zamiast `latest`, najpierw wyświetl dostępne wersje:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Utwórz Azure Bastion">
    Azure Bastion zapewnia zarządzany dostęp przez SSH bez udostępniania publicznego adresu IP maszyny wirtualnej. Do używania polecenia `az network bastion ssh` z poziomu CLI wymagane są jednostka SKU Standard oraz włączone tunelowanie.

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

    Aprowizowanie usługi Bastion zwykle zajmuje 5–10 minut, ale w niektórych regionach może potrwać nawet 15–30 minut.

  </Step>
</Steps>

## Instalowanie OpenClaw

<Steps>
  <Step title="Połącz się z maszyną wirtualną przez SSH za pośrednictwem Azure Bastion">
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

    Instalator instaluje Node i zależności, jeśli nie są jeszcze dostępne, instaluje OpenClaw i uruchamia proces konfiguracji początkowej. Szczegółowe informacje znajdziesz w sekcji [Instalacja](/pl/install).

  </Step>

  <Step title="Zweryfikuj Gateway">
    Po zakończeniu konfiguracji początkowej:

    ```bash
    openclaw gateway status
    ```

    Jeśli Twoja organizacja ma już licencje GitHub Copilot, podczas konfiguracji początkowej możesz wybrać dostawcę GitHub Copilot zamiast używać oddzielnego klucza API modelu. Zobacz [dostawcę GitHub Copilot](/pl/providers/github-copilot).

  </Step>
</Steps>

## Kwestie dotyczące kosztów

Przybliżone koszty miesięczne (sprawdź aktualne ceny w kalkulatorze cen Azure, ponieważ stawki różnią się w zależności od regionu i zmieniają się z czasem):

- Azure Bastion w jednostce SKU Standard: około 140 USD miesięcznie
- Maszyna wirtualna (`Standard_B2as_v2`): około 55 USD miesięcznie

Aby obniżyć koszty:

- Cofnij przydział maszyny wirtualnej, gdy nie jest używana. Zatrzymuje to naliczanie opłat za zasoby obliczeniowe (opłaty za dysk nadal obowiązują). Gateway jest niedostępny, gdy przydział maszyny wirtualnej jest cofnięty.

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # uruchom ponownie później
  ```

- Usuń Bastion, gdy nie jest potrzebny, i utwórz go ponownie, gdy znów będziesz potrzebować dostępu przez SSH; jest to największy składnik kosztów, a jego aprowizowanie zajmuje kilka minut.
- Użyj jednostki SKU Basic usługi Bastion (około 38 USD miesięcznie), jeśli potrzebujesz wyłącznie dostępu SSH za pośrednictwem portalu i nie potrzebujesz tunelowania przez CLI (`az network bastion ssh`).

## Czyszczenie

Usuń wszystkie zasoby utworzone zgodnie z tym przewodnikiem:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Spowoduje to usunięcie grupy zasobów i wszystkiego, co się w niej znajduje (maszyny wirtualnej, VNet, NSG, Bastion i publicznego adresu IP).

## Następne kroki

- Skonfiguruj kanały komunikacyjne: [Kanały](/pl/channels)
- Sparuj urządzenia lokalne jako węzły: [Węzły](/pl/nodes)
- Skonfiguruj Gateway: [Konfiguracja Gateway](/pl/gateway/configuration)
- Więcej informacji o wdrażaniu na platformie Azure z dostawcą modelu GitHub Copilot: [OpenClaw na platformie Azure z GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Powiązane materiały

- [Omówienie instalacji](/pl/install)
- [GCP](/pl/install/gcp)
- [DigitalOcean](/pl/install/digitalocean)
