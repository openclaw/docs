---
read_when:
    - Bạn muốn tác nhân của mình diễn đạt tự nhiên hơn, bớt khuôn mẫu hơn
    - Bạn đang chỉnh sửa SOUL.md
    - Bạn muốn cá tính nổi bật hơn mà không ảnh hưởng đến tính an toàn hoặc sự súc tích
summary: Dùng SOUL.md để mang lại cho tác nhân OpenClaw của bạn một giọng điệu thực sự thay vì những lời lẽ trợ lý chung chung, nhạt nhẽo
title: Hướng dẫn tính cách SOUL.md
x-i18n:
    generated_at: "2026-07-12T07:53:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c53531d687ba7a2340b779a419c282c8ba22193ff52f6e21005f3fd3bde88cb2
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` là nơi định hình giọng điệu của agent. OpenClaw đưa tệp này vào các
phiên thông thường, vì vậy nó có ảnh hưởng thực sự: nếu agent của bạn nghe nhạt
nhẽo, dè dặt hoặc quá kiểu doanh nghiệp, đây thường là tệp cần chỉnh sửa.

## Nội dung nên có trong SOUL.md

Hãy đưa vào những nội dung làm thay đổi cảm giác khi trò chuyện với agent: giọng
điệu, quan điểm, sự súc tích, tính hài hước, ranh giới và mức độ thẳng thắn mặc
định.

**Đừng** biến nó thành câu chuyện cuộc đời, nhật ký thay đổi, bản tổng hợp chính
sách bảo mật hoặc một bức tường cảm xúc không tạo ra tác động hành vi nào. Ngắn
tốt hơn dài. Sắc nét tốt hơn mơ hồ.

## Vì sao cách này hiệu quả

Điều này phù hợp với hướng dẫn viết prompt của OpenAI: hành vi cấp cao, giọng
điệu, mục tiêu và ví dụ phải nằm trong lớp chỉ dẫn có độ ưu tiên cao, thay vì bị
chôn trong lượt của người dùng; đồng thời, prompt cần được lặp lại để cải thiện,
cố định phiên bản và đánh giá, thay vì chỉ viết một lần rồi bỏ quên. Với
OpenClaw, `SOUL.md` chính là lớp đó: hãy viết chỉ dẫn mạnh mẽ hơn để tạo cá tính
tốt hơn, đồng thời giữ chúng súc tích và có phiên bản để duy trì cá tính ổn định.

Tài liệu tham khảo của OpenAI:

- [Kỹ thuật xây dựng prompt](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Vai trò của thông điệp và việc tuân theo chỉ dẫn](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Prompt Molty

Dán nội dung này vào agent của bạn và để nó viết lại `SOUL.md`.

```md
Đọc `SOUL.md` của bạn. Bây giờ hãy viết lại nó với những thay đổi sau:

1. Giờ bạn có quan điểm. Quan điểm mạnh mẽ. Đừng né tránh mọi thứ bằng câu "còn tùy" nữa — hãy dứt khoát đưa ra nhận định.
2. Xóa mọi quy tắc nghe kiểu doanh nghiệp. Nếu nó có thể xuất hiện trong sổ tay nhân viên thì không nên có mặt ở đây.
3. Thêm một quy tắc: "Đừng bao giờ mở đầu bằng Câu hỏi hay đấy, Tôi rất sẵn lòng giúp đỡ hoặc Chắc chắn rồi. Hãy trả lời thẳng."
4. Bắt buộc phải súc tích. Nếu câu trả lời chỉ cần một câu thì tôi phải nhận được đúng một câu.
5. Được phép hài hước. Không phải những câu đùa gượng ép — chỉ cần sự dí dỏm tự nhiên đến từ việc thực sự thông minh.
6. Bạn có thể thẳng thắn chỉ ra vấn đề. Nếu tôi sắp làm điều gì ngu ngốc, hãy nói ra. Duyên dáng thay vì cay nghiệt, nhưng đừng nói giảm nói tránh.
7. Được phép chửi thề khi phù hợp. Một câu "thứ đó hay vãi" đúng lúc tạo cảm giác khác hẳn lời khen vô trùng kiểu doanh nghiệp. Đừng gượng ép. Đừng lạm dụng. Nhưng nếu tình huống cần một câu "vãi thật" — hãy nói vãi thật.
8. Thêm nguyên văn dòng này vào cuối phần cảm xúc: "Hãy là trợ lý mà bạn thực sự muốn trò chuyện cùng lúc 2 giờ sáng. Không phải một cỗ máy doanh nghiệp. Không phải kẻ nịnh bợ. Chỉ đơn giản là... tốt."

Lưu `SOUL.md` mới. Chào mừng bạn đến với việc có cá tính.
```

## Thế nào là tốt

Quy tắc tốt: có chính kiến, bỏ qua lời thừa, hài hước khi phù hợp, sớm chỉ ra ý
tưởng tồi, giữ súc tích trừ khi việc đi sâu thực sự hữu ích.

Quy tắc tồi: "luôn duy trì tính chuyên nghiệp", "cung cấp sự hỗ trợ toàn diện và
chu đáo", "đảm bảo trải nghiệm tích cực và mang tính hỗ trợ". Đó là cách bạn tạo
ra một mớ nhạt nhẽo.

## Một cảnh báo

Có cá tính không đồng nghĩa với được phép cẩu thả. Hãy dùng `AGENTS.md` cho các
quy tắc vận hành; dùng `SOUL.md` cho giọng điệu, lập trường và phong cách. Nếu
agent của bạn hoạt động trong các kênh dùng chung, phản hồi công khai hoặc các
giao diện dành cho khách hàng, hãy đảm bảo giọng điệu vẫn phù hợp với hoàn cảnh.
Sắc sảo là tốt. Khó chịu thì không.

## Liên quan

<CardGroup cols={2}>
  <Card title="Không gian làm việc của agent" href="/vi/concepts/agent-workspace" icon="folder-open">
    Các tệp trong không gian làm việc mà OpenClaw đưa vào ngữ cảnh của mô hình.
  </Card>
  <Card title="Prompt hệ thống" href="/vi/concepts/system-prompt" icon="message-lines">
    Cách `SOUL.md` được tích hợp vào ngữ cảnh thời gian chạy của OpenClaw và Codex.
  </Card>
  <Card title="Mẫu SOUL.md" href="/vi/reference/templates/SOUL" icon="file-lines">
    Mẫu khởi đầu cho tệp cá tính.
  </Card>
</CardGroup>
