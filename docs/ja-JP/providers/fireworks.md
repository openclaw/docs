---
read_when:
    - OpenClaw で Fireworks を使用したい
    - Fireworks APIキー環境変数またはデフォルトのモデルIDが必要です
    - Fireworks で Kimi の思考オフ動作をデバッグしています
summary: Fireworks のセットアップ（認証 + モデル選択）
title: 花火
x-i18n:
    generated_at: "2026-06-27T12:42:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7413ec9ea192921ce9b9ec51da5b0b9ff1030feeef192afbefc938ed200e192e
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) は、OpenAI 互換 API を通じてオープンウェイトモデルとルーティング済みモデルを公開しています。公式の Fireworks プロバイダーPluginをインストールすると、事前にカタログ化された 2 つの Kimi モデルと、任意の Fireworks モデルまたはルーター ID を実行時に使用できます。

| プロパティ      | 値                                                     |
| --------------- | ------------------------------------------------------ |
| プロバイダー ID | `fireworks`（エイリアス: `fireworks-ai`）              |
| パッケージ      | `@openclaw/fireworks-provider`                         |
| 認証環境変数    | `FIREWORKS_API_KEY`                                    |
| オンボーディングフラグ | `--auth-choice fireworks-api-key`                |
| 直接 CLI フラグ | `--fireworks-api-key <key>`                            |
| API             | OpenAI 互換（`openai-completions`）                    |
| ベース URL      | `https://api.fireworks.ai/inference/v1`                |
| デフォルトモデル | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| デフォルトエイリアス | `Kimi K2.5 Turbo`                                  |

## はじめに

<Steps>
  <Step title="Pluginをインストールする">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Fireworks API キーを設定する">
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

    オンボーディングは、認証プロファイル内の `fireworks` プロバイダーにキーを保存し、**Fire Pass** Kimi K2.5 Turbo ルーターをデフォルトモデルとして設定します。

  </Step>
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider fireworks
    ```

    一覧には `Kimi K2.6` と `Kimi K2.5 Turbo (Fire Pass)` が含まれているはずです。`FIREWORKS_API_KEY` が解決できない場合、`openclaw models status --json` は不足している認証情報を `auth.unusableProfiles` の下に報告します。

  </Step>
</Steps>

## 非対話セットアップ

スクリプト化されたインストールや CI インストールでは、すべてをコマンドラインで渡します。

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## 組み込みカタログ

| モデル参照                                             | 名前                        | 入力         | コンテキスト | 最大出力   | 思考                 |
| ------------------------------------------------------ | --------------------------- | ------------ | ------------ | ---------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | テキスト + 画像 | 262,144   | 262,144    | 強制オフ             |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | テキスト + 画像 | 256,000   | 256,000    | 強制オフ（デフォルト） |

<Note>
  Fireworks は本番環境で Kimi の思考パラメーターを拒否するため、OpenClaw はすべての Fireworks Kimi モデルを `thinking: off` に固定します。同じモデルを [Moonshot](/ja-JP/providers/moonshot) 経由で直接ルーティングすると、Kimi の推論出力が保持されます。プロバイダー間の切り替えについては、[思考モード](/ja-JP/tools/thinking)を参照してください。
</Note>

## カスタム Fireworks モデル ID

OpenClaw は実行時に任意の Fireworks モデルまたはルーター ID を受け入れます。Fireworks に表示される正確な ID を使用し、その先頭に `fireworks/` を付けてください。動的解決は Fire Pass テンプレート（テキスト + 画像入力、OpenAI 互換 API、デフォルトコスト 0）を複製し、ID が Kimi パターンに一致する場合は思考を自動的に無効化します。GLM の動的 ID は、画像入力付きのカスタムモデルエントリを構成しない限り、テキスト専用としてマークされます。

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
  <Accordion title="モデル ID のプレフィックス付けの仕組み">
    OpenClaw のすべての Fireworks モデル参照は、`fireworks/` で始まり、その後に Fireworks プラットフォーム上の正確な ID またはルーターパスが続きます。例:

    - ルーターモデル: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - 直接モデル: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw は API リクエストを構築するときに `fireworks/` プレフィックスを取り除き、残りのパスを OpenAI 互換の `model` フィールドとして Fireworks エンドポイントに送信します。

  </Accordion>

  <Accordion title="Kimi で思考が強制オフになる理由">
    Fireworks K2.6 は、Kimi が Moonshot 独自の API 経由では思考をサポートしているにもかかわらず、リクエストに `reasoning_*` パラメーターが含まれていると 400 を返します。プロバイダーポリシー（`extensions/fireworks/thinking-policy.ts`）は Kimi モデル ID に対して `off` の思考レベルのみを公開するため、手動の `/think` 切り替えとプロバイダーポリシーのサーフェスは実行時コントラクトと整合します。

    Kimi の推論をエンドツーエンドで使用するには、[Moonshot プロバイダー](/ja-JP/providers/moonshot)を構成し、同じモデルをその経由でルーティングしてください。

  </Accordion>

  <Accordion title="デーモンでの環境利用可能性">
    Gateway が管理サービス（launchd、systemd、Docker）として実行される場合、Fireworks キーは対話型シェルだけでなく、そのプロセスから見える必要があります。

    <Warning>
      対話型シェルでのみエクスポートされたキーは、その環境もそこにインポートされていない限り、launchd または systemd デーモンには役立ちません。Gateway プロセスから読み取れるように、キーを `~/.openclaw/.env` または `env.shellEnv` 経由で設定してください。
    </Warning>

    macOS では、`openclaw gateway install` がすでに `~/.openclaw/.env` を LaunchAgent 環境ファイルに接続します。キーをローテーションした後は、インストールを再実行するか、`openclaw doctor --fix` を実行してください。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="思考モード" href="/ja-JP/tools/thinking" icon="brain">
    `/think` レベル、プロバイダーポリシー、推論対応モデルのルーティング。
  </Card>
  <Card title="Moonshot" href="/ja-JP/providers/moonshot" icon="moon">
    Moonshot 独自の API を通じて、ネイティブな思考出力付きで Kimi を実行します。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングと FAQ。
  </Card>
</CardGroup>
