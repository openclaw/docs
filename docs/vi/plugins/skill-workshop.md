---
read_when:
    - Bạn muốn các tác tử biến các nội dung chỉnh sửa hoặc quy trình có thể tái sử dụng thành Skills trong không gian làm việc
    - Bạn đang cấu hình bộ nhớ kỹ năng theo quy trình
    - Bạn đang gỡ lỗi hành vi của công cụ skill_workshop
    - Bạn đang quyết định có bật tính năng tự động tạo Skills hay không
summary: Thử nghiệm ghi lại các quy trình có thể tái sử dụng dưới dạng Skills trong không gian làm việc, với cơ chế xem xét, phê duyệt, cách ly và làm mới nóng Skills
title: Plugin hội thảo kỹ năng
x-i18n:
    generated_at: "2026-04-29T23:03:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6063843bf15e639d7f5943db1bab52fbffce6ec30af350221d8b3cd711e227b
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop là **thử nghiệm**. Tính năng này bị tắt theo mặc định, các heuristic
ghi nhận và prompt của trình đánh giá có thể thay đổi giữa các bản phát hành, và việc ghi tự động
chỉ nên được dùng trong các workspace tin cậy sau khi xem xét đầu ra ở chế độ pending
trước.

Skill Workshop là bộ nhớ thủ tục cho workspace skills. Tính năng này cho phép agent chuyển
các workflow có thể tái sử dụng, các chỉnh sửa của người dùng, những bản sửa khó đạt được và các lỗi thường gặp
thành các tệp `SKILL.md` trong:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Điều này khác với bộ nhớ dài hạn:

- **Memory** lưu trữ dữ kiện, tùy chọn, thực thể và ngữ cảnh trước đây.
- **Skills** lưu trữ các thủ tục có thể tái sử dụng mà agent nên làm theo trong các tác vụ tương lai.
- **Skill Workshop** là cầu nối từ một lượt hữu ích đến một workspace
  skill bền vững, với kiểm tra an toàn và phê duyệt tùy chọn.

Skill Workshop hữu ích khi agent học một thủ tục như:

- cách xác thực tài sản GIF động có nguồn từ bên ngoài
- cách thay thế tài sản ảnh chụp màn hình và xác minh kích thước
- cách chạy một kịch bản QA riêng cho repo
- cách gỡ lỗi một lỗi provider lặp lại
- cách sửa một ghi chú workflow cục bộ đã cũ

Tính năng này không nhằm dùng cho:

- dữ kiện như “người dùng thích màu xanh dương”
- bộ nhớ tự truyện rộng
- lưu trữ transcript thô
- bí mật, thông tin xác thực hoặc văn bản prompt ẩn
- hướng dẫn dùng một lần sẽ không lặp lại

## Trạng thái mặc định

Plugin đi kèm là **thử nghiệm** và **bị tắt theo mặc định** trừ khi được
bật rõ ràng trong `plugins.entries.skill-workshop`.

Manifest của plugin không đặt `enabledByDefault: true`. Mặc định `enabled: true`
bên trong schema cấu hình plugin chỉ áp dụng sau khi mục plugin đã
được chọn và tải.

Thử nghiệm nghĩa là:

- plugin được hỗ trợ đủ cho việc kiểm thử opt-in và dogfooding
- bộ nhớ đề xuất, ngưỡng trình đánh giá và heuristic ghi nhận có thể phát triển
- phê duyệt pending là chế độ khởi đầu được khuyến nghị
- tự động áp dụng dành cho các thiết lập cá nhân/workspace tin cậy, không phải môi trường
  dùng chung hoặc có nhiều đầu vào thù địch

## Bật

Cấu hình an toàn tối thiểu:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

Với cấu hình này:

