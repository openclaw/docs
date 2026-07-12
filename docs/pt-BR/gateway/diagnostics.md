---
read_when:
    - Preparando um relatório de bug ou uma solicitação de suporte
    - Depuração de falhas, reinicializações, pressão de memória ou cargas úteis grandes demais no Gateway
    - Revisar quais dados de diagnóstico são registrados ou ocultados
summary: Crie pacotes compartilháveis de diagnóstico do Gateway para relatórios de bugs
title: Exportação de diagnósticos
x-i18n:
    generated_at: "2026-07-11T23:56:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee9014da15368971d8257f62707f013b579e607fa0d8413db51253612f0c0957
    source_path: gateway/diagnostics.md
    workflow: 16
---

O OpenClaw pode criar um arquivo `.zip` local de diagnóstico para relatórios de bugs: status, integridade e logs sanitizados do Gateway, estrutura da configuração e eventos recentes de estabilidade sem payloads.

Trate os pacotes de diagnóstico como segredos até que sejam revisados. Payloads e credenciais são ocultados por padrão, mas o pacote ainda resume os logs locais do Gateway e o estado de execução no nível do host.

## Início rápido

```bash
openclaw gateway diagnostics export
```

Exibe o caminho do arquivo zip gravado. Escolha um caminho de saída:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Para automação:

```bash
openclaw gateway diagnostics export --json
```

## Comando de chat

Os proprietários podem executar `/diagnostics [note]` em qualquer conversa para solicitar uma exportação local do Gateway como um único relatório de suporte que possa ser copiado e colado:

1. Envie `/diagnostics`, opcionalmente com uma nota curta (`/diagnostics escolha ruim de ferramenta`).
2. O OpenClaw envia um preâmbulo e solicita uma aprovação explícita de execução, que executa
   `openclaw gateway diagnostics export --json`. Não aprove diagnósticos por meio
   de uma regra que permita tudo.
3. Após a aprovação, o OpenClaw responde com o caminho local do pacote, o resumo
   do manifesto, notas de privacidade e IDs de sessão relevantes.

Em chats em grupo, um proprietário ainda pode executar `/diagnostics`, mas o OpenClaw envia o resultado da exportação, as solicitações de aprovação e a divisão das sessões/threads do Codex ao proprietário em particular. O grupo vê apenas um breve aviso de que os diagnósticos foram enviados em particular. Se não houver uma rota privada para o proprietário, o comando falhará de forma segura e solicitará que o proprietário o execute em uma mensagem direta.

Quando a sessão ativa usa o ambiente nativo do OpenAI Codex, a mesma aprovação de execução também abrange o envio de feedback à OpenAI para as threads do Codex conhecidas pelo OpenClaw. Esse envio é separado do arquivo zip local do Gateway e ocorre somente em sessões do ambiente do Codex. A solicitação de aprovação informa que a aprovação também envia feedback do Codex, sem listar IDs de sessão ou de thread do Codex. Após a aprovação, a resposta lista canais, IDs de sessão do OpenClaw, IDs de thread do Codex e comandos locais de retomada para as threads enviadas à OpenAI. Recusar ou ignorar a aprovação ignora a exportação, o envio de feedback do Codex e a lista de IDs do Codex.

