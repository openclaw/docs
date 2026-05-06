---
read_when:
    - Bạn muốn hiểu cách OpenClaw tập hợp ngữ cảnh mô hình
    - Bạn đang chuyển đổi giữa công cụ cũ và công cụ Plugin
    - Bạn đang xây dựng một Plugin bộ máy ngữ cảnh
sidebarTitle: Context engine
summary: 'Bộ máy ngữ cảnh: tổng hợp ngữ cảnh có thể cắm mở rộng, Compaction và vòng đời subagent'
title: Công cụ ngữ cảnh
x-i18n:
    generated_at: "2026-05-06T09:07:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c33c94971751d92a2ce695db545a0c0abb7adcbe1820383b83f4201fa7e628d
    source_path: concepts/context-engine.md
    workflow: 16
---

Một **công cụ ngữ cảnh** kiểm soát cách OpenClaw xây dựng ngữ cảnh mô hình cho mỗi lần chạy: những thông điệp nào cần đưa vào, cách tóm tắt lịch sử cũ hơn, và cách quản lý ngữ cảnh qua ranh giới tác tử phụ.

OpenClaw đi kèm công cụ `legacy` tích hợp sẵn và dùng công cụ này theo mặc định - hầu hết người dùng không bao giờ cần thay đổi điều này. Chỉ cài đặt và chọn một công cụ Plugin khi bạn muốn hành vi lắp ráp, Compaction, hoặc nhớ lại xuyên phiên khác.

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
    Các Plugin công cụ ngữ cảnh được cài đặt giống như bất kỳ Plugin OpenClaw nào khác.

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

    Khởi động lại Gateway sau khi cài đặt và cấu hình.

  </Step>
  <Step title="Chuyển lại về legacy (tùy chọn)">
    Đặt `contextEngine` thành `"legacy"` (hoặc xóa hoàn toàn khóa này - `"legacy"` là mặc định).
  </Step>
</Steps>

## Cách hoạt động

Mỗi khi OpenClaw chạy một lời nhắc mô hình, công cụ ngữ cảnh tham gia tại bốn điểm vòng đời:

<AccordionGroup>
  <Accordion title="1. Nạp vào">
    Được gọi khi một thông điệp mới được thêm vào phiên. Công cụ có thể lưu trữ hoặc lập chỉ mục thông điệp trong kho dữ liệu riêng của nó.
  </Accordion>
  <Accordion title="2. Lắp ráp">
    Được gọi trước mỗi lần chạy mô hình. Công cụ trả về một tập thông điệp có thứ tự (và một `systemPromptAddition` tùy chọn) phù hợp trong ngân sách token.
  </Accordion>
  <Accordion title="3. Compact">
    Được gọi khi cửa sổ ngữ cảnh đầy, hoặc khi người dùng chạy `/compact`. Công cụ tóm tắt lịch sử cũ hơn để giải phóng không gian.
  </Accordion>
  <Accordion title="4. Sau lượt">
    Được gọi sau khi một lần chạy hoàn tất. Công cụ có thể lưu giữ trạng thái, kích hoạt Compaction nền, hoặc cập nhật chỉ mục.
  </Accordion>
</AccordionGroup>

Đối với bộ khai thác Codex không phải ACP được đóng gói, OpenClaw áp dụng cùng vòng đời bằng cách chiếu ngữ cảnh đã lắp ráp vào chỉ dẫn dành cho nhà phát triển Codex và lời nhắc lượt hiện tại. Codex vẫn sở hữu lịch sử luồng gốc và bộ Compaction gốc của nó.

### Vòng đời tác tử phụ (tùy chọn)

OpenClaw gọi hai hook vòng đời tác tử phụ tùy chọn:

<ParamField path="prepareSubagentSpawn" type="method">
  Chuẩn bị trạng thái ngữ cảnh dùng chung trước khi một lần chạy con bắt đầu. Hook nhận các khóa phiên cha/con, `contextMode` (`isolated` hoặc `fork`), các id/tệp bản ghi có sẵn, và TTL tùy chọn. Nếu nó trả về một tay cầm rollback, OpenClaw sẽ gọi tay cầm đó khi spawn thất bại sau khi chuẩn bị thành công.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Dọn dẹp khi một phiên tác tử phụ hoàn tất hoặc bị quét.
</ParamField>

### Phần bổ sung lời nhắc hệ thống

Phương thức `assemble` có thể trả về chuỗi `systemPromptAddition`. OpenClaw thêm chuỗi này vào trước lời nhắc hệ thống cho lần chạy. Điều này cho phép các công cụ chèn hướng dẫn nhớ lại động, chỉ dẫn truy xuất, hoặc gợi ý nhận biết ngữ cảnh mà không cần các tệp không gian làm việc tĩnh.

## Công cụ legacy

Công cụ `legacy` tích hợp sẵn giữ nguyên hành vi ban đầu của OpenClaw:

