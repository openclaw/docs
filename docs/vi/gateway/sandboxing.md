---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Cách hoạt động của cơ chế hộp cát OpenClaw: chế độ, phạm vi, quyền truy cập không gian làm việc và ảnh'
title: Cách ly môi trường thực thi
x-i18n:
    generated_at: "2026-07-19T05:48:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7e2cab130955ee38532838a97ad3c750921dad5e9fe6ed6c533837291e935cd5
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw có thể chạy việc thực thi công cụ bên trong một backend sandbox để giảm phạm vi ảnh hưởng. Tính năng sandbox mặc định bị tắt và được điều khiển bởi `agents.defaults.sandbox` (toàn cục) hoặc `agents.list[].sandbox` (theo từng agent). Tiến trình Gateway luôn duy trì trên máy chủ; chỉ việc thực thi công cụ được chuyển vào sandbox khi tính năng này được bật.

<Note>
Đây không phải là một ranh giới bảo mật hoàn hảo, nhưng nó hạn chế đáng kể quyền truy cập vào hệ thống tệp và tiến trình khi mô hình thực hiện hành động thiếu sáng suốt.
</Note>

## Những gì được chạy trong sandbox

- Thực thi công cụ: `exec`, `read`, `write`, `edit`, `apply_patch`, `process`, v.v.
- Trình duyệt sandbox tùy chọn (`agents.defaults.sandbox.browser`).

Không được chạy trong sandbox:

- Bản thân tiến trình Gateway.
- Mọi công cụ được cho phép rõ ràng chạy bên ngoài sandbox thông qua `tools.elevated`. Thực thi nâng cao bỏ qua sandbox và chạy trên đường dẫn thoát đã cấu hình (mặc định là `gateway`, hoặc `node` khi đích thực thi là `node`). Nếu sandbox bị tắt, `tools.elevated` không thay đổi gì vì việc thực thi đã chạy trên máy chủ. Xem [Chế độ nâng cao](/vi/tools/elevated).

## Chế độ, phạm vi và backend

Ba thiết lập độc lập điều khiển hành vi của sandbox:

