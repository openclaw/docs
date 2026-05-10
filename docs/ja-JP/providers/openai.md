---
read_when:
    - OpenClaw で OpenAI モデルを使用したい
    - API キーの代わりに Codex サブスクリプション認証を使いたい場合
    - より厳格な GPT-5 エージェント実行動作が必要です
summary: OpenClawでAPIキーまたはCodexサブスクリプションを使用してOpenAIを利用する
title: OpenAI
x-i18n:
    generated_at: "2026-05-10T19:50:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5022874c9517e670b70ba90fb400f99f850746c341cb6e967c2abc96d8255548
    source_path: providers/openai.md
    workflow: 16
---

OpenAI は GPT モデル向けの開発者 API を提供しており、Codex も OpenAI の Codex クライアントを通じて ChatGPT プランのコーディングエージェントとして利用できます。OpenClaw は、設定が予測しやすい状態を保てるように、これらの面を分離しています。

OpenClaw は、正規の OpenAI モデルルートとして `openai/*` を使用します。OpenAI モデル上の埋め込みエージェントターンは、デフォルトでネイティブ Codex app-server ランタイムを通じて実行されます。直接の OpenAI API キー認証は、画像、埋め込み、音声、リアルタイムなど、非エージェントの OpenAI 面で引き続き利用できます。

- **エージェントモデル** - Codex ランタイムを通じた `openai/*` モデル。ChatGPT/Codex サブスクリプション利用には `openai-codex` 認証でサインインするか、意図的に API キー認証を使いたい場合は `openai-codex` API キープロファイルを設定します。
- **非エージェント OpenAI API** - `OPENAI_API_KEY` または OpenAI API キーオンボーディングを通じた、従量課金の直接 OpenAI Platform アクセス。
- **レガシー設定** - `openai-codex/*` モデル参照は、`openclaw doctor --fix` により `openai/*` と Codex ランタイムへ修復されます。

OpenAI は、OpenClaw のような外部ツールやワークフローでのサブスクリプション OAuth 利用を明示的にサポートしています。

プロバイダー、モデル、ランタイム、チャネルは別々のレイヤーです。これらのラベルが混同されている場合は、設定を変更する前に [エージェントランタイム](/ja-JP/concepts/agent-runtimes) を読んでください。

## クイック選択

| 目的                                                 | 使用するもの                                                     | 注記                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| ネイティブ Codex ランタイムで ChatGPT/Codex サブスクリプションを使う | `openai/gpt-5.5`                                        | デフォルトの OpenAI エージェント設定です。`openai-codex` 認証でサインインします。         |
| エージェントモデルで直接 API キー課金を使う              | `openai/gpt-5.5` と `openai-codex` API キープロファイル | そのプロファイルを優先するには `auth.order.openai-codex` を使います。                 |
| 明示的な PI を通じて直接 API キー課金を使う           | `openai/gpt-5.5` とプロバイダー/モデルランタイム `pi`       | 通常の `openai` API キープロファイルを選択します。                             |
| 最新の ChatGPT Instant API エイリアス                     | `openai/chat-latest`                                    | 直接 API キーのみ。実験用の移動エイリアスであり、デフォルトではありません。   |
| 明示的な PI を通じた ChatGPT/Codex サブスクリプション認証  | `openai/gpt-5.5` とプロバイダー/モデルランタイム `pi`       | 互換ルート用に `openai-codex` 認証プロファイルを選択します。    |
| 画像生成または編集                          | `openai/gpt-image-2`                                    | `OPENAI_API_KEY` または OpenAI Codex OAuth のどちらでも動作します。             |
| 透明背景画像                        | `openai/gpt-image-1.5`                                  | `outputFormat=png` または `webp` と `openai.background=transparent` を使用します。 |

## 名前の対応表

名前は似ていますが、相互に置き換えられるものではありません。

| 表示される名前                            | レイヤー               | 意味                                                                                           |
| --------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | プロバイダープレフィックス     | 正規の OpenAI モデルルート。エージェントターンは Codex ランタイムを使用します。                                  |
| `openai-codex`                          | 認証/プロファイルプレフィックス | OpenAI Codex OAuth/サブスクリプション認証プロファイルプロバイダー。                                            |
| `codex` Plugin                          | Plugin              | ネイティブ Codex app-server ランタイムと `/codex` チャット制御を提供する、同梱 OpenClaw Plugin。 |
| プロバイダー/モデル `agentRuntime.id: codex` | エージェントランタイム       | 一致する埋め込みターンに対して、ネイティブ Codex app-server ハーネスを強制します。                            |
| `/codex ...`                            | チャットコマンドセット    | 会話から Codex app-server スレッドをバインド/制御します。                                        |
| `runtime: "acp", agentId: "codex"`      | ACP セッションルート   | ACP/acpx を通じて Codex を実行する明示的なフォールバックパス。                                          |

