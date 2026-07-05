---
read_when:
    - OpenClaw で Runway の動画生成を使いたい
    - Runway APIキー/env設定が必要です
    - Runway をデフォルトの動画プロバイダーにしたい
summary: OpenClaw での Runway 動画生成セットアップ
title: 滑走路
x-i18n:
    generated_at: "2026-07-05T11:46:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7aa2a802323857bf7c839ebfab56853dc79d656a25bbc194a431959a48bbd64b
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw は、ホスト型動画生成向けに同梱の `runway` プロバイダーを提供します。これはデフォルトで有効で、`videoGenerationProviders` コントラクトに対して登録されています。

| プロパティ        | 値                                                             |
| --------------- | ----------------------------------------------------------------- |
| プロバイダー ID     | `runway`                                                          |
| Plugin          | 同梱、`enabledByDefault: true`                                 |
| 認証環境変数   | `RUNWAYML_API_SECRET` (正規) または `RUNWAY_API_KEY`             |
| オンボーディングフラグ | `--auth-choice runway-api-key`                                    |
| 直接 CLI フラグ | `--runway-api-key <key>`                                          |
| API             | Runway のタスクベース動画生成 (`GET /v1/tasks/{id}` ポーリング) |
| デフォルトモデル   | `runway/gen4.5`                                                   |

## はじめに

<Steps>
  <Step title="API キーを設定する">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Runway をデフォルトの動画プロバイダーに設定する">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="動画を生成する">
    エージェントに動画を生成するよう依頼します。Runway が自動的に使用されます。
  </Step>
</Steps>

## サポートされるモードとモデル

このプロバイダーは、3 つのモードに分かれた 7 つの Runway モデルを公開します。同じモデル ID が複数のモードに対応できる場合があります (たとえば `gen4.5` はテキストから動画と画像から動画の両方で動作します)。

| モード           | モデル                                                                 | 参照入力         |
| -------------- | ---------------------------------------------------------------------- | ----------------------- |
| テキストから動画  | `gen4.5` (デフォルト), `veo3.1`, `veo3.1_fast`, `veo3`                    | なし                    |
| 画像から動画 | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | ローカルまたはリモート画像 1 件 |
| 動画から動画 | `gen4_aleph`                                                           | ローカルまたはリモート動画 1 件 |

ローカル画像と動画の参照は、データ URI 経由でサポートされます。

| アスペクト比         | 許可される値                              |
| --------------------- | ------------------------------------------- |
| テキストから動画         | `16:9`, `9:16`                              |
| 画像および動画の編集 | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  動画から動画には現在 `runway/gen4_aleph` が必要です。他の Runway モデル ID は動画参照入力を拒否します。
</Warning>

<Note>
  間違った列から Runway モデル ID を選択すると、API リクエストが OpenClaw から送信される前に明示的なエラーが発生します。このプロバイダーは、`extensions/runway/video-generation-provider.ts` で `model` をモードの許可リスト (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) に照らして検証します。
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
    OpenClaw は `RUNWAYML_API_SECRET` (正規) と `RUNWAY_API_KEY` の両方を認識します。
    どちらの変数でも Runway プロバイダーを認証できます。
  </Accordion>

  <Accordion title="タスクポーリング">
    Runway はタスクベースの API を使用します。生成リクエストを送信した後、OpenClaw は
    動画の準備ができるまで `GET /v1/tasks/{id}` をポーリングします。ポーリング動作に追加の
    設定は不要です。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有ツールパラメーター、プロバイダー選択、非同期動作。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    動画生成モデルを含むエージェントのデフォルト設定。
  </Card>
</CardGroup>
