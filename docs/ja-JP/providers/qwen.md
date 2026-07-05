---
read_when:
    - OpenClaw で Qwen を使用したい
    - 以前に Qwen OAuth を使用しました
summary: OpenClaw プラグインを通じて Qwen Cloud を使用する
title: Qwen
x-i18n:
    generated_at: "2026-07-05T11:46:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3678ac0e56ee7cae00cb4a7e17a051734b288ebb4dfab47cb99e5b7ab745c3ce
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud は、正規 id `qwen` を持つ公式外部 OpenClaw プロバイダー Plugin です。Qwen Cloud / Alibaba DashScope Standard および Coding Plan エンドポイントを対象とし、互換エイリアスとしてレガシーの `modelstudio` id を引き続き動作させ、Qwen Portal トークンフローを別のプロバイダー [`qwen-oauth`](/ja-JP/providers/qwen-oauth) として公開します。

| プロパティ           | 値                                         |
| ---------------------- | ------------------------------------------ |
| プロバイダー         | `qwen`                                     |
| Portal プロバイダー  | [`qwen-oauth`](/ja-JP/providers/qwen-oauth)      |
| 推奨 env var         | `QWEN_API_KEY`                             |
| 互換で受け付けるもの | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| API スタイル         | OpenAI 互換                                |

<Tip>
`qwen3.6-plus` には **Standard（従量課金）** エンドポイントを使用してください。Coding Plan エンドポイントでは利用できません。
</Tip>

## Plugin をインストール

`qwen` は公式外部 Plugin として提供され、core にはバンドルされていません。インストールして Gateway を再起動します。

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## はじめに

