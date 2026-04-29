---
read_when:
    - Thêm hoặc sửa đổi cấu hình Skills
    - Điều chỉnh danh sách cho phép đi kèm hoặc hành vi cài đặt
summary: Lược đồ cấu hình Skills và ví dụ
title: Cấu hình Skills
x-i18n:
    generated_at: "2026-04-29T23:21:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d5e156adb9b88d7ade1976005c11faffe5107661e4f3da5d878cc0ac648bcbb
    source_path: tools/skills-config.md
    workflow: 16
---

Hầu hết cấu hình tải/cài đặt kỹ năng nằm trong `skills` trong
`~/.openclaw/openclaw.json`. Khả năng hiển thị kỹ năng theo từng tác tử nằm trong
`agents.defaults.skills` và `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Đối với tạo/chỉnh sửa hình ảnh tích hợp sẵn, hãy ưu tiên `agents.defaults.imageGenerationModel`
cùng với công cụ lõi `image_generate`. `skills.entries.*` chỉ dành cho quy trình kỹ năng tùy chỉnh hoặc
của bên thứ ba.

Nếu bạn chọn một nhà cung cấp/mô hình hình ảnh cụ thể, hãy cấu hình thêm thông tin xác thực/khóa API
của nhà cung cấp đó. Ví dụ điển hình: `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY` cho
`google/*`, `OPENAI_API_KEY` cho `openai/*`, và `FAL_KEY` cho `fal/*`.

Ví dụ:

- Thiết lập kiểu Nano Banana Pro gốc: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Thiết lập fal gốc: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Danh sách cho phép kỹ năng của tác tử

Dùng cấu hình tác tử khi bạn muốn dùng cùng các gốc kỹ năng trên máy/workspace,
nhưng mỗi tác tử có một tập kỹ năng hiển thị khác nhau.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits defaults -> github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

Quy tắc:

- `agents.defaults.skills`: danh sách cho phép nền tảng dùng chung cho các tác tử bỏ qua
  `agents.list[].skills`.
- Bỏ qua `agents.defaults.skills` để mặc định không hạn chế kỹ năng.
- `agents.list[].skills`: tập kỹ năng cuối cùng rõ ràng cho tác tử đó; nó không
  hợp nhất với mặc định.
- `agents.list[].skills: []`: không hiển thị kỹ năng nào cho tác tử đó.

## Trường

- Các gốc kỹ năng tích hợp sẵn luôn bao gồm `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills`, và `<workspace>/skills`.
- `allowBundled`: danh sách cho phép tùy chọn chỉ dành cho kỹ năng **được đóng gói kèm**. Khi được đặt, chỉ
  các kỹ năng được đóng gói kèm trong danh sách mới đủ điều kiện (không ảnh hưởng đến kỹ năng được quản lý, của tác tử và workspace).
- `load.extraDirs`: các thư mục kỹ năng bổ sung để quét (độ ưu tiên thấp nhất).
- `load.watch`: theo dõi các thư mục kỹ năng và làm mới snapshot kỹ năng (mặc định: true).
- `load.watchDebounceMs`: thời gian debounce cho sự kiện của trình theo dõi kỹ năng, tính bằng mili giây (mặc định: 250).
- `install.preferBrew`: ưu tiên trình cài đặt brew khi có sẵn (mặc định: true).
- `install.nodeManager`: tùy chọn trình cài đặt node (`npm` | `pnpm` | `yarn` | `bun`, mặc định: npm).
  Điều này chỉ ảnh hưởng đến **cài đặt kỹ năng**; runtime của Gateway vẫn nên là Node
  (không khuyến nghị Bun cho WhatsApp/Telegram).
  - `openclaw setup --node-manager` có phạm vi hẹp hơn và hiện chấp nhận `npm`,
    `pnpm`, hoặc `bun`. Đặt thủ công `skills.install.nodeManager: "yarn"` nếu bạn
    muốn cài đặt kỹ năng dựa trên Yarn.
- `entries.<skillKey>`: ghi đè theo từng kỹ năng.
- `agents.defaults.skills`: danh sách cho phép kỹ năng mặc định tùy chọn được các tác tử kế thừa
  khi bỏ qua `agents.list[].skills`.
- `agents.list[].skills`: danh sách cho phép kỹ năng cuối cùng tùy chọn theo từng tác tử; các
  danh sách rõ ràng thay thế mặc định được kế thừa thay vì hợp nhất.

Trường theo từng kỹ năng:

- `enabled`: đặt `false` để tắt một kỹ năng ngay cả khi kỹ năng đó được đóng gói kèm/đã cài đặt.
- `env`: biến môi trường được chèn cho lần chạy tác tử (chỉ khi chưa được đặt).
- `apiKey`: tiện ích tùy chọn cho các kỹ năng khai báo một biến môi trường chính.
  Hỗ trợ chuỗi văn bản thuần hoặc đối tượng SecretRef (`{ source, provider, id }`).

## Ghi chú

- Các khóa trong `entries` mặc định ánh xạ tới tên kỹ năng. Nếu một kỹ năng định nghĩa
  `metadata.openclaw.skillKey`, hãy dùng khóa đó thay thế.
- Thứ tự ưu tiên tải là `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → kỹ năng được đóng gói kèm →
  `skills.load.extraDirs`.
- Các thay đổi đối với kỹ năng sẽ được nhận ở lượt tác tử tiếp theo khi trình theo dõi được bật.

### Kỹ năng trong sandbox + biến môi trường

Khi một phiên được chạy **trong sandbox**, các tiến trình kỹ năng chạy bên trong
backend sandbox đã cấu hình. Sandbox **không** kế thừa `process.env` của máy chủ.

Dùng một trong các cách sau:

- `agents.defaults.sandbox.docker.env` cho backend Docker (hoặc `agents.list[].sandbox.docker.env` theo từng tác tử)
- đưa env vào image sandbox tùy chỉnh hoặc môi trường sandbox từ xa của bạn

`env` toàn cục và `skills.entries.<skill>.env/apiKey` chỉ áp dụng cho các lần chạy trên **máy chủ**.

## Liên quan

- [Skills](/vi/tools/skills)
- [Tạo kỹ năng](/vi/tools/creating-skills)
- [Lệnh gạch chéo](/vi/tools/slash-commands)
