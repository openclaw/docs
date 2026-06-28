---
read_when:
    - تريد تشغيل OpenClaw على عنقود Kubernetes
    - تريد اختبار OpenClaw في بيئة Kubernetes
summary: انشر OpenClaw Gateway إلى عنقود Kubernetes باستخدام Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-05-06T08:01:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: c38e42ae9121864333574b668d95f4d1112cada30cd525613d2371f176de4505
    source_path: install/kubernetes.md
    workflow: 16
    postprocess_version: locale-links-v1
---

نقطة بداية بسيطة لتشغيل OpenClaw على Kubernetes، وليست نشراً جاهزاً للإنتاج. تغطي الموارد الأساسية ويُقصد بها أن تُكيَّف مع بيئتك.

## لماذا ليس Helm؟

OpenClaw عبارة عن حاوية واحدة مع بعض ملفات الإعداد. يكون التخصيص المهم في محتوى الوكيل (ملفات Markdown، وSkills، وتجاوزات الإعداد)، وليس في قوالب البنية التحتية. يتعامل Kustomize مع التراكبات دون عبء مخطط Helm. إذا أصبح النشر لديك أكثر تعقيداً، فيمكن وضع مخطط Helm فوق هذه البيانات التعريفية.

## ما تحتاجه

- عنقود Kubernetes قيد التشغيل (AKS، EKS، GKE، k3s، kind، OpenShift، إلخ)
- `kubectl` متصل بالعنقود لديك
- مفتاح API لموفر نماذج واحد على الأقل

## البدء السريع

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

استرجع السر المشترك المُعدّ لواجهة التحكم. ينشئ سكربت النشر هذا
مصادقة رمزية بشكل افتراضي:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

للتصحيح المحلي، يطبع `./scripts/k8s/deploy.sh --show-token` الرمز بعد النشر.

## الاختبار المحلي باستخدام Kind

إذا لم يكن لديك عنقود، فأنشئ واحداً محلياً باستخدام [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

ثم انشر كالمعتاد باستخدام `./scripts/k8s/deploy.sh`.

## خطوة بخطوة

### 1) النشر

**الخيار أ** — مفتاح API في البيئة (خطوة واحدة):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

ينشئ السكربت Kubernetes Secret يحتوي على مفتاح API ورمز gateway مُولّد تلقائياً، ثم ينشر. إذا كان Secret موجوداً بالفعل، فإنه يحتفظ برمز gateway الحالي وأي مفاتيح موفرين لا يتم تغييرها.

**الخيار ب** — إنشاء السر بشكل منفصل:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

استخدم `--show-token` مع أي من الأمرين إذا كنت تريد طباعة الرمز إلى stdout للاختبار المحلي.

### 2) الوصول إلى gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## ما الذي يتم نشره

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## التخصيص

### تعليمات الوكيل

حرّر `AGENTS.md` في `scripts/k8s/manifests/configmap.yaml` وأعد النشر:

```bash
./scripts/k8s/deploy.sh
```

### إعداد gateway

حرّر `openclaw.json` في `scripts/k8s/manifests/configmap.yaml`. راجع [إعداد gateway](/ar/gateway/configuration) للمرجع الكامل.

### إضافة موفرين

أعد التشغيل مع تصدير مفاتيح إضافية:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

تبقى مفاتيح الموفرين الحالية في Secret ما لم تستبدلها.

أو عدّل Secret مباشرة:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### مساحة اسم مخصصة

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### صورة مخصصة

حرّر الحقل `image` في `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # or pin to a specific version from https://github.com/openclaw/openclaw/releases
```

### الإتاحة إلى ما بعد port-forward

تربط البيانات التعريفية الافتراضية gateway بـ loopback داخل الحجرة. يعمل ذلك مع `kubectl port-forward`، لكنه لا يعمل مع Kubernetes `Service` أو مسار Ingress يحتاج إلى الوصول إلى عنوان IP الخاص بالحجرة.

إذا كنت تريد إتاحة gateway عبر Ingress أو موزع تحميل:

- غيّر ربط gateway في `scripts/k8s/manifests/configmap.yaml` من `loopback` إلى ربط ليس loopback ويطابق نموذج النشر لديك
- أبقِ مصادقة gateway مفعّلة واستخدم نقطة دخول مناسبة منتهية بـ TLS
- اضبط واجهة التحكم للوصول البعيد باستخدام نموذج أمان الويب المدعوم (على سبيل المثال HTTPS/Tailscale Serve والأصول المسموح بها صراحةً عند الحاجة)

## إعادة النشر

```bash
./scripts/k8s/deploy.sh
```

يطبّق هذا جميع البيانات التعريفية ويعيد تشغيل الحجرة لالتقاط أي تغييرات في الإعداد أو الأسرار.

## التفكيك

```bash
./scripts/k8s/deploy.sh --delete
```

يحذف هذا مساحة الاسم وجميع الموارد الموجودة فيها، بما في ذلك PVC.

## ملاحظات المعمارية

- يرتبط gateway بـ loopback داخل الحجرة افتراضياً، لذا فإن الإعداد المضمّن مخصص لـ `kubectl port-forward`
- لا توجد موارد على مستوى العنقود، فكل شيء موجود في مساحة اسم واحدة
- الأمان: `readOnlyRootFilesystem`، وإمكانات `drop: ALL`، ومستخدم غير جذر (UID 1000)
- يبقي الإعداد الافتراضي واجهة التحكم على مسار الوصول المحلي الأكثر أماناً: ربط loopback مع `kubectl port-forward` إلى `http://127.0.0.1:18789`
- إذا انتقلت إلى ما بعد الوصول عبر localhost، فاستخدم النموذج البعيد المدعوم: HTTPS/Tailscale مع ربط gateway المناسب وإعدادات أصل واجهة التحكم
- تُنشأ الأسرار في دليل مؤقت وتُطبّق مباشرة على العنقود، ولا تُكتب أي مواد سرية إلى نسخة المستودع

## بنية الملفات

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

## ذو صلة

- [Docker](/ar/install/docker)
- [وقت تشغيل Docker VM](/ar/install/docker-vm-runtime)
- [نظرة عامة على التثبيت](/ar/install)
