---
read_when:
    - OpenClaw で OpenAI モデルを使用したい
    - APIキーではなくCodexサブスクリプション認証を使用したい場合
    - GPT-5 エージェントの実行動作をより厳格にする必要があります
summary: OpenClawでAPIキーまたはCodexサブスクリプションを使用してOpenAIを利用する
title: OpenAI
x-i18n:
    generated_at: "2026-05-06T09:08:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: b5606cafb8dfec888b922874202aa0fdcad8cbd4fec1a1e15a9074ad14bc5486
    source_path: providers/openai.md
    workflow: 16
---

OpenAI は GPT モデル向けの開発者 API を提供しており、Codex も OpenAI の Codex クライアントを通じて、ChatGPT プランのコーディングエージェントとして利用できます。OpenClaw は、設定を予測可能に保つためにこれらのサーフェスを分離しています。

OpenClaw は OpenAI ファミリーの 3 つのルートをサポートしています。Codex の挙動を使いたいほとんどの ChatGPT/Codex サブスクライバーは、ネイティブ Codex app-server ランタイムを使うべきです。モデルプレフィックスはプロバイダー/モデル名を選択し、別のランタイム設定が埋め込みエージェントループを誰が実行するかを選択します。

- **API キー** - 使用量ベースの課金による OpenAI Platform への直接アクセス（`openai/*` モデル）
- **ネイティブ Codex ランタイム付き Codex サブスクリプション** - ChatGPT/Codex サインインと Codex app-server 実行（`openai/*` モデルと `agents.defaults.agentRuntime.id: "codex"`）
- **PI 経由の Codex サブスクリプション** - 通常の OpenClaw PI ランナーでの ChatGPT/Codex サインイン（`openai-codex/*` モデル）

OpenAI は、OpenClaw のような外部ツールやワークフローでのサブスクリプション OAuth 利用を明示的にサポートしています。

プロバイダー、モデル、ランタイム、チャンネルは別々のレイヤーです。これらのラベルが混同されている場合は、設定を変更する前に [Agent ランタイム](/ja-JP/concepts/agent-runtimes) を読んでください。

## クイック選択

| 目的                                                 | 使用                                             | 注記                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| ネイティブ Codex ランタイム付き ChatGPT/Codex サブスクリプション | `openai/gpt-5.5` と `agentRuntime.id: "codex"` | ほとんどのユーザーに推奨される Codex セットアップです。`openai-codex` 認証でサインインします。 |
| 直接 API キー課金                               | `openai/gpt-5.5`                                 | `OPENAI_API_KEY` を設定するか、OpenAI API キーのオンボーディングを実行します。                    |
| PI 経由の ChatGPT/Codex サブスクリプション認証           | `openai-codex/gpt-5.5`                           | 通常の PI ランナーを意図的に使いたい場合にのみ使用してください。                |
| 画像生成または編集                          | `openai/gpt-image-2`                             | `OPENAI_API_KEY` または OpenAI Codex OAuth のどちらでも動作します。                 |
| 透明背景画像                        | `openai/gpt-image-1.5`                           | `outputFormat=png` または `webp` と `openai.background=transparent` を使用します。     |

## 名前の対応表

名前は似ていますが、相互に置き換えられるものではありません。

| 表示される名前                       | レイヤー             | 意味                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | プロバイダープレフィックス   | OpenAI Platform API への直接ルート。                                                                 |
| `openai-codex`                     | プロバイダープレフィックス   | 通常の OpenClaw PI ランナーを経由する OpenAI Codex OAuth/サブスクリプションルート。                      |
| `codex` plugin                     | Plugin            | ネイティブ Codex app-server ランタイムと `/codex` チャットコントロールを提供する同梱 OpenClaw Plugin。 |
| `agentRuntime.id: codex`           | エージェントランタイム     | 埋め込みターンにネイティブ Codex app-server ハーネスを強制します。                                     |
| `/codex ...`                       | チャットコマンドセット  | 会話から Codex app-server スレッドをバインド/制御します。                                        |
| `runtime: "acp", agentId: "codex"` | ACP セッションルート | ACP/acpx 経由で Codex を実行する明示的なフォールバックパス。                                          |

