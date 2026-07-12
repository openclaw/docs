---
read_when:
    - OpenClaw'ın Azure üzerinde Ağ Güvenlik Grubu ile güçlendirilmiş olarak 7/24 çalışmasını istiyorsunuz
    - Kendi Azure Linux sanal makinenizde üretim düzeyinde, kesintisiz çalışan bir OpenClaw Gateway istiyorsunuz
    - Azure Bastion SSH ile güvenli yönetim istiyorsunuz
summary: Kalıcı durumla OpenClaw Gateway'i bir Azure Linux sanal makinesinde 7/24 çalıştırın
title: Azure
x-i18n:
    generated_at: "2026-07-12T11:52:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8598014cdc2786a47039ffb42ddd85354da9c87fd55ea46bb6dad7714171a14
    source_path: install/azure.md
    workflow: 16
---

Azure CLI ile bir Azure Linux VM kurun, Ağ Güvenlik Grubu (NSG) sıkılaştırmasını uygulayın, SSH erişimi için Azure Bastion'ı yapılandırın ve OpenClaw'u yükleyin.

## Yapacaklarınız

- Azure CLI ile Azure ağ (VNet, alt ağlar, NSG) ve işlem kaynakları oluşturma
- VM'ye SSH erişimine yalnızca Azure Bastion üzerinden izin verecek NSG kuralları uygulama
- SSH erişimi için Azure Bastion'ı kullanma (VM'de genel IP olmadan)
- Yükleyici betiğiyle OpenClaw'u yükleme
- Gateway'i doğrulama

## Gereksinimler

- İşlem ve ağ kaynakları oluşturma iznine sahip bir Azure aboneliği
- Azure CLI'ın yüklü olması (bkz. [Azure CLI yükleme adımları](https://learn.microsoft.com/cli/azure/install-azure-cli))
- Bir SSH anahtar çifti (gerekiyorsa bu kılavuzda nasıl oluşturulacağı açıklanmaktadır)
- Yaklaşık 20-30 dakika

## Dağıtımı yapılandırma

<Steps>
  <Step title="Azure CLI'da oturum açın">
    ```bash
    az login
    az extension add -n ssh
    ```

    Azure Bastion yerel SSH tünellemesi için `ssh` uzantısı gereklidir.

  </Step>

  <Step title="Gerekli kaynak sağlayıcılarını kaydedin (bir kez)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Kaydı doğrulayın; her ikisi de `Registered` gösterene kadar bekleyin.

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

    Adları ve CIDR aralıklarını ortamınıza uygun şekilde ayarlayın. Bastion alt ağı en az `/26` olmalıdır.

  </Step>

  <Step title="Bir SSH anahtarı seçin">
    Varsa mevcut genel anahtarınızı kullanın:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Aksi takdirde bir tane oluşturun:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="VM boyutunu ve işletim sistemi disk boyutunu seçin">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    - Hafif kullanım için daha küçük bir boyutla başlayın ve daha sonra ölçeklendirin.
    - Daha yoğun otomasyon, daha fazla kanal veya daha büyük model/araç iş yükleri için daha fazla vCPU/RAM/disk kullanın.
    - Bölgenizde veya abonelik kotanızda bir boyut kullanılamıyorsa mevcut en yakın SKU'yu seçin.

    Hedef bölgenizde kullanılabilen VM boyutlarını listeleyin:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Mevcut vCPU ve disk kullanımınızı/kotanızı denetleyin:

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

  <Step title="Ağ güvenlik grubunu oluşturun">
    NSG'yi oluşturun ve yalnızca Bastion alt ağının VM'ye SSH ile bağlanabilmesini sağlayan kuralları ekleyin.

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # Yalnızca Bastion alt ağından SSH erişimine izin ver
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # Genel internetten SSH erişimini reddet
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # Diğer VNet kaynaklarından SSH erişimini reddet
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    Kurallar önceliğe göre, en düşük numaradan başlanarak değerlendirilir: Bastion trafiğine 100 önceliğinde izin verilir, ardından diğer tüm SSH trafiği 110 ve 120 önceliklerinde engellenir.

  </Step>

  <Step title="Sanal ağı ve alt ağları oluşturun">
    VM alt ağı (NSG bağlı olarak) ile VNet'i oluşturun, ardından Bastion alt ağını ekleyin.

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

    # AzureBastionSubnet: Azure bu tam adı gerektirir
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="VM'yi oluşturun">
    VM'ye genel IP atanmaz. SSH erişimi yalnızca Azure Bastion üzerinden sağlanır.

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

    `--public-ip-address ""`, genel IP atanmasını önler. Alt ağ düzeyindeki NSG güvenliği zaten yönettiğinden `--nsg ""`, NIC başına NSG oluşturulmasını atlar.

    `latest` yerine belirli bir Ubuntu görüntüsü sürümünü sabitlemek için önce kullanılabilir sürümleri listeleyin:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Azure Bastion'ı oluşturun">
    Azure Bastion, VM'de genel IP açığa çıkarmadan yönetilen SSH erişimi sağlar. CLI tabanlı `az network bastion ssh` için tünelleme etkinleştirilmiş Standard SKU gereklidir.

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

    Bastion'ın hazırlanması genellikle 5-10 dakika sürer, ancak bazı bölgelerde 15-30 dakikaya kadar çıkabilir.

  </Step>
