---
read_when:
    - Tạo nhạc hoặc âm thanh thông qua tác nhân
    - Cấu hình các nhà cung cấp và mô hình tạo nhạc
    - Tìm hiểu các tham số của công cụ music_generate
sidebarTitle: Music generation
summary: Tạo nhạc thông qua music_generate trên các quy trình làm việc của Google Lyria, MiniMax và ComfyUI
title: Tạo nhạc
x-i18n:
    generated_at: "2026-05-05T06:19:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5e74aa7d43ffe00adb6d6c170d36dbc107f2baf0069243733c5dd6e4582175a
    source_path: tools/music-generation.md
    workflow: 16
---

Công cụ `music_generate` cho phép agent tạo nhạc hoặc âm thanh thông qua năng lực tạo nhạc dùng chung với các nhà cung cấp đã cấu hình — hiện gồm Google, MiniMax và ComfyUI được cấu hình bằng quy trình làm việc.

Đối với các lượt chạy agent có phiên hỗ trợ, OpenClaw bắt đầu tạo nhạc như một tác vụ nền, theo dõi tác vụ đó trong sổ cái tác vụ, rồi đánh thức lại agent khi bản nhạc sẵn sàng để agent có thể báo cho người dùng và đính kèm âm thanh đã hoàn tất. Trong các cuộc trò chuyện nhóm/kênh dùng cơ chế gửi hiển thị chỉ qua công cụ tin nhắn, agent chuyển tiếp kết quả qua công cụ tin nhắn. Nếu agent hoàn tất chỉ viết phản hồi cuối riêng tư, OpenClaw sẽ dự phòng bằng cách gửi trực tiếp qua kênh cùng phương tiện đã tạo. Lượt đánh thức khi hoàn tất cảnh báo rõ cho agent rằng các phản hồi cuối thông thường là riêng tư trong các tuyến đó.

<Note>
Công cụ dùng chung tích hợp chỉ xuất hiện khi có ít nhất một nhà cung cấp tạo nhạc khả dụng. Nếu bạn không thấy `music_generate` trong các công cụ của agent, hãy cấu hình `agents.defaults.musicGenerationModel` hoặc thiết lập khóa API của nhà cung cấp.
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
        _"Tạo một bản nhạc synthpop sôi động về chuyến lái xe ban đêm qua một
        thành phố neon."_

        Agent tự động gọi `music_generate`. Không cần danh sách cho phép
        công cụ.
      </Step>
    </Steps>

    Đối với các ngữ cảnh đồng bộ trực tiếp không có lượt chạy agent có phiên
    hỗ trợ, công cụ tích hợp vẫn dự phòng sang tạo nội tuyến và trả về
    đường dẫn phương tiện cuối trong kết quả công cụ.

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        Cấu hình `plugins.entries.comfy.config.music` với JSON quy trình
        làm việc và các nút lời nhắc/đầu ra.
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

Ví dụ lời nhắc:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## Nhà cung cấp được hỗ trợ

