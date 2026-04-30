---
read_when:
    - Você quer que Prometheus, Grafana, VictoriaMetrics ou outro coletor colete métricas do OpenClaw Gateway
    - Você precisa dos nomes das métricas do Prometheus e da política de rótulos para painéis ou alertas
    - Você quer métricas sem executar um coletor OpenTelemetry
sidebarTitle: Prometheus
summary: Expor os diagnósticos do OpenClaw como métricas de texto do Prometheus por meio do Plugin diagnostics-prometheus
title: Métricas do Prometheus
x-i18n:
    generated_at: "2026-04-30T09:50:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: d75a97a0b9dedd89eb25fee83626d8d726917872cc1c3bfcbf6e9634dd168a2b
    source_path: gateway/prometheus.md
    workflow: 16
---

O OpenClaw pode expor métricas de diagnóstico por meio do Plugin `diagnostics-prometheus` incluído. Ele escuta diagnósticos internos confiáveis e renderiza um endpoint de texto do Prometheus em:

```text
GET /api/diagnostics/prometheus
```

O tipo de conteúdo é `text/plain; version=0.0.4; charset=utf-8`, o formato padrão de exposição do Prometheus.

<Warning>
A rota usa autenticação do Gateway (escopo de operador). Não a exponha como um endpoint público não autenticado `/metrics`. Colete-a pelo mesmo caminho de autenticação que você usa para outras APIs de operador.
</Warning>

Para traces, logs, push OTLP e atributos semânticos de GenAI do OpenTelemetry, consulte [exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry).

## Início rápido

<Steps>
  <Step title="Habilite o Plugin">
    <Tabs>
      <Tab title="Configuração">
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
  <Step title="Reinicie o Gateway">
    A rota HTTP é registrada na inicialização do Plugin, então recarregue após habilitar.
  </Step>
  <Step title="Colete a rota protegida">
    Envie a mesma autenticação do gateway que seus clientes operadores usam:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Conecte o Prometheus">
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

| Métrica                                       | Tipo      | Rótulos                                                                                   |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | contador  | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`               | histograma | `channel`, `model`, `outcome`, `provider`, `trigger`                                     |
| `openclaw_model_call_total`                   | contador  | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`        | histograma | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                     |
| `openclaw_model_tokens_total`                 | contador  | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`          | histograma | `model`, `provider`, `token_type`                                                        |
| `openclaw_model_cost_usd_total`               | contador  | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_tool_execution_total`               | contador  | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_tool_execution_duration_seconds`    | histograma | `error_category`, `outcome`, `params_kind`, `tool`                                       |
| `openclaw_harness_run_total`                  | contador  | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | histograma | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | contador  | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds` | histograma | `channel`, `outcome`, `reason`                                                           |
| `openclaw_message_delivery_total`             | contador  | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | histograma | `channel`, `delivery_kind`, `error_category`, `outcome`                                  |
| `openclaw_queue_lane_size`                    | medidor   | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | histograma | `lane`                                                                                   |
| `openclaw_session_state_total`                | contador  | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | medidor   | `state`                                                                                   |
| `openclaw_memory_bytes`                       | medidor   | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | histograma | nenhum                                                                                   |
| `openclaw_memory_pressure_total`              | contador  | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | contador  | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | contador  | nenhum                                                                                   |

## Política de rótulos

<AccordionGroup>
  <Accordion title="Rótulos limitados e de baixa cardinalidade">
    Os rótulos do Prometheus permanecem limitados e com baixa cardinalidade. O exportador não emite identificadores brutos de diagnóstico, como `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, IDs de mensagens, IDs de chats ou IDs de solicitações de provedores.

    Os valores dos rótulos são redigidos e devem corresponder à política de caracteres de baixa cardinalidade do OpenClaw. Valores que falham na política são substituídos por `unknown`, `other` ou `none`, dependendo da métrica.

  </Accordion>
  <Accordion title="Limite de séries e contabilização de estouro">
    O exportador limita as séries temporais mantidas em memória a **2048** séries entre contadores, medidores e histogramas combinados. Novas séries além desse limite são descartadas, e `openclaw_prometheus_series_dropped_total` é incrementado em um a cada vez.

    Monitore esse contador como um sinal rígido de que um atributo upstream está vazando valores de alta cardinalidade. O exportador nunca aumenta o limite automaticamente; se ele subir, corrija a origem em vez de desabilitar o limite.

  </Accordion>
  <Accordion title="O que nunca aparece na saída do Prometheus">
    - texto de prompt, texto de resposta, entradas de ferramentas, saídas de ferramentas, prompts de sistema
    - IDs brutos de solicitações de provedores (apenas hashes limitados, quando aplicável, em spans — nunca em métricas)
    - chaves de sessão e IDs de sessão
    - nomes de host, caminhos de arquivo, valores secretos

  </Accordion>
</AccordionGroup>

## Receitas PromQL

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
Prefira `gen_ai_client_token_usage` para dashboards entre provedores: ele segue as convenções semânticas de GenAI do OpenTelemetry e é consistente com métricas de serviços GenAI que não são do OpenClaw.
</Tip>

## Escolha entre Prometheus e exportação do OpenTelemetry

O OpenClaw oferece suporte às duas superfícies de forma independente. Você pode executar uma delas, ambas ou nenhuma.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Modelo **pull**: o Prometheus coleta `/api/diagnostics/prometheus`.
    - Nenhum coletor externo é necessário.
    - Autenticado pela autenticação normal do Gateway.
    - A superfície é apenas de métricas (sem traces ou logs).
    - Melhor para stacks já padronizados em Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Modelo **push**: o OpenClaw envia OTLP/HTTP para um coletor ou backend compatível com OTLP.
    - A superfície inclui métricas, traces e logs.
    - Faz ponte para o Prometheus por meio de um OpenTelemetry Collector (exportador `prometheus` ou `prometheusremotewrite`) quando você precisa dos dois.
    - Consulte [exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry) para o catálogo completo.

  </Tab>
</Tabs>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Corpo de resposta vazio">
    - Verifique `diagnostics.enabled: true` na configuração.
    - Confirme que o Plugin está habilitado e carregado com `openclaw plugins list --enabled`.
    - Gere algum tráfego; contadores e histogramas só emitem linhas depois de pelo menos um evento.

  </Accordion>
  <Accordion title="401 / não autorizado">
    O endpoint exige o escopo de operador do Gateway (`auth: "gateway"` com `gatewayRuntimeScopeSurface: "trusted-operator"`). Use o mesmo token ou senha que o Prometheus usa para qualquer outra rota de operador do Gateway. Não há modo público não autenticado.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` está subindo">
    Um novo atributo está excedendo o limite de **2048** séries. Inspecione métricas recentes em busca de um rótulo inesperadamente de alta cardinalidade e corrija-o na origem. O exportador descarta intencionalmente novas séries em vez de reescrever rótulos silenciosamente.
  </Accordion>
  <Accordion title="O Prometheus mostra séries obsoletas após uma reinicialização">
    O Plugin mantém estado apenas na memória. Após uma reinicialização do Gateway, contadores são redefinidos para zero e medidores reiniciam no próximo valor relatado. Use `rate()` e `increase()` do PromQL para lidar com redefinições de forma limpa.
  </Accordion>
</AccordionGroup>

## Relacionados

- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics) — zip de diagnósticos local para pacotes de suporte
- [Saúde e prontidão](/pt-BR/gateway/health) — sondas `/healthz` e `/readyz`
- [Logs](/pt-BR/logging) — logs baseados em arquivo
- [Exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry) — push OTLP para traces, métricas e logs
