---
read_when:
    - Preparando um relatório de bug ou uma solicitação de suporte
    - Depuração de falhas, reinicializações, pressão de memória ou cargas úteis grandes demais do Gateway
    - Analisando quais dados de diagnóstico são registrados ou ocultados
summary: Crie pacotes de diagnóstico do Gateway compartilháveis para relatórios de bugs
title: Exportação de diagnósticos
x-i18n:
    generated_at: "2026-05-02T05:46:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d1f7c1e1d96aeeebe30b30c8a23ec3c7b0fb4938f15a3783bf22e861770bf78
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw pode criar um zip de diagnóstico local para relatórios de bug. Ele combina status, saúde, logs, formato de configuração e eventos recentes de estabilidade sem payload do Gateway, todos sanitizados.

Trate bundles de diagnóstico como segredos até revisá-los. Eles são projetados para omitir ou redigir payloads e credenciais, mas ainda resumem logs locais do Gateway e o estado de execução no nível do host.

## Início rápido

```bash
openclaw gateway diagnostics export
```

O comando imprime o caminho do zip gravado. Para escolher um caminho:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Para automação:

```bash
openclaw gateway diagnostics export --json
```

## Comando de chat

Proprietários podem usar `/diagnostics [note]` no chat para solicitar uma exportação local do Gateway.
Use isso quando o bug ocorreu em uma conversa real e você quiser um relatório copiável e colável para o suporte:

1. Envie `/diagnostics` na conversa em que você notou o problema. Adicione uma
   nota curta se ajudar, por exemplo `/diagnostics bad tool choice`.
2. O OpenClaw envia o preâmbulo de diagnóstico e solicita uma aprovação explícita
   de exec. A aprovação executa `openclaw gateway diagnostics export --json`.
   Não aprove diagnósticos por meio de uma regra allow-all.
3. Após a aprovação, o OpenClaw responde com um relatório colável contendo o
   caminho do bundle local, o resumo do manifesto, notas de privacidade e ids de sessão relevantes.

Em chats em grupo, um proprietário ainda pode executar `/diagnostics`, mas o OpenClaw não
publica os detalhes de diagnóstico de volta no chat compartilhado. Ele envia o preâmbulo,
prompts de aprovação, o resultado da exportação do Gateway e a decomposição de sessão/thread do Codex para
o proprietário pela rota privada de aprovação. O grupo recebe apenas um aviso curto
de que o fluxo de diagnóstico foi enviado em privado. Se o OpenClaw não conseguir encontrar uma rota privada
do proprietário, o comando falha fechado e pede que o proprietário o execute a partir de uma DM.

Quando a sessão ativa do OpenClaw está usando o harness nativo do OpenAI Codex,
a mesma aprovação de exec também cobre um upload de feedback para a OpenAI para as threads de runtime do Codex
que o OpenClaw conhece. Esse upload é separado do zip local do
Gateway e aparece apenas para sessões do harness Codex. Antes da aprovação, o
prompt explica que aprovar diagnósticos também enviará feedback do Codex, mas ele
não lista ids de sessão ou thread do Codex. Após a aprovação, a resposta no chat lista
os canais, ids de sessão do OpenClaw, ids de thread do Codex e comandos locais de retomada
para as threads que foram enviadas aos servidores da OpenAI. Se você negar ou ignorar a
aprovação, o OpenClaw não executa a exportação, não envia feedback do Codex e
não imprime os ids do Codex.

Isso torna curto o loop comum de depuração do Codex: notar o comportamento ruim no
Telegram, Discord ou outro canal, executar `/diagnostics`, aprovar uma vez, compartilhar
o relatório com o suporte e então executar localmente o comando impresso `codex resume <thread-id>`
se quiser inspecionar você mesmo a thread nativa do Codex. Consulte
[harness do Codex](/pt-BR/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) para
esse fluxo de inspeção.

## O que a exportação contém

O zip inclui:

- `summary.md`: visão geral legível por humanos para o suporte.
- `diagnostics.json`: resumo legível por máquina de configuração, logs, status, saúde
  e dados de estabilidade.