</Steps>

## OpenClaw'u yükleme

<Steps>
  <Step title="Azure Bastion üzerinden VM'ye SSH ile bağlanın">
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

  <Step title="OpenClaw'u yükleyin (VM kabuğunda)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    Yükleyici, henüz mevcut değillerse Node'u ve bağımlılıkları yükler, OpenClaw'u kurar ve ilk yapılandırmayı başlatır. Ayrıntılar için [Yükleme](/tr/install) bölümüne bakın.

  </Step>

  <Step title="Gateway'i doğrulayın">
    İlk yapılandırma tamamlandıktan sonra:

    ```bash
    openclaw gateway status
    ```

    Kuruluşunuzda zaten GitHub Copilot lisansları varsa ilk yapılandırma sırasında ayrı bir model API anahtarı yerine GitHub Copilot sağlayıcısını seçebilirsiniz. Bkz. [GitHub Copilot sağlayıcısı](/tr/providers/github-copilot).

  </Step>
</Steps>

## Maliyet değerlendirmeleri

Yaklaşık aylık maliyetler (ücretler bölgeye göre değiştiğinden ve zaman içinde güncellendiğinden Azure Fiyatlandırma Hesaplayıcısı'ndaki güncel fiyatları doğrulayın):

- Azure Bastion Standard SKU: yaklaşık 140 ABD doları/ay
- VM (`Standard_B2as_v2`): yaklaşık 55 ABD doları/ay

Maliyetleri azaltmak için:

- Kullanılmadığında VM'nin ayırmasını kaldırın. Bu işlem, işlem ücretlendirmesini durdurur (disk ücretleri devam eder). Ayırması kaldırılmış durumdayken Gateway'e erişilemez.

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # daha sonra yeniden başlat
  ```

- Bastion'a ihtiyaç olmadığında onu silin ve yeniden SSH erişimine ihtiyaç duyduğunuzda tekrar oluşturun; en büyük maliyet bileşenidir ve birkaç dakika içinde hazırlanır.
- Yalnızca Portal tabanlı SSH'ye ihtiyacınız varsa ve CLI tünellemesine (`az network bastion ssh`) ihtiyacınız yoksa Basic Bastion SKU'yu (yaklaşık 38 ABD doları/ay) kullanın.

## Temizleme

Bu kılavuz tarafından oluşturulan tüm kaynakları silin:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Bu işlem kaynak grubunu ve içindeki her şeyi (VM, VNet, NSG, Bastion, genel IP) kaldırır.

## Sonraki adımlar

- Mesajlaşma kanallarını ayarlayın: [Kanallar](/tr/channels)
- Yerel cihazları Node olarak eşleştirin: [Node'lar](/tr/nodes)
- Gateway'i yapılandırın: [Gateway yapılandırması](/tr/gateway/configuration)
- GitHub Copilot model sağlayıcısıyla Azure dağıtımı hakkında daha fazla bilgi: [GitHub Copilot ile Azure'da OpenClaw](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## İlgili

- [Yüklemeye genel bakış](/tr/install)
- [GCP](/tr/install/gcp)
- [DigitalOcean](/tr/install/digitalocean)
