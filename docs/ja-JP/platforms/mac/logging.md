---
read_when:
    - macOSログの収集または個人データのログ記録の調査
    - 音声ウェイク／セッションのライフサイクルに関する問題のデバッグ
summary: OpenClaw のログ記録：ローテーション式診断ファイルログ + 統合ログのプライバシーフラグ
title: macOS のログ記録
x-i18n:
    generated_at: "2026-07-11T22:23:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# ログ（macOS）

## ローテーション診断ファイルログ（デバッグペイン）

macOSアプリはswift-logを通じてログを記録し（デフォルトでは統合ログ）、永続的に記録するため、ローテーションするローカルファイルログ（`DiagnosticsFileLog`）にも書き込めます。

- 有効化: **Debug pane -> Logs -> App logging -> "Write rolling diagnostics log (JSONL)"**（デフォルトではオフ）。
- 詳細度: **Debug pane -> Logs -> App logging -> Verbosity** ピッカー。
- 場所: `~/Library/Logs/OpenClaw/diagnostics.jsonl`。
- ローテーション: 5 MBでローテーションし、`.1`～`.5`の接尾辞が付いたバックアップを最大5件保持します（最も古いものは削除されます）。
- 消去: **Debug pane -> Logs -> App logging -> "Clear"** を実行すると、使用中のファイルとすべてのバックアップが削除されます。

このファイルは機密情報として扱い、内容を確認せずに共有しないでください。

## macOSの統合ログにおける非公開データ

統合ログでは、サブシステムが`privacy -off`を有効にしない限り、ほとんどのペイロードが秘匿化されます。これは、`/Library/Preferences/Logging/Subsystems/`内にある、サブシステム名をキーとしたplistによって制御されます。このフラグが適用されるのは新しいログエントリのみであるため、問題を再現する前に有効にしてください。背景情報: [macOSのログプライバシーに関する特殊な挙動](https://steipete.me/posts/2025/logging-privacy-shenanigans)。

## OpenClaw（`ai.openclaw`）で有効化する

まず一時ファイルにplistを書き込み、その後rootとしてアトミックにインストールします。

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

再起動は不要です。logdはすぐにファイルを認識しますが、非公開ペイロードが含まれるのは新しいログ行のみです。`./scripts/clawlog.sh --category WebChat --last 5m`を使用すると、より詳細な出力を表示できます（`--last`/`-l`は時間範囲を設定し、デフォルトは`5m`です。`--category`/`-c`はカテゴリで絞り込みます）。

## デバッグ後に無効化する

- オーバーライドを削除します: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`。
- 必要に応じて`sudo log config --reload`を実行し、logdにオーバーライドをただちに破棄させます。
- このログ出力には電話番号やメッセージ本文が含まれる可能性があります。plistは実際に必要な間だけ保持してください。

## 関連項目

- [macOSアプリ](/ja-JP/platforms/macos)
- [Gatewayのログ](/ja-JP/gateway/logging)
