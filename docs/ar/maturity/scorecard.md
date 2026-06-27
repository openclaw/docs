---
summary: درجات جاهزية إصدار OpenClaw لمجالات المنتج والتكاملات وسير العمل المدعومة.
title: بطاقة قياس النضج
x-i18n:
    generated_at: "2026-06-27T17:54:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 916f070ca42778dc1cc41e47cdb4ace502f073c4e888f21526b762226a856d40
    source_path: maturity/scorecard.md
    workflow: 16
---

# بطاقة قياس النضج

<div className="maturity-hero">
  <p className="maturity-kicker">جاهزية الإصدار - مُولَّدة من التصنيف + أدلة ضمان الجودة</p>
  <p className="maturity-hero-title">عرض عملي لما هو جاهز، وما ثبتت صحته، وما لا يزال يحتاج إلى عمل.</p>
  <p>50 سطحًا - 281 مجال قدرة - تغطية حتمية بالإضافة إلى جودة واكتمال خاضعين للمراجعة البشرية.</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">تصفح الأسطح</a> / <a href="#qa-evidence-summary">افحص أدلة ضمان الجودة</a> / <a href="/ar/maturity/taxonomy">اقرأ التصنيف</a></p>
</div>

## الغرض من هذه الصفحة

استخدم هذه الصفحة للإجابة عن سؤال واحد: أي أسطح OpenClaw تُعد خيارات موثوقة للإصدار، وما الأدلة التي تدعم هذا الحكم؟ تأتي التغطية من أدلة ضمان جودة حتمية؛ وتُدار الجودة والاكتمال بوصفهما درجات نضج مراجَعة.

## لمحة سريعة

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">67%</span>
      <span>درجة النضج</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "67" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">ألفا</span>
      <span>الجودة + الاكتمال</span>
      <span>التغطية تجريبية - 4%</span>
      <span>الجودة ألفا - 63%</span>
      <span>الاكتمال بيتا - 70%</span>
    </div>
  </div>
</div>

التغطية مقادة بالأدلة عمدًا: لا يصبح المجال "جاهزًا" لمجرد أن التنفيذ موجود. وهي ليست مُدخلًا في درجة النضج، لكن OpenClaw يهدف إلى إبقاء التغطية الشاملة من البداية إلى النهاية فوق 90% للميزات الناضجة ذات مستوى مستقر أو أفضل بمرور الوقت.

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

