---
read_when:
    - OpenClaw で OpenAI モデルを使用したい
    - API キーの代わりに Codex サブスクリプション認証を使いたい場合
    - より厳格な GPT-5 エージェントの実行動作が必要です
summary: OpenClawで APIキーまたは Codex サブスクリプションを使って OpenAI を使用する
title: OpenAI
x-i18n:
    generated_at: "2026-05-07T13:25:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a37c0b2c227674b6762aea70ce6d640d49044117c9244377058032ade561d6b
    source_path: providers/openai.md
    workflow: 16
---

OpenAI は GPT モデル向けの開発者 API を提供しており、Codex も OpenAI の Codex クライアントを通じて ChatGPT プランのコーディングエージェントとして利用できます。OpenClaw は、設定を予測可能に保つためにこれらのサーフェスを分離しています。

OpenClaw は正規の OpenAI モデルルートとして `openai/*` を使用します。OpenAI モデル上の埋め込みエージェントターンは、デフォルトではネイティブ Codex app-server runtime を通じて実行されます。直接の OpenAI API キー認証は、画像、埋め込み、音声、realtime など、エージェント以外の OpenAI サーフェスで引き続き利用できます。

- **エージェントモデル** - Codex runtime 経由の `openai/*` モデル。ChatGPT/Codex サブスクリプション利用では `openai-codex` 認証でサインインします。意図的に API キー認証を使う場合は、`openai-codex` API キープロファイルを設定します。
- **エージェント以外の OpenAI API** - `OPENAI_API_KEY` または OpenAI API キーのオンボーディングを通じた、使用量ベース課金の直接 OpenAI Platform アクセス。
- **レガシー設定** - `openai-codex/*` モデル参照は、`openclaw doctor --fix` により、Codex runtime を伴う `openai/*` へ修復されます。

OpenAI は、OpenClaw のような外部ツールやワークフローでのサブスクリプション OAuth 利用を明示的にサポートしています。

プロバイダー、モデル、runtime、チャネルは別々のレイヤーです。これらのラベルが混同されている場合は、設定を変更する前に [エージェント runtime](/ja-JP/concepts/agent-runtimes) を読んでください。

## クイック選択

| 目的                                                 | 使用するもの                                            | 注記                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| ネイティブ Codex runtime での ChatGPT/Codex サブスクリプション | `openai/gpt-5.5`                                        | デフォルトの OpenAI エージェント設定。`openai-codex` 認証でサインインします。 |
| エージェントモデルの直接 API キー課金                | `openai/gpt-5.5` と `openai-codex` API キープロファイル | そのプロファイルを優先するには `auth.order.openai-codex` を使用します。 |
| 明示的な PI 経由の直接 API キー課金                  | `openai/gpt-5.5` と `agentRuntime.id: "pi"`             | 通常の `openai` API キープロファイルを選択します。                     |
| 最新の ChatGPT Instant API エイリアス                | `openai/chat-latest`                                    | 直接 API キーのみ。実験用の移動エイリアスであり、デフォルトではありません。 |
| 明示的な PI 経由の ChatGPT/Codex サブスクリプション認証 | `openai/gpt-5.5` と `agentRuntime.id: "pi"`             | 互換性ルート用に `openai-codex` 認証プロファイルを選択します。          |
| 画像生成または編集                                   | `openai/gpt-image-2`                                    | `OPENAI_API_KEY` または OpenAI Codex OAuth のどちらでも動作します。   |
| 透明背景画像                                         | `openai/gpt-image-1.5`                                  | `outputFormat=png` または `webp` と `openai.background=transparent` を使用します。 |

## 名前の対応表

名前は似ていますが、互換ではありません。

| 表示される名前                     | レイヤー            | 意味                                                                                              |
| ---------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | プロバイダー接頭辞  | 正規の OpenAI モデルルート。エージェントターンは Codex runtime を使用します。                     |
| `openai-codex`                     | 認証/プロファイル接頭辞 | OpenAI Codex OAuth/サブスクリプション認証プロファイルプロバイダー。                               |
| `codex` plugin                     | Plugin              | ネイティブ Codex app-server runtime と `/codex` チャット制御を提供する、OpenClaw に同梱された plugin。 |
| `agentRuntime.id: codex`           | エージェント runtime | 埋め込みターンにネイティブ Codex app-server ハーネスを強制します。                                |
| `/codex ...`                       | チャットコマンドセット | 会話から Codex app-server スレッドをバインド/制御します。                                         |
| `runtime: "acp", agentId: "codex"` | ACP セッションルート | ACP/acpx 経由で Codex を実行する明示的なフォールバックパス。                                      |

