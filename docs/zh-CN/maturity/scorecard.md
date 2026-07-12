---
summary: OpenClaw 产品领域、集成和受支持工作流的发布就绪度评分。
title: 成熟度评分卡
x-i18n:
    generated_at: "2026-07-11T20:38:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0cc55f54773a19369b865994ea22d00f1e07fc7df2b2d5b14cb4067f994fb0e2
    source_path: maturity/scorecard.md
    workflow: 16
---

# 成熟度评分卡

<div className="maturity-hero">
  <p className="maturity-kicker">发布就绪度——根据分类法和 QA 证据生成</p>
  <p className="maturity-hero-title">以实用视角呈现哪些内容已经就绪、哪些已经得到验证，以及哪些仍需改进。</p>
  <p>50 个功能面——281 个能力领域——确定性覆盖率，加上经人工审核的质量和完整性。</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">浏览功能面</a> / <a href="#qa-evidence-summary">查看 QA 证据</a> / <a href="/zh-CN/maturity/taxonomy">阅读分类法</a></p>
</div>

## 此页面的用途

使用此页面回答一个问题：哪些 OpenClaw 功能面是可信的发布选择，哪些证据支持这一判断？覆盖率来自确定性 QA 证据；质量和完整性则以经过审核的成熟度分数进行维护。

## 概览

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">68%</span>
      <span>成熟度分数</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "68" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">Alpha</span>
      <span>质量和完整性</span>
      <span>覆盖率 Experimental——4%</span>
      <span>质量 Alpha——64%</span>
      <span>完整性 Beta——71%</span>
    </div>
  </div>
</div>

覆盖率刻意以证据为导向：某个领域不会仅仅因为已有实现就变为“就绪”。覆盖率不计入成熟度分数，但 OpenClaw 的目标是长期将成熟的 Stable 或更高等级功能的端到端覆盖率保持在 90% 以上。

## 分数区间

<div className="maturity-band-list">
  <div className="maturity-band maturity-band-experimental"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-experimental">Experimental</span></span><span>0-50%</span></div>
  <div className="maturity-band maturity-band-alpha"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-alpha">Alpha</span></span><span>50-70%</span></div>
  <div className="maturity-band maturity-band-beta"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-beta">Beta</span></span><span>70-80%</span></div>
  <div className="maturity-band maturity-band-stable"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-stable">Stable</span></span><span>80-95%</span></div>
  <div className="maturity-band maturity-band-clawesome"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-clawesome">Clawesome</span></span><span>95-100%</span></div>
</div>

## 功能面浏览器

<a id="surface-explorer" />

功能面按成熟度等级、完整性和质量排序。每一行还会显示 LTS 支持情况，以便轻松比较适合发布的选项。

  <Tabs>
  <Tab title="所有界面">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>界面</span><span>覆盖率</span><span>质量</span><span>完整度</span><span>支持情况</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>稳定</span></span><span>7 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">稳定</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">稳定</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Gateway 网关运行时</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>稳定</span></span><span>13 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">稳定</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">稳定</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Linux Gateway 网关主机</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>稳定</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">稳定</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">macOS Gateway 网关主机</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>稳定</span></span><span>7 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">稳定</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>稳定</span></span><span>6 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">稳定</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#android-app"><span className="maturity-surface-title">Android 应用</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>稳定</span></span><span>7 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">稳定</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">稳定</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#ios-app"><span className="maturity-surface-title">iOS 应用</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>稳定</span></span><span>8 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">稳定</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">稳定</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Agent 运行时</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">会话、记忆和上下文引擎</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">渠道框架</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">浏览器自动化、Exec 和沙箱工具</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#observability"><span className="maturity-surface-title">可观测性</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">OpenAI 和 Codex 提供商路径</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Gateway 网关 Web 应用</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>6 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Web 搜索工具</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>4 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#plugins"><span className="maturity-surface-title">插件</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>9 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">安全、身份验证、配对和密钥</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>6 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">自动化：cron、钩子、任务、轮询</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>6 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Docker 和 Podman 托管</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>4 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">通过 WSL2 运行 Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>6 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi 和小型 Linux 设备</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>4 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Anthropic 提供商路径</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">完整 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">完整 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Google 提供商路径</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage 和 BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">macOS 配套应用</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>8 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">OpenRouter 提供商路径</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>4 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">媒体理解和媒体生成</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">图像、视频和音乐生成工具</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">本地模型提供商：Ollama、vLLM、SGLang、LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">长尾托管提供商</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>3 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">语音和实时对话</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#native-windows"><span className="maturity-surface-title">原生 Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Kubernetes 托管</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu、QQ Bot、微信、腾讯元宝、Zalo、Zalo Personal、区域渠道</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost、LINE、IRC、Nextcloud Talk、Nostr、Twitch、Tlon、Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw 应用 SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Nix 安装路径</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>实验性</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">语音通话渠道</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>实验性</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">watchOS 配套界面</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>实验性</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Linux 配套应用</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>计划中</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">原生 Windows 配套应用</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>计划中</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Core">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>功能面</span><span>覆盖率</span><span>质量</span><span>完整度</span><span>支持</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>稳定</span></span><span>7 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">稳定</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">稳定</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Gateway 网关运行时</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>稳定</span></span><span>13 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">稳定</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">稳定</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">智能体运行时</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>9 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">会话、记忆和上下文引擎</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>9 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">渠道框架</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>8 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#observability"><span className="maturity-surface-title">可观测性</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Gateway 网页应用</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>6 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#plugins"><span className="maturity-surface-title">插件</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>9 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">安全、身份验证、配对和密钥</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>6 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">自动化：cron、钩子、任务、轮询</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>6 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">媒体理解和媒体生成</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha 版</span></span><span>6 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">语音和实时对话</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha 版</span></span><span>6 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha 版</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha 版</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw 应用 SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="平台">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>功能面</span><span>覆盖率</span><span>质量</span><span>完整度</span><span>支持</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Linux Gateway 网关主机</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>稳定</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">稳定</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">macOS Gateway 网关主机</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>稳定</span></span><span>7 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">稳定</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#android-app"><span className="maturity-surface-title">Android 应用</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>稳定</span></span><span>7 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">稳定</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">稳定</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#ios-app"><span className="maturity-surface-title">iOS 应用</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>稳定</span></span><span>8 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">稳定版</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">稳定版</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Docker 和 Podman 托管</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>4 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">通过 WSL2 运行 Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>6 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">内测版</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi 和小型 Linux 设备</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>4 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">内测版</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">macOS 配套应用</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>8 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">内测版</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#native-windows"><span className="maturity-surface-title">原生 Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>内测版</span></span><span>4 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">内测版</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">内测版</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Kubernetes 托管</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>内测版</span></span><span>4 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">内测版</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Nix 安装路径</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>实验性</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">watchOS 配套界面</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>实验性</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Linux 配套应用</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>计划中</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">原生 Windows 配套应用</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>计划中</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="渠道">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>界面</span><span>覆盖率</span><span>质量</span><span>完整度</span><span>支持</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>稳定</span></span><span>6 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">稳定</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">完整 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">完整 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage 和 BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu、QQ Bot、微信、腾讯元宝、Zalo、Zalo Personal、区域渠道</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost、LINE、IRC、Nextcloud Talk、Nostr、Twitch、Tlon、Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">语音通话渠道</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>实验性</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="提供商和工具">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>功能面</span><span>覆盖率</span><span>质量</span><span>完整度</span><span>支持</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">浏览器自动化、Exec 和沙箱工具</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">OpenAI 和 Codex 提供商路径</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分支持 - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Web 搜索工具</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>4 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Anthropic 提供商路径</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Google 提供商路径</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">内测版</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">OpenRouter 提供商路径</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>测试版</span></span><span>4 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">内测版</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">测试版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">图像、视频和音乐生成工具</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>内测版</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">内测版</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">内测版</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">本地模型提供商：Ollama、vLLM、SGLang、LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>内测版</span></span><span>5 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">内测版</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">内测版</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/zh-CN/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">长尾托管提供商</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>内测版</span></span><span>3 个领域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">覆盖率</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">实验性</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">质量</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完整度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">无</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## QA 证据摘要

