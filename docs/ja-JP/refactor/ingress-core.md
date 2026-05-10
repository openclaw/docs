---
read_when:
    - チャネルの受信経路リファクタリングでコードが増えすぎた理由を監査する
    - バンドルされた Plugin からコアへ、ルート、コマンド、イベント、アクティベーション、またはアクセスグループポリシーを移動すること
    - チャネルイングレスヘルパーがバンドルされた Plugin コードを実際に削除するかを確認しています
sidebarTitle: Ingress core deletion
summary: 繰り返しのチャネル入力連携コードをコアへ移すための、削除優先の計画。
title: イングレスコアの削除計画
x-i18n:
    generated_at: "2026-05-10T19:51:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71afcf5d4f58c57ecfe7b388325279700a723ec1fcd926f644095106b662c3d0
    source_path: refactor/ingress-core.md
    workflow: 16
---

# ingress コア削除計画

ingress リファクタリングは、正味で数千行を追加している間は健全ではありません。コアへの
集約が意味を持つのは、バンドル済み Plugin の本番コードが小さくなり、
古いサードパーティ SDK 互換性が SDK/コアの shim に隔離される場合だけです。

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

バンドル済み Plugin は、その型が公開 Plugin API でない限り、ingress をローカルの `AccessResult`、
`GroupAccessDecision`、`CommandAuthDecision`、`DmCommandAccess`、または
`{ allowed, reasonCode }` の形状へ戻す変換を行うべきではありません。

## 予算

`origin/main` との PR merge-base を基準に測定します。未追跡ファイルも含みます。

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

コメントだけの削除はクリーンアップとして数えません。前回の予算パスは、
復元された QQBot の説明コメントを含めていたため甘すぎました。このドキュメントでは、
実行可能コード、docs、test コードの移動のみを追跡します。

各クリーンアップの波の後に再測定します:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## 診断

最初のパスでは共有 ingress カーネルを追加した後、その横に Plugin ローカルの
authorization を残しすぎました:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

これによりモデルが重複しています。コア本番コードは約 3,376 行増えた一方で、
バンドル済み Plugin 本番コードは 1,240 行小さくなりました。これは最初のパスよりは良いですが、
最低予算内には収まっていません。修正方針は引き続き削除優先です:

- ingress フィールドの名前を変えるだけの Plugin DTO を削除する
- wrapper 形状だけをアサートするテストを削除する
- 同じパッチでバンドル済み Plugin コードを削除する場合にのみコア helper を追加する
- 古い SDK 互換性は SDK/コア shim のみに保持する
- wrapper 削除によって安定した形状が見えた後にコアを再梱包する

## ホットスポット

まだ縮小が必要な、正の差分を持つバンドル済み本番ファイル:

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

このブランチはまだ最低予算内に収まっていません。残りのレビュー関連作業では、
別のコア抽象を追加する前に、繰り返しの authorization フロー、turn scaffolding、
または wrapper テストを削除するべきです。

## 現在のコード読み取り

健全なコア seam はすでに `src/channels/message-access/runtime.ts` に存在します。
これは identity adapter、有効な allowlist、pairing-store 読み取り、route descriptor、
command/event preset、access group、そして最終的に解決された
`ResolvedChannelMessageIngress` projection を所有しています。

残っている増加分の大半は、その seam の上に積まれた Plugin glue です:

- `extensions/telegram/src/ingress.ts` はコア decision を Telegram 固有の
  command/event helper でラップし、その後も call site は事前計算済みの正規化 allowlist と
  owner list を渡しています。
- `extensions/discord/src/monitor/dm-command-auth.ts`、
  `extensions/feishu/src/policy.ts`、`extensions/googlechat/src/monitor-access.ts`、
  `extensions/matrix/src/matrix/monitor/access-state.ts` は、ingress の横にまだ
  ローカル policy DTO または legacy decision 名を保持しています。
- `extensions/signal/src/monitor/access-policy.ts` は Signal の identity 正規化と
  pairing reply を正しくローカルに保持していますが、直接 ingress を消費する形に畳み込むべき
  wrapper seam がまだあります。
