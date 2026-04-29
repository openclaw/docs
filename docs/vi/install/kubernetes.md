---
read_when:
    - Bạn muốn chạy OpenClaw trên một cụm Kubernetes
    - Bạn muốn kiểm thử OpenClaw trong môi trường Kubernetes
summary: Triển khai OpenClaw Gateway lên một cụm Kubernetes bằng Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-04-29T22:52:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f45e165569332277d1108cd34a4357f03f5a1cbfa93bbbcf478717945627bad
    source_path: install/kubernetes.md
    workflow: 16
---

# OpenClaw trên Kubernetes

Điểm khởi đầu tối thiểu để chạy OpenClaw trên Kubernetes — không phải một triển khai sẵn sàng cho production. Tài liệu này bao quát các tài nguyên cốt lõi và được thiết kế để bạn điều chỉnh cho phù hợp với môi trường của mình.

## Tại sao không dùng Helm?

OpenClaw là một container đơn với một số tệp cấu hình. Phần tùy chỉnh đáng chú ý nằm ở nội dung agent (các tệp markdown, skills, ghi đè cấu hình), không phải ở khuôn mẫu hạ tầng. Kustomize xử lý các overlay mà không có phần chi phí phụ của Helm chart. Nếu triển khai của bạn trở nên phức tạp hơn, có thể đặt một Helm chart lên trên các manifest này.

## Bạn cần gì

- Một cụm Kubernetes đang chạy (AKS, EKS, GKE, k3s, kind, OpenShift, v.v.)
- `kubectl` đã kết nối tới cụm của bạn
- Một API key cho ít nhất một model provider

## Khởi động nhanh

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Truy xuất shared secret đã cấu hình cho Control UI. Script triển khai này tạo token auth theo mặc định:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Để gỡ lỗi cục bộ, `./scripts/k8s/deploy.sh --show-token` in token sau khi triển khai.

## Kiểm thử cục bộ với Kind

Nếu bạn không có cụm, hãy tạo một cụm cục bộ bằng [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

Sau đó triển khai như thường lệ với `./scripts/k8s/deploy.sh`.

## Từng bước

### 1) Triển khai

**Tùy chọn A** — API key trong môi trường (một bước):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Script tạo một Kubernetes Secret với API key và gateway token được tạo tự động, rồi triển khai. Nếu Secret đã tồn tại, script giữ nguyên gateway token hiện tại và mọi provider key không bị thay đổi.

**Tùy chọn B** — tạo secret riêng:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Dùng `--show-token` với một trong hai lệnh nếu bạn muốn token được in ra stdout để kiểm thử cục bộ.

### 2) Truy cập gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Nội dung được triển khai

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## Tùy chỉnh

### Hướng dẫn cho agent

Chỉnh sửa `AGENTS.md` trong `scripts/k8s/manifests/configmap.yaml` và triển khai lại:

```bash
./scripts/k8s/deploy.sh
```

### Cấu hình Gateway

Chỉnh sửa `openclaw.json` trong `scripts/k8s/manifests/configmap.yaml`. Xem [Cấu hình Gateway](/vi/gateway/configuration) để biết tham chiếu đầy đủ.

### Thêm providers

Chạy lại với các key bổ sung đã export:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Các provider key hiện có vẫn ở trong Secret trừ khi bạn ghi đè chúng.

Hoặc patch Secret trực tiếp:

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

### Mở ra ngoài port-forward

Các manifest mặc định bind gateway vào loopback bên trong pod. Cách này hoạt động với `kubectl port-forward`, nhưng không hoạt động với một Kubernetes `Service` hoặc đường dẫn Ingress cần truy cập tới IP của pod.

Nếu bạn muốn mở gateway qua Ingress hoặc load balancer:

- Đổi gateway bind trong `scripts/k8s/manifests/configmap.yaml` từ `loopback` sang một bind không phải loopback phù hợp với mô hình triển khai của bạn
- Giữ gateway auth được bật và dùng một entrypoint được kết thúc TLS đúng cách
- Cấu hình Control UI cho truy cập từ xa bằng mô hình bảo mật web được hỗ trợ (ví dụ HTTPS/Tailscale Serve và các origin được cho phép rõ ràng khi cần)

## Triển khai lại

```bash
./scripts/k8s/deploy.sh
```

Lệnh này áp dụng tất cả manifest và khởi động lại pod để nhận mọi thay đổi về cấu hình hoặc secret.

## Gỡ bỏ

```bash
./scripts/k8s/deploy.sh --delete
```

Lệnh này xóa namespace và tất cả tài nguyên bên trong, bao gồm cả PVC.

## Ghi chú kiến trúc

- Gateway bind vào loopback bên trong pod theo mặc định, nên thiết lập đi kèm dành cho `kubectl port-forward`
- Không có tài nguyên cấp cụm — mọi thứ nằm trong một namespace duy nhất
- Bảo mật: `readOnlyRootFilesystem`, capability `drop: ALL`, người dùng không phải root (UID 1000)
- Cấu hình mặc định giữ Control UI trên đường dẫn truy cập cục bộ an toàn hơn: loopback bind cộng với `kubectl port-forward` tới `http://127.0.0.1:18789`
- Nếu bạn vượt ra ngoài truy cập localhost, hãy dùng mô hình từ xa được hỗ trợ: HTTPS/Tailscale cộng với gateway bind phù hợp và cài đặt origin của Control UI
- Secret được tạo trong thư mục tạm và áp dụng trực tiếp vào cụm — không có dữ liệu secret nào được ghi vào repo checkout

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
