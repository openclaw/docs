---
read_when:
    - คุณต้องการให้ Prometheus, Grafana, VictoriaMetrics หรือตัวดึงข้อมูลอื่นรวบรวมเมตริกของ OpenClaw Gateway
    - คุณต้องใช้ชื่อตัวชี้วัด Prometheus และนโยบายป้ายกำกับสำหรับแดชบอร์ดหรือการแจ้งเตือน
    - คุณต้องการเมตริกโดยไม่ต้องรัน OpenTelemetry collector
sidebarTitle: Prometheus
summary: เผยแพร่การวินิจฉัยของ OpenClaw เป็นเมตริกแบบข้อความของ Prometheus ผ่าน Plugin diagnostics-prometheus
title: เมตริก Prometheus
x-i18n:
    generated_at: "2026-06-27T17:37:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9d3f6cf5af2e3770cd3a86e968fe25d2c3b3b87524ba1d229ef585671d320a8
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw สามารถเปิดเผยเมตริกการวินิจฉัยผ่าน Plugin ทางการ `diagnostics-prometheus` ได้ โดยจะรับฟังการวินิจฉัยที่เชื่อถือได้รวมถึงเหตุการณ์ความเสถียรของ Gateway ที่ core ส่งออกมา จากนั้นเรนเดอร์ endpoint ข้อความ Prometheus ที่:

  ```text
  GET /api/diagnostics/prometheus
  ```

  ชนิดเนื้อหาคือ `text/plain; version=0.0.4; charset=utf-8` ซึ่งเป็นรูปแบบ exposition มาตรฐานของ Prometheus

  <Warning>
  เส้นทางนี้ใช้การยืนยันตัวตนของ Gateway (ขอบเขต operator) อย่าเปิดเผยเป็น endpoint `/metrics` สาธารณะที่ไม่ต้องยืนยันตัวตน ให้ scrape ผ่านเส้นทาง auth เดียวกับที่คุณใช้สำหรับ API ของ operator อื่น ๆ
  </Warning>

  สำหรับ traces, logs, OTLP push และแอตทริบิวต์เชิงความหมาย OpenTelemetry GenAI โปรดดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)

  ## เริ่มต้นอย่างรวดเร็ว

  <Steps>
  <Step title="ติดตั้ง Plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
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
ต้องมี `diagnostics.enabled: true` หากไม่มีค่านี้ plugin จะยังลงทะเบียนเส้นทาง HTTP แต่จะไม่มีเหตุการณ์วินิจฉัยไหลเข้าสู่ exporter ดังนั้นการตอบกลับจะว่างเปล่า
</Note>

## เมตริกที่ส่งออก

| เมตริก                                           | ประเภท      | ป้ายกำกับ                                                                                    |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | counter   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | counter   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | counter   | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | counter   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | histogram | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | counter   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | counter   | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | counter   | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | histogram | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | counter   | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | counter   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | counter   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | counter   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | histogram | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | counter   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | counter   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | counter   | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | histogram | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | counter   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | histogram | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | counter   | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | counter   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | counter   | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                   | counter   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | gauge     | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | counter   | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | counter   | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | histogram | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | counter   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | histogram | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | counter   | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | gauge     | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | histogram | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | histogram | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | counter   | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | histogram | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | histogram | none                                                                                      |
| `openclaw_memory_pressure_total`                 | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | counter   | none                                                                                      |

## นโยบายป้ายกำกับ

