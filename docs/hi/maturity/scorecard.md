---
summary: उत्पाद क्षेत्रों, इंटीग्रेशन और समर्थित वर्कफ़्लो के लिए OpenClaw रिलीज़ तैयारी स्कोर।
title: परिपक्वता स्कोरकार्ड
x-i18n:
    generated_at: "2026-06-28T23:24:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 916f070ca42778dc1cc41e47cdb4ace502f073c4e888f21526b762226a856d40
    source_path: maturity/scorecard.md
    workflow: 16
---

# परिपक्वता स्कोरकार्ड

<div className="maturity-hero">
  <p className="maturity-kicker">रिलीज़ तैयारी - टैक्सोनॉमी + QA साक्ष्य से जनरेट किया गया</p>
  <p className="maturity-hero-title">क्या तैयार है, क्या प्रमाणित है, और किस पर अभी काम चाहिए, इसका व्यावहारिक दृश्य।</p>
  <p>50 सतहें - 281 क्षमता क्षेत्र - निर्धारक कवरेज के साथ मानव-समीक्षित गुणवत्ता और पूर्णता।</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">सतहें ब्राउज़ करें</a> / <a href="#qa-evidence-summary">QA साक्ष्य देखें</a> / <a href="/hi/maturity/taxonomy">टैक्सोनॉमी पढ़ें</a></p>
</div>

## यह पेज किसलिए है

इस पेज का उपयोग एक प्रश्न का उत्तर देने के लिए करें: कौन-सी OpenClaw सतहें रिलीज़ के लिए विश्वसनीय विकल्प हैं, और कौन-सा साक्ष्य उस निर्णय का समर्थन करता है? कवरेज निर्धारक QA साक्ष्य से आता है; गुणवत्ता और पूर्णता को समीक्षित परिपक्वता स्कोर के रूप में बनाए रखा जाता है।

## एक नज़र में

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">67%</span>
      <span>परिपक्वता स्कोर</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "67" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span>
      <span>गुणवत्ता + पूर्णता</span>
      <span>कवरेज प्रायोगिक - 4%</span>
      <span>गुणवत्ता अल्फ़ा - 63%</span>
      <span>पूर्णता बीटा - 70%</span>
    </div>
  </div>
</div>

कवरेज जानबूझकर साक्ष्य-आधारित है: कोई क्षेत्र केवल इसलिए "तैयार" नहीं हो जाता क्योंकि कार्यान्वयन मौजूद है। यह परिपक्वता स्कोर का इनपुट नहीं है, लेकिन OpenClaw का लक्ष्य समय के साथ परिपक्व स्थिर-या-बेहतर सुविधाओं के लिए एंड-टू-एंड कवरेज को 90% से ऊपर बनाए रखना है।

## स्कोर बैंड

<div className="maturity-band-list">
  <div className="maturity-band maturity-band-experimental"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span></span><span>0-50%</span></div>
  <div className="maturity-band maturity-band-alpha"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span></span><span>50-70%</span></div>
  <div className="maturity-band maturity-band-beta"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-beta">बीटा</span></span><span>70-80%</span></div>
  <div className="maturity-band maturity-band-stable"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-stable">स्थिर</span></span><span>80-95%</span></div>
  <div className="maturity-band maturity-band-clawesome"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-clawesome">Clawesome</span></span><span>95-100%</span></div>
</div>

## सतह एक्सप्लोरर

<a id="surface-explorer" />

