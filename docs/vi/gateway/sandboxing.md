---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Cách hoạt động của cơ chế sandbox trong OpenClaw: các chế độ, phạm vi, quyền truy cập không gian làm việc và hình ảnh'
title: Cơ chế cách ly
x-i18n:
    generated_at: "2026-05-02T10:42:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f313333ec676aaef636b42d4a6f28f35bf213d9e1c5292ffb4868f312cf0eda
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw có thể chạy **công cụ bên trong các backend sandbox** để giảm phạm vi ảnh hưởng. Tính năng này là **tùy chọn** và được kiểm soát bằng cấu hình (`agents.defaults.sandbox` hoặc `agents.list[].sandbox`). Nếu sandboxing bị tắt, công cụ chạy trên host. Gateway vẫn ở trên host; việc thực thi công cụ chạy trong một sandbox cô lập khi được bật.

<Note>
Đây không phải là ranh giới bảo mật hoàn hảo, nhưng nó giới hạn đáng kể quyền truy cập hệ thống tệp và tiến trình khi mô hình làm điều gì đó ngớ ngẩn.
</Note>

## Những gì được sandbox

- Thực thi công cụ (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, v.v.).
- Trình duyệt sandbox tùy chọn (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Chi tiết trình duyệt sandbox">
    - Theo mặc định, trình duyệt sandbox tự động khởi động (đảm bảo CDP có thể truy cập được) khi công cụ trình duyệt cần đến. Cấu hình qua `agents.defaults.sandbox.browser.autoStart` và `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Theo mặc định, container trình duyệt sandbox dùng một mạng Docker chuyên dụng (`openclaw-sandbox-browser`) thay vì mạng `bridge` toàn cục. Cấu hình bằng `agents.defaults.sandbox.browser.network`.
    - `agents.defaults.sandbox.browser.cdpSourceRange` tùy chọn hạn chế ingress CDP ở rìa container bằng allowlist CIDR (ví dụ `172.21.0.1/32`).
    - Quyền truy cập quan sát noVNC được bảo vệ bằng mật khẩu theo mặc định; OpenClaw phát ra một URL token tồn tại ngắn hạn, URL này phục vụ một trang bootstrap cục bộ và mở noVNC với mật khẩu trong URL fragment (không nằm trong query/header logs).
    - `agents.defaults.sandbox.browser.allowHostControl` cho phép các phiên sandbox nhắm rõ ràng đến trình duyệt trên host.
    - Các allowlist tùy chọn kiểm soát `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Không được sandbox:

- Bản thân tiến trình Gateway.
- Bất kỳ công cụ nào được cho phép rõ ràng chạy bên ngoài sandbox (ví dụ `tools.elevated`).
  - **Exec nâng quyền bỏ qua sandboxing và dùng đường thoát đã cấu hình (`gateway` theo mặc định, hoặc `node` khi mục tiêu exec là `node`).**
  - Nếu sandboxing bị tắt, `tools.elevated` không thay đổi cách thực thi (vốn đã ở trên host). Xem [Chế độ nâng quyền](/vi/tools/elevated).

## Chế độ

`agents.defaults.sandbox.mode` kiểm soát **khi nào** sandboxing được dùng:

<Tabs>
  <Tab title="off">
    Không sandboxing.
  </Tab>
  <Tab title="non-main">
    Chỉ sandbox các phiên **không phải main** (mặc định nếu bạn muốn các cuộc trò chuyện thông thường chạy trên host).

    `"non-main"` dựa trên `session.mainKey` (mặc định `"main"`), không phải agent id. Các phiên nhóm/kênh dùng khóa riêng, nên chúng được tính là không phải main và sẽ được sandbox.

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

- `"docker"` (mặc định khi sandboxing được bật): runtime sandbox cục bộ dựa trên Docker.
- `"ssh"`: runtime sandbox từ xa chung dựa trên SSH.
- `"openshell"`: runtime sandbox dựa trên OpenShell.

Cấu hình dành riêng cho SSH nằm trong `agents.defaults.sandbox.ssh`. Cấu hình dành riêng cho OpenShell nằm trong `plugins.entries.openshell.config`.

### Chọn backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Nơi chạy**        | Container cục bộ                 | Bất kỳ host nào truy cập được qua SSH | Sandbox do OpenShell quản lý                        |
| **Thiết lập**       | `scripts/sandbox-setup.sh`       | Khóa SSH + host đích           | Plugin OpenShell đã bật                             |
| **Mô hình workspace** | Bind-mount hoặc sao chép       | Lấy remote làm chuẩn (seed một lần) | `mirror` hoặc `remote`                              |
| **Kiểm soát mạng**  | `docker.network` (mặc định: không có) | Phụ thuộc vào host từ xa       | Phụ thuộc vào OpenShell                             |
| **Sandbox trình duyệt** | Được hỗ trợ                  | Không được hỗ trợ              | Chưa được hỗ trợ                                    |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Phù hợp nhất cho** | Phát triển cục bộ, cô lập đầy đủ | Chuyển tải sang máy từ xa      | Sandbox từ xa được quản lý với đồng bộ hai chiều tùy chọn |

### Backend Docker

Sandboxing bị tắt theo mặc định. Nếu bạn bật sandboxing và không chọn backend, OpenClaw dùng backend Docker. Nó thực thi công cụ và trình duyệt sandbox cục bộ qua socket Docker daemon (`/var/run/docker.sock`). Cách cô lập container sandbox được xác định bởi namespace của Docker.

Để mở GPU của host cho sandbox Docker, đặt `agents.defaults.sandbox.docker.gpus` hoặc override theo agent `agents.list[].sandbox.docker.gpus`. Giá trị được truyền vào cờ `--gpus` của Docker dưới dạng một đối số riêng, ví dụ `"all"` hoặc `"device=GPU-uuid"`, và yêu cầu runtime host tương thích như NVIDIA Container Toolkit.

<Warning>
**Ràng buộc Docker-out-of-Docker (DooD)**

Nếu bạn triển khai chính OpenClaw Gateway dưới dạng container Docker, nó điều phối các container sandbox ngang hàng bằng socket Docker của host (DooD). Điều này tạo ra một ràng buộc ánh xạ đường dẫn cụ thể:

- **Cấu hình yêu cầu đường dẫn host**: Cấu hình `workspace` trong `openclaw.json` PHẢI chứa **đường dẫn tuyệt đối của Host** (ví dụ `/home/user/.openclaw/workspaces`), không phải đường dẫn nội bộ của container Gateway. Khi OpenClaw yêu cầu Docker daemon tạo sandbox, daemon đánh giá đường dẫn tương đối với namespace của hệ điều hành Host, không phải namespace của Gateway.
- **Tính tương đương cầu nối FS (ánh xạ volume giống hệt)**: Tiến trình native của OpenClaw Gateway cũng ghi các tệp heartbeat và bridge vào thư mục `workspace`. Vì Gateway đánh giá chính xác cùng một chuỗi (đường dẫn host) từ bên trong môi trường container của nó, triển khai Gateway PHẢI bao gồm một ánh xạ volume giống hệt liên kết namespace host một cách native (`-v /home/user/.openclaw:/home/user/.openclaw`).

Nếu bạn ánh xạ đường dẫn nội bộ mà không có tính tương đương tuyệt đối với host, OpenClaw sẽ natively ném lỗi quyền `EACCES` khi cố ghi heartbeat bên trong môi trường container vì chuỗi đường dẫn đầy đủ đó không tồn tại natively.
</Warning>

### Backend SSH

Dùng `backend: "ssh"` khi bạn muốn OpenClaw sandbox `exec`, công cụ tệp, và đọc media trên một máy bất kỳ có thể truy cập qua SSH.

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
    - OpenClaw tạo một root từ xa theo từng phạm vi trong `sandbox.ssh.workspaceRoot`.
    - Ở lần dùng đầu tiên sau khi tạo hoặc tạo lại, OpenClaw seed workspace từ xa đó từ workspace cục bộ một lần.
    - Sau đó, `exec`, `read`, `write`, `edit`, `apply_patch`, đọc media trong prompt, và staging media đầu vào chạy trực tiếp trên workspace từ xa qua SSH.
    - OpenClaw không tự động đồng bộ thay đổi từ xa về workspace cục bộ.

  </Accordion>
  <Accordion title="Vật liệu xác thực">
    - `identityFile`, `certificateFile`, `knownHostsFile`: dùng các tệp cục bộ hiện có và truyền chúng qua cấu hình OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: dùng chuỗi nội tuyến hoặc SecretRefs. OpenClaw phân giải chúng qua snapshot runtime secrets thông thường, ghi chúng vào tệp tạm với `0600`, rồi xóa chúng khi phiên SSH kết thúc.
    - Nếu cả `*File` và `*Data` được đặt cho cùng một mục, `*Data` thắng trong phiên SSH đó.

  </Accordion>
  <Accordion title="Hệ quả của việc lấy remote làm chuẩn">
    Đây là mô hình **lấy remote làm chuẩn**. Workspace SSH từ xa trở thành trạng thái sandbox thật sau bước seed ban đầu.

    - Các chỉnh sửa host-local được thực hiện bên ngoài OpenClaw sau bước seed sẽ không hiển thị từ xa cho đến khi bạn tạo lại sandbox.
    - `openclaw sandbox recreate` xóa root từ xa theo từng phạm vi và seed lại từ cục bộ ở lần dùng tiếp theo.
    - Sandboxing trình duyệt không được hỗ trợ trên backend SSH.
    - Thiết lập `sandbox.docker.*` không áp dụng cho backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Dùng `backend: "openshell"` khi bạn muốn OpenClaw sandbox công cụ trong môi trường từ xa do OpenShell quản lý. Để xem hướng dẫn thiết lập đầy đủ, tham chiếu cấu hình, và so sánh chế độ workspace, xem [trang OpenShell](/vi/gateway/openshell) chuyên biệt.

OpenShell tái sử dụng cùng transport SSH cốt lõi và cầu nối hệ thống tệp từ xa như backend SSH chung, đồng thời thêm lifecycle riêng của OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) cùng chế độ workspace `mirror` tùy chọn.

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

