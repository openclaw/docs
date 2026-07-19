---
x-i18n:
    generated_at: "2026-07-19T16:54:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 90c6c85a837448f4e5ceccdccf73489db801ad502cbbb2f3eb04d6aff7e902f0
    source_path: plan/swarms.md
    workflow: 16
---

# Swarms — phân nhánh tác tử và điều phối trong chế độ mã

Trạng thái: Đã phát hành — được thay thế bởi `docs/tools/swarm.md`. Tài liệu này được giữ lại làm
hồ sơ thiết kế triển khai.

## 1. Nội dung và lý do

Một **swarm** là nhiều tác tử con được điều phối theo cách xác định từ một tập lệnh
chế độ mã: phân nhánh N trình đọc, xác minh các phát hiện theo hướng đối kháng, tổng hợp qua một
bộ ưu tiên có trạng thái, lặp theo các cổng quyết định. Luồng điều khiển (`Promise.all`,
`while`, `if`) _chính là_ sự điều phối — chủ ý **không có DSL đồ thị,
không có chế độ mới, không có bề mặt công cụ cấp cao nhất mới**.

Chế độ mã của OpenClaw (QuickJS-WASI, ảnh chụp/tiếp tục, yêu cầu cầu nối) là
nền tảng. Một lệnh gọi cầu nối đang chờ vẫn tồn tại qua ảnh chụp VM, lần khởi động lại Gateway và
tiếp tục chính xác tại nơi đã dừng — mạnh hơn các thiết kế phát lại nhật ký mà
không áp đặt ràng buộc tính xác định lên tập lệnh.

Cách đặt tên: tên trong sản phẩm/tài liệu là **Swarm**. Các định danh mã được giữ nguyên:
API khách `agents.*`, cấu hình `tools.swarm`, các cột nhóm `swarm`.

## 2. Quyết định (người bảo trì, 2026-07-17)

- Chi phí: áp dụng các giới hạn cấu hình; ngân sách token cho mỗi swarm là tùy chọn. Không bắt buộc có ngân sách.
- Phê duyệt: các tiến trình con chạy ở chế độ **đóng khi lỗi / không tương tác**. Các hành động
  yêu cầu phê duyệt bị từ chối; việc từ chối được báo cáo trong kết quả của tiến trình con; tập lệnh
  quyết định. Không làm tràn lời nhắc dành cho người vận hành khi phân nhánh.
- v1 chỉ hỗ trợ các tập lệnh đặc thù do mô hình viết. Quy trình làm việc đã lưu/được đặt tên, điểm vào
  CLI/cron: để sau (chế độ mã không giao diện đã tồn tại cho cron).
- Danh tính tiến trình con: mặc định là tác tử worker chuyên dụng thông qua cấu hình `tools.swarm.defaultAgentId`
  (được xác thực dựa trên danh sách cho phép mục tiêu tác tử con hiện có); có thể ghi đè `agentId`
  cho từng lần sinh. Phần lõi không cung cấp sẵn id tác tử đi kèm; tài liệu khuyến nghị một cấu hình tác tử
  `worker` tinh gọn.
- Không thay đổi mã nguồn Codex. Bộ khung Codex dùng thành ngữ sinh/chờ (§8).

## 3. Tổng quan kiến trúc

```
tập lệnh chế độ mã (VM QuickJS, Gateway)         tập lệnh Codex V8 (tiến trình codex)
  agents.run(...) ── lệnh gọi cầu nối đang chờ     tools.sessions_spawn / tools.agents_wait
        │                                                │ RPC mục/công cụ/lệnh gọi (mỗi RPC ≤600s)
        ▼                                                ▼
             LÕI (độc lập với bộ khung, repo này)
  sessions_spawn {collect:true, outputSchema, fastMode, groupId}
  agents_wait {ids, timeoutSeconds}
        │
  sổ đăng ký tác tử con (SQLite): bản ghi hoàn tất của bộ thu thập, id nhóm swarm
        │
  tiến trình con = các phiên tác tử con thông thường (giới hạn theo làn, phê duyệt đóng khi lỗi)
        │
  sessions.changed SSE ──► các chấm trên Control UI / thanh bên / thông báo trạng thái kênh
```