| Thiết lập | Khóa                              | Giá trị                      | Mặc định |
| --------- | --------------------------------- | ---------------------------- | -------- |
| Chế độ    | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`    |
| Phạm vi   | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`  |
| Backend   | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker` |

**Chế độ** kiểm soát thời điểm áp dụng sandbox:

- `off`: không sử dụng sandbox.
- `non-main`: chạy mọi phiên trong sandbox, ngoại trừ phiên chính của agent. Khóa phiên chính luôn là `agent:<agentId>:main` (hoặc `global` khi `session.scope` là `"global"`); không thể cấu hình khóa này. Các phiên nhóm/kênh sử dụng khóa riêng nên luôn được xem là phiên không chính và được chạy trong sandbox.
- `all`: mọi phiên đều chạy trong sandbox.

**Phạm vi** kiểm soát số lượng container/môi trường được tạo:

- `agent`: một container cho mỗi agent.
- `session`: một container cho mỗi phiên.
- `shared`: một container dùng chung cho tất cả các phiên chạy trong sandbox (các giá trị ghi đè theo từng agent `docker`/`ssh`/`browser` bị bỏ qua trong phạm vi này).

**Backend** kiểm soát runtime nào thực thi các công cụ trong sandbox. Cấu hình dành riêng cho SSH nằm trong `agents.defaults.sandbox.ssh`; cấu hình dành riêng cho OpenShell nằm trong `plugins.entries.openshell.config`.

|                          | Docker                           | SSH                               | OpenShell                                                    |
| ------------------------ | -------------------------------- | --------------------------------- | ------------------------------------------------------------ |
| **Nơi chạy**             | Container cục bộ                 | Bất kỳ máy chủ nào truy cập được qua SSH | Sandbox do OpenShell quản lý                                 |
| **Thiết lập**            | `scripts/sandbox-setup.sh`       | Khóa SSH + máy chủ đích           | Đã bật plugin OpenShell                                      |
| **Mô hình không gian làm việc** | Gắn kết hoặc sao chép      | Lấy máy chủ từ xa làm chuẩn (khởi tạo một lần) | `mirror` hoặc `remote`                   |
| **Kiểm soát mạng**       | `docker.network` (mặc định: không có) | Phụ thuộc vào máy chủ từ xa | Phụ thuộc vào OpenShell                                      |
| **Sandbox trình duyệt**  | Được hỗ trợ                      | Không được hỗ trợ                 | Chưa được hỗ trợ                                             |
| **Gắn kết thư mục**      | `docker.binds`                   | Không áp dụng                     | Không áp dụng                                                 |
| **Phù hợp nhất cho**     | Phát triển cục bộ, cách ly hoàn toàn | Chuyển tải sang một máy từ xa | Sandbox từ xa được quản lý với khả năng đồng bộ hai chiều tùy chọn |

## Backend Docker

Docker là backend mặc định sau khi sandbox được bật. Nó chạy các công cụ và trình duyệt sandbox cục bộ thông qua socket của daemon Docker (`/var/run/docker.sock`); khả năng cách ly đến từ các namespace của Docker.

Giá trị mặc định: `network: "none"` (không có lưu lượng ra ngoài), `readOnlyRoot: true`, `capDrop: ["ALL"]`, image `openclaw-sandbox:bookworm-slim`.

Để cho phép truy cập GPU của máy chủ, hãy đặt `agents.defaults.sandbox.docker.gpus` (hoặc giá trị ghi đè theo từng agent) thành một giá trị như `"all"` hoặc `"device=GPU-uuid"`. Giá trị này được truyền vào cờ `--gpus` của Docker và yêu cầu một runtime máy chủ tương thích, chẳng hạn như NVIDIA Container Toolkit.

<Warning>
**Các hạn chế của Docker-out-of-Docker (DooD)**

Nếu bạn triển khai chính OpenClaw Gateway dưới dạng container Docker, nó sẽ điều phối các container sandbox ngang hàng bằng socket Docker của máy chủ (DooD). Điều này tạo ra một hạn chế về ánh xạ đường dẫn:

- **Cấu hình yêu cầu đường dẫn máy chủ**: `openclaw.json` `workspace` phải chứa **đường dẫn tuyệt đối của máy chủ** (ví dụ: `/home/user/.openclaw/workspaces`), không phải đường dẫn bên trong container Gateway. Daemon Docker đánh giá đường dẫn tương đối theo namespace của hệ điều hành máy chủ, không phải namespace riêng của Gateway.
- **Yêu cầu ánh xạ volume tương ứng**: Tiến trình Gateway cũng ghi các tệp heartbeat và bridge vào đường dẫn `workspace` đó. Cung cấp cho container Gateway một ánh xạ volume giống hệt (`-v /home/user/.openclaw:/home/user/.openclaw`) để cùng một đường dẫn máy chủ cũng được phân giải chính xác từ bên trong container Gateway. Ánh xạ không khớp sẽ xuất hiện dưới dạng `EACCES` khi Gateway cố ghi heartbeat.
- **Chế độ mã Codex**: khi một sandbox OpenClaw đang hoạt động, OpenClaw sẽ vô hiệu hóa Chế độ mã gốc của app-server Codex, các máy chủ MCP của người dùng và việc thực thi plugin được ứng dụng hỗ trợ cho lượt đó (chúng chạy từ tiến trình app-server trên máy chủ Gateway, không phải backend sandbox OpenClaw), trừ khi chính sách công cụ sandbox cung cấp các công cụ cần thiết và bạn chọn sử dụng đường dẫn exec-server sandbox thử nghiệm. Khi đó, quyền truy cập shell được định tuyến qua các công cụ do sandbox OpenClaw hỗ trợ, chẳng hạn như `sandbox_exec` và `sandbox_process`. Không gắn socket Docker của máy chủ vào các container sandbox của agent hoặc các sandbox Codex tùy chỉnh. Xem [Bộ khung Codex](/vi/plugins/codex-harness) để biết hành vi đầy đủ.

Trên các máy chủ Ubuntu/AppArmor đã bật chế độ sandbox Docker, việc thực thi shell `workspace-write` của app-server Codex cần các namespace người dùng không đặc quyền bên trong container sandbox và có thể thất bại trước khi shell khởi động nếu người dùng dịch vụ không thể tạo chúng. Khi lưu lượng ra của sandbox Docker bị vô hiệu hóa (`network: "none"`, mặc định), việc này cũng cần một namespace mạng không đặc quyền. Các triệu chứng thường gặp: `bwrap: setting up uid map: Permission denied` và `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Chạy `openclaw doctor`; nếu lệnh báo lỗi thăm dò namespace bwrap của Codex, nên dùng một hồ sơ AppArmor cấp các namespace cần thiết cho tiến trình dịch vụ OpenClaw. `kernel.apparmor_restrict_unprivileged_userns=0` là phương án dự phòng áp dụng cho toàn máy chủ nhưng có đánh đổi về bảo mật; chỉ sử dụng khi tư thế bảo mật của máy chủ đó chấp nhận được.
</Warning>

