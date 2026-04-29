---
read_when:
    - Bạn cần giải thích không gian làm việc của tác nhân hoặc bố cục tệp của nó
    - Bạn muốn sao lưu hoặc di chuyển không gian làm việc của tác tử
sidebarTitle: Agent workspace
summary: 'Không gian làm việc của tác tử: vị trí, bố cục và chiến lược sao lưu'
title: Không gian làm việc của tác nhân
x-i18n:
    generated_at: "2026-04-29T22:35:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35d59d1f0dec05db30f9166a43bfa519d7299b08d093bbeb905d8f83e5cd022a
    source_path: concepts/agent-workspace.md
    workflow: 16
---

Không gian làm việc là nhà của agent. Đây là thư mục làm việc duy nhất được dùng cho các công cụ tệp và ngữ cảnh không gian làm việc. Hãy giữ nó riêng tư và xem nó như bộ nhớ.

Điều này tách biệt với `~/.openclaw/`, nơi lưu cấu hình, thông tin xác thực và phiên.

<Warning>
Không gian làm việc là **cwd mặc định**, không phải sandbox cứng. Các công cụ phân giải đường dẫn tương đối theo không gian làm việc, nhưng đường dẫn tuyệt đối vẫn có thể truy cập nơi khác trên máy chủ trừ khi sandboxing được bật. Nếu bạn cần cô lập, hãy dùng [`agents.defaults.sandbox`](/vi/gateway/sandboxing) (và/hoặc cấu hình sandbox theo từng agent).

Khi sandboxing được bật và `workspaceAccess` không phải `"rw"`, các công cụ hoạt động bên trong một không gian làm việc sandbox dưới `~/.openclaw/sandboxes`, không phải không gian làm việc trên máy chủ của bạn.
</Warning>

## Vị trí mặc định

- Mặc định: `~/.openclaw/workspace`
- Nếu `OPENCLAW_PROFILE` được đặt và không phải `"default"`, mặc định trở thành `~/.openclaw/workspace-<profile>`.
- Ghi đè trong `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure`, hoặc `openclaw setup` sẽ tạo không gian làm việc và thêm các tệp bootstrap nếu chúng bị thiếu.

<Note>
Bản sao seed sandbox chỉ chấp nhận các tệp thông thường nằm trong không gian làm việc; các alias symlink/hardlink phân giải ra ngoài không gian làm việc nguồn sẽ bị bỏ qua.
</Note>

Nếu bạn đã tự quản lý các tệp không gian làm việc, bạn có thể tắt việc tạo tệp bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Thư mục không gian làm việc bổ sung

Các bản cài đặt cũ hơn có thể đã tạo `~/openclaw`. Giữ nhiều thư mục không gian làm việc có thể gây trôi trạng thái hoặc xác thực khó hiểu, vì mỗi lần chỉ có một không gian làm việc hoạt động.

<Note>
**Khuyến nghị:** giữ một không gian làm việc hoạt động duy nhất. Nếu bạn không còn dùng các thư mục bổ sung, hãy lưu trữ hoặc chuyển chúng vào Thùng rác (ví dụ `trash ~/openclaw`). Nếu bạn cố ý giữ nhiều không gian làm việc, hãy bảo đảm `agents.defaults.workspace` trỏ đến không gian làm việc đang hoạt động.

`openclaw doctor` cảnh báo khi phát hiện các thư mục không gian làm việc bổ sung.
</Note>

## Bản đồ tệp không gian làm việc

Đây là các tệp chuẩn mà OpenClaw mong đợi bên trong không gian làm việc:

