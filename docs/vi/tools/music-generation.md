---
read_when:
    - Tạo nhạc hoặc âm thanh thông qua agent
    - Định cấu hình nhà cung cấp và mô hình tạo nhạc
    - Hiểu các tham số của công cụ music_generate
sidebarTitle: Music generation
summary: Tạo nhạc bằng music_generate trên các quy trình làm việc ComfyUI, fal, Google Lyria, MiniMax và OpenRouter
title: Tạo nhạc
x-i18n:
    generated_at: "2026-06-27T18:17:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4fe6ad09b6e2cfae03bc5d5ef4368e80845a9e4a8c25c6303e181a6436a17c7e
    source_path: tools/music-generation.md
    workflow: 16
---

Công cụ `music_generate` cho phép agent tạo nhạc hoặc âm thanh thông qua
khả năng tạo nhạc dùng chung với các nhà cung cấp đã cấu hình — hiện có
ComfyUI, fal, Google, MiniMax và OpenRouter.

Đối với các lượt chạy agent có phiên hỗ trợ, OpenClaw bắt đầu tạo nhạc như
một tác vụ nền, theo dõi tác vụ đó trong sổ cái tác vụ, rồi đánh thức lại
agent khi bản nhạc đã sẵn sàng để agent có thể báo cho người dùng và đính kèm
âm thanh hoàn tất. Agent hoàn tất tuân theo chế độ phản hồi hiển thị thông
thường của phiên: tự động gửi phản hồi cuối khi được cấu hình, hoặc
`message(action="send")` khi phiên yêu cầu công cụ nhắn tin. Nếu phiên yêu
cầu không hoạt động hoặc lần đánh thức đang hoạt động của phiên thất bại, và
một phần âm thanh đã tạo vẫn còn thiếu trong phản hồi hoàn tất, OpenClaw gửi
một phương án dự phòng trực tiếp có tính lũy đẳng chỉ kèm phần âm thanh còn
thiếu.

<Note>
Công cụ dùng chung tích hợp sẵn chỉ xuất hiện khi có ít nhất một nhà cung cấp
tạo nhạc khả dụng. Nếu bạn không thấy `music_generate` trong các công cụ của
agent, hãy cấu hình `agents.defaults.musicGenerationModel` hoặc thiết lập khóa
API của nhà cung cấp.
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
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        Agent tự động gọi `music_generate`. Không cần danh sách cho phép
        công cụ.
      </Step>
    </Steps>

    Đối với các ngữ cảnh đồng bộ trực tiếp không có lượt chạy agent có phiên
    hỗ trợ, công cụ tích hợp sẵn vẫn dự phòng sang tạo nội tuyến và trả về
    đường dẫn phương tiện cuối trong kết quả công cụ.

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        Cấu hình `plugins.entries.comfy.config.music` với JSON quy trình làm việc
        và các nút prompt/đầu ra.
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

| Nhà cung cấp | Mô hình mặc định             | Đầu vào tham chiếu | Điều khiển được hỗ trợ                             | Xác thực                                |
| ------------ | ---------------------------- | ------------------ | -------------------------------------------------- | --------------------------------------- |
| ComfyUI      | `workflow`                   | Tối đa 1 ảnh       | Nhạc hoặc âm thanh do quy trình làm việc xác định  | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal          | `fal-ai/minimax-music/v2.6`  | Không có           | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` hoặc `FAL_API_KEY`            |
| Google       | `lyria-3-clip-preview`       | Tối đa 10 ảnh      | `lyrics`, `instrumental`, `format`                 | `GEMINI_API_KEY`, `GOOGLE_API_KEY`      |
| MiniMax      | `music-2.6`                  | Không có           | `lyrics`, `instrumental`, `format=mp3`             | `MINIMAX_API_KEY` hoặc MiniMax OAuth    |
| OpenRouter   | `google/lyria-3-pro-preview` | Tối đa 1 ảnh       | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                    |

### Ma trận khả năng

Hợp đồng chế độ rõ ràng được `music_generate`, các kiểm thử hợp đồng và
đợt quét trực tiếp dùng chung sử dụng:

| Nhà cung cấp | `generate` | `edit` | Giới hạn chỉnh sửa | Làn trực tiếp dùng chung                                                   |
| ------------ | :--------: | :----: | ------------------ | -------------------------------------------------------------------------- |
| ComfyUI      |     ✓      |   ✓    | 1 ảnh              | Không nằm trong đợt quét dùng chung; được bao phủ bởi `extensions/comfy/comfy.live.test.ts` |
| fal          |     ✓      |   —    | Không có           | `generate`                                                                 |
| Google       |     ✓      |   ✓    | 10 ảnh             | `generate`, `edit`                                                         |
| MiniMax      |     ✓      |   —    | Không có           | `generate`                                                                 |
| OpenRouter   |     ✓      |   ✓    | 1 ảnh              | `generate`, `edit`                                                         |

Dùng `action: "list"` để kiểm tra các nhà cung cấp và mô hình dùng chung
khả dụng lúc chạy:

```text
/tool music_generate action=list
```

Dùng `action: "status"` để kiểm tra tác vụ nhạc đang hoạt động có phiên hỗ trợ:

```text
/tool music_generate action=status
```

Ví dụ tạo trực tiếp:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Tham số công cụ

<ParamField path="prompt" type="string" required>
  Prompt tạo nhạc. Bắt buộc đối với `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` trả về tác vụ phiên hiện tại; `"list"` kiểm tra nhà cung cấp.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè nhà cung cấp/mô hình (ví dụ `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Lời bài hát tùy chọn khi nhà cung cấp hỗ trợ đầu vào lời bài hát rõ ràng.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Yêu cầu đầu ra chỉ có nhạc cụ khi nhà cung cấp hỗ trợ.
