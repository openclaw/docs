---
summary: 제품 영역, 통합 및 지원되는 워크플로에 대한 OpenClaw 릴리스 준비도 점수.
title: 성숙도 점수표
x-i18n:
    generated_at: "2026-07-02T08:07:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0cc55f54773a19369b865994ea22d00f1e07fc7df2b2d5b14cb4067f994fb0e2
    source_path: maturity/scorecard.md
    workflow: 16
---

# 성숙도 점수표

<div className="maturity-hero">
  <p className="maturity-kicker">릴리스 준비 상태 - 분류 체계 + QA 증거에서 생성됨</p>
  <p className="maturity-hero-title">무엇이 준비되었고, 무엇이 검증되었으며, 무엇에 아직 작업이 필요한지 보여주는 실용적인 보기입니다.</p>
  <p>50개 표면 - 281개 기능 영역 - 결정론적 커버리지와 사람이 검토한 품질 및 완성도.</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">표면 찾아보기</a> / <a href="#qa-evidence-summary">QA 증거 검토</a> / <a href="/ko/maturity/taxonomy">분류 체계 읽기</a></p>
</div>

## 이 페이지의 목적

이 페이지는 하나의 질문에 답하기 위한 것입니다. 어떤 OpenClaw 표면이 릴리스에 적합한 신뢰할 수 있는 선택지이며, 어떤 증거가 그 판단을 뒷받침하나요? 커버리지는 결정론적 QA 증거에서 나오며, 품질과 완성도는 검토된 성숙도 점수로 유지됩니다.

## 한눈에 보기

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">68%</span>
      <span>성숙도 점수</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "68" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">알파</span>
      <span>품질 + 완성도</span>
      <span>커버리지 실험적 - 4%</span>
      <span>품질 알파 - 64%</span>
      <span>완성도 베타 - 71%</span>
    </div>
  </div>
</div>

커버리지는 의도적으로 증거 중심입니다. 구현이 존재한다는 이유만으로 영역이 "준비됨" 상태가 되지는 않습니다. 이는 성숙도 점수의 입력값은 아니지만, OpenClaw는 시간이 지나도 성숙한 안정 이상 기능에 대해 엔드투엔드 커버리지를 90% 이상으로 유지하는 것을 목표로 합니다.

## 점수 구간

<div className="maturity-band-list">
  <div className="maturity-band maturity-band-experimental"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-experimental">실험적</span></span><span>0-50%</span></div>
  <div className="maturity-band maturity-band-alpha"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-alpha">알파</span></span><span>50-70%</span></div>
  <div className="maturity-band maturity-band-beta"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-beta">베타</span></span><span>70-80%</span></div>
  <div className="maturity-band maturity-band-stable"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-stable">안정</span></span><span>80-95%</span></div>
  <div className="maturity-band maturity-band-clawesome"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-clawesome">클로섬</span></span><span>95-100%</span></div>
</div>

## 표면 탐색기

<a id="surface-explorer" />

