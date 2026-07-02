---
summary: امتیازهای آمادگی انتشار OpenClaw برای حوزه‌های محصول، یکپارچه‌سازی‌ها، و گردش‌کارهای پشتیبانی‌شده.
title: کارت امتیاز بلوغ
x-i18n:
    generated_at: "2026-07-02T08:36:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0cc55f54773a19369b865994ea22d00f1e07fc7df2b2d5b14cb4067f994fb0e2
    source_path: maturity/scorecard.md
    workflow: 16
---

# کارت امتیاز بلوغ

<div className="maturity-hero">
  <p className="maturity-kicker">آمادگی انتشار - تولیدشده از طبقه‌بندی + شواهد QA</p>
  <p className="maturity-hero-title">نمایی عملی از اینکه چه چیز آماده است، چه چیز اثبات شده است، و چه چیز هنوز به کار نیاز دارد.</p>
  <p>50 سطح - 281 حوزه قابلیت - پوشش قطعی به‌همراه کیفیت و کامل‌بودن بازبینی‌شده توسط انسان.</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">مرور سطح‌ها</a> / <a href="#qa-evidence-summary">بررسی شواهد QA</a> / <a href="/fa/maturity/taxonomy">خواندن طبقه‌بندی</a></p>
</div>

## هدف این صفحه

از این صفحه برای پاسخ به یک پرسش استفاده کنید: کدام سطح‌های OpenClaw گزینه‌هایی معتبر برای انتشار هستند، و چه شواهدی از این داوری پشتیبانی می‌کند؟ پوشش از شواهد قطعی QA به دست می‌آید؛ کیفیت و کامل‌بودن به‌عنوان امتیازهای بلوغ بازبینی‌شده نگهداری می‌شوند.

## در یک نگاه

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">68%</span>
      <span>امتیاز بلوغ</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "68" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">آلفا</span>
      <span>کیفیت + کامل‌بودن</span>
      <span>پوشش آزمایشی - 4%</span>
      <span>کیفیت آلفا - 64%</span>
      <span>کامل‌بودن بتا - 71%</span>
    </div>
  </div>
</div>

پوشش عمدا بر پایه شواهد هدایت می‌شود: یک حوزه صرفا به این دلیل که پیاده‌سازی آن وجود دارد، «آماده» نمی‌شود. پوشش ورودی امتیاز بلوغ نیست، اما OpenClaw در طول زمان می‌کوشد پوشش سرتاسری را برای قابلیت‌های بالغِ پایدار یا بهتر، بالاتر از 90% نگه دارد.

## بازه‌های امتیاز

<div className="maturity-band-list">
  <div className="maturity-band maturity-band-experimental"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span></span><span>0-50%</span></div>
  <div className="maturity-band maturity-band-alpha"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-alpha">آلفا</span></span><span>50-70%</span></div>
  <div className="maturity-band maturity-band-beta"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-beta">بتا</span></span><span>70-80%</span></div>
  <div className="maturity-band maturity-band-stable"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-stable">پایدار</span></span><span>80-95%</span></div>
  <div className="maturity-band maturity-band-clawesome"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-clawesome">Clawesome</span></span><span>95-100%</span></div>
</div>

## کاوشگر سطح‌ها

<a id="surface-explorer" />

