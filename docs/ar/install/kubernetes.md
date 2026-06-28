---
read_when:
    - تريد تشغيل OpenClaw على عنقود Kubernetes
    - تريد اختبار OpenClaw في بيئة Kubernetes
summary: انشر OpenClaw Gateway إلى مجموعة Kubernetes باستخدام Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-06-28T20:44:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a38c2754b4a5267e79854958a252b2e4bc9811da191d8ccf3ac597534cc8e7a
    source_path: install/kubernetes.md
    workflow: 16
---

نقطة انطلاق بسيطة لتشغيل OpenClaw على Kubernetes، وليست نشرًا جاهزًا للإنتاج. تغطي الموارد الأساسية، والمقصود منها أن تُكيَّف مع بيئتك.

## لماذا ليس Helm؟

OpenClaw حاوية واحدة مع بعض ملفات الإعداد. التخصيص المهم يكون في محتوى الوكلاء (ملفات Markdown وSkills وتجاوزات الإعداد)، وليس في قوالب البنية التحتية. يتعامل Kustomize مع الطبقات دون عبء مخطط Helm. إذا أصبح النشر لديك أكثر تعقيدًا، يمكن وضع مخطط Helm فوق هذه البيانات التعريفية.

## ما تحتاجه

- عنقود Kubernetes قيد التشغيل (AKS أو EKS أو GKE أو k3s أو kind أو OpenShift، وغير ذلك)
- `kubectl` متصل بعنقودك
- مفتاح API لمزود نماذج واحد على الأقل

## البدء السريع

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

استرد السر المشترك المكوَّن لواجهة التحكم. ينشئ هذا النص البرمجي للنشر
مصادقة رمزية افتراضيًا:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

للتنقيح المحلي، يطبع `./scripts/k8s/deploy.sh --show-token` الرمز بعد النشر.

## الاختبار المحلي باستخدام Kind

إذا لم يكن لديك عنقود، فأنشئ واحدًا محليًا باستخدام [Kind](https://kind.sigs.k8s.io/):

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

ينشئ النص البرمجي Kubernetes Secret يحتوي على مفتاح API ورمز Gateway مولَّد تلقائيًا، ثم ينشر. إذا كان Secret موجودًا بالفعل، فإنه يحافظ على رمز Gateway الحالي وأي مفاتيح مزودين لا يجري تغييرها.

**الخيار ب** — إنشاء السر بشكل منفصل:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

استخدم `--show-token` مع أي من الأمرين إذا أردت طباعة الرمز إلى stdout للاختبار المحلي.

### 2) الوصول إلى Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## ما الذي يُنشر

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

حرر `AGENTS.md` في `scripts/k8s/manifests/configmap.yaml` ثم أعد النشر:

```bash
./scripts/k8s/deploy.sh
```

### إعداد Gateway

حرر `openclaw.json` في `scripts/k8s/manifests/configmap.yaml`. راجع [إعداد Gateway](/ar/gateway/configuration) للمرجع الكامل.

### إضافة مزودين

أعد التشغيل مع تصدير مفاتيح إضافية:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

تبقى مفاتيح المزودين الحالية في Secret ما لم تستبدلها.

أو حدّث Secret مباشرة:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### مساحة أسماء مخصصة

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### صورة مخصصة

حرر حقل `image` في `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # primary; official Docker Hub mirror: openclaw/openclaw:latest
```

### الإتاحة إلى ما بعد port-forward

تربط البيانات التعريفية الافتراضية Gateway بعنوان loopback داخل الحجرة. يعمل ذلك مع `kubectl port-forward`، لكنه لا يعمل مع Kubernetes `Service` أو مسار Ingress يحتاج إلى الوصول إلى عنوان IP الخاص بالحجرة.

إذا أردت إتاحة Gateway عبر Ingress أو موازن تحميل:

- غيّر ربط Gateway في `scripts/k8s/manifests/configmap.yaml` من `loopback` إلى ربط غير loopback يطابق نموذج النشر لديك
- أبقِ مصادقة Gateway مفعّلة واستخدم نقطة دخول مناسبة تنهي TLS
- اضبط واجهة التحكم للوصول البعيد باستخدام نموذج أمان الويب المدعوم (مثل HTTPS/Tailscale Serve والأصول المسموح بها صراحة عند الحاجة)

## إعادة النشر

```bash
./scripts/k8s/deploy.sh
```

يطبق هذا كل البيانات التعريفية ويعيد تشغيل الحجرة لالتقاط أي تغييرات في الإعداد أو الأسرار.

## الإزالة

```bash
./scripts/k8s/deploy.sh --delete
```

يحذف هذا مساحة الأسماء وكل الموارد الموجودة فيها، بما في ذلك PVC.

## ملاحظات معمارية

- يرتبط Gateway بعنوان loopback داخل الحجرة افتراضيًا، لذلك فإن الإعداد المضمّن مخصص لـ `kubectl port-forward`
- لا توجد موارد على مستوى العنقود؛ كل شيء موجود في مساحة أسماء واحدة
- الأمان: إمكانات `readOnlyRootFilesystem` و`drop: ALL` ومستخدم غير root (UID 1000)
- يحافظ الإعداد الافتراضي على واجهة التحكم في مسار الوصول المحلي الأكثر أمانًا: ربط loopback بالإضافة إلى `kubectl port-forward` إلى `http://127.0.0.1:18789`
- إذا تجاوزت الوصول عبر localhost، فاستخدم النموذج البعيد المدعوم: HTTPS/Tailscale مع ربط Gateway المناسب وإعدادات أصل واجهة التحكم
- تُنشأ الأسرار في دليل مؤقت وتُطبق مباشرة على العنقود؛ لا تُكتب أي مواد سرية إلى نسخة المستودع المحلية

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
