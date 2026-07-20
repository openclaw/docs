---
read_when:
    - Bạn muốn một tập lệnh Code Mode phân phối công việc cho nhiều tác nhân.
    - Bạn cần kết quả có cấu trúc từ các tác vụ con, các cổng quyết định hoặc pipeline hoàn thành đầu tiên
    - Bạn đang bật hoặc tinh chỉnh các giới hạn `tools.swarm`
    - Bạn muốn quan sát các tiến trình con của collector trong bảng điều khiển phiên làm việc
sidebarTitle: Swarm
summary: Điều phối các tác tử con chạy đồng thời từ các tập lệnh Chế độ mã với kết quả có cấu trúc, mức phân nhánh được giới hạn và tiến độ theo thời gian thực
title: Bầy đàn
x-i18n:
    generated_at: "2026-07-20T14:42:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 00881c10c314eca667dd826584bfc83a4d848d8995e68905e4e53782d61c59cd
    source_path: tools/swarm.md
    workflow: 16
---

Swarm là một cách thử nghiệm, cần chủ động bật để điều phối nhiều sub-agent từ một
script [Code Mode](/vi/tools/code-mode). Sử dụng luồng điều khiển JavaScript hoặc TypeScript
thông thường như `Promise.all`, `while` và `if` để phân tán công việc, thu thập
kết quả và đưa ra quyết định.

Không có DSL đồ thị và không có định dạng quy trình làm việc riêng. Chương trình chính là
phần điều phối. Swarm bổ sung các tiến trình con thu thập có thể chờ, kết quả có cấu trúc,
mức đồng thời có giới hạn và báo cáo tiến độ cho chương trình đó.

## Bật Swarm

Cách được khuyến nghị là **Settings → Labs → Swarm** trong Control UI. Nút
bật/tắt có hiệu lực ngay lập tức và ghi `tools.swarm.enabled` vào
cấu hình của bạn.

Bạn cũng có thể bật trực tiếp Swarm trong `openclaw.json`:

```json5
{
  tools: {
    swarm: {
      enabled: true,
      maxConcurrent: 8,
      maxChildrenPerGroup: 50,
      maxTotalPerGroup: 200,
      waitTimeoutSecondsMax: 600,
      defaultAgentId: "",
    },
  },
}
```

Dạng viết tắt Boolean bật hoặc tắt tính năng trong khi tất cả giá trị khác giữ
giá trị mặc định:

```json5
{
  tools: {
    swarm: true,
  },
}
```

| Trường                  | Mặc định | Mô tả                                                                                                                          |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`               | `false` | Cung cấp các tùy chọn khởi tạo ở chế độ thu thập, `agents_wait` và API khách `agents.*` của Code Mode.                          |
| `maxConcurrent`         | `8`     | Số tiến trình con thu thập tối đa chạy đồng thời trong một nhóm swarm. Các tiến trình con bổ sung đã được chấp nhận sẽ xếp hàng theo thứ tự FIFO. |
| `maxChildrenPerGroup`   | `50`    | Số tiến trình con thu thập đang hoạt động tối đa trong một nhóm.                                                               |
| `maxTotalPerGroup`      | `200`   | Tổng số tiến trình con thu thập tối đa mà một nhóm có thể khởi tạo trong toàn bộ vòng đời. Đây là cơ chế chặn cuối cùng đối với việc khởi tạo mất kiểm soát. |
| `waitTimeoutSecondsMax` | `600`   | Thời gian chờ tối đa được một lần gọi `agents_wait` chấp nhận. Giá trị mặc định của lần gọi là 30 giây.                        |
| `defaultAgentId`        | `""`    | Agent đích được dùng khi lần khởi tạo bỏ qua `agentId`. Giá trị trống sử dụng agent gửi yêu cầu. Các danh sách cho phép sub-agent hiện có vẫn được áp dụng. |

Các giá trị số phải là số nguyên dương. OpenClaw giới hạn
`maxConcurrent` trong khoảng `1`–`1000`, `maxChildrenPerGroup` trong khoảng `1`–`10000`,
`maxTotalPerGroup` trong khoảng `1`–`100000` và `waitTimeoutSecondsMax` trong khoảng
`1`–`86400`.

Bạn có thể ghi đè Swarm cho một agent đã cấu hình bằng
`agents.list[].tools.swarm`. Đối tượng theo từng agent được hợp nhất để ghi đè lên đối tượng
`tools.swarm` cấp cao nhất.

## Yêu cầu

Các biến toàn cục khách `agents.run`, `phase` và `log` yêu cầu cả Swarm lẫn
OpenClaw Code Mode:

```json5
{
  tools: {
    codeMode: true,
    swarm: true,
  },
}
```

Code Mode cũng phải có quyền truy cập hiệu lực vào `sessions_spawn`. Hồ sơ công cụ,
chính sách cho phép/từ chối, quy tắc nhà cung cấp và chính sách sandbox có thể loại bỏ công cụ đó.
Xem [kích hoạt Code Mode](/vi/tools/code-mode#activation) và
[Sub-agent](/vi/tools/subagents) nếu script báo rằng `sessions_spawn`
không khả dụng.

Các giá trị `defaultAgentId` và `agentId` theo từng lần chạy phải chỉ định một đích đã cấu hình
được chính sách `subagents.allowAgents` của bên yêu cầu cho phép. OpenClaw từ chối
đích không xác định hoặc không được phép thay vì chuyển sang một agent khác.

## Viết script Swarm

Khi Swarm được bật, Code Mode cung cấp API khách sau:

```typescript
type AgentRunOptions = {
  label?: string;
  model?: string;
  thinking?: string;
  fastMode?: boolean | "auto";
  agentId?: string;
  schema?: Record<string, unknown>;
  phase?: string;
};

