---
read_when:
    - Bạn muốn các agent biến những nội dung chỉnh sửa hoặc quy trình có thể tái sử dụng thành Skills trong không gian làm việc
    - Bạn đang cấu hình bộ nhớ kỹ năng quy trình
    - Bạn đang gỡ lỗi hành vi của công cụ skill_workshop
    - Bạn đang quyết định có bật tính năng tạo Skills tự động hay không
summary: Thử nghiệm ghi nhận các quy trình có thể tái sử dụng dưới dạng Skills trong không gian làm việc, kèm xem xét, phê duyệt, cách ly và làm mới Skills tức thời
title: Plugin xưởng thực hành kỹ năng
x-i18n:
    generated_at: "2026-05-06T09:26:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c4259777823d256bd00374858b9f47d310e727db360db37f9ba7ad3583d9dc
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop đang ở trạng thái **thử nghiệm**. Tính năng này bị tắt theo mặc định, các
heuristic ghi nhận và prompt của bộ đánh giá có thể thay đổi giữa các bản phát hành, và chỉ
nên dùng thao tác ghi tự động trong các workspace đáng tin cậy sau khi xem trước đầu ra
ở chế độ pending.

Skill Workshop là bộ nhớ quy trình dành cho Skills trong workspace. Nó cho phép agent chuyển
các quy trình làm việc có thể tái sử dụng, các chỉnh sửa của người dùng, những bản sửa khó đạt được, và các lỗi thường gặp lặp lại
thành các tệp `SKILL.md` tại:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Điều này khác với bộ nhớ dài hạn:

- **Bộ nhớ** lưu trữ sự kiện, tùy chọn, thực thể, và ngữ cảnh trước đây.
- **Skills** lưu trữ các quy trình có thể tái sử dụng mà agent nên làm theo trong các tác vụ tương lai.
- **Skill Workshop** là cầu nối từ một lượt hữu ích thành một skill bền vững trong workspace
  với các kiểm tra an toàn và tùy chọn phê duyệt.

Skill Workshop hữu ích khi agent học được một quy trình như:

- cách xác thực tài nguyên GIF động có nguồn từ bên ngoài
- cách thay thế tài nguyên ảnh chụp màn hình và xác minh kích thước
- cách chạy một kịch bản QA dành riêng cho repo
- cách gỡ lỗi một lỗi nhà cung cấp lặp lại
- cách sửa một ghi chú quy trình cục bộ đã lỗi thời

Tính năng này không dành cho:

- các sự kiện như "người dùng thích màu xanh dương"
- bộ nhớ tự truyện rộng
- lưu trữ bản ghi thô
- bí mật, thông tin đăng nhập, hoặc văn bản prompt ẩn
- hướng dẫn dùng một lần sẽ không lặp lại

## Trạng thái mặc định

Plugin đi kèm đang ở trạng thái **thử nghiệm** và **bị tắt theo mặc định** trừ khi được
bật rõ ràng trong `plugins.entries.skill-workshop`.

Manifest của plugin không đặt `enabledByDefault: true`. Mặc định `enabled: true`
bên trong schema cấu hình plugin chỉ áp dụng sau khi entry của plugin đã
được chọn và tải.

Thử nghiệm nghĩa là:

- plugin được hỗ trợ đủ để kiểm thử opt-in và tự sử dụng thực tế
- nơi lưu đề xuất, ngưỡng đánh giá, và heuristic ghi nhận có thể phát triển
- phê duyệt pending là chế độ khởi đầu được khuyến nghị
- tự động áp dụng dành cho thiết lập cá nhân/workspace đáng tin cậy, không dành cho môi trường dùng chung hoặc có nhiều đầu vào không đáng tin
  cậy

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

- công cụ `skill_workshop` có sẵn
- các chỉnh sửa có thể tái sử dụng rõ ràng được đưa vào hàng đợi dưới dạng đề xuất pending
- các lượt đánh giá dựa trên ngưỡng có thể đề xuất cập nhật skill
- không tệp skill nào được ghi cho đến khi một đề xuất pending được áp dụng

