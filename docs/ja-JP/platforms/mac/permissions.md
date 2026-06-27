---
read_when:
    - macOS の権限プロンプトが表示されない、または進まない場合のデバッグ
    - node または CLI ランタイムにアクセシビリティを付与するかどうかの判断
    - macOS アプリのパッケージ化または署名
    - バンドル ID またはアプリのインストールパスの変更
summary: macOS の権限永続化 (TCC) と署名要件
title: macOS の権限
x-i18n:
    generated_at: "2026-06-27T12:04:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b7e21c53bff16c3023e2b6509894717c3d0ef96524951b0d0c5975d2fc91019
    source_path: platforms/mac/permissions.md
    workflow: 16
---

macOS の権限付与は壊れやすいものです。TCC は権限付与をアプリのコード署名、バンドル識別子、ディスク上のパスに関連付けます。そのいずれかが変わると、macOS はそのアプリを新しいものとして扱い、プロンプトを削除または非表示にすることがあります。

## 安定した権限の要件

- 同じパス: アプリを固定された場所から実行します (OpenClaw の場合は `dist/OpenClaw.app`)。
- 同じバンドル識別子: バンドル ID を変更すると、新しい権限 ID が作成されます。
- 署名済みアプリ: 未署名またはアドホック署名のビルドでは権限が永続化されません。
- 一貫した署名: 実際の Apple Development または Developer ID 証明書を使用し、
  再ビルド間で署名が安定するようにします。

アドホック署名はビルドごとに新しい ID を生成します。macOS は以前の付与を忘れ、古いエントリが消去されるまでプロンプトが完全に消えることがあります。

## Node と CLI ランタイムのアクセシビリティ付与

汎用の `node` バイナリではなく、OpenClaw.app、Peekaboo.app、または独自のバンドル識別子を持つ別の署名済みヘルパーにアクセシビリティを付与することを推奨します。

macOS TCC は、認識したプロセスのコード ID にアクセシビリティを付与します。Homebrew、nvm、pnpm、または npm のワークフローによって共有 `node` 実行ファイルがアクセシビリティを受け取ると、その同じ実行ファイルを通じて起動される任意の JavaScript パッケージが GUI 自動化権限を継承する可能性があります。

システム設定の `node` エントリは、1 つの npm パッケージへの権限ではなく、その Node ランタイムに対する広範な権限として扱ってください。その正確な Node インストールを通じて起動されるすべてのスクリプトとパッケージを信頼できる場合を除き、`node` にアクセシビリティを付与しないでください。

誤って `node` にアクセシビリティを付与した場合は、システム設定 -> プライバシーとセキュリティ -> アクセシビリティからそのエントリを削除します。その後、UI 自動化を所有すべき署名済みアプリまたはヘルパーに付与します。

## プロンプトが消えたときの復旧チェックリスト

1. アプリを終了します。
2. システム設定 -> プライバシーとセキュリティでアプリのエントリを削除します。
3. 同じパスからアプリを再起動し、権限を再付与します。
4. それでもプロンプトが表示されない場合は、`tccutil` で TCC エントリをリセットして再試行します。
5. 一部の権限は、macOS を完全に再起動した後でないと再表示されません。

リセット例 (必要に応じてバンドル ID を置き換えてください):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## ファイルとフォルダの権限 (Desktop/Documents/Downloads)

macOS は、ターミナル/バックグラウンドプロセスに対して Desktop、Documents、Downloads も制限することがあります。ファイル読み取りやディレクトリ一覧がハングする場合は、ファイル操作を実行する同じプロセスコンテキスト (たとえば Terminal/iTerm、LaunchAgent で起動されたアプリ、または SSH プロセス) にアクセス権を付与します。

回避策: フォルダごとの付与を避けたい場合は、ファイルを OpenClaw ワークスペース (`~/.openclaw/workspace`) に移動します。

権限をテストする場合は、必ず実際の証明書で署名してください。アドホックビルドは、権限が問題にならない簡単なローカル実行の場合にのみ許容されます。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [macOS 署名](/ja-JP/platforms/mac/signing)
