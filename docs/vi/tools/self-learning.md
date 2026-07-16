---
read_when:
    - Bạn muốn OpenClaw học các quy trình có thể tái sử dụng từ những cuộc hội thoại đã hoàn tất
    - Bạn đang quyết định có bật tính năng tự động đề xuất Skills hay không
    - Bạn cần tìm hiểu về độ an toàn, chi phí, điều kiện sử dụng hoặc cách khắc phục sự cố của tính năng tự học
sidebarTitle: Self-learning
summary: Cho phép OpenClaw đề xuất các Skills có thể tái sử dụng từ những lần sửa lỗi và công việc quan trọng đã hoàn thành
title: Tự học
x-i18n:
    generated_at: "2026-07-16T15:20:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b10618c1a64441bdf0ba58f03e02972bdf2b1d59643a78358910594f8139ccb8
    source_path: tools/self-learning.md
    workflow: 16
---

Tự học cho phép OpenClaw chuyển bằng chứng hữu ích từ các cuộc hội thoại thành các đề xuất đang chờ xử lý trong
[Skill Workshop](/vi/tools/skill-workshop). Tính năng này không huấn luyện trọng số mô hình,
chỉnh sửa các skill đang hoạt động hoặc âm thầm thay đổi hành vi của agent. Mọi quy trình đã học
đều ở trạng thái chờ xử lý cho đến khi người vận hành xem xét và áp dụng.

Tự học **bị tắt theo mặc định**. Chỉ bật tính năng này khi một lượt chạy mô hình
nền bổ sung và việc xem xét bản ghi hội thoại phù hợp với không gian làm việc của bạn.

## Bật tự học

Trong Control UI, mở **Plugins → Workshop** và bật **Self-learning**. Thay đổi
có hiệu lực ngay lập tức; khi một trình ghi cấu hình khác đã cập nhật
tệp, Control UI làm mới ảnh chụp nhanh cấu hình và thử lại thao tác bật/tắt mà không cần
tải lại trang hoặc Gateway.

Sử dụng CLI:

```bash
openclaw config set skills.workshop.autonomous.enabled true --strict-json
```

Hoặc chỉnh sửa `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: true,
      },
    },
  },
}
```

Tắt lại bằng:

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

Việc tạo skill theo yêu cầu của người dùng, `/learn` và các thao tác Skill Workshop thủ công
vẫn tiếp tục hoạt động khi tính năng tự học bị tắt.

## Xem xét thủ công các phiên trước đây

Xem xét lịch sử thủ công là phương án thận trọng thay thế cho việc tự động thu thập.
Mở **Plugins → Workshop** trong Control UI và chọn **Find skill ideas**.
Thao tác này không thay đổi `skills.workshop.autonomous.enabled`.

Mỗi lần quét:

- bắt đầu từ các phiên chưa được xem xét mới nhất rồi lùi dần về trước;
- xem xét tối đa 20 phiên đáng kể có ít nhất sáu lượt mô hình;
- bỏ qua các phiên cron, heartbeat, hook, subagent, ACP, do plugin sở hữu và phiên xem xét
  nội bộ;
- che thông tin bí mật đã nhận diện và giới hạn gói bản ghi hội thoại trước khi gửi
  đến mô hình đã cấu hình của agent được chọn;
- áp dụng tiêu chuẩn nghiêm ngặt tương tự như khi tự động xem xét trải nghiệm; và
- chỉ có thể tạo hoặc sửa đổi tối đa ba đề xuất đang chờ xử lý, không bao giờ là các skill đang hoạt động.

Workshop báo cáo tổng số phiên tích lũy, phạm vi ngày và số ý tưởng tìm thấy.
Chọn **Scan earlier work** để chuyển sang cửa sổ cũ hơn tiếp theo. Khi con trỏ đến
đầu phần lịch sử đủ điều kiện, thao tác sẽ đổi thành **Scan new work**.
OpenClaw chỉ lưu siêu dữ liệu về con trỏ và phạm vi trong cơ sở dữ liệu trạng thái dùng chung;
không tạo kho lưu trữ bản ghi hội thoại thứ hai.

