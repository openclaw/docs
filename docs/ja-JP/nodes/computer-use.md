---
read_when:
    - Gateway エージェントが Mac デスクトップを表示・操作できるようにする
    - コンピューター操作の有効化、権限、または安全性
    - computer.act Node コマンドまたはその実行ハンドラーの拡張
summary: computer tool と `computer.act` Node コマンドを介した、ペアリング済み macOS Node 上でのエージェント駆動型デスクトップ操作
title: コンピューター操作
x-i18n:
    generated_at: "2026-07-12T14:40:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2457d15a59857ffd9c7b160ea4ebed85c8372754abfc7bf75faafc963ecb6547
    source_path: nodes/computer-use.md
    workflow: 16
---

コンピュータ操作を使用すると、gateway エージェントはペアリングされた **macOS** デスクトップを表示して制御できます。既存の `screen.snapshot` Node コマンドでスクリーンショットをキャプチャし、単一の危険な Node コマンド `computer.act` を通じてポインターとキーボードを操作します。アクションセットは Anthropic の中核的なコンピュータ操作アクションに準拠していますが、オプションの `computer_20251124` ズームは公開されません。ビジョン対応モデルは、組み込みの `computer` エージェントツールを通じてこれを操作します。

エージェントは統一された単一のコマンド `computer.act` を発行します。Node がそれをどのように実行するかをエージェントが判別することはできません。macOS Node は、組み込みの Peekaboo サービスと限定的な CoreGraphics プリミティブを使用して、`computer.act` をプロセス内で実行します（適切な TCC 権限を使用し、追加プロセスは不要です）。将来、他のプラットフォームも、エージェント向けの契約を変更せずに同じコマンドを実行できます。

## 要件

- ペアリングされた **macOS** Node（Node モードで動作する OpenClaw macOS アプリ）。
- macOS アプリの設定 **Allow Computer Control** が有効であること（デフォルト: オフ）。
- OpenClaw に macOS の **Accessibility** 権限（ポインターおよびキーボード入力用）と **Screen Recording** 権限（`screen.snapshot` 用）が付与されていること。
- Gateway で `computer.act` コマンドが有効化されていること（危険なため、デフォルトでは無効）。
- ビジョン対応エージェントモデル。
- `computer` を公開するツールポリシー。デフォルトの `coding` プロファイルでは公開されません。`tools.alsoAllow` に `computer` を追加してください。サンドボックス化されたエージェントでは、`tools.sandbox.tools.alsoAllow` にも追加する必要があります。

## `computer` エージェントツール

組み込みの `computer` ツールは、1 回の呼び出しにつき 1 つのアクションを受け取ります。座標は最新のスクリーンショット内の非負整数ピクセルで指定し、Node がディスプレイ上のポイントに変換します。座標を使用するアクションでは、スクリーンショット結果の `frameId` をそのまま指定する必要があり、明示的な `screenIndex` はそのフレームと一致しなければなりません。OpenClaw はさらに、スクリーンショットで Node が発行したディスプレイ ID をアクションに引き継ぐため、ディスプレイの再接続やジオメトリの変更が発生した場合、同じインデックスを暗黙に再ターゲットせず、安全側に失敗します。これらのチェックにより、推測されたトークンや、配信された別のフレームまたはディスプレイのトークンは拒否されます。トークンは鮮度を保証するものではありません。キャプチャ後に同じディスプレイ上でアプリのピクセルが変化する可能性があるため、画面の状態が変わった可能性がある場合は必ず新しいスクリーンショットを取得してください。

- 読み取り: `screenshot`。
- ポインター: `left_click`、`right_click`、`middle_click`、`double_click`、`triple_click`、`mouse_move`、`left_click_drag`（`startCoordinate` を使用）、`left_mouse_down`、`left_mouse_up`。
- スクロール: `scrollDirection`（`up|down|left|right`）および `scrollAmount`（ホイールの刻み数）を指定する `scroll`。
- キーボード: `type`（テキスト）、`key`（`cmd+shift+t` や `Return` などのキーコンビネーション）、`hold_key`（`text` のキーコンビネーションを `duration` 秒間押し続ける）。
- 待機時間の調整: `wait`（`duration` 秒）。

修飾キーは、クリックおよびスクロールアクションの `text` フィールドで指定します（`shift`、`ctrl`、`alt`、`cmd`）。入力アクションの後、ツールは新しいスクリーンショットを返すため、モデルは結果を確認できます。コンピュータ操作に対応する Node が複数接続されている場合は、`node` を明示的に渡してください。

