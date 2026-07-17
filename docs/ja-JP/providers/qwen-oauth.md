---
read_when:
    - qwen-oauth プロバイダー ID を設定する場合
    - 以前に Qwen Portal OAuth 認証情報を使用していました
    - Qwen Portal のエンドポイントまたは移行ガイダンスが必要です
summary: OpenClaw で Qwen Portal のプロバイダー ID を使用する
title: Qwen OAuth / ポータル
x-i18n:
    generated_at: "2026-07-11T22:38:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b78f6f23e62e38d11e6fe4e2bf515b13b414f276d08f672740ad94747a22c8fb
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` は、Qwen Plugin（`@openclaw/qwen-provider`）によって登録される Qwen Portal のプロバイダー ID です。`https://portal.qwen.ai/v1` の Qwen Portal エンドポイントを対象とし、従来の Qwen OAuth / Portal セットアップを、標準の `qwen` プロバイダーとは別のプロバイダー ID で引き続き参照できるようにします。

すでに有効な Qwen Portal トークンがある場合、従来の Qwen OAuth または Qwen CLI ワークフローから移行する場合、あるいは Qwen Portal エンドポイントを明示的にテストする必要がある場合は、`qwen-oauth` を選択してください。新規セットアップでは、Standard ModelStudio エンドポイントを使用する [Qwen](/ja-JP/providers/qwen) を推奨します。新しい API キーのセットアップ、より幅広いエンドポイントの選択肢、Standard 従量課金、Coding Plan、および Qwen Plugin の全カタログに対応しています。

## セットアップ

Qwen Plugin をまだインストールしていない場合は、インストールします。

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

オンボーディングを通じて Portal トークンを指定します。

```bash
openclaw onboard --auth-choice qwen-oauth
```

非対話型実行では `--qwen-oauth-token <token>` からトークンを読み取ります。または、次のように設定します。

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

オンボーディングはトークンを `qwen-oauth` 認証プロファイルに保存し、Portal モデルカタログを初期登録します。モデルが設定されていない場合は、`qwen-oauth/qwen3.5-plus` をデフォルトモデルとして設定します。

## デフォルト

- プロバイダー: `qwen-oauth`
- エイリアス: `qwen-portal`、`qwen-cli`
- ベース URL: `https://portal.qwen.ai/v1`
- 環境変数: `QWEN_API_KEY`
- API 形式: OpenAI 互換
- デフォルトモデル: `qwen-oauth/qwen3.5-plus`

## Qwen との違い

OpenClaw には、Qwen 向けのプロバイダー ID が 2 つあります。

| プロバイダー | エンドポイント系統                                       | 最適な用途                                                                               |
| ------------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `qwen`       | Qwen Cloud / Alibaba DashScope および Coding Plan エンドポイント | 新しい API キーのセットアップ、Standard 従量課金、Coding Plan、DashScope のマルチモーダル機能 |
| `qwen-oauth` | `portal.qwen.ai/v1` の Qwen Portal エンドポイント       | 既存の Qwen Portal トークンおよび従来の Qwen OAuth / CLI セットアップ                    |

どちらのプロバイダーも OpenAI 互換のリクエスト形式を使用しますが、認証サーフェスは別々です。`qwen-oauth` 用に保存されたトークンを DashScope または ModelStudio のキーとして扱わないでください。また、新しい DashScope キーには、代わりに標準の `qwen` プロバイダーを使用してください。

## モデル

Qwen Plugin は、Qwen Portal エンドポイント用に次の静的カタログを初期登録します。すべてのエントリで最大出力は 65,536 トークンです。利用可否は、現在の Qwen Portal アカウントとトークンによって異なります。

| モデル参照                        | 入力           | コンテキスト | 備考             |
| --------------------------------- | -------------- | ------------ | ---------------- |
| `qwen-oauth/qwen3.5-plus`         | テキスト、画像 | 1,000,000    | デフォルトモデル |
| `qwen-oauth/qwen3.6-plus`         | テキスト、画像 | 1,000,000    |                  |
| `qwen-oauth/qwen3-max-2026-01-23` | テキスト       | 262,144      |                  |
| `qwen-oauth/qwen3-coder-next`     | テキスト       | 262,144      |                  |
| `qwen-oauth/qwen3-coder-plus`     | テキスト       | 1,000,000    |                  |
| `qwen-oauth/MiniMax-M2.5`         | テキスト       | 1,000,000    | 推論             |
| `qwen-oauth/glm-5`                | テキスト       | 202,752      |                  |
| `qwen-oauth/glm-4.7`              | テキスト       | 202,752      |                  |
| `qwen-oauth/kimi-k2.5`            | テキスト、画像 | 262,144      |                  |

アカウントで代わりに ModelStudio / DashScope API キーを使用する場合は、標準の `qwen` プロバイダーを設定します。

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## 移行

従来の Qwen Portal OAuth プロファイルは更新できず、`openclaw doctor` によって警告されます。Portal プロファイルが機能しなくなった場合は、現在有効なトークンを使用してオンボーディングを再実行するか、Standard Qwen プロバイダーに切り替えてください。

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Standard グローバル ModelStudio では、次を使用します。

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## トラブルシューティング

- Portal OAuth の更新エラー: 従来の Qwen Portal OAuth プロファイルは更新できません。現在有効なトークンを使用してオンボーディングを再実行してください。
- エンドポイント不一致エラー: Portal トークンを使用する場合は、モデル参照が `qwen-oauth/` で始まることを確認してください。`qwen/` 参照は、標準の Qwen プロバイダーにのみ使用してください。
- `QWEN_API_KEY` に関する混乱: どちらの Qwen ページでもこの環境変数について言及していますが、オンボーディングでは、選択したプロバイダー ID の下に認証情報が保存されます。同じマシン上で `qwen` と `qwen-oauth` の両方を利用可能にしておく場合は、オンボーディングの使用を推奨します。

## 関連項目

- [Qwen](/ja-JP/providers/qwen)
- [Alibaba Model Studio](/ja-JP/providers/alibaba)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [すべてのプロバイダー](/ja-JP/providers/index)
