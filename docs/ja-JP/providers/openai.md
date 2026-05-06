---
read_when:
    - OpenClaw で OpenAI モデルを使用したい
    - API キーではなく Codex のサブスクリプション認証を使いたい場合
    - GPT-5 エージェントの実行挙動をより厳格にする必要があります
summary: OpenClaw で APIキーまたは Codex のサブスクリプションを使って OpenAI を利用する
title: OpenAI
x-i18n:
    generated_at: "2026-05-06T19:35:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fda2acdb0e249f0481ab1aa20bb5ff317709bc9536f60c45be9e2d63c44702e
    source_path: providers/openai.md
    workflow: 16
---

OpenAI は GPT モデル向けの開発者 API を提供しており、Codex も OpenAI の Codex クライアントを通じて ChatGPT プランのコーディングエージェントとして利用できます。OpenClaw は、設定を予測しやすく保つために、これらのサーフェスを分離しています。

OpenClaw は OpenAI 系のルートを 3 つサポートします。Codex の挙動を使いたいほとんどの ChatGPT/Codex サブスクライバーは、ネイティブ Codex app-server ランタイムを使うべきです。モデルプレフィックスはプロバイダー/モデル名を選択し、別のランタイム設定が埋め込みエージェントループを誰が実行するかを選択します。

- **API キー** - 従量課金の直接 OpenAI Platform アクセス（`openai/*` モデル）
- **ネイティブ Codex ランタイム付き Codex サブスクリプション** - ChatGPT/Codex サインインに加えて Codex app-server 実行（`openai/*` モデルに加えて `agents.defaults.agentRuntime.id: "codex"`）
- **PI 経由の Codex サブスクリプション** - 通常の OpenClaw PI ランナーを使う ChatGPT/Codex サインイン（`openai-codex/*` モデル）

OpenAI は、OpenClaw のような外部ツールやワークフローでのサブスクリプション OAuth 利用を明示的にサポートしています。

プロバイダー、モデル、ランタイム、チャネルは別々のレイヤーです。これらのラベルが混同されている場合は、設定を変更する前に [エージェントランタイム](/ja-JP/concepts/agent-runtimes) を読んでください。

## すばやい選択

| 目的                                                 | 使用するもの                                      | 注記                                                                      |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| ネイティブ Codex ランタイム付き ChatGPT/Codex サブスクリプション | `openai/gpt-5.5` に加えて `agentRuntime.id: "codex"` | ほとんどのユーザーに推奨される Codex 設定です。`openai-codex` 認証でサインインします。 |
| 直接 API キー課金                                    | `openai/gpt-5.5`                                 | `OPENAI_API_KEY` を設定するか、OpenAI API キーのオンボーディングを実行します。 |
| PI 経由の ChatGPT/Codex サブスクリプション認証       | `openai-codex/gpt-5.5`                           | 通常の PI ランナーを意図的に使いたい場合にのみ使用します。                |
| 画像生成または編集                                   | `openai/gpt-image-2`                             | `OPENAI_API_KEY` または OpenAI Codex OAuth のどちらでも動作します。       |
| 透明背景画像                                         | `openai/gpt-image-1.5`                           | `outputFormat=png` または `webp` と `openai.background=transparent` を使用します。 |

## 名前の対応表

名前は似ていますが、相互に置き換えられるものではありません。

| 表示される名前                     | レイヤー          | 意味                                                                                              |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | プロバイダープレフィックス | 直接 OpenAI Platform API ルート。                                                                 |
| `openai-codex`                     | プロバイダープレフィックス | 通常の OpenClaw PI ランナーを通る OpenAI Codex OAuth/サブスクリプションルート。                  |
| `codex` plugin                     | Plugin            | ネイティブ Codex app-server ランタイムと `/codex` チャット制御を提供する、バンドル済み OpenClaw plugin。 |
| `agentRuntime.id: codex`           | エージェントランタイム | 埋め込みターンにネイティブ Codex app-server ハーネスを強制します。                               |
| `/codex ...`                       | チャットコマンドセット | 会話から Codex app-server スレッドをバインド/制御します。                                        |
| `runtime: "acp", agentId: "codex"` | ACP セッションルート | ACP/acpx を通じて Codex を実行する明示的なフォールバックパス。                                   |

つまり、設定には意図的に `openai-codex/*` と `codex` plugin の両方を含めることができます。これは、PI 経由で Codex OAuth を使い、さらにネイティブの `/codex` チャット制御も利用可能にしたい場合に有効です。`openclaw doctor` はその組み合わせについて警告し、それが意図的かどうか確認できるようにしますが、書き換えはしません。

