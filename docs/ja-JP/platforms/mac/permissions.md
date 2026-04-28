---
read_when:
    - 表示されない、または進まないmacOS権限プロンプトをデバッグしている場合
    - macOSアプリをパッケージ化または署名している場合
    - bundle IDまたはアプリのインストールパスを変更する場合
summary: macOSの権限永続化（TCC）と署名要件
title: macOSの権限
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T05:08:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9ee8ee6409577094a0ba1bc4a50c73560741c12cbb1b3c811cb684ac150e05e
    source_path: platforms/mac/permissions.md
    workflow: 15
---

macOSの権限付与は壊れやすいものです。TCCは権限付与を、アプリの
コード署名、bundle identifier、およびディスク上のパスに関連付けます。これらのいずれかが変わると、
macOSはそのアプリを新しいものとして扱い、プロンプトを失ったり表示しなくなったりすることがあります。

## 安定した権限に必要な条件

- 同じパス: アプリは固定された場所から実行する（OpenClawでは`dist/OpenClaw.app`）。
- 同じbundle identifier: bundle IDを変更すると、新しい権限アイデンティティが作られます。
- 署名済みアプリ: 署名なしまたはad-hoc署名ビルドでは権限が保持されません。
- 一貫した署名: 実際のApple DevelopmentまたはDeveloper ID証明書を使い、
  再ビルド間で署名が安定するようにします。

ad-hoc署名はビルドごとに新しいアイデンティティを生成します。macOSは以前の
権限付与を忘れ、古いエントリが消去されるまで、プロンプト自体が完全に消えることもあります。

## プロンプトが消えたときの復旧チェックリスト

1. アプリを終了する。
2. System Settings -> Privacy & Securityでアプリのエントリを削除する。
3. 同じパスからアプリを再起動し、権限を再付与する。
4. それでもプロンプトが表示されない場合は、`tccutil`でTCCエントリをリセットして再試行する。
5. 一部の権限は、macOSを完全再起動した後でしか再表示されません。

リセット例（必要に応じてbundle IDを置き換えてください）:

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## ファイルとフォルダー権限（Desktop/Documents/Downloads）

macOSは、Desktop、Documents、およびDownloadsについても、terminal/バックグラウンドプロセスを制限する場合があります。ファイル読み取りやディレクトリ一覧がハングする場合は、ファイル操作を行うのと同じプロセスコンテキスト（たとえばTerminal/iTerm、LaunchAgent起動アプリ、またはSSHプロセス）にアクセス権を付与してください。

回避策: フォルダーごとの権限付与を避けたい場合は、ファイルをOpenClawワークスペース（`~/.openclaw/workspace`）へ移動してください。

権限をテストしている場合は、必ず実際の証明書で署名してください。ad-hoc
ビルドが許容されるのは、権限が重要でない短時間のローカル実行だけです。

## 関連

- [macOS app](/ja-JP/platforms/macos)
- [macOS signing](/ja-JP/platforms/mac/signing)