### Trình duyệt sandbox

- Trình duyệt sandbox tự động khởi động (đảm bảo có thể kết nối CDP) khi công cụ trình duyệt cần đến. Cấu hình qua `agents.defaults.sandbox.browser.autoStart` (mặc định `true`) và `autoStartTimeoutMs` (mặc định 12 giây).
- Các container trình duyệt sandbox sử dụng một mạng Docker chuyên dụng (`openclaw-sandbox-browser`) thay vì mạng `bridge` toàn cục. Cấu hình bằng `agents.defaults.sandbox.browser.network`.
- `agents.defaults.sandbox.browser.cdpSourceRange` giới hạn lưu lượng CDP đi vào ở biên container bằng danh sách CIDR cho phép (ví dụ: `172.21.0.1/32`).
- Quyền truy cập quan sát noVNC mặc định được bảo vệ bằng mật khẩu; OpenClaw tạo một URL token ngắn hạn để phục vụ trang khởi tạo cục bộ và mở noVNC với mật khẩu trong fragment của URL (không nằm trong chuỗi truy vấn hoặc nhật ký header).
- `agents.defaults.sandbox.browser.allowHostControl` (mặc định `false`) cho phép các phiên trong sandbox nhắm rõ ràng đến trình duyệt của máy chủ.
- Các danh sách cho phép tùy chọn kiểm soát `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

## Backend SSH

Sử dụng `backend: "ssh"` để chạy `exec`, các công cụ tệp và thao tác đọc nội dung đa phương tiện trong sandbox trên một máy bất kỳ có thể truy cập qua SSH.

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
          // Hoặc sử dụng SecretRefs / nội dung nội tuyến thay cho các tệp cục bộ:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Giá trị mặc định: `command: "ssh"`, `workspaceRoot: "/tmp/openclaw-sandboxes"`, `strictHostKeyChecking: true`, `updateHostKeys: true`.

- **Vòng đời**: OpenClaw tạo một thư mục gốc từ xa theo từng phạm vi bên dưới `sandbox.ssh.workspaceRoot`. Trong lần sử dụng đầu tiên sau khi tạo hoặc tạo lại, nó khởi tạo không gian làm việc từ xa đó từ không gian làm việc cục bộ một lần. Sau đó, `exec`, `read`, `write`, `edit`, `apply_patch`, thao tác đọc nội dung đa phương tiện của prompt và việc đưa nội dung đa phương tiện đến vào vùng tạm sẽ chạy trực tiếp trên không gian làm việc từ xa qua SSH. OpenClaw không tự động đồng bộ các thay đổi từ xa trở lại không gian làm việc cục bộ.
- **Dữ liệu xác thực**: `identityFile`/`certificateFile`/`knownHostsFile` tham chiếu đến các tệp cục bộ hiện có. `identityData`/`certificateData`/`knownHostsData` chấp nhận chuỗi nội tuyến hoặc SecretRefs, được phân giải thông qua ảnh chụp runtime bí mật thông thường, ghi vào các tệp tạm với chế độ `0600` và xóa khi phiên SSH kết thúc. Nếu cả biến thể `*File` và `*Data` được đặt cho cùng một mục, `*Data` sẽ được ưu tiên trong phiên đó.
- **Hệ quả của việc lấy máy chủ từ xa làm chuẩn**: không gian làm việc SSH từ xa trở thành trạng thái sandbox thực tế sau lần khởi tạo ban đầu. Các chỉnh sửa cục bộ trên máy chủ được thực hiện bên ngoài OpenClaw sau bước khởi tạo sẽ không hiển thị từ xa cho đến khi bạn tạo lại sandbox. `openclaw sandbox recreate` xóa thư mục gốc từ xa theo từng phạm vi và khởi tạo lại từ cục bộ trong lần sử dụng tiếp theo. Backend này không hỗ trợ sandbox trình duyệt và các thiết lập `sandbox.docker.*` không áp dụng cho nó.

## Backend OpenShell

Sử dụng `backend: "openshell"` để chạy các công cụ trong sandbox ở môi trường từ xa do OpenShell quản lý. OpenShell tái sử dụng cùng cơ chế truyền tải SSH và cầu nối hệ thống tệp từ xa như backend SSH thông thường, đồng thời bổ sung vòng đời OpenShell (`sandbox create/get/delete/ssh-config`) cùng chế độ đồng bộ không gian làm việc `mirror` tùy chọn.

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
        },
      },
    },
  },
}
```

