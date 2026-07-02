---
summary: OpenClaw のプロダクト領域、連携機能、サポート対象ワークフローに関するリリース準備状況スコア。
title: 成熟度スコアカード
x-i18n:
    generated_at: "2026-07-02T07:58:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0cc55f54773a19369b865994ea22d00f1e07fc7df2b2d5b14cb4067f994fb0e2
    source_path: maturity/scorecard.md
    workflow: 16
---

# 成熟度スコアカード

<div className="maturity-hero">
  <p className="maturity-kicker">リリース準備状況 - タクソノミー + QA エビデンスから生成</p>
  <p className="maturity-hero-title">準備済みのもの、証明済みのもの、まだ作業が必要なものを実用的に把握できます。</p>
  <p>50 個のサーフェス - 281 個のケイパビリティ領域 - 決定的カバレッジに加え、人間がレビューした品質と完全性。</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">サーフェスを閲覧</a> / <a href="#qa-evidence-summary">QA エビデンスを確認</a> / <a href="/ja-JP/maturity/taxonomy">タクソノミーを読む</a></p>
</div>

## このページの目的

このページは、1 つの問いに答えるために使います。どの OpenClaw サーフェスがリリースに向けた信頼できる選択肢であり、その判断を支えるエビデンスは何か。カバレッジは決定的な QA エビデンスに基づきます。品質と完全性は、レビュー済みの成熟度スコアとして管理されます。

## 概要

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">68%</span>
      <span>成熟度スコア</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "68" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">Alpha</span>
      <span>品質 + 完全性</span>
      <span>カバレッジ Experimental - 4%</span>
      <span>品質 Alpha - 64%</span>
      <span>完全性 Beta - 71%</span>
    </div>
  </div>
</div>

カバレッジは意図的にエビデンス主導です。実装が存在するだけでは、領域が「ready」になることはありません。これは成熟度スコアへの入力ではありませんが、OpenClaw は成熟した Stable 以上の機能について、時間の経過とともにエンドツーエンドカバレッジを 90% 超に保つことを目指しています。

## スコア帯

<div className="maturity-band-list">
  <div className="maturity-band maturity-band-experimental"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-experimental">Experimental</span></span><span>0-50%</span></div>
  <div className="maturity-band maturity-band-alpha"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-alpha">Alpha</span></span><span>50-70%</span></div>
  <div className="maturity-band maturity-band-beta"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-beta">Beta</span></span><span>70-80%</span></div>
  <div className="maturity-band maturity-band-stable"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-stable">Stable</span></span><span>80-95%</span></div>
  <div className="maturity-band maturity-band-clawesome"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-clawesome">Clawesome</span></span><span>95-100%</span></div>
</div>

## サーフェスエクスプローラー

<a id="surface-explorer" />

サーフェスは、成熟度レベル、完全性、品質の順に並べられます。LTS サポートは各行に併記されるため、リリース準備済みの選択肢を簡単に比較できます。

  <Tabs>
  <Tab title="All surfaces">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>サーフェス</span><span>カバレッジ</span><span>品質</span><span>完全性</span><span>サポート</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定</span></span><span>7 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Gateway ランタイム</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定</span></span><span>13 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Linux Gateway ホスト</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">macOS Gateway ホスト</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定</span></span><span>7 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定</span></span><span>6 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#android-app"><span className="maturity-surface-title">Android アプリ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定</span></span><span>7 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#ios-app"><span className="maturity-surface-title">iOS アプリ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定</span></span><span>8 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">エージェントランタイム</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>9 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">セッション、メモリ、コンテキストエンジン</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>9 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">チャネルフレームワーク</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>8 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">ブラウザー自動化、exec、サンドボックスツール</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>3 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#observability"><span className="maturity-surface-title">オブザーバビリティ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">OpenAI と Codex のプロバイダーパス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Gateway Web アプリ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>6 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Web 検索ツール</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>4 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugins</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>9 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">セキュリティ、認証、ペアリング、シークレット</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>6 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">自動化: Cron、フック、タスク、ポーリング</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>6 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Docker と Podman のホスティング</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>4 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">WSL2 経由の Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>6 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi と小型 Linux デバイス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>4 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Anthropic プロバイダーパス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">完全 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">完全 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Google プロバイダーパス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage と BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">macOS コンパニオンアプリ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">OpenRouter プロバイダーパス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">メディア理解とメディア生成</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">画像、動画、音楽生成ツール</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimental</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">ローカルモデルプロバイダー: Ollama、vLLM、SGLang、LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">ロングテールのホスト型プロバイダー</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>3領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">音声とリアルタイム会話</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>6領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>6領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#native-windows"><span className="maturity-surface-title">ネイティブ Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>4 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">一部 - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>4 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Kubernetes ホスティング</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>4 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu、QQ Bot、WeChat、Yuanbao、Zalo、Zalo Personal、地域別チャンネル</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>4 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost、LINE、IRC、Nextcloud Talk、Nostr、Twitch、Tlon、Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>4 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw アプリ SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>6 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Nix インストールパス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>実験的</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">音声通話チャネル</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>実験的</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">watchOS コンパニオンサーフェス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>実験的</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Linux コンパニオンアプリ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>計画中</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">ネイティブ Windows コンパニオンアプリ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>計画中</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Core">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>サーフェス</span><span>カバレッジ</span><span>品質</span><span>完成度</span><span>サポート</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定</span></span><span>7 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Gateway ランタイム</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定</span></span><span>13 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">エージェントランタイム</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>9 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">セッション、メモリ、コンテキストエンジン</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>9 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">チャネルフレームワーク</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>8 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#observability"><span className="maturity-surface-title">オブザーバビリティ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Gateway Webアプリ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>6 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">試験的</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugin</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>9 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">試験的</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">セキュリティ、認証、ペアリング、シークレット</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>6 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">試験的</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">自動化: Cron、フック、タスク、ポーリング</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>6 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">試験的</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">メディア理解とメディア生成</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>6 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">試験的</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">音声とリアルタイム会話</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>6 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">試験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>4 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw App SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>6 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="プラットフォーム">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>サーフェス</span><span>カバレッジ</span><span>品質</span><span>完全性</span><span>サポート</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Linux Gateway ホスト</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定版</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">一部 - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">macOS Gateway ホスト</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定版</span></span><span>7 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#android-app"><span className="maturity-surface-title">Android アプリ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定版</span></span><span>7 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#ios-app"><span className="maturity-surface-title">iOS アプリ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定版</span></span><span>8 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Docker と Podman のホスティング</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>4 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">WSL2 経由の Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>6 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi と小型 Linux デバイス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>4 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">macOS コンパニオンアプリ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>8 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#native-windows"><span className="maturity-surface-title">ネイティブ Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>4 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Kubernetes ホスティング</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>4 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Nix インストールパス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>実験的</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">watchOS コンパニオンサーフェス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>実験的</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Linux コンパニオンアプリ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>計画中</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">ネイティブ Windows コンパニオンアプリ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>計画中</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="チャネル">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>サーフェス</span><span>カバレッジ</span><span>品質</span><span>完成度</span><span>サポート</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定版</span></span><span>6 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">一部 - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">フル - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">フル - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage と BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>6領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu、QQ Bot、WeChat、Yuanbao、Zalo、Zalo Personal、地域チャネル</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>4 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost、LINE、IRC、Nextcloud Talk、Nostr、Twitch、Tlon、Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>4 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">音声通話チャネル</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>実験的</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="プロバイダーとツール">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>サーフェス</span><span>カバレッジ</span><span>品質</span><span>完全性</span><span>サポート</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">ブラウザー自動化、exec、sandbox ツール</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>3 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">OpenAI と Codex のプロバイダーパス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">ウェブ検索ツール</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>4領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Anthropic プロバイダーパス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Google プロバイダーパス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">OpenRouter プロバイダーパス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>4領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">画像、動画、音楽生成ツール</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">ローカルモデルプロバイダー: Ollama、vLLM、SGLang、LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">ロングテールのホスト型プロバイダー</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>3領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完成度</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## QA エビデンス概要

