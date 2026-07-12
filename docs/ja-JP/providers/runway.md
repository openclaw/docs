---
read_when:
    - OpenClawでRunwayの動画生成を使用したい場合
    - Runway APIキー／環境変数の設定が必要です
    - Runway をデフォルトの動画プロバイダーに設定する場合
summary: OpenClaw での Runway 動画生成のセットアップ
title: Runway
x-i18n:
    generated_at: "2026-07-11T22:37:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7aa2a802323857bf7c839ebfab56853dc79d656a25bbc194a431959a48bbd64b
    source_path: providers/runway.md
    workflow: 16
---

OpenClawには、ホスト型動画生成用の`runway`プロバイダーが同梱されています。デフォルトで有効になっており、`videoGenerationProviders`コントラクトに登録されています。

| プロパティ           | 値                                                                |
| -------------------- | ----------------------------------------------------------------- |
| プロバイダーID       | `runway`                                                          |
| Plugin               | 同梱、`enabledByDefault: true`                                    |
| 認証環境変数         | `RUNWAYML_API_SECRET`（正規）または`RUNWAY_API_KEY`                |
| オンボーディングフラグ | `--auth-choice runway-api-key`                                    |
| 直接指定するCLIフラグ | `--runway-api-key <key>`                                          |
| API                  | Runwayのタスクベース動画生成（`GET /v1/tasks/{id}`をポーリング） |
| デフォルトモデル     | `runway/gen4.5`                                                   |

## はじめに

<Steps>
  <Step title="APIキーを設定する">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Runwayをデフォルトの動画プロバイダーに設定する">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="動画を生成する">
    エージェントに動画の生成を依頼します。Runwayが自動的に使用されます。
  </Step>
</Steps>

## 対応モードとモデル

このプロバイダーは、3つのモードに分かれた7つのRunwayモデルを公開します。同じモデルIDが複数のモードで使用できる場合があります（たとえば、`gen4.5`はテキストから動画への生成と画像から動画への生成の両方で使用できます）。

| モード             | モデル                                                                 | 参照入力                   |
| ------------------ | ---------------------------------------------------------------------- | -------------------------- |
| テキストから動画   | `gen4.5`（デフォルト）、`veo3.1`、`veo3.1_fast`、`veo3`                | なし                       |
| 画像から動画       | `gen4.5`、`gen4_turbo`、`gen3a_turbo`、`veo3.1`、`veo3.1_fast`、`veo3` | ローカルまたはリモート画像1件 |
| 動画から動画       | `gen4_aleph`                                                           | ローカルまたはリモート動画1件 |

ローカルの画像および動画の参照は、データURI経由でサポートされます。

| アスペクト比             | 使用可能な値                                |
| ------------------------ | ------------------------------------------- |
| テキストから動画         | `16:9`、`9:16`                              |
| 画像および動画の編集     | `1:1`、`16:9`、`9:16`、`3:4`、`4:3`、`21:9` |

<Warning>
  現在、動画から動画への生成には`runway/gen4_aleph`が必要です。その他のRunwayモデルIDでは、動画参照入力が拒否されます。
</Warning>

<Note>
  誤った列のRunwayモデルIDを選択すると、APIリクエストがOpenClawから送信される前に明示的なエラーが発生します。プロバイダーは`extensions/runway/video-generation-provider.ts`で、モードの許可リスト（`TEXT_ONLY_MODELS`、`IMAGE_MODELS`、`VIDEO_MODELS`）に照らして`model`を検証します。
</Note>

## 設定

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## 高度な設定

<AccordionGroup>
  <Accordion title="環境変数のエイリアス">
    OpenClawは`RUNWAYML_API_SECRET`（正規）と`RUNWAY_API_KEY`の両方を認識します。
    どちらの変数でもRunwayプロバイダーを認証できます。
  </Accordion>

  <Accordion title="タスクのポーリング">
    RunwayはタスクベースのAPIを使用します。生成リクエストの送信後、動画の準備が完了するまでOpenClawは
    `GET /v1/tasks/{id}`をポーリングします。このポーリング動作に追加の
    設定は必要ありません。
  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共通ツールのパラメーター、プロバイダーの選択、非同期動作。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    動画生成モデルを含むエージェントのデフォルト設定。
  </Card>
</CardGroup>