agents.run(prompt: string, options?: AgentRunOptions & { schema?: undefined }): Promise<string>;
agents.run<T>(prompt: string, options: AgentRunOptions & { schema: Record<string, unknown> }): Promise<T>;
phase(title: string): void;
log(message: string): void;
```

Nếu không có `schema`, `agents.run()` phân giải thành văn bản cuối cùng của tiến trình con. Khi có
JSON Schema, nó phân giải thành giá trị được gửi thông qua công cụ
`structured_output` của tiến trình con. Tiến trình con thất bại, bị kết thúc, hết thời gian chờ hoặc không hợp lệ theo schema
sẽ từ chối promise với `SwarmAgentError`. Đọc các khai báo chính xác được tạo
và những mẫu điều phối ngắn từ `API.read("agents.d.ts")`
bên trong Code Mode.

Dùng `label` để đặt tên dễ nhận biết cho tiến trình con trong bảng điều khiển và thanh bên. Dùng
`phase` trong các tùy chọn để công bố một giai đoạn ngay trước khi tiến trình con đó
bắt đầu, hoặc gọi `phase()` khi nhiều tiến trình con thuộc cùng một giai đoạn.
`log()` công bố một ghi chú tiến độ ngắn. Các lệnh gọi tiến độ hoạt động theo kiểu gửi rồi bỏ qua;
chúng không làm chậm script nếu UI không khả dụng.

### Phân tán song song với kết quả có cấu trúc

Ví dụ này khởi chạy một tiến trình nghiên cứu cho mỗi chủ đề, chờ tất cả hoàn tất, rồi
yêu cầu tiến trình con cuối cùng tổng hợp các báo cáo có cấu trúc của chúng:

```javascript
const reportSchema = {
  type: "object",
  properties: {
    finding: { type: "string" },
    evidence: { type: "array", items: { type: "string" } },
    confidence: { type: "number" },
  },
  required: ["finding", "evidence", "confidence"],
  additionalProperties: false,
};

const topics = ["authentication", "storage", "recovery"];
phase("Đánh giá độc lập");

const reports = await Promise.all(
  topics.map((topic) =>
    agents.run(`Đánh giá luồng ${topic}. Trả về một phát hiện kèm bằng chứng.`, {
      label: `review-${topic}`,
      thinking: "high",
      fastMode: "auto",
      schema: reportSchema,
    }),
  ),
);

phase("Tổng hợp");
log(`Đã thu thập ${reports.length} báo cáo độc lập.`);

