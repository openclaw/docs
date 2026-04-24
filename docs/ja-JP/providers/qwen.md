---
read_when:
    - OpenClaw で Qwen を使いたい場合
    - 以前に Qwen OAuth を使っていた場合
summary: OpenClaw の bundled qwen provider 経由で Qwen Cloud を使う
title: Qwen
x-i18n:
    generated_at: "2026-04-24T05:16:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3601722ed12e7e0441ec01e6a9e6b205a39a7ecfb599e16dad3bbfbdbf34ee83
    source_path: providers/qwen.md
    workflow: 15
---

<Warning>

**Qwen OAuth は削除されました。** `portal.qwen.ai` エンドポイントを使っていた
無料 tier の OAuth 統合
（`qwen-portal`）は、もう利用できません。背景については
[Issue #49557](https://github.com/openclaw/openclaw/issues/49557) を参照してください。

</Warning>

OpenClaw は現在、Qwen を正規 ID
`qwen` を持つ第一級の bundled provider として扱います。bundled provider は
Qwen Cloud / Alibaba DashScope と
Coding Plan エンドポイントを対象にしつつ、旧来の `modelstudio` ID を互換エイリアスとして維持します。

- Provider: `qwen`
- 推奨 env var: `QWEN_API_KEY`
- 互換性のために受け付けるもの: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API スタイル: OpenAI 互換

<Tip>
`qwen3.6-plus` を使いたい場合は、**Standard（従量課金）** エンドポイントを推奨します。
Coding Plan 側のサポートは、公開カタログより遅れることがあります。
</Tip>

## はじめに

希望するプラン種別を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="Coding Plan（サブスクリプション）">
    **最適な用途:** Qwen Coding Plan 経由のサブスクリプション型アクセス。

    <Steps>
      <Step title="API キーを取得する">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) で API キーを作成またはコピーします。
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
    旧来の `modelstudio-*` auth-choice ID と `modelstudio/...` model ref は
    互換エイリアスとして引き続き動作しますが、新しいセットアップフローでは正規の
    `qwen-*` auth-choice ID と `qwen/...` model ref を優先してください。
    </Note>

  </Tab>

  <Tab title="Standard（従量課金）">
    **最適な用途:** Standard Model Studio エンドポイント経由の従量課金アクセス。`qwen3.6-plus` のように Coding Plan では利用できない可能性があるモデルも含みます。

    <Steps>
      <Step title="API キーを取得する">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) で API キーを作成またはコピーします。
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
    旧来の `modelstudio-*` auth-choice ID と `modelstudio/...` model ref は
    互換エイリアスとして引き続き動作しますが、新しいセットアップフローでは正規の
    `qwen-*` auth-choice ID と `qwen/...` model ref を優先してください。
    </Note>

  </Tab>
</Tabs>

## プラン種別とエンドポイント

| プラン                       | リージョン | Auth choice                | エンドポイント                                     |
| ---------------------------- | ---------- | -------------------------- | -------------------------------------------------- |
| Standard（従量課金）         | China      | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`        |
| Standard（従量課金）         | Global     | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1`   |
| Coding Plan（サブスクリプション） | China      | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`                 |
| Coding Plan（サブスクリプション） | Global     | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`            |

provider は、あなたの auth choice に基づいてエンドポイントを自動選択します。正規
choice では `qwen-*` ファミリーを使い、`modelstudio-*` は互換専用です。
config 内でカスタム `baseUrl` を使って上書きすることもできます。

<Tip>
**キー管理:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**ドキュメント:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## 組み込みカタログ

OpenClaw は現在、この bundled Qwen カタログを同梱しています。設定されたカタログは
エンドポイント認識型で、Coding Plan 構成では Standard エンドポイントでしか動かないと分かっているモデルを省略します。

| Model ref                   | 入力        | コンテキスト | 備考                                               |
| --------------------------- | ----------- | ------------ | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000    | デフォルトモデル                                   |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000    | このモデルが必要なら Standard エンドポイント推奨   |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144      | Qwen Max 系列                                      |
| `qwen/qwen3-coder-next`     | text        | 262,144      | Coding                                             |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000    | Coding                                             |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000    | Reasoning 有効                                     |
| `qwen/glm-5`                | text        | 202,752      | GLM                                                |
| `qwen/glm-4.7`              | text        | 202,752      | GLM                                                |
| `qwen/kimi-k2.5`            | text, image | 262,144      | Alibaba 経由の Moonshot AI                         |

<Note>
モデルが bundled カタログに存在していても、利用可否はエンドポイントと課金プランによって異なることがあります。
</Note>

## マルチモーダル拡張