Một thành phần sở hữu chuẩn tắc duy nhất đối với ngữ nghĩa sinh/hoàn tất/giải quyết (công cụ lõi + sổ đăng ký).
Hai phương thức truyền tải chờ: QuickJS giữ một lệnh gọi cầu nối ở trạng thái chờ vô thời hạn (ảnh chụp);
Codex thăm dò `agents_wait` trong các RPC có giới hạn.

## 4. Cổng cấu hình (v1)

`tools.swarm` mới (ghi đè toàn cục + theo từng tác tử, cùng kiểu hợp nhất như
`tools.codeMode`):

```jsonc
"tools": {
  "swarm": {
    "enabled": false,            // cổng chính, mặc định TẮT
    "maxConcurrent": 8,          // số tiến trình con chạy đồng thời (giới hạn làn swarm)
    "maxChildrenPerGroup": 50,   // số tiến trình con đang hoạt động trên mỗi nhóm swarm
    "maxTotalPerGroup": 200,     // tổng số lần sinh trong vòng đời mỗi nhóm (cơ chế chặn chạy mất kiểm soát)
    "waitTimeoutSecondsMax": 600,
    "defaultAgentId": ""         // tùy chọn; id tác tử con khi lệnh sinh bỏ qua agentId
  }
}
```

- Zod: hợp `boolean | strict object` tương tự `CodeModeSchema`
  (`src/config/zod-schema.agent-runtime.ts`); `swarm: true` → `{enabled: true}`.
- Các kiểu trong `src/config/types.tools.ts` (cả theo từng tác tử và `tools` cấp cao nhất),
  nhãn trong `schema.labels.ts`, trợ giúp trong `schema.help.runtime.ts`.
- Trình trợ giúp phân giải `resolveSwarmConfig(cfg, agentId)` mô phỏng
  `resolveCodeModeConfig` (`src/agents/code-mode.ts:215`), giới hạn tất cả các số.
- Tác động của cổng khi bị tắt: công cụ `agents_wait` không có trong các danh mục;
  các tham số `collect`/`outputSchema`/`fastMode`/`groupId` trên `sessions_spawn`
  bị từ chối bằng lỗi rõ ràng có nêu khóa cấu hình. Không có thay đổi hành vi nào khác.
- `defaultAgentId` được xác thực thông qua `resolveSubagentAllowedTargetIds`
  (`src/agents/subagent-target-policy.ts`); id không xác định → lỗi sinh, không dự phòng.

## 5. Lõi: sinh ở chế độ bộ thu thập + `agents_wait` (v1)

### 5.1 Các phần bổ sung cho `sessions_spawn` (tất cả đều phụ thuộc vào việc swarm được bật)

- `collect: boolean` — khi đúng, lượt chạy tiến trình con được đăng ký với
  `expectsCompletionMessage: false` và một **bản ghi hoàn tất của bộ thu thập**
  thay vì phân phối thông báo/điều hướng. Công cụ trả về `{ runId, sessionKey }`
  ngay lập tức. Không liên kết kênh/luồng.
- `outputSchema: object` — JSON Schema. Tiến trình con nhận một công cụ
  `structured_output` tổng hợp được thêm vào bề mặt công cụ; phần bổ sung lời nhắc hệ thống
  yêu cầu tiến trình con gọi công cụ đó đúng một lần với kết quả cuối cùng. Khi xác thực
  thất bại, tiến trình con được nhắc thử lại một lần; sau đó bản ghi hoàn tất
  chứa `structured: undefined` cùng văn bản thô và `schemaError`.
- `fastMode: true | "auto" | false` — được luồn vào bản vá phiên tiến trình con
  cùng với mô hình/suy luận thông qua `resolveSubagentModelAndThinkingPlan`
  (`src/agents/subagent-spawn-plan.ts`), sử dụng trục `FastMode` hiện có
  (`src/shared/fast-mode.ts`). Bỏ qua = kế thừa.
- `groupId: string` — dấu nhóm swarm. Mặc định là
  `swarm:<requesterSessionKey>:<runId-of-requesting-run>`. Được lưu bền vững trên
  bản ghi sổ đăng ký và hàng phiên tiến trình con. Dùng cho các giới hạn, liệt kê, lưu trữ
  hàng loạt và các chấm.
