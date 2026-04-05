---
read_when:
    - 捕获 macOS 日志或调查私有数据日志记录
    - 调试语音唤醒/会话生命周期问题
summary: OpenClaw 日志：滚动诊断文件日志 + 统一日志隐私标志
title: macOS 日志
x-i18n:
    generated_at: "2026-04-05T08:37:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: c08d6bc012f8e8bb53353fe654713dede676b4e6127e49fd76e00c2510b9ab0b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# 日志（macOS）

## 滚动诊断文件日志（调试面板）

OpenClaw 通过 swift-log 路由 macOS 应用日志（默认使用统一日志），并且在你需要持久化捕获时，可以将本地滚动文件日志写入磁盘。

- 详细级别：**调试面板 → 日志 → 应用日志 → 详细级别**
- 启用：**调试面板 → 日志 → 应用日志 → “写入滚动诊断日志（JSONL）”**
- 位置：`~/Library/Logs/OpenClaw/diagnostics.jsonl`（自动轮转；旧文件会追加 `.1`、`.2`、… 后缀）
- 清除：**调试面板 → 日志 → 应用日志 → “清除”**

说明：

- 此功能**默认关闭**。仅在主动调试时启用。
- 请将该文件视为敏感内容；未经审查不要分享。

## macOS 上统一日志中的私有数据

统一日志会对大多数负载进行脱敏，除非某个子系统显式启用 `privacy -off`。根据 Peter 在 macOS [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans)（2025）中的说明，这由 `/Library/Preferences/Logging/Subsystems/` 中一个以子系统名称为键的 plist 控制。只有新的日志条目会应用该标志，因此请在复现问题之前启用它。

## 为 OpenClaw 启用（`ai.openclaw`）

- 先将 plist 写入临时文件，然后以 root 身份原子方式安装：

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
- 使用现有辅助脚本查看更丰富的输出，例如 `./scripts/clawlog.sh --category WebChat --last 5m`。

## 调试后禁用

- 删除该覆盖项：`sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`。
- 可选运行 `sudo log config --reload`，强制 `logd` 立即丢弃该覆盖项。
- 请记住，此处可能包含电话号码和消息正文；仅在你主动需要这些额外细节时才保留该 plist。
