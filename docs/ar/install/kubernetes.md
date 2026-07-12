---
read_when:
    - تريد تشغيل OpenClaw على مجموعة Kubernetes
    - تريد اختبار OpenClaw في بيئة Kubernetes
summary: انشر OpenClaw Gateway في مجموعة Kubernetes باستخدام Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-07-12T05:59:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c05eb0eb923fa1f515aca1f6dcb6073aba69af0bdf30233243027edfedd45a39
    source_path: install/kubernetes.md
    workflow: 16
---

نقطة بداية مبسطة لتشغيل OpenClaw على Kubernetes، وليست عملية نشر جاهزة للإنتاج. تغطي الموارد الأساسية، والمقصود تكييفها مع بيئتك.

## لماذا لا نستخدم Helm

OpenClaw عبارة عن حاوية واحدة مع بعض ملفات الإعداد. يكمن التخصيص المهم في محتوى الوكيل (ملفات Markdown وSkills وتجاوزات الإعداد)، وليس في قوالب البنية التحتية. يدير Kustomize التراكبات دون الأعباء الإضافية لمخطط Helm. أضف مخطط Helm فوق هذه البيانات التعريفية إذا أصبحت عملية النشر لديك أكثر تعقيدًا.

## ما تحتاج إليه

- مجموعة Kubernetes قيد التشغيل (AKS أو EKS أو GKE أو k3s أو kind أو OpenShift، وما إلى ذلك)
- أداة `kubectl` متصلة بمجموعتك
- مفتاح API لموفر نموذج واحد على الأقل

## البدء السريع

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

ينشئ `deploy.sh` مصادقة بالرمز المميز افتراضيًا. استرجع رمز Gateway المميز المُنشأ لواجهة التحكم:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

لأغراض تصحيح الأخطاء محليًا، يطبع `./scripts/k8s/deploy.sh --show-token` الرمز المميز بعد النشر.

## الاختبار المحلي باستخدام Kind

إذا لم تكن لديك مجموعة، فأنشئ واحدة محليًا باستخدام [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

ثم نفّذ النشر كالمعتاد باستخدام `./scripts/k8s/deploy.sh`.

## خطوة بخطوة

### 1) النشر

**الخيار أ: مفتاح API في البيئة (خطوة واحدة)**

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

ينشئ السكربت Kubernetes Secret يحتوي على مفتاح API ورمز Gateway مميز مُنشأ تلقائيًا، ثم ينفّذ النشر. إذا كان Secret موجودًا بالفعل، فإنه يحتفظ برمز Gateway المميز الحالي وأي مفاتيح لموفري النماذج لا يجري تغييرها.

**الخيار ب: إنشاء السر بشكل منفصل**

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

أضف `--show-token` إلى أي من الأمرين لطباعة الرمز المميز إلى stdout للاختبار المحلي.

### 2) الوصول إلى Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## ما يتم نشره

```text
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## التخصيص

### تعليمات الوكيل

عدّل ملف `AGENTS.md` في `scripts/k8s/manifests/configmap.yaml` وأعد النشر:

```bash
./scripts/k8s/deploy.sh
```

### إعداد Gateway

عدّل `openclaw.json` في `scripts/k8s/manifests/configmap.yaml`. راجع [إعداد Gateway](/ar/gateway/configuration) للاطلاع على المرجع الكامل.

### إضافة موفري نماذج

أعد التشغيل بعد تصدير مفاتيح إضافية:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

تبقى مفاتيح موفري النماذج الحالية في Secret ما لم تستبدلها.

أو حدّث Secret مباشرةً:

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

عدّل حقل `image` في `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:slim # primary; official Docker Hub mirror: openclaw/openclaw
```

### الإتاحة خارج إعادة توجيه المنفذ

تربط البيانات التعريفية الافتراضية Gateway بعنوان local loopback داخل الحاوية. يعمل ذلك مع `kubectl port-forward`، لكنه لا يعمل مع Kubernetes `Service` أو مسار Ingress يحتاج إلى الوصول إلى عنوان IP الخاص بالحاوية مباشرةً.

لإتاحة Gateway عبر Ingress أو موازن تحميل:

- غيّر ربط Gateway في `scripts/k8s/manifests/configmap.yaml` من `loopback` إلى ربط لا يستخدم local loopback ويتوافق مع نموذج النشر لديك.
- أبقِ مصادقة Gateway مفعّلة واستخدم نقطة دخول مناسبة تنهي اتصال TLS.
- اضبط واجهة التحكم للوصول عن بُعد باستخدام نموذج أمان الويب المدعوم (مثل HTTPS/Tailscale Serve وتحديد الأصول المسموح بها صراحةً عند الحاجة).

## إعادة النشر

```bash
./scripts/k8s/deploy.sh
```

يطبّق هذا جميع البيانات التعريفية ويعيد تشغيل الحاوية لالتقاط أي تغييرات في الإعدادات أو الأسرار.

## الإزالة

```bash
./scripts/k8s/deploy.sh --delete
```

يحذف هذا مساحة الأسماء وجميع الموارد الموجودة فيها، بما في ذلك PVC.

## ملاحظات معمارية

- يرتبط Gateway بعنوان local loopback داخل الحاوية افتراضيًا، لذا فإن الإعداد المضمّن مخصص لاستخدام `kubectl port-forward`.
- لا توجد موارد على نطاق المجموعة؛ يوجد كل شيء ضمن مساحة أسماء واحدة.
- تعزيز الأمان: `readOnlyRootFilesystem`، وإمكانات `drop: ALL`، ومستخدم غير جذر (UID 1000).
- يحافظ الإعداد الافتراضي على واجهة التحكم ضمن مسار الوصول المحلي الأكثر أمانًا: ربط local loopback مع `kubectl port-forward` إلى `http://127.0.0.1:18789`.
- إذا انتقلت إلى الوصول من خارج المضيف المحلي، فاستخدم النموذج البعيد المدعوم: HTTPS/Tailscale مع ربط Gateway المناسب وإعدادات أصل واجهة التحكم.
- تُنشأ الأسرار في دليل مؤقت وتُطبّق مباشرةً على المجموعة؛ ولا تُكتب أي مواد سرية في نسخة المستودع المحلية.

## بنية الملفات

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

## ذو صلة

- [Docker](/ar/install/docker)
- [بيئة تشغيل Docker VM](/ar/install/docker-vm-runtime)
- [نظرة عامة على التثبيت](/ar/install)
