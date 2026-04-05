---
read_when:
    - OpenClaw’ın Azure üzerinde Network Security Group sağlamlaştırmasıyla 7/24 çalışmasını istiyorsunuz
    - Kendi Azure Linux VM’inizde üretim düzeyinde, her zaman açık bir OpenClaw Gateway istiyorsunuz
    - Azure Bastion SSH ile güvenli yönetim istiyorsunuz
summary: Kalıcı durumla OpenClaw Gateway’i bir Azure Linux VM üzerinde 7/24 çalıştırın
title: Azure
x-i18n:
    generated_at: "2026-04-05T13:56:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: dcdcf6dcf5096cd21e1b64f455656f7d77b477d03e9a088db74c6e988c3031db
    source_path: install/azure.md
    workflow: 15
---

# Azure Linux VM üzerinde OpenClaw

Bu kılavuz, Azure CLI ile bir Azure Linux VM kurar, Network Security Group (NSG) sağlamlaştırması uygular, SSH erişimi için Azure Bastion yapılandırır ve OpenClaw’ı kurar.

## Yapacaklarınız

- Azure CLI ile Azure ağ (VNet, alt ağlar, NSG) ve işlem kaynakları oluşturma
- VM SSH erişimine yalnızca Azure Bastion üzerinden izin verecek şekilde Network Security Group kurallarını uygulama
- SSH erişimi için Azure Bastion kullanma (VM üzerinde ortak IP yok)
- Yükleyici betiğiyle OpenClaw kurma
- Gateway’i doğrulama

## İhtiyacınız olanlar

