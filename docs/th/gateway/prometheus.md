---
read_when:
    - คุณต้องการให้ Prometheus, Grafana, VictoriaMetrics หรือ scraper อื่นเก็บ metrics ของ OpenClaw Gateway
    - คุณต้องการชื่อ metrics ของ Prometheus และนโยบาย labels สำหรับแดชบอร์ดหรือการแจ้งเตือน
    - คุณต้องการ metrics โดยไม่ต้องรัน OpenTelemetry collector
sidebarTitle: Prometheus
summary: เปิดเผยข้อมูลวินิจฉัยของ OpenClaw เป็น metrics ข้อความแบบ Prometheus ผ่าน plugin diagnostics-prometheus
title: metrics ของ Prometheus
x-i18n:
    generated_at: "2026-04-26T11:30:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29fd3e4658ceffe20f078e8e38b61c685ea9df518ca04ca34abf2085166eb481
    source_path: gateway/prometheus.md
    workflow: 15
---

OpenClaw สามารถเปิดเผย metrics สำหรับการวินิจฉัยผ่าน plugin แบบ bundled `diagnostics-prometheus` ได้ โดยมันจะรับข้อมูลการวินิจฉัยภายในที่เชื่อถือได้ และเรนเดอร์ endpoint ข้อความแบบ Prometheus ที่:

```text
GET /api/diagnostics/prometheus
```

Content type คือ `text/plain; version=0.0.4; charset=utf-8` ซึ่งเป็นรูปแบบ Prometheus exposition มาตรฐาน

<Warning>
เส้นทางนี้ใช้การยืนยันตัวตนของ Gateway (ขอบเขต operator) อย่าเปิดเผยเป็น endpoint `/metrics` สาธารณะที่ไม่ต้องยืนยันตัวตน ให้ scrape ผ่านเส้นทาง auth เดียวกับที่คุณใช้กับ operator APIs อื่นๆ
</Warning>

สำหรับ traces, logs, OTLP push และ OpenTelemetry GenAI semantic attributes ดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เปิดใช้ plugin">
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
  <Step title="รีสตาร์ต Gateway">
    เส้นทาง HTTP จะถูกลงทะเบียนตอน plugin startup ดังนั้นให้รีโหลดหลังจากเปิดใช้งาน
  </Step>
  <Step title="scrape เส้นทางที่มีการป้องกัน">
    ส่ง gateway auth เดียวกับที่ operator clients ของคุณใช้:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="ต่อเข้ากับ Prometheus">
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
จำเป็นต้องมี `diagnostics.enabled: true` หากไม่มี แม้ plugin จะยังลงทะเบียนเส้นทาง HTTP อยู่ แต่จะไม่มี diagnostic events ไหลเข้าสู่ exporter ดังนั้นผลตอบกลับจะว่างเปล่า
</Note>

## metrics ที่ส่งออก

| Metric                                        | Type      | Labels                                                                                    |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | counter   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`               | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                   | counter   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`        | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_tokens_total`                 | counter   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`          | histogram | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`               | counter   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_tool_execution_total`               | counter   | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_tool_execution_duration_seconds`    | histogram | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_harness_run_total`                  | counter   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | counter   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds` | histogram | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_total`             | counter   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_queue_lane_size`                    | gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                | counter   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | gauge     | `state`                                                                                   |
| `openclaw_memory_bytes`                       | gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | histogram | none                                                                                      |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | counter   | none                                                                                      |

## นโยบาย labels

<AccordionGroup>
  <Accordion title="labels แบบมีขอบเขตและมี cardinality ต่ำ">
    labels ของ Prometheus จะมีขอบเขตและมี cardinality ต่ำเสมอ exporter จะไม่ส่ง raw diagnostic identifiers เช่น `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, message IDs, chat IDs หรือ provider request IDs

    ค่า label จะถูก redacted และต้องเป็นไปตามนโยบายอักขระแบบ low-cardinality ของ OpenClaw ค่าที่ไม่ผ่านนโยบายจะถูกแทนที่ด้วย `unknown`, `other` หรือ `none` แล้วแต่ metric

  </Accordion>
  <Accordion title="เพดานจำนวน series และการนับ overflow">
    exporter จะจำกัดจำนวน time series ที่เก็บไว้ในหน่วยความจำไว้ที่ **2048** series รวมกันทั้ง counters, gauges และ histograms series ใหม่ที่เกินเพดานนี้จะถูกทิ้ง และ `openclaw_prometheus_series_dropped_total` จะเพิ่มขึ้นหนึ่งทุกครั้ง

    ให้เฝ้าดู counter นี้เป็นสัญญาณชัดเจนว่า attribute ต้นทางกำลังรั่วค่าแบบ high-cardinality exporter จะไม่ยกเพดานให้อัตโนมัติ; หากมันเพิ่มขึ้น ให้แก้ที่ต้นตอแทนการปิดเพดาน

  </Accordion>
  <Accordion title="สิ่งที่ไม่มีวันปรากฏในผลลัพธ์ Prometheus">
    - prompt text, response text, tool inputs, tool outputs, system prompts
    - raw provider request IDs (เฉพาะ bounded hashes เท่านั้น หากมี บน spans — ไม่มีวันอยู่บน metrics)
    - session keys และ session IDs
    - hostnames, file paths, secret values

  </Accordion>
