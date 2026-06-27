---
summary: OpenClaw چگونه زمان اجرای عامل داخلی، ارائه‌دهندگان، نشست‌ها، ابزارها و افزونه‌ها را اجرا می‌کند.
title: معماری زمان اجرای عامل
x-i18n:
    generated_at: "2026-06-27T17:08:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd0ca61b10a4f7029590da8566b22cc44cf801af162e5f2c00c9561fe46e39e3
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw مستقیماً مالک runtime داخلی agent است. کد runtime زیر `src/agents/` قرار دارد، helperهای مدل/ارائه‌دهنده زیر `src/llm/` قرار دارند، و قراردادهای رو به Plugin از طریق barrelهای `openclaw/plugin-sdk/*` در دسترس قرار می‌گیرند.

## چیدمان Runtime

- `src/agents/embedded-agent-runner/`: حلقه تلاش agent داخلی، adapterهای stream ارائه‌دهنده، compaction، انتخاب مدل، و اتصال session.
- `src/agents/sessions/`: پایداری session، بارگذاری افزونه، کشف resource، skills، promptها، themeها، و rendererهای tool مبتنی بر TUI.
- `packages/agent-core/`: هسته agent قابل استفاده مجدد، typeهای سطح پایین‌تر harness، messageها، helperهای compaction، templateهای prompt، و قراردادهای tool/session.
- `src/agents/runtime/`: facade مربوط به OpenClaw برای `@openclaw/agent-core` به‌همراه ابزارهای local proxy.
- `src/agents/agent-tools*.ts`: تعریف‌های tool، schemaها، policy، adapterهای hook قبل/بعد، و پشتیبانی از ویرایش میزبان که تحت مالکیت OpenClaw هستند.
- `src/agents/agent-hooks/`: hookهای runtime داخلی مانند محافظ‌های compaction و هرس context.
- `src/llm/`: registry مدل/ارائه‌دهنده، helperهای transport، و پیاده‌سازی‌های stream مخصوص ارائه‌دهنده.

## مرزها

کد Core، runtime داخلی را از طریق ماژول‌های OpenClaw و barrelهای SDK فراخوانی می‌کند، نه از طریق بسته‌های agent خارجی قدیمی. Pluginها از entrypointهای مستند `openclaw/plugin-sdk/*` استفاده می‌کنند و internalهای `src/**` را import نمی‌کنند.

`@earendil-works/pi-tui` همچنان یک وابستگی TUI شخص ثالث است. این وابستگی توسط TUI محلی و rendererهای session به‌عنوان toolkit کامپوننت terminal استفاده می‌شود؛ درونی‌سازی آن یک تلاش جداگانه برای vendoring خواهد بود.

## Manifestها

بسته‌های resource، resourceهای OpenClaw را در metadata بسته اعلام می‌کنند:

```json
{
  "openclaw": {
    "extensions": ["extensions/index.ts"],
    "skills": ["skills/*.md"],
    "prompts": ["prompts/*.md"],
    "themes": ["themes/*.json"]
  }
}
```

package manager همچنین directoryهای قراردادی `extensions/`، `skills/`، `prompts/`، و `themes/` را کشف می‌کند.

## انتخاب Runtime

شناسه پیش‌فرض runtime داخلی `openclaw` است. harnessهای Plugin می‌توانند شناسه‌های runtime بیشتری ثبت کنند. `auto` وقتی harness یک Plugin پشتیبان وجود داشته باشد، آن را انتخاب می‌کند و در غیر این صورت از runtime داخلی OpenClaw استفاده می‌کند.

## مرتبط

- [گردش‌کار runtime عامل OpenClaw](/fa/openclaw-agent-runtime)
- [Runtimeهای عامل](/fa/concepts/agent-runtimes)
