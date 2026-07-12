---
read_when:
    - Tạo nhạc hoặc âm thanh thông qua tác tử
    - Cấu hình nhà cung cấp và mô hình tạo nhạc
    - Tìm hiểu các tham số của công cụ music_generate
sidebarTitle: Music generation
summary: Tạo nhạc qua music_generate bằng các quy trình làm việc của ComfyUI, fal, Google Lyria, MiniMax và OpenRouter
title: Tạo nhạc
x-i18n:
    generated_at: "2026-07-12T08:27:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a540f537141f0d97b264420aae9e986c1f0c3927b8988ebbaf3798b8afd5dd2
    source_path: tools/music-generation.md
    workflow: 16
---

Công cụ `music_generate` tạo nhạc hoặc âm thanh thông qua khả năng tạo nhạc dùng chung, được hỗ trợ bởi ComfyUI, fal, Google, MiniMax và OpenRouter.

<Note>
`music_generate` chỉ xuất hiện khi có ít nhất một nhà cung cấp tạo nhạc khả dụng: cấu hình `agents.defaults.musicGenerationModel` rõ ràng hoặc một nhà cung cấp đã được cấu hình xác thực (ví dụ: đã đặt khóa API).
</Note>

Đối với các lượt chạy tác nhân có phiên hỗ trợ, `music_generate` khởi chạy dưới dạng tác vụ nền, theo dõi tiến trình trong sổ cái tác vụ, rồi đánh thức tác nhân khi bản nhạc đã sẵn sàng để tác nhân có thể thông báo cho người dùng và đính kèm âm thanh hoàn chỉnh. Tác nhân hoàn tất tuân theo hợp đồng phản hồi hiển thị của phiên: tự động gửi phản hồi cuối cùng khi được cấu hình hoặc dùng `message(action="send")` khi phiên yêu cầu công cụ nhắn tin. Nếu phiên của bên yêu cầu không hoạt động hoặc không thể đánh thức phiên và phản hồi vẫn thiếu âm thanh đã tạo, OpenClaw sẽ gửi trực tiếp một phương án dự phòng có tính lũy đẳng chỉ chứa phần âm thanh còn thiếu.

## Bắt đầu nhanh

<Tabs>
  <Tab title="Được hỗ trợ bởi nhà cung cấp dùng chung">
    <Steps>
      <Step title="Cấu hình xác thực">
        Đặt khóa API cho ít nhất một nhà cung cấp — ví dụ:
        `GEMINI_API_KEY` hoặc `MINIMAX_API_KEY`.
      </Step>
      <Step title="Chọn mô hình mặc định (không bắt buộc)">
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
      <Step title="Yêu cầu tác nhân">
        _"Tạo một bản synthpop sôi động về chuyến lái xe ban đêm xuyên qua một thành phố
        rực ánh đèn neon."_

        Tác nhân tự động gọi `music_generate`. Không cần
        thêm công cụ vào danh sách cho phép.
      </Step>
    </Steps>

    Khi không có lượt chạy tác nhân được hỗ trợ bởi phiên (ngữ cảnh trực tiếp/cục bộ), công cụ
    chạy nội tuyến và trả về đường dẫn phương tiện cuối cùng trong cùng kết quả công cụ.

  </Tab>
  <Tab title="Quy trình làm việc ComfyUI">
    <Steps>
      <Step title="Cấu hình quy trình làm việc">
        Cấu hình `plugins.entries.comfy.config.music` với JSON của quy trình làm việc
        cùng các nút lời nhắc/đầu ra.
      </Step>
      <Step title="Xác thực đám mây (không bắt buộc)">
        Đối với Comfy Cloud, hãy đặt `COMFY_API_KEY` hoặc `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Gọi công cụ">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Ví dụ về lời nhắc:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

Dùng `action: "list"` để kiểm tra các nhà cung cấp/mô hình khả dụng và
`action: "status"` để kiểm tra tác vụ âm nhạc có phiên hỗ trợ đang hoạt động:

```text
/tool music_generate action=list
/tool music_generate action=status
```

Ví dụ tạo trực tiếp:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Các nhà cung cấp được hỗ trợ

| Nhà cung cấp | Mô hình mặc định              | Đầu vào tham chiếu | Các điều khiển được hỗ trợ                             | Xác thực                                |
| ------------ | ----------------------------- | ------------------ | ----------------------------------------------------- | --------------------------------------- |
| ComfyUI      | `workflow`                    | Tối đa 1 hình ảnh  | Nhạc hoặc âm thanh do quy trình làm việc xác định     | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY`  |
| fal          | `fal-ai/minimax-music/v2.6`   | Không có           | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` hoặc `FAL_API_KEY`            |
| Google       | `lyria-3-clip-preview`        | Tối đa 10 hình ảnh | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`      |
| MiniMax      | `music-2.6`                   | Không có           | `lyrics`, `instrumental`, `format` (chỉ mp3)          | `MINIMAX_API_KEY` hoặc OAuth của MiniMax |
| OpenRouter   | `google/lyria-3-pro-preview`  | Tối đa 1 hình ảnh  | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                    |

