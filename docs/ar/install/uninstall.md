---
read_when:
    - تريد إزالة OpenClaw من جهاز ما
    - لا تزال خدمة gateway تعمل بعد إلغاء التثبيت
summary: إزالة OpenClaw بالكامل (CLI، والخدمة، والحالة، ومساحة العمل)
title: إلغاء التثبيت
x-i18n:
    generated_at: "2026-04-24T07:49:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d73bc46f4878510706132e5c6cfec3c27cdb55578ed059dc12a785712616d75
    source_path: install/uninstall.md
    workflow: 15
---

هناك مساران:

- **المسار السهل** إذا كان `openclaw` لا يزال مثبتًا.
- **إزالة الخدمة يدويًا** إذا كان CLI غير موجود لكن الخدمة لا تزال تعمل.

## المسار السهل (لا يزال CLI مثبتًا)

الموصى به: استخدم أداة إلغاء التثبيت المضمنة:

```bash
openclaw uninstall
```

وضع غير تفاعلي (للأتمتة / ‏npx):

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

الخطوات اليدوية (النتيجة نفسها):

1. أوقف خدمة gateway:

```bash
openclaw gateway stop
```

2. أزل خدمة gateway ‏(launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. احذف الحالة + الإعدادات:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

إذا كنت قد ضبطت `OPENCLAW_CONFIG_PATH` على موقع مخصص خارج دليل الحالة، فاحذف ذلك الملف أيضًا.

4. احذف مساحة عملك (اختياري، يزيل ملفات الوكيل):

```bash
rm -rf ~/.openclaw/workspace
```

5. أزل تثبيت CLI ‏(اختر الطريقة التي استخدمتها):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. إذا كنت قد ثبّت تطبيق macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

ملاحظات:

- إذا كنت قد استخدمت ملفات شخصية (`--profile` / `OPENCLAW_PROFILE`)، فكرّر الخطوة 3 لكل دليل حالة (القيم الافتراضية هي `~/.openclaw-<profile>`).
- في الوضع البعيد، يوجد دليل الحالة على **مضيف gateway**، لذا شغّل الخطوات 1-4 هناك أيضًا.

## إزالة الخدمة يدويًا (CLI غير مثبت)

استخدم هذا إذا استمرت خدمة gateway في العمل لكن `openclaw` غير موجود.

### macOS ‏(launchd)

الوسم الافتراضي هو `ai.openclaw.gateway` ‏(أو `ai.openclaw.<profile>`؛ وقد تظل وسوم `com.openclaw.*` القديمة موجودة):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

إذا كنت قد استخدمت ملفًا شخصيًا، فاستبدل الوسم واسم ملف plist بـ `ai.openclaw.<profile>`. وأزل أي ملفات plist قديمة من نوع `com.openclaw.*` إن وُجدت.

### Linux ‏(وحدة systemd للمستخدم)

اسم الوحدة الافتراضي هو `openclaw-gateway.service` ‏(أو `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows ‏(Scheduled Task)

اسم المهمة الافتراضي هو `OpenClaw Gateway` ‏(أو `OpenClaw Gateway (<profile>)`).
يوجد سكربت المهمة تحت دليل الحالة الخاص بك.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

إذا كنت قد استخدمت ملفًا شخصيًا، فاحذف اسم المهمة المطابق و`~\.openclaw-<profile>\gateway.cmd`.

## التثبيت العادي مقابل نسخة المصدر

### التثبيت العادي (`install.sh` / `npm` / `pnpm` / `bun`)

إذا كنت قد استخدمت `https://openclaw.ai/install.sh` أو `install.ps1`، فقد تم تثبيت CLI باستخدام `npm install -g openclaw@latest`.
أزله باستخدام `npm rm -g openclaw` (أو `pnpm remove -g` / `bun remove -g` إذا كنت قد ثبّتّه بهذه الطريقة).

### نسخة المصدر (`git clone`)

إذا كنت تشغّل من نسخة مستودع (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. أزل تثبيت خدمة gateway **قبل** حذف المستودع (استخدم المسار السهل أعلاه أو إزالة الخدمة يدويًا).
2. احذف دليل المستودع.
3. أزل الحالة + مساحة العمل كما هو موضح أعلاه.

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [دليل الترحيل](/ar/install/migrating)
