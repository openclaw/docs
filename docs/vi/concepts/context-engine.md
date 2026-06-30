---
read_when:
    - Bạn muốn hiểu cách OpenClaw lắp ráp ngữ cảnh mô hình
    - Bạn đang chuyển đổi giữa công cụ kế thừa và công cụ Plugin
    - Bạn đang xây dựng một Plugin công cụ ngữ cảnh
sidebarTitle: Context engine
summary: 'Công cụ ngữ cảnh: lắp ráp ngữ cảnh dạng có thể cắm, Compaction và vòng đời subagent'
title: Bộ máy ngữ cảnh
x-i18n:
    generated_at: "2026-06-30T14:10:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0ed65cbb72b14b1a6e8d4d9a394f730a48ada35d77e34c12b3356162b281eec
    source_path: concepts/context-engine.md
    workflow: 16
---

Một **công cụ ngữ cảnh** kiểm soát cách OpenClaw xây dựng ngữ cảnh mô hình cho mỗi lần chạy: bao gồm những thông điệp nào, cách tóm tắt lịch sử cũ hơn, và cách quản lý ngữ cảnh qua các ranh giới subagent.

OpenClaw đi kèm công cụ `legacy` tích hợp sẵn và sử dụng công cụ này theo mặc định - hầu hết người dùng không bao giờ cần thay đổi điều này. Chỉ cài đặt và chọn một công cụ Plugin khi bạn muốn hành vi lắp ráp, Compaction, hoặc nhớ lại xuyên phiên khác.

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

    Khởi động lại Gateway sau khi cài đặt và cấu hình.

  </Step>
  <Step title="Chuyển lại về legacy (tùy chọn)">
    Đặt `contextEngine` thành `"legacy"` (hoặc xóa hẳn khóa này - `"legacy"` là mặc định).
  </Step>
</Steps>

## Cách hoạt động

Mỗi khi OpenClaw chạy một prompt mô hình, công cụ ngữ cảnh tham gia tại bốn điểm vòng đời:

<AccordionGroup>
  <Accordion title="1. Nạp">
    Được gọi khi một thông điệp mới được thêm vào phiên. Công cụ có thể lưu trữ hoặc lập chỉ mục thông điệp trong kho dữ liệu riêng của nó.
  </Accordion>
  <Accordion title="2. Lắp ráp">
    Được gọi trước mỗi lần chạy mô hình. Công cụ trả về một tập thông điệp có thứ tự (và một `systemPromptAddition` tùy chọn) vừa với ngân sách token.
  </Accordion>
  <Accordion title="3. Compact">
    Được gọi khi cửa sổ ngữ cảnh đầy, hoặc khi người dùng chạy `/compact`. Công cụ tóm tắt lịch sử cũ hơn để giải phóng không gian.
  </Accordion>
  <Accordion title="4. Sau lượt">
    Được gọi sau khi một lần chạy hoàn tất. Công cụ có thể lưu trạng thái, kích hoạt Compaction nền, hoặc cập nhật chỉ mục.
  </Accordion>
</AccordionGroup>

Đối với harness Codex không phải ACP được đóng gói kèm, OpenClaw áp dụng cùng vòng đời bằng cách chiếu ngữ cảnh đã lắp ráp vào chỉ dẫn dành cho nhà phát triển của Codex và prompt của lượt hiện tại. Codex vẫn sở hữu lịch sử luồng gốc và bộ nén gốc của nó.

### Vòng đời subagent (tùy chọn)

OpenClaw gọi hai hook vòng đời subagent tùy chọn:

<ParamField path="prepareSubagentSpawn" type="method">
  Chuẩn bị trạng thái ngữ cảnh dùng chung trước khi một lần chạy con bắt đầu. Hook nhận các khóa phiên cha/con, `contextMode` (`isolated` hoặc `fork`), các id/tệp bản ghi có sẵn, và TTL tùy chọn. Nếu nó trả về một handle rollback, OpenClaw gọi handle đó khi spawn thất bại sau khi chuẩn bị thành công. Các spawn subagent gốc yêu cầu `lightContext` và phân giải thành `contextMode="isolated"` cố ý bỏ qua hook này để tiến trình con bắt đầu từ ngữ cảnh bootstrap nhẹ mà không có trạng thái trước spawn do công cụ ngữ cảnh quản lý.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Dọn dẹp khi một phiên subagent hoàn tất hoặc bị quét.
</ParamField>

### Phần bổ sung prompt hệ thống

Phương thức `assemble` có thể trả về một chuỗi `systemPromptAddition`. OpenClaw thêm chuỗi này vào trước prompt hệ thống cho lần chạy. Điều này cho phép các công cụ chèn hướng dẫn nhớ lại động, chỉ dẫn truy xuất, hoặc gợi ý nhận biết ngữ cảnh mà không cần các tệp workspace tĩnh.

