---
read_when:
    - คุณต้องการให้ Prometheus, Grafana, VictoriaMetrics หรือเครื่องมือเก็บข้อมูลอื่นรวบรวมเมตริกของ OpenClaw Gateway
    - คุณต้องการชื่อเมตริก Prometheus และนโยบายป้ายกำกับสำหรับแดชบอร์ดหรือการแจ้งเตือน
    - คุณต้องการเมตริกโดยไม่ต้องเรียกใช้ตัวรวบรวม OpenTelemetry
sidebarTitle: Prometheus
summary: เปิดเผยข้อมูลวินิจฉัยของ OpenClaw เป็นเมตริกข้อความ Prometheus ผ่าน Plugin diagnostics-prometheus
title: เมตริก Prometheus
x-i18n:
    generated_at: "2026-04-30T09:54:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: d75a97a0b9dedd89eb25fee83626d8d726917872cc1c3bfcbf6e9634dd168a2b
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw สามารถเปิดเผยเมตริกการวินิจฉัยผ่าน Plugin `diagnostics-prometheus` ที่รวมมาให้ได้ โดยจะฟังการวินิจฉัยภายในที่เชื่อถือได้และแสดงปลายทางข้อความของ Prometheus ที่:

```text
GET /api/diagnostics/prometheus
```

ชนิดเนื้อหาคือ `text/plain; version=0.0.4; charset=utf-8` ซึ่งเป็นรูปแบบการเผยแพร่มาตรฐานของ Prometheus

<Warning>
เส้นทางนี้ใช้การยืนยันตัวตนของ Gateway (ขอบเขตผู้ปฏิบัติงาน) อย่าเปิดเผยเป็นปลายทาง `/metrics` สาธารณะที่ไม่ต้องยืนยันตัวตน ให้ scrape ผ่านเส้นทางการยืนยันตัวตนเดียวกับที่คุณใช้สำหรับ API ผู้ปฏิบัติงานอื่น
</Warning>

สำหรับ traces, logs, OTLP push และแอตทริบิวต์เชิงความหมาย OpenTelemetry GenAI โปรดดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เปิดใช้งาน Plugin">
    <Tabs>
      <Tab title="การกำหนดค่า">
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
  <Step title="รีสตาร์ท Gateway">
    เส้นทาง HTTP จะถูกลงทะเบียนเมื่อ Plugin เริ่มทำงาน ดังนั้นให้โหลดใหม่หลังจากเปิดใช้งาน
  </Step>
  <Step title="Scrape เส้นทางที่ได้รับการป้องกัน">
    ส่งการยืนยันตัวตน Gateway แบบเดียวกับที่ไคลเอนต์ผู้ปฏิบัติงานของคุณใช้:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="เชื่อมต่อ Prometheus">
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
จำเป็นต้องตั้งค่า `diagnostics.enabled: true` หากไม่มีค่านี้ Plugin จะยังลงทะเบียนเส้นทาง HTTP แต่เหตุการณ์วินิจฉัยจะไม่ไหลเข้าสู่ exporter ดังนั้นการตอบกลับจะว่างเปล่า
</Note>

## เมตริกที่ส่งออก

| เมตริก                                        | ชนิด      | ป้ายกำกับ                                                                                 |
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
| `openclaw_memory_rss_bytes`                   | histogram | ไม่มี                                                                                     |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | counter   | ไม่มี                                                                                     |

## นโยบายป้ายกำกับ

