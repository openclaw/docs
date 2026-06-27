---
read_when:
    - Bạn muốn kiểm tra cài đặt OpenClaw theo một policy.jsonc đã được biên soạn
    - Bạn muốn các phát hiện về chính sách trong lint của doctor
    - Bạn cần hàm băm chứng thực chính sách cho bằng chứng kiểm toán
summary: Tài liệu tham chiếu CLI cho các kiểm tra tuân thủ `openclaw policy`
title: Chính sách
x-i18n:
    generated_at: "2026-06-27T17:19:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5af65bb34aeed72bbb348a56195d65152dce1e8d0e7236da8d8681e56c9b32f4
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` được cung cấp bởi Policy plugin đi kèm. Chính sách là một lớp tuân thủ doanh nghiệp trên các thiết lập OpenClaw hiện có. Nó không thêm hệ thống cấu hình thứ hai. `policy.jsonc` định nghĩa các yêu cầu do tác giả đặt ra, OpenClaw quan sát workspace đang hoạt động làm bằng chứng, và các kiểm tra sức khỏe chính sách báo cáo độ lệch qua `doctor --lint`. Tín hiệu tuân thủ cuối cùng là một lần chạy `doctor --lint` sạch; chính sách đóng góp phát hiện vào bề mặt lint dùng chung đó thay vì tạo một cổng sức khỏe riêng.

Chính sách hiện quản lý các kênh đã cấu hình, máy chủ MCP, nhà cung cấp mô hình, trạng thái SSRF mạng, trạng thái truy cập ingress/kênh, trạng thái phơi bày Gateway, trạng thái workspace của agent, trạng thái xử lý dữ liệu, trạng thái nhà cung cấp bí mật/hồ sơ xác thực trong cấu hình OpenClaw, và các khai báo công cụ được quản trị. Ví dụ, bộ phận IT hoặc người vận hành workspace có thể ghi nhận rằng Telegram không phải là nhà cung cấp kênh được phê duyệt, giới hạn máy chủ MCP và tham chiếu mô hình vào các mục được phê duyệt, yêu cầu quyền truy cập fetch/browser vào mạng riêng tiếp tục bị tắt, yêu cầu cô lập phiên tin nhắn trực tiếp và trạng thái ingress kênh nằm trong giới hạn đã được rà soát, yêu cầu bind/xác thực/phơi bày HTTP của Gateway nằm trong giới hạn đã được rà soát, yêu cầu quyền truy cập workspace của agent và các lệnh chặn công cụ duy trì trong trạng thái đã được rà soát, yêu cầu SecretRefs trong cấu hình OpenClaw dùng nhà cung cấp được quản lý, yêu cầu hồ sơ xác thực cấu hình mang siêu dữ liệu nhà cung cấp/chế độ, yêu cầu công cụ được quản trị mang siêu dữ liệu rủi ro và độ nhạy cảm, yêu cầu biên tập lại nhật ký nhạy cảm, từ chối thu thập nội dung telemetry, yêu cầu bảo trì lưu giữ phiên, từ chối lập chỉ mục bộ nhớ bản ghi phiên, rồi dùng `doctor --lint` làm cổng tuân thủ dùng chung.

Dùng chính sách khi workspace cần một tuyên bố bền vững như "các kênh này không được bật" hoặc "công cụ được quản trị phải khai báo siêu dữ liệu phê duyệt" và một cách lặp lại được để chứng minh OpenClaw vẫn tuân thủ tuyên bố đó. Chỉ dùng cấu hình thông thường và tài liệu workspace khi bạn chỉ cần hành vi cục bộ và không cần phát hiện chính sách hoặc đầu ra chứng thực.

## Bắt đầu nhanh

Bật Policy plugin đi kèm trước lần dùng đầu tiên:

```bash
openclaw plugins enable policy
```

Khi chính sách được bật, doctor có thể tải các kiểm tra sức khỏe chính sách mà không kích hoạt các plugin tùy ý. Plugin vẫn được bật nếu thiếu `policy.jsonc`, để doctor có thể báo cáo artifact bị thiếu.

Chính sách được tác giả viết, không được tạo từ các thiết lập hiện tại của người dùng. Một chính sách tối thiểu cho kênh, máy chủ MCP, nhà cung cấp mô hình, trạng thái mạng, truy cập ingress/kênh, phơi bày Gateway, trạng thái workspace của agent, trạng thái runtime sandbox đã cấu hình, trạng thái xử lý dữ liệu OpenClaw, trạng thái nhà cung cấp bí mật/hồ sơ xác thực trong cấu hình, trạng thái tệp phê duyệt exec, và siêu dữ liệu công cụ trông như sau:

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

Các quy tắc là nguồn thẩm quyền. Một khối danh mục chỉ là namespace; kiểm tra chạy khi có quy tắc cụ thể. OpenClaw đọc các thiết lập `channels.*` hiện tại, `mcp.servers.*`, `models.providers.*`, các tham chiếu mô hình agent đã chọn, thiết lập SSRF mạng, phạm vi phiên tin nhắn trực tiếp, chính sách DM của kênh, chính sách nhóm của kênh, cổng yêu cầu nhắc đến trong kênh/nhóm, trạng thái bind/xác thực/Control UI/Tailscale/remote/HTTP của Gateway, quyền truy cập workspace sandbox agent trong cấu hình OpenClaw và trạng thái chặn công cụ, trạng thái cấu hình xử lý dữ liệu, nguồn gốc nhà cung cấp bí mật cấu hình và SecretRef, siêu dữ liệu hồ sơ xác thực cấu hình, trạng thái công cụ toàn cục/theo agent đã cấu hình, và các khai báo `TOOLS.md` làm bằng chứng, rồi báo cáo trạng thái quan sát được không tuân thủ. Nếu một chính sách từ chối bind Gateway không phải local loopback, chỉ bỏ qua `gateway.bind` khi bạn sẵn sàng rà soát mặc định runtime; đặt `gateway.bind=loopback` để tuân thủ cấu hình nghiêm ngặt. Với trạng thái agent chỉ đọc, cấu hình chế độ sandbox trên mặc định hoặc agent áp dụng và đặt `workspaceAccess` thành `none` hoặc `ro`; chế độ sandbox bị bỏ qua hoặc `off` không thỏa mãn chính sách chỉ đọc/không ghi. `agents.workspace.denyTools` hỗ trợ `exec`, `process`, `write`, `edit`, và `apply_patch`; cấu hình OpenClaw `group:fs` bao gồm các công cụ thay đổi tệp và `group:runtime` bao gồm các công cụ shell/process. Chính sách trạng thái công cụ quan sát `tools.profile`, `tools.allow`, `tools.alsoAllow`, `tools.deny`, `tools.fs.workspaceOnly`, `tools.exec.security`, `tools.exec.ask`, `tools.exec.host`, `tools.elevated.enabled`, và các ghi đè theo agent tương tự trong `agents.list[].tools.*`. Chính sách phê duyệt exec chỉ đọc artifact sản phẩm `exec-approvals.json` được đặt tên khi có quy tắc `execApprovals`; bằng chứng ghi lại mặc định, trạng thái theo agent, và mẫu allowlist mà không có token socket hoặc văn bản lệnh dùng lần cuối. Chính sách không thực thi lời gọi công cụ trong runtime. Bằng chứng bí mật ghi lại trạng thái nhà cung cấp/nguồn và siêu dữ liệu SecretRef, không bao giờ ghi giá trị bí mật thô. Chính sách không đọc hoặc chứng thực các kho thông tin xác thực theo agent như `auth-profiles.json`; các kho đó vẫn thuộc sở hữu của các luồng xác thực và thông tin xác thực hiện có. Bằng chứng xử lý dữ liệu chỉ là trạng thái cấp cấu hình: nó kiểm tra chế độ biên tập lại đã cấu hình, nút bật/tắt thu thập nội dung telemetry, chế độ bảo trì phiên, và thiết lập lập chỉ mục bộ nhớ bản ghi phiên. Nó không kiểm tra nhật ký thô, bản xuất telemetry, nội dung bản ghi, tệp bộ nhớ, hoặc chứng minh rằng không tồn tại dữ liệu cá nhân hay bí mật.

### Tham chiếu quy tắc chính sách

Mỗi trường chính sách bên dưới là tùy chọn. Kiểm tra chỉ chạy khi quy tắc khớp có trong `policy.jsonc`. Trạng thái quan sát được là cấu hình OpenClaw hiện có hoặc siêu dữ liệu workspace; chính sách báo cáo độ lệch nhưng không ghi lại hành vi runtime trừ khi có đường sửa chữa rõ ràng và được bật.
Tệp chính sách có tính nghiêm ngặt: các phần hoặc khóa quy tắc không được hỗ trợ được báo cáo là `policy/policy-jsonc-invalid` thay vì bị bỏ qua.

Lớp phủ chính sách giữ các quy tắc cấp cao rộng ở phạm vi toàn cục, rồi cho các khối phạm vi có tên thêm các phần chính sách thông thường nghiêm ngặt hơn cho bộ chọn rõ ràng. Tên phạm vi chỉ là một nhóm mô tả; việc khớp dùng các giá trị bộ chọn bên trong phạm vi. Lớp phủ có tính cộng thêm: các khẳng định toàn cục vẫn chạy, và một khẳng định có phạm vi có thể phát ra phát hiện riêng của nó trên cùng cấu hình quan sát được.

#### Lớp phủ có phạm vi

Dùng `scopes.<scopeName>` khi một tập hợp agent hoặc kênh cần chính sách nghiêm ngặt hơn đường cơ sở cấp cao nhất. Các phần theo phạm vi agent dùng `agentIds`, hỗ trợ `tools.*`, `agents.workspace.*`, `sandbox.*`, `dataHandling.memory.*`, và `execApprovals.*`. Ingress theo phạm vi kênh dùng `channelIds`, hỗ trợ `ingress.channels.*`. Các phần không được hỗ trợ bị từ chối thay vì bị bỏ qua. Nếu một mục `agentIds` không có trong `agents.list[]`, OpenClaw đánh giá quy tắc có phạm vi dựa trên trạng thái toàn cục/mặc định được kế thừa cho id agent runtime đó.

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

Cùng một agent có thể xuất hiện trong nhiều phạm vi khi mỗi phạm vi quản trị các trường khác nhau, như minh họa ở trên. Một trường có phạm vi lặp lại cho cùng agent phải nghiêm ngặt tương đương hoặc hơn theo siêu dữ liệu chính sách; các khẳng định trùng lặp yếu hơn sẽ bị từ chối. Siêu dữ liệu độ nghiêm ngặt coi danh sách cho phép là tập con, danh sách từ chối là tập cha, và boolean bắt buộc là yêu cầu cố định.

Chính sách trạng thái container chỉ được đánh giá dựa trên bằng chứng OpenClaw có thể quan sát cho agent khớp. Nếu một quy tắc `sandbox.containers.*` đã bật áp dụng cho agent có backend sandbox không thể phơi bày trường đó, chính sách báo cáo `policy/sandbox-container-posture-unobservable` thay vì coi khẳng định là đạt. Dùng các phạm vi `agentIds` riêng cho các nhóm agent dùng backend sandbox khác nhau, và để các quy tắc container không được hỗ trợ ở trạng thái chưa đặt hoặc false cho các nhóm mà những trường đó không thể được quan sát.

`ingress.session.requireDmScope` cấp cao nhất vẫn là toàn cục vì `session.dmScope` không phải là bằng chứng có thể gán cho kênh.

| Bộ chọn      | Phần được hỗ trợ                                                                | Dùng khi                                                    |
| ------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, và `execApprovals` | Một hoặc nhiều tác nhân runtime cần quy tắc nghiêm ngặt hơn. |
| `channelIds` | `ingress.channels`                                                                 | Một hoặc nhiều kênh cần quy tắc ingress nghiêm ngặt hơn. |

Mọi phạm vi có trong `policy.jsonc` đều phải hợp lệ và có thể thực thi.

#### Kênh

| Trường chính sách                    | Trạng thái quan sát được                  | Dùng khi                                                     |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | Nhà cung cấp `channels.*` và trạng thái bật | Từ chối các kênh đã cấu hình từ một nhà cung cấp như `telegram`. |
| `channels.denyRules[].reason`        | Thông báo phát hiện và ngữ cảnh gợi ý sửa chữa | Giải thích lý do nhà cung cấp bị từ chối.                    |

#### Máy chủ MCP

| Trường chính sách    | Trạng thái quan sát được | Dùng khi                                                   |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | id `mcp.servers.*` | Yêu cầu mọi máy chủ MCP đã cấu hình phải nằm trong danh sách cho phép. |
| `mcp.servers.deny`  | id `mcp.servers.*` | Từ chối các id máy chủ MCP đã cấu hình cụ thể.             |

#### Nhà cung cấp mô hình

| Trường chính sách         | Trạng thái quan sát được                              | Dùng khi                                                                        |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | id `models.providers.*` và tham chiếu mô hình đã chọn | Yêu cầu các nhà cung cấp đã cấu hình và tham chiếu mô hình đã chọn dùng nhà cung cấp được phê duyệt. |
| `models.providers.deny`  | id `models.providers.*` và tham chiếu mô hình đã chọn | Từ chối các nhà cung cấp đã cấu hình và tham chiếu mô hình đã chọn theo id nhà cung cấp. |

#### Mạng

| Trường chính sách              | Trạng thái quan sát được         | Dùng khi                                                           |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | Lối thoát SSRF mạng riêng | Đặt thành `false` để yêu cầu quyền truy cập mạng riêng luôn bị tắt. |

#### Truy nhập ingress và kênh

| Trường chính sách                         | Trạng thái quan sát được                                         | Dùng khi                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | Yêu cầu phạm vi cô lập tin nhắn trực tiếp đã được rà soát.         |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` và các trường chính sách DM kênh cũ      | Chỉ cho phép các chính sách kênh tin nhắn trực tiếp đã được rà soát. |
| `ingress.channels.denyOpenGroups`         | Chính sách ingress kênh, tài khoản và nhóm                     | Từ chối ingress nhóm mở cho các kênh và tài khoản đã cấu hình.     |
| `ingress.channels.requireMentionInGroups` | Cấu hình cổng mention cho kênh, tài khoản, nhóm, guild và lồng nhau | Yêu cầu cổng mention khi ingress nhóm đang mở hoặc được kiểm soát bằng mention. |

