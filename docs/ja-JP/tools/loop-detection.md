---
read_when:
    - ユーザーから、エージェントがツール呼び出しを繰り返して抜け出せなくなるという報告があります
    - 反復呼び出し保護を調整する必要があります
    - エージェントのツール/ランタイムポリシーを編集しています
summary: 反復的なツール呼び出しループを検出するガードレールを有効化して調整する方法
title: ツールループ検出
x-i18n:
    generated_at: "2026-04-30T05:38:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba601384e7d23ddfd316f9e5eef92b3daa4618d2287228a516c76fe141700a28
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw は、エージェントが反復的なツール呼び出しパターンで行き詰まるのを防げます。
このガードは**デフォルトで無効**です。

厳格な設定では正当な反復呼び出しをブロックする可能性があるため、必要な場所でのみ有効にしてください。

## これが存在する理由

- 進捗のない反復シーケンスを検出します。
- 高頻度の結果なしループを検出します（同じツール、同じ入力、反復エラー）。
- 既知のポーリングツール向けに、特定の反復呼び出しパターンを検出します。

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

エージェントごとの上書き（任意）:

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

- `enabled`: マスタースイッチです。`false` はループ検出が実行されないことを意味します。
- `historySize`: 分析用に保持される直近のツール呼び出し数です。
- `warningThreshold`: パターンを警告のみとして分類する前のしきい値です。
- `criticalThreshold`: 反復ループパターンをブロックするためのしきい値です。
- `globalCircuitBreakerThreshold`: グローバルな進捗なしブレーカーのしきい値です。
- `detectors.genericRepeat`: 同じツール + 同じパラメーターの反復パターンを検出します。
- `detectors.knownPollNoProgress`: 状態変化のない、既知のポーリング風パターンを検出します。
- `detectors.pingPong`: 交互に繰り返されるピンポンパターンを検出します。

`exec` では、進捗なしチェックは安定したコマンド結果を比較し、duration、PID、session ID、working directory などの揮発性ランタイムメタデータを無視します。
run id が利用可能な場合、直近のツール呼び出し履歴はその実行内でのみ評価されるため、スケジュールされた Heartbeat サイクルや新しい実行が、以前の実行から古いループカウントを引き継ぐことはありません。

## 推奨設定

- `enabled: true` で開始し、デフォルトは変更しません。
- しきい値は `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold` の順序に保ちます。
- 誤検知が発生する場合:
  - `warningThreshold` や `criticalThreshold` を上げます
  - （任意で）`globalCircuitBreakerThreshold` を上げます
  - 問題を起こしている検出器だけを無効にします
  - より緩い履歴コンテキストにするため、`historySize` を減らします

## ログと想定される動作

ループが検出されると、OpenClaw はループイベントを報告し、重大度に応じて次のツールサイクルをブロックまたは抑制します。
これにより、通常のツールアクセスを維持しながら、ユーザーを制御不能なトークン消費やロックアップから保護します。

- まず警告と一時的な抑制を優先します。
- 反復的な証拠が蓄積した場合にのみエスカレートします。

## メモ

- `tools.loopDetection` はエージェントレベルの上書きとマージされます。
- エージェントごとの設定は、グローバル値を完全に上書きまたは拡張します。
- 設定が存在しない場合、ガードレールはオフのままです。

## 関連

- [Exec 承認](/ja-JP/tools/exec-approvals)
- [思考レベル](/ja-JP/tools/thinking)
- [サブエージェント](/ja-JP/tools/subagents)