</ParamField>
<ParamField path="image" type="string">
  Đường dẫn hoặc URL của một ảnh tham chiếu.
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

<Note>
Không phải nhà cung cấp nào cũng hỗ trợ mọi tham số. OpenClaw vẫn xác thực
các giới hạn cứng như số lượng đầu vào trước khi gửi. Khi nhà cung cấp hỗ trợ
thời lượng nhưng dùng mức tối đa ngắn hơn giá trị được yêu cầu, OpenClaw sẽ
kẹp về thời lượng được hỗ trợ gần nhất. Các gợi ý tùy chọn thật sự không
được hỗ trợ sẽ bị bỏ qua kèm cảnh báo khi nhà cung cấp hoặc mô hình đã chọn
không thể đáp ứng. Kết quả công cụ báo cáo các thiết lập đã áp dụng;
`details.normalization` ghi lại mọi ánh xạ từ yêu cầu sang áp dụng.
</Note>

Thời gian chờ yêu cầu nhà cung cấp chỉ là cấu hình của người vận hành.
OpenClaw dùng `agents.defaults.musicGenerationModel.timeoutMs` khi được cấu
hình, nâng các giá trị dưới 120000ms lên 120000ms, và nếu không thì mặc định
yêu cầu nhà cung cấp là 300000ms.

## Hành vi bất đồng bộ

Tạo nhạc có phiên hỗ trợ chạy như một tác vụ nền:

- **Tác vụ nền:** `music_generate` tạo một tác vụ nền, trả về phản hồi
  đã bắt đầu/tác vụ ngay lập tức, và đăng bản nhạc hoàn tất sau trong một
  tin nhắn agent tiếp theo.
- **Ngăn trùng lặp:** khi một tác vụ đang `queued` hoặc `running`, các lệnh
  gọi `music_generate` sau đó trong cùng phiên sẽ trả về trạng thái tác vụ
  thay vì bắt đầu một lần tạo khác. Dùng `action: "status"` để kiểm tra rõ ràng.
- **Tra cứu trạng thái:** `openclaw tasks list` hoặc `openclaw tasks show <taskId>`
  kiểm tra trạng thái đang xếp hàng, đang chạy và trạng thái kết thúc.
- **Đánh thức hoàn tất:** OpenClaw tiêm một sự kiện hoàn tất nội bộ trở lại
  cùng phiên để mô hình có thể tự viết phản hồi tiếp theo hướng tới người dùng.
- **Gợi ý prompt:** các lượt người dùng/thủ công sau trong cùng phiên nhận
  một gợi ý runtime nhỏ khi đã có tác vụ nhạc đang chạy, để mô hình không
  gọi lại `music_generate` một cách mù quáng.
- **Dự phòng không có phiên:** các ngữ cảnh trực tiếp/cục bộ không có phiên
  agent thật sẽ chạy nội tuyến và trả về kết quả âm thanh cuối trong cùng lượt.

### Vòng đời tác vụ

| Trạng thái  | Ý nghĩa                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------- |
| `queued`    | Tác vụ đã được tạo, đang chờ nhà cung cấp chấp nhận.                                          |
| `running`   | Nhà cung cấp đang xử lý (thường 30 giây đến 3 phút tùy nhà cung cấp và thời lượng).           |
| `succeeded` | Bản nhạc đã sẵn sàng; agent được đánh thức và đăng vào cuộc trò chuyện.                       |
| `failed`    | Lỗi nhà cung cấp hoặc hết thời gian chờ; agent được đánh thức kèm chi tiết lỗi.               |

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
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
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
   - các nhà cung cấp tạo nhạc đã đăng ký còn lại theo thứ tự provider-id.

Nếu một nhà cung cấp thất bại, ứng viên tiếp theo sẽ được thử tự động. Nếu
tất cả đều thất bại, lỗi sẽ bao gồm chi tiết từ từng lần thử.

Đặt `agents.defaults.mediaGenerationAutoProviderFallback: false` để chỉ dùng
các mục `model`, `primary` và `fallbacks` rõ ràng.

## Ghi chú về nhà cung cấp

