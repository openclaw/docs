---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Cách sandboxing của OpenClaw hoạt động: chế độ, phạm vi, quyền truy cập workspace và hình ảnh'
title: Cô lập trong sandbox
x-i18n:
    generated_at: "2026-06-27T17:31:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c9754fbfc71ee5fb48df72eece8ba3b155ce5e0d9c55aae75ce21801dceb07d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw có thể chạy **công cụ bên trong các backend sandbox** để giảm phạm vi ảnh hưởng. Điều này là **tùy chọn** và được kiểm soát bằng cấu hình (`agents.defaults.sandbox` hoặc `agents.list[].sandbox`). Nếu sandboxing tắt, công cụ chạy trên host. Gateway vẫn ở trên host; quá trình thực thi công cụ chạy trong một sandbox cô lập khi được bật.

<Note>
Đây không phải là một ranh giới bảo mật hoàn hảo, nhưng nó giới hạn đáng kể quyền truy cập hệ thống tệp và tiến trình khi mô hình làm điều gì đó thiếu hợp lý.
</Note>

## Những gì được sandbox

- Thực thi công cụ (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, v.v.).
- Trình duyệt được sandbox tùy chọn (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Chi tiết trình duyệt được sandbox">
    - Theo mặc định, trình duyệt sandbox tự khởi động (đảm bảo có thể truy cập CDP) khi công cụ trình duyệt cần nó. Cấu hình qua `agents.defaults.sandbox.browser.autoStart` và `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Theo mặc định, container trình duyệt sandbox dùng một mạng Docker chuyên dụng (`openclaw-sandbox-browser`) thay vì mạng `bridge` toàn cục. Cấu hình bằng `agents.defaults.sandbox.browser.network`.
    - `agents.defaults.sandbox.browser.cdpSourceRange` tùy chọn hạn chế luồng vào CDP ở rìa container bằng danh sách cho phép CIDR (ví dụ `172.21.0.1/32`).
    - Quyền truy cập quan sát noVNC được bảo vệ bằng mật khẩu theo mặc định; OpenClaw phát ra một URL token ngắn hạn phục vụ trang bootstrap cục bộ và mở noVNC với mật khẩu trong URL fragment (không nằm trong log query/header).
    - `agents.defaults.sandbox.browser.allowHostControl` cho phép phiên được sandbox nhắm rõ ràng tới trình duyệt host.
    - Các danh sách cho phép tùy chọn kiểm soát `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Không được sandbox:

- Chính tiến trình Gateway.
- Bất kỳ công cụ nào được cho phép rõ ràng chạy bên ngoài sandbox (ví dụ `tools.elevated`).
  - **Elevated exec bỏ qua sandboxing và dùng đường thoát đã cấu hình (`gateway` theo mặc định, hoặc `node` khi mục tiêu exec là `node`).**
  - Nếu sandboxing tắt, `tools.elevated` không thay đổi cách thực thi (đã ở trên host). Xem [Chế độ Elevated](/vi/tools/elevated).

## Chế độ

`agents.defaults.sandbox.mode` kiểm soát sandboxing được dùng **khi nào**:

<Tabs>
  <Tab title="off">
    Không có sandboxing.
  </Tab>
  <Tab title="non-main">
    Chỉ sandbox các phiên **non-main** (mặc định nếu bạn muốn các cuộc trò chuyện thông thường ở trên host).

    `"non-main"` dựa trên `session.mainKey` (mặc định `"main"`), không phải agent id. Các phiên nhóm/kênh dùng khóa riêng, nên chúng được tính là non-main và sẽ được sandbox.

  </Tab>
  <Tab title="all">
    Mọi phiên đều chạy trong sandbox.
  </Tab>
</Tabs>

## Phạm vi

`agents.defaults.sandbox.scope` kiểm soát **số lượng container** được tạo:

- `"agent"` (mặc định): một container cho mỗi agent.
- `"session"`: một container cho mỗi phiên.
- `"shared"`: một container được chia sẻ bởi tất cả phiên được sandbox.

## Backend

`agents.defaults.sandbox.backend` kiểm soát **runtime nào** cung cấp sandbox:

- `"docker"` (mặc định khi sandboxing được bật): runtime sandbox dựa trên Docker cục bộ.
- `"ssh"`: runtime sandbox từ xa dựa trên SSH chung.
- `"openshell"`: runtime sandbox dựa trên OpenShell.

Cấu hình riêng cho SSH nằm dưới `agents.defaults.sandbox.ssh`. Cấu hình riêng cho OpenShell nằm dưới `plugins.entries.openshell.config`.

### Chọn backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Nơi chạy**        | Container cục bộ                 | Bất kỳ host nào truy cập được qua SSH | Sandbox do OpenShell quản lý                        |
| **Thiết lập**       | `scripts/sandbox-setup.sh`       | Khóa SSH + host đích           | Plugin OpenShell được bật                           |
| **Mô hình workspace** | Bind-mount hoặc sao chép       | Remote-canonical (seed một lần) | `mirror` hoặc `remote`                              |
| **Kiểm soát mạng**  | `docker.network` (mặc định: none) | Phụ thuộc vào host từ xa      | Phụ thuộc vào OpenShell                             |
| **Sandbox trình duyệt** | Được hỗ trợ                  | Không được hỗ trợ              | Chưa được hỗ trợ                                    |
| **Bind mount**      | `docker.binds`                   | N/A                            | N/A                                                 |
| **Phù hợp nhất cho** | Phát triển cục bộ, cô lập đầy đủ | Offload sang máy từ xa        | Sandbox từ xa được quản lý với đồng bộ hai chiều tùy chọn |

### Backend Docker

Sandboxing tắt theo mặc định. Nếu bạn bật sandboxing và không chọn backend, OpenClaw dùng backend Docker. Nó thực thi công cụ và trình duyệt sandbox cục bộ qua socket daemon Docker (`/var/run/docker.sock`). Cách ly container sandbox được xác định bởi các namespace của Docker.

Để đưa GPU của host vào sandbox Docker, đặt `agents.defaults.sandbox.docker.gpus` hoặc ghi đè theo từng agent `agents.list[].sandbox.docker.gpus`. Giá trị được truyền cho cờ `--gpus` của Docker dưới dạng đối số riêng, ví dụ `"all"` hoặc `"device=GPU-uuid"`, và yêu cầu runtime host tương thích như NVIDIA Container Toolkit.

<Warning>
**Ràng buộc Docker-out-of-Docker (DooD)**

Nếu bạn triển khai chính OpenClaw Gateway dưới dạng container Docker, nó điều phối các container sandbox ngang hàng bằng socket Docker của host (DooD). Điều này tạo ra một ràng buộc ánh xạ đường dẫn cụ thể:

- **Cấu hình yêu cầu đường dẫn host**: Cấu hình `workspace` trong `openclaw.json` PHẢI chứa **đường dẫn tuyệt đối của Host** (ví dụ `/home/user/.openclaw/workspaces`), không phải đường dẫn nội bộ của container Gateway. Khi OpenClaw yêu cầu daemon Docker sinh sandbox, daemon đánh giá đường dẫn tương đối với namespace của Host OS, không phải namespace của Gateway.
- **Tương đương cầu FS (ánh xạ volume giống hệt)**: Tiến trình native của OpenClaw Gateway cũng ghi các tệp heartbeat và bridge vào thư mục `workspace`. Vì Gateway đánh giá đúng cùng một chuỗi (đường dẫn host) từ bên trong môi trường container hóa của chính nó, triển khai Gateway PHẢI bao gồm ánh xạ volume giống hệt liên kết namespace host một cách native (`-v /home/user/.openclaw:/home/user/.openclaw`).
- **Chế độ mã Codex**: Khi sandbox OpenClaw đang hoạt động, OpenClaw tắt Code Mode native của app-server Codex, máy chủ MCP người dùng, và thực thi plugin dựa trên app cho lượt đó vì các bề mặt native đó chạy từ tiến trình app-server trên host Gateway thay vì backend sandbox OpenClaw. Quyền truy cập shell được cung cấp thông qua các công cụ dựa trên sandbox OpenClaw như `sandbox_exec` và `sandbox_process` khi các công cụ exec/process thông thường khả dụng. Không mount socket Docker của host vào container sandbox agent hoặc sandbox Codex tùy chỉnh.

Trên host Ubuntu/AppArmor, Codex `workspace-write` có thể thất bại trước khi shell khởi động
khi bạn cố ý chạy Codex `workspace-write` native mà không có sandboxing
OpenClaw đang hoạt động và user dịch vụ không được phép tạo namespace user
không đặc quyền. Khi egress sandbox Docker bị tắt (`network: "none"`, mặc
định), Codex cũng cần một namespace mạng không đặc quyền. Triệu chứng thường gặp là
`bwrap: setting up uid map: Permission denied` và
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Chạy
`openclaw doctor`; nếu nó báo lỗi probe namespace bwrap của Codex, hãy ưu tiên
một profile AppArmor cấp các namespace cần thiết cho tiến trình dịch vụ OpenClaw.
`kernel.apparmor_restrict_unprivileged_userns=0` là phương án dự phòng áp dụng toàn host
với đánh đổi bảo mật; chỉ dùng khi tư thế bảo mật của host đó
có thể chấp nhận.

Nếu bạn ánh xạ đường dẫn nội bộ mà không có tương đương tuyệt đối với host, OpenClaw sẽ ném lỗi quyền `EACCES` một cách native khi cố ghi heartbeat bên trong môi trường container vì chuỗi đường dẫn đầy đủ không tồn tại một cách native.
</Warning>

### Backend SSH

Dùng `backend: "ssh"` khi bạn muốn OpenClaw sandbox `exec`, công cụ tệp và đọc media trên một máy bất kỳ có thể truy cập qua SSH.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Or use SecretRefs / inline contents instead of local files:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Cách hoạt động">
    - OpenClaw tạo một root từ xa theo phạm vi dưới `sandbox.ssh.workspaceRoot`.
    - Trong lần dùng đầu tiên sau khi tạo hoặc tạo lại, OpenClaw seed workspace từ xa đó từ workspace cục bộ một lần.
    - Sau đó, `exec`, `read`, `write`, `edit`, `apply_patch`, đọc media trong prompt, và staging media đầu vào chạy trực tiếp trên workspace từ xa qua SSH.
    - OpenClaw không tự động đồng bộ các thay đổi từ xa về workspace cục bộ.

  </Accordion>
  <Accordion title="Vật liệu xác thực">
    - `identityFile`, `certificateFile`, `knownHostsFile`: dùng các tệp cục bộ hiện có và truyền chúng qua cấu hình OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: dùng chuỗi inline hoặc SecretRefs. OpenClaw phân giải chúng qua snapshot runtime secrets thông thường, ghi chúng vào tệp tạm với `0600`, và xóa chúng khi phiên SSH kết thúc.
    - Nếu cả `*File` và `*Data` được đặt cho cùng một mục, `*Data` thắng cho phiên SSH đó.

  </Accordion>
  <Accordion title="Hệ quả remote-canonical">
    Đây là mô hình **remote-canonical**. Workspace SSH từ xa trở thành trạng thái sandbox thực sau seed ban đầu.

    - Các chỉnh sửa host-local được thực hiện bên ngoài OpenClaw sau bước seed không hiển thị từ xa cho đến khi bạn tạo lại sandbox.
    - `openclaw sandbox recreate` xóa root từ xa theo phạm vi và seed lại từ cục bộ trong lần dùng tiếp theo.
    - Sandboxing trình duyệt không được hỗ trợ trên backend SSH.
    - Thiết lập `sandbox.docker.*` không áp dụng cho backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Dùng `backend: "openshell"` khi bạn muốn OpenClaw sandbox công cụ trong một môi trường từ xa do OpenShell quản lý. Để xem hướng dẫn thiết lập đầy đủ, tham chiếu cấu hình, và so sánh chế độ workspace, hãy xem [trang OpenShell](/vi/gateway/openshell) chuyên biệt.

OpenShell tái sử dụng cùng transport SSH lõi và cầu hệ thống tệp từ xa như backend SSH chung, đồng thời thêm vòng đời riêng cho OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) cùng chế độ workspace `mirror` tùy chọn.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

