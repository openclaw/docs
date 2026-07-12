---
read_when:
    - Prometheus, Grafana, VictoriaMetrics veya başka bir kazıyıcının OpenClaw Gateway metriklerini toplamasını istiyorsunuz
    - Panolar veya uyarılar için Prometheus metrik adlarına ve etiket politikasına ihtiyacınız var
    - OpenTelemetry toplayıcısı çalıştırmadan metrikler istiyorsunuz
sidebarTitle: Prometheus
summary: OpenClaw tanılamalarını diagnostics-prometheus Plugin'i aracılığıyla Prometheus metin metrikleri olarak sunun
title: Prometheus metrikleri
x-i18n:
    generated_at: "2026-07-12T12:18:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8a3975a9a79f32f1e9731b819613fdf6b9ffeee20bc71c841b9a6d7a5e0052f4
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw, resmi `diagnostics-prometheus` Plugin'i aracılığıyla tanılama metriklerini sunabilir. Bu Plugin, güvenilir tanılamaların yanı sıra dahili olarak etiketlenmiş, dağıtıcıya ait tanılama olaylarını (kuyruk, bellek ve oturum kurtarma sinyalleri) dinler ve şu adreste Prometheus metin uç noktası oluşturur:

  ```text
  GET /api/diagnostics/prometheus
  ```

  İçerik türü, standart Prometheus sunum biçimi olan `text/plain; version=0.0.4; charset=utf-8` değeridir.

  <Warning>
  Rota, Gateway kimlik doğrulamasını kullanır (operatör kapsamı, güvenilir operatör yüzeyi). Bunu kimlik doğrulaması olmayan, herkese açık bir `/metrics` uç noktası olarak sunmayın. Diğer operatör API'leri için kullandığınız kimlik doğrulama yolu üzerinden metrikleri toplayın.
  </Warning>

  İzler, günlükler, OTLP gönderimi ve OpenTelemetry GenAI anlamsal öznitelikleri için [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) bölümüne bakın.

  ## Hızlı başlangıç

  <Steps>
  <Step title="Plugin'i yükleyin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Plugin'i etkinleştirin">
    <Tabs>
      <Tab title="Yapılandırma">
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
  <Step title="Gateway'i yeniden başlatın">
    HTTP rotası Plugin başlatılırken kaydedilir; bu nedenle etkinleştirdikten sonra yeniden yükleyin.
  </Step>
  <Step title="Korumalı rotadan metrikleri toplayın">
    Operatör istemcilerinizin kullandığı Gateway kimlik doğrulamasını gönderin:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Prometheus'u bağlayın">
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
`diagnostics.enabled` varsayılan olarak `true` değerindedir; yalnızca sıkı biçimde kısıtlanmış ortamlarda `false` olarak ayarlayın. `false` ise Plugin yine de HTTP rotasını kaydeder, ancak dışa aktarıcıya hiçbir tanılama olayı aktarılmaz; dolayısıyla yanıt boş olur.
</Note>

## Dışa aktarılan metrikler