## Công cụ legacy

Công cụ `legacy` tích hợp sẵn giữ nguyên hành vi ban đầu của OpenClaw:

- **Nạp**: không thao tác (trình quản lý phiên xử lý trực tiếp việc lưu thông điệp).
- **Lắp ráp**: chuyển tiếp (pipeline sanitize → validate → limit hiện có trong runtime xử lý lắp ráp ngữ cảnh).
- **Compact**: ủy quyền cho Compaction tóm tắt tích hợp sẵn, tạo một bản tóm tắt duy nhất của các thông điệp cũ hơn và giữ nguyên các thông điệp gần đây.
- **Sau lượt**: không thao tác.

Công cụ legacy không đăng ký công cụ hoặc cung cấp `systemPromptAddition`.

Khi không đặt `plugins.slots.contextEngine` (hoặc đặt thành `"legacy"`), công cụ này được sử dụng tự động.

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
tùy chọn để Plugin có thể khởi tạo trạng thái theo agent hoặc theo workspace trước khi
hook vòng đời đầu tiên chạy.

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

Các thành viên bắt buộc:

| Thành viên         | Loại       | Mục đích                                                 |
| ------------------ | ---------- | -------------------------------------------------------- |
| `info`             | Thuộc tính | Id công cụ, tên, phiên bản, và liệu nó sở hữu Compaction |
| `ingest(params)`   | Phương thức | Lưu một thông điệp duy nhất                              |
| `assemble(params)` | Phương thức | Xây dựng ngữ cảnh cho một lần chạy mô hình (trả về `AssembleResult`) |
| `compact(params)`  | Phương thức | Tóm tắt/giảm ngữ cảnh                                    |

`assemble` trả về một `AssembleResult` với:

<ParamField path="messages" type="Message[]" required>
  Các thông điệp có thứ tự để gửi đến mô hình.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Ước tính của công cụ về tổng số token trong ngữ cảnh đã lắp ráp. OpenClaw sử dụng giá trị này cho các quyết định ngưỡng Compaction và báo cáo chẩn đoán.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Được thêm vào trước prompt hệ thống.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Kiểm soát ước tính token nào mà runner sử dụng cho các bước kiểm tra trước
  tràn chủ động. Mặc định là `"assembled"`, nghĩa là chỉ kiểm tra ước tính của
  prompt đã lắp ráp đối với các công cụ không sở hữu Compaction.
  Các công cụ đặt `ownsCompaction: true` tự quản lý việc chấp nhận prompt,
  nên OpenClaw mặc định bỏ qua bước kiểm tra trước prompt chung. Chỉ đặt
  `"preassembly_may_overflow"` khi khung nhìn đã lắp ráp của bạn có thể che giấu
  rủi ro tràn trong bản ghi bên dưới; khi đó runner giữ bước kiểm tra trước
  chung hoạt động và lấy giá trị lớn nhất giữa ước tính đã lắp ráp và ước tính
  lịch sử phiên trước lắp ráp (chưa phân cửa sổ) khi quyết định có Compact
  chủ động hay không. Dù bằng cách nào, các thông điệp bạn trả về vẫn là những gì
  mô hình nhìn thấy - `promptAuthority` chỉ ảnh hưởng đến bước kiểm tra trước.
</ParamField>

`compact` trả về một `CompactResult`. Khi Compaction xoay vòng bản ghi đang hoạt động,
`result.sessionId` và `result.sessionFile` xác định phiên kế nhiệm
mà lần thử lại hoặc lượt tiếp theo phải sử dụng.

Các thành viên tùy chọn:

| Thành viên                     | Loại       | Mục đích                                                                                                        |
| ------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Phương thức | Khởi tạo trạng thái công cụ cho một phiên. Được gọi một lần khi công cụ lần đầu thấy một phiên (ví dụ: nhập lịch sử). |
| `ingestBatch(params)`          | Phương thức | Nạp một lượt đã hoàn tất theo lô. Được gọi sau khi một lần chạy hoàn tất, với tất cả thông điệp từ lượt đó cùng lúc. |
| `afterTurn(params)`            | Phương thức | Công việc vòng đời sau chạy (lưu trạng thái, kích hoạt Compaction nền).                                         |
| `prepareSubagentSpawn(params)` | Phương thức | Thiết lập trạng thái dùng chung cho một phiên con trước khi nó bắt đầu.                                         |
| `onSubagentEnded(params)`      | Phương thức | Dọn dẹp sau khi một subagent kết thúc.                                                                          |
| `dispose()`                    | Phương thức | Giải phóng tài nguyên. Được gọi trong khi tắt Gateway hoặc tải lại Plugin - không gọi theo từng phiên.          |

