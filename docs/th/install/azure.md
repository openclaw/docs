---
read_when:
    - คุณต้องการให้ OpenClaw ทำงานตลอด 24 ชั่วโมงทุกวันบน Azure พร้อมเสริมความปลอดภัยด้วย Network Security Group
    - คุณต้องการ OpenClaw Gateway ระดับพร้อมใช้งานจริงที่ทำงานตลอดเวลาบน Azure Linux VM ของคุณเอง
    - คุณต้องการการดูแลระบบอย่างปลอดภัยด้วย Azure Bastion SSH
summary: เรียกใช้ OpenClaw Gateway ตลอด 24 ชั่วโมงทุกวันบน VM Linux ของ Azure พร้อมสถานะที่คงอยู่ถาวร
title: Azure
x-i18n:
    generated_at: "2026-07-12T16:16:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8598014cdc2786a47039ffb42ddd85354da9c87fd55ea46bb6dad7714171a14
    source_path: install/azure.md
    workflow: 16
---

ตั้งค่า VM Linux บน Azure ด้วย Azure CLI เพิ่มความปลอดภัยให้ Network Security Group (NSG) กำหนดค่า Azure Bastion สำหรับการเข้าถึงผ่าน SSH และติดตั้ง OpenClaw

## สิ่งที่คุณจะทำ

- สร้างทรัพยากรเครือข่าย Azure (VNet, ซับเน็ต, NSG) และทรัพยากรประมวลผลด้วย Azure CLI
- ใช้กฎ NSG เพื่ออนุญาต SSH ไปยัง VM จาก Azure Bastion เท่านั้น
- ใช้ Azure Bastion สำหรับการเข้าถึงผ่าน SSH (VM ไม่มี IP สาธารณะ)
- ติดตั้ง OpenClaw ด้วยสคริปต์ติดตั้ง
- ตรวจสอบ Gateway

## สิ่งที่คุณต้องมี

- การสมัครใช้งาน Azure ที่มีสิทธิ์สร้างทรัพยากรประมวลผลและเครือข่าย
- ติดตั้ง Azure CLI แล้ว (ดู[ขั้นตอนการติดตั้ง Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli))
- คู่กุญแจ SSH (คู่มือนี้ครอบคลุมการสร้างกุญแจหากยังไม่มี)
- เวลาประมาณ 20-30 นาที

## กำหนดค่าการปรับใช้

<Steps>
  <Step title="ลงชื่อเข้าใช้ Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    ต้องมีส่วนขยาย `ssh` เพื่อใช้อุโมงค์ SSH แบบเนทีฟของ Azure Bastion

  </Step>

  <Step title="ลงทะเบียนผู้ให้บริการทรัพยากรที่จำเป็น (ครั้งเดียว)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    ตรวจสอบการลงทะเบียน และรอจนกว่าทั้งสองรายการจะแสดง `Registered`

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="ตั้งค่าตัวแปรการปรับใช้">
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

    ปรับชื่อและช่วง CIDR ให้เหมาะกับสภาพแวดล้อมของคุณ ซับเน็ต Bastion ต้องมีขนาดอย่างน้อย `/26`

  </Step>

  <Step title="เลือกกุญแจ SSH">
    ใช้กุญแจสาธารณะที่มีอยู่ หากคุณมีอยู่แล้ว:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    หากไม่มี ให้สร้างกุญแจ:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="เลือกขนาด VM และขนาดดิสก์ระบบปฏิบัติการ">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    - เริ่มจากขนาดเล็กสำหรับการใช้งานเบา ๆ แล้วค่อยเพิ่มขนาดภายหลัง
    - ใช้ vCPU/RAM/ดิสก์มากขึ้นสำหรับระบบอัตโนมัติที่มีภาระงานสูง ช่องทางจำนวนมากขึ้น หรือภาระงานโมเดล/เครื่องมือที่มีขนาดใหญ่ขึ้น
    - หากไม่มีขนาดนั้นในภูมิภาคของคุณหรือเกินโควตาการสมัครใช้งาน ให้เลือก SKU ที่ใกล้เคียงที่สุดซึ่งพร้อมใช้งาน

    แสดงรายการขนาด VM ที่พร้อมใช้งานในภูมิภาคเป้าหมายของคุณ:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    ตรวจสอบการใช้งานและโควตา vCPU และดิสก์ปัจจุบัน:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## ปรับใช้ทรัพยากร Azure

