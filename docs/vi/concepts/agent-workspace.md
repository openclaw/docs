---
read_when:
    - Bạn cần giải thích không gian làm việc của tác tử hoặc cấu trúc tệp của nó
    - Bạn muốn sao lưu hoặc di chuyển một không gian làm việc của tác nhân
sidebarTitle: Agent workspace
summary: 'Không gian làm việc của tác nhân: vị trí, bố cục và chiến lược sao lưu'
title: Không gian làm việc của tác nhân
x-i18n:
    generated_at: "2026-04-30T20:05:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ccf74cbec3ff20f4c1c1ce52f099a7ca3365b2536b0aad6ff1d3a5fafcca0a
    source_path: concepts/agent-workspace.md
    workflow: 16
---

Vùng làm việc là nhà của agent. Đây là thư mục làm việc duy nhất được dùng cho các công cụ tệp và ngữ cảnh vùng làm việc. Hãy giữ riêng tư và xem nó như bộ nhớ.

Điều này tách biệt với `~/.openclaw/`, nơi lưu cấu hình, thông tin xác thực và phiên.

<Warning>
Vùng làm việc là **cwd mặc định**, không phải sandbox cứng. Các công cụ phân giải đường dẫn tương đối theo vùng làm việc, nhưng đường dẫn tuyệt đối vẫn có thể truy cập nơi khác trên máy chủ trừ khi sandboxing được bật. Nếu bạn cần cô lập, hãy dùng [`agents.defaults.sandbox`](/vi/gateway/sandboxing) (và/hoặc cấu hình sandbox theo từng agent).

Khi sandboxing được bật và `workspaceAccess` không phải `"rw"`, các công cụ hoạt động bên trong một vùng làm việc sandbox dưới `~/.openclaw/sandboxes`, không phải vùng làm việc máy chủ của bạn.
</Warning>

## Vị trí mặc định

- Mặc định: `~/.openclaw/workspace`
- Nếu `OPENCLAW_PROFILE` được đặt và không phải `"default"`, mặc định sẽ trở thành `~/.openclaw/workspace-<profile>`.
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

`openclaw onboard`, `openclaw configure`, hoặc `openclaw setup` sẽ tạo vùng làm việc và thêm các tệp khởi tạo nếu chúng bị thiếu.

<Note>
Bản sao gieo sandbox chỉ chấp nhận các tệp thông thường nằm trong vùng làm việc; các bí danh symlink/hardlink phân giải ra ngoài vùng làm việc nguồn sẽ bị bỏ qua.
</Note>

Nếu bạn đã tự quản lý các tệp vùng làm việc, bạn có thể tắt việc tạo tệp khởi tạo:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Thư mục vùng làm việc bổ sung

Các bản cài đặt cũ hơn có thể đã tạo `~/openclaw`. Giữ nhiều thư mục vùng làm việc có thể gây nhầm lẫn về xác thực hoặc trôi lệch trạng thái, vì mỗi thời điểm chỉ có một vùng làm việc đang hoạt động.

<Note>
**Khuyến nghị:** chỉ giữ một vùng làm việc hoạt động. Nếu bạn không còn dùng các thư mục bổ sung, hãy lưu trữ hoặc chuyển chúng vào Thùng rác (ví dụ `trash ~/openclaw`). Nếu bạn cố ý giữ nhiều vùng làm việc, hãy đảm bảo `agents.defaults.workspace` trỏ tới vùng đang hoạt động.

`openclaw doctor` cảnh báo khi phát hiện các thư mục vùng làm việc bổ sung.
</Note>

## Bản đồ tệp vùng làm việc

Đây là các tệp chuẩn mà OpenClaw kỳ vọng bên trong vùng làm việc:

<AccordionGroup>
  <Accordion title="AGENTS.md — operating instructions">
    Hướng dẫn vận hành cho agent và cách agent nên sử dụng bộ nhớ. Được tải khi bắt đầu mọi phiên. Đây là nơi phù hợp cho quy tắc, ưu tiên và các chi tiết về "cách hành xử".
  </Accordion>
  <Accordion title="SOUL.md — persona and tone">
    Chân dung, giọng điệu và ranh giới. Được tải trong mọi phiên. Hướng dẫn: [hướng dẫn tính cách SOUL.md](/vi/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — who the user is">
    Người dùng là ai và cách xưng hô với họ. Được tải trong mọi phiên.
  </Accordion>
  <Accordion title="IDENTITY.md — name, vibe, emoji">
    Tên, phong thái và emoji của agent. Được tạo/cập nhật trong nghi thức khởi tạo.
  </Accordion>
  <Accordion title="TOOLS.md — local tool conventions">
    Ghi chú về các công cụ cục bộ và quy ước của bạn. Không kiểm soát tính khả dụng của công cụ; chỉ là hướng dẫn.
  </Accordion>
  <Accordion title="HEARTBEAT.md — heartbeat checklist">
    Danh sách kiểm tra nhỏ tùy chọn cho các lượt Heartbeat. Giữ ngắn để tránh tiêu tốn token.
  </Accordion>
  <Accordion title="BOOT.md — startup checklist">
    Danh sách kiểm tra khởi động tùy chọn chạy tự động khi Gateway khởi động lại (khi [hook nội bộ](/vi/automation/hooks) được bật). Giữ ngắn; dùng công cụ tin nhắn để gửi ra ngoài.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — first-run ritual">
    Nghi thức chạy lần đầu một lần duy nhất. Chỉ được tạo cho vùng làm việc hoàn toàn mới. Xóa sau khi nghi thức hoàn tất.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — daily memory log">
    Nhật ký bộ nhớ hằng ngày (mỗi ngày một tệp). Khuyến nghị đọc hôm nay + hôm qua khi bắt đầu phiên.
  </Accordion>
  <Accordion title="MEMORY.md — curated long-term memory (optional)">
    Bộ nhớ dài hạn được tuyển chọn. Chỉ tải trong phiên chính, riêng tư (không phải ngữ cảnh chia sẻ/nhóm). Xem [Bộ nhớ](/vi/concepts/memory) để biết quy trình và thao tác xả bộ nhớ tự động.
  </Accordion>
  <Accordion title="skills/ — workspace skills (optional)">
    Skills dành riêng cho vùng làm việc. Vị trí skill có độ ưu tiên cao nhất cho vùng làm việc đó. Ghi đè Skills agent của dự án, Skills agent cá nhân, Skills được quản lý, Skills đi kèm và `skills.load.extraDirs` khi tên trùng nhau.
  </Accordion>
  <Accordion title="canvas/ — Canvas UI files (optional)">
    Tệp Canvas UI cho hiển thị node (ví dụ `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Nếu thiếu bất kỳ tệp khởi tạo nào, OpenClaw sẽ chèn một dấu hiệu "thiếu tệp" vào phiên và tiếp tục. Các tệp khởi tạo lớn sẽ bị cắt ngắn khi chèn; điều chỉnh giới hạn bằng `agents.defaults.bootstrapMaxChars` (mặc định: 12000) và `agents.defaults.bootstrapTotalMaxChars` (mặc định: 60000). `openclaw setup` có thể tạo lại các mặc định bị thiếu mà không ghi đè tệp hiện có.
</Note>

## Những gì KHÔNG nằm trong vùng làm việc

Các mục này nằm dưới `~/.openclaw/` và KHÔNG nên được commit vào repo vùng làm việc:

- `~/.openclaw/openclaw.json` (cấu hình)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (hồ sơ xác thực mô hình: OAuth + khóa API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (tài khoản runtime Codex theo từng agent, cấu hình, Skills, plugins và trạng thái luồng gốc)
- `~/.openclaw/credentials/` (trạng thái kênh/nhà cung cấp cộng với dữ liệu nhập OAuth cũ)
- `~/.openclaw/agents/<agentId>/sessions/` (bản ghi phiên + siêu dữ liệu)
- `~/.openclaw/skills/` (Skills được quản lý)

Nếu bạn cần di chuyển phiên hoặc cấu hình, hãy sao chép chúng riêng và giữ chúng ngoài kiểm soát phiên bản.

## Sao lưu Git (khuyến nghị, riêng tư)

Xem vùng làm việc như bộ nhớ riêng tư. Đặt nó trong một repo git **riêng tư** để được sao lưu và có thể khôi phục.

Chạy các bước này trên máy nơi Gateway chạy (đó là nơi vùng làm việc tồn tại).

<Steps>
  <Step title="Initialize the repo">
    Nếu git đã được cài đặt, các vùng làm việc hoàn toàn mới sẽ được khởi tạo tự động. Nếu vùng làm việc này chưa phải là repo, hãy chạy:

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
        1. Tạo một kho lưu trữ **riêng tư** mới trên GitHub.
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
        1. Tạo một kho lưu trữ **riêng tư** mới trên GitLab.
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
Ngay cả trong repo riêng tư, hãy tránh lưu trữ bí mật trong vùng làm việc:

- Khóa API, token OAuth, mật khẩu hoặc thông tin xác thực riêng tư.
- Bất kỳ thứ gì dưới `~/.openclaw/`.
- Bản dump thô của cuộc trò chuyện hoặc tệp đính kèm nhạy cảm.

Nếu bạn phải lưu trữ tham chiếu nhạy cảm, hãy dùng placeholder và giữ bí mật thật ở nơi khác (trình quản lý mật khẩu, biến môi trường hoặc `~/.openclaw/`).
</Warning>

Mẫu `.gitignore` khởi đầu được đề xuất:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Di chuyển vùng làm việc sang máy mới

<Steps>
  <Step title="Clone the repo">
    Clone repo tới đường dẫn mong muốn (mặc định `~/.openclaw/workspace`).
  </Step>
  <Step title="Update config">
    Đặt `agents.defaults.workspace` thành đường dẫn đó trong `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Seed missing files">
    Chạy `openclaw setup --workspace <path>` để gieo bất kỳ tệp nào còn thiếu.
  </Step>
  <Step title="Copy sessions (optional)">
    Nếu bạn cần phiên, hãy sao chép riêng `~/.openclaw/agents/<agentId>/sessions/` từ máy cũ.
  </Step>
</Steps>

## Ghi chú nâng cao

- Định tuyến đa agent có thể dùng các vùng làm việc khác nhau cho từng agent. Xem [Định tuyến kênh](/vi/channels/channel-routing) để biết cấu hình định tuyến.
- Nếu `agents.defaults.sandbox` được bật, các phiên không phải chính có thể dùng vùng làm việc sandbox theo từng phiên dưới `agents.defaults.sandbox.workspaceRoot`.

## Liên quan

- [Heartbeat](/vi/gateway/heartbeat) — tệp vùng làm việc HEARTBEAT.md
- [Sandboxing](/vi/gateway/sandboxing) — quyền truy cập vùng làm việc trong môi trường sandbox
- [Phiên](/vi/concepts/session) — đường dẫn lưu trữ phiên
- [Lệnh thường trực](/vi/automation/standing-orders) — hướng dẫn bền vững trong các tệp vùng làm việc
