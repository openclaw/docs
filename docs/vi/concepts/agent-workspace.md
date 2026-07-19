---
read_when:
    - Bạn cần giải thích không gian làm việc của agent hoặc bố cục tệp của nó
    - Bạn muốn sao lưu hoặc di chuyển không gian làm việc của một agent
sidebarTitle: Agent workspace
summary: 'Không gian làm việc của tác nhân: vị trí, bố cục và chiến lược sao lưu'
title: Không gian làm việc của agent
x-i18n:
    generated_at: "2026-07-19T05:49:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ea72dd9366876691dca751518d88f95741d68a39e409a2a300a497a58f8b9d37
    source_path: concepts/agent-workspace.md
    workflow: 16
---

Không gian làm việc là thư mục chính của tác tử: thư mục làm việc được dùng cho các công cụ tệp
và ngữ cảnh không gian làm việc. Hãy giữ riêng tư và coi đó là bộ nhớ.

Nơi này tách biệt với `~/.openclaw/`, nơi lưu trữ cấu hình, thông tin xác thực và phiên.

<Warning>
Không gian làm việc là **cwd mặc định**, không phải sandbox bắt buộc. Các công cụ phân giải đường dẫn tương đối dựa trên không gian làm việc, nhưng đường dẫn tuyệt đối vẫn có thể truy cập những nơi khác trên máy chủ trừ khi bật sandbox. Nếu cần cách ly, hãy dùng [`agents.defaults.sandbox`](/vi/gateway/sandboxing) (và/hoặc cấu hình sandbox riêng cho từng tác tử).

Khi bật sandbox và `workspaceAccess` không phải là `"rw"`, các công cụ hoạt động trong một không gian làm việc sandbox thuộc `~/.openclaw/sandboxes`, không phải không gian làm việc trên máy chủ của bạn.
</Warning>

## Vị trí mặc định

- Mặc định: `~/.openclaw/workspace`
- Nếu `OPENCLAW_PROFILE` được đặt và không phải là `"default"`, giá trị mặc định sẽ trở thành `~/.openclaw/workspace-<profile>`.
- `OPENCLAW_WORKSPACE_DIR` ghi đè cả hai giá trị trên khi được đặt.
- Các tác tử không phải mặc định (`agents.list[]`) không có không gian làm việc được chỉ định rõ ràng sẽ phân giải thành `<state-dir>/workspace-<agentId>`, không phải không gian làm việc mặc định dùng chung.

