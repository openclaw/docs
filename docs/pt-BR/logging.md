---
read_when:
    - Você precisa de uma visão geral do registro em logs do OpenClaw voltada a iniciantes
    - Você quer configurar níveis de log, formatos ou mascaramento
    - Você está solucionando problemas e precisa encontrar registros rapidamente
summary: Logs em arquivo, saída do console, acompanhamento pela CLI e a aba Logs da UI de Controle
title: Registro em logs
x-i18n:
    generated_at: "2026-05-06T06:02:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: abcdfeb0f9fbd13715762a1829198d0285738855c50f2ee531cab1e989d936b1
    source_path: logging.md
    workflow: 16
---

OpenClaw tem duas superfícies principais de registros:

- **Registros em arquivo** (linhas JSON) gravados pelo Gateway.
- **Saída do console** exibida em terminais e na UI de depuração do Gateway.

A aba **Registros** da UI de controle acompanha em tempo real o arquivo de registros do Gateway. Esta página explica onde
os registros ficam, como lê-los e como configurar níveis e formatos de registro.

## Onde os registros ficam

Por padrão, o Gateway grava um arquivo de registro rotativo em:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

A data usa o fuso horário local do host do Gateway.

Cada arquivo é rotacionado quando atinge `logging.maxFileBytes` (padrão: 100 MB).
O OpenClaw mantém até cinco arquivos numerados ao lado do arquivo ativo, como
`openclaw-YYYY-MM-DD.1.log`, e continua gravando em um novo registro ativo em vez de
suprimir diagnósticos.

