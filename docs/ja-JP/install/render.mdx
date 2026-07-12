---
read_when:
    - OpenClaw を Render にデプロイする
    - Render Blueprints を使用した宣言的なクラウドデプロイを行いたい場合
summary: Infrastructure-as-Code を使用して OpenClaw を Render にデプロイする
title: レンダリング
x-i18n:
    generated_at: "2026-07-11T22:20:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5fbb3c6df04e186df958a62a6130da4e3e485acfeecc7e85fee0d5b69a0438f
    source_path: install/render.mdx
    workflow: 16
---

リポジトリの `render.yaml` Blueprint を使用して、OpenClaw を [Render](https://render.com) にデプロイします。このファイル1つで、サービス、ディスク、環境変数を定義します。

## 前提条件

- [Render アカウント](https://render.com)（無料プランあり）
- 使用する[モデルプロバイダー](/ja-JP/providers)の API キー

## デプロイ

[Render にデプロイ](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

これにより、`render.yaml` から Render サービスが作成され、Docker イメージがビルドされてデプロイされます。サービス URL は `https://<service-name>.onrender.com` という形式になります。

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
        generateValue: true # 安全なトークンを自動生成
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

| 機能                  | 目的                                                         |
| --------------------- | ------------------------------------------------------------ |
| `runtime: docker`     | リポジトリの Dockerfile からビルドします                     |
| `healthCheckPath`     | Render が `/health` を監視し、異常なインスタンスを再起動します |
| `generateValue: true` | 暗号学的に安全な値を自動生成します                           |
| `disk`                | 再デプロイ後も保持される永続ストレージです                   |

## プランの選択

| プラン    | スピンダウン          | ディスク      | 最適な用途                    |
| --------- | --------------------- | ------------- | ----------------------------- |
| Free      | 15分間アイドル後      | 利用不可      | テスト、デモ                  |
| Starter   | なし                  | 1GB以上       | 個人利用、小規模チーム        |
| Standard+ | なし                  | 1GB以上       | 本番環境、複数チャンネル      |

Blueprint のデフォルトは `starter` です。無料プランを使用するには、フォークしたリポジトリの `render.yaml` で `plan: free` に変更します。ただし永続ディスクがないため、デプロイのたびに OpenClaw の状態がリセットされる点に注意してください。

## デプロイ後

### Control UI へのアクセス

ウェブダッシュボードは `https://<your-service>.onrender.com/` で利用できます。共有シークレットで接続します。自動生成された `OPENCLAW_GATEWAY_TOKEN`（**Dashboard → your service → Environment** で確認できます）を使用するか、パスワード認証に切り替えた場合はパスワードを使用します。

### ログ

**Dashboard → your service → Logs** には、ビルドログ（Docker イメージの作成）、デプロイログ（サービスの起動）、ランタイムログ（アプリケーションの出力）が表示されます。

### シェルアクセス

**Dashboard → your service → Shell** でシェルセッションを開きます。永続ディスクは `/data` にマウントされています。

### 環境変数

**Dashboard → your service → Environment** で変数を編集します。変更すると自動的に再デプロイされます。

### 自動デプロイ

接続されたリポジトリのブランチに新しいコミットが追加されると、Render は自動的に再デプロイします。自身のフォークではなく `openclaw/openclaw` から直接デプロイした場合、再デプロイをトリガーするためのプッシュ権限がありません。その場合は Dashboard から Blueprint の同期を手動で実行するか、サービスの参照先を自身のフォークに変更してください。

## カスタムドメイン

1. **Dashboard → your service → Settings → Custom Domains**
2. ドメインを追加します
3. 指示に従って DNS を設定します（`*.onrender.com` への CNAME）
4. Render が TLS 証明書を自動的にプロビジョニングします

## スケーリング

- **垂直スケーリング**：プランを変更して CPU/RAM を増やします。通常は OpenClaw に十分です。
- **水平スケーリング**：インスタンス数を増やします（Standard プラン以上）。OpenClaw はランタイム状態をローカルディスクに保持するため、スティッキーセッションまたは外部状態管理が必要です。

## バックアップと移行

Render Dashboard のシェルから、状態、設定、認証プロファイル、ワークスペースをいつでもエクスポートできます。

```bash
openclaw backup create
```

これにより、移植可能なバックアップアーカイブが作成されます。[バックアップ](/ja-JP/cli/backup)を参照してください。

## トラブルシューティング

### サービスが起動しない

Render Dashboard でデプロイログを確認してください。一般的な問題は次のとおりです。

- `OPENCLAW_GATEWAY_TOKEN` がない — **Dashboard → Environment** で設定されていることを確認します
- ポートが一致しない — Gateway が Render の想定するポートにバインドされるように、`OPENCLAW_GATEWAY_PORT=8080` であることを確認します

### コールドスタートが遅い（無料プラン）

無料プランのサービスは、15分間操作がないとスピンダウンします。スピンダウン後の最初のリクエストでは、コンテナの起動に数秒かかります。常時稼働させるには Starter にアップグレードしてください。

### 再デプロイ後のデータ消失

無料プランでは永続ディスクがないため発生します。有料プランにアップグレードするか、Render のシェルから `openclaw backup create` を実行して定期的にバックアップをエクスポートしてください。

### ヘルスチェックの失敗

ビルドは成功するもののデプロイが失敗する場合、サービスの起動に時間がかかりすぎているか、`/health` にアクセスできない可能性があります。次を確認してください。

- ビルドログにエラーがないか
- `docker build && docker run` でコンテナがローカル実行できるか

## 次のステップ

- メッセージングチャンネルを設定する：[チャンネル](/ja-JP/channels)
- Gateway を設定する：[Gateway の設定](/ja-JP/gateway/configuration)
- OpenClaw を最新の状態に保つ：[更新](/ja-JP/install/updating)
