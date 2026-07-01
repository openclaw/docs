---
read_when:
    - OpenClaw で OpenAI モデルを使用したい
    - APIキーではなく Codex サブスクリプション認証を使いたい
    - より厳格なGPT-5エージェント実行動作が必要です
summary: OpenClawでAPIキーまたはCodexサブスクリプションを介してOpenAIを使用する
title: OpenAI
x-i18n:
    generated_at: "2026-07-01T07:51:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7078798b1d73bd1efca4820eae6d3fb6510e802b2c9193d0c135d8ab28c58fca
    source_path: providers/openai.md
    workflow: 16
---

OpenAI は GPT モデル向けの開発者 API を提供しており、Codex は OpenAI の Codex クライアントを通じて ChatGPT プランのコーディングエージェントとしても利用できます。OpenClaw は、両方の認証形式に対して 1 つのプロバイダー ID `openai` を使用します。

OpenClaw は、正規の OpenAI モデルルートとして `openai/*` を使用します。OpenAI モデルでの埋め込みエージェントターンは、デフォルトでネイティブ Codex アプリサーバーランタイムを通じて実行されます。直接の OpenAI API キー認証は、画像、埋め込み、音声、リアルタイムなど、非エージェント OpenAI サーフェスで引き続き利用できます。

- **エージェントモデル** - Codex ランタイム経由の `openai/*` モデル。ChatGPT/Codex サブスクリプション利用では Codex 認証でサインインします。または、API キー認証を意図的に使いたい場合は、Codex 互換の OpenAI API キーバックアップを構成します。
- **非エージェント OpenAI API** - `OPENAI_API_KEY` または OpenAI API キーのオンボーディングを通じて、従量課金の直接 OpenAI Platform アクセスを使用します。
- **レガシー設定** - レガシー Codex モデル参照は、`openclaw doctor --fix` により `openai/*` と Codex ランタイムへ修復されます。

OpenAI は、OpenClaw のような外部ツールやワークフローでのサブスクリプション OAuth 利用を明示的にサポートしています。

プロバイダー、モデル、ランタイム、チャネルは別々のレイヤーです。これらのラベルが混同されている場合は、設定を変更する前に [エージェントランタイム](/ja-JP/concepts/agent-runtimes) を読んでください。

## クイック選択

| 目的                                                 | 使用するもの                                             | 注記                                                                  |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| ネイティブ Codex ランタイムでの ChatGPT/Codex サブスクリプション | `openai/gpt-5.5`                                         | デフォルトの OpenAI エージェント設定です。Codex 認証でサインインします。 |
| GPT-5.6 限定プレビュー                              | `openai/gpt-5.6-sol`, `-terra`, または `-luna`           | OpenAI に承認された API 組織または Codex ワークスペースが必要です。   |
| エージェントモデルの直接 API キー課金                | `openai/gpt-5.5` と Codex 互換 API キープロファイル      | サブスクリプション認証の後にバックアップを配置するには `auth.order.openai` を使用します。 |
| 明示的な OpenClaw 経由の直接 API キー課金             | `openai/gpt-5.5` とプロバイダー/モデルランタイム `openclaw` | 通常の `openai` API キープロファイルを選択します。                    |
| 最新の ChatGPT Instant API エイリアス                | `openai/chat-latest`                                     | 直接 API キーのみ。実験用の移動エイリアスであり、デフォルトではありません。 |
| OpenClaw 経由の ChatGPT/Codex サブスクリプション認証 | `openai/gpt-5.5` とプロバイダー/モデルランタイム `openclaw` | 互換ルート用に `openai` OAuth プロファイルを選択します。              |
| 画像生成または編集                                   | `openai/gpt-image-2`                                     | `OPENAI_API_KEY` または OpenAI Codex OAuth のどちらでも動作します。   |
| 透明背景画像                                         | `openai/gpt-image-1.5`                                   | `outputFormat=png` または `webp` と `openai.background=transparent` を使用します。 |

## 命名マップ

名前は似ていますが、互換性はありません。

| 表示される名前                          | レイヤー          | 意味                                                                                              |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | プロバイダー接頭辞 | 正規の OpenAI モデルルート。エージェントターンは Codex ランタイムを使用します。                  |
| レガシー OpenAI Codex 接頭辞             | レガシー接頭辞    | 古いモデル/プロファイル名前空間です。`openclaw doctor --fix` が `openai` へ移行します。           |
| `codex` Plugin                          | Plugin            | ネイティブ Codex アプリサーバーランタイムと `/codex` チャット制御を提供する同梱 OpenClaw Plugin です。 |
| プロバイダー/モデル `agentRuntime.id: codex` | エージェントランタイム | 一致する埋め込みターンにネイティブ Codex アプリサーバーハーネスを強制します。                    |
| `/codex ...`                            | チャットコマンドセット | 会話から Codex アプリサーバースレッドをバインド/制御します。                                      |
| `runtime: "acp", agentId: "codex"`      | ACP セッションルート | ACP/acpx 経由で Codex を実行する明示的なフォールバックパスです。                                  |

つまり、設定には意図的に `openai/*` モデル参照を含めつつ、認証プロファイルは API キー資格情報または ChatGPT/Codex OAuth 資格情報のどちらかを指すことができます。設定には `auth.order.openai` を使用します。`openclaw doctor --fix` は、レガシー Codex モデル参照、レガシー Codex 認証プロファイル ID、レガシー Codex 認証順序を正規の OpenAI ルートへ書き換えます。

