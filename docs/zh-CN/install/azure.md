---
read_when:
    - 你希望 OpenClaw 在 Azure 上全天候运行，并通过网络安全组进行安全加固
    - 你希望在自己的 Azure Linux 虚拟机上运行一个生产级、始终在线的 OpenClaw Gateway 网关
    - 你希望使用 Azure Bastion SSH 进行安全管理
summary: 在 Azure Linux 虚拟机上全天候运行 OpenClaw Gateway 网关并持久保存状态
title: Azure
x-i18n:
    generated_at: "2026-07-11T20:39:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8598014cdc2786a47039ffb42ddd85354da9c87fd55ea46bb6dad7714171a14
    source_path: install/azure.md
    workflow: 16
---

使用 Azure CLI 设置 Azure Linux VM，应用网络安全组（NSG）加固，配置 Azure Bastion 以便通过 SSH 访问，并安装 OpenClaw。

## 你将完成的操作

- 使用 Azure CLI 创建 Azure 网络资源（VNet、子网、NSG）和计算资源
- 应用 NSG 规则，仅允许从 Azure Bastion 通过 SSH 访问 VM
- 使用 Azure Bastion 进行 SSH 访问（VM 不配置公共 IP）
- 使用安装脚本安装 OpenClaw
- 验证 Gateway 网关

## 你需要准备

- 一个有权创建计算和网络资源的 Azure 订阅
- 已安装 Azure CLI（参阅 [Azure CLI 安装步骤](https://learn.microsoft.com/cli/azure/install-azure-cli)）
- 一对 SSH 密钥（如果需要，本指南会介绍如何生成）
- 大约 20–30 分钟

## 配置部署

<Steps>
  <Step title="登录 Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    Azure Bastion 原生 SSH 隧道需要 `ssh` 扩展。

  </Step>

  <Step title="注册所需的资源提供商（仅需一次）">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    验证注册状态；等待两者都显示 `Registered`。

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="设置部署变量">
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

    调整名称和 CIDR 范围，以适应你的环境。Bastion 子网必须至少为 `/26`。

  </Step>

  <Step title="选择 SSH 密钥">
    如果已有公钥，请使用现有公钥：

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    否则，生成一对密钥：

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="选择 VM 大小和操作系统磁盘大小">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    - 对于轻量使用，可以从较小的配置开始，以后再扩容。
    - 对于负载较重的自动化、更多渠道或更大的模型/工具工作负载，请使用更多 vCPU、RAM 和磁盘空间。
    - 如果你的区域或订阅配额不支持某个大小，请选择最接近的可用 SKU。

    列出目标区域中可用的 VM 大小：

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    检查当前的 vCPU 和磁盘用量/配额：

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## 部署 Azure 资源

<Steps>
  <Step title="创建资源组">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="创建网络安全组">
    创建 NSG 并添加规则，仅允许 Bastion 子网通过 SSH 访问 VM。

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

    规则按优先级求值，数字越小越先执行：优先级 100 允许 Bastion 流量，然后优先级 110 和 120 阻止所有其他 SSH 流量。

  </Step>

  <Step title="创建虚拟网络和子网">
    创建包含 VM 子网（已关联 NSG）的 VNet，然后添加 Bastion 子网。

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

  <Step title="创建 VM">
    VM 不会获得公共 IP。SSH 访问只能通过 Azure Bastion 进行。

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

    `--public-ip-address ""` 可防止分配公共 IP。由于子网级 NSG 已经负责安全控制，`--nsg ""` 会跳过为每个 NIC 创建 NSG。

    如果要固定使用特定的 Ubuntu 映像版本，而不是 `latest`，请先列出可用版本：

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="创建 Azure Bastion">
    Azure Bastion 可提供托管式 SSH 访问，而无需在 VM 上公开公共 IP。若要通过 CLI 使用 `az network bastion ssh`，必须使用已启用隧道功能的 Standard SKU。

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

    Bastion 预配通常需要 5–10 分钟，但在某些区域可能需要 15–30 分钟。

  </Step>
</Steps>

## 安装 OpenClaw

<Steps>
  <Step title="通过 Azure Bastion 使用 SSH 登录 VM">
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

  <Step title="安装 OpenClaw（在 VM shell 中）">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    如果尚未安装 Node 和依赖项，安装程序会进行安装，然后安装 OpenClaw 并启动新手引导。有关详情，请参阅[安装](/zh-CN/install)。

  </Step>

  <Step title="验证 Gateway 网关">
    新手引导完成后：

    ```bash
    openclaw gateway status
    ```

    如果你的组织已有 GitHub Copilot 许可证，可以在新手引导期间选择 GitHub Copilot 提供商，而无需单独的模型 API 密钥。请参阅 [GitHub Copilot 提供商](/zh-CN/providers/github-copilot)。

  </Step>
</Steps>

## 成本注意事项

每月费用估算如下（请在 Azure 定价计算器中确认当前价格，因为费率会因区域而异，也会随时间变化）：

- Azure Bastion Standard SKU：约 140 美元/月
- VM（`Standard_B2as_v2`）：约 55 美元/月

降低成本的方法：

- 不使用 VM 时将其解除分配。这样会停止计算资源计费（仍会收取磁盘费用）。VM 解除分配后，Gateway 网关将无法访问。

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- 不需要 Bastion 时将其删除，并在再次需要 SSH 访问时重新创建；它是成本最高的组成部分，预配只需几分钟。
- 如果只需要通过 Portal 使用 SSH，并且不需要 CLI 隧道（`az network bastion ssh`），可以使用 Basic Bastion SKU（约 38 美元/月）。

## 清理

删除本指南创建的所有资源：

```bash
az group delete -n "${RG}" --yes --no-wait
```

这会删除资源组及其中的所有内容（VM、VNet、NSG、Bastion、公共 IP）。

## 后续步骤

- 设置消息渠道：[渠道](/zh-CN/channels)
- 将本地设备配对为节点：[节点](/zh-CN/nodes)
- 配置 Gateway 网关：[Gateway 配置](/zh-CN/gateway/configuration)
- 了解有关使用 GitHub Copilot 模型提供商在 Azure 上部署的更多详情：[在 Azure 上将 OpenClaw 与 GitHub Copilot 配合使用](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## 相关内容

- [安装概览](/zh-CN/install)
- [GCP](/zh-CN/install/gcp)
- [DigitalOcean](/zh-CN/install/digitalocean)