تُرتَّب الأسطح حسب مستوى النضج والاكتمال والجودة. يُعرض دعم LTS إلى جانب كل صف لتسهيل مقارنة الخيارات الجاهزة للإصدار.

  <Tabs>
  <Tab title="كل الأسطح">
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
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">وقت تشغيل Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>مستقر</span></span><span>13 مجالًا</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 12</span></div>
      </div>
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
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>مستقر</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">وقت تشغيل الوكيل</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>9 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">محرك الجلسة والذاكرة والسياق</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>9 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">إطار عمل القنوات</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>8 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">أدوات أتمتة المتصفح والتنفيذ وبيئة العزل</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>3 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#observability"><span className="maturity-surface-title">قابلية المراقبة</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">مسار موفّر OpenAI وCodex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">تطبيق الويب الخاص بـ Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">أدوات البحث على الويب</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugins</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>9 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">الأمان، والمصادقة، والاقتران، والأسرار</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">الأتمتة: Cron، والخطافات، والمهام، والاستطلاع</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">استضافة Docker وPodman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows عبر WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi وأجهزة Linux الصغيرة</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">مسار موفّر Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">كامل - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">كامل - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">مسار موفّر Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage وBlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">تطبيق macOS المصاحب</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>8 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">مسار موفر OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">فهم الوسائط وتوليد الوسائط</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">أدوات توليد الصور والفيديو والموسيقى</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">موفرو النماذج المحليون: Ollama، vLLM، SGLang، LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">الموفرون المستضافون طويلو الذيل</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>3 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">الصوت والمحادثة في الوقت الحقيقي</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#android-app"><span className="maturity-surface-title">تطبيق Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>7 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
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
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">استضافة Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu، QQ Bot، WeChat، Yuanbao، Zalo، Zalo Personal، القنوات الإقليمية</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost، LINE، IRC، Nextcloud Talk، Nostr، Twitch، Tlon، Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">حزمة SDK لتطبيق OpenClaw</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#ios-app"><span className="maturity-surface-title">تطبيق iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>تجريبي</span></span><span>8 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">مسار تثبيت Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">قناة المكالمات الصوتية</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">أسطح watchOS المصاحبة</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">التطبيق المصاحب لـ Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>مخطط له</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">التطبيق المصاحب الأصلي لـ Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>مخطط له</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="النواة">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>السطح</span><span>التغطية</span><span>الجودة</span><span>الاكتمال</span><span>الدعم</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>مستقر</span></span><span>7 مناطق</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">وقت تشغيل Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>مستقر</span></span><span>13 منطقة</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">وقت تشغيل الوكيل</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي محدود</span></span><span>9 مناطق</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي محدود</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي محدود</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">محرك الجلسة والذاكرة والسياق</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي محدود</span></span><span>9 مناطق</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي محدود</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي محدود</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">إطار عمل القنوات</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي محدود</span></span><span>8 مناطق</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي محدود</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي محدود</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#observability"><span className="maturity-surface-title">قابلية المراقبة</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي محدود</span></span><span>5 مناطق</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي محدود</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">تطبيق الويب لـ Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugins</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>9 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">الأمان والمصادقة والاقتران والأسرار</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">الأتمتة: Cron، والخطافات، والمهام، والاستطلاع</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">فهم الوسائط وتوليد الوسائط</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
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
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>5 مناطق</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>4 مناطق</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw App SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>6 مناطق</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="المنصة">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>السطح</span><span>التغطية</span><span>الجودة</span><span>الاكتمال</span><span>الدعم</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">مضيف Gateway على Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>مستقر</span></span><span>5 مناطق</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">مضيف Gateway على macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>مستقر</span></span><span>7 مناطق</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">استضافة Docker وPodman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>4 مناطق</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows عبر WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>6 مناطق</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi وأجهزة Linux الصغيرة</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">تطبيق macOS المصاحب</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>8 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#android-app"><span className="maturity-surface-title">تطبيق Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>7 مجالات</span></span></a>
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
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">استضافة Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#ios-app"><span className="maturity-surface-title">تطبيق iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>تجريبي</span></span><span>8 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
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
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">أسطح watchOS المصاحبة</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">تطبيق Linux المصاحب</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>مخطط</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">تطبيق Windows الأصلي المصاحب</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>مخطط</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا يوجد</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="القناة">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>السطح</span><span>التغطية</span><span>الجودة</span><span>الاكتمال</span><span>الدعم</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>مستقر</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">تجريبي محدود</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">مستقر</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئي - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>تجريبي محدود</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">كامل - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">كامل - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage وBlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>6 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
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
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">قناة المكالمة الصوتية</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>تجريبي</span></span><span>5 مجالات</span></span></a>
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
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">أتمتة المتصفح والتنفيذ وأدوات الصندوق المعزول</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>3 مجالات</span></span></a>
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
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">أدوات البحث على الويب</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">مسار موفّر Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">مسار موفّر Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">مسار موفّر OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بيتا</span></span><span>4 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بيتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">أدوات إنشاء الصور والفيديو والموسيقى</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">موفّرو النماذج المحليون: Ollama وvLLM وSGLang وLM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>5 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ar/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">المزوّدون المستضافون طويلو الذيل</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>ألفا</span></span><span>3 مجالات</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">التغطية</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">تجريبي</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الجودة</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">الاكتمال</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">ألفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">لا شيء</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## ملخص أدلة ضمان الجودة

توضح الفحوصات أدناه مجالات بطاقة التقييم التي شملتها أدلة ملف تعريف ضمان الجودة.

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">التحقق الكامل من التصنيف</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>96 فحصًا - نجح 94، وجرى حظر 2</span>
    <span>0 من 281 (0%) مجالًا - 20 من 1675 (1.2%) ميزة - 77 من 1665 (4.6%) معرّف تغطية</span>
  </div>
</div>

### الجاهزية حسب المجال

افتح سطحًا لفحص حالة أدلة كل فئة. تبقى القائمة مطوية حتى تظل الصفحة مفيدة بنظرة سريعة.