- `mirror` (mặc định): workspace cục bộ vẫn là chuẩn. OpenClaw đồng bộ tệp cục bộ vào OpenShell trước exec và đồng bộ workspace từ xa trở lại sau exec.
- `remote`: workspace OpenShell là chuẩn sau khi sandbox được tạo. OpenClaw seed workspace từ xa một lần từ workspace cục bộ, sau đó công cụ tệp và exec chạy trực tiếp trên sandbox từ xa mà không đồng bộ thay đổi trở lại.

<AccordionGroup>
  <Accordion title="Chi tiết transport từ xa">
    - OpenClaw yêu cầu OpenShell cung cấp cấu hình SSH dành riêng cho sandbox qua `openshell sandbox ssh-config <name>`.
    - Core ghi cấu hình SSH đó vào tệp tạm, mở phiên SSH, và tái sử dụng cùng cầu nối hệ thống tệp từ xa được dùng bởi `backend: "ssh"`.
    - Chỉ trong chế độ `mirror`, lifecycle mới khác: đồng bộ cục bộ lên từ xa trước exec, rồi đồng bộ trở lại sau exec.

  </Accordion>
  <Accordion title="Giới hạn hiện tại của OpenShell">
    - trình duyệt sandbox chưa được hỗ trợ
    - `sandbox.docker.binds` không được hỗ trợ trên backend OpenShell
    - Các núm runtime dành riêng cho Docker trong `sandbox.docker.*` vẫn chỉ áp dụng cho backend Docker

  </Accordion>
