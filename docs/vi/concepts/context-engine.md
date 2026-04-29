---
read_when:
    - Bạn muốn hiểu cách OpenClaw tập hợp ngữ cảnh mô hình
    - Bạn đang chuyển đổi giữa công cụ cũ và công cụ Plugin
    - Bạn đang xây dựng một Plugin công cụ ngữ cảnh
sidebarTitle: Context engine
summary: 'Công cụ ngữ cảnh: lắp ráp ngữ cảnh có thể cắm được, Compaction và vòng đời tác nhân phụ'
title: Công cụ ngữ cảnh
x-i18n:
    generated_at: "2026-04-29T22:36:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f192c6b28ad2b5960b504811926fb5e30fe8da9d985d8eec3ad4b65c9f7cae5
    source_path: concepts/context-engine.md
    workflow: 16
---

Một **công cụ ngữ cảnh** kiểm soát cách OpenClaw xây dựng ngữ cảnh mô hình cho mỗi lần chạy: những tin nhắn nào cần đưa vào, cách tóm tắt lịch sử cũ hơn và cách quản lý ngữ cảnh qua ranh giới subagent.

OpenClaw đi kèm công cụ `legacy` tích hợp sẵn và sử dụng công cụ này theo mặc định — hầu hết người dùng không cần thay đổi điều này. Chỉ cài đặt và chọn một công cụ Plugin khi bạn muốn hành vi lắp ráp, compaction hoặc nhớ lại giữa các phiên khác đi.

## Bắt đầu nhanh

