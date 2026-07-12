---
read_when:
    - OpenClaw で OpenAI モデルを使用する場合
    - API キーではなく Codex サブスクリプション認証を使用したい場合
    - より厳格な GPT-5 エージェント実行動作が必要な場合
summary: OpenClaw で API キーまたは Codex サブスクリプションを使用して OpenAI を利用する
title: OpenAI
x-i18n:
    generated_at: "2026-07-12T14:47:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bc433abdf4fb8984430054acecdda3ba01b9795ad52cc89b19e10b09c6bcc8c3
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw は、直接の API キー認証と ChatGPT/Codex サブスクリプション認証の両方に、単一のプロバイダー ID `openai` を使用します。`openai/*` が正規のモデルルートです。
ランタイムポリシーが未設定または `auto` の組み込みエージェントターンでは、OpenAI のルート情報に基づいて、OpenClaw が同梱の Codex app-server ランタイムを暗黙的に選択できるかどうかが決まります。`openai/*` プレフィックスだけではランタイムは選択されません。

- **エージェントモデル** - 明示的な `agentRuntime` 設定または OpenAI の暗黙的なルートポリシーによって選択されたランタイムを介する `openai/*`。ChatGPT/Codex サブスクリプションを使用する場合は Codex 認証でサインインし、キーによる課金を使用する場合は API キー認証プロファイルを設定します。
- **エージェント以外の OpenAI API** - `OPENAI_API_KEY` または `openai` API キー認証プロファイルを介した、使用量に応じて課金される OpenAI Platform への直接アクセス。
- **レガシー設定** - 古い Codex モデル参照とプロファイル ID は、`openclaw doctor --fix` によって `openai/*` に修復されます。

OpenAI は、OpenClaw のような外部ツールやワークフローでのサブスクリプション OAuth の使用を明示的にサポートしています。

## 使用量とコストの追跡

OpenClaw は、サブスクリプションのクォータと Platform API の課金を区別して扱います。

- ChatGPT/Codex OAuth では、サブスクリプションプラン、クォータ期間、クレジット残高が表示されます。
- `OPENAI_ADMIN_KEY` を使用すると、プロバイダーから報告された過去 30 日間の組織コストと completions 使用量が Control UI の **使用量** に表示されます。これには、日別支出、リクエスト数とトークン数の合計、上位モデル、コストカテゴリが含まれます。
- `OPENAI_PROJECT_ID` を指定すると、Admin API の履歴を必要に応じて 1 つのプロジェクトに限定できます。
- OpenClaw が `OPENAI_API_KEY` または `openai` 推論プロファイルを組織 API に送信することはありません。これらの認証情報は、カスタム、Azure、またはエージェントローカルのエンドポイントに属している可能性があります。

明示的な Admin キーは OAuth より優先されます。プロバイダーから報告された履歴は、OpenClaw がセッションから算出した推定コストとは統合されません。この履歴には、他のクライアントによる API アクティビティや、プロバイダー側の請求調整が含まれる場合があります。

