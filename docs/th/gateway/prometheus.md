---
read_when:
    - คุณต้องการให้ Prometheus, Grafana, VictoriaMetrics หรือเครื่องมือเก็บข้อมูลอื่นรวบรวมเมตริกของ OpenClaw Gateway
    - คุณต้องใช้ชื่อตัวชี้วัด Prometheus และนโยบายป้ายกำกับสำหรับแดชบอร์ดหรือการแจ้งเตือน
    - คุณต้องการเมตริกโดยไม่ต้องเรียกใช้ตัวรวบรวม OpenTelemetry
sidebarTitle: Prometheus
summary: เปิดเผยข้อมูลการวินิจฉัยของ OpenClaw เป็นเมตริกข้อความ Prometheus ผ่าน Plugin diagnostics-prometheus
title: เมตริก Prometheus
x-i18n:
    generated_at: "2026-07-12T16:11:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8a3975a9a79f32f1e9731b819613fdf6b9ffeee20bc71c841b9a6d7a5e0052f4
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw สามารถเปิดเผยเมตริกการวินิจฉัยผ่าน Plugin อย่างเป็นทางการ
  `diagnostics-prometheus` โดย Plugin นี้รับฟังข้อมูลการวินิจฉัยที่เชื่อถือได้ รวมถึง
  เหตุการณ์การวินิจฉัยที่ติดแท็กภายในและอยู่ภายใต้การควบคุมของตัวจัดส่ง (สัญญาณคิว หน่วยความจำ และ
  การกู้คืนเซสชัน) แล้วแสดงผลเป็นปลายทางข้อความ Prometheus ที่:

  ```text
  GET /api/diagnostics/prometheus
  ```

  ชนิดเนื้อหาคือ `text/plain; version=0.0.4; charset=utf-8` ซึ่งเป็นรูปแบบมาตรฐาน
  สำหรับการเปิดเผยข้อมูลของ Prometheus

  <Warning>
  เส้นทางนี้ใช้การยืนยันตัวตนของ Gateway (ขอบเขตผู้ปฏิบัติงาน ซึ่งเป็นพื้นผิวสำหรับผู้ปฏิบัติงานที่เชื่อถือได้) อย่าเปิดเผยเป็นปลายทาง `/metrics` สาธารณะที่ไม่ต้องยืนยันตัวตน ให้ดึงข้อมูลผ่านเส้นทางการยืนยันตัวตนเดียวกับที่คุณใช้สำหรับ API อื่นของผู้ปฏิบัติงาน
  </Warning>

  สำหรับเทรซ บันทึก การพุช OTLP และแอตทริบิวต์เชิงความหมาย GenAI ของ OpenTelemetry โปรดดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)

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
  <Step title="รีสตาร์ต Gateway">
    เส้นทาง HTTP จะได้รับการลงทะเบียนเมื่อ Plugin เริ่มทำงาน ดังนั้นให้โหลดใหม่หลังจากเปิดใช้งาน
  </Step>
  <Step title="ดึงข้อมูลจากเส้นทางที่ได้รับการป้องกัน">
    ส่งข้อมูลยืนยันตัวตนของ Gateway แบบเดียวกับที่ไคลเอนต์ผู้ปฏิบัติงานของคุณใช้:

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
ค่าเริ่มต้นของ `diagnostics.enabled` คือ `true`; ให้ตั้งเป็น `false` เฉพาะในสภาพแวดล้อมที่มีข้อจำกัดอย่างเข้มงวดเท่านั้น หากเป็น `false` Plugin จะยังคงลงทะเบียนเส้นทาง HTTP แต่จะไม่มีเหตุการณ์การวินิจฉัยไหลเข้าสู่ตัวส่งออก ดังนั้นการตอบกลับจึงว่างเปล่า
</Note>

## เมตริกที่ส่งออก

