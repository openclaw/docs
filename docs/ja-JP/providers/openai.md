---
read_when:
    - OpenClaw で OpenAI モデルを使用したい場合
    - API キーではなく Codex サブスクリプション認証を使用したい場合
    - GPT-5 エージェントの実行動作をより厳格にする必要があります
summary: OpenClaw で API キーまたは Codex サブスクリプションを使って OpenAI を使用する
title: OpenAI
x-i18n:
    generated_at: "2026-05-02T21:04:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0caf43895c1bc8494b1a0d4aeef98e575bb31aca047430a63156875bed3bb112
    source_path: providers/openai.md
    workflow: 16
---

OpenAI は GPT モデル向けの開発者 API を提供しており、Codex は OpenAI の Codex クライアントを通じて ChatGPT プランのコーディングエージェントとしても利用できます。OpenClaw は、設定を予測しやすく保つために、これらのサーフェスを分離しています。

OpenClaw は OpenAI 系のルートを3つサポートしています。Codex の挙動を求めるほとんどの ChatGPT/Codex サブスクライバーは、ネイティブ Codex アプリサーバーランタイムを使うべきです。モデルプレフィックスはプロバイダー/モデル名を選択し、別のランタイム設定は埋め込みエージェントループを誰が実行するかを選択します。

- **API キー** - 使用量ベースの課金による OpenAI Platform への直接アクセス（`openai/*` モデル）
- **ネイティブ Codex ランタイム付き Codex サブスクリプション** - ChatGPT/Codex サインインと Codex アプリサーバー実行（`openai/*` モデルに加えて `agents.defaults.agentRuntime.id: "codex"`）
- **PI 経由の Codex サブスクリプション** - 通常の OpenClaw PI ランナーでの ChatGPT/Codex サインイン（`openai-codex/*` モデル）

OpenAI は、OpenClaw のような外部ツールやワークフローでのサブスクリプション OAuth 利用を明示的にサポートしています。

プロバイダー、モデル、ランタイム、チャネルは別々のレイヤーです。これらのラベルが混同されている場合は、設定を変更する前に [エージェントランタイム](/ja-JP/concepts/agent-runtimes) を読んでください。

## クイック選択

| 目的                                                 | 使用するもの                                      | メモ                                                                      |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| ネイティブ Codex ランタイム付き ChatGPT/Codex サブスクリプション | `openai/gpt-5.5` に加えて `agentRuntime.id: "codex"` | ほとんどのユーザーに推奨される Codex 設定です。`openai-codex` 認証でサインインします。 |
| 直接 API キー課金                                    | `openai/gpt-5.5`                                 | `OPENAI_API_KEY` を設定するか、OpenAI API キーのオンボーディングを実行します。 |
| PI 経由の ChatGPT/Codex サブスクリプション認証       | `openai-codex/gpt-5.5`                           | 通常の PI ランナーを意図的に使いたい場合にのみ使います。                 |
| 画像生成または編集                                   | `openai/gpt-image-2`                             | `OPENAI_API_KEY` と OpenAI Codex OAuth のどちらでも動作します。           |
| 透明背景画像                                         | `openai/gpt-image-1.5`                           | `outputFormat=png` または `webp` と `openai.background=transparent` を使います。 |

## 命名マップ

名前は似ていますが、互換性はありません。

| 表示される名前                       | レイヤー          | 意味                                                                                              |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | プロバイダープレフィックス | OpenAI Platform API への直接ルート。                                                              |
| `openai-codex`                     | プロバイダープレフィックス | 通常の OpenClaw PI ランナーを通る OpenAI Codex OAuth/サブスクリプションルート。                   |
| `codex` plugin                     | Plugin            | ネイティブ Codex アプリサーバーランタイムと `/codex` チャットコントロールを提供する同梱 OpenClaw Plugin。 |
| `agentRuntime.id: codex`           | エージェントランタイム | 埋め込みターンにネイティブ Codex アプリサーバーハーネスを強制します。                              |
| `/codex ...`                       | チャットコマンドセット | 会話から Codex アプリサーバースレッドをバインド/制御します。                                      |
| `runtime: "acp", agentId: "codex"` | ACP セッションルート | ACP/acpx 経由で Codex を実行する明示的なフォールバックパス。                                      |

