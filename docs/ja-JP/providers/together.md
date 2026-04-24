---
read_when:
    - OpenClaw で Together AI を使いたい場合
    - API キー env var または CLI 認証方法が必要です
summary: Together AI セットアップ（認証 + モデル選択）
title: Together AI
x-i18n:
    generated_at: "2026-04-24T05:17:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6a11f212fbef79e399d4a50cec88150bf0b7abf80ad765f0a617786bb051c8e
    source_path: providers/together.md
    workflow: 15
---

[Together AI](https://together.ai) は、Llama、DeepSeek、Kimi などの主要なオープンソース
モデルへのアクセスを、統一 API 経由で提供します。

| Property | Value |
| -------- | ----------------------------- |
| Provider | `together` |
| Auth     | `TOGETHER_API_KEY` |
| API      | OpenAI-compatible |
| Base URL | `https://api.together.xyz/v1` |

## はじめに

<Steps>
  <Step title="API キーを取得する">
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys) で
    API キーを作成します。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="デフォルトモデルを設定する">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "together/moonshotai/Kimi-K2.5" },
        },
      },
    }
    ```
  </Step>
</Steps>

### 非対話型の例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
オンボーディングプリセットは、デフォルト
モデルとして `together/moonshotai/Kimi-K2.5` を設定します。
</Note>

## 組み込みカタログ

OpenClaw は次のバンドル済み Together カタログを同梱しています。

| Model ref | Name | Input | Context | Notes |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5 | text, image | 262,144 | デフォルトモデル、reasoning 対応 |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8 | text | 202,752 | 汎用テキストモデル |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo | text | 131,072 | 高速 instruction model |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct | text, image | 10,000,000 | マルチモーダル |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | text, image | 20,000,000 | マルチモーダル |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1 | text | 131,072 | 汎用テキストモデル |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1 | text | 131,072 | reasoning モデル |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905 | text | 262,144 | 第2の Kimi テキストモデル |

## 動画生成

バンドル済み `together` Plugin は、共有
`video_generate` ツール経由の動画生成も登録します。

| Property | Value |
| -------------------- | ------------------------------------- |
| デフォルト動画モデル | `together/Wan-AI/Wan2.2-T2V-A14B` |
| モード | text-to-video、単一画像参照 |
| サポートされるパラメーター | `aspectRatio`, `resolution` |

Together をデフォルト動画プロバイダーとして使うには:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
共有ツールパラメーター、
プロバイダー選択、フェイルオーバー挙動については [動画生成](/ja-JP/tools/video-generation) を参照してください。
</Tip>

<AccordionGroup>
  <Accordion title="環境に関する注記">
    Gateway が daemon（launchd/systemd）として動作している場合、
    `TOGETHER_API_KEY` がそのプロセスで利用可能であることを確認してください（たとえば
    `~/.openclaw/.env` または `env.shellEnv` 経由）。

    <Warning>
    対話シェル内でのみ設定されたキーは、daemon 管理の
    Gateway プロセスからは見えません。永続的に利用可能にするには
    `~/.openclaw/.env` または `env.shellEnv` config を使用してください。
    </Warning>

  </Accordion>

  <Accordion title="トラブルシューティング">
    - キーが動作することを確認する: `openclaw models list --provider together`
    - モデルが表示されない場合は、Gateway プロセスに対して正しい
      環境に API キーが設定されていることを確認してください。
    - model ref は `together/<model-id>` 形式です。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダールール、model ref、フェイルオーバー挙動。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画生成ツールパラメーターとプロバイダー選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダー設定を含む完全な config schema。
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together AI ダッシュボード、API ドキュメント、料金。
  </Card>
</CardGroup>
