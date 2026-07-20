---
read_when:
    - Bạn muốn thiết lập suy luận, sau đó hoàn tất quá trình thiết lập bằng OpenClaw
summary: Tài liệu tham khảo CLI cho `openclaw onboard` (quy trình thiết lập ban đầu tương tác)
title: Thiết lập ban đầu
x-i18n:
    generated_at: "2026-07-20T14:37:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eccc133f136c119b832cdf3c492983b1581d1f008b94b3419bcd7ef025043cd2
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Quy trình thiết lập có hướng dẫn ưu tiên thiết lập suy luận trước: quy trình này phát hiện quyền truy cập AI hiện có,
yêu cầu một lượt hoàn thành trực tiếp, chỉ lưu tuyến hoạt động, rồi khởi động
OpenClaw để cấu hình phần còn lại. `openclaw setup` đi vào quy trình này trên các hệ thống
mới hoặc bất cứ khi nào có tùy chọn tiếp nhận ban đầu; các hệ thống đã cấu hình sử dụng
`openclaw setup` thuần túy để trò chuyện với tác nhân hệ thống. `openclaw setup --baseline` chỉ
ghi cấu hình/không gian làm việc cơ sở.

<CardGroup cols={2}>
  <Card title="Trung tâm tiếp nhận ban đầu CLI" href="/vi/start/wizard" icon="rocket">
    Hướng dẫn từng bước về quy trình CLI tương tác.
  </Card>
  <Card title="Tổng quan về tiếp nhận ban đầu" href="/vi/start/onboarding-overview" icon="map">
    Cách các phần trong quy trình tiếp nhận ban đầu của OpenClaw phối hợp với nhau.
  </Card>
  <Card title="Tham chiếu thiết lập CLI" href="/vi/start/wizard-cli-reference" icon="book">
    Đầu ra, cơ chế nội bộ và hành vi theo từng bước.
  </Card>
  <Card title="Tự động hóa CLI" href="/vi/start/wizard-cli-automation" icon="terminal">
    Các cờ không tương tác và thiết lập bằng tập lệnh.
  </Card>
  <Card title="Tiếp nhận ban đầu trong ứng dụng macOS" href="/vi/start/onboarding" icon="apple">
    Quy trình tiếp nhận ban đầu cho ứng dụng thanh menu macOS.
  </Card>
</CardGroup>

## Ví dụ