#### Gateway

| Trường chính sách                       | Trạng thái quan sát được                    | Dùng khi                                                     |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | Đặt thành `false` để yêu cầu Gateway liên kết loopback.      |
| `gateway.exposure.allowTailscaleFunnel` | Tư thế Tailscale serve/funnel của Gateway      | Đặt thành `false` để từ chối phơi bày Tailscale Funnel.      |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | Đặt thành `true` để từ chối xác thực Gateway bị tắt.         |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | Đặt thành `true` để yêu cầu cấu hình giới hạn tốc độ xác thực tường minh. |
| `gateway.controlUi.allowInsecure`       | Các công tắc xác thực/thiết bị/nguồn gốc không an toàn của Giao diện điều khiển | Đặt thành `false` để từ chối các công tắc phơi bày Giao diện điều khiển không an toàn. |
| `gateway.remote.allow`                  | Chế độ/cấu hình Gateway từ xa                  | Đặt thành `false` để từ chối chế độ Gateway từ xa.           |
| `gateway.http.denyEndpoints`            | Endpoint API HTTP của Gateway                  | Từ chối các id endpoint như `chatCompletions` hoặc `responses`. |
| `gateway.http.requireUrlAllowlists`     | Đầu vào tìm nạp URL qua HTTP của Gateway       | Đặt thành `true` để yêu cầu danh sách cho phép URL trên đầu vào tìm nạp URL. |