以下のチェックは、QA プロファイルのエビデンスによってどのスコアカード領域が実行されたかを示します。

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">完全なタクソノミー検証</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>96 件のチェック - 94 件合格、2 件ブロック</span>
    <span>281 領域中 0 (0%) - 1675 機能中 20 (1.2%) - 1665 coverage ID 中 77 (4.6%)</span>
  </div>
</div>

### 領域別の準備状況

各カテゴリのエビデンス状態を調べるには、対象のサーフェスを開きます。ページをひと目で把握しやすくするため、リストは折りたたまれたままです。

<AccordionGroup>
  <Accordion title="エージェントランタイム - 9 領域">
    <p className="maturity-readiness-summary">8 件は一部レビュー済み / 1 件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / coverage ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">エージェントターン実行</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>3 件中 0 (0%) / 24 件中 7 (29.2%)</span>
        <span>17 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">外部ランタイムとサブエージェント</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>4 件中 0 (0%) / 10 件中 3 (30%)</span>
        <span>7 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ホスト型プロバイダー実行</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 1 (20%) / 5 件中 1 (20%)</span>
        <span>4 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ローカルおよびセルフホスト型プロバイダー</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 (0%) / 5 件中 0 (0%)</span>
        <span>5 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">モデルとランタイムの選択</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>4 件中 0 (0%) / 8 件中 2 (25%)</span>
        <span>6 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロバイダー認証</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>10 件中 0 (0%) / 17 件中 4 (23.5%)</span>
        <span>13 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ストリーミングと進行状況</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>2 件中 0 (0%) / 9 件中 5 (55.6%)</span>
        <span>4 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ツール呼び出しとレスポンス処理</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>3 件中 0 (0%) / 23 件中 15 (65.2%)</span>
        <span>8 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ツール実行コントロール</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>6 件中 0 (0%) / 12 件中 6 (50%)</span>
        <span>6 件のケイパビリティギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Android アプリ - 7 領域">
    <p className="maturity-readiness-summary">7 件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / coverage ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">接続設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1 件中 0 (0%) / 1 件中 0 (0%)</span>
        <span>1 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">デバイスランタイム</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>2 件中 0 (0%) / 2 件中 0 (0%)</span>
        <span>2 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">配布</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>3 件中 0 (0%) / 3 件中 0 (0%)</span>
        <span>3 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアキャプチャ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1 件中 0 (0%) / 1 件中 0 (0%)</span>
        <span>1 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">モバイルチャット</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1 件中 0 (0%) / 1 件中 0 (0%)</span>
        <span>1 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1 件中 0 (0%) / 1 件中 0 (0%)</span>
        <span>1 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">音声</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1 件中 0 (0%) / 1 件中 0 (0%)</span>
        <span>1 件のケイパビリティギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Anthropic プロバイダーパス - 5 領域">
    <p className="maturity-readiness-summary">5 件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / coverage ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディア入力</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>4 件中 0 (0%) / 4 件中 0 (0%)</span>
        <span>4 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">モデルとランタイムの選択</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>10 件中 0 (0%) / 12 件中 0 (0%)</span>
        <span>12 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロンプトキャッシュとコンテキスト</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 (0%) / 5 件中 0 (0%)</span>
        <span>5 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロバイダー認証と復旧</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>9 件中 0 (0%) / 9 件中 0 (0%)</span>
        <span>9 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">リクエスト転送とターンセマンティクス</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>10 件中 0 (0%) / 10 件中 0 (0%)</span>
        <span>10 件のケイパビリティギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="自動化: Cron、フック、タスク、ポーリング - 6領域">
    <p className="maturity-readiness-summary">5 件はレビューが必要 / 1 件は部分的にレビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">自動化フック</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>0 of 11 (0%) / 0 of 11 (0%)</span>
        <span>11 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">バックグラウンドタスクとフロー</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>0 of 10 (0%) / 0 of 10 (0%)</span>
        <span>10 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cron ジョブ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>0 of 15 (0%) / 0 of 15 (0%)</span>
        <span>15 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">イベント取り込み</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>0 of 15 (0%) / 0 of 15 (0%)</span>
        <span>15 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Heartbeat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>0 of 5 (0%) / 1 of 7 (14.3%)</span>
        <span>6 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ポーリング制御</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>0 of 10 (0%) / 0 of 10 (0%)</span>
        <span>10 件のケイパビリティギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ブラウザー自動化、exec、サンドボックスツール - 3領域">
    <p className="maturity-readiness-summary">2 件は部分的にレビュー済み / 1 件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ブラウザー自動化</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>1 of 8 (12.5%) / 1 of 8 (12.5%)</span>
        <span>7 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">サンドボックスとツールポリシー</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>0 of 6 (0%) / 0 of 6 (0%)</span>
        <span>6 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ツール呼び出しと実行</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>2 of 6 (33.3%) / 4 of 8 (50%)</span>
        <span>4 件のケイパビリティギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Gateway Web アプリ - 6領域">
    <p className="maturity-readiness-summary">3 件はレビューが必要 / 3 件は部分的にレビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ブラウザーアクセスと信頼</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>0 of 5 (0%) / 0 of 5 (0%)</span>
        <span>5 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ブラウザーのリアルタイム会話</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>0 of 5 (0%) / 0 of 5 (0%)</span>
        <span>5 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ブラウザー UI</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>0 of 10 (0%) / 1 of 12 (8.3%)</span>
        <span>11 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>0 of 5 (0%) / 0 of 5 (0%)</span>
        <span>5 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">オペレーターコンソール</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>0 of 10 (0%) / 1 of 12 (8.3%)</span>
        <span>11 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat 会話</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>0 of 15 (0%) / 2 of 20 (10%)</span>
        <span>18 件のケイパビリティギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="チャネルフレームワーク - 8領域">
    <p className="maturity-readiness-summary">4 件はレビューが必要 / 4 件は部分的にレビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルアクション、コマンド、承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>0 of 5 (0%) / 0 of 5 (0%)</span>
        <span>5 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルセットアップ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>0 of 5 (0%) / 1 of 7 (14.3%)</span>
        <span>6 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>0 of 10 (0%) / 5 of 27 (18.5%)</span>
        <span>22 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">グループスレッドとアンビエントルームの動作</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>0 of 5 (0%) / 4 of 11 (36.4%)</span>
        <span>7 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">受信アクセスと ID ゲート</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>0 of 5 (0%) / 0 of 5 (0%)</span>
        <span>5 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディア添付ファイルとリッチチャネルデータ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>0 of 4 (0%) / 0 of 4 (0%)</span>
        <span>4 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">送信配信と返信パイプライン</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>0 of 4 (0%) / 8 of 21 (38.1%)</span>
        <span>13 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ステータス、健全性、オペレーター制御</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>0 of 4 (0%) / 0 of 6 (0%)</span>
        <span>6 件のケイパビリティギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub - 4 領域">
    <p className="maturity-readiness-summary">4 件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">カタログ検出</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">互換性と信頼</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>12 件中 0 件 (0%) / 12 件中 0 件 (0%)</span>
        <span>12 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin ライフサイクルと健全性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>26 件中 0 件 (0%) / 26 件中 0 件 (0%)</span>
        <span>26 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">公開</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>7 件中 0 件 (0%) / 7 件中 0 件 (0%)</span>
        <span>7 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="CLI - 7 領域">
    <p className="maturity-readiness-summary">5 件はレビューが必要 / 2 件は一部レビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI 可観測性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI セットアップ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>6 件中 1 件 (16.7%) / 6 件中 1 件 (16.7%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">診断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>10 件中 0 件 (0%) / 10 件中 0 件 (0%)</span>
        <span>10 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway サービス管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 7 件中 1 件 (14.3%)</span>
        <span>6 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">オンボーディングと認証セットアップ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin とチャネルのセットアップ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">更新とアップグレード</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord - 6 領域">
    <p className="maturity-readiness-summary">6 件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスとアイデンティティ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>6 件中 0 件 (0%) / 6 件中 0 件 (0%)</span>
        <span>6 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルのセットアップと運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>10 件中 0 件 (0%) / 10 件中 0 件 (0%)</span>
        <span>10 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>12 件中 0 件 (0%) / 12 件中 0 件 (0%)</span>
        <span>12 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1 件中 0 件 (0%) / 1 件中 0 件 (0%)</span>
        <span>1 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブコントロールと承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">リアルタイム音声と通話</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Docker と Podman ホスティング - 4 領域">
    <p className="maturity-readiness-summary">3 件はレビューが必要 / 1 件は一部レビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">エージェントサンドボックスとツール</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>3 件中 0 件 (0%) / 3 件中 0 件 (0%)</span>
        <span>3 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">コンテナ運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>11 件中 0 件 (0%) / 11 件中 0 件 (0%)</span>
        <span>11 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">コンテナセットアップ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>6 件中 0 件 (0%) / 6 件中 0 件 (0%)</span>
        <span>6 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">イメージリリースと検証</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 1 件 (20%) / 7 件中 2 件 (28.6%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu、QQ Bot、WeChat、Yuanbao、Zalo、Zalo Personal、地域別チャネル - 4領域">
    <p className="maturity-readiness-summary">4件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスとアイデンティティ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系検証</span>
        </div>
        <span>1件中0件 (0%) / 1件中0件 (0%)</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネル設定と運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系検証</span>
        </div>
        <span>6件中0件 (0%) / 6件中0件 (0%)</span>
        <span>6件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話ルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系検証</span>
        </div>
        <span>1件中0件 (0%) / 1件中0件 (0%)</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系検証</span>
        </div>
        <span>1件中0件 (0%) / 1件中0件 (0%)</span>
        <span>1件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Gateway ランタイム - 13領域">
    <p className="maturity-readiness-summary">9件はレビューが必要 / 4件は一部レビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">承認とリモート実行</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系検証</span>
        </div>
        <span>6件中0件 (0%) / 6件中0件 (0%)</span>
        <span>6件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">デバイス認証とペアリング</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系検証</span>
        </div>
        <span>10件中0件 (0%) / 10件中0件 (0%)</span>
        <span>10件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway ライフサイクル</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全な分類体系検証</span>
        </div>
        <span>7件中0件 (0%) / 12件中4件 (33.3%)</span>
        <span>8件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway RPC API とイベント</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全な分類体系検証</span>
        </div>
        <span>20件中0件 (0%) / 22件中2件 (9.1%)</span>
        <span>20件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ヘルス、診断、修復</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系検証</span>
        </div>
        <span>7件中0件 (0%) / 7件中0件 (0%)</span>
        <span>7件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ホスト型 Web サーフェス</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系検証</span>
        </div>
        <span>4件中0件 (0%) / 4件中0件 (0%)</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">HTTP API</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全な分類体系検証</span>
        </div>
        <span>4件中1件 (25%) / 4件中1件 (25%)</span>
        <span>3件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネットワークアクセスと検出</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系検証</span>
        </div>
        <span>6件中0件 (0%) / 6件中0件 (0%)</span>
        <span>6件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Node とリモート機能</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系検証</span>
        </div>
        <span>8件中0件 (0%) / 8件中0件 (0%)</span>
        <span>8件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロトコル互換性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系検証</span>
        </div>
        <span>7件中0件 (0%) / 7件中0件 (0%)</span>
        <span>7件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ロールと権限</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">セキュリティ制御</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系検証</span>
        </div>
        <span>6件中0件 (0%) / 6件中0件 (0%)</span>
        <span>6件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebSocket 接続</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全な分類体系検証</span>
        </div>
        <span>8件中1件 (12.5%) / 8件中1件 (12.5%)</span>
        <span>7件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat - 5領域">
    <p className="maturity-readiness-summary">5件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスとアイデンティティ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系検証</span>
        </div>
        <span>11件中0件 (0%) / 11件中0件 (0%)</span>
        <span>11件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネル設定と運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系検証</span>
        </div>
        <span>16件中0件 (0%) / 16件中0件 (0%)</span>
        <span>16件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話ルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系検証</span>
        </div>
        <span>1件中0件 (0%) / 1件中0件 (0%)</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系検証</span>
        </div>
        <span>1件中0件 (0%) / 1件中0件 (0%)</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブコントロールと承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系検証</span>
        </div>
        <span>16件中0件 (0%) / 16件中0件 (0%)</span>
        <span>16件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google プロバイダーパス - 5 領域">
    <p className="maturity-readiness-summary">5 件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">直接 Gemini ランタイム</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>9 中 0 (0%) / 9 中 0 (0%)</span>
        <span>9 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディア、検索、リアルタイム</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>10 中 0 (0%) / 10 中 0 (0%)</span>
        <span>10 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">モデルルーティングとエンドポイント</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>10 中 0 (0%) / 10 中 0 (0%)</span>
        <span>10 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロンプトキャッシュ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 中 0 (0%) / 5 中 0 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロバイダー設定と認証情報</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>10 中 0 (0%) / 10 中 0 (0%)</span>
        <span>10 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="画像、動画、音楽生成ツール - 5 領域">
    <p className="maturity-readiness-summary">5 件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">画像生成</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>9 中 0 (0%) / 9 中 0 (0%)</span>
        <span>9 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアルーティングと検出</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>4 中 0 (0%) / 4 中 0 (0%)</span>
        <span>4 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">音楽生成</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>6 中 0 (0%) / 6 中 0 (0%)</span>
        <span>6 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">タスクライフサイクルと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>12 中 0 (0%) / 12 中 0 (0%)</span>
        <span>12 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">動画生成</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>11 中 0 (0%) / 11 中 0 (0%)</span>
        <span>11 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessage と BlueBubbles - 5 領域">
    <p className="maturity-readiness-summary">5 件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスと ID</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>6 中 0 (0%) / 6 中 0 (0%)</span>
        <span>6 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャンネル設定と運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>11 中 0 (0%) / 11 中 0 (0%)</span>
        <span>11 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話ルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>4 中 0 (0%) / 4 中 0 (0%)</span>
        <span>4 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>7 中 0 (0%) / 7 中 0 (0%)</span>
        <span>7 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブコントロールと承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>3 中 0 (0%) / 3 中 0 (0%)</span>
        <span>3 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iOS アプリ - 8 領域">
    <p className="maturity-readiness-summary">8 件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">キャンバスと画面</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1 中 0 (0%) / 1 中 0 (0%)</span>
        <span>1 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャットとセッション</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1 中 0 (0%) / 1 中 0 (0%)</span>
        <span>1 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">デバイスコマンド</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>2 中 0 (0%) / 2 中 0 (0%)</span>
        <span>2 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">配布</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1 中 0 (0%) / 1 中 0 (0%)</span>
        <span>1 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 設定と診断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>7 中 0 (0%) / 7 中 0 (0%)</span>
        <span>7 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアと共有</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1 中 0 (0%) / 1 中 0 (0%)</span>
        <span>1 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">通知とバックグラウンド</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1 中 0 (0%) / 1 中 0 (0%)</span>
        <span>1 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">音声</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1 中 0 (0%) / 1 中 0 (0%)</span>
        <span>1 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Kubernetesホスティング - 4領域">
    <p className="maturity-readiness-summary">4件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスと公開</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">クラスターライフサイクル</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">構成とシークレット</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">デプロイ設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Linuxコンパニオンアプリ - 5領域">
    <p className="maturity-readiness-summary">5件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アプリ配布</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>3件中0件 (0%) / 3件中0件 (0%)</span>
        <span>3件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャットとセッション</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>3件中0件 (0%) / 3件中0件 (0%)</span>
        <span>3件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">デスクトップ機能</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>9件中0件 (0%) / 9件中0件 (0%)</span>
        <span>9件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway接続</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>4件中0件 (0%) / 4件中0件 (0%)</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">状態と診断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>7件中0件 (0%) / 7件中0件 (0%)</span>
        <span>7件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Linux Gatewayホスト - 5領域">
    <p className="maturity-readiness-summary">5件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">デプロイ先</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>3件中0件 (0%) / 3件中0件 (0%)</span>
        <span>3件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">診断と修復</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>4件中0件 (0%) / 4件中0件 (0%)</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gatewayランタイムとサービス制御</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>6件中0件 (0%) / 6件中0件 (0%)</span>
        <span>6件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ホスト設定と更新</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>4件中0件 (0%) / 4件中0件 (0%)</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">リモートアクセスとセキュリティ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>6件中0件 (0%) / 6件中0件 (0%)</span>
        <span>6件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ローカルモデルプロバイダー: Ollama、vLLM、SGLang、LM Studio - 5領域">
    <p className="maturity-readiness-summary">5件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ローカルメモリと埋め込み</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブプロバイダーPlugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>10件中0件 (0%) / 10件中0件 (0%)</span>
        <span>10件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネットワーク安全性とプロンプト制御</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>2件中0件 (0%) / 2件中0件 (0%)</span>
        <span>2件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">OpenAI互換ランタイム互換性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>8件中0件 (0%) / 8件中0件 (0%)</span>
        <span>8件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロバイダー設定、ライフサイクル、診断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>12件中0件 (0%) / 12件中0件 (0%)</span>
        <span>12件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ロングテールのホスト型プロバイダー - 3領域">
    <p className="maturity-readiness-summary">3件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ホスト型LLMプロバイダー</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>12件中0件 (0%) / 12件中0件 (0%)</span>
        <span>12件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ホスト型メディアプロバイダー</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>8件中0件 (0%) / 8件中0件 (0%)</span>
        <span>8件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロバイダー運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>12件中0件 (0%) / 12件中0件 (0%)</span>
        <span>12件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="macOS コンパニオンアプリ - 8 領域">
    <p className="maturity-readiness-summary">8 件レビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">キャンバス</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>4 件中 0 件 (0%) / 4 件中 0 件 (0%)</span>
        <span>4 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ローカルセットアップ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>7 件中 0 件 (0%) / 7 件中 0 件 (0%)</span>
        <span>7 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブ機能</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">リモート接続</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>3 件中 0 件 (0%) / 3 件中 0 件 (0%)</span>
        <span>3 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">リモート WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ステータスと設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">音声と会話</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>3 件中 0 件 (0%) / 3 件中 0 件 (0%)</span>
        <span>3 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>3 件中 0 件 (0%) / 3 件中 0 件 (0%)</span>
        <span>3 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="macOS Gateway ホスト - 7 領域">
    <p className="maturity-readiness-summary">7 件レビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI セットアップ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>4 件中 0 件 (0%) / 4 件中 0 件 (0%)</span>
        <span>4 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">診断と可観測性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>4 件中 0 件 (0%) / 4 件中 0 件 (0%)</span>
        <span>4 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway サービスライフサイクル</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>10 件中 0 件 (0%) / 10 件中 0 件 (0%)</span>
        <span>10 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ローカル Gateway 統合</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>9 件中 0 件 (0%) / 9 件中 0 件 (0%)</span>
        <span>9 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">権限とネイティブ機能</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>4 件中 0 件 (0%) / 4 件中 0 件 (0%)</span>
        <span>4 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロファイルと分離</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">リモート Gateway モード</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Matrix - 6 領域">
    <p className="maturity-readiness-summary">6 件レビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスとアイデンティティ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>7 件中 0 件 (0%) / 7 件中 0 件 (0%)</span>
        <span>7 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルのセットアップと運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1 件中 0 件 (0%) / 1 件中 0 件 (0%)</span>
        <span>1 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">暗号化と検証</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>3 件中 0 件 (0%) / 3 件中 0 件 (0%)</span>
        <span>3 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1 件中 0 件 (0%) / 1 件中 0 件 (0%)</span>
        <span>1 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブコントロールと承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>6 件中 0 件 (0%) / 6 件中 0 件 (0%)</span>
        <span>6 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat - 4 領域">
    <p className="maturity-readiness-summary">4 件レビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスとアイデンティティ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1 件中 0 件 (0%) / 1 件中 0 件 (0%)</span>
        <span>1 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルのセットアップと運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1 件中 0 件 (0%) / 1 件中 0 件 (0%)</span>
        <span>1 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1 件中 0 件 (0%) / 1 件中 0 件 (0%)</span>
        <span>1 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1 件中 0 件 (0%) / 1 件中 0 件 (0%)</span>
        <span>1 件のケイパビリティギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="メディア理解とメディア生成 - 6 領域">
    <p className="maturity-readiness-summary">4 件レビューが必要 / 2 件一部レビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルのメディア処理</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディア設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1 件中 0 件 (0%) / 1 件中 0 件 (0%)</span>
        <span>1 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディア生成</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>17 件中 1 件 (5.9%) / 19 件中 1 件 (5.3%)</span>
        <span>18 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアの取り込みとアクセス</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>8 件中 0 件 (0%) / 8 件中 0 件 (0%)</span>
        <span>8 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディア理解</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>12 件中 0 件 (0%) / 14 件中 1 件 (7.1%)</span>
        <span>13 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">テキスト読み上げ配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>2 件中 0 件 (0%) / 2 件中 0 件 (0%)</span>
        <span>2 件のケイパビリティギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams - 5 領域">
    <p className="maturity-readiness-summary">5 件レビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスとアイデンティティ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>9 件中 0 件 (0%) / 9 件中 0 件 (0%)</span>
        <span>9 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルのセットアップと運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>9 件中 0 件 (0%) / 9 件中 0 件 (0%)</span>
        <span>9 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブコントロールと承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件のケイパビリティギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ネイティブ Windows - 4 領域">
    <p className="maturity-readiness-summary">4 件レビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>9 件中 0 件 (0%) / 9 件中 0 件 (0%)</span>
        <span>9 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>11 件中 0 件 (0%) / 11 件中 0 件 (0%)</span>
        <span>11 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネットワーク</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>4 件中 0 件 (0%) / 4 件中 0 件 (0%)</span>
        <span>4 件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">更新</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>4 件中 0 件 (0%) / 4 件中 0 件 (0%)</span>
        <span>4 件のケイパビリティギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ネイティブ Windows コンパニオンアプリ - 5領域">
    <p className="maturity-readiness-summary">5件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャットセッション</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>2中0 (0%) / 2中0 (0%)</span>
        <span>2件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">デスクトップツールと権限</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>10中0 (0%) / 10中0 (0%)</span>
        <span>10件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 接続</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>3中0 (0%) / 3中0 (0%)</span>
        <span>3件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">インストールと更新</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>4中0 (0%) / 4中0 (0%)</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ステータスと修復</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>5中0 (0%) / 5中0 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Nix インストールパス - 5領域">
    <p className="maturity-readiness-summary">5件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">有効化とアプリ UX</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>7中0 (0%) / 7中0 (0%)</span>
        <span>7件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">設定と状態</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>7中0 (0%) / 7中0 (0%)</span>
        <span>7件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">インストールの引き継ぎ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>4中0 (0%) / 4中0 (0%)</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin ライフサイクル</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>4中0 (0%) / 4中0 (0%)</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">サービスランタイムとガード</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>8中0 (0%) / 8中0 (0%)</span>
        <span>8件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenAI と Codex プロバイダーパス - 5領域">
    <p className="maturity-readiness-summary">2件はレビューが必要 / 3件は部分的にレビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">画像とマルチモーダル入力</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>2中0 (0%) / 2中0 (0%)</span>
        <span>2件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">モデルと認証</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - 完全な分類体系の検証</span>
        </div>
        <span>6中1 (16.7%) / 9中4 (44.4%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブ Codex ハーネス</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - 完全な分類体系の検証</span>
        </div>
        <span>2中0 (0%) / 9中4 (44.4%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Responses とツール互換性</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - 完全な分類体系の検証</span>
        </div>
        <span>4中1 (25%) / 5中2 (40%)</span>
        <span>3件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">音声とリアルタイム音声</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>2中0 (0%) / 2中0 (0%)</span>
        <span>2件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenClaw App SDK - 6領域">
    <p className="maturity-readiness-summary">5件はレビューが必要 / 1件は部分的にレビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">エージェント会話</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>6中0 (0%) / 6中0 (0%)</span>
        <span>6件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">クライアント API</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>4中0 (0%) / 4中0 (0%)</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">互換性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>5中0 (0%) / 5中0 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">イベントと承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>5中0 (0%) / 5中0 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway アクセス</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全な分類体系の検証</span>
        </div>
        <span>5中0 (0%) / 5中0 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">リソースヘルパー</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - 完全な分類体系の検証</span>
        </div>
        <span>5中0 (0%) / 6中1 (16.7%)</span>
        <span>5件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenRouter プロバイダー パス - 4 領域">
    <p className="maturity-readiness-summary">4 件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャット ランタイムと正規化</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>15 件中 0 件 (0%) / 15 件中 0 件 (0%)</span>
        <span>15 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディア生成と音声</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>7 件中 0 件 (0%) / 7 件中 0 件 (0%)</span>
        <span>7 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロバイダーの復旧と診断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロバイダーのセットアップと認証</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>14 件中 0 件 (0%) / 14 件中 0 件 (0%)</span>
        <span>14 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Plugin - 9 領域">
    <p className="maturity-readiness-summary">6 件はレビューが必要 / 3 件は一部レビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin の作成とパッケージ化</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>8 件中 0 件 (0%) / 8 件中 0 件 (0%)</span>
        <span>8 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">同梱 Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>6 件中 0 件 (0%) / 6 件中 0 件 (0%)</span>
        <span>6 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネル Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin のインストールと実行</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>6 件中 0 件 (0%) / 20 件中 7 件 (35%)</span>
        <span>13 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin の承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>6 件中 0 件 (0%) / 6 件中 0 件 (0%)</span>
        <span>6 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロバイダーとツールの Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>6 件中 1 件 (16.7%) / 21 件中 9 件 (42.9%)</span>
        <span>12 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin の公開</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>6 件中 0 件 (0%) / 6 件中 0 件 (0%)</span>
        <span>6 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin のテスト</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>6 件中 0 件 (0%) / 11 件中 3 件 (27.3%)</span>
        <span>8 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi と小型 Linux デバイス - 4 領域">
    <p className="maturity-readiness-summary">4 件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway ランタイム</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>10 件中 0 件 (0%) / 10 件中 0 件 (0%)</span>
        <span>10 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">パフォーマンスと診断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">リモートアクセスと認証</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>9 件中 0 件 (0%) / 9 件中 0 件 (0%)</span>
        <span>9 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">セットアップと互換性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>12 件中 0 件 (0%) / 12 件中 0 件 (0%)</span>
        <span>12 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="セキュリティ、認証、ペアリング、シークレット - 6 領域">
    <p className="maturity-readiness-summary">2 件は一部レビュー済み / 4 件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">承認ポリシーとツールのセーフガード</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>2 件中 0 件 (0%) / 6 件中 3 件 (50%)</span>
        <span>3 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネル アクセス制御</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>3 件中 0 件 (0%) / 3 件中 0 件 (0%)</span>
        <span>3 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">認証情報とシークレットの管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 11 件中 5 件 (45.5%)</span>
        <span>6 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">デバイスと Node のペアリング</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>11 件中 0 件 (0%) / 11 件中 0 件 (0%)</span>
        <span>11 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 認証とリモートアクセス</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>9 件中 0 件 (0%) / 9 件中 0 件 (0%)</span>
        <span>9 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin の信頼</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>2 件中 0 件 (0%) / 2 件中 0 件 (0%)</span>
        <span>2 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="セッション、メモリ、コンテキストエンジン - 9領域">
    <p className="maturity-readiness-summary">2件はレビューが必要 / 7件は一部レビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI セッションとトランスクリプト管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>2件中0件 (0%) / 2件中0件 (0%)</span>
        <span>2件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">コンテキストエンジン</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>2件中0件 (0%) / 7件中4件 (57.1%)</span>
        <span>3件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">コアプロンプトとコンテキスト</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>2件中0件 (0%) / 8件中3件 (37.5%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">クライアント横断の履歴とセッションの同等性</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>2件中0件 (0%) / 5件中2件 (40%)</span>
        <span>3件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">診断、メンテナンス、復旧</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>3件中0件 (0%) / 10件中4件 (40%)</span>
        <span>6件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メモリ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>5件中0件 (0%) / 13件中6件 (46.2%)</span>
        <span>7件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">セッションルーティング</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>2件中0件 (0%) / 4件中1件 (25%)</span>
        <span>3件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">トークン管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>3件中0件 (0%) / 10件中2件 (20%)</span>
        <span>8件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">トランスクリプト永続化</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>2件中0件 (0%) / 2件中0件 (0%)</span>
        <span>2件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal - 5領域">
    <p className="maturity-readiness-summary">5件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスとID</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>6件中0件 (0%) / 6件中0件 (0%)</span>
        <span>6件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルのセットアップと運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>7件中0件 (0%) / 7件中0件 (0%)</span>
        <span>7件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1件中0件 (0%) / 1件中0件 (0%)</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>7件中0件 (0%) / 7件中0件 (0%)</span>
        <span>7件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブコントロールと承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>3件中0件 (0%) / 3件中0件 (0%)</span>
        <span>3件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack - 5領域">
    <p className="maturity-readiness-summary">5件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスとID</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1件中0件 (0%) / 1件中0件 (0%)</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルのセットアップと運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>10件中0件 (0%) / 10件中0件 (0%)</span>
        <span>10件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1件中0件 (0%) / 1件中0件 (0%)</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブコントロールと承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>8件中0件 (0%) / 8件中0件 (0%)</span>
        <span>8件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram - 5領域">
    <p className="maturity-readiness-summary">5件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスとID</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>10件中0件 (0%) / 10件中0件 (0%)</span>
        <span>10件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルのセットアップと運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>10件中0件 (0%) / 10件中0件 (0%)</span>
        <span>10件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1件中0件 (0%) / 1件中0件 (0%)</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1件中0件 (0%) / 1件中0件 (0%)</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブコントロールと承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>9件中0件 (0%) / 9件中0件 (0%)</span>
        <span>9件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Observability - 5領域">
    <p className="maturity-readiness-summary">一部レビュー済み 3 / レビューが必要 2</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">診断情報の収集</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>8件中1件 (12.5%) / 10件中3件 (30%)</span>
        <span>7件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ヘルスと修復</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>12件中1件 (8.3%) / 18件中5件 (27.8%)</span>
        <span>13件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ログ記録</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">セッション診断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>4件中0件 (0%) / 4件中0件 (0%)</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">テレメトリのエクスポート</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>13件中1件 (7.7%) / 21件中7件 (33.3%)</span>
        <span>14件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="TUI - 5領域">
    <p className="maturity-readiness-summary">レビューが必要 5</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">入力とコマンド</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>8件中0件 (0%) / 8件中0件 (0%)</span>
        <span>8件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ローカルシェル実行</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>4件中0件 (0%) / 4件中0件 (0%)</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">レンダリングと出力の安全性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>4件中0件 (0%) / 4件中0件 (0%)</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ランタイムモード</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>14件中0件 (0%) / 14件中0件 (0%)</span>
        <span>14件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">セッション管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>3件中0件 (0%) / 3件中0件 (0%)</span>
        <span>3件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="音声とリアルタイム会話 - 6領域">
    <p className="maturity-readiness-summary">レビューが必要 6</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブアプリでの会話</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>4件中0件 (0%) / 4件中0件 (0%)</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">リアルタイム会話セッション</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>11件中0件 (0%) / 11件中0件 (0%)</span>
        <span>11件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">音声と文字起こし</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のObservability</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話プロバイダー</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>7件中0件 (0%) / 7件中0件 (0%)</span>
        <span>7件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">音声ウェイクとルーティング</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>4件中0件 (0%) / 4件中0件 (0%)</span>
        <span>4件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="音声通話チャネル - 5領域">
    <p className="maturity-readiness-summary">レビューが必要 5</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスとアイデンティティ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1件中0件 (0%) / 1件中0件 (0%)</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルのセットアップと運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>2件中0件 (0%) / 2件中0件 (0%)</span>
        <span>2件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>1件中0件 (0%) / 1件中0件 (0%)</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>2件中0件 (0%) / 2件中0件 (0%)</span>
        <span>2件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">リアルタイム音声と通話</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>2件中0件 (0%) / 2件中0件 (0%)</span>
        <span>2件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="watchOS companion surfaces - 5領域">
    <p className="maturity-readiness-summary">5件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">配信と復旧</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>7件中0件 (0%) / 7件中0件 (0%)</span>
        <span>7件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">配布とサポート</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>6件中0件 (0%) / 6件中0件 (0%)</span>
        <span>6件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Exec承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>3件中0件 (0%) / 3件中0件 (0%)</span>
        <span>3件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">通知と返信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>7件中0件 (0%) / 7件中0件 (0%)</span>
        <span>7件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Watch App UI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>3件中0件 (0%) / 3件中0件 (0%)</span>
        <span>3件のケイパビリティギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Web検索ツール - 4領域">
    <p className="maturity-readiness-summary">2件はレビューが必要 / 2件は一部レビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネットワーク安全性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>4件中0件 (0%) / 4件中0件 (0%)</span>
        <span>4件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">検索プロバイダー</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>19件中2件 (10.5%) / 19件中2件 (10.5%)</span>
        <span>17件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">セットアップと診断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>9件中0件 (0%) / 9件中0件 (0%)</span>
        <span>9件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ツールの可用性と取得</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>11件中2件 (18.2%) / 12件中3件 (25%)</span>
        <span>9件のケイパビリティギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp - 5領域">
    <p className="maturity-readiness-summary">5件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスとアイデンティティ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>7件中0件 (0%) / 7件中0件 (0%)</span>
        <span>7件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャンネルセットアップと運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話ルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>4件中0件 (0%) / 4件中0件 (0%)</span>
        <span>4件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>2件中0件 (0%) / 2件中0件 (0%)</span>
        <span>2件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブコントロールと承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>2件中0件 (0%) / 2件中0件 (0%)</span>
        <span>2件のケイパビリティギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WSL2経由のWindows - 6領域">
    <p className="maturity-readiness-summary">5件はレビューが必要 / 1件は一部レビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ブラウザーとControl UI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>6件中0件 (0%) / 6件中0件 (0%)</span>
        <span>6件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>8件中0件 (0%) / 8件中0件 (0%)</span>
        <span>8件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">診断と修復</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全なタクソノミー検証</span>
        </div>
        <span>6件中1件 (16.7%) / 8件中3件 (37.5%)</span>
        <span>5件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gatewayアクセスと公開</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>11件中0件 (0%) / 11件中0件 (0%)</span>
        <span>11件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gatewayサービスライフサイクル</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>10件中0件 (0%) / 10件中0件 (0%)</span>
        <span>10件のケイパビリティギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WSLセットアップ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - 完全なタクソノミー検証</span>
        </div>
        <span>6件中0件 (0%) / 6件中0件 (0%)</span>
        <span>6件のケイパビリティギャップ</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> 最終更新: 2026-06-22
