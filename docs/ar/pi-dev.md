---
read_when:
    - العمل على شيفرة أو اختبارات تكامل Pi
    - تشغيل تدفقات lint وtypecheck والاختبار المباشر الخاصة بـ Pi
summary: 'سير عمل المطور لتكامل Pi: البناء والاختبار والتحقق المباشر'
title: سير عمل تطوير Pi
x-i18n:
    generated_at: "2026-04-24T07:51:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb626bf21bc731b8ca7bb2a48692e17c8b93f2b6ffa471ed9e70d9c91cd57149
    source_path: pi-dev.md
    workflow: 15
---

يلخص هذا الدليل سير عمل معقولًا للعمل على تكامل Pi في OpenClaw.

## التحقق من الأنواع وLinting

- البوابة المحلية الافتراضية: `pnpm check`
- بوابة البناء: `pnpm build` عندما يمكن أن يؤثر التغيير في مخرجات البناء أو التغليف أو حدود التحميل الكسول/الوحدات
- بوابة الهبوط الكاملة للتغييرات الثقيلة الخاصة بـ Pi: ‏`pnpm check && pnpm test`

## تشغيل اختبارات Pi

شغّل مجموعة الاختبارات المركزة على Pi مباشرة باستخدام Vitest:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

ولتضمين تجربة الموفر المباشرة:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

يغطي هذا مجموعات وحدات Pi الرئيسية:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## الاختبار اليدوي

التدفق الموصى به:

- شغّل gateway في وضع التطوير:
  - `pnpm gateway:dev`
- فعّل الوكيل مباشرة:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- استخدم TUI للتصحيح التفاعلي:
  - `pnpm tui`

بالنسبة إلى سلوك استدعاء الأدوات، اطلب إجراء `read` أو `exec` حتى تتمكن من رؤية بث الأدوات ومعالجة الحمولة.

## إعادة تعيين نظيفة تمامًا

توجد الحالة تحت دليل حالة OpenClaw. والقيمة الافتراضية هي `~/.openclaw`. وإذا تم ضبط `OPENCLAW_STATE_DIR`، فاستخدم ذلك الدليل بدلًا منه.

لإعادة تعيين كل شيء:

- `openclaw.json` للإعدادات
- `agents/<agentId>/agent/auth-profiles.json` لملفات تعريف مصادقة النموذج (مفاتيح API + OAuth)
- `credentials/` لحالة الموفر/القناة التي لا تزال موجودة خارج مخزن ملفات تعريف المصادقة
- `agents/<agentId>/sessions/` لسجل جلسات الوكيل
- `agents/<agentId>/sessions/sessions.json` لفهرس الجلسات
- `sessions/` إذا كانت المسارات القديمة موجودة
- `workspace/` إذا كنت تريد مساحة عمل فارغة

إذا كنت تريد فقط إعادة تعيين الجلسات، فاحذف `agents/<agentId>/sessions/` لذلك الوكيل. وإذا كنت تريد الاحتفاظ بالمصادقة، فاترك `agents/<agentId>/agent/auth-profiles.json` وأي حالة موفر تحت `credentials/` كما هي.

## المراجع

- [الاختبار](/ar/help/testing)
- [البدء](/ar/start/getting-started)

## ذو صلة

- [بنية تكامل Pi](/ar/pi)
