---
read_when:
    - Bạn muốn sử dụng GitHub Copilot làm nhà cung cấp mô hình
    - Bạn cần quy trình `openclaw models auth login-github-copilot`
    - Bạn đang lựa chọn giữa nhà cung cấp Copilot tích hợp sẵn, bộ khung Copilot SDK và Copilot Proxy
summary: Đăng nhập vào GitHub Copilot từ OpenClaw bằng quy trình thiết bị hoặc nhập token không tương tác
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-12T08:17:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e731d46dd387bbecb0219c4ec3e319fb8d07fd4017da8035561f110501587ad4
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot là trợ lý lập trình AI của GitHub. Dịch vụ này cung cấp quyền truy cập vào các mô hình Copilot
cho tài khoản và gói GitHub của bạn. OpenClaw có thể sử dụng Copilot làm nhà cung cấp
mô hình hoặc môi trường thực thi tác tử theo ba cách khác nhau.

## Ba cách sử dụng Copilot trong OpenClaw

<Tabs>
  <Tab title="Nhà cung cấp tích hợp sẵn (github-copilot)">
    Sử dụng luồng đăng nhập thiết bị gốc để lấy mã thông báo GitHub, sau đó đổi mã này lấy
    mã thông báo API Copilot khi OpenClaw chạy. Đây là đường dẫn **mặc định** và đơn giản nhất
    vì không yêu cầu VS Code.

    <Steps>
      <Step title="Chạy lệnh đăng nhập">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Bạn sẽ được yêu cầu truy cập một URL và nhập mã dùng một lần. Giữ
        cửa sổ dòng lệnh mở cho đến khi quá trình hoàn tất.
      </Step>
      <Step title="Đặt mô hình mặc định">
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

  <Tab title="Plugin bộ điều phối Copilot SDK (copilot)">
    Cài đặt plugin bên ngoài `@openclaw/copilot` khi bạn muốn Copilot CLI và SDK
    của GitHub quản lý vòng lặp tác tử cấp thấp cho các mô hình
    `github-copilot/*` đã chọn.

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    Sau đó chọn dùng môi trường thực thi này cho một mô hình hoặc nhà cung cấp:

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
    do SDK quản lý và Compaction do Copilot quản lý cho các lượt tác tử đó. Nếu không
    chủ động chọn `agentRuntime` một cách rõ ràng, các mô hình `github-copilot/*` vẫn sử dụng
    nhà cung cấp tích hợp sẵn. Xem [Bộ điều phối Copilot SDK](/vi/plugins/copilot) để biết đầy đủ
    hợp đồng môi trường thực thi.

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Sử dụng tiện ích mở rộng **Copilot Proxy** cho VS Code làm cầu nối cục bộ. OpenClaw giao tiếp với
    điểm cuối `/v1` của proxy (mặc định là `http://localhost:3000/v1`) và sử dụng
    danh sách mô hình mà bạn cấu hình.

    Plugin `copilot-proxy` được phân phối cùng OpenClaw và được bật theo mặc định.
    Cấu hình URL cơ sở và mã định danh mô hình bằng:

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    Chọn cách này khi bạn đã chạy Copilot Proxy trong VS Code hoặc cần định tuyến
    qua tiện ích này. Tiện ích mở rộng VS Code phải luôn chạy.
    </Note>

  </Tab>
</Tabs>

## GitHub Enterprise (vị trí lưu trú dữ liệu)

Nếu tổ chức của bạn sử dụng một đối tượng thuê GitHub Enterprise có yêu cầu lưu trú dữ liệu (máy chủ
`*.ghe.com`, chẳng hạn như `your-org.ghe.com`), Copilot hoạt động trên các điểm cuối cục bộ
của đối tượng thuê thay vì `github.com` công khai. OpenClaw cung cấp đây như một
lựa chọn xác thực hạng nhất để bạn không phải chỉnh sửa URL thủ công.

