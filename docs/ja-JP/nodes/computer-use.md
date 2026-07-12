---
read_when:
    - Gateway エージェントから Mac デスクトップを表示・操作できるようにする
    - コンピューター操作の有効化、権限、または安全性
    - computer.act Node コマンドまたはその実行処理の拡張
summary: computer ツールと computer.act Node コマンドを使用した、ペアリング済み macOS Node 上でのエージェント駆動型デスクトップ操作
title: コンピューター操作
x-i18n:
    generated_at: "2026-07-11T22:22:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2457d15a59857ffd9c7b160ea4ebed85c8372754abfc7bf75faafc963ecb6547
    source_path: nodes/computer-use.md
    workflow: 16
---

コンピュータ操作を使用すると、Gateway エージェントはペアリングされた **macOS** デスクトップを表示して操作できます。既存の `screen.snapshot` Node コマンドでスクリーンショットを取得し、単一の危険な Node コマンド `computer.act` を通じてポインターとキーボードを操作します。アクションセットは Anthropic の中核的なコンピュータ操作アクションに準拠しています。オプションの `computer_20251124` ズームは公開されません。ビジョン対応モデルが、組み込みの `computer` エージェントツールを通じて操作します。

エージェントが発行するのは統一された単一のコマンド `computer.act` であり、Node がそれをどのように実行するかは認識できません。macOS Node は、組み込みの Peekaboo サービスと限定的な CoreGraphics プリミティブを使用して、`computer.act` をプロセス内で実行します（適切な TCC 権限が必要で、追加プロセスは不要です）。将来、他のプラットフォームもエージェント向けの契約を変更せずに同じコマンドを実行できます。

## 要件

- ペアリングされた **macOS** Node（Node モードで動作する OpenClaw macOS アプリ）。
- macOS アプリ設定の **Allow Computer Control** が有効（デフォルト：オフ）。
- OpenClaw に macOS の **Accessibility** 権限（ポインターとキーボードの入力用）および **Screen Recording** 権限（`screen.snapshot` 用）が付与されていること。
- Gateway で `computer.act` コマンドが有効化されていること（危険なため、デフォルトでは無効）。
- ビジョン対応のエージェントモデル。
- `computer` を公開するツールポリシー。デフォルトの `coding` プロファイルでは公開されません。`tools.alsoAllow` に `computer` を追加してください。サンドボックス化されたエージェントでは、`tools.sandbox.tools.alsoAllow` にも追加する必要があります。

## `computer` エージェントツール

組み込みの `computer` ツールは、呼び出しごとに1つのアクションを受け取ります。座標は最新のスクリーンショット内の非負整数ピクセルで指定し、Node がディスプレイ上のポイントに変換します。座標を使用するアクションでは、スクリーンショット結果の `frameId` をそのまま指定する必要があります。また、`screenIndex` を明示する場合は、そのフレームと一致している必要があります。OpenClaw はさらに、Node が発行したスクリーンショットのディスプレイ識別情報をアクションに引き継ぎます。そのため、ディスプレイの再接続や配置変更が発生した場合、同じインデックスへ暗黙に対象を変更するのではなく、安全側に失敗します。これらの検査により、推測されたトークンや、別の配信済みフレームまたはディスプレイのトークンは拒否されます。トークンは鮮度を保証するものではありません。キャプチャ後も同じディスプレイ上でアプリがピクセルを変更できるため、画面の状態が変わった可能性がある場合は、新しいスクリーンショットを取得してください。

- 読み取り：`screenshot`。
- ポインター：`left_click`、`right_click`、`middle_click`、`double_click`、`triple_click`、`mouse_move`、`left_click_drag`（`startCoordinate` を指定）、`left_mouse_down`、`left_mouse_up`。
- スクロール：`scrollDirection`（`up|down|left|right`）と `scrollAmount`（ホイールの刻み数）を指定する `scroll`。
- キーボード：`type`（テキスト）、`key`（`cmd+shift+t` や `Return` などのキーコンビネーション）、`hold_key`（`text` のキーコンビネーションを `duration` 秒間押下）。
- 実行間隔：`wait`（`duration` 秒）。

修飾キーは、クリックおよびスクロールアクションの `text` フィールドで指定します（`shift`、`ctrl`、`alt`、`cmd`）。入力アクションの後、ツールは新しいスクリーンショットを返すため、モデルは結果を確認できます。コンピュータ操作対応の Node が複数接続されている場合は、`node` を明示的に指定してください。

