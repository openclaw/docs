---
read_when:
    - OpenClaw で OpenAI モデルを使用したい
    - API キーではなく Codex サブスクリプション認証を使いたい
    - GPT-5 エージェントの実行動作をより厳格にする必要がある
summary: OpenClaw で API キーまたは Codex サブスクリプションを使用して OpenAI を利用する
title: OpenAI
x-i18n:
    generated_at: "2026-07-06T21:54:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70d1f583ce1ddaed9a4f394847e697a0b1ff21d5fd90ba7e0b837206db52659b
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw は、直接 API キー認証と ChatGPT/Codex サブスクリプション認証の両方に、1 つのプロバイダー ID `openai` を使用します。`openai/*` が正規のモデルルートです。
`openai/*` の埋め込みエージェントターンは、デフォルトでバンドルされた Codex app-server ランタイムを通じて実行されます。直接 API キー認証は、エージェント以外の OpenAI サーフェス（画像、動画、埋め込み、音声、Realtime）と、エージェントターンの明示的な互換性ルートとして引き続き利用できます。

- **エージェントモデル** - Codex ランタイム経由の `openai/*`。ChatGPT/Codex サブスクリプションで使用する場合は Codex 認証でサインインし、キー課金を使いたい場合は API キー認証プロファイルを設定します。
- **エージェント以外の OpenAI API** - `OPENAI_API_KEY` または `openai` API キー認証プロファイルを通じた、使用量課金の直接 OpenAI Platform アクセス。
- **レガシー設定** - 古い Codex モデル参照とプロファイル ID は、`openclaw doctor --fix` によって `openai/*` に修復されます。

OpenAI は、OpenClaw のような外部ツールやワークフローでのサブスクリプション OAuth 利用を明示的にサポートしています。

## 使用量とコストの追跡

OpenClaw は、サブスクリプションのクォータと Platform API 請求を区別して扱います。

- ChatGPT/Codex OAuth には、サブスクリプションプラン、クォータウィンドウ、クレジット残高が表示されます。
- `OPENAI_ADMIN_KEY` には、Control UI の **Usage** に、プロバイダーから報告された過去 30 日間の組織コストと completions 使用量が表示されます。日次支出、リクエスト/トークン合計、上位モデル、コストカテゴリが含まれます。
- `OPENAI_PROJECT_ID` は、必要に応じて Admin API 履歴を 1 つのプロジェクトにスコープします。
- OpenClaw は、`OPENAI_API_KEY` や `openai` 推論プロファイルを組織 API に送信しません。これらの認証情報は、カスタム、Azure、またはエージェントローカルのエンドポイントに属している場合があります。

明示的な Admin キーは OAuth より優先されます。プロバイダーから報告された履歴は、OpenClaw のセッション由来の推定コストとはマージされません。他のクライアントからの API アクティビティや、プロバイダー側の請求調整が含まれる場合があります。

