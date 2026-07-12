---
summary: OpenClaw 各產品領域、整合項目與支援工作流程的發布就緒度評分。
title: 成熟度評分卡
x-i18n:
    generated_at: "2026-07-11T21:28:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0cc55f54773a19369b865994ea22d00f1e07fc7df2b2d5b14cb4067f994fb0e2
    source_path: maturity/scorecard.md
    workflow: 16
---

# 成熟度評分表

<div className="maturity-hero">
  <p className="maturity-kicker">發行就緒度 - 依分類體系與品質保證證據產生</p>
  <p className="maturity-hero-title">實用呈現哪些項目已就緒、哪些已有實證，以及哪些仍需改進。</p>
  <p>50 個介面 - 281 個能力領域 - 確定性涵蓋率，結合經人工審查的品質與完整性。</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">瀏覽介面</a> / <a href="#qa-evidence-summary">檢視品質保證證據</a> / <a href="/zh-TW/maturity/taxonomy">閱讀分類體系</a></p>
</div>

## 本頁用途

使用本頁回答一個問題：哪些 OpenClaw 介面是可信賴的發行選擇，又有哪些證據支持這項判斷？涵蓋率來自確定性的品質保證證據；品質與完整性則以經審查的成熟度分數維護。

## 概覽

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">68%</span>
      <span>成熟度分數</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "68" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">Alpha</span>
      <span>品質與完整性</span>
      <span>涵蓋率：實驗階段 - 4%</span>
      <span>品質：Alpha - 64%</span>
      <span>完整性：Beta - 71%</span>
    </div>
  </div>
</div>

涵蓋率刻意以證據為導向：某個領域不會僅因實作已存在就成為「就緒」。涵蓋率不納入成熟度分數，但 OpenClaw 的目標是讓成熟且達到 Stable 或更高等級功能的端到端涵蓋率，長期維持在 90% 以上。

## 分數級距

<div className="maturity-band-list">
  <div className="maturity-band maturity-band-experimental"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-experimental">實驗階段</span></span><span>0-50%</span></div>
  <div className="maturity-band maturity-band-alpha"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-alpha">Alpha</span></span><span>50-70%</span></div>
  <div className="maturity-band maturity-band-beta"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-beta">Beta</span></span><span>70-80%</span></div>
  <div className="maturity-band maturity-band-stable"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-stable">穩定版</span></span><span>80-95%</span></div>
  <div className="maturity-band maturity-band-clawesome"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-clawesome">Clawesome</span></span><span>95-100%</span></div>
</div>

## 介面瀏覽器

<a id="surface-explorer" />

各介面依成熟度等級、完整性與品質排序。每列也會顯示長期支援狀態，方便比較已可供發行的選項。

  <Tabs>
  <Tab title="所有介面">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>介面</span><span>涵蓋率</span><span>品質</span><span>完整度</span><span>支援</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#cli"><span className="maturity-surface-title">命令列介面</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>穩定</span></span><span>7 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">穩定</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">穩定</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">閘道執行環境</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>穩定</span></span><span>13 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">穩定</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">穩定</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Linux 閘道主機</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>穩定</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">穩定</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">macOS 閘道主機</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>穩定</span></span><span>7 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">穩定</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>穩定</span></span><span>6 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">穩定</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#android-app"><span className="maturity-surface-title">Android 應用程式</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>穩定</span></span><span>7 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">穩定</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">穩定</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#ios-app"><span className="maturity-surface-title">iOS 應用程式</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>穩定</span></span><span>8 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">穩定</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">穩定</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">代理程式執行環境</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">工作階段、記憶體與情境引擎</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">頻道框架</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">瀏覽器自動化、命令執行與沙箱工具</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#observability"><span className="maturity-surface-title">可觀測性</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">OpenAI 與 Codex 提供者路徑</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">閘道網頁應用程式</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>6 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">網頁搜尋工具</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>4 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#plugins"><span className="maturity-surface-title">外掛</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>9 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">安全性、驗證、配對與機密資料</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>6 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">自動化：排程、掛鉤、任務、輪詢</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>6 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Docker 與 Podman 託管</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>4 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">透過 WSL2 執行 Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>6 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi 與小型 Linux 裝置</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>4 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Anthropic 提供者路徑</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">完整支援 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">完整支援 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Google 提供者路徑</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage 與 BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">macOS 伴隨應用程式</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>8 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">OpenRouter 提供者路徑</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>4 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">媒體理解與媒體生成</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">影像、影片與音樂生成工具</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">本機模型提供者：Ollama、vLLM、SGLang、LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗階段</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 階段</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 階段</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">長尾託管供應商</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha 階段</span></span><span>3 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗階段</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 階段</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 階段</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">語音與即時通話</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha 階段</span></span><span>6 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗階段</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 階段</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 階段</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha 階段</span></span><span>6 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗階段</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 階段</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 階段</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha 階段</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗階段</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 階段</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 階段</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha 階段</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗階段</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 階段</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 階段</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha 階段</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗階段</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#tui"><span className="maturity-surface-title">終端介面</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#native-windows"><span className="maturity-surface-title">原生 Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Kubernetes 託管</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu、QQ Bot、微信、騰訊元寶、Zalo、Zalo Personal、區域性頻道</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost、LINE、IRC、Nextcloud Talk、Nostr、Twitch、Tlon、Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw 應用程式 SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Nix 安裝路徑</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>實驗性</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">語音通話頻道</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>實驗性</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">watchOS 伴隨介面</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>實驗性</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Linux 伴隨應用程式</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>已規劃</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">原生 Windows 伴隨應用程式</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>已規劃</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="核心">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>介面</span><span>涵蓋率</span><span>品質</span><span>完整度</span><span>支援</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#cli"><span className="maturity-surface-title">命令列介面</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>穩定</span></span><span>7 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">穩定</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">穩定</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">閘道執行階段</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>穩定</span></span><span>13 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">穩定</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">穩定</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">代理程式執行階段</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta 版</span></span><span>9 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta 版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta 版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">工作階段、記憶與情境引擎</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta 版</span></span><span>9 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta 版</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta 版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">頻道框架</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta 版</span></span><span>8 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta 版</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta 版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#observability"><span className="maturity-surface-title">可觀測性</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta 版</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta 版</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta 版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">閘道網頁應用程式</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#plugins"><span className="maturity-surface-title">外掛</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">安全性、驗證、配對與機密資料</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">自動化：排程、掛鉤、任務、輪詢</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">媒體理解與媒體生成</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">語音與即時對話</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#tui"><span className="maturity-surface-title">終端介面</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw 應用程式 SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="平台">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>介面</span><span>涵蓋率</span><span>品質</span><span>完整度</span><span>支援</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Linux 閘道主機</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>穩定</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">穩定</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">macOS 閘道主機</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>穩定</span></span><span>7 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">穩定</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#android-app"><span className="maturity-surface-title">Android 應用程式</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>穩定</span></span><span>7 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">穩定</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">穩定</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#ios-app"><span className="maturity-surface-title">iOS 應用程式</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>穩定</span></span><span>8 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">穩定版</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">穩定版</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Docker 與 Podman 託管</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>4 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">透過 WSL2 執行 Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>6 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi 與小型 Linux 裝置</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>4 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">macOS 輔助應用程式</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>8 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#native-windows"><span className="maturity-surface-title">原生 Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha 版</span></span><span>4 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Kubernetes 託管</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha 版</span></span><span>4 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Nix 安裝路徑</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>實驗性</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">watchOS 輔助介面</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>實驗性</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Linux 輔助應用程式</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>已規劃</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">Windows 原生輔助應用程式</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>已規劃</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="頻道">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>介面</span><span>涵蓋率</span><span>品質</span><span>完整度</span><span>支援</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>穩定</span></span><span>6 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">穩定</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">完整支援 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">完整支援 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage 與 BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha 版</span></span><span>6 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha 版</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha 版</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu、QQ Bot、微信、騰訊元寶、Zalo、Zalo Personal、區域性頻道</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost、LINE、IRC、Nextcloud Talk、Nostr、Twitch、Tlon、Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">語音通話頻道</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>實驗性</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="供應商與工具">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>介面</span><span>涵蓋率</span><span>品質</span><span>完整度</span><span>支援</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">瀏覽器自動化、exec 與沙箱工具</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">OpenAI 與 Codex 供應商路徑</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支援 - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">網頁搜尋工具</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>4 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Anthropic 提供者路徑</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Google 提供者路徑</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">OpenRouter 提供者路徑</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>測試版</span></span><span>4 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">測試版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">影像、影片與音樂生成工具</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha 版</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">本機模型提供者：Ollama、vLLM、SGLang、LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha 版</span></span><span>5 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-TW/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">長尾託管提供者</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha 版</span></span><span>3 個領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">涵蓋率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">實驗性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">無</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## QA 證據摘要

