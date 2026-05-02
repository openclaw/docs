---
read_when:
    - Prometheus, Grafana, VictoriaMetrics veya başka bir toplayıcının OpenClaw Gateway metriklerini toplamasını istiyorsunuz
    - Panolar veya uyarılar için Prometheus metrik adlarına ve etiket politikasına ihtiyacınız var
    - OpenTelemetry toplayıcısı çalıştırmadan metrikler istiyorsunuz
sidebarTitle: Prometheus
summary: OpenClaw tanılamalarını diagnostics-prometheus Plugin aracılığıyla Prometheus metin metrikleri olarak kullanıma açın
title: Prometheus metrikleri
x-i18n:
    generated_at: "2026-05-02T20:45:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49df17348c5b63c4b5f3c05f3378d43764e5de985135ad30c1e74ef607e0dd37
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw, resmi `diagnostics-prometheus` Plugin'i aracılığıyla tanılama metriklerini sunabilir. Güvenilen dahili tanılamaları dinler ve şu adreste bir Prometheus metin endpoint'i oluşturur:

```text
GET /api/diagnostics/prometheus
```

İçerik türü, standart Prometheus sunum biçimi olan `text/plain; version=0.0.4; charset=utf-8` şeklindedir.

<Warning>
Rota Gateway kimlik doğrulamasını kullanır (operatör kapsamı). Bunu herkese açık, kimlik doğrulamasız bir `/metrics` endpoint'i olarak sunmayın. Diğer operatör API'leri için kullandığınız aynı kimlik doğrulama yolu üzerinden scrape edin.
</Warning>

Trace'ler, günlükler, OTLP push ve OpenTelemetry GenAI semantik öznitelikleri için bkz. [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry).

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
    HTTP rotası Plugin başlangıcında kaydedilir, bu nedenle etkinleştirdikten sonra yeniden yükleyin.
  </Step>
  <Step title="Korumalı rotayı scrape edin">
    Operatör istemcilerinizin kullandığı aynı Gateway kimlik doğrulamasını gönderin:

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
`diagnostics.enabled: true` gereklidir. Bu olmadan Plugin HTTP rotasını yine kaydeder, ancak dışa aktarıcıya hiçbir tanılama olayı akmaz; bu nedenle yanıt boş olur.
</Note>

## Dışa aktarılan metrikler

| Metrik                                        | Tür       | Etiketler                                                                                 |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | sayaç     | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`               | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                   | sayaç     | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`        | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_tokens_total`                 | sayaç     | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`          | histogram | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`               | sayaç     | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_tool_execution_total`               | sayaç     | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_tool_execution_duration_seconds`    | histogram | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_harness_run_total`                  | sayaç     | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | sayaç     | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds` | histogram | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_total`             | sayaç     | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_queue_lane_size`                    | gösterge  | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                | sayaç     | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | gösterge  | `state`                                                                                   |
| `openclaw_memory_bytes`                       | gösterge  | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | histogram | yok                                                                                       |
| `openclaw_memory_pressure_total`              | sayaç     | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | sayaç     | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | sayaç     | yok                                                                                       |

## Etiket politikası

<AccordionGroup>
  <Accordion title="Sınırlı, düşük kardinaliteli etiketler">
    Prometheus etiketleri sınırlı ve düşük kardinaliteli kalır. Dışa aktarıcı `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, mesaj kimlikleri, sohbet kimlikleri veya sağlayıcı istek kimlikleri gibi ham tanılama tanımlayıcıları yaymaz.

    Etiket değerleri redakte edilir ve OpenClaw'ın düşük kardinaliteli karakter politikasıyla eşleşmelidir. Politikayı geçemeyen değerler, metriğe bağlı olarak `unknown`, `other` veya `none` ile değiştirilir.

  </Accordion>
  <Accordion title="Seri sınırı ve taşma muhasebesi">
    Dışa aktarıcı, sayaçlar, göstergeler ve histogramlar birlikte olmak üzere bellekte tutulan zaman serilerini **2048** seriyle sınırlar. Bu sınırın ötesindeki yeni seriler düşürülür ve `openclaw_prometheus_series_dropped_total` her seferinde bir artar.

    Bu sayacı, yukarı akıştaki bir özniteliğin yüksek kardinaliteli değerler sızdırdığına dair kesin bir sinyal olarak izleyin. Dışa aktarıcı sınırı hiçbir zaman otomatik olarak kaldırmaz; yükselirse sınırı devre dışı bırakmak yerine kaynağı düzeltin.

  </Accordion>
  <Accordion title="Prometheus çıktısında asla görünmeyenler">
    - prompt metni, yanıt metni, araç girdileri, araç çıktıları, sistem prompt'ları
    - ham sağlayıcı istek kimlikleri (yalnızca span'lerde uygulanabildiği yerlerde sınırlı hash'ler; metriklerde asla)
    - oturum anahtarları ve oturum kimlikleri
    - ana makine adları, dosya yolları, gizli değerler

  </Accordion>
