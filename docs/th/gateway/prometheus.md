---
read_when:
    - คุณต้องการให้ Prometheus, Grafana, VictoriaMetrics หรือตัวดึงข้อมูลอื่นรวบรวมเมตริกของ OpenClaw Gateway
    - คุณต้องใช้ชื่อเมตริกของ Prometheus และนโยบายป้ายกำกับสำหรับแดชบอร์ดหรือการแจ้งเตือน
    - คุณต้องการเมตริกโดยไม่ต้องรันตัวเก็บรวบรวม OpenTelemetry
sidebarTitle: Prometheus
summary: เปิดเผยข้อมูลวินิจฉัยของ OpenClaw เป็นเมตริกข้อความของ Prometheus ผ่าน Plugin diagnostics-prometheus
title: เมตริกของ Prometheus
x-i18n:
    generated_at: "2026-05-02T20:44:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49df17348c5b63c4b5f3c05f3378d43764e5de985135ad30c1e74ef607e0dd37
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw สามารถเปิดเผยเมตริกการวินิจฉัยผ่าน Plugin ทางการ `diagnostics-prometheus` ได้ โดยจะรับฟังการวินิจฉัยภายในที่เชื่อถือได้และแสดง endpoint ข้อความ Prometheus ที่:

```text
GET /api/diagnostics/prometheus
```

ชนิดเนื้อหาคือ `text/plain; version=0.0.4; charset=utf-8` ซึ่งเป็นรูปแบบการเปิดเผยข้อมูลมาตรฐานของ Prometheus

<Warning>
เส้นทางนี้ใช้การยืนยันตัวตนของ Gateway (ขอบเขตผู้ปฏิบัติการ) อย่าเปิดเผยเป็น endpoint `/metrics` แบบสาธารณะที่ไม่ต้องยืนยันตัวตน ให้ scrape ผ่านเส้นทาง auth เดียวกับที่คุณใช้สำหรับ API ผู้ปฏิบัติการอื่น ๆ
</Warning>

สำหรับ traces, logs, OTLP push และแอตทริบิวต์เชิงความหมาย OpenTelemetry GenAI โปรดดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Enable the plugin">
    <Tabs>
      <Tab title="Config">
        ```json5
        {
          plugins: {
            allow: ["diagnostics-prometheus"],
            entries: {
              "diagnostics-prometheus": { enabled: true },
            },
          },
          diagnostics: {
            enabled: true,
          },
        }
        ```
      </Tab>
      <Tab title="CLI">
        ```bash
        openclaw plugins enable diagnostics-prometheus
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Restart the Gateway">
    เส้นทาง HTTP จะถูกลงทะเบียนเมื่อ Plugin เริ่มทำงาน ดังนั้นให้โหลดใหม่หลังเปิดใช้งาน
  </Step>
  <Step title="Scrape the protected route">
    ส่ง auth ของ gateway แบบเดียวกับที่ไคลเอนต์ผู้ปฏิบัติการของคุณใช้:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Wire Prometheus">
    ```yaml
    # prometheus.yml
    scrape_configs:
      - job_name: openclaw
        scrape_interval: 30s
        metrics_path: /api/diagnostics/prometheus
        authorization:
          credentials_file: /etc/prometheus/openclaw-gateway-token
        static_configs:
          - targets: ["openclaw-gateway:18789"]
    ```
  </Step>
</Steps>

<Note>
ต้องตั้งค่า `diagnostics.enabled: true` หากไม่มีค่านี้ Plugin จะยังลงทะเบียนเส้นทาง HTTP แต่จะไม่มีเหตุการณ์การวินิจฉัยไหลเข้าสู่ตัวส่งออก ดังนั้นการตอบกลับจะว่างเปล่า
</Note>

## เมตริกที่ส่งออก

| เมตริก                                        | ประเภท      | ป้ายกำกับ                                                                                    |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | ตัวนับ   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`               | ฮิสโตแกรม | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                   | ตัวนับ   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`        | ฮิสโตแกรม | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_tokens_total`                 | ตัวนับ   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`          | ฮิสโตแกรม | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`               | ตัวนับ   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_tool_execution_total`               | ตัวนับ   | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_tool_execution_duration_seconds`    | ฮิสโตแกรม | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_harness_run_total`                  | ตัวนับ   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | ฮิสโตแกรม | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | ตัวนับ   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds` | ฮิสโตแกรม | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_total`             | ตัวนับ   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | ฮิสโตแกรม | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_queue_lane_size`                    | เกจ     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | ฮิสโตแกรม | `lane`                                                                                    |
| `openclaw_session_state_total`                | ตัวนับ   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | เกจ     | `state`                                                                                   |
| `openclaw_memory_bytes`                       | เกจ     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | ฮิสโตแกรม | ไม่มี                                                                                      |
| `openclaw_memory_pressure_total`              | ตัวนับ   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | ตัวนับ   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | ตัวนับ   | ไม่มี                                                                                      |