Chế độ OpenShell:

- `mirror` (mặc định): workspace cục bộ vẫn là canonical. OpenClaw đồng bộ tệp cục bộ vào OpenShell trước exec và đồng bộ workspace từ xa trở lại sau exec.
- `remote`: workspace OpenShell là canonical sau khi sandbox được tạo. OpenClaw seed workspace từ xa một lần từ workspace cục bộ, sau đó công cụ tệp và exec chạy trực tiếp trên sandbox từ xa mà không đồng bộ thay đổi trở lại.

<AccordionGroup>
  <Accordion title="Chi tiết truyền tải từ xa">
    - OpenClaw yêu cầu OpenShell cung cấp cấu hình SSH riêng cho sandbox qua `openshell sandbox ssh-config <name>`.
    - Core ghi cấu hình SSH đó vào một tệp tạm, mở phiên SSH và tái sử dụng cùng cầu nối hệ thống tệp từ xa được dùng bởi `backend: "ssh"`.
    - Trong chế độ `mirror`, chỉ vòng đời là khác: đồng bộ từ cục bộ lên từ xa trước khi exec, rồi đồng bộ ngược lại sau exec.

  </Accordion>
  <Accordion title="Các giới hạn hiện tại của OpenShell">
    - trình duyệt sandbox chưa được hỗ trợ
    - `sandbox.docker.binds` không được hỗ trợ trên backend OpenShell
    - Các nút điều khiển runtime dành riêng cho Docker dưới `sandbox.docker.*` vẫn chỉ áp dụng cho backend Docker

  </Accordion>
