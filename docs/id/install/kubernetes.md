---
read_when:
    - Anda ingin menjalankan OpenClaw pada klaster Kubernetes
    - Anda ingin menguji OpenClaw di lingkungan Kubernetes
summary: Terapkan OpenClaw Gateway ke klaster Kubernetes dengan Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-06-28T20:43:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a38c2754b4a5267e79854958a252b2e4bc9811da191d8ccf3ac597534cc8e7a
    source_path: install/kubernetes.md
    workflow: 16
---

Titik awal minimal untuk menjalankan OpenClaw di Kubernetes — bukan deployment yang siap produksi. Ini mencakup resource inti dan dimaksudkan untuk disesuaikan dengan lingkungan Anda.

## Mengapa bukan Helm?

OpenClaw adalah satu container dengan beberapa file konfigurasi. Kustomisasi yang penting ada pada konten agent (file markdown, Skills, override konfigurasi), bukan templating infrastruktur. Kustomize menangani overlay tanpa overhead chart Helm. Jika deployment Anda menjadi lebih kompleks, chart Helm dapat dilapiskan di atas manifest ini.

## Yang Anda butuhkan

- Cluster Kubernetes yang berjalan (AKS, EKS, GKE, k3s, kind, OpenShift, dll.)
- `kubectl` yang terhubung ke cluster Anda
- Kunci API untuk setidaknya satu penyedia model

## Mulai cepat

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Ambil shared secret yang dikonfigurasi untuk Control UI. Skrip deploy ini
membuat autentikasi token secara default:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Untuk debugging lokal, `./scripts/k8s/deploy.sh --show-token` mencetak token setelah deploy.

## Pengujian lokal dengan Kind

Jika Anda tidak memiliki cluster, buat satu secara lokal dengan [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

Lalu deploy seperti biasa dengan `./scripts/k8s/deploy.sh`.

## Langkah demi langkah

### 1) Deploy

**Opsi A** — kunci API di environment (satu langkah):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Skrip membuat Kubernetes Secret dengan kunci API dan token gateway yang dibuat otomatis, lalu melakukan deploy. Jika Secret sudah ada, skrip mempertahankan token gateway saat ini dan kunci penyedia apa pun yang tidak diubah.

**Opsi B** — buat secret secara terpisah:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Gunakan `--show-token` dengan salah satu perintah jika Anda ingin token dicetak ke stdout untuk pengujian lokal.

### 2) Akses gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Yang di-deploy

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## Kustomisasi

### Instruksi agent

Edit `AGENTS.md` di `scripts/k8s/manifests/configmap.yaml` dan deploy ulang:

```bash
./scripts/k8s/deploy.sh
```

### Konfigurasi Gateway

Edit `openclaw.json` di `scripts/k8s/manifests/configmap.yaml`. Lihat [Konfigurasi Gateway](/id/gateway/configuration) untuk referensi lengkap.

### Tambahkan penyedia

Jalankan ulang dengan kunci tambahan yang diekspor:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Kunci penyedia yang sudah ada tetap berada di Secret kecuali Anda menimpanya.

Atau patch Secret secara langsung:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Namespace kustom

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Image kustom

Edit kolom `image` di `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # primary; official Docker Hub mirror: openclaw/openclaw:latest
```

### Ekspos di luar port-forward

Manifest default mengikat gateway ke loopback di dalam pod. Itu berfungsi dengan `kubectl port-forward`, tetapi tidak berfungsi dengan Kubernetes `Service` atau jalur Ingress yang perlu menjangkau IP pod.

Jika Anda ingin mengekspos gateway melalui Ingress atau load balancer:

- Ubah bind gateway di `scripts/k8s/manifests/configmap.yaml` dari `loopback` menjadi bind non-loopback yang sesuai dengan model deployment Anda
- Tetap aktifkan autentikasi gateway dan gunakan entrypoint yang diterminasi TLS dengan benar
- Konfigurasikan Control UI untuk akses jarak jauh menggunakan model keamanan web yang didukung (misalnya HTTPS/Tailscale Serve dan origin yang diizinkan secara eksplisit saat diperlukan)

## Deploy ulang

```bash
./scripts/k8s/deploy.sh
```

Ini menerapkan semua manifest dan memulai ulang pod agar setiap perubahan konfigurasi atau secret diterapkan.

## Bongkar

```bash
./scripts/k8s/deploy.sh --delete
```

Ini menghapus namespace dan semua resource di dalamnya, termasuk PVC.

## Catatan arsitektur

- Gateway mengikat ke loopback di dalam pod secara default, jadi setup yang disertakan ditujukan untuk `kubectl port-forward`
- Tidak ada resource berskala cluster — semuanya berada dalam satu namespace
- Keamanan: `readOnlyRootFilesystem`, kapabilitas `drop: ALL`, pengguna non-root (UID 1000)
- Konfigurasi default menjaga Control UI pada jalur akses lokal yang lebih aman: bind loopback plus `kubectl port-forward` ke `http://127.0.0.1:18789`
- Jika Anda melampaui akses localhost, gunakan model jarak jauh yang didukung: HTTPS/Tailscale plus bind gateway yang sesuai dan pengaturan origin Control UI
- Secret dibuat di direktori sementara dan diterapkan langsung ke cluster — tidak ada material secret yang ditulis ke checkout repo

## Struktur file

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

## Terkait

- [Docker](/id/install/docker)
- [Runtime Docker VM](/id/install/docker-vm-runtime)
- [Ringkasan instalasi](/id/install)
