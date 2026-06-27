---
read_when:
    - تريد إزالة OpenClaw من جهاز
    - لا تزال خدمة Gateway قيد التشغيل بعد إلغاء التثبيت
summary: إلغاء تثبيت OpenClaw بالكامل (CLI، الخدمة، الحالة، مساحة العمل)
title: إلغاء التثبيت
x-i18n:
    generated_at: "2026-06-27T17:53:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0f63bde2769b3d35d928aed1668121086a2952338f2634d45d55da8cc637025b
    source_path: install/uninstall.md
    workflow: 16
---

مساران:

- **المسار السهل** إذا كان `openclaw` لا يزال مثبتًا.
- **إزالة الخدمة يدويًا** إذا اختفى CLI لكن الخدمة ما زالت قيد التشغيل.

## المسار السهل (CLI لا يزال مثبتًا)

موصى به: استخدم أداة إلغاء التثبيت المضمّنة:

```bash
openclaw uninstall
```

عند استخدام CLI، تحافظ إزالة الحالة على أدلة مساحة العمل المهيأة ما لم تختر أيضًا `--workspace`.

عاين ما ستتم إزالته (آمن):

```bash
openclaw uninstall --dry-run --all
```

غير تفاعلي (الأتمتة / npx). استخدمه بحذر وفقط بعد تأكيد النطاقات:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

خطوات يدوية (النتيجة نفسها):

1. أوقف خدمة Gateway:

```bash
openclaw gateway stop
```

2. ألغِ تثبيت خدمة Gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. احذف الحالة + الإعدادات:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

إذا ضبطت `OPENCLAW_CONFIG_PATH` على موقع مخصص خارج دليل الحالة، فاحذف ذلك الملف أيضًا.
إذا أردت الاحتفاظ بمساحة عمل داخل دليل الحالة، مثل `~/.openclaw/workspace`، فانقلها جانبًا قبل تشغيل `rm -rf` أو احذف محتويات الحالة انتقائيًا.

4. احذف مساحة العمل الخاصة بك (اختياري، يزيل ملفات الوكيل):

```bash
rm -rf ~/.openclaw/workspace
```

5. أزل تثبيت CLI (اختر الأمر الذي استخدمته):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. إذا ثبّت تطبيق macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

ملاحظات:

- إذا استخدمت ملفات تعريف (`--profile` / `OPENCLAW_PROFILE`)، فكرر الخطوة 3 لكل دليل حالة (القيم الافتراضية هي `~/.openclaw-<profile>`).
- في الوضع البعيد، يوجد دليل الحالة على **مضيف Gateway**، لذا شغّل الخطوات 1-4 هناك أيضًا.

## إزالة الخدمة يدويًا (CLI غير مثبت)

استخدم هذا إذا استمرت خدمة Gateway في العمل لكن `openclaw` مفقود.

### macOS (launchd)

التسمية الافتراضية هي `ai.openclaw.gateway` (أو `ai.openclaw.<profile>`؛ وقد تظل `com.openclaw.*` القديمة موجودة):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

إذا استخدمت ملف تعريف، فاستبدل التسمية واسم plist بـ `ai.openclaw.<profile>`. أزل أي ملفات plist قديمة بنمط `com.openclaw.*` إذا كانت موجودة.

### Linux (وحدة systemd للمستخدم)

اسم الوحدة الافتراضي هو `openclaw-gateway.service` (أو `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (مهمة مجدولة)

اسم المهمة الافتراضي هو `OpenClaw Gateway` (أو `OpenClaw Gateway (<profile>)`).
يوجد سكربت المهمة ضمن دليل الحالة باسم `gateway.cmd`؛ وقد تنشئ التثبيتات الحالية
أيضًا مشغّلًا بلا نافذة باسم `gateway.vbs` يشغّله مجدول المهام بدلًا
من فتح `gateway.cmd` مباشرةً.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

إذا استخدمت ملف تعريف، فاحذف اسم المهمة المطابق وملفي `gateway.cmd` /
`gateway.vbs` ضمن `~\.openclaw-<profile>`.

## التثبيت العادي مقابل نسخة مصدرية محلية

### التثبيت العادي (install.sh / npm / pnpm / bun)

إذا استخدمت `https://openclaw.ai/install.sh` أو `install.ps1`، فقد ثُبّت CLI باستخدام `npm install -g openclaw@latest`.
أزله باستخدام `npm rm -g openclaw` (أو `pnpm remove -g` / `bun remove -g` إذا كنت قد ثبّته بتلك الطريقة).

### نسخة مصدرية محلية (git clone)

إذا كنت تشغّل من نسخة محلية للمستودع (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. ألغِ تثبيت خدمة Gateway **قبل** حذف المستودع (استخدم المسار السهل أعلاه أو إزالة الخدمة يدويًا).
2. احذف دليل المستودع.
3. أزل الحالة + مساحة العمل كما هو موضح أعلاه.

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [دليل الترحيل](/ar/install/migrating)
