---
read_when:
    - Bạn cần giải thích không gian làm việc của tác nhân hoặc bố cục tệp của nó
    - Bạn muốn sao lưu hoặc di chuyển không gian làm việc của tác nhân
sidebarTitle: Agent workspace
summary: 'Không gian làm việc của tác nhân: vị trí, bố cục và chiến lược sao lưu'
title: Không gian làm việc của tác tử
x-i18n:
    generated_at: "2026-05-06T09:06:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5c4c55f3cda5dcf6b763f8e59fa926283cee18270a58dbd62593947a55e67c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

Không gian làm việc là ngôi nhà của agent. Đây là thư mục làm việc duy nhất được dùng cho các công cụ tệp và ngữ cảnh không gian làm việc. Hãy giữ riêng tư và xem nó như bộ nhớ.

Nó tách biệt với `~/.openclaw/`, nơi lưu cấu hình, thông tin xác thực và phiên.

<Warning>
Không gian làm việc là **cwd mặc định**, không phải một sandbox cứng. Công cụ phân giải đường dẫn tương đối theo không gian làm việc, nhưng đường dẫn tuyệt đối vẫn có thể truy cập nơi khác trên máy chủ trừ khi sandboxing được bật. Nếu bạn cần cách ly, hãy dùng [`agents.defaults.sandbox`](/vi/gateway/sandboxing) (và/hoặc cấu hình sandbox theo từng agent).

Khi sandboxing được bật và `workspaceAccess` không phải `"rw"`, công cụ hoạt động bên trong một không gian làm việc sandbox dưới `~/.openclaw/sandboxes`, không phải không gian làm việc trên máy chủ của bạn.
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

`openclaw onboard`, `openclaw configure` hoặc `openclaw setup` sẽ tạo không gian làm việc và gieo các tệp bootstrap nếu chúng bị thiếu.

<Note>
Bản sao gieo sandbox chỉ chấp nhận các tệp thông thường nằm trong không gian làm việc; bí danh symlink/hardlink phân giải ra ngoài không gian làm việc nguồn sẽ bị bỏ qua.
</Note>

Nếu bạn đã tự quản lý các tệp không gian làm việc, bạn có thể tắt việc tạo tệp bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Thư mục không gian làm việc bổ sung

Các bản cài đặt cũ hơn có thể đã tạo `~/openclaw`. Việc giữ nhiều thư mục không gian làm việc có thể gây nhầm lẫn về xác thực hoặc lệch trạng thái, vì mỗi lần chỉ có một không gian làm việc hoạt động.

<Note>
**Khuyến nghị:** giữ một không gian làm việc hoạt động duy nhất. Nếu bạn không còn dùng các thư mục bổ sung, hãy lưu trữ hoặc chuyển chúng vào Thùng rác (ví dụ `trash ~/openclaw`). Nếu bạn cố ý giữ nhiều không gian làm việc, hãy đảm bảo `agents.defaults.workspace` trỏ tới không gian đang hoạt động.

`openclaw doctor` cảnh báo khi phát hiện thêm thư mục không gian làm việc.
</Note>

## Sơ đồ tệp không gian làm việc

Đây là các tệp tiêu chuẩn mà OpenClaw kỳ vọng có trong không gian làm việc:

