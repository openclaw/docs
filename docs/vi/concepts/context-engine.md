---
read_when:
    - Bạn muốn hiểu cách OpenClaw tập hợp ngữ cảnh mô hình
    - Bạn đang chuyển đổi giữa công cụ cũ và một công cụ Plugin
    - Bạn đang xây dựng một plugin công cụ ngữ cảnh
sidebarTitle: Context engine
summary: 'Công cụ ngữ cảnh: lắp ráp ngữ cảnh có thể cắm ghép, Compaction và vòng đời tác nhân con'
title: Công cụ ngữ cảnh
x-i18n:
    generated_at: "2026-06-27T17:22:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 124b6daf52f3d58f756352e2e169697541a8b6e67aecaa5a219bed15bda801cd
    source_path: concepts/context-engine.md
    workflow: 16
---

Một **công cụ ngữ cảnh** kiểm soát cách OpenClaw xây dựng ngữ cảnh mô hình cho mỗi lần chạy: đưa những tin nhắn nào vào, cách tóm tắt lịch sử cũ hơn, và cách quản lý ngữ cảnh qua các ranh giới subagent.

OpenClaw đi kèm công cụ `legacy` tích hợp sẵn và dùng nó theo mặc định - hầu hết người dùng không cần thay đổi điều này. Chỉ cài đặt và chọn công cụ Plugin khi bạn muốn hành vi lắp ráp, Compaction, hoặc nhớ lại liên phiên khác.

## Bắt đầu nhanh

