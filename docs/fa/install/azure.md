---
read_when:
    - می‌خواهید OpenClaw به‌صورت ۲۴/۷ روی Azure اجرا شود و با سخت‌سازی گروه امنیتی شبکه محافظت شود
    - یک Gateway OpenClaw در سطح تولید و همیشه روشن روی ماشین مجازی لینوکس Azure خودتان می‌خواهید
    - می‌خواهید با Azure Bastion SSH مدیریت امن داشته باشید
summary: OpenClaw Gateway را به‌صورت 24/7 روی یک ماشین مجازی لینوکس در Azure با حالت ماندگار اجرا کنید
title: Azure
x-i18n:
    generated_at: "2026-04-29T23:02:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: e42e1a35e0340b959b73c548bc1efd6366bee38cf4c8cd23d986c5f14e5da0e0
    source_path: install/azure.md
    workflow: 16
---

# OpenClaw روی Azure Linux VM

این راهنما یک Azure Linux VM را با Azure CLI راه‌اندازی می‌کند، سخت‌سازی Network Security Group (NSG) را اعمال می‌کند، Azure Bastion را برای دسترسی SSH پیکربندی می‌کند و OpenClaw را نصب می‌کند.

## کارهایی که انجام می‌دهید

- ایجاد منابع شبکه Azure (VNet، زیرشبکه‌ها، NSG) و منابع رایانشی با Azure CLI
- اعمال قوانین Network Security Group تا SSH به VM فقط از Azure Bastion مجاز باشد
- استفاده از Azure Bastion برای دسترسی SSH (بدون IP عمومی روی VM)
- نصب OpenClaw با اسکریپت نصب
- بررسی Gateway

## آنچه نیاز دارید

- یک اشتراک Azure با مجوز ایجاد منابع رایانشی و شبکه
- نصب بودن Azure CLI (در صورت نیاز، [مراحل نصب Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) را ببینید)
- یک جفت کلید SSH (این راهنما در صورت نیاز نحوه ایجاد آن را پوشش می‌دهد)
- حدود ۲۰ تا ۳۰ دقیقه

## پیکربندی استقرار

<Steps>
  <Step title="ورود به Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    افزونه `ssh` برای تونل‌زنی SSH بومی Azure Bastion لازم است.

  </Step>

  <Step title="ثبت ارائه‌دهندگان منبع موردنیاز (یک‌باره)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    ثبت را بررسی کنید. صبر کنید تا هر دو مقدار `Registered` را نشان دهند.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="تنظیم متغیرهای استقرار">
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

    نام‌ها و بازه‌های CIDR را متناسب با محیط خود تنظیم کنید. زیرشبکه Bastion باید دست‌کم `/26` باشد.

  </Step>

  <Step title="انتخاب کلید SSH">
    اگر کلید عمومی موجود دارید، از آن استفاده کنید:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    اگر هنوز کلید SSH ندارید، یکی ایجاد کنید:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="انتخاب اندازه VM و اندازه دیسک OS">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    اندازه VM و اندازه دیسک OS را انتخاب کنید که در اشتراک و منطقه شما در دسترس باشد:

    - برای استفاده سبک، کوچک‌تر شروع کنید و بعدا مقیاس را افزایش دهید
    - برای خودکارسازی سنگین‌تر، کانال‌های بیشتر، یا بارهای کاری بزرگ‌تر مدل/ابزار، از vCPU/RAM/دیسک بیشتر استفاده کنید
    - اگر اندازه VM در منطقه یا سهمیه اشتراک شما در دسترس نیست، نزدیک‌ترین SKU موجود را انتخاب کنید

    اندازه‌های VM موجود در منطقه هدف خود را فهرست کنید:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    مصرف/سهمیه فعلی vCPU و دیسک خود را بررسی کنید:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## استقرار منابع Azure