सतहों को परिपक्वता स्तर, पूर्णता, और गुणवत्ता के क्रम में रखा गया है। LTS समर्थन प्रत्येक पंक्ति के साथ दिखाया जाता है ताकि रिलीज़-तैयार विकल्पों की तुलना करना आसान हो।

  <Tabs>
  <Tab title="सभी सतहें">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>सतह</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>समर्थन</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>स्थिर</span></span><span>7 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Gateway रनटाइम</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>स्थिर</span></span><span>13 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Linux Gateway होस्ट</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>स्थिर</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">macOS Gateway होस्ट</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>स्थिर</span></span><span>7 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>स्थिर</span></span><span>6 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">एजेंट रनटाइम</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>9 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">सेशन, मेमोरी, और कॉन्टेक्स्ट इंजन</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">चैनल फ्रेमवर्क</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">ब्राउज़र ऑटोमेशन, exec, और सैंडबॉक्स टूल</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#observability"><span className="maturity-surface-title">ऑब्ज़र्वेबिलिटी</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">OpenAI और Codex प्रदाता पथ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Gateway वेब ऐप</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">वेब खोज टूल</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugins</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>9 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">सुरक्षा, auth, pairing, और secrets</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>6 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">ऑटोमेशन: Cron, hooks, tasks, polling</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>6 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Docker और Podman hosting</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>4 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">WSL2 के माध्यम से Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>6 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi और छोटे Linux डिवाइस</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>4 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Anthropic प्रदाता पथ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">पूर्ण - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">पूर्ण - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Google प्रदाता पथ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage और BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">macOS साथी ऐप</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">OpenRouter प्रदाता पथ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>4 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">मीडिया समझ और मीडिया जनरेशन</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फा</span></span><span>6 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">छवि, वीडियो, और संगीत जनरेशन टूल</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फा</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">स्थानीय मॉडल प्रदाता: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फा</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">लॉन्ग-टेल होस्टेड प्रदाता</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फा</span></span><span>3 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">आवाज़ और रीयलटाइम बातचीत</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>6 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>6 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#android-app"><span className="maturity-surface-title">Android ऐप</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>7 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#native-windows"><span className="maturity-surface-title">नेटिव Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फा</span></span><span>4 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फा</span></span><span>4 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Kubernetes होस्टिंग</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फा</span></span><span>4 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, क्षेत्रीय चैनल</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फा</span></span><span>4 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फा</span></span><span>4 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw App SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फा</span></span><span>6 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#ios-app"><span className="maturity-surface-title">iOS ऐप</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>प्रायोगिक</span></span><span>8 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Nix इंस्टॉल पथ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>प्रायोगिक</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">वॉइस कॉल चैनल</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>प्रायोगिक</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">watchOS सहचर सतहें</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>प्रायोगिक</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Linux सहचर ऐप</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>नियोजित</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">नेटिव Windows सहचर ऐप</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>नियोजित</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="कोर">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>सतह</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>समर्थन</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>स्थिर</span></span><span>7 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Gateway रनटाइम</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>स्थिर</span></span><span>13 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">एजेंट रनटाइम</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>9 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">सत्र, मेमोरी, और संदर्भ इंजन</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>9 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">चैनल फ्रेमवर्क</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>8 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#observability"><span className="maturity-surface-title">प्रेक्षणीयता</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Gateway वेब ऐप</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>6 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugin</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>9 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">सुरक्षा, प्रमाणीकरण, पेयरिंग, और सीक्रेट्स</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>6 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">स्वचालन: Cron, हुक्स, कार्य, पोलिंग</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>6 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">मीडिया समझ और मीडिया जनरेशन</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फा</span></span><span>6 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">आवाज़ और रीयलटाइम बातचीत</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फा</span></span><span>6 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फा</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फा</span></span><span>4 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw App SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फा</span></span><span>6 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Platform">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>सतह</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>समर्थन</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Linux Gateway होस्ट</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>स्थिर</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">macOS Gateway होस्ट</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>स्थिर</span></span><span>7 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Docker और Podman होस्टिंग</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>4 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">WSL2 के माध्यम से Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>6 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi और छोटे Linux डिवाइस</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>4 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">macOS सहचर ऐप</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>8 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#android-app"><span className="maturity-surface-title">Android ऐप</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फा</span></span><span>7 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#native-windows"><span className="maturity-surface-title">नेटिव Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फा</span></span><span>4 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Kubernetes होस्टिंग</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फा</span></span><span>4 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#ios-app"><span className="maturity-surface-title">iOS ऐप</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>प्रायोगिक</span></span><span>8 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Nix इंस्टॉल पथ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>प्रायोगिक</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">watchOS सहचर सतहें</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>प्रायोगिक</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Linux सहचर ऐप</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>नियोजित</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">नेटिव Windows सहचर ऐप</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>नियोजित</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="चैनल">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>सतह</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>समर्थन</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>स्थिर</span></span><span>6 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">पूर्ण - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">पूर्ण - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage और BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>6 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, क्षेत्रीय चैनल</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">वॉइस कॉल चैनल</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>प्रायोगिक</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="प्रदाता और टूल">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>सतह</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>समर्थन</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">ब्राउज़र ऑटोमेशन, exec, और sandbox टूल</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">OpenAI और Codex प्रदाता पथ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">आंशिक - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">वेब खोज उपकरण</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>4 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Anthropic प्रदाता पथ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Google प्रदाता पथ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">OpenRouter प्रदाता पथ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>4 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">छवि, वीडियो, और संगीत निर्माण उपकरण</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फा</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">स्थानीय मॉडल प्रदाता: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फा</span></span><span>5 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/hi/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">लॉन्ग-टेल होस्टेड प्रदाता</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>3 क्षेत्र</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">कवरेज</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">गुणवत्ता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">पूर्णता</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">कोई नहीं</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## QA साक्ष्य सारांश

नीचे दी गई जाँचें दिखाती हैं कि QA प्रोफ़ाइल साक्ष्य ने किन स्कोरकार्ड क्षेत्रों का अभ्यास किया।

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">पूर्ण टैक्सोनॉमी सत्यापन</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>96 जाँचें - 94 पास, 2 अवरुद्ध</span>
    <span>281 में से 0 (0%) क्षेत्र - 1675 में से 20 (1.2%) सुविधाएँ - 1665 में से 77 (4.6%) कवरेज IDs</span>
  </div>
</div>

### क्षेत्र के अनुसार तैयारी

हर श्रेणी की साक्ष्य स्थिति देखने के लिए कोई सतह खोलें। सूची संक्षिप्त रहती है ताकि पेज एक नज़र में उपयोगी बना रहे।

