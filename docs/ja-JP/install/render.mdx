---
read_when:
    - OpenClaw を Render にデプロイする
    - Render Blueprints を使った宣言型のクラウドデプロイが必要な場合
summary: Infrastructure-as-CodeでRenderにOpenClawをデプロイする
title: レンダリング
x-i18n:
    generated_at: "2026-07-05T11:27:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5fbb3c6df04e186df958a62a6130da4e3e485acfeecc7e85fee0d5b69a0438f
    source_path: install/render.mdx
    workflow: 16
---

repo の `render.yaml` Blueprint を使用して、[Render](https://render.com) に OpenClaw をデプロイします。これはサービス、ディスク、環境変数を 1 つのファイルで宣言します。

## 前提条件

- [Render アカウント](https://render.com)（無料枠あり）
- 使用する[モデルプロバイダー](/ja-JP/providers)の API キー

## デプロイ

[Render にデプロイ](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

これにより、`render.yaml` から Render サービスが作成され、Docker イメージがビルドされてデプロイされます。サービス URL は `https://<service-name>.onrender.com` の形式になります。

## Blueprint

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
        generateValue: true # auto-generates a secure token
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

| 機能                  | 目的                                                       |
| --------------------- | ---------------------------------------------------------- |
| `runtime: docker`     | repo の Dockerfile からビルドします                        |
| `healthCheckPath`     | Render が `/health` を監視し、異常なインスタンスを再起動します |
| `generateValue: true` | 暗号学的に安全な値を自動生成します                         |
| `disk`                | 再デプロイ後も保持される永続ストレージ                     |

## プランの選択

| プラン    | スピンダウン           | ディスク      | 最適な用途                          |
| --------- | ---------------------- | ------------- | ----------------------------------- |
| 無料      | 15 分のアイドル後      | 利用不可      | テスト、デモ                        |
| Starter   | なし                   | 1GB+          | 個人利用、小規模チーム              |
| Standard+ | なし                   | 1GB+          | 本番環境、複数チャンネル            |

Blueprint のデフォルトは `starter` です。無料枠を使用するには、フォークした `render.yaml` で `plan: free` に変更します。永続ディスクがないため、OpenClaw の状態はデプロイごとにリセットされる点に注意してください。

## デプロイ後

### Control UI にアクセスする

Web ダッシュボードは `https://<your-service>.onrender.com/` で利用できます。共有シークレットを使って接続します。自動生成された `OPENCLAW_GATEWAY_TOKEN`（**Dashboard → your service → Environment** で確認）、またはパスワード認証に切り替えた場合はパスワードを使用します。

### ログ

**Dashboard → your service → Logs** には、ビルドログ（Docker イメージ作成）、デプロイログ（サービス起動）、ランタイムログ（アプリケーション出力）が表示されます。

### シェルアクセス

**Dashboard → your service → Shell** でシェルセッションを開きます。永続ディスクは `/data` にマウントされています。

### 環境変数

**Dashboard → your service → Environment** で変数を編集します。変更すると自動的に再デプロイが開始されます。

### 自動デプロイ

接続された repo のブランチに新しいコミットが追加されると、Render は自動的に再デプロイします。自分のフォークではなく `openclaw/openclaw` から直接デプロイした場合、そのトリガーを発生させる push 権限がないため、Dashboard から手動で Blueprint 同期を実行するか、サービスを自分のフォークに向けてください。

## カスタムドメイン

1. **Dashboard → your service → Settings → Custom Domains**
2. ドメインを追加します
3. 指示に従って DNS を設定します（`*.onrender.com` への CNAME）
4. Render が TLS 証明書を自動的にプロビジョニングします

## スケーリング

- **垂直**: CPU/RAM を増やすにはプランを変更します。通常、OpenClaw にはこれで十分です。
- **水平**: インスタンス数を増やします（Standard プラン以上）。OpenClaw はランタイム状態をローカルディスクに保持するため、スティッキーセッションまたは外部状態管理が必要です。

## バックアップと移行

Render Dashboard のシェルから、状態、設定、認証プロファイル、ワークスペースをいつでもエクスポートできます。

```bash
openclaw backup create
```

これにより、移植可能なバックアップアーカイブが作成されます。[Backup](/ja-JP/cli/backup) を参照してください。

## トラブルシューティング

### サービスが起動しない

Render Dashboard のデプロイログを確認してください。よくある問題:

- `OPENCLAW_GATEWAY_TOKEN` がない — **Dashboard → Environment** で設定されていることを確認してください
- ポートの不一致 — Gateway が Render の期待するポートにバインドするよう、`OPENCLAW_GATEWAY_PORT=8080` であることを確認してください

### コールドスタートが遅い（無料枠）

無料枠のサービスは、15 分間非アクティブだとスピンダウンします。スピンダウン後の最初のリクエストでは、コンテナの起動中に数秒かかります。常時稼働にするには Starter にアップグレードしてください。

### 再デプロイ後のデータ損失

無料枠（永続ディスクなし）で発生します。有料プランにアップグレードするか、Render シェルから `openclaw backup create` で定期的にバックアップをエクスポートしてください。

### ヘルスチェック失敗

ビルドは成功するのにデプロイが失敗する場合、サービスの起動に時間がかかりすぎているか、`/health` に到達できない可能性があります。以下を確認してください。

- エラーがないかビルドログ
- コンテナがローカルで `docker build && docker run` により実行できるかどうか

## 次のステップ

- メッセージングチャンネルを設定する: [Channels](/ja-JP/channels)
- Gateway を設定する: [Gateway configuration](/ja-JP/gateway/configuration)
- OpenClaw を最新に保つ: [Updating](/ja-JP/install/updating)
