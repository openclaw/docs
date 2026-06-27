---
read_when:
    - OpenClawでAlibaba Wan動画生成を使用したい場合
    - 動画生成には Model Studio または DashScope API キーの設定が必要です
summary: OpenClaw での Alibaba Model Studio Wan 動画生成
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-05-06T05:15:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: c390da201e2c8685fafa6171a6028bf18fc676b2d46f784651f91cdc6137fdf2
    source_path: providers/alibaba.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw には、Alibaba Model Studio（DashScope の国際名）の Wan モデル向け動画生成プロバイダーを登録する、バンドル済みの `alibaba` Plugin が付属しています。この Plugin はデフォルトで有効です。API キーを設定するだけで使用できます。

| プロパティ           | 値                                                                              |
| -------------------- | ------------------------------------------------------------------------------- |
| プロバイダーID       | `alibaba`                                                                       |
| Plugin               | バンドル済み、`enabledByDefault: true`                                          |
| 認証環境変数         | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY`（最初の一致が有効） |
| オンボーディングフラグ | `--auth-choice alibaba-model-studio-api-key`                                    |
| 直接 CLI フラグ      | `--alibaba-model-studio-api-key <key>`                                          |
| デフォルトモデル     | `alibaba/wan2.6-t2v`                                                            |
| デフォルトのベース URL | `https://dashscope-intl.aliyuncs.com`                                           |

## はじめに

<Steps>
  <Step title="Set an API key">
    オンボーディングを使用して、`alibaba` プロバイダーにキーを保存します。

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    または、インストール/オンボーディング時にキーを直接渡します。

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    または、Gateway を起動する前に、受け付けられる環境変数のいずれかをエクスポートします。

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # or DASHSCOPE_API_KEY=...
    # or QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Set a default video model">
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
  <Step title="Verify the provider is configured">
    ```bash
    openclaw models list --provider alibaba
    ```

    一覧には、バンドル済みの 5 つの Wan モデルすべてが含まれているはずです。`MODELSTUDIO_API_KEY` を解決できない場合、`openclaw models status --json` は不足している認証情報を `auth.unusableProfiles` の下に報告します。

  </Step>
</Steps>

<Note>
  Alibaba Plugin と [Qwen Plugin](/ja-JP/providers/qwen) はどちらも DashScope に対して認証し、重複する環境変数を受け付けます。専用の Wan 動画サーフェスを使用するには `alibaba/...` モデルIDを使います。Qwen のチャット、埋め込み、またはメディア理解サーフェスを使いたい場合は `qwen/...` ID を使います。
</Note>

## 組み込み Wan モデル

| モデル参照                 | モード                    |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | テキストから動画（デフォルト） |
| `alibaba/wan2.6-i2v`       | 画像から動画              |
| `alibaba/wan2.6-r2v`       | 参照から動画              |
| `alibaba/wan2.6-r2v-flash` | 参照から動画（高速）      |
| `alibaba/wan2.7-r2v`       | 参照から動画              |

## 機能と制限

バンドル済みプロバイダーは、DashScope の Wan 動画 API の上限に合わせています。3 つのモードすべてで、リクエストあたりの動画数と時間の上限は同じです。異なるのは入力形式のみです。

| モード             | 最大出力動画数 | 最大入力画像数 | 最大入力動画数 | 最大時間 | 対応する制御項目                                          |
| ------------------ | -------------- | -------------- | -------------- | -------- | --------------------------------------------------------- |
| テキストから動画   | 1              | n/a            | n/a            | 10 秒    | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| 画像から動画       | 1              | 1              | n/a            | 10 秒    | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| 参照から動画       | 1              | n/a            | 4              | 10 秒    | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

リクエストで `durationSeconds` を省略した場合、プロバイダーは DashScope が受け付けるデフォルトの **5 秒** を送信します。最大 10 秒まで延長するには、[動画生成ツール](/ja-JP/tools/video-generation)で `durationSeconds` を明示的に設定します。

<Warning>
  参照画像と動画の入力は、リモートの `http(s)` URL である必要があります。ローカルファイルパスは DashScope の参照モードでは受け付けられません。先にオブジェクトストレージへアップロードするか、すでに公開 URL を生成する [media tool](/ja-JP/tools/media-overview) フローを使用してください。
</Warning>

## 高度な設定

<AccordionGroup>
  <Accordion title="Override the DashScope base URL">
    プロバイダーはデフォルトで国際版 DashScope エンドポイントを使用します。中国リージョンのエンドポイントを対象にするには、次のように設定します。

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

    プロバイダーは AIGC タスク URL を構築する前に、末尾のスラッシュを取り除きます。

  </Accordion>

  <Accordion title="Auth env priority">
    OpenClaw は、環境変数から次の順序で Alibaba API キーを解決し、最初の空でない値を使用します。

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    設定済みの `auth.profiles` エントリ（`openclaw models auth login` で設定）は、環境変数による解決を上書きします。プロファイルのローテーション、クールダウン、上書きの仕組みについては、[モデル FAQ の認証プロファイル](/ja-JP/help/faq-models#what-is-an-auth-profile)を参照してください。

  </Accordion>

  <Accordion title="Relationship to the Qwen plugin">
    バンドル済みの両 Plugin は DashScope と通信し、重複する API キーを受け付けます。次のように使い分けます。

    - このページで説明している専用の Wan 動画プロバイダーを使用するには、`alibaba/wan*.*` ID を使います。
    - Qwen のチャット、埋め込み、メディア理解には `qwen/*` ID を使います（[Qwen](/ja-JP/providers/qwen) を参照）。

    認証環境変数の一覧は意図的に重複しているため、`MODELSTUDIO_API_KEY` を一度設定すれば両方の Plugin が認証されます。各 Plugin を個別にオンボーディングする必要はありません。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Video generation" href="/ja-JP/tools/video-generation" icon="video">
    共有の動画ツールパラメーターとプロバイダー選択。
  </Card>
  <Card title="Qwen" href="/ja-JP/providers/qwen" icon="microchip">
    同じ DashScope 認証を使用する Qwen のチャット、埋め込み、メディア理解のセットアップ。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    エージェントのデフォルトとモデル設定。
  </Card>
  <Card title="Models FAQ" href="/ja-JP/help/faq-models" icon="circle-question">
    認証プロファイル、モデル切り替え、「no profile」エラーの解決。
  </Card>
</CardGroup>