- **Nạp vào**: không làm gì (trình quản lý phiên trực tiếp xử lý việc lưu giữ thông điệp).
- **Lắp ráp**: truyền qua (đường ống sanitize → validate → limit hiện có trong runtime xử lý việc lắp ráp ngữ cảnh).
- **Compact**: ủy quyền cho Compaction tóm tắt tích hợp sẵn, tạo một bản tóm tắt duy nhất của các thông điệp cũ hơn và giữ nguyên các thông điệp gần đây.
- **Sau lượt**: không làm gì.

Công cụ legacy không đăng ký công cụ hay cung cấp `systemPromptAddition`.

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

Factory `ctx` bao gồm các giá trị `config`, `agentDir`, và `workspaceDir`
tùy chọn để Plugin có thể khởi tạo trạng thái theo từng tác tử hoặc theo từng
không gian làm việc trước khi hook vòng đời đầu tiên chạy.

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

| Thành viên         | Loại       | Mục đích                                                 |
| ------------------ | ---------- | -------------------------------------------------------- |
| `info`             | Thuộc tính | Id công cụ, tên, phiên bản, và liệu nó sở hữu Compaction |
| `ingest(params)`   | Phương thức | Lưu trữ một thông điệp duy nhất                          |
| `assemble(params)` | Phương thức | Xây dựng ngữ cảnh cho một lần chạy mô hình (trả về `AssembleResult`) |
| `compact(params)`  | Phương thức | Tóm tắt/giảm ngữ cảnh                                    |

`assemble` trả về một `AssembleResult` với:

<ParamField path="messages" type="Message[]" required>
  Các thông điệp có thứ tự để gửi tới mô hình.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Ước tính của công cụ về tổng số token trong ngữ cảnh đã lắp ráp. OpenClaw dùng giá trị này cho các quyết định ngưỡng Compaction và báo cáo chẩn đoán.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Được thêm vào trước lời nhắc hệ thống.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Kiểm soát ước tính token nào mà runner dùng cho các kiểm tra trước tràn
  chủ động. Mặc định là `"assembled"`, nghĩa là chỉ kiểm tra ước tính của
  lời nhắc đã lắp ráp - phù hợp với các công cụ trả về một ngữ cảnh
  dạng cửa sổ, tự chứa. Chỉ đặt thành `"preassembly_may_overflow"` khi
  khung nhìn đã lắp ráp của bạn có thể che giấu rủi ro tràn trong
  bản ghi nền bên dưới; khi đó runner lấy giá trị lớn nhất giữa ước tính
  đã lắp ráp và ước tính lịch sử phiên trước lắp ráp (không tạo cửa sổ)
  khi quyết định có Compaction chủ động hay không. Dù theo cách nào, các
  thông điệp bạn trả về vẫn là những gì mô hình thấy - `promptAuthority` chỉ ảnh hưởng đến kiểm tra trước.
</ParamField>

`compact` trả về một `CompactResult`. Khi Compaction xoay vòng bản ghi đang hoạt động,
`result.sessionId` và `result.sessionFile` xác định phiên kế nhiệm
mà lần thử lại hoặc lượt tiếp theo phải dùng.

Các thành viên tùy chọn:

| Thành viên                     | Loại       | Mục đích                                                                                                        |
| ------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Phương thức | Khởi tạo trạng thái công cụ cho một phiên. Được gọi một lần khi công cụ lần đầu thấy một phiên (ví dụ: nhập lịch sử). |
| `ingestBatch(params)`          | Phương thức | Nạp một lượt đã hoàn tất dưới dạng lô. Được gọi sau khi một lần chạy hoàn tất, với tất cả thông điệp từ lượt đó cùng lúc. |
| `afterTurn(params)`            | Phương thức | Công việc vòng đời sau lần chạy (lưu giữ trạng thái, kích hoạt Compaction nền).                                 |
| `prepareSubagentSpawn(params)` | Phương thức | Thiết lập trạng thái dùng chung cho phiên con trước khi nó bắt đầu.                                             |
| `onSubagentEnded(params)`      | Phương thức | Dọn dẹp sau khi một tác tử phụ kết thúc.                                                                        |
| `dispose()`                    | Phương thức | Giải phóng tài nguyên. Được gọi trong quá trình tắt Gateway hoặc tải lại Plugin - không phải theo từng phiên.   |

### ownsCompaction

`ownsCompaction` kiểm soát liệu Compaction tự động trong lần thử tích hợp sẵn của Pi có tiếp tục được bật cho lần chạy hay không:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Công cụ sở hữu hành vi Compaction. OpenClaw tắt Compaction tự động tích hợp sẵn của Pi cho lần chạy đó, và phần triển khai `compact()` của công cụ chịu trách nhiệm cho `/compact`, Compaction khôi phục tràn, và bất kỳ Compaction chủ động nào mà nó muốn thực hiện trong `afterTurn()`. OpenClaw vẫn có thể chạy biện pháp bảo vệ tràn trước lời nhắc; khi dự đoán toàn bộ bản ghi sẽ tràn, đường dẫn khôi phục gọi `compact()` của công cụ đang hoạt động trước khi gửi một lời nhắc khác.
  </Accordion>
  <Accordion title="ownsCompaction: false hoặc chưa đặt">
    Compaction tự động tích hợp sẵn của Pi vẫn có thể chạy trong quá trình thực thi lời nhắc, nhưng phương thức `compact()` của công cụ đang hoạt động vẫn được gọi cho `/compact` và khôi phục tràn.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **không** có nghĩa là OpenClaw tự động quay về đường dẫn Compaction của công cụ legacy.
