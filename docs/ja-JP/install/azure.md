---
read_when:
    - Network Security Group でセキュリティを強化し、Azure 上で OpenClaw を 24 時間 365 日稼働させたい場合
    - 独自の Azure Linux VM 上で、本番環境向けの常時稼働 OpenClaw Gateway を運用したい場合
    - Azure Bastion SSH を使用して安全に管理したい場合
summary: 永続的な状態を維持しながら、Azure Linux VM 上で OpenClaw Gateway を 24 時間 365 日稼働させる
title: Azure
x-i18n:
    generated_at: "2026-07-11T22:19:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8598014cdc2786a47039ffb42ddd85354da9c87fd55ea46bb6dad7714171a14
    source_path: install/azure.md
    workflow: 16
---

Azure CLI を使用して Azure Linux VM をセットアップし、Network Security Group（NSG）の強化を適用し、SSH アクセス用に Azure Bastion を構成して、OpenClaw をインストールします。

## 実行する内容

- Azure CLI を使用して Azure ネットワーク（VNet、サブネット、NSG）とコンピューティングリソースを作成する
- VM への SSH を Azure Bastion からのみ許可するように NSG ルールを適用する
- SSH アクセスに Azure Bastion を使用する（VM にパブリック IP は割り当てない）
- インストーラースクリプトを使用して OpenClaw をインストールする
- Gateway を検証する

## 必要なもの

- コンピューティングリソースとネットワークリソースを作成する権限を持つ Azure サブスクリプション
- Azure CLI がインストールされていること（[Azure CLI のインストール手順](https://learn.microsoft.com/cli/azure/install-azure-cli)を参照）
- SSH キーペア（必要な場合、このガイドで生成方法を説明します）
- 約 20〜30 分

## デプロイの構成

<Steps>
  <Step title="Azure CLI にサインインする">
    ```bash
    az login
    az extension add -n ssh
    ```

    Azure Bastion のネイティブ SSH トンネリングには、`ssh` 拡張機能が必要です。

  </Step>

  <Step title="必要なリソースプロバイダーを登録する（初回のみ）">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    登録を確認し、両方が `Registered` と表示されるまで待ちます。

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

    環境に合わせて名前と CIDR 範囲を調整してください。Bastion サブネットは少なくとも `/26` である必要があります。

  </Step>

  <Step title="SSH キーを選択する">
    既存の公開鍵がある場合は、それを使用します。

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    ない場合は生成します。

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="VM サイズと OS ディスクサイズを選択する">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    - 軽い用途では小さいサイズから始め、後でスケールアップします。
    - 高負荷の自動化、より多くのチャンネル、または大規模なモデルやツールのワークロードには、より多くの vCPU、RAM、ディスクを使用します。
    - リージョンまたはサブスクリプションのクォータでサイズを利用できない場合は、最も近い利用可能な SKU を選択します。

    対象リージョンで利用可能な VM サイズを一覧表示します。

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    現在の vCPU とディスクの使用量およびクォータを確認します。

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Azure リソースのデプロイ

<Steps>
  <Step title="リソースグループを作成する">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="ネットワークセキュリティグループを作成する">
    NSG を作成し、Bastion サブネットからのみ VM に SSH 接続できるようにルールを追加します。

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # Bastion サブネットからの SSH のみを許可
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # パブリックインターネットからの SSH を拒否
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # VNet 内の他の接続元からの SSH を拒否
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    ルールは優先度の数値が小さい順に評価されます。Bastion トラフィックは優先度 100 で許可され、その後、その他すべての SSH は 110 と 120 でブロックされます。

  </Step>

  <Step title="仮想ネットワークとサブネットを作成する">
    VM サブネット（NSG を関連付け）を含む VNet を作成し、その後 Bastion サブネットを追加します。

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # NSG を VM サブネットに関連付け
    az network vnet subnet update \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n "${VM_SUBNET_NAME}" --nsg "${NSG_NAME}"

    # AzureBastionSubnet: Azure ではこの正確な名前が必要
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="VM を作成する">
    VM にはパブリック IP を割り当てません。SSH アクセスは Azure Bastion のみを経由します。

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

    `--public-ip-address ""` は、パブリック IP が割り当てられるのを防ぎます。サブネットレベルの NSG がすでにセキュリティを処理するため、`--nsg ""` は NIC ごとの NSG を省略します。

    `latest` の代わりに特定の Ubuntu イメージバージョンを固定するには、まず利用可能なバージョンを一覧表示します。

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Azure Bastion を作成する">
    Azure Bastion を使用すると、VM にパブリック IP を公開せずに、管理された SSH アクセスを利用できます。CLI ベースの `az network bastion ssh` には、トンネリングが有効な Standard SKU が必要です。

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

    Bastion のプロビジョニングには通常 5〜10 分かかりますが、一部のリージョンでは 15〜30 分かかる場合があります。

  </Step>
</Steps>

## OpenClaw のインストール

<Steps>
  <Step title="Azure Bastion 経由で VM に SSH 接続する">
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

  <Step title="OpenClaw をインストールする（VM シェル内）">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    インストーラーは、まだ存在しない場合に Node と依存関係をインストールし、OpenClaw をインストールして、オンボーディングを開始します。詳細は[インストール](/ja-JP/install)を参照してください。

  </Step>

  <Step title="Gateway を検証する">
    オンボーディングの完了後に、次を実行します。

    ```bash
    openclaw gateway status
    ```

    組織にすでに GitHub Copilot ライセンスがある場合は、別途モデル API キーを使用する代わりに、オンボーディング中に GitHub Copilot プロバイダーを選択できます。[GitHub Copilot プロバイダー](/ja-JP/providers/github-copilot)を参照してください。

  </Step>
</Steps>

## コストに関する考慮事項

月額費用の概算（料金はリージョンによって異なり、時間の経過とともに変更されるため、Azure Pricing Calculator で現在の料金を確認してください）。

- Azure Bastion Standard SKU：約 140 ドル/月
- VM（`Standard_B2as_v2`）：約 55 ドル/月

コストを削減するには、次の方法があります。

- 使用していないときは VM の割り当てを解除します。これによりコンピューティング料金は停止しますが、ディスク料金は引き続き発生します。割り当て解除中は Gateway にアクセスできません。

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # 後で再起動
  ```

- Bastion が不要なときは削除し、再び SSH アクセスが必要になったときに再作成します。Bastion は最大のコスト要因であり、数分でプロビジョニングできます。
- ポータルベースの SSH のみが必要で、CLI トンネリング（`az network bastion ssh`）が不要な場合は、Basic Bastion SKU（約 38 ドル/月）を使用します。

## クリーンアップ

このガイドで作成したすべてのリソースを削除します。

```bash
az group delete -n "${RG}" --yes --no-wait
```

これにより、リソースグループとその中にあるすべてのリソース（VM、VNet、NSG、Bastion、パブリック IP）が削除されます。

## 次のステップ

- メッセージングチャンネルをセットアップする：[チャンネル](/ja-JP/channels)
- ローカルデバイスを Node としてペアリングする：[Node](/ja-JP/nodes)
- Gateway を構成する：[Gateway の構成](/ja-JP/gateway/configuration)
- GitHub Copilot モデルプロバイダーを使用した Azure へのデプロイの詳細：[GitHub Copilot を使用した Azure 上の OpenClaw](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## 関連項目

- [インストールの概要](/ja-JP/install)
- [GCP](/ja-JP/install/gcp)
- [DigitalOcean](/ja-JP/install/digitalocean)