<Note>
GPT-5.5 は、直接 OpenAI Platform API キーアクセスとサブスクリプション/OAuth ルートの両方で利用できます。ChatGPT/Codex サブスクリプションに加えてネイティブ Codex 実行を使う場合は、`openai/gpt-5.5` を `agentRuntime.id: "codex"` と一緒に使用します。PI 経由の Codex OAuth には `openai-codex/gpt-5.5` のみを使用し、直接 `OPENAI_API_KEY` トラフィックには Codex ランタイムの上書きなしで `openai/gpt-5.5` を使用します。
</Note>

<Note>
OpenAI plugin を有効にしても、または `openai-codex/*` モデルを選択しても、バンドル済み Codex app-server plugin は有効になりません。OpenClaw は、`agentRuntime.id: "codex"` でネイティブ Codex ハーネスを明示的に選択した場合、またはレガシーの `codex/*` モデル参照を使った場合にのみ、その plugin を有効にします。
バンドル済みの `codex` plugin が有効でも `openai-codex/*` が引き続き PI 経由で解決される場合、`openclaw doctor` は警告し、ルートは変更しません。
</Note>

## OpenClaw の機能カバレッジ

| OpenAI 機能              | OpenClaw サーフェス                                      | ステータス                                             |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| チャット / Responses      | `openai/<model>` モデルプロバイダー                        | 対応                                                   |
| Codex サブスクリプションモデル | `openai-codex/<model>` と `openai-codex` OAuth            | 対応                                                   |
| Codex app-server ハーネス  | `openai/<model>` と `agentRuntime.id: codex`               | 対応                                                   |
| サーバー側 Web 検索       | ネイティブ OpenAI Responses ツール                         | Web 検索が有効で、プロバイダーが固定されていない場合は対応 |
| 画像                      | `image_generate`                                           | 対応                                                   |
| 動画                      | `video_generate`                                           | 対応                                                   |
| テキスト読み上げ          | `messages.tts.provider: "openai"` / `tts`                  | 対応                                                   |
| バッチ音声テキスト変換    | `tools.media.audio` / メディア理解                         | 対応                                                   |
| ストリーミング音声テキスト変換 | Voice Call `streaming.provider: "openai"`                  | 対応                                                   |
| リアルタイム音声          | Voice Call `realtime.provider: "openai"` / Control UI Talk | 対応                                                   |
| Embeddings                | メモリ embedding プロバイダー                              | 対応                                                   |

## メモリ embeddings

OpenClaw は、`memory_search` のインデックス作成とクエリ embeddings に、OpenAI または OpenAI 互換の embedding エンドポイントを使用できます。

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

