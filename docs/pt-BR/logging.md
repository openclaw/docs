---
read_when:
    - Você precisa de uma visão geral dos logs do OpenClaw amigável para iniciantes
    - Você quer configurar níveis de log, formatos ou redação
    - Você está solucionando problemas e precisa encontrar logs rapidamente
summary: Logs em arquivo, saída no console, tailing pela CLI e a aba Logs da Control UI
title: Logs
x-i18n:
    generated_at: "2026-04-26T11:32:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fa55caa65a2a06a757e37ad64c5fd030f958cf6827596db5c183c6c6db2ed9b
    source_path: logging.md
    workflow: 15
---

O OpenClaw tem duas superfícies principais de log:

- **Logs em arquivo** (linhas JSON) gravados pelo Gateway.
- **Saída no console** exibida em terminais e na UI de depuração do Gateway.

A aba **Logs** da Control UI faz tail do log de arquivo do gateway. Esta página explica onde
os logs ficam, como lê-los e como configurar níveis e formatos de log.

## Onde os logs ficam

Por padrão, o Gateway grava um arquivo de log rotativo em:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

A data usa o fuso horário local do host do gateway.

Cada arquivo gira quando atinge `logging.maxFileBytes` (padrão: 100 MB).
O OpenClaw mantém até cinco arquivos numerados ao lado do arquivo ativo, como
`openclaw-YYYY-MM-DD.1.log`, e continua gravando em um novo arquivo ativo em vez de
suprimir diagnósticos.

Você pode substituir isso em `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Como ler os logs

### CLI: tail ao vivo (recomendado)

Use a CLI para fazer tail do arquivo de log do gateway via RPC:

```bash
openclaw logs --follow
```

Opções atuais úteis:

- `--local-time`: renderiza timestamps no seu fuso horário local
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flags padrão de RPC do Gateway
- `--expect-final`: flag compartilhada da camada de cliente para aguardar resposta final de RPC com suporte de agente (aceita aqui pela camada compartilhada de cliente)

Modos de saída:

- **Sessões TTY**: linhas de log bonitas, coloridas e estruturadas.
- **Sessões não TTY**: texto simples.
- `--json`: JSON delimitado por linha (um evento de log por linha).
- `--plain`: força texto simples em sessões TTY.
- `--no-color`: desativa cores ANSI.

Quando você passa um `--url` explícito, a CLI não aplica automaticamente a configuração nem as
credenciais do ambiente; inclua `--token` você mesmo se o Gateway de destino
exigir autenticação.

No modo JSON, a CLI emite objetos marcados por `type`:

- `meta`: metadados do stream (arquivo, cursor, tamanho)
- `log`: entrada de log analisada
- `notice`: dicas de truncamento / rotação
- `raw`: linha de log não analisada

Se o Gateway local em loopback pedir pareamento, `openclaw logs` recorre
automaticamente ao arquivo de log local configurado. Alvos explícitos com `--url` não
usam esse fallback.

Se o Gateway estiver inacessível, a CLI imprime uma dica curta para executar:

```bash
openclaw doctor
```

### Control UI (web)

A aba **Logs** da Control UI faz tail do mesmo arquivo usando `logs.tail`.
Consulte [/web/control-ui](/pt-BR/web/control-ui) para saber como abri-la.

### Logs apenas de canal

Para filtrar atividade de canal (WhatsApp/Telegram/etc.), use:

```bash
openclaw channels logs --channel whatsapp
```

## Formatos de log

### Logs em arquivo (JSONL)

Cada linha no arquivo de log é um objeto JSON. A CLI e a Control UI analisam essas
entradas para renderizar saída estruturada (hora, nível, subsistema, mensagem).

### Saída no console

Os logs do console são **compatíveis com TTY** e formatados para legibilidade:

- Prefixos de subsistema (por exemplo `gateway/channels/whatsapp`)
- Cores por nível (info/warn/error)
- Modo compacto ou JSON opcional

A formatação do console é controlada por `logging.consoleStyle`.

### Logs WebSocket do Gateway

`openclaw gateway` também tem registro de log do protocolo WebSocket para tráfego RPC:

- modo normal: apenas resultados interessantes (erros, erros de análise, chamadas lentas)
- `--verbose`: todo o tráfego de request/response
- `--ws-log auto|compact|full`: escolhe o estilo de renderização detalhada
- `--compact`: alias para `--ws-log compact`

Exemplos:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Configurando logs

Toda a configuração de logs fica em `logging` em `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Níveis de log

