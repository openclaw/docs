---
read_when:
    - ユーザーが、エージェントがツール呼び出しを繰り返して動かなくなると報告している
    - 反復呼び出し保護を調整する必要があります
    - エージェントのツール/ランタイムポリシーを編集中です
    - コンテキストオーバーフローの再試行後に `compaction_loop_persisted` の中止が発生する
summary: 反復的なツール呼び出しループを検出するガードレールを有効化して調整する方法
title: ツールループ検出
x-i18n:
    generated_at: "2026-05-06T05:22:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48773b2af3ba38db48f14c65e9f359c80b2503bd29c8e3edfaca2e4ced7e1713
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw には、反復的なツール呼び出しパターンに対する 2 つの協調するガードレールがあります。

1. **ループ検出** (`tools.loopDetection.enabled`) — デフォルトでは無効です。ローリング形式のツール呼び出し履歴を監視し、反復パターンと未知のツールの再試行を検出します。
2. **Compaction 後ガード** (`tools.loopDetection.postCompactionGuard`) — `tools.loopDetection.enabled` が明示的に `false` でない限り、デフォルトで有効です。各 Compaction 再試行の後に作動し、エージェントがウィンドウ内で同じ `(tool, args, result)` の三つ組を出力した場合に実行を中止します。

どちらも同じ `tools.loopDetection` ブロックで設定しますが、Compaction 後ガードはマスタースイッチが明示的にオフでない限り実行されます。両方の面を無効にするには、`tools.loopDetection.enabled: false` を設定します。

## これが存在する理由

- 進捗のない反復シーケンスを検出する。
- 高頻度の結果なしループ（同じツール、同じ入力、反復されるエラー）を検出する。
- 既知のポーリングツールに対する特定の反復呼び出しパターンを検出する。
- コンテキストオーバーフロー、Compaction、同じループのサイクルが無期限に実行されるのを防ぐ。

## 設定ブロック

すべてのドキュメント化されたフィールドを示したグローバルデフォルト:

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // master switch for the rolling-history detectors
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      unknownToolThreshold: 10,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3, // armed after compaction-retry; runs unless enabled is explicitly false
      },
    },
  },
}
```

エージェント単位の上書き（任意）:

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

| フィールド                       | デフォルト | 効果                                                                                                                            |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false` | ローリング履歴検出器のマスタースイッチです。`false` に設定すると、Compaction 後ガードも無効になります。                       |
| `historySize`                    | `30`    | 分析のために保持される最近のツール呼び出し数です。                                                                              |
| `warningThreshold`               | `10`    | パターンが警告のみとして分類されるまでのしきい値です。                                                                          |
| `criticalThreshold`              | `20`    | 反復的なループパターンをブロックするしきい値です。                                                                              |
| `unknownToolThreshold`           | `10`    | 同じ利用不可ツールへの反復呼び出しを、この回数のミスの後にブロックします。                                                     |
| `globalCircuitBreakerThreshold`  | `30`    | すべての検出器にまたがるグローバルな進捗なしブレーカーのしきい値です。                                                         |
| `detectors.genericRepeat`        | `true`  | 同じツール + 同じパラメータの反復パターンを検出します。                                                                         |
| `detectors.knownPollNoProgress`  | `true`  | 状態変化のない既知のポーリング風パターンを検出します。                                                                          |
| `detectors.pingPong`             | `true`  | 交互に繰り返されるピンポンパターンを検出します。                                                                                |
| `postCompactionGuard.windowSize` | `3`     | Compaction 後のツール呼び出しのうち、ガードが作動状態を維持する数であり、実行を中止する同一三つ組の回数でもあります。 |

`exec` では、進捗なしチェックは安定したコマンド結果を比較し、実行時間、PID、セッション ID、作業ディレクトリなどの変動する実行時メタデータを無視します。実行 ID が利用可能な場合、最近のツール呼び出し履歴はその実行内だけで評価されるため、スケジュールされた Heartbeat サイクルや新しい実行が、以前の実行から古いループ回数を引き継ぐことはありません。

