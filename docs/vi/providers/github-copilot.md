---
read_when:
    - Bạn muốn sử dụng GitHub Copilot làm nhà cung cấp mô hình
    - Bạn cần luồng `openclaw models auth login-github-copilot`
    - Bạn đang chọn giữa nhà cung cấp Copilot tích hợp sẵn, bộ khung Copilot SDK và Copilot Proxy
summary: Đăng nhập vào GitHub Copilot từ OpenClaw bằng luồng thiết bị hoặc nhập token không tương tác
title: GitHub Copilot
x-i18n:
    generated_at: "2026-06-27T18:03:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0cd7103ec880592b1f4506ed844abe788f53040f3751e7034daf9aafedc2f94
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot là trợ lý lập trình AI của GitHub. Công cụ này cung cấp quyền truy cập vào các mô hình Copilot
cho tài khoản và gói GitHub của bạn. OpenClaw có thể dùng Copilot làm nhà cung cấp mô hình
hoặc thời gian chạy tác tử theo ba cách khác nhau.

## Ba cách dùng Copilot trong OpenClaw

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    Dùng luồng đăng nhập thiết bị gốc để lấy mã thông báo GitHub, rồi trao đổi mã đó lấy
    mã thông báo API Copilot khi OpenClaw chạy. Đây là đường dẫn **mặc định** và đơn giản nhất
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

  <Tab title="Copilot SDK harness plugin (copilot)">
    Cài đặt Plugin `@openclaw/copilot` bên ngoài khi bạn muốn
    Copilot CLI và SDK của GitHub sở hữu vòng lặp tác tử cấp thấp cho các mô hình
    `github-copilot/*` đã chọn.

    ```bash
    openclaw plugins install clawhub:@openclaw/copilot
    ```

    Sau đó chọn một mô hình hoặc nhà cung cấp để dùng thời gian chạy:

    ```json5
    {
      agents: {
        defaults: {
          model: "github-copilot/gpt-5.5",
          models: {
            "github-copilot/gpt-5.5": {
              agentRuntime: { id: "copilot" },
            },
          },
        },
      },
    }
    ```

    Chọn cách này khi bạn muốn các phiên Copilot CLI gốc, trạng thái luồng
    do SDK quản lý, và Compaction do Copilot sở hữu cho các lượt tác tử đó. Xem
    [khung chạy Copilot SDK](/vi/plugins/copilot) để biết đầy đủ hợp đồng thời gian chạy.

  </Tab>

  <Tab title="Copilot Proxy plugin (copilot-proxy)">
    Dùng tiện ích VS Code **Copilot Proxy** làm cầu nối cục bộ. OpenClaw giao tiếp với
    endpoint `/v1` của proxy và dùng danh sách mô hình mà bạn cấu hình ở đó.

    <Note>
    Chọn cách này khi bạn đã chạy Copilot Proxy trong VS Code hoặc cần định tuyến
    qua công cụ đó. Bạn phải bật Plugin và giữ tiện ích VS Code đang chạy.
    </Note>

  </Tab>
</Tabs>

## Cờ tùy chọn

| Cờ              | Mô tả                                                |
| --------------- | --------------------------------------------------- |
| `--yes`         | Bỏ qua lời nhắc xác nhận                            |
| `--set-default` | Đồng thời áp dụng mô hình mặc định được nhà cung cấp đề xuất |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## Thiết lập ban đầu không tương tác

