---
read_when:
    - OpenClaw で OpenAI モデルを使用する場合
    - API キーではなく Codex サブスクリプション認証を使用する場合
    - より厳密な GPT-5 エージェント実行動作が必要です
summary: OpenClaw で API キーまたは Codex サブスクリプションを使用して OpenAI を利用する
title: OpenAI
x-i18n:
    generated_at: "2026-07-16T12:01:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 18efddc44f2b06ae9592cdbc01c0aadc4621ddf99e818793a4d835c741a2464e
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw は、直接 API キー認証と
ChatGPT/Codex サブスクリプション認証の両方に、単一のプロバイダー ID `openai` を使用します。`openai/*` は正規のモデルルートです。
ランタイムポリシーが未設定または `auto` の埋め込みエージェントターンでは、OpenAI のルート情報により、OpenClaw がバンドル済みの Codex app-server ランタイムを暗黙的に選択できるかどうかが決まります。
`openai/*` プレフィックスだけではランタイムは選択されません。

- **エージェントモデル** - 明示的な
  `agentRuntime` 設定または OpenAI の暗黙的なルートポリシーによって選択されたランタイムを通じて `openai/*` を使用します。ChatGPT/Codex サブスクリプションを使用する場合は Codex
  認証でサインインし、キーに基づく課金を使用する場合は API キー認証
  プロファイルを設定します。
- **エージェント以外の OpenAI API** - `OPENAI_API_KEY` または `openai` API キー認証プロファイルを通じた、使用量に応じて課金される OpenAI Platform への直接アクセスです。
- **レガシー設定** - `codex/*` および `openai-codex/*` の参照は、
  `openclaw doctor --fix` によって `openai/*` とモデルスコープの `agentRuntime.id: "codex"` に修復されます。

OpenAI は、OpenClaw のような外部ツールやワークフローでのサブスクリプション OAuth の使用を明示的にサポートしています。

## 使用量とコストの追跡

OpenClaw は、サブスクリプションのクォータと Platform API の課金を個別に扱います。

- ChatGPT/Codex OAuth には、サブスクリプションプラン、クォータ期間、クレジット残高が表示されます。
- `OPENAI_ADMIN_KEY` には、プロバイダーから報告された過去 30 日間の組織コストと補完の使用量が Control UI の **使用量** に表示されます。これには、日ごとの支出、リクエスト数とトークン数の合計、上位モデル、コストカテゴリが含まれます。
- `OPENAI_PROJECT_ID` を使用すると、Admin API の履歴を必要に応じて 1 つのプロジェクトに限定できます。
- OpenClaw が `OPENAI_API_KEY` または `openai` 推論プロファイルを組織 API に送信することはありません。これらの認証情報は、カスタム、Azure、またはエージェントローカルのエンドポイントに属している可能性があります。

明示的な Admin キーは OAuth より優先されます。プロバイダーから報告された履歴は、OpenClaw がセッションから算出した推定コストとは統合されません。この履歴には、他のクライアントによる API アクティビティやプロバイダー側の課金調整が含まれる場合があります。

