---
read_when:
    - Bạn muốn hiểu OAuth của OpenClaw từ đầu đến cuối
    - Bạn gặp sự cố vô hiệu hóa token / đăng xuất
    - Bạn muốn các luồng xác thực Claude CLI hoặc OAuth
    - Bạn muốn nhiều tài khoản hoặc định tuyến hồ sơ
summary: 'OAuth trong OpenClaw: trao đổi token, lưu trữ và các mẫu đa tài khoản'
title: OAuth
x-i18n:
    generated_at: "2026-06-27T17:24:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4aa48fd468a541ed72935833a3196105798380799fa6135fe1dd9f68838307b6
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw hỗ trợ "xác thực theo gói đăng ký" qua OAuth cho các nhà cung cấp có cung cấp cơ chế này
(đáng chú ý là **OpenAI Codex (ChatGPT OAuth)**). Với Anthropic, cách phân chia thực tế
hiện là:

- **Khóa API Anthropic**: tính phí API Anthropic thông thường
- **Anthropic Claude CLI / xác thực theo gói đăng ký trong OpenClaw**: nhân viên Anthropic
  đã cho chúng tôi biết rằng cách sử dụng này lại được cho phép

OpenAI Codex OAuth được hỗ trợ rõ ràng để sử dụng trong các công cụ bên ngoài như
OpenClaw.

OpenClaw lưu cả xác thực bằng khóa API OpenAI và ChatGPT/Codex OAuth dưới
id nhà cung cấp chính tắc `openai`. Các id hồ sơ `openai-codex:*` cũ và
mục `auth.order.openai-codex` là trạng thái kế thừa được sửa bởi
`openclaw doctor --fix`; hãy dùng id hồ sơ `openai:*` và `auth.order.openai` cho
cấu hình mới.

Với Anthropic trong môi trường sản xuất, xác thực bằng khóa API là đường dẫn được khuyến nghị an toàn hơn.

Trang này giải thích:

- cách hoạt động của **trao đổi token** OAuth (PKCE)
- nơi **lưu trữ** token (và lý do)
- cách xử lý **nhiều tài khoản** (hồ sơ + ghi đè theo phiên)

OpenClaw cũng hỗ trợ **Plugin nhà cung cấp** tự đi kèm các luồng OAuth hoặc khóa API
riêng. Chạy chúng qua:

```bash
openclaw models auth login --provider <id>
```

## Điểm gom token (lý do tồn tại)

Các nhà cung cấp OAuth thường cấp một **refresh token mới** trong các luồng đăng nhập/làm mới. Một số nhà cung cấp (hoặc OAuth client) có thể vô hiệu hóa các refresh token cũ hơn khi token mới được cấp cho cùng một người dùng/ứng dụng.

Triệu chứng thực tế:

- bạn đăng nhập qua OpenClaw _và_ qua Claude Code / Codex CLI → một trong hai sẽ ngẫu nhiên bị "đăng xuất" sau đó

Để giảm tình trạng đó, OpenClaw coi `auth-profiles.json` là một **điểm gom token**:

- runtime đọc thông tin xác thực từ **một nơi**
- chúng tôi có thể giữ nhiều hồ sơ và định tuyến chúng một cách xác định
- việc tái sử dụng CLI bên ngoài phụ thuộc vào từng nhà cung cấp: Codex CLI có thể khởi tạo một hồ sơ
  `openai:default` trống, nhưng một khi OpenClaw có hồ sơ OAuth cục bộ,
  refresh token cục bộ là chính tắc. Nếu refresh token cục bộ đó bị từ chối,
  OpenClaw có thể dùng token Codex CLI khả dụng của cùng tài khoản làm phương án dự phòng
  chỉ trong runtime; các tích hợp khác có thể tiếp tục được quản lý bên ngoài và đọc lại
  kho xác thực CLI của chúng
- các đường dẫn trạng thái và khởi động đã biết tập nhà cung cấp được cấu hình sẽ giới hạn
  việc phát hiện CLI bên ngoài trong tập đó, để kho đăng nhập CLI không liên quan không bị
  dò tìm cho một thiết lập chỉ có một nhà cung cấp

