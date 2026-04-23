---
read_when:
    - Render に OpenClaw をデプロイする
    - Render Blueprints を使った宣言的なクラウドデプロイが必要な場合
summary: Infrastructure-as-Code を使って Render に OpenClaw をデプロイする
title: Render
x-i18n:
    generated_at: "2026-04-23T14:05:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95ffe98a60e9919826a7c7fdb9cbafd63d20ce3de111ac305f43907b1ae442dc
    source_path: install/render.mdx
    workflow: 15
---

# Render

Infrastructure as Code を使って Render に OpenClaw をデプロイします。同梱の `render.yaml` Blueprint は、サービス、ディスク、環境変数を含むスタック全体を宣言的に定義するため、ワンクリックでデプロイでき、コードと一緒にインフラをバージョン管理できます。

## 前提条件

- [Render アカウント](https://render.com)（無料プランあり）
- 使用する [model provider](/ja-JP/providers) の API キー

## Render Blueprint でデプロイする

[Deploy to Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

このリンクをクリックすると次のことが行われます。

1. このリポジトリのルートにある `render.yaml` Blueprint から新しい Render サービスを作成する
2. Docker イメージをビルドしてデプロイする

デプロイ後、サービス URL は `https://<service-name>.onrender.com` の形式になります。

## Blueprint を理解する

Render Blueprint は、インフラを定義する YAML ファイルです。このリポジトリの `render.yaml` には、OpenClaw を実行するために必要なすべてが設定されています。

```yaml
services:
  - type: web
    name: openclaw
    runtime: docker
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: OPENCLAW_GATEWAY_PORT
        value: "8080"
      - key: OPENCLAW_STATE_DIR
        value: /data/.openclaw
      - key: OPENCLAW_WORKSPACE_DIR
        value: /data/workspace
      - key: OPENCLAW_GATEWAY_TOKEN
        generateValue: true # 安全なトークンを自動生成
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

使用されている主な Blueprint 機能:

| 機能                  | 目的                                                       |
| --------------------- | ---------------------------------------------------------- |
| `runtime: docker`     | リポジトリの Dockerfile からビルド                         |
| `healthCheckPath`     | Render が `/health` を監視し、不健全なインスタンスを再起動 |
| `generateValue: true` | 暗号学的に安全な値を自動生成                               |
| `disk`                | 再デプロイ後も保持される永続ストレージ                     |

## プランを選ぶ

| プラン    | スピンダウン         | ディスク      | 最適な用途                     |
| --------- | -------------------- | ------------- | ------------------------------ |
| Free      | 15 分アイドル後      | 利用不可      | テスト、デモ                   |
| Starter   | なし                 | 1GB+          | 個人利用、小規模チーム         |
| Standard+ | なし                 | 1GB+          | 本番運用、複数チャネル         |

Blueprint のデフォルトは `starter` です。無料プランを使うには、fork 側の `render.yaml` で `plan: free` に変更してください（ただし、永続ディスクがないため OpenClaw の状態はデプロイごとにリセットされる点に注意してください）。

## デプロイ後

### Control UI にアクセスする

Web ダッシュボードは `https://<your-service>.onrender.com/` で利用できます。

設定された共有 secret で接続してください。このデプロイテンプレートは `OPENCLAW_GATEWAY_TOKEN` を自動生成します（**Dashboard → your service → Environment** で確認できます）。これをパスワード認証に置き換えた場合は、代わりにそのパスワードを使ってください。

## Render Dashboard の機能

### ログ

**Dashboard → your service → Logs** でリアルタイムログを確認できます。次で絞り込めます。

- ビルドログ（Docker イメージ作成）
- デプロイログ（サービス起動）
- ランタイムログ（アプリケーション出力）

### シェルアクセス

デバッグ用に、**Dashboard → your service → Shell** からシェルセッションを開けます。永続ディスクは `/data` にマウントされます。

### 環境変数

**Dashboard → your service → Environment** で変数を変更できます。変更すると自動的に再デプロイされます。

### 自動デプロイ

元の OpenClaw リポジトリを使っている場合、Render は OpenClaw を自動デプロイしません。更新するには、ダッシュボードから手動で Blueprint sync を実行してください。

## カスタムドメイン

1. **Dashboard → your service → Settings → Custom Domains** に移動します
2. ドメインを追加します
3. 指示どおりに DNS を設定します（`*.onrender.com` への CNAME）
4. Render が自動的に TLS 証明書を発行します

## スケーリング

Render は水平スケーリングと垂直スケーリングをサポートしています。

- **垂直**: プランを変更して CPU/RAM を増やす
- **水平**: インスタンス数を増やす（Standard プラン以上）

OpenClaw では、通常は垂直スケーリングで十分です。水平スケーリングには sticky session または外部状態管理が必要です。

## バックアップと移行

Render Dashboard のシェルアクセスを使って、状態、config、auth profile、ワークスペースをいつでもエクスポートできます。

```bash
openclaw backup create
```

これにより、OpenClaw の状態と設定済みワークスペースを含む持ち運び可能なバックアップアーカイブが作成されます。詳細は [Backup](/ja-JP/cli/backup) を参照してください。

## トラブルシューティング

### サービスが起動しない

Render Dashboard のデプロイログを確認してください。よくある原因:

- `OPENCLAW_GATEWAY_TOKEN` が不足している — **Dashboard → Environment** で設定されていることを確認してください
- ポート不一致 — Render が期待するポートに gateway が bind するよう、`OPENCLAW_GATEWAY_PORT=8080` が設定されていることを確認してください

### コールドスタートが遅い（無料プラン）

無料プランのサービスは、15 分間アクセスがないとスピンダウンします。スピンダウン後の最初のリクエストでは、コンテナ起動のため数秒かかります。常時稼働にするには Starter プランにアップグレードしてください。

### 再デプロイ後にデータが消える

これは無料プランで発生します（永続ディスクなし）。有料プランにアップグレードするか、Render シェルで `openclaw backup create` を定期的に実行して完全バックアップをエクスポートしてください。

### ヘルスチェック失敗

Render は 30 秒以内に `/health` から 200 応答を期待します。ビルドは成功するのにデプロイが失敗する場合、サービスの起動に時間がかかりすぎている可能性があります。以下を確認してください。

- エラーがないかビルドログ
- `docker build && docker run` でコンテナがローカル実行できるか

## 次のステップ

- メッセージングチャネルを設定する: [チャネル](/ja-JP/channels)
- Gateway を設定する: [Gateway の設定](/ja-JP/gateway/configuration)
- OpenClaw を最新に保つ: [アップデート](/ja-JP/install/updating)
