---
read_when:
    - OpenClaw で Qwen を使いたい
    - 以前に Qwen OAuth を使用しました
summary: OpenClaw Pluginを通じてQwen Cloudを使用する
title: Qwen
x-i18n:
    generated_at: "2026-06-27T12:49:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e42a38f3e7f2db54092886f2ef8c3ab27163c3c3d0f9b4d95affd58555f58d3
    source_path: providers/qwen.md
    workflow: 16
---

OpenClaw は、Qwen を正規 id `qwen` を持つ第一級のプロバイダー Plugin として扱うようになりました。プロバイダー Plugin は Qwen Cloud / Alibaba DashScope と Coding Plan エンドポイントを対象とし、レガシーの `modelstudio` id を互換性エイリアスとして引き続き動作させ、さらに Qwen Portal トークンフローをプロバイダー `qwen-oauth` として公開します。

- プロバイダー: `qwen`
- Portal プロバイダー: [`qwen-oauth`](/ja-JP/providers/qwen-oauth)
- 推奨環境変数: `QWEN_API_KEY`
- 互換性のために受け付けるもの: `MODELSTUDIO_API_KEY`、`DASHSCOPE_API_KEY`
- API スタイル: OpenAI 互換

<Tip>
`qwen3.6-plus` を使いたい場合は、**Standard (pay-as-you-go)** エンドポイントを優先してください。Coding Plan のサポートは公開カタログより遅れる場合があります。
</Tip>

## Plugin をインストールする

公式 Plugin をインストールしてから、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## はじめに

プラン種別を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="Coding Plan (subscription)">
    **最適な用途:** Qwen Coding Plan 経由のサブスクリプションベースのアクセス。

    <Steps>
      <Step title="API キーを取得する">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) から API キーを作成またはコピーします。
      </Step>
      <Step title="オンボーディングを実行する">
        **Global** エンドポイントの場合:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        **China** エンドポイントの場合:

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
    レガシーの `modelstudio-*` auth-choice id と `modelstudio/...` モデル参照は互換性エイリアスとして引き続き動作しますが、新しいセットアップフローでは正規の `qwen-*` auth-choice id と `qwen/...` モデル参照を優先してください。別の `api` 値を持つ完全一致のカスタム `models.providers.modelstudio` エントリを定義した場合、そのカスタムプロバイダーが Qwen 互換性エイリアスではなく `modelstudio/...` 参照を所有します。
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **最適な用途:** Standard Model Studio エンドポイント経由の従量課金アクセス。Coding Plan で利用できない場合がある `qwen3.6-plus` のようなモデルを含みます。

    <Steps>
      <Step title="API キーを取得する">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) から API キーを作成またはコピーします。
      </Step>
      <Step title="オンボーディングを実行する">
        **Global** エンドポイントの場合:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        **China** エンドポイントの場合:

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
    レガシーの `modelstudio-*` auth-choice id と `modelstudio/...` モデル参照は互換性エイリアスとして引き続き動作しますが、新しいセットアップフローでは正規の `qwen-*` auth-choice id と `qwen/...` モデル参照を優先してください。別の `api` 値を持つ完全一致のカスタム `models.providers.modelstudio` エントリを定義した場合、そのカスタムプロバイダーが Qwen 互換性エイリアスではなく `modelstudio/...` 参照を所有します。
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **最適な用途:** `https://portal.qwen.ai/v1` に対する Qwen Portal トークン。

    専用プロバイダーページと移行メモについては、[Qwen OAuth / Portal](/ja-JP/providers/qwen-oauth) を参照してください。

    <Steps>
      <Step title="Portal トークンを指定する">
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
    `qwen-oauth` は DashScope プロバイダーと同じ `QWEN_API_KEY` 環境変数名を使用しますが、OpenClaw オンボーディングで設定した場合は `qwen-oauth` プロバイダー id の下に認証情報を保存します。
    </Note>

  </Tab>
</Tabs>