プラン種別を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="Coding Plan（サブスクリプション）">
    **最適な用途:** Qwen Coding Plan 経由のサブスクリプションベースのアクセス。

    <Steps>
      <Step title="API キーを取得する">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) で API キーを作成またはコピーします。
      </Step>
      <Step title="オンボーディングを実行する">
        **グローバル** エンドポイントの場合:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        **中国** エンドポイントの場合:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    レガシーの `modelstudio-*` auth-choice id と `modelstudio/...` model ref は、互換エイリアスとして引き続き動作しますが、新しいセットアップフローでは正規の `qwen-*` auth-choice id と `qwen/...` model ref を優先してください。別の `api` 値を持つ厳密なカスタム `models.providers.modelstudio` エントリを定義した場合、そのカスタムプロバイダーが Qwen 互換エイリアスではなく `modelstudio/...` ref を所有します。
    </Note>

  </Tab>

  <Tab title="Standard（従量課金）">
    **最適な用途:** Coding Plan では利用できない `qwen3.6-plus` などのモデルを含む、Standard Model Studio エンドポイント経由の従量課金アクセス。

    <Steps>
      <Step title="API キーを取得する">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) で API キーを作成またはコピーします。
      </Step>
      <Step title="オンボーディングを実行する">
        **グローバル** エンドポイントの場合:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        **中国** エンドポイントの場合:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    レガシーの `modelstudio-*` auth-choice id と `modelstudio/...` model ref は、互換エイリアスとして引き続き動作しますが、新しいセットアップフローでは正規の `qwen-*` auth-choice id と `qwen/...` model ref を優先してください。別の `api` 値を持つ厳密なカスタム `models.providers.modelstudio` エントリを定義した場合、そのカスタムプロバイダーが Qwen 互換エイリアスではなく `modelstudio/...` ref を所有します。
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **最適な用途:** `https://portal.qwen.ai/v1` に対する Qwen Portal トークン。

    専用のプロバイダーページと移行メモについては、[Qwen OAuth / Portal](/ja-JP/providers/qwen-oauth) を参照してください。

    <Steps>
      <Step title="portal トークンを指定する">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen-oauth/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` は Qwen Cloud プロバイダーと同じ `QWEN_API_KEY` env var 名を使用しますが、OpenClaw オンボーディングで設定された場合は `qwen-oauth` プロバイダー id の下に認証を保存します。
    </Note>

  </Tab>
</Tabs>

## プラン種別とエンドポイント

| プラン                     | リージョン | 認証選択                   | エンドポイント                                   |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Coding Plan（サブスクリプション） | 中国   | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan（サブスクリプション） | グローバル | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                | グローバル | `qwen-oauth`               | `portal.qwen.ai/v1`                              |
| Standard（従量課金）       | 中国   | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard（従量課金）       | グローバル | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |

プロバイダーは認証選択に基づいてエンドポイントを自動選択します。正規の選択は `qwen-*` ファミリーを使用します。`modelstudio-*` は互換専用として残ります。設定内のカスタム `baseUrl` で上書きできます。

<Tip>
**キーの管理:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**ドキュメント:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## 組み込みカタログ

OpenClaw はこの Qwen 静的カタログを提供します。このカタログはエンドポイントを認識します。Coding Plan 設定では、Standard エンドポイントでのみ動作するモデルは省略されます。

| Model ref                   | 入力       | コンテキスト | 注記                    |
| --------------------------- | ----------- | --------- | ----------------------- |
| `qwen/qwen3.5-plus`         | テキスト、画像 | 1,000,000 | デフォルトモデル        |
| `qwen/qwen3.6-plus`         | テキスト、画像 | 1,000,000 | Standard エンドポイントのみ |
| `qwen/qwen3-max-2026-01-23` | テキスト   | 262,144   | Qwen Max ライン         |
| `qwen/qwen3-coder-next`     | テキスト   | 262,144   | コーディング            |
| `qwen/qwen3-coder-plus`     | テキスト   | 1,000,000 | コーディング            |
| `qwen/MiniMax-M2.5`         | テキスト   | 1,000,000 | 推論有効                |
| `qwen/glm-5`                | テキスト   | 202,752   | GLM                     |
| `qwen/glm-4.7`              | テキスト   | 202,752   | GLM                     |
| `qwen/kimi-k2.5`            | テキスト、画像 | 262,144   | Alibaba 経由の Moonshot AI |
| `qwen-oauth/qwen3.5-plus`   | テキスト、画像 | 1,000,000 | Qwen Portal デフォルト  |

<Note>
モデルが静的カタログに存在する場合でも、利用可否はエンドポイントと課金プランによって変わることがあります。
</Note>

## thinking 制御

`qwen/MiniMax-M2.5` は組み込みカタログで唯一の推論有効モデルです。`qwen` ファミリーの推論モデルでは、プロバイダーは OpenClaw の thinking レベルを DashScope のトップレベル `enable_thinking` リクエストフラグにマップします。thinking 無効時は `enable_thinking: false` を送信し、それ以外のレベルでは `enable_thinking: true` を送信します。カスタムモデルは、モデルエントリに `compat.thinkingFormat: "qwen-chat-template"` を設定することで、代替の chat-template thinking ペイロードを選択できます。

## マルチモーダルアドオン

`qwen` Plugin は、Coding Plan エンドポイントではなく **Standard** DashScope エンドポイントでのみマルチモーダル機能を公開します。

- `qwen-vl-max-latest` による **画像と動画の理解**
- `wan2.6-t2v`（デフォルト）、`wan2.6-i2v`、`wan2.6-r2v`、`wan2.6-r2v-flash`、`wan2.7-r2v` による **Wan 動画生成**

メディア理解は設定済みの Qwen 認証から自動解決されます。追加設定は不要です。メディア理解を動作させるには、Standard（従量課金）エンドポイントを使用していることを確認してください。

Qwen をデフォルトの動画プロバイダーにするには、次のように設定します。

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

動画生成の制限: リクエストごとに出力動画は 1 件、入力画像は最大 1 件（画像から動画）、入力動画は最大 4 件（動画から動画）、最大 duration は 10 秒です。`size`、`aspectRatio`、`resolution`、`audio`、`watermark` をサポートします。参照画像/動画入力にはリモート http(s) URL が必要です。DashScope 動画エンドポイントはこれらの参照用にアップロードされたローカルバッファを受け付けないため、ローカルファイルパスは事前に拒否されます。

<Note>
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation) を参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="Qwen 3.6 Plus の利用可否">
    `qwen3.6-plus` は Standard（従量課金）エンドポイントで利用できます。

    - 中国: `dashscope.aliyuncs.com/compatible-mode/v1`
    - グローバル: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Coding Plan エンドポイントが `qwen3.6-plus` に対して「unsupported model」エラーを返す場合は、Coding Plan エンドポイント/キーペアではなく Standard（従量課金）に切り替えてください。

    OpenClaw の Qwen 静的カタログは Coding Plan エンドポイントで `qwen3.6-plus` を提示しませんが、`models.providers.qwen.models` の下に明示的に設定された `qwen/qwen3.6-plus` エントリは Coding Plan ベース URL でも尊重されるため、Aliyun があなたのサブスクリプションで有効化した場合は、そのモデルを opt in できます。呼び出しが成功するかどうかは、引き続き upstream API が決定します。

  </Accordion>

  <Accordion title="動画生成のリージョンルーティング">
    OpenClaw は動画ジョブを送信する前に、設定済みの Qwen リージョンを対応する DashScope AIGC ホストにマップします。

    - グローバル/Intl: `https://dashscope-intl.aliyuncs.com`
    - 中国: `https://dashscope.aliyuncs.com`

    Coding Plan または Standard の Qwen ホストを指す通常の `models.providers.qwen.baseUrl` でも、動画生成は対応するリージョンの DashScope 動画エンドポイントにルーティングされます。

  </Accordion>

  <Accordion title="ストリーミング usage 互換性">
    ネイティブ Qwen エンドポイントは共有 `openai-completions` transport 上でストリーミング usage 互換性を提示するため、同じネイティブホストを対象とする DashScope 互換のカスタムプロバイダー id は、組み込みの `qwen` プロバイダー id を特に必要とせずに同じ動作を継承します。これは Coding Plan と Standard の両方のエンドポイントに適用されます。

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Capability 計画">
    `qwen` Plugin は、コーディング/テキストモデルだけでなく、Qwen Cloud 全体のベンダーホームとして位置付けられています。

    - **テキスト/チャットモデル:** プラグインを通じて利用可能
    - **ツール呼び出し、構造化出力、思考:** OpenAI 互換トランスポートから継承
    - **画像生成:** プロバイダープラグイン層で予定
    - **画像/動画理解:** Standard エンドポイントのプラグインを通じて利用可能
    - **音声/オーディオ:** プロバイダープラグイン層で予定
    - **メモリエンベディング/再ランキング:** エンベディングアダプターサーフェスを通じて予定
    - **動画生成:** 共有の動画生成機能を通じてプラグインから利用可能

  </Accordion>

  <Accordion title="環境とデーモンのセットアップ">
    Gateway がデーモン（launchd/systemd）として実行される場合は、`QWEN_API_KEY` が
    そのプロセスで利用可能であることを確認してください（たとえば、`~/.openclaw/.env` 内、または
    `env.shellEnv` 経由）。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="Alibaba Model Studio" href="/ja-JP/providers/alibaba" icon="cloud">
    同じ DashScope プラットフォーム上のバンドル済み Wan 動画生成プロバイダー。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングと FAQ。
  </Card>
</CardGroup>
