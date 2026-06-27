---
read_when:
    - Preparando um relatório de bug ou solicitação de suporte
    - Depuração de falhas, reinicializações, pressão de memória ou payloads muito grandes do Gateway
    - Revisar quais dados de diagnóstico são registrados ou removidos
summary: Crie pacotes de diagnóstico do Gateway compartilháveis para relatórios de bug
title: Exportação de diagnósticos
x-i18n:
    generated_at: "2026-06-27T17:29:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ce431bafa51a245f2a3829074b0ca92e2d30ddfc1ae9738eed46a4e51ae98208
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw pode criar um zip local de diagnóstico para relatórios de bug. Ele combina
status, integridade, logs, formato da configuração e eventos recentes de
estabilidade sem carga útil do Gateway, todos sanitizados.

Trate pacotes de diagnóstico como segredos até revisá-los. Eles são projetados
para omitir ou redigir cargas úteis e credenciais, mas ainda resumem logs locais
do Gateway e o estado de runtime em nível de host.

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
Use isso quando o bug aconteceu em uma conversa real e você quer um relatório
copiável para o suporte:

1. Envie `/diagnostics` na conversa em que percebeu o problema. Adicione uma
   observação curta se ajudar, por exemplo `/diagnostics bad tool choice`.
2. O OpenClaw envia o preâmbulo de diagnóstico e solicita uma aprovação explícita
   de execução. A aprovação executa `openclaw gateway diagnostics export --json`.
   Não aprove diagnósticos por meio de uma regra de permissão total.
3. Após a aprovação, o OpenClaw responde com um relatório colável contendo o
   caminho do pacote local, resumo do manifesto, notas de privacidade e ids de sessão relevantes.

Em chats de grupo, um proprietário ainda pode executar `/diagnostics`, mas o OpenClaw não
publica os detalhes de diagnóstico de volta no chat compartilhado. Ele envia o preâmbulo,
prompts de aprovação, resultado da exportação do Gateway e detalhamento de sessão/thread do Codex para
o proprietário pela rota privada de aprovação. O grupo recebe apenas um aviso curto
de que o fluxo de diagnóstico foi enviado privadamente. Se o OpenClaw não conseguir encontrar uma rota privada
para o proprietário, o comando falha fechado e pede que o proprietário o execute a partir de uma DM.

Quando a sessão ativa do OpenClaw está usando o harness nativo OpenAI Codex,
a mesma aprovação de execução também cobre um upload de feedback do OpenAI para as threads de runtime do Codex que o OpenClaw conhece. Esse upload é separado do zip local
do Gateway e aparece apenas para sessões do harness Codex. Antes da aprovação, o
prompt explica que aprovar diagnósticos também enviará feedback do Codex, mas ele
não lista ids de sessão ou thread do Codex. Após a aprovação, a resposta do chat lista
os canais, ids de sessão do OpenClaw, ids de thread do Codex e comandos locais de retomada
para as threads que foram enviadas aos servidores da OpenAI. Se você negar ou ignorar a
aprovação, o OpenClaw não executa a exportação, não envia feedback do Codex e
não imprime os ids do Codex.

