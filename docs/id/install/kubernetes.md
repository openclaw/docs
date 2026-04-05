---
read_when:
    - Anda ingin menjalankan OpenClaw di cluster Kubernetes
    - Anda ingin menguji OpenClaw di lingkungan Kubernetes
summary: Deploy Gateway OpenClaw ke cluster Kubernetes dengan Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-04-05T13:58:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa39127de5a5571f117db3a1bfefd5815b5e6b594cc1df553e30fda882b2a408
    source_path: install/kubernetes.md
    workflow: 15
---

# OpenClaw di Kubernetes

Titik awal minimal untuk menjalankan OpenClaw di Kubernetes — bukan deployment yang siap produksi. Ini mencakup resource inti dan dimaksudkan untuk disesuaikan dengan lingkungan Anda.

## Mengapa bukan Helm?

OpenClaw adalah satu kontainer dengan beberapa file konfigurasi. Kustomisasi yang menarik ada pada konten agent (file markdown, Skills, override konfigurasi), bukan templating infrastruktur. Kustomize menangani overlay tanpa overhead chart Helm. Jika deployment Anda menjadi lebih kompleks, chart Helm dapat dilapiskan di atas manifest ini.

## Yang Anda butuhkan

- Cluster Kubernetes yang berjalan (AKS, EKS, GKE, k3s, kind, OpenShift, dll.)
- `kubectl` yang terhubung ke cluster Anda
- Kunci API untuk setidaknya satu provider model

## Mulai cepat

```bash
# Ganti dengan provider Anda: ANTHROPIC, GEMINI, OPENAI, atau OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Ambil secret bersama yang dikonfigurasi untuk UI Kontrol. Skrip deploy ini
membuat auth token secara default:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Untuk debugging lokal, `./scripts/k8s/deploy.sh --show-token` mencetak token setelah deploy.

## Pengujian lokal dengan Kind

Jika Anda belum memiliki cluster, buat secara lokal dengan [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # mendeteksi docker atau podman secara otomatis
./scripts/k8s/create-kind.sh --delete  # hapus
```

Lalu deploy seperti biasa dengan `./scripts/k8s/deploy.sh`.

## Langkah demi langkah

### 1) Deploy

**Opsi A** — kunci API di lingkungan (satu langkah):

```bash
# Ganti dengan provider Anda: ANTHROPIC, GEMINI, OPENAI, atau OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Skrip ini membuat Secret Kubernetes dengan kunci API dan token gateway yang dibuat otomatis, lalu melakukan deploy. Jika Secret sudah ada, skrip mempertahankan token gateway saat ini dan semua kunci provider yang tidak sedang diubah.

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

## Apa yang di-deploy

```
Namespace: openclaw (dapat dikonfigurasi melalui OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Satu pod, init container + gateway
├── Service/openclaw           # ClusterIP di port 18789
├── PersistentVolumeClaim      # 10Gi untuk state agent dan konfigurasi
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Token gateway + kunci API
```

## Kustomisasi

### Instruksi agent

Edit `AGENTS.md` di `scripts/k8s/manifests/configmap.yaml` lalu deploy ulang:

```bash
./scripts/k8s/deploy.sh
```

### Konfigurasi Gateway

Edit `openclaw.json` di `scripts/k8s/manifests/configmap.yaml`. Lihat [Konfigurasi Gateway](/id/gateway/configuration) untuk referensi lengkap.

### Tambahkan provider

Jalankan ulang dengan mengekspor kunci tambahan:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Kunci provider yang sudah ada tetap berada di Secret kecuali Anda menimpanya.

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

Edit field `image` di `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # atau sematkan ke versi tertentu dari https://github.com/openclaw/openclaw/releases
```

### Ekspos di luar port-forward

Manifest default melakukan bind gateway ke loopback di dalam pod. Ini berfungsi dengan `kubectl port-forward`, tetapi tidak berfungsi dengan `Service` atau jalur Ingress Kubernetes yang perlu menjangkau IP pod.

Jika Anda ingin mengekspos gateway melalui Ingress atau load balancer:

- Ubah bind gateway di `scripts/k8s/manifests/configmap.yaml` dari `loopback` ke bind non-loopback yang sesuai dengan model deployment Anda
- Biarkan auth gateway tetap aktif dan gunakan entrypoint dengan terminasi TLS yang benar
- Konfigurasikan UI Kontrol untuk akses jarak jauh menggunakan model keamanan web yang didukung (misalnya HTTPS/Tailscale Serve dan origin yang diizinkan secara eksplisit bila diperlukan)

## Deploy ulang

```bash
./scripts/k8s/deploy.sh
```

Ini menerapkan semua manifest dan me-restart pod untuk mengambil perubahan konfigurasi atau secret apa pun.

## Pembongkaran

```bash
./scripts/k8s/deploy.sh --delete
```

Ini menghapus namespace dan semua resource di dalamnya, termasuk PVC.

## Catatan arsitektur

- Gateway secara default melakukan bind ke loopback di dalam pod, jadi penyiapan yang disertakan ditujukan untuk `kubectl port-forward`
- Tidak ada resource berskala cluster — semuanya berada dalam satu namespace
- Keamanan: `readOnlyRootFilesystem`, kapabilitas `drop: ALL`, pengguna non-root (UID 1000)
- Konfigurasi default menjaga UI Kontrol pada jalur akses lokal yang lebih aman: bind loopback plus `kubectl port-forward` ke `http://127.0.0.1:18789`
- Jika Anda beralih melampaui akses localhost, gunakan model jarak jauh yang didukung: HTTPS/Tailscale ditambah bind gateway dan pengaturan origin UI Kontrol yang sesuai
- Secret dibuat di direktori sementara dan diterapkan langsung ke cluster — tidak ada materi secret yang ditulis ke checkout repo

## Struktur file

```
scripts/k8s/
├── deploy.sh                   # Membuat namespace + secret, deploy via kustomize
├── create-kind.sh              # Cluster Kind lokal (mendeteksi docker/podman secara otomatis)
└── manifests/
    ├── kustomization.yaml      # Basis Kustomize
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Spesifikasi pod dengan hardening keamanan
    ├── pvc.yaml                # Penyimpanan persisten 10Gi
    └── service.yaml            # ClusterIP di 18789
```