スクリーンショットは **モデル専用** として保持され、チャットチャネルへ自動配信されることはありません。画面上のすべてのコンテンツを信頼できない入力として扱ってください。ツールは、ユーザーの依頼と矛盾する画面上の指示に従わないようモデルに警告します。

## `computer.act` Node コマンド

`computer.act` は、ツールが入力をルーティングする単一の Node コマンドです（`command: "computer.act"` を指定した `node.invoke`）。次の特性があります。

- **デフォルトで危険**: 組み込みの危険な Node コマンドとして登録されており、明示的に有効化されるまでランタイムの許可リストから除外されます。macOS Node は、初回にこの操作対象を承認できるよう、ペアリング時にこのコマンドを宣言する場合があります。
- 現時点では **macOS 専用**: **Allow Computer Control** が有効な macOS Node のみが公開します。

読み取りには `screen.snapshot` を再利用します。別のキャプチャ経路はありません。共有キャプチャコマンドについては、[カメラおよび画面 Node](/ja-JP/nodes/camera)を参照してください。

## 有効化と許可

1. macOS アプリで **Settings → Allow Computer Control** を有効にします。次に **Settings → Permissions** を開き、macOS のシステム設定で **Accessibility** と **Screen Recording** を許可します。
2. Gateway でペアリングの更新を承認します（新しいコマンドを追加すると再ペアリングが必要になります）。
3. ビジョン対応エージェントにツールを公開します。デフォルトの `coding` プロファイルの場合:

   ```json5
   {
     tools: {
       alsoAllow: ["computer"],
       // サンドボックス化されたエージェントでは、この第 2 のゲートも必要です:
       sandbox: { tools: { alsoAllow: ["computer"] } },
     },
   }
   ```

4. 期間を限定して `computer.act` を有効化します。`phone-control` Plugin は `computer` グループを公開します。

   ```text
   /phone arm computer 30m
   /phone status
   /phone disarm
   ```

   有効化には `operator.admin`（または所有者）が必要で、自動的に期限切れになります。従来の `/phone arm all` グループでは、意図的にデスクトップ操作が除外されています。明示的な `computer` グループを使用してください。有効化で切り替わるのは、Gateway が呼び出せる対象のみです。macOS アプリでは引き続き **Allow Computer Control** 設定と OS 権限が適用されます。

永続的に許可するには、`gateway.nodes.allowCommands` に `computer.act` を追加し、さらに `gateway.nodes.denyCommands` から**削除してください**。拒否リストが優先されます。永続的な許可は自動的に期限切れになりません。`/phone arm` より前から存在していたエントリは、`/phone disarm` の後も残ります。一時的に有効化されている間に、その許可を永続的な許可へ変更しないでください。

認可は、有効化と使用とで意図的に分離されています。`computer.act` の有効化または
永続的な設定には、管理者権限が必要です。
有効化された後は、`operator.write` を持つ認証済みのオペレーターが、許可の期限切れまたは無効化まで
`node.invoke` を通じて `computer.act` を呼び出せます。
アクションごとの管理者チェックはありません。
`computer.act` を宣言する Node を承認しても、後で有効化できるように操作対象が記録されるだけであり、
それ自体で呼び出しが有効になるわけではありません。

## 安全性

- 認可前には、すべてのレイヤー（ツールポリシー、Gateway のコマンドポリシー、macOS の設定、Accessibility、Screen Recording）が一致して許可する必要があります。有効化後は、有効期限または `/phone disarm` まで、アクションごとの確認なしで実行されます。
- テキスト入力は、書記素単位で 1 つずつ送信されます。キャンセル、切断、一時停止、無効化、またはエンドポイントの置き換えが発生すると、古い残りの入力を継続せず、次の書記素を送信する前に停止します。
- スクリーンショットはモデル専用であり、チャットへ自動送信されることはありません（issue [#44759](https://github.com/openclaw/openclaw/issues/44759)）。
- 画面のコンテンツは信頼できないものとして扱ってください。プロンプトインジェクションが含まれる可能性があります。

## その他のデスクトップ操作経路との関係

これはエージェント駆動の経路です。PeekabooBridge ホスト、Codex Computer Use、および直接接続する `cua-driver` MCP との関係については、[Peekaboo ブリッジ](/ja-JP/platforms/mac/peekaboo)を参照してください。
