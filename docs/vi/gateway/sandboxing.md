---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Cơ chế cô lập của OpenClaw hoạt động như thế nào: chế độ, phạm vi, quyền truy cập không gian làm việc và hình ảnh'
title: Cơ chế hộp cát
x-i18n:
    generated_at: "2026-04-29T22:46:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96861f3f70bf26b5ed20a063c047064f98a0dc74d36e8f4ccada1f3bb455118d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw có thể chạy **các công cụ bên trong các backend sandbox** để giảm phạm vi ảnh hưởng. Việc này là **tùy chọn** và được kiểm soát bằng cấu hình (`agents.defaults.sandbox` hoặc `agents.list[].sandbox`). Nếu sandbox bị tắt, các công cụ sẽ chạy trên host. Gateway vẫn ở trên host; việc thực thi công cụ sẽ chạy trong một sandbox cô lập khi được bật.

<Note>
Đây không phải là một ranh giới bảo mật hoàn hảo, nhưng nó giới hạn đáng kể quyền truy cập hệ thống tệp và tiến trình khi mô hình làm điều gì đó sai.
</Note>

## Những gì được sandbox

- Thực thi công cụ (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, v.v.).
- Trình duyệt sandbox tùy chọn (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Chi tiết về trình duyệt sandbox">
    - Theo mặc định, trình duyệt sandbox tự động khởi động (đảm bảo CDP có thể truy cập được) khi công cụ trình duyệt cần đến nó. Cấu hình qua `agents.defaults.sandbox.browser.autoStart` và `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Theo mặc định, các container trình duyệt sandbox dùng một mạng Docker chuyên dụng (`openclaw-sandbox-browser`) thay vì mạng `bridge` toàn cục. Cấu hình bằng `agents.defaults.sandbox.browser.network`.
    - `agents.defaults.sandbox.browser.cdpSourceRange` tùy chọn hạn chế lưu lượng CDP đi vào ở rìa container bằng danh sách cho phép CIDR (ví dụ `172.21.0.1/32`).
    - Quyền truy cập quan sát noVNC được bảo vệ bằng mật khẩu theo mặc định; OpenClaw phát ra một URL token tồn tại ngắn hạn, URL này phục vụ một trang khởi động cục bộ và mở noVNC với mật khẩu trong mảnh URL (không nằm trong nhật ký truy vấn/header).
    - `agents.defaults.sandbox.browser.allowHostControl` cho phép các phiên sandbox nhắm rõ ràng tới trình duyệt trên host.
    - Các danh sách cho phép tùy chọn kiểm soát `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Không được sandbox:

- Bản thân tiến trình Gateway.
- Bất kỳ công cụ nào được cho phép rõ ràng chạy bên ngoài sandbox (ví dụ `tools.elevated`).
  - **Exec nâng quyền bỏ qua sandbox và dùng đường thoát đã cấu hình (`gateway` theo mặc định, hoặc `node` khi mục tiêu exec là `node`).**
  - Nếu sandbox bị tắt, `tools.elevated` không thay đổi cách thực thi (vì đã ở trên host). Xem [Chế độ nâng quyền](/vi/tools/elevated).

## Chế độ

`agents.defaults.sandbox.mode` kiểm soát **khi nào** sandbox được dùng:

<Tabs>
  <Tab title="off">
    Không dùng sandbox.
  </Tab>
  <Tab title="non-main">
    Chỉ sandbox các phiên **không phải main** (mặc định nếu bạn muốn các cuộc trò chuyện bình thường chạy trên host).

    `"non-main"` dựa trên `session.mainKey` (mặc định `"main"`), không dựa trên mã định danh agent. Các phiên nhóm/kênh dùng khóa riêng, nên chúng được tính là không phải main và sẽ được sandbox.

  </Tab>
  <Tab title="all">
    Mọi phiên đều chạy trong sandbox.
  </Tab>
</Tabs>

## Phạm vi

`agents.defaults.sandbox.scope` kiểm soát **số lượng container** được tạo:

- `"agent"` (mặc định): một container cho mỗi agent.
- `"session"`: một container cho mỗi phiên.
- `"shared"`: một container dùng chung cho tất cả các phiên được sandbox.

## Backend

`agents.defaults.sandbox.backend` kiểm soát **runtime nào** cung cấp sandbox:

- `"docker"` (mặc định khi bật sandbox): runtime sandbox cục bộ dựa trên Docker.
- `"ssh"`: runtime sandbox từ xa chung dựa trên SSH.
- `"openshell"`: runtime sandbox dựa trên OpenShell.

Cấu hình dành riêng cho SSH nằm dưới `agents.defaults.sandbox.ssh`. Cấu hình dành riêng cho OpenShell nằm dưới `plugins.entries.openshell.config`.

### Chọn backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Nơi chạy**        | Container cục bộ                 | Bất kỳ host nào truy cập được qua SSH | Sandbox do OpenShell quản lý                        |
| **Thiết lập**       | `scripts/sandbox-setup.sh`       | Khóa SSH + host mục tiêu       | Plugin OpenShell được bật                           |
| **Mô hình workspace** | Bind-mount hoặc sao chép       | Chuẩn từ xa (seed một lần)     | `mirror` hoặc `remote`                              |
| **Kiểm soát mạng**  | `docker.network` (mặc định: không có) | Phụ thuộc vào host từ xa   | Phụ thuộc vào OpenShell                             |
| **Sandbox trình duyệt** | Được hỗ trợ                 | Không được hỗ trợ              | Chưa được hỗ trợ                                    |
| **Bind mount**      | `docker.binds`                   | N/A                            | N/A                                                 |
| **Phù hợp nhất cho** | Phát triển cục bộ, cô lập đầy đủ | Chuyển tải sang máy từ xa     | Sandbox từ xa được quản lý với đồng bộ hai chiều tùy chọn |

### Backend Docker

Sandbox bị tắt theo mặc định. Nếu bạn bật sandbox và không chọn backend, OpenClaw sẽ dùng backend Docker. Nó thực thi công cụ và trình duyệt sandbox cục bộ thông qua socket daemon Docker (`/var/run/docker.sock`). Mức cô lập của container sandbox được xác định bởi namespace của Docker.

Để đưa GPU của host vào sandbox Docker, đặt `agents.defaults.sandbox.docker.gpus` hoặc giá trị ghi đè theo agent `agents.list[].sandbox.docker.gpus`. Giá trị này được truyền vào cờ `--gpus` của Docker dưới dạng một đối số riêng, ví dụ `"all"` hoặc `"device=GPU-uuid"`, và yêu cầu runtime host tương thích như NVIDIA Container Toolkit.

<Warning>
**Ràng buộc Docker-out-of-Docker (DooD)**

Nếu bạn triển khai chính OpenClaw Gateway dưới dạng container Docker, nó điều phối các container sandbox ngang hàng bằng socket Docker của host (DooD). Điều này đưa vào một ràng buộc ánh xạ đường dẫn cụ thể:

- **Cấu hình yêu cầu đường dẫn host**: Cấu hình `workspace` trong `openclaw.json` PHẢI chứa **đường dẫn tuyệt đối của Host** (ví dụ `/home/user/.openclaw/workspaces`), không phải đường dẫn nội bộ của container Gateway. Khi OpenClaw yêu cầu daemon Docker tạo một sandbox, daemon đánh giá các đường dẫn tương đối với namespace của hệ điều hành Host, không phải namespace của Gateway.
- **Tương đương cầu FS (ánh xạ volume giống hệt)**: Tiến trình native của OpenClaw Gateway cũng ghi các tệp heartbeat và bridge vào thư mục `workspace`. Vì Gateway đánh giá chính xác cùng chuỗi đó (đường dẫn host) từ bên trong môi trường container hóa của nó, triển khai Gateway PHẢI bao gồm một ánh xạ volume giống hệt liên kết namespace host theo cách native (`-v /home/user/.openclaw:/home/user/.openclaw`).

Nếu bạn ánh xạ đường dẫn nội bộ mà không tương đương tuyệt đối với host, OpenClaw sẽ ném lỗi quyền `EACCES` theo cách native khi cố ghi heartbeat bên trong môi trường container, vì chuỗi đường dẫn đầy đủ đó không tồn tại theo cách native.
</Warning>

### Backend SSH

Dùng `backend: "ssh"` khi bạn muốn OpenClaw sandbox `exec`, các công cụ tệp, và việc đọc media trên một máy bất kỳ có thể truy cập qua SSH.

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
    - OpenClaw tạo một thư mục gốc từ xa theo phạm vi dưới `sandbox.ssh.workspaceRoot`.
    - Trong lần dùng đầu tiên sau khi tạo hoặc tạo lại, OpenClaw seed workspace từ xa đó từ workspace cục bộ một lần.
    - Sau đó, `exec`, `read`, `write`, `edit`, `apply_patch`, việc đọc media trong prompt, và staging media đi vào sẽ chạy trực tiếp trên workspace từ xa qua SSH.
    - OpenClaw không tự động đồng bộ các thay đổi từ xa trở lại workspace cục bộ.

  </Accordion>
  <Accordion title="Vật liệu xác thực">
    - `identityFile`, `certificateFile`, `knownHostsFile`: dùng các tệp cục bộ hiện có và truyền chúng qua cấu hình OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: dùng chuỗi nội tuyến hoặc SecretRefs. OpenClaw phân giải chúng qua snapshot runtime bí mật thông thường, ghi chúng vào tệp tạm với `0600`, và xóa chúng khi phiên SSH kết thúc.
    - Nếu cả `*File` và `*Data` được đặt cho cùng một mục, `*Data` sẽ thắng cho phiên SSH đó.

  </Accordion>
  <Accordion title="Hệ quả của chuẩn từ xa">
    Đây là một mô hình **chuẩn từ xa**. Workspace SSH từ xa trở thành trạng thái sandbox thực sau lần seed ban đầu.

    - Các chỉnh sửa cục bộ trên host được thực hiện bên ngoài OpenClaw sau bước seed sẽ không hiển thị từ xa cho đến khi bạn tạo lại sandbox.
    - `openclaw sandbox recreate` xóa thư mục gốc từ xa theo phạm vi và seed lại từ cục bộ trong lần dùng tiếp theo.
    - Backend SSH không hỗ trợ sandbox trình duyệt.
    - Các thiết lập `sandbox.docker.*` không áp dụng cho backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Dùng `backend: "openshell"` khi bạn muốn OpenClaw sandbox các công cụ trong một môi trường từ xa do OpenShell quản lý. Để xem hướng dẫn thiết lập đầy đủ, tham chiếu cấu hình, và so sánh chế độ workspace, xem [trang OpenShell](/vi/gateway/openshell) chuyên biệt.

OpenShell tái sử dụng cùng transport SSH lõi và cầu hệ thống tệp từ xa như backend SSH chung, đồng thời thêm vòng đời dành riêng cho OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) cùng chế độ workspace `mirror` tùy chọn.

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