- `logging.level`: nível dos **logs em arquivo** (JSONL).
- `logging.consoleLevel`: nível de detalhamento do **console**.

Você pode substituir ambos pela variável de ambiente **`OPENCLAW_LOG_LEVEL`** (por exemplo, `OPENCLAW_LOG_LEVEL=debug`). A variável de ambiente tem precedência sobre o arquivo de configuração, então você pode aumentar o detalhamento de uma única execução sem editar `openclaw.json`. Você também pode passar a opção global da CLI **`--log-level <level>`** (por exemplo, `openclaw --log-level debug gateway run`), que substitui a variável de ambiente para esse comando.

`--verbose` afeta apenas a saída do console e o nível de detalhamento dos logs WS; ele não altera
os níveis dos logs em arquivo.

### Estilos de console

`logging.consoleStyle`:

- `pretty`: amigável para humanos, colorido, com timestamps.
- `compact`: saída mais enxuta (melhor para sessões longas).
- `json`: JSON por linha (para processadores de log).

### Redação

Resumos de ferramentas podem redigir tokens sensíveis antes que cheguem ao console:

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: lista de strings regex para substituir o conjunto padrão

A redação se aplica nos destinos de log para **saída no console**, **diagnósticos de console encaminhados para stderr** e **logs em arquivo**. Os logs em arquivo permanecem em JSONL, mas
valores secretos correspondentes são mascarados antes de a linha ser gravada em disco.

## Diagnósticos e OpenTelemetry

Diagnósticos são eventos estruturados e legíveis por máquina para execuções de modelos e
telemetria de fluxo de mensagens (Webhooks, filas, estado de sessão). Eles **não**
substituem logs — eles alimentam métricas, rastros e exportadores. Os eventos são emitidos
em processo, exportados ou não.

Duas superfícies adjacentes:

- **Exportação OpenTelemetry** — envia métricas, rastros e logs por OTLP/HTTP para
  qualquer coletor ou backend compatível com OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo etc.). Configuração completa, catálogo de sinais,
  nomes de métricas/spans, variáveis de ambiente e modelo de privacidade ficam em uma página dedicada:
  [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry).
- **Flags de diagnósticos** — flags direcionadas de log de depuração que encaminham logs extras para
  `logging.file` sem elevar `logging.level`. As flags não diferenciam maiúsculas de minúsculas
  e oferecem suporte a curingas (`telegram.*`, `*`). Configure em `diagnostics.flags`
  ou pela substituição por env `OPENCLAW_DIAGNOSTICS=...`. Guia completo:
  [Flags de diagnósticos](/pt-BR/diagnostics/flags).

Para ativar eventos de diagnóstico para Plugins ou destinos personalizados sem exportação OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Para exportação OTLP para um coletor, consulte [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry).

## Dicas de solução de problemas

- **Gateway inacessível?** Execute `openclaw doctor` primeiro.
- **Logs vazios?** Verifique se o Gateway está em execução e gravando no caminho do arquivo
  em `logging.file`.
- **Precisa de mais detalhes?** Defina `logging.level` como `debug` ou `trace` e tente novamente.

## Relacionado

- [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry) — exportação OTLP/HTTP, catálogo de métricas/spans, modelo de privacidade
- [Flags de diagnósticos](/pt-BR/diagnostics/flags) — flags direcionadas de log de depuração
- [Internals de logs do Gateway](/pt-BR/gateway/logging) — estilos de log WS, prefixos de subsistema e captura de console
- [Referência de configuração](/pt-BR/gateway/configuration-reference#diagnostics) — referência completa dos campos `diagnostics.*`