## นโยบายป้ายกำกับ

<AccordionGroup>
  <Accordion title="Bounded, low-cardinality labels">
    ป้ายกำกับ Prometheus จะมีขอบเขตจำกัดและมีคาร์ดินัลลิตีต่ำ ตัวส่งออกจะไม่ปล่อยตัวระบุการวินิจฉัยดิบ เช่น `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ID ข้อความ, ID แชต หรือ ID คำขอของผู้ให้บริการ

    ค่าป้ายกำกับจะถูกปกปิดและต้องตรงกับนโยบายอักขระคาร์ดินัลลิตีต่ำของ OpenClaw ค่าที่ไม่ผ่านนโยบายจะถูกแทนที่ด้วย `unknown`, `other` หรือ `none` ขึ้นอยู่กับเมตริก

  </Accordion>
  <Accordion title="Series cap and overflow accounting">
    ตัวส่งออกจำกัด time series ที่เก็บไว้ในหน่วยความจำไว้ที่ **2048** series รวมกันทั้งตัวนับ เกจ และฮิสโตแกรม series ใหม่ที่เกินขีดจำกัดนี้จะถูกทิ้ง และ `openclaw_prometheus_series_dropped_total` จะเพิ่มขึ้นหนึ่งทุกครั้ง

    เฝ้าดูตัวนับนี้เป็นสัญญาณชัดเจนว่าแอตทริบิวต์ต้นทางกำลังรั่วค่าคาร์ดินัลลิตีสูง ตัวส่งออกจะไม่ยกเลิกขีดจำกัดโดยอัตโนมัติ หากค่านี้เพิ่มขึ้น ให้แก้ที่ต้นทางแทนการปิดใช้ขีดจำกัด

  </Accordion>
  <Accordion title="What never appears in Prometheus output">
    - ข้อความ prompt, ข้อความตอบกลับ, อินพุตของเครื่องมือ, เอาต์พุตของเครื่องมือ, system prompts
    - ID คำขอของผู้ให้บริการแบบดิบ (เฉพาะ hash ที่มีขอบเขตจำกัดในกรณีที่ใช้ได้บน spans เท่านั้น — ไม่อยู่บนเมตริกเด็ดขาด)
    - session keys และ session IDs
    - ชื่อโฮสต์, เส้นทางไฟล์, ค่าลับ

  </Accordion>
</AccordionGroup>

## สูตร PromQL

```promql
# Tokens per minute, split by provider
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Spend (USD) over the last hour, by model
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 95th percentile model run duration
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# Queue wait time SLO (95p under 2s)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
ควรใช้ `gen_ai_client_token_usage` สำหรับแดชบอร์ดข้ามผู้ให้บริการ: ค่านี้ทำตามข้อตกลงเชิงความหมาย OpenTelemetry GenAI และสอดคล้องกับเมตริกจากบริการ GenAI ที่ไม่ใช่ OpenClaw
</Tip>

## การเลือกระหว่างการส่งออก Prometheus และ OpenTelemetry

