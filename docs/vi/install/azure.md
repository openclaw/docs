---
read_when:
    - Bạn muốn OpenClaw chạy 24/7 trên Azure với việc gia cố bảo mật Nhóm bảo mật mạng
    - Bạn muốn một OpenClaw Gateway đạt chuẩn môi trường sản xuất, luôn hoạt động trên máy ảo Linux Azure của riêng bạn
    - Bạn muốn quản trị an toàn bằng Azure Bastion SSH
summary: Chạy OpenClaw Gateway 24/7 trên máy ảo Linux Azure với trạng thái được lưu bền vững
title: Azure
x-i18n:
    generated_at: "2026-05-06T09:17:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ab1b7d09dd66c495983aebd4766ce760d659cc6f362bbcd999d1c1345ae38f7
    source_path: install/azure.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Hướng dẫn này thiết lập một máy ảo Azure Linux bằng Azure CLI, áp dụng gia cố Network Security Group (NSG), cấu hình Azure Bastion để truy cập SSH, và cài đặt OpenClaw.

## Bạn sẽ thực hiện

- Tạo tài nguyên mạng Azure (VNet, subnet, NSG) và tài nguyên điện toán bằng Azure CLI
- Áp dụng quy tắc Network Security Group để SSH vào máy ảo chỉ được phép từ Azure Bastion
- Sử dụng Azure Bastion để truy cập SSH (không có IP công khai trên máy ảo)
- Cài đặt OpenClaw bằng script cài đặt
- Xác minh Gateway

## Bạn cần có

- Một gói đăng ký Azure có quyền tạo tài nguyên điện toán và mạng
- Đã cài đặt Azure CLI (xem [các bước cài đặt Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) nếu cần)
- Một cặp khóa SSH (hướng dẫn này có bao gồm cách tạo nếu cần)
- ~20-30 phút

## Cấu hình triển khai

<Steps>
  <Step title="Đăng nhập vào Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    Phần mở rộng `ssh` là bắt buộc để tạo đường hầm SSH gốc qua Azure Bastion.

  </Step>

  <Step title="Đăng ký các nhà cung cấp tài nguyên bắt buộc (một lần)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Xác minh đăng ký. Chờ cho đến khi cả hai đều hiển thị `Registered`.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Thiết lập biến triển khai">
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

    Điều chỉnh tên và dải CIDR cho phù hợp với môi trường của bạn. Subnet Bastion phải có kích thước ít nhất là `/26`.

  </Step>

  <Step title="Chọn khóa SSH">
    Sử dụng khóa công khai hiện có nếu bạn đã có:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Nếu bạn chưa có khóa SSH, hãy tạo một khóa:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Chọn kích thước máy ảo và kích thước đĩa hệ điều hành">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    Chọn kích thước máy ảo và kích thước đĩa hệ điều hành có sẵn trong gói đăng ký và khu vực của bạn:

    - Bắt đầu nhỏ hơn cho nhu cầu sử dụng nhẹ và mở rộng sau
    - Dùng thêm vCPU/RAM/đĩa cho tự động hóa nặng hơn, nhiều kênh hơn, hoặc khối lượng công việc mô hình/công cụ lớn hơn
    - Nếu một kích thước máy ảo không có sẵn trong khu vực hoặc hạn ngạch gói đăng ký của bạn, hãy chọn SKU gần nhất có sẵn

    Liệt kê các kích thước máy ảo có sẵn trong khu vực đích của bạn:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Kiểm tra mức sử dụng/hạn ngạch vCPU và đĩa hiện tại của bạn:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Triển khai tài nguyên Azure

