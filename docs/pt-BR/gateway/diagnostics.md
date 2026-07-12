---
read_when:
    - Preparando um relatório de bug ou uma solicitação de suporte
    - Depuração de falhas, reinicializações, pressão de memória ou cargas úteis grandes demais no Gateway
    - Revisando quais dados de diagnóstico são registrados ou ocultados
summary: Crie pacotes compartilháveis de diagnóstico do Gateway para relatórios de bugs
title: Exportação de diagnósticos
x-i18n:
    generated_at: "2026-07-12T15:14:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ee9014da15368971d8257f62707f013b579e607fa0d8413db51253612f0c0957
    source_path: gateway/diagnostics.md
    workflow: 16
---

O OpenClaw pode criar um arquivo `.zip` local de diagnóstico para relatórios de bugs: status
sanitizado do Gateway, integridade, logs, estrutura da configuração e eventos recentes de estabilidade sem payloads.

Trate os pacotes de diagnóstico como segredos até que sejam revisados. Payloads e credenciais
são ocultados por padrão, mas o pacote ainda resume os logs locais do Gateway e
o estado de execução no nível do host.

## Início rápido

```bash
openclaw gateway diagnostics export
```

Exibe o caminho do arquivo zip criado. Escolha um caminho de saída:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Para automação:

```bash
openclaw gateway diagnostics export --json
```

## Comando de chat

Os proprietários podem executar `/diagnostics [note]` em qualquer conversa para solicitar uma
exportação local do Gateway como um único relatório de suporte que pode ser copiado e colado:

1. Envie `/diagnostics`, opcionalmente com uma nota curta (`/diagnostics bad tool choice`).
2. O OpenClaw envia um preâmbulo e solicita uma aprovação explícita de execução, que executa
   `openclaw gateway diagnostics export --json`. Não aprove diagnósticos por meio
   de uma regra que permita tudo.
3. Após a aprovação, o OpenClaw responde com o caminho do pacote local, o resumo
   do manifesto, as observações de privacidade e os ids de sessão relevantes.

Em conversas em grupo, um proprietário ainda pode executar `/diagnostics`, mas o OpenClaw envia o
resultado da exportação, as solicitações de aprovação e o detalhamento da sessão/thread do Codex ao
proprietário em privado. O grupo vê apenas um breve aviso de que os diagnósticos foram enviados
em privado. Se não houver uma rota privada para o proprietário, o comando falhará de forma segura e solicitará
que o proprietário o execute em uma DM.

Quando a sessão ativa usa o harness nativo do OpenAI Codex, a mesma aprovação de execução
também abrange o envio de feedback à OpenAI para as threads do Codex que o OpenClaw
conhece. Esse envio é separado do arquivo zip local do Gateway e ocorre somente
em sessões do harness do Codex. A solicitação de aprovação informa que a aprovação
também envia feedback do Codex, sem listar os ids das sessões ou threads do Codex. Após
a aprovação, a resposta lista canais, ids de sessão do OpenClaw, ids de threads do Codex e
comandos locais de retomada para as threads enviadas à OpenAI. Negar ou
ignorar a aprovação ignora a exportação, o envio de feedback do Codex e a
lista de ids do Codex.