- `label: string` đã tồn tại — hiển thị trong các chấm và `subagents list`.
- Id tác tử con: `params.agentId` → nếu không thì `tools.swarm.defaultAgentId` → nếu không thì
  tác tử yêu cầu (hành vi hiện có).

### 5.2 Phê duyệt đóng khi lỗi

Các tiến trình con của bộ thu thập chạy với ngữ cảnh phê duyệt không tương tác: mọi lệnh gọi công cụ
vốn yêu cầu phê duyệt của người vận hành đều được giải quyết thành một từ chối có cấu trúc
(`approval_required`) mà tiến trình con có thể thấy; tiến trình con được kỳ vọng báo cáo
trở ngại trong kết quả. Triển khai: tái sử dụng hệ thống chính sách phê duyệt exec/công cụ
hiện có với trình phân giải `deny` bắt buộc cho các lượt chạy tiến trình con ở chế độ bộ thu thập.
Không phát sự kiện phê duyệt nào đến các bề mặt dành cho người vận hành từ tiến trình con của bộ thu thập.

### 5.3 Công cụ `agents_wait` (mới, có cổng)

```
agents_wait({ ids: string[], timeoutSeconds?: number })
→ {
    completed: [{ runId, status: "done"|"failed"|"killed"|"timeout",
                  result: string, structured?: unknown, schemaError?: string,
                  sessionKey, label?, usage?: {inputTokens, outputTokens} }],
    pending: string[]
  }
```

- Trả về ngay khi **ít nhất một** id hoàn tất (ngữ nghĩa hoàn tất đầu tiên / đua,
  cho phép các pipeline), hoặc khi hết thời gian với `completed: []`.
- `timeoutSeconds` mặc định là 30, được giới hạn ở `waitTimeoutSecondsMax`.
- Lũy đẳng: các id đã hoàn tất trả lại bản ghi của chúng (các bản ghi được
  giữ cho đến khi lưu trữ nhóm). Id không xác định → mục lỗi theo từng id, không ném lỗi.
- Quyền sở hữu: chỉ phiên đã sinh một lượt chạy (hoặc chuỗi cha của phiên đó) mới có thể chờ
  lượt chạy ấy — cùng quy tắc sở hữu như `wait` trong chế độ mã (`code-mode.ts:1684`).
- Sổ đăng ký: các bản ghi hoàn tất nằm trong kho SQLite của sổ đăng ký tác tử con
  hiện có (`subagent-registry.store.sqlite.ts`) — trường mới, không có kho mới, không
  tăng phiên bản lược đồ (chỉ thêm cột; xem ràng buộc §9).

### 5.4 Thực thi giới hạn

- `maxConcurrent`: các tiến trình con của bộ thu thập chạy trên làn tác tử con hiện có nhưng
  được đếm theo từng nhóm swarm; các lượt sinh vượt quá giới hạn sẽ xếp hàng FIFO (phía máy chủ, trong
  đường dẫn sinh — trả về runId ngay lập tức, lượt chạy bắt đầu khi có chỗ trống).
- `maxChildrenPerGroup` / `maxTotalPerGroup`: lệnh sinh bị từ chối bằng lỗi có kiểu
  khi vượt quá giới hạn; văn bản lỗi nêu khóa cấu hình.
- Độ sâu: các tiến trình con của bộ thu thập giữ nguyên ngữ nghĩa `DEFAULT_SUBAGENT_MAX_SPAWN_DEPTH`
  (tiến trình con là lá trừ khi cấu hình lồng nhau một cách rõ ràng).

## 6. Hợp đồng kiểm thử (v1, làn A)

- Đơn vị: phân giải/giới hạn cấu hình; từ chối tại cổng khi bị tắt; mặc định hóa groupId;
  thực thi giới hạn (xếp hàng + từ chối); ngữ nghĩa đua khi chờ; tính lũy đẳng khi chờ;
  từ chối quyền sở hữu; xác thực đầu ra có cấu trúc + nhắc thử lại +
  đường dẫn schemaError; luồn fastMode vào bản vá phiên; xác thực defaultAgentId.
