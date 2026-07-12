---
read_when:
    - تحديث تعيينات معرّفات طُرز الأجهزة أو ملفات NOTICE/الترخيص
    - تغيير طريقة عرض واجهة المثيلات لأسماء الأجهزة
summary: كيفية تضمين OpenClaw لمعرّفات طرازات أجهزة Apple لعرض أسماء سهلة القراءة في تطبيق macOS.
title: قاعدة بيانات طُرز الأجهزة
x-i18n:
    generated_at: "2026-07-12T06:26:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

تربط واجهة **المثيلات** في التطبيق المرافق لنظام macOS معرّفات طُرز Apple بأسماء سهلة القراءة (`iPad16,6` -> "iPad Pro مقاس 13 بوصة (M4)"، و`Mac16,6` -> "MacBook Pro (مقاس 14 بوصة، 2024)"). وتستخدم `DeviceModelCatalog` أيضًا بادئة المعرّف (مع الرجوع إلى عائلة الجهاز عند تعذّر ذلك) لاختيار رمز SF لكل جهاز.

الملفات الموجودة في `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`:

| الملف                                  | الغرض                                      |
| -------------------------------------- | ------------------------------------------ |
| `ios-device-identifiers.json`          | ربط معرّف iOS/iPadOS بالاسم                |
| `mac-device-identifiers.json`          | ربط معرّف Mac بالاسم                       |
| `NOTICE.md`                            | قيم SHA المثبّتة لالتزامات المصدر الأصلي   |
| `LICENSE.apple-device-identifiers.txt` | ترخيص MIT للمصدر الأصلي                    |

## مصدر البيانات

مضمّنة من مستودع GitHub‏ `kyle-seongwoo-jun/apple-device-identifiers` المرخّص بموجب MIT. تُثبَّت ملفات JSON على قيم SHA للالتزامات المسجّلة في `NOTICE.md` لضمان حتمية عمليات البناء.

## تحديث قاعدة البيانات

1. اختر قيم SHA لالتزامات المصدر الأصلي المراد تثبيتها (واحدة لنظام iOS وأخرى لنظام macOS).
2. حدّث `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` بقيم SHA الجديدة.
3. أعد تنزيل ملفات JSON المثبّتة على تلك الالتزامات:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. تأكّد من أن `LICENSE.apple-device-identifiers.txt` لا يزال مطابقًا للمصدر الأصلي؛ واستبدله إذا تغيّر ترخيص المصدر الأصلي.
5. تحقّق من أن تطبيق macOS يُبنى دون أخطاء:

```bash
swift build --package-path apps/macos
```

## ذو صلة

- [العُقد](/ar/nodes)
- [استكشاف أخطاء Node وإصلاحها](/ar/nodes/troubleshooting)
