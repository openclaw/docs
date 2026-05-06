---
read_when:
    - Thêm hoặc sửa đổi cấu hình Skills
    - Điều chỉnh danh sách cho phép được đóng gói hoặc hành vi cài đặt
summary: Lược đồ cấu hình Skills và ví dụ
title: Cấu hình Skills
x-i18n:
    generated_at: "2026-05-06T09:34:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8996b3df73a9f0176b541c5d3f9670615f9a879a41838cf5d35d0a455e9f5088
    source_path: tools/skills-config.md
    workflow: 16
---

Phần lớn cấu hình tải/cài đặt kỹ năng nằm trong `skills` ở
`~/.openclaw/openclaw.json`. Khả năng hiển thị kỹ năng theo từng tác nhân nằm trong
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

Đối với việc tạo/chỉnh sửa hình ảnh tích hợp sẵn, hãy ưu tiên `agents.defaults.imageGenerationModel`
cùng công cụ lõi `image_generate`. `skills.entries.*` chỉ dành cho các quy trình kỹ năng tùy chỉnh hoặc
bên thứ ba.

Nếu bạn chọn một nhà cung cấp/mô hình hình ảnh cụ thể, hãy cấu hình cả khóa xác thực/API
của nhà cung cấp đó. Ví dụ thường gặp: `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY` cho
`google/*`, `OPENAI_API_KEY` cho `openai/*`, và `FAL_KEY` cho `fal/*`.

Ví dụ:

- Thiết lập kiểu Native Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Thiết lập fal gốc: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Danh sách cho phép kỹ năng của tác nhân

Dùng cấu hình tác nhân khi bạn muốn cùng các gốc kỹ năng trên cùng máy/không gian làm việc, nhưng có
một tập kỹ năng hiển thị khác nhau cho từng tác nhân.

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

- `agents.defaults.skills`: danh sách cho phép cơ sở dùng chung cho các tác nhân bỏ qua
  `agents.list[].skills`.
- Bỏ qua `agents.defaults.skills` để mặc định không hạn chế kỹ năng.
- `agents.list[].skills`: tập kỹ năng cuối cùng rõ ràng cho tác nhân đó; nó không
  hợp nhất với giá trị mặc định.
- `agents.list[].skills: []`: không hiển thị kỹ năng nào cho tác nhân đó.

## Trường

- Các gốc kỹ năng tích hợp sẵn luôn bao gồm `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills`, và `<workspace>/skills`.
- `allowBundled`: danh sách cho phép tùy chọn chỉ dành cho các kỹ năng **được đóng gói kèm**. Khi được đặt, chỉ
  các kỹ năng được đóng gói kèm trong danh sách mới đủ điều kiện (không ảnh hưởng đến kỹ năng được quản lý, của tác nhân và của không gian làm việc).
- `load.extraDirs`: các thư mục kỹ năng bổ sung để quét (độ ưu tiên thấp nhất).
- `load.watch`: theo dõi các thư mục kỹ năng và làm mới ảnh chụp kỹ năng (mặc định: true).
- `load.watchDebounceMs`: thời gian chống dội cho các sự kiện trình theo dõi kỹ năng tính bằng mili giây (mặc định: 250).
- `install.preferBrew`: ưu tiên trình cài đặt brew khi có sẵn (mặc định: true).
- `install.nodeManager`: tùy chọn trình cài đặt node (`npm` | `pnpm` | `yarn` | `bun`, mặc định: npm).
  Điều này chỉ ảnh hưởng đến **cài đặt kỹ năng**; runtime của Gateway vẫn nên là Node
  (không khuyến nghị Bun cho WhatsApp/Telegram).
  - `openclaw setup --node-manager` có phạm vi hẹp hơn và hiện chấp nhận `npm`,
    `pnpm`, hoặc `bun`. Đặt `skills.install.nodeManager: "yarn"` thủ công nếu bạn
    muốn cài đặt kỹ năng dựa trên Yarn.
- `entries.<skillKey>`: ghi đè theo từng kỹ năng.
- `agents.defaults.skills`: danh sách cho phép kỹ năng mặc định tùy chọn được kế thừa bởi các tác nhân
  bỏ qua `agents.list[].skills`.
- `agents.list[].skills`: danh sách cho phép kỹ năng cuối cùng tùy chọn theo từng tác nhân; các danh sách rõ ràng
  thay thế giá trị mặc định được kế thừa thay vì hợp nhất.

Các trường theo từng kỹ năng:

- `enabled`: đặt `false` để tắt một kỹ năng ngay cả khi nó được đóng gói kèm/cài đặt.
- `env`: biến môi trường được chèn cho lượt chạy tác nhân (chỉ khi chưa được đặt).
- `apiKey`: tiện ích tùy chọn cho các kỹ năng khai báo một biến môi trường chính.
  Hỗ trợ chuỗi văn bản thuần hoặc đối tượng SecretRef (`{ source, provider, id }`).

## Ghi chú

- Các khóa trong `entries` ánh xạ tới tên kỹ năng theo mặc định. Nếu một kỹ năng định nghĩa
  `metadata.openclaw.skillKey`, hãy dùng khóa đó thay thế.
- Thứ tự ưu tiên tải là `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → kỹ năng được đóng gói kèm →
  `skills.load.extraDirs`.
- Các thay đổi đối với kỹ năng sẽ được nhận ở lượt tác nhân tiếp theo khi trình theo dõi được bật.

### Kỹ năng trong sandbox và biến env

Khi một phiên được chạy trong **sandbox**, các tiến trình kỹ năng chạy bên trong backend sandbox đã cấu hình. Sandbox **không** kế thừa `process.env` của máy chủ.

<Warning>
  `env` toàn cục và `skills.entries.<skill>.env`/`apiKey` chỉ áp dụng cho các lượt chạy trên **máy chủ**. Bên trong sandbox, chúng không có hiệu lực, vì vậy kỹ năng phụ thuộc vào `GEMINI_API_KEY` sẽ thất bại với `apiKey not configured` trừ khi biến đó được cấp riêng cho sandbox.
</Warning>

Dùng một trong các cách sau:

- `agents.defaults.sandbox.docker.env` cho backend Docker (hoặc `agents.list[].sandbox.docker.env` theo từng tác nhân).
- Đưa env vào image sandbox tùy chỉnh hoặc môi trường sandbox từ xa của bạn.

## Liên quan

<CardGroup cols={2}>
  <Card title="Skills" href="/vi/tools/skills" icon="puzzle-piece">
    Kỹ năng là gì và cách chúng được tải.
  </Card>
  <Card title="Tạo kỹ năng" href="/vi/tools/creating-skills" icon="hammer">
    Biên soạn các gói kỹ năng tùy chỉnh.
  </Card>
  <Card title="Lệnh slash" href="/vi/tools/slash-commands" icon="terminal">
    Danh mục lệnh gốc và chỉ thị trò chuyện.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Schema đầy đủ của `skills` và `agents.skills`.
  </Card>
</CardGroup>