- İşlem ve ağ kaynakları oluşturma iznine sahip bir Azure aboneliği
- Yüklü Azure CLI (gerekirse [Azure CLI kurulum adımları](https://learn.microsoft.com/cli/azure/install-azure-cli) belgesine bakın)
- Bir SSH anahtar çifti (kılavuz gerekirse nasıl oluşturacağınızı da kapsar)
- Yaklaşık 20-30 dakika

## Dağıtımı yapılandırın

<Steps>
  <Step title="Azure CLI içinde oturum açın">
    ```bash
    az login
    az extension add -n ssh
    ```

    `ssh` uzantısı, Azure Bastion yerel SSH tünellemesi için gereklidir.

  </Step>

  <Step title="Gerekli kaynak sağlayıcılarını kaydedin (tek seferlik)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Kaydı doğrulayın. Her ikisi de `Registered` gösterene kadar bekleyin.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Dağıtım değişkenlerini ayarlayın">
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

    Adları ve CIDR aralıklarını ortamınıza uygun olacak şekilde ayarlayın. Bastion alt ağı en az `/26` olmalıdır.

  </Step>

  <Step title="SSH anahtarını seçin">
    Varsa mevcut ortak anahtarınızı kullanın:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Henüz bir SSH anahtarınız yoksa, bir tane oluşturun:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="VM boyutunu ve OS disk boyutunu seçin">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    Aboneliğinizde ve bölgenizde kullanılabilen bir VM boyutu ve OS disk boyutu seçin:

    - Hafif kullanım için küçük başlayın ve daha sonra büyütün
    - Daha ağır otomasyon, daha fazla kanal veya daha büyük model/araç iş yükleri için daha fazla vCPU/RAM/disk kullanın
    - Bölgenizde veya abonelik kotanızda bir VM boyutu kullanılamıyorsa, kullanılabilir en yakın SKU’yu seçin

    Hedef bölgenizde kullanılabilen VM boyutlarını listeleyin:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Geçerli vCPU ve disk kullanımınızı/kotanızı denetleyin:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Azure kaynaklarını dağıtın

<Steps>
  <Step title="Kaynak grubunu oluşturun">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Network Security Group’u oluşturun">
    NSG’yi oluşturun ve yalnızca Bastion alt ağının VM’e SSH ile bağlanabilmesi için kuralları ekleyin.

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # Yalnızca Bastion alt ağından SSH'ye izin ver
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # Ortak internetten SSH'yi reddet
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # Diğer VNet kaynaklarından SSH'yi reddet
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    Kurallar önceliğe göre değerlendirilir (önce en küçük sayı): Bastion trafiğine 100’de izin verilir, ardından diğer tüm SSH 110 ve 120’de engellenir.

  </Step>

  <Step title="Sanal ağı ve alt ağları oluşturun">
    VM alt ağıyla (NSG bağlı) VNet’i oluşturun, ardından Bastion alt ağını ekleyin.

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # NSG'yi VM alt ağına bağla
    az network vnet subnet update \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n "${VM_SUBNET_NAME}" --nsg "${NSG_NAME}"

    # AzureBastionSubnet — ad Azure tarafından zorunludur
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="VM’i oluşturun">
    VM’in ortak IP’si yoktur. SSH erişimi yalnızca Azure Bastion üzerinden sağlanır.

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

    `--public-ip-address ""`, ortak IP atanmasını önler. `--nsg ""`, NIC başına bir NSG oluşturmayı atlar (güvenliği alt ağ düzeyindeki NSG yönetir).

    **Yeniden üretilebilirlik:** Yukarıdaki komut Ubuntu görüntüsü için `latest` kullanır. Belirli bir sürümü sabitlemek için kullanılabilir sürümleri listeleyin ve `latest` yerine onu kullanın:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Azure Bastion oluşturun">
    Azure Bastion, ortak IP açığa çıkarmadan VM’e yönetilen SSH erişimi sağlar. CLI tabanlı `az network bastion ssh` için tünelleme destekli Standard SKU gereklidir.

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

    Bastion sağlama işlemi genellikle 5-10 dakika sürer ancak bazı bölgelerde 15-30 dakikaya kadar çıkabilir.

  </Step>
</Steps>

## OpenClaw’ı kurun

<Steps>
  <Step title="Azure Bastion üzerinden VM’e SSH ile bağlanın">
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

  <Step title="OpenClaw’ı kurun (VM kabuğunda)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    Yükleyici, Node LTS ve bağımlılıklar henüz yoksa onları kurar, OpenClaw’ı yükler ve onboarding sihirbazını başlatır. Ayrıntılar için [Install](/install) belgesine bakın.

  </Step>

  <Step title="Gateway’i doğrulayın">
    Onboarding tamamlandıktan sonra:

    ```bash
    openclaw gateway status
    ```

    Çoğu kurumsal Azure ekibinin zaten GitHub Copilot lisansları vardır. Sizin durumunuz da buysa, OpenClaw onboarding sihirbazında GitHub Copilot provider’ını seçmenizi öneririz. Bkz. [GitHub Copilot provider](/providers/github-copilot).

  </Step>
</Steps>

## Maliyet değerlendirmeleri

Azure Bastion Standard SKU yaklaşık **\$140/ay**, VM (Standard_B2as_v2) ise yaklaşık **\$55/ay** maliyete sahiptir.

Maliyetleri azaltmak için:

- **Kullanmadığınızda VM’i serbest bırakın (deallocate)** (işlem faturalaması durur; disk ücretleri sürer). VM serbest bırakılmışken OpenClaw Gateway’e ulaşılamaz — yeniden canlı kullanmanız gerektiğinde tekrar başlatın:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # daha sonra yeniden başlat
  ```

- **Gerekmediğinde Bastion’ı silin** ve SSH erişimine ihtiyaç duyduğunuzda yeniden oluşturun. Bastion en büyük maliyet bileşenidir ve sağlanması yalnızca birkaç dakika sürer.
- Yalnızca Portal tabanlı SSH gerekiyorsa ve CLI tünellemesine (`az network bastion ssh`) ihtiyacınız yoksa **Basic Bastion SKU** kullanın (~\$38/ay).

## Temizleme

Bu kılavuzun oluşturduğu tüm kaynakları silmek için:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Bu, kaynak grubunu ve içindeki her şeyi siler (VM, VNet, NSG, Bastion, ortak IP).

## Sonraki adımlar

- Mesajlaşma kanallarını kurun: [Channels](/tr/channels)
- Yerel cihazları düğüm olarak eşleyin: [Nodes](/nodes)
- Gateway’i yapılandırın: [Gateway configuration](/gateway/configuration)
- GitHub Copilot model provider ile OpenClaw Azure dağıtımı hakkında daha fazla ayrıntı için: [GitHub Copilot ile Azure üzerinde OpenClaw](https://github.com/johnsonshi/openclaw-azure-github-copilot)
