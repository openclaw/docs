---
read_when:
    - OpenClawでOpenAIモデルを使いたい場合
    - APIキーではなく Codex のサブスクリプション認証を使いたい場合
    - GPT-5 エージェントの実行動作をより厳格にする必要があります
summary: OpenClaw で APIキーまたは Codex サブスクリプションを使用して OpenAI を利用する
title: OpenAI
x-i18n:
    generated_at: "2026-04-30T05:31:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: be0e2cd14990a53533c800cd8d305c9c50b0fa7131f6638e7b9d8dd9f2942fe8
    source_path: providers/openai.md
    workflow: 16
---

OpenAI は GPT モデル向けの開発者 API を提供しており、Codex も OpenAI の Codex クライアントを通じて ChatGPT プランのコーディングエージェントとして利用できます。OpenClaw は設定を予測しやすく保つため、これらのサーフェスを分離しています。

OpenClaw は OpenAI 系のルートを 3 つサポートしています。モデルプレフィックスがプロバイダー/認証ルートを選択し、別のランタイム設定が埋め込みエージェントループの実行者を選択します。

- **API キー** — 従量課金の直接 OpenAI Platform アクセス（`openai/*` モデル）
- **PI 経由の Codex サブスクリプション** — サブスクリプションアクセスを使う ChatGPT/Codex サインイン（`openai-codex/*` モデル）
- **Codex app-server ハーネス** — ネイティブ Codex app-server 実行（`openai/*` モデルに加えて `agents.defaults.agentRuntime.id: "codex"`）

OpenAI は、OpenClaw のような外部ツールやワークフローでのサブスクリプション OAuth 利用を明示的にサポートしています。

プロバイダー、モデル、ランタイム、チャネルは別々のレイヤーです。これらのラベルが混同されている場合は、設定を変更する前に [エージェントランタイム](/ja-JP/concepts/agent-runtimes) を読んでください。

## クイック選択

| 目的                                          | 使用するもの                                              | メモ                                                                        |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| 直接 API キー課金                        | `openai/gpt-5.5`                                 | `OPENAI_API_KEY` を設定するか、OpenAI API キーのオンボーディングを実行します。                       |
| ChatGPT/Codex サブスクリプション認証で GPT-5.5 を使う  | `openai-codex/gpt-5.5`                           | Codex OAuth 用のデフォルト PI ルートです。サブスクリプション構成で最初に選ぶのに最適です。 |
| ネイティブ Codex app-server 動作で GPT-5.5 を使う | `openai/gpt-5.5` に加えて `agentRuntime.id: "codex"` | そのモデル参照に対して Codex app-server ハーネスを強制します。                      |
| 画像生成または編集                   | `openai/gpt-image-2`                             | `OPENAI_API_KEY` または OpenAI Codex OAuth のどちらでも動作します。                    |
| 透明背景の画像                 | `openai/gpt-image-1.5`                           | `outputFormat=png` または `webp` と `openai.background=transparent` を使用します。        |

## 名前の対応表

名前は似ていますが、置き換え可能ではありません。

| 表示される名前                       | レイヤー             | 意味                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | プロバイダープレフィックス   | 直接 OpenAI Platform API ルート。                                                                 |
| `openai-codex`                     | プロバイダープレフィックス   | 通常の OpenClaw PI ランナーを通る OpenAI Codex OAuth/サブスクリプションルート。                      |
| `codex` plugin                     | Plugin            | ネイティブ Codex app-server ランタイムと `/codex` チャット制御を提供する、同梱の OpenClaw plugin。 |
| `agentRuntime.id: codex`           | エージェントランタイム     | 埋め込みターンに対してネイティブ Codex app-server ハーネスを強制します。                                     |
| `/codex ...`                       | チャットコマンドセット  | 会話から Codex app-server スレッドをバインド/制御します。                                        |
| `runtime: "acp", agentId: "codex"` | ACP セッションルート | ACP/acpx 経由で Codex を実行する明示的なフォールバックパス。                                          |

つまり、設定に `openai-codex/*` と `codex` plugin の両方が意図的に含まれる場合があります。PI 経由の Codex OAuth を使いたく、さらにネイティブの `/codex` チャット制御も利用可能にしたい場合、これは有効です。`openclaw doctor` はこの組み合わせについて警告し、それが意図したものか確認できるようにしますが、書き換えは行いません。