Isso torna o ciclo de depuração do Codex curto: observe um comportamento inadequado em um canal, execute `/diagnostics`, aprove uma vez, compartilhe o relatório e execute localmente o comando
`codex resume <thread-id>` exibido caso queira inspecionar a thread por conta própria. Consulte [ambiente do Codex](/pt-BR/plugins/codex-harness#inspect-codex-threads-locally).

## O que a exportação contém

- `summary.md`: visão geral legível para suporte.
- `diagnostics.json`: resumo legível por máquina da configuração, dos logs, do status, da integridade e dos dados de estabilidade.
- `manifest.json`: metadados da exportação e lista de arquivos.
- Estrutura sanitizada da configuração e detalhes de configuração não secretos.
- Resumos sanitizados dos logs e linhas recentes de log com dados ocultados.
- Instantâneos de melhor esforço do status e da integridade do Gateway.
- `stability/latest.json`: pacote de estabilidade persistido mais recente, quando disponível.

A exportação ainda é útil quando o Gateway não está íntegro: se as solicitações de status/integridade falharem, os logs locais, a estrutura da configuração e o pacote de estabilidade mais recente ainda serão coletados quando disponíveis.

## Modelo de privacidade

Mantidos: nomes de subsistemas, IDs de plugins, IDs de provedores, IDs de canais, modos configurados, códigos de status, durações, contagens de bytes, estado da fila, leituras de memória, metadados sanitizados de logs, mensagens operacionais com dados ocultados, estrutura da configuração e configurações de recursos não secretas.

Omitidos ou ocultados: texto de chats, prompts, instruções, corpos de webhooks, saídas de ferramentas, credenciais, chaves de API, tokens, cookies, valores secretos, corpos brutos de solicitações/respostas, IDs de contas, IDs de mensagens, IDs brutos de sessões, nomes de hosts e nomes de usuários locais.

Quando uma mensagem de log parece conter texto de payload de usuário, chat, prompt ou ferramenta, a exportação mantém apenas a informação de que uma mensagem foi omitida e sua contagem de bytes.

## Gravador de estabilidade

Por padrão, o Gateway registra um fluxo de estabilidade limitado e sem payloads quando os diagnósticos estão habilitados. Ele captura fatos operacionais, não conteúdo.

O mesmo Heartbeat também coleta amostras de atividade quando o loop de eventos ou a CPU parece saturado, emitindo eventos `diagnostic.liveness.warning` com atraso do loop de eventos, utilização do loop de eventos, proporção de núcleos da CPU, contagens de sessões ativas/em espera/enfileiradas, a fase atual de inicialização/execução (quando conhecida), intervalos de fases recentes e rótulos de trabalho limitados. Eles se tornam linhas de log de nível `warn` do Gateway somente quando há trabalho em espera ou enfileirado, ou quando o trabalho ativo coincide com um atraso prolongado do loop de eventos; caso contrário, são registrados no nível `debug`. Amostras de atividade ociosa ainda são registradas como eventos de diagnóstico, mas nunca são elevadas a um aviso por conta própria.

As fases de inicialização emitem eventos `diagnostic.phase.completed` com tempos de relógio e CPU. Diagnósticos de execuções incorporadas paralisadas definem `terminalProgressStale=true` quando o último progresso da ponte parecia terminal (por exemplo, um item de resposta bruta ou um evento de conclusão da resposta), mas o Gateway ainda considera a execução incorporada ativa.

Inspecione o gravador em atividade:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecione o pacote persistido mais recente após uma saída fatal, um tempo limite de desligamento ou uma falha de inicialização após reinício:

```bash
openclaw gateway stability --bundle latest
```

Crie um arquivo zip de diagnóstico a partir do pacote persistido mais recente:

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

| Opção                   | Padrão                                                                        | Descrição                                                        |
| ----------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | Grava em um caminho específico de arquivo zip (ou diretório).    |
| `--log-lines <count>`   | `5000`                                                                        | Número máximo de linhas de log sanitizadas a incluir.            |
| `--log-bytes <bytes>`   | `1000000`                                                                     | Número máximo de bytes de log a inspecionar.                     |
| `--url <url>`           | -                                                                             | URL WebSocket do Gateway para instantâneos de status/integridade. |
| `--token <token>`       | -                                                                             | Token do Gateway para instantâneos de status/integridade.        |
| `--password <password>` | -                                                                             | Senha do Gateway para instantâneos de status/integridade.        |
| `--timeout <ms>`        | `3000`                                                                        | Tempo limite do instantâneo de status/integridade.               |
| `--no-stability-bundle` | desativado                                                                    | Ignora a busca pelo pacote de estabilidade persistido.           |
| `--json`                | desativado                                                                    | Exibe metadados da exportação legíveis por máquina.               |

## Desabilitar diagnósticos

Os diagnósticos são habilitados por padrão. Para desabilitar o gravador de estabilidade e a coleta de eventos de diagnóstico:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Desabilitar os diagnósticos reduz os detalhes dos relatórios de bugs; isso não afeta o registro normal do Gateway.

Os instantâneos de pressão crítica de memória são desativados por padrão. Para capturar o instantâneo de estabilidade anterior à falta de memória, além dos eventos normais de diagnóstico:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Use isso somente em hosts capazes de tolerar a verificação adicional do sistema de arquivos e a gravação do instantâneo durante uma pressão crítica de memória. Os eventos normais de pressão de memória ainda registram RSS, heap, limite e dados de crescimento (`rss_threshold`, `heap_threshold`, `rss_growth`) quando o instantâneo está desativado.

## Relacionados

- [Verificações de integridade](/pt-BR/gateway/health)
- [CLI do Gateway](/pt-BR/cli/gateway#gateway-diagnostics-export)
- [Protocolo do Gateway](/pt-BR/gateway/protocol#rpc-method-families)
- [Registro de logs](/pt-BR/logging)
- [Exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry) - fluxo separado para transmitir diagnósticos a um coletor