Isso torna o ciclo de depuração do Codex curto: observe um comportamento inadequado em um canal,
execute `/diagnostics`, aprove uma vez, compartilhe o relatório e, em seguida, execute localmente o comando
`codex resume <thread-id>` exibido se quiser inspecionar a thread
por conta própria. Consulte [Harness do Codex](/pt-BR/plugins/codex-harness#inspect-codex-threads-locally).

## O que a exportação contém

- `summary.md`: visão geral legível para a equipe de suporte.
- `diagnostics.json`: resumo legível por máquina da configuração, dos logs, do status, da integridade
  e dos dados de estabilidade.
- `manifest.json`: metadados da exportação e lista de arquivos.
- Estrutura sanitizada da configuração e detalhes não secretos da configuração.
- Resumos sanitizados dos logs e linhas recentes dos logs com dados sensíveis removidos.
- Instantâneos de melhor esforço do status e da integridade do Gateway.
- `stability/latest.json`: pacote de estabilidade persistido mais recente, quando disponível.

A exportação continua sendo útil quando o Gateway não está íntegro: se as solicitações
de status/integridade falharem, os logs locais, a estrutura da configuração e o pacote de estabilidade mais recente
ainda serão coletados quando disponíveis.

## Modelo de privacidade

Mantidos: nomes de subsistemas, ids de plugins, ids de provedores, ids de canais, modos
configurados, códigos de status, durações, contagens de bytes, estado da fila, leituras de memória,
metadados sanitizados de logs, mensagens operacionais com dados sensíveis removidos, estrutura da configuração e
configurações de recursos não secretas.

Omitidos ou com dados sensíveis removidos: texto de conversas, prompts, instruções, corpos de webhooks, saídas de
ferramentas, credenciais, chaves de API, tokens, cookies, valores secretos, corpos brutos de
solicitações/respostas, ids de contas, ids de mensagens, ids brutos de sessões,
nomes de hosts e nomes de usuários locais.

Quando uma mensagem de log se assemelha a texto de payload de usuário, conversa, prompt ou ferramenta, a
exportação mantém apenas a informação de que uma mensagem foi omitida, além de sua contagem de bytes.

## Gravador de estabilidade

O Gateway registra, por padrão, um fluxo de estabilidade limitado e sem payload quando
os diagnósticos estão habilitados. Ele captura fatos operacionais, não conteúdo.

O mesmo Heartbeat também coleta amostras de vivacidade quando o loop de eventos ou a CPU parece
saturado, emitindo eventos `diagnostic.liveness.warning` com atraso do loop de eventos,
utilização do loop de eventos, proporção de núcleos de CPU, contagens de sessões ativas/em espera/na fila,
a fase atual de inicialização/execução (quando conhecida), intervalos de fases recentes e
rótulos de trabalho limitados. Eles se tornam linhas de log de nível `warn` do Gateway somente quando
há trabalho em espera ou na fila, ou quando o trabalho ativo coincide com um atraso sustentado do loop de eventos;
caso contrário, são registrados no nível `debug`. As amostras de vivacidade em estado ocioso ainda são registradas
como eventos de diagnóstico, mas nunca são elevadas a um aviso por si sós.

As fases de inicialização emitem eventos `diagnostic.phase.completed` com tempos de relógio de parede e
de CPU. Os diagnósticos de execução incorporada paralisada definem `terminalProgressStale=true`
quando o último progresso da ponte parecia terminal (por exemplo, um item de resposta bruto
ou um evento de conclusão de resposta), mas o Gateway ainda considera a
execução incorporada ativa.

Inspecione o registrador em tempo real:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecione o pacote persistido mais recente após uma saída fatal, um tempo limite de desligamento ou
uma falha de inicialização após reinicialização:

```bash
openclaw gateway stability --bundle latest
```

Crie um arquivo zip de diagnóstico com o pacote persistido mais recente:

```bash
openclaw gateway stability --bundle latest --export
```

Os pacotes persistidos ficam em `~/.openclaw/logs/stability/` quando há eventos.

## Opções úteis

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

| Sinalizador             | Padrão                                                                        | Descrição                                                  |
| ----------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | Grava em um caminho de zip específico (ou diretório).      |
| `--log-lines <count>`   | `5000`                                                                        | Máximo de linhas de log sanitizadas a incluir.             |
| `--log-bytes <bytes>`   | `1000000`                                                                     | Máximo de bytes de log a inspecionar.                      |
| `--url <url>`           | -                                                                             | URL WebSocket do Gateway para snapshots de status/saúde.   |
| `--token <token>`       | -                                                                             | Token do Gateway para snapshots de status/saúde.           |
| `--password <password>` | -                                                                             | Senha do Gateway para snapshots de status/saúde.           |
| `--timeout <ms>`        | `3000`                                                                        | Tempo limite do snapshot de status/saúde.                  |
| `--no-stability-bundle` | desativado                                                                    | Ignora a busca por pacotes de estabilidade persistidos.    |
| `--json`                | desativado                                                                    | Exibe metadados de exportação legíveis por máquina.        |

## Desabilitar diagnósticos

Os diagnósticos são habilitados por padrão. Para desabilitar o registrador de estabilidade e
a coleta de eventos de diagnóstico:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Desabilitar os diagnósticos reduz os detalhes dos relatórios de bugs; isso não afeta o registro
normal do Gateway.

Os snapshots de pressão crítica de memória ficam desativados por padrão. Para capturar o
snapshot de estabilidade anterior ao OOM além dos eventos normais de diagnóstico:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Use isso somente em hosts que possam tolerar a varredura adicional do sistema de arquivos e
a gravação do snapshot durante uma pressão crítica de memória. Os eventos normais de pressão de memória
ainda registram RSS, heap, limite e dados de crescimento (`rss_threshold`,
`heap_threshold`, `rss_growth`) quando o snapshot está desativado.

## Relacionados

- [Verificações de integridade](/pt-BR/gateway/health)
- [CLI do Gateway](/pt-BR/cli/gateway#gateway-diagnostics-export)
- [Protocolo do Gateway](/pt-BR/gateway/protocol#rpc-method-families)
- [Registro em log](/pt-BR/logging)
- [Exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry) - fluxo separado para transmitir diagnósticos a um coletor
