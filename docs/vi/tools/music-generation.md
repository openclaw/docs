---
read_when:
    - Tạo nhạc hoặc âm thanh thông qua tác tử
    - Cấu hình nhà cung cấp và mô hình tạo nhạc
    - Tìm hiểu các tham số của công cụ music_generate
sidebarTitle: Music generation
summary: Tạo nhạc qua music_generate trong các quy trình làm việc của Google Lyria, MiniMax và ComfyUI
title: Tạo nhạc
x-i18n:
    generated_at: "2026-05-05T01:51:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e14a5a10dd485c2d3dbbd23a0fc2c12de500d9f7bfb7db471c27ed2a99ad650
    source_path: tools/music-generation.md
    workflow: 16
---

Công cụ `music_generate` cho phép tác tử tạo nhạc hoặc âm thanh thông qua
năng lực tạo nhạc dùng chung với các nhà cung cấp đã cấu hình — hiện nay là
Google, MiniMax và ComfyUI được cấu hình bằng workflow.

Đối với các lượt chạy tác tử có phiên hậu thuẫn, OpenClaw bắt đầu tạo nhạc như một
tác vụ nền, theo dõi tác vụ đó trong sổ cái tác vụ, rồi đánh thức tác tử lần nữa
khi bản nhạc đã sẵn sàng để tác tử có thể báo cho người dùng và đính kèm âm thanh
hoàn chỉnh. Trong các cuộc trò chuyện nhóm/kênh dùng cách gửi hiển thị chỉ qua công cụ tin nhắn,
tác tử chuyển tiếp kết quả thông qua công cụ tin nhắn.

<Note>
Công cụ dùng chung tích hợp sẵn chỉ xuất hiện khi có ít nhất một nhà cung cấp
tạo nhạc khả dụng. Nếu bạn không thấy `music_generate` trong các công cụ của
tác tử, hãy cấu hình `agents.defaults.musicGenerationModel` hoặc thiết lập một
khóa API của nhà cung cấp.
</Note>

## Bắt đầu nhanh

<Tabs>
  <Tab title="Shared provider-backed">
    <Steps>
      <Step title="Configure auth">
        Đặt khóa API cho ít nhất một nhà cung cấp — ví dụ
        `GEMINI_API_KEY` hoặc `MINIMAX_API_KEY`.
      </Step>
      <Step title="Pick a default model (optional)">
        ```json5
        {
          agents: {
            defaults: {
              musicGenerationModel: {
                primary: "google/lyria-3-clip-preview",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Ask the agent">
        _"Tạo một bản synthpop sôi động về chuyến lái xe ban đêm qua một
        thành phố neon."_

        Tác tử tự động gọi `music_generate`. Không cần danh sách cho phép
        công cụ.
      </Step>
    </Steps>

    Đối với các ngữ cảnh đồng bộ trực tiếp không có lượt chạy tác tử có phiên hậu thuẫn,
    công cụ tích hợp sẵn vẫn dùng phương án dự phòng tạo nội tuyến và trả về
    đường dẫn phương tiện cuối cùng trong kết quả công cụ.

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        Cấu hình `plugins.entries.comfy.config.music` bằng workflow
        JSON và các nút prompt/đầu ra.
      </Step>
      <Step title="Cloud auth (optional)">
        Với Comfy Cloud, đặt `COMFY_API_KEY` hoặc `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Call the tool">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Ví dụ prompt:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## Nhà cung cấp được hỗ trợ

| Nhà cung cấp | Mô hình mặc định       | Đầu vào tham chiếu | Điều khiển được hỗ trợ                                | Xác thực                                |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | Tối đa 1 hình ảnh | Nhạc hoặc âm thanh do workflow định nghĩa                 | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Tối đa 10 hình ảnh | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Không có          | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` hoặc MiniMax OAuth   |

### Ma trận năng lực

Hợp đồng chế độ tường minh được `music_generate`, các kiểm thử hợp đồng và
đợt quét trực tiếp dùng chung sử dụng:

| Nhà cung cấp | `generate` | `edit` | Giới hạn chỉnh sửa | Làn trực tiếp dùng chung                                                   |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 hình ảnh | Không nằm trong đợt quét dùng chung; được bao phủ bởi `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 hình ảnh | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | Không có   | `generate`                                                                |

Dùng `action: "list"` để kiểm tra các nhà cung cấp và mô hình dùng chung khả dụng
tại thời điểm chạy:

```text
/tool music_generate action=list
```

Dùng `action: "status"` để kiểm tra tác vụ nhạc có phiên hậu thuẫn đang hoạt động:

```text
/tool music_generate action=status
```

Ví dụ tạo trực tiếp:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Tham số công cụ