سطح‌ها بر اساس سطح بلوغ، کامل‌بودن، و کیفیت مرتب شده‌اند. پشتیبانی LTS کنار هر ردیف نشان داده می‌شود تا مقایسه گزینه‌های آماده انتشار آسان باشد.

  <Tabs>
  <Tab title="همه سطح‌ها">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>سطح</span><span>پوشش</span><span>کیفیت</span><span>کامل بودن</span><span>پشتیبانی</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>پایدار</span></span><span>7 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل بودن</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">زمان‌اجرای Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>پایدار</span></span><span>13 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل بودن</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">میزبان Gateway لینوکس</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>پایدار</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل بودن</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">میزبان Gateway در macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>پایدار</span></span><span>7 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل بودن</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>پایدار</span></span><span>6 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل بودن</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#android-app"><span className="maturity-surface-title">برنامه Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>پایدار</span></span><span>7 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل بودن</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#ios-app"><span className="maturity-surface-title">برنامه iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>پایدار</span></span><span>8 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">زمان اجرای عامل</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۹ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - ۶</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">موتور نشست، حافظه و زمینه</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۹ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - ۶</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">چارچوب کانال</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۸ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - ۵</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">ابزارهای خودکارسازی مرورگر، exec و sandbox</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۳ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - ۲</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#observability"><span className="maturity-surface-title">مشاهده‌پذیری</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۵ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - ۳</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">مسیر ارائه‌دهنده OpenAI و Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۵ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">برنامه وب Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>6 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">ابزارهای جستجوی وب</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>4 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#plugins"><span className="maturity-surface-title">Pluginها</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>9 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">امنیت، احراز هویت، جفت‌سازی و اسرار</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>6 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">اتوماسیون: Cron، قلاب‌ها، وظایف، نظرسنجی</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>6 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">میزبانی Docker و Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>4 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows از طریق WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>6 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi و دستگاه‌های کوچک Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>4 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">مسیر ارائه‌دهنده Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">کامل - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">کامل - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">مسیر ارائه‌دهنده Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage و BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>۵ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">برنامهٔ همراه macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>۸ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">مسیر ارائه‌دهندهٔ OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>۴ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>۵ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">درک رسانه و تولید رسانه</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>۶ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۲٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>۶۴٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">ابزارهای تولید تصویر، ویدیو و موسیقی</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>۵ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>۶۱٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">ارائه‌دهندگان مدل محلی: Ollama، vLLM، SGLang، LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>۵ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۱٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">ارائه‌دهندگان میزبانی‌شده دنباله‌بلند</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۳ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۱٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">صدا و گفت‌وگوی بلادرنگ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۶ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۱٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۶ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۷٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۵ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۵۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۵ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۵۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۵ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#native-windows"><span className="maturity-surface-title">ویندوز بومی</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>4 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>4 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">میزبانی Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>4 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu، QQ Bot، WeChat، Yuanbao، Zalo، Zalo Personal، کانال‌های منطقه‌ای</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>4 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost، LINE، IRC، Nextcloud Talk، Nostr، Twitch، Tlon، Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>4 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">SDK برنامه OpenClaw</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>6 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">مسیر نصب Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>آزمایشی</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">کانال تماس صوتی</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>آزمایشی</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">سطوح همراه watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>آزمایشی</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">برنامه همراه Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>برنامه‌ریزی‌شده</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">برنامه همراه بومی Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>برنامه‌ریزی‌شده</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="هسته">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>سطح</span><span>پوشش</span><span>کیفیت</span><span>کامل بودن</span><span>پشتیبانی</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>پایدار</span></span><span>۷ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل بودن</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - ۶</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">زمان اجرای Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>پایدار</span></span><span>۱۳ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل بودن</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - ۱۲</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">زمان اجرای عامل</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۹ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - ۶</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">موتور نشست، حافظه، و زمینه</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۹ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - ۶</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">چارچوب کانال</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۸ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - ۵</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#observability"><span className="maturity-surface-title">مشاهده‌پذیری</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۵ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - ۳</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">برنامه وب Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۶ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#plugins"><span className="maturity-surface-title">Pluginها</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۹ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - ۷</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">امنیت، احراز هویت، جفت‌سازی و اسرار</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۶ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - ۵</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">اتوماسیون: Cron، هوک‌ها، وظیفه‌ها، نظرسنجی</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۶ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">درک رسانه و تولید رسانه</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۶ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">صدا و گفت‌وگوی بی‌درنگ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۶ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۵ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>۴ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw App SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>۶ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="سکو">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>سطح</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>پشتیبانی</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">میزبان Gateway در Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>پایدار</span></span><span>۵ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - ۴</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">میزبان Gateway در macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>پایدار</span></span><span>۷ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#android-app"><span className="maturity-surface-title">برنامه Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>پایدار</span></span><span>۷ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#ios-app"><span className="maturity-surface-title">برنامه iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>پایدار</span></span><span>۸ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">میزبانی Docker و Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۴ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows از طریق WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۶ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi و دستگاه‌های کوچک Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۴ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">اپ همراه macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۸ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Windows بومی</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۴ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">میزبانی Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۴ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">مسیر نصب Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>آزمایشی</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">سطوح همراه watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>آزمایشی</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">برنامه همراه Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>برنامه‌ریزی‌شده</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">برنامه همراه بومی Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>برنامه‌ریزی‌شده</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="کانال">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>سطح</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>پشتیبانی</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>پایدار</span></span><span>6 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">کامل - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">کامل - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage و BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>6 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu، QQ Bot، WeChat، Yuanbao، Zalo، Zalo Personal، کانال‌های منطقه‌ای</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>4 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost، LINE، IRC، Nextcloud Talk، Nostr، Twitch، Tlon، Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>4 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">کانال تماس صوتی</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>آزمایشی</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="ارائه‌دهنده و ابزار">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>سطح</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>پشتیبانی</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">ابزارهای خودکارسازی مرورگر، exec و sandbox</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>3 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">مسیر ارائه‌دهنده OpenAI و Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>5 حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">جزئی - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">ابزارهای جستجوی وب</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۴ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۴٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">مسیر ارائه‌دهنده Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۵ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۱٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">مسیر ارائه‌دهنده Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۵ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">مسیر ارائه‌دهنده OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۴ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">ابزارهای تولید تصویر، ویدئو و موسیقی</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۵ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۱٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">ارائه‌دهندگان مدل محلی: Ollama، vLLM، SGLang، LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۵ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۱٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/fa/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">ارائه‌دهندگان میزبانی‌شده دنباله‌بلند</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۳ حوزه</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">پوشش</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کیفیت</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">کامل‌بودن</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## خلاصه شواهد QA

بررسی‌های زیر نشان می‌دهند کدام حوزه‌های کارت امتیاز با شواهد نمایه QA آزموده شده‌اند.

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">اعتبارسنجی کامل رده‌بندی</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>96 بررسی - 94 موفق، 2 مسدود</span>
    <span>0 از 281 (0%) حوزه - 20 از 1675 (1.2%) ویژگی - 77 از 1665 (4.6%) شناسه پوشش</span>
  </div>
</div>

### آمادگی بر پایه حوزه

یک سطح را باز کنید تا وضعیت شواهد هر دسته را بررسی کنید. فهرست جمع‌شده می‌ماند تا صفحه در یک نگاه مفید بماند.