Ghi đè trong `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

Ghi đè theo từng tác tử: `agents.list[].workspace`.

`openclaw onboard`, `openclaw configure` hoặc `openclaw setup` sẽ tạo không gian làm việc và cung cấp các tệp khởi tạo nếu chúng chưa tồn tại.

<Note>
Bản sao khởi tạo sandbox chỉ chấp nhận các tệp thông thường nằm trong không gian làm việc; các bí danh liên kết tượng trưng/liên kết cứng phân giải ra ngoài không gian làm việc nguồn sẽ bị bỏ qua.
</Note>

Nếu bạn đã tự quản lý các tệp trong không gian làm việc, hãy tắt việc tạo tệp khởi tạo:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Các thư mục không gian làm việc bổ sung

Các bản cài đặt cũ có thể đã tạo `~/openclaw`. Việc giữ nhiều thư mục không gian làm việc có thể gây nhầm lẫn về thông tin xác thực hoặc làm trạng thái sai lệch, vì mỗi thời điểm chỉ có một không gian làm việc hoạt động.

<Note>
**Khuyến nghị:** chỉ duy trì một không gian làm việc đang hoạt động. Nếu không còn dùng các thư mục bổ sung, hãy lưu trữ hoặc chuyển chúng vào Thùng rác (ví dụ: `trash ~/openclaw`). Nếu bạn chủ ý duy trì nhiều không gian làm việc, hãy bảo đảm `agents.defaults.workspace` (hoặc khóa `workspace` theo từng tác tử) trỏ đến không gian đang hoạt động.
</Note>

## Sơ đồ tệp không gian làm việc

Các tệp tiêu chuẩn mà OpenClaw mong đợi có trong không gian làm việc:

<AccordionGroup>
  <Accordion title="AGENTS.md - hướng dẫn vận hành">
    Hướng dẫn vận hành cho tác tử và cách tác tử nên sử dụng bộ nhớ. Được tải khi bắt đầu mỗi phiên. Đây là nơi phù hợp để đặt các quy tắc, mức ưu tiên và chi tiết về "cách hành xử".
  </Accordion>
  <Accordion title="SOUL.md - cá tính và giọng điệu">
    Cá tính, giọng điệu và ranh giới. Được tải trong mọi phiên. Hướng dẫn: [hướng dẫn cá tính SOUL.md](/vi/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - người dùng là ai">
    Thông tin về người dùng và cách xưng hô với họ. Được tải trong mọi phiên.
  </Accordion>
  <Accordion title="IDENTITY.md - tên, phong cách, emoji">
    Tên, phong cách và emoji của tác tử. Được tạo/cập nhật trong nghi thức khởi tạo.
  </Accordion>
  <Accordion title="TOOLS.md - quy ước công cụ cục bộ">
    Ghi chú về các công cụ cục bộ và quy ước của bạn. Không kiểm soát tính khả dụng của công cụ; đây chỉ là hướng dẫn.
  </Accordion>
  <Accordion title="HEARTBEAT.md - danh sách kiểm tra heartbeat">
    Danh sách kiểm tra nhỏ tùy chọn cho các lần chạy Heartbeat. Hãy giữ ngắn gọn để tránh tiêu tốn token.
  </Accordion>
  <Accordion title="BOOT.md - danh sách kiểm tra khi khởi động">
    Danh sách kiểm tra khi khởi động tùy chọn, được tự động chạy khi Gateway khởi động lại (khi bật [hook nội bộ](/vi/automation/hooks)). Hãy giữ ngắn gọn; dùng công cụ tin nhắn để gửi ra ngoài.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - nghi thức chạy lần đầu">
    Nghi thức chạy lần đầu chỉ thực hiện một lần. Chỉ được tạo cho không gian làm việc hoàn toàn mới. Xóa tệp sau khi hoàn tất nghi thức.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - nhật ký bộ nhớ hằng ngày">
    Nhật ký bộ nhớ hằng ngày (mỗi ngày một tệp). Khuyến nghị đọc hôm nay + hôm qua khi bắt đầu phiên.
  </Accordion>
  <Accordion title="MEMORY.md - bộ nhớ dài hạn được tuyển chọn (tùy chọn)">
    Bộ nhớ dài hạn được tuyển chọn: các dữ kiện, tùy chọn, quyết định và bản tóm tắt ngắn có giá trị lâu dài. Giữ nhật ký chi tiết trong `memory/YYYY-MM-DD.md` để các công cụ bộ nhớ có thể truy xuất theo yêu cầu mà không chèn chúng vào mọi prompt. Chỉ tải `MEMORY.md` trong phiên chính, riêng tư (không phải ngữ cảnh dùng chung/nhóm). Xem [Bộ nhớ](/vi/concepts/memory) để biết quy trình và cơ chế tự động ghi bộ nhớ.
  </Accordion>
  <Accordion title="skills/ - Skills của không gian làm việc (tùy chọn)">
    Skills dành riêng cho không gian làm việc. Đây là vị trí Skills có mức ưu tiên cao nhất cho không gian làm việc đó, đứng trước Skills của tác tử dự án, Skills cá nhân của tác tử, Skills được quản lý, Skills đi kèm và `skills.load.extraDirs` khi trùng tên.
  </Accordion>
  <Accordion title="canvas/ - các tệp giao diện Canvas (tùy chọn)">
    Các tệp giao diện Canvas dành cho màn hình Node (ví dụ: `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Nếu thiếu một tệp khởi tạo, OpenClaw sẽ chèn dấu hiệu "thiếu tệp" vào phiên rồi tiếp tục. Các tệp khởi tạo lớn sẽ bị cắt ngắn khi chèn; điều chỉnh giới hạn bằng `agents.defaults.bootstrapMaxChars` (mặc định: `20000`) và `agents.defaults.bootstrapTotalMaxChars` (mặc định: `60000`). `openclaw setup` có thể tạo lại các giá trị mặc định bị thiếu mà không ghi đè các tệp hiện có.
</Note>

## Những gì KHÔNG nằm trong không gian làm việc

Các mục sau nằm trong `~/.openclaw/` và KHÔNG nên được commit vào repo không gian làm việc:

- `~/.openclaw/openclaw.json` (cấu hình)
- `~/.openclaw/state/openclaw.sqlite` (trạng thái thiết lập và chứng thực của không gian làm việc dùng chung)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (hồ sơ xác thực mô hình: OAuth + khóa API)
- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` (các hàng phiên, bản chép lời và trạng thái runtime theo từng tác tử)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (tài khoản runtime Codex theo từng tác tử, cấu hình, Skills, plugin và trạng thái luồng gốc)
- `~/.openclaw/credentials/` (trạng thái kênh/nhà cung cấp cùng dữ liệu nhập OAuth cũ)
- `~/.openclaw/agents/<agentId>/sessions/` (nguồn di chuyển cũ và các thành phần lưu trữ/hỗ trợ)
- `~/.openclaw/skills/` (Skills được quản lý)

Nếu cần di chuyển phiên hoặc cấu hình, hãy sao chép chúng riêng biệt và không đưa vào hệ thống kiểm soát phiên bản.

Các bản phát hành OpenClaw cũ đã ghi các tệp phụ không gian làm việc `openclaw-workspace-state.json`,
`.openclaw/workspace-state.json` và `.attested`. Runtime hiện tại
chỉ sử dụng cơ sở dữ liệu SQLite dùng chung cho trạng thái đó. Nếu Doctor báo cáo
một trong các tệp này, hãy chạy `openclaw doctor --fix`; Doctor nhập trạng thái cũ
hợp lệ và chỉ xóa nguồn sau khi xác minh các hàng trong cơ sở dữ liệu.

## Sao lưu bằng Git (khuyến nghị, riêng tư)

Hãy coi không gian làm việc là bộ nhớ riêng tư. Đặt nó trong một repo git **riêng tư** để có thể sao lưu và khôi phục.

Chạy các bước này trên máy đang chạy Gateway (đó là nơi không gian làm việc tồn tại).

<Steps>
  <Step title="Khởi tạo repo">
    Nếu đã cài đặt git, các không gian làm việc hoàn toàn mới sẽ được tự động khởi tạo. Nếu không gian làm việc này chưa phải là một repo, hãy chạy:

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
        2. Không khởi tạo bằng README (để tránh xung đột hợp nhất).
        3. Sao chép URL remote HTTPS.
        4. Thêm remote và đẩy lên:

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
        2. Không khởi tạo bằng README (để tránh xung đột hợp nhất).
        3. Sao chép URL remote HTTPS.
        4. Thêm remote và đẩy lên:

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
Ngay cả trong repo riêng tư, hãy tránh lưu trữ bí mật trong không gian làm việc:

- Khóa API, token OAuth, mật khẩu hoặc thông tin xác thực riêng tư.
- Mọi nội dung trong `~/.openclaw/`.
- Các bản kết xuất thô của cuộc trò chuyện hoặc tệp đính kèm nhạy cảm.

Nếu bắt buộc phải lưu các tham chiếu nhạy cảm, hãy dùng phần giữ chỗ và lưu bí mật thực ở nơi khác (trình quản lý mật khẩu, biến môi trường hoặc `~/.openclaw/`).
</Warning>

Nội dung khởi đầu được đề xuất cho `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Di chuyển không gian làm việc sang máy mới

<Steps>
  <Step title="Sao chép repo">
    Sao chép repo vào đường dẫn mong muốn (mặc định là `~/.openclaw/workspace`).
  </Step>
  <Step title="Cập nhật cấu hình">
    Đặt `agents.defaults.workspace` thành đường dẫn đó trong `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Cung cấp các tệp còn thiếu">
    Chạy `openclaw setup --workspace <path>` để cung cấp mọi tệp còn thiếu.
  </Step>
  <Step title="Sao chép phiên (tùy chọn)">
    Nếu cần các phiên, hãy sao chép riêng `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
    từ máy cũ. Chỉ sao chép `~/.openclaw/agents/<agentId>/sessions/`
    khi bạn cũng cần dữ liệu đầu vào cho quá trình di chuyển cũ hoặc các thành phần lưu trữ/hỗ trợ.
  </Step>
</Steps>

## Ghi chú nâng cao

- Định tuyến đa tác tử có thể sử dụng không gian làm việc khác nhau cho từng tác tử thông qua `agents.list[].workspace`. Xem [Định tuyến kênh](/vi/channels/channel-routing) để biết cấu hình định tuyến.
- Nếu bật `agents.defaults.sandbox`, các phiên không phải phiên chính có thể sử dụng không gian làm việc sandbox theo từng phiên trong `agents.defaults.sandbox.workspaceRoot`.

## Liên quan

- [Heartbeat](/vi/gateway/heartbeat) - tệp không gian làm việc HEARTBEAT.md
- [Sandbox](/vi/gateway/sandboxing) - quyền truy cập không gian làm việc trong môi trường sandbox
- [Phiên](/vi/concepts/session) - đường dẫn lưu trữ phiên
- [Mệnh lệnh thường trực](/vi/automation/standing-orders) - hướng dẫn lâu dài trong các tệp không gian làm việc