return await agents.run(
  `Đối chiếu các báo cáo này và giải thích các điểm bất đồng:\n${JSON.stringify(reports)}`,
  { label: "synthesis" },
);
```

`Promise.all` là ranh giới phân tán và hội tụ. OpenClaw khởi chạy tối đa
`maxConcurrent` tiến trình con cho nhóm và xếp phần còn lại vào hàng đợi theo thứ tự
gửi.

### Lặp theo cổng quyết định

Sử dụng vòng lặp `while` có giới hạn khi mỗi lượt quyết định liệu có cần
thêm một lượt nữa hay không:

```javascript
const gateSchema = {
  type: "object",
  properties: {
    ready: { type: "boolean" },
    reason: { type: "string" },
    nextAction: { type: "string" },
  },
  required: ["ready", "reason", "nextAction"],
  additionalProperties: false,
};

let pass = 0;
let decision = { ready: false, reason: "Chưa kiểm tra", nextAction: "Đánh giá" };

while (!decision.ready && pass < 4) {
  pass += 1;
  phase(`Lượt quyết định ${pass}`);
  decision = await agents.run(
    `Kiểm tra xem bằng chứng phát hành đã đầy đủ chưa. Quyết định trước đó: ${JSON.stringify(decision)}`,
    {
      label: `release-gate-${pass}`,
      schema: gateSchema,
    },
  );
  log(decision.reason);
}

if (!decision.ready) {
  throw new Error(`Cổng vẫn đóng sau ${pass} lượt: ${decision.nextAction}`);
}