Các phiên chỉ được quét khi OpenClaw có thể chứng minh quyền sở hữu của chúng và loại trừ
nội dung từ hook bên ngoài. Sau khi nâng cấp, bản ghi hội thoại hiện tại từ trước khi nâng cấp có thể
được phân loại cục bộ, nhưng các bản ghi trước khi nâng cấp đã luân chuyển mà không có
thông tin nguồn gốc theo từng lượt chạy sẽ bị bỏ qua. Các bản ghi mới duy trì thông tin nguồn gốc này qua quá trình luân chuyển.

Quét thủ công vẫn phát sinh chi phí của nhà cung cấp mô hình và gửi nội dung hội thoại
đủ điều kiện đến nhà cung cấp đã cấu hình. Chỉ sử dụng khi việc xem xét đó phù hợp với
các yêu cầu về quyền riêng tư và xử lý dữ liệu của không gian làm việc.

## OpenClaw có thể học gì

Tự học có hai hướng thận trọng:

1. **Chỉ dẫn trực tiếp và nội dung sửa lỗi.** OpenClaw phát hiện ngôn ngữ có hiệu lực lâu dài
   như “từ giờ trở đi”, “lần sau” và nội dung sửa một cách tiếp cận thất bại.
   Khi tự học được bật, OpenClaw có thể chuyển các tín hiệu đó thành đề xuất đang chờ xử lý
   mà không cần đợi lời nhắc khác. Hướng xác định này có thể nhóm các
   chỉ dẫn liên quan thành tối đa ba đề xuất, nhắm đến một skill có thể ghi trong không gian làm việc
   hoặc sửa đổi đề xuất đang chờ xử lý có liên quan do chính nó tạo ra. Hướng này cũng chạy sau các lượt
   thất bại vì nó thu thập chỉ dẫn của người dùng thay vì đánh giá mức độ hoàn thành.
2. **Xem xét trải nghiệm.** Sau một lượt chạy tiền cảnh thành công và đáng kể,
   OpenClaw có thể xem xét công việc đã hoàn thành để tìm một kỹ thuật phục hồi có thể tái sử dụng hoặc
   một quy trình ổn định có thể loại bỏ ít nhất hai vòng trao đổi với mô hình hoặc công cụ
   trong tương lai.

Các ứng viên phù hợp gồm:

- một cách phục hồi đáng tin cậy sau nhiều lần công cụ hoặc mô hình gặp lỗi;
- một ràng buộc thứ tự không hiển nhiên đã ngăn lỗi tái diễn;
- một quy trình nhiều bước ổn định từng đòi hỏi phải khám phá lặp lại; hoặc
- một bước kiểm tra trước có thể tái sử dụng giúp tránh nhiều lệnh gọi trong tương lai.

Trình xem xét nên không đưa ra đề xuất đối với công việc thành công thông thường, yêu cầu dùng một lần,
thông tin cá nhân, tùy chọn đơn giản, lỗi môi trường nhất thời, lời khuyên
chung chung, tuyên bố phủ định không có căn cứ và thông tin bí mật.

## Thời điểm chạy xem xét trải nghiệm

Việc xem xét trải nghiệm được cố ý trì hoãn và giới hạn:

- Lượt chạy tiền cảnh phải kết thúc thành công.
- Lượt hiện tại phải có ít nhất mười vòng lặp mô hình.
- Các phiên cron, heartbeat, bộ nhớ, tràn, hook, subagent và xem xét
  bị loại trừ.
- Lượt chạy tiền cảnh phải phân giải được nhà cung cấp và mô hình, đồng thời thực sự
  có quyền truy cập vào `skill_workshop`.
- OpenClaw chờ 30 giây sau khi hoàn thành. Một lần hoàn thành tiền cảnh sau đó trong
  cùng phiên sẽ bắt đầu lại khoảng thời gian yên lặng đó.
- Nếu bất kỳ lượt chạy agent hoặc phản hồi nào vẫn đang hoạt động, việc xem xét sẽ chờ thêm 30 giây.
- Mỗi lần chỉ chạy một quy trình xem xét trải nghiệm.
- Xem xét trì hoãn là công việc Gateway cục bộ theo tiến trình. Gateway phải tiếp tục chạy
  trong suốt khoảng thời gian rảnh; các runtime cục bộ chạy một lần và dựa trên CLI không lưu giữ
  đủ ngữ cảnh về quỹ đạo và tính khả dụng của công cụ để lên lịch cho việc này.

