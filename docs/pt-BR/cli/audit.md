---
read_when:
    - Você precisa responder quem executou um agente ou uma ferramenta, quando a execução ocorreu e como ela terminou
    - Você precisa de metadados do ciclo de vida de mensagens recebidas ou enviadas sem conteúdo
    - Você precisa de uma exportação de atividades com escopo limitado e segura para redação de dados sensíveis
summary: Referência da CLI para registros de auditoria somente de metadados do ciclo de vida de execuções, ferramentas e mensagens
title: Registros de auditoria
x-i18n:
    generated_at: "2026-07-12T15:03:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: da9df6f388b0a24c3b79d755fa59d047cce99262bc6d9c890be7a83da75693a8
    source_path: cli/audit.md
    workflow: 16
---

# `openclaw audit`

Consulte o ledger de auditoria somente de metadados do Gateway para execuções de agentes, ações de ferramentas e
registros opcionais do ciclo de vida de mensagens.

O ledger fica ativado por padrão para eventos de execução e ferramentas. Defina
[`audit.enabled: false`](/pt-BR/gateway/configuration-reference#audit) e reinicie o
Gateway para interromper todos os novos registros de eventos. Os registros de mensagens são desativados
separadamente por padrão; defina `audit.messages` como `direct` ou `all` e reinicie o Gateway para
registrá-los. Os registros existentes permanecem consultáveis até expirarem (30 dias).

O ledger é separado das transcrições de conversas: ele registra identidade,
ordenação, proveniência, ação, status e códigos de resultado normalizados, mas nunca
armazena conteúdo, e os identificadores de mensagens aparecem apenas como
pseudônimos com chave locais da instalação. O [Histórico de auditoria](/pt-BR/gateway/audit) define o modelo de dados completo,
a semântica de privacidade, os limites de armazenamento/retenção e os limites de cobertura; esta página
aborda a superfície de comandos.

```bash
openclaw audit
openclaw audit --agent main --status failed
openclaw audit --session "agent:main:main" --after 2026-07-01T00:00:00Z
openclaw audit --run 8c69f72e-8b11-4c54-98d5-1a3dd67450c3
openclaw audit --kind tool_action --limit 50 --json
openclaw audit --kind message --direction outbound --channel telegram --json
```

## Filtros

- `--agent <id>`: id exato do agente
- `--session <key>`: chave exata da sessão
- `--run <id>`: id exato da execução
- `--kind <kind>`: `agent_run`, `tool_action` ou `message`
- `--status <status>`: `started`, `succeeded`, `failed`, `cancelled`,
  `timed_out`, `blocked` ou `unknown`
- `--direction <direction>`: direção da mensagem, `inbound` ou `outbound`
- `--channel <channel>`: canal exato da mensagem
- `--after <timestamp>` / `--before <timestamp>`: carimbo de data/hora ISO inclusivo ou
  milissegundos Unix
- `--limit <count>`: tamanho da página de 1 a 500; padrão `100`
- `--cursor <sequence>`: continue uma consulta anterior ordenada do mais recente para o mais antigo
- `--json`: exiba a página limitada como JSON

A CLI consulta a RPC de atividade versionada para que um comando mostre o ledger
configurado completo. A saída de texto mostra horário, tipo, direção, canal, status,
agente, execução e ação. A proveniência ausente de mensagens é exibida como `-`; o OpenClaw
não inventa ids de agente nem de execução. As ações de ferramentas também mostram o nome da ferramenta. A saída
JSON inclui `nextCursor` quando há outra página. Passe esse valor para
`--cursor` para continuar sem reordenar os registros que chegam durante a paginação.

Essas exportações continuam sendo metadados operacionais confidenciais, embora os corpos das mensagens
e os campos de identidade bruta das mensagens estejam ausentes. Os ids de agente, sessão e execução, horários,
canais, resultados e referências HMAC estáveis podem correlacionar atividades. Proteja-os
com os mesmos controles de acesso e práticas de retenção usados para outros registros
operacionais.

## Eventos registrados

O Gateway projeta fluxos confiáveis do ciclo de vida em seis ações:

- `agent.run.started`
- `agent.run.finished`
- `tool.action.started`
- `tool.action.finished`
- `message.inbound.processed`
- `message.outbound.finished`

Cada registro retornado tem um id de evento estável, uma sequência do ledger
monotonicamente crescente, um carimbo de data/hora do ciclo de vida, ator, ação, status, um
marcador `schemaVersion: 1`, sequência de origem e `redaction: "metadata_only"`.
A proveniência de agente/sessão/execução e os campos específicos do evento estão presentes somente quando
a fonte confiável os fornece. Os registros de mensagens omitem intencionalmente
`sessionKey` e `sessionId`, portanto os filtros `--session` se aplicam somente a registros de execução e ferramentas.

Os registros terminais de execução e ferramentas distinguem sucesso, falha, cancelamento,
tempo limite e bloqueios de política com status e códigos de erro fechados. `unknown` é um
resultado explícito diferente de sucesso quando um runtime upstream não expõe um
resultado terminal autoritativo. Os ids de chamadas de ferramentas são exportados somente como impressões digitais
estáveis. Os nomes das ferramentas devem corresponder ao contrato compacto de nomes
voltado ao modelo; outros valores se tornam `unknown`.

Os registros de mensagens acrescentam direção, canal, tipo de conversa, resultado e
opcionalmente tipo de entrega, estágio da falha, duração, contagem de resultados, código de
motivo normalizado e pseudônimos com chave de conta/conversa/mensagem/destino. O
limite atual de entrada abrange mensagens aceitas que chegam ao despacho central,
incluindo resultados centrais de duplicidade e de processamento terminal. O limite de saída
grava uma linha terminal por payload original de resposta lógica que chega à
entrega durável compartilhada; a fragmentação e a distribuição pelos adaptadores são agregadas em
`resultCount`. Envios enfileirados que podem ser repetidos ou que são ambíguos são registrados somente após uma
confirmação, uma carta morta ou uma reconciliação tornar o resultado terminal.
Os caminhos locais de plugins e de envio direto que contornam esses limites compartilhados ainda não
são cobertos; a ausência de uma linha não prova que nenhuma mensagem existiu.

O ledger de auditoria não substitui transcrições, histórico de tarefas, histórico de execuções Cron
nem logs. Ele fornece um pequeno índice entre execuções para consultas de operadores sem
copiar o conteúdo das conversas para outro armazenamento.

Para linhas de entrada, `durationMs` mede o despacho central e `resultCount` conta
payloads finalizados e enfileirados de ferramentas, bloqueios e respostas. Para linhas de saída,
`durationMs` inclui a responsabilidade pela entrega até seu estado terminal (e, portanto,
o tempo de espera na fila), enquanto `resultCount` conta envios físicos identificados
na plataforma. `deliveryKind`, quando presente, descreve o payload efetivo após o hook e
após a renderização; linhas suprimidas e ambíguas devido a falhas omitem esse campo.

## RPC do Gateway

`audit.activity.list` exige `operator.read` e aceita os mesmos filtros. Ela
retorna a união nomeada de eventos de atividade V1, incluindo registros de execução, ferramenta, mensagem
de entrada e mensagem de saída.

```bash
openclaw gateway call audit.activity.list --params '{"channel":"telegram","limit":50}'
```

O resultado é `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.
Os resultados são ordenados do mais recente para o mais antigo e limitados a 500 registros por solicitação.

A RPC `audit.list` distribuída permanece inalterada para clientes antigos de execução/ferramentas. Quando
`audit.activity.list` não está disponível em um Gateway antigo, a CLI tenta novamente
com `audit.list` somente se todos os filtros solicitados forem compatíveis com esse método legado. `--kind message`,
`--direction` e `--channel` falham com uma mensagem de atualização em um Gateway antigo,
em vez de serem descartados silenciosamente.

## Relacionados

- [Histórico de auditoria](/pt-BR/gateway/audit)
- [Protocolo do Gateway](/pt-BR/gateway/protocol#audit-ledger-rpc)
- [Sessões](/pt-BR/cli/sessions)
- [Tarefas](/pt-BR/cli/tasks)
- [Tarefas Cron](/pt-BR/automation/cron-jobs)
