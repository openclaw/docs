---
read_when:
    - OpenClaw で Qwen を使いたい場合
    - 以前に Qwen OAuth を使っていた場合
summary: OpenClaw の同梱 qwen provider 経由で Qwen Cloud を使う
title: Qwen
x-i18n:
    generated_at: "2026-04-23T14:08:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70726b64202d8167f7879320281bde86d69ffa4c40117a53352922eb65d66400
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**Qwen OAuth は削除されました。**  
`portal.qwen.ai` エンドポイントを使っていた無料枠の OAuth 統合
（`qwen-portal`）は、現在は利用できません。背景については
[Issue #49557](https://github.com/openclaw/openclaw/issues/49557) を参照してください。

</Warning>

OpenClaw は現在、Qwen を正規 id `qwen` を持つ第一級の同梱 provider として扱います。同梱 provider は Qwen Cloud / Alibaba DashScope および Coding Plan エンドポイントを対象とし、従来の `modelstudio` id も互換エイリアスとして引き続き動作します。

- Provider: `qwen`
- 推奨環境変数: `QWEN_API_KEY`
- 互換性のため引き続き受け付けるもの: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API 形式: OpenAI 互換

<Tip>
`qwen3.6-plus` を使いたい場合は、**Standard（従量課金）** エンドポイントを推奨します。Coding Plan の対応は公開カタログより遅れることがあります。
</Tip>

## はじめに

プラン種別を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="Coding Plan（サブスクリプション）">
    **最適な用途:** Qwen Coding Plan を通じたサブスクリプションベースのアクセス。

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
    従来の `modelstudio-*` auth-choice id と `modelstudio/...` モデル ref も互換エイリアスとして引き続き動作しますが、新しいセットアップフローでは正規の `qwen-*` auth-choice id と `qwen/...` モデル ref を推奨します。
    </Note>

  </Tab>

  <Tab title="Standard（従量課金）">
    **最適な用途:** Standard Model Studio エンドポイントを通じた従量課金アクセス。`qwen3.6-plus` のように Coding Plan では利用できない場合があるモデルも含まれます。

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
    従来の `modelstudio-*` auth-choice id と `modelstudio/...` モデル ref も互換エイリアスとして引き続き動作しますが、新しいセットアップフローでは正規の `qwen-*` auth-choice id と `qwen/...` モデル ref を推奨します。
    </Note>

  </Tab>
</Tabs>

## プラン種別とエンドポイント

| プラン                     | リージョン | Auth choice                | エンドポイント                                   |
| -------------------------- | ---------- | -------------------------- | ------------------------------------------------ |
| Standard（従量課金）       | China      | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard（従量課金）       | Global     | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan（サブスクリプション） | China      | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan（サブスクリプション） | Global     | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

この provider は auth choice に基づいて自動的にエンドポイントを選択します。正規の choice は `qwen-*` 系を使い、`modelstudio-*` は互換専用のままです。config でカスタム `baseUrl` を指定して上書きすることもできます。

<Tip>
**キー管理:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**ドキュメント:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## 組み込みカタログ

OpenClaw は現在、以下の同梱 Qwen カタログを提供しています。設定済みカタログはエンドポイント対応であり、Coding Plan 設定では Standard エンドポイントでのみ動作が確認されているモデルは除外されます。

| モデル ref                  | 入力        | コンテキスト | 注記                                               |
| --------------------------- | ----------- | ------------ | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000    | デフォルトモデル                                   |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000    | このモデルが必要な場合は Standard エンドポイントを推奨 |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144      | Qwen Max 系列                                      |
| `qwen/qwen3-coder-next`     | text        | 262,144      | Coding                                             |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000    | Coding                                             |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000    | reasoning 有効                                     |
| `qwen/glm-5`                | text        | 202,752      | GLM                                                |
| `qwen/glm-4.7`              | text        | 202,752      | GLM                                                |
| `qwen/kimi-k2.5`            | text, image | 262,144      | Alibaba 経由の Moonshot AI                         |

<Note>
モデルが同梱カタログに含まれていても、エンドポイントや課金プランによって利用可否は異なる場合があります。
</Note>

## マルチモーダル拡張

`qwen` Plugin は、**Standard**
DashScope エンドポイント（Coding Plan エンドポイントではありません）でマルチモーダル機能も公開します。

- **動画理解** は `qwen-vl-max-latest`
- **Wan 動画生成** は `wan2.6-t2v`（デフォルト）、`wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Qwen をデフォルトの動画 provider として使うには:

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
共有ツールパラメーター、provider 選択、フェイルオーバー動作については [動画生成](/ja-JP/tools/video-generation) を参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="画像と動画の理解">
    同梱 Qwen Plugin は、**Standard** DashScope エンドポイント（Coding Plan エンドポイントではありません）で画像と動画のメディア理解を登録します。

    | プロパティ      | 値                    |
    | --------------- | --------------------- |
    | モデル          | `qwen-vl-max-latest`  |
    | サポート入力    | 画像、動画            |

    メディア理解は設定済み Qwen 認証から自動解決されるため、追加設定は不要です。メディア理解を使うには Standard（従量課金）エンドポイントを使っていることを確認してください。

  </Accordion>

  <Accordion title="Qwen 3.6 Plus の利用可否">
    `qwen3.6-plus` は、Standard（従量課金）Model Studio
    エンドポイントで利用できます。

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Coding Plan エンドポイントで
    `qwen3.6-plus` に対して「unsupported model」エラーが返る場合は、Coding Plan
    のエンドポイント/キー組ではなく Standard（従量課金）へ切り替えてください。

  </Accordion>

  <Accordion title="capability 計画">
    `qwen` Plugin は、単なる coding/text モデルではなく、Qwen
    Cloud 全体の vendor ホームとして位置付けられています。

    - **Text/chat モデル:** 現在同梱
    - **Tool calling、構造化出力、thinking:** OpenAI 互換トランスポートから継承
    - **画像生成:** provider Plugin レイヤーで対応予定
    - **画像/動画理解:** Standard エンドポイントで現在同梱
    - **音声/audio:** provider Plugin レイヤーで対応予定
    - **メモリ embeddings/reranking:** embedding アダプターサーフェス経由で対応予定
    - **動画生成:** 共有動画生成 capability を通じて現在同梱

  </Accordion>

  <Accordion title="動画生成の詳細">
    動画生成では、OpenClaw は設定された Qwen リージョンを、ジョブ送信前に対応する
    DashScope AIGC ホストへマッピングします。

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    つまり、`models.providers.qwen.baseUrl` が Coding Plan または Standard の Qwen ホストのどちらを指していても、動画生成は引き続き正しいリージョンの DashScope 動画エンドポイントで行われます。

    現在の同梱 Qwen 動画生成の制限:

    - リクエストあたり最大 **1** 本の出力動画
    - 最大 **1** 枚の入力画像
    - 最大 **4** 本の入力動画
    - 最大 **10 秒** の長さ
    - `size`, `aspectRatio`, `resolution`, `audio`, `watermark` をサポート
    - 参照画像/動画モードは現在 **remote http(s) URL** が必要です。DashScope 動画エンドポイントはそれらの参照に対してアップロードされたローカルバッファーを受け付けないため、ローカルファイルパスは事前に拒否されます。

  </Accordion>

  <Accordion title="ストリーミング使用量互換性">
    ネイティブ Model Studio エンドポイントは、共有
    `openai-completions` トランスポート上でストリーミング使用量互換性を公開します。OpenClaw は現在これをエンドポイント capability に基づいて判定するため、同じネイティブホストを対象とする DashScope 互換の custom provider id も、組み込み `qwen` provider id 固有である必要なく同じストリーミング使用量動作を継承します。

    ネイティブのストリーミング使用量互換性は、Coding Plan ホストと
    Standard DashScope 互換ホストの両方に適用されます。

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="マルチモーダルエンドポイントのリージョン">
    マルチモーダルサーフェス（動画理解と Wan 動画生成）は、Coding Plan エンドポイントではなく、**Standard** DashScope エンドポイントを使います。

    - Global/Intl Standard base URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - China Standard base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="環境変数とデーモン設定">
    Gateway をデーモンとして実行する場合（launchd/systemd）、`QWEN_API_KEY` がそのプロセスから利用可能であることを確認してください（たとえば `~/.openclaw/.env` または
    `env.shellEnv` 経由）。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、モデル ref、フェイルオーバー動作の選び方。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールパラメーターと provider 選択。
  </Card>
  <Card title="Alibaba（ModelStudio）" href="/ja-JP/providers/alibaba" icon="cloud">
    従来の ModelStudio provider と移行メモ。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングと FAQ。
  </Card>
</CardGroup>
