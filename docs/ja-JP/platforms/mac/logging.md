---
read_when:
    - macOS ログを取得する場合や、プライベートデータのロギングを調査する場合
    - 音声ウェイク/セッションライフサイクルの問題をデバッグする場合
summary: 'OpenClaw のロギング: ローリング診断ファイルログ + 統合ログのプライバシーフラグ'
title: macOS ロギング
x-i18n:
    generated_at: "2026-04-24T05:08:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84e8f56ef0f85ba9eae629d6a3cc1bcaf49cc70c82f67a10b9292f2f54b1ff6b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# ロギング（macOS）

## ローリング診断ファイルログ（Debug ペイン）

OpenClaw は macOS アプリログを swift-log 経由で流し（デフォルトでは統合ログ）、耐久的な記録が必要な場合にはローカルのローテーションファイルログをディスクへ書き出せます。

- 詳細度: **Debug pane → Logs → App logging → Verbosity**
- 有効化: **Debug pane → Logs → App logging → 「Write rolling diagnostics log (JSONL)」**
- 保存先: `~/Library/Logs/OpenClaw/diagnostics.jsonl`（自動でローテーションされます。古いファイルには `.1`、`.2`、… の接尾辞が付きます）
- クリア: **Debug pane → Logs → App logging → 「Clear」**

注:

- これは **デフォルトでオフ** です。アクティブにデバッグしている間だけ有効にしてください。
- このファイルは機密として扱ってください。レビューなしに共有しないでください。

## macOS の統合ログにおけるプライベートデータ

統合ログは、サブシステムが `privacy -off` にオプトインしない限り、ほとんどのペイロードを伏せ字化します。Peter の macOS に関する [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans)（2025）の記事によると、これは `/Library/Preferences/Logging/Subsystems/` 配下の、サブシステム名をキーにした plist によって制御されます。フラグを反映するのは新しいログエントリだけなので、問題を再現する前に有効にしてください。

## OpenClaw（`ai.openclaw`）で有効にする

- まず plist を一時ファイルに書き出し、その後 root としてアトミックにインストールします。

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

- 再起動は不要です。logd はこのファイルにすぐ気付きますが、プライベートペイロードが含まれるのは新しいログ行だけです。
- 既存のヘルパーでより詳細な出力を表示します。例: `./scripts/clawlog.sh --category WebChat --last 5m`。

## デバッグ後に無効化する

- 上書きを削除します: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`。
- 任意で `sudo log config --reload` を実行し、logd に即座に上書きを破棄させます。
- このサーフェスには電話番号やメッセージ本文が含まれる可能性があることを忘れないでください。追加情報が本当に必要な間だけ plist を置いてください。

## 関連

- [macOS app](/ja-JP/platforms/macos)
- [Gateway logging](/ja-JP/gateway/logging)