</AccordionGroup>

#### Chế độ workspace

OpenShell có hai mô hình workspace. Đây là phần quan trọng nhất trong thực tế.

<Tabs>
  <Tab title="mirror (cục bộ là chuẩn)">
    Dùng `plugins.entries.openshell.config.mode: "mirror"` khi bạn muốn **workspace cục bộ vẫn là nguồn chuẩn**.

    Hành vi:

    - Trước `exec`, OpenClaw đồng bộ workspace cục bộ vào sandbox OpenShell.
    - Sau `exec`, OpenClaw đồng bộ workspace từ xa ngược về workspace cục bộ.
    - Các công cụ tệp vẫn hoạt động qua cầu nối sandbox, nhưng workspace cục bộ vẫn là nguồn sự thật giữa các lượt.

    Dùng chế độ này khi:

    - bạn chỉnh sửa tệp cục bộ bên ngoài OpenClaw và muốn các thay đổi đó tự động xuất hiện trong sandbox
    - bạn muốn sandbox OpenShell hoạt động giống backend Docker nhất có thể
    - bạn muốn workspace trên máy chủ phản ánh các thao tác ghi trong sandbox sau mỗi lượt exec

    Đánh đổi: tốn thêm chi phí đồng bộ trước và sau exec.

  </Tab>
  <Tab title="remote (OpenShell là chuẩn)">
    Dùng `plugins.entries.openshell.config.mode: "remote"` khi bạn muốn **workspace OpenShell trở thành nguồn chuẩn**.

    Hành vi:

    - Khi sandbox được tạo lần đầu, OpenClaw gieo dữ liệu workspace từ xa từ workspace cục bộ một lần.
    - Sau đó, `exec`, `read`, `write`, `edit` và `apply_patch` hoạt động trực tiếp trên workspace OpenShell từ xa.
    - OpenClaw **không** đồng bộ các thay đổi từ xa ngược về workspace cục bộ sau exec.
    - Việc đọc phương tiện ở thời điểm tạo prompt vẫn hoạt động vì công cụ tệp và phương tiện đọc qua cầu nối sandbox thay vì giả định một đường dẫn máy chủ cục bộ.
    - Truyền tải là SSH vào sandbox OpenShell được trả về bởi `openshell sandbox ssh-config`.

    Hệ quả quan trọng:

    - Nếu bạn chỉnh sửa tệp trên máy chủ bên ngoài OpenClaw sau bước gieo dữ liệu, sandbox từ xa sẽ **không** tự động thấy các thay đổi đó.
    - Nếu sandbox được tạo lại, workspace từ xa sẽ được gieo dữ liệu lại từ workspace cục bộ.
    - Với `scope: "agent"` hoặc `scope: "shared"`, workspace từ xa đó được chia sẻ ở cùng phạm vi đó.

    Dùng chế độ này khi:

    - sandbox nên tồn tại chủ yếu ở phía OpenShell từ xa
    - bạn muốn giảm chi phí đồng bộ cho mỗi lượt
    - bạn không muốn các chỉnh sửa cục bộ trên máy chủ âm thầm ghi đè trạng thái sandbox từ xa

  </Tab>