<AccordionGroup>
  <Accordion title="AGENTS.md — operating instructions">
    Hướng dẫn vận hành cho agent và cách agent nên sử dụng bộ nhớ. Được tải khi bắt đầu mọi phiên. Đây là nơi phù hợp cho quy tắc, ưu tiên và chi tiết về "cách hành xử".
  </Accordion>
  <Accordion title="SOUL.md — persona and tone">
    Persona, giọng điệu và ranh giới. Được tải trong mọi phiên. Hướng dẫn: [hướng dẫn tính cách SOUL.md](/vi/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — who the user is">
    Người dùng là ai và cách xưng hô với họ. Được tải trong mọi phiên.
  </Accordion>
  <Accordion title="IDENTITY.md — name, vibe, emoji">
    Tên, phong cách và emoji của agent. Được tạo/cập nhật trong nghi thức bootstrap.
  </Accordion>
  <Accordion title="TOOLS.md — local tool conventions">
    Ghi chú về các công cụ cục bộ và quy ước của bạn. Không kiểm soát khả dụng của công cụ; chỉ là hướng dẫn.
  </Accordion>
  <Accordion title="HEARTBEAT.md — heartbeat checklist">
    Checklist nhỏ tùy chọn cho các lần chạy Heartbeat. Giữ ngắn để tránh tốn token.
  </Accordion>
  <Accordion title="BOOT.md — startup checklist">
    Checklist khởi động tùy chọn được chạy tự động khi Gateway khởi động lại (khi [hook nội bộ](/vi/automation/hooks) được bật). Giữ ngắn; dùng công cụ message cho các lần gửi ra ngoài.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — first-run ritual">
    Nghi thức chạy lần đầu một lần duy nhất. Chỉ được tạo cho không gian làm việc hoàn toàn mới. Xóa nó sau khi nghi thức hoàn tất.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — daily memory log">
    Nhật ký bộ nhớ hằng ngày (một tệp mỗi ngày). Khuyến nghị đọc hôm nay + hôm qua khi bắt đầu phiên.
  </Accordion>
  <Accordion title="MEMORY.md — curated long-term memory (optional)">
    Bộ nhớ dài hạn đã tuyển chọn. Chỉ tải trong phiên chính, riêng tư (không phải ngữ cảnh chia sẻ/nhóm). Xem [Bộ nhớ](/vi/concepts/memory) để biết quy trình và việc xả bộ nhớ tự động.
  </Accordion>
  <Accordion title="skills/ — workspace skills (optional)">
    Skills dành riêng cho không gian làm việc. Vị trí skill có độ ưu tiên cao nhất cho không gian làm việc đó. Ghi đè Skills của agent dự án, Skills của agent cá nhân, Skills được quản lý, Skills đi kèm và `skills.load.extraDirs` khi tên trùng nhau.
  </Accordion>
  <Accordion title="canvas/ — Canvas UI files (optional)">
    Các tệp giao diện Canvas cho hiển thị node (ví dụ `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Nếu thiếu bất kỳ tệp bootstrap nào, OpenClaw chèn marker "tệp bị thiếu" vào phiên và tiếp tục. Các tệp bootstrap lớn bị cắt ngắn khi được chèn; điều chỉnh giới hạn bằng `agents.defaults.bootstrapMaxChars` (mặc định: 12000) và `agents.defaults.bootstrapTotalMaxChars` (mặc định: 60000). `openclaw setup` có thể tạo lại mặc định bị thiếu mà không ghi đè các tệp hiện có.
</Note>

## Những gì KHÔNG nằm trong không gian làm việc

Những mục này nằm dưới `~/.openclaw/` và KHÔNG nên được commit vào repo không gian làm việc:

- `~/.openclaw/openclaw.json` (cấu hình)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (hồ sơ xác thực mô hình: OAuth + API key)
- `~/.openclaw/credentials/` (trạng thái kênh/nhà cung cấp cộng với dữ liệu nhập OAuth cũ)
- `~/.openclaw/agents/<agentId>/sessions/` (bản ghi phiên + metadata)
- `~/.openclaw/skills/` (Skills được quản lý)

Nếu bạn cần di chuyển phiên hoặc cấu hình, hãy sao chép chúng riêng và giữ chúng ngoài kiểm soát phiên bản.

## Sao lưu Git (khuyến nghị, riêng tư)

Xem không gian làm việc như bộ nhớ riêng tư. Đưa nó vào một repo git **riêng tư** để được sao lưu và có thể khôi phục.

Chạy các bước này trên máy nơi Gateway chạy (đó là nơi không gian làm việc tồn tại).

<Steps>
  <Step title="Initialize the repo">
    Nếu git đã được cài đặt, các không gian làm việc hoàn toàn mới được khởi tạo tự động. Nếu không gian làm việc này chưa phải là repo, hãy chạy:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Add a private remote">
    <Tabs>
      <Tab title="GitHub web UI">
        1. Tạo một repository **riêng tư** mới trên GitHub.
        2. Không khởi tạo với README (tránh xung đột merge).
        3. Sao chép URL remote HTTPS.
        4. Thêm remote và push:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="GitLab web UI">
        1. Tạo một repository **riêng tư** mới trên GitLab.
        2. Không khởi tạo với README (tránh xung đột merge).
        3. Sao chép URL remote HTTPS.
        4. Thêm remote và push:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Ongoing updates">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## Không commit bí mật

<Warning>
Ngay cả trong repo riêng tư, hãy tránh lưu bí mật trong không gian làm việc:

- API key, token OAuth, mật khẩu hoặc thông tin xác thực riêng tư.
- Bất kỳ thứ gì dưới `~/.openclaw/`.
- Bản dump thô của cuộc trò chuyện hoặc tệp đính kèm nhạy cảm.

Nếu bạn phải lưu tham chiếu nhạy cảm, hãy dùng placeholder và giữ bí mật thật ở nơi khác (trình quản lý mật khẩu, biến môi trường hoặc `~/.openclaw/`).
</Warning>

Mẫu khởi đầu `.gitignore` được đề xuất:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Di chuyển không gian làm việc sang máy mới

<Steps>
  <Step title="Clone the repo">
    Clone repo đến đường dẫn mong muốn (mặc định `~/.openclaw/workspace`).
  </Step>
  <Step title="Update config">
    Đặt `agents.defaults.workspace` thành đường dẫn đó trong `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Seed missing files">
    Chạy `openclaw setup --workspace <path>` để seed bất kỳ tệp nào bị thiếu.
  </Step>
  <Step title="Copy sessions (optional)">
    Nếu bạn cần phiên, hãy sao chép riêng `~/.openclaw/agents/<agentId>/sessions/` từ máy cũ.
  </Step>
</Steps>

## Ghi chú nâng cao

- Định tuyến đa agent có thể dùng các không gian làm việc khác nhau cho mỗi agent. Xem [Định tuyến kênh](/vi/channels/channel-routing) để biết cấu hình định tuyến.
- Nếu `agents.defaults.sandbox` được bật, các phiên không phải phiên chính có thể dùng không gian làm việc sandbox theo từng phiên dưới `agents.defaults.sandbox.workspaceRoot`.

## Liên quan

- [Heartbeat](/vi/gateway/heartbeat) — tệp không gian làm việc HEARTBEAT.md
- [Sandboxing](/vi/gateway/sandboxing) — quyền truy cập không gian làm việc trong môi trường sandbox
- [Phiên](/vi/concepts/session) — đường dẫn lưu trữ phiên
- [Lệnh thường trực](/vi/automation/standing-orders) — hướng dẫn bền vững trong các tệp không gian làm việc