| Metrik                                           | Tür       | Etiketler                                                                                 |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | sayaç     | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | sayaç     | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | sayaç     | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | sayaç     | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | histogram | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | sayaç     | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_model_usage_duration_seconds`          | histogram | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | sayaç     | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | sayaç     | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | histogram | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | sayaç     | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | sayaç     | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | sayaç     | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | sayaç     | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | histogram | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | sayaç     | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | sayaç     | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | sayaç     | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | histogram | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | sayaç     | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | histogram | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | sayaç     | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | sayaç     | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | sayaç     | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | gösterge  | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                   | sayaç     | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | gösterge  | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | sayaç     | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | sayaç     | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | histogram | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | sayaç     | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | histogram | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | sayaç     | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | gösterge  | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | histogram | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | histogram | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | sayaç     | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | histogram | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | gösterge  | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | histogram | yok                                                                                       |
| `openclaw_memory_pressure_total`                 | sayaç     | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | sayaç     | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | sayaç     | yok                                                                                       |
| `openclaw_diagnostic_async_queue_dropped_total`  | sayaç     | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | gösterge  | yok                                                                                       |

## Etiket politikası

<AccordionGroup>
  <Accordion title="Sınırlı, düşük kardinaliteli etiketler">
    Prometheus etiketleri sınırlı ve düşük kardinaliteli tutulur. Dışa aktarıcı; `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ileti kimlikleri, sohbet kimlikleri veya sağlayıcı istek kimlikleri gibi ham tanılama tanımlayıcılarını yayımlamaz.

    Etiket değerlerindeki hassas bilgiler gizlenir ve değerler OpenClaw'ın düşük kardinaliteli karakter politikasına uymalıdır. Politikaya uymayan değerler, metriğe bağlı olarak `unknown`, `other` veya `none` ile değiştirilir. Kapsamlı aracı oturum anahtarlarına benzeyen etiketler de `unknown` ile değiştirilir.

  </Accordion>
  <Accordion title="Seri sınırı ve taşma muhasebesi">
    Dışa aktarıcı; sayaçlar, göstergeler ve histogramlar genelinde bellekte tutulan zaman serilerini toplam **2048** seriyle sınırlar. Bu sınırı aşan yeni seriler bırakılır ve her seferinde `openclaw_prometheus_series_dropped_total` bir artırılır.

    Bu sayacı, yukarı akıştaki bir özniteliğin yüksek kardinaliteli değerler sızdırdığına ilişkin kesin bir sinyal olarak izleyin. Dışa aktarıcı sınırı hiçbir zaman otomatik olarak yükseltmez; sayaç artarsa sınırı devre dışı bırakmak yerine kaynağı düzeltin.

  </Accordion>
  <Accordion title="Prometheus çıktısında hiçbir zaman görünmeyenler">
    - istem metni, yanıt metni, araç girdileri, araç çıktıları, sistem istemleri
    - Konuşma dökümleri, ses yükleri, çağrı kimlikleri, oda kimlikleri, devir belirteçleri, tur kimlikleri ve ham oturum kimlikleri
    - ham sağlayıcı istek kimlikleri (yalnızca uygun durumlarda span'lerde sınırlı karmalar bulunur; metriklerde hiçbir zaman bulunmaz)
    - oturum anahtarları ve oturum kimlikleri
    - ana makine adları, dosya yolları, gizli değerler

  </Accordion>
</AccordionGroup>

## PromQL tarifleri

```promql
# Sağlayıcıya göre ayrılmış, dakika başına token sayısı
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Modele göre son bir saatteki harcama (USD)
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# Model çalıştırma süresinin 95. yüzdelik dilimi
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# Kuyruk bekleme süresi SLO'su (95. yüzdelik dilim 2 sn'nin altında)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Sınırlı kaynağa göre ayrılmış Skill kullanımı
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# Bırakılan Prometheus serileri (kardinalite alarmı)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Sağlayıcılar arası panolar için `gen_ai_client_token_usage` kullanmayı tercih edin: OpenTelemetry GenAI anlamsal kurallarını izler ve OpenClaw dışındaki GenAI hizmetlerinden gelen metriklerle tutarlıdır.
</Tip>

## Prometheus ile OpenTelemetry dışa aktarımı arasında seçim yapma

OpenClaw her iki yüzeyi de birbirinden bağımsız olarak destekler. İkisinden birini, her ikisini veya hiçbirini çalıştırabilirsiniz.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **Çekme** modeli: Prometheus, `/api/diagnostics/prometheus` uç noktasını tarar.
    - Harici toplayıcı gerekmez.
    - Normal Gateway kimlik doğrulaması üzerinden kimliği doğrulanır.
    - Yüzey yalnızca metrikleri kapsar (iz veya günlük içermez).
    - Prometheus + Grafana üzerinde zaten standartlaştırılmış yığınlar için en uygunudur.

  </Tab>
  <Tab title="diagnostics-otel">
    - **Gönderme** modeli: OpenClaw, bir toplayıcıya veya OTLP uyumlu arka uca OTLP/HTTP gönderir.
    - Yüzey metrikleri, izleri ve günlükleri kapsar.
    - Her ikisine de ihtiyaç duyduğunuzda bir OpenTelemetry Collector (`prometheus` veya `prometheusremotewrite` dışa aktarıcısı) aracılığıyla Prometheus'a köprü kurar.
    - Kataloğun tamamı için [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) sayfasına bakın.

  </Tab>
</Tabs>

## Sorun giderme

<AccordionGroup>
  <Accordion title="Boş yanıt gövdesi">
    - Yapılandırmada `diagnostics.enabled` değerinin `false` olarak ayarlanmadığını kontrol edin (varsayılan değeri `true`'dur).
    - Plugin'in etkinleştirildiğini ve `openclaw plugins list --enabled` ile yüklendiğini doğrulayın.
    - Bir miktar trafik oluşturun; sayaçlar ve histogramlar yalnızca en az bir olaydan sonra satır üretir.

  </Accordion>
  <Accordion title="401 / yetkisiz">
    Uç nokta, Gateway operatör kapsamını (`auth: "gateway"` ile `gatewayRuntimeScopeSurface: "trusted-operator"`) gerektirir. Prometheus'un diğer Gateway operatör rotalarında kullandığı belirteç veya parolanın aynısını kullanın. Kimlik doğrulaması gerektirmeyen herkese açık bir mod yoktur.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` artıyor">
    Yeni bir öznitelik **2048** serilik sınırı aşıyor. Son metriklerde beklenmedik derecede yüksek kardinaliteli bir etiketi inceleyin ve kaynağında düzeltin. Dışa aktarıcı, etiketleri sessizce yeniden yazmak yerine yeni serileri kasıtlı olarak bırakır.
  </Accordion>
  <Accordion title="Prometheus yeniden başlatmadan sonra eski serileri gösteriyor">
    Plugin durumu yalnızca bellekte tutar. Gateway yeniden başlatıldıktan sonra sayaçlar sıfırlanır ve göstergeler bildirilen bir sonraki değerlerinden yeniden başlar. Sıfırlamaları sorunsuz biçimde işlemek için PromQL `rate()` ve `increase()` işlevlerini kullanın.
  </Accordion>
</AccordionGroup>

## İlgili içerikler

- [Tanılama dışa aktarımı](/tr/gateway/diagnostics) — destek paketleri için yerel tanılama zip dosyası
- [Sağlık ve hazır olma durumu](/tr/gateway/health) — `/healthz` ve `/readyz` yoklamaları
- [Günlük kaydı](/tr/logging) — dosya tabanlı günlük kaydı
- [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) — izler, metrikler ve günlükler için OTLP gönderimi
