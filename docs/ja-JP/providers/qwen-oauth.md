---
read_when:
    - qwen-oauth プロバイダー ID を設定したい場合
    - 以前に Qwen Portal OAuth 認証情報を使用していました
    - Qwen Portal エンドポイントまたは移行ガイダンスが必要です
summary: OpenClaw で Qwen Portal プロバイダー ID を使用する
title: Qwen OAuth / ポータル
x-i18n:
    generated_at: "2026-06-27T12:49:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 46f147e3730024bf63e99827f666e2be791318723eace98941ca067c440dddd0
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` は Qwen Portal のプロバイダー ID です。Qwen Portal エンドポイントを対象とし、以前の Qwen OAuth / portal セットアップを個別のプロバイダー ID で参照可能なままにします。

このプロバイダーは、`https://portal.qwen.ai/v1` の現在有効な Qwen Portal トークンを持っている場合、または以前の Qwen Portal / Qwen CLI セットアップを移行していて、それらの認証情報を標準の Qwen Cloud プロバイダーから分離しておきたい場合に使用します。新規の Qwen ユーザーに最初に推奨される選択肢ではありません。

新規の Qwen Cloud セットアップでは、現在有効な Qwen Portal トークンを特に持っている場合を除き、Standard ModelStudio エンドポイントを使う [Qwen](/ja-JP/providers/qwen) を優先してください。

## セットアップ

オンボーディングで portal トークンを指定します。

```bash
openclaw onboard --auth-choice qwen-oauth
```

または次を設定します。

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

## デフォルト

- プロバイダー: `qwen-oauth`
- エイリアス: `qwen-portal`, `qwen-cli`
- ベース URL: `https://portal.qwen.ai/v1`
- 環境変数: `QWEN_API_KEY`
- API スタイル: OpenAI 互換
- デフォルトモデル: `qwen-oauth/qwen3.5-plus`

## Qwen との違い

OpenClaw には Qwen 向けのプロバイダー ID が 2 つあります。

| プロバイダー | エンドポイントファミリー | 最適な用途 |
| ------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `qwen`       | Qwen Cloud / Alibaba DashScope および Coding Plan エンドポイント | 新規 API キーセットアップ、Standard 従量課金、Coding Plan、マルチモーダル DashScope 機能 |
| `qwen-oauth` | `portal.qwen.ai/v1` の Qwen Portal エンドポイント | 既存の Qwen Portal トークンおよびレガシー Qwen OAuth / CLI セットアップ |

どちらのプロバイダーも OpenAI 互換のリクエスト形式を使用しますが、認証サーフェスは別です。`qwen-oauth` に保存されたトークンを DashScope または ModelStudio キーとして扱うべきではありません。また、新しい DashScope キーには代わりに標準の `qwen` プロバイダーを使用してください。

## Qwen OAuth / Portal を選ぶ場合

- すでに動作する Qwen Portal トークンを持っている。
- OpenClaw のプロバイダーモデルへ移行しながら、レガシー Qwen OAuth または Qwen CLI ワークフローを維持している。
- Qwen Portal エンドポイントとの互換性を特にテストする必要がある。

新規セットアップ、より広いエンドポイント選択肢、Standard ModelStudio、Coding Plan、完全な Qwen Plugin カタログには [Qwen](/ja-JP/providers/qwen) を選んでください。

## モデル

Qwen Plugin カタログは Qwen Portal のデフォルトをシードします。

- `qwen-oauth/qwen3.5-plus`

利用可否は現在の Qwen Portal アカウントとトークンによって異なります。アカウントで代わりに ModelStudio / DashScope API キーを使用している場合は、標準の `qwen` プロバイダーを設定してください。

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## 移行

レガシー Qwen Portal OAuth プロファイルは更新できない場合があります。portal プロファイルが動作しなくなった場合は、現在有効なトークンで再認証するか、Standard Qwen プロバイダーに切り替えてください。

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Standard グローバル ModelStudio は次を使用します。

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## トラブルシューティング

- Portal OAuth 更新の失敗: レガシー Qwen Portal OAuth プロファイルは更新できない場合があります。現在有効なトークンでオンボーディングを再実行してください。
- 誤ったエンドポイントのエラー: portal トークンを使用する場合は、モデル参照が `qwen-oauth/` で始まることを確認してください。`qwen/` 参照は標準の Qwen プロバイダーにのみ使用します。
- `QWEN_API_KEY` の混同: どちらの Qwen ページもこの環境変数に言及していますが、オンボーディングは選択したプロバイダー ID の下に認証情報を保存します。同じマシンで `qwen` と `qwen-oauth` の両方を利用可能にしておく場合は、オンボーディングを優先してください。

## 関連

- [Qwen](/ja-JP/providers/qwen)
- [Alibaba Model Studio](/ja-JP/providers/alibaba)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [すべてのプロバイダー](/ja-JP/providers/index)
