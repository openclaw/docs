---
read_when:
    - OpenClaw で OpenAI モデルを使いたい
    - Codex サブスクリプション認証を API キーの代わりに使いたい
    - より厳格な GPT-5 エージェント実行動作が必要です
summary: OpenClaw で API キーまたは Codex サブスクリプションを使って OpenAI を使用する
title: OpenAI
x-i18n:
    generated_at: "2026-06-27T12:46:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f5346c6bb85341c4e1709e3023dee8b32a413189d5564778e9c919b7eaa78f1
    source_path: providers/openai.md
    workflow: 16
---

OpenAI は GPTモデル向けの開発者 API を提供しており、Codex は OpenAI の Codex クライアントを通じて ChatGPTプランのコーディングエージェントとしても利用できます。OpenClaw は両方の認証形状に対して 1つの
provider id、`openai` を使用します。

OpenClaw は正規の OpenAIモデルルートとして `openai/*` を使用します。OpenAIモデル上の埋め込みエージェントターンは、デフォルトでネイティブ Codex app-serverランタイムを通じて実行されます。直接の OpenAI APIキー認証は、画像、埋め込み、音声、リアルタイムなどの非エージェント OpenAIサーフェスで引き続き利用できます。

- **エージェントモデル** - Codexランタイム経由の `openai/*`モデル。ChatGPT/Codexサブスクリプション利用では Codex認証でサインインするか、APIキー認証を意図的に使いたい場合は Codex互換の OpenAI APIキーバックアップを設定します。
- **非エージェント OpenAI API** - `OPENAI_API_KEY` または OpenAI APIキーオンボーディングを通じた、使用量ベース課金の直接 OpenAI Platformアクセス。
- **レガシー設定** - レガシー Codexモデル参照は `openclaw doctor --fix` によって `openai/*` と Codexランタイムへ修復されます。

OpenAI は OpenClaw のような外部ツールやワークフローでのサブスクリプション OAuth利用を明示的にサポートしています。

Provider、モデル、ランタイム、チャネルは別々のレイヤーです。これらのラベルが混同されている場合は、設定を変更する前に [エージェントランタイム](/ja-JP/concepts/agent-runtimes) を読んでください。

## クイック選択

| 目的                                                 | 使用                                                     | 注記                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| ネイティブ Codexランタイムでの ChatGPT/Codexサブスクリプション | `openai/gpt-5.5`                                         | デフォルトの OpenAIエージェント設定。Codex認証でサインインします。                  |
| エージェントモデルの直接 APIキー課金              | `openai/gpt-5.5` と Codex互換 APIキープロファイル | `auth.order.openai` を使用して、サブスクリプション認証の後にバックアップを配置します。  |
| 明示的な OpenClaw 経由の直接 APIキー課金     | `openai/gpt-5.5` と provider/modelランタイム `openclaw`  | 通常の `openai` APIキープロファイルを選択します。                             |
| 最新の ChatGPT Instant APIエイリアス                     | `openai/chat-latest`                                     | 直接 APIキーのみ。実験用の移動エイリアスであり、デフォルトではありません。   |
| OpenClaw 経由の ChatGPT/Codexサブスクリプション認証     | `openai/gpt-5.5` と provider/modelランタイム `openclaw`  | 互換ルート用に `openai` OAuthプロファイルを選択します。         |
| 画像生成または編集                          | `openai/gpt-image-2`                                     | `OPENAI_API_KEY` または OpenAI Codex OAuth のどちらでも動作します。             |
| 透明背景画像                        | `openai/gpt-image-1.5`                                   | `outputFormat=png` または `webp` と `openai.background=transparent` を使用します。 |

## 命名マップ

名前は似ていますが、相互に置き換えることはできません。

| 表示される名前                            | レイヤー             | 意味                                                                                           |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | Providerプレフィックス   | 正規の OpenAIモデルルート。エージェントターンは Codexランタイムを使用します。                                  |
| レガシー OpenAI Codexプレフィックス              | レガシープレフィックス     | 古いモデル/プロファイル名前空間。`openclaw doctor --fix` がそれを `openai` に移行します。                   |
| `codex` plugin                          | Plugin            | ネイティブ Codex app-serverランタイムと `/codex`チャット制御を提供する、バンドル済み OpenClaw Plugin。 |
| provider/model `agentRuntime.id: codex` | エージェントランタイム     | 一致する埋め込みターンにネイティブ Codex app-serverハーネスを強制します。                            |
| `/codex ...`                            | チャットコマンドセット  | 会話から Codex app-serverスレッドをバインド/制御します。                                        |
| `runtime: "acp", agentId: "codex"`      | ACPセッションルート | ACP/acpx 経由で Codex を実行する明示的なフォールバックパス。                                          |

つまり、設定には意図的に `openai/*`モデル参照を含めつつ、認証プロファイルを APIキーまたは ChatGPT/Codex OAuth認証情報のどちらかに向けることができます。設定には `auth.order.openai` を使用します。`openclaw doctor --fix` は従来のレガシー Codexモデル参照、レガシー Codex認証プロファイル ID、レガシー Codex認証順序を正規の OpenAIルートに書き換えます。

