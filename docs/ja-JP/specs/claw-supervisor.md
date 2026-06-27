---
read_when:
    - Codex フリート監督の設計
    - OpenClaw ツールを構築して Codex セッションを読み取り、誘導し、または生成する
    - 監視付き Codex の local、Cloudflare、VPS デプロイの選択
summary: OpenClaw によって制御される Codex app-server セッションのフリート監視計画。
title: Claw Supervisor
x-i18n:
    generated_at: "2026-06-27T13:04:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ecdd58730011c94796c6df1d757606aad7112d2f36f30921541ac7f5d46ad91f
    source_path: specs/claw-supervisor.md
    workflow: 16
---

# Claw Supervisor

## 目標

Claw Supervisor は、常時稼働する 1 つの OpenClaw インスタンスが、通常の Codex ユーザー体験を変えずに Codex セッション群を監視して駆動できるようにする。ユーザーはホストに SSH し、Codex を起動し、TUI で作業しながら、同時にスーパーバイザーにそのセッションを読ませ、誘導させ、割り込みさせ、関連セッションを生成させ、ハンドオフを受け入れさせることができる。Codex セッションは MCP を通じて OpenClaw にコールバックすることもできる。

## プロダクトモデル

Codex は主要な作業面であり続ける。OpenClaw は、不透明な OpenClaw サブエージェントの中に Codex を隠すのではなく、Codex を監督する。

OpenClaw Plugin の名前は `codex-supervisor`。`crabfleet` は再利用可能な Plugin 名ではなく、CRAB マシン用のデプロイメントおよびホストフリートプロファイルとして残る。

このモデルには 3 つのロールがある。

- 人間がアタッチした Codex: 共有 app-server を通じて起動される通常の対話型 Codex TUI。
- 自律 Codex: スーパーバイザーによって生成され、後から人間がアタッチできる Codex app-server スレッド。
- スーパーバイザー Claw: フリート状態、トランスクリプト読み取り、誘導、割り込み、生成、ハンドオフのためのツールを持つ、常時稼働の OpenClaw エージェント。

OpenClaw は内部で既存のサブエージェント機構を使ってもよいが、外部契約は Codex スレッド ID を持つ、アタッチ可能な Codex セッションである。

## アーキテクチャ

```text
user SSH session
  -> codex --remote unix://... or ws://...
      -> local codex app-server daemon
          <-> host sidecar / supervisor connector
              <-> OpenClaw fleet supervisor
                  <-> supervisor MCP exposed back to Codex
```

各 Codex 対応ホストは次を実行する。

- Codex app-server デーモン。
- 対話型 Codex を常に `--remote` 付きで起動するランチャー。
- app-server エンドポイントとライブスレッドをスーパーバイザーに登録するコネクター。

スーパーバイザーは次を実行する。

- エンドポイントレジストリ。
- セッションレジストリ。
- Codex app-server JSON-RPC クライアントプール。
- Codex から Claw への呼び出し用 MCP サーバー。
- Claw から Codex への制御用 OpenClaw ツール。
- 自律アクション、承認、ループ防止のためのポリシーエンジン。

## Codex App-Server 契約

Codex app-server API を正規の制御プレーンとして使用する。

- `initialize`, `initialized`
- `thread/loaded/list`
- `thread/list`
- `thread/read`
- `thread/resume`
- `thread/start`
- `turn/start`
- `turn/steer`
- `turn/interrupt`
- `model/list`

対話型 Codex は `codex --remote <endpoint>` で起動し、TUI とスーパーバイザーが同じ app-server に接続する必要がある。スタンドアロンの `codex exec` は現時点ではライブ共有セッションではない。Codex が `exec --remote` をサポートするまでは、自律作業には app-server API を使用する。

## セッションレジストリ

スーパーバイザーは、観測された Codex スレッドごとに 1 件のレコードを保存する。

```json
{
  "sessionId": "codex-thread-id",
  "endpointId": "host-a",
  "host": "host-a.example",
  "workspace": "/workspace/repo",
  "repo": "owner/repo",
  "branch": "feature/example",
  "source": "vscode",
  "status": "idle",
  "humanAttached": true,
  "lastSeenAt": "2026-05-28T10:00:00.000Z",
  "summary": "Short working-state summary"
}
```