- `manifest.json`: metadados de exportação e lista de arquivos.
- Formato de configuração sanitizado e detalhes de configuração não secretos.
- Resumos de logs sanitizados e linhas recentes de log redigidas.
- Snapshots de status e saúde do Gateway no melhor esforço.
- `stability/latest.json`: bundle de estabilidade persistido mais recente, quando disponível.

A exportação é útil mesmo quando o Gateway não está saudável. Se o Gateway não conseguir
responder a solicitações de status ou saúde, os logs locais, o formato da configuração e o
bundle de estabilidade mais recente ainda serão coletados quando disponíveis.

## Modelo de privacidade

Os diagnósticos são projetados para serem compartilháveis. A exportação mantém dados operacionais
que ajudam na depuração, como:

- nomes de subsistemas, ids de Plugin, ids de provedor, ids de canal e modos configurados
- códigos de status, durações, contagens de bytes, estado de fila e leituras de memória
- metadados de log sanitizados e mensagens operacionais redigidas
- formato de configuração e configurações não secretas de recursos

A exportação omite ou redige:

- texto de chat, prompts, instruções, corpos de Webhook e saídas de ferramentas
- credenciais, chaves de API, tokens, cookies e valores secretos
- corpos brutos de solicitação ou resposta
- ids de conta, ids de mensagem, ids brutos de sessão, nomes de host e nomes de usuário locais

Quando uma mensagem de log parece texto de usuário, chat, prompt ou payload de ferramenta, a
exportação mantém apenas que uma mensagem foi omitida e a contagem de bytes.

## Gravador de estabilidade

O Gateway registra por padrão um fluxo de estabilidade limitado e sem payload quando
diagnósticos estão habilitados. Ele é destinado a fatos operacionais, não a conteúdo.

O mesmo Heartbeat de diagnóstico registra amostras de atividade quando o Gateway continua
em execução, mas o loop de eventos do Node.js ou a CPU parecem saturados. Esses eventos
`diagnostic.liveness.warning` incluem atraso do loop de eventos, utilização do loop de eventos,
proporção de núcleos de CPU e contagens de sessões ativas/em espera/enfileiradas. Amostras ociosas
permanecem na telemetria no nível `info`; elas só são registradas como avisos do Gateway
quando há trabalho de diagnóstico ativo, em espera ou enfileirado. Elas não
reiniciam o Gateway por si mesmas.

Inspecione o gravador ao vivo:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecione o bundle de estabilidade persistido mais recente após uma saída fatal, tempo limite
de desligamento ou falha de inicialização após reinício:

```bash
openclaw gateway stability --bundle latest
```

Crie um zip de diagnóstico a partir do bundle persistido mais recente:

```bash
openclaw gateway stability --bundle latest --export
```

Bundles persistidos ficam em `~/.openclaw/logs/stability/` quando existem eventos.

## Opções úteis

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: grava em um caminho específico de zip.
- `--log-lines <count>`: máximo de linhas de log sanitizadas a incluir.
- `--log-bytes <bytes>`: máximo de bytes de log a inspecionar.
- `--url <url>`: URL WebSocket do Gateway para snapshots de status e saúde.
- `--token <token>`: token do Gateway para snapshots de status e saúde.
- `--password <password>`: senha do Gateway para snapshots de status e saúde.
- `--timeout <ms>`: tempo limite de snapshots de status e saúde.
- `--no-stability-bundle`: ignora a busca por bundle de estabilidade persistido.
- `--json`: imprime metadados de exportação legíveis por máquina.

## Desabilitar diagnósticos

Diagnósticos são habilitados por padrão. Para desabilitar o gravador de estabilidade e
a coleta de eventos de diagnóstico:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Desabilitar diagnósticos reduz os detalhes do relatório de bug. Isso não afeta o registro normal
de logs do Gateway.

## Relacionados

- [Verificações de saúde](/pt-BR/gateway/health)
- [CLI do Gateway](/pt-BR/cli/gateway#gateway-diagnostics-export)
- [Protocolo do Gateway](/pt-BR/gateway/protocol#system-and-identity)
- [Logging](/pt-BR/logging)
- [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry) — fluxo separado para transmitir diagnósticos para um coletor
