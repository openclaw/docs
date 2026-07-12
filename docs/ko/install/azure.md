---
read_when:
    - Network Security Group 보안 강화를 적용하여 Azure에서 OpenClaw를 연중무휴로 실행하려는 경우
    - 자체 Azure Linux VM에서 프로덕션급으로 상시 실행되는 OpenClaw Gateway를 원합니다.
    - Azure Bastion SSH를 사용하여 안전하게 관리하려는 경우
summary: Azure Linux VM에서 지속적 상태를 유지하며 OpenClaw Gateway를 연중무휴 실행하기
title: Azure
x-i18n:
    generated_at: "2026-07-12T00:53:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8598014cdc2786a47039ffb42ddd85354da9c87fd55ea46bb6dad7714171a14
    source_path: install/azure.md
    workflow: 16
---

Azure CLI를 사용하여 Azure Linux VM을 설정하고, NSG(Network Security Group) 보안 강화를 적용하고, SSH 액세스를 위한 Azure Bastion을 구성한 다음 OpenClaw를 설치합니다.

## 수행할 작업

- Azure CLI로 Azure 네트워킹(VNet, 서브넷, NSG) 및 컴퓨팅 리소스 생성
- Azure Bastion에서만 VM에 SSH로 연결할 수 있도록 NSG 규칙 적용
- Azure Bastion을 통한 SSH 액세스 사용(VM에 공용 IP 없음)
- 설치 프로그램 스크립트로 OpenClaw 설치
- Gateway 확인

## 필요한 항목

