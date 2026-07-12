---
read_when:
    - Bạn muốn OpenClaw chạy 24/7 trên Azure với Nhóm bảo mật mạng được tăng cường bảo mật
    - Bạn muốn một OpenClaw Gateway cấp độ sản xuất, luôn hoạt động trên máy ảo Linux Azure của riêng mình
    - Bạn muốn quản trị an toàn bằng SSH qua Azure Bastion
summary: Chạy OpenClaw Gateway 24/7 trên máy ảo Linux Azure với trạng thái bền vững
title: Azure
x-i18n:
    generated_at: "2026-07-12T08:01:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8598014cdc2786a47039ffb42ddd85354da9c87fd55ea46bb6dad7714171a14
    source_path: install/azure.md
    workflow: 16
---

Thiết lập một máy ảo Linux trên Azure bằng Azure CLI, tăng cường bảo mật Nhóm bảo mật mạng (NSG), cấu hình Azure Bastion để truy cập SSH và cài đặt OpenClaw.

## Những việc bạn sẽ thực hiện

- Tạo tài nguyên mạng Azure (VNet, mạng con, NSG) và tài nguyên điện toán bằng Azure CLI
- Áp dụng các quy tắc NSG để chỉ cho phép SSH vào máy ảo từ Azure Bastion
- Sử dụng Azure Bastion để truy cập SSH (máy ảo không có địa chỉ IP công khai)
- Cài đặt OpenClaw bằng tập lệnh cài đặt
- Xác minh Gateway

## Những gì bạn cần

- Một gói đăng ký Azure có quyền tạo tài nguyên điện toán và mạng
- Đã cài đặt Azure CLI (xem [các bước cài đặt Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli))
- Một cặp khóa SSH (hướng dẫn này trình bày cách tạo nếu cần)
- Khoảng 20–30 phút

## Cấu hình triển khai

<Steps>
  <Step title="Sign in to Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    Tiện ích mở rộng `ssh` là bắt buộc để sử dụng đường hầm SSH gốc của Azure Bastion.

  </Step>

  <Step title="Register required resource providers (one time)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Xác minh việc đăng ký; chờ đến khi cả hai đều hiển thị `Registered`.

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

    Điều chỉnh tên và dải CIDR cho phù hợp với môi trường của bạn. Mạng con Bastion phải có kích thước tối thiểu là `/26`.

  </Step>

  <Step title="Select an SSH key">
    Sử dụng khóa công khai hiện có nếu bạn đã có:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Nếu chưa có, hãy tạo một khóa:

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

    - Bắt đầu với cấu hình nhỏ hơn cho nhu cầu sử dụng nhẹ và nâng cấp sau.
    - Sử dụng nhiều vCPU/RAM/dung lượng đĩa hơn cho tác vụ tự động hóa nặng hơn, nhiều kênh hơn hoặc khối lượng công việc mô hình/công cụ lớn hơn.
    - Nếu một kích thước không khả dụng trong khu vực hoặc hạn ngạch gói đăng ký của bạn, hãy chọn SKU khả dụng gần nhất.

    Liệt kê các kích thước máy ảo khả dụng trong khu vực đích:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Kiểm tra mức sử dụng/hạn ngạch vCPU và đĩa hiện tại:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Triển khai tài nguyên Azure

<Steps>
  <Step title="Create the resource group">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Create the network security group">
    Tạo NSG và thêm các quy tắc để chỉ mạng con Bastion có thể SSH vào máy ảo.

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

    Các quy tắc được đánh giá theo mức ưu tiên, số nhỏ nhất trước: lưu lượng Bastion được cho phép ở mức 100, sau đó mọi lưu lượng SSH khác bị chặn ở mức 110 và 120.

  </Step>

  <Step title="Create the virtual network and subnets">
    Tạo VNet với mạng con của máy ảo (đã gắn NSG), sau đó thêm mạng con Bastion.

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
    Máy ảo không được cấp địa chỉ IP công khai. Quyền truy cập SSH chỉ đi qua Azure Bastion.

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

    `--public-ip-address ""` ngăn việc gán địa chỉ IP công khai. `--nsg ""` bỏ qua NSG riêng cho từng NIC vì NSG ở cấp mạng con đã đảm nhiệm việc bảo mật.

    Để cố định một phiên bản ảnh Ubuntu cụ thể thay vì `latest`, trước tiên hãy liệt kê các phiên bản khả dụng:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Create Azure Bastion">
    Azure Bastion cung cấp quyền truy cập SSH được quản lý mà không làm lộ địa chỉ IP công khai trên máy ảo. Cần có SKU Standard với tính năng đường hầm được bật để sử dụng `az network bastion ssh` qua CLI.

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

    Việc cấp phát Bastion thường mất 5–10 phút, nhưng có thể mất tới 15–30 phút ở một số khu vực.

  </Step>
</Steps>

## Cài đặt OpenClaw

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

    Trình cài đặt sẽ cài đặt Node và các phần phụ thuộc nếu chưa có, cài đặt OpenClaw và khởi chạy quy trình thiết lập ban đầu. Xem [Cài đặt](/vi/install) để biết chi tiết.

  </Step>

  <Step title="Verify the gateway">
    Sau khi quy trình thiết lập ban đầu hoàn tất:

    ```bash
    openclaw gateway status
    ```

    Nếu tổ chức của bạn đã có giấy phép GitHub Copilot, bạn có thể chọn nhà cung cấp GitHub Copilot trong quá trình thiết lập ban đầu thay vì sử dụng khóa API mô hình riêng. Xem [nhà cung cấp GitHub Copilot](/vi/providers/github-copilot).

  </Step>
</Steps>

## Những điều cần cân nhắc về chi phí

Chi phí hằng tháng ước tính (hãy xác minh giá hiện tại trong Azure Pricing Calculator vì mức giá thay đổi theo khu vực và theo thời gian):

- SKU Azure Bastion Standard: khoảng 140 USD/tháng
- Máy ảo (`Standard_B2as_v2`): khoảng 55 USD/tháng

Để giảm chi phí:

- Giải phóng máy ảo khi không sử dụng. Thao tác này dừng tính phí điện toán (vẫn tính phí đĩa). Không thể truy cập Gateway khi máy ảo đang ở trạng thái giải phóng.

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- Xóa Bastion khi không cần và tạo lại khi bạn cần truy cập SSH; đây là thành phần chi phí lớn nhất và chỉ mất vài phút để cấp phát.
- Sử dụng SKU Bastion Basic (khoảng 38 USD/tháng) nếu bạn chỉ cần SSH qua Portal và không cần đường hầm qua CLI (`az network bastion ssh`).

## Dọn dẹp

Xóa tất cả tài nguyên được tạo theo hướng dẫn này:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Thao tác này xóa nhóm tài nguyên và mọi thứ bên trong (máy ảo, VNet, NSG, Bastion, địa chỉ IP công khai).

## Các bước tiếp theo

- Thiết lập các kênh nhắn tin: [Kênh](/vi/channels)
- Ghép nối các thiết bị cục bộ dưới dạng Node: [Node](/vi/nodes)
- Cấu hình Gateway: [Cấu hình Gateway](/vi/gateway/configuration)
- Thông tin chi tiết hơn về việc triển khai Azure với nhà cung cấp mô hình GitHub Copilot: [OpenClaw trên Azure với GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Nội dung liên quan

- [Tổng quan về cài đặt](/vi/install)
- [GCP](/vi/install/gcp)
- [DigitalOcean](/vi/install/digitalocean)