- công cụ `skill_workshop` khả dụng
- các chỉnh sửa có thể tái sử dụng rõ ràng được đưa vào hàng đợi dưới dạng đề xuất pending
- các lượt đánh giá dựa trên ngưỡng có thể đề xuất cập nhật skill
- không tệp skill nào được ghi cho đến khi một đề xuất pending được áp dụng

Chỉ dùng ghi tự động trong workspace tin cậy:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` vẫn dùng cùng scanner và đường dẫn cách ly. Nó
không áp dụng các đề xuất có phát hiện nghiêm trọng.

## Cấu hình

| Khóa                 | Mặc định    | Phạm vi / giá trị                           | Ý nghĩa                                                              |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Bật plugin sau khi mục plugin được tải.                              |
| `autoCapture`        | `true`      | boolean                                     | Bật ghi nhận/đánh giá sau lượt khi lượt agent thành công.            |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Đưa đề xuất vào hàng đợi hoặc tự động ghi các đề xuất an toàn.       |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Chọn ghi nhận chỉnh sửa rõ ràng, trình đánh giá LLM, cả hai hoặc không cái nào. |
| `reviewInterval`     | `15`        | `1..200`                                    | Chạy trình đánh giá sau số lượt thành công này.                      |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Chạy trình đánh giá sau số lượt gọi công cụ đã quan sát này.         |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Thời gian chờ cho lượt chạy trình đánh giá nhúng.                    |
| `maxPending`         | `50`        | `1..200`                                    | Số đề xuất pending/cách ly tối đa được giữ cho mỗi workspace.        |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | Kích thước tối đa của skill/tệp hỗ trợ được tạo.                     |

Hồ sơ được khuyến nghị:

```json5
// Conservative: explicit tool use only, no automatic capture.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review-first: capture automatically, but require approval.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Trusted automation: write safe proposals immediately.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Low-cost: no reviewer LLM call, only explicit correction phrases.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Đường dẫn ghi nhận

Skill Workshop có ba đường dẫn ghi nhận.

### Đề xuất từ công cụ

Model có thể gọi trực tiếp `skill_workshop` khi thấy một thủ tục có thể tái sử dụng
hoặc khi người dùng yêu cầu lưu/cập nhật một skill.

Đây là đường dẫn rõ ràng nhất và hoạt động ngay cả với `autoCapture: false`.

### Ghi nhận bằng heuristic

Khi `autoCapture` được bật và `reviewMode` là `heuristic` hoặc `hybrid`,
plugin quét các lượt thành công để tìm các cụm từ chỉnh sửa rõ ràng của người dùng:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

Heuristic tạo một đề xuất từ hướng dẫn mới nhất của người dùng khớp mẫu. Nó
dùng gợi ý chủ đề để chọn tên skill cho các workflow phổ biến:

- tác vụ GIF động -> `animated-gif-workflow`
- tác vụ ảnh chụp màn hình hoặc tài sản -> `screenshot-asset-workflow`
- tác vụ QA hoặc kịch bản -> `qa-scenario-workflow`
- tác vụ GitHub PR -> `github-pr-workflow`
- dự phòng -> `learned-workflows`

Ghi nhận bằng heuristic được cố ý giới hạn hẹp. Nó dành cho các chỉnh sửa rõ ràng và
ghi chú quy trình có thể lặp lại, không phải để tóm tắt transcript nói chung.

### Trình đánh giá LLM

Khi `autoCapture` được bật và `reviewMode` là `llm` hoặc `hybrid`, plugin
chạy một trình đánh giá nhúng gọn nhẹ sau khi đạt ngưỡng.

Trình đánh giá nhận:

- văn bản transcript gần đây, giới hạn ở 12.000 ký tự cuối
- tối đa 12 workspace skills hiện có
- tối đa 2.000 ký tự từ mỗi skill hiện có
- hướng dẫn chỉ dùng JSON

Trình đánh giá không có công cụ:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Trình đánh giá trả về `{ "action": "none" }` hoặc một đề xuất. Trường `action` là `create`, `append` hoặc `replace` — ưu tiên `append`/`replace` khi đã có skill liên quan; chỉ dùng `create` khi không có skill hiện có nào phù hợp.