```bash
openclaw onboard
openclaw onboard --tui
openclaw onboard --classic
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard recommendations --json
openclaw onboard recommendations acknowledge
openclaw onboard recommendations acknowledge --retry "<failed-id>"
openclaw onboard recommendations refresh
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`openclaw onboard recommendations` đọc các kết quả khớp đề xuất ứng dụng đang chờ
được lưu trong quá trình tiếp nhận ban đầu. Thêm `--json` để lấy danh sách máy có thể đọc được mà
quy trình khởi tạo lần chạy đầu tiên sử dụng. Lệnh này không quét lại các ứng dụng đã cài đặt hoặc gọi
mô hình. Đầu ra chỉ chứa các ID cài đặt đã xác thực, nguồn và tầng; lệnh
cố ý bỏ qua nội dung văn bản không đáng tin cậy từ marketplace, lý do của mô hình và nhãn ứng dụng
cục bộ. Sau khi đề xuất đã được phản hồi, lệnh trả về
một danh sách trống và các lần tiếp nhận ban đầu sau này bỏ qua hoàn toàn bước này.
`openclaw onboard recommendations refresh` xóa đề xuất đã lưu để lần
tiếp nhận ban đầu tiếp theo quét lại các ứng dụng đã cài đặt và tạo đề xuất mới.

Các không gian làm việc mới hoãn việc lựa chọn đề xuất sang cuộc hội thoại khởi tạo.
Sau khi cuộc hội thoại đó xử lý các lựa chọn của người dùng,
`openclaw onboard recommendations acknowledge` đánh dấu đề xuất đã lưu là đã được phản hồi.
Việc xác nhận có tính lũy đẳng. Nếu một mục cài đặt đã chọn không thành công, hãy truyền từng
ID mờ đã thất bại bằng `--retry <id...>`; các kết quả khớp thành công và bị từ chối sẽ được sử dụng,
còn các kết quả khớp thất bại vẫn ở trạng thái chờ cho lần tiếp nhận ban đầu sau. Các ID không xác định
sẽ gây lỗi mà không thay đổi đề xuất đã lưu. Sau khi quá trình cài đặt skill ClawHub
bị gián đoạn, một đích hiện có chỉ được tính là thành công khi
`openclaw skills verify "@owner/slug"` thành công đối với cùng
ID đề xuất có kèm nhà phát hành và đầu ra JSON của lệnh báo cáo
`openclaw.resolution.source: "installed"`. Chỉ xác minh registry không phải là
bằng chứng về cài đặt cục bộ. Nếu không, hãy giữ ID đó ở trạng thái chờ bằng `--retry` và
không ghi đè skill hiện có.

- `--classic`: mở trình hướng dẫn đầy đủ theo từng bước. Không thể kết hợp với
  `--non-interactive`; bỏ qua `--classic` để thiết lập tự động.
- `--flow quickstart`: mở trình hướng dẫn cổ điển với số lời nhắc tối thiểu và
  tự động tạo token Gateway.
- `--flow manual` (bí danh `advanced`): mở trình hướng dẫn cổ điển với đầy đủ lời nhắc
  về cổng, địa chỉ liên kết và xác thực.
- `--flow import`: chạy nhà cung cấp di chuyển đã phát hiện (ví dụ Hermes qua `--import-from hermes`), xem trước kế hoạch, rồi áp dụng sau khi xác nhận. Chỉ chạy nhập trên một thiết lập OpenClaw mới — trước tiên hãy đặt lại cấu hình, thông tin xác thực, phiên và trạng thái không gian làm việc nếu có bất kỳ dữ liệu nào. Sử dụng [`openclaw migrate`](/vi/cli/migrate) để xem kế hoạch chạy thử, chế độ ghi đè, báo cáo và ánh xạ chính xác.
- `--remote-url` và `--remote-token`: điền sẵn bước Gateway từ xa trong trình hướng dẫn cổ điển và ghi đè các giá trị từ xa đã lưu cho lần chạy này. Việc thay đổi URL không tái sử dụng thông tin xác thực đã lưu trừ khi bạn cũng truyền token. Token luôn được che trong lời nhắc và tuân theo lựa chọn lưu trữ văn bản thuần hoặc SecretRef hiện có của trình hướng dẫn.
- `--tailscale-reset-on-exit` và `--no-tailscale-reset-on-exit`: kiểm soát rõ ràng việc có đặt lại cấu hình Tailscale Serve hoặc Funnel khi Gateway thoát hay không. Bỏ qua cả hai để giữ nguyên thiết lập hiện tại trong các lần chạy lại không tương tác.
- `--modern` là bí danh tương thích cho trợ lý thiết lập hội thoại
  OpenClaw. Trợ lý này sử dụng cùng cổng kiểm tra suy luận trực tiếp như `openclaw setup` và
  chỉ chấp nhận `--workspace`, `--accept-risk`,
  `--non-interactive` và `--json`. Các cờ thiết lập khác bị từ chối thay vì
  bị âm thầm bỏ qua.

## Quy trình có hướng dẫn

`openclaw onboard` thuần túy khởi động quy trình có hướng dẫn. Quy trình hiển thị thông báo bảo mật,
sau đó hỏi trước một câu hỏi: **quyền truy cập đầy đủ** (khuyến nghị — quá trình thiết lập tự động tìm
ứng dụng AI, khóa và runtime cục bộ) hoặc **hỏi trước** (quá trình thiết lập hỏi
một lần trước khi tìm kiếm hoặc cho phép bạn cấu hình thủ công). Lựa chọn này
được lưu dưới dạng `wizard.accessMode`. Khi cho phép khám phá, quá trình tiếp nhận ban đầu
phát hiện quyền truy cập AI đã có thông qua các mô hình đã cấu hình, biến môi trường
khóa API và CLI cục bộ được hỗ trợ, rồi kiểm thử ứng viên được đề xuất
bằng một lượt hoàn thành thực. Nếu một ứng viên thất bại, quá trình tiếp nhận ban đầu sẽ âm thầm
thử ứng viên khả dụng tiếp theo và tóm tắt mọi ứng viên không phản hồi trong
một dòng duy nhất; tuyến hoạt động được thông báo kèm tùy chọn một phím để xem
tất cả các tuyến khác.

Nếu quá trình phát hiện tự động không tìm thấy ứng viên, bộ chọn nhà cung cấp sẽ hiển thị OpenAI,
Anthropic, xAI (Grok), Google và OpenRouter trước. Chọn **Thêm…** để xem mọi
nhà cung cấp được hỗ trợ khác, được nhóm theo nhà cung cấp; khu vực, gói và phương thức xác thực
sau đó xuất hiện trong menu thứ hai. Các phương thức đăng nhập qua trình duyệt hoặc thiết bị được hỗ trợ và
khóa API hoặc token được che sử dụng cùng một quy trình hoàn thành trực tiếp. OpenClaw chỉ lưu
tuyến mô hình đã xác minh và thông tin xác thực của tuyến đó sau khi kiểm thử thành công;
ứng viên thất bại không thay thế mô hình đã cấu hình hoặc lưu thông tin xác thực
đã thử. Chọn **Bỏ qua lúc này** để thoát mà không khởi động OpenClaw và
chạy lại `openclaw onboard` khi bạn sẵn sàng. Thiết lập không gian làm việc và Gateway vẫn
không thay đổi cho đến khi OpenClaw khởi động.

Trong chế độ có hướng dẫn, `--workspace <dir>` cung cấp không gian làm việc do OpenClaw đề xuất
và ngữ cảnh suy luận biệt lập. Dữ liệu này không được lưu cho đến khi bạn phê duyệt
đề xuất thiết lập OpenClaw. Quy trình tiếp nhận ban đầu cổ điển và không tương tác lưu
không gian làm việc thông qua quy trình thiết lập thông thường tương ứng.

Sau khi suy luận vượt qua kiểm tra, quá trình tiếp nhận ban đầu kiểm tra bộ nhớ từ các công cụ AI cục bộ
được hỗ trợ: bộ nhớ tự động của Claude Code, bộ nhớ hợp nhất của Codex và các tệp bộ nhớ
Hermes. Khi tìm thấy bất kỳ dữ liệu nào, một trang sẽ đề nghị sao chép chúng vào không gian làm việc của tác nhân
trong `memory/imports/` để truy hồi theo chỉ mục. Không có dữ liệu nào được nhập nếu chưa
xác nhận, các tệp đã nhập trước đó sẽ bị bỏ qua và bạn luôn có thể nhập
sau từ [trang nhập bộ nhớ](/vi/web/control-ui) trong Control UI, nơi cung cấp
cùng phạm vi chỉ dành cho bộ nhớ. (Một lần chạy [`openclaw migrate`](/vi/cli/migrate) đầy đủ có
phạm vi rộng hơn: cũng có thể nhập cấu hình, skill và thông tin xác thực.) Trình hướng dẫn
cổ điển hiển thị cùng trang này sau khi chuẩn bị không gian làm việc.

Sau khi suy luận vượt qua kiểm tra (và sau đề xuất nhập bộ nhớ), quá trình tiếp nhận ban đầu có hướng dẫn
tự động áp dụng thiết lập tiêu chuẩn — không gian làm việc, Gateway và phiên,
cùng kế hoạch mà cuộc trò chuyện hội thoại `openclaw setup` sẽ áp dụng khi trả lời "có" —
sau đó đưa ra đề xuất plugin và skill từ các ứng dụng đã cài đặt; tên ứng dụng
được đối chiếu thông qua mô hình đã cấu hình và tìm kiếm ClawHub, đồng thời có thể
tắt bước này bằng [`wizard.appRecommendations`](/vi/gateway/configuration-reference#wizard).
Trong phiên máy tính để bàn macOS, Linux hoặc Windows, quy trình sau đó mở bảng điều khiển
Control UI đã xác thực và chờ tối đa 60 giây để ứng dụng trình duyệt
kết nối. Trên Linux không giao diện hoặc qua SSH, quy trình in một URL
bảng điều khiển nổi bật, có thể sao chép và dán, bao gồm lệnh chuyển tiếp cổng SSH cho Gateway
loopback, rồi chờ tối đa năm phút. Kết nối thành công sẽ tiếp tục trong trình duyệt;
Gateway không thể truy cập hoặc hết thời gian chờ sẽ quay về lối thoát terminal như
trước. Truyền `--tui` để bỏ qua việc chuyển giao cho trình duyệt và buộc sử dụng lối thoát terminal đó.
Nếu việc áp dụng thiết lập thất bại, quá trình tiếp nhận ban đầu quay về cuộc trò chuyện
OpenClaw để hoàn tất theo cách tương tác. Kênh, tác nhân,
plugin và các tính năng tùy chọn khác vẫn thuộc phạm vi trò chuyện OpenClaw: chạy
`openclaw` và sử dụng `open channel wizard for <channel>` để chuyển việc thu thập
thông tin xác thực kênh sang trình hướng dẫn terminal có che dữ liệu. Để thay đổi nhà cung cấp
mô hình hoặc phương thức xác thực của nhà cung cấp, hãy thoát OpenClaw và chạy `openclaw onboard`;
OpenClaw không mở các quy trình nhà cung cấp có hướng dẫn hoặc cổ điển.

Trên bản cài đặt đã cấu hình, việc chạy lại `openclaw onboard` trước tiên sẽ xác minh
mô hình mặc định hiện tại, vì vậy cùng quy trình này đóng vai trò như một lượt xác minh và sửa chữa —
quy trình không áp dụng lại thiết lập, cài đặt lại hoặc khởi động lại dịch vụ Gateway.
Nếu kiểm tra đó thất bại, mô hình đã cấu hình sẽ không bao giờ tự động bị thay thế —
quá trình tiếp nhận ban đầu dừng lại và hỏi cách tiếp tục. Kiểm tra chạy bên ngoài
không gian làm việc của bạn, vì vậy mô hình do plugin không gian làm việc cung cấp có thể thất bại ở đây nhưng vẫn
hoạt động trong tác nhân.
Sử dụng `openclaw onboard --classic` cho xác thực theo nhà cung cấp, kênh, skill,
thiết lập Gateway từ xa, nhập dữ liệu hoặc toàn bộ tùy chọn điều khiển Gateway. Để thiết lập và sửa chữa
không dùng suy luận theo cách hội thoại, hãy chạy `openclaw setup`; `openclaw onboard
--modern` là bí danh tương thích đi qua cùng cổng kiểm tra suy luận. Trình hướng dẫn
cổ điển có thể tùy chọn xác minh mô hình mặc định bằng một lượt hoàn thành trực tiếp, nhưng
OpenClaw sẽ không khởi động cho đến khi kiểm tra suy luận trực tiếp của chính nó thành công.

Trong terminal tương tác, `openclaw` thuần túy (không có lệnh con) định tuyến theo trạng thái
cấu hình:

- Nếu tệp cấu hình đang hoạt động bị thiếu hoặc không có thiết lập do người dùng tạo (trống hoặc
  chỉ có siêu dữ liệu), quy trình tiếp nhận ban đầu có hướng dẫn sẽ khởi động.
- Nếu tệp cấu hình tồn tại nhưng không vượt qua xác thực, quy trình tiếp nhận ban đầu
  cổ điển sẽ khởi động với hướng dẫn `openclaw doctor`. OpenClaw cần suy luận hoạt động
  và không được dùng để sửa chữa trạng thái trước suy luận này.
- Nếu tệp cấu hình hợp lệ, TUI tác nhân thông thường sẽ mở. Một Gateway đã cấu hình
  có thể truy cập cùng tác nhân và mô hình sẽ đi thẳng đến giao diện đó mà không
  tiếp nhận ban đầu hoặc dùng OpenClaw. Trên bản cài đặt đã cấu hình, truy cập OpenClaw bằng
  `/openclaw` trong TUI hoặc `openclaw setup`.

`ws://` dạng văn bản thuần được chấp nhận cho loopback, địa chỉ IP riêng dạng ký tự, `.local` và URL Gateway `*.ts.net` của Tailnet. Đối với các tên DNS riêng đáng tin cậy khác, hãy đặt `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` trong môi trường tiến trình tiếp nhận ban đầu.