`mode: "mirror"` (mặc định) giữ không gian làm việc cục bộ làm nguồn chuẩn: OpenClaw đồng bộ dữ liệu cục bộ vào sandbox trước `exec` và đồng bộ trở lại sau đó. `mode: "remote"` khởi tạo không gian làm việc từ xa một lần từ dữ liệu cục bộ, sau đó chạy `exec`/`read`/`write`/`edit`/`apply_patch` trực tiếp trên không gian làm việc từ xa mà không đồng bộ trở lại; các chỉnh sửa cục bộ sau khi khởi tạo sẽ không hiển thị cho đến khi bạn `openclaw sandbox recreate`. Trong `scope: "agent"` hoặc `scope: "shared"`, không gian làm việc từ xa đó được dùng chung trong cùng phạm vi. Các hạn chế hiện tại: trình duyệt sandbox chưa được hỗ trợ và `sandbox.docker.binds` không áp dụng cho backend này.

`openclaw sandbox list`/`recreate`/prune đều xử lý runtime OpenShell giống như runtime Docker; logic dọn dẹp nhận biết backend.

Để xem đầy đủ các điều kiện tiên quyết, tham chiếu cấu hình, so sánh chế độ không gian làm việc và chi tiết vòng đời, hãy xem [OpenShell](/vi/gateway/openshell).

## Quyền truy cập không gian làm việc

`agents.defaults.sandbox.workspaceAccess` kiểm soát những gì sandbox có thể thấy:

| Giá trị            | Hành vi                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `none` (mặc định) | Các công cụ thấy một không gian làm việc sandbox biệt lập trong `~/.openclaw/sandboxes`.                    |
| `ro`             | Gắn không gian làm việc của agent ở chế độ chỉ đọc tại `/agent` (vô hiệu hóa `write`/`edit`/`apply_patch`). |
| `rw`             | Gắn không gian làm việc của agent ở chế độ đọc/ghi tại `/workspace`.                                    |

Với backend OpenShell, chế độ `mirror` vẫn sử dụng không gian làm việc cục bộ làm nguồn chuẩn giữa các lượt thực thi, chế độ `remote` sử dụng không gian làm việc OpenShell từ xa làm nguồn chuẩn sau lần khởi tạo ban đầu, còn `workspaceAccess: "ro"`/`"none"` vẫn hạn chế hành vi ghi theo cùng cách.

Nội dung đa phương tiện gửi đến được sao chép vào không gian làm việc sandbox đang hoạt động (`media/inbound/*`).