これは、設定に `openai/*` モデル参照と `openai-codex` 認証プロファイルの両方を意図的に含められることを意味します。`openclaw doctor --fix` は、レガシーな `openai-codex/*` モデル参照を正規の OpenAI モデルルートへ書き換えます。

<Note>
GPT-5.5 は、直接の OpenAI Platform API キーアクセスとサブスクリプション/OAuth ルートの両方で利用できます。ChatGPT/Codex サブスクリプションとネイティブ Codex 実行を組み合わせる場合は、`openai/gpt-5.5` を使用してください。ランタイム設定を未設定にすると、OpenAI エージェントターンでは Codex ハーネスが選択されるようになっています。OpenAI エージェントモデルで直接 API キー認証を使いたい場合にのみ、OpenAI API キープロファイルを使用してください。
</Note>

<Note>
OpenAI エージェントモデルのターンには、同梱の Codex app-server Plugin が必要です。明示的な PI ランタイム設定は、オプトインの互換ルートとして引き続き利用できます。PI が `openai-codex` 認証プロファイルとともに明示的に選択された場合、OpenClaw は公開モデル参照を `openai/*` のまま維持し、内部ではレガシーな Codex 認証トランスポートを通じて PI にルーティングします。古い `openai-codex/*` モデル参照や、明示的なランタイム設定に由来しない古い PI セッション固定を修復するには、`openclaw doctor --fix` を実行してください。
</Note>

## OpenClaw の機能カバレッジ

| OpenAI 機能         | OpenClaw 面                                                                 | 状態                                                 |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| チャット / Responses          | `openai/<model>` モデルプロバイダー                                                  | はい                                                    |
| Codex サブスクリプションモデル | `openai/<model>` と `openai-codex` OAuth                                       | はい                                                    |
| レガシー Codex モデル参照   | `openai-codex/<model>`                                                           | doctor により `openai/<model>` へ修復                 |
| Codex app-server ハーネス  | `openai/<model>` でランタイムを省略、またはプロバイダー/モデル `agentRuntime.id: codex` | はい                                                    |
| サーバー側 Web 検索    | ネイティブ OpenAI Responses ツール                                                     | はい。Web 検索が有効で、プロバイダーが固定されていない場合 |
| 画像                    | `image_generate`                                                                 | はい                                                    |
| 動画                    | `video_generate`                                                                 | はい                                                    |
| テキスト読み上げ            | `messages.tts.provider: "openai"` / `tts`                                        | はい                                                    |
| バッチ音声文字起こし      | `tools.media.audio` / メディア理解                                        | はい                                                    |
| ストリーミング音声文字起こし  | 音声通話 `streaming.provider: "openai"`                                        | はい                                                    |
| リアルタイム音声            | 音声通話 `realtime.provider: "openai"` / Control UI Talk                       | はい                                                    |
| 埋め込み                | メモリ埋め込みプロバイダー                                                        | はい                                                    |

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

