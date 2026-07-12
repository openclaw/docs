---
summary: 製品領域、統合、サポート対象ワークフローに関するOpenClawのリリース準備状況スコア。
title: 成熟度スコアカード
x-i18n:
    generated_at: "2026-07-11T22:22:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0cc55f54773a19369b865994ea22d00f1e07fc7df2b2d5b14cb4067f994fb0e2
    source_path: maturity/scorecard.md
    workflow: 16
---

# 成熟度スコアカード

<div className="maturity-hero">
  <p className="maturity-kicker">リリース準備状況 - タクソノミーとQAエビデンスから生成</p>
  <p className="maturity-hero-title">準備済みのもの、実証済みのもの、まだ作業が必要なものを実用的な観点で示します。</p>
  <p>50のサーフェス - 281の機能領域 - 決定論的なカバレッジに加え、人間によるレビュー済みの品質と完全性。</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">サーフェスを閲覧</a> / <a href="#qa-evidence-summary">QAエビデンスを確認</a> / <a href="/ja-JP/maturity/taxonomy">タクソノミーを読む</a></p>
</div>

## このページの目的

このページは、リリースにおいて信頼できる選択肢となるOpenClawのサーフェスはどれか、またその判断をどのようなエビデンスが裏付けているか、という1つの問いに答えるために使用します。カバレッジは決定論的なQAエビデンスに基づき、品質と完全性はレビュー済みの成熟度スコアとして維持されます。

## 概要

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">68%</span>
      <span>成熟度スコア</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "68" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">アルファ</span>
      <span>品質 + 完全性</span>
      <span>カバレッジ：実験的 - 4%</span>
      <span>品質：アルファ - 64%</span>
      <span>完全性：ベータ - 71%</span>
    </div>
  </div>
</div>

カバレッジは意図的にエビデンスを重視しています。実装が存在するという理由だけで、その領域が「準備完了」になるわけではありません。カバレッジは成熟度スコアの入力値ではありませんが、OpenClawは成熟した安定版以上の機能について、エンドツーエンドのカバレッジを長期的に90%超に維持することを目指しています。

## スコア帯

<div className="maturity-band-list">
  <div className="maturity-band maturity-band-experimental"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-experimental">実験的</span></span><span>0-50%</span></div>
  <div className="maturity-band maturity-band-alpha"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-alpha">アルファ</span></span><span>50-70%</span></div>
  <div className="maturity-band maturity-band-beta"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-beta">ベータ</span></span><span>70-80%</span></div>
  <div className="maturity-band maturity-band-stable"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-stable">安定版</span></span><span>80-95%</span></div>
  <div className="maturity-band maturity-band-clawesome"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-clawesome">Clawesome</span></span><span>95-100%</span></div>
</div>

## サーフェスエクスプローラー

<a id="surface-explorer" />

サーフェスは、成熟度レベル、完全性、品質の順に並んでいます。リリース準備が整った選択肢を簡単に比較できるよう、各行にLTSサポートも併記されています。

  <Tabs>
  <Tab title="すべてのサーフェス">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>サーフェス</span><span>カバレッジ</span><span>品質</span><span>完全性</span><span>サポート</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定版</span></span><span>7領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">一部対応 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Gatewayランタイム</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定版</span></span><span>13領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">一部対応 - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Linux Gatewayホスト</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定版</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ版</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">一部対応 - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">macOS Gatewayホスト</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定版</span></span><span>7領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ版</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定版</span></span><span>6領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ版</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">一部対応 - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#android-app"><span className="maturity-surface-title">Androidアプリ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定版</span></span><span>7領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#ios-app"><span className="maturity-surface-title">iOSアプリ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定版</span></span><span>8領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">エージェントランタイム</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>9領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">セッション、メモリ、コンテキストエンジン</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>9領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">チャネルフレームワーク</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>8領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">ブラウザ自動化、実行、サンドボックスツール</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>3領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#observability"><span className="maturity-surface-title">可観測性</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">OpenAIおよびCodexのプロバイダーパス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">一部対応 - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Gateway Web アプリ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>6領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Web 検索ツール</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>4領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugin</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>9領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">一部対応 - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">セキュリティ、認証、ペアリング、シークレット</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>6領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">一部対応 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">自動化：Cron、フック、タスク、ポーリング</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>6領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">DockerおよびPodmanホスティング</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>4領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">WSL2 経由の Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>6領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">試験的</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分対応 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi および小型 Linux デバイス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>4領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">試験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Anthropic プロバイダーパス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">試験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">試験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">完全対応 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">試験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">完全対応 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Google プロバイダーパス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">試験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessageとBlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">macOSコンパニオンアプリ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>8領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">OpenRouterプロバイダーパス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>4領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">メディア理解とメディア生成</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>6領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">画像、動画、音楽の生成ツール</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">ローカルモデルプロバイダー：Ollama、vLLM、SGLang、LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">ロングテールのホステッドプロバイダー</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>3領域</span></span></a>
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
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#native-windows"><span className="maturity-surface-title">ネイティブWindows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>4領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">一部 - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>4領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Kubernetesホスティング</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>4領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu、QQ Bot、WeChat、Yuanbao、Zalo、Zalo Personal、地域別チャンネル</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>4領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost、LINE、IRC、Nextcloud Talk、Nostr、Twitch、Tlon、Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>4領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw アプリ SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>6領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Nix インストールパス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>実験的</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">音声通話チャンネル</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>実験的</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">watchOS コンパニオンサーフェス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>実験的</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Linux コンパニオンアプリ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>計画中</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">Windows ネイティブコンパニオンアプリ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>計画中</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="コア">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>領域</span><span>カバレッジ</span><span>品質</span><span>完全性</span><span>サポート</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定版</span></span><span>7領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">一部対応 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Gatewayランタイム</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定版</span></span><span>13領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">一部対応 - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">エージェントランタイム</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ版</span></span><span>9領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">一部対応 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">セッション、メモリ、コンテキストエンジン</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ版</span></span><span>9領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ版</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">一部対応 - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">チャネルフレームワーク</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ版</span></span><span>8領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ版</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">一部対応 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#observability"><span className="maturity-surface-title">オブザーバビリティ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ版</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ版</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">一部対応 - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Gateway Webアプリ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>6領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugin</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>9領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">セキュリティ、認証、ペアリング、シークレット</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>6領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">自動化：Cron、フック、タスク、ポーリング</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>6領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">メディア理解とメディア生成</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>6領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
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
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>4領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw App SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>6領域</span></span></a>
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
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Linux Gatewayホスト</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定版</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">macOS Gatewayホスト</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定版</span></span><span>7領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#android-app"><span className="maturity-surface-title">Androidアプリ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定版</span></span><span>7領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#ios-app"><span className="maturity-surface-title">iOSアプリ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定版</span></span><span>8領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">DockerおよびPodmanでのホスティング</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ版</span></span><span>4領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ版</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">WSL2経由のWindows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ版</span></span><span>6領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ版</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Piおよび小型Linuxデバイス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ版</span></span><span>4領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ版</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ版</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">macOSコンパニオンアプリ</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ版</span></span><span>8領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ版</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ版</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#native-windows"><span className="maturity-surface-title">ネイティブWindows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ版</span></span><span>4領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ版</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ版</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Kubernetesでのホスティング</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ版</span></span><span>4領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ版</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
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
  <Tab title="チャンネル">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>サーフェス</span><span>カバレッジ</span><span>品質</span><span>完全性</span><span>サポート</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>安定版</span></span><span>6 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">安定版</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">部分的 - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5 領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">完全 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">完全 - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessageとBlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
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
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu、QQ Bot、WeChat、Yuanbao、Zalo、Zalo Personal、地域別チャネル</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>4領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost、LINE、IRC、Nextcloud Talk、Nostr、Twitch、Tlon、Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>4領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">音声通話チャネル</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>実験的</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="プロバイダーとツール">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>対象領域</span><span>カバレッジ</span><span>品質</span><span>完全性</span><span>サポート</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">ブラウザー自動化、exec、サンドボックスツール</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>3領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">一部対応 - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">OpenAIとCodexのプロバイダーパス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">一部対応 - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">ウェブ検索ツール</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>4領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Anthropicプロバイダーパス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Googleプロバイダーパス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">OpenRouterプロバイダーパス</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>ベータ</span></span><span>4領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">ベータ</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">画像、動画、音楽の生成ツール</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">ローカルモデルプロバイダー：Ollama、vLLM、SGLang、LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>5領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/ja-JP/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">ロングテールのホステッドプロバイダー</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>アルファ</span></span><span>3領域</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">カバレッジ</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">実験的</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">品質</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">完全性</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">アルファ</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">なし</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## QA エビデンスの概要