以下檢查顯示 QA 設定檔證據涵蓋了哪些評分卡領域。

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">完整分類體系驗證</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>96 項檢查 - 94 項通過，2 項受阻</span>
    <span>281 個領域中的 0 個（0%）- 1675 項功能中的 20 項（1.2%）- 1665 個涵蓋範圍 ID 中的 77 個（4.6%）</span>
  </div>
</div>

### 各領域的就緒程度

  開啟一個介面，以檢視各類別的證據狀態。清單會維持收合，讓頁面仍可一目瞭然。

  <AccordionGroup>
  <Accordion title="代理執行階段 - 9 個領域">
    <p className="maturity-readiness-summary">8 個已部分審查 / 1 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能 / 涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">代理回合執行</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>3 項中 0 項 (0%) / 24 項中 7 項 (29.2%)</span>
        <span>17 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">外部執行階段與子代理</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>4 項中 0 項 (0%) / 10 項中 3 項 (30%)</span>
        <span>7 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">託管提供者執行</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中 1 項 (20%) / 5 項中 1 項 (20%)</span>
        <span>4 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">本機與自行託管的提供者</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中 0 項 (0%) / 5 項中 0 項 (0%)</span>
        <span>5 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">模型與執行階段選擇</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>4 項中 0 項 (0%) / 8 項中 2 項 (25%)</span>
        <span>6 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">提供者驗證</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>10 項中 0 項 (0%) / 17 項中 4 項 (23.5%)</span>
        <span>13 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">串流與進度</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>2 項中 0 項 (0%) / 9 項中 5 項 (55.6%)</span>
        <span>4 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">工具呼叫與回應處理</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>3 項中 0 項 (0%) / 23 項中 15 項 (65.2%)</span>
        <span>8 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">工具執行控制</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>6 項中 0 項 (0%) / 12 項中 6 項 (50%)</span>
        <span>6 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Android 應用程式 - 7 個領域">
    <p className="maturity-readiness-summary">7 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能 / 涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">連線設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>1 項中 0 項 (0%) / 1 項中 0 項 (0%)</span>
        <span>1 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">裝置執行階段</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>2 項中 0 項 (0%) / 2 項中 0 項 (0%)</span>
        <span>2 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">發行</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>3 項中 0 項 (0%) / 3 項中 0 項 (0%)</span>
        <span>3 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體擷取</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>1 項中 0 項 (0%) / 1 項中 0 項 (0%)</span>
        <span>1 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">行動聊天</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>1 項中 0 項 (0%) / 1 項中 0 項 (0%)</span>
        <span>1 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>1 項中 0 項 (0%) / 1 項中 0 項 (0%)</span>
        <span>1 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">語音</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>1 項中 0 項 (0%) / 1 項中 0 項 (0%)</span>
        <span>1 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Anthropic 提供者路徑 - 5 個領域">
    <p className="maturity-readiness-summary">5 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能 / 涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體輸入</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>4 項中 0 項 (0%) / 4 項中 0 項 (0%)</span>
        <span>4 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">模型與執行階段選擇</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>10 項中 0 項 (0%) / 12 項中 0 項 (0%)</span>
        <span>12 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">提示詞快取與上下文</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中 0 項 (0%) / 5 項中 0 項 (0%)</span>
        <span>5 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">提供者驗證與復原</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>9 項中 0 項 (0%) / 9 項中 0 項 (0%)</span>
        <span>9 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">請求傳輸與回合語意</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>10 項中 0 項 (0%) / 10 項中 0 項 (0%)</span>
        <span>10 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="自動化：排程、鉤子、任務、輪詢 - 6 個領域">
    <p className="maturity-readiness-summary">5 個需要審查 / 1 個已部分審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能 / 涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">自動化鉤子</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>11 項中有 0 項 (0%) / 11 項中有 0 項 (0%)</span>
        <span>11 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">背景任務與流程</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>10 項中有 0 項 (0%) / 10 項中有 0 項 (0%)</span>
        <span>10 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">排程工作</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>15 項中有 0 項 (0%) / 15 項中有 0 項 (0%)</span>
        <span>15 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">事件匯入</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>15 項中有 0 項 (0%) / 15 項中有 0 項 (0%)</span>
        <span>15 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">心跳偵測</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中有 0 項 (0%) / 7 項中有 1 項 (14.3%)</span>
        <span>6 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">輪詢控制</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>10 項中有 0 項 (0%) / 10 項中有 0 項 (0%)</span>
        <span>10 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="瀏覽器自動化、執行與沙箱工具 - 3 個領域">
    <p className="maturity-readiness-summary">2 個已部分審查 / 1 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能 / 涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">瀏覽器自動化</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>8 項中有 1 項 (12.5%) / 8 項中有 1 項 (12.5%)</span>
        <span>7 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">沙箱與工具政策</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>6 項中有 0 項 (0%) / 6 項中有 0 項 (0%)</span>
        <span>6 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">工具呼叫與執行</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>6 項中有 2 項 (33.3%) / 8 項中有 4 項 (50%)</span>
        <span>4 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="閘道網頁應用程式 - 6 個領域">
    <p className="maturity-readiness-summary">3 個需要審查 / 3 個已部分審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能 / 涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">瀏覽器存取與信任</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中有 0 項 (0%) / 5 項中有 0 項 (0%)</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">瀏覽器即時對話</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中有 0 項 (0%) / 5 項中有 0 項 (0%)</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">瀏覽器使用者介面</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>10 項中有 0 項 (0%) / 12 項中有 1 項 (8.3%)</span>
        <span>11 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中有 0 項 (0%) / 5 項中有 0 項 (0%)</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">操作員主控台</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>10 項中有 0 項 (0%) / 12 項中有 1 項 (8.3%)</span>
        <span>11 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat 對話</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>15 項中有 0 項 (0%) / 20 項中有 2 項 (10%)</span>
        <span>18 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="頻道框架 - 8 個領域">
    <p className="maturity-readiness-summary">4 個需要審查 / 4 個已部分審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能 / 涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">頻道動作、命令與核准</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中有 0 項 (0%) / 5 項中有 0 項 (0%)</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">頻道設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中有 0 項 (0%) / 7 項中有 1 項 (14.3%)</span>
        <span>6 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">對話路由與傳遞</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>10 項中有 0 項 (0%) / 27 項中有 5 項 (18.5%)</span>
        <span>22 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">群組討論串與常駐聊天室行為</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中有 0 項 (0%) / 11 項中有 4 項 (36.4%)</span>
        <span>7 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">入站存取與身分關卡</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中有 0 項 (0%) / 5 項中有 0 項 (0%)</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體附件與豐富頻道資料</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>4 項中有 0 項 (0%) / 4 項中有 0 項 (0%)</span>
        <span>4 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">出站傳遞與回覆管線</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>4 項中有 0 項 (0%) / 21 項中有 8 項 (38.1%)</span>
        <span>13 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">狀態健康度與操作員控制</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>4 項中有 0 項 (0%) / 6 項中有 0 項 (0%)</span>
        <span>6 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub - 4 個領域">
    <p className="maturity-readiness-summary">4 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">目錄探索</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中的 0 項（0%）／5 項中的 0 項（0%）</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">相容性與信任</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>12 項中的 0 項（0%）／12 項中的 0 項（0%）</span>
        <span>12 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">外掛生命週期與健康狀態</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>26 項中的 0 項（0%）／26 項中的 0 項（0%）</span>
        <span>26 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">發布</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>7 項中的 0 項（0%）／7 項中的 0 項（0%）</span>
        <span>7 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="命令列介面 - 7 個領域">
    <p className="maturity-readiness-summary">5 個需要審查／2 個已部分審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">命令列介面可觀測性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中的 0 項（0%）／5 項中的 0 項（0%）</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">命令列介面設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>6 項中的 1 項（16.7%）／6 項中的 1 項（16.7%）</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">診斷修復</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>10 項中的 0 項（0%）／10 項中的 0 項（0%）</span>
        <span>10 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">閘道服務管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中的 0 項（0%）／7 項中的 1 項（14.3%）</span>
        <span>6 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">初始設定與驗證設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中的 0 項（0%）／5 項中的 0 項（0%）</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">外掛與頻道設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中的 0 項（0%）／5 項中的 0 項（0%）</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">更新與升級</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中的 0 項（0%）／5 項中的 0 項（0%）</span>
        <span>5 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord - 6 個領域">
    <p className="maturity-readiness-summary">6 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">存取與身分識別</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>6 項中的 0 項（0%）／6 項中的 0 項（0%）</span>
        <span>6 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">頻道設定與操作</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>10 項中的 0 項（0%）／10 項中的 0 項（0%）</span>
        <span>10 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">對話路由與傳遞</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>12 項中的 0 項（0%）／12 項中的 0 項（0%）</span>
        <span>12 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體與豐富內容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>1 項中的 0 項（0%）／1 項中的 0 項（0%）</span>
        <span>1 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生控制項與核准</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中的 0 項（0%）／5 項中的 0 項（0%）</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">即時語音與通話</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中的 0 項（0%）／5 項中的 0 項（0%）</span>
        <span>5 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Docker 與 Podman 託管 - 4 個領域">
    <p className="maturity-readiness-summary">3 個需要審查／1 個已部分審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">代理程式沙箱與工具</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>3 項中的 0 項（0%）／3 項中的 0 項（0%）</span>
        <span>3 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">容器操作</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>11 項中的 0 項（0%）／11 項中的 0 項（0%）</span>
        <span>11 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">容器設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>6 項中的 0 項（0%）／6 項中的 0 項（0%）</span>
        <span>6 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">映像檔發布與驗證</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中的 1 項（20%）／7 項中的 2 項（28.6%）</span>
        <span>5 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu、QQ Bot、微信、騰訊元寶、Zalo、Zalo Personal、區域頻道 - 4 個領域">
    <p className="maturity-readiness-summary">4 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">存取與身分</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0／1（0%）／0／1（0%）</span>
        <span>1 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">頻道設定與營運</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0／6（0%）／0／6（0%）</span>
        <span>6 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">對話路由與傳遞</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0／1（0%）／0／1（0%）</span>
        <span>1 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體與豐富內容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0／1（0%）／0／1（0%）</span>
        <span>1 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="閘道執行階段 - 13 個領域">
    <p className="maturity-readiness-summary">9 個需要審查／4 個已部分審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">核准與遠端執行</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0／6（0%）／0／6（0%）</span>
        <span>6 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">裝置驗證與配對</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0／10（0%）／0／10（0%）</span>
        <span>10 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">閘道生命週期</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>0／7（0%）／4／12（33.3%）</span>
        <span>8 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">閘道 RPC API 與事件</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>0／20（0%）／2／22（9.1%）</span>
        <span>20 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">健康狀態、診斷與修復</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0／7（0%）／0／7（0%）</span>
        <span>7 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">託管網頁介面</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0／4（0%）／0／4（0%）</span>
        <span>4 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">HTTP API</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>1／4（25%）／1／4（25%）</span>
        <span>3 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">網路存取與探索</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0／6（0%）／0／6（0%）</span>
        <span>6 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">節點與遠端能力</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0／8（0%）／0／8（0%）</span>
        <span>8 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">協定相容性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0／7（0%）／0／7（0%）</span>
        <span>7 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">角色與權限</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0／5（0%）／0／5（0%）</span>
        <span>5 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">安全控制</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0／6（0%）／0／6（0%）</span>
        <span>6 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebSocket 連線</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>1／8（12.5%）／1／8（12.5%）</span>
        <span>7 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat - 5 個領域">
    <p className="maturity-readiness-summary">5 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">存取與身分</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0／11（0%）／0／11（0%）</span>
        <span>11 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">頻道設定與營運</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0／16（0%）／0／16（0%）</span>
        <span>16 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">對話路由與傳遞</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0／1（0%）／0／1（0%）</span>
        <span>1 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體與豐富內容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0／1（0%）／0／1（0%）</span>
        <span>1 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生控制與核准</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0／16（0%）／0／16（0%）</span>
        <span>16 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google 提供者路徑 - 5 個領域">
    <p className="maturity-readiness-summary">5 個領域需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續事項</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">直接 Gemini 執行階段</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>9 項中 0 項 (0%)／9 項中 0 項 (0%)</span>
        <span>9 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體、搜尋與即時功能</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>10 項中 0 項 (0%)／10 項中 0 項 (0%)</span>
        <span>10 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">模型路由與端點</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>10 項中 0 項 (0%)／10 項中 0 項 (0%)</span>
        <span>10 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">提示詞快取</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中 0 項 (0%)／5 項中 0 項 (0%)</span>
        <span>5 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">提供者設定與憑證</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>10 項中 0 項 (0%)／10 項中 0 項 (0%)</span>
        <span>10 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="影像、影片與音樂生成工具 - 5 個領域">
    <p className="maturity-readiness-summary">5 個領域需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續事項</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">影像生成</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>9 項中 0 項 (0%)／9 項中 0 項 (0%)</span>
        <span>9 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體路由與探索</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>4 項中 0 項 (0%)／4 項中 0 項 (0%)</span>
        <span>4 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">音樂生成</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>6 項中 0 項 (0%)／6 項中 0 項 (0%)</span>
        <span>6 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">任務生命週期與交付</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>12 項中 0 項 (0%)／12 項中 0 項 (0%)</span>
        <span>12 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">影片生成</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>11 項中 0 項 (0%)／11 項中 0 項 (0%)</span>
        <span>11 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessage 與 BlueBubbles - 5 個領域">
    <p className="maturity-readiness-summary">5 個領域需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續事項</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">存取與身分</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>6 項中 0 項 (0%)／6 項中 0 項 (0%)</span>
        <span>6 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">頻道設定與操作</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>11 項中 0 項 (0%)／11 項中 0 項 (0%)</span>
        <span>11 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">對話路由與交付</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>4 項中 0 項 (0%)／4 項中 0 項 (0%)</span>
        <span>4 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體與豐富內容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>7 項中 0 項 (0%)／7 項中 0 項 (0%)</span>
        <span>7 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生控制項與核准</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>3 項中 0 項 (0%)／3 項中 0 項 (0%)</span>
        <span>3 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iOS 應用程式 - 8 個領域">
    <p className="maturity-readiness-summary">8 個領域需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續事項</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">畫布與螢幕</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>1 項中 0 項 (0%)／1 項中 0 項 (0%)</span>
        <span>1 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">聊天與工作階段</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>1 項中 0 項 (0%)／1 項中 0 項 (0%)</span>
        <span>1 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">裝置命令</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>2 項中 0 項 (0%)／2 項中 0 項 (0%)</span>
        <span>2 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">發佈</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>1 項中 0 項 (0%)／1 項中 0 項 (0%)</span>
        <span>1 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">閘道設定與診斷</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>7 項中 0 項 (0%)／7 項中 0 項 (0%)</span>
        <span>7 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體與分享</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>1 項中 0 項 (0%)／1 項中 0 項 (0%)</span>
        <span>1 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">通知與背景執行</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>1 項中 0 項 (0%)／1 項中 0 項 (0%)</span>
        <span>1 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">語音</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>1 項中 0 項 (0%)／1 項中 0 項 (0%)</span>
        <span>1 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Kubernetes 託管 - 4 個領域">
    <p className="maturity-readiness-summary">4 個領域需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">存取與公開</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中的 0 項 (0%) / 5 項中的 0 項 (0%)</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">叢集生命週期</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中的 0 項 (0%) / 5 項中的 0 項 (0%)</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">設定與密鑰</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中的 0 項 (0%) / 5 項中的 0 項 (0%)</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">部署設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中的 0 項 (0%) / 5 項中的 0 項 (0%)</span>
        <span>5 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Linux 伴隨應用程式 - 5 個領域">
    <p className="maturity-readiness-summary">5 個領域需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">應用程式發佈</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>3 項中的 0 項 (0%) / 3 項中的 0 項 (0%)</span>
        <span>3 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">聊天與工作階段</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>3 項中的 0 項 (0%) / 3 項中的 0 項 (0%)</span>
        <span>3 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">桌面功能</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>9 項中的 0 項 (0%) / 9 項中的 0 項 (0%)</span>
        <span>9 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">閘道連線能力</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>4 項中的 0 項 (0%) / 4 項中的 0 項 (0%)</span>
        <span>4 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">狀態與診斷</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>7 項中的 0 項 (0%) / 7 項中的 0 項 (0%)</span>
        <span>7 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Linux 閘道主機 - 5 個領域">
    <p className="maturity-readiness-summary">5 個領域需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">部署目標</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>3 項中的 0 項 (0%) / 3 項中的 0 項 (0%)</span>
        <span>3 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">診斷與修復</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>4 項中的 0 項 (0%) / 4 項中的 0 項 (0%)</span>
        <span>4 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">閘道執行階段與服務控制</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>6 項中的 0 項 (0%) / 6 項中的 0 項 (0%)</span>
        <span>6 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">主機設定與更新</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>4 項中的 0 項 (0%) / 4 項中的 0 項 (0%)</span>
        <span>4 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">遠端存取與安全性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>6 項中的 0 項 (0%) / 6 項中的 0 項 (0%)</span>
        <span>6 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="本機模型供應商：Ollama、vLLM、SGLang、LM Studio - 5 個領域">
    <p className="maturity-readiness-summary">5 個領域需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">本機記憶與嵌入向量</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中的 0 項 (0%) / 5 項中的 0 項 (0%)</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生供應商外掛</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>10 項中的 0 項 (0%) / 10 項中的 0 項 (0%)</span>
        <span>10 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">網路安全與提示詞控制</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>2 項中的 0 項 (0%) / 2 項中的 0 項 (0%)</span>
        <span>2 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">OpenAI 相容執行階段的相容性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>8 項中的 0 項 (0%) / 8 項中的 0 項 (0%)</span>
        <span>8 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">供應商設定、生命週期與診斷</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>12 項中的 0 項 (0%) / 12 項中的 0 項 (0%)</span>
        <span>12 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="長尾託管供應商 - 3 個領域">
    <p className="maturity-readiness-summary">3 個領域需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">託管式大型語言模型供應商</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>12 項中的 0 項 (0%) / 12 項中的 0 項 (0%)</span>
        <span>12 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">託管式媒體供應商</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>8 項中的 0 項 (0%) / 8 項中的 0 項 (0%)</span>
        <span>8 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">供應商營運</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>12 項中的 0 項 (0%) / 12 項中的 0 項 (0%)</span>
        <span>12 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="macOS 輔助應用程式 - 8 個領域">
    <p className="maturity-readiness-summary">8 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">畫布</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>4 項中有 0 項（0%）／4 項中有 0 項（0%）</span>
        <span>4 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">本機設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>7 項中有 0 項（0%）／7 項中有 0 項（0%）</span>
        <span>7 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生功能</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中有 0 項（0%）／5 項中有 0 項（0%）</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">遠端連線</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>3 項中有 0 項（0%）／3 項中有 0 項（0%）</span>
        <span>3 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">遠端 WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中有 0 項（0%）／5 項中有 0 項（0%）</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">狀態與設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中有 0 項（0%）／5 項中有 0 項（0%）</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">語音與對話</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>3 項中有 0 項（0%）／3 項中有 0 項（0%）</span>
        <span>3 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>3 項中有 0 項（0%）／3 項中有 0 項（0%）</span>
        <span>3 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="macOS 閘道主機 - 7 個領域">
    <p className="maturity-readiness-summary">7 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">命令列介面設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>4 項中有 0 項（0%）／4 項中有 0 項（0%）</span>
        <span>4 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">診斷與可觀測性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>4 項中有 0 項（0%）／4 項中有 0 項（0%）</span>
        <span>4 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">閘道服務生命週期</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>10 項中有 0 項（0%）／10 項中有 0 項（0%）</span>
        <span>10 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">本機閘道整合</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>9 項中有 0 項（0%）／9 項中有 0 項（0%）</span>
        <span>9 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">權限與原生功能</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>4 項中有 0 項（0%）／4 項中有 0 項（0%）</span>
        <span>4 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">設定檔與隔離</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中有 0 項（0%）／5 項中有 0 項（0%）</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">遠端閘道模式</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中有 0 項（0%）／5 項中有 0 項（0%）</span>
        <span>5 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Matrix - 6 個領域">
    <p className="maturity-readiness-summary">6 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">存取與身分</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>7 項中有 0 項（0%）／7 項中有 0 項（0%）</span>
        <span>7 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">頻道設定與操作</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中有 0 項（0%）／5 項中有 0 項（0%）</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">對話路由與傳遞</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>1 項中有 0 項（0%）／1 項中有 0 項（0%）</span>
        <span>1 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">加密與驗證</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>3 項中有 0 項（0%）／3 項中有 0 項（0%）</span>
        <span>3 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體與豐富內容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>1 項中有 0 項（0%）／1 項中有 0 項（0%）</span>
        <span>1 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生控制與核准</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>6 項中有 0 項（0%）／6 項中有 0 項（0%）</span>
        <span>6 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mattermost、LINE、IRC、Nextcloud Talk、Nostr、Twitch、Tlon、Synology Chat－4 個領域">
    <p className="maturity-readiness-summary">4 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">存取與身分</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查－完整分類體系驗證</span>
        </div>
        <span>1 項中的 0 項（0%）／1 項中的 0 項（0%）</span>
        <span>1 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">頻道設定與操作</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查－完整分類體系驗證</span>
        </div>
        <span>1 項中的 0 項（0%）／1 項中的 0 項（0%）</span>
        <span>1 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">對話路由與傳遞</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查－完整分類體系驗證</span>
        </div>
        <span>1 項中的 0 項（0%）／1 項中的 0 項（0%）</span>
        <span>1 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體與豐富內容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查－完整分類體系驗證</span>
        </div>
        <span>1 項中的 0 項（0%）／1 項中的 0 項（0%）</span>
        <span>1 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="媒體理解與媒體生成－6 個領域">
    <p className="maturity-readiness-summary">4 個需要審查／2 個已部分審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">頻道媒體處理</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查－完整分類體系驗證</span>
        </div>
        <span>5 項中的 0 項（0%）／5 項中的 0 項（0%）</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查－完整分類體系驗證</span>
        </div>
        <span>1 項中的 0 項（0%）／1 項中的 0 項（0%）</span>
        <span>1 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體生成</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查－完整分類體系驗證</span>
        </div>
        <span>17 項中的 1 項（5.9%）／19 項中的 1 項（5.3%）</span>
        <span>18 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體接收與存取</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查－完整分類體系驗證</span>
        </div>
        <span>8 項中的 0 項（0%）／8 項中的 0 項（0%）</span>
        <span>8 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體理解</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查－完整分類體系驗證</span>
        </div>
        <span>12 項中的 0 項（0%）／14 項中的 1 項（7.1%）</span>
        <span>13 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">文字轉語音傳遞</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查－完整分類體系驗證</span>
        </div>
        <span>2 項中的 0 項（0%）／2 項中的 0 項（0%）</span>
        <span>2 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams－5 個領域">
    <p className="maturity-readiness-summary">5 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">存取與身分</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查－完整分類體系驗證</span>
        </div>
        <span>9 項中的 0 項（0%）／9 項中的 0 項（0%）</span>
        <span>9 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">頻道設定與操作</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查－完整分類體系驗證</span>
        </div>
        <span>9 項中的 0 項（0%）／9 項中的 0 項（0%）</span>
        <span>9 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">對話路由與傳遞</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查－完整分類體系驗證</span>
        </div>
        <span>5 項中的 0 項（0%）／5 項中的 0 項（0%）</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體與豐富內容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查－完整分類體系驗證</span>
        </div>
        <span>5 項中的 0 項（0%）／5 項中的 0 項（0%）</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生控制項與核准</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查－完整分類體系驗證</span>
        </div>
        <span>5 項中的 0 項（0%）／5 項中的 0 項（0%）</span>
        <span>5 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="原生 Windows－4 個領域">
    <p className="maturity-readiness-summary">4 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">命令列介面</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查－完整分類體系驗證</span>
        </div>
        <span>9 項中的 0 項（0%）／9 項中的 0 項（0%）</span>
        <span>9 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">閘道管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查－完整分類體系驗證</span>
        </div>
        <span>11 項中的 0 項（0%）／11 項中的 0 項（0%）</span>
        <span>11 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">網路連線</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查－完整分類體系驗證</span>
        </div>
        <span>4 項中的 0 項（0%）／4 項中的 0 項（0%）</span>
        <span>4 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">更新</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查－完整分類體系驗證</span>
        </div>
        <span>4 項中的 0 項（0%）／4 項中的 0 項（0%）</span>
        <span>4 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="原生 Windows 伴隨應用程式 - 5 個領域">
    <p className="maturity-readiness-summary">5 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">聊天工作階段</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0 of 2 (0%) / 0 of 2 (0%)</span>
        <span>2 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">桌面工具與權限</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0 of 10 (0%) / 0 of 10 (0%)</span>
        <span>10 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">閘道連線</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0 of 3 (0%) / 0 of 3 (0%)</span>
        <span>3 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">安裝與更新</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0 of 4 (0%) / 0 of 4 (0%)</span>
        <span>4 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">狀態與修復</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0 of 5 (0%) / 0 of 5 (0%)</span>
        <span>5 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Nix 安裝路徑 - 5 個領域">
    <p className="maturity-readiness-summary">5 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">啟用與應用程式使用者體驗</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0 of 7 (0%) / 0 of 7 (0%)</span>
        <span>7 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">設定與狀態</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0 of 7 (0%) / 0 of 7 (0%)</span>
        <span>7 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">安裝交接</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0 of 4 (0%) / 0 of 4 (0%)</span>
        <span>4 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">外掛生命週期</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0 of 4 (0%) / 0 of 4 (0%)</span>
        <span>4 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">服務執行階段與防護機制</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0 of 8 (0%) / 0 of 8 (0%)</span>
        <span>8 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenAI 與 Codex 提供者路徑 - 5 個領域">
    <p className="maturity-readiness-summary">2 個需要審查／3 個已部分審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">影像與多模態輸入</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0 of 2 (0%) / 0 of 2 (0%)</span>
        <span>2 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">模型與驗證</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>1 of 6 (16.7%) / 4 of 9 (44.4%)</span>
        <span>5 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生 Codex 測試框架</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>0 of 2 (0%) / 4 of 9 (44.4%)</span>
        <span>5 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">回應與工具相容性</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>1 of 4 (25%) / 2 of 5 (40%)</span>
        <span>3 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">語音與即時音訊</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0 of 2 (0%) / 0 of 2 (0%)</span>
        <span>2 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenClaw 應用程式 SDK - 6 個領域">
    <p className="maturity-readiness-summary">5 個需要審查／1 個已部分審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">代理程式對話</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0 of 6 (0%) / 0 of 6 (0%)</span>
        <span>6 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">用戶端 API</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0 of 4 (0%) / 0 of 4 (0%)</span>
        <span>4 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">相容性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0 of 5 (0%) / 0 of 5 (0%)</span>
        <span>5 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">事件與核准</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0 of 5 (0%) / 0 of 5 (0%)</span>
        <span>5 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">閘道存取</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>0 of 5 (0%) / 0 of 5 (0%)</span>
        <span>5 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">資源輔助工具</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>0 of 5 (0%) / 1 of 6 (16.7%)</span>
        <span>5 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenRouter 提供者路徑 - 4 個領域">
    <p className="maturity-readiness-summary">4 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">聊天執行階段與正規化</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類法驗證</span>
        </div>
        <span>15 項中 0 項 (0%)／15 項中 0 項 (0%)</span>
        <span>15 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體生成與語音</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類法驗證</span>
        </div>
        <span>7 項中 0 項 (0%)／7 項中 0 項 (0%)</span>
        <span>7 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">提供者復原與診斷</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類法驗證</span>
        </div>
        <span>5 項中 0 項 (0%)／5 項中 0 項 (0%)</span>
        <span>5 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">提供者設定與驗證</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類法驗證</span>
        </div>
        <span>14 項中 0 項 (0%)／14 項中 0 項 (0%)</span>
        <span>14 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="外掛 - 9 個領域">
    <p className="maturity-readiness-summary">6 個需要審查／3 個已部分審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">外掛製作與封裝</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類法驗證</span>
        </div>
        <span>8 項中 0 項 (0%)／8 項中 0 項 (0%)</span>
        <span>8 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">隨附外掛</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類法驗證</span>
        </div>
        <span>5 項中 0 項 (0%)／5 項中 0 項 (0%)</span>
        <span>5 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas 外掛</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類法驗證</span>
        </div>
        <span>6 項中 0 項 (0%)／6 項中 0 項 (0%)</span>
        <span>6 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">頻道外掛</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類法驗證</span>
        </div>
        <span>5 項中 0 項 (0%)／5 項中 0 項 (0%)</span>
        <span>5 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">安裝與執行外掛</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類法驗證</span>
        </div>
        <span>6 項中 0 項 (0%)／20 項中 7 項 (35%)</span>
        <span>13 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">外掛核准</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類法驗證</span>
        </div>
        <span>6 項中 0 項 (0%)／6 項中 0 項 (0%)</span>
        <span>6 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">提供者與工具外掛</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類法驗證</span>
        </div>
        <span>6 項中 1 項 (16.7%)／21 項中 9 項 (42.9%)</span>
        <span>12 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">發布外掛</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類法驗證</span>
        </div>
        <span>6 項中 0 項 (0%)／6 項中 0 項 (0%)</span>
        <span>6 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">測試外掛</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類法驗證</span>
        </div>
        <span>6 項中 0 項 (0%)／11 項中 3 項 (27.3%)</span>
        <span>8 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi 與小型 Linux 裝置 - 4 個領域">
    <p className="maturity-readiness-summary">4 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">閘道執行階段</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類法驗證</span>
        </div>
        <span>10 項中 0 項 (0%)／10 項中 0 項 (0%)</span>
        <span>10 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">效能與診斷</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類法驗證</span>
        </div>
        <span>5 項中 0 項 (0%)／5 項中 0 項 (0%)</span>
        <span>5 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">遠端存取與驗證</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類法驗證</span>
        </div>
        <span>9 項中 0 項 (0%)／9 項中 0 項 (0%)</span>
        <span>9 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">設定與相容性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類法驗證</span>
        </div>
        <span>12 項中 0 項 (0%)／12 項中 0 項 (0%)</span>
        <span>12 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="安全性、驗證、配對與機密資料 - 6 個領域">
    <p className="maturity-readiness-summary">2 個已部分審查／4 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">核准政策與工具防護措施</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類法驗證</span>
        </div>
        <span>2 項中 0 項 (0%)／6 項中 3 項 (50%)</span>
        <span>3 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">頻道存取控制</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類法驗證</span>
        </div>
        <span>3 項中 0 項 (0%)／3 項中 0 項 (0%)</span>
        <span>3 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">憑證與機密資料管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類法驗證</span>
        </div>
        <span>5 項中 0 項 (0%)／11 項中 5 項 (45.5%)</span>
        <span>6 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">裝置與節點配對</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類法驗證</span>
        </div>
        <span>11 項中 0 項 (0%)／11 項中 0 項 (0%)</span>
        <span>11 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">閘道驗證與遠端存取</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類法驗證</span>
        </div>
        <span>9 項中 0 項 (0%)／9 項中 0 項 (0%)</span>
        <span>9 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">外掛信任</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類法驗證</span>
        </div>
        <span>2 項中 0 項 (0%)／2 項中 0 項 (0%)</span>
        <span>2 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="工作階段、記憶與上下文引擎 - 9 個領域">
    <p className="maturity-readiness-summary">2 個需要審查 / 7 個已部分審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能 / 涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">命令列介面工作階段與逐字稿管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>2 項中有 0 項 (0%) / 2 項中有 0 項 (0%)</span>
        <span>2 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">上下文引擎</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>2 項中有 0 項 (0%) / 7 項中有 4 項 (57.1%)</span>
        <span>3 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">核心提示詞與上下文</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>2 項中有 0 項 (0%) / 8 項中有 3 項 (37.5%)</span>
        <span>5 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">跨用戶端歷程與工作階段一致性</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>2 項中有 0 項 (0%) / 5 項中有 2 項 (40%)</span>
        <span>3 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">診斷、維護與復原</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>3 項中有 0 項 (0%) / 10 項中有 4 項 (40%)</span>
        <span>6 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">記憶</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中有 0 項 (0%) / 13 項中有 6 項 (46.2%)</span>
        <span>7 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">工作階段路由</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>2 項中有 0 項 (0%) / 4 項中有 1 項 (25%)</span>
        <span>3 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">權杖管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>3 項中有 0 項 (0%) / 10 項中有 2 項 (20%)</span>
        <span>8 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">逐字稿持久化</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>2 項中有 0 項 (0%) / 2 項中有 0 項 (0%)</span>
        <span>2 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal - 5 個領域">
    <p className="maturity-readiness-summary">5 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能 / 涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">存取與身分</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>6 項中有 0 項 (0%) / 6 項中有 0 項 (0%)</span>
        <span>6 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">頻道設定與操作</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>7 項中有 0 項 (0%) / 7 項中有 0 項 (0%)</span>
        <span>7 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">對話路由與傳遞</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>1 項中有 0 項 (0%) / 1 項中有 0 項 (0%)</span>
        <span>1 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體與豐富內容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>7 項中有 0 項 (0%) / 7 項中有 0 項 (0%)</span>
        <span>7 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生控制項與核准</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>3 項中有 0 項 (0%) / 3 項中有 0 項 (0%)</span>
        <span>3 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack - 5 個領域">
    <p className="maturity-readiness-summary">5 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能 / 涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">存取與身分</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>1 項中有 0 項 (0%) / 1 項中有 0 項 (0%)</span>
        <span>1 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">頻道設定與操作</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>10 項中有 0 項 (0%) / 10 項中有 0 項 (0%)</span>
        <span>10 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">對話路由與傳遞</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中有 0 項 (0%) / 5 項中有 0 項 (0%)</span>
        <span>5 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體與豐富內容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>1 項中有 0 項 (0%) / 1 項中有 0 項 (0%)</span>
        <span>1 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生控制項與核准</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>8 項中有 0 項 (0%) / 8 項中有 0 項 (0%)</span>
        <span>8 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram - 5 個領域">
    <p className="maturity-readiness-summary">5 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能 / 涵蓋範圍 ID</span><span>後續處理</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">存取與身分</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>10 項中有 0 項 (0%) / 10 項中有 0 項 (0%)</span>
        <span>10 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">頻道設定與操作</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>10 項中有 0 項 (0%) / 10 項中有 0 項 (0%)</span>
        <span>10 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">對話路由與傳遞</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>1 項中有 0 項 (0%) / 1 項中有 0 項 (0%)</span>
        <span>1 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體與豐富內容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>1 項中有 0 項 (0%) / 1 項中有 0 項 (0%)</span>
        <span>1 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生控制項與核准</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>9 項中有 0 項 (0%) / 9 項中有 0 項 (0%)</span>
        <span>9 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="可觀測性 - 5 個領域">
    <p className="maturity-readiness-summary">3 個已部分審查 / 2 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能 / 涵蓋範圍 ID</span><span>後續工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">診斷資料收集</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>8 項中有 1 項（12.5%）/ 10 項中有 3 項（30%）</span>
        <span>7 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">健康狀態與修復</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>12 項中有 1 項（8.3%）/ 18 項中有 5 項（27.8%）</span>
        <span>13 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">日誌記錄</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中有 0 項（0%）/ 5 項中有 0 項（0%）</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">工作階段診斷</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>4 項中有 0 項（0%）/ 4 項中有 0 項（0%）</span>
        <span>4 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">遙測資料匯出</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>13 項中有 1 項（7.7%）/ 21 項中有 7 項（33.3%）</span>
        <span>14 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="終端介面 - 5 個領域">
    <p className="maturity-readiness-summary">5 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能 / 涵蓋範圍 ID</span><span>後續工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">輸入與命令</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>8 項中有 0 項（0%）/ 8 項中有 0 項（0%）</span>
        <span>8 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">本機 Shell 執行</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>4 項中有 0 項（0%）/ 4 項中有 0 項（0%）</span>
        <span>4 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">轉譯與輸出安全性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>4 項中有 0 項（0%）/ 4 項中有 0 項（0%）</span>
        <span>4 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">執行階段模式</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>14 項中有 0 項（0%）/ 14 項中有 0 項（0%）</span>
        <span>14 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">工作階段管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>3 項中有 0 項（0%）/ 3 項中有 0 項（0%）</span>
        <span>3 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="語音與即時對話 - 6 個領域">
    <p className="maturity-readiness-summary">6 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能 / 涵蓋範圍 ID</span><span>後續工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生應用程式對話</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>4 項中有 0 項（0%）/ 4 項中有 0 項（0%）</span>
        <span>4 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">即時對話工作階段</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>11 項中有 0 項（0%）/ 11 項中有 0 項（0%）</span>
        <span>11 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">語音與轉錄</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中有 0 項（0%）/ 5 項中有 0 項（0%）</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">對話可觀測性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中有 0 項（0%）/ 5 項中有 0 項（0%）</span>
        <span>5 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">對話服務提供者</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>7 項中有 0 項（0%）/ 7 項中有 0 項（0%）</span>
        <span>7 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">語音喚醒與路由</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>4 項中有 0 項（0%）/ 4 項中有 0 項（0%）</span>
        <span>4 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="語音通話頻道 - 5 個領域">
    <p className="maturity-readiness-summary">5 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能 / 涵蓋範圍 ID</span><span>後續工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">存取與身分</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>1 項中有 0 項（0%）/ 1 項中有 0 項（0%）</span>
        <span>1 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">頻道設定與操作</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>2 項中有 0 項（0%）/ 2 項中有 0 項（0%）</span>
        <span>2 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">對話路由與傳遞</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>1 項中有 0 項（0%）/ 1 項中有 0 項（0%）</span>
        <span>1 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體與豐富內容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>2 項中有 0 項（0%）/ 2 項中有 0 項（0%）</span>
        <span>2 項能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">即時語音與通話</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>2 項中有 0 項（0%）/ 2 項中有 0 項（0%）</span>
        <span>2 項能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="watchOS 伴隨介面 - 5 個領域">
    <p className="maturity-readiness-summary">5 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續行動</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">傳遞與復原</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>7 項中的 0 項 (0%) / 7 項中的 0 項 (0%)</span>
        <span>7 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">發布與支援</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>6 項中的 0 項 (0%) / 6 項中的 0 項 (0%)</span>
        <span>6 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">執行核准</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>3 項中的 0 項 (0%) / 3 項中的 0 項 (0%)</span>
        <span>3 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">通知與回覆</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>7 項中的 0 項 (0%) / 7 項中的 0 項 (0%)</span>
        <span>7 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">手錶 App 使用者介面</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>3 項中的 0 項 (0%) / 3 項中的 0 項 (0%)</span>
        <span>3 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="網頁搜尋工具 - 4 個領域">
    <p className="maturity-readiness-summary">2 個需要審查／2 個已部分審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續行動</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">網路安全</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>4 項中的 0 項 (0%) / 4 項中的 0 項 (0%)</span>
        <span>4 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">搜尋供應商</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>19 項中的 2 項 (10.5%) / 19 項中的 2 項 (10.5%)</span>
        <span>17 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">設定與診斷</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>9 項中的 0 項 (0%) / 9 項中的 0 項 (0%)</span>
        <span>9 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">工具可用性與擷取</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>11 項中的 2 項 (18.2%) / 12 項中的 3 項 (25%)</span>
        <span>9 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp - 5 個領域">
    <p className="maturity-readiness-summary">5 個需要審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續行動</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">存取與身分</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>7 項中的 0 項 (0%) / 7 項中的 0 項 (0%)</span>
        <span>7 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">頻道設定與運作</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>5 項中的 0 項 (0%) / 5 項中的 0 項 (0%)</span>
        <span>5 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">對話路由與傳遞</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>4 項中的 0 項 (0%) / 4 項中的 0 項 (0%)</span>
        <span>4 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒體與豐富內容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>2 項中的 0 項 (0%) / 2 項中的 0 項 (0%)</span>
        <span>2 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生控制項與核准</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>2 項中的 0 項 (0%) / 2 項中的 0 項 (0%)</span>
        <span>2 個能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="透過 WSL2 使用 Windows - 6 個領域">
    <p className="maturity-readiness-summary">5 個需要審查／1 個已部分審查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>功能／涵蓋範圍 ID</span><span>後續行動</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">瀏覽器與控制介面</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>6 項中的 0 項 (0%) / 6 項中的 0 項 (0%)</span>
        <span>6 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">命令列介面</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>8 項中的 0 項 (0%) / 8 項中的 0 項 (0%)</span>
        <span>8 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">診斷與修復</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分審查 - 完整分類體系驗證</span>
        </div>
        <span>6 項中的 1 項 (16.7%) / 8 項中的 3 項 (37.5%)</span>
        <span>5 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">閘道存取與公開</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>11 項中的 0 項 (0%) / 11 項中的 0 項 (0%)</span>
        <span>11 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">閘道服務生命週期</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>10 項中的 0 項 (0%) / 10 項中的 0 項 (0%)</span>
        <span>10 個能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WSL 設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要審查 - 完整分類體系驗證</span>
        </div>
        <span>6 項中的 0 項 (0%) / 6 項中的 0 項 (0%)</span>
        <span>6 個能力缺口</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> 最後更新：2026-06-22