return decision;
```

Luôn đặt giới hạn cho các vòng lặp quyết định. `maxTotalPerGroup` là cơ chế bảo vệ cuối cùng,
không phải sự thay thế cho một điều kiện dừng rõ ràng.

### Xử lý tiến trình con hoàn tất đầu tiên

`agents.run()` trả về một promise thông thường, vì vậy `Promise.race` có thể phản ứng với
tiến trình con Code Mode đầu tiên. Đối với các harness gọi các công cụ cấp thấp hơn,
`agents_wait` cung cấp cùng ranh giới hoàn tất đầu tiên: nó trả về ngay khi
ít nhất một lần chạy được yêu cầu hoàn tất hoặc khi hết thời gian chờ có giới hạn.
Xem [Sử dụng Swarm từ các harness khác](#use-swarm-from-other-harnesses) để biết
vòng lặp thu kết quả đầy đủ.

## Cách tiến trình con thu thập hoạt động

Tiến trình con thu thập là các phiên sub-agent cô lập thông thường nhưng có đường dẫn
hoàn tất khác. Chúng ghi kết quả thu thập bền vững để tiến trình cha
chờ thay vì thông báo hoặc điều hướng phản hồi trở lại phiên cha.

Agent đích được phân giải theo thứ tự sau:

1. `agentId` trong lệnh khởi tạo hoặc lệnh gọi `agents.run()`.
2. `tools.swarm.defaultAgentId`.
3. Agent gửi yêu cầu.

Một agent thực thi chuyên dụng, tinh gọn sẽ hữu ích khi các tiến trình con swarm cần phạm vi
công cụ nhỏ hơn, mô hình rẻ hơn hoặc chính sách sandbox chặt chẽ hơn. OpenClaw không cung cấp
sẵn id agent `worker`; hãy cấu hình một agent trước khi chỉ định nó làm mặc định.
Gia cố agent thực thi đó bằng `tools.swarm: false` trong cấu hình theo từng agent để
nó có thể được khởi tạo nhưng không thể bắt đầu swarm từ các phiên cấp cao nhất của chính nó:

```json5
{
  tools: { swarm: { enabled: true, defaultAgentId: "worker" } },
  agents: {
    list: [
      {
        id: "main",
        default: true,
        subagents: { allowAgents: ["worker"] },
      },
      { id: "worker", tools: { swarm: false } },
    ],
  },
}
```

Các yêu cầu phê duyệt của tiến trình thu thập mặc định sẽ bị từ chối. Tiến trình con không bao giờ mở lời nhắc
phê duyệt cho người vận hành. Một thao tác công cụ cần phê duyệt sẽ bị từ chối, và tiến trình con có thể
báo cáo việc từ chối đó trong kết quả để script quyết định hành động tiếp theo.

Đối với đầu ra có cấu trúc, OpenClaw thêm một công cụ `structured_output` tổng hợp vào
tiến trình con và xác thực payload của nó theo JSON Schema được cung cấp. Payload
không hợp lệ hoặc bị thiếu sẽ nhận một lời nhắc sửa duy nhất. Nếu lần thử lại vẫn
không vượt qua xác thực, kết quả hoàn tất của tiến trình thu thập sẽ giữ lại văn bản thô của tiến trình con, để
`structured` chưa được đặt và bao gồm `schemaError`. Kết quả `agents_wait`
cấp thấp cung cấp các trường đó cho logic khôi phục tường minh.

### Tiến trình con là nút lá

Theo mặc định, tiến trình con Swarm là nút lá. Cơ chế bảo vệ phổ quát
`agents.defaults.subagents.maxSpawnDepth` ngăn một tiến trình con khởi tạo
các tiến trình con riêng ở độ sâu mặc định `1`. Mẫu điều phối thông thường là
trả công việc về tiến trình cha, không phải khởi tạo thêm công việc từ tiến trình con:

```javascript
const plan = await agents.run("Lập kế hoạch cho công việc này thành các tác vụ độc lập.", {
  schema: {
    type: "object",
    properties: { tasks: { type: "array", items: { type: "string" } } },
    required: ["tasks"],
    additionalProperties: false,
  },
});
return await Promise.all(plan.tasks.map((task) => agents.run(task)));
```

Sub-agent lồng nhau là tính năng mà người vận hành phải chủ động bật thông qua
`agents.defaults.subagents.maxSpawnDepth` và không được khuyến nghị cho Swarm.
Giới hạn nhóm, ngân sách và khả năng quan sát đều giả định các nhóm thu thập phẳng.

Mỗi tiến trình con có một chủ thể quản lý việc tiếp nhận. Tiến trình con thông báo và tương tác sử dụng
`agents.defaults.subagents.maxChildrenPerAgent` (mặc định `5`) và không tính
các tiến trình con thu thập. Tiến trình con thu thập chỉ sử dụng `maxChildrenPerGroup` và
`maxTotalPerGroup`; chúng không tiêu thụ ngân sách tiến trình con theo phiên. Cơ chế bảo vệ
độ sâu khởi tạo vẫn áp dụng cho cả hai chế độ.

Sau khi được tiếp nhận, các tiến trình con vượt quá `maxConcurrent` sẽ xếp hàng FIFO trong nhóm swarm
của chúng, được lồng bên trong làn sub-agent toàn cục. Các lớp đồng thời này xếp
công việc vào hàng đợi thay vì từ chối. Một lần khởi tạo tiến trình thu thập vượt quá một trong hai giới hạn nhóm
sẽ bị từ chối với khóa cấu hình liên quan trong lỗi.

## Quan sát một Swarm

Mở bảng điều khiển của phiên cha trong Control UI khi một swarm đang hoạt động.
Tiện ích Swarm hiển thị mỗi nhóm thu thập đang hoạt động bằng một dấu chấm cho mỗi tiến trình con với
trạng thái đang chờ, đang chạy, hoàn tất hoặc thất bại. Nhãn xuất hiện trong chú giải của dấu chấm, vì vậy các
nhãn ngắn và ổn định giúp các swarm lớn dễ đọc hơn.

Thanh bên phiên giữ nguyên cây cha/con thông thường. Mở rộng hàng của tiến trình cha
để kiểm tra một tiến trình con thu thập hoặc mở bản ghi hội thoại của nó mà không làm mất cấu trúc phân cấp
swarm.

Kết quả thu thập vẫn có thể được chờ cho đến khi nhóm được lưu trữ. Sau khi mọi
thành viên đạt thời hạn lưu giữ, OpenClaw lưu trữ các tiến trình con của nhóm
theo lô để các swarm đã hoàn tất không còn nằm trong cây phiên đang hoạt động.

## Sử dụng Swarm từ các harness khác

Bạn có thể sử dụng Swarm mà không cần OpenClaw Code Mode. Các công cụ cốt lõi của Swarm
không phụ thuộc vào harness: khởi chạy các collector con bằng
`sessions_spawn({ collect: true })` và thu thập kết quả từ chúng bằng các lệnh gọi `agents_wait`
có giới hạn.

Codex Code Mode tự động cung cấp các công cụ OpenClaw động đủ điều kiện trong
`tools.*`. Chế độ này không sử dụng API khách QuickJS của OpenClaw hoặc yêu cầu
`tools.codeMode`, nhưng `tools.swarm` vẫn phải được bật. Các lệnh gọi
`agents_wait` của harness Codex hỗ trợ đầy đủ thời gian chờ 600 giây. Sử dụng mẫu sau:

```javascript
const tasks = [
  "Kiểm tra đường dẫn xác thực.",
  "Kiểm tra đường dẫn lưu trữ.",
  "Kiểm tra đường dẫn khôi phục.",
];