Các chế độ OpenShell:

- `mirror` (mặc định): workspace cục bộ vẫn là chuẩn. OpenClaw đồng bộ các tệp cục bộ vào OpenShell trước exec và đồng bộ workspace từ xa trở lại sau exec.
- `remote`: workspace OpenShell là chuẩn sau khi sandbox được tạo. OpenClaw seed workspace từ xa một lần từ workspace cục bộ, sau đó các công cụ tệp và exec chạy trực tiếp trên sandbox từ xa mà không đồng bộ thay đổi trở lại.

<AccordionGroup>
  <Accordion title="Chi tiết transport từ xa">
    - OpenClaw yêu cầu OpenShell cung cấp cấu hình SSH dành riêng cho sandbox qua `openshell sandbox ssh-config <name>`.
    - Core ghi cấu hình SSH đó vào tệp tạm, mở phiên SSH, và tái sử dụng cùng cầu hệ thống tệp từ xa được dùng bởi `backend: "ssh"`.
    - Chỉ trong chế độ `mirror`, vòng đời mới khác: đồng bộ cục bộ sang từ xa trước exec, rồi đồng bộ trở lại sau exec.

  </Accordion>
  <Accordion title="Giới hạn hiện tại của OpenShell">
    - sandbox trình duyệt chưa được hỗ trợ
    - `sandbox.docker.binds` không được hỗ trợ trên backend OpenShell
    - Các núm điều chỉnh runtime dành riêng cho Docker dưới `sandbox.docker.*` vẫn chỉ áp dụng cho backend Docker

  </Accordion>
