---
read_when:
    - تريد إزالة OpenClaw من جهاز
    - لا تزال خدمة Gateway قيد التشغيل بعد إلغاء التثبيت
summary: إلغاء تثبيت OpenClaw بالكامل (CLI، والخدمة، والحالة، ومساحة العمل)
title: إلغاء التثبيت
x-i18n:
    generated_at: "2026-07-12T06:10:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84f01dc11defe6f19c89232375e48bad383b2e71379f47f43e759d3d7bb908b5
    source_path: install/uninstall.md
    workflow: 16
---

مساران:

- **المسار السهل** إذا كان `openclaw` لا يزال مثبّتًا.
- **إزالة الخدمة يدويًا** إذا لم تعد CLI موجودة، لكن الخدمة لا تزال قيد التشغيل.

## المسار السهل (CLI لا تزال مثبّتة)

موصى به: استخدم أداة إلغاء التثبيت المضمّنة:

```bash
openclaw uninstall
```

تحافظ إزالة الحالة على أدلة مساحات العمل المُعدّة، ما لم تحدد أيضًا `--workspace`.

عاين ما ستتم إزالته (بأمان):

```bash
openclaw uninstall --dry-run --all
```

تشغيل غير تفاعلي (للأتمتة / npx). استخدمه بحذر، وفقط بعد التأكد من النطاقات:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

الخيارات: تحدد `--service` و`--state` و`--workspace` و`--app` نطاقات منفردة؛ بينما يحدد `--all` النطاقات الأربعة كلها.

الخطوات اليدوية (النتيجة نفسها):

1. أوقف خدمة Gateway:

```bash
openclaw gateway stop
```

2. ألغِ تثبيت خدمة Gateway ‏(launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. احذف الحالة والإعدادات:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

إذا عيّنت `OPENCLAW_CONFIG_PATH` إلى موقع مخصص خارج دليل الحالة، فاحذف ذلك الملف أيضًا.
إذا أردت الاحتفاظ بمساحة عمل داخل دليل الحالة، مثل `~/.openclaw/workspace`، فانقلها إلى مكان آخر قبل تشغيل `rm -rf`، أو احذف محتويات الحالة بشكل انتقائي.

4. احذف مساحة عملك (اختياري، يزيل ملفات الوكيل):

```bash
rm -rf ~/.openclaw/workspace
```

5. أزل تثبيت CLI (اختر الأمر الموافق للطريقة التي استخدمتها):

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

- إذا استخدمت ملفات تعريف (`--profile` / `OPENCLAW_PROFILE`)، فكرّر الخطوة 3 لكل دليل حالة (القيم الافتراضية هي `~/.openclaw-<profile>`).
- في الوضع البعيد، يوجد دليل الحالة على **مضيف Gateway**، لذا نفّذ الخطوات 1-4 هناك أيضًا.

## إزالة الخدمة يدويًا (CLI غير مثبّتة)

استخدم هذا إذا استمرت خدمة Gateway في العمل، لكن `openclaw` غير موجود.

### macOS ‏(launchd)

التسمية الافتراضية هي `ai.openclaw.gateway` (أو `ai.openclaw.<profile>` عند استخدام ملف تعريف):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

إذا استخدمت ملف تعريف، فاستبدل التسمية واسم ملف plist بالقيمة `ai.openclaw.<profile>`.

### Linux ‏(وحدة مستخدم systemd)

اسم الوحدة الافتراضي هو `openclaw-gateway.service` (أو `openclaw-gateway-<profile>.service`). قد تظل وحدة `clawdbot-gateway.service` السابقة لإعادة التسمية موجودة على الأجهزة التي رُقّيت من عمليات تثبيت قديمة جدًا؛ يكتشفها `openclaw uninstall` / `openclaw gateway uninstall` ويزيلها تلقائيًا.

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows ‏(مهمة مجدولة)

اسم المهمة الافتراضي هو `OpenClaw Gateway` (أو `OpenClaw Gateway (<profile>)`).
تشغّل المهمة برنامج `gateway.vbs` نصيًا بلا نافذة ضمن دليل الحالة، والذي يشغّل بدوره
`gateway.cmd`؛ أزل كليهما.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

إذا استخدمت ملف تعريف، فاحذف اسم المهمة المطابق وملفي `gateway.cmd` /
`gateway.vbs` ضمن `~\.openclaw-<profile>`.

## التثبيت العادي مقارنةً بالنسخة المستنسخة من المصدر

### التثبيت العادي (install.sh / npm / pnpm / bun)

إذا استخدمت `https://openclaw.ai/install.sh` أو `install.ps1`، فقد ثُبّتت CLI باستخدام `npm install -g openclaw@latest`.
أزلها باستخدام `npm rm -g openclaw` (أو `pnpm remove -g` / `bun remove -g` إذا ثبّتها بتلك الطريقة).

### نسخة مستنسخة من المصدر (git clone)

إذا كنت تشغّل من نسخة مستنسخة من المستودع (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. ألغِ تثبيت خدمة Gateway **قبل** حذف المستودع (استخدم المسار السهل أعلاه أو إزالة الخدمة يدويًا).
2. احذف دليل المستودع.
3. أزل الحالة ومساحة العمل كما هو موضح أعلاه.

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [دليل الترحيل](/ar/install/migrating)
