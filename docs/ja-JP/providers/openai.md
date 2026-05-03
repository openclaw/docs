---
read_when:
    - OpenClaw で OpenAI モデルを使用したい場合
    - API キーではなく Codex サブスクリプション認証を使いたい場合
    - GPT-5 エージェントの実行動作をより厳格にする必要がある
summary: OpenClawでAPIキーまたはCodexサブスクリプションを使ってOpenAIを利用する
title: OpenAI
x-i18n:
    generated_at: "2026-05-03T05:04:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdffcdf53d9b17a19450c2ce47103db116e54a71a8dd432d981f5ece81cc38b3
    source_path: providers/openai.md
    workflow: 16
---

OpenAI は GPT モデル向けの開発者 API を提供しており、Codex は OpenAI の Codex クライアントを通じて
ChatGPT プランのコーディングエージェントとしても利用できます。OpenClaw はそれらの
サーフェスを分離し、設定を予測可能に保ちます。

OpenClaw は OpenAI ファミリーのルートを 3 つサポートします。Codex の挙動を利用したい
ほとんどの ChatGPT/Codex サブスクライバーは、ネイティブ Codex アプリサーバーランタイムを使用するべきです。
モデルプレフィックスはプロバイダー/モデル名を選択し、別のランタイム設定が
埋め込みエージェントループを実行する主体を選択します。

- **API キー** - 使用量ベースの課金による OpenAI Platform への直接アクセス（`openai/*` モデル）
- **ネイティブ Codex ランタイム付き Codex サブスクリプション** - ChatGPT/Codex サインインに加え、Codex アプリサーバー実行（`openai/*` モデルに `agents.defaults.agentRuntime.id: "codex"` を追加）
- **PI 経由の Codex サブスクリプション** - 通常の OpenClaw PI ランナーによる ChatGPT/Codex サインイン（`openai-codex/*` モデル）

OpenAI は、OpenClaw のような外部ツールやワークフローでのサブスクリプション OAuth 利用を明示的にサポートしています。

プロバイダー、モデル、ランタイム、チャネルは別々のレイヤーです。これらのラベルが
混同されている場合は、設定を変更する前に [エージェントランタイム](/ja-JP/concepts/agent-runtimes) を読んでください。

## 簡単な選び方

| 目的                                                 | 使用するもの                                              | 注記                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| ネイティブ Codex ランタイム付き ChatGPT/Codex サブスクリプション | `openai/gpt-5.5` に `agentRuntime.id: "codex"` を追加 | ほとんどのユーザーに推奨される Codex セットアップです。`openai-codex` 認証でサインインします。 |
| API キーによる直接課金                               | `openai/gpt-5.5`                                 | `OPENAI_API_KEY` を設定するか、OpenAI API キーのオンボーディングを実行します。                    |
| PI 経由の ChatGPT/Codex サブスクリプション認証           | `openai-codex/gpt-5.5`                           | 通常の PI ランナーを意図的に使いたい場合にのみ使用します。                |
| 画像生成または編集                          | `openai/gpt-image-2`                             | `OPENAI_API_KEY` または OpenAI Codex OAuth のどちらでも動作します。                 |
| 透明背景画像                        | `openai/gpt-image-1.5`                           | `outputFormat=png` または `webp` と `openai.background=transparent` を使用します。     |

## 名前の対応表

名前は似ていますが、互換性はありません。

| 表示される名前                       | レイヤー             | 意味                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | プロバイダープレフィックス   | 直接 OpenAI Platform API ルート。                                                                 |
| `openai-codex`                     | プロバイダープレフィックス   | 通常の OpenClaw PI ランナーを通る OpenAI Codex OAuth/サブスクリプションルート。                      |
| `codex` plugin                     | Plugin            | ネイティブ Codex アプリサーバーランタイムと `/codex` チャット制御を提供する同梱 OpenClaw plugin。 |
| `agentRuntime.id: codex`           | エージェントランタイム     | 埋め込みターンでネイティブ Codex アプリサーバーハーネスを強制します。                                     |
| `/codex ...`                       | チャットコマンドセット  | 会話から Codex アプリサーバースレッドをバインド/制御します。                                        |
| `runtime: "acp", agentId: "codex"` | ACP セッションルート | ACP/acpx 経由で Codex を実行する明示的なフォールバックパス。                                          |

