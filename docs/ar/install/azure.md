---
read_when:
    - تريد تشغيل OpenClaw على Azure على مدار الساعة طوال أيام الأسبوع مع تعزيز أمان مجموعة أمان الشبكة
    - تريد Gateway لـ OpenClaw بمستوى جاهز للإنتاج ويعمل دائمًا على جهاز Azure Linux الافتراضي الخاص بك
    - تريد إدارة آمنة عبر SSH باستخدام Azure Bastion
summary: شغّل Gateway الخاص بـ OpenClaw على مدار الساعة طوال أيام الأسبوع على جهاز Azure ظاهري يعمل بنظام Linux مع حالة دائمة
title: Azure
x-i18n:
    generated_at: "2026-07-12T06:07:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8598014cdc2786a47039ffb42ddd85354da9c87fd55ea46bb6dad7714171a14
    source_path: install/azure.md
    workflow: 16
---

أعِدّ جهازًا افتراضيًا بنظام Linux على Azure باستخدام Azure CLI، وطبّق تعزيزات الأمان الخاصة بمجموعة أمان الشبكة (NSG)، وهيّئ Azure Bastion للوصول عبر SSH، وثبّت OpenClaw.

## ما ستفعله

- إنشاء موارد الشبكة في Azure (VNet، والشبكات الفرعية، وNSG) وموارد الحوسبة باستخدام Azure CLI
- تطبيق قواعد NSG بحيث لا يُسمح بالوصول إلى الجهاز الافتراضي عبر SSH إلا من Azure Bastion
- استخدام Azure Bastion للوصول عبر SSH (من دون عنوان IP عام للجهاز الافتراضي)
- تثبيت OpenClaw باستخدام برنامج التثبيت النصي
- التحقق من Gateway

## ما تحتاج إليه

- اشتراك Azure مع إذن بإنشاء موارد الحوسبة والشبكة
- تثبيت Azure CLI (راجع [خطوات تثبيت Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli))
- زوج مفاتيح SSH (يتناول هذا الدليل كيفية إنشاء زوج إذا لزم الأمر)
- نحو 20 إلى 30 دقيقة

## تهيئة النشر

<Steps>
  <Step title="تسجيل الدخول إلى Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    ملحق `ssh` مطلوب لإنشاء نفق SSH أصلي عبر Azure Bastion.

  </Step>

  <Step title="تسجيل موفّري الموارد المطلوبين (مرة واحدة)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    تحقّق من التسجيل؛ وانتظر حتى يعرض كلاهما `Registered`.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="تعيين متغيرات النشر">
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

    عدّل الأسماء ونطاقات CIDR لتناسب بيئتك. يجب ألا تقل الشبكة الفرعية لـ Bastion عن `/26`.

  </Step>

  <Step title="اختيار مفتاح SSH">
    استخدم مفتاحك العام الحالي إذا كان لديك واحد:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    وإلا، فأنشئ واحدًا:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="اختيار حجم الجهاز الافتراضي وحجم قرص نظام التشغيل">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    - ابدأ بحجم أصغر للاستخدام الخفيف، ثم زِده لاحقًا.
    - استخدم عددًا أكبر من وحدات vCPU وذاكرة RAM ومساحة القرص لعمليات الأتمتة الأثقل، أو لعدد أكبر من القنوات، أو لأحمال عمل النماذج والأدوات الأكبر.
    - إذا لم يتوفر حجم ضمن منطقتك أو حصة اشتراكك، فاختر أقرب SKU متاح.

    اعرض أحجام الأجهزة الافتراضية المتاحة في المنطقة المستهدفة:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    تحقّق من استخدامك الحالي لوحدات vCPU والأقراص ومن حصصها:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## نشر موارد Azure

