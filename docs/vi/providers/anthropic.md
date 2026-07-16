---
read_when:
    - Bạn muốn sử dụng các mô hình Anthropic trong OpenClaw
    - Bạn muốn duyệt các phiên Claude CLI hoặc Claude Desktop trên các máy tính đã ghép đôi
summary: Sử dụng Anthropic Claude qua khóa API hoặc Claude CLI trong OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-16T15:44:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a61b4585092586727df48f7b809be73d80b0a9f1400294e76aea1b48313a216
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic phát triển dòng mô hình **Claude**. OpenClaw hỗ trợ hai phương thức xác thực:

- **Khóa API** - truy cập trực tiếp API Anthropic với hình thức tính phí theo mức sử dụng (các mô hình `anthropic/*`)
- **Claude CLI** - tái sử dụng thông tin đăng nhập Claude Code hiện có trên cùng máy chủ

## Theo dõi mức sử dụng và chi phí

OpenClaw phát hiện thông tin xác thực Anthropic khả dụng và chọn giao diện mức sử dụng tương ứng:

- Thông tin xác thực đăng ký/thiết lập Claude hiển thị các khoảng hạn mức và ngân sách sử dụng bổ sung tùy chọn.
- `ANTHROPIC_ADMIN_KEY` hoặc `ANTHROPIC_ADMIN_API_KEY` hiển thị chi phí tổ chức và mức sử dụng Messages API do nhà cung cấp báo cáo trong 30 ngày trên mục **Mức sử dụng** của Control UI, bao gồm chi tiêu hằng ngày, tổng số token/bộ nhớ đệm, các mô hình được dùng nhiều nhất và các danh mục chi phí.
- Thông tin xác thực `sk-ant-admin...` được lưu trong hồ sơ nhà cung cấp Anthropic sẽ tự động được phát hiện là khóa Admin API.

Lịch sử chi phí Admin API lấy từ [API Mức sử dụng và Chi phí](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) của Anthropic. Đây là chi phí thực tế do nhà cung cấp tính, tách biệt với chi phí ước tính của OpenClaw được suy ra từ phiên.

<Warning>
Backend Claude CLI của OpenClaw chạy Claude Code CLI đã cài đặt ở
chế độ in không tương tác (`claude -p`). Tài liệu Claude Code hiện tại của Anthropic
mô tả chế độ đó là hoạt động sử dụng Agent SDK/lập trình. Bản cập nhật hỗ trợ ngày 15 tháng 6 năm 2026
của Anthropic đã tạm dừng thay đổi riêng về tính phí Agent SDK từng được công bố: Claude
Agent SDK, `claude -p` và hoạt động sử dụng ứng dụng bên thứ ba vẫn được tính vào
giới hạn sử dụng của gói đăng ký đã đăng nhập, còn khoản tín dụng Agent SDK hằng tháng
từng được công bố không khả dụng trong khi Anthropic sửa đổi kế hoạch đó.

Claude Code tương tác vẫn được tính vào giới hạn của gói Claude đã đăng nhập.
Xác thực bằng khóa API được tính phí trực tiếp theo mức sử dụng và không phụ thuộc vào gói đó.
Đối với các máy chủ Gateway hoạt động lâu dài, tác vụ tự động hóa dùng chung và
chi phí sản xuất có thể dự đoán, hãy sử dụng khóa API Anthropic.

Các bài viết hỗ trợ hiện tại của Anthropic có thể thay đổi hành vi này mà không cần
phát hành phiên bản OpenClaw mới:

- [Tài liệu tham khảo Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [Sử dụng Claude Agent SDK với gói Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Sử dụng Claude Code với gói Pro hoặc Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Sử dụng Claude Code với gói Team hoặc Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Quản lý chi phí Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Bắt đầu

<Tabs>
  <Tab title="Khóa API">
    **Phù hợp nhất cho:** truy cập API tiêu chuẩn và tính phí theo mức sử dụng.

    <Steps>
      <Step title="Lấy khóa API">
        Tạo khóa API trong [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Chạy quy trình thiết lập ban đầu">
        ```bash
        openclaw onboard
        # chọn: khóa API Anthropic
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
    **Phù hợp nhất cho:** tái sử dụng thông tin đăng nhập Claude CLI hiện có mà không cần khóa API riêng.

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

        OpenClaw phát hiện và tái sử dụng thông tin xác thực Claude CLI hiện có.
      </Step>
      <Step title="Xác minh mô hình khả dụng">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Chi tiết thiết lập và thời gian chạy cho backend Claude CLI có trong [Các backend CLI](/vi/gateway/cli-backends).
    </Note>

    <Warning>
    Việc tái sử dụng Claude CLI yêu cầu tiến trình OpenClaw chạy trên cùng máy chủ với
    thông tin đăng nhập Claude CLI. Các bản cài đặt Docker có thể duy trì thư mục chính của vùng chứa và đăng nhập vào
    Claude Code tại đó; xem
    [Backend Claude CLI trong Docker](/vi/install/docker#claude-cli-backend-in-docker).
    Các bản cài đặt vùng chứa khác như [Podman](/vi/install/podman) không gắn
    `~/.claude` của máy chủ vào quá trình thiết lập hoặc thời gian chạy; hãy sử dụng khóa API Anthropic tại đó hoặc chọn
    nhà cung cấp có OAuth do OpenClaw quản lý, chẳng hạn như
    [OpenAI Codex](/vi/providers/openai).
    </Warning>

    ### Lấy token thiết lập

    Chạy `claude setup-token` trên bất kỳ máy nào đã cài đặt Claude Code. Lệnh này in ra
    một token dài hạn bắt đầu bằng `sk-ant-oat01-`.

    Trong quá trình thiết lập ban đầu, hãy dán token vào ứng dụng macOS bằng cách chọn
    **Anthropic setup-token** trong **Connect with an API key or token**, hoặc sử dụng:

    ```bash
    openclaw models auth login --provider anthropic --method setup-token
    ```

    ### Ví dụ cấu hình

    Ưu tiên tham chiếu mô hình Anthropic chuẩn cùng với phần ghi đè môi trường chạy CLI:

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
    duy trì khả năng tương thích, nhưng cấu hình mới nên giữ lựa chọn nhà cung cấp/mô hình là
    `anthropic/*` và đặt backend thực thi trong chính sách thời gian chạy của nhà cung cấp/mô hình.

    ### Tính phí và `claude -p`

    OpenClaw sử dụng đường dẫn `claude -p` không tương tác của Claude Code cho các lượt chạy Claude CLI.
    Anthropic hiện coi đường dẫn đó là hoạt động sử dụng Agent SDK/lập trình:

    - Bản cập nhật hỗ trợ ngày 15 tháng 6 năm 2026 của Anthropic đã tạm dừng kế hoạch tín dụng
      Agent SDK riêng từng được công bố.
    - Hoạt động sử dụng Claude Agent SDK, `claude -p` và ứng dụng bên thứ ba theo gói đăng ký
      vẫn được tính vào giới hạn sử dụng của gói đăng ký đã đăng nhập.
    - Khoản tín dụng Agent SDK hằng tháng từng được công bố không khả dụng trong khi
      Anthropic sửa đổi kế hoạch đó.
    - Thông tin đăng nhập Console/khóa API sử dụng hình thức tính phí API theo mức sử dụng và không nhận
      tín dụng Agent SDK của gói đăng ký.

    Xem [bài viết về gói Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    của Anthropic để biết thông báo tạm dừng, cũng như các bài viết về gói Claude Code để biết hành vi của gói đăng ký
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    và
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic có thể thay đổi hành vi tính phí và giới hạn tốc độ của Claude Code mà không cần
    phát hành phiên bản OpenClaw mới. Hãy kiểm tra `claude auth status`, `/status` và
    tài liệu Anthropic được liên kết khi khả năng dự đoán chi phí là yếu tố quan trọng.

    <Tip>
    Đối với tác vụ tự động hóa sản xuất dùng chung, hãy sử dụng khóa API Anthropic thay vì
    Claude CLI. OpenClaw cũng hỗ trợ các tùy chọn theo hình thức đăng ký từ
    [OpenAI Codex](/vi/providers/openai), [Qwen Cloud](/vi/providers/qwen),
    [MiniMax](/vi/providers/minimax) và [Z.AI / GLM](/vi/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Các phiên Claude trên nhiều máy tính

Plugin Anthropic đi kèm bổ sung một nhóm **Claude Code** vào thanh bên phiên
thông thường. Các hàng mở trong ngăn Trò chuyện thông thường. Plugin phát hiện các phiên Claude
Code chưa lưu trữ trên Gateway và trên các máy chủ Node đã kết nối:

- Các phiên Claude CLI lấy từ bản ghi chỉ mục dự án hợp lệ và các tệp JSONL
  hiện tại có phần tiền tố siêu dữ liệu giới hạn xác định một phiên `sdk-cli`
  không phải sidechain trong `~/.claude/projects/`.
- Các phiên Claude Desktop sử dụng tiêu đề Desktop, thời gian hoạt động và
  trạng thái lưu trữ khi siêu dữ liệu của ứng dụng trỏ đến cùng ID phiên Claude Code.
- Phiên chỉ có CLI không có cờ lưu trữ, vì vậy phiên đó vẫn hiển thị khi
  bản ghi hội thoại còn tồn tại.

Không cần cấu hình OpenClaw bổ sung để khám phá. Plugin Anthropic
được đi kèm và bật theo mặc định; Node macOS gốc quảng bá các lệnh chỉ đọc
cho phiên Claude khi thư mục `~/.claude/projects/` cục bộ tồn tại.
Phê duyệt nâng cấp ghép nối Node khi các lệnh đó xuất hiện lần đầu.

Thanh bên nhóm các hàng theo Gateway hoặc máy chủ Node đã ghép nối, bắt đầu bằng
trang giới hạn mới nhất từ mỗi máy chủ và làm mới theo chu kỳ 30 giây
thông thường. Sử dụng **Tải thêm phiên** bên dưới một nhóm danh mục để nối thêm trang tiếp theo
cho mọi máy chủ có thêm lịch sử; các hàng được nối thêm vẫn hiển thị và được
tải lại đến cùng độ sâu qua các lần làm mới. Máy khách danh mục sử dụng
`sessions.catalog.list`; thao tác mở một hàng sử dụng `sessions.catalog.read`.

Việc tiếp quản terminal phân giải `claude` từ PATH của shell đăng nhập
của người dùng sở hữu máy chủ trước PATH của dịch vụ/daemon. Điều này giúp các phiên được khởi chạy
từ ứng dụng phù hợp với Claude CLI mà người vận hành sử dụng trong terminal thông thường.

Khi chọn một hàng, trang bản ghi hội thoại mới nhất được đọc trước. **Tải các mục bản ghi hội thoại
cũ hơn** đi theo con trỏ byte không trong suốt và đọc một phần giới hạn khác từ
tệp JSONL thay vì tải toàn bộ lịch sử. Nội dung thông thường của người dùng, trợ lý,
lập luận, lệnh gọi công cụ và kết quả công cụ được giữ nguyên. Mỗi mục riêng lẻ
lớn hơn giới hạn an toàn của Node/Gateway được đánh dấu rõ là đã cắt bớt.

Đối với hàng `claude-cli` cục bộ trên Gateway, thao tác nhập trong trình soạn thảo thông thường sẽ gọi
`sessions.catalog.continue`. OpenClaw phân giải lại bản ghi danh mục cục bộ,
tạo hoặc tái sử dụng một phiên gốc đã khóa mô hình, nhập tối đa 200 mục hiển thị
hoặc 512 KiB và khởi tạo liên kết Claude CLI. Lượt đầu tiên tiếp tục bằng
`--fork-session`; Claude gán một ID phiên mới cho nhánh rẽ, vì vậy các lượt sau sử dụng
nhánh rẽ còn phiên nguồn không bị thay đổi.

Máy chủ Node không giao diện cũng có thể cho phép tiếp tục các hàng Claude CLI bằng cách bật
cài đặt cục bộ của Node bên dưới và khởi động lại máy chủ Node:

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
và tệp thực thi `claude` cục bộ được phân giải. OpenClaw phân giải lại bản ghi danh mục
trên Node đó, nhập cùng phần lịch sử giới hạn và liên kết phiên được tiếp nhận
với Node cũng như thư mục làm việc do danh mục báo cáo. Mỗi lượt chạy tiến trình
`claude -p` thực tế của Node bằng các tệp và thông tin đăng nhập Claude trên Node đó. Chính sách
phê duyệt thực thi của Node vẫn được áp dụng; Gateway không thể ép buộc lựa chọn tham gia.

Khả năng tiếp tục trên Node v1 chỉ chạy một lần. Tính năng này bỏ qua cấu hình MCP vòng lặp Gateway và
các đối số Plugin Skills của Gateway, không khởi tạo lại từ bản ghi hội thoại Gateway và
từ chối tệp đính kèm cùng hình ảnh. Các hàng Claude Desktop vẫn chỉ có thể xem. Các
Node ứng dụng macOS gốc cũng vẫn chỉ có thể xem cho đến khi ứng dụng quảng bá lệnh chạy.

<Note>
Các phiên Claude trên Node đã ghép nối vẫn ở chế độ chỉ đọc trừ khi Node không giao diện quảng bá rõ ràng
`agent.cli.claude.run.v1`. OpenClaw không bao giờ sửa đổi siêu dữ liệu Claude Desktop
hoặc lưu trữ các phiên Claude. Trang này yêu cầu kết nối người vận hành
có phạm vi ghi vì sử dụng `node.invoke` đã xác thực; thao tác liệt kê và đọc
vẫn chỉ đọc ngay cả trên Node đã bật khả năng tiếp tục.
</Note>

Xem [Node: Các phiên và bản ghi hội thoại Claude](/vi/nodes#claude-sessions-and-transcripts)
để biết lệnh Node và ranh giới bảo mật.

## Mặc định tư duy (Claude Sonnet 5, Mythos 5, Fable 5, 4.8 và 4.6)

`anthropic/claude-sonnet-5` sử dụng khả năng suy luận thích ứng ở mức nỗ lực `high` theo mặc định.
Dùng `/think off` để tắt suy luận hoặc `/think xhigh|max` để sử dụng các
mức nỗ lực gốc cao hơn của mô hình. OpenClaw bỏ qua ngân sách suy luận thủ công,
tham số lấy mẫu tùy chỉnh, phần điền trước của trợ lý và Priority Tier cho Sonnet 5 vì
Anthropic không hỗ trợ các tính năng yêu cầu đó trên mô hình này.
Danh mục sử dụng mức giá đầu vào/đầu ra giới thiệu `$2/$10` của Anthropic đến hết
ngày 31 tháng 8 năm 2026; mức giá tiêu chuẩn `$3/$15` bắt đầu từ ngày 1 tháng 9 năm 2026.

`anthropic/claude-fable-5` luôn sử dụng khả năng suy luận thích ứng và mặc định ở mức nỗ lực
`high`. Anthropic không cho phép tắt suy luận đối với mô hình này, vì vậy
`/think off` và `/think minimal` được ánh xạ sang mức nỗ lực `low`. OpenClaw cũng
bỏ qua các giá trị nhiệt độ tùy chỉnh cho yêu cầu Fable 5 vì Anthropic từ chối
ghi đè nhiệt độ trên mọi yêu cầu đã bật suy luận.

`anthropic/claude-mythos-5` là mô hình có quyền truy cập hạn chế với cùng hợp đồng
suy luận thích ứng luôn bật. OpenClaw mặc định dùng `high`, ánh xạ `/think off` và
`/think minimal` sang `low`, đồng thời bỏ qua các tham số lấy mẫu do bên gọi chọn.
Danh mục công bố cửa sổ ngữ cảnh 1.000.000 token, giới hạn đầu ra
128.000 token, đầu vào hình ảnh và mức giá đầu vào/đầu ra `$10/$50`.

Claude Opus 4.8 mặc định tắt suy luận trong OpenClaw. Khi bạn bật rõ ràng
khả năng suy luận thích ứng bằng `/think high|xhigh|max`, OpenClaw sẽ gửi
các giá trị nỗ lực Opus 4.8 của Anthropic; các mô hình Claude 4.6 (Opus 4.6 và Sonnet 4.6)
mặc định dùng `adaptive`.

Ghi đè theo từng tin nhắn bằng `/think:<level>` hoặc trong tham số mô hình:

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

## Phương án dự phòng khi từ chối vì an toàn (Claude Fable 5)

<Warning>
Sử dụng Claude Fable 5 đồng nghĩa với việc cũng sử dụng Claude Opus 4.8. Fable 5 đi kèm
các bộ phân loại an toàn có thể từ chối yêu cầu và phương án khôi phục được Anthropic
chấp thuận là để `claude-opus-4-8` xử lý lượt đó. OpenClaw tự động chọn tham gia cơ chế này
đối với các yêu cầu trực tiếp bằng khóa API, vì vậy một số lượt Fable được Claude Opus 4.8
trả lời và tính phí. Nếu chính sách hoặc ngân sách của bạn không thể chấp nhận
các lượt do Opus xử lý, không chọn `anthropic/claude-fable-5`.
</Warning>

### Lý do tồn tại

Các bộ phân loại của Fable 5 trả về `stop_reason: "refusal"` cho yêu cầu thuộc các
lĩnh vực bị hạn chế và cũng có thể xác định nhầm những công việc lành tính có liên quan
(công cụ bảo mật, khoa học sự sống hoặc thậm chí yêu cầu mô hình tái tạo
quá trình suy luận thô của chính nó). Nếu không có phương án dự phòng, lượt sẽ kết thúc
với lỗi dù một mô hình Claude khác có thể xử lý bình thường — chính thông báo từ chối
của Anthropic yêu cầu các bên tích hợp API cấu hình một mô hình dự phòng.

### Cách hoạt động

1. Với mọi yêu cầu trực tiếp bằng khóa API đến `anthropic/claude-fable-5`, OpenClaw
   gửi lựa chọn tham gia cơ chế dự phòng phía máy chủ của Anthropic: tiêu đề beta
   `server-side-fallback-2026-06-01` cùng với
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 là mục tiêu
   dự phòng duy nhất Anthropic cho phép đối với Fable 5.
2. Chỉ trường hợp bộ phân loại an toàn từ chối mới kích hoạt phương án dự phòng. Giới hạn tốc độ,
   tình trạng quá tải và lỗi máy chủ hoạt động hoàn toàn như trước và được xử lý qua
   cơ chế [chuyển đổi dự phòng mô hình](/vi/concepts/model-failover) thông thường của OpenClaw.
3. Quá trình cứu hộ diễn ra trong cùng một lệnh gọi. Trường hợp từ chối trước khi có đầu ra
   không thể nhận biết ngoài độ trễ; toàn bộ câu trả lời đến từ Opus 4.8. Nếu
   từ chối giữa luồng, phần văn bản đã tạo được giữ làm tiền tố để mô hình dự phòng
   tiếp tục, còn quá trình suy luận và các lệnh gọi công cụ của mô hình đã từ chối
   bị loại bỏ theo quy tắc phát lại của Anthropic (không được trả lại hoặc
   thực thi chúng).
4. Nếu Claude Opus 4.8 cũng từ chối, lượt sẽ hiển thị lời từ chối dưới dạng
   lỗi, hoàn toàn giống như trước khi có tính năng này.

Phương án dự phòng diễn ra ở cấp API Anthropic, vì vậy `claude-opus-4-8` không
cần nằm trong danh sách mô hình hoặc chuỗi dự phòng đã cấu hình — khóa API
hỗ trợ Fable luôn có thể xử lý Opus.

### Khả năng quan sát và tính phí

- Một lượt được phương án dự phòng xử lý sẽ ghi lại chẩn đoán `provider_fallback` trên
  tin nhắn của trợ lý, nêu tên `fromModel` và `toModel`; trường
  `responseModel` của tin nhắn báo cáo `claude-opus-4-8`.
- Anthropic tính phí theo từng lần thử: trường hợp từ chối trước khi có đầu ra là miễn phí và lượt cứu hộ
  được tính theo mức giá Claude Opus 4.8 (hiện bằng một nửa mức giá Fable 5). Ước tính
  chi phí theo lượt của OpenClaw định giá các lượt do phương án dự phòng xử lý theo mức giá Opus để khớp.
- Trường hợp từ chối giữa luồng còn bị Anthropic tính phí cho phần Fable đã phát trực tuyến;
  phần đó được báo cáo trong mức sử dụng theo từng lần thử của API nhưng không được
  gộp vào ước tính theo lượt của OpenClaw.

### Phạm vi

Áp dụng cho `anthropic/claude-fable-5` với xác thực bằng khóa API đối với
`api.anthropic.com`. OAuth (tái sử dụng gói đăng ký Claude CLI), URL cơ sở proxy,
các yêu cầu Bedrock, Vertex và Foundry không thay đổi và vẫn hiển thị
lời từ chối dưới dạng lỗi tại đó.

Đã xác minh trực tiếp: một lời nhắc lành tính yêu cầu Fable 5 tái tạo chuỗi
suy luận thô của nó bị từ chối với `category: "reasoning_extraction"` khi gửi mà không có
phương án dự phòng; cùng lời nhắc đó qua OpenClaw trả về câu trả lời bình thường
do Opus xử lý, kèm theo chẩn đoán `provider_fallback`.

Xem [hướng dẫn về từ chối và phương án dự phòng](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
của Anthropic để biết hành vi nền tảng.

## Bộ nhớ đệm lời nhắc

OpenClaw hỗ trợ tính năng bộ nhớ đệm lời nhắc của Anthropic cho xác thực bằng khóa API.

| Giá trị               | Thời lượng bộ nhớ đệm | Mô tả                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (mặc định) | 5 phút      | Tự động áp dụng cho xác thực bằng khóa API |
| `"long"`            | 1 giờ         | Bộ nhớ đệm mở rộng                         |
| `"none"`            | Không lưu bộ nhớ đệm     | Tắt bộ nhớ đệm lời nhắc                 |

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
  <Accordion title="Ghi đè bộ nhớ đệm theo tác nhân">
    Dùng tham số cấp mô hình làm đường cơ sở, sau đó ghi đè các tác nhân cụ thể qua `agents.list[].params`:

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

    Cơ chế này cho phép một tác nhân duy trì bộ nhớ đệm dài hạn trong khi một tác nhân khác trên cùng mô hình tắt bộ nhớ đệm cho lưu lượng theo đợt/ít tái sử dụng.

  </Accordion>

  <Accordion title="Ghi chú về Claude trên Bedrock">
    - Các mô hình Anthropic Claude trên Bedrock (`amazon-bedrock/*anthropic.claude*`) chấp nhận chuyển tiếp `cacheRetention` khi được cấu hình.
    - Các mô hình Bedrock không phải Anthropic bị buộc dùng `cacheRetention: "none"` khi chạy.
    - Các giá trị mặc định thông minh cho khóa API cũng đặt sẵn `cacheRetention: "short"` cho tham chiếu Claude trên Bedrock khi không có giá trị rõ ràng nào được đặt.

  </Accordion>
</AccordionGroup>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Chế độ nhanh">
    Nút chuyển đổi `/fast` dùng chung của OpenClaw đặt trường `service_tier` của Anthropic cho lưu lượng trực tiếp bằng khóa API đến `api.anthropic.com`.

    | Lệnh | Ánh xạ thành |
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
    - Chỉ áp dụng cho các yêu cầu `api.anthropic.com` trực tiếp được thực hiện bằng khóa API. Các yêu cầu OAuth/token gói đăng ký và tuyến proxy không bao giờ nhận trường `service_tier`.
    - Tham số `serviceTier` hoặc `service_tier` được đặt rõ ràng sẽ ghi đè `/fast` khi cả hai cùng được đặt.
    - Trên các tài khoản không có dung lượng Priority Tier, `service_tier: "auto"` có thể phân giải thành `standard`.

    </Note>

  </Accordion>

  <Accordion title="Hiểu nội dung đa phương tiện (hình ảnh và PDF)">
    Plugin Anthropic đi kèm đăng ký khả năng hiểu hình ảnh và PDF. OpenClaw
    tự động phân giải các khả năng đa phương tiện từ thông tin xác thực Anthropic đã cấu hình;
    không cần cấu hình bổ sung.

    | Thuộc tính        | Giá trị                 |
    | --------------- | --------------------- |
    | Mô hình mặc định   | `claude-opus-4-8`     |
    | Đầu vào được hỗ trợ | Hình ảnh, tài liệu PDF |

    Khi hình ảnh hoặc PDF được đính kèm vào cuộc hội thoại, OpenClaw tự động
    định tuyến nội dung đó qua nhà cung cấp khả năng hiểu đa phương tiện Anthropic.

  </Accordion>

  <Accordion title="Cửa sổ ngữ cảnh 1M">
    Claude Sonnet 5, Mythos 5 và Fable 5 có cửa sổ đầu vào chính xác
    1.000.000 token và hỗ trợ tối đa 128.000 token đầu ra. Cửa sổ ngữ cảnh 1M
    của Anthropic cũng đã GA trên các mô hình Claude 4.x có khả năng suy luận thích ứng: Opus 4.8,
    Opus 4.7, Opus 4.6 và Sonnet 4.6. OpenClaw tự động định cỡ các mô hình này,
    không cần `params.context1m`:

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

    Các cấu hình cũ có thể giữ `params.context1m: true`; đây là thao tác không gây ảnh hưởng
    đối với các mô hình này và OpenClaw không còn gửi tiêu đề beta đã ngừng sử dụng
    `context-1m-2025-08-07` trong mọi trường hợp. Các mục cấu hình `anthropicBeta` cũ
    có giá trị đó sẽ bị loại bỏ trong quá trình phân giải tiêu đề yêu cầu, còn
    các mô hình Claude cũ không được hỗ trợ vẫn sử dụng cửa sổ ngữ cảnh thông thường.

    `params.context1m: true` hoạt động theo cách tương tự cho phần phụ trợ Claude CLI
    (`claude-cli/*`): các mô hình Opus và Sonnet đủ điều kiện hỗ trợ GA đã tự động nhận
    cửa sổ 1M, vì vậy tham số này cũng là tùy chọn tại đó.

    <Warning>
    Yêu cầu thông tin xác thực Anthropic của bạn có quyền truy cập ngữ cảnh dài. Xác thực bằng OAuth/token gói đăng ký vẫn giữ các tiêu đề beta Anthropic bắt buộc, nhưng OpenClaw loại bỏ tiêu đề beta 1M đã ngừng sử dụng nếu tiêu đề đó vẫn còn trong cấu hình cũ.
    </Warning>

  </Accordion>

  <Accordion title="Ngữ cảnh 1M của Claude Opus 4.8">
    `anthropic/claude-opus-4-8` và biến thể `claude-cli` của nó có cửa sổ ngữ cảnh 1M
    theo mặc định; không cần `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Lỗi 401 / token đột nhiên không hợp lệ">
    Xác thực bằng token Anthropic sẽ hết hạn và có thể bị thu hồi. Đối với thiết lập mới, hãy dùng khóa API Anthropic.
  </Accordion>

  <Accordion title='Không tìm thấy khóa API cho nhà cung cấp "anthropic"'>
    Xác thực Anthropic được thiết lập **theo từng tác nhân**; tác nhân mới không kế thừa khóa của tác nhân chính. Chạy lại quy trình thiết lập ban đầu cho tác nhân đó (hoặc cấu hình khóa API trên máy chủ Gateway), sau đó xác minh bằng `openclaw models status`.
  </Accordion>

  <Accordion title='Không tìm thấy thông tin xác thực cho hồ sơ "anthropic:default"'>
    Chạy `openclaw models status` để xem hồ sơ xác thực nào đang hoạt động. Chạy lại quy trình thiết lập ban đầu hoặc cấu hình khóa API cho đường dẫn hồ sơ đó.
  </Accordion>

  <Accordion title="Không có hồ sơ xác thực khả dụng (tất cả đang trong thời gian chờ)">
    Kiểm tra `openclaw models status --json` cho `auth.unusableProfiles`. Thời gian chờ do giới hạn tốc độ của Anthropic có thể áp dụng theo từng mô hình, vì vậy một mô hình Anthropic cùng loại khác vẫn có thể sử dụng được. Thêm một hồ sơ Anthropic khác hoặc chờ hết thời gian chờ.
  </Accordion>
</AccordionGroup>

<Note>
Trợ giúp thêm: [Khắc phục sự cố](/vi/help/troubleshooting) và [Câu hỏi thường gặp](/vi/help/faq).
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Backend CLI" href="/vi/gateway/cli-backends" icon="terminal">
    Thiết lập backend Claude CLI và chi tiết thời gian chạy.
  </Card>
  <Card title="Bộ nhớ đệm prompt" href="/vi/reference/prompt-caching" icon="database">
    Cách bộ nhớ đệm prompt hoạt động giữa các nhà cung cấp.
  </Card>
  <Card title="OAuth và xác thực" href="/vi/gateway/authentication" icon="key">
    Chi tiết xác thực và quy tắc tái sử dụng thông tin xác thực.
  </Card>
</CardGroup>