つまり、設定には `openai-codex/*` と `codex` Plugin の両方を意図的に含めることができます。これは、PI 経由の Codex OAuth を使い、さらにネイティブ `/codex` チャットコントロールも利用可能にしたい場合に有効です。`openclaw doctor` はその組み合わせについて警告し、意図したものか確認できるようにしますが、書き換えは行いません。

<Note>
GPT-5.5 は、OpenAI Platform の直接 API キーアクセスとサブスクリプション/OAuth ルートの両方で利用できます。ChatGPT/Codex サブスクリプションとネイティブ Codex 実行を組み合わせる場合は、`agentRuntime.id: "codex"` とともに `openai/gpt-5.5` を使います。PI 経由の Codex OAuth には `openai-codex/gpt-5.5` のみを使い、直接 `OPENAI_API_KEY` トラフィックには Codex ランタイム上書きなしの `openai/gpt-5.5` を使います。
</Note>

<Note>
OpenAI Plugin を有効にしても、または `openai-codex/*` モデルを選択しても、同梱の Codex アプリサーバー Plugin は有効になりません。OpenClaw は、`agentRuntime.id: "codex"` でネイティブ Codex ハーネスを明示的に選択した場合、またはレガシーの `codex/*` モデル参照を使った場合にのみ、その Plugin を有効にします。
同梱の `codex` Plugin が有効でも `openai-codex/*` が引き続き PI 経由で解決される場合、`openclaw doctor` は警告し、ルートは変更しません。
</Note>

## OpenClaw 機能カバレッジ

| OpenAI の機能              | OpenClaw サーフェス                                      | 状態                                                   |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| チャット / Responses      | `openai/<model>` モデルプロバイダー                        | はい                                                   |
| Codex サブスクリプションモデル | `openai-codex/<model>` と `openai-codex` OAuth             | はい                                                   |
| Codex アプリサーバーハーネス | `openai/<model>` と `agentRuntime.id: codex`               | はい                                                   |
| サーバー側Web検索          | ネイティブ OpenAI Responses ツール                         | はい。Web検索が有効で、プロバイダーが固定されていない場合 |
| 画像                      | `image_generate`                                           | はい                                                   |
| 動画                      | `video_generate`                                           | はい                                                   |
| テキスト読み上げ          | `messages.tts.provider: "openai"` / `tts`                  | はい                                                   |
| バッチ音声テキスト化      | `tools.media.audio` / メディア理解                         | はい                                                   |
| ストリーミング音声テキスト化 | Voice Call `streaming.provider: "openai"`                  | はい                                                   |
| リアルタイム音声          | Voice Call `realtime.provider: "openai"` / Control UI Talk | はい                                                   |
| 埋め込み                  | メモリ埋め込みプロバイダー                                 | はい                                                   |

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

