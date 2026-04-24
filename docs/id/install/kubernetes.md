---
read_when:
    - Anda ingin menjalankan OpenClaw di klaster Kubernetes
    - Anda ingin menguji OpenClaw di lingkungan Kubernetes
summary: Deploy Gateway OpenClaw ke klaster Kubernetes dengan Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-04-24T09:14:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f45e165569332277d1108cd34a4357f03f5a1cbfa93bbbcf478717945627bad
    source_path: install/kubernetes.md
    workflow: 15
---

# OpenClaw di Kubernetes

Titik awal minimal untuk menjalankan OpenClaw di Kubernetes — belum merupakan deployment siap produksi. Ini mencakup resource inti dan dimaksudkan untuk disesuaikan dengan lingkungan Anda.

## Mengapa bukan Helm?

OpenClaw adalah satu container dengan beberapa file config. Kustomisasi yang menarik ada pada konten agen (file markdown, Skills, override config), bukan templating infrastruktur. Kustomize menangani overlay tanpa overhead chart Helm. Jika deployment Anda menjadi lebih kompleks, chart Helm dapat ditambahkan di atas manifest ini.

## Yang Anda butuhkan

- Klaster Kubernetes yang sedang berjalan (AKS, EKS, GKE, k3s, kind, OpenShift, dll.)
- `kubectl` yang terhubung ke klaster Anda
- API key untuk setidaknya satu provider model

## Mulai cepat

```bash
# Ganti dengan provider Anda: ANTHROPIC, GEMINI, OPENAI, atau OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Ambil shared secret yang dikonfigurasi untuk UI Control. Skrip deploy ini
secara default membuat auth token:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Untuk debugging lokal, `./scripts/k8s/deploy.sh --show-token` mencetak token setelah deployment.

## Pengujian lokal dengan Kind

Jika Anda tidak punya klaster, buat satu secara lokal dengan [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # mendeteksi docker atau podman secara otomatis
./scripts/k8s/create-kind.sh --delete  # hapus
```

Lalu deploy seperti biasa dengan `./scripts/k8s/deploy.sh`.

## Langkah demi langkah

### 1) Deploy

**Opsi A** — API key di environment (satu langkah):

```bash
# Ganti dengan provider Anda: ANTHROPIC, GEMINI, OPENAI, atau OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Skrip ini membuat Secret Kubernetes dengan API key dan token gateway yang dibuat otomatis, lalu melakukan deploy. Jika Secret sudah ada, skrip ini mempertahankan token gateway saat ini dan semua key provider yang tidak sedang diubah.

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

## Yang dideploy

```
Namespace: openclaw (dapat dikonfigurasi melalui OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Pod tunggal, init container + gateway
├── Service/openclaw           # ClusterIP di port 18789
├── PersistentVolumeClaim      # 10Gi untuk status agen dan config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Token Gateway + API key
```

## Kustomisasi

### Instruksi agen

Edit `AGENTS.md` di `scripts/k8s/manifests/configmap.yaml` lalu deploy ulang:

```bash
./scripts/k8s/deploy.sh
```

### Config Gateway

Edit `openclaw.json` di `scripts/k8s/manifests/configmap.yaml`. Lihat [Konfigurasi Gateway](/id/gateway/configuration) untuk referensi lengkap.

### Tambahkan provider

Jalankan ulang dengan key tambahan yang sudah diekspor:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Key provider yang ada tetap berada di Secret kecuali Anda menimpanya.

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

Manifest default melakukan bind gateway ke loopback di dalam pod. Ini bekerja dengan `kubectl port-forward`, tetapi tidak bekerja dengan jalur `Service` atau Ingress Kubernetes yang perlu menjangkau IP pod.

Jika Anda ingin mengekspos gateway melalui Ingress atau load balancer:

- Ubah bind gateway di `scripts/k8s/manifests/configmap.yaml` dari `loopback` ke bind non-loopback yang sesuai dengan model deployment Anda
- Pertahankan auth gateway tetap aktif dan gunakan entrypoint dengan terminasi TLS yang benar
- Konfigurasikan UI Control untuk akses jarak jauh menggunakan model keamanan web yang didukung (misalnya HTTPS/Tailscale Serve dan allowed origins eksplisit bila diperlukan)

## Deploy ulang

```bash
./scripts/k8s/deploy.sh
```

Ini menerapkan semua manifest dan me-restart pod untuk mengambil perubahan config atau secret.

## Teardown

```bash
./scripts/k8s/deploy.sh --delete
```

Ini menghapus namespace dan semua resource di dalamnya, termasuk PVC.

## Catatan arsitektur

- Gateway secara default melakukan bind ke loopback di dalam pod, sehingga penyiapan yang disertakan ditujukan untuk `kubectl port-forward`
- Tidak ada resource tingkat klaster — semuanya berada dalam satu namespace
- Keamanan: `readOnlyRootFilesystem`, kapabilitas `drop: ALL`, pengguna non-root (UID 1000)
- Config default menjaga UI Control tetap pada jalur akses lokal yang lebih aman: bind loopback plus `kubectl port-forward` ke `http://127.0.0.1:18789`
- Jika Anda bergerak melampaui akses localhost, gunakan model remote yang didukung: HTTPS/Tailscale plus bind gateway yang sesuai dan pengaturan origin UI Control
- Secret dibuat di direktori sementara dan diterapkan langsung ke klaster — tidak ada material secret yang ditulis ke checkout repo

## Struktur file

```
scripts/k8s/
├── deploy.sh                   # Membuat namespace + secret, deploy via kustomize
├── create-kind.sh              # Klaster Kind lokal (mendeteksi docker/podman secara otomatis)
└── manifests/
    ├── kustomization.yaml      # Basis Kustomize
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Spec pod dengan hardening keamanan
    ├── pvc.yaml                # Penyimpanan persisten 10Gi
    └── service.yaml            # ClusterIP di 18789
```

## Terkait

- [Docker](/id/install/docker)
- [Runtime Docker VM](/id/install/docker-vm-runtime)
- [Ikhtisar instalasi](/id/install)
