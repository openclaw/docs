---
read_when:
- You want OpenClaw running 24/7 on Azure with Network Security Group hardening
- คุณต้องการ OpenClaw Gateway ระดับ production ที่เปิดทำงานตลอดเวลาบน Azure Linux
  VM ของคุณเอง
- คุณต้องการการดูแลระบบที่ปลอดภัยด้วย Azure Bastion SSH
summary: รัน OpenClaw Gateway ตลอด 24/7 บน Azure Linux VM พร้อม state ที่คงทนถาวร
title: Azure
x-i18n:
  generated_at: '2026-04-24T09:15:59Z'
  model: gpt-5.4
  provider: openai
  source_hash: e42e1a35e0340b959b73c548bc1efd6366bee38cf4c8cd23d986c5f14e5da0e0
  source_path: install/azure.md
  workflow: 15
---

# OpenClaw บน Azure Linux VM

คู่มือนี้จะตั้งค่า Azure Linux VM ด้วย Azure CLI ใช้การทำให้ Network Security Group (NSG) แข็งแกร่งขึ้น กำหนดค่า Azure Bastion สำหรับการเข้าถึง SSH และติดตั้ง OpenClaw

## สิ่งที่คุณจะทำ

- สร้างทรัพยากรเครือข่าย Azure (VNet, subnets, NSG) และทรัพยากรคอมพิวต์ด้วย Azure CLI
- ใช้กฎ Network Security Group เพื่ออนุญาต SSH ไปยัง VM ได้เฉพาะจาก Azure Bastion
- ใช้ Azure Bastion สำหรับการเข้าถึง SSH (VM จะไม่มี public IP)
- ติดตั้ง OpenClaw ด้วยสคริปต์ติดตั้ง
- ตรวจสอบ Gateway

## สิ่งที่คุณต้องมี

- Azure subscription ที่มีสิทธิ์สร้างทรัพยากร compute และ network
- ติดตั้ง Azure CLI แล้ว (ดู [ขั้นตอนติดตั้ง Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) หากจำเป็น)
- คู่คีย์ SSH (คู่มือนี้ครอบคลุมการสร้างหากคุณยังไม่มี)
- เวลาประมาณ 20-30 นาที

## กำหนดค่าการติดตั้งใช้งาน

<Steps>
  <Step title="ลงชื่อเข้าใช้ Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    ส่วนขยาย `ssh` จำเป็นสำหรับการทำ SSH tunneling แบบ native ของ Azure Bastion

  </Step>

  <Step title="ลงทะเบียน resource provider ที่จำเป็น (ครั้งเดียว)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    ตรวจสอบการลงทะเบียน รอจนทั้งสองรายการแสดง `Registered`

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="ตั้งค่าตัวแปรสำหรับการติดตั้งใช้งาน">
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

    ปรับชื่อและช่วง CIDR ให้เหมาะกับสภาพแวดล้อมของคุณ Bastion subnet ต้องมีขนาดอย่างน้อย `/26`

  </Step>

  <Step title="เลือกคีย์ SSH">
    ใช้ public key ที่มีอยู่ของคุณหากมีอยู่แล้ว:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    หากคุณยังไม่มีคีย์ SSH ให้สร้างใหม่:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="เลือกขนาด VM และขนาดดิสก์ OS">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    เลือกขนาด VM และขนาดดิสก์ OS ที่มีให้ใช้ใน subscription และ region ของคุณ:

    - เริ่มจากขนาดเล็กสำหรับการใช้งานเบา และค่อยขยายภายหลัง
    - ใช้ vCPU/RAM/disk มากขึ้นสำหรับงานอัตโนมัติที่หนักขึ้น ช่องทางมากขึ้น หรือเวิร์กโหลดโมเดล/เครื่องมือขนาดใหญ่
    - หากขนาด VM ใช้ไม่ได้ใน region ของคุณหรือเกิน quota ของ subscription ให้เลือก SKU ที่ใกล้เคียงที่สุดที่มีให้ใช้

    แสดงรายการขนาด VM ที่มีใน region เป้าหมาย:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    ตรวจสอบการใช้งาน/quota ของ vCPU และดิสก์ในปัจจุบัน:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## ติดตั้งทรัพยากร Azure