Você pode substituir isso em `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Como ler registros

### CLI: acompanhamento em tempo real (recomendado)

Use a CLI para acompanhar o arquivo de registros do Gateway via RPC:

```bash
openclaw logs --follow
```

Opções atuais úteis:

- `--local-time`: renderiza timestamps no seu fuso horário local
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flags padrão de RPC do Gateway
- `--expect-final`: flag de espera de resposta final de RPC apoiada por agente (aceita aqui pela camada de cliente compartilhada)

Modos de saída:

- **Sessões TTY**: linhas de registro estruturadas, bonitas e coloridas.
- **Sessões não TTY**: texto simples.
- `--json`: JSON delimitado por linhas (um evento de registro por linha).
- `--plain`: força texto simples em sessões TTY.
- `--no-color`: desativa cores ANSI.

Quando você passa um `--url` explícito, a CLI não aplica automaticamente credenciais de configuração ou
ambiente; inclua `--token` você mesmo se o Gateway de destino
exigir autenticação.

No modo JSON, a CLI emite objetos marcados por `type`:

- `meta`: metadados do fluxo (arquivo, cursor, tamanho)
- `log`: entrada de registro analisada
- `notice`: dicas de truncamento / rotação
- `raw`: linha de registro não analisada

Se o Gateway local loopback implícito solicitar emparelhamento, fechar durante a conexão
ou atingir timeout antes de `logs.tail` responder, `openclaw logs` faz fallback automaticamente para o
arquivo de registros do Gateway configurado. Destinos `--url` explícitos não usam
esse fallback.

Se o Gateway estiver inacessível, a CLI imprime uma dica curta para executar:

```bash
openclaw doctor
```

### UI de controle (web)

A aba **Registros** da UI de controle acompanha o mesmo arquivo usando `logs.tail`.
Consulte [UI de controle](/pt-BR/web/control-ui) para saber como abri-la.

### Registros apenas de canais

Para filtrar atividade de canais (WhatsApp/Telegram/etc), use:

```bash
openclaw channels logs --channel whatsapp
```

## Formatos de registro

### Registros em arquivo (JSONL)

Cada linha no arquivo de registro é um objeto JSON. A CLI e a UI de controle analisam essas
entradas para renderizar saída estruturada (hora, nível, subsistema, mensagem).

Registros JSONL de arquivo também incluem campos de nível superior filtráveis por máquina quando
disponíveis:

- `hostname`: nome do host do Gateway.
- `message`: texto da mensagem de registro achatado para busca de texto completo.
- `agent_id`: id do agente ativo quando a chamada de registro carrega contexto de agente.
- `session_id`: id/chave da sessão ativa quando a chamada de registro carrega contexto de sessão.
- `channel`: canal ativo quando a chamada de registro carrega contexto de canal.

O OpenClaw preserva os argumentos estruturados originais do registro junto a esses campos
para que analisadores existentes que leem chaves numeradas de argumentos tslog continuem funcionando.

### Saída do console

Registros do console são **cientes de TTY** e formatados para legibilidade:

- Prefixos de subsistema (por exemplo, `gateway/channels/whatsapp`)
- Coloração por nível (info/warn/error)
- Modo compacto ou JSON opcional

A formatação do console é controlada por `logging.consoleStyle`.

### Registros WebSocket do Gateway

`openclaw gateway` também tem registro de protocolo WebSocket para tráfego RPC:

- modo normal: apenas resultados interessantes (erros, erros de análise, chamadas lentas)
- `--verbose`: todo o tráfego de requisição/resposta
- `--ws-log auto|compact|full`: escolhe o estilo de renderização detalhada
- `--compact`: alias para `--ws-log compact`

Exemplos:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Configurando registros

Toda a configuração de registros fica em `logging` em `~/.openclaw/openclaw.json`.

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

### Níveis de registro

- `logging.level`: nível dos **registros em arquivo** (JSONL).
- `logging.consoleLevel`: nível de verbosidade do **console**.

Você pode substituir ambos pela variável de ambiente **`OPENCLAW_LOG_LEVEL`** (por exemplo, `OPENCLAW_LOG_LEVEL=debug`). A variável de ambiente tem precedência sobre o arquivo de configuração, então você pode aumentar a verbosidade para uma única execução sem editar `openclaw.json`. Você também pode passar a opção global da CLI **`--log-level <level>`** (por exemplo, `openclaw --log-level debug gateway run`), que substitui a variável de ambiente para esse comando.

`--verbose` afeta apenas a saída do console e a verbosidade de registros WS; ele não altera
níveis de registro em arquivo.

### Correlação de rastreamento

Registros em arquivo são JSONL. Quando uma chamada de registro carrega um contexto válido de rastreamento diagnóstico,
o OpenClaw grava os campos de rastreamento como chaves JSON de nível superior (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) para que processadores externos de registros possam correlacionar a linha
com spans OTEL e propagação `traceparent` de provedores.

Requisições HTTP do Gateway e frames WebSocket do Gateway estabelecem um escopo interno de rastreamento de requisição. Registros e eventos diagnósticos emitidos dentro desse escopo assíncrono herdam
o rastreamento da requisição quando não passam um contexto de rastreamento explícito. Rastreamentos de execução de agente e
chamadas de modelo se tornam filhos do rastreamento de requisição ativo, para que registros locais,
snapshots diagnósticos, spans OTEL e cabeçalhos `traceparent` de provedores confiáveis possam
ser associados por `traceId` sem registrar conteúdo bruto de requisição ou modelo.

### Tamanho e tempo de chamada de modelo

Diagnósticos de chamada de modelo registram medições limitadas de requisição/resposta sem
capturar conteúdo bruto de prompt ou resposta:

- `requestPayloadBytes`: tamanho em bytes UTF-8 do payload final da requisição ao modelo
- `responseStreamBytes`: tamanho em bytes UTF-8 de eventos de resposta do modelo transmitidos por streaming
- `timeToFirstByteMs`: tempo decorrido antes do primeiro evento de resposta transmitido por streaming
- `durationMs`: duração total da chamada de modelo

Esses campos estão disponíveis para snapshots diagnósticos, hooks de Plugin de chamada de modelo e
spans/métricas OTEL de chamada de modelo quando a exportação de diagnósticos está habilitada.

### Estilos do console

`logging.consoleStyle`:

- `pretty`: amigável para humanos, colorido, com timestamps.
- `compact`: saída mais enxuta (melhor para sessões longas).
- `json`: JSON por linha (para processadores de registros).

### Redação

O OpenClaw pode redigir tokens sensíveis antes que eles cheguem à saída do console, registros em arquivo,
registros OTLP, texto persistido de transcrição de sessão ou payloads de eventos de ferramentas da UI de controle
(args de início de ferramenta, payloads de resultado parcial/final, saída derivada de
exec e resumos de patch):

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: lista de strings regex para substituir o conjunto padrão. Padrões personalizados se aplicam além dos padrões integrados para payloads de ferramentas da UI de controle, então adicionar um padrão nunca enfraquece a redação de valores já capturados pelos padrões.

Registros em arquivo e transcrições de sessão permanecem JSONL, mas valores secretos correspondentes são
mascarados antes que a linha ou mensagem seja gravada em disco. A redação é de melhor esforço:
ela se aplica a conteúdo de mensagem com texto e strings de registro, não a todo
identificador ou campo de payload binário.

Os padrões integrados cobrem credenciais comuns de API e nomes de campos de credenciais de pagamento,
como número do cartão, CVC/CVV, token de pagamento compartilhado e credencial de pagamento
quando aparecem como campos JSON, parâmetros de URL, flags de CLI ou atribuições.

`logging.redactSensitive: "off"` desativa apenas esta política geral de registros/transcrições.
O OpenClaw ainda redige payloads de limite de segurança que podem ser mostrados a clientes de UI,
pacotes de suporte, observadores de diagnóstico, prompts de aprovação ou ferramentas de agente.
Exemplos incluem eventos de chamada de ferramenta da UI de controle, saída de `sessions_history`,
exportações de suporte de diagnóstico, observações de erro de provedor, exibição de comando de aprovação de exec
e registros de protocolo WebSocket do Gateway. `logging.redactPatterns` personalizados
ainda podem adicionar padrões específicos do projeto nessas superfícies.

## Diagnósticos e OpenTelemetry

Diagnósticos são eventos estruturados, legíveis por máquina, para execuções de modelo e
telemetria de fluxo de mensagens (webhooks, filas, estado de sessão). Eles **não**
substituem registros — eles alimentam métricas, rastreamentos e exportadores. Eventos são emitidos
no processo, quer você os exporte ou não.

Duas superfícies adjacentes:

- **Exportação OpenTelemetry** — envie métricas, rastreamentos e registros por OTLP/HTTP para
  qualquer coletor ou backend compatível com OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, etc.). Configuração completa, catálogo de sinais,
  nomes de métricas/spans, variáveis de ambiente e modelo de privacidade ficam em uma página dedicada:
  [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry).
- **Flags de diagnóstico** — flags direcionadas de registro de depuração que roteiam registros extras para
  `logging.file` sem elevar `logging.level`. Flags não diferenciam maiúsculas de minúsculas
  e suportam curingas (`telegram.*`, `*`). Configure em `diagnostics.flags`
  ou pela substituição de ambiente `OPENCLAW_DIAGNOSTICS=...`. Guia completo:
  [Flags de diagnóstico](/pt-BR/diagnostics/flags).

Para habilitar eventos de diagnóstico para Plugins ou coletores personalizados sem exportação OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Para exportação OTLP para um coletor, consulte [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry).

## Dicas de solução de problemas

- **Gateway inacessível?** Execute `openclaw doctor` primeiro.
- **Registros vazios?** Verifique se o Gateway está em execução e gravando no caminho de arquivo
  em `logging.file`.
- **Precisa de mais detalhes?** Defina `logging.level` como `debug` ou `trace` e tente novamente.

## Relacionado

- [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry) — exportação OTLP/HTTP, catálogo de métricas/spans, modelo de privacidade
- [Flags de diagnóstico](/pt-BR/diagnostics/flags) — flags direcionadas de registro de depuração
- [Internos de registro do Gateway](/pt-BR/gateway/logging) — estilos de registro WS, prefixos de subsistema e captura de console
- [Referência de configuração](/pt-BR/gateway/configuration-reference#diagnostics) — referência completa de campos `diagnostics.*`
