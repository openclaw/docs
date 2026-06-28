---
read_when:
    - Bạn muốn chạy OpenClaw trên một cụm Kubernetes
    - Bạn muốn kiểm thử OpenClaw trong môi trường Kubernetes
summary: Triển khai OpenClaw Gateway lên cụm Kubernetes bằng Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-06-28T20:44:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a38c2754b4a5267e79854958a252b2e4bc9811da191d8ccf3ac597534cc8e7a
    source_path: install/kubernetes.md
    workflow: 16
---

Một điểm khởi đầu tối thiểu để chạy OpenClaw trên Kubernetes — không phải bản triển khai sẵn sàng cho môi trường production. Tài liệu này bao quát các tài nguyên cốt lõi và được thiết kế để bạn điều chỉnh cho phù hợp với môi trường của mình.

## Tại sao không dùng Helm?

OpenClaw là một container đơn với một số tệp cấu hình. Phần tùy chỉnh đáng chú ý nằm ở nội dung agent (tệp markdown, skills, ghi đè cấu hình), không phải ở tạo khuôn mẫu hạ tầng. Kustomize xử lý các overlay mà không cần chi phí phụ của một Helm chart. Nếu bản triển khai của bạn trở nên phức tạp hơn, có thể xếp một Helm chart lên trên các manifest này.

## Bạn cần gì

- Một cụm Kubernetes đang chạy (AKS, EKS, GKE, k3s, kind, OpenShift, v.v.)
- `kubectl` đã kết nối với cụm của bạn
- Một API key cho ít nhất một nhà cung cấp mô hình

## Khởi động nhanh

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Lấy shared secret đã cấu hình cho Control UI. Script triển khai này
tạo xác thực bằng token theo mặc định:

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

Sau đó triển khai như bình thường với `./scripts/k8s/deploy.sh`.

## Từng bước

### 1) Triển khai

**Tùy chọn A** — API key trong môi trường (một bước):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Script tạo một Kubernetes Secret với API key và một gateway token được tự động tạo, sau đó triển khai. Nếu Secret đã tồn tại, script sẽ giữ nguyên gateway token hiện tại và mọi provider key không được thay đổi.

**Tùy chọn B** — tạo secret riêng:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Dùng `--show-token` với một trong hai lệnh nếu bạn muốn in token ra stdout để kiểm thử cục bộ.

### 2) Truy cập gateway

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

### Hướng dẫn cho agent

Chỉnh sửa `AGENTS.md` trong `scripts/k8s/manifests/configmap.yaml` rồi triển khai lại:

```bash
./scripts/k8s/deploy.sh
```

### Cấu hình Gateway

Chỉnh sửa `openclaw.json` trong `scripts/k8s/manifests/configmap.yaml`. Xem [Cấu hình Gateway](/vi/gateway/configuration) để biết tài liệu tham chiếu đầy đủ.

### Thêm nhà cung cấp

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
image: ghcr.io/openclaw/openclaw:latest # primary; official Docker Hub mirror: openclaw/openclaw:latest
```

### Mở ra ngoài port-forward

Các manifest mặc định bind gateway vào loopback bên trong pod. Cách này hoạt động với `kubectl port-forward`, nhưng không hoạt động với Kubernetes `Service` hoặc đường dẫn Ingress cần truy cập IP của pod.

Nếu bạn muốn mở gateway thông qua Ingress hoặc load balancer:

- Đổi gateway bind trong `scripts/k8s/manifests/configmap.yaml` từ `loopback` sang một bind không phải loopback phù hợp với mô hình triển khai của bạn
- Giữ bật xác thực gateway và dùng một entrypoint có TLS termination đúng cách
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

Lệnh này xóa namespace và tất cả tài nguyên trong đó, bao gồm cả PVC.

## Ghi chú kiến trúc

- Gateway bind vào loopback bên trong pod theo mặc định, vì vậy thiết lập đi kèm dành cho `kubectl port-forward`
- Không có tài nguyên phạm vi toàn cụm — mọi thứ nằm trong một namespace duy nhất
- Bảo mật: `readOnlyRootFilesystem`, capability `drop: ALL`, người dùng không phải root (UID 1000)
- Cấu hình mặc định giữ Control UI trên đường truy cập cục bộ an toàn hơn: bind loopback cộng với `kubectl port-forward` tới `http://127.0.0.1:18789`
- Nếu bạn mở rộng ra ngoài truy cập localhost, hãy dùng mô hình từ xa được hỗ trợ: HTTPS/Tailscale cộng với gateway bind phù hợp và thiết lập origin của Control UI
- Secret được tạo trong một thư mục tạm và áp dụng trực tiếp vào cụm — không có dữ liệu secret nào được ghi vào repo checkout

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
