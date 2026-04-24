---
read_when:
    - OpenClaw’ın Azure üzerinde Ağ Güvenlik Grubu sağlamlaştırması ile 7/24 çalışmasını istiyorsunuz
    - Kendi Azure Linux VM’inizde üretim sınıfı, her zaman açık bir OpenClaw Gateway istiyorsunuz
    - Azure Bastion SSH ile güvenli yönetim istiyorsunuz
summary: OpenClaw Gateway’i kalıcı durumla bir Azure Linux VM üzerinde 7/24 çalıştırın
title: Azure
x-i18n:
    generated_at: "2026-04-24T09:14:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: e42e1a35e0340b959b73c548bc1efd6366bee38cf4c8cd23d986c5f14e5da0e0
    source_path: install/azure.md
    workflow: 15
---

# Azure Linux VM üzerinde OpenClaw

Bu kılavuz, Azure CLI ile bir Azure Linux VM kurar, Network Security Group (NSG) sağlamlaştırması uygular, SSH erişimi için Azure Bastion yapılandırır ve OpenClaw’ı kurar.

## Yapacaklarınız

- Azure CLI ile Azure ağ (VNet, alt ağlar, NSG) ve işlem kaynakları oluşturmak
- VM’ye SSH erişimine yalnızca Azure Bastion’dan izin verecek şekilde Network Security Group kuralları uygulamak
- SSH erişimi için Azure Bastion kullanmak (VM’de genel IP olmadan)
- Kurucu betiğiyle OpenClaw kurmak
- Gateway’i doğrulamak

## Gerekenler