OpenAI の [API 使用状況ダッシュボード](https://help.openai.com/en/articles/10478918)ドキュメントでは、使用量データに必要な組織所有者権限と明示的な Usage Dashboard 権限について説明しています。

プロバイダー、モデル、ランタイム、チャンネルは、それぞれ独立したレイヤーです。これらのラベルを混同している場合は、設定を変更する前に[エージェントランタイム](/ja-JP/concepts/agent-runtimes)を参照してください。

## クイック選択

| 目的                                              | 使用するもの                                                                | 備考                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| ChatGPT/Codex サブスクリプション、ネイティブ Codex ランタイム  | `openai/gpt-5.6-sol`                                               | 新規サブスクリプション設定。Codex 認証でサインインします。                  |
| エージェントターンに対する直接の API キー課金            | `openai/gpt-5.6` と順序指定された API キー認証プロファイル              | 新規 API キー設定。修飾なしの直接 API ID は Sol に解決されます。        |
| GPT-5.6 の正確なティアを選択                      | `openai/gpt-5.6-sol`、`-terra`、または `-luna`                         | このアカウントで利用可能なティアを `models list` で確認します。        |
| GPT-5.6 にアクセスできないアカウント                    | `openai/gpt-5.5`                                                   | 明示的な復旧選択。OpenClaw は暗黙的にダウングレードしません。     |
| 直接の API キー課金、明示的な OpenClaw ランタイム | `openai/gpt-5.6` とプロバイダー/モデルの `agentRuntime.id: "openclaw"` | 通常の `openai` API キープロファイルを選択します。                           |
| 最新の ChatGPT Instant モデルエイリアス                | `openai/chat-latest`                                               | 直接の API キー専用。変動するエイリアスであり、安定版のデフォルトではありません。          |
| 画像の生成または編集                       | `openai/gpt-image-2`                                               | `OPENAI_API_KEY` または Codex OAuth で動作します。                         |
| 背景が透明な画像                     | `openai/gpt-image-1.5`                                             | `outputFormat` を `png` または `webp` に設定し、`background=transparent` を指定します。 |

## 名称対応表

| 表示される名前                            | レイヤー             | 意味                                                                                  |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | プロバイダープレフィックス   | 正規の OpenAI モデルルート。ルート情報によって暗黙的なランタイムが決まります。                |
| `codex` Plugin                          | Plugin            | ネイティブ Codex app-server ランタイムと `/codex` チャットコントロールを提供する同梱 Plugin。 |
| プロバイダー/モデルの `agentRuntime.id: codex` | エージェントランタイム     | 一致する組み込みターンに対して、ネイティブ Codex app-server ハーネスを強制します。                   |
| `/codex ...`                            | チャットコマンドセット  | 会話から Codex app-server スレッドを関連付け、制御します。                               |
| `runtime: "acp", agentId: "codex"`      | ACP セッションルート | ACP/acpx を介して Codex を実行する明示的なフォールバックパス。                                 |

## 暗黙的なエージェントランタイム

プロバイダー/モデルの `agentRuntime` ポリシーが未設定または `auto` の場合、OpenAI が所有するルートポリシーによって、有効なエンドポイントとアダプターから暗黙的なランタイムが選択されます。

| 有効なルート情報                                                                                                                                                  | 暗黙的なランタイム      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `openai-responses` を使用する正確な公式 Platform HTTPS エンドポイント、または `openai-chatgpt-responses` を使用する正確な公式 ChatGPT HTTPS エンドポイント。作成者によるリクエストオーバーライドなし | Codex が選択される場合があります |
| 作成者が指定した `openai-completions` アダプター                                                                                                                                  | OpenClaw              |
| カスタムエンドポイント                                                                                                                                                        | OpenClaw              |
| HTTP を使用する明示的かつ正確な公式エンドポイント                                                                                                                            | 拒否              |
| 作成者が指定したプロバイダー/モデルのリクエストオーバーライドを含むルート                                                                                                                 | OpenClaw              |

明示的なデフォルト以外のプロバイダー/モデルの `agentRuntime.id` が引き続き優先されます。
たとえば、`agentRuntime.id: "openclaw"` を指定すると、通常なら Codex を利用できるルートでも OpenClaw が維持されます。一方、`agentRuntime.id: "codex"` は Codex を必須とし、有効なルートが Codex 互換として宣言されていない場合は安全側に倒して失敗します。
ランタイムの選択によって認証情報の種類や課金が変わることはありません。Platform API キー認証と ChatGPT/Codex サブスクリプション認証は、引き続き区別されます。

`openclaw doctor --fix` は、レガシー Codex モデル参照、レガシー Codex 認証プロファイル ID、レガシー Codex 認証順序エントリを正規の `openai` ルートに移行します。新しい認証順序設定には `auth.order.openai` を使用してください。

<Note>
新規の OpenAI 設定では、プライマリモデルが設定されていない場合にのみ GPT-5.6 がプライマリとして適用されます。OpenAI 認証の追加または更新では、`models auth login --set-default` または `models set` を明示的に使用しない限り、`openai/gpt-5.5` を含む既存の明示的な選択が保持されます。エージェントモデルで API キー認証を使用する場合にのみ、API キー認証プロファイルを使用してください。
</Note>

## GPT-5.6 限定プレビュー

OpenClaw は、正確な `openai/gpt-5.6-sol`、`openai/gpt-5.6-terra`、`openai/gpt-5.6-luna` モデル ID を認識します。現在のカタログでは、3 つすべてが `xhigh` と `max` の推論を公開しています。OpenAI は、Sol をフラッグシップティア、Terra をバランス型ティア、Luna を高速で低コストのティアと説明しています。
[GPT-5.6 リリース発表](https://openai.com/index/previewing-gpt-5-6-sol/)および[アクセスガイド](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna)を参照してください。

OpenAI API キーによる直接認証では、修飾なしの `openai/gpt-5.6` ID は Sol のエイリアスであり、新規設定のデフォルトです。ネイティブ Codex カタログは、この直接 API エイリアスをクライアント側では適用しません。ワークスペースのアクセス権に応じて、正確な Sol、Terra、Luna の ID が表示される場合があります。そのため、新規の ChatGPT/Codex OAuth 設定では `openai/gpt-5.6-sol` を使用します。現在のアカウントを次のコマンドで確認してください。

```bash
openclaw models list --provider openai
```

API 組織と Codex ワークスペースでは、アクセス権が異なる場合があります。GPT-5.6 を利用できない場合は、GPT-5.5 を明示的に選択してください。

```bash
openclaw models set openai/gpt-5.5
```

OpenClaw はアップストリームのアクセスエラーを表示し、GPT-5.6 の選択を GPT-5.5 に暗黙的に置き換えることはありません。

<Note>
対象となる正確な公式 HTTPS ルートでは、ランタイムポリシーが未設定または `auto` の場合、同梱の Codex app-server Plugin が選択されることがあります。作成者が指定した Completions ルート、カスタムエンドポイント、リクエストトランスポートのオーバーライドは OpenClaw のままです。平文の公式 HTTP エンドポイントは拒否されます。明示的なプロバイダー/モデルのランタイム設定が引き続き優先されます。`openclaw doctor --fix` を実行して、古いレガシー Codex モデル参照、`codex-cli/*` 参照、または明示的なランタイム設定で指定されていない古いランタイムセッション固定を修復してください。
</Note>

## OpenClaw の機能対応範囲

| OpenAI の機能           | OpenClaw のサーフェス                                                                         | ステータス                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| チャット / Responses      | `openai/<model>` モデルプロバイダー                                                            | 対応                                                             |
| Codex サブスクリプションモデル | OpenAI OAuth を使用する `openai/<model>`                                                  | 対応                                                             |
| レガシー Codex モデル参照 | 古い Codex モデル参照、`codex-cli/<model>`                                                     | doctor により `openai/<model>` へ修復                           |
| Codex app-server ハーネス  | runtime が未設定/`auto` の Codex 互換 HTTPS ルート、または明示的な `agentRuntime.id: codex` | 対応                                                             |
| サーバー側 Web 検索       | OpenAI Responses のネイティブツール                                                            | Web 検索が有効で、ほかのプロバイダーが固定されていない場合に対応 |
| 画像                      | `image_generate`                                                                              | 対応                                                             |
| 動画                      | `video_generate`                                                                              | 対応                                                             |
| テキスト読み上げ          | `messages.tts.provider: "openai"` / `tts`                                                     | 対応                                                             |
| バッチ音声テキスト変換    | `tools.media.audio` / メディア理解                                                             | 対応                                                             |
| ストリーミング音声テキスト変換 | Voice Call `streaming.provider: "openai"`                                                | 対応                                                             |
| リアルタイム音声          | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | 対応（OpenAI Platform API キー）                                |
| 埋め込み                  | メモリ埋め込みプロバイダー                                                                    | 対応                                                             |

<Note>
OpenAI のリアルタイム音声は、公開 **OpenAI Platform Realtime
API** を経由し、Platform API キーが必要です。一方、Codex OAuth トークンは
ChatGPT Codex バックエンドの認証に使用されます。公開 Realtime エンドポイント用の
Platform API キーとは互換性がありません。

API キー認証で請求設定がないと報告された場合は、API キー認証を使用する際に、
リアルタイム認証情報を提供する組織の Platform クレジットを
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
で追加してください。リアルタイム音声では、
`openclaw onboard --auth-choice openai-api-key` で作成した `openai` API キー認証プロファイル、
Control UI Talk の `talk.realtime.providers.openai.apiKey` で設定した Platform API キー、
Voice Call の `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`、
または `OPENAI_API_KEY` 環境変数を使用できます。
</Note>

## メモリ埋め込み

OpenClaw は、`memory_search` のインデックス作成およびクエリ埋め込みに、
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

非対称な埋め込みラベルを必要とする OpenAI 互換エンドポイントでは、
`memorySearch` の下に `queryInputType` と `documentInputType` を設定します。OpenClaw は
これらをプロバイダー固有の `input_type` リクエストフィールドとして転送します。クエリ
埋め込みには `queryInputType` を使用し、インデックス化されたメモリチャンクとバッチインデックス作成には
`documentInputType` を使用します。完全な例については、
[メモリ設定リファレンス](/ja-JP/reference/memory-config#provider-specific-config)
を参照してください。

## はじめに

<Tabs>
  <Tab title="API キー（OpenAI Platform）">
    **最適な用途:** API への直接アクセスと使用量ベースの請求。

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
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### ルートの概要

    | モデル参照       | runtime ポリシーまたはルートの情報                             | ルート                    | 認証                              |
    | ---------------- | ------------------------------------------------------------- | ------------------------- | --------------------------------- |
    | `openai/gpt-5.6` | 未設定/`auto`、公式の完全一致する HTTPS ネイティブルート、リクエストオーバーライドなし | Codex が選択される場合あり | 順序付けされた API キー認証プロファイル |
    | `openai/gpt-5.6` | プロバイダー/モデルの `agentRuntime.id: "openclaw"`           | OpenClaw 組み込み runtime | 選択された `openai` API キープロファイル |
    | `openai/gpt-5.5` | 明示的なプロバイダー/モデルの `agentRuntime.id`                | 選択されたエージェント runtime | 選択された OpenAI API キープロファイル |
    | `openai/*`       | 明示的に設定された Completions、カスタム、またはリクエストオーバーライド | OpenClaw 組み込み runtime | 認証情報の種類は変更されない |
    | `openai/*`       | 平文の公式 HTTP エンドポイント                                | 拒否                      | 認証情報は送信されない             |

    <Note>
    runtime が未設定または `auto` の場合、条件を満たす公式の完全一致する HTTPS ネイティブ
    ルートのみが Codex app-server ハーネスを暗黙的に選択できます。エージェントモデルで
    API キー認証を使用する場合は、`openai` API キー認証プロファイルを作成し、
    `auth.order.openai` で順序付けしてください。`OPENAI_API_KEY` は、エージェント以外の
    OpenAI API サーフェスに対する直接のフォールバックとして引き続き使用されます。古い
    レガシー Codex 認証順序エントリを移行するには、`openclaw doctor --fix` を実行してください。
    </Note>

    ### 設定例

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
    }
    ```

    直接 API の単独 `gpt-5.6` ID は Sol ティアに解決されます。この API
    組織で GPT-5.6 が公開されていない場合は、プライマリを
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
    `openai/gpt-5.6` が使用され、その直接 API の単独 ID は Sol に解決されます。
    `openai/gpt-5.5` を含む既存の明示的なプライマリは変更されません。
    `chat-latest` エイリアスはテキストの詳細度として `medium` のみを受け付けます。OpenClaw は
    このモデルについて、要求されたほかの詳細度をすべて `medium` に強制します。

    <Warning>
    OpenClaw は、OpenAI API キーの直接ルートでは `gpt-5.3-codex-spark` を
    **公開しません**。サインイン済みアカウントで公開されている場合に限り、Codex
    サブスクリプションカタログのエントリを通じて利用できます。
    </Warning>

  </Tab>

  <Tab title="Codex サブスクリプション">
    **最適な用途:** 別個の API キーではなく、ネイティブ Codex
    app-server 実行で ChatGPT/Codex サブスクリプションを使用する場合。Codex cloud には
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

        ヘッドレス環境やコールバックが困難なセットアップでは、localhost ブラウザー
        コールバックの代わりに ChatGPT のデバイスコードフローでサインインするため、
        `--device-code` を追加します。

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="正規の OpenAI モデルルートを使用する">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.6-sol
        ```

        この公式の完全一致する HTTPS ネイティブルートには runtime 設定は不要です。
        Codex app-server runtime が自動的に選択される場合があり、その runtime が
        選択されると、OpenClaw はバンドルされた Codex Plugin をインストールまたは修復します。
      </Step>
      <Step title="Codex 認証が利用可能か確認する">
        ```bash
        openclaw models list --provider openai
        ```

        Gateway の起動後、チャットで `/codex status` または `/codex models` を送信し、
        ネイティブ app-server runtime を確認します。
      </Step>
    </Steps>

    ### ルートの概要

    | モデル参照               | runtime ポリシーまたはルートの情報                             | ルート                                                   | 認証                                               |
    | ------------------------ | ------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.6-sol`     | 未設定/`auto`、公式の完全一致する HTTPS ネイティブルート、リクエストオーバーライドなし | Codex が選択される場合あり                               | Codex サインイン、または順序付けされた `openai` 認証プロファイル |
    | `openai/gpt-5.6-terra`   | 未設定/`auto`、公式の完全一致する HTTPS ネイティブルート、リクエストオーバーライドなし | Codex が選択される場合あり                               | カタログで Terra が公開されている場合の Codex サインイン |
    | `openai/gpt-5.6-luna`    | 未設定/`auto`、公式の完全一致する HTTPS ネイティブルート、リクエストオーバーライドなし | Codex が選択される場合あり                               | カタログで Luna が公開されている場合の Codex サインイン |
    | `openai/gpt-5.6-sol`     | プロバイダー/モデルの `agentRuntime.id: "openclaw"`           | OpenClaw 組み込み runtime、内部 Codex 認証トランスポート | 選択された `openai` OAuth プロファイル             |
    | `openai/gpt-5.5`         | 明示的なプロバイダー/モデルの `agentRuntime.id`                | 選択されたエージェント runtime                          | 選択された OpenAI 認証プロファイル                 |
    | `openai/*`               | 明示的に設定された Completions、カスタム、またはリクエストオーバーライド | OpenClaw 組み込み runtime                               | 認証情報の要件は引き続きルート固有                 |
    | `openai/*`               | 平文の公式 HTTP エンドポイント                                | 拒否                                                     | 認証情報は送信されない                             |
    | レガシー Codex GPT-5.5 参照 | doctor により修復                                          | `openai/gpt-5.5` に書き換え                              | 移行された OpenAI OAuth プロファイル               |
    | `codex-cli/gpt-5.5`      | doctor により修復                                             | `openai/gpt-5.5` に書き換え                              | Codex app-server 認証                              |

    <Warning>
    サブスクリプションを利用する新規セットアップでは、正確な `openai/gpt-5.6-sol` を使用します。
    ネイティブ Codex カタログでは、正確な Terra または Luna の参照も公開される場合があります。
    アカウントで GPT-5.6 が公開されていない場合は、`openai/gpt-5.5` を明示的に選択してください。以前の
    Codex GPT 参照は従来の OpenClaw ルートであり、ネイティブ Codex ランタイムの
    パスではありません。既存の明示的な GPT-5.5 選択をアップグレードせずに移行するには、
    `openclaw doctor --fix` を実行してください。`gpt-5.3-codex-spark` は引き続き、
    Codex サブスクリプションカタログで提供されているアカウントに限定されます。これに対する OpenAI
    API キーおよび Azure の直接参照は、引き続き非表示になります。
    </Warning>

    <Note>
    新しい設定では、OpenAI エージェントの認証順序を `auth.order.openai` に配置してください。
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

    API キーのバックアップを使用する場合、選択したモデルは `openai/*` のままにし、
    認証順序を `openai` に配置します。OpenClaw は Codex ハーネスを維持したまま、
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
    オンボーディングでは、`~/.codex` から OAuth データをインポートしなくなりました。ブラウザー
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

    以前の設定に従来の Codex GPT 参照がまだ残っている場合、または明示的なランタイム設定がないまま
    古い OpenAI ランタイムセッションの固定が残っている場合は、修復します。

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    `models auth list --provider openai` に使用可能なプロファイルが表示されない場合は、
    再度サインインします。

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

    プロファイルの順序に依存する前に、`openclaw doctor --fix` を実行して、以前の従来型 OpenAI Codex
    プレフィックスのプロファイル ID と順序エントリを移行してください。

    ### ステータスインジケーター

    チャットの `/status` には、現在のセッションで有効なモデルランタイムが表示されます。
    対象となる暗黙的ルート、または明示的なプロバイダー／モデルのランタイムポリシーによって選択された場合、
    バンドルされた Codex app-server ハーネスは
    `Runtime: OpenAI Codex` と表示されます。

    ### doctor の警告

    従来の Codex モデル参照または古い OpenAI ランタイムの固定が設定やセッション状態に残っている場合、
    OpenClaw が明示的に設定されていない限り、`openclaw doctor --fix` は Codex ランタイムを使用する
    `openai/*` に書き換えます。

    ### コンテキストウィンドウの上限

    OpenClaw は、モデルメタデータとランタイムコンテキスト上限を別々の値として扱います。
    Codex OAuth カタログ経由の `openai/gpt-5.5` の場合：

    - ネイティブ `contextWindow`：`400000`
    - デフォルトのランタイム `contextTokens` 上限：`272000`

    実際の利用では、より小さいデフォルト上限のほうがレイテンシーと品質の特性に優れています。
    `contextTokens` で上書きできます。

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
    ネイティブモデルのメタデータを宣言するには `contextWindow` を使用します。ランタイムのコンテキスト予算を
    制限するには `contextTokens` を使用します。OpenAI API キーの直接ルートでは、`gpt-5.5` に対して
    より大きいネイティブ `contextWindow`（`1000000`）が報告されます。上流カタログが異なるため、
    2 つのルートは個別に追跡されます。
    </Note>

    ### カタログの復旧

    OpenClaw は、`gpt-5.5` が存在する場合、上流の Codex カタログメタデータを使用します。
    アカウントが認証済みであるにもかかわらず、ライブ Codex 検出で `gpt-5.5` の行が省略された場合、
    OpenClaw はその OAuth モデル行を合成し、cron、サブエージェント、および設定済みのデフォルトモデルの
    実行が `Unknown model` で失敗しないようにします。

  </Tab>
</Tabs>

## ネイティブ Codex app-server の認証

ネイティブ Codex app-server ハーネスは、対象となる正確な公式 HTTPS ルートによって暗黙的に選択された場合、
またはプロバイダー／モデルの `agentRuntime.id: "codex"` によって明示的に選択された場合に、
`openai/*` モデル参照を使用します。その認証は引き続きアカウントベースです。OpenClaw は次の順序で
認証を選択します。

1. エージェント用に順序付けられた OpenAI 認証プロファイル。`auth.order.openai` 配下が推奨されます。
   以前の従来型 Codex 認証プロファイル ID と認証順序を移行するには、
   `openclaw doctor --fix` を実行してください。
2. ローカル Codex CLI の ChatGPT サインインなど、app-server の既存アカウント。
   デフォルトの分離されたエージェントホームでは、OpenClaw はそのネイティブ CLI アカウントを
   ログイン RPC 経由で app-server に橋渡しします。CLI の設定、plugins、スレッドストアは共有しません。
3. ローカル stdio app-server の起動時のみ、かつ app-server がアカウントなしと報告した場合のみ：
   `CODEX_API_KEY`、次に `OPENAI_API_KEY`。

Gateway プロセスに OpenAI の直接モデルや埋め込み用の `OPENAI_API_KEY` も設定されているという理由だけで、
ローカルの ChatGPT/Codex サブスクリプションサインインが置き換えられることはありません。環境変数による
API キーのフォールバックは、ローカル stdio のアカウントなしパスにのみ適用されます。WebSocket
app-server 接続を介して送信されることはありません。サブスクリプション形式の Codex プロファイルが
選択されると、OpenClaw は生成された stdio app-server 子プロセスに `CODEX_API_KEY` と
`OPENAI_API_KEY` を渡さず、代わりに選択された認証情報を app-server のログイン RPC 経由で送信します。

そのサブスクリプションプロファイルが Codex の使用量制限によってブロックされた場合、OpenClaw は
Codex が通知したリセット時刻までプロファイルをブロック済みとしてマークし、選択されたモデルを変更したり
Codex ハーネスから外れたりすることなく、認証順序に従って次の `openai:*` プロファイルへ切り替えます。
リセット時刻を過ぎると、サブスクリプションプロファイルは再び使用可能になります。

## 画像生成

バンドルされた `openai` plugin は、`image_generate` ツールを通じて画像生成を登録します。
同じ `openai/gpt-image-2` モデル参照を使用し、OpenAI API キーと Codex OAuth の両方による画像生成を
サポートします。

| 機能                      | OpenAI API キー                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| モデル参照                | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 認証                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth サインイン         |
| トランスポート            | OpenAI Images API                  | Codex Responses バックエンド          |
| リクエストあたりの最大画像数 | 4                                  | 4                                    |
| 編集モード                | 有効（参照画像は最大 5 枚）          | 有効（参照画像は最大 5 枚）            |
| サイズの上書き            | 2K/4K サイズを含めてサポート         | 2K/4K サイズを含めてサポート           |
| アスペクト比／解像度       | OpenAI Images API には転送されない   | 安全な場合はサポート対象サイズにマッピング |

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
共通ツールパラメーター、プロバイダーの選択、およびフェイルオーバー動作については、
[画像生成](/ja-JP/tools/image-generation)を参照してください。
</Note>

`gpt-image-2` は、OpenAI のテキストからの画像生成および画像編集のデフォルトです。
`gpt-image-1.5`、`gpt-image-1`、`gpt-image-1-mini` は、明示的なモデルの上書きとして引き続き
使用できます。背景が透明な PNG/WebP 出力には `openai/gpt-image-1.5` を使用してください。
現在の `gpt-image-2` API は `background: "transparent"` を拒否します。

背景が透明なリクエストでは、`model: "openai/gpt-image-1.5"`、`outputFormat: "png"` または
`"webp"`、および `background: "transparent"` を指定して `image_generate` を呼び出します。
以前の `openai.background` プロバイダーオプションも引き続き受け付けられます。OpenClaw は、
デフォルトの `openai/gpt-image-2` に対する透明化リクエストを `gpt-image-1.5` に書き換えることで、
公開 OpenAI ルートと OpenAI Codex OAuth ルートも保護します。Azure およびカスタムの
OpenAI 互換エンドポイントでは、設定済みのデプロイメント名／モデル名が維持されます。

同じ設定は、ヘッドレス CLI 実行でも利用できます。

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "透明な背景上のシンプルな赤い円形ステッカー" \
  --json
```

入力ファイルから開始する場合は、`openclaw infer image edit` でも同じ `--output-format` と
`--background` フラグを使用します。`--openai-background` は OpenAI 固有のエイリアスとして
引き続き使用できます。OpenAI Images の品質とコストを制御するには
`--quality low|medium|high|auto` を使用します。`image generate` または `image edit` から
OpenAI のモデレーションヒントを渡すには、`--openai-moderation low|auto` を使用します。

ChatGPT/Codex OAuth インストールでは、同じ `openai/gpt-image-2` 参照を維持します。
`openai` OAuth プロファイルが設定されている場合、OpenClaw は保存された OAuth アクセストークンを
解決し、Codex Responses バックエンドを通じて画像リクエストを送信します。最初に
`OPENAI_API_KEY` を試したり、暗黙的に API キーへフォールバックしたりすることはありません。
代わりに OpenAI Images API の直接ルートを使用する場合は、API キー、カスタムベース URL、または
Azure エンドポイントを指定して `models.providers.openai` を明示的に設定します。そのカスタム画像
エンドポイントが信頼済み LAN／プライベートアドレス上にある場合は、
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` も設定してください。このオプトインが
存在しない限り、OpenClaw はプライベート／内部の OpenAI 互換画像エンドポイントをブロックします。

生成：

```
/tool image_generate model=openai/gpt-image-2 prompt="macOS 上での OpenClaw の洗練されたローンチポスター" size=3840x2160 count=1
```

背景が透明な PNG を生成：

```
/tool image_generate model=openai/gpt-image-1.5 prompt="透明な背景上のシンプルな赤い円形ステッカー" outputFormat=png background=transparent
```

編集：

```
/tool image_generate model=openai/gpt-image-2 prompt="オブジェクトの形状を維持し、素材を半透明のガラスに変更する" image=/path/to/reference.png size=1024x1536
```

## 動画生成

バンドルされた `openai` plugin は、`video_generate` ツールを通じて動画生成を登録します。

| 機能             | 値                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------- |
| デフォルトモデル | `openai/sora-2`                                                                    |
| モード           | テキストから動画、画像から動画、単一動画の編集                                     |
| 参照入力         | 1 枚の画像または 1 本の動画                                                        |
| サイズの上書き   | テキストから動画および画像から動画でサポート                                       |
| アスペクト比     | 生の値を転送せず、最も近いサポート対象サイズに変換                                 |
| その他の上書き   | `resolution`、`audio`、`watermark` は未サポートで、ツール警告とともに破棄される     |

OpenAI の画像から動画へのリクエストは、画像を `input_reference` として指定した
`POST /v1/videos` を使用します。単一動画の編集では、アップロードされた動画を `video` フィールドに
指定した `POST /v1/videos/edits` を使用します。

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
共通ツールのパラメーター、プロバイダーの選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation)を参照してください。

OpenAIプロバイダーは`supportsSize`を宣言していますが、`supportsAspectRatio`や`supportsResolution`は宣言していません。OpenClawの共通正規化レイヤーは、リクエストがプロバイダーに到達する前に、要求された`aspectRatio`を最も近いOpenAIの`size`に変換するため、アスペクト比のリクエストは通常そのまま機能します。
`resolution`にはサイズへのフォールバックがないため破棄され、呼び出し元には
`Ignored unsupported overrides for openai/<model>: resolution=<value>`として通知されます。
</Note>

## GPT-5プロンプトへの追加内容

OpenClawは、`openai`プロバイダー上のGPT-5ファミリーモデルに、共通のGPT-5プロンプト追加内容を加えます（`openai/*`に正規化される修復前のレガシーCodex参照を含みます）。OpenRouterやopencodeルートなど、GPT-5ファミリーのモデルIDも提供する他のプロバイダーには、このオーバーレイは適用されません。これはモデルIDだけでなく、プロバイダーID`openai`によって制限されます。以前のGPT-4.xモデルには適用されません。

ネイティブCodex app-serverハーネスは、開発者指示を通じてペルソナ／ツール規律の動作契約や親しみやすい対話スタイルのオーバーレイを受け取りません。ネイティブCodexではCodexが所有するベース、モデル、プロジェクトドキュメントの動作が維持され、OpenClawはネイティブスレッドでCodexの組み込みパーソナリティを無効にするため、エージェントワークスペースのパーソナリティファイルが引き続き最優先となります。OpenClawがネイティブCodexスレッドに追加するのは、チャンネル配信、OpenClawの動的ツール、ACP委任、ワークスペースコンテキスト、OpenClawのSkillsというランタイムコンテキストのみです。この同じ追加内容に含まれるHeartbeatガイダンステキストだけは例外です。ネイティブCodexのHeartbeatターンには、共通のプロンプト追加フックではなく、専用のコラボレーション指示として挿入されます。

GPT-5への追加内容は、該当するOpenClaw組み立て済みプロンプトに対して、ペルソナの維持、実行の安全性、ツール規律、出力形式、完了確認、検証に関するタグ付き動作契約を追加します。チャンネル固有の返信動作とサイレントメッセージ動作は、共通のOpenClawシステムプロンプトと送信配信ポリシーに残ります。親しみやすい対話スタイルのレイヤーは独立しており、設定可能です。

| 値                     | 効果                                             |
| ---------------------- | ------------------------------------------------ |
| `"friendly"`（デフォルト） | 親しみやすい対話スタイルのレイヤーを有効にする |
| `"on"`                 | `"friendly"`のエイリアス                         |
| `"off"`                | 親しみやすいスタイルのレイヤーのみを無効にする   |

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
実行時には値の大文字と小文字が区別されないため、`"Off"`と`"off"`のどちらでも親しみやすいスタイルのレイヤーが無効になります。
</Tip>

<Note>
共通設定`agents.defaults.promptOverlays.gpt5.personality`が未設定の場合、互換性のためのフォールバックとして、レガシー設定`plugins.entries.openai.config.personality`が引き続き読み込まれます。
</Note>

## 音声と発話

<AccordionGroup>
  <Accordion title="音声合成（TTS）">
    バンドルされた`openai` Pluginは、`messages.tts`サーフェスに音声合成を登録します。

    | 設定         | 設定パス                                              | デフォルト                                  |
    | ------------ | ----------------------------------------------------- | ------------------------------------------- |
    | モデル       | `messages.tts.providers.openai.model`                 | `gpt-4o-mini-tts`                           |
    | 音声         | `messages.tts.providers.openai.speakerVoice`          | `coral`                                     |
    | 速度         | `messages.tts.providers.openai.speed`                 | （未設定）                                  |
    | 指示         | `messages.tts.providers.openai.instructions`          | （未設定、`gpt-4o-mini-tts`のみ）           |
    | 形式         | `messages.tts.providers.openai.responseFormat`        | ボイスメモは`opus`、ファイルは`mp3`         |
    | APIキー      | `messages.tts.providers.openai.apiKey`                | `OPENAI_API_KEY`にフォールバック            |
    | ベースURL    | `messages.tts.providers.openai.baseUrl`               | `https://api.openai.com/v1`                 |
    | 追加ボディ   | `messages.tts.providers.openai.extraBody` / `extra_body` | （未設定）                               |

    利用可能なモデル：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。利用可能な音声：
    `alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、
    `marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody`は、OpenClawが生成したフィールドの後に`/audio/speech`リクエストのJSONへマージされるため、`lang`などの追加キーを必要とするOpenAI互換エンドポイントに使用してください。プロトタイプキーは無視されます。

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
    チャットAPIエンドポイントに影響を与えずにTTSのベースURLを上書きするには、`OPENAI_TTS_BASE_URL`を設定します。OpenAI TTSとRealtime音声はどちらもOpenAI Platform APIキーを使用して設定されます。OAuthのみのインストールでもCodexベースのチャットモデルは使用できますが、OpenAIのライブ応答音声は使用できません。
    </Note>

  </Accordion>

  <Accordion title="音声テキスト変換">
    バンドルされた`openai` Pluginは、OpenClawのメディア理解文字起こしサーフェスを通じて、バッチ音声テキスト変換を登録します。

    - デフォルトモデル：`gpt-4o-transcribe`
    - エンドポイント：OpenAI REST `/v1/audio/transcriptions`
    - 入力パス：マルチパート音声ファイルのアップロード
    - Discordボイスチャンネルのセグメントやチャンネルの音声添付ファイルなど、受信音声の文字起こしで`tools.media.audio`を読み取るすべての箇所で使用

    受信音声の文字起こしにOpenAIを強制的に使用するには：

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

    言語とプロンプトのヒントは、共通の音声メディア設定または呼び出しごとの文字起こしリクエストで指定された場合、OpenAIに転送されます。

  </Accordion>

  <Accordion title="リアルタイム文字起こし">
    バンドルされた`openai` Pluginは、Voice Call Plugin用のリアルタイム文字起こしを登録します。

    | 設定             | 設定パス                                                           | デフォルト                 |
    | ---------------- | ------------------------------------------------------------------ | -------------------------- |
    | モデル           | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe`      |
    | 言語             | `...openai.language`                                               | （未設定）                 |
    | プロンプト       | `...openai.prompt`                                                 | （未設定）                 |
    | 無音時間         | `...openai.silenceDurationMs`                                      | `800`                      |
    | VADしきい値      | `...openai.vadThreshold`                                           | `0.5`                      |
    | 認証             | `...openai.apiKey`、`OPENAI_API_KEY`、または`openai` APIキープロファイル | Platform APIキーが必要 |

    <Note>
    G.711 u-law（`g711_ulaw` / `audio/pcmu`）音声を使用して、`wss://api.openai.com/v1/realtime`へのWebSocket接続を使用します。`openai` APIキープロファイルの場合、GatewayはWebSocketを開く前に一時的なRealtime文字起こしクライアントシークレットを発行します。このストリーミングプロバイダーはVoice Callのリアルタイム文字起こしパス用です。現在、Discord音声は短いセグメントを録音し、代わりにバッチ`tools.media.audio`文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="リアルタイム音声">
    バンドルされた`openai` Pluginは、Voice Call Plugin用のリアルタイム音声を登録します。

    | 設定                                      | 設定パス                                                               | デフォルト                        |
    | ----------------------------------------- | ---------------------------------------------------------------------- | --------------------------------- |
    | モデル                                    | `plugins.entries.voice-call.config.realtime.providers.openai.model`    | `gpt-realtime-2.1`                |
    | 音声                                      | `...openai.voice`                                                      | `alloy`                           |
    | 温度（Azureデプロイメントブリッジ）       | `...openai.temperature`                                                | `0.8`                             |
    | VADしきい値                               | `...openai.vadThreshold`                                               | `0.5`                             |
    | 無音時間                                  | `...openai.silenceDurationMs`                                          | `500`                             |
    | プレフィックスパディング                  | `...openai.prefixPaddingMs`                                            | `300`                             |
    | 推論エフォート                            | `...openai.reasoningEffort`                                            | （未設定）                        |
    | 認証                                      | `openai` APIキープロファイル、`...openai.apiKey`、または`OPENAI_API_KEY` | OpenAI Platform APIキーが必要 |

    `gpt-realtime-2.1`で利用可能な組み込みRealtime音声：`alloy`、`ash`、
    `ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin`、`cedar`。
    OpenAIは最高のRealtime品質を得るために`marin`と`cedar`を推奨しています。これは上記のテキスト音声合成とは別の音声セットです。`fable`、`nova`、`onyx`などのTTS専用音声はRealtimeセッションでは無効です。
    より小規模で低コストなRealtime 2.1バリアントを使用する場合は、モデルを明示的に`gpt-realtime-2.1-mini`に設定します。

    <Note>
    **GPT-Live（近日提供予定）。** OpenAIの全二重`gpt-live-1`および`gpt-live-1-mini`モデルは、2026年7月にChatGPT音声モードを置き換えました。開発者APIは早期アクセス組織向けに順次提供されています。OpenClawはこのモデルファミリーを認識しますが、まだ実行できません。GPT-LiveセッションはWebRTC専用で、ターンテイキングを自身で管理し（VADなし）、OpenClawのリアルタイムトランスポートがまだ実装していないハンドオフイベントプロトコルを通じてエージェント作業を委任します。`gpt-live-*`モデルを設定すると、エージェントアクセスなしで音声へ暗黙的に接続するのではなく、WebSocketブリッジとTalkブラウザーセッションの両方に関するガイダンスとともに安全側に停止します。早期アクセス期間中は、APIアクセスもOpenAI組織ごとに制限されます。GPT-Liveのサポートが導入されるまでは、`gpt-realtime-2.1`（デフォルト）を使用してください。
    </Note>

    <Note>
    バックエンドのOpenAIリアルタイムブリッジは、`session.temperature`を受け付けないGA Realtime WebSocketセッション形式を使用します。Azure OpenAIデプロイメントは`azureEndpoint`と`azureDeployment`を介して引き続き利用でき、デプロイメント互換のセッション形式（`temperature`を含む）を維持します。双方向ツール呼び出しとG.711 u-law音声をサポートします。
    </Note>

    <Note>
    リアルタイム音声はセッション作成時に選択されます。OpenAIでは、ほとんどのセッションフィールドを後から変更できますが、そのセッションでモデルが音声を出力した後は音声を変更できません。現在、OpenClawは組み込みRealtime音声IDを文字列として公開しています。
    </Note>

    <Note>
    Control UI Talk は、Gateway が発行した一時的なクライアントシークレットと、
    OpenAI Realtime API に対するブラウザからの直接の WebRTC SDP 交換を使用して、
    OpenAI のブラウザリアルタイムセッションを利用します。Gateway は、選択された
    `openai` 認証情報を使用して、そのクライアントシークレットを発行します。
    設定済みのキー、API キープロファイル、`OPENAI_API_KEY` が優先され、
    `openai` OAuth プロファイルまたは外部 Codex ログインがフォールバックになります。
    Gateway リレーと Voice Call バックエンドのリアルタイム WebSocket ブリッジでは、
    OpenAI ネイティブエンドポイントに対して同じ認証情報の優先順位が使用されます。
    メンテナー向けのライブ検証は、
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    で実行できます。OpenAI の処理では、シークレットをログに記録せずに、
    バックエンド WebSocket ブリッジとブラウザの WebRTC SDP 交換の両方を検証します。
    Google の認証情報なしでこれら 2 つの処理を実行するには、`--openai-only` を渡します。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI エンドポイント

同梱の `openai` プロバイダーでは、ベース URL を上書きすることで、画像生成の対象を
Azure OpenAI リソースに設定できます。画像生成パスでは、OpenClaw が
`models.providers.openai.baseUrl` の Azure ホスト名を検出し、Azure のリクエスト形式へ
自動的に切り替えます。

<Note>
リアルタイム音声では、別の設定パス
（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`）
を使用するため、`models.providers.openai.baseUrl` の影響を受けません。Azure の設定については、
[音声と発話](#voice-and-speech) にある **リアルタイム音声** アコーディオンを参照してください。
</Note>

次の場合に Azure OpenAI を使用します。

- Azure OpenAI のサブスクリプション、クォータ、またはエンタープライズ契約をすでに
  所有している
- Azure が提供するリージョン内データ保持またはコンプライアンス制御が必要である
- 既存の Azure テナント内にトラフィックを維持したい

### 設定

同梱の `openai` プロバイダーを介して Azure で画像を生成するには、
`models.providers.openai.baseUrl` に Azure リソースを指定し、`apiKey` に
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

OpenClaw は、Azure 画像生成ルートで次の Azure ホストサフィックスを認識します。

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

認識された Azure ホストに対する画像生成リクエストでは、OpenClaw は次の処理を行います。

- `Authorization: Bearer` の代わりに `api-key` ヘッダーを送信する
- デプロイメント単位のパス（`/openai/deployments/{deployment}/...`）を使用する
- 各リクエストに `?api-version=...` を追加する
- Azure 画像生成呼び出しのデフォルトのリクエストタイムアウトとして 600s を使用する。
  呼び出しごとの `timeoutMs` 値は、引き続きこのデフォルトを上書きします。

その他のベース URL（公開 OpenAI、OpenAI 互換プロキシ）では、標準の
OpenAI 画像リクエスト形式が維持されます。

<Note>
`openai` プロバイダーの画像生成パスで Azure ルーティングを使用するには、
OpenClaw 2026.4.22 以降が必要です。それより前のバージョンでは、カスタム
`openai.baseUrl` が公開 OpenAI エンドポイントと同様に扱われるため、Azure の画像
デプロイメントに対するリクエストは失敗します。
</Note>

### API バージョン

Azure 画像生成パスで特定の Azure プレビュー版または GA 版に固定するには、
`AZURE_OPENAI_API_VERSION` を設定します。

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

この変数が未設定の場合、デフォルトは `2024-12-01-preview` です。

### モデル名はデプロイメント名

Azure OpenAI では、モデルがデプロイメントに関連付けられます。同梱の `openai`
プロバイダーを介してルーティングされる Azure 画像生成リクエストでは、OpenClaw の
`model` フィールドに、公開 OpenAI モデル ID ではなく、Azure ポータルで設定した
**Azure デプロイメント名**を指定する必要があります。

`gpt-image-2` を提供する `gpt-image-2-prod` というデプロイメントを作成した場合：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="すっきりしたポスター" size=1024x1024 count=1
```

同じデプロイメント名の規則は、同梱の `openai` プロバイダーを介してルーティングされる
すべての画像生成呼び出しに適用されます。

### リージョン別の提供状況

Azure の画像生成は現在、一部のリージョン（たとえば `eastus2`、
`swedencentral`、`polandcentral`、`westus3`、`uaenorth`）でのみ利用できます。
デプロイメントを作成する前に Microsoft の最新のリージョン一覧を確認し、使用する
リージョンで対象モデルが提供されていることを確認してください。

### パラメーターの違い

Azure OpenAI と公開 OpenAI では、常に同じ画像パラメーターが受け入れられるとは
限りません。Azure では、公開 OpenAI で許可されているオプション（たとえば
`gpt-image-2` の特定の `background` 値）が拒否される場合や、特定のモデル
バージョンでのみ公開される場合があります。これらの違いは Azure と基盤モデルに由来するもので、
OpenClaw によるものではありません。Azure リクエストが検証エラーで失敗した場合は、
Azure ポータルで、対象のデプロイメントと API バージョンがサポートするパラメーターセットを
確認してください。

<Note>
Azure OpenAI はネイティブのトランスポートと互換動作を使用しますが、OpenClaw の非表示の
帰属ヘッダーは受け取りません。[高度な設定](#advanced-configuration) にある
**ネイティブと OpenAI 互換ルートの比較**アコーディオンを参照してください。

Azure でチャットまたは Responses トラフィック（画像生成以外）を使用する場合は、
オンボーディングフローまたは専用の Azure プロバイダー設定を使用してください。
`openai.baseUrl` だけでは、Azure の API／認証形式は適用されません。別途
`azure-openai-responses/*` プロバイダーが用意されています。後述のサーバー側
Compaction アコーディオンを参照してください。
</Note>

## 高度な設定

以下のモデルごとの `params` の例は、OpenClaw に組み込まれたプロバイダーリクエストの
形式を定めます。これらの設定は明示的に作成されたリクエスト動作となるため、それ以外の条件では
対象となる `auto` ルートでも、暗黙的に Codex を選択せず OpenClaw 上に留まります。
ネイティブ Codex app-server ハーネスは、独自のトランスポートとリクエスト設定を管理します。
明示的な `agentRuntime.id: "codex"` は、有効なルートが Codex 互換として宣言されて
いない場合、フェイルクローズします。

<AccordionGroup>
  <Accordion title="トランスポート（WebSocket と SSE）">
    OpenClaw は `openai/*` に対して、WebSocket 優先、SSE フォールバック（`"auto"`）を使用します。

    `"auto"` モードでは、OpenClaw は次の処理を行います。
    - SSE にフォールバックする前に、初期の WebSocket 障害を 1 回再試行する
    - 障害後、WebSocket を 60 秒間縮退状態としてマークし、クールダウン中は SSE を使用する
    - 再試行と再接続のために、安定したセッションおよびターン識別ヘッダーを付加する
    - トランスポートの種類をまたいで使用量カウンター（`input_tokens` / `prompt_tokens`）を
      正規化する

    | 値                   | 動作                                 |
    | ---------------------- | ------------------------------------ |
    | `"auto"`（デフォルト） | WebSocket 優先、SSE フォールバック |
    | `"sse"`              | SSE のみを強制                       |
    | `"websocket"`        | WebSocket のみを強制                 |

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

    関連する OpenAI ドキュメント：
    - [WebSocket を使用する Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [API レスポンスのストリーミング（SSE）](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="高速モード">
    OpenClaw は `openai/*` 向けに共通の高速モード切り替えを提供します。

    - **チャット／UI：** `/fast status|auto|on|off`
    - **設定：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    有効にすると、OpenClaw は高速モードを OpenAI の優先処理
    （`service_tier = "priority"`）に対応付けます。既存の `service_tier` 値は
    維持され、高速モードによって `reasoning` または `text.verbosity` が書き換えられる
    ことはありません。`fastMode: "auto"` では、自動カットオフまで新しいモデル呼び出しを
    高速で開始し、その後の再試行、フォールバック、ツール結果、または継続呼び出しは
    高速モードなしで開始します。カットオフのデフォルトは 60 秒です。変更するには、
    アクティブなモデルで `params.fastAutoOnSeconds` を設定します。

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
    セッションの上書き設定は、設定ファイルより優先されます。Sessions UI でセッションの
    上書き設定をクリアすると、セッションは設定済みのデフォルトに戻ります。
    </Note>

  </Accordion>

  <Accordion title="優先処理（service_tier）">
    OpenAI の API は、`service_tier` を介して優先処理を提供します。OpenClaw で
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

    サポートされる値：`auto`、`default`、`flex`、`priority`。

    <Warning>
    `serviceTier` は、ネイティブ OpenAI エンドポイント（`api.openai.com`）および
    ネイティブ Codex エンドポイント（`chatgpt.com/backend-api`）にのみ転送されます。
    いずれかのプロバイダーをプロキシ経由でルーティングする場合、OpenClaw は
    `service_tier` を変更しません。
    </Warning>

  </Accordion>

  <Accordion title="サーバー側 Compaction（Responses API）">
    OpenAI Responses モデルに直接接続する場合（`api.openai.com` 上の `openai/*`）、
    OpenAI Plugin の OpenClaw ストリームラッパーはサーバー側 Compaction を自動的に
    有効化します。

    - `store: true` を強制する（モデル互換設定で `supportsStore: false` が設定されている場合を除く）
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` を挿入する
    - デフォルトの `compact_threshold`：`contextWindow` の 70%（取得できない場合は `80000`）

    これは、OpenClaw に組み込まれたランタイムパスと、埋め込み実行で使用される OpenAI
    プロバイダーフックに適用されます。ネイティブ Codex app-server ハーネスは Codex を
    介して独自のコンテキストを管理するため、この設定の影響を受けません。

    <Tabs>
      <Tab title="明示的に有効化">
        Azure OpenAI Responses などの互換エンドポイントに役立ちます。

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
    OpenAI Responses モデルへの直接接続では、互換設定で `supportsStore: false` が
    設定されていない限り、引き続き `store: true` が強制されます。
    </Note>

  </Accordion>

  <Accordion title="厳格エージェント型 GPT モード">
    OpenClaw に組み込まれたランタイムを介して実行される `openai` プロバイダーの
    GPT-5 ファミリーモデルでは、OpenClaw はすでに `strict-agentic` と呼ばれる、
    より厳格な実行契約をデフォルトで使用します。解決後のプロバイダーが `openai` で、
    モデル ID が GPT-5 ファミリーに一致する場合、設定で明示的に無効化しない限り、
    自動的に有効になります。

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    サポート対象の経路で `"strict-agentic"` を明示的に設定しても何も変わりません
    （すでにデフォルトです）。サポート対象外のプロバイダー／モデルの組み合わせでは作用しません。

    `strict-agentic` が有効な場合、OpenClaw は次の処理を行います。
    - 大規模な作業に対して `update_plan` を自動的に有効化する
    - 構造的に空のターンまたは推論のみのターンを、表示可能な回答の継続として再試行する
    - 選択されたハーネスが明示的な計画イベントを提供する場合、それを使用する

    OpenClaw は、ターンが計画、進捗更新、最終回答のいずれであるかを判断するために、アシスタントの文章を分類しません。

    <Note>
    この契約は、OpenClaw に組み込まれたエージェントランナー内にのみ存在します。
    独自のターンおよび計画の動作を管理するネイティブ Codex app-server ハーネスには
    適用されません。ネイティブ Codex の実行では、実行契約の設定よりも
    ハーネスの選択のほうが重要です。
    </Note>

  </Accordion>

  <Accordion title="ネイティブ経路と OpenAI 互換経路">
    OpenClaw は、OpenAI、Codex、Azure OpenAI の直接エンドポイントを、
    汎用的な OpenAI 互換の `/v1` プロキシとは異なる方法で扱います。

    **ネイティブ経路**（`openai/*`、Azure OpenAI）:
    - OpenAI の `none` effort をサポートするモデルでのみ
      `reasoning: { effort: "none" }` を維持する
    - `reasoning.effort: "none"` を拒否するモデルまたはプロキシでは、
      無効化された推論を省略する
    - ツールスキーマのデフォルトを strict モードにする
    - 検証済みのネイティブホストでのみ非表示のアトリビューションヘッダーを付加する（Azure
      OpenAI はネイティブ経路ですが、これらのヘッダーは付加されません）
    - OpenAI 固有のリクエスト整形（`service_tier`、`store`、
      推論互換性、プロンプトキャッシュのヒント）を維持する

    **プロキシ／互換経路:**
    - より緩やかな互換動作を使用する
    - 非ネイティブの `openai-completions` ペイロードから Completions の `store` を除去する
    - OpenAI 互換 Completions プロキシ向けに、高度な
      `params.extra_body`／`params.extraBody` のパススルー JSON を受け入れる
    - vLLM などの OpenAI 互換 Completions プロキシ向けに
      `params.chat_template_kwargs` を受け入れる
    - strict ツールスキーマやネイティブ専用ヘッダーを強制しない

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