const launches = await Promise.all(
  tasks.map((task, index) =>
    tools.sessions_spawn({
      task,
      collect: true,
      label: `review-${index + 1}`,
    }),
  ),
);

for (const launch of launches) {
  if (launch.status !== "accepted") {
    throw new Error(launch.error ?? "Yêu cầu khởi chạy collector không được chấp nhận.");
  }
}

const pending = new Set(launches.map((launch) => launch.runId));
const completed = [];

while (pending.size > 0) {
  const ids = [...pending].slice(0, 1000);
  const batch = await tools.agents_wait({
    ids,
    timeoutSeconds: 30,
  });

  // Luân chuyển cửa sổ có giới hạn này qua các id chưa được kiểm tra.
  for (const runId of ids) {
    if (pending.delete(runId)) pending.add(runId);
  }

  for (const item of batch.completed) {
    pending.delete(item.runId);
    if (item.status !== "done") {
      throw new Error(item.schemaError ?? item.result ?? `${item.runId}: ${item.status}`);
    }
    completed.push(item); // Xử lý từng kết quả ngay khi hoàn tất.
  }

  for (const failure of batch.errors ?? []) {
    pending.delete(failure.runId);
    throw new Error(`${failure.runId}: ${failure.error}`);
  }
}

return completed;
```

Mỗi lệnh gọi `agents_wait` chấp nhận 1–1000 id lượt chạy. Lệnh gọi trả về:

```typescript
type AgentsWaitResult = {
  completed: Array<{
    runId: string;
    status: "done" | "failed" | "killed" | "timeout";
    result: string;
    structured?: unknown;
    schemaError?: string;
    sessionKey: string;
    label?: string;
    usage?: { inputTokens: number; outputTokens: number };
  }>;
  pending: string[];
  errors?: Array<{
    runId: string;
    error: "not_found" | "not_owner";
  }>;
};
```

Lệnh gọi trả về ngay lập tức khi bất kỳ tiến trình con được yêu cầu nào đã hoàn tất,
khi ít nhất một tiến trình con đang chờ hoàn tất, khi không còn id đang chờ hợp lệ nào,
hoặc khi hết thời gian chờ. Các bản ghi đã hoàn tất có tính lũy đẳng, vì vậy việc truyền
id của một lượt chạy đã hoàn tất sẽ trả lại kết quả của lượt chạy đó. Chỉ phiên khởi chạy
hoặc chuỗi phiên cha được ủy quyền của phiên đó mới có thể chờ một collector.

Đây là cơ chế thăm dò dài có giới hạn, không phải vòng lặp trạng thái bận. Chỉ tiếp tục truyền
các id lượt chạy còn lại cho đến khi `pending` trống. Chế độ collector hỗ trợ các
sub-agent OpenClaw gốc; chế độ này không hỗ trợ runtime ACP, liên kết luồng, các phiên hiển thị
hoặc chế độ phiên liên tục.

## Giới hạn và lộ trình

Swarm v1 chạy các tiến trình collector con dùng một lần; API `agents.session()` dự kiến
sẽ bổ sung các worker nhiều lượt có trạng thái. Hiện tại, các tiến trình con chạy trên
lane sub-agent của Gateway cục bộ; việc triển khai trên đám mây được lên kế hoạch dưới dạng
một tùy chọn khởi chạy rõ ràng. Các định nghĩa quy trình làm việc đã lưu và DSL đồ thị không
thuộc định hướng hiện tại của Swarm.

## Liên quan

- [Code Mode](/vi/tools/code-mode) để biết runtime khách QuickJS và các quy tắc kích hoạt
- [Sub-agent](/vi/tools/subagents) để biết chính sách tiến trình con, khả năng cách ly và hành vi phiên
- [Công cụ sandbox đa agent](/vi/tools/multi-agent-sandbox-tools) để biết các hạn chế riêng cho từng agent
- [Tổng quan về công cụ](/vi/tools) để biết các hồ sơ công cụ và định tuyến chính sách