</AccordionGroup>

#### Chế độ workspace

OpenShell có hai mô hình workspace. Đây là phần quan trọng nhất trong thực tế.

<Tabs>
  <Tab title="mirror (local canonical)">
    Dùng `plugins.entries.openshell.config.mode: "mirror"` khi bạn muốn **workspace cục bộ vẫn là chuẩn**.

    Hành vi:

    - Trước `exec`, OpenClaw đồng bộ workspace cục bộ vào sandbox OpenShell.
    - Sau `exec`, OpenClaw đồng bộ workspace từ xa trở lại workspace cục bộ.
    - Công cụ tệp vẫn hoạt động qua cầu nối sandbox, nhưng workspace cục bộ vẫn là nguồn sự thật giữa các lượt.

    Dùng cách này khi:

    - bạn chỉnh sửa tệp cục bộ bên ngoài OpenClaw và muốn các thay đổi đó tự động xuất hiện trong môi trường cách ly
    - bạn muốn môi trường cách ly OpenShell hoạt động giống backend Docker nhiều nhất có thể
    - bạn muốn không gian làm việc trên máy chủ phản ánh các lần ghi của môi trường cách ly sau mỗi lượt exec

    Đánh đổi: tốn thêm chi phí đồng bộ trước và sau exec.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    Dùng `plugins.entries.openshell.config.mode: "remote"` khi bạn muốn **không gian làm việc OpenShell trở thành nguồn chuẩn**.

    Hành vi:

    - Khi môi trường cách ly được tạo lần đầu, OpenClaw khởi tạo không gian làm việc từ xa từ không gian làm việc cục bộ một lần.
    - Sau đó, `exec`, `read`, `write`, `edit`, và `apply_patch` thao tác trực tiếp trên không gian làm việc OpenShell từ xa.
    - OpenClaw **không** đồng bộ các thay đổi từ xa trở lại không gian làm việc cục bộ sau exec.
    - Việc đọc media tại thời điểm prompt vẫn hoạt động vì các công cụ tệp và media đọc qua cầu nối môi trường cách ly thay vì giả định đường dẫn máy chủ cục bộ.
    - Transport là SSH vào môi trường cách ly OpenShell do `openshell sandbox ssh-config` trả về.

    Hệ quả quan trọng:

    - Nếu bạn chỉnh sửa tệp trên máy chủ bên ngoài OpenClaw sau bước khởi tạo, môi trường cách ly từ xa sẽ **không** tự động thấy các thay đổi đó.
    - Nếu môi trường cách ly được tạo lại, không gian làm việc từ xa sẽ được khởi tạo lại từ không gian làm việc cục bộ.
    - Với `scope: "agent"` hoặc `scope: "shared"`, không gian làm việc từ xa đó được chia sẻ ở cùng phạm vi đó.

    Dùng chế độ này khi:

    - môi trường cách ly nên chủ yếu nằm ở phía OpenShell từ xa
    - bạn muốn giảm chi phí đồng bộ theo từng lượt
    - bạn không muốn các chỉnh sửa cục bộ trên máy chủ âm thầm ghi đè trạng thái môi trường cách ly từ xa

  </Tab>