#### Không gian làm việc của tác nhân

| Trường chính sách                | Trạng thái quan sát được                                                            | Dùng khi                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` và `agents.list[].sandbox.workspaceAccess` | Chỉ cho phép các giá trị truy cập không gian làm việc sandbox như `none` hoặc `ro`.                                 |
| `agents.workspace.denyTools`     | Cấu hình từ chối công cụ toàn cục và theo từng tác nhân                              | Yêu cầu các công cụ sửa đổi không gian làm việc/runtime như `exec`, `process`, `write`, `edit`, hoặc `apply_patch` bị từ chối. |

#### Tư thế sandbox

| Trường chính sách                                   | Trạng thái quan sát được                                 | Dùng khi                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` và chế độ theo từng tác nhân | Chỉ cho phép các chế độ sandbox đã được rà soát như `all` hoặc `non-main`. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` và backend theo từng tác nhân | Chỉ cho phép các backend sandbox đã được rà soát như `docker`. |
| `sandbox.containers.denyHostNetwork`                  | Chế độ mạng sandbox/trình duyệt dựa trên container      | Từ chối chế độ mạng máy chủ.                                   |
| `sandbox.containers.denyContainerNamespaceJoin`       | Chế độ mạng sandbox/trình duyệt dựa trên container      | Từ chối tham gia namespace mạng của container khác.            |
| `sandbox.containers.requireReadOnlyMounts`            | Chế độ mount sandbox/trình duyệt dựa trên container     | Yêu cầu các mount ở chế độ chỉ đọc.                            |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Mục tiêu mount sandbox/trình duyệt dựa trên container   | Từ chối mount socket runtime container.                        |
| `sandbox.containers.denyUnconfinedProfiles`           | Tư thế hồ sơ bảo mật container                          | Từ chối các hồ sơ bảo mật container không giới hạn.            |
| `sandbox.browser.requireCdpSourceRange`               | Phạm vi nguồn CDP của trình duyệt sandbox               | Yêu cầu phơi bày CDP của trình duyệt khai báo phạm vi nguồn.   |

Chính sách xem `sandbox.mode` bị thiếu là mặc định ngầm định `off`, vì vậy
`sandbox.requireMode` báo cáo một sandbox mới hoặc chưa được cấu hình là nằm ngoài
danh sách cho phép như `["all"]`.

#### Xử lý dữ liệu

| Trường chính sách                                   | Trạng thái quan sát được                                                          | Dùng khi                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | Đặt thành `true` để từ chối `logging.redactSensitive: "off"`.          |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | Đặt thành `true` để từ chối thu thập nội dung telemetry.               |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | Đặt thành `true` để yêu cầu chế độ bảo trì phiên hiệu lực là `enforce`. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` và `agents.*.memorySearch.experimental.sessionMemory` | Đặt thành `true` để từ chối lập chỉ mục bản ghi phiên vào bộ nhớ.      |

