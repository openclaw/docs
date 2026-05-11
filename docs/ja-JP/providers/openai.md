---
read_when:
    - OpenClaw で OpenAI モデルを使用したい場合
    - API キーではなく Codex のサブスクリプション認証を使いたい
    - より厳格な GPT-5 エージェント実行動作が必要です
summary: OpenClaw で API キーまたは Codex サブスクリプションを使って OpenAI を利用する
title: OpenAI
x-i18n:
    generated_at: "2026-05-11T20:36:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: d63b8eff93ecffd85c2110f42044c26621ff50eb62c35b7cc99a07f0e6be1ffb
    source_path: providers/openai.md
    workflow: 16
---

OpenAI は GPT モデル向けの開発者 API を提供しており、Codex は OpenAI の Codex クライアントを通じて ChatGPT プランのコーディングエージェントとしても利用できます。OpenClaw は、設定を予測しやすく保つために、これらのサーフェスを分離しています。

OpenClaw は、正規の OpenAI モデルルートとして `openai/*` を使用します。OpenAI モデル上の埋め込みエージェントターンは、デフォルトでネイティブの Codex app-server ランタイムを通じて実行されます。直接の OpenAI API キー認証は、画像、埋め込み、音声、リアルタイムなど、エージェント以外の OpenAI サーフェスで引き続き利用できます。

- **エージェントモデル** - Codex ランタイム経由の `openai/*` モデル。ChatGPT/Codex サブスクリプション利用では Codex 認証でサインインするか、API キー認証を意図的に使いたい場合は Codex 互換の OpenAI API キーバックアップを設定します。
- **エージェント以外の OpenAI API** - `OPENAI_API_KEY` または OpenAI API キーのオンボーディングを通じた、利用量ベース課金の直接 OpenAI Platform アクセス。
- **レガシー設定** - `openai-codex/*` モデル参照は、`openclaw doctor --fix` によって `openai/*` と Codex ランタイムへ修復されます。

OpenAI は、OpenClaw のような外部ツールやワークフローでのサブスクリプション OAuth 利用を明示的にサポートしています。

プロバイダー、モデル、ランタイム、チャンネルは別々のレイヤーです。これらのラベルが混同されている場合は、設定を変更する前に [エージェントランタイム](/ja-JP/concepts/agent-runtimes) を読んでください。

## クイック選択

| 目的                                                 | 使用するもの                                                      | 注記                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| ネイティブ Codex ランタイムでの ChatGPT/Codex サブスクリプション | `openai/gpt-5.5`                                         | デフォルトの OpenAI エージェント設定。Codex 認証でサインインします。                  |
| エージェントモデルの直接 API キー課金              | `openai/gpt-5.5` と Codex 互換 API キープロファイル | `auth.order.openai` を使用して、サブスクリプション認証の後にバックアップを配置します。  |
| 明示的な PI を通じた直接 API キー課金           | `openai/gpt-5.5` とプロバイダー/モデルランタイム `pi`        | 通常の `openai` API キープロファイルを選択します。                             |
| 最新の ChatGPT Instant API エイリアス                     | `openai/chat-latest`                                     | 直接 API キーのみ。実験用の移動エイリアスであり、デフォルトではありません。   |
| 明示的な PI を通じた ChatGPT/Codex サブスクリプション認証  | `openai/gpt-5.5` とプロバイダー/モデルランタイム `pi`        | 互換ルート用に `openai-codex` 認証プロファイルを選択します。    |
| 画像生成または編集                          | `openai/gpt-image-2`                                     | `OPENAI_API_KEY` または OpenAI Codex OAuth のどちらでも動作します。             |
| 透明背景画像                        | `openai/gpt-image-1.5`                                   | `outputFormat=png` または `webp` と `openai.background=transparent` を使用します。 |

## 名前の対応表

名前は似ていますが、相互に置き換えられるものではありません。

| 表示される名前                            | レイヤー                      | 意味                                                                                                              |
| --------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `openai`                                | プロバイダー接頭辞            | 正規の OpenAI モデルルート。エージェントターンは Codex ランタイムを使用します。                                                     |
| `openai-codex`                          | レガシー認証/プロファイル接頭辞 | 古い OpenAI Codex OAuth/サブスクリプションプロファイル名前空間。既存のプロファイルと `auth.order.openai-codex` は引き続き動作します。 |
| `codex` plugin                          | Plugin                     | ネイティブ Codex app-server ランタイムと `/codex` チャット制御を提供する、バンドル済み OpenClaw plugin。                    |
| プロバイダー/モデル `agentRuntime.id: codex` | エージェントランタイム              | 一致する埋め込みターンに対して、ネイティブ Codex app-server ハーネスを強制します。                                               |
| `/codex ...`                            | チャットコマンドセット           | 会話から Codex app-server スレッドをバインド/制御します。                                                           |
| `runtime: "acp", agentId: "codex"`      | ACP セッションルート          | ACP/acpx を通じて Codex を実行する明示的なフォールバックパス。                                                             |