ローカル実装では、ほとんどのフィールドを Codex スレッドメタデータから導出できる。フリートデプロイメントでは、ホスト ID、人間のアタッチ状態、git 状態、サイドカーのヘルスでレコードを補強する必要がある。

## Codex 向け MCP 面

監督対象のすべての Codex は、`openclaw-codex-supervisor` という名前の MCP サーバーを取得する。

ツール:

- `codex_sessions_list`: 可視の Codex セッションを一覧表示する。
- `codex_session_read`: 1 つのトランスクリプトを読む。
- `codex_session_send`: アイドル状態のスレッドにメッセージを送るか、アクティブなスレッドを誘導する。
- `codex_session_interrupt`: アクティブなターンに割り込む。
- `codex_endpoint_probe`: エンドポイント接続性を検証する。
- `claw_report_progress`: 現在のタスク状態をスーパーバイザーへ公開する。
- `claw_ask`: スーパーバイザーに支援または委任を求める。
- `codex_spawn`: 新しい自律 Codex セッションを作成する。
- `codex_handoff`: 人間またはピアによる引き継ぎを要求する。

リソース:

- `codex://sessions`
- `codex://sessions/{sessionId}`
- `codex://sessions/{sessionId}/transcript`

## Claw 制御面

常時稼働の Claw は、内部ツールと同じプリミティブを取得する。

- セッションとエンドポイントを一覧表示する
- トランスクリプトを読む
- テキストを送信または誘導する
- アクティブな作業に割り込む
- 新しいセッションを生成する
- セッションを要約して割り当てる
- フィルターされたグループへ指示をブロードキャストする
- セッションをブロック中、完了、または放棄としてマークする

ツールの動作:

- 対象スレッドがアイドル状態の場合、`codex_session_send` は `turn/start` にマップされる。
- 対象スレッドがアクティブで、進行中のターン ID が可視の場合、`turn/steer` にマップされる。
- アクティブなターンを識別できない場合、ツールは無関係なターンを作成せずにフェイルクローズする。
- Codex に公開される MCP 書き込み制御は、信頼されたスーパーバイザー専用ポリシーが有効にしない限り無効のままにする。
- 生のトランスクリプト読み取りは、信頼されたスーパーバイザー専用ポリシーが有効にしない限り無効のままにする。
- 自律承認のデフォルトでは、明示的なポリシーが別途許可しない限り、ツールおよびファイル承認を拒否する。

## 起動フロー

対話型ホストログイン:

1. ユーザーが CRAB ホストに SSH する。
2. SSH サービスが `codex app-server daemon start` を開始または検証する。
3. ログインラッパーが `codex --remote unix:// --cd <workspace>` を起動する。
4. ホストコネクターがエンドポイントと読み込み済みスレッドを登録する。
5. スーパーバイザーが高優先度のフリートイベントを発行する: 新しい Codex セッション、ワークスペース、人間アタッチ状態、現在のタスクプレビュー。
6. スーパーバイザー Claw は直ちに読み取りと誘導ができる。

自律生成:

1. スーパーバイザーがホストとワークスペースを選択する。
2. ホストコネクターが Codex app-server スレッドを開くか再開する。
3. スーパーバイザーがタスク本文と MCP 設定で最初のターンを開始する。
4. セッションレジストリがそれを自律かつアタッチ可能としてマークする。
5. Codex がその正確な UX をサポートした後、人間は `codex --remote <endpoint> resume <threadId>` で後からアタッチできる。または同じ app-server 上の現在の再開フローを使用できる。

## デプロイメント

推奨制御プレーン:

- ホストコネクターはスーパーバイザーへのアウトバウンド WebSocket 接続を維持する。
- スーパーバイザー状態は OpenClaw Gateway ストレージに置く。
- Codex app-server は各ホストのローカルに残す。認証されていない生の app-server を公開インターネットにさらしてはならない。

Cloudflare の実現性:

- レジストリ、Durable Objects、WebSocket ファンイン、軽量イベントルーティング、公開 MCP/Gateway エンドポイントには適している。
- Workers は任意のプライベート Unix ソケットや local loopback app-server にダイヤルできないため、プライベートホストを直接制御するにはそれだけでは不十分。
- すべてのホストコネクターがアウトバウンド WebSocket でコールホームする場合に Cloudflare を使う。

