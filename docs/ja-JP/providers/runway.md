---
read_when:
    - OpenClaw で Runway 動画生成を使いたい場合
    - Runway API キー/env セットアップが必要です
    - Runway をデフォルト動画プロバイダーにしたい場合
summary: OpenClaw での Runway 動画生成セットアップ
title: Runway
x-i18n:
    generated_at: "2026-04-24T05:16:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9648ca4403283cd23bf899d697f35a6b63986e8860227628c0d5789fceee3ce8
    source_path: providers/runway.md
    workflow: 15
---

OpenClaw には、ホスト型動画生成向けのバンドル済み `runway` プロバイダーが同梱されています。

| Property    | Value |
| ----------- | ----------------------------------------------------------------- |
| Provider id | `runway` |
| Auth        | `RUNWAYML_API_SECRET`（正規）または `RUNWAY_API_KEY` |
| API         | Runway のタスクベース動画生成（`GET /v1/tasks/{id}` polling） |

## はじめに

<Steps>
  <Step title="API キーを設定する">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Runway をデフォルト動画プロバイダーに設定する">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="動画を生成する">
    エージェントに動画生成を依頼します。Runway が自動的に使用されます。
  </Step>
</Steps>

## サポートされるモード

| Mode | Model | Reference input |
| -------------- | ------------------ | ----------------------- |
| Text-to-video  | `gen4.5`（デフォルト） | なし |
| Image-to-video | `gen4.5` | ローカルまたはリモート画像 1 枚 |
| Video-to-video | `gen4_aleph` | ローカルまたはリモート動画 1 本 |

<Note>
ローカル画像および動画の参照は data URI 経由でサポートされます。text-only 実行では
現在 `16:9` と `9:16` のアスペクト比を公開しています。
</Note>

<Warning>
現在、video-to-video には特に `runway/gen4_aleph` が必要です。
</Warning>

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
  <Accordion title="環境変数エイリアス">
    OpenClaw は `RUNWAYML_API_SECRET`（正規）と `RUNWAY_API_KEY` の両方を認識します。
    どちらの変数でも Runway プロバイダーを認証できます。
  </Accordion>

  <Accordion title="タスク polling">
    Runway はタスクベース API を使用します。生成リクエスト送信後、OpenClaw
    は動画の準備ができるまで `GET /v1/tasks/{id}` を polling します。polling 挙動に
    追加設定は不要です。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有ツールパラメーター、プロバイダー選択、非同期挙動。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    動画生成モデルを含むエージェントデフォルト設定。
  </Card>
</CardGroup>