OpenAI の [API Usage Dashboard](https://help.openai.com/en/articles/10478918) ドキュメントでは、使用量データに必要な組織オーナー権限と明示的な Usage Dashboard 権限について説明されています。

プロバイダー、モデル、ランタイム、チャネルは別々のレイヤーです。これらのラベルが混同されている場合は、設定を変更する前に [エージェントランタイム](/ja-JP/concepts/agent-runtimes) を読んでください。

## クイック選択

| 目的                                              | 使用                                                               | メモ                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| ChatGPT/Codex サブスクリプション、ネイティブ Codex ランタイム | `openai/gpt-5.5`                                                   | デフォルト設定です。Codex 認証でサインインします。                     |
| GPT-5.6 限定プレビュー                            | `openai/gpt-5.6-sol`, `-terra`, または `-luna`                     | OpenAI が承認した API 組織、または Codex ワークスペースの許可リスト登録が必要です。 |
| エージェントターンの直接 API キー課金             | `openai/gpt-5.5` と順序付き API キー認証プロファイル               | `auth.order.openai` を設定して、キーのプロファイルをサブスクリプション認証の後に置きます。 |
| 直接 API キー課金、明示的な OpenClaw ランタイム   | `openai/gpt-5.5` とプロバイダー/モデル `agentRuntime.id: "openclaw"` | 通常の `openai` API キープロファイルを選択します。                     |
| 最新の ChatGPT Instant モデルエイリアス           | `openai/chat-latest`                                               | 直接 API キー専用です。安定したデフォルトではなく、変動するエイリアスです。 |
| 画像生成または編集                                | `openai/gpt-image-2`                                               | `OPENAI_API_KEY` または Codex OAuth で動作します。                      |
| 透明背景画像                                      | `openai/gpt-image-1.5`                                             | `outputFormat` を `png` または `webp` に設定し、`background=transparent` を指定します。 |

## 命名マップ

| 表示される名前                          | レイヤー          | 意味                                                                                     |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | プロバイダー接頭辞 | 正規の OpenAI モデルルート。エージェントターンはデフォルトで Codex ランタイムを使用します。 |
| `codex` Plugin                          | Plugin            | ネイティブ Codex app-server ランタイムと `/codex` チャット制御を提供するバンドル Plugin。 |
| プロバイダー/モデル `agentRuntime.id: codex` | エージェントランタイム | 一致する埋め込みターンにネイティブ Codex app-server ハーネスを強制します。               |
| `/codex ...`                            | チャットコマンドセット | 会話から Codex app-server スレッドをバインド/制御します。                                |
| `runtime: "acp", agentId: "codex"`      | ACP セッションルート | ACP/acpx を通じて Codex を実行する明示的なフォールバックパス。                           |

`openclaw doctor --fix` は、レガシー Codex モデル参照、レガシー Codex 認証プロファイル ID、レガシー Codex 認証順序エントリを、正規の `openai` ルートに移行します。新しい認証順序設定には `auth.order.openai` を使用してください。

<Note>
GPT-5.5 は、直接 OpenAI Platform API キーアクセスとサブスクリプション/OAuth ルートの両方で利用できます。ネイティブ Codex 実行を伴う ChatGPT/Codex サブスクリプションでは、`openai/gpt-5.5` を使用し、ランタイム設定は未設定のままにします。これだけで Codex ハーネスが選択されます。エージェントモデルで直接 API キー認証を使いたい場合にのみ、API キー認証プロファイルを使用してください。
</Note>

## GPT-5.6 限定プレビュー

OpenClaw は、3 つの公開 GPT-5.6 モデル ID を認識します: `openai/gpt-5.6-sol`、`openai/gpt-5.6-terra`、`openai/gpt-5.6-luna`。現在のカタログでは、3 つすべてが `xhigh` と `max` の reasoning を公開しています。OpenAI は、Sol をフラッグシップ層、Terra をバランス型の層、Luna を高速で低コストの層として説明しています。[GPT-5.6 リリース告知](https://openai.com/index/previewing-gpt-5-6-sol/) と [プレビューアクセスガイド](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna) を参照してください。

プレビュー期間中のアクセスは許可リスト制で、API と Codex に個別に付与できます。有料 ChatGPT プランだけではアクセスは付与されません。OpenClaw は `openai/gpt-5.5` をデフォルトのままにし、アクセスエラーを特別扱いしません。そのため、アクセスなしで GPT-5.6 参照を選択すると、サイレントにフォールバックするのではなく、上流エラーが直接表示されます。

<Note>
`openai/*` のエージェントモデルターンには、デフォルトでバンドルされた Codex app-server Plugin が必要です。明示的な OpenClaw ランタイム設定は、オプトインの互換性ルートとして引き続き利用できます。OpenClaw が `openai` OAuth プロファイルとともに明示的に選択された場合、モデル参照は `openai/*` のままですが、リクエストは内部的に Codex 認証トランスポートを通じてルーティングされます。明示的なランタイム設定によって設定されたものではない古いレガシー Codex モデル参照、`codex-cli/*` 参照、または古いランタイムセッション固定を修復するには、`openclaw doctor --fix` を実行してください。
</Note>

## OpenClaw 機能カバレッジ

| OpenAI 機能              | OpenClaw サーフェス                                                                         | ステータス                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Chat / Responses          | `openai/<model>` モデルプロバイダー                                                           | はい                                                            |
| Codex サブスクリプションモデル | OpenAI OAuth を伴う `openai/<model>`                                                        | はい                                                            |
| レガシー Codex モデル参照 | 古い Codex モデル参照、`codex-cli/<model>`                                                     | doctor により `openai/<model>` に修復されます                   |
| Codex app-server ハーネス | ランタイム未設定の `openai/<model>`、またはプロバイダー/モデル `agentRuntime.id: codex`       | はい                                                            |
| サーバー側 Web 検索       | ネイティブ OpenAI Responses ツール                                                            | はい。Web 検索が有効で、他のプロバイダーが固定されていない場合 |
| 画像                      | `image_generate`                                                                              | はい                                                            |
| 動画                      | `video_generate`                                                                              | はい                                                            |
| テキスト読み上げ          | `messages.tts.provider: "openai"` / `tts`                                                     | はい                                                            |
| バッチ音声テキスト変換    | `tools.media.audio` / メディア理解                                                            | はい                                                            |
| ストリーミング音声テキスト変換 | Voice Call `streaming.provider: "openai"`                                                     | はい                                                            |
| Realtime 音声             | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | はい（OpenAI API キーまたは Codex OAuth）                       |
| 埋め込み                  | メモリ埋め込みプロバイダー                                                                    | はい                                                            |

<Note>
OpenAI Realtime 音声は、公開 **OpenAI Platform Realtime API** を通じて処理されます。Platform API キー、または自動検出された外部 Codex ログインを含む `openai` OAuth プロファイルのいずれかを受け付けます。API キーセッションでは、そのキーの Platform 請求が使用されます。OAuth の可用性と請求は、認証済みアカウントの Realtime 権利に従います。

API キー認証で請求が不足していると報告される場合は、API キー認証を使用している realtime 認証情報を支える組織について、[platform.openai.com/account/billing](https://platform.openai.com/account/billing) で Platform クレジットを補充してください。Realtime 音声は、`openclaw onboard --auth-choice openai-api-key` で作成された `openai` API キー認証プロファイル、`openai` OAuth プロファイルまたは外部 Codex ログイン、Control UI Talk 用に `talk.realtime.providers.openai.apiKey` で設定された Platform `OPENAI_API_KEY`、Voice Call 用の `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`、または `OPENAI_API_KEY` 環境変数を受け付けます。
</Note>

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

非対称の埋め込みラベルが必要な OpenAI 互換エンドポイントでは、`memorySearch` の下に `queryInputType` と `documentInputType` を設定します。OpenClaw は、これらをプロバイダー固有の `input_type` リクエストフィールドとして転送します。クエリ埋め込みには `queryInputType` が使用され、インデックス済みメモリチャンクとバッチインデックス作成には `documentInputType` が使用されます。完全な例については、[メモリ設定リファレンス](/ja-JP/reference/memory-config#provider-specific-config) を参照してください。

## はじめに

<Tabs>
  <Tab title="API キー（OpenAI Platform）">
    **最適な用途:** 直接 API アクセスと使用量ベースの請求。

    <Steps>
      <Step title="API キーを取得する">
        [OpenAI Platform ダッシュボード](https://platform.openai.com/api-keys) から API キーを作成またはコピーします。
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        または、キーを直接渡します:

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

    | モデル参照              | ランタイム設定                                       | ルート                     | 認証                              |
    | ----------------------- | ------------------------------------------------------ | --------------------------- | ------------------------------------ |
    | `openai/gpt-5.5`       | 未設定、または provider/model `agentRuntime.id: "codex"`   | Codex app-server ハーネス   | 順序付き API キー認証プロファイル       |
    | `openai/gpt-5.4-mini`  | 未設定、または provider/model `agentRuntime.id: "codex"`   | Codex app-server ハーネス   | 順序付き API キー認証プロファイル       |
    | `openai/gpt-5.5`       | provider/model `agentRuntime.id: "openclaw"`          | OpenClaw 組み込みランタイム  | 選択された `openai` API キープロファイル  |

    <Note>
    `openai/*` のエージェントターンは、デフォルトで Codex app-server ハーネスを使用します。エージェントモデルで API キー認証を使うには、`openai` API キー認証プロファイルを作成し、`auth.order.openai` で順序付けします。`OPENAI_API_KEY` は、エージェント以外の OpenAI API サーフェス向けの直接フォールバックのままです。古いレガシー Codex 認証順序エントリを移行するには、`openclaw doctor --fix` を実行します。
    </Note>

    ### 設定例

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    OpenAI API から ChatGPT の現在の Instant モデルを試すには、モデルを `openai/chat-latest` に設定します。

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` は移動するエイリアスです。OpenAI は本番 API 利用には `gpt-5.5` を推奨しているため、そのエイリアスの挙動が必要でない限り、安定したデフォルトとして `openai/gpt-5.5` を維持してください。このエイリアスは `medium` のテキスト詳細度のみを受け付けます。OpenClaw は、このモデルに対して要求されたその他の詳細度をすべて `medium` に強制します。

    <Warning>
    OpenClaw は、直接 OpenAI API キールートで `gpt-5.3-codex-spark` を公開しません。サインイン済みアカウントで公開されている場合にのみ、Codex サブスクリプションカタログエントリを通じて利用できます。
    </Warning>

  </Tab>

  <Tab title="Codex サブスクリプション">
    **最適な用途:** 個別の API キーではなく、ネイティブ Codex app-server 実行で ChatGPT/Codex サブスクリプションを使用する場合。Codex クラウドには ChatGPT サインインが必要です。

    <Steps>
      <Step title="Codex OAuth を実行する">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        または OAuth を直接実行します。

        ```bash
        openclaw models auth login --provider openai
        ```

        ヘッドレス環境やコールバックに対応しにくいセットアップでは、`--device-code` を追加して、localhost ブラウザーコールバックの代わりに ChatGPT デバイスコードフローでサインインします。

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="正規の OpenAI モデルルートを使用する">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        デフォルトパスにはランタイム設定は不要です。OpenAI エージェントターンはネイティブ Codex app-server ランタイムを自動的に選択し、このルートが選ばれたときに OpenClaw はバンドルされた Codex Plugin をインストールまたは修復します。
      </Step>
      <Step title="Codex 認証が利用可能であることを確認する">
        ```bash
        openclaw models list --provider openai
        ```

        Gateway の実行後、チャットで `/codex status` または `/codex models` を送信して、ネイティブ app-server ランタイムを確認します。
      </Step>
    </Steps>

    ### ルート概要

    | モデル参照                | ランタイム設定                                | ルート                                                  | 認証                                            |
    | -------------------------- | ------------------------------------------------ | --------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.5`         | 未設定、または provider/model `agentRuntime.id: "codex"` | ネイティブ Codex app-server ハーネス                        | Codex サインイン、または順序付き `openai` 認証プロファイル |
    | `openai/gpt-5.5`         | provider/model `agentRuntime.id: "openclaw"`  | OpenClaw 組み込みランタイム、内部 Codex 認証トランスポート | 選択された `openai` OAuth プロファイル                 |
    | レガシー Codex GPT-5.5 参照 | doctor により修復                            | `openai/gpt-5.5` に書き換え                            | 移行された OpenAI OAuth プロファイル                   |
    | `codex-cli/gpt-5.5`      | doctor により修復                            | `openai/gpt-5.5` に書き換え                            | Codex app-server 認証                           |

    <Warning>
    新しいサブスクリプションベースのエージェント設定には `openai/gpt-5.5` を優先してください。古い Codex GPT 参照はレガシー OpenClaw ルートであり、ネイティブ Codex ランタイムパスではありません。移行するには `openclaw doctor --fix` を実行してください。`gpt-5.3-codex-spark` は、Codex サブスクリプションカタログがそれを広告しているアカウントに引き続き限定されます。その直接 OpenAI API キー参照と Azure 参照は抑制されたままです。
    </Warning>

    <Note>
    新しい設定では、OpenAI エージェント認証順序を `auth.order.openai` の下に置く必要があります。doctor は古いレガシー Codex 認証順序エントリを移行します。
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

    API キーのバックアップを使う場合は、モデルを `openai/gpt-5.5` のままにし、認証順序を `openai` の下に置きます。OpenClaw は Codex ハーネス上に留まったまま、まずサブスクリプションを試し、次に API キーを試します。

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
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    オンボーディングは、`~/.codex` から OAuth 素材をインポートしなくなりました。ブラウザー OAuth（デフォルト）または上記のデバイスコードフローでサインインしてください。OpenClaw は結果の資格情報を独自のエージェント認証ストアで管理します。
    </Note>

    ### Codex OAuth ルーティングを確認して復旧する

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    特定のエージェントには `--agent <id>` を追加します。

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    古い設定にまだレガシー Codex GPT 参照がある場合、または明示的なランタイム設定のない古い OpenAI ランタイムセッションピンがある場合は、修復します。

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    `models auth list --provider openai` に使用可能なプロファイルが表示されない場合は、再度サインインします。

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    同じエージェント内で複数の Codex OAuth ログインを使用するには `--profile-id` を使い、その後、認証順序または `/model ...@<profileId>` で制御します。

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    プロファイル順序に依存する前に、古いレガシー OpenAI Codex プレフィックスのプロファイル ID と順序エントリを移行するため、`openclaw doctor --fix` を実行します。

    ### ステータスインジケーター

    チャットの `/status` は、現在のセッションでどのモデルランタイムがアクティブかを表示します。バンドルされた Codex app-server ハーネスは、`openai/*` エージェントターンでは `Runtime: OpenAI Codex` として表示されます。古い OpenAI ランタイムセッションピンは、設定で OpenClaw が明示的にピン留めされていない限り Codex に修復されます。

    ### Doctor 警告

    レガシー Codex モデル参照や古い OpenAI ランタイムピンが設定またはセッション状態に残っている場合、OpenClaw が明示的に設定されていない限り、`openclaw doctor --fix` はそれらを Codex ランタイム付きの `openai/*` に書き換えます。

    ### コンテキストウィンドウ上限

    OpenClaw はモデルメタデータとランタイムコンテキスト上限を別々の値として扱います。Codex OAuth カタログ経由の `openai/gpt-5.5` では次のとおりです。

    - ネイティブ `contextWindow`: `400000`
    - デフォルトランタイム `contextTokens` 上限: `272000`

    より小さいデフォルト上限は、実運用でレイテンシと品質の特性が優れています。`contextTokens` で上書きします。

    ```json5
    {
      models: {
        providers: {
          openai: {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    ネイティブモデルメタデータを宣言するには `contextWindow` を使用します。ランタイムコンテキスト予算を制限するには `contextTokens` を使用します。直接 OpenAI API キールートは、`gpt-5.5` に対してより大きいネイティブ `contextWindow`（`1000000`）を報告します。上流カタログが異なるため、この 2 つのルートは別々に追跡されます。
    </Note>

    ### カタログ復旧

    OpenClaw は、存在する場合は `gpt-5.5` の上流 Codex カタログメタデータを使用します。アカウントが認証済みであるにもかかわらずライブ Codex ディスカバリーで `gpt-5.5` 行が省略された場合、OpenClaw はその OAuth モデル行を合成し、cron、サブエージェント、設定済みデフォルトモデルの実行が `Unknown model` で失敗しないようにします。

  </Tab>
</Tabs>

## ネイティブ Codex app-server 認証

ネイティブ Codex app-server ハーネスは、ランタイム設定が未設定、または provider/model `agentRuntime.id: "codex"` の `openai/*` モデル参照を使用しますが、その認証は引き続きアカウントベースです。OpenClaw は次の順序で認証を選択します。

1. エージェントの順序付き OpenAI 認証プロファイル。できれば `auth.order.openai` の下に置きます。古いレガシー Codex 認証プロファイル ID と認証順序を移行するには、`openclaw doctor --fix` を実行します。
2. ローカル Codex CLI ChatGPT サインインなど、app-server の既存アカウント。
3. ローカル stdio app-server 起動のみ、かつ app-server がアカウントなしを報告した場合のみ: `CODEX_API_KEY`、次に `OPENAI_API_KEY`。

Gateway プロセスにも直接 OpenAI モデルや埋め込み向けの `OPENAI_API_KEY` があるという理由だけで、ローカル ChatGPT/Codex サブスクリプションサインインが置き換えられることはありません。環境変数 API キーフォールバックは、ローカル stdio のアカウントなしパスにのみ適用されます。WebSocket app-server 接続経由で送信されることはありません。サブスクリプション形式の Codex プロファイルが選択された場合、OpenClaw は生成された stdio app-server 子プロセスからも `CODEX_API_KEY` と `OPENAI_API_KEY` を除外し、選択された資格情報を app-server ログイン RPC 経由で送信します。

そのサブスクリプションプロファイルが Codex 使用量制限によってブロックされた場合、OpenClaw は Codex が広告したリセット時刻までプロファイルをブロック済みとしてマークし、選択されたモデルを変更したり Codex ハーネスから外れたりすることなく、認証順序が次の `openai:*` プロファイルへローテーションできるようにします。リセット時刻を過ぎると、サブスクリプションプロファイルは再び利用可能になります。

## 画像生成

バンドルされた `openai` Plugin は、`image_generate` ツールを通じて画像生成を登録します。同じ `openai/gpt-image-2` モデル参照を通じて、OpenAI API キーと Codex OAuth の両方の画像生成に対応しています。

| 機能                      | OpenAI API キー                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| モデル参照                | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 認証                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth サインイン        |
| トランスポート            | OpenAI Images API                  | Codex Responses バックエンド         |
| リクエストあたりの最大画像数 | 4                                  | 4                                    |
| 編集モード                | 有効（参照画像は最大 5 枚）        | 有効（参照画像は最大 5 枚）          |
| サイズの上書き            | 2K/4K サイズを含めて対応           | 2K/4K サイズを含めて対応             |
| アスペクト比 / 解像度     | OpenAI Images API には転送されない | 安全な場合は対応サイズにマッピングされる |

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
共有ツールパラメータ、プロバイダー選択、フェイルオーバー動作については
[画像生成](/ja-JP/tools/image-generation)を参照してください。
</Note>

`gpt-image-2` は、OpenAI のテキストから画像生成と画像編集のデフォルトです。
`gpt-image-1.5`、`gpt-image-1`、`gpt-image-1-mini` は、明示的なモデル上書きとして引き続き使用できます。
透明背景の PNG/WebP 出力には `openai/gpt-image-1.5` を使用してください。現在の `gpt-image-2` API は
`background: "transparent"` を拒否します。

透明背景のリクエストでは、`image_generate` を
`model: "openai/gpt-image-1.5"`、`outputFormat: "png"` または `"webp"`、および
`background: "transparent"` 付きで呼び出します。古い `openai.background` プロバイダーオプションも
引き続き受け付けられます。OpenClaw は、デフォルトの `openai/gpt-image-2` 透明リクエストを
`gpt-image-1.5` に書き換えることで、公開 OpenAI ルートと OpenAI Codex OAuth ルートも保護します。
Azure とカスタムの OpenAI 互換エンドポイントは、設定済みのデプロイメント名/モデル名を維持します。

同じ設定は、ヘッドレス CLI 実行にも公開されています。

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

入力ファイルから開始する場合は、`openclaw infer image edit` でも同じ
`--output-format` と `--background` フラグを使用します。
`--openai-background` は OpenAI 固有のエイリアスとして引き続き利用できます。
OpenAI Images の品質とコストを制御するには `--quality low|medium|high|auto` を使用します。
`image generate` または `image edit` から OpenAI のモデレーションヒントを渡すには、
`--openai-moderation low|auto` を使用します。

ChatGPT/Codex OAuth インストールでは、同じ `openai/gpt-image-2` 参照を維持します。
`openai` OAuth プロファイルが設定されている場合、OpenClaw は保存済みの OAuth
アクセストークンを解決し、Codex Responses バックエンド経由で画像リクエストを送信します。
先に `OPENAI_API_KEY` を試したり、暗黙的に API キーへフォールバックしたりはしません。
直接の OpenAI Images API ルートを使用したい場合は、API キー、カスタムベース
URL、または Azure エンドポイントを使用して `models.providers.openai` を明示的に設定します。
そのカスタム画像エンドポイントが信頼済み LAN/プライベートアドレス上にある場合は、
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` も設定してください。OpenClaw は、この
オプトインがない限り、プライベート/内部の OpenAI 互換画像エンドポイントをブロックしたままにします。

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

バンドルされた `openai` Plugin は、`video_generate` ツールを通じて動画生成を登録します。

| 機能             | 値                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------- |
| デフォルトモデル | `openai/sora-2`                                                                    |
| モード           | テキストから動画、画像から動画、単一動画編集                                       |
| 参照入力         | 画像 1 枚または動画 1 本                                                           |
| サイズの上書き   | テキストから動画と画像から動画で対応                                               |
| アスペクト比     | 生のまま転送されず、最も近い対応サイズに変換される                                 |
| その他の上書き   | `resolution`、`audio`、`watermark` は未対応で、ツール警告付きで破棄される          |

OpenAI の画像から動画リクエストは、画像 `input_reference` を指定して
`POST /v1/videos` を使用します。単一動画編集は、アップロードされた動画を
`video` フィールドに指定して `POST /v1/videos/edits` を使用します。

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
共有ツールパラメータ、プロバイダー選択、フェイルオーバー動作については
[動画生成](/ja-JP/tools/video-generation)を参照してください。

OpenAI プロバイダーは `supportsSize` を宣言しますが、`supportsAspectRatio` や
`supportsResolution` は宣言しません。OpenClaw の共有正規化レイヤーは、リクエストされた
`aspectRatio` を、プロバイダーに到達する前に最も近い OpenAI `size` に変換するため、
アスペクト比リクエストは通常そのまま機能します。
`resolution` にはサイズフォールバックがなく、破棄され、呼び出し元には
`Ignored unsupported overrides for openai/<model>: resolution=<value>` として表示されます。
</Note>

## GPT-5 プロンプト寄与

OpenClaw は、`openai` プロバイダー上の GPT-5 ファミリーモデル（`openai/*` に正規化される
レガシーの修復前 Codex 参照を含む）向けに、共有 GPT-5 プロンプト寄与を追加します。
OpenRouter や opencode ルートなど、GPT-5 ファミリーのモデル ID も提供する他のプロバイダーは、
このオーバーレイを受け取りません。これはモデル ID だけではなく、プロバイダー ID `openai` で
制御されます。古い GPT-4.x モデルがこれを受け取ることはありません。

ネイティブ Codex アプリサーバーハーネスは、developer instructions を通じて
ペルソナ/ツール規律の動作契約やフレンドリーな対話スタイルオーバーレイを受け取りません。
ネイティブ Codex は Codex 所有のベース、モデル、プロジェクトドキュメント動作を維持し、
OpenClaw はネイティブスレッドでは Codex の組み込みパーソナリティを無効にして、
エージェントワークスペースのパーソナリティファイルが権威を持つようにします。
OpenClaw がネイティブ Codex スレッドへ寄与するのは、チャネル配信、OpenClaw 動的ツール、
ACP 委任、ワークスペースコンテキスト、OpenClaw Skills というランタイムコンテキストのみです。
この同じ寄与に含まれる Heartbeat ガイダンステキストが唯一の例外です。ネイティブ Codex の
Heartbeat ターンにはこれが渡されますが、共有プロンプト寄与フックではなく、専用の
コラボレーション指示として注入されます。

GPT-5 寄与は、一致する OpenClaw が組み立てたプロンプトに対して、ペルソナの永続性、
実行安全性、ツール規律、出力形式、完了チェック、検証のためのタグ付き動作契約を追加します。
チャネル固有の返信とサイレントメッセージ動作は、共有 OpenClaw システムプロンプトと
送信配信ポリシーに残ります。フレンドリーな対話スタイルレイヤーは別個で、設定可能です。

| 値                     | 効果                                           |
| ---------------------- | ---------------------------------------------- |
| `"friendly"`（デフォルト） | フレンドリーな対話スタイルレイヤーを有効にする |
| `"on"`                 | `"friendly"` のエイリアス                      |
| `"off"`                | フレンドリースタイルレイヤーのみを無効にする   |

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
値はランタイムで大文字小文字を区別しないため、`"Off"` と `"off"` はどちらも
フレンドリースタイルレイヤーを無効にします。
</Tip>

<Note>
レガシーの `plugins.entries.openai.config.personality` は、共有の
`agents.defaults.promptOverlays.gpt5.personality` 設定が未設定の場合に、
互換性フォールバックとして引き続き読み取られます。
</Note>

## 音声とスピーチ

<AccordionGroup>
  <Accordion title="音声合成（TTS）">
    バンドルされた `openai` Plugin は、`messages.tts` サーフェス向けに音声合成を登録します。

    | 設定         | 設定パス                                               | デフォルト                         |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | モデル       | `messages.tts.providers.openai.model`                  | `gpt-4o-mini-tts`                |
    | 音声         | `messages.tts.providers.openai.speakerVoice`           | `coral`                          |
    | 速度         | `messages.tts.providers.openai.speed`                  | （未設定）                        |
    | 指示         | `messages.tts.providers.openai.instructions`           | （未設定、`gpt-4o-mini-tts` のみ） |
    | 形式         | `messages.tts.providers.openai.responseFormat`         | ボイスメモは `opus`、ファイルは `mp3` |
    | API キー     | `messages.tts.providers.openai.apiKey`                 | `OPENAI_API_KEY` にフォールバック |
    | ベース URL   | `messages.tts.providers.openai.baseUrl`                | `https://api.openai.com/v1`      |
    | 追加ボディ   | `messages.tts.providers.openai.extraBody` / `extra_body` | （未設定）                      |

    利用可能なモデル: `gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。利用可能な音声:
    `alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、
    `marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` は、OpenClaw が生成したフィールドの後で `/audio/speech` リクエスト JSON に
    マージされるため、`lang` などの追加キーが必要な OpenAI 互換エンドポイントに使用します。
    プロトタイプキーは無視されます。

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    チャット API エンドポイントに影響を与えずに TTS ベース URL を上書きするには、
    `OPENAI_TTS_BASE_URL` を設定します。OpenAI TTS と Realtime 音声はいずれも
    OpenAI Platform API キーを通じて設定されます。OAuth のみのインストールでも
    Codex バックのチャットモデルは使用できますが、OpenAI のライブ音声応答は使用できません。
    </Note>

  </Accordion>

  <Accordion title="音声テキスト化">
    バンドルされた `openai` Plugin は、OpenClaw のメディア理解文字起こしサーフェスを通じて
    バッチ音声テキスト化を登録します。

    - デフォルトモデル: `gpt-4o-transcribe`
    - エンドポイント: OpenAI REST `/v1/audio/transcriptions`
    - 入力パス: マルチパート音声ファイルアップロード
    - インバウンド音声文字起こしが `tools.media.audio` を読み取る場所で使用されます。
      Discord ボイスチャネルセグメントやチャネル音声添付を含みます

    インバウンド音声文字起こしで OpenAI を強制するには:

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

    言語とプロンプトヒントは、共有音声メディア設定または呼び出しごとの文字起こしリクエストで
    指定された場合に OpenAI へ転送されます。

  </Accordion>

  <Accordion title="リアルタイム文字起こし">
    バンドルされた `openai` Plugin は、Voice Call Plugin 向けにリアルタイム文字起こしを登録します。

    | 設定          | 設定パス                                                          | デフォルト |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | モデル            | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 言語         | `...openai.language`                                                 | (未設定) |
    | プロンプト           | `...openai.prompt`                                                   | (未設定) |
    | 無音時間 | `...openai.silenceDurationMs`                                        | `800`   |
    | VADしきい値    | `...openai.vadThreshold`                                             | `0.5`   |
    | 認証             | `...openai.apiKey`, `OPENAI_API_KEY`, または `openai` OAuth              | API キーは直接接続し、OAuth は Realtime 文字起こしクライアントシークレットを発行します |

    <Note>
    `wss://api.openai.com/v1/realtime` への WebSocket 接続を使用し、
    G.711 u-law (`g711_ulaw` / `audio/pcmu`) 音声を使います。`openai` OAuth のみが
    設定されている場合、Gateway は WebSocket を開く前に一時的な Realtime 文字起こしクライアント
    シークレットを発行します。このストリーミングプロバイダーは Voice
    Call のリアルタイム文字起こしパス用です。Discord 音声は現在、短い
    セグメントを録音し、代わりにバッチ `tools.media.audio` 文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="リアルタイム音声">
    バンドルされた `openai` Plugin は、Voice Call
    Plugin 向けにリアルタイム音声を登録します。

    | 設定                               | 設定パス                                                              | デフォルト             |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | モデル                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2`    |
    | 音声                                  | `...openai.voice`                                                       | `alloy`             |
    | Temperature (Azure デプロイメントブリッジ)  | `...openai.temperature`                                                 | `0.8`               |
    | VADしきい値                          | `...openai.vadThreshold`                                                | `0.5`                |
    | 無音時間                       | `...openai.silenceDurationMs`                                           | `500`                |
    | プレフィックスパディング                         | `...openai.prefixPaddingMs`                                             | `300`                |
    | 推論努力                       | `...openai.reasoningEffort`                                             | (未設定)              |
    | 認証                                   | `openai` API キー/OAuth プロファイル、外部 Codex ログイン、`...openai.apiKey`、または `OPENAI_API_KEY` | API キーソースが優先、Codex OAuth はフォールバック |

    `gpt-realtime-2` で利用可能な組み込み Realtime 音声: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`。
    OpenAI は最高の Realtime 品質には `marin` と `cedar` を推奨しています。これは
    上記のテキスト読み上げ音声とは別のセットです。`fable`、`nova`、`onyx` のような TTS 専用音声は
    Realtime セッションでは有効ではありません。

    <Note>
    バックエンドの OpenAI realtime ブリッジは GA Realtime WebSocket セッション
    形状を使用します。これは `session.temperature` を受け付けません。Azure OpenAI
    デプロイメントは `azureEndpoint` と `azureDeployment` 経由で引き続き利用でき、
    (`temperature` を含む) デプロイメント互換のセッション形状を維持します。
    双方向ツール呼び出しと G.711 u-law 音声をサポートします。
    </Note>

    <Note>
    リアルタイム音声はセッション作成時に選択されます。OpenAI ではほとんどの
    セッションフィールドを後で変更できますが、そのセッションでモデルが音声を出力した後は
    音声を変更できません。OpenClaw は現在、組み込み Realtime 音声 ID を文字列として公開しています。
    </Note>

    <Note>
    Control UI Talk は、Gateway が発行した一時的なクライアントシークレットと、
    OpenAI Realtime API に対するブラウザーからの直接 WebRTC SDP 交換を使って、
    OpenAI ブラウザー realtime セッションを使用します。Gateway は選択された
    `openai` 認証情報でそのクライアントシークレットを発行します。設定済みのキー、API キープロファイル、および
    `OPENAI_API_KEY` が優先されます。`openai` OAuth プロファイルまたは外部
    Codex ログインはフォールバックです。Gateway リレーと Voice Call バックエンド realtime
    WebSocket ブリッジは、ネイティブ OpenAI エンドポイントに対して同じ認証情報順序を使用します。
    メンテナーのライブ検証は
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    で利用できます。
    OpenAI 側は、シークレットをログに出さずにバックエンド WebSocket ブリッジとブラウザー
    WebRTC SDP 交換の両方を検証します。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI エンドポイント

バンドルされた `openai` プロバイダーは、ベース URL を上書きすることで、画像
生成のために Azure OpenAI リソースを対象にできます。画像生成パスでは、OpenClaw は
`models.providers.openai.baseUrl` の Azure ホスト名を検出し、自動的に
Azure のリクエスト形状に切り替えます。

<Note>
リアルタイム音声は別の設定パス
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
を使用し、`models.providers.openai.baseUrl` の影響を受けません。Azure
設定については、[音声とスピーチ](#voice-and-speech) の **リアルタイム
音声** アコーディオンを参照してください。
</Note>

Azure OpenAI を使用する場合:

- すでに Azure OpenAI サブスクリプション、クォータ、またはエンタープライズ
  契約がある
- Azure が提供する地域データレジデンシーまたはコンプライアンス制御が必要
- 既存の Azure テナント内にトラフィックを維持したい

### 設定

バンドルされた `openai` プロバイダーを通じて Azure 画像生成を行うには、
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

OpenClaw は Azure 画像生成
ルート向けに次の Azure ホストサフィックスを認識します。

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

認識された Azure ホスト上の画像生成リクエストでは、OpenClaw は次を行います。

- `Authorization: Bearer` の代わりに `api-key` ヘッダーを送信します
- デプロイメントスコープのパス (`/openai/deployments/{deployment}/...`) を使用します
- 各リクエストに `?api-version=...` を追加します
- Azure 画像生成呼び出しにはデフォルトの 600 秒リクエストタイムアウトを使用します。
  呼び出しごとの `timeoutMs` 値はこのデフォルトを引き続き上書きします。

その他のベース URL (パブリック OpenAI、OpenAI 互換プロキシ) は、標準の
OpenAI 画像リクエスト形状を維持します。

<Note>
`openai` プロバイダーの画像生成パスで Azure ルーティングを使用するには、
OpenClaw 2026.4.22 以降が必要です。以前のバージョンではカスタム
`openai.baseUrl` をパブリック OpenAI エンドポイントと同様に扱い、Azure 画像
デプロイメントでは失敗します。
</Note>

### API バージョン

Azure 画像生成パスで特定の Azure プレビューまたは GA バージョンを固定するには、
`AZURE_OPENAI_API_VERSION` を設定します。

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

変数が未設定の場合、デフォルトは `2024-12-01-preview` です。

### モデル名はデプロイメント名です

Azure OpenAI はモデルをデプロイメントに紐付けます。バンドルされた `openai`
プロバイダーを通じてルーティングされる Azure 画像生成リクエストでは、OpenClaw
の `model` フィールドは、パブリック OpenAI モデル ID ではなく、Azure ポータルで設定した
**Azure デプロイメント名** である必要があります。

`gpt-image-2` を提供する `gpt-image-2-prod` というデプロイメントを作成した場合:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同じデプロイメント名ルールは、バンドルされた `openai` プロバイダーを通じて
ルーティングされるすべての画像生成呼び出しに適用されます。

### 地域別の利用可否

Azure 画像生成は現在、一部のリージョンでのみ利用できます
(例: `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`)。デプロイメントを作成する前に Microsoft の現在のリージョン一覧を確認し、
該当モデルが自分のリージョンで提供されていることを確認してください。

### パラメーターの違い

Azure OpenAI とパブリック OpenAI は、常に同じ画像パラメーターを受け付けるわけではありません。
Azure は、パブリック OpenAI が許可するオプション (たとえば `gpt-image-2` の特定の
`background` 値) を拒否したり、特定のモデル
バージョンでのみ公開したりする場合があります。これらの違いは Azure と基盤モデルに由来するもので、
OpenClaw ではありません。Azure リクエストが検証エラーで失敗する場合は、
Azure ポータルで、特定のデプロイメントと API バージョンでサポートされる
パラメーターセットを確認してください。

<Note>
Azure OpenAI はネイティブトランスポートと互換動作を使用しますが、
OpenClaw の隠し帰属ヘッダーは受け取りません。詳細は [高度な設定](#advanced-configuration) の
**ネイティブ vs OpenAI 互換ルート** アコーディオンを参照してください。

Azure でのチャットまたは Responses トラフィック (画像生成以外) には、オンボーディングフローまたは
専用の Azure プロバイダー設定を使用してください。`openai.baseUrl` だけでは
Azure API/認証形状は適用されません。別の
`azure-openai-responses/*` プロバイダーが存在します。下のサーバーサイド Compaction
アコーディオンを参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="トランスポート (WebSocket vs SSE)">
    OpenClaw は `openai/*` に対して、WebSocket 優先、SSE フォールバック (`"auto"`) を使用します。

    `"auto"` モードでは、OpenClaw は次を行います。
    - SSE にフォールバックする前に、初期の WebSocket 失敗を 1 回再試行します
    - 失敗後、WebSocket を 60 秒間劣化状態としてマークし、クールダウン中は SSE を使用します
    - 再試行と再接続のために、安定したセッション ID とターン ID ヘッダーを付与します
    - トランスポートのバリアント間で使用量カウンター (`input_tokens` / `prompt_tokens`) を正規化します

    | 値                | 動作                          |
    | ---------------------- | ------------------------------------ |
    | `"auto"` (デフォルト)   | WebSocket 優先、SSE フォールバック     |
    | `"sse"`              | SSE のみに強制                    |
    | `"websocket"`        | WebSocket のみに強制              |

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
    - [ストリーミング API レスポンス (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="高速モード">
    OpenClaw は `openai/*` 向けに共有の高速モード切り替えを公開します。

    - **チャット/UI:** `/fast status|auto|on|off`
    - **設定:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    有効にすると、OpenClaw は高速モードを OpenAI 優先処理
    (`service_tier = "priority"`) にマップします。既存の `service_tier` 値は
    保持され、高速モードは `reasoning` や
    `text.verbosity` を書き換えません。`fastMode: "auto"` は、自動カットオフまでは新しいモデル呼び出しを高速で開始し、その後の再試行、フォールバック、ツール結果、または
    継続呼び出しは高速モードなしで開始します。カットオフのデフォルトは 60 秒です。
    変更するにはアクティブなモデルに `params.fastAutoOnSeconds` を設定します。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    セッションのオーバーライドは設定より優先されます。
    Sessions UI でセッションのオーバーライドをクリアすると、セッションは設定済みのデフォルトに戻ります。
    </Note>

  </Accordion>

  <Accordion title="優先処理 (service_tier)">
    OpenAI の API は `service_tier` 経由で優先処理を公開しています。OpenClaw ではモデルごとに設定します:

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
    `serviceTier` はネイティブ OpenAI エンドポイント
    (`api.openai.com`) とネイティブ Codex エンドポイント (`chatgpt.com/backend-api`) にのみ転送されます。
    どちらかのプロバイダーをプロキシ経由でルーティングする場合、OpenClaw は
    `service_tier` を変更しません。
    </Warning>

  </Accordion>

  <Accordion title="サーバー側 Compaction (Responses API)">
    直接の OpenAI Responses モデル (`api.openai.com` 上の `openai/*`) では、
    OpenAI Plugin の OpenClaw ストリームラッパーがサーバー側
    Compaction を自動的に有効にします。

    - `store: true` を強制します (モデル互換性で `supportsStore: false` が設定されている場合を除く)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` を挿入します
    - デフォルトの `compact_threshold`: `contextWindow` の 70% (利用できない場合は
      `80000`)

    これは組み込みの OpenClaw ランタイムパスと、埋め込み実行で使用される OpenAI プロバイダー
    フックに適用されます。ネイティブ Codex アプリサーバーハーネスは
    Codex を通じて独自のコンテキストを管理するため、この設定の影響を受けません。

    <Tabs>
      <Tab title="明示的に有効化">
        Azure OpenAI Responses のような互換エンドポイントに便利です。

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
    `responsesServerCompaction` は `context_management` の挿入のみを制御します。
    直接の OpenAI Responses モデルでは、互換性で
    `supportsStore: false` が設定されていない限り、引き続き `store: true` が強制されます。
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT モード">
    OpenClaw の埋め込みランタイムを通じて実行される `openai` プロバイダーの
    GPT-5 ファミリーモデルでは、OpenClaw はすでに
    `strict-agentic` というより厳格な実行コントラクトをデフォルトにしています。
    解決されたプロバイダーが `openai` で、モデル ID が GPT-5 ファミリーに一致する場合、
    設定で明示的にオプトアウトしない限り、自動的に有効になります。

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    `"strict-agentic"` を明示的に設定しても、サポートされるレーンでは何も変わりません
    (すでにデフォルトです)。サポートされないプロバイダー/モデルの組み合わせでは効果がありません。

    `strict-agentic` が有効な場合、OpenClaw は次のように動作します。
    - 大きな作業では `update_plan` を自動的に有効にします
    - 構造的に空、または推論のみのターンを、表示可能な回答の継続として再試行します
    - 選択されたハーネスが提供する場合、明示的なハーネス計画イベントを使用します

    OpenClaw は、ターンが計画、進捗更新、最終回答のいずれかを判断するために
    アシスタントの文章を分類しません。

    <Note>
    このコントラクトは OpenClaw の埋め込みエージェントランナー内だけに存在します。
    ネイティブ Codex アプリサーバーハーネスには適用されません。ネイティブ Codex 実行では、
    そのハーネスが独自のターンと計画の動作を管理します。そのため、実行コントラクト設定よりも
    ハーネスの選択のほうが重要です。
    </Note>

  </Accordion>

  <Accordion title="ネイティブルートと OpenAI 互換ルート">
    OpenClaw は、直接の OpenAI、Codex、Azure OpenAI エンドポイントを、
    汎用の OpenAI 互換 `/v1` プロキシとは異なるものとして扱います。

    **ネイティブルート** (`openai/*`、Azure OpenAI):
    - OpenAI の `none` effort をサポートするモデルに限り、`reasoning: { effort: "none" }` を保持します
    - `reasoning.effort: "none"` を拒否するモデルまたはプロキシでは、無効化された推論を省略します
    - ツールスキーマはデフォルトで strict モードにします
    - 検証済みのネイティブホストにのみ、非表示の帰属ヘッダーを付与します (Azure
      OpenAI はネイティブルートであっても、これらのヘッダーを受け取りません)
    - OpenAI 専用のリクエスト整形 (`service_tier`、`store`、
      reasoning 互換性、プロンプトキャッシュヒント) を保持します

    **プロキシ/互換ルート:**
    - より緩い互換動作を使用します
    - 非ネイティブの `openai-completions` ペイロードから Completions の `store` を削除します
    - OpenAI 互換 Completions プロキシ向けに、高度な
      `params.extra_body`/`params.extraBody` パススルー JSON を受け入れます
    - vLLM などの OpenAI 互換 Completions プロキシ向けに
      `params.chat_template_kwargs` を受け入れます
    - strict ツールスキーマやネイティブ専用ヘッダーを強制しません

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
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
