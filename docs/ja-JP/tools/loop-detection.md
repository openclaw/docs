---
read_when:
    - ユーザーが、エージェントがツール呼び出しを繰り返して停止する問題を報告している
    - 反復呼び出し保護を調整する必要がある
    - エージェントのツール/ランタイムポリシーを編集しています
    - コンテキストオーバーフローの再試行後に `compaction_loop_persisted` 件の中止が発生する
summary: 反復的なツール呼び出しループを検出するガードレールを有効化し調整する方法
title: ツールループ検出
x-i18n:
    generated_at: "2026-07-05T11:54:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fccbb81281b6c6921e6dad50d15295c1be3f59c664f2caed900bf3dce14bc40a
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw には、反復的なツール呼び出しパターンに対する 2 つの連携するガードレールがあり、
どちらも `tools.loopDetection` の下で設定されます。

1. **ループ検出** (`enabled`) - デフォルトでは無効です。ローリング形式の
   ツール呼び出し履歴を監視し、反復パターンと未知ツールの再試行を検出します。
2. **Compaction 後ガード** (`postCompactionGuard`) - `enabled` が明示的に `false` でない場合に有効になります。
   すべての Compaction 再試行後に待機状態になり、エージェントがウィンドウ内で同じ
   `(tool, args, result)` の三つ組を繰り返すと実行を中止します。

両方のガードレールを停止するには、`tools.loopDetection.enabled: false` を設定します。

## これが存在する理由

- 進捗のない反復シーケンスを検出するため。
- 高頻度の結果なしループ（同じツール、同じ入力、繰り返される
  エラー）を検出するため。
- 既知のポーリングツールに対する特定の反復呼び出しパターンを検出するため。
- コンテキストオーバーフロー -> Compaction -> 同じループ、というサイクルを無期限に実行させるのではなく
  中断するため。

## 設定ブロック

グローバルデフォルト。文書化されているすべてのフィールドを示します。

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

エージェントごとの上書き（任意、`agents.list[].tools.loopDetection`）:

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

エージェントごとの設定は、グローバルブロックに対してフィールド単位で重ね合わせられます（ネストされた
`detectors` と `postCompactionGuard` を含む）。そのため、エージェントは変更したい
フィールドだけを設定すれば十分です。

### フィールドの動作