#### Bí mật

| Trường chính sách                 | Trạng thái quan sát được                                      | Dùng khi                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | SecretRefs trong cấu hình và khai báo `secrets.providers.*` | Đặt thành `true` để yêu cầu SecretRefs trỏ đến các nhà cung cấp đã khai báo. |
| `secrets.denySources`             | Nguồn nhà cung cấp bí mật và nguồn SecretRef             | Từ chối các nguồn như `exec`, `file`, hoặc tên nguồn đã cấu hình khác. |
| `secrets.allowInsecureProviders`  | Cờ tư thế nhà cung cấp bí mật không an toàn              | Đặt thành `false` để từ chối các nhà cung cấp chọn tham gia tư thế không an toàn. |

#### Phê duyệt exec

Chính sách phê duyệt exec quan sát artifact `exec-approvals.json` của runtime đang hoạt động.
Theo mặc định, đây là `~/.openclaw/exec-approvals.json`; khi
`OPENCLAW_STATE_DIR` được đặt, Chính sách đọc
`$OPENCLAW_STATE_DIR/exec-approvals.json`. Các quy tắc tư thế thực tế như
`execApprovals.defaults.*` hoặc `execApprovals.agents.*` yêu cầu bằng chứng artifact
có thể đọc được; artifact bị thiếu hoặc không hợp lệ được báo cáo là bằng chứng
không quan sát được thay vì trở thành một lần đạt theo kiểu nỗ lực tối đa so với
các mặc định runtime tổng hợp. Khi artifact có thể đọc được, các trường phê duyệt
bị bỏ qua kế thừa mặc định runtime: `defaults.security` bị thiếu là `full`, và
bảo mật tác nhân bị thiếu kế thừa mặc định đó. Bằng chứng bao gồm `defaults`,
`agents.*`, và `agents.*.allowlist[].pattern` cùng với `argPattern` tùy chọn,
tư thế `autoAllowSkills` hiệu lực và nguồn mục nhập. Bằng chứng không bao gồm
đường dẫn/token socket, `commandText`, `lastUsedCommand`, đường dẫn đã phân giải,
hoặc dấu thời gian.