## プラン種別とエンドポイント

| プラン                     | リージョン | 認証の選択               | エンドポイント                                   |
| -------------------------- | ---------- | ------------------------ | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China      | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global     | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | China      | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global     | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                | Global     | `qwen-oauth`               | `portal.qwen.ai/v1`                              |

プロバイダーは認証の選択に基づいてエンドポイントを自動選択します。正規の選択肢は `qwen-*` ファミリーを使用します。`modelstudio-*` は互換性専用として残ります。設定内のカスタム `baseUrl` で上書きできます。

<Tip>
**キーの管理:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**ドキュメント:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## 組み込みカタログ

OpenClaw は現在、この Qwen 静的カタログを同梱しています。設定されたカタログは
エンドポイントを認識します。Coding Plan 設定では、Standard エンドポイントでのみ
動作することが確認されているモデルは省略されます。

| モデル ref                  | 入力        | コンテキスト | メモ                                               |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | テキスト、画像 | 1,000,000 | デフォルトモデル                                   |
| `qwen/qwen3.6-plus`         | テキスト、画像 | 1,000,000 | このモデルが必要な場合は Standard エンドポイントを推奨 |
| `qwen/qwen3-max-2026-01-23` | テキスト       | 262,144   | Qwen Max ライン                                    |
| `qwen/qwen3-coder-next`     | テキスト       | 262,144   | コーディング                                       |
| `qwen/qwen3-coder-plus`     | テキスト       | 1,000,000 | コーディング                                       |
| `qwen/MiniMax-M2.5`         | テキスト       | 1,000,000 | 推論が有効                                         |
| `qwen/glm-5`                | テキスト       | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | テキスト       | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | テキスト、画像 | 262,144   | Alibaba 経由の Moonshot AI                         |
| `qwen-oauth/qwen3.5-plus`   | テキスト、画像 | 1,000,000 | Qwen Portal のデフォルト                           |

<Note>
モデルが静的カタログに存在する場合でも、可用性はエンドポイントと課金プランによって
変わることがあります。
</Note>

## 思考制御

推論が有効な Qwen Cloud モデルでは、プロバイダーが OpenClaw の
思考レベルを DashScope のトップレベル `enable_thinking` リクエストフラグにマッピングします。思考が無効な場合は
`enable_thinking: false` を送信し、それ以外の思考レベルでは
`enable_thinking: true` を送信します。

## マルチモーダルアドオン

`qwen` Plugin は、**Standard**
DashScope エンドポイント（Coding Plan エンドポイントではありません）でもマルチモーダル機能を公開します。

- `qwen-vl-max-latest` による**動画理解**
- `wan2.6-t2v`（デフォルト）、`wan2.6-i2v`、`wan2.6-r2v`、`wan2.6-r2v-flash`、`wan2.7-r2v` による **Wan 動画生成**