つまり、設定に `openai-codex/*` と `codex` plugin の両方が意図的に含まれていてもかまいません。PI 経由で Codex OAuth を使い、さらにネイティブの `/codex` チャットコントロールも利用したい場合には有効です。`openclaw doctor` はその組み合わせについて警告し、それが意図したものか確認できるようにしますが、書き換えは行いません。

<Note>
GPT-5.5 は、OpenAI Platform の直接 API キーアクセスとサブスクリプション/OAuth ルートの両方で利用できます。ChatGPT/Codex サブスクリプションとネイティブ Codex 実行を組み合わせる場合は、`agentRuntime.id: "codex"` とともに `openai/gpt-5.5` を使用します。PI 経由の Codex OAuth には `openai-codex/gpt-5.5` のみを使用し、直接 `OPENAI_API_KEY` トラフィックには Codex ランタイムのオーバーライドなしで `openai/gpt-5.5` を使用してください。
</Note>

<Note>
OpenAI plugin を有効にしたり、`openai-codex/*` モデルを選択したりしても、同梱の Codex app-server plugin は有効になりません。OpenClaw は、`agentRuntime.id: "codex"` でネイティブ Codex ハーネスを明示的に選択した場合、またはレガシーの `codex/*` モデル参照を使用した場合にのみ、その plugin を有効にします。
同梱の `codex` plugin が有効でも `openai-codex/*` が引き続き PI 経由で解決される場合、`openclaw doctor` は警告してルートを変更せずに残します。
</Note>

## OpenClaw 機能カバレッジ

| OpenAI の機能         | OpenClaw サーフェス                                           | 状態                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | `openai/<model>` モデルプロバイダー                            | 対応                                                    |
| Codex サブスクリプションモデル | `openai-codex/<model>` と `openai-codex` OAuth           | 対応                                                    |
| Codex app-server ハーネス  | `openai/<model>` と `agentRuntime.id: codex`             | 対応                                                    |
| サーバー側 Web 検索    | ネイティブ OpenAI Responses ツール                               | 対応、Web 検索が有効でプロバイダーが固定されていない場合 |
| 画像                    | `image_generate`                                           | 対応                                                    |
| 動画                    | `video_generate`                                           | 対応                                                    |
| テキスト読み上げ            | `messages.tts.provider: "openai"` / `tts`                  | 対応                                                    |
| バッチ音声認識      | `tools.media.audio` / メディア理解                  | 対応                                                    |
| ストリーミング音声認識  | Voice Call `streaming.provider: "openai"`                  | 対応                                                    |
| リアルタイム音声            | Voice Call `realtime.provider: "openai"` / Control UI Talk | 対応                                                    |
| 埋め込み                | メモリ埋め込みプロバイダー                                  | 対応                                                    |

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

