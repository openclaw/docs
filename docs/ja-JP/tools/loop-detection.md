---
read_when:
    - ユーザーが、エージェントがツール呼び出しを繰り返して抜け出せなくなると報告している
    - 反復呼び出し保護を調整する必要があります
    - エージェントツール/ランタイムポリシーを編集しています
    - コンテキストオーバーフローによる再試行後に `compaction_loop_persisted` の中止が発生する
summary: 反復的なツール呼び出しループを検出するガードレールを有効化して調整する方法
title: ツールループ検出
x-i18n:
    generated_at: "2026-05-11T20:39:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc261bebc0e3138a98ea8be166edbaf4e133c8f582429c5380fe2954196a6fc5
    source_path: tools/loop-detection.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw には、反復的なツール呼び出しパターンに対する 2 つの協調するガードレールがあります。

1. **ループ検出** (`tools.loopDetection.enabled`) — デフォルトでは無効です。ローリング形式のツール呼び出し履歴を監視し、反復パターンと不明ツールの再試行を検出します。
2. **Compaction 後ガード** (`tools.loopDetection.postCompactionGuard`) — `tools.loopDetection.enabled` が明示的に `false` に設定されていない限り、デフォルトで有効です。各 Compaction 再試行後に作動し、エージェントがウィンドウ内で同じ `(tool, args, result)` の 3 要素を出力した場合に実行を中止します。

どちらも同じ `tools.loopDetection` ブロックで設定されますが、Compaction 後ガードはマスタースイッチが明示的にオフでない限り実行されます。両方のサーフェスを止めるには、`tools.loopDetection.enabled: false` を設定します。

## これが存在する理由

- 進捗を生まない反復シーケンスを検出する。
- 高頻度の結果なしループ（同じツール、同じ入力、反復するエラー）を検出する。
- 既知のポーリングツールに対する特定の反復呼び出しパターンを検出する。
- コンテキストオーバーフロー、Compaction、同じループというサイクルが無期限に実行されるのを防ぐ。

## 設定ブロック

グローバルデフォルト。ドキュメント化されたすべてのフィールドを示しています。

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

エージェントごとのオーバーライド（任意）:

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

| フィールド                       | デフォルト | 効果                                                                                                                          |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false` | ローリング履歴検出器のマスタースイッチです。`false` に設定すると、Compaction 後ガードも無効になります。                       |
| `historySize`                    | `30`    | 分析用に保持される最近のツール呼び出し数です。                                                                                  |
| `warningThreshold`               | `10`    | パターンが警告のみとして分類されるまでのしきい値です。                                                                       |
| `criticalThreshold`              | `20`    | 進捗のない反復ループパターンをブロックするしきい値です。                                                                    |
| `unknownToolThreshold`           | `10`    | 利用できない同じツールへの反復呼び出しを、この回数のミス後にブロックします。                                                       |
| `globalCircuitBreakerThreshold`  | `30`    | すべての検出器にまたがるグローバルな進捗なしブレーカーのしきい値です。                                                                      |
| `detectors.genericRepeat`        | `true`  | 同じツール + 同じパラメーターの反復パターンで警告し、同じ呼び出しが同一の結果も返す場合にブロックします。               |
| `detectors.knownPollNoProgress`  | `true`  | 状態変化のない既知のポーリング風パターンを検出します。                                                                       |
| `detectors.pingPong`             | `true`  | 交互に繰り返されるピンポンパターンを検出します。                                                                                         |
| `postCompactionGuard.windowSize` | `3`     | ガードが作動したままになる Compaction 後ツール呼び出し数であり、実行を中止する同一 3 要素のカウントでもあります。 |

`exec` の場合、進捗なしチェックは安定したコマンド結果を比較し、所要時間、PID、セッション ID、作業ディレクトリなどの変動するランタイムメタデータを無視します。実行 ID が利用できる場合、最近のツール呼び出し履歴はその実行内でのみ評価されるため、スケジュールされた Heartbeat サイクルや新しい実行が以前の実行から古いループカウントを引き継ぐことはありません。

## 推奨設定

- 小さめのモデルでは、`enabled: true` を設定し、しきい値はデフォルトのままにします。フラッグシップモデルではローリング履歴検出が必要になることはほとんどなく、マスタースイッチを `false` のままにしつつ、Compaction 後ガードの恩恵は受けられます。
- しきい値は `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold` の順序を保ちます。
- 誤検出が発生する場合:
  - `warningThreshold` や `criticalThreshold`、またはその両方を引き上げます。
  - 必要に応じて `globalCircuitBreakerThreshold` を引き上げます。
  - 問題を起こしている特定の検出器だけを無効化します（`detectors.<name>: false`）。
  - 履歴コンテキストを緩めるために `historySize` を減らします。
- すべて（Compaction 後ガードを含む）を無効化するには、`tools.loopDetection.enabled: false` を明示的に設定します。

## Compaction 後ガード

ランナーがコンテキストオーバーフロー後の Compaction 再試行を完了すると、次の数回のツール呼び出しを監視する短いウィンドウのガードを作動させます。エージェントがウィンドウ内で同じ `(toolName, argsHash, resultHash)` の 3 要素を複数回出力した場合、ガードは Compaction がループを解消しなかったと判断し、`compaction_loop_persisted` エラーで実行を中止します。

このガードはマスターの `tools.loopDetection.enabled` フラグで制御されますが、1 つだけ注意点があります。フラグが未設定または `true` の場合は **有効なまま** で、明示的に `false` に設定された場合にのみ無効化されます。これは意図した挙動です。このガードは、そうでなければ無制限にトークンを消費する Compaction ループから抜けるために存在するため、設定していないユーザーにも保護が適用されます。

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

- `windowSize` が低いほど厳格です（中止前の試行回数が少なくなります）。
- `windowSize` が高いほど、エージェントにより多くの回復試行を与えます。
- ガードは結果が変化している場合には中止せず、ウィンドウ全体で結果がバイト単位で同一の場合にのみ中止します。
- 意図的に範囲を狭くしています。Compaction 再試行の直後にのみ発火します。

<Note>
  Compaction 後ガードは、マスターフラグが明示的に `false` でない限り、`tools.loopDetection` ブロックを書いたことがなくても実行されます。確認するには、Compaction イベントの直後に Gateway ログで `post-compaction guard armed for N attempts` を探します。
</Note>

## ログと期待される挙動

ループが検出されると、OpenClaw はループイベントを報告し、深刻度に応じて次のツールサイクルを抑制またはブロックします。これにより、通常のツールアクセスを維持しながら、暴走するトークン消費やロックアップからユーザーを保護します。

- まず警告が出ます。
- パターンが警告しきい値を超えて継続すると抑制が続きます。
- 重大しきい値では次のツールサイクルがブロックされ、実行レコードに明確なループ検出理由が表示されます。
- Compaction 後ガードは、問題のツール名と同一呼び出しカウントを含む `compaction_loop_persisted` エラーを出力します。

## 関連

<CardGroup cols={2}>
  <Card title="Exec approvals" href="/ja-JP/tools/exec-approvals" icon="shield">
    シェル実行の許可/拒否ポリシー。
  </Card>
  <Card title="Thinking levels" href="/ja-JP/tools/thinking" icon="brain">
    推論エフォートレベルとプロバイダーポリシーの相互作用。
  </Card>
  <Card title="Sub-agents" href="/ja-JP/tools/subagents" icon="users">
    暴走動作を制限するために分離されたエージェントを生成する。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    完全な `tools.loopDetection` スキーマとマージセマンティクス。
  </Card>
</CardGroup>