スクリーンショットは **モデル専用** として扱われ、チャットチャンネルへ自動配信されることはありません。画面上のすべての内容を信頼できない入力として扱ってください。ツールは、ユーザーの要求と矛盾する画面上の指示に従わないようモデルに警告します。

## `computer.act` Node コマンド

`computer.act` は、ツールが入力を送る単一の Node コマンドです（`command: "computer.act"` を指定した `node.invoke`）。このコマンドには次の特性があります。

- **デフォルトで危険**：組み込みの危険な Node コマンドとして登録されており、明示的に有効化されるまでランタイムの許可リストから除外されます。ただし、macOS Node はペアリング時にこのコマンドを宣言できるため、操作対象を一度承認しておくことができます。
- 現時点では **macOS 専用**：**Allow Computer Control** が有効になっている macOS Node のみが、このコマンドを公開します。

読み取りには `screen.snapshot` を再利用し、別のキャプチャ経路はありません。共通のキャプチャコマンドについては、[カメラと画面の Node](/ja-JP/nodes/camera)を参照してください。

## 有効化と使用許可

1. macOS アプリで **Settings → Allow Computer Control** を有効にします。次に **Settings → Permissions** を開き、macOS のシステム設定で **Accessibility** と **Screen Recording** を許可します。
2. Gateway でペアリングの更新を承認します（新しいコマンドを追加すると、再ペアリングが必要になります）。
3. ビジョン対応エージェントにツールを公開します。デフォルトの `coding` プロファイルでは、次のように設定します。

   ```json5
   {
     tools: {
       alsoAllow: ["computer"],
       // サンドボックス化されたエージェントでは、この2つ目のゲートも必要です：
       sandbox: { tools: { alsoAllow: ["computer"] } },
     },
   }
   ```

4. 制限時間を指定して `computer.act` の使用を許可します。`phone-control` Plugin は `computer` グループを提供します。

   ```text
   /phone arm computer 30m
   /phone status
   /phone disarm
   ```

   使用許可には `operator.admin`（または所有者）が必要で、期限が来ると自動的に失効します。従来の `/phone arm all` グループでは、意図的にデスクトップ操作が除外されています。明示的な `computer` グループを使用してください。使用許可は Gateway が呼び出せる対象を切り替えるだけです。macOS アプリでは引き続き **Allow Computer Control** 設定と OS 権限が適用されます。

永続的に認可するには、`computer.act` を `gateway.nodes.allowCommands` に追加し、さらに `gateway.nodes.denyCommands` から削除してください。拒否リストが優先されます。永続的な認可は自動的に失効しません。`/phone arm` の実行前から存在していたエントリは、`/phone disarm` の実行後も残ります。一時的な許可が有効な間に、それを永続的な許可へ変更しないでください。

認可は、有効化と使用の2段階に意図的に分けられています。`computer.act` の一時的な使用許可または永続的な設定には、管理者権限が必要です。使用許可が有効になると、`operator.write` を持つ認証済みオペレーターは、その許可が失効するか取り消されるまで、`node.invoke` を通じて `computer.act` を呼び出せます。アクションごとの管理者権限検査はありません。`computer.act` を宣言する Node を承認しても、後で使用許可を付与できるように操作対象が記録されるだけであり、それ自体では呼び出しは有効になりません。

## 安全性

- 認可する前に、すべての層（ツールポリシー、Gateway コマンドポリシー、macOS の設定、Accessibility、Screen Recording）が許可している必要があります。一度使用許可を付与すると、期限切れまたは `/phone disarm` の実行まで、アクションごとの確認なしで操作が実行されます。
- テキスト入力は、書記素ごとに1つずつ送信されます。キャンセル、切断、一時停止、無効化、またはエンドポイントの置き換えが発生すると、古くなった残りの入力を続行せず、次の書記素の前に停止します。
- スクリーンショットはモデル専用であり、チャットへ自動送信されることはありません（issue [#44759](https://github.com/openclaw/openclaw/issues/44759)）。
- 画面の内容は信頼できないものとして扱ってください。プロンプトインジェクションが含まれる可能性があります。

## 他のデスクトップ操作経路との関係

これはエージェント主導の経路です。PeekabooBridge ホスト、Codex Computer Use、および直接接続する `cua-driver` MCP との関係については、[Peekaboo ブリッジ](/ja-JP/platforms/mac/peekaboo)を参照してください。