Chỉ dùng ghi tự động trong các workspace đáng tin cậy:

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
| `enabled`            | `true`      | boolean                                     | Bật plugin sau khi entry của plugin được tải.                        |
| `autoCapture`        | `true`      | boolean                                     | Bật ghi nhận/đánh giá sau lượt khi các lượt agent thành công.        |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Đưa đề xuất vào hàng đợi hoặc tự động ghi các đề xuất an toàn.       |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Chọn ghi nhận chỉnh sửa rõ ràng, bộ đánh giá LLM, cả hai, hoặc không cái nào. |
| `reviewInterval`     | `15`        | `1..200`                                    | Chạy bộ đánh giá sau số lượt thành công này.                         |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Chạy bộ đánh giá sau số lượt gọi công cụ quan sát được này.          |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Thời gian chờ cho lượt chạy bộ đánh giá nhúng.                       |
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

### Đề xuất công cụ

Mô hình có thể gọi trực tiếp `skill_workshop` khi thấy một quy trình có thể tái sử dụng
hoặc khi người dùng yêu cầu lưu/cập nhật một skill.

Đây là đường dẫn rõ ràng nhất và hoạt động ngay cả với `autoCapture: false`.

### Ghi nhận bằng heuristic

Khi `autoCapture` được bật và `reviewMode` là `heuristic` hoặc `hybrid`, plugin
quét các lượt thành công để tìm các cụm từ chỉnh sửa rõ ràng của người dùng:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

Heuristic tạo một đề xuất từ hướng dẫn mới nhất của người dùng khớp mẫu. Nó
dùng gợi ý chủ đề để chọn tên skill cho các quy trình làm việc phổ biến:

- tác vụ GIF động -> `animated-gif-workflow`
- tác vụ ảnh chụp màn hình hoặc tài nguyên -> `screenshot-asset-workflow`
- tác vụ QA hoặc kịch bản -> `qa-scenario-workflow`
- tác vụ GitHub PR -> `github-pr-workflow`
- dự phòng -> `learned-workflows`

Ghi nhận bằng heuristic được cố ý giữ hẹp. Nó dành cho các chỉnh sửa rõ ràng và
ghi chú quy trình có thể lặp lại, không dành cho tóm tắt bản ghi chung.

### Bộ đánh giá LLM

Khi `autoCapture` được bật và `reviewMode` là `llm` hoặc `hybrid`, plugin
chạy một bộ đánh giá nhúng gọn nhẹ sau khi đạt các ngưỡng.

Bộ đánh giá nhận:

- văn bản bản ghi gần đây, giới hạn ở 12.000 ký tự cuối
- tối đa 12 skill hiện có trong workspace
- tối đa 2.000 ký tự từ mỗi skill hiện có
- hướng dẫn chỉ dùng JSON

Bộ đánh giá không có công cụ:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Bộ đánh giá trả về `{ "action": "none" }` hoặc một đề xuất. Trường `action` là `create`, `append`, hoặc `replace` - ưu tiên `append`/`replace` khi đã có skill liên quan; chỉ dùng `create` khi không có skill hiện có nào phù hợp.

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

Mỗi cập nhật được tạo sẽ trở thành một đề xuất với:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- `agentId` tùy chọn
- `sessionId` tùy chọn
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end`, hoặc `reviewer`
- `status`
- `change`
- `scanFindings` tùy chọn
- `quarantineReason` tùy chọn

Trạng thái đề xuất:

- `pending` - đang chờ phê duyệt
- `applied` - đã được ghi vào `<workspace>/skills`
- `rejected` - bị người vận hành/mô hình từ chối
- `quarantined` - bị chặn do phát hiện nghiêm trọng từ trình quét

Trạng thái được lưu theo từng không gian làm việc trong thư mục trạng thái Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Các đề xuất đang chờ và bị cách ly được khử trùng lặp theo tên skill và payload
thay đổi. Kho lưu trữ giữ các đề xuất đang chờ/bị cách ly mới nhất tối đa đến
`maxPending`.

## Tham chiếu công cụ

Plugin đăng ký một công cụ tác nhân:

```text
skill_workshop
```

### `status`

Đếm đề xuất theo trạng thái cho không gian làm việc đang hoạt động.

```json
{ "action": "status" }
```

Hình dạng kết quả:

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

Để liệt kê một trạng thái khác:

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

Dùng thao tác này khi việc thu thập tự động có vẻ không làm gì và nhật ký nhắc đến
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
  <Accordion title="Buộc ghi an toàn (apply: true)">

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

  <Accordion title="Buộc trạng thái đang chờ theo chính sách tự động (apply: false)">

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

  <Accordion title="Nối vào một phần đã đặt tên">

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

  <Accordion title="Thay thế văn bản chính xác">

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

Ghi một tệp hỗ trợ bên trong một thư mục skill hiện có hoặc được đề xuất.

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

Các tệp hỗ trợ được giới hạn theo workspace, kiểm tra đường dẫn, giới hạn byte bởi
`maxSkillBytes`, quét và ghi nguyên tử.

## Ghi skill

Skill Workshop chỉ ghi bên dưới:

```text
<workspace>/skills/<normalized-skill-name>/
```

Tên skill được chuẩn hóa:

- chuyển thành chữ thường
- các chuỗi không phải `[a-z0-9_-]` trở thành `-`
- ký tự không phải chữ-số ở đầu/cuối bị loại bỏ
- độ dài tối đa là 80 ký tự
- tên cuối cùng phải khớp `[a-z0-9][a-z0-9_-]{1,79}`

Với `create`:

- nếu skill không tồn tại, Skill Workshop ghi một `SKILL.md` mới
- nếu đã tồn tại, Skill Workshop nối phần thân vào `## Workflow`