VPS フォールバック:

- 長寿命プロセス制御、SSH トンネル、プライベートネットワークルーティング、またはローカルファイルシステムアクセスが必要な場合は Hetzner サービスを使う。
- 同じプロトコルを維持する: ホストコネクターはアウトバウンド、スーパーバイザーレジストリは中央、Codex app-server はローカル。

## セキュリティ

- デフォルトのバインド先はローカル Unix ソケット。
- リモート app-server はトークンまたは署名付き bearer 認証を使用する。
- ホストコネクターはスコープ付きホストトークンでスーパーバイザーに認証する。
- スーパーバイザーツールはセッションごとのポリシーを強制する: 読み取り、誘導、割り込み、生成、承認。
- クロスエージェントメッセージには `originSessionId` を含める。自己エコーは破棄される。
- ブロードキャストには明示的なフィルターと上限付きの対象数が必要。
- トランスクリプト読み取りは OpenClaw 境界でシークレットを編集する。
- 承認リクエストは、ポリシーが許可しない限り、スーパーバイザー由来のターンではデフォルトで拒否される。

## 実装計画

フェーズ 1: ローカルスーパーバイザー MVP

- stdio プロキシおよび WebSocket エンドポイント用の Codex app-server JSON-RPC クライアントを追加する。
- スーパーバイザーのエンドポイントおよびセッションレジストリを追加する。
- MCP ツールを追加する: list、read、send、interrupt、probe。
- エンドポイント用のローカル env 設定を追加する。
- 偽の app-server テストと、1 つのライブローカル app-server スモークを追加する。

フェーズ 2: OpenClaw 統合

- `codex-supervisor` Plugin にスーパーバイザーツールを登録する。
- Codex スレッド設定にスーパーバイザー MCP を注入する。
- エージェントコンテキストにセッション要約を追加する。
- 新しい Codex スレッドが出現したときのイベント通知を追加する。
- 自律的な送信、割り込み、生成のためのポリシー設定を追加する。

フェーズ 3: フリートコネクター

- ホストサイドカーが app-server エンドポイント、ホストメタデータ、git/ワークスペースメタデータ、人間のアタッチ状態を登録する。
- Cloudflare または VPS 制御プレーン用のアウトバウンド WebSocket コネクターを追加する。
- 再接続、heartbeat、古いセッションのクリーンアップを追加する。
- CRAB SSH ランチャーラッパーを追加する。

フェーズ 4: 自律運用

- 生成、再開、引き継ぎフローを追加する。
- ブロードキャストと委任を追加する。
- 進捗レポートとタスク状態要約を追加する。
- ループ防止とレート制限を追加する。
- ダッシュボードビューを追加する。

フェーズ 5: マルチ Claw

- グループごとにセッションをシャーディングする。
- 各セッションにリーダーシップ/リースを追加する。
- 監査ログとリプレイを追加する。
- Claw グループ間のエスカレーションを追加する。

## 受け入れテスト

- 人間が共有 app-server を通じて Codex TUI を起動する。
- スーパーバイザーが `thread/loaded/list` 経由でライブスレッドを一覧表示する。
- スーパーバイザーが `thread/read` 経由でトランスクリプトを読む。
- スーパーバイザーが `turn/start` 経由でアイドル状態のスレッドにテキストを送信する。
- スーパーバイザーが `turn/steer` 経由でアクティブなスレッドを誘導する。
- スーパーバイザーの割り込みが `turn/interrupt` 経由でアクティブなターンを停止する。
- Codex がスーパーバイザー MCP を呼び出し、ピアセッションを一覧表示する。
- 自律 Codex が生成され、後から人間がアタッチする。
- ホストコネクターの喪失により、履歴を削除せずにセッションが stale としてマークされる。

## 未解決の質問

- TUI なしで生成された app-server スレッドに対する、正確な Codex TUI アタッチ UX。
- Codex がヘッドレスなライブ共有実行向けに `exec --remote` を追加すべきかどうか。
- 永続状態の所有者: OpenClaw Gateway DB、Cloudflare Durable Object、または VPS データベース。
- スーパーバイザー由来ターンの承認ポリシー粒度。
- 常時稼働 Claw コンテキストへ注入するトランスクリプト要約の量と、ツール/リソースとして保持する量。