## Đặt lại

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` xóa trạng thái trước khi chạy thiết lập. `--reset-scope` kiểm soát phạm vi: `config` (chỉ cấu hình), `config+creds+sessions` (mặc định khi truyền `--reset` mà không có phạm vi) hoặc `full` (cũng đặt lại không gian làm việc). Việc đặt lại không gian làm việc chỉ xảy ra với `--reset-scope full`.

## Ngôn ngữ

Quy trình tiếp nhận ban đầu tương tác sử dụng ngôn ngữ của trình hướng dẫn CLI cho nội dung thiết lập cố định. Quy trình sử dụng giá trị không trống đầu tiên theo thứ tự sau:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Tiếng Anh dự phòng

Các ngôn ngữ trình hướng dẫn được hỗ trợ là `en`, `zh-CN` và `zh-TW`. Giá trị ngôn ngữ có thể sử dụng dấu gạch dưới hoặc dạng hậu tố POSIX như `zh_CN.UTF-8`. Tên sản phẩm, tên lệnh, khóa cấu hình, URL, ID nhà cung cấp, ID mô hình và nhãn plugin/kênh được giữ nguyên.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
OPENCLAW_LOCALE=en openclaw onboard # Ghi đè rõ ràng sang tiếng Anh
```

## Thiết lập không tương tác