つまり、設定には意図的に `openai/*` モデル参照を含めつつ、認証プロファイルは Codex 互換の認証情報を指すことができます。新しい設定では `auth.order.openai` を推奨します。既存の `openai-codex:*` プロファイルと `auth.order.openai-codex` は引き続きサポートされます。`openclaw doctor --fix` は、レガシーな `openai-codex/*` モデル参照を正規の OpenAI モデルルートへ書き換えます。

<Note>
GPT-5.5 は、直接の OpenAI Platform API キーアクセスとサブスクリプション/OAuth ルートの両方で利用できます。ChatGPT/Codex サブスクリプションとネイティブ Codex 実行を組み合わせる場合は、`openai/gpt-5.5` を使用します。ランタイム設定を未設定にすると、OpenAI エージェントターンには Codex ハーネスが選択されるようになりました。OpenAI API キープロファイルは、OpenAI エージェントモデルで直接 API キー認証を使いたい場合にのみ使用してください。
</Note>

<Note>
OpenAI エージェントモデルターンには、バンドル済みの Codex app-server plugin が必要です。明示的な PI ランタイム設定は、オプトインの互換ルートとして引き続き利用できます。`openai-codex` 認証プロファイルで PI が明示的に選択されている場合、OpenClaw は公開モデル参照を `openai/*` のまま保持し、内部ではレガシーな Codex 認証トランスポートを通じて PI をルーティングします。古い `openai-codex/*` モデル参照、または明示的なランタイム設定に由来しない古い PI セッション固定を修復するには、`openclaw doctor --fix` を実行してください。
</Note>

## OpenClaw の機能対応範囲

| OpenAI 機能         | OpenClaw サーフェス                                                                 | ステータス                                                 |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | `openai/<model>` モデルプロバイダー                                                  | 対応                                                    |
| Codex サブスクリプションモデル | `openai/<model>` と `openai-codex` OAuth                                       | 対応                                                    |
| レガシー Codex モデル参照   | `openai-codex/<model>`                                                           | doctor によって `openai/<model>` へ修復                 |
| Codex app-server ハーネス  | ランタイム省略、またはプロバイダー/モデル `agentRuntime.id: codex` の `openai/<model>` | 対応                                                    |
| サーバー側 Web 検索    | ネイティブ OpenAI Responses ツール                                                     | Web 検索が有効でプロバイダーが固定されていない場合は対応 |
| 画像                    | `image_generate`                                                                 | 対応                                                    |
| 動画                    | `video_generate`                                                                 | 対応                                                    |
| テキスト読み上げ            | `messages.tts.provider: "openai"` / `tts`                                        | 対応                                                    |
| バッチ音声テキスト化      | `tools.media.audio` / メディア理解                                        | 対応                                                    |
| ストリーミング音声テキスト化  | Voice Call `streaming.provider: "openai"`                                        | 対応                                                    |
| リアルタイム音声            | Voice Call `realtime.provider: "openai"` / Control UI Talk                       | 対応                                                    |
| 埋め込み                | メモリ埋め込みプロバイダー                                                        | 対応                                                    |

## メモリ埋め込み

OpenClaw は、`memory_search` のインデックス作成とクエリ埋め込みに OpenAI、または OpenAI 互換の埋め込みエンドポイントを使用できます。

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