これは、設定に `openai/*` モデル参照と `openai-codex` 認証プロファイルの両方を意図的に含められることを意味します。`openclaw doctor --fix` は、レガシーな `openai-codex/*` モデル参照を正規の OpenAI モデルルートへ書き換えます。

<Note>
GPT-5.5 は、直接の OpenAI Platform API キーアクセスとサブスクリプション/OAuth ルートの両方で利用できます。ChatGPT/Codex サブスクリプションとネイティブ Codex 実行を組み合わせる場合は、`openai/gpt-5.5` を使用してください。runtime 設定を未指定にすると、OpenAI エージェントターンには Codex ハーネスが選択されるようになっています。OpenAI エージェントモデルに直接 API キー認証を使いたい場合にのみ、OpenAI API キープロファイルを使用してください。
</Note>

<Note>
OpenAI エージェントモデルのターンには、同梱の Codex app-server plugin が必要です。明示的な PI runtime 設定は、オプトインの互換性ルートとして引き続き利用できます。PI が `openai-codex` 認証プロファイルとともに明示的に選択されている場合、OpenClaw は公開モデル参照を `openai/*` のまま維持し、内部ではレガシー Codex 認証トランスポート経由で PI をルーティングします。古い `openai-codex/*` モデル参照や、明示的な runtime 設定に由来しない古い PI セッション固定を修復するには、`openclaw doctor --fix` を実行してください。
</Note>

## OpenClaw の機能カバレッジ

| OpenAI の機能             | OpenClaw サーフェス                                             | 状態                                                   |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | `openai/<model>` モデルプロバイダー                               | はい                                                   |
| Codex サブスクリプションモデル | `openai/<model>` と `openai-codex` OAuth                          | はい                                                   |
| レガシー Codex モデル参照 | `openai-codex/<model>`                                            | doctor により `openai/<model>` へ修復                  |
| Codex app-server ハーネス  | runtime 省略または `agentRuntime.id: codex` を伴う `openai/<model>` | はい                                                   |
| サーバー側 Web 検索       | ネイティブ OpenAI Responses ツール                                | Web 検索が有効で、プロバイダーが固定されていない場合ははい |
| 画像                      | `image_generate`                                                  | はい                                                   |
| 動画                      | `video_generate`                                                  | はい                                                   |
| テキスト読み上げ          | `messages.tts.provider: "openai"` / `tts`                         | はい                                                   |
| バッチ音声テキスト化      | `tools.media.audio` / メディア理解                                | はい                                                   |
| ストリーミング音声テキスト化 | Voice Call `streaming.provider: "openai"`                         | はい                                                   |
| Realtime 音声             | Voice Call `realtime.provider: "openai"` / Control UI Talk        | はい                                                   |
| 埋め込み                  | メモリ埋め込みプロバイダー                                       | はい                                                   |

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