</Tabs>

Chọn `mirror` nếu bạn xem sandbox là môi trường thực thi tạm thời. Chọn `remote` nếu bạn xem sandbox là workspace thật.

#### Vòng đời OpenShell

Sandbox OpenShell vẫn được quản lý qua vòng đời sandbox thông thường:

- `openclaw sandbox list` hiển thị cả runtime OpenShell lẫn runtime Docker
- `openclaw sandbox recreate` xóa runtime hiện tại và để OpenClaw tạo lại trong lần dùng tiếp theo
- logic prune cũng nhận biết backend

Với chế độ `remote`, việc tạo lại đặc biệt quan trọng:

- tạo lại sẽ xóa workspace từ xa chuẩn cho phạm vi đó
- lần dùng tiếp theo gieo một workspace từ xa mới từ workspace cục bộ

Với chế độ `mirror`, tạo lại chủ yếu đặt lại môi trường thực thi từ xa vì workspace cục bộ dù sao vẫn là nguồn chuẩn.

## Truy cập workspace

`agents.defaults.sandbox.workspaceAccess` kiểm soát **sandbox có thể thấy gì**:

<Tabs>
  <Tab title="none (mặc định)">
    Công cụ thấy một workspace sandbox dưới `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Gắn workspace của agent ở chế độ chỉ đọc tại `/agent` (vô hiệu hóa `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Gắn workspace của agent ở chế độ đọc/ghi tại `/workspace`.
  </Tab>