</Tabs>

Chọn `mirror` nếu bạn xem môi trường cách ly là môi trường thực thi tạm thời. Chọn `remote` nếu bạn xem môi trường cách ly là không gian làm việc thật.

#### Vòng đời OpenShell

Môi trường cách ly OpenShell vẫn được quản lý thông qua vòng đời môi trường cách ly thông thường:

- `openclaw sandbox list` hiển thị runtime OpenShell cũng như runtime Docker
- `openclaw sandbox recreate` xóa runtime hiện tại và để OpenClaw tạo lại runtime đó trong lần dùng tiếp theo
- logic dọn dẹp cũng nhận biết backend

Với chế độ `remote`, việc tạo lại đặc biệt quan trọng:

- tạo lại sẽ xóa không gian làm việc từ xa chuẩn cho phạm vi đó
- lần dùng tiếp theo sẽ khởi tạo một không gian làm việc từ xa mới từ không gian làm việc cục bộ

Với chế độ `mirror`, việc tạo lại chủ yếu đặt lại môi trường thực thi từ xa vì không gian làm việc cục bộ vẫn là nguồn chuẩn.

## Quyền truy cập không gian làm việc

`agents.defaults.sandbox.workspaceAccess` kiểm soát **môi trường cách ly có thể thấy gì**:

<Tabs>
  <Tab title="none (default)">
    Công cụ thấy một không gian làm việc môi trường cách ly dưới `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Gắn không gian làm việc của agent ở chế độ chỉ đọc tại `/agent` (vô hiệu hóa `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Gắn không gian làm việc của agent ở chế độ đọc/ghi tại `/workspace`.
  </Tab>
</Tabs>

Với backend OpenShell:

- chế độ `mirror` vẫn dùng không gian làm việc cục bộ làm nguồn chuẩn giữa các lượt exec
- chế độ `remote` dùng không gian làm việc OpenShell từ xa làm nguồn chuẩn sau lần khởi tạo ban đầu
- `workspaceAccess: "ro"` và `"none"` vẫn hạn chế hành vi ghi theo cùng cách

Media đi vào được sao chép vào không gian làm việc môi trường cách ly đang hoạt động (`media/inbound/*`).

<Note>
**Ghi chú về Skills:** công cụ `read` được neo tại gốc môi trường cách ly. Với `workspaceAccess: "none"`, OpenClaw phản chiếu các Skills đủ điều kiện vào không gian làm việc môi trường cách ly (`.../skills`) để có thể đọc được. Với `"rw"`, Skills của không gian làm việc có thể đọc được từ `/workspace/skills`.
</Note>

## Bind mount tùy chỉnh

`agents.defaults.sandbox.docker.binds` gắn thêm các thư mục máy chủ vào container. Định dạng: `host:container:mode` (ví dụ: `"/home/user/source:/source:rw"`).

Bind toàn cục và theo từng agent được **hợp nhất** (không thay thế). Với `scope: "shared"`, bind theo từng agent bị bỏ qua.

`agents.defaults.sandbox.browser.binds` chỉ gắn thêm các thư mục máy chủ vào container **trình duyệt môi trường cách ly**.

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

