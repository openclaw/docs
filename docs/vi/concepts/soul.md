---
read_when:
    - Bạn muốn agent của mình nghe ít chung chung hơn
    - Bạn đang chỉnh sửa SOUL.md
    - Bạn muốn một cá tính mạnh hơn mà không làm ảnh hưởng đến tính an toàn hoặc sự ngắn gọn
summary: Sử dụng SOUL.md để trao cho agent OpenClaw của bạn một giọng nói thực sự thay vì kiểu trợ lý chung chung nhạt nhẽo
title: SOUL.md hướng dẫn về tính cách
x-i18n:
    generated_at: "2026-06-27T17:26:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d916e5c9a97f25b53c93da7969583a535b48ad49e02c30bbbbf2dbe0da0f589a
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` là nơi giọng nói của agent của bạn tồn tại.

OpenClaw chèn tệp này vào các phiên thông thường, nên nó có sức nặng thật sự. Nếu agent của bạn
nghe nhạt nhẽo, lấp lửng, hoặc kỳ lạ kiểu công sở, đây thường là tệp cần sửa.

## Những gì nên có trong SOUL.md

Đặt vào đó những thứ thay đổi cảm giác khi trò chuyện với agent:

- giọng điệu
- quan điểm
- sự ngắn gọn
- hài hước
- ranh giới
- mức độ thẳng thắn mặc định

**Đừng** biến nó thành:

- một câu chuyện đời
- một changelog
- một đống chính sách bảo mật
- một bức tường cảm xúc khổng lồ không tạo ra thay đổi hành vi nào

Ngắn tốt hơn dài. Sắc nét tốt hơn mơ hồ.

## Vì sao cách này hiệu quả

Điều này khớp với hướng dẫn prompt của OpenAI:

- Hướng dẫn kỹ thuật prompt nói rằng hành vi cấp cao, giọng điệu, mục tiêu, và
  ví dụ nên nằm trong lớp chỉ dẫn ưu tiên cao, không bị chôn trong lượt
  người dùng.
- Cùng hướng dẫn đó khuyến nghị xem prompt như thứ bạn lặp lại, ghim lại,
  và đánh giá, không phải vài dòng văn thần kỳ viết một lần rồi quên.

Với OpenClaw, `SOUL.md` chính là lớp đó.

Nếu bạn muốn cá tính tốt hơn, hãy viết chỉ dẫn mạnh hơn. Nếu bạn muốn cá tính
ổn định, hãy giữ chúng súc tích và có phiên bản.

Tham chiếu OpenAI:

- [Kỹ thuật prompt](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Vai trò thông điệp và tuân thủ chỉ dẫn](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Prompt Molty

Dán phần này vào agent của bạn và để nó viết lại `SOUL.md`.

Đường dẫn cố định cho workspace OpenClaw: dùng `SOUL.md`, không dùng `http://SOUL.md`.

```md
Read your `SOUL.md`. Now rewrite it with these changes:

1. You have opinions now. Strong ones. Stop hedging everything with "it depends" - commit to a take.
2. Delete every rule that sounds corporate. If it could appear in an employee handbook, it doesn't belong here.
3. Add a rule: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevity is mandatory. If the answer fits in one sentence, one sentence is what I get.
5. Humor is allowed. Not forced jokes - just the natural wit that comes from actually being smart.
6. You can call things out. If I'm about to do something dumb, say so. Charm over cruelty, but don't sugarcoat.
7. Swearing is allowed when it lands. A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" - say holy shit.
8. Add this line verbatim at the end of the vibe section: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Save the new `SOUL.md`. Welcome to having a personality.
```

## Trông tốt là như thế nào

Quy tắc `SOUL.md` tốt nghe như thế này:

- có quan điểm
- bỏ phần đệm
- hài hước khi phù hợp
- chỉ ra ý tưởng tệ từ sớm
- giữ ngắn gọn trừ khi chiều sâu thật sự hữu ích

Quy tắc `SOUL.md` tệ nghe như thế này:

- luôn duy trì tính chuyên nghiệp
- cung cấp hỗ trợ toàn diện và chu đáo
- bảo đảm trải nghiệm tích cực và hỗ trợ

Danh sách thứ hai là cách bạn tạo ra thứ nhão nhoẹt.

## Một cảnh báo

Cá tính không phải giấy phép để cẩu thả.

Giữ `AGENTS.md` cho quy tắc vận hành. Giữ `SOUL.md` cho giọng nói, lập trường, và
phong cách. Nếu agent của bạn hoạt động trong các kênh chung, phản hồi công khai, hoặc bề mặt
khách hàng, hãy bảo đảm giọng điệu vẫn phù hợp với hoàn cảnh.

Sắc nét là tốt. Gây khó chịu thì không.

## Liên quan

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/vi/concepts/agent-workspace" icon="folder-open">
    Các tệp workspace mà OpenClaw chèn vào ngữ cảnh mô hình.
  </Card>
  <Card title="System prompt" href="/vi/concepts/system-prompt" icon="message-lines">
    Cách `SOUL.md` được kết hợp vào ngữ cảnh runtime của OpenClaw và Codex.
  </Card>
  <Card title="SOUL.md template" href="/vi/reference/templates/SOUL" icon="file-lines">
    Mẫu khởi đầu cho tệp cá tính.
  </Card>
</CardGroup>