Với `append`:

- nếu skill tồn tại, Skill Workshop nối vào phần được yêu cầu
- nếu không tồn tại, Skill Workshop tạo một skill tối thiểu rồi nối thêm

Với `replace`:

- skill phải đã tồn tại
- `oldText` phải có mặt chính xác
- chỉ kết quả khớp chính xác đầu tiên được thay thế

Mọi thao tác ghi đều nguyên tử và làm mới ảnh chụp nhanh skills trong bộ nhớ ngay lập tức, vì vậy
skill mới hoặc đã cập nhật có thể hiển thị mà không cần khởi động lại Gateway.

## Mô hình an toàn

Skill Workshop có một bộ quét an toàn trên nội dung `SKILL.md` được tạo và các tệp
hỗ trợ.

Các phát hiện nghiêm trọng sẽ cách ly đề xuất:

| ID quy tắc                              | Chặn nội dung...                                                       |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | bảo agent bỏ qua chỉ dẫn trước đó/cấp cao hơn                         |
| `prompt-injection-system`              | tham chiếu system prompt, developer message hoặc chỉ dẫn ẩn           |
| `prompt-injection-tool`                | khuyến khích vượt qua quyền/phê duyệt công cụ                         |
| `shell-pipe-to-shell`                  | bao gồm `curl`/`wget` được pipe vào `sh`, `bash` hoặc `zsh`            |
| `secret-exfiltration`                  | có vẻ gửi dữ liệu env/process env qua mạng                            |

Các phát hiện cảnh báo được giữ lại nhưng tự chúng không chặn:

| ID quy tắc           | Cảnh báo khi...                    |
| -------------------- | ---------------------------------- |
| `destructive-delete` | lệnh kiểu `rm -rf` phạm vi rộng    |
| `unsafe-permissions` | dùng quyền kiểu `chmod 777`        |

Các đề xuất bị cách ly:

- giữ `scanFindings`
- giữ `quarantineReason`
- xuất hiện trong `list_quarantine`
- không thể được áp dụng qua `apply`

Để khôi phục từ một đề xuất bị cách ly, hãy tạo một đề xuất an toàn mới với
nội dung không an toàn đã được loại bỏ. Không chỉnh sửa JSON lưu trữ bằng tay.

## Hướng dẫn prompt

Khi được bật, Skill Workshop chèn một phần prompt ngắn yêu cầu agent
dùng `skill_workshop` cho bộ nhớ quy trình lâu bền.

Hướng dẫn nhấn mạnh:

- quy trình, không phải sự kiện/tùy chọn
- chỉnh sửa của người dùng
- các quy trình thành công không hiển nhiên
- các lỗi lặp lại
- sửa skill lỗi thời/mỏng/sai bằng append/replace
- lưu quy trình tái sử dụng sau các vòng lặp công cụ dài hoặc bản sửa khó
- văn bản skill ngắn dạng mệnh lệnh
- không đổ transcript

Văn bản chế độ ghi thay đổi theo `approvalPolicy`:

- chế độ pending: xếp hàng gợi ý; chỉ áp dụng sau khi được phê duyệt rõ ràng
- chế độ auto: áp dụng các cập nhật workspace-skill an toàn khi rõ ràng có thể tái sử dụng

## Chi phí và hành vi runtime

Chụp heuristic không gọi model.

Đánh giá LLM dùng một lần chạy nhúng trên model agent đang hoạt động/mặc định. Nó
dựa trên ngưỡng nên mặc định không chạy ở mọi lượt.

Bộ đánh giá:

- dùng cùng ngữ cảnh provider/model đã cấu hình khi có
- fallback về mặc định agent runtime
- có `reviewTimeoutMs`
- dùng ngữ cảnh bootstrap nhẹ
- không có công cụ
- không ghi trực tiếp
- chỉ có thể phát ra một đề xuất đi qua bộ quét thông thường và đường dẫn
  phê duyệt/cách ly

Nếu bộ đánh giá thất bại, hết thời gian hoặc trả về JSON không hợp lệ, plugin ghi
thông báo warning/debug và bỏ qua lượt đánh giá đó.

## Mẫu vận hành

Dùng Skill Workshop khi người dùng nói:

- "lần sau, hãy làm X"
- "từ giờ trở đi, ưu tiên Y"
- "hãy nhớ xác minh Z"
- "lưu nội dung này làm workflow"
- "việc này mất khá lâu; hãy nhớ quy trình"
- "cập nhật skill cục bộ cho việc này"

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

Lý do phiên bản kém không nên được lưu:

- giống transcript
- không ở dạng mệnh lệnh
- chứa chi tiết một lần gây nhiễu
- không cho agent tiếp theo biết phải làm gì

## Gỡ lỗi

Kiểm tra plugin đã được tải chưa:

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

| Triệu chứng                           | Nguyên nhân có khả năng                                                           | Kiểm tra                                                             |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Công cụ không khả dụng                | Mục plugin chưa được bật                                                            | `plugins.entries.skill-workshop.enabled` và `openclaw plugins list` |
| Không có đề xuất tự động xuất hiện    | `autoCapture: false`, `reviewMode: "off"` hoặc chưa đạt ngưỡng                     | Cấu hình, trạng thái đề xuất, log Gateway                            |
| Heuristic không chụp                  | Cách diễn đạt của người dùng không khớp mẫu chỉnh sửa                              | Dùng `skill_workshop.suggest` rõ ràng hoặc bật bộ đánh giá LLM       |
| Bộ đánh giá không tạo đề xuất         | Bộ đánh giá trả về `none`, JSON không hợp lệ hoặc hết thời gian                    | Log Gateway, `reviewTimeoutMs`, ngưỡng                               |
| Đề xuất không được áp dụng            | `approvalPolicy: "pending"`                                                        | `list_pending`, rồi `apply`                                          |
| Đề xuất biến mất khỏi pending         | Đề xuất trùng lặp được tái sử dụng, cắt bớt pending tối đa, hoặc đã được áp dụng/từ chối/cách ly | `status`, `list_pending` với bộ lọc trạng thái, `list_quarantine`      |
| Tệp skill tồn tại nhưng model bỏ lỡ   | Ảnh chụp nhanh skill chưa được làm mới hoặc cổng skill loại trừ nó                 | trạng thái `openclaw skills` và điều kiện hợp lệ của workspace skill |

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

Chạy coverage bộ đánh giá:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

Kịch bản bộ đánh giá được tách riêng có chủ ý vì nó bật
`reviewMode: "llm"` và thực thi lượt bộ đánh giá nhúng.

## Khi không nên bật tự động áp dụng

Tránh `approvalPolicy: "auto"` khi:

- workspace chứa các quy trình nhạy cảm
- agent đang làm việc với đầu vào không đáng tin cậy
- skills được chia sẻ trong một nhóm rộng
- bạn vẫn đang tinh chỉnh prompt hoặc quy tắc bộ quét
- model thường xuyên xử lý nội dung web/email thù địch

Trước tiên hãy dùng chế độ pending. Chỉ chuyển sang chế độ auto sau khi xem xét loại
skills mà agent đề xuất trong workspace đó.

## Tài liệu liên quan

- [Skills](/vi/tools/skills)
- [Plugins](/vi/tools/plugin)
- [Kiểm thử](/vi/reference/test)