- Tích hợp (vitest, runtime mô hình giả lập): sinh 3 tiến trình con của bộ thu thập, chờ
  trong một vòng lặp, xác nhận thứ tự hoàn tất đầu tiên và lần rút cạn cuối cùng; mô phỏng
  khởi động lại Gateway: tải lại sổ đăng ký → lệnh chờ được giải quyết từ dữ liệu hoàn tất đã lưu bền vững.
- Tất cả kiểm thử được đặt cùng `*.test.ts`; không gọi mô hình trực tiếp.

## 7. Bề mặt khách QuickJS (làn B, sau phần lõi)

- Các biến toàn cục khách được cài đặt trong `CONTROLLER_SOURCE`
  (`src/agents/code-mode.worker.ts:190-374`), các tên dành riêng được thêm vào
  `code-mode-namespaces.ts`:
  - `agents.run(prompt, opts) → Promise<result|structured>` — cú pháp tiện ích:
    sinh bộ thu thập + chờ ở trạng thái chờ trên một phương thức cầu nối chuyên dụng (`agentWait`)
    mà máy chủ giải quyết khi hoàn tất (không thăm dò; an toàn với ảnh chụp).
  - `agents.session(system, opts) → Promise<handle>`;
    `handle.send(input, opts) → Promise<...>`; `handle.close()`. (v1.1 —
    phát hành sau run(); sử dụng `mode:"session"` + bản ghi bộ thu thập theo từng lượt.)
  - `phase(title)`, `log(message)` — thông báo cầu nối gửi và quên →
    các sự kiện tiến độ swarm.
- Các phương thức cầu nối được thêm vào `CodeModeBridgeMethod` (`code-mode.ts:91`):
  `agentSpawn`, `agentWait`, `swarmNote`. `agentSpawn`/`agentWait`
  an toàn khi phát lại **do thiết kế**: khóa lũy đẳng `(codeModeRunId, bridgeId)`
  được lưu trên bản ghi sổ đăng ký; việc khởi động lại giải quyết lại từ các kết quả hoàn tất đã lưu bền vững
  và không bao giờ sinh hai lần.
- Các lệnh gọi cầu nối `agentWait` đang chờ kéo dài TTL ảnh chụp của lượt chạy (tập hợp
  tác tử đang chờ là tín hiệu; không có cờ).
- Tệp ảo `API.read("agents.d.ts")` ghi lại bề mặt có kiểu + các thành ngữ
  phân nhánh / cổng / chu kỳ (`createCodeModeApiVirtualFiles`,
  `code-mode-namespaces.ts:876`).

## 8. Phép chiếu bộ khung Codex (làn sau)

- `sessions_spawn` (với các tham số mới) và `agents_wait` đi qua
  cầu nối công cụ động hiện có; bên trong các tập lệnh chế độ mã Codex, chúng tự động xuất hiện dưới dạng
  `tools.*` (đã xác minh: `codex-rs/code-mode/src/runtime/globals.rs:14-65`,
  `codex-rs/core/src/tools/spec_plan.rs:448-507`).
- `agents_wait` nhận lớp hết thời gian công cụ động dài (giới hạn 600s;
  `extensions/codex/src/app-server/dynamic-tool-execution.ts:37-39`) và được
  đánh dấu là an toàn khi hết thời gian/phát lại.
- Khóa nhóm cho các tiến trình cha Codex: `swarm:<parentSessionKey>:<turnId>`.
- Các tác tử con `spawn_agent` gốc Codex cùng tồn tại; các hàng phản chiếu tác vụ của chúng cung cấp dữ liệu
  cho cùng một bề mặt tiến độ.

## 9. Lưu bền vững và lưu giữ

- Không có kho mới. Các bản ghi sổ đăng ký mở rộng các bảng SQLite của sổ đăng ký tác tử con
  hiện có; các tiến trình con là những hàng `sessions` thông thường. Chỉ thêm cột
  — **mọi thay đổi yêu cầu tăng phiên bản lược đồ SQLite đều cần được
  người bảo trì phê duyệt rõ ràng trước** (chính sách repo).
