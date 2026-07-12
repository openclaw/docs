---
read_when:
    - ユーザーから、エージェントがツール呼び出しを繰り返して停止できなくなる問題が報告されています
    - 反復呼び出し保護を調整する必要があります
    - エージェントのツール／ランタイムポリシーを編集しています
    - コンテキストオーバーフロー後の再試行後に `compaction_loop_persisted` の中断が発生する
summary: 反復的なツール呼び出しループを検出するガードレールを有効化して調整する方法
title: ツールループの検出
x-i18n:
    generated_at: "2026-07-11T22:47:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fccbb81281b6c6921e6dad50d15295c1be3f59c664f2caed900bf3dce14bc40a
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw には、反復的なツール呼び出しパターンを防ぐために連携して動作する 2 つのガードレールがあり、
どちらも `tools.loopDetection` で設定します。

1. **ループ検出**（`enabled`）- デフォルトでは無効です。直近の
   ツール呼び出し履歴を監視し、反復パターンや不明なツールの再試行を検出します。
2. **Compaction 後ガード**（`postCompactionGuard`）- `enabled` が明示的に
   `false` に設定されていない限り有効です。Compaction 後の再試行のたびに作動し、
   エージェントがウィンドウ内で同じ `(tool, args, result)` の組を繰り返すと
   実行を中止します。

両方のガードレールを無効にするには、`tools.loopDetection.enabled: false` を設定します。

## この機能が存在する理由

- 進展のない反復シーケンスを検出します。
- 高頻度で結果が得られないループ（同じツール、同じ入力、繰り返される
  エラー）を検出します。
- 既知のポーリングツールに固有の反復呼び出しパターンを検出します。
- コンテキストオーバーフロー -> Compaction -> 同じループ、というサイクルが
  無期限に続かないよう中断します。

## 設定ブロック

記載されているすべてのフィールドを含むグローバルデフォルト：

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // 直近の履歴を使用する検出器のマスタースイッチ
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
        windowSize: 3, // Compaction 後の再試行後に作動し、enabled が明示的に false でない限り実行される
      },
    },
  },
}
```

エージェントごとのオーバーライド（任意、`agents.list[].tools.loopDetection`）：

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

エージェントごとの設定は、グローバルブロックにフィールド単位で重ねて適用されます
（ネストされた `detectors` と `postCompactionGuard` を含む）。そのため、エージェントは
変更するフィールドだけを設定すれば済みます。

### フィールドの動作

| フィールド                       | デフォルト | 効果                                                                                                                                                             |
| -------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false`    | 直近の履歴を使用する検出器のマスタースイッチです。`false` にすると Compaction 後ガードも無効になります。                                                          |
| `historySize`                    | `30`       | 分析用に保持する直近のツール呼び出し数です。                                                                                                                     |
| `warningThreshold`               | `10`       | パターンを警告のみとして分類するまでの反復回数です。                                                                                                             |
| `criticalThreshold`              | `20`       | 進展のないループパターンをブロックする反復回数です。設定が不正な場合、ランタイムはこの値を `warningThreshold` より大きくなるよう補正します。                      |
| `unknownToolThreshold`           | `10`       | 同じ利用不能なツールの呼び出しがこの回数失敗すると、以降をブロックします。`detectors` の設定には左右されません。                                                   |
| `globalCircuitBreakerThreshold`  | `30`       | すべての検出器にまたがる、進展なし状態のグローバル遮断しきい値です。設定が不正な場合、ランタイムはこの値を `criticalThreshold` より大きくなるよう補正します。`detectors` の設定には左右されません。 |
| `detectors.genericRepeat`        | `true`     | 同じツールと同じ引数による呼び出しの反復を警告し、それらの呼び出しが同一の結果も返すようになるとブロックします。                                                   |
| `detectors.knownPollNoProgress`  | `true`     | 既知の進展なしポーリングパターン（`action: "poll"`/`"log"` を指定した `process`、`command_status`）を検出します。                                                  |
| `detectors.pingPong`             | `true`     | 2 つの呼び出し間で交互に繰り返される、進展のないピンポンパターンを検出します。                                                                                    |
| `postCompactionGuard.windowSize` | `3`        | Compaction 後にガードが作動し続ける試行回数であり、実行を中止する同一の組の回数でもあります。                                                                     |

