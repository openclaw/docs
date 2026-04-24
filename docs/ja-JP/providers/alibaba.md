---
read_when:
    - OpenClawでAlibaba Wan動画生成を使いたい場合
    - 動画生成のためにModel StudioまたはDashScope API keyの設定が必要な場合
summary: OpenClawにおけるAlibaba Model Studio Wan動画生成
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-24T05:13:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5abfe9ab595f2a323d6113995bf3075aa92c7f329b934d048e7ece256d94899
    source_path: providers/alibaba.md
    workflow: 15
---

OpenClawには、Alibaba Model Studio / DashScope上のWanモデル向けの、バンドルされた`alibaba`動画生成プロバイダーが含まれています。

- プロバイダー: `alibaba`
- 推奨認証: `MODELSTUDIO_API_KEY`
- これらも利用可能: `DASHSCOPE_API_KEY`、`QWEN_API_KEY`
- API: DashScope / Model Studioの非同期動画生成

## はじめに

<Steps>
  <Step title="API keyを設定する">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
    ```
  </Step>
  <Step title="デフォルト動画モデルを設定する">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="プロバイダーが利用可能か確認する">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
受け付けられる認証key（`MODELSTUDIO_API_KEY`、`DASHSCOPE_API_KEY`、`QWEN_API_KEY`）のいずれでも動作します。`qwen-standard-api-key`のオンボーディング選択は、共有DashScope資格情報を設定します。
</Note>

## 組み込みWanモデル

バンドルされた`alibaba`プロバイダーは現在、次を登録しています。

| モデル参照 | モード |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | Text-to-video |
| `alibaba/wan2.6-i2v`       | Image-to-video |
| `alibaba/wan2.6-r2v`       | Reference-to-video |
| `alibaba/wan2.6-r2v-flash` | Reference-to-video（高速） |
| `alibaba/wan2.7-r2v`       | Reference-to-video |

## 現在の制限

| パラメーター | 制限 |
| --------------------- | --------------------------------------------------------- |
| 出力動画 | リクエストごとに最大**1** |
| 入力画像 | 最大**1** |
| 入力動画 | 最大**4** |
| 長さ | 最大**10秒** |
| 対応コントロール | `size`、`aspectRatio`、`resolution`、`audio`、`watermark` |
| 参照画像/動画 | リモート`http(s)` URLのみ |

<Warning>
参照画像/動画モードでは、現在**リモートhttp(s) URL**が必要です。参照入力としてローカルファイルパスはサポートされていません。
</Warning>

## 高度な設定

<AccordionGroup>
  <Accordion title="Qwenとの関係">
    バンドルされた`qwen`プロバイダーも、Wan動画生成のためにAlibabaホストのDashScopeエンドポイントを使用します。使い分けは次のとおりです。

    - 正規のQwenプロバイダーインターフェースが欲しい場合は`qwen/...`
    - ベンダー所有の直接Wan動画インターフェースが欲しい場合は`alibaba/...`

    詳細は[Qwen provider docs](/ja-JP/providers/qwen)を参照してください。

  </Accordion>

  <Accordion title="認証keyの優先順位">
    OpenClawは、次の順で認証keyを確認します。

    1. `MODELSTUDIO_API_KEY`（推奨）
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    これらのいずれでも`alibaba`プロバイダーを認証できます。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Video generation" href="/ja-JP/tools/video-generation" icon="video">
    共通の動画ツールパラメーターとプロバイダー選択。
  </Card>
  <Card title="Qwen" href="/ja-JP/providers/qwen" icon="microchip">
    QwenプロバイダーのセットアップとDashScope連携。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    エージェントデフォルトとモデル設定。
  </Card>
</CardGroup>