`qwen` Plugin は、**Standard**
DashScope エンドポイント（Coding Plan エンドポイントではありません）上で、マルチモーダル capability も公開します。

- **動画理解** は `qwen-vl-max-latest` 経由
- **Wan 動画生成** は `wan2.6-t2v`（デフォルト）、`wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v` 経由

Qwen をデフォルト動画 provider として使うには:

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
共有 tool パラメーター、provider 選択、failover 動作については [Video Generation](/ja-JP/tools/video-generation) を参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="画像と動画理解">
    bundled Qwen Plugin は、**Standard** DashScope エンドポイント（Coding Plan エンドポイントではありません）上で
    画像と動画の media understanding を登録します。

    | プロパティ       | 値                    |
    | ---------------- | --------------------- |
    | モデル           | `qwen-vl-max-latest`  |
    | サポート入力     | Images, video         |

    media understanding は、設定済みの Qwen auth から自動解決されます。追加
    config は不要です。media understanding サポートには Standard（従量課金）
    エンドポイントを使っていることを確認してください。

  </Accordion>

  <Accordion title="Qwen 3.6 Plus の利用可否">
    `qwen3.6-plus` は Standard（従量課金）Model Studio
    エンドポイントで利用できます。

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Coding Plan エンドポイントが
    `qwen3.6-plus` に対して "unsupported model" エラーを返す場合は、Coding Plan
    エンドポイント/キーの組み合わせではなく、Standard（従量課金）に切り替えてください。

  </Accordion>

  <Accordion title="Capability plan">
    `qwen` Plugin は、coding/text モデルだけでなく、完全な Qwen
    Cloud サーフェスの vendor ホームとして位置付けられつつあります。

    - **Text/chat モデル:** 現在 bundled
    - **Tool calling, structured output, thinking:** OpenAI 互換トランスポートから継承
    - **画像生成:** provider-Plugin レイヤーで計画中
    - **画像/動画理解:** 現在 bundled（Standard エンドポイント上）
    - **Speech/audio:** provider-Plugin レイヤーで計画中
    - **Memory embeddings/reranking:** embedding adapter サーフェス経由で計画中
    - **動画生成:** 共有 video-generation capability を通じて現在 bundled

  </Accordion>

  <Accordion title="動画生成の詳細">
    動画生成では、OpenClaw はジョブ送信前に、設定された Qwen region を対応する
    DashScope AIGC ホストへマッピングします。

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    つまり、`models.providers.qwen.baseUrl` が
    Coding Plan または Standard Qwen ホストのどちらを指していても、動画生成は引き続き正しい
    regional DashScope 動画エンドポイント上で動作します。

    現在の bundled Qwen 動画生成の制限:

    - リクエストごとに最大 **1** 本の出力動画
    - 入力画像は最大 **1** 枚
    - 入力動画は最大 **4** 本
    - duration は最大 **10 秒**
    - `size`, `aspectRatio`, `resolution`, `audio`, `watermark` をサポート
    - 参照画像/動画モードでは現在 **リモート http(s) URL** が必要です。ローカル
      ファイルパスは、DashScope 動画エンドポイントがそれらの参照に対してローカル
      buffer のアップロードを受け付けないため、事前に拒否されます。

  </Accordion>

  <Accordion title="ストリーミング使用量互換性">
    ネイティブ Model Studio エンドポイントは、共有 `openai-completions` トランスポート上で
    ストリーミング使用量互換性を公開します。OpenClaw は現在これをエンドポイント
    capability から判断するため、同じネイティブホストを指す DashScope 互換カスタム provider ID も、
    組み込みの `qwen` provider ID を特別に要求することなく、同じストリーミング使用量動作を継承します。

    ネイティブストリーミング使用量互換性は、Coding Plan ホストと
    Standard DashScope 互換ホストの両方に適用されます。

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="マルチモーダルエンドポイントのリージョン">
    マルチモーダルサーフェス（動画理解と Wan 動画生成）は、
    Coding Plan エンドポイントではなく **Standard** DashScope エンドポイントを使います。

    - Global/Intl Standard base URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - China Standard base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="環境と daemon セットアップ">
    Gateway が daemon（launchd/systemd）として動作する場合は、`QWEN_API_KEY` が
    そのプロセスから利用可能であることを確認してください（たとえば `~/.openclaw/.env` や
    `env.shellEnv` 経由）。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、model ref、failover 動作の選び方。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画 tool パラメーターと provider 選択。
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/ja-JP/providers/alibaba" icon="cloud">
    旧来の ModelStudio provider と移行メモ。
  </Card>
  <Card title="Troubleshooting" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングと FAQ。
  </Card>
</CardGroup>