<Note>
GPT-5.5 は直接の OpenAI Platform APIキーアクセスとサブスクリプション/OAuthルートの両方で利用できます。ChatGPT/Codexサブスクリプションとネイティブ Codex実行には、`openai/gpt-5.5` を使用します。ランタイム設定を未設定にすると、現在は OpenAIエージェントターンに Codexハーネスが選択されます。OpenAIエージェントモデルで直接 APIキー認証を使いたい場合にのみ、OpenAI APIキープロファイルを使用してください。
</Note>

<Note>
OpenAIエージェントモデルのターンには、バンドル済み Codex app-server Plugin が必要です。明示的な OpenClawランタイム設定は、オプトインの互換ルートとして引き続き利用できます。`openai` OAuthプロファイルで OpenClaw が明示的に選択されている場合、OpenClaw は公開モデル参照を `openai/*` のまま保持し、内部では Codex認証トランスポートを通じてルーティングします。明示的なランタイム設定に由来しない古いレガシー Codexモデル参照、`codex-cli/*`、または古いランタイムセッション固定を修復するには、`openclaw doctor --fix` を実行してください。
</Note>

## OpenClaw機能カバレッジ

| OpenAI機能         | OpenClawサーフェス                                                                              | ステータス                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Chat / Responses          | `openai/<model>`モデル provider                                                               | はい                                                                    |
| Codexサブスクリプションモデル | OpenAI OAuth を使用する `openai/<model>`                                                            | はい                                                                    |
| レガシー Codexモデル参照   | レガシー Codexモデル参照または `codex-cli/<model>`                                                | doctor により `openai/<model>` へ修復                                 |
| Codex app-serverハーネス  | ランタイム省略または provider/model `agentRuntime.id: codex` を使用する `openai/<model>`              | はい                                                                    |
| サーバー側 Web検索    | ネイティブ OpenAI Responsesツール                                                                  | はい。Web検索が有効で provider が固定されていない場合                 |
| 画像                    | `image_generate`                                                                              | はい                                                                    |
| 動画                    | `video_generate`                                                                              | はい                                                                    |
| テキスト読み上げ            | `messages.tts.provider: "openai"` / `tts`                                                     | はい                                                                    |
| バッチ音声テキスト化      | `tools.media.audio` / メディア理解                                                     | はい                                                                    |
| ストリーミング音声テキスト化  | Voice Call `streaming.provider: "openai"`                                                     | はい                                                                    |
| リアルタイム音声            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | はい (Codex/ChatGPTサブスクリプションではなく OpenAI Platformクレジットが必要) |
| 埋め込み                | メモリ埋め込み provider                                                                     | はい                                                                    |

<Note>
  OpenAI Realtime音声 (Voice Call の `realtime.provider: "openai"` と
  `talk.realtime.provider: "openai"` を使用する Control UI Talk で使用) は、公開 **OpenAI Platform Realtime API** を通じて処理されます。これは Codex/ChatGPTサブスクリプション枠ではなく OpenAI Platformクレジットに対して課金されます。Codexベースのチャットモデルを問題なく実行できる健全な OpenAI OAuth を持つアカウントでも、Realtime音声には OpenAI APIキー認証プロファイル、または入金済みの Platform課金がある Platform APIキーが必要です。

修正: リアルタイム認証情報を支える組織の Platformクレジットを
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
で補充してください。Realtime音声は、`openclaw onboard --auth-choice openai-api-key` によって作成された `openai` APIキー認証プロファイル、Control UI Talk 用に `talk.realtime.providers.openai.apiKey` で設定された Platform `OPENAI_API_KEY`、Voice Call 用に `plugins.entries.voice-call.config.realtime.providers.openai.apiKey` で設定されたもの、または `OPENAI_API_KEY`環境変数を受け付けます。OpenAI OAuthプロファイルは、同じ OpenClawインストール内で Codexベースの `openai/*`チャットモデルを引き続き実行できますが、Realtime音声は設定しません。
</Note>

## メモリ埋め込み

OpenClaw は `memory_search` のインデックス作成とクエリ埋め込みに、OpenAI または OpenAI互換の埋め込みエンドポイントを使用できます。

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

