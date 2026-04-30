---
read_when:
    - العمل على كود تكامل Pi أو اختباراته
    - تشغيل تدفقات الفحص النمطي وفحص الأنواع والاختبارات الحية الخاصة بـ Pi
summary: 'سير عمل المطوّر لتكامل Pi: البناء والاختبار والتحقق المباشر'
title: سير عمل تطوير Pi
x-i18n:
    generated_at: "2026-04-30T08:10:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c4025c8ed1a4dff0d8116440fd48f375264eb4cac06f71afebf8c05f3470ab4
    source_path: pi-dev.md
    workflow: 16
---

سير عمل منطقي للعمل على تكامل Pi في OpenClaw.

## التحقق من الأنواع والتدقيق

- بوابة محلية افتراضية: `pnpm check`
- بوابة البناء: `pnpm build` عندما يمكن أن يؤثر التغيير في مخرجات البناء أو التحزيم أو حدود التحميل الكسول/الوحدات
- بوابة الهبوط الكاملة للتغييرات المكثفة في Pi: `pnpm check && pnpm test`

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

لتضمين تمرين المزوّد الحي:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

يغطي هذا مجموعات اختبارات وحدات Pi الرئيسية:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## الاختبار اليدوي

التدفق الموصى به:

- شغّل Gateway في وضع التطوير:
  - `pnpm gateway:dev`
- شغّل الوكيل مباشرة:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- استخدم TUI للتصحيح التفاعلي:
  - `pnpm tui`

بالنسبة إلى سلوك استدعاء الأدوات، اطلب إجراء `read` أو `exec` حتى تتمكن من رؤية بث الأدوات ومعالجة الحمولة.

## إعادة ضبط من نقطة نظيفة

توجد الحالة ضمن دليل حالة OpenClaw. الافتراضي هو `~/.openclaw`. إذا كان `OPENCLAW_STATE_DIR` مضبوطًا، فاستخدم ذلك الدليل بدلًا من ذلك.

لإعادة ضبط كل شيء:

- `openclaw.json` للتكوين
- `agents/<agentId>/agent/auth-profiles.json` لملفات تعريف مصادقة النموذج (مفاتيح API + OAuth)
- `credentials/` لحالة المزوّد/القناة التي لا تزال موجودة خارج مخزن ملفات تعريف المصادقة
- `agents/<agentId>/sessions/` لسجل جلسات الوكيل
- `agents/<agentId>/sessions/sessions.json` لفهرس الجلسات
- `sessions/` إذا كانت المسارات القديمة موجودة
- `workspace/` إذا كنت تريد مساحة عمل فارغة

إذا كنت تريد إعادة ضبط الجلسات فقط، فاحذف `agents/<agentId>/sessions/` لذلك الوكيل. إذا كنت تريد الاحتفاظ بالمصادقة، فاترك `agents/<agentId>/agent/auth-profiles.json` وأي حالة مزوّد ضمن `credentials/` كما هي.

## المراجع

- [الاختبار](/ar/help/testing)
- [بدء الاستخدام](/ar/start/getting-started)

## ذو صلة

- [بنية تكامل Pi](/ar/pi)