</AccordionGroup>

#### Chế độ workspace

OpenShell có hai mô hình workspace. Đây là phần quan trọng nhất trong thực tế.

<Tabs>
  <Tab title="mirror (chuẩn cục bộ)">
    Dùng `plugins.entries.openshell.config.mode: "mirror"` khi bạn muốn **workspace cục bộ tiếp tục là chuẩn**.

    Hành vi:

    - Trước `exec`, OpenClaw đồng bộ workspace cục bộ vào sandbox OpenShell.
    - Sau `exec`, OpenClaw đồng bộ workspace từ xa trở lại workspace cục bộ.
    - Các công cụ tệp vẫn hoạt động thông qua cầu sandbox, nhưng workspace cục bộ vẫn là nguồn sự thật giữa các lượt.

    Dùng chế độ này khi:

    - bạn chỉnh sửa tệp cục bộ bên ngoài OpenClaw và muốn các thay đổi đó tự động xuất hiện trong môi trường cô lập
    - bạn muốn môi trường cô lập OpenShell hoạt động giống phần phụ trợ Docker nhất có thể
    - bạn muốn không gian làm việc trên máy chủ phản ánh các lần ghi của môi trường cô lập sau mỗi lượt thực thi

    Đánh đổi: tốn thêm chi phí đồng bộ trước và sau khi thực thi.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    Dùng `plugins.entries.openshell.config.mode: "remote"` khi bạn muốn **không gian làm việc OpenShell trở thành nguồn chính thức**.

    Hành vi:

    - Khi môi trường cô lập được tạo lần đầu, OpenClaw gieo không gian làm việc từ xa từ không gian làm việc cục bộ một lần.
    - Sau đó, `exec`, `read`, `write`, `edit`, và `apply_patch` thao tác trực tiếp trên không gian làm việc OpenShell từ xa.
    - OpenClaw **không** đồng bộ các thay đổi từ xa ngược về không gian làm việc cục bộ sau khi thực thi.
    - Việc đọc phương tiện tại thời điểm tạo lời nhắc vẫn hoạt động vì các công cụ tệp và phương tiện đọc qua cầu nối môi trường cô lập thay vì giả định một đường dẫn máy chủ cục bộ.
    - Truyền tải là SSH vào môi trường cô lập OpenShell được trả về bởi `openshell sandbox ssh-config`.

    Hệ quả quan trọng:

    - Nếu bạn chỉnh sửa tệp trên máy chủ bên ngoài OpenClaw sau bước gieo, môi trường cô lập từ xa sẽ **không** tự động thấy các thay đổi đó.
    - Nếu môi trường cô lập được tạo lại, không gian làm việc từ xa lại được gieo từ không gian làm việc cục bộ.
    - Với `scope: "agent"` hoặc `scope: "shared"`, không gian làm việc từ xa đó được chia sẻ ở cùng phạm vi đó.

    Dùng tùy chọn này khi:

    - môi trường cô lập chủ yếu nên tồn tại ở phía OpenShell từ xa
    - bạn muốn giảm chi phí đồng bộ trên mỗi lượt
    - bạn không muốn các chỉnh sửa cục bộ trên máy chủ âm thầm ghi đè trạng thái môi trường cô lập từ xa

  </Tab>
