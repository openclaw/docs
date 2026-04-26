---
read_when:
    - Você quer que o Prometheus, Grafana, VictoriaMetrics ou outro scraper colete métricas do OpenClaw Gateway
    - Você precisa dos nomes das métricas do Prometheus e da política de labels para painéis ou alertas
    - Você quer métricas sem executar um coletor OpenTelemetry
sidebarTitle: Prometheus
summary: Exponha os diagnósticos do OpenClaw como métricas de texto do Prometheus por meio do Plugin diagnostics-prometheus
title: Métricas do Prometheus
x-i18n:
    generated_at: "2026-04-26T11:29:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29fd3e4658ceffe20f078e8e38b61c685ea9df518ca04ca34abf2085166eb481
    source_path: gateway/prometheus.md
    workflow: 15
---

O OpenClaw pode expor métricas de diagnóstico por meio do Plugin incluído `diagnostics-prometheus`. Ele escuta diagnósticos internos confiáveis e renderiza um endpoint de texto do Prometheus em:

```text
GET /api/diagnostics/prometheus
```

O tipo de conteúdo é `text/plain; version=0.0.4; charset=utf-8`, o formato padrão de exposição do Prometheus.

<Warning>
A rota usa a autenticação do Gateway (escopo de operador). Não a exponha como um endpoint público `/metrics` sem autenticação. Faça o scrape por meio do mesmo caminho de auth que você usa para outras APIs de operador.
</Warning>

Para traces, logs, push OTLP e atributos semânticos GenAI do OpenTelemetry, consulte [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry).

## Início rápido

<Steps>
  <Step title="Ativar o Plugin">
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
  <Step title="Reiniciar o Gateway">
    A rota HTTP é registrada no startup do Plugin, então recarregue após ativá-lo.
  </Step>
  <Step title="Fazer scrape da rota protegida">
    Envie a mesma auth do Gateway que seus clientes de operador usam:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Conectar o Prometheus">
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
`diagnostics.enabled: true` é obrigatório. Sem isso, o Plugin ainda registra a rota HTTP, mas nenhum evento de diagnóstico flui para o exportador, então a resposta fica vazia.
</Note>

## Métricas exportadas

| Métrica                                       | Tipo      | Labels                                                                                    |
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

## Política de labels

<AccordionGroup>
  <Accordion title="Labels limitados e de baixa cardinalidade">
    Labels do Prometheus permanecem limitados e de baixa cardinalidade. O exportador não emite identificadores brutos de diagnóstico, como `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, IDs de mensagem, IDs de chat ou IDs de requisição do provedor.

    Valores de label são redigidos e devem corresponder à política de caracteres de baixa cardinalidade do OpenClaw. Valores que não atendem à política são substituídos por `unknown`, `other` ou `none`, dependendo da métrica.

  </Accordion>
  <Accordion title="Limite de séries e contabilização de overflow">
    O exportador limita as séries temporais retidas em memória a **2048** séries no total, somando counters, gauges e histograms. Novas séries além desse limite são descartadas, e `openclaw_prometheus_series_dropped_total` é incrementada em um a cada vez.

    Monitore esse contador como um sinal forte de que um atributo upstream está vazando valores de alta cardinalidade. O exportador nunca aumenta o limite automaticamente; se ele crescer, corrija a origem em vez de desativar o limite.

  </Accordion>
  <Accordion title="O que nunca aparece na saída do Prometheus">
    - texto de prompt, texto de resposta, entradas de ferramenta, saídas de ferramenta, prompts de sistema
    - IDs brutos de requisição do provedor (apenas hashes limitados, quando aplicável, em spans — nunca em métricas)
    - chaves de sessão e IDs de sessão
    - hostnames, caminhos de arquivo, valores secretos
  </Accordion>
</AccordionGroup>

## Receitas PromQL

```promql
# Tokens por minuto, divididos por provedor
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Gasto (USD) na última hora, por modelo
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 95º percentil de duração de execução de modelo
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# SLO de tempo de espera na fila (95p abaixo de 2 s)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Séries Prometheus descartadas (alarme de cardinalidade)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Prefira `gen_ai_client_token_usage` para painéis entre provedores: ele segue as convenções semânticas GenAI do OpenTelemetry e é consistente com métricas de serviços GenAI não OpenClaw.
</Tip>

## Escolhendo entre exportação Prometheus e OpenTelemetry

O OpenClaw oferece suporte a ambas as superfícies de forma independente. Você pode executar uma, ambas ou nenhuma.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Modelo de **pull**: o Prometheus faz scrape de `/api/diagnostics/prometheus`.
    - Nenhum coletor externo é necessário.
    - Autenticado por meio da auth normal do Gateway.
    - A superfície é somente de métricas (sem traces nem logs).
    - Ideal para stacks já padronizadas em Prometheus + Grafana.
  </Tab>
  <Tab title="diagnostics-otel">
    - Modelo de **push**: o OpenClaw envia OTLP/HTTP para um coletor ou backend compatível com OTLP.
    - A superfície inclui métricas, traces e logs.
    - Faz bridge para Prometheus por meio de um OpenTelemetry Collector (exportador `prometheus` ou `prometheusremotewrite`) quando você precisa dos dois.
    - Consulte [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry) para o catálogo completo.
  </Tab>
</Tabs>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Corpo de resposta vazio">
    - Verifique `diagnostics.enabled: true` na configuração.
    - Confirme se o Plugin está ativado e carregado com `openclaw plugins list --enabled`.
    - Gere algum tráfego; counters e histograms só emitem linhas após pelo menos um evento.
  </Accordion>
  <Accordion title="401 / unauthorized">
    O endpoint exige o escopo de operador do Gateway (`auth: "gateway"` com `gatewayRuntimeScopeSurface: "trusted-operator"`). Use o mesmo token ou senha que o Prometheus usa para qualquer outra rota de operador do Gateway. Não existe modo público sem autenticação.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` está aumentando">
    Um novo atributo está excedendo o limite de **2048** séries. Inspecione as métricas recentes em busca de um label com cardinalidade inesperadamente alta e corrija isso na origem. O exportador descarta intencionalmente novas séries em vez de reescrever labels silenciosamente.
  </Accordion>
  <Accordion title="O Prometheus mostra séries obsoletas após um restart">
    O Plugin mantém estado apenas em memória. Após um restart do Gateway, counters são redefinidos para zero e gauges reiniciam no próximo valor reportado. Use `rate()` e `increase()` em PromQL para lidar com resets corretamente.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics) — zip local de diagnósticos para pacotes de suporte
- [Integridade e prontidão](/pt-BR/gateway/health) — probes `/healthz` e `/readyz`
- [Logging](/pt-BR/logging) — logging baseado em arquivo
- [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry) — push OTLP para traces, métricas e logs