非対称な埋め込みラベルを必要とする OpenAI 互換エンドポイントでは、`memorySearch` の下に `queryInputType` と `documentInputType` を設定します。OpenClaw はこれらをプロバイダー固有の `input_type` リクエストフィールドとして転送します。クエリ埋め込みには `queryInputType`、インデックス化されたメモリチャンクとバッチインデックス作成には `documentInputType` が使用されます。完全な例については、[メモリ設定リファレンス](/ja-JP/reference/memory-config#provider-specific-config) を参照してください。

## はじめに

希望する認証方法を選択し、セットアップ手順に従ってください。

<Tabs>
  <Tab title="API キー (OpenAI Platform)">
    **最適な用途:** 直接 API アクセスと利用量ベース課金。

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
    | `openai/gpt-5.5`      | 省略 / プロバイダー/モデル `agentRuntime.id: "codex"` | Codex app-server ハーネス | Codex 互換 OpenAI プロファイル |
    | `openai/gpt-5.4-mini` | 省略 / プロバイダー/モデル `agentRuntime.id: "codex"` | Codex app-server ハーネス | Codex 互換 OpenAI プロファイル |
    | `openai/gpt-5.5`      | プロバイダー/モデル `agentRuntime.id: "pi"`              | PI 埋め込みランタイム      | `openai` プロファイルまたは選択された `openai-codex` プロファイル |

    <Note>
    `openai/*` エージェントモデルは Codex app-server ハーネスを使用します。エージェントモデルで API キー認証を使用するには、Codex 互換 API キープロファイルを作成し、`auth.order.openai` で順序付けします。`OPENAI_API_KEY` は、エージェント以外の OpenAI API サーフェスに対する直接フォールバックのままです。古い `auth.order.openai-codex` エントリも引き続き動作します。
    </Note>

    ### 設定例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    OpenAI API から ChatGPT の現在の Instant モデルを試すには、モデルを `openai/chat-latest` に設定します。

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` は移動エイリアスです。OpenAI はこれを ChatGPT で使用される最新の Instant モデルとして文書化しており、本番 API 利用には `gpt-5.5` を推奨しています。そのため、そのエイリアス動作を明示的に必要としない限り、安定したデフォルトとして `openai/gpt-5.5` を維持してください。このエイリアスは現在、テキスト詳細度として `medium` のみを受け付けるため、OpenClaw はこのモデルに対する互換性のない OpenAI テキスト詳細度オーバーライドを正規化します。

    <Warning>
    OpenClaw は `openai/gpt-5.3-codex-spark` を公開していません。ライブの OpenAI API リクエストはそのモデルを拒否し、現在の Codex カタログにも公開されていません。
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **最適な用途:** 個別の API キーではなく、ネイティブ Codex アプリサーバー実行で ChatGPT/Codex サブスクリプションを使用する場合。Codex クラウドには ChatGPT サインインが必要です。

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        または OAuth を直接実行します。

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        ヘッドレス環境やコールバックを受け付けにくいセットアップでは、`--device-code` を追加して、localhost ブラウザーコールバックではなく ChatGPT デバイスコードフローでサインインします。

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Use the canonical OpenAI model route">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        デフォルトパスではランタイム設定は不要です。OpenAI エージェントターンは
        ネイティブ Codex アプリサーバーランタイムを自動的に選択し、このルートが選ばれると
        OpenClaw はバンドル済み Codex Plugin をインストールまたは修復します。
      </Step>
      <Step title="Verify Codex auth is available">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Gateway の実行後、チャットで `/codex status` または `/codex models`
        を送信して、ネイティブアプリサーバーランタイムを確認します。
      </Step>
    </Steps>

    ### ルートの概要

    | モデル参照 | ランタイム設定 | ルート | 認証 |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | 省略 / プロバイダー/モデル `agentRuntime.id: "codex"` | ネイティブ Codex アプリサーバーハーネス | Codex サインインまたは順序付き `openai` 認証プロファイル |
    | `openai/gpt-5.5` | プロバイダー/モデル `agentRuntime.id: "pi"` | 内部 Codex 認証トランスポートを使う PI 埋め込みランタイム | 選択された `openai-codex` プロファイル |
    | `openai-codex/gpt-5.5` | doctor によって修復 | `openai/gpt-5.5` に書き換えられるレガシールート | 既存の `openai-codex` プロファイル |

    <Warning>
    古い `openai-codex/gpt-5.1*`、`openai-codex/gpt-5.2*`、または
    `openai-codex/gpt-5.3*` モデル参照を設定しないでください。ChatGPT/Codex OAuth アカウントは現在、
    これらのモデルを拒否します。`openai/gpt-5.5` を使用してください。OpenAI エージェントターンは現在、デフォルトで Codex
    ランタイムを選択します。
    </Warning>

    <Note>
    `openai-codex/*` モデルプレフィックスは、doctor によって修復されるレガシー設定です。
    一般的なサブスクリプションとネイティブランタイムのセットアップでは、Codex 認証でサインインしますが、
    モデル参照は `openai/gpt-5.5` のままにします。新しい設定では OpenAI
    エージェント認証順序を `auth.order.openai` の下に置く必要があります。古い `auth.order.openai-codex`
    エントリーも引き続き有効です。
    </Note>

    ### 設定例

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    API キーのバックアップがある場合は、モデルを `openai/gpt-5.5` のままにし、
    認証順序を `openai` の下に置きます。OpenClaw は Codex ハーネスのまま、
    まずサブスクリプションを試し、その後 API キーを試します。

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai-codex:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    オンボーディングは、`~/.codex` から OAuth 情報をインポートしなくなりました。ブラウザー OAuth（デフォルト）または上記のデバイスコードフローでサインインしてください。OpenClaw は生成された認証情報を独自のエージェント認証ストアで管理します。
    </Note>

    ### Codex OAuth ルーティングを確認して復旧する

    次のコマンドを使って、デフォルトエージェントが使用しているモデル、ランタイム、
    認証ルートを確認します。

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    特定のエージェントでは、`--agent <id>` を追加します。

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    古い設定にまだ `openai-codex/gpt-*` がある場合、または明示的なランタイム設定なしに古い OpenAI PI
    セッションピンがある場合は、修復します。

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    `models auth list --provider openai-codex` が使用可能なプロファイルを表示しない場合は、
    もう一度サインインします。

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai/*` は、Codex 経由の OpenAI エージェントターン用モデルルートです。
    `openai-codex` 認証/プロファイルプロバイダー ID は、既存の
    プロファイルと CLI 一覧表示で引き続き受け入れられます。

    ### ステータスインジケーター

    チャットの `/status` は、現在のセッションでどのモデルランタイムが有効かを表示します。
    バンドル済み Codex アプリサーバーハーネスは、OpenAI エージェントモデルターンで
    `Runtime: OpenAI Codex` と表示されます。古い PI セッションピンは、設定で明示的に PI が固定されていない限り、
    Codex に修復されます。

    ### Doctor 警告

    `openai-codex/*` ルートまたは古い OpenAI PI ピンが設定や
    セッション状態に残っている場合、PI が明示的に設定されていない限り、
    `openclaw doctor --fix` はそれらを Codex ランタイム付きの `openai/*` に書き換えます。

    ### コンテキストウィンドウ上限

    OpenClaw はモデルメタデータとランタイムコンテキスト上限を別々の値として扱います。

    Codex OAuth カタログ経由の `openai/gpt-5.5` では次のとおりです。

    - ネイティブ `contextWindow`: `1000000`
    - デフォルトランタイム `contextTokens` 上限: `272000`

    小さいデフォルト上限は、実際にはレイテンシと品質の特性が優れています。`contextTokens` で上書きします。

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

    ### カタログの復旧

    OpenClaw は、存在する場合は `gpt-5.5` に upstream Codex カタログメタデータを使用します。
    アカウントが認証済みであるにもかかわらず、ライブ Codex 検出で `gpt-5.5` 行が省略される場合、
    OpenClaw はその OAuth モデル行を合成するため、
    cron、サブエージェント、設定済みデフォルトモデルの実行が
    `Unknown model` で失敗しません。

  </Tab>
</Tabs>

## ネイティブ Codex アプリサーバー認証

ネイティブ Codex アプリサーバーハーネスは、`openai/*` モデル参照と、省略された
ランタイム設定またはプロバイダー/モデル `agentRuntime.id: "codex"` を使用しますが、その認証は
引き続きアカウントベースです。OpenClaw は次の順序で認証を選択します。

1. エージェント用の順序付き OpenAI 認証プロファイル。できれば
   `auth.order.openai` の下に置きます。既存の `openai-codex:*` プロファイルと
   `auth.order.openai-codex` は、古いインストールでも引き続き有効です。
2. ローカル Codex CLI ChatGPT サインインなど、アプリサーバーの既存アカウント。
3. ローカル stdio アプリサーバー起動の場合のみ、アプリサーバーがアカウントなしを報告し、なお
   OpenAI 認証を必要とする場合は、`CODEX_API_KEY`、その後
   `OPENAI_API_KEY`。

つまり、Gateway プロセスにも直接 OpenAI モデルや
埋め込み用の `OPENAI_API_KEY` があるという理由だけで、ローカル ChatGPT/Codex サブスクリプションサインインが置き換えられることはありません。
環境変数 API キーフォールバックは、ローカル stdio のアカウントなしパスだけです。これは
WebSocket アプリサーバー接続には送信されません。サブスクリプション形式の Codex
プロファイルが選択されると、OpenClaw は生成した stdio アプリサーバー子プロセスから
`CODEX_API_KEY` と `OPENAI_API_KEY` も除外し、選択された認証情報を
アプリサーバーログイン RPC 経由で送信します。そのサブスクリプションプロファイルが
Codex 使用量制限でブロックされると、OpenClaw は、選択されたモデルを変更したり Codex
ハーネスから外れたりせずに、次の順序付き `openai:*` API キー
プロファイルへローテーションできます。サブスクリプションのリセット時刻を過ぎると、サブスクリプションプロファイルは
再び対象になります。

## 画像生成

バンドル済み `openai` Plugin は、`image_generate` ツール経由で画像生成を登録します。
同じ `openai/gpt-image-2` モデル参照を通じて、OpenAI API キー画像生成と Codex OAuth 画像生成の両方をサポートします。

| 機能                | OpenAI API キー                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| モデル参照                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 認証                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth サインイン           |
| トランスポート                 | OpenAI Images API                  | Codex Responses バックエンド              |
| リクエストあたりの最大画像数    | 4                                  | 4                                    |
| 編集モード                 | 有効（参照画像は最大 5 枚） | 有効（参照画像は最大 5 枚）   |
| サイズ上書き            | 2K/4K サイズを含めてサポート   | 2K/4K サイズを含めてサポート     |
| アスペクト比 / 解像度 | OpenAI Images API には転送されません | 安全な場合、サポートされるサイズにマッピング |

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
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[画像生成](/ja-JP/tools/image-generation)を参照してください。
</Note>

`gpt-image-2` は、OpenAI のテキストから画像生成と画像編集の両方のデフォルトです。
`gpt-image-1.5`、`gpt-image-1`、`gpt-image-1-mini` は、明示的なモデル上書きとして引き続き使用できます。
透過背景の PNG/WebP 出力には `openai/gpt-image-1.5` を使用してください。現在の `gpt-image-2` API は
`background: "transparent"` を拒否します。

透過背景リクエストでは、エージェントは `model: "openai/gpt-image-1.5"`、`outputFormat: "png"` または `"webp"`、および
`background: "transparent"` を指定して `image_generate` を呼び出す必要があります。古い `openai.background` プロバイダーオプションも
引き続き受け入れられます。OpenClaw は、デフォルトの `openai/gpt-image-2` 透過
リクエストを `gpt-image-1.5` に書き換えることで、公開 OpenAI と
OpenAI Codex OAuth ルートも保護します。Azure とカスタム OpenAI 互換エンドポイントは、
設定済みのデプロイ/モデル名を維持します。

同じ設定は、ヘッドレス CLI 実行にも公開されています。

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

入力ファイルから開始する場合は、`openclaw infer image edit` で同じ `--output-format` と
`--background` フラグを使用します。
`--openai-background` は OpenAI 固有のエイリアスとして引き続き利用できます。

Codex OAuth インストールでは、同じ `openai/gpt-image-2` 参照を維持します。
`openai-codex` OAuth プロファイルが設定されている場合、OpenClaw は保存済みの OAuth
アクセストークンを解決し、Codex Responses バックエンド経由で画像リクエストを送信します。
そのリクエストに対して、最初に `OPENAI_API_KEY` を試したり、API キーへ暗黙にフォールバックしたりはしません。
代わりに直接 OpenAI Images API ルートを使いたい場合は、
API キー、カスタムベース URL、または Azure エンドポイントを指定して `models.providers.openai` を明示的に設定してください。
そのカスタム画像エンドポイントが信頼済み LAN/プライベートアドレス上にある場合は、
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` も設定します。OpenClaw は、このオプトインがない限り、
プライベート/内部 OpenAI 互換画像エンドポイントをブロックしたままにします。

生成:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

透過 PNG を生成:

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
| 既定モデル       | `openai/sora-2`                                                                   |
| モード           | テキストから動画、画像から動画、単一動画編集                                      |
| 参照入力         | 画像 1 点または動画 1 本                                                          |
| サイズオーバーライド | サポートあり                                                                  |
| その他のオーバーライド | `aspectRatio`、`resolution`、`audio`、`watermark` はツール警告とともに無視されます |

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

OpenClaw は、プロバイダーをまたぐ GPT-5 ファミリーの実行に対して、共有 GPT-5 プロンプト寄与を追加します。これはモデル ID によって適用されるため、`openai/gpt-5.5`、`openai-codex/gpt-5.5` のような修復前のレガシー参照、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5`、その他の互換 GPT-5 参照は同じオーバーレイを受け取ります。古い GPT-4.x モデルには適用されません。

同梱のネイティブ Codex ハーネスは、Codex app-server の開発者向け指示を通じて、同じ GPT-5 動作と Heartbeat オーバーレイを使用します。そのため、Codex を経由してルーティングされる `openai/gpt-5.x` セッションは、ハーネスプロンプトの残りを Codex が所有していても、同じフォロースルーとプロアクティブな Heartbeat ガイダンスを維持します。

GPT-5 寄与は、ペルソナの持続性、実行の安全性、ツール規律、出力形式、完了チェック、検証のためのタグ付き動作契約を追加します。チャンネル固有の返信とサイレントメッセージの動作は、共有 OpenClaw システムプロンプトとアウトバウンド配信ポリシーに残ります。GPT-5 ガイダンスは、一致するモデルに対して常に有効です。親しみやすい対話スタイルレイヤーは別個で、設定可能です。

| 値                     | 効果                                      |
| ---------------------- | ----------------------------------------- |
| `"friendly"` (既定)    | 親しみやすい対話スタイルレイヤーを有効化 |
| `"on"`                 | `"friendly"` の別名                       |
| `"off"`                | 親しみやすいスタイルレイヤーのみを無効化 |

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
値は実行時に大文字と小文字を区別しないため、`"Off"` と `"off"` はどちらも親しみやすいスタイルレイヤーを無効にします。
</Tip>

<Note>
共有 `agents.defaults.promptOverlays.gpt5.personality` 設定が未設定の場合、互換性フォールバックとしてレガシーの `plugins.entries.openai.config.personality` も引き続き読み取られます。
</Note>

## 音声と発話

<AccordionGroup>
  <Accordion title="音声合成 (TTS)">
    同梱の `openai` Plugin は、`messages.tts` サーフェスに音声合成を登録します。

    | 設定 | 設定パス | 既定 |
    |---------|------------|---------|
    | モデル | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 音声 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | (未設定) |
    | 指示 | `messages.tts.providers.openai.instructions` | (未設定、`gpt-4o-mini-tts` のみ) |
    | 形式 | `messages.tts.providers.openai.responseFormat` | ボイスメモでは `opus`、ファイルでは `mp3` |
    | API キー | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` にフォールバック |
    | ベース URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 追加ボディ | `messages.tts.providers.openai.extraBody` / `extra_body` | (未設定) |

    利用可能なモデル: `gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。利用可能な音声: `alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` は、OpenClaw が生成したフィールドの後に `/audio/speech` リクエスト JSON へマージされるため、`lang` などの追加キーを必要とする OpenAI 互換エンドポイントに使用してください。プロトタイプキーは無視されます。

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
    チャット API エンドポイントに影響を与えずに TTS ベース URL を上書きするには、`OPENAI_TTS_BASE_URL` を設定します。OpenAI TTS は引き続き API キーを通じて設定されます。OAuth のみのライブトークバックには、エージェントモードの STT -> TTS 音声ではなく、Realtime 音声パスを使用してください。
    </Note>

  </Accordion>

  <Accordion title="音声からテキスト">
    同梱の `openai` Plugin は、OpenClaw のメディア理解文字起こしサーフェスを通じて
    バッチ音声テキスト化を登録します。

    - 既定モデル: `gpt-4o-transcribe`
    - エンドポイント: OpenAI REST `/v1/audio/transcriptions`
    - 入力パス: マルチパート音声ファイルアップロード
    - OpenClaw では、Discord 音声チャンネルセグメントやチャンネル
      音声添付ファイルを含め、受信音声文字起こしが `tools.media.audio` を使用する場所でサポートされます

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
    言語とプロンプトのヒントは OpenAI に転送されます。

  </Accordion>

  <Accordion title="Realtime transcription">
    同梱の `openai` Plugin は、Voice Call Plugin 用のリアルタイム文字起こしを登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 言語 | `...openai.language` | (未設定) |
    | プロンプト | `...openai.prompt` | (未設定) |
    | 無音継続時間 | `...openai.silenceDurationMs` | `800` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | 認証 | `...openai.apiKey`, `OPENAI_API_KEY`, または `openai-codex` OAuth | API キーは直接接続します。OAuth は Realtime transcription クライアントシークレットを発行します |

    <Note>
    G.711 u-law (`g711_ulaw` / `audio/pcmu`) 音声を使用し、`wss://api.openai.com/v1/realtime` への WebSocket 接続を使います。`openai-codex` OAuth だけが設定されている場合、Gateway は WebSocket を開く前に一時的な Realtime transcription クライアントシークレットを発行します。このストリーミングプロバイダーは Voice Call のリアルタイム文字起こしパス用です。Discord 音声は現在、短いセグメントを録音し、代わりにバッチ `tools.media.audio` 文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    同梱の `openai` Plugin は、Voice Call Plugin 用のリアルタイム音声を登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | 音声 | `...openai.voice` | `alloy` |
    | Temperature (Azure デプロイメントブリッジ) | `...openai.temperature` | `0.8` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | 無音継続時間 | `...openai.silenceDurationMs` | `500` |
    | 接頭パディング | `...openai.prefixPaddingMs` | `300` |
    | 推論労力 | `...openai.reasoningEffort` | (未設定) |
    | 認証 | `...openai.apiKey`, `OPENAI_API_KEY`, または `openai-codex` OAuth | Browser Talk と Azure 以外のバックエンドブリッジは Codex OAuth を使用できます |

    `gpt-realtime-2` で使用できる組み込み Realtime 音声: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`。
    OpenAI は最高の Realtime 品質を得るために `marin` と `cedar` を推奨しています。これは
    上記のテキスト読み上げ音声とは別のセットです。`fable`、`nova`、`onyx` などの TTS
    音声が Realtime セッションで有効だと想定しないでください。

    <Note>
    バックエンドの OpenAI リアルタイムブリッジは GA Realtime WebSocket セッション形式を使用し、これは `session.temperature` を受け付けません。Azure OpenAI デプロイメントは引き続き `azureEndpoint` と `azureDeployment` 経由で利用でき、デプロイメント互換のセッション形式を維持します。双方向ツール呼び出しと G.711 u-law 音声をサポートします。
    </Note>

    <Note>
    リアルタイム音声は、セッション作成時に選択されます。OpenAI ではほとんどの
    セッションフィールドを後から変更できますが、そのセッションでモデルが音声を
    出力した後は音声を変更できません。OpenClaw は現在、組み込み Realtime 音声 ID
    を文字列として公開しています。
    </Note>

    <Note>
    Control UI Talk は、Gateway が発行する一時的なクライアントシークレットと、
    OpenAI Realtime API に対するブラウザーからの直接 WebRTC SDP 交換を使って、
    OpenAI ブラウザーリアルタイムセッションを使用します。直接の OpenAI API キーが設定されていない場合、
    Gateway は選択された `openai-codex` OAuth
    プロファイルでそのクライアントシークレットを発行できます。Gateway リレーと Voice Call バックエンドのリアルタイム WebSocket ブリッジは、
    ネイティブ OpenAI エンドポイントに対して同じ OAuth フォールバックを使用します。メンテナーによるライブ
    検証は
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    で利用できます。
    OpenAI 側は、シークレットをログに記録せずにバックエンド WebSocket ブリッジとブラウザー
    WebRTC SDP 交換の両方を検証します。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI エンドポイント

同梱の `openai` プロバイダーは、ベース URL を上書きすることで、画像
生成の対象を Azure OpenAI リソースにできます。画像生成パスでは、OpenClaw は
`models.providers.openai.baseUrl` 上の Azure ホスト名を検出し、自動的に
Azure のリクエスト形式へ切り替えます。

<Note>
リアルタイム音声は別の設定パス
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
を使用し、`models.providers.openai.baseUrl` の影響を受けません。Azure
設定については、[音声とスピーチ](#voice-and-speech) の **Realtime
voice** アコーディオンを参照してください。
</Note>

次の場合は Azure OpenAI を使用します。

- Azure OpenAI のサブスクリプション、クォータ、またはエンタープライズ契約をすでに持っている
- Azure が提供する地域別データレジデンシーまたはコンプライアンス制御が必要
- 既存の Azure テナント内にトラフィックを留めたい

### 設定

同梱の `openai` プロバイダー経由で Azure 画像生成を行うには、
`models.providers.openai.baseUrl` を Azure リソースに向け、`apiKey` を
Azure OpenAI キー (OpenAI Platform キーではありません) に設定します。

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

OpenClaw は Azure 画像生成ルート用に、以下の Azure ホストサフィックスを認識します。

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

認識された Azure ホスト上の画像生成リクエストについて、OpenClaw は次を行います。

- `Authorization: Bearer` の代わりに `api-key` ヘッダーを送信します
- デプロイメントスコープのパス (`/openai/deployments/{deployment}/...`) を使用します
- 各リクエストに `?api-version=...` を追加します
- Azure 画像生成呼び出しには 600 秒のデフォルトリクエストタイムアウトを使用します。
  呼び出しごとの `timeoutMs` 値は引き続きこのデフォルトを上書きします。

その他のベース URL (公開 OpenAI、OpenAI 互換プロキシ) は、標準の
OpenAI 画像リクエスト形式を維持します。

<Note>
`openai` プロバイダーの画像生成パスにおける Azure ルーティングには、
OpenClaw 2026.4.22 以降が必要です。以前のバージョンは、カスタム
`openai.baseUrl` をすべて公開 OpenAI エンドポイントのように扱い、Azure
画像デプロイメントでは失敗します。
</Note>

### API バージョン

Azure の画像生成パスで特定の Azure プレビュー版または GA 版に固定するには、`AZURE_OPENAI_API_VERSION` を設定します。

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

変数が未設定の場合、デフォルトは `2024-12-01-preview` です。

### モデル名はデプロイ名

Azure OpenAI はモデルをデプロイに紐付けます。バンドルされた `openai` provider 経由でルーティングされる Azure 画像生成リクエストでは、OpenClaw の `model` フィールドは、公開 OpenAI モデル ID ではなく、Azure ポータルで設定した **Azure デプロイ名** である必要があります。

`gpt-image-2` を提供する `gpt-image-2-prod` というデプロイを作成した場合:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同じデプロイ名ルールは、バンドルされた `openai` provider 経由でルーティングされる画像生成呼び出しにも適用されます。

### リージョン別の可用性

Azure 画像生成は現在、一部のリージョンでのみ利用できます（例: `eastus2`、`swedencentral`、`polandcentral`、`westus3`、`uaenorth`）。デプロイを作成する前に Microsoft の最新リージョン一覧を確認し、特定のモデルがお使いのリージョンで提供されていることを確認してください。

### パラメーターの違い

Azure OpenAI と公開 OpenAI は、常に同じ画像パラメーターを受け付けるとは限りません。Azure は、公開 OpenAI では許可されるオプション（たとえば `gpt-image-2` の特定の `background` 値）を拒否する場合や、特定のモデルバージョンでのみ公開する場合があります。これらの違いは Azure と基盤モデルに由来するものであり、OpenClaw によるものではありません。Azure リクエストが検証エラーで失敗した場合は、Azure ポータルで特定のデプロイと API バージョンがサポートするパラメーターセットを確認してください。

<Note>
Azure OpenAI はネイティブ転送と互換動作を使用しますが、OpenClaw の隠し帰属ヘッダーは受け取りません。詳しくは、[高度な設定](#advanced-configuration) の **ネイティブルートと OpenAI 互換ルート** アコーディオンを参照してください。

Azure でのチャットまたは Responses トラフィック（画像生成を超える用途）には、オンボーディングフローまたは専用の Azure provider 設定を使用してください。`openai.baseUrl` だけでは Azure API/認証の形式は反映されません。別途 `azure-openai-responses/*` provider が存在します。下のサーバー側 Compaction アコーディオンを参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="転送（WebSocket と SSE）">
    OpenClaw は `openai/*` に対して、WebSocket 優先、SSE フォールバック（`"auto"`）を使用します。

    `"auto"` モードでは、OpenClaw は次のように動作します:
    - SSE にフォールバックする前に、初期の WebSocket 失敗を 1 回再試行します
    - 失敗後、WebSocket を約 60 秒間劣化状態としてマークし、クールダウン中は SSE を使用します
    - 再試行と再接続のために、安定したセッション ID とターン ID のヘッダーを付加します
    - 転送方式の違いをまたいで使用量カウンター（`input_tokens` / `prompt_tokens`）を正規化します

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
          },
        },
      },
    }
    ```

    関連する OpenAI ドキュメント:
    - [WebSocket を使用した Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses（SSE）](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="高速モード">
    OpenClaw は `openai/*` 向けに共有の高速モード切り替えを公開します:

    - **チャット/UI:** `/fast status|on|off`
    - **設定:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    有効にすると、OpenClaw は高速モードを OpenAI の優先処理（`service_tier = "priority"`）にマッピングします。既存の `service_tier` 値は保持され、高速モードは `reasoning` や `text.verbosity` を書き換えません。

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
    セッション上書きは設定より優先されます。Sessions UI でセッション上書きをクリアすると、セッションは設定済みのデフォルトに戻ります。
    </Note>

  </Accordion>

  <Accordion title="優先処理（service_tier）">
    OpenAI の API は `service_tier` 経由で優先処理を公開します。OpenClaw ではモデルごとに設定します:

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
    `serviceTier` はネイティブ OpenAI エンドポイント（`api.openai.com`）とネイティブ Codex エンドポイント（`chatgpt.com/backend-api`）にのみ転送されます。いずれかの provider をプロキシ経由でルーティングする場合、OpenClaw は `service_tier` を変更しません。
    </Warning>

  </Accordion>

  <Accordion title="サーバー側 Compaction（Responses API）">
    直接の OpenAI Responses モデル（`api.openai.com` 上の `openai/*`）では、OpenAI Plugin の Pi ハーネスストリームラッパーがサーバー側 Compaction を自動的に有効にします:

    - `store: true` を強制します（モデル互換性が `supportsStore: false` を設定していない限り）
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` を挿入します
    - デフォルトの `compact_threshold`: `contextWindow` の 70%（利用できない場合は `80000`）

    これは組み込みの Pi ハーネスパスと、埋め込み実行で使用される OpenAI provider フックに適用されます。ネイティブ Codex アプリサーバーハーネスは Codex を通じて独自のコンテキストを管理し、OpenAI のデフォルト agent ルートまたは provider/model ランタイムポリシーによって設定されます。

    <Tabs>
      <Tab title="明示的に有効化">
        Azure OpenAI Responses のような互換エンドポイントに有用です:

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
    `responsesServerCompaction` は `context_management` の挿入のみを制御します。直接の OpenAI Responses モデルは、互換性が `supportsStore: false` を設定していない限り、引き続き `store: true` を強制します。
    </Note>

  </Accordion>

  <Accordion title="厳格な agentic GPT モード">
    `openai/*` 上の GPT-5 ファミリー実行では、OpenClaw はより厳格な埋め込み実行コントラクトを使用できます:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic` では、OpenClaw は次のように動作します:
    - ツールアクションが利用可能な場合、計画のみのターンを成功した進捗として扱わなくなります
    - 今すぐ実行するよう誘導してターンを再試行します
    - 実質的な作業に対して `update_plan` を自動的に有効にします
    - モデルが行動せず計画を続ける場合、明示的なブロック状態を表示します

    <Note>
    OpenAI と Codex の GPT-5 ファミリー実行のみにスコープされます。他の provider と古いモデルファミリーはデフォルト動作を維持します。
    </Note>

  </Accordion>

  <Accordion title="ネイティブルートと OpenAI 互換ルート">
    OpenClaw は、直接の OpenAI、Codex、Azure OpenAI エンドポイントを、汎用の OpenAI 互換 `/v1` プロキシとは異なるものとして扱います:

    **ネイティブルート**（`openai/*`、Azure OpenAI）:
    - OpenAI の `none` effort をサポートするモデルに対してのみ `reasoning: { effort: "none" }` を保持します
    - `reasoning.effort: "none"` を拒否するモデルまたはプロキシでは、無効化された reasoning を省略します
    - ツールスキーマのデフォルトを厳格モードにします
    - 検証済みのネイティブホストにのみ隠し帰属ヘッダーを付加します
    - OpenAI 専用のリクエスト整形（`service_tier`、`store`、reasoning 互換、プロンプトキャッシュヒント）を保持します

    **プロキシ/互換ルート:**
    - より緩やかな互換動作を使用します
    - 非ネイティブの `openai-completions` ペイロードから Completions の `store` を取り除きます
    - OpenAI 互換 Completions プロキシ向けに、高度な `params.extra_body`/`params.extraBody` パススルー JSON を受け付けます
    - vLLM などの OpenAI 互換 Completions プロキシ向けに `params.chat_template_kwargs` を受け付けます
    - 厳格なツールスキーマやネイティブ専用ヘッダーを強制しません

    Azure OpenAI はネイティブ転送と互換動作を使用しますが、隠し帰属ヘッダーは受け取りません。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共有画像ツールのパラメーターと provider 選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールのパラメーターと provider 選択。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と資格情報の再利用ルール。
  </Card>
</CardGroup>