<AccordionGroup>
  <Accordion title="Agent रनटाइम - 9 क्षेत्र">
    <p className="maturity-readiness-summary">8 की आंशिक समीक्षा / 1 को समीक्षा चाहिए</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज IDs</span><span>अनुवर्ती कार्रवाई</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Agent Turn निष्पादन</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>3 में से 0 (0%) / 24 में से 7 (29.2%)</span>
        <span>17 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">बाहरी रनटाइम और Subagents</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 10 में से 3 (30%)</span>
        <span>7 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">होस्टेड प्रदाता निष्पादन</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 1 (20%) / 5 में से 1 (20%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">स्थानीय और स्वयं-होस्टेड प्रदाता</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मॉडल और रनटाइम चयन</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 8 में से 2 (25%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">प्रदाता प्रमाणीकरण</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>10 में से 0 (0%) / 17 में से 4 (23.5%)</span>
        <span>13 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">स्ट्रीमिंग और प्रगति</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>2 में से 0 (0%) / 9 में से 5 (55.6%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">टूल कॉल और प्रतिक्रिया प्रबंधन</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>3 में से 0 (0%) / 23 में से 15 (65.2%)</span>
        <span>8 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">टूल निष्पादन नियंत्रण</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 12 में से 6 (50%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Android ऐप - 7 क्षेत्र">
    <p className="maturity-readiness-summary">7 को समीक्षा चाहिए</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज IDs</span><span>अनुवर्ती कार्रवाई</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">कनेक्शन सेटअप</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">डिवाइस रनटाइम</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>2 में से 0 (0%) / 2 में से 0 (0%)</span>
        <span>2 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">वितरण</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>3 में से 0 (0%) / 3 में से 0 (0%)</span>
        <span>3 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया कैप्चर</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मोबाइल चैट</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">सेटिंग्स</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">वॉइस</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Anthropic प्रदाता पथ - 5 क्षेत्र">
    <p className="maturity-readiness-summary">5 को समीक्षा चाहिए</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज IDs</span><span>अनुवर्ती कार्रवाई</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया इनपुट</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मॉडल और रनटाइम चयन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>10 में से 0 (0%) / 12 में से 0 (0%)</span>
        <span>12 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">प्रॉम्प्ट कैश और संदर्भ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">प्रदाता प्रमाणीकरण और रिकवरी</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>9 में से 0 (0%) / 9 में से 0 (0%)</span>
        <span>9 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">अनुरोध ट्रांसपोर्ट और Turn सिमैंटिक्स</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>10 में से 0 (0%) / 10 में से 0 (0%)</span>
        <span>10 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ऑटोमेशन: Cron, हुक, कार्य, पोलिंग - 6 क्षेत्र">
    <p className="maturity-readiness-summary">5 की समीक्षा आवश्यक / 1 की आंशिक समीक्षा हुई</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएं / कवरेज ID</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ऑटोमेशन हुक</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>11 में से 0 (0%) / 11 में से 0 (0%)</span>
        <span>11 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">बैकग्राउंड कार्य और फ़्लो</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>10 में से 0 (0%) / 10 में से 0 (0%)</span>
        <span>10 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cron जॉब</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>15 में से 0 (0%) / 15 में से 0 (0%)</span>
        <span>15 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ईवेंट इनग्रेस</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>15 में से 0 (0%) / 15 में से 0 (0%)</span>
        <span>15 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Heartbeat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 7 में से 1 (14.3%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">पोलिंग नियंत्रण</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>10 में से 0 (0%) / 10 में से 0 (0%)</span>
        <span>10 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ब्राउज़र ऑटोमेशन, exec, और sandbox टूल - 3 क्षेत्र">
    <p className="maturity-readiness-summary">2 की आंशिक समीक्षा हुई / 1 की समीक्षा आवश्यक</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएं / कवरेज ID</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ब्राउज़र ऑटोमेशन</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>8 में से 1 (12.5%) / 8 में से 1 (12.5%)</span>
        <span>7 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sandbox और टूल नीति</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 6 में से 0 (0%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">टूल आह्वान और निष्पादन</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 2 (33.3%) / 8 में से 4 (50%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Gateway वेब ऐप - 6 क्षेत्र">
    <p className="maturity-readiness-summary">3 की समीक्षा आवश्यक / 3 की आंशिक समीक्षा हुई</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएं / कवरेज ID</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ब्राउज़र पहुंच और भरोसा</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ब्राउज़र रीयलटाइम वार्ता</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ब्राउज़र UI</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>10 में से 0 (0%) / 12 में से 1 (8.3%)</span>
        <span>11 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">कॉन्फ़िगरेशन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ऑपरेटर कंसोल</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>10 में से 0 (0%) / 12 में से 1 (8.3%)</span>
        <span>11 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat वार्तालाप</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>15 में से 0 (0%) / 20 में से 2 (10%)</span>
        <span>18 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="चैनल फ़्रेमवर्क - 8 क्षेत्र">
    <p className="maturity-readiness-summary">4 की समीक्षा आवश्यक / 4 की आंशिक समीक्षा हुई</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएं / कवरेज ID</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">चैनल कार्रवाइयां, कमांड और अनुमोदन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">चैनल सेटअप</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 7 में से 1 (14.3%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">वार्तालाप रूटिंग और डिलीवरी</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>10 में से 0 (0%) / 27 में से 5 (18.5%)</span>
        <span>22 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ग्रुप थ्रेड और एंबियंट रूम व्यवहार</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 11 में से 4 (36.4%)</span>
        <span>7 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">इनबाउंड पहुंच और पहचान गेट</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया अटैचमेंट और समृद्ध चैनल डेटा</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">आउटबाउंड डिलीवरी और उत्तर पाइपलाइन</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 21 में से 8 (38.1%)</span>
        <span>13 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">स्थिति स्वास्थ्य और ऑपरेटर नियंत्रण</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 6 में से 0 (0%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub - 4 क्षेत्र">
    <p className="maturity-readiness-summary">4 को समीक्षा की आवश्यकता है</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज ID</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">कैटलॉग खोज</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">संगतता और भरोसा</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>12 में से 0 (0%) / 12 में से 0 (0%)</span>
        <span>12 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin जीवनचक्र और स्वास्थ्य</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>26 में से 0 (0%) / 26 में से 0 (0%)</span>
        <span>26 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">प्रकाशन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>7 में से 0 (0%) / 7 में से 0 (0%)</span>
        <span>7 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="CLI - 7 क्षेत्र">
    <p className="maturity-readiness-summary">5 को समीक्षा की आवश्यकता है / 2 की आंशिक समीक्षा हुई</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज ID</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI प्रेक्षणीयता</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI सेटअप</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 1 (16.7%) / 6 में से 1 (16.7%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Doctor</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>10 में से 0 (0%) / 10 में से 0 (0%)</span>
        <span>10 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway सेवा प्रबंधन</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 7 में से 1 (14.3%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ऑनबोर्डिंग और Auth सेटअप</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin और चैनल सेटअप</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">अपडेट और अपग्रेड</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord - 6 क्षेत्र">
    <p className="maturity-readiness-summary">6 को समीक्षा की आवश्यकता है</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज ID</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">पहुँच और पहचान</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 6 में से 0 (0%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">चैनल सेटअप और संचालन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>10 में से 0 (0%) / 10 में से 0 (0%)</span>
        <span>10 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">वार्तालाप रूटिंग और डिलीवरी</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>12 में से 0 (0%) / 12 में से 0 (0%)</span>
        <span>12 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया और समृद्ध सामग्री</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मूल नियंत्रण और अनुमोदन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">रीयलटाइम वॉइस और कॉल</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Docker और Podman होस्टिंग - 4 क्षेत्र">
    <p className="maturity-readiness-summary">3 को समीक्षा की आवश्यकता है / 1 की आंशिक समीक्षा हुई</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज ID</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">एजेंट सैंडबॉक्स और टूलिंग</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>3 में से 0 (0%) / 3 में से 0 (0%)</span>
        <span>3 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">कंटेनर संचालन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>11 में से 0 (0%) / 11 में से 0 (0%)</span>
        <span>11 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">कंटेनर सेटअप</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 6 में से 0 (0%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">इमेज रिलीज़ और सत्यापन</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 1 (20%) / 7 में से 2 (28.6%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, क्षेत्रीय चैनल - 4 क्षेत्र">
    <p className="maturity-readiness-summary">4 को समीक्षा की आवश्यकता है</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज IDs</span><span>अनुवर्ती कार्रवाई</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">एक्सेस और पहचान</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा की आवश्यकता - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">चैनल सेटअप और संचालन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा की आवश्यकता - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 6 में से 0 (0%)</span>
        <span>6 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">वार्तालाप रूटिंग और डिलीवरी</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा की आवश्यकता - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया और समृद्ध सामग्री</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा की आवश्यकता - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतर</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Gateway runtime - 13 क्षेत्र">
    <p className="maturity-readiness-summary">9 को समीक्षा की आवश्यकता है / 4 की आंशिक समीक्षा हुई है</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज IDs</span><span>अनुवर्ती कार्रवाई</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">अनुमोदन और दूरस्थ निष्पादन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा की आवश्यकता - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 6 में से 0 (0%)</span>
        <span>6 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">डिवाइस प्रमाणीकरण और पेयरिंग</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा की आवश्यकता - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>10 में से 0 (0%) / 10 में से 0 (0%)</span>
        <span>10 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway लाइफसाइकल</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक रूप से समीक्षा की गई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>7 में से 0 (0%) / 12 में से 4 (33.3%)</span>
        <span>8 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway RPC APIs और इवेंट्स</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक रूप से समीक्षा की गई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>20 में से 0 (0%) / 22 में से 2 (9.1%)</span>
        <span>20 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">स्वास्थ्य, निदान और मरम्मत</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा की आवश्यकता - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>7 में से 0 (0%) / 7 में से 0 (0%)</span>
        <span>7 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">होस्टेड वेब सतह</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा की आवश्यकता - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">HTTP APIs</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक रूप से समीक्षा की गई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 1 (25%) / 4 में से 1 (25%)</span>
        <span>3 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">नेटवर्क एक्सेस और डिस्कवरी</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा की आवश्यकता - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 6 में से 0 (0%)</span>
        <span>6 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Nodes और दूरस्थ क्षमताएँ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा की आवश्यकता - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>8 में से 0 (0%) / 8 में से 0 (0%)</span>
        <span>8 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">प्रोटोकॉल संगतता</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा की आवश्यकता - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>7 में से 0 (0%) / 7 में से 0 (0%)</span>
        <span>7 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">भूमिकाएँ और अनुमतियाँ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा की आवश्यकता - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">सुरक्षा नियंत्रण</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा की आवश्यकता - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 6 में से 0 (0%)</span>
        <span>6 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebSocket कनेक्शन</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक रूप से समीक्षा की गई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>8 में से 1 (12.5%) / 8 में से 1 (12.5%)</span>
        <span>7 क्षमता अंतर</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat - 5 क्षेत्र">
    <p className="maturity-readiness-summary">5 को समीक्षा की आवश्यकता है</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज IDs</span><span>अनुवर्ती कार्रवाई</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">एक्सेस और पहचान</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा की आवश्यकता - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>11 में से 0 (0%) / 11 में से 0 (0%)</span>
        <span>11 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">चैनल सेटअप और संचालन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा की आवश्यकता - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>16 में से 0 (0%) / 16 में से 0 (0%)</span>
        <span>16 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">वार्तालाप रूटिंग और डिलीवरी</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा की आवश्यकता - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया और समृद्ध सामग्री</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा की आवश्यकता - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">नेटिव नियंत्रण और अनुमोदन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा की आवश्यकता - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>16 में से 0 (0%) / 16 में से 0 (0%)</span>
        <span>16 क्षमता अंतर</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google प्रदाता पथ - 5 क्षेत्र">
    <p className="maturity-readiness-summary">5 को समीक्षा आवश्यक</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज ID</span><span>अनुवर्ती कार्रवाई</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">प्रत्यक्ष Gemini रनटाइम</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>9 में से 0 (0%) / 9 में से 0 (0%)</span>
        <span>9 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया, खोज, और रियलटाइम</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>10 में से 0 (0%) / 10 में से 0 (0%)</span>
        <span>10 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मॉडल रूटिंग और एंडपॉइंट्स</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>10 में से 0 (0%) / 10 में से 0 (0%)</span>
        <span>10 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">प्रॉम्प्ट कैशिंग</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">प्रदाता सेटअप और क्रेडेंशियल्स</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>10 में से 0 (0%) / 10 में से 0 (0%)</span>
        <span>10 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="छवि, वीडियो, और संगीत जनरेशन टूल्स - 5 क्षेत्र">
    <p className="maturity-readiness-summary">5 को समीक्षा आवश्यक</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज ID</span><span>अनुवर्ती कार्रवाई</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">छवि जनरेशन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>9 में से 0 (0%) / 9 में से 0 (0%)</span>
        <span>9 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया रूटिंग और खोज</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">संगीत जनरेशन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 6 में से 0 (0%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">कार्य जीवनचक्र और डिलीवरी</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>12 में से 0 (0%) / 12 में से 0 (0%)</span>
        <span>12 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">वीडियो जनरेशन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>11 में से 0 (0%) / 11 में से 0 (0%)</span>
        <span>11 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessage और BlueBubbles - 5 क्षेत्र">
    <p className="maturity-readiness-summary">5 को समीक्षा आवश्यक</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज ID</span><span>अनुवर्ती कार्रवाई</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">एक्सेस और पहचान</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 6 में से 0 (0%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Channel सेटअप और संचालन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>11 में से 0 (0%) / 11 में से 0 (0%)</span>
        <span>11 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">बातचीत रूटिंग और डिलीवरी</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया और रिच कंटेंट</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>7 में से 0 (0%) / 7 में से 0 (0%)</span>
        <span>7 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">नेटिव कंट्रोल और अनुमोदन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>3 में से 0 (0%) / 3 में से 0 (0%)</span>
        <span>3 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iOS ऐप - 8 क्षेत्र">
    <p className="maturity-readiness-summary">8 को समीक्षा आवश्यक</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज ID</span><span>अनुवर्ती कार्रवाई</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">कैनवास और स्क्रीन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">चैट और सेशन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">डिवाइस कमांड</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>2 में से 0 (0%) / 2 में से 0 (0%)</span>
        <span>2 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">वितरण</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway सेटअप और डायग्नोस्टिक्स</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>7 में से 0 (0%) / 7 में से 0 (0%)</span>
        <span>7 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया और साझा करना</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">सूचनाएँ और बैकग्राउंड</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">आवाज़</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Kubernetes होस्टिंग - 4 क्षेत्र">
    <p className="maturity-readiness-summary">4 को समीक्षा आवश्यक</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज ID</span><span>अनुवर्ती</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">पहुंच और एक्सपोजर</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">क्लस्टर लाइफसाइकल</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">कॉन्फ़िगरेशन और सीक्रेट्स</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">डिप्लॉयमेंट सेटअप</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Linux companion app - 5 क्षेत्र">
    <p className="maturity-readiness-summary">5 को समीक्षा आवश्यक</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज ID</span><span>अनुवर्ती</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ऐप वितरण</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>3 में से 0 (0%) / 3 में से 0 (0%)</span>
        <span>3 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">चैट और सेशन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>3 में से 0 (0%) / 3 में से 0 (0%)</span>
        <span>3 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">डेस्कटॉप क्षमताएँ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>9 में से 0 (0%) / 9 में से 0 (0%)</span>
        <span>9 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway कनेक्टिविटी</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">स्थिति और डायग्नॉस्टिक्स</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>7 में से 0 (0%) / 7 में से 0 (0%)</span>
        <span>7 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Linux Gateway होस्ट - 5 क्षेत्र">
    <p className="maturity-readiness-summary">5 को समीक्षा आवश्यक</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज ID</span><span>अनुवर्ती</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">डिप्लॉयमेंट लक्ष्य</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>3 में से 0 (0%) / 3 में से 0 (0%)</span>
        <span>3 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">डायग्नॉस्टिक्स और मरम्मत</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway रनटाइम और सेवा नियंत्रण</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 6 में से 0 (0%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">होस्ट सेटअप और अपडेट</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">रिमोट एक्सेस और सुरक्षा</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 6 में से 0 (0%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="स्थानीय मॉडल प्रदाता: Ollama, vLLM, SGLang, LM Studio - 5 क्षेत्र">
    <p className="maturity-readiness-summary">5 को समीक्षा आवश्यक</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज ID</span><span>अनुवर्ती</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">स्थानीय मेमोरी और एम्बेडिंग्स</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">नेटिव प्रदाता Plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>10 में से 0 (0%) / 10 में से 0 (0%)</span>
        <span>10 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">नेटवर्क सुरक्षा और प्रॉम्प्ट नियंत्रण</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>2 में से 0 (0%) / 2 में से 0 (0%)</span>
        <span>2 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">OpenAI-संगत रनटाइम संगतता</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>8 में से 0 (0%) / 8 में से 0 (0%)</span>
        <span>8 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">प्रदाता सेटअप, लाइफसाइकल, और डायग्नॉस्टिक्स</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>12 में से 0 (0%) / 12 में से 0 (0%)</span>
        <span>12 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="लॉन्ग-टेल होस्टेड प्रदाता - 3 क्षेत्र">
    <p className="maturity-readiness-summary">3 को समीक्षा आवश्यक</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज ID</span><span>अनुवर्ती</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">होस्टेड LLM प्रदाता</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>12 में से 0 (0%) / 12 में से 0 (0%)</span>
        <span>12 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">होस्टेड मीडिया प्रदाता</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>8 में से 0 (0%) / 8 में से 0 (0%)</span>
        <span>8 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">प्रदाता संचालन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>12 में से 0 (0%) / 12 में से 0 (0%)</span>
        <span>12 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="macOS साथी ऐप - 8 क्षेत्र">
    <p className="maturity-readiness-summary">8 को समीक्षा चाहिए</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएं / कवरेज IDs</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">कैनवास</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">स्थानीय सेटअप</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>7 में से 0 (0%) / 7 में से 0 (0%)</span>
        <span>7 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">नेटिव क्षमताएं</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">दूरस्थ कनेक्शन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>3 में से 0 (0%) / 3 में से 0 (0%)</span>
        <span>3 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">दूरस्थ वेब चैट</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">स्थिति और सेटिंग्स</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">वॉइस और बातचीत</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>3 में से 0 (0%) / 3 में से 0 (0%)</span>
        <span>3 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">वेब चैट</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>3 में से 0 (0%) / 3 में से 0 (0%)</span>
        <span>3 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="macOS Gateway होस्ट - 7 क्षेत्र">
    <p className="maturity-readiness-summary">7 को समीक्षा चाहिए</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएं / कवरेज IDs</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI सेटअप</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">निदान और अवलोकनीयता</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway सेवा जीवनचक्र</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>10 में से 0 (0%) / 10 में से 0 (0%)</span>
        <span>10 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">स्थानीय Gateway एकीकरण</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>9 में से 0 (0%) / 9 में से 0 (0%)</span>
        <span>9 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">अनुमतियां और नेटिव क्षमताएं</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">प्रोफ़ाइल और आइसोलेशन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">दूरस्थ Gateway मोड</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Matrix - 6 क्षेत्र">
    <p className="maturity-readiness-summary">6 को समीक्षा चाहिए</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएं / कवरेज IDs</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">एक्सेस और पहचान</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>7 में से 0 (0%) / 7 में से 0 (0%)</span>
        <span>7 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">चैनल सेटअप और संचालन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">वार्तालाप रूटिंग और डिलीवरी</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">एन्क्रिप्शन और सत्यापन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>3 में से 0 (0%) / 3 में से 0 (0%)</span>
        <span>3 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया और रिच कंटेंट</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">नेटिव नियंत्रण और स्वीकृतियां</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 6 में से 0 (0%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat - 4 क्षेत्र">
    <p className="maturity-readiness-summary">4 को समीक्षा आवश्यक</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज IDs</span><span>अनुवर्ती कार्रवाई</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">पहुंच और पहचान</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Channel सेटअप और संचालन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">बातचीत रूटिंग और डिलीवरी</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया और रिच सामग्री</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतर</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="मीडिया समझ और मीडिया जनरेशन - 6 क्षेत्र">
    <p className="maturity-readiness-summary">4 को समीक्षा आवश्यक / 2 की आंशिक समीक्षा हुई</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज IDs</span><span>अनुवर्ती कार्रवाई</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Channel मीडिया हैंडलिंग</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया कॉन्फ़िगरेशन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया जनरेशन</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>17 में से 1 (5.9%) / 19 में से 1 (5.3%)</span>
        <span>18 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया इनटेक और पहुंच</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>8 में से 0 (0%) / 8 में से 0 (0%)</span>
        <span>8 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया समझ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>12 में से 0 (0%) / 14 में से 1 (7.1%)</span>
        <span>13 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">टेक्स्ट-टू-स्पीच डिलीवरी</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>2 में से 0 (0%) / 2 में से 0 (0%)</span>
        <span>2 क्षमता अंतर</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams - 5 क्षेत्र">
    <p className="maturity-readiness-summary">5 को समीक्षा आवश्यक</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज IDs</span><span>अनुवर्ती कार्रवाई</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">पहुंच और पहचान</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>9 में से 0 (0%) / 9 में से 0 (0%)</span>
        <span>9 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Channel सेटअप और संचालन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>9 में से 0 (0%) / 9 में से 0 (0%)</span>
        <span>9 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">बातचीत रूटिंग और डिलीवरी</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया और रिच सामग्री</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">नेटिव नियंत्रण और अनुमोदन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतर</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="नेटिव Windows - 4 क्षेत्र">
    <p className="maturity-readiness-summary">4 को समीक्षा आवश्यक</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज IDs</span><span>अनुवर्ती कार्रवाई</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>9 में से 0 (0%) / 9 में से 0 (0%)</span>
        <span>9 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway प्रबंधन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>11 में से 0 (0%) / 11 में से 0 (0%)</span>
        <span>11 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">नेटवर्किंग</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतर</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">अपडेट</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतर</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="मूल Windows कंपैनियन ऐप - 5 क्षेत्र">
    <p className="maturity-readiness-summary">5 को समीक्षा आवश्यक है</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज IDs</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">चैट सत्र</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>2 में से 0 (0%) / 2 में से 0 (0%)</span>
        <span>2 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">डेस्कटॉप टूल और अनुमतियाँ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>10 में से 0 (0%) / 10 में से 0 (0%)</span>
        <span>10 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway कनेक्शन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>3 में से 0 (0%) / 3 में से 0 (0%)</span>
        <span>3 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">इंस्टॉलेशन और अपडेट</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">स्थिति और मरम्मत</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Nix इंस्टॉल पथ - 5 क्षेत्र">
    <p className="maturity-readiness-summary">5 को समीक्षा आवश्यक है</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज IDs</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">सक्रियण और ऐप UX</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>7 में से 0 (0%) / 7 में से 0 (0%)</span>
        <span>7 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">कॉन्फ़िगरेशन और स्थिति</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>7 में से 0 (0%) / 7 में से 0 (0%)</span>
        <span>7 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">इंस्टॉल हैंडऑफ़</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin जीवनचक्र</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">सेवा रनटाइम और गार्ड</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>8 में से 0 (0%) / 8 में से 0 (0%)</span>
        <span>8 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenAI और Codex प्रदाता पथ - 5 क्षेत्र">
    <p className="maturity-readiness-summary">2 को समीक्षा आवश्यक है / 3 की आंशिक समीक्षा हुई है</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज IDs</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">छवि और मल्टीमोडल इनपुट</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>2 में से 0 (0%) / 2 में से 0 (0%)</span>
        <span>2 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मॉडल और प्रमाणीकरण</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक रूप से समीक्षा की गई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 1 (16.7%) / 9 में से 4 (44.4%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मूल Codex हार्नेस</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक रूप से समीक्षा की गई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>2 में से 0 (0%) / 9 में से 4 (44.4%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Responses और टूल संगतता</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक रूप से समीक्षा की गई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 1 (25%) / 5 में से 2 (40%)</span>
        <span>3 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">वॉइस और रीयलटाइम ऑडियो</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>2 में से 0 (0%) / 2 में से 0 (0%)</span>
        <span>2 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenClaw ऐप SDK - 6 क्षेत्र">
    <p className="maturity-readiness-summary">5 को समीक्षा आवश्यक है / 1 की आंशिक समीक्षा हुई है</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज IDs</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Agent वार्तालाप</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 6 में से 0 (0%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">क्लाइंट API</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">संगतता</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">इवेंट और अनुमोदन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway एक्सेस</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा आवश्यक - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">संसाधन हेल्पर</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक रूप से समीक्षा की गई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 6 में से 1 (16.7%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenRouter प्रदाता पथ - 4 क्षेत्र">
    <p className="maturity-readiness-summary">4 को समीक्षा चाहिए</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएं / कवरेज ID</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">चैट रनटाइम और सामान्यीकरण</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>15 में से 0 (0%) / 15 में से 0 (0%)</span>
        <span>15 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया जनरेशन और स्पीच</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>7 में से 0 (0%) / 7 में से 0 (0%)</span>
        <span>7 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">प्रदाता रिकवरी और निदान</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">प्रदाता सेटअप और प्रमाणीकरण</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>14 में से 0 (0%) / 14 में से 0 (0%)</span>
        <span>14 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Plugins - 9 क्षेत्र">
    <p className="maturity-readiness-summary">6 को समीक्षा चाहिए / 3 की आंशिक समीक्षा हुई</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएं / कवरेज ID</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins ऑथर करना और पैकेजिंग</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>8 में से 0 (0%) / 8 में से 0 (0%)</span>
        <span>8 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">बंडल किए गए Plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 6 में से 0 (0%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">चैनल Plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins इंस्टॉल करना और चलाना</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 20 में से 7 (35%)</span>
        <span>13 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin अनुमोदन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 6 में से 0 (0%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">प्रदाता और टूल Plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 1 (16.7%) / 21 में से 9 (42.9%)</span>
        <span>12 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins प्रकाशित करना</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 6 में से 0 (0%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins का परीक्षण</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 11 में से 3 (27.3%)</span>
        <span>8 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi और छोटे Linux डिवाइस - 4 क्षेत्र">
    <p className="maturity-readiness-summary">4 को समीक्षा चाहिए</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएं / कवरेज ID</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway रनटाइम</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>10 में से 0 (0%) / 10 में से 0 (0%)</span>
        <span>10 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">प्रदर्शन और निदान</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">दूरस्थ पहुंच और प्रमाणीकरण</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>9 में से 0 (0%) / 9 में से 0 (0%)</span>
        <span>9 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">सेटअप और संगतता</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>12 में से 0 (0%) / 12 में से 0 (0%)</span>
        <span>12 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="सुरक्षा, प्रमाणीकरण, पेयरिंग, और सीक्रेट्स - 6 क्षेत्र">
    <p className="maturity-readiness-summary">2 की आंशिक समीक्षा हुई / 4 को समीक्षा चाहिए</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएं / कवरेज ID</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">अनुमोदन नीति और टूल सुरक्षा उपाय</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>2 में से 0 (0%) / 6 में से 3 (50%)</span>
        <span>3 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">चैनल अभिगम नियंत्रण</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>3 में से 0 (0%) / 3 में से 0 (0%)</span>
        <span>3 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">क्रेडेंशियल और सीक्रेट स्वच्छता</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 11 में से 5 (45.5%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">डिवाइस और Node पेयरिंग</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>11 में से 0 (0%) / 11 में से 0 (0%)</span>
        <span>11 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway प्रमाणीकरण और दूरस्थ पहुंच</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>9 में से 0 (0%) / 9 में से 0 (0%)</span>
        <span>9 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin भरोसा</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>2 में से 0 (0%) / 2 में से 0 (0%)</span>
        <span>2 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="सत्र, मेमोरी, और संदर्भ इंजन - 9 क्षेत्र">
    <p className="maturity-readiness-summary">2 को समीक्षा चाहिए / 7 की आंशिक समीक्षा हुई</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज IDs</span><span>अनुवर्ती कार्रवाई</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI सत्र और ट्रांसक्रिप्ट प्रबंधन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>2 में से 0 (0%) / 2 में से 0 (0%)</span>
        <span>2 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">संदर्भ इंजन</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>2 में से 0 (0%) / 7 में से 4 (57.1%)</span>
        <span>3 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">कोर प्रॉम्प्ट और संदर्भ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>2 में से 0 (0%) / 8 में से 3 (37.5%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">क्रॉस-क्लाइंट इतिहास और सत्र समानता</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>2 में से 0 (0%) / 5 में से 2 (40%)</span>
        <span>3 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">निदान, रखरखाव, और पुनर्प्राप्ति</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>3 में से 0 (0%) / 10 में से 4 (40%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मेमोरी</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 13 में से 6 (46.2%)</span>
        <span>7 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">सत्र रूटिंग</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>2 में से 0 (0%) / 4 में से 1 (25%)</span>
        <span>3 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">टोकन प्रबंधन</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>3 में से 0 (0%) / 10 में से 2 (20%)</span>
        <span>8 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ट्रांसक्रिप्ट स्थायित्व</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>2 में से 0 (0%) / 2 में से 0 (0%)</span>
        <span>2 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal - 5 क्षेत्र">
    <p className="maturity-readiness-summary">5 को समीक्षा चाहिए</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज IDs</span><span>अनुवर्ती कार्रवाई</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">पहुँच और पहचान</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 6 में से 0 (0%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">चैनल सेटअप और संचालन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>7 में से 0 (0%) / 7 में से 0 (0%)</span>
        <span>7 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">बातचीत रूटिंग और डिलीवरी</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया और रिच सामग्री</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>7 में से 0 (0%) / 7 में से 0 (0%)</span>
        <span>7 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">नेटिव नियंत्रण और स्वीकृतियाँ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>3 में से 0 (0%) / 3 में से 0 (0%)</span>
        <span>3 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack - 5 क्षेत्र">
    <p className="maturity-readiness-summary">5 को समीक्षा चाहिए</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज IDs</span><span>अनुवर्ती कार्रवाई</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">पहुँच और पहचान</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">चैनल सेटअप और संचालन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>10 में से 0 (0%) / 10 में से 0 (0%)</span>
        <span>10 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">बातचीत रूटिंग और डिलीवरी</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया और रिच सामग्री</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">नेटिव नियंत्रण और स्वीकृतियाँ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>8 में से 0 (0%) / 8 में से 0 (0%)</span>
        <span>8 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram - 5 क्षेत्र">
    <p className="maturity-readiness-summary">5 को समीक्षा चाहिए</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज IDs</span><span>अनुवर्ती कार्रवाई</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">पहुँच और पहचान</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>10 में से 0 (0%) / 10 में से 0 (0%)</span>
        <span>10 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">चैनल सेटअप और संचालन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>10 में से 0 (0%) / 10 में से 0 (0%)</span>
        <span>10 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">बातचीत रूटिंग और डिलीवरी</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया और रिच सामग्री</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">नेटिव नियंत्रण और स्वीकृतियाँ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण वर्गीकरण सत्यापन</span>
        </div>
        <span>9 में से 0 (0%) / 9 में से 0 (0%)</span>
        <span>9 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="अवलोकनीयता - 5 क्षेत्र">
    <p className="maturity-readiness-summary">3 आंशिक रूप से समीक्षित / 2 को समीक्षा चाहिए</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज IDs</span><span>अनुवर्ती कार्रवाई</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">निदान संग्रह</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक रूप से समीक्षित - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>8 में से 1 (12.5%) / 10 में से 3 (30%)</span>
        <span>7 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">स्वास्थ्य और मरम्मत</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक रूप से समीक्षित - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>12 में से 1 (8.3%) / 18 में से 5 (27.8%)</span>
        <span>13 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">लॉगिंग</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">सत्र निदान</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">टेलीमेट्री निर्यात</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक रूप से समीक्षित - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>13 में से 1 (7.7%) / 21 में से 7 (33.3%)</span>
        <span>14 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="TUI - 5 क्षेत्र">
    <p className="maturity-readiness-summary">5 को समीक्षा चाहिए</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज IDs</span><span>अनुवर्ती कार्रवाई</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">इनपुट और कमांड</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>8 में से 0 (0%) / 8 में से 0 (0%)</span>
        <span>8 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">स्थानीय Shell निष्पादन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">रेंडरिंग और आउटपुट सुरक्षा</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">रनटाइम मोड</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>14 में से 0 (0%) / 14 में से 0 (0%)</span>
        <span>14 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">सत्र प्रबंधन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>3 में से 0 (0%) / 3 में से 0 (0%)</span>
        <span>3 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="वॉइस और रीयलटाइम बातचीत - 6 क्षेत्र">
    <p className="maturity-readiness-summary">6 को समीक्षा चाहिए</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज IDs</span><span>अनुवर्ती कार्रवाई</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">नेटिव ऐप बातचीत</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">रीयलटाइम बातचीत सत्र</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>11 में से 0 (0%) / 11 में से 0 (0%)</span>
        <span>11 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">वाक् और ट्रांसक्रिप्शन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">बातचीत अवलोकनीयता</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">बातचीत प्रदाता</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>7 में से 0 (0%) / 7 में से 0 (0%)</span>
        <span>7 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">वॉइस वेक और रूटिंग</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="वॉइस कॉल चैनल - 5 क्षेत्र">
    <p className="maturity-readiness-summary">5 को समीक्षा चाहिए</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएँ / कवरेज IDs</span><span>अनुवर्ती कार्रवाई</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">पहुंच और पहचान</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">चैनल सेटअप और संचालन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>2 में से 0 (0%) / 2 में से 0 (0%)</span>
        <span>2 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">बातचीत रूटिंग और डिलीवरी</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>1 में से 0 (0%) / 1 में से 0 (0%)</span>
        <span>1 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया और समृद्ध सामग्री</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>2 में से 0 (0%) / 2 में से 0 (0%)</span>
        <span>2 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">रीयलटाइम वॉइस और कॉल</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>2 में से 0 (0%) / 2 में से 0 (0%)</span>
        <span>2 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="watchOS सहयोगी सतहें - 5 क्षेत्र">
    <p className="maturity-readiness-summary">5 को समीक्षा चाहिए</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएं / कवरेज ID</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">डिलीवरी और पुनर्प्राप्ति</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>7 में से 0 (0%) / 7 में से 0 (0%)</span>
        <span>7 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">वितरण और सहायता</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 6 में से 0 (0%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">कार्यकारी अनुमोदन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>3 में से 0 (0%) / 3 में से 0 (0%)</span>
        <span>3 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">सूचनाएं और उत्तर</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>7 में से 0 (0%) / 7 में से 0 (0%)</span>
        <span>7 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Watch App UI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>3 में से 0 (0%) / 3 में से 0 (0%)</span>
        <span>3 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="वेब खोज टूल - 4 क्षेत्र">
    <p className="maturity-readiness-summary">2 को समीक्षा चाहिए / 2 की आंशिक समीक्षा हुई</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएं / कवरेज ID</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">नेटवर्क सुरक्षा</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">खोज प्रदाता</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>19 में से 2 (10.5%) / 19 में से 2 (10.5%)</span>
        <span>17 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">सेटअप और निदान</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>9 में से 0 (0%) / 9 में से 0 (0%)</span>
        <span>9 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">टूल उपलब्धता और Fetch</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>11 में से 2 (18.2%) / 12 में से 3 (25%)</span>
        <span>9 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp - 5 क्षेत्र">
    <p className="maturity-readiness-summary">5 को समीक्षा चाहिए</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएं / कवरेज ID</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">पहुंच और पहचान</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>7 में से 0 (0%) / 7 में से 0 (0%)</span>
        <span>7 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">चैनल सेटअप और संचालन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>5 में से 0 (0%) / 5 में से 0 (0%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">बातचीत रूटिंग और डिलीवरी</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>4 में से 0 (0%) / 4 में से 0 (0%)</span>
        <span>4 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">मीडिया और समृद्ध सामग्री</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>2 में से 0 (0%) / 2 में से 0 (0%)</span>
        <span>2 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">नेटिव नियंत्रण और अनुमोदन</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>2 में से 0 (0%) / 2 में से 0 (0%)</span>
        <span>2 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WSL2 के माध्यम से Windows - 6 क्षेत्र">
    <p className="maturity-readiness-summary">5 को समीक्षा चाहिए / 1 की आंशिक समीक्षा हुई</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>क्षेत्र</span><span>सुविधाएं / कवरेज ID</span><span>फ़ॉलो-अप</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ब्राउज़र और नियंत्रण UI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 6 में से 0 (0%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>8 में से 0 (0%) / 8 में से 0 (0%)</span>
        <span>8 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">निदान और मरम्मत</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">आंशिक समीक्षा हुई - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 1 (16.7%) / 8 में से 3 (37.5%)</span>
        <span>5 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway पहुंच और एक्सपोज़र</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>11 में से 0 (0%) / 11 में से 0 (0%)</span>
        <span>11 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway सेवा जीवनचक्र</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>10 में से 0 (0%) / 10 में से 0 (0%)</span>
        <span>10 क्षमता अंतराल</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WSL सेटअप</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">समीक्षा चाहिए - पूर्ण टैक्सोनॉमी सत्यापन</span>
        </div>
        <span>6 में से 0 (0%) / 6 में से 0 (0%)</span>
        <span>6 क्षमता अंतराल</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> अंतिम अपडेट: 2026-06-22