以下のチェックは、QA プロファイルのエビデンスによってスコアカードのどの領域が検証されたかを示します。

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">分類体系全体の検証</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>96 件のチェック - 94 件成功、2 件ブロック</span>
    <span>281 領域中 0 件 (0%) - 1675 機能中 20 件 (1.2%) - 1665 カバレッジ ID 中 77 件 (4.6%)</span>
  </div>
</div>

### 領域別の準備状況

各カテゴリのエビデンスの状態を確認するには、対象領域を開きます。一覧は折りたたまれたままなので、ページ全体を一目で把握できます。

<AccordionGroup>
  <Accordion title="エージェントランタイム - 9 領域">
    <p className="maturity-readiness-summary">8 件は一部レビュー済み / 1 件は要レビュー</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">エージェントターンの実行</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 分類体系全体の検証</span>
        </div>
        <span>3 件中 0 件 (0%) / 24 件中 7 件 (29.2%)</span>
        <span>17 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">外部ランタイムとサブエージェント</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 分類体系全体の検証</span>
        </div>
        <span>4 件中 0 件 (0%) / 10 件中 3 件 (30%)</span>
        <span>7 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ホステッドプロバイダーの実行</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 分類体系全体の検証</span>
        </div>
        <span>5 件中 1 件 (20%) / 5 件中 1 件 (20%)</span>
        <span>4 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ローカルおよびセルフホステッドプロバイダー</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 分類体系全体の検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">モデルとランタイムの選択</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 分類体系全体の検証</span>
        </div>
        <span>4 件中 0 件 (0%) / 8 件中 2 件 (25%)</span>
        <span>6 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロバイダー認証</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 分類体系全体の検証</span>
        </div>
        <span>10 件中 0 件 (0%) / 17 件中 4 件 (23.5%)</span>
        <span>13 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ストリーミングと進捗</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 分類体系全体の検証</span>
        </div>
        <span>2 件中 0 件 (0%) / 9 件中 5 件 (55.6%)</span>
        <span>4 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ツール呼び出しとレスポンス処理</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 分類体系全体の検証</span>
        </div>
        <span>3 件中 0 件 (0%) / 23 件中 15 件 (65.2%)</span>
        <span>8 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ツール実行制御</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 分類体系全体の検証</span>
        </div>
        <span>6 件中 0 件 (0%) / 12 件中 6 件 (50%)</span>
        <span>6 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Android アプリ - 7 領域">
    <p className="maturity-readiness-summary">7 件は要レビュー</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">接続設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 分類体系全体の検証</span>
        </div>
        <span>1 件中 0 件 (0%) / 1 件中 0 件 (0%)</span>
        <span>1 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">デバイスランタイム</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 分類体系全体の検証</span>
        </div>
        <span>2 件中 0 件 (0%) / 2 件中 0 件 (0%)</span>
        <span>2 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">配布</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 分類体系全体の検証</span>
        </div>
        <span>3 件中 0 件 (0%) / 3 件中 0 件 (0%)</span>
        <span>3 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアキャプチャ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 分類体系全体の検証</span>
        </div>
        <span>1 件中 0 件 (0%) / 1 件中 0 件 (0%)</span>
        <span>1 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">モバイルチャット</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 分類体系全体の検証</span>
        </div>
        <span>1 件中 0 件 (0%) / 1 件中 0 件 (0%)</span>
        <span>1 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 分類体系全体の検証</span>
        </div>
        <span>1 件中 0 件 (0%) / 1 件中 0 件 (0%)</span>
        <span>1 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">音声</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 分類体系全体の検証</span>
        </div>
        <span>1 件中 0 件 (0%) / 1 件中 0 件 (0%)</span>
        <span>1 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Anthropic プロバイダーパス - 5 領域">
    <p className="maturity-readiness-summary">5 件は要レビュー</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディア入力</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 分類体系全体の検証</span>
        </div>
        <span>4 件中 0 件 (0%) / 4 件中 0 件 (0%)</span>
        <span>4 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">モデルとランタイムの選択</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 分類体系全体の検証</span>
        </div>
        <span>10 件中 0 件 (0%) / 12 件中 0 件 (0%)</span>
        <span>12 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロンプトキャッシュとコンテキスト</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 分類体系全体の検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロバイダー認証と復旧</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 分類体系全体の検証</span>
        </div>
        <span>9 件中 0 件 (0%) / 9 件中 0 件 (0%)</span>
        <span>9 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">リクエスト転送とターンのセマンティクス</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 分類体系全体の検証</span>
        </div>
        <span>10 件中 0 件 (0%) / 10 件中 0 件 (0%)</span>
        <span>10 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="自動化: Cron、フック、タスク、ポーリング - 6領域">
    <p className="maturity-readiness-summary">5件はレビューが必要 / 1件は部分的にレビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">自動化フック</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>11件中0件 (0%) / 11件中0件 (0%)</span>
        <span>11件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">バックグラウンドタスクとフロー</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>10件中0件 (0%) / 10件中0件 (0%)</span>
        <span>10件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cronジョブ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>15件中0件 (0%) / 15件中0件 (0%)</span>
        <span>15件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">イベント受信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>15件中0件 (0%) / 15件中0件 (0%)</span>
        <span>15件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Heartbeat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - タクソノミー全体の検証</span>
        </div>
        <span>5件中0件 (0%) / 7件中1件 (14.3%)</span>
        <span>6件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ポーリング制御</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>10件中0件 (0%) / 10件中0件 (0%)</span>
        <span>10件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ブラウザー自動化、実行、サンドボックスツール - 3領域">
    <p className="maturity-readiness-summary">2件は部分的にレビュー済み / 1件はレビューが必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ブラウザー自動化</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - タクソノミー全体の検証</span>
        </div>
        <span>8件中1件 (12.5%) / 8件中1件 (12.5%)</span>
        <span>7件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">サンドボックスとツールのポリシー</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>6件中0件 (0%) / 6件中0件 (0%)</span>
        <span>6件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ツールの呼び出しと実行</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - タクソノミー全体の検証</span>
        </div>
        <span>6件中2件 (33.3%) / 8件中4件 (50%)</span>
        <span>4件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Gateway Webアプリ - 6領域">
    <p className="maturity-readiness-summary">3件はレビューが必要 / 3件は部分的にレビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ブラウザーアクセスと信頼</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ブラウザーのリアルタイム会話</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ブラウザーUI</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - タクソノミー全体の検証</span>
        </div>
        <span>10件中0件 (0%) / 12件中1件 (8.3%)</span>
        <span>11件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">構成</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">運用者コンソール</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - タクソノミー全体の検証</span>
        </div>
        <span>10件中0件 (0%) / 12件中1件 (8.3%)</span>
        <span>11件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChatの会話</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - タクソノミー全体の検証</span>
        </div>
        <span>15件中0件 (0%) / 20件中2件 (10%)</span>
        <span>18件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="チャネルフレームワーク - 8領域">
    <p className="maturity-readiness-summary">4件はレビューが必要 / 4件は部分的にレビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルアクション、コマンド、承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネル設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - タクソノミー全体の検証</span>
        </div>
        <span>5件中0件 (0%) / 7件中1件 (14.3%)</span>
        <span>6件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - タクソノミー全体の検証</span>
        </div>
        <span>10件中0件 (0%) / 27件中5件 (18.5%)</span>
        <span>22件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">グループスレッドと常設ルームの動作</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - タクソノミー全体の検証</span>
        </div>
        <span>5件中0件 (0%) / 11件中4件 (36.4%)</span>
        <span>7件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">受信アクセスとアイデンティティゲート</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディア添付ファイルとリッチチャネルデータ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>4件中0件 (0%) / 4件中0件 (0%)</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">送信配信と返信パイプライン</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - タクソノミー全体の検証</span>
        </div>
        <span>4件中0件 (0%) / 21件中8件 (38.1%)</span>
        <span>13件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ステータス、健全性、運用者制御</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>4件中0件 (0%) / 6件中0件 (0%)</span>
        <span>6件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub - 4領域">
    <p className="maturity-readiness-summary">4件がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">カタログ探索</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">互換性と信頼性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>12件中0件 (0%) / 12件中0件 (0%)</span>
        <span>12件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pluginのライフサイクルと健全性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>26件中0件 (0%) / 26件中0件 (0%)</span>
        <span>26件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">公開</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>7件中0件 (0%) / 7件中0件 (0%)</span>
        <span>7件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="CLI - 7領域">
    <p className="maturity-readiness-summary">5件がレビュー必要 / 2件が一部レビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLIの可観測性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLIのセットアップ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 全分類体系の検証</span>
        </div>
        <span>6件中1件 (16.7%) / 6件中1件 (16.7%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">診断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>10件中0件 (0%) / 10件中0件 (0%)</span>
        <span>10件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gatewayサービス管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 全分類体系の検証</span>
        </div>
        <span>5件中0件 (0%) / 7件中1件 (14.3%)</span>
        <span>6件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">オンボーディングと認証のセットアップ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pluginとチャンネルのセットアップ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">更新とアップグレード</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord - 6領域">
    <p className="maturity-readiness-summary">6件がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスとアイデンティティ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>6件中0件 (0%) / 6件中0件 (0%)</span>
        <span>6件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャンネルのセットアップと運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>10件中0件 (0%) / 10件中0件 (0%)</span>
        <span>10件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>12件中0件 (0%) / 12件中0件 (0%)</span>
        <span>12件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>1件中0件 (0%) / 1件中0件 (0%)</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブコントロールと承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">リアルタイム音声と通話</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="DockerとPodmanによるホスティング - 4領域">
    <p className="maturity-readiness-summary">3件がレビュー必要 / 1件が一部レビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">エージェントのサンドボックスとツール</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>3件中0件 (0%) / 3件中0件 (0%)</span>
        <span>3件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">コンテナ運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>11件中0件 (0%) / 11件中0件 (0%)</span>
        <span>11件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">コンテナのセットアップ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>6件中0件 (0%) / 6件中0件 (0%)</span>
        <span>6件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">イメージのリリースと検証</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 全分類体系の検証</span>
        </div>
        <span>5件中1件 (20%) / 7件中2件 (28.6%)</span>
        <span>5件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu、QQ Bot、WeChat、Yuanbao、Zalo、Zalo Personal、地域別チャンネル - 4領域">
    <p className="maturity-readiness-summary">4領域がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスとアイデンティティ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系全体の検証</span>
        </div>
        <span>1件中0件（0%） / 1件中0件（0%）</span>
        <span>機能ギャップ1件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャンネルのセットアップと運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系全体の検証</span>
        </div>
        <span>6件中0件（0%） / 6件中0件（0%）</span>
        <span>機能ギャップ6件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系全体の検証</span>
        </div>
        <span>1件中0件（0%） / 1件中0件（0%）</span>
        <span>機能ギャップ1件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系全体の検証</span>
        </div>
        <span>1件中0件（0%） / 1件中0件（0%）</span>
        <span>機能ギャップ1件</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Gatewayランタイム - 13領域">
    <p className="maturity-readiness-summary">9領域がレビュー必要 / 4領域が一部レビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">承認とリモート実行</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系全体の検証</span>
        </div>
        <span>6件中0件（0%） / 6件中0件（0%）</span>
        <span>機能ギャップ6件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">デバイス認証とペアリング</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系全体の検証</span>
        </div>
        <span>10件中0件（0%） / 10件中0件（0%）</span>
        <span>機能ギャップ10件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gatewayのライフサイクル</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 分類体系全体の検証</span>
        </div>
        <span>7件中0件（0%） / 12件中4件（33.3%）</span>
        <span>機能ギャップ8件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway RPC APIとイベント</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 分類体系全体の検証</span>
        </div>
        <span>20件中0件（0%） / 22件中2件（9.1%）</span>
        <span>機能ギャップ20件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">正常性、診断、修復</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系全体の検証</span>
        </div>
        <span>7件中0件（0%） / 7件中0件（0%）</span>
        <span>機能ギャップ7件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ホスト型Webサーフェス</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系全体の検証</span>
        </div>
        <span>4件中0件（0%） / 4件中0件（0%）</span>
        <span>機能ギャップ4件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">HTTP API</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 分類体系全体の検証</span>
        </div>
        <span>4件中1件（25%） / 4件中1件（25%）</span>
        <span>機能ギャップ3件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネットワークアクセスと検出</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系全体の検証</span>
        </div>
        <span>6件中0件（0%） / 6件中0件（0%）</span>
        <span>機能ギャップ6件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Nodeとリモート機能</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系全体の検証</span>
        </div>
        <span>8件中0件（0%） / 8件中0件（0%）</span>
        <span>機能ギャップ8件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロトコル互換性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系全体の検証</span>
        </div>
        <span>7件中0件（0%） / 7件中0件（0%）</span>
        <span>機能ギャップ7件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ロールと権限</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系全体の検証</span>
        </div>
        <span>5件中0件（0%） / 5件中0件（0%）</span>
        <span>機能ギャップ5件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">セキュリティ制御</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系全体の検証</span>
        </div>
        <span>6件中0件（0%） / 6件中0件（0%）</span>
        <span>機能ギャップ6件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebSocket接続</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 分類体系全体の検証</span>
        </div>
        <span>8件中1件（12.5%） / 8件中1件（12.5%）</span>
        <span>機能ギャップ7件</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat - 5領域">
    <p className="maturity-readiness-summary">5領域がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスとアイデンティティ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系全体の検証</span>
        </div>
        <span>11件中0件（0%） / 11件中0件（0%）</span>
        <span>機能ギャップ11件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャンネルのセットアップと運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系全体の検証</span>
        </div>
        <span>16件中0件（0%） / 16件中0件（0%）</span>
        <span>機能ギャップ16件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系全体の検証</span>
        </div>
        <span>1件中0件（0%） / 1件中0件（0%）</span>
        <span>機能ギャップ1件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系全体の検証</span>
        </div>
        <span>1件中0件（0%） / 1件中0件（0%）</span>
        <span>機能ギャップ1件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブ制御と承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系全体の検証</span>
        </div>
        <span>16件中0件（0%） / 16件中0件（0%）</span>
        <span>機能ギャップ16件</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Googleプロバイダーの経路 - 5領域">
    <p className="maturity-readiness-summary">5領域がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gemini直接ランタイム</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>9件中0件（0%） / 9件中0件（0%）</span>
        <span>9件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディア、検索、リアルタイム</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>10件中0件（0%） / 10件中0件（0%）</span>
        <span>10件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">モデルルーティングとエンドポイント</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>10件中0件（0%） / 10件中0件（0%）</span>
        <span>10件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロンプトキャッシュ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>5件中0件（0%） / 5件中0件（0%）</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロバイダーのセットアップと認証情報</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>10件中0件（0%） / 10件中0件（0%）</span>
        <span>10件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="画像、動画、音楽の生成ツール - 5領域">
    <p className="maturity-readiness-summary">5領域がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">画像生成</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>9件中0件（0%） / 9件中0件（0%）</span>
        <span>9件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアルーティングと検出</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>4件中0件（0%） / 4件中0件（0%）</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">音楽生成</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>6件中0件（0%） / 6件中0件（0%）</span>
        <span>6件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">タスクのライフサイクルと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>12件中0件（0%） / 12件中0件（0%）</span>
        <span>12件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">動画生成</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>11件中0件（0%） / 11件中0件（0%）</span>
        <span>11件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessageとBlueBubbles - 5領域">
    <p className="maturity-readiness-summary">5領域がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスと識別情報</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>6件中0件（0%） / 6件中0件（0%）</span>
        <span>6件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルのセットアップと運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>11件中0件（0%） / 11件中0件（0%）</span>
        <span>11件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>4件中0件（0%） / 4件中0件（0%）</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>7件中0件（0%） / 7件中0件（0%）</span>
        <span>7件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブコントロールと承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>3件中0件（0%） / 3件中0件（0%）</span>
        <span>3件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iOSアプリ - 8領域">
    <p className="maturity-readiness-summary">8領域がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">キャンバスと画面</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>1件中0件（0%） / 1件中0件（0%）</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャットとセッション</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>1件中0件（0%） / 1件中0件（0%）</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">デバイスコマンド</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>2件中0件（0%） / 2件中0件（0%）</span>
        <span>2件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">配布</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>1件中0件（0%） / 1件中0件（0%）</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gatewayのセットアップと診断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>7件中0件（0%） / 7件中0件（0%）</span>
        <span>7件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアと共有</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>1件中0件（0%） / 1件中0件（0%）</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">通知とバックグラウンド処理</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>1件中0件（0%） / 1件中0件（0%）</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">音声</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>1件中0件（0%） / 1件中0件（0%）</span>
        <span>1件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Kubernetes ホスティング - 4領域">
    <p className="maturity-readiness-summary">4領域が要レビュー</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスと公開</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 全分類体系の検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">クラスターのライフサイクル</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 全分類体系の検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">構成とシークレット</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 全分類体系の検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">デプロイのセットアップ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 全分類体系の検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Linux コンパニオンアプリ - 5領域">
    <p className="maturity-readiness-summary">5領域が要レビュー</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アプリの配布</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 全分類体系の検証</span>
        </div>
        <span>3件中0件 (0%) / 3件中0件 (0%)</span>
        <span>3件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャットとセッション</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 全分類体系の検証</span>
        </div>
        <span>3件中0件 (0%) / 3件中0件 (0%)</span>
        <span>3件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">デスクトップ機能</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 全分類体系の検証</span>
        </div>
        <span>9件中0件 (0%) / 9件中0件 (0%)</span>
        <span>9件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 接続</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 全分類体系の検証</span>
        </div>
        <span>4件中0件 (0%) / 4件中0件 (0%)</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ステータスと診断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 全分類体系の検証</span>
        </div>
        <span>7件中0件 (0%) / 7件中0件 (0%)</span>
        <span>7件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Linux Gateway ホスト - 5領域">
    <p className="maturity-readiness-summary">5領域が要レビュー</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">デプロイ先</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 全分類体系の検証</span>
        </div>
        <span>3件中0件 (0%) / 3件中0件 (0%)</span>
        <span>3件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">診断と修復</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 全分類体系の検証</span>
        </div>
        <span>4件中0件 (0%) / 4件中0件 (0%)</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway ランタイムとサービス制御</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 全分類体系の検証</span>
        </div>
        <span>6件中0件 (0%) / 6件中0件 (0%)</span>
        <span>6件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ホストのセットアップと更新</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 全分類体系の検証</span>
        </div>
        <span>4件中0件 (0%) / 4件中0件 (0%)</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">リモートアクセスとセキュリティ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 全分類体系の検証</span>
        </div>
        <span>6件中0件 (0%) / 6件中0件 (0%)</span>
        <span>6件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ローカルモデルプロバイダー: Ollama、vLLM、SGLang、LM Studio - 5領域">
    <p className="maturity-readiness-summary">5領域が要レビュー</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ローカルメモリと埋め込み</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 全分類体系の検証</span>
        </div>
        <span>5件中0件 (0%) / 5件中0件 (0%)</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブプロバイダー Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 全分類体系の検証</span>
        </div>
        <span>10件中0件 (0%) / 10件中0件 (0%)</span>
        <span>10件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネットワークの安全性とプロンプト制御</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 全分類体系の検証</span>
        </div>
        <span>2件中0件 (0%) / 2件中0件 (0%)</span>
        <span>2件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">OpenAI 互換ランタイムとの互換性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 全分類体系の検証</span>
        </div>
        <span>8件中0件 (0%) / 8件中0件 (0%)</span>
        <span>8件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロバイダーのセットアップ、ライフサイクル、診断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 全分類体系の検証</span>
        </div>
        <span>12件中0件 (0%) / 12件中0件 (0%)</span>
        <span>12件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ロングテール型ホステッドプロバイダー - 3領域">
    <p className="maturity-readiness-summary">3領域が要レビュー</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ホステッド LLM プロバイダー</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 全分類体系の検証</span>
        </div>
        <span>12件中0件 (0%) / 12件中0件 (0%)</span>
        <span>12件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ホステッドメディアプロバイダー</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 全分類体系の検証</span>
        </div>
        <span>8件中0件 (0%) / 8件中0件 (0%)</span>
        <span>8件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロバイダー運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">要レビュー - 全分類体系の検証</span>
        </div>
        <span>12件中0件 (0%) / 12件中0件 (0%)</span>
        <span>12件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="macOS コンパニオンアプリ - 8領域">
    <p className="maturity-readiness-summary">8領域がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系の完全検証</span>
        </div>
        <span>4件中0件（0%）/ 4件中0件（0%）</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ローカルセットアップ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系の完全検証</span>
        </div>
        <span>7件中0件（0%）/ 7件中0件（0%）</span>
        <span>7件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブ機能</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系の完全検証</span>
        </div>
        <span>5件中0件（0%）/ 5件中0件（0%）</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">リモート接続</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系の完全検証</span>
        </div>
        <span>3件中0件（0%）/ 3件中0件（0%）</span>
        <span>3件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">リモートWebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系の完全検証</span>
        </div>
        <span>5件中0件（0%）/ 5件中0件（0%）</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ステータスと設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系の完全検証</span>
        </div>
        <span>5件中0件（0%）/ 5件中0件（0%）</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">音声と会話</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系の完全検証</span>
        </div>
        <span>3件中0件（0%）/ 3件中0件（0%）</span>
        <span>3件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系の完全検証</span>
        </div>
        <span>3件中0件（0%）/ 3件中0件（0%）</span>
        <span>3件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="macOS Gatewayホスト - 7領域">
    <p className="maturity-readiness-summary">7領域がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLIセットアップ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系の完全検証</span>
        </div>
        <span>4件中0件（0%）/ 4件中0件（0%）</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">診断と可観測性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系の完全検証</span>
        </div>
        <span>4件中0件（0%）/ 4件中0件（0%）</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gatewayサービスのライフサイクル</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系の完全検証</span>
        </div>
        <span>10件中0件（0%）/ 10件中0件（0%）</span>
        <span>10件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ローカルGateway連携</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系の完全検証</span>
        </div>
        <span>9件中0件（0%）/ 9件中0件（0%）</span>
        <span>9件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">権限とネイティブ機能</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系の完全検証</span>
        </div>
        <span>4件中0件（0%）/ 4件中0件（0%）</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロファイルと分離</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系の完全検証</span>
        </div>
        <span>5件中0件（0%）/ 5件中0件（0%）</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">リモートGatewayモード</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系の完全検証</span>
        </div>
        <span>5件中0件（0%）/ 5件中0件（0%）</span>
        <span>5件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Matrix - 6領域">
    <p className="maturity-readiness-summary">6領域がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスとアイデンティティ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系の完全検証</span>
        </div>
        <span>7件中0件（0%）/ 7件中0件（0%）</span>
        <span>7件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルのセットアップと運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系の完全検証</span>
        </div>
        <span>5件中0件（0%）/ 5件中0件（0%）</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系の完全検証</span>
        </div>
        <span>1件中0件（0%）/ 1件中0件（0%）</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">暗号化と検証</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系の完全検証</span>
        </div>
        <span>3件中0件（0%）/ 3件中0件（0%）</span>
        <span>3件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系の完全検証</span>
        </div>
        <span>1件中0件（0%）/ 1件中0件（0%）</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブ制御と承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 分類体系の完全検証</span>
        </div>
        <span>6件中0件（0%）/ 6件中0件（0%）</span>
        <span>6件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mattermost、LINE、IRC、Nextcloud Talk、Nostr、Twitch、Tlon、Synology Chat - 4領域">
    <p className="maturity-readiness-summary">4件がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスとアイデンティティ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>1件中0件（0%） / 1件中0件（0%）</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルのセットアップと運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>1件中0件（0%） / 1件中0件（0%）</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>1件中0件（0%） / 1件中0件（0%）</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>1件中0件（0%） / 1件中0件（0%）</span>
        <span>1件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="メディア理解とメディア生成 - 6領域">
    <p className="maturity-readiness-summary">4件がレビュー必要 / 2件が一部レビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルメディアの処理</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>5件中0件（0%） / 5件中0件（0%）</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディア設定</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>1件中0件（0%） / 1件中0件（0%）</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディア生成</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 全分類体系の検証</span>
        </div>
        <span>17件中1件（5.9%） / 19件中1件（5.3%）</span>
        <span>18件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアの取り込みとアクセス</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>8件中0件（0%） / 8件中0件（0%）</span>
        <span>8件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディア理解</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 全分類体系の検証</span>
        </div>
        <span>12件中0件（0%） / 14件中1件（7.1%）</span>
        <span>13件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">音声合成の配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>2件中0件（0%） / 2件中0件（0%）</span>
        <span>2件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams - 5領域">
    <p className="maturity-readiness-summary">5件がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスとアイデンティティ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>9件中0件（0%） / 9件中0件（0%）</span>
        <span>9件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルのセットアップと運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>9件中0件（0%） / 9件中0件（0%）</span>
        <span>9件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>5件中0件（0%） / 5件中0件（0%）</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>5件中0件（0%） / 5件中0件（0%）</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブコントロールと承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>5件中0件（0%） / 5件中0件（0%）</span>
        <span>5件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ネイティブWindows - 4領域">
    <p className="maturity-readiness-summary">4件がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>9件中0件（0%） / 9件中0件（0%）</span>
        <span>9件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>11件中0件（0%） / 11件中0件（0%）</span>
        <span>11件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネットワーク</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>4件中0件（0%） / 4件中0件（0%）</span>
        <span>4件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アップデート</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>4件中0件（0%） / 4件中0件（0%）</span>
        <span>4件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ネイティブ Windows コンパニオンアプリ - 5 領域">
    <p className="maturity-readiness-summary">5 件がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャットセッション</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>2 件中 0 件 (0%) / 2 件中 0 件 (0%)</span>
        <span>機能ギャップ 2 件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">デスクトップツールと権限</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>10 件中 0 件 (0%) / 10 件中 0 件 (0%)</span>
        <span>機能ギャップ 10 件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 接続</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>3 件中 0 件 (0%) / 3 件中 0 件 (0%)</span>
        <span>機能ギャップ 3 件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">インストールと更新</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>4 件中 0 件 (0%) / 4 件中 0 件 (0%)</span>
        <span>機能ギャップ 4 件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">状態と修復</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>機能ギャップ 5 件</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Nix インストールパス - 5 領域">
    <p className="maturity-readiness-summary">5 件がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">有効化とアプリの UX</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>7 件中 0 件 (0%) / 7 件中 0 件 (0%)</span>
        <span>機能ギャップ 7 件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">設定と状態</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>7 件中 0 件 (0%) / 7 件中 0 件 (0%)</span>
        <span>機能ギャップ 7 件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">インストールの引き継ぎ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>4 件中 0 件 (0%) / 4 件中 0 件 (0%)</span>
        <span>機能ギャップ 4 件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin のライフサイクル</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>4 件中 0 件 (0%) / 4 件中 0 件 (0%)</span>
        <span>機能ギャップ 4 件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">サービスランタイムと保護機構</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>8 件中 0 件 (0%) / 8 件中 0 件 (0%)</span>
        <span>機能ギャップ 8 件</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenAI および Codex プロバイダーパス - 5 領域">
    <p className="maturity-readiness-summary">2 件がレビュー必要 / 3 件が部分的にレビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">画像およびマルチモーダル入力</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>2 件中 0 件 (0%) / 2 件中 0 件 (0%)</span>
        <span>機能ギャップ 2 件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">モデルと認証</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - 完全な分類体系の検証</span>
        </div>
        <span>6 件中 1 件 (16.7%) / 9 件中 4 件 (44.4%)</span>
        <span>機能ギャップ 5 件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブ Codex ハーネス</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - 完全な分類体系の検証</span>
        </div>
        <span>2 件中 0 件 (0%) / 9 件中 4 件 (44.4%)</span>
        <span>機能ギャップ 5 件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">レスポンスとツールの互換性</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - 完全な分類体系の検証</span>
        </div>
        <span>4 件中 1 件 (25%) / 5 件中 2 件 (40%)</span>
        <span>機能ギャップ 3 件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">音声とリアルタイム音声</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>2 件中 0 件 (0%) / 2 件中 0 件 (0%)</span>
        <span>機能ギャップ 2 件</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenClaw App SDK - 6 領域">
    <p className="maturity-readiness-summary">5 件がレビュー必要 / 1 件が部分的にレビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">エージェントとの会話</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>6 件中 0 件 (0%) / 6 件中 0 件 (0%)</span>
        <span>機能ギャップ 6 件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">クライアント API</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>4 件中 0 件 (0%) / 4 件中 0 件 (0%)</span>
        <span>機能ギャップ 4 件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">互換性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>機能ギャップ 5 件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">イベントと承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>機能ギャップ 5 件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway へのアクセス</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>機能ギャップ 5 件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">リソースヘルパー</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分的にレビュー済み - 完全な分類体系の検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 6 件中 1 件 (16.7%)</span>
        <span>機能ギャップ 5 件</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenRouter プロバイダーパス - 4 領域">
    <p className="maturity-readiness-summary">4 件がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャットランタイムと正規化</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - タクソノミー全体の検証</span>
        </div>
        <span>15 件中 0 件 (0%) / 15 件中 0 件 (0%)</span>
        <span>15 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディア生成と音声</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - タクソノミー全体の検証</span>
        </div>
        <span>7 件中 0 件 (0%) / 7 件中 0 件 (0%)</span>
        <span>7 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロバイダーの復旧と診断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - タクソノミー全体の検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロバイダーのセットアップと認証</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - タクソノミー全体の検証</span>
        </div>
        <span>14 件中 0 件 (0%) / 14 件中 0 件 (0%)</span>
        <span>14 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Plugin - 9 領域">
    <p className="maturity-readiness-summary">6 件がレビュー必要 / 3 件が部分レビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin の作成とパッケージ化</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - タクソノミー全体の検証</span>
        </div>
        <span>8 件中 0 件 (0%) / 8 件中 0 件 (0%)</span>
        <span>8 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">同梱 Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - タクソノミー全体の検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - タクソノミー全体の検証</span>
        </div>
        <span>6 件中 0 件 (0%) / 6 件中 0 件 (0%)</span>
        <span>6 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネル Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - タクソノミー全体の検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin のインストールと実行</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分レビュー済み - タクソノミー全体の検証</span>
        </div>
        <span>6 件中 0 件 (0%) / 20 件中 7 件 (35%)</span>
        <span>13 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin の承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - タクソノミー全体の検証</span>
        </div>
        <span>6 件中 0 件 (0%) / 6 件中 0 件 (0%)</span>
        <span>6 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">プロバイダーとツールの Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分レビュー済み - タクソノミー全体の検証</span>
        </div>
        <span>6 件中 1 件 (16.7%) / 21 件中 9 件 (42.9%)</span>
        <span>12 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin の公開</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - タクソノミー全体の検証</span>
        </div>
        <span>6 件中 0 件 (0%) / 6 件中 0 件 (0%)</span>
        <span>6 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin のテスト</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分レビュー済み - タクソノミー全体の検証</span>
        </div>
        <span>6 件中 0 件 (0%) / 11 件中 3 件 (27.3%)</span>
        <span>8 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi と小型 Linux デバイス - 4 領域">
    <p className="maturity-readiness-summary">4 件がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway ランタイム</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - タクソノミー全体の検証</span>
        </div>
        <span>10 件中 0 件 (0%) / 10 件中 0 件 (0%)</span>
        <span>10 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">パフォーマンスと診断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - タクソノミー全体の検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">リモートアクセスと認証</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - タクソノミー全体の検証</span>
        </div>
        <span>9 件中 0 件 (0%) / 9 件中 0 件 (0%)</span>
        <span>9 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">セットアップと互換性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - タクソノミー全体の検証</span>
        </div>
        <span>12 件中 0 件 (0%) / 12 件中 0 件 (0%)</span>
        <span>12 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="セキュリティ、認証、ペアリング、シークレット - 6 領域">
    <p className="maturity-readiness-summary">2 件が部分レビュー済み / 4 件がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">承認ポリシーとツールの安全対策</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分レビュー済み - タクソノミー全体の検証</span>
        </div>
        <span>2 件中 0 件 (0%) / 6 件中 3 件 (50%)</span>
        <span>3 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルのアクセス制御</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - タクソノミー全体の検証</span>
        </div>
        <span>3 件中 0 件 (0%) / 3 件中 0 件 (0%)</span>
        <span>3 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">認証情報とシークレットの衛生管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分レビュー済み - タクソノミー全体の検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 11 件中 5 件 (45.5%)</span>
        <span>6 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">デバイスと Node のペアリング</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - タクソノミー全体の検証</span>
        </div>
        <span>11 件中 0 件 (0%) / 11 件中 0 件 (0%)</span>
        <span>11 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway 認証とリモートアクセス</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - タクソノミー全体の検証</span>
        </div>
        <span>9 件中 0 件 (0%) / 9 件中 0 件 (0%)</span>
        <span>9 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin の信頼性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - タクソノミー全体の検証</span>
        </div>
        <span>2 件中 0 件 (0%) / 2 件中 0 件 (0%)</span>
        <span>2 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="セッション、メモリ、コンテキストエンジン - 9領域">
    <p className="maturity-readiness-summary">2件がレビュー必要 / 7件が部分レビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLIセッションとトランスクリプトの管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>2件中0件（0%） / 2件中0件（0%）</span>
        <span>2件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">コンテキストエンジン</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分レビュー済み - 全分類体系の検証</span>
        </div>
        <span>2件中0件（0%） / 7件中4件（57.1%）</span>
        <span>3件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">コアプロンプトとコンテキスト</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分レビュー済み - 全分類体系の検証</span>
        </div>
        <span>2件中0件（0%） / 8件中3件（37.5%）</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">クライアント間の履歴とセッションの同等性</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分レビュー済み - 全分類体系の検証</span>
        </div>
        <span>2件中0件（0%） / 5件中2件（40%）</span>
        <span>3件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">診断、メンテナンス、復旧</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分レビュー済み - 全分類体系の検証</span>
        </div>
        <span>3件中0件（0%） / 10件中4件（40%）</span>
        <span>6件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メモリ</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分レビュー済み - 全分類体系の検証</span>
        </div>
        <span>5件中0件（0%） / 13件中6件（46.2%）</span>
        <span>7件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">セッションルーティング</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分レビュー済み - 全分類体系の検証</span>
        </div>
        <span>2件中0件（0%） / 4件中1件（25%）</span>
        <span>3件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">トークン管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">部分レビュー済み - 全分類体系の検証</span>
        </div>
        <span>3件中0件（0%） / 10件中2件（20%）</span>
        <span>8件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">トランスクリプトの永続化</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>2件中0件（0%） / 2件中0件（0%）</span>
        <span>2件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal - 5領域">
    <p className="maturity-readiness-summary">5件がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスとID</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>6件中0件（0%） / 6件中0件（0%）</span>
        <span>6件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルのセットアップと運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>7件中0件（0%） / 7件中0件（0%）</span>
        <span>7件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>1件中0件（0%） / 1件中0件（0%）</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>7件中0件（0%） / 7件中0件（0%）</span>
        <span>7件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブコントロールと承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>3件中0件（0%） / 3件中0件（0%）</span>
        <span>3件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack - 5領域">
    <p className="maturity-readiness-summary">5件がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスとID</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>1件中0件（0%） / 1件中0件（0%）</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルのセットアップと運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>10件中0件（0%） / 10件中0件（0%）</span>
        <span>10件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>5件中0件（0%） / 5件中0件（0%）</span>
        <span>5件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>1件中0件（0%） / 1件中0件（0%）</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブコントロールと承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>8件中0件（0%） / 8件中0件（0%）</span>
        <span>8件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram - 5領域">
    <p className="maturity-readiness-summary">5件がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスとID</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>10件中0件（0%） / 10件中0件（0%）</span>
        <span>10件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルのセットアップと運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>10件中0件（0%） / 10件中0件（0%）</span>
        <span>10件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>1件中0件（0%） / 1件中0件（0%）</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>1件中0件（0%） / 1件中0件（0%）</span>
        <span>1件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブコントロールと承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 全分類体系の検証</span>
        </div>
        <span>9件中0件（0%） / 9件中0件（0%）</span>
        <span>9件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="可観測性 - 5領域">
    <p className="maturity-readiness-summary">一部レビュー済み3件 / レビューが必要2件</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">診断情報の収集</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - タクソノミー全体の検証</span>
        </div>
        <span>8件中1件（12.5%）/ 10件中3件（30%）</span>
        <span>機能ギャップ7件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">健全性と修復</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - タクソノミー全体の検証</span>
        </div>
        <span>12件中1件（8.3%）/ 18件中5件（27.8%）</span>
        <span>機能ギャップ13件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ログ記録</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>5件中0件（0%）/ 5件中0件（0%）</span>
        <span>機能ギャップ5件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">セッション診断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>4件中0件（0%）/ 4件中0件（0%）</span>
        <span>機能ギャップ4件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">テレメトリのエクスポート</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - タクソノミー全体の検証</span>
        </div>
        <span>13件中1件（7.7%）/ 21件中7件（33.3%）</span>
        <span>機能ギャップ14件</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="TUI - 5領域">
    <p className="maturity-readiness-summary">レビューが必要5件</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">入力とコマンド</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>8件中0件（0%）/ 8件中0件（0%）</span>
        <span>機能ギャップ8件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ローカルシェルの実行</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>4件中0件（0%）/ 4件中0件（0%）</span>
        <span>機能ギャップ4件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">レンダリングと出力の安全性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>4件中0件（0%）/ 4件中0件（0%）</span>
        <span>機能ギャップ4件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ランタイムモード</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>14件中0件（0%）/ 14件中0件（0%）</span>
        <span>機能ギャップ14件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">セッション管理</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>3件中0件（0%）/ 3件中0件（0%）</span>
        <span>機能ギャップ3件</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="音声とリアルタイム会話 - 6領域">
    <p className="maturity-readiness-summary">レビューが必要6件</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブアプリでの会話</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>4件中0件（0%）/ 4件中0件（0%）</span>
        <span>機能ギャップ4件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">リアルタイム会話セッション</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>11件中0件（0%）/ 11件中0件（0%）</span>
        <span>機能ギャップ11件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">音声と文字起こし</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>5件中0件（0%）/ 5件中0件（0%）</span>
        <span>機能ギャップ5件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話の可観測性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>5件中0件（0%）/ 5件中0件（0%）</span>
        <span>機能ギャップ5件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話プロバイダー</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>7件中0件（0%）/ 7件中0件（0%）</span>
        <span>機能ギャップ7件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">音声によるウェイクアップとルーティング</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>4件中0件（0%）/ 4件中0件（0%）</span>
        <span>機能ギャップ4件</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="音声通話チャネル - 5領域">
    <p className="maturity-readiness-summary">レビューが必要5件</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスとアイデンティティ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>1件中0件（0%）/ 1件中0件（0%）</span>
        <span>機能ギャップ1件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルのセットアップと運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>2件中0件（0%）/ 2件中0件（0%）</span>
        <span>機能ギャップ2件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>1件中0件（0%）/ 1件中0件（0%）</span>
        <span>機能ギャップ1件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>2件中0件（0%）/ 2件中0件（0%）</span>
        <span>機能ギャップ2件</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">リアルタイム音声と通話</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビューが必要 - タクソノミー全体の検証</span>
        </div>
        <span>2件中0件（0%）/ 2件中0件（0%）</span>
        <span>機能ギャップ2件</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="watchOS コンパニオンサーフェス - 5 領域">
    <p className="maturity-readiness-summary">5 件がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">配信と復旧</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>7 件中 0 件 (0%) / 7 件中 0 件 (0%)</span>
        <span>7 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">配布とサポート</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>6 件中 0 件 (0%) / 6 件中 0 件 (0%)</span>
        <span>6 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">実行承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>3 件中 0 件 (0%) / 3 件中 0 件 (0%)</span>
        <span>3 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">通知と返信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>7 件中 0 件 (0%) / 7 件中 0 件 (0%)</span>
        <span>7 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Watch アプリの UI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>3 件中 0 件 (0%) / 3 件中 0 件 (0%)</span>
        <span>3 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ウェブ検索ツール - 4 領域">
    <p className="maturity-readiness-summary">2 件がレビュー必要 / 2 件が一部レビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネットワークの安全性</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>4 件中 0 件 (0%) / 4 件中 0 件 (0%)</span>
        <span>4 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">検索プロバイダー</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全な分類体系の検証</span>
        </div>
        <span>19 件中 2 件 (10.5%) / 19 件中 2 件 (10.5%)</span>
        <span>17 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">セットアップと診断</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>9 件中 0 件 (0%) / 9 件中 0 件 (0%)</span>
        <span>9 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ツールの可用性と取得</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全な分類体系の検証</span>
        </div>
        <span>11 件中 2 件 (18.2%) / 12 件中 3 件 (25%)</span>
        <span>9 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp - 5 領域">
    <p className="maturity-readiness-summary">5 件がレビュー必要</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">アクセスとアイデンティティ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>7 件中 0 件 (0%) / 7 件中 0 件 (0%)</span>
        <span>7 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">チャネルのセットアップと運用</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>5 件中 0 件 (0%) / 5 件中 0 件 (0%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">会話のルーティングと配信</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>4 件中 0 件 (0%) / 4 件中 0 件 (0%)</span>
        <span>4 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">メディアとリッチコンテンツ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>2 件中 0 件 (0%) / 2 件中 0 件 (0%)</span>
        <span>2 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ネイティブコントロールと承認</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>2 件中 0 件 (0%) / 2 件中 0 件 (0%)</span>
        <span>2 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WSL2 経由の Windows - 6 領域">
    <p className="maturity-readiness-summary">5 件がレビュー必要 / 1 件が一部レビュー済み</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>領域</span><span>機能 / カバレッジ ID</span><span>フォローアップ</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">ブラウザーとコントロール UI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>6 件中 0 件 (0%) / 6 件中 0 件 (0%)</span>
        <span>6 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>8 件中 0 件 (0%) / 8 件中 0 件 (0%)</span>
        <span>8 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">診断と修復</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">一部レビュー済み - 完全な分類体系の検証</span>
        </div>
        <span>6 件中 1 件 (16.7%) / 8 件中 3 件 (37.5%)</span>
        <span>5 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway へのアクセスと公開</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>11 件中 0 件 (0%) / 11 件中 0 件 (0%)</span>
        <span>11 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway サービスのライフサイクル</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>10 件中 0 件 (0%) / 10 件中 0 件 (0%)</span>
        <span>10 件の機能ギャップ</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WSL のセットアップ</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">レビュー必要 - 完全な分類体系の検証</span>
        </div>
        <span>6 件中 0 件 (0%) / 6 件中 0 件 (0%)</span>
        <span>6 件の機能ギャップ</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> 最終更新日: 2026-06-22