非対称の埋め込みラベルを必要とする OpenAI 互換エンドポイントでは、`memorySearch` 配下に `queryInputType` と `documentInputType` を設定します。OpenClaw はこれらをプロバイダー固有の `input_type` リクエストフィールドとして転送します。クエリ埋め込みは `queryInputType` を使い、インデックス化されたメモリチャンクとバッチインデックス作成は `documentInputType` を使います。完全な例については、[メモリ設定リファレンス](/ja-JP/reference/memory-config#provider-specific-config) を参照してください。

## はじめに

希望する認証方法を選び、設定手順に従ってください。

<Tabs>
  <Tab title="API キー（OpenAI Platform）">
    **最適な用途:** 直接 API アクセスと使用量ベースの課金。

    <Steps>
      <Step title="API キーを取得する">
        [OpenAI Platform ダッシュボード](https://platform.openai.com/api-keys) から API キーを作成またはコピーします。
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        または、キーを直接渡します。

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### ルート概要

    | モデル参照             | ランタイム設定             | ルート                      | 認証             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omitted / `agentRuntime.id: "pi"`    | 直接 OpenAI Platform API    | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omitted / `agentRuntime.id: "pi"`    | 直接 OpenAI Platform API    | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Codex アプリサーバーハーネス | Codex アプリサーバー |

    <Note>
    `openai/*` は、Codex アプリサーバーハーネスを明示的に強制しない限り、直接 OpenAI API キールートです。デフォルトの PI ランナーを通る Codex OAuth には `openai-codex/*` を使い、ネイティブ Codex アプリサーバー実行には `agentRuntime.id: "codex"` とともに `openai/gpt-5.5` を使います。
    </Note>

    ### 設定例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw は `openai/gpt-5.3-codex-spark` を公開していません。ライブの OpenAI API リクエストはそのモデルを拒否し、現在の Codex カタログでも公開されていません。
    </Warning>

  </Tab>

  <Tab title="Codex サブスクリプション">
    **最適な用途:** 別個の API キーではなく、ChatGPT/Codex サブスクリプションをネイティブ Codex アプリサーバー実行で使う場合。Codex クラウドには ChatGPT サインインが必要です。

    <Steps>
      <Step title="Codex OAuth を実行する">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        または、OAuth を直接実行します。

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        ヘッドレス環境やコールバックを受け付けにくい設定では、localhost ブラウザーコールバックの代わりに ChatGPT デバイスコードフローでサインインするために `--device-code` を追加します。

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="ネイティブ Codex ランタイムを使う">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex","fallback":"none"}' --strict-json
        ```
      </Step>
      <Step title="Codex 認証が利用可能か確認する">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Gateway が実行されたら、チャットで `/codex status` または `/codex models` を送信して、ネイティブアプリサーバーランタイムを確認します。
      </Step>
    </Steps>

    ### ルート概要

    | モデル参照 | ランタイム設定 | ルート | 認証 |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | ネイティブ Codex アプリサーバーハーネス | Codex サインインまたは選択された `openai-codex` プロファイル |
    | `openai-codex/gpt-5.5` | omitted / `runtime: "pi"` | PI 経由の ChatGPT/Codex OAuth | Codex サインイン |
    | `openai-codex/gpt-5.4-mini` | omitted / `runtime: "pi"` | PI 経由の ChatGPT/Codex OAuth | Codex サインイン |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Plugin が明示的に `openai-codex` を要求しない限り、引き続き PI | Codex サインイン |

    <Note>
    認証/プロファイルコマンドには引き続き `openai-codex` プロバイダー ID を使用してください。
    `openai-codex/*` モデルプレフィックスは、Codex OAuth 用の明示的な PI ルートでもあります。
    これは、バンドルされた Codex app-server ハーネスを選択したり自動有効化したりしません。
    一般的なサブスクリプションとネイティブランタイムの組み合わせでは、
    `openai-codex` でサインインしますが、モデル参照は `openai/gpt-5.5` のままにし、
    `agentRuntime.id: "codex"` を設定します。
    </Note>

    ### 設定例

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex", fallback: "none" },
        },
      },
    }
    ```

    代わりに通常の PI ランナーで Codex OAuth を維持するには、
    `openai-codex/gpt-5.5` を使用し、Codex ランタイムの上書きを省略します。

    <Note>
    オンボーディングでは、`~/.codex` から OAuth マテリアルをインポートしなくなりました。ブラウザー OAuth（デフォルト）または上記のデバイスコードフローでサインインしてください。OpenClaw は、結果として得られる認証情報を独自のエージェント認証ストアで管理します。
    </Note>

    ### ステータスインジケーター

    Chat の `/status` は、現在のセッションでどのモデルランタイムがアクティブかを表示します。
    デフォルトの PI ハーネスは `Runtime: OpenClaw Pi Default` と表示されます。
    バンドルされた Codex app-server ハーネスが選択されている場合、`/status` は
    `Runtime: OpenAI Codex` と表示します。既存のセッションは記録済みのハーネス ID を保持するため、
    `agentRuntime` を変更した後に `/status` に新しい PI/Codex の選択を反映させたい場合は、
    `/new` または `/reset` を使用します。

    ### Doctor 警告

    バンドルされた `codex` Plugin が有効で、かつ `openai-codex/*` ルートが選択されている場合、
    `openclaw doctor` はモデルが引き続き PI 経由で解決されることを警告します。
    その PI サブスクリプション認証ルートが意図したものの場合にのみ、設定を変更せずに維持してください。
    ネイティブ Codex app-server 実行を行いたい場合は、
    `openai/<model>` と `agentRuntime.id: "codex"` に切り替えます。

    ### コンテキストウィンドウ上限

    OpenClaw はモデルメタデータとランタイムコンテキスト上限を別々の値として扱います。

    Codex OAuth 経由の `openai-codex/gpt-5.5` の場合:

    - ネイティブ `contextWindow`: `1000000`
    - デフォルトランタイム `contextTokens` 上限: `272000`

    小さいデフォルト上限は、実際の運用でレイテンシと品質特性が優れています。`contextTokens` で上書きできます。

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

    OpenClaw は、存在する場合は `gpt-5.5` に upstream の Codex カタログメタデータを使用します。
    アカウントが認証済みであるにもかかわらず、ライブ Codex 検出で `openai-codex/gpt-5.5` 行が省略される場合、
    OpenClaw はその OAuth モデル行を合成し、cron、サブエージェント、設定済みデフォルトモデルの実行が
    `Unknown model` で失敗しないようにします。

  </Tab>
</Tabs>

## ネイティブ Codex app-server 認証

ネイティブ Codex app-server ハーネスは、`openai/*` モデル参照と
`agentRuntime.id: "codex"` を使用しますが、その認証は引き続きアカウントベースです。OpenClaw は
次の順序で認証を選択します。

1. エージェントに関連付けられた明示的な OpenClaw `openai-codex` 認証プロファイル。
2. ローカル Codex CLI ChatGPT サインインなど、app-server の既存アカウント。
3. ローカル stdio app-server 起動の場合のみ、app-server がアカウントなしと報告し、なお OpenAI 認証を必要とする場合は、
   `CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

つまり、Gateway プロセスが直接 OpenAI モデルや埋め込み用に `OPENAI_API_KEY` も持っているというだけでは、
ローカルの ChatGPT/Codex サブスクリプションサインインは置き換えられません。
環境 API キーのフォールバックは、ローカル stdio のアカウントなしパスに限定されます。
WebSocket app-server 接続には送信されません。サブスクリプション形式の Codex プロファイルが選択されている場合、
OpenClaw は生成される stdio app-server 子プロセスから `CODEX_API_KEY` と `OPENAI_API_KEY` も除外し、
選択された認証情報を app-server ログイン RPC 経由で送信します。

## 画像生成

バンドルされた `openai` Plugin は、`image_generate` ツール経由で画像生成を登録します。
同じ `openai/gpt-image-2` モデル参照を通じて、OpenAI API キー画像生成と Codex OAuth 画像生成の両方をサポートします。

| 機能                | OpenAI API キー                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| モデル参照                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 認証                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth サインイン           |
| トランスポート                 | OpenAI Images API                  | Codex Responses backend              |
| リクエストあたりの最大画像数    | 4                                  | 4                                    |
| 編集モード                 | 有効（最大 5 枚の参照画像） | 有効（最大 5 枚の参照画像）   |
| サイズ上書き            | 2K/4K サイズを含めてサポート   | 2K/4K サイズを含めてサポート     |
| アスペクト比 / 解像度 | OpenAI Images API に転送されません | 安全な場合、サポートされるサイズにマッピングされます |

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

`gpt-image-2` は、OpenAI のテキストから画像生成と画像編集の両方のデフォルトです。
`gpt-image-1.5`、`gpt-image-1`、`gpt-image-1-mini` は、明示的なモデル上書きとして引き続き使用できます。
透明背景の PNG/WebP 出力には `openai/gpt-image-1.5` を使用してください。現在の `gpt-image-2` API は
`background: "transparent"` を拒否します。

透明背景のリクエストでは、エージェントは `image_generate` を
`model: "openai/gpt-image-1.5"`、`outputFormat: "png"` または `"webp"`、および
`background: "transparent"` で呼び出す必要があります。古い `openai.background` プロバイダーオプションも
引き続き受け付けられます。OpenClaw は、デフォルトの `openai/gpt-image-2` 透明リクエストを
`gpt-image-1.5` に書き換えることで、公開 OpenAI ルートと
OpenAI Codex OAuth ルートも保護します。Azure とカスタムの OpenAI 互換エンドポイントは、
設定済みのデプロイメント名/モデル名を維持します。

同じ設定は、ヘッドレス CLI 実行にも公開されています。

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

入力ファイルから開始する場合は、`openclaw infer image edit` でも同じ `--output-format` と
`--background` フラグを使用します。
`--openai-background` は OpenAI 固有のエイリアスとして引き続き利用できます。

Codex OAuth インストールでは、同じ `openai/gpt-image-2` 参照を維持してください。
`openai-codex` OAuth プロファイルが設定されている場合、OpenClaw は保存済みの OAuth
アクセストークンを解決し、Codex Responses backend 経由で画像リクエストを送信します。
そのリクエストに対して、先に `OPENAI_API_KEY` を試したり、API キーへ暗黙にフォールバックしたりすることはありません。
代わりに直接 OpenAI Images API ルートを使いたい場合は、API キー、
カスタムベース URL、または Azure エンドポイントを指定して `models.providers.openai` を明示的に設定してください。
そのカスタム画像エンドポイントが信頼済み LAN/プライベートアドレス上にある場合は、
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` も設定してください。OpenClaw は、このオプトインが存在しない限り、
プライベート/内部の OpenAI 互換画像エンドポイントをブロックしたままにします。

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

バンドルされた `openai` Plugin は、`video_generate` ツール経由で動画生成を登録します。

| 機能       | 値                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| デフォルトモデル    | `openai/sora-2`                                                                   |
| モード            | テキストから動画、画像から動画、単一動画編集                                  |
| 参照入力 | 1 画像または 1 動画                                                                |
| サイズ上書き   | サポートあり                                                                         |
| その他の上書き  | `aspectRatio`、`resolution`、`audio`、`watermark` はツール警告付きで無視されます |

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

OpenClaw は、プロバイダーをまたぐ GPT-5 ファミリーの実行に共有 GPT-5 プロンプト寄与を追加します。これはモデル ID によって適用されるため、`openai-codex/gpt-5.5`、`openai/gpt-5.5`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5`、およびその他の互換 GPT-5 参照は同じオーバーレイを受け取ります。古い GPT-4.x モデルには適用されません。

バンドルされたネイティブ Codex ハーネスは、Codex app-server developer instructions を通じて、同じ GPT-5 動作と Heartbeat オーバーレイを使用します。そのため、`agentRuntime.id: "codex"` 経由に強制された `openai/gpt-5.x` セッションは、ハーネスプロンプトの残りを Codex が所有している場合でも、同じフォロースルーとプロアクティブ Heartbeat ガイダンスを維持します。

GPT-5 寄与は、ペルソナの永続性、実行安全性、ツール規律、出力形状、完了チェック、検証に関するタグ付き動作契約を追加します。チャネル固有の返信とサイレントメッセージ動作は、共有 OpenClaw システムプロンプトと送信配信ポリシーに残ります。GPT-5 ガイダンスは、一致するモデルに対して常に有効です。フレンドリーな対話スタイルレイヤーは別個であり、設定可能です。

| 値                  | 効果                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"`（デフォルト） | フレンドリーな対話スタイルレイヤーを有効にする |
| `"on"`                 | `"friendly"` のエイリアス                      |
| `"off"`                | フレンドリーなスタイルレイヤーのみを無効にする       |

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
値はランタイムで大文字小文字を区別しないため、`"Off"` と `"off"` はどちらもフレンドリーなスタイルレイヤーを無効にします。
</Tip>

<Note>
共有 `agents.defaults.promptOverlays.gpt5.personality` 設定が設定されていない場合、従来の `plugins.entries.openai.config.personality` は互換性フォールバックとして引き続き読み取られます。
</Note>

## 音声と発話

<AccordionGroup>
  <Accordion title="音声合成（TTS）">
    バンドルされた `openai` Plugin は、`messages.tts` サーフェス用に音声合成を登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 音声 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | (未設定) |
    | 指示 | `messages.tts.providers.openai.instructions` | (未設定、`gpt-4o-mini-tts` のみ) |
    | 形式 | `messages.tts.providers.openai.responseFormat` | 音声メモは `opus`、ファイルは `mp3` |
    | API キー | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` にフォールバック |
    | ベース URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 追加ボディ | `messages.tts.providers.openai.extraBody` / `extra_body` | (未設定) |

    利用可能なモデル: `gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。利用可能な音声: `alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` は OpenClaw が生成したフィールドの後に `/audio/speech` リクエスト JSON へマージされるため、`lang` などの追加キーを必要とする OpenAI 互換エンドポイントに使用してください。プロトタイプキーは無視されます。

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
    チャット API エンドポイントに影響させずに TTS ベース URL を上書きするには、`OPENAI_TTS_BASE_URL` を設定します。
    </Note>

  </Accordion>

  <Accordion title="音声テキスト変換">
    バンドルされた `openai` plugin は、OpenClaw のメディア理解の文字起こしサーフェスを通じて、バッチ音声テキスト変換を登録します。

    - デフォルトモデル: `gpt-4o-transcribe`
    - エンドポイント: OpenAI REST `/v1/audio/transcriptions`
    - 入力パス: multipart 音声ファイルアップロード
    - 受信音声の文字起こしが `tools.media.audio` を使用する OpenClaw のすべての場所でサポートされます。これには Discord 音声チャンネルのセグメントとチャンネル音声添付ファイルが含まれます

    受信音声の文字起こしに OpenAI を強制するには:

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

    共有音声メディア設定または呼び出しごとの文字起こしリクエストで指定された場合、言語とプロンプトのヒントは OpenAI に転送されます。

  </Accordion>

  <Accordion title="リアルタイム文字起こし">
    バンドルされた `openai` plugin は、Voice Call plugin 向けのリアルタイム文字起こしを登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 言語 | `...openai.language` | (未設定) |
    | プロンプト | `...openai.prompt` | (未設定) |
    | 無音時間 | `...openai.silenceDurationMs` | `800` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | API キー | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    G.711 u-law (`g711_ulaw` / `audio/pcmu`) 音声で `wss://api.openai.com/v1/realtime` への WebSocket 接続を使用します。このストリーミングプロバイダーは Voice Call のリアルタイム文字起こしパス用です。Discord 音声は現在、短いセグメントを録音し、代わりにバッチ `tools.media.audio` 文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="リアルタイム音声">
    バンドルされた `openai` plugin は、Voice Call plugin 向けのリアルタイム音声を登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | 音声 | `...openai.voice` | `alloy` |
    | 温度 | `...openai.temperature` | `0.8` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | 無音時間 | `...openai.silenceDurationMs` | `500` |
    | API キー | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    バックエンドのリアルタイムブリッジ向けに、`azureEndpoint` と `azureDeployment` 設定キーを介して Azure OpenAI をサポートします。双方向のツール呼び出しをサポートします。G.711 u-law 音声形式を使用します。
    </Note>

    <Note>
    Control UI Talk は、Gateway が発行する一時的なクライアントシークレットと、OpenAI Realtime API に対するブラウザーからの直接 WebRTC SDP 交換を使って、OpenAI ブラウザーリアルタイムセッションを使用します。メンテナーによるライブ検証は `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` で利用できます。OpenAI 側は Node でクライアントシークレットを発行し、偽のマイクメディアでブラウザー SDP オファーを生成し、それを OpenAI に投稿し、シークレットをログに出力せずに SDP アンサーを適用します。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI エンドポイント

バンドルされた `openai` プロバイダーは、ベース URL を上書きすることで、画像生成に Azure OpenAI リソースを対象にできます。画像生成パスでは、OpenClaw は `models.providers.openai.baseUrl` 上の Azure ホスト名を検出し、Azure のリクエスト形状へ自動的に切り替えます。

<Note>
リアルタイム音声は別の設定パス (`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`) を使用し、`models.providers.openai.baseUrl` の影響を受けません。Azure 設定については、[音声とスピーチ](#voice-and-speech) の下にある **リアルタイム音声** アコーディオンを参照してください。
</Note>

Azure OpenAI を使用するのは次の場合です:

- Azure OpenAI のサブスクリプション、クォータ、またはエンタープライズ契約をすでに持っている
- Azure が提供するリージョン内データ保管やコンプライアンス制御が必要
- 既存の Azure テナント内にトラフィックを保持したい

### 設定

バンドルされた `openai` プロバイダー経由の Azure 画像生成では、`models.providers.openai.baseUrl` を自分の Azure リソースに向け、`apiKey` を Azure OpenAI キー (OpenAI Platform キーではありません) に設定します:

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

OpenClaw は、Azure 画像生成ルート向けに以下の Azure ホストサフィックスを認識します:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

認識された Azure ホストでの画像生成リクエストでは、OpenClaw は次の処理を行います:

- `Authorization: Bearer` の代わりに `api-key` ヘッダーを送信
- デプロイスコープのパス (`/openai/deployments/{deployment}/...`) を使用
- 各リクエストに `?api-version=...` を追加
- Azure 画像生成呼び出しに 600 秒のデフォルトリクエストタイムアウトを使用します。
  呼び出しごとの `timeoutMs` 値は引き続きこのデフォルトを上書きします。

その他のベース URL (公開 OpenAI、OpenAI 互換プロキシ) は、標準の OpenAI 画像リクエスト形状を維持します。

<Note>
`openai` プロバイダーの画像生成パスでの Azure ルーティングには、OpenClaw 2026.4.22 以降が必要です。以前のバージョンはカスタム `openai.baseUrl` をすべて公開 OpenAI エンドポイントと同様に扱い、Azure 画像デプロイに対して失敗します。
</Note>

### API バージョン

Azure 画像生成パスで特定の Azure プレビュー版または GA バージョンを固定するには、`AZURE_OPENAI_API_VERSION` を設定します:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

変数が未設定の場合、デフォルトは `2024-12-01-preview` です。

### モデル名はデプロイ名です

Azure OpenAI はモデルをデプロイに紐付けます。バンドルされた `openai` プロバイダーを通じてルーティングされる Azure 画像生成リクエストでは、OpenClaw の `model` フィールドは、公開 OpenAI モデル ID ではなく、Azure ポータルで設定した **Azure デプロイ名** でなければなりません。

`gpt-image-2` を提供する `gpt-image-2-prod` というデプロイを作成した場合:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同じデプロイ名のルールは、バンドルされた `openai` プロバイダーを通じてルーティングされる画像生成呼び出しにも適用されます。

### リージョン別の可用性

Azure 画像生成は現在、一部のリージョン (例: `eastus2`、`swedencentral`、`polandcentral`、`westus3`、`uaenorth`) でのみ利用できます。デプロイを作成する前に Microsoft の最新リージョン一覧を確認し、特定のモデルが自分のリージョンで提供されていることを確認してください。

### パラメーターの違い

Azure OpenAI と公開 OpenAI は、常に同じ画像パラメーターを受け付けるとは限りません。Azure は、公開 OpenAI が許可するオプション (たとえば `gpt-image-2` の特定の `background` 値) を拒否したり、特定のモデルバージョンでのみ公開したりする場合があります。これらの違いは Azure と基盤モデルに由来し、OpenClaw ではありません。Azure リクエストが検証エラーで失敗する場合は、Azure ポータルで特定のデプロイと API バージョンがサポートするパラメーターセットを確認してください。

<Note>
Azure OpenAI はネイティブトランスポートと互換動作を使用しますが、OpenClaw の非表示の帰属ヘッダーは受け取りません。[高度な設定](#advanced-configuration) の下にある **ネイティブ vs OpenAI 互換ルート** アコーディオンを参照してください。

Azure 上のチャットまたは Responses トラフィック (画像生成以外) には、オンボーディングフローまたは専用の Azure プロバイダー設定を使用してください。`openai.baseUrl` だけでは Azure API/認証形状は使用されません。別個の `azure-openai-responses/*` プロバイダーが存在します。下のサーバーサイド Compaction アコーディオンを参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="トランスポート (WebSocket vs SSE)">
    OpenClaw は `openai/*` と `openai-codex/*` の両方で、SSE フォールバック付きの WebSocket 優先 (`"auto"`) を使用します。

    `"auto"` モードでは、OpenClaw は次の処理を行います:
    - SSE にフォールバックする前に、初期の WebSocket 失敗を 1 回再試行
    - 失敗後、約 60 秒間 WebSocket を劣化状態としてマークし、クールダウン中は SSE を使用
    - 再試行と再接続のために安定したセッションおよびターン ID ヘッダーを添付
    - トランスポートのバリアント間で使用量カウンター (`input_tokens` / `prompt_tokens`) を正規化

    | 値 | 動作 |
    |-------|----------|
    | `"auto"` (デフォルト) | WebSocket 優先、SSE フォールバック |
    | `"sse"` | SSE のみに強制 |
    | `"websocket"` | WebSocket のみに強制 |

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
    - [WebSocket を使用する Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [ストリーミング API レスポンス (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket ウォームアップ">
    OpenClaw は、初回ターンのレイテンシを低減するため、`openai/*` と `openai-codex/*` でデフォルトで WebSocket ウォームアップを有効にします。

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

    有効にすると、OpenClaw は高速モードを OpenAI の優先処理 (`service_tier = "priority"`) にマッピングします。既存の `service_tier` 値は保持され、高速モードは `reasoning` や `text.verbosity` を書き換えません。

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
    セッションの上書きは設定より優先されます。Sessions UI でセッションの上書きをクリアすると、セッションは設定されたデフォルトに戻ります。
    </Note>

  </Accordion>

  <Accordion title="優先処理 (service_tier)">
    OpenAI の API は `service_tier` を介して優先処理を公開します。OpenClaw ではモデルごとに設定します:

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
    `serviceTier` はネイティブ OpenAI エンドポイント（`api.openai.com`）とネイティブ Codex エンドポイント（`chatgpt.com/backend-api`）にのみ転送されます。どちらかのプロバイダーをプロキシ経由でルーティングする場合、OpenClaw は `service_tier` を変更しません。
    </Warning>

  </Accordion>

  <Accordion title="サーバー側 Compaction（Responses API）">
    直接の OpenAI Responses モデル（`api.openai.com` 上の `openai/*`）では、OpenAI Plugin の Pi-harness ストリームラッパーがサーバー側 Compaction を自動的に有効化します。

    - `store: true` を強制します（モデル互換性で `supportsStore: false` が設定されていない限り）
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` を注入します
    - デフォルトの `compact_threshold`: `contextWindow` の 70%（利用できない場合は `80000`）

    これは組み込み Pi ハーネスパスと、埋め込み実行で使用される OpenAI プロバイダーフックに適用されます。ネイティブ Codex アプリサーバーハーネスは Codex 経由で独自のコンテキストを管理し、`agents.defaults.agentRuntime.id` で別途構成されます。

    <Tabs>
      <Tab title="明示的に有効化">
        Azure OpenAI Responses などの互換エンドポイントに有用です。

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
    `responsesServerCompaction` が制御するのは `context_management` の注入のみです。直接の OpenAI Responses モデルは、互換性で `supportsStore: false` が設定されていない限り、引き続き `store: true` を強制します。
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT モード">
    `openai/*` 上の GPT-5 ファミリーの実行では、OpenClaw はより厳密な埋め込み実行契約を使用できます。

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic` では、OpenClaw は次のように動作します。
    - ツールアクションが利用可能な場合、計画のみのターンを成功した進行として扱わなくなります
    - 今すぐ行動するよう促してターンを再試行します
    - 実質的な作業では `update_plan` を自動的に有効化します
    - モデルが行動せずに計画を続ける場合、明示的なブロック状態を表示します

    <Note>
    OpenAI と Codex の GPT-5 ファミリー実行にのみスコープされます。他のプロバイダーや古いモデルファミリーはデフォルトの動作を維持します。
    </Note>

  </Accordion>

  <Accordion title="ネイティブルートと OpenAI 互換ルート">
    OpenClaw は、直接の OpenAI、Codex、Azure OpenAI エンドポイントを、汎用の OpenAI 互換 `/v1` プロキシとは異なるものとして扱います。

    **ネイティブルート**（`openai/*`、Azure OpenAI）:
    - OpenAI の `none` effort をサポートするモデルにのみ `reasoning: { effort: "none" }` を保持します
    - `reasoning.effort: "none"` を拒否するモデルやプロキシでは、無効化された reasoning を省略します
    - ツールスキーマをデフォルトで strict モードにします
    - 検証済みのネイティブホストにのみ非表示の帰属ヘッダーを付与します
    - OpenAI 専用のリクエスト整形（`service_tier`、`store`、reasoning 互換性、プロンプトキャッシュヒント）を保持します

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
    認証の詳細と資格情報の再利用ルール。
  </Card>
</CardGroup>