`--non-interactive` yêu cầu `--accept-risk` (xác nhận rằng các tác nhân rất mạnh và việc cấp quyền truy cập toàn bộ hệ thống tiềm ẩn rủi ro). `--mode` mặc định là `local`.

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` là tùy chọn; nếu bỏ qua, quy trình thiết lập ban đầu sẽ kiểm tra `CUSTOM_API_KEY` trong môi trường. OpenClaw tự động đánh dấu các ID mô hình thị giác phổ biến (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral và các mô hình tương tự) là có khả năng xử lý hình ảnh. Truyền `--custom-image-input` cho các ID mô hình thị giác tùy chỉnh chưa xác định hoặc `--custom-text-input` để buộc siêu dữ liệu chỉ hỗ trợ văn bản. Dùng `--custom-compatibility openai-responses` cho các điểm cuối tương thích với OpenAI hỗ trợ `/v1/responses` nhưng không hỗ trợ `/v1/chat/completions`; các giá trị hợp lệ là `openai` (mặc định), `openai-responses`, `anthropic`.

LM Studio cũng có một cờ khóa dành riêng cho nhà cung cấp:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama không tương tác:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` mặc định là `http://127.0.0.1:11434`. `--custom-model-id` là tùy chọn; nếu bỏ qua, quy trình thiết lập ban đầu sẽ dùng các giá trị mặc định do Ollama đề xuất. Các ID mô hình đám mây như `kimi-k2.5:cloud` cũng hoạt động tại đây.

