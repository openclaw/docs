---
read_when:
    - Bạn muốn sử dụng GitHub Copilot làm nhà cung cấp mô hình
    - Bạn cần luồng `openclaw models auth login-github-copilot`
summary: Đăng nhập vào GitHub Copilot từ OpenClaw bằng luồng thiết bị hoặc nhập mã thông báo không tương tác
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-29T23:06:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ebcee41d4a3fffff8f20072e99e6dbb57baa2d9ec7eddad1d426ee37805597c
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot là trợ lý lập trình AI của GitHub. Nó cung cấp quyền truy cập vào các mô hình Copilot cho tài khoản và gói GitHub của bạn. OpenClaw có thể dùng Copilot làm nhà cung cấp mô hình theo hai cách khác nhau.

## Hai cách sử dụng Copilot trong OpenClaw

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    Sử dụng luồng đăng nhập thiết bị gốc để lấy token GitHub, sau đó đổi token đó lấy
    token API Copilot khi OpenClaw chạy. Đây là đường dẫn **mặc định** và đơn giản nhất
    vì không yêu cầu VS Code.

    <Steps>
      <Step title="Run the login command">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Bạn sẽ được nhắc truy cập một URL và nhập mã dùng một lần. Giữ
        terminal mở cho đến khi hoàn tất.
      </Step>
      <Step title="Set a default model">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        Hoặc trong cấu hình:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot Proxy plugin (copilot-proxy)">
    Sử dụng extension VS Code **Copilot Proxy** làm cầu nối cục bộ. OpenClaw giao tiếp với
    endpoint `/v1` của proxy và sử dụng danh sách mô hình bạn cấu hình ở đó.

    <Note>
    Chọn cách này khi bạn đã chạy Copilot Proxy trong VS Code hoặc cần định tuyến
    qua nó. Bạn phải bật Plugin và giữ cho extension VS Code tiếp tục chạy.
    </Note>

  </Tab>
</Tabs>

## Cờ tùy chọn

| Cờ              | Mô tả                                               |
| --------------- | --------------------------------------------------- |
| `--yes`         | Bỏ qua lời nhắc xác nhận                            |
| `--set-default` | Đồng thời áp dụng mô hình mặc định được nhà cung cấp khuyến nghị |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## Onboarding không tương tác

Nếu bạn đã có token truy cập GitHub OAuth cho Copilot, hãy nhập nó trong quá trình
thiết lập headless bằng `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Bạn cũng có thể bỏ qua `--auth-choice`; việc truyền `--github-copilot-token` sẽ suy ra
lựa chọn xác thực nhà cung cấp GitHub Copilot. Nếu cờ này bị bỏ qua, onboarding sẽ
fallback về `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, rồi `GITHUB_TOKEN`. Dùng
`--secret-input-mode ref` khi đã đặt `COPILOT_GITHUB_TOKEN` để lưu `tokenRef` dựa trên env
thay vì văn bản thuần trong `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="Interactive TTY required">
    Luồng đăng nhập thiết bị yêu cầu TTY tương tác. Chạy trực tiếp trong
    terminal, không chạy trong script không tương tác hoặc pipeline CI.
  </Accordion>

  <Accordion title="Model availability depends on your plan">
    Tính khả dụng của mô hình Copilot phụ thuộc vào gói GitHub của bạn. Nếu một mô hình bị
    từ chối, hãy thử ID khác (ví dụ `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Transport selection">
    ID mô hình Claude tự động dùng transport Anthropic Messages. Các mô hình GPT,
    o-series và Gemini tiếp tục dùng transport OpenAI Responses. OpenClaw
    chọn transport đúng dựa trên model ref.
  </Accordion>

  <Accordion title="Request compatibility">
    OpenClaw gửi các header yêu cầu kiểu Copilot IDE trên các transport Copilot,
    bao gồm các lượt Compaction tích hợp sẵn, kết quả công cụ và theo dõi hình ảnh. Nó
    không bật tiếp tục Responses ở cấp nhà cung cấp cho Copilot trừ khi
    hành vi đó đã được xác minh với API của Copilot.
  </Accordion>

  <Accordion title="Environment variable resolution order">
    OpenClaw phân giải xác thực Copilot từ các biến môi trường theo
    thứ tự ưu tiên sau:

    | Mức ưu tiên | Biến                  | Ghi chú                          |
    | ------------ | --------------------- | -------------------------------- |
    | 1            | `COPILOT_GITHUB_TOKEN` | Ưu tiên cao nhất, dành riêng cho Copilot |
    | 2            | `GH_TOKEN`            | Token GitHub CLI (fallback)      |
    | 3            | `GITHUB_TOKEN`        | Token GitHub tiêu chuẩn (thấp nhất) |

    Khi nhiều biến được đặt, OpenClaw dùng biến có mức ưu tiên cao nhất.
    Luồng đăng nhập thiết bị (`openclaw models auth login-github-copilot`) lưu
    token của nó trong kho hồ sơ xác thực và được ưu tiên hơn tất cả biến môi trường.

  </Accordion>

  <Accordion title="Token storage">
    Lệnh đăng nhập lưu token GitHub trong kho hồ sơ xác thực và đổi token đó
    lấy token API Copilot khi OpenClaw chạy. Bạn không cần tự quản lý
    token.
  </Accordion>
</AccordionGroup>

<Warning>
Lệnh đăng nhập thiết bị yêu cầu TTY tương tác. Dùng onboarding không tương tác
khi bạn cần thiết lập headless.
</Warning>

## Embedding tìm kiếm bộ nhớ

GitHub Copilot cũng có thể đóng vai trò nhà cung cấp embedding cho
[tìm kiếm bộ nhớ](/vi/concepts/memory-search). Nếu bạn có gói đăng ký Copilot và
đã đăng nhập, OpenClaw có thể dùng nó cho embedding mà không cần khóa API riêng.

### Tự động phát hiện

Khi `memorySearch.provider` là `"auto"` (mặc định), GitHub Copilot được thử
ở mức ưu tiên 15 -- sau embedding cục bộ nhưng trước OpenAI và các nhà cung cấp trả phí
khác. Nếu có token GitHub, OpenClaw phát hiện các mô hình embedding khả dụng
từ API Copilot và tự động chọn mô hình tốt nhất.

### Cấu hình rõ ràng

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: override the auto-discovered model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Cách hoạt động

1. OpenClaw phân giải token GitHub của bạn (từ biến env hoặc hồ sơ xác thực).
2. Đổi nó lấy token API Copilot có thời hạn ngắn.
3. Truy vấn endpoint `/models` của Copilot để phát hiện các mô hình embedding khả dụng.
4. Chọn mô hình tốt nhất (ưu tiên `text-embedding-3-small`).
5. Gửi yêu cầu embedding tới endpoint `/embeddings` của Copilot.

Tính khả dụng của mô hình phụ thuộc vào gói GitHub của bạn. Nếu không có mô hình embedding nào
khả dụng, OpenClaw bỏ qua Copilot và thử nhà cung cấp tiếp theo.

## Liên quan

<CardGroup cols={2}>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, model ref và hành vi failover.
  </Card>
  <Card title="OAuth and auth" href="/vi/gateway/authentication" icon="key">
    Chi tiết xác thực và quy tắc tái sử dụng thông tin xác thực.
  </Card>
</CardGroup>
