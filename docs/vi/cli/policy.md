---
read_when:
    - Bạn muốn kiểm tra các cài đặt OpenClaw theo tệp policy.jsonc đã soạn thảo
    - Bạn muốn các phát hiện về chính sách xuất hiện trong bước kiểm tra lint của doctor
    - Bạn cần một mã băm chứng thực chính sách để làm bằng chứng kiểm toán
summary: Tài liệu tham chiếu CLI cho các bước kiểm tra tuân thủ `openclaw policy`
title: Chính sách
x-i18n:
    generated_at: "2026-07-12T07:46:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` được cung cấp bởi Plugin Policy đi kèm. Đây là một lớp tuân thủ
dành cho doanh nghiệp áp dụng trên các thiết lập OpenClaw hiện có, không phải một
hệ thống cấu hình thứ hai. Bạn soạn các yêu cầu trong `policy.jsonc`; OpenClaw
quan sát không gian làm việc đang hoạt động để làm bằng chứng; policy báo cáo sai
lệch thông qua `doctor --lint`. Policy không thực thi bắt buộc các lệnh gọi công
cụ hoặc viết lại hành vi thời gian chạy tại thời điểm yêu cầu, và không chứng
thực các kho thông tin xác thực riêng của từng tác nhân như `auth-profiles.json`.

Policy kiểm tra các kênh đã cấu hình, máy chủ MCP, nhà cung cấp mô hình, trạng
thái bảo vệ SSRF mạng, quyền truy cập đầu vào/kênh, mức độ phơi bày của Gateway
và trạng thái lệnh Node, quyền truy cập không gian làm việc của tác nhân, trạng
thái sandbox, trạng thái xử lý dữ liệu, trạng thái nhà cung cấp bí mật/hồ sơ xác
thực và siêu dữ liệu công cụ chịu quản trị (`TOOLS.md`). Hãy sử dụng tính năng
này khi một không gian làm việc cần một tuyên bố lâu dài, có thể kiểm tra, chẳng
hạn như "Không được bật Telegram" hoặc "các công cụ chịu quản trị phải khai báo
siêu dữ liệu về rủi ro và chủ sở hữu." Nếu bạn chỉ cần hành vi cục bộ mà không
cần chứng thực hoặc phát hiện sai lệch, cấu hình thông thường là đủ.

## Bắt đầu nhanh

```bash
openclaw plugins enable policy
```

Plugin vẫn được bật ngay cả khi thiếu `policy.jsonc`, nhờ đó doctor có thể báo
cáo thành phần bị thiếu thay vì âm thầm bỏ qua các bước kiểm tra.

