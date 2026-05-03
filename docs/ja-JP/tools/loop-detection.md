---
read_when:
    - ユーザーが、エージェントがツール呼び出しを繰り返したまま停止することを報告している
    - 繰り返し呼び出し保護を調整する必要があります
    - エージェントのツール/ランタイムポリシーを編集している場合
summary: 反復的なツール呼び出しループを検出するガードレールを有効化し、調整する方法
title: ツールループ検出
x-i18n:
    generated_at: "2026-05-03T21:39:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b3976948d5735cf08b7ce854bab048a77a778a07a9f3f66d17c15aed0d42a97
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw は、エージェントが反復的なツール呼び出しパターンにはまり込むのを防げます。
このガードは**デフォルトでは無効**です。

厳格な設定では正当な反復呼び出しをブロックする可能性があるため、必要な場所でのみ有効にしてください。

## これが存在する理由

- 進捗のない反復シーケンスを検出する。
- 高頻度の結果なしループ（同じツール、同じ入力、反復エラー）を検出する。
- 既知のポーリングツール向けの特定の反復呼び出しパターンを検出する。

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

### フィールドの挙動

- `enabled`: マスタースイッチ。`false` はループ検出を実行しないことを意味する。
- `historySize`: 分析用に保持する最近のツール呼び出し数。
- `warningThreshold`: パターンを警告のみとして分類する前のしきい値。
- `criticalThreshold`: 反復的なループパターンをブロックするしきい値。
- `globalCircuitBreakerThreshold`: グローバルな進捗なしブレーカーしきい値。
- `detectors.genericRepeat`: 同じツール + 同じパラメーターの反復パターンを検出する。
- `detectors.knownPollNoProgress`: 状態変化のない既知のポーリングに似たパターンを検出する。
- `detectors.pingPong`: 交互に発生するピンポンパターンを検出する。

`exec` では、進捗なしチェックは安定したコマンド結果を比較し、実行時間、PID、セッション ID、作業ディレクトリなどの揮発性の実行時メタデータを無視します。
実行 ID が利用可能な場合、最近のツール呼び出し履歴はその実行内でのみ評価されるため、スケジュールされた Heartbeat サイクルや新しい実行が、以前の実行から古いループ数を引き継ぐことはありません。

## 推奨設定

- 小さめのモデルでは、`enabled: true` から始め、デフォルトは変更しないでください。フラッグシップモデルではループ検出が必要になることはまれで、無効のままにできます。
- しきい値は `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold` の順序を保ってください。
- 誤検出が発生する場合:
  - `warningThreshold` や `criticalThreshold` を引き上げる
  - （任意で）`globalCircuitBreakerThreshold` を引き上げる
  - 問題を起こしている検出器だけを無効にする
  - 厳格さの低い履歴コンテキストにするために `historySize` を減らす

## ログと期待される挙動

ループが検出されると、OpenClaw はループイベントを報告し、重大度に応じて次のツールサイクルをブロックまたは抑制します。
これにより、通常のツールアクセスを保ちながら、暴走したトークン消費やロックアップからユーザーを保護します。

- まず警告と一時的な抑制を優先してください。
- 反復した証拠が蓄積された場合にのみエスカレートしてください。

## 注記

- `tools.loopDetection` はエージェントレベルの上書きとマージされます。
- エージェントごとの設定は、グローバル値を完全に上書きするか拡張します。
- 設定が存在しない場合、ガードレールはオフのままです。

## 関連

- [Exec 承認](/ja-JP/tools/exec-approvals)
- [思考レベル](/ja-JP/tools/thinking)
- [サブエージェント](/ja-JP/tools/subagents)