| Trường chính sách                         | Trạng thái quan sát được                                                           | Dùng khi                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | Đường dẫn `exec-approvals.json` của runtime đang hoạt động                                              | Đặt thành `true` để yêu cầu hiện vật phê duyệt tồn tại và phân tích được.                     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`, mặc định là `full`                                              | Chỉ cho phép các chế độ bảo mật phê duyệt mặc định đã được chấp thuận.                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`, kế thừa giá trị mặc định                                               | Chỉ cho phép các chế độ bảo mật phê duyệt hiệu dụng theo từng agent đã được chấp thuận.                        |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` và `agents.*.autoAllowSkills`, kế thừa giá trị mặc định của runtime | Đặt thành `false` để yêu cầu danh sách cho phép thủ công nghiêm ngặt mà không có phê duyệt CLI Skills ngầm định. |
| `execApprovals.agents.allowlist.expected`   | Tổng hợp mẫu `agents.*.allowlist[]` và các mục argPattern tùy chọn               | Yêu cầu danh sách cho phép phê duyệt khớp với tập mẫu đã được rà soát.                      |

Ví dụ: yêu cầu hiện vật phê duyệt, từ chối các giá trị mặc định dễ dãi, và
chỉ cho phép trạng thái phê duyệt exec đã được rà soát cho các agent được chọn:

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Security modes: "deny", "allowlist", or "full".
      // This default permits only the locked-down deny posture.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Selected agents may use reviewed allowlist posture, but not "full".
          "allowSecurity": ["allowlist"],
          // false means skill CLIs must appear in the reviewed allowlist instead of
          // being implicitly approved by autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Simple entry: exact reviewed executable pattern with no argPattern.
              "travel-hub",
              // Constrained entry: pattern plus reviewed argument regex.
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

| Trường chính sách                    | Trạng thái quan sát được                               | Dùng khi                                                                                   |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | Metadata nhà cung cấp và chế độ `auth.profiles.*` | Yêu cầu các khóa metadata như `provider` và `mode` trên hồ sơ xác thực cấu hình.               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | Chỉ cho phép các chế độ hồ sơ xác thực được hỗ trợ như `api_key`, `aws-sdk`, `oauth`, hoặc `token`. |

#### Metadata công cụ

| Trường chính sách            | Trạng thái quan sát được                   | Dùng khi                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | Khai báo `TOOLS.md` được quản trị | Yêu cầu các công cụ được quản trị khai báo các khóa metadata như `risk`, `sensitivity`, hoặc `owner`. |

#### Trạng thái công cụ

| Trường chính sách                    | Trạng thái quan sát được                                              | Dùng khi                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` và `agents.list[].tools.profile`           | Chỉ cho phép các id hồ sơ công cụ như `minimal`, `messaging`, hoặc `coding`.                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` và ghi đè `tools.fs` theo từng agent | Đặt thành `true` để yêu cầu trạng thái công cụ hệ thống tệp chỉ trong workspace.                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` và bảo mật exec theo từng agent           | Chỉ cho phép các chế độ bảo mật exec như `deny` hoặc `allowlist`.                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` và chế độ hỏi exec theo từng agent                | Yêu cầu trạng thái phê duyệt như `always`.                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` và định tuyến máy chủ exec theo từng agent           | Chỉ cho phép các chế độ định tuyến máy chủ exec như `sandbox`.                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` và trạng thái nâng quyền theo từng agent     | Đặt thành `false` để yêu cầu chế độ công cụ nâng quyền luôn tắt.                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` và `tools.alsoAllow` theo từng agent           | Yêu cầu các mục `alsoAllow` chính xác và báo cáo các quyền công cụ bổ sung bị thiếu hoặc không mong muốn.                 |
| `tools.denyTools`               | `tools.deny` và `agents.list[].tools.deny`                 | Yêu cầu các danh sách từ chối công cụ đã cấu hình bao gồm id hoặc nhóm công cụ như `group:runtime` và `group:fs`. |

Chạy các kiểm tra chỉ chính sách trong khi biên soạn:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` chỉ chạy tập kiểm tra chính sách và phát ra bằng chứng, phát hiện, và
hash chứng thực. Các phát hiện tương tự cũng xuất hiện trong `openclaw doctor --lint`
khi Plugin Policy được bật.

So sánh tệp chính sách của operator với tệp chính sách đường cơ sở đã biên soạn:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` so sánh cú pháp tệp chính sách với cú pháp tệp chính sách. Nó không
kiểm tra trạng thái runtime OpenClaw, bằng chứng, thông tin xác thực, hoặc bí mật. Lệnh
sử dụng cùng metadata quy tắc chính sách quản trị các lớp phủ theo phạm vi: danh sách cho phép phải
giữ nguyên hoặc hẹp hơn, danh sách từ chối phải giữ nguyên hoặc rộng hơn, boolean bắt buộc
phải giữ giá trị bắt buộc của chúng, chuỗi có thứ tự chỉ được di chuyển về đầu
hạn chế hơn trong thứ tự đã cấu hình, và danh sách chính xác phải khớp.

Tệp đường cơ sở có thể là chính sách do tổ chức biên soạn. Chính sách được kiểm tra có thể
dùng các giá trị nghiêm ngặt hơn hoặc thêm quy tắc chính sách bổ sung. Một quy tắc được kiểm tra ở cấp cao nhất cũng có thể
thỏa mãn quy tắc đường cơ sở theo phạm vi khi nó nghiêm ngặt bằng hoặc hơn vì
chính sách cấp cao nhất áp dụng rộng rãi. Tên phạm vi không cần khớp; so sánh
theo phạm vi được khóa theo giá trị bộ chọn như `agentIds` hoặc `channelIds` và theo
trường chính sách đang được kiểm tra.

Ví dụ đầu ra JSON so sánh sạch chỉ báo cáo trạng thái so sánh tệp chính sách:

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Ví dụ đầu ra sạch của `policy check --json` bao gồm các hash ổn định có thể được
operator hoặc supervisor ghi lại:

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

Cấu hình chính sách nằm dưới `plugins.entries.policy.config`.

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

| Cài đặt                   | Mục đích                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | Bật kiểm tra chính sách ngay cả trước khi `policy.jsonc` tồn tại.         |
| `workspaceRepairs`        | Cho phép `doctor --fix` chỉnh sửa các cài đặt workspace do chính sách quản lý. |
| `expectedHash`            | Khóa hash tùy chọn cho hiện vật chính sách đã được phê duyệt.            |
| `expectedAttestationHash` | Khóa hash tùy chọn cho lần kiểm tra chính sách sạch được chấp nhận gần nhất.    |
| `path`                    | Vị trí của hiện vật chính sách tương đối với workspace.             |