非対称な埋め込みラベルを必要とする OpenAI 互換エンドポイントでは、`memorySearch` の下に `queryInputType` と `documentInputType` を設定します。OpenClaw はこれらをプロバイダー固有の `input_type` リクエストフィールドとして転送します。クエリ埋め込みは `queryInputType` を使用し、インデックス化されたメモリチャンクとバッチインデックス作成は `documentInputType` を使用します。完全な例については、[メモリ設定リファレンス](/ja-JP/reference/memory-config#provider-specific-config) を参照してください。

## はじめに

好みの認証方法を選択し、セットアップ手順に従ってください。

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

    | モデル参照              | ランタイム設定             | ルート                       | 認証             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | 省略 / `agentRuntime.id: "pi"`    | 直接 OpenAI Platform API  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | 省略 / `agentRuntime.id: "pi"`    | 直接 OpenAI Platform API  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Codex app-server ハーネス    | Codex app-server |

    <Note>
    `openai/*` は、Codex app-server ハーネスを明示的に強制しない限り、直接 OpenAI API キールートです。デフォルトの PI ランナー経由の Codex OAuth には `openai-codex/*` を使用し、ネイティブ Codex app-server 実行には `agentRuntime.id: "codex"` とともに `openai/gpt-5.5` を使用してください。
    </Note>

    ### 設定例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw は `openai/gpt-5.3-codex-spark` を公開していません。実際の OpenAI API リクエストはそのモデルを拒否し、現在の Codex カタログでも公開されていません。
    </Warning>

  </Tab>

  <Tab title="Codex サブスクリプション">
    **最適な用途:** 別個の API キーではなく、ChatGPT/Codex サブスクリプションをネイティブ Codex app-server 実行で使用する場合。Codex クラウドには ChatGPT サインインが必要です。

    <Steps>
      <Step title="Codex OAuth を実行する">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        または OAuth を直接実行します。

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        ヘッドレス環境やコールバックを受けにくいセットアップでは、localhost ブラウザーコールバックの代わりに ChatGPT のデバイスコードフローでサインインするため、`--device-code` を追加します。

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
      <Step title="Codex 認証が利用可能であることを確認する">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Gateway の実行後、チャットで `/codex status` または `/codex models` を送信して、ネイティブ app-server ランタイムを確認します。
      </Step>
    </Steps>

    ### ルート概要

    | モデル参照 | ランタイム設定 | ルート | 認証 |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | ネイティブ Codex app-server ハーネス | Codex サインインまたは選択された `openai-codex` プロファイル |
    | `openai-codex/gpt-5.5` | 省略 / `runtime: "pi"` | PI 経由の ChatGPT/Codex OAuth | Codex サインイン |
    | `openai-codex/gpt-5.4-mini` | 省略 / `runtime: "pi"` | PI 経由の ChatGPT/Codex OAuth | Codex サインイン |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | plugin が `openai-codex` を明示的に要求しない限り、引き続き PI | Codex サインイン |

    <Warning>
    古い `openai-codex/gpt-5.1*`、`openai-codex/gpt-5.2*`、または `openai-codex/gpt-5.3*` モデル参照を設定しないでください。ChatGPT/Codex OAuth アカウントは現在、これらのモデルを拒否します。PI OAuth ルートには `openai-codex/gpt-5.5` を使用し、ネイティブ Codex ランタイム実行には `agentRuntime.id: "codex"` とともに `openai/gpt-5.5` を使用してください。
    </Warning>

    <Note>
    認証/profile コマンドでは、引き続き `openai-codex` provider id を使用します。`openai-codex/*` model prefix は、Codex OAuth の明示的な PI ルートでもあります。これは、バンドルされた Codex app-server ハーネスを選択したり、自動有効化したりしません。一般的なサブスクリプションとネイティブ runtime のセットアップでは、`openai-codex` でサインインしますが、モデル ref は `openai/gpt-5.5` のままにし、`agentRuntime.id: "codex"` を設定します。
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

    代わりに Codex OAuth を通常の PI runner で使い続けるには、`openai-codex/gpt-5.5` を使用し、Codex runtime override を省略します。

    <Note>
    オンボーディングは、`~/.codex` から OAuth material をインポートしなくなりました。ブラウザー OAuth (デフォルト) または上記の device-code フローでサインインしてください。OpenClaw は、生成された認証情報を独自の agent auth store で管理します。
    </Note>

    ### ステータスインジケーター

    Chat `/status` は、現在のセッションで有効なモデル runtime を表示します。デフォルトの PI ハーネスは `Runtime: OpenClaw Pi Default` として表示されます。バンドルされた Codex app-server ハーネスが選択されている場合、`/status` は `Runtime: OpenAI Codex` を表示します。既存のセッションは記録済みの harness id を保持するため、`agentRuntime` を変更した後に `/status` に新しい PI/Codex の選択を反映させたい場合は、`/new` または `/reset` を使用してください。

    ### Doctor 警告

    バンドルされた `codex` Plugin が有効で、`openai-codex/*` ルートが選択されている場合、`openclaw doctor` はモデルが引き続き PI 経由で解決されることを警告します。その PI subscription-auth ルートが意図的な場合にのみ、設定を変更せずに維持してください。ネイティブ Codex app-server 実行を使いたい場合は、`openai/<model>` と `agentRuntime.id: "codex"` に切り替えてください。

    ### コンテキストウィンドウ上限

    OpenClaw は、モデルメタデータと runtime context cap を別々の値として扱います。

    Codex OAuth 経由の `openai-codex/gpt-5.5` の場合:

    - ネイティブ `contextWindow`: `1000000`
    - デフォルト runtime `contextTokens` 上限: `272000`

    小さいデフォルト上限のほうが、実用上のレイテンシと品質特性に優れています。`contextTokens` で上書きできます。

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
    ネイティブモデルメタデータを宣言するには `contextWindow` を使用します。runtime context budget を制限するには `contextTokens` を使用します。
    </Note>

    ### カタログ復旧

    OpenClaw は、`gpt-5.5` が存在する場合、upstream Codex カタログメタデータを使用します。アカウントが認証済みであるにもかかわらず、live Codex discovery が `openai-codex/gpt-5.5` 行を省略した場合、OpenClaw はその OAuth モデル行を合成し、cron、sub-agent、設定済み default-model の実行が `Unknown model` で失敗しないようにします。

  </Tab>
</Tabs>

## ネイティブ Codex app-server 認証

ネイティブ Codex app-server ハーネスは、`openai/*` モデル ref と `agentRuntime.id: "codex"` を使用しますが、認証は引き続きアカウントベースです。OpenClaw は次の順序で認証を選択します。

1. agent にバインドされた明示的な OpenClaw `openai-codex` 認証 profile。
2. local Codex CLI ChatGPT サインインなど、app-server の既存アカウント。
3. local stdio app-server 起動の場合のみ、app-server がアカウントなしを報告し、OpenAI 認証を引き続き要求するときは、`CODEX_API_KEY`、次に `OPENAI_API_KEY`。

つまり、gateway プロセスにも直接 OpenAI モデルまたは embeddings 用の `OPENAI_API_KEY` があるという理由だけで、local ChatGPT/Codex サブスクリプションのサインインが置き換えられることはありません。Env API-key fallback は、local stdio のアカウントなしパスでのみ使用されます。WebSocket app-server 接続には送信されません。サブスクリプション形式の Codex profile が選択されている場合、OpenClaw は spawned stdio app-server child から `CODEX_API_KEY` と `OPENAI_API_KEY` も除外し、選択された認証情報を app-server login RPC 経由で送信します。

## 画像生成

バンドルされた `openai` Plugin は、`image_generate` ツールを通じて画像生成を登録します。
同じ `openai/gpt-image-2` モデル ref を通じて、OpenAI API-key 画像生成と Codex OAuth 画像生成の両方をサポートします。

| 機能                      | OpenAI API key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| モデル ref                | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 認証                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth サインイン        |
| トランスポート            | OpenAI Images API                  | Codex Responses backend              |
| リクエストあたりの最大画像数 | 4                                  | 4                                    |
| 編集モード                | 有効 (最大 5 枚の参照画像)         | 有効 (最大 5 枚の参照画像)           |
| サイズ上書き              | 2K/4K サイズを含めてサポート       | 2K/4K サイズを含めてサポート         |
| アスペクト比 / 解像度     | OpenAI Images API には転送されない | 安全な場合は対応サイズにマップ       |

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
共有ツールパラメーター、provider 選択、failover 動作については、[画像生成](/ja-JP/tools/image-generation) を参照してください。
</Note>

`gpt-image-2` は、OpenAI text-to-image 生成と画像編集の両方のデフォルトです。`gpt-image-1.5`、`gpt-image-1`、`gpt-image-1-mini` は、明示的なモデル override として引き続き使用できます。透明背景の PNG/WebP 出力には `openai/gpt-image-1.5` を使用してください。現在の `gpt-image-2` API は `background: "transparent"` を拒否します。

透明背景のリクエストでは、agents は `model: "openai/gpt-image-1.5"`、`outputFormat: "png"` または `"webp"`、および `background: "transparent"` を指定して `image_generate` を呼び出す必要があります。古い `openai.background` provider option も引き続き受け付けられます。OpenClaw は、デフォルトの `openai/gpt-image-2` 透明リクエストを `gpt-image-1.5` に書き換えることで、公開 OpenAI ルートと OpenAI Codex OAuth ルートも保護します。Azure とカスタム OpenAI 互換エンドポイントは、設定済みの deployment/model 名を維持します。

同じ設定は headless CLI 実行にも公開されています。

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

入力ファイルから開始するときは、`openclaw infer image edit` でも同じ `--output-format` および `--background` flags を使用してください。
`--openai-background` は、OpenAI 固有の alias として引き続き利用できます。

Codex OAuth インストールでは、同じ `openai/gpt-image-2` ref を維持してください。`openai-codex` OAuth profile が設定されている場合、OpenClaw は保存済み OAuth access token を解決し、Codex Responses backend 経由で画像リクエストを送信します。そのリクエストに対して、先に `OPENAI_API_KEY` を試したり、API key へ黙って fallback したりすることはありません。代わりに直接 OpenAI Images API ルートを使いたい場合は、API key、カスタム base URL、または Azure endpoint を使用して `models.providers.openai` を明示的に設定してください。
そのカスタム画像エンドポイントが信頼済み LAN/private アドレス上にある場合は、`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` も設定してください。この opt-in が存在しない限り、OpenClaw は private/internal OpenAI 互換画像エンドポイントをブロックしたままにします。

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
| モード           | Text-to-video、image-to-video、single-video edit                                  |
| 参照入力         | 1 image または 1 video                                                            |
| サイズ上書き     | サポート                                                                          |
| その他の上書き   | `aspectRatio`、`resolution`、`audio`、`watermark` はツール警告付きで無視されます |

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
共有ツールパラメーター、provider 選択、failover 動作については、[動画生成](/ja-JP/tools/video-generation) を参照してください。
</Note>

## GPT-5 プロンプト contribution

OpenClaw は、provider をまたぐ GPT-5-family 実行に共有 GPT-5 prompt contribution を追加します。これはモデル ID によって適用されるため、`openai-codex/gpt-5.5`、`openai/gpt-5.5`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5`、およびその他の互換 GPT-5 refs は同じ overlay を受け取ります。古い GPT-4.x モデルには適用されません。

バンドルされたネイティブ Codex ハーネスは、Codex app-server developer instructions を通じて同じ GPT-5 動作と heartbeat overlay を使用するため、`agentRuntime.id: "codex"` で強制された `openai/gpt-5.x` セッションは、Codex が残りの harness prompt を所有していても、同じ follow-through と proactive heartbeat guidance を保持します。

GPT-5 contribution は、persona persistence、execution safety、tool discipline、output shape、completion checks、verification のためのタグ付き behavior contract を追加します。channel 固有の返信および silent-message 動作は、共有 OpenClaw system prompt と outbound delivery policy に残ります。GPT-5 guidance は、一致するモデルでは常に有効です。friendly interaction-style layer は別個であり、設定可能です。

| 値                     | 効果                                               |
| ---------------------- | -------------------------------------------------- |
| `"friendly"` (デフォルト) | friendly interaction-style layer を有効化          |
| `"on"`                 | `"friendly"` の alias                              |
| `"off"`                | friendly style layer のみを無効化                  |

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
値は runtime で大文字小文字を区別しないため、`"Off"` と `"off"` はどちらも friendly style layer を無効化します。
</Tip>

<Note>
共有 `agents.defaults.promptOverlays.gpt5.personality` 設定が設定されていない場合、legacy `plugins.entries.openai.config.personality` は compatibility fallback として引き続き読み取られます。
</Note>

## 音声とスピーチ

<AccordionGroup>
  <Accordion title="音声合成 (TTS)">
    バンドルされた `openai` Plugin は、`messages.tts` surface に音声合成を登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | ボイス | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | (未設定) |
    | 指示 | `messages.tts.providers.openai.instructions` | (未設定、`gpt-4o-mini-tts` のみ) |
    | 形式 | `messages.tts.providers.openai.responseFormat` | ボイスメモでは `opus`、ファイルでは `mp3` |
    | API キー | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` にフォールバック |
    | ベース URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 追加ボディ | `messages.tts.providers.openai.extraBody` / `extra_body` | (未設定) |

    利用可能なモデル: `gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。利用可能なボイス: `alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` は OpenClaw が生成したフィールドの後で `/audio/speech` リクエスト JSON にマージされるため、`lang` などの追加キーを必要とする OpenAI 互換エンドポイントに使用してください。プロトタイプキーは無視されます。

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

  <Accordion title="音声テキスト化">
    バンドルされた `openai` Plugin は、OpenClaw のメディア理解文字起こしサーフェスを通じて、バッチ音声テキスト化を登録します。

    - デフォルトモデル: `gpt-4o-transcribe`
    - エンドポイント: OpenAI REST `/v1/audio/transcriptions`
    - 入力パス: multipart 音声ファイルアップロード
    - Discord ボイスチャンネルのセグメントやチャンネルの音声添付ファイルを含め、受信音声文字起こしが `tools.media.audio` を使用する OpenClaw のあらゆる場所でサポートされます

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

    言語とプロンプトのヒントは、共有音声メディア設定または呼び出しごとの文字起こしリクエストで指定された場合、OpenAI に転送されます。

  </Accordion>

  <Accordion title="リアルタイム文字起こし">
    バンドルされた `openai` Plugin は、Voice Call Plugin 用のリアルタイム文字起こしを登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 言語 | `...openai.language` | (未設定) |
    | プロンプト | `...openai.prompt` | (未設定) |
    | 無音時間 | `...openai.silenceDurationMs` | `800` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | API キー | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    G.711 u-law (`g711_ulaw` / `audio/pcmu`) 音声で `wss://api.openai.com/v1/realtime` への WebSocket 接続を使用します。このストリーミングプロバイダーは Voice Call のリアルタイム文字起こしパス用です。Discord ボイスは現在、短いセグメントを録音し、代わりにバッチ `tools.media.audio` 文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="リアルタイム音声">
    バンドルされた `openai` Plugin は、Voice Call Plugin 用のリアルタイム音声を登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | ボイス | `...openai.voice` | `alloy` |
    | 温度 | `...openai.temperature` | `0.8` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | 無音時間 | `...openai.silenceDurationMs` | `500` |
    | API キー | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    バックエンドのリアルタイムブリッジ向けに、`azureEndpoint` と `azureDeployment` 設定キー経由で Azure OpenAI をサポートします。双方向ツール呼び出しをサポートします。G.711 u-law 音声形式を使用します。
    </Note>

    <Note>
    Control UI Talk は、Gateway が発行した一時的なクライアントシークレットと、OpenAI Realtime API に対するブラウザーからの直接の WebRTC SDP 交換を使用して、OpenAI ブラウザーリアルタイムセッションを使用します。メンテナーによるライブ検証は `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` で利用できます。OpenAI 側は Node でクライアントシークレットを発行し、偽のマイクメディアでブラウザー SDP オファーを生成し、それを OpenAI に投稿して、シークレットをログ出力せずに SDP アンサーを適用します。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI エンドポイント

バンドルされた `openai` プロバイダーは、ベース URL を上書きすることで、画像生成用に Azure OpenAI リソースを対象にできます。画像生成パスでは、OpenClaw は `models.providers.openai.baseUrl` の Azure ホスト名を検出し、Azure のリクエスト形式に自動的に切り替えます。

<Note>
リアルタイム音声は別の設定パス (`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`) を使用し、`models.providers.openai.baseUrl` の影響を受けません。Azure 設定については、[音声とスピーチ](#voice-and-speech) の下にある **リアルタイム音声** アコーディオンを参照してください。
</Note>

Azure OpenAI は次の場合に使用します:

- すでに Azure OpenAI のサブスクリプション、クォータ、またはエンタープライズ契約がある
- Azure が提供するリージョン内データ所在地やコンプライアンス制御が必要
- 既存の Azure テナンシー内にトラフィックを維持したい

### 設定

バンドルされた `openai` プロバイダーを通じて Azure 画像生成を行うには、`models.providers.openai.baseUrl` を Azure リソースに向け、`apiKey` を Azure OpenAI キー (OpenAI Platform キーではありません) に設定します:

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

OpenClaw は Azure 画像生成ルート用に次の Azure ホストサフィックスを認識します:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

認識された Azure ホストでの画像生成リクエストでは、OpenClaw は次を行います:

- `Authorization: Bearer` の代わりに `api-key` ヘッダーを送信します
- デプロイスコープのパス (`/openai/deployments/{deployment}/...`) を使用します
- 各リクエストに `?api-version=...` を追加します
- Azure 画像生成呼び出しには 600 秒のデフォルトリクエストタイムアウトを使用します。呼び出しごとの `timeoutMs` 値は引き続きこのデフォルトを上書きします。

その他のベース URL (公開 OpenAI、OpenAI 互換プロキシ) は標準の OpenAI 画像リクエスト形式を維持します。

<Note>
`openai` プロバイダーの画像生成パスでの Azure ルーティングには OpenClaw 2026.4.22 以降が必要です。以前のバージョンでは、カスタム `openai.baseUrl` は公開 OpenAI エンドポイントと同様に扱われ、Azure 画像デプロイに対して失敗します。
</Note>

### API バージョン

Azure 画像生成パス用に特定の Azure プレビュー版または GA バージョンを固定するには、`AZURE_OPENAI_API_VERSION` を設定します:

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

同じデプロイ名ルールは、バンドルされた `openai` プロバイダーを通じてルーティングされる画像生成呼び出しにも適用されます。

### リージョンでの利用可否

Azure 画像生成は現在、一部のリージョンでのみ利用できます (例: `eastus2`、`swedencentral`、`polandcentral`、`westus3`、`uaenorth`)。デプロイを作成する前に Microsoft の現在のリージョン一覧を確認し、特定のモデルが自分のリージョンで提供されていることを確認してください。

### パラメーターの違い

Azure OpenAI と公開 OpenAI は、常に同じ画像パラメーターを受け付けるとは限りません。Azure は公開 OpenAI が許可するオプションを拒否する場合 (たとえば `gpt-image-2` の特定の `background` 値) や、特定のモデルバージョンでのみ公開する場合があります。これらの違いは Azure と基盤モデルに由来するもので、OpenClaw に由来するものではありません。Azure リクエストが検証エラーで失敗した場合は、特定のデプロイと API バージョンでサポートされているパラメーターセットを Azure ポータルで確認してください。

<Note>
Azure OpenAI はネイティブトランスポートと互換動作を使用しますが、OpenClaw の隠しアトリビューションヘッダーは受け取りません。詳細は [高度な設定](#advanced-configuration) の下にある **ネイティブと OpenAI 互換ルート** アコーディオンを参照してください。

Azure でのチャットまたは Responses トラフィック (画像生成を超えるもの) には、オンボーディングフローまたは専用の Azure プロバイダー設定を使用してください。`openai.baseUrl` だけでは Azure API/認証形式は適用されません。別の `azure-openai-responses/*` プロバイダーが存在します。下のサーバー側 Compaction アコーディオンを参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="トランスポート (WebSocket と SSE)">
    OpenClaw は `openai/*` と `openai-codex/*` の両方で、SSE フォールバック付きの WebSocket 優先 (`"auto"`) を使用します。

    `"auto"` モードでは、OpenClaw は次を行います:
    - SSE にフォールバックする前に、初期の WebSocket 失敗を 1 回再試行します
    - 失敗後、WebSocket を約 60 秒間低下状態としてマークし、クールダウン中は SSE を使用します
    - 再試行と再接続のために安定したセッションおよびターン識別ヘッダーを付加します
    - トランスポートバリアント間で使用量カウンター (`input_tokens` / `prompt_tokens`) を正規化します

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
    OpenClaw は `openai/*` と `openai-codex/*` で、最初のターンのレイテンシーを減らすため、デフォルトで WebSocket ウォームアップを有効にします。

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
    OpenClaw は `openai/*` と `openai-codex/*` 向けに共有の高速モード切り替えを公開します:

    - **チャット/UI:** `/fast status|on|off`
    - **設定:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    有効にすると、OpenClaw は高速モードを OpenAI の優先処理 (`service_tier = "priority"`) に対応付けます。既存の `service_tier` 値は保持され、高速モードは `reasoning` や `text.verbosity` を書き換えません。

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
    セッションの上書きは設定より優先されます。Sessions UI でセッション上書きをクリアすると、セッションは設定されたデフォルトに戻ります。
    </Note>

  </Accordion>

  <Accordion title="優先処理 (service_tier)">
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

    サポートされる値: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` はネイティブ OpenAI エンドポイント (`api.openai.com`) とネイティブ Codex エンドポイント (`chatgpt.com/backend-api`) にのみ転送されます。いずれかのプロバイダーをプロキシ経由でルーティングする場合、OpenClaw は `service_tier` を変更しません。
    </Warning>

  </Accordion>

  <Accordion title="サーバー側 Compaction (Responses API)">
    直接の OpenAI Responses モデル (`openai/*` on `api.openai.com`) では、OpenAI Plugin の Pi ハーネスストリームラッパーがサーバー側 Compaction を自動的に有効化します。

    - `store: true` を強制します (モデル互換設定で `supportsStore: false` が設定されている場合を除く)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` を挿入します
    - デフォルトの `compact_threshold`: `contextWindow` の 70% (利用できない場合は `80000`)

    これは組み込みの Pi ハーネスパスと、埋め込み実行で使われる OpenAI プロバイダーフックに適用されます。ネイティブ Codex アプリサーバーハーネスは Codex を通じて独自のコンテキストを管理し、`agents.defaults.agentRuntime.id` で別途設定されます。

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
    `responsesServerCompaction` は `context_management` の挿入のみを制御します。直接の OpenAI Responses モデルでは、互換設定で `supportsStore: false` が設定されていない限り、引き続き `store: true` が強制されます。
    </Note>

  </Accordion>

  <Accordion title="厳格なエージェント型 GPT モード">
    `openai/*` での GPT-5 ファミリーの実行では、OpenClaw はより厳格な埋め込み実行コントラクトを使用できます。

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
    - ツールアクションが利用可能な場合、計画のみのターンを成功した進捗として扱わなくなります
    - 今すぐ実行するよう誘導してターンを再試行します
    - 大きな作業では `update_plan` を自動的に有効化します
    - モデルが行動せずに計画を続ける場合、明示的なブロック状態を表示します

    <Note>
    OpenAI と Codex の GPT-5 ファミリーの実行にのみスコープされます。他のプロバイダーや古いモデルファミリーではデフォルトの動作を維持します。
    </Note>

  </Accordion>

  <Accordion title="ネイティブルートと OpenAI 互換ルート">
    OpenClaw は、直接の OpenAI、Codex、Azure OpenAI エンドポイントを、汎用の OpenAI 互換 `/v1` プロキシとは異なるものとして扱います。

    **ネイティブルート** (`openai/*`, Azure OpenAI):
    - OpenAI の `none` effort をサポートするモデルに対してのみ `reasoning: { effort: "none" }` を維持します
    - `reasoning.effort: "none"` を拒否するモデルまたはプロキシでは、無効化された reasoning を省略します
    - ツールスキーマをデフォルトで strict モードにします
    - 検証済みのネイティブホストにのみ隠し attribution ヘッダーを付与します
    - OpenAI 専用のリクエスト整形 (`service_tier`, `store`, reasoning 互換性, prompt-cache ヒント) を維持します

    **プロキシ/互換ルート:**
    - より緩い互換動作を使用します
    - 非ネイティブの `openai-completions` ペイロードから Completions の `store` を取り除きます
    - OpenAI 互換 Completions プロキシ向けに、高度な `params.extra_body`/`params.extraBody` パススルー JSON を受け入れます
    - vLLM などの OpenAI 互換 Completions プロキシ向けに `params.chat_template_kwargs` を受け入れます
    - strict ツールスキーマやネイティブ専用ヘッダーを強制しません

    Azure OpenAI はネイティブトランスポートと互換動作を使用しますが、隠し attribution ヘッダーは受け取りません。

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