## 推奨設定

- 小さめのモデルでは、`enabled: true` を設定し、しきい値はデフォルトのままにします。フラッグシップモデルではローリング履歴検出がほとんど不要で、マスタースイッチを `false` のままにしつつ、Compaction 後ガードの恩恵を受けられます。
- しきい値は `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold` の順序を保ちます。
- 誤検出が発生する場合:
  - `warningThreshold` および/または `criticalThreshold` を引き上げます。
  - 必要に応じて `globalCircuitBreakerThreshold` を引き上げます。
  - 問題を起こしている特定の検出器だけを無効にします（`detectors.<name>: false`）。
  - 履歴コンテキストを緩めるために `historySize` を減らします。
- すべてを無効にする（Compaction 後ガードを含む）には、`tools.loopDetection.enabled: false` を明示的に設定します。

## Compaction 後ガード

ランナーがコンテキストオーバーフロー後の Compaction 再試行を完了すると、次の数回のツール呼び出しを監視する短いウィンドウのガードが作動します。エージェントがウィンドウ内で同じ `(toolName, argsHash, resultHash)` の三つ組を複数回出力した場合、ガードは Compaction がループを断ち切れなかったと判断し、`compaction_loop_persisted` エラーで実行を中止します。

このガードは、マスターの `tools.loopDetection.enabled` フラグによって制御されますが、ひとつ例外があります。フラグが未設定または `true` の場合は **有効なまま** で、フラグが明示的に `false` の場合にのみ無効になります。これは意図的な動作です。このガードは、そうでなければ無制限にトークンを消費する Compaction ループから脱出するために存在するため、設定していないユーザーも保護を受けられます。

```json5
{
  tools: {
    loopDetection: {
      // master switch; set false to disable the guard along with the rolling detectors
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // default
      },
    },
  },
}
```

- `windowSize` が低いほど厳格です（中止までの試行回数が少なくなります）。
- `windowSize` が高いほど、エージェントにより多くの回復試行を許可します。
- ガードは結果が変化している場合には中止せず、ウィンドウ全体で結果がバイト単位で同一の場合にのみ中止します。
- 意図的に狭く設計されています。Compaction 再試行の直後にのみ発火します。

<Note>
  Compaction 後ガードは、マスターフラグが明示的に `false` でない限り、`tools.loopDetection` ブロックを書いたことがなくても実行されます。確認するには、Compaction イベント直後の Gateway ログで `post-compaction guard armed for N attempts` を探してください。
</Note>

## ログと想定される挙動

ループが検出されると、OpenClaw はループイベントを報告し、重大度に応じて次のツールサイクルを抑制またはブロックします。これにより、通常のツールアクセスを維持しながら、ユーザーを暴走するトークン消費やロックアップから保護します。

- まず警告が出ます。
- パターンが警告しきい値を超えて継続すると、抑制が続きます。
- 重大しきい値に達すると、次のツールサイクルをブロックし、実行記録に明確なループ検出理由を表示します。
- Compaction 後ガードは、問題のツール名と同一呼び出し回数を含む `compaction_loop_persisted` エラーを出力します。

## 関連

<CardGroup cols={2}>
  <Card title="Exec 承認" href="/ja-JP/tools/exec-approvals" icon="shield">
    シェル実行の許可/拒否ポリシー。
  </Card>
  <Card title="思考レベル" href="/ja-JP/tools/thinking" icon="brain">
    推論 effort レベルとプロバイダーポリシーの相互作用。
  </Card>
  <Card title="サブエージェント" href="/ja-JP/tools/subagents" icon="users">
    暴走する挙動を制限するために分離されたエージェントを生成します。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    完全な `tools.loopDetection` スキーマとマージの意味論。
  </Card>
</CardGroup>
