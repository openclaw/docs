---
read_when:
    - Bạn muốn hiểu OAuth của OpenClaw từ đầu đến cuối
    - Bạn gặp sự cố vô hiệu hóa mã thông báo / đăng xuất
    - Bạn muốn các luồng xác thực Claude CLI hoặc OAuth
    - Bạn muốn sử dụng nhiều tài khoản hoặc định tuyến theo hồ sơ
summary: 'OAuth trong OpenClaw: trao đổi token, lưu trữ và các mẫu đa tài khoản'
title: OAuth
x-i18n:
    generated_at: "2026-05-11T20:28:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2a7382fbcbe7e6034057da66a2dd8685df6d9345c36eeb8261eb12440d00a402
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw hỗ trợ "xác thực bằng gói thuê bao" qua OAuth cho các nhà cung cấp có cung cấp tùy chọn này
(đáng chú ý là **OpenAI Codex (ChatGPT OAuth)**). Với Anthropic, cách phân tách thực tế
hiện là:

- **Khóa API Anthropic**: tính phí API Anthropic thông thường
- **Anthropic Claude CLI / xác thực bằng gói thuê bao bên trong OpenClaw**: nhân viên Anthropic
  đã cho chúng tôi biết rằng việc sử dụng này lại được cho phép

OpenAI Codex OAuth được hỗ trợ rõ ràng để sử dụng trong các công cụ bên ngoài như
OpenClaw. Trang này giải thích:

Với Anthropic trong môi trường production, xác thực bằng khóa API là cách được khuyến nghị an toàn hơn.

- cách hoạt động của **trao đổi token** OAuth (PKCE)
- nơi **lưu trữ** token (và lý do)
- cách xử lý **nhiều tài khoản** (hồ sơ + ghi đè theo từng phiên)

OpenClaw cũng hỗ trợ **provider plugins** có các luồng OAuth hoặc API-key
riêng. Chạy chúng bằng:

```bash
openclaw models auth login --provider <id>
```

## Nơi gom token (lý do tồn tại)

Các nhà cung cấp OAuth thường tạo một **refresh token mới** trong các luồng đăng nhập/làm mới. Một số nhà cung cấp (hoặc OAuth client) có thể vô hiệu hóa các refresh token cũ hơn khi một token mới được cấp cho cùng người dùng/ứng dụng.

Triệu chứng thực tế:

- bạn đăng nhập qua OpenClaw _và_ qua Claude Code / Codex CLI → một trong hai ngẫu nhiên bị "đăng xuất" về sau

Để giảm tình trạng đó, OpenClaw xem `auth-profiles.json` là một **nơi gom token**:

- runtime đọc thông tin xác thực từ **một nơi**
- chúng ta có thể giữ nhiều hồ sơ và định tuyến chúng một cách xác định
- việc tái sử dụng CLI bên ngoài là riêng theo nhà cung cấp: Codex CLI có thể khởi tạo một hồ sơ
  `openai-codex:default` trống, nhưng một khi OpenClaw có hồ sơ OAuth cục bộ,
  refresh token cục bộ sẽ là nguồn chuẩn; các tích hợp khác có thể vẫn được
  quản lý bên ngoài và đọc lại kho xác thực CLI của chúng
- các đường dẫn trạng thái và khởi động đã biết tập nhà cung cấp được cấu hình sẽ giới hạn phạm vi
  phát hiện CLI bên ngoài vào tập đó, để kho đăng nhập CLI không liên quan không bị
  thăm dò trong thiết lập chỉ có một nhà cung cấp

## Lưu trữ (token nằm ở đâu)

Secret được lưu trong các kho xác thực của agent:

- Hồ sơ xác thực (OAuth + khóa API + refs cấp giá trị tùy chọn): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Tệp tương thích cũ: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (các mục `api_key` tĩnh sẽ được xóa sạch khi được phát hiện)

Tệp chỉ nhập cũ (vẫn được hỗ trợ, nhưng không phải kho chính):

- `~/.openclaw/credentials/oauth.json` (được nhập vào `auth-profiles.json` trong lần sử dụng đầu tiên)