### Cài đặt runtime

Các hook vòng đời chạy bên trong OpenClaw nhận một đối tượng
`runtimeSettings` tùy chọn. Đây là một bề mặt API producer/consumer nội bộ,
chỉ đọc, có phiên bản: OpenClaw tạo nó cho công cụ ngữ cảnh đã chọn,
và công cụ ngữ cảnh sử dụng nó bên trong các hook vòng đời. Nó không được
hiển thị trực tiếp cho người dùng và không tạo một bề mặt báo cáo chuyên biệt.

- `schemaVersion`: hiện là `1`
- `runtime`: host OpenClaw, chế độ runtime (`normal`, `fallback`, hoặc
  `degraded`), và các id harness/runtime tùy chọn
- `contextEngineSelection`: id công cụ ngữ cảnh đã chọn và nguồn lựa chọn
- `executionHost`: id host và nhãn cho bề mặt gọi hook
- `model`: mô hình được yêu cầu, mô hình đã phân giải, provider, và họ mô hình tùy chọn
- `limits`: ngân sách token prompt và số token đầu ra tối đa khi biết
- `diagnostics`: các mã lý do fallback đóng và degraded khi biết

Các trường có thể không biết được biểu diễn là `null`; các trường phân biệt như
chế độ runtime và nguồn lựa chọn vẫn không thể null. Các công cụ cũ hơn vẫn
tương thích: nếu một công cụ legacy nghiêm ngặt từ chối `runtimeSettings` như một
thuộc tính không xác định, OpenClaw thử lại lệnh gọi vòng đời mà không có nó thay vì cách ly
công cụ.

### Yêu cầu host

Công cụ ngữ cảnh có thể khai báo yêu cầu năng lực host trên `info.hostRequirements`.
OpenClaw kiểm tra các yêu cầu này trước khi bắt đầu thao tác và fail closed
với lỗi mô tả rõ ràng khi runtime đã chọn không thể đáp ứng chúng.

Đối với các lần chạy agent, khai báo `assemble-before-prompt` khi công cụ phải kiểm soát
prompt mô hình thực tế thông qua `assemble()`:

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

Các lần chạy agent Codex gốc và OpenClaw nhúng đáp ứng `assemble-before-prompt`.
Các backend CLI chung thì không, vì vậy các công cụ yêu cầu năng lực này bị từ chối trước khi
tiến trình CLI bắt đầu.

### Cách ly lỗi

OpenClaw cô lập công cụ Plugin đã chọn khỏi đường phản hồi lõi. Nếu một
công cụ không kế thừa bị thiếu, không vượt qua xác thực hợp đồng, ném lỗi trong
khi tạo factory, hoặc ném lỗi từ một phương thức vòng đời, OpenClaw sẽ cách ly
công cụ đó cho tiến trình Gateway hiện tại và hạ cấp công việc công cụ ngữ cảnh
xuống công cụ `legacy` tích hợp sẵn. Lỗi được ghi nhật ký kèm thao tác thất bại
để người vận hành có thể sửa, cập nhật, hoặc vô hiệu hóa Plugin mà không làm
tác tử im lặng.

Các lỗi yêu cầu host thì khác: khi một công cụ khai báo rằng runtime thiếu một
năng lực bắt buộc, OpenClaw sẽ đóng thất bại trước khi bắt đầu lượt chạy. Điều
đó bảo vệ các công cụ có thể làm hỏng trạng thái nếu chúng chạy trong một host
không được hỗ trợ.

### ownsCompaction

`ownsCompaction` kiểm soát việc auto-compaction trong-lần-thử tích hợp sẵn của runtime OpenClaw có tiếp tục được bật cho lượt chạy hay không:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Công cụ sở hữu hành vi Compaction. OpenClaw tắt auto-compaction tích hợp sẵn của runtime OpenClaw và bước kiểm tra trước tràn pre-prompt chung cho lượt chạy đó, và triển khai `compact()` của công cụ chịu trách nhiệm cho `/compact`, compaction khôi phục khi provider bị tràn, và mọi compaction chủ động mà nó muốn thực hiện trong `afterTurn()`. OpenClaw vẫn chạy cơ chế bảo vệ tràn pre-prompt khi công cụ trả về `promptAuthority: "preassembly_may_overflow"` từ `assemble()`.
  </Accordion>
  <Accordion title="ownsCompaction: false hoặc chưa đặt">
    Auto-compaction tích hợp sẵn của runtime OpenClaw vẫn có thể chạy trong khi thực thi prompt, nhưng phương thức `compact()` của công cụ đang hoạt động vẫn được gọi cho `/compact` và khôi phục khi tràn.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **không** có nghĩa là OpenClaw tự động quay về đường compaction của công cụ legacy.