</AccordionGroup>

## สูตร PromQL

```promql
# โทเคนต่อนาที แยกตาม provider
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# ค่าใช้จ่าย (USD) ตลอดชั่วโมงที่ผ่านมา แยกตาม model
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# ค่าร้อยเปอร์เซ็นไทล์ที่ 95 ของระยะเวลาการรัน model
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# SLO ของเวลารอคิว (95p ต่ำกว่า 2 วินาที)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Prometheus series ที่ถูกทิ้ง (สัญญาณเตือน cardinality)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
ควรใช้ `gen_ai_client_token_usage` สำหรับแดชบอร์ดข้ามผู้ให้บริการ: มันเป็นไปตาม OpenTelemetry GenAI semantic conventions และสอดคล้องกับ metrics จากบริการ GenAI อื่นที่ไม่ใช่ OpenClaw
</Tip>

## การเลือกระหว่าง Prometheus และการส่งออก OpenTelemetry

OpenClaw รองรับทั้งสองพื้นผิวแยกจากกัน คุณสามารถรันอย่างใดอย่างหนึ่ง ทั้งสองอย่าง หรือไม่รันเลยก็ได้

<Tabs>
  <Tab title="diagnostics-prometheus">
    - โมเดลแบบ **Pull**: Prometheus scrape จาก `/api/diagnostics/prometheus`
    - ไม่ต้องใช้ collector ภายนอก
    - ยืนยันตัวตนผ่าน Gateway auth ปกติ
    - พื้นผิวนี้มีเฉพาะ metrics (ไม่มี traces หรือ logs)
    - เหมาะที่สุดสำหรับสแตกที่ใช้ Prometheus + Grafana เป็นมาตรฐานอยู่แล้ว

  </Tab>
  <Tab title="diagnostics-otel">
    - โมเดลแบบ **Push**: OpenClaw ส่ง OTLP/HTTP ไปยัง collector หรือแบ็กเอนด์ที่เข้ากันได้กับ OTLP
    - พื้นผิวนี้รวม metrics, traces และ logs
    - เชื่อมไปยัง Prometheus ผ่าน OpenTelemetry Collector (`prometheus` หรือ exporter `prometheusremotewrite`) เมื่อคุณต้องการทั้งสองอย่าง
    - ดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry) สำหรับ catalog แบบเต็ม

  </Tab>
</Tabs>

## การแก้ปัญหา

<AccordionGroup>
  <Accordion title="เนื้อหาผลตอบกลับว่างเปล่า">
    - ตรวจสอบ `diagnostics.enabled: true` ในคอนฟิก
    - ยืนยันว่า plugin เปิดใช้งานและโหลดแล้วด้วย `openclaw plugins list --enabled`
    - สร้างทราฟฟิกบ้าง; counters และ histograms จะเริ่มส่งบรรทัดออกมาก็ต่อเมื่อมีเหตุการณ์อย่างน้อยหนึ่งครั้งแล้ว

  </Accordion>
  <Accordion title="401 / ไม่ได้รับอนุญาต">
    endpoint นี้ต้องใช้ขอบเขต operator ของ Gateway (`auth: "gateway"` พร้อม `gatewayRuntimeScopeSurface: "trusted-operator"`) ใช้ token หรือรหัสผ่านเดียวกับที่ Prometheus ใช้กับเส้นทาง operator อื่นของ Gateway ไม่มีโหมดสาธารณะแบบไม่ต้องยืนยันตัวตน
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` เพิ่มขึ้นเรื่อยๆ">
    attribute ใหม่กำลังเกินเพดาน **2048** series ให้ตรวจดู metrics ล่าสุดเพื่อหา label ที่มี cardinality สูงผิดปกติ แล้วแก้ที่ต้นทาง exporter ตั้งใจทิ้ง series ใหม่แทนการเขียน labels ใหม่แบบเงียบๆ
  </Accordion>
  <Accordion title="Prometheus แสดง series เก่าค้างหลังรีสตาร์ต">
    plugin เก็บสถานะไว้ในหน่วยความจำเท่านั้น หลังรีสตาร์ต Gateway counters จะรีเซ็ตเป็นศูนย์ และ gauges จะเริ่มใหม่ที่ค่าที่มีการรายงานครั้งถัดไป ใช้ PromQL `rate()` และ `increase()` เพื่อจัดการการรีเซ็ตอย่างถูกต้อง
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [การส่งออก Diagnostics](/th/gateway/diagnostics) — ไฟล์ zip ของ diagnostics ในเครื่องสำหรับ support bundles
- [Health และ readiness](/th/gateway/health) — probes `/healthz` และ `/readyz`
- [Logging](/th/logging) — logging แบบใช้ไฟล์
- [การส่งออก OpenTelemetry](/th/gateway/opentelemetry) — OTLP push สำหรับ traces, metrics และ logs