Qwen をデフォルトの動画プロバイダーとして使用するには:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation)を参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="Image and video understanding">
    Qwen Plugin は、**Standard** DashScope エンドポイント
    （Coding Plan エンドポイントではありません）で画像と動画のメディア理解を登録します。

    | プロパティ    | 値                    |
    | ------------- | --------------------- |
    | モデル        | `qwen-vl-max-latest`  |
    | 対応入力      | 画像、動画            |

    メディア理解は、設定済みの Qwen 認証から自動解決されます。追加設定は
    必要ありません。メディア理解のサポートには、Standard（従量課金）
    エンドポイントを使用していることを確認してください。

  </Accordion>

  <Accordion title="Qwen 3.6 Plus availability">
    `qwen3.6-plus` は、Standard（従量課金）Model Studio
    エンドポイントで利用できます。

    - 中国: `dashscope.aliyuncs.com/compatible-mode/v1`
    - グローバル: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Coding Plan エンドポイントが `qwen3.6-plus` に対して
    "unsupported model" エラーを返す場合は、Coding Plan の
    エンドポイント/キーの組み合わせではなく Standard（従量課金）に切り替えてください。

    OpenClaw の Qwen 静的カタログは、Coding
    Plan エンドポイント上で `qwen3.6-plus` を公開しませんが、
    `models.providers.qwen.models` 配下で明示的に設定された `qwen/qwen3.6-plus` エントリは
    Coding Plan baseUrls でも尊重されます。そのため、Aliyun がサブスクリプションで有効化した場合は、
    そのモデルをオプトインできます。呼び出しが成功するかどうかは
    上流 API が引き続き決定します。

  </Accordion>

  <Accordion title="Capability plan">
    `qwen` Plugin は、コーディング/テキストモデルだけでなく、Qwen
    Cloud 全体のサーフェスに対するベンダーのホームとして位置付けられつつあります。

    - **テキスト/チャットモデル:** Plugin を通じて利用可能
    - **ツール呼び出し、構造化出力、思考:** OpenAI 互換トランスポートから継承
    - **画像生成:** プロバイダー Plugin レイヤーで計画中
    - **画像/動画理解:** Standard エンドポイント上の Plugin を通じて利用可能
    - **音声/オーディオ:** プロバイダー Plugin レイヤーで計画中
    - **メモリエンベディング/リランキング:** エンベディングアダプターサーフェスを通じて計画中
    - **動画生成:** 共有動画生成機能を通じて Plugin から利用可能

  </Accordion>

  <Accordion title="Video generation details">
    動画生成では、OpenClaw はジョブを送信する前に、設定された Qwen リージョンを対応する
    DashScope AIGC ホストにマッピングします。

    - グローバル/Intl: `https://dashscope-intl.aliyuncs.com`
    - 中国: `https://dashscope.aliyuncs.com`

    つまり、Coding Plan または Standard Qwen ホストのいずれかを指す通常の
    `models.providers.qwen.baseUrl` でも、動画生成は正しい
    リージョンの DashScope 動画エンドポイントに維持されます。

    現在の Qwen 動画生成の制限:

    - リクエストあたり最大 **1** 本の出力動画
    - 最大 **1** 枚の入力画像
    - 最大 **4** 本の入力動画
    - 最大 **10 秒** の長さ
    - `size`、`aspectRatio`、`resolution`、`audio`、`watermark` をサポート
    - 参照画像/動画モードでは現在、**リモート http(s) URL** が必要です。ローカル
      ファイルパスは、DashScope 動画エンドポイントがそれらの参照用にアップロードされたローカルバッファーを
      受け付けないため、事前に拒否されます。

  </Accordion>

  <Accordion title="ストリーミング使用量の互換性">
    ネイティブ Model Studio エンドポイントは、共有 `openai-completions` トランスポートでストリーミング使用量の互換性を通知します。現在 OpenClaw はそれをエンドポイント機能に基づいて判定するため、同じネイティブホストを対象とする DashScope 互換のカスタムプロバイダー ID は、組み込みの `qwen` プロバイダー ID を明示的に必要とせず、同じストリーミング使用量の動作を継承します。

    ネイティブストリーミング使用量の互換性は、Coding Plan ホストと Standard DashScope 互換ホストの両方に適用されます。

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="マルチモーダルエンドポイントのリージョン">
    マルチモーダルサーフェス（動画理解と Wan 動画生成）は、Coding Plan エンドポイントではなく **Standard** DashScope エンドポイントを使用します。

    - Global/Intl Standard ベース URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - China Standard ベース URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="環境とデーモンのセットアップ">
    Gateway をデーモン（launchd/systemd）として実行する場合は、そのプロセスで `QWEN_API_KEY` を利用できるようにしてください（例: `~/.openclaw/.env` または `env.shellEnv` 経由）。
  </Accordion>
</AccordionGroup>

## 関連情報

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/ja-JP/providers/alibaba" icon="cloud">
    レガシー ModelStudio プロバイダーと移行メモ。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングと FAQ。
  </Card>
</CardGroup>
