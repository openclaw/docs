---
read_when:
    - 將 OpenClaw 部署到 Upstash Box
    - 你想要一個用於 OpenClaw 的受管理 Linux 環境，並透過 SSH 通道存取儀表板
summary: 在 Upstash Box 上託管 OpenClaw，並提供保持連線與 SSH 隧道存取
title: Upstash Box
x-i18n:
    generated_at: "2026-06-27T19:28:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06d2eb41e1beb0ab3145baa861e0bee7e3efef20324dc4e0e82ba08910937d20
    source_path: install/upstash.md
    workflow: 16
---

在 Upstash Box 上執行持久的 OpenClaw 閘道，這是一個支援保活生命週期的受管理 Linux 環境。

使用 SSH 通道存取儀表板。不要將閘道連接埠直接暴露到公開網際網路。

## 先決條件

- Upstash 帳號
- 保活 Upstash Box
- 本機電腦上的 SSH 用戶端

## 建立 Box

在 Upstash Console 中建立保活 Box。記下 Box ID，例如
`right-flamingo-14486`，以及你的 Box API 金鑰。

Upstash 會在以下位置維護其目前的 OpenClaw Box 逐步指南：
[OpenClaw 設定](https://upstash.com/docs/box/guides/openclaw-setup)。

## 使用 SSH 通道連線

將 OpenClaw 儀表板連接埠轉送到你的本機電腦。系統提示時，使用你的 Box API 金鑰作為 SSH 密碼：

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

保活選項可減少初始設定期間因閒置而導致的通道中斷。

## 安裝 OpenClaw

在 Box 內：

```bash
sudo npm install -g openclaw
```

## 執行初始設定

```bash
openclaw onboard --install-daemon
```

依照提示操作。初始設定完成時，複製儀表板 URL 和權杖。

## 啟動閘道

為 Box 網路設定閘道，並在背景啟動它：

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

SSH 通道作用中時，在本機開啟儀表板 URL：

```text
http://127.0.0.1:18789/#token=<your-token>
```

## 自動重新啟動

將此命令設定為 Box init script，讓閘道在 Box 啟動時重新啟動：

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## 疑難排解

如果 SSH 在初始設定期間凍結，請使用乾淨的 SSH 設定和保活選項重新連線：

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

這會略過過期的本機 `~/.ssh/config` 設定，並在網路閒置期間保持通道作用中。

## 相關

- [遠端存取](/zh-TW/gateway/remote)
- [閘道安全性](/zh-TW/gateway/security)
- [更新 OpenClaw](/zh-TW/install/updating)
