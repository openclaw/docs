---
read_when:
    - Bạn muốn hiểu OAuth của OpenClaw từ đầu đến cuối
    - Bạn gặp sự cố vô hiệu hóa mã thông báo / đăng xuất
    - Bạn muốn các luồng xác thực bằng Claude CLI hoặc OAuth
    - Bạn muốn nhiều tài khoản hoặc định tuyến hồ sơ
summary: 'OAuth trong OpenClaw: trao đổi mã thông báo, lưu trữ và các mẫu đa tài khoản'
title: OAuth
x-i18n:
    generated_at: "2026-04-29T22:38:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b228c83a79afa4018e9572f790ddfef016a73d2383d2847facdc5bb61ed004
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw hỗ trợ “xác thực bằng gói thuê bao” qua OAuth cho các nhà cung cấp có hỗ trợ
(đáng chú ý là **OpenAI Codex (ChatGPT OAuth)**). Với Anthropic, cách phân tách thực tế
hiện là:

- **Khóa API Anthropic**: tính phí API Anthropic thông thường
- **Anthropic Claude CLI / xác thực bằng gói thuê bao bên trong OpenClaw**: nhân viên Anthropic
  cho chúng tôi biết rằng cách sử dụng này hiện đã được cho phép lại

OpenAI Codex OAuth được hỗ trợ rõ ràng để sử dụng trong các công cụ bên ngoài như
OpenClaw. Trang này giải thích:

Với Anthropic trong môi trường sản xuất, xác thực bằng khóa API là hướng được khuyến nghị an toàn hơn.

- cách hoạt động của **trao đổi token** OAuth (PKCE)
- nơi **lưu trữ** token (và lý do)
- cách xử lý **nhiều tài khoản** (hồ sơ + ghi đè theo từng phiên)

OpenClaw cũng hỗ trợ **Plugin nhà cung cấp** đi kèm luồng OAuth hoặc khóa API
riêng. Chạy chúng bằng:

```bash
openclaw models auth login --provider <id>
```

## Bộ nhận token (vì sao tồn tại)

Các nhà cung cấp OAuth thường phát hành một **refresh token mới** trong các luồng đăng nhập/làm mới. Một số nhà cung cấp (hoặc ứng dụng khách OAuth) có thể vô hiệu hóa các refresh token cũ hơn khi một token mới được phát hành cho cùng một người dùng/ứng dụng.

Triệu chứng thực tế:

- bạn đăng nhập qua OpenClaw _và_ qua Claude Code / Codex CLI → một trong hai công cụ ngẫu nhiên bị “đăng xuất” sau đó

Để giảm tình trạng đó, OpenClaw xem `auth-profiles.json` là một **bộ nhận token**:

- runtime đọc thông tin xác thực từ **một nơi**
- chúng tôi có thể giữ nhiều hồ sơ và định tuyến chúng một cách xác định
- việc tái sử dụng CLI bên ngoài phụ thuộc vào nhà cung cấp: Codex CLI có thể khởi tạo một hồ sơ
  `openai-codex:default` trống, nhưng sau khi OpenClaw có một hồ sơ OAuth cục bộ,
  refresh token cục bộ là nguồn chuẩn; các tích hợp khác có thể tiếp tục được
  quản lý bên ngoài và đọc lại kho xác thực CLI của chúng
- các đường dẫn trạng thái và khởi động đã biết phạm vi tập nhà cung cấp được cấu hình sẽ
  giới hạn việc phát hiện CLI bên ngoài trong tập đó, nên kho đăng nhập CLI không liên quan sẽ không
  bị dò tìm cho thiết lập chỉ có một nhà cung cấp

## Lưu trữ (token nằm ở đâu)

Bí mật được lưu trong kho xác thực của agent:

- Hồ sơ xác thực (OAuth + khóa API + tham chiếu tùy chọn ở cấp giá trị): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Tệp tương thích kế thừa: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (các mục `api_key` tĩnh sẽ bị xóa sạch khi được phát hiện)

Tệp chỉ dùng để nhập kế thừa (vẫn được hỗ trợ, nhưng không phải kho chính):

- `~/.openclaw/credentials/oauth.json` (được nhập vào `auth-profiles.json` trong lần sử dụng đầu tiên)

