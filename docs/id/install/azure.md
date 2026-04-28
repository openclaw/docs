---
read_when:
    - Anda ingin OpenClaw berjalan 24/7 di Azure dengan hardening Network Security Group
    - Anda menginginkan Gateway OpenClaw yang selalu aktif dan siap produksi di Azure Linux VM milik Anda sendiri
    - Anda menginginkan administrasi yang aman dengan SSH Azure Bastion
summary: Jalankan Gateway OpenClaw 24/7 di Azure Linux VM dengan status yang persisten
title: Azure
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T09:12:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: e42e1a35e0340b959b73c548bc1efd6366bee38cf4c8cd23d986c5f14e5da0e0
    source_path: install/azure.md
    workflow: 15
---

# OpenClaw di Azure Linux VM

Panduan ini menyiapkan Azure Linux VM dengan Azure CLI, menerapkan hardening Network Security Group (NSG), mengonfigurasi Azure Bastion untuk akses SSH, dan memasang OpenClaw.

## Yang akan Anda lakukan

- Membuat resource jaringan Azure (VNet, subnet, NSG) dan komputasi dengan Azure CLI
- Menerapkan aturan Network Security Group sehingga SSH VM hanya diizinkan dari Azure Bastion
- Menggunakan Azure Bastion untuk akses SSH (tanpa IP publik pada VM)
- Memasang OpenClaw dengan skrip installer
- Memverifikasi Gateway

## Yang Anda butuhkan

- Langganan Azure dengan izin untuk membuat resource komputasi dan jaringan
- Azure CLI terpasang (lihat [langkah pemasangan Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) bila diperlukan)
- Sepasang kunci SSH (panduan ini mencakup pembuatan jika diperlukan)
- ~20-30 menit

## Konfigurasikan deployment

<Steps>
  <Step title="Masuk ke Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    Ekstensi `ssh` diperlukan untuk tunneling SSH native Azure Bastion.

  </Step>

  <Step title="Daftarkan provider resource yang diperlukan (sekali saja)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Verifikasi pendaftaran. Tunggu sampai keduanya menampilkan `Registered`.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Tetapkan variabel deployment">
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

    Sesuaikan nama dan rentang CIDR agar sesuai dengan environment Anda. Subnet Bastion harus minimal `/26`.

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

    Pilih ukuran VM dan ukuran disk OS yang tersedia pada langganan dan region Anda:

    - Mulai dari yang lebih kecil untuk penggunaan ringan dan tingkatkan nanti
    - Gunakan lebih banyak vCPU/RAM/disk untuk otomatisasi yang lebih berat, lebih banyak channel, atau beban kerja model/alat yang lebih besar
    - Jika ukuran VM tidak tersedia di region atau kuota langganan Anda, pilih SKU terdekat yang tersedia

    Daftar ukuran VM yang tersedia di region target Anda:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Periksa penggunaan/kuota vCPU dan disk Anda saat ini:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Deploy resource Azure

<Steps>
  <Step title="Buat resource group">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Buat network security group">
    Buat NSG dan tambahkan aturan agar hanya subnet Bastion yang dapat SSH ke VM.

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

    # Tolak SSH dari sumber VNet lain
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    Aturan dievaluasi berdasarkan prioritas (angka terkecil lebih dulu): lalu lintas Bastion diizinkan pada 100, lalu semua SSH lain diblokir pada 110 dan 120.

  </Step>

  <Step title="Buat virtual network dan subnet">
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

    # AzureBastionSubnet — nama ini diwajibkan oleh Azure
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="Buat VM">
    VM tidak memiliki IP publik. Akses SSH dilakukan secara eksklusif melalui Azure Bastion.

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

    `--public-ip-address ""` mencegah IP publik ditetapkan. `--nsg ""` melewati pembuatan NSG per-NIC (NSG tingkat subnet menangani keamanan).

    **Reproduksibilitas:** Perintah di atas menggunakan `latest` untuk image Ubuntu. Untuk menyematkan versi tertentu, daftar versi yang tersedia lalu ganti `latest`:

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

    Provisioning Bastion biasanya memakan waktu 5-10 menit tetapi bisa sampai 15-30 menit di beberapa region.

  </Step>
</Steps>

## Pasang OpenClaw

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

  <Step title="Pasang OpenClaw (di shell VM)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    Installer memasang Node LTS dan dependensi jika belum ada, memasang OpenClaw, dan meluncurkan wizard onboarding. Lihat [Install](/id/install) untuk detailnya.

  </Step>

  <Step title="Verifikasi Gateway">
    Setelah onboarding selesai:

    ```bash
    openclaw gateway status
    ```

    Sebagian besar tim enterprise Azure sudah memiliki lisensi GitHub Copilot. Jika itu kasus Anda, kami merekomendasikan memilih provider GitHub Copilot di wizard onboarding OpenClaw. Lihat [provider GitHub Copilot](/id/providers/github-copilot).

  </Step>
</Steps>

## Pertimbangan biaya

Azure Bastion Standard SKU berjalan sekitar **\$140/bulan** dan VM (Standard_B2as_v2) berjalan sekitar **\$55/bulan**.

Untuk mengurangi biaya:

- **Deallocate VM** saat tidak digunakan (menghentikan penagihan komputasi; biaya disk tetap ada). Gateway OpenClaw tidak akan dapat dijangkau saat VM dideallocate — mulai lagi saat Anda membutuhkannya aktif:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # mulai lagi nanti
  ```

- **Hapus Bastion saat tidak diperlukan** dan buat ulang saat Anda membutuhkan akses SSH. Bastion adalah komponen biaya terbesar dan hanya memerlukan beberapa menit untuk provisioning.
- **Gunakan Basic Bastion SKU** (~\$38/bulan) jika Anda hanya memerlukan SSH berbasis Portal dan tidak memerlukan tunneling CLI (`az network bastion ssh`).

## Pembersihan

Untuk menghapus semua resource yang dibuat oleh panduan ini:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Ini menghapus resource group dan semua yang ada di dalamnya (VM, VNet, NSG, Bastion, IP publik).

## Langkah selanjutnya

- Siapkan channel pesan: [Channels](/id/channels)
- Pair perangkat lokal sebagai node: [Nodes](/id/nodes)
- Konfigurasikan Gateway: [Konfigurasi Gateway](/id/gateway/configuration)
- Untuk detail lebih lanjut tentang deployment OpenClaw di Azure dengan provider model GitHub Copilot: [OpenClaw on Azure with GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Terkait

- [Ikhtisar instalasi](/id/install)
- [GCP](/id/install/gcp)
- [DigitalOcean](/id/install/digitalocean)