Đặt `plugins.entries.policy.config.enabled` thành `false` để tắt kiểm tra chính sách
cho một workspace trong khi vẫn giữ Plugin đã cài đặt.

Yêu cầu metadata công cụ được biên soạn trong `policy.jsonc` với
`tools.requireMetadata`, ví dụ `["risk", "sensitivity", "owner"]`.

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
        "ref": "openai/gpt-5.5",
        "provider": "openai",
        "model": "gpt-5.5",
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

Hàm băm chính sách xác định tạo tác quy tắc đã được soạn thảo. Khối bằng chứng
ghi lại trạng thái OpenClaw đã quan sát được dùng bởi các bước kiểm tra chính sách. Giá trị
`workspace.hash` xác định tải dữ liệu bằng chứng đó cho phạm vi được kiểm tra.
Hàm băm phát hiện xác định chính xác tập phát hiện mà bước kiểm tra trả về.
`checkedAt` ghi lại thời điểm quá trình đánh giá đã chạy. Hàm băm chứng thực xác định
tuyên bố ổn định: hàm băm chính sách, hàm băm bằng chứng, hàm băm phát hiện và liệu
kết quả có sạch hay không. Nó cố ý không bao gồm `checkedAt`, để cùng một
trạng thái chính sách tạo ra cùng một chứng thực qua các lần kiểm tra lặp lại. Kết hợp lại,
chúng tạo thành bộ giá trị kiểm toán cho bước kiểm tra chính sách này.

Nếu một Gateway hoặc bộ giám sát sau này dùng chính sách để chặn, phê duyệt hoặc chú thích một
hành động lúc chạy, nó nên ghi lại hàm băm chứng thực từ lần kiểm tra chính sách sạch gần nhất.
`checkedAt` vẫn nằm trong đầu ra JSON cho nhật ký kiểm toán, nhưng không phải là một phần của
hàm băm chứng thực ổn định.

Dùng vòng đời này khi chấp nhận trạng thái chính sách:

1. Soạn thảo hoặc xem xét `policy.jsonc`.
2. Chạy `openclaw policy check --json`.
3. Nếu kết quả sạch, ghi lại `attestation.policy.hash` làm `expectedHash`.
4. Ghi lại `attestation.attestationHash` làm `expectedAttestationHash`.
5. Chạy lại `openclaw doctor --lint` trong CI hoặc các cổng phát hành.

Nếu các quy tắc chính sách thay đổi có chủ ý, hãy cập nhật cả hai hàm băm được chấp nhận từ một
lần kiểm tra sạch. Nếu thiết lập không gian làm việc thay đổi có chủ ý nhưng chính sách vẫn giữ nguyên,
thường chỉ `expectedAttestationHash` thay đổi.

Bật hoặc nâng cấp các quy tắc `agents.workspace` sẽ thêm bằng chứng `agentWorkspace` vào
hàm băm không gian làm việc và hàm băm chứng thực. Người vận hành nên xem xét bằng chứng mới
và làm mới các hàm băm chứng thực đã chấp nhận sau khi bật các quy tắc này.
Bật hoặc nâng cấp các quy tắc trạng thái công cụ sẽ thêm bằng chứng `toolPosture` theo
cùng cách.

