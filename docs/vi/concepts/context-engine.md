---
read_when:
    - Bạn muốn hiểu cách OpenClaw tập hợp ngữ cảnh cho mô hình
    - Bạn đang chuyển đổi giữa công cụ cũ và công cụ Plugin
    - Bạn đang xây dựng một plugin công cụ ngữ cảnh
sidebarTitle: Context engine
summary: 'Công cụ ngữ cảnh: lắp ráp ngữ cảnh có thể thay thế, Compaction và vòng đời tác tử con'
title: Công cụ ngữ cảnh
x-i18n:
    generated_at: "2026-07-19T05:41:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59edab25b7a57458db88a907759950d31e4adc4a42f6886695a425312ee4e29b
    source_path: concepts/context-engine.md
    workflow: 16
---

Một **công cụ ngữ cảnh** kiểm soát cách OpenClaw xây dựng ngữ cảnh mô hình cho mỗi lần chạy: những thông báo nào được đưa vào, cách tóm tắt lịch sử cũ hơn và cách quản lý ngữ cảnh qua các ranh giới subagent.

OpenClaw đi kèm công cụ `legacy` tích hợp sẵn và sử dụng công cụ này theo mặc định. Chỉ cài đặt và chọn công cụ Plugin khi bạn muốn có hành vi tập hợp, Compaction hoặc truy hồi liên phiên khác.

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
            // Cấu hình dành riêng cho Plugin được đặt tại đây (xem tài liệu của Plugin)
          },
        },
      },
    }
    ```

    Khởi động lại Gateway sau khi cài đặt và cấu hình.

  </Step>
  <Step title="Chuyển lại về chế độ cũ (không bắt buộc)">
    Đặt `contextEngine` thành `"legacy"` (hoặc xóa hoàn toàn khóa này - `"legacy"` là giá trị mặc định).
  </Step>
</Steps>

## Cách hoạt động

Mỗi khi OpenClaw chạy một prompt mô hình, công cụ ngữ cảnh tham gia tại bốn thời điểm trong vòng đời:

<AccordionGroup>
  <Accordion title="1. Tiếp nhận">
    Được gọi khi một thông báo mới được thêm vào phiên. Công cụ có thể lưu trữ hoặc lập chỉ mục thông báo trong kho dữ liệu riêng.
  </Accordion>
  <Accordion title="2. Tập hợp">
    Được gọi trước mỗi lần chạy mô hình. Công cụ trả về một tập hợp thông báo có thứ tự (và một `systemPromptAddition` không bắt buộc) phù hợp với ngân sách token.
  </Accordion>
  <Accordion title="3. Compaction">
    Được gọi khi cửa sổ ngữ cảnh đầy hoặc khi người dùng chạy `/compact`. Công cụ tóm tắt lịch sử cũ hơn để giải phóng dung lượng.
  </Accordion>
  <Accordion title="4. Sau lượt">
    Được gọi sau khi một lần chạy hoàn tất. Công cụ có thể lưu trạng thái bền vững, kích hoạt Compaction nền hoặc cập nhật các chỉ mục.
  </Accordion>
</AccordionGroup>

Các công cụ cũng có thể triển khai phương thức `maintain()` không bắt buộc để bảo trì bản ghi (ghi lại an toàn qua `runtimeContext.rewriteTranscriptEntries()`) sau khi khởi tạo, sau một lượt thành công hoặc sau Compaction. Đặt `info.turnMaintenanceMode: "background"` để chạy phương thức này dưới dạng công việc trì hoãn thay vì chặn phản hồi.

Đối với bộ khung Codex không dùng ACP đi kèm, OpenClaw áp dụng cùng vòng đời bằng cách chiếu ngữ cảnh đã tập hợp vào các chỉ dẫn dành cho nhà phát triển của Codex và prompt của lượt hiện tại. Codex vẫn quản lý lịch sử luồng gốc và trình Compaction gốc của riêng mình.

### Vòng đời subagent (không bắt buộc)

OpenClaw gọi hai hook vòng đời subagent không bắt buộc:

<ParamField path="prepareSubagentSpawn" type="method">
  Chuẩn bị trạng thái ngữ cảnh dùng chung trước khi một lượt chạy con bắt đầu. Hook nhận các khóa phiên cha/con, `contextMode` (`isolated` hoặc `fork`), các id/tệp bản ghi có sẵn và TTL không bắt buộc. Nếu hook trả về một handle hoàn tác, OpenClaw sẽ gọi handle đó khi việc khởi tạo subagent thất bại sau khi chuẩn bị thành công. Các lần khởi tạo subagent gốc yêu cầu `lightContext` và phân giải thành `contextMode="isolated"` sẽ chủ ý bỏ qua hook này để tiến trình con bắt đầu từ ngữ cảnh khởi tạo nhẹ mà không có trạng thái trước khi khởi tạo do công cụ ngữ cảnh quản lý.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Dọn dẹp khi một phiên subagent hoàn tất hoặc bị quét.
</ParamField>

### Phần bổ sung cho prompt hệ thống

Phương thức `assemble` có thể trả về một chuỗi `systemPromptAddition`. OpenClaw thêm chuỗi này vào đầu prompt hệ thống cho lần chạy. Điều này cho phép các công cụ chèn hướng dẫn truy hồi động, chỉ dẫn truy xuất hoặc gợi ý theo ngữ cảnh mà không yêu cầu các tệp không gian làm việc tĩnh.

## Công cụ cũ

Công cụ `legacy` tích hợp sẵn duy trì hành vi ban đầu của OpenClaw:

- **Tiếp nhận**: không làm gì (trình quản lý phiên trực tiếp xử lý việc lưu trữ bền vững thông báo).
- **Tập hợp**: chuyển tiếp nguyên trạng (pipeline làm sạch → xác thực → giới hạn hiện có trong runtime xử lý việc tập hợp ngữ cảnh).
- **Compaction**: ủy quyền cho Compaction tóm tắt tích hợp sẵn, tạo một bản tóm tắt duy nhất cho các thông báo cũ hơn và giữ nguyên các thông báo gần đây.
- **Sau lượt**: không làm gì.

Công cụ cũ không đăng ký công cụ hoặc cung cấp `systemPromptAddition`.

Khi không đặt `plugins.slots.contextEngine` (hoặc đặt thành `"legacy"`), công cụ này được sử dụng tự động.

## Công cụ Plugin

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
      // Lưu thông báo trong kho dữ liệu của bạn
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
      // Trả về các thông báo phù hợp với ngân sách
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

Factory `ctx` bao gồm các giá trị `config`, `agentDir` và `workspaceDir`
không bắt buộc để các Plugin có thể khởi tạo trạng thái theo agent hoặc theo không gian làm việc trước
lần gọi vòng đời đầu tiên. Trước một lần gọi `assemble()` không phải chế độ cũ, host hoàn tất
việc chuẩn bị prompt bộ nhớ bất đồng bộ đã đăng ký. Helper đồng bộ
`buildMemorySystemPromptAddition(...)` đọc ảnh chụp nhanh bất biến của lần chạy đó;
truyền nguyên vẹn công cụ, trích dẫn, agent và ngữ cảnh phiên được cung cấp.

Sau đó, bật công cụ trong cấu hình:

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
| `info`             | Thuộc tính | Id, tên, phiên bản của công cụ và công cụ có sở hữu Compaction hay không |
| `ingest(params)`   | Phương thức   | Lưu trữ một thông báo                                   |
| `assemble(params)` | Phương thức   | Xây dựng ngữ cảnh cho một lần chạy mô hình (trả về `AssembleResult`) |
| `compact(params)`  | Phương thức   | Tóm tắt/giảm ngữ cảnh                                 |

`assemble` trả về một `AssembleResult` với:

<ParamField path="messages" type="Message[]" required>
  Các thông báo có thứ tự để gửi đến mô hình.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Ước tính của công cụ về tổng số token trong ngữ cảnh đã tập hợp. OpenClaw sử dụng giá trị này cho các quyết định về ngưỡng Compaction và báo cáo chẩn đoán.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Được thêm vào đầu prompt hệ thống.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Kiểm soát ước tính token mà trình chạy sử dụng cho các bước
  kiểm tra trước tình trạng tràn chủ động. Mặc định là `"assembled"`, nghĩa là chỉ ước tính của
  prompt đã tập hợp được kiểm tra đối với các công cụ không sở hữu Compaction.
  Các công cụ đặt `ownsCompaction: true` tự quản lý việc tiếp nhận prompt,
  vì vậy OpenClaw mặc định bỏ qua bước kiểm tra trước prompt chung. Chỉ đặt
  `"preassembly_may_overflow"` khi chế độ xem đã tập hợp của bạn có thể che giấu nguy cơ
  tràn trong bản ghi cơ sở; khi đó, trình chạy tiếp tục bật bước kiểm tra
  chung và lấy giá trị lớn nhất giữa ước tính đã tập hợp và ước tính
  lịch sử phiên trước khi tập hợp (không giới hạn cửa sổ) khi quyết định có
  chủ động thực hiện Compaction hay không. Dù theo cách nào, các thông báo bạn trả về vẫn là nội dung
  mà mô hình nhìn thấy - `promptAuthority` chỉ ảnh hưởng đến bước kiểm tra trước.
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  Vòng đời chiếu không bắt buộc dành cho các host có luồng backend bền vững (ví dụ: app-server Codex). `mode: "thread_bootstrap"` cùng một `epoch` ổn định yêu cầu host chèn ngữ cảnh đã tập hợp một lần cho mỗi epoch và tái sử dụng luồng backend cho đến khi epoch thay đổi, thay vì chiếu lại ở mỗi lượt. Bỏ qua trường này để dùng chế độ chiếu thông thường theo từng lượt.
</ParamField>

`compact` trả về một `CompactResult`. Khi Compaction thay đổi danh tính phiên đang hoạt động,
`result.sessionTarget` (một `ContextEngineSessionTarget` có kiểu, mang theo
danh tính phiên và phạm vi kho lưu trữ) xác định phiên kế nhiệm mà
lần thử lại hoặc lượt tiếp theo phải sử dụng; `result.sessionId` phản ánh id kế nhiệm.

Các thành viên không bắt buộc:

| Thành viên                         | Loại   | Mục đích                                                                                                                                      |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Phương thức | Khởi tạo trạng thái công cụ cho một phiên. Được gọi một lần khi công cụ nhìn thấy phiên lần đầu tiên (ví dụ: nhập lịch sử).                              |
| `maintain(params)`             | Phương thức | Bảo trì bản ghi sau khi khởi tạo, sau một lượt thành công hoặc sau Compaction. Sử dụng `runtimeContext.rewriteTranscriptEntries()` để ghi lại an toàn. |
| `ingestBatch(params)`          | Phương thức | Tiếp nhận một lượt đã hoàn tất dưới dạng một lô. Được gọi sau khi một lần chạy hoàn tất, với tất cả thông báo của lượt đó cùng lúc.                                  |
| `afterTurn(params)`            | Phương thức | Công việc vòng đời sau lần chạy (lưu trạng thái bền vững, kích hoạt Compaction nền).                                                                      |
| `prepareSubagentSpawn(params)` | Phương thức | Thiết lập trạng thái dùng chung cho một phiên con trước khi phiên đó bắt đầu.                                                                                    |
| `onSubagentEnded(params)`      | Phương thức | Dọn dẹp sau khi một subagent kết thúc.                                                                                                              |
| `dispose()`                    | Phương thức | Giải phóng tài nguyên. Được gọi khi Gateway tắt hoặc Plugin tải lại - không phải theo từng phiên.                                                        |

### Cài đặt runtime

Các hook vòng đời chạy bên trong OpenClaw nhận một đối tượng
`runtimeSettings` không bắt buộc. Đây là bề mặt API nhà sản xuất/người tiêu dùng
nội bộ, chỉ đọc và có phiên bản: OpenClaw tạo đối tượng này cho công cụ ngữ cảnh
đã chọn, còn công cụ ngữ cảnh sử dụng đối tượng đó bên trong các hook vòng đời. Đối tượng này không
được hiển thị trực tiếp cho người dùng và không tạo một bề mặt báo cáo riêng.

- `schemaVersion`: hiện tại là `1`
- `runtime`: máy chủ OpenClaw, chế độ runtime (`normal`, `fallback`, hoặc
  `degraded`) và các mã định danh harness/runtime tùy chọn
- `contextEngineSelection`: mã định danh context engine đã chọn và nguồn lựa chọn
- `executionHost`: mã định danh và nhãn máy chủ cho bề mặt gọi hook
- `model`: mô hình được yêu cầu, mô hình đã phân giải, nhà cung cấp và họ mô hình tùy chọn
- `limits`: ngân sách token của prompt và số token đầu ra tối đa khi biết
- `diagnostics`: mã lý do cho việc đóng phương án dự phòng và suy giảm khi biết

Các trường có thể không xác định được biểu diễn bằng `null`; các trường phân biệt
như chế độ runtime và nguồn lựa chọn vẫn không cho phép giá trị null. Các engine cũ vẫn
tương thích: nếu một engine cũ nghiêm ngặt từ chối `runtimeSettings` vì đây là một thuộc tính
không xác định, OpenClaw sẽ thử lại lệnh gọi vòng đời mà không có thuộc tính đó thay vì cách ly
engine.

### Yêu cầu đối với máy chủ

Context engine có thể khai báo các yêu cầu về khả năng của máy chủ trên `info.hostRequirements`.
OpenClaw kiểm tra các yêu cầu này trước khi bắt đầu thao tác và từ chối thực thi
với lỗi mô tả rõ ràng khi runtime đã chọn không thể đáp ứng chúng.

Đối với các lượt chạy agent, hãy khai báo `assemble-before-prompt` khi engine phải kiểm soát
prompt mô hình thực tế thông qua `assemble()`:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Hãy dùng runtime Codex gốc hoặc runtime nhúng của OpenClaw, hoặc chọn context engine cũ.",
    },
  },
}
```

