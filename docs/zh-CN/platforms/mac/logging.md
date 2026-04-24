---
read_when:
    - 采集 macOS 日志或排查私有数据日志记录
    - 调试语音唤醒/会话生命周期问题
summary: OpenClaw 日志记录：滚动诊断文件日志 + 统一日志隐私标志
title: macOS 日志记录
x-i18n:
    generated_at: "2026-04-24T04:05:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84e8f56ef0f85ba9eae629d6a3cc1bcaf49cc70c82f67a10b9292f2f54b1ff6b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# 日志记录（macOS）

## 滚动诊断文件日志（Debug pane）

OpenClaw 通过 swift-log 路由 macOS 应用日志（默认使用 unified logging），并且在你需要持久化捕获时，可以将本地滚动文件日志写入磁盘。

- 详细级别：**Debug pane → Logs → App logging → Verbosity**
- 启用：**Debug pane → Logs → App logging → “Write rolling diagnostics log (JSONL)”**
- 位置：`~/Library/Logs/OpenClaw/diagnostics.jsonl`（自动轮转；旧文件会附加 `.1`、`.2` 等后缀）
- 清除：**Debug pane → Logs → App logging → “Clear”**

说明：

- 此功能**默认关闭**。仅在主动调试期间启用。
- 请将该文件视为敏感信息；未经审查不要分享。

## macOS 上 unified logging 的私有数据

unified logging 默认会对大多数负载进行脱敏，除非某个 subsystem 选择启用 `privacy -off`。根据 Peter 关于 macOS [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans)（2025）的文章，这由 `/Library/Preferences/Logging/Subsystems/` 中以 subsystem 名称为键的 plist 控制。只有新的日志条目才会应用该标志，因此请在复现问题前启用它。

## 为 OpenClaw 启用（`ai.openclaw`）

- 先将 plist 写入临时文件，然后以 root 身份原子性安装：

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

- 无需重启；`logd` 会很快注意到该文件，但只有新的日志行才会包含私有负载。
- 使用现有辅助命令查看更丰富的输出，例如 `./scripts/clawlog.sh --category WebChat --last 5m`。

## 调试后禁用

- 删除覆盖项：`sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`。
- 你也可以运行 `sudo log config --reload`，强制 `logd` 立即移除该覆盖项。
- 请记住，此表面可能包含电话号码和消息正文；仅在你主动需要额外细节时才保留该 plist。

## 相关内容

- [macOS app](/zh-CN/platforms/macos)
- [Gateway logging](/zh-CN/gateway/logging)
