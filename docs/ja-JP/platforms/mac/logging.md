---
read_when:
    - macOSログの取得またはプライベートデータのログ記録の調査
    - 音声ウェイク/セッションのライフサイクル問題のデバッグ
summary: 'OpenClaw のログ記録: ローテーションされる診断ファイルログ + 統合ログのプライバシーフラグ'
title: macOS のログ記録
x-i18n:
    generated_at: "2026-05-06T09:07:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c001008311d4e3f245add4cce32bdcc3eed9d897b30f6884c0649d2f0523df
    source_path: platforms/mac/logging.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# ログ記録 (macOS)

## ローリング診断ファイルログ (デバッグペイン)

OpenClaw は macOS アプリログを swift-log 経由でルーティングし (デフォルトでは統合ログ)、永続的なキャプチャが必要な場合は、ローカルのローテーションされるファイルログをディスクに書き込めます。

- 詳細度: **デバッグペイン → ログ → アプリログ記録 → 詳細度**
- 有効化: **デバッグペイン → ログ → アプリログ記録 → 「ローリング診断ログ (JSONL) を書き込む」**
- 場所: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (自動的にローテーションされます。古いファイルには `.1`、`.2`、… のサフィックスが付きます)
- 消去: **デバッグペイン → ログ → アプリログ記録 → 「消去」**

注意:

- これは**デフォルトではオフ**です。積極的にデバッグしている間だけ有効にしてください。
- このファイルは機密情報として扱ってください。確認せずに共有しないでください。

## macOS の統合ログにおけるプライベートデータ

統合ログでは、サブシステムが `privacy -off` を明示的に有効化しない限り、ほとんどのペイロードが墨消しされます。Peter による macOS の[ログプライバシーの挙動](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025) の記事によると、これはサブシステム名をキーとする `/Library/Preferences/Logging/Subsystems/` 内の plist によって制御されます。このフラグは新しいログエントリにのみ反映されるため、問題を再現する前に有効化してください。

## OpenClaw (`ai.openclaw`) で有効化する

- まず plist を一時ファイルに書き込み、その後 root としてアトミックにインストールします。

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

- 再起動は不要です。logd はすぐにファイルを検知しますが、プライベートペイロードを含むのは新しいログ行のみです。
- 既存のヘルパーでより詳細な出力を確認します。例: `./scripts/clawlog.sh --category WebChat --last 5m`。

## デバッグ後に無効化する

- オーバーライドを削除します: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`。
- 必要に応じて `sudo log config --reload` を実行し、logd にオーバーライドをすぐに破棄させます。
- この対象には電話番号やメッセージ本文が含まれる可能性があることを忘れないでください。追加の詳細が積極的に必要な間だけ plist を置いたままにしてください。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [Gateway ログ記録](/ja-JP/gateway/logging)