<Steps>
  <Step title="إنشاء مجموعة الموارد">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="إنشاء مجموعة أمان الشبكة">
    أنشئ NSG وأضف قواعد بحيث لا تتمكن إلا شبكة Bastion الفرعية من الوصول إلى الجهاز الافتراضي عبر SSH.

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

    تُقيّم القواعد حسب الأولوية، بدءًا من الرقم الأصغر: يُسمح بحركة مرور Bastion عند الأولوية 100، ثم تُحظر جميع اتصالات SSH الأخرى عند الأولويتين 110 و120.

  </Step>

  <Step title="إنشاء الشبكة الافتراضية والشبكات الفرعية">
    أنشئ VNet مع الشبكة الفرعية للجهاز الافتراضي (مع إرفاق NSG)، ثم أضف الشبكة الفرعية لـ Bastion.

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

  <Step title="إنشاء الجهاز الافتراضي">
    لن يحصل الجهاز الافتراضي على عنوان IP عام. يتم الوصول عبر SSH حصريًا من خلال Azure Bastion.

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

    يمنع `--public-ip-address ""` تعيين عنوان IP عام. ويتخطى `--nsg ""` إنشاء NSG خاصة بواجهة بطاقة الشبكة لأن NSG على مستوى الشبكة الفرعية تتولى الأمان بالفعل.

    لتثبيت إصدار محدد من صورة Ubuntu بدلًا من `latest`، اعرض الإصدارات المتاحة أولًا:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="إنشاء Azure Bastion">
    يوفّر Azure Bastion وصولًا مُدارًا عبر SSH من دون كشف عنوان IP عام على الجهاز الافتراضي. يلزم استخدام SKU القياسية مع تمكين إنشاء الأنفاق لاستخدام `az network bastion ssh` عبر CLI.

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

    يستغرق توفير Bastion عادةً من 5 إلى 10 دقائق، لكنه قد يستغرق من 15 إلى 30 دقيقة في بعض المناطق.

  </Step>
</Steps>

## تثبيت OpenClaw

<Steps>
  <Step title="الاتصال بالجهاز الافتراضي عبر SSH من خلال Azure Bastion">
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

  <Step title="تثبيت OpenClaw (داخل صدفة الجهاز الافتراضي)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    يثبّت برنامج التثبيت Node والتبعيات إذا لم تكن موجودة بالفعل، ثم يثبّت OpenClaw ويبدأ الإعداد الأولي. راجع [التثبيت](/ar/install) للحصول على التفاصيل.

  </Step>

  <Step title="التحقق من Gateway">
    بعد اكتمال الإعداد الأولي:

    ```bash
    openclaw gateway status
    ```

    إذا كانت مؤسستك تمتلك بالفعل تراخيص GitHub Copilot، فيمكنك اختيار موفّر GitHub Copilot أثناء الإعداد الأولي بدلًا من استخدام مفتاح API منفصل للنموذج. راجع [موفّر GitHub Copilot](/ar/providers/github-copilot).

  </Step>
</Steps>

## اعتبارات التكلفة

التكاليف الشهرية التقريبية (تحقّق من الأسعار الحالية في Azure Pricing Calculator، إذ تختلف الأسعار حسب المنطقة وتتغير بمرور الوقت):

- SKU القياسية من Azure Bastion: نحو 140 دولارًا شهريًا
- الجهاز الافتراضي (`Standard_B2as_v2`): نحو 55 دولارًا شهريًا

لتقليل التكاليف:

- ألغِ تخصيص الجهاز الافتراضي عند عدم استخدامه. يؤدي ذلك إلى إيقاف فوترة الحوسبة (مع استمرار رسوم القرص). يتعذر الوصول إلى Gateway أثناء إلغاء التخصيص.

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- احذف Bastion عندما لا تحتاج إليه، وأعِد إنشاءه عندما تحتاج إلى الوصول عبر SSH مرة أخرى؛ فهو أكبر مكوّن من حيث التكلفة ويستغرق توفيره بضع دقائق.
- استخدم SKU الأساسية من Bastion (نحو 38 دولارًا شهريًا) إذا كنت تحتاج فقط إلى SSH عبر البوابة ولا تحتاج إلى إنشاء نفق عبر CLI (`az network bastion ssh`).

## التنظيف

احذف جميع الموارد التي أنشأها هذا الدليل:

```bash
az group delete -n "${RG}" --yes --no-wait
```

يؤدي ذلك إلى إزالة مجموعة الموارد وكل ما بداخلها (الجهاز الافتراضي، وVNet، وNSG، وBastion، وعنوان IP العام).

## الخطوات التالية

- إعداد قنوات المراسلة: [القنوات](/ar/channels)
- إقران الأجهزة المحلية كعُقد: [العُقد](/ar/nodes)
- تهيئة Gateway: [تهيئة Gateway](/ar/gateway/configuration)
- مزيد من التفاصيل حول النشر على Azure باستخدام موفّر نموذج GitHub Copilot: [OpenClaw على Azure باستخدام GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [GCP](/ar/install/gcp)
- [DigitalOcean](/ar/install/digitalocean)
