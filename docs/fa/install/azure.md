---
read_when:
    - می‌خواهید OpenClaw به‌صورت شبانه‌روزی در Azure اجرا شود و با سخت‌سازی گروه امنیت شبکه ایمن گردد
    - شما یک Gateway همیشه‌فعال و آمادهٔ محیط عملیاتی OpenClaw را روی ماشین مجازی لینوکسی Azure خود می‌خواهید
    - می‌خواهید مدیریت امن را با SSH در Azure Bastion انجام دهید
summary: Gateway در OpenClaw را به‌صورت شبانه‌روزی روی یک ماشین مجازی لینوکس Azure با وضعیت پایدار اجرا کنید
title: Azure
x-i18n:
    generated_at: "2026-07-12T10:15:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8598014cdc2786a47039ffb42ddd85354da9c87fd55ea46bb6dad7714171a14
    source_path: install/azure.md
    workflow: 16
---

یک ماشین مجازی لینوکس Azure را با Azure CLI راه‌اندازی کنید، سخت‌سازی گروه امنیت شبکه (NSG) را اعمال کنید، Azure Bastion را برای دسترسی SSH پیکربندی کنید و OpenClaw را نصب کنید.

## کارهایی که انجام خواهید داد

- ایجاد منابع شبکه Azure (VNet، زیرشبکه‌ها و NSG) و منابع محاسباتی با Azure CLI
- اعمال قواعد NSG به‌گونه‌ای که SSH ماشین مجازی فقط از طریق Azure Bastion مجاز باشد
- استفاده از Azure Bastion برای دسترسی SSH (بدون IP عمومی روی ماشین مجازی)
- نصب OpenClaw با اسکریپت نصب
- بررسی Gateway

## پیش‌نیازها

- اشتراک Azure با مجوز ایجاد منابع محاسباتی و شبکه
- نصب بودن Azure CLI (به [مراحل نصب Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) مراجعه کنید)
- یک جفت کلید SSH (در صورت نیاز، این راهنما نحوه ایجاد آن را توضیح می‌دهد)
- حدود ۲۰ تا ۳۰ دقیقه زمان

## پیکربندی استقرار

<Steps>
  <Step title="ورود به Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    افزونه `ssh` برای تونل‌سازی بومی SSH در Azure Bastion ضروری است.

  </Step>

  <Step title="ثبت ارائه‌دهندگان منابع موردنیاز (یک‌بار)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    ثبت را بررسی کنید؛ منتظر بمانید تا هر دو مقدار `Registered` را نشان دهند.

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

    نام‌ها و محدوده‌های CIDR را متناسب با محیط خود تنظیم کنید. زیرشبکه Bastion باید دست‌کم `/26` باشد.

  </Step>

  <Step title="انتخاب کلید SSH">
    اگر کلید عمومی موجود دارید، از آن استفاده کنید:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    در غیر این صورت، یک کلید ایجاد کنید:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="انتخاب اندازه ماشین مجازی و اندازه دیسک سیستم‌عامل">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    - برای استفاده سبک، با اندازه کوچک‌تر شروع کنید و بعداً آن را افزایش دهید.
    - برای خودکارسازی سنگین‌تر، کانال‌های بیشتر یا بارهای کاری بزرگ‌تر مدل و ابزار، از vCPU، RAM و فضای دیسک بیشتری استفاده کنید.
    - اگر اندازه‌ای در منطقه یا سهمیه اشتراک شما در دسترس نیست، نزدیک‌ترین SKU موجود را انتخاب کنید.

    اندازه‌های ماشین مجازی موجود در منطقه هدف را فهرست کنید:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    میزان مصرف و سهمیه فعلی vCPU و دیسک را بررسی کنید:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## استقرار منابع Azure