Hãy tự soạn `policy.jsonc`; tệp này không được tạo từ các thiết lập hiện tại. Mỗi
phần cấp cao nhất là một không gian tên quy tắc: một bước kiểm tra chỉ chạy khi
có quy tắc cụ thể bên trong phần đó (các phần hoặc khóa không được hỗ trợ sẽ gây
lỗi `policy/policy-jsonc-invalid` thay vì bị âm thầm bỏ qua). Ví dụ tối thiểu bao
quát mọi phần được hỗ trợ:

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram is not approved for this workspace.",
      },
    ],
  },
  "mcp": {
    "servers": {
      "allow": ["docs"],
      "deny": ["untrusted"],
    },
  },
  "models": {
    "providers": {
      "allow": ["openai", "anthropic"],
      "deny": ["openrouter"],
    },
  },
  "network": {
    "privateNetwork": {
      "allow": false,
    },
  },
  "ingress": {
    "session": {
      "requireDmScope": "per-channel-peer",
    },
    "channels": {
      "allowDmPolicies": ["pairing", "allowlist", "disabled"],
      "denyOpenGroups": true,
      "requireMentionInGroups": true,
    },
  },
  "gateway": {
    "exposure": {
      "allowNonLoopbackBind": false,
      "allowTailscaleFunnel": false,
    },
    "auth": {
      "requireAuth": true,
      "requireExplicitRateLimit": true,
    },
    "controlUi": {
      "allowInsecure": false,
    },
    "remote": {
      "allow": false,
    },
    "http": {
      "denyEndpoints": ["chatCompletions", "responses"],
      "requireUrlAllowlists": true,
    },
    "nodes": {
      "denyCommands": ["system.run"],
    },
  },
  "agents": {
    "workspace": {
      "allowedAccess": ["none", "ro"],
      "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
    },
  },
  "dataHandling": {
    "sensitiveLogging": {
      "requireRedaction": true,
    },
    "telemetry": {
      "denyContentCapture": true,
    },
    "retention": {
      "requireSessionMaintenance": true,
    },
    "memory": {
      "denySessionTranscriptIndexing": true,
    },
  },
  "secrets": {
    "requireManagedProviders": true,
    "denySources": ["exec"],
    "allowInsecureProviders": false,
  },
  "auth": {
    "profiles": {
      "requireMetadata": ["provider", "mode"],
      "allowModes": ["api_key", "token"],
    },
  },
  "execApprovals": {
    "requireFile": true,
    "defaults": { "allowSecurity": ["deny"] },
    "agents": {
      "allowSecurity": ["deny", "allowlist"],
      "allowAutoAllowSkills": false,
      "allowlist": { "expected": ["deploy", "status"] },
    },
  },
  "tools": {
    "requireMetadata": ["risk", "sensitivity", "owner"],
    "profiles": {
      "allow": ["messaging", "minimal"],
    },
    "fs": {
      "requireWorkspaceOnly": true,
    },
    "exec": {
      "allowSecurity": ["deny", "allowlist"],
      "requireAsk": ["always"],
      "allowHosts": ["sandbox"],
    },
    "elevated": {
      "allow": false,
    },
    "denyTools": ["group:runtime", "group:fs"],
  },
}
```

Các lưu ý xuyên suốt không thể hiện rõ trong những bảng quy tắc bên dưới:

- Việc bỏ qua `gateway.bind` trong khi cấm liên kết không phải local loopback có
  nghĩa là bạn chấp nhận giá trị mặc định của thời gian chạy; hãy đặt
  `gateway.bind: "loopback"` để tuân thủ nghiêm ngặt.
- Đối với tác nhân chỉ đọc, hãy đặt `mode` của sandbox thành `all` hoặc
  `non-main` trong phần mặc định/tác nhân áp dụng, đồng thời đặt
  `workspaceAccess` thành `none` hoặc `ro`. Chế độ sandbox bị thiếu hoặc là
  `off` không đáp ứng policy chỉ đọc.
- `agents.workspace.denyTools` chấp nhận `exec`, `process`, `write`, `edit`,
  `apply_patch`. Các nhóm từ chối công cụ trong cấu hình là `group:fs` (thay đổi
  tệp) và `group:runtime` (shell/tiến trình) đáp ứng trạng thái tương đương.
- Các bước kiểm tra phê duyệt thực thi chỉ đọc thành phần `exec-approvals.json`
  đang hoạt động khi có quy tắc `execApprovals`; thành phần bị thiếu hoặc không
  hợp lệ là bằng chứng không thể quan sát, không phải kết quả đạt được tạo ra
  nhân tạo.
- Bằng chứng về bí mật và hồ sơ xác thực chỉ ghi lại trạng thái nhà cung
  cấp/nguồn và siêu dữ liệu SecretRef, tuyệt đối không ghi lại giá trị thô.
  Policy không đọc hoặc chứng thực các kho thông tin xác thực riêng của từng tác
  nhân như `auth-profiles.json`.
- Bằng chứng xử lý dữ liệu chỉ là trạng thái ở cấp cấu hình (chế độ biên tập,
  nút bật/tắt thu thập dữ liệu đo từ xa, chế độ bảo trì phiên, thiết lập lập chỉ
  mục bản chép lời phiên). Bằng chứng này không kiểm tra nhật ký, dữ liệu đo từ
  xa đã xuất, bản chép lời hoặc tệp bộ nhớ, và kết quả sạch không chứng minh
  rằng chúng không chứa dữ liệu cá nhân hoặc bí mật.

### Tham chiếu quy tắc policy

Mọi quy tắc bên dưới đều là tùy chọn; một bước kiểm tra chỉ chạy khi có quy tắc
đó. Trạng thái được quan sát là cấu hình OpenClaw hoặc siêu dữ liệu không gian
làm việc hiện có.

#### Lớp phủ theo phạm vi

Sử dụng `scopes.<scopeName>` khi các tác nhân hoặc kênh cụ thể cần policy nghiêm
ngặt hơn đường cơ sở cấp cao nhất. Tên phạm vi chỉ là một nhãn; việc đối sánh sử
dụng bộ chọn bên trong phạm vi. Các lớp phủ mang tính cộng dồn: quy tắc toàn cục
vẫn chạy và quy tắc theo phạm vi có thể thêm phát hiện riêng đối với cùng một
bằng chứng.

| Bộ chọn      | Các phần được hỗ trợ                                                          | Sử dụng khi                                                     |
| ------------ | ----------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | Một hoặc nhiều tác nhân thời gian chạy cần quy tắc nghiêm ngặt hơn. |
| `channelIds` | `ingress.channels`                                                            | Một hoặc nhiều kênh cần quy tắc đầu vào nghiêm ngặt hơn.         |

Nếu một mục `agentIds` không có trong `agents.list[]`, OpenClaw đánh giá quy tắc
theo phạm vi dựa trên trạng thái toàn cục/mặc định được kế thừa cho mã định danh
tác nhân thời gian chạy đó thay vì bỏ qua.

```jsonc
{
  "tools": {
    "exec": {
      "allowHosts": ["sandbox", "node"],
    },
  },
  "sandbox": {
    "requireMode": ["all", "non-main"],
  },
  "scopes": {
    "release-workspace": {
      "agentIds": ["release-agent", "review-agent"],
      "agents": {
        "workspace": {
          "allowedAccess": ["none", "ro"],
        },
      },
    },
    "release-lockdown": {
      "agentIds": ["release-agent"],
      "tools": {
        "exec": {
          "allowHosts": ["sandbox"],
          "allowSecurity": ["deny", "allowlist"],
          "requireAsk": ["always"],
        },
        "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
      },
      "sandbox": {
        "requireMode": ["all"],
        "allowBackends": ["docker"],
      },
      "dataHandling": {
        "memory": {
          "denySessionTranscriptIndexing": true,
        },
      },
    },
    "shell-sandbox": {
      "agentIds": ["shell-agent"],
      "sandbox": {
        "allowBackends": ["openshell"],
        "containers": {
          "requireReadOnlyMounts": false,
        },
      },
    },
    "telegram-ingress": {
      "channelIds": ["telegram"],
      "ingress": {
        "channels": {
          "allowDmPolicies": ["pairing"],
          "denyOpenGroups": true,
          "requireMentionInGroups": true,
        },
      },
    },
  },
}
```

Cùng một tác nhân có thể xuất hiện trong nhiều phạm vi nếu mỗi phạm vi quản lý
một trường khác nhau, như trên. Trường theo phạm vi lặp lại cho cùng một tác
nhân phải có mức hạn chế tương đương hoặc cao hơn; khai báo trùng lặp ít hạn chế
hơn sẽ bị từ chối (danh sách cho phép phải là tập con, danh sách từ chối phải là
tập cha, các giá trị Boolean bắt buộc phải cố định).

Các quy tắc trạng thái vùng chứa (`sandbox.containers.*`) chỉ được kiểm tra dựa
trên bằng chứng mà phần phụ trợ sandbox của tác nhân được đối sánh có thể cung
cấp. Nếu phần phụ trợ không thể quan sát một quy tắc mà bạn đã bật cho nó,
policy sẽ báo cáo `policy/sandbox-container-posture-unobservable` thay vì coi là
đạt; hãy giới hạn phạm vi các quy tắc vùng chứa cho những nhóm tác nhân sử dụng
phần phụ trợ có khả năng cung cấp bằng chứng đó.

`ingress.session.requireDmScope` cấp cao nhất vẫn mang tính toàn cục;
`session.dmScope` không phải bằng chứng có thể quy cho kênh, vì vậy không thể
giới hạn phạm vi bằng `channelIds`.

Mọi phạm vi có trong `policy.jsonc` đều phải hợp lệ và có thể thực thi.

#### Kênh

| Trường policy                         | Trạng thái được quan sát                 | Sử dụng khi                                                       |
| ------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| `channels.denyRules[].when.provider`  | Nhà cung cấp và trạng thái bật của `channels.*` | Cấm các kênh đã cấu hình từ một nhà cung cấp như `telegram`. |
| `channels.denyRules[].reason`         | Thông báo phát hiện và ngữ cảnh gợi ý khắc phục | Giải thích lý do nhà cung cấp bị cấm.                        |

#### Máy chủ MCP

| Trường policy        | Trạng thái được quan sát | Sử dụng khi                                                        |
| -------------------- | ------------------------ | ------------------------------------------------------------------ |
| `mcp.servers.allow`  | Mã định danh `mcp.servers.*` | Yêu cầu mọi máy chủ MCP đã cấu hình phải nằm trong danh sách cho phép. |
| `mcp.servers.deny`   | Mã định danh `mcp.servers.*` | Cấm các mã định danh máy chủ MCP cụ thể đã được cấu hình.            |

#### Nhà cung cấp mô hình

| Trường policy             | Trạng thái được quan sát                              | Sử dụng khi                                                                                   |
| ------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `models.providers.allow`  | Mã định danh `models.providers.*` và tham chiếu mô hình đã chọn | Yêu cầu các nhà cung cấp đã cấu hình và tham chiếu mô hình đã chọn sử dụng nhà cung cấp được phê duyệt. |
| `models.providers.deny`   | Mã định danh `models.providers.*` và tham chiếu mô hình đã chọn | Cấm các nhà cung cấp đã cấu hình và tham chiếu mô hình đã chọn theo mã định danh nhà cung cấp.          |

#### Mạng

| Trường policy                    | Trạng thái được quan sát                  | Sử dụng khi                                                              |
| -------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------ |
| `network.privateNetwork.allow`   | Các lối thoát kiểm soát SSRF mạng riêng   | Đặt thành `false` để yêu cầu quyền truy cập mạng riêng luôn bị vô hiệu hóa. |

#### Quyền truy cập đầu vào và kênh

| Trường chính sách                           | Trạng thái quan sát được                                          | Sử dụng khi                                                                    |
| ------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `ingress.session.requireDmScope`            | `session.dmScope`                                                 | Yêu cầu phạm vi cô lập tin nhắn trực tiếp đã được xem xét.                     |
| `ingress.channels.allowDmPolicies`          | `channels.*.dmPolicy` và các trường chính sách DM kênh cũ         | Chỉ cho phép các chính sách kênh tin nhắn trực tiếp đã được xem xét.           |
| `ingress.channels.denyOpenGroups`           | Chính sách lưu lượng vào của kênh, tài khoản và nhóm              | Từ chối lưu lượng vào nhóm mở đối với các kênh và tài khoản đã cấu hình.       |
| `ingress.channels.requireMentionInGroups`   | Cấu hình cổng đề cập của kênh, tài khoản, nhóm, guild và lồng nhau | Yêu cầu cổng đề cập khi lưu lượng vào nhóm được mở hoặc yêu cầu đề cập.         |

#### Gateway

| Trường chính sách                         | Trạng thái quan sát được                                      | Sử dụng khi                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `gateway.exposure.allowNonLoopbackBind`   | `gateway.bind`                                                | Đặt thành `false` để yêu cầu Gateway liên kết với loopback.                                       |
| `gateway.exposure.allowTailscaleFunnel`   | Trạng thái phục vụ/Funnel của Tailscale cho Gateway           | Đặt thành `false` để từ chối việc công khai qua Tailscale Funnel.                                 |
| `gateway.auth.requireAuth`                | `gateway.auth.mode`                                           | Đặt thành `true` để từ chối xác thực Gateway bị vô hiệu hóa.                                      |
| `gateway.auth.requireExplicitRateLimit`   | `gateway.auth.rateLimit`                                      | Đặt thành `true` để yêu cầu cấu hình giới hạn tốc độ xác thực rõ ràng.                            |
| `gateway.controlUi.allowInsecure`         | Các tùy chọn bật/tắt không an toàn về xác thực/thiết bị/nguồn của giao diện điều khiển | Đặt thành `false` để từ chối các tùy chọn công khai giao diện điều khiển không an toàn.            |
| `gateway.remote.allow`                    | Chế độ/cấu hình Gateway từ xa                                 | Đặt thành `false` để từ chối chế độ Gateway từ xa.                                                |
| `gateway.http.denyEndpoints`              | Các điểm cuối API HTTP của Gateway                            | Từ chối các mã định danh điểm cuối như `chatCompletions` hoặc `responses`.                        |
| `gateway.http.requireUrlAllowlists`       | Đầu vào tìm nạp URL qua HTTP của Gateway                      | Đặt thành `true` để yêu cầu danh sách URL cho phép trên các đầu vào tìm nạp URL.                  |
| `gateway.nodes.denyCommands`              | `gateway.nodes.denyCommands`                                  | Yêu cầu các mã định danh lệnh node chính xác như `system.run` bị từ chối trong cấu hình OpenClaw. |

`gateway.nodes.denyCommands` là quy tắc tập bao từ chối chính xác, phân biệt chữ hoa chữ thường.
Sử dụng quy tắc này khi chính sách phải chứng minh rằng các lệnh node đặc quyền bị
từ chối rõ ràng trong cấu hình OpenClaw. Một bản triển khai chủ ý cho phép lệnh
node đặc quyền nên cập nhật `policy.jsonc` sau khi xem xét thay vì chỉ dựa vào
`gateway.nodes.allowCommands`.

#### Không gian làm việc của tác nhân

| Trường chính sách                 | Trạng thái quan sát được                                                               | Sử dụng khi                                                                                             |
| --------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` và `agents.list[].sandbox.workspaceAccess`   | Chỉ cho phép các giá trị truy cập không gian làm việc sandbox như `none` hoặc `ro`.                     |
| `agents.workspace.denyTools`     | Cấu hình từ chối công cụ toàn cục và theo từng tác nhân                                | Yêu cầu từ chối các công cụ thay đổi (`exec`, `process`, `write`, `edit`, `apply_patch`).               |