</Tabs>

Chọn `mirror` nếu bạn xem môi trường cô lập như một môi trường thực thi tạm thời. Chọn `remote` nếu bạn xem môi trường cô lập như không gian làm việc thực sự.

#### Vòng đời OpenShell

Môi trường cô lập OpenShell vẫn được quản lý qua vòng đời môi trường cô lập thông thường:

- `openclaw sandbox list` hiển thị runtime OpenShell cũng như runtime Docker
- `openclaw sandbox recreate` xóa runtime hiện tại và cho phép OpenClaw tạo lại trong lần dùng tiếp theo
- logic dọn dẹp cũng nhận biết phần phụ trợ

Đối với chế độ `remote`, việc tạo lại đặc biệt quan trọng:

- tạo lại sẽ xóa không gian làm việc từ xa chính thức cho phạm vi đó
- lần dùng tiếp theo gieo một không gian làm việc từ xa mới từ không gian làm việc cục bộ

Đối với chế độ `mirror`, việc tạo lại chủ yếu đặt lại môi trường thực thi từ xa vì không gian làm việc cục bộ dù sao vẫn là nguồn chính thức.

## Truy cập không gian làm việc

`agents.defaults.sandbox.workspaceAccess` kiểm soát **môi trường cô lập có thể thấy gì**:

<Tabs>
  <Tab title="none (default)">
    Công cụ thấy một không gian làm việc môi trường cô lập dưới `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Gắn không gian làm việc của tác tử ở chế độ chỉ đọc tại `/agent` (vô hiệu hóa `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Gắn không gian làm việc của tác tử ở chế độ đọc/ghi tại `/workspace`.
  </Tab>
</Tabs>

Với phần phụ trợ OpenShell:

- chế độ `mirror` vẫn dùng không gian làm việc cục bộ làm nguồn chính thức giữa các lượt thực thi
- chế độ `remote` dùng không gian làm việc OpenShell từ xa làm nguồn chính thức sau bước gieo ban đầu
- `workspaceAccess: "ro"` và `"none"` vẫn hạn chế hành vi ghi theo cùng cách

Phương tiện đến được sao chép vào không gian làm việc môi trường cô lập đang hoạt động (`media/inbound/*`).

<Note>
**Ghi chú về Skills:** công cụ `read` được neo theo gốc môi trường cô lập. Với `workspaceAccess: "none"`, OpenClaw phản chiếu các Skills đủ điều kiện vào không gian làm việc môi trường cô lập (`.../skills`) để có thể đọc chúng. Với `"rw"`, Skills trong không gian làm việc có thể đọc được từ `/workspace/skills`.
</Note>

## Gắn kết bind tùy chỉnh

`agents.defaults.sandbox.docker.binds` gắn thêm các thư mục máy chủ vào container. Định dạng: `host:container:mode` (ví dụ: `"/home/user/source:/source:rw"`).

Các bind toàn cục và theo từng tác tử được **hợp nhất** (không thay thế). Trong `scope: "shared"`, bind theo từng tác tử bị bỏ qua.

`agents.defaults.sandbox.browser.binds` chỉ gắn thêm các thư mục máy chủ vào container **trình duyệt môi trường cô lập**.

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

