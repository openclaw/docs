---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Cách cơ chế sandbox của OpenClaw hoạt động: chế độ, phạm vi, quyền truy cập không gian làm việc và hình ảnh'
title: Cơ chế cách ly
x-i18n:
    generated_at: "2026-05-03T21:32:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: e887d07ed84d582bb605c75f841499b6bed42cfc94d60690aba33c2f351b272b
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw có thể chạy **công cụ bên trong các backend hộp cát** để giảm phạm vi ảnh hưởng. Điều này là **tùy chọn** và được kiểm soát bằng cấu hình (`agents.defaults.sandbox` hoặc `agents.list[].sandbox`). Nếu tắt hộp cát, công cụ chạy trên máy chủ. Gateway vẫn ở trên máy chủ; việc thực thi công cụ chạy trong một hộp cát cô lập khi được bật.

<Note>
Đây không phải là một ranh giới bảo mật hoàn hảo, nhưng nó giới hạn đáng kể quyền truy cập hệ thống tệp và tiến trình khi mô hình làm điều gì đó không đúng.
</Note>

## Những gì được đưa vào hộp cát

- Thực thi công cụ (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, v.v.).
- Trình duyệt trong hộp cát tùy chọn (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Sandboxed browser details">
    - Theo mặc định, trình duyệt hộp cát tự động khởi động (đảm bảo có thể truy cập CDP) khi công cụ trình duyệt cần đến nó. Cấu hình qua `agents.defaults.sandbox.browser.autoStart` và `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Theo mặc định, các container trình duyệt hộp cát dùng một mạng Docker chuyên dụng (`openclaw-sandbox-browser`) thay vì mạng `bridge` toàn cục. Cấu hình bằng `agents.defaults.sandbox.browser.network`.
    - `agents.defaults.sandbox.browser.cdpSourceRange` tùy chọn giới hạn CDP ingress ở rìa container bằng danh sách cho phép CIDR (ví dụ `172.21.0.1/32`).
    - Quyền truy cập quan sát noVNC được bảo vệ bằng mật khẩu theo mặc định; OpenClaw phát ra một URL token tồn tại ngắn hạn, URL này phục vụ một trang bootstrap cục bộ và mở noVNC với mật khẩu trong URL fragment (không nằm trong nhật ký query/header).
    - `agents.defaults.sandbox.browser.allowHostControl` cho phép các phiên hộp cát nhắm rõ ràng tới trình duyệt trên máy chủ.
    - Các danh sách cho phép tùy chọn kiểm soát `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Không được đưa vào hộp cát:

- Chính tiến trình Gateway.
- Bất kỳ công cụ nào được cho phép rõ ràng để chạy bên ngoài hộp cát (ví dụ `tools.elevated`).
  - **Elevated exec bỏ qua hộp cát và dùng đường thoát đã cấu hình (`gateway` theo mặc định, hoặc `node` khi đích exec là `node`).**
  - Nếu tắt hộp cát, `tools.elevated` không thay đổi cách thực thi (vốn đã ở trên máy chủ). Xem [Chế độ Elevated](/vi/tools/elevated).

## Chế độ

`agents.defaults.sandbox.mode` kiểm soát **khi nào** hộp cát được dùng:

<Tabs>
  <Tab title="off">
    Không dùng hộp cát.
  </Tab>
  <Tab title="non-main">
    Chỉ đưa các phiên **không phải main** vào hộp cát (mặc định nếu bạn muốn các cuộc trò chuyện bình thường chạy trên máy chủ).

    `"non-main"` dựa trên `session.mainKey` (mặc định `"main"`), không phải id agent. Các phiên nhóm/kênh dùng khóa riêng, nên chúng được tính là không phải main và sẽ được đưa vào hộp cát.

  </Tab>
  <Tab title="all">
    Mọi phiên đều chạy trong hộp cát.
  </Tab>
</Tabs>

## Phạm vi

`agents.defaults.sandbox.scope` kiểm soát **số lượng container** được tạo:

- `"agent"` (mặc định): một container cho mỗi agent.
- `"session"`: một container cho mỗi phiên.
- `"shared"`: một container được chia sẻ bởi tất cả các phiên trong hộp cát.

## Backend

`agents.defaults.sandbox.backend` kiểm soát **runtime nào** cung cấp hộp cát:

- `"docker"` (mặc định khi bật hộp cát): runtime hộp cát cục bộ dựa trên Docker.
- `"ssh"`: runtime hộp cát từ xa chung dựa trên SSH.
- `"openshell"`: runtime hộp cát dựa trên OpenShell.

Cấu hình dành riêng cho SSH nằm dưới `agents.defaults.sandbox.ssh`. Cấu hình dành riêng cho OpenShell nằm dưới `plugins.entries.openshell.config`.

### Chọn backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Nơi chạy**        | Container cục bộ                 | Bất kỳ máy chủ nào truy cập được qua SSH | Hộp cát do OpenShell quản lý                         |
| **Thiết lập**       | `scripts/sandbox-setup.sh`       | Khóa SSH + máy chủ đích        | Plugin OpenShell đã bật                             |
| **Mô hình workspace** | Bind-mount hoặc sao chép       | Remote-canonical (seed một lần) | `mirror` hoặc `remote`                              |
| **Kiểm soát mạng**  | `docker.network` (mặc định: không có) | Phụ thuộc vào máy chủ từ xa | Phụ thuộc vào OpenShell                             |
| **Hộp cát trình duyệt** | Được hỗ trợ                 | Không được hỗ trợ              | Chưa được hỗ trợ                                    |
| **Bind mount**      | `docker.binds`                   | N/A                            | N/A                                                 |
| **Phù hợp nhất cho** | Phát triển cục bộ, cô lập đầy đủ | Chuyển tải sang máy từ xa      | Hộp cát từ xa được quản lý với đồng bộ hai chiều tùy chọn |

### Backend Docker

Hộp cát được tắt theo mặc định. Nếu bạn bật hộp cát và không chọn backend, OpenClaw dùng backend Docker. Nó thực thi công cụ và trình duyệt hộp cát cục bộ qua socket daemon Docker (`/var/run/docker.sock`). Mức cô lập container hộp cát được xác định bởi namespace của Docker.

Để đưa GPU của máy chủ vào các hộp cát Docker, đặt `agents.defaults.sandbox.docker.gpus` hoặc override theo từng agent `agents.list[].sandbox.docker.gpus`. Giá trị được truyền tới cờ `--gpus` của Docker dưới dạng một đối số riêng, ví dụ `"all"` hoặc `"device=GPU-uuid"`, và yêu cầu runtime máy chủ tương thích như NVIDIA Container Toolkit.

<Warning>
**Ràng buộc Docker-out-of-Docker (DooD)**

Nếu bạn triển khai chính OpenClaw Gateway dưới dạng container Docker, nó điều phối các container hộp cát ngang hàng bằng socket Docker của máy chủ (DooD). Điều này tạo ra một ràng buộc ánh xạ đường dẫn cụ thể:

- **Cấu hình yêu cầu đường dẫn máy chủ**: Cấu hình `workspace` trong `openclaw.json` PHẢI chứa **đường dẫn tuyệt đối của máy chủ** (ví dụ `/home/user/.openclaw/workspaces`), không phải đường dẫn bên trong container Gateway. Khi OpenClaw yêu cầu daemon Docker tạo hộp cát, daemon đánh giá đường dẫn tương đối với namespace của hệ điều hành máy chủ, không phải namespace của Gateway.
- **Tương đồng FS bridge (ánh xạ volume giống hệt)**: Tiến trình native của OpenClaw Gateway cũng ghi các tệp heartbeat và bridge vào thư mục `workspace`. Vì Gateway đánh giá đúng cùng một chuỗi (đường dẫn máy chủ) từ bên trong môi trường container hóa của chính nó, triển khai Gateway PHẢI bao gồm một ánh xạ volume giống hệt liên kết namespace máy chủ theo cách native (`-v /home/user/.openclaw:/home/user/.openclaw`).

Nếu bạn ánh xạ đường dẫn nội bộ mà không có sự tương đồng tuyệt đối với máy chủ, OpenClaw sẽ ném lỗi quyền `EACCES` theo cách native khi cố ghi heartbeat bên trong môi trường container, vì chuỗi đường dẫn đầy đủ đó không tồn tại theo cách native.
</Warning>

### Backend SSH

Dùng `backend: "ssh"` khi bạn muốn OpenClaw đưa `exec`, công cụ tệp và lượt đọc media vào hộp cát trên một máy bất kỳ có thể truy cập qua SSH.

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
  <Accordion title="How it works">
    - OpenClaw tạo một root từ xa theo phạm vi dưới `sandbox.ssh.workspaceRoot`.
    - Trong lần dùng đầu tiên sau khi tạo hoặc tạo lại, OpenClaw seed workspace từ xa đó từ workspace cục bộ một lần.
    - Sau đó, `exec`, `read`, `write`, `edit`, `apply_patch`, lượt đọc media trong prompt và staging media đi vào chạy trực tiếp trên workspace từ xa qua SSH.
    - OpenClaw không tự động đồng bộ các thay đổi từ xa trở lại workspace cục bộ.

  </Accordion>
  <Accordion title="Authentication material">
    - `identityFile`, `certificateFile`, `knownHostsFile`: dùng các tệp cục bộ hiện có và truyền chúng qua cấu hình OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: dùng chuỗi inline hoặc SecretRefs. OpenClaw phân giải chúng qua snapshot runtime bí mật thông thường, ghi chúng vào tệp tạm với `0600`, rồi xóa chúng khi phiên SSH kết thúc.
    - Nếu cả `*File` và `*Data` được đặt cho cùng một mục, `*Data` thắng cho phiên SSH đó.

  </Accordion>
  <Accordion title="Remote-canonical consequences">
    Đây là mô hình **remote-canonical**. Workspace SSH từ xa trở thành trạng thái hộp cát thực sau lần seed ban đầu.

    - Các chỉnh sửa cục bộ trên máy chủ được thực hiện bên ngoài OpenClaw sau bước seed sẽ không hiển thị từ xa cho đến khi bạn tạo lại hộp cát.
    - `openclaw sandbox recreate` xóa root từ xa theo phạm vi và seed lại từ cục bộ trong lần dùng tiếp theo.
    - Hộp cát trình duyệt không được hỗ trợ trên backend SSH.
    - Các thiết lập `sandbox.docker.*` không áp dụng cho backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Dùng `backend: "openshell"` khi bạn muốn OpenClaw đưa công cụ vào hộp cát trong một môi trường từ xa do OpenShell quản lý. Để xem hướng dẫn thiết lập đầy đủ, tham chiếu cấu hình và so sánh chế độ workspace, xem [trang OpenShell](/vi/gateway/openshell) chuyên dụng.

OpenShell dùng lại cùng lõi truyền tải SSH và bridge hệ thống tệp từ xa như backend SSH chung, đồng thời thêm vòng đời dành riêng cho OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) cùng chế độ workspace `mirror` tùy chọn.

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

