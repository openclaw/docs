---
read_when:
    - تحديث تعيينات معرّفات طرازات الأجهزة أو ملفات NOTICE/license
    - تغيير طريقة عرض واجهة المستخدم الخاصة بـ Instances لأسماء الأجهزة
summary: كيف يضمّن OpenClaw معرّفات طرازات أجهزة Apple للحصول على أسماء سهلة الاستخدام في تطبيق macOS.
title: قاعدة بيانات طرازات الأجهزة
x-i18n:
    generated_at: "2026-04-24T08:02:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e892bf439a878b737d2322188acec850aa5bda2e7051ee0481850c921c69facb
    source_path: reference/device-models.md
    workflow: 15
---

# قاعدة بيانات طرازات الأجهزة (الأسماء السهلة الاستخدام)

يعرض التطبيق المرافق لنظام macOS أسماء سهلة الاستخدام لطرازات أجهزة Apple في واجهة **Instances** من خلال تعيين معرّفات طرازات Apple (مثل `iPad16,6` و`Mac16,6`) إلى أسماء مقروءة للبشر.

يتم تضمين التعيين على شكل JSON ضمن:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## مصدر البيانات

نحن نضمّن حاليًا هذا التعيين من المستودع المرخّص بترخيص MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

وللحفاظ على حتمية عمليات البناء، تُثبَّت ملفات JSON على التزامات upstream محددة (ومسجلة في `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## تحديث قاعدة البيانات

1. اختر التزامات upstream التي تريد تثبيتها عليها (واحد لـ iOS وواحد لـ macOS).
2. حدّث قيم تجزئة الالتزامات في `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. أعد تنزيل ملفات JSON مع تثبيتها على تلك الالتزامات:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. تأكد من أن `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` لا يزال مطابقًا للمصدر upstream (واستبدله إذا تغيّر ترخيص upstream).
5. تحقّق من أن تطبيق macOS يُبنى بشكل نظيف (من دون تحذيرات):

```bash
swift build --package-path apps/macos
```

## ذو صلة

- [Nodes](/ar/nodes)
- [استكشاف أخطاء Node وإصلاحها](/ar/nodes/troubleshooting)