<Steps>
  <Step title="สร้าง resource group">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="สร้าง network security group">
    สร้าง NSG และเพิ่มกฎเพื่อให้เฉพาะ Bastion subnet เท่านั้นที่สามารถ SSH เข้า VM ได้

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

    กฎจะถูกประเมินตามลำดับความสำคัญ (ตัวเลขต่ำกว่าก่อน): ทราฟฟิกจาก Bastion จะได้รับอนุญาตที่ 100 จากนั้น SSH อื่นทั้งหมดจะถูกบล็อกที่ 110 และ 120

  </Step>

  <Step title="สร้าง virtual network และ subnets">
    สร้าง VNet พร้อม VM subnet (แนบ NSG แล้ว) จากนั้นเพิ่ม Bastion subnet

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

  <Step title="สร้าง VM">
    VM จะไม่มี public IP การเข้าถึง SSH จะทำผ่าน Azure Bastion เท่านั้น

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

    `--public-ip-address ""` ป้องกันไม่ให้มีการกำหนด public IP `--nsg ""` จะข้ามการสร้าง NSG ระดับ NIC แยกต่างหาก (NSG ระดับ subnet จะจัดการความปลอดภัยแทน)

    **ความสามารถในการทำซ้ำ:** คำสั่งด้านบนใช้ `latest` สำหรับอิมเมจ Ubuntu หากต้องการปักหมุดเวอร์ชันเฉพาะ ให้แสดงรายการเวอร์ชันที่มีแล้วแทน `latest`:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="สร้าง Azure Bastion">
    Azure Bastion ให้การเข้าถึง SSH แบบมีการจัดการไปยัง VM โดยไม่ต้องเปิดเผย public IP จำเป็นต้องใช้ Standard SKU พร้อม tunneling สำหรับ `az network bastion ssh` แบบอิง CLI

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

    โดยทั่วไปการ provision Bastion ใช้เวลา 5-10 นาที แต่ในบาง region อาจใช้เวลาถึง 15-30 นาที

  </Step>
</Steps>

## ติดตั้ง OpenClaw

<Steps>
  <Step title="SSH เข้า VM ผ่าน Azure Bastion">
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

  <Step title="ติดตั้ง OpenClaw (ใน shell ของ VM)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    ตัวติดตั้งจะติดตั้ง Node LTS และ dependencies หากยังไม่มี ติดตั้ง OpenClaw และเปิด onboarding wizard ดู [Install](/th/install) สำหรับรายละเอียด

  </Step>

  <Step title="ตรวจสอบ Gateway">
    หลังจาก onboarding เสร็จสมบูรณ์:

    ```bash
    openclaw gateway status
    ```

    ทีม Azure ระดับองค์กรส่วนใหญ่มักมีไลเซนส์ GitHub Copilot อยู่แล้ว หากเป็นกรณีของคุณ เราแนะนำให้เลือกผู้ให้บริการ GitHub Copilot ใน onboarding wizard ของ OpenClaw ดู [ผู้ให้บริการ GitHub Copilot](/th/providers/github-copilot)

  </Step>
</Steps>

## ข้อพิจารณาด้านต้นทุน

Azure Bastion Standard SKU มีค่าใช้จ่ายประมาณ **\$140/เดือน** และ VM (Standard_B2as_v2) มีค่าใช้จ่ายประมาณ **\$55/เดือน**

เพื่อลดค่าใช้จ่าย:

- **Deallocate VM** เมื่อไม่ได้ใช้งาน (จะหยุดการคิดค่าบริการด้าน compute; ค่าดิสก์ยังคงอยู่) OpenClaw Gateway จะไม่สามารถเข้าถึงได้ขณะ VM ถูก deallocate — เริ่มใหม่เมื่อคุณต้องการให้มันทำงานอีกครั้ง:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- **ลบ Bastion เมื่อไม่จำเป็น** และสร้างใหม่เมื่อคุณต้องการเข้าถึงผ่าน SSH Bastion เป็นองค์ประกอบที่มีค่าใช้จ่ายมากที่สุด และใช้เวลาเพียงไม่กี่นาทีในการ provision
- **ใช้ Basic Bastion SKU** (~\$38/เดือน) หากคุณต้องการเฉพาะ SSH ผ่าน Portal และไม่ต้องใช้ CLI tunneling (`az network bastion ssh`)

## การล้างทรัพยากร

หากต้องการลบทรัพยากรทั้งหมดที่สร้างโดยคู่มือนี้:

```bash
az group delete -n "${RG}" --yes --no-wait
```

คำสั่งนี้จะลบ resource group และทุกอย่างข้างใน (VM, VNet, NSG, Bastion, public IP)

## ขั้นตอนถัดไป

- ตั้งค่าช่องทางการส่งข้อความ: [Channels](/th/channels)
- จับคู่อุปกรณ์ในเครื่องเป็น Node: [Nodes](/th/nodes)
- กำหนดค่า Gateway: [การกำหนดค่า Gateway](/th/gateway/configuration)
- สำหรับรายละเอียดเพิ่มเติมเกี่ยวกับการติดตั้งใช้งาน OpenClaw บน Azure พร้อมผู้ให้บริการโมเดล GitHub Copilot: [OpenClaw on Azure with GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [GCP](/th/install/gcp)
- [DigitalOcean](/th/install/digitalocean)
