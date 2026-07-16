---
read_when:
    - Bạn muốn hiểu cách OpenClaw tập hợp ngữ cảnh cho mô hình
    - Bạn đang chuyển đổi giữa công cụ cũ và công cụ Plugin
    - Bạn đang xây dựng một plugin công cụ ngữ cảnh
sidebarTitle: Context engine
summary: 'Công cụ ngữ cảnh: lắp ráp ngữ cảnh có thể thay thế, Compaction và vòng đời tác tử con'
title: Công cụ ngữ cảnh
x-i18n:
    generated_at: "2026-07-16T14:17:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 05cb5eb01f002001354dc63b77cdb86f3e9f3bc51722bd943ac20c9e1566dc60
    source_path: concepts/context-engine.md
    workflow: 16
---

Một **công cụ ngữ cảnh** kiểm soát cách OpenClaw xây dựng ngữ cảnh mô hình cho mỗi lần chạy: bao gồm những thông điệp nào, cách tóm tắt lịch sử cũ hơn và cách quản lý ngữ cảnh qua các ranh giới subagent.

OpenClaw đi kèm công cụ `legacy` tích hợp sẵn và sử dụng công cụ này theo mặc định. Chỉ cài đặt và chọn công cụ Plugin khi cần hành vi tập hợp, Compaction hoặc truy hồi giữa các phiên khác.

## Bắt đầu nhanh

<Steps>
  <Step title="Kiểm tra công cụ đang hoạt động">
    ```bash
    openclaw doctor
    # hoặc kiểm tra trực tiếp cấu hình:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Cài đặt công cụ Plugin">
    Các Plugin công cụ ngữ cảnh được cài đặt giống như mọi Plugin OpenClaw khác.

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
          contextEngine: "lossless-claw", // phải khớp với id công cụ đã đăng ký của Plugin
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Cấu hình riêng cho Plugin đặt tại đây (xem tài liệu của Plugin)
          },
        },
      },
    }
    ```

    Khởi động lại Gateway sau khi cài đặt và cấu hình.

  </Step>
  <Step title="Chuyển về chế độ cũ (không bắt buộc)">
    Đặt `contextEngine` thành `"legacy"` (hoặc xóa hoàn toàn khóa này - `"legacy"` là giá trị mặc định).
  </Step>
</Steps>

## Cách hoạt động

Mỗi khi OpenClaw chạy một lời nhắc mô hình, công cụ ngữ cảnh tham gia tại bốn thời điểm trong vòng đời:

<AccordionGroup>
  <Accordion title="1. Tiếp nhận">
    Được gọi khi một thông điệp mới được thêm vào phiên. Công cụ có thể lưu trữ hoặc lập chỉ mục thông điệp trong kho dữ liệu riêng.
  </Accordion>
  <Accordion title="2. Tập hợp">
    Được gọi trước mỗi lần chạy mô hình. Công cụ trả về một tập hợp thông điệp có thứ tự (và một `systemPromptAddition` không bắt buộc) phù hợp với ngân sách token.
  </Accordion>
  <Accordion title="3. Compaction">
    Được gọi khi cửa sổ ngữ cảnh đầy hoặc khi người dùng chạy `/compact`. Công cụ tóm tắt lịch sử cũ hơn để giải phóng dung lượng.
  </Accordion>
  <Accordion title="4. Sau lượt">
    Được gọi sau khi một lần chạy hoàn tất. Công cụ có thể duy trì trạng thái, kích hoạt Compaction trong nền hoặc cập nhật các chỉ mục.
  </Accordion>
</AccordionGroup>

Các công cụ cũng có thể triển khai phương thức `maintain()` không bắt buộc để bảo trì bản ghi hội thoại (ghi lại an toàn qua `runtimeContext.rewriteTranscriptEntries()`) sau khi khởi tạo, một lượt thành công hoặc Compaction. Đặt `info.turnMaintenanceMode: "background"` để chạy phương thức này dưới dạng công việc trì hoãn thay vì chặn phản hồi.

Đối với bộ khung Codex không dùng ACP đi kèm, OpenClaw áp dụng cùng vòng đời bằng cách chiếu ngữ cảnh đã tập hợp vào chỉ dẫn dành cho nhà phát triển của Codex và lời nhắc của lượt hiện tại. Codex vẫn quản lý lịch sử luồng gốc và trình Compaction gốc của mình.

### Vòng đời subagent (không bắt buộc)

OpenClaw gọi hai hook vòng đời subagent không bắt buộc:

<ParamField path="prepareSubagentSpawn" type="method">
  Chuẩn bị trạng thái ngữ cảnh dùng chung trước khi lượt chạy con bắt đầu. Hook nhận các khóa phiên cha/con, `contextMode` (`isolated` hoặc `fork`), các id/tệp bản ghi hội thoại khả dụng và TTL không bắt buộc. Nếu hook trả về một handle hoàn tác, OpenClaw sẽ gọi handle đó khi việc tạo thất bại sau khi chuẩn bị thành công. Các lần tạo subagent gốc yêu cầu `lightContext` và phân giải thành `contextMode="isolated"` sẽ cố ý bỏ qua hook này để tiến trình con bắt đầu từ ngữ cảnh khởi tạo gọn nhẹ mà không có trạng thái trước khi tạo do công cụ ngữ cảnh quản lý.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Dọn dẹp khi một phiên subagent hoàn tất hoặc bị quét.
</ParamField>

### Phần bổ sung cho lời nhắc hệ thống

Phương thức `assemble` có thể trả về một chuỗi `systemPromptAddition`. OpenClaw thêm chuỗi này vào đầu lời nhắc hệ thống cho lần chạy. Điều này cho phép các công cụ chèn hướng dẫn truy hồi động, chỉ dẫn truy xuất hoặc gợi ý nhận biết ngữ cảnh mà không cần các tệp không gian làm việc tĩnh.

## Công cụ cũ

Công cụ `legacy` tích hợp sẵn duy trì hành vi ban đầu của OpenClaw:

- **Tiếp nhận**: không thực hiện thao tác nào (trình quản lý phiên trực tiếp xử lý việc duy trì thông điệp).
- **Tập hợp**: chuyển tiếp nguyên trạng (pipeline làm sạch → xác thực → giới hạn hiện có trong runtime xử lý việc tập hợp ngữ cảnh).
- **Compaction**: ủy quyền cho Compaction tóm tắt tích hợp sẵn, tạo một bản tóm tắt duy nhất về các thông điệp cũ hơn và giữ nguyên các thông điệp gần đây.
- **Sau lượt**: không thực hiện thao tác nào.

Công cụ cũ không đăng ký công cụ hoặc cung cấp `systemPromptAddition`.

Khi chưa đặt `plugins.slots.contextEngine` (hoặc đặt thành `"legacy"`), công cụ này được tự động sử dụng.

## Các công cụ Plugin