`exec` では、進展なし判定用のハッシュは安定したコマンド結果（ステータス、
終了コード、タイムアウトフラグ、出力）を比較し、所要時間、PID、セッション ID、
作業ディレクトリなど、実行ごとに変動するランタイムメタデータを無視します。送信メッセージの
結果は、呼び出しごとに変動する ID（メッセージ ID、ファイル ID、タイムスタンプ）を
除去してハッシュ化されるため、ある「送信済み」の結果が別の「送信済み」の結果と
同一には見えません。実行 ID が利用できる場合、履歴はその実行内だけで評価されます。
そのため、スケジュールされた Heartbeat サイクルや新しい実行が、以前の実行から
古いループ回数を引き継ぐことはありません。

## 推奨設定

- 小規模なモデルでは、`enabled: true` を設定し、しきい値はデフォルトのままにします。
  最上位モデルでは直近の履歴による検出が必要になることはほとんどなく、
  マスタースイッチを `false` のままにしても Compaction 後ガードの恩恵を受けられます。
- しきい値は `warningThreshold < criticalThreshold <
globalCircuitBreakerThreshold` の順序を維持してください。`criticalThreshold` または
  `globalCircuitBreakerThreshold` を、それぞれが上回る必要のあるしきい値以下に
  設定すると、ランタイムが値を引き上げます。
- 誤検出が発生する場合：
  - `warningThreshold` や `criticalThreshold` を引き上げます。
  - 必要に応じて `globalCircuitBreakerThreshold` も引き上げます。
  - 問題の原因となる特定の検出器だけを無効にします（`detectors.<name>: false`）。
  - 履歴ウィンドウを短くするには `historySize` を小さくします。
- Compaction 後ガードを含むすべてを無効にするには、
  `tools.loopDetection.enabled: false` を明示的に設定します。

## Compaction 後ガード

コンテキストオーバーフロー後の Compaction に続く再試行が行われると、ランナーは
次の数回のツール呼び出しに対して短いウィンドウのガードを作動させます。エージェントが
そのウィンドウ内で同じ `(toolName, argsHash, resultHash)` の組を
`postCompactionGuard.windowSize` 回出力すると、ガードは Compaction でループを
解消できなかったと判断し、`compaction_loop_persisted` エラーで実行を中止します。

ガードはマスターの `tools.loopDetection.enabled` フラグによって制御されますが、
1 つ例外があります。フラグが未設定または `true` の場合は**有効のまま**で、
明示的に `false` に設定された場合にのみ無効になります。これは意図的な動作です。
このガードは、放置するとトークンを際限なく消費する Compaction ループから脱出するために
存在するため、設定を行っていないユーザーも保護されます。

```json5
{
  tools: {
    loopDetection: {
      // マスタースイッチ。直近の履歴を使用する検出器とともにガードを無効にするには false に設定する
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // デフォルト
      },
    },
  },
}
```

- `windowSize` を小さくすると厳格になります（中止までの試行回数が減ります）。
- `windowSize` を大きくすると、エージェントにより多くの復旧試行が許可されます。
- 結果が変化している間、ガードが実行を中止することはありません。ウィンドウ全体で
  バイト単位に同一の結果が続いた場合にのみ作動します。
- ガードが作動するのは Compaction 後の再試行の直後だけであり、実行中の
  その他の時点では作動しません。

<Note>
  Compaction 後ガードは、`tools.loopDetection` ブロックを一度も記述していなくても、マスターフラグが明示的に `false` でない限り実行されます。確認するには、Compaction イベントの直後に Gateway ログで `post-compaction guard armed for N attempts` を探してください。
</Note>

## ログと想定される動作

ループが検出されると、OpenClaw はループイベントをログに記録し、重大度に応じて
警告するか、次のツールサイクルをブロックします。これにより、通常のツールアクセスを
維持しながら、制御不能なトークン消費や停止状態を防ぎます。

- 最初に警告が発生します。
- パターンが警告しきい値を超えて継続するとブロックされます。
- 重大しきい値に達すると次のツールサイクルがブロックされ、実行記録に
  明確なループ検出理由が表示されます。
- Compaction 後ガードは、問題のあるツールと同一呼び出し回数を示す
  `compaction_loop_persisted` エラーを出力します。

## 関連項目

<CardGroup cols={2}>
  <Card title="Exec の承認" href="/ja-JP/tools/exec-approvals" icon="shield">
    シェル実行の許可・拒否ポリシー。
  </Card>
  <Card title="思考レベル" href="/ja-JP/tools/thinking" icon="brain">
    推論の労力レベルとプロバイダーポリシーの相互作用。
  </Card>
  <Card title="サブエージェント" href="/ja-JP/tools/subagents" icon="users">
    制御不能な動作を制限するための、分離されたエージェントの生成。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-tools#toolsloopdetection" icon="gear">
    `tools.loopDetection` の完全なスキーマとマージのセマンティクス。
  </Card>
</CardGroup>