- Bind bỏ qua hệ thống tệp của môi trường cô lập: chúng phơi bày đường dẫn máy chủ với bất kỳ chế độ nào bạn đặt (`:ro` hoặc `:rw`).
- OpenClaw chặn các nguồn bind nguy hiểm (ví dụ: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`, và các điểm gắn cha có thể phơi bày chúng).
- OpenClaw cũng chặn các gốc thông tin xác thực phổ biến trong thư mục home như `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, và `~/.ssh`.
- Việc xác thực bind không chỉ là so khớp chuỗi. OpenClaw chuẩn hóa đường dẫn nguồn, rồi phân giải lại qua tổ tiên sâu nhất hiện có trước khi kiểm tra lại các đường dẫn bị chặn và các gốc được phép.
- Điều đó có nghĩa là các lối thoát qua symlink ở thư mục cha vẫn bị đóng chặt ngay cả khi lá cuối cùng chưa tồn tại. Ví dụ: `/workspace/run-link/new-file` vẫn phân giải thành `/var/run/...` nếu `run-link` trỏ tới đó.
- Các gốc nguồn được phép cũng được chuẩn hóa theo cùng cách, nên một đường dẫn chỉ trông như nằm trong danh sách cho phép trước khi phân giải symlink vẫn bị từ chối là `outside allowed roots`.
- Các điểm gắn nhạy cảm (bí mật, khóa SSH, thông tin xác thực dịch vụ) nên là `:ro` trừ khi thực sự cần thiết.
- Kết hợp với `workspaceAccess: "ro"` nếu bạn chỉ cần quyền đọc vào không gian làm việc; chế độ bind vẫn độc lập.
- Xem [Môi trường cô lập so với chính sách công cụ so với nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) để biết bind tương tác với chính sách công cụ và thực thi nâng quyền như thế nào.

</Warning>

## Hình ảnh và thiết lập

Hình ảnh Docker mặc định: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Build the default image">
    ```bash
    scripts/sandbox-setup.sh
    ```

    Hình ảnh mặc định **không** bao gồm Node. Nếu một skill cần Node (hoặc các runtime khác), hãy bake một hình ảnh tùy chỉnh hoặc cài đặt qua `sandbox.docker.setupCommand` (yêu cầu egress mạng + root có thể ghi + người dùng root).

    OpenClaw không âm thầm thay thế bằng `debian:bookworm-slim` thuần khi thiếu `openclaw-sandbox:bookworm-slim`. Các lần chạy môi trường cô lập nhắm tới hình ảnh mặc định sẽ thất bại nhanh với hướng dẫn build cho đến khi bạn chạy `scripts/sandbox-setup.sh`, vì hình ảnh đi kèm mang `python3` cho các trình trợ giúp ghi/chỉnh sửa của môi trường cô lập.

  </Step>
  <Step title="Optional: build the common image">
    Để có hình ảnh môi trường cô lập nhiều chức năng hơn với công cụ phổ biến (ví dụ `curl`, `jq`, `nodejs`, `python3`, `git`):

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Sau đó đặt `agents.defaults.sandbox.docker.image` thành `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: build the sandbox browser image">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

Theo mặc định, các container môi trường cô lập Docker chạy với **không có mạng**. Ghi đè bằng `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    Hình ảnh trình duyệt môi trường cô lập đi kèm cũng áp dụng các mặc định khởi động Chromium thận trọng cho khối lượng công việc container hóa. Các mặc định container hiện tại bao gồm:

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
    - Ba cờ gia cố đồ họa (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) là tùy chọn và hữu ích khi container thiếu hỗ trợ GPU. Đặt `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` nếu khối lượng công việc của bạn yêu cầu WebGL hoặc các tính năng 3D/trình duyệt khác.
    - `--disable-extensions` được bật theo mặc định và có thể tắt bằng `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` cho các luồng phụ thuộc vào tiện ích mở rộng.
    - `--renderer-process-limit=2` được kiểm soát bởi `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, trong đó `0` giữ mặc định của Chromium.

    Nếu bạn cần một hồ sơ runtime khác, hãy dùng hình ảnh trình duyệt tùy chỉnh và cung cấp entrypoint riêng. Đối với hồ sơ Chromium cục bộ (không container), dùng `browser.extraArgs` để nối thêm các cờ khởi động bổ sung.

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` bị chặn.
    - `network: "container:<id>"` bị chặn theo mặc định (rủi ro vượt qua bằng cách tham gia namespace).
    - Ghi đè phá kính khẩn cấp: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Các bản cài đặt Docker và Gateway trong container nằm tại đây: [Docker](/vi/install/docker)

Đối với các triển khai Gateway Docker, `scripts/docker/setup.sh` có thể khởi tạo cấu hình môi trường cô lập. Đặt `OPENCLAW_SANDBOX=1` (hoặc `true`/`yes`/`on`) để bật đường dẫn đó. Bạn có thể ghi đè vị trí socket bằng `OPENCLAW_DOCKER_SOCKET`. Thiết lập đầy đủ và tham chiếu env: [Docker](/vi/install/docker#agent-sandbox).

## setupCommand (thiết lập container một lần)

`setupCommand` chạy **một lần** sau khi container môi trường cô lập được tạo (không chạy ở mọi lần). Nó thực thi bên trong container qua `sh -lc`.

Đường dẫn:

- Toàn cục: `agents.defaults.sandbox.docker.setupCommand`
- Theo từng tác tử: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Common pitfalls">
    - `docker.network` mặc định là `"none"` (không có egress), nên cài đặt gói sẽ thất bại.
    - `docker.network: "container:<id>"` yêu cầu `dangerouslyAllowContainerNamespaceJoin: true` và chỉ dành cho trường hợp phá kính khẩn cấp.
    - `readOnlyRoot: true` ngăn ghi; đặt `readOnlyRoot: false` hoặc bake một hình ảnh tùy chỉnh.
    - `user` phải là root để cài đặt gói (bỏ qua `user` hoặc đặt `user: "0:0"`).
    - Thực thi môi trường cô lập **không** kế thừa `process.env` của máy chủ. Dùng `agents.defaults.sandbox.docker.env` (hoặc một hình ảnh tùy chỉnh) cho khóa API của skill.

  </Accordion>
</AccordionGroup>

## Chính sách công cụ và lối thoát

Các chính sách cho phép/từ chối công cụ vẫn áp dụng trước quy tắc môi trường cô lập. Nếu một công cụ bị từ chối toàn cục hoặc theo từng tác tử, môi trường cô lập không mang nó trở lại.

`tools.elevated` là lối thoát rõ ràng chạy `exec` bên ngoài môi trường cô lập (`gateway` theo mặc định, hoặc `node` khi mục tiêu thực thi là `node`). Các chỉ thị `/exec` chỉ áp dụng cho người gửi được ủy quyền và tồn tại theo từng phiên; để vô hiệu hóa cứng `exec`, hãy dùng từ chối trong chính sách công cụ (xem [Môi trường cô lập so với chính sách công cụ so với nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated)).

Gỡ lỗi:

- Dùng `openclaw sandbox explain` để kiểm tra chế độ môi trường cô lập hiệu lực, chính sách công cụ, và các khóa cấu hình sửa lỗi.
- Xem [Môi trường cô lập so với chính sách công cụ so với nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) để có mô hình tư duy "vì sao điều này bị chặn?".

Giữ nó được khóa chặt.

## Ghi đè đa tác tử

Mỗi tác tử có thể ghi đè môi trường cô lập + công cụ: `agents.list[].sandbox` và `agents.list[].tools` (cộng với `agents.list[].tools.sandbox.tools` cho chính sách công cụ của môi trường cô lập). Xem [Môi trường cô lập & công cụ đa tác tử](/vi/tools/multi-agent-sandbox-tools) để biết thứ tự ưu tiên.

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

- [Hộp cát đa tác nhân & công cụ](/vi/tools/multi-agent-sandbox-tools) — ghi đè theo từng tác nhân và thứ tự ưu tiên
- [OpenShell](/vi/gateway/openshell) — thiết lập backend hộp cát được quản lý, chế độ không gian làm việc và tham chiếu cấu hình
- [Cấu hình hộp cát](/vi/gateway/config-agents#agentsdefaultssandbox)
- [Hộp cát so với Chính sách công cụ so với Đặc quyền nâng cao](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) — gỡ lỗi "tại sao thao tác này bị chặn?"
- [Bảo mật](/vi/gateway/security)