Một Plugin có thể đăng ký công cụ ngữ cảnh bằng API Plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Lưu thông điệp trong kho dữ liệu của bạn
      return { ingested: true };
    },

    async assemble({
      sessionId,
      sessionKey,
      messages,
      tokenBudget,
      availableTools,
      citationsMode,
    }) {
      // Trả về các thông điệp phù hợp với ngân sách
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Tóm tắt ngữ cảnh cũ hơn
      return { ok: true, compacted: true };
    },
  }));
}
```

Factory `ctx` bao gồm các giá trị `config`, `agentDir` và `workspaceDir` không bắt buộc để các Plugin có thể khởi tạo trạng thái theo từng agent hoặc từng không gian làm việc trước khi hook vòng đời đầu tiên chạy.

Sau đó bật công cụ trong cấu hình:

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

| Thành viên             | Loại     | Mục đích                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Thuộc tính | Id, tên, phiên bản của công cụ và liệu công cụ có quản lý Compaction hay không |
| `ingest(params)`   | Phương thức   | Lưu trữ một thông điệp                                   |
| `assemble(params)` | Phương thức   | Xây dựng ngữ cảnh cho một lần chạy mô hình (trả về `AssembleResult`) |
| `compact(params)`  | Phương thức   | Tóm tắt/thu gọn ngữ cảnh                                 |

`assemble` trả về một `AssembleResult` gồm:

<ParamField path="messages" type="Message[]" required>
  Các thông điệp có thứ tự để gửi đến mô hình.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Ước tính của công cụ về tổng số token trong ngữ cảnh đã tập hợp. OpenClaw sử dụng giá trị này để quyết định ngưỡng Compaction và báo cáo chẩn đoán.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Được thêm vào đầu lời nhắc hệ thống.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Kiểm soát ước tính token mà trình chạy sử dụng cho các bước kiểm tra trước tình trạng tràn chủ động. Mặc định là `"assembled"`, nghĩa là đối với các công cụ không quản lý Compaction, chỉ ước tính của lời nhắc đã tập hợp được kiểm tra. Các công cụ đặt `ownsCompaction: true` tự quản lý việc tiếp nhận lời nhắc, vì vậy OpenClaw mặc định bỏ qua bước kiểm tra chung trước lời nhắc. Chỉ đặt `"preassembly_may_overflow"` khi chế độ xem đã tập hợp có thể che giấu nguy cơ tràn trong bản ghi hội thoại nền; khi đó, trình chạy duy trì bước kiểm tra chung và lấy giá trị lớn nhất giữa ước tính đã tập hợp và ước tính lịch sử phiên trước khi tập hợp (chưa áp dụng cửa sổ) khi quyết định có chủ động thực hiện Compaction hay không. Dù bằng cách nào, các thông điệp được trả về vẫn là nội dung mô hình nhìn thấy - `promptAuthority` chỉ ảnh hưởng đến bước kiểm tra trước.
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  Vòng đời chiếu không bắt buộc dành cho các máy chủ có luồng backend lâu dài (ví dụ: app-server Codex). `mode: "thread_bootstrap"` với một `epoch` ổn định yêu cầu máy chủ chèn ngữ cảnh đã tập hợp một lần trong mỗi epoch và tái sử dụng luồng backend cho đến khi epoch thay đổi, thay vì chiếu lại ở mỗi lượt. Bỏ qua trường này để chiếu theo từng lượt như thông thường.
</ParamField>

`compact` trả về một `CompactResult`. Khi Compaction thay đổi danh tính phiên đang hoạt động, `result.sessionTarget` (một `ContextEngineSessionTarget` có kiểu, mang danh tính phiên và phạm vi kho lưu trữ) xác định phiên kế nhiệm mà lần thử lại hoặc lượt tiếp theo phải sử dụng; `result.sessionId` phản ánh id kế nhiệm.

Các thành viên không bắt buộc:

| Thành viên                         | Loại   | Mục đích                                                                                                                                      |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Phương thức | Khởi tạo trạng thái công cụ cho một phiên. Được gọi một lần khi công cụ nhìn thấy phiên lần đầu tiên (ví dụ: nhập lịch sử).                              |
| `maintain(params)`             | Phương thức | Bảo trì bản ghi hội thoại sau khi khởi tạo, một lượt thành công hoặc Compaction. Sử dụng `runtimeContext.rewriteTranscriptEntries()` để ghi lại an toàn. |
| `ingestBatch(params)`          | Phương thức | Tiếp nhận một lượt đã hoàn tất dưới dạng một lô. Được gọi sau khi một lần chạy hoàn tất, với tất cả thông điệp từ lượt đó cùng lúc.                                  |
| `afterTurn(params)`            | Phương thức | Công việc vòng đời sau khi chạy (duy trì trạng thái, kích hoạt Compaction trong nền).                                                                      |
| `prepareSubagentSpawn(params)` | Phương thức | Thiết lập trạng thái dùng chung cho phiên con trước khi phiên bắt đầu.                                                                                    |
| `onSubagentEnded(params)`      | Phương thức | Dọn dẹp sau khi một subagent kết thúc.                                                                                                              |
| `dispose()`                    | Phương thức | Giải phóng tài nguyên. Được gọi khi Gateway tắt hoặc Plugin tải lại - không gọi theo từng phiên.                                                        |

### Cài đặt runtime

Các hook vòng đời chạy bên trong OpenClaw nhận một đối tượng `runtimeSettings` không bắt buộc. Đây là một bề mặt API nhà sản xuất/người tiêu thụ nội bộ, chỉ đọc và có phiên bản: OpenClaw tạo đối tượng này cho công cụ ngữ cảnh đã chọn, còn công cụ ngữ cảnh sử dụng đối tượng đó bên trong các hook vòng đời. Đối tượng này không được hiển thị trực tiếp cho người dùng và không tạo ra một bề mặt báo cáo chuyên biệt.

- `schemaVersion`: hiện tại là `1`
- `runtime`: máy chủ OpenClaw, chế độ runtime (`normal`, `fallback` hoặc
  `degraded`) và các id harness/runtime tùy chọn
- `contextEngineSelection`: id công cụ ngữ cảnh đã chọn và nguồn lựa chọn
- `executionHost`: id và nhãn máy chủ của bề mặt gọi hook
- `model`: mô hình được yêu cầu, mô hình đã phân giải, nhà cung cấp và họ mô hình tùy chọn
- `limits`: ngân sách token của prompt và số token đầu ra tối đa khi đã biết
- `diagnostics`: mã lý do dự phòng đóng và suy giảm khi đã biết

Các trường có thể không xác định được biểu diễn bằng `null`; các trường phân biệt
như chế độ runtime và nguồn lựa chọn vẫn không cho phép null. Các công cụ cũ vẫn
tương thích: nếu một công cụ cũ nghiêm ngặt từ chối `runtimeSettings` vì đây là
thuộc tính không xác định, OpenClaw sẽ thử lại lệnh gọi vòng đời mà không có thuộc tính đó
thay vì cách ly công cụ.

### Yêu cầu đối với máy chủ

Các công cụ ngữ cảnh có thể khai báo yêu cầu về khả năng của máy chủ trên `info.hostRequirements`.
OpenClaw kiểm tra các yêu cầu này trước khi bắt đầu thao tác và đóng khi thất bại
kèm lỗi mô tả nếu runtime đã chọn không thể đáp ứng chúng.

Đối với các lượt chạy tác tử, hãy khai báo `assemble-before-prompt` khi công cụ phải kiểm soát
prompt mô hình thực tế thông qua `assemble()`:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Sử dụng Codex gốc hoặc runtime nhúng của OpenClaw, hoặc chọn công cụ ngữ cảnh cũ.",
    },
  },
}
```

