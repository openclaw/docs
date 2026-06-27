---
read_when:
    - 您正在建置一個會與 OpenClaw 通訊的外部應用程式、指令碼、儀表板、CI 作業或 IDE 擴充功能。
    - 你正在閘道 RPC 和外掛 SDK 之間做選擇
    - 你正在整合閘道代理執行、工作階段、事件、核准、模型或工具
sidebarTitle: External apps
summary: 外部應用程式、腳本、儀表板、CI 工作和 IDE 擴充功能的目前整合路徑
title: 外部應用程式的閘道整合
x-i18n:
    generated_at: "2026-06-27T19:17:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69a1bee50620326e68d40c821d36c0e321fced755a2b3904d77e55624117cbff
    source_path: gateway/external-apps.md
    workflow: 16
---

外部應用程式目前應透過閘道協定與 OpenClaw 通訊。當指令碼、儀表板、CI 作業、IDE 擴充功能或其他程序想要啟動代理程式執行、串流事件、等待結果、取消工作，或檢查閘道資源時，請使用閘道 WebSocket 和 RPC 方法。

<Warning>
  目前還沒有公開的 npm 用戶端套件。在發行說明宣布已發布套件且本頁包含安裝指示之前，請不要將 OpenClaw 用戶端套件名稱加入應用程式依賴項。
</Warning>

<Note>
  本頁適用於 OpenClaw 程序外部的程式碼。在 OpenClaw 內部執行的外掛程式碼，應改用已文件化的 `openclaw/plugin-sdk/*` 子路徑。
</Note>

## 目前可用的內容

| 介面                                    | 狀態 | 用途                                                                                          |
| --------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| [閘道協定](/zh-TW/gateway/protocol)           | 就緒  | WebSocket 傳輸、連線交握、驗證範圍、協定版本控管和事件。                                     |
| [閘道 RPC 參考](/zh-TW/reference/rpc)         | 就緒  | 目前用於代理程式、工作階段、任務、模型、工具、成品和核准的閘道方法。                         |
| [`openclaw agent`](/zh-TW/cli/agent)          | 就緒  | 當透過 shell 呼叫命令列介面已足夠時，用於一次性指令碼整合。                                  |
| [`openclaw message`](/zh-TW/cli/message)      | 就緒  | 從指令碼傳送訊息或頻道動作。                                                                 |

原始碼樹包含未來用戶端函式庫的內部套件工作，但那不是公開的安裝介面。在套件發布並版本化之前，請將其視為預覽實作細節。

## 建議路徑

1. 執行或探索閘道。
2. 透過[閘道協定](/zh-TW/gateway/protocol)連線。
3. 呼叫[閘道 RPC 參考](/zh-TW/reference/rpc)中已文件化的 RPC 方法。
4. 固定你測試所依據的 OpenClaw 版本。
5. 升級 OpenClaw 時重新檢查 RPC 參考。

對於代理程式執行，請從 `agent` RPC 開始，並在需要終端結果時搭配 `agent.wait`。對於持久的對話狀態，請使用 `sessions.*` 方法。對於 UI 整合，請訂閱閘道事件，並只呈現你的應用程式理解的事件系列。

## 應用程式碼與外掛程式碼

當程式碼位於 OpenClaw 外部時，請使用閘道 RPC：

- 啟動或觀察代理程式執行的節點指令碼
- 呼叫閘道的 CI 作業
- 儀表板和管理面板
- IDE 擴充功能
- 不需要成為頻道外掛的外部橋接器
- 使用假的或真正的閘道傳輸進行整合測試

當程式碼在 OpenClaw 內部執行時，請使用外掛 SDK：

- 提供者外掛
- 頻道外掛
- 工具或生命週期鉤子
- 代理程式執行框架外掛
- 受信任的執行階段輔助工具

外部應用程式不應匯入 `openclaw/plugin-sdk/*`；這些子路徑是供 OpenClaw 載入的外掛使用。

## 相關

- [閘道協定](/zh-TW/gateway/protocol)
- [閘道 RPC 參考](/zh-TW/reference/rpc)
- [命令列介面 agent 命令](/zh-TW/cli/agent)
- [命令列介面 message 命令](/zh-TW/cli/message)
- [代理程式迴圈](/zh-TW/concepts/agent-loop)
- [代理程式執行階段](/zh-TW/concepts/agent-runtimes)
- [工作階段](/zh-TW/concepts/session)
- [背景任務](/zh-TW/automation/tasks)
- [ACP 代理程式](/zh-TW/tools/acp-agents)
- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)