`openclaw policy watch` chạy lặp lại cùng một bước kiểm tra và báo cáo khi
bằng chứng hiện tại không còn khớp với `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

Dùng `--once` trong CI hoặc các script chỉ cần một lần đánh giá độ lệch. Khi không có
`--once`, lệnh thăm dò mặc định hai giây một lần; dùng `--interval-ms` để
chọn một khoảng thời gian khác.

## Phát hiện

Chính sách hiện xác minh:

| Check id                                                 | Phát hiện                                                                          |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | Chính sách được bật nhưng thiếu `policy.jsonc`.                                   |
| `policy/policy-jsonc-invalid`                            | Không thể phân tích chính sách hoặc chính sách chứa các mục quy tắc sai định dạng. |
| `policy/policy-hash-mismatch`                            | Chính sách không khớp với `expectedHash` đã cấu hình.                             |
| `policy/attestation-hash-mismatch`                       | Bằng chứng chính sách hiện tại không còn khớp với chứng thực đã chấp nhận.         |
| `policy/policy-conformance-invalid`                      | Tệp chính sách nền tảng hoặc tệp chính sách được kiểm tra có cú pháp so sánh không hợp lệ. |
| `policy/policy-conformance-missing`                      | Tệp chính sách được kiểm tra thiếu một quy tắc do tệp chính sách nền tảng yêu cầu. |
| `policy/policy-conformance-weaker`                       | Tệp chính sách được kiểm tra có giá trị yếu hơn tệp chính sách nền tảng.           |
| `policy/channels-denied-provider`                        | Một kênh đã bật khớp với quy tắc từ chối kênh.                                    |
| `policy/mcp-denied-server`                               | Một máy chủ MCP đã cấu hình bị chính sách từ chối.                                |
| `policy/mcp-unapproved-server`                           | Một máy chủ MCP đã cấu hình nằm ngoài danh sách cho phép.                         |
| `policy/models-denied-provider`                          | Một nhà cung cấp mô hình hoặc tham chiếu mô hình đã cấu hình dùng nhà cung cấp bị từ chối. |
| `policy/models-unapproved-provider`                      | Một nhà cung cấp mô hình hoặc tham chiếu mô hình đã cấu hình nằm ngoài danh sách cho phép. |
| `policy/network-private-access-enabled`                  | Cửa thoát SSRF mạng riêng được bật trong khi chính sách từ chối nó.               |
| `policy/ingress-dm-policy-unapproved`                    | Chính sách DM của kênh nằm ngoài danh sách cho phép của chính sách.               |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` không khớp với phạm vi cô lập DM mà chính sách yêu cầu.         |
| `policy/ingress-open-groups-denied`                      | Chính sách nhóm của kênh là `open` trong khi chính sách từ chối ingress nhóm mở.  |
| `policy/ingress-group-mention-required`                  | Một mục kênh hoặc nhóm tắt cổng nhắc đến trong khi chính sách yêu cầu chúng.      |
| `policy/gateway-non-loopback-bind`                       | Tư thế liên kết Gateway cho phép phơi bày không phải loopback khi chính sách từ chối nó. |
| `policy/gateway-auth-disabled`                           | Xác thực Gateway bị tắt khi chính sách yêu cầu xác thực.                          |
| `policy/gateway-rate-limit-missing`                      | Tư thế giới hạn tốc độ xác thực Gateway không được nêu rõ khi chính sách yêu cầu. |
| `policy/gateway-control-ui-insecure`                     | Các công tắc phơi bày không an toàn của Gateway Control UI được bật.              |
| `policy/gateway-tailscale-funnel`                        | Phơi bày Gateway Tailscale Funnel được bật khi chính sách từ chối nó.             |
| `policy/gateway-remote-enabled`                          | Chế độ từ xa của Gateway đang hoạt động khi chính sách từ chối nó.                |
| `policy/gateway-http-endpoint-enabled`                   | Một điểm cuối API HTTP của Gateway được bật dù bị chính sách từ chối.             |
| `policy/gateway-http-url-fetch-unrestricted`             | Đầu vào tìm nạp URL HTTP của Gateway thiếu danh sách URL cho phép bắt buộc.       |
| `policy/agents-workspace-access-denied`                  | Chế độ sandbox của tác nhân hoặc quyền truy cập workspace nằm ngoài danh sách cho phép của chính sách. |
| `policy/agents-tool-not-denied`                          | Một tác nhân hoặc cấu hình mặc định không từ chối một công cụ mà chính sách yêu cầu. |
| `policy/tools-profile-unapproved`                        | Hồ sơ công cụ toàn cục hoặc theo tác nhân đã cấu hình nằm ngoài danh sách cho phép. |
| `policy/tools-fs-workspace-only-required`                | Công cụ hệ thống tệp không được cấu hình với tư thế đường dẫn chỉ trong workspace. |
| `policy/tools-exec-security-unapproved`                  | Chế độ bảo mật exec nằm ngoài danh sách cho phép của chính sách.                  |
| `policy/tools-exec-ask-unapproved`                       | Chế độ hỏi exec nằm ngoài danh sách cho phép của chính sách.                      |
| `policy/tools-exec-host-unapproved`                      | Định tuyến máy chủ exec nằm ngoài danh sách cho phép của chính sách.              |
| `policy/tools-elevated-enabled`                          | Chế độ công cụ nâng quyền được bật khi chính sách từ chối nó.                     |
| `policy/tools-also-allow-missing`                        | Danh sách `alsoAllow` đã cấu hình thiếu một mục mà chính sách yêu cầu.            |
| `policy/tools-also-allow-unexpected`                     | Danh sách `alsoAllow` đã cấu hình bao gồm một mục không được chính sách mong đợi. |
| `policy/tools-required-deny-missing`                     | Danh sách từ chối công cụ toàn cục hoặc theo tác nhân không bao gồm một công cụ bị từ chối bắt buộc. |
| `policy/sandbox-mode-unapproved`                         | Chế độ sandbox nằm ngoài danh sách cho phép của chính sách.                       |
| `policy/sandbox-backend-unapproved`                      | Backend sandbox nằm ngoài danh sách cho phép của chính sách.                      |
| `policy/sandbox-container-posture-unobservable`          | Quy tắc tư thế container được bật cho một backend không thể quan sát nó.          |
| `policy/sandbox-container-host-network-denied`           | Sandbox hoặc trình duyệt dựa trên container dùng chế độ mạng máy chủ.             |
| `policy/sandbox-container-namespace-join-denied`         | Sandbox hoặc trình duyệt dựa trên container tham gia namespace của container khác. |
| `policy/sandbox-container-mount-mode-required`           | Mount của sandbox hoặc trình duyệt dựa trên container không ở chế độ chỉ đọc.     |
| `policy/sandbox-container-runtime-socket-mount`          | Mount của sandbox hoặc trình duyệt dựa trên container phơi bày socket runtime container. |
| `policy/sandbox-container-unconfined-profile`            | Hồ sơ sandbox container không bị giới hạn khi chính sách từ chối điều đó.         |
| `policy/sandbox-browser-cdp-source-range-missing`        | Dải nguồn CDP của trình duyệt sandbox bị thiếu khi chính sách yêu cầu một dải.    |
| `policy/data-handling-redaction-disabled`                | Việc biên tập nhật ký nhạy cảm bị tắt khi chính sách yêu cầu.                     |
| `policy/data-handling-telemetry-content-capture`         | Ghi lại nội dung telemetry được bật khi chính sách từ chối nó.                    |
| `policy/data-handling-session-retention-not-enforced`    | Bảo trì lưu giữ phiên không được thực thi khi chính sách yêu cầu.                 |
| `policy/data-handling-session-transcript-memory-enabled` | Lập chỉ mục bộ nhớ bản ghi phiên được bật khi chính sách từ chối nó.              |
| `policy/secrets-unmanaged-provider`                      | Một SecretRef cấu hình tham chiếu đến nhà cung cấp không được khai báo trong `secrets.providers`. |
| `policy/secrets-denied-provider-source`                  | Một nhà cung cấp bí mật cấu hình hoặc SecretRef dùng nguồn bị chính sách từ chối. |
| `policy/secrets-insecure-provider`                       | Một nhà cung cấp bí mật chọn tư thế không an toàn khi chính sách từ chối nó.      |
| `policy/auth-profile-invalid-metadata`                   | Hồ sơ xác thực cấu hình thiếu metadata nhà cung cấp hoặc chế độ hợp lệ.           |
| `policy/auth-profile-unapproved-mode`                    | Chế độ hồ sơ xác thực cấu hình nằm ngoài danh sách cho phép của chính sách.       |
| `policy/exec-approvals-missing`                          | Chính sách yêu cầu `exec-approvals.json`, nhưng thiếu artifact.                   |
| `policy/exec-approvals-invalid`                          | Không thể phân tích artifact phê duyệt exec đã cấu hình.                          |
| `policy/exec-approvals-default-security-unapproved`      | Mặc định phê duyệt exec dùng chế độ bảo mật nằm ngoài danh sách cho phép của chính sách. |
| `policy/exec-approvals-agent-security-unapproved`        | Chế độ bảo mật phê duyệt exec hiệu lực theo tác nhân nằm ngoài danh sách cho phép. |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Một tác nhân phê duyệt exec ngầm tự động cho phép CLI của Skills khi chính sách từ chối điều đó. |
| `policy/exec-approvals-allowlist-missing`                | Danh sách cho phép phê duyệt thiếu một mẫu mà chính sách yêu cầu.                 |
| `policy/exec-approvals-allowlist-unexpected`             | Danh sách cho phép phê duyệt bao gồm một mẫu không được chính sách mong đợi.      |
| `policy/tools-missing-risk-level`                        | Khai báo công cụ được quản trị thiếu metadata rủi ro.                             |
| `policy/tools-unknown-risk-level`                        | Khai báo công cụ được quản trị dùng giá trị rủi ro không xác định.                |
| `policy/tools-missing-sensitivity-token`                 | Khai báo công cụ được quản trị thiếu metadata độ nhạy.                            |
| `policy/tools-missing-owner`                             | Khai báo công cụ được quản trị thiếu metadata chủ sở hữu.                         |
| `policy/tools-unknown-sensitivity-token`                 | Khai báo công cụ được quản trị dùng giá trị độ nhạy không xác định.               |

