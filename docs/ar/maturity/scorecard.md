---
summary: درجات جاهزية إصدار OpenClaw لمجالات المنتج وعمليات التكامل ومسارات العمل المدعومة.
title: بطاقة تقييم النضج
x-i18n:
    generated_at: "2026-07-12T06:05:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0cc55f54773a19369b865994ea22d00f1e07fc7df2b2d5b14cb4067f994fb0e2
    source_path: maturity/scorecard.md
    workflow: 16
---

# بطاقة تقييم النضج

<div className="maturity-hero">
  <p className="maturity-kicker">الجاهزية للإصدار - مولّدة من التصنيف + أدلة ضمان الجودة</p>
  <p className="maturity-hero-title">نظرة عملية على ما هو جاهز، وما ثبتت صلاحيته، وما لا يزال يحتاج إلى عمل.</p>
  <p>50 سطحًا - 281 مجالًا للقدرات - تغطية حتمية إلى جانب جودة واكتمال خاضعين للمراجعة البشرية.</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">استعراض الأسطح</a> / <a href="#qa-evidence-summary">فحص أدلة ضمان الجودة</a> / <a href="/ar/maturity/taxonomy">قراءة التصنيف</a></p>
</div>

## الغرض من هذه الصفحة

استخدم هذه الصفحة للإجابة عن سؤال واحد: ما أسطح OpenClaw التي تُعد خيارات موثوقة للإصدار، وما الأدلة التي تدعم هذا الحكم؟ تُستمد التغطية من أدلة ضمان الجودة الحتمية؛ وتُحافَظ على الجودة والاكتمال بوصفهما درجات نضج خاضعة للمراجعة.

## نظرة سريعة

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">68%</span>
      <span>درجة النضج</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "68" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">ألفا</span>
      <span>الجودة + الاكتمال</span>
      <span>التغطية تجريبية - 4%</span>
      <span>الجودة ألفا - 64%</span>
      <span>الاكتمال بيتا - 71%</span>
    </div>
  </div>
</div>

تُبنى التغطية عمدًا على الأدلة: فلا يصبح المجال «جاهزًا» لمجرد وجود التنفيذ. وهي ليست من مدخلات درجة النضج، لكن OpenClaw يهدف إلى إبقاء التغطية الشاملة فوق 90% بمرور الوقت للميزات الناضجة ذات المستوى المستقر أو الأفضل.

## نطاقات الدرجات

<div className="maturity-band-list">
  <div className="maturity-band maturity-band-experimental"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span></span><span>0-50%</span></div>
  <div className="maturity-band maturity-band-alpha"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-alpha">ألفا</span></span><span>50-70%</span></div>
  <div className="maturity-band maturity-band-beta"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-beta">بيتا</span></span><span>70-80%</span></div>
  <div className="maturity-band maturity-band-stable"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-stable">مستقر</span></span><span>80-95%</span></div>
  <div className="maturity-band maturity-band-clawesome"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-clawesome">Clawesome</span></span><span>95-100%</span></div>
</div>

## مستكشف الأسطح

<a id="surface-explorer" />