</Warning>

Điều đó có nghĩa là có hai mẫu Plugin hợp lệ:

<Tabs>
  <Tab title="Chế độ sở hữu">
    Triển khai thuật toán compaction riêng của bạn và đặt `ownsCompaction: true`.
  </Tab>
  <Tab title="Chế độ ủy quyền">
    Đặt `ownsCompaction: false` và để `compact()` gọi `delegateCompactionToRuntime(...)` từ `openclaw/plugin-sdk/core` nhằm dùng hành vi compaction tích hợp sẵn của OpenClaw.
  </Tab>
</Tabs>

Một `compact()` không làm gì là không an toàn cho một công cụ không sở hữu đang hoạt động vì nó vô hiệu hóa đường `/compact` và compaction khôi phục khi tràn bình thường cho slot công cụ đó.

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
Slot này là độc quyền trong thời gian chạy - chỉ một công cụ ngữ cảnh đã đăng ký được phân giải cho một lượt chạy hoặc thao tác compaction nhất định. Các Plugin `kind: "context-engine"` khác đã bật vẫn có thể tải và chạy mã đăng ký của chúng; `plugins.slots.contextEngine` chỉ chọn id công cụ đã đăng ký mà OpenClaw phân giải khi cần một công cụ ngữ cảnh.
</Note>

<Note>
**Gỡ cài đặt Plugin:** khi bạn gỡ cài đặt Plugin hiện được chọn làm `plugins.slots.contextEngine`, OpenClaw đặt lại slot về mặc định (`legacy`). Hành vi đặt lại tương tự áp dụng cho `plugins.slots.memory`. Không cần chỉnh sửa cấu hình thủ công.
</Note>

## Quan hệ với compaction và bộ nhớ

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction là một trách nhiệm của công cụ ngữ cảnh. Công cụ legacy ủy quyền cho cơ chế tóm tắt tích hợp sẵn của OpenClaw. Công cụ Plugin có thể triển khai bất kỳ chiến lược compaction nào (tóm tắt DAG, truy xuất vector, v.v.).
  </Accordion>
  <Accordion title="Plugin bộ nhớ">
    Plugin bộ nhớ (`plugins.slots.memory`) tách biệt với công cụ ngữ cảnh. Plugin bộ nhớ cung cấp tìm kiếm/truy xuất; công cụ ngữ cảnh kiểm soát những gì mô hình nhìn thấy. Chúng có thể hoạt động cùng nhau - một công cụ ngữ cảnh có thể dùng dữ liệu Plugin bộ nhớ trong khi lắp ráp. Các công cụ Plugin muốn đường prompt bộ nhớ đang hoạt động nên ưu tiên `buildMemorySystemPromptAddition(...)` từ `openclaw/plugin-sdk/core`, hàm này chuyển đổi các phần prompt bộ nhớ đang hoạt động thành một `systemPromptAddition` sẵn sàng thêm vào đầu. Nếu một công cụ cần kiểm soát cấp thấp hơn, nó vẫn có thể lấy các dòng thô từ `openclaw/plugin-sdk/memory-host-core` qua `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Cắt tỉa phiên">
    Việc cắt bỏ kết quả công cụ cũ trong bộ nhớ vẫn chạy bất kể công cụ ngữ cảnh nào đang hoạt động.
  </Accordion>
</AccordionGroup>

## Mẹo

- Dùng `openclaw doctor` để xác minh công cụ của bạn đang tải đúng cách.
- Nếu chuyển đổi công cụ, các phiên hiện có tiếp tục với lịch sử hiện tại của chúng. Công cụ mới tiếp quản các lượt chạy trong tương lai.
- Lỗi công cụ được ghi nhật ký và công cụ Plugin đã chọn bị cách ly cho tiến trình Gateway hiện tại. OpenClaw quay về `legacy` cho các lượt của người dùng để phản hồi có thể tiếp tục, nhưng bạn vẫn nên sửa, cập nhật, vô hiệu hóa, hoặc gỡ cài đặt Plugin bị hỏng.
- Khi phát triển, dùng `openclaw plugins install -l ./my-engine` để liên kết một thư mục Plugin cục bộ mà không sao chép.

## Liên quan

- [Compaction](/vi/concepts/compaction) - tóm tắt các cuộc trò chuyện dài
- [Ngữ cảnh](/vi/concepts/context) - cách ngữ cảnh được xây dựng cho lượt của tác tử
- [Kiến trúc Plugin](/vi/plugins/architecture) - đăng ký Plugin công cụ ngữ cảnh
- [Manifest Plugin](/vi/plugins/manifest) - các trường manifest của Plugin
- [Plugins](/vi/tools/plugin) - tổng quan về Plugin