つまり、設定には意図的に `openai-codex/*` と
`codex` plugin の両方を含められます。これは、PI 経由の Codex OAuth を使い、
さらにネイティブの `/codex` チャット制御も利用したい場合に有効です。`openclaw doctor` はその
組み合わせについて警告し、意図したものか確認できるようにします。書き換えは行いません。

<Note>
GPT-5.5 は、直接の OpenAI Platform API キーアクセスと
サブスクリプション/OAuth ルートの両方で利用できます。ChatGPT/Codex サブスクリプションに加えて
ネイティブ Codex 実行を使う場合は、`openai/gpt-5.5` と `agentRuntime.id: "codex"` を使用します。
PI 経由の Codex OAuth には `openai-codex/gpt-5.5` のみを使用し、
直接の `OPENAI_API_KEY` トラフィックには Codex ランタイム上書きなしで
`openai/gpt-5.5` を使用します。
</Note>

<Note>
OpenAI plugin を有効にしても、または `openai-codex/*` モデルを選択しても、
同梱の Codex アプリサーバー plugin は有効になりません。OpenClaw は、その plugin を
`agentRuntime.id: "codex"` でネイティブ Codex ハーネスを明示的に選択した場合、
またはレガシーの `codex/*` モデル参照を使った場合にのみ有効にします。
同梱の `codex` plugin が有効でも `openai-codex/*` が引き続き PI 経由で解決される場合、
`openclaw doctor` は警告し、ルートは変更しません。
</Note>

## OpenClaw の機能カバレッジ

| OpenAI の機能         | OpenClaw サーフェス                                           | 状態                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| チャット / Responses          | `openai/<model>` モデルプロバイダー                            | はい                                                    |
| Codex サブスクリプションモデル | `openai-codex` OAuth を使った `openai-codex/<model>`           | はい                                                    |
| Codex アプリサーバーハーネス  | `agentRuntime.id: codex` を使った `openai/<model>`             | はい                                                    |
| サーバー側 Web 検索    | ネイティブ OpenAI Responses ツール                               | はい。Web 検索が有効で、プロバイダーが固定されていない場合 |
| 画像                    | `image_generate`                                           | はい                                                    |
| 動画                    | `video_generate`                                           | はい                                                    |
| テキスト読み上げ            | `messages.tts.provider: "openai"` / `tts`                  | はい                                                    |
| バッチ音声テキスト変換      | `tools.media.audio` / メディア理解                  | はい                                                    |
| ストリーミング音声テキスト変換  | Voice Call `streaming.provider: "openai"`                  | はい                                                    |
| リアルタイム音声            | Voice Call `realtime.provider: "openai"` / Control UI Talk | はい                                                    |
| Embeddings                | メモリ embedding プロバイダー                                  | はい                                                    |

## メモリ embeddings

OpenClaw は、`memory_search` のインデックス作成とクエリ embeddings に
OpenAI、または OpenAI 互換の embedding エンドポイントを使用できます。

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