<Steps>
  <Step title="Kiểm tra công cụ nào đang hoạt động">
    ```bash
    openclaw doctor
    # hoặc kiểm tra trực tiếp cấu hình:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Cài đặt công cụ Plugin">
    Plugin công cụ ngữ cảnh được cài đặt giống như mọi Plugin OpenClaw khác.

    <Tabs>
      <Tab title="Từ npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="Từ đường dẫn cục bộ">
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
  <Step title="Chuyển lại về legacy (tùy chọn)">
    Đặt `contextEngine` thành `"legacy"` (hoặc xóa hẳn khóa này - `"legacy"` là mặc định).
  </Step>
</Steps>

## Cách hoạt động

Mỗi khi OpenClaw chạy một lời nhắc mô hình, công cụ ngữ cảnh tham gia ở bốn điểm vòng đời:

<AccordionGroup>
  <Accordion title="1. Tiếp nhận">
    Được gọi khi một tin nhắn mới được thêm vào phiên. Công cụ có thể lưu trữ hoặc lập chỉ mục tin nhắn trong kho dữ liệu riêng của nó.
  </Accordion>
  <Accordion title="2. Lắp ráp">
    Được gọi trước mỗi lần chạy mô hình. Công cụ trả về một tập tin nhắn có thứ tự (và một `systemPromptAddition` tùy chọn) phù hợp với ngân sách token.
  </Accordion>
  <Accordion title="3. Compact">
    Được gọi khi cửa sổ ngữ cảnh đã đầy, hoặc khi người dùng chạy `/compact`. Công cụ tóm tắt lịch sử cũ hơn để giải phóng không gian.
  </Accordion>
  <Accordion title="4. Sau lượt">
    Được gọi sau khi một lần chạy hoàn tất. Công cụ có thể lưu trạng thái, kích hoạt Compaction nền, hoặc cập nhật chỉ mục.
  </Accordion>
</AccordionGroup>

Đối với harness Codex không phải ACP đi kèm, OpenClaw áp dụng cùng vòng đời bằng cách chiếu ngữ cảnh đã lắp ráp vào hướng dẫn dành cho nhà phát triển của Codex và lời nhắc của lượt hiện tại. Codex vẫn sở hữu lịch sử luồng gốc và bộ Compaction gốc của nó.

### Vòng đời subagent (tùy chọn)

OpenClaw gọi hai hook vòng đời subagent tùy chọn:

<ParamField path="prepareSubagentSpawn" type="method">
  Chuẩn bị trạng thái ngữ cảnh dùng chung trước khi một lần chạy con bắt đầu. Hook nhận các khóa phiên cha/con, `contextMode` (`isolated` hoặc `fork`), id/tệp transcript khả dụng, và TTL tùy chọn. Nếu nó trả về một handle rollback, OpenClaw gọi handle đó khi spawn thất bại sau khi chuẩn bị thành công. Các spawn subagent gốc yêu cầu `lightContext` và phân giải thành `contextMode="isolated"` cố ý bỏ qua hook này để phiên con bắt đầu từ ngữ cảnh bootstrap nhẹ mà không có trạng thái trước spawn do công cụ ngữ cảnh quản lý.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Dọn dẹp khi một phiên subagent hoàn tất hoặc bị quét.
</ParamField>

### Phần bổ sung lời nhắc hệ thống

Phương thức `assemble` có thể trả về chuỗi `systemPromptAddition`. OpenClaw thêm chuỗi này vào đầu lời nhắc hệ thống cho lần chạy. Điều này cho phép công cụ chèn hướng dẫn nhớ lại động, hướng dẫn truy xuất, hoặc gợi ý nhận biết ngữ cảnh mà không yêu cầu tệp workspace tĩnh.

## Công cụ legacy

Công cụ `legacy` tích hợp sẵn giữ nguyên hành vi ban đầu của OpenClaw:

- **Tiếp nhận**: không làm gì (trình quản lý phiên xử lý trực tiếp việc lưu tin nhắn).
- **Lắp ráp**: truyền qua (pipeline sanitize → validate → limit hiện có trong runtime xử lý việc lắp ráp ngữ cảnh).
- **Compact**: ủy quyền cho Compaction tóm tắt tích hợp sẵn, tạo một bản tóm tắt duy nhất của các tin nhắn cũ hơn và giữ nguyên các tin nhắn gần đây.
- **Sau lượt**: không làm gì.

Công cụ legacy không đăng ký công cụ hay cung cấp `systemPromptAddition`.

Khi không đặt `plugins.slots.contextEngine` (hoặc nó được đặt thành `"legacy"`), công cụ này được tự động sử dụng.

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

Factory `ctx` bao gồm các giá trị `config`, `agentDir`, và `workspaceDir` tùy chọn để Plugin có thể khởi tạo trạng thái theo agent hoặc theo workspace trước khi hook vòng đời đầu tiên chạy.

Sau đó bật nó trong cấu hình:

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

Thành viên bắt buộc:

| Thành viên         | Loại       | Mục đích                                                 |
| ------------------ | ---------- | -------------------------------------------------------- |
| `info`             | Thuộc tính | id công cụ, tên, phiên bản, và liệu nó sở hữu Compaction |
| `ingest(params)`   | Phương thức | Lưu trữ một tin nhắn duy nhất                            |
| `assemble(params)` | Phương thức | Xây dựng ngữ cảnh cho một lần chạy mô hình (trả về `AssembleResult`) |
| `compact(params)`  | Phương thức | Tóm tắt/giảm ngữ cảnh                                    |

`assemble` trả về một `AssembleResult` với:

<ParamField path="messages" type="Message[]" required>
  Các tin nhắn có thứ tự để gửi đến mô hình.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Ước tính của công cụ về tổng số token trong ngữ cảnh đã lắp ráp. OpenClaw dùng giá trị này cho các quyết định ngưỡng Compaction và báo cáo chẩn đoán.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Được thêm vào đầu lời nhắc hệ thống.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Kiểm soát ước tính token nào mà runner dùng cho các bước kiểm tra trước tràn chủ động. Mặc định là `"assembled"`, nghĩa là chỉ kiểm tra ước tính của lời nhắc đã lắp ráp - phù hợp với các công cụ trả về ngữ cảnh đã tạo cửa sổ và tự chứa. Chỉ đặt thành `"preassembly_may_overflow"` khi góc nhìn đã lắp ráp của bạn có thể che giấu rủi ro tràn trong transcript bên dưới; khi đó runner lấy giá trị lớn nhất giữa ước tính đã lắp ráp và ước tính lịch sử phiên trước lắp ráp (chưa tạo cửa sổ) khi quyết định có nên Compact chủ động hay không. Dù theo cách nào, các tin nhắn bạn trả về vẫn là những gì mô hình thấy - `promptAuthority` chỉ ảnh hưởng đến bước kiểm tra trước.
</ParamField>

`compact` trả về một `CompactResult`. Khi Compaction xoay transcript đang hoạt động, `result.sessionId` và `result.sessionFile` xác định phiên kế nhiệm mà lần thử lại hoặc lượt tiếp theo phải dùng.

Thành viên tùy chọn:

| Thành viên                     | Loại       | Mục đích                                                                                                        |
| ------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Phương thức | Khởi tạo trạng thái công cụ cho một phiên. Được gọi một lần khi công cụ lần đầu thấy một phiên (ví dụ: nhập lịch sử). |
| `ingestBatch(params)`          | Phương thức | Tiếp nhận một lượt đã hoàn tất dưới dạng lô. Được gọi sau khi một lần chạy hoàn tất, với tất cả tin nhắn từ lượt đó cùng lúc. |
| `afterTurn(params)`            | Phương thức | Công việc vòng đời sau chạy (lưu trạng thái, kích hoạt Compaction nền).                                         |
| `prepareSubagentSpawn(params)` | Phương thức | Thiết lập trạng thái dùng chung cho một phiên con trước khi nó bắt đầu.                                         |
| `onSubagentEnded(params)`      | Phương thức | Dọn dẹp sau khi một subagent kết thúc.                                                                          |
| `dispose()`                    | Phương thức | Giải phóng tài nguyên. Được gọi trong lúc Gateway tắt hoặc Plugin tải lại - không phải theo từng phiên.         |

### Cài đặt runtime

Các hook vòng đời chạy bên trong OpenClaw nhận một đối tượng `runtimeSettings` tùy chọn. Đây là một bề mặt API producer/consumer nội bộ, chỉ đọc, có phiên bản: OpenClaw tạo nó cho công cụ ngữ cảnh đã chọn, và công cụ ngữ cảnh tiêu thụ nó bên trong các hook vòng đời. Nó không được hiển thị trực tiếp cho người dùng và không tạo bề mặt báo cáo chuyên dụng.

- `schemaVersion`: hiện là `1`
- `runtime`: máy chủ OpenClaw, chế độ runtime (`normal`, `fallback`, hoặc `degraded`), và id harness/runtime tùy chọn
- `contextEngineSelection`: id công cụ ngữ cảnh đã chọn và nguồn lựa chọn
- `executionHost`: id máy chủ và nhãn cho bề mặt gọi hook
- `model`: mô hình được yêu cầu, mô hình đã phân giải, nhà cung cấp, và họ mô hình tùy chọn
- `limits`: ngân sách token lời nhắc và số token đầu ra tối đa khi biết
- `diagnostics`: mã lý do fallback đóng và degraded khi biết

Các trường có thể không xác định được biểu diễn là `null`; các trường phân biệt như chế độ runtime và nguồn lựa chọn vẫn không thể null. Các công cụ cũ hơn vẫn tương thích: nếu một công cụ legacy nghiêm ngặt từ chối `runtimeSettings` vì là thuộc tính không xác định, OpenClaw thử lại lời gọi vòng đời mà không có nó thay vì cách ly công cụ.

### Yêu cầu máy chủ

Công cụ ngữ cảnh có thể khai báo yêu cầu năng lực máy chủ trên `info.hostRequirements`. OpenClaw kiểm tra các yêu cầu này trước khi bắt đầu thao tác và fail closed với lỗi mô tả khi runtime đã chọn không thể đáp ứng chúng.

Đối với các lần chạy agent, khai báo `assemble-before-prompt` khi công cụ phải kiểm soát lời nhắc mô hình thực tế thông qua `assemble()`:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use the native Codex or OpenClaw embedded runtime, or select the legacy context engine.",
    },
  },
}
```