非対称の埋め込みラベルが必要な OpenAI 互換エンドポイントでは、`memorySearch` の下に `queryInputType` と `documentInputType` を設定します。OpenClaw は、それらをプロバイダー固有の `input_type` リクエストフィールドとして転送します。クエリ埋め込みは `queryInputType` を使用し、インデックス化されたメモリチャンクとバッチインデックス作成は `documentInputType` を使用します。完全な例については、[メモリ設定リファレンス](/ja-JP/reference/memory-config#provider-specific-config) を参照してください。

## はじめに

好みの認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="API キー (OpenAI Platform)">
    **適している用途:** 直接 API アクセスと従量課金。

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
    | `openai/gpt-5.5`      | 省略 / プロバイダー/モデル `agentRuntime.id: "codex"` | Codex app-server ハーネス | `openai-codex` プロファイル |
    | `openai/gpt-5.4-mini` | 省略 / プロバイダー/モデル `agentRuntime.id: "codex"` | Codex app-server ハーネス | `openai-codex` プロファイル |
    | `openai/gpt-5.5`      | プロバイダー/モデル `agentRuntime.id: "pi"`              | PI 埋め込みランタイム      | `openai` プロファイルまたは選択された `openai-codex` プロファイル |

    <Note>
    `openai/*` エージェントモデルは Codex app-server ハーネスを使用します。エージェントモデルで API キー認証を使用するには、`openai-codex` API キープロファイルを作成し、`auth.order.openai-codex` でその順序を指定します。`OPENAI_API_KEY` は、非エージェントの OpenAI API 面に対する直接フォールバックとして残ります。
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

    `chat-latest` は移動エイリアスです。OpenAI はこれを ChatGPT で使用される最新の Instant モデルとして文書化しており、本番 API 利用には `gpt-5.5` を推奨しています。そのため、そのエイリアス動作を明示的に必要とする場合を除き、安定したデフォルトとして `openai/gpt-5.5` を維持してください。このエイリアスは現在、`medium` のテキスト詳細度のみを受け付けるため、OpenClaw はこのモデルに対して互換性のない OpenAI テキスト詳細度オーバーライドを正規化します。

    <Warning>
    OpenClaw は `openai/gpt-5.3-codex-spark` を公開しません。実際の OpenAI API リクエストはそのモデルを拒否し、現在の Codex カタログにもそれは公開されていません。
    </Warning>

  </Tab>

  <Tab title="Codex サブスクリプション">
    **適している用途:** 別個の API キーではなく、ChatGPT/Codex サブスクリプションをネイティブ Codex app-server 実行で使用する場合。Codex cloud には ChatGPT サインインが必要です。

    <Steps>
      <Step title="Codex OAuth を実行する">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        または、OAuth を直接実行します。

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        ヘッドレス環境やコールバックを扱いにくいセットアップでは、localhost ブラウザーコールバックの代わりに ChatGPT デバイスコードフローでサインインするため、`--device-code` を追加します。

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Use the canonical OpenAI model route">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        デフォルトパスにランタイム設定は不要です。OpenAI エージェントターンは
        ネイティブ Codex app-server ランタイムを自動的に選択し、OpenClaw は
        このルートが選択されたときにバンドル済み Codex plugin をインストールまたは修復します。
      </Step>
      <Step title="Verify Codex auth is available">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Gateway が実行中になったら、チャットで `/codex status` または `/codex models` を送信して、
        ネイティブ app-server ランタイムを確認します。
      </Step>
    </Steps>

    ### ルート概要

    | モデル参照 | ランタイム設定 | ルート | 認証 |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | 省略 / プロバイダー/モデル `agentRuntime.id: "codex"` | ネイティブ Codex app-server ハーネス | Codex サインインまたは選択された `openai-codex` プロファイル |
    | `openai/gpt-5.5` | プロバイダー/モデル `agentRuntime.id: "pi"` | 内部 Codex 認証トランスポートを使用する PI 埋め込みランタイム | 選択された `openai-codex` プロファイル |
    | `openai-codex/gpt-5.5` | doctor により修復 | `openai/gpt-5.5` に書き換えられるレガシールート | 既存の `openai-codex` プロファイル |

    <Warning>
    古い `openai-codex/gpt-5.1*`、`openai-codex/gpt-5.2*`、または
    `openai-codex/gpt-5.3*` モデル参照を設定しないでください。ChatGPT/Codex OAuth アカウントは現在、
    これらのモデルを拒否します。`openai/gpt-5.5` を使用してください。OpenAI エージェントターンは現在、
    デフォルトで Codex ランタイムを選択します。
    </Warning>

    <Note>
    認証/プロファイルコマンドには `openai-codex` プロバイダー id を引き続き使用してください。
    `openai-codex/*` モデルプレフィックスは doctor により修復されるレガシー設定です。
    一般的なサブスクリプションとネイティブランタイムの構成では、`openai-codex` でサインインしますが、
    モデル参照は `openai/gpt-5.5` のままにします。
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

    <Note>
    オンボーディングは `~/.codex` から OAuth 素材をインポートしなくなりました。ブラウザー OAuth（デフォルト）または上記のデバイスコードフローでサインインしてください。OpenClaw は生成された認証情報を独自のエージェント認証ストアで管理します。
    </Note>

    ### Codex OAuth ルーティングを確認して復旧する

    次のコマンドを使用して、デフォルトエージェントが使用しているモデル、ランタイム、認証ルートを確認します。

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    特定のエージェントについては、`--agent <id>` を追加します。

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    古い設定にまだ `openai-codex/gpt-*` がある場合、または明示的なランタイム設定なしで古い OpenAI PI
    セッション固定が残っている場合は、修復します。

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    `models auth list --provider openai-codex` で使用可能なプロファイルが表示されない場合は、
    再度サインインします。

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` は認証/プロファイルのプロバイダー id のままです。`openai/*` は
    Codex 経由の OpenAI エージェントターンのモデルルートです。

    ### ステータスインジケーター

    チャット `/status` は、現在のセッションでどのモデルランタイムがアクティブかを表示します。
    バンドル済み Codex app-server ハーネスは、OpenAI エージェントモデルターンでは `Runtime: OpenAI Codex` として表示されます。
    古い PI セッション固定は、設定が明示的に PI を固定していない限り Codex に修復されます。

    ### Doctor 警告

    `openai-codex/*` ルートまたは古い OpenAI PI 固定が設定やセッション状態に残っている場合、
    `openclaw doctor --fix` は、PI が明示的に設定されていない限り、それらを Codex ランタイム付きの
    `openai/*` に書き換えます。

    ### コンテキストウィンドウ上限

    OpenClaw はモデルメタデータとランタイムコンテキスト上限を別々の値として扱います。

    Codex OAuth カタログ経由の `openai/gpt-5.5` では次のとおりです。

    - ネイティブ `contextWindow`: `1000000`
    - デフォルトランタイム `contextTokens` 上限: `272000`

    小さいデフォルト上限は、実運用ではレイテンシーと品質の特性が優れています。`contextTokens` で上書きします。

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

    OpenClaw は、`gpt-5.5` が存在する場合、そのアップストリーム Codex カタログメタデータを使用します。
    アカウントが認証済みであるにもかかわらずライブ Codex 検出で `gpt-5.5` 行が省略される場合、
    OpenClaw はその OAuth モデル行を合成し、cron、サブエージェント、設定済みデフォルトモデルの実行が
    `Unknown model` で失敗しないようにします。

  </Tab>
</Tabs>

## ネイティブ Codex app-server 認証

ネイティブ Codex app-server ハーネスは、`openai/*` モデル参照と、省略されたランタイム設定またはプロバイダー/モデル
`agentRuntime.id: "codex"` を使用しますが、認証は引き続きアカウントベースです。OpenClaw は
次の順序で認証を選択します。

1. エージェントにバインドされた明示的な OpenClaw `openai-codex` 認証プロファイル。
2. ローカル Codex CLI ChatGPT サインインなど、app-server の既存アカウント。
3. ローカル stdio app-server 起動の場合のみ、app-server がアカウントなしと報告し、それでも
   OpenAI 認証を必要とする場合に、`CODEX_API_KEY`、次に `OPENAI_API_KEY`。

つまり、Gateway プロセスに直接 OpenAI モデルや embeddings 用の `OPENAI_API_KEY` があるからといって、
ローカル ChatGPT/Codex サブスクリプションサインインが置き換えられるわけではありません。
env API キーのフォールバックは、ローカル stdio のアカウントなしパスのみです。
WebSocket app-server 接続には送信されません。サブスクリプション形式の Codex プロファイルが選択されている場合、
OpenClaw は生成される stdio app-server 子プロセスから `CODEX_API_KEY` と `OPENAI_API_KEY` も除外し、
選択された認証情報を app-server login RPC 経由で送信します。

## 画像生成

バンドル済み `openai` plugin は、`image_generate` ツール経由で画像生成を登録します。
同じ `openai/gpt-image-2` モデル参照で、OpenAI API キー画像生成と Codex OAuth 画像生成の両方をサポートします。

| 機能                | OpenAI API キー                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| モデル参照                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 認証                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth サインイン           |
| トランスポート                 | OpenAI Images API                  | Codex Responses バックエンド              |
| リクエストあたりの最大画像数    | 4                                  | 4                                    |
| 編集モード                 | 有効（最大 5 枚の参照画像） | 有効（最大 5 枚の参照画像）   |
| サイズ上書き            | サポート済み、2K/4K サイズを含む   | サポート済み、2K/4K サイズを含む     |
| アスペクト比 / 解像度 | OpenAI Images API に転送されない | 安全な場合にサポートされるサイズへマッピング |

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

`gpt-image-2` は、OpenAI のテキストから画像生成と画像編集の両方のデフォルトです。
`gpt-image-1.5`、`gpt-image-1`、`gpt-image-1-mini` は、明示的なモデル上書きとして引き続き使用できます。
透明背景の PNG/WebP 出力には `openai/gpt-image-1.5` を使用してください。現在の `gpt-image-2` API は
`background: "transparent"` を拒否します。

透明背景リクエストの場合、エージェントは `image_generate` を
`model: "openai/gpt-image-1.5"`、`outputFormat: "png"` または `"webp"`、および
`background: "transparent"` で呼び出す必要があります。古い `openai.background` プロバイダーオプションも
引き続き受け付けられます。OpenClaw は、デフォルトの `openai/gpt-image-2` 透明リクエストを
`gpt-image-1.5` に書き換えることで、公開 OpenAI ルートと OpenAI Codex OAuth ルートも保護します。
Azure とカスタム OpenAI 互換エンドポイントは、設定済みのデプロイメント/モデル名を維持します。

同じ設定はヘッドレス CLI 実行にも公開されています。

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

入力ファイルから開始する場合は、`openclaw infer image edit` でも同じ `--output-format` と
`--background` フラグを使用します。`--openai-background` は OpenAI 固有のエイリアスとして引き続き利用できます。

Codex OAuth インストールでは、同じ `openai/gpt-image-2` 参照を維持します。
`openai-codex` OAuth プロファイルが設定されている場合、OpenClaw は保存済み OAuth アクセストークンを解決し、
Codex Responses バックエンド経由で画像リクエストを送信します。そのリクエストに対して、先に
`OPENAI_API_KEY` を試したり、API キーへ暗黙にフォールバックしたりはしません。代わりに直接 OpenAI Images API
ルートを使用したい場合は、API キー、カスタムベース URL、または Azure エンドポイントを使って
`models.providers.openai` を明示的に設定してください。
そのカスタム画像エンドポイントが信頼済み LAN/プライベートアドレス上にある場合は、
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` も設定してください。OpenClaw は、
このオプトインがない限り、プライベート/内部 OpenAI 互換画像エンドポイントをブロックしたままにします。

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

バンドル済み `openai` plugin は、`video_generate` ツール経由で動画生成を登録します。

| 機能       | 値                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| デフォルトモデル    | `openai/sora-2`                                                                   |
| モード            | テキストから動画、画像から動画、単一動画編集                                  |
| 参照入力 | 画像 1 点または動画 1 点                                                                |
| サイズ上書き   | サポート済み                                                                         |
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
共通ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation) を参照してください。
</Note>

## GPT-5 プロンプト寄与

OpenClaw は、プロバイダーをまたぐ GPT-5 ファミリーの実行に対して、共有 GPT-5 プロンプト寄与を追加します。これはモデル id によって適用されるため、`openai/gpt-5.5`、`openai-codex/gpt-5.5` のような修復前レガシー参照、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5`、およびその他の互換 GPT-5 参照は同じオーバーレイを受け取ります。古い GPT-4.x モデルには適用されません。

バンドル済みネイティブ Codex ハーネスは、Codex app-server 開発者指示を通じて同じ GPT-5 動作と Heartbeat オーバーレイを使用するため、Codex 経由でルーティングされた `openai/gpt-5.x` セッションは、ハーネスプロンプトの残りを Codex が所有していても、同じフォロースルーとプロアクティブな Heartbeat ガイダンスを維持します。

GPT-5 のコントリビューションは、ペルソナ永続性、実行安全性、ツール規律、出力形式、完了チェック、検証のためのタグ付き動作契約を追加します。チャネル固有の返信とサイレントメッセージの動作は、共有の OpenClaw システムプロンプトとアウトバウンド配信ポリシーに残ります。GPT-5 ガイダンスは、一致するモデルに対して常に有効です。フレンドリーな対話スタイルレイヤーは別個で、設定可能です。

| 値                     | 効果                                      |
| ---------------------- | ----------------------------------------- |
| `"friendly"` (デフォルト) | フレンドリーな対話スタイルレイヤーを有効化 |
| `"on"`                 | `"friendly"` のエイリアス                 |
| `"off"`                | フレンドリーなスタイルレイヤーのみを無効化 |

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
値は実行時に大文字小文字を区別しないため、`"Off"` と `"off"` はどちらもフレンドリーなスタイルレイヤーを無効化します。
</Tip>

<Note>
共有の `agents.defaults.promptOverlays.gpt5.personality` 設定が未設定の場合、レガシーの `plugins.entries.openai.config.personality` は互換性フォールバックとして引き続き読み取られます。
</Note>

## 音声と発話

<AccordionGroup>
  <Accordion title="音声合成 (TTS)">
    バンドルされた `openai` Plugin は、`messages.tts` サーフェスに音声合成を登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 音声 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | (未設定) |
    | 指示 | `messages.tts.providers.openai.instructions` | (未設定、`gpt-4o-mini-tts` のみ) |
    | 形式 | `messages.tts.providers.openai.responseFormat` | 音声メモでは `opus`、ファイルでは `mp3` |
    | API キー | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` にフォールバック |
    | ベース URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 追加ボディ | `messages.tts.providers.openai.extraBody` / `extra_body` | (未設定) |

    利用可能なモデル: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`。利用可能な音声: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`。

    `extraBody` は OpenClaw が生成したフィールドの後に `/audio/speech` リクエスト JSON へマージされるため、`lang` などの追加キーを必要とする OpenAI 互換エンドポイントに使用します。プロトタイプキーは無視されます。

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
    チャット API エンドポイントに影響を与えずに TTS ベース URL を上書きするには、`OPENAI_TTS_BASE_URL` を設定します。OpenAI TTS は引き続き API キーで設定されます。OAuth のみのライブ折り返し発話には、エージェントモードの STT -> TTS 音声ではなく、Realtime 音声パスを使用してください。
    </Note>

  </Accordion>

  <Accordion title="音声認識">
    バンドルされた `openai` Plugin は、OpenClaw のメディア理解文字起こしサーフェスを通じてバッチ音声認識を登録します。

    - デフォルトモデル: `gpt-4o-transcribe`
    - エンドポイント: OpenAI REST `/v1/audio/transcriptions`
    - 入力パス: multipart 音声ファイルアップロード
    - Discord 音声チャネルセグメントやチャネル音声添付ファイルを含め、インバウンド音声文字起こしが `tools.media.audio` を使用する OpenClaw のすべての場所でサポート

    インバウンド音声文字起こしに OpenAI を強制するには:

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

    言語とプロンプトヒントは、共有音声メディア設定または呼び出しごとの文字起こしリクエストで指定された場合、OpenAI に転送されます。

  </Accordion>

  <Accordion title="リアルタイム文字起こし">
    バンドルされた `openai` Plugin は、Voice Call Plugin にリアルタイム文字起こしを登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 言語 | `...openai.language` | (未設定) |
    | プロンプト | `...openai.prompt` | (未設定) |
    | 無音時間 | `...openai.silenceDurationMs` | `800` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | 認証 | `...openai.apiKey`, `OPENAI_API_KEY`, または `openai-codex` OAuth | API キーは直接接続します。OAuth は Realtime 文字起こしクライアントシークレットを発行します |

    <Note>
    G.711 u-law (`g711_ulaw` / `audio/pcmu`) 音声で、`wss://api.openai.com/v1/realtime` への WebSocket 接続を使用します。`openai-codex` OAuth のみが設定されている場合、Gateway は WebSocket を開く前に一時的な Realtime 文字起こしクライアントシークレットを発行します。このストリーミングプロバイダーは Voice Call のリアルタイム文字起こしパス用です。Discord 音声は現在、短いセグメントを録音し、代わりにバッチ `tools.media.audio` 文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="リアルタイム音声">
    バンドルされた `openai` Plugin は、Voice Call Plugin にリアルタイム音声を登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | 音声 | `...openai.voice` | `alloy` |
    | 温度 (Azure デプロイブリッジ) | `...openai.temperature` | `0.8` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | 無音時間 | `...openai.silenceDurationMs` | `500` |
    | プレフィックスパディング | `...openai.prefixPaddingMs` | `300` |
    | 推論努力 | `...openai.reasoningEffort` | (未設定) |
    | 認証 | `...openai.apiKey`, `OPENAI_API_KEY`, または `openai-codex` OAuth | Browser Talk と非 Azure バックエンドブリッジは Codex OAuth を使用できます |

    `gpt-realtime-2` で利用可能な組み込み Realtime 音声: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`。
    OpenAI は最高の Realtime 品質のために `marin` と `cedar` を推奨しています。これは上記の Text-to-speech 音声とは別のセットです。`fable`、`nova`、`onyx` のような TTS 音声が Realtime セッションで有効だと想定しないでください。

    <Note>
    バックエンド OpenAI リアルタイムブリッジは GA Realtime WebSocket セッション形状を使用し、これは `session.temperature` を受け付けません。Azure OpenAI デプロイは `azureEndpoint` と `azureDeployment` 経由で引き続き利用でき、デプロイ互換のセッション形状を維持します。双方向ツール呼び出しと G.711 u-law 音声をサポートします。
    </Note>

    <Note>
    リアルタイム音声はセッション作成時に選択されます。OpenAI はほとんどのセッションフィールドを後から変更できますが、そのセッションでモデルが音声を出力した後は音声を変更できません。OpenClaw は現在、組み込み Realtime 音声 ID を文字列として公開しています。
    </Note>

    <Note>
    Control UI Talk は、Gateway が発行する一時的なクライアントシークレットと、OpenAI Realtime API に対する直接ブラウザー WebRTC SDP 交換を使用して、OpenAI ブラウザーリアルタイムセッションを使用します。直接の OpenAI API キーが設定されていない場合、Gateway は選択された `openai-codex` OAuth プロファイルでそのクライアントシークレットを発行できます。Gateway リレーと Voice Call バックエンドリアルタイム WebSocket ブリッジは、ネイティブ OpenAI エンドポイントに対して同じ OAuth フォールバックを使用します。メンテナーのライブ検証は
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    で利用できます。OpenAI レッグは、シークレットをログに記録せずに、バックエンド WebSocket ブリッジとブラウザー WebRTC SDP 交換の両方を検証します。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI エンドポイント

バンドルされた `openai` プロバイダーは、ベース URL を上書きすることで画像生成用の Azure OpenAI リソースを対象にできます。画像生成パスでは、OpenClaw は `models.providers.openai.baseUrl` の Azure ホスト名を検出し、自動的に Azure のリクエスト形状に切り替えます。

<Note>
リアルタイム音声は別の設定パス
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
を使用し、`models.providers.openai.baseUrl` の影響を受けません。Azure 設定については、[音声と発話](#voice-and-speech) の下にある **リアルタイム音声** アコーディオンを参照してください。
</Note>

次の場合に Azure OpenAI を使用します:

- Azure OpenAI サブスクリプション、クォータ、またはエンタープライズ契約をすでに持っている
- Azure が提供する地域データレジデンシーまたはコンプライアンス制御が必要
- 既存の Azure テナンシー内にトラフィックを維持したい

### 設定

バンドルされた `openai` プロバイダーを通じた Azure 画像生成では、`models.providers.openai.baseUrl` を Azure リソースに向け、`apiKey` を Azure OpenAI キー (OpenAI Platform キーではありません) に設定します:

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

OpenClaw は Azure 画像生成ルート用に、次の Azure ホストサフィックスを認識します:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

認識された Azure ホスト上の画像生成リクエストについて、OpenClaw は次を行います:

- `Authorization: Bearer` の代わりに `api-key` ヘッダーを送信
- デプロイスコープのパス (`/openai/deployments/{deployment}/...`) を使用
- 各リクエストに `?api-version=...` を追加
- Azure 画像生成呼び出しに 600 秒のデフォルトリクエストタイムアウトを使用します。
  呼び出しごとの `timeoutMs` 値は引き続きこのデフォルトを上書きします。

その他のベース URL (公開 OpenAI、OpenAI 互換プロキシ) は、標準の OpenAI 画像リクエスト形状を維持します。

<Note>
`openai` プロバイダーの画像生成パスに対する Azure ルーティングには、OpenClaw 2026.4.22 以降が必要です。以前のバージョンは、カスタム `openai.baseUrl` を公開 OpenAI エンドポイントと同様に扱い、Azure 画像デプロイに対して失敗します。
</Note>

### API バージョン

Azure 画像生成パスに対して特定の Azure プレビューまたは GA バージョンを固定するには、`AZURE_OPENAI_API_VERSION` を設定します:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

変数が未設定の場合、デフォルトは `2024-12-01-preview` です。

### モデル名はデプロイ名です

Azure OpenAI はモデルをデプロイに紐付けます。バンドルされた `openai` プロバイダーを通じてルーティングされる Azure 画像生成リクエストでは、OpenClaw の `model` フィールドは、公開 OpenAI モデル ID ではなく、Azure ポータルで設定した **Azure デプロイ名** である必要があります。

`gpt-image-2` を提供する `gpt-image-2-prod` というデプロイを作成した場合:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同じデプロイ名のルールは、バンドルされた `openai` プロバイダーを通じてルーティングされる画像生成呼び出しにも適用されます。

### 地域別の提供状況

Azure 画像生成は現在、一部のリージョンでのみ利用できます
(例: `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`)。デプロイを作成する前に Microsoft の現在のリージョン一覧を確認し、特定のモデルが自分のリージョンで提供されていることを確認してください。

### パラメーターの違い

Azure OpenAI と公開 OpenAI は、常に同じ画像パラメーターを受け付けるわけではありません。Azure は、公開 OpenAI が許可するオプション (たとえば `gpt-image-2` の特定の `background` 値) を拒否する場合や、特定のモデルバージョンでのみ公開する場合があります。これらの違いは Azure と基盤モデルに由来するもので、OpenClaw によるものではありません。Azure リクエストが検証エラーで失敗した場合は、Azure ポータルで特定のデプロイと API バージョンがサポートするパラメーターセットを確認してください。

<Note>
Azure OpenAI はネイティブトランスポートと互換動作を使用しますが、
OpenClaw の隠し帰属ヘッダーは受け取りません — [高度な設定](#advanced-configuration) の下にある **ネイティブと OpenAI 互換
ルート** アコーディオンを参照してください。

Azure 上のチャットまたは Responses トラフィック（画像生成以外）では、
オンボーディングフローまたは専用の Azure プロバイダー設定を使用してください — `openai.baseUrl` だけでは
Azure API/認証の形式は適用されません。別の
`azure-openai-responses/*` プロバイダーが存在します。下のサーバー側 Compaction アコーディオンを参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="トランスポート（WebSocket と SSE）">
    OpenClaw は `openai/*` で WebSocket 優先、SSE フォールバック（`"auto"`）を使用します。

    `"auto"` モードでは、OpenClaw は次を行います。
    - SSE にフォールバックする前に、初期の WebSocket 失敗を 1 回再試行します
    - 失敗後、WebSocket を約 60 秒間低下状態としてマークし、クールダウン中は SSE を使用します
    - 再試行と再接続のために、安定したセッション ID とターン ID のヘッダーを付与します
    - トランスポートバリアント間で使用量カウンター（`input_tokens` / `prompt_tokens`）を正規化します

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
    - [WebSocket を使用する Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [ストリーミング API レスポンス（SSE）](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="高速モード">
    OpenClaw は `openai/*` 向けに共有の高速モード切り替えを提供します。

    - **チャット/UI:** `/fast status|on|off`
    - **設定:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    有効にすると、OpenClaw は高速モードを OpenAI の優先処理（`service_tier = "priority"`）にマップします。既存の `service_tier` 値は保持され、高速モードは `reasoning` や `text.verbosity` を書き換えません。

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

    サポートされる値: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` はネイティブ OpenAI エンドポイント（`api.openai.com`）とネイティブ Codex エンドポイント（`chatgpt.com/backend-api`）にのみ転送されます。いずれかのプロバイダーをプロキシ経由でルーティングする場合、OpenClaw は `service_tier` を変更しません。
    </Warning>

  </Accordion>

  <Accordion title="サーバー側 Compaction（Responses API）">
    直接の OpenAI Responses モデル（`api.openai.com` 上の `openai/*`）では、OpenAI Plugin の Pi ハーネスストリームラッパーがサーバー側 Compaction を自動的に有効にします。

    - `store: true` を強制します（モデル互換が `supportsStore: false` を設定している場合を除く）
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` を注入します
    - デフォルトの `compact_threshold`: `contextWindow` の 70%（利用できない場合は `80000`）

    これは組み込みの Pi ハーネスパス、および埋め込み実行で使用される OpenAI プロバイダーフックに適用されます。ネイティブ Codex アプリサーバーハーネスは Codex を通じて独自のコンテキストを管理し、OpenAI のデフォルトエージェントルートまたはプロバイダー/モデルランタイムポリシーによって設定されます。

    <Tabs>
      <Tab title="明示的に有効化">
        Azure OpenAI Responses のような互換エンドポイントで役立ちます。

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

  <Accordion title="厳格なエージェント型 GPT モード">
    `openai/*` 上の GPT-5 ファミリー実行では、OpenClaw はより厳格な埋め込み実行契約を使用できます。

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
    - ツールアクションが利用可能な場合、計画だけのターンを成功した進捗として扱わなくなります
    - 今すぐ行動するよう促す指示でターンを再試行します
    - 実質的な作業では `update_plan` を自動的に有効にします
    - モデルが行動せずに計画し続ける場合、明示的なブロック状態を表示します

    <Note>
    OpenAI と Codex の GPT-5 ファミリー実行のみにスコープされます。他のプロバイダーと古いモデルファミリーはデフォルトの動作を維持します。
    </Note>

  </Accordion>

  <Accordion title="ネイティブと OpenAI 互換ルート">
    OpenClaw は、直接の OpenAI、Codex、Azure OpenAI エンドポイントを、汎用の OpenAI 互換 `/v1` プロキシとは異なるものとして扱います。

    **ネイティブルート**（`openai/*`, Azure OpenAI）:
    - OpenAI の `none` effort をサポートするモデルでのみ `reasoning: { effort: "none" }` を保持します
    - `reasoning.effort: "none"` を拒否するモデルまたはプロキシでは、無効化された reasoning を省略します
    - ツールスキーマのデフォルトを strict モードにします
    - 検証済みのネイティブホストでのみ隠し帰属ヘッダーを付与します
    - OpenAI 専用のリクエスト整形（`service_tier`, `store`, reasoning 互換、プロンプトキャッシュヒント）を保持します

    **プロキシ/互換ルート:**
    - より緩い互換動作を使用します
    - 非ネイティブの `openai-completions` ペイロードから Completions の `store` を削除します
    - OpenAI 互換 Completions プロキシ向けに高度な `params.extra_body`/`params.extraBody` パススルー JSON を受け入れます
    - vLLM などの OpenAI 互換 Completions プロキシ向けに `params.chat_template_kwargs` を受け入れます
    - strict ツールスキーマやネイティブ専用ヘッダーを強制しません

    Azure OpenAI はネイティブトランスポートと互換動作を使用しますが、隠し帰属ヘッダーは受け取りません。

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