| Nhà cung cấp | Mô hình mặc định       | Đầu vào tham chiếu | Điều khiển được hỗ trợ                                | Xác thực                               |
| ------------ | ---------------------- | ------------------ | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI      | `workflow`             | Tối đa 1 ảnh       | Nhạc hoặc âm thanh do quy trình làm việc định nghĩa   | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google       | `lyria-3-clip-preview` | Tối đa 10 ảnh      | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax      | `music-2.6`            | Không có           | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` hoặc MiniMax OAuth   |

### Ma trận năng lực

Hợp đồng chế độ tường minh được `music_generate`, các kiểm thử hợp đồng và lượt quét trực tiếp dùng chung sử dụng:

| Nhà cung cấp | `generate` | `edit` | Giới hạn chỉnh sửa | Làn trực tiếp dùng chung                                                   |
| ------------ | :--------: | :----: | ------------------ | -------------------------------------------------------------------------- |
| ComfyUI      |     ✓      |   ✓    | 1 ảnh              | Không nằm trong lượt quét dùng chung; được bao phủ bởi `extensions/comfy/comfy.live.test.ts` |
| Google       |     ✓      |   ✓    | 10 ảnh             | `generate`, `edit`                                                         |
| MiniMax      |     ✓      |   —    | Không có           | `generate`                                                                 |

Dùng `action: "list"` để kiểm tra các nhà cung cấp và mô hình dùng chung khả dụng lúc chạy:

```text
/tool music_generate action=list
```

Dùng `action: "status"` để kiểm tra tác vụ nhạc có phiên hỗ trợ đang hoạt động:

```text
/tool music_generate action=status
```

Ví dụ tạo trực tiếp:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Tham số công cụ

<ParamField path="prompt" type="string" required>
  Lời nhắc tạo nhạc. Bắt buộc với `action: "generate"`.
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
  Yêu cầu đầu ra chỉ có nhạc cụ khi nhà cung cấp hỗ trợ.
</ParamField>
<ParamField path="image" type="string">
  Đường dẫn hoặc URL ảnh tham chiếu đơn.
</ParamField>
<ParamField path="images" type="string[]">
  Nhiều ảnh tham chiếu (tối đa 10 trên các nhà cung cấp hỗ trợ).
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
Không phải mọi nhà cung cấp đều hỗ trợ tất cả tham số. OpenClaw vẫn xác thực các giới hạn cứng như số lượng đầu vào trước khi gửi. Khi một nhà cung cấp hỗ trợ thời lượng nhưng dùng mức tối đa ngắn hơn giá trị được yêu cầu, OpenClaw kẹp về thời lượng được hỗ trợ gần nhất. Các gợi ý tùy chọn thực sự không được hỗ trợ sẽ bị bỏ qua kèm cảnh báo khi nhà cung cấp hoặc mô hình đã chọn không thể đáp ứng chúng. Kết quả công cụ báo cáo các thiết lập đã áp dụng; `details.normalization` ghi lại mọi ánh xạ từ giá trị được yêu cầu sang giá trị đã áp dụng.
</Note>

## Hành vi bất đồng bộ

Tạo nhạc có phiên hỗ trợ chạy như một tác vụ nền:

- **Tác vụ nền:** `music_generate` tạo một tác vụ nền, trả về phản hồi đã bắt đầu/tác vụ ngay lập tức, rồi đăng bản nhạc đã hoàn tất sau đó trong một tin nhắn agent tiếp theo.
- **Ngăn trùng lặp:** khi một tác vụ đang ở trạng thái `queued` hoặc `running`, các lệnh gọi `music_generate` sau đó trong cùng phiên sẽ trả về trạng thái tác vụ thay vì bắt đầu một lượt tạo khác. Dùng `action: "status"` để kiểm tra tường minh.
- **Tra cứu trạng thái:** `openclaw tasks list` hoặc `openclaw tasks show <taskId>` kiểm tra trạng thái đang xếp hàng, đang chạy và trạng thái kết thúc.
- **Đánh thức khi hoàn tất:** OpenClaw chèn một sự kiện hoàn tất nội bộ trở lại cùng phiên để mô hình có thể tự viết phần tiếp theo hướng tới người dùng.
- **Gợi ý lời nhắc:** các lượt người dùng/thủ công sau trong cùng phiên nhận được một gợi ý nhỏ lúc chạy khi một tác vụ nhạc đang được thực hiện, để mô hình không gọi lại `music_generate` một cách mù quáng.
- **Dự phòng không có phiên:** các ngữ cảnh trực tiếp/cục bộ không có phiên agent thực sẽ chạy nội tuyến và trả về kết quả âm thanh cuối trong cùng lượt.

### Vòng đời tác vụ

| Trạng thái  | Ý nghĩa                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------- |
| `queued`    | Tác vụ đã được tạo, đang chờ nhà cung cấp chấp nhận.                                            |
| `running`   | Nhà cung cấp đang xử lý (thường 30 giây đến 3 phút tùy theo nhà cung cấp và thời lượng).        |
| `succeeded` | Bản nhạc đã sẵn sàng; agent được đánh thức và đăng vào cuộc trò chuyện.                         |
| `failed`    | Lỗi nhà cung cấp hoặc hết thời gian chờ; agent được đánh thức với chi tiết lỗi.                 |

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

1. Tham số `model` từ lệnh gọi công cụ (nếu agent chỉ định).
2. `musicGenerationModel.primary` từ cấu hình.
3. `musicGenerationModel.fallbacks` theo thứ tự.
4. Tự động phát hiện chỉ bằng các mặc định nhà cung cấp có xác thực:
   - nhà cung cấp mặc định hiện tại trước;
   - các nhà cung cấp tạo nhạc còn lại đã đăng ký theo thứ tự mã định danh nhà cung cấp.

Nếu một nhà cung cấp thất bại, ứng viên tiếp theo sẽ được thử tự động. Nếu tất cả đều thất bại, lỗi sẽ bao gồm chi tiết từ từng lần thử.

Đặt `agents.defaults.mediaGenerationAutoProviderFallback: false` để chỉ dùng các mục `model`, `primary` và `fallbacks` tường minh.

## Ghi chú nhà cung cấp

<AccordionGroup>
  <Accordion title="ComfyUI">
    Được điều khiển bởi quy trình làm việc và phụ thuộc vào đồ thị đã cấu hình cùng ánh xạ nút cho các trường lời nhắc/đầu ra. Plugin `comfy` đi kèm kết nối với công cụ `music_generate` dùng chung thông qua registry nhà cung cấp tạo nhạc.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Dùng tạo theo lô Lyria 3. Luồng đi kèm hiện tại hỗ trợ lời nhắc, văn bản lời bài hát tùy chọn và ảnh tham chiếu tùy chọn.
  </Accordion>
  <Accordion title="MiniMax">
    Dùng endpoint `music_generation` theo lô. Hỗ trợ lời nhắc, lời bài hát tùy chọn, chế độ nhạc cụ, điều hướng thời lượng và đầu ra mp3 thông qua xác thực khóa API `minimax` hoặc OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Chọn hướng phù hợp

- **Được hỗ trợ bởi nhà cung cấp dùng chung** khi bạn muốn chọn mô hình, chuyển đổi dự phòng nhà cung cấp và luồng tác vụ/trạng thái bất đồng bộ tích hợp.
- **Đường dẫn Plugin (ComfyUI)** khi bạn cần đồ thị quy trình làm việc tùy chỉnh hoặc một nhà cung cấp không thuộc năng lực nhạc dùng chung đi kèm.

Nếu bạn đang gỡ lỗi hành vi dành riêng cho ComfyUI, xem
[ComfyUI](/vi/providers/comfy). Nếu bạn đang gỡ lỗi hành vi nhà cung cấp dùng chung, hãy bắt đầu với [Google (Gemini)](/vi/providers/google) hoặc
[MiniMax](/vi/providers/minimax).

## Chế độ năng lực nhà cung cấp

Hợp đồng tạo nhạc dùng chung hỗ trợ các khai báo chế độ tường minh:

- `generate` để tạo chỉ bằng lời nhắc.
- `edit` khi yêu cầu bao gồm một hoặc nhiều ảnh tham chiếu.

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
`supportsFormat` **không** đủ để quảng bá hỗ trợ chỉnh sửa. Nhà cung cấp nên khai báo `generate` và `edit` tường minh để các kiểm thử trực tiếp, kiểm thử hợp đồng và công cụ `music_generate` dùng chung có thể xác thực hỗ trợ chế độ một cách xác định.

## Kiểm thử trực tiếp

Phạm vi trực tiếp tự chọn cho các nhà cung cấp dùng chung đi kèm:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Trình bao repo:

```bash
pnpm test:live:media music
```

Tệp trực tiếp này tải các biến môi trường nhà cung cấp còn thiếu từ `~/.profile`, mặc định ưu tiên khóa API trực tiếp/từ môi trường trước các hồ sơ xác thực đã lưu, và chạy cả phạm vi `generate` lẫn `edit` đã khai báo khi nhà cung cấp bật chế độ chỉnh sửa. Phạm vi hiện nay:

- `google`: `generate` cùng với `edit`
- `minimax`: chỉ `generate`
- `comfy`: phạm vi kiểm thử live Comfy riêng, không phải đợt quét nhà cung cấp dùng chung

Phạm vi kiểm thử live tùy chọn cho đường dẫn nhạc ComfyUI đi kèm:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Tệp live của Comfy cũng bao phủ các quy trình ảnh và video của comfy khi các
phần đó được cấu hình.

## Liên quan

- [Tác vụ nền](/vi/automation/tasks) — theo dõi tác vụ cho các lần chạy `music_generate` tách rời
- [ComfyUI](/vi/providers/comfy)
- [Tham chiếu cấu hình](/vi/gateway/config-agents#agent-defaults) — cấu hình `musicGenerationModel`
- [Google (Gemini)](/vi/providers/google)
- [MiniMax](/vi/providers/minimax)
- [Mô hình](/vi/concepts/models) — cấu hình mô hình và chuyển đổi dự phòng
- [Tổng quan về công cụ](/vi/tools)
