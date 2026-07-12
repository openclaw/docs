---
read_when:
    - 你想要將 OpenClaw 連接到 Raft 工作區
    - 您正在設定 Raft 外部代理程式
    - 你正在偵錯 Raft 喚醒傳遞機制
sidebarTitle: Raft
summary: 透過 Raft 命令列介面喚醒橋接器支援 Raft 外部代理程式
title: Raft
x-i18n:
    generated_at: "2026-07-11T21:09:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 454d92d764a4ec3b0ec52467cba254dcad795870e04d1d32d4cf65d8b451a0de
    source_path: channels/raft.md
    workflow: 16
---

Raft 透過本機 Raft 命令列介面，將 OpenClaw 代理程式連接至 Raft External Agent。Raft 會向閘道傳送經過驗證的喚醒提示；代理程式接著使用 Raft 命令列介面檢查並傳送訊息。僅支援直接聊天（不支援群組）。

## 安裝

Raft 是官方外部外掛。請在閘道主機上安裝：

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

詳細資訊：[外掛](/zh-TW/tools/plugin)

## 必要條件

- 具有 External Agent 的 Raft 工作區。
- Raft 命令列介面已安裝在 OpenClaw 閘道所在的同一台主機上，並且位於服務的 `PATH` 中。
- 已登入且與該 External Agent 建立關聯的 Raft 命令列介面設定檔。

此外掛不會儲存 Raft 憑證；Raft 命令列介面會將該驗證資訊保存在自己的設定檔中。

## 設定

在設定中指定設定檔：

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

對於預設帳號，您也可以改為在閘道環境中設定 `RAFT_PROFILE`：

```bash
RAFT_PROFILE=openclaw
```

當一個閘道連接至多個 Raft External Agent 時，請使用具名帳號：

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

互動式設定會記錄相同的設定檔：

```bash
openclaw channels add --channel raft
```

## 運作方式

閘道啟動時，此外掛會：

1. 在臨時連接埠上開啟僅限 local loopback 的 HTTP 喚醒端點。
2. 使用該端點和每個程序專屬的權杖啟動 `raft --profile <profile> agent bridge`。
3. 僅接受來自本機橋接器、經過驗證、不含內容且具有重播識別資訊的喚醒提示。
4. 要求每個喚醒承載資料都包含 `eventId`、`attemptId`、`messageId`、`delivery_id`、`wake_id` 或 `id` 其中之一。
5. 依橋接器事件識別碼，對重試的喚醒遞送進行 24 小時去重，且在閘道重新啟動後仍有效。
6. 為目前的橋接器傳回穩定的執行階段工作階段，並為 Raft 命令列介面通訊協定傳回空白的活動排空批次。
7. 每接受一個喚醒，就啟動一個依序執行的 OpenClaw 代理程式回合。

橋接器負責 Raft 遞送重試與重新連線。OpenClaw 回合只會收到喚醒通知，不會收到複製的 Raft 訊息本文。它會使用命令列介面讀取待處理訊息並傳送回應：

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft 不是推播訊息傳輸機制。OpenClaw 不會自動透過橋接器傳回模型的最終文字，因此代理程式處理喚醒後必須使用 Raft 命令列介面。
</Note>

## 驗證

檢查 OpenClaw 是否能找到命令列介面，且已設定設定檔：

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

接著向 Raft External Agent 傳送訊息。閘道日誌應顯示 Raft 橋接器啟動，隨後出現傳入的喚醒。代理程式應使用已設定的 Raft 設定檔檢查其待處理訊息。

## 疑難排解

<AccordionGroup>
  <Accordion title="缺少 Raft 命令列介面">
    在閘道主機上安裝 Raft 命令列介面，並確保服務可透過 `PATH` 使用 `raft`。使用 `raft --help` 驗證，然後重新啟動閘道。
  </Accordion>
  <Accordion title="橋接器立即結束">
    確認已設定的設定檔處於登入狀態，且屬於預期的 Raft External Agent。直接執行 `raft --profile <profile> agent bridge` 以查看命令列介面診斷資訊。
  </Accordion>
  <Accordion title="收到喚醒但未傳送 Raft 回應">
    當代理程式未叫用 Raft 命令列介面時，這是預期行為。喚醒橋接器不會傳遞訊息本文或自動傳送最終回覆。請檢查代理程式的工具原則，並確保它可以執行 `raft --profile <profile>
    message check` 和 `message send`。
  </Accordion>
</AccordionGroup>

## 參考資料

- [Raft](https://raft.build/)
- [Raft 文件](https://docs.raft.build/welcome/)
- [Hermes Raft 整合](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