- `extensions/nextcloud-talk/src/inbound.ts`、`extensions/irc/src/inbound.ts`、
  `extensions/qa-channel/src/inbound.ts`、`extensions/zalo/src/monitor.ts`、および
  `extensions/zalouser/src/monitor.ts` は、ingress カーネル外の共有 turn helper へ移動できる
  route/envelope/turn 組み立てをまだ繰り返しています。

結論: さらにコードをコアへ移動することが有用なのは、同じパッチでこれらの
Plugin wrapper レイヤーを削除する場合だけです。wrapper の戻り値を残したまま別の抽象を追加すると、
同じ過ちを繰り返します。

## 境界

コアは汎用 policy を所有します:

- allowlist 正規化とマッチング
- access-group 展開と診断
- pairing-store DM allowlist 読み取り
- route、sender、command、event、activation gate
- admission mapping: dispatch、drop、skip、observe、pairing
- redacted state、decision、診断、SDK 互換 projection
- identity、route、command、event、activation、outcome のための再利用可能な汎用 descriptor

Plugin は transport fact と副作用を所有します:

- webhook/socket/request の真正性
- プラットフォーム identity 抽出と API lookup
- channel 固有の policy default
- pairing challenge 配信、reply、ack、reaction、typing、media、history、
  setup、doctor、status、log、およびユーザー向け copy

コアは channel 非依存を維持する必要があります。`src/channels/message-access` 内に
Discord、Slack、Telegram、Matrix、room、guild、space、API client、または Plugin 固有の default を
置いてはいけません。

## 受け入れルール

新しいコア helper はすべて、バンドル済み Plugin 本番コードを即座に削除しなければなりません。

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

次の場合は停止して再設計します:

- Plugin 本番 LOC が増える
- production の縮小より速く tests が増える
- バンドル済み hot path が `ResolvedChannelMessageIngress` の名前を変えるだけの DTO を返す
- コア helper が channel id、platform object、API client、または channel 固有の default を必要とする

## 作業パッケージ

1. 予算を固定する。
   PR に LOC を載せ、deprecated-ingress lint を green に保ち、cleanup commit に before/after
   LOC を含めます。

2. 薄い DTO seam を削除する。
   Plugin ローカル wrapper の戻り値を、`ResolvedChannelMessageIngress`、
   `senderAccess`、`commandAccess`、`routeAccess`、または `ingress` の直接参照に置き換えます。
   QQBot、Telegram、Slack、Discord、Signal、Feishu、Matrix、iMessage、Tlon から始めます。
   wrapper-shape テストを削除し、behavior テストは保持します。

3. outcome 分類は削除とセットの場合のみ追加する。
   汎用 classifier は `dispatch`、`pairing-required`、`skip-activation`、
   `drop-command`、`drop-route`、`drop-sender`、および `drop-ingress` を公開してもかまいません。
   これは reason string ではなく decision graph から導出する必要があり、同じパッチで少なくとも
   3 つの Plugin を移行しなければなりません。

4. route descriptor builder は削除とセットの場合のみ追加する。
   汎用 route target と route sender helper は、route が多い Plugin を即座に縮小する場合のみ
   許容されます: Google Chat、IRC、Microsoft Teams、Nextcloud Talk、Mattermost、Slack、Zalo、
   Zalo Personal。

5. command/event preset は削除とセットの場合のみ追加する。
   text-command、native-command、callback、origin-subject の形状を集約します。
   command consumer は、command gate が実行されなかった場合はデフォルトで unauthorized にする必要があります。
   event は pairing を開始してはいけません。

6. identity preset は boilerplate を削除できる場合のみ共有する。
   stable-id、stable-id-plus-aliases、phone/e164、multi-identifier helper は、raw value が
   adapter input のみに入り、redacted state が opaque id/count を保持する場合に許可されます。

7. authorized turn assembly を共有する。
   ingress カーネルの外で、QA Channel、IRC、Nextcloud Talk、Zalo、Zalo Personal から
   繰り返しの route/envelope/context/reply scaffolding を削除します。
   コアは route/session/envelope/dispatch sequencing を所有してもかまいませんが、
   Plugin は delivery と channel 固有 context を保持します。

