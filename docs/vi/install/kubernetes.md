---
read_when:
    - Bạn muốn chạy OpenClaw trên một cụm Kubernetes
    - Bạn muốn kiểm thử OpenClaw trong môi trường Kubernetes
summary: Triển khai OpenClaw Gateway lên cụm Kubernetes bằng Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-07-12T08:00:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c05eb0eb923fa1f515aca1f6dcb6073aba69af0bdf30233243027edfedd45a39
    source_path: install/kubernetes.md
    workflow: 16
---

Điểm khởi đầu tối giản để chạy OpenClaw trên Kubernetes, không phải một bản triển khai sẵn sàng cho môi trường sản xuất. Nội dung này đề cập đến các tài nguyên cốt lõi và được thiết kế để bạn điều chỉnh cho phù hợp với môi trường của mình.

## Tại sao không dùng Helm

OpenClaw là một container duy nhất cùng một số tệp cấu hình. Phần tùy chỉnh đáng chú ý nằm ở nội dung của tác tử (các tệp Markdown, Skills, các giá trị ghi đè cấu hình), chứ không phải việc tạo mẫu hạ tầng. Kustomize xử lý các lớp phủ mà không phát sinh chi phí phức tạp của biểu đồ Helm. Bạn có thể bổ sung một biểu đồ Helm trên các manifest này nếu bản triển khai trở nên phức tạp hơn.

## Những gì bạn cần

- Một cụm Kubernetes đang chạy (AKS, EKS, GKE, k3s, kind, OpenShift, v.v.)
- `kubectl` đã kết nối với cụm của bạn
- Khóa API của ít nhất một nhà cung cấp mô hình

## Bắt đầu nhanh

```bash
# Thay bằng nhà cung cấp của bạn: ANTHROPIC, GEMINI, OPENAI hoặc OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Theo mặc định, `deploy.sh` tạo phương thức xác thực bằng mã thông báo. Lấy mã thông báo Gateway đã tạo cho giao diện điều khiển:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Để gỡ lỗi cục bộ, `./scripts/k8s/deploy.sh --show-token` sẽ in mã thông báo sau khi triển khai.

## Kiểm thử cục bộ bằng Kind

Nếu chưa có cụm, hãy tạo một cụm cục bộ bằng [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # tự động phát hiện docker hoặc podman
./scripts/k8s/create-kind.sh --delete  # gỡ bỏ
```

Sau đó, triển khai như bình thường bằng `./scripts/k8s/deploy.sh`.

## Từng bước thực hiện

### 1) Triển khai

**Tùy chọn A: Khóa API trong môi trường (một bước)**

