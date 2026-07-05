---
read_when:
    - qwen-oauth プロバイダー ID を設定したい
    - 以前に Qwen Portal OAuth 認証情報を使用しました
    - Qwen Portal エンドポイントまたは移行ガイダンスが必要です
summary: OpenClaw で Qwen Portal プロバイダー ID を使用する
title: Qwen OAuth / ポータル
x-i18n:
    generated_at: "2026-07-05T11:41:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b78f6f23e62e38d11e6fe4e2bf515b13b414f276d08f672740ad94747a22c8fb
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` は Qwen Portal のプロバイダー id で、Qwen plugin
（`@openclaw/qwen-provider`）によって登録されます。これは
`https://portal.qwen.ai/v1` の Qwen Portal エンドポイントを対象とし、古い Qwen OAuth / portal セットアップを、正規の `qwen`
プロバイダーとは別の個別のプロバイダー id で引き続き参照できるようにします。

すでに動作する Qwen Portal トークンがある場合、レガシーな Qwen OAuth または Qwen CLI ワークフローを移行している場合、または Qwen
Portal エンドポイントを特にテストする必要がある場合は、`qwen-oauth` を選択してください。新しいセットアップでは、Standard ModelStudio エンドポイントを使う
[Qwen](/ja-JP/providers/qwen) を優先してください。新しい
API キーのセットアップ、より広いエンドポイントの選択肢、Standard 従量課金、Coding Plan、
Qwen plugin カタログ全体を対象にできます。

## セットアップ

まだインストールしていない場合は、Qwen plugin をインストールします。

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

オンボーディングを通じて portal トークンを指定します。

```bash
openclaw onboard --auth-choice qwen-oauth
```

非対話型の実行では、`--qwen-oauth-token <token>` からトークンを読み取るか、次を設定します。

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

オンボーディングはトークンを `qwen-oauth` 認証プロファイルの下に保存し、portal
モデルカタログをシードし、何も設定されていない場合は `qwen-oauth/qwen3.5-plus` をデフォルトモデルとして設定します。

## デフォルト

- プロバイダー: `qwen-oauth`
- エイリアス: `qwen-portal`, `qwen-cli`
- ベース URL: `https://portal.qwen.ai/v1`
- 環境変数: `QWEN_API_KEY`
- API スタイル: OpenAI 互換
- デフォルトモデル: `qwen-oauth/qwen3.5-plus`

## Qwen との違い

OpenClaw には Qwen 向けのプロバイダー id が 2 つあります。

| プロバイダー | エンドポイントファミリー | 最適な用途 |
| ------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `qwen`       | Qwen Cloud / Alibaba DashScope と Coding Plan エンドポイント | 新しい API キーのセットアップ、Standard 従量課金、Coding Plan、マルチモーダルな DashScope 機能 |
| `qwen-oauth` | `portal.qwen.ai/v1` の Qwen Portal エンドポイント | 既存の Qwen Portal トークンとレガシーな Qwen OAuth / CLI セットアップ |

どちらのプロバイダーも OpenAI 互換のリクエスト形状を使用しますが、認証サーフェスは別です。`qwen-oauth` 用に保存されたトークンを DashScope
または ModelStudio キーとして扱うべきではありません。また、新しい DashScope キーでは、代わりに正規の `qwen`
プロバイダーを使用してください。

## モデル

Qwen plugin は、Qwen Portal エンドポイント用にこの静的カタログをシードします。すべての
エントリは最大出力 65,536 トークンを使用します。利用可否は現在の Qwen
Portal アカウントとトークンによって異なります。

| モデル参照 | 入力 | コンテキスト | 注記 |
| --------------------------------- | ----------- | --------- | ------------- |
| `qwen-oauth/qwen3.5-plus`         | テキスト、画像 | 1,000,000 | デフォルトモデル |
| `qwen-oauth/qwen3.6-plus`         | テキスト、画像 | 1,000,000 |               |
| `qwen-oauth/qwen3-max-2026-01-23` | テキスト | 262,144   |               |
| `qwen-oauth/qwen3-coder-next`     | テキスト | 262,144   |               |
| `qwen-oauth/qwen3-coder-plus`     | テキスト | 1,000,000 |               |
| `qwen-oauth/MiniMax-M2.5`         | テキスト | 1,000,000 | 推論     |
| `qwen-oauth/glm-5`                | テキスト | 202,752   |               |
| `qwen-oauth/glm-4.7`              | テキスト | 202,752   |               |
| `qwen-oauth/kimi-k2.5`            | テキスト、画像 | 262,144   |               |

アカウントが代わりに ModelStudio / DashScope API キーを使用している場合は、正規の
`qwen` プロバイダーを設定します。

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## 移行

レガシーな Qwen Portal OAuth プロファイルは更新できません。`openclaw doctor` はそれらにフラグを立てます。portal プロファイルが動作しなくなった場合は、現在のトークンでオンボーディングを再実行するか、Standard Qwen プロバイダーへ切り替えてください。

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Standard グローバル ModelStudio は次を使用します。

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## トラブルシューティング

- Portal OAuth 更新の失敗: レガシーな Qwen Portal OAuth プロファイルは更新できません。現在のトークンでオンボーディングを再実行してください。
- エンドポイント誤りのエラー: portal トークンを使用する場合は、モデル参照が `qwen-oauth/` で始まることを確認してください。`qwen/` 参照は正規の Qwen プロバイダーでのみ使用してください。
- `QWEN_API_KEY` の混同: どちらの Qwen ページもこの環境変数に言及していますが、オンボーディングは選択されたプロバイダー id の下に認証情報を保存します。同じマシンで `qwen` と `qwen-oauth` の両方を利用可能にしておく場合は、オンボーディングを優先してください。

## 関連

- [Qwen](/ja-JP/providers/qwen)
- [Alibaba Model Studio](/ja-JP/providers/alibaba)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [すべてのプロバイダー](/ja-JP/providers/index)