<Note>
GPT-5.5 は、直接の OpenAI Platform API キーアクセスとサブスクリプション/OAuth ルートの両方で利用できます。ChatGPT/Codex サブスクリプションとネイティブ Codex 実行には、`openai/gpt-5.5` を使用します。ランタイム設定を未設定にすると、OpenAI エージェントターンでは Codex ハーネスが選択されるようになっています。OpenAI エージェントモデルに直接 API キー認証を使いたい場合にのみ、OpenAI API キープロファイルを使用してください。
</Note>

## GPT-5.6 限定プレビュー

OpenClaw は、3 つの公開 GPT-5.6 モデル ID を認識します。

- `openai/gpt-5.6-sol`
- `openai/gpt-5.6-terra`
- `openai/gpt-5.6-luna`

3 つすべてが、現在の Codex アプリサーバーカタログで `max` 推論を公開しています。OpenAI のローンチ発表では、Sol はフラッグシップティア、Terra はバランス型ティア、Luna は高速で低コストのティアとして説明されています。[GPT-5.6 ローンチ発表](https://openai.com/index/previewing-gpt-5-6-sol/) と [プレビューアクセスガイド](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna) を参照してください。

プレビュー期間中のアクセスは許可リスト制で、API と Codex に対して別々に付与される場合があります。有料 ChatGPT プランだけではアクセスは付与されません。OpenClaw は `openai/gpt-5.5` をデフォルトのままにします。アクセスなしで GPT-5.6 参照を選択した場合、暗黙にフォールバックするのではなく、上流のアクセスエラーを返します。

<Note>
OpenAI エージェントモデルターンには、同梱の Codex アプリサーバー Plugin が必要です。明示的な OpenClaw ランタイム設定は、オプトインの互換ルートとして引き続き利用できます。`openai` OAuth プロファイルで OpenClaw が明示的に選択されている場合、OpenClaw は公開モデル参照を `openai/*` のまま保持し、内部では Codex 認証トランスポートを通じてルーティングします。古いレガシー Codex モデル参照、`codex-cli/*`、または明示的なランタイム設定に由来しない古いランタイムセッション固定を修復するには、`openclaw doctor --fix` を実行してください。
</Note>

## OpenClaw 機能カバレッジ

| OpenAI 機能              | OpenClaw サーフェス                                                                         | 状態                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| チャット / Responses      | `openai/<model>` モデルプロバイダー                                                           | 対応                                                                   |
| Codex サブスクリプションモデル | OpenAI OAuth を使用する `openai/<model>`                                                       | 対応                                                                   |
| レガシー Codex モデル参照 | レガシー Codex モデル参照または `codex-cli/<model>`                                           | doctor により `openai/<model>` へ修復                                  |
| Codex アプリサーバーハーネス | ランタイム省略の `openai/<model>` またはプロバイダー/モデル `agentRuntime.id: codex`           | 対応                                                                   |
| サーバー側 Web 検索       | ネイティブ OpenAI Responses ツール                                                            | Web 検索が有効で、プロバイダーが固定されていない場合に対応             |
| 画像                      | `image_generate`                                                                              | 対応                                                                   |
| 動画                      | `video_generate`                                                                              | 対応                                                                   |
| テキスト読み上げ          | `messages.tts.provider: "openai"` / `tts`                                                     | 対応                                                                   |
| バッチ音声テキスト化      | `tools.media.audio` / メディア理解                                                            | 対応                                                                   |
| ストリーミング音声テキスト化 | Voice Call `streaming.provider: "openai"`                                                     | 対応                                                                   |
| リアルタイム音声          | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | 対応（Codex/ChatGPT サブスクリプションではなく、OpenAI Platform クレジットが必要） |
| 埋め込み                  | メモリ埋め込みプロバイダー                                                                     | 対応                                                                   |

<Note>
  OpenAI Realtime 音声（Voice Call の `realtime.provider: "openai"` と
  `talk.realtime.provider: "openai"` を使用する Control UI Talk で使われるもの）は、
  公開 **OpenAI Platform Realtime API** を経由します。これは
  Codex/ChatGPT サブスクリプション枠ではなく、OpenAI
  Platform クレジットに対して課金されます。Codex ベースのチャットモデルを問題なく実行できる
  正常な OpenAI OAuth アカウントでも、Realtime 音声には OpenAI API キー認証プロファイル、または資金のある
  Platform 請求に紐づいた Platform API キーが必要です。

修正: リアルタイム資格情報を支える組織の Platform クレジットを
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
でチャージしてください。Realtime 音声は、
`openclaw onboard --auth-choice openai-api-key` で作成された `openai` API キー認証プロファイル、
Control UI Talk 用に `talk.realtime.providers.openai.apiKey` で構成された Platform `OPENAI_API_KEY`、
Voice Call 用の `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`、
または `OPENAI_API_KEY` 環境変数を受け付けます。OpenAI OAuth
プロファイルは、同じ OpenClaw インストール内で Codex ベースの `openai/*` チャットモデルを引き続き実行できますが、
Realtime 音声は構成しません。
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

非対称埋め込みラベルが必要な OpenAI 互換エンドポイントでは、`memorySearch` の下に `queryInputType` と `documentInputType` を設定します。OpenClaw は、それらをプロバイダー固有の `input_type` リクエストフィールドとして転送します。クエリ埋め込みは `queryInputType` を使用し、インデックス化されたメモリチャンクとバッチインデックス作成は `documentInputType` を使用します。完全な例については、[メモリ設定リファレンス](/ja-JP/reference/memory-config#provider-specific-config) を参照してください。

## はじめに

好みの認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="API キー（OpenAI Platform）">
    **最適な用途:** 直接 API アクセスと従量課金。

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

    | モデル参照              | ランタイム設定             | ルート                       | 認証             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | 省略 / provider/model `agentRuntime.id: "codex"` | Codex app-server ハーネス | Codex 互換 OpenAI プロファイル |
    | `openai/gpt-5.4-mini` | 省略 / provider/model `agentRuntime.id: "codex"` | Codex app-server ハーネス | Codex 互換 OpenAI プロファイル |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "openclaw"`              | OpenClaw 埋め込みランタイム      | 選択された `openai` プロファイル |

    <Note>
    `openai/*` エージェントモデルは Codex app-server ハーネスを使用します。エージェントモデルで APIキー
    認証を使用するには、Codex 互換の APIキープロファイルを作成し、
    `auth.order.openai` で順序付けします。`OPENAI_API_KEY` は
    非エージェントの OpenAI API サーフェス向けの直接フォールバックのままです。古い
    レガシー Codex 認証順序エントリを移行するには `openclaw doctor --fix` を実行します。
    </Note>

    ### 設定例

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    OpenAI API から ChatGPT の現在の Instant モデルを試すには、モデルを
    `openai/chat-latest` に設定します。

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` は変動するエイリアスです。OpenAI はこれを ChatGPT で使用される最新の Instant
    モデルとして文書化しており、本番 API 利用には `gpt-5.5` を推奨しているため、
    そのエイリアス動作を明示的に求める場合を除き、安定したデフォルトとして
    `openai/gpt-5.5` を維持してください。このエイリアスは現在 `medium` のテキスト詳細度のみを受け付けるため、
    OpenClaw はこのモデルに対する互換性のない OpenAI テキスト詳細度オーバーライドを正規化します。

    <Warning>
    OpenClaw は直接 OpenAI APIキールートで `gpt-5.3-codex-spark` を公開しません。これは、サインイン中のアカウントが公開している場合に限り、Codex サブスクリプションカタログエントリを通じて利用できます。
    </Warning>

  </Tab>

  <Tab title="Codex サブスクリプション">
    **最適な用途:** 別の APIキーではなく、ChatGPT/Codex サブスクリプションをネイティブ Codex app-server 実行で使用する場合。Codex cloud には ChatGPT サインインが必要です。

    <Steps>
      <Step title="Codex OAuth を実行する">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        または OAuth を直接実行します。

        ```bash
        openclaw models auth login --provider openai
        ```

        ヘッドレス環境やコールバックを受け付けにくい構成では、localhost ブラウザーコールバックの代わりに ChatGPT デバイスコードフローでサインインするため、`--device-code` を追加します。

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="正規の OpenAI モデルルートを使用する">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        デフォルトパスにランタイム設定は不要です。OpenAI エージェントターンは
        ネイティブ Codex app-server ランタイムを自動的に選択し、OpenClaw は
        このルートが選択されたときにバンドルされた Codex Plugin をインストールまたは修復します。
      </Step>
      <Step title="Codex 認証が利用可能であることを確認する">
        ```bash
        openclaw models list --provider openai
        ```

        Gateway の実行後、チャットで `/codex status` または `/codex models` を送信して
        ネイティブ app-server ランタイムを確認します。
      </Step>
    </Steps>

    ### ルート概要

    | モデル参照 | ランタイム設定 | ルート | 認証 |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | 省略 / provider/model `agentRuntime.id: "codex"` | ネイティブ Codex app-server ハーネス | Codex サインインまたは順序付けされた `openai` 認証プロファイル |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "openclaw"` | 内部 Codex 認証トランスポート付き OpenClaw 埋め込みランタイム | 選択された `openai` OAuth プロファイル |
    | レガシー Codex GPT-5.5 参照 | doctor により修復 | `openai/gpt-5.5` に書き換えられたレガシールート | 移行された OpenAI OAuth プロファイル |
    | `codex-cli/gpt-5.5` | doctor により修復 | `openai/gpt-5.5` に書き換えられたレガシー CLI ルート | Codex app-server 認証 |

    <Warning>
    新しいサブスクリプションベースのエージェント設定には `openai/gpt-5.5` を優先してください。古い
    レガシー Codex GPT 参照はレガシー OpenClaw ルートであり、ネイティブ Codex ランタイム
    パスではありません。正規の `openai/*` 参照に移行したい場合は
    `openclaw doctor --fix` を実行してください。`gpt-5.3-codex-spark` は引き続き、
    そのモデルを Codex サブスクリプションカタログで公開しているアカウントに限定されます。直接 OpenAI APIキーおよび
    それに対する Azure 参照は引き続き抑制されます。
    </Warning>

    <Note>
    レガシー Codex モデル接頭辞は、doctor によって修復されるレガシー設定です。
    一般的なサブスクリプションとネイティブランタイムの構成では、Codex 認証でサインインし、
    モデル参照は `openai/gpt-5.5` のままにします。新しい設定では OpenAI
    エージェント認証順序を `auth.order.openai` の下に置く必要があります。doctor は古い
    レガシー Codex 認証順序エントリを移行します。
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

    APIキーのバックアップを使う場合は、モデルを `openai/gpt-5.5` のままにし、
    認証順序を `openai` の下に置きます。OpenClaw は Codex ハーネスにとどまったまま、
    まずサブスクリプションを試し、その後 APIキーを試します。

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
    オンボーディングは `~/.codex` から OAuth 情報をインポートしなくなりました。ブラウザー OAuth（デフォルト）または上記のデバイスコードフローでサインインしてください。OpenClaw は生成された認証情報を独自のエージェント認証ストアで管理します。
    </Note>

    ### Codex OAuth ルーティングの確認と復旧

    デフォルトのエージェントが使用しているモデル、ランタイム、認証ルートを確認するには、
    次のコマンドを使用します。

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    特定のエージェントの場合は、`--agent <id>` を追加します。

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    古い設定にレガシー Codex GPT 参照や、明示的なランタイム設定のない古い OpenAI ランタイム
    セッションピンがまだ残っている場合は、修復します。

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    `models auth list --provider openai` で利用可能なプロファイルが表示されない場合は、
    再度サインインします。

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    同じエージェント内で複数の Codex OAuth ログインを使い、後で認証順序または `/model ...@<profileId>` で制御したい場合は、
    `--profile-id` を使用します。

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` は、Codex 経由の OpenAI エージェントターン向けモデルルートです。プロファイル順序に依存する前に、
    古いレガシー OpenAI Codex 接頭辞プロファイル ID と
    順序エントリを移行するには `openclaw doctor --fix` を実行します。

    ### ステータスインジケーター

    チャットの `/status` は、現在のセッションでアクティブなモデルランタイムを表示します。
    バンドルされた Codex app-server ハーネスは、OpenAI エージェントモデルターンでは
    `Runtime: OpenAI Codex` と表示されます。古い OpenAI ランタイムセッションピンは、
    設定で明示的に OpenClaw が指定されていない限り Codex に修復されます。

    ### Doctor 警告

    レガシー Codex モデル参照や古い OpenAI ランタイムピンが設定または
    セッション状態に残っている場合、OpenClaw が明示的に設定されていない限り、
    `openclaw doctor --fix` はそれらを Codex ランタイム付きの `openai/*` に書き換えます。

    ### コンテキストウィンドウ上限

    OpenClaw はモデルメタデータとランタイムコンテキスト上限を別々の値として扱います。

    Codex OAuth カタログ経由の `openai/gpt-5.5` の場合:

    - ネイティブ `contextWindow`: `1000000`
    - デフォルトランタイム `contextTokens` 上限: `272000`

    小さいデフォルト上限は、実際の運用でレイテンシと品質の特性がより良好です。`contextTokens` で上書きします。

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
    ネイティブモデルメタデータを宣言するには `contextWindow` を使用します。ランタイムコンテキスト予算を制限するには `contextTokens` を使用します。
    </Note>

    ### カタログ復旧

    OpenClaw は、存在する場合は `gpt-5.5` に対して上流 Codex カタログメタデータを使用します。
    アカウントが認証済みであるにもかかわらず、ライブ Codex 検出で `gpt-5.5` の行が省略される場合、
    OpenClaw はその OAuth モデル行を合成し、cron、サブエージェント、設定済みデフォルトモデルの実行が
    `Unknown model` で失敗しないようにします。

  </Tab>
</Tabs>

## ネイティブ Codex app-server 認証

ネイティブ Codex app-server ハーネスは、`openai/*` モデル参照に加えて、ランタイム設定の省略
または provider/model `agentRuntime.id: "codex"` を使用しますが、その認証は
引き続きアカウントベースです。OpenClaw は次の順序で認証を選択します。

1. エージェント向けの順序付けされた OpenAI 認証プロファイル。できれば
   `auth.order.openai` の下に置きます。古い
   レガシー Codex 認証プロファイル ID とレガシー Codex 認証順序を移行するには、`openclaw doctor --fix` を実行します。
2. app-server の既存アカウント。たとえばローカル Codex CLI ChatGPT サインイン。
3. ローカル stdio app-server 起動の場合のみ、app-server がアカウントなしと報告し、なお OpenAI 認証を必要とするときに、
   `CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

つまり、Gateway プロセスが直接 OpenAI モデルや埋め込み向けに `OPENAI_API_KEY` も持っているというだけで、
ローカル ChatGPT/Codex サブスクリプションサインインが置き換えられることはありません。
環境 APIキーフォールバックはローカル stdio のアカウントなしパスだけです。
WebSocket app-server 接続には送信されません。サブスクリプション形式の Codex
プロファイルが選択されると、OpenClaw は生成される stdio app-server 子プロセスから
`CODEX_API_KEY` と `OPENAI_API_KEY` も除外し、選択された認証情報を
app-server login RPC 経由で送信します。そのサブスクリプションプロファイルが
Codex 使用量上限によってブロックされている場合、OpenClaw は選択中のモデルを変更したり Codex
ハーネスから外れたりせずに、次に順序付けされた `openai:*` APIキープロファイルへローテーションできます。
サブスクリプションのリセット時刻が過ぎると、そのサブスクリプションプロファイルは
再び候補になります。

## 画像生成

バンドルされた `openai` Plugin は、`image_generate` ツールを通じて画像生成を登録します。
同じ `openai/gpt-image-2` モデル参照を通じて、OpenAI APIキー画像生成と Codex OAuth 画像
生成の両方をサポートします。

| 機能                      | OpenAI API キー                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| モデル参照                | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 認証                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth サインイン        |
| トランスポート            | OpenAI Images API                  | Codex Responses バックエンド         |
| リクエストあたりの最大画像数 | 4                                  | 4                                    |
| 編集モード                | 有効（最大 5 枚の参照画像）        | 有効（最大 5 枚の参照画像）          |
| サイズの上書き            | 2K/4K サイズを含めてサポート       | 2K/4K サイズを含めてサポート         |
| アスペクト比 / 解像度     | OpenAI Images API へ転送されない   | 安全な場合はサポートされるサイズにマップ |

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

`gpt-image-2` は、OpenAI のテキストから画像生成と画像編集の両方のデフォルトです。`gpt-image-1.5`、`gpt-image-1`、`gpt-image-1-mini` は、明示的なモデル上書きとして引き続き使用できます。透明背景の PNG/WebP 出力には `openai/gpt-image-1.5` を使用してください。現在の `gpt-image-2` API は `background: "transparent"` を拒否します。

透明背景のリクエストでは、エージェントは `model: "openai/gpt-image-1.5"`、`outputFormat: "png"` または `"webp"`、および `background: "transparent"` を指定して `image_generate` を呼び出す必要があります。古い `openai.background` プロバイダーオプションも引き続き受け付けられます。OpenClaw は、デフォルトの `openai/gpt-image-2` 透明リクエストを `gpt-image-1.5` に書き換えることで、公開 OpenAI ルートと OpenAI Codex OAuth ルートも保護します。Azure とカスタムの OpenAI 互換エンドポイントは、構成済みのデプロイメント名/モデル名を維持します。

同じ設定は、ヘッドレス CLI 実行にも公開されています。

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

入力ファイルから開始する場合は、`openclaw infer image edit` で同じ `--output-format` フラグと `--background` フラグを使用します。`--openai-background` は、OpenAI 固有のエイリアスとして引き続き利用できます。OpenAI Images の品質とコストを制御する必要がある場合は、`--quality low|medium|high|auto` を使用します。`image generate` または `image edit` から OpenAI のプロバイダー固有のモデレーションヒントを渡すには、`--openai-moderation low|auto` を使用します。

ChatGPT/Codex OAuth インストールでは、同じ `openai/gpt-image-2` 参照を維持します。`openai` OAuth プロファイルが構成されている場合、OpenClaw は保存された OAuth アクセストークンを解決し、Codex Responses バックエンド経由で画像リクエストを送信します。そのリクエストでは、先に `OPENAI_API_KEY` を試したり、API キーへ暗黙的にフォールバックしたりしません。直接の OpenAI Images API ルートを使用したい場合は、API キー、カスタムベース URL、または Azure エンドポイントを使用して `models.providers.openai` を明示的に構成してください。
そのカスタム画像エンドポイントが信頼済み LAN/プライベートアドレス上にある場合は、`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` も設定してください。OpenClaw は、このオプトインが存在しない限り、プライベート/内部の OpenAI 互換画像エンドポイントをブロックしたままにします。

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

| 機能           | 値                                                                                |
| -------------- | --------------------------------------------------------------------------------- |
| デフォルトモデル | `openai/sora-2`                                                                   |
| モード         | テキストから動画、画像から動画、単一動画編集                                     |
| 参照入力       | 画像 1 枚または動画 1 本                                                          |
| サイズの上書き | テキストから動画と画像から動画でサポート                                         |
| その他の上書き | `aspectRatio`、`resolution`、`audio`、`watermark` はツール警告付きで無視される |

OpenAI の画像から動画リクエストは、画像 `input_reference` とともに `POST /v1/videos` を使用します。単一動画編集は、アップロードされた動画を `video` フィールドに入れて `POST /v1/videos/edits` を使用します。

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
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation)を参照してください。
</Note>

## GPT-5 プロンプト寄与

OpenClaw は、OpenClaw が組み立てたプロンプト面での GPT-5 ファミリー実行に、共有 GPT-5 プロンプト寄与を追加します。これはモデル ID によって適用されるため、レガシーの修復前参照（レガシー Codex GPT-5.5 参照）、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5`、その他の互換 GPT-5 参照などの OpenClaw/プロバイダールートは、同じオーバーレイを受け取ります。古い GPT-4.x モデルには適用されません。

バンドルされたネイティブ Codex ハーネスは、Codex アプリサーバーの開発者指示経由では、この OpenClaw GPT-5 オーバーレイを受け取りません。ネイティブ Codex は Codex 所有のベース、モデル、プロジェクトドキュメント動作を維持し、OpenClaw はネイティブスレッドで Codex の組み込みパーソナリティを無効化して、エージェントワークスペースのパーソナリティファイルを権威あるものにします。OpenClaw が寄与するのは、チャネル配信、OpenClaw 動的ツール、ACP 委任、ワークスペースコンテキスト、OpenClaw Skills などのランタイムコンテキストのみです。

GPT-5 寄与は、一致する OpenClaw 組み立てプロンプトに対して、ペルソナ永続性、実行安全性、ツール規律、出力形状、完了チェック、検証のタグ付き動作契約を追加します。チャネル固有の返信およびサイレントメッセージ動作は、共有 OpenClaw システムプロンプトと送信配信ポリシーに残ります。親しみやすい対話スタイルレイヤーは別個であり、構成可能です。

| 値                     | 効果                                           |
| ---------------------- | ---------------------------------------------- |
| `"friendly"`（デフォルト） | 親しみやすい対話スタイルレイヤーを有効化       |
| `"on"`                 | `"friendly"` のエイリアス                       |
| `"off"`                | 親しみやすいスタイルレイヤーのみを無効化       |

<Tabs>
  <Tab title="Config">
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
実行時の値は大文字と小文字を区別しないため、`"Off"` と `"off"` はどちらも親しみやすいスタイルレイヤーを無効化します。
</Tip>

<Note>
共有の `agents.defaults.promptOverlays.gpt5.personality` 設定が設定されていない場合、レガシーの `plugins.entries.openai.config.personality` は互換性フォールバックとして引き続き読み取られます。
</Note>

## 音声とスピーチ

<AccordionGroup>
  <Accordion title="音声合成（TTS）">
    バンドルされた `openai` Plugin は、`messages.tts` 面向けに音声合成を登録します。

    | 設定 | 構成パス | デフォルト |
    |---------|------------|---------|
    | モデル | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 音声 | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | （未設定） |
    | 指示 | `messages.tts.providers.openai.instructions` | （未設定、`gpt-4o-mini-tts` のみ） |
    | 形式 | `messages.tts.providers.openai.responseFormat` | ボイスノートは `opus`、ファイルは `mp3` |
    | API キー | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` にフォールバック |
    | ベース URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 追加ボディ | `messages.tts.providers.openai.extraBody` / `extra_body` | （未設定） |

    利用可能なモデル: `gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。利用可能な音声: `alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` は、OpenClaw が生成したフィールドの後に `/audio/speech` リクエスト JSON にマージされるため、`lang` などの追加キーを必要とする OpenAI 互換エンドポイントに使用してください。プロトタイプキーは無視されます。

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
    チャット API エンドポイントに影響を与えずに TTS ベース URL を上書きするには、`OPENAI_TTS_BASE_URL` を設定します。OpenAI TTS と Realtime voice はどちらも OpenAI Platform API キーを通じて構成されます。OAuth のみのインストールでも Codex バックのチャットモデルは使用できますが、OpenAI のライブ応答音声は使用できません。
    </Note>

  </Accordion>

  <Accordion title="音声からテキスト">
    バンドルされた `openai` Plugin は、OpenClaw のメディア理解文字起こし面を通じてバッチ音声からテキストを登録します。

    - デフォルトモデル: `gpt-4o-transcribe`
    - エンドポイント: OpenAI REST `/v1/audio/transcriptions`
    - 入力パス: multipart 音声ファイルアップロード
    - Discord ボイスチャネルセグメントやチャネル音声添付を含め、受信音声文字起こしが `tools.media.audio` を使用する OpenClaw 内のあらゆる場所でサポート

    受信音声文字起こしに OpenAI を強制するには:

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

    言語とプロンプトのヒントは、共有音声メディア構成または呼び出しごとの文字起こしリクエストによって提供された場合、OpenAI に転送されます。

  </Accordion>

  <Accordion title="リアルタイム文字起こし">
    バンドルされた `openai` Plugin は、Voice Call Plugin 向けにリアルタイム文字起こしを登録します。

    | 設定 | 構成パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 言語 | `...openai.language` | （未設定） |
    | プロンプト | `...openai.prompt` | （未設定） |
    | 無音時間 | `...openai.silenceDurationMs` | `800` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | 認証 | `...openai.apiKey`、`OPENAI_API_KEY`、または `openai` OAuth | API キーは直接接続し、OAuth は Realtime 文字起こしクライアントシークレットを発行 |

    <Note>
    `wss://api.openai.com/v1/realtime` への WebSocket 接続を、G.711 u-law（`g711_ulaw` / `audio/pcmu`）音声で使用します。`openai` OAuth のみが構成されている場合、Gateway は WebSocket を開く前に一時的な Realtime 文字起こしクライアントシークレットを発行します。このストリーミングプロバイダーは Voice Call のリアルタイム文字起こしパス向けです。Discord 音声は現在、短いセグメントを録音し、代わりにバッチ `tools.media.audio` 文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="リアルタイム音声">
    バンドルされた `openai` Plugin は、Voice Call Plugin 向けにリアルタイム音声を登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | 音声 | `...openai.voice` | `alloy` |
    | 温度 (Azure デプロイメントブリッジ) | `...openai.temperature` | `0.8` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | 無音時間 | `...openai.silenceDurationMs` | `500` |
    | プレフィックスパディング | `...openai.prefixPaddingMs` | `300` |
    | 推論エフォート | `...openai.reasoningEffort` | (未設定) |
    | 認証 | `openai` API キー認証プロファイル、`...openai.apiKey`、または `OPENAI_API_KEY` | OpenAI Platform API キーが必要。OpenAI OAuth はリアルタイム音声を設定しません |

    `gpt-realtime-2` で利用できる組み込みリアルタイム音声:
    `alloy`、`ash`、`ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin`、`cedar`。
    OpenAI は最高のリアルタイム品質のために `marin` と `cedar` を推奨しています。これは
    上記のテキスト読み上げ音声とは別のセットです。`fable`、`nova`、`onyx` などの TTS
    音声がリアルタイムセッションで有効だと仮定しないでください。

    <Note>
    バックエンドの OpenAI リアルタイムブリッジは GA Realtime WebSocket セッション形状を使用し、`session.temperature` を受け付けません。Azure OpenAI デプロイメントは `azureEndpoint` と `azureDeployment` を介して引き続き利用でき、デプロイメント互換のセッション形状を保持します。双方向のツール呼び出しと G.711 u-law 音声をサポートします。
    </Note>

    <Note>
    リアルタイム音声はセッション作成時に選択されます。OpenAI ではほとんどの
    セッションフィールドを後で変更できますが、そのセッションでモデルが音声を出力した後は
    音声を変更できません。OpenClaw は現在、組み込みリアルタイム音声 ID を文字列として公開しています。
    </Note>

    <Note>
    Control UI Talk は、Gateway が発行した一時的なクライアントシークレットと、
    OpenAI Realtime API に対するブラウザーからの直接の WebRTC SDP 交換を使って、
    OpenAI ブラウザーリアルタイムセッションを使用します。Gateway は、選択された
    `openai` API キー認証プロファイルまたは設定済みの OpenAI Platform API キーで
    そのクライアントシークレットを発行します。Gateway リレーと Voice Call バックエンドの
    リアルタイム WebSocket ブリッジは、ネイティブ OpenAI エンドポイントに同じ
    API キー専用認証パスを使用します。メンテナーのライブ検証は
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    で利用できます。OpenAI 側では、シークレットをログに記録せずにバックエンド WebSocket ブリッジと
    ブラウザー WebRTC SDP 交換の両方を検証します。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI エンドポイント

バンドルされた `openai` プロバイダーは、ベース URL を上書きすることで画像生成用の
Azure OpenAI リソースを対象にできます。画像生成パスでは、OpenClaw は
`models.providers.openai.baseUrl` 上の Azure ホスト名を検出し、自動的に
Azure のリクエスト形状に切り替えます。

<Note>
リアルタイム音声は別の設定パス
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
を使用し、`models.providers.openai.baseUrl` の影響を受けません。Azure
設定については、[音声と発話](#voice-and-speech) の下にある **リアルタイム音声**
アコーディオンを参照してください。
</Note>

次の場合は Azure OpenAI を使用します。

- Azure OpenAI のサブスクリプション、クォータ、またはエンタープライズ契約をすでに持っている
- Azure が提供するリージョン内データ所在地またはコンプライアンス制御が必要
- 既存の Azure テナンシー内にトラフィックを維持したい

### 設定

バンドルされた `openai` プロバイダーを通じて Azure 画像生成を使うには、
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

OpenClaw は、Azure 画像生成ルート用に次の Azure ホストサフィックスを認識します。

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

認識された Azure ホストへの画像生成リクエストでは、OpenClaw は次を行います。

- `Authorization: Bearer` の代わりに `api-key` ヘッダーを送信
- デプロイメントスコープのパス (`/openai/deployments/{deployment}/...`) を使用
- 各リクエストに `?api-version=...` を追加
- Azure 画像生成呼び出しに 600 秒のデフォルトリクエストタイムアウトを使用。
  呼び出しごとの `timeoutMs` 値は引き続きこのデフォルトを上書きします。

その他のベース URL (公開 OpenAI、OpenAI 互換プロキシ) は、標準の
OpenAI 画像リクエスト形状を維持します。

<Note>
`openai` プロバイダーの画像生成パスで Azure ルーティングを使用するには、
OpenClaw 2026.4.22 以降が必要です。以前のバージョンは、カスタム
`openai.baseUrl` を公開 OpenAI エンドポイントと同様に扱い、Azure
画像デプロイメントに対して失敗します。
</Note>

### API バージョン

Azure 画像生成パスで特定の Azure プレビュー版または GA バージョンに固定するには、
`AZURE_OPENAI_API_VERSION` を設定します。

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

変数が未設定の場合、デフォルトは `2024-12-01-preview` です。

### モデル名はデプロイメント名です

Azure OpenAI はモデルをデプロイメントにバインドします。バンドルされた `openai`
プロバイダー経由でルーティングされる Azure 画像生成リクエストでは、OpenClaw の
`model` フィールドは、公開 OpenAI モデル ID ではなく、Azure ポータルで設定した
**Azure デプロイメント名** でなければなりません。

`gpt-image-2` を提供する `gpt-image-2-prod` というデプロイメントを作成した場合:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同じデプロイメント名ルールは、バンドルされた `openai` プロバイダーを通じて
ルーティングされる画像生成呼び出しにも適用されます。

### リージョン可用性

Azure 画像生成は現在、一部のリージョンでのみ利用できます
(例: `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
`uaenorth`)。デプロイメントを作成する前に Microsoft の現在のリージョン一覧を確認し、
対象のモデルが自分のリージョンで提供されていることを確認してください。

### パラメーターの違い

Azure OpenAI と公開 OpenAI は、常に同じ画像パラメーターを受け付けるわけではありません。
Azure は、公開 OpenAI が許可するオプション (たとえば `gpt-image-2` の特定の
`background` 値) を拒否する場合や、特定のモデルバージョンでのみ公開する場合があります。
これらの違いは Azure と基盤モデルに由来するもので、OpenClaw ではありません。
Azure リクエストが検証エラーで失敗する場合は、Azure ポータルで特定のデプロイメントと
API バージョンがサポートするパラメーターセットを確認してください。

<Note>
Azure OpenAI はネイティブトランスポートと互換動作を使用しますが、OpenClaw の
隠し帰属ヘッダーは受け取りません。[高度な設定](#advanced-configuration) の下にある
**ネイティブルートと OpenAI 互換ルート** アコーディオンを参照してください。

Azure 上のチャットまたは Responses トラフィック (画像生成以外) には、
オンボーディングフローまたは専用の Azure プロバイダー設定を使用してください。
`openai.baseUrl` だけでは Azure API/認証形状は選択されません。別の
`azure-openai-responses/*` プロバイダーがあります。下のサーバー側 Compaction
アコーディオンを参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="トランスポート (WebSocket vs SSE)">
    OpenClaw は `openai/*` に対して、SSE フォールバック (`"auto"`) 付きの WebSocket 優先を使用します。

    `"auto"` モードでは、OpenClaw は次を行います。
    - SSE にフォールバックする前に、初期の WebSocket 失敗を 1 回再試行
    - 失敗後、約 60 秒間 WebSocket を劣化状態としてマークし、クールダウン中は SSE を使用
    - 再試行と再接続のために安定したセッション ID とターン ID のヘッダーを付加
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
          },
        },
      },
    }
    ```

    関連する OpenAI ドキュメント:
    - [WebSocket を使った Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [ストリーミング API レスポンス (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="高速モード">
    OpenClaw は `openai/*` 用に共有の高速モード切り替えを公開します。

    - **チャット/UI:** `/fast status|auto|on|off`
    - **設定:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    有効な場合、OpenClaw は高速モードを OpenAI の優先処理 (`service_tier = "priority"`) にマッピングします。既存の `service_tier` 値は保持され、高速モードは `reasoning` や `text.verbosity` を書き換えません。`fastMode: "auto"` は、自動カットオフまでは新しいモデル呼び出しを高速で開始し、その後の再試行、フォールバック、ツール結果、または継続呼び出しは高速モードなしで開始します。カットオフのデフォルトは 60 秒です。変更するには、アクティブモデルで `params.fastAutoOnSeconds` を設定してください。

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
    セッションの上書きは設定より優先されます。Sessions UI でセッションの上書きをクリアすると、セッションは設定済みのデフォルトに戻ります。
    </Note>

  </Accordion>

  <Accordion title="優先処理 (service_tier)">
    OpenAI の API は `service_tier` によって優先処理を公開しています。OpenClaw ではモデルごとに設定します。

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
    `serviceTier` はネイティブ OpenAI エンドポイント (`api.openai.com`) とネイティブ Codex エンドポイント (`chatgpt.com/backend-api`) にのみ転送されます。いずれかのプロバイダーをプロキシ経由でルーティングする場合、OpenClaw は `service_tier` に手を加えません。
    </Warning>

  </Accordion>

  <Accordion title="サーバー側 Compaction (Responses API)">
    直接の OpenAI Responses モデル (`api.openai.com` 上の `openai/*`) では、OpenAI Plugin の OpenClaw ストリームラッパーがサーバー側 Compaction を自動的に有効にします。

    - `store: true` を強制 (モデル互換性で `supportsStore: false` が設定されている場合を除く)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` を注入
    - デフォルトの `compact_threshold`: `contextWindow` の 70% (利用できない場合は `80000`)

    これは、組み込み OpenClaw ランタイムパスと、埋め込み実行で使用される OpenAI プロバイダーフックに適用されます。ネイティブ Codex アプリサーバーハーネスは Codex を通じて独自のコンテキストを管理し、OpenAI のデフォルトエージェントルートまたはプロバイダー/モデルランタイムポリシーによって設定されます。

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
    `responsesServerCompaction` は `context_management` の注入のみを制御します。直接の OpenAI Responses モデルは、互換性で `supportsStore: false` が設定されていない限り、引き続き `store: true` を強制します。
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT モード">
    `openai/*` での GPT-5 ファミリーの実行では、OpenClaw はより厳格な埋め込み実行コントラクトを使用できます。

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic` では、OpenClaw は次のように動作します。
    - 実質的な作業では `update_plan` を自動で有効にする
    - 構造的に空、または reasoning のみのターンを、表示される回答の継続として再試行する
    - 選択されたハーネスが提供する場合、明示的なハーネス計画イベントを使用する

    OpenClaw は、ターンが計画、進捗更新、最終回答のどれであるかを判断するために、アシスタントの文章を分類しません。

    <Note>
    OpenAI および Codex の GPT-5 ファミリー実行のみに限定されます。他のプロバイダーや古いモデルファミリーは既定の動作を維持します。
    </Note>

  </Accordion>

  <Accordion title="ネイティブルートと OpenAI 互換ルート">
    OpenClaw は、直接の OpenAI、Codex、Azure OpenAI エンドポイントを、汎用の OpenAI 互換 `/v1` プロキシとは異なるものとして扱います。

    **ネイティブルート**（`openai/*`、Azure OpenAI）:
    - OpenAI の `none` effort をサポートするモデルに対してのみ、`reasoning: { effort: "none" }` を維持する
    - `reasoning.effort: "none"` を拒否するモデルやプロキシでは、無効化された reasoning を省略する
    - ツールスキーマは既定で strict モードにする
    - 検証済みのネイティブホストでのみ、隠し帰属ヘッダーを付与する
    - OpenAI 専用のリクエスト整形（`service_tier`、`store`、reasoning 互換、プロンプトキャッシュのヒント）を維持する

    **プロキシ/互換ルート:**
    - より緩い互換動作を使用する
    - 非ネイティブの `openai-completions` ペイロードから Completions の `store` を削除する
    - OpenAI 互換 Completions プロキシ向けに、高度な `params.extra_body`/`params.extraBody` パススルー JSON を受け入れる
    - vLLM などの OpenAI 互換 Completions プロキシ向けに `params.chat_template_kwargs` を受け入れる
    - strict ツールスキーマやネイティブ専用ヘッダーを強制しない

    Azure OpenAI はネイティブトランスポートと互換動作を使用しますが、隠し帰属ヘッダーは受け取りません。

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