Tất cả các mục trên cũng tôn trọng `$OPENCLAW_STATE_DIR` (ghi đè thư mục trạng thái). Tham chiếu đầy đủ: [/gateway/configuration](/vi/gateway/configuration-reference#auth-storage)

Về static secret refs và hành vi kích hoạt snapshot runtime, xem [Quản lý secret](/vi/gateway/secrets).

Khi một agent phụ không có hồ sơ xác thực cục bộ, OpenClaw sử dụng kế thừa đọc xuyên
từ kho của agent mặc định/chính. Nó không sao chép `auth-profiles.json` của agent chính
khi đọc. OAuth refresh token đặc biệt nhạy cảm: các luồng sao chép thông thường bỏ qua
chúng theo mặc định vì một số nhà cung cấp xoay vòng hoặc vô hiệu hóa refresh token
sau khi sử dụng. Cấu hình một lần đăng nhập OAuth riêng cho agent khi agent đó cần
một tài khoản độc lập.

## Tương thích token cũ của Anthropic

<Warning>
Tài liệu Claude Code công khai của Anthropic nói rằng việc dùng Claude Code trực tiếp vẫn nằm trong
giới hạn gói thuê bao Claude, và nhân viên Anthropic đã cho chúng tôi biết rằng việc sử dụng Claude
CLI kiểu OpenClaw lại được cho phép. Vì vậy OpenClaw xem việc tái sử dụng Claude CLI và
sử dụng `claude -p` là được chấp thuận cho tích hợp này, trừ khi Anthropic
công bố chính sách mới.

Về tài liệu gói direct-Claude-Code hiện tại của Anthropic, xem [Sử dụng Claude Code
với gói Pro hoặc Max của bạn](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
và [Sử dụng Claude Code với gói Team hoặc Enterprise
của bạn](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Nếu bạn muốn các tùy chọn kiểu gói thuê bao khác trong OpenClaw, xem [OpenAI
Codex](/vi/providers/openai), [Qwen Cloud Coding
Plan](/vi/providers/qwen), [MiniMax Coding Plan](/vi/providers/minimax),
và [Z.AI / GLM Coding Plan](/vi/providers/glm).
</Warning>

OpenClaw cũng cung cấp setup-token của Anthropic như một đường dẫn token-auth được hỗ trợ, nhưng hiện ưu tiên tái sử dụng Claude CLI và `claude -p` khi có sẵn.

## Di chuyển Anthropic Claude CLI

OpenClaw lại hỗ trợ tái sử dụng Anthropic Claude CLI. Nếu bạn đã có đăng nhập Claude cục bộ
trên máy chủ, onboarding/configure có thể tái sử dụng trực tiếp.

## Trao đổi OAuth (cách đăng nhập hoạt động)

Các luồng đăng nhập tương tác của OpenClaw được triển khai trong `@earendil-works/pi-ai` và được nối vào các wizard/lệnh.

### Setup-token Anthropic

Hình dạng luồng:

1. bắt đầu setup-token hoặc paste-token Anthropic từ OpenClaw
2. OpenClaw lưu thông tin xác thực Anthropic thu được vào một hồ sơ xác thực
3. lựa chọn model vẫn ở `anthropic/...`
4. các hồ sơ xác thực Anthropic hiện có vẫn sẵn dùng để rollback/kiểm soát thứ tự

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth được hỗ trợ rõ ràng để sử dụng bên ngoài Codex CLI, bao gồm các workflow OpenClaw.

Hình dạng luồng (PKCE):

1. tạo PKCE verifier/challenge + `state` ngẫu nhiên
2. mở `https://auth.openai.com/oauth/authorize?...`
3. cố gắng bắt callback trên `http://127.0.0.1:1455/auth/callback`
4. nếu callback không thể bind (hoặc bạn đang ở môi trường remote/headless), dán redirect URL/code
5. trao đổi tại `https://auth.openai.com/oauth/token`
6. trích xuất `accountId` từ access token và lưu `{ access, refresh, expires, accountId }`

Đường dẫn wizard là `openclaw onboard` → lựa chọn xác thực `openai-codex`.

## Làm mới + hết hạn

Các hồ sơ lưu timestamp `expires`.

Ở runtime:

- nếu `expires` ở tương lai → dùng access token đã lưu
- nếu đã hết hạn → làm mới (dưới file lock) và ghi đè thông tin xác thực đã lưu
- nếu agent phụ đọc một hồ sơ OAuth của main-agent được kế thừa, việc làm mới
  ghi ngược về kho của agent chính thay vì sao chép refresh token vào
  kho của agent phụ
- ngoại lệ: một số thông tin xác thực CLI bên ngoài vẫn được quản lý bên ngoài; OpenClaw
  đọc lại các kho xác thực CLI đó thay vì tiêu thụ các refresh token đã sao chép.
  Việc khởi tạo Codex CLI được cố ý thu hẹp hơn: nó gieo một hồ sơ
  `openai-codex:default` trống, sau đó các lần làm mới do OpenClaw sở hữu giữ hồ sơ
  cục bộ là nguồn chuẩn.

Luồng làm mới là tự động; nhìn chung bạn không cần quản lý token thủ công.

## Nhiều tài khoản (hồ sơ) + định tuyến

Hai mẫu:

### 1) Ưu tiên: agent riêng biệt

Nếu bạn muốn "cá nhân" và "công việc" không bao giờ tương tác, hãy dùng các agent cô lập (phiên + thông tin xác thực + workspace riêng):

```bash
openclaw agents add work
openclaw agents add personal
```

Sau đó cấu hình xác thực theo từng agent (wizard) và định tuyến chat đến đúng agent.

### 2) Nâng cao: nhiều hồ sơ trong một agent

`auth-profiles.json` hỗ trợ nhiều ID hồ sơ cho cùng một nhà cung cấp.

Chọn hồ sơ được dùng:

- toàn cục qua thứ tự cấu hình (`auth.order`)
- theo từng phiên qua `/model ...@<profileId>`

Ví dụ (ghi đè phiên):

- `/model Opus@anthropic:work`

Cách xem những ID hồ sơ nào tồn tại:

- `openclaw channels list --json` (hiển thị `auth[]`)

Tài liệu liên quan:

- [Chuyển đổi dự phòng model](/vi/concepts/model-failover) (quy tắc xoay vòng + cooldown)
- [Lệnh slash](/vi/tools/slash-commands) (bề mặt lệnh)

## Liên quan

- [Xác thực](/vi/gateway/authentication) - tổng quan xác thực nhà cung cấp model
- [Secret](/vi/gateway/secrets) - lưu trữ thông tin xác thực và SecretRef
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#auth-storage) - khóa cấu hình xác thực
