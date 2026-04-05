---
read_when:
    - 你希望 OpenClaw 在 Azure 上 24/7 运行，并配合 Network Security Group 加固
    - 你希望在自己的 Azure Linux VM 上部署一个生产级、始终在线的 OpenClaw Gateway 网关
    - 你希望通过 Azure Bastion SSH 进行安全管理
summary: 在 Azure Linux VM 上 24/7 运行 OpenClaw Gateway 网关，并保持持久状态
title: Azure
x-i18n:
    generated_at: "2026-04-05T08:26:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: dcdcf6dcf5096cd21e1b64f455656f7d77b477d03e9a088db74c6e988c3031db
    source_path: install/azure.md
    workflow: 15
---

# 在 Azure Linux VM 上运行 OpenClaw

本指南将使用 Azure CLI 设置 Azure Linux VM，应用 Network Security Group（NSG）加固，配置 Azure Bastion 以提供 SSH 访问，并安装 OpenClaw。

## 你将要完成的事项

- 使用 Azure CLI 创建 Azure 网络（VNet、子网、NSG）和计算资源
- 应用 Network Security Group 规则，使 VM SSH 仅允许来自 Azure Bastion 的访问
- 使用 Azure Bastion 进行 SSH 访问（VM 不分配公网 IP）
- 使用安装脚本安装 OpenClaw
- 验证 Gateway 网关

## 你需要准备的内容

- 一个具有创建计算和网络资源权限的 Azure 订阅
- 已安装 Azure CLI（如有需要，请参见 [Azure CLI 安装步骤](https://learn.microsoft.com/cli/azure/install-azure-cli)）
- 一对 SSH 密钥（如果还没有，本指南也会说明如何生成）
- 约 20-30 分钟

## 配置部署

<Steps>
  <Step title="登录 Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    `ssh` 扩展是 Azure Bastion 原生 SSH 隧道所必需的。

  </Step>

  <Step title="注册所需的资源 provider（一次性）">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    验证注册状态。等待二者都显示 `Registered`。

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

    请根据你的环境调整名称和 CIDR 范围。Bastion 子网必须至少为 `/26`。

  </Step>

  <Step title="选择 SSH 密钥">
    如果你已有公钥，请直接使用：

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    如果你还没有 SSH 密钥，请先生成一个：

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="选择 VM 规格和 OS 磁盘大小">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    请选择你的订阅和区域中可用的 VM 规格与 OS 磁盘大小：

    - 轻量使用场景可先选较小规格，之后再扩容
    - 如果需要更重的自动化、更多渠道，或更大的模型/工具负载，请选择更多 vCPU/RAM/磁盘
    - 如果某个 VM 规格在你的区域或订阅配额中不可用，请选择最接近的可用 SKU

    列出目标区域中可用的 VM 规格：

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    检查你当前的 vCPU 和磁盘使用量/配额：

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
    创建 NSG，并添加规则，使只有 Bastion 子网可以通过 SSH 连接到 VM。

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # 仅允许来自 Bastion 子网的 SSH
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # 拒绝来自公网的 SSH
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # 拒绝来自其他 VNet 来源的 SSH
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    这些规则按优先级顺序评估（数字越小优先级越高）：优先级 100 允许 Bastion 流量，然后在 110 和 120 阻止所有其他 SSH。

  </Step>

  <Step title="创建虚拟网络和子网">
    创建 VNet 和 VM 子网（附加 NSG），然后添加 Bastion 子网。

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # 将 NSG 附加到 VM 子网
    az network vnet subnet update \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n "${VM_SUBNET_NAME}" --nsg "${NSG_NAME}"

    # AzureBastionSubnet —— 这是 Azure 要求的名称
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="创建 VM">
    该 VM 不分配公网 IP。SSH 访问完全通过 Azure Bastion 进行。

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

    `--public-ip-address ""` 可防止分配公网 IP。`--nsg ""` 会跳过为每个 NIC 创建单独 NSG（子网级 NSG 已负责安全控制）。

    **可复现性：** 上面的命令对 Ubuntu 镜像使用了 `latest`。如果你想固定到某个具体版本，请先列出可用版本，然后替换 `latest`：

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="创建 Azure Bastion">
    Azure Bastion 可在不暴露公网 IP 的情况下，为 VM 提供托管 SSH 访问。若要使用基于 CLI 的 `az network bastion ssh`，需要支持隧道的 Standard SKU。

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

    Bastion 通常需要 5-10 分钟完成配置，但在某些区域中可能需要长达 15-30 分钟。

  </Step>
</Steps>

## 安装 OpenClaw

<Steps>
  <Step title="通过 Azure Bastion SSH 进入 VM">
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

    安装程序会在尚未安装时安装 Node LTS 和依赖项，安装 OpenClaw，并启动新手引导向导。详见[安装](/install)。

  </Step>

  <Step title="验证 Gateway 网关">
    新手引导完成后，运行：

    ```bash
    openclaw gateway status
    ```

    大多数企业 Azure 团队已经拥有 GitHub Copilot 许可证。如果你的情况也是如此，我们建议你在 OpenClaw 新手引导向导中选择 GitHub Copilot provider。参见 [GitHub Copilot provider](/providers/github-copilot)。

  </Step>
</Steps>

## 成本考虑

Azure Bastion Standard SKU 的运行成本大约为**140 美元/月**，VM（Standard_B2as_v2）的运行成本大约为**55 美元/月**。

为了降低成本：

- **在不使用时释放 VM**（停止计算计费；磁盘费用仍然保留）。当 VM 被释放时，OpenClaw Gateway 网关将不可访问——当你再次需要它在线时请重新启动：

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # 之后重新启动
  ```

- **在不需要时删除 Bastion**，等需要 SSH 访问时再重新创建。Bastion 是最大的成本项，而且通常只需几分钟即可重新配置完成。
- 如果你只需要基于 Portal 的 SSH，而不需要 CLI 隧道（`az network bastion ssh`），请使用 **Basic Bastion SKU**（约 **38 美元/月**）。

## 清理

如需删除本指南创建的所有资源：

```bash
az group delete -n "${RG}" --yes --no-wait
```

这将删除资源组及其内部的所有内容（VM、VNet、NSG、Bastion、公网 IP）。

## 后续步骤

- 设置消息渠道：[Channels](/channels)
- 将本地设备配对为节点：[Nodes](/nodes)
- 配置 Gateway 网关：[Gateway 配置](/gateway/configuration)
- 若要了解使用 GitHub Copilot 模型 provider 在 Azure 上部署 OpenClaw 的更多细节，请参见：[OpenClaw on Azure with GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)