Lưu khóa nhà cung cấp dưới dạng tham chiếu thay vì văn bản thuần túy:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Với `--secret-input-mode ref`, quy trình thiết lập ban đầu ghi các tham chiếu dựa trên biến môi trường thay vì giá trị khóa dạng văn bản thuần túy: đối với các nhà cung cấp dựa trên hồ sơ xác thực, thao tác này ghi `keyRef: { source: "env", provider: "default", id: <envVar> }`; đối với nhà cung cấp tùy chỉnh, thao tác này ghi `models.providers.<id>.apiKey` theo cùng cách (ví dụ: `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`). Hợp đồng: đặt biến môi trường của nhà cung cấp trong môi trường tiến trình thiết lập ban đầu (ví dụ: `OPENAI_API_KEY`) và không đồng thời truyền cờ khóa nội tuyến trừ khi biến môi trường đó đã được đặt — giá trị cờ không có biến môi trường tương ứng sẽ thất bại ngay kèm hướng dẫn.

### Xác thực Gateway (không tương tác)

- `--gateway-auth token --gateway-token <token>` lưu một token dạng văn bản thuần túy. `token` là chế độ xác thực mặc định.
- `--gateway-auth token --gateway-token-ref-env <name>` lưu `gateway.auth.token` dưới dạng SecretRef môi trường. Yêu cầu biến môi trường có tên đó không được để trống trong môi trường tiến trình thiết lập ban đầu.
- `--gateway-token` và `--gateway-token-ref-env` loại trừ lẫn nhau.
- Với `--install-daemon`: `gateway.auth.token` do SecretRef quản lý được xác thực nhưng không được lưu dưới dạng văn bản thuần túy đã phân giải trong siêu dữ liệu môi trường dịch vụ giám sát; nếu tham chiếu chưa được phân giải, quá trình cài đặt sẽ đóng an toàn và cung cấp hướng dẫn khắc phục. Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, quá trình cài đặt sẽ bị chặn cho đến khi chế độ được đặt rõ ràng.
- Quy trình thiết lập ban đầu cục bộ ghi `gateway.mode="local"` vào cấu hình. Nếu tệp cấu hình sau đó thiếu `gateway.mode`, điều đó cho thấy cấu hình bị hỏng hoặc chỉnh sửa thủ công chưa hoàn tất, không phải một lối tắt chế độ cục bộ hợp lệ.
- Quy trình thiết lập ban đầu cục bộ cài đặt các plugin có thể tải xuống mà đường dẫn thiết lập đã chọn yêu cầu (ví dụ: plugin thời gian chạy Codex hoặc Copilot cho các lựa chọn xác thực tương ứng). Quy trình thiết lập ban đầu từ xa chỉ ghi thông tin kết nối cho Gateway từ xa — quy trình này không bao giờ cài đặt các gói plugin cục bộ.
- `--allow-unconfigured` là một cơ chế thoát hiểm `openclaw gateway run` riêng biệt; nó không cho phép quy trình thiết lập ban đầu bỏ qua `gateway.mode`.