</AccordionGroup>

## PromQL tarifleri

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
Çapraz sağlayıcı panoları için `gen_ai_client_token_usage` tercih edin: OpenTelemetry GenAI semantik kurallarını izler ve OpenClaw dışı GenAI hizmetlerinden gelen metriklerle tutarlıdır.
</Tip>

## Prometheus ile OpenTelemetry dışa aktarımı arasında seçim yapma

OpenClaw her iki yüzeyi de bağımsız olarak destekler. Birini, ikisini birden ya da hiçbirini çalıştırabilirsiniz.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **Pull** modeli: Prometheus `/api/diagnostics/prometheus` adresini scrape eder.
    - Harici toplayıcı gerekmez.
    - Normal Gateway kimlik doğrulaması üzerinden kimlik doğrulanır.
    - Yüzey yalnızca metriklerden oluşur (trace veya günlük yoktur).
    - Prometheus + Grafana üzerinde zaten standartlaşmış yığınlar için en iyisidir.

  </Tab>
  <Tab title="diagnostics-otel">
    - **Push** modeli: OpenClaw OTLP/HTTP'yi bir toplayıcıya veya OTLP uyumlu arka uca gönderir.
    - Yüzey metrikleri, trace'leri ve günlükleri içerir.
    - İkisine de ihtiyaç duyduğunuzda bir OpenTelemetry Collector (`prometheus` veya `prometheusremotewrite` dışa aktarıcı) üzerinden Prometheus'a köprü kurar.
    - Tam katalog için bkz. [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry).

  </Tab>
</Tabs>

## Sorun giderme

<AccordionGroup>
  <Accordion title="Boş yanıt gövdesi">
    - Yapılandırmada `diagnostics.enabled: true` olup olmadığını kontrol edin.
    - Plugin'in etkin ve yüklü olduğunu `openclaw plugins list --enabled` ile doğrulayın.
    - Biraz trafik oluşturun; sayaçlar ve histogramlar yalnızca en az bir olaydan sonra satır yayar.

  </Accordion>
  <Accordion title="401 / yetkisiz">
    Endpoint Gateway operatör kapsamını gerektirir (`auth: "gateway"` ile `gatewayRuntimeScopeSurface: "trusted-operator"`). Prometheus'un başka herhangi bir Gateway operatör rotası için kullandığı aynı token'ı veya parolayı kullanın. Herkese açık, kimlik doğrulamasız mod yoktur.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` yükseliyor">
    Yeni bir öznitelik **2048** serilik sınırı aşıyor. Beklenmedik şekilde yüksek kardinaliteli bir etiket için son metrikleri inceleyin ve bunu kaynağında düzeltin. Dışa aktarıcı, etiketleri sessizce yeniden yazmak yerine yeni serileri kasıtlı olarak düşürür.
  </Accordion>
  <Accordion title="Prometheus yeniden başlatmadan sonra eski seriler gösteriyor">
    Plugin durumu yalnızca bellekte tutar. Gateway yeniden başlatıldıktan sonra sayaçlar sıfırlanır ve göstergeler bir sonraki bildirilen değerlerinde yeniden başlar. Sıfırlamaları temiz şekilde işlemek için PromQL `rate()` ve `increase()` kullanın.
  </Accordion>
</AccordionGroup>

## İlgili

- [Tanılama dışa aktarımı](/tr/gateway/diagnostics) — destek paketleri için yerel tanılama zip'i
- [Sağlık ve hazır olma](/tr/gateway/health) — `/healthz` ve `/readyz` probları
- [Günlükleme](/tr/logging) — dosya tabanlı günlükleme
- [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) — trace'ler, metrikler ve günlükler için OTLP push