<Steps>
  <Step title="Tạo nhóm tài nguyên">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Tạo nhóm bảo mật mạng">
    Tạo NSG và thêm quy tắc để chỉ subnet Bastion có thể SSH vào máy ảo.

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

    Các quy tắc được đánh giá theo mức ưu tiên (số nhỏ nhất trước): lưu lượng Bastion được cho phép ở 100, sau đó mọi SSH khác bị chặn ở 110 và 120.

  </Step>

  <Step title="Tạo mạng ảo và các subnet">
    Tạo VNet với subnet máy ảo (đã gắn NSG), rồi thêm subnet Bastion.

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

  <Step title="Tạo máy ảo">
    Máy ảo không có IP công khai. Truy cập SSH chỉ thông qua Azure Bastion.

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

    `--public-ip-address ""` ngăn việc gán IP công khai. `--nsg ""` bỏ qua việc tạo NSG riêng cho từng NIC (NSG cấp subnet xử lý bảo mật).

    **Khả năng tái lập:** Lệnh ở trên dùng `latest` cho image Ubuntu. Để ghim một phiên bản cụ thể, hãy liệt kê các phiên bản có sẵn và thay thế `latest`:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Tạo Azure Bastion">
    Azure Bastion cung cấp quyền truy cập SSH được quản lý vào máy ảo mà không để lộ IP công khai. Cần SKU Standard có hỗ trợ tạo đường hầm để dùng `az network bastion ssh` dựa trên CLI.

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

    Việc cấp phát Bastion thường mất 5-10 phút nhưng có thể mất tới 15-30 phút ở một số khu vực.

  </Step>
</Steps>

## Cài đặt OpenClaw

<Steps>
  <Step title="SSH vào máy ảo qua Azure Bastion">
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

  <Step title="Cài đặt OpenClaw (trong shell của máy ảo)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    Trình cài đặt sẽ cài Node LTS và các phụ thuộc nếu chưa có, cài OpenClaw, và khởi chạy trình hướng dẫn onboarding. Xem [Cài đặt](/vi/install) để biết chi tiết.

  </Step>

  <Step title="Xác minh Gateway">
    Sau khi onboarding hoàn tất:

    ```bash
    openclaw gateway status
    ```

    Hầu hết các nhóm Azure doanh nghiệp đã có giấy phép GitHub Copilot. Nếu đây là trường hợp của bạn, chúng tôi khuyến nghị chọn nhà cung cấp GitHub Copilot trong trình hướng dẫn onboarding của OpenClaw. Xem [Nhà cung cấp GitHub Copilot](/vi/providers/github-copilot).

  </Step>
</Steps>

## Cân nhắc chi phí

Azure Bastion SKU Standard chạy khoảng **\$140/tháng** và máy ảo (Standard_B2as_v2) chạy khoảng **\$55/tháng**.

Để giảm chi phí:

- **Giải cấp phát máy ảo** khi không sử dụng (dừng tính phí điện toán; phí đĩa vẫn còn). OpenClaw Gateway sẽ không thể truy cập được trong khi máy ảo bị giải cấp phát — hãy khởi động lại khi bạn cần nó hoạt động trực tuyến trở lại:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- **Xóa Bastion khi không cần** và tạo lại khi bạn cần truy cập SSH. Bastion là thành phần chi phí lớn nhất và chỉ mất vài phút để cấp phát.
- **Dùng SKU Basic Bastion** (~\$38/tháng) nếu bạn chỉ cần SSH dựa trên Portal và không cần tạo đường hầm CLI (`az network bastion ssh`).

## Dọn dẹp

Để xóa tất cả tài nguyên được tạo bởi hướng dẫn này:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Lệnh này xóa nhóm tài nguyên và mọi thứ bên trong nó (máy ảo, VNet, NSG, Bastion, IP công khai).

## Các bước tiếp theo

- Thiết lập các kênh nhắn tin: [Kênh](/vi/channels)
- Ghép nối thiết bị cục bộ làm nút: [Nút](/vi/nodes)
- Cấu hình Gateway: [Cấu hình Gateway](/vi/gateway/configuration)
- Để biết thêm chi tiết về triển khai OpenClaw trên Azure với nhà cung cấp mô hình GitHub Copilot: [OpenClaw trên Azure với GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [GCP](/vi/install/gcp)
- [DigitalOcean](/vi/install/digitalocean)