<Note>
GPT-5.5 は、直接 OpenAI Platform API キーアクセスとサブスクリプション/OAuth ルートの両方で利用できます。直接 `OPENAI_API_KEY` トラフィックには `openai/gpt-5.5`、PI 経由の Codex OAuth には `openai-codex/gpt-5.5`、ネイティブ Codex app-server ハーネスには `agentRuntime.id: "codex"` を指定した `openai/gpt-5.5` を使用します。
</Note>

<Note>
OpenAI plugin を有効にしたり、`openai-codex/*` モデルを選択したりしても、同梱の Codex app-server plugin は有効になりません。OpenClaw は、`agentRuntime.id: "codex"` でネイティブ Codex ハーネスを明示的に選択した場合、またはレガシーの `codex/*` モデル参照を使用した場合にのみ、その plugin を有効にします。
同梱の `codex` plugin が有効でも `openai-codex/*` が引き続き PI 経由で解決される場合、`openclaw doctor` は警告し、ルートは変更しません。
</Note>

## OpenClaw の機能対応範囲

| OpenAI の機能         | OpenClaw サーフェス                                           | ステータス                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| チャット / Responses          | `openai/<model>` モデルプロバイダー                            | はい                                                    |
| Codex サブスクリプションモデル | `openai-codex/<model>` と `openai-codex` OAuth           | はい                                                    |
| Codex app-server ハーネス  | `openai/<model>` と `agentRuntime.id: codex`             | はい                                                    |
| サーバー側 Web 検索    | ネイティブ OpenAI Responses ツール                               | はい。Web 検索が有効で、プロバイダーが固定されていない場合 |
| 画像                    | `image_generate`                                           | はい                                                    |
| 動画                    | `video_generate`                                           | はい                                                    |
| テキスト読み上げ            | `messages.tts.provider: "openai"` / `tts`                  | はい                                                    |
| バッチ音声文字起こし      | `tools.media.audio` / メディア理解                  | はい                                                    |
| ストリーミング音声文字起こし  | Voice Call `streaming.provider: "openai"`                  | はい                                                    |
| リアルタイム音声            | Voice Call `realtime.provider: "openai"` / Control UI Talk | はい                                                    |
| 埋め込み                | メモリ埋め込みプロバイダー                                  | はい                                                    |

## メモリ埋め込み

OpenClaw は、`memory_search` のインデックス作成とクエリ埋め込みに、OpenAI または OpenAI 互換の埋め込みエンドポイントを使用できます。

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