- Id nhóm swarm trên bản ghi sổ đăng ký + siêu dữ liệu phiên tiến trình con.
- Lưu giữ: các bản ghi bộ thu thập đã hoàn tất tồn tại cho đến khi **lưu trữ nhóm**:
  khi lượt chạy cha kết thúc (hoặc TTL hết hạn), các tiến trình con của nhóm được lưu trữ
  theo lô (mở rộng lượt quét `DEFAULT_SUBAGENT_ARCHIVE_AFTER_MINUTES` hiện có
  để hoạt động theo từng nhóm).

## 10. Bề mặt tiến độ ("các chấm") — làn sau

- Ngầm định, do bộ khung điều khiển. Được dẫn xuất từ SSE `sessions.changed` hiện có +
  sổ đăng ký; ghi chú `phase`/`log` bổ sung ngữ nghĩa. Tác tử không điều khiển việc kết xuất.
- Control UI: trình kết xuất `swarm` trong họ tiện ích không gian làm việc
  (`ui/src/lib/workspace/widgets/`) — lưới chấm được nhóm theo giai đoạn, dòng
  tường thuật, trạng thái/nhãn/mô hình theo từng chấm; cây tiến trình con trên thanh bên không đổi.
- Các kênh: một thông báo trạng thái đã chỉnh sửa và được điều tiết trên mỗi nhóm (tuân theo
  `docs/concepts/streaming.md`; không bao giờ gửi thông báo theo từng tiến trình con).

## 11. Trang Labs (Giao diện điều khiển, lane độc lập)

Settings → **Labs**: các nút bật/tắt tính năng thử nghiệm, các mục đầu tiên là **Chế độ mã**
và **Swarm**. Mỗi hàng: tên, mô tả một dòng, liên kết tài liệu, nút bật/tắt được kết nối
qua RPC `config.patch` hiện có (merge-patch RFC 7396 — đặt
`tools.codeMode.enabled` / `tools.swarm.enabled`), cùng gợi ý "cần khởi động lại"
khi áp dụng. Dễ tìm thấy, nhưng nội dung hiển thị làm rõ trạng thái thử nghiệm.
i18n: mọi chuỗi đều đi qua `en.ts` thông thường + pipeline đồng bộ.

## 12. Vị trí triển khai (sau)

- `placement` tùy chọn khi tạo: `"local"` (mặc định) | `"cloud:<profile>"` qua
  cơ chế điều phối môi trường worker hiện có (`sessions.dispatch`); vị trí triển khai theo nhóm
  sẽ được bổ sung sau nếu các tiến trình con trong sandbox SSH trên hộp dùng chung tỏ ra không đủ.
- VM điều phối luôn nằm trên Gateway; settle/dots/budget không phụ thuộc
  vào vị trí triển khai.

## 13. Ngoài phạm vi

- Không có DSL đồ thị — luồng điều khiển chính là đồ thị (có chủ đích, được ghi lại trong tài liệu).
- Không thay đổi mã nguồn Codex; không tái sử dụng phần nội bộ của Chế độ mã Codex.
- Không có quy trình làm việc đã lưu/được đặt tên trong v1; không có điểm vào CLI.
- Không chuyển tiếp phê duyệt của người vận hành từ từng tiến trình con.
- Không cấp phát đám mây theo tỷ lệ 1:1 ở quy mô fan-out.
- Không có shim tương thích runtime ở trạng thái ổn định; swarm là bề mặt mới, có cổng kiểm soát.

## 14. Các giai đoạn xây dựng / chia PR

1. **Lane A (lõi)**: cấu hình §4 + spawn/wait/caps/approvals §5 + kiểm thử §6.
2. **Lane C (trang Labs)**: §11 — độc lập, có thể được hợp nhất trước.
3. **Lane B (bề mặt QuickJS)**: §7 — sau khi các hợp đồng của A được hợp nhất.
4. Trình kết xuất dots (§10), phép chiếu Codex (§8), `agents.session` (§7 v1.1),
   vị trí triển khai (§12), viết lại tài liệu người dùng — các PR tiếp theo theo thứ tự đó.

Mỗi PR: Pipeline CI xanh, `$autoreview` sạch, mặc định bị vô hiệu hóa bằng cổng kiểm soát, nhánh main có thể phát hành.