<Steps>
  <Step title="Chọn phương thức xác thực Enterprise">
    Trong quy trình thiết lập ban đầu hoặc `openclaw models auth`, chọn
    **GitHub Copilot (Enterprise / data residency)**. Bạn sẽ được yêu cầu nhập
    miền Enterprise của mình (ví dụ: `your-org.ghe.com`), sau đó quy trình
    đăng nhập thiết bị sẽ chạy với đối tượng thuê đó.

    Chỉ nhập miền gốc của đối tượng thuê (`your-org.ghe.com`). Các máy chủ dịch vụ dẫn xuất như
    `api.your-org.ghe.com` hoặc `copilot-api.your-org.ghe.com` không được chấp nhận;
    OpenClaw tự động suy ra các điểm cuối đó từ miền gốc của đối tượng thuê.

    ```bash
    openclaw models auth login --provider github-copilot --method device-enterprise
    ```

  </Step>
  <Step title="Miền được lưu vào cấu hình">
    Máy chủ đã chọn được lưu trong các tham số của nhà cung cấp để các lần làm mới mã thông báo
    và hoàn tất sau đó tự động nhắm đến đối tượng thuê:

    ```json5
    {
      models: {
        providers: {
          "github-copilot": { params: { githubDomain: "your-org.ghe.com" } },
        },
      },
    }
    ```

  </Step>
</Steps>

Luồng thiết bị, quá trình trao đổi mã thông báo và các yêu cầu hoàn tất lần lượt được phân giải thành
`https://your-org.ghe.com/login/device/code`,
`https://api.your-org.ghe.com/copilot_internal/v2/token` và
`https://copilot-api.your-org.ghe.com`. Mã thông báo lưu trú dữ liệu mang
dấu nhận diện đối tượng thuê và không có gợi ý proxy, vì vậy URL cơ sở cho yêu cầu hoàn tất sẽ dùng dự phòng
máy chủ Copilot của đối tượng thuê thay vì điểm cuối công khai.

<Note>
Việc chuyển đổi miền luôn chạy lại quy trình đăng nhập thiết bị. Nếu bạn đã lưu
mã thông báo Copilot và chọn một miền khác (`github.com` công khai ↔ một đối tượng thuê
`*.ghe.com`, hoặc từ đối tượng thuê này sang đối tượng thuê khác), OpenClaw sẽ không tái sử dụng mã thông báo hiện có —
hệ thống buộc đăng nhập mới để mã thông báo chỉ có phạm vi đối với miền đang được ghi vào
cấu hình. Việc chạy lại đăng nhập cho *cùng* một miền vẫn cung cấp lựa chọn tái sử dụng mã thông báo
hiện tại. Chuyển lại sang `github.com` công khai sẽ xóa
`githubDomain` đã lưu để cấu hình trở về mặc định.
</Note>

<Note>
Biến môi trường `COPILOT_GITHUB_DOMAIN` ghi đè miền đã phân giải
cho mọi đường dẫn Copilot có phân giải miền này — quy trình đăng nhập thiết bị Enterprise
(`--method device-enterprise`), lối tắt độc lập
`openclaw models auth login-github-copilot`, quá trình làm mới mã thông báo, nội dung nhúng
và yêu cầu hoàn tất. Đặt biến này thành máy chủ `*.ghe.com` của bạn cho các thiết lập
hoàn toàn không giao diện hoặc CI. Không đặt biến này (và không có tham số cấu hình) để sử dụng
`github.com` công khai. Các lần đăng nhập lưu lại miền mà mã thông báo được cấp cho miền đó (và xóa miền
khi đăng nhập với `github.com` công khai), vì vậy việc định tuyến vẫn chính xác ngay cả sau khi
biến môi trường bị bỏ đặt.
</Note>

## Cờ tùy chọn

| Lệnh                                                                   | Cờ              | Mô tả                                                      |
| ---------------------------------------------------------------------- | --------------- | ---------------------------------------------------------- |
| `openclaw models auth login-github-copilot`                            | `--yes`         | Ghi đè hồ sơ xác thực hiện có mà không yêu cầu xác nhận     |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | Đồng thời áp dụng mô hình mặc định do nhà cung cấp đề xuất  |