Các lượt chạy agent bằng Codex gốc và OpenClaw nhúng đáp ứng `assemble-before-prompt`.
Các backend CLI chung thì không, vì vậy những engine yêu cầu khả năng này sẽ bị từ chối trước khi
tiến trình CLI khởi động.

### Cách ly lỗi

OpenClaw cách ly plugin engine đã chọn khỏi luồng phản hồi cốt lõi. Nếu một
engine không phải loại cũ bị thiếu, không vượt qua bước xác thực hợp đồng, phát sinh ngoại lệ khi
tạo factory hoặc từ một phương thức vòng đời, OpenClaw sẽ cách ly engine đó
trong tiến trình Gateway hiện tại và hạ cấp công việc của context engine xuống
engine `legacy` tích hợp sẵn. Lỗi được ghi nhật ký cùng thao tác thất bại để
người vận hành có thể sửa chữa, cập nhật hoặc vô hiệu hóa plugin mà không khiến agent
ngừng phản hồi.

Lỗi yêu cầu máy chủ thì khác: khi một engine khai báo rằng runtime
thiếu khả năng bắt buộc, OpenClaw sẽ từ chối thực thi trước khi bắt đầu lượt chạy. Điều đó
bảo vệ các engine có thể làm hỏng trạng thái nếu chạy trên máy chủ không được hỗ trợ.

