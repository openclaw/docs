---
read_when:
    - OpenClaw で Groq を使いたい場合
    - API キー env var または CLI 認証方法が必要です
summary: Groq セットアップ（認証 + モデル選択）
title: Groq
x-i18n:
    generated_at: "2026-04-24T05:15:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c711297d42dea7fabe8ba941f75ef9dc82bd9b838f78d5dc4385210d9f65ade
    source_path: providers/groq.md
    workflow: 15
---

[Groq](https://groq.com) は、カスタム LPU ハードウェアを使用して、オープンソースモデル
（Llama、Gemma、Mistral など）の超高速推論を提供します。OpenClaw は
OpenAI 互換 API を通じて Groq に接続します。

| Property | Value |
| -------- | ----------------- |
| Provider | `groq` |
| Auth     | `GROQ_API_KEY` |
| API      | OpenAI-compatible |

## はじめに

<Steps>
  <Step title="API キーを取得する">
    [console.groq.com/keys](https://console.groq.com/keys) で API キーを作成します。
  </Step>
  <Step title="API キーを設定する">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="デフォルトモデルを設定する">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
</Steps>

### config file 例

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## 組み込みカタログ

Groq の model catalog は頻繁に変わります。現在利用可能なモデルを見るには `openclaw models list | grep groq`
を実行するか、
[console.groq.com/docs/models](https://console.groq.com/docs/models) を確認してください。

| Model | Notes |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | 汎用、大きなコンテキスト |
| **Llama 3.1 8B Instant**    | 高速、軽量 |
| **Gemma 2 9B**              | コンパクトで効率的 |
| **Mixtral 8x7B**            | MoE アーキテクチャ、強い reasoning |

<Tip>
あなたのアカウントで利用可能な最新の
モデル一覧を見るには `openclaw models list --provider groq` を使ってください。
</Tip>

## 音声 transcription

Groq は高速な Whisper ベース音声 transcription も提供します。media-understanding provider として設定されている場合、
OpenClaw は共有 `tools.media.audio`
サーフェスを通じて、Groq の `whisper-large-v3-turbo`
モデルを使って音声メッセージを transcription します。

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="音声 transcription の詳細">
    | Property | Value |
    |----------|-------|
    | 共有 config パス | `tools.media.audio` |
    | デフォルト base URL   | `https://api.groq.com/openai/v1` |
    | デフォルト model      | `whisper-large-v3-turbo` |
    | API endpoint       | OpenAI-compatible `/audio/transcriptions` |
  </Accordion>

  <Accordion title="環境に関する注記">
    Gateway が daemon（launchd/systemd）として動作している場合、`GROQ_API_KEY` が
    そのプロセスで利用可能であることを確認してください（たとえば `~/.openclaw/.env` または
    `env.shellEnv` 経由）。

    <Warning>
    対話シェル内でのみ設定されたキーは、daemon 管理の
    Gateway プロセスからは見えません。永続的に利用可能にするには `~/.openclaw/.env` または `env.shellEnv` config を使用してください。
    </Warning>

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、model ref、フェイルオーバー挙動の選び方。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダーと音声設定を含む完全な config schema。
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq ダッシュボード、API ドキュメント、料金。
  </Card>
  <Card title="Groq モデル一覧" href="https://console.groq.com/docs/models" icon="list">
    公式 Groq モデルカタログ。
  </Card>
</CardGroup>