| フィールド                       | デフォルト | 効果                                                                                                                                       |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`                        | `false`    | ローリング履歴検出器のマスタースイッチです。`false` は Compaction 後ガードも無効にします。                                                 |
| `historySize`                    | `30`       | 分析用に保持する直近のツール呼び出し数です。                                                                                               |
| `warningThreshold`               | `10`       | パターンが警告のみとして分類されるまでの反復回数です。                                                                                     |
| `criticalThreshold`              | `20`       | 進捗なしループパターンをブロックする反復回数です。誤設定されている場合、ランタイムはこれを `warningThreshold` より上にクランプします。     |
| `unknownToolThreshold`           | `10`       | 利用できない同じツールへの反復呼び出しを、この回数の失敗後にブロックします。`detectors` の制御は受けません。                               |
| `globalCircuitBreakerThreshold`  | `30`       | すべての検出器をまたぐグローバルな進捗なしブレーカーです。誤設定されている場合、ランタイムはこれを `criticalThreshold` より上にクランプします。`detectors` の制御は受けません。 |
| `detectors.genericRepeat`        | `true`     | 同じツール + 同じ引数の呼び出しが繰り返されると警告し、それらの呼び出しが同一の結果も返すようになるとブロックします。                     |
| `detectors.knownPollNoProgress`  | `true`     | 既知の進捗なしポーリングパターン（`action: "poll"`/`"log"` を伴う `process`、`command_status`）を検出します。                               |
| `detectors.pingPong`             | `true`     | 2 つの呼び出し間で交互に発生する進捗なしのピンポンパターンを検出します。                                                                    |
| `postCompactionGuard.windowSize` | `3`        | Compaction 後にガードが待機状態を維持する試行数、および実行を中止する同一三つ組の回数です。                                                |

`exec` では、進捗なしハッシュ化は安定したコマンド結果（ステータス、
終了コード、タイムアウトフラグ、出力）を比較し、実行時間、PID、セッション ID、作業ディレクトリなどの
揮発的なランタイムメタデータは無視します。送信メッセージの結果は、呼び出しごとに変わる ID（メッセージ ID、ファイル ID、タイムスタンプ）を
取り除いてハッシュ化されるため、ある「送信済み」結果が別の「送信済み」結果と同一に見えることはありません。
実行 ID が利用できる場合、履歴はその実行内だけで評価されるため、
スケジュールされた Heartbeat サイクルや新しい実行が、以前の実行から古いループ回数を継承することはありません。

## 推奨セットアップ

- 小さめのモデルでは、`enabled: true` を設定し、しきい値はデフォルトのままにします。
  フラッグシップモデルではローリング履歴検出が必要になることはまれであり、
  マスタースイッチを `false` のままにしながら、Compaction 後ガードの恩恵を受けられます。
- しきい値は `warningThreshold < criticalThreshold <
globalCircuitBreakerThreshold` の順に保ちます。ランタイムは、
  `criticalThreshold` と `globalCircuitBreakerThreshold` が
  超えるべきしきい値以下に設定されている場合、それらを上方に調整します。
- 誤検知が発生する場合:
  - `warningThreshold` および/または `criticalThreshold` を引き上げます。
  - 必要に応じて `globalCircuitBreakerThreshold` を引き上げます。
  - 問題を起こしている特定の検出器だけを無効にします（`detectors.<name>: false`）。
  - 履歴ウィンドウを短くするために `historySize` を減らします。
- Compaction 後ガードを含めてすべてを無効にするには、
  `tools.loopDetection.enabled: false` を明示的に設定します。

## Compaction 後ガード

コンテキストオーバーフロー後の Compaction 再試行の後、ランナーは
次の数回のツール呼び出しに対して短いウィンドウのガードを待機状態にします。エージェントがそのウィンドウ内で同じ
`(toolName, argsHash, resultHash)` の三つ組を `postCompactionGuard.windowSize`
回出力すると、ガードは Compaction がループを解消しなかったと判断し、
`compaction_loop_persisted` エラーで実行を中止します。

このガードはマスターの `tools.loopDetection.enabled` フラグによって制御されますが、1 つ
ひねりがあります。フラグが未設定または `true` の場合は **有効のまま** で、
フラグが明示的に `false` の場合にのみ無効になります。これは意図的です。ガードは、
放置すると無制限にトークンを消費する Compaction ループから抜けるために存在するため、
設定していないユーザーでも保護を受けられます。

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
- 結果が変化している間、ガードが中止することはありません。ウィンドウ内でバイト単位で同一の
  結果だけがトリガーになります。
- 実行内の他の時点ではなく、Compaction 再試行の直後にのみ待機状態になります。

<Note>
  Compaction 後ガードは、マスターフラグが明示的に `false` でない限り、`tools.loopDetection` ブロックを書いていなくても実行されます。確認するには、Compaction イベントの直後に Gateway ログで `post-compaction guard armed for N attempts` を探してください。
</Note>

## ログと期待される動作

ループが検出されると、OpenClaw はループイベントをログに記録し、重大度に応じて
次のツールサイクルに対して警告またはブロックを行います。これにより、通常のツールアクセスを保ちながら、
暴走するトークン消費とロックアップを防ぎます。

- まず警告が出ます。
- パターンが警告しきい値を超えて継続すると、ブロックが続きます。
- 重大しきい値では次のツールサイクルがブロックされ、実行記録に明確な
  ループ検出理由が表示されます。
- Compaction 後ガードは、問題のツールと同一呼び出し回数を示す
  `compaction_loop_persisted` エラーを出力します。

## 関連

<CardGroup cols={2}>
  <Card title="Exec 承認" href="/ja-JP/tools/exec-approvals" icon="shield">
    シェル実行の許可/拒否ポリシー。
  </Card>
  <Card title="思考レベル" href="/ja-JP/tools/thinking" icon="brain">
    推論努力レベルとプロバイダーポリシーの相互作用。
  </Card>
  <Card title="サブエージェント" href="/ja-JP/tools/subagents" icon="users">
    暴走動作を制限するために、分離されたエージェントを生成します。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-tools#toolsloopdetection" icon="gear">
    完全な `tools.loopDetection` スキーマとマージのセマンティクス。
  </Card>
</CardGroup>