<Steps>
  <Step title="ایجاد گروه منبع">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="ایجاد گروه امنیت شبکه">
    NSG را ایجاد کنید و قوانین را اضافه کنید تا فقط زیرشبکه Bastion بتواند از طریق SSH به VM وصل شود.

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

    قوانین بر اساس اولویت ارزیابی می‌شوند (عدد کمتر اول): ترافیک Bastion در ۱۰۰ مجاز است، سپس همه SSHهای دیگر در ۱۱۰ و ۱۲۰ مسدود می‌شوند.

  </Step>

  <Step title="ایجاد شبکه مجازی و زیرشبکه‌ها">
    VNet را با زیرشبکه VM (با NSG متصل) ایجاد کنید، سپس زیرشبکه Bastion را اضافه کنید.

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

  <Step title="ایجاد VM">
    VM هیچ IP عمومی ندارد. دسترسی SSH منحصرا از طریق Azure Bastion انجام می‌شود.

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

    `--public-ip-address ""` از اختصاص IP عمومی جلوگیری می‌کند. `--nsg ""` از ایجاد NSG جداگانه برای هر NIC صرف‌نظر می‌کند (NSG سطح زیرشبکه امنیت را مدیریت می‌کند).

    **تکرارپذیری:** فرمان بالا برای تصویر Ubuntu از `latest` استفاده می‌کند. برای قفل کردن روی نسخه‌ای مشخص، نسخه‌های موجود را فهرست کنید و `latest` را جایگزین کنید:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="ایجاد Azure Bastion">
    Azure Bastion دسترسی SSH مدیریت‌شده به VM را بدون افشای IP عمومی فراهم می‌کند. برای `az network bastion ssh` مبتنی بر CLI، SKU استاندارد با تونل‌زنی لازم است.

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

    آماده‌سازی Bastion معمولا ۵ تا ۱۰ دقیقه طول می‌کشد، اما در برخی مناطق می‌تواند تا ۱۵ تا ۳۰ دقیقه زمان ببرد.

  </Step>
</Steps>

## نصب OpenClaw

<Steps>
  <Step title="ورود SSH به VM از طریق Azure Bastion">
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

  <Step title="نصب OpenClaw (در پوسته VM)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    نصب‌کننده Node LTS و وابستگی‌ها را در صورت نبودن نصب می‌کند، OpenClaw را نصب می‌کند و جادوگر راه‌اندازی اولیه را اجرا می‌کند. برای جزئیات، [نصب](/fa/install) را ببینید.

  </Step>

  <Step title="بررسی Gateway">
    پس از تکمیل راه‌اندازی اولیه:

    ```bash
    openclaw gateway status
    ```

    بیشتر تیم‌های سازمانی Azure از قبل مجوزهای GitHub Copilot دارند. اگر این مورد درباره شما صدق می‌کند، توصیه می‌کنیم در جادوگر راه‌اندازی اولیه OpenClaw، ارائه‌دهنده GitHub Copilot را انتخاب کنید. [ارائه‌دهنده GitHub Copilot](/fa/providers/github-copilot) را ببینید.

  </Step>
</Steps>

## ملاحظات هزینه

Azure Bastion Standard SKU تقریبا **\$140/month** و VM (Standard_B2as_v2) تقریبا **\$55/month** هزینه دارد.

برای کاهش هزینه‌ها:

- **VM را Deallocate کنید** وقتی استفاده نمی‌شود (صورتحساب رایانش متوقف می‌شود؛ هزینه دیسک باقی می‌ماند). Gateway مربوط به OpenClaw در زمانی که VM deallocate شده باشد در دسترس نخواهد بود — وقتی دوباره به حالت زنده نیاز داشتید آن را راه‌اندازی مجدد کنید:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- **Bastion را وقتی لازم نیست حذف کنید** و وقتی به دسترسی SSH نیاز داشتید دوباره آن را بسازید. Bastion بزرگ‌ترین جزء هزینه است و آماده‌سازی آن فقط چند دقیقه طول می‌کشد.
- اگر فقط به SSH مبتنی بر Portal نیاز دارید و به تونل‌زنی CLI (`az network bastion ssh`) نیاز ندارید، **از Basic Bastion SKU** (حدود **\$38/month**) استفاده کنید.

## پاک‌سازی

برای حذف همه منابع ایجادشده توسط این راهنما:

```bash
az group delete -n "${RG}" --yes --no-wait
```

این کار گروه منبع و همه چیز داخل آن را حذف می‌کند (VM، VNet، NSG، Bastion، IP عمومی).

## مراحل بعدی

- راه‌اندازی کانال‌های پیام‌رسانی: [کانال‌ها](/fa/channels)
- جفت‌سازی دستگاه‌های محلی به‌عنوان Node: [Nodeها](/fa/nodes)
- پیکربندی Gateway: [پیکربندی Gateway](/fa/gateway/configuration)
- برای جزئیات بیشتر درباره استقرار OpenClaw روی Azure با ارائه‌دهنده مدل GitHub Copilot: [OpenClaw روی Azure با GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## مرتبط

- [نمای کلی نصب](/fa/install)
- [GCP](/fa/install/gcp)
- [DigitalOcean](/fa/install/digitalocean)