非対称の埋め込みラベルが必要な OpenAI 互換エンドポイントでは、`memorySearch` 配下に `queryInputType` と `documentInputType` を設定します。OpenClaw は、それらをプロバイダー固有の `input_type` リクエストフィールドとして転送します。クエリ埋め込みには `queryInputType`、インデックス済みメモリチャンクとバッチインデックス作成には `documentInputType` が使用されます。完全な例については、[メモリ設定リファレンス](/ja-JP/reference/memory-config#provider-specific-config) を参照してください。

## はじめに

希望する認証方法を選び、設定手順に従ってください。

<Tabs>
  <Tab title="API キー (OpenAI Platform)">
    **最適な用途:** 直接 API アクセスと使用量ベース課金。

    <Steps>
      <Step title="API キーを取得する">
        [OpenAI Platform ダッシュボード](https://platform.openai.com/api-keys) から API キーを作成またはコピーします。
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
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### ルート概要

    | モデル参照             | Runtime 設定             | ルート                      | 認証             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | 省略 / `agentRuntime.id: "codex"` | Codex app-server ハーネス | `openai-codex` プロファイル |
    | `openai/gpt-5.4-mini` | 省略 / `agentRuntime.id: "codex"` | Codex app-server ハーネス | `openai-codex` プロファイル |
    | `openai/gpt-5.5`      | `agentRuntime.id: "pi"`              | PI 埋め込み runtime      | `openai` プロファイルまたは選択した `openai-codex` プロファイル |

    <Note>
    `openai/*` エージェントモデルは Codex app-server ハーネスを使用します。エージェントモデルに API キー認証を使用するには、`openai-codex` API キープロファイルを作成し、`auth.order.openai-codex` で順序付けします。`OPENAI_API_KEY` は、エージェント以外の OpenAI API サーフェス向けの直接フォールバックとして残ります。
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

    `chat-latest` は移動エイリアスです。OpenAI はこれを ChatGPT で使用される最新の Instant モデルとして文書化しており、本番 API 利用には `gpt-5.5` を推奨しています。そのため、このエイリアスの挙動を明示的に必要としない限り、安定したデフォルトとして `openai/gpt-5.5` を維持してください。このエイリアスは現在 `medium` のテキスト詳細度のみを受け付けるため、OpenClaw はこのモデルについて互換性のない OpenAI テキスト詳細度オーバーライドを正規化します。

    <Warning>
    OpenClaw は **`openai/gpt-5.3-codex-spark` を公開していません**。実際の OpenAI API リクエストはそのモデルを拒否し、現在の Codex カタログでも公開されていません。
    </Warning>

  </Tab>

  <Tab title="Codex サブスクリプション">
    **最適な用途:** 別の API キーではなく、ChatGPT/Codex サブスクリプションをネイティブ Codex app-server 実行で使用する場合。Codex クラウドには ChatGPT サインインが必要です。

    <Steps>
      <Step title="Codex OAuth を実行する">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        または OAuth を直接実行します。

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        ヘッドレス環境やコールバックを扱いにくい設定では、localhost ブラウザーコールバックの代わりに ChatGPT device-code フローでサインインするため、`--device-code` を追加します。

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="正規の OpenAI モデルルートを使用する">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        既定のパスではランタイム設定は不要です。OpenAI エージェントターンは
        ネイティブ Codex アプリサーバーランタイムを自動的に選択し、OpenClaw は
        このルートが選ばれたときに、バンドルされた Codex Plugin をインストールまたは修復します。
      </Step>
      <Step title="Codex 認証が利用可能であることを確認する">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Gateway の実行後、チャットで `/codex status` または `/codex models` を送信して、
        ネイティブアプリサーバーランタイムを確認します。
      </Step>
    </Steps>

    ### ルート概要

    | モデル参照 | ランタイム設定 | ルート | 認証 |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | 省略 / `agentRuntime.id: "codex"` | ネイティブ Codex アプリサーバーハーネス | Codex サインインまたは選択済みの `openai-codex` プロファイル |
    | `openai/gpt-5.5` | `agentRuntime.id: "pi"` | 内部 Codex 認証トランスポートを備えた PI 埋め込みランタイム | 選択済みの `openai-codex` プロファイル |
    | `openai-codex/gpt-5.5` | doctor によって修復 | `openai/gpt-5.5` に書き換えられるレガシールート | 既存の `openai-codex` プロファイル |

    <Warning>
    古い `openai-codex/gpt-5.1*`、`openai-codex/gpt-5.2*`、または
    `openai-codex/gpt-5.3*` モデル参照を設定しないでください。ChatGPT/Codex OAuth アカウントは現在、
    これらのモデルを拒否します。`openai/gpt-5.5` を使用してください。OpenAI エージェントターンは現在、既定で Codex
    ランタイムを選択します。
    </Warning>

    <Note>
    認証/プロファイルコマンドでは `openai-codex` プロバイダー ID を引き続き使用してください。
    `openai-codex/*` モデルプレフィックスは、doctor によって修復されるレガシー設定です。
    一般的なサブスクリプションとネイティブランタイムのセットアップでは、`openai-codex` でサインインしますが、
    モデル参照は `openai/gpt-5.5` のままにしてください。
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

    <Note>
    オンボーディングは `~/.codex` から OAuth 情報をインポートしなくなりました。ブラウザー OAuth (既定) または上記のデバイスコードフローでサインインしてください。OpenClaw は生成された認証情報を独自のエージェント認証ストアで管理します。
    </Note>

    ### Codex OAuth ルーティングの確認と復旧

    次のコマンドを使用して、既定のエージェントが使用しているモデル、ランタイム、認証ルートを確認します。

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get agents.defaults.agentRuntime --json
    ```

    特定のエージェントの場合は、`--agent <id>` を追加します。

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    古い設定にまだ `openai-codex/gpt-*` がある場合、または明示的なランタイム設定なしに古い OpenAI PI
    セッションピンが残っている場合は、修復します。

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

    `openai-codex` は認証/プロファイルプロバイダー ID のままです。`openai/*` は
    Codex 経由の OpenAI エージェントターン用モデルルートです。

    ### ステータスインジケーター

    チャットの `/status` は、現在のセッションでどのモデルランタイムがアクティブかを表示します。
    バンドルされた Codex アプリサーバーハーネスは、OpenAI エージェントモデルターンでは
    `Runtime: OpenAI Codex` として表示されます。古い PI セッションピンは、設定で PI が明示的に固定されていない限り Codex に修復されます。

    ### Doctor 警告

    `openai-codex/*` ルートまたは古い OpenAI PI ピンが設定やセッション状態に残っている場合、
    `openclaw doctor --fix` は、PI が明示的に設定されていない限り、それらを Codex ランタイム付きの `openai/*` に書き換えます。

    ### コンテキストウィンドウ上限

    OpenClaw はモデルメタデータとランタイムコンテキスト上限を別々の値として扱います。

    Codex OAuth カタログ経由の `openai/gpt-5.5` の場合:

    - ネイティブ `contextWindow`: `1000000`
    - 既定のランタイム `contextTokens` 上限: `272000`

    小さい既定の上限は、実用上、レイテンシと品質の特性が優れています。`contextTokens` で上書きします。

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

    OpenClaw は、`gpt-5.5` が存在する場合、その upstream Codex カタログメタデータを使用します。
    アカウントが認証済みであるにもかかわらず、ライブ Codex 検出で `gpt-5.5` 行が省略される場合、
    OpenClaw はその OAuth モデル行を合成し、cron、サブエージェント、設定済みの既定モデル実行が
    `Unknown model` で失敗しないようにします。

  </Tab>
</Tabs>

## ネイティブ Codex アプリサーバー認証

ネイティブ Codex アプリサーバーハーネスは、`openai/*` モデル参照と省略された
ランタイム設定、または `agentRuntime.id: "codex"` を使用しますが、その認証は引き続き
アカウントベースです。OpenClaw は
次の順序で認証を選択します。

1. エージェントに紐付けられた明示的な OpenClaw `openai-codex` 認証プロファイル。
2. ローカル Codex CLI ChatGPT サインインなど、アプリサーバーの既存アカウント。
3. ローカル stdio アプリサーバー起動の場合のみ、アプリサーバーがアカウントなしと報告し、なお OpenAI 認証を必要とするときに、
   `CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

つまり、Gateway プロセスに直接 OpenAI モデルや埋め込み用の `OPENAI_API_KEY` もあるという理由だけで、
ローカル ChatGPT/Codex サブスクリプションのサインインが置き換えられることはありません。
環境変数 API キーのフォールバックは、ローカル stdio のアカウントなしパスに限られます。
WebSocket アプリサーバー接続には送信されません。サブスクリプション形式の Codex
プロファイルが選択されている場合、OpenClaw は生成された stdio アプリサーバー子プロセスからも `CODEX_API_KEY` と `OPENAI_API_KEY`
を除外し、選択された認証情報をアプリサーバーログイン RPC 経由で送信します。

## 画像生成

バンドルされた `openai` Plugin は、`image_generate` ツール経由で画像生成を登録します。
同じ `openai/gpt-image-2` モデル参照を通じて、OpenAI API キー画像生成と Codex OAuth 画像生成の両方をサポートします。

| 機能                | OpenAI API キー                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| モデル参照                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 認証                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth サインイン           |
| トランスポート                 | OpenAI Images API                  | Codex Responses バックエンド              |
| リクエストあたりの最大画像数    | 4                                  | 4                                    |
| 編集モード                 | 有効 (最大 5 枚の参照画像) | 有効 (最大 5 枚の参照画像)   |
| サイズ上書き            | 対応、2K/4K サイズを含む   | 対応、2K/4K サイズを含む     |
| アスペクト比 / 解像度 | OpenAI Images API に転送されません | 安全な場合、対応サイズにマッピングされます |

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

`gpt-image-2` は、OpenAI のテキストから画像生成と画像編集の両方の既定です。
`gpt-image-1.5`、`gpt-image-1`、`gpt-image-1-mini` は、明示的なモデル上書きとして引き続き使用できます。
透明背景の PNG/WebP 出力には `openai/gpt-image-1.5` を使用してください。現在の `gpt-image-2` API は
`background: "transparent"` を拒否します。

透明背景リクエストでは、エージェントは
`model: "openai/gpt-image-1.5"`、`outputFormat: "png"` または `"webp"`、および
`background: "transparent"` を指定して `image_generate` を呼び出す必要があります。古い `openai.background` プロバイダーオプションも
引き続き受け入れられます。OpenClaw は、既定の `openai/gpt-image-2` 透明リクエストを
`gpt-image-1.5` に書き換えることで、公開 OpenAI ルートと OpenAI Codex OAuth ルートも保護します。Azure とカスタム OpenAI 互換エンドポイントは、
設定されたデプロイメント/モデル名を維持します。

同じ設定はヘッドレス CLI 実行でも公開されています。

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

入力ファイルから開始する場合は、`openclaw infer image edit` で同じ `--output-format` と `--background`
フラグを使用します。
`--openai-background` は OpenAI 固有のエイリアスとして引き続き利用できます。

Codex OAuth インストールでは、同じ `openai/gpt-image-2` 参照を維持してください。
`openai-codex` OAuth プロファイルが設定されている場合、OpenClaw は保存された OAuth
アクセストークンを解決し、Codex Responses バックエンド経由で画像リクエストを送信します。
そのリクエストで最初に `OPENAI_API_KEY` を試したり、API キーへ暗黙にフォールバックしたりすることはありません。
代わりに直接 OpenAI Images API ルートを使用したい場合は、
API キー、カスタムベース URL、または Azure エンドポイントを使用して `models.providers.openai` を明示的に設定してください。
そのカスタム画像エンドポイントが信頼済み LAN/プライベートアドレス上にある場合は、
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` も設定してください。OpenClaw は、このオプトインがない限り、
プライベート/内部 OpenAI 互換画像エンドポイントをブロックしたままにします。

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
| 既定モデル    | `openai/sora-2`                                                                   |
| モード            | テキストから動画、画像から動画、単一動画編集                                  |
| 参照入力 | 1 枚の画像または 1 本の動画                                                                |
| サイズ上書き   | 対応                                                                         |
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

OpenClaw は、プロバイダーをまたぐ GPT-5 ファミリー実行に共有 GPT-5 プロンプト寄与を追加します。これはモデル ID によって適用されるため、`openai/gpt-5.5`、`openai-codex/gpt-5.5` などのレガシーの修復前参照、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5`、その他の互換 GPT-5 参照は同じオーバーレイを受け取ります。古い GPT-4.x モデルには適用されません。

バンドルされたネイティブ Codex ハーネスは、Codex アプリサーバー開発者指示を通じて同じ GPT-5 動作と Heartbeat オーバーレイを使用するため、`agentRuntime.id: "codex"` 経由に強制された `openai/gpt-5.x` セッションは、ハーネスプロンプトの残りを Codex が所有していても、同じフォロースルーとプロアクティブな Heartbeat ガイダンスを維持します。

GPT-5 のコントリビューションは、ペルソナの永続化、実行の安全性、ツール規律、出力形式、完了チェック、検証のためのタグ付き動作契約を追加します。チャンネル固有の返信とサイレントメッセージの動作は、共有 OpenClaw システムプロンプトと送信配信ポリシーに残ります。GPT-5 ガイダンスは、一致するモデルでは常に有効です。親しみやすいインタラクションスタイル層は別個で、設定可能です。

| 値                     | 効果                                             |
| ---------------------- | ------------------------------------------------ |
| `"friendly"` (デフォルト) | 親しみやすいインタラクションスタイル層を有効化 |
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
実行時には値の大文字と小文字は区別されないため、`"Off"` と `"off"` はどちらも親しみやすいスタイル層を無効にします。
</Tip>

<Note>
共有 `agents.defaults.promptOverlays.gpt5.personality` 設定が未設定の場合、レガシーの `plugins.entries.openai.config.personality` は互換性フォールバックとして引き続き読み取られます。
</Note>

## 音声と発話

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    バンドルされた `openai` plugin は、`messages.tts` サーフェス向けに音声合成を登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 音声 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | (未設定) |
    | 指示 | `messages.tts.providers.openai.instructions` | (未設定、`gpt-4o-mini-tts` のみ) |
    | 形式 | `messages.tts.providers.openai.responseFormat` | ボイスメモは `opus`、ファイルは `mp3` |
    | API キー | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` にフォールバック |
    | ベース URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 追加ボディ | `messages.tts.providers.openai.extraBody` / `extra_body` | (未設定) |

    利用可能なモデル: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`。利用可能な音声: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`。

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
    チャット API エンドポイントに影響を与えずに TTS ベース URL を上書きするには、`OPENAI_TTS_BASE_URL` を設定します。
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    バンドルされた `openai` plugin は、OpenClaw のメディア理解文字起こしサーフェスを通じて
    バッチ音声テキスト変換を登録します。

    - デフォルトモデル: `gpt-4o-transcribe`
    - エンドポイント: OpenAI REST `/v1/audio/transcriptions`
    - 入力パス: multipart 音声ファイルアップロード
    - Discord ボイスチャンネルセグメントやチャンネル音声添付を含め、
      inbound 音声文字起こしが `tools.media.audio` を使用する OpenClaw のすべての場所でサポート

    inbound 音声文字起こしで OpenAI を強制するには:

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
    バンドルされた `openai` plugin は、Voice Call plugin 向けにリアルタイム文字起こしを登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 言語 | `...openai.language` | (未設定) |
    | プロンプト | `...openai.prompt` | (未設定) |
    | 無音継続時間 | `...openai.silenceDurationMs` | `800` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | API キー | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    G.711 u-law (`g711_ulaw` / `audio/pcmu`) 音声で `wss://api.openai.com/v1/realtime` への WebSocket 接続を使用します。このストリーミングプロバイダーは Voice Call のリアルタイム文字起こしパス向けです。Discord 音声は現在、短いセグメントを録音し、代わりにバッチ `tools.media.audio` 文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    バンドルされた `openai` plugin は、Voice Call plugin 向けにリアルタイム音声を登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | 音声 | `...openai.voice` | `alloy` |
    | 温度 | `...openai.temperature` | `0.8` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | 無音継続時間 | `...openai.silenceDurationMs` | `500` |
    | API キー | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    バックエンドのリアルタイムブリッジ向けに、`azureEndpoint` と `azureDeployment` 設定キー経由で Azure OpenAI をサポートします。双方向ツール呼び出しをサポートします。G.711 u-law 音声形式を使用します。
    </Note>

    <Note>
    Control UI Talk は、Gateway が発行した短命クライアントシークレットと、
    OpenAI Realtime API に対する直接ブラウザー WebRTC SDP 交換を使って
    OpenAI ブラウザーリアルタイムセッションを使用します。メンテナーによるライブ検証は
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` で利用できます。
    OpenAI 側は Node でクライアントシークレットを発行し、偽のマイクメディアでブラウザー SDP オファーを生成し、
    OpenAI に投稿し、シークレットをログに出さずに SDP 応答を適用します。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI エンドポイント

バンドルされた `openai` プロバイダーは、ベース URL を上書きすることで、画像生成の対象を Azure OpenAI リソースにできます。画像生成パスでは、OpenClaw は `models.providers.openai.baseUrl` 上の Azure ホスト名を検出し、Azure のリクエスト形式に自動的に切り替えます。

<Note>
リアルタイム音声は別の設定パス
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
を使用し、`models.providers.openai.baseUrl` の影響を受けません。その Azure
設定については、[音声と発話](#voice-and-speech) の下にある **Realtime
voice** アコーディオンを参照してください。
</Note>

Azure OpenAI を使用する場合:

- Azure OpenAI サブスクリプション、クォータ、またはエンタープライズ契約をすでに持っている
- Azure が提供するリージョンのデータレジデンシーまたはコンプライアンス制御が必要
- 既存の Azure テナンシー内にトラフィックを維持したい

### 設定

バンドルされた `openai` プロバイダー経由で Azure 画像生成を行うには、
`models.providers.openai.baseUrl` を自分の Azure リソースに向け、`apiKey` を
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

OpenClaw は、Azure 画像生成ルートについて次の Azure ホストサフィックスを認識します。

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

認識された Azure ホスト上の画像生成リクエストでは、OpenClaw は次を行います。

- `Authorization: Bearer` の代わりに `api-key` ヘッダーを送信
- デプロイスコープのパス (`/openai/deployments/{deployment}/...`) を使用
- 各リクエストに `?api-version=...` を追加
- Azure 画像生成呼び出しに 600 秒のデフォルトリクエストタイムアウトを使用します。
  呼び出しごとの `timeoutMs` 値は引き続きこのデフォルトを上書きします。

その他のベース URL (公開 OpenAI、OpenAI 互換プロキシ) は、標準の
OpenAI 画像リクエスト形式を維持します。

<Note>
`openai` プロバイダーの画像生成パスで Azure ルーティングを使用するには、
OpenClaw 2026.4.22 以降が必要です。それ以前のバージョンは、カスタム
`openai.baseUrl` を公開 OpenAI エンドポイントと同様に扱うため、Azure
画像デプロイに対しては失敗します。
</Note>

### API バージョン

Azure 画像生成パスで特定の Azure プレビューまたは GA バージョンを固定するには、
`AZURE_OPENAI_API_VERSION` を設定します。

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

この変数が未設定の場合、デフォルトは `2024-12-01-preview` です。

### モデル名はデプロイ名

Azure OpenAI はモデルをデプロイにバインドします。バンドルされた `openai` プロバイダー経由でルーティングされる Azure 画像生成リクエストでは、OpenClaw の `model` フィールドは、公開 OpenAI モデル ID ではなく、Azure ポータルで設定した **Azure デプロイ名** である必要があります。

`gpt-image-2` を提供する `gpt-image-2-prod` というデプロイを作成した場合:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同じデプロイ名ルールは、バンドルされた `openai` プロバイダー経由でルーティングされる画像生成呼び出しにも適用されます。

### リージョンでの提供状況

Azure 画像生成は現在、一部のリージョンでのみ利用できます
(例: `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`)。デプロイを作成する前に Microsoft の最新リージョン一覧を確認し、
特定のモデルが自分のリージョンで提供されていることを確認してください。

### パラメーター差分

Azure OpenAI と公開 OpenAI は、常に同じ画像パラメーターを受け付けるわけではありません。
Azure は、公開 OpenAI が許可するオプション (たとえば `gpt-image-2` の特定の
`background` 値) を拒否する場合や、特定のモデルバージョンでのみ公開する場合があります。
これらの差分は Azure と基盤モデルに由来するもので、OpenClaw によるものではありません。
Azure リクエストが検証エラーで失敗する場合は、自分の特定のデプロイと API バージョンでサポートされるパラメーターセットを Azure ポータルで確認してください。

<Note>
Azure OpenAI はネイティブトランスポートと互換動作を使用しますが、
OpenClaw の隠し attribution ヘッダーは受け取りません。詳しくは
[高度な設定](#advanced-configuration) の下にある **Native vs OpenAI-compatible
routes** アコーディオンを参照してください。

Azure 上のチャットまたは Responses トラフィック (画像生成以外) には、
オンボーディングフローまたは専用の Azure プロバイダー設定を使用してください。
`openai.baseUrl` だけでは Azure API/認証形式は採用されません。別個の
`azure-openai-responses/*` プロバイダーが存在します。下の Server-side compaction
アコーディオンを参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw は `openai/*` に対して、SSE フォールバック (`"auto"`) 付きの WebSocket 優先を使用します。

    `"auto"` モードでは、OpenClaw は次を行います。
    - SSE にフォールバックする前に、初期の WebSocket 失敗を 1 回再試行
    - 失敗後、WebSocket を約 60 秒間 degraded としてマークし、クールダウン中は SSE を使用
    - 再試行と再接続のために安定したセッション ID とターン ID ヘッダーを付加
    - トランスポートバリアント間で使用量カウンター (`input_tokens` / `prompt_tokens`) を正規化

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
    - [WebSocket を使用する Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [ストリーミング API レスポンス (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket ウォームアップ">
    OpenClaw は、初回ターンのレイテンシを減らすために、`openai/*` で WebSocket ウォームアップをデフォルトで有効にします。

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
    OpenClaw は、`openai/*` 向けの共有高速モード切り替えを公開します。

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
    セッションのオーバーライドは設定より優先されます。Sessions UI でセッションのオーバーライドをクリアすると、そのセッションは設定済みのデフォルトに戻ります。
    </Note>

  </Accordion>

  <Accordion title="優先処理 (service_tier)">
    OpenAI の API は、`service_tier` を通じて優先処理を公開します。OpenClaw ではモデルごとに設定します。

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

  <Accordion title="サーバー側 Compaction (Responses API)">
    直接の OpenAI Responses モデル（`api.openai.com` 上の `openai/*`）では、OpenAI Plugin の Pi ハーネスストリームラッパーがサーバー側 Compaction を自動的に有効にします。

    - `store: true` を強制します（モデル互換設定で `supportsStore: false` が設定されている場合を除く）
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` を注入します
    - デフォルトの `compact_threshold`: `contextWindow` の 70%（利用できない場合は `80000`）

    これは組み込みの Pi ハーネスパスと、埋め込み実行で使われる OpenAI プロバイダーフックに適用されます。ネイティブ Codex アプリサーバーハーネスは Codex を通じて独自のコンテキストを管理し、`agents.defaults.agentRuntime.id` で別途設定されます。

    <Tabs>
      <Tab title="明示的に有効化">
        Azure OpenAI Responses のような互換エンドポイントで便利です。

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

  <Accordion title="厳格なエージェント型 GPT モード">
    `openai/*` 上の GPT-5 ファミリーの実行では、OpenClaw はより厳格な埋め込み実行契約を使用できます。

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
    - そのターンを、今すぐ行動するよう誘導して再試行します
    -  substantial な作業では `update_plan` を自動的に有効にします
    - モデルが行動せずに計画し続ける場合、明示的なブロック状態を表示します

    <Note>
    OpenAI と Codex の GPT-5 ファミリーの実行のみにスコープされます。他のプロバイダーと古いモデルファミリーはデフォルトの動作を維持します。
    </Note>

  </Accordion>

  <Accordion title="ネイティブと OpenAI 互換ルート">
    OpenClaw は、直接の OpenAI、Codex、Azure OpenAI エンドポイントを、汎用の OpenAI 互換 `/v1` プロキシとは異なるものとして扱います。

    **ネイティブルート**（`openai/*`、Azure OpenAI）:
    - OpenAI の `none` effort をサポートするモデルでのみ `reasoning: { effort: "none" }` を保持します
    - `reasoning.effort: "none"` を拒否するモデルやプロキシでは、無効化された reasoning を省略します
    - ツールスキーマのデフォルトを厳格モードにします
    - 検証済みのネイティブホストでのみ、隠し attribution ヘッダーを添付します
    - OpenAI 専用のリクエスト整形（`service_tier`、`store`、reasoning 互換、プロンプトキャッシュヒント）を保持します

    **プロキシ/互換ルート:**
    - より緩い互換動作を使用します
    - 非ネイティブの `openai-completions` ペイロードから Completions の `store` を取り除きます
    - OpenAI 互換 Completions プロキシ向けに、高度な `params.extra_body`/`params.extraBody` パススルー JSON を受け入れます
    - vLLM などの OpenAI 互換 Completions プロキシ向けに `params.chat_template_kwargs` を受け入れます
    - 厳格なツールスキーマやネイティブ専用ヘッダーを強制しません

    Azure OpenAI はネイティブトランスポートと互換動作を使用しますが、隠し attribution ヘッダーは受け取りません。

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