Ví dụ `create`:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

`append` thêm `section` + `body`. `replace` thay `oldText` bằng `newText` trong skill được đặt tên.

## Vòng đời đề xuất

Mọi bản cập nhật được tạo đều trở thành một đề xuất với:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- `agentId` tùy chọn
- `sessionId` tùy chọn
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end` hoặc `reviewer`
- `status`
- `change`
- `scanFindings` tùy chọn
- `quarantineReason` tùy chọn

Trạng thái đề xuất:

- `pending` - đang chờ phê duyệt
- `applied` - đã ghi vào `<workspace>/skills`
- `rejected` - bị người vận hành/mô hình từ chối
- `quarantined` - bị chặn do các phát hiện nghiêm trọng của trình quét

Trạng thái được lưu theo từng không gian làm việc trong thư mục trạng thái Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Các đề xuất đang chờ và bị cách ly được loại bỏ trùng lặp theo tên skill và payload
thay đổi. Kho lưu giữ các đề xuất đang chờ/bị cách ly mới nhất, tối đa
`maxPending`.

## Tham chiếu công cụ

Plugin đăng ký một công cụ agent:

```text
skill_workshop
```

### `status`

Đếm đề xuất theo trạng thái cho không gian làm việc đang hoạt động.

```json
{ "action": "status" }
```

Dạng kết quả:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

Liệt kê các đề xuất đang chờ.

```json
{ "action": "list_pending" }
```

Để liệt kê trạng thái khác:

```json
{ "action": "list_pending", "status": "applied" }
```

Các giá trị `status` hợp lệ:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Liệt kê các đề xuất bị cách ly.

```json
{ "action": "list_quarantine" }
```

Dùng thao tác này khi tính năng thu thập tự động có vẻ không làm gì và nhật ký nhắc đến
`skill-workshop: quarantined <skill>`.

### `inspect`

Lấy một đề xuất theo id.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Tạo một đề xuất. Với `approvalPolicy: "pending"` (mặc định), thao tác này đưa vào hàng đợi thay vì ghi.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

<AccordionGroup>
  <Accordion title="Force a safe write (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

  </Accordion>

  <Accordion title="Force pending under auto policy (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="Append to a named section">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="Replace exact text">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

Áp dụng một đề xuất đang chờ.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` từ chối các đề xuất bị cách ly:

```text
quarantined proposal cannot be applied
```

### `reject`

Đánh dấu một đề xuất là bị từ chối.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

Ghi một tệp hỗ trợ bên trong thư mục skill hiện có hoặc được đề xuất.

Các thư mục hỗ trợ cấp cao nhất được phép:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

Ví dụ:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

Các tệp hỗ trợ được giới hạn theo workspace, kiểm tra theo đường dẫn, giới hạn byte bởi
`maxSkillBytes`, được quét và ghi nguyên tử.

## Ghi skill

Skill Workshop chỉ ghi trong:

```text
<workspace>/skills/<normalized-skill-name>/
```

Tên skill được chuẩn hóa:

- chuyển thành chữ thường
- các chuỗi không phải `[a-z0-9_-]` trở thành `-`
- loại bỏ các ký tự không phải chữ-số ở đầu/cuối
- độ dài tối đa là 80 ký tự
- tên cuối cùng phải khớp `[a-z0-9][a-z0-9_-]{1,79}`

Đối với `create`:

- nếu skill chưa tồn tại, Skill Workshop ghi một `SKILL.md` mới
- nếu đã tồn tại, Skill Workshop nối thêm phần nội dung vào `## Workflow`

Đối với `append`:

- nếu skill tồn tại, Skill Workshop nối thêm vào mục được yêu cầu
- nếu skill không tồn tại, Skill Workshop tạo một skill tối thiểu rồi nối thêm

