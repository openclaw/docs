---
read_when:
    - Вы хотите, чтобы OpenClaw работал 24/7 в Azure с усиленной защитой Network Security Group
    - Вам нужен готовый к промышленной эксплуатации, постоянно работающий OpenClaw Gateway на собственной виртуальной машине Linux в Azure
    - Вам нужно безопасное администрирование через Azure Bastion SSH
summary: Запуск OpenClaw Gateway 24/7 на виртуальной машине Azure Linux с долговременным состоянием
title: Azure
x-i18n:
    generated_at: "2026-06-28T23:04:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7ab1b7d09dd66c495983aebd4766ce760d659cc6f362bbcd999d1c1345ae38f7
    source_path: install/azure.md
    workflow: 16
---

Это руководство помогает настроить виртуальную машину Azure Linux с Azure CLI, применить усиление Network Security Group (NSG), настроить Azure Bastion для доступа по SSH и установить OpenClaw.

## Что вы сделаете

- Создадите сетевые ресурсы Azure (VNet, подсети, NSG) и вычислительные ресурсы с помощью Azure CLI
- Примените правила Network Security Group, чтобы SSH к виртуальной машине был разрешен только из Azure Bastion
- Используете Azure Bastion для доступа по SSH (без публичного IP у виртуальной машины)
- Установите OpenClaw с помощью установочного скрипта
- Проверите Gateway

## Что вам понадобится

- Подписка Azure с правами на создание вычислительных и сетевых ресурсов
- Установленный Azure CLI (при необходимости см. [инструкции по установке Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli))
- Пара SSH-ключей (в руководстве показано, как создать ее при необходимости)
- ~20-30 минут

## Настройка развертывания

<Steps>
  <Step title="Войдите в Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    Расширение `ssh` требуется для нативного SSH-туннелирования Azure Bastion.

  </Step>

  <Step title="Зарегистрируйте необходимые поставщики ресурсов (один раз)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Проверьте регистрацию. Дождитесь, пока оба покажут `Registered`.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Задайте переменные развертывания">
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

    Измените имена и диапазоны CIDR под вашу среду. Подсеть Bastion должна быть не меньше `/26`.

  </Step>

  <Step title="Выберите SSH-ключ">
    Используйте существующий публичный ключ, если он у вас есть:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Если у вас еще нет SSH-ключа, создайте его:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Выберите размер виртуальной машины и размер диска ОС">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    Выберите размер виртуальной машины и размер диска ОС, доступные в вашей подписке и регионе:

    - Начните с меньшего размера для легкой нагрузки и увеличьте его позже
    - Используйте больше vCPU/RAM/диска для более тяжелой автоматизации, большего числа каналов или более крупных нагрузок моделей/инструментов
    - Если размер виртуальной машины недоступен в вашем регионе или квоте подписки, выберите ближайший доступный SKU

    Список размеров виртуальных машин, доступных в целевом регионе:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Проверьте текущее использование и квоту vCPU и диска:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Развертывание ресурсов Azure

<Steps>
  <Step title="Создайте группу ресурсов">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Создайте группу сетевой безопасности">
    Создайте NSG и добавьте правила, чтобы только подсеть Bastion могла подключаться к виртуальной машине по SSH.

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

    Правила оцениваются по приоритету (сначала меньшее число): трафик Bastion разрешен с приоритетом 100, затем весь другой SSH блокируется с приоритетами 110 и 120.

  </Step>

  <Step title="Создайте виртуальную сеть и подсети">
    Создайте VNet с подсетью виртуальной машины (с подключенной NSG), затем добавьте подсеть Bastion.

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

  <Step title="Создайте виртуальную машину">
    У виртуальной машины нет публичного IP. Доступ по SSH осуществляется исключительно через Azure Bastion.

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

    `--public-ip-address ""` предотвращает назначение публичного IP. `--nsg ""` пропускает создание NSG на уровне NIC (за безопасность отвечает NSG на уровне подсети).

    **Воспроизводимость:** приведенная выше команда использует `latest` для образа Ubuntu. Чтобы закрепить конкретную версию, выведите список доступных версий и замените `latest`:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Создайте Azure Bastion">
    Azure Bastion предоставляет управляемый SSH-доступ к виртуальной машине без раскрытия публичного IP. Для `az network bastion ssh` на основе CLI требуется Standard SKU с туннелированием.

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

    Подготовка Bastion обычно занимает 5-10 минут, но в некоторых регионах может занять до 15-30 минут.

  </Step>
</Steps>

## Установка OpenClaw

<Steps>
  <Step title="Подключитесь к виртуальной машине по SSH через Azure Bastion">
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

  <Step title="Установите OpenClaw (в оболочке виртуальной машины)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    Установщик устанавливает Node LTS и зависимости, если они еще не установлены, устанавливает OpenClaw и запускает мастер первичной настройки. Подробности см. в разделе [Установка](/ru/install).

  </Step>

  <Step title="Проверьте Gateway">
    После завершения первичной настройки:

    ```bash
    openclaw gateway status
    ```

    У большинства корпоративных команд Azure уже есть лицензии GitHub Copilot. Если это ваш случай, рекомендуем выбрать провайдера GitHub Copilot в мастере первичной настройки OpenClaw. См. [Провайдер GitHub Copilot](/ru/providers/github-copilot).

  </Step>
</Steps>

## Соображения по стоимости

Azure Bastion Standard SKU стоит примерно **\$140/месяц**, а виртуальная машина (Standard_B2as_v2) стоит примерно **\$55/месяц**.

Чтобы снизить расходы:

- **Освобождайте виртуальную машину**, когда она не используется (это останавливает начисление за вычисления; плата за диск остается). OpenClaw Gateway будет недоступен, пока виртуальная машина освобождена — перезапустите ее, когда она снова понадобится в работе:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- **Удаляйте Bastion, когда он не нужен**, и создавайте его заново, когда потребуется SSH-доступ. Bastion — крупнейшая составляющая стоимости, а его подготовка занимает всего несколько минут.
- **Используйте Basic Bastion SKU** (~\$38/месяц), если вам нужен только SSH через Portal и не требуется CLI-туннелирование (`az network bastion ssh`).

## Очистка

Чтобы удалить все ресурсы, созданные по этому руководству:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Это удалит группу ресурсов и все внутри нее (виртуальную машину, VNet, NSG, Bastion, публичный IP).

## Следующие шаги

- Настройте каналы сообщений: [Каналы](/ru/channels)
- Подключите локальные устройства как узлы: [Узлы](/ru/nodes)
- Настройте Gateway: [Конфигурация Gateway](/ru/gateway/configuration)
- Подробнее о развертывании OpenClaw в Azure с провайдером модели GitHub Copilot: [OpenClaw в Azure с GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## См. также

- [Обзор установки](/ru/install)
- [GCP](/ru/install/gcp)
- [DigitalOcean](/ru/install/digitalocean)