</Warning>

Điều đó có nghĩa là có hai mẫu Plugin hợp lệ:

<Tabs>
  <Tab title="Chế độ sở hữu">
    Triển khai thuật toán Compaction của riêng bạn và đặt `ownsCompaction: true`.
  </Tab>
  <Tab title="Chế độ ủy quyền">
    Đặt `ownsCompaction: false` và để `compact()` gọi `delegateCompactionToRuntime(...)` từ `openclaw/plugin-sdk/core` để dùng hành vi Compaction tích hợp sẵn của OpenClaw.
  </Tab>
</Tabs>

Một `compact()` không làm gì là không an toàn cho một công cụ không sở hữu đang hoạt động vì nó vô hiệu hóa đường dẫn Compaction thông thường của `/compact` và khôi phục tràn cho slot công cụ đó.

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
Slot này là độc quyền tại thời điểm chạy - chỉ một công cụ ngữ cảnh đã đăng ký được phân giải cho một lần chạy hoặc thao tác Compaction nhất định. Các Plugin `kind: "context-engine"` đã bật khác vẫn có thể tải và chạy mã đăng ký của chúng; `plugins.slots.contextEngine` chỉ chọn id công cụ đã đăng ký mà OpenClaw phân giải khi cần một công cụ ngữ cảnh.
</Note>

<Note>
**Gỡ cài đặt Plugin:** khi bạn gỡ cài đặt Plugin hiện đang được chọn làm `plugins.slots.contextEngine`, OpenClaw đặt lại slot về mặc định (`legacy`). Hành vi đặt lại tương tự áp dụng cho `plugins.slots.memory`. Không cần chỉnh sửa cấu hình thủ công.
</Note>

## Quan hệ với Compaction và bộ nhớ

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction là một trách nhiệm của bộ máy ngữ cảnh. Bộ máy cũ ủy quyền cho tính năng tóm tắt tích hợp của OpenClaw. Các bộ máy Plugin có thể triển khai bất kỳ chiến lược Compaction nào (tóm tắt DAG, truy xuất vector, v.v.).
  </Accordion>
  <Accordion title="Plugin bộ nhớ">
    Plugin bộ nhớ (`plugins.slots.memory`) tách biệt với bộ máy ngữ cảnh. Plugin bộ nhớ cung cấp tìm kiếm/truy xuất; bộ máy ngữ cảnh kiểm soát những gì mô hình nhìn thấy. Chúng có thể hoạt động cùng nhau - một bộ máy ngữ cảnh có thể dùng dữ liệu Plugin bộ nhớ trong quá trình lắp ráp. Các bộ máy Plugin muốn dùng đường dẫn prompt bộ nhớ hoạt động nên ưu tiên `buildMemorySystemPromptAddition(...)` từ `openclaw/plugin-sdk/core`, hàm này chuyển đổi các phần prompt bộ nhớ hoạt động thành một `systemPromptAddition` sẵn sàng thêm vào đầu. Nếu một bộ máy cần quyền kiểm soát cấp thấp hơn, nó vẫn có thể lấy các dòng thô từ `openclaw/plugin-sdk/memory-host-core` thông qua `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Cắt tỉa phiên">
    Việc cắt bớt kết quả công cụ cũ trong bộ nhớ vẫn chạy bất kể bộ máy ngữ cảnh nào đang hoạt động.
  </Accordion>
</AccordionGroup>

## Mẹo

- Dùng `openclaw doctor` để xác minh bộ máy của bạn đang tải đúng cách.
- Nếu chuyển đổi bộ máy, các phiên hiện có tiếp tục dùng lịch sử hiện tại của chúng. Bộ máy mới sẽ tiếp quản cho các lần chạy trong tương lai.
- Lỗi bộ máy được ghi nhật ký và hiển thị trong chẩn đoán. Nếu một bộ máy Plugin không đăng ký được hoặc không thể phân giải id bộ máy đã chọn, OpenClaw không tự động quay về dự phòng; các lần chạy sẽ thất bại cho đến khi bạn sửa Plugin hoặc chuyển `plugins.slots.contextEngine` về `"legacy"`.
- Để phát triển, dùng `openclaw plugins install -l ./my-engine` để liên kết một thư mục Plugin cục bộ mà không cần sao chép.

## Liên quan

- [Compaction](/vi/concepts/compaction) - tóm tắt các cuộc trò chuyện dài
- [Ngữ cảnh](/vi/concepts/context) - cách ngữ cảnh được xây dựng cho lượt tác nhân
- [Kiến trúc Plugin](/vi/plugins/architecture) - đăng ký Plugin bộ máy ngữ cảnh
- [Bản kê khai Plugin](/vi/plugins/manifest) - các trường bản kê khai Plugin
- [Plugins](/vi/tools/plugin) - tổng quan về Plugin