Tất cả các mục trên cũng tôn trọng `$OPENCLAW_STATE_DIR` (ghi đè thư mục trạng thái). Tài liệu tham chiếu đầy đủ: [/gateway/configuration](/vi/gateway/configuration-reference#auth-storage)

Để biết về tham chiếu bí mật tĩnh và hành vi kích hoạt snapshot runtime, xem [Quản lý bí mật](/vi/gateway/secrets).

Khi một agent phụ không có hồ sơ xác thực cục bộ, OpenClaw dùng cơ chế kế thừa
đọc xuyên qua từ kho của agent mặc định/chính. Nó không sao chép
`auth-profiles.json` của agent chính khi đọc. OAuth refresh token đặc biệt
nhạy cảm: các luồng sao chép thông thường mặc định bỏ qua chúng vì một số nhà cung cấp xoay vòng
hoặc vô hiệu hóa refresh token sau khi sử dụng. Hãy cấu hình một lần đăng nhập OAuth riêng cho một
agent khi agent đó cần một tài khoản độc lập.

## Khả năng tương thích token kế thừa của Anthropic

<Warning>
Tài liệu Claude Code công khai của Anthropic nói rằng việc dùng Claude Code trực tiếp vẫn nằm trong
giới hạn gói thuê bao Claude, và nhân viên Anthropic cho chúng tôi biết rằng cách sử dụng Claude
CLI kiểu OpenClaw đã được cho phép lại. Vì vậy, OpenClaw xem việc tái sử dụng Claude CLI và
sử dụng `claude -p` là được chấp thuận cho tích hợp này, trừ khi Anthropic
công bố chính sách mới.

Để xem tài liệu gói direct-Claude-Code hiện tại của Anthropic, xem [Sử dụng Claude Code
với gói Pro hoặc Max của bạn](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
và [Sử dụng Claude Code với gói Team hoặc Enterprise của bạn](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Nếu bạn muốn các tùy chọn kiểu gói thuê bao khác trong OpenClaw, xem [OpenAI
Codex](/vi/providers/openai), [Qwen Cloud Coding
Plan](/vi/providers/qwen), [MiniMax Coding Plan](/vi/providers/minimax),
và [Z.AI / GLM Coding Plan](/vi/providers/glm).
</Warning>

OpenClaw cũng cung cấp setup-token của Anthropic như một đường dẫn xác thực bằng token được hỗ trợ, nhưng hiện ưu tiên tái sử dụng Claude CLI và `claude -p` khi có sẵn.

## Di chuyển Anthropic Claude CLI

OpenClaw lại hỗ trợ tái sử dụng Anthropic Claude CLI. Nếu bạn đã có đăng nhập
Claude cục bộ trên máy chủ, quá trình onboarding/cấu hình có thể tái sử dụng trực tiếp.

## Trao đổi OAuth (cách đăng nhập hoạt động)

Các luồng đăng nhập tương tác của OpenClaw được triển khai trong `@mariozechner/pi-ai` và nối vào các trình hướng dẫn/lệnh.

### Setup-token Anthropic

Hình dạng luồng:

1. bắt đầu setup-token hoặc paste-token Anthropic từ OpenClaw
2. OpenClaw lưu thông tin xác thực Anthropic thu được vào một hồ sơ xác thực
3. lựa chọn mô hình vẫn ở `anthropic/...`
4. các hồ sơ xác thực Anthropic hiện có vẫn khả dụng để rollback/kiểm soát thứ tự

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth được hỗ trợ rõ ràng để sử dụng bên ngoài Codex CLI, bao gồm các quy trình OpenClaw.

Hình dạng luồng (PKCE):

1. tạo PKCE verifier/challenge + `state` ngẫu nhiên
2. mở `https://auth.openai.com/oauth/authorize?...`
3. thử bắt callback trên `http://127.0.0.1:1455/auth/callback`
4. nếu callback không thể bind (hoặc bạn đang ở môi trường từ xa/headless), dán URL/code chuyển hướng
5. trao đổi tại `https://auth.openai.com/oauth/token`
6. trích xuất `accountId` từ access token và lưu `{ access, refresh, expires, accountId }`

Đường dẫn trình hướng dẫn là `openclaw onboard` → lựa chọn xác thực `openai-codex`.

## Làm mới + hết hạn

Hồ sơ lưu dấu thời gian `expires`.

Ở runtime:

- nếu `expires` nằm trong tương lai → dùng access token đã lưu
- nếu đã hết hạn → làm mới (dưới khóa tệp) và ghi đè thông tin xác thực đã lưu
- nếu agent phụ đọc một hồ sơ OAuth kế thừa từ agent chính, thao tác làm mới
  ghi ngược về kho của agent chính thay vì sao chép refresh token vào
  kho của agent phụ
- ngoại lệ: một số thông tin xác thực CLI bên ngoài vẫn được quản lý bên ngoài; OpenClaw
  đọc lại các kho xác thực CLI đó thay vì tiêu tốn các refresh token đã sao chép.
  Việc khởi tạo Codex CLI được cố ý thu hẹp hơn: nó gieo một hồ sơ
  `openai-codex:default` trống, sau đó các lần làm mới do OpenClaw sở hữu sẽ giữ hồ sơ
  cục bộ là nguồn chuẩn.

Luồng làm mới là tự động; thông thường bạn không cần quản lý token thủ công.

## Nhiều tài khoản (hồ sơ) + định tuyến

Hai mẫu:

### 1) Ưu tiên: agent riêng biệt

Nếu bạn muốn “cá nhân” và “công việc” không bao giờ tương tác, hãy dùng các agent tách biệt (phiên + thông tin xác thực + workspace riêng):

```bash
openclaw agents add work
openclaw agents add personal
```

Sau đó cấu hình xác thực theo từng agent (trình hướng dẫn) và định tuyến cuộc trò chuyện tới đúng agent.

### 2) Nâng cao: nhiều hồ sơ trong một agent

`auth-profiles.json` hỗ trợ nhiều ID hồ sơ cho cùng một nhà cung cấp.

Chọn hồ sơ sẽ được dùng:

- trên toàn cục qua thứ tự cấu hình (`auth.order`)
- theo từng phiên qua `/model ...@<profileId>`

Ví dụ (ghi đè phiên):

- `/model Opus@anthropic:work`

Cách xem những ID hồ sơ nào tồn tại:

- `openclaw channels list --json` (hiển thị `auth[]`)

Tài liệu liên quan:

- [Chuyển dự phòng mô hình](/vi/concepts/model-failover) (quy tắc xoay vòng + cooldown)
- [Lệnh slash](/vi/tools/slash-commands) (bề mặt lệnh)

## Liên quan

- [Xác thực](/vi/gateway/authentication) — tổng quan xác thực nhà cung cấp mô hình
- [Bí mật](/vi/gateway/secrets) — lưu trữ thông tin xác thực và SecretRef
- [Tài liệu tham chiếu cấu hình](/vi/gateway/configuration-reference#auth-storage) — khóa cấu hình xác thực
