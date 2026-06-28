---
read_when:
    - می‌خواهید OpenClaw را روی یک کلاستر Kubernetes اجرا کنید
    - می‌خواهید OpenClaw را در یک محیط Kubernetes آزمایش کنید
summary: استقرار OpenClaw Gateway در یک خوشه Kubernetes با Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-06-28T20:46:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a38c2754b4a5267e79854958a252b2e4bc9811da191d8ccf3ac597534cc8e7a
    source_path: install/kubernetes.md
    workflow: 16
---

نقطه‌ی شروعی حداقلی برای اجرای OpenClaw روی Kubernetes — نه یک استقرار آماده‌ی تولید. این راهنما منابع اصلی را پوشش می‌دهد و قرار است متناسب با محیط شما تطبیق داده شود.

## چرا نه Helm؟

OpenClaw یک کانتینر واحد با چند فایل پیکربندی است. سفارشی‌سازی مهم در محتوای agent است (فایل‌های markdown، Skills، بازنویسی‌های پیکربندی)، نه قالب‌بندی زیرساخت. Kustomize overlayها را بدون سربار یک chart در Helm مدیریت می‌کند. اگر استقرار شما پیچیده‌تر شود، می‌توان یک chart در Helm را روی این manifestها قرار داد.

## چه چیزهایی لازم دارید

- یک کلاستر Kubernetes در حال اجرا (AKS، EKS، GKE، k3s، kind، OpenShift و غیره)
- `kubectl` متصل به کلاستر شما
- یک کلید API برای دست‌کم یک ارائه‌دهنده‌ی مدل

## شروع سریع

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

راز مشترک پیکربندی‌شده برای Control UI را بازیابی کنید. این اسکریپت استقرار
به‌صورت پیش‌فرض احراز هویت مبتنی بر توکن ایجاد می‌کند:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

برای اشکال‌زدایی محلی، `./scripts/k8s/deploy.sh --show-token` پس از استقرار توکن را چاپ می‌کند.

## آزمایش محلی با Kind

اگر کلاستر ندارید، یکی را به‌صورت محلی با [Kind](https://kind.sigs.k8s.io/) بسازید:

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

سپس طبق معمول با `./scripts/k8s/deploy.sh` استقرار را انجام دهید.

## گام‌به‌گام

### 1) استقرار

**گزینه A** — کلید API در محیط (یک مرحله):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

اسکریپت یک Secret در Kubernetes با کلید API و یک توکن Gateway تولیدشده به‌صورت خودکار ایجاد می‌کند و سپس استقرار را انجام می‌دهد. اگر Secret از قبل وجود داشته باشد، توکن فعلی Gateway و هر کلید ارائه‌دهنده‌ای را که تغییر نمی‌کند حفظ می‌کند.

**گزینه B** — secret را جداگانه ایجاد کنید:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

اگر می‌خواهید توکن برای آزمایش محلی در stdout چاپ شود، با هرکدام از فرمان‌ها از `--show-token` استفاده کنید.

### 2) دسترسی به Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## چه چیزهایی مستقر می‌شود

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## سفارشی‌سازی

### دستورالعمل‌های agent

`AGENTS.md` را در `scripts/k8s/manifests/configmap.yaml` ویرایش کنید و دوباره استقرار دهید:

```bash
./scripts/k8s/deploy.sh
```

### پیکربندی Gateway

`openclaw.json` را در `scripts/k8s/manifests/configmap.yaml` ویرایش کنید. برای مرجع کامل، [پیکربندی Gateway](/fa/gateway/configuration) را ببینید.

### افزودن ارائه‌دهنده‌ها

با کلیدهای اضافی exportشده دوباره اجرا کنید:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

کلیدهای ارائه‌دهنده‌ی موجود در Secret باقی می‌مانند مگر اینکه آن‌ها را بازنویسی کنید.

یا Secret را مستقیما patch کنید:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### فضای نام سفارشی

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### image سفارشی

فیلد `image` را در `scripts/k8s/manifests/deployment.yaml` ویرایش کنید:

```yaml
image: ghcr.io/openclaw/openclaw:latest # primary; official Docker Hub mirror: openclaw/openclaw:latest
```

### ارائه فراتر از port-forward

manifestهای پیش‌فرض Gateway را داخل pod به loopback متصل می‌کنند. این با `kubectl port-forward` کار می‌کند، اما با یک `Service` در Kubernetes یا مسیر Ingress که باید به IP مربوط به pod برسد کار نمی‌کند.

اگر می‌خواهید Gateway را از طریق Ingress یا load balancer ارائه کنید:

- اتصال Gateway را در `scripts/k8s/manifests/configmap.yaml` از `loopback` به یک اتصال غیر-loopback تغییر دهید که با مدل استقرار شما سازگار باشد
- احراز هویت Gateway را فعال نگه دارید و از یک نقطه‌ی ورود مناسب با TLS پایان‌یافته استفاده کنید
- Control UI را برای دسترسی راه دور با مدل امنیت وب پشتیبانی‌شده پیکربندی کنید (برای مثال HTTPS/Tailscale Serve و originهای مجاز صریح در صورت نیاز)

## استقرار دوباره

```bash
./scripts/k8s/deploy.sh
```

این همه‌ی manifestها را اعمال می‌کند و pod را restart می‌کند تا هر تغییر پیکربندی یا secret اعمال شود.

## حذف

```bash
./scripts/k8s/deploy.sh --delete
```

این فضای نام و همه‌ی منابع داخل آن، از جمله PVC، را حذف می‌کند.

## یادداشت‌های معماری

- Gateway به‌صورت پیش‌فرض داخل pod به loopback متصل می‌شود، بنابراین راه‌اندازی ارائه‌شده برای `kubectl port-forward` است
- هیچ منبعی در سطح کلاستر وجود ندارد — همه‌چیز در یک فضای نام واحد قرار دارد
- امنیت: قابلیت‌های `readOnlyRootFilesystem`، `drop: ALL`، کاربر غیر-root (UID 1000)
- پیکربندی پیش‌فرض Control UI را روی مسیر امن‌تر دسترسی محلی نگه می‌دارد: اتصال loopback به‌علاوه‌ی `kubectl port-forward` به `http://127.0.0.1:18789`
- اگر فراتر از دسترسی localhost می‌روید، از مدل راه دور پشتیبانی‌شده استفاده کنید: HTTPS/Tailscale به‌علاوه‌ی اتصال مناسب Gateway و تنظیمات origin در Control UI
- secretها در یک دایرکتوری موقت تولید و مستقیما روی کلاستر اعمال می‌شوند — هیچ ماده‌ی محرمانه‌ای در checkout مخزن نوشته نمی‌شود

## ساختار فایل

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

## مرتبط

- [Docker](/fa/install/docker)
- [زمان اجرای Docker VM](/fa/install/docker-vm-runtime)
- [نمای کلی نصب](/fa/install)