OpenClaw รองรับทั้งสองพื้นผิวอย่างเป็นอิสระ คุณสามารถเปิดใช้อย่างใดอย่างหนึ่ง ทั้งสองอย่าง หรือไม่เปิดเลยก็ได้

<Tabs>
  <Tab title="diagnostics-prometheus">
    - โมเดล **Pull**: Prometheus scrape `/api/diagnostics/prometheus`
    - ไม่ต้องใช้ collector ภายนอก
    - ยืนยันตัวตนผ่าน auth ของ Gateway ตามปกติ
    - พื้นผิวนี้เป็นเมตริกเท่านั้น (ไม่มี traces หรือ logs)
    - เหมาะที่สุดสำหรับสแต็กที่ทำมาตรฐานไว้กับ Prometheus + Grafana แล้ว

  </Tab>
  <Tab title="diagnostics-otel">
    - โมเดล **Push**: OpenClaw ส่ง OTLP/HTTP ไปยัง collector หรือ backend ที่เข้ากันได้กับ OTLP
    - พื้นผิวนี้มีเมตริก traces และ logs
    - เชื่อมต่อไปยัง Prometheus ผ่าน OpenTelemetry Collector (ตัวส่งออก `prometheus` หรือ `prometheusremotewrite`) เมื่อคุณต้องการทั้งสองอย่าง
    - ดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry) สำหรับแค็ตตาล็อกฉบับเต็ม

  </Tab>
</Tabs>

## การแก้ปัญหา

<AccordionGroup>
  <Accordion title="Empty response body">
    - ตรวจสอบ `diagnostics.enabled: true` ใน config
    - ยืนยันว่า Plugin เปิดใช้งานและโหลดอยู่ด้วย `openclaw plugins list --enabled`
    - สร้างทราฟฟิกบางส่วน ตัวนับและฮิสโตแกรมจะปล่อยบรรทัดหลังมีเหตุการณ์อย่างน้อยหนึ่งรายการเท่านั้น

  </Accordion>
  <Accordion title="401 / unauthorized">
    endpoint นี้ต้องใช้ขอบเขตผู้ปฏิบัติการของ Gateway (`auth: "gateway"` พร้อม `gatewayRuntimeScopeSurface: "trusted-operator"`) ใช้ token หรือรหัสผ่านเดียวกับที่ Prometheus ใช้สำหรับเส้นทางผู้ปฏิบัติการ Gateway อื่น ๆ ไม่มีโหมดสาธารณะที่ไม่ต้องยืนยันตัวตน
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` is climbing">
    แอตทริบิวต์ใหม่กำลังเกินขีดจำกัด **2048** series ตรวจสอบเมตริกล่าสุดเพื่อหาป้ายกำกับที่มีคาร์ดินัลลิตีสูงผิดคาด และแก้ไขที่ต้นทาง ตัวส่งออกตั้งใจทิ้ง series ใหม่แทนที่จะเขียนป้ายกำกับใหม่แบบเงียบ ๆ
  </Accordion>
  <Accordion title="Prometheus shows stale series after a restart">
    Plugin เก็บสถานะไว้ในหน่วยความจำเท่านั้น หลังรีสตาร์ท Gateway ตัวนับจะรีเซ็ตเป็นศูนย์ และเกจจะเริ่มใหม่ที่ค่าที่รายงานครั้งถัดไป ใช้ PromQL `rate()` และ `increase()` เพื่อจัดการการรีเซ็ตอย่างสะอาด
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [การส่งออกการวินิจฉัย](/th/gateway/diagnostics) — zip การวินิจฉัยในเครื่องสำหรับชุดข้อมูลสนับสนุน
- [สุขภาพและความพร้อมใช้งาน](/th/gateway/health) — โพรบ `/healthz` และ `/readyz`
- [การบันทึก](/th/logging) — การบันทึกแบบใช้ไฟล์
- [การส่งออก OpenTelemetry](/th/gateway/opentelemetry) — OTLP push สำหรับ traces, metrics และ logs