以下检查显示了成熟度评分卡中哪些领域已由 QA 配置文件证据覆盖验证。

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">完整分类法验证</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>96 项检查 - 94 项通过，2 项受阻</span>
    <span>281 个领域中的 0 个（0%）- 1675 项功能中的 20 项（1.2%）- 1665 个覆盖 ID 中的 77 个（4.6%）</span>
  </div>
</div>

### 各领域就绪情况

展开一个部分以查看各类别的证据状态。列表默认保持折叠，以便快速浏览页面。

<AccordionGroup>
  <Accordion title="Agent 运行时 - 9 个领域">
    <p className="maturity-readiness-summary">8 个已部分审查 / 1 个需要审查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Agent 轮次执行</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查 - 完整分类法验证</span>
        </div>
        <span>3 项中的 0 项（0%）/ 24 项中的 7 项（29.2%）</span>
        <span>17 项能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">外部运行时和子智能体</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查 - 完整分类法验证</span>
        </div>
        <span>4 项中的 0 项（0%）/ 10 项中的 3 项（30%）</span>
        <span>7 项能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">托管提供商执行</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查 - 完整分类法验证</span>
        </div>
        <span>5 项中的 1 项（20%）/ 5 项中的 1 项（20%）</span>
        <span>4 项能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">本地和自托管提供商</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>5 项中的 0 项（0%）/ 5 项中的 0 项（0%）</span>
        <span>5 项能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">模型和运行时选择</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查 - 完整分类法验证</span>
        </div>
        <span>4 项中的 0 项（0%）/ 8 项中的 2 项（25%）</span>
        <span>6 项能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">提供商身份验证</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查 - 完整分类法验证</span>
        </div>
        <span>10 项中的 0 项（0%）/ 17 项中的 4 项（23.5%）</span>
        <span>13 项能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">流式传输和进度</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查 - 完整分类法验证</span>
        </div>
        <span>2 项中的 0 项（0%）/ 9 项中的 5 项（55.6%）</span>
        <span>4 项能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">工具调用和响应处理</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查 - 完整分类法验证</span>
        </div>
        <span>3 项中的 0 项（0%）/ 23 项中的 15 项（65.2%）</span>
        <span>8 项能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">工具执行控制</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查 - 完整分类法验证</span>
        </div>
        <span>6 项中的 0 项（0%）/ 12 项中的 6 项（50%）</span>
        <span>6 项能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Android 应用 - 7 个领域">
    <p className="maturity-readiness-summary">7 个需要审查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">连接设置</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>1 项中的 0 项（0%）/ 1 项中的 0 项（0%）</span>
        <span>1 项能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">设备运行时</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>2 项中的 0 项（0%）/ 2 项中的 0 项（0%）</span>
        <span>2 项能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">分发</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>3 项中的 0 项（0%）/ 3 项中的 0 项（0%）</span>
        <span>3 项能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体采集</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>1 项中的 0 项（0%）/ 1 项中的 0 项（0%）</span>
        <span>1 项能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">移动端聊天</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>1 项中的 0 项（0%）/ 1 项中的 0 项（0%）</span>
        <span>1 项能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">设置</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>1 项中的 0 项（0%）/ 1 项中的 0 项（0%）</span>
        <span>1 项能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">语音</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>1 项中的 0 项（0%）/ 1 项中的 0 项（0%）</span>
        <span>1 项能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Anthropic 提供商路径 - 5 个领域">
    <p className="maturity-readiness-summary">5 个需要审查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体输入</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>4 项中的 0 项（0%）/ 4 项中的 0 项（0%）</span>
        <span>4 项能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">模型和运行时选择</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>10 项中的 0 项（0%）/ 12 项中的 0 项（0%）</span>
        <span>12 项能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">提示缓存和上下文</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>5 项中的 0 项（0%）/ 5 项中的 0 项（0%）</span>
        <span>5 项能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">提供商身份验证和恢复</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>9 项中的 0 项（0%）/ 9 项中的 0 项（0%）</span>
        <span>9 项能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">请求传输和轮次语义</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>10 项中的 0 项（0%）/ 10 项中的 0 项（0%）</span>
        <span>10 项能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="自动化：cron、钩子、任务、轮询——6 个领域">
    <p className="maturity-readiness-summary">5 个需要审查 / 1 个已部分审查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">自动化钩子</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查——完整分类法验证</span>
        </div>
        <span>11 项中有 0 项（0%）/ 11 项中有 0 项（0%）</span>
        <span>11 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">后台任务和流程</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查——完整分类法验证</span>
        </div>
        <span>10 项中有 0 项（0%）/ 10 项中有 0 项（0%）</span>
        <span>10 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cron 作业</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查——完整分类法验证</span>
        </div>
        <span>15 项中有 0 项（0%）/ 15 项中有 0 项（0%）</span>
        <span>15 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">事件入口</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查——完整分类法验证</span>
        </div>
        <span>15 项中有 0 项（0%）/ 15 项中有 0 项（0%）</span>
        <span>15 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Heartbeat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查——完整分类法验证</span>
        </div>
        <span>5 项中有 0 项（0%）/ 7 项中有 1 项（14.3%）</span>
        <span>6 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">轮询控制</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查——完整分类法验证</span>
        </div>
        <span>10 项中有 0 项（0%）/ 10 项中有 0 项（0%）</span>
        <span>10 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="浏览器自动化、Exec 和沙箱工具——3 个领域">
    <p className="maturity-readiness-summary">2 个已部分审查 / 1 个需要审查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">浏览器自动化</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查——完整分类法验证</span>
        </div>
        <span>8 项中有 1 项（12.5%）/ 8 项中有 1 项（12.5%）</span>
        <span>7 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">沙箱和工具策略</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查——完整分类法验证</span>
        </div>
        <span>6 项中有 0 项（0%）/ 6 项中有 0 项（0%）</span>
        <span>6 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">工具调用和执行</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查——完整分类法验证</span>
        </div>
        <span>6 项中有 2 项（33.3%）/ 8 项中有 4 项（50%）</span>
        <span>4 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Gateway 网关 Web 应用——6 个领域">
    <p className="maturity-readiness-summary">3 个需要审查 / 3 个已部分审查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">浏览器访问和信任</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查——完整分类法验证</span>
        </div>
        <span>5 项中有 0 项（0%）/ 5 项中有 0 项（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">浏览器实时对话</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查——完整分类法验证</span>
        </div>
        <span>5 项中有 0 项（0%）/ 5 项中有 0 项（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">浏览器界面</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查——完整分类法验证</span>
        </div>
        <span>10 项中有 0 项（0%）/ 12 项中有 1 项（8.3%）</span>
        <span>11 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">配置</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查——完整分类法验证</span>
        </div>
        <span>5 项中有 0 项（0%）/ 5 项中有 0 项（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">操作员控制台</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查——完整分类法验证</span>
        </div>
        <span>10 项中有 0 项（0%）/ 12 项中有 1 项（8.3%）</span>
        <span>11 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat 对话</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查——完整分类法验证</span>
        </div>
        <span>15 项中有 0 项（0%）/ 20 项中有 2 项（10%）</span>
        <span>18 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="渠道框架——8 个领域">
    <p className="maturity-readiness-summary">4 个需要审查 / 4 个已部分审查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">渠道操作、命令和审批</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查——完整分类法验证</span>
        </div>
        <span>5 项中有 0 项（0%）/ 5 项中有 0 项（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">渠道设置</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查——完整分类法验证</span>
        </div>
        <span>5 项中有 0 项（0%）/ 7 项中有 1 项（14.3%）</span>
        <span>6 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">对话路由和投递</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查——完整分类法验证</span>
        </div>
        <span>10 项中有 0 项（0%）/ 27 项中有 5 项（18.5%）</span>
        <span>22 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">群组话题串和环境房间行为</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查——完整分类法验证</span>
        </div>
        <span>5 项中有 0 项（0%）/ 11 项中有 4 项（36.4%）</span>
        <span>7 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">入站访问和身份门控</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查——完整分类法验证</span>
        </div>
        <span>5 项中有 0 项（0%）/ 5 项中有 0 项（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体附件和丰富渠道数据</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查——完整分类法验证</span>
        </div>
        <span>4 项中有 0 项（0%）/ 4 项中有 0 项（0%）</span>
        <span>4 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">出站投递和回复管线</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查——完整分类法验证</span>
        </div>
        <span>4 项中有 0 项（0%）/ 21 项中有 8 项（38.1%）</span>
        <span>13 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">状态、健康状况和操作员控制</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查——完整分类法验证</span>
        </div>
        <span>4 项中有 0 项（0%）/ 6 项中有 0 项（0%）</span>
        <span>6 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub - 4 个领域">
    <p className="maturity-readiness-summary">4 个需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">目录发现</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 0/5（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">兼容性和信任</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/12（0%）/ 0/12（0%）</span>
        <span>12 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">插件生命周期和健康状况</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/26（0%）/ 0/26（0%）</span>
        <span>26 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">发布</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/7（0%）/ 0/7（0%）</span>
        <span>7 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="CLI - 7 个领域">
    <p className="maturity-readiness-summary">5 个需要审核 / 2 个已部分审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI 可观测性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 0/5（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI 设置</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>1/6（16.7%）/ 1/6（16.7%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Doctor</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/10（0%）/ 0/10（0%）</span>
        <span>10 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 网关服务管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 1/7（14.3%）</span>
        <span>6 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">新手引导和身份验证设置</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 0/5（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">插件和渠道设置</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 0/5（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">更新和升级</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 0/5（0%）</span>
        <span>5 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord - 6 个领域">
    <p className="maturity-readiness-summary">6 个需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">访问和身份</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/6（0%）/ 0/6（0%）</span>
        <span>6 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">渠道设置和运维</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/10（0%）/ 0/10（0%）</span>
        <span>10 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">对话路由和投递</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/12（0%）/ 0/12（0%）</span>
        <span>12 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体和富内容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/1（0%）/ 0/1（0%）</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生控制和审批</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 0/5（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">实时语音和通话</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 0/5（0%）</span>
        <span>5 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Docker 和 Podman 托管 - 4 个领域">
    <p className="maturity-readiness-summary">3 个需要审核 / 1 个已部分审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Agent 沙箱和工具</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/3（0%）/ 0/3（0%）</span>
        <span>3 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">容器运维</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/11（0%）/ 0/11（0%）</span>
        <span>11 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">容器设置</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/6（0%）/ 0/6（0%）</span>
        <span>6 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">镜像发布和验证</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>1/5（20%）/ 2/7（28.6%）</span>
        <span>5 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu、QQ Bot、微信、腾讯元宝、Zalo、Zalo Personal、区域渠道 - 4 个领域">
    <p className="maturity-readiness-summary">4 个需要审查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">访问和身份</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>0/1 (0%) / 0/1 (0%)</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">渠道设置和运维</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>0/6 (0%) / 0/6 (0%)</span>
        <span>6 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">对话路由和交付</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>0/1 (0%) / 0/1 (0%)</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体和富内容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>0/1 (0%) / 0/1 (0%)</span>
        <span>1 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Gateway 网关运行时 - 13 个领域">
    <p className="maturity-readiness-summary">9 个需要审查 / 4 个已部分审查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">审批和远程执行</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>0/6 (0%) / 0/6 (0%)</span>
        <span>6 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">设备身份验证和配对</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>0/10 (0%) / 0/10 (0%)</span>
        <span>10 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 网关生命周期</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查 - 完整分类法验证</span>
        </div>
        <span>0/7 (0%) / 4/12 (33.3%)</span>
        <span>8 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 网关 RPC API 和事件</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查 - 完整分类法验证</span>
        </div>
        <span>0/20 (0%) / 2/22 (9.1%)</span>
        <span>20 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">健康状况、诊断和修复</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>0/7 (0%) / 0/7 (0%)</span>
        <span>7 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">托管 Web 界面</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>0/4 (0%) / 0/4 (0%)</span>
        <span>4 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">HTTP API</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查 - 完整分类法验证</span>
        </div>
        <span>1/4 (25%) / 1/4 (25%)</span>
        <span>3 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">网络访问和设备发现</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>0/6 (0%) / 0/6 (0%)</span>
        <span>6 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">节点和远程能力</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>0/8 (0%) / 0/8 (0%)</span>
        <span>8 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">协议兼容性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>0/7 (0%) / 0/7 (0%)</span>
        <span>7 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">角色和权限</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>0/5 (0%) / 0/5 (0%)</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">安全控制</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>0/6 (0%) / 0/6 (0%)</span>
        <span>6 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebSocket 连接</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查 - 完整分类法验证</span>
        </div>
        <span>1/8 (12.5%) / 1/8 (12.5%)</span>
        <span>7 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat - 5 个领域">
    <p className="maturity-readiness-summary">5 个需要审查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">访问和身份</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>0/11 (0%) / 0/11 (0%)</span>
        <span>11 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">渠道设置和运维</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>0/16 (0%) / 0/16 (0%)</span>
        <span>16 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">对话路由和交付</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>0/1 (0%) / 0/1 (0%)</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体和富内容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>0/1 (0%) / 0/1 (0%)</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生控制和审批</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>0/16 (0%) / 0/16 (0%)</span>
        <span>16 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google 提供商路径 - 5 个领域">
    <p className="maturity-readiness-summary">5 个领域需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">直接 Gemini 运行时</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 9 (0%) / 0 / 9 (0%)</span>
        <span>9 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体、搜索和实时功能</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 10 (0%) / 0 / 10 (0%)</span>
        <span>10 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">模型路由和端点</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 10 (0%) / 0 / 10 (0%)</span>
        <span>10 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">提示词缓存</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 5 (0%) / 0 / 5 (0%)</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">提供商设置和凭据</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 10 (0%) / 0 / 10 (0%)</span>
        <span>10 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="图像、视频和音乐生成工具 - 5 个领域">
    <p className="maturity-readiness-summary">5 个领域需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">图像生成</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 9 (0%) / 0 / 9 (0%)</span>
        <span>9 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体路由和发现</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 4 (0%) / 0 / 4 (0%)</span>
        <span>4 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">音乐生成</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 6 (0%) / 0 / 6 (0%)</span>
        <span>6 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">任务生命周期和交付</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 12 (0%) / 0 / 12 (0%)</span>
        <span>12 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">视频生成</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 11 (0%) / 0 / 11 (0%)</span>
        <span>11 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessage 和 BlueBubbles - 5 个领域">
    <p className="maturity-readiness-summary">5 个领域需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">访问和身份</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 6 (0%) / 0 / 6 (0%)</span>
        <span>6 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">渠道设置和运维</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 11 (0%) / 0 / 11 (0%)</span>
        <span>11 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">对话路由和交付</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 4 (0%) / 0 / 4 (0%)</span>
        <span>4 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体和富内容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 7 (0%) / 0 / 7 (0%)</span>
        <span>7 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生控制和审批</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 3 (0%) / 0 / 3 (0%)</span>
        <span>3 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iOS 应用 - 8 个领域">
    <p className="maturity-readiness-summary">8 个领域需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">画布和屏幕</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 1 (0%) / 0 / 1 (0%)</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">聊天和会话</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 1 (0%) / 0 / 1 (0%)</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">设备命令</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 2 (0%) / 0 / 2 (0%)</span>
        <span>2 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">分发</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 1 (0%) / 0 / 1 (0%)</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 网关设置和诊断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 7 (0%) / 0 / 7 (0%)</span>
        <span>7 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体和共享</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 1 (0%) / 0 / 1 (0%)</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">通知和后台运行</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 1 (0%) / 0 / 1 (0%)</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">语音</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 1 (0%) / 0 / 1 (0%)</span>
        <span>1 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Kubernetes 托管 - 4 个领域">
    <p className="maturity-readiness-summary">4 个领域需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">访问和暴露</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 0/5（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">集群生命周期</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 0/5（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">配置和机密信息</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 0/5（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">部署设置</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 0/5（0%）</span>
        <span>5 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Linux 配套应用 - 5 个领域">
    <p className="maturity-readiness-summary">5 个领域需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">应用分发</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/3（0%）/ 0/3（0%）</span>
        <span>3 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">聊天和会话</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/3（0%）/ 0/3（0%）</span>
        <span>3 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">桌面端能力</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/9（0%）/ 0/9（0%）</span>
        <span>9 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 网关连接</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/4（0%）/ 0/4（0%）</span>
        <span>4 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">状态和诊断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/7（0%）/ 0/7（0%）</span>
        <span>7 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Linux Gateway 网关主机 - 5 个领域">
    <p className="maturity-readiness-summary">5 个领域需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">部署目标</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/3（0%）/ 0/3（0%）</span>
        <span>3 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">诊断和修复</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/4（0%）/ 0/4（0%）</span>
        <span>4 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 网关运行时和服务控制</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/6（0%）/ 0/6（0%）</span>
        <span>6 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">主机设置和更新</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/4（0%）/ 0/4（0%）</span>
        <span>4 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">远程访问和安全性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/6（0%）/ 0/6（0%）</span>
        <span>6 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="本地模型提供商：Ollama、vLLM、SGLang、LM Studio - 5 个领域">
    <p className="maturity-readiness-summary">5 个领域需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">本地记忆和嵌入</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 0/5（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生提供商插件</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/10（0%）/ 0/10（0%）</span>
        <span>10 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">网络安全和提示词控制</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/2（0%）/ 0/2（0%）</span>
        <span>2 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">OpenAI 兼容运行时的兼容性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/8（0%）/ 0/8（0%）</span>
        <span>8 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">提供商设置、生命周期和诊断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/12（0%）/ 0/12（0%）</span>
        <span>12 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="长尾托管提供商 - 3 个领域">
    <p className="maturity-readiness-summary">3 个领域需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">托管式 LLM 提供商</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/12（0%）/ 0/12（0%）</span>
        <span>12 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">托管式媒体提供商</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/8（0%）/ 0/8（0%）</span>
        <span>8 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">提供商运维</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/12（0%）/ 0/12（0%）</span>
        <span>12 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="macOS 配套应用 - 8 个领域">
    <p className="maturity-readiness-summary">8 个领域需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">画布</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/4（0%）/ 0/4（0%）</span>
        <span>4 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">本地设置</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/7（0%）/ 0/7（0%）</span>
        <span>7 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生能力</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 0/5（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">远程连接</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/3（0%）/ 0/3（0%）</span>
        <span>3 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">远程 WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 0/5（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">状态和设置</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 0/5（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">语音和 Talk</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/3（0%）/ 0/3（0%）</span>
        <span>3 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/3（0%）/ 0/3（0%）</span>
        <span>3 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="macOS Gateway 网关主机 - 7 个领域">
    <p className="maturity-readiness-summary">7 个领域需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI 设置</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/4（0%）/ 0/4（0%）</span>
        <span>4 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">诊断和可观测性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/4（0%）/ 0/4（0%）</span>
        <span>4 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 网关服务生命周期</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/10（0%）/ 0/10（0%）</span>
        <span>10 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">本地 Gateway 网关集成</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/9（0%）/ 0/9（0%）</span>
        <span>9 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">权限和原生能力</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/4（0%）/ 0/4（0%）</span>
        <span>4 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">配置文件和隔离</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 0/5（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">远程 Gateway 网关模式</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 0/5（0%）</span>
        <span>5 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Matrix - 6 个领域">
    <p className="maturity-readiness-summary">6 个领域需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">访问权限和身份</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/7（0%）/ 0/7（0%）</span>
        <span>7 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">渠道设置和运维</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 0/5（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">对话路由和投递</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/1（0%）/ 0/1（0%）</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">加密和验证</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/3（0%）/ 0/3（0%）</span>
        <span>3 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体和富内容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/1（0%）/ 0/1（0%）</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生控制和审批</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/6（0%）/ 0/6（0%）</span>
        <span>6 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mattermost、LINE、IRC、Nextcloud Talk、Nostr、Twitch、Tlon、Synology Chat - 4 个领域">
    <p className="maturity-readiness-summary">4 个需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">访问与身份</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/1（0%）/ 0/1（0%）</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">渠道设置与运维</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/1（0%）/ 0/1（0%）</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">对话路由与递送</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/1（0%）/ 0/1（0%）</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体与富内容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/1（0%）/ 0/1（0%）</span>
        <span>1 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="媒体理解与媒体生成 - 6 个领域">
    <p className="maturity-readiness-summary">4 个需要审核 / 2 个已部分审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">渠道媒体处理</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 0/5（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体配置</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/1（0%）/ 0/1（0%）</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体生成</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>1/17（5.9%）/ 1/19（5.3%）</span>
        <span>18 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体接收与访问</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/8（0%）/ 0/8（0%）</span>
        <span>8 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体理解</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>0/12（0%）/ 1/14（7.1%）</span>
        <span>13 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">文本转语音递送</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/2（0%）/ 0/2（0%）</span>
        <span>2 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams - 5 个领域">
    <p className="maturity-readiness-summary">5 个需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">访问与身份</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/9（0%）/ 0/9（0%）</span>
        <span>9 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">渠道设置与运维</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/9（0%）/ 0/9（0%）</span>
        <span>9 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">对话路由与递送</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 0/5（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体与富内容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 0/5（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生控制与审批</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/5（0%）/ 0/5（0%）</span>
        <span>5 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="原生 Windows - 4 个领域">
    <p className="maturity-readiness-summary">4 个需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/9（0%）/ 0/9（0%）</span>
        <span>9 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 网关管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/11（0%）/ 0/11（0%）</span>
        <span>11 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">网络</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/4（0%）/ 0/4（0%）</span>
        <span>4 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">更新</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0/4（0%）/ 0/4（0%）</span>
        <span>4 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="原生 Windows 配套应用 - 5 个领域">
    <p className="maturity-readiness-summary">5 个领域需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">聊天会话</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>2 项中 0 项（0%）/ 2 项中 0 项（0%）</span>
        <span>2 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">桌面工具和权限</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>10 项中 0 项（0%）/ 10 项中 0 项（0%）</span>
        <span>10 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 网关连接</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>3 项中 0 项（0%）/ 3 项中 0 项（0%）</span>
        <span>3 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">安装和更新</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>4 项中 0 项（0%）/ 4 项中 0 项（0%）</span>
        <span>4 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">状态和修复</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>5 项中 0 项（0%）/ 5 项中 0 项（0%）</span>
        <span>5 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Nix 安装路径 - 5 个领域">
    <p className="maturity-readiness-summary">5 个领域需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">激活和应用用户体验</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>7 项中 0 项（0%）/ 7 项中 0 项（0%）</span>
        <span>7 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">配置和状态</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>7 项中 0 项（0%）/ 7 项中 0 项（0%）</span>
        <span>7 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">安装交接</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>4 项中 0 项（0%）/ 4 项中 0 项（0%）</span>
        <span>4 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">插件生命周期</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>4 项中 0 项（0%）/ 4 项中 0 项（0%）</span>
        <span>4 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">服务运行时和防护机制</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>8 项中 0 项（0%）/ 8 项中 0 项（0%）</span>
        <span>8 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenAI 和 Codex 提供商路径 - 5 个领域">
    <p className="maturity-readiness-summary">2 个领域需要审核 / 3 个领域已部分审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">图像和多模态输入</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>2 项中 0 项（0%）/ 2 项中 0 项（0%）</span>
        <span>2 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">模型和身份验证</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>6 项中 1 项（16.7%）/ 9 项中 4 项（44.4%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生 Codex Harness</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>2 项中 0 项（0%）/ 9 项中 4 项（44.4%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">响应和工具兼容性</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>4 项中 1 项（25%）/ 5 项中 2 项（40%）</span>
        <span>3 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">语音和实时音频</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>2 项中 0 项（0%）/ 2 项中 0 项（0%）</span>
        <span>2 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenClaw 应用 SDK - 6 个领域">
    <p className="maturity-readiness-summary">5 个领域需要审核 / 1 个领域已部分审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">智能体对话</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>6 项中 0 项（0%）/ 6 项中 0 项（0%）</span>
        <span>6 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">客户端 API</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>4 项中 0 项（0%）/ 4 项中 0 项（0%）</span>
        <span>4 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">兼容性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>5 项中 0 项（0%）/ 5 项中 0 项（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">事件和审批</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>5 项中 0 项（0%）/ 5 项中 0 项（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 网关访问</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>5 项中 0 项（0%）/ 5 项中 0 项（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">资源辅助工具</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>5 项中 0 项（0%）/ 6 项中 1 项（16.7%）</span>
        <span>5 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenRouter provider path - 4 areas">
    <p className="maturity-readiness-summary">4 个领域需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">聊天运行时与规范化</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>15 项中 0 项（0%）/ 15 项中 0 项（0%）</span>
        <span>15 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体生成与语音</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>7 项中 0 项（0%）/ 7 项中 0 项（0%）</span>
        <span>7 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">提供商恢复与诊断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>5 项中 0 项（0%）/ 5 项中 0 项（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">提供商设置与身份验证</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>14 项中 0 项（0%）/ 14 项中 0 项（0%）</span>
        <span>14 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Plugins - 9 areas">
    <p className="maturity-readiness-summary">6 个领域需要审核 / 3 个领域已部分审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">插件编写与打包</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>8 项中 0 项（0%）/ 8 项中 0 项（0%）</span>
        <span>8 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">内置插件</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>5 项中 0 项（0%）/ 5 项中 0 项（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas 插件</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>6 项中 0 项（0%）/ 6 项中 0 项（0%）</span>
        <span>6 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">渠道插件</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>5 项中 0 项（0%）/ 5 项中 0 项（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">安装和运行插件</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>6 项中 0 项（0%）/ 20 项中 7 项（35%）</span>
        <span>13 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">插件审批</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>6 项中 0 项（0%）/ 6 项中 0 项（0%）</span>
        <span>6 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">提供商插件和工具插件</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>6 项中 1 项（16.7%）/ 21 项中 9 项（42.9%）</span>
        <span>12 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">发布插件</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>6 项中 0 项（0%）/ 6 项中 0 项（0%）</span>
        <span>6 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">测试插件</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>6 项中 0 项（0%）/ 11 项中 3 项（27.3%）</span>
        <span>8 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi and small Linux devices - 4 areas">
    <p className="maturity-readiness-summary">4 个领域需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 网关运行时</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>10 项中 0 项（0%）/ 10 项中 0 项（0%）</span>
        <span>10 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">性能与诊断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>5 项中 0 项（0%）/ 5 项中 0 项（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">远程访问与身份验证</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>9 项中 0 项（0%）/ 9 项中 0 项（0%）</span>
        <span>9 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">设置与兼容性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>12 项中 0 项（0%）/ 12 项中 0 项（0%）</span>
        <span>12 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Security, auth, pairing, and secrets - 6 areas">
    <p className="maturity-readiness-summary">2 个领域已部分审核 / 4 个领域需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">审批策略与工具保护措施</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>2 项中 0 项（0%）/ 6 项中 3 项（50%）</span>
        <span>3 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">渠道访问控制</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>3 项中 0 项（0%）/ 3 项中 0 项（0%）</span>
        <span>3 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">凭证与机密信息卫生</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>5 项中 0 项（0%）/ 11 项中 5 项（45.5%）</span>
        <span>6 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">设备与节点配对</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>11 项中 0 项（0%）/ 11 项中 0 项（0%）</span>
        <span>11 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 网关身份验证与远程访问</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>9 项中 0 项（0%）/ 9 项中 0 项（0%）</span>
        <span>9 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">插件信任</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>2 项中 0 项（0%）/ 2 项中 0 项（0%）</span>
        <span>2 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="会话、记忆和上下文引擎 - 9 个领域">
    <p className="maturity-readiness-summary">2 个需要审核 / 7 个已部分审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI 会话和记录管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>2 项中有 0 项（0%）/ 2 项中有 0 项（0%）</span>
        <span>2 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">上下文引擎</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>2 项中有 0 项（0%）/ 7 项中有 4 项（57.1%）</span>
        <span>3 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">核心提示词和上下文</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>2 项中有 0 项（0%）/ 8 项中有 3 项（37.5%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">跨客户端历史记录和会话一致性</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>2 项中有 0 项（0%）/ 5 项中有 2 项（40%）</span>
        <span>3 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">诊断、维护和恢复</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>3 项中有 0 项（0%）/ 10 项中有 4 项（40%）</span>
        <span>6 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">记忆</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>5 项中有 0 项（0%）/ 13 项中有 6 项（46.2%）</span>
        <span>7 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会话路由</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>2 项中有 0 项（0%）/ 4 项中有 1 项（25%）</span>
        <span>3 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">令牌管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>3 项中有 0 项（0%）/ 10 项中有 2 项（20%）</span>
        <span>8 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">记录持久化</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>2 项中有 0 项（0%）/ 2 项中有 0 项（0%）</span>
        <span>2 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal - 5 个领域">
    <p className="maturity-readiness-summary">5 个需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">访问和身份</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>6 项中有 0 项（0%）/ 6 项中有 0 项（0%）</span>
        <span>6 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">渠道设置和运维</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>7 项中有 0 项（0%）/ 7 项中有 0 项（0%）</span>
        <span>7 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">对话路由和交付</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>1 项中有 0 项（0%）/ 1 项中有 0 项（0%）</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体和富内容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>7 项中有 0 项（0%）/ 7 项中有 0 项（0%）</span>
        <span>7 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生控制和审批</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>3 项中有 0 项（0%）/ 3 项中有 0 项（0%）</span>
        <span>3 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack - 5 个领域">
    <p className="maturity-readiness-summary">5 个需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">访问和身份</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>1 项中有 0 项（0%）/ 1 项中有 0 项（0%）</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">渠道设置和运维</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>10 项中有 0 项（0%）/ 10 项中有 0 项（0%）</span>
        <span>10 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">对话路由和交付</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>5 项中有 0 项（0%）/ 5 项中有 0 项（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体和富内容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>1 项中有 0 项（0%）/ 1 项中有 0 项（0%）</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生控制和审批</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>8 项中有 0 项（0%）/ 8 项中有 0 项（0%）</span>
        <span>8 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram - 5 个领域">
    <p className="maturity-readiness-summary">5 个需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">访问和身份</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>10 项中有 0 项（0%）/ 10 项中有 0 项（0%）</span>
        <span>10 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">渠道设置和运维</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>10 项中有 0 项（0%）/ 10 项中有 0 项（0%）</span>
        <span>10 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">对话路由和交付</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>1 项中有 0 项（0%）/ 1 项中有 0 项（0%）</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体和富内容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>1 项中有 0 项（0%）/ 1 项中有 0 项（0%）</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生控制和审批</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>9 项中有 0 项（0%）/ 9 项中有 0 项（0%）</span>
        <span>9 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="可观测性 - 5 个领域">
    <p className="maturity-readiness-summary">3 个已部分审查 / 2 个需要审查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">诊断信息收集</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查 - 完整分类法验证</span>
        </div>
        <span>8 项中有 1 项（12.5%）/ 10 项中有 3 项（30%）</span>
        <span>7 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">健康与修复</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查 - 完整分类法验证</span>
        </div>
        <span>12 项中有 1 项（8.3%）/ 18 项中有 5 项（27.8%）</span>
        <span>13 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">日志</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>5 项中有 0 项（0%）/ 5 项中有 0 项（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会话诊断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>4 项中有 0 项（0%）/ 4 项中有 0 项（0%）</span>
        <span>4 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">遥测数据导出</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审查 - 完整分类法验证</span>
        </div>
        <span>13 项中有 1 项（7.7%）/ 21 项中有 7 项（33.3%）</span>
        <span>14 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="TUI - 5 个领域">
    <p className="maturity-readiness-summary">5 个需要审查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">输入与命令</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>8 项中有 0 项（0%）/ 8 项中有 0 项（0%）</span>
        <span>8 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">本地 Shell 执行</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>4 项中有 0 项（0%）/ 4 项中有 0 项（0%）</span>
        <span>4 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">渲染与输出安全</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>4 项中有 0 项（0%）/ 4 项中有 0 项（0%）</span>
        <span>4 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">运行时模式</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>14 项中有 0 项（0%）/ 14 项中有 0 项（0%）</span>
        <span>14 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会话管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>3 项中有 0 项（0%）/ 3 项中有 0 项（0%）</span>
        <span>3 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="语音和实时对话 - 6 个领域">
    <p className="maturity-readiness-summary">6 个需要审查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生应用对话</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>4 项中有 0 项（0%）/ 4 项中有 0 项（0%）</span>
        <span>4 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">实时对话会话</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>11 项中有 0 项（0%）/ 11 项中有 0 项（0%）</span>
        <span>11 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">语音与转录</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>5 项中有 0 项（0%）/ 5 项中有 0 项（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">对话可观测性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>5 项中有 0 项（0%）/ 5 项中有 0 项（0%）</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">对话提供商</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>7 项中有 0 项（0%）/ 7 项中有 0 项（0%）</span>
        <span>7 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">语音唤醒与路由</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>4 项中有 0 项（0%）/ 4 项中有 0 项（0%）</span>
        <span>4 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="语音通话渠道 - 5 个领域">
    <p className="maturity-readiness-summary">5 个需要审查</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">访问与身份</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>1 项中有 0 项（0%）/ 1 项中有 0 项（0%）</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">渠道设置与运维</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>2 项中有 0 项（0%）/ 2 项中有 0 项（0%）</span>
        <span>2 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">对话路由与递送</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>1 项中有 0 项（0%）/ 1 项中有 0 项（0%）</span>
        <span>1 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体与富内容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>2 项中有 0 项（0%）/ 2 项中有 0 项（0%）</span>
        <span>2 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">实时语音与通话</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审查 - 完整分类法验证</span>
        </div>
        <span>2 项中有 0 项（0%）/ 2 项中有 0 项（0%）</span>
        <span>2 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="watchOS 配套界面 - 5 个领域">
    <p className="maturity-readiness-summary">5 个需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">交付和恢复</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 7 (0%) / 0 / 7 (0%)</span>
        <span>7 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">分发和支持</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 6 (0%) / 0 / 6 (0%)</span>
        <span>6 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Exec 审批</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 3 (0%) / 0 / 3 (0%)</span>
        <span>3 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">通知和回复</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 7 (0%) / 0 / 7 (0%)</span>
        <span>7 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Watch 应用界面</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 3 (0%) / 0 / 3 (0%)</span>
        <span>3 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Web 搜索工具 - 4 个领域">
    <p className="maturity-readiness-summary">2 个需要审核 / 2 个已部分审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">网络安全</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 4 (0%) / 0 / 4 (0%)</span>
        <span>4 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">搜索提供商</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>2 / 19 (10.5%) / 2 / 19 (10.5%)</span>
        <span>17 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">设置和诊断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 9 (0%) / 0 / 9 (0%)</span>
        <span>9 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">工具可用性和获取</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>2 / 11 (18.2%) / 3 / 12 (25%)</span>
        <span>9 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp - 5 个领域">
    <p className="maturity-readiness-summary">5 个需要审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">访问和身份</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 7 (0%) / 0 / 7 (0%)</span>
        <span>7 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">渠道设置和运维</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 5 (0%) / 0 / 5 (0%)</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">对话路由和交付</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 4 (0%) / 0 / 4 (0%)</span>
        <span>4 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">媒体和富内容</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 2 (0%) / 0 / 2 (0%)</span>
        <span>2 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">原生控件和审批</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 2 (0%) / 0 / 2 (0%)</span>
        <span>2 个能力缺口</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="通过 WSL2 使用 Windows - 6 个领域">
    <p className="maturity-readiness-summary">5 个需要审核 / 1 个已部分审核</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>领域</span><span>功能 / 覆盖范围 ID</span><span>后续工作</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">浏览器和 Control UI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 6 (0%) / 0 / 6 (0%)</span>
        <span>6 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 8 (0%) / 0 / 8 (0%)</span>
        <span>8 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">诊断和修复</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">已部分审核 - 完整分类法验证</span>
        </div>
        <span>1 / 6 (16.7%) / 3 / 8 (37.5%)</span>
        <span>5 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 网关访问和暴露</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 11 (0%) / 0 / 11 (0%)</span>
        <span>11 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 网关服务生命周期</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 10 (0%) / 0 / 10 (0%)</span>
        <span>10 个能力缺口</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WSL 设置</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">需要审核 - 完整分类法验证</span>
        </div>
        <span>0 / 6 (0%) / 0 / 6 (0%)</span>
        <span>6 个能力缺口</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> 最后更新：2026-06-22