Đối với `replace`:

- skill phải đã tồn tại
- `oldText` phải hiện diện chính xác
- chỉ lần khớp chính xác đầu tiên được thay thế

Tất cả thao tác ghi đều nguyên tử và làm mới ngay ảnh chụp Skills trong bộ nhớ, để
skill mới hoặc đã cập nhật có thể hiển thị mà không cần khởi động lại Gateway.

## Mô hình an toàn

Skill Workshop có trình quét an toàn trên nội dung `SKILL.md` được tạo và các tệp
hỗ trợ.

Các phát hiện nghiêm trọng sẽ cách ly đề xuất:

| ID quy tắc                             | Chặn nội dung...                                                       |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | yêu cầu agent bỏ qua chỉ dẫn trước đó/cao hơn                         |
| `prompt-injection-system`              | tham chiếu system prompt, thông điệp của developer hoặc chỉ dẫn ẩn    |
| `prompt-injection-tool`                | khuyến khích vượt qua quyền/phê duyệt công cụ                         |
| `shell-pipe-to-shell`                  | bao gồm `curl`/`wget` được pipe vào `sh`, `bash` hoặc `zsh`            |
| `secret-exfiltration`                  | có vẻ gửi dữ liệu env/process env qua mạng                            |

Các phát hiện cảnh báo được giữ lại nhưng tự chúng không chặn:

| ID quy tắc           | Cảnh báo về...                         |
| -------------------- | -------------------------------------- |
| `destructive-delete` | các lệnh kiểu `rm -rf` phạm vi rộng    |
| `unsafe-permissions` | việc dùng quyền kiểu `chmod 777`       |

Đề xuất bị cách ly:

- giữ `scanFindings`
- giữ `quarantineReason`
- xuất hiện trong `list_quarantine`
- không thể được áp dụng qua `apply`

Để khôi phục từ một đề xuất bị cách ly, hãy tạo một đề xuất an toàn mới với nội dung
không an toàn đã được loại bỏ. Không chỉnh sửa JSON lưu trữ bằng tay.

## Hướng dẫn prompt

Khi được bật, Skill Workshop chèn một mục prompt ngắn cho agent biết
hãy dùng `skill_workshop` cho bộ nhớ quy trình bền vững.

Hướng dẫn nhấn mạnh:

- quy trình, không phải sự kiện/sở thích
- các chỉnh sửa của người dùng
- các quy trình thành công nhưng không hiển nhiên
- các lỗi thường lặp lại
- sửa skill cũ/mỏng/sai bằng append/replace
- lưu quy trình có thể tái sử dụng sau các vòng công cụ dài hoặc bản sửa khó
- văn bản skill ngắn gọn ở dạng mệnh lệnh
- không đổ transcript

Văn bản chế độ ghi thay đổi theo `approvalPolicy`:

- chế độ pending: đưa gợi ý vào hàng đợi; chỉ áp dụng sau khi có phê duyệt rõ ràng
- chế độ auto: áp dụng các cập nhật workspace-skill an toàn khi rõ ràng là có thể tái sử dụng

## Chi phí và hành vi runtime

Thu thập theo heuristic không gọi model.

Đánh giá LLM dùng một lần chạy nhúng trên model agent đang hoạt động/mặc định. Cơ chế này
dựa trên ngưỡng nên mặc định không chạy ở mọi lượt.

Reviewer:

- dùng cùng ngữ cảnh provider/model đã cấu hình khi có
- fallback về mặc định của agent runtime
- có `reviewTimeoutMs`
- dùng ngữ cảnh bootstrap nhẹ
- không có công cụ
- không ghi trực tiếp bất cứ thứ gì
- chỉ có thể phát ra một đề xuất đi qua trình quét thông thường và đường dẫn
  phê duyệt/cách ly

