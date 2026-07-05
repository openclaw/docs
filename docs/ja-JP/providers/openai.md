---
read_when:
    - OpenClaw で OpenAI モデルを使用したい
    - APIキーではなく Codex サブスクリプション認証を使いたい
    - より厳密な GPT-5 エージェント実行動作が必要です
summary: OpenClaw で API キーまたは Codex サブスクリプションを使用して OpenAI を利用する
title: OpenAI
x-i18n:
    generated_at: "2026-07-05T11:45:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7cfb010354b98f0d5a40db27abda2e51f0e7c0b7098e643b16ec8a6adfc3d668
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw は、直接 API キー認証と ChatGPT/Codex サブスクリプション認証の両方に、1 つのプロバイダー ID `openai` を使用します。`openai/*` は標準のモデルルートです。
`openai/*` 上の組み込みエージェントターンは、デフォルトでバンドルされた Codex app-server ランタイムを通じて実行されます。直接 API キー認証は、非エージェントの OpenAI サーフェス（画像、動画、埋め込み、音声、リアルタイム）と、エージェントターン向けの明示的な互換ルートとして引き続き利用できます。

- **エージェントモデル** - Codex ランタイム経由の `openai/*`。ChatGPT/Codex サブスクリプションで使う場合は Codex 認証でサインインし、キー課金を使いたい場合は API キー認証プロファイルを設定します。
- **非エージェント OpenAI API** - `OPENAI_API_KEY` または `openai` API キー認証プロファイルを通じた、使用量課金の直接 OpenAI Platform アクセス。
- **レガシー設定** - 古い Codex モデル参照とプロファイル ID は、`openclaw doctor --fix` によって `openai/*` に修復されます。

OpenAI は、OpenClaw のような外部ツールやワークフローでのサブスクリプション OAuth 利用を明示的にサポートしています。

プロバイダー、モデル、ランタイム、チャンネルは別々のレイヤーです。これらのラベルが混同されている場合は、設定を変更する前に [エージェントランタイム](/ja-JP/concepts/agent-runtimes) を読んでください。

## クイック選択

| 目的                                              | 使用                                                               | メモ                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| ChatGPT/Codex サブスクリプション、ネイティブ Codex ランタイム | `openai/gpt-5.5`                                                   | デフォルト設定。Codex 認証でサインインします。                          |
| GPT-5.6 限定プレビュー                           | `openai/gpt-5.6-sol`, `-terra`, または `-luna`                     | OpenAI 承認済みの API 組織、または Codex ワークスペース allowlist エントリが必要です。 |
| エージェントターンの直接 API キー課金            | `openai/gpt-5.5` と順序付き API キー認証プロファイル               | `auth.order.openai` を設定して、キーのプロファイルをサブスクリプション認証の後に置きます。 |
| 直接 API キー課金、明示的な OpenClaw ランタイム | `openai/gpt-5.5` とプロバイダー/モデル `agentRuntime.id: "openclaw"` | 通常の `openai` API キープロファイルを選択します。                      |
| 最新の ChatGPT Instant モデルエイリアス          | `openai/chat-latest`                                               | 直接 API キー専用。移動するエイリアスであり、安定したデフォルトではありません。 |
| 画像生成または編集                               | `openai/gpt-image-2`                                               | `OPENAI_API_KEY` または Codex OAuth で動作します。                      |
| 透明背景画像                                     | `openai/gpt-image-1.5`                                             | `outputFormat` を `png` または `webp` に設定し、`background=transparent` を指定します。 |

## 名前の対応表

| 表示される名前                          | レイヤー          | 意味                                                                                     |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | プロバイダープレフィックス | 標準の OpenAI モデルルート。エージェントターンはデフォルトで Codex ランタイムになります。 |
| `codex` plugin                          | Plugin            | ネイティブ Codex app-server ランタイムと `/codex` チャットコントロールを提供するバンドル済みPlugin。 |
| provider/model `agentRuntime.id: codex` | エージェントランタイム | 一致する組み込みターンにネイティブ Codex app-server ハーネスを強制します。               |
| `/codex ...`                            | チャットコマンドセット | 会話から Codex app-server スレッドをバインド/制御します。                                |
| `runtime: "acp", agentId: "codex"`      | ACP セッションルート | ACP/acpx 経由で Codex を実行する明示的なフォールバックパス。                            |

`openclaw doctor --fix` は、レガシー Codex モデル参照、レガシー Codex 認証プロファイル ID、レガシー Codex 認証順序エントリを標準の `openai` ルートに移行します。新しい認証順序設定には `auth.order.openai` を使用してください。

<Note>
GPT-5.5 は、直接 OpenAI Platform API キーアクセスとサブスクリプション/OAuth ルートの両方で利用できます。ネイティブ Codex 実行を伴う ChatGPT/Codex サブスクリプションでは、`openai/gpt-5.5` を使用し、ランタイム設定は未設定のままにしてください。これだけで Codex ハーネスが選択されます。エージェントモデルに直接 API キー認証を使いたい場合にのみ、API キー認証プロファイルを使用してください。
</Note>

## GPT-5.6 限定プレビュー

