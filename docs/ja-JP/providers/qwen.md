---
read_when:
    - OpenClaw で Qwen を使用する場合
    - Alibaba Cloud Token Plan サブスクリプションを契約している場合
    - 以前は Qwen OAuth を使用していました
summary: OpenClaw Plugin を通じて Qwen Cloud を使用する
title: Qwen
x-i18n:
    generated_at: "2026-07-11T22:38:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 18030a70c024cd5c0713262874f5353bac50576e850f68a61bef4fa73ccf9b9c
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud は、正規 id `qwen` を持つ公式の外部 OpenClaw プロバイダー Plugin です。Qwen Cloud / Alibaba DashScope の Standard および Coding Plan エンドポイントを対象とし、Token Plan を `qwen-token-plan` として公開し、`modelstudio` を互換性エイリアスとして維持します。また、Alibaba が文書化しているカスタムプロバイダー id `bailian-token-plan` を独立して所有し、Qwen Portal のトークンフローを [`qwen-oauth`](/ja-JP/providers/qwen-oauth) として公開します。

| プロパティ             | 値                                         |
| ---------------------- | ------------------------------------------ |
| プロバイダー           | `qwen`                                     |
| Token Plan プロバイダー | `qwen-token-plan`                          |
| Portal プロバイダー    | [`qwen-oauth`](/ja-JP/providers/qwen-oauth)      |
| 推奨環境変数           | `QWEN_API_KEY`                             |
| Token Plan 環境変数    | `QWEN_TOKEN_PLAN_API_KEY`                  |
| 追加で受け付ける値（互換性） | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| API 形式               | OpenAI 互換                                |

<Tip>
`qwen3.7-plus` と `qwen3.6-plus` は、Coding Plan と Standard のエンドポイントで動作します。
`qwen3.7-max` または `qwen3.6-flash` には、**Standard（従量課金）**エンドポイントを使用してください。
</Tip>

## Plugin のインストール

`qwen` は公式の外部 Plugin として提供され、コアにはバンドルされていません。インストールして Gateway を再起動します。

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## はじめに

プラン種別を選択し、セットアップ手順に従ってください。

