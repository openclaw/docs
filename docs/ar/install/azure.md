---
read_when:
    - تريد تشغيل OpenClaw على مدار الساعة طوال أيام الأسبوع على Azure مع تعزيز الأمان باستخدام Network Security Group
    - تريد OpenClaw Gateway بدرجة إنتاجية ويعمل دائمًا على جهاز Azure Linux VM الخاص بك
    - تريد إدارة آمنة عبر Azure Bastion SSH
summary: تشغيل OpenClaw Gateway على مدار الساعة طوال أيام الأسبوع على جهاز Azure Linux VM مع حالة دائمة
title: Azure
x-i18n:
    generated_at: "2026-04-24T07:46:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: e42e1a35e0340b959b73c548bc1efd6366bee38cf4c8cd23d986c5f14e5da0e0
    source_path: install/azure.md
    workflow: 15
---

# OpenClaw على Azure Linux VM

يشرح هذا الدليل كيفية إعداد Azure Linux VM باستخدام Azure CLI، وتطبيق تعزيز الأمان عبر Network Security Group ‏(NSG)، وتهيئة Azure Bastion للوصول عبر SSH، ثم تثبيت OpenClaw.

## ما الذي ستفعله

- إنشاء موارد Azure للشبكة والحوسبة (VNet، والشبكات الفرعية، وNSG) باستخدام Azure CLI
- تطبيق قواعد Network Security Group بحيث يُسمح بـ SSH إلى VM فقط من Azure Bastion
- استخدام Azure Bastion للوصول عبر SSH ‏(من دون عنوان IP عام على VM)
- تثبيت OpenClaw باستخدام سكربت المثبت
- التحقق من Gateway

## ما الذي تحتاج إليه

- اشتراك Azure مع صلاحية إنشاء موارد الحوسبة والشبكة
- Azure CLI مثبتًا (راجع [خطوات تثبيت Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) إذا لزم الأمر)
- زوج مفاتيح SSH ‏(ويغطي الدليل توليده إذا لزم الأمر)
- حوالي 20-30 دقيقة

## تهيئة النشر

<Steps>
  <Step title="سجّل الدخول إلى Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    امتداد `ssh` مطلوب من أجل Azure Bastion native SSH tunneling.

  </Step>

  <Step title="سجّل موفري الموارد المطلوبين (مرة واحدة)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    تحقّق من التسجيل. انتظر حتى يظهر `Registered` لكليهما.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="اضبط متغيرات النشر">
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

    عدّل الأسماء ونطاقات CIDR بما يناسب بيئتك. يجب أن تكون شبكة Bastion الفرعية على الأقل `/26`.

  </Step>

  <Step title="اختر مفتاح SSH">
    استخدم مفتاحك العام الحالي إذا كان لديك واحد:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    وإذا لم يكن لديك مفتاح SSH بعد، فأنشئ واحدًا:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="اختر حجم VM وحجم قرص نظام التشغيل">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    اختر حجم VM وحجم قرص نظام تشغيل متاحين في اشتراكك والمنطقة الخاصة بك:

    - ابدأ بحجم أصغر للاستخدام الخفيف ثم قم بالتوسعة لاحقًا
    - استخدم vCPU/RAM/قرص أكثر للأتمتة الأثقل، أو المزيد من القنوات، أو أحمال النماذج/الأدوات الأكبر
    - إذا لم يكن حجم VM متاحًا في منطقتك أو ضمن حصة اشتراكك، فاختر أقرب SKU متاح

    اعرض أحجام VM المتاحة في منطقتك المستهدفة:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    تحقّق من استخدام/حصة vCPU والقرص الحالية:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## نشر موارد Azure

