---
read_when:
    - คุณต้องการให้ Prometheus, Grafana, VictoriaMetrics หรือตัวดึงข้อมูลอื่นเก็บรวบรวมเมตริกของ OpenClaw Gateway
    - คุณต้องการชื่อเมตริกของ Prometheus และนโยบายป้ายกำกับสำหรับแดชบอร์ดหรือการแจ้งเตือน
    - คุณต้องการเมตริกโดยไม่ต้องเรียกใช้ตัวเก็บรวบรวม OpenTelemetry
sidebarTitle: Prometheus
summary: เปิดเผยข้อมูลวินิจฉัยของ OpenClaw เป็นเมตริกข้อความของ Prometheus ผ่าน Plugin diagnostics-prometheus
title: เมตริก Prometheus
x-i18n:
    generated_at: "2026-05-06T10:30:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 864e2a343266d84baaaaca9d8e494359198a3b43e8663ec8dcfcd4e2e4c6c004
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw สามารถเปิดเผยเมตริกการวินิจฉัยผ่าน Plugin ทางการ `diagnostics-prometheus` ได้ โดยจะฟังการวินิจฉัยภายในที่เชื่อถือได้และแสดง endpoint ข้อความ Prometheus ที่:

```text
GET /api/diagnostics/prometheus
```

ชนิดเนื้อหาคือ `text/plain; version=0.0.4; charset=utf-8` ซึ่งเป็นรูปแบบ exposition มาตรฐานของ Prometheus

<Warning>
เส้นทางนี้ใช้การยืนยันตัวตนของ Gateway (ขอบเขต operator) อย่าเปิดเผยเป็น endpoint `/metrics` สาธารณะที่ไม่ต้องยืนยันตัวตน ให้ scrape ผ่านเส้นทาง auth เดียวกับที่คุณใช้สำหรับ API operator อื่นๆ
</Warning>

สำหรับ traces, logs, OTLP push และแอตทริบิวต์เชิงความหมาย OpenTelemetry GenAI โปรดดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ติดตั้ง Plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="เปิดใช้ Plugin">
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
  <Step title="รีสตาร์ท Gateway">
    เส้นทาง HTTP จะถูกลงทะเบียนเมื่อ Plugin เริ่มทำงาน ดังนั้นให้โหลดใหม่หลังจากเปิดใช้
  </Step>
  <Step title="Scrape เส้นทางที่ได้รับการป้องกัน">
    ส่ง gateway auth เดียวกับที่ไคลเอนต์ operator ของคุณใช้:

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
จำเป็นต้องมี `diagnostics.enabled: true` หากไม่มี คำตอบจะว่างเปล่าเพราะ Plugin ยังลงทะเบียนเส้นทาง HTTP อยู่ แต่ไม่มี event การวินิจฉัยไหลเข้าสู่ exporter
</Note>

## เมตริกที่ส่งออก

| เมตริก                                        | ประเภท      | ป้ายกำกับ                                                                                    |
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
| `openclaw_message_delivery_started_total`     | counter   | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`             | counter   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                   | counter   | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`        | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                   | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                    | gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                | counter   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | gauge     | `state`                                                                                   |
| `openclaw_session_recovery_total`             | counter   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`       | histogram | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_memory_bytes`                       | gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | histogram | ไม่มี                                                                                      |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | counter   | ไม่มี                                                                                      |

## นโยบายป้ายกำกับ

