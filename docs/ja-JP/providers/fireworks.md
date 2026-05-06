---
read_when:
    - OpenClawでFireworksを使用したい場合
    - Fireworks API キーの環境変数またはデフォルトモデル ID が必要です
    - Kimi の思考オフ時の挙動を Fireworks でデバッグしています
summary: Fireworks のセットアップ（認証 + モデル選択）
title: 花火
x-i18n:
    generated_at: "2026-05-06T05:16:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a7dcaf6c7e1c004436213e67bc2262992ee1307cdaa5c290225345782f4cbfa
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) は、OpenAI 互換 API を通じてオープンウェイトモデルとルーティングされたモデルを公開しています。OpenClaw には、事前にカタログ化された 2 つの Kimi モデルを同梱し、実行時に任意の Fireworks モデルまたはルーター ID を受け付ける、バンドル済みの Fireworks プロバイダー Plugin が含まれています。

| プロパティ        | 値                                                     |
| --------------- | ------------------------------------------------------ |
| プロバイダー ID   | `fireworks` (エイリアス: `fireworks-ai`)                    |
| Plugin          | バンドル済み、`enabledByDefault: true`                      |
| 認証環境変数       | `FIREWORKS_API_KEY`                                    |
| オンボーディングフラグ | `--auth-choice fireworks-api-key`                      |
| 直接 CLI フラグ    | `--fireworks-api-key <key>`                            |
| API             | OpenAI 互換 (`openai-completions`)               |
| ベース URL        | `https://api.fireworks.ai/inference/v1`                |
| デフォルトモデル     | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| デフォルトエイリアス   | `Kimi K2.5 Turbo`                                      |

## はじめに

<Steps>
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

    オンボーディングは、認証プロファイル内の `fireworks` プロバイダーに対してキーを保存し、**Fire Pass** Kimi K2.5 Turbo ルーターをデフォルトモデルとして設定します。

  </Step>
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider fireworks
    ```

    一覧には `Kimi K2.6` と `Kimi K2.5 Turbo (Fire Pass)` が含まれているはずです。`FIREWORKS_API_KEY` が解決されていない場合、`openclaw models status --json` は不足している認証情報を `auth.unusableProfiles` の下に報告します。

  </Step>
</Steps>

## 非対話型セットアップ

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

| モデル参照                                             | 名前                        | 入力        | コンテキスト | 最大出力 | Thinking             |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ---------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | テキスト + 画像 | 262,144 | 262,144    | 強制的にオフ           |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | テキスト + 画像 | 256,000 | 256,000    | 強制的にオフ (デフォルト) |

<Note>
  Fireworks は本番環境で Kimi の thinking パラメーターを拒否するため、OpenClaw はすべての Fireworks Kimi モデルを `thinking: off` に固定します。同じモデルを [Moonshot](/ja-JP/providers/moonshot) 経由で直接ルーティングすると、Kimi の reasoning 出力が保持されます。プロバイダー間の切り替えについては、[thinking モード](/ja-JP/tools/thinking) を参照してください。
</Note>

## カスタム Fireworks モデル ID

OpenClaw は実行時に任意の Fireworks モデルまたはルーター ID を受け付けます。Fireworks に表示される正確な ID を使い、先頭に `fireworks/` を付けてください。動的解決は Fire Pass テンプレート (テキスト + 画像入力、OpenAI 互換 API、デフォルトコスト 0) を複製し、ID が Kimi パターンに一致する場合は thinking を自動的に無効化します。

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
  <Accordion title="モデル ID のプレフィックス付与の仕組み">
    OpenClaw のすべての Fireworks モデル参照は、`fireworks/` の後に Fireworks プラットフォームの正確な ID またはルーターパスを続けた形式で始まります。例:

    - ルーターモデル: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - 直接モデル: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw は API リクエストを構築するときに `fireworks/` プレフィックスを取り除き、残りのパスを OpenAI 互換の `model` フィールドとして Fireworks エンドポイントに送信します。

  </Accordion>

  <Accordion title="Kimi で thinking が強制的にオフになる理由">
    Fireworks K2.6 は、Kimi が Moonshot 独自の API 経由では thinking をサポートしているにもかかわらず、リクエストに `reasoning_*` パラメーターが含まれていると 400 を返します。バンドル済みポリシー (`extensions/fireworks/thinking-policy.ts`) は、Kimi モデル ID に対して `off` thinking レベルのみを公開するため、手動の `/think` 切り替えとプロバイダーポリシーの表示が実行時コントラクトと一致したままになります。

    Kimi reasoning をエンドツーエンドで使用するには、[Moonshot プロバイダー](/ja-JP/providers/moonshot) を設定し、同じモデルをそこからルーティングしてください。

  </Accordion>

  <Accordion title="デーモンでの環境の利用可能性">
    Gateway が管理サービス (launchd、systemd、Docker) として実行されている場合、Fireworks キーは対話型シェルだけでなく、そのプロセスからも見えている必要があります。

    <Warning>
      `~/.profile` にだけ置かれたキーは、その環境もそこに取り込まれていない限り、launchd または systemd デーモンには役立ちません。Gateway プロセスから読み取れるようにするには、キーを `~/.openclaw/.env` に設定するか、`env.shellEnv` 経由で設定してください。
    </Warning>

    macOS では、`openclaw gateway install` がすでに `~/.openclaw/.env` を LaunchAgent 環境ファイルに接続します。キーをローテーションした後は、インストールを再実行するか、`openclaw doctor --fix` を実行してください。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作を選択します。
  </Card>
  <Card title="Thinking モード" href="/ja-JP/tools/thinking" icon="brain">
    `/think` レベル、プロバイダーポリシー、reasoning 対応モデルのルーティング。
  </Card>
  <Card title="Moonshot" href="/ja-JP/providers/moonshot" icon="moon">
    Moonshot 独自の API 経由でネイティブ thinking 出力付きの Kimi を実行します。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングと FAQ。
  </Card>
</CardGroup>
