---
read_when:
    - Bạn muốn chạy OpenClaw trên một cụm Kubernetes
    - Bạn muốn kiểm thử OpenClaw trong môi trường Kubernetes
summary: Triển khai OpenClaw Gateway lên một cụm Kubernetes bằng Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-05-06T09:18:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: c38e42ae9121864333574b668d95f4d1112cada30cd525613d2371f176de4505
    source_path: install/kubernetes.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Một điểm khởi đầu tối thiểu để chạy OpenClaw trên Kubernetes — không phải bản triển khai sẵn sàng cho môi trường production. Nội dung này bao gồm các tài nguyên cốt lõi và được thiết kế để bạn điều chỉnh theo môi trường của mình.

## Vì sao không dùng Helm?

OpenClaw là một container đơn với một số tệp cấu hình. Phần tùy chỉnh quan trọng nằm trong nội dung agent (tệp markdown, skills, ghi đè cấu hình), không phải tạo mẫu hạ tầng. Kustomize xử lý các lớp phủ mà không cần chi phí của biểu đồ Helm. Nếu bản triển khai của bạn phức tạp hơn, có thể xếp thêm một biểu đồ Helm lên trên các manifest này.

## Những gì bạn cần

- Một cụm Kubernetes đang chạy (AKS, EKS, GKE, k3s, kind, OpenShift, v.v.)
- `kubectl` đã kết nối với cụm của bạn
- Một khóa API cho ít nhất một nhà cung cấp mô hình

## Bắt đầu nhanh

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Lấy secret dùng chung đã cấu hình cho Giao diện điều khiển. Script triển khai này
tạo xác thực bằng token theo mặc định:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Để gỡ lỗi cục bộ, `./scripts/k8s/deploy.sh --show-token` in token sau khi triển khai.

## Kiểm thử cục bộ bằng Kind

Nếu bạn không có cụm, hãy tạo một cụm cục bộ bằng [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

Sau đó triển khai như thường lệ bằng `./scripts/k8s/deploy.sh`.

## Từng bước

### 1) Triển khai

**Tùy chọn A** — khóa API trong môi trường (một bước):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Script tạo Kubernetes Secret với khóa API và token Gateway được tự động tạo, rồi triển khai. Nếu Secret đã tồn tại, script giữ nguyên token Gateway hiện tại và mọi khóa nhà cung cấp không được thay đổi.

**Tùy chọn B** — tạo secret riêng:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Dùng `--show-token` với một trong hai lệnh nếu bạn muốn in token ra stdout để kiểm thử cục bộ.

### 2) Truy cập Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Những gì được triển khai

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## Tùy chỉnh

### Chỉ dẫn cho agent

Chỉnh sửa `AGENTS.md` trong `scripts/k8s/manifests/configmap.yaml` rồi triển khai lại:

```bash
./scripts/k8s/deploy.sh
```

### Cấu hình Gateway

Chỉnh sửa `openclaw.json` trong `scripts/k8s/manifests/configmap.yaml`. Xem [cấu hình Gateway](/vi/gateway/configuration) để biết tài liệu tham chiếu đầy đủ.

### Thêm nhà cung cấp

Chạy lại với các khóa bổ sung đã được xuất:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Các khóa nhà cung cấp hiện có vẫn nằm trong Secret trừ khi bạn ghi đè chúng.

Hoặc vá Secret trực tiếp:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Namespace tùy chỉnh

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Image tùy chỉnh

Chỉnh sửa trường `image` trong `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # or pin to a specific version from https://github.com/openclaw/openclaw/releases
```

### Mở truy cập ngoài port-forward

Các manifest mặc định liên kết Gateway với loopback bên trong pod. Cách này hoạt động với `kubectl port-forward`, nhưng không hoạt động với Kubernetes `Service` hoặc đường dẫn Ingress cần truy cập IP của pod.

Nếu bạn muốn mở Gateway qua Ingress hoặc bộ cân bằng tải:

- Đổi liên kết Gateway trong `scripts/k8s/manifests/configmap.yaml` từ `loopback` sang một liên kết không phải loopback phù hợp với mô hình triển khai của bạn
- Giữ xác thực Gateway được bật và dùng một điểm vào có kết thúc TLS phù hợp
- Cấu hình Giao diện điều khiển để truy cập từ xa bằng mô hình bảo mật web được hỗ trợ (ví dụ HTTPS/Tailscale Serve và các origin được phép rõ ràng khi cần)

## Triển khai lại

```bash
./scripts/k8s/deploy.sh
```

Lệnh này áp dụng tất cả manifest và khởi động lại pod để nhận mọi thay đổi cấu hình hoặc secret.

## Gỡ bỏ

```bash
./scripts/k8s/deploy.sh --delete
```

Lệnh này xóa namespace và mọi tài nguyên trong đó, bao gồm PVC.

## Ghi chú kiến trúc

- Gateway liên kết với loopback bên trong pod theo mặc định, nên thiết lập kèm theo dành cho `kubectl port-forward`
- Không có tài nguyên phạm vi cụm — mọi thứ nằm trong một namespace duy nhất
- Bảo mật: `readOnlyRootFilesystem`, capability `drop: ALL`, người dùng không phải root (UID 1000)
- Cấu hình mặc định giữ Giao diện điều khiển trên đường dẫn truy cập cục bộ an toàn hơn: liên kết loopback cộng với `kubectl port-forward` tới `http://127.0.0.1:18789`
- Nếu bạn vượt ra ngoài truy cập localhost, hãy dùng mô hình từ xa được hỗ trợ: HTTPS/Tailscale cộng với liên kết Gateway và thiết lập origin Giao diện điều khiển phù hợp
- Secret được tạo trong một thư mục tạm và áp dụng trực tiếp vào cụm — không có vật liệu secret nào được ghi vào bản checkout repo

## Cấu trúc tệp

```
scripts/k8s/
├── deploy.sh                   # Creates namespace + secret, deploys via kustomize
├── create-kind.sh              # Local Kind cluster (auto-detects docker/podman)
└── manifests/
    ├── kustomization.yaml      # Kustomize base
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Pod spec with security hardening
    ├── pvc.yaml                # 10Gi persistent storage
    └── service.yaml            # ClusterIP on 18789
```

## Liên quan

- [Docker](/vi/install/docker)
- [Docker VM runtime](/vi/install/docker-vm-runtime)
- [Tổng quan cài đặt](/vi/install)