표면은 성숙도 수준, 완성도, 품질 순으로 정렬됩니다. 릴리스 준비가 된 선택지를 쉽게 비교할 수 있도록 각 행에 LTS 지원도 함께 표시됩니다.

  <Tabs>
  <Tab title="모든 표면">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>표면</span><span>적용 범위</span><span>품질</span><span>완성도</span><span>지원</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>안정</span></span><span>7개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">안정</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">안정</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분적 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Gateway 런타임</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>안정</span></span><span>13개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">안정</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">안정</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분적 - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Linux Gateway 호스트</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>안정</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">안정</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분적 - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">macOS Gateway 호스트</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>안정</span></span><span>7개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">안정</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>안정</span></span><span>6개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">안정</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분적 - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#android-app"><span className="maturity-surface-title">Android 앱</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>안정</span></span><span>7개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">안정</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">안정</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#ios-app"><span className="maturity-surface-title">iOS 앱</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>안정</span></span><span>8개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">안정</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">안정</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">에이전트 런타임</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>9개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분적 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">세션, 메모리 및 컨텍스트 엔진</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>9개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분적 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">채널 프레임워크</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>8개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분적 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">브라우저 자동화, exec 및 샌드박스 도구</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>3개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분적 - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#observability"><span className="maturity-surface-title">관측성</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분적 - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">OpenAI 및 Codex 제공자 경로</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분 - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Gateway 웹 앱</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>6개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">웹 검색 도구</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>4개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugin</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>9개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분 - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">보안, 인증, 페어링 및 비밀 정보</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>6개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">자동화: Cron, 훅, 작업, 폴링</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>6개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Docker 및 Podman 호스팅</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>4개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">WSL2를 통한 Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>6개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi 및 소형 Linux 기기</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>4개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Anthropic 공급자 경로</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">전체 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">전체 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Google 공급자 경로</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage 및 BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">macOS 컴패니언 앱</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">OpenRouter 제공자 경로</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">미디어 이해 및 미디어 생성</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">이미지, 동영상 및 음악 생성 도구</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">로컬 모델 제공자: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">롱테일 호스팅 제공자</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>3개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">음성 및 실시간 대화</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>6개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>6개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">커버리지</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#native-windows"><span className="maturity-surface-title">네이티브 Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>4개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">커버리지</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분 - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>4개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">커버리지</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Kubernetes 호스팅</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>4개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">커버리지</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, 지역 채널</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>4개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">커버리지</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>4개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">커버리지</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw 앱 SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>6개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Nix 설치 경로</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>실험적</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">음성 통화 채널</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>실험적</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">watchOS 컴패니언 표면</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>실험적</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Linux 컴패니언 앱</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>계획됨</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">네이티브 Windows 컴패니언 앱</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>계획됨</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="코어">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>표면</span><span>적용 범위</span><span>품질</span><span>완성도</span><span>지원</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>안정</span></span><span>7개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">안정</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">안정</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분적 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Gateway 런타임</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>안정</span></span><span>13개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">안정</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">안정</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분적 - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">에이전트 런타임</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>9개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분적 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">세션, 메모리 및 컨텍스트 엔진</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>9개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분적 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">채널 프레임워크</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>8개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분적 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#observability"><span className="maturity-surface-title">관측성</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분적 - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Gateway 웹 앱</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>6개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugin</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>9개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분 - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">보안, 인증, 페어링 및 비밀 정보</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>6개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">자동화: cron, 훅, 작업, 폴링</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>6개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">미디어 이해 및 미디어 생성</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>6개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">음성 및 실시간 대화</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>6개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>영역 4개</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw App SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>영역 6개</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="플랫폼">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>표면</span><span>범위</span><span>품질</span><span>완성도</span><span>지원</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Linux Gateway 호스트</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>안정</span></span><span>영역 5개</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">안정</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분적 - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">macOS Gateway 호스트</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>안정</span></span><span>영역 7개</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">안정</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#android-app"><span className="maturity-surface-title">Android 앱</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>안정</span></span><span>영역 7개</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">안정</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">안정</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#ios-app"><span className="maturity-surface-title">iOS 앱</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>안정</span></span><span>영역 8개</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">안정</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">안정</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Docker 및 Podman 호스팅</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>4개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">WSL2를 통한 Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>6개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi 및 소형 Linux 장치</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>4개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">macOS 컴패니언 앱</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>8개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#native-windows"><span className="maturity-surface-title">네이티브 Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>4개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분 - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Kubernetes 호스팅</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>4개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Nix 설치 경로</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>실험적</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">watchOS 컴패니언 표면</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>실험적</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Linux 컴패니언 앱</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>계획됨</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">네이티브 Windows 컴패니언 앱</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>계획됨</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="채널">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>표면</span><span>적용 범위</span><span>품질</span><span>완성도</span><span>지원</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>안정</span></span><span>6개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">안정</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분 - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">전체 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">전체 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage 및 BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>6개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">커버리지</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, 지역 채널</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>4개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">커버리지</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>4개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">커버리지</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">음성 통화 채널</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>실험적</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">커버리지</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="제공자 및 도구">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>표면</span><span>커버리지</span><span>품질</span><span>완성도</span><span>지원</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">브라우저 자동화, exec 및 샌드박스 도구</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>3개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">커버리지</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분 - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">OpenAI 및 Codex 제공자 경로</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">커버리지</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">부분 - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">웹 검색 도구</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>4개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Anthropic 제공자 경로</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Google 제공자 경로</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">OpenRouter 제공자 경로</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>베타</span></span><span>4개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">베타</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">이미지, 동영상 및 음악 생성 도구</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">로컬 모델 제공자: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>5개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">적용 범위</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ko/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">롱테일 호스팅 제공자</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>알파</span></span><span>3개 영역</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">커버리지</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">실험적</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">품질</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">완성도</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">알파</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">없음</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## QA 증거 요약

아래 검사는 QA 프로필 증거로 어떤 스코어카드 영역이 실행되었는지 보여줍니다.

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">전체 분류 체계 검증</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>96개 검사 - 94개 통과, 2개 차단됨</span>
    <span>281개 중 0개(0%) 영역 - 1675개 중 20개(1.2%) 기능 - 1665개 중 77개(4.6%) 커버리지 ID</span>
  </div>
</div>

