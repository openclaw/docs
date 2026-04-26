---
read_when:
    - Prometheus, Grafana, VictoriaMetrics veya başka bir kazıyıcının OpenClaw Gateway metriklerini toplamasını istiyorsunuz
    - Panolar veya uyarılar için Prometheus metrik adlarına ve etiket politikasına ihtiyacınız var
    - Bir OpenTelemetry toplayıcısı çalıştırmadan metrikler istiyorsunuz
sidebarTitle: Prometheus
summary: OpenClaw tanılamalarını diagnostics-prometheus Plugin'i aracılığıyla Prometheus metin metrikleri olarak sunma
title: Prometheus metrikleri
x-i18n:
    generated_at: "2026-04-26T11:30:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29fd3e4658ceffe20f078e8e38b61c685ea9df518ca04ca34abf2085166eb481
    source_path: gateway/prometheus.md
    workflow: 15
---

OpenClaw, birlikte gelen `diagnostics-prometheus` Plugin'i aracılığıyla tanılama metriklerini sunabilir. Güvenilir dahili tanılamaları dinler ve şu adreste bir Prometheus metin uç noktası oluşturur:

```text
GET /api/diagnostics/prometheus
```

İçerik türü `text/plain; version=0.0.4; charset=utf-8` şeklindedir; bu, standart Prometheus dışa aktarma biçimidir.

<Warning>
Yol Gateway kimlik doğrulamasını kullanır (operatör kapsamı). Bunu herkese açık, kimlik doğrulamasız bir `/metrics` uç noktası olarak sunmayın. Kazımayı, diğer operatör API'leri için kullandığınız aynı kimlik doğrulama yolu üzerinden yapın.
</Warning>

İzler, günlükler, OTLP push ve OpenTelemetry GenAI anlamsal öznitelikleri için bkz. [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry).

## Hızlı başlangıç

<Steps>
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
    HTTP yolu Plugin başlangıcında kaydedilir, bu nedenle etkinleştirdikten sonra yeniden yükleyin.
  </Step>
  <Step title="Korumalı yolu kazıyın">
    Operatör istemcilerinizin kullandığı aynı gateway kimlik doğrulamasını gönderin:

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
`diagnostics.enabled: true` gereklidir. Bu olmadan Plugin yine HTTP yolunu kaydeder ancak hiçbir tanılama olayı dışa aktarıcıya akmaz, bu yüzden yanıt boştur.
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
| `openclaw_queue_lane_size`                    | gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                | sayaç     | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | gauge     | `state`                                                                                   |
| `openclaw_memory_bytes`                       | gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | histogram | yok                                                                                       |
| `openclaw_memory_pressure_total`              | sayaç     | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | sayaç     | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | sayaç     | yok                                                                                       |

## Etiket politikası

<AccordionGroup>
  <Accordion title="Sınırlı, düşük kardinaliteli etiketler">
    Prometheus etiketleri sınırlı ve düşük kardinalitelidir. Dışa aktarıcı; `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, mesaj kimlikleri, sohbet kimlikleri veya sağlayıcı istek kimlikleri gibi ham tanılama tanımlayıcılarını yaymaz.

    Etiket değerleri redakte edilir ve OpenClaw'ın düşük kardinaliteli karakter politikasına uymalıdır. Politikayı geçemeyen değerler, metriğe bağlı olarak `unknown`, `other` veya `none` ile değiştirilir.

  </Accordion>
  <Accordion title="Seri sınırı ve taşma muhasebesi">
    Dışa aktarıcı, bellekte tutulan zaman serilerini sayaçlar, gauge'lar ve histogramlar dahil toplam **2048** seri ile sınırlar. Bu sınırın ötesindeki yeni seriler bırakılır ve her seferinde `openclaw_prometheus_series_dropped_total` bir artırılır.

    Yukarı akışta bir özniteliğin yüksek kardinaliteli değer sızdırdığına dair kesin bir sinyal olarak bu sayacı izleyin. Dışa aktarıcı sınırı asla otomatik olarak yükseltmez; artıyorsa sınırı devre dışı bırakmak yerine kaynağı düzeltin.

  </Accordion>
  <Accordion title="Prometheus çıktısında asla görünmeyenler">
    - istem metni, yanıt metni, araç girdileri, araç çıktıları, sistem istemleri
    - ham sağlayıcı istek kimlikleri (yalnızca geçerliyse sınırlı karmalar span'lerde bulunur — metriklerde asla)
    - oturum anahtarları ve oturum kimlikleri
    - host adları, dosya yolları, gizli değerler
  </Accordion>
</AccordionGroup>

## PromQL tarifleri

```promql
# Dakika başına token, sağlayıcıya göre bölünmüş
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Son bir saatte harcama (USD), modele göre
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 95. yüzdelik model çalışma süresi
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# Kuyruk bekleme süresi SLO'su (95p 2s altı)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Bırakılan Prometheus serileri (kardinalite alarmı)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Sağlayıcılar arası panolar için `gen_ai_client_token_usage` tercih edin: OpenTelemetry GenAI anlamsal kurallarını izler ve OpenClaw dışındaki GenAI hizmetlerinden gelen metriklerle tutarlıdır.
</Tip>