<Tabs>
  <Tab title="Coding Plan（サブスクリプション）">
    **最適な用途:** Qwen Coding Plan を通じたサブスクリプションベースのアクセス。

    <Steps>
      <Step title="API キーを取得する">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) で API キーを作成またはコピーします。
      </Step>
      <Step title="オンボーディングを実行する">
        **グローバル**エンドポイントの場合:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        **中国**エンドポイントの場合:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    従来の `modelstudio-*` 認証選択肢 id と `modelstudio/...` モデル参照は、
    互換性エイリアスとして引き続き動作しますが、新しいセットアップフローでは正規の
    `qwen-*` 認証選択肢 id と `qwen/...` モデル参照を優先してください。別の `api` 値を持つ
    カスタムの `models.providers.modelstudio` エントリを厳密に定義した場合、その
    カスタムプロバイダーが Qwen の互換性エイリアスに代わって `modelstudio/...` 参照を
    所有します。
    </Note>

  </Tab>

  <Tab title="Standard（従量課金）">
    **最適な用途:** Coding Plan では利用できない `qwen3.7-max` や `qwen3.6-flash` を含む、Standard Model Studio エンドポイントを通じた従量課金アクセス。

    <Steps>
      <Step title="API キーを取得する">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) で API キーを作成またはコピーします。
      </Step>
      <Step title="オンボーディングを実行する">
        **グローバル**エンドポイントの場合:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        **中国**エンドポイントの場合:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    従来の `modelstudio-*` 認証選択肢 id と `modelstudio/...` モデル参照は、
    互換性エイリアスとして引き続き動作しますが、新しいセットアップフローでは正規の
    `qwen-*` 認証選択肢 id と `qwen/...` モデル参照を優先してください。別の `api` 値を持つ
    カスタムの `models.providers.modelstudio` エントリを厳密に定義した場合、その
    カスタムプロバイダーが Qwen の互換性エイリアスに代わって `modelstudio/...` 参照を
    所有します。
    </Note>

  </Tab>

  <Tab title="Token Plan（チーム版）">
    **最適な用途:** Alibaba Cloud Model Studio を通じた、Qwen および対応するサードパーティモデルへのクレジットベースのチームサブスクリプションアクセス。

    <Steps>
      <Step title="専用キーを取得する">
        Token Plan のシートを割り当て、その専用の `sk-sp-...` キーを作成します。Token Plan、Coding Plan、従量課金のキーに互換性はありません。[グローバル Token Plan の概要](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview)または[中国 Token Plan の概要](https://help.aliyun.com/zh/model-studio/token-plan-overview)を参照してください。
      </Step>
      <Step title="オンボーディングを実行する">
        シンガポールの**グローバル / 国際**エンドポイントの場合:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        北京の**中国**エンドポイントの場合:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan-cn
        ```
      </Step>
      <Step title="プロバイダーを確認する">
        ```bash
        openclaw models list --provider qwen-token-plan
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "Reply with: token plan ready"
        ```
      </Step>
    </Steps>

    <Note>
    Alibaba の OpenClaw ガイドでは、手動カスタムプロバイダーに `bailian-token-plan` を
    使用しています。この Plugin はその id を互換性所有者として登録しますが、新しい
    設定では `qwen-token-plan` を使用してください。厳密なカスタム
    `models.providers.bailian-token-plan` エントリは、設定された
    トランスポートとカタログの所有権を維持します。これは正規の OpenAI カタログには
    決して統合されません。
    </Note>

    <Warning>
    Token Plan は対話型 OpenClaw セッションにのみ使用してください。
    Cron ジョブ、無人スクリプト、アプリケーションバックエンドには選択しないでください。
    Alibaba は、非対話型の使用によりサブスクリプションが停止されたり、API キーが
    失効したりする可能性があるとしています。
    </Warning>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **最適な用途:** `https://portal.qwen.ai/v1` に対する Qwen Portal トークン。

    専用のプロバイダーページと移行に関する注意事項については、[Qwen OAuth / Portal](/ja-JP/providers/qwen-oauth)を参照してください。

    <Steps>
      <Step title="Portal トークンを指定する">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen-oauth/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` は Qwen Cloud プロバイダーと同じ `QWEN_API_KEY` 環境変数名を
    使用しますが、OpenClaw のオンボーディングを通じて設定した場合、認証情報は
    `qwen-oauth` プロバイダー id の下に保存されます。
    </Note>

  </Tab>
</Tabs>

## プラン種別とエンドポイント

| プラン                     | リージョン   | 認証選択肢                 | エンドポイント                                                   |
| -------------------------- | ------------ | -------------------------- | ---------------------------------------------------------------- |
| Coding Plan（サブスクリプション） | 中国         | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`                               |
| Coding Plan（サブスクリプション） | グローバル   | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`                          |
| Qwen Portal                | グローバル   | `qwen-oauth`               | `portal.qwen.ai/v1`                                              |
| Standard（従量課金）       | 中国         | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`                      |
| Standard（従量課金）       | グローバル   | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                 |
| Token Plan（チーム版）     | 中国         | `qwen-token-plan-cn`       | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`     |
| Token Plan（チーム版）     | グローバル   | `qwen-token-plan`          | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |

プロバイダーは、認証選択肢に基づいてエンドポイントを自動選択します。正規の
選択肢には `qwen-*` ファミリーを使用し、`modelstudio-*` は互換性用途に限定されます。
設定内のカスタム `baseUrl` で上書きできます。

<Tip>
**キーの管理:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**ドキュメント:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## 組み込みカタログ

OpenClaw には、次の Qwen 静的カタログが付属しています。このカタログはエンドポイントを認識します。Coding
Plan の設定では、Standard エンドポイントでのみ動作するモデルが除外されます。

| モデル参照                  | 入力               | コンテキスト | 備考                         |
| --------------------------- | ------------------ | ------------ | ---------------------------- |
| `qwen/qwen3.5-plus`         | テキスト、画像     | 1,000,000    | デフォルトモデル             |
| `qwen/qwen3.6-flash`        | テキスト、画像     | 1,000,000    | Standard エンドポイントのみ  |
| `qwen/qwen3.6-plus`         | テキスト、画像     | 1,000,000    | Coding Plan + Standard       |
| `qwen/qwen3.7-max`          | テキスト           | 1,000,000    | Standard エンドポイントのみ  |
| `qwen/qwen3.7-plus`         | テキスト、画像     | 1,000,000    | Coding Plan + Standard       |
| `qwen/qwen3-max-2026-01-23` | テキスト           | 262,144      | Qwen Max 系列                |
| `qwen/qwen3-coder-next`     | テキスト           | 262,144      | コーディング                 |
| `qwen/qwen3-coder-plus`     | テキスト           | 1,000,000    | コーディング                 |
| `qwen/MiniMax-M2.5`         | テキスト           | 1,000,000    | 推論が有効                   |
| `qwen/glm-5`                | テキスト           | 202,752      | GLM                          |
| `qwen/glm-4.7`              | テキスト           | 202,752      | GLM                          |
| `qwen/kimi-k2.5`            | テキスト、画像     | 262,144      | Alibaba 経由の Moonshot AI   |
| `qwen-oauth/qwen3.5-plus`   | テキスト、画像     | 1,000,000    | Qwen Portal のデフォルト     |

<Note>
静的カタログにモデルが含まれている場合でも、利用可否はエンドポイントや料金プランによって
異なることがあります。
</Note>

### Token Plan カタログ

Token Plan は、完全一致文字列による個別の許可リストを使用します。画像生成専用のプラン
モデルは異なる API を使用するため、ここには含まれていません。

| モデル参照                          | 入力               | コンテキスト |
| ----------------------------------- | ------------------ | ------------ |
| `qwen-token-plan/qwen3.7-max`       | テキスト           | 1,000,000    |
| `qwen-token-plan/qwen3.7-plus`      | テキスト、画像     | 1,000,000    |
| `qwen-token-plan/qwen3.6-plus`      | テキスト、画像     | 1,000,000    |
| `qwen-token-plan/qwen3.6-flash`     | テキスト、画像     | 1,000,000    |
| `qwen-token-plan/deepseek-v4-pro`   | テキスト           | 1,000,000    |
| `qwen-token-plan/deepseek-v4-flash` | テキスト           | 1,000,000    |
| `qwen-token-plan/deepseek-v3.2`     | テキスト           | 131,072      |
| `qwen-token-plan/kimi-k2.7-code`    | テキスト、画像     | 262,144      |
| `qwen-token-plan/kimi-k2.6`         | テキスト、画像     | 262,144      |
| `qwen-token-plan/kimi-k2.5`         | テキスト、画像     | 262,144      |
| `qwen-token-plan/glm-5.2`           | テキスト           | 1,000,000    |
| `qwen-token-plan/glm-5.1`           | テキスト           | 202,752      |
| `qwen-token-plan/glm-5`             | テキスト           | 202,752      |
| `qwen-token-plan/MiniMax-M2.5`      | テキスト           | 196,608      |

## 思考制御

`qwen3.7-max`、`qwen3.7-plus`、`qwen3.6-flash`、`qwen3.6-plus` は、組み込みカタログで推論が有効になっています。`qwen` ファミリーの推論モデルでは、プロバイダーは OpenClaw の思考レベルを DashScope のトップレベルのリクエストフラグ `enable_thinking` にマッピングします。思考が無効な場合は `enable_thinking: false` を送信し、それ以外のレベルでは `enable_thinking: true` を送信します。カスタムモデルでは、モデルエントリに `compat.thinkingFormat: "qwen-chat-template"` を設定することで、別形式のチャットテンプレート思考ペイロードを使用できます。

Token Plan モデルも推論対応としてマークされています。`kimi-k2.7-code` と `MiniMax-M2.5` は思考専用であるため、セッションで `/think off` が要求された場合でも、OpenClaw は思考を有効に保ちます。DeepSeek V4 は `minimal` から `high` までをサービスの `high` エフォートにマッピングし、`xhigh` または `max` を `max` にマッピングします。GLM 5.2 は `minimal` から `max` までの全範囲を受け付けます。GLM 5.1 と GLM 5 は `xhigh` までを受け付け、3 つすべてのデフォルトは `high` です。その他のハイブリッドモデルは、要求されたオン／オフ状態に従います。

## マルチモーダルアドオン

`qwen` Plugin は、Coding Plan エンドポイントではなく、DashScope の **Standard** エンドポイントでのみマルチモーダル機能を提供します。

- `qwen-vl-max-latest` による **画像と動画の理解**
- `wan2.6-t2v`（デフォルト）、`wan2.6-i2v`、`wan2.6-r2v`、`wan2.6-r2v-flash`、`wan2.7-r2v` による **Wan 動画生成**

メディア理解には、設定済みの Qwen 認証が自動的に使用されるため、追加設定は不要です。メディア理解を機能させるには、Standard（従量課金制）エンドポイントを使用していることを確認してください。

Qwen をデフォルトの動画プロバイダーにするには、次のように設定します。

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

動画生成の制限：1 リクエストにつき出力動画 1 本、入力画像は最大 1 枚（画像から動画）、入力動画は最大 4 本（動画から動画）、最大再生時間は 10 秒です。`size`、`aspectRatio`、`resolution`、`audio`、`watermark` をサポートします。参照画像／動画の入力にはリモートの http(s) URL が必要です。DashScope の動画エンドポイントは、これらの参照用にアップロードされたローカルバッファを受け付けないため、ローカルファイルパスは事前に拒否されます。

<Note>
共通ツールパラメーター、プロバイダーの選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation)を参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="Qwen 3.6 と 3.7 の提供状況">
    `qwen3.7-plus` と `qwen3.6-plus` は、Coding Plan と Standard の両方のエンドポイントで利用できます。`qwen3.7-max` と `qwen3.6-flash` は Standard でのみ利用できます。Standard（従量課金制）エンドポイントは次のとおりです。

    - 中国：`dashscope.aliyuncs.com/compatible-mode/v1`
    - グローバル：`dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw は、Coding Plan カタログから `qwen3.7-max` と `qwen3.6-flash` を除外します。
    Coding Plan エンドポイントでいずれかについて「サポートされていないモデル」エラーが返された場合は、対応する Standard エンドポイントとキーに切り替えてください。

  </Accordion>

  <Accordion title="動画生成のリージョンルーティング">
    OpenClaw は、動画ジョブを送信する前に、設定された Qwen リージョンを対応する DashScope AIGC ホストにマッピングします。

    - グローバル／国際：`https://dashscope-intl.aliyuncs.com`
    - 中国：`https://dashscope.aliyuncs.com`

    Coding Plan または Standard の Qwen ホストのいずれかを指す通常の `models.providers.qwen.baseUrl` を設定した場合でも、動画生成は対応するリージョンの DashScope 動画エンドポイントにルーティングされます。

  </Accordion>

  <Accordion title="ストリーミング使用量の互換性">
    ネイティブ Qwen エンドポイントは、共通の `openai-completions` トランスポート上でストリーミング使用量の互換性を通知します。そのため、同じネイティブホストを対象とする DashScope 互換のカスタムプロバイダー ID は、組み込みの `qwen` プロバイダー ID を明示的に必要とせず、同じ動作を継承します。これは Coding Plan、Standard、Token Plan の各エンドポイントに適用されます。

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="機能計画">
    `qwen` Plugin は、コーディング／テキストモデルだけでなく、Qwen Cloud の全機能を扱うベンダーの中核として位置付けられています。

    - **テキスト／チャットモデル：** Plugin を通じて利用可能
    - **ツール呼び出し、構造化出力、思考：** OpenAI 互換トランスポートから継承
    - **画像生成：** プロバイダー Plugin レイヤーで対応予定
    - **画像／動画理解：** Standard エンドポイント上の Plugin を通じて利用可能
    - **音声／オーディオ：** プロバイダー Plugin レイヤーで対応予定
    - **メモリの埋め込み／再ランキング：** 埋め込みアダプターのサーフェスを通じて対応予定
    - **動画生成：** 共通の動画生成機能を介して Plugin から利用可能

  </Accordion>

  <Accordion title="環境とデーモンのセットアップ">
    Gateway をデーモン（launchd／systemd）として実行する場合は、`QWEN_API_KEY` または `QWEN_TOKEN_PLAN_API_KEY` をそのプロセスから利用できるようにしてください（たとえば、`~/.openclaw/.env` または `env.shellEnv` を使用します）。
  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共通の動画ツールパラメーターとプロバイダーの選択。
  </Card>
  <Card title="Alibaba Model Studio" href="/ja-JP/providers/alibaba" icon="cloud">
    同じ DashScope プラットフォーム上の同梱 Wan 動画生成プロバイダー。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングとよくある質問。
  </Card>
</CardGroup>
