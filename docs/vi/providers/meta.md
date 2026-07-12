---
read_when:
    - Bạn muốn sử dụng Meta với OpenClaw
    - Bạn cần biến môi trường MODEL_API_KEY hoặc tùy chọn xác thực CLI
summary: Thiết lập Meta (xác thực + lựa chọn mô hình muse-spark-1.1)
title: Siêu dữ liệu
x-i18n:
    generated_at: "2026-07-12T08:16:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2ce7616d9abc14a2d15ee53ea7725d3e70059af1a38bb61dbfe5b3969106432
    source_path: providers/meta.md
    workflow: 16
---

**Meta API** sử dụng **Responses API** tương thích với OpenAI (`POST /v1/responses`)
cho mô hình suy luận `muse-spark-1.1`. Nhà cung cấp được phân phối dưới dạng plugin OpenClaw
đi kèm.

| Thuộc tính              | Giá trị                            |
| ----------------------- | ---------------------------------- |
| ID nhà cung cấp         | `meta`                             |
| Plugin                  | nhà cung cấp đi kèm                |
| Biến môi trường xác thực | `MODEL_API_KEY`                   |
| Cờ thiết lập ban đầu    | `--auth-choice meta-api-key`       |
| Cờ CLI trực tiếp        | `--meta-api-key <key>`             |
| API                     | Responses API (`openai-responses`) |
| URL cơ sở               | `https://api.meta.ai/v1`           |
| Mô hình mặc định        | `meta/muse-spark-1.1`              |
| Mức suy luận mặc định   | `high` (`reasoning.effort`)        |

## Bắt đầu

<Steps>
  <Step title="Đặt khóa API">
    <CodeGroup>

```bash Thiết lập ban đầu
openclaw onboard --auth-choice meta-api-key
```

```bash Cờ trực tiếp
openclaw onboard --non-interactive --accept-risk \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

```bash Chỉ dùng biến môi trường
export MODEL_API_KEY=<key>
```

    </CodeGroup>

  </Step>
  <Step title="Xác minh các mô hình khả dụng">
    ```bash
    openclaw models list --provider meta
    ```

    Liệt kê mục danh mục tĩnh `muse-spark-1.1`. Nếu không thể phân giải `MODEL_API_KEY`,
    `openclaw models status --json` sẽ báo thông tin xác thực còn thiếu trong
    `auth.unusableProfiles`.

  </Step>
</Steps>

## Thiết lập không tương tác

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

## Danh mục tích hợp sẵn

| Tham chiếu mô hình      | Tên            | Suy luận | Cửa sổ ngữ cảnh | Đầu ra tối đa |
| ----------------------- | -------------- | -------- | --------------- | ------------- |
| `meta/muse-spark-1.1`   | Muse Spark 1.1 | có       | 1,048,576       | 131,072       |

Khả năng:

- Đầu vào văn bản + hình ảnh
- Gọi công cụ và truyền phát
- Mức độ suy luận: `minimal`, `low`, `medium`, `high`, `xhigh` (mặc định: `high`)
- Phát lại suy luận được mã hóa không lưu trạng thái (`store: false`, `include: ["reasoning.encrypted_content"]`)

<Warning>
`muse-spark-1.1` không chấp nhận `reasoning.effort: "none"`. OpenClaw ánh xạ
`--thinking off` thành `minimal` cho nhà cung cấp này.
</Warning>

## Cấu hình thủ công

```json5
{
  env: { MODEL_API_KEY: "<key>" },
  agents: {
    defaults: {
      model: { primary: "meta/muse-spark-1.1" },
      models: {
        "meta/muse-spark-1.1": { alias: "Muse Spark 1.1" },
      },
    },
  },
}
```

<Note>
Nếu Gateway chạy dưới dạng tiến trình nền (launchd, systemd, Docker), hãy đảm bảo
`MODEL_API_KEY` khả dụng cho tiến trình đó — ví dụ trong
`~/.openclaw/.env` hoặc thông qua `env.shellEnv`. Khóa chỉ được xuất trong
shell tương tác sẽ không có tác dụng với dịch vụ được quản lý, trừ khi môi trường được nhập
riêng.
</Note>

## Kiểm thử nhanh

```bash
export MODEL_API_KEY=<key>
pnpm test:live -- extensions/meta/meta.live.test.ts
```

Các kiểm thử trực tiếp sử dụng `muse-spark-1.1` với `POST /v1/responses`.

## Liên quan

<CardGroup cols={2}>
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Chế độ suy luận" href="/vi/tools/thinking" icon="brain">
    Các mức độ suy luận cho muse-spark-1.1.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/config-agents#agent-defaults" icon="gear">
    Giá trị mặc định của tác nhân và cấu hình mô hình.
  </Card>
</CardGroup>
