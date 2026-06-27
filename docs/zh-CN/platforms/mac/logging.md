---
read_when:
    - 采集 macOS 日志或调查私密数据记录
    - 调试语音唤醒/会话生命周期问题
summary: OpenClaw 日志：滚动诊断文件日志 + 统一日志隐私标志
title: macOS 日志记录
x-i18n:
    generated_at: "2026-05-06T05:30:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c001008311d4e3f245add4cce32bdcc3eed9d897b30f6884c0649d2f0523df
    source_path: platforms/mac/logging.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# 日志记录（macOS）

## 滚动诊断文件日志（调试面板）

OpenClaw 通过 swift-log 路由 macOS 应用日志（默认使用统一日志记录），并且在你需要持久捕获时，可以将本地滚动文件日志写入磁盘。

- 详细程度：**调试面板 → 日志 → 应用日志记录 → 详细程度**
- 启用：**调试面板 → 日志 → 应用日志记录 → “写入滚动诊断日志（JSONL）”**
- 位置：`~/Library/Logs/OpenClaw/diagnostics.jsonl`（自动轮转；旧文件会添加 `.1`、`.2`、… 后缀）
- 清除：**调试面板 → 日志 → 应用日志记录 → “清除”**

注意：

- 这项功能**默认关闭**。仅在主动调试时启用。
- 请将该文件视为敏感内容；未经审阅不要分享。

## macOS 上的统一日志记录私有数据

统一日志记录会编辑隐藏大多数载荷，除非某个子系统选择启用 `privacy -off`。根据 Peter 关于 macOS [日志隐私混乱现象](https://steipete.me/posts/2025/logging-privacy-shenanigans)（2025）的文章，这是由 `/Library/Preferences/Logging/Subsystems/` 中按子系统名称作为键名的 plist 控制的。只有新的日志条目会应用该标志，因此请在复现问题前启用它。

## 为 OpenClaw (`ai.openclaw`) 启用

- 先将 plist 写入临时文件，然后以 root 身份原子安装：

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

- 不需要重启；logd 会很快发现该文件，但只有新的日志行会包含私有载荷。
- 使用现有辅助脚本查看更丰富的输出，例如 `./scripts/clawlog.sh --category WebChat --last 5m`。

## 调试后禁用

- 移除覆盖项：`sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`。
- 也可以运行 `sudo log config --reload`，强制 logd 立即丢弃覆盖项。
- 请记住，该表面可能包含电话号码和消息正文；仅在你确实需要额外细节时保留该 plist。

## 相关

- [macOS 应用](/zh-CN/platforms/macos)
- [Gateway 网关日志记录](/zh-CN/gateway/logging)
