---
read_when:
    - Bạn muốn hiểu OAuth của OpenClaw từ đầu đến cuối
    - Bạn gặp sự cố vô hiệu hóa token / đăng xuất
    - Bạn muốn các luồng xác thực Claude CLI hoặc OAuth
    - Bạn muốn nhiều tài khoản hoặc định tuyến hồ sơ
summary: 'OAuth trong OpenClaw: trao đổi token, lưu trữ và các mẫu đa tài khoản'
title: OAuth
x-i18n:
    generated_at: "2026-07-02T22:37:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5cffefec8bb3e755bcd4583a7957510c7ba3b605e21a3fd876f27c8fc9aa65aa
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw hỗ trợ "xác thực bằng thuê bao" qua OAuth cho các nhà cung cấp có cung cấp cơ chế này
(đáng chú ý là **OpenAI Codex (ChatGPT OAuth)**). Với Anthropic, cách phân chia thực tế
hiện là:

- **Khóa API Anthropic**: tính phí Anthropic API thông thường
- **Anthropic Claude CLI / xác thực bằng thuê bao bên trong OpenClaw**: nhân viên Anthropic
  đã cho chúng tôi biết rằng cách sử dụng này lại được cho phép

OpenAI Codex OAuth được hỗ trợ rõ ràng để dùng trong các công cụ bên ngoài như
OpenClaw.

OpenClaw lưu cả xác thực bằng khóa API OpenAI và ChatGPT/Codex OAuth dưới
id nhà cung cấp chuẩn `openai`. Các id hồ sơ `openai-codex:*` cũ hơn và
mục `auth.order.openai-codex` là trạng thái cũ được
`openclaw doctor --fix` sửa; hãy dùng id hồ sơ `openai:*` và `auth.order.openai` cho
cấu hình mới.

Với Anthropic trong môi trường sản xuất, xác thực bằng khóa API là hướng được khuyến nghị an toàn hơn.

Trang này giải thích:

- cách **trao đổi token** OAuth hoạt động (PKCE)
- token được **lưu trữ** ở đâu (và vì sao)
- cách xử lý **nhiều tài khoản** (hồ sơ + ghi đè theo phiên)

OpenClaw cũng hỗ trợ **Plugin nhà cung cấp** có sẵn luồng OAuth hoặc khóa API
riêng. Chạy chúng bằng:

```bash
openclaw models auth login --provider <id>
```

## Bộ nhận token (vì sao tồn tại)

Các nhà cung cấp OAuth thường tạo một **refresh token mới** trong luồng đăng nhập/làm mới. Một số nhà cung cấp (hoặc ứng dụng OAuth) có thể vô hiệu hóa refresh token cũ hơn khi token mới được cấp cho cùng người dùng/ứng dụng.

Triệu chứng thực tế:

- bạn đăng nhập qua OpenClaw _và_ qua Claude Code / Codex CLI → một trong hai bên ngẫu nhiên bị "đăng xuất" sau đó

Để giảm việc đó, OpenClaw xem `auth-profiles.json` là một **bộ nhận token**:

- runtime đọc thông tin xác thực từ **một nơi**
- chúng tôi có thể giữ nhiều hồ sơ và định tuyến chúng một cách xác định
- việc tái sử dụng CLI bên ngoài là tùy theo nhà cung cấp: Codex CLI có thể khởi tạo hồ sơ
  `openai:default` trống, nhưng khi OpenClaw đã có hồ sơ OAuth cục bộ,
  refresh token cục bộ là chuẩn. Nếu refresh token cục bộ đó bị từ chối,
  OpenClaw báo cáo hồ sơ được quản lý để xác thực lại thay vì dùng
  vật liệu token Codex CLI như một fallback runtime ngang hàng. Các tích hợp khác có thể
  vẫn được quản lý bên ngoài và đọc lại kho xác thực CLI của chúng
- các đường dẫn trạng thái và khởi động đã biết phạm vi bộ nhà cung cấp được cấu hình sẽ
  giới hạn việc khám phá CLI bên ngoài vào bộ đó, để kho đăng nhập CLI không liên quan
  không bị thăm dò cho thiết lập chỉ có một nhà cung cấp

## Lưu trữ (token nằm ở đâu)

Bí mật được lưu trong kho xác thực agent:

- Hồ sơ xác thực (OAuth + khóa API + tham chiếu tùy chọn ở cấp giá trị): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Tệp tương thích cũ: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (các mục `api_key` tĩnh sẽ bị xóa khi được phát hiện)

Tệp cũ chỉ dùng để nhập (vẫn được hỗ trợ, nhưng không phải kho chính):

- `~/.openclaw/credentials/oauth.json` (được nhập vào `auth-profiles.json` trong lần dùng đầu tiên)