| เมตริก                                           | ชนิด      | ป้ายกำกับ                                                                                    |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | ตัวนับ   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | ฮิสโตแกรม | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | ตัวนับ   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | ฮิสโตแกรม | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | ตัวนับ   | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | ตัวนับ   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | ฮิสโตแกรม | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | ตัวนับ   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_model_usage_duration_seconds`          | ฮิสโตแกรม | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | ตัวนับ   | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | ตัวนับ   | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | ฮิสโตแกรม | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | ตัวนับ   | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | ตัวนับ   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | ฮิสโตแกรม | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | ตัวนับ   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | ตัวนับ   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | ฮิสโตแกรม | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | ตัวนับ   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | ตัวนับ   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | ตัวนับ   | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | ฮิสโตแกรม | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | ตัวนับ   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | ฮิสโตแกรม | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | ตัวนับ   | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | ตัวนับ   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | ฮิสโตแกรม | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | ตัวนับ   | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | ฮิสโตแกรม | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | ฮิสโตแกรม | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | เกจ     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | ฮิสโตแกรม | `lane`                                                                                    |
| `openclaw_session_state_total`                   | ตัวนับ   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | เกจ     | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | ตัวนับ   | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | ตัวนับ   | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | ฮิสโตแกรม | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | ตัวนับ   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | ฮิสโตแกรม | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | ตัวนับ   | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | เกจ     | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | ฮิสโตแกรม | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | ฮิสโตแกรม | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | ฮิสโตแกรม | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | ฮิสโตแกรม | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | ตัวนับ   | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | ฮิสโตแกรม | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | เกจ     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | ฮิสโตแกรม | ไม่มี                                                                                      |
| `openclaw_memory_pressure_total`                 | ตัวนับ   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | ตัวนับ   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | ตัวนับ   | ไม่มี                                                                                      |
| `openclaw_diagnostic_async_queue_dropped_total`  | ตัวนับ   | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | เกจ     | ไม่มี                                                                                      |

## นโยบายป้ายกำกับ

<AccordionGroup>
  <Accordion title="ป้ายกำกับที่มีขอบเขตจำกัดและมีคาร์ดินาลิตีต่ำ">
    ป้ายกำกับ Prometheus มีขอบเขตจำกัดและมีคาร์ดินาลิตีต่ำ ตัวส่งออกจะไม่ส่งตัวระบุการวินิจฉัยดิบ เช่น `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, รหัสข้อความ, รหัสแชต หรือรหัสคำขอของผู้ให้บริการ

    ค่าป้ายกำกับจะถูกปกปิดและต้องสอดคล้องกับนโยบายอักขระคาร์ดินาลิตีต่ำของ OpenClaw ค่าที่ไม่ผ่านนโยบายจะถูกแทนที่ด้วย `unknown`, `other` หรือ `none` ตามแต่เมตริก ป้ายกำกับที่มีลักษณะเหมือนคีย์เซสชันของเอเจนต์แบบมีขอบเขตจะถูกแทนที่ด้วย `unknown` เช่นกัน

  </Accordion>
  <Accordion title="ขีดจำกัดของซีรีส์และการนับส่วนเกิน">
    ตัวส่งออกจำกัดอนุกรมเวลาที่เก็บไว้ในหน่วยความจำไว้ที่ **2048** ซีรีส์ โดยนับรวมตัวนับ เกจ และฮิสโทแกรม ซีรีส์ใหม่ที่เกินขีดจำกัดนี้จะถูกละทิ้ง และ `openclaw_prometheus_series_dropped_total` จะเพิ่มขึ้นหนึ่งทุกครั้ง

    เฝ้าดูตัวนับนี้ในฐานะสัญญาณชัดเจนว่าแอตทริบิวต์ต้นทางกำลังปล่อยค่าที่มีคาร์ดินัลลิตีสูงรั่วไหล ตัวส่งออกจะไม่เพิ่มขีดจำกัดโดยอัตโนมัติ หากตัวนับเพิ่มขึ้น ให้แก้ไขที่ต้นทางแทนการปิดใช้ขีดจำกัด

  </Accordion>
  <Accordion title="สิ่งที่ไม่ปรากฏในผลลัพธ์ Prometheus">
    - ข้อความพรอมต์ ข้อความตอบกลับ อินพุตของเครื่องมือ เอาต์พุตของเครื่องมือ พรอมต์ระบบ
    - บันทึกการสนทนา เพย์โหลดเสียง รหัสการโทร รหัสห้อง โทเค็นส่งต่อ รหัสเทิร์น และรหัสเซสชันแบบดิบ
    - รหัสคำขอแบบดิบจากผู้ให้บริการ (ใช้เฉพาะแฮชที่มีขอบเขตจำกัดในสแปนเมื่อเกี่ยวข้องเท่านั้น และไม่ใช้ในเมตริก)
    - คีย์เซสชันและรหัสเซสชัน
    - ชื่อโฮสต์ พาธไฟล์ ค่าความลับ

  </Accordion>
</AccordionGroup>

## สูตร PromQL