<AccordionGroup>
  <Accordion title="ป้ายกำกับที่มีขอบเขตและมีคาร์ดินาลิตีต่ำ">
    ป้ายกำกับ Prometheus ยังคงมีขอบเขตและมีคาร์ดินาลิตีต่ำ exporter จะไม่ส่งตัวระบุการวินิจฉัยดิบ เช่น `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ID ข้อความ, ID แชต หรือ ID คำขอของผู้ให้บริการ

    ค่าป้ายกำกับจะถูกปกปิดและต้องตรงกับนโยบายอักขระคาร์ดินาลิตีต่ำของ OpenClaw ค่าที่ไม่ผ่านนโยบายจะถูกแทนที่ด้วย `unknown`, `other` หรือ `none` ตามเมตริก ป้ายกำกับที่ดูเหมือนคีย์เซสชันเอเจนต์แบบมีขอบเขตจะถูกแทนที่ด้วย `unknown` เช่นกัน

  </Accordion>
  <Accordion title="ขีดจำกัดซีรีส์และการนับส่วนเกิน">
    exporter จำกัด time series ที่เก็บไว้ในหน่วยความจำไว้ที่ **2048** ซีรีส์ รวมทั้ง counter, gauge และ histogram ซีรีส์ใหม่ที่เกินขีดจำกัดนั้นจะถูกทิ้ง และ `openclaw_prometheus_series_dropped_total` จะเพิ่มขึ้นหนึ่งทุกครั้ง

    เฝ้าดู counter นี้เป็นสัญญาณชัดเจนว่าแอตทริบิวต์ upstream กำลังรั่วค่าที่มีคาร์ดินาลิตีสูง exporter จะไม่ยกเลิกขีดจำกัดโดยอัตโนมัติ หากค่านี้เพิ่มขึ้น ให้แก้ที่ต้นทางแทนการปิดใช้ขีดจำกัด

  </Accordion>
  <Accordion title="What never appears in Prometheus output">
    - ข้อความพรอมป์, ข้อความคำตอบ, อินพุตของเครื่องมือ, เอาต์พุตของเครื่องมือ, พรอมป์ระบบ
    - ทรานสคริปต์การสนทนา, เพย์โหลดเสียง, ID การโทร, ID ห้อง, โทเค็นการส่งต่อ, ID รอบการสนทนา และ ID เซสชันดิบ
    - ID คำขอของผู้ให้บริการแบบดิบ (มีเฉพาะแฮชที่มีขอบเขต เมื่อใช้ได้ บน span เท่านั้น — ไม่อยู่ในเมตริกเด็ดขาด)
    - คีย์เซสชันและ ID เซสชัน
    - ชื่อโฮสต์, พาธไฟล์, ค่าลับ

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

# Skill usage, split by bounded source
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
ควรใช้ `gen_ai_client_token_usage` สำหรับแดชบอร์ดข้ามผู้ให้บริการ: เมตริกนี้ทำตามข้อตกลงเชิงความหมาย OpenTelemetry GenAI และสอดคล้องกับเมตริกจากบริการ GenAI ที่ไม่ใช่ OpenClaw
</Tip>

## การเลือกระหว่างการส่งออก Prometheus และ OpenTelemetry

OpenClaw รองรับพื้นผิวทั้งสองแบบแยกกัน คุณสามารถเรียกใช้อย่างใดอย่างหนึ่ง ทั้งสองอย่าง หรือไม่ใช้อย่างใดเลยก็ได้

<Tabs>
  <Tab title="diagnostics-prometheus">
    - โมเดลแบบ **Pull**: Prometheus scrape `/api/diagnostics/prometheus`
    - ไม่ต้องใช้ collector ภายนอก
    - ยืนยันตัวตนผ่านการยืนยันตัวตน Gateway ตามปกติ
    - พื้นผิวนี้เป็นเมตริกเท่านั้น (ไม่มี trace หรือ log)
    - เหมาะที่สุดสำหรับสแตกที่ได้มาตรฐานบน Prometheus + Grafana อยู่แล้ว

  </Tab>
  <Tab title="diagnostics-otel">
    - โมเดลแบบ **Push**: OpenClaw ส่ง OTLP/HTTP ไปยัง collector หรือ backend ที่เข้ากันได้กับ OTLP
    - พื้นผิวนี้มีเมตริก, trace และ log
    - เชื่อมต่อไปยัง Prometheus ผ่าน OpenTelemetry Collector (exporter `prometheus` หรือ `prometheusremotewrite`) เมื่อคุณต้องการทั้งสองอย่าง
    - ดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry) สำหรับแคตตาล็อกฉบับเต็ม

  </Tab>
</Tabs>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="Empty response body">
    - ตรวจสอบ `diagnostics.enabled: true` ในคอนฟิก
    - ยืนยันว่า Plugin เปิดใช้งานและโหลดแล้วด้วย `openclaw plugins list --enabled`
    - สร้างทราฟฟิกบางส่วน; counter และ histogram จะปล่อยบรรทัดหลังจากมีเหตุการณ์อย่างน้อยหนึ่งครั้งเท่านั้น

  </Accordion>
  <Accordion title="401 / unauthorized">
    เอนด์พอยต์นี้ต้องใช้ขอบเขตผู้ปฏิบัติการ Gateway (`auth: "gateway"` พร้อม `gatewayRuntimeScopeSurface: "trusted-operator"`) ใช้โทเค็นหรือรหัสผ่านเดียวกับที่ Prometheus ใช้สำหรับเส้นทางผู้ปฏิบัติการ Gateway อื่น ๆ ไม่มีโหมดสาธารณะที่ไม่ต้องยืนยันตัวตน
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` is climbing">
    แอตทริบิวต์ใหม่กำลังเกินขีดจำกัด **2048** series ตรวจสอบเมตริกล่าสุดเพื่อหา label ที่มี cardinality สูงผิดคาดและแก้ไขที่ต้นทาง exporter ตั้งใจทิ้ง series ใหม่แทนที่จะเขียน label ใหม่แบบเงียบ ๆ
  </Accordion>
  <Accordion title="Prometheus shows stale series after a restart">
    Plugin เก็บสถานะไว้ในหน่วยความจำเท่านั้น หลังจากรีสตาร์ต Gateway แล้ว counter จะรีเซ็ตเป็นศูนย์ และ gauge จะเริ่มใหม่ที่ค่าถัดไปที่รายงาน ใช้ PromQL `rate()` และ `increase()` เพื่อจัดการการรีเซ็ตอย่างเรียบร้อย
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [การส่งออกข้อมูลวินิจฉัย](/th/gateway/diagnostics) — zip ข้อมูลวินิจฉัยในเครื่องสำหรับชุดข้อมูลสนับสนุน
- [สุขภาพและความพร้อม](/th/gateway/health) — probe `/healthz` และ `/readyz`
- [การบันทึก log](/th/logging) — การบันทึก log แบบอิงไฟล์
- [การส่งออก OpenTelemetry](/th/gateway/opentelemetry) — การ push ด้วย OTLP สำหรับ trace, เมตริก และ log
