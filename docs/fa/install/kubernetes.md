---
read_when:
    - می‌خواهید OpenClaw را روی یک خوشهٔ Kubernetes اجرا کنید
    - می‌خواهید OpenClaw را در یک محیط Kubernetes آزمایش کنید
summary: Gateway ‏OpenClaw را با Kustomize در یک کلاستر Kubernetes مستقر کنید
title: کوبرنتیز
x-i18n:
    generated_at: "2026-07-12T10:11:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c05eb0eb923fa1f515aca1f6dcb6073aba69af0bdf30233243027edfedd45a39
    source_path: install/kubernetes.md
    workflow: 16
---

نقطه شروعی حداقلی برای اجرای OpenClaw روی Kubernetes است، نه استقراری آماده برای محیط تولید. این راهنما منابع اصلی را پوشش می‌دهد و برای سازگار شدن با محیط شما در نظر گرفته شده است.

## چرا Helm نه

OpenClaw یک کانتینر واحد با چند فایل پیکربندی است. سفارشی‌سازی مهم در محتوای عامل (فایل‌های Markdown، Skills و بازنویسی‌های پیکربندی) انجام می‌شود، نه در قالب‌سازی زیرساخت. Kustomize هم‌پوشانی‌ها را بدون سربار یک نمودار Helm مدیریت می‌کند. اگر استقرار شما پیچیده‌تر شد، یک نمودار Helm روی این مانیفست‌ها قرار دهید.

## آنچه نیاز دارید

- یک کلاستر Kubernetes در حال اجرا (AKS، EKS، GKE، k3s، kind، OpenShift و غیره)
- `kubectl` متصل به کلاستر شما
- یک کلید API برای دست‌کم یک ارائه‌دهنده مدل

## شروع سریع

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

`deploy.sh` به‌طور پیش‌فرض احراز هویت مبتنی بر توکن ایجاد می‌کند. توکن تولیدشده Gateway را برای رابط کنترل دریافت کنید:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

برای اشکال‌زدایی محلی، `./scripts/k8s/deploy.sh --show-token` پس از استقرار توکن را چاپ می‌کند.

## آزمایش محلی با Kind

اگر کلاستر ندارید، با [Kind](https://kind.sigs.k8s.io/) یک کلاستر محلی ایجاد کنید:

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

سپس طبق روال معمول با `./scripts/k8s/deploy.sh` استقرار را انجام دهید.

## گام‌به‌گام

### ۱) استقرار

**گزینه الف: کلید API در محیط (یک مرحله)**

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

اسکریپت یک Secret در Kubernetes شامل کلید API و یک توکن Gateway تولیدشده به‌صورت خودکار ایجاد می‌کند و سپس استقرار را انجام می‌دهد. اگر Secret از قبل وجود داشته باشد، توکن فعلی Gateway و کلیدهای ارائه‌دهندگانی را که تغییر نمی‌کنند حفظ می‌کند.

**گزینه ب: ایجاد Secret به‌صورت جداگانه**

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

برای آزمایش محلی، `--show-token` را به هر یک از فرمان‌ها اضافه کنید تا توکن در خروجی استاندارد چاپ شود.

### ۲) دسترسی به Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## مواردی که مستقر می‌شوند

```text
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## سفارشی‌سازی

### دستورالعمل‌های عامل

فایل `AGENTS.md` را در `scripts/k8s/manifests/configmap.yaml` ویرایش و دوباره مستقر کنید:

```bash
./scripts/k8s/deploy.sh
```

### پیکربندی Gateway

فایل `openclaw.json` را در `scripts/k8s/manifests/configmap.yaml` ویرایش کنید. برای مرجع کامل، به [پیکربندی Gateway](/fa/gateway/configuration) مراجعه کنید.

### افزودن ارائه‌دهندگان

با صادر کردن کلیدهای بیشتر، دوباره اجرا کنید:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

کلیدهای ارائه‌دهندگان موجود در Secret باقی می‌مانند، مگر اینکه آن‌ها را بازنویسی کنید.

یا Secret را مستقیماً وصله کنید:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### فضای نام سفارشی

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### ایمیج سفارشی

فیلد `image` را در `scripts/k8s/manifests/deployment.yaml` ویرایش کنید:

```yaml
image: ghcr.io/openclaw/openclaw:slim # primary; official Docker Hub mirror: openclaw/openclaw
```

### در معرض دسترسی قرار دادن فراتر از هدایت پورت

مانیفست‌های پیش‌فرض، Gateway را داخل پاد به local loopback متصل می‌کنند. این روش با `kubectl port-forward` کار می‌کند، اما برای یک `Service` در Kubernetes یا مسیر Ingress که باید مستقیماً به IP پاد دسترسی داشته باشد، مناسب نیست.

برای در معرض دسترسی قرار دادن Gateway از طریق Ingress یا متعادل‌کننده بار:

- اتصال Gateway را در `scripts/k8s/manifests/configmap.yaml` از `loopback` به اتصالی غیر از local loopback تغییر دهید که با مدل استقرار شما مطابقت داشته باشد.
- احراز هویت Gateway را فعال نگه دارید و از یک نقطه ورود مناسب با خاتمه TLS استفاده کنید.
- رابط کنترل را با استفاده از مدل امنیتی وب پشتیبانی‌شده برای دسترسی راه دور پیکربندی کنید (برای مثال HTTPS/Tailscale Serve و در صورت نیاز، مبدأهای مجاز صریح).

## استقرار مجدد

```bash
./scripts/k8s/deploy.sh
```

این فرمان همه مانیفست‌ها را اعمال و پاد را راه‌اندازی مجدد می‌کند تا هرگونه تغییر در پیکربندی یا Secret اعمال شود.

## برچیدن

```bash
./scripts/k8s/deploy.sh --delete
```

این فرمان فضای نام و همه منابع داخل آن، از جمله PVC را حذف می‌کند.

## نکات معماری

- Gateway به‌طور پیش‌فرض داخل پاد به local loopback متصل می‌شود؛ بنابراین، راه‌اندازی ارائه‌شده برای `kubectl port-forward` است.
- هیچ منبعی در سطح کلاستر وجود ندارد؛ همه‌چیز در یک فضای نام واحد قرار دارد.
- مقاوم‌سازی امنیتی: `readOnlyRootFilesystem`، قابلیت‌های `drop: ALL` و کاربر غیرریشه (UID 1000).
- پیکربندی پیش‌فرض، رابط کنترل را در مسیر امن‌تر دسترسی محلی نگه می‌دارد: اتصال local loopback به‌همراه `kubectl port-forward` به `http://127.0.0.1:18789`.
- اگر از دسترسی localhost فراتر می‌روید، از مدل راه دور پشتیبانی‌شده استفاده کنید: HTTPS/Tailscale به‌همراه اتصال مناسب Gateway و تنظیمات مبدأ رابط کنترل.
- Secretها در یک پوشه موقت تولید و مستقیماً روی کلاستر اعمال می‌شوند؛ هیچ داده محرمانه‌ای در نسخه کاری مخزن نوشته نمی‌شود.

## ساختار فایل‌ها

```text
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
- [محیط اجرای ماشین مجازی Docker](/fa/install/docker-vm-runtime)
- [نمای کلی نصب](/fa/install)