<Steps>
  <Step title="أنشئ مجموعة الموارد">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="أنشئ مجموعة أمان الشبكة">
    أنشئ NSG وأضف القواعد بحيث لا يتمكن من الوصول عبر SSH إلى VM إلا Bastion subnet.

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

    تُقيَّم القواعد حسب الأولوية (الرقم الأقل أولًا): يُسمح بحركة Bastion عند 100، ثم يُحظر باقي SSH عند 110 و120.

  </Step>

  <Step title="أنشئ الشبكة الافتراضية والشبكات الفرعية">
    أنشئ VNet مع شبكة VM الفرعية (مع إرفاق NSG)، ثم أضف شبكة Bastion الفرعية.

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

  <Step title="أنشئ VM">
    لا يحتوي VM على عنوان IP عام. ويكون الوصول عبر SSH حصريًا من خلال Azure Bastion.

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

    يؤدي `--public-ip-address ""` إلى منع تعيين عنوان IP عام. أما `--nsg ""` فيتجاوز إنشاء NSG لكل NIC (إذ تتولى NSG على مستوى الشبكة الفرعية الأمان).

    **إمكانية إعادة الإنتاج:** يستخدم الأمر أعلاه `latest` لصورة Ubuntu. ولتثبيت إصدار محدد، اعرض الإصدارات المتاحة واستبدل `latest`:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="أنشئ Azure Bastion">
    يوفّر Azure Bastion وصولًا مُدارًا عبر SSH إلى VM من دون كشف عنوان IP عام. ويتطلب Standard SKU مع tunneling لاستخدام `az network bastion ssh` المعتمد على CLI.

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

    يستغرق توفير Bastion عادةً 5-10 دقائق، لكنه قد يستغرق حتى 15-30 دقيقة في بعض المناطق.

  </Step>
</Steps>

## تثبيت OpenClaw

<Steps>
  <Step title="ادخل إلى VM عبر SSH من خلال Azure Bastion">
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

  <Step title="ثبّت OpenClaw (داخل shell الخاصة بـ VM)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    يقوم المثبت بتثبيت Node LTS والتبعيات إذا لم تكن موجودة، ويثبّت OpenClaw، ويطلق معالج onboarding. راجع [التثبيت](/ar/install) للتفاصيل.

  </Step>

  <Step title="تحقق من Gateway">
    بعد اكتمال onboarding:

    ```bash
    openclaw gateway status
    ```

    تمتلك معظم فرق Azure المؤسسية بالفعل تراخيص GitHub Copilot. وإذا كان هذا ينطبق على حالتك، فنوصي باختيار مزود GitHub Copilot في معالج onboarding الخاص بـ OpenClaw. راجع [مزود GitHub Copilot](/ar/providers/github-copilot).

  </Step>
</Steps>

## اعتبارات التكلفة

تعمل Azure Bastion Standard SKU بتكلفة تقارب **\$140/شهريًا** ويعمل VM ‏(Standard_B2as_v2) بتكلفة تقارب **\$55/شهريًا**.

لتقليل التكاليف:

- **ألغِ تخصيص VM** عندما لا تكون بحاجة إليه (يوقف فوترة الحوسبة؛ وتبقى رسوم الأقراص). ولن يكون OpenClaw Gateway قابلاً للوصول أثناء إلغاء تخصيص VM — أعد تشغيله عندما تحتاج إلى أن يكون متاحًا مجددًا:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- **احذف Bastion عندما لا تحتاج إليه** وأعد إنشاؤه عندما تحتاج إلى الوصول عبر SSH. ويُعد Bastion أكبر عنصر في التكلفة ولا يستغرق سوى بضع دقائق للتوفير.
- **استخدم Basic Bastion SKU** ‏(~\$38/شهريًا) إذا كنت تحتاج فقط إلى SSH عبر البوابة ولا تحتاج إلى tunneling عبر CLI ‏(`az network bastion ssh`).

## التنظيف

لحذف جميع الموارد التي أنشأها هذا الدليل:

```bash
az group delete -n "${RG}" --yes --no-wait
```

يؤدي ذلك إلى إزالة مجموعة الموارد وكل ما بداخلها (VM، وVNet، وNSG، وBastion، وIP العام).

## الخطوات التالية

- اضبط قنوات المراسلة: [القنوات](/ar/channels)
- اقترن بالأجهزة المحلية كعُقد: [العُقد](/ar/nodes)
- اضبط Gateway: [إعدادات Gateway](/ar/gateway/configuration)
- لمزيد من التفاصيل حول نشر OpenClaw على Azure مع مزود نماذج GitHub Copilot: [OpenClaw on Azure with GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [GCP](/ar/install/gcp)
- [DigitalOcean](/ar/install/digitalocean)
