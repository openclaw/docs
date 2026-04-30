---
read_when:
    - 您想要讓 OpenClaw 在 Azure 上全天候執行，並強化網路安全性群組
    - 你想要在自己的 Azure Linux VM 上執行生產級、全天候持續運作的 OpenClaw Gateway
    - 你想要透過 Azure Bastion SSH 進行安全管理
summary: 在具備持久狀態的 Azure Linux VM 上 24/7 執行 OpenClaw Gateway
title: Azure
x-i18n:
    generated_at: "2026-04-30T03:13:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: e42e1a35e0340b959b73c548bc1efd6366bee38cf4c8cd23d986c5f14e5da0e0
    source_path: install/azure.md
    workflow: 16
---

# Azure Linux VM 上的 OpenClaw

本指南會使用 Azure CLI 設定 Azure Linux VM、套用 Network Security Group (NSG) 強化、設定 Azure Bastion 以供 SSH 存取，並安裝 OpenClaw。

## 你將執行的事項

- 使用 Azure CLI 建立 Azure 網路（VNet、子網路、NSG）和運算資源
- 套用 Network Security Group 規則，讓 VM SSH 只允許來自 Azure Bastion
- 使用 Azure Bastion 進行 SSH 存取（VM 不使用公用 IP）
- 使用安裝程式指令碼安裝 OpenClaw
- 驗證 Gateway

## 你需要準備的項目

- 具備建立運算與網路資源權限的 Azure 訂閱
- 已安裝 Azure CLI（如有需要，請參閱 [Azure CLI 安裝步驟](https://learn.microsoft.com/cli/azure/install-azure-cli)）
- 一組 SSH 金鑰配對（本指南會在需要時說明如何產生）
- 約 20-30 分鐘

## 設定部署

<Steps>
  <Step title="登入 Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    `ssh` 擴充功能是 Azure Bastion 原生 SSH 通道所必需的。

  </Step>

  <Step title="註冊必要的資源提供者（一次性）">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    驗證註冊狀態。等待兩者都顯示 `Registered`。

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="設定部署變數">
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

    請調整名稱與 CIDR 範圍以符合你的環境。Bastion 子網路至少必須是 `/26`。

  </Step>

  <Step title="選擇 SSH 金鑰">
    如果你已有公用金鑰，請使用現有金鑰：

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    如果你尚未擁有 SSH 金鑰，請產生一組：

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="選擇 VM 大小與 OS 磁碟大小">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    選擇你的訂閱與區域可用的 VM 大小與 OS 磁碟大小：

    - 輕量使用可從較小規格開始，之後再擴充
    - 若有較重的自動化、更多通道，或較大的模型/工具工作負載，請使用更多 vCPU/RAM/磁碟
    - 如果某個 VM 大小在你的區域或訂閱配額中不可用，請選擇最接近的可用 SKU

    列出目標區域中可用的 VM 大小：

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    檢查目前的 vCPU 與磁碟使用量/配額：

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## 部署 Azure 資源

<Steps>
  <Step title="建立資源群組">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="建立網路安全性群組">
    建立 NSG 並新增規則，讓只有 Bastion 子網路可以透過 SSH 連入 VM。

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

    規則會依優先順序評估（數字越小越先）：Bastion 流量在 100 被允許，接著所有其他 SSH 會在 110 和 120 被封鎖。

  </Step>

  <Step title="建立虛擬網路和子網路">
    建立包含 VM 子網路（已附加 NSG）的 VNet，然後新增 Bastion 子網路。

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

  <Step title="建立 VM">
    VM 沒有公用 IP。SSH 存取完全透過 Azure Bastion。

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

    `--public-ip-address ""` 會避免指派公用 IP。`--nsg ""` 會略過建立每張 NIC 專用的 NSG（安全性由子網路層級的 NSG 處理）。

    **可重現性：** 上述命令對 Ubuntu 映像使用 `latest`。若要固定特定版本，請列出可用版本並取代 `latest`：

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="建立 Azure Bastion">
    Azure Bastion 可提供受控 SSH 存取 VM，而不暴露公用 IP。使用 CLI 執行 `az network bastion ssh` 時需要支援通道的 Standard SKU。

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

    Bastion 佈建通常需要 5-10 分鐘，但在某些區域可能需要最多 15-30 分鐘。

  </Step>
</Steps>

## 安裝 OpenClaw

<Steps>
  <Step title="透過 Azure Bastion SSH 進入 VM">
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

  <Step title="安裝 OpenClaw（在 VM shell 中）">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    如果尚未安裝，安裝程式會安裝 Node LTS 和相依套件，接著安裝 OpenClaw，並啟動入門設定精靈。詳情請參閱 [安裝](/zh-TW/install)。

  </Step>

  <Step title="驗證 Gateway">
    完成入門設定後：

    ```bash
    openclaw gateway status
    ```

    多數企業 Azure 團隊已經有 GitHub Copilot 授權。如果你也是這種情況，建議在 OpenClaw 入門設定精靈中選擇 GitHub Copilot 提供者。請參閱 [GitHub Copilot 提供者](/zh-TW/providers/github-copilot)。

  </Step>
</Steps>

## 成本考量

Azure Bastion Standard SKU 約為 **\$140/月**，VM (Standard_B2as_v2) 約為 **\$55/月**。

若要降低成本：

- **在不使用時解除配置 VM**（停止運算計費；磁碟費用仍會保留）。VM 解除配置時，OpenClaw Gateway 將無法連線，等你再次需要它上線時再重新啟動：

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- **不需要時刪除 Bastion**，等需要 SSH 存取時再重新建立。Bastion 是最大的成本項目，且只需幾分鐘即可佈建。
- 如果你只需要以 Portal 為基礎的 SSH，且不需要 CLI 通道 (`az network bastion ssh`)，請**使用 Basic Bastion SKU**（約 \$38/月）。

## 清理

若要刪除本指南建立的所有資源：

```bash
az group delete -n "${RG}" --yes --no-wait
```

這會移除資源群組及其中的所有內容（VM、VNet、NSG、Bastion、公用 IP）。

## 後續步驟

- 設定訊息通道：[通道](/zh-TW/channels)
- 將本機裝置配對為節點：[節點](/zh-TW/nodes)
- 設定 Gateway：[Gateway 設定](/zh-TW/gateway/configuration)
- 如需使用 GitHub Copilot 模型提供者在 Azure 上部署 OpenClaw 的更多詳情：[在 Azure 上搭配 GitHub Copilot 使用 OpenClaw](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## 相關內容

- [安裝概觀](/zh-TW/install)
- [GCP](/zh-TW/install/gcp)
- [DigitalOcean](/zh-TW/install/digitalocean)