Các lần chạy agent Codex gốc và agent nhúng của OpenClaw đáp ứng `assemble-before-prompt`. Các backend CLI chung thì không, nên các công cụ yêu cầu năng lực này bị từ chối trước khi tiến trình CLI bắt đầu.

### Cô lập lỗi

OpenClaw cô lập công cụ Plugin đã chọn khỏi đường dẫn trả lời lõi. Nếu một công cụ không phải legacy bị thiếu, không vượt qua xác thực hợp đồng, ném lỗi trong lúc tạo factory, hoặc ném lỗi từ một phương thức vòng đời, OpenClaw cách ly công cụ đó cho tiến trình Gateway hiện tại và hạ cấp công việc công cụ ngữ cảnh xuống công cụ `legacy` tích hợp sẵn. Lỗi được ghi log cùng thao tác thất bại để người vận hành có thể sửa chữa, cập nhật, hoặc tắt Plugin mà agent không bị im lặng.

Các lỗi yêu cầu host thì khác: khi một engine khai báo rằng một runtime
thiếu năng lực bắt buộc, OpenClaw sẽ dừng theo hướng an toàn trước khi bắt đầu lượt chạy. Điều đó
bảo vệ các engine có thể làm hỏng trạng thái nếu chúng chạy trong một host không được hỗ trợ.

### ownsCompaction

`ownsCompaction` kiểm soát việc auto-compaction trong lần thử tích hợp sẵn của runtime OpenClaw có tiếp tục được bật cho lượt chạy hay không:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Engine sở hữu hành vi Compaction. OpenClaw tắt auto-compaction tích hợp sẵn của runtime OpenClaw cho lượt chạy đó, và phần triển khai `compact()` của engine chịu trách nhiệm cho `/compact`, Compaction phục hồi khi tràn, và mọi Compaction chủ động mà nó muốn thực hiện trong `afterTurn()`. OpenClaw vẫn có thể chạy cơ chế bảo vệ tràn trước prompt; khi cơ chế này dự đoán toàn bộ transcript sẽ bị tràn, đường dẫn phục hồi sẽ gọi `compact()` của engine đang hoạt động trước khi gửi một prompt khác.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    Auto-compaction tích hợp sẵn của runtime OpenClaw vẫn có thể chạy trong quá trình thực thi prompt, nhưng phương thức `compact()` của engine đang hoạt động vẫn được gọi cho `/compact` và phục hồi khi tràn.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **không** có nghĩa là OpenClaw tự động quay về đường dẫn Compaction của engine cũ.
</Warning>