تُرتّب الأسطح حسب مستوى النضج والاكتمال والجودة. ويُعرض دعم LTS بجانب كل صف لتسهيل مقارنة الخيارات الجاهزة للإصدار.

  <Tabs>
  <Tab title="جميع الأسطح">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>السطح</span><span>التغطية</span><span>الجودة</span><span>الاكتمال</span><span>الدعم</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>مستقر</span></span><span>7 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">بيئة تشغيل Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>مستقر</span></span><span>13 مجالًا</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">مضيف Gateway على Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>مستقر</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي أولي</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">مضيف Gateway على macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>مستقر</span></span><span>7 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي أولي</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>مستقر</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي أولي</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#android-app"><span className="maturity-surface-title">تطبيق Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>مستقر</span></span><span>7 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#ios-app"><span className="maturity-surface-title">تطبيق iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>مستقر</span></span><span>8 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">بيئة تشغيل الوكيل</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>9 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي أولي</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">محرّك الجلسة والذاكرة والسياق</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>9 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي أولي</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">إطار عمل القنوات</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>8 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي أولي</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">أدوات أتمتة المتصفح والتنفيذ ووضع الحماية</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>3 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي أولي</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#observability"><span className="maturity-surface-title">قابلية الرصد</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي أولي</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">مسار موفّر OpenAI وCodex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي أولي</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">تطبيق ويب Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">أدوات البحث في الويب</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#plugins"><span className="maturity-surface-title">الإضافات</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>9 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">الأمان والمصادقة والإقران والأسرار</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">الأتمتة: Cron والخطافات والمهام والاستقصاء</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">الاستضافة باستخدام Docker وPodman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows عبر WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi وأجهزة Linux الصغيرة</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">مسار موفّر Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">كامل - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">كامل - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">مسار موفّر Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage وBlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">التطبيق المصاحب لنظام macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>8 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">مسار موفّر OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">فهم الوسائط وتوليدها</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">أدوات توليد الصور والفيديو والموسيقى</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">موفّرو النماذج المحليون: Ollama وvLLM وSGLang وLM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">موفّرو الاستضافة الأقل شيوعًا</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>3 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">الصوت والمحادثة في الوقت الفعلي</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Windows الأصلي</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">الاستضافة على Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu وQQ Bot وWeChat وYuanbao وZalo وZalo Personal والقنوات الإقليمية</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost وLINE وIRC وNextcloud Talk وNostr وTwitch وTlon وSynology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">حزمة تطوير تطبيقات OpenClaw</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">مسار تثبيت Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">قناة المكالمات الصوتية</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">واجهات watchOS المصاحبة</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">تطبيق Linux المصاحب</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>مخطط له</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">تطبيق Windows الأصلي المصاحب</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>مخطط له</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="النواة">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>السطح</span><span>التغطية</span><span>الجودة</span><span>الاكتمال</span><span>الدعم</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>مستقر</span></span><span>7 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">بيئة تشغيل Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>مستقر</span></span><span>13 مجالًا</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">بيئة تشغيل الوكيل</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>9 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">محرك الجلسات والذاكرة والسياق</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>9 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">إطار عمل القنوات</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>8 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#observability"><span className="maturity-surface-title">قابلية الرصد</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">تطبيق الويب لـ Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugins</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>9 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">الأمان والمصادقة والإقران والأسرار</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">الأتمتة: Cron والخطافات والمهام والاستقصاء</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">فهم الوسائط وتوليدها</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>أولي</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">أولي</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">أولي</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">الصوت والمحادثة في الوقت الفعلي</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>أولي</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">أولي</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">أولي</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>أولي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">حزمة تطوير تطبيقات OpenClaw</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="المنصة">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>السطح</span><span>التغطية</span><span>الجودة</span><span>الاكتمال</span><span>الدعم</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">مضيف Gateway على Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>مستقر</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">مضيف Gateway على macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>مستقر</span></span><span>7 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#android-app"><span className="maturity-surface-title">تطبيق Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>مستقر</span></span><span>7 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#ios-app"><span className="maturity-surface-title">تطبيق iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>مستقر</span></span><span>8 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">الاستضافة باستخدام Docker وPodman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows عبر WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">أولي</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi وأجهزة Linux الصغيرة</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">أولي</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">التطبيق المصاحب لنظام macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>8 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">أولي</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Windows الأصلي</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>أولي</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">أولي</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">أولي</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">الاستضافة باستخدام Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>أولي</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">أولي</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">مسار تثبيت Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">واجهات watchOS المصاحبة</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">تطبيق Linux المصاحب</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>مخطط له</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">تطبيق Windows الأصلي المصاحب</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>مخطط له</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="القناة">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>الواجهة</span><span>التغطية</span><span>الجودة</span><span>الاكتمال</span><span>الدعم</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>مستقر</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">كامل - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">كامل - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage وBlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu وQQ Bot وWeChat وYuanbao وZalo وZalo Personal والقنوات الإقليمية</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost وLINE وIRC وNextcloud Talk وNostr وTwitch وTlon وSynology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">قناة المكالمات الصوتية</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="المزوّد والأداة">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>السطح</span><span>التغطية</span><span>الجودة</span><span>الاكتمال</span><span>الدعم</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">أتمتة المتصفح وأدوات التنفيذ ووضع الحماية</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>3 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">مسار مزوّد OpenAI وCodex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">أدوات البحث على الويب</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">مسار موفّر Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">مسار موفّر Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">أولي</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">مسار موفّر OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">أولي</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">أدوات توليد الصور والفيديو والموسيقى</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>أولي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">أولي</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">أولي</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">موفّرو النماذج المحلية: Ollama وvLLM وSGLang وLM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>أولي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">اختباري</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">أولي</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">أولي</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">الموفّرون المستضافون الأقل شيوعًا</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>أولي</span></span><span>3 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## ملخص أدلة ضمان الجودة

