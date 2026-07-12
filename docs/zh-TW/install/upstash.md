---
read_when:
    - 將 OpenClaw 部署至 Upstash Box
    - 你想要一個適用於 OpenClaw 的受管理 Linux 環境，並透過 SSH 通道存取儀表板
summary: 在 Upstash Box 上託管 OpenClaw，並啟用持續運作與 SSH 通道存取
title: Upstash Box
x-i18n:
    generated_at: "2026-07-11T21:26:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29232c43e0e4940b7445ab8896c9ccd3e81d0fdbdd522d7f50cb8c8057ac18f0
    source_path: install/upstash.md
    workflow: 16
---

在 Upstash Box（具備持續運作生命週期支援的受管理 Linux 環境）上執行常駐的 OpenClaw 閘道。

請使用 SSH 通道存取儀表板。請勿將閘道連接埠直接暴露於公用網際網路。

## 先決條件

- Upstash 帳戶
- 可持續運作的 Upstash Box
- 本機上的 SSH 用戶端

## 建立 Box

在 Upstash Console 中建立可持續運作的 Box。記下 Box ID（例如 `right-flamingo-14486`）以及 Box API 金鑰。

Upstash 目前的 OpenClaw Box 操作指南位於
[OpenClaw 設定](https://upstash.com/docs/box/guides/openclaw-setup)。

## 使用 SSH 通道連線

將 OpenClaw 儀表板連接埠轉送到本機。出現提示時，使用 Box API 金鑰作為 SSH 密碼：

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

持續連線選項可減少新手設定期間閒置通道中斷的情況。

## 安裝 OpenClaw

在 Box 內執行：

```bash
sudo npm install -g openclaw
```

## 執行新手設定

```bash
openclaw onboard --install-daemon
```

依照提示操作。新手設定完成時，複製儀表板網址和權杖。

## 啟動閘道

設定閘道以使用 Box 網路，並在背景啟動：

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

保持 SSH 通道連線後，在本機開啟儀表板網址：

```text
http://127.0.0.1:18789/#token=<your-token>
```

## 自動重新啟動

將此命令設為 Box 初始化指令碼，以便閘道在 Box 啟動時重新啟動：

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## 疑難排解

如果 SSH 在新手設定期間凍結，請使用乾淨的 SSH 設定和持續連線選項重新連線：

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

這會略過本機 `~/.ssh/config` 中過時的設定，並在網路閒置期間維持通道連線。

## 相關內容

- [遠端存取](/zh-TW/gateway/remote)
- [閘道安全性](/zh-TW/gateway/security)
- [更新 OpenClaw](/zh-TW/install/updating)