<AccordionGroup>
  <Accordion title="AGENTS.md - hướng dẫn vận hành">
    Hướng dẫn vận hành cho agent và cách agent nên dùng bộ nhớ. Được tải khi bắt đầu mỗi phiên. Đây là nơi phù hợp cho quy tắc, mức ưu tiên và chi tiết về "cách cư xử".
  </Accordion>
  <Accordion title="SOUL.md - persona và giọng điệu">
    Persona, giọng điệu và ranh giới. Được tải trong mọi phiên. Hướng dẫn: [hướng dẫn tính cách SOUL.md](/vi/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - người dùng là ai">
    Người dùng là ai và cách xưng hô với họ. Được tải trong mọi phiên.
  </Accordion>
  <Accordion title="IDENTITY.md - tên, phong cách, emoji">
    Tên, phong cách và emoji của agent. Được tạo/cập nhật trong nghi thức bootstrap.
  </Accordion>
  <Accordion title="TOOLS.md - quy ước công cụ cục bộ">
    Ghi chú về công cụ và quy ước cục bộ của bạn. Không kiểm soát tính khả dụng của công cụ; nó chỉ là hướng dẫn.
  </Accordion>
  <Accordion title="HEARTBEAT.md - danh sách kiểm tra heartbeat">
    Danh sách kiểm tra nhỏ tùy chọn cho các lần chạy heartbeat. Giữ ngắn để tránh tốn token.
  </Accordion>
  <Accordion title="BOOT.md - danh sách kiểm tra khởi động">
    Danh sách kiểm tra khởi động tùy chọn chạy tự động khi gateway khởi động lại (khi [hook nội bộ](/vi/automation/hooks) được bật). Giữ ngắn; dùng công cụ tin nhắn cho các lần gửi đi.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - nghi thức chạy lần đầu">
    Nghi thức chạy lần đầu một lần duy nhất. Chỉ được tạo cho không gian làm việc hoàn toàn mới. Xóa nó sau khi nghi thức hoàn tất.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - nhật ký bộ nhớ hằng ngày">
    Nhật ký bộ nhớ hằng ngày (mỗi ngày một tệp). Khuyến nghị đọc hôm nay + hôm qua khi bắt đầu phiên.
  </Accordion>
  <Accordion title="MEMORY.md - bộ nhớ dài hạn đã tuyển chọn (tùy chọn)">
    Bộ nhớ dài hạn đã tuyển chọn. Chỉ tải trong phiên chính, riêng tư (không phải ngữ cảnh chia sẻ/nhóm). Xem [Bộ nhớ](/vi/concepts/memory) để biết quy trình và thao tác xả bộ nhớ tự động.
  </Accordion>
  <Accordion title="skills/ - Skills không gian làm việc (tùy chọn)">
    Skills dành riêng cho không gian làm việc. Vị trí skill có mức ưu tiên cao nhất cho không gian làm việc đó. Ghi đè Skills agent của dự án, Skills agent cá nhân, Skills được quản lý, Skills đóng gói sẵn và `skills.load.extraDirs` khi tên trùng nhau.
  </Accordion>
  <Accordion title="canvas/ - tệp giao diện Canvas (tùy chọn)">
    Tệp giao diện Canvas cho phần hiển thị node (ví dụ `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Nếu thiếu bất kỳ tệp bootstrap nào, OpenClaw sẽ chèn một dấu "tệp bị thiếu" vào phiên và tiếp tục. Các tệp bootstrap lớn sẽ bị cắt ngắn khi được chèn; điều chỉnh giới hạn bằng `agents.defaults.bootstrapMaxChars` (mặc định: 12000) và `agents.defaults.bootstrapTotalMaxChars` (mặc định: 60000). `openclaw setup` có thể tạo lại các mặc định bị thiếu mà không ghi đè tệp hiện có.
</Note>

## Những gì KHÔNG nằm trong không gian làm việc

Các mục này nằm dưới `~/.openclaw/` và KHÔNG nên được commit vào repo không gian làm việc:

- `~/.openclaw/openclaw.json` (cấu hình)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (hồ sơ xác thực mô hình: OAuth + API keys)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (tài khoản runtime Codex theo từng agent, cấu hình, Skills, plugins và trạng thái luồng gốc)
- `~/.openclaw/credentials/` (trạng thái kênh/nhà cung cấp cùng dữ liệu nhập OAuth cũ)
- `~/.openclaw/agents/<agentId>/sessions/` (bản ghi phiên + metadata)
- `~/.openclaw/skills/` (Skills được quản lý)

Nếu bạn cần di chuyển phiên hoặc cấu hình, hãy sao chép riêng chúng và giữ chúng ngoài kiểm soát phiên bản.

## Sao lưu Git (khuyến nghị, riêng tư)

Xem không gian làm việc như bộ nhớ riêng tư. Đặt nó trong một repo git **riêng tư** để được sao lưu và có thể khôi phục.

Chạy các bước này trên máy nơi Gateway chạy (đó là nơi không gian làm việc tồn tại).

<Steps>
  <Step title="Khởi tạo repo">
    Nếu git đã được cài đặt, các không gian làm việc hoàn toàn mới sẽ được khởi tạo tự động. Nếu không gian làm việc này chưa phải là repo, hãy chạy:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Thêm remote riêng tư">
    <Tabs>
      <Tab title="Giao diện web GitHub">
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
      <Tab title="Giao diện web GitLab">
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
  <Step title="Cập nhật liên tục">
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

- API keys, token OAuth, mật khẩu hoặc thông tin xác thực riêng tư.
- Bất kỳ thứ gì dưới `~/.openclaw/`.
- Bản xuất thô của cuộc trò chuyện hoặc tệp đính kèm nhạy cảm.

Nếu bạn phải lưu tham chiếu nhạy cảm, hãy dùng placeholder và giữ bí mật thật ở nơi khác (trình quản lý mật khẩu, biến môi trường hoặc `~/.openclaw/`).
</Warning>

Mẫu khởi đầu `.gitignore` được gợi ý:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Di chuyển không gian làm việc sang máy mới

<Steps>
  <Step title="Clone repo">
    Clone repo vào đường dẫn mong muốn (mặc định `~/.openclaw/workspace`).
  </Step>
  <Step title="Cập nhật cấu hình">
    Đặt `agents.defaults.workspace` thành đường dẫn đó trong `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Gieo tệp bị thiếu">
    Chạy `openclaw setup --workspace <path>` để gieo bất kỳ tệp nào bị thiếu.
  </Step>
  <Step title="Sao chép phiên (tùy chọn)">
    Nếu bạn cần phiên, hãy sao chép riêng `~/.openclaw/agents/<agentId>/sessions/` từ máy cũ.
  </Step>
</Steps>

## Ghi chú nâng cao

- Định tuyến đa agent có thể dùng các không gian làm việc khác nhau cho từng agent. Xem [Định tuyến kênh](/vi/channels/channel-routing) để biết cấu hình định tuyến.
- Nếu `agents.defaults.sandbox` được bật, các phiên không phải phiên chính có thể dùng không gian làm việc sandbox theo phiên dưới `agents.defaults.sandbox.workspaceRoot`.

## Liên quan

- [Heartbeat](/vi/gateway/heartbeat) - tệp không gian làm việc HEARTBEAT.md
- [Sandboxing](/vi/gateway/sandboxing) - quyền truy cập không gian làm việc trong môi trường sandbox
- [Phiên](/vi/concepts/session) - đường dẫn lưu trữ phiên
- [Lệnh thường trực](/vi/automation/standing-orders) - hướng dẫn bền vững trong tệp không gian làm việc