## Prometheus ve OpenTelemetry dışa aktarma arasında seçim

OpenClaw her iki yüzeyi de bağımsız olarak destekler. Bunlardan birini, ikisini birden veya hiçbirini çalıştırabilirsiniz.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **Pull** modeli: Prometheus, `/api/diagnostics/prometheus` yolunu kazır.
    - Harici toplayıcı gerekmez.
    - Normal Gateway kimlik doğrulaması üzerinden doğrulanır.
    - Yüzey yalnızca metriklerden oluşur (iz veya günlük yoktur).
    - Zaten Prometheus + Grafana üzerinde standartlaşmış yığınlar için en uygunudur.
  </Tab>
  <Tab title="diagnostics-otel">
    - **Push** modeli: OpenClaw, bir toplayıcıya veya OTLP uyumlu arka uca OTLP/HTTP gönderir.
    - Yüzey metrikler, izler ve günlükleri içerir.
    - Her ikisine de ihtiyaç duyduğunuzda bir OpenTelemetry Collector (`prometheus` veya `prometheusremotewrite` dışa aktarıcısı) üzerinden Prometheus'a köprü kurar.
    - Tam katalog için bkz. [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry).
  </Tab>
</Tabs>

## Sorun giderme

<AccordionGroup>
  <Accordion title="Boş yanıt gövdesi">
    - Yapılandırmada `diagnostics.enabled: true` değerini kontrol edin.
    - `openclaw plugins list --enabled` ile Plugin'in etkin ve yüklü olduğunu doğrulayın.
    - Biraz trafik oluşturun; sayaçlar ve histogramlar ancak en az bir olaydan sonra satır yayar.
  </Accordion>
  <Accordion title="401 / yetkisiz">
    Uç nokta Gateway operatör kapsamını gerektirir (`auth: "gateway"` ve `gatewayRuntimeScopeSurface: "trusted-operator"`). Prometheus'un diğer herhangi bir Gateway operatör yolu için kullandığı aynı token'ı veya parolayı kullanın. Herkese açık kimlik doğrulamasız kip yoktur.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` artıyor">
    Yeni bir öznitelik **2048** seri sınırını aşıyor. Son metriklerde beklenmedik derecede yüksek kardinaliteli bir etiketi inceleyin ve bunu kaynakta düzeltin. Dışa aktarıcı, etiketleri sessizce yeniden yazmak yerine bilinçli olarak yeni serileri bırakır.
  </Accordion>
  <Accordion title="Prometheus yeniden başlatmadan sonra bayat seriler gösteriyor">
    Plugin durumu yalnızca bellekte tutar. Gateway yeniden başlatıldıktan sonra sayaçlar sıfıra döner ve gauge'lar bir sonraki bildirilen değerlerinden yeniden başlar. Sıfırlamaları temiz şekilde ele almak için PromQL `rate()` ve `increase()` kullanın.
  </Accordion>
</AccordionGroup>

## İlgili

- [Diagnostics dışa aktarma](/tr/gateway/diagnostics) — destek paketleri için yerel diagnostics zip
- [Sağlık ve hazır olma](/tr/gateway/health) — `/healthz` ve `/readyz` sondaları
- [Günlükleme](/tr/logging) — dosya tabanlı günlükleme
- [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry) — izler, metrikler ve günlükler için OTLP push