```bash
export OPENAI_API_KEY="your-provider-key"
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

### Tình trạng Gateway cục bộ

- Trừ khi bạn truyền `--skip-health`, quy trình thiết lập ban đầu sẽ chờ một Gateway cục bộ có thể truy cập được trước khi thoát thành công.
- `--install-daemon` khởi động đường dẫn cài đặt Gateway được quản lý trước. Nếu không dùng tùy chọn này, một Gateway cục bộ phải đang chạy sẵn (ví dụ: `openclaw gateway run`).
- `--skip-health` bỏ qua việc chờ nếu bạn chỉ muốn ghi cấu hình/không gian làm việc/dữ liệu khởi tạo trong quy trình tự động hóa.
- `--skip-bootstrap` đặt `agents.defaults.skipBootstrap: true` và bỏ qua việc tạo `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` và `BOOTSTRAP.md`.
- Trên Windows nguyên bản, `--install-daemon` thử Scheduled Tasks trước và chuyển sang một mục đăng nhập trong thư mục Startup cho từng người dùng nếu quyền tạo tác vụ bị từ chối.

### Chế độ tham chiếu tương tác

- Chọn **Use secret reference** khi được nhắc, sau đó chọn **Environment variable** hoặc một nhà cung cấp bí mật đã được cấu hình (`file` hoặc `exec`).
- Quy trình thiết lập ban đầu thực hiện xác thực sơ bộ nhanh trước khi lưu tham chiếu và cho phép bạn thử lại khi thất bại.

### Các lựa chọn điểm cuối Z.AI

<Note>
`--auth-choice zai-api-key` tự động phát hiện điểm cuối và mô hình Z.AI phù hợp nhất cho khóa của bạn: các điểm cuối Coding Plan ưu tiên `zai/glm-5.2` (chuyển sang `glm-5.1` nếu không khả dụng); các điểm cuối API thông thường mặc định là `zai/glm-5.1`. Để buộc dùng điểm cuối Coding Plan, hãy chọn trực tiếp `zai-coding-global` hoặc `zai-coding-cn`.
</Note>

```bash
# Chọn điểm cuối không cần lời nhắc
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Các lựa chọn điểm cuối Z.AI khác: zai-coding-cn, zai-global, zai-cn
```

Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Các cờ không tương tác bổ sung

Xác thực mô hình dựa trên token (dùng với `--auth-choice token`):

| Cờ                              | Mô tả                                                                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | ID nhà cung cấp token phát hành token                                                                                        |
| `--token <token>`               | Giá trị token để xác thực mô hình                                                                                            |
| `--token-profile-id <id>`       | ID hồ sơ xác thực (mặc định `<provider>:manual`; một số luồng do nhà cung cấp sở hữu dùng giá trị mặc định riêng, chẳng hạn `anthropic:default`) |
| `--token-expires-in <duration>` | Thời hạn hết hạn token tùy chọn (ví dụ: `365d`, `12h`)                                                                         |

Cloudflare AI Gateway: `--cloudflare-ai-gateway-account-id <id>`, `--cloudflare-ai-gateway-gateway-id <id>`.

Kiểm soát cài đặt daemon: `--no-install-daemon` / `--skip-daemon` (bí danh; bỏ qua cài đặt dịch vụ Gateway), `--daemon-runtime <node>`.

Skills: `--node-manager <npm|pnpm|bun>` (mặc định `npm`), `--skip-skills`.

Thiết lập giao diện người dùng và hook: `--skip-ui` (bỏ qua lời nhắc Control UI/TUI), `--skip-hooks` (bỏ qua thiết lập webhook/hook), `--skip-channels`, `--skip-search`.

Đầu ra: `--suppress-gateway-token-output` ẩn đầu ra Gateway/giao diện người dùng có chứa token (gợi ý token, URL đăng nhập tự động có token nhúng và tự động khởi chạy Control UI) — hữu ích trong terminal dùng chung và CI.

<Note>
`--json` không đồng nghĩa với chế độ không tương tác trong quy trình thiết lập ban đầu có hướng dẫn hoặc cổ điển.
Với `--modern`, JSON là bản tổng quan OpenClaw dùng một lần và sẽ thoát sau
kết quả duy nhất đó. Dùng `--non-interactive` cho các tập lệnh khác.
</Note>

## Lọc trước nhà cung cấp

Khi một lựa chọn xác thực ngụ ý một nhà cung cấp ưu tiên, quy trình thiết lập ban đầu sẽ lọc trước các bộ chọn mô hình mặc định và danh sách cho phép theo các mô hình của nhà cung cấp đó. Bộ lọc cũng khớp với các nhà cung cấp khác do cùng một plugin sở hữu, bao gồm các biến thể coding-plan như `volcengine`/`volcengine-plan` và `byteplus`/`byteplus-plan`. Nếu bộ lọc nhà cung cấp ưu tiên không trả về mô hình nào đã được tải, quy trình thiết lập ban đầu sẽ chuyển sang danh mục không lọc thay vì để bộ chọn trống.

## Lời nhắc tiếp theo cho tìm kiếm web

Một số nhà cung cấp tìm kiếm web kích hoạt các lời nhắc tiếp theo dành riêng cho nhà cung cấp trong quá trình thiết lập ban đầu:

- **Grok** có thể cung cấp thiết lập `x_search` tùy chọn với cùng thông tin xác thực xAI và lựa chọn mô hình `x_search`.
- **Kimi** có thể yêu cầu khu vực API Moonshot (`api.moonshot.ai` hoặc `api.moonshot.cn`) và mô hình tìm kiếm web Kimi mặc định.

## Các hành vi khác

- Hành vi phạm vi DM của quy trình thiết lập ban đầu cục bộ: [Tài liệu tham khảo thiết lập CLI](/vi/start/wizard-cli-reference#outputs-and-internals).
- Cách nhanh nhất để bắt đầu cuộc trò chuyện đầu tiên: `openclaw dashboard` (Control UI, không thiết lập kênh).
- Nhà cung cấp tùy chỉnh: kết nối bất kỳ điểm cuối nào tương thích với OpenAI hoặc Anthropic, bao gồm cả các nhà cung cấp được lưu trữ nhưng không có trong danh sách. Dùng khả năng tương thích **Unknown** để tự động phát hiện thông qua phép thăm dò trực tiếp.
- Nếu phát hiện trạng thái Hermes, quy trình thiết lập ban đầu sẽ cung cấp một luồng di chuyển (xem `--flow import` ở trên).

## Các lệnh tiếp theo thường dùng

Sau này, dùng `openclaw configure` cho các thay đổi có mục tiêu không liên quan đến suy luận và `openclaw
channels add` để chỉ thiết lập kênh. Đối với các thay đổi về nhà cung cấp mô hình hoặc tuyến xác thực,
hãy chạy `openclaw onboard` thay thế.

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