Isso torna curto o loop comum de depuração do Codex: perceba o comportamento ruim no
Telegram, Discord ou outro canal, execute `/diagnostics`, aprove uma vez, compartilhe
o relatório com o suporte e então execute localmente o comando `codex resume <thread-id>` impresso
se quiser inspecionar a thread nativa do Codex por conta própria. Veja
[harness Codex](/pt-BR/plugins/codex-harness#inspect-codex-threads-locally) para
esse fluxo de inspeção.

## O que a exportação contém

O zip inclui:

- `summary.md`: visão geral legível para humanos para o suporte.
- `diagnostics.json`: resumo legível por máquina de configuração, logs, status, integridade
  e dados de estabilidade.
- `manifest.json`: metadados da exportação e lista de arquivos.
- Formato da configuração sanitizado e detalhes não secretos da configuração.
- Resumos de logs sanitizados e linhas recentes de log redigidas.
- Instantâneos de status e integridade do Gateway em melhor esforço.
- `stability/latest.json`: pacote de estabilidade persistido mais recente, quando disponível.

A exportação é útil mesmo quando o Gateway está sem integridade. Se o Gateway não puder
responder a solicitações de status ou integridade, os logs locais, o formato da configuração e o pacote
de estabilidade mais recente ainda serão coletados quando disponíveis.

## Modelo de privacidade

Diagnósticos são projetados para serem compartilháveis. A exportação mantém dados operacionais
que ajudam na depuração, como:

- nomes de subsistemas, ids de Plugin, ids de provedor, ids de canal e modos configurados
- códigos de status, durações, contagens de bytes, estado da fila e leituras de memória
- metadados de log sanitizados e mensagens operacionais redigidas
- formato da configuração e configurações não secretas de recursos

A exportação omite ou redige:

- texto de chat, prompts, instruções, corpos de Webhook e saídas de ferramentas
- credenciais, chaves de API, tokens, cookies e valores secretos
- corpos brutos de requisição ou resposta
- ids de conta, ids de mensagem, ids brutos de sessão, nomes de host e nomes de usuário locais

Quando uma mensagem de log parece texto de usuário, chat, prompt ou carga útil de ferramenta, a
exportação mantém apenas que uma mensagem foi omitida e a contagem de bytes.

## Gravador de estabilidade

O Gateway registra por padrão um fluxo de estabilidade limitado e sem carga útil quando
diagnósticos estão habilitados. Ele é para fatos operacionais, não conteúdo.

O mesmo Heartbeat de diagnóstico registra amostras de vivacidade quando o Gateway continua
em execução, mas o loop de eventos do Node.js ou a CPU parecem saturados. Esses eventos
`diagnostic.liveness.warning` incluem atraso do loop de eventos, utilização do loop de eventos,
proporção de núcleos de CPU, contagens de sessões ativas/em espera/enfileiradas, a fase atual
de inicialização/runtime quando conhecida, intervalos recentes de fase e rótulos limitados de trabalhos ativos/enfileirados.
Amostras ociosas permanecem na telemetria no nível `info`. Amostras de vivacidade
viram avisos do Gateway apenas quando há trabalho aguardando ou enfileirado, ou quando trabalho ativo
se sobrepõe a atraso sustentado do loop de eventos. Picos transitórios de atraso máximo durante
trabalho em segundo plano saudável permanecem nos logs de depuração. Eles não reiniciam o
Gateway por conta própria.

Fases de inicialização também emitem eventos `diagnostic.phase.completed` com tempo de relógio de parede e
tempo de CPU. Diagnósticos de execução incorporada travada marcam `terminalProgressStale=true`
quando o último progresso da ponte parecia terminal, como um item bruto de resposta ou
evento de conclusão de resposta, mas o Gateway ainda considera a execução incorporada
ativa.

Inspecione o gravador ao vivo:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecione o pacote de estabilidade persistido mais recente após uma saída fatal, tempo limite
de desligamento ou falha de inicialização na reinicialização:

```bash
openclaw gateway stability --bundle latest
```

Crie um zip de diagnóstico a partir do pacote persistido mais recente:

```bash
openclaw gateway stability --bundle latest --export
```

Pacotes persistidos ficam em `~/.openclaw/logs/stability/` quando existem eventos.

## Opções úteis

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: grava em um caminho de zip específico.
- `--log-lines <count>`: máximo de linhas de log sanitizadas a incluir.
- `--log-bytes <bytes>`: máximo de bytes de log a inspecionar.
- `--url <url>`: URL de WebSocket do Gateway para instantâneos de status e integridade.
- `--token <token>`: token do Gateway para instantâneos de status e integridade.
- `--password <password>`: senha do Gateway para instantâneos de status e integridade.
- `--timeout <ms>`: tempo limite de instantâneo de status e integridade.
- `--no-stability-bundle`: ignora a busca por pacote de estabilidade persistido.
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

Desabilitar diagnósticos reduz o detalhamento de relatórios de bug. Isso não afeta o registro normal
do Gateway.

Instantâneos críticos de pressão de memória ficam desativados por padrão. Para manter eventos de diagnóstico
e também capturar o instantâneo de estabilidade pré-OOM:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Use isso apenas em hosts que possam tolerar a varredura extra do sistema de arquivos e a gravação
do instantâneo durante pressão crítica de memória. Eventos normais de pressão de memória ainda
registram RSS, heap, limite e fatos de crescimento quando o instantâneo está desativado.

## Relacionados

- [Verificações de integridade](/pt-BR/gateway/health)
- [CLI do Gateway](/pt-BR/cli/gateway#gateway-diagnostics-export)
- [Protocolo do Gateway](/pt-BR/gateway/protocol#system-and-identity)
- [Logs](/pt-BR/logging)
- [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry) — fluxo separado para transmitir diagnósticos para um coletor