8. 互換性を隔離する。
   deprecated SDK helper は source-compatible のままにしますが、バンドル済み hot path は
   deprecated ingress や command-auth facade を import してはいけません。
   互換性テストは、バンドル済み Plugin internals ではなく、fake third-party Plugin を使うべきです。

9. コアを再梱包する。
   wrapper 削除後、one-use module を畳み、未使用 export を削除し、互換 projection を
   hot path から外し、identity、route、command/event、activation、access group、
   compatibility shim の focused test を維持します。

## 削除の波

この順序で実行します。各 wave はバンドル済み本番 LOC を減らす必要があります。

1. wrapper collapse、期待される Plugin delta: -400 から -600。
   Plugin ローカルの `resolveXAccess`、`resolveXCommandAccess`、および
   `accessFromIngress` の result type を、`ResolvedChannelMessageIngress` からの直接読み取りに置き換えます。
   最初の対象: Discord DM command auth、Feishu policy、Matrix access state、Telegram ingress、
   Signal access policy、QQBot SDK adapter。

2. 共有 outcome helper、期待される Plugin delta: -200 から -350。
   少なくとも 3 つの Plugin にまたがる繰り返しの `shouldBlockControlCommand`、pairing、
   activation skip、route block、sender block の ladder を削除できる場合のみ、汎用 classifier を 1 つ追加します。

3. route descriptor builder、期待される Plugin delta: -200 から -350。
   繰り返しの route target と route sender descriptor assembly をコア helper に移動します。
   最初の対象: Google Chat、IRC、Microsoft Teams、Nextcloud Talk、Mattermost、Slack、Zalo、Zalo Personal。

4. turn assembly sharing、期待される Plugin delta: -250 から -450。
   単純な inbound Plugin には共通の route/session/envelope/dispatch sequencing を使用します。
   最初の対象: QA Channel、IRC、Nextcloud Talk、Zalo、Zalo Personal。

5. core repack、期待される core delta: -300 から -700。
   Plugin が runtime projection を直接消費した後、one-use module を削除し、小さなファイルを
   `runtime.ts` または focused sibling に戻し、SDK compatibility ファイルをバンドル済み hot path から分離して保持します。

6. test pruning、期待される test delta: -300 から -600。
   削除された wrapper shape だけをアサートするテストを削除します。
   command denial、group fallback、origin-subject matching、activation skip、
   access group、pairing、redaction の behavior テストは保持します。

これらの wave 後に期待される最低限の landing shape:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## 移動してはいけないもの

プラットフォーム設定のデフォルト、セットアップ UX、doctor/fix の文言、API ルックアップ、
Slack のオーナー存在確認、Matrix エイリアス/検証処理、Telegram の
コールバック解析、コマンド構文解析、ネイティブコマンド登録、リアクション
ペイロード解析、ペアリング返信、コマンド返信、確認応答、入力中表示、メディア、履歴、
またはログを移動しないでください。

## 検証

対象を絞ったローカルループ:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

LOC の傾向が予算内に収まったら、広範な変更ゲート/フルスイート証明には Testbox を使用します。

各作業パッケージで記録する内容:

- カテゴリ別の変更前/変更後 LOC
- 削除した Plugin ラッパー
- 新しいコアヘルパー LOC（ある場合）
- 実行した対象テスト
- 残りのホットスポット一覧

## 終了条件

- バンドル済み本番インポートで、非推奨の channel-access または command-auth ファサードを使用していない
- 互換性コードが SDK/コアシームに分離されている
- バンドル済み Plugin が ingress projection または汎用 outcome を直接消費する
- Plugin 本番 LOC が `origin/main` に対して少なくとも 1,500 の純減になっている
- コア本番 LOC が +1,500 以下である、または超過分が相殺され、合計が
  +2,000 以下に収まっている
- 代表的なテストが、リダクション、ルート、コマンド/イベント、アクティベーション、
  アクセスグループ、およびチャネル固有のフォールバック動作をカバーしている