<Steps>
  <Step title="Kiểm tra công cụ nào đang hoạt động">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Cài đặt một công cụ Plugin">
    Các Plugin công cụ ngữ cảnh được cài đặt giống như mọi Plugin OpenClaw khác.

    <Tabs>
      <Tab title="Từ npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="Từ một đường dẫn cục bộ">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Bật và chọn công cụ">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // must match the plugin's registered engine id
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin-specific config goes here (see the plugin's docs)
          },
        },
      },
    }
    ```

    Khởi động lại gateway sau khi cài đặt và cấu hình.

  </Step>
  <Step title="Chuyển lại về legacy (không bắt buộc)">
    Đặt `contextEngine` thành `"legacy"` (hoặc xóa hẳn khóa này — `"legacy"` là mặc định).
  </Step>
</Steps>

## Cách hoạt động

Mỗi khi OpenClaw chạy một prompt mô hình, công cụ ngữ cảnh tham gia tại bốn điểm vòng đời:

<AccordionGroup>
  <Accordion title="1. Nạp">
    Được gọi khi một tin nhắn mới được thêm vào phiên. Công cụ có thể lưu trữ hoặc lập chỉ mục tin nhắn trong kho dữ liệu riêng của nó.
  </Accordion>
  <Accordion title="2. Lắp ráp">
    Được gọi trước mỗi lần chạy mô hình. Công cụ trả về một tập hợp tin nhắn có thứ tự (và một `systemPromptAddition` tùy chọn) vừa với ngân sách token.
  </Accordion>
  <Accordion title="3. Compact">
    Được gọi khi cửa sổ ngữ cảnh đã đầy, hoặc khi người dùng chạy `/compact`. Công cụ tóm tắt lịch sử cũ hơn để giải phóng không gian.
  </Accordion>
  <Accordion title="4. Sau lượt">
    Được gọi sau khi một lần chạy hoàn tất. Công cụ có thể lưu trạng thái, kích hoạt compaction nền hoặc cập nhật chỉ mục.
  </Accordion>
</AccordionGroup>

Đối với bộ khung Codex không phải ACP đi kèm, OpenClaw áp dụng cùng vòng đời bằng cách chiếu ngữ cảnh đã lắp ráp vào chỉ dẫn dành cho nhà phát triển của Codex và prompt của lượt hiện tại. Codex vẫn sở hữu lịch sử luồng gốc và trình compact gốc của nó.

### Vòng đời subagent (không bắt buộc)

OpenClaw gọi hai hook vòng đời subagent tùy chọn:

<ParamField path="prepareSubagentSpawn" type="method">
  Chuẩn bị trạng thái ngữ cảnh dùng chung trước khi một lần chạy con bắt đầu. Hook nhận khóa phiên cha/con, `contextMode` (`isolated` hoặc `fork`), các id/tệp transcript sẵn có và TTL tùy chọn. Nếu hook trả về một handle rollback, OpenClaw gọi handle đó khi spawn thất bại sau khi chuẩn bị thành công.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Dọn dẹp khi một phiên subagent hoàn tất hoặc bị quét.
</ParamField>

### Phần bổ sung prompt hệ thống

Phương thức `assemble` có thể trả về chuỗi `systemPromptAddition`. OpenClaw thêm chuỗi này vào đầu prompt hệ thống cho lần chạy. Điều này cho phép các công cụ chèn hướng dẫn nhớ lại động, chỉ dẫn truy xuất hoặc gợi ý nhận biết ngữ cảnh mà không yêu cầu các tệp workspace tĩnh.

## Công cụ legacy

Công cụ `legacy` tích hợp sẵn giữ nguyên hành vi ban đầu của OpenClaw:

- **Nạp**: không làm gì (trình quản lý phiên trực tiếp xử lý việc lưu tin nhắn).
- **Lắp ráp**: truyền qua (pipeline sanitize → validate → limit hiện có trong runtime xử lý việc lắp ráp ngữ cảnh).
- **Compact**: ủy quyền cho compaction tóm tắt tích hợp sẵn, tạo một bản tóm tắt duy nhất của các tin nhắn cũ hơn và giữ nguyên các tin nhắn gần đây.
- **Sau lượt**: không làm gì.

Công cụ legacy không đăng ký công cụ hoặc cung cấp `systemPromptAddition`.

Khi không đặt `plugins.slots.contextEngine` (hoặc đặt thành `"legacy"`), công cụ này được dùng tự động.

## Công cụ Plugin

Một Plugin có thể đăng ký công cụ ngữ cảnh bằng API Plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

Factory `ctx` bao gồm các giá trị `config`, `agentDir` và `workspaceDir`
tùy chọn để Plugin có thể khởi tạo trạng thái theo tác tử hoặc theo workspace trước khi
hook vòng đời đầu tiên chạy.

Sau đó bật trong cấu hình:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### Giao diện ContextEngine

Các thành viên bắt buộc:

| Thành viên         | Loại       | Mục đích                                                  |
| ------------------ | ---------- | --------------------------------------------------------- |
| `info`             | Thuộc tính | Id công cụ, tên, phiên bản và công cụ có sở hữu compaction hay không |
| `ingest(params)`   | Phương thức | Lưu trữ một tin nhắn duy nhất                            |
| `assemble(params)` | Phương thức | Xây dựng ngữ cảnh cho một lần chạy mô hình (trả về `AssembleResult`) |
| `compact(params)`  | Phương thức | Tóm tắt/giảm ngữ cảnh                                    |

`assemble` trả về một `AssembleResult` với:

<ParamField path="messages" type="Message[]" required>
  Các tin nhắn có thứ tự để gửi đến mô hình.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Ước tính của công cụ về tổng số token trong ngữ cảnh đã lắp ráp. OpenClaw dùng giá trị này cho các quyết định ngưỡng compaction và báo cáo chẩn đoán.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Được thêm vào đầu prompt hệ thống.
</ParamField>

`compact` trả về một `CompactResult`. Khi compaction xoay vòng transcript đang hoạt động,
`result.sessionId` và `result.sessionFile` xác định phiên kế nhiệm mà lần thử lại hoặc lượt tiếp theo phải sử dụng.

Các thành viên tùy chọn:

| Thành viên                     | Loại       | Mục đích                                                                                                         |
| ------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Phương thức | Khởi tạo trạng thái công cụ cho một phiên. Được gọi một lần khi công cụ lần đầu thấy một phiên (ví dụ: nhập lịch sử). |
| `ingestBatch(params)`          | Phương thức | Nạp một lượt đã hoàn tất dưới dạng lô. Được gọi sau khi một lần chạy hoàn tất, với toàn bộ tin nhắn từ lượt đó cùng lúc. |
| `afterTurn(params)`            | Phương thức | Công việc vòng đời sau lần chạy (lưu trạng thái, kích hoạt compaction nền).                                      |
| `prepareSubagentSpawn(params)` | Phương thức | Thiết lập trạng thái dùng chung cho một phiên con trước khi phiên đó bắt đầu.                                    |
| `onSubagentEnded(params)`      | Phương thức | Dọn dẹp sau khi một subagent kết thúc.                                                                          |
| `dispose()`                    | Phương thức | Giải phóng tài nguyên. Được gọi khi gateway tắt hoặc Plugin tải lại — không phải theo từng phiên.               |

### ownsCompaction

`ownsCompaction` kiểm soát việc auto-compaction trong lần thử tích hợp sẵn của Pi có còn được bật cho lần chạy hay không:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Công cụ sở hữu hành vi compaction. OpenClaw tắt auto-compaction tích hợp sẵn của Pi cho lần chạy đó, và phần triển khai `compact()` của công cụ chịu trách nhiệm cho `/compact`, compaction khôi phục tràn và mọi compaction chủ động mà nó muốn thực hiện trong `afterTurn()`. OpenClaw vẫn có thể chạy biện pháp bảo vệ tràn trước prompt; khi dự đoán toàn bộ transcript sẽ tràn, đường dẫn khôi phục gọi `compact()` của công cụ đang hoạt động trước khi gửi một prompt khác.
  </Accordion>
  <Accordion title="ownsCompaction: false hoặc không đặt">
    Auto-compaction tích hợp sẵn của Pi vẫn có thể chạy trong quá trình thực thi prompt, nhưng phương thức `compact()` của công cụ đang hoạt động vẫn được gọi cho `/compact` và khôi phục tràn.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **không** có nghĩa là OpenClaw tự động quay về đường dẫn compaction của công cụ legacy.
</Warning>

Điều đó có nghĩa là có hai mẫu Plugin hợp lệ:

<Tabs>
  <Tab title="Chế độ sở hữu">
    Triển khai thuật toán compaction riêng của bạn và đặt `ownsCompaction: true`.
  </Tab>
  <Tab title="Chế độ ủy quyền">
    Đặt `ownsCompaction: false` và để `compact()` gọi `delegateCompactionToRuntime(...)` từ `openclaw/plugin-sdk/core` để dùng hành vi compaction tích hợp sẵn của OpenClaw.
  </Tab>
</Tabs>

Một `compact()` không làm gì là không an toàn đối với một công cụ không sở hữu đang hoạt động vì nó vô hiệu hóa đường dẫn compaction `/compact` và khôi phục tràn bình thường cho slot công cụ đó.

## Tham chiếu cấu hình

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
Slot này là độc quyền tại thời điểm chạy — chỉ một công cụ ngữ cảnh đã đăng ký được phân giải cho một lần chạy hoặc thao tác compaction nhất định. Các Plugin `kind: "context-engine"` đã bật khác vẫn có thể tải và chạy mã đăng ký của chúng; `plugins.slots.contextEngine` chỉ chọn id công cụ đã đăng ký mà OpenClaw phân giải khi cần một công cụ ngữ cảnh.
</Note>

<Note>
**Gỡ cài đặt Plugin:** khi bạn gỡ cài đặt Plugin hiện đang được chọn làm `plugins.slots.contextEngine`, OpenClaw đặt lại slot về mặc định (`legacy`). Hành vi đặt lại tương tự áp dụng cho `plugins.slots.memory`. Không cần chỉnh sửa cấu hình thủ công.
</Note>

## Quan hệ với compaction và bộ nhớ

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction là một trách nhiệm của công cụ ngữ cảnh. Công cụ cũ ủy quyền cho tính năng tóm tắt tích hợp của OpenClaw. Các công cụ Plugin có thể triển khai bất kỳ chiến lược Compaction nào (tóm tắt DAG, truy xuất vector, v.v.).
  </Accordion>
  <Accordion title="Plugin bộ nhớ">
    Plugin bộ nhớ (`plugins.slots.memory`) tách biệt với các công cụ ngữ cảnh. Plugin bộ nhớ cung cấp tìm kiếm/truy xuất; công cụ ngữ cảnh kiểm soát những gì mô hình nhìn thấy. Chúng có thể hoạt động cùng nhau — một công cụ ngữ cảnh có thể dùng dữ liệu Plugin bộ nhớ trong quá trình lắp ráp. Các công cụ Plugin muốn dùng đường dẫn lời nhắc Active Memory nên ưu tiên `buildMemorySystemPromptAddition(...)` từ `openclaw/plugin-sdk/core`, hàm này chuyển đổi các phần lời nhắc Active Memory thành một `systemPromptAddition` sẵn sàng để thêm vào đầu. Nếu một công cụ cần quyền kiểm soát cấp thấp hơn, nó vẫn có thể lấy các dòng thô từ `openclaw/plugin-sdk/memory-host-core` qua `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Cắt tỉa phiên">
    Việc cắt bớt kết quả công cụ cũ trong bộ nhớ vẫn chạy bất kể công cụ ngữ cảnh nào đang hoạt động.
  </Accordion>