#### Trạng thái sandbox

| Trường chính sách                                    | Trạng thái quan sát được                                   | Sử dụng khi                                                            |
| ---------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| `sandbox.requireMode`                                | `agents.defaults.sandbox.mode` và chế độ theo từng tác nhân | Chỉ cho phép các chế độ sandbox đã được xem xét như `all` hoặc `non-main`. |
| `sandbox.allowBackends`                              | `agents.defaults.sandbox.backend` và backend theo từng tác nhân | Chỉ cho phép các backend sandbox đã được xem xét như `docker`.         |
| `sandbox.containers.denyHostNetwork`                 | Chế độ mạng của sandbox/trình duyệt dựa trên container     | Từ chối chế độ mạng máy chủ.                                           |
| `sandbox.containers.denyContainerNamespaceJoin`      | Chế độ mạng của sandbox/trình duyệt dựa trên container     | Từ chối tham gia không gian tên mạng của container khác.               |
| `sandbox.containers.requireReadOnlyMounts`           | Chế độ gắn kết của sandbox/trình duyệt dựa trên container  | Yêu cầu các điểm gắn kết ở chế độ chỉ đọc.                             |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Đích gắn kết của sandbox/trình duyệt dựa trên container   | Từ chối gắn kết socket thời gian chạy container.                       |
| `sandbox.containers.denyUnconfinedProfiles`          | Trạng thái hồ sơ bảo mật container                         | Từ chối các hồ sơ bảo mật container không bị giới hạn.                 |
| `sandbox.browser.requireCdpSourceRange`              | Dải nguồn CDP của trình duyệt sandbox                      | Yêu cầu việc công khai CDP của trình duyệt phải khai báo dải nguồn.    |

Chính sách coi `sandbox.mode` bị thiếu là giá trị mặc định ngầm định `off`, vì vậy
`sandbox.requireMode` báo cáo sandbox mới hoặc chưa được cấu hình là nằm ngoài
danh sách cho phép như `["all"]`.

#### Xử lý dữ liệu

| Trường chính sách                                     | Trạng thái quan sát được                                                              | Sử dụng khi                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `dataHandling.sensitiveLogging.requireRedaction`      | `logging.redactSensitive`                                                             | Đặt thành `true` để từ chối `logging.redactSensitive: "off"`.                  |
| `dataHandling.telemetry.denyContentCapture`           | `diagnostics.otel.captureContent`                                                      | Đặt thành `true` để từ chối việc thu thập nội dung đo từ xa.                   |
| `dataHandling.retention.requireSessionMaintenance`    | `session.maintenance.mode`                                                            | Đặt thành `true` để yêu cầu chế độ bảo trì phiên có hiệu lực là `enforce`.     |
| `dataHandling.memory.denySessionTranscriptIndexing`   | `memory.qmd.sessions.enabled` và `agents.*.memorySearch.experimental.sessionMemory`    | Đặt thành `true` để từ chối lập chỉ mục bản ghi phiên vào bộ nhớ.              |