- `mirror` (mặc định): workspace cục bộ vẫn là canonical. OpenClaw đồng bộ tệp cục bộ vào OpenShell trước khi exec và đồng bộ workspace từ xa trở lại sau khi exec.
- `remote`: workspace OpenShell là canonical sau khi hộp cát được tạo. OpenClaw seed workspace từ xa một lần từ workspace cục bộ, sau đó công cụ tệp và exec chạy trực tiếp trên hộp cát từ xa mà không đồng bộ thay đổi trở lại.

<AccordionGroup>
  <Accordion title="Remote transport details">
    - OpenClaw yêu cầu OpenShell cung cấp cấu hình SSH dành riêng cho hộp cát qua `openshell sandbox ssh-config <name>`.
    - Core ghi cấu hình SSH đó vào một tệp tạm, mở phiên SSH và dùng lại cùng bridge hệ thống tệp từ xa được dùng bởi `backend: "ssh"`.
    - Chỉ trong chế độ `mirror`, vòng đời mới khác: đồng bộ cục bộ lên từ xa trước exec, rồi đồng bộ trở lại sau exec.

  </Accordion>
  <Accordion title="Current OpenShell limitations">
    - hộp cát trình duyệt chưa được hỗ trợ
    - `sandbox.docker.binds` không được hỗ trợ trên backend OpenShell
    - các núm điều chỉnh runtime dành riêng cho Docker dưới `sandbox.docker.*` vẫn chỉ áp dụng cho backend Docker

  </Accordion>
