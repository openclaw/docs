---
read_when:
    - می‌خواهید OpenClaw را روی یک کلاستر Kubernetes اجرا کنید
    - می‌خواهید OpenClaw را در یک محیط Kubernetes آزمایش کنید
summary: OpenClaw Gateway را با Kustomize در یک خوشه Kubernetes مستقر کنید
title: Kubernetes
x-i18n:
    generated_at: "2026-05-06T09:26:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: c38e42ae9121864333574b668d95f4d1112cada30cd525613d2371f176de4505
    source_path: install/kubernetes.md
    workflow: 16
    postprocess_version: locale-links-v1
---

یک نقطه شروع حداقلی برای اجرای OpenClaw روی Kubernetes؛ نه یک استقرار آماده تولید. این راهنما منابع اصلی را پوشش می‌دهد و قرار است با محیط شما تطبیق داده شود.

## چرا Helm نه؟

OpenClaw یک کانتینر واحد با چند فایل پیکربندی است. سفارشی‌سازی مهم در محتوای عامل‌ها است (فایل‌های markdown، skills، بازنویسی‌های پیکربندی)، نه قالب‌سازی زیرساخت. Kustomize بدون سربار یک Helm chart، overlayها را مدیریت می‌کند. اگر استقرار شما پیچیده‌تر شود، می‌توان یک Helm chart را روی این manifestها لایه‌بندی کرد.

## آنچه نیاز دارید

- یک کلاستر Kubernetes در حال اجرا (AKS، EKS، GKE، k3s، kind، OpenShift، و غیره)
- `kubectl` متصل به کلاستر شما
- یک کلید API برای حداقل یک ارائه‌دهنده مدل

## شروع سریع

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

رمز مشترک پیکربندی‌شده برای رابط کاربری کنترل را بازیابی کنید. این اسکریپت استقرار
به‌طور پیش‌فرض احراز هویت توکنی ایجاد می‌کند:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

برای اشکال‌زدایی محلی، `./scripts/k8s/deploy.sh --show-token` پس از استقرار، توکن را چاپ می‌کند.

## آزمایش محلی با Kind

اگر کلاستر ندارید، یکی را به‌صورت محلی با [Kind](https://kind.sigs.k8s.io/) ایجاد کنید:

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

سپس طبق معمول با `./scripts/k8s/deploy.sh` مستقر کنید.

## گام‌به‌گام

### 1) استقرار

**گزینه A** — کلید API در محیط (یک مرحله):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

اسکریپت یک Kubernetes Secret با کلید API و یک توکن Gateway تولیدشده به‌صورت خودکار ایجاد می‌کند، سپس مستقر می‌کند. اگر Secret از قبل وجود داشته باشد، توکن Gateway فعلی و هر کلید ارائه‌دهنده‌ای را که تغییر نمی‌کند حفظ می‌کند.

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

## چه چیزهایی مستقر می‌شوند

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

`AGENTS.md` را در `scripts/k8s/manifests/configmap.yaml` ویرایش کنید و دوباره مستقر کنید:

```bash
./scripts/k8s/deploy.sh
```

### پیکربندی Gateway

`openclaw.json` را در `scripts/k8s/manifests/configmap.yaml` ویرایش کنید. برای مرجع کامل، [پیکربندی Gateway](/fa/gateway/configuration) را ببینید.

### افزودن ارائه‌دهنده‌ها

با کلیدهای اضافه exportشده دوباره اجرا کنید:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

کلیدهای ارائه‌دهنده موجود در Secret باقی می‌مانند، مگر اینکه آن‌ها را بازنویسی کنید.

یا Secret را مستقیماً patch کنید:

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

### در دسترس قرار دادن فراتر از port-forward

manifestهای پیش‌فرض، Gateway را داخل pod به loopback متصل می‌کنند. این با `kubectl port-forward` کار می‌کند، اما با یک Kubernetes `Service` یا مسیر Ingress که باید به IP مربوط به pod برسد کار نمی‌کند.

اگر می‌خواهید Gateway را از طریق Ingress یا load balancer در دسترس قرار دهید:

- اتصال Gateway را در `scripts/k8s/manifests/configmap.yaml` از `loopback` به یک اتصال غیرلوپ‌بک که با مدل استقرار شما سازگار است تغییر دهید
- احراز هویت Gateway را فعال نگه دارید و از یک entrypoint مناسب با TLS-terminated استفاده کنید
- رابط کاربری کنترل را برای دسترسی راه دور با استفاده از مدل امنیت وب پشتیبانی‌شده پیکربندی کنید (برای مثال HTTPS/Tailscale Serve و originهای مجاز صریح در صورت نیاز)

## استقرار دوباره

```bash
./scripts/k8s/deploy.sh
```

این کار همه manifestها را اعمال می‌کند و pod را restart می‌کند تا هرگونه تغییر پیکربندی یا secret اعمال شود.

## حذف استقرار

```bash
./scripts/k8s/deploy.sh --delete
```

این فرمان namespace و همه منابع داخل آن، از جمله PVC، را حذف می‌کند.

## نکات معماری

- Gateway به‌طور پیش‌فرض داخل pod به loopback متصل می‌شود، بنابراین راه‌اندازی ارائه‌شده برای `kubectl port-forward` است
- هیچ منبع cluster-scoped وجود ندارد؛ همه‌چیز در یک namespace واحد قرار دارد
- امنیت: `readOnlyRootFilesystem`، قابلیت‌های `drop: ALL`، کاربر غیر root (UID 1000)
- پیکربندی پیش‌فرض، رابط کاربری کنترل را روی مسیر دسترسی محلی ایمن‌تر نگه می‌دارد: اتصال loopback به‌همراه `kubectl port-forward` به `http://127.0.0.1:18789`
- اگر از دسترسی localhost فراتر می‌روید، از مدل راه دور پشتیبانی‌شده استفاده کنید: HTTPS/Tailscale به‌همراه اتصال مناسب Gateway و تنظیمات origin رابط کاربری کنترل
- Secretها در یک دایرکتوری موقت تولید و مستقیماً روی کلاستر اعمال می‌شوند؛ هیچ محتوای secret در checkout مخزن نوشته نمی‌شود

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
- [زمان اجرای ماشین مجازی Docker](/fa/install/docker-vm-runtime)
- [نمای کلی نصب](/fa/install)