Các phát hiện chính sách có thể bao gồm cả `target` và `requirement`. `target` là
đối tượng workspace được quan sát nhưng không tuân thủ. `requirement` là quy tắc
chính sách đã được soạn khiến nó trở thành một phát hiện. Cả hai giá trị hiện là địa chỉ, thường là
đường dẫn `oc://`, nhưng tên trường mô tả vai trò chính sách của chúng thay vì
định dạng địa chỉ.

Ví dụ phát hiện JSON:

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

Ví dụ phát hiện công cụ:

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

Ví dụ phát hiện MCP:

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "MCP server 'remote' is not in the policy allowlist.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

Ví dụ phát hiện nhà cung cấp mô hình:

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "Model ref 'anthropic/claude-sonnet-4.7' uses unapproved provider 'anthropic'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

Ví dụ phát hiện mạng:

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "Network setting 'browser-private-network' allows private-network access.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

Ví dụ về phát hiện phơi lộ Gateway:

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Gateway bind setting 'gateway-bind' permits non-loopback exposure.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

Ví dụ về phát hiện không gian làm việc của tác tử:

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "agents.defaults sandbox workspaceAccess 'rw' is not allowed by policy.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## Sửa chữa

`doctor --lint` và `policy check` là chỉ đọc.

`doctor --fix` chỉ chỉnh sửa các thiết lập không gian làm việc do chính sách quản lý khi
`workspaceRepairs` được bật rõ ràng. Nếu không có lựa chọn bật đó, các bước kiểm tra chính sách
sẽ báo cáo những gì chúng sẽ sửa chữa và giữ nguyên các thiết lập.

Trong phiên bản này, sửa chữa có thể tắt các kênh đang được bật trong cấu hình OpenClaw
nhưng bị `channels.denyRules` từ chối. Chỉ bật `workspaceRepairs` sau khi
tệp chính sách đã được xem xét, vì một quy tắc từ chối hợp lệ có thể tắt một
kênh đã cấu hình:

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

| Lệnh             | `0`                                                    | `1`                                                                        | `2`                                |
| ---------------- | ------------------------------------------------------ | -------------------------------------------------------------------------- | ---------------------------------- |
| `policy check`   | Không có phát hiện nào ở ngưỡng.                       | Một hoặc nhiều phát hiện đã đạt ngưỡng.                                    | Lỗi đối số hoặc lỗi thời gian chạy. |
| `policy compare` | Tệp chính sách ít nhất cũng nghiêm ngặt như baseline.  | Tệp chính sách không hợp lệ, bị thiếu hoặc yếu hơn các quy tắc baseline.   | Lỗi đối số hoặc lỗi thời gian chạy. |
| `policy watch`   | Không có phát hiện nào và hàm băm đã chấp nhận là mới. | Có phát hiện hoặc chứng thực đã chấp nhận đã cũ.                           | Lỗi đối số hoặc lỗi thời gian chạy. |

## Liên quan

- [Chế độ lint của Doctor](/vi/cli/doctor#lint-mode)
- [Path CLI](/vi/cli/path)