非対称 embedding ラベルを必要とする OpenAI 互換エンドポイントでは、
`memorySearch` の下に `queryInputType` と `documentInputType` を設定します。OpenClaw は
それらをプロバイダー固有の `input_type` リクエストフィールドとして転送します。クエリ embeddings は
`queryInputType` を使用し、インデックス済みメモリチャンクとバッチインデックス作成は
`documentInputType` を使用します。完全な例については [メモリ設定リファレンス](/ja-JP/reference/memory-config#provider-specific-config) を参照してください。

## はじめに

好みの認証方式を選び、セットアップ手順に従ってください。

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
      <Step title="モデルが利用可能であることを確認する">
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
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Codex アプリサーバーハーネス    | Codex アプリサーバー |

    <Note>
    `openai/*` は、Codex アプリサーバーハーネスを明示的に強制しない限り、
    直接の OpenAI API キールートです。デフォルトの PI ランナー経由の Codex OAuth には
    `openai-codex/*` を使用し、ネイティブ Codex アプリサーバー実行には
    `openai/gpt-5.5` と `agentRuntime.id: "codex"` を使用します。
    </Note>

    ### 設定例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw は `openai/gpt-5.3-codex-spark` を公開していません。ライブ OpenAI API リクエストはそのモデルを拒否し、現在の Codex カタログにも公開されていません。
    </Warning>

  </Tab>

  <Tab title="Codex サブスクリプション">
    **最適な用途:** 別の API キーではなく、ChatGPT/Codex サブスクリプションをネイティブ Codex アプリサーバー実行で使用する場合。Codex クラウドには ChatGPT サインインが必要です。

    <Steps>
      <Step title="Codex OAuth を実行する">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        または OAuth を直接実行します。

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        ヘッドレス環境やコールバックを受け付けにくいセットアップでは、localhost ブラウザーコールバックの代わりに ChatGPT デバイスコードフローでサインインするため、`--device-code` を追加します。

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="ネイティブ Codex ランタイムを使用する">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex"}' --strict-json
        ```
      </Step>
      <Step title="Codex 認証が利用可能であることを確認する">
        ```bash
        openclaw models list --provider openai-codex
        ```

        gateway の実行後、チャットで `/codex status` または `/codex models` を送信して、
        ネイティブアプリサーバーランタイムを確認します。
      </Step>
    </Steps>

    ### ルート概要

    | モデル参照 | ランタイム設定 | ルート | 認証 |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | ネイティブ Codex アプリサーバーハーネス | Codex サインインまたは選択された `openai-codex` プロファイル |
    | `openai-codex/gpt-5.5` | 省略 / `runtime: "pi"` | PI 経由の ChatGPT/Codex OAuth | Codex サインイン |
    | `openai-codex/gpt-5.4-mini` | 省略 / `runtime: "pi"` | PI 経由の ChatGPT/Codex OAuth | Codex サインイン |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | plugin が明示的に `openai-codex` を要求しない限り引き続き PI | Codex サインイン |

    <Note>
    認証/プロファイルコマンドでは引き続き `openai-codex` プロバイダー ID を使用してください。
    `openai-codex/*` モデル接頭辞も、Codex OAuth 用の明示的な PI ルートです。
    これは同梱の Codex app-server ハーネスを選択したり、自動で有効にしたりするものではありません。一般的なサブスクリプションとネイティブランタイムのセットアップでは、
    `openai-codex` でサインインしつつ、モデル参照は `openai/gpt-5.5` のままにし、
    `agentRuntime.id: "codex"` を設定してください。
    </Note>

    ### 設定例

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex" },
        },
      },
    }
    ```

    代わりに通常の PI ランナー上で Codex OAuth を維持するには、
    `openai-codex/gpt-5.5` を使用し、Codex ランタイムのオーバーライドを省略してください。

    <Note>
    オンボーディングは `~/.codex` から OAuth 情報をインポートしなくなりました。ブラウザー OAuth (デフォルト) または上記のデバイスコードフローでサインインしてください。OpenClaw は生成された認証情報を独自のエージェント認証ストアで管理します。
    </Note>

    ### ステータスインジケーター

    チャットの `/status` は、現在のセッションで有効なモデルランタイムを表示します。
    デフォルトの PI ハーネスは `Runtime: OpenClaw Pi Default` として表示されます。同梱の Codex app-server ハーネスが選択されている場合、`/status` は
    `Runtime: OpenAI Codex` を表示します。既存のセッションは記録済みのハーネス ID を保持するため、`agentRuntime` の変更後に `/status` に新しい PI/Codex の選択を反映させたい場合は、
    `/new` または `/reset` を使用してください。

    ### Doctor 警告

    同梱の `codex` Plugin が有効で、かつ `openai-codex/*` ルートが選択されている場合、
    `openclaw doctor` はモデルが引き続き PI 経由で解決されることを警告します。
    その PI サブスクリプション認証ルートが意図したものの場合に限り、設定を変更せず維持してください。ネイティブ Codex app-server 実行を使用したい場合は、
    `openai/<model>` と `agentRuntime.id: "codex"` に切り替えてください。

    ### コンテキストウィンドウ上限

    OpenClaw はモデルメタデータとランタイムコンテキスト上限を別々の値として扱います。

    Codex OAuth 経由の `openai-codex/gpt-5.5` の場合:

    - ネイティブ `contextWindow`: `1000000`
    - デフォルトランタイム `contextTokens` 上限: `272000`

    小さいデフォルト上限のほうが、実運用ではレイテンシと品質の特性が優れています。`contextTokens` で上書きできます。

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

    OpenClaw は、存在する場合は `gpt-5.5` に upstream Codex カタログメタデータを使用します。アカウントが認証済みであるにもかかわらず、ライブ Codex 検出で `openai-codex/gpt-5.5` 行が省略された場合、OpenClaw はその OAuth モデル行を合成し、
    cron、サブエージェント、設定済みデフォルトモデルの実行が
    `Unknown model` で失敗しないようにします。

  </Tab>
</Tabs>

## ネイティブ Codex app-server 認証

ネイティブ Codex app-server ハーネスは `openai/*` モデル参照と
`agentRuntime.id: "codex"` を使用しますが、その認証は引き続きアカウントベースです。OpenClaw は次の順序で認証を選択します。

1. エージェントに紐付けられた明示的な OpenClaw `openai-codex` 認証プロファイル。
2. ローカル Codex CLI ChatGPT サインインなど、app-server の既存アカウント。
3. ローカル stdio app-server 起動のみ、app-server がアカウントなしを報告し、なお OpenAI 認証を必要とする場合は、
   `CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

つまり、Gateway プロセスが直接 OpenAI モデルや埋め込み用に `OPENAI_API_KEY` も持っているという理由だけで、ローカルの ChatGPT/Codex サブスクリプションサインインが置き換えられることはありません。環境変数 API キーのフォールバックは、ローカル stdio のアカウントなしパスに限られます。WebSocket app-server 接続には送信されません。サブスクリプション形式の Codex プロファイルが選択されている場合、OpenClaw は生成される stdio app-server 子プロセスからも `CODEX_API_KEY` と `OPENAI_API_KEY` を除外し、選択された認証情報を app-server ログイン RPC 経由で送信します。

## 画像生成

同梱の `openai` Plugin は、`image_generate` ツールを通じて画像生成を登録します。
同じ `openai/gpt-image-2` モデル参照を通じて、OpenAI API キーによる画像生成と Codex OAuth 画像生成の両方をサポートします。

| 機能                      | OpenAI API キー                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| モデル参照                | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 認証                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth サインイン        |
| トランスポート            | OpenAI Images API                  | Codex Responses バックエンド         |
| リクエストあたりの最大画像数 | 4                                  | 4                                    |
| 編集モード                | 有効 (参照画像は最大 5 枚)         | 有効 (参照画像は最大 5 枚)           |
| サイズのオーバーライド    | 2K/4K サイズを含めてサポート       | 2K/4K サイズを含めてサポート         |
| アスペクト比 / 解像度     | OpenAI Images API に転送されません | 安全な場合にサポートされるサイズへマッピング |

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

`gpt-image-2` は、OpenAI のテキストから画像生成と画像編集の両方のデフォルトです。`gpt-image-1.5`、`gpt-image-1`、`gpt-image-1-mini` は、明示的なモデルオーバーライドとして引き続き使用できます。透明背景の PNG/WebP 出力には `openai/gpt-image-1.5` を使用してください。現在の `gpt-image-2` API は
`background: "transparent"` を拒否します。

透明背景のリクエストでは、エージェントは `model: "openai/gpt-image-1.5"`、`outputFormat: "png"` または `"webp"`、および
`background: "transparent"` を指定して `image_generate` を呼び出す必要があります。古い `openai.background` プロバイダーオプションも引き続き受け付けられます。OpenClaw はまた、デフォルトの `openai/gpt-image-2` 透明リクエストを `gpt-image-1.5` に書き換えることで、公開 OpenAI ルートと
OpenAI Codex OAuth ルートを保護します。Azure とカスタム OpenAI 互換エンドポイントは、設定済みのデプロイメント/モデル名を維持します。

同じ設定は、ヘッドレス CLI 実行にも公開されています。

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

Codex OAuth インストールでは、同じ `openai/gpt-image-2` 参照を維持してください。
`openai-codex` OAuth プロファイルが設定されている場合、OpenClaw は保存された OAuth アクセストークンを解決し、Codex Responses バックエンド経由で画像リクエストを送信します。そのリクエストについて、先に `OPENAI_API_KEY` を試したり、黙って API キーへフォールバックしたりはしません。代わりに直接 OpenAI Images API ルートを使用したい場合は、API キー、カスタムベース URL、または Azure エンドポイントを指定して `models.providers.openai` を明示的に設定してください。
そのカスタム画像エンドポイントが信頼済み LAN/プライベートアドレス上にある場合は、
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` も設定してください。この明示的な opt-in がない限り、OpenClaw はプライベート/内部 OpenAI 互換画像エンドポイントをブロックし続けます。

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

同梱の `openai` Plugin は、`video_generate` ツールを通じて動画生成を登録します。

| 機能             | 値                                                                                |
| ---------------- | --------------------------------------------------------------------------------- |
| デフォルトモデル | `openai/sora-2`                                                                   |
| モード           | テキストから動画、画像から動画、単一動画編集                                     |
| 参照入力         | 画像 1 枚または動画 1 本                                                          |
| サイズのオーバーライド | サポート                                                                      |
| その他のオーバーライド | `aspectRatio`、`resolution`、`audio`、`watermark` はツール警告付きで無視されます |

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

## GPT-5 プロンプト提供

OpenClaw は、プロバイダー全体の GPT-5 ファミリー実行に対して、共有 GPT-5 プロンプト提供を追加します。これはモデル ID によって適用されるため、`openai-codex/gpt-5.5`、`openai/gpt-5.5`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5`、その他の互換 GPT-5 参照は同じオーバーレイを受け取ります。古い GPT-4.x モデルには適用されません。

同梱のネイティブ Codex ハーネスは、Codex app-server 開発者向け指示を通じて同じ GPT-5 動作と Heartbeat オーバーレイを使用するため、`agentRuntime.id: "codex"` によって強制的に通された `openai/gpt-5.x` セッションは、ハーネスプロンプトの残りを Codex が所有していても、同じ遂行とプロアクティブな Heartbeat ガイダンスを維持します。

GPT-5 提供は、ペルソナの永続性、実行安全性、ツール規律、出力形式、完了チェック、検証に関するタグ付き動作契約を追加します。チャネル固有の返信とサイレントメッセージ動作は、共有 OpenClaw システムプロンプトと送信配信ポリシーに残ります。GPT-5 ガイダンスは、一致するモデルに対して常に有効です。親しみやすいインタラクションスタイルレイヤーは別個であり、設定可能です。

| 値                     | 効果                                      |
| ---------------------- | ----------------------------------------- |
| `"friendly"` (デフォルト) | 親しみやすいインタラクションスタイルレイヤーを有効化 |
| `"on"`                 | `"friendly"` のエイリアス                 |
| `"off"`                | 親しみやすいスタイルレイヤーのみを無効化  |

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
値は実行時に大文字小文字を区別しないため、`"Off"` と `"off"` はどちらも親しみやすいスタイルレイヤーを無効にします。
</Tip>

<Note>
共有 `agents.defaults.promptOverlays.gpt5.personality` 設定が未設定の場合、互換性フォールバックとして従来の `plugins.entries.openai.config.personality` が引き続き読み取られます。
</Note>

## 音声とスピーチ

<AccordionGroup>
  <Accordion title="音声合成 (TTS)">
    同梱の `openai` Plugin は、`messages.tts` サーフェスに音声合成を登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 音声 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | （未設定） |
    | 指示 | `messages.tts.providers.openai.instructions` | （未設定、`gpt-4o-mini-tts` のみ） |
    | 形式 | `messages.tts.providers.openai.responseFormat` | 音声メモでは `opus`、ファイルでは `mp3` |
    | API キー | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` にフォールバック |
    | ベース URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 追加ボディ | `messages.tts.providers.openai.extraBody` / `extra_body` | （未設定） |

    利用可能なモデル: `gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。利用可能な音声: `alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` は OpenClaw が生成したフィールドの後に `/audio/speech` リクエスト JSON へマージされるため、`lang` などの追加キーが必要な OpenAI 互換エンドポイントに使用してください。プロトタイプキーは無視されます。

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

  <Accordion title="Speech-to-text">
    同梱の `openai` Plugin は、OpenClaw のメディア理解文字起こしサーフェスを通じて、バッチ音声テキスト変換を登録します。

    - デフォルトモデル: `gpt-4o-transcribe`
    - エンドポイント: OpenAI REST `/v1/audio/transcriptions`
    - 入力パス: multipart 音声ファイルアップロード
    - サポート範囲: 受信音声の文字起こしで `tools.media.audio` を使用する OpenClaw のすべての場所。Discord ボイスチャンネルのセグメントやチャンネル音声添付ファイルを含みます

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

  <Accordion title="Realtime transcription">
    同梱の `openai` Plugin は、Voice Call Plugin 用のリアルタイム文字起こしを登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 言語 | `...openai.language` | （未設定） |
    | プロンプト | `...openai.prompt` | （未設定） |
    | 無音継続時間 | `...openai.silenceDurationMs` | `800` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | API キー | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    G.711 u-law（`g711_ulaw` / `audio/pcmu`）音声で `wss://api.openai.com/v1/realtime` への WebSocket 接続を使用します。このストリーミングプロバイダーは Voice Call のリアルタイム文字起こしパス用です。Discord 音声は現在、短いセグメントを録音し、代わりにバッチ `tools.media.audio` 文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    同梱の `openai` Plugin は、Voice Call Plugin 用のリアルタイム音声を登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | 音声 | `...openai.voice` | `alloy` |
    | 温度 | `...openai.temperature` | `0.8` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | 無音継続時間 | `...openai.silenceDurationMs` | `500` |
    | API キー | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    バックエンドのリアルタイムブリッジ用に、`azureEndpoint` と `azureDeployment` 設定キーを通じて Azure OpenAI をサポートします。双方向のツール呼び出しをサポートします。G.711 u-law 音声形式を使用します。
    </Note>

    <Note>
    Control UI Talk は、Gateway が発行した短命のクライアントシークレットと、OpenAI Realtime API に対するブラウザーからの直接 WebRTC SDP 交換を使って、OpenAI ブラウザーリアルタイムセッションを使用します。メンテナー向けライブ検証は `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` で利用できます。OpenAI 側は Node でクライアントシークレットを発行し、偽のマイクメディアでブラウザー SDP オファーを生成し、それを OpenAI に投稿して、シークレットをログに出力せずに SDP アンサーを適用します。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI エンドポイント

同梱の `openai` プロバイダーは、ベース URL を上書きすることで、画像生成の対象を Azure OpenAI リソースにできます。画像生成パスでは、OpenClaw は `models.providers.openai.baseUrl` の Azure ホスト名を検出し、Azure のリクエスト形式へ自動的に切り替えます。

<Note>
リアルタイム音声は別の設定パス（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`）を使用し、`models.providers.openai.baseUrl` の影響を受けません。Azure 設定については、[音声とスピーチ](#voice-and-speech) の下にある **リアルタイム音声** アコーディオンを参照してください。
</Note>

Azure OpenAI は次の場合に使用します:

- Azure OpenAI のサブスクリプション、クォータ、またはエンタープライズ契約をすでに持っている
- Azure が提供するリージョン内データ所在地またはコンプライアンス制御が必要
- 既存の Azure テナンシー内にトラフィックを保持したい

### 設定

同梱の `openai` プロバイダーを通じた Azure 画像生成では、`models.providers.openai.baseUrl` を Azure リソースに向け、`apiKey` を Azure OpenAI キー（OpenAI Platform キーではない）に設定します:

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

OpenClaw は、Azure 画像生成ルート用に次の Azure ホストサフィックスを認識します:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

認識された Azure ホストでの画像生成リクエストでは、OpenClaw は次を行います:

- `Authorization: Bearer` の代わりに `api-key` ヘッダーを送信します
- デプロイスコープのパス（`/openai/deployments/{deployment}/...`）を使用します
- 各リクエストに `?api-version=...` を追加します
- Azure 画像生成呼び出しには、デフォルトのリクエストタイムアウト 600 秒を使用します。呼び出しごとの `timeoutMs` 値は引き続きこのデフォルトを上書きします。

その他のベース URL（公開 OpenAI、OpenAI 互換プロキシ）は、標準の OpenAI 画像リクエスト形式を維持します。

<Note>
`openai` プロバイダーの画像生成パスに対する Azure ルーティングには、OpenClaw 2026.4.22 以降が必要です。それ以前のバージョンは、任意のカスタム `openai.baseUrl` を公開 OpenAI エンドポイントと同様に扱うため、Azure 画像デプロイに対して失敗します。
</Note>

### API バージョン

Azure 画像生成パスで特定の Azure プレビューまたは GA バージョンに固定するには、`AZURE_OPENAI_API_VERSION` を設定します:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

変数が未設定の場合のデフォルトは `2024-12-01-preview` です。

### モデル名はデプロイ名です

Azure OpenAI はモデルをデプロイにバインドします。同梱の `openai` プロバイダーを通じてルーティングされる Azure 画像生成リクエストでは、OpenClaw の `model` フィールドは、公開 OpenAI モデル ID ではなく、Azure ポータルで設定した **Azure デプロイ名** である必要があります。

`gpt-image-2` を提供する `gpt-image-2-prod` というデプロイを作成した場合:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同じデプロイ名ルールは、同梱の `openai` プロバイダーを通じてルーティングされる画像生成呼び出しにも適用されます。

### リージョン別の提供状況

Azure 画像生成は現在、一部のリージョン（例: `eastus2`、`swedencentral`、`polandcentral`、`westus3`、`uaenorth`）でのみ利用できます。デプロイを作成する前に Microsoft の現在のリージョン一覧を確認し、特定のモデルが自分のリージョンで提供されていることを確認してください。

### パラメーターの違い

Azure OpenAI と公開 OpenAI は、同じ画像パラメーターを常に受け付けるとは限りません。Azure は、公開 OpenAI が許可するオプション（たとえば `gpt-image-2` の特定の `background` 値）を拒否したり、特定のモデルバージョンでのみ公開したりする場合があります。これらの違いは Azure と基盤モデルに由来し、OpenClaw によるものではありません。Azure リクエストが検証エラーで失敗した場合は、Azure ポータルで特定のデプロイと API バージョンがサポートするパラメーターセットを確認してください。

<Note>
Azure OpenAI はネイティブトランスポートと互換動作を使用しますが、OpenClaw の隠し attribution ヘッダーは受け取りません。詳しくは [高度な設定](#advanced-configuration) の下にある **ネイティブと OpenAI 互換ルート** アコーディオンを参照してください。

Azure 上のチャットまたは Responses トラフィック（画像生成以外）には、オンボーディングフローまたは専用の Azure プロバイダー設定を使用してください。`openai.baseUrl` だけでは Azure API/auth 形式は適用されません。別の `azure-openai-responses/*` プロバイダーが存在します。下のサーバー側 Compaction アコーディオンを参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw は `openai/*` と `openai-codex/*` の両方で、SSE フォールバック付きの WebSocket 優先（`"auto"`）を使用します。

    `"auto"` モードでは、OpenClaw は次を行います:
    - SSE にフォールバックする前に、初期の WebSocket 失敗を 1 回リトライします
    - 失敗後、WebSocket を約 60 秒間 degraded としてマークし、クールダウン中は SSE を使用します
    - リトライと再接続用に、安定したセッションおよびターン ID ヘッダーを付加します
    - トランスポートのバリアント間で使用量カウンター（`input_tokens` / `prompt_tokens`）を正規化します

    | 値 | 動作 |
    |-------|----------|
    | `"auto"`（デフォルト） | WebSocket 優先、SSE フォールバック |
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
    - [WebSocket を使用した Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [ストリーミング API レスポンス（SSE）](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket warm-up">
    OpenClaw は、最初のターンのレイテンシを減らすために、`openai/*` と `openai-codex/*` で WebSocket ウォームアップをデフォルトで有効にします。

    ```json5
    // ウォームアップを無効化
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

  <Accordion title="Fast mode">
    OpenClaw は `openai/*` と `openai-codex/*` に対して共有の高速モードトグルを公開します:

    - **チャット/UI:** `/fast status|on|off`
    - **設定:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    有効な場合、OpenClaw は高速モードを OpenAI の優先処理（`service_tier = "priority"`）にマップします。既存の `service_tier` 値は保持され、高速モードは `reasoning` や `text.verbosity` を書き換えません。

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

  <Accordion title="Priority processing (service_tier)">
    OpenAI の API は `service_tier` を通じて優先処理を公開します。OpenClaw ではモデルごとに設定します:

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

    サポートされている値: `auto`, `default`, `flex`, `priority`。

    <Warning>
    `serviceTier` はネイティブの OpenAI エンドポイント (`api.openai.com`) とネイティブの Codex エンドポイント (`chatgpt.com/backend-api`) にのみ転送されます。いずれかのプロバイダーをプロキシ経由でルーティングする場合、OpenClaw は `service_tier` を変更しません。
    </Warning>

  </Accordion>

  <Accordion title="サーバー側 Compaction (Responses API)">
    直接の OpenAI Responses モデル (`api.openai.com` 上の `openai/*`) では、OpenAI Plugin の Pi ハーネスストリームラッパーがサーバー側 Compaction を自動的に有効にします。

    - `store: true` を強制します (モデル互換設定で `supportsStore: false` が設定されている場合を除く)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` を注入します
    - デフォルトの `compact_threshold`: `contextWindow` の 70% (利用できない場合は `80000`)

    これは、組み込みの Pi ハーネスパスと、埋め込み実行で使用される OpenAI プロバイダーフックに適用されます。ネイティブの Codex アプリサーバーハーネスは Codex を通じて独自のコンテキストを管理し、`agents.defaults.agentRuntime.id` で別途設定されます。

    <Tabs>
      <Tab title="明示的に有効化">
        Azure OpenAI Responses のような互換エンドポイントに有用です。

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
    `responsesServerCompaction` は `context_management` の注入のみを制御します。直接の OpenAI Responses モデルは、互換設定で `supportsStore: false` が設定されていない限り、引き続き `store: true` を強制します。
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT モード">
    `openai/*` での GPT-5 ファミリー実行では、OpenClaw はより厳格な埋め込み実行契約を使用できます。

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
    - ツール操作が利用可能な場合、計画のみのターンを成功した進捗として扱わなくなります
    - 今すぐ実行するよう促す指示でターンを再試行します
    - 実質的な作業では `update_plan` を自動的に有効にします
    - モデルが実行せずに計画を続ける場合、明示的なブロック状態を表示します

    <Note>
    OpenAI と Codex の GPT-5 ファミリー実行のみにスコープされます。他のプロバイダーや古いモデルファミリーはデフォルトの動作を維持します。
    </Note>

  </Accordion>

  <Accordion title="ネイティブルートと OpenAI 互換ルート">
    OpenClaw は、直接の OpenAI、Codex、Azure OpenAI エンドポイントを、汎用の OpenAI 互換 `/v1` プロキシとは異なるものとして扱います。

    **ネイティブルート** (`openai/*`, Azure OpenAI):
    - OpenAI の `none` effort をサポートするモデルでのみ `reasoning: { effort: "none" }` を維持します
    - `reasoning.effort: "none"` を拒否するモデルまたはプロキシでは、無効化された reasoning を省略します
    - ツールスキーマのデフォルトを strict モードにします
    - 検証済みのネイティブホストにのみ隠し帰属ヘッダーを添付します
    - OpenAI 専用のリクエスト整形 (`service_tier`, `store`, reasoning 互換, prompt-cache ヒント) を維持します

    **プロキシ/互換ルート:**
    - より緩い互換動作を使用します
    - 非ネイティブの `openai-completions` ペイロードから Completions の `store` を取り除きます
    - OpenAI 互換 Completions プロキシ向けに高度な `params.extra_body`/`params.extraBody` パススルー JSON を受け入れます
    - vLLM などの OpenAI 互換 Completions プロキシ向けに `params.chat_template_kwargs` を受け入れます
    - strict ツールスキーマやネイティブ専用ヘッダーを強制しません

    Azure OpenAI はネイティブトランスポートと互換動作を使用しますが、隠し帰属ヘッダーは受け取りません。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作を選択します。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共有画像ツールパラメーターとプロバイダー選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールパラメーターとプロバイダー選択。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報の再利用ルール。
  </Card>
</CardGroup>
