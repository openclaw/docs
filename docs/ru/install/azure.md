---
read_when:
    - Вы хотите, чтобы OpenClaw работал круглосуточно в Azure с усиленной защитой с помощью группы безопасности сети (Network Security Group)
    - Вам нужен готовый к промышленной эксплуатации, постоянно работающий OpenClaw Gateway на собственной виртуальной машине Azure с Linux
    - Вам нужно безопасное администрирование через SSH в Azure Bastion
summary: Запуск OpenClaw Gateway в режиме 24/7 на виртуальной машине Azure с Linux и постоянным хранением состояния
title: Azure
x-i18n:
    generated_at: "2026-07-13T18:14:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: e8598014cdc2786a47039ffb42ddd85354da9c87fd55ea46bb6dad7714171a14
    source_path: install/azure.md
    workflow: 16
---

Настройте виртуальную машину Linux в Azure с помощью Azure CLI, примените усиленные правила группы безопасности сети (NSG), настройте Azure Bastion для доступа по SSH и установите OpenClaw.

## Что вы сделаете

- Создадите сетевые ресурсы Azure (VNet, подсети, NSG) и вычислительные ресурсы с помощью Azure CLI
- Примените правила NSG, разрешающие SSH-доступ к виртуальной машине только из Azure Bastion
- Будете использовать Azure Bastion для доступа по SSH (без общедоступного IP-адреса у виртуальной машины)
- Установите OpenClaw с помощью скрипта установки
- Проверите Gateway

## Что потребуется

- Подписка Azure с разрешениями на создание вычислительных и сетевых ресурсов
- Установленный Azure CLI (см. [инструкции по установке Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli))
- Пара ключей SSH (в этом руководстве описано, как создать ее при необходимости)
- Около 20–30 минут

## Настройка развертывания

<Steps>
  <Step title="Войдите через Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    Расширение `ssh` необходимо для нативного туннелирования SSH через Azure Bastion.

  </Step>

  <Step title="Зарегистрируйте необходимые поставщики ресурсов (однократно)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Проверьте регистрацию; дождитесь, пока оба поставщика не отобразят состояние `Registered`.

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

    Измените имена и диапазоны CIDR в соответствии со своей средой. Размер подсети Bastion должен быть не меньше `/26`.

  </Step>

  <Step title="Выберите ключ SSH">
    Используйте существующий открытый ключ, если он у вас есть:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    В противном случае создайте его:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Выберите размер виртуальной машины и системного диска">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    - Для небольшой нагрузки начните с меньшей конфигурации и при необходимости увеличьте ее позднее.
    - Для более интенсивной автоматизации, большего количества каналов или более ресурсоемких задач моделей и инструментов используйте больше виртуальных ЦП, оперативной памяти и дискового пространства.
    - Если размер недоступен в вашем регионе или в рамках квоты подписки, выберите ближайший доступный SKU.

    Выведите список размеров виртуальных машин, доступных в целевом регионе:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Проверьте текущее использование и квоты виртуальных ЦП и дисков:

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

  <Step title="Создайте группу безопасности сети">
    Создайте NSG и добавьте правила, разрешающие подключение по SSH к виртуальной машине только из подсети Bastion.

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # Разрешить SSH только из подсети Bastion
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # Запретить SSH из общедоступного Интернета
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # Запретить SSH из других источников VNet
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    Правила обрабатываются в порядке приоритета, начиная с наименьшего номера: трафик Bastion разрешается с приоритетом 100, а весь остальной трафик SSH блокируется правилами с приоритетами 110 и 120.

  </Step>

  <Step title="Создайте виртуальную сеть и подсети">
    Создайте VNet с подсетью виртуальной машины (с подключенной NSG), затем добавьте подсеть Bastion.

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # Подключить NSG к подсети виртуальной машины
    az network vnet subnet update \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n "${VM_SUBNET_NAME}" --nsg "${NSG_NAME}"

    # AzureBastionSubnet: Azure требует именно это имя
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="Создайте виртуальную машину">
    Виртуальной машине не назначается общедоступный IP-адрес. Доступ по SSH осуществляется исключительно через Azure Bastion.

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

    `--public-ip-address ""` предотвращает назначение общедоступного IP-адреса. `--nsg ""` отключает создание NSG для отдельного сетевого интерфейса, поскольку безопасность уже обеспечивает NSG на уровне подсети.

    Чтобы закрепить определенную версию образа Ubuntu вместо `latest`, сначала выведите список доступных версий:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Создайте Azure Bastion">
    Azure Bastion предоставляет управляемый доступ по SSH, не открывая общедоступный IP-адрес виртуальной машины. Для `az network bastion ssh` через CLI требуется SKU Standard с включенным туннелированием.

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

    Подготовка Bastion обычно занимает 5–10 минут, но в некоторых регионах может занять до 15–30 минут.

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

    Установщик устанавливает Node и зависимости, если они еще не установлены, затем устанавливает OpenClaw и запускает первоначальную настройку. Подробности см. в разделе [Установка](/ru/install).

  </Step>

  <Step title="Проверьте Gateway">
    После завершения первоначальной настройки:

    ```bash
    openclaw gateway status
    ```

    Если у вашей организации уже есть лицензии GitHub Copilot, при первоначальной настройке можно выбрать поставщика GitHub Copilot вместо отдельного ключа API модели. См. раздел [Поставщик GitHub Copilot](/ru/providers/github-copilot).

  </Step>
</Steps>

## Сведения о стоимости

Приблизительные ежемесячные расходы (проверьте актуальные цены в калькуляторе цен Azure, поскольку тарифы зависят от региона и меняются со временем):

- Azure Bastion с SKU Standard: примерно $140 в месяц
- Виртуальная машина (`Standard_B2as_v2`): примерно $55 в месяц

Чтобы сократить расходы:

- Освобождайте виртуальную машину, когда она не используется. Это прекращает начисление платы за вычислительные ресурсы (плата за диск продолжает взиматься). Пока виртуальная машина освобождена, Gateway недоступен.

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # запустить позднее
  ```

- Удаляйте Bastion, когда он не нужен, и создавайте его заново, когда снова потребуется доступ по SSH; это самая крупная статья расходов, а подготовка занимает несколько минут.
- Используйте SKU Basic для Bastion (примерно $38 в месяц), если вам нужен только доступ по SSH через портал и не требуется туннелирование через CLI (`az network bastion ssh`).

## Очистка

Удалите все ресурсы, созданные по этому руководству:

```bash
az group delete -n "${RG}" --yes --no-wait
```

При этом удаляется группа ресурсов и все содержащиеся в ней ресурсы (виртуальная машина, VNet, NSG, Bastion и общедоступный IP-адрес).

## Дальнейшие действия

- Настройте каналы обмена сообщениями: [Каналы](/ru/channels)
- Свяжите локальные устройства как узлы: [Узлы](/ru/nodes)
- Настройте Gateway: [Конфигурация Gateway](/ru/gateway/configuration)
- Подробнее о развертывании в Azure с поставщиком модели GitHub Copilot: [OpenClaw в Azure с GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Связанные материалы

- [Обзор установки](/ru/install)
- [GCP](/ru/install/gcp)
- [DigitalOcean](/ru/install/digitalocean)