</Tabs>

Với backend OpenShell:

- chế độ `mirror` vẫn dùng workspace cục bộ làm nguồn chuẩn giữa các lượt exec
- chế độ `remote` dùng workspace OpenShell từ xa làm nguồn chuẩn sau bước gieo dữ liệu ban đầu
- `workspaceAccess: "ro"` và `"none"` vẫn hạn chế hành vi ghi theo cùng cách

Phương tiện gửi vào được sao chép vào workspace sandbox đang hoạt động (`media/inbound/*`).

<Note>
**Ghi chú về Skills:** công cụ `read` lấy gốc từ sandbox. Với `workspaceAccess: "none"`, OpenClaw phản chiếu các skills đủ điều kiện vào workspace sandbox (`.../skills`) để chúng có thể được đọc. Với `"rw"`, skills trong workspace có thể đọc từ `/workspace/skills`, và các skills đủ điều kiện thuộc loại được quản lý, đóng gói kèm hoặc plugin được hiện thực hóa vào đường dẫn chỉ đọc được tạo `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Bind mount tùy chỉnh

`agents.defaults.sandbox.docker.binds` gắn thêm các thư mục máy chủ vào container. Định dạng: `host:container:mode` (ví dụ: `"/home/user/source:/source:rw"`).

Các bind toàn cục và theo agent được **hợp nhất** (không thay thế). Dưới `scope: "shared"`, các bind theo agent bị bỏ qua.

`agents.defaults.sandbox.browser.binds` chỉ gắn thêm các thư mục máy chủ vào container **trình duyệt sandbox**.

- Khi được đặt (bao gồm `[]`), nó thay thế `agents.defaults.sandbox.docker.binds` cho container trình duyệt.
- Khi bị bỏ qua, container trình duyệt dùng dự phòng `agents.defaults.sandbox.docker.binds` (tương thích ngược).

Ví dụ (nguồn chỉ đọc + một thư mục dữ liệu bổ sung):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

<Warning>
**Bảo mật bind**

- Bind bỏ qua hệ thống tệp sandbox: chúng phơi bày các đường dẫn máy chủ với bất kỳ chế độ nào bạn đặt (`:ro` hoặc `:rw`).
- OpenClaw chặn các nguồn bind nguy hiểm (ví dụ: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` và các mount cha có thể phơi bày chúng).
- OpenClaw cũng chặn các gốc thông tin xác thực phổ biến trong thư mục home như `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` và `~/.ssh`.
- Xác thực bind không chỉ là so khớp chuỗi. OpenClaw chuẩn hóa đường dẫn nguồn, sau đó phân giải lại qua tổ tiên sâu nhất đang tồn tại trước khi kiểm tra lại các đường dẫn bị chặn và các gốc được cho phép.
- Điều đó có nghĩa là các đường thoát qua symlink ở thư mục cha vẫn bị đóng chặt ngay cả khi lá cuối chưa tồn tại. Ví dụ: `/workspace/run-link/new-file` vẫn phân giải thành `/var/run/...` nếu `run-link` trỏ tới đó.
- Các gốc nguồn được cho phép cũng được chuẩn hóa theo cùng cách, nên một đường dẫn chỉ trông như nằm trong allowlist trước khi phân giải symlink vẫn bị từ chối là `outside allowed roots`.
- Các mount nhạy cảm (secrets, khóa SSH, thông tin xác thực dịch vụ) nên là `:ro` trừ khi thực sự cần thiết.
- Kết hợp với `workspaceAccess: "ro"` nếu bạn chỉ cần quyền đọc workspace; chế độ bind vẫn độc lập.
- Xem [Sandbox so với chính sách công cụ so với nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) để biết bind tương tác với chính sách công cụ và exec nâng quyền như thế nào.