### ownsCompaction

`ownsCompaction` kiểm soát việc tính năng tự động Compaction tích hợp trong lần thử của runtime OpenClaw có tiếp tục được bật cho lượt chạy hay không:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Engine sở hữu hành vi Compaction. OpenClaw vô hiệu hóa tính năng tự động Compaction tích hợp của runtime OpenClaw và bước kiểm tra sơ bộ tràn trước prompt chung cho lượt chạy đó; phần triển khai `compact()` của engine chịu trách nhiệm về `/compact`, Compaction để khôi phục khi tràn từ nhà cung cấp và mọi Compaction chủ động mà engine muốn thực hiện trong `afterTurn()`. OpenClaw vẫn chạy biện pháp bảo vệ chống tràn trước prompt khi engine trả về `promptAuthority: "preassembly_may_overflow"` từ `assemble()`.
  </Accordion>
  <Accordion title="ownsCompaction: false hoặc chưa đặt">
    Tính năng tự động Compaction tích hợp của runtime OpenClaw vẫn có thể chạy trong quá trình thực thi prompt, nhưng phương thức `compact()` của engine đang hoạt động vẫn được gọi cho `/compact` và quá trình khôi phục khi tràn.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **không** có nghĩa là OpenClaw tự động chuyển sang đường dẫn Compaction của engine cũ.
