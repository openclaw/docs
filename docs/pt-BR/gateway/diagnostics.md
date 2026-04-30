---
read_when:
    - Preparando um relatório de erro ou uma solicitação de suporte
    - Depuração de falhas do Gateway, reinicializações, pressão de memória ou cargas úteis superdimensionadas
    - Revisando quais dados de diagnóstico são registrados ou mascarados
summary: Criar pacotes de diagnóstico do Gateway compartilháveis para relatórios de bugs
title: Exportação de diagnósticos
x-i18n:
    generated_at: "2026-04-30T09:48:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: e66f1391da77e531b5d3b0ed19600da222d80960d1b6e54d51925c04b06dae46
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw pode criar um zip de diagnóstico local para relatórios de bugs. Ele combina
status, integridade, logs, formato de configuração e eventos recentes de
estabilidade sem payload do Gateway, todos sanitizados.

Trate pacotes de diagnóstico como segredos até revisá-los. Eles são
projetados para omitir ou redigir payloads e credenciais, mas ainda resumem
logs locais do Gateway e o estado de runtime no nível do host.

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

Os proprietários podem usar `/diagnostics [note]` no chat para solicitar uma exportação local do Gateway.
Use isto quando o bug aconteceu em uma conversa real e você quer um relatório
copiável para o suporte:

1. Envie `/diagnostics` na conversa em que você percebeu o problema. Adicione uma
   nota curta se ajudar, por exemplo `/diagnostics bad tool choice`.
2. O OpenClaw envia o preâmbulo de diagnóstico e pede uma aprovação explícita de exec.
   A aprovação executa `openclaw gateway diagnostics export --json`.
   Não aprove diagnósticos por meio de uma regra permitir tudo.
3. Após a aprovação, o OpenClaw responde com um relatório colável contendo o caminho
   do pacote local, o resumo do manifesto, notas de privacidade e IDs de sessão relevantes.

Em chats em grupo, um proprietário ainda pode executar `/diagnostics`, mas o OpenClaw não
publica os detalhes de diagnóstico de volta no chat compartilhado. Ele envia o preâmbulo,
prompts de aprovação, resultado da exportação do Gateway e detalhamento de sessão/thread do Codex
ao proprietário pela rota privada de aprovação. O grupo recebe apenas um aviso curto
de que o fluxo de diagnóstico foi enviado em particular. Se o OpenClaw não encontrar uma rota
privada para o proprietário, o comando falha de forma fechada e pede que o proprietário o execute por DM.

Quando a sessão ativa do OpenClaw está usando o harness nativo do OpenAI Codex,
a mesma aprovação de exec também cobre um upload de feedback do OpenAI para as threads de runtime do Codex
que o OpenClaw conhece. Esse upload é separado do zip local do Gateway
e aparece apenas para sessões do harness do Codex. Antes da aprovação, o
prompt explica que aprovar diagnósticos também enviará feedback do Codex, mas
não lista IDs de sessão ou thread do Codex. Após a aprovação, a resposta no chat lista
os canais, IDs de sessão do OpenClaw, IDs de thread do Codex e comandos locais de retomada
para as threads que foram enviadas aos servidores da OpenAI. Se você negar ou ignorar a
aprovação, o OpenClaw não executa a exportação, não envia feedback do Codex e
não imprime os IDs do Codex.

Isso torna curto o loop comum de depuração do Codex: perceba o comportamento incorreto no
Telegram, Discord ou outro canal, execute `/diagnostics`, aprove uma vez, compartilhe
o relatório com o suporte e então execute localmente o comando `codex resume <thread-id>` impresso
se quiser inspecionar você mesmo a thread nativa do Codex. Consulte
[harness do Codex](/pt-BR/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) para
esse fluxo de inspeção.

## O que a exportação contém

O zip inclui:

- `summary.md`: visão geral legível por humanos para o suporte.
- `diagnostics.json`: resumo legível por máquina de configuração, logs, status, integridade
  e dados de estabilidade.
- `manifest.json`: metadados de exportação e lista de arquivos.
- Formato de configuração sanitizado e detalhes de configuração não secretos.
- Resumos de logs sanitizados e linhas recentes de log redigidas.
- Snapshots de status e integridade do Gateway em melhor esforço.
- `stability/latest.json`: pacote de estabilidade persistido mais recente, quando disponível.

A exportação é útil mesmo quando o Gateway não está saudável. Se o Gateway não puder
responder a solicitações de status ou integridade, os logs locais, o formato da configuração e o
pacote de estabilidade mais recente ainda serão coletados quando disponíveis.

## Modelo de privacidade

Os diagnósticos são projetados para serem compartilháveis. A exportação mantém dados operacionais
que ajudam na depuração, como:

- nomes de subsistemas, IDs de Plugin, IDs de provedor, IDs de canal e modos configurados
- códigos de status, durações, contagens de bytes, estado de fila e leituras de memória
- metadados de log sanitizados e mensagens operacionais redigidas
- formato de configuração e configurações de recursos não secretas

A exportação omite ou redige:

- texto de chat, prompts, instruções, corpos de Webhook e saídas de ferramentas
- credenciais, chaves de API, tokens, cookies e valores secretos
- corpos brutos de solicitação ou resposta
- IDs de conta, IDs de mensagem, IDs brutos de sessão, nomes de host e nomes de usuário locais

Quando uma mensagem de log parece texto de payload de usuário, chat, prompt ou ferramenta, a
exportação mantém apenas que uma mensagem foi omitida e a contagem de bytes.

## Gravador de estabilidade

O Gateway registra por padrão um fluxo limitado de estabilidade sem payload quando
os diagnósticos estão ativados. Ele é para fatos operacionais, não conteúdo.

O mesmo Heartbeat de diagnóstico registra avisos de vivacidade quando o Gateway continua
em execução, mas o loop de eventos do Node.js ou a CPU parece saturado. Esses eventos
`diagnostic.liveness.warning` incluem atraso do loop de eventos, utilização do loop de eventos,
proporção de núcleos de CPU e contagens de sessões ativas/em espera/enfileiradas. Eles
não reiniciam o Gateway por conta própria.

Inspecione o gravador ativo:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecione o pacote de estabilidade persistido mais recente após uma saída fatal, timeout
de desligamento ou falha de inicialização por reinício:

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

- `--output <path>`: gravar em um caminho de zip específico.
- `--log-lines <count>`: máximo de linhas de log sanitizadas a incluir.
- `--log-bytes <bytes>`: máximo de bytes de log a inspecionar.
- `--url <url>`: URL WebSocket do Gateway para snapshots de status e integridade.
- `--token <token>`: token do Gateway para snapshots de status e integridade.
- `--password <password>`: senha do Gateway para snapshots de status e integridade.
- `--timeout <ms>`: timeout de snapshot de status e integridade.
- `--no-stability-bundle`: pular a busca por pacote de estabilidade persistido.
- `--json`: imprimir metadados de exportação legíveis por máquina.

## Desativar diagnósticos

Diagnósticos ficam ativados por padrão. Para desativar o gravador de estabilidade e
a coleta de eventos de diagnóstico:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Desativar diagnósticos reduz os detalhes do relatório de bug. Isso não afeta o
logging normal do Gateway.

## Relacionados

- [Verificações de integridade](/pt-BR/gateway/health)
- [CLI do Gateway](/pt-BR/cli/gateway#gateway-diagnostics-export)
- [Protocolo do Gateway](/pt-BR/gateway/protocol#system-and-identity)
- [Logging](/pt-BR/logging)
- [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry) — fluxo separado para transmitir diagnósticos a um coletor
