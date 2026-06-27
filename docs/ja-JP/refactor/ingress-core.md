---
read_when:
    - チャネル受信経路のリファクタリングでコードが増えすぎた理由を監査する
    - 同梱Pluginからコアへルート、コマンド、イベント、アクティベーション、またはアクセスグループポリシーを移動する
    - チャネル受信ヘルパーが実際に同梱Pluginコードを削除するかをレビューしています
sidebarTitle: Ingress core deletion
summary: 繰り返しのチャネル受信つなぎ込み処理をコアへ移すための削除優先の計画。
title: Ingress コア削除計画
x-i18n:
    generated_at: "2026-05-12T00:59:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1fdf1e7c9636d02c48c4b5d2b4a51470317dd64e2270c7fae779777c0d787afc
    source_path: refactor/ingress-core.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Ingress コア削除計画

Ingress リファクタリングは、正味で数千行を追加している間は健全ではない。コア
集中化と見なせるのは、同梱Pluginの本番コードが小さくなり、
古いサードパーティ SDK 互換性が SDK/コア shim に隔離される場合だけである。

望ましいランタイム形状:

```text
bundled plugin event
  -> extract platform facts locally
  -> resolve shared ingress once when facts are available
  -> branch on generic ingress projections/outcomes
  -> perform platform side effects locally

old third-party helper
  -> SDK compatibility shim
  -> shared ingress-compatible projection where possible
  -> old return shape preserved
```

同梱Pluginは、その型が公開Plugin APIでない限り、ingress をローカルの `AccessResult`、
`GroupAccessDecision`、`CommandAuthDecision`、`DmCommandAccess`、または
`{ allowed, reasonCode }` 形状へ戻す変換をしてはならない。

## 予算

`origin/main` との PR merge-base を基準に測定し、未追跡ファイルも含める。

```text
merge-base            1671e7532adb

current:
core production       +3,922 / -546    = +3,376
docs                  +601 / -17       = +584
other                 +145 / -2        = +143
plugin production     +4,148 / -5,388  = -1,240
tests                 +2,326 / -2,414  = -88
total                 +11,142 / -8,367 = +2,775

required:
plugin production     <= -1,500
core production       <= +1,500, or paid for by larger plugin deletion
tests                 <= +1,000
total                 <= +2,000

stretch:
plugin production     <= -2,500
core production       <= +1,200
total                 <= 0
```

最低限残っているクリーンアップ:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

コメントだけの削除はクリーンアップとして数えない。前回の予算パスは、
復元された QQBot の説明コメントを含めていたため寛大すぎた。この
ドキュメントでは、実行可能コード/docs/test コードの移動のみを追跡する。

各クリーンアップの波の後に再測定する:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## 診断

最初のパスでは共有 ingress カーネルを追加したが、その横に Plugin ローカルの
認可を残しすぎた:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

これはモデルを重複させている。コア本番コードは約 3,376 行増えた一方で、
同梱Plugin本番コードは 1,240 行小さくなった。最初のパスよりは良いが、
最低限の予算内には収まっていない。修正は引き続き削除優先である:

- ingress フィールドの名前を変えるだけの Plugin DTO を削除する
- ラッパー形状だけをアサートするテストを削除する
- 同じパッチで同梱Pluginコードを削除する場合にのみ、コアヘルパーを追加する
- 古い SDK 互換性は SDK/コア shim のみに保持する
- ラッパー削除によって安定した形状が見えた後にコアを再梱包する

## ホットスポット

まだ縮小が必要な、正の同梱本番ファイル:

```text
extensions/telegram/src/ingress.ts                        +126
extensions/discord/src/monitor/dm-command-auth.ts         +101
extensions/signal/src/monitor/access-policy.ts             +92
extensions/feishu/src/policy.ts                            +85
extensions/slack/src/monitor/auth.ts                       +64
extensions/googlechat/src/monitor-access.ts                +59
extensions/nextcloud-talk/src/inbound.ts                   +51
extensions/matrix/src/matrix/monitor/access-state.ts       +49
extensions/irc/src/inbound.ts                              +44
extensions/imessage/src/monitor/inbound-processing.ts      +36
extensions/qa-channel/src/inbound.ts                       +34
extensions/qqbot/src/bridge/sdk-adapter.ts                 +33
extensions/tlon/src/monitor/utils.ts                       +30
extensions/twitch/src/access-control.ts                    +22
extensions/qqbot/src/engine/commands/slash-command-handler.ts +20
extensions/telegram/src/bot-handlers.runtime.ts            +19
```

ブランチはまだ最低限の予算内にない。残っているレビュー関連の作業は、
別のコア抽象化を追加する前に、重複した認可フロー、turn スキャフォールディング、
またはラッパーテストを削除するべきである。

## 現在のコード読解