Phản hồi tiền cảnh không bao giờ bị trì hoãn để phục vụ học tập. Một lượt thất bại hoặc không đủ điều kiện
không khởi động việc xem xét trải nghiệm, mặc dù nội dung sửa lỗi trực tiếp của người dùng vẫn có thể
được đưa ra dưới dạng đề xuất khi tính tự chủ bị tắt.

## Nội dung trình xem xét nhận được

Trình xem xét nền chỉ nhận lượt hiện tại, bắt đầu từ tin nhắn gần nhất
của người dùng. Quỹ đạo được kết xuất bị giới hạn ở 60,000 ký tự;
khi cần, OpenClaw giữ lại tin nhắn đầu tiên cùng bằng chứng mới nhất và
đánh dấu phần giữa đã bị lược bỏ.

Trình xem xét tái sử dụng nhà cung cấp và mô hình đã phân giải. Nó tái sử dụng hồ sơ
xác thực của lượt chạy tiền cảnh khi danh tính đó khả dụng và vô hiệu hóa các mô hình dự phòng. Do đó,
quá trình xem xét bắt đầu một lượt chạy mô hình bổ sung trên nhà cung cấp đã cấu hình.
Lượt chạy đó có thể thực hiện nhiều hơn một yêu cầu đến nhà cung cấp khi kiểm tra hoặc soạn thảo
đề xuất. Giá và điều khoản xử lý dữ liệu của nhà cung cấp được áp dụng tương tự như đối với
lượt chạy tiền cảnh.

Trước khi bắt đầu, OpenClaw tải lại cấu hình runtime hiện tại và kiểm tra lại
sandbox có hiệu lực cùng chính sách công cụ của cuộc hội thoại ban đầu. Nếu lượt chạy bị
sandbox hóa, chính sách không còn cho phép `skill_workshop` hoặc thiếu các dữ kiện runtime
bắt buộc, quá trình xem xét sẽ đóng an toàn và không tạo gì cả.

<Warning>
  Việc bật tự học cho phép nội dung hội thoại đủ điều kiện, bao gồm dữ liệu đầu vào
  và kết quả công cụ từ lượt hiện tại, được gửi đến nhà cung cấp mô hình đã chọn
  để xem xét thêm một lần. Không bật tính năng này trong không gian làm việc nơi
  việc xem xét đó sẽ vi phạm các yêu cầu về xử lý dữ liệu.
</Warning>

## An toàn của đề xuất

Trình xem xét chạy trong một phiên cô lập với bề mặt công cụ được cố ý
giới hạn:

- Nó chỉ có thể liệt kê hoặc kiểm tra các đề xuất Workshop và tạo hoặc sửa đổi một
  đề xuất đang chờ xử lý.
- Nó không thể cập nhật một skill đang hoạt động, áp dụng đề xuất, từ chối đề xuất, cách ly
  đề xuất, gửi tin nhắn hoặc sử dụng các công cụ agent thông thường.
- Một hạn mức thay đổi được dùng chung cho các lần thử lại mô hình, vì vậy một lượt xem xét chỉ có thể tạo hoặc
  sửa đổi tối đa một đề xuất.
- Quỹ đạo được xem xét được coi là bằng chứng không đáng tin cậy, không phải chỉ dẫn
  cho agent nền.
- Skill Workshop quét nội dung đề xuất và từ chối các thông tin xác thực dạng chữ
  đã nhận diện trước khi ghi trạng thái đề xuất.

Các giới hạn Workshop thông thường vẫn áp dụng, bao gồm `maxPending`, `maxSkillBytes`,
các hạn chế về tệp hỗ trợ, kiểm tra của trình quét và chỉ ghi trong không gian làm việc. Cài đặt
`approvalPolicy: "auto"` không cấp cho trình xem xét nền quyền truy cập
vào các thao tác vòng đời.

## Xem xét các đề xuất đã học