Các lượt chạy tác tử Codex gốc và OpenClaw nhúng đáp ứng `assemble-before-prompt`.
Các backend CLI chung không đáp ứng, vì vậy những công cụ yêu cầu khả năng này sẽ bị từ chối trước khi
tiến trình CLI khởi động.

### Cách ly lỗi

OpenClaw cách ly công cụ Plugin đã chọn khỏi đường dẫn phản hồi cốt lõi. Nếu một
công cụ không phải loại cũ bị thiếu, không vượt qua xác thực hợp đồng, ném lỗi trong khi
tạo factory hoặc ném lỗi từ một phương thức vòng đời, OpenClaw sẽ cách ly công cụ đó
trong tiến trình Gateway hiện tại và hạ cấp công việc của công cụ ngữ cảnh xuống
công cụ `legacy` tích hợp sẵn. Lỗi được ghi nhật ký cùng với thao tác thất bại để
người vận hành có thể sửa chữa, cập nhật hoặc vô hiệu hóa Plugin mà không khiến tác tử
im lặng.

Lỗi yêu cầu máy chủ thì khác: khi một công cụ khai báo rằng runtime
thiếu một khả năng bắt buộc, OpenClaw sẽ đóng khi thất bại trước khi bắt đầu lượt chạy. Điều đó
bảo vệ các công cụ có thể làm hỏng trạng thái nếu chạy trên máy chủ không được hỗ trợ.

### ownsCompaction

`ownsCompaction` kiểm soát việc tự động Compaction tích hợp trong lần thử của runtime OpenClaw có tiếp tục được bật cho lượt chạy hay không:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Công cụ sở hữu hành vi Compaction. OpenClaw vô hiệu hóa tính năng tự động Compaction tích hợp của runtime OpenClaw và bước kiểm tra trước tình trạng tràn chung trước prompt cho lượt chạy đó; phần triển khai `compact()` của công cụ chịu trách nhiệm về `/compact`, Compaction khôi phục khi nhà cung cấp bị tràn và mọi Compaction chủ động mà công cụ muốn thực hiện trong `afterTurn()`. OpenClaw vẫn chạy biện pháp bảo vệ chống tràn trước prompt khi công cụ trả về `promptAuthority: "preassembly_may_overflow"` từ `assemble()`.
  </Accordion>
  <Accordion title="ownsCompaction: false hoặc chưa đặt">
    Tính năng tự động Compaction tích hợp của runtime OpenClaw vẫn có thể chạy trong khi thực thi prompt, nhưng phương thức `compact()` của công cụ đang hoạt động vẫn được gọi cho `/compact` và quá trình khôi phục khi tràn.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **không** có nghĩa là OpenClaw tự động dự phòng sang đường dẫn Compaction của công cụ cũ.
</Warning>

Điều đó có nghĩa là có hai mẫu Plugin hợp lệ:

<Tabs>
  <Tab title="Chế độ sở hữu">
    Triển khai thuật toán Compaction của riêng bạn và đặt `ownsCompaction: true`.
  </Tab>
  <Tab title="Chế độ ủy quyền">
    Đặt `ownsCompaction: false` và để `compact()` gọi `delegateCompactionToRuntime(...)` từ `openclaw/plugin-sdk/core` nhằm sử dụng hành vi Compaction tích hợp của OpenClaw.
  </Tab>
</Tabs>