- Bind bỏ qua hệ thống tệp của môi trường cách ly: chúng phơi bày các đường dẫn máy chủ với bất kỳ chế độ nào bạn đặt (`:ro` hoặc `:rw`).
- OpenClaw chặn các nguồn bind nguy hiểm (ví dụ: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`, và các mount cha có thể phơi bày chúng).
- OpenClaw cũng chặn các gốc thông tin xác thực phổ biến trong thư mục home như `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, và `~/.ssh`.
- Xác thực bind không chỉ là so khớp chuỗi. OpenClaw chuẩn hóa đường dẫn nguồn, rồi phân giải lại qua tổ tiên sâu nhất đang tồn tại trước khi kiểm tra lại các đường dẫn bị chặn và các gốc được phép.
- Điều đó có nghĩa là các lối thoát qua symlink cha vẫn bị đóng an toàn ngay cả khi nút lá cuối cùng chưa tồn tại. Ví dụ: `/workspace/run-link/new-file` vẫn phân giải thành `/var/run/...` nếu `run-link` trỏ đến đó.
- Các gốc nguồn được phép cũng được chuẩn hóa theo cùng cách, vì vậy một đường dẫn chỉ có vẻ nằm trong allowlist trước khi phân giải symlink vẫn bị từ chối với lỗi `outside allowed roots`.
- Các mount nhạy cảm (secrets, khóa SSH, thông tin xác thực dịch vụ) nên là `:ro` trừ khi thật sự cần thiết.
- Kết hợp với `workspaceAccess: "ro"` nếu bạn chỉ cần quyền đọc đối với không gian làm việc; chế độ bind vẫn độc lập.
- Xem [Môi trường cách ly so với chính sách công cụ so với nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) để biết bind tương tác với chính sách công cụ và exec nâng quyền như thế nào.

</Warning>

## Image và thiết lập

Image Docker mặc định: `openclaw-sandbox:bookworm-slim`

<Note>
**Source checkout so với npm install**

Các script trợ giúp `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh`, và `scripts/sandbox-browser-setup.sh` chỉ có sẵn khi chạy từ một [source checkout](https://github.com/openclaw/openclaw). Chúng không được bao gồm trong gói npm.

Nếu bạn đã cài OpenClaw qua `npm install -g openclaw`, hãy dùng các lệnh `docker build` nội tuyến được hiển thị bên dưới.
</Note>

<Steps>
  <Step title="Build the default image">
    Từ một source checkout:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Từ một bản cài npm (không cần source checkout):

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

    Image mặc định **không** bao gồm Node. Nếu một skill cần Node (hoặc runtime khác), hãy bake một image tùy chỉnh hoặc cài qua `sandbox.docker.setupCommand` (yêu cầu egress mạng + root có thể ghi + user root).

    OpenClaw không âm thầm thay thế bằng `debian:bookworm-slim` thuần khi thiếu `openclaw-sandbox:bookworm-slim`. Các lần chạy môi trường cách ly nhắm đến image mặc định sẽ fail fast với hướng dẫn build cho đến khi bạn build nó, vì image đi kèm chứa `python3` cho các helper ghi/chỉnh sửa của môi trường cách ly.

  </Step>
  <Step title="Optional: build the common image">
    Để có image môi trường cách ly nhiều chức năng hơn với công cụ phổ biến (ví dụ `curl`, `jq`, `nodejs`, `python3`, `git`):

    Từ một source checkout:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Từ một bản cài npm, trước tiên build image mặc định (xem bên trên), rồi build image common phía trên bằng [`Dockerfile.sandbox-common`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-common) từ repository.

    Sau đó đặt `agents.defaults.sandbox.docker.image` thành `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: build the sandbox browser image">
    Từ một source checkout:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Từ một bản cài npm, build bằng [`Dockerfile.sandbox-browser`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-browser) từ repository.

  </Step>
</Steps>

Theo mặc định, các container môi trường cách ly Docker chạy với **không có mạng**. Ghi đè bằng `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    Image trình duyệt môi trường cách ly đi kèm cũng áp dụng các mặc định khởi động Chromium thận trọng cho workload trong container. Các mặc định container hiện tại bao gồm:

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
    - Ba cờ tăng cứng đồ họa (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) là tùy chọn và hữu ích khi container thiếu hỗ trợ GPU. Đặt `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` nếu workload của bạn cần WebGL hoặc các tính năng 3D/trình duyệt khác.
    - `--disable-extensions` được bật theo mặc định và có thể tắt bằng `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` cho các luồng phụ thuộc vào extension.
    - `--renderer-process-limit=2` được kiểm soát bởi `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, trong đó `0` giữ mặc định của Chromium.

    Nếu bạn cần một hồ sơ runtime khác, hãy dùng image trình duyệt tùy chỉnh và cung cấp entrypoint riêng. Với hồ sơ Chromium cục bộ (không phải container), dùng `browser.extraArgs` để thêm các cờ khởi động bổ sung.

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` bị chặn.
    - `network: "container:<id>"` bị chặn theo mặc định (rủi ro vượt qua bằng cách tham gia namespace).
    - Ghi đè break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Các bản cài Docker và Gateway trong container nằm ở đây: [Docker](/vi/install/docker)

Đối với triển khai Docker Gateway, `scripts/docker/setup.sh` có thể bootstrap cấu hình môi trường cách ly. Đặt `OPENCLAW_SANDBOX=1` (hoặc `true`/`yes`/`on`) để bật đường dẫn đó. Bạn có thể ghi đè vị trí socket bằng `OPENCLAW_DOCKER_SOCKET`. Thiết lập đầy đủ và tham chiếu env: [Docker](/vi/install/docker#agent-sandbox).

## setupCommand (thiết lập container một lần)

`setupCommand` chạy **một lần** sau khi container môi trường cách ly được tạo (không phải trong mọi lần chạy). Nó thực thi bên trong container qua `sh -lc`.

Đường dẫn:

- Toàn cục: `agents.defaults.sandbox.docker.setupCommand`
- Theo từng agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Common pitfalls">
    - `docker.network` mặc định là `"none"` (không có egress), nên các lần cài gói sẽ thất bại.
    - `docker.network: "container:<id>"` yêu cầu `dangerouslyAllowContainerNamespaceJoin: true` và chỉ dùng cho break-glass.
    - `readOnlyRoot: true` ngăn ghi; đặt `readOnlyRoot: false` hoặc bake một image tùy chỉnh.
    - `user` phải là root để cài gói (bỏ qua `user` hoặc đặt `user: "0:0"`).
    - Exec trong môi trường cách ly **không** kế thừa `process.env` của máy chủ. Dùng `agents.defaults.sandbox.docker.env` (hoặc image tùy chỉnh) cho khóa API của skill.

  </Accordion>
</AccordionGroup>

## Chính sách công cụ và cơ chế thoát

Các chính sách cho phép/từ chối công cụ vẫn được áp dụng trước các quy tắc sandbox. Nếu một công cụ bị từ chối ở phạm vi toàn cục hoặc theo từng agent, cơ chế sandbox sẽ không khôi phục công cụ đó.

`tools.elevated` là một cơ chế thoát tường minh chạy `exec` bên ngoài sandbox (`gateway` theo mặc định, hoặc `node` khi mục tiêu exec là `node`). Các chỉ thị `/exec` chỉ áp dụng cho người gửi được ủy quyền và được duy trì theo từng phiên; để vô hiệu hóa hoàn toàn `exec`, hãy dùng chính sách từ chối công cụ (xem [Sandbox so với Chính sách công cụ so với Elevated](/vi/gateway/sandbox-vs-tool-policy-vs-elevated)).

Gỡ lỗi:

- Dùng `openclaw sandbox explain` để kiểm tra chế độ sandbox hiệu lực, chính sách công cụ và các khóa cấu hình sửa lỗi.
- Xem [Sandbox so với Chính sách công cụ so với Elevated](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) để biết mô hình tư duy "tại sao việc này bị chặn?".

Luôn khóa chặt cấu hình.

## Ghi đè đa agent

Mỗi agent có thể ghi đè sandbox + công cụ: `agents.list[].sandbox` và `agents.list[].tools` (cộng thêm `agents.list[].tools.sandbox.tools` cho chính sách công cụ sandbox). Xem [Sandbox & Công cụ đa agent](/vi/tools/multi-agent-sandbox-tools) để biết thứ tự ưu tiên.

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

- [Sandbox & Công cụ đa agent](/vi/tools/multi-agent-sandbox-tools) — ghi đè theo từng agent và thứ tự ưu tiên
- [OpenShell](/vi/gateway/openshell) — thiết lập backend sandbox được quản lý, chế độ workspace và tham chiếu cấu hình
- [Cấu hình sandbox](/vi/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox so với Chính sách công cụ so với Elevated](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) — gỡ lỗi "tại sao việc này bị chặn?"
- [Bảo mật](/vi/gateway/security)
