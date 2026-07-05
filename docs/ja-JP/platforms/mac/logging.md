---
read_when:
    - macOS ログの取得または個人データのログ記録の調査
    - 音声ウェイク/セッションライフサイクルの問題のデバッグ
summary: 'OpenClaw ロギング: ローリング診断ファイルログ + 統合ログプライバシーフラグ'
title: macOS のログ記録
x-i18n:
    generated_at: "2026-07-05T11:29:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# ログ記録 (macOS)

## ローリング診断ファイルログ (デバッグペイン)

macOSアプリは swift-log (デフォルトでは統合ログ) を通じてログを記録し、永続的に取得するためのローテーション式ローカルファイルログ (`DiagnosticsFileLog`) も書き込めます。

- 有効化: **デバッグペイン -> ログ -> アプリログ記録 -> 「ローリング診断ログ (JSONL) を書き込む」** (デフォルトではオフ)。
- 詳細度: **デバッグペイン -> ログ -> アプリログ記録 -> 詳細度** ピッカー。
- 場所: `~/Library/Logs/OpenClaw/diagnostics.jsonl`。
- ローテーション: 5 MBでローテーションし、`.1`...`.5` というサフィックス付きのバックアップを最大5個まで保持します (最も古いものは削除されます)。
- 消去: **デバッグペイン -> ログ -> アプリログ記録 -> 「消去」** は、アクティブなファイルとすべてのバックアップを削除します。

このファイルは機密情報として扱い、確認なしに共有しないでください。

## macOSの統合ログにおけるプライベートデータ

統合ログは、サブシステムが `privacy -off` を明示的に有効化していない限り、ほとんどのペイロードを秘匿します。これは `/Library/Preferences/Logging/Subsystems/` 内の plist によって制御され、サブシステム名をキーにします。このフラグは新しいログエントリにのみ反映されるため、問題を再現する前に有効化してください。背景: [macOSログプライバシーの仕組み](https://steipete.me/posts/2025/logging-privacy-shenanigans)。

## OpenClaw (`ai.openclaw`) で有効化する

まず plist を一時ファイルに書き込み、その後 root としてアトミックにインストールします。

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

再起動は不要です。logd はファイルをすぐに取り込みますが、プライベートペイロードが含まれるのは新しいログ行だけです。より詳細な出力は `./scripts/clawlog.sh --category WebChat --last 5m` で表示できます (`--last`/`-l` は時間範囲を設定し、デフォルトは `5m`、`--category`/`-c` はカテゴリでフィルタします)。

## デバッグ後に無効化する

- オーバーライドを削除します: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`。
- 必要に応じて `sudo log config --reload` を実行し、logd にオーバーライドを即座に破棄させます。
- この領域には電話番号やメッセージ本文が含まれる可能性があります。plist は実際に必要な間だけ配置しておいてください。

## 関連

- [macOSアプリ](/ja-JP/platforms/macos)
- [Gatewayログ記録](/ja-JP/gateway/logging)
