---
read_when:
    - 捕获 macOS 日志或调查私有数据日志记录
    - 调试语音唤醒/会话生命周期问题
summary: OpenClaw 日志：滚动诊断文件日志 + 统一日志隐私标志
title: macOS 日志
x-i18n:
    generated_at: "2026-07-05T11:26:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# 日志 (macOS)

## 滚动诊断文件日志（调试面板）

macOS 应用通过 swift-log 记录日志（默认使用统一日志），也可以写入滚动本地文件日志，以便持久捕获（`DiagnosticsFileLog`）。

- 启用：**调试面板 -> 日志 -> App 日志 -> “Write rolling diagnostics log (JSONL)”**（默认关闭）。
- 详细程度：**调试面板 -> 日志 -> App 日志 -> 详细程度** 选择器。
- 位置：`~/Library/Logs/OpenClaw/diagnostics.jsonl`。
- 轮转：达到 5 MB 时轮转；最多保留 5 个后缀为 `.1`...`.5` 的备份（最旧的会被删除）。
- 清除：**调试面板 -> 日志 -> App 日志 -> “Clear”** 会删除活动文件和所有备份。

请将该文件视为敏感文件；未经审查不要分享。

## macOS 上的统一日志私有数据

统一日志会遮盖大多数载荷，除非某个子系统选择启用 `privacy -off`。这由 `/Library/Preferences/Logging/Subsystems/` 中按子系统名称作为键的 plist 控制。只有新的日志条目会读取该标志，因此请在复现问题前启用它。背景：[macOS 日志隐私怪象](https://steipete.me/posts/2025/logging-privacy-shenanigans)。

## 为 OpenClaw 启用（`ai.openclaw`）

先将 plist 写入临时文件，然后以 root 身份原子安装：

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

无需重启；logd 会很快读取该文件，但只有新的日志行会包含私有载荷。使用 `./scripts/clawlog.sh --category WebChat --last 5m` 查看更丰富的输出（`--last`/`-l` 设置时间范围，默认 `5m`；`--category`/`-c` 按类别过滤）。

## 调试后禁用

- 移除覆盖项：`sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`。
- 可选运行 `sudo log config --reload`，强制 logd 立即丢弃覆盖项。
- 此表面可能包含电话号码和消息正文；仅在确有需要时保留该 plist。

## 相关

- [macOS 应用](/zh-CN/platforms/macos)
- [Gateway 网关日志](/zh-CN/gateway/logging)
