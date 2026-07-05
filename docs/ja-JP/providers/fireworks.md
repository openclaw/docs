---
read_when:
    - OpenClaw で Fireworks を使用する
    - Fireworks API キーの環境変数またはデフォルトモデル ID が必要です
    - Fireworks での Kimi thinking-off 動作をデバッグしています
summary: Fireworks のセットアップ（認証 + モデル選択）
title: 花火
x-i18n:
    generated_at: "2026-07-05T11:43:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15feed0730ec65d943f103824468490be6616478ece80bedfeb9ad8137506180
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) は、OpenAI互換APIを通じてオープンウェイトモデルとルーティングされたモデルを公開します。公式 Fireworks provider plugin をインストールすると、事前にカタログ化された 2 つの Kimi モデルと、任意の Fireworks モデルまたはルーターIDをランタイムで使用できます。

| プロパティ        | 値                                                     |
| --------------- | ------------------------------------------------------ |
| プロバイダーID     | `fireworks` (エイリアス: `fireworks-ai`)                    |
| パッケージ         | `@openclaw/fireworks-provider`                         |
| 認証環境変数    | `FIREWORKS_API_KEY`                                    |
| オンボーディングフラグ | `--auth-choice fireworks-api-key`                      |
| 直接CLIフラグ | `--fireworks-api-key <key>`                            |
| API             | OpenAI互換 (`openai-completions`)               |
| ベースURL        | `https://api.fireworks.ai/inference/v1`                |
| デフォルトモデル   | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| デフォルトエイリアス   | `Kimi K2.5 Turbo`                                      |

## はじめに

<Steps>
  <Step title="Pluginをインストールする">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Fireworks APIキーを設定する">
    <CodeGroup>

```bash オンボーディング
openclaw onboard --auth-choice fireworks-api-key
```

```bash 直接フラグ
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash 環境変数のみ
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    オンボーディングでは、認証プロファイル内の `fireworks` プロバイダーにキーを保存し、**Fire Pass** Kimi K2.5 Turbo ルーターをデフォルトモデルとして設定します。

  </Step>
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider fireworks
    ```

    一覧には `Kimi K2.6` と `Kimi K2.5 Turbo (Fire Pass)` が含まれているはずです。`FIREWORKS_API_KEY` が解決されていない場合、`openclaw models status --json` は不足している認証情報を `auth.unusableProfiles` の下に報告します。

  </Step>
</Steps>

## 非対話型セットアップ

スクリプト化されたインストールやCIインストールでは、すべてをコマンドラインで渡します。

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## 組み込みカタログ

| モデル参照                                              | 名前                        | 入力        | コンテキスト | 最大出力 | Thinking             |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ---------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | テキスト + 画像 | 262,144 | 262,144    | 強制オフ           |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | テキスト + 画像 | 256,000 | 256,000    | 強制オフ (デフォルト) |

<Note>
  Fireworks 上の Kimi は、リクエストで thinking を明示的に無効化しない限り、chain-of-thought が表示される応答に漏れる可能性があるため、OpenClaw はすべての Fireworks Kimi モデルを `thinking: off` に固定します。同じモデルを [Moonshot](/ja-JP/providers/moonshot) 経由で直接ルーティングすると、Kimi の reasoning 出力は保持されます。プロバイダー間の切り替えについては [thinking modes](/ja-JP/tools/thinking) を参照してください。
</Note>

## カスタム Fireworks モデルID

OpenClaw は、任意の Fireworks モデルまたはルーターIDをランタイムで受け付けます。Fireworks に表示される正確なIDを使用し、先頭に `fireworks/` を付けてください。動的解決は Fire Pass テンプレート (テキスト + 画像入力、OpenAI互換API、デフォルトコストゼロ) を複製し、IDが Kimi パターンに一致する場合は thinking を自動的に無効化します。GLM の動的IDは、画像入力を持つカスタムモデルエントリを設定しない限り、テキスト専用としてマークされます。

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="モデルIDのプレフィックス付けの仕組み">
    OpenClaw のすべての Fireworks モデル参照は `fireworks/` で始まり、その後に Fireworks プラットフォーム上の正確なIDまたはルーターパスが続きます。例:

    - ルーターモデル: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - 直接モデル: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw は API リクエストを構築するときに `fireworks/` プレフィックスを取り除き、残りのパスを OpenAI互換の `model` フィールドとして Fireworks エンドポイントへ送信します。

  </Accordion>

  <Accordion title="Kimi で thinking が強制オフになる理由">
    Fireworks は Kimi を別個の reasoning チャンネルなしで提供するため、chain-of-thought が表示される `content` ストリームに現れる可能性があります。OpenClaw は Fireworks Kimi リクエストごとに `thinking: { type: "disabled" }` を送信し、ペイロードから `reasoning`、`reasoning_effort`、`reasoningEffort` を取り除きます (`extensions/fireworks/stream.ts`)。プロバイダーポリシー (`extensions/fireworks/thinking-policy.ts`) は Kimi モデルIDに対して `off` thinking レベルのみを公開するため、手動の `/think` 切り替えとプロバイダーポリシー面はランタイム契約と整合したままになります。

    Kimi の reasoning をエンドツーエンドで使用するには、[Moonshot provider](/ja-JP/providers/moonshot) を設定し、同じモデルをそれ経由でルーティングします。

  </Accordion>

  <Accordion title="デーモンでの環境の可用性">
    Gateway が管理サービス (launchd、systemd、Docker) として実行されている場合、Fireworks キーはそのプロセスから見える必要があります。対話型シェルからだけ見えても不十分です。

    <Warning>
      対話型シェルでのみエクスポートされたキーは、その環境もそこへインポートされていない限り、launchd または systemd デーモンには役立ちません。gateway プロセスから読み取れるようにするには、キーを `~/.openclaw/.env` または `env.shellEnv` 経由で設定してください。
    </Warning>

    OpenClaw は config を読み込むときに `~/.openclaw/.env` を読み込むため、そこに保存されたキーはすべてのプラットフォームで管理された gateway サービスに届きます。キーをローテーションした後は、gateway を再起動するか、`openclaw doctor --fix` を再実行してください。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="Thinking modes" href="/ja-JP/tools/thinking" icon="brain">
    `/think` レベル、プロバイダーポリシー、reasoning 対応モデルのルーティング。
  </Card>
  <Card title="Moonshot" href="/ja-JP/providers/moonshot" icon="moon">
    Moonshot 独自のAPIを通じて、ネイティブ thinking 出力付きで Kimi を実行します。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングとFAQ。
  </Card>
</CardGroup>