</Warning>

Điều đó có nghĩa là có hai mẫu plugin hợp lệ:

<Tabs>
  <Tab title="Chế độ sở hữu">
    Triển khai thuật toán Compaction riêng và đặt `ownsCompaction: true`.
  </Tab>
  <Tab title="Chế độ ủy quyền">
    Đặt `ownsCompaction: false` và để `compact()` gọi `delegateCompactionToRuntime(...)` từ `openclaw/plugin-sdk/core` nhằm sử dụng hành vi Compaction tích hợp của OpenClaw.
  </Tab>
</Tabs>

Một `compact()` không thực hiện thao tác nào là không an toàn đối với engine không sở hữu đang hoạt động vì nó vô hiệu hóa đường dẫn Compaction thông thường `/compact` và đường dẫn Compaction để khôi phục khi tràn cho vị trí engine đó.

## Tham chiếu cấu hình

```json5
{
  plugins: {
    slots: {
      // Chọn context engine đang hoạt động. Mặc định: "legacy".
      // Đặt thành mã định danh plugin để dùng plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
Vị trí này là độc quyền tại thời điểm chạy - chỉ một context engine đã đăng ký được phân giải cho một lượt chạy hoặc thao tác Compaction nhất định. Các plugin `kind: "context-engine"` đã bật khác vẫn có thể tải và chạy mã đăng ký của chúng; `plugins.slots.contextEngine` chỉ chọn mã định danh engine đã đăng ký mà OpenClaw phân giải khi cần context engine.
</Note>

<Note>
**Gỡ cài đặt plugin:** khi gỡ cài đặt plugin hiện đang được chọn làm `plugins.slots.contextEngine`, OpenClaw đặt lại vị trí về giá trị mặc định (`legacy`). Hành vi đặt lại tương tự áp dụng cho `plugins.slots.memory`. Không cần chỉnh sửa cấu hình thủ công.
</Note>

## Mối quan hệ với Compaction và bộ nhớ

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction là một trách nhiệm của context engine. Engine cũ ủy quyền cho tính năng tóm tắt tích hợp của OpenClaw. Plugin engine có thể triển khai bất kỳ chiến lược Compaction nào (bản tóm tắt DAG, truy xuất vectơ, v.v.).
  </Accordion>
  <Accordion title="Plugin bộ nhớ">
    Plugin bộ nhớ (`plugins.slots.memory`) tách biệt với context engine. Plugin bộ nhớ cung cấp chức năng tìm kiếm/truy xuất; context engine kiểm soát nội dung mà mô hình nhìn thấy. Chúng có thể phối hợp với nhau - context engine có thể sử dụng dữ liệu của plugin bộ nhớ trong quá trình tập hợp. Plugin engine muốn dùng đường dẫn prompt bộ nhớ đang hoạt động nên ưu tiên `buildMemorySystemPromptAddition(...)` từ `openclaw/plugin-sdk/core`, thao tác này chuyển đổi các phần prompt bộ nhớ đang hoạt động thành một `systemPromptAddition` sẵn sàng để thêm vào đầu. Nếu engine cần quyền kiểm soát ở mức thấp hơn, nó vẫn có thể lấy các dòng thô từ `openclaw/plugin-sdk/memory-host-core` thông qua `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Cắt gọn phiên">
    Việc cắt gọn các kết quả công cụ cũ trong bộ nhớ vẫn chạy bất kể context engine nào đang hoạt động.
  </Accordion>
