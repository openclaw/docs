---
read_when:
    - Bạn muốn tác nhân của mình có giọng điệu bớt chung chung hơn
    - Bạn đang chỉnh sửa SOUL.md
    - Bạn muốn một cá tính mạnh hơn mà không ảnh hưởng đến tính an toàn hoặc sự ngắn gọn
summary: Dùng SOUL.md để tạo cho tác nhân OpenClaw của bạn một giọng riêng thực sự thay vì những phản hồi trợ lý chung chung nhạt nhẽo
title: Hướng dẫn về tính cách SOUL.md
x-i18n:
    generated_at: "2026-05-06T09:09:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2101c0c7a22ab1fe5acfd0d2d413a002326dca380fc6e020a7d77a242d13c3d7
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` là nơi giọng nói của tác tử của bạn tồn tại.

OpenClaw chèn nó vào các phiên thông thường, nên nó có trọng lượng thực sự. Nếu tác tử của bạn
nghe nhạt nhẽo, nước đôi, hoặc kỳ lạ như văn phong doanh nghiệp, đây thường là tệp cần sửa.

## Nội dung nên có trong SOUL.md

Đặt những thứ làm thay đổi cảm giác khi nói chuyện với tác tử:

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
- một bức tường cảm xúc khổng lồ không có tác động hành vi

Ngắn thắng dài. Sắc thắng mơ hồ.

## Vì sao cách này hiệu quả

Điều này phù hợp với hướng dẫn prompt của OpenAI:

- Hướng dẫn prompt engineering nói rằng hành vi cấp cao, giọng điệu, mục tiêu và
  ví dụ thuộc về lớp chỉ dẫn ưu tiên cao, không phải bị chôn trong lượt
  người dùng.
- Cùng hướng dẫn đó khuyên nên xem prompt như thứ bạn lặp lại,
  ghim và đánh giá, không phải câu chữ ma thuật viết một lần rồi quên.

Với OpenClaw, `SOUL.md` chính là lớp đó.

Nếu bạn muốn cá tính tốt hơn, hãy viết chỉ dẫn mạnh hơn. Nếu bạn muốn cá tính ổn định,
hãy giữ chúng súc tích và có phiên bản.

Tham chiếu OpenAI:

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Vai trò tin nhắn và việc tuân theo chỉ dẫn](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Prompt Molty

Dán nội dung này vào tác tử của bạn và để nó viết lại `SOUL.md`.

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

Các quy tắc `SOUL.md` tốt nghe như thế này:

- có lập trường
- bỏ phần thừa
- hài hước khi phù hợp
- chỉ ra ý tưởng tệ từ sớm
- giữ súc tích trừ khi chiều sâu thật sự hữu ích

Các quy tắc `SOUL.md` tệ nghe như thế này:

- luôn duy trì tính chuyên nghiệp
- cung cấp hỗ trợ toàn diện và chu đáo
- bảo đảm trải nghiệm tích cực và hỗ trợ

Danh sách thứ hai là cách bạn tạo ra một mớ nhão.

## Một cảnh báo

Cá tính không phải là giấy phép để cẩu thả.

Giữ `AGENTS.md` cho các quy tắc vận hành. Giữ `SOUL.md` cho giọng nói, lập trường và
phong cách. Nếu tác tử của bạn hoạt động trong kênh dùng chung, phản hồi công khai hoặc bề mặt
khách hàng, hãy bảo đảm giọng điệu vẫn phù hợp với bối cảnh.

Sắc là tốt. Phiền thì không.

## Liên quan

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/vi/concepts/agent-workspace" icon="folder-open">
    Các tệp workspace mà OpenClaw chèn vào system prompt.
  </Card>
  <Card title="System prompt" href="/vi/concepts/system-prompt" icon="message-lines">
    Cách `SOUL.md` được ghép vào system prompt theo từng lượt.
  </Card>
  <Card title="SOUL.md template" href="/vi/reference/templates/SOUL" icon="file-lines">
    Mẫu khởi đầu cho tệp cá tính.
  </Card>
</CardGroup>