<Note>
**Skills**: công cụ `read` lấy gốc tại sandbox. Với `workspaceAccess: "none"`, OpenClaw phản chiếu các skill đủ điều kiện vào không gian làm việc sandbox (`.../skills`) để có thể đọc chúng. Với `"rw"`, có thể đọc các skill của không gian làm việc từ `/workspace/skills`, còn các skill được quản lý, đi kèm hoặc thuộc plugin đủ điều kiện được hiện thực hóa trong đường dẫn chỉ đọc được tạo `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Nhiều thư mục cho một agent

Sử dụng bind mount Docker khi một agent trong sandbox cần nhiều hơn không gian làm việc chính. Mỗi mục ánh xạ một thư mục máy chủ tới một đường dẫn container với chế độ truy cập rõ ràng:

```text
host-directory:container-directory:ro
host-directory:container-directory:rw
```

- `ro` đặt thư mục được gắn thành chỉ đọc bên trong sandbox.
- `rw` cho phép các công cụ và tiến trình trong sandbox thay đổi thư mục máy chủ.
- Đường dẫn container là đường dẫn mà agent sử dụng. Các đường dẫn máy chủ không tự động được hiển thị.

Ví dụ này cấp cho agent `research` một không gian làm việc chính có thể ghi, tài liệu tham khảo chỉ đọc tại `/reference` và một thư mục đầu ra có thể ghi riêng tại `/drafts`:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        scope: "agent",
      },
    },
    list: [
      {
        id: "research",
        workspace: "/srv/openclaw/research-workspace",
        sandbox: {
          workspaceAccess: "rw",
          docker: {
            binds: ["/srv/shared/reference:/reference:ro", "/srv/shared/drafts:/drafts:rw"],
            // Bắt buộc vì các nguồn này nằm ngoài không gian làm việc của agent.
            dangerouslyAllowExternalBindSources: true,
          },
        },
      },
    ],
  },
}
```

`workspaceAccess` và các chế độ bind độc lập với nhau:

| Cài đặt                          | Kiểm soát                                                                    |
| -------------------------------- | --------------------------------------------------------------------------- |
| `workspaceAccess: "none"`        | Sử dụng một không gian làm việc sandbox biệt lập; không hiển thị không gian làm việc của agent.    |
| `workspaceAccess: "ro"`          | Gắn không gian làm việc của agent ở chế độ chỉ đọc tại `/agent`.                           |
| `workspaceAccess: "rw"`          | Gắn không gian làm việc của agent ở chế độ đọc/ghi tại `/workspace`.                      |
| Mục `docker.binds` `:ro`/`:rw` | Chỉ kiểm soát thư mục máy chủ bổ sung đó tại đường dẫn container đã cấu hình. |

Việc thay đổi `workspaceAccess` không thay đổi một bind bổ sung từ `ro` thành `rw`, hoặc ngược lại. Các `docker.binds` toàn cục và theo từng agent được hợp nhất. Giữ `scope: "agent"` hoặc `"session"` cho các bind theo từng agent; `scope: "shared"` bỏ qua mọi thiết lập ghi đè Docker theo từng agent và chỉ sử dụng các bind toàn cục.

Bind mount là ranh giới nhiều thư mục được hỗ trợ vì Docker xây dựng khung nhìn hệ thống tệp của container bằng khả năng cô lập mount, và chế độ `ro`/`rw` áp dụng cho mọi tiến trình trong sandbox. Ranh giới đó bao phủ `exec`, các công cụ hệ thống tệp, tiến trình con và thư viện mà không cần sao chép các bước kiểm tra ủy quyền đường dẫn trên từng đường dẫn mã OpenClaw. Danh sách cho phép đường dẫn phía máy chủ không thể cung cấp cùng một ranh giới đầy đủ khi một shell hoặc phần phụ thuộc được cho phép có thể truy cập trực tiếp vào tệp.