</AccordionGroup>

## Mẹo

- Dùng `openclaw doctor` để xác minh engine đang được tải đúng cách.
- Nếu chuyển đổi engine, các phiên hiện có vẫn tiếp tục với lịch sử hiện tại. Engine mới sẽ tiếp quản các lượt chạy trong tương lai.
- Lỗi engine được ghi nhật ký và plugin engine đã chọn bị cách ly trong tiến trình Gateway hiện tại. OpenClaw chuyển sang `legacy` cho các lượt tương tác của người dùng để có thể tiếp tục phản hồi, nhưng vẫn cần sửa chữa, cập nhật, vô hiệu hóa hoặc gỡ cài đặt plugin bị lỗi.
- Để phát triển, hãy dùng `openclaw plugins install -l ./my-engine` nhằm liên kết một thư mục plugin cục bộ mà không cần sao chép.

## Liên quan

- [Compaction](/vi/concepts/compaction) - tóm tắt các cuộc hội thoại dài
- [Ngữ cảnh](/vi/concepts/context) - cách xây dựng ngữ cảnh cho các lượt agent
- [Kiến trúc Plugin](/vi/plugins/architecture) - đăng ký plugin context engine
- [Manifest Plugin](/vi/plugins/manifest) - các trường manifest của plugin
- [Plugin](/vi/tools/plugin) - tổng quan về plugin