#### Bí mật

| Trường chính sách                    | Trạng thái quan sát được                                      | Sử dụng khi                                                                    |
| ------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `secrets.requireManagedProviders`    | Các SecretRef cấu hình và khai báo `secrets.providers.*`      | Đặt thành `true` để yêu cầu SecretRef trỏ đến các nhà cung cấp đã khai báo.    |
| `secrets.denySources`                | Nguồn nhà cung cấp bí mật và nguồn SecretRef                  | Từ chối các nguồn như `exec`, `file` hoặc tên nguồn đã cấu hình khác.          |
| `secrets.allowInsecureProviders`     | Cờ trạng thái không an toàn của nhà cung cấp bí mật           | Đặt thành `false` để từ chối các nhà cung cấp chọn trạng thái không an toàn.   |

#### Phê duyệt thực thi

Các kiểm tra phê duyệt thực thi đọc cấu phần `exec-approvals.json` thời gian chạy:
mặc định là `~/.openclaw/exec-approvals.json`, hoặc
`$OPENCLAW_STATE_DIR/exec-approvals.json` khi `OPENCLAW_STATE_DIR` được đặt.
Các quy tắc trạng thái trong `execApprovals.defaults.*` hoặc `execApprovals.agents.*`
yêu cầu bằng chứng cấu phần có thể đọc được; cấu phần bị thiếu hoặc không hợp lệ được báo cáo là
bằng chứng không thể quan sát thay vì được thông qua theo nguyên tắc nỗ lực tối đa. Sau khi có thể đọc,
các trường bị bỏ qua sẽ kế thừa giá trị mặc định thời gian chạy: thiếu `defaults.security` sẽ là `full`, và
bảo mật tác nhân bị thiếu sẽ kế thừa giá trị mặc định đó. Bằng chứng bao gồm `defaults`,
`agents.*`, `agents.*.allowlist[].pattern`, `argPattern` tùy chọn, trạng thái
`autoAllowSkills` có hiệu lực và nguồn mục nhập — tuyệt đối không bao gồm đường dẫn socket/token,
`commandText`, `lastUsedCommand`, đường dẫn đã phân giải hoặc dấu thời gian.

| Trường chính sách                              | Trạng thái quan sát được                                                               | Sử dụng khi                                                                                         |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                    | Đường dẫn `exec-approvals.json` thời gian chạy đang hoạt động                          | Đặt thành `true` để yêu cầu cấu phần phê duyệt tồn tại và có thể phân tích cú pháp.                  |
| `execApprovals.defaults.allowSecurity`         | `defaults.security`, mặc định là `full`                                                | Chỉ cho phép các chế độ bảo mật phê duyệt mặc định đã được chấp thuận.                              |
| `execApprovals.agents.allowSecurity`           | `agents.*.security`, kế thừa giá trị mặc định                                          | Chỉ cho phép các chế độ bảo mật phê duyệt có hiệu lực theo từng tác nhân đã được chấp thuận.        |
| `execApprovals.agents.allowAutoAllowSkills`    | `defaults.autoAllowSkills` và `agents.*.autoAllowSkills`, kế thừa giá trị mặc định thời gian chạy | Đặt thành `false` để yêu cầu danh sách cho phép thủ công nghiêm ngặt mà không ngầm phê duyệt CLI của Skills. |
| `execApprovals.agents.allowlist.expected`      | Tập hợp các mục mẫu `agents.*.allowlist[]` và `argPattern` tùy chọn                    | Yêu cầu danh sách phê duyệt cho phép khớp với tập mẫu đã được xem xét.                              |

Ví dụ: yêu cầu cấu phần phê duyệt, từ chối các giá trị mặc định dễ dãi và chỉ cho phép
trạng thái phê duyệt thực thi đã được xem xét cho các tác nhân được chọn.

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Chế độ bảo mật: "deny", "allowlist" hoặc "full".
      // Giá trị mặc định này chỉ cho phép tư thế từ chối được khóa chặt.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Các tác nhân được chọn có thể sử dụng tư thế danh sách cho phép đã qua xét duyệt, nhưng không được dùng "full".
          "allowSecurity": ["allowlist"],
          // false có nghĩa là các CLI của skill phải xuất hiện trong danh sách cho phép đã qua xét duyệt thay vì
          // được autoAllowSkills phê duyệt ngầm.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Mục đơn giản: mẫu tệp thực thi chính xác đã qua xét duyệt, không có argPattern.
              "travel-hub",
              // Mục bị ràng buộc: mẫu cùng biểu thức chính quy đối số đã qua xét duyệt.
              { "pattern": "calendar-cli", "argPattern": "^sync\\b" },
              "/bin/date",
            ],
          },
        },
      },
    },
  },
}
```

#### Hồ sơ xác thực

| Trường chính sách                | Trạng thái quan sát được                     | Sử dụng khi                                                                                         |
| ------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata` | Siêu dữ liệu nhà cung cấp và chế độ của `auth.profiles.*` | Yêu cầu các khóa siêu dữ liệu như `provider` và `mode` trên hồ sơ xác thực trong cấu hình.          |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | Chỉ cho phép các chế độ hồ sơ xác thực được hỗ trợ như `api_key`, `aws-sdk`, `oauth` hoặc `token`. |

#### Siêu dữ liệu công cụ

| Trường chính sách        | Trạng thái quan sát được          | Sử dụng khi                                                                                      |
| ----------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | Các khai báo `TOOLS.md` được quản trị | Yêu cầu các công cụ được quản trị khai báo các khóa siêu dữ liệu như `risk`, `sensitivity` hoặc `owner`. |

#### Tư thế công cụ

| Trường chính sách                | Trạng thái quan sát được                                     | Sử dụng khi                                                                                                          |
| ------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` và `agents.list[].tools.profile`             | Chỉ cho phép các mã định danh hồ sơ công cụ như `minimal`, `messaging` hoặc `coding`.                                |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` và các giá trị ghi đè `tools.fs` theo từng tác nhân | Đặt thành `true` để yêu cầu tư thế công cụ hệ thống tệp chỉ giới hạn trong không gian làm việc.                       |
| `tools.exec.allowSecurity`      | `tools.exec.security` và bảo mật thực thi theo từng tác nhân | Chỉ cho phép các chế độ bảo mật thực thi như `deny` hoặc `allowlist`.                                                 |
| `tools.exec.requireAsk`         | `tools.exec.ask` và chế độ yêu cầu thực thi theo từng tác nhân | Yêu cầu tư thế phê duyệt như `always`.                                                                                |
| `tools.exec.allowHosts`         | `tools.exec.host` và định tuyến máy chủ thực thi theo từng tác nhân | Chỉ cho phép các chế độ định tuyến máy chủ thực thi như `sandbox`.                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` và tư thế nâng quyền theo từng tác nhân | Đặt thành `false` để yêu cầu chế độ công cụ nâng quyền luôn bị vô hiệu hóa.                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` và `tools.alsoAllow` theo từng tác nhân    | Yêu cầu các mục `alsoAllow` khớp chính xác và báo cáo các quyền cấp công cụ bổ sung bị thiếu hoặc không mong đợi.     |
| `tools.denyTools`               | `tools.deny` và `agents.list[].tools.deny`                   | Yêu cầu danh sách từ chối công cụ đã cấu hình bao gồm mã định danh hoặc nhóm công cụ như `group:runtime` và `group:fs`. |

