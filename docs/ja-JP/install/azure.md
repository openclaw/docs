---
read_when:
    - Network Security Group の強化を適用して、Azure 上で OpenClaw を 24/7 稼働させたい
    - 自分の Azure Linux VM 上で、本番環境レベルの常時稼働する OpenClaw Gateway が必要な場合
    - Azure Bastion SSH によるセキュアな管理が必要な場合
summary: Azure Linux VM で永続的な状態を保持しながら OpenClaw Gateway を 24 時間 365 日実行する
title: Azure
x-i18n:
    generated_at: "2026-07-05T11:30:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8598014cdc2786a47039ffb42ddd85354da9c87fd55ea46bb6dad7714171a14
    source_path: install/azure.md
    workflow: 16
---

Azure CLI で Azure Linux VM をセットアップし、Network Security Group (NSG) の強化を適用し、SSH アクセス用に Azure Bastion を構成して、OpenClaw をインストールします。

## 実施すること

- Azure CLI で Azure ネットワーク (VNet、サブネット、NSG) とコンピューティングリソースを作成する
- VM の SSH を Azure Bastion からのみ許可するように NSG ルールを適用する
- SSH アクセスに Azure Bastion を使用する (VM にパブリック IP は付けない)
- インストーラースクリプトで OpenClaw をインストールする
- Gateway を検証する

## 必要なもの

- コンピューティングリソースとネットワークリソースを作成する権限がある Azure サブスクリプション
- Azure CLI のインストール (「[Azure CLI インストール手順](https://learn.microsoft.com/cli/azure/install-azure-cli)」を参照)
- SSH キーペア (必要な場合はこのガイドで生成手順も扱います)
- 約 20-30 分

## デプロイを構成する

<Steps>
  <Step title="Azure CLI にサインインする">
    ```bash
    az login
    az extension add -n ssh
    ```

    Azure Bastion のネイティブ SSH トンネリングには `ssh` 拡張機能が必要です。

  </Step>

  <Step title="必要なリソースプロバイダーを登録する (一度だけ)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    登録を確認します。両方が `Registered` と表示されるまで待ちます。

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

    環境に合わせて名前と CIDR 範囲を調整します。Bastion サブネットは少なくとも `/26` である必要があります。

  </Step>

  <Step title="SSH キーを選択する">
    既存の公開キーがある場合はそれを使用します。

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

    - 軽い利用では小さめから始め、後でスケールアップします。
    - より重い自動化、より多くのチャンネル、またはより大きなモデル/ツールワークロードには、より多くの vCPU/RAM/ディスクを使用します。
    - リージョンまたはサブスクリプションクォータでサイズが利用できない場合は、利用可能な最も近い SKU を選択します。

    対象リージョンで利用可能な VM サイズを一覧表示します。

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    現在の vCPU とディスクの使用量/クォータを確認します。

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Azure リソースをデプロイする

<Steps>
  <Step title="リソースグループを作成する">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="ネットワークセキュリティグループを作成する">
    NSG を作成し、Bastion サブネットのみが VM に SSH 接続できるようにルールを追加します。

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

    ルールは優先度順に評価され、数値が小さいものが先です。Bastion トラフィックは 100 で許可され、その後、他のすべての SSH は 110 と 120 でブロックされます。

  </Step>

  <Step title="仮想ネットワークとサブネットを作成する">
    VM サブネット (NSG を関連付け済み) を含む VNet を作成し、その後 Bastion サブネットを追加します。

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

  <Step title="VM を作成する">
    VM にはパブリック IP が付きません。SSH アクセスは Azure Bastion 経由のみにします。

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

    `--public-ip-address ""` はパブリック IP の割り当てを防ぎます。`--nsg ""` は、サブネットレベルの NSG がすでにセキュリティを扱うため、NIC ごとの NSG をスキップします。

    `latest` ではなく特定の Ubuntu イメージバージョンに固定するには、まず利用可能なバージョンを一覧表示します。

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Azure Bastion を作成する">
    Azure Bastion は、VM 上でパブリック IP を公開せずに管理された SSH アクセスを提供します。CLI ベースの `az network bastion ssh` には、トンネリングを有効にした Standard SKU が必要です。

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

    Bastion のプロビジョニングは通常 5-10 分かかりますが、リージョンによっては最大 15-30 分かかることがあります。

  </Step>
</Steps>

## OpenClaw をインストールする

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

  <Step title="OpenClaw をインストールする (VM シェル内)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    インストーラーは、まだ存在しない場合は Node と依存関係をインストールし、OpenClaw をインストールして、オンボーディングを起動します。詳細は「[インストール](/ja-JP/install)」を参照してください。

  </Step>

  <Step title="Gateway を検証する">
    オンボーディングが完了したら、次を実行します。

    ```bash
    openclaw gateway status
    ```

    組織にすでに GitHub Copilot ライセンスがある場合は、オンボーディング中に個別のモデル API キーの代わりに GitHub Copilot プロバイダーを選択できます。「[GitHub Copilot プロバイダー](/ja-JP/providers/github-copilot)」を参照してください。

  </Step>
</Steps>

## コストに関する考慮事項

概算の月額コスト (料金はリージョンによって異なり、時間とともに変更されるため、Azure 料金計算ツールで現在の価格を確認してください):

- Azure Bastion Standard SKU: 約 $140/月
- VM (`Standard_B2as_v2`): 約 $55/月

コストを削減するには:

- 使用していないときは VM の割り当てを解除します。これによりコンピューティング課金は停止します (ディスク料金は残ります)。割り当て解除中は Gateway に到達できません。

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- 不要なときは Bastion を削除し、SSH アクセスが再度必要になったときに作成し直します。これは最大のコスト要素であり、数分でプロビジョニングされます。
- Portal ベースの SSH のみが必要で、CLI トンネリング (`az network bastion ssh`) が不要な場合は、Basic Bastion SKU (約 $38/月) を使用します。

## クリーンアップ

このガイドで作成したすべてのリソースを削除します。

```bash
az group delete -n "${RG}" --yes --no-wait
```

これにより、リソースグループとその中のすべて (VM、VNet、NSG、Bastion、パブリック IP) が削除されます。

## 次のステップ

- メッセージングチャンネルをセットアップする: [チャンネル](/ja-JP/channels)
- ローカルデバイスをノードとしてペアリングする: [ノード](/ja-JP/nodes)
- Gateway を構成する: [Gateway 構成](/ja-JP/gateway/configuration)
- GitHub Copilot モデルプロバイダーを使用した Azure デプロイの詳細: [GitHub Copilot を使用した Azure 上の OpenClaw](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## 関連

- [インストール概要](/ja-JP/install)
- [GCP](/ja-JP/install/gcp)
- [DigitalOcean](/ja-JP/install/digitalocean)
