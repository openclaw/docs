---
read_when:
    - Anda ingin OpenClaw berjalan 24/7 di Azure dengan penguatan Network Security Group
    - Anda menginginkan Gateway OpenClaw kelas produksi yang selalu aktif di VM Linux Azure milik Anda sendiri
    - Anda menginginkan administrasi yang aman dengan SSH Azure Bastion
summary: Jalankan Gateway OpenClaw 24/7 pada VM Linux Azure dengan status yang persisten
title: Azure
x-i18n:
    generated_at: "2026-07-12T14:18:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8598014cdc2786a47039ffb42ddd85354da9c87fd55ea46bb6dad7714171a14
    source_path: install/azure.md
    workflow: 16
---

Siapkan VM Linux Azure dengan Azure CLI, terapkan penguatan Network Security Group (NSG), konfigurasikan Azure Bastion untuk akses SSH, dan instal OpenClaw.

## Yang akan Anda lakukan

- Membuat sumber daya jaringan Azure (VNet, subnet, NSG) dan komputasi dengan Azure CLI
- Menerapkan aturan NSG agar SSH ke VM hanya diizinkan dari Azure Bastion
- Menggunakan Azure Bastion untuk akses SSH (tanpa alamat IP publik pada VM)
- Menginstal OpenClaw dengan skrip penginstal
- Memverifikasi Gateway

## Yang Anda perlukan

- Langganan Azure dengan izin untuk membuat sumber daya komputasi dan jaringan
- Azure CLI telah terinstal (lihat [langkah-langkah instalasi Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli))
- Sepasang kunci SSH (panduan ini mencakup cara membuatnya jika diperlukan)
- Sekitar 20–30 menit

## Mengonfigurasi penerapan

<Steps>
  <Step title="Masuk ke Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    Ekstensi `ssh` diperlukan untuk penerowongan SSH native Azure Bastion.

  </Step>

  <Step title="Daftarkan penyedia sumber daya yang diperlukan (satu kali)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Verifikasi pendaftaran; tunggu hingga keduanya menampilkan `Registered`.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Tetapkan variabel penerapan">
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

    Sesuaikan nama dan rentang CIDR agar cocok dengan lingkungan Anda. Subnet Bastion harus berukuran minimal `/26`.

  </Step>

  <Step title="Pilih kunci SSH">
    Gunakan kunci publik yang sudah ada jika Anda memilikinya:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Jika tidak, buat kunci baru:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Pilih ukuran VM dan ukuran disk OS">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    - Mulai dengan ukuran yang lebih kecil untuk penggunaan ringan dan tingkatkan nanti.
    - Gunakan lebih banyak vCPU/RAM/disk untuk otomatisasi yang lebih berat, lebih banyak saluran, atau beban kerja model/alat yang lebih besar.
    - Jika suatu ukuran tidak tersedia di wilayah atau kuota langganan Anda, pilih SKU tersedia yang paling mendekati.

    Cantumkan ukuran VM yang tersedia di wilayah target Anda:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Periksa penggunaan/kuota vCPU dan disk Anda saat ini:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Menerapkan sumber daya Azure