```bash
# Bỏ qua xác nhận đăng nhập lại
openclaw models auth login-github-copilot --yes

# Đăng nhập và đặt mô hình mặc định trong một bước
openclaw models auth login --provider github-copilot --method device --set-default
```

## Thiết lập ban đầu không tương tác

Luồng đăng nhập thiết bị yêu cầu TTY tương tác. Đối với thiết lập không giao diện, hãy nhập
mã thông báo truy cập GitHub OAuth hiện có bằng `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Bạn cũng có thể bỏ qua `--auth-choice`; việc truyền `--github-copilot-token` sẽ suy ra
lựa chọn xác thực nhà cung cấp GitHub Copilot. Nếu cờ này bị bỏ qua, quy trình thiết lập ban đầu sẽ
lần lượt dùng dự phòng `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, rồi `GITHUB_TOKEN`. Sử dụng
`--secret-input-mode ref` khi đã đặt `COPILOT_GITHUB_TOKEN` để lưu `tokenRef`
dựa trên biến môi trường thay vì văn bản thuần trong `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="Yêu cầu TTY tương tác">
    Luồng đăng nhập thiết bị yêu cầu TTY tương tác. Hãy chạy trực tiếp trong
    cửa sổ dòng lệnh, không chạy trong tập lệnh không tương tác hoặc quy trình CI.
  </Accordion>

  <Accordion title="Tính khả dụng của mô hình phụ thuộc vào gói của bạn">
    Tính khả dụng của mô hình Copilot phụ thuộc vào gói GitHub của bạn. Nếu một mô hình bị
    từ chối, hãy thử mã định danh khác (ví dụ: `github-copilot/gpt-5.5`). Xem
    [các mô hình được hỗ trợ theo từng gói Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    của GitHub để biết danh sách mô hình hiện tại.
  </Accordion>

  <Accordion title="Làm mới danh mục trực tiếp từ API Copilot">
    Sau khi đường dẫn xác thực bằng đăng nhập thiết bị (hoặc biến môi trường) phân giải được mã thông báo GitHub,
    OpenClaw làm mới danh mục mô hình theo yêu cầu từ `${baseUrl}/models`
    (cùng điểm cuối mà VS Code Copilot sử dụng), nhờ đó môi trường thực thi theo dõi
    quyền sử dụng theo từng tài khoản và cửa sổ ngữ cảnh chính xác mà không cần thay đổi
    tệp kê khai. Các mô hình Copilot mới phát hành sẽ hiển thị mà không cần nâng cấp OpenClaw,
    và cửa sổ ngữ cảnh phản ánh các giới hạn thực tế của từng mô hình
    (ví dụ: 400k cho dòng gpt-5.x, 1M cho các biến thể nội bộ
    `claude-opus-*-1m`).

    Danh mục tĩnh đi kèm vẫn là phương án dự phòng hiển thị khi tính năng khám phá
    bị tắt, người dùng không có hồ sơ xác thực GitHub, quá trình trao đổi mã thông báo
    thất bại hoặc lệnh gọi HTTPS `/models` gặp lỗi. Để không sử dụng tính năng này và hoàn toàn
    dựa vào danh mục tệp kê khai tĩnh (các trường hợp ngoại tuyến / cách ly mạng):

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

  <Accordion title="Lựa chọn giao thức truyền tải">
    Mã định danh mô hình Claude tự động sử dụng giao thức truyền tải Anthropic Messages.
    Các mô hình Gemini sử dụng giao thức truyền tải OpenAI Chat Completions; các mô hình GPT và dòng o
    tiếp tục sử dụng giao thức truyền tải OpenAI Responses. OpenClaw chọn đúng
    giao thức truyền tải dựa trên tham chiếu mô hình.
  </Accordion>

  <Accordion title="Khả năng tương thích của yêu cầu">
    OpenClaw gửi các tiêu đề yêu cầu theo kiểu Copilot IDE trên giao thức truyền tải Copilot
    (phiên bản trình soạn thảo/plugin VS Code và mã định danh tích hợp `vscode-chat`),
    đánh dấu các lượt tiếp nối kết quả công cụ là do tác tử khởi tạo và đặt tiêu đề thị giác Copilot
    khi một lượt có đầu vào hình ảnh.
  </Accordion>

  <Accordion title="Thứ tự phân giải biến môi trường">
    OpenClaw phân giải thông tin xác thực Copilot từ các biến môi trường theo
    thứ tự ưu tiên sau:

    | Mức ưu tiên | Biến                   | Ghi chú                                  |
    | ----------- | ---------------------- | ---------------------------------------- |
    | 1           | `COPILOT_GITHUB_TOKEN` | Ưu tiên cao nhất, dành riêng cho Copilot |
    | 2           | `GH_TOKEN`             | Mã thông báo GitHub CLI (dự phòng)       |
    | 3           | `GITHUB_TOKEN`         | Mã thông báo GitHub tiêu chuẩn (thấp nhất) |

    Khi nhiều biến được đặt, OpenClaw sử dụng biến có mức ưu tiên cao nhất.
    Luồng đăng nhập thiết bị (`openclaw models auth login-github-copilot`) lưu
    mã thông báo vào kho hồ sơ xác thực và được ưu tiên hơn mọi biến môi trường.

  </Accordion>

  <Accordion title="Lưu trữ mã thông báo">
    Quá trình đăng nhập lưu mã thông báo GitHub trong kho hồ sơ xác thực (mã định danh hồ sơ
    `github-copilot:github`) và đổi mã này lấy mã thông báo API Copilot có thời hạn ngắn
    khi OpenClaw chạy. Bạn không cần quản lý mã thông báo theo cách thủ công.
  </Accordion>
</AccordionGroup>

## Nội dung nhúng tìm kiếm bộ nhớ

GitHub Copilot cũng có thể đóng vai trò là nhà cung cấp nội dung nhúng cho
[tìm kiếm bộ nhớ](/vi/concepts/memory-search). Nếu bạn có gói đăng ký Copilot và
đã đăng nhập, OpenClaw có thể sử dụng dịch vụ này cho nội dung nhúng mà không cần khóa API riêng.

### Cấu hình

Đặt rõ `memorySearch.provider` để sử dụng nội dung nhúng GitHub Copilot. Nếu có
mã thông báo GitHub, OpenClaw sẽ khám phá các mô hình nhúng khả dụng từ
API Copilot và tự động chọn mô hình phù hợp nhất.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Tùy chọn: ghi đè mô hình được tự động phát hiện
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Cách hoạt động

1. OpenClaw phân giải mã thông báo GitHub của bạn (từ biến môi trường hoặc hồ sơ xác thực).
2. Đổi mã này lấy mã thông báo API Copilot có thời hạn ngắn.
3. Truy vấn điểm cuối `/models` của Copilot để khám phá các mô hình nhúng khả dụng.
4. Chọn mô hình phù hợp nhất (thứ tự ưu tiên: `text-embedding-3-small`,
   `text-embedding-3-large`, `text-embedding-ada-002`).
5. Gửi yêu cầu nhúng đến điểm cuối `/embeddings` của Copilot.

Tính khả dụng của mô hình phụ thuộc vào gói GitHub của bạn. Nếu không có mô hình nhúng nào
khả dụng, OpenClaw sẽ bỏ qua Copilot và thử nhà cung cấp tiếp theo.

## Nội dung liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và cơ chế chuyển đổi dự phòng.
  </Card>
  <Card title="OAuth và xác thực" href="/vi/gateway/authentication" icon="key">
    Chi tiết xác thực và quy tắc tái sử dụng thông tin xác thực.
  </Card>
</CardGroup>