توضح عمليات التحقق أدناه مجالات بطاقة التقييم التي تناولتها أدلة ملف ضمان الجودة.

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">التحقق الكامل من التصنيف</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>96 عملية تحقق - نجحت 94، وتعذرت 2</span>
    <span>0 من 281 (0%) من المجالات - 20 من 1675 (1.2%) من الميزات - 77 من 1665 (4.6%) من معرّفات التغطية</span>
  </div>
</div>

### الجاهزية حسب المجال

افتح أحد الأسطح لفحص حالة الأدلة لكل فئة. تظل القائمة مطوية حتى تبقى الصفحة مفيدة بنظرة سريعة.

<AccordionGroup>
  <Accordion title="وقت تشغيل الوكيل - 9 مجالات">
    <p className="maturity-readiness-summary">8 روجعت جزئيًا / 1 يحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تنفيذ دور الوكيل</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">رُوجع جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 7 من 24 (29.2%)</span>
        <span>17 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">أوقات التشغيل الخارجية والوكلاء الفرعيون</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">رُوجع جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 3 من 10 (30%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تنفيذ الموفّر المستضاف</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">رُوجع جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>1 من 5 (20%) / 1 من 5 (20%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الموفّرون المحليون والمستضافون ذاتيًا</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اختيار النموذج ووقت التشغيل</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">رُوجع جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 2 من 8 (25%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مصادقة الموفّر</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">رُوجع جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 4 من 17 (23.5%)</span>
        <span>13 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">البث والتقدم</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">رُوجع جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 5 من 9 (55.6%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">استدعاءات الأدوات ومعالجة الاستجابات</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">رُوجع جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 15 من 23 (65.2%)</span>
        <span>8 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ضوابط تنفيذ الأدوات</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">رُوجع جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 6 من 12 (50%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="تطبيق Android - 7 مجالات">
    <p className="maturity-readiness-summary">7 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد الاتصال</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">وقت تشغيل الجهاز</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>فجوتان في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التوزيع</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التقاط الوسائط</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الدردشة عبر الأجهزة المحمولة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الإعدادات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الصوت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="مسار موفّر Anthropic - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مدخلات الوسائط</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اختيار النموذج ووقت التشغيل</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 12 (0%)</span>
        <span>12 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ذاكرة التخزين المؤقت للموجّه والسياق</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مصادقة الموفّر والاسترداد</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 9 (0%) / 0 من 9 (0%)</span>
        <span>9 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">نقل الطلب ودلالات الدور</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="الأتمتة: Cron والخطافات والمهام والاستقصاء - 6 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة / 1 تمت مراجعته جزئيًا</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">خطافات الأتمتة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 11 (0%) / 0 من 11 (0%)</span>
        <span>11 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">المهام والتدفقات في الخلفية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مهام Cron</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 15 (0%) / 0 من 15 (0%)</span>
        <span>15 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">استقبال الأحداث</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 15 (0%) / 0 من 15 (0%)</span>
        <span>15 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Heartbeat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 1 من 7 (14.3%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عناصر التحكم في الاستقصاء</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="أتمتة المتصفح والتنفيذ وأدوات البيئة المعزولة - 3 مجالات">
    <p className="maturity-readiness-summary">2 تمت مراجعتهما جزئيًا / 1 يحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">أتمتة المتصفح</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>1 من 8 (12.5%) / 1 من 8 (12.5%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سياسة البيئة المعزولة والأدوات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">استدعاء الأدوات وتنفيذها</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>2 من 6 (33.3%) / 4 من 8 (50%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="تطبيق الويب لـ Gateway - 6 مجالات">
    <p className="maturity-readiness-summary">3 تحتاج إلى مراجعة / 3 تمت مراجعتها جزئيًا</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول عبر المتصفح والثقة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">المحادثة الفورية عبر المتصفح</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">واجهة مستخدم المتصفح</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 1 من 12 (8.3%)</span>
        <span>11 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التهيئة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">وحدة تحكم المشغّل</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 1 من 12 (8.3%)</span>
        <span>11 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">محادثات WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعتها جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 15 (0%) / 2 من 20 (10%)</span>
        <span>18 فجوة في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="إطار عمل القنوات - 8 مجالات">
    <p className="maturity-readiness-summary">4 تحتاج إلى مراجعة / 4 تمت مراجعتها جزئيًا</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">أوامر إجراءات القناة والموافقات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القناة</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 1 من 7 (14.3%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 5 من 27 (18.5%)</span>
        <span>22 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سلوك سلاسل المحادثات الجماعية والغرف المحيطة</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 4 من 11 (36.4%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">بوابات الوصول الوارد والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مرفقات الوسائط وبيانات القناة الغنية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مسار التسليم الصادر والردود</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 8 من 21 (38.1%)</span>
        <span>13 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سلامة الحالة وعناصر تحكم المشغّل</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub - 4 مجالات">
    <p className="maturity-readiness-summary">4 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اكتشاف الكتالوج</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التوافق والثقة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 12 (0%) / 0 من 12 (0%)</span>
        <span>12 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دورة حياة Plugin وسلامته</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 26 (0%) / 0 من 26 (0%)</span>
        <span>26 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">النشر</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="CLI - 7 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة / 2 تمت مراجعتهما جزئيًا</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">قابلية مراقبة CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت المراجعة جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>1 من 6 (16.7%) / 1 من 6 (16.7%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التشخيص</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إدارة خدمة Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت المراجعة جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 1 من 7 (14.3%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التهيئة الأولية وإعداد المصادقة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد Plugin والقنوات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التحديثات والترقيات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord - 6 مجالات">
    <p className="maturity-readiness-summary">6 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القنوات وتشغيلها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 12 (0%) / 0 من 12 (0%)</span>
        <span>12 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمحتوى الغني</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عناصر التحكم الأصلية والموافقات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الصوت والمكالمات في الوقت الفعلي</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="استضافة Docker وPodman - 4 مجالات">
    <p className="maturity-readiness-summary">3 تحتاج إلى مراجعة / 1 تمت مراجعته جزئيًا</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">بيئة عزل الوكيل وأدواته</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عمليات الحاويات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 11 (0%) / 0 من 11 (0%)</span>
        <span>11 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد الحاويات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إصدار الصور والتحقق منها</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت المراجعة جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>1 من 5 (20%) / 2 من 7 (28.6%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu وQQ Bot وWeChat وYuanbao وZalo وZalo Personal والقنوات الإقليمية - 4 مجالات">
    <p className="maturity-readiness-summary">4 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة قدرات واحدة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القنوات وتشغيلها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة قدرات واحدة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمحتوى الغني</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة قدرات واحدة</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="بيئة تشغيل Gateway - 13 مجالًا">
    <p className="maturity-readiness-summary">9 تحتاج إلى مراجعة / 4 روجعت جزئيًا</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الموافقات والتنفيذ عن بُعد</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مصادقة الأجهزة وإقرانها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دورة حياة Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">روجعت جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 4 من 12 (33.3%)</span>
        <span>8 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">واجهات RPC وأحداث Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">روجعت جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 20 (0%) / 2 من 22 (9.1%)</span>
        <span>20 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الصحة والتشخيص والإصلاح</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">واجهة الويب المستضافة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">واجهات HTTP</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">روجعت جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>1 من 4 (25%) / 1 من 4 (25%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول إلى الشبكة واكتشافها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">العُقد والقدرات البعيدة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 8 (0%) / 0 من 8 (0%)</span>
        <span>8 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توافق البروتوكول</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الأدوار والأذونات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ضوابط الأمان</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اتصال WebSocket</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">روجعت جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>1 من 8 (12.5%) / 1 من 8 (12.5%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 11 (0%) / 0 من 11 (0%)</span>
        <span>11 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القنوات وتشغيلها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 16 (0%) / 0 من 16 (0%)</span>
        <span>16 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة قدرات واحدة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمحتوى الغني</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة قدرات واحدة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عناصر التحكم والموافقات الأصلية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 16 (0%) / 0 من 16 (0%)</span>
        <span>16 فجوة في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="مسار موفّر Google - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">بيئة تشغيل Gemini المباشرة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 9 (0%) / 0 من 9 (0%)</span>
        <span>9 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والبحث والوقت الفعلي</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه النماذج ونقاط النهاية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التخزين المؤقت للموجّهات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد الموفّر وبيانات الاعتماد</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="أدوات إنشاء الصور والفيديو والموسيقى - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إنشاء الصور</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 9 (0%) / 0 من 9 (0%)</span>
        <span>9 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه الوسائط واكتشافها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إنشاء الموسيقى</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دورة حياة المهام وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 12 (0%) / 0 من 12 (0%)</span>
        <span>12 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إنشاء الفيديو</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 11 (0%) / 0 من 11 (0%)</span>
        <span>11 فجوة في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessage وBlueBubbles - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القناة وتشغيلها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 11 (0%) / 0 من 11 (0%)</span>
        <span>11 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمحتوى الغني</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عناصر التحكم الأصلية والموافقات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="تطبيق iOS - 8 مجالات">
    <p className="maturity-readiness-summary">8 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اللوحة والشاشة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الدردشة والجلسات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">أوامر الجهاز</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>فجوتان في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التوزيع</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد Gateway وتشخيصه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمشاركة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الإشعارات والعمل في الخلفية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الصوت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="استضافة Kubernetes - 4 مجالات">
    <p className="maturity-readiness-summary">4 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والإتاحة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دورة حياة العنقود</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الإعداد والأسرار</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد النشر</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="التطبيق المرافق لنظام Linux - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توزيع التطبيق</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الدردشة والجلسات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">قدرات سطح المكتب</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 9 (0%) / 0 من 9 (0%)</span>
        <span>9 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الاتصال بـ Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الحالة والتشخيص</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="مضيف Gateway لنظام Linux - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">أهداف النشر</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التشخيص والإصلاح</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">وقت تشغيل Gateway والتحكم في الخدمة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد المضيف وتحديثاته</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول عن بُعد والأمان</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="موفرو النماذج المحليون: Ollama وvLLM وSGLang وLM Studio - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الذاكرة المحلية والتضمينات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins الأصلية للموفرين</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">أمان الشبكة وعناصر التحكم في المطالبات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>2 فجوتان في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توافق وقت التشغيل المتوافق مع OpenAI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 8 (0%) / 0 من 8 (0%)</span>
        <span>8 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد الموفر ودورة حياته وتشخيصه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 12 (0%) / 0 من 12 (0%)</span>
        <span>12 فجوة في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="موفرو الاستضافة الأقل شيوعًا - 3 مجالات">
    <p className="maturity-readiness-summary">3 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">موفرو نماذج اللغة الكبيرة المستضافة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 12 (0%) / 0 من 12 (0%)</span>
        <span>12 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">موفرو الوسائط المستضافة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 8 (0%) / 0 من 8 (0%)</span>
        <span>8 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عمليات الموفرين</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 12 (0%) / 0 من 12 (0%)</span>
        <span>12 فجوة في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="التطبيق المصاحب لنظام macOS - 8 مجالات">
    <p className="maturity-readiness-summary">8 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">لوحة الرسم</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الإعداد المحلي</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">القدرات الأصلية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الاتصالات البعيدة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دردشة الويب البعيدة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الحالة والإعدادات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الصوت والتحدث</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دردشة الويب</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="مضيف Gateway لنظام macOS - 7 مجالات">
    <p className="maturity-readiness-summary">7 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التشخيص وإمكانية الرصد</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دورة حياة خدمة Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تكامل Gateway المحلي</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 9 (0%) / 0 من 9 (0%)</span>
        <span>9 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الأذونات والقدرات الأصلية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ملفات التعريف والعزل</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">وضع Gateway البعيد</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Matrix - 6 مجالات">
    <p className="maturity-readiness-summary">6 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القناة وتشغيلها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التشفير والتحقق</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمحتوى الغني</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عناصر التحكم الأصلية والموافقات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mattermost، LINE، IRC، Nextcloud Talk، Nostr، Twitch، Tlon، Synology Chat - 4 مجالات">
    <p className="maturity-readiness-summary">4 بحاجة إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القناة وتشغيلها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمحتوى الغني</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="فهم الوسائط وإنشاؤها - 6 مجالات">
    <p className="maturity-readiness-summary">4 بحاجة إلى مراجعة / 2 تمت مراجعتهما جزئيًا</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">معالجة وسائط القناة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد الوسائط</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إنشاء الوسائط</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت المراجعة جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>1 من 17 (5.9%) / 1 من 19 (5.3%)</span>
        <span>18 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">استقبال الوسائط والوصول إليها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 8 (0%) / 0 من 8 (0%)</span>
        <span>8 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">فهم الوسائط</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت المراجعة جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 12 (0%) / 1 من 14 (7.1%)</span>
        <span>13 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تسليم تحويل النص إلى كلام</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>فجوتان في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams - 5 مجالات">
    <p className="maturity-readiness-summary">5 بحاجة إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 9 (0%) / 0 من 9 (0%)</span>
        <span>9 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القناة وتشغيلها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 9 (0%) / 0 من 9 (0%)</span>
        <span>9 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمحتوى الغني</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عناصر التحكم والموافقات الأصلية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows الأصلي - 4 مجالات">
    <p className="maturity-readiness-summary">4 بحاجة إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 9 (0%) / 0 من 9 (0%)</span>
        <span>9 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إدارة Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 11 (0%) / 0 من 11 (0%)</span>
        <span>11 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الشبكات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التحديثات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="التطبيق المرافق الأصلي لنظام Windows - 5 مجالات">
    <p className="maturity-readiness-summary">5 بحاجة إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">جلسات الدردشة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>فجوتان في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">أدوات سطح المكتب والأذونات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اتصال Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التثبيت والتحديثات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الحالة والإصلاح</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="مسار تثبيت Nix - 5 مجالات">
    <p className="maturity-readiness-summary">5 بحاجة إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التفعيل وتجربة استخدام التطبيق</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الإعداد والحالة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تسليم التثبيت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دورة حياة Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">وقت تشغيل الخدمة وآليات الحماية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 8 (0%) / 0 من 8 (0%)</span>
        <span>8 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="مسار موفّر OpenAI وCodex - 5 مجالات">
    <p className="maturity-readiness-summary">2 بحاجة إلى مراجعة / 3 خضعت لمراجعة جزئية</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إدخال الصور والوسائط المتعددة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>فجوتان في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">النموذج والمصادقة</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">خضع لمراجعة جزئية - تحقق كامل من التصنيف</span>
        </div>
        <span>1 من 6 (16.7%) / 4 من 9 (44.4%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">بيئة Codex الأصلية</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">خضع لمراجعة جزئية - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 4 من 9 (44.4%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الاستجابات وتوافق الأدوات</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">خضع لمراجعة جزئية - تحقق كامل من التصنيف</span>
        </div>
        <span>1 من 4 (25%) / 2 من 5 (40%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الصوت والصوت الآني</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>فجوتان في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="حزمة تطوير تطبيقات OpenClaw - 6 مجالات">
    <p className="maturity-readiness-summary">5 بحاجة إلى مراجعة / 1 خضع لمراجعة جزئية</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">محادثات الوكيل</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">واجهة برمجة تطبيقات العميل</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التوافق</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الأحداث والموافقات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول إلى Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">أدوات الموارد المساعدة</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">خضع لمراجعة جزئية - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 1 من 6 (16.7%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="مسار موفّر OpenRouter - 4 مجالات">
    <p className="maturity-readiness-summary">4 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">وقت تشغيل الدردشة والتطبيع</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 15 (0%) / 0 من 15 (0%)</span>
        <span>15 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توليد الوسائط والكلام</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">استرداد الموفّر وتشخيصه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد الموفّر والمصادقة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 14 (0%) / 0 من 14 (0%)</span>
        <span>14 فجوة في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="الإضافات - 9 مجالات">
    <p className="maturity-readiness-summary">6 تحتاج إلى مراجعة / 3 روجعت جزئيًا</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تأليف الإضافات وتحزيمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 8 (0%) / 0 من 8 (0%)</span>
        <span>8 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الإضافات المضمّنة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إضافة اللوحة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إضافات القنوات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تثبيت الإضافات وتشغيلها</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">روجعت جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 7 من 20 (35%)</span>
        <span>13 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الموافقات على الإضافات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إضافات الموفّرين والأدوات</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">روجعت جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>1 من 6 (16.7%) / 9 من 21 (42.9%)</span>
        <span>12 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">نشر الإضافات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اختبار الإضافات</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">روجعت جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 3 من 11 (27.3%)</span>
        <span>8 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi وأجهزة Linux الصغيرة - 4 مجالات">
    <p className="maturity-readiness-summary">4 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">وقت تشغيل Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الأداء والتشخيص</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول عن بُعد والمصادقة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 9 (0%) / 0 من 9 (0%)</span>
        <span>9 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الإعداد والتوافق</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 12 (0%) / 0 من 12 (0%)</span>
        <span>12 فجوة في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="الأمان والمصادقة والإقران والأسرار - 6 مجالات">
    <p className="maturity-readiness-summary">2 روجعت جزئيًا / 4 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سياسة الموافقة وضمانات الأدوات</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">روجعت جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 3 من 6 (50%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التحكم في الوصول إلى القنوات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سلامة بيانات الاعتماد والأسرار</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">روجعت جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 5 من 11 (45.5%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إقران الأجهزة وعُقد Node</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 11 (0%) / 0 من 11 (0%)</span>
        <span>11 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مصادقة Gateway والوصول عن بُعد</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 9 (0%) / 0 من 9 (0%)</span>
        <span>9 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الثقة في Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>فجوتان في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="الجلسة والذاكرة ومحرك السياق - 9 مجالات">
    <p className="maturity-readiness-summary">2 بحاجة إلى مراجعة / 7 تمت مراجعتها جزئيًا</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إدارة الجلسات والنصوص المنسوخة في CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>فجوتان في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">محرك السياق</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 4 من 7 (57.1%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الموجّهات الأساسية والسياق</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 3 من 8 (37.5%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تكافؤ السجل والجلسات بين العملاء</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 2 من 5 (40%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التشخيص والصيانة والاسترداد</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 4 من 10 (40%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الذاكرة</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 6 من 13 (46.2%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه الجلسات</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 1 من 4 (25%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إدارة الرموز المميزة</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 2 من 10 (20%)</span>
        <span>8 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">استمرارية النصوص المنسوخة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>فجوتان في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal - 5 مجالات">
    <p className="maturity-readiness-summary">5 بحاجة إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القناة وتشغيلها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمحتوى الغني</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عناصر التحكم الأصلية والموافقات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack - 5 مجالات">
    <p className="maturity-readiness-summary">5 بحاجة إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القناة وتشغيلها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمحتوى الغني</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عناصر التحكم الأصلية والموافقات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 8 (0%) / 0 من 8 (0%)</span>
        <span>8 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram - 5 مجالات">
    <p className="maturity-readiness-summary">5 بحاجة إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القناة وتشغيلها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمحتوى الغني</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عناصر التحكم الأصلية والموافقات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 9 (0%) / 0 من 9 (0%)</span>
        <span>9 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="قابلية الرصد - 5 مجالات">
    <p className="maturity-readiness-summary">3 مراجعة جزئيًا / 2 بحاجة إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">جمع بيانات التشخيص</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">مراجعة جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>1 من 8 (12.5%) / 3 من 10 (30%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الحالة والإصلاح</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">مراجعة جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>1 من 12 (8.3%) / 5 من 18 (27.8%)</span>
        <span>13 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التسجيل</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تشخيص الجلسات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تصدير بيانات القياس عن بُعد</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">مراجعة جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>1 من 13 (7.7%) / 7 من 21 (33.3%)</span>
        <span>14 فجوة في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="TUI - 5 مجالات">
    <p className="maturity-readiness-summary">5 بحاجة إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الإدخال والأوامر</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 8 (0%) / 0 من 8 (0%)</span>
        <span>8 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تنفيذ الصدفة المحلية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سلامة العرض والمخرجات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">أوضاع وقت التشغيل</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 14 (0%) / 0 من 14 (0%)</span>
        <span>14 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إدارة الجلسات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="الصوت والمحادثة في الوقت الفعلي - 6 مجالات">
    <p className="maturity-readiness-summary">6 بحاجة إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">المحادثة في التطبيق الأصلي</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">جلسات المحادثة في الوقت الفعلي</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 11 (0%) / 0 من 11 (0%)</span>
        <span>11 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الكلام والنسخ النصي</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">قابلية رصد المحادثات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">موفرو المحادثة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التنبيه الصوتي والتوجيه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="قناة المكالمات الصوتية - 5 مجالات">
    <p className="maturity-readiness-summary">5 بحاجة إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القناة وتشغيلها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>فجوتان في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمحتوى الغني</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>فجوتان في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الصوت والمكالمات في الوقت الفعلي</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>فجوتان في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="واجهات التطبيق المصاحب على watchOS - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التسليم والاسترداد</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التوزيع والدعم</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الموافقات على التنفيذ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الإشعارات والردود</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">واجهة مستخدم تطبيق الساعة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="أدوات البحث في الويب - 4 مجالات">
    <p className="maturity-readiness-summary">2 تحتاجان إلى مراجعة / 2 تمت مراجعتهما جزئيًا</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">أمان الشبكة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">موفرو البحث</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت المراجعة جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>2 من 19 (10.5%) / 2 من 19 (10.5%)</span>
        <span>17 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الإعداد والتشخيص</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 9 (0%) / 0 من 9 (0%)</span>
        <span>9 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توفر الأدوات والجلب</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت المراجعة جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>2 من 11 (18.2%) / 3 من 12 (25%)</span>
        <span>9 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القناة وعملياتها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمحتوى الغني</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>فجوتان في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عناصر التحكم الأصلية والموافقات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>فجوتان في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows عبر WSL2 - 6 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة / 1 تمت مراجعته جزئيًا</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>معرّفات الميزات / التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">المتصفح وواجهة مستخدم التحكم</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 8 (0%) / 0 من 8 (0%)</span>
        <span>8 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التشخيص والإصلاح</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت المراجعة جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>1 من 6 (16.7%) / 3 من 8 (37.5%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول إلى Gateway وإتاحته</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 11 (0%) / 0 من 11 (0%)</span>
        <span>11 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دورة حياة خدمة Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد WSL</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> آخر تحديث: 2026-06-22