- İşlem ve ağ kaynakları oluşturma iznine sahip bir Azure aboneliği
- Kurulu Azure CLI (gerekirse [Azure CLI kurulum adımları](https://learn.microsoft.com/cli/azure/install-azure-cli))
- Bir SSH anahtar çifti (gerekiyorsa bu kılavuz bir tane oluşturmayı kapsar)
- ~20-30 dakika

## Dağıtımı yapılandırın

<Steps>
  <Step title="Azure CLI’a giriş yapın">
    ```bash
    az login
    az extension add -n ssh
    ```

    Azure Bastion yerel SSH tünellemesi için `ssh` uzantısı gereklidir.

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

    Adları ve CIDR aralıklarını ortamınıza uyacak şekilde ayarlayın. Bastion alt ağı en az `/26` olmalıdır.

  </Step>

  <Step title="SSH anahtarını seçin">
    Varsa mevcut genel anahtarınızı kullanın:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Henüz SSH anahtarınız yoksa bir tane oluşturun:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="VM boyutu ve işletim sistemi disk boyutunu seçin">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    Aboneliğinizde ve bölgenizde kullanılabilir bir VM boyutu ve işletim sistemi disk boyutu seçin:

    - Hafif kullanım için daha küçük başlayın ve sonra büyütün
    - Daha ağır otomasyon, daha fazla kanal veya daha büyük model/araç iş yükleri için daha fazla vCPU/RAM/disk kullanın
    - Bir VM boyutu bölgenizde veya abonelik kotanızda yoksa en yakın uygun SKU’yu seçin

    Hedef bölgenizde mevcut VM boyutlarını listeleyin:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Geçerli vCPU ve disk kullanımınızı/kotanızı kontrol edin:

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

  <Step title="Network Security Group oluşturun">
    NSG’yi oluşturun ve yalnızca Bastion alt ağının VM’ye SSH ile bağlanabilmesi için kurallar ekleyin.

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # Yalnızca Bastion alt ağından SSH’ye izin ver
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # Genel internetten SSH’yi reddet
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # Diğer VNet kaynaklarından SSH’yi reddet
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    Kurallar önceliğe göre değerlendirilir (önce en küçük sayı): Bastion trafiğine 100’de izin verilir, sonra diğer tüm SSH 110 ve 120’de engellenir.

  </Step>

  <Step title="Sanal ağı ve alt ağları oluşturun">
    VNet’i VM alt ağıyla (NSG ekli) oluşturun, ardından Bastion alt ağını ekleyin.

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # NSG’yi VM alt ağına ekle
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

  <Step title="VM’yi oluşturun">
    VM’nin genel IP’si yoktur. SSH erişimi yalnızca Azure Bastion üzerinden yapılır.

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

    `--public-ip-address ""`, genel IP atanmasını engeller. `--nsg ""`, NIC başına NSG oluşturmayı atlar (güvenliği alt ağ düzeyindeki NSG yönetir).

    **Yeniden üretilebilirlik:** Yukarıdaki komut Ubuntu kalıbı için `latest` kullanır. Belirli bir sürümü sabitlemek için mevcut sürümleri listeleyin ve `latest` yerine onu koyun:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Azure Bastion oluşturun">
    Azure Bastion, genel IP açığa çıkarmadan VM’ye yönetilen SSH erişimi sağlar. CLI tabanlı `az network bastion ssh` için tünelleme özellikli Standard SKU gereklidir.

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

    Bastion sağlama işlemi genellikle 5-10 dakika sürer, ancak bazı bölgelerde 15-30 dakikaya kadar çıkabilir.

  </Step>
</Steps>

## OpenClaw’ı kurun

<Steps>
  <Step title="Azure Bastion üzerinden VM’ye SSH yapın">
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

    Kurucu, henüz yoksa Node LTS ve bağımlılıkları kurar, OpenClaw’ı kurar ve onboarding sihirbazını başlatır. Ayrıntılar için [Kurulum](/tr/install) sayfasına bakın.

  </Step>

  <Step title="Gateway’i doğrulayın">
    Onboarding tamamlandıktan sonra:

    ```bash
    openclaw gateway status
    ```

    Çoğu kurumsal Azure ekibinin zaten GitHub Copilot lisansları vardır. Sizin durumunuz buysa OpenClaw onboarding sihirbazında GitHub Copilot sağlayıcısını seçmenizi öneririz. Bkz. [GitHub Copilot sağlayıcısı](/tr/providers/github-copilot).

  </Step>
</Steps>

## Maliyet değerlendirmeleri

Azure Bastion Standard SKU yaklaşık **\$140/ay**, VM (Standard_B2as_v2) ise yaklaşık **\$55/ay** çalışır.

Maliyetleri azaltmak için:

- **Kullanmadığınızda VM’yi serbest bırakın** (işlem faturalandırması durur; disk ücretleri devam eder). VM serbest bırakıldığında OpenClaw Gateway’e erişilemez — tekrar canlı gerektiğinde yeniden başlatın:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # sonra yeniden başlat
  ```

- **Gerekmediğinde Bastion’ı silin** ve SSH erişimine ihtiyaç duyduğunuzda yeniden oluşturun. Bastion en büyük maliyet bileşenidir ve sağlanması yalnızca birkaç dakika sürer.
- Yalnızca Portal tabanlı SSH’ye ihtiyacınız varsa ve CLI tünellemesi (`az network bastion ssh`) gerekmiyorsa **Basic Bastion SKU** (~\$38/ay) kullanın.

## Temizleme

Bu kılavuzun oluşturduğu tüm kaynakları silmek için:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Bu, kaynak grubunu ve içindeki her şeyi kaldırır (VM, VNet, NSG, Bastion, genel IP).

## Sonraki adımlar

- Mesajlaşma kanallarını kurun: [Kanallar](/tr/channels)
- Yerel cihazları düğüm olarak eşleştirin: [Düğümler](/tr/nodes)
- Gateway’i yapılandırın: [Gateway yapılandırması](/tr/gateway/configuration)
- GitHub Copilot model sağlayıcısıyla OpenClaw Azure dağıtımı hakkında daha fazla ayrıntı için: [OpenClaw on Azure with GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## İlgili

- [Kuruluma genel bakış](/tr/install)
- [GCP](/tr/install/gcp)
- [DigitalOcean](/tr/install/digitalocean)