健全なコアのつなぎ目はすでに `src/channels/message-access/runtime.ts` に存在する:
これは identity アダプター、有効な許可リスト、pairing-store 読み取り、route
descriptor、command/event プリセット、access group、そして最終的に解決された
`ResolvedChannelMessageIngress` projection を所有している。

残っている増加分は、主にそのつなぎ目の上に重ねられた Plugin グルーである:

- `extensions/telegram/src/ingress.ts` はコア決定を Telegram 固有の
  command/event ヘルパーでラップし、その後も呼び出し側が事前計算済みの正規化済み
  許可リストと owner リストを渡している。
- `extensions/discord/src/monitor/dm-command-auth.ts`、
  `extensions/feishu/src/policy.ts`、`extensions/googlechat/src/monitor-access.ts`、
  および `extensions/matrix/src/matrix/monitor/access-state.ts` は、ingress の横に
  ローカル policy DTO またはレガシー decision 名をまだ保持している。
- `extensions/signal/src/monitor/access-policy.ts` は、Signal の identity 正規化と
  pairing 応答をローカルに保つ点は正しいが、直接的な ingress 消費へ畳み込むべき
  ラッパーのつなぎ目がまだある。
- `extensions/nextcloud-talk/src/inbound.ts`、`extensions/irc/src/inbound.ts`、
  `extensions/qa-channel/src/inbound.ts`、`extensions/zalo/src/monitor.ts`、および
  `extensions/zalouser/src/monitor.ts` は、ingress カーネル外の共有 turn ヘルパーへ
  移せる route/envelope/turn 組み立てをまだ繰り返している。

結論: コアへさらにコードを移すことが有用なのは、同じパッチでこれらの
Plugin ラッパーレイヤーを削除する場合だけである。ラッパー戻り値を残したまま
別の抽象化を追加すると、同じ誤りを繰り返す。

## 境界

コアは汎用 policy を所有する:

- 許可リストの正規化とマッチング
- access-group 展開と diagnostics
- pairing-store DM 許可リスト読み取り
- route、sender、command、event、および activation gate
- admission mapping: dispatch、drop、skip、observe、pairing
- redacted state、decisions、diagnostics、および SDK compatibility projections
- identity、route、command、event、activation、および outcomes の再利用可能な汎用 descriptor

Pluginは transport facts と副作用を所有する:

- webhook/socket/request の真正性
- プラットフォーム identity 抽出と API lookup
- channel 固有の policy デフォルト
- pairing challenge の配信、replies、acks、reactions、typing、media、history、
  setup、doctor、status、logs、およびユーザー向けコピー

コアは channel 非依存のままでなければならない: `src/channels/message-access` 内に
Discord、Slack、Telegram、Matrix、room、guild、space、API client、または
Plugin 固有のデフォルトを置かない。

## 受け入れルール

すべての新しいコアヘルパーは、同梱Plugin本番コードを即座に削除しなければならない。

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

以下の場合は停止して設計を見直す:

- Plugin 本番 LOC が増える
- production の縮小より tests の増加が速い
- 同梱ホットパスが `ResolvedChannelMessageIngress` の名前を変えるだけの DTO を返す
- コアヘルパーが channel id、platform object、API client、または channel 固有のデフォルトを必要とする

## 作業パッケージ

1. 予算を固定する。
   PR に LOC を載せ、deprecated-ingress lint を green に保ち、クリーンアップコミットに
   before/after LOC を含める。

2. 薄い DTO のつなぎ目を削除する。
   Plugin ローカルのラッパー戻り値を `ResolvedChannelMessageIngress`、
   `senderAccess`、`commandAccess`、`routeAccess`、または `ingress` の直接読み取りに
   置き換える。QQBot、Telegram、Slack、Discord、Signal、Feishu、Matrix、iMessage、
   Tlon から始める。ラッパー形状テストを削除し、動作テストは保持する。

3. 削除を伴う場合にのみ outcome classification を追加する。
   汎用 classifier は `dispatch`、`pairing-required`、`skip-activation`、
   `drop-command`、`drop-route`、`drop-sender`、および `drop-ingress` を公開してよい。
   これは reason string ではなく decision graph から導出し、同じパッチで少なくとも
   3 つの Plugin を移行しなければならない。

4. 削除を伴う場合にのみ route descriptor builder を追加する。
   汎用 route target と route sender ヘルパーは、route が重い Plugin を即座に縮小する
   場合にのみ許容される: Google Chat、IRC、Microsoft Teams、Nextcloud Talk、
   Mattermost、Slack、Zalo、Zalo Personal。

5. 削除を伴う場合にのみ command/event プリセットを追加する。
   text-command、native-command、callback、および origin-subject 形状を集中化する。
   command consumer は command gate が実行されなかった場合にデフォルトで unauthorized
   としなければならない。event は pairing を開始してはならない。