<AccordionGroup>
  <Accordion title="ป้ายกำกับที่มีขอบเขตจำกัดและมีคาร์ดินาลิตีต่ำ">
    ป้ายกำกับ Prometheus จะยังคงมีขอบเขตจำกัดและมีคาร์ดินาลิตีต่ำ exporter จะไม่ปล่อยตัวระบุการวินิจฉัยแบบดิบ เช่น `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ID ข้อความ, ID แชท หรือ ID คำขอของผู้ให้บริการ

    ค่าป้ายกำกับจะถูกปกปิดและต้องตรงกับนโยบายอักขระคาร์ดินาลิตีต่ำของ OpenClaw ค่าที่ไม่ผ่านนโยบายจะถูกแทนที่ด้วย `unknown`, `other` หรือ `none` ตามเมตริกนั้น

  </Accordion>
  <Accordion title="ขีดจำกัดซีรีส์และการนับส่วนเกิน">
    exporter จำกัด time series ที่เก็บไว้ในหน่วยความจำไว้ที่ **2048** ซีรีส์ เมื่อรวม counters, gauges และ histograms เข้าด้วยกัน ซีรีส์ใหม่ที่เกินขีดจำกัดนั้นจะถูกทิ้ง และ `openclaw_prometheus_series_dropped_total` จะเพิ่มขึ้นหนึ่งทุกครั้ง

    เฝ้าดู counter นี้เป็นสัญญาณชัดเจนว่าแอตทริบิวต์จากต้นทางกำลังรั่วค่าที่มีคาร์ดินาลิตีสูง exporter จะไม่ยกขีดจำกัดโดยอัตโนมัติ หากค่านี้เพิ่มขึ้น ให้แก้ที่ต้นทางแทนการปิดขีดจำกัด

  </Accordion>
  <Accordion title="สิ่งที่ไม่เคยปรากฏในเอาต์พุต Prometheus">
    - ข้อความ prompt, ข้อความตอบกลับ, อินพุตของเครื่องมือ, เอาต์พุตของเครื่องมือ, system prompts
    - ID คำขอของผู้ให้บริการแบบดิบ (เฉพาะแฮชที่มีขอบเขตจำกัดในกรณีที่ใช้ได้ บน spans เท่านั้น ไม่ใช่บนเมตริก)
    - คีย์เซสชันและ ID เซสชัน
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

OpenClaw รองรับทั้งสองพื้นผิวอย่างเป็นอิสระ คุณสามารถใช้แบบใดแบบหนึ่ง ทั้งสองแบบ หรือไม่ใช้เลยก็ได้

<Tabs>
  <Tab title="diagnostics-prometheus">
    - โมเดล **Pull**: Prometheus scrape `/api/diagnostics/prometheus`
    - ไม่ต้องมี collector ภายนอก
    - ยืนยันตัวตนผ่านการยืนยันตัวตน Gateway ปกติ
    - พื้นผิวมีเฉพาะเมตริกเท่านั้น (ไม่มี traces หรือ logs)
    - เหมาะที่สุดสำหรับสแตกที่ได้มาตรฐานบน Prometheus + Grafana อยู่แล้ว

  </Tab>
  <Tab title="diagnostics-otel">
    - โมเดล **Push**: OpenClaw ส่ง OTLP/HTTP ไปยัง collector หรือ backend ที่เข้ากันได้กับ OTLP
    - พื้นผิวมีเมตริก, traces และ logs
    - เชื่อมต่อไปยัง Prometheus ผ่าน OpenTelemetry Collector (exporter `prometheus` หรือ `prometheusremotewrite`) เมื่อคุณต้องการทั้งสองอย่าง
    - ดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry) สำหรับแคตตาล็อกฉบับเต็ม

  </Tab>
</Tabs>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="เนื้อหาการตอบกลับว่างเปล่า">
    - ตรวจสอบ `diagnostics.enabled: true` ในการกำหนดค่า
    - ยืนยันว่า Plugin เปิดใช้งานและโหลดแล้วด้วย `openclaw plugins list --enabled`
    - สร้างทราฟฟิกบางส่วน counters และ histograms จะปล่อยบรรทัดหลังจากมีเหตุการณ์อย่างน้อยหนึ่งเหตุการณ์เท่านั้น

  </Accordion>
  <Accordion title="401 / ไม่ได้รับอนุญาต">
    ปลายทางนี้ต้องใช้ขอบเขตผู้ปฏิบัติงานของ Gateway (`auth: "gateway"` พร้อม `gatewayRuntimeScopeSurface: "trusted-operator"`) ใช้ token หรือรหัสผ่านเดียวกับที่ Prometheus ใช้สำหรับเส้นทางผู้ปฏิบัติงาน Gateway อื่น ไม่มีโหมดสาธารณะที่ไม่ต้องยืนยันตัวตน
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` กำลังเพิ่มขึ้น">
    แอตทริบิวต์ใหม่กำลังเกินขีดจำกัด **2048** ซีรีส์ ตรวจสอบเมตริกล่าสุดเพื่อหาป้ายกำกับที่มีคาร์ดินาลิตีสูงผิดคาดและแก้ไขที่ต้นทาง exporter ตั้งใจทิ้งซีรีส์ใหม่แทนการเขียนป้ายกำกับใหม่อย่างเงียบ ๆ
  </Accordion>
  <Accordion title="Prometheus แสดงซีรีส์เก่าหลังจากรีสตาร์ท">
    Plugin เก็บสถานะไว้ในหน่วยความจำเท่านั้น หลังจากรีสตาร์ท Gateway counters จะรีเซ็ตเป็นศูนย์ และ gauges จะเริ่มใหม่ที่ค่าที่รายงานครั้งถัดไป ใช้ PromQL `rate()` และ `increase()` เพื่อจัดการการรีเซ็ตอย่างเรียบร้อย
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [การส่งออกการวินิจฉัย](/th/gateway/diagnostics) — zip การวินิจฉัยภายในเครื่องสำหรับชุดข้อมูลสนับสนุน
- [สุขภาพและความพร้อม](/th/gateway/health) — probes `/healthz` และ `/readyz`
- [การบันทึก](/th/logging) — การบันทึกแบบไฟล์
- [การส่งออก OpenTelemetry](/th/gateway/opentelemetry) — OTLP push สำหรับ traces, metrics และ logs