Tùy chọn chủ động `dangerouslyAllowExternalBindSources` chỉ cho phép các nguồn nằm ngoài các gốc không gian làm việc. Tùy chọn này không vô hiệu hóa các bước kiểm tra của OpenClaw đối với hệ thống bị chặn, thông tin xác thực, socket Docker, thư mục cha là liên kết tượng trưng hoặc đích dành riêng. Ưu tiên thư mục nhỏ nhất, sử dụng `ro` trừ khi bắt buộc phải ghi và tạo lại sandbox sau khi thay đổi các mount:

```bash
openclaw sandbox recreate --agent research
```

### Hành vi bind khác

`agents.defaults.sandbox.docker.binds` cấu hình các mount toàn cục. Định dạng là cùng dạng `host:container:mode` (ví dụ: `"/home/user/source:/source:rw"`).

`agents.defaults.sandbox.browser.binds` chỉ gắn các thư mục máy chủ bổ sung vào container **trình duyệt sandbox**. Khi được đặt (bao gồm `[]`), tùy chọn này thay thế `docker.binds` cho container trình duyệt; khi bị bỏ qua, container trình duyệt quay về sử dụng `docker.binds`.

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

- Bind bỏ qua hệ thống tệp sandbox: chúng hiển thị các đường dẫn máy chủ với bất kỳ chế độ nào bạn đặt (`:ro` hoặc `:rw`).
- Theo mặc định, OpenClaw chặn các nguồn bind nguy hiểm: đường dẫn hệ thống (`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`), thư mục socket Docker (`/run`, `/var/run` và các biến thể `docker.sock` của chúng) và các gốc thông tin xác thực phổ biến trong thư mục chính (`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`).
- Quá trình xác thực chuẩn hóa đường dẫn nguồn, sau đó phân giải lại thông qua tổ tiên sâu nhất hiện có trước khi kiểm tra lại các đường dẫn bị chặn và các gốc được phép; vì vậy, các trường hợp thoát qua thư mục cha là liên kết tượng trưng sẽ bị từ chối theo hướng an toàn ngay cả khi nút lá cuối cùng chưa tồn tại (ví dụ: `/workspace/run-link/new-file` vẫn được phân giải thành `/var/run/...` nếu `run-link` trỏ đến đó).
- Các đích bind che khuất những điểm gắn container dành riêng (`/workspace`, `/agent`) cũng bị chặn theo mặc định; ghi đè bằng `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true`.
- Các nguồn bind nằm ngoài những gốc trong danh sách cho phép của không gian làm việc/không gian làm việc agent bị chặn theo mặc định; ghi đè bằng `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true`. Các gốc được phép được chuẩn hóa theo cùng cách, vì vậy một đường dẫn chỉ có vẻ nằm trong danh sách cho phép trước khi phân giải liên kết tượng trưng vẫn bị từ chối vì nằm ngoài các gốc được phép.
- Các mount nhạy cảm (bí mật, khóa SSH, thông tin xác thực dịch vụ) nên là `:ro` trừ khi thực sự bắt buộc.
- Kết hợp với `workspaceAccess: "ro"` nếu bạn chỉ cần quyền đọc không gian làm việc; các chế độ bind vẫn độc lập.
- Xem [Sandbox so với chính sách công cụ so với quyền nâng cao](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) để biết cách bind tương tác với chính sách công cụ và thao tác thực thi nâng cao.

</Warning>

## Image và thiết lập