<Steps>
  <Step title="ایجاد گروه منابع">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="ایجاد گروه امنیت شبکه">
    NSG را ایجاد کنید و قواعدی بیفزایید تا فقط زیرشبکه Bastion بتواند از طریق SSH به ماشین مجازی متصل شود.

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

    قواعد بر اساس اولویت و ابتدا از کمترین عدد ارزیابی می‌شوند: ترافیک Bastion با اولویت ۱۰۰ مجاز است و سپس تمام ترافیک SSH دیگر با اولویت‌های ۱۱۰ و ۱۲۰ مسدود می‌شود.

  </Step>

  <Step title="ایجاد شبکه مجازی و زیرشبکه‌ها">
    VNet را همراه با زیرشبکه ماشین مجازی (با NSG متصل‌شده) ایجاد کنید و سپس زیرشبکه Bastion را بیفزایید.

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

  <Step title="ایجاد ماشین مجازی">
    به ماشین مجازی هیچ IP عمومی اختصاص داده نمی‌شود. دسترسی SSH منحصراً از طریق Azure Bastion انجام می‌شود.

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

    گزینه `--public-ip-address ""` از اختصاص IP عمومی جلوگیری می‌کند. گزینه `--nsg ""` نیز NSG مختص هر NIC را ایجاد نمی‌کند، زیرا NSG سطح زیرشبکه از قبل امنیت را مدیریت می‌کند.

    برای تثبیت یک نسخه مشخص از تصویر Ubuntu به‌جای `latest`، ابتدا نسخه‌های موجود را فهرست کنید:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="ایجاد Azure Bastion">
    Azure Bastion بدون در معرض اینترنت قرار دادن IP عمومی روی ماشین مجازی، دسترسی مدیریت‌شده SSH را فراهم می‌کند. برای استفاده از `az network bastion ssh` مبتنی بر CLI، به SKU استاندارد با تونل‌سازی فعال نیاز است.

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

    آماده‌سازی Bastion معمولاً ۵ تا ۱۰ دقیقه زمان می‌برد، اما در برخی مناطق ممکن است تا ۱۵ تا ۳۰ دقیقه طول بکشد.

  </Step>
</Steps>

## نصب OpenClaw

<Steps>
  <Step title="اتصال SSH به ماشین مجازی از طریق Azure Bastion">
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

  <Step title="نصب OpenClaw (در پوسته ماشین مجازی)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    برنامه نصب، در صورت موجود نبودن Node و وابستگی‌ها، آن‌ها را نصب می‌کند، سپس OpenClaw را نصب و فرایند راه‌اندازی اولیه را اجرا می‌کند. برای جزئیات به [نصب](/fa/install) مراجعه کنید.

  </Step>

  <Step title="بررسی Gateway">
    پس از تکمیل راه‌اندازی اولیه:

    ```bash
    openclaw gateway status
    ```

    اگر سازمان شما از قبل مجوزهای GitHub Copilot دارد، می‌توانید هنگام راه‌اندازی اولیه، ارائه‌دهنده GitHub Copilot را به‌جای یک کلید API جداگانه برای مدل انتخاب کنید. به [ارائه‌دهنده GitHub Copilot](/fa/providers/github-copilot) مراجعه کنید.

  </Step>
</Steps>

## ملاحظات هزینه

هزینه‌های تقریبی ماهانه (قیمت‌های فعلی را در Azure Pricing Calculator بررسی کنید، زیرا نرخ‌ها بر اساس منطقه متفاوت‌اند و با گذشت زمان تغییر می‌کنند):

- SKU استاندارد Azure Bastion: حدود ۱۴۰ دلار در ماه
- ماشین مجازی (`Standard_B2as_v2`): حدود ۵۵ دلار در ماه

برای کاهش هزینه‌ها:

- وقتی از ماشین مجازی استفاده نمی‌کنید، تخصیص آن را آزاد کنید. با این کار صورتحساب محاسباتی متوقف می‌شود (هزینه دیسک همچنان باقی می‌ماند). در مدت آزاد بودن تخصیص، Gateway در دسترس نیست.

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- وقتی به Bastion نیاز ندارید، آن را حذف کنید و هر زمان دوباره به دسترسی SSH نیاز داشتید، آن را از نو ایجاد کنید؛ Bastion بزرگ‌ترین بخش هزینه است و طی چند دقیقه آماده می‌شود.
- اگر فقط به SSH مبتنی بر Portal نیاز دارید و به تونل‌سازی CLI (`az network bastion ssh`) نیازی ندارید، از SKU پایه Bastion (حدود ۳۸ دلار در ماه) استفاده کنید.

## پاک‌سازی

تمام منابع ایجادشده با این راهنما را حذف کنید:

```bash
az group delete -n "${RG}" --yes --no-wait
```

این فرمان گروه منابع و تمام موارد داخل آن (ماشین مجازی، VNet، NSG، Bastion و IP عمومی) را حذف می‌کند.

## مراحل بعدی

- راه‌اندازی کانال‌های پیام‌رسانی: [کانال‌ها](/fa/channels)
- جفت‌سازی دستگاه‌های محلی به‌عنوان Node: [Nodeها](/fa/nodes)
- پیکربندی Gateway: [پیکربندی Gateway](/fa/gateway/configuration)
- جزئیات بیشتر درباره استقرار Azure با ارائه‌دهنده مدل GitHub Copilot: [OpenClaw در Azure با GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## مرتبط

- [نمای کلی نصب](/fa/install)
- [GCP](/fa/install/gcp)
- [DigitalOcean](/fa/install/digitalocean)