## Chạy kiểm tra

Chỉ chạy các kiểm tra chính sách trong quá trình biên soạn:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` chỉ chạy tập kiểm tra chính sách và xuất ra bằng chứng, phát hiện
và hàm băm chứng thực. Các phát hiện tương tự cũng xuất hiện trong
`openclaw doctor --lint` khi Plugin Policy được bật.

So sánh tệp chính sách của đơn vị vận hành với đường cơ sở đã biên soạn:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` kiểm tra cú pháp tệp chính sách so với cú pháp tệp chính sách; lệnh này
không kiểm tra trạng thái thời gian chạy, bằng chứng, thông tin xác thực hoặc bí mật. Lệnh sử dụng cùng
siêu dữ liệu quy tắc chi phối các lớp phủ theo phạm vi: danh sách cho phép phải giữ nguyên hoặc
hẹp hơn, danh sách từ chối phải giữ nguyên hoặc rộng hơn, các giá trị boolean bắt buộc phải giữ
nguyên giá trị, chuỗi có thứ tự chỉ có thể di chuyển về phía nghiêm ngặt hơn trong
thứ tự đã cấu hình và các danh sách chính xác phải khớp. Đường cơ sở có thể là
chính sách do tổ chức biên soạn; chính sách được kiểm tra có thể thêm các giá trị nghiêm ngặt hơn hoặc
các quy tắc bổ sung. Một quy tắc cấp cao nhất được kiểm tra có thể đáp ứng quy tắc đường cơ sở theo phạm vi khi
nó có mức hạn chế tương đương hoặc cao hơn. Tên phạm vi không cần phải khớp giữa
các tệp; phép so sánh được định khóa theo bộ chọn (`agentIds`/`channelIds`) và trường.

Kết quả so sánh sạch (`--json`):

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Đầu ra sạch của `policy check --json` bao gồm các hàm băm ổn định mà đơn vị vận hành hoặc
bộ giám sát có thể ghi lại:

```json
{
  "ok": true,
  "attestation": {
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": []
}
```

## Cấu hình chính sách

