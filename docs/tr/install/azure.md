---
read_when:
    - OpenClaw'ı Azure'da Network Security Group sıkılaştırmasıyla 7/24 çalıştırmak istiyorsunuz
    - Kendi Azure Linux VM'nizde üretim düzeyinde, her zaman açık bir OpenClaw Gateway istiyorsunuz
    - Azure Bastion SSH ile güvenli yönetim istiyorsunuz
summary: OpenClaw Gateway'i kalıcı durumla bir Azure Linux VM üzerinde 7/24 çalıştırın
title: Azure
x-i18n:
    generated_at: "2026-05-06T09:17:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ab1b7d09dd66c495983aebd4766ce760d659cc6f362bbcd999d1c1345ae38f7
    source_path: install/azure.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Bu kılavuz, Azure CLI ile bir Azure Linux VM kurar, Network Security Group (NSG) sıkılaştırması uygular, SSH erişimi için Azure Bastion yapılandırır ve OpenClaw yükler.

## Yapacaklarınız

- Azure CLI ile Azure ağını (VNet, alt ağlar, NSG) ve işlem kaynaklarını oluşturma
- VM SSH erişimine yalnızca Azure Bastion üzerinden izin verilecek şekilde Network Security Group kurallarını uygulama
- SSH erişimi için Azure Bastion kullanma (VM üzerinde genel IP yok)
- Yükleyici betiğiyle OpenClaw yükleme
- Gateway’i doğrulama

## Gerekenler

- İşlem ve ağ kaynakları oluşturma iznine sahip bir Azure aboneliği
- Azure CLI yüklü (gerekirse [Azure CLI yükleme adımlarına](https://learn.microsoft.com/cli/azure/install-azure-cli) bakın)
- Bir SSH anahtar çifti (gerekirse kılavuz bir tane oluşturmayı kapsar)
- ~20-30 dakika

## Dağıtımı yapılandırma

<Steps>
  <Step title="Azure CLI’da oturum açın">
    ```bash
    az login
    az extension add -n ssh
    ```

    `ssh` uzantısı, Azure Bastion yerel SSH tünellemesi için gereklidir.

  </Step>

  <Step title="Gerekli kaynak sağlayıcılarını kaydedin (bir kerelik)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Kaydı doğrulayın. İkisi de `Registered` gösterene kadar bekleyin.

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

  <Step title="SSH anahtarı seçin">
    Varsa mevcut genel anahtarınızı kullanın:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Henüz bir SSH anahtarınız yoksa bir tane oluşturun:

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

    Aboneliğinizde ve bölgenizde kullanılabilir bir VM boyutu ve OS disk boyutu seçin:

    - Hafif kullanım için daha küçük başlayın ve daha sonra ölçek büyütün
    - Daha ağır otomasyon, daha fazla kanal veya daha büyük model/araç iş yükleri için daha fazla vCPU/RAM/disk kullanın
    - Bir VM boyutu bölgenizde veya abonelik kotanızda kullanılamıyorsa, kullanılabilir en yakın SKU’yu seçin

    Hedef bölgenizde kullanılabilir VM boyutlarını listeleyin:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Geçerli vCPU ve disk kullanımınızı/kotanızı kontrol edin:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Azure kaynaklarını dağıtma

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

    Kurallar önceliğe göre değerlendirilir (en düşük sayı önce): Bastion trafiğine 100’de izin verilir, ardından diğer tüm SSH erişimi 110 ve 120’de engellenir.

  </Step>

  <Step title="Sanal ağı ve alt ağları oluşturun">
    VM alt ağıyla (NSG bağlı) VNet’i oluşturun, ardından Bastion alt ağını ekleyin.

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

    `--public-ip-address ""` genel IP atanmasını engeller. `--nsg ""` NIC başına NSG oluşturmayı atlar (güvenliği alt ağ düzeyindeki NSG sağlar).

    **Yeniden üretilebilirlik:** Yukarıdaki komut, Ubuntu imajı için `latest` kullanır. Belirli bir sürümü sabitlemek için kullanılabilir sürümleri listeleyin ve `latest` değerini değiştirin:

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

    Bastion hazırlama genellikle 5-10 dakika sürer, ancak bazı bölgelerde 15-30 dakikaya kadar sürebilir.

  </Step>
</Steps>

## OpenClaw yükleme

<Steps>
  <Step title="Azure Bastion üzerinden VM’ye SSH ile bağlanın">
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

  <Step title="OpenClaw yükleyin (VM kabuğunda)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    Yükleyici, henüz mevcut değilse Node LTS ve bağımlılıkları yükler, OpenClaw’u yükler ve ilk kurulum sihirbazını başlatır. Ayrıntılar için [Yükleme](/tr/install) bölümüne bakın.

  </Step>

  <Step title="Gateway’i doğrulayın">
    İlk kurulum tamamlandıktan sonra:

    ```bash
    openclaw gateway status
    ```

    Çoğu kurumsal Azure ekibinin zaten GitHub Copilot lisansları vardır. Durumunuz buysa, OpenClaw ilk kurulum sihirbazında GitHub Copilot sağlayıcısını seçmenizi öneririz. [GitHub Copilot sağlayıcısı](/tr/providers/github-copilot) bölümüne bakın.

  </Step>
</Steps>

## Maliyet değerlendirmeleri

Azure Bastion Standard SKU yaklaşık **\$140/ay**, VM (Standard_B2as_v2) ise yaklaşık **\$55/ay** maliyetle çalışır.

Maliyetleri azaltmak için:

- **VM’yi ayırın** kullanılmadığında (işlem faturalandırmasını durdurur; disk ücretleri devam eder). VM ayrılmış durumdayken OpenClaw Gateway’e erişilemez; tekrar canlı ihtiyacınız olduğunda yeniden başlatın:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- **Gerekmediğinde Bastion’ı silin** ve SSH erişimine ihtiyacınız olduğunda yeniden oluşturun. Bastion en büyük maliyet bileşenidir ve hazırlanması yalnızca birkaç dakika sürer.
- Yalnızca Portal tabanlı SSH gerekiyorsa ve CLI tünellemesi (`az network bastion ssh`) gerekmiyorsa **Basic Bastion SKU’yu** (~\$38/ay) kullanın.

## Temizleme

Bu kılavuz tarafından oluşturulan tüm kaynakları silmek için:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Bu işlem kaynak grubunu ve içindeki her şeyi (VM, VNet, NSG, Bastion, genel IP) kaldırır.

## Sonraki adımlar

- Mesajlaşma kanallarını ayarlayın: [Kanallar](/tr/channels)
- Yerel cihazları Node olarak eşleyin: [Nodes](/tr/nodes)
- Gateway’i yapılandırın: [Gateway yapılandırması](/tr/gateway/configuration)
- GitHub Copilot model sağlayıcısıyla OpenClaw Azure dağıtımı hakkında daha fazla ayrıntı için: [GitHub Copilot ile Azure üzerinde OpenClaw](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## İlgili

- [Yüklemeye genel bakış](/tr/install)
- [GCP](/tr/install/gcp)
- [DigitalOcean](/tr/install/digitalocean)