<ParamField path="prompt" type="string" required>
  Prompt tạo nhạc. Bắt buộc với `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` trả về tác vụ phiên hiện tại; `"list"` kiểm tra các nhà cung cấp.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè nhà cung cấp/mô hình (ví dụ `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Lời bài hát tùy chọn khi nhà cung cấp hỗ trợ đầu vào lời bài hát tường minh.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Yêu cầu đầu ra chỉ có nhạc không lời khi nhà cung cấp hỗ trợ.
</ParamField>
<ParamField path="image" type="string">
  Đường dẫn hoặc URL của một hình ảnh tham chiếu.
</ParamField>
<ParamField path="images" type="string[]">
  Nhiều hình ảnh tham chiếu (tối đa 10 trên các nhà cung cấp hỗ trợ).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Thời lượng mục tiêu tính bằng giây khi nhà cung cấp hỗ trợ gợi ý thời lượng.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Gợi ý định dạng đầu ra khi nhà cung cấp hỗ trợ.
</ParamField>
<ParamField path="filename" type="string">Gợi ý tên tệp đầu ra.</ParamField>
<ParamField path="timeoutMs" type="number">Thời gian chờ yêu cầu nhà cung cấp tùy chọn tính bằng mili giây. Các giá trị dưới 10000ms được nâng lên 10000ms và được báo cáo trong kết quả công cụ.</ParamField>

<Note>
Không phải tất cả nhà cung cấp đều hỗ trợ mọi tham số. OpenClaw vẫn xác thực
các giới hạn cứng như số lượng đầu vào trước khi gửi. Khi một nhà cung cấp hỗ trợ
thời lượng nhưng dùng mức tối đa ngắn hơn giá trị được yêu cầu, OpenClaw
giới hạn về thời lượng được hỗ trợ gần nhất. Các gợi ý tùy chọn thật sự không được hỗ trợ
sẽ bị bỏ qua kèm cảnh báo khi nhà cung cấp hoặc mô hình đã chọn không thể đáp ứng
chúng. Kết quả công cụ báo cáo các cài đặt đã áp dụng; `details.normalization`
ghi lại mọi ánh xạ từ giá trị được yêu cầu sang giá trị đã áp dụng.
</Note>

## Hành vi bất đồng bộ

Tạo nhạc có phiên hậu thuẫn chạy dưới dạng tác vụ nền:

- **Tác vụ nền:** `music_generate` tạo một tác vụ nền, trả về phản hồi
  đã bắt đầu/tác vụ ngay lập tức, và đăng bản nhạc hoàn chỉnh sau đó trong
  một tin nhắn tác tử tiếp theo.
- **Ngăn trùng lặp:** khi một tác vụ đang `queued` hoặc `running`, các lệnh gọi
  `music_generate` sau đó trong cùng phiên sẽ trả về trạng thái tác vụ thay vì
  bắt đầu một lượt tạo khác. Dùng `action: "status"` để kiểm tra tường minh.
- **Tra cứu trạng thái:** `openclaw tasks list` hoặc `openclaw tasks show <taskId>`
  kiểm tra trạng thái đang chờ, đang chạy và trạng thái kết thúc.
- **Đánh thức khi hoàn tất:** OpenClaw chèn một sự kiện hoàn tất nội bộ trở lại
  cùng phiên để mô hình có thể tự viết phản hồi tiếp theo hướng tới người dùng.
- **Gợi ý prompt:** các lượt người dùng/thủ công sau đó trong cùng phiên nhận được
  một gợi ý nhỏ lúc chạy khi một tác vụ nhạc đã đang thực thi, để mô hình
  không gọi mù quáng `music_generate` lần nữa.
- **Dự phòng không có phiên:** các ngữ cảnh trực tiếp/cục bộ không có phiên tác tử
  thật sẽ chạy nội tuyến và trả về kết quả âm thanh cuối cùng trong cùng lượt.

### Vòng đời tác vụ

| Trạng thái  | Ý nghĩa                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Tác vụ đã được tạo, đang chờ nhà cung cấp chấp nhận.                                           |
| `running`   | Nhà cung cấp đang xử lý (thường từ 30 giây đến 3 phút tùy nhà cung cấp và thời lượng). |
| `succeeded` | Bản nhạc đã sẵn sàng; tác tử được đánh thức và đăng nó vào cuộc trò chuyện.                                 |
| `failed`    | Lỗi nhà cung cấp hoặc hết thời gian chờ; tác tử được đánh thức cùng chi tiết lỗi.                                 |

Kiểm tra trạng thái từ CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## Cấu hình

### Chọn mô hình

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### Thứ tự chọn nhà cung cấp

OpenClaw thử các nhà cung cấp theo thứ tự này:

1. Tham số `model` từ lệnh gọi công cụ (nếu tác tử chỉ định).
2. `musicGenerationModel.primary` từ cấu hình.
3. `musicGenerationModel.fallbacks` theo thứ tự.
4. Tự động phát hiện chỉ bằng các mặc định nhà cung cấp có xác thực hậu thuẫn:
   - nhà cung cấp mặc định hiện tại trước;
   - các nhà cung cấp tạo nhạc đã đăng ký còn lại theo thứ tự mã định danh nhà cung cấp.

Nếu một nhà cung cấp thất bại, ứng viên tiếp theo sẽ được thử tự động. Nếu tất cả
đều thất bại, lỗi sẽ bao gồm chi tiết từ từng lần thử.

Đặt `agents.defaults.mediaGenerationAutoProviderFallback: false` để chỉ dùng
các mục `model`, `primary` và `fallbacks` tường minh.

## Ghi chú về nhà cung cấp

<AccordionGroup>
  <Accordion title="ComfyUI">
    Được dẫn dắt bởi workflow và phụ thuộc vào đồ thị đã cấu hình cùng ánh xạ nút
    cho các trường prompt/đầu ra. Plugin `comfy` đi kèm cắm vào
    công cụ `music_generate` dùng chung thông qua registry nhà cung cấp
    tạo nhạc.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Sử dụng tạo theo lô Lyria 3. Luồng đi kèm hiện tại hỗ trợ
    prompt, văn bản lời bài hát tùy chọn và hình ảnh tham chiếu tùy chọn.
  </Accordion>
  <Accordion title="MiniMax">
    Sử dụng endpoint `music_generation` theo lô. Hỗ trợ prompt, lời bài hát
    tùy chọn, chế độ nhạc không lời, điều hướng thời lượng và đầu ra mp3 thông qua
    xác thực khóa API `minimax` hoặc OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Chọn hướng đi phù hợp

- **Dùng chung có nhà cung cấp hậu thuẫn** khi bạn muốn chọn mô hình, chuyển đổi dự phòng
  nhà cung cấp và luồng tác vụ/trạng thái bất đồng bộ tích hợp sẵn.
- **Đường dẫn Plugin (ComfyUI)** khi bạn cần đồ thị workflow tùy chỉnh hoặc một
  nhà cung cấp không thuộc năng lực nhạc dùng chung đi kèm.

Nếu bạn đang gỡ lỗi hành vi riêng của ComfyUI, xem
[ComfyUI](/vi/providers/comfy). Nếu bạn đang gỡ lỗi hành vi nhà cung cấp dùng chung,
hãy bắt đầu với [Google (Gemini)](/vi/providers/google) hoặc
[MiniMax](/vi/providers/minimax).

## Chế độ năng lực của nhà cung cấp

Hợp đồng tạo nhạc dùng chung hỗ trợ khai báo chế độ tường minh:

- `generate` cho tạo chỉ bằng prompt.
- `edit` khi yêu cầu bao gồm một hoặc nhiều hình ảnh tham chiếu.

Các triển khai nhà cung cấp mới nên ưu tiên các khối chế độ tường minh:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

Các trường phẳng cũ như `maxInputImages`, `supportsLyrics` và
`supportsFormat` **không** đủ để quảng bá hỗ trợ chỉnh sửa. Nhà cung cấp
nên khai báo `generate` và `edit` tường minh để kiểm thử trực tiếp, kiểm thử hợp đồng
và công cụ `music_generate` dùng chung có thể xác thực hỗ trợ chế độ
một cách tất định.

## Kiểm thử trực tiếp

Phạm vi kiểm thử trực tiếp tự chọn cho các nhà cung cấp dùng chung đi kèm:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper repo:

```bash
pnpm test:live:media music
```

Tệp trực tiếp này tải các biến môi trường nhà cung cấp còn thiếu từ `~/.profile`, ưu tiên
khóa API trực tiếp/môi trường hơn hồ sơ xác thực đã lưu theo mặc định, và chạy cả
phạm vi `generate` lẫn `edit` đã khai báo khi nhà cung cấp bật chế độ chỉnh sửa.
Phạm vi hiện nay:

- `google`: `generate` cộng với `edit`
- `minimax`: chỉ `generate`
- `comfy`: phạm vi trực tiếp Comfy riêng, không nằm trong đợt quét nhà cung cấp dùng chung

Phạm vi kiểm thử trực tiếp tự chọn cho đường dẫn nhạc ComfyUI đi kèm:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Tệp live của Comfy cũng bao phủ các quy trình xử lý hình ảnh và video của comfy khi các
phần đó được cấu hình.

## Liên quan

- [Tác vụ nền](/vi/automation/tasks) — theo dõi tác vụ cho các lần chạy `music_generate` tách rời
- [ComfyUI](/vi/providers/comfy)
- [Tham chiếu cấu hình](/vi/gateway/config-agents#agent-defaults) — cấu hình `musicGenerationModel`
- [Google (Gemini)](/vi/providers/google)
- [MiniMax](/vi/providers/minimax)
- [Mô hình](/vi/concepts/models) — cấu hình mô hình và chuyển đổi dự phòng
- [Tổng quan về công cụ](/vi/tools)
