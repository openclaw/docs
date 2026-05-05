---
read_when:
    - ユーザーが、エージェントがツール呼び出しを繰り返したまま停止する問題を報告しています
    - 繰り返し呼び出し保護を調整する必要があります
    - エージェントのツール/ランタイムポリシーを編集しています
summary: 反復的なツール呼び出しループを検出するガードレールを有効化し調整する方法
title: ツールループ検出
x-i18n:
    generated_at: "2026-05-05T01:49:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9221e1716d3f4c2814a4705b160253839510cd6d11fe4ccd598c67958851afb
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw は、エージェントが繰り返しのツール呼び出しパターンにはまり込むのを防げます。
このガードは**デフォルトで無効**です。

厳しい設定では正当な繰り返し呼び出しをブロックする可能性があるため、必要な場所でのみ有効にしてください。

## 存在する理由

- 進行しない反復シーケンスを検出する。
- 高頻度の結果なしループ（同じツール、同じ入力、繰り返されるエラー）を検出する。
- 既知のポーリングツール向けの特定の繰り返し呼び出しパターンを検出する。

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

- `enabled`: マスタースイッチ。`false` はループ検出が実行されないことを意味します。
- `historySize`: 分析のために保持される直近のツール呼び出し数。
- `warningThreshold`: パターンを警告のみとして分類する前のしきい値。
- `criticalThreshold`: 反復ループパターンをブロックするしきい値。
- `globalCircuitBreakerThreshold`: グローバルな進行なしブレーカーのしきい値。
- `detectors.genericRepeat`: 同じツール + 同じパラメーターの繰り返しパターンを検出します。
- `detectors.knownPollNoProgress`: 状態変化のない既知のポーリング風パターンを検出します。
- `detectors.pingPong`: 交互に繰り返すピンポンパターンを検出します。

`exec` では、進行なしチェックは安定したコマンド結果を比較し、所要時間、PID、セッション ID、作業ディレクトリなどの変動しやすい実行時メタデータを無視します。
run id が利用可能な場合、直近のツール呼び出し履歴はその実行内でのみ評価されるため、スケジュールされた Heartbeat サイクルや新規実行が以前の実行から古いループ回数を引き継ぐことはありません。

## 推奨セットアップ

- 小さめのモデルでは、`enabled: true` にしてデフォルトは変更せずに開始します。フラッグシップモデルではループ検出が必要になることはまれで、無効のままにできます。
- しきい値は `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold` の順に保ちます。
- 誤検知が発生する場合:
  - `warningThreshold` と、または `criticalThreshold` を上げる
  - （任意で）`globalCircuitBreakerThreshold` を上げる
  - 問題を起こしている検出器だけを無効にする
  - 履歴コンテキストを緩くするために `historySize` を減らす

## Compaction 後ガード

runner が（コンテキストオーバーフロー後に）自動 Compaction リトライを完了すると、次の数回のツール呼び出しを監視する短いウィンドウのガードを有効にします。エージェントがそのウィンドウ内で_同じ_ `(toolName, args, result)` の組を複数回出力した場合、ガードは Compaction がループを断ち切れなかったと判断し、`compaction_loop_persisted` エラーで実行を中止します。

これはグローバルな `tools.loopDetection` 検出器とは別のコードパスです。独立して設定できます:

```json5
{
  tools: {
    loopDetection: {
      enabled: true, // existing master switch; set false to disable loop guards
      postCompactionGuard: {
        windowSize: 3, // default: 3
      },
    },
  },
}
```

- `windowSize`: ガードが有効なまま維持される Compaction 後のツール呼び出し数であり、中止を引き起こす同一の（tool、args、result）組の回数でもあります。

このガードは、結果が変化している場合には中止せず、ウィンドウ全体で結果がバイト単位で同一の場合にのみ中止します。意図的に範囲を狭くしており、Compaction リトライ直後にのみ発火します。

## ログと期待される動作

ループが検出されると、OpenClaw はループイベントを報告し、重大度に応じて次のツールサイクルをブロックまたは抑制します。
これにより、通常のツールアクセスを維持しながら、暴走するトークン消費とロックアップからユーザーを保護します。

- まず警告と一時的な抑制を優先します。
- 繰り返しの証拠が蓄積した場合にのみエスカレートします。

## 注記

- `tools.loopDetection` はエージェントレベルの上書きとマージされます。
- エージェントごとの設定は、グローバル値を完全に上書きまたは拡張します。
- 設定が存在しない場合、ガードレールはオフのままです。

## 関連

- [Exec 承認](/ja-JP/tools/exec-approvals)
- [思考レベル](/ja-JP/tools/thinking)
- [サブエージェント](/ja-JP/tools/subagents)