MiniMax đăng ký hai mã định danh nhà cung cấp dùng chung các mô hình: `minimax` cho
xác thực bằng khóa API và `minimax-portal` cho OAuth. Tham chiếu mô hình tuân theo phương thức xác thực
(`minimax/music-2.6` so với `minimax-portal/music-2.6`); xem
[MiniMax](/vi/providers/minimax#music-generation).

fal cũng cung cấp `fal-ai/ace-step/prompt-to-audio` (wav, không có lời bài hát, không có
tùy chọn bật/tắt nhạc không lời) và `fal-ai/stable-audio-25/text-to-audio` (wav,
chỉ dùng lời nhắc) bên cạnh mô hình mặc định được MiniMax hỗ trợ. Mô hình mặc định
`lyria-3-clip-preview` của Google chỉ xuất mp3; `lyria-3-pro-preview` cũng hỗ trợ
wav. MiniMax còn cung cấp `music-2.6-free`, `music-cover` và
`music-cover-free`. OpenRouter cũng cung cấp `google/lyria-3-clip-preview`.

### Ma trận khả năng

Hợp đồng chế độ rõ ràng được `music_generate`, các kiểm thử hợp đồng và
đợt quét trực tiếp dùng chung sử dụng:

| Nhà cung cấp | `generate` | `edit` | Giới hạn chỉnh sửa | Các luồng trực tiếp dùng chung                                              |
| ------------ | :--------: | :----: | ------------------ | --------------------------------------------------------------------------- |
| ComfyUI      |     ✓      |   ✓    | 1 hình ảnh         | Không có trong đợt quét dùng chung; được bao phủ bởi `extensions/comfy/comfy.live.test.ts` |
| fal          |     ✓      |   —    | Không có           | `generate`                                                                  |
| Google       |     ✓      |   ✓    | 10 hình ảnh        | `generate`, `edit`                                                          |
| MiniMax      |     ✓      |   —    | Không có           | `generate`                                                                  |
| OpenRouter   |     ✓      |   ✓    | 1 hình ảnh         | `generate`, `edit`                                                          |

## Tham số công cụ

<ParamField path="prompt" type="string" required>
  Lời nhắc tạo nhạc. Bắt buộc đối với `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` trả về tác vụ phiên hiện tại; `"list"` kiểm tra các nhà cung cấp.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè nhà cung cấp/mô hình (ví dụ: `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Lời bài hát không bắt buộc khi nhà cung cấp hỗ trợ đầu vào lời bài hát rõ ràng.
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

<Note>
Không phải mọi nhà cung cấp đều hỗ trợ tất cả tham số. OpenClaw vẫn xác thực các
giới hạn cứng, chẳng hạn như số lượng đầu vào, trước khi gửi yêu cầu. Khi nhà cung cấp hỗ trợ
thời lượng nhưng có giá trị tối đa ngắn hơn giá trị được yêu cầu, OpenClaw
giới hạn xuống thời lượng được hỗ trợ gần nhất. Các gợi ý không bắt buộc thực sự không được hỗ trợ
sẽ bị bỏ qua kèm cảnh báo khi nhà cung cấp hoặc mô hình đã chọn không thể đáp ứng
chúng. Kết quả công cụ báo cáo các thiết lập đã áp dụng; `details.normalization`
ghi lại mọi ánh xạ từ giá trị được yêu cầu sang giá trị được áp dụng.
</Note>

Thời gian chờ yêu cầu nhà cung cấp chỉ là cấu hình dành cho người vận hành. OpenClaw sử dụng
`agents.defaults.musicGenerationModel.timeoutMs` khi được cấu hình, nâng
các giá trị dưới 120000ms lên 120000ms và nếu không thì mặc định thời gian chờ yêu cầu
nhà cung cấp là 300000ms.

## Hành vi bất đồng bộ

Việc tạo nhạc có phiên hỗ trợ chạy dưới dạng tác vụ nền:

- **Tác vụ nền:** `music_generate` tạo tác vụ nền, ngay lập tức trả về phản hồi
  đã khởi chạy/tác vụ và đăng bản nhạc hoàn chỉnh sau đó trong
  tin nhắn tiếp theo của tác nhân.
- **Ngăn trùng lặp:** khi một tác vụ đang ở trạng thái `queued` hoặc `running`, các lần gọi
  `music_generate` tiếp theo trong cùng phiên sẽ trả về trạng thái tác vụ thay vì
  bắt đầu một lần tạo khác. Dùng `action: "status"` để kiểm tra rõ ràng.
  Yêu cầu khớp mới hoàn tất gần đây cũng được loại bỏ trùng lặp trong 2 phút.
- **Tra cứu trạng thái:** `openclaw tasks list` hoặc `openclaw tasks show <taskId>`
  kiểm tra trạng thái đang chờ, đang chạy và kết thúc.
- **Đánh thức khi hoàn tất:** OpenClaw chèn một sự kiện hoàn tất nội bộ trở lại
  cùng phiên để mô hình có thể tự viết thông báo tiếp theo hướng đến người dùng.
- **Gợi ý lời nhắc:** các lượt người dùng/thủ công sau đó trong cùng phiên nhận được một
  gợi ý nhỏ khi chạy nếu tác vụ âm nhạc đã đang được xử lý, để mô hình
  không gọi lại `music_generate` một cách mù quáng.
- **Phương án dự phòng khi không có phiên:** các ngữ cảnh trực tiếp/cục bộ không có phiên tác nhân
  thực sự sẽ chạy nội tuyến và trả về kết quả âm thanh cuối cùng trong cùng lượt.

### Vòng đời tác vụ

Tác vụ âm nhạc hiển thị các trạng thái giống như sổ đăng ký tác vụ chung (xem
[Tác vụ nền](/vi/automation/tasks#task-lifecycle) để biết toàn bộ máy trạng thái,
bao gồm `timed_out`, `cancelled` và `lost`). Hầu hết lượt chạy âm nhạc
chuyển qua:

| Trạng thái  | Ý nghĩa                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| `queued`    | Tác vụ đã được tạo, đang chờ nhà cung cấp chấp nhận.                                                       |
| `running`   | Nhà cung cấp đang xử lý (thường từ 30 giây đến 3 phút, tùy nhà cung cấp và thời lượng).                    |
| `succeeded` | Bản nhạc đã sẵn sàng; tác nhân được đánh thức và đăng bản nhạc vào cuộc trò chuyện.                        |
| `failed`    | Lỗi nhà cung cấp hoặc hết thời gian chờ; tác nhân được đánh thức cùng thông tin chi tiết về lỗi.           |

Kiểm tra trạng thái từ CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## Cấu hình

### Lựa chọn mô hình

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

### Thứ tự lựa chọn nhà cung cấp

OpenClaw thử các nhà cung cấp theo thứ tự sau:

1. Tham số `model` từ lệnh gọi công cụ (nếu tác nhân chỉ định).
2. `musicGenerationModel.primary` từ cấu hình.
3. `musicGenerationModel.fallbacks` theo thứ tự.
4. Tự động phát hiện chỉ bằng các giá trị mặc định của nhà cung cấp có xác thực:
   - nhà cung cấp mô hình văn bản mặc định hiện tại trước, nếu nhà cung cấp đó cũng hỗ trợ
     tạo nhạc;
   - các nhà cung cấp tạo nhạc đã đăng ký còn lại, theo thứ tự chữ cái của
     mã định danh nhà cung cấp.

Nếu một nhà cung cấp thất bại, ứng viên tiếp theo sẽ tự động được thử. Nếu tất cả
đều thất bại, lỗi sẽ bao gồm thông tin chi tiết từ mỗi lần thử.

Đặt `agents.defaults.mediaGenerationAutoProviderFallback: false` để chỉ sử dụng
các mục `model`, `primary` và `fallbacks` được chỉ định rõ ràng.

## Ghi chú về nhà cung cấp

<AccordionGroup>
  <Accordion title="ComfyUI">
    Hoạt động theo quy trình và phụ thuộc vào biểu đồ đã cấu hình cùng ánh xạ Node
    cho các trường lời nhắc/đầu ra. Plugin `comfy` đi kèm tích hợp với công cụ
    `music_generate` dùng chung thông qua sổ đăng ký nhà cung cấp tạo nhạc.
  </Accordion>
  <Accordion title="fal">
    Sử dụng các điểm cuối mô hình fal thông qua đường dẫn xác thực nhà cung cấp dùng chung. Nhà
    cung cấp đi kèm mặc định sử dụng `fal-ai/minimax-music/v2.6` và cũng cung cấp
    `fal-ai/ace-step/prompt-to-audio` cùng
    `fal-ai/stable-audio-25/text-to-audio` cho các yêu cầu chuyển lời nhắc thành âm thanh.
    Lời bài hát và chế độ nhạc không lời chỉ dành cho mô hình MiniMax; hai
    mô hình còn lại chỉ hỗ trợ lời nhắc.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Sử dụng khả năng tạo hàng loạt của Lyria 3. Luồng đi kèm hiện tại hỗ trợ
    lời nhắc, văn bản lời bài hát tùy chọn và hình ảnh tham chiếu tùy chọn. Mô hình
    `lyria-3-clip-preview` mặc định chỉ xuất mp3; mô hình
    `lyria-3-pro-preview` cũng hỗ trợ wav.
  </Accordion>
  <Accordion title="MiniMax">
    Sử dụng điểm cuối `music_generation` theo lô. Hỗ trợ lời nhắc, lời bài hát
    tùy chọn, chế độ nhạc không lời và đầu ra mp3 thông qua xác thực bằng khóa API
    `minimax` hoặc OAuth `minimax-portal`. Đồng thời cung cấp các mô hình
    `music-2.6-free`, `music-cover` và `music-cover-free`.
  </Accordion>
  <Accordion title="OpenRouter">
    Sử dụng đầu ra âm thanh từ tính năng hoàn thành trò chuyện của OpenRouter khi bật truyền phát trực tiếp. Nhà
    cung cấp đi kèm mặc định sử dụng `google/lyria-3-pro-preview` và cũng cung cấp
    `openrouter/google/lyria-3-clip-preview`.
  </Accordion>
</AccordionGroup>

## Chọn đường dẫn phù hợp

- **Dựa trên nhà cung cấp dùng chung** khi bạn muốn chọn mô hình, chuyển đổi dự phòng
  giữa các nhà cung cấp và luồng tác vụ/trạng thái bất đồng bộ tích hợp sẵn.
- **Đường dẫn Plugin (ComfyUI)** khi bạn cần một biểu đồ quy trình tùy chỉnh hoặc một
  nhà cung cấp không thuộc khả năng tạo nhạc dùng chung đi kèm.

Nếu bạn đang gỡ lỗi hành vi riêng của ComfyUI, hãy xem
[ComfyUI](/vi/providers/comfy). Nếu bạn đang gỡ lỗi hành vi của nhà cung cấp
dùng chung, hãy bắt đầu với [fal](/vi/providers/fal), [Google (Gemini)](/vi/providers/google),
[MiniMax](/vi/providers/minimax) hoặc [OpenRouter](/vi/providers/openrouter).

## Các chế độ khả năng của nhà cung cấp

Hợp đồng tạo nhạc dùng chung hỗ trợ khai báo chế độ tường minh:

- `generate` dành cho việc tạo chỉ từ lời nhắc.
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
`supportsFormat` **không** đủ để công bố hỗ trợ chỉnh sửa. Các nhà cung cấp
nên khai báo tường minh `generate` và `edit` để các kiểm thử trực tiếp, kiểm thử
hợp đồng và công cụ `music_generate` dùng chung có thể xác thực khả năng hỗ trợ chế độ
một cách xác định.

## Kiểm thử trực tiếp

Phạm vi kiểm thử trực tiếp tùy chọn cho các nhà cung cấp dùng chung đi kèm (fal, Google, MiniMax,
OpenRouter):

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Trình bao bọc kho lưu trữ tương đương, chạy cùng một tệp kiểm thử:

```bash
pnpm test:live:media:music
```

Theo mặc định, tệp kiểm thử trực tiếp này ưu tiên sử dụng các biến môi trường của nhà cung cấp đã được xuất
trước các hồ sơ xác thực đã lưu trữ, đồng thời chạy cả phạm vi `generate` và `edit`
đã khai báo khi nhà cung cấp bật chế độ chỉnh sửa. Phạm vi hiện tại:

- `google`: `generate` cùng với `edit`
- `fal`: chỉ `generate`
- `minimax`: chỉ `generate`
- `openrouter`: `generate` cùng với `edit`
- `comfy`: phạm vi kiểm thử trực tiếp Comfy riêng, không thuộc lượt quét nhà cung cấp dùng chung

Phạm vi kiểm thử trực tiếp tùy chọn cho đường dẫn tạo nhạc ComfyUI đi kèm:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Tệp kiểm thử trực tiếp Comfy cũng bao quát các quy trình hình ảnh và video của comfy khi các
phần đó được cấu hình.

## Liên quan

- [Tác vụ nền](/vi/automation/tasks) — theo dõi tác vụ cho các lần chạy `music_generate` tách rời
- [ComfyUI](/vi/providers/comfy)
- [Tham chiếu cấu hình](/vi/gateway/config-agents#agent-defaults) — cấu hình `musicGenerationModel`
- [Google (Gemini)](/vi/providers/google)
- [MiniMax](/vi/providers/minimax)
- [Mô hình](/vi/concepts/models) — cấu hình mô hình và chuyển đổi dự phòng
- [Tổng quan về công cụ](/vi/tools)