非対称の埋め込みラベルが必要な OpenAI 互換エンドポイントでは、`memorySearch` の下に `queryInputType` と `documentInputType` を設定します。OpenClaw はそれらをプロバイダー固有の `input_type` リクエストフィールドとして転送します。クエリ埋め込みには `queryInputType` を使用し、インデックス化されたメモリチャンクとバッチインデックス作成には `documentInputType` を使用します。完全な例については、[メモリ設定リファレンス](/ja-JP/reference/memory-config#provider-specific-config) を参照してください。

## はじめに

希望する認証方式を選択し、セットアップ手順に従ってください。

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **最適な用途:** 直接 API アクセスと従量課金。

    <Steps>
      <Step title="Get your API key">
        [OpenAI Platform ダッシュボード](https://platform.openai.com/api-keys) から API キーを作成またはコピーします。
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        または、キーを直接渡します。

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### ルート概要

    | モデル参照              | ランタイム設定             | ルート                       | 認証             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | 省略 / `agentRuntime.id: "pi"`    | 直接 OpenAI Platform API  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | 省略 / `agentRuntime.id: "pi"`    | 直接 OpenAI Platform API  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Codex app-server ハーネス    | Codex app-server |

    <Note>
    `openai/*` は、Codex app-server ハーネスを明示的に強制しない限り、直接 OpenAI API キールートです。デフォルト PI ランナー経由の Codex OAuth には `openai-codex/*` を使用し、ネイティブ Codex app-server 実行には `agentRuntime.id: "codex"` を指定した `openai/gpt-5.5` を使用します。
    </Note>

    ### 設定例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw は `openai/gpt-5.3-codex-spark` を公開しません。実際の OpenAI API リクエストはそのモデルを拒否し、現在の Codex カタログにも公開されていません。
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **最適な用途:** 別の API キーの代わりに ChatGPT/Codex サブスクリプションを使用する場合。Codex クラウドには ChatGPT サインインが必要です。

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        または、OAuth を直接実行します。

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        ヘッドレス環境やコールバックが使いにくい環境では、`--device-code` を追加して、localhost ブラウザーコールバックの代わりに ChatGPT デバイスコードフローでサインインします。

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Set the default model">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### ルート概要

    | モデル参照 | ランタイム設定 | ルート | 認証 |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | 省略 / `runtime: "pi"` | PI 経由の ChatGPT/Codex OAuth | Codex サインイン |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | plugin が明示的に `openai-codex` を要求しない限り、引き続き PI | Codex サインイン |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Codex app-server ハーネス | Codex app-server 認証 |

    <Note>
    認証/プロファイルコマンドには `openai-codex` プロバイダー ID を使い続けてください。`openai-codex/*` モデルプレフィックスは、Codex OAuth 用の明示的な PI ルートでもあります。これは同梱の Codex app-server ハーネスを選択したり、自動的に有効化したりしません。
    </Note>

    <Warning>
    `openai-codex/gpt-5.4-mini` はサポートされている Codex OAuth ルートではありません。OpenAI API キーで `openai/gpt-5.4-mini` を使用するか、Codex OAuth で `openai-codex/gpt-5.5` を使用してください。
    </Warning>

    ### 設定例

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    オンボーディングは `~/.codex` から OAuth 情報をインポートしなくなりました。ブラウザー OAuth（デフォルト）または上記のデバイスコードフローでサインインしてください。OpenClaw は生成された認証情報を独自のエージェント認証ストアで管理します。
    </Note>

    ### ステータスインジケーター

    Chat の `/status` は、現在のセッションでどのモデルランタイムがアクティブかを表示します。
    デフォルトの PI ハーネスは `Runtime: OpenClaw Pi Default` として表示されます。
    バンドルされた Codex アプリサーバーハーネスが選択されている場合、`/status` は
    `Runtime: OpenAI Codex` を表示します。既存のセッションは記録済みのハーネス ID を保持するため、`agentRuntime` を変更した後に `/status` に新しい PI/Codex の選択を反映させたい場合は、`/new` または `/reset` を使用してください。

    ### doctor 警告

    このタブの `openai-codex/*` ルートが選択されている間にバンドルされた `codex` plugin が有効になっている場合、`openclaw doctor` はモデルがまだ PI 経由で解決されることを警告します。
    それが意図したサブスクリプション認証ルートである場合は、設定を変更しないでください。
    ネイティブ Codex アプリサーバー実行を使いたい場合にのみ、`openai/<model>` と
    `agentRuntime.id: "codex"` に切り替えてください。

    ### コンテキストウィンドウ上限

    OpenClaw はモデルメタデータとランタイムコンテキスト上限を別々の値として扱います。

    Codex OAuth 経由の `openai-codex/gpt-5.5` の場合:

    - ネイティブ `contextWindow`: `1000000`
    - デフォルトランタイム `contextTokens` 上限: `272000`

    小さいデフォルト上限は、実運用ではレイテンシと品質の特性がより優れています。`contextTokens` で上書きできます。

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    ネイティブモデルメタデータを宣言するには `contextWindow` を使用します。ランタイムコンテキスト予算を制限するには `contextTokens` を使用します。
    </Note>

    ### カタログ復旧

    OpenClaw は、存在する場合は `gpt-5.5` にアップストリームの Codex カタログメタデータを使用します。
    アカウントが認証済みであるにもかかわらず、ライブ Codex 検出で `openai-codex/gpt-5.5` 行が省略される場合、OpenClaw はその OAuth モデル行を合成し、cron、サブエージェント、設定済みデフォルトモデルの実行が `Unknown model` で失敗しないようにします。

  </Tab>
</Tabs>

## ネイティブ Codex アプリサーバー認証

ネイティブ Codex アプリサーバーハーネスは `openai/*` モデル参照と
`agentRuntime.id: "codex"` を使用しますが、その認証は引き続きアカウントベースです。OpenClaw は次の順序で認証を選択します。

1. エージェントにバインドされた明示的な OpenClaw `openai-codex` 認証プロファイル。
2. ローカル Codex CLI ChatGPT サインインなど、アプリサーバーの既存アカウント。
3. ローカル stdio アプリサーバー起動のみで、アプリサーバーがアカウントなしを報告し、それでも OpenAI 認証を要求する場合は、`CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

つまり、Gateway プロセスが直接の OpenAI モデルや埋め込み用に `OPENAI_API_KEY` も持っているというだけで、ローカル ChatGPT/Codex サブスクリプションのサインインが置き換えられることはありません。環境変数 API キーのフォールバックは、ローカル stdio のアカウントなしパスだけです。WebSocket アプリサーバー接続には送信されません。サブスクリプション形式の Codex プロファイルが選択されている場合、OpenClaw は生成された stdio アプリサーバー子プロセスから `CODEX_API_KEY` と `OPENAI_API_KEY` も除外し、選択された認証情報をアプリサーバーログイン RPC 経由で送信します。

## 画像生成

バンドルされた `openai` plugin は、`image_generate` ツール経由で画像生成を登録します。
同じ `openai/gpt-image-2` モデル参照を通じて、OpenAI API キー画像生成と Codex OAuth 画像生成の両方をサポートします。

| 機能                      | OpenAI API キー                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| モデル参照                | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 認証                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth サインイン        |
| トランスポート            | OpenAI Images API                  | Codex Responses バックエンド         |
| リクエストあたりの最大画像数 | 4                                  | 4                                    |
| 編集モード                | 有効（最大 5 枚の参照画像）        | 有効（最大 5 枚の参照画像）          |
| サイズ上書き              | 2K/4K サイズを含めてサポート       | 2K/4K サイズを含めてサポート         |
| アスペクト比 / 解像度     | OpenAI Images API に転送されません | 安全な場合はサポート対象サイズにマッピング |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[画像生成](/ja-JP/tools/image-generation) を参照してください。
</Note>

`gpt-image-2` は、OpenAI のテキストから画像生成と画像編集の両方のデフォルトです。`gpt-image-1.5`、`gpt-image-1`、`gpt-image-1-mini` は明示的なモデル上書きとして引き続き使用できます。透明背景の PNG/WebP 出力には `openai/gpt-image-1.5` を使用してください。現在の `gpt-image-2` API は
`background: "transparent"` を拒否します。

透明背景リクエストでは、エージェントは `model: "openai/gpt-image-1.5"`、`outputFormat: "png"` または `"webp"`、および
`background: "transparent"` を指定して `image_generate` を呼び出す必要があります。古い `openai.background` プロバイダーオプションも引き続き受け付けられます。OpenClaw はまた、デフォルトの `openai/gpt-image-2` 透明リクエストを `gpt-image-1.5` に書き換えることで、公開 OpenAI ルートと OpenAI Codex OAuth ルートを保護します。Azure とカスタムの OpenAI 互換エンドポイントは、設定済みのデプロイ名/モデル名を保持します。

同じ設定はヘッドレス CLI 実行にも公開されています。

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

入力ファイルから開始する場合は、`openclaw infer image edit` で同じ `--output-format` と `--background` フラグを使用してください。
`--openai-background` は OpenAI 固有のエイリアスとして引き続き利用できます。

Codex OAuth インストールでは、同じ `openai/gpt-image-2` 参照を維持します。
`openai-codex` OAuth プロファイルが設定されている場合、OpenClaw は保存された OAuth アクセストークンを解決し、Codex Responses バックエンド経由で画像リクエストを送信します。
そのリクエストについて、先に `OPENAI_API_KEY` を試したり、API キーに暗黙的にフォールバックしたりすることはありません。代わりに直接 OpenAI Images API ルートを使いたい場合は、API キー、カスタムベース URL、または Azure エンドポイントを指定して `models.providers.openai` を明示的に設定してください。
そのカスタム画像エンドポイントが信頼済み LAN/プライベートアドレス上にある場合は、
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` も設定してください。このオプトインが存在しない限り、OpenClaw はプライベート/内部の OpenAI 互換画像エンドポイントをブロックしたままにします。

生成:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

透明 PNG を生成:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

編集:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## 動画生成

バンドルされた `openai` plugin は、`video_generate` ツール経由で動画生成を登録します。

| 機能         | 値                                                                                |
| ------------ | --------------------------------------------------------------------------------- |
| デフォルトモデル | `openai/sora-2`                                                                   |
| モード       | テキストから動画、画像から動画、単一動画編集                                     |
| 参照入力     | 画像 1 枚または動画 1 本                                                          |
| サイズ上書き | サポート                                                                          |
| その他の上書き | `aspectRatio`、`resolution`、`audio`、`watermark` はツール警告付きで無視されます |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation) を参照してください。
</Note>

## GPT-5 プロンプト寄与

OpenClaw は、プロバイダーをまたぐ GPT-5 ファミリー実行に共有 GPT-5 プロンプト寄与を追加します。モデル ID によって適用されるため、`openai-codex/gpt-5.5`、`openai/gpt-5.5`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5`、およびその他の互換 GPT-5 参照は同じオーバーレイを受け取ります。古い GPT-4.x モデルには適用されません。

バンドルされたネイティブ Codex ハーネスは、Codex アプリサーバーの開発者指示を通じて、同じ GPT-5 動作と Heartbeat オーバーレイを使用します。そのため、`agentRuntime.id: "codex"` によって強制的に経由される `openai/gpt-5.x` セッションは、ハーネスプロンプトの残りを Codex が所有していても、同じフォロースルーとプロアクティブな Heartbeat ガイダンスを保持します。

GPT-5 寄与は、ペルソナ永続性、実行安全性、ツール規律、出力形状、完了チェック、検証に関するタグ付き動作契約を追加します。チャネル固有の返信およびサイレントメッセージの動作は、共有 OpenClaw システムプロンプトとアウトバウンド配信ポリシーに残ります。GPT-5 ガイダンスは、該当するモデルでは常に有効です。親しみやすい対話スタイルレイヤーは別個で、設定可能です。

| 値                     | 効果                                           |
| ---------------------- | ---------------------------------------------- |
| `"friendly"`（デフォルト） | 親しみやすい対話スタイルレイヤーを有効化       |
| `"on"`                 | `"friendly"` のエイリアス                      |
| `"off"`                | 親しみやすいスタイルレイヤーのみを無効化       |

<Tabs>
  <Tab title="設定">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
値はランタイムで大文字小文字を区別しないため、`"Off"` と `"off"` はどちらも親しみやすいスタイルレイヤーを無効にします。
</Tip>

<Note>
共有 `agents.defaults.promptOverlays.gpt5.personality` 設定が未設定の場合、レガシーの `plugins.entries.openai.config.personality` は互換性フォールバックとして引き続き読み取られます。
</Note>

## 音声とスピーチ

<AccordionGroup>
  <Accordion title="音声合成 (TTS)">
    バンドルされた `openai` plugin は、`messages.tts` サーフェスに音声合成を登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 音声 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | （未設定） |
    | 指示 | `messages.tts.providers.openai.instructions` | （未設定、`gpt-4o-mini-tts` のみ） |
    | 形式 | `messages.tts.providers.openai.responseFormat` | ボイスメモは `opus`、ファイルは `mp3` |
    | API キー | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` にフォールバック |
    | ベース URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    利用可能なモデル: `gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。利用可能な音声: `alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    チャット API エンドポイントに影響を与えずに TTS ベース URL を上書きするには、`OPENAI_TTS_BASE_URL` を設定します。
    </Note>

  </Accordion>

  <Accordion title="音声からテキスト">
    バンドルされた `openai` plugin は、OpenClaw のメディア理解文字起こしサーフェスを通じてバッチ音声からテキストを登録します。

    - デフォルトモデル: `gpt-4o-transcribe`
    - エンドポイント: OpenAI REST `/v1/audio/transcriptions`
    - 入力パス: multipart 音声ファイルアップロード
    - Discord ボイスチャネルセグメントやチャネル音声添付ファイルを含め、受信音声文字起こしで `tools.media.audio` を使用する OpenClaw のあらゆる場所でサポートされます

    OpenAI による受信音声の文字起こしを強制するには:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    言語とプロンプトのヒントは、共有音声メディア設定または呼び出しごとの文字起こしリクエストで指定された場合に OpenAI に転送されます。

  </Accordion>

  <Accordion title="リアルタイム文字起こし">
    バンドルされた `openai` plugin は、Voice Call plugin 向けにリアルタイム文字起こしを登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 言語 | `...openai.language` | (未設定) |
    | プロンプト | `...openai.prompt` | (未設定) |
    | 無音時間 | `...openai.silenceDurationMs` | `800` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | API キー | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    G.711 u-law (`g711_ulaw` / `audio/pcmu`) 音声を使用して、`wss://api.openai.com/v1/realtime` への WebSocket 接続を使います。このストリーミングプロバイダーは Voice Call のリアルタイム文字起こしパス向けです。Discord 音声は現在、短いセグメントを録音し、代わりにバッチ `tools.media.audio` 文字起こしパスを使います。
    </Note>

  </Accordion>

  <Accordion title="リアルタイム音声">
    バンドルされた `openai` plugin は、Voice Call plugin 向けにリアルタイム音声を登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | 音声 | `...openai.voice` | `alloy` |
    | 温度 | `...openai.temperature` | `0.8` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | 無音時間 | `...openai.silenceDurationMs` | `500` |
    | API キー | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    バックエンドのリアルタイムブリッジ向けに、`azureEndpoint` と `azureDeployment` 設定キーで Azure OpenAI をサポートします。双方向のツール呼び出しをサポートします。G.711 u-law 音声形式を使います。
    </Note>

    <Note>
    Control UI Talk は、Gateway が発行した一時的なクライアントシークレットと、OpenAI Realtime API に対するブラウザーからの直接 WebRTC SDP 交換を使用して、OpenAI ブラウザーリアルタイムセッションを使います。メンテナーのライブ検証は `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` で利用できます。OpenAI 側では、Node でクライアントシークレットを発行し、偽のマイクメディアでブラウザー SDP オファーを生成し、それを OpenAI に投稿して、シークレットをログに出力せずに SDP アンサーを適用します。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI エンドポイント

バンドルされた `openai` プロバイダーは、ベース URL を上書きすることで、画像生成に Azure OpenAI リソースを対象にできます。画像生成パスでは、OpenClaw は `models.providers.openai.baseUrl` 上の Azure ホスト名を検出し、Azure のリクエスト形式に自動的に切り替えます。

<Note>
リアルタイム音声は別の設定パス (`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`) を使用し、`models.providers.openai.baseUrl` の影響を受けません。Azure 設定については、[音声とスピーチ](#voice-and-speech) の下にある **リアルタイム音声** アコーディオンを参照してください。
</Note>

次の場合は Azure OpenAI を使用します:

- Azure OpenAI のサブスクリプション、クォータ、またはエンタープライズ契約をすでに持っている
- Azure が提供するリージョンのデータ所在地またはコンプライアンス制御が必要
- 既存の Azure テナント内にトラフィックを保持したい

### 設定

バンドルされた `openai` プロバイダー経由で Azure 画像生成を行うには、`models.providers.openai.baseUrl` を Azure リソースに向け、`apiKey` を Azure OpenAI キー (OpenAI Platform キーではありません) に設定します:

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw は Azure 画像生成ルート向けに、次の Azure ホストサフィックスを認識します:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

認識された Azure ホストでの画像生成リクエストでは、OpenClaw は次を行います:

- `Authorization: Bearer` の代わりに `api-key` ヘッダーを送信
- デプロイメントスコープのパス (`/openai/deployments/{deployment}/...`) を使用
- 各リクエストに `?api-version=...` を追加
- Azure 画像生成呼び出しに 600 秒のデフォルトリクエストタイムアウトを使用します。
  呼び出しごとの `timeoutMs` 値は引き続きこのデフォルトを上書きします。

その他のベース URL (公開 OpenAI、OpenAI 互換プロキシ) は、標準の OpenAI 画像リクエスト形式を維持します。

<Note>
`openai` プロバイダーの画像生成パスの Azure ルーティングには、OpenClaw 2026.4.22 以降が必要です。以前のバージョンでは、カスタム `openai.baseUrl` はすべて公開 OpenAI エンドポイントと同様に扱われ、Azure 画像デプロイメントでは失敗します。
</Note>

### API バージョン

Azure 画像生成パスで特定の Azure プレビュー版または GA バージョンに固定するには、`AZURE_OPENAI_API_VERSION` を設定します:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

変数が未設定の場合、デフォルトは `2024-12-01-preview` です。

### モデル名はデプロイメント名

Azure OpenAI はモデルをデプロイメントにバインドします。バンドルされた `openai` プロバイダー経由でルーティングされる Azure 画像生成リクエストでは、OpenClaw の `model` フィールドは、公開 OpenAI モデル ID ではなく、Azure ポータルで設定した **Azure デプロイメント名** である必要があります。

`gpt-image-2` を提供する `gpt-image-2-prod` というデプロイメントを作成した場合:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同じデプロイメント名ルールは、バンドルされた `openai` プロバイダー経由でルーティングされる画像生成呼び出しにも適用されます。

### リージョン別の提供状況

Azure 画像生成は現在、一部のリージョンでのみ利用できます (例: `eastus2`、`swedencentral`、`polandcentral`、`westus3`、`uaenorth`)。デプロイメントを作成する前に Microsoft の最新リージョン一覧を確認し、特定のモデルが自分のリージョンで提供されていることを確認してください。

### パラメーターの違い

Azure OpenAI と公開 OpenAI は、常に同じ画像パラメーターを受け入れるわけではありません。Azure は、公開 OpenAI が許可するオプション (たとえば `gpt-image-2` の特定の `background` 値) を拒否したり、特定のモデルバージョンでのみ公開したりする場合があります。これらの違いは Azure と基盤モデルに由来するもので、OpenClaw によるものではありません。Azure リクエストが検証エラーで失敗した場合は、Azure ポータルで特定のデプロイメントと API バージョンがサポートするパラメーターセットを確認してください。

<Note>
Azure OpenAI はネイティブトランスポートと互換動作を使用しますが、OpenClaw の非表示アトリビューションヘッダーは受け取りません。詳細は [高度な設定](#advanced-configuration) の下にある **ネイティブ vs OpenAI 互換ルート** アコーディオンを参照してください。

Azure 上のチャットまたは Responses トラフィック (画像生成以外) には、オンボーディングフローまたは専用の Azure プロバイダー設定を使用してください。`openai.baseUrl` だけでは Azure API/認証形式は適用されません。別の `azure-openai-responses/*` プロバイダーが存在します。下のサーバー側 Compaction アコーディオンを参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="トランスポート (WebSocket vs SSE)">
    OpenClaw は `openai/*` と `openai-codex/*` の両方で、SSE フォールバック (`"auto"`) 付きの WebSocket 優先を使用します。

    `"auto"` モードでは、OpenClaw は次を行います:
    - SSE にフォールバックする前に、初期の WebSocket 失敗を 1 回再試行
    - 失敗後、WebSocket を約 60 秒間 degraded としてマークし、クールダウン中は SSE を使用
    - 再試行と再接続のために安定したセッションおよびターン ID ヘッダーを付与
    - トランスポートのバリアント間で使用量カウンター (`input_tokens` / `prompt_tokens`) を正規化

    | 値 | 動作 |
    |-------|----------|
    | `"auto"` (デフォルト) | WebSocket 優先、SSE フォールバック |
    | `"sse"` | SSE のみを強制 |
    | `"websocket"` | WebSocket のみを強制 |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    関連する OpenAI ドキュメント:
    - [WebSocket を使った Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [ストリーミング API レスポンス (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket ウォームアップ">
    OpenClaw は `openai/*` と `openai-codex/*` で、最初のターンのレイテンシーを減らすために、デフォルトで WebSocket ウォームアップを有効にします。

    ```json5
    // Disable warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="高速モード">
    OpenClaw は `openai/*` と `openai-codex/*` 向けに共有の高速モード切り替えを公開します:

    - **チャット/UI:** `/fast status|on|off`
    - **設定:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    有効にすると、OpenClaw は高速モードを OpenAI の優先処理 (`service_tier = "priority"`) にマップします。既存の `service_tier` 値は保持され、高速モードは `reasoning` や `text.verbosity` を書き換えません。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    セッションの上書きは設定より優先されます。Sessions UI でセッションの上書きをクリアすると、セッションは設定済みのデフォルトに戻ります。
    </Note>

  </Accordion>

  <Accordion title="優先処理 (service_tier)">
    OpenAI の API は `service_tier` によって優先処理を公開します。OpenClaw ではモデルごとに設定します:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    サポートされる値: `auto`、`default`、`flex`、`priority`。

    <Warning>
    `serviceTier` は、ネイティブ OpenAI エンドポイント (`api.openai.com`) とネイティブ Codex エンドポイント (`chatgpt.com/backend-api`) にのみ転送されます。どちらかのプロバイダーをプロキシ経由でルーティングする場合、OpenClaw は `service_tier` を変更しません。
    </Warning>

  </Accordion>

  <Accordion title="サーバー側 Compaction (Responses API)">
    直接 OpenAI Responses モデル (`api.openai.com` 上の `openai/*`) では、OpenAI plugin の Pi ハーネスストリームラッパーがサーバー側 Compaction を自動的に有効にします:

    - `store: true` を強制 (モデル互換が `supportsStore: false` を設定していない限り)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` を注入
    - デフォルトの `compact_threshold`: `contextWindow` の 70% (利用できない場合は `80000`)

    これは組み込みの Pi ハーネスパスと、埋め込み実行で使用される OpenAI プロバイダーフックに適用されます。ネイティブ Codex アプリサーバーハーネスは、Codex を通じて自身のコンテキストを管理し、`agents.defaults.agentRuntime.id` で別途設定されます。

    <Tabs>
      <Tab title="明示的に有効化">
        Azure OpenAI Responses のような互換エンドポイントに便利です:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="カスタムしきい値">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="無効化">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` は `context_management` の注入だけを制御します。直接の OpenAI Responses モデルは、compat が `supportsStore: false` を設定しない限り、引き続き `store: true` を強制します。
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT モード">
    `openai/*` での GPT-5 ファミリーの実行では、OpenClaw はより厳密な埋め込み実行コントラクトを使用できます。

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic` では、OpenClaw は次を行います。
    - ツール操作が利用可能な場合、計画だけのターンを成功した進捗として扱わなくなります
    - 今すぐ実行するよう誘導してターンを再試行します
    - 大きな作業では `update_plan` を自動的に有効化します
    - モデルが行動せず計画を続ける場合、明示的なブロック状態を表示します

    <Note>
    OpenAI と Codex の GPT-5 ファミリーの実行のみにスコープされます。他のプロバイダーと古いモデルファミリーはデフォルトの動作を維持します。
    </Note>

  </Accordion>

  <Accordion title="ネイティブルートと OpenAI 互換ルート">
    OpenClaw は、直接の OpenAI、Codex、Azure OpenAI エンドポイントを、汎用の OpenAI 互換 `/v1` プロキシとは別に扱います。

    **ネイティブルート**（`openai/*`、Azure OpenAI）:
    - OpenAI の `none` effort をサポートするモデルでのみ、`reasoning: { effort: "none" }` を保持します
    - `reasoning.effort: "none"` を拒否するモデルまたはプロキシでは、無効化された reasoning を省略します
    - ツールスキーマのデフォルトを strict モードにします
    - 検証済みのネイティブホストでのみ、非表示の帰属ヘッダーを付与します
    - OpenAI 専用のリクエスト整形（`service_tier`、`store`、reasoning-compat、prompt-cache ヒント）を保持します

    **プロキシ/互換ルート:**
    - より緩い互換動作を使用します
    - 非ネイティブの `openai-completions` ペイロードから Completions の `store` を削除します
    - OpenAI 互換 Completions プロキシ向けに、高度な `params.extra_body`/`params.extraBody` のパススルー JSON を受け入れます
    - vLLM などの OpenAI 互換 Completions プロキシ向けに `params.chat_template_kwargs` を受け入れます
    - strict ツールスキーマやネイティブ専用ヘッダーを強制しません

    Azure OpenAI はネイティブトランスポートと互換動作を使用しますが、非表示の帰属ヘッダーは受け取りません。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共有画像ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報の再利用ルール。
  </Card>
</CardGroup>