Tất cả mục trên cũng tôn trọng `$OPENCLAW_STATE_DIR` (ghi đè thư mục trạng thái). Tham chiếu đầy đủ: [/gateway/configuration](/vi/gateway/configuration-reference#auth-storage)

Về tham chiếu bí mật tĩnh và hành vi kích hoạt snapshot runtime, xem [Quản lý bí mật](/vi/gateway/secrets).

Khi một agent phụ không có hồ sơ xác thực cục bộ, OpenClaw dùng kế thừa đọc xuyên
từ kho agent mặc định/chính. Nó không sao chép `auth-profiles.json` của agent chính
khi đọc. Refresh token OAuth đặc biệt nhạy cảm: các luồng sao chép thông thường
mặc định bỏ qua chúng vì một số nhà cung cấp xoay vòng hoặc vô hiệu hóa
refresh token sau khi dùng. Hãy cấu hình đăng nhập OAuth riêng cho một
agent khi agent đó cần một tài khoản độc lập.

## Tương thích token cũ của Anthropic

<Warning>
Tài liệu Claude Code công khai của Anthropic nói rằng việc dùng Claude Code trực tiếp vẫn nằm trong
giới hạn thuê bao Claude, và nhân viên Anthropic đã cho chúng tôi biết rằng cách dùng Claude
CLI kiểu OpenClaw lại được cho phép. Do đó OpenClaw xem việc tái sử dụng Claude CLI và
dùng `claude -p` là được chấp thuận cho tích hợp này trừ khi Anthropic
công bố chính sách mới.

Về tài liệu gói direct-Claude-Code hiện tại của Anthropic, xem [Dùng Claude Code
với gói Pro hoặc Max của bạn](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
và [Dùng Claude Code với gói Team hoặc Enterprise
của bạn](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Nếu bạn muốn các tùy chọn kiểu thuê bao khác trong OpenClaw, xem [OpenAI
Codex](/vi/providers/openai), [Qwen Cloud Coding
Plan](/vi/providers/qwen), [MiniMax Coding Plan](/vi/providers/minimax),
và [Z.AI / GLM Coding Plan](/vi/providers/zai).
</Warning>

OpenClaw cũng cung cấp setup-token Anthropic như một đường dẫn xác thực bằng token được hỗ trợ, nhưng hiện ưu tiên tái sử dụng Claude CLI và `claude -p` khi có sẵn.

## Di chuyển Anthropic Claude CLI

OpenClaw lại hỗ trợ tái sử dụng Anthropic Claude CLI. Nếu bạn đã có đăng nhập
Claude cục bộ trên máy chủ, onboarding/configure có thể tái sử dụng trực tiếp.

## Trao đổi OAuth (đăng nhập hoạt động thế nào)

Các luồng đăng nhập tương tác của OpenClaw được triển khai trong `openclaw/plugin-sdk/llm` và nối vào các wizard/lệnh.

### Anthropic setup-token

Hình dạng luồng:

1. bắt đầu Anthropic setup-token hoặc paste-token từ OpenClaw
2. OpenClaw lưu thông tin xác thực Anthropic thu được vào một hồ sơ xác thực
3. lựa chọn mô hình vẫn ở `anthropic/...`
4. các hồ sơ xác thực Anthropic hiện có vẫn khả dụng để rollback/kiểm soát thứ tự

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth được hỗ trợ rõ ràng để dùng bên ngoài Codex CLI, bao gồm các quy trình OpenClaw.

Lệnh đăng nhập vẫn dùng id nhà cung cấp OpenAI chuẩn:

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
4. nếu callback không thể bind (hoặc bạn ở môi trường từ xa/headless), dán URL/code chuyển hướng
5. trao đổi tại `https://auth.openai.com/oauth/token`
6. trích xuất `accountId` từ access token và lưu `{ access, refresh, expires, accountId }`

Đường dẫn wizard là `openclaw onboard` → lựa chọn xác thực `openai`.

## Làm mới + hết hạn

Hồ sơ lưu dấu thời gian `expires`.

Ở runtime:

- nếu `expires` ở tương lai → dùng access token đã lưu
- nếu đã hết hạn → làm mới (dưới khóa tệp) và ghi đè thông tin xác thực đã lưu
- nếu agent phụ đọc hồ sơ OAuth agent chính được kế thừa, thao tác làm mới
  ghi ngược về kho agent chính thay vì sao chép refresh token vào
  kho agent phụ
- ngoại lệ: một số thông tin xác thực CLI bên ngoài vẫn được quản lý bên ngoài; OpenClaw
  đọc lại các kho xác thực CLI đó thay vì tiêu tốn refresh token đã sao chép.
  Việc khởi tạo Codex CLI cố ý hẹp hơn: nó chỉ có thể gieo một
  `openai:default` trống hoặc hồ sơ OpenAI được yêu cầu rõ ràng trước khi OpenClaw
  sở hữu OAuth cho nhà cung cấp. Sau đó, các lần làm mới do OpenClaw sở hữu giữ
  hồ sơ cục bộ là chuẩn và việc khám phá không thêm xác thực Codex CLI vào bất kỳ vị trí
  ngang hàng nào. Nếu một lần làm mới được quản lý thất bại, OpenClaw báo cáo hồ sơ bị ảnh hưởng để
  xác thực lại thay vì trả về vật liệu token CLI bên ngoài.

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

Chọn hồ sơ sẽ được dùng:

- toàn cục qua thứ tự cấu hình (`auth.order`)
- theo phiên qua `/model ...@<profileId>`

Ví dụ (ghi đè phiên):

- `/model Opus@anthropic:work`

Cách xem những ID hồ sơ nào tồn tại:

- `openclaw channels list --json` (hiển thị `auth[]`)

Tài liệu liên quan:

- [Chuyển dự phòng mô hình](/vi/concepts/model-failover) (quy tắc xoay vòng + cooldown)
- [Lệnh slash](/vi/tools/slash-commands) (bề mặt lệnh)

## Liên quan

- [Xác thực](/vi/gateway/authentication) - tổng quan xác thực nhà cung cấp mô hình
- [Bí mật](/vi/gateway/secrets) - lưu trữ thông tin xác thực và SecretRef
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#auth-storage) - khóa cấu hình xác thực