</AccordionGroup>

#### Chế độ workspace

OpenShell có hai mô hình workspace. Đây là phần quan trọng nhất trong thực tế.

<Tabs>
  <Tab title="mirror (local canonical)">
    Dùng `plugins.entries.openshell.config.mode: "mirror"` khi bạn muốn **workspace cục bộ vẫn là canonical**.

    Hành vi:

    - Trước `exec`, OpenClaw đồng bộ workspace cục bộ vào hộp cát OpenShell.
    - Sau `exec`, OpenClaw đồng bộ workspace từ xa trở lại workspace cục bộ.
    - Công cụ tệp vẫn hoạt động qua bridge hộp cát, nhưng workspace cục bộ vẫn là nguồn sự thật giữa các lượt.

    Dùng chế độ này khi:

    - bạn chỉnh sửa tệp cục bộ bên ngoài OpenClaw và muốn các thay đổi đó tự động xuất hiện trong môi trường cô lập
    - bạn muốn môi trường cô lập OpenShell hoạt động giống backend Docker nhất có thể
    - bạn muốn workspace máy chủ phản ánh các lần ghi của môi trường cô lập sau mỗi lượt exec

    Đánh đổi: tốn thêm chi phí đồng bộ trước và sau exec.

  </Tab>
  <Tab title="remote (OpenShell chính quy)">
    Dùng `plugins.entries.openshell.config.mode: "remote"` khi bạn muốn **workspace OpenShell trở thành nguồn chính quy**.

    Hành vi:

    - Khi môi trường cô lập được tạo lần đầu, OpenClaw seed workspace từ xa từ workspace cục bộ một lần.
    - Sau đó, `exec`, `read`, `write`, `edit`, và `apply_patch` thao tác trực tiếp trên workspace OpenShell từ xa.
    - OpenClaw **không** đồng bộ các thay đổi từ xa trở lại workspace cục bộ sau exec.
    - Các lần đọc media tại thời điểm prompt vẫn hoạt động vì công cụ tệp và media đọc qua cầu nối môi trường cô lập thay vì giả định một đường dẫn máy chủ cục bộ.
    - Transport là SSH vào môi trường cô lập OpenShell do `openshell sandbox ssh-config` trả về.

    Hệ quả quan trọng:

    - Nếu bạn chỉnh sửa tệp trên máy chủ bên ngoài OpenClaw sau bước seed, môi trường cô lập từ xa sẽ **không** tự động thấy các thay đổi đó.
    - Nếu môi trường cô lập được tạo lại, workspace từ xa sẽ được seed lại từ workspace cục bộ.
    - Với `scope: "agent"` hoặc `scope: "shared"`, workspace từ xa đó được chia sẻ ở cùng scope đó.

    Dùng tùy chọn này khi:

    - môi trường cô lập nên chủ yếu nằm ở phía OpenShell từ xa
    - bạn muốn giảm chi phí đồng bộ theo từng lượt
    - bạn không muốn các chỉnh sửa cục bộ trên máy chủ âm thầm ghi đè trạng thái môi trường cô lập từ xa

  </Tab>