<AccordionGroup>
  <Accordion title="ป้ายกำกับที่มีขอบเขตจำกัดและมีคาร์ดินาลิตีต่ำ">
    ป้ายกำกับ Prometheus ยังคงมีขอบเขตจำกัดและมีคาร์ดินาลิตีต่ำ exporter จะไม่ปล่อยตัวระบุการวินิจฉัยดิบ เช่น `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ID ข้อความ, ID แชต หรือ ID คำขอของ provider

    ค่าป้ายกำกับจะถูกปกปิดข้อมูลและต้องตรงกับนโยบายอักขระคาร์ดินาลิตีต่ำของ OpenClaw ค่าที่ไม่ผ่านนโยบายจะถูกแทนที่ด้วย `unknown`, `other` หรือ `none` ขึ้นอยู่กับเมตริก

  </Accordion>
  <Accordion title="เพดานซีรีส์และการบัญชีส่วนเกิน">
    ตัวส่งออกจำกัดซีรีส์เวลาที่เก็บไว้ในหน่วยความจำไว้ที่ **2048** ซีรีส์ รวมทั้งตัวนับ เกจ และฮิสโตแกรม ซีรีส์ใหม่ที่เกินเพดานนั้นจะถูกทิ้ง และ `openclaw_prometheus_series_dropped_total` จะเพิ่มขึ้นหนึ่งทุกครั้ง

    เฝ้าดูตัวนับนี้เป็นสัญญาณชัดเจนว่าแอตทริบิวต์ต้นทางกำลังรั่วค่าที่มีคาร์ดินาลิตีสูง ตัวส่งออกจะไม่ยกเพดานให้โดยอัตโนมัติ หากค่านี้เพิ่มขึ้น ให้แก้ที่ต้นทางแทนการปิดเพดาน

  </Accordion>
  <Accordion title="สิ่งที่ไม่เคยปรากฏในเอาต์พุต Prometheus">
    - ข้อความพรอมป์ ข้อความคำตอบ อินพุตของเครื่องมือ เอาต์พุตของเครื่องมือ พรอมป์ระบบ
    - บันทึกข้อความ Talk เพย์โหลดเสียง ID การโทร ID ห้อง โทเคนส่งต่อ ID เทิร์น และ ID เซสชันดิบ
    - ID คำขอผู้ให้บริการแบบดิบ (มีเฉพาะแฮชที่มีขอบเขตจำกัดเมื่อใช้ได้ บนสแปนเท่านั้น — ไม่อยู่บนเมตริก)
    - คีย์เซสชันและ ID เซสชัน
    - ชื่อโฮสต์ พาธไฟล์ ค่าความลับ

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
ควรใช้ `gen_ai_client_token_usage` สำหรับแดชบอร์ดข้ามผู้ให้บริการ: ค่านี้ทำตามแบบแผนเชิงความหมาย OpenTelemetry GenAI และสอดคล้องกับเมตริกจากบริการ GenAI ที่ไม่ใช่ OpenClaw
</Tip>

## การเลือกระหว่างการส่งออก Prometheus และ OpenTelemetry

OpenClaw รองรับทั้งสองพื้นผิวอย่างเป็นอิสระ คุณจะรันอย่างใดอย่างหนึ่ง ทั้งสองอย่าง หรือไม่รันเลยก็ได้

<Tabs>
  <Tab title="diagnostics-prometheus">
    - โมเดลแบบ **Pull**: Prometheus สเครป `/api/diagnostics/prometheus`
    - ไม่ต้องมีคอลเลกเตอร์ภายนอก
    - ยืนยันตัวตนผ่านการยืนยันตัวตน Gateway ปกติ
    - พื้นผิวมีเฉพาะเมตริกเท่านั้น (ไม่มีเทรซหรือบันทึก)
    - เหมาะที่สุดสำหรับสแตกที่ได้มาตรฐานบน Prometheus + Grafana อยู่แล้ว

  </Tab>
  <Tab title="diagnostics-otel">
    - โมเดลแบบ **Push**: OpenClaw ส่ง OTLP/HTTP ไปยังคอลเลกเตอร์หรือแบ็กเอนด์ที่เข้ากันได้กับ OTLP
    - พื้นผิวมีเมตริก เทรซ และบันทึก
    - เชื่อมต่อไปยัง Prometheus ผ่าน OpenTelemetry Collector (ตัวส่งออก `prometheus` หรือ `prometheusremotewrite`) เมื่อคุณต้องใช้ทั้งสองอย่าง
    - ดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry) สำหรับแคตตาล็อกทั้งหมด

  </Tab>
</Tabs>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="เนื้อหาคำตอบว่างเปล่า">
    - ตรวจสอบ `diagnostics.enabled: true` ในการกำหนดค่า
    - ยืนยันว่า Plugin เปิดใช้และโหลดแล้วด้วย `openclaw plugins list --enabled`
    - สร้างทราฟฟิกบางส่วน ตัวนับและฮิสโตแกรมจะปล่อยบรรทัดหลังจากมีเหตุการณ์อย่างน้อยหนึ่งเหตุการณ์เท่านั้น

  </Accordion>
  <Accordion title="401 / ไม่ได้รับอนุญาต">
    เอ็นด์พอยต์นี้ต้องใช้ขอบเขตผู้ปฏิบัติการ Gateway (`auth: "gateway"` พร้อม `gatewayRuntimeScopeSurface: "trusted-operator"`) ใช้โทเคนหรือรหัสผ่านเดียวกับที่ Prometheus ใช้สำหรับเส้นทางผู้ปฏิบัติการ Gateway อื่น ๆ ไม่มีโหมดสาธารณะที่ไม่ต้องยืนยันตัวตน
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` กำลังเพิ่มขึ้น">
    แอตทริบิวต์ใหม่กำลังเกินเพดาน **2048** ซีรีส์ ตรวจสอบเมตริกล่าสุดเพื่อหาป้ายกำกับที่มีคาร์ดินาลิตีสูงผิดคาด และแก้ที่ต้นทาง ตัวส่งออกตั้งใจทิ้งซีรีส์ใหม่แทนการเขียนป้ายกำกับใหม่แบบเงียบ ๆ
  </Accordion>
  <Accordion title="Prometheus แสดงซีรีส์เก่าหลังรีสตาร์ท">
    Plugin เก็บสถานะไว้ในหน่วยความจำเท่านั้น หลังรีสตาร์ท Gateway ตัวนับจะรีเซ็ตเป็นศูนย์ และเกจจะเริ่มใหม่ที่ค่าถัดไปที่ถูกรายงาน ใช้ PromQL `rate()` และ `increase()` เพื่อจัดการการรีเซ็ตอย่างสะอาด
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [การส่งออกการวินิจฉัย](/th/gateway/diagnostics) — ไฟล์ zip การวินิจฉัยในเครื่องสำหรับบันเดิลสนับสนุน
- [สถานภาพและความพร้อมใช้งาน](/th/gateway/health) — โพรบ `/healthz` และ `/readyz`
- [การบันทึกล็อก](/th/logging) — การบันทึกล็อกแบบใช้ไฟล์
- [การส่งออก OpenTelemetry](/th/gateway/opentelemetry) — การส่ง OTLP แบบพุชสำหรับร่องรอย เมตริก และล็อก
