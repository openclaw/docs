---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Cách hoạt động của cơ chế sandbox trong OpenClaw: chế độ, phạm vi, quyền truy cập không gian làm việc và image'
title: Cô lập môi trường
x-i18n:
    generated_at: "2026-07-12T07:57:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60d6695c5d8f4e8d3bfb80dd387a50c104dc4e140d5974a66d5a2176594782a4
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw có thể chạy việc thực thi công cụ bên trong một backend hộp cát để giảm phạm vi ảnh hưởng. Hộp cát mặc định bị tắt và được điều khiển bởi `agents.defaults.sandbox` (toàn cục) hoặc `agents.list[].sandbox` (theo từng tác nhân). Tiến trình Gateway luôn ở trên máy chủ; chỉ việc thực thi công cụ được chuyển vào hộp cát khi tính năng này được bật.

<Note>
Đây không phải là một ranh giới bảo mật hoàn hảo, nhưng nó hạn chế đáng kể quyền truy cập vào hệ thống tệp và tiến trình khi mô hình thực hiện hành động không phù hợp.
</Note>

## Những gì được chạy trong hộp cát

- Thực thi công cụ: `exec`, `read`, `write`, `edit`, `apply_patch`, `process`, v.v.
- Trình duyệt hộp cát tùy chọn (`agents.defaults.sandbox.browser`).

Không được chạy trong hộp cát:

- Bản thân tiến trình Gateway.
- Mọi công cụ được cho phép rõ ràng chạy bên ngoài hộp cát thông qua `tools.elevated`. Lệnh exec đặc quyền bỏ qua hộp cát và chạy trên đường thoát đã cấu hình (mặc định là `gateway`, hoặc `node` khi đích exec là `node`). Nếu hộp cát bị tắt, `tools.elevated` không thay đổi gì vì exec vốn đã chạy trên máy chủ. Xem [Chế độ đặc quyền](/vi/tools/elevated).

## Chế độ, phạm vi và backend

Ba thiết lập độc lập kiểm soát hành vi của hộp cát:

| Thiết lập | Khóa                              | Giá trị                      | Mặc định |
| --------- | --------------------------------- | ---------------------------- | -------- |
| Chế độ    | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`    |
| Phạm vi   | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`  |
| Backend   | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker` |

**Chế độ** kiểm soát thời điểm áp dụng hộp cát:

- `off`: không dùng hộp cát.
- `non-main`: chạy mọi phiên trong hộp cát, ngoại trừ phiên chính của tác nhân. Khóa phiên chính luôn là `agent:<agentId>:main` (hoặc `global` khi `session.scope` là `"global"`); không thể cấu hình khóa này. Các phiên nhóm/kênh sử dụng khóa riêng, vì vậy chúng luôn được coi là không chính và được chạy trong hộp cát.
- `all`: mọi phiên đều chạy trong hộp cát.

**Phạm vi** kiểm soát số lượng vùng chứa/môi trường được tạo:

- `agent`: một vùng chứa cho mỗi tác nhân.
- `session`: một vùng chứa cho mỗi phiên.
- `shared`: một vùng chứa dùng chung cho tất cả các phiên chạy trong hộp cát (các giá trị ghi đè `docker`/`ssh`/`browser` theo từng tác nhân bị bỏ qua trong phạm vi này).

**Backend** kiểm soát môi trường thực thi nào chạy các công cụ trong hộp cát. Cấu hình dành riêng cho SSH nằm trong `agents.defaults.sandbox.ssh`; cấu hình dành riêng cho OpenShell nằm trong `plugins.entries.openshell.config`.

|                           | Docker                                  | SSH                                      | OpenShell                                                   |
| ------------------------- | --------------------------------------- | ---------------------------------------- | ----------------------------------------------------------- |
| **Nơi chạy**              | Vùng chứa cục bộ                        | Bất kỳ máy chủ nào có thể truy cập qua SSH | Hộp cát do OpenShell quản lý                                |
| **Thiết lập**             | `scripts/sandbox-setup.sh`              | Khóa SSH + máy chủ đích                  | Đã bật plugin OpenShell                                     |
| **Mô hình không gian làm việc** | Gắn kết liên kết hoặc sao chép      | Lấy máy từ xa làm chuẩn (khởi tạo một lần) | `mirror` hoặc `remote`                                    |
| **Kiểm soát mạng**        | `docker.network` (mặc định: không có)   | Phụ thuộc vào máy chủ từ xa              | Phụ thuộc vào OpenShell                                     |
| **Hộp cát trình duyệt**   | Được hỗ trợ                             | Không được hỗ trợ                        | Chưa được hỗ trợ                                            |
| **Gắn kết liên kết**      | `docker.binds`                          | Không áp dụng                            | Không áp dụng                                               |
| **Phù hợp nhất cho**      | Phát triển cục bộ, cách ly hoàn toàn    | Chuyển tải sang một máy từ xa            | Hộp cát từ xa được quản lý với đồng bộ hai chiều tùy chọn   |

## Backend Docker

Docker là backend mặc định sau khi bật hộp cát. Backend này chạy các công cụ và trình duyệt hộp cát cục bộ thông qua socket trình nền Docker (`/var/run/docker.sock`); khả năng cách ly đến từ các không gian tên Docker.

Giá trị mặc định: `network: "none"` (không có lưu lượng đi ra), `readOnlyRoot: true`, `capDrop: ["ALL"]`, image `openclaw-sandbox:bookworm-slim`.

Để cung cấp GPU của máy chủ, hãy đặt `agents.defaults.sandbox.docker.gpus` (hoặc giá trị ghi đè theo từng tác nhân) thành một giá trị như `"all"` hoặc `"device=GPU-uuid"`. Giá trị này được truyền cho cờ `--gpus` của Docker và yêu cầu một môi trường thực thi máy chủ tương thích, chẳng hạn như NVIDIA Container Toolkit.

<Warning>
**Các ràng buộc Docker-bên-ngoài-Docker (DooD)**

Nếu bạn triển khai chính OpenClaw Gateway dưới dạng vùng chứa Docker, nó sẽ điều phối các vùng chứa hộp cát ngang hàng bằng socket Docker của máy chủ (DooD). Điều này tạo ra một ràng buộc về ánh xạ đường dẫn:

- **Cấu hình yêu cầu đường dẫn máy chủ**: `workspace` trong `openclaw.json` phải chứa **đường dẫn tuyệt đối của máy chủ** (ví dụ: `/home/user/.openclaw/workspaces`), không phải đường dẫn nội bộ của vùng chứa Gateway. Trình nền Docker đánh giá các đường dẫn theo không gian tên của hệ điều hành máy chủ, không phải không gian tên riêng của Gateway.
- **Yêu cầu ánh xạ ổ đĩa khớp nhau**: Tiến trình Gateway cũng ghi các tệp Heartbeat và cầu nối vào đường dẫn `workspace` đó. Hãy cung cấp cho vùng chứa Gateway một ánh xạ ổ đĩa giống hệt (`-v /home/user/.openclaw:/home/user/.openclaw`) để cùng một đường dẫn máy chủ cũng được phân giải chính xác từ bên trong vùng chứa Gateway. Ánh xạ không khớp sẽ biểu hiện dưới dạng lỗi `EACCES` khi Gateway cố ghi Heartbeat.
- **Chế độ mã Codex**: khi hộp cát OpenClaw đang hoạt động, OpenClaw vô hiệu hóa Code Mode gốc của máy chủ ứng dụng Codex, các máy chủ MCP của người dùng và việc thực thi plugin dựa trên ứng dụng cho lượt đó (chúng chạy từ tiến trình máy chủ ứng dụng trên máy chủ Gateway, không phải backend hộp cát OpenClaw), trừ khi chính sách công cụ của hộp cát cung cấp các công cụ cần thiết và bạn chọn sử dụng đường dẫn máy chủ exec hộp cát thử nghiệm. Khi đó, quyền truy cập shell được định tuyến qua các công cụ dựa trên hộp cát OpenClaw như `sandbox_exec` và `sandbox_process`. Không gắn socket Docker của máy chủ vào các vùng chứa hộp cát của tác nhân hoặc hộp cát Codex tùy chỉnh. Xem [Bộ khung Codex](/vi/plugins/codex-harness) để biết đầy đủ hành vi.

Trên các máy chủ Ubuntu/AppArmor đã bật chế độ hộp cát Docker, việc thực thi shell `workspace-write` của máy chủ ứng dụng Codex cần các không gian tên người dùng không đặc quyền bên trong vùng chứa hộp cát và có thể thất bại trước khi shell khởi động nếu người dùng dịch vụ không thể tạo chúng. Khi lưu lượng đi ra của hộp cát Docker bị vô hiệu hóa (`network: "none"`, giá trị mặc định), việc này cũng cần một không gian tên mạng không đặc quyền. Các triệu chứng phổ biến: `bwrap: setting up uid map: Permission denied` và `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Chạy `openclaw doctor`; nếu lệnh báo lỗi thăm dò không gian tên bwrap của Codex, hãy ưu tiên một hồ sơ AppArmor cấp các không gian tên cần thiết cho tiến trình dịch vụ OpenClaw. `kernel.apparmor_restrict_unprivileged_userns=0` là phương án dự phòng áp dụng trên toàn máy chủ với những đánh đổi về bảo mật; chỉ sử dụng khi tư thế bảo mật của máy chủ đó chấp nhận được.
</Warning>