### 영역별 준비 상태

  각 범주의 증거 상태를 검사할 표면을 엽니다. 페이지를 한눈에 유용하게 볼 수 있도록 목록은 접힌 상태로 유지됩니다.

  <AccordionGroup>
  <Accordion title="에이전트 런타임 - 9개 영역">
    <p className="maturity-readiness-summary">8개 부분 검토됨 / 1개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">에이전트 턴 실행</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>3개 중 0개 (0%) / 24개 중 7개 (29.2%)</span>
        <span>17개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">외부 런타임 및 하위 에이전트</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 10개 중 3개 (30%)</span>
        <span>7개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">호스팅 공급자 실행</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 1개 (20%) / 5개 중 1개 (20%)</span>
        <span>4개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">로컬 및 자체 호스팅 공급자</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>5개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">모델 및 런타임 선택</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 8개 중 2개 (25%)</span>
        <span>6개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">공급자 인증</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>10개 중 0개 (0%) / 17개 중 4개 (23.5%)</span>
        <span>13개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">스트리밍 및 진행 상황</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>2개 중 0개 (0%) / 9개 중 5개 (55.6%)</span>
        <span>4개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">도구 호출 및 응답 처리</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>3개 중 0개 (0%) / 23개 중 15개 (65.2%)</span>
        <span>8개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">도구 실행 제어</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개 (0%) / 12개 중 6개 (50%)</span>
        <span>6개 기능 격차</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Android 앱 - 7개 영역">
    <p className="maturity-readiness-summary">7개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">연결 설정</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>1개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">기기 런타임</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>2개 중 0개 (0%) / 2개 중 0개 (0%)</span>
        <span>2개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">배포</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>3개 중 0개 (0%) / 3개 중 0개 (0%)</span>
        <span>3개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어 캡처</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>1개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">모바일 채팅</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>1개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">설정</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>1개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">음성</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>1개 기능 격차</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Anthropic 공급자 경로 - 5개 영역">
    <p className="maturity-readiness-summary">5개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어 입력</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 4개 중 0개 (0%)</span>
        <span>4개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">모델 및 런타임 선택</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>10개 중 0개 (0%) / 12개 중 0개 (0%)</span>
        <span>12개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">프롬프트 캐시 및 컨텍스트</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>5개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">공급자 인증 및 복구</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>9개 중 0개 (0%) / 9개 중 0개 (0%)</span>
        <span>9개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">요청 전송 및 턴 의미 체계</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>10개 중 0개 (0%) / 10개 중 0개 (0%)</span>
        <span>10개 기능 격차</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="자동화: Cron, 훅, 작업, 폴링 - 6개 영역">
    <p className="maturity-readiness-summary">5개 검토 필요 / 1개 부분 검토됨</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">자동화 훅</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>11개 중 0개 (0%) / 11개 중 0개 (0%)</span>
        <span>역량 격차 11개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">백그라운드 작업 및 흐름</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>10개 중 0개 (0%) / 10개 중 0개 (0%)</span>
        <span>역량 격차 10개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cron 작업</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>15개 중 0개 (0%) / 15개 중 0개 (0%)</span>
        <span>역량 격차 15개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">이벤트 수신</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>15개 중 0개 (0%) / 15개 중 0개 (0%)</span>
        <span>역량 격차 15개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Heartbeat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 7개 중 1개 (14.3%)</span>
        <span>역량 격차 6개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">폴링 제어</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>10개 중 0개 (0%) / 10개 중 0개 (0%)</span>
        <span>역량 격차 10개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="브라우저 자동화, exec, 샌드박스 도구 - 3개 영역">
    <p className="maturity-readiness-summary">2개 부분 검토됨 / 1개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">브라우저 자동화</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>8개 중 1개 (12.5%) / 8개 중 1개 (12.5%)</span>
        <span>역량 격차 7개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">샌드박스 및 도구 정책</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개 (0%) / 6개 중 0개 (0%)</span>
        <span>역량 격차 6개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">도구 호출 및 실행</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 2개 (33.3%) / 8개 중 4개 (50%)</span>
        <span>역량 격차 4개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Gateway 웹 앱 - 6개 영역">
    <p className="maturity-readiness-summary">3개 검토 필요 / 3개 부분 검토됨</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">브라우저 액세스 및 신뢰</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>역량 격차 5개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">브라우저 실시간 대화</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>역량 격차 5개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">브라우저 UI</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>10개 중 0개 (0%) / 12개 중 1개 (8.3%)</span>
        <span>역량 격차 11개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">구성</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>역량 격차 5개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">운영자 콘솔</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>10개 중 0개 (0%) / 12개 중 1개 (8.3%)</span>
        <span>역량 격차 11개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat 대화</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>15개 중 0개 (0%) / 20개 중 2개 (10%)</span>
        <span>역량 격차 18개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="채널 프레임워크 - 8개 영역">
    <p className="maturity-readiness-summary">4개 검토 필요 / 4개 부분 검토됨</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">채널 작업 명령 및 승인</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>역량 격차 5개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">채널 설정</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 7개 중 1개 (14.3%)</span>
        <span>역량 격차 6개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">대화 라우팅 및 전달</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>10개 중 0개 (0%) / 27개 중 5개 (18.5%)</span>
        <span>역량 격차 22개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">그룹 스레드 및 주변 공간 동작</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 11개 중 4개 (36.4%)</span>
        <span>역량 격차 7개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">인바운드 액세스 및 ID 게이트</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>역량 격차 5개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어 첨부 파일 및 풍부한 채널 데이터</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 4개 중 0개 (0%)</span>
        <span>역량 격차 4개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">아웃바운드 전달 및 답장 파이프라인</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 21개 중 8개 (38.1%)</span>
        <span>역량 격차 13개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">상태 건전성 및 운영자 제어</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 6개 중 0개 (0%)</span>
        <span>역량 격차 6개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub - 4개 영역">
    <p className="maturity-readiness-summary">4개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">카탈로그 탐색</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>5개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">호환성과 신뢰</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>12개 중 0개 (0%) / 12개 중 0개 (0%)</span>
        <span>12개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin 수명 주기와 상태</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>26개 중 0개 (0%) / 26개 중 0개 (0%)</span>
        <span>26개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">게시</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>7개 중 0개 (0%) / 7개 중 0개 (0%)</span>
        <span>7개 기능 격차</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="CLI - 7개 영역">
    <p className="maturity-readiness-summary">5개 검토 필요 / 2개 부분 검토됨</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI 관측성</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>5개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI 설정</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 1개 (16.7%) / 6개 중 1개 (16.7%)</span>
        <span>5개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Doctor</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>10개 중 0개 (0%) / 10개 중 0개 (0%)</span>
        <span>10개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 서비스 관리</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 7개 중 1개 (14.3%)</span>
        <span>6개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">온보딩과 인증 설정</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>5개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin 및 채널 설정</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>5개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">업데이트와 업그레이드</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>5개 기능 격차</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord - 6개 영역">
    <p className="maturity-readiness-summary">6개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">액세스와 ID</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개 (0%) / 6개 중 0개 (0%)</span>
        <span>6개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">채널 설정과 운영</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>10개 중 0개 (0%) / 10개 중 0개 (0%)</span>
        <span>10개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">대화 라우팅과 전달</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>12개 중 0개 (0%) / 12개 중 0개 (0%)</span>
        <span>12개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어와 리치 콘텐츠</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>1개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">네이티브 컨트롤과 승인</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>5개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">실시간 음성과 통화</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>5개 기능 격차</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Docker 및 Podman 호스팅 - 4개 영역">
    <p className="maturity-readiness-summary">3개 검토 필요 / 1개 부분 검토됨</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">에이전트 샌드박스와 도구</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>3개 중 0개 (0%) / 3개 중 0개 (0%)</span>
        <span>3개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">컨테이너 운영</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>11개 중 0개 (0%) / 11개 중 0개 (0%)</span>
        <span>11개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">컨테이너 설정</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개 (0%) / 6개 중 0개 (0%)</span>
        <span>6개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">이미지 릴리스와 검증</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 1개 (20%) / 7개 중 2개 (28.6%)</span>
        <span>5개 기능 격차</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, 지역 채널 - 4개 영역">
    <p className="maturity-readiness-summary">4개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 적용 범위 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">액세스 및 ID</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>기능 격차 1개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">채널 설정 및 운영</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개 (0%) / 6개 중 0개 (0%)</span>
        <span>기능 격차 6개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">대화 라우팅 및 전달</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>기능 격차 1개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어 및 리치 콘텐츠</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>기능 격차 1개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Gateway 런타임 - 13개 영역">
    <p className="maturity-readiness-summary">9개 검토 필요 / 4개 부분 검토됨</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 적용 범위 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">승인 및 원격 실행</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개 (0%) / 6개 중 0개 (0%)</span>
        <span>기능 격차 6개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">기기 인증 및 페어링</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>10개 중 0개 (0%) / 10개 중 0개 (0%)</span>
        <span>기능 격차 10개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 수명 주기</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>7개 중 0개 (0%) / 12개 중 4개 (33.3%)</span>
        <span>기능 격차 8개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway RPC API 및 이벤트</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>20개 중 0개 (0%) / 22개 중 2개 (9.1%)</span>
        <span>기능 격차 20개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">상태, 진단 및 복구</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>7개 중 0개 (0%) / 7개 중 0개 (0%)</span>
        <span>기능 격차 7개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">호스팅된 웹 표면</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 4개 중 0개 (0%)</span>
        <span>기능 격차 4개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">HTTP API</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 1개 (25%) / 4개 중 1개 (25%)</span>
        <span>기능 격차 3개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">네트워크 액세스 및 탐색</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개 (0%) / 6개 중 0개 (0%)</span>
        <span>기능 격차 6개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Node 및 원격 기능</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>8개 중 0개 (0%) / 8개 중 0개 (0%)</span>
        <span>기능 격차 8개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">프로토콜 호환성</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>7개 중 0개 (0%) / 7개 중 0개 (0%)</span>
        <span>기능 격차 7개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">역할 및 권한</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>기능 격차 5개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">보안 제어</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개 (0%) / 6개 중 0개 (0%)</span>
        <span>기능 격차 6개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebSocket 연결</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>8개 중 1개 (12.5%) / 8개 중 1개 (12.5%)</span>
        <span>기능 격차 7개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat - 5개 영역">
    <p className="maturity-readiness-summary">5개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 적용 범위 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">액세스 및 ID</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>11개 중 0개 (0%) / 11개 중 0개 (0%)</span>
        <span>기능 격차 11개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">채널 설정 및 운영</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>16개 중 0개 (0%) / 16개 중 0개 (0%)</span>
        <span>기능 격차 16개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">대화 라우팅 및 전달</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>기능 격차 1개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어 및 리치 콘텐츠</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>기능 격차 1개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">네이티브 제어 및 승인</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>16개 중 0개 (0%) / 16개 중 0개 (0%)</span>
        <span>기능 격차 16개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google 제공자 경로 - 5개 영역">
    <p className="maturity-readiness-summary">5개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 적용 범위 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">직접 Gemini 런타임</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>9개 중 0개 (0%) / 9개 중 0개 (0%)</span>
        <span>9개 역량 공백</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어, 검색 및 실시간</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>10개 중 0개 (0%) / 10개 중 0개 (0%)</span>
        <span>10개 역량 공백</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">모델 라우팅 및 엔드포인트</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>10개 중 0개 (0%) / 10개 중 0개 (0%)</span>
        <span>10개 역량 공백</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">프롬프트 캐싱</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>5개 역량 공백</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">제공자 설정 및 자격 증명</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>10개 중 0개 (0%) / 10개 중 0개 (0%)</span>
        <span>10개 역량 공백</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="이미지, 비디오 및 음악 생성 도구 - 5개 영역">
    <p className="maturity-readiness-summary">5개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 적용 범위 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">이미지 생성</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>9개 중 0개 (0%) / 9개 중 0개 (0%)</span>
        <span>9개 역량 공백</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어 라우팅 및 검색</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 4개 중 0개 (0%)</span>
        <span>4개 역량 공백</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">음악 생성</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개 (0%) / 6개 중 0개 (0%)</span>
        <span>6개 역량 공백</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">작업 수명 주기 및 전달</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>12개 중 0개 (0%) / 12개 중 0개 (0%)</span>
        <span>12개 역량 공백</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">비디오 생성</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>11개 중 0개 (0%) / 11개 중 0개 (0%)</span>
        <span>11개 역량 공백</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessage 및 BlueBubbles - 5개 영역">
    <p className="maturity-readiness-summary">5개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 적용 범위 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">액세스 및 ID</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개 (0%) / 6개 중 0개 (0%)</span>
        <span>6개 역량 공백</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">채널 설정 및 운영</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>11개 중 0개 (0%) / 11개 중 0개 (0%)</span>
        <span>11개 역량 공백</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">대화 라우팅 및 전달</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 4개 중 0개 (0%)</span>
        <span>4개 역량 공백</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어 및 리치 콘텐츠</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>7개 중 0개 (0%) / 7개 중 0개 (0%)</span>
        <span>7개 역량 공백</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">네이티브 컨트롤 및 승인</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>3개 중 0개 (0%) / 3개 중 0개 (0%)</span>
        <span>3개 역량 공백</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iOS 앱 - 8개 영역">
    <p className="maturity-readiness-summary">8개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 적용 범위 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">캔버스 및 화면</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>1개 역량 공백</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">채팅 및 세션</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>1개 역량 공백</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">기기 명령</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>2개 중 0개 (0%) / 2개 중 0개 (0%)</span>
        <span>2개 역량 공백</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">배포</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>1개 역량 공백</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 설정 및 진단</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>7개 중 0개 (0%) / 7개 중 0개 (0%)</span>
        <span>7개 역량 공백</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어 및 공유</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>1개 역량 공백</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">알림 및 백그라운드</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>1개 역량 공백</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">음성</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>1개 역량 공백</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Kubernetes 호스팅 - 4개 영역">
    <p className="maturity-readiness-summary">4개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">접근 및 노출</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>역량 격차 5개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">클러스터 수명 주기</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>역량 격차 5개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">구성 및 시크릿</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>역량 격차 5개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">배포 설정</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>역량 격차 5개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Linux companion 앱 - 5개 영역">
    <p className="maturity-readiness-summary">5개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">앱 배포</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>3개 중 0개 (0%) / 3개 중 0개 (0%)</span>
        <span>역량 격차 3개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">채팅 및 세션</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>3개 중 0개 (0%) / 3개 중 0개 (0%)</span>
        <span>역량 격차 3개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">데스크톱 기능</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>9개 중 0개 (0%) / 9개 중 0개 (0%)</span>
        <span>역량 격차 9개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 연결</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 4개 중 0개 (0%)</span>
        <span>역량 격차 4개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">상태 및 진단</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>7개 중 0개 (0%) / 7개 중 0개 (0%)</span>
        <span>역량 격차 7개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Linux Gateway 호스트 - 5개 영역">
    <p className="maturity-readiness-summary">5개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">배포 대상</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>3개 중 0개 (0%) / 3개 중 0개 (0%)</span>
        <span>역량 격차 3개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">진단 및 복구</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 4개 중 0개 (0%)</span>
        <span>역량 격차 4개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 런타임 및 서비스 제어</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개 (0%) / 6개 중 0개 (0%)</span>
        <span>역량 격차 6개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">호스트 설정 및 업데이트</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 4개 중 0개 (0%)</span>
        <span>역량 격차 4개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">원격 접근 및 보안</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개 (0%) / 6개 중 0개 (0%)</span>
        <span>역량 격차 6개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="로컬 모델 제공자: Ollama, vLLM, SGLang, LM Studio - 5개 영역">
    <p className="maturity-readiness-summary">5개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">로컬 메모리 및 임베딩</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>역량 격차 5개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">네이티브 제공자 Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>10개 중 0개 (0%) / 10개 중 0개 (0%)</span>
        <span>역량 격차 10개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">네트워크 안전 및 프롬프트 제어</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>2개 중 0개 (0%) / 2개 중 0개 (0%)</span>
        <span>역량 격차 2개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">OpenAI 호환 런타임 호환성</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>8개 중 0개 (0%) / 8개 중 0개 (0%)</span>
        <span>역량 격차 8개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">제공자 설정, 수명 주기 및 진단</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>12개 중 0개 (0%) / 12개 중 0개 (0%)</span>
        <span>역량 격차 12개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="롱테일 호스팅 제공자 - 3개 영역">
    <p className="maturity-readiness-summary">3개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">호스팅 LLM 제공자</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>12개 중 0개 (0%) / 12개 중 0개 (0%)</span>
        <span>역량 격차 12개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">호스팅 미디어 제공자</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>8개 중 0개 (0%) / 8개 중 0개 (0%)</span>
        <span>역량 격차 8개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">제공자 운영</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>12개 중 0개 (0%) / 12개 중 0개 (0%)</span>
        <span>역량 격차 12개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="macOS 동반 앱 - 8개 영역">
    <p className="maturity-readiness-summary">8개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 적용 범위 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">캔버스</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개(0%) / 4개 중 0개(0%)</span>
        <span>4개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">로컬 설정</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>7개 중 0개(0%) / 7개 중 0개(0%)</span>
        <span>7개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">네이티브 기능</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개(0%) / 5개 중 0개(0%)</span>
        <span>5개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">원격 연결</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>3개 중 0개(0%) / 3개 중 0개(0%)</span>
        <span>3개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">원격 WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개(0%) / 5개 중 0개(0%)</span>
        <span>5개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">상태 및 설정</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개(0%) / 5개 중 0개(0%)</span>
        <span>5개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">음성 및 대화</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>3개 중 0개(0%) / 3개 중 0개(0%)</span>
        <span>3개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>3개 중 0개(0%) / 3개 중 0개(0%)</span>
        <span>3개 기능 격차</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="macOS Gateway 호스트 - 7개 영역">
    <p className="maturity-readiness-summary">7개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 적용 범위 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI 설정</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개(0%) / 4개 중 0개(0%)</span>
        <span>4개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">진단 및 관측 가능성</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개(0%) / 4개 중 0개(0%)</span>
        <span>4개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 서비스 수명 주기</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>10개 중 0개(0%) / 10개 중 0개(0%)</span>
        <span>10개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">로컬 Gateway 통합</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>9개 중 0개(0%) / 9개 중 0개(0%)</span>
        <span>9개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">권한 및 네이티브 기능</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개(0%) / 4개 중 0개(0%)</span>
        <span>4개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">프로필 및 격리</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개(0%) / 5개 중 0개(0%)</span>
        <span>5개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">원격 Gateway 모드</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개(0%) / 5개 중 0개(0%)</span>
        <span>5개 기능 격차</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Matrix - 6개 영역">
    <p className="maturity-readiness-summary">6개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 적용 범위 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">액세스 및 ID</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>7개 중 0개(0%) / 7개 중 0개(0%)</span>
        <span>7개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">채널 설정 및 운영</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개(0%) / 5개 중 0개(0%)</span>
        <span>5개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">대화 라우팅 및 전달</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개(0%) / 1개 중 0개(0%)</span>
        <span>1개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">암호화 및 검증</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>3개 중 0개(0%) / 3개 중 0개(0%)</span>
        <span>3개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어 및 리치 콘텐츠</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개(0%) / 1개 중 0개(0%)</span>
        <span>1개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">네이티브 컨트롤 및 승인</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개(0%) / 6개 중 0개(0%)</span>
        <span>6개 기능 격차</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat - 4개 영역">
    <p className="maturity-readiness-summary">4개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">접근 및 신원</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>역량 격차 1개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">채널 설정 및 운영</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>역량 격차 1개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">대화 라우팅 및 전달</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>역량 격차 1개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어 및 리치 콘텐츠</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>역량 격차 1개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="미디어 이해 및 미디어 생성 - 6개 영역">
    <p className="maturity-readiness-summary">4개 검토 필요 / 2개 부분 검토됨</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">채널 미디어 처리</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>역량 격차 5개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어 구성</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>역량 격차 1개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어 생성</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>17개 중 1개 (5.9%) / 19개 중 1개 (5.3%)</span>
        <span>역량 격차 18개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어 수집 및 접근</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>8개 중 0개 (0%) / 8개 중 0개 (0%)</span>
        <span>역량 격차 8개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어 이해</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>12개 중 0개 (0%) / 14개 중 1개 (7.1%)</span>
        <span>역량 격차 13개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">텍스트 음성 변환 전달</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>2개 중 0개 (0%) / 2개 중 0개 (0%)</span>
        <span>역량 격차 2개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams - 5개 영역">
    <p className="maturity-readiness-summary">5개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">접근 및 신원</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>9개 중 0개 (0%) / 9개 중 0개 (0%)</span>
        <span>역량 격차 9개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">채널 설정 및 운영</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>9개 중 0개 (0%) / 9개 중 0개 (0%)</span>
        <span>역량 격차 9개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">대화 라우팅 및 전달</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>역량 격차 5개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어 및 리치 콘텐츠</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>역량 격차 5개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">네이티브 컨트롤 및 승인</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>역량 격차 5개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="네이티브 Windows - 4개 영역">
    <p className="maturity-readiness-summary">4개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>9개 중 0개 (0%) / 9개 중 0개 (0%)</span>
        <span>역량 격차 9개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 관리</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>11개 중 0개 (0%) / 11개 중 0개 (0%)</span>
        <span>역량 격차 11개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">네트워킹</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 4개 중 0개 (0%)</span>
        <span>역량 격차 4개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">업데이트</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 4개 중 0개 (0%)</span>
        <span>역량 격차 4개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="네이티브 Windows 컴패니언 앱 - 5개 영역">
    <p className="maturity-readiness-summary">5개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">채팅 세션</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>2개 중 0개 (0%) / 2개 중 0개 (0%)</span>
        <span>기능 격차 2개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">데스크톱 도구 및 권한</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>10개 중 0개 (0%) / 10개 중 0개 (0%)</span>
        <span>기능 격차 10개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 연결</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>3개 중 0개 (0%) / 3개 중 0개 (0%)</span>
        <span>기능 격차 3개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">설치 및 업데이트</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 4개 중 0개 (0%)</span>
        <span>기능 격차 4개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">상태 및 복구</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>기능 격차 5개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Nix 설치 경로 - 5개 영역">
    <p className="maturity-readiness-summary">5개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">활성화 및 앱 UX</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>7개 중 0개 (0%) / 7개 중 0개 (0%)</span>
        <span>기능 격차 7개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">구성 및 상태</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>7개 중 0개 (0%) / 7개 중 0개 (0%)</span>
        <span>기능 격차 7개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">설치 인계</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 4개 중 0개 (0%)</span>
        <span>기능 격차 4개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin 수명 주기</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 4개 중 0개 (0%)</span>
        <span>기능 격차 4개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">서비스 런타임 및 가드</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>8개 중 0개 (0%) / 8개 중 0개 (0%)</span>
        <span>기능 격차 8개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenAI 및 Codex 프로바이더 경로 - 5개 영역">
    <p className="maturity-readiness-summary">2개 검토 필요 / 3개 부분 검토됨</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">이미지 및 멀티모달 입력</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>2개 중 0개 (0%) / 2개 중 0개 (0%)</span>
        <span>기능 격차 2개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">모델 및 인증</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 1개 (16.7%) / 9개 중 4개 (44.4%)</span>
        <span>기능 격차 5개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">네이티브 Codex 하네스</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>2개 중 0개 (0%) / 9개 중 4개 (44.4%)</span>
        <span>기능 격차 5개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">응답 및 도구 호환성</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 1개 (25%) / 5개 중 2개 (40%)</span>
        <span>기능 격차 3개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">음성 및 실시간 오디오</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>2개 중 0개 (0%) / 2개 중 0개 (0%)</span>
        <span>기능 격차 2개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenClaw 앱 SDK - 6개 영역">
    <p className="maturity-readiness-summary">5개 검토 필요 / 1개 부분 검토됨</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">에이전트 대화</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개 (0%) / 6개 중 0개 (0%)</span>
        <span>기능 격차 6개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">클라이언트 API</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 4개 중 0개 (0%)</span>
        <span>기능 격차 4개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">호환성</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>기능 격차 5개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">이벤트 및 승인</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>기능 격차 5개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 액세스</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>기능 격차 5개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">리소스 헬퍼</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 6개 중 1개 (16.7%)</span>
        <span>기능 격차 5개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenRouter 제공자 경로 - 4개 영역">
    <p className="maturity-readiness-summary">4개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 적용 범위 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">채팅 런타임 및 정규화</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>15개 중 0개(0%) / 15개 중 0개(0%)</span>
        <span>15개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어 생성 및 음성</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>7개 중 0개(0%) / 7개 중 0개(0%)</span>
        <span>7개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">제공자 복구 및 진단</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개(0%) / 5개 중 0개(0%)</span>
        <span>5개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">제공자 설정 및 인증</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>14개 중 0개(0%) / 14개 중 0개(0%)</span>
        <span>14개 기능 격차</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Plugins - 9개 영역">
    <p className="maturity-readiness-summary">6개 검토 필요 / 3개 부분 검토됨</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 적용 범위 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin 작성 및 패키징</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>8개 중 0개(0%) / 8개 중 0개(0%)</span>
        <span>8개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">번들 Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개(0%) / 5개 중 0개(0%)</span>
        <span>5개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개(0%) / 6개 중 0개(0%)</span>
        <span>6개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">채널 Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개(0%) / 5개 중 0개(0%)</span>
        <span>5개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin 설치 및 실행</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개(0%) / 20개 중 7개(35%)</span>
        <span>13개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin 승인</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개(0%) / 6개 중 0개(0%)</span>
        <span>6개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">제공자 및 도구 Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 1개(16.7%) / 21개 중 9개(42.9%)</span>
        <span>12개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin 게시</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개(0%) / 6개 중 0개(0%)</span>
        <span>6개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin 테스트</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개(0%) / 11개 중 3개(27.3%)</span>
        <span>8개 기능 격차</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi 및 소형 Linux 기기 - 4개 영역">
    <p className="maturity-readiness-summary">4개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 적용 범위 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 런타임</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>10개 중 0개(0%) / 10개 중 0개(0%)</span>
        <span>10개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">성능 및 진단</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개(0%) / 5개 중 0개(0%)</span>
        <span>5개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">원격 액세스 및 인증</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>9개 중 0개(0%) / 9개 중 0개(0%)</span>
        <span>9개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">설정 및 호환성</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>12개 중 0개(0%) / 12개 중 0개(0%)</span>
        <span>12개 기능 격차</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="보안, 인증, 페어링 및 비밀 정보 - 6개 영역">
    <p className="maturity-readiness-summary">2개 부분 검토됨 / 4개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 적용 범위 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">승인 정책 및 도구 보호 장치</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>2개 중 0개(0%) / 6개 중 3개(50%)</span>
        <span>3개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">채널 액세스 제어</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>3개 중 0개(0%) / 3개 중 0개(0%)</span>
        <span>3개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">자격 증명 및 비밀 정보 위생</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개(0%) / 11개 중 5개(45.5%)</span>
        <span>6개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">기기 및 Node 페어링</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>11개 중 0개(0%) / 11개 중 0개(0%)</span>
        <span>11개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 인증 및 원격 액세스</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>9개 중 0개(0%) / 9개 중 0개(0%)</span>
        <span>9개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin 신뢰</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>2개 중 0개(0%) / 2개 중 0개(0%)</span>
        <span>2개 기능 격차</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="세션, 메모리 및 컨텍스트 엔진 - 9개 영역">
    <p className="maturity-readiness-summary">2개 검토 필요 / 7개 부분 검토됨</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 적용 범위 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI 세션 및 대화 기록 관리</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>2개 중 0개 (0%) / 2개 중 0개 (0%)</span>
        <span>기능 격차 2개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">컨텍스트 엔진</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>2개 중 0개 (0%) / 7개 중 4개 (57.1%)</span>
        <span>기능 격차 3개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">핵심 프롬프트 및 컨텍스트</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>2개 중 0개 (0%) / 8개 중 3개 (37.5%)</span>
        <span>기능 격차 5개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">클라이언트 간 기록 및 세션 동등성</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>2개 중 0개 (0%) / 5개 중 2개 (40%)</span>
        <span>기능 격차 3개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">진단, 유지 관리 및 복구</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>3개 중 0개 (0%) / 10개 중 4개 (40%)</span>
        <span>기능 격차 6개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">메모리</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 13개 중 6개 (46.2%)</span>
        <span>기능 격차 7개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">세션 라우팅</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>2개 중 0개 (0%) / 4개 중 1개 (25%)</span>
        <span>기능 격차 3개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">토큰 관리</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>3개 중 0개 (0%) / 10개 중 2개 (20%)</span>
        <span>기능 격차 8개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">대화 기록 지속성</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>2개 중 0개 (0%) / 2개 중 0개 (0%)</span>
        <span>기능 격차 2개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal - 5개 영역">
    <p className="maturity-readiness-summary">5개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 적용 범위 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">접근 및 ID</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개 (0%) / 6개 중 0개 (0%)</span>
        <span>기능 격차 6개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">채널 설정 및 운영</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>7개 중 0개 (0%) / 7개 중 0개 (0%)</span>
        <span>기능 격차 7개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">대화 라우팅 및 전달</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>기능 격차 1개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어 및 리치 콘텐츠</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>7개 중 0개 (0%) / 7개 중 0개 (0%)</span>
        <span>기능 격차 7개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">네이티브 컨트롤 및 승인</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>3개 중 0개 (0%) / 3개 중 0개 (0%)</span>
        <span>기능 격차 3개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack - 5개 영역">
    <p className="maturity-readiness-summary">5개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 적용 범위 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">접근 및 ID</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>기능 격차 1개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">채널 설정 및 운영</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>10개 중 0개 (0%) / 10개 중 0개 (0%)</span>
        <span>기능 격차 10개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">대화 라우팅 및 전달</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>기능 격차 5개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어 및 리치 콘텐츠</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>기능 격차 1개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">네이티브 컨트롤 및 승인</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>8개 중 0개 (0%) / 8개 중 0개 (0%)</span>
        <span>기능 격차 8개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram - 5개 영역">
    <p className="maturity-readiness-summary">5개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 적용 범위 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">접근 및 ID</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>10개 중 0개 (0%) / 10개 중 0개 (0%)</span>
        <span>기능 격차 10개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">채널 설정 및 운영</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>10개 중 0개 (0%) / 10개 중 0개 (0%)</span>
        <span>기능 격차 10개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">대화 라우팅 및 전달</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>기능 격차 1개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어 및 리치 콘텐츠</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>기능 격차 1개</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">네이티브 컨트롤 및 승인</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>9개 중 0개 (0%) / 9개 중 0개 (0%)</span>
        <span>기능 격차 9개</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="관측 가능성 - 5개 영역">
    <p className="maturity-readiness-summary">3개 부분 검토됨 / 2개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">진단 수집</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>8개 중 1개 (12.5%) / 10개 중 3개 (30%)</span>
        <span>7개 역량 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">상태 확인 및 복구</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>12개 중 1개 (8.3%) / 18개 중 5개 (27.8%)</span>
        <span>13개 역량 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">로깅</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>5개 역량 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">세션 진단</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 4개 중 0개 (0%)</span>
        <span>4개 역량 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">텔레메트리 내보내기</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>13개 중 1개 (7.7%) / 21개 중 7개 (33.3%)</span>
        <span>14개 역량 격차</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="TUI - 5개 영역">
    <p className="maturity-readiness-summary">5개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">입력 및 명령</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>8개 중 0개 (0%) / 8개 중 0개 (0%)</span>
        <span>8개 역량 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">로컬 셸 실행</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 4개 중 0개 (0%)</span>
        <span>4개 역량 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">렌더링 및 출력 안전성</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 4개 중 0개 (0%)</span>
        <span>4개 역량 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">런타임 모드</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>14개 중 0개 (0%) / 14개 중 0개 (0%)</span>
        <span>14개 역량 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">세션 관리</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>3개 중 0개 (0%) / 3개 중 0개 (0%)</span>
        <span>3개 역량 격차</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="음성 및 실시간 대화 - 6개 영역">
    <p className="maturity-readiness-summary">6개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">네이티브 앱 대화</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 4개 중 0개 (0%)</span>
        <span>4개 역량 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">실시간 대화 세션</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>11개 중 0개 (0%) / 11개 중 0개 (0%)</span>
        <span>11개 역량 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">음성 및 전사</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>5개 역량 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">대화 관측 가능성</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>5개 역량 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">대화 제공자</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>7개 중 0개 (0%) / 7개 중 0개 (0%)</span>
        <span>7개 역량 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">음성 깨우기 및 라우팅</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 4개 중 0개 (0%)</span>
        <span>4개 역량 격차</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="음성 통화 채널 - 5개 영역">
    <p className="maturity-readiness-summary">5개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 커버리지 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">접근 및 ID</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>1개 역량 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">채널 설정 및 운영</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>2개 중 0개 (0%) / 2개 중 0개 (0%)</span>
        <span>2개 역량 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">대화 라우팅 및 전달</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>1개 중 0개 (0%) / 1개 중 0개 (0%)</span>
        <span>1개 역량 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어 및 리치 콘텐츠</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>2개 중 0개 (0%) / 2개 중 0개 (0%)</span>
        <span>2개 역량 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">실시간 음성 및 통화</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>2개 중 0개 (0%) / 2개 중 0개 (0%)</span>
        <span>2개 역량 격차</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="watchOS 컴패니언 표면 - 5개 영역">
    <p className="maturity-readiness-summary">5개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 적용 범위 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">전달 및 복구</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>7개 중 0개 (0%) / 7개 중 0개 (0%)</span>
        <span>7개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">배포 및 지원</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개 (0%) / 6개 중 0개 (0%)</span>
        <span>6개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">실행 승인</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>3개 중 0개 (0%) / 3개 중 0개 (0%)</span>
        <span>3개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">알림 및 답장</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>7개 중 0개 (0%) / 7개 중 0개 (0%)</span>
        <span>7개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Watch 앱 UI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>3개 중 0개 (0%) / 3개 중 0개 (0%)</span>
        <span>3개 기능 격차</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="웹 검색 도구 - 4개 영역">
    <p className="maturity-readiness-summary">2개 검토 필요 / 2개 부분 검토됨</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 적용 범위 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">네트워크 안전</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 4개 중 0개 (0%)</span>
        <span>4개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">검색 제공자</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>19개 중 2개 (10.5%) / 19개 중 2개 (10.5%)</span>
        <span>17개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">설정 및 진단</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>9개 중 0개 (0%) / 9개 중 0개 (0%)</span>
        <span>9개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">도구 가용성 및 가져오기</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>11개 중 2개 (18.2%) / 12개 중 3개 (25%)</span>
        <span>9개 기능 격차</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp - 5개 영역">
    <p className="maturity-readiness-summary">5개 검토 필요</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 적용 범위 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">액세스 및 ID</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>7개 중 0개 (0%) / 7개 중 0개 (0%)</span>
        <span>7개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">채널 설정 및 운영</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>5개 중 0개 (0%) / 5개 중 0개 (0%)</span>
        <span>5개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">대화 라우팅 및 전달</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>4개 중 0개 (0%) / 4개 중 0개 (0%)</span>
        <span>4개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">미디어 및 리치 콘텐츠</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>2개 중 0개 (0%) / 2개 중 0개 (0%)</span>
        <span>2개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">네이티브 컨트롤 및 승인</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>2개 중 0개 (0%) / 2개 중 0개 (0%)</span>
        <span>2개 기능 격차</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WSL2를 통한 Windows - 6개 영역">
    <p className="maturity-readiness-summary">5개 검토 필요 / 1개 부분 검토됨</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>영역</span><span>기능 / 적용 범위 ID</span><span>후속 조치</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">브라우저 및 컨트롤 UI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개 (0%) / 6개 중 0개 (0%)</span>
        <span>6개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>8개 중 0개 (0%) / 8개 중 0개 (0%)</span>
        <span>8개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">진단 및 복구</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">부분 검토됨 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 1개 (16.7%) / 8개 중 3개 (37.5%)</span>
        <span>5개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 액세스 및 노출</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>11개 중 0개 (0%) / 11개 중 0개 (0%)</span>
        <span>11개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 서비스 수명 주기</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>10개 중 0개 (0%) / 10개 중 0개 (0%)</span>
        <span>10개 기능 격차</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WSL 설정</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">검토 필요 - 전체 분류 체계 검증</span>
        </div>
        <span>6개 중 0개 (0%) / 6개 중 0개 (0%)</span>
        <span>6개 기능 격차</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> 마지막 업데이트: 2026-06-22
