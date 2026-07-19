---
read_when:
    - Bạn muốn sử dụng các mô hình Anthropic trong OpenClaw
    - Bạn muốn duyệt các phiên Claude CLI hoặc Claude Desktop trên những máy tính đã ghép đôi
summary: Sử dụng Anthropic Claude qua khóa API hoặc Claude CLI trong OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-19T06:18:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 527129e8d43fbb73f476b3cce7bd4fa05f8450ea337bf36f7ce71219d6cb1a5e
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic phát triển dòng mô hình **Claude**. OpenClaw hỗ trợ hai phương thức xác thực:

- **Khóa API** - truy cập trực tiếp API Anthropic với phương thức tính phí dựa trên mức sử dụng (các mô hình `anthropic/*`)
- **Claude CLI** - sử dụng lại thông tin đăng nhập Claude Code hiện có trên cùng máy chủ

## Theo dõi mức sử dụng và chi phí

OpenClaw phát hiện thông tin xác thực Anthropic khả dụng và chọn giao diện mức sử dụng tương ứng:

- Thông tin xác thực đăng ký/thiết lập Claude hiển thị các khoảng hạn ngạch và ngân sách sử dụng bổ sung tùy chọn.
- `ANTHROPIC_ADMIN_KEY` hoặc `ANTHROPIC_ADMIN_API_KEY` hiển thị 30 ngày chi phí tổ chức và mức sử dụng Messages API do nhà cung cấp báo cáo trong mục **Mức sử dụng** của Control UI, bao gồm chi tiêu hằng ngày, tổng số token/bộ nhớ đệm, các mô hình hàng đầu và các hạng mục chi phí.
- Thông tin xác thực `sk-ant-admin...` được lưu trong hồ sơ nhà cung cấp Anthropic sẽ tự động được phát hiện là khóa Admin API.

Lịch sử chi phí Admin API lấy từ [API mức sử dụng và chi phí](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) của Anthropic. Đây là chi phí thực tế do nhà cung cấp tính, tách biệt với chi phí ước tính của OpenClaw được suy ra từ phiên.

<Warning>
Backend Claude CLI của OpenClaw chạy Claude Code CLI đã cài đặt ở
chế độ in không tương tác (`claude -p`). Tài liệu Claude Code hiện tại của Anthropic
mô tả chế độ đó là cách sử dụng Agent SDK/lập trình. Bản cập nhật hỗ trợ ngày 15 tháng 6 năm 2026
của Anthropic đã tạm dừng thay đổi tính phí Agent SDK riêng biệt từng được công bố: Claude
Agent SDK, `claude -p` và việc sử dụng ứng dụng bên thứ ba vẫn được tính vào
giới hạn sử dụng của gói đăng ký đã đăng nhập, đồng thời khoản tín dụng Agent SDK hằng tháng
được công bố trước đó không khả dụng trong khi Anthropic điều chỉnh kế hoạch này.

Claude Code tương tác vẫn được tính vào giới hạn của gói Claude đã đăng nhập.
Xác thực bằng khóa API được tính phí trực tiếp theo mức sử dụng và không phụ thuộc vào gói đó.
Đối với các máy chủ Gateway hoạt động lâu dài, tác vụ tự động hóa dùng chung và
chi phí vận hành sản xuất có thể dự đoán, hãy sử dụng khóa API Anthropic.

Các bài viết hỗ trợ hiện tại của Anthropic có thể thay đổi hành vi này mà không cần
phát hành phiên bản OpenClaw mới:

- [Tài liệu tham khảo Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [Sử dụng Claude Agent SDK với gói Claude của bạn](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Sử dụng Claude Code với gói Pro hoặc Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Sử dụng Claude Code với gói Team hoặc Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Quản lý chi phí Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Bắt đầu

<Tabs>
  <Tab title="Khóa API">
    **Phù hợp nhất cho:** quyền truy cập API tiêu chuẩn và phương thức tính phí dựa trên mức sử dụng.

    <Steps>
      <Step title="Lấy khóa API">
        Tạo khóa API trong [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Chạy quy trình thiết lập ban đầu">
        ```bash
        openclaw onboard
        # chọn: Khóa API Anthropic
        ```

        Hoặc truyền trực tiếp khóa:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Xác minh mô hình khả dụng">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Ví dụ cấu hình

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Phù hợp nhất cho:** sử dụng lại thông tin đăng nhập Claude CLI hiện có mà không cần khóa API riêng.

    <Steps>
      <Step title="Đảm bảo Claude CLI đã được cài đặt và đăng nhập">
        Xác minh bằng:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Chạy quy trình thiết lập ban đầu">
        ```bash
        openclaw onboard
        # chọn: Claude CLI
        ```

        OpenClaw phát hiện và sử dụng lại thông tin xác thực Claude CLI hiện có.
      </Step>
      <Step title="Xác minh mô hình khả dụng">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Chi tiết thiết lập và thời gian chạy cho backend Claude CLI nằm trong [Các backend CLI](/vi/gateway/cli-backends).
    </Note>

    <Warning>
    Việc sử dụng lại Claude CLI yêu cầu tiến trình OpenClaw chạy trên cùng máy chủ với
    thông tin đăng nhập Claude CLI. Các bản cài đặt Docker có thể duy trì thư mục chính của container và đăng nhập
    Claude Code tại đó; xem
    [Backend Claude CLI trong Docker](/vi/install/docker#claude-cli-backend-in-docker).
    Các bản cài đặt container khác như [Podman](/vi/install/podman) không gắn
    `~/.claude` của máy chủ vào quá trình thiết lập hoặc thời gian chạy; hãy sử dụng khóa API Anthropic tại đó hoặc chọn
    nhà cung cấp có OAuth do OpenClaw quản lý, chẳng hạn như
    [OpenAI Codex](/vi/providers/openai).
    </Warning>

    ### Lấy token thiết lập

    Chạy `claude setup-token` trên bất kỳ máy nào đã cài đặt Claude Code. Lệnh này in ra
    một token dài hạn bắt đầu bằng `sk-ant-oat01-`.

    Trong quá trình thiết lập ban đầu, dán token vào ứng dụng macOS bằng cách chọn
    **Anthropic setup-token** trong **Connect with an API key or token**, hoặc sử dụng:

    ```bash
    openclaw models auth login --provider anthropic --method setup-token
    ```

    ### Ví dụ cấu hình

    Ưu tiên tham chiếu mô hình Anthropic chuẩn cùng với ghi đè thời gian chạy CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Các tham chiếu mô hình `claude-cli/claude-opus-4-7` cũ vẫn hoạt động để
    tương thích, nhưng cấu hình mới nên giữ lựa chọn nhà cung cấp/mô hình là
    `anthropic/*` và đặt backend thực thi trong chính sách thời gian chạy của nhà cung cấp/mô hình.

    ### Thanh toán và `claude -p`

    OpenClaw sử dụng đường dẫn `claude -p` không tương tác của Claude Code cho các lần chạy Claude CLI.
    Anthropic hiện coi đường dẫn đó là cách sử dụng Agent SDK/lập trình:

    - Bản cập nhật hỗ trợ ngày 15 tháng 6 năm 2026 của Anthropic đã tạm dừng kế hoạch tín dụng Agent SDK riêng biệt
      được công bố trước đó.
    - Việc sử dụng Claude Agent SDK theo gói đăng ký, `claude -p` và ứng dụng bên thứ ba
      vẫn được tính vào giới hạn sử dụng của gói đăng ký đã đăng nhập.
    - Khoản tín dụng Agent SDK hằng tháng được công bố trước đó không khả dụng trong khi
      Anthropic điều chỉnh kế hoạch này.
    - Thông tin đăng nhập Console/khóa API sử dụng phương thức tính phí API theo mức sử dụng và không nhận được
      tín dụng Agent SDK của gói đăng ký.

    Xem [bài viết về gói Agent SDK
    của Anthropic](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    để biết thông báo tạm dừng, và các bài viết về gói Claude Code để biết hành vi của gói đăng ký
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    và
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic có thể thay đổi hành vi tính phí và giới hạn tốc độ của Claude Code mà không cần
    phát hành phiên bản OpenClaw mới. Hãy kiểm tra `claude auth status`, `/status` và
    tài liệu Anthropic được liên kết khi khả năng dự đoán chi phí là yếu tố quan trọng.

    <Tip>
    Đối với tác vụ tự động hóa sản xuất dùng chung, hãy sử dụng khóa API Anthropic thay vì
    Claude CLI. OpenClaw cũng hỗ trợ các tùy chọn theo kiểu đăng ký từ
    [OpenAI Codex](/vi/providers/openai), [Qwen Cloud](/vi/providers/qwen),
    [MiniMax](/vi/providers/minimax) và [Z.AI / GLM](/vi/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Các phiên Claude trên nhiều máy tính

Plugin Anthropic đi kèm bổ sung nhóm **Claude Code** vào thanh bên phiên
thông thường. Các hàng mở trong ngăn Trò chuyện thông thường. Plugin phát hiện các phiên Claude
Code chưa được lưu trữ trên Gateway và trên các máy chủ node đã kết nối:

- Các phiên Claude CLI đến từ bản ghi chỉ mục dự án hợp lệ và các tệp JSONL hiện tại
  có tiền tố siêu dữ liệu bị giới hạn xác định một phiên `sdk-cli`
  không phải sidechain trong `~/.claude/projects/`.
- Các phiên Claude Desktop sử dụng tiêu đề Desktop, thời gian hoạt động và
  trạng thái lưu trữ khi siêu dữ liệu của chúng trỏ đến cùng một ID phiên Claude Code.
- Phiên chỉ có CLI không có cờ lưu trữ, vì vậy phiên đó vẫn hiển thị khi
  bản ghi hội thoại còn tồn tại.

Không cần cấu hình OpenClaw bổ sung để phát hiện. Plugin Anthropic
được đi kèm và bật theo mặc định; node macOS gốc quảng bá các lệnh phiên Claude
chỉ đọc khi thư mục `~/.claude/projects/` cục bộ tồn tại.
Hãy phê duyệt nâng cấp ghép nối node khi các lệnh đó xuất hiện lần đầu.

Thanh bên nhóm các hàng theo Gateway hoặc máy chủ node đã ghép nối và hiển thị
trang giới hạn mới nhất của mỗi máy chủ ngay khi máy tính đó phản hồi. Thanh bên đối soát lại
sau khi kết nối máy chủ thay đổi, khi trang lấy lại tiêu điểm và tối đa mỗi
30 giây khi đang hiển thị, nhờ đó các phiên Claude được tạo bên ngoài OpenClaw xuất hiện
mà không cần tải lại. Danh mục đã thay đổi sẽ kích hoạt lượt theo dõi nhanh hơn. Sử dụng **Tải thêm
phiên** bên dưới một nhóm danh mục để nối thêm trang tiếp theo cho mọi máy chủ có
thêm lịch sử; các hàng được nối thêm vẫn hiển thị và được tìm nạp lại đến cùng độ sâu
qua các lần làm mới. Các máy khách danh mục sử dụng `sessions.catalog.list`; việc mở một hàng sử dụng
`sessions.catalog.read`.

Quyền tiếp quản terminal phân giải `claude` từ PATH của shell đăng nhập của người dùng máy chủ sở hữu
trước PATH của dịch vụ/daemon. Điều này giữ cho các phiên được khởi chạy từ ứng dụng đồng nhất
với Claude CLI mà người vận hành nhận được trong terminal thông thường.

Việc chọn một hàng sẽ đọc trang bản ghi hội thoại mới nhất trước. **Tải các mục bản ghi hội thoại
cũ hơn** đi theo con trỏ byte mờ và đọc một phần giới hạn khác từ
tệp JSONL thay vì tải toàn bộ lịch sử. Nội dung thông thường của người dùng, trợ lý,
lập luận, lệnh gọi công cụ và kết quả công cụ được giữ nguyên. Một mục riêng lẻ
lớn hơn giới hạn an toàn của node/Gateway được đánh dấu rõ ràng là đã bị cắt bớt.

Đối với hàng `claude-cli` cục bộ trên Gateway, việc nhập trong trình soạn thảo thông thường sẽ gọi
`sessions.catalog.continue`. OpenClaw phân giải lại bản ghi danh mục cục bộ,
tạo hoặc sử dụng lại phiên gốc bị khóa theo mô hình, nhập tối đa 200 mục hiển thị
hoặc 512 KiB và khởi tạo liên kết Claude CLI. Lượt đầu tiên tiếp tục với
`--fork-session`; Claude gán cho bản phân nhánh một ID phiên mới, vì vậy các lượt sau sử dụng
bản phân nhánh còn phiên nguồn không bị thay đổi.

Máy chủ node không có giao diện cũng có thể cho phép tiếp tục các hàng Claude CLI bằng cách bật
cài đặt cục bộ của node bên dưới rồi khởi động lại máy chủ node:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

Node chỉ quảng bá `agent.cli.claude.run.v1` khi cài đặt được bật
và tệp thực thi `claude` cục bộ của node được phân giải. OpenClaw phân giải lại bản ghi danh mục
trên node đó, nhập cùng phần lịch sử bị giới hạn và liên kết phiên được tiếp quản
với node và thư mục làm việc do danh mục báo cáo. Mỗi lượt chạy tiến trình
`claude -p` thực của node bằng các tệp Claude và thông tin đăng nhập của node đó. Chính sách
phê duyệt thực thi của node vẫn áp dụng; Gateway không thể ép buộc việc chủ động bật tính năng này.

Tính năng tiếp tục trên node v1 chỉ dùng một lần. Tính năng này bỏ qua cấu hình MCP vòng lặp Gateway và
các đối số Plugin Skills của Gateway, không khởi tạo lại từ bản ghi hội thoại Gateway,
đồng thời từ chối tệp đính kèm và hình ảnh. Các hàng Claude Desktop vẫn chỉ có thể xem. Các
node ứng dụng macOS gốc cũng vẫn chỉ có thể xem cho đến khi ứng dụng quảng bá lệnh chạy.

<Note>
Các phiên Claude trên node đã ghép nối vẫn ở chế độ chỉ đọc trừ khi node không có giao diện quảng bá rõ ràng
`agent.cli.claude.run.v1`. OpenClaw không bao giờ sửa đổi siêu dữ liệu Claude Desktop
hoặc lưu trữ các phiên Claude. Trang này yêu cầu kết nối người vận hành
có phạm vi ghi vì sử dụng `node.invoke` đã xác thực; thao tác liệt kê và đọc
vẫn ở chế độ chỉ đọc ngay cả trên node đã bật tính năng tiếp tục.
</Note>

Xem [Node: phiên Claude và bản ghi hội thoại](/vi/nodes#claude-sessions-and-transcripts)
để biết lệnh Node và ranh giới bảo mật.

## Thiết lập mặc định về suy luận (Claude Sonnet 5, Mythos 5, Fable 5, 4.8 và 4.6)

`anthropic/claude-sonnet-5` mặc định sử dụng suy luận thích ứng với mức nỗ lực `high`.
Dùng `/think off` để tắt suy luận hoặc `/think xhigh|max` để sử dụng các
mức nỗ lực gốc cao hơn của mô hình. OpenClaw bỏ qua ngân sách suy luận thủ công,
tham số lấy mẫu tùy chỉnh, phần điền trước của trợ lý và Priority Tier đối với
Sonnet 5 vì Anthropic không hỗ trợ các tính năng yêu cầu này trên mô hình đó.
Danh mục sử dụng mức giá đầu vào/đầu ra giới thiệu `$2/$10` của Anthropic đến hết
ngày 31 tháng 8 năm 2026; mức giá tiêu chuẩn `$3/$15` bắt đầu từ ngày 1 tháng 9 năm 2026.

`anthropic/claude-fable-5` luôn sử dụng suy luận thích ứng và mặc định có mức nỗ lực
`high`. Anthropic không cho phép tắt suy luận đối với mô hình này, vì vậy
`/think off` và `/think minimal` được ánh xạ sang mức nỗ lực `low`. OpenClaw cũng
bỏ qua các giá trị nhiệt độ tùy chỉnh cho yêu cầu Fable 5 vì Anthropic từ chối
ghi đè nhiệt độ đối với mọi yêu cầu đã bật suy luận.

`anthropic/claude-mythos-5` là mô hình có quyền truy cập hạn chế với cùng hợp đồng
suy luận thích ứng luôn bật. OpenClaw mặc định dùng `high`, ánh xạ `/think off` và
`/think minimal` sang `low`, đồng thời bỏ qua các tham số lấy mẫu do bên gọi chọn.
Danh mục công bố cửa sổ ngữ cảnh 1.000.000 token, giới hạn đầu ra 128.000 token,
đầu vào hình ảnh và mức giá đầu vào/đầu ra `$10/$50` của mô hình này.

Claude Opus 4.8 duy trì trạng thái tắt suy luận theo mặc định trong OpenClaw. Khi bạn
bật rõ ràng suy luận thích ứng bằng `/think high|xhigh|max`, OpenClaw sẽ gửi
các giá trị nỗ lực Opus 4.8 của Anthropic; các mô hình Claude 4.6 (Opus 4.6 và Sonnet 4.6)
mặc định dùng `adaptive`.

Ghi đè cho từng tin nhắn bằng `/think:<level>` hoặc trong tham số mô hình:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
Tài liệu Anthropic liên quan:
- [Suy luận thích ứng](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Suy luận mở rộng](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Cơ chế dự phòng khi từ chối vì an toàn (Claude Fable 5)

<Warning>
Sử dụng Claude Fable 5 cũng đồng nghĩa với việc sử dụng Claude Opus 4.8. Fable 5 đi kèm
các bộ phân loại an toàn có thể từ chối một yêu cầu, và cơ chế khôi phục được Anthropic
chấp thuận là để `claude-opus-4-8` phục vụ lượt đó. OpenClaw tự động chọn tham gia cơ chế này
đối với các yêu cầu trực tiếp bằng khóa API, vì vậy một số lượt Fable được Claude Opus 4.8
trả lời và tính phí. Nếu chính sách hoặc ngân sách của bạn không thể chấp nhận
các lượt do Opus phục vụ, đừng chọn `anthropic/claude-fable-5`.
</Warning>

### Lý do tồn tại

Các bộ phân loại của Fable 5 trả về `stop_reason: "refusal"` đối với yêu cầu thuộc
các lĩnh vực bị hạn chế, đồng thời cũng có thể nhận diện nhầm đối với công việc lành tính
nhưng có liên quan (công cụ bảo mật, khoa học sự sống hoặc thậm chí yêu cầu mô hình tái tạo
suy luận thô của chính nó). Nếu không có cơ chế dự phòng, lượt sẽ kết thúc bằng lỗi dù
một mô hình Claude khác vẫn có thể xử lý bình thường — thông báo từ chối của chính Anthropic
yêu cầu các bên tích hợp API cấu hình một mô hình dự phòng.

### Cách hoạt động

1. Đối với mọi yêu cầu trực tiếp bằng khóa API tới `anthropic/claude-fable-5`, OpenClaw
   gửi tùy chọn tham gia cơ chế dự phòng phía máy chủ của Anthropic: tiêu đề beta
   `server-side-fallback-2026-06-01` cùng với
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 là mục tiêu
   dự phòng duy nhất mà Anthropic cho phép đối với Fable 5.
2. Chỉ trường hợp bộ phân loại an toàn từ chối mới kích hoạt cơ chế dự phòng. Giới hạn tốc độ,
   quá tải và lỗi máy chủ hoạt động hoàn toàn như trước và được xử lý qua
   cơ chế [chuyển đổi dự phòng mô hình](/vi/concepts/model-failover) thông thường của OpenClaw.
3. Quá trình khôi phục diễn ra trong cùng một lệnh gọi. Trường hợp từ chối trước khi có đầu ra
   sẽ không thể nhận biết ngoài độ trễ; toàn bộ câu trả lời đến từ Opus 4.8. Khi
   bị từ chối giữa luồng, phần văn bản đã tạo được giữ lại làm tiền tố để mô hình dự phòng
   tiếp tục, còn phần suy luận và các lệnh gọi công cụ của mô hình đã từ chối
   bị loại bỏ theo quy tắc phát lại của Anthropic (không được phản hồi lại hoặc
   thực thi chúng).
4. Nếu Claude Opus 4.8 cũng từ chối, lượt sẽ hiển thị lời từ chối dưới dạng
   lỗi, hoàn toàn giống như trước khi có tính năng này.

Cơ chế dự phòng diễn ra ở cấp API Anthropic, vì vậy `claude-opus-4-8` không
cần nằm trong danh sách mô hình hoặc chuỗi dự phòng đã cấu hình — khóa API
có khả năng dùng Fable luôn có thể phục vụ Opus.

### Khả năng quan sát và tính phí

- Một lượt do mô hình dự phòng phục vụ sẽ ghi lại chẩn đoán `provider_fallback` trên
  tin nhắn của trợ lý, trong đó nêu `fromModel` và `toModel`; đồng thời
  `responseModel` của tin nhắn báo cáo `claude-opus-4-8`.
- Anthropic tính phí theo từng lần thử: trường hợp từ chối trước khi có đầu ra không mất phí,
  còn lượt khôi phục được tính theo mức giá Claude Opus 4.8 (hiện bằng một nửa mức giá
  Fable 5). Ước tính chi phí theo lượt của OpenClaw định giá các lượt do mô hình dự phòng
  phục vụ theo mức giá Opus để khớp với cách tính này.
- Trường hợp từ chối giữa luồng còn bị Anthropic tính phí cho phần Fable đã truyền phát;
  phần đó được báo cáo trong mức sử dụng theo từng lần thử của API nhưng không được cộng
  vào ước tính theo lượt của OpenClaw.

### Phạm vi

Áp dụng cho `anthropic/claude-fable-5` sử dụng phương thức xác thực bằng khóa API với
`api.anthropic.com`. OAuth (tái sử dụng gói đăng ký Claude CLI), URL cơ sở proxy,
các yêu cầu Bedrock, Vertex và Foundry không thay đổi và vẫn hiển thị
lời từ chối dưới dạng lỗi tại đó.

Đã xác minh trực tiếp: một lời nhắc lành tính yêu cầu Fable 5 tái tạo chuỗi
suy luận thô của chính nó bị từ chối với `category: "reasoning_extraction"` khi gửi mà không có
cơ chế dự phòng, còn cùng lời nhắc đó thông qua OpenClaw trả về câu trả lời bình thường
do Opus phục vụ, kèm theo chẩn đoán `provider_fallback`.

Xem [hướng dẫn về lời từ chối và cơ chế dự phòng của Anthropic](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
để biết hành vi nền tảng.

## Bộ nhớ đệm lời nhắc

OpenClaw hỗ trợ tính năng bộ nhớ đệm lời nhắc của Anthropic đối với phương thức xác thực bằng khóa API.

| Giá trị               | Thời lượng bộ nhớ đệm | Mô tả                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (mặc định) | 5 phút      | Tự động áp dụng cho phương thức xác thực bằng khóa API |
| `"long"`            | 1 giờ         | Bộ nhớ đệm mở rộng                         |
| `"none"`            | Không lưu vào bộ nhớ đệm     | Tắt bộ nhớ đệm lời nhắc                 |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Ghi đè bộ nhớ đệm theo từng tác nhân">
    Dùng tham số cấp mô hình làm giá trị cơ sở, sau đó ghi đè cho các tác nhân cụ thể qua `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Thứ tự hợp nhất cấu hình:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (khớp với `id`, ghi đè theo khóa)

    Điều này cho phép một tác nhân duy trì bộ nhớ đệm dài hạn, trong khi một tác nhân khác sử dụng cùng mô hình có thể tắt bộ nhớ đệm cho lưu lượng đột biến/ít tái sử dụng.

  </Accordion>

  <Accordion title="Ghi chú về Claude trên Bedrock">
    - Các mô hình Anthropic Claude trên Bedrock (`amazon-bedrock/*anthropic.claude*`) chấp nhận truyền trực tiếp `cacheRetention` khi được cấu hình.
    - Các mô hình Bedrock không phải Anthropic bị buộc sử dụng `cacheRetention: "none"` trong thời gian chạy.
    - Các giá trị mặc định thông minh dành cho khóa API cũng khởi tạo `cacheRetention: "short"` cho các tham chiếu Claude trên Bedrock khi không đặt giá trị rõ ràng.

  </Accordion>
</AccordionGroup>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Chế độ nhanh">
    Nút chuyển đổi `/fast` dùng chung của OpenClaw đặt trường `service_tier` của Anthropic thành `api.anthropic.com` đối với lưu lượng trực tiếp sử dụng khóa API.

    | Lệnh | Ánh xạ tới |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Chỉ áp dụng cho các yêu cầu `api.anthropic.com` trực tiếp được thực hiện bằng khóa API. Các yêu cầu bằng OAuth/token đăng ký và các tuyến proxy không bao giờ nhận trường `service_tier`.
    - Các tham số `serviceTier` hoặc `service_tier` được đặt rõ ràng sẽ ghi đè `/fast` khi cả hai cùng được đặt.
    - Trên các tài khoản không có dung lượng Priority Tier, `service_tier: "auto"` có thể được phân giải thành `standard`.

    </Note>

  </Accordion>

  <Accordion title="Hiểu nội dung đa phương tiện (hình ảnh và PDF)">
    Plugin Anthropic đi kèm đăng ký khả năng hiểu hình ảnh và PDF. OpenClaw
    tự động phân giải các khả năng đa phương tiện từ phương thức xác thực Anthropic đã cấu hình;
    không cần cấu hình bổ sung.

    | Thuộc tính       | Giá trị               |
    | --------------- | --------------------- |
    | Mô hình mặc định | `claude-opus-4-8`     |
    | Đầu vào được hỗ trợ | Hình ảnh, tài liệu PDF |

    Khi một hình ảnh hoặc PDF được đính kèm vào cuộc hội thoại, OpenClaw tự động
    định tuyến nội dung đó qua nhà cung cấp khả năng hiểu đa phương tiện Anthropic.

  </Accordion>

  <Accordion title="Cửa sổ ngữ cảnh 1M">
    Claude Sonnet 5, Mythos 5 và Fable 5 có cửa sổ đầu vào chính xác
    1,000,000 token và hỗ trợ tối đa 128,000 token đầu ra. Cửa sổ ngữ cảnh
    1M của Anthropic cũng đã khả dụng rộng rãi trên các mô hình Claude 4.x có tư duy thích ứng: Opus 4.8,
    Opus 4.7, Opus 4.6 và Sonnet 4.6. OpenClaw tự động xác định kích thước
    cho các mô hình này, không cần `params.context1m`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-5": {},
            "anthropic/claude-mythos-5": {},
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Các cấu hình cũ có thể giữ lại `params.context1m: true`; đây là thao tác không gây ảnh hưởng đối với
    các mô hình này và OpenClaw không còn gửi tiêu đề beta
    `context-1m-2025-08-07` đã ngừng sử dụng trong mọi trường hợp. Các mục cấu hình `anthropicBeta` cũ
    có giá trị đó sẽ bị loại bỏ trong quá trình phân giải tiêu đề yêu cầu, còn
    các mô hình Claude cũ không được hỗ trợ vẫn sử dụng cửa sổ ngữ cảnh thông thường.

    `params.context1m: true` hoạt động tương tự đối với phần phụ trợ CLI Claude
    (`claude-cli/*`): các mô hình Opus và Sonnet đủ điều kiện hỗ trợ GA đã tự động nhận
    cửa sổ 1M, vì vậy tham số này cũng là tùy chọn tại đó.

    <Warning>
    Yêu cầu thông tin xác thực Anthropic của bạn có quyền truy cập ngữ cảnh dài. Xác thực bằng OAuth/token đăng ký vẫn giữ các tiêu đề beta Anthropic bắt buộc, nhưng OpenClaw loại bỏ tiêu đề beta 1M đã ngừng sử dụng nếu tiêu đề này vẫn còn trong cấu hình cũ.
    </Warning>

  </Accordion>

  <Accordion title="Ngữ cảnh 1M của Claude Opus 4.8">
    `anthropic/claude-opus-4-8` và biến thể `claude-cli` của nó mặc định có cửa sổ ngữ cảnh
    1M; không cần `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Lỗi 401/token đột nhiên không hợp lệ">
    Xác thực bằng token Anthropic sẽ hết hạn và có thể bị thu hồi. Đối với thiết lập mới, hãy sử dụng khóa API Anthropic.
  </Accordion>

  <Accordion title='Không tìm thấy khóa API cho nhà cung cấp "anthropic"'>
    Phương thức xác thực Anthropic được cấu hình **theo từng tác nhân**; các tác nhân mới không kế thừa khóa của tác nhân chính. Chạy lại quy trình thiết lập ban đầu cho tác nhân đó (hoặc cấu hình khóa API trên máy chủ Gateway), sau đó xác minh bằng `openclaw models status`.
  </Accordion>

  <Accordion title='Không tìm thấy thông tin xác thực cho hồ sơ "anthropic:default"'>
    Chạy `openclaw models status` để xem hồ sơ xác thực nào đang hoạt động. Chạy lại quy trình thiết lập ban đầu hoặc cấu hình khóa API cho đường dẫn hồ sơ đó.
  </Accordion>

  <Accordion title="Không có hồ sơ xác thực khả dụng (tất cả đang trong thời gian chờ)">
    Kiểm tra `openclaw models status --json` cho `auth.unusableProfiles`. Thời gian chờ do giới hạn tốc độ của Anthropic có thể áp dụng theo từng mô hình, vì vậy một mô hình Anthropic cùng nhóm vẫn có thể sử dụng được. Thêm một hồ sơ Anthropic khác hoặc chờ hết thời gian chờ.
  </Accordion>
</AccordionGroup>

<Note>
Trợ giúp thêm: [Khắc phục sự cố](/vi/help/troubleshooting) và [Câu hỏi thường gặp](/vi/help/faq).
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và cơ chế chuyển đổi dự phòng.
  </Card>
  <Card title="Backend CLI" href="/vi/gateway/cli-backends" icon="terminal">
    Thiết lập backend Claude CLI và thông tin chi tiết về runtime.
  </Card>
  <Card title="Bộ nhớ đệm prompt" href="/vi/reference/prompt-caching" icon="database">
    Cách bộ nhớ đệm prompt hoạt động trên các nhà cung cấp.
  </Card>
  <Card title="OAuth và xác thực" href="/vi/gateway/authentication" icon="key">
    Thông tin chi tiết về xác thực và các quy tắc tái sử dụng thông tin xác thực.
  </Card>
</CardGroup>
