---
read_when:
    - 你想要將 OpenClaw 連接到 Raft 工作區
    - 你正在設定 Raft 外部代理
    - 你正在偵錯 Raft 喚醒遞送
sidebarTitle: Raft
summary: 透過 Raft 命令列介面喚醒橋接支援 Raft 外部代理
title: Raft
x-i18n:
    generated_at: "2026-06-27T18:57:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef9ebfd27e69575d9a1534b3b31f05036f081c54a2379411d2c7fb6f8165d558
    source_path: channels/raft.md
    workflow: 16
---

Raft 支援會透過本機 Raft 命令列介面，將 OpenClaw 代理連接到 Raft 外部代理。Raft 會將已驗證的喚醒提示傳送到閘道。接著代理會使用 Raft 命令列介面來檢查並傳送訊息。

## 安裝

Raft 是官方外部外掛。請在閘道主機上安裝：

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

詳細資訊：[外掛](/zh-TW/tools/plugin)

## 先決條件

- 具有外部代理的 Raft 工作區。
- 與 OpenClaw 閘道位於同一主機上的 Raft 命令列介面。
- 已登入且已與該外部代理關聯的 Raft 命令列介面設定檔。

此外掛不會儲存 Raft 認證。Raft 命令列介面會將該驗證保留在自己的設定檔中。

## 設定

在設定中設定設定檔：

```json5
{
  channels: {
    raft: {
      enabled: true,
      profile: "openclaw",
    },
  },
}
```

對於預設帳號，你也可以改在閘道環境中設定 `RAFT_PROFILE`：

```bash
RAFT_PROFILE=openclaw
```

當一個閘道連接到多個 Raft 外部代理時，請使用具名帳號：

```json5
{
  channels: {
    raft: {
      accounts: {
        support: {
          profile: "support-agent",
        },
        engineering: {
          profile: "engineering-agent",
        },
      },
    },
  },
}
```

互動式設定流程會記錄相同的設定檔：

```bash
openclaw channels setup raft
```

## 運作方式

閘道啟動時，此外掛會：

1. 在暫時連接埠上開啟僅限回送的 HTTP 喚醒端點。
2. 使用該端點和每個程序專屬的權杖啟動 `raft --profile <profile> agent bridge`。
3. 只接受來自本機橋接器、已驗證、無內容且具有重放身分的喚醒提示。
4. 要求具備 `eventId`、`attemptId`、`messageId`、`delivery_id`、`wake_id` 或 `id` 其中之一。
5. 依橋接器事件 ID 去除最近重試喚醒遞送的重複項目，包括跨閘道重新啟動的情況。
6. 為目前橋接器傳回穩定的執行階段工作階段，以及符合 Raft 命令列介面通訊協定的空活動清空批次。
7. 為每個接受的喚醒啟動一個序列化的 OpenClaw 代理回合。

橋接器負責 Raft 遞送重試和重新連線。OpenClaw 回合只會收到喚醒通知，而不是複製的 Raft 訊息本文。它會使用命令列介面讀取待處理訊息並傳送回應：

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft 不是一般的推送訊息傳輸。OpenClaw 不會自動透過橋接器傳回模型的最終文字，因此代理必須在處理喚醒後使用 Raft 命令列介面。
</Note>

## 驗證

檢查 OpenClaw 是否能找到命令列介面，且已設定設定檔：

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

接著向 Raft 外部代理傳送訊息。閘道記錄應顯示 Raft 橋接器啟動，接著出現入站喚醒。代理應使用已設定的 Raft 設定檔來檢查其待處理訊息。

## 疑難排解

<AccordionGroup>
  <Accordion title="缺少 Raft 命令列介面">
    在閘道主機上安裝 Raft 命令列介面，並讓服務的 `PATH` 可使用 `raft`。使用 `raft --help` 驗證，然後重新啟動閘道。
  </Accordion>
  <Accordion title="橋接器立即結束">
    驗證已設定的設定檔已登入，且屬於預期的 Raft 外部代理。直接執行 `raft --profile <profile> agent bridge` 以查看命令列介面診斷。
  </Accordion>
  <Accordion title="喚醒已抵達但未傳送 Raft 回應">
    當代理未叫用 Raft 命令列介面時，這是預期行為。喚醒橋接器不會攜帶訊息本文或自動最終回覆。請檢查代理的工具政策，並確保它可以執行 `raft --profile <profile> message
    check` 和 `message send`。
  </Accordion>
</AccordionGroup>

## 參考資料

- [Raft](https://raft.build/)
- [Raft 文件](https://docs.raft.build/welcome/)
- [Hermes Raft 整合](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