</Tabs>

Chọn `mirror` nếu bạn xem môi trường cô lập là môi trường thực thi tạm thời. Chọn `remote` nếu bạn xem môi trường cô lập là workspace thật.

#### Vòng đời OpenShell

Môi trường cô lập OpenShell vẫn được quản lý thông qua vòng đời môi trường cô lập thông thường:

- `openclaw sandbox list` hiển thị runtime OpenShell cũng như runtime Docker
- `openclaw sandbox recreate` xóa runtime hiện tại và cho phép OpenClaw tạo lại ở lần dùng tiếp theo
- logic prune cũng nhận biết backend

Đối với chế độ `remote`, recreate đặc biệt quan trọng:

- recreate xóa workspace từ xa chính quy cho scope đó
- lần dùng tiếp theo seed một workspace từ xa mới từ workspace cục bộ

Đối với chế độ `mirror`, recreate chủ yếu đặt lại môi trường thực thi từ xa vì dù sao workspace cục bộ vẫn là nguồn chính quy.

## Quyền truy cập workspace

`agents.defaults.sandbox.workspaceAccess` kiểm soát **môi trường cô lập có thể thấy gì**:

<Tabs>
  <Tab title="none (mặc định)">
    Công cụ thấy một workspace môi trường cô lập dưới `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Gắn workspace agent ở chế độ chỉ đọc tại `/agent` (tắt `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Gắn workspace agent ở chế độ đọc/ghi tại `/workspace`.
  </Tab>
</Tabs>

Với backend OpenShell:

- chế độ `mirror` vẫn dùng workspace cục bộ làm nguồn chính quy giữa các lượt exec
- chế độ `remote` dùng workspace OpenShell từ xa làm nguồn chính quy sau lần seed ban đầu
- `workspaceAccess: "ro"` và `"none"` vẫn hạn chế hành vi ghi theo cùng cách

Media đi vào được sao chép vào workspace môi trường cô lập đang hoạt động (`media/inbound/*`).