Image Docker mặc định: `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout mã nguồn so với cài đặt npm**

Các script trợ giúp `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` và `scripts/sandbox-browser-setup.sh` chỉ khả dụng khi chạy từ một [checkout mã nguồn](https://github.com/openclaw/openclaw). Chúng không có trong gói npm.

Nếu bạn đã cài đặt OpenClaw qua `npm install -g openclaw`, hãy sử dụng các lệnh `docker build` nội tuyến được hiển thị bên dưới.
</Note>

<Steps>
  <Step title="Xây dựng image mặc định">
    Từ một checkout mã nguồn:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Từ bản cài đặt npm (không cần checkout mã nguồn):

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

    Image mặc định **không** bao gồm Node. Nếu một skill cần Node (hoặc các runtime khác), hãy tích hợp sẵn vào một image tùy chỉnh hoặc cài đặt qua `sandbox.docker.setupCommand` (yêu cầu truy cập mạng ra ngoài + thư mục gốc có thể ghi + người dùng root).

    OpenClaw không âm thầm thay thế bằng `debian:bookworm-slim` thuần túy khi thiếu `openclaw-sandbox:bookworm-slim`. Các lượt chạy sandbox nhắm đến image mặc định sẽ dừng ngay với hướng dẫn xây dựng cho đến khi bạn xây dựng image đó, vì image đi kèm chứa `python3` dành cho các trình trợ giúp ghi/chỉnh sửa sandbox.

  </Step>
  <Step title="Tùy chọn: xây dựng image thông dụng">
    Để có một image sandbox nhiều chức năng hơn với các công cụ thông dụng (ví dụ: `curl`, `jq`, Node 24, pnpm, `python3` và `git`):

    Từ một checkout mã nguồn:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Từ bản cài đặt npm, trước tiên hãy xây dựng image mặc định (xem phía trên), sau đó xây dựng image thông dụng dựa trên image đó bằng [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) từ kho lưu trữ.

    Sau đó đặt `agents.defaults.sandbox.docker.image` thành `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Tùy chọn: xây dựng image trình duyệt sandbox">
    Từ một checkout mã nguồn:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Từ bản cài đặt npm, hãy xây dựng bằng [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) từ kho lưu trữ.

  </Step>
</Steps>