<Steps>
  <Step title="สร้างกลุ่มทรัพยากร">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="สร้างกลุ่มความปลอดภัยเครือข่าย">
    สร้าง NSG และเพิ่มกฎเพื่อให้เฉพาะซับเน็ต Bastion เท่านั้นที่สามารถใช้ SSH เข้า VM ได้

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

    ระบบประเมินกฎตามลำดับความสำคัญ โดยเริ่มจากหมายเลขที่ต่ำที่สุด: อนุญาตการรับส่งข้อมูลจาก Bastion ที่ลำดับ 100 จากนั้นบล็อก SSH อื่นทั้งหมดที่ลำดับ 110 และ 120

  </Step>

  <Step title="สร้างเครือข่ายเสมือนและซับเน็ต">
    สร้าง VNet พร้อมซับเน็ต VM (แนบ NSG) จากนั้นเพิ่มซับเน็ต Bastion

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

    # AzureBastionSubnet: this exact name is required by Azure
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="สร้าง VM">
    VM จะไม่มี IP สาธารณะ การเข้าถึงผ่าน SSH จะดำเนินการผ่าน Azure Bastion เท่านั้น

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

    `--public-ip-address ""` ป้องกันไม่ให้มีการกำหนด IP สาธารณะ ส่วน `--nsg ""` จะข้าม NSG ระดับ NIC เนื่องจาก NSG ระดับซับเน็ตดูแลความปลอดภัยอยู่แล้ว

    หากต้องการตรึงเวอร์ชันอิมเมจ Ubuntu ที่ระบุแทน `latest` ให้แสดงรายการเวอร์ชันที่พร้อมใช้งานก่อน:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="สร้าง Azure Bastion">
    Azure Bastion ให้การเข้าถึงผ่าน SSH ที่มีการจัดการโดยไม่เปิดเผย IP สาธารณะบน VM ต้องใช้ SKU Standard ที่เปิดใช้งานการทำอุโมงค์สำหรับ `az network bastion ssh` ผ่าน CLI

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

    โดยทั่วไปการจัดเตรียม Bastion ใช้เวลา 5-10 นาที แต่ในบางภูมิภาคอาจใช้เวลาถึง 15-30 นาที

  </Step>
</Steps>

## ติดตั้ง OpenClaw

<Steps>
  <Step title="ใช้ SSH เข้า VM ผ่าน Azure Bastion">
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

  <Step title="ติดตั้ง OpenClaw (ในเชลล์ของ VM)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    โปรแกรมติดตั้งจะติดตั้ง Node และการขึ้นต่อกันต่าง ๆ หากยังไม่มี ติดตั้ง OpenClaw และเริ่มกระบวนการเริ่มต้นใช้งาน ดูรายละเอียดที่[การติดตั้ง](/th/install)

  </Step>

  <Step title="ตรวจสอบ Gateway">
    หลังจากกระบวนการเริ่มต้นใช้งานเสร็จสมบูรณ์:

    ```bash
    openclaw gateway status
    ```

    หากองค์กรของคุณมีสิทธิ์ใช้งาน GitHub Copilot อยู่แล้ว คุณสามารถเลือกผู้ให้บริการ GitHub Copilot ระหว่างกระบวนการเริ่มต้นใช้งาน แทนการใช้คีย์ API ของโมเดลแยกต่างหาก ดู[ผู้ให้บริการ GitHub Copilot](/th/providers/github-copilot)

  </Step>
</Steps>

## ข้อควรพิจารณาด้านค่าใช้จ่าย

ค่าใช้จ่ายรายเดือนโดยประมาณ (ตรวจสอบราคาปัจจุบันใน Azure Pricing Calculator เนื่องจากอัตราค่าบริการแตกต่างกันตามภูมิภาคและเปลี่ยนแปลงได้ตามเวลา):

- Azure Bastion SKU Standard: ประมาณ $140/เดือน
- VM (`Standard_B2as_v2`): ประมาณ $55/เดือน

วิธีลดค่าใช้จ่าย:

- ยกเลิกการจัดสรร VM เมื่อไม่ได้ใช้งาน การดำเนินการนี้จะหยุดการเรียกเก็บค่าประมวลผล (ยังคงมีค่าบริการดิสก์) และจะไม่สามารถเข้าถึง Gateway ได้ระหว่างที่ยกเลิกการจัดสรร

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- ลบ Bastion เมื่อไม่ต้องการใช้งาน และสร้างใหม่เมื่อต้องการเข้าถึงผ่าน SSH อีกครั้ง เนื่องจากเป็นองค์ประกอบที่มีค่าใช้จ่ายสูงที่สุดและใช้เวลาจัดเตรียมเพียงไม่กี่นาที
- ใช้ Bastion SKU Basic (ประมาณ $38/เดือน) หากคุณต้องการเพียง SSH ผ่านพอร์ทัลและไม่จำเป็นต้องใช้อุโมงค์ผ่าน CLI (`az network bastion ssh`)

## การล้างข้อมูล

ลบทรัพยากรทั้งหมดที่สร้างโดยคู่มือนี้:

```bash
az group delete -n "${RG}" --yes --no-wait
```

คำสั่งนี้จะลบกลุ่มทรัพยากรและทุกอย่างภายในกลุ่ม (VM, VNet, NSG, Bastion, IP สาธารณะ)

## ขั้นตอนถัดไป

- ตั้งค่าช่องทางการรับส่งข้อความ: [ช่องทาง](/th/channels)
- จับคู่อุปกรณ์ภายในเป็นโหนด: [โหนด](/th/nodes)
- กำหนดค่า Gateway: [การกำหนดค่า Gateway](/th/gateway/configuration)
- รายละเอียดเพิ่มเติมเกี่ยวกับการปรับใช้บน Azure ด้วยผู้ให้บริการโมเดล GitHub Copilot: [OpenClaw บน Azure พร้อม GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [GCP](/th/install/gcp)
- [DigitalOcean](/th/install/digitalocean)
