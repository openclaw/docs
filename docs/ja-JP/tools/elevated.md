---
read_when:
    - 昇格モードのデフォルト、allowlist、またはスラッシュコマンド動作を調整する場合
    - sandbox 化された agent が host にアクセスする方法を理解する場合
summary: '昇格した exec mode: sandbox 化された agent から sandbox 外でコマンドを実行する'
title: 昇格モード
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T05:24:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b91b4af36f9485695f2afebe9bf8d7274d7aad6d0d88e762e581b0d091e04f7
    source_path: tools/elevated.md
    workflow: 15
---

agent が sandbox 内で実行されている場合、その `exec` コマンドは sandbox 環境内に制限されます。**昇格モード** を使うと、agent はそこから抜け出して sandbox 外でコマンドを実行できるようになり、承認ゲートも設定可能です。

<Info>
  昇格モードが動作を変えるのは、agent が **sandbox 化されている** 場合だけです。
  sandbox 化されていない agent では、`exec` はすでに host 上で実行されます。
</Info>

## ディレクティブ

セッションごとの昇格モードはスラッシュコマンドで制御します:

| Directive        | 動作                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| `/elevated on`   | 設定された host path 上で sandbox 外実行に切り替え、承認は維持する     |
| `/elevated ask`  | `on` と同じ（エイリアス）                                              |
| `/elevated full` | 設定された host path 上で sandbox 外実行に切り替え、承認をスキップする |
| `/elevated off`  | sandbox 内に制限された実行へ戻る                                       |

`/elev on|off|ask|full` としても利用できます。

引数なしで `/elevated` を送ると、現在のレベルを確認できます。

## 仕組み

<Steps>
  <Step title="利用可能か確認する">
    昇格を config で有効にし、送信者が allowlist に含まれている必要があります:

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="レベルを設定する">
    ディレクティブだけのメッセージを送って、セッションのデフォルトを設定します:

    ```
    /elevated full
    ```

    またはインラインでも使えます（そのメッセージにだけ適用されます）:

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="コマンドは sandbox 外で実行される">
    昇格が有効な間、`exec` 呼び出しは sandbox を離れます。実効 host は
    デフォルトで `gateway`、設定済み / セッションの exec target が `node` のときは `node` です。`full` モードでは exec approvals はスキップされます。`on` / `ask` モードでは、設定済みの承認ルールが引き続き適用されます。
  </Step>
</Steps>

## 解決順序

1. メッセージ上の**インラインディレクティブ**（そのメッセージにのみ適用）
2. **セッション override**（ディレクティブだけのメッセージ送信で設定）
3. **グローバルデフォルト**（config 内の `agents.defaults.elevatedDefault`）

## 利用可否と allowlist

- **グローバルゲート**: `tools.elevated.enabled`（`true` である必要があります）
- **送信者 allowlist**: チャネルごとのリストを持つ `tools.elevated.allowFrom`
- **agent ごとのゲート**: `agents.list[].tools.elevated.enabled`（さらに制限することしかできません）
- **agent ごとの allowlist**: `agents.list[].tools.elevated.allowFrom`（送信者はグローバル + agent ごとの両方に一致する必要があります）
- **Discord fallback**: `tools.elevated.allowFrom.discord` が省略されている場合、`channels.discord.allowFrom` が fallback として使われます
- **すべてのゲートを通過**しない限り、昇格は利用不可として扱われます

allowlist エントリ形式:

| Prefix                  | 一致対象                        |
| ----------------------- | ------------------------------- |
| （なし）                | Sender ID、E.164、または From field |
| `name:`                 | Sender display name             |
| `username:`             | Sender username                 |
| `tag:`                  | Sender tag                      |
| `id:`, `from:`, `e164:` | 明示的な ID 指定                |

## 昇格で制御されないもの

- **ツールポリシー**: ツールポリシーで `exec` が拒否されている場合、昇格でも上書きできません
- **host 選択ポリシー**: 昇格は `auto` を自由な cross-host override に変えません。設定済み / セッションの exec target ルールを使い、target がすでに `node` の場合にのみ `node` を選びます。
- **`/exec` とは別物**: `/exec` ディレクティブは認可された送信者向けにセッションごとの exec デフォルトを調整するもので、昇格モードは必要ありません

## 関連

- [Exec tool](/ja-JP/tools/exec) — シェルコマンド実行
- [Exec approvals](/ja-JP/tools/exec-approvals) — 承認と allowlist のシステム
- [Sandboxing](/ja-JP/gateway/sandboxing) — sandbox 設定
- [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)