</AccordionGroup>

## Mẹo

- Dùng `openclaw doctor` để xác minh công cụ của bạn đang tải đúng cách.
- Nếu chuyển đổi công cụ, các phiên hiện có tiếp tục với lịch sử hiện tại của chúng. Công cụ mới sẽ tiếp quản cho các lần chạy trong tương lai.
- Lỗi công cụ được ghi nhật ký và hiển thị trong chẩn đoán. Nếu một công cụ Plugin không đăng ký được hoặc không thể phân giải id công cụ đã chọn, OpenClaw không tự động quay về dự phòng; các lần chạy sẽ thất bại cho đến khi bạn sửa Plugin hoặc chuyển `plugins.slots.contextEngine` về `"legacy"`.
- Để phát triển, dùng `openclaw plugins install -l ./my-engine` để liên kết một thư mục Plugin cục bộ mà không cần sao chép.

## Liên quan

- [Compaction](/vi/concepts/compaction) — tóm tắt các cuộc trò chuyện dài
- [Ngữ cảnh](/vi/concepts/context) — cách ngữ cảnh được xây dựng cho các lượt tác tử
- [Kiến trúc Plugin](/vi/plugins/architecture) — đăng ký các Plugin công cụ ngữ cảnh
- [Tệp kê khai Plugin](/vi/plugins/manifest) — các trường tệp kê khai Plugin
- [Plugin](/vi/tools/plugin) — tổng quan về Plugin