## Lưu trữ (token nằm ở đâu)

Bí mật được lưu trong các kho xác thực của agent:

- Hồ sơ xác thực (OAuth + khóa API + tham chiếu tùy chọn ở cấp giá trị): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Tệp tương thích kế thừa: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (các mục `api_key` tĩnh sẽ bị xóa sạch khi được phát hiện)

Tệp chỉ nhập kế thừa (vẫn được hỗ trợ, nhưng không phải kho chính):

- `~/.openclaw/credentials/oauth.json` (được nhập vào `auth-profiles.json` trong lần sử dụng đầu tiên)

Tất cả các mục trên cũng tôn trọng `$OPENCLAW_STATE_DIR` (ghi đè thư mục trạng thái). Tham chiếu đầy đủ: [/gateway/configuration](/vi/gateway/configuration-reference#auth-storage)

Để biết hành vi kích hoạt tham chiếu bí mật tĩnh và snapshot runtime, xem [Quản lý bí mật](/vi/gateway/secrets).

Khi một agent phụ không có hồ sơ xác thực cục bộ, OpenClaw dùng kế thừa đọc xuyên
từ kho của agent mặc định/chính. Nó không sao chép `auth-profiles.json` của agent chính
khi đọc. OAuth refresh token đặc biệt nhạy cảm: các luồng sao chép thông thường bỏ qua
chúng theo mặc định vì một số nhà cung cấp xoay vòng hoặc vô hiệu hóa refresh token sau
khi sử dụng. Hãy cấu hình đăng nhập OAuth riêng cho một agent khi agent đó cần tài khoản
độc lập.

## Tương thích token kế thừa của Anthropic

<Warning>
Tài liệu Claude Code công khai của Anthropic nói rằng việc dùng Claude Code trực tiếp vẫn nằm trong
giới hạn gói đăng ký Claude, và nhân viên Anthropic đã cho chúng tôi biết rằng cách dùng Claude
CLI kiểu OpenClaw lại được cho phép. Vì vậy, OpenClaw coi việc tái sử dụng Claude CLI và
cách dùng `claude -p` là được chấp thuận cho tích hợp này, trừ khi Anthropic
công bố chính sách mới.

Để xem tài liệu gói direct-Claude-Code hiện tại của Anthropic, xem [Sử dụng Claude Code
với gói Pro hoặc Max của bạn](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
và [Sử dụng Claude Code với gói Team hoặc Enterprise
của bạn](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Nếu bạn muốn các tùy chọn kiểu gói đăng ký khác trong OpenClaw, xem [OpenAI
Codex](/vi/providers/openai), [Qwen Cloud Coding
Plan](/vi/providers/qwen), [MiniMax Coding Plan](/vi/providers/minimax),
và [Z.AI / GLM Coding Plan](/vi/providers/zai).
</Warning>

OpenClaw cũng cung cấp setup-token của Anthropic như một đường dẫn xác thực bằng token được hỗ trợ, nhưng hiện ưu tiên tái sử dụng Claude CLI và `claude -p` khi có sẵn.

## Di chuyển Anthropic Claude CLI

OpenClaw lại hỗ trợ tái sử dụng Anthropic Claude CLI. Nếu bạn đã có đăng nhập Claude cục bộ
trên máy chủ, onboarding/configure có thể tái sử dụng trực tiếp.

## Trao đổi OAuth (cách đăng nhập hoạt động)

Các luồng đăng nhập tương tác của OpenClaw được triển khai trong `openclaw/plugin-sdk/llm` và được nối vào các wizard/lệnh.

### setup-token Anthropic

Hình dạng luồng:

1. bắt đầu setup-token hoặc paste-token Anthropic từ OpenClaw
2. OpenClaw lưu thông tin xác thực Anthropic thu được vào một hồ sơ xác thực
3. lựa chọn mô hình vẫn ở `anthropic/...`
4. các hồ sơ xác thực Anthropic hiện có vẫn khả dụng để kiểm soát rollback/thứ tự

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth được hỗ trợ rõ ràng để sử dụng bên ngoài Codex CLI, bao gồm các workflow OpenClaw.

Lệnh đăng nhập vẫn dùng id nhà cung cấp OpenAI chính tắc:

```bash
openclaw models auth login --provider openai
```

Dùng `--profile-id openai:<name>` cho nhiều tài khoản ChatGPT/Codex OAuth trong
một agent. Không dùng `openai-codex:<name>` cho hồ sơ mới. Doctor di chuyển
tiền tố cũ đó sang id hồ sơ `openai:*` không xung đột; chạy
`openclaw models auth list --provider openai` sau khi sửa trước khi sao chép
id hồ sơ vào `auth.order` hoặc `/model ...@<profileId>`.

Hình dạng luồng (PKCE):

1. tạo PKCE verifier/challenge + `state` ngẫu nhiên
2. mở `https://auth.openai.com/oauth/authorize?...`
3. thử bắt callback trên `http://127.0.0.1:1455/auth/callback`
4. nếu không thể bind callback (hoặc bạn đang ở môi trường từ xa/headless), dán URL/code chuyển hướng
5. trao đổi tại `https://auth.openai.com/oauth/token`
6. trích xuất `accountId` từ access token và lưu `{ access, refresh, expires, accountId }`

Đường dẫn wizard là `openclaw onboard` → lựa chọn xác thực `openai`.

## Làm mới + hết hạn

Hồ sơ lưu dấu thời gian `expires`.

Trong runtime:

- nếu `expires` ở tương lai → dùng access token đã lưu
- nếu đã hết hạn → làm mới (dưới khóa tệp) và ghi đè thông tin xác thực đã lưu
- nếu một agent phụ đọc hồ sơ OAuth kế thừa từ agent chính, thao tác làm mới
  ghi ngược về kho của agent chính thay vì sao chép refresh token vào
  kho của agent phụ
- ngoại lệ: một số thông tin xác thực CLI bên ngoài vẫn được quản lý bên ngoài; OpenClaw
  đọc lại các kho xác thực CLI đó thay vì tiêu tốn refresh token đã sao chép.
  Việc khởi tạo Codex CLI được cố ý thu hẹp hơn: nó tạo một hồ sơ
  `openai:default` trống, sau đó các lần làm mới do OpenClaw sở hữu giữ hồ sơ
  cục bộ là chính tắc. Nếu lần làm mới Codex cục bộ thất bại và Codex CLI có
  token khả dụng cho cùng tài khoản, OpenClaw có thể dùng token đó cho yêu cầu
  runtime hiện tại mà không ghi ngược vào `auth-profiles.json`.

Luồng làm mới là tự động; nhìn chung bạn không cần quản lý token thủ công.

## Nhiều tài khoản (hồ sơ) + định tuyến

Hai mẫu:

### 1) Ưu tiên: agent riêng biệt

Nếu bạn muốn "cá nhân" và "công việc" không bao giờ tương tác, hãy dùng các agent cô lập (phiên + thông tin xác thực + workspace riêng):

```bash
openclaw agents add work
openclaw agents add personal
```

Sau đó cấu hình xác thực theo từng agent (wizard) và định tuyến chat tới đúng agent.

### 2) Nâng cao: nhiều hồ sơ trong một agent

`auth-profiles.json` hỗ trợ nhiều ID hồ sơ cho cùng một nhà cung cấp.

Chọn hồ sơ sẽ được sử dụng:

- toàn cục qua thứ tự cấu hình (`auth.order`)
- theo phiên qua `/model ...@<profileId>`

Ví dụ (ghi đè phiên):

- `/model Opus@anthropic:work`

Cách xem các ID hồ sơ hiện có:

- `openclaw channels list --json` (hiển thị `auth[]`)

Tài liệu liên quan:

- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover) (quy tắc xoay vòng + cooldown)
- [Lệnh slash](/vi/tools/slash-commands) (bề mặt lệnh)

## Liên quan

- [Xác thực](/vi/gateway/authentication) - tổng quan xác thực nhà cung cấp mô hình
- [Bí mật](/vi/gateway/secrets) - lưu trữ thông tin xác thực và SecretRef
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#auth-storage) - khóa cấu hình xác thực