<Steps>
  <Step title="Buat grup sumber daya">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Buat grup keamanan jaringan">
    Buat NSG dan tambahkan aturan agar hanya subnet Bastion yang dapat menggunakan SSH untuk mengakses VM.

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # Izinkan SSH hanya dari subnet Bastion
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # Tolak SSH dari internet publik
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # Tolak SSH dari sumber VNet lainnya
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    Aturan dievaluasi berdasarkan prioritas, dimulai dari angka terendah: lalu lintas Bastion diizinkan pada prioritas 100, kemudian semua lalu lintas SSH lainnya diblokir pada prioritas 110 dan 120.

  </Step>

  <Step title="Buat jaringan virtual dan subnet">
    Buat VNet dengan subnet VM (NSG terpasang), lalu tambahkan subnet Bastion.

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # Pasang NSG ke subnet VM
    az network vnet subnet update \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n "${VM_SUBNET_NAME}" --nsg "${NSG_NAME}"

    # AzureBastionSubnet: nama persis ini diwajibkan oleh Azure
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="Buat VM">
    VM tidak mendapatkan alamat IP publik. Akses SSH dilakukan secara eksklusif melalui Azure Bastion.

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

    `--public-ip-address ""` mencegah penetapan alamat IP publik. `--nsg ""` melewati NSG per NIC karena NSG tingkat subnet sudah menangani keamanan.

    Untuk menetapkan versi citra Ubuntu tertentu sebagai pengganti `latest`, cantumkan versi yang tersedia terlebih dahulu:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Buat Azure Bastion">
    Azure Bastion menyediakan akses SSH terkelola tanpa mengekspos alamat IP publik pada VM. SKU Standard dengan penerowongan yang diaktifkan diperlukan untuk `az network bastion ssh` berbasis CLI.

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

    Penyediaan Bastion biasanya memerlukan waktu 5–10 menit, tetapi dapat memerlukan waktu hingga 15–30 menit di beberapa wilayah.

  </Step>
</Steps>

## Menginstal OpenClaw

<Steps>
  <Step title="Akses VM melalui SSH dengan Azure Bastion">
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

  <Step title="Instal OpenClaw (di shell VM)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    Penginstal menginstal Node dan dependensi jika belum tersedia, menginstal OpenClaw, dan memulai orientasi awal. Lihat [Instalasi](/id/install) untuk detailnya.

  </Step>

  <Step title="Verifikasi Gateway">
    Setelah orientasi awal selesai:

    ```bash
    openclaw gateway status
    ```

    Jika organisasi Anda sudah memiliki lisensi GitHub Copilot, Anda dapat memilih penyedia GitHub Copilot selama orientasi awal sebagai pengganti kunci API model terpisah. Lihat [penyedia GitHub Copilot](/id/providers/github-copilot).

  </Step>
</Steps>

## Pertimbangan biaya

Perkiraan biaya bulanan (verifikasi harga terkini di Azure Pricing Calculator karena tarif berbeda-beda menurut wilayah dan berubah seiring waktu):

- SKU Azure Bastion Standard: sekitar $140/bulan
- VM (`Standard_B2as_v2`): sekitar $55/bulan

Untuk mengurangi biaya:

- Batalkan alokasi VM saat tidak digunakan. Tindakan ini menghentikan penagihan komputasi (biaya disk tetap berlaku). Gateway tidak dapat diakses selama alokasi dibatalkan.

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # mulai ulang nanti
  ```

- Hapus Bastion saat tidak diperlukan dan buat ulang ketika Anda memerlukan akses SSH lagi; Bastion merupakan komponen biaya terbesar dan dapat disediakan dalam beberapa menit.
- Gunakan SKU Basic Bastion (sekitar $38/bulan) jika Anda hanya memerlukan SSH berbasis Portal dan tidak memerlukan penerowongan CLI (`az network bastion ssh`).

## Pembersihan

Hapus semua sumber daya yang dibuat oleh panduan ini:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Tindakan ini menghapus grup sumber daya dan semua yang ada di dalamnya (VM, VNet, NSG, Bastion, alamat IP publik).

## Langkah berikutnya

- Siapkan saluran perpesanan: [Saluran](/id/channels)
- Pasangkan perangkat lokal sebagai node: [Node](/id/nodes)
- Konfigurasikan Gateway: [Konfigurasi Gateway](/id/gateway/configuration)
- Detail selengkapnya tentang penerapan Azure dengan penyedia model GitHub Copilot: [OpenClaw di Azure dengan GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Terkait

- [Ikhtisar instalasi](/id/install)
- [GCP](/id/install/gcp)
- [DigitalOcean](/id/install/digitalocean)