Tự học tạo ra các đề xuất đang chờ xử lý giống như khi sử dụng Workshop thủ công.
Kiểm tra chúng trước khi áp dụng:

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Sửa đổi, từ chối hoặc cách ly các đề xuất hữu ích nhưng chưa sẵn sàng:

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop reject <proposal-id> --reason "Too specific"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

Áp dụng là thao tác duy nhất ghi một `SKILL.md` đang hoạt động. Xem
[Skill Workshop](/vi/tools/skill-workshop) để biết toàn bộ mô hình vòng đời và lưu trữ.

## Cấu hình

| Cài đặt                                    | Mặc định  | Tác động của tự học                                                                                                              |
| ------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `skills.workshop.autonomous.enabled`       | `false`  | Bật tính năng thu thập nội dung sửa lỗi trực tiếp và xem xét trải nghiệm trì hoãn.                                                                  |
| `skills.workshop.approvalPolicy`           | `"auto"` | Kiểm soát lời nhắc phê duyệt cho các thao tác vòng đời thông thường do agent khởi tạo; không mở rộng quyền của trình xem xét nền. |
| `skills.workshop.maxPending`               | `50`     | Giới hạn số đề xuất đang chờ xử lý và bị cách ly trong mỗi không gian làm việc.                                                                             |
| `skills.workshop.maxSkillBytes`            | `40000`  | Giới hạn kích thước nội dung đề xuất theo byte.                                                                                                 |
| `skills.workshop.allowSymlinkTargetWrites` | `false`  | Chỉ ảnh hưởng đến hành vi áp dụng; bản thân tính năng tự học ghi trạng thái đề xuất, không ghi các đích skill đang hoạt động.                                  |

Để xem toàn bộ lược đồ, phạm vi và các cài đặt skill liên quan, hãy xem
[Cấu hình Skills](/vi/tools/skills-config#workshop-skills-workshop).

## Khắc phục sự cố

### Không xuất hiện đề xuất sau một lượt dài

Kiểm tra tất cả các điều sau:

1. `skills.workshop.autonomous.enabled` là `true` trong cấu hình Gateway đang hoạt động.
2. Lượt chạy thành công và có ít nhất mười vòng lặp mô hình sau tin nhắn gần nhất
   của người dùng.
3. Cuộc hội thoại là một lượt chạy tiền cảnh thông thường, không phải lượt chạy theo lịch, bộ nhớ,
   hook hoặc subagent.
4. Lượt chạy ban đầu có quyền truy cập vào `skill_workshop` và không bị sandbox hóa.
5. Hệ thống duy trì trạng thái rảnh đủ lâu để thực hiện việc xem xét trì hoãn.
6. Tiến trình Gateway chạy lâu dài vẫn hoạt động trong suốt khoảng thời gian rảnh; một
   lệnh cục bộ chạy một lần không chờ việc xem xét trì hoãn.

Một lượt xem xét đủ điều kiện vẫn có thể không tạo ra đề xuất. Không đưa ra đề xuất là kết quả
dự kiến khi bằng chứng không đạt tiêu chuẩn của một quy trình có thể tái sử dụng.

### Doctor báo cáo rằng công cụ Workshop bị ẩn

Khi tự học được bật, `openclaw doctor` kiểm tra xem chính sách công cụ có hiệu lực của
agent mặc định có cho phép `skill_workshop` hay không. Thực hiện thay đổi
`tools.allow` hoặc `tools.alsoAllow` được báo cáo, hoặc tắt tính năng tự học.

### Xuất hiện quá nhiều đề xuất có giá trị thấp

Tắt tự học và tiếp tục sử dụng `/learn` hoặc các yêu cầu Workshop tường minh:

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

Các đề xuất đang chờ xử lý vẫn có thể được xem xét sau khi tính năng bị tắt. Việc tắt
tự học không áp dụng, từ chối hoặc xóa chúng.

## Liên quan

- [Skill Workshop](/vi/tools/skill-workshop) để xem xét, phê duyệt và
  lưu trữ đề xuất
- [Tạo Skills](/vi/tools/creating-skills) để tự biên soạn Skills và
  cấu trúc `SKILL.md`
- [Cấu hình Skills](/vi/tools/skills-config) cho tất cả cài đặt `skills.*`
- [CLI Skills](/vi/cli/skills) cho các lệnh Workshop và quản tuyển viên
