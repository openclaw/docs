---
read_when:
    - می‌خواهید OpenClaw را روی یک کلاستر Kubernetes اجرا کنید
    - می‌خواهید OpenClaw را در یک محیط Kubernetes آزمایش کنید
summary: استقرار OpenClaw Gateway در یک خوشه Kubernetes با Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-04-29T23:05:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f45e165569332277d1108cd34a4357f03f5a1cbfa93bbbcf478717945627bad
    source_path: install/kubernetes.md
    workflow: 16
---

# OpenClaw روی Kubernetes

یک نقطهٔ شروع حداقلی برای اجرای OpenClaw روی Kubernetes — نه یک استقرار آمادهٔ تولید. این راهنما منابع اصلی را پوشش می‌دهد و قرار است با محیط شما سازگار شود.

## چرا نه Helm؟

OpenClaw یک کانتینر تکی با چند فایل پیکربندی است. سفارشی‌سازی مهم در محتوای عامل‌ها است (فایل‌های Markdown، Skills، بازنویسی‌های پیکربندی)، نه قالب‌سازی زیرساخت. Kustomize بدون سربار یک چارت Helm، overlayها را مدیریت می‌کند. اگر استقرار شما پیچیده‌تر شود، می‌توان یک چارت Helm را روی این manifestها لایه‌بندی کرد.

## آنچه نیاز دارید

- یک کلاستر Kubernetes در حال اجرا (AKS، EKS، GKE، k3s، kind، OpenShift و غیره)
- `kubectl` متصل به کلاستر شما
- یک کلید API برای حداقل یک ارائه‌دهندهٔ مدل

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

برای اشکال‌زدایی محلی، `./scripts/k8s/deploy.sh --show-token` پس از استقرار، توکن را چاپ می‌کند.

## آزمون محلی با Kind

اگر کلاستر ندارید، یکی را به‌صورت محلی با [Kind](https://kind.sigs.k8s.io/) بسازید:

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

سپس طبق معمول با `./scripts/k8s/deploy.sh` استقرار دهید.

## گام‌به‌گام

### 1) استقرار

**گزینه A** — کلید API در محیط (یک مرحله):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

اسکریپت یک Kubernetes Secret با کلید API و یک توکن Gateway تولیدشدهٔ خودکار ایجاد می‌کند، سپس استقرار را انجام می‌دهد. اگر Secret از قبل وجود داشته باشد، توکن Gateway فعلی و هر کلید ارائه‌دهنده‌ای را که تغییر نمی‌کند حفظ می‌کند.

**گزینه B** — ساخت راز به‌صورت جداگانه:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

اگر می‌خواهید توکن برای آزمون محلی در stdout چاپ شود، با هرکدام از فرمان‌ها از `--show-token` استفاده کنید.

### 2) دسترسی به Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## آنچه مستقر می‌شود

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## سفارشی‌سازی

### دستورالعمل‌های عامل

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

کلیدهای ارائه‌دهندهٔ موجود در Secret باقی می‌مانند، مگر اینکه آن‌ها را بازنویسی کنید.

یا Secret را مستقیم patch کنید:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### namespace سفارشی

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### image سفارشی

فیلد `image` را در `scripts/k8s/manifests/deployment.yaml` ویرایش کنید:

```yaml
image: ghcr.io/openclaw/openclaw:latest # or pin to a specific version from https://github.com/openclaw/openclaw/releases
```

### در معرض قرار دادن فراتر از port-forward

manifestهای پیش‌فرض، Gateway را داخل pod به loopback متصل می‌کنند. این با `kubectl port-forward` کار می‌کند، اما با Kubernetes `Service` یا مسیر Ingress که باید به IP مربوط به pod برسد، کار نمی‌کند.

اگر می‌خواهید Gateway را از طریق Ingress یا load balancer در معرض قرار دهید:

- bind مربوط به Gateway را در `scripts/k8s/manifests/configmap.yaml` از `loopback` به یک bind غیر loopback تغییر دهید که با مدل استقرار شما سازگار باشد
- احراز هویت Gateway را فعال نگه دارید و از یک نقطهٔ ورود مناسب با خاتمهٔ TLS استفاده کنید
- Control UI را برای دسترسی از راه دور با استفاده از مدل امنیت وب پشتیبانی‌شده پیکربندی کنید (برای مثال HTTPS/Tailscale Serve و originهای مجاز صریح در صورت نیاز)

## استقرار دوباره

```bash
./scripts/k8s/deploy.sh
```

این کار همهٔ manifestها را اعمال می‌کند و pod را بازراه‌اندازی می‌کند تا هر تغییر پیکربندی یا راز اعمال شود.

## حذف استقرار

```bash
./scripts/k8s/deploy.sh --delete
```

این فرمان namespace و همهٔ منابع داخل آن، از جمله PVC، را حذف می‌کند.

## نکات معماری

- Gateway به‌صورت پیش‌فرض داخل pod به loopback متصل می‌شود، بنابراین راه‌اندازی ارائه‌شده برای `kubectl port-forward` است
- هیچ منبعی در سطح کلاستر وجود ندارد — همه‌چیز در یک namespace واحد قرار دارد
- امنیت: `readOnlyRootFilesystem`، قابلیت‌های `drop: ALL`، کاربر غیر root (UID 1000)
- پیکربندی پیش‌فرض، Control UI را روی مسیر امن‌تر دسترسی محلی نگه می‌دارد: bind به loopback همراه با `kubectl port-forward` به `http://127.0.0.1:18789`
- اگر فراتر از دسترسی localhost می‌روید، از مدل راه دور پشتیبانی‌شده استفاده کنید: HTTPS/Tailscale به‌همراه bind مناسب Gateway و تنظیمات origin در Control UI
- رازها در یک دایرکتوری موقت تولید و مستقیم روی کلاستر اعمال می‌شوند — هیچ مادهٔ محرمانه‌ای در checkout مخزن نوشته نمی‌شود

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
- [Docker VM runtime](/fa/install/docker-vm-runtime)
- [نمای کلی نصب](/fa/install)
