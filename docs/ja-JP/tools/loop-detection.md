---
read_when:
- ユーザーから、agentがtool callを繰り返してスタックするという報告がある
- 反復call保護を調整する必要がある
- You are editing agent tool/runtime policies
summary: 反復するtool-callループを検出するguardrailを有効化して調整する方法
title: tool-loop検出
x-i18n:
  generated_at: '2026-04-24T05:25:42Z'
  refreshed_at: '2026-04-28T05:23:26Z'
  model: gpt-5.4
  provider: openai
  source_hash: 0f5824d511ec33eb1f46c77250cb779b5e3bd5b3e5f16fab9e6c0b67297f87df
  source_path: tools/loop-detection.md
  workflow: 15
---

OpenClawは、agentが反復するtool-callパターンでスタックするのを防げます。
このguardは**デフォルトでは無効**です。

厳しい設定では正当な反復callまでブロックする可能性があるため、必要な場所でのみ有効にしてください。

## これが存在する理由

- 進捗しない反復シーケンスを検出する。
- 高頻度のno-resultループ（同じtool、同じ入力、繰り返されるエラー）を検出する。
- 既知のpolling toolについて、特定の反復callパターンを検出する。

## 設定ブロック

グローバルデフォルト:

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

agentごとのoverride（任意）:

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### フィールドの動作

- `enabled`: マスタースイッチ。`false` の場合、loop detectionは一切実行されません。
- `historySize`: 解析のために保持する最近のtool call数。
- `warningThreshold`: パターンをwarning-onlyと分類する前のしきい値。
- `criticalThreshold`: 反復ループパターンをブロックするためのしきい値。
- `globalCircuitBreakerThreshold`: グローバルno-progress breakerのしきい値。
- `detectors.genericRepeat`: 同一tool + 同一paramsの反復パターンを検出します。
- `detectors.knownPollNoProgress`: 状態変化のない既知のpolling風パターンを検出します。
- `detectors.pingPong`: 交互に繰り返すping-pongパターンを検出します。

## 推奨セットアップ

- `enabled: true` から始め、その他はデフォルトのままにしてください。
- しきい値の順序は `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold` を維持してください。
- 誤検知が発生する場合:
  - `warningThreshold` および/または `criticalThreshold` を上げる
  - （必要なら）`globalCircuitBreakerThreshold` を上げる
  - 問題を起こしているdetectorだけを無効にする
  - 過去コンテキストをより厳しくしすぎないよう、`historySize` を減らす

## ログと期待される動作

ループが検出されると、OpenClawはloop eventを報告し、重大度に応じて次のtool-cycleをブロックまたは抑制します。
これにより、通常のtool accessを保ちながら、ユーザーを暴走したtoken消費やロックアップから守ります。

- まずwarningと一時的抑制を優先する。
- 反復する証拠が蓄積した場合にのみエスカレートする。

## 注記

- `tools.loopDetection` はagentレベルoverrideとマージされます。
- agentごとのconfigは、グローバル値を完全にoverrideまたは拡張します。
- configが存在しない場合、guardrailはオフのままです。

## 関連

- [Exec approvals](/ja-JP/tools/exec-approvals)
- [Thinking levels](/ja-JP/tools/thinking)
- [Sub-agents](/ja-JP/tools/subagents)