Nếu reviewer lỗi, hết thời gian hoặc trả về JSON không hợp lệ, Plugin ghi một
thông điệp cảnh báo/debug và bỏ qua lượt đánh giá đó.

## Mẫu vận hành

Dùng Skill Workshop khi người dùng nói:

- “lần sau, hãy làm X”
- “từ giờ trở đi, ưu tiên Y”
- “đảm bảo xác minh Z”
- “lưu điều này làm workflow”
- “việc này mất khá lâu; hãy nhớ quy trình”
- “cập nhật skill cục bộ cho việc này”

Văn bản skill tốt:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

Văn bản skill kém:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Lý do không nên lưu phiên bản kém:

- có dạng transcript
- không ở dạng mệnh lệnh
- chứa chi tiết một lần gây nhiễu
- không cho agent tiếp theo biết cần làm gì

## Gỡ lỗi

Kiểm tra Plugin đã được tải chưa:

```bash
openclaw plugins list --enabled
```

Kiểm tra số lượng đề xuất từ ngữ cảnh agent/công cụ:

```json
{ "action": "status" }
```

Kiểm tra các đề xuất đang chờ:

```json
{ "action": "list_pending" }
```

Kiểm tra các đề xuất bị cách ly:

```json
{ "action": "list_quarantine" }
```

Triệu chứng thường gặp:

| Triệu chứng                           | Nguyên nhân có thể                                                                  | Kiểm tra                                                             |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Công cụ không khả dụng                | Mục Plugin chưa được bật                                                            | `plugins.entries.skill-workshop.enabled` và `openclaw plugins list`  |
| Không có đề xuất tự động xuất hiện    | `autoCapture: false`, `reviewMode: "off"` hoặc chưa đạt ngưỡng                      | Cấu hình, trạng thái đề xuất, log Gateway                            |
| Heuristic không thu thập              | Cách diễn đạt của người dùng không khớp mẫu chỉnh sửa                               | Dùng `skill_workshop.suggest` rõ ràng hoặc bật reviewer LLM          |
| Reviewer không tạo đề xuất            | Reviewer trả về `none`, JSON không hợp lệ hoặc hết thời gian                        | Log Gateway, `reviewTimeoutMs`, ngưỡng                               |
| Đề xuất không được áp dụng            | `approvalPolicy: "pending"`                                                         | `list_pending`, rồi `apply`                                          |
| Đề xuất biến mất khỏi pending         | Đề xuất trùng lặp được dùng lại, cắt tỉa do vượt tối đa pending, hoặc đã được áp dụng/từ chối/cách ly | `status`, `list_pending` với bộ lọc trạng thái, `list_quarantine`    |
| Tệp skill tồn tại nhưng model bỏ lỡ   | Ảnh chụp skill chưa được làm mới hoặc cổng skill loại trừ nó                        | trạng thái `openclaw skills` và tính đủ điều kiện của workspace skill |

Log liên quan:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## Kịch bản QA

Các kịch bản QA dựa trên repo:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

Chạy coverage xác định:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

Chạy coverage reviewer:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

Kịch bản reviewer được tách riêng có chủ ý vì nó bật
`reviewMode: "llm"` và thực thi lượt reviewer nhúng.

## Khi không nên bật tự động áp dụng

Tránh `approvalPolicy: "auto"` khi:

- workspace chứa các quy trình nhạy cảm
- agent đang làm việc với đầu vào không đáng tin cậy
- Skills được chia sẻ trong một nhóm rộng
- bạn vẫn đang tinh chỉnh prompt hoặc quy tắc quét
- model thường xuyên xử lý nội dung web/email thù địch

Dùng chế độ pending trước. Chỉ chuyển sang chế độ auto sau khi xem xét loại
Skills mà agent đề xuất trong workspace đó.

## Tài liệu liên quan

- [Skills](/vi/tools/skills)
- [Plugins](/vi/tools/plugin)
- [Kiểm thử](/vi/reference/test)