</Warning>

## Hình ảnh và thiết lập

Image Docker mặc định: `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout nguồn so với cài đặt npm**

Các script trợ giúp `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` và `scripts/sandbox-browser-setup.sh` chỉ có sẵn khi chạy từ một [checkout nguồn](https://github.com/openclaw/openclaw). Chúng không được bao gồm trong gói npm.

Nếu bạn đã cài OpenClaw qua `npm install -g openclaw`, hãy dùng các lệnh `docker build` nội tuyến được hiển thị bên dưới thay thế.
</Note>

<Steps>
  <Step title="Build image mặc định">
    Từ một checkout nguồn:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Từ một cài đặt npm (không cần checkout nguồn):

    ```bash
    docker build -t openclaw-sandbox:bookworm-slim - <<'DOCKERFILE'
    FROM debian:bookworm-slim
    ENV DEBIAN_FRONTEND=noninteractive
    RUN apt-get update && apt-get install -y --no-install-recommends \
      bash ca-certificates curl git jq python3 ripgrep \
      && rm -rf /var/lib/apt/lists/*
    RUN useradd --create-home --shell /bin/bash sandbox
    USER sandbox
    WORKDIR /home/sandbox
    CMD ["sleep", "infinity"]
    DOCKERFILE
    ```

    Image mặc định **không** bao gồm Node. Nếu một skill cần Node (hoặc các runtime khác), hãy bake một image tùy chỉnh hoặc cài qua `sandbox.docker.setupCommand` (yêu cầu egress mạng + root có thể ghi + người dùng root).

    OpenClaw không âm thầm thay thế bằng `debian:bookworm-slim` thuần khi thiếu `openclaw-sandbox:bookworm-slim`. Các lần chạy sandbox nhắm tới image mặc định sẽ fail fast kèm hướng dẫn build cho đến khi bạn build nó, vì image đóng gói kèm mang `python3` cho các helper ghi/chỉnh sửa trong sandbox.

  </Step>
  <Step title="Tùy chọn: build image common">
    Để có một image sandbox nhiều chức năng hơn với công cụ phổ biến (ví dụ `curl`, `jq`, Node 24, pnpm, `python3` và `git`):

    Từ một checkout nguồn:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Từ một cài đặt npm, trước tiên build image mặc định (xem bên trên), sau đó build image common ở trên nó bằng [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) từ repository.

    Sau đó đặt `agents.defaults.sandbox.docker.image` thành `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Tùy chọn: build image trình duyệt sandbox">
    Từ một checkout nguồn:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Từ một cài đặt npm, build bằng [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) từ repository.

  </Step>
</Steps>

Theo mặc định, các container sandbox Docker chạy với **không có mạng**. Ghi đè bằng `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Mặc định Chromium của trình duyệt sandbox">
    Image trình duyệt sandbox đóng gói kèm cũng áp dụng các mặc định khởi động Chromium thận trọng cho workload trong container. Các mặc định container hiện tại bao gồm:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-3d-apis`
    - `--disable-gpu`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-extensions`
    - `--disable-features=TranslateUI`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--disable-software-rasterizer`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--renderer-process-limit=2`
    - `--no-sandbox` khi `noSandbox` được bật.
    - Ba cờ gia cố đồ họa (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) là tùy chọn và hữu ích khi container thiếu hỗ trợ GPU. Đặt `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` nếu workload của bạn yêu cầu WebGL hoặc các tính năng 3D/trình duyệt khác.
    - `--disable-extensions` được bật theo mặc định và có thể tắt bằng `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` cho các luồng phụ thuộc vào extension.
    - `--renderer-process-limit=2` được kiểm soát bởi `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, trong đó `0` giữ mặc định của Chromium.

    Nếu bạn cần một hồ sơ runtime khác, hãy dùng image trình duyệt tùy chỉnh và cung cấp entrypoint riêng. Với các hồ sơ Chromium cục bộ (không phải container), dùng `browser.extraArgs` để nối thêm các cờ khởi động bổ sung.

  </Accordion>
  <Accordion title="Mặc định bảo mật mạng">
    - `network: "host"` bị chặn.
    - `network: "container:<id>"` bị chặn theo mặc định (rủi ro bỏ qua bằng cách tham gia namespace).
    - Ghi đè khẩn cấp: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Các bản cài đặt Docker và gateway chạy trong container nằm tại đây: [Docker](/vi/install/docker)

Đối với các triển khai gateway bằng Docker, `scripts/docker/setup.sh` có thể khởi tạo cấu hình hộp cát. Đặt `OPENCLAW_SANDBOX=1` (hoặc `true`/`yes`/`on`) để bật đường dẫn đó. Bạn có thể ghi đè vị trí socket bằng `OPENCLAW_DOCKER_SOCKET`. Tham khảo thiết lập đầy đủ và tham chiếu env: [Docker](/vi/install/docker#agent-sandbox).

## setupCommand (thiết lập container một lần)

`setupCommand` chạy **một lần** sau khi container hộp cát được tạo (không chạy ở mọi lần thực thi). Nó thực thi bên trong container qua `sh -lc`.

Đường dẫn:

- Toàn cục: `agents.defaults.sandbox.docker.setupCommand`
- Theo từng tác nhân: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Lỗi thường gặp">
    - `docker.network` mặc định là `"none"` (không có egress), nên việc cài đặt gói sẽ thất bại.
    - `docker.network: "container:<id>"` yêu cầu `dangerouslyAllowContainerNamespaceJoin: true` và chỉ dùng cho trường hợp khẩn cấp.
    - `readOnlyRoot: true` ngăn việc ghi; đặt `readOnlyRoot: false` hoặc đóng gói sẵn một image tùy chỉnh.
    - `user` phải là root để cài đặt gói (bỏ qua `user` hoặc đặt `user: "0:0"`).
    - Exec trong hộp cát **không** kế thừa `process.env` của máy chủ. Dùng `agents.defaults.sandbox.docker.env` (hoặc một image tùy chỉnh) cho khóa API của skill.
    - Các giá trị trong `agents.defaults.sandbox.docker.env` được truyền dưới dạng biến môi trường container Docker tường minh. Bất kỳ ai có quyền truy cập Docker daemon đều có thể kiểm tra chúng bằng các lệnh siêu dữ liệu Docker như `docker inspect`. Dùng image tùy chỉnh, tệp bí mật được mount, hoặc đường dẫn phân phối bí mật khác nếu việc lộ siêu dữ liệu đó là không chấp nhận được.

  </Accordion>
</AccordionGroup>

## Chính sách công cụ và cơ chế thoát

Các chính sách cho phép/từ chối công cụ vẫn được áp dụng trước quy tắc hộp cát. Nếu một công cụ bị từ chối toàn cục hoặc theo từng tác nhân, hộp cát sẽ không khôi phục công cụ đó.

`tools.elevated` là một cơ chế thoát tường minh chạy `exec` bên ngoài hộp cát (`gateway` theo mặc định, hoặc `node` khi mục tiêu exec là `node`). Chỉ thị `/exec` chỉ áp dụng cho người gửi được ủy quyền và được duy trì theo từng phiên; để tắt cứng `exec`, hãy dùng chính sách từ chối công cụ (xem [Hộp cát so với Chính sách công cụ so với Đặc quyền nâng cao](/vi/gateway/sandbox-vs-tool-policy-vs-elevated)).

Gỡ lỗi:

- Dùng `openclaw sandbox explain` để kiểm tra chế độ hộp cát hiệu lực, chính sách công cụ và các khóa cấu hình khắc phục.
- Xem [Hộp cát so với Chính sách công cụ so với Đặc quyền nâng cao](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) để hiểu mô hình tư duy "tại sao mục này bị chặn?".

Hãy giữ nó được khóa chặt.

## Ghi đè đa tác nhân

Mỗi tác nhân có thể ghi đè hộp cát + công cụ: `agents.list[].sandbox` và `agents.list[].tools` (cộng với `agents.list[].tools.sandbox.tools` cho chính sách công cụ trong hộp cát). Xem [Hộp cát & Công cụ đa tác nhân](/vi/tools/multi-agent-sandbox-tools) để biết thứ tự ưu tiên.

## Ví dụ bật tối thiểu

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## Liên quan

- [Hộp cát & Công cụ đa tác nhân](/vi/tools/multi-agent-sandbox-tools) — ghi đè theo từng tác nhân và thứ tự ưu tiên
- [OpenShell](/vi/gateway/openshell) — thiết lập backend hộp cát được quản lý, chế độ workspace và tham chiếu cấu hình
- [Cấu hình hộp cát](/vi/gateway/config-agents#agentsdefaultssandbox)
- [Hộp cát so với Chính sách công cụ so với Đặc quyền nâng cao](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) — gỡ lỗi "tại sao mục này bị chặn?"
- [Bảo mật](/vi/gateway/security)
