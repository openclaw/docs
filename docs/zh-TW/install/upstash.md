---
read_when:
    - 將 OpenClaw 部署到 Upstash Box
    - 你需要一個供 OpenClaw 使用、可透過 SSH 通道存取儀表板的受管 Linux 環境
summary: 在 Upstash Box 上託管 OpenClaw，並使用 keep-alive 與 SSH tunnel 存取
title: Upstash Box
x-i18n:
    generated_at: "2026-07-05T11:25:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29232c43e0e4940b7445ab8896c9ccd3e81d0fdbdd522d7f50cb8c8057ac18f0
    source_path: install/upstash.md
    workflow: 16
---

在 Upstash Box（一個支援 keep-alive 生命週期的受管理 Linux 環境）上執行持續運作的 OpenClaw 閘道。

使用 SSH 通道存取儀表板。不要將閘道連接埠直接暴露到公開網際網路。

## 先決條件

- Upstash 帳戶
- keep-alive Upstash Box
- 本機上的 SSH 用戶端

## 建立 Box

在 Upstash 控制台中建立 keep-alive Box。記下 Box ID（例如 `right-flamingo-14486`）和你的 Box API 金鑰。

Upstash 會在以下位置維護目前的 OpenClaw Box 逐步指南：
[OpenClaw 設定](https://upstash.com/docs/box/guides/openclaw-setup)。

## 使用 SSH 通道連線

將 OpenClaw 儀表板連接埠轉送到你的本機。系統提示時，使用你的 Box API 金鑰作為 SSH 密碼：

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

keepalive 選項可減少初始設定期間因閒置而導致通道中斷。

## 安裝 OpenClaw

在 Box 內：

```bash
sudo npm install -g openclaw
```

## 執行初始設定

```bash
openclaw onboard --install-daemon
```

依照提示操作。初始設定完成後，複製儀表板 URL 和權杖。

## 啟動閘道

為 Box 網路設定閘道，並在背景啟動：

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

在 SSH 通道啟用時，於本機開啟儀表板 URL：

```text
http://127.0.0.1:18789/#token=<your-token>
```

## 自動重新啟動

將此命令設定為 Box 初始腳本，讓閘道在 Box 啟動時重新啟動：

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## 疑難排解

如果 SSH 在初始設定期間凍結，請使用乾淨的 SSH 設定和 keepalive 重新連線：

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

這會略過過時的本機 `~/.ssh/config` 設定，並在網路閒置期間維持通道作用中。

## 相關

- [遠端存取](/zh-TW/gateway/remote)
- [閘道安全性](/zh-TW/gateway/security)
- [更新 OpenClaw](/zh-TW/install/updating)