```bash
# Thay bằng nhà cung cấp của bạn: ANTHROPIC, GEMINI, OPENAI hoặc OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Tập lệnh tạo một Secret Kubernetes chứa khóa API và mã thông báo Gateway được tạo tự động, sau đó triển khai. Nếu Secret đã tồn tại, tập lệnh giữ nguyên mã thông báo Gateway hiện tại và mọi khóa nhà cung cấp không được thay đổi.

**Tùy chọn B: Tạo Secret riêng**

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Thêm `--show-token` vào một trong hai lệnh để in mã thông báo ra stdout phục vụ kiểm thử cục bộ.

### 2) Truy cập Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Những gì sẽ được triển khai

```text
Không gian tên: openclaw (có thể cấu hình qua OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Một pod, container khởi tạo + Gateway
├── Service/openclaw           # ClusterIP trên cổng 18789
├── PersistentVolumeClaim      # 10Gi cho trạng thái và cấu hình của tác tử
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Mã thông báo Gateway + các khóa API
```

## Tùy chỉnh

### Chỉ dẫn cho tác tử

Chỉnh sửa `AGENTS.md` trong `scripts/k8s/manifests/configmap.yaml` rồi triển khai lại:

```bash
./scripts/k8s/deploy.sh
```

### Cấu hình Gateway

Chỉnh sửa `openclaw.json` trong `scripts/k8s/manifests/configmap.yaml`. Xem [Cấu hình Gateway](/vi/gateway/configuration) để biết tài liệu tham khảo đầy đủ.

### Thêm nhà cung cấp

Chạy lại sau khi xuất thêm các khóa:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Các khóa nhà cung cấp hiện có vẫn được giữ trong Secret trừ khi bạn ghi đè chúng.

Hoặc vá trực tiếp Secret:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Không gian tên tùy chỉnh

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Ảnh tùy chỉnh

Chỉnh sửa trường `image` trong `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:slim # nguồn chính; bản sao Docker Hub chính thức: openclaw/openclaw
```

### Cung cấp quyền truy cập ngoài chuyển tiếp cổng

Các manifest mặc định liên kết Gateway với local loopback bên trong pod. Cấu hình này hoạt động với `kubectl port-forward`, nhưng không hoạt động với `Service` Kubernetes hoặc đường dẫn Ingress cần truy cập trực tiếp vào IP của pod.

Để cung cấp Gateway thông qua Ingress hoặc bộ cân bằng tải:

- Thay đổi liên kết Gateway trong `scripts/k8s/manifests/configmap.yaml` từ `loopback` sang một liên kết không phải loopback phù hợp với mô hình triển khai của bạn.
- Duy trì xác thực Gateway và sử dụng điểm vào có kết thúc TLS phù hợp.
- Cấu hình giao diện điều khiển để truy cập từ xa bằng mô hình bảo mật web được hỗ trợ (ví dụ: HTTPS/Tailscale Serve và các nguồn gốc được cho phép rõ ràng khi cần).

## Triển khai lại

```bash
./scripts/k8s/deploy.sh
```

Lệnh này áp dụng tất cả manifest và khởi động lại pod để nhận mọi thay đổi về cấu hình hoặc Secret.

## Gỡ bỏ

```bash
./scripts/k8s/deploy.sh --delete
```

Lệnh này xóa không gian tên và tất cả tài nguyên bên trong, bao gồm cả PVC.

## Ghi chú kiến trúc

- Theo mặc định, Gateway liên kết với local loopback bên trong pod, vì vậy thiết lập đi kèm dành cho `kubectl port-forward`.
- Không có tài nguyên phạm vi cụm; mọi thứ nằm trong một không gian tên duy nhất.
- Tăng cường bảo mật: `readOnlyRootFilesystem`, khả năng `drop: ALL`, người dùng không phải root (UID 1000).
- Cấu hình mặc định giữ giao diện điều khiển trên đường dẫn truy cập cục bộ an toàn hơn: liên kết loopback cùng `kubectl port-forward` tới `http://127.0.0.1:18789`.
- Nếu mở rộng truy cập ra ngoài localhost, hãy sử dụng mô hình từ xa được hỗ trợ: HTTPS/Tailscale cùng thiết lập liên kết Gateway và nguồn gốc giao diện điều khiển phù hợp.
- Các Secret được tạo trong thư mục tạm thời và áp dụng trực tiếp vào cụm; không có dữ liệu bí mật nào được ghi vào bản checkout của kho lưu trữ.

## Cấu trúc tệp

```text
scripts/k8s/
├── deploy.sh                   # Tạo không gian tên + Secret, triển khai qua kustomize
├── create-kind.sh              # Cụm Kind cục bộ (tự động phát hiện docker/podman)
└── manifests/
    ├── kustomization.yaml      # Cơ sở Kustomize
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Đặc tả pod với các biện pháp tăng cường bảo mật
    ├── pvc.yaml                # Bộ nhớ liên tục 10Gi
    └── service.yaml            # ClusterIP trên cổng 18789
```

## Liên quan

- [Docker](/vi/install/docker)
- [Môi trường chạy máy ảo Docker](/vi/install/docker-vm-runtime)
- [Tổng quan cài đặt](/vi/install)
