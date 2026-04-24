---
read_when:
    - تريد تشغيل OpenClaw على عنقود Kubernetes
    - تريد اختبار OpenClaw في بيئة Kubernetes
summary: انشر OpenClaw Gateway على عنقود Kubernetes باستخدام Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-04-24T07:49:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f45e165569332277d1108cd34a4357f03f5a1cbfa93bbbcf478717945627bad
    source_path: install/kubernetes.md
    workflow: 15
---

# OpenClaw على Kubernetes

نقطة بداية دنيا لتشغيل OpenClaw على Kubernetes — وليست عملية نشر جاهزة للإنتاج. وهي تغطي الموارد الأساسية، والمقصود منها أن تُكيَّف مع بيئتك.

## لماذا ليس Helm؟

OpenClaw عبارة عن حاوية واحدة مع بعض ملفات الإعدادات. والتخصيص المثير للاهتمام يكون في محتوى الوكيل (ملفات markdown، وSkills، وتجاوزات الإعدادات)، وليس في قوالب البنية التحتية. ويتولى Kustomize معالجة الطبقات الإضافية من دون عبء Helm chart. وإذا أصبحت عملية النشر لديك أكثر تعقيدًا، فيمكن وضع Helm chart فوق هذه الملفات.

## ما الذي تحتاجه

- عنقود Kubernetes عامل (AKS، EKS، GKE، k3s، kind، OpenShift، إلخ)
- `kubectl` متصل بعنقودك
- مفتاح API لمزوّد نماذج واحد على الأقل

## البدء السريع

```bash
# استبدل ذلك بمزوّدك: ANTHROPIC أو GEMINI أو OPENAI أو OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

استرجع السر المشترك المضبوط لـ Control UI. فهذا النص البرمجي الخاص بالنشر
ينشئ مصادقة بالرمز افتراضيًا:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

ولأغراض التصحيح المحلي، تقوم `./scripts/k8s/deploy.sh --show-token` بطباعة الرمز بعد النشر.

## الاختبار المحلي باستخدام Kind

إذا لم يكن لديك عنقود، فأنشئ واحدًا محليًا باستخدام [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # يكتشف docker أو podman تلقائيًا
./scripts/k8s/create-kind.sh --delete  # إزالة العنقود
```

ثم انشر كالمعتاد باستخدام `./scripts/k8s/deploy.sh`.

## خطوة بخطوة

### 1) النشر

**الخيار A** — مفتاح API في البيئة (خطوة واحدة):

```bash
# استبدل ذلك بمزوّدك: ANTHROPIC أو GEMINI أو OPENAI أو OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

ينشئ النص البرمجي Kubernetes Secret بمفتاح API ورمز gateway مُولَّد تلقائيًا، ثم ينشر. وإذا كان Secret موجودًا بالفعل، فإنه يحافظ على رمز gateway الحالي وأي مفاتيح مزوّدين لا يتم تغييرها.

**الخيار B** — أنشئ السر بشكل منفصل:

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
Namespace: openclaw (يمكن ضبطه عبر OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Pod واحدة، init container + gateway
├── Service/openclaw           # ClusterIP على المنفذ 18789
├── PersistentVolumeClaim      # 10Gi لحالة الوكيل والإعدادات
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # رمز Gateway + مفاتيح API
```

## التخصيص

### تعليمات الوكيل

حرر `AGENTS.md` في `scripts/k8s/manifests/configmap.yaml` ثم أعد النشر:

```bash
./scripts/k8s/deploy.sh
```

### إعدادات Gateway

حرر `openclaw.json` في `scripts/k8s/manifests/configmap.yaml`. راجع [إعدادات Gateway](/ar/gateway/configuration) للحصول على المرجع الكامل.

### إضافة مزوّدين

أعد التشغيل مع تصدير مفاتيح إضافية:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

تبقى مفاتيح المزوّد الحالية في Secret ما لم تقم بالكتابة فوقها.

أو قم بترقيع Secret مباشرةً:

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

حرر الحقل `image` في `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # أو ثبّته على إصدار محدد من https://github.com/openclaw/openclaw/releases
```

### الكشف خارج port-forward

تربط الملفات الافتراضية gateway على local loopback داخل pod. ويعمل ذلك مع `kubectl port-forward`، لكنه لا يعمل مع Kubernetes `Service` أو مسار Ingress يحتاج إلى الوصول إلى IP الخاص بالـ pod.

إذا كنت تريد كشف gateway عبر Ingress أو موازن تحميل:

- غيّر ربط gateway في `scripts/k8s/manifests/configmap.yaml` من `loopback` إلى ربط غير local loopback يطابق نموذج النشر لديك
- أبقِ مصادقة gateway مفعلة واستخدم نقطة دخول مناسبة مع إنهاء TLS
- اضبط Control UI للوصول البعيد باستخدام نموذج أمان الويب المدعوم (على سبيل المثال HTTPS/Tailscale Serve وقائمة السماح الصريحة للأصول عند الحاجة)

## إعادة النشر

```bash
./scripts/k8s/deploy.sh
```

يطبّق هذا جميع الملفات ويعيد تشغيل pod لالتقاط أي تغييرات في الإعدادات أو الأسرار.

## الإزالة

```bash
./scripts/k8s/deploy.sh --delete
```

يؤدي هذا إلى حذف مساحة الاسم وجميع الموارد الموجودة فيها، بما في ذلك PVC.

## ملاحظات معمارية

- ترتبط gateway على local loopback داخل pod افتراضيًا، لذا فإن الإعداد المضمن مخصص لـ `kubectl port-forward`
- لا توجد موارد على مستوى العنقود — كل شيء يعيش داخل مساحة أسماء واحدة
- الأمان: `readOnlyRootFilesystem`، وإسقاط قدرات `drop: ALL`، ومستخدم غير جذري (UID 1000)
- يحافظ الإعداد الافتراضي على Control UI ضمن مسار الوصول المحلي الأكثر أمانًا: ربط loopback مع `kubectl port-forward` إلى `http://127.0.0.1:18789`
- إذا تجاوزت الوصول عبر localhost، فاستخدم النموذج البعيد المدعوم: HTTPS/Tailscale مع ربط gateway المناسب وإعدادات أصل Control UI
- يتم توليد الأسرار في دليل مؤقت وتطبيقها مباشرةً على العنقود — ولا تُكتب أي مادة سرية إلى نسخة المستودع

## بنية الملفات

```
scripts/k8s/
├── deploy.sh                   # ينشئ مساحة الاسم + السر، وينشر عبر kustomize
├── create-kind.sh              # عنقود Kind محلي (يكتشف docker/podman تلقائيًا)
└── manifests/
    ├── kustomization.yaml      # أساس Kustomize
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # مواصفة Pod مع تقوية أمنية
    ├── pvc.yaml                # تخزين دائم بحجم 10Gi
    └── service.yaml            # ClusterIP على 18789
```

## ذو صلة

- [Docker](/ar/install/docker)
- [Docker VM runtime](/ar/install/docker-vm-runtime)
- [نظرة عامة على التثبيت](/ar/install)