Một `compact()` không thực hiện thao tác nào là không an toàn đối với công cụ không sở hữu đang hoạt động vì nó vô hiệu hóa đường dẫn `/compact` thông thường và Compaction khôi phục khi tràn cho vị trí công cụ đó.

## Tham chiếu cấu hình

```json5
{
  plugins: {
    slots: {
      // Chọn công cụ ngữ cảnh đang hoạt động. Mặc định: "legacy".
      // Đặt thành id Plugin để sử dụng công cụ Plugin.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
Vị trí này là độc quyền tại thời điểm chạy - chỉ một công cụ ngữ cảnh đã đăng ký được phân giải cho một lượt chạy hoặc thao tác Compaction nhất định. Các Plugin `kind: "context-engine"` đã bật khác vẫn có thể tải và chạy mã đăng ký của chúng; `plugins.slots.contextEngine` chỉ chọn id công cụ đã đăng ký mà OpenClaw phân giải khi cần một công cụ ngữ cảnh.
</Note>

<Note>
**Gỡ cài đặt Plugin:** khi gỡ cài đặt Plugin hiện đang được chọn làm `plugins.slots.contextEngine`, OpenClaw đặt lại vị trí về giá trị mặc định (`legacy`). Hành vi đặt lại tương tự áp dụng cho `plugins.slots.memory`. Không cần chỉnh sửa cấu hình thủ công.
</Note>

## Mối quan hệ với Compaction và bộ nhớ

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction là một trách nhiệm của công cụ ngữ cảnh. Công cụ cũ ủy quyền cho tính năng tóm tắt tích hợp của OpenClaw. Các công cụ Plugin có thể triển khai bất kỳ chiến lược Compaction nào (bản tóm tắt DAG, truy xuất vector, v.v.).
  </Accordion>
  <Accordion title="Plugin bộ nhớ">
    Các Plugin bộ nhớ (`plugins.slots.memory`) tách biệt với công cụ ngữ cảnh. Plugin bộ nhớ cung cấp chức năng tìm kiếm/truy xuất; công cụ ngữ cảnh kiểm soát nội dung mô hình nhìn thấy. Chúng có thể phối hợp với nhau - một công cụ ngữ cảnh có thể sử dụng dữ liệu Plugin bộ nhớ trong quá trình tập hợp. Các công cụ Plugin muốn sử dụng đường dẫn prompt của bộ nhớ đang hoạt động nên ưu tiên `buildMemorySystemPromptAddition(...)` từ `openclaw/plugin-sdk/core`, công cụ này chuyển đổi các phần prompt của bộ nhớ đang hoạt động thành một `systemPromptAddition` sẵn sàng để thêm vào đầu. Nếu một công cụ cần quyền kiểm soát cấp thấp hơn, nó vẫn có thể lấy các dòng thô từ `openclaw/plugin-sdk/memory-host-core` thông qua `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Cắt tỉa phiên">
    Việc cắt bớt các kết quả công cụ cũ trong bộ nhớ vẫn diễn ra bất kể công cụ ngữ cảnh nào đang hoạt động.
  </Accordion>
</AccordionGroup>

## Mẹo

- Sử dụng `openclaw doctor` để xác minh công cụ của bạn đang được tải đúng cách.
- Khi chuyển đổi công cụ, các phiên hiện có tiếp tục sử dụng lịch sử hiện tại của chúng. Công cụ mới tiếp quản các lượt chạy trong tương lai.
- Lỗi công cụ được ghi nhật ký và công cụ Plugin đã chọn bị cách ly trong tiến trình Gateway hiện tại. OpenClaw dự phòng sang `legacy` cho các lượt của người dùng để phản hồi có thể tiếp tục, nhưng bạn vẫn nên sửa chữa, cập nhật, vô hiệu hóa hoặc gỡ cài đặt Plugin bị lỗi.
- Để phát triển, hãy sử dụng `openclaw plugins install -l ./my-engine` nhằm liên kết một thư mục Plugin cục bộ mà không cần sao chép.

## Liên quan

- [Compaction](/vi/concepts/compaction) - tóm tắt các cuộc trò chuyện dài
- [Ngữ cảnh](/vi/concepts/context) - cách xây dựng ngữ cảnh cho các lượt của tác tử
- [Kiến trúc Plugin](/vi/plugins/architecture) - đăng ký các Plugin công cụ ngữ cảnh
- [Tệp kê khai Plugin](/vi/plugins/manifest) - các trường trong tệp kê khai Plugin
- [Plugin](/vi/tools/plugin) - tổng quan về Plugin