OpenClaw は 3 つの公開 GPT-5.6 モデル ID、`openai/gpt-5.6-sol`、`openai/gpt-5.6-terra`、`openai/gpt-5.6-luna` を認識します。現在のカタログでは 3 つすべてが `xhigh` と `max` reasoning を公開しています。OpenAI は Sol をフラッグシップ階層、Terra をバランス型階層、Luna を高速で低コストな階層として説明しています。[GPT-5.6 リリース発表](https://openai.com/index/previewing-gpt-5-6-sol/) と [プレビューアクセスガイド](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna) を参照してください。

プレビュー期間中のアクセスは allowlist 制で、API と Codex で別々に付与される場合があります。有料 ChatGPT プランだけではアクセスは付与されません。OpenClaw は `openai/gpt-5.5` をデフォルトのままにし、アクセスエラーを特別扱いしません。そのため、アクセスなしで GPT-5.6 参照を選択すると、サイレントにフォールバックするのではなく、アップストリームのエラーが直接表示されます。

<Note>
`openai/*` 上のエージェントモデルターンは、デフォルトでバンドルされた Codex app-server Plugin を必要とします。明示的な OpenClaw ランタイム設定は、オプトインの互換ルートとして引き続き利用できます。OpenClaw が `openai` OAuth プロファイルで明示的に選択されている場合、モデル参照は `openai/*` のままですが、リクエストは内部的に Codex 認証トランスポート経由でルーティングされます。古いレガシー Codex モデル参照、`codex-cli/*` 参照、または明示的なランタイム設定で設定されていない古いランタイムセッション固定を修復するには、`openclaw doctor --fix` を実行してください。
</Note>

## OpenClaw 機能カバレッジ

| OpenAI 機能              | OpenClaw サーフェス                                                                         | ステータス                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses          | `openai/<model>` モデルプロバイダー                                                          | はい                                                                |
| Codex サブスクリプションモデル | OpenAI OAuth 付きの `openai/<model>`                                                        | はい                                                                |
| レガシー Codex モデル参照 | 古い Codex モデル参照、`codex-cli/<model>`                                                    | doctor により `openai/<model>` に修復されます                       |
| Codex app-server ハーネス | ランタイム未設定の `openai/<model>`、またはプロバイダー/モデル `agentRuntime.id: codex`       | はい                                                                |
| サーバー側 Web 検索       | ネイティブ OpenAI Responses ツール                                                            | はい。Web 検索が有効で、他のプロバイダーが固定されていない場合      |
| 画像                      | `image_generate`                                                                              | はい                                                                |
| 動画                      | `video_generate`                                                                              | はい                                                                |
| テキスト読み上げ          | `messages.tts.provider: "openai"` / `tts`                                                     | はい                                                                |
| バッチ音声テキスト変換    | `tools.media.audio` / メディア理解                                                            | はい                                                                |
| ストリーミング音声テキスト変換 | Voice Call `streaming.provider: "openai"`                                                | はい                                                                |
| リアルタイム音声          | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | はい（Codex/ChatGPT サブスクリプションではなく OpenAI Platform クレジットが必要） |
| 埋め込み                  | メモリ埋め込みプロバイダー                                                                    | はい                                                                |

<Note>
OpenAI Realtime 音声は、公開 **OpenAI Platform Realtime API** を通じて処理され、Codex/ChatGPT サブスクリプション枠ではなく OpenAI Platform クレジットに対して課金されます。OAuth で Codex ベースのチャットモデルが正常に動作するアカウントでも、Realtime 音声には支払い済みの請求設定を持つ Platform API キーが必要です。

修正: リアルタイム認証情報を支える組織で、[platform.openai.com/account/billing](https://platform.openai.com/account/billing) から Platform クレジットをチャージしてください。Realtime 音声は、`openclaw onboard --auth-choice openai-api-key` で作成された `openai` API キー認証プロファイル、Control UI Talk では `talk.realtime.providers.openai.apiKey`、Voice Call では `plugins.entries.voice-call.config.realtime.providers.openai.apiKey` 経由で設定された Platform `OPENAI_API_KEY`、または `OPENAI_API_KEY` 環境変数を受け付けます。OpenAI OAuth プロファイルは、同じインストール内で Codex ベースの `openai/*` チャットモデルを引き続き実行できますが、Realtime 音声は設定しません。
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

非対称の埋め込みラベルを必要とする OpenAI 互換エンドポイントでは、`memorySearch` の下に `queryInputType` と `documentInputType` を設定します。OpenClaw は、これらをプロバイダー固有の `input_type` リクエストフィールドとして転送します。クエリ埋め込みは `queryInputType` を使用し、インデックス化されたメモリチャンクとバッチインデックス作成は `documentInputType` を使用します。完全な例については、[メモリ設定リファレンス](/ja-JP/reference/memory-config#provider-specific-config) を参照してください。

## はじめに

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

    | モデル参照             | ランタイム設定                                      | ルート                    | 認証                              |
    | ----------------------- | ------------------------------------------------------ | --------------------------- | ------------------------------------ |
    | `openai/gpt-5.5`       | 未設定、またはプロバイダー/モデル `agentRuntime.id: "codex"` | Codex app-server ハーネス  | 順序付き API キー認証プロファイル |
    | `openai/gpt-5.4-mini`  | 未設定、またはプロバイダー/モデル `agentRuntime.id: "codex"` | Codex app-server ハーネス  | 順序付き API キー認証プロファイル |
    | `openai/gpt-5.5`       | プロバイダー/モデル `agentRuntime.id: "openclaw"`      | OpenClaw 組み込みランタイム | 選択された `openai` API キープロファイル |

    <Note>
    `openai/*` のエージェントターンは、デフォルトで Codex app-server ハーネスを使用します。エージェントモデルで
    APIキー認証を使うには、`openai` APIキー認証プロファイルを作成し、
    `auth.order.openai` で順序を指定します。`OPENAI_API_KEY` は、非エージェントの OpenAI API サーフェス向けの直接
    フォールバックとして残ります。古いレガシー Codex 認証順序エントリを移行するには、`openclaw doctor --fix` を実行します。
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

    `chat-latest` は変動するエイリアスです。OpenAI は本番
    API 利用には `gpt-5.5` を推奨しているため、そのエイリアス動作が必要でない限り、
    `openai/gpt-5.5` を安定したデフォルトとして維持してください。このエイリアスは `medium` のテキスト詳細度のみを受け付けます。
    OpenClaw は、このモデルに対して他の詳細度が要求された場合、強制的に `medium` にします。

    <Warning>
    OpenClaw は、直接の OpenAI
    APIキー経路では `gpt-5.3-codex-spark` を公開**しません**。サインイン済みアカウントで公開されている場合に限り、
    Codex サブスクリプションカタログエントリを通じて利用できます。
    </Warning>

  </Tab>

  <Tab title="Codex サブスクリプション">
    **最適な用途:** 別個の APIキーではなく、ネイティブの Codex
    app-server 実行で ChatGPT/Codex サブスクリプションを使用する場合。Codex cloud には
    ChatGPT サインインが必要です。

    <Steps>
      <Step title="Codex OAuth を実行する">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        または OAuth を直接実行します。

        ```bash
        openclaw models auth login --provider openai
        ```

        ヘッドレス環境またはコールバックが難しいセットアップでは、localhost ブラウザー
        コールバックの代わりに ChatGPT デバイスコードフローでサインインするために `--device-code` を追加します。

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="標準の OpenAI モデル経路を使用する">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        デフォルトパスではランタイム設定は不要です。OpenAI エージェント
        ターンはネイティブ Codex app-server ランタイムを自動的に選択し、OpenClaw はこの経路が選ばれたときに
        バンドルされた Codex Plugin をインストールまたは修復します。
      </Step>
      <Step title="Codex 認証が利用可能か確認する">
        ```bash
        openclaw models list --provider openai
        ```

        Gateway の実行後、チャットで `/codex status` または `/codex models` を送信して、ネイティブ app-server ランタイムを確認します。
      </Step>
    </Steps>

    ### 経路の概要

    | モデル参照                | ランタイム設定                                | 経路                                                  | 認証                                            |
    | -------------------------- | ------------------------------------------------ | --------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.5`         | 未設定、またはプロバイダー/モデル `agentRuntime.id: "codex"` | ネイティブ Codex app-server ハーネス                        | Codex サインイン、または順序指定された `openai` 認証プロファイル |
    | `openai/gpt-5.5`         | プロバイダー/モデル `agentRuntime.id: "openclaw"`  | OpenClaw 組み込みランタイム、内部 Codex 認証トランスポート | 選択された `openai` OAuth プロファイル                 |
    | レガシー Codex GPT-5.5 参照 | doctor によって修復                            | `openai/gpt-5.5` に書き換え                            | 移行された OpenAI OAuth プロファイル                   |
    | `codex-cli/gpt-5.5`      | doctor によって修復                            | `openai/gpt-5.5` に書き換え                            | Codex app-server 認証                           |

    <Warning>
    新しいサブスクリプションベースのエージェント設定には、`openai/gpt-5.5` を優先してください。古い
    Codex GPT 参照はレガシー OpenClaw 経路であり、ネイティブ Codex ランタイム
    パスではありません。それらを移行するには `openclaw doctor --fix` を実行します。`gpt-5.3-codex-spark` は、
    Codex サブスクリプションカタログがそれを公開しているアカウントに限定されたままです。
    直接の OpenAI APIキーおよび Azure 参照では引き続き抑制されます。
    </Warning>

    <Note>
    新しい設定では、OpenAI エージェント認証順序を `auth.order.openai` の下に置いてください。
    doctor は古いレガシー Codex 認証順序エントリを移行します。
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

    APIキーのバックアップを使う場合は、モデルを `openai/gpt-5.5` のままにし、認証順序を
    `openai` の下に置きます。OpenClaw は Codex ハーネスに留まりながら、
    まずサブスクリプションを試し、次に APIキーを試します。

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
    オンボーディングは、`~/.codex` から OAuth 情報をインポートしなくなりました。ブラウザー OAuth（デフォルト）または上記のデバイスコードフローでサインインしてください。OpenClaw は生成された認証情報を独自のエージェント認証ストアで管理します。
    </Note>

    ### Codex OAuth ルーティングの確認と復旧

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    特定のエージェントでは、`--agent <id>` を追加します。

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    古い設定にレガシー Codex GPT 参照がまだある場合、または明示的なランタイム設定なしの古い OpenAI
    ランタイムセッション固定がある場合は、修復します。

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    `models auth list --provider openai` に使用可能なプロファイルが表示されない場合は、再度サインインします。

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    同じエージェント内で複数の Codex OAuth ログインを使うには `--profile-id` を使用し、その後、認証順序または `/model ...@<profileId>` で制御します。

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    プロファイル順序に依存する前に、古いレガシー OpenAI Codex プレフィックスの
    プロファイル ID と順序エントリを移行するには、`openclaw doctor --fix` を実行します。

    ### ステータスインジケーター

    チャットの `/status` は、現在の
    セッションでアクティブなモデルランタイムを表示します。バンドルされた Codex app-server ハーネスは、
    `openai/*` エージェントターンでは `Runtime: OpenAI Codex` として表示されます。古い OpenAI ランタイム
    セッション固定は、設定で明示的に OpenClaw が固定されていない限り、Codex に修復されます。

    ### Doctor 警告

    レガシー Codex モデル参照または古い OpenAI ランタイム固定が設定
    またはセッション状態に残っている場合、OpenClaw が明示的に設定されていない限り、`openclaw doctor --fix` はそれらを Codex ランタイム付きの `openai/*` に書き換えます。

    ### コンテキストウィンドウ上限

    OpenClaw は、モデルメタデータとランタイムコンテキスト上限を別々の
    値として扱います。Codex OAuth カタログ経由の `openai/gpt-5.5` では次のとおりです。

    - ネイティブ `contextWindow`: `400000`
    - デフォルトランタイム `contextTokens` 上限: `272000`

    小さいデフォルト上限は、実運用でより良いレイテンシと品質特性を持ちます。
    `contextTokens` で上書きします。

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
    ネイティブモデルメタデータを宣言するには `contextWindow` を使用します。ランタイムコンテキスト予算を制限するには `contextTokens`
    を使用します。直接の OpenAI APIキー経路は、
    `gpt-5.5` に対してより大きなネイティブ `contextWindow`（`1000000`）を報告します。上流カタログが異なるため、2つの
    経路は別々に追跡されます。
    </Note>

    ### カタログ復旧

    OpenClaw は、`gpt-5.5` が存在する場合、上流の Codex カタログメタデータを使用します。アカウントが認証済みであるにもかかわらず、ライブ Codex 検出で `gpt-5.5` 行が省略される場合、OpenClaw はその OAuth モデル行を合成し、Cron、
    サブエージェント、および設定済みデフォルトモデルの実行が
    `Unknown model` で失敗しないようにします。

  </Tab>
</Tabs>

## ネイティブ Codex app-server 認証

ネイティブ Codex app-server ハーネスは、ランタイム
設定が未設定、またはプロバイダー/モデル `agentRuntime.id: "codex"` の `openai/*` モデル参照を使用しますが、その認証は
引き続きアカウントベースです。OpenClaw は次の順序で認証を選択します。

1. エージェント用の順序指定された OpenAI 認証プロファイル。できれば
   `auth.order.openai` の下に置きます。古いレガシー
   Codex 認証プロファイル ID と認証順序を移行するには、`openclaw doctor --fix` を実行します。
2. ローカル Codex CLI ChatGPT
   サインインなど、app-server の既存アカウント。
3. ローカル stdio app-server 起動のみ、かつ app-server がアカウントなしを報告する場合のみ:
   `CODEX_API_KEY`、次に `OPENAI_API_KEY`。

ローカル ChatGPT/Codex サブスクリプションサインインは、Gateway プロセスに直接 OpenAI モデルまたは
埋め込み用の `OPENAI_API_KEY` もあるというだけでは置き換えられません。env APIキーのフォールバックは、ローカル stdio のアカウントなし
パスにのみ適用されます。WebSocket app-server 接続では送信されません。
サブスクリプション形式の Codex プロファイルが選択された場合、OpenClaw は生成される stdio app-server 子プロセスから
`CODEX_API_KEY` と `OPENAI_API_KEY` も除外し、選択された認証情報を app-server login RPC 経由で送信します。

そのサブスクリプションプロファイルが Codex 使用量制限によってブロックされた場合、OpenClaw は
Codex が通知したリセット時刻までそのプロファイルをブロック済みとしてマークし、選択された
モデルを変更したり Codex ハーネスから外れたりせずに、認証
順序が次の `openai:*` プロファイルへローテーションできるようにします。リセット時刻が過ぎると、
サブスクリプションプロファイルは再び対象になります。

## 画像生成

バンドルされた `openai` Plugin は、
`image_generate` ツールを通じて画像生成を登録します。同じ `openai/gpt-image-2` モデル参照を通じて、OpenAI APIキーと Codex OAuth の画像
生成の両方をサポートします。

| 機能                | OpenAI APIキー                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| モデル参照                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 認証                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth サインイン           |
| トランスポート                 | OpenAI Images API                  | Codex Responses バックエンド              |
| リクエストあたりの最大画像数    | 4                                  | 4                                    |
| 編集モード                 | 有効（最大5枚の参照画像） | 有効（最大5枚の参照画像）   |
| サイズ上書き            | 2K/4K サイズを含めてサポート   | 2K/4K サイズを含めてサポート     |
| アスペクト比 / 解像度 | OpenAI Images API には転送されません | 安全な場合にサポートされるサイズへマッピング |

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
共通ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[画像生成](/ja-JP/tools/image-generation) を参照してください。
</Note>

`gpt-image-2` は OpenAI のテキストから画像生成と画像編集のデフォルトです。`gpt-image-1.5`、`gpt-image-1`、`gpt-image-1-mini` は、明示的なモデル上書きとして引き続き使用できます。透明背景の PNG/WebP 出力には `openai/gpt-image-1.5` を使用してください。現在の `gpt-image-2` API は `background: "transparent"` を拒否します。

透明背景をリクエストする場合は、`model: "openai/gpt-image-1.5"`、`outputFormat: "png"` または `"webp"`、`background: "transparent"` を指定して `image_generate` を呼び出します。古い `openai.background` プロバイダーオプションも引き続き受け付けられます。OpenClaw は、デフォルトの `openai/gpt-image-2` 透明リクエストを `gpt-image-1.5` に書き換えることで、公開 OpenAI および OpenAI Codex OAuth ルートも保護します。Azure とカスタム OpenAI 互換エンドポイントは、設定済みのデプロイメント名/モデル名を維持します。

同じ設定はヘッドレス CLI 実行にも公開されています。

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

入力ファイルから開始する場合は、`openclaw infer image edit` でも同じ `--output-format` と `--background` フラグを使用します。`--openai-background` は OpenAI 固有のエイリアスとして引き続き利用できます。OpenAI Images の品質とコストを制御するには `--quality low|medium|high|auto` を使用します。`image generate` または `image edit` から OpenAI のモデレーションヒントを渡すには `--openai-moderation low|auto` を使用します。

ChatGPT/Codex OAuth インストールでは、同じ `openai/gpt-image-2` ref を維持します。`openai` OAuth プロファイルが設定されている場合、OpenClaw は保存済みの OAuth アクセストークンを解決し、Codex Responses バックエンド経由で画像リクエストを送信します。先に `OPENAI_API_KEY` を試したり、暗黙に API キーへフォールバックしたりはしません。代わりに直接 OpenAI Images API ルートを使いたい場合は、API キー、カスタムベース URL、または Azure エンドポイントを指定して `models.providers.openai` を明示的に設定してください。そのカスタム画像エンドポイントが信頼済み LAN/プライベートアドレス上にある場合は、`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` も設定してください。このオプトインがない限り、OpenClaw はプライベート/内部の OpenAI 互換画像エンドポイントをブロックしたままにします。

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

| 機能             | 値                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------- |
| デフォルトモデル | `openai/sora-2`                                                                    |
| モード           | テキストから動画、画像から動画、単一動画編集                                     |
| 参照入力         | 画像 1 件または動画 1 件                                                           |
| サイズ上書き     | テキストから動画および画像から動画でサポート                                      |
| アスペクト比     | そのまま転送せず、最も近いサポート済みサイズに変換                                |
| その他の上書き   | `resolution`、`audio`、`watermark` はサポートされず、ツール警告付きで破棄されます |

OpenAI の画像から動画リクエストは、画像 `input_reference` を指定して `POST /v1/videos` を使用します。単一動画編集は、アップロード済み動画を `video` フィールドに指定して `POST /v1/videos/edits` を使用します。

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

OpenAI プロバイダーは `supportsSize` を宣言しますが、`supportsAspectRatio` や `supportsResolution` は宣言しません。OpenClaw の共有正規化レイヤーは、リクエストされた `aspectRatio` を、プロバイダーにリクエストが到達する前に最も近い OpenAI `size` に変換するため、アスペクト比リクエストは通常そのまま機能します。`resolution` にはサイズフォールバックがないため破棄され、呼び出し元には `Ignored unsupported overrides for openai/<model>: resolution=<value>` として表示されます。
</Note>

## GPT-5 プロンプトコントリビューション

OpenClaw は、`openai` プロバイダー上の GPT-5 ファミリーモデルに共有 GPT-5 プロンプトコントリビューションを追加します（`openai/*` に正規化される、修復前のレガシー Codex ref を含む）。OpenRouter や opencode ルートなど、GPT-5 ファミリーのモデル ID も提供する他のプロバイダーには、このオーバーレイは適用されません。モデル ID だけではなく、プロバイダー ID `openai` によって制御されます。古い GPT-4.x モデルがこれを受け取ることはありません。

ネイティブ Codex アプリサーバーハーネスは、ペルソナ/ツール規律の動作契約やフレンドリーな対話スタイルオーバーレイを開発者指示経由では受け取りません。ネイティブ Codex は Codex 所有のベース、モデル、プロジェクトドキュメント動作を維持し、OpenClaw はネイティブスレッドで Codex の組み込みパーソナリティを無効化するため、エージェントワークスペースのパーソナリティファイルが権威を持ちます。OpenClaw がネイティブ Codex スレッドに提供するのはランタイムコンテキストのみです。チャネル配信、OpenClaw 動的ツール、ACP 委譲、ワークスペースコンテキスト、OpenClaw Skills です。この同じコントリビューションの Heartbeat ガイダンステキストが唯一の例外です。ネイティブ Codex の Heartbeat ターンではこれを受け取り、共有プロンプトコントリビューションフック経由ではなく、専用のコラボレーション指示として注入されます。

GPT-5 コントリビューションは、一致する OpenClaw 組み立てプロンプトに、ペルソナ永続性、実行安全性、ツール規律、出力形式、完了チェック、検証のためのタグ付き動作契約を追加します。チャネル固有の返信およびサイレントメッセージ動作は、共有 OpenClaw システムプロンプトと送信配信ポリシーに残ります。フレンドリーな対話スタイルレイヤーは別個で、設定可能です。

| 値                     | 効果                                             |
| ---------------------- | ------------------------------------------------ |
| `"friendly"` (デフォルト) | フレンドリーな対話スタイルレイヤーを有効化 |
| `"on"`                 | `"friendly"` のエイリアス                       |
| `"off"`                | フレンドリースタイルレイヤーのみを無効化       |

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
値はランタイムで大文字小文字を区別しないため、`"Off"` と `"off"` はどちらもフレンドリースタイルレイヤーを無効化します。
</Tip>

<Note>
レガシーの `plugins.entries.openai.config.personality` は、共有の `agents.defaults.promptOverlays.gpt5.personality` 設定が未設定の場合、互換性フォールバックとして引き続き読み取られます。
</Note>

## 音声とスピーチ

<AccordionGroup>
  <Accordion title="音声合成 (TTS)">
    同梱の `openai` Plugin は、`messages.tts` サーフェスに音声合成を登録します。

    | 設定         | 設定パス                                               | デフォルト                       |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | モデル       | `messages.tts.providers.openai.model`                  | `gpt-4o-mini-tts`                |
    | 音声         | `messages.tts.providers.openai.speakerVoice`           | `coral`                          |
    | 速度         | `messages.tts.providers.openai.speed`                  | (未設定)                         |
    | 指示         | `messages.tts.providers.openai.instructions`           | (未設定、`gpt-4o-mini-tts` のみ) |
    | 形式         | `messages.tts.providers.openai.responseFormat`         | ボイスノートは `opus`、ファイルは `mp3` |
    | API キー     | `messages.tts.providers.openai.apiKey`                 | `OPENAI_API_KEY` にフォールバック |
    | ベース URL   | `messages.tts.providers.openai.baseUrl`                | `https://api.openai.com/v1`      |
    | 追加ボディ   | `messages.tts.providers.openai.extraBody` / `extra_body` | (未設定)                        |

    利用可能なモデル: `gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。利用可能な音声: `alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` は、OpenClaw が生成したフィールドの後に `/audio/speech` リクエスト JSON へマージされるため、`lang` などの追加キーを必要とする OpenAI 互換エンドポイントに使用してください。プロトタイプキーは無視されます。

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
    チャット API エンドポイントに影響を与えずに TTS ベース URL を上書きするには、`OPENAI_TTS_BASE_URL` を設定します。OpenAI TTS と Realtime 音声はいずれも OpenAI Platform API キーで設定されます。OAuth のみのインストールでも Codex バックエンドのチャットモデルは使用できますが、OpenAI のライブトークバックは使用できません。
    </Note>

  </Accordion>

  <Accordion title="音声テキスト変換">
    同梱の `openai` Plugin は、OpenClaw のメディア理解文字起こしサーフェスを通じて、バッチ音声テキスト変換を登録します。

    - デフォルトモデル: `gpt-4o-transcribe`
    - エンドポイント: OpenAI REST `/v1/audio/transcriptions`
    - 入力パス: マルチパート音声ファイルアップロード
    - インバウンド音声文字起こしが `tools.media.audio` を読み取るすべての場所で使用されます。Discord 音声チャネルセグメントやチャネル音声添付ファイルを含みます

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

    言語とプロンプトのヒントは、共有音声メディア設定または呼び出しごとの文字起こしリクエストで指定された場合、OpenAI に転送されます。

  </Accordion>

  <Accordion title="Realtime 文字起こし">
    同梱の `openai` Plugin は、Voice Call Plugin 向けに Realtime 文字起こしを登録します。

    | 設定             | 設定パス                                                            | デフォルト |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | モデル           | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 言語             | `...openai.language`                                                 | (未設定) |
    | プロンプト       | `...openai.prompt`                                                   | (未設定) |
    | 無音時間         | `...openai.silenceDurationMs`                                        | `800`   |
    | VAD しきい値     | `...openai.vadThreshold`                                             | `0.5`   |
    | 認証             | `...openai.apiKey`、`OPENAI_API_KEY`、または `openai` OAuth          | API キーは直接接続します。OAuth は Realtime 文字起こしクライアントシークレットを発行します |

    <Note>
    G.711 u-law (`g711_ulaw` / `audio/pcmu`) 音声で `wss://api.openai.com/v1/realtime` への WebSocket 接続を使用します。`openai` OAuth のみが設定されている場合、Gateway は WebSocket を開く前にエフェメラルな Realtime 文字起こしクライアントシークレットを発行します。このストリーミングプロバイダーは Voice Call の Realtime 文字起こしパス向けです。Discord 音声は現在、短いセグメントを録音し、代わりにバッチ `tools.media.audio` 文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="リアルタイム音声">
    バンドルされた `openai` Plugin は、Voice Call Plugin 向けにリアルタイム音声を登録します。

    | 設定                               | 設定パス                                                              | デフォルト             |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | モデル                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2`    |
    | 音声                                  | `...openai.voice`                                                       | `alloy`             |
    | 温度 (Azure デプロイメントブリッジ)  | `...openai.temperature`                                                 | `0.8`               |
    | VAD しきい値                          | `...openai.vadThreshold`                                                | `0.5`                |
    | 無音時間                       | `...openai.silenceDurationMs`                                           | `500`                |
    | プレフィックスパディング                         | `...openai.prefixPaddingMs`                                             | `300`                |
    | 推論エフォート                       | `...openai.reasoningEffort`                                             | (未設定)              |
    | 認証                                   | `openai` API キー認証プロファイル、`...openai.apiKey`、または `OPENAI_API_KEY`  | OpenAI Platform API キーが必要です。OpenAI OAuth はリアルタイム音声を設定しません |

    `gpt-realtime-2` で利用可能な組み込み Realtime 音声: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`。
    OpenAI は最高の Realtime 品質のために `marin` と `cedar` を推奨しています。これは
    上記の Text-to-speech 音声とは別のセットです。`fable`、`nova`、`onyx` のような TTS 専用音声は
    Realtime セッションでは有効ではありません。

    <Note>
    バックエンド OpenAI リアルタイムブリッジは GA Realtime WebSocket セッション
    形状を使用し、`session.temperature` を受け付けません。Azure OpenAI
    デプロイメントは `azureEndpoint` と `azureDeployment` 経由で引き続き利用でき、
    デプロイメント互換のセッション形状 (`temperature` を含む) を維持します。
    双方向ツール呼び出しと G.711 u-law 音声をサポートします。
    </Note>

    <Note>
    リアルタイム音声はセッション作成時に選択されます。OpenAI ではほとんどの
    セッションフィールドを後で変更できますが、そのセッションでモデルが音声を出力した後は
    音声を変更できません。OpenClaw は現在、組み込み Realtime 音声 ID を文字列として公開しています。
    </Note>

    <Note>
    Control UI Talk は、Gateway が発行するエフェメラルなクライアントシークレットと、OpenAI Realtime API に対する
    直接ブラウザー WebRTC SDP 交換を使用して、OpenAI ブラウザーリアルタイムセッションを使用します。
    Gateway は、選択された `openai` API キー認証プロファイル、または設定済みの OpenAI Platform
    API キーでそのクライアントシークレットを発行します。Gateway リレーと Voice Call バックエンドのリアルタイム WebSocket ブリッジは、
    ネイティブ OpenAI エンドポイントに同じ API キー専用認証パスを使用します。
    メンテナーのライブ検証は
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    で利用できます。
    OpenAI 側では、シークレットをログに記録せずに、バックエンド WebSocket ブリッジとブラウザー
    WebRTC SDP 交換の両方を検証します。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI エンドポイント

バンドルされた `openai` プロバイダーは、ベース URL を上書きすることで、画像生成用に
Azure OpenAI リソースを対象にできます。画像生成パスでは、OpenClaw は
`models.providers.openai.baseUrl` 上の Azure ホスト名を検出し、自動的に
Azure のリクエスト形状に切り替えます。

<Note>
リアルタイム音声は別の設定パス
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
を使用し、`models.providers.openai.baseUrl` の影響を受けません。Azure
設定については、[音声とスピーチ](#voice-and-speech) の **リアルタイム音声**
アコーディオンを参照してください。
</Note>

次の場合は Azure OpenAI を使用します。

- Azure OpenAI のサブスクリプション、クォータ、またはエンタープライズ契約をすでに持っている
- Azure が提供するリージョン単位のデータレジデンシーやコンプライアンス制御が必要
- 既存の Azure テナント内にトラフィックを維持したい

### 設定

バンドルされた `openai` プロバイダー経由の Azure 画像生成では、
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

OpenClaw は、Azure 画像生成ルート向けに次の Azure ホストサフィックスを認識します。

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

認識された Azure ホスト上の画像生成リクエストでは、OpenClaw は次のように動作します。

- `Authorization: Bearer` の代わりに `api-key` ヘッダーを送信します
- デプロイメントスコープのパス (`/openai/deployments/{deployment}/...`) を使用します
- 各リクエストに `?api-version=...` を追加します
- Azure 画像生成呼び出しに 600 秒のデフォルトリクエストタイムアウトを使用します。
  呼び出しごとの `timeoutMs` 値は引き続きこのデフォルトを上書きします。

その他のベース URL (パブリック OpenAI、OpenAI 互換プロキシ) は、標準の
OpenAI 画像リクエスト形状を維持します。

<Note>
`openai` プロバイダーの画像生成パスでの Azure ルーティングには、
OpenClaw 2026.4.22 以降が必要です。以前のバージョンは、カスタム
`openai.baseUrl` をパブリック OpenAI エンドポイントと同様に扱い、Azure 画像
デプロイメントに対して失敗します。
</Note>

### API バージョン

Azure 画像生成パスで特定の Azure プレビュー版または GA バージョンを固定するには、
`AZURE_OPENAI_API_VERSION` を設定します。

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

変数が未設定の場合のデフォルトは `2024-12-01-preview` です。

### モデル名はデプロイメント名

Azure OpenAI はモデルをデプロイメントにバインドします。バンドルされた `openai`
プロバイダー経由でルーティングされる Azure 画像生成リクエストでは、OpenClaw の
`model` フィールドは、パブリック OpenAI モデル ID ではなく、Azure ポータルで設定した
**Azure デプロイメント名** である必要があります。

`gpt-image-2` を提供する `gpt-image-2-prod` というデプロイメントを作成した場合:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同じデプロイメント名ルールは、バンドルされた `openai` プロバイダー経由でルーティングされる
すべての画像生成呼び出しに適用されます。

### リージョンでの提供状況

Azure 画像生成は現在、一部のリージョンでのみ利用できます
(例: `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
`uaenorth`)。デプロイメントを作成する前に Microsoft の現在のリージョン一覧を確認し、
対象のモデルが自分のリージョンで提供されていることを確認してください。

### パラメーターの違い

Azure OpenAI とパブリック OpenAI は、常に同じ画像パラメーターを受け付けるとは限りません。
Azure は、パブリック OpenAI が許可するオプション (たとえば `gpt-image-2` の特定の
`background` 値) を拒否したり、特定のモデルバージョンでのみ公開したりする場合があります。
これらの違いは Azure と基盤モデルに由来するものであり、OpenClaw に由来するものではありません。
Azure リクエストが検証エラーで失敗した場合は、Azure ポータルで、特定のデプロイメントと
API バージョンがサポートするパラメーターセットを確認してください。

<Note>
Azure OpenAI はネイティブトランスポートと互換動作を使用しますが、OpenClaw の
隠しアトリビューションヘッダーは受け取りません。詳しくは、[高度な設定](#advanced-configuration) の
**ネイティブ vs OpenAI 互換ルート** アコーディオンを参照してください。

Azure 上のチャットまたは Responses トラフィック (画像生成以外) には、オンボーディングフローまたは
専用の Azure プロバイダー設定を使用してください。`openai.baseUrl` だけでは
Azure API/認証形状は適用されません。別の
`azure-openai-responses/*` プロバイダーがあります。下の Server-side compaction
アコーディオンを参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="トランスポート (WebSocket vs SSE)">
    OpenClaw は `openai/*` に対して、WebSocket 優先で SSE フォールバック (`"auto"`) を使用します。

    `"auto"` モードでは、OpenClaw は次のように動作します。
    - SSE にフォールバックする前に、初期の WebSocket 失敗を 1 回再試行します
    - 失敗後、WebSocket を 60 秒間 degraded としてマークし、クールダウン中は SSE を使用します
    - 再試行と再接続のために、安定したセッション ID とターン ID ヘッダーを付与します
    - トランスポートのバリアント間で使用量カウンター (`input_tokens` / `prompt_tokens`) を正規化します

    | 値                | 動作                          |
    | ---------------------- | ------------------------------------ |
    | `"auto"` (デフォルト)   | WebSocket 優先、SSE フォールバック     |
    | `"sse"`              | SSE のみ強制                    |
    | `"websocket"`        | WebSocket のみ強制              |

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

    - **Chat/UI:** `/fast status|auto|on|off`
    - **設定:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    有効にすると、OpenClaw は高速モードを OpenAI の優先処理
    (`service_tier = "priority"`) にマップします。既存の `service_tier` 値は
    保持され、高速モードは `reasoning` や
    `text.verbosity` を書き換えません。`fastMode: "auto"` は、自動カットオフまでは
    新しいモデル呼び出しを高速で開始し、その後の再試行、フォールバック、ツール結果、または
    継続呼び出しは高速モードなしで開始します。カットオフのデフォルトは 60 秒です。
    変更するには、アクティブなモデルに `params.fastAutoOnSeconds` を設定します。

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
    セッションの上書きは設定より優先されます。Sessions UI でセッションの上書きをクリアすると、
    セッションは設定されたデフォルトに戻ります。
    </Note>

  </Accordion>

  <Accordion title="優先処理 (service_tier)">
    OpenAI の API は `service_tier` 経由で優先処理を公開します。OpenClaw ではモデルごとに設定します。

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

    サポートされる値: `auto`, `default`, `flex`, `priority`。

    <Warning>
    `serviceTier` は、ネイティブ OpenAI エンドポイント
    (`api.openai.com`) とネイティブ Codex エンドポイント (`chatgpt.com/backend-api`)
    にのみ転送されます。
    どちらかのプロバイダーをプロキシ経由でルーティングする場合、OpenClaw は
    `service_tier` を変更しません。
    </Warning>

  </Accordion>

  <Accordion title="サーバー側 Compaction (Responses API)">
    直接 OpenAI Responses モデル (`api.openai.com` 上の `openai/*`) では、
    OpenAI Plugin の OpenClaw ストリームラッパーがサーバー側
    Compaction を自動的に有効にします。

    - `store: true` を強制します (モデル互換が `supportsStore: false` を設定していない限り)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` を注入します
    - デフォルトの `compact_threshold`: `contextWindow` の 70% (利用できない場合は `80000`)

    これは組み込み OpenClaw ランタイムパスと、埋め込み実行で使用される OpenAI プロバイダー
    フックに適用されます。ネイティブ Codex アプリサーバーハーネスは、
    Codex 経由で独自のコンテキストを管理し、この設定の影響を受けません。

    <Tabs>
      <Tab title="明示的に有効化">
        Azure OpenAI Responses のような互換エンドポイントで有用です:

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
    `responsesServerCompaction` は `context_management` の注入だけを制御します。
    直接の OpenAI Responses モデルは、互換性処理が `supportsStore: false` を設定しない限り、
    引き続き `store: true` を強制します。
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT モード">
    OpenClaw の組み込みランタイムを通じて実行される `openai` プロバイダーの
    GPT-5 ファミリーモデルでは、OpenClaw はすでに `strict-agentic` と呼ばれる
    より厳格な実行契約をデフォルトにしています。解決されたプロバイダーが
    `openai` で、モデル ID が GPT-5 ファミリーに一致する場合、設定で明示的に
    オプトアウトしない限り自動的に有効化されます。

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    `"strict-agentic"` を明示的に設定しても、対応するレーンでは何も変わりません
    （すでにデフォルトです）。未対応のプロバイダー/モデルの組み合わせでは無効です。

    `strict-agentic` が有効な場合、OpenClaw は次のように動作します。
    - 実質的な作業では `update_plan` を自動的に有効化する
    - 構造的に空、または推論のみのターンを、表示可能な回答の継続として再試行する
    - 選択されたハーネスが提供する場合、明示的なハーネス計画イベントを使用する

    OpenClaw は、ターンが計画、進捗更新、最終回答のいずれであるかを判断するために
    アシスタントの文章を分類しません。

    <Note>
    この契約は OpenClaw の組み込みエージェントランナー内で完全に完結しています。
    独自のターンと計画の動作を管理するネイティブ Codex アプリサーバーハーネスには
    適用されません。ネイティブ Codex 実行では、実行契約の設定よりも
    ハーネスの選択のほうが重要です。
    </Note>

  </Accordion>

  <Accordion title="ネイティブルートと OpenAI 互換ルート">
    OpenClaw は、直接の OpenAI、Codex、Azure OpenAI エンドポイントを、
    汎用の OpenAI 互換 `/v1` プロキシとは異なるものとして扱います。

    **ネイティブルート**（`openai/*`、Azure OpenAI）:
    - OpenAI の `none` effort に対応するモデルでのみ `reasoning: { effort: "none" }` を保持する
    - `reasoning.effort: "none"` を拒否するモデルまたはプロキシでは、無効化された reasoning を省略する
    - ツールスキーマをデフォルトで strict モードにする
    - 検証済みのネイティブホストにのみ隠し帰属ヘッダーを付与する（Azure OpenAI は
      ネイティブルートであっても、これらのヘッダーを受け取りません）
    - OpenAI 専用のリクエスト整形（`service_tier`、`store`、
      reasoning 互換性、プロンプトキャッシュヒント）を保持する

    **プロキシ/互換ルート:**
    - より緩い互換動作を使用する
    - 非ネイティブの `openai-completions` ペイロードから Completions の `store` を削除する
    - OpenAI 互換 Completions プロキシ向けに、高度な `params.extra_body`/`params.extraBody` のパススルー JSON を受け付ける
    - vLLM などの OpenAI 互換 Completions プロキシ向けに `params.chat_template_kwargs` を受け付ける
    - strict ツールスキーマやネイティブ専用ヘッダーを強制しない

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
