---
read_when:
    - Preparando um relatório de bug ou solicitação de suporte
    - Depuração de falhas, reinicializações, pressão de memória ou cargas úteis excessivamente grandes do Gateway
    - Revisando quais dados de diagnóstico são registrados ou ocultados
summary: Criar pacotes de diagnóstico do Gateway compartilháveis para relatórios de bugs
title: Exportação de diagnósticos
x-i18n:
    generated_at: "2026-05-03T21:32:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6cf8e00fe8033e339b5c947ce3dd10fdee736048a358ad3a0c2ccb77e939f4b
    source_path: gateway/diagnostics.md
    workflow: 16
---

O OpenClaw pode criar um zip de diagnósticos local para relatórios de bugs. Ele combina
status, integridade, logs, formato de configuração e eventos recentes de estabilidade
sem payload do Gateway, com sanitização.

Trate pacotes de diagnósticos como segredos até revisá-los. Eles são
projetados para omitir ou redigir payloads e credenciais, mas ainda resumem
logs locais do Gateway e estado de runtime no nível do host.

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
Use isso quando o bug aconteceu em uma conversa real e você quiser um relatório
copiável e colável para suporte:

1. Envie `/diagnostics` na conversa em que você percebeu o problema. Adicione uma
   nota curta se ajudar, por exemplo `/diagnostics bad tool choice`.
2. O OpenClaw envia o preâmbulo de diagnósticos e pede uma aprovação explícita de exec.
   A aprovação executa `openclaw gateway diagnostics export --json`.
   Não aprove diagnósticos por meio de uma regra allow-all.
3. Após a aprovação, o OpenClaw responde com um relatório colável contendo o caminho
   do pacote local, resumo do manifesto, notas de privacidade e ids de sessão relevantes.

Em chats em grupo, um proprietário ainda pode executar `/diagnostics`, mas o OpenClaw não
publica os detalhes de diagnóstico de volta no chat compartilhado. Ele envia o preâmbulo,
prompts de aprovação, resultado da exportação do Gateway e detalhamento de sessão/thread do Codex
ao proprietário pela rota privada de aprovação. O grupo recebe apenas um aviso curto
de que o fluxo de diagnósticos foi enviado em particular. Se o OpenClaw não conseguir encontrar uma rota privada
para o proprietário, o comando falha de forma fechada e pede que o proprietário o execute a partir de uma DM.

Quando a sessão ativa do OpenClaw está usando o harness nativo do OpenAI Codex,
a mesma aprovação de exec também cobre um upload de feedback do OpenAI para as threads de runtime
do Codex que o OpenClaw conhece. Esse upload é separado do zip local do
Gateway e aparece apenas para sessões do harness do Codex. Antes da aprovação, o
prompt explica que aprovar diagnósticos também enviará feedback do Codex, mas ele
não lista ids de sessão ou thread do Codex. Após a aprovação, a resposta do chat lista
os canais, ids de sessão do OpenClaw, ids de thread do Codex e comandos locais de retomada
para as threads que foram enviadas aos servidores da OpenAI. Se você negar ou ignorar a
aprovação, o OpenClaw não executa a exportação, não envia feedback do Codex e
não imprime os ids do Codex.

Isso torna curto o loop comum de depuração do Codex: perceba o mau comportamento no
Telegram, Discord ou outro canal, execute `/diagnostics`, aprove uma vez, compartilhe
o relatório com o suporte e então execute localmente o comando `codex resume <thread-id>` impresso
se quiser inspecionar você mesmo a thread nativa do Codex. Consulte
[Harness do Codex](/pt-BR/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) para
esse fluxo de inspeção.

## O que a exportação contém

O zip inclui:

- `summary.md`: visão geral legível por humanos para suporte.
- `diagnostics.json`: resumo legível por máquina de configuração, logs, status, integridade
  e dados de estabilidade.
- `manifest.json`: metadados de exportação e lista de arquivos.
- Formato de configuração sanitizado e detalhes de configuração não secretos.
- Resumos de logs sanitizados e linhas recentes de log redigidas.
- Snapshots de status e integridade do Gateway por melhor esforço.
- `stability/latest.json`: pacote de estabilidade persistido mais recente, quando disponível.

A exportação é útil mesmo quando o Gateway não está íntegro. Se o Gateway não conseguir
responder a solicitações de status ou integridade, os logs locais, o formato de configuração e o pacote de
estabilidade mais recente ainda serão coletados quando disponíveis.

## Modelo de privacidade

Diagnósticos são projetados para serem compartilháveis. A exportação mantém dados operacionais
que ajudam na depuração, como:

- nomes de subsistemas, ids de Plugin, ids de provedores, ids de canais e modos configurados
- códigos de status, durações, contagens de bytes, estado de fila e leituras de memória
- metadados de log sanitizados e mensagens operacionais redigidas
- formato de configuração e configurações de recursos não secretas

A exportação omite ou redige:

- texto de chat, prompts, instruções, corpos de Webhook e saídas de ferramentas
- credenciais, chaves de API, tokens, cookies e valores secretos
- corpos brutos de solicitação ou resposta
- ids de conta, ids de mensagem, ids brutos de sessão, nomes de host e nomes de usuário locais

Quando uma mensagem de log parece texto de usuário, chat, prompt ou payload de ferramenta, a
exportação mantém apenas o fato de que uma mensagem foi omitida e a contagem de bytes.

## Gravador de estabilidade

O Gateway registra por padrão um fluxo de estabilidade limitado e sem payload quando
diagnósticos estão habilitados. Ele é para fatos operacionais, não para conteúdo.

O mesmo Heartbeat de diagnóstico registra amostras de vivacidade quando o Gateway continua
em execução, mas o loop de eventos do Node.js ou a CPU parece saturado. Esses eventos
`diagnostic.liveness.warning` incluem atraso do loop de eventos, utilização do loop de eventos,
proporção de núcleos de CPU e contagens de sessões ativas/em espera/enfileiradas. Amostras ociosas
permanecem na telemetria no nível `info`. Amostras de vivacidade se tornam avisos do Gateway
apenas quando há trabalho em espera ou enfileirado, ou quando trabalho ativo se sobrepõe a
atraso sustentado do loop de eventos. Picos transitórios de atraso máximo durante trabalho em segundo plano
saudável permanecem nos logs de debug. Eles não reiniciam o Gateway por
si só.

Inspecione o gravador ao vivo:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecione o pacote de estabilidade persistido mais recente após uma saída fatal, timeout de desligamento
ou falha de inicialização após reinício:

```bash
openclaw gateway stability --bundle latest
```

Crie um zip de diagnósticos a partir do pacote persistido mais recente:

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
- `--url <url>`: URL WebSocket do Gateway para snapshots de status e integridade.
- `--token <token>`: token do Gateway para snapshots de status e integridade.
- `--password <password>`: senha do Gateway para snapshots de status e integridade.
- `--timeout <ms>`: timeout de snapshot de status e integridade.
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

Desabilitar diagnósticos reduz os detalhes do relatório de bugs. Isso não afeta o logging
normal do Gateway.

## Relacionado

- [Verificações de integridade](/pt-BR/gateway/health)
- [CLI do Gateway](/pt-BR/cli/gateway#gateway-diagnostics-export)
- [Protocolo do Gateway](/pt-BR/gateway/protocol#system-and-identity)
- [Logging](/pt-BR/logging)
- [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry) — fluxo separado para transmitir diagnósticos a um coletor
