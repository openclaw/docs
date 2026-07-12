---
read_when:
    - OpenClaw で Alibaba Wan の動画生成を使用したい場合
    - 動画生成には、Model Studio または DashScope の API キー設定が必要です
summary: OpenClawでのAlibaba Model Studio Wan動画生成
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-07-11T22:35:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

同梱の `alibaba` Plugin は、Alibaba Model Studio（DashScope の国際名称）上の Wan モデル向け動画生成プロバイダーを登録します。デフォルトで有効になっており、必要なのは API キーだけです。

| プロパティ       | 値                                                                              |
| ---------------- | ------------------------------------------------------------------------------- |
| プロバイダー ID  | `alibaba`                                                                       |
| Plugin           | 同梱、`enabledByDefault: true`                                                  |
| 認証環境変数     | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY`（最初の一致を使用） |
| オンボーディングフラグ | `--auth-choice alibaba-model-studio-api-key`                               |
| CLI 直接指定フラグ | `--alibaba-model-studio-api-key <key>`                                        |
| デフォルトモデル | `alibaba/wan2.6-t2v`                                                            |
| デフォルトのベース URL | `https://dashscope-intl.aliyuncs.com`                                      |

## はじめに

<Steps>
  <Step title="API キーを設定する">
    オンボーディングを通じて、`alibaba` プロバイダーにキーを保存します。

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    または、キーを直接渡します。

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    または、Gateway を起動する前に、受け付けられる環境変数のいずれかをエクスポートします。

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # または DASHSCOPE_API_KEY=...
    # または QWEN_API_KEY=...
    ```

  </Step>
  <Step title="デフォルトの動画モデルを設定する">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="プロバイダーが設定されていることを確認する">
    ```bash
    openclaw models list --provider alibaba
    ```

    一覧には、同梱されている 5 つの Wan モデルがすべて含まれます。`MODELSTUDIO_API_KEY` を解決できない場合、`openclaw models status --json` は不足している認証情報を `auth.unusableProfiles` に報告します。

  </Step>
</Steps>

<Note>
  Alibaba Plugin と [Qwen Plugin](/ja-JP/providers/qwen) は、どちらも DashScope に対して認証を行い、重複する環境変数を受け付けます。専用の Wan 動画機能には `alibaba/...` モデル ID を使用し、Qwen のチャット、埋め込み、メディア理解には `qwen/...` ID を使用してください。
</Note>

## 組み込みの Wan モデル

| モデル参照                 | モード                    |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | テキストから動画（デフォルト） |
| `alibaba/wan2.6-i2v`       | 画像から動画              |
| `alibaba/wan2.6-r2v`       | 参照素材から動画          |
| `alibaba/wan2.6-r2v-flash` | 参照素材から動画（高速）  |
| `alibaba/wan2.7-r2v`       | 参照素材から動画          |

## 機能と制限

3 つのモードはすべて、リクエストごとの動画数と再生時間の上限が同じで、入力形式のみが異なります。

| モード             | 最大出力動画数 | 最大入力画像数 | 最大入力動画数 | 最大再生時間 | 対応する制御                                              |
| ------------------ | -------------- | -------------- | -------------- | ------------ | --------------------------------------------------------- |
| テキストから動画   | 1              | 該当なし       | 該当なし       | 10 秒        | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| 画像から動画       | 1              | 1              | 該当なし       | 10 秒        | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| 参照素材から動画   | 1              | 該当なし       | 4              | 10 秒        | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

`durationSeconds` を省略したリクエストには、DashScope が受け付けるデフォルト値の **5 秒** が適用されます。最大 10 秒まで延長するには、[動画生成ツール](/ja-JP/tools/video-generation)で `durationSeconds` を明示的に設定してください。

<Warning>
  参照画像および動画の入力には、リモートの `http(s)` URL を使用する必要があります。DashScope の参照モードはローカルファイルパスを拒否します。先にオブジェクトストレージへアップロードするか、すでに公開 URL を生成する[メディアツール](/ja-JP/tools/media-overview)のフローを使用してください。
</Warning>

## 高度な設定

<AccordionGroup>
  <Accordion title="DashScope のベース URL を上書きする">
    プロバイダーは、デフォルトで DashScope の国際エンドポイントを使用します。中国リージョンのエンドポイントを使用するには、次のように設定します。

    ```json5
    {
      models: {
        providers: {
          alibaba: {
            baseUrl: "https://dashscope.aliyuncs.com",
          },
        },
      },
    }
    ```

    プロバイダーは、AIGC タスク URL を構築する前に末尾のスラッシュを削除します。

  </Accordion>

  <Accordion title="認証環境変数の優先順位">
    OpenClaw は、次の順序で環境変数から Alibaba API キーを解決し、最初の空でない値を使用します。

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    設定済みの `auth.profiles` エントリ（`openclaw models auth login` で設定）は、環境変数からの解決より優先されます。プロファイルのローテーション、クールダウン、上書きの仕組みについては、[モデル FAQ の認証プロファイル](/ja-JP/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them)を参照してください。

  </Accordion>

  <Accordion title="Qwen Plugin との関係">
    同梱されている両方の Plugin は DashScope と通信し、重複する API キーを受け付けます。用途に応じて次を使用してください。

    - このページで説明する専用の Wan 動画プロバイダーには、`alibaba/wan*.*` ID を使用します。
    - Qwen のチャット、埋め込み、メディア理解には、`qwen/*` ID を使用します（[Qwen](/ja-JP/providers/qwen)を参照）。

    認証環境変数の一覧は意図的に重複しているため、`MODELSTUDIO_API_KEY` を一度設定すれば、両方の Plugin が認証されます。各 Plugin を個別にオンボーディングする必要はありません。

  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共通の動画ツールパラメーターとプロバイダーの選択。
  </Card>
  <Card title="Qwen" href="/ja-JP/providers/qwen" icon="microchip">
    同じ DashScope 認証を使用する Qwen のチャット、埋め込み、メディア理解の設定。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    エージェントのデフォルト設定とモデル設定。
  </Card>
  <Card title="モデル FAQ" href="/ja-JP/help/faq-models" icon="circle-question">
    認証プロファイル、モデルの切り替え、「プロファイルなし」エラーの解決。
  </Card>
</CardGroup>