<Note>
**Ghi chú về Skills:** công cụ `read` được neo theo gốc môi trường cô lập. Với `workspaceAccess: "none"`, OpenClaw mirror các skills đủ điều kiện vào workspace môi trường cô lập (`.../skills`) để có thể đọc chúng. Với `"rw"`, skills trong workspace có thể đọc được từ `/workspace/skills`.
</Note>

## Bind mount tùy chỉnh

`agents.defaults.sandbox.docker.binds` gắn thêm các thư mục máy chủ vào container. Định dạng: `host:container:mode` (ví dụ: `"/home/user/source:/source:rw"`).

Bind toàn cục và theo từng agent được **gộp** (không thay thế). Với `scope: "shared"`, bind theo từng agent bị bỏ qua.

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

- Bind bỏ qua hệ thống tệp của môi trường cô lập: chúng phơi bày các đường dẫn máy chủ với bất kỳ chế độ nào bạn đặt (`:ro` hoặc `:rw`).
- OpenClaw chặn các nguồn bind nguy hiểm (ví dụ: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`, và các mount cha có thể phơi bày chúng).
- OpenClaw cũng chặn các gốc thông tin xác thực phổ biến trong thư mục home như `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, và `~/.ssh`.
- Xác thực bind không chỉ là so khớp chuỗi. OpenClaw chuẩn hóa đường dẫn nguồn, sau đó phân giải lại đường dẫn đó thông qua ancestor sâu nhất hiện có trước khi kiểm tra lại các đường dẫn bị chặn và các gốc được phép.
- Điều đó có nghĩa là các lần thoát qua symlink-parent vẫn bị đóng chặn ngay cả khi leaf cuối cùng chưa tồn tại. Ví dụ: `/workspace/run-link/new-file` vẫn phân giải thành `/var/run/...` nếu `run-link` trỏ đến đó.
- Các gốc nguồn được phép được chuẩn hóa chính quy theo cùng cách, nên một đường dẫn chỉ trông như nằm trong allowlist trước khi phân giải symlink vẫn bị từ chối là `outside allowed roots`.
- Các mount nhạy cảm (secrets, khóa SSH, thông tin xác thực dịch vụ) nên là `:ro` trừ khi thật sự bắt buộc.
- Kết hợp với `workspaceAccess: "ro"` nếu bạn chỉ cần quyền đọc đối với workspace; chế độ bind vẫn độc lập.
- Xem [Môi trường cô lập so với Chính sách công cụ so với Nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) để biết bind tương tác với chính sách công cụ và exec nâng quyền như thế nào.

</Warning>

## Image và thiết lập

Image Docker mặc định: `openclaw-sandbox:bookworm-slim`

<Note>
**Source checkout so với npm install**

Các script trợ giúp `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh`, và `scripts/sandbox-browser-setup.sh` chỉ khả dụng khi chạy từ một [source checkout](https://github.com/openclaw/openclaw). Chúng không được bao gồm trong package npm.

Nếu bạn đã cài OpenClaw qua `npm install -g openclaw`, hãy dùng các lệnh `docker build` nội tuyến được hiển thị bên dưới thay vào đó.
</Note>

<Steps>
  <Step title="Build image mặc định">
    Từ một source checkout:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Từ một npm install (không cần source checkout):

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

    Image mặc định **không** bao gồm Node. Nếu một skill cần Node (hoặc các runtime khác), hãy bake một image tùy chỉnh hoặc cài đặt qua `sandbox.docker.setupCommand` (yêu cầu network egress + root có thể ghi + người dùng root).

    OpenClaw không âm thầm thay thế bằng `debian:bookworm-slim` thuần khi thiếu `openclaw-sandbox:bookworm-slim`. Các lần chạy môi trường cô lập nhắm đến image mặc định sẽ fail nhanh với hướng dẫn build cho đến khi bạn build nó, vì image đi kèm mang `python3` cho các helper ghi/chỉnh sửa môi trường cô lập.

  </Step>
  <Step title="Tùy chọn: build image common">
    Đối với image môi trường cô lập nhiều chức năng hơn với công cụ phổ biến (ví dụ `curl`, `jq`, `nodejs`, `python3`, `git`):

    Từ một source checkout:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Từ một npm install, trước tiên build image mặc định (xem ở trên), sau đó build image common bên trên bằng [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) từ repository.

    Sau đó đặt `agents.defaults.sandbox.docker.image` thành `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Tùy chọn: build image trình duyệt môi trường cô lập">
    Từ một source checkout:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Từ một npm install, build bằng [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) từ repository.

  </Step>
</Steps>

Theo mặc định, container môi trường cô lập Docker chạy với **không có mạng**. Ghi đè bằng `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Mặc định Chromium của trình duyệt môi trường cô lập">
    Image trình duyệt môi trường cô lập đi kèm cũng áp dụng các mặc định khởi động Chromium thận trọng cho workload chạy trong container. Các mặc định container hiện tại bao gồm:

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
    - `--renderer-process-limit=2` được điều khiển bởi `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, trong đó `0` giữ mặc định của Chromium.

    Nếu bạn cần một hồ sơ runtime khác, hãy dùng image trình duyệt tùy chỉnh và cung cấp entrypoint riêng. Đối với hồ sơ Chromium cục bộ (không container), dùng `browser.extraArgs` để nối thêm các cờ khởi động.

  </Accordion>
  <Accordion title="Mặc định bảo mật mạng">
    - `network: "host"` bị chặn.
    - `network: "container:<id>"` bị chặn theo mặc định (rủi ro vượt qua bằng join namespace).
    - Ghi đè break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Các bản cài Docker và gateway chạy trong container nằm ở đây: [Docker](/vi/install/docker)

Đối với triển khai gateway Docker, `scripts/docker/setup.sh` có thể bootstrap cấu hình môi trường cô lập. Đặt `OPENCLAW_SANDBOX=1` (hoặc `true`/`yes`/`on`) để bật đường dẫn đó. Bạn có thể ghi đè vị trí socket bằng `OPENCLAW_DOCKER_SOCKET`. Thiết lập đầy đủ và tham chiếu env: [Docker](/vi/install/docker#agent-sandbox).

## setupCommand (thiết lập container một lần)

`setupCommand` chạy **một lần** sau khi container môi trường cô lập được tạo (không phải mỗi lần chạy). Nó thực thi bên trong container qua `sh -lc`.

Đường dẫn:

- Toàn cục: `agents.defaults.sandbox.docker.setupCommand`
- Theo từng agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Các lỗi thường gặp">
    - `docker.network` mặc định là `"none"` (không có lưu lượng đi ra), nên việc cài đặt package sẽ thất bại.
    - `docker.network: "container:<id>"` yêu cầu `dangerouslyAllowContainerNamespaceJoin: true` và chỉ dùng trong trường hợp khẩn cấp.
    - `readOnlyRoot: true` ngăn việc ghi; đặt `readOnlyRoot: false` hoặc đóng gói một image tùy chỉnh.
    - `user` phải là root để cài đặt package (bỏ qua `user` hoặc đặt `user: "0:0"`).
    - Sandbox exec **không** kế thừa `process.env` của host. Dùng `agents.defaults.sandbox.docker.env` (hoặc một image tùy chỉnh) cho các khóa API của skill.

  </Accordion>
</AccordionGroup>

## Chính sách công cụ và lối thoát

Chính sách cho phép/từ chối công cụ vẫn được áp dụng trước các quy tắc sandbox. Nếu một công cụ bị từ chối trên toàn cục hoặc theo từng agent, sandboxing sẽ không khôi phục công cụ đó.

`tools.elevated` là một lối thoát tường minh chạy `exec` bên ngoài sandbox (`gateway` theo mặc định, hoặc `node` khi mục tiêu exec là `node`). Các chỉ thị `/exec` chỉ áp dụng cho người gửi được ủy quyền và tồn tại theo từng phiên; để tắt cứng `exec`, hãy dùng chính sách từ chối công cụ (xem [Sandbox so với Chính sách công cụ so với Elevated](/vi/gateway/sandbox-vs-tool-policy-vs-elevated)).

Gỡ lỗi:

- Dùng `openclaw sandbox explain` để kiểm tra chế độ sandbox hiệu lực, chính sách công cụ và các khóa cấu hình khắc phục.
- Xem [Sandbox so với Chính sách công cụ so với Elevated](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) để hiểu mô hình tư duy "tại sao phần này bị chặn?".

Hãy giữ nó được khóa chặt.

## Ghi đè đa agent

Mỗi agent có thể ghi đè sandbox + công cụ: `agents.list[].sandbox` và `agents.list[].tools` (cộng với `agents.list[].tools.sandbox.tools` cho chính sách công cụ sandbox). Xem [Sandbox & Công cụ đa agent](/vi/tools/multi-agent-sandbox-tools) để biết thứ tự ưu tiên.

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
- [Sandbox so với Chính sách công cụ so với Elevated](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) — gỡ lỗi "tại sao phần này bị chặn?"
- [Bảo mật](/vi/gateway/security)