Theo mặc định, các container sandbox Docker chạy **không có mạng**. Ghi đè bằng `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Giá trị mặc định của Chromium trong trình duyệt sandbox">
    Image trình duyệt sandbox đi kèm áp dụng các cờ khởi động Chromium thận trọng cho khối lượng công việc chạy trong container:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--password-store=basic`
    - `--use-mock-keychain`
    - `--headless=new` khi `browser.headless` được bật.
    - `--no-sandbox --disable-setuid-sandbox` khi `browser.noSandbox` được bật.
    - `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer` theo mặc định; các cờ tăng cường bảo mật đồ họa này hỗ trợ những container không có khả năng hỗ trợ GPU. Đặt `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` nếu khối lượng công việc cần WebGL hoặc các tính năng 3D khác.
    - `--disable-extensions` theo mặc định; đặt `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` cho các luồng phụ thuộc vào tiện ích mở rộng.
    - `--renderer-process-limit=2` theo mặc định; được kiểm soát bởi `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, trong đó `0` giữ nguyên giá trị mặc định của Chromium.

    Nếu cần một hồ sơ runtime khác, hãy dùng image trình duyệt tùy chỉnh và cung cấp entrypoint riêng. Đối với các hồ sơ Chromium cục bộ (không phải container), hãy dùng `browser.extraArgs` để nối thêm các cờ khởi động.

  </Accordion>
  <Accordion title="Mặc định bảo mật mạng">
    - `network: "host"` bị chặn.
    - `network: "container:<id>"` bị chặn theo mặc định (nguy cơ vượt qua bằng cách tham gia namespace).
    - Ghi đè khẩn cấp: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Các bản cài đặt Docker và gateway được container hóa nằm tại đây: [Docker](/vi/install/docker)

Đối với các triển khai gateway Docker, `scripts/docker/setup.sh` có thể khởi tạo cấu hình sandbox. Đặt `OPENCLAW_SANDBOX=1` (hoặc `true`/`yes`/`on`) để bật đường dẫn đó. Ghi đè vị trí socket bằng `OPENCLAW_DOCKER_SOCKET`. Tài liệu thiết lập đầy đủ và tham chiếu biến môi trường: [Docker](/vi/install/docker#agent-sandbox).

## setupCommand (thiết lập container một lần)

`setupCommand` chạy **một lần** sau khi container sandbox được tạo (không chạy trong mỗi lượt). Lệnh này thực thi bên trong container thông qua `sh -lc`.

Đường dẫn:

- Toàn cục: `agents.defaults.sandbox.docker.setupCommand`
- Theo agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Các lỗi thường gặp">
    - `docker.network` mặc định là `"none"` (không có lưu lượng ra ngoài), vì vậy việc cài đặt gói sẽ thất bại.
    - `docker.network: "container:<id>"` yêu cầu `dangerouslyAllowContainerNamespaceJoin: true` và chỉ dành cho trường hợp khẩn cấp.
    - `readOnlyRoot: true` ngăn thao tác ghi; hãy đặt `readOnlyRoot: false` hoặc tạo sẵn một image tùy chỉnh.
    - `user` phải là root để cài đặt gói (bỏ `user` hoặc đặt `user: "0:0"`).
    - Thao tác thực thi trong sandbox **không** kế thừa `process.env` của máy chủ. Hãy dùng `agents.defaults.sandbox.docker.env` (hoặc image tùy chỉnh) cho các khóa API của skill.
    - Các giá trị trong `agents.defaults.sandbox.docker.env` được truyền dưới dạng biến môi trường tường minh của container Docker. Bất kỳ ai có quyền truy cập daemon Docker đều có thể kiểm tra chúng bằng các lệnh siêu dữ liệu Docker như `docker inspect`. Hãy dùng image tùy chỉnh, tệp bí mật được gắn kết hoặc một phương thức phân phối bí mật khác nếu việc lộ siêu dữ liệu đó không thể chấp nhận được.

  </Accordion>
</AccordionGroup>

## Chính sách công cụ và cơ chế thoát

Các chính sách cho phép/từ chối công cụ vẫn được áp dụng trước các quy tắc sandbox. Nếu một công cụ bị từ chối trên toàn cục hoặc theo agent, sandbox không thể khôi phục công cụ đó.

`tools.elevated` là một cơ chế thoát tường minh, chạy `exec` bên ngoài sandbox (`gateway` theo mặc định, hoặc `node` khi đích thực thi là `node`). Các chỉ thị `/exec` chỉ áp dụng cho người gửi được ủy quyền và được duy trì theo từng phiên; để vô hiệu hóa hoàn toàn `exec`, hãy dùng chính sách công cụ để từ chối (xem [Sandbox, chính sách công cụ và chế độ nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated)).

Gỡ lỗi:

- `openclaw sandbox list` hiển thị các container sandbox, trạng thái, mức độ khớp image, tuổi, thời gian nhàn rỗi và phiên/agent liên kết.
- `openclaw sandbox explain [--session <key>] [--agent <id>]` kiểm tra chế độ sandbox có hiệu lực, workspace máy chủ, thư mục làm việc runtime, các điểm gắn kết Docker, chính sách công cụ và các khóa cấu hình cần sửa. Trường `workspaceRoot` vẫn là thư mục gốc sandbox đã cấu hình; `effectiveHostWorkspaceRoot` cho biết workspace đang hoạt động thực sự nằm ở đâu.
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` xóa các container/môi trường để chúng được tạo lại với cấu hình hiện tại trong lần sử dụng tiếp theo.
- Xem [Sandbox, chính sách công cụ và chế độ nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) để hiểu mô hình tư duy về câu hỏi "tại sao nội dung này bị chặn?".

## Ghi đè đa agent

Mỗi agent có thể ghi đè sandbox và công cụ: `agents.list[].sandbox` và `agents.list[].tools` (cộng thêm `agents.list[].tools.sandbox.tools` cho chính sách công cụ sandbox). Xem [Sandbox và công cụ đa agent](/vi/tools/multi-agent-sandbox-tools) để biết thứ tự ưu tiên.

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

- [Sandbox và công cụ đa agent](/vi/tools/multi-agent-sandbox-tools) -- các ghi đè theo agent và thứ tự ưu tiên
- [OpenShell](/vi/gateway/openshell) -- thiết lập backend sandbox được quản lý, các chế độ workspace và tham chiếu cấu hình
- [Cấu hình sandbox](/vi/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox, chính sách công cụ và chế độ nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) -- gỡ lỗi "tại sao nội dung này bị chặn?"
- [Bảo mật](/vi/gateway/security)