Nếu bạn đã có mã thông báo truy cập GitHub OAuth cho Copilot, hãy nhập mã đó trong quá trình
thiết lập không giao diện bằng `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Bạn cũng có thể bỏ qua `--auth-choice`; việc truyền `--github-copilot-token` sẽ suy ra lựa chọn xác thực
nhà cung cấp GitHub Copilot. Nếu cờ bị bỏ qua, quá trình thiết lập ban đầu sẽ
dùng dự phòng lần lượt `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, rồi `GITHUB_TOKEN`. Dùng
`--secret-input-mode ref` với `COPILOT_GITHUB_TOKEN` đã đặt để lưu `tokenRef`
dựa trên env thay vì văn bản thuần trong `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="Interactive TTY required">
    Luồng đăng nhập thiết bị yêu cầu TTY tương tác. Chạy trực tiếp trong
    terminal, không chạy trong script không tương tác hoặc pipeline CI.
  </Accordion>

  <Accordion title="Model availability depends on your plan">
    Tính khả dụng của mô hình Copilot phụ thuộc vào gói GitHub của bạn. Nếu một mô hình bị
    từ chối, hãy thử ID khác (ví dụ `github-copilot/gpt-5.5`). Xem
    [các mô hình được hỗ trợ theo từng gói Copilot của GitHub](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    để biết danh sách mô hình hiện tại.
  </Accordion>

  <Accordion title="Live catalog refresh from the Copilot API">
    Sau khi đường dẫn xác thực đăng nhập thiết bị (hoặc env-var) đã phân giải được mã thông báo GitHub,
    OpenClaw làm mới catalog mô hình theo yêu cầu từ `${baseUrl}/models`
    (cùng endpoint mà VS Code Copilot dùng), để thời gian chạy theo dõi
    quyền theo từng tài khoản và cửa sổ ngữ cảnh chính xác mà không cần thay đổi manifest.
    Các mô hình Copilot mới được phát hành sẽ hiển thị mà không cần nâng cấp OpenClaw,
    và cửa sổ ngữ cảnh phản ánh giới hạn thực theo từng mô hình
    (ví dụ 400k cho dòng gpt-5.x, 1M cho các biến thể nội bộ
    `claude-opus-*-1m`).

    Catalog tĩnh đi kèm vẫn là dự phòng hiển thị khi tính năng khám phá
    bị tắt, người dùng không có hồ sơ xác thực GitHub, trao đổi mã thông báo
    thất bại, hoặc lệnh gọi HTTPS tới `/models` gặp lỗi. Để chọn không dùng và hoàn toàn dựa
    vào catalog manifest tĩnh (kịch bản ngoại tuyến / air-gapped):

    ```json5
    {
      plugins: {
        entries: {
          "github-copilot": {
            config: { discovery: { enabled: false } },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Transport selection">
    ID mô hình Claude tự động dùng transport Anthropic Messages. Các mô hình GPT,
    o-series, và Gemini giữ transport OpenAI Responses. OpenClaw
    chọn transport phù hợp dựa trên ref mô hình.
  </Accordion>

  <Accordion title="Request compatibility">
    OpenClaw gửi các header yêu cầu kiểu IDE Copilot trên transport Copilot,
    bao gồm các lượt Compaction tích hợp sẵn, kết quả công cụ, và theo dõi hình ảnh.
    Công cụ này không bật tiếp diễn Responses ở cấp nhà cung cấp cho Copilot trừ khi
    hành vi đó đã được xác minh với API của Copilot.
  </Accordion>

  <Accordion title="Environment variable resolution order">
    OpenClaw phân giải xác thực Copilot từ biến môi trường theo thứ tự
    ưu tiên sau:

    | Ưu tiên | Biến                  | Ghi chú                          |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | Ưu tiên cao nhất, dành riêng cho Copilot |
    | 2        | `GH_TOKEN`            | Mã thông báo GitHub CLI (dự phòng) |
    | 3        | `GITHUB_TOKEN`        | Mã thông báo GitHub tiêu chuẩn (thấp nhất) |

    Khi nhiều biến được đặt, OpenClaw dùng biến có mức ưu tiên cao nhất.
    Luồng đăng nhập thiết bị (`openclaw models auth login-github-copilot`) lưu
    mã thông báo của nó trong kho hồ sơ xác thực và được ưu tiên hơn mọi biến môi trường.
  </Accordion>

  <Accordion title="Token storage">
    Lệnh đăng nhập lưu mã thông báo GitHub trong kho hồ sơ xác thực và trao đổi mã đó
    lấy mã thông báo API Copilot khi OpenClaw chạy. Bạn không cần quản lý
    mã thông báo theo cách thủ công.
  </Accordion>
</AccordionGroup>

<Warning>
Lệnh đăng nhập thiết bị yêu cầu TTY tương tác. Dùng thiết lập ban đầu không tương tác
khi bạn cần thiết lập không giao diện.
</Warning>

## Embedding cho tìm kiếm bộ nhớ

GitHub Copilot cũng có thể đóng vai trò nhà cung cấp embedding cho
[tìm kiếm bộ nhớ](/vi/concepts/memory-search). Nếu bạn có gói đăng ký Copilot và
đã đăng nhập, OpenClaw có thể dùng công cụ này cho embedding mà không cần khóa API riêng.

### Cấu hình

Đặt rõ `memorySearch.provider` để dùng embedding GitHub Copilot. Nếu có
mã thông báo GitHub, OpenClaw khám phá các mô hình embedding khả dụng từ
API Copilot và tự động chọn mô hình tốt nhất.

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

1. OpenClaw phân giải mã thông báo GitHub của bạn (từ env vars hoặc hồ sơ xác thực).
2. Trao đổi mã đó lấy mã thông báo API Copilot tồn tại ngắn hạn.
3. Truy vấn endpoint `/models` của Copilot để khám phá các mô hình embedding khả dụng.
4. Chọn mô hình tốt nhất (ưu tiên `text-embedding-3-small`).
5. Gửi yêu cầu embedding tới endpoint `/embeddings` của Copilot.

Tính khả dụng của mô hình phụ thuộc vào gói GitHub của bạn. Nếu không có mô hình embedding nào
khả dụng, OpenClaw bỏ qua Copilot và thử nhà cung cấp tiếp theo.

## Liên quan

<CardGroup cols={2}>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, ref mô hình, và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="OAuth and auth" href="/vi/gateway/authentication" icon="key">
    Chi tiết xác thực và quy tắc tái sử dụng thông tin xác thực.
  </Card>
</CardGroup>
