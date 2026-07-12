---
read_when:
    - Ви хочете, щоб OpenClaw працював в Azure цілодобово з посиленим захистом за допомогою групи безпеки мережі (Network Security Group)
    - Вам потрібен готовий до промислової експлуатації, постійно доступний OpenClaw Gateway на власній віртуальній машині Azure Linux
    - Ви хочете безпечного адміністрування через Azure Bastion SSH
summary: Запускайте OpenClaw Gateway цілодобово на віртуальній машині Azure Linux зі збереженням стану
title: Azure
x-i18n:
    generated_at: "2026-07-12T13:24:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8598014cdc2786a47039ffb42ddd85354da9c87fd55ea46bb6dad7714171a14
    source_path: install/azure.md
    workflow: 16
---

Налаштуйте віртуальну машину Azure Linux за допомогою Azure CLI, посильте захист групи безпеки мережі (NSG), налаштуйте Azure Bastion для доступу через SSH та встановіть OpenClaw.

## Що ви зробите

- Створите мережеві ресурси Azure (VNet, підмережі, NSG) і обчислювальні ресурси за допомогою Azure CLI
- Застосуєте правила NSG, щоб доступ до VM через SSH був дозволений лише з Azure Bastion
- Використаєте Azure Bastion для доступу через SSH (без загальнодоступної IP-адреси на VM)
- Установите OpenClaw за допомогою сценарію встановлення
- Перевірите Gateway

## Що вам знадобиться

- Передплата Azure із дозволом на створення обчислювальних і мережевих ресурсів
- Установлений Azure CLI (див. [інструкції зі встановлення Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli))
- Пара ключів SSH (у цьому посібнику описано, як створити її за потреби)
- Приблизно 20–30 хвилин

## Налаштування розгортання

<Steps>
  <Step title="Увійдіть в Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    Розширення `ssh` потрібне для нативного тунелювання SSH через Azure Bastion.

  </Step>

  <Step title="Зареєструйте необхідних постачальників ресурсів (одноразово)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Перевірте реєстрацію; зачекайте, доки для обох з’явиться стан `Registered`.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Задайте змінні розгортання">
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

    Скоригуйте назви та діапазони CIDR відповідно до свого середовища. Підмережа Bastion має бути щонайменше `/26`.

  </Step>

  <Step title="Виберіть ключ SSH">
    Використайте наявний відкритий ключ, якщо він у вас є:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Інакше створіть його:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Виберіть розмір VM і розмір диска ОС">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    - Для невеликого навантаження почніть із меншої конфігурації та за потреби збільште її пізніше.
    - Для інтенсивнішої автоматизації, більшої кількості каналів або значніших навантажень від моделей чи інструментів використовуйте більше vCPU, оперативної пам’яті та дискового простору.
    - Якщо певний розмір недоступний у вашому регіоні або в межах квоти передплати, виберіть найближчий доступний SKU.

    Перегляньте розміри VM, доступні в цільовому регіоні:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Перевірте поточне використання та квоти vCPU і дисків:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Розгортання ресурсів Azure

<Steps>
  <Step title="Створіть групу ресурсів">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Створіть групу безпеки мережі">
    Створіть NSG і додайте правила, щоб лише підмережа Bastion могла підключатися до VM через SSH.

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

    Правила оцінюються за пріоритетом, починаючи з найменшого числа: трафік Bastion дозволено з пріоритетом 100, а всі інші підключення SSH блокуються з пріоритетами 110 і 120.

  </Step>

  <Step title="Створіть віртуальну мережу та підмережі">
    Створіть VNet із підмережею VM (із приєднаною NSG), а потім додайте підмережу Bastion.

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

  <Step title="Створіть VM">
    VM не отримує загальнодоступної IP-адреси. Доступ через SSH здійснюється виключно через Azure Bastion.

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

    `--public-ip-address ""` запобігає призначенню загальнодоступної IP-адреси. `--nsg ""` пропускає створення NSG для окремого мережевого інтерфейсу, оскільки безпеку вже забезпечує NSG на рівні підмережі.

    Щоб закріпити певну версію образу Ubuntu замість `latest`, спочатку перегляньте доступні версії:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Створіть Azure Bastion">
    Azure Bastion надає керований доступ через SSH без відкриття загальнодоступної IP-адреси на VM. Для використання `az network bastion ssh` через CLI потрібен SKU Standard з увімкненим тунелюванням.

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

    Підготовка Bastion зазвичай триває 5–10 хвилин, але в деяких регіонах може зайняти до 15–30 хвилин.

  </Step>
</Steps>

## Установлення OpenClaw

<Steps>
  <Step title="Підключіться до VM через SSH за допомогою Azure Bastion">
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

  <Step title="Установіть OpenClaw (в оболонці VM)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    Сценарій установлення встановлює Node і залежності, якщо їх ще немає, встановлює OpenClaw і запускає початкове налаштування. Докладніше див. у розділі [Установлення](/uk/install).

  </Step>

  <Step title="Перевірте Gateway">
    Після завершення початкового налаштування:

    ```bash
    openclaw gateway status
    ```

    Якщо ваша організація вже має ліцензії GitHub Copilot, під час початкового налаштування можна вибрати постачальника GitHub Copilot замість окремого ключа API моделі. Див. [постачальник GitHub Copilot](/uk/providers/github-copilot).

  </Step>
</Steps>

## Вартість

Орієнтовна щомісячна вартість (перевіряйте актуальні ціни в калькуляторі цін Azure, оскільки тарифи різняться залежно від регіону та змінюються з часом):

- SKU Azure Bastion Standard: приблизно 140 дол. США на місяць
- VM (`Standard_B2as_v2`): приблизно 55 дол. США на місяць

Щоб зменшити витрати:

- Звільняйте ресурси VM, коли вона не використовується. Це припиняє нарахування плати за обчислювальні ресурси, але плата за диск залишається. Поки ресурси звільнено, Gateway недоступний.

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- Видаляйте Bastion, коли він не потрібен, і створюйте його знову, коли знову знадобиться доступ через SSH; це найбільша складова вартості, а його підготовка триває лише кілька хвилин.
- Використовуйте SKU Bastion Basic (приблизно 38 дол. США на місяць), якщо вам потрібен лише доступ через SSH із порталу й не потрібне тунелювання через CLI (`az network bastion ssh`).

## Очищення

Видаліть усі ресурси, створені за цим посібником:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Це видалить групу ресурсів і все, що в ній міститься (VM, VNet, NSG, Bastion, загальнодоступну IP-адресу).

## Наступні кроки

- Налаштуйте канали обміну повідомленнями: [Канали](/uk/channels)
- Сполучіть локальні пристрої як вузли: [Вузли](/uk/nodes)
- Налаштуйте Gateway: [Конфігурація Gateway](/uk/gateway/configuration)
- Докладніше про розгортання в Azure з постачальником моделі GitHub Copilot: [OpenClaw в Azure із GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Пов’язані матеріали

- [Огляд установлення](/uk/install)
- [GCP](/uk/install/gcp)
- [DigitalOcean](/uk/install/digitalocean)