Điều đó có nghĩa là có hai mẫu Plugin hợp lệ:

<Tabs>
  <Tab title="Owning mode">
    Triển khai thuật toán Compaction của riêng bạn và đặt `ownsCompaction: true`.
  </Tab>
  <Tab title="Delegating mode">
    Đặt `ownsCompaction: false` và để `compact()` gọi `delegateCompactionToRuntime(...)` từ `openclaw/plugin-sdk/core` để sử dụng hành vi Compaction tích hợp sẵn của OpenClaw.
  </Tab>
</Tabs>

Một `compact()` không làm gì là không an toàn đối với engine không sở hữu đang hoạt động, vì nó vô hiệu hóa đường dẫn `/compact` thông thường và Compaction phục hồi khi tràn cho slot engine đó.

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
Slot là độc quyền tại thời điểm chạy - chỉ một context engine đã đăng ký được phân giải cho một lượt chạy hoặc thao tác Compaction nhất định. Các Plugin `kind: "context-engine"` khác đang bật vẫn có thể tải và chạy mã đăng ký của chúng; `plugins.slots.contextEngine` chỉ chọn id engine đã đăng ký mà OpenClaw phân giải khi cần context engine.
</Note>

<Note>
**Gỡ cài đặt Plugin:** khi bạn gỡ cài đặt Plugin hiện đang được chọn làm `plugins.slots.contextEngine`, OpenClaw đặt lại slot về mặc định (`legacy`). Hành vi đặt lại tương tự áp dụng cho `plugins.slots.memory`. Không cần chỉnh sửa cấu hình thủ công.
</Note>

## Mối quan hệ với Compaction và bộ nhớ

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction là một trách nhiệm của context engine. Engine cũ ủy quyền cho cơ chế tóm tắt tích hợp sẵn của OpenClaw. Plugin engine có thể triển khai bất kỳ chiến lược Compaction nào (tóm tắt DAG, truy xuất vector, v.v.).
  </Accordion>
  <Accordion title="Memory plugins">
    Memory plugins (`plugins.slots.memory`) tách biệt với context engine. Memory plugins cung cấp tìm kiếm/truy xuất; context engine kiểm soát những gì mô hình nhìn thấy. Chúng có thể hoạt động cùng nhau - một context engine có thể dùng dữ liệu memory plugin trong quá trình lắp ráp. Plugin engine muốn dùng đường dẫn prompt bộ nhớ đang hoạt động nên ưu tiên `buildMemorySystemPromptAddition(...)` từ `openclaw/plugin-sdk/core`, hàm này chuyển đổi các phần prompt bộ nhớ đang hoạt động thành `systemPromptAddition` sẵn sàng thêm vào đầu. Nếu engine cần quyền kiểm soát cấp thấp hơn, nó vẫn có thể lấy các dòng thô từ `openclaw/plugin-sdk/memory-host-core` qua `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Session pruning">
    Việc cắt bớt các kết quả công cụ cũ trong bộ nhớ vẫn chạy bất kể context engine nào đang hoạt động.
  </Accordion>
</AccordionGroup>

## Mẹo

- Dùng `openclaw doctor` để xác minh engine của bạn đang tải đúng cách.
- Nếu chuyển đổi engine, các phiên hiện có sẽ tiếp tục với lịch sử hiện tại của chúng. Engine mới sẽ tiếp quản cho các lượt chạy trong tương lai.
- Lỗi engine được ghi log và Plugin engine đã chọn bị cách ly trong tiến trình Gateway hiện tại. OpenClaw quay về `legacy` cho các lượt của người dùng để phản hồi có thể tiếp tục, nhưng bạn vẫn nên sửa, cập nhật, vô hiệu hóa hoặc gỡ cài đặt Plugin bị hỏng.
- Khi phát triển, dùng `openclaw plugins install -l ./my-engine` để liên kết một thư mục Plugin cục bộ mà không cần sao chép.

## Liên quan

- [Compaction](/vi/concepts/compaction) - tóm tắt các cuộc trò chuyện dài
- [Ngữ cảnh](/vi/concepts/context) - cách ngữ cảnh được xây dựng cho các lượt agent
- [Kiến trúc Plugin](/vi/plugins/architecture) - đăng ký context engine plugins
- [Plugin manifest](/vi/plugins/manifest) - các trường manifest của Plugin
- [Plugins](/vi/tools/plugin) - tổng quan về Plugin
