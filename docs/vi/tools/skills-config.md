---
read_when:
    - Thêm hoặc sửa đổi cấu hình Skills
    - Điều chỉnh danh sách cho phép được đóng gói hoặc hành vi cài đặt
summary: Lược đồ cấu hình Skills và ví dụ
title: Cấu hình Skills
x-i18n:
    generated_at: "2026-05-10T19:54:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7dad312d69c93544d8e7f9537fdd50f02345166ea629291160a30f19f0a8b340
    source_path: tools/skills-config.md
    workflow: 16
---

Hầu hết cấu hình tải/cài đặt Skills nằm dưới `skills` trong
`~/.openclaw/openclaw.json`. Khả năng hiển thị Skills riêng cho từng tác tử nằm dưới
`agents.defaults.skills` và `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
      allowUploadedArchives: false,
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

Đối với tạo/chỉnh sửa hình ảnh tích hợp sẵn, nên dùng `agents.defaults.imageGenerationModel`
cùng với công cụ lõi `image_generate`. `skills.entries.*` chỉ dành cho các quy trình
Skills tùy chỉnh hoặc của bên thứ ba.

Nếu bạn chọn một nhà cung cấp/mô hình hình ảnh cụ thể, cũng hãy cấu hình xác thực/khóa API
của nhà cung cấp đó. Ví dụ điển hình: `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY` cho
`google/*`, `OPENAI_API_KEY` cho `openai/*`, và `FAL_KEY` cho `fal/*`.

Ví dụ:

- Thiết lập tích hợp sẵn kiểu Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Thiết lập fal tích hợp sẵn: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Danh sách cho phép Skills của tác tử

Dùng cấu hình tác tử khi bạn muốn giữ cùng các gốc Skills trên máy/không gian làm việc,
nhưng có một tập Skills hiển thị khác nhau cho từng tác tử.

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

- `agents.defaults.skills`: danh sách cho phép cơ sở dùng chung cho các tác tử bỏ qua
  `agents.list[].skills`.
- Bỏ qua `agents.defaults.skills` để mặc định không hạn chế Skills.
- `agents.list[].skills`: tập Skills cuối cùng rõ ràng cho tác tử đó; nó không
  hợp nhất với mặc định.
- `agents.list[].skills: []`: không hiển thị Skills nào cho tác tử đó.

## Trường

- Các gốc Skills tích hợp sẵn luôn bao gồm `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills`, và `<workspace>/skills`.
- `allowBundled`: danh sách cho phép tùy chọn chỉ dành cho Skills **đóng gói kèm**. Khi được đặt, chỉ
  các Skills đóng gói kèm trong danh sách mới đủ điều kiện (Skills được quản lý, của tác tử, và của không gian làm việc không bị ảnh hưởng).
- `load.extraDirs`: các thư mục Skills bổ sung cần quét (độ ưu tiên thấp nhất).
- `load.allowSymlinkTargets`: các thư mục đích thực đáng tin cậy mà những thư mục
  Skills được liên kết tượng trưng có thể phân giải vào, ngay cả khi liên kết tượng trưng nằm bên ngoài
  gốc đích đó. Dùng mục này cho các bố cục kho lưu trữ ngang hàng có chủ ý, chẳng hạn như
  `~/.agents/skills/manager -> ~/Projects/manager/skills`.
- `load.watch`: theo dõi các thư mục Skills và làm mới ảnh chụp Skills (mặc định: true).
- `load.watchDebounceMs`: thời gian gom sự kiện cho trình theo dõi Skills, tính bằng mili giây (mặc định: 250).
- `install.preferBrew`: ưu tiên trình cài đặt brew khi có sẵn (mặc định: true).
- `install.nodeManager`: lựa chọn ưu tiên trình cài đặt Node (`npm` | `pnpm` | `yarn` | `bun`, mặc định: npm).
  Điều này chỉ ảnh hưởng đến **cài đặt Skills**; runtime Gateway vẫn nên là Node
  (không khuyến nghị dùng Bun cho WhatsApp/Telegram).
  - `openclaw setup --node-manager` có phạm vi hẹp hơn và hiện chấp nhận `npm`,
    `pnpm`, hoặc `bun`. Đặt `skills.install.nodeManager: "yarn"` thủ công nếu bạn
    muốn các lượt cài đặt Skills dựa trên Yarn.
- `install.allowUploadedArchives`: cho phép các máy khách Gateway `operator.admin` đáng tin cậy
  cài đặt kho nén zip riêng tư được chuẩn bị thông qua `skills.upload.*`
  (mặc định: false). Điều này chỉ bật luồng kho nén đã tải lên; các lượt cài đặt ClawHub
  thông thường không cần nó.
- `entries.<skillKey>`: ghi đè theo từng Skills.
- `agents.defaults.skills`: danh sách cho phép Skills mặc định tùy chọn được các tác tử kế thừa
  khi bỏ qua `agents.list[].skills`.
- `agents.list[].skills`: danh sách cho phép Skills cuối cùng tùy chọn theo từng tác tử; các
  danh sách rõ ràng thay thế mặc định kế thừa thay vì hợp nhất.

## Kho lưu trữ ngang hàng được liên kết tượng trưng

Theo mặc định, mỗi gốc Skills là một ranh giới bao chứa. Nếu một thư mục Skills dưới
`~/.agents/skills` là một liên kết tượng trưng phân giải ra ngoài `~/.agents/skills`,
OpenClaw bỏ qua nó và ghi log `Skipping escaped skill path outside its configured
root`.

Giữ bố cục liên kết tượng trưng và chỉ cho phép gốc đích đáng tin cậy:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Với cấu hình này, một liên kết tượng trưng như
`~/.agents/skills/manager -> ~/Projects/manager/skills` được chấp nhận sau khi
phân giải đường dẫn thực. `extraDirs` cũng quét trực tiếp kho lưu trữ ngang hàng, trong khi
`allowSymlinkTargets` giữ nguyên đường dẫn được liên kết tượng trưng cho các bố cục
Skills của tác tử hiện có. Giữ các mục đích ở phạm vi hẹp; đừng trỏ tới các gốc rộng như `~` hoặc
`~/Projects` trừ khi mọi cây Skills dưới gốc đó đều đáng tin cậy.

Các trường theo từng Skills:

- `enabled`: đặt `false` để tắt một Skills ngay cả khi nó được đóng gói kèm/đã cài đặt.
- `env`: các biến môi trường được chèn cho lượt chạy của tác tử (chỉ khi chưa được đặt).
- `apiKey`: tiện ích tùy chọn cho Skills khai báo một biến môi trường chính.
  Hỗ trợ chuỗi văn bản thuần hoặc đối tượng SecretRef (`{ source, provider, id }`).

## Ghi chú

- Theo mặc định, các khóa dưới `entries` ánh xạ tới tên Skills. Nếu một Skills định nghĩa
  `metadata.openclaw.skillKey`, hãy dùng khóa đó thay thế.
- Thứ tự ưu tiên tải là `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills đóng gói kèm →
  `skills.load.extraDirs`.
- Các thay đổi với Skills được nhận ở lượt tác tử tiếp theo khi trình theo dõi được bật.

### Skills chạy trong môi trường cách ly và biến môi trường

Khi một phiên **chạy trong môi trường cách ly**, các tiến trình Skills chạy bên trong nền tảng thực thi môi trường cách ly đã cấu hình. Môi trường cách ly **không** kế thừa `process.env` của môi trường chủ.

<Warning>
  `env` toàn cục và `skills.entries.<skill>.env`/`apiKey` chỉ áp dụng cho các lượt chạy trên môi trường chủ. Bên trong môi trường cách ly, chúng không có hiệu lực, vì vậy một Skills phụ thuộc vào `GEMINI_API_KEY` sẽ thất bại với `apiKey not configured` trừ khi biến đó được cấp riêng cho môi trường cách ly.
</Warning>

Dùng một trong các cách sau:

- `agents.defaults.sandbox.docker.env` cho nền tảng Docker (hoặc `agents.list[].sandbox.docker.env` theo từng tác tử).
- Đưa biến môi trường vào ảnh môi trường cách ly tùy chỉnh hoặc môi trường cách ly từ xa của bạn.

## Liên quan

<CardGroup cols={2}>
  <Card title="Skills" href="/vi/tools/skills" icon="puzzle-piece">
    Skills là gì và cách chúng được tải.
  </Card>
  <Card title="Tạo Skills" href="/vi/tools/creating-skills" icon="hammer">
    Soạn các gói Skills tùy chỉnh.
  </Card>
  <Card title="Lệnh dấu gạch chéo" href="/vi/tools/slash-commands" icon="terminal">
    Danh mục lệnh tích hợp sẵn và chỉ thị trò chuyện.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Schema đầy đủ của `skills` và `agents.skills`.
  </Card>
</CardGroup>