```promql
# โทเค็นต่อนาที แยกตามผู้ให้บริการ
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# ค่าใช้จ่าย (USD) ในชั่วโมงที่ผ่านมา แยกตามโมเดล
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# ระยะเวลาการรันโมเดลที่เปอร์เซ็นไทล์ 95
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# SLO เวลารอคิว (เปอร์เซ็นไทล์ 95 ต่ำกว่า 2 วินาที)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# การใช้งานสกิล แยกตามแหล่งที่มีขอบเขตจำกัด
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# ซีรีส์ Prometheus ที่ถูกละทิ้ง (สัญญาณเตือนคาร์ดินัลลิตี)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
สำหรับแดชบอร์ดข้ามผู้ให้บริการ ควรใช้ `gen_ai_client_token_usage` เนื่องจากเป็นไปตามแบบแผนเชิงความหมาย GenAI ของ OpenTelemetry และสอดคล้องกับเมตริกจากบริการ GenAI ที่ไม่ใช่ OpenClaw
</Tip>

## การเลือกระหว่างการส่งออกด้วย Prometheus และ OpenTelemetry

OpenClaw รองรับทั้งสองช่องทางอย่างเป็นอิสระจากกัน คุณสามารถใช้ช่องทางใดช่องทางหนึ่ง ใช้ทั้งสองช่องทาง หรือไม่ใช้เลยก็ได้

<Tabs>
  <Tab title="diagnostics-prometheus">
    - โมเดล **ดึงข้อมูล**: Prometheus ดึงข้อมูลจาก `/api/diagnostics/prometheus`
    - ไม่ต้องใช้ตัวรวบรวมภายนอก
    - ยืนยันตัวตนผ่านการยืนยันตัวตนตามปกติของ Gateway
    - ช่องทางนี้มีเฉพาะเมตริกเท่านั้น (ไม่มีเทรซหรือบันทึก)
    - เหมาะที่สุดสำหรับสแต็กที่กำหนดมาตรฐานไว้แล้วให้ใช้ Prometheus + Grafana

  </Tab>
  <Tab title="diagnostics-otel">
    - โมเดล **ส่งข้อมูล**: OpenClaw ส่ง OTLP/HTTP ไปยังตัวรวบรวมหรือแบ็กเอนด์ที่เข้ากันได้กับ OTLP
    - ช่องทางนี้ประกอบด้วยเมตริก เทรซ และบันทึก
    - เชื่อมต่อกับ Prometheus ผ่าน OpenTelemetry Collector (ตัวส่งออก `prometheus` หรือ `prometheusremotewrite`) เมื่อคุณต้องการใช้ทั้งสองอย่าง
    - ดูรายการทั้งหมดได้ที่ [การส่งออกด้วย OpenTelemetry](/th/gateway/opentelemetry)

  </Tab>
</Tabs>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="เนื้อหาการตอบกลับว่างเปล่า">
    - ตรวจสอบว่าไม่ได้ตั้งค่า `diagnostics.enabled` เป็น `false` ในการกำหนดค่า (ค่าเริ่มต้นคือ `true`)
    - ยืนยันว่า Plugin เปิดใช้งานและโหลดแล้วด้วย `openclaw plugins list --enabled`
    - สร้างทราฟฟิกบางส่วน ตัวนับและฮิสโทแกรมจะแสดงบรรทัดหลังจากเกิดเหตุการณ์อย่างน้อยหนึ่งครั้งเท่านั้น

  </Accordion>
  <Accordion title="401 / ไม่ได้รับอนุญาต">
    ปลายทางนี้ต้องใช้ขอบเขตผู้ดำเนินการ Gateway (`auth: "gateway"` พร้อม `gatewayRuntimeScopeSurface: "trusted-operator"`) ใช้โทเค็นหรือรหัสผ่านเดียวกับที่ Prometheus ใช้สำหรับเส้นทางผู้ดำเนินการ Gateway อื่น ไม่มีโหมดสาธารณะที่ไม่ต้องยืนยันตัวตน
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` กำลังเพิ่มขึ้น">
    แอตทริบิวต์ใหม่กำลังทำให้เกินขีดจำกัด **2048** ซีรีส์ ตรวจสอบเมตริกล่าสุดเพื่อหาป้ายกำกับที่มีคาร์ดินัลลิตีสูงผิดปกติและแก้ไขที่ต้นทาง ตัวส่งออกจงใจละทิ้งซีรีส์ใหม่แทนการเขียนป้ายกำกับใหม่โดยไม่แจ้งให้ทราบ
  </Accordion>
  <Accordion title="Prometheus แสดงซีรีส์เก่าหลังเริ่มระบบใหม่">
    Plugin เก็บสถานะไว้ในหน่วยความจำเท่านั้น หลังจากเริ่ม Gateway ใหม่ ตัวนับจะรีเซ็ตเป็นศูนย์ และเกจจะเริ่มจากค่าที่รายงานครั้งถัดไป ใช้ `rate()` และ `increase()` ของ PromQL เพื่อจัดการการรีเซ็ตอย่างถูกต้อง
  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

- [การส่งออกข้อมูลวินิจฉัย](/th/gateway/diagnostics) — ไฟล์ ZIP ข้อมูลวินิจฉัยภายในเครื่องสำหรับชุดข้อมูลสนับสนุน
- [สถานะการทำงานและความพร้อม](/th/gateway/health) — โพรบ `/healthz` และ `/readyz`
- [การบันทึก](/th/logging) — การบันทึกลงไฟล์
- [การส่งออกด้วย OpenTelemetry](/th/gateway/opentelemetry) — การส่งแบบพุชผ่าน OTLP สำหรับเทรซ เมตริก และบันทึก
