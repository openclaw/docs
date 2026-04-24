---
read_when:
    - Network Security Groupのハードニングを施したAzure上でOpenClawを24時間365日稼働させたい場合
    - 自分のAzure Linux VM上で本番グレードの常時稼働OpenClaw Gatewayを運用したい場合
    - Azure Bastion SSHによる安全な管理が必要な場合
summary: 永続状態を持つAzure Linux VM上でOpenClaw Gatewayを24時間365日実行する
title: Azure
x-i18n:
    generated_at: "2026-04-24T05:02:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: e42e1a35e0340b959b73c548bc1efd6366bee38cf4c8cd23d986c5f14e5da0e0
    source_path: install/azure.md
    workflow: 15
---

# Azure Linux VM上のOpenClaw

このガイドでは、Azure CLIを使ってAzure Linux VMをセットアップし、Network Security Group（NSG）のハードニングを適用し、SSHアクセス用にAzure Bastionを設定し、OpenClawをインストールします。

## 実施内容

- Azure CLIでAzureネットワーク（VNet、サブネット、NSG）とコンピュートリソースを作成する
- VMへのSSHをAzure Bastionからのみに制限するNetwork Security Groupルールを適用する
- SSHアクセスにAzure Bastionを使用する（VMにパブリックIPは付与しない）
- インストーラースクリプトでOpenClawをインストールする
- Gatewayを確認する

## 必要なもの

- コンピュートおよびネットワークリソースを作成する権限を持つAzureサブスクリプション
- インストール済みのAzure CLI（必要であれば[Azure CLI install steps](https://learn.microsoft.com/cli/azure/install-azure-cli)を参照）
- SSH鍵ペア（必要ならこのガイドで生成方法も扱います）
- 約20～30分

## デプロイの設定

<Steps>
  <Step title="Azure CLIにサインインする">
    ```bash
    az login
    az extension add -n ssh
    ```

    `ssh`拡張は、Azure BastionのネイティブSSHトンネリングに必要です。

  </Step>

  <Step title="必要なリソースプロバイダーを登録する（初回のみ）">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    登録状況を確認します。両方が`Registered`になるまで待ってください。

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="デプロイ変数を設定する">
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

    名前とCIDR範囲は自分の環境に合わせて調整してください。Bastionサブネットは少なくとも`/26`である必要があります。

  </Step>

  <Step title="SSH鍵を選択する">
    既存の公開鍵がある場合は、それを使用してください。

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    まだSSH鍵がない場合は生成します。

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="VMサイズとOSディスクサイズを選択する">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    サブスクリプションとリージョンで利用可能なVMサイズとOSディスクサイズを選んでください。

    - 軽い用途なら小さめから始め、後でスケールアップする
    - より重い自動化、チャネル数の増加、または大きなモデル/ツール負荷には、より多くのvCPU/RAM/ディスクを使う
    - リージョンまたはサブスクリプションのクォータでVMサイズが利用できない場合は、最も近い利用可能SKUを選ぶ

    対象リージョンで利用可能なVMサイズ一覧:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    現在のvCPUおよびディスク使用量/クォータを確認:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Azureリソースをデプロイする

<Steps>
  <Step title="リソースグループを作成する">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Network Security Groupを作成する">
    NSGを作成し、BastionサブネットからのみVMへSSHできるルールを追加します。

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # BastionサブネットからのみSSHを許可
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # パブリックインターネットからのSSHを拒否
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # その他のVNet送信元からのSSHを拒否
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    ルールは優先度順（小さい数字が先）に評価されます。Bastionトラフィックは100で許可され、その後110と120でその他すべてのSSHがブロックされます。

  </Step>

  <Step title="仮想ネットワークとサブネットを作成する">
    まずVMサブネット（NSGをアタッチ）付きでVNetを作成し、その後Bastionサブネットを追加します。

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # VMサブネットにNSGをアタッチ
    az network vnet subnet update \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n "${VM_SUBNET_NAME}" --nsg "${NSG_NAME}"

    # AzureBastionSubnet — Azureが要求する名前
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="VMを作成する">
    このVMにはパブリックIPがありません。SSHアクセスはAzure Bastion経由に限定されます。

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

    `--public-ip-address ""`はパブリックIPが割り当てられないようにします。`--nsg ""`はNICごとのNSG作成をスキップします（セキュリティはサブネットレベルNSGが処理します）。

    **再現性:** 上記コマンドはUbuntuイメージに`latest`を使用しています。特定バージョンに固定するには、利用可能バージョンを一覧し、`latest`を置き換えてください。

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Azure Bastionを作成する">
    Azure Bastionは、パブリックIPを公開せずにVMへのマネージドSSHアクセスを提供します。CLIベースの`az network bastion ssh`には、トンネリング対応のStandard SKUが必要です。

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

    Bastionのプロビジョニングには通常5～10分かかりますが、リージョンによっては15～30分かかる場合があります。

  </Step>
</Steps>

## OpenClawをインストールする

<Steps>
  <Step title="Azure Bastion経由でVMへSSH接続する">
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

  <Step title="OpenClawをインストールする（VMシェル内）">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    インストーラーは、必要であればNode LTSと依存関係をインストールし、OpenClawをインストールし、オンボーディングウィザードを起動します。詳細は[Install](/ja-JP/install)を参照してください。

  </Step>

  <Step title="Gatewayを確認する">
    オンボーディング完了後:

    ```bash
    openclaw gateway status
    ```

    多くの企業のAzureチームでは、すでにGitHub Copilotライセンスを持っています。その場合、OpenClawオンボーディングウィザードではGitHub Copilotプロバイダーを選ぶことを推奨します。[GitHub Copilot provider](/ja-JP/providers/github-copilot)を参照してください。

  </Step>
</Steps>

## コストに関する考慮事項

Azure Bastion Standard SKUはおよそ**\$140/月**、VM（Standard_B2as_v2）はおよそ**\$55/月**です。

コストを下げるには:

- **使わないときはVMを停止割り当て解除する**（コンピュート課金は停止、ディスク課金は継続）。VMが停止割り当て解除されている間は、OpenClaw Gatewayには到達できません。再びライブで使う必要があるときに再起動してください:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # 後で再起動
  ```

- **不要なときはBastionを削除する**。SSHアクセスが必要になったら再作成します。Bastionは最大のコスト要因であり、プロビジョニングは数分で済みます。
- **PortalベースのSSHだけでよく、CLIトンネリング（`az network bastion ssh`）が不要ならBasic Bastion SKU**（約\$38/月）を使います。

## クリーンアップ

このガイドで作成したすべてのリソースを削除するには:

```bash
az group delete -n "${RG}" --yes --no-wait
```

これにより、リソースグループとその中身すべて（VM、VNet、NSG、Bastion、パブリックIP）が削除されます。

## 次のステップ

- メッセージングチャネルを設定する: [Channels](/ja-JP/channels)
- ローカルデバイスをNodeとしてペアリングする: [Nodes](/ja-JP/nodes)
- Gatewayを設定する: [Gateway configuration](/ja-JP/gateway/configuration)
- GitHub Copilotモデルプロバイダーを使ったOpenClawのAzureデプロイの詳細: [OpenClaw on Azure with GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## 関連

- [Install overview](/ja-JP/install)
- [GCP](/ja-JP/install/gcp)
- [DigitalOcean](/ja-JP/install/digitalocean)