<AccordionGroup>
  <Accordion title="وقت تشغيل الوكيل - 9 مجالات">
    <p className="maturity-readiness-summary">8 تمت مراجعتها جزئيًا / 1 يحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تنفيذ دور الوكيل</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 7 من 24 (29.2%)</span>
        <span>17 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">أوقات التشغيل الخارجية والوكلاء الفرعيون</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 3 من 10 (30%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تنفيذ المزوّد المستضاف</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>1 من 5 (20%) / 1 من 5 (20%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">المزوّدون المحليون والمستضافون ذاتيًا</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اختيار النموذج ووقت التشغيل</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 2 من 8 (25%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مصادقة المزوّد</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 4 من 17 (23.5%)</span>
        <span>13 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">البث والتقدم</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 5 من 9 (55.6%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">استدعاءات الأدوات ومعالجة الاستجابات</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 15 من 23 (65.2%)</span>
        <span>8 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عناصر التحكم في تنفيذ الأدوات</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - التحقق الكامل من التصنيف</span>
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
        <span>1 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">وقت تشغيل الجهاز</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>2 فجوتان في القدرات</span>
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
        <span>1 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الدردشة عبر الهاتف المحمول</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>1 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الإعدادات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>1 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الصوت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>1 فجوة في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="مسار مزوّد Anthropic - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إدخالات الوسائط</span>
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
          <span className="maturity-readiness-title">مصادقة المزوّد والاسترداد</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 9 (0%) / 0 من 9 (0%)</span>
        <span>9 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">نقل الطلبات ودلالات الأدوار</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="الأتمتة: Cron، والخطاطيف، والمهام، والاستطلاع - 6 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة / 1 مراجع جزئيًا</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">خطاطيف الأتمتة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 11 (0%) / 0 من 11 (0%)</span>
        <span>11 فجوة قدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">المهام والتدفقات في الخلفية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات قدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مهام Cron</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 15 (0%) / 0 من 15 (0%)</span>
        <span>15 فجوة قدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دخول الأحداث</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 15 (0%) / 0 من 15 (0%)</span>
        <span>15 فجوة قدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Heartbeat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">مراجع جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 1 من 7 (14.3%)</span>
        <span>6 فجوات قدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عناصر التحكم في الاستطلاع</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات قدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="أتمتة المتصفح، والتنفيذ، وأدوات البيئة المعزولة - 3 مجالات">
    <p className="maturity-readiness-summary">2 مراجعان جزئيًا / 1 يحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">أتمتة المتصفح</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">مراجع جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>1 من 8 (12.5%) / 1 من 8 (12.5%)</span>
        <span>7 فجوات قدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سياسة البيئة المعزولة والأدوات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات قدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">استدعاء الأدوات وتنفيذها</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">مراجع جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>2 من 6 (33.3%) / 4 من 8 (50%)</span>
        <span>4 فجوات قدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="تطبيق الويب لـ Gateway - 6 مجالات">
    <p className="maturity-readiness-summary">3 تحتاج إلى مراجعة / 3 مراجعة جزئيًا</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">وصول المتصفح والثقة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات قدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التحدث الفوري عبر المتصفح</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات قدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">واجهة مستخدم المتصفح</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">مراجع جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 1 من 12 (8.3%)</span>
        <span>11 فجوة قدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التكوين</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات قدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">وحدة تحكم المشغل</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">مراجع جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 1 من 12 (8.3%)</span>
        <span>11 فجوة قدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">محادثات WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">مراجع جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 15 (0%) / 2 من 20 (10%)</span>
        <span>18 فجوة قدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="إطار عمل القنوات - 8 مجالات">
    <p className="maturity-readiness-summary">4 تحتاج إلى مراجعة / 4 مراجعة جزئيًا</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إجراءات القنوات وأوامرها والموافقات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات قدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القنوات</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">مراجع جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 1 من 7 (14.3%)</span>
        <span>6 فجوات قدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">مراجع جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 5 من 27 (18.5%)</span>
        <span>22 فجوة قدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سلوك سلاسل المجموعات والغرف المحيطة</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">مراجع جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 4 من 11 (36.4%)</span>
        <span>7 فجوات قدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">بوابات الوصول الوارد والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات قدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مرفقات الوسائط وبيانات القنوات الغنية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات قدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التسليم الصادر وخط معالجة الردود</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">مراجع جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 8 من 21 (38.1%)</span>
        <span>13 فجوة قدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">صحة الحالة وعناصر تحكم المشغل</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات قدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub - 4 مجالات">
    <p className="maturity-readiness-summary">4 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اكتشاف الكتالوج</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التوافق والثقة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 12 (0%) / 0 من 12 (0%)</span>
        <span>12 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دورة حياة Plugin وحالته الصحية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 26 (0%) / 0 من 26 (0%)</span>
        <span>26 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">النشر</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="CLI - 7 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة / 2 تمت مراجعتهما جزئيًا</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">قابلية مراقبة CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>1 من 6 (16.7%) / 1 من 6 (16.7%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Doctor</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إدارة خدمة Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 1 من 7 (14.3%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الإعداد التمهيدي وإعداد المصادقة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد Plugin والقناة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التحديثات والترقيات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord - 6 مجالات">
    <p className="maturity-readiness-summary">6 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القناة وعملياتها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 12 (0%) / 0 من 12 (0%)</span>
        <span>12 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمحتوى المنسق</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عناصر التحكم والموافقات الأصلية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الصوت والمكالمات في الوقت الفعلي</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="استضافة Docker وPodman - 4 مجالات">
    <p className="maturity-readiness-summary">3 تحتاج إلى مراجعة / 1 تمت مراجعته جزئيًا</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">بيئة عزل الوكيل والأدوات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عمليات الحاويات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 11 (0%) / 0 من 11 (0%)</span>
        <span>11 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد الحاوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إصدار الصور والتحقق منها</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>1 من 5 (20%) / 2 من 7 (28.6%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu، QQ Bot، WeChat، Yuanbao، Zalo، Zalo Personal، القنوات الإقليمية - 4 مجالات">
    <p className="maturity-readiness-summary">4 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة قدرات واحدة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القناة وعملياتها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة قدرات واحدة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمحتوى الغني</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة قدرات واحدة</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="وقت تشغيل Gateway - 13 مجالًا">
    <p className="maturity-readiness-summary">9 تحتاج إلى مراجعة / 4 تمت مراجعتها جزئيًا</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الموافقات والتنفيذ عن بُعد</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مصادقة الجهاز والإقران</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دورة حياة Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 4 من 12 (33.3%)</span>
        <span>8 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">واجهات Gateway RPC API والأحداث</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 20 (0%) / 2 من 22 (9.1%)</span>
        <span>20 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الصحة والتشخيص والإصلاح</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">واجهة الويب المستضافة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">واجهات HTTP API</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>1 من 4 (25%) / 1 من 4 (25%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول إلى الشبكة والاكتشاف</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">العُقد والقدرات البعيدة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 8 (0%) / 0 من 8 (0%)</span>
        <span>8 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توافق البروتوكول</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الأدوار والأذونات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ضوابط الأمان</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اتصال WebSocket</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>1 من 8 (12.5%) / 1 من 8 (12.5%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 11 (0%) / 0 من 11 (0%)</span>
        <span>11 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القناة وعملياتها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 16 (0%) / 0 من 16 (0%)</span>
        <span>16 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة قدرات واحدة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمحتوى الغني</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة قدرات واحدة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عناصر التحكم الأصلية والموافقات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 16 (0%) / 0 من 16 (0%)</span>
        <span>16 فجوة في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="مسار موفّر Google - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تشغيل Gemini المباشر</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 9 (0%) / 0 من 9 (0%)</span>
        <span>9 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والبحث والوقت الفعلي</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه النماذج ونقاط النهاية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تخزين المطالبات مؤقتًا</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد الموفّر وبيانات الاعتماد</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="أدوات إنشاء الصور والفيديو والموسيقى - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إنشاء الصور</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 9 (0%) / 0 من 9 (0%)</span>
        <span>9 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه الوسائط واكتشافها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إنشاء الموسيقى</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دورة حياة المهمة والتسليم</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 12 (0%) / 0 من 12 (0%)</span>
        <span>12 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إنشاء الفيديو</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 11 (0%) / 0 من 11 (0%)</span>
        <span>11 فجوة في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessage وBlueBubbles - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القناة وعملياتها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 11 (0%) / 0 من 11 (0%)</span>
        <span>11 فجوة في القدرات</span>
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
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عناصر التحكم والموافقات الأصلية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="تطبيق iOS - 8 مجالات">
    <p className="maturity-readiness-summary">8 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اللوحة والشاشة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الدردشة والجلسات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">أوامر الجهاز</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>فجوتان في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التوزيع</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد Gateway والتشخيصات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمشاركة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الإشعارات والخلفية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الصوت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة واحدة في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="استضافة Kubernetes - 4 مجالات">
    <p className="maturity-readiness-summary">4 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والتعرّض</span>
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
          <span className="maturity-readiness-title">الإعدادات والأسرار</span>
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

  <Accordion title="تطبيق Linux المرافق - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
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
          <span className="maturity-readiness-title">اتصال Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الحالة والتشخيصات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="مضيف Gateway على Linux - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
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
          <span className="maturity-readiness-title">إعداد المضيف والتحديثات</span>
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
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
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
          <span className="maturity-readiness-title">Plugins المزوّدين الأصلية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سلامة الشبكة وعناصر التحكم في المطالبات</span>
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
          <span className="maturity-readiness-title">إعداد المزوّد ودورة الحياة والتشخيصات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 12 (0%) / 0 من 12 (0%)</span>
        <span>12 فجوة في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="المزوّدون المستضافون طويلو الذيل - 3 مجالات">
    <p className="maturity-readiness-summary">3 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مزوّدو LLM المستضافون</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 12 (0%) / 0 من 12 (0%)</span>
        <span>12 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مزوّدو الوسائط المستضافون</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 8 (0%) / 0 من 8 (0%)</span>
        <span>8 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عمليات المزوّدين</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 12 (0%) / 0 من 12 (0%)</span>
        <span>12 فجوة في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="تطبيق macOS المرافق - 8 مجالات">
    <p className="maturity-readiness-summary">8 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اللوحة</span>
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

  <Accordion title="مضيف Gateway على macOS - 7 مجالات">
    <p className="maturity-readiness-summary">7 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
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
          <span className="maturity-readiness-title">التشخيصات وقابلية الملاحظة</span>
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
          <span className="maturity-readiness-title">الملفات الشخصية والعزل</span>
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
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
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
    <p className="maturity-readiness-summary">4 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة قدرة واحدة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القناة وعملياتها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة قدرة واحدة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة قدرة واحدة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمحتوى الغني</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة قدرة واحدة</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="فهم الوسائط وتوليد الوسائط - 6 مجالات">
    <p className="maturity-readiness-summary">4 تحتاج إلى مراجعة / 2 تمت مراجعتهما جزئياً</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التعامل مع وسائط القنوات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعدادات الوسائط</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة قدرة واحدة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توليد الوسائط</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئياً - تحقق كامل من التصنيف</span>
        </div>
        <span>1 من 17 (5.9%) / 1 من 19 (5.3%)</span>
        <span>18 فجوة قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">استقبال الوسائط والوصول إليها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 8 (0%) / 0 من 8 (0%)</span>
        <span>8 فجوات قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">فهم الوسائط</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئياً - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 12 (0%) / 1 من 14 (7.1%)</span>
        <span>13 فجوة قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تسليم تحويل النص إلى كلام</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>فجوتا قدرة</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 9 (0%) / 0 من 9 (0%)</span>
        <span>9 فجوات قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القناة وعملياتها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 9 (0%) / 0 من 9 (0%)</span>
        <span>9 فجوات قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمحتوى الغني</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عناصر التحكم والموافقات الأصلية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات قدرة</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows الأصلي - 4 مجالات">
    <p className="maturity-readiness-summary">4 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 9 (0%) / 0 من 9 (0%)</span>
        <span>9 فجوات قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إدارة Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 11 (0%) / 0 من 11 (0%)</span>
        <span>11 فجوة قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الشبكات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التحديثات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات قدرة</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Native Windows companion app - 5 areas">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">جلسات الدردشة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>فجوتان في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">أدوات سطح المكتب والأذونات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اتصال Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التثبيت والتحديثات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الحالة والإصلاح</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Nix install path - 5 areas">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التنشيط وتجربة مستخدم التطبيق</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الإعدادات والحالة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تسليم التثبيت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دورة حياة Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">وقت تشغيل الخدمة والحمايات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 8 (0%) / 0 من 8 (0%)</span>
        <span>8 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenAI and Codex provider path - 5 areas">
    <p className="maturity-readiness-summary">2 تحتاج إلى مراجعة / 3 تمت مراجعتها جزئياً</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إدخال الصور والوسائط المتعددة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>فجوتان في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">النموذج والمصادقة</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعتها جزئياً - التحقق الكامل من التصنيف</span>
        </div>
        <span>1 من 6 (16.7%) / 4 من 9 (44.4%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">بيئة تشغيل Codex الأصلية</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعتها جزئياً - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 4 من 9 (44.4%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الاستجابات وتوافق الأدوات</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعتها جزئياً - التحقق الكامل من التصنيف</span>
        </div>
        <span>1 من 4 (25%) / 2 من 5 (40%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الصوت والصوت في الوقت الفعلي</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>فجوتان في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenClaw App SDK - 6 areas">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة / 1 تمت مراجعتها جزئياً</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">محادثات الوكيل</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">واجهة API للعميل</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التوافق</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الأحداث والموافقات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول إلى Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مساعدات الموارد</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعتها جزئياً - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 1 من 6 (16.7%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="مسار مزود OpenRouter - 4 مجالات">
    <p className="maturity-readiness-summary">4 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">وقت تشغيل الدردشة والتطبيع</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 15 (0%) / 0 من 15 (0%)</span>
        <span>15 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توليد الوسائط والكلام</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">استرداد المزود والتشخيصات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد المزود والمصادقة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 14 (0%) / 0 من 14 (0%)</span>
        <span>14 فجوة في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Plugins - 9 مجالات">
    <p className="maturity-readiness-summary">6 تحتاج إلى مراجعة / 3 تمت مراجعتها جزئيًا</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تأليف Plugins وتغليفها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 8 (0%) / 0 من 8 (0%)</span>
        <span>8 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins المضمّنة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin Canvas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins القنوات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تثبيت Plugins وتشغيلها</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعتها جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 7 من 20 (35%)</span>
        <span>13 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">موافقات Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins المزود والأدوات</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعتها جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>1 من 6 (16.7%) / 9 من 21 (42.9%)</span>
        <span>12 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">نشر Plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اختبار Plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعتها جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 3 من 11 (27.3%)</span>
        <span>8 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi وأجهزة Linux الصغيرة - 4 مجالات">
    <p className="maturity-readiness-summary">4 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">وقت تشغيل Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الأداء والتشخيصات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول عن بُعد والمصادقة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 9 (0%) / 0 من 9 (0%)</span>
        <span>9 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الإعداد والتوافق</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 12 (0%) / 0 من 12 (0%)</span>
        <span>12 فجوة في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="الأمان والمصادقة والاقتران والأسرار - 6 مجالات">
    <p className="maturity-readiness-summary">2 تمت مراجعتها جزئيًا / 4 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سياسة الموافقة وضمانات الأدوات</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعتها جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 3 من 6 (50%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التحكم في الوصول إلى القنوات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سلامة بيانات الاعتماد والأسرار</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعتها جزئيًا - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 5 من 11 (45.5%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اقتران الجهاز وNode</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 11 (0%) / 0 من 11 (0%)</span>
        <span>11 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مصادقة Gateway والوصول عن بُعد</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 9 (0%) / 0 من 9 (0%)</span>
        <span>9 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ثقة Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>2 فجوتان في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="الجلسة والذاكرة ومحرك السياق - 9 مجالات">
    <p className="maturity-readiness-summary">2 تحتاج إلى مراجعة / 7 تمت مراجعتها جزئيًا</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إدارة جلسات CLI والنصوص التفريغية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>فجوتا قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">محرك السياق</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 4 من 7 (57.1%)</span>
        <span>3 فجوات قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">المطالبات والسياق الأساسيان</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 3 من 8 (37.5%)</span>
        <span>5 فجوات قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تكافؤ السجل والجلسات عبر العملاء</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 2 من 5 (40%)</span>
        <span>3 فجوات قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التشخيصات والصيانة والاسترداد</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 4 من 10 (40%)</span>
        <span>6 فجوات قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الذاكرة</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 6 من 13 (46.2%)</span>
        <span>7 فجوات قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه الجلسات</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 1 من 4 (25%)</span>
        <span>3 فجوات قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إدارة الرموز</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئيًا - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 2 من 10 (20%)</span>
        <span>8 فجوات قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">استمرارية النصوص التفريغية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>فجوتا قدرة</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القناة وعملياتها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة قدرة واحدة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمحتوى الغني</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عناصر التحكم الأصلية والموافقات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات قدرة</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة قدرة واحدة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القناة وعملياتها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمحتوى الغني</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة قدرة واحدة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عناصر التحكم الأصلية والموافقات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 8 (0%) / 0 من 8 (0%)</span>
        <span>8 فجوات قدرة</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القناة وعملياتها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات قدرة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة قدرة واحدة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمحتوى الغني</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 1 (0%) / 0 من 1 (0%)</span>
        <span>فجوة قدرة واحدة</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عناصر التحكم الأصلية والموافقات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">تحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 9 (0%) / 0 من 9 (0%)</span>
        <span>9 فجوات قدرة</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="قابلية المراقبة - 5 مجالات">
    <p className="maturity-readiness-summary">3 تمت مراجعتها جزئياً / 2 بحاجة إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">جمع التشخيصات</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئياً - التحقق الكامل من التصنيف</span>
        </div>
        <span>1 من 8 (12.5%) / 3 من 10 (30%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الصحة والإصلاح</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئياً - التحقق الكامل من التصنيف</span>
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
          <span className="maturity-readiness-title">تشخيصات الجلسات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تصدير القياسات عن بُعد</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئياً - التحقق الكامل من التصنيف</span>
        </div>
        <span>1 من 13 (7.7%) / 7 من 21 (33.3%)</span>
        <span>14 فجوة في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="TUI - 5 مجالات">
    <p className="maturity-readiness-summary">5 بحاجة إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
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
          <span className="maturity-readiness-title">أمان العرض والمخرجات</span>
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

  <Accordion title="الصوت والمحادثة الفورية - 6 مجالات">
    <p className="maturity-readiness-summary">6 بحاجة إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">المحادثة عبر التطبيق الأصلي</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">جلسات المحادثة الفورية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 11 (0%) / 0 من 11 (0%)</span>
        <span>11 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الكلام والنسخ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">قابلية مراقبة المحادثة</span>
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
          <span className="maturity-readiness-title">تنبيه الصوت والتوجيه</span>
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
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
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
          <span className="maturity-readiness-title">إعداد القناة وعملياتها</span>
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
          <span className="maturity-readiness-title">الصوت والمكالمات الفورية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">بحاجة إلى مراجعة - التحقق الكامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>فجوتان في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="أسطح watchOS المرافقة - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التسليم والاسترداد</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التوزيع والدعم</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">موافقات التنفيذيين</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الإشعارات والردود</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">واجهة تطبيق الساعة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 3 (0%) / 0 من 3 (0%)</span>
        <span>3 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="أدوات بحث الويب - 4 مجالات">
    <p className="maturity-readiness-summary">2 تحتاج إلى مراجعة / 2 تمت مراجعتهما جزئياً</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سلامة الشبكة</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">موفرو البحث</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئياً - تحقق كامل من التصنيف</span>
        </div>
        <span>2 من 19 (10.5%) / 2 من 19 (10.5%)</span>
        <span>17 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الإعداد والتشخيصات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 9 (0%) / 0 من 9 (0%)</span>
        <span>9 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توفر الأدوات والجلب</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئياً - تحقق كامل من التصنيف</span>
        </div>
        <span>2 من 11 (18.2%) / 3 من 12 (25%)</span>
        <span>9 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp - 5 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول والهوية</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 7 (0%) / 0 من 7 (0%)</span>
        <span>7 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد القناة والعمليات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 5 (0%) / 0 من 5 (0%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توجيه المحادثات وتسليمها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 4 (0%) / 0 من 4 (0%)</span>
        <span>4 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوسائط والمحتوى الغني</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>2 فجوتان في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عناصر التحكم الأصلية والموافقات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 2 (0%) / 0 من 2 (0%)</span>
        <span>2 فجوتان في القدرات</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows عبر WSL2 - 6 مجالات">
    <p className="maturity-readiness-summary">5 تحتاج إلى مراجعة / 1 تمت مراجعته جزئياً</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>المجال</span><span>الميزات / معرّفات التغطية</span><span>المتابعة</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">المتصفح وواجهة التحكم</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 8 (0%) / 0 من 8 (0%)</span>
        <span>8 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">التشخيصات والإصلاح</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تمت مراجعته جزئياً - تحقق كامل من التصنيف</span>
        </div>
        <span>1 من 6 (16.7%) / 3 من 8 (37.5%)</span>
        <span>5 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">الوصول إلى Gateway والتعريض</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 11 (0%) / 0 من 11 (0%)</span>
        <span>11 فجوة في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دورة حياة خدمة Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 10 (0%) / 0 من 10 (0%)</span>
        <span>10 فجوات في القدرات</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">إعداد WSL</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">يحتاج إلى مراجعة - تحقق كامل من التصنيف</span>
        </div>
        <span>0 من 6 (0%) / 0 من 6 (0%)</span>
        <span>6 فجوات في القدرات</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> آخر تحديث: 2026-06-22