Cấu hình chính sách nằm trong `plugins.entries.policy.config`.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "enabled": true,
        "config": {
          "enabled": true,
          "path": "policy.jsonc",
          "workspaceRepairs": false,
          "expectedHash": "sha256:...",
          "expectedAttestationHash": "sha256:...",
        },
      },
    },
  },
}
```

| Thiết lập                  | Mục đích                                                                  |
| ------------------------- | ------------------------------------------------------------------------- |
| `enabled`                 | Bật kiểm tra chính sách ngay cả trước khi `policy.jsonc` tồn tại.          |
| `workspaceRepairs`        | Cho phép `doctor --fix` chỉnh sửa các thiết lập không gian làm việc do chính sách quản lý. |
| `expectedHash`            | Khóa hàm băm tùy chọn cho hiện vật chính sách đã được phê duyệt.           |
| `expectedAttestationHash` | Khóa hàm băm tùy chọn cho lần kiểm tra chính sách sạch được chấp nhận gần nhất. |
| `path`                    | Vị trí của hiện vật chính sách tương đối với không gian làm việc.          |

Đặt `plugins.entries.policy.config.enabled` thành `false` để vô hiệu hóa các kiểm tra
chính sách cho một không gian làm việc trong khi vẫn giữ Plugin được cài đặt.

## Chấp nhận trạng thái chính sách

Ví dụ đầu ra JSON:

```json
{
  "ok": true,
  "attestation": {
    "checkedAt": "2026-05-10T20:00:00.000Z",
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "evidence": {
    "channels": [
      {
        "id": "telegram",
        "provider": "telegram",
        "source": "oc://openclaw.config/channels/telegram",
        "enabled": false
      }
    ],
    "mcpServers": [
      {
        "id": "docs",
        "transport": "stdio",
        "source": "oc://openclaw.config/mcp/servers/docs",
        "command": "npx"
      }
    ],
    "modelProviders": [
      {
        "id": "openai",
        "source": "oc://openclaw.config/models/providers/openai"
      }
    ],
    "modelRefs": [
      {
        "ref": "openai/gpt-5.6-sol",
        "provider": "openai",
        "model": "gpt-5.6-sol",
        "source": "oc://openclaw.config/agents/defaults/model"
      }
    ],
    "network": [
      {
        "id": "browser-private-network",
        "source": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
        "value": false
      }
    ],
    "gatewayExposure": [
      {
        "id": "gateway-bind",
        "kind": "bind",
        "source": "oc://openclaw.config/gateway/bind",
        "value": "loopback",
        "nonLoopback": false,
        "explicit": true
      }
    ],
    "agentWorkspace": [
      {
        "id": "agents-defaults-workspace-access",
        "kind": "workspaceAccess",
        "source": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
        "scope": "defaults",
        "value": "ro",
        "sandboxMode": "all",
        "sandboxModeSource": "oc://openclaw.config/agents/defaults/sandbox/mode",
        "sandboxEnabled": true,
        "explicit": true
      },
      {
        "id": "agents-defaults-tool-exec",
        "kind": "toolDeny",
        "source": "oc://openclaw.config/tools/deny",
        "scope": "defaults",
        "tool": "exec",
        "denied": true,
        "explicit": true
      }
    ],
    "secrets": [
      {
        "id": "vault",
        "kind": "provider",
        "source": "oc://openclaw.config/secrets/providers/vault",
        "providerSource": "env"
      },
      {
        "id": "oc://openclaw.config/models/providers/openai/apiKey",
        "kind": "input",
        "source": "oc://openclaw.config/models/providers/openai/apiKey",
        "provenance": "secretRef",
        "refSource": "env",
        "refProvider": "vault"
      }
    ],
    "authProfiles": [
      {
        "id": "github",
        "source": "oc://openclaw.config/auth/profiles/github",
        "validMetadata": true,
        "provider": "github",
        "mode": "token"
      }
    ],
    "tools": [
      {
        "id": "deploy",
        "source": "oc://TOOLS.md/tools/deploy",
        "line": 12,
        "risk": "critical",
        "sensitivity": "restricted",
        "capabilities": ["IRREVERSIBLE_EXTERNAL"]
      }
    ]
  },
  "checksRun": 30,
  "checksSkipped": 0,
  "findings": []
}
```

`attestation.policy.hash` xác định hiện vật quy tắc đã biên soạn. `evidence`
ghi lại trạng thái OpenClaw quan sát được mà các kiểm tra sử dụng và
`workspace.hash` xác định tải trọng bằng chứng đó. `findingsHash` xác định
chính xác tập phát hiện. `checkedAt` ghi lại thời điểm kiểm tra được chạy.
`attestationHash` xác định tuyên bố ổn định (hàm băm chính sách, hàm băm bằng chứng,
hàm băm phát hiện và trạng thái sạch/bẩn) và chủ ý loại trừ `checkedAt`,
vì vậy cùng một trạng thái chính sách luôn tạo ra cùng một hàm băm chứng thực. Khi kết hợp,
bốn giá trị này tạo thành bộ kiểm toán cho một lần kiểm tra chính sách.

Nếu Gateway hoặc bộ giám sát sử dụng chính sách để chặn, phê duyệt hoặc chú giải một
hành động thời gian chạy, thành phần đó nên ghi lại hàm băm chứng thực từ lần kiểm tra sạch
gần nhất. `checkedAt` vẫn nằm trong đầu ra JSON dành cho nhật ký kiểm toán nhưng không phải là
một phần của hàm băm ổn định.

Vòng đời chấp nhận trạng thái chính sách:

1. Biên soạn hoặc xét duyệt `policy.jsonc`.
2. Chạy `openclaw policy check --json`.
3. Nếu sạch, ghi lại `attestation.policy.hash` làm `expectedHash`.
4. Ghi lại `attestation.attestationHash` làm `expectedAttestationHash`.
5. Chạy lại `openclaw doctor --lint` trong CI hoặc các cổng phát hành.

Nếu các quy tắc chính sách được thay đổi có chủ đích, hãy cập nhật cả hai hàm băm được chấp nhận từ một lần kiểm tra sạch. Nếu chỉ các thiết lập không gian làm việc thay đổi (chính sách không đổi), thông thường chỉ `expectedAttestationHash` thay đổi.

Việc bật hoặc nâng cấp các quy tắc `agents.workspace` sẽ thêm bằng chứng `agentWorkspace` vào hàm băm không gian làm việc và hàm băm chứng thực; hãy xem xét bằng chứng mới và làm mới các hàm băm chứng thực được chấp nhận sau khi bật. Việc bật hoặc nâng cấp các quy tắc trạng thái công cụ cũng thêm bằng chứng `toolPosture` theo cách tương tự.

`openclaw policy watch` chạy lại bước kiểm tra và báo cáo khi bằng chứng hiện tại không còn khớp với `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

Sử dụng `--once` trong CI hoặc các tập lệnh cần đánh giá độ lệch một lần. Nếu không có `--once`, theo mặc định lệnh sẽ thăm dò mỗi hai giây; sử dụng `--interval-ms` để thay đổi khoảng thời gian.

## Các phát hiện

| ID kiểm tra                                              | Phát hiện                                                                                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `policy/policy-jsonc-missing`                            | Chính sách đã được bật nhưng thiếu `policy.jsonc`.                                                     |
| `policy/policy-jsonc-invalid`                            | Không thể phân tích cú pháp chính sách hoặc chính sách chứa các mục quy tắc không đúng định dạng.       |
| `policy/policy-hash-mismatch`                            | Chính sách không khớp với `expectedHash` đã cấu hình.                                                  |
| `policy/attestation-hash-mismatch`                       | Bằng chứng chính sách hiện tại không còn khớp với chứng thực được chấp nhận.                            |
| `policy/policy-conformance-invalid`                      | Tệp chính sách cơ sở hoặc tệp chính sách được kiểm tra có cú pháp so sánh không hợp lệ.                 |
| `policy/policy-conformance-missing`                      | Tệp chính sách được kiểm tra thiếu một quy tắc mà tệp chính sách cơ sở yêu cầu.                         |
| `policy/policy-conformance-weaker`                       | Tệp chính sách được kiểm tra có giá trị yếu hơn tệp chính sách cơ sở.                                  |
| `policy/channels-denied-provider`                        | Một kênh đã bật khớp với quy tắc từ chối kênh.                                                         |
| `policy/mcp-denied-server`                               | Một máy chủ MCP đã cấu hình bị chính sách từ chối.                                                     |
| `policy/mcp-unapproved-server`                           | Một máy chủ MCP đã cấu hình nằm ngoài danh sách cho phép.                                              |
| `policy/models-denied-provider`                          | Một nhà cung cấp mô hình hoặc tham chiếu mô hình đã cấu hình sử dụng nhà cung cấp bị từ chối.           |
| `policy/models-unapproved-provider`                      | Một nhà cung cấp mô hình hoặc tham chiếu mô hình đã cấu hình nằm ngoài danh sách cho phép.              |
| `policy/network-private-access-enabled`                  | Một cơ chế thoát SSRF vào mạng riêng được bật trong khi chính sách từ chối cơ chế đó.                   |
| `policy/ingress-dm-policy-unapproved`                    | Chính sách tin nhắn trực tiếp của một kênh nằm ngoài danh sách cho phép của chính sách.                 |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` không khớp với phạm vi cô lập tin nhắn trực tiếp mà chính sách yêu cầu.               |
| `policy/ingress-open-groups-denied`                      | Chính sách nhóm của một kênh là `open` trong khi chính sách từ chối lưu lượng nhóm mở đi vào.           |
| `policy/ingress-group-mention-required`                  | Một mục kênh hoặc nhóm tắt cổng yêu cầu nhắc tên trong khi chính sách yêu cầu bật cổng này.             |
| `policy/gateway-non-loopback-bind`                       | Trạng thái liên kết của Gateway cho phép phơi bày ngoài local loopback trong khi chính sách từ chối.    |
| `policy/gateway-auth-disabled`                           | Xác thực Gateway bị tắt trong khi chính sách yêu cầu xác thực.                                         |
| `policy/gateway-rate-limit-missing`                      | Trạng thái giới hạn tốc độ xác thực Gateway không được khai báo rõ trong khi chính sách yêu cầu.        |
| `policy/gateway-control-ui-insecure`                     | Các tùy chọn bật phơi bày không an toàn của giao diện điều khiển Gateway đang được bật.                 |
| `policy/gateway-tailscale-funnel`                        | Phơi bày Gateway qua Tailscale Funnel được bật trong khi chính sách từ chối.                            |
| `policy/gateway-remote-enabled`                          | Chế độ từ xa của Gateway đang hoạt động trong khi chính sách từ chối.                                  |
| `policy/gateway-http-endpoint-enabled`                   | Một điểm cuối API HTTP của Gateway được bật trong khi bị chính sách từ chối.                            |
| `policy/gateway-http-url-fetch-unrestricted`             | Đầu vào tìm nạp URL qua HTTP của Gateway thiếu danh sách URL cho phép bắt buộc.                         |
| `policy/gateway-node-command-denied`                     | Một lệnh Node bị chính sách từ chối nhưng không bị cấu hình OpenClaw từ chối.                            |
| `policy/agents-workspace-access-denied`                  | Chế độ hộp cát hoặc quyền truy cập không gian làm việc của tác nhân nằm ngoài danh sách cho phép.       |
| `policy/agents-tool-not-denied`                          | Cấu hình tác nhân hoặc cấu hình mặc định không từ chối một công cụ mà chính sách yêu cầu phải từ chối.  |
| `policy/tools-profile-unapproved`                        | Hồ sơ công cụ toàn cục hoặc theo tác nhân đã cấu hình nằm ngoài danh sách cho phép.                     |
| `policy/tools-fs-workspace-only-required`                | Các công cụ hệ thống tệp chưa được cấu hình với trạng thái đường dẫn chỉ dành cho không gian làm việc.  |
| `policy/tools-exec-security-unapproved`                  | Chế độ bảo mật thực thi nằm ngoài danh sách cho phép của chính sách.                                   |
| `policy/tools-exec-ask-unapproved`                       | Chế độ yêu cầu xác nhận thực thi nằm ngoài danh sách cho phép của chính sách.                           |
| `policy/tools-exec-host-unapproved`                      | Định tuyến máy chủ thực thi nằm ngoài danh sách cho phép của chính sách.                               |
| `policy/tools-elevated-enabled`                          | Chế độ công cụ đặc quyền được bật trong khi chính sách từ chối.                                        |
| `policy/tools-also-allow-missing`                        | Danh sách `alsoAllow` đã cấu hình thiếu một mục mà chính sách yêu cầu.                                 |
| `policy/tools-also-allow-unexpected`                     | Danh sách `alsoAllow` đã cấu hình chứa một mục mà chính sách không cho phép.                            |
| `policy/tools-required-deny-missing`                     | Danh sách từ chối công cụ toàn cục hoặc theo tác nhân không chứa một công cụ bắt buộc phải từ chối.     |
| `policy/sandbox-mode-unapproved`                         | Chế độ hộp cát nằm ngoài danh sách cho phép của chính sách.                                            |
| `policy/sandbox-backend-unapproved`                      | Phần phụ trợ hộp cát nằm ngoài danh sách cho phép của chính sách.                                      |
| `policy/sandbox-container-posture-unobservable`          | Một quy tắc trạng thái vùng chứa được bật cho phần phụ trợ không thể quan sát trạng thái đó.            |
| `policy/sandbox-container-host-network-denied`           | Hộp cát hoặc trình duyệt dựa trên vùng chứa sử dụng chế độ mạng máy chủ.                                |
| `policy/sandbox-container-namespace-join-denied`         | Hộp cát hoặc trình duyệt dựa trên vùng chứa tham gia không gian tên của vùng chứa khác.                 |
| `policy/sandbox-container-mount-mode-required`           | Điểm gắn kết của hộp cát hoặc trình duyệt dựa trên vùng chứa không ở chế độ chỉ đọc.                    |
| `policy/sandbox-container-runtime-socket-mount`          | Điểm gắn kết của hộp cát hoặc trình duyệt dựa trên vùng chứa làm lộ socket thời gian chạy vùng chứa.    |
| `policy/sandbox-container-unconfined-profile`            | Hồ sơ hộp cát vùng chứa không bị giới hạn trong khi chính sách từ chối trạng thái này.                  |
| `policy/sandbox-browser-cdp-source-range-missing`        | Thiếu dải nguồn CDP của trình duyệt hộp cát trong khi chính sách yêu cầu.                               |
| `policy/data-handling-redaction-disabled`                | Việc che dữ liệu nhạy cảm trong nhật ký bị tắt trong khi chính sách yêu cầu.                            |
| `policy/data-handling-telemetry-content-capture`         | Việc thu thập nội dung đo từ xa được bật trong khi chính sách từ chối.                                 |
| `policy/data-handling-session-retention-not-enforced`    | Việc duy trì thời hạn lưu giữ phiên không được thực thi trong khi chính sách yêu cầu.                   |
| `policy/data-handling-session-transcript-memory-enabled` | Việc lập chỉ mục bộ nhớ bản ghi phiên được bật trong khi chính sách từ chối.                            |
| `policy/secrets-unmanaged-provider`                      | Một SecretRef trong cấu hình tham chiếu đến nhà cung cấp không được khai báo trong `secrets.providers`. |
| `policy/secrets-denied-provider-source`                  | Một nhà cung cấp bí mật hoặc SecretRef trong cấu hình sử dụng nguồn bị chính sách từ chối.              |
| `policy/secrets-insecure-provider`                       | Một nhà cung cấp bí mật chọn sử dụng trạng thái không an toàn trong khi chính sách từ chối.             |
| `policy/auth-profile-invalid-metadata`                   | Hồ sơ xác thực trong cấu hình thiếu siêu dữ liệu hợp lệ về nhà cung cấp hoặc chế độ.                    |
| `policy/auth-profile-unapproved-mode`                    | Chế độ hồ sơ xác thực trong cấu hình nằm ngoài danh sách cho phép của chính sách.                       |
| `policy/exec-approvals-missing`                          | Chính sách yêu cầu `exec-approvals.json`, nhưng thiếu hiện vật này.                                    |
| `policy/exec-approvals-invalid`                          | Không thể phân tích cú pháp hiện vật phê duyệt thực thi đã cấu hình.                                   |
| `policy/exec-approvals-default-security-unapproved`      | Mặc định phê duyệt thực thi sử dụng chế độ bảo mật nằm ngoài danh sách cho phép của chính sách.         |
| `policy/exec-approvals-agent-security-unapproved`        | Chế độ bảo mật phê duyệt thực thi có hiệu lực theo tác nhân nằm ngoài danh sách cho phép.               |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Một tác nhân phê duyệt thực thi ngầm tự động cho phép CLI của Skills trong khi chính sách từ chối.      |
| `policy/exec-approvals-allowlist-missing`                | Danh sách phê duyệt cho phép thiếu một mẫu mà chính sách yêu cầu.                                      |
| `policy/exec-approvals-allowlist-unexpected`             | Danh sách phê duyệt cho phép chứa một mẫu mà chính sách không cho phép.                                |
| `policy/tools-missing-risk-level`                        | Khai báo công cụ chịu quản trị thiếu siêu dữ liệu rủi ro.                                              |
| `policy/tools-unknown-risk-level`                        | Khai báo công cụ chịu quản trị sử dụng giá trị rủi ro không xác định.                                  |
| `policy/tools-missing-sensitivity-token`                 | Khai báo công cụ chịu quản trị thiếu siêu dữ liệu về độ nhạy cảm.                                      |
| `policy/tools-missing-owner`                             | Khai báo công cụ chịu quản trị thiếu siêu dữ liệu về chủ sở hữu.                                       |
| `policy/tools-unknown-sensitivity-token`                 | Khai báo công cụ chịu quản trị sử dụng giá trị độ nhạy cảm không xác định.                              |

Một phát hiện có thể bao gồm cả `target` (thành phần được quan sát trong không gian làm việc không tuân thủ) và `requirement` (quy tắc được soạn thảo khiến thành phần đó trở thành một phát hiện). Hiện tại cả hai đều là chuỗi địa chỉ `oc://`, nhưng tên trường mô tả vai trò trong chính sách thay vì định dạng địa chỉ.

Ví dụ về các phát hiện:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Channel 'telegram' uses denied provider 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram is not approved for this workspace."
}
```

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md tool 'deploy' has no explicit risk classification.",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "Máy chủ MCP 'remote' không nằm trong danh sách cho phép của chính sách.",
  "source": "policy",
  "path": "cấu hình openclaw",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "Tham chiếu mô hình 'anthropic/claude-sonnet-4.7' sử dụng nhà cung cấp chưa được phê duyệt 'anthropic'.",
  "source": "policy",
  "path": "cấu hình openclaw",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "Thiết lập mạng 'browser-private-network' cho phép truy cập mạng riêng.",
  "source": "policy",
  "path": "cấu hình openclaw",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Thiết lập liên kết Gateway 'gateway-bind' cho phép công khai qua địa chỉ không phải local loopback.",
  "source": "policy",
  "path": "cấu hình openclaw",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

```json
{
  "checkId": "policy/gateway-node-command-denied",
  "severity": "error",
  "message": "Lệnh Node Gateway 'system.run' bị chính sách từ chối nhưng không bị cấu hình OpenClaw từ chối.",
  "source": "policy",
  "path": "cấu hình openclaw",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Thêm 'system.run' vào gateway.nodes.denyCommands hoặc cập nhật chính sách sau khi xem xét."
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "Quyền workspaceAccess 'rw' của hộp cát agents.defaults không được chính sách cho phép.",
  "source": "policy",
  "path": "cấu hình openclaw",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## Sửa chữa

`doctor --lint` và `policy check` chỉ đọc.

`doctor --fix` chỉ chỉnh sửa các thiết lập không gian làm việc do chính sách quản lý khi
`workspaceRepairs` được bật rõ ràng; nếu không, các lượt kiểm tra sẽ báo cáo những gì
chúng sẽ sửa chữa và giữ nguyên các thiết lập.

Trong phiên bản này, chức năng sửa chữa có thể vô hiệu hóa các kênh bị `channels.denyRules`
từ chối và áp dụng các biện pháp tự động thu hẹp quyền được liệt kê bên dưới. Chỉ bật
`workspaceRepairs` sau khi đã xem xét tệp chính sách, vì một quy tắc hợp lệ có thể thay đổi
cấu hình không gian làm việc:

- đặt `tools.elevated.enabled=false` khi chính sách toàn cục cấm các công cụ có đặc quyền nâng cao
- thêm các mã định danh công cụ bắt buộc phải từ chối còn thiếu vào `tools.deny` hoặc
  `agents.list[].tools.deny` khi chính sách yêu cầu từ chối các công cụ đó
- đặt các tùy chọn bật/tắt `gateway.controlUi.*` không an toàn thành `false`
- đặt `gateway.mode=local` khi chính sách từ chối chế độ Gateway từ xa
- đặt các đường dẫn `gateway.http.endpoints.*.enabled` được báo cáo thành `false` khi chính sách
  từ chối các điểm cuối API HTTP của Gateway
- đặt các đường dẫn `groupPolicy` tiếp nhận kênh được báo cáo thành `allowlist` khi chính sách
  từ chối tiếp nhận nhóm mở
- đặt các đường dẫn `requireMention` tiếp nhận kênh được báo cáo thành `true` khi chính sách
  yêu cầu đề cập trong nhóm
- đặt `logging.redactSensitive=tools` khi chính sách yêu cầu che thông tin nhạy cảm trong nhật ký
- đặt `diagnostics.otel.captureContent=false`, hoặc
  `diagnostics.otel.captureContent.enabled=false` đối với các thiết lập thu thập dữ liệu đo từ xa
  ở dạng đối tượng, khi chính sách từ chối thu thập nội dung dữ liệu đo từ xa

Các biện pháp sửa chữa công cụ có đặc quyền nâng cao theo phạm vi chỉ được phát hiện, không được áp dụng. Các biện pháp sửa chữa xử lý dữ liệu theo phạm vi
cũng bị bỏ qua khi phát hiện báo cáo cấu hình ghi nhật ký hoặc dữ liệu đo từ xa dùng chung,
vì việc thay đổi thiết lập dùng chung sẽ ảnh hưởng đến nhiều đối tượng hơn mục tiêu chính sách
theo phạm vi.

Các biện pháp sửa chữa bắt buộc từ chối theo phạm vi bị bỏ qua khi phát hiện báo cáo
`tools.deny` gốc được kế thừa, vì việc thêm công cụ bắt buộc vào cấu hình gốc sẽ ảnh hưởng
đến nhiều đối tượng hơn mục tiêu chính sách theo phạm vi. Các biện pháp sửa chữa bắt buộc từ chối cục bộ cho tác nhân có thể cập nhật
đường dẫn `agents.list[].tools.deny` được báo cáo.

Các biện pháp sửa chữa tiếp nhận kênh theo phạm vi bị bỏ qua khi phát hiện báo cáo
`channels.defaults.*` được kế thừa, vì việc thay đổi giá trị mặc định dùng chung của kênh sẽ ảnh hưởng
đến nhiều đối tượng hơn mục tiêu chính sách theo phạm vi. Các phát hiện về danh sách cho phép tìm nạp URL qua HTTP của Gateway
vẫn cần xử lý thủ công vì chức năng sửa chữa tự động không thể chọn đúng các giá trị
danh sách URL cho phép của điểm cuối.

Các phát hiện về liên kết Gateway và lệnh Node vẫn yêu cầu xem xét. Khi
`policy/gateway-non-loopback-bind` hoặc `policy/gateway-node-command-denied`
có thể được ánh xạ tới một đường dẫn cấu hình, `doctor --fix` sẽ báo cáo thay đổi
`gateway.bind` hoặc `gateway.nodes.denyCommands` được đề xuất dưới dạng hướng dẫn xem trước
đã bỏ qua. Lệnh không áp dụng thay đổi và phát hiện không được tính là
đã sửa chữa cho đến khi người vận hành xem xét và cập nhật cấu hình hoặc chính sách.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "config": {
          "workspaceRepairs": true,
        },
      },
    },
  },
}
```

## Mã thoát

| Lệnh             | `0`                                                        | `1`                                                                        | `2`                              |
| ---------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------- |
| `policy check`   | Không có phát hiện nào đạt ngưỡng.                          | Một hoặc nhiều phát hiện đạt ngưỡng.                                       | Lỗi đối số hoặc lỗi khi chạy.     |
| `policy compare` | Tệp chính sách ít nhất nghiêm ngặt ngang với đường cơ sở.   | Tệp chính sách không hợp lệ, bị thiếu hoặc yếu hơn các quy tắc đường cơ sở. | Lỗi đối số hoặc lỗi khi chạy.     |
| `policy watch`   | Không có phát hiện và hàm băm được chấp nhận vẫn hiện hành. | Có phát hiện hoặc chứng thực được chấp nhận đã lỗi thời.                    | Lỗi đối số hoặc lỗi khi chạy.     |

## Liên quan

- [Chế độ lint của Doctor](/vi/cli/doctor#lint-mode)
- [CLI đường dẫn](/vi/cli/path)
