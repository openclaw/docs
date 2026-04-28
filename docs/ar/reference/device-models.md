---
read_when:
    - تحديث تعيينات معرّفات طرازات الأجهزة أو ملفات NOTICE/license
    - تغيير طريقة عرض واجهة مستخدم Instances لأسماء الأجهزة
summary: كيف يضمّن OpenClaw معرّفات طرازات أجهزة Apple للحصول على أسماء ودية في تطبيق macOS.
title: قاعدة بيانات طرازات الأجهزة
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-25T13:57:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: f20e035f787ba7d9bb48d2a18263679d20b295e12ffb263a63c3a0ef72312d34
    source_path: reference/device-models.md
    workflow: 15
---

يعرض التطبيق المساعد على macOS أسماءً ودية لطرازات أجهزة Apple في واجهة مستخدم **Instances** من خلال تعيين معرّفات طرازات Apple (مثل `iPad16,6` و`Mac16,6`) إلى أسماء مقروءة للبشر.

يتم تضمين هذا التعيين كبنية JSON ضمن:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## مصدر البيانات

نقوم حاليًا بتضمين التعيين من المستودع المرخّص بترخيص MIT التالي:

- `kyle-seongwoo-jun/apple-device-identifiers`

وللحفاظ على حتمية الإصدارات، يتم تثبيت ملفات JSON على عمليات التزام upstream محددة
(مُسجّلة في `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## تحديث قاعدة البيانات

1. اختر عمليات التزام upstream التي تريد تثبيتها (واحدة لـ iOS وواحدة لـ macOS).
2. حدّث تجزئات عمليات الالتزام في `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. أعد تنزيل ملفات JSON مع تثبيتها على تلك العمليات:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. تأكد من أن `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` لا يزال مطابقًا لـ upstream (واستبدله إذا تغيّر ترخيص upstream).
5. تحقّق من أن تطبيق macOS يُبنى بشكل نظيف (من دون تحذيرات):

```bash
swift build --package-path apps/macos
```

## ذو صلة

- [Nodes](/ar/nodes)
- [استكشاف أخطاء Node وإصلاحها](/ar/nodes/troubleshooting)