6. boilerplate を削除する場所でのみ identity プリセットを共有する。
   stable-id、stable-id-plus-aliases、phone/e164、および multi-identifier ヘルパーは、
   raw values がアダプター入力のみに入り、redacted state が不透明 ID/counts を保持する場合に許可される。

7. authorized turn assembly を共有する。
   ingress カーネルの外側で、QA Channel、IRC、Nextcloud Talk、Zalo、Zalo Personal から
   繰り返しの route/envelope/context/reply スキャフォールディングを削除する。
   コアは route/session/envelope/dispatch sequencing を所有してよい。Pluginは
   delivery と channel 固有の context を保持する。

8. 互換性を隔離する。
   Deprecated SDK ヘルパーはソース互換性を保つが、同梱ホットパスは deprecated ingress
   または command-auth facade を import してはならない。互換性テストは、同梱Plugin
   internals ではなく fake third-party plugins を使用するべきである。

9. コアを再梱包する。
   ラッパー削除後、1 回だけ使われる module を畳み、未使用 export を削除し、
   compatibility projection をホットパス外へ移動し、identity、route、command/event、
   activation、access groups、および compatibility shims の焦点を絞ったテストを保つ。

## 削除の波

この順に実行する。各波は同梱 production LOC を下げなければならない。

1. ラッパーの畳み込み、期待される Plugin delta: -400 から -600。
   Plugin ローカルの `resolveXAccess`、`resolveXCommandAccess`、および
   `accessFromIngress` の結果型を、`ResolvedChannelMessageIngress` からの直接読み取りに
   置き換える。最初の対象: Discord DM command auth、Feishu policy、Matrix access state、
   Telegram ingress、Signal access policy、QQBot SDK adapter。

2. 共有 outcome ヘルパー、期待される Plugin delta: -200 から -350。
   少なくとも 3 つの Plugin にまたがる、繰り返しの `shouldBlockControlCommand`、
   pairing、activation skip、route block、sender block ladder を削除する場合にのみ、
   1 つの汎用 classifier を追加する。

3. route descriptor builder、期待される Plugin delta: -200 から -350。
   繰り返しの route target と route sender descriptor assembly をコアヘルパーへ移す。
   最初の対象: Google Chat、IRC、Microsoft Teams、Nextcloud Talk、Mattermost、Slack、
   Zalo、Zalo Personal。

4. turn assembly 共有、期待される Plugin delta: -250 から -450。
   単純な inbound Plugin には共通の route/session/envelope/dispatch sequencing を使う。
   最初の対象: QA Channel、IRC、Nextcloud Talk、Zalo、Zalo Personal。

5. コア再梱包、期待される core delta: -300 から -700。
   Plugin が runtime projections を直接消費した後、1 回だけ使われる module を削除し、
   小さなファイルを `runtime.ts` または焦点を絞った sibling へ戻してマージし、
   SDK 互換性ファイルを同梱ホットパスから分離して保つ。

6. テストの剪定、期待される test delta: -300 から -600。
   削除されたラッパー形状だけをアサートするテストを削除する。command denial、
   group fallback、origin-subject matching、activation skip、access groups、pairing、
   および redaction の動作テストは保持する。

これらの波の後に期待される最低限の着地形状:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## 移動してはならない

プラットフォーム設定のデフォルト、セットアップ UX、doctor/fix の文言、API ルックアップ、
Slack のオーナープレゼンスチェック、Matrix のエイリアス/検証処理、Telegram の
コールバック解析、コマンド構文解析、ネイティブコマンド登録、リアクション
ペイロード解析、ペアリング返信、コマンド返信、ACK、入力中表示、メディア、履歴、
またはログを移動しない。

## 検証

対象を絞った local loopback:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

LOC の傾向が予算内に収まったら、広範な変更ゲート/フルスイートの証明には Testbox を使用する。

各ワークパッケージは以下を記録する。

- カテゴリ別の変更前/変更後 LOC
- 削除された Plugin ラッパー
- 新しいコアヘルパーの LOC（ある場合）
- 実行した対象テスト
- 残りのホットスポット一覧

## 終了基準

- バンドル済み本番インポートが非推奨の channel-access または command-auth ファサードを使っていない
- 互換性コードが SDK/コアの境界に隔離されている
- バンドル済み Plugin が ingress projection または汎用 outcome を直接消費する
- Plugin 本番 LOC が `origin/main` に対して少なくとも 1,500 純減している
- コア本番 LOC が `<= +1,500`、または超過分が全体を
  `<= +2,000` に保ったまま相殺されている
- 代表的なテストが、リダクション、ルート、コマンド/イベント、アクティベーション、
  access-group、およびチャネル固有のフォールバック動作をカバーしている