### Trình duyệt hộp cát

- Trình duyệt hộp cát tự động khởi động (đảm bảo có thể truy cập CDP) khi công cụ trình duyệt cần đến. Cấu hình thông qua `agents.defaults.sandbox.browser.autoStart` (mặc định là `true`) và `autoStartTimeoutMs` (mặc định là 12 giây).
- Các vùng chứa trình duyệt hộp cát sử dụng một mạng Docker chuyên dụng (`openclaw-sandbox-browser`) thay cho mạng `bridge` toàn cục. Cấu hình bằng `agents.defaults.sandbox.browser.network`.
- `agents.defaults.sandbox.browser.cdpSourceRange` giới hạn lưu lượng CDP đi vào ở biên vùng chứa bằng danh sách CIDR cho phép (ví dụ: `172.21.0.1/32`).
- Quyền truy cập quan sát noVNC được bảo vệ bằng mật khẩu theo mặc định; OpenClaw phát hành một URL mã thông báo tồn tại trong thời gian ngắn, phục vụ một trang khởi động cục bộ và mở noVNC với mật khẩu trong phần phân mảnh URL (không nằm trong chuỗi truy vấn hoặc nhật ký tiêu đề).
- `agents.defaults.sandbox.browser.allowHostControl` (mặc định là `false`) cho phép các phiên trong hộp cát nhắm rõ ràng đến trình duyệt của máy chủ.
- Các danh sách cho phép tùy chọn kiểm soát `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

## Backend SSH

Sử dụng `backend: "ssh"` để chạy `exec`, các công cụ tệp và thao tác đọc phương tiện trong hộp cát trên một máy bất kỳ có thể truy cập qua SSH.

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
          // Hoặc sử dụng SecretRefs / nội dung nội tuyến thay cho tệp cục bộ:
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

- **Vòng đời**: OpenClaw tạo một thư mục gốc từ xa theo từng phạm vi trong `sandbox.ssh.workspaceRoot`. Trong lần sử dụng đầu tiên sau khi tạo hoặc tạo lại, nó khởi tạo không gian làm việc từ xa đó một lần từ không gian làm việc cục bộ. Sau đó, `exec`, `read`, `write`, `edit`, `apply_patch`, thao tác đọc phương tiện trong lời nhắc và khâu chuẩn bị phương tiện đến sẽ chạy trực tiếp trên không gian làm việc từ xa qua SSH. OpenClaw không tự động đồng bộ các thay đổi từ xa trở lại không gian làm việc cục bộ.
- **Dữ liệu xác thực**: `identityFile`/`certificateFile`/`knownHostsFile` tham chiếu đến các tệp cục bộ hiện có. `identityData`/`certificateData`/`knownHostsData` chấp nhận chuỗi nội tuyến hoặc SecretRefs, được phân giải thông qua ảnh chụp nhanh môi trường thực thi bí mật thông thường, ghi vào các tệp tạm thời với chế độ `0600` và xóa khi phiên SSH kết thúc. Nếu cả biến thể `*File` và `*Data` đều được đặt cho cùng một mục, `*Data` được ưu tiên trong phiên đó.
- **Hệ quả của việc lấy máy từ xa làm chuẩn**: không gian làm việc SSH từ xa trở thành trạng thái hộp cát thực tế sau lần khởi tạo ban đầu. Các chỉnh sửa cục bộ trên máy chủ được thực hiện bên ngoài OpenClaw sau bước khởi tạo sẽ không hiển thị từ xa cho đến khi bạn tạo lại hộp cát. `openclaw sandbox recreate` xóa thư mục gốc từ xa theo từng phạm vi và khởi tạo lại từ cục bộ trong lần sử dụng tiếp theo. Backend này không hỗ trợ hộp cát trình duyệt và các thiết lập `sandbox.docker.*` không áp dụng cho nó.

## Backend OpenShell

Sử dụng `backend: "openshell"` để chạy các công cụ trong hộp cát thuộc môi trường từ xa do OpenShell quản lý. OpenShell tái sử dụng cùng cơ chế truyền tải SSH và cầu nối hệ thống tệp từ xa như backend SSH chung, đồng thời bổ sung vòng đời OpenShell (`sandbox create/get/delete/ssh-config`) cùng chế độ đồng bộ không gian làm việc `mirror` tùy chọn.

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

`mode: "mirror"` (mặc định) giữ không gian làm việc cục bộ làm chuẩn: OpenClaw đồng bộ dữ liệu cục bộ vào hộp cát trước `exec` và đồng bộ trở lại sau đó. `mode: "remote"` khởi tạo không gian làm việc từ xa một lần từ cục bộ, sau đó chạy `exec`/`read`/`write`/`edit`/`apply_patch` trực tiếp trên không gian làm việc từ xa mà không đồng bộ trở lại; các chỉnh sửa cục bộ sau lần khởi tạo sẽ không hiển thị cho đến khi bạn chạy `openclaw sandbox recreate`. Với `scope: "agent"` hoặc `scope: "shared"`, không gian làm việc từ xa đó được dùng chung trong cùng phạm vi. Các hạn chế hiện tại: hộp cát trình duyệt chưa được hỗ trợ và `sandbox.docker.binds` không áp dụng cho backend này.

`openclaw sandbox list`/`recreate`/prune đều xử lý các môi trường thực thi OpenShell giống như môi trường thực thi Docker; logic dọn dẹp nhận biết backend.

Để biết đầy đủ các điều kiện tiên quyết, tài liệu tham chiếu cấu hình, nội dung so sánh các chế độ không gian làm việc và chi tiết vòng đời, hãy xem [OpenShell](/vi/gateway/openshell).

## Quyền truy cập không gian làm việc

`agents.defaults.sandbox.workspaceAccess` kiểm soát những gì hộp cát có thể thấy:

| Giá trị          | Hành vi                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| `none` (mặc định) | Các công cụ thấy một không gian làm việc sandbox cô lập trong `~/.openclaw/sandboxes`.                    |
| `ro`             | Gắn không gian làm việc của tác tử ở chế độ chỉ đọc tại `/agent` (vô hiệu hóa `write`/`edit`/`apply_patch`). |
| `rw`             | Gắn không gian làm việc của tác tử ở chế độ đọc/ghi tại `/workspace`.                                     |

Với phần phụ trợ OpenShell, chế độ `mirror` vẫn sử dụng không gian làm việc cục bộ làm nguồn chuẩn giữa các lượt thực thi, chế độ `remote` sử dụng không gian làm việc OpenShell từ xa làm nguồn chuẩn sau lần khởi tạo dữ liệu ban đầu, còn `workspaceAccess: "ro"`/`"none"` vẫn hạn chế hành vi ghi theo cùng cách.

Phương tiện đầu vào được sao chép vào không gian làm việc sandbox đang hoạt động (`media/inbound/*`).

<Note>
**Skills**: công cụ `read` được giới hạn tại thư mục gốc của sandbox. Với `workspaceAccess: "none"`, OpenClaw sao chép các skill đủ điều kiện vào không gian làm việc sandbox (`.../skills`) để có thể đọc chúng. Với `"rw"`, có thể đọc các skill trong không gian làm việc từ `/workspace/skills`, còn các skill được quản lý, đóng gói kèm hoặc thuộc plugin đủ điều kiện sẽ được hiện thực hóa trong đường dẫn chỉ đọc được tạo ra `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Gắn kết tùy chỉnh

`agents.defaults.sandbox.docker.binds` gắn thêm các thư mục máy chủ vào container. Định dạng: `host:container:mode` (ví dụ: `"/home/user/source:/source:rw"`).

Các gắn kết toàn cục và theo từng tác tử được hợp nhất (không thay thế nhau). Với `scope: "shared"`, các gắn kết theo từng tác tử bị bỏ qua.

`agents.defaults.sandbox.browser.binds` chỉ gắn thêm các thư mục máy chủ vào container **trình duyệt sandbox**. Khi được đặt (kể cả `[]`), giá trị này thay thế `docker.binds` cho container trình duyệt; khi bị lược bỏ, container trình duyệt dùng `docker.binds` làm phương án dự phòng.

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
**Bảo mật gắn kết**

- Các gắn kết bỏ qua hệ thống tệp sandbox: chúng để lộ các đường dẫn máy chủ theo chế độ bạn đặt (`:ro` hoặc `:rw`).
- Theo mặc định, OpenClaw chặn các nguồn gắn kết nguy hiểm: đường dẫn hệ thống (`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`), thư mục socket Docker (`/run`, `/var/run` và các biến thể `docker.sock` của chúng), cùng các thư mục gốc thông tin xác thực phổ biến trong thư mục chính (`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`).
- Quá trình xác thực chuẩn hóa đường dẫn nguồn, sau đó phân giải lại đường dẫn thông qua tổ tiên tồn tại sâu nhất trước khi kiểm tra lại các đường dẫn bị chặn và thư mục gốc được phép. Vì vậy, các trường hợp thoát qua thư mục cha là liên kết tượng trưng sẽ bị từ chối an toàn ngay cả khi phần tử cuối chưa tồn tại (ví dụ: `/workspace/run-link/new-file` vẫn được phân giải thành `/var/run/...` nếu `run-link` trỏ tới đó).
- Theo mặc định, các đích gắn kết che khuất những điểm gắn kết dành riêng của container (`/workspace`, `/agent`) cũng bị chặn; ghi đè bằng `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true`.
- Theo mặc định, các nguồn gắn kết nằm ngoài những thư mục gốc trong danh sách cho phép của không gian làm việc/không gian làm việc tác tử sẽ bị chặn; ghi đè bằng `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true`. Các thư mục gốc được phép cũng được chuẩn hóa theo cùng cách, nên một đường dẫn chỉ có vẻ nằm trong danh sách cho phép trước khi phân giải liên kết tượng trưng vẫn bị từ chối vì nằm ngoài các thư mục gốc được phép.
- Các điểm gắn kết nhạy cảm (bí mật, khóa SSH, thông tin xác thực dịch vụ) nên dùng `:ro`, trừ khi thực sự bắt buộc phải ghi.
- Kết hợp với `workspaceAccess: "ro"` nếu bạn chỉ cần quyền đọc không gian làm việc; các chế độ gắn kết vẫn độc lập.
- Xem [Sandbox so với chính sách công cụ so với quyền nâng cao](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) để biết cách các gắn kết tương tác với chính sách công cụ và thực thi nâng cao.

</Warning>

## Ảnh và thiết lập

Ảnh Docker mặc định: `openclaw-sandbox:bookworm-slim`

<Note>
**Bản sao mã nguồn so với cài đặt npm**

Các tập lệnh trợ giúp `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` và `scripts/sandbox-browser-setup.sh` chỉ khả dụng khi chạy từ một [bản sao mã nguồn](https://github.com/openclaw/openclaw). Chúng không được bao gồm trong gói npm.

Nếu bạn đã cài đặt OpenClaw bằng `npm install -g openclaw`, hãy dùng các lệnh `docker build` nội tuyến được trình bày bên dưới.
</Note>

<Steps>
  <Step title="Xây dựng ảnh mặc định">
    Từ một bản sao mã nguồn:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Từ bản cài đặt npm (không cần bản sao mã nguồn):

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

    Ảnh mặc định **không** bao gồm Node. Nếu một skill cần Node (hoặc môi trường chạy khác), hãy tích hợp vào một ảnh tùy chỉnh hoặc cài đặt qua `sandbox.docker.setupCommand` (yêu cầu kết nối mạng ra ngoài + thư mục gốc có thể ghi + người dùng root).

    OpenClaw không âm thầm thay thế bằng `debian:bookworm-slim` thuần khi thiếu `openclaw-sandbox:bookworm-slim`. Các lượt chạy sandbox nhắm tới ảnh mặc định sẽ dừng sớm kèm hướng dẫn xây dựng cho đến khi bạn xây dựng ảnh đó, vì ảnh đóng gói kèm chứa `python3` dành cho các trình trợ giúp ghi/chỉnh sửa trong sandbox.

  </Step>
  <Step title="Tùy chọn: xây dựng ảnh phổ dụng">
    Để có một ảnh sandbox nhiều chức năng hơn với các công cụ phổ biến (ví dụ: `curl`, `jq`, Node 24, pnpm, `python3` và `git`):

    Từ một bản sao mã nguồn:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Từ bản cài đặt npm, trước tiên hãy xây dựng ảnh mặc định (xem phía trên), sau đó xây dựng ảnh phổ dụng dựa trên ảnh đó bằng [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) trong kho lưu trữ.

    Sau đó đặt `agents.defaults.sandbox.docker.image` thành `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Tùy chọn: xây dựng ảnh trình duyệt sandbox">
    Từ một bản sao mã nguồn:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Từ bản cài đặt npm, hãy xây dựng bằng [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) trong kho lưu trữ.

  </Step>
</Steps>

Theo mặc định, các container sandbox Docker chạy **không có mạng**. Ghi đè bằng `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Thiết lập mặc định của Chromium trong trình duyệt sandbox">
    Ảnh trình duyệt sandbox đóng gói kèm áp dụng các cờ khởi động Chromium thận trọng cho khối lượng công việc chạy trong container:

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
    - `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer` theo mặc định; các cờ tăng cường bảo mật đồ họa này hỗ trợ các container không có GPU. Đặt `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` nếu khối lượng công việc của bạn cần WebGL hoặc các tính năng 3D khác.
    - `--disable-extensions` theo mặc định; đặt `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` cho các luồng phụ thuộc vào tiện ích mở rộng.
    - `--renderer-process-limit=2` theo mặc định; được điều khiển bằng `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, trong đó `0` giữ nguyên giá trị mặc định của Chromium.

    Nếu cần hồ sơ môi trường chạy khác, hãy dùng ảnh trình duyệt tùy chỉnh và cung cấp điểm vào của riêng bạn. Đối với hồ sơ Chromium cục bộ (không chạy trong container), hãy dùng `browser.extraArgs` để thêm các cờ khởi động bổ sung.

  </Accordion>
  <Accordion title="Thiết lập bảo mật mạng mặc định">
    - `network: "host"` bị chặn.
    - `network: "container:<id>"` bị chặn theo mặc định (rủi ro vượt qua biện pháp bảo vệ bằng cách tham gia không gian tên).
    - Ghi đè khẩn cấp: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Các bản cài đặt Docker và Gateway chạy trong container nằm tại đây: [Docker](/vi/install/docker)

Đối với các triển khai Gateway bằng Docker, `scripts/docker/setup.sh` có thể khởi tạo cấu hình sandbox. Đặt `OPENCLAW_SANDBOX=1` (hoặc `true`/`yes`/`on`) để bật đường dẫn này. Ghi đè vị trí socket bằng `OPENCLAW_DOCKER_SOCKET`. Tham chiếu đầy đủ về thiết lập và biến môi trường: [Docker](/vi/install/docker#agent-sandbox).

## setupCommand (thiết lập container một lần)

`setupCommand` chạy **một lần** sau khi container sandbox được tạo (không chạy ở mỗi lượt). Lệnh này thực thi bên trong container qua `sh -lc`.

Đường dẫn:

- Toàn cục: `agents.defaults.sandbox.docker.setupCommand`
- Theo từng tác tử: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Các lỗi thường gặp">
    - Giá trị mặc định của `docker.network` là `"none"` (không có kết nối ra ngoài), nên việc cài đặt gói sẽ thất bại.
    - `docker.network: "container:<id>"` yêu cầu `dangerouslyAllowContainerNamespaceJoin: true` và chỉ dành cho trường hợp khẩn cấp.
    - `readOnlyRoot: true` ngăn việc ghi; đặt `readOnlyRoot: false` hoặc tích hợp sẵn vào một ảnh tùy chỉnh.
    - `user` phải là root để cài đặt gói (bỏ `user` hoặc đặt `user: "0:0"`).
    - Hoạt động thực thi trong sandbox **không** kế thừa `process.env` của máy chủ. Dùng `agents.defaults.sandbox.docker.env` (hoặc ảnh tùy chỉnh) cho khóa API của skill.
    - Các giá trị trong `agents.defaults.sandbox.docker.env` được truyền dưới dạng biến môi trường container Docker tường minh. Bất kỳ ai có quyền truy cập trình nền Docker đều có thể kiểm tra chúng bằng các lệnh siêu dữ liệu Docker như `docker inspect`. Hãy dùng ảnh tùy chỉnh, tệp bí mật được gắn kết hoặc một phương thức phân phối bí mật khác nếu việc lộ siêu dữ liệu này không thể chấp nhận được.

  </Accordion>
</AccordionGroup>

## Chính sách công cụ và các lối thoát

Các chính sách cho phép/từ chối công cụ vẫn được áp dụng trước các quy tắc sandbox. Nếu một công cụ bị từ chối toàn cục hoặc theo từng tác tử, việc dùng sandbox không kích hoạt lại công cụ đó.

`tools.elevated` là một lối thoát tường minh để chạy `exec` bên ngoài sandbox (mặc định là `gateway`, hoặc `node` khi đích thực thi là `node`). Các chỉ thị `/exec` chỉ áp dụng cho người gửi được ủy quyền và được duy trì theo từng phiên; để vô hiệu hóa hoàn toàn `exec`, hãy dùng chính sách công cụ để từ chối (xem [Sandbox so với chính sách công cụ so với quyền nâng cao](/vi/gateway/sandbox-vs-tool-policy-vs-elevated)).

Gỡ lỗi:

- `openclaw sandbox list` hiển thị các container sandbox, trạng thái, mức độ khớp ảnh, thời gian tồn tại, thời gian nhàn rỗi và phiên/tác tử liên quan.
- `openclaw sandbox explain [--session <key>] [--agent <id>]` kiểm tra chế độ sandbox hiệu lực, không gian làm việc máy chủ, thư mục làm việc của môi trường chạy, các điểm gắn kết Docker, chính sách công cụ và các khóa cấu hình khắc phục. Trường `workspaceRoot` vẫn là thư mục gốc sandbox đã cấu hình; `effectiveHostWorkspaceRoot` cho biết không gian làm việc đang hoạt động thực sự nằm ở đâu.
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` xóa các container/môi trường để chúng được tạo lại với cấu hình hiện tại trong lần sử dụng tiếp theo.
- Xem [Sandbox so với chính sách công cụ so với quyền nâng cao](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) để hiểu mô hình tư duy “tại sao thao tác này bị chặn?”.

## Ghi đè cho nhiều tác tử

Mỗi tác tử có thể ghi đè sandbox + công cụ: `agents.list[].sandbox` và `agents.list[].tools` (cộng thêm `agents.list[].tools.sandbox.tools` cho chính sách công cụ sandbox). Xem [Sandbox và công cụ cho nhiều tác tử](/vi/tools/multi-agent-sandbox-tools) để biết thứ tự ưu tiên.

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

- [Hộp cát và công cụ đa tác nhân](/vi/tools/multi-agent-sandbox-tools) -- các thiết lập ghi đè theo từng tác nhân và thứ tự ưu tiên
- [OpenShell](/vi/gateway/openshell) -- thiết lập phần phụ trợ hộp cát được quản lý, các chế độ không gian làm việc và tài liệu tham khảo cấu hình
- [Cấu hình hộp cát](/vi/gateway/config-agents#agentsdefaultssandbox)
- [Hộp cát so với chính sách công cụ so với quyền nâng cao](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) -- gỡ lỗi "tại sao thao tác này bị chặn?"
- [Bảo mật](/vi/gateway/security)