OpenAI の [API 使用量ダッシュボード](https://help.openai.com/en/articles/10478918)のドキュメントでは、使用量データに必要な組織所有者権限と明示的な Usage Dashboard 権限について説明しています。

プロバイダー、モデル、ランタイム、チャンネルは別々のレイヤーです。これらのラベルが混同されている場合は、設定を変更する前に[エージェントランタイム](/ja-JP/concepts/agent-runtimes)を参照してください。

## クイック選択

| 目的                                              | 使用                                                                | 注記                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| ChatGPT/Codex サブスクリプション、ネイティブ Codex ランタイム  | `openai/gpt-5.6-sol`                                               | 新規サブスクリプション設定。Codex 認証でサインインします。                  |
| エージェントターンを直接 API キーで課金            | `openai/gpt-5.6` と順序付き API キー認証プロファイル              | 新規 API キー設定。直接 API の基本 ID は Sol に解決されます。        |
| GPT-5.6 の正確なティアを選択                      | `openai/gpt-5.6-sol`、`-terra`、または `-luna`                         | このアカウントで利用可能なティアは `models list` で確認します。        |
| GPT-5.6 にアクセスできないアカウント                    | `openai/gpt-5.5`                                                   | 明示的な復旧選択。OpenClaw は暗黙的にダウングレードしません。     |
| 直接 API キー課金、明示的な OpenClaw ランタイム | `openai/gpt-5.6` とプロバイダー/モデル `agentRuntime.id: "openclaw"` | 通常の `openai` API キープロファイルを選択します。                           |
| 最新の ChatGPT Instant モデルエイリアス                | `openai/chat-latest`                                               | 直接 API キー専用。固定されたデフォルトではなく、移動するエイリアスです。          |
| 画像の生成または編集                       | `openai/gpt-image-2`                                               | `OPENAI_API_KEY` または Codex OAuth で動作します。                         |
| 背景が透明な画像                     | `openai/gpt-image-1.5`                                             | `outputFormat` を `png` または `webp` に設定し、`background=transparent` を指定します。 |

## 名前の対応表

| 表示される名前                            | レイヤー             | 意味                                                                                  |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | プロバイダープレフィックス   | 正規の OpenAI モデルルート。ルート情報によって暗黙的なランタイムが決まります。                |
| `codex` Plugin                          | Plugin            | ネイティブ Codex app-server ランタイムと `/codex` チャットコントロールを提供するバンドル済み Plugin。 |
| プロバイダー/モデル `agentRuntime.id: codex` | エージェントランタイム     | 一致する埋め込みターンにネイティブ Codex app-server ハーネスを強制します。                   |
| `/codex ...`                            | チャットコマンドセット  | 会話から Codex app-server スレッドをバインドおよび制御します。                               |
| `runtime: "acp", agentId: "codex"`      | ACP セッションルート | ACP/acpx を介して Codex を実行する明示的なフォールバックパス。                                 |

## 暗黙的なエージェントランタイム

プロバイダー/モデルの `agentRuntime` ポリシーが未設定または `auto` の場合、OpenAI が所有するプロバイダールートポリシーは、有効なエンドポイントとアダプターから暗黙的なランタイムを選択します。

| 有効なルート情報                                                                                                                                                  | 暗黙的なランタイム      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `openai-responses` を使用する正確な公式 Platform HTTPS エンドポイント、または `openai-chatgpt-responses` を使用する正確な公式 ChatGPT HTTPS エンドポイント。作成されたリクエストオーバーライドなし | Codex が選択される可能性があります |
| 作成された `openai-completions` アダプター                                                                                                                                  | OpenClaw              |
| カスタムエンドポイント                                                                                                                                                        | OpenClaw              |
| HTTP を使用する明示的かつ正確な公式エンドポイント                                                                                                                            | 拒否              |
| 作成されたプロバイダー/モデルのリクエストオーバーライドを含むルート                                                                                                                 | OpenClaw              |

明示的な非デフォルトのプロバイダー/モデル `agentRuntime.id` が引き続き優先されます。
たとえば、`agentRuntime.id: "openclaw"` は、通常なら Codex を使用できるルートを OpenClaw に維持します。一方、`agentRuntime.id: "codex"` は Codex を必須とし、有効なルートが Codex 互換として宣言されていない場合はフェイルクローズします。
ランタイムの選択によって認証情報の種類や課金が変わることはありません。Platform API キー認証と ChatGPT/Codex サブスクリプション認証は引き続き区別されます。

`openclaw doctor --fix` は、レガシーな `codex/*` および `openai-codex/*` のモデル参照、レガシーな Codex 認証プロファイル ID、レガシーな Codex 認証順序エントリを正規の `openai` ルートに移行します。移行されたモデル参照には、モデルスコープの `agentRuntime.id: "codex"` が付与されます。新しい認証順序設定には `auth.order.openai` を使用してください。

<Note>
新規の OpenAI 設定では、プライマリモデルが設定されていない場合にのみ GPT-5.6 がプライマリとして適用されます。OpenAI 認証を追加または更新しても、`openai/gpt-5.5` を含む既存の明示的な選択は維持されます。ただし、`models auth login --set-default` または `models set` を明示的に使用した場合を除きます。エージェントモデルに API キー認証を使用する場合にのみ、API キー認証プロファイルを使用してください。
</Note>

## GPT-5.6 限定プレビュー

OpenClaw は、正確な `openai/gpt-5.6-sol`、`openai/gpt-5.6-terra`、`openai/gpt-5.6-luna` モデル ID を認識します。現在のカタログでは、3 つすべてが `xhigh` および `max` 推論を提供します。OpenAI は、Sol をフラッグシップティア、Terra をバランス型ティア、Luna を高速かつ低コストのティアと説明しています。[GPT-5.6 リリース発表](https://openai.com/index/previewing-gpt-5-6-sol/)および[アクセスガイド](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna)を参照してください。

OpenAI API キーによる直接認証では、基本の `openai/gpt-5.6` ID は Sol のエイリアスであり、新規設定のデフォルトです。ネイティブ Codex カタログでは、その直接 API エイリアスをクライアント側で適用しません。ワークスペースのアクセス権限に応じて、正確な Sol、Terra、Luna の ID が表示される場合があります。そのため、新規の ChatGPT/Codex OAuth 設定では `openai/gpt-5.6-sol` を使用します。現在のアカウントを次のコマンドで確認してください。

```bash
openclaw models list --provider openai
```

API 組織と Codex ワークスペースのアクセス権限は異なる場合があります。GPT-5.6 が利用できない場合は、GPT-5.5 を明示的に選択してください。

```bash
openclaw models set openai/gpt-5.5
```

OpenClaw はアップストリームのアクセスエラーを表示し、GPT-5.6 の選択を暗黙的に GPT-5.5 に置き換えることはありません。

<Note>
対象となる正確な公式 HTTPS ルートでは、ランタイムポリシーが未設定または `auto` の場合、バンドル済みの Codex app-server Plugin が選択される可能性があります。作成された Completions ルート、カスタムエンドポイント、リクエストトランスポートのオーバーライドは OpenClaw のままです。平文の公式 HTTP エンドポイントは拒否されます。明示的なプロバイダー/モデルのランタイム設定が引き続き優先されます。古いレガシー Codex モデル参照、`codex-cli/*` 参照、または明示的なランタイム設定によって設定されたものではない古いランタイムセッション固定を修復するには、`openclaw doctor --fix` を実行してください。
</Note>

## OpenClaw の機能対応範囲

| OpenAI の機能         | OpenClaw の提供面                                                                              | 状態                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| チャット / Responses          | `openai/<model>` モデルプロバイダー                                                               | 対応                                                             |
| Codex サブスクリプションモデル | OpenAI OAuth を使用する `openai/<model>`                                                            | 対応                                                             |
| レガシー Codex モデル参照   | 古い Codex モデル参照、`codex-cli/<model>`                                                     | doctor により `openai/<model>` に修復                          |
| Codex app-server ハーネス  | ランタイムが未設定または `auto` の Codex 互換 HTTPS ルート、または明示的な `agentRuntime.id: codex`  | 対応                                                             |
| サーバー側ウェブ検索    | OpenAI Responses ネイティブツール                                                                  | ウェブ検索が有効で、ほかのプロバイダーが固定されていない場合に対応 |
| 画像                    | `image_generate`                                                                              | 対応                                                             |
| 動画                    | `video_generate`                                                                              | 対応                                                             |
| テキスト読み上げ            | `messages.tts.provider: "openai"` / `tts`                                                     | 対応                                                             |
| バッチ音声文字起こし      | `tools.media.audio` / メディア理解                                                     | 対応                                                             |
| ストリーミング音声文字起こし  | Voice Call `streaming.provider: "openai"`                                                     | 対応                                                             |
| リアルタイム音声            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | 対応（OpenAI Platform API キー）                                   |
| 埋め込み                | メモリ埋め込みプロバイダー                                                                     | 対応                                                             |

<Note>
OpenAI Realtime 音声は、公開 **OpenAI Platform Realtime
API** を経由し、Platform API キーが必要です。一方、Codex OAuth トークンは
ChatGPT Codex バックエンドを認証するものであり、公開 Realtime エンドポイント用の
Platform API キーと相互に置き換えることはできません。

API キー認証で課金設定がないと報告される場合は、API キー認証の使用時に、
リアルタイム認証情報を管理する組織の Platform クレジットを
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
で追加してください。Realtime 音声では、`openclaw onboard --auth-choice openai-api-key` により作成された
`openai` API キー認証プロファイル、Control UI Talk 用に
`talk.realtime.providers.openai.apiKey` で設定された Platform API キー、Voice
Call 用の `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`、または
`OPENAI_API_KEY` 環境変数を使用できます。
</Note>

## メモリ埋め込み

OpenClaw は、`memory_search` のインデックス作成とクエリ埋め込みに、
OpenAI または OpenAI 互換の埋め込みエンドポイントを使用できます。

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

非対称の埋め込みラベルを必要とする OpenAI 互換エンドポイントでは、
`memorySearch` の下に `queryInputType` と `documentInputType` を設定します。OpenClaw は
これらをプロバイダー固有の `input_type` リクエストフィールドとして転送します。クエリ
埋め込みでは `queryInputType` を使用し、インデックス化されたメモリチャンクとバッチインデックス作成では
`documentInputType` を使用します。完全な例については、
[メモリ設定リファレンス](/ja-JP/reference/memory-config#provider-specific-config)
を参照してください。

## はじめに

<Tabs>
  <Tab title="API キー（OpenAI Platform）">
    **最適な用途：** API への直接アクセスと従量制課金。

    <Steps>
      <Step title="API キーを取得する">
        [OpenAI Platform ダッシュボード](https://platform.openai.com/api-keys)で API キーを作成またはコピーします。
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

    ### ルートの概要

    | モデル参照        | ランタイムポリシーまたはルートの詳細                                 | ルート                     | 認証                              |
    | ---------------- | ------------------------------------------------------------- | ------------------------- | --------------------------------- |
    | `openai/gpt-5.6` | 未設定 / `auto`、公式の完全一致する HTTPS ネイティブルート、リクエストによる上書きなし | Codex を選択可能     | 順序付けされた API キー認証プロファイル      |
    | `openai/gpt-5.6` | プロバイダー / モデル `agentRuntime.id: "openclaw"`                  | OpenClaw 組み込みランタイム | 選択された `openai` API キープロファイル |
    | `openai/gpt-5.5` | 明示的なプロバイダー / モデル `agentRuntime.id`                     | 選択されたエージェントランタイム    | 選択された OpenAI API キープロファイル   |
    | `openai/*`       | 明示指定された Completions、カスタム、またはリクエストによる上書き | OpenClaw 組み込みランタイム | 認証情報の種類は変更されない |
    | `openai/*`       | 平文の公式 HTTP エンドポイント                  | 拒否                 | 認証情報は送信されない             |

    <Note>
    ランタイムが未設定または `auto` の場合、条件を満たす公式の完全一致する HTTPS ネイティブ
    ルートのみが、Codex app-server ハーネスを暗黙的に選択できます。エージェントモデルで API キー認証を
    使用するには、`openai` API キー認証プロファイルを作成し、
    `auth.order.openai` で順序を設定します。`OPENAI_API_KEY` は、
    エージェント以外の OpenAI API 提供面で直接使用するフォールバックとして残ります。古い
    レガシー Codex 認証順序エントリを移行するには、`openclaw doctor --fix` を実行してください。
    </Note>

    ### 設定例

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
    }
    ```

    装飾なしの直接 API `gpt-5.6` ID は Sol ティアに解決されます。この API
    組織で GPT-5.6 が提供されていない場合は、プライマリを
    `openai/gpt-5.5` に明示的に設定してください。

    OpenAI API から ChatGPT の現在の Instant モデルを試すには、モデルを
    `openai/chat-latest` に設定します。

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` は変動するエイリアスです。新規の OpenAI API キーセットアップでは、代わりに
    `openai/gpt-5.6` が使用され、その装飾なしの直接 API ID は Sol に解決されます。
    `openai/gpt-5.5` を含む既存の明示的なプライマリは変更されません。
    `chat-latest` エイリアスが受け付けるテキスト詳細度は `medium` のみです。OpenClaw は
    このモデルでそれ以外の詳細度が要求された場合、`medium` を強制します。

    <Warning>
    OpenClaw は、直接の OpenAI API キールートで `gpt-5.3-codex-spark` を公開
    **しません**。サインイン済みアカウントで提供されている場合に限り、Codex サブスクリプションのカタログ
    エントリを通じて利用できます。
    </Warning>

  </Tab>

  <Tab title="Codex サブスクリプション">
    **最適な用途：** 別の API キーではなく、ChatGPT/Codex サブスクリプションを使用してネイティブ Codex
    app-server を実行する場合。Codex cloud には
    ChatGPT へのサインインが必要です。

    <Steps>
      <Step title="Codex OAuth を実行する">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        または、OAuth を直接実行します。

        ```bash
        openclaw models auth login --provider openai
        ```

        ヘッドレス環境やコールバックを利用しにくいセットアップでは、`--device-code` を追加して、
        localhost のブラウザーコールバックではなく ChatGPT のデバイスコードフローで
        サインインします。

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="正規の OpenAI モデルルートを使用する">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.6-sol
        ```

        この公式の完全一致する HTTPS ネイティブルートには、ランタイム設定は不要です。
        Codex app-server ランタイムが自動的に選択される場合があり、そのランタイムが
        選択されると、OpenClaw はバンドル済み Codex Plugin をインストールまたは修復します。
      </Step>
      <Step title="Codex 認証が利用可能であることを確認する">
        ```bash
        openclaw models list --provider openai
        ```

        Gateway の実行後、ネイティブ app-server ランタイムを確認するには、チャットで
        `/codex status` または `/codex models` を送信します。
      </Step>
    </Steps>

    ### ルートの概要

    | モデル参照                | ランタイムポリシーまたはルートの詳細                                 | ルート                                                    | 認証                                               |
    | ------------------------ | ------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.6-sol`     | 未設定 / `auto`、公式の完全一致する HTTPS ネイティブルート、リクエストによる上書きなし | Codex を選択可能                                    | Codex サインイン、または順序付けされた `openai` 認証プロファイル |
    | `openai/gpt-5.6-terra`   | 未設定 / `auto`、公式の完全一致する HTTPS ネイティブルート、リクエストによる上書きなし | Codex を選択可能                                    | カタログで Terra が提供されている場合の Codex サインイン       |
    | `openai/gpt-5.6-luna`    | 未設定 / `auto`、公式の完全一致する HTTPS ネイティブルート、リクエストによる上書きなし | Codex を選択可能                                    | カタログで Luna が提供されている場合の Codex サインイン        |
    | `openai/gpt-5.6-sol`     | プロバイダー / モデル `agentRuntime.id: "openclaw"`                  | OpenClaw 組み込みランタイム、内部 Codex 認証トランスポート | 選択された `openai` OAuth プロファイル                    |
    | `openai/gpt-5.5`         | 明示的なプロバイダー / モデル `agentRuntime.id`                     | 選択されたエージェントランタイム                                   | 選択された OpenAI 認証プロファイル                       |
    | `openai/*`               | 明示指定された Completions、カスタム、またはリクエストによる上書き | OpenClaw 組み込みランタイム                                | 認証情報の要件はルート固有のまま      |
    | `openai/*`               | 平文の公式 HTTP エンドポイント                  | 拒否                                                 | 認証情報は送信されない                              |
    | レガシー Codex GPT-5.5 参照 | doctor により修復                                            | `openai/gpt-5.5` に書き換え                            | 移行済み OpenAI OAuth プロファイル                      |
    | `codex-cli/gpt-5.5`      | doctor により修復                                            | `openai/gpt-5.5` に書き換え                            | Codex app-server 認証                              |

    <Warning>
    新しいサブスクリプションベースのセットアップでは、正確な `openai/gpt-5.6-sol` を使用します。
    ネイティブ Codex カタログでは、正確な Terra または Luna の参照も公開される場合があります。
    アカウントで GPT-5.6 が公開されていない場合は、`openai/gpt-5.5` を明示的に選択してください。以前の
    Codex GPT 参照は従来の OpenClaw ルートであり、ネイティブ Codex ランタイムの
    パスではありません。既存の明示的な GPT-5.5 の選択をアップグレードせずに
    移行するには、`openclaw doctor --fix` を実行してください。`gpt-5.3-codex-spark` は引き続き、
    Codex サブスクリプションカタログでこれが提示されるアカウントに
    限定されます。これに対する直接の OpenAI API キーおよび Azure の参照は引き続き表示されません。
    </Warning>

    <Note>
    新しい設定では、OpenAI エージェントの認証順序を `auth.order.openai` の下に配置してください。
    doctor は以前の従来型 Codex 認証順序エントリを移行します。
    </Note>

    ### 設定例

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
    }
    ```

    API キーのバックアップを使用する場合は、選択したモデルを `openai/*` の下に保持し、
    認証順序を `openai` の下に配置してください。OpenClaw は Codex ハーネスを維持したまま、
    最初にサブスクリプションを試し、次に API キーを試します。

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
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
    オンボーディングでは、`~/.codex` から OAuth 情報をインポートしなくなりました。ブラウザー
    OAuth（デフォルト）または上記のデバイスコードフローでサインインしてください。OpenClaw は、
    生成された認証情報を独自のエージェント認証ストアで管理します。
    </Note>

    ### Codex OAuth ルーティングの確認と復旧

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

    古い設定に従来の Codex GPT 参照がまだ含まれている場合、または明示的なランタイム設定がないまま
    古い OpenAI ランタイムセッションの固定指定が残っている場合は、修復します。

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    `models auth list --provider openai` に使用可能なプロファイルが表示されない場合は、再度
    サインインします。

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    同じエージェントで複数の Codex OAuth ログインを使用するには `--profile-id` を使用し、
    認証順序または `/model ...@<profileId>` で制御します。

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    プロファイルの順序に依存する前に、`openclaw doctor --fix` を実行して、以前の従来型 OpenAI Codex プレフィックスの
    プロファイル ID と順序エントリを移行してください。

    ### ステータスインジケーター

    チャットの `/status` には、現在のセッションでどのモデルランタイムが有効かが表示されます。
    バンドルされた Codex app-server ハーネスは、対象となる暗黙的なルートまたは明示的な
    プロバイダー／モデルのランタイムポリシーによって選択された場合、
    `Runtime: OpenAI Codex` として表示されます。

    ### Doctor の警告

    従来の Codex モデル参照または古い OpenAI ランタイムの固定指定が設定や
    セッション状態に残っている場合、OpenClaw が明示的に設定されていない限り、
    `openclaw doctor --fix` はそれらを Codex ランタイムを使用する `openai/*` に書き換えます。

    ### コンテキストウィンドウの上限

    OpenClaw は、モデルメタデータとランタイムコンテキストの上限を別々の
    値として扱います。Codex OAuth カタログ経由の `openai/gpt-5.5` では次のとおりです。

    - ネイティブ `contextWindow`: `400000`
    - デフォルトのランタイム `contextTokens` 上限: `272000`

    実際には、小さいデフォルト上限のほうがレイテンシーと品質の特性に優れています。
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
    ネイティブモデルのメタデータを宣言するには `contextWindow` を使用します。ランタイムの
    コンテキスト予算を制限するには `contextTokens` を使用します。直接の OpenAI API キールートでは、
    `gpt-5.5` に対して、より大きなネイティブ `contextWindow`（`1000000`）が
    報告されます。上流のカタログが異なるため、2 つのルートは個別に追跡されます。
    </Note>

    ### カタログの復旧

    OpenClaw は、`gpt-5.5` の上流 Codex カタログメタデータが存在する場合にそれを使用します。
    アカウントが認証済みであるにもかかわらず、Codex のライブ検出で `gpt-5.5` の行が省略された場合、
    OpenClaw はその OAuth モデル行を合成し、Cron、サブエージェント、および設定された
    デフォルトモデルの実行が `Unknown model` で失敗しないようにします。

  </Tab>
</Tabs>

## ネイティブ Codex app-server の認証

ネイティブ Codex app-server ハーネスは、対象となる正確な公式 HTTPS ルートによって暗黙的に選択された場合、
またはプロバイダー／モデルの `agentRuntime.id: "codex"` によって明示的に選択された場合に、
`openai/*` モデル参照を使用します。認証は引き続きアカウントベースです。
OpenClaw は次の順序で認証を選択します。

1. エージェント用に順序付けされた OpenAI 認証プロファイル。`auth.order.openai` の下に配置することが推奨されます。
   以前の従来型 Codex 認証プロファイル ID と認証順序を移行するには、`openclaw doctor --fix` を実行します。
2. ローカルの Codex CLI ChatGPT サインインなど、app-server の既存アカウント。
   デフォルトの分離されたエージェントホームでは、OpenClaw はそのネイティブ CLI アカウントを
   ログイン RPC 経由で app-server に橋渡しします。CLI の設定、Plugin、スレッドストアは共有しません。
3. ローカル stdio app-server の起動時に限り、かつ app-server がアカウントなしと
   報告した場合に限り、`CODEX_API_KEY`、次に `OPENAI_API_KEY`。

Gateway プロセスに直接 OpenAI モデルまたは埋め込み用の `OPENAI_API_KEY` も存在するというだけで、
ローカルの ChatGPT/Codex サブスクリプションサインインが置き換えられることはありません。
環境変数の API キーフォールバックは、ローカル stdio のアカウントなしパスにのみ適用され、
WebSocket app-server 接続経由で送信されることはありません。サブスクリプション形式の
Codex プロファイルが選択されると、OpenClaw は生成した stdio app-server の子プロセスから
`CODEX_API_KEY` と `OPENAI_API_KEY` も除外し、代わりに選択した認証情報を
app-server のログイン RPC 経由で送信します。

そのサブスクリプションプロファイルが Codex の使用量制限によってブロックされると、OpenClaw は
Codex が提示したリセット時刻までプロファイルをブロック済みとしてマークし、選択したモデルを変更したり
Codex ハーネスから離脱したりせずに、認証順序によって次の `openai:*` プロファイルへ
切り替えられるようにします。リセット時刻を過ぎると、サブスクリプションプロファイルは再び使用可能になります。

## 画像生成

バンドルされた `openai` Plugin は、`image_generate` ツールを通じて画像生成を登録します。
同じ `openai/gpt-image-2` モデル参照を通じて、OpenAI API キーと Codex OAuth の両方による
画像生成をサポートします。

| 機能                      | OpenAI API キー                      | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| モデル参照                | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 認証                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth サインイン         |
| トランスポート            | OpenAI Images API                  | Codex Responses バックエンド          |
| リクエストあたりの最大画像数 | 4                                  | 4                                    |
| 編集モード                | 有効（最大 5 枚の参照画像）          | 有効（最大 5 枚の参照画像）            |
| サイズの上書き            | 2K/4K サイズを含めてサポート         | 2K/4K サイズを含めてサポート           |
| アスペクト比／解像度       | OpenAI Images API には転送されない   | 安全な場合はサポートされるサイズにマッピング |

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
共通ツールのパラメーター、プロバイダーの選択、フェイルオーバー動作については、
[画像生成](/ja-JP/tools/image-generation)を参照してください。
</Note>

`gpt-image-2` は、OpenAI のテキストからの画像生成および画像編集のデフォルトです。
`gpt-image-1.5`、`gpt-image-1`、`gpt-image-1-mini` は、引き続き明示的な
モデルの上書きとして使用できます。透明背景の PNG/WebP 出力には `openai/gpt-image-1.5` を使用してください。
現在の `gpt-image-2` API は `background: "transparent"` を拒否します。

透明背景をリクエストするには、`model: "openai/gpt-image-1.5"`、`outputFormat: "png"` または `"webp"`、
および `background: "transparent"` を指定して `image_generate` を呼び出します。
以前の `openai.background` プロバイダーオプションも引き続き受け付けられます。
OpenClaw は、デフォルトの `openai/gpt-image-2` 透明リクエストを `gpt-image-1.5` に
書き換えることで、公開 OpenAI および OpenAI Codex OAuth ルートも保護します。
Azure およびカスタム OpenAI 互換エンドポイントでは、設定されたデプロイメント名／モデル名が維持されます。

同じ設定は、ヘッドレス CLI 実行でも利用できます。

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

入力ファイルから開始する場合は、`openclaw infer image edit` で同じ `--output-format` および
`--background` フラグを使用します。`--openai-background` は、OpenAI 固有のエイリアスとして
引き続き利用できます。OpenAI Images の品質とコストを制御するには `--quality low|medium|high|auto` を使用します。
`image generate` または `image edit` から OpenAI のモデレーションヒントを渡すには、
`--openai-moderation low|auto` を使用します。

ChatGPT/Codex OAuth のインストールでは、同じ `openai/gpt-image-2` 参照を維持してください。
`openai` OAuth プロファイルが設定されている場合、OpenClaw は保存された OAuth
アクセストークンを解決し、Codex Responses バックエンド経由で画像リクエストを送信します。
最初に `OPENAI_API_KEY` を試したり、暗黙的に API キーへフォールバックしたりすることはありません。
代わりに直接 OpenAI Images API ルートを使用する場合は、API キー、カスタムベース URL、
または Azure エンドポイントを指定して `models.providers.openai` を明示的に設定します。
そのカスタム画像エンドポイントが信頼済み LAN／プライベートアドレスにある場合は、
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` も設定してください。このオプトインがない限り、OpenClaw は
プライベート／内部 OpenAI 互換画像エンドポイントをブロックしたままにします。

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
| モード           | テキストから動画、画像から動画、単一動画の編集                                     |
| 参照入力         | 画像 1 枚または動画 1 本                                                           |
| サイズの上書き   | テキストから動画および画像から動画でサポート                                       |
| アスペクト比     | 生の値のまま転送せず、最も近いサポート対象サイズに変換                             |
| その他の上書き   | `resolution`、`audio`、`watermark` はサポートされず、ツールの警告とともに破棄 |

OpenAI の画像から動画へのリクエストでは、画像
`input_reference` とともに `POST /v1/videos` を使用します。単一動画の編集では、
アップロードした動画を `video` フィールドに指定して `POST /v1/videos/edits` を使用します。

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
共通ツールのパラメータ、プロバイダーの選択、フェイルオーバーの動作については、[動画生成](/ja-JP/tools/video-generation)を参照してください。

OpenAI プロバイダーは `supportsSize` を宣言しますが、`supportsAspectRatio` と
`supportsResolution` は宣言しません。OpenClaw の共通正規化レイヤーは、リクエストされた
`aspectRatio` を、リクエストがプロバイダーに到達する前に最も近い OpenAI `size` に変換するため、アスペクト比のリクエストは通常そのまま機能します。
`resolution` にはサイズのフォールバックがないため破棄され、呼び出し元には
`Ignored unsupported overrides for openai/<model>: resolution=<value>` として通知されます。
</Note>

## GPT-5 プロンプトへの追加

OpenClaw は、`openai` プロバイダー上の GPT-5 ファミリーモデルに対して、
共通の GPT-5 プロンプト追加要素を加えます（`openai/*` に正規化される、修復前のレガシーな Codex 参照を含みます）。OpenRouter や opencode ルートなど、GPT-5 ファミリーのモデル ID も提供する他のプロバイダーには、このオーバーレイは適用されません。これはモデル ID だけでなく、プロバイダー ID `openai` によって制御されます。古い GPT-4.x モデルには適用されません。

ネイティブ Codex app-server ハーネスは、開発者向け指示を通じてペルソナ／ツール規律の動作契約や、親しみやすい対話スタイルのオーバーレイを受け取りません。ネイティブ Codex では Codex が所有する基本動作、モデル動作、プロジェクトドキュメントの動作が維持され、OpenClaw はネイティブスレッドで Codex の組み込みパーソナリティを無効化するため、エージェントワークスペースのパーソナリティファイルが引き続き優先されます。
OpenClaw がネイティブ Codex スレッドに追加するのは、チャネル配信、OpenClaw の動的ツール、ACP 委譲、ワークスペースコンテキスト、OpenClaw Skills というランタイムコンテキストのみです。この同じ追加要素に含まれる Heartbeat ガイダンスのテキストだけは例外です。ネイティブ Codex の Heartbeat ターンには、共通のプロンプト追加フックではなく、専用のコラボレーション指示として注入されます。

GPT-5 の追加要素は、該当する OpenClaw 構築プロンプトに、ペルソナの持続性、実行の安全性、ツール規律、出力形式、完了チェック、検証に関するタグ付きの動作契約を追加します。チャネル固有の返信およびサイレントメッセージの動作は、共通の OpenClaw システムプロンプトと送信配信ポリシーに残ります。親しみやすい対話スタイルのレイヤーは独立しており、設定できます。

| 値                  | 効果                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"`（デフォルト） | 親しみやすい対話スタイルのレイヤーを有効化 |
| `"on"`                 | `"friendly"` のエイリアス                      |
| `"off"`                | 親しみやすいスタイルのレイヤーのみを無効化       |

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
ランタイムでは値の大文字と小文字が区別されないため、`"Off"` と `"off"` はどちらも親しみやすいスタイルのレイヤーを無効化します。
</Tip>

<Note>
共通の `agents.defaults.promptOverlays.gpt5.personality` 設定が未設定の場合、レガシーな `plugins.entries.openai.config.personality` は互換性フォールバックとして引き続き読み取られます。
</Note>

## 音声と発話

<AccordionGroup>
  <Accordion title="音声合成（TTS）">
    同梱の `openai` Plugin は、`messages.tts` サーフェスに音声合成を登録します。

    | 設定      | 設定パス                                            | デフォルト                          |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | モデル        | `messages.tts.providers.openai.model`                  | `gpt-4o-mini-tts`                |
    | 音声        | `messages.tts.providers.openai.speakerVoice`           | `coral`                          |
    | 速度        | `messages.tts.providers.openai.speed`                  | （未設定）                          |
    | 指示 | `messages.tts.providers.openai.instructions`           | （未設定、`gpt-4o-mini-tts` のみ）  |
    | 形式       | `messages.tts.providers.openai.responseFormat`         | ボイスメモでは `opus`、ファイルでは `mp3` |
    | API キー      | `messages.tts.providers.openai.apiKey`                 | `OPENAI_API_KEY` にフォールバック   |
    | ベース URL     | `messages.tts.providers.openai.baseUrl`                | `https://api.openai.com/v1`      |
    | 追加ボディ   | `messages.tts.providers.openai.extraBody` / `extra_body` | （未設定）                        |

    利用可能なモデル: `gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。利用可能な音声:
    `alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、
    `marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` は、OpenClaw が生成したフィールドの後に `/audio/speech` リクエスト JSON へマージされるため、`lang` などの追加キーを必要とする OpenAI 互換エンドポイントで使用してください。プロトタイプキーは無視されます。

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
    チャット API エンドポイントに影響を与えずに TTS のベース URL を上書きするには、`OPENAI_TTS_BASE_URL` を設定します。OpenAI TTS と Realtime 音声はいずれも OpenAI Platform API キーを通じて設定されます。OAuth のみのインストールでも Codex ベースのチャットモデルは使用できますが、OpenAI のライブ応答音声は使用できません。
    </Note>

  </Accordion>

  <Accordion title="音声テキスト変換">
    同梱の `openai` Plugin は、OpenClaw のメディア理解文字起こしサーフェスを通じてバッチ音声テキスト変換を登録します。

    - デフォルトモデル: `gpt-4o-transcribe`
    - エンドポイント: OpenAI REST `/v1/audio/transcriptions`
    - 入力パス: マルチパート音声ファイルのアップロード
    - 使用箇所: Discord ボイスチャネルのセグメントやチャネルの音声添付ファイルなど、受信音声の文字起こしが `tools.media.audio` を読み取るすべての箇所

    受信音声の文字起こしに OpenAI を強制的に使用するには、次のように設定します。

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

    言語とプロンプトのヒントは、共通の音声メディア設定または呼び出しごとの文字起こしリクエストで指定された場合、OpenAI に転送されます。

  </Accordion>

  <Accordion title="リアルタイム文字起こし">
    同梱の `openai` Plugin は、Voice Call Plugin にリアルタイム文字起こしを登録します。

    | 設定          | 設定パス                                                          | デフォルト |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | モデル            | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 言語         | `...openai.language`                                                 | （未設定） |
    | プロンプト           | `...openai.prompt`                                                   | （未設定） |
    | 無音時間 | `...openai.silenceDurationMs`                                        | `800`   |
    | VAD しきい値    | `...openai.vadThreshold`                                             | `0.5`   |
    | 認証             | `...openai.apiKey`、`OPENAI_API_KEY`、または `openai` API キープロファイル    | Platform API キーが必要 |

    <Note>
    G.711 u-law（`g711_ulaw` / `audio/pcmu`）音声を使用して、`wss://api.openai.com/v1/realtime` への WebSocket 接続を使用します。`openai` API キープロファイルの場合、Gateway は WebSocket を開く前に一時的な Realtime 文字起こしクライアントシークレットを発行します。このストリーミングプロバイダーは Voice Call のリアルタイム文字起こしパス用です。一方、Discord 音声は現在、短いセグメントを録音し、代わりにバッチ `tools.media.audio` 文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="リアルタイム音声">
    同梱の `openai` Plugin は、Voice Call Plugin にリアルタイム音声を登録します。

    | 設定                               | 設定パス                                                              | デフォルト             |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | モデル                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2.1`  |
    | 音声                                  | `...openai.voice`                                                       | `alloy`             |
    | 温度（Azure デプロイメントブリッジ）  | `...openai.temperature`                                                 | `0.8`               |
    | VAD しきい値                          | `...openai.vadThreshold`                                                | `0.5`                |
    | 無音時間                       | `...openai.silenceDurationMs`                                           | `500`                |
    | プレフィックスパディング                         | `...openai.prefixPaddingMs`                                             | `300`                |
    | 推論エフォート                       | `...openai.reasoningEffort`                                             | （未設定）              |
    | 認証                                   | `openai` API キープロファイル、`...openai.apiKey`、または `OPENAI_API_KEY` | OpenAI Platform API キーが必要 |

    `gpt-realtime-2.1` で利用可能な組み込み Realtime 音声: `alloy`、`ash`、
    `ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin`、`cedar`。
    OpenAI は、最高の Realtime 品質を得るために `marin` と `cedar` を推奨しています。これは上記のテキスト読み上げ音声とは別のセットです。`fable`、`nova`、`onyx` などの TTS 専用音声は、Realtime セッションでは使用できません。
    より小規模で低コストの Realtime 2.1 バリアントを使用する場合は、モデルを明示的に `gpt-realtime-2.1-mini` に設定します。

    <Note>
    **GPT-Live（近日提供予定）。** OpenAI の全二重 `gpt-live-1` および
    `gpt-live-1-mini` モデルは、2026 年 7 月に ChatGPT の音声モードを置き換えました。開発者 API は早期アクセス組織に段階的に展開されています。OpenClaw はこのモデルファミリーを認識しますが、まだ実行しません。GPT-Live セッションは WebRTC 専用で、ターンテイキングを独自に管理し（VAD は使用しません）、OpenClaw のリアルタイムトランスポートがまだ実装していないハンドオフイベントプロトコルを通じてエージェント作業を委譲します。`gpt-live-*` モデルを設定すると、エージェントにアクセスできないまま音声へ暗黙的に接続するのではなく、WebSocket ブリッジと Talk ブラウザーセッションの両方に関するガイダンスを示して安全側に失敗します。早期アクセス期間中は、API アクセスも OpenAI 組織ごとに制限されます。GPT-Live のサポートが導入されるまでは、`gpt-realtime-2.1`（デフォルト）を使用してください。
    </Note>

    <Note>
    バックエンドの OpenAI リアルタイムブリッジは GA Realtime WebSocket セッション形式を使用し、`session.temperature` は受け付けません。Azure OpenAI デプロイメントは引き続き `azureEndpoint` と `azureDeployment` を通じて利用でき、デプロイメント互換のセッション形式（`temperature` を含む）を維持します。双方向のツール呼び出しと G.711 u-law 音声をサポートします。
    </Note>

    <Note>
    リアルタイム音声はセッションの作成時に選択されます。OpenAI ではほとんどの
    セッションフィールドを後から変更できますが、そのセッションでモデルが音声を
    出力した後は音声を変更できません。OpenClaw は現在、組み込みの Realtime
    音声 ID を文字列として公開しています。
    </Note>

    <Note>
    Control UI の Talk は、Gateway が発行した一時的なクライアントシークレットと、
    OpenAI Realtime API に対するブラウザからの直接の WebRTC SDP 交換を使用する、
    OpenAI のブラウザリアルタイムセッションを利用します。Gateway は、選択された
    `openai` 認証情報を使用してそのクライアントシークレットを発行します。
    設定済みのキー、API キープロファイル、`OPENAI_API_KEY` が優先され、
    `openai` OAuth プロファイルまたは外部 Codex ログインがフォールバックになります。
    Gateway リレーおよび Voice Call バックエンドのリアルタイム WebSocket ブリッジでは、
    ネイティブ OpenAI エンドポイントに対して同じ認証情報の優先順序が使用されます。
    メンテナー向けのライブ検証は
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    で利用できます。OpenAI の各処理では、シークレットをログに記録せずに、バックエンドの
    WebSocket ブリッジとブラウザの WebRTC SDP 交換の両方を検証します。
    Google の認証情報なしでこれら 2 つの処理を実行するには、`--openai-only` を渡します。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI エンドポイント

組み込みの `openai` プロバイダーでは、ベース URL を上書きすることで、画像生成に
Azure OpenAI リソースを使用できます。画像生成パスでは、OpenClaw は
`models.providers.openai.baseUrl` の Azure ホスト名を検出し、Azure のリクエスト形式へ
自動的に切り替えます。

<Note>
リアルタイム音声は別の設定パス
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
を使用し、`models.providers.openai.baseUrl` の影響を受けません。Azure
設定については、[音声とスピーチ](#voice-and-speech)にある **リアルタイム
音声** アコーディオンを参照してください。
</Note>

次の場合は Azure OpenAI を使用します。

- Azure OpenAI のサブスクリプション、クォータ、またはエンタープライズ
  契約をすでに保有している
- Azure が提供するリージョン内のデータ所在地またはコンプライアンス制御が必要である
- 既存の Azure テナンシー内にトラフィックを維持したい

### 設定

組み込みの `openai` プロバイダー経由で Azure 画像生成を使用するには、
`models.providers.openai.baseUrl` を Azure リソースに向け、`apiKey` に
Azure OpenAI キー（OpenAI Platform キーではありません）を設定します。

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

OpenClaw は、Azure 画像生成ルートで次の Azure ホストサフィックスを
認識します。

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

認識された Azure ホストでの画像生成リクエストでは、OpenClaw は次の処理を行います。

- `Authorization: Bearer` の代わりに `api-key` ヘッダーを送信する
- デプロイメントスコープのパス（`/openai/deployments/{deployment}/...`）を使用する
- 各リクエストに `?api-version=...` を追加する
- Azure 画像生成呼び出しに、デフォルトのリクエストタイムアウト 600s を使用する。
  呼び出しごとの `timeoutMs` 値は、引き続きこのデフォルトを上書きします。

その他のベース URL（公開 OpenAI、OpenAI 互換プロキシ）では、標準の
OpenAI 画像リクエスト形式が維持されます。

<Note>
`openai` プロバイダーの画像生成パスで Azure ルーティングを使用するには、
OpenClaw 2026.4.22 以降が必要です。それより前のバージョンでは、カスタム
`openai.baseUrl` が公開 OpenAI エンドポイントと同様に扱われ、Azure の画像
デプロイメントに対するリクエストは失敗します。
</Note>

### API バージョン

Azure 画像生成パスで特定の Azure プレビュー版または GA バージョンを
固定するには、`AZURE_OPENAI_API_VERSION` を設定します。

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

変数が未設定の場合、デフォルトは `2024-12-01-preview` です。

### モデル名はデプロイメント名

Azure OpenAI はモデルをデプロイメントに関連付けます。組み込みの
`openai` プロバイダー経由でルーティングされる Azure 画像生成リクエストでは、
OpenClaw の `model` フィールドに、公開 OpenAI モデル ID ではなく、
Azure ポータルで設定した **Azure デプロイメント名** を指定する必要があります。

`gpt-image-2` を提供する `gpt-image-2-prod` というデプロイメントを作成した場合:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

組み込みの `openai` プロバイダー経由でルーティングされるすべての画像生成呼び出しに、
同じデプロイメント名の規則が適用されます。

### リージョン別の提供状況

Azure の画像生成は現在、一部のリージョンでのみ利用できます
（例: `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
`uaenorth`）。デプロイメントを作成する前に Microsoft の最新リージョン一覧を
確認し、対象のモデルが使用するリージョンで提供されていることを確認してください。

### パラメーターの違い

Azure OpenAI と公開 OpenAI では、常に同じ画像パラメーターが受け入れられるとは
限りません。Azure は、公開 OpenAI で許可されるオプション（例:
`gpt-image-2` の特定の `background` 値）を拒否したり、特定のモデル
バージョンでのみ公開したりする場合があります。これらの違いは Azure と基盤モデルに
起因するものであり、OpenClaw によるものではありません。Azure リクエストが検証エラーで
失敗した場合は、Azure ポータルで、対象のデプロイメントと API バージョンがサポートする
パラメーターセットを確認してください。

<Note>
Azure OpenAI はネイティブトランスポートと互換動作を使用しますが、
OpenClaw の非表示の帰属ヘッダーは受け取りません。詳細は、
[高度な設定](#advanced-configuration)にある **ネイティブルートと OpenAI 互換
ルート** アコーディオンを参照してください。

Azure でチャットまたは Responses トラフィック（画像生成以外）を使用するには、
オンボーディングフローまたは専用の Azure プロバイダー設定を使用してください。
`openai.baseUrl` だけでは Azure の API/認証形式は適用されません。別途
`azure-openai-responses/*` プロバイダーが用意されています。以下のサーバー側 Compaction
アコーディオンを参照してください。
</Note>

## 高度な設定

以下のモデルごとの `params` の例は、OpenClaw の組み込みプロバイダー
リクエストを形成します。これらの設定は明示的に作成されたリクエスト動作となるため、
通常であれば対象となる `auto` ルートでも、暗黙に Codex を選択せず
OpenClaw 上に留まります。ネイティブ Codex app-server ハーネスは、独自のトランスポートと
リクエスト設定を管理します。明示的な `agentRuntime.id: "codex"` は、有効なルートが
Codex 互換として宣言されていない場合、フェイルクローズします。

<AccordionGroup>
  <Accordion title="トランスポート（WebSocket と SSE）">
    OpenClaw は `openai/*` に対し、WebSocket 優先と SSE フォールバック
    （`"auto"`）を使用します。

    `"auto"` モードでは、OpenClaw は次の処理を行います。
    - 初期の WebSocket 障害を 1 回再試行してから SSE にフォールバックする
    - 障害後、WebSocket を 60 秒間劣化状態としてマークし、クールダウン中は
      SSE を使用する
    - 再試行と再接続のために、安定したセッションおよびターン識別ヘッダーを
      付加する
    - トランスポートのバリエーション間で使用量カウンター
      （`input_tokens` / `prompt_tokens`）を正規化する

    | 値                | 動作                          |
    | ---------------------- | ------------------------------------ |
    | `"auto"`（デフォルト）   | WebSocket 優先、SSE フォールバック     |
    | `"sse"`              | SSE のみを強制                    |
    | `"websocket"`        | WebSocket のみを強制              |

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
    - [API レスポンスのストリーミング（SSE）](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="高速モード">
    OpenClaw は `openai/*` 向けに共通の高速モード切り替えを提供します。

    - **チャット/UI:** `/fast status|auto|on|off`
    - **設定:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    有効にすると、OpenClaw は高速モードを OpenAI の優先処理
    （`service_tier = "priority"`）に対応付けます。既存の `service_tier` 値は
    保持され、高速モードによって `reasoning` または
    `text.verbosity` が書き換えられることはありません。`fastMode: "auto"` は、
    自動カットオフまでは新しいモデル呼び出しを高速モードで開始し、それ以降の再試行、
    フォールバック、ツール結果、または継続の呼び出しは高速モードなしで開始します。
    カットオフのデフォルトは 60 秒です。変更するには、アクティブなモデルに
    `params.fastAutoOnSeconds` を設定します。

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
    セッションの上書き設定は構成設定より優先されます。Sessions UI でセッションの
    上書き設定をクリアすると、セッションは構成済みのデフォルトに戻ります。
    </Note>

  </Accordion>

  <Accordion title="優先処理（service_tier）">
    OpenAI の API は `service_tier` を介して優先処理を提供します。OpenClaw では
    モデルごとに設定します。

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
    `serviceTier` は、ネイティブ OpenAI エンドポイント
    （`api.openai.com`）とネイティブ Codex エンドポイント（`chatgpt.com/backend-api`）に
    のみ転送されます。いずれかのプロバイダーをプロキシ経由でルーティングする場合、
    OpenClaw は `service_tier` を変更しません。
    </Warning>

  </Accordion>

  <Accordion title="サーバー側 Compaction（Responses API）">
    OpenAI の直接 Responses モデル（`api.openai.com` 上の `openai/*`）では、
    OpenAI Plugin の OpenClaw ストリームラッパーがサーバー側 Compaction を
    自動的に有効化します。

    - `store: true` を強制する（モデル互換設定で `supportsStore: false` が設定されている場合を除く）
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` を挿入する
    - デフォルトの `compact_threshold`: `contextWindow` の 70%（利用できない場合は `80000`）

    これは組み込みの OpenClaw ランタイムパスと、組み込み実行で使用される OpenAI
    プロバイダーフックに適用されます。ネイティブ Codex app-server ハーネスは、
    Codex を介して独自のコンテキストを管理するため、この設定の影響を受けません。

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
    OpenAI の直接 Responses モデルでは、互換設定で `supportsStore: false` が
    設定されている場合を除き、引き続き `store: true` が強制されます。
    </Note>

  </Accordion>

  <Accordion title="厳格なエージェント型 GPT モード">
    OpenClaw の組み込みランタイムを通じて実行される `openai` プロバイダーの
    GPT-5 ファミリーモデルでは、OpenClaw はすでに `strict-agentic` と呼ばれる、
    より厳格な実行契約をデフォルトで使用します。解決されたプロバイダーが
    `openai` で、モデル ID が GPT-5 ファミリーに一致する場合、
    設定で明示的に無効化されていない限り、自動的に有効化されます。

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    `"strict-agentic"` を明示的に設定しても、サポート対象のレーンでは何も変わらず（すでにデフォルトです）、サポート対象外のプロバイダーとモデルの組み合わせでは機能しません。

    `strict-agentic` が有効な場合、OpenClaw は次のように動作します。
    - 本格的な作業では `update_plan` を自動的に有効化する
    - 構造的に空のターンまたは推論のみのターンを、表示可能な回答を生成する継続処理によって再試行する
    - 選択したハーネスで提供されている場合は、明示的なハーネスの計画イベントを使用する

    OpenClaw は、ターンが計画、進捗更新、最終回答のいずれであるかを判断するために、アシスタントの文章を分類しません。

    <Note>
    この契約は、OpenClaw の組み込みエージェントランナー内でのみ適用されます。独自のターンおよび計画の動作を管理するネイティブ Codex app-server ハーネスには適用されません。ネイティブ Codex の実行では、実行契約の設定よりもハーネスの選択のほうが重要です。
    </Note>

  </Accordion>

  <Accordion title="ネイティブ経路と OpenAI 互換経路">
    OpenClaw は、OpenAI、Codex、Azure OpenAI の直接エンドポイントを、汎用的な OpenAI 互換 `/v1` プロキシとは異なる方法で処理します。

    **ネイティブ経路**（`openai/*`、Azure OpenAI）：
    - OpenAI `none` effort をサポートするモデルに限り、`reasoning: { effort: "none" }` を維持する
    - `reasoning.effort: "none"` を拒否するモデルまたはプロキシでは、無効化された推論を省略する
    - ツールスキーマのデフォルトを strict モードにする
    - 検証済みのネイティブホストに限り、非表示の帰属ヘッダーを付加する（Azure OpenAI はネイティブ経路ですが、これらのヘッダーは付加されません）
    - OpenAI 専用のリクエスト調整（`service_tier`、`store`、推論互換性、プロンプトキャッシュのヒント）を維持する

    **プロキシ／互換経路：**
    - より緩やかな互換動作を使用する
    - 非ネイティブの `openai-completions` ペイロードから Completions の `store` を除去する
    - OpenAI 互換 Completions プロキシ向けに、高度な `params.extra_body`/`params.extraBody` パススルー JSON を受け入れる
    - vLLM などの OpenAI 互換 Completions プロキシ向けに `params.chat_template_kwargs` を受け入れる
    - strict なツールスキーマやネイティブ専用ヘッダーを強制しない

  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共通の画像ツールパラメーターとプロバイダーの選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共通の動画ツールパラメーターとプロバイダーの選択。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報の再利用ルール。
  </Card>
</CardGroup>
