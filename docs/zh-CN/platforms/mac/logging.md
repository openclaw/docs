---
read_when:
    - 捕获 macOS 日志或调查私密数据日志记录
    - 调试语音唤醒/会话生命周期问题
summary: OpenClaw 日志：滚动诊断文件日志 + 统一日志隐私标志
title: macOS 日志
x-i18n:
    generated_at: "2026-07-11T20:42:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# 日志（macOS）

## 滚动诊断文件日志（Debug pane）

macOS 应用通过 swift-log 记录日志（默认使用统一日志），还可以将滚动的本地文件日志写入持久存储，以便长期采集（`DiagnosticsFileLog`）。

- 启用：**Debug pane -> Logs -> App logging -> "Write rolling diagnostics log (JSONL)"**（默认关闭）。
- 详细程度：**Debug pane -> Logs -> App logging -> Verbosity** 选择器。
- 位置：`~/Library/Logs/OpenClaw/diagnostics.jsonl`。
- 轮转：达到 5 MB 时轮转；最多保留 5 个后缀为 `.1`...`.5` 的备份（丢弃最旧的备份）。
- 清除：**Debug pane -> Logs -> App logging -> "Clear"** 会删除当前文件及所有备份。

请将此文件视为敏感信息；未经审查，请勿分享。

## macOS 统一日志中的私密数据

除非子系统选择启用 `privacy -off`，否则统一日志会隐去大多数载荷。此行为由 `/Library/Preferences/Logging/Subsystems/` 中以子系统名称为键的 plist 文件控制。只有新日志条目会应用此标志，因此请在复现问题前启用它。背景信息：[macOS 日志隐私机制解析](https://steipete.me/posts/2025/logging-privacy-shenanigans)。

## 为 OpenClaw（`ai.openclaw`）启用

先将 plist 写入临时文件，然后以 root 身份原子化安装：

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

无需重新启动；logd 会很快读取该文件，但只有新日志行才会包含私密载荷。使用 `./scripts/clawlog.sh --category WebChat --last 5m` 查看更丰富的输出（`--last`/`-l` 设置时间范围，默认为 `5m`；`--category`/`-c` 按类别筛选）。

## 调试后禁用

- 移除覆盖配置：`sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`。
- 可以选择运行 `sudo log config --reload`，强制 logd 立即移除覆盖配置。
- 此日志可能包含电话号码和消息正文；仅在确有需要时保留该 plist。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [Gateway 网关日志](/zh-CN/gateway/logging)