非対称の埋め込みラベルを必要とする OpenAI互換エンドポイントでは、`memorySearch` の下に `queryInputType` と `documentInputType` を設定します。OpenClaw はそれらを provider固有の `input_type`リクエストフィールドとして転送します。クエリ埋め込みは `queryInputType` を使用し、インデックス済みメモリチャンクとバッチインデックス作成は `documentInputType` を使用します。完全な例は [メモリ設定リファレンス](/ja-JP/reference/memory-config#provider-specific-config) を参照してください。

## はじめに

好みの認証方法を選択し、セットアップ手順に従ってください。

<Tabs>
  <Tab title="APIキー (OpenAI Platform)">
    **最適な用途:** 直接 APIアクセスと使用量ベース課金。

    <Steps>
      <Step title="APIキーを取得">
        [OpenAI Platformダッシュボード](https://platform.openai.com/api-keys) から APIキーを作成またはコピーします。
      </Step>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        または、キーを直接渡します。

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### ルート概要

    | モデル参照              | ランタイム設定             | ルート                       | 認証             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | 省略 / provider/model `agentRuntime.id: "codex"` | Codex app-serverハーネス | Codex互換 OpenAIプロファイル |
    | `openai/gpt-5.4-mini` | 省略 / provider/model `agentRuntime.id: "codex"` | Codex app-serverハーネス | Codex互換 OpenAIプロファイル |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "openclaw"`              | OpenClaw埋め込みランタイム      | 選択された `openai`プロファイル |

    <Note>
    `openai/*` エージェントモデルは Codex アプリサーバーハーネスを使用します。エージェントモデルで API キー
    認証を使うには、Codex 互換の API キープロファイルを作成し、
    `auth.order.openai` で順序付けしてください。`OPENAI_API_KEY` は
    非エージェントの OpenAI API サーフェス向けの直接フォールバックのままです。古い
    レガシー Codex 認証順序エントリを移行するには、`openclaw doctor --fix` を実行してください。
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
    そのエイリアスの挙動を明示的に求める場合を除き、安定したデフォルトとして
    `openai/gpt-5.5` を維持してください。このエイリアスは現在 `medium` のテキスト詳細度のみを受け付けるため、
    OpenClaw はこのモデルに対して互換性のない OpenAI テキスト詳細度オーバーライドを正規化します。

    <Warning>
    OpenClaw は直接の OpenAI API キールートで `gpt-5.3-codex-spark` を公開しません。サインイン済みアカウントが公開している場合に限り、Codex サブスクリプションカタログエントリ経由で利用できます。
    </Warning>

  </Tab>

  <Tab title="Codex サブスクリプション">
    **最適な用途:** 別の API キーではなく、ネイティブ Codex アプリサーバー実行で ChatGPT/Codex サブスクリプションを使用する場合。Codex クラウドには ChatGPT サインインが必要です。

    <Steps>
      <Step title="Codex OAuth を実行する">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        または OAuth を直接実行します。

        ```bash
        openclaw models auth login --provider openai
        ```

        ヘッドレス環境やコールバックを扱いにくいセットアップでは、localhost ブラウザーコールバックの代わりに ChatGPT デバイスコードフローでサインインするため、`--device-code` を追加します。

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="正規の OpenAI モデルルートを使用する">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        デフォルトパスにはランタイム設定は不要です。OpenAI エージェントターンは
        ネイティブ Codex アプリサーバーランタイムを自動的に選択し、OpenClaw は
        このルートが選択されたときに同梱 Codex Plugin をインストールまたは修復します。
      </Step>
      <Step title="Codex 認証が利用可能か確認する">
        ```bash
        openclaw models list --provider openai
        ```

        Gateway の実行後、チャットで `/codex status` または `/codex models` を送信して
        ネイティブアプリサーバーランタイムを確認します。
      </Step>
    </Steps>

    ### ルート概要

    | モデル参照 | ランタイム設定 | ルート | 認証 |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | 省略 / プロバイダー/モデル `agentRuntime.id: "codex"` | ネイティブ Codex アプリサーバーハーネス | Codex サインインまたは順序付けされた `openai` 認証プロファイル |
    | `openai/gpt-5.5` | プロバイダー/モデル `agentRuntime.id: "openclaw"` | 内部 Codex 認証トランスポート付き OpenClaw 埋め込みランタイム | 選択された `openai` OAuth プロファイル |
    | レガシー Codex GPT-5.5 参照 | doctor により修復 | レガシールートを `openai/gpt-5.5` に書き換え | 移行済み OpenAI OAuth プロファイル |
    | `codex-cli/gpt-5.5` | doctor により修復 | レガシー CLI ルートを `openai/gpt-5.5` に書き換え | Codex アプリサーバー認証 |

    <Warning>
    新しいサブスクリプション backed エージェント設定には `openai/gpt-5.5` を推奨します。古い
    レガシー Codex GPT 参照はレガシー OpenClaw ルートであり、ネイティブ Codex ランタイム
    パスではありません。正規の `openai/*` 参照へ移行したい場合は
    `openclaw doctor --fix` を実行してください。`gpt-5.3-codex-spark` は、そのモデルを
    Codex サブスクリプションカタログが広告するアカウントに限定されたままです。直接の OpenAI API キーおよび
    Azure 参照では引き続き抑制されます。
    </Warning>

    <Note>
    レガシー Codex モデルプレフィックスは、doctor によって修復されるレガシー設定です。
    一般的なサブスクリプション + ネイティブランタイム構成では、Codex 認証でサインインしつつ、
    モデル参照は `openai/gpt-5.5` のままにしてください。新しい設定では OpenAI
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

    API キーバックアップを使う場合は、モデルを `openai/gpt-5.5` のままにし、認証順序を
    `openai` の下に置いてください。OpenClaw は Codex ハーネスに留まったまま、
    まずサブスクリプションを試し、次に API キーを試します。

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
    オンボーディングは `~/.codex` から OAuth 素材をインポートしなくなりました。ブラウザー OAuth（デフォルト）または上記のデバイスコードフローでサインインしてください。OpenClaw は生成された認証情報を自身のエージェント認証ストアで管理します。
    </Note>

    ### Codex OAuth ルーティングの確認と復旧

    次のコマンドを使って、デフォルトエージェントがどのモデル、ランタイム、認証ルートを使用しているか確認します。

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    特定のエージェントについては、`--agent <id>` を追加します。

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    古い設定にまだレガシー Codex GPT 参照や、明示的なランタイム設定なしの古い OpenAI ランタイム
    セッション固定が残っている場合は、修復します。

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    `models auth list --provider openai` で使用可能なプロファイルが表示されない場合は、再度
    サインインします。

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    同じエージェント内で複数の Codex OAuth ログインを使い、後で認証順序や `/model ...@<profileId>` で
    制御したい場合は、`--profile-id` を使用します。

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` は Codex 経由の OpenAI エージェントターン用のモデルルートです。プロファイル順序に依存する前に、
    古いレガシー OpenAI Codex プレフィックスのプロファイル ID と
    順序エントリを移行するには、`openclaw doctor --fix` を実行してください。

    ### ステータスインジケーター

    チャットの `/status` は、現在のセッションでどのモデルランタイムがアクティブかを表示します。
    同梱 Codex アプリサーバーハーネスは、OpenAI エージェントモデルターンでは
    `Runtime: OpenAI Codex` と表示されます。古い OpenAI ランタイムセッション固定は、設定で明示的に OpenClaw を固定していない限り
    Codex に修復されます。

    ### Doctor 警告

    レガシー Codex モデル参照や古い OpenAI ランタイム固定が設定または
    セッション状態に残っている場合、OpenClaw が明示的に設定されていない限り、
    `openclaw doctor --fix` はそれらを Codex ランタイム付きの `openai/*` に書き換えます。

    ### コンテキストウィンドウ上限

    OpenClaw はモデルメタデータとランタイムコンテキスト上限を別の値として扱います。

    Codex OAuth カタログ経由の `openai/gpt-5.5` では次のとおりです。

    - ネイティブ `contextWindow`: `1000000`
    - デフォルトランタイム `contextTokens` 上限: `272000`

    小さいデフォルト上限は、実運用ではレイテンシーと品質の特性が優れています。`contextTokens` でオーバーライドします。

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

    OpenClaw は、存在する場合 `gpt-5.5` に upstream Codex カタログメタデータを使用します。
    アカウントが認証済みであるにもかかわらず、ライブ Codex 検出で `gpt-5.5` 行が省略された場合、
    OpenClaw はその OAuth モデル行を合成し、Cron、サブエージェント、設定済みデフォルトモデルの実行が
    `Unknown model` で失敗しないようにします。

  </Tab>
</Tabs>

## ネイティブ Codex アプリサーバー認証

ネイティブ Codex アプリサーバーハーネスは、`openai/*` モデル参照と、省略された
ランタイム設定またはプロバイダー/モデル `agentRuntime.id: "codex"` を使用しますが、その認証は
引き続きアカウントベースです。OpenClaw は次の順序で認証を選択します。

1. エージェント用に順序付けされた OpenAI 認証プロファイル。できれば
   `auth.order.openai` の下に置きます。古い
   レガシー Codex 認証プロファイル ID とレガシー Codex 認証順序を移行するには、`openclaw doctor --fix` を実行します。
2. ローカル Codex CLI ChatGPT サインインなど、アプリサーバーの既存アカウント。
3. ローカル stdio アプリサーバー起動の場合のみ、アプリサーバーがアカウントなしを報告し、それでも
   OpenAI 認証を必要とする場合に、`CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

つまり、Gateway プロセスが直接 OpenAI モデルや埋め込み用に `OPENAI_API_KEY` も持っているからといって、
ローカル ChatGPT/Codex サブスクリプションのサインインが置き換えられることはありません。
env API キーフォールバックはローカル stdio のアカウントなしパスのみです。WebSocket アプリサーバー接続には
送信されません。サブスクリプション形式の Codex プロファイルが選択されると、OpenClaw は
生成される stdio アプリサーバー子プロセスから `CODEX_API_KEY` と `OPENAI_API_KEY` も除外し、
選択された認証情報をアプリサーバーログイン RPC 経由で送信します。そのサブスクリプションプロファイルが
Codex 使用量制限でブロックされた場合、OpenClaw は選択モデルを変更したり Codex
ハーネスから外れたりせずに、次に順序付けされた `openai:*` API キー
プロファイルへローテーションできます。サブスクリプションのリセット時刻が過ぎると、そのサブスクリプションプロファイルは
再び対象になります。

## 画像生成

同梱の `openai` Plugin は、`image_generate` ツール経由で画像生成を登録します。
同じ `openai/gpt-image-2` モデル参照を通じて、OpenAI API キー画像生成と Codex OAuth 画像
生成の両方をサポートします。

| 機能                | OpenAI API キー                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| モデル参照                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 認証                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth サインイン           |
| トランスポート                 | OpenAI Images API                  | Codex Responses バックエンド              |
| リクエストあたりの最大画像数    | 4                                  | 4                                    |
| 編集モード                 | 有効（最大 5 枚の参照画像） | 有効（最大 5 枚の参照画像）   |
| サイズオーバーライド            | サポートあり、2K/4K サイズを含む   | サポートあり、2K/4K サイズを含む     |
| アスペクト比 / 解像度 | OpenAI Images API には転送されない | 安全な場合にサポート対象サイズへマッピング |

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
共有ツールパラメーター、プロバイダー選択、フェイルオーバーの挙動については、[画像生成](/ja-JP/tools/image-generation) を参照してください。
</Note>

`gpt-image-2` は OpenAI のテキストから画像生成と画像
編集の両方のデフォルトです。`gpt-image-1.5`、`gpt-image-1`、`gpt-image-1-mini` は
明示的なモデルオーバーライドとして引き続き使用できます。透明背景の
PNG/WebP 出力には `openai/gpt-image-1.5` を使用してください。現在の `gpt-image-2` API は
`background: "transparent"` を拒否します。

透明背景のリクエストでは、エージェントは `image_generate` を
`model: "openai/gpt-image-1.5"`、`outputFormat: "png"` または `"webp"`、
`background: "transparent"` で呼び出す必要があります。古い `openai.background` プロバイダーオプションも
引き続き受け付けられます。OpenClaw は、デフォルトの `openai/gpt-image-2` 透明背景
リクエストを `gpt-image-1.5` に書き換えることで、公開 OpenAI および
OpenAI Codex OAuth ルートも保護します。Azure とカスタムの OpenAI 互換エンドポイントは、
設定済みのデプロイメント名/モデル名を維持します。

同じ設定は、ヘッドレス CLI 実行でも公開されています。

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

入力ファイルから開始する場合は、`openclaw infer image edit` でも
同じ `--output-format` と `--background` フラグを使用します。
`--openai-background` は OpenAI 固有のエイリアスとして引き続き利用できます。
OpenAI Images の品質とコストを制御する必要がある場合は、
`--quality low|medium|high|auto` を使用します。`image generate` または `image edit` から
OpenAI のプロバイダー固有モデレーションヒントを渡すには、`--openai-moderation low|auto` を使用します。

ChatGPT/Codex OAuth インストールでは、同じ `openai/gpt-image-2` 参照を維持します。
`openai` OAuth プロファイルが設定されている場合、OpenClaw はその保存済み OAuth
アクセストークンを解決し、Codex Responses バックエンド経由で画像リクエストを送信します。
そのリクエストでは、先に `OPENAI_API_KEY` を試したり、API キーへ黙ってフォールバックしたりしません。
代わりに直接 OpenAI Images API ルートを使いたい場合は、API キー、
カスタムベース URL、または Azure エンドポイントを指定して `models.providers.openai` を明示的に設定します。
そのカスタム画像エンドポイントが信頼済み LAN/プライベートアドレス上にある場合は、
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` も設定します。このオプトインがない限り、
OpenClaw はプライベート/内部の OpenAI 互換画像エンドポイントをブロックしたままにします。

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

| 機能             | 値                                                                                |
| ---------------- | --------------------------------------------------------------------------------- |
| デフォルトモデル | `openai/sora-2`                                                                   |
| モード           | テキストから動画、画像から動画、単一動画編集                                     |
| 参照入力         | 画像 1 点または動画 1 点                                                          |
| サイズ上書き     | テキストから動画と画像から動画でサポート                                         |
| その他の上書き   | `aspectRatio`、`resolution`、`audio`、`watermark` はツール警告付きで無視されます |

OpenAI の画像から動画へのリクエストは、画像
`input_reference` とともに `POST /v1/videos` を使用します。単一動画編集は、
アップロードされた動画を `video` フィールドに入れて `POST /v1/videos/edits` を使用します。

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

## GPT-5 プロンプトコントリビューション

OpenClaw は、OpenClaw が組み立てたプロンプト面での GPT-5 ファミリー実行に対して、共有 GPT-5 プロンプトコントリビューションを追加します。これはモデル ID に基づいて適用されるため、レガシーの修復前参照（レガシー Codex GPT-5.5 参照）、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5`、その他互換 GPT-5 参照などの OpenClaw/プロバイダールートは同じオーバーレイを受け取ります。古い GPT-4.x モデルには適用されません。

バンドルされたネイティブ Codex ハーネスは、Codex app-server の開発者指示を通じてこの OpenClaw GPT-5 オーバーレイを受け取りません。ネイティブ Codex は Codex が所有するベース、モデル、プロジェクトドキュメントの動作を維持し、OpenClaw はネイティブスレッドで Codex の組み込みパーソナリティを無効化して、エージェントワークスペースのパーソナリティファイルが authoritative なままになるようにします。OpenClaw が提供するのは、チャネル配信、OpenClaw 動的ツール、ACP 委任、ワークスペースコンテキスト、OpenClaw Skills などのランタイムコンテキストのみです。

GPT-5 コントリビューションは、一致する OpenClaw 組み立てプロンプトに対して、ペルソナ永続性、実行安全性、ツール規律、出力形状、完了チェック、検証のためのタグ付き動作契約を追加します。チャネル固有の返信とサイレントメッセージの動作は、共有 OpenClaw システムプロンプトとアウトバウンド配信ポリシーに残ります。親しみやすいインタラクションスタイル層は別個であり、設定可能です。

| 値                     | 効果                                             |
| ---------------------- | ------------------------------------------------ |
| `"friendly"`（デフォルト） | 親しみやすいインタラクションスタイル層を有効化 |
| `"on"`                 | `"friendly"` のエイリアス                       |
| `"off"`                | 親しみやすいスタイル層のみを無効化             |

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
値は実行時に大文字小文字を区別しないため、`"Off"` と `"off"` はどちらも親しみやすいスタイル層を無効化します。
</Tip>

<Note>
共有 `agents.defaults.promptOverlays.gpt5.personality` 設定が未設定の場合、レガシー `plugins.entries.openai.config.personality` は互換フォールバックとして引き続き読み取られます。
</Note>

## 音声とスピーチ

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    バンドルされた `openai` Plugin は、`messages.tts` 面に対して音声合成を登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 音声 | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | （未設定） |
    | 指示 | `messages.tts.providers.openai.instructions` | （未設定、`gpt-4o-mini-tts` のみ） |
    | 形式 | `messages.tts.providers.openai.responseFormat` | ボイスメモでは `opus`、ファイルでは `mp3` |
    | API キー | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` にフォールバック |
    | ベース URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 追加ボディ | `messages.tts.providers.openai.extraBody` / `extra_body` | （未設定） |

    利用可能なモデル: `gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。利用可能な音声: `alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` は、OpenClaw が生成したフィールドの後に `/audio/speech` リクエスト JSON へマージされるため、`lang` などの追加キーを必要とする OpenAI 互換エンドポイントに使用します。プロトタイプキーは無視されます。

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
    チャット API エンドポイントに影響を与えずに TTS ベース URL を上書きするには、`OPENAI_TTS_BASE_URL` を設定します。OpenAI TTS と Realtime 音声はどちらも OpenAI Platform API キーを通じて設定されます。OAuth のみのインストールでも Codex バックのチャットモデルは使用できますが、OpenAI のライブ音声応答は使用できません。
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    バンドルされた `openai` Plugin は、OpenClaw のメディア理解文字起こし面を通じて
    バッチ Speech-to-text を登録します。

    - デフォルトモデル: `gpt-4o-transcribe`
    - エンドポイント: OpenAI REST `/v1/audio/transcriptions`
    - 入力パス: multipart 音声ファイルアップロード
    - サポート範囲: Discord 音声チャネルセグメントやチャネル音声添付を含め、
      受信音声文字起こしが `tools.media.audio` を使用する OpenClaw のすべての場所

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

    言語とプロンプトのヒントは、共有音声メディア設定または呼び出しごとの文字起こしリクエストから指定された場合に OpenAI へ転送されます。

  </Accordion>

  <Accordion title="Realtime transcription">
    バンドルされた `openai` Plugin は、Voice Call Plugin に対して Realtime 文字起こしを登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 言語 | `...openai.language` | （未設定） |
    | プロンプト | `...openai.prompt` | （未設定） |
    | 無音時間 | `...openai.silenceDurationMs` | `800` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | 認証 | `...openai.apiKey`、`OPENAI_API_KEY`、または `openai` OAuth | API キーは直接接続します。OAuth は Realtime 文字起こしクライアントシークレットを発行します |

    <Note>
    G.711 u-law（`g711_ulaw` / `audio/pcmu`）音声を使って、`wss://api.openai.com/v1/realtime` への WebSocket 接続を使用します。`openai` OAuth のみが設定されている場合、Gateway は WebSocket を開く前に一時的な Realtime 文字起こしクライアントシークレットを発行します。このストリーミングプロバイダーは Voice Call の Realtime 文字起こしパス用です。Discord 音声は現在、短いセグメントを録音し、代わりにバッチ `tools.media.audio` 文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    バンドルされた `openai` Plugin は、Voice Call Plugin に対して Realtime 音声を登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | 音声 | `...openai.voice` | `alloy` |
    | Temperature（Azure デプロイメントブリッジ） | `...openai.temperature` | `0.8` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | 無音時間 | `...openai.silenceDurationMs` | `500` |
    | プレフィックスパディング | `...openai.prefixPaddingMs` | `300` |
    | 推論エフォート | `...openai.reasoningEffort` | （未設定） |
    | 認証 | `openai` API キー認証プロファイル、`...openai.apiKey`、または `OPENAI_API_KEY` | OpenAI Platform API キーが必要です。OpenAI OAuth は Realtime 音声を設定しません |

    `gpt-realtime-2` で利用可能な組み込み Realtime 音声: `alloy`、`ash`、
    `ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin`、`cedar`。
    OpenAI は最高の Realtime 品質のために `marin` と `cedar` を推奨しています。これは
    上記の Text-to-speech 音声とは別のセットです。`fable`、`nova`、`onyx` などの TTS
    音声が Realtime セッションで有効だと仮定しないでください。

    <Note>
    バックエンドの OpenAI Realtime ブリッジは GA Realtime WebSocket セッション形状を使用し、これは `session.temperature` を受け付けません。Azure OpenAI デプロイメントは `azureEndpoint` と `azureDeployment` 経由で引き続き利用でき、デプロイメント互換のセッション形状を維持します。双方向ツール呼び出しと G.711 u-law 音声をサポートします。
    </Note>

    <Note>
    Realtime 音声は、セッション作成時に選択されます。OpenAI はほとんどの
    セッションフィールドを後から変更できますが、そのセッションでモデルが音声を出力した後は
    音声を変更できません。OpenClaw は現在、組み込み Realtime 音声 ID を文字列として公開しています。
    </Note>

    <Note>
    Control UI Talk は、Gateway が発行した一時的なクライアントシークレットと、
    OpenAI Realtime API に対するブラウザーからの直接の WebRTC SDP 交換を使って、
    OpenAI ブラウザーリアルタイムセッションを使用します。Gateway は、選択された
    `openai` API キー認証プロファイル、または設定済みの OpenAI Platform API キーを使って
    そのクライアントシークレットを発行します。Gateway リレーと Voice Call バックエンドの
    リアルタイム WebSocket ブリッジは、ネイティブ OpenAI エンドポイントに対して同じ
    API キーのみの認証パスを使用します。メンテナーのライブ検証は
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    で利用できます。OpenAI 側の処理は、シークレットをログに出力せずに、バックエンド
    WebSocket ブリッジとブラウザー WebRTC SDP 交換の両方を検証します。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI エンドポイント

同梱の `openai` プロバイダーは、ベース URL を上書きすることで、画像生成に
Azure OpenAI リソースを対象にできます。画像生成パスでは、OpenClaw は
`models.providers.openai.baseUrl` 上の Azure ホスト名を検出し、Azure のリクエスト形式へ
自動的に切り替えます。

<Note>
リアルタイム音声は別の設定パス
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
を使用し、`models.providers.openai.baseUrl` の影響を受けません。Azure 設定については、
[音声とスピーチ](#voice-and-speech) の下にある **リアルタイム音声** アコーディオンを参照してください。
</Note>

次の場合に Azure OpenAI を使用します。

- すでに Azure OpenAI のサブスクリプション、クォータ、またはエンタープライズ契約がある
- Azure が提供するリージョン内データ所在地やコンプライアンス制御が必要
- 既存の Azure テナント内にトラフィックを維持したい

### 設定

同梱の `openai` プロバイダー経由で Azure 画像生成を行うには、
`models.providers.openai.baseUrl` を Azure リソースに向け、`apiKey` を
Azure OpenAI キーに設定します（OpenAI Platform キーではありません）。

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

認識された Azure ホスト上の画像生成リクエストでは、OpenClaw は次の処理を行います。

- `Authorization: Bearer` の代わりに `api-key` ヘッダーを送信します
- デプロイスコープのパス (`/openai/deployments/{deployment}/...`) を使用します
- 各リクエストに `?api-version=...` を追加します
- Azure 画像生成呼び出しに 600 秒のデフォルトリクエストタイムアウトを使用します。
  呼び出しごとの `timeoutMs` 値は、このデフォルトを引き続き上書きします。

その他のベース URL（公開 OpenAI、OpenAI 互換プロキシ）は、標準の
OpenAI 画像リクエスト形式を維持します。

<Note>
`openai` プロバイダーの画像生成パスで Azure ルーティングを使用するには、
OpenClaw 2026.4.22 以降が必要です。それより前のバージョンでは、任意のカスタム
`openai.baseUrl` を公開 OpenAI エンドポイントと同様に扱うため、Azure 画像デプロイに対して失敗します。
</Note>

### API バージョン

Azure 画像生成パスに特定の Azure プレビュー版または GA バージョンを固定するには、
`AZURE_OPENAI_API_VERSION` を設定します。

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

この変数が未設定の場合、デフォルトは `2024-12-01-preview` です。

### モデル名はデプロイ名

Azure OpenAI はモデルをデプロイに紐づけます。同梱の `openai` プロバイダー経由で
ルーティングされる Azure 画像生成リクエストでは、OpenClaw の `model` フィールドは
公開 OpenAI モデル ID ではなく、Azure ポータルで設定した **Azure デプロイ名** でなければなりません。

`gpt-image-2` を提供する `gpt-image-2-prod` というデプロイを作成した場合:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同じデプロイ名ルールは、同梱の `openai` プロバイダー経由でルーティングされる
画像生成呼び出しにも適用されます。

### リージョン提供状況

Azure 画像生成は現在、一部のリージョンでのみ利用できます
（例: `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`）。デプロイを作成する前に Microsoft の最新リージョン一覧を確認し、
対象のモデルがそのリージョンで提供されていることを確認してください。

### パラメーターの違い

Azure OpenAI と公開 OpenAI は、常に同じ画像パラメーターを受け入れるとは限りません。
Azure は、公開 OpenAI が許可するオプション（たとえば `gpt-image-2` の特定の
`background` 値）を拒否したり、特定のモデルバージョンでのみ公開したりする場合があります。
これらの違いは Azure と基盤モデルに由来するものであり、OpenClaw によるものではありません。
Azure リクエストが検証エラーで失敗した場合は、Azure ポータルで特定のデプロイと
API バージョンがサポートするパラメーターセットを確認してください。

<Note>
Azure OpenAI はネイティブトランスポートと互換動作を使用しますが、OpenClaw の隠し属性ヘッダーは受け取りません。
詳しくは [高度な設定](#advanced-configuration) の下にある **ネイティブルートと OpenAI 互換ルート** アコーディオンを参照してください。

Azure 上のチャットまたは Responses トラフィック（画像生成以外）には、
オンボーディングフローまたは専用の Azure プロバイダー設定を使用してください。
`openai.baseUrl` だけでは Azure API/認証形式は適用されません。別の
`azure-openai-responses/*` プロバイダーが存在します。下のサーバー側 Compaction アコーディオンを参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="トランスポート（WebSocket と SSE）">
    OpenClaw は `openai/*` に対して、SSE フォールバック付きの WebSocket 優先 (`"auto"`) を使用します。

    `"auto"` モードでは、OpenClaw は次の処理を行います。
    - SSE にフォールバックする前に、初期の WebSocket 失敗を 1 回再試行します
    - 失敗後、WebSocket を約 60 秒間劣化状態としてマークし、クールダウン中は SSE を使用します
    - 再試行と再接続のために、安定したセッション ID とターン ID ヘッダーを付与します
    - トランスポートの種類をまたいで使用量カウンター (`input_tokens` / `prompt_tokens`) を正規化します

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
          },
        },
      },
    }
    ```

    関連する OpenAI ドキュメント:
    - [WebSocket による Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [ストリーミング API レスポンス（SSE）](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="高速モード">
    OpenClaw は `openai/*` 向けに共有の高速モード切り替えを公開します。

    - **チャット/UI:** `/fast status|auto|on|off`
    - **設定:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    有効にすると、OpenClaw は高速モードを OpenAI の優先処理 (`service_tier = "priority"`) に対応付けます。既存の `service_tier` 値は保持され、高速モードは `reasoning` や `text.verbosity` を書き換えません。`fastMode: "auto"` は、自動カットオフまで新しいモデル呼び出しを高速で開始し、その後の再試行、フォールバック、ツール結果、または継続呼び出しは高速モードなしで開始します。カットオフのデフォルトは 60 秒です。変更するには、アクティブなモデルで `params.fastAutoOnSeconds` を設定します。

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
    セッションの上書きは設定より優先されます。Sessions UI でセッション上書きをクリアすると、セッションは設定済みのデフォルトに戻ります。
    </Note>

  </Accordion>

  <Accordion title="優先処理（service_tier）">
    OpenAI の API は `service_tier` を通じて優先処理を公開します。OpenClaw ではモデルごとに設定します。

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
    `serviceTier` は、ネイティブ OpenAI エンドポイント (`api.openai.com`) とネイティブ Codex エンドポイント (`chatgpt.com/backend-api`) にのみ転送されます。いずれかのプロバイダーをプロキシ経由でルーティングする場合、OpenClaw は `service_tier` を変更しません。
    </Warning>

  </Accordion>

  <Accordion title="サーバー側 Compaction（Responses API）">
    直接の OpenAI Responses モデル（`api.openai.com` 上の `openai/*`）では、OpenAI Plugin の OpenClaw ストリームラッパーがサーバー側 Compaction を自動的に有効にします。

    - `store: true` を強制します（モデル互換設定が `supportsStore: false` を設定している場合を除く）
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` を注入します
    - デフォルトの `compact_threshold`: `contextWindow` の 70%（利用できない場合は `80000`）

    これは、組み込みの OpenClaw ランタイムパスと、埋め込み実行で使用される OpenAI プロバイダーフックに適用されます。ネイティブ Codex アプリサーバーハーネスは Codex を通じて独自のコンテキストを管理し、OpenAI のデフォルトエージェントルートまたはプロバイダー/モデルランタイムポリシーによって設定されます。

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
    `responsesServerCompaction` は `context_management` の注入のみを制御します。直接の OpenAI Responses モデルは、互換設定が `supportsStore: false` を設定していない限り、引き続き `store: true` を強制します。
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT モード">
    `openai/*` 上の GPT-5 ファミリー実行では、OpenClaw はより厳格な埋め込み実行契約を使用できます。

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic` では、OpenClaw は次の処理を行います。
    - 実質的な作業に対して `update_plan` を自動的に有効化します
    - 構造的に空、または推論のみのターンを、表示される回答の継続で再試行します
    - 選択されたハーネスが提供する場合、明示的なハーネス計画イベントを使用します

    OpenClaw は、ターンが計画、進捗更新、最終回答のどれであるかを判断するために、アシスタントの文章を分類しません。

    <Note>
    OpenAI と Codex の GPT-5 ファミリー実行のみにスコープされます。他のプロバイダーや古いモデルファミリーはデフォルトの動作を維持します。
    </Note>

  </Accordion>

  <Accordion title="ネイティブルートと OpenAI 互換ルート">
    OpenClaw は、直接の OpenAI、Codex、Azure OpenAI エンドポイントを、一般的な OpenAI 互換 `/v1` プロキシとは異なるものとして扱います。

    **ネイティブルート** (`openai/*`, Azure OpenAI):
    - OpenAI の `none` effort をサポートするモデルに対してのみ `reasoning: { effort: "none" }` を維持します
    - `reasoning.effort: "none"` を拒否するモデルやプロキシでは、無効化された reasoning を省略します
    - ツールスキーマのデフォルトを strict モードにします
    - 検証済みのネイティブホストにのみ隠し属性ヘッダーを付与します
    - OpenAI 専用のリクエスト形成 (`service_tier`, `store`, reasoning 互換, プロンプトキャッシュヒント) を維持します

    **プロキシ/互換ルート:**
    - より緩い互換動作を使用する
    - 非ネイティブの `openai-completions` ペイロードから Completions の `store` を削除する
    - OpenAI互換 Completions プロキシ向けに高度な `params.extra_body`/`params.extraBody` パススルー JSON を受け入れる
    - vLLM などの OpenAI互換 Completions プロキシ向けに `params.chat_template_kwargs` を受け入れる
    - 厳密なツールスキーマやネイティブ専用ヘッダーを強制しない

    Azure OpenAI はネイティブトランスポートと互換動作を使用しますが、隠し属性ヘッダーは受け取りません。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作を選択します。
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