<AccordionGroup>
  <Accordion title="زمان اجرای عامل - 9 حوزه">
    <p className="maturity-readiness-summary">8 تا تا حدی بررسی‌شده / 1 نیازمند بررسی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اجرای نوبت عامل</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بررسی‌شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 3 (0%) / 7 از 24 (29.2%)</span>
        <span>17 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">زمان‌های اجرا و زیرعامل‌های خارجی</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بررسی‌شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 3 از 10 (30%)</span>
        <span>7 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اجرای ارائه‌دهنده میزبانی‌شده</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بررسی‌شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>1 از 5 (20%) / 1 از 5 (20%)</span>
        <span>4 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ارائه‌دهندگان محلی و خودمیزبان</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بررسی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">انتخاب مدل و زمان اجرا</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بررسی‌شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 2 از 8 (25%)</span>
        <span>6 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">احراز هویت ارائه‌دهنده</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بررسی‌شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 10 (0%) / 4 از 17 (23.5%)</span>
        <span>13 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">جریان‌دهی و پیشرفت</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بررسی‌شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 2 (0%) / 5 از 9 (55.6%)</span>
        <span>4 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">فراخوانی‌های ابزار و مدیریت پاسخ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بررسی‌شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 3 (0%) / 15 از 23 (65.2%)</span>
        <span>8 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">کنترل‌های اجرای ابزار</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بررسی‌شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 6 (0%) / 6 از 12 (50%)</span>
        <span>6 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="برنامه Android - 7 حوزه">
    <p className="maturity-readiness-summary">7 نیازمند بررسی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی اتصال</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بررسی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">زمان اجرای دستگاه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بررسی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 2 (0%) / 0 از 2 (0%)</span>
        <span>2 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توزیع</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بررسی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 3 (0%) / 0 از 3 (0%)</span>
        <span>3 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ضبط رسانه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بررسی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">گفت‌وگوی موبایل</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بررسی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تنظیمات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بررسی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">صدا</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بررسی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="مسیر ارائه‌دهنده Anthropic - 5 حوزه">
    <p className="maturity-readiness-summary">5 نیازمند بررسی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ورودی‌های رسانه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بررسی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 0 از 4 (0%)</span>
        <span>4 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">انتخاب مدل و زمان اجرا</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بررسی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 10 (0%) / 0 از 12 (0%)</span>
        <span>12 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">کش پرامپت و زمینه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بررسی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">احراز هویت و بازیابی ارائه‌دهنده</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بررسی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 9 (0%) / 0 از 9 (0%)</span>
        <span>9 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">انتقال درخواست و معناشناسی نوبت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بررسی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 10 (0%) / 0 از 10 (0%)</span>
        <span>10 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="خودکارسازی: Cron، قلاب‌ها، وظایف، نظرسنجی - 6 حوزه">
    <p className="maturity-readiness-summary">5 نیازمند بازبینی / 1 تا حدی بازبینی شده</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">قلاب‌های خودکارسازی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 11 (0%) / 0 از 11 (0%)</span>
        <span>11 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">وظایف و جریان‌های پس‌زمینه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 10 (0%) / 0 از 10 (0%)</span>
        <span>10 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">کارهای Cron</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 15 (0%) / 0 از 15 (0%)</span>
        <span>15 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ورود رویداد</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 15 (0%) / 0 از 15 (0%)</span>
        <span>15 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Heartbeat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 1 از 7 (14.3%)</span>
        <span>6 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">کنترل‌های نظرسنجی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 10 (0%) / 0 از 10 (0%)</span>
        <span>10 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="خودکارسازی مرورگر، اجرا و ابزارهای sandbox - 3 حوزه">
    <p className="maturity-readiness-summary">2 تا حدی بازبینی شده / 1 نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">خودکارسازی مرورگر</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>1 از 8 (12.5%) / 1 از 8 (12.5%)</span>
        <span>7 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سیاست sandbox و ابزار</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 6 (0%) / 0 از 6 (0%)</span>
        <span>6 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">فراخوانی و اجرای ابزار</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>2 از 6 (33.3%) / 4 از 8 (50%)</span>
        <span>4 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="برنامه وب Gateway - 6 حوزه">
    <p className="maturity-readiness-summary">3 نیازمند بازبینی / 3 تا حدی بازبینی شده</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دسترسی و اعتماد مرورگر</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">گفت‌وگوی بی‌درنگ مرورگر</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">رابط کاربری مرورگر</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 10 (0%) / 1 از 12 (8.3%)</span>
        <span>11 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">پیکربندی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">کنسول اپراتور</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 10 (0%) / 1 از 12 (8.3%)</span>
        <span>11 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">گفت‌وگوهای WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 15 (0%) / 2 از 20 (10%)</span>
        <span>18 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="چارچوب کانال - 8 حوزه">
    <p className="maturity-readiness-summary">4 نیازمند بازبینی / 4 تا حدی بازبینی شده</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">کنش‌ها، فرمان‌ها و تأییدیه‌های کانال</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی کانال</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 1 از 7 (14.3%)</span>
        <span>6 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مسیریابی و تحویل گفت‌وگو</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 10 (0%) / 5 از 27 (18.5%)</span>
        <span>22 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">رفتار رشته گروهی و اتاق محیطی</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 4 از 11 (36.4%)</span>
        <span>7 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دسترسی ورودی و دروازه‌های هویت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">پیوست‌های رسانه‌ای و داده غنی کانال</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 0 از 4 (0%)</span>
        <span>4 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">خط لوله تحویل خروجی و پاسخ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 8 از 21 (38.1%)</span>
        <span>13 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سلامت وضعیت و کنترل‌های اپراتور</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 0 از 6 (0%)</span>
        <span>6 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub - 4 areas">
    <p className="maturity-readiness-summary">4 مورد نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">کشف کاتالوگ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سازگاری و اعتماد</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 12 (0%) / 0 از 12 (0%)</span>
        <span>12 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">چرخه عمر و سلامت Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 26 (0%) / 0 از 26 (0%)</span>
        <span>26 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">انتشار</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 7 (0%) / 0 از 7 (0%)</span>
        <span>7 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="CLI - 7 areas">
    <p className="maturity-readiness-summary">5 مورد نیازمند بازبینی / 2 مورد تا حدی بازبینی‌شده</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مشاهده‌پذیری CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی‌شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>1 از 6 (16.7%) / 1 از 6 (16.7%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دکتر</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 10 (0%) / 0 از 10 (0%)</span>
        <span>10 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مدیریت سرویس Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی‌شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 1 از 7 (14.3%)</span>
        <span>6 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی ورود اولیه و احراز هویت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی Plugin و کانال</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">به‌روزرسانی‌ها و ارتقاها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord - 6 areas">
    <p className="maturity-readiness-summary">6 مورد نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دسترسی و هویت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 6 (0%) / 0 از 6 (0%)</span>
        <span>6 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی و عملیات کانال</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 10 (0%) / 0 از 10 (0%)</span>
        <span>10 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مسیریابی و تحویل گفتگو</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 12 (0%) / 0 از 12 (0%)</span>
        <span>12 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">رسانه و محتوای غنی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">کنترل‌ها و تأییدهای بومی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">صدای بلادرنگ و تماس‌ها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Docker and Podman hosting - 4 areas">
    <p className="maturity-readiness-summary">3 مورد نیازمند بازبینی / 1 مورد تا حدی بازبینی‌شده</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سندباکس و ابزارهای عامل</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 3 (0%) / 0 از 3 (0%)</span>
        <span>3 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عملیات کانتینر</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 11 (0%) / 0 از 11 (0%)</span>
        <span>11 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی کانتینر</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 6 (0%) / 0 از 6 (0%)</span>
        <span>6 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">انتشار و اعتبارسنجی تصویر</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی‌شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>1 از 5 (20%) / 2 از 7 (28.6%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu، QQ Bot، WeChat، Yuanbao، Zalo، Zalo Personal، کانال‌های منطقه‌ای - ۴ حوزه">
    <p className="maturity-readiness-summary">۴ مورد نیازمند بازبینی است</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دسترسی و هویت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۱ (۰٪) / ۰ از ۱ (۰٪)</span>
        <span>۱ شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی و عملیات کانال</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۶ (۰٪) / ۰ از ۶ (۰٪)</span>
        <span>۶ شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مسیریابی و تحویل گفتگو</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۱ (۰٪) / ۰ از ۱ (۰٪)</span>
        <span>۱ شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">رسانه و محتوای غنی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۱ (۰٪) / ۰ از ۱ (۰٪)</span>
        <span>۱ شکاف قابلیتی</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="زمان اجرای Gateway - ۱۳ حوزه">
    <p className="maturity-readiness-summary">۹ مورد نیازمند بازبینی / ۴ مورد تا حدی بازبینی‌شده</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تأییدها و اجرای راه‌دور</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۶ (۰٪) / ۰ از ۶ (۰٪)</span>
        <span>۶ شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">احراز هویت و جفت‌سازی دستگاه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۱۰ (۰٪) / ۰ از ۱۰ (۰٪)</span>
        <span>۱۰ شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">چرخه عمر Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی‌شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۷ (۰٪) / ۴ از ۱۲ (۳۳٫۳٪)</span>
        <span>۸ شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">APIهای RPC و رویدادهای Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی‌شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۲۰ (۰٪) / ۲ از ۲۲ (۹٫۱٪)</span>
        <span>۲۰ شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سلامت، عیب‌یابی و ترمیم</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۷ (۰٪) / ۰ از ۷ (۰٪)</span>
        <span>۷ شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سطح وب میزبانی‌شده</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۴ (۰٪) / ۰ از ۴ (۰٪)</span>
        <span>۴ شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">APIهای HTTP</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی‌شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۱ از ۴ (۲۵٪) / ۱ از ۴ (۲۵٪)</span>
        <span>۳ شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دسترسی و کشف شبکه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۶ (۰٪) / ۰ از ۶ (۰٪)</span>
        <span>۶ شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Nodeها و قابلیت‌های راه‌دور</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۸ (۰٪) / ۰ از ۸ (۰٪)</span>
        <span>۸ شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سازگاری پروتکل</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۷ (۰٪) / ۰ از ۷ (۰٪)</span>
        <span>۷ شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">نقش‌ها و مجوزها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۵ (۰٪) / ۰ از ۵ (۰٪)</span>
        <span>۵ شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">کنترل‌های امنیتی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۶ (۰٪) / ۰ از ۶ (۰٪)</span>
        <span>۶ شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اتصال WebSocket</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی‌شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۱ از ۸ (۱۲٫۵٪) / ۱ از ۸ (۱۲٫۵٪)</span>
        <span>۷ شکاف قابلیتی</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat - ۵ حوزه">
    <p className="maturity-readiness-summary">۵ مورد نیازمند بازبینی است</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دسترسی و هویت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۱۱ (۰٪) / ۰ از ۱۱ (۰٪)</span>
        <span>۱۱ شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی و عملیات کانال</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۱۶ (۰٪) / ۰ از ۱۶ (۰٪)</span>
        <span>۱۶ شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مسیریابی و تحویل گفتگو</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۱ (۰٪) / ۰ از ۱ (۰٪)</span>
        <span>۱ شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">رسانه و محتوای غنی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۱ (۰٪) / ۰ از ۱ (۰٪)</span>
        <span>۱ شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">کنترل‌ها و تأییدهای بومی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۱۶ (۰٪) / ۰ از ۱۶ (۰٪)</span>
        <span>۱۶ شکاف قابلیتی</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="مسیر ارائه‌دهنده Google - 5 حوزه">
    <p className="maturity-readiness-summary">5 مورد نیازمند بازبینی است</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">زمان‌اجرای مستقیم Gemini</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 9 (0%) / 0 از 9 (0%)</span>
        <span>9 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">رسانه، جست‌وجو، و بلادرنگ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 10 (0%) / 0 از 10 (0%)</span>
        <span>10 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مسیریابی مدل و نقاط پایانی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 10 (0%) / 0 از 10 (0%)</span>
        <span>10 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">کش‌کردن پرامپت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی ارائه‌دهنده و اعتبارنامه‌ها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 10 (0%) / 0 از 10 (0%)</span>
        <span>10 شکاف قابلیتی</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ابزارهای تولید تصویر، ویدئو، و موسیقی - 5 حوزه">
    <p className="maturity-readiness-summary">5 مورد نیازمند بازبینی است</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تولید تصویر</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 9 (0%) / 0 از 9 (0%)</span>
        <span>9 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مسیریابی و کشف رسانه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 0 از 4 (0%)</span>
        <span>4 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تولید موسیقی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 6 (0%) / 0 از 6 (0%)</span>
        <span>6 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">چرخه عمر و تحویل وظیفه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 12 (0%) / 0 از 12 (0%)</span>
        <span>12 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تولید ویدئو</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 11 (0%) / 0 از 11 (0%)</span>
        <span>11 شکاف قابلیتی</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessage و BlueBubbles - 5 حوزه">
    <p className="maturity-readiness-summary">5 مورد نیازمند بازبینی است</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دسترسی و هویت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 6 (0%) / 0 از 6 (0%)</span>
        <span>6 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی و عملیات کانال</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 11 (0%) / 0 از 11 (0%)</span>
        <span>11 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مسیریابی و تحویل گفت‌وگو</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 0 از 4 (0%)</span>
        <span>4 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">رسانه و محتوای غنی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 7 (0%) / 0 از 7 (0%)</span>
        <span>7 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">کنترل‌ها و تأییدیه‌های بومی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 3 (0%) / 0 از 3 (0%)</span>
        <span>3 شکاف قابلیتی</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="برنامه iOS - 8 حوزه">
    <p className="maturity-readiness-summary">8 مورد نیازمند بازبینی است</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas و صفحه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">چت و نشست‌ها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دستورهای دستگاه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 2 (0%) / 0 از 2 (0%)</span>
        <span>2 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توزیع</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی و عیب‌یابی Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 7 (0%) / 0 از 7 (0%)</span>
        <span>7 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">رسانه و اشتراک‌گذاری</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اعلان‌ها و پس‌زمینه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">صدا</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیتی</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="میزبانی Kubernetes - 4 حوزه">
    <p className="maturity-readiness-summary">4 مورد نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دسترسی و در معرض‌گذاری</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">چرخه عمر کلاستر</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">پیکربندی و اسرار</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی استقرار</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="اپ همراه Linux - 5 حوزه">
    <p className="maturity-readiness-summary">5 مورد نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توزیع اپ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 3 (0%) / 0 از 3 (0%)</span>
        <span>3 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">گفت‌وگو و نشست‌ها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 3 (0%) / 0 از 3 (0%)</span>
        <span>3 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">قابلیت‌های دسکتاپ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 9 (0%) / 0 از 9 (0%)</span>
        <span>9 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اتصال Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 0 از 4 (0%)</span>
        <span>4 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">وضعیت و عیب‌یابی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 7 (0%) / 0 از 7 (0%)</span>
        <span>7 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="میزبان Gateway در Linux - 5 حوزه">
    <p className="maturity-readiness-summary">5 مورد نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اهداف استقرار</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 3 (0%) / 0 از 3 (0%)</span>
        <span>3 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عیب‌یابی و تعمیر</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 0 از 4 (0%)</span>
        <span>4 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">زمان اجرای Gateway و کنترل سرویس</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 6 (0%) / 0 از 6 (0%)</span>
        <span>6 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی میزبان و به‌روزرسانی‌ها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 0 از 4 (0%)</span>
        <span>4 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دسترسی راه دور و امنیت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 6 (0%) / 0 از 6 (0%)</span>
        <span>6 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ارائه‌دهندگان مدل محلی: Ollama، vLLM، SGLang، LM Studio - 5 حوزه">
    <p className="maturity-readiness-summary">5 مورد نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">حافظه محلی و Embeddings</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pluginهای ارائه‌دهنده بومی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 10 (0%) / 0 از 10 (0%)</span>
        <span>10 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ایمنی شبکه و کنترل‌های پرامپت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 2 (0%) / 0 از 2 (0%)</span>
        <span>2 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سازگاری زمان اجرای سازگار با OpenAI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 8 (0%) / 0 از 8 (0%)</span>
        <span>8 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی، چرخه عمر و عیب‌یابی ارائه‌دهنده</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 12 (0%) / 0 از 12 (0%)</span>
        <span>12 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ارائه‌دهندگان میزبانی‌شده دنباله‌بلند - 3 حوزه">
    <p className="maturity-readiness-summary">3 مورد نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ارائه‌دهندگان LLM میزبانی‌شده</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 12 (0%) / 0 از 12 (0%)</span>
        <span>12 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ارائه‌دهندگان رسانه میزبانی‌شده</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 8 (0%) / 0 از 8 (0%)</span>
        <span>8 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عملیات ارائه‌دهنده</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 12 (0%) / 0 از 12 (0%)</span>
        <span>12 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="برنامه همراه macOS - 8 حوزه">
    <p className="maturity-readiness-summary">8 نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">بوم</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 0 از 4 (0%)</span>
        <span>4 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی محلی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 7 (0%) / 0 از 7 (0%)</span>
        <span>7 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">قابلیت‌های بومی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اتصال‌های راه دور</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 3 (0%) / 0 از 3 (0%)</span>
        <span>3 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">وب‌چت راه دور</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">وضعیت و تنظیمات</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">صدا و گفت‌وگو</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 3 (0%) / 0 از 3 (0%)</span>
        <span>3 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">وب‌چت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 3 (0%) / 0 از 3 (0%)</span>
        <span>3 شکاف قابلیتی</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="میزبان Gateway در macOS - 7 حوزه">
    <p className="maturity-readiness-summary">7 نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 0 از 4 (0%)</span>
        <span>4 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عیب‌یابی و مشاهده‌پذیری</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 0 از 4 (0%)</span>
        <span>4 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">چرخه عمر سرویس Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 10 (0%) / 0 از 10 (0%)</span>
        <span>10 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">یکپارچه‌سازی Gateway محلی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 9 (0%) / 0 از 9 (0%)</span>
        <span>9 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مجوزها و قابلیت‌های بومی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 0 از 4 (0%)</span>
        <span>4 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">پروفایل‌ها و جداسازی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">حالت Gateway راه دور</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیتی</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Matrix - 6 حوزه">
    <p className="maturity-readiness-summary">6 نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دسترسی و هویت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 7 (0%) / 0 از 7 (0%)</span>
        <span>7 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی و عملیات کانال</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مسیریابی و تحویل مکالمه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">رمزنگاری و راستی‌آزمایی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 3 (0%) / 0 از 3 (0%)</span>
        <span>3 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">رسانه و محتوای غنی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">کنترل‌های بومی و تأییدها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 6 (0%) / 0 از 6 (0%)</span>
        <span>6 شکاف قابلیتی</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mattermost، LINE، IRC، Nextcloud Talk، Nostr، Twitch، Tlon، Synology Chat - 4 حوزه">
    <p className="maturity-readiness-summary">4 مورد نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دسترسی و هویت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی و عملیات کانال</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مسیریابی و تحویل گفتگو</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">رسانه و محتوای غنی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="درک رسانه و تولید رسانه - 6 حوزه">
    <p className="maturity-readiness-summary">4 مورد نیازمند بازبینی / 2 مورد تا حدی بازبینی‌شده</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مدیریت رسانه در کانال</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">پیکربندی رسانه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تولید رسانه</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی‌شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>1 از 17 (5.9%) / 1 از 19 (5.3%)</span>
        <span>18 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دریافت و دسترسی رسانه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 8 (0%) / 0 از 8 (0%)</span>
        <span>8 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">درک رسانه</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی‌شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 12 (0%) / 1 از 14 (7.1%)</span>
        <span>13 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تحویل متن به گفتار</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 2 (0%) / 0 از 2 (0%)</span>
        <span>2 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams - 5 حوزه">
    <p className="maturity-readiness-summary">5 مورد نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دسترسی و هویت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 9 (0%) / 0 از 9 (0%)</span>
        <span>9 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی و عملیات کانال</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 9 (0%) / 0 از 9 (0%)</span>
        <span>9 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مسیریابی و تحویل گفتگو</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">رسانه و محتوای غنی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">کنترل‌ها و تأییدیه‌های بومی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows بومی - 4 حوزه">
    <p className="maturity-readiness-summary">4 مورد نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 9 (0%) / 0 از 9 (0%)</span>
        <span>9 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مدیریت Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 11 (0%) / 0 از 11 (0%)</span>
        <span>11 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">شبکه‌سازی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 0 از 4 (0%)</span>
        <span>4 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">به‌روزرسانی‌ها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 0 از 4 (0%)</span>
        <span>4 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="برنامه همراه بومی Windows - 5 حوزه">
    <p className="maturity-readiness-summary">5 نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>قابلیت‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">نشست‌های چت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 2 (0%) / 0 از 2 (0%)</span>
        <span>2 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ابزارها و مجوزهای دسکتاپ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 10 (0%) / 0 از 10 (0%)</span>
        <span>10 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اتصال Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 3 (0%) / 0 از 3 (0%)</span>
        <span>3 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">نصب و به‌روزرسانی‌ها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 0 از 4 (0%)</span>
        <span>4 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">وضعیت و تعمیر</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="مسیر نصب Nix - 5 حوزه">
    <p className="maturity-readiness-summary">5 نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>قابلیت‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">فعال‌سازی و تجربه کاربری برنامه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 7 (0%) / 0 از 7 (0%)</span>
        <span>7 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">پیکربندی و وضعیت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 7 (0%) / 0 از 7 (0%)</span>
        <span>7 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تحویل نصب</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 0 از 4 (0%)</span>
        <span>4 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">چرخه عمر Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 0 از 4 (0%)</span>
        <span>4 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">زمان اجرای سرویس و محافظ‌ها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 8 (0%) / 0 از 8 (0%)</span>
        <span>8 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="مسیر ارائه‌دهنده OpenAI و Codex - 5 حوزه">
    <p className="maturity-readiness-summary">2 نیازمند بازبینی / 3 تاحدی بازبینی‌شده</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>قابلیت‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ورودی تصویر و چندوجهی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 2 (0%) / 0 از 2 (0%)</span>
        <span>2 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مدل و احراز هویت</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تاحدی بازبینی‌شده - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>1 از 6 (16.7%) / 4 از 9 (44.4%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مهار بومی Codex</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تاحدی بازبینی‌شده - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 2 (0%) / 4 از 9 (44.4%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سازگاری پاسخ‌ها و ابزارها</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تاحدی بازبینی‌شده - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>1 از 4 (25%) / 2 از 5 (40%)</span>
        <span>3 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">صدا و صوت بلادرنگ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 2 (0%) / 0 از 2 (0%)</span>
        <span>2 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenClaw App SDK - 6 حوزه">
    <p className="maturity-readiness-summary">5 نیازمند بازبینی / 1 تاحدی بازبینی‌شده</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>قابلیت‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">گفتگوهای عامل</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 6 (0%) / 0 از 6 (0%)</span>
        <span>6 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API کلاینت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 0 از 4 (0%)</span>
        <span>4 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سازگاری</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">رویدادها و تأییدها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دسترسی Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">کمک‌کننده‌های منبع</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تاحدی بازبینی‌شده - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 1 از 6 (16.7%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="مسیر ارائه‌دهنده OpenRouter - 4 حوزه">
    <p className="maturity-readiness-summary">4 مورد نیازمند بازبینی است</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">زمان اجرای چت و نرمال‌سازی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 15 (0%) / 0 از 15 (0%)</span>
        <span>15 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تولید رسانه و گفتار</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 7 (0%) / 0 از 7 (0%)</span>
        <span>7 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">بازیابی و عیب‌یابی ارائه‌دهنده</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی و احراز هویت ارائه‌دهنده</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 14 (0%) / 0 از 14 (0%)</span>
        <span>14 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Pluginها - 9 حوزه">
    <p className="maturity-readiness-summary">6 مورد نیازمند بازبینی / 3 مورد تا حدی بازبینی شده</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تألیف و بسته‌بندی Pluginها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 8 (0%) / 0 از 8 (0%)</span>
        <span>8 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pluginهای همراه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin بوم</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 6 (0%) / 0 از 6 (0%)</span>
        <span>6 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pluginهای کانال</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">نصب و اجرای Pluginها</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 6 (0%) / 7 از 20 (35%)</span>
        <span>13 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تأییدهای Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 6 (0%) / 0 از 6 (0%)</span>
        <span>6 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pluginهای ارائه‌دهنده و ابزار</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>1 از 6 (16.7%) / 9 از 21 (42.9%)</span>
        <span>12 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">انتشار Pluginها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 6 (0%) / 0 از 6 (0%)</span>
        <span>6 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">آزمون Pluginها</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 6 (0%) / 3 از 11 (27.3%)</span>
        <span>8 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi و دستگاه‌های کوچک Linux - 4 حوزه">
    <p className="maturity-readiness-summary">4 مورد نیازمند بازبینی است</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">زمان اجرای Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 10 (0%) / 0 از 10 (0%)</span>
        <span>10 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">کارایی و عیب‌یابی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دسترسی راه دور و احراز هویت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 9 (0%) / 0 از 9 (0%)</span>
        <span>9 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی و سازگاری</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 12 (0%) / 0 از 12 (0%)</span>
        <span>12 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="امنیت، احراز هویت، جفت‌سازی و اسرار - 6 حوزه">
    <p className="maturity-readiness-summary">2 مورد تا حدی بازبینی شده / 4 مورد نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سیاست تأیید و حفاظت‌های ابزار</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 2 (0%) / 3 از 6 (50%)</span>
        <span>3 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">کنترل دسترسی کانال</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 3 (0%) / 0 از 3 (0%)</span>
        <span>3 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">بهداشت اعتبارنامه‌ها و اسرار</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 5 از 11 (45.5%)</span>
        <span>6 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">جفت‌سازی دستگاه و Node</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 11 (0%) / 0 از 11 (0%)</span>
        <span>11 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">احراز هویت Gateway و دسترسی راه دور</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 9 (0%) / 0 از 9 (0%)</span>
        <span>9 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اعتماد Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>0 از 2 (0%) / 0 از 2 (0%)</span>
        <span>2 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="نشست، حافظه، و موتور زمینه - 9 حوزه">
    <p className="maturity-readiness-summary">2 نیازمند بازبینی / 7 تا حدی بازبینی شده</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مدیریت نشست و رونوشت CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 2 (0%) / 0 از 2 (0%)</span>
        <span>2 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">موتور زمینه</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی شده - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 2 (0%) / 4 از 7 (57.1%)</span>
        <span>3 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">پرامپت‌ها و زمینه هسته</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی شده - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 2 (0%) / 3 از 8 (37.5%)</span>
        <span>5 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">برابری تاریخچه و نشست میان کلاینت‌ها</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی شده - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 2 (0%) / 2 از 5 (40%)</span>
        <span>3 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عیب‌یابی، نگهداری، و بازیابی</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی شده - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 3 (0%) / 4 از 10 (40%)</span>
        <span>6 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">حافظه</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی شده - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 6 از 13 (46.2%)</span>
        <span>7 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مسیریابی نشست</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی شده - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 2 (0%) / 1 از 4 (25%)</span>
        <span>3 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مدیریت توکن</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی شده - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 3 (0%) / 2 از 10 (20%)</span>
        <span>8 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ماندگاری رونوشت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 2 (0%) / 0 از 2 (0%)</span>
        <span>2 شکاف قابلیتی</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal - 5 حوزه">
    <p className="maturity-readiness-summary">5 نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دسترسی و هویت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 6 (0%) / 0 از 6 (0%)</span>
        <span>6 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی و عملیات کانال</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 7 (0%) / 0 از 7 (0%)</span>
        <span>7 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مسیریابی و تحویل گفتگو</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">رسانه و محتوای غنی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 7 (0%) / 0 از 7 (0%)</span>
        <span>7 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">کنترل‌ها و تأییدهای بومی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 3 (0%) / 0 از 3 (0%)</span>
        <span>3 شکاف قابلیتی</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack - 5 حوزه">
    <p className="maturity-readiness-summary">5 نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دسترسی و هویت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی و عملیات کانال</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 10 (0%) / 0 از 10 (0%)</span>
        <span>10 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مسیریابی و تحویل گفتگو</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">رسانه و محتوای غنی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">کنترل‌ها و تأییدهای بومی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 8 (0%) / 0 از 8 (0%)</span>
        <span>8 شکاف قابلیتی</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram - 5 حوزه">
    <p className="maturity-readiness-summary">5 نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دسترسی و هویت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 10 (0%) / 0 از 10 (0%)</span>
        <span>10 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی و عملیات کانال</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 10 (0%) / 0 از 10 (0%)</span>
        <span>10 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مسیریابی و تحویل گفتگو</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">رسانه و محتوای غنی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 1 (0%) / 0 از 1 (0%)</span>
        <span>1 شکاف قابلیتی</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">کنترل‌ها و تأییدهای بومی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 9 (0%) / 0 از 9 (0%)</span>
        <span>9 شکاف قابلیتی</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="مشاهده‌پذیری - ۵ حوزه">
    <p className="maturity-readiness-summary">۳ تا حدی بازبینی‌شده / ۲ نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">گردآوری تشخیصی</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی‌شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۱ از ۸ (۱۲.۵٪) / ۳ از ۱۰ (۳۰٪)</span>
        <span>۷ شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">سلامت و ترمیم</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی‌شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۱ از ۱۲ (۸.۳٪) / ۵ از ۱۸ (۲۷.۸٪)</span>
        <span>۱۳ شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ثبت وقایع</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۵ (۰٪) / ۰ از ۵ (۰٪)</span>
        <span>۵ شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عیب‌یابی نشست</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۴ (۰٪) / ۰ از ۴ (۰٪)</span>
        <span>۴ شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">برون‌بری تله‌متری</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی‌شده - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۱ از ۱۳ (۷.۷٪) / ۷ از ۲۱ (۳۳.۳٪)</span>
        <span>۱۴ شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="TUI - ۵ حوزه">
    <p className="maturity-readiness-summary">۵ نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ورودی و دستورها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۸ (۰٪) / ۰ از ۸ (۰٪)</span>
        <span>۸ شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اجرای پوسته محلی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۴ (۰٪) / ۰ از ۴ (۰٪)</span>
        <span>۴ شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ایمنی رندر و خروجی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۴ (۰٪) / ۰ از ۴ (۰٪)</span>
        <span>۴ شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">حالت‌های زمان اجرا</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۱۴ (۰٪) / ۰ از ۱۴ (۰٪)</span>
        <span>۱۴ شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مدیریت نشست</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۳ (۰٪) / ۰ از ۳ (۰٪)</span>
        <span>۳ شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="صدا و گفت‌وگوی بی‌درنگ - ۶ حوزه">
    <p className="maturity-readiness-summary">۶ نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">گفت‌وگو در برنامه بومی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۴ (۰٪) / ۰ از ۴ (۰٪)</span>
        <span>۴ شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">نشست‌های گفت‌وگوی بی‌درنگ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۱۱ (۰٪) / ۰ از ۱۱ (۰٪)</span>
        <span>۱۱ شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">گفتار و رونویسی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۵ (۰٪) / ۰ از ۵ (۰٪)</span>
        <span>۵ شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مشاهده‌پذیری گفت‌وگو</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۵ (۰٪) / ۰ از ۵ (۰٪)</span>
        <span>۵ شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ارائه‌دهندگان گفت‌وگو</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۷ (۰٪) / ۰ از ۷ (۰٪)</span>
        <span>۷ شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">بیدارباش صوتی و مسیریابی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۴ (۰٪) / ۰ از ۴ (۰٪)</span>
        <span>۴ شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="کانال تماس صوتی - ۵ حوزه">
    <p className="maturity-readiness-summary">۵ نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دسترسی و هویت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۱ (۰٪) / ۰ از ۱ (۰٪)</span>
        <span>۱ شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی و عملیات کانال</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۲ (۰٪) / ۰ از ۲ (۰٪)</span>
        <span>۲ شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مسیریابی و تحویل مکالمه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۱ (۰٪) / ۰ از ۱ (۰٪)</span>
        <span>۱ شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">رسانه و محتوای غنی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۲ (۰٪) / ۰ از ۲ (۰٪)</span>
        <span>۲ شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">صدای بی‌درنگ و تماس‌ها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل رده‌بندی</span>
        </div>
        <span>۰ از ۲ (۰٪) / ۰ از ۲ (۰٪)</span>
        <span>۲ شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="سطوح همراه watchOS - 5 حوزه">
    <p className="maturity-readiness-summary">5 مورد نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تحویل و بازیابی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 7 (0%) / 0 از 7 (0%)</span>
        <span>7 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">توزیع و پشتیبانی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 6 (0%) / 0 از 6 (0%)</span>
        <span>6 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">تأییدهای اجرایی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 3 (0%) / 0 از 3 (0%)</span>
        <span>3 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">اعلان‌ها و پاسخ‌ها</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 7 (0%) / 0 از 7 (0%)</span>
        <span>7 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">رابط کاربری اپ Watch</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 3 (0%) / 0 از 3 (0%)</span>
        <span>3 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ابزارهای جستجوی وب - 4 حوزه">
    <p className="maturity-readiness-summary">2 مورد نیازمند بازبینی / 2 مورد تا حدی بازبینی‌شده</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ایمنی شبکه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 0 از 4 (0%)</span>
        <span>4 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ارائه‌دهندگان جستجو</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی‌شده - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>2 از 19 (10.5%) / 2 از 19 (10.5%)</span>
        <span>17 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی و عیب‌یابی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 9 (0%) / 0 از 9 (0%)</span>
        <span>9 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دسترس‌پذیری ابزار و دریافت</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی‌شده - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>2 از 11 (18.2%) / 3 از 12 (25%)</span>
        <span>9 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp - 5 حوزه">
    <p className="maturity-readiness-summary">5 مورد نیازمند بازبینی</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دسترسی و هویت</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 7 (0%) / 0 از 7 (0%)</span>
        <span>7 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی و عملیات کانال</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 5 (0%) / 0 از 5 (0%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مسیریابی و تحویل مکالمه</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 4 (0%) / 0 از 4 (0%)</span>
        <span>4 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">رسانه و محتوای غنی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 2 (0%) / 0 از 2 (0%)</span>
        <span>2 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">کنترل‌ها و تأییدهای بومی</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 2 (0%) / 0 از 2 (0%)</span>
        <span>2 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows از طریق WSL2 - 6 حوزه">
    <p className="maturity-readiness-summary">5 مورد نیازمند بازبینی / 1 مورد تا حدی بازبینی‌شده</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>حوزه</span><span>ویژگی‌ها / شناسه‌های پوشش</span><span>پیگیری</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">مرورگر و رابط کاربری کنترل</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 6 (0%) / 0 از 6 (0%)</span>
        <span>6 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 8 (0%) / 0 از 8 (0%)</span>
        <span>8 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">عیب‌یابی و تعمیر</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">تا حدی بازبینی‌شده - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>1 از 6 (16.7%) / 3 از 8 (37.5%)</span>
        <span>5 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">دسترسی و در معرض‌گذاری Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 11 (0%) / 0 از 11 (0%)</span>
        <span>11 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">چرخه عمر سرویس Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 10 (0%) / 0 از 10 (0%)</span>
        <span>10 شکاف قابلیت</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">راه‌اندازی WSL</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">نیازمند بازبینی - اعتبارسنجی کامل طبقه‌بندی</span>
        </div>
        <span>0 از 6 (0%) / 0 از 6 (0%)</span>
        <span>6 شکاف قابلیت</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> آخرین به‌روزرسانی: 2026-06-22