<AccordionGroup>
  <Accordion title="ComfyUI">
    Được điều khiển bằng quy trình làm việc và phụ thuộc vào đồ thị đã cấu hình
    cùng ánh xạ nút cho các trường prompt/đầu ra. Plugin `comfy` đi kèm kết nối
    vào công cụ `music_generate` dùng chung thông qua sổ đăng ký nhà cung cấp
    tạo nhạc.
  </Accordion>
  <Accordion title="fal">
    Dùng các endpoint mô hình fal thông qua đường dẫn xác thực nhà cung cấp
    dùng chung. Nhà cung cấp đi kèm mặc định là `fal-ai/minimax-music/v2.6`
    và cũng cung cấp `fal-ai/ace-step/prompt-to-audio` cùng
    `fal-ai/stable-audio-25/text-to-audio` cho các yêu cầu prompt-to-audio.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Dùng tạo hàng loạt Lyria 3. Luồng đi kèm hiện tại hỗ trợ prompt, văn bản
    lời bài hát tùy chọn và ảnh tham chiếu tùy chọn.
  </Accordion>
  <Accordion title="MiniMax">
    Dùng endpoint hàng loạt `music_generation`. Hỗ trợ prompt, lời bài hát
    tùy chọn, chế độ nhạc cụ và đầu ra mp3 thông qua xác thực khóa API
    `minimax` hoặc OAuth `minimax-portal`.
  </Accordion>
  <Accordion title="OpenRouter">
    Dùng đầu ra âm thanh của hoàn tất trò chuyện OpenRouter với streaming được
    bật. Nhà cung cấp đi kèm mặc định là `google/lyria-3-pro-preview` và cũng
    cung cấp `openrouter/google/lyria-3-clip-preview`.
  </Accordion>
</AccordionGroup>

## Chọn đường dẫn phù hợp

- **Dựa trên nhà cung cấp dùng chung** khi bạn muốn chọn mô hình, chuyển đổi
  dự phòng nhà cung cấp và luồng tác vụ/trạng thái bất đồng bộ tích hợp sẵn.
- **Đường dẫn Plugin (ComfyUI)** khi bạn cần đồ thị quy trình làm việc tùy chỉnh
  hoặc một nhà cung cấp không thuộc khả năng nhạc dùng chung đi kèm.

Nếu bạn đang gỡ lỗi hành vi dành riêng cho ComfyUI, hãy xem
[ComfyUI](/vi/providers/comfy). Nếu bạn đang gỡ lỗi hành vi nhà cung cấp dùng chung,
hãy bắt đầu với [fal](/vi/providers/fal), [Google (Gemini)](/vi/providers/google),
[MiniMax](/vi/providers/minimax), hoặc [OpenRouter](/vi/providers/openrouter).

## Chế độ năng lực của nhà cung cấp

Hợp đồng tạo nhạc dùng chung hỗ trợ khai báo chế độ rõ ràng:

- `generate` để tạo chỉ từ prompt.
- `edit` khi yêu cầu bao gồm một hoặc nhiều ảnh tham chiếu.

Các triển khai nhà cung cấp mới nên ưu tiên các khối chế độ rõ ràng:

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

Các trường phẳng cũ như `maxInputImages`, `supportsLyrics`, và
`supportsFormat` là **không** đủ để quảng bá hỗ trợ chỉnh sửa. Nhà cung cấp
nên khai báo `generate` và `edit` một cách rõ ràng để kiểm thử live, kiểm thử
hợp đồng, và công cụ dùng chung `music_generate` có thể xác thực hỗ trợ chế độ
một cách tất định.

## Kiểm thử live

Phạm vi kiểm thử live chọn tham gia cho các nhà cung cấp được đóng gói dùng chung:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Trình bao bọc repo:

```bash
pnpm test:live:media music
```

Tệp live này mặc định dùng các biến môi trường nhà cung cấp đã xuất trước các
hồ sơ xác thực đã lưu, và chạy cả phạm vi `generate` lẫn `edit` đã khai báo khi
nhà cung cấp bật chế độ chỉnh sửa. Phạm vi hiện nay:

- `google`: `generate` cộng với `edit`
- `fal`: chỉ `generate`
- `minimax`: chỉ `generate`
- `openrouter`: `generate` cộng với `edit`
- `comfy`: phạm vi live Comfy riêng, không thuộc lượt quét nhà cung cấp dùng chung

Phạm vi kiểm thử live chọn tham gia cho đường dẫn nhạc ComfyUI được đóng gói:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Tệp live Comfy cũng bao phủ các workflow ảnh và video của comfy khi những
phần đó được cấu hình.

## Liên quan

- [Tác vụ nền](/vi/automation/tasks) — theo dõi tác vụ cho các lần chạy `music_generate` tách rời
- [ComfyUI](/vi/providers/comfy)
- [Tham chiếu cấu hình](/vi/gateway/config-agents#agent-defaults) — cấu hình `musicGenerationModel`
- [Google (Gemini)](/vi/providers/google)
- [MiniMax](/vi/providers/minimax)
- [Mô hình](/vi/concepts/models) — cấu hình mô hình và chuyển đổi dự phòng
- [Tổng quan công cụ](/vi/tools)
