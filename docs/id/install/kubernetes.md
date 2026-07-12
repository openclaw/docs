---
read_when:
    - Anda ingin menjalankan OpenClaw pada klaster Kubernetes
    - Anda ingin menguji OpenClaw di lingkungan Kubernetes
summary: Terapkan Gateway OpenClaw ke klaster Kubernetes dengan Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-07-12T14:17:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c05eb0eb923fa1f515aca1f6dcb6073aba69af0bdf30233243027edfedd45a39
    source_path: install/kubernetes.md
    workflow: 16
---

Titik awal minimal untuk menjalankan OpenClaw di Kubernetes, bukan deployment yang siap untuk produksi. Panduan ini mencakup sumber daya inti dan dimaksudkan untuk disesuaikan dengan lingkungan Anda.

## Mengapa tidak menggunakan Helm

OpenClaw adalah satu kontainer dengan beberapa berkas konfigurasi. Penyesuaian yang utama terdapat dalam konten agen (berkas Markdown, Skills, penggantian konfigurasi), bukan pembuatan templat infrastruktur. Kustomize menangani lapisan penyesuaian tanpa beban tambahan bagan Helm. Tambahkan bagan Helm di atas manifes ini jika deployment Anda menjadi lebih kompleks.

## Yang Anda perlukan

- Klaster Kubernetes yang berjalan (AKS, EKS, GKE, k3s, kind, OpenShift, dan sebagainya)
- `kubectl` yang terhubung ke klaster Anda
- Kunci API untuk setidaknya satu penyedia model

## Mulai cepat

```bash
# Ganti dengan penyedia Anda: ANTHROPIC, GEMINI, OPENAI, atau OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

`deploy.sh` membuat autentikasi token secara bawaan. Ambil token Gateway yang dihasilkan untuk UI Kontrol:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Untuk penelusuran kesalahan lokal, `./scripts/k8s/deploy.sh --show-token` mencetak token setelah deployment.

## Pengujian lokal dengan Kind

Jika Anda tidak memiliki klaster, buat klaster secara lokal dengan [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # mendeteksi docker atau podman secara otomatis
./scripts/k8s/create-kind.sh --delete  # menghapus
```

Kemudian lakukan deployment seperti biasa dengan `./scripts/k8s/deploy.sh`.

## Langkah demi langkah

### 1) Lakukan deployment

**Opsi A: Kunci API di lingkungan (satu langkah)**

```bash
# Ganti dengan penyedia Anda: ANTHROPIC, GEMINI, OPENAI, atau OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Skrip membuat Secret Kubernetes dengan kunci API dan token Gateway yang dibuat secara otomatis, lalu melakukan deployment. Jika Secret sudah ada, skrip mempertahankan token Gateway saat ini dan semua kunci penyedia yang tidak diubah.

**Opsi B: Buat secret secara terpisah**

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Tambahkan `--show-token` ke salah satu perintah untuk mencetak token ke stdout bagi pengujian lokal.

### 2) Akses Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Yang diterapkan

```text
Namespace: openclaw (dapat dikonfigurasi melalui OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Satu pod, kontainer init + Gateway
├── Service/openclaw           # ClusterIP pada porta 18789
├── PersistentVolumeClaim      # 10 Gi untuk status dan konfigurasi agen
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Token Gateway + kunci API
```

## Penyesuaian

### Instruksi agen

Edit `AGENTS.md` di `scripts/k8s/manifests/configmap.yaml` dan lakukan deployment ulang:

```bash
./scripts/k8s/deploy.sh
```

### Konfigurasi Gateway

Edit `openclaw.json` di `scripts/k8s/manifests/configmap.yaml`. Lihat [konfigurasi Gateway](/id/gateway/configuration) untuk referensi lengkap.

### Tambahkan penyedia

Jalankan ulang dengan mengekspor kunci tambahan:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Kunci penyedia yang ada tetap berada di Secret kecuali Anda menimpanya.

Atau tambal Secret secara langsung:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Namespace khusus

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Citra khusus

Edit bidang `image` di `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:slim # utama; mirror resmi Docker Hub: openclaw/openclaw
```

### Ekspos di luar penerusan porta

Manifes bawaan mengikat Gateway ke loopback di dalam pod. Konfigurasi ini berfungsi dengan `kubectl port-forward`, tetapi tidak dengan `Service` Kubernetes atau jalur Ingress yang perlu menjangkau IP pod secara langsung.

Untuk mengekspos Gateway melalui Ingress atau penyeimbang beban:

- Ubah pengikatan Gateway di `scripts/k8s/manifests/configmap.yaml` dari `loopback` menjadi pengikatan non-loopback yang sesuai dengan model deployment Anda.
- Pertahankan autentikasi Gateway tetap aktif dan gunakan titik masuk yang mengakhiri TLS dengan benar.
- Konfigurasikan UI Kontrol untuk akses jarak jauh menggunakan model keamanan web yang didukung (misalnya HTTPS/Tailscale Serve dan origin yang diizinkan secara eksplisit bila diperlukan).

## Deployment ulang

```bash
./scripts/k8s/deploy.sh
```

Perintah ini menerapkan semua manifes dan memulai ulang pod untuk mengambil setiap perubahan konfigurasi atau secret.

## Pembongkaran

```bash
./scripts/k8s/deploy.sh --delete
```

Perintah ini menghapus namespace dan semua sumber daya di dalamnya, termasuk PVC.

## Catatan arsitektur

- Gateway terikat ke loopback di dalam pod secara bawaan, sehingga penyiapan yang disertakan ditujukan untuk `kubectl port-forward`.
- Tidak ada sumber daya yang cakupannya seluruh klaster; semuanya berada dalam satu namespace.
- Penguatan keamanan: `readOnlyRootFilesystem`, kapabilitas `drop: ALL`, pengguna non-root (UID 1000).
- Konfigurasi bawaan mempertahankan UI Kontrol pada jalur akses lokal yang lebih aman: pengikatan loopback ditambah `kubectl port-forward` ke `http://127.0.0.1:18789`.
- Jika Anda beralih dari akses localhost, gunakan model jarak jauh yang didukung: HTTPS/Tailscale ditambah pengikatan Gateway dan pengaturan origin UI Kontrol yang sesuai.
- Secret dibuat dalam direktori sementara dan diterapkan langsung ke klaster; tidak ada materi rahasia yang ditulis ke checkout repositori.

## Struktur berkas

```text
scripts/k8s/
├── deploy.sh                   # Membuat namespace + secret, melakukan deployment melalui kustomize
├── create-kind.sh              # Klaster Kind lokal (mendeteksi docker/podman secara otomatis)
└── manifests/
    ├── kustomization.yaml      # Basis Kustomize
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Spesifikasi pod dengan penguatan keamanan
    ├── pvc.yaml                # Penyimpanan persisten 10 Gi
    └── service.yaml            # ClusterIP pada 18789
```

## Terkait

- [Docker](/id/install/docker)
- [Runtime VM Docker](/id/install/docker-vm-runtime)
- [Ikhtisar instalasi](/id/install)