非対称 embedding ラベルを必要とする OpenAI 互換エンドポイントでは、`memorySearch` の下に `queryInputType` と `documentInputType` を設定します。OpenClaw はこれらをプロバイダー固有の `input_type` リクエストフィールドとして転送します。クエリ embeddings は `queryInputType` を使用し、インデックス化されたメモリチャンクとバッチインデックス作成は `documentInputType` を使用します。完全な例については、[メモリ設定リファレンス](/ja-JP/reference/memory-config#provider-specific-config) を参照してください。

## はじめに

好みの認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="API キー（OpenAI Platform）">
    **最適な用途:** 直接 API アクセスと従量課金。

    <Steps>
      <Step title="API キーを取得する">
        [OpenAI Platform ダッシュボード](https://platform.openai.com/api-keys)から API キーを作成またはコピーします。
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        またはキーを直接渡します。

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
    | `openai/gpt-5.5`       | 省略 / `agentRuntime.id: "pi"`    | 直接 OpenAI Platform API    | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | 省略 / `agentRuntime.id: "pi"`    | 直接 OpenAI Platform API    | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`        | Codex app-server ハーネス   | Codex app-server |

    <Note>
    `openai/*` は、Codex app-server ハーネスを明示的に強制しない限り、直接 OpenAI API キールートです。デフォルト PI ランナー経由の Codex OAuth には `openai-codex/*` を使用し、ネイティブ Codex app-server 実行には `openai/gpt-5.5` と `agentRuntime.id: "codex"` を使用します。
    </Note>

    ### 設定例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw は `openai/gpt-5.3-codex-spark` を公開しません。ライブの OpenAI API リクエストはそのモデルを拒否し、現在の Codex カタログにも公開されていません。
    </Warning>

  </Tab>

  <Tab title="Codex サブスクリプション">
    **最適な用途:** 別の API キーではなく、ChatGPT/Codex サブスクリプションを使ってネイティブ Codex app-server 実行を行う場合。Codex クラウドには ChatGPT サインインが必要です。

    <Steps>
      <Step title="Codex OAuth を実行する">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        または OAuth を直接実行します。

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        ヘッドレス環境やコールバックに対応しにくいセットアップでは、localhost ブラウザーコールバックの代わりに ChatGPT デバイスコードフローでサインインするため、`--device-code` を追加します。

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
      <Step title="Codex 認証が利用可能か確認する">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Gateway の実行後、チャットで `/codex status` または `/codex models` を送信して、ネイティブ app-server ランタイムを確認します。
      </Step>
    </Steps>

    ### ルート概要

    | モデル参照 | ランタイム設定 | ルート | 認証 |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | ネイティブ Codex app-server ハーネス | Codex サインインまたは選択済み `openai-codex` プロファイル |
    | `openai-codex/gpt-5.5` | 省略 / `runtime: "pi"` | PI 経由の ChatGPT/Codex OAuth | Codex サインイン |
    | `openai-codex/gpt-5.4-mini` | 省略 / `runtime: "pi"` | PI 経由の ChatGPT/Codex OAuth | Codex サインイン |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | plugin が `openai-codex` を明示的に要求しない限り、引き続き PI | Codex サインイン |

    <Warning>
    古い `openai-codex/gpt-5.1*`、`openai-codex/gpt-5.2*`、または `openai-codex/gpt-5.3*` モデル参照を設定しないでください。ChatGPT/Codex OAuth アカウントは現在、これらのモデルを拒否します。PI OAuth ルートには `openai-codex/gpt-5.5` を使用し、ネイティブ Codex ランタイム実行には `agentRuntime.id: "codex"` とともに `openai/gpt-5.5` を使用してください。
    </Warning>

    <Note>
    認証/プロファイルコマンドには引き続き `openai-codex` プロバイダー ID を使用します。
    `openai-codex/*` モデルプレフィックスも、Codex OAuth 用の明示的な PI ルートです。
    バンドルされた Codex アプリサーバーハーネスを選択したり、自動有効化したりするものではありません。
    一般的なサブスクリプションとネイティブランタイムのセットアップでは、
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
          agentRuntime: { id: "codex" },
        },
      },
    }
    ```

    代わりに通常の PI ランナーで Codex OAuth を維持するには、
    `openai-codex/gpt-5.5` を使用し、Codex ランタイムのオーバーライドを省略します。

    <Note>
    オンボーディングは `~/.codex` から OAuth 素材をインポートしなくなりました。ブラウザー OAuth（デフォルト）または上記のデバイスコードフローでサインインします。OpenClaw は生成された認証情報を独自のエージェント認証ストアで管理します。
    </Note>

    ### Codex OAuth ルーティングの確認と復旧

    次のコマンドを使用して、デフォルトエージェントがどのモデル、ランタイム、
    認証ルートを使用しているかを確認します。

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get agents.defaults.agentRuntime --json
    ```

    特定のエージェントでは、`--agent <id>` を追加します。

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    2026.5.5 の `doctor --fix` 実行によって GPT-5.5 サブスクリプションのセットアップが
    `openai-codex/gpt-5.5` から `openai/gpt-5.5` に変更された場合は、デフォルトエージェントを
    Codex OAuth PI ルートに戻します。

    ```bash
    openclaw models set openai-codex/gpt-5.5
    openclaw config validate
    ```

    `models auth list --provider openai-codex` に使用可能なプロファイルが表示されない場合は、
    再度サインインします。

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex/*` は PI 経由の ChatGPT/Codex OAuth を意味します。`agentRuntime.id: "codex"` を伴う
    `openai/*` は、ネイティブ Codex アプリサーバー実行を意味します。

    ### ステータスインジケーター

    チャットの `/status` は、現在のセッションで有効なモデルランタイムを表示します。
    デフォルトの PI ハーネスは `Runtime: OpenClaw Pi Default` として表示されます。
    バンドルされた Codex アプリサーバーハーネスが選択されている場合、`/status` は
    `Runtime: OpenAI Codex` と表示します。既存のセッションは記録済みのハーネス ID を保持するため、
    `agentRuntime` を変更した後に新しい PI/Codex の選択を `/status` に反映したい場合は、
    `/new` または `/reset` を使用します。

    ### Doctor 警告

    バンドルされた `codex` Plugin が有効で、`openai-codex/*` ルートが選択されている場合、
    `openclaw doctor` はモデルがまだ PI 経由で解決されることを警告します。
    その PI サブスクリプション認証ルートが意図したものである場合にのみ、設定を変更せず維持します。
    ネイティブ Codex アプリサーバー実行を使用する場合は、`openai/<model>` と
    `agentRuntime.id: "codex"` に切り替えます。

    ### コンテキストウィンドウ上限

    OpenClaw は、モデルメタデータとランタイムコンテキスト上限を別々の値として扱います。

    Codex OAuth 経由の `openai-codex/gpt-5.5` の場合:

    - ネイティブ `contextWindow`: `1000000`
    - デフォルトランタイム `contextTokens` 上限: `272000`

    小さいデフォルト上限は、実用上レイテンシと品質の特性が優れています。`contextTokens` でオーバーライドします。

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
    ネイティブモデルメタデータの宣言には `contextWindow` を使用します。ランタイムコンテキスト予算の制限には `contextTokens` を使用します。
    </Note>

    ### カタログ復旧

    OpenClaw は、存在する場合は `gpt-5.5` に上流の Codex カタログメタデータを使用します。
    アカウントが認証済みであるにもかかわらず、ライブ Codex 検出で
    `openai-codex/gpt-5.5` 行が省略される場合、OpenClaw はその OAuth モデル行を合成し、
    cron、サブエージェント、設定済みデフォルトモデルの実行が
    `Unknown model` で失敗しないようにします。

  </Tab>
</Tabs>

## ネイティブ Codex アプリサーバー認証

ネイティブ Codex アプリサーバーハーネスは、`openai/*` モデル参照と
`agentRuntime.id: "codex"` を使用しますが、認証は引き続きアカウントベースです。OpenClaw は
次の順序で認証を選択します。

1. エージェントにバインドされた明示的な OpenClaw `openai-codex` 認証プロファイル。
2. ローカルの Codex CLI ChatGPT サインインなど、アプリサーバーの既存アカウント。
3. ローカル stdio アプリサーバー起動の場合のみ、アプリサーバーがアカウントなしを報告し、それでも
   OpenAI 認証を必要とする場合は、`CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

つまり、Gateway プロセスに直接 OpenAI モデルや埋め込み用の `OPENAI_API_KEY` があるというだけで、
ローカルの ChatGPT/Codex サブスクリプションサインインが置き換えられることはありません。
環境 API キーフォールバックは、ローカル stdio のアカウントなしパスのみです。
WebSocket アプリサーバー接続には送信されません。サブスクリプション形式の Codex
プロファイルが選択されている場合、OpenClaw は生成された stdio アプリサーバー子プロセスから
`CODEX_API_KEY` と `OPENAI_API_KEY` も除外し、選択された認証情報を
アプリサーバーログイン RPC 経由で送信します。

## 画像生成

バンドルされた `openai` Plugin は、`image_generate` ツール経由で画像生成を登録します。
同じ `openai/gpt-image-2` モデル参照を通じて、OpenAI API キーの画像生成と
Codex OAuth の画像生成の両方をサポートします。

| 機能                      | OpenAI API キー                    | Codex OAuth                         |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| モデル参照                | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 認証                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth サインイン        |
| トランスポート            | OpenAI Images API                  | Codex Responses バックエンド         |
| リクエストあたりの最大画像数 | 4                                  | 4                                    |
| 編集モード                | 有効（最大 5 枚の参照画像）        | 有効（最大 5 枚の参照画像）          |
| サイズオーバーライド      | 2K/4K サイズを含めてサポート       | 2K/4K サイズを含めてサポート         |
| アスペクト比 / 解像度     | OpenAI Images API に転送されません | 安全な場合はサポートされるサイズにマッピング |

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

`gpt-image-2` は、OpenAI のテキストから画像の生成と画像編集の両方のデフォルトです。
`gpt-image-1.5`、`gpt-image-1`、`gpt-image-1-mini` は、明示的なモデルオーバーライドとして引き続き使用できます。
透明背景の PNG/WebP 出力には `openai/gpt-image-1.5` を使用します。現在の
`gpt-image-2` API は `background: "transparent"` を拒否します。

透明背景リクエストでは、エージェントは `image_generate` を
`model: "openai/gpt-image-1.5"`、`outputFormat: "png"` または `"webp"`、および
`background: "transparent"` で呼び出す必要があります。古い `openai.background` プロバイダーオプションも
引き続き受け入れられます。OpenClaw は、デフォルトの `openai/gpt-image-2` 透明リクエストを
`gpt-image-1.5` に書き換えることで、公開 OpenAI ルートと
OpenAI Codex OAuth ルートも保護します。Azure とカスタム OpenAI 互換エンドポイントは、
設定されたデプロイメント/モデル名を維持します。

同じ設定は、ヘッドレス CLI 実行にも公開されています。

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

入力ファイルから開始する場合は、`openclaw infer image edit` で同じ
`--output-format` と `--background` フラグを使用します。
`--openai-background` は OpenAI 固有のエイリアスとして引き続き利用できます。

Codex OAuth インストールでは、同じ `openai/gpt-image-2` 参照を維持します。
`openai-codex` OAuth プロファイルが設定されている場合、OpenClaw は保存された OAuth
アクセストークンを解決し、Codex Responses バックエンド経由で画像リクエストを送信します。
そのリクエストに対して、先に `OPENAI_API_KEY` を試したり、API キーへ暗黙的にフォールバックしたりすることはありません。
代わりに直接 OpenAI Images API ルートを使用したい場合は、API キー、
カスタムベース URL、または Azure エンドポイントを指定して `models.providers.openai` を明示的に設定します。
そのカスタム画像エンドポイントが信頼済み LAN/プライベートアドレス上にある場合は、
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` も設定します。OpenClaw は、
このオプトインが存在しない限り、プライベート/内部の OpenAI 互換画像エンドポイントをブロックしたままにします。

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

| 機能             | 値                                                                                |
| ---------------- | --------------------------------------------------------------------------------- |
| デフォルトモデル | `openai/sora-2`                                                                   |
| モード           | テキストから動画、画像から動画、単一動画編集                                     |
| 参照入力         | 画像 1 枚または動画 1 本                                                          |
| サイズオーバーライド | サポート                                                                         |
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

## GPT-5 プロンプト寄与

OpenClaw は、プロバイダーを横断する GPT-5 ファミリーの実行に共有 GPT-5 プロンプト寄与を追加します。モデル ID によって適用されるため、`openai-codex/gpt-5.5`、`openai/gpt-5.5`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5`、およびその他の互換 GPT-5 参照は同じオーバーレイを受け取ります。古い GPT-4.x モデルには適用されません。

バンドルされたネイティブ Codex ハーネスは、Codex アプリサーバーの開発者指示を通じて同じ GPT-5 動作と Heartbeat オーバーレイを使用するため、`agentRuntime.id: "codex"` 経由に強制された `openai/gpt-5.x` セッションは、ハーネスプロンプトの残りを Codex が所有していても、同じフォロースルーとプロアクティブな Heartbeat ガイダンスを維持します。

GPT-5 寄与は、ペルソナ永続性、実行安全性、ツール規律、出力形状、完了チェック、検証のためのタグ付き動作契約を追加します。チャネル固有の返信とサイレントメッセージ動作は、共有 OpenClaw システムプロンプトと送信配信ポリシーに残ります。GPT-5 ガイダンスは、一致するモデルでは常に有効です。フレンドリーな対話スタイルレイヤーは別であり、設定可能です。

| 値                     | 効果                                      |
| ---------------------- | ----------------------------------------- |
| `"friendly"`（デフォルト） | フレンドリーな対話スタイルレイヤーを有効化 |
| `"on"`                 | `"friendly"` のエイリアス                 |
| `"off"`                | フレンドリースタイルレイヤーのみを無効化  |

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
値は実行時に大文字と小文字を区別しないため、`"Off"` と `"off"` はどちらも friendly スタイルレイヤーを無効にします。
</Tip>

<Note>
共有の `agents.defaults.promptOverlays.gpt5.personality` 設定が設定されていない場合、互換性のフォールバックとして従来の `plugins.entries.openai.config.personality` も引き続き読み取られます。
</Note>

## 音声とスピーチ

<AccordionGroup>
  <Accordion title="音声合成 (TTS)">
    バンドルされた `openai` plugin は、`messages.tts` サーフェスに音声合成を登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 音声 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | (未設定) |
    | 指示 | `messages.tts.providers.openai.instructions` | (未設定、`gpt-4o-mini-tts` のみ) |
    | 形式 | `messages.tts.providers.openai.responseFormat` | ボイスメモでは `opus`、ファイルでは `mp3` |
    | API キー | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` にフォールバック |
    | ベース URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 追加本文 | `messages.tts.providers.openai.extraBody` / `extra_body` | (未設定) |

    利用可能なモデル: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`。利用可能な音声: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`。

    `extraBody` は、OpenClaw が生成したフィールドの後に `/audio/speech` リクエスト JSON へマージされるため、`lang` などの追加キーが必要な OpenAI 互換エンドポイントに使用します。プロトタイプキーは無視されます。

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

  <Accordion title="音声テキスト変換">
    バンドルされた `openai` plugin は、OpenClaw のメディア理解文字起こしサーフェスを通じて
    バッチ音声テキスト変換を登録します。

    - デフォルトモデル: `gpt-4o-transcribe`
    - エンドポイント: OpenAI REST `/v1/audio/transcriptions`
    - 入力パス: multipart 音声ファイルアップロード
    - `tools.media.audio` を使用する受信音声文字起こしのすべての場所で OpenClaw によりサポートされます。これには Discord ボイスチャンネルセグメントやチャンネル音声添付ファイルが含まれます

    受信音声文字起こしで OpenAI を強制するには:

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

    共有音声メディア設定または呼び出しごとの文字起こしリクエストで指定された場合、
    言語とプロンプトヒントは OpenAI に転送されます。

  </Accordion>

  <Accordion title="リアルタイム文字起こし">
    バンドルされた `openai` plugin は、Voice Call plugin にリアルタイム文字起こしを登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 言語 | `...openai.language` | (未設定) |
    | プロンプト | `...openai.prompt` | (未設定) |
    | 無音時間 | `...openai.silenceDurationMs` | `800` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | API キー | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    G.711 u-law (`g711_ulaw` / `audio/pcmu`) 音声で `wss://api.openai.com/v1/realtime` への WebSocket 接続を使用します。このストリーミングプロバイダーは Voice Call のリアルタイム文字起こしパス向けです。Discord 音声は現在、短いセグメントを録音し、代わりにバッチの `tools.media.audio` 文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="リアルタイム音声">
    バンドルされた `openai` plugin は、Voice Call plugin にリアルタイム音声を登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | 音声 | `...openai.voice` | `alloy` |
    | 温度 | `...openai.temperature` | `0.8` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | 無音時間 | `...openai.silenceDurationMs` | `500` |
    | API キー | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    バックエンドのリアルタイムブリッジ用に、`azureEndpoint` および `azureDeployment` 設定キー経由で Azure OpenAI をサポートします。双方向のツール呼び出しをサポートします。G.711 u-law 音声形式を使用します。
    </Note>

    <Note>
    Control UI Talk は、Gateway が発行した一時的なクライアントシークレットと、OpenAI Realtime API に対する直接のブラウザー WebRTC SDP 交換を使用して、OpenAI ブラウザーリアルタイムセッションを使用します。メンテナーのライブ検証は `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` で利用できます。OpenAI 側は Node でクライアントシークレットを発行し、偽のマイクメディアを使ってブラウザー SDP オファーを生成し、それを OpenAI に投稿して、シークレットをログに記録せずに SDP アンサーを適用します。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI エンドポイント

バンドルされた `openai` プロバイダーは、ベース URL を上書きすることで画像生成用に Azure OpenAI リソースをターゲットにできます。画像生成パスでは、OpenClaw は `models.providers.openai.baseUrl` 上の Azure ホスト名を検出し、Azure のリクエスト形式に自動的に切り替えます。

<Note>
リアルタイム音声は別の設定パス
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
を使用し、`models.providers.openai.baseUrl` の影響を受けません。Azure
設定については、[音声とスピーチ](#voice-and-speech) の下にある **リアルタイム音声** アコーディオンを参照してください。
</Note>

次の場合は Azure OpenAI を使用します。

- Azure OpenAI のサブスクリプション、クォータ、またはエンタープライズ契約をすでに持っている
- Azure が提供するリージョン内データ保存やコンプライアンス制御が必要
- 既存の Azure テナンシー内にトラフィックを維持したい

### 設定

バンドルされた `openai` プロバイダーを通じた Azure 画像生成では、
`models.providers.openai.baseUrl` を Azure リソースに向け、`apiKey` を
Azure OpenAI キー (OpenAI Platform キーではない) に設定します。

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

OpenClaw は、Azure 画像生成ルート用に次の Azure ホストサフィックスを認識します。

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

認識された Azure ホストでの画像生成リクエストでは、OpenClaw は次のことを行います。

- `Authorization: Bearer` の代わりに `api-key` ヘッダーを送信する
- デプロイスコープのパス (`/openai/deployments/{deployment}/...`) を使用する
- 各リクエストに `?api-version=...` を追加する
- Azure 画像生成呼び出しに 600 秒のデフォルトリクエストタイムアウトを使用する。
  呼び出しごとの `timeoutMs` 値は引き続きこのデフォルトを上書きします。

その他のベース URL (公開 OpenAI、OpenAI 互換プロキシ) は、標準の
OpenAI 画像リクエスト形式を維持します。

<Note>
`openai` プロバイダーの画像生成パスにおける Azure ルーティングには、
OpenClaw 2026.4.22 以降が必要です。それ以前のバージョンでは、カスタム
`openai.baseUrl` はすべて公開 OpenAI エンドポイントと同様に扱われ、Azure
画像デプロイに対しては失敗します。
</Note>

### API バージョン

Azure 画像生成パス用に特定の Azure プレビュー版または GA バージョンを固定するには、
`AZURE_OPENAI_API_VERSION` を設定します。

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

変数が未設定の場合のデフォルトは `2024-12-01-preview` です。

### モデル名はデプロイ名

Azure OpenAI はモデルをデプロイにバインドします。バンドルされた `openai` プロバイダーを通じてルーティングされる Azure 画像生成リクエストでは、OpenClaw の `model` フィールドは、公開 OpenAI モデル ID ではなく、Azure ポータルで設定した **Azure デプロイ名** である必要があります。

`gpt-image-2` を提供する `gpt-image-2-prod` というデプロイを作成した場合:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同じデプロイ名ルールは、バンドルされた `openai` プロバイダーを通じてルーティングされる画像生成呼び出しにも適用されます。

### リージョンでの利用可否

Azure 画像生成は現在、一部のリージョンでのみ利用できます
(例: `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`)。デプロイを作成する前に Microsoft の最新リージョン一覧を確認し、
特定のモデルが自分のリージョンで提供されていることを確認してください。

### パラメーターの違い

Azure OpenAI と公開 OpenAI は、同じ画像パラメーターを常に受け付けるとは限りません。
Azure は、公開 OpenAI が許可するオプション (たとえば `gpt-image-2` の特定の
`background` 値) を拒否したり、特定のモデルバージョンでのみ公開したりする場合があります。
これらの違いは Azure と基盤モデルに由来するもので、OpenClaw ではありません。Azure リクエストが検証エラーで失敗した場合は、Azure ポータルで特定のデプロイと API バージョンがサポートするパラメーターセットを確認してください。

<Note>
Azure OpenAI はネイティブトランスポートと互換動作を使用しますが、OpenClaw の隠しアトリビューションヘッダーは受け取りません — [高度な設定](#advanced-configuration) の下にある **ネイティブ vs OpenAI 互換ルート** アコーディオンを参照してください。

Azure 上のチャットまたは Responses トラフィック (画像生成以外) には、オンボーディングフローまたは専用の Azure プロバイダー設定を使用します。`openai.baseUrl` だけでは Azure API/認証形式は適用されません。別の `azure-openai-responses/*` プロバイダーが存在します。下の Server-side compaction アコーディオンを参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="トランスポート (WebSocket vs SSE)">
    OpenClaw は `openai/*` と `openai-codex/*` の両方で、SSE フォールバック付きの WebSocket 優先 (`"auto"`) を使用します。

    `"auto"` モードでは、OpenClaw は次のことを行います。
    - SSE にフォールバックする前に、初期の WebSocket 失敗を 1 回再試行する
    - 失敗後、WebSocket を約 60 秒間劣化状態としてマークし、クールダウン中は SSE を使用する
    - 再試行と再接続のために、安定したセッションおよびターン識別ヘッダーを添付する
    - トランスポートのバリエーション間で使用量カウンター (`input_tokens` / `prompt_tokens`) を正規化する

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
    - [WebSocket を使用した Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [ストリーミング API レスポンス (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket ウォームアップ">
    OpenClaw は、最初のターンのレイテンシを低減するため、`openai/*` と `openai-codex/*` でデフォルトで WebSocket ウォームアップを有効にします。

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

  <Accordion title="高速モード">
    OpenClaw は `openai/*` と `openai-codex/*` 向けに共有の高速モード切り替えを公開します:

    - **チャット/UI:** `/fast status|on|off`
    - **設定:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    有効にすると、OpenClaw は高速モードを OpenAI の優先処理 (`service_tier = "priority"`) に対応付けます。既存の `service_tier` 値は保持され、高速モードによって `reasoning` や `text.verbosity` が書き換えられることはありません。

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
    セッションの上書きは設定より優先されます。Sessions UI でセッションの上書きをクリアすると、そのセッションは設定済みのデフォルトに戻ります。
    </Note>

  </Accordion>

  <Accordion title="優先処理 (service_tier)">
    OpenAI の API は `service_tier` を通じて優先処理を公開しています。OpenClaw ではモデルごとに設定します。

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

    サポートされる値: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` はネイティブ OpenAI エンドポイント (`api.openai.com`) とネイティブ Codex エンドポイント (`chatgpt.com/backend-api`) にのみ転送されます。どちらかのプロバイダーをプロキシ経由でルーティングする場合、OpenClaw は `service_tier` をそのままにします。
    </Warning>

  </Accordion>

  <Accordion title="サーバー側 Compaction (Responses API)">
    直接の OpenAI Responses モデル (`openai/*` on `api.openai.com`) では、OpenAI Plugin の Pi ハーネスストリームラッパーがサーバー側 Compaction を自動的に有効にします。

    - `store: true` を強制します (モデル互換性で `supportsStore: false` が設定されている場合を除く)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` を注入します
    - デフォルトの `compact_threshold`: `contextWindow` の 70% (利用できない場合は `80000`)

    これは組み込みの Pi ハーネスパスと、埋め込み実行で使われる OpenAI プロバイダーフックに適用されます。ネイティブ Codex アプリサーバーハーネスは Codex を通じて独自のコンテキストを管理し、`agents.defaults.agentRuntime.id` で別途設定されます。

    <Tabs>
      <Tab title="明示的に有効化">
        Azure OpenAI Responses などの互換エンドポイントで有用です。

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
    `responsesServerCompaction` は `context_management` の注入だけを制御します。直接の OpenAI Responses モデルは、互換性で `supportsStore: false` が設定されていない限り、引き続き `store: true` を強制します。
    </Note>

  </Accordion>

  <Accordion title="厳格なエージェント型 GPT モード">
    `openai/*` での GPT-5 系列の実行では、OpenClaw はより厳格な埋め込み実行契約を使用できます。

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
    - ツールアクションが利用可能な場合、計画だけのターンを成功した進捗として扱わなくなります
    - 今すぐ実行するよう誘導してターンを再試行します
    - 実質的な作業では `update_plan` を自動的に有効にします
    - モデルが行動せずに計画を続ける場合、明示的なブロック状態を表示します

    <Note>
    OpenAI と Codex の GPT-5 系列の実行のみにスコープされます。その他のプロバイダーや古いモデル系列はデフォルト動作を維持します。
    </Note>

  </Accordion>

  <Accordion title="ネイティブルートと OpenAI 互換ルート">
    OpenClaw は、直接の OpenAI、Codex、Azure OpenAI エンドポイントを、汎用の OpenAI 互換 `/v1` プロキシとは異なるものとして扱います。

    **ネイティブルート** (`openai/*`, Azure OpenAI):
    - OpenAI の `none` effort をサポートするモデルに対してのみ、`reasoning: { effort: "none" }` を保持します
    - `reasoning.effort: "none"` を拒否するモデルまたはプロキシでは、無効化された reasoning を省略します
    - ツールスキーマをデフォルトで厳格モードにします
    - 検証済みのネイティブホストにのみ非表示の attribution ヘッダーを付加します
    - OpenAI 専用のリクエスト整形 (`service_tier`, `store`, reasoning 互換性, prompt-cache ヒント) を維持します

    **プロキシ/互換ルート:**
    - より緩やかな互換動作を使用します
    - ネイティブでない `openai-completions` ペイロードから Completions の `store` を取り除きます
    - OpenAI 互換 Completions プロキシ向けに、高度な `params.extra_body`/`params.extraBody` のパススルー JSON を受け入れます
    - vLLM などの OpenAI 互換 Completions プロキシ向けに `params.chat_template_kwargs` を受け入れます
    - 厳格なツールスキーマやネイティブ専用ヘッダーを強制しません

    Azure OpenAI はネイティブトランスポートと互換動作を使用しますが、非表示の attribution ヘッダーは受け取りません。

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
