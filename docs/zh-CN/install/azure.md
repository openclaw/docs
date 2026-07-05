---
read_when:
    - 你希望 OpenClaw 在 Azure 上 24/7 运行，并进行 Network Security Group 加固
    - 你想在自己的 Azure Linux VM 上运行生产级、始终在线的 OpenClaw Gateway 网关
    - 你需要使用 Azure Bastion SSH 进行安全管理
summary: 在 Azure Linux VM 上全天候运行带持久状态的 OpenClaw Gateway 网关
title: Azure
x-i18n:
    generated_at: "2026-07-05T11:25:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8598014cdc2786a47039ffb42ddd85354da9c87fd55ea46bb6dad7714171a14
    source_path: install/azure.md
    workflow: 16
---

使用 Azure CLI 设置 Azure Linux VM，应用网络安全组（NSG）加固，配置 Azure Bastion 用于 SSH 访问，并安装 OpenClaw。

## 你将完成的操作

- 使用 Azure CLI 创建 Azure 网络（VNet、子网、NSG）和计算资源
- 应用 NSG 规则，使 VM SSH 仅允许来自 Azure Bastion
- 使用 Azure Bastion 进行 SSH 访问（VM 上没有公共 IP）
- 使用安装脚本安装 OpenClaw
- 验证 Gateway 网关

## 你需要准备

- 一个有权限创建计算和网络资源的 Azure 订阅
- 已安装 Azure CLI（见 [Azure CLI 安装步骤](https://learn.microsoft.com/cli/azure/install-azure-cli)）
- 一对 SSH 密钥（如果需要，本指南会介绍如何生成）
- 大约 20-30 分钟

## 配置部署

<Steps>
  <Step title="Sign in to Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    Azure Bastion 原生 SSH 隧道需要 `ssh` 扩展。

  </Step>

  <Step title="Register required resource providers (one time)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    验证注册；等待两者都显示 `Registered`。

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Set deployment variables">
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

    调整名称和 CIDR 范围以适配你的环境。Bastion 子网必须至少为 `/26`。

  </Step>

  <Step title="Select an SSH key">
    如果你已有公钥，请使用现有公钥：

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    否则，生成一个：

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Select VM size and OS disk size">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    - 轻量使用可以从较小规格开始，之后再扩容。
    - 对于更重的自动化、更多渠道，或更大的模型/工具工作负载，请使用更多 vCPU/RAM/磁盘。
    - 如果某个规格在你的区域或订阅配额中不可用，请选择最接近的可用 SKU。

    列出目标区域可用的 VM 规格：

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    检查当前 vCPU 和磁盘使用量/配额：

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## 部署 Azure 资源

<Steps>
  <Step title="Create the resource group">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Create the network security group">
    创建 NSG 并添加规则，使只有 Bastion 子网可以通过 SSH 进入 VM。

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

    规则按优先级评估，数字越小越先执行：Bastion 流量在 100 被允许，然后所有其他 SSH 在 110 和 120 被阻止。

  </Step>

  <Step title="Create the virtual network and subnets">
    创建带有 VM 子网（已附加 NSG）的 VNet，然后添加 Bastion 子网。

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

  <Step title="Create the VM">
    VM 不会获得公共 IP。SSH 访问完全通过 Azure Bastion 进行。

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

    `--public-ip-address ""` 会阻止分配公共 IP。`--nsg ""` 会跳过每个 NIC 的 NSG，因为子网级 NSG 已经处理安全性。

    如果要固定某个 Ubuntu 镜像版本而不是 `latest`，请先列出可用版本：

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Create Azure Bastion">
    Azure Bastion 提供托管式 SSH 访问，无需在 VM 上暴露公共 IP。基于 CLI 的 `az network bastion ssh` 需要启用隧道的 Standard SKU。

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

    Bastion 预配通常需要 5-10 分钟，但在某些区域可能需要最多 15-30 分钟。

  </Step>
</Steps>

## 安装 OpenClaw

<Steps>
  <Step title="SSH into the VM through Azure Bastion">
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

  <Step title="Install OpenClaw (in the VM shell)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    安装程序会在尚未存在时安装 Node 和依赖项，安装 OpenClaw，并启动新手引导。详情见 [安装](/zh-CN/install)。

  </Step>

  <Step title="Verify the gateway">
    新手引导完成后：

    ```bash
    openclaw gateway status
    ```

    如果你的组织已有 GitHub Copilot 许可证，你可以在新手引导期间选择 GitHub Copilot 提供商，而不是单独的模型 API key。见 [GitHub Copilot provider](/zh-CN/providers/github-copilot)。

  </Step>
</Steps>

## 成本注意事项

大致每月成本（请在 Azure Pricing Calculator 中验证当前价格，因为费率会因区域而异并随时间变化）：

- Azure Bastion Standard SKU：约 $140/月
- VM（`Standard_B2as_v2`）：约 $55/月

降低成本：

- 不使用时释放 VM。这会停止计算计费（磁盘费用仍会保留）。释放期间 Gateway 网关不可访问。

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- 不需要时删除 Bastion，并在再次需要 SSH 访问时重新创建；它是最大的成本组成部分，并且可在几分钟内预配完成。
- 如果你只需要基于 Portal 的 SSH，并且不需要 CLI 隧道（`az network bastion ssh`），请使用 Basic Bastion SKU（约 $38/月）。

## 清理

删除本指南创建的所有资源：

```bash
az group delete -n "${RG}" --yes --no-wait
```

这会移除资源组及其中的所有内容（VM、VNet、NSG、Bastion、公共 IP）。

## 后续步骤

- 设置消息渠道：[渠道](/zh-CN/channels)
- 将本地设备配对为节点：[节点](/zh-CN/nodes)
- 配置 Gateway 网关：[Gateway 配置](/zh-CN/gateway/configuration)
- 使用 GitHub Copilot 模型提供商在 Azure 上部署的更多细节：[在 Azure 上使用 GitHub Copilot 运行 OpenClaw](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## 相关

- [安装概览](/zh-CN/install)
- [GCP](/zh-CN/install/gcp)
- [DigitalOcean](/zh-CN/install/digitalocean)
