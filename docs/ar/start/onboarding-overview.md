---
read_when:
    - اختيار مسار onboarding
    - إعداد بيئة جديدة
sidebarTitle: Onboarding Overview
summary: نظرة عامة على خيارات وتدفقات onboarding في OpenClaw
title: نظرة عامة على onboarding
x-i18n:
    generated_at: "2026-04-24T08:05:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a161e504f94c633873a497dd97c971ebfed6f31ef23a3fe9e85eec5a06d1d97
    source_path: start/onboarding-overview.md
    workflow: 15
---

يمتلك OpenClaw مسارين لـ onboarding. فكلاهما يهيئ المصادقة، وGateway، و
قنوات الدردشة الاختيارية — ويختلفان فقط في كيفية تفاعلك مع الإعداد.

## أي مسار يجب أن أستخدم؟

|                | CLI onboarding                         | onboarding تطبيق macOS      |
| -------------- | -------------------------------------- | ------------------------- |
| **المنصات**  | macOS، Linux، Windows (أصلي أو WSL2) | macOS فقط                |
| **الواجهة**  | معالج في الطرفية                        | واجهة موجهة داخل التطبيق      |
| **الأفضل لـ**   | الخوادم، وبلا واجهة، والتحكم الكامل        | Mac مكتبي، وإعداد مرئي |
| **الأتمتة** | `--non-interactive` للنصوص البرمجية        | يدوي فقط               |
| **الأمر**    | `openclaw onboard`                     | تشغيل التطبيق            |

ينبغي لمعظم المستخدمين البدء بـ **CLI onboarding** — فهي تعمل في كل مكان وتمنحك
أكبر قدر من التحكم.

## ما الذي يهيئه onboarding

بغض النظر عن المسار الذي تختاره، يقوم onboarding بإعداد:

1. **مزوّد النموذج والمصادقة** — مفتاح API، أو OAuth، أو setup token للمزوّد الذي اخترته
2. **مساحة العمل** — دليل لملفات الوكيل، وقوالب bootstrap، والذاكرة
3. **Gateway** — المنفذ، وعنوان الربط، ووضع المصادقة
4. **القنوات** (اختياري) — قنوات الدردشة المدمجة والمجمعة مثل
   BlueBubbles، وDiscord، وFeishu، وGoogle Chat، وMattermost، وMicrosoft Teams،
   وTelegram، وWhatsApp، وغيرها
5. **الخدمة الدائمة** (اختياري) — خدمة خلفية بحيث يبدأ Gateway تلقائيًا

## CLI onboarding

شغّلها في أي طرفية:

```bash
openclaw onboard
```

أضف `--install-daemon` لتثبيت الخدمة الخلفية أيضًا في خطوة واحدة.

المرجع الكامل: [Onboarding (CLI)](/ar/start/wizard)
وثائق أمر CLI: ‏[`openclaw onboard`](/ar/cli/onboard)

## onboarding تطبيق macOS

افتح تطبيق OpenClaw. سيرشدك معالج التشغيل الأول خلال الخطوات نفسها
بواجهة مرئية.

المرجع الكامل: [Onboarding (تطبيق macOS)](/ar/start/onboarding)

## المزوّدون المخصصون أو غير المدرجين

إذا لم يكن مزودك مدرجًا في onboarding، فاختر **Custom Provider** وأدخل:

- وضع توافق API (متوافق مع OpenAI، أو متوافق مع Anthropic، أو اكتشاف تلقائي)
- Base URL ومفتاح API
- معرّف النموذج واسمًا بديلًا اختياريًا

يمكن أن تتعايش عدة نقاط نهاية مخصصة — يحصل كل منها على معرّف نقطة نهاية خاص به.

## ذو صلة

- [البدء](/ar/start/getting-started)
- [مرجع إعداد CLI](/ar/start/wizard-cli-reference)
