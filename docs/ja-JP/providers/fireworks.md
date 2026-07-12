---
read_when:
    - OpenClaw で Fireworks を使用する場合
    - Fireworks APIキーの環境変数またはデフォルトのモデルIDが必要です
    - Fireworks で Kimi の思考オフ時の動作をデバッグする
summary: Fireworks のセットアップ（認証 + モデル選択）
title: Fireworks
x-i18n:
    generated_at: "2026-07-11T22:37:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15feed0730ec65d943f103824468490be6616478ece80bedfeb9ad8137506180
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) は、OpenAI 互換 API を通じてオープンウェイトモデルとルーティングモデルを提供します。公式の Fireworks プロバイダー Plugin をインストールすると、事前にカタログ登録された 2 つの Kimi モデルに加え、任意の Fireworks モデルまたはルーター ID を実行時に使用できます。

| プロパティ             | 値                                                     |
| ---------------------- | ------------------------------------------------------ |
| プロバイダー ID        | `fireworks`（エイリアス: `fireworks-ai`）              |
| パッケージ             | `@openclaw/fireworks-provider`                         |
| 認証環境変数           | `FIREWORKS_API_KEY`                                    |
| オンボーディングフラグ | `--auth-choice fireworks-api-key`                      |
| 直接指定する CLI フラグ | `--fireworks-api-key <key>`                            |
| API                    | OpenAI 互換（`openai-completions`）                    |
| ベース URL             | `https://api.fireworks.ai/inference/v1`                |
| デフォルトモデル       | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| デフォルトエイリアス   | `Kimi K2.5 Turbo`                                      |

## はじめに

<Steps>
  <Step title="Plugin をインストールする">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Fireworks API キーを設定する">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice fireworks-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Env only
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    オンボーディングでは、認証プロファイル内の `fireworks` プロバイダーにキーを保存し、**Fire Pass** Kimi K2.5 Turbo ルーターをデフォルトモデルに設定します。

  </Step>
  <Step title="モデルが利用可能か確認する">
    ```bash
    openclaw models list --provider fireworks
    ```

    一覧には `Kimi K2.6` と `Kimi K2.5 Turbo (Fire Pass)` が含まれている必要があります。`FIREWORKS_API_KEY` を解決できない場合、`openclaw models status --json` は不足している認証情報を `auth.unusableProfiles` 配下に報告します。

  </Step>
</Steps>

## 非対話型セットアップ

スクリプトまたは CI によるインストールでは、すべてをコマンドラインで渡します。

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## 組み込みカタログ

| モデル参照                                             | 名前                        | 入力               | コンテキスト | 最大出力 | 思考                     |
| ------------------------------------------------------ | --------------------------- | ------------------ | ------------ | -------- | ------------------------ |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | テキスト + 画像    | 262,144      | 262,144  | 強制的にオフ             |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | テキスト + 画像    | 256,000      | 256,000  | 強制的にオフ（デフォルト） |

<Note>
  Fireworks 上の Kimi は、リクエストで思考を明示的に無効にしない限り、思考過程が表示される応答に漏れる可能性があるため、OpenClaw はすべての Fireworks Kimi モデルを `thinking: off` に固定します。同じモデルを [Moonshot](/ja-JP/providers/moonshot) 経由で直接ルーティングすると、Kimi の推論出力が維持されます。プロバイダーを切り替える方法については、[思考モード](/ja-JP/tools/thinking)を参照してください。
</Note>

## カスタム Fireworks モデル ID

OpenClaw は、任意の Fireworks モデルまたはルーター ID を実行時に受け付けます。Fireworks に表示されている正確な ID を使用し、先頭に `fireworks/` を付けてください。動的解決では Fire Pass テンプレート（テキスト + 画像入力、OpenAI 互換 API、デフォルトコスト 0）を複製し、ID が Kimi のパターンに一致する場合は思考を自動的に無効化します。GLM の動的 ID は、画像入力を含むカスタムモデルエントリを設定しない限り、テキスト専用として扱われます。

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
  <Accordion title="モデル ID のプレフィックスの仕組み">
    OpenClaw のすべての Fireworks モデル参照は `fireworks/` で始まり、その後に Fireworks プラットフォーム上の正確な ID またはルーターパスが続きます。例:

    - ルーターモデル: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - 直接指定モデル: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw は API リクエストを構築する際に `fireworks/` プレフィックスを取り除き、残りのパスを OpenAI 互換の `model` フィールドとして Fireworks エンドポイントに送信します。

  </Accordion>

  <Accordion title="Kimi の思考が強制的にオフになる理由">
    Fireworks は独立した推論チャネルなしで Kimi を提供するため、思考過程が表示される `content` ストリームに現れる可能性があります。OpenClaw は Fireworks Kimi へのすべてのリクエストで `thinking: { type: "disabled" }` を送信し、ペイロードから `reasoning`、`reasoning_effort`、`reasoningEffort` を取り除きます（`extensions/fireworks/stream.ts`）。プロバイダーポリシー（`extensions/fireworks/thinking-policy.ts`）は、Kimi モデル ID に対して `off` の思考レベルのみを公開するため、手動の `/think` 切り替えとプロバイダーポリシーの各画面は実行時の契約と一致した状態に保たれます。

    Kimi の推論をエンドツーエンドで使用するには、[Moonshot プロバイダー](/ja-JP/providers/moonshot)を設定し、同じモデルをそのプロバイダー経由でルーティングします。

  </Accordion>

  <Accordion title="デーモンでの環境変数の利用">
    Gateway が管理対象サービス（launchd、systemd、Docker）として実行されている場合、Fireworks キーは対話型シェルだけでなく、そのプロセスから参照できる必要があります。

    <Warning>
      対話型シェル内だけでエクスポートされたキーは、その環境も取り込まない限り、launchd または systemd デーモンでは利用できません。Gateway プロセスから読み取れるようにするには、キーを `~/.openclaw/.env` または `env.shellEnv` で設定してください。
    </Warning>

    OpenClaw は設定の読み込み時に `~/.openclaw/.env` を読み込むため、そこに保存されたキーはすべてのプラットフォームで管理対象の Gateway サービスから利用できます。キーをローテーションした後は、Gateway を再起動するか、`openclaw doctor --fix` を再実行してください。

  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択方法。
  </Card>
  <Card title="思考モード" href="/ja-JP/tools/thinking" icon="brain">
    `/think` レベル、プロバイダーポリシー、推論対応モデルのルーティング。
  </Card>
  <Card title="Moonshot" href="/ja-JP/providers/moonshot" icon="moon">
    Moonshot 独自の API を通じて、ネイティブの思考出力を使用して Kimi を実行します。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングとよくある質問。
  </Card>
</CardGroup>