- 컴퓨팅 및 네트워크 리소스를 생성할 권한이 있는 Azure 구독
- 설치된 Azure CLI([Azure CLI 설치 단계](https://learn.microsoft.com/cli/azure/install-azure-cli) 참조)
- SSH 키 쌍(필요한 경우 이 가이드에서 생성 방법을 설명)
- 약 20~30분

## 배포 구성

<Steps>
  <Step title="Azure CLI에 로그인">
    ```bash
    az login
    az extension add -n ssh
    ```

    Azure Bastion의 네이티브 SSH 터널링에는 `ssh` 확장이 필요합니다.

  </Step>

  <Step title="필수 리소스 공급자 등록(한 번만)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    등록을 확인하고 둘 다 `Registered`로 표시될 때까지 기다립니다.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="배포 변수 설정">
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

    환경에 맞게 이름과 CIDR 범위를 조정합니다. Bastion 서브넷은 최소 `/26`이어야 합니다.

  </Step>

  <Step title="SSH 키 선택">
    기존 공개 키가 있다면 사용합니다.

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    없다면 생성합니다.

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="VM 크기 및 OS 디스크 크기 선택">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    - 사용량이 적다면 작은 크기로 시작하고 나중에 확장합니다.
    - 자동화 작업이 많거나, 채널이 더 많거나, 모델/도구 워크로드가 더 크다면 vCPU/RAM/디스크를 더 많이 사용합니다.
    - 해당 지역이나 구독 할당량에서 특정 크기를 사용할 수 없다면 가장 비슷한 가용 SKU를 선택합니다.

    대상 지역에서 사용 가능한 VM 크기를 나열합니다.

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    현재 vCPU 및 디스크 사용량/할당량을 확인합니다.

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Azure 리소스 배포

<Steps>
  <Step title="리소스 그룹 생성">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="네트워크 보안 그룹 생성">
    Bastion 서브넷에서만 VM에 SSH로 연결할 수 있도록 NSG를 생성하고 규칙을 추가합니다.

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # Bastion 서브넷에서의 SSH만 허용
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # 공용 인터넷에서의 SSH 거부
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # 다른 VNet 소스에서의 SSH 거부
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    규칙은 우선순위가 낮은 번호부터 평가됩니다. Bastion 트래픽은 우선순위 100에서 허용되고, 그 외 모든 SSH는 110과 120에서 차단됩니다.

  </Step>

  <Step title="가상 네트워크 및 서브넷 생성">
    VM 서브넷(NSG 연결됨)이 포함된 VNet을 생성한 다음 Bastion 서브넷을 추가합니다.

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # VM 서브넷에 NSG 연결
    az network vnet subnet update \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n "${VM_SUBNET_NAME}" --nsg "${NSG_NAME}"

    # AzureBastionSubnet: Azure에서 이 정확한 이름을 요구함
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="VM 생성">
    VM에는 공용 IP가 할당되지 않습니다. SSH 액세스는 Azure Bastion을 통해서만 이루어집니다.

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

    `--public-ip-address ""`는 공용 IP가 할당되지 않도록 합니다. 서브넷 수준 NSG가 이미 보안을 처리하므로 `--nsg ""`는 NIC별 NSG 생성을 건너뜁니다.

    `latest` 대신 특정 Ubuntu 이미지 버전을 고정하려면 먼저 사용 가능한 버전을 나열합니다.

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Azure Bastion 생성">
    Azure Bastion은 VM에 공용 IP를 노출하지 않고 관리형 SSH 액세스를 제공합니다. CLI 기반 `az network bastion ssh`를 사용하려면 터널링이 활성화된 Standard SKU가 필요합니다.

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

    Bastion 프로비저닝은 일반적으로 5~10분이 걸리지만 일부 지역에서는 최대 15~30분이 걸릴 수 있습니다.

  </Step>
</Steps>

## OpenClaw 설치

<Steps>
  <Step title="Azure Bastion을 통해 VM에 SSH로 연결">
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

  <Step title="OpenClaw 설치(VM 셸에서)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    설치 프로그램은 Node와 종속 항목이 아직 없는 경우 이를 설치하고, OpenClaw를 설치한 다음 온보딩을 시작합니다. 자세한 내용은 [설치](/ko/install)를 참조하세요.

  </Step>

  <Step title="Gateway 확인">
    온보딩이 완료된 후 다음을 실행합니다.

    ```bash
    openclaw gateway status
    ```

    조직에 이미 GitHub Copilot 라이선스가 있다면 별도의 모델 API 키 대신 온보딩 중에 GitHub Copilot 공급자를 선택할 수 있습니다. [GitHub Copilot 공급자](/ko/providers/github-copilot)를 참조하세요.

  </Step>
</Steps>

## 비용 고려 사항

대략적인 월간 비용입니다. 요금은 지역마다 다르고 시간이 지나면서 변경되므로 Azure Pricing Calculator에서 현재 가격을 확인하세요.

- Azure Bastion Standard SKU: 월 약 140달러
- VM(`Standard_B2as_v2`): 월 약 55달러

비용을 절감하려면 다음을 수행합니다.

- 사용하지 않을 때 VM의 할당을 해제합니다. 그러면 컴퓨팅 요금 청구가 중지됩니다(디스크 요금은 계속 부과됨). 할당이 해제된 동안에는 Gateway에 연결할 수 없습니다.

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # 나중에 다시 시작
  ```

- Bastion이 필요하지 않을 때 삭제하고 SSH 액세스가 다시 필요할 때 재생성합니다. Bastion은 비용에서 가장 큰 비중을 차지하며 프로비저닝에는 몇 분이 걸립니다.
- 포털 기반 SSH만 필요하고 CLI 터널링(`az network bastion ssh`)이 필요하지 않다면 Basic Bastion SKU(월 약 38달러)를 사용합니다.

## 정리

이 가이드에서 생성한 모든 리소스를 삭제합니다.

```bash
az group delete -n "${RG}" --yes --no-wait
```

이 명령은 리소스 그룹과 그 안의 모든 항목(VM, VNet, NSG, Bastion, 공용 IP)을 제거합니다.

## 다음 단계

- 메시징 채널 설정: [채널](/ko/channels)
- 로컬 장치를 Node로 페어링: [Node](/ko/nodes)
- Gateway 구성: [Gateway 구성](/ko/gateway/configuration)
- GitHub Copilot 모델 공급자를 사용한 Azure 배포에 대한 자세한 내용: [GitHub Copilot을 사용하여 Azure에 OpenClaw 배포](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## 관련 문서

- [설치 개요](/ko/install)
- [GCP](/ko/install/gcp)
- [DigitalOcean](/ko/install/digitalocean)
