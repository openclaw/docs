---
read_when:
    - Anda ingin OpenClaw berjalan 24/7 di Azure dengan penguatan Network Security Group
    - Anda menginginkan OpenClaw Gateway kelas produksi yang selalu aktif di Azure Linux VM milik Anda sendiri
    - Anda menginginkan administrasi yang aman dengan SSH Azure Bastion
summary: Jalankan OpenClaw Gateway 24/7 di VM Azure Linux dengan status persisten
title: Azure
x-i18n:
    generated_at: "2026-05-06T09:16:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ab1b7d09dd66c495983aebd4766ce760d659cc6f362bbcd999d1c1345ae38f7
    source_path: install/azure.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Panduan ini menyiapkan VM Azure Linux dengan Azure CLI, menerapkan pengerasan Network Security Group (NSG), mengonfigurasi Azure Bastion untuk akses SSH, dan menginstal OpenClaw.

## Yang akan Anda lakukan

- Membuat jaringan Azure (VNet, subnet, NSG) dan sumber daya komputasi dengan Azure CLI
- Menerapkan aturan Network Security Group agar SSH VM hanya diizinkan dari Azure Bastion
- Menggunakan Azure Bastion untuk akses SSH (tanpa IP publik pada VM)
- Menginstal OpenClaw dengan skrip penginstal
- Memverifikasi Gateway

## Yang Anda perlukan

- Langganan Azure dengan izin untuk membuat sumber daya komputasi dan jaringan
- Azure CLI terinstal (lihat [langkah instalasi Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) jika diperlukan)
- Pasangan kunci SSH (panduan ini mencakup cara membuatnya jika diperlukan)
- ~20-30 menit

## Konfigurasikan penerapan

<Steps>
  <Step title="Masuk ke Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    Ekstensi `ssh` diperlukan untuk tunneling SSH native Azure Bastion.

  </Step>

  <Step title="Daftarkan penyedia sumber daya yang diperlukan (satu kali)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Verifikasi pendaftaran. Tunggu hingga keduanya menampilkan `Registered`.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Atur variabel penerapan">
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

    Sesuaikan nama dan rentang CIDR agar cocok dengan lingkungan Anda. Subnet Bastion harus minimal `/26`.

  </Step>

  <Step title="Pilih kunci SSH">
    Gunakan kunci publik yang sudah ada jika Anda memilikinya:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Jika Anda belum memiliki kunci SSH, buat satu:

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

    Pilih ukuran VM dan ukuran disk OS yang tersedia di langganan dan wilayah Anda:

    - Mulai dari yang lebih kecil untuk penggunaan ringan dan tingkatkan nanti
    - Gunakan lebih banyak vCPU/RAM/disk untuk otomatisasi yang lebih berat, lebih banyak kanal, atau beban kerja model/alat yang lebih besar
    - Jika ukuran VM tidak tersedia di wilayah atau kuota langganan Anda, pilih SKU terdekat yang tersedia

    Daftar ukuran VM yang tersedia di wilayah target Anda:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Periksa penggunaan/kuota vCPU dan disk Anda saat ini:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Terapkan sumber daya Azure

<Steps>
  <Step title="Buat grup sumber daya">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Buat network security group">
    Buat NSG dan tambahkan aturan agar hanya subnet Bastion yang dapat melakukan SSH ke VM.

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

    Aturan dievaluasi berdasarkan prioritas (angka terendah terlebih dahulu): lalu lintas Bastion diizinkan pada 100, lalu semua SSH lainnya diblokir pada 110 dan 120.

  </Step>

  <Step title="Buat virtual network dan subnet">
    Buat VNet dengan subnet VM (NSG terpasang), lalu tambahkan subnet Bastion.

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

  <Step title="Buat VM">
    VM tidak memiliki IP publik. Akses SSH sepenuhnya melalui Azure Bastion.

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

    `--public-ip-address ""` mencegah IP publik ditetapkan. `--nsg ""` melewati pembuatan NSG per NIC (NSG tingkat subnet menangani keamanan).

    **Reprodusibilitas:** Perintah di atas menggunakan `latest` untuk citra Ubuntu. Untuk mengunci versi tertentu, tampilkan versi yang tersedia dan ganti `latest`:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Buat Azure Bastion">
    Azure Bastion menyediakan akses SSH terkelola ke VM tanpa mengekspos IP publik. SKU Standard dengan tunneling diperlukan untuk `az network bastion ssh` berbasis CLI.

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

    Penyediaan Bastion biasanya memerlukan 5-10 menit, tetapi dapat memerlukan hingga 15-30 menit di beberapa wilayah.

  </Step>
</Steps>

## Instal OpenClaw

<Steps>
  <Step title="SSH ke VM melalui Azure Bastion">
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

    Penginstal menginstal Node LTS dan dependensi jika belum ada, menginstal OpenClaw, dan meluncurkan wizard onboarding. Lihat [Instal](/id/install) untuk detail.

  </Step>

  <Step title="Verifikasi Gateway">
    Setelah onboarding selesai:

    ```bash
    openclaw gateway status
    ```

    Sebagian besar tim Azure perusahaan sudah memiliki lisensi GitHub Copilot. Jika demikian, kami menyarankan memilih penyedia GitHub Copilot di wizard onboarding OpenClaw. Lihat [penyedia GitHub Copilot](/id/providers/github-copilot).

  </Step>
</Steps>

## Pertimbangan biaya

Azure Bastion SKU Standard berjalan sekitar **\$140/bulan** dan VM (Standard_B2as_v2) berjalan sekitar **\$55/bulan**.

Untuk mengurangi biaya:

- **Deallocate VM** saat tidak digunakan (menghentikan penagihan komputasi; biaya disk tetap ada). Gateway OpenClaw tidak akan dapat dijangkau saat VM didealokasikan — mulai ulang saat Anda perlu mengaktifkannya kembali:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- **Hapus Bastion saat tidak diperlukan** dan buat ulang saat Anda memerlukan akses SSH. Bastion adalah komponen biaya terbesar dan hanya memerlukan beberapa menit untuk disediakan.
- **Gunakan SKU Basic Bastion** (~\$38/bulan) jika Anda hanya memerlukan SSH berbasis Portal dan tidak memerlukan tunneling CLI (`az network bastion ssh`).

## Pembersihan

Untuk menghapus semua sumber daya yang dibuat oleh panduan ini:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Ini menghapus grup sumber daya dan semua yang ada di dalamnya (VM, VNet, NSG, Bastion, IP publik).

## Langkah berikutnya

- Siapkan kanal perpesanan: [Kanal](/id/channels)
- Pasangkan perangkat lokal sebagai Node: [Node](/id/nodes)
- Konfigurasikan Gateway: [Konfigurasi Gateway](/id/gateway/configuration)
- Untuk detail selengkapnya tentang penerapan OpenClaw Azure dengan penyedia model GitHub Copilot: [OpenClaw di Azure dengan GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Terkait

- [Ringkasan instalasi](/id/install)
- [GCP](/id/install/gcp)
- [DigitalOcean](/id/install/digitalocean)
