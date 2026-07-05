---
read_when:
    - 你想要讓 OpenClaw 在 Azure 上 24/7 運行，並強化網路安全性群組防護
    - 你想在自己的 Azure Linux VM 上執行生產級、永遠在線的 OpenClaw 閘道
    - 您想要透過 Azure Bastion SSH 進行安全管理
summary: 在 Azure Linux VM 上全天候執行 OpenClaw 閘道並保留持久狀態
title: Azure
x-i18n:
    generated_at: "2026-07-05T11:29:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8598014cdc2786a47039ffb42ddd85354da9c87fd55ea46bb6dad7714171a14
    source_path: install/azure.md
    workflow: 16
---

使用 Azure 命令列介面設定 Azure Linux 虛擬機器，套用網路安全性群組 (NSG) 強化，設定 Azure Bastion 以進行 SSH 存取，並安裝 OpenClaw。

## 你將執行的事項

- 使用 Azure 命令列介面建立 Azure 網路（VNet、子網路、NSG）與運算資源
- 套用 NSG 規則，讓 VM SSH 僅允許來自 Azure Bastion
- 使用 Azure Bastion 進行 SSH 存取（VM 上沒有公用 IP）
- 使用安裝程式指令碼安裝 OpenClaw
- 驗證閘道

## 你需要準備的事項

- 具備建立運算與網路資源權限的 Azure 訂用帳戶
- 已安裝 Azure 命令列介面（請參閱 [Azure 命令列介面安裝步驟](https://learn.microsoft.com/cli/azure/install-azure-cli)）
- 一組 SSH 金鑰組（本指南會涵蓋如何在需要時產生）
- 約 20-30 分鐘

## 設定部署

<Steps>
  <Step title="登入 Azure 命令列介面">
    ```bash
    az login
    az extension add -n ssh
    ```

    Azure Bastion 原生 SSH 通道需要 `ssh` 擴充功能。

  </Step>

  <Step title="註冊必要的資源提供者（一次性）">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    驗證註冊狀態；等待兩者都顯示 `Registered`。

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

  <Step title="選取 SSH 金鑰">
    如果你已有公開金鑰，請使用現有金鑰：

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    否則，請產生一組金鑰：

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="選取 VM 大小與 OS 磁碟大小">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    - 輕量使用可從較小規格開始，之後再擴充。
    - 較重的自動化、更多通道，或較大的模型/工具工作負載，請使用更多 vCPU/RAM/磁碟。
    - 如果你的區域或訂用帳戶配額無法使用某個大小，請選取最接近的可用 SKU。

    列出目標區域可用的 VM 大小：

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

    規則會依優先順序評估，數字越低越先處理：Bastion 流量在 100 被允許，接著所有其他 SSH 會在 110 與 120 被封鎖。

  </Step>

  <Step title="建立虛擬網路與子網路">
    使用 VM 子網路（已附加 NSG）建立 VNet，然後新增 Bastion 子網路。

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

  <Step title="建立 VM">
    VM 不會取得公用 IP。SSH 存取只會透過 Azure Bastion 進行。

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

    `--public-ip-address ""` 會防止指派公用 IP。`--nsg ""` 會略過每個 NIC 的 NSG，因為子網路層級的 NSG 已經處理安全性。

    若要固定使用特定 Ubuntu 映像版本而不是 `latest`，請先列出可用版本：

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="建立 Azure Bastion">
    Azure Bastion 提供受控 SSH 存取，不需在 VM 上公開公用 IP。若要使用以命令列介面為基礎的 `az network bastion ssh`，必須使用已啟用通道的 Standard SKU。

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
  <Step title="透過 Azure Bastion 以 SSH 連入 VM">
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

    安裝程式會在尚未存在時安裝節點與相依項，安裝 OpenClaw，並啟動上線流程。詳情請參閱[安裝](/zh-TW/install)。

  </Step>

  <Step title="驗證閘道">
    上線流程完成後：

    ```bash
    openclaw gateway status
    ```

    如果你的組織已有 GitHub Copilot 授權，你可以在上線流程期間選擇 GitHub Copilot 提供者，而不是使用另外的模型 API 金鑰。請參閱 [GitHub Copilot 提供者](/zh-TW/providers/github-copilot)。

  </Step>
</Steps>

## 成本考量

大約每月成本（請在 Azure Pricing Calculator 中確認目前定價，因為費率會因區域而異且會隨時間變動）：

- Azure Bastion Standard SKU：約 $140/月
- VM (`Standard_B2as_v2`)：約 $55/月

若要降低成本：

- 不使用時解除配置 VM。這會停止運算計費（仍會產生磁碟費用）。解除配置期間無法連線到閘道。

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- 不需要時刪除 Bastion，等再次需要 SSH 存取時再重新建立；它是最大的成本組成，且可在幾分鐘內完成佈建。
- 如果你只需要透過 Portal 進行 SSH，且不需要命令列介面通道 (`az network bastion ssh`)，請使用 Basic Bastion SKU（約 $38/月）。

## 清理

刪除本指南建立的所有資源：

```bash
az group delete -n "${RG}" --yes --no-wait
```

這會移除資源群組及其中的所有項目（VM、VNet、NSG、Bastion、公用 IP）。

## 後續步驟

- 設定訊息通道：[通道](/zh-TW/channels)
- 將本機裝置配對為節點：[節點](/zh-TW/nodes)
- 設定閘道：[閘道設定](/zh-TW/gateway/configuration)
- 使用 GitHub Copilot 模型提供者進行 Azure 部署的更多細節：[Azure 上搭配 GitHub Copilot 的 OpenClaw](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## 相關內容

- [安裝概觀](/zh-TW/install)
- [GCP](/zh-TW/install/gcp)
- [DigitalOcean](/zh-TW/install/digitalocean)
