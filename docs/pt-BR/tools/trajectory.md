---
read_when:
    - Depuração do motivo pelo qual um agente respondeu, falhou ou chamou ferramentas de determinada maneira
    - Exportando um pacote de suporte para uma sessão do OpenClaw
    - Investigando o contexto do prompt, as chamadas de ferramentas, os erros de runtime ou os metadados de uso
    - Desativação da captura de trajetória
summary: Exporte pacotes de trajetória com dados confidenciais removidos para depurar uma sessão do agente OpenClaw
title: Pacotes de trajetórias
x-i18n:
    generated_at: "2026-07-12T15:51:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7fc494732b6239ad4ea58dca3920a47cb7433c680e7566855dd265c986b55e74
    source_path: tools/trajectory.md
    workflow: 16
---

A captura de trajetória é o gravador de voo por sessão do OpenClaw. Ela registra uma
linha do tempo estruturada para cada execução do agente; em seguida, `/export-trajectory` empacota a
sessão atual em um pacote de suporte com dados sensíveis ocultados, abrangendo:

- O prompt, o prompt do sistema e as ferramentas enviados ao modelo
- Quais mensagens da transcrição e chamadas de ferramentas levaram a uma resposta
- Se a execução atingiu o tempo limite, foi interrompida, sofreu Compaction ou encontrou um erro do provedor
- Quais modelo, plugins, Skills e configurações de runtime estavam ativos
- Metadados de uso e de cache de prompts retornados pelo provedor

Para obter um relatório de suporte abrangente do Gateway, comece com
[`/diagnostics`](/pt-BR/gateway/diagnostics#chat-command); ele coleta o pacote
sanitizado do Gateway e, para sessões do ambiente OpenAI Codex, pode enviar feedback do Codex
à OpenAI após aprovação. Use `/export-trajectory` quando precisar da
linha do tempo detalhada de prompts, ferramentas e transcrição por sessão.

## Início rápido

Envie na sessão ativa (alias `/trajectory`):

```text
/export-trajectory
```

O OpenClaw grava o pacote no workspace:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Passe um nome de diretório de saída relativo para substituí-lo:

```text
/export-trajectory bug-1234
```

O nome é resolvido dentro de `.openclaw/trajectory-exports/`. Caminhos absolutos e
caminhos com `~` são rejeitados.

Os pacotes de trajetória podem conter prompts, mensagens do modelo, esquemas de ferramentas, resultados de
ferramentas, eventos de runtime e caminhos locais; portanto, o comando de chat sempre passa
pela aprovação de execução. Aprove a exportação uma vez quando pretender criar o
pacote; não use a opção de permitir tudo. Em chats em grupo, o OpenClaw envia a solicitação de
aprovação e o resultado da exportação em particular ao proprietário, em vez de publicar detalhes da
trajetória na sala compartilhada.

Para inspeção local ou fluxos de trabalho de suporte, execute diretamente o comando da CLI
subjacente:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

Outras flags: `--output <path>` (nome do diretório dentro de
`.openclaw/trajectory-exports`), `--store <path>` (substituição do armazenamento de sessões),
`--agent <id>` (ID do agente para resolução do armazenamento), `--json` (saída estruturada).

## Acesso

A exportação de trajetória é um comando do proprietário. O remetente deve passar pelas verificações normais de
autorização de comandos, além da verificação de proprietário do canal.

## O que é registrado

A captura de trajetória fica ativada por padrão para execuções de agentes do OpenClaw.

Os eventos de runtime incluem:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, incluindo o modelo de origem, o próximo modelo, o motivo/detalhe da falha, a posição na cadeia e se a cadeia avançou, foi bem-sucedida ou se esgotou
- `model.completed`
- `trace.artifacts`
- `session.ended`

Os eventos da transcrição são reconstruídos a partir da ramificação ativa da sessão: mensagens do
usuário, mensagens do assistente, chamadas de ferramentas, resultados de ferramentas, compactions, alterações de
modelo, rótulos e entradas personalizadas da sessão.

Os eventos são gravados como JSON Lines com este marcador de esquema:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Arquivos do pacote

| Arquivo               | Conteúdo                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `manifest.json`       | Esquema do pacote, arquivos de origem, contagens de eventos e lista de arquivos gerados           |
| `events.jsonl`        | Linha do tempo ordenada de runtime e transcrição                                                  |
| `session-branch.json` | Ramificação ativa da transcrição com dados sensíveis ocultados e cabeçalho da sessão              |
| `metadata.json`       | Versão do OpenClaw, SO/runtime, modelo, instantâneo da configuração, plugins, Skills e metadados de prompts |
| `artifacts.json`      | Status final, erros, uso, cache de prompts, contagem de compactions, texto do assistente e metadados de ferramentas |
| `prompts.json`        | Prompts enviados e detalhes selecionados da criação de prompts                                    |
| `system-prompt.txt`   | Prompt do sistema compilado mais recente, quando capturado                                        |
| `tools.json`          | Definições de ferramentas enviadas ao modelo, quando capturadas                                   |

`manifest.json` lista os arquivos presentes em um determinado pacote; alguns arquivos são
omitidos quando a sessão não capturou os dados de runtime correspondentes.

## Armazenamento da captura

Os eventos de trajetória do runtime são armazenados com a sessão no banco de dados SQLite
por agente. A exportação de uma trajetória materializa um pacote de suporte JSONL com dados sensíveis ocultados;
a captura ativa do runtime não é um arquivo auxiliar JSONL adjacente à sessão.

Arquivos legados `.trajectory.jsonl` e `.trajectory-path.json` ainda podem aparecer
de versões mais antigas ou de exportações explícitas em formato de arquivo legado. A manutenção da sessão trata
esses arquivos como alvos de limpeza; a captura ativa grava linhas no banco de dados.

## Desativar a captura

```bash
export OPENCLAW_TRAJECTORY=0
```

Isso desativa a captura de trajetória do runtime antes de iniciar o OpenClaw.
`/export-trajectory` ainda pode exportar a ramificação da transcrição, mas dados exclusivos do runtime,
como contexto compilado, artefatos do provedor e metadados de prompts, podem estar
ausentes.

## Ajustar o tempo limite de liberação

O OpenClaw libera as linhas de trajetória do runtime durante a limpeza do agente. O tempo limite padrão
de limpeza é 10,000 ms. Em discos lentos ou armazenamentos grandes, defina
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` antes de iniciar o OpenClaw:

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

Isso controla quando o OpenClaw registra um tempo limite `openclaw-trajectory-flush` e
continua; não altera os limites de tamanho da trajetória. Para ajustar todas as etapas de
limpeza do agente que não fornecem um tempo limite explícito, defina
`OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`.

## Privacidade e limites

Os pacotes de trajetória destinam-se a suporte e depuração, não à publicação pública. O OpenClaw
oculta valores sensíveis antes de gravar os arquivos de exportação:

- credenciais e campos conhecidos de payload semelhantes a segredos
- dados de imagens
- caminhos de estado local
- caminhos do workspace, substituídos por `$WORKSPACE_DIR`
- caminhos do diretório pessoal, quando detectados

O exportador também limita o tamanho da entrada:

- captura de runtime: a captura ativa é uma janela contínua limitada a 10 MiB, descartando os eventos mais antigos para liberar espaço para os novos; a exportação aceita arquivos auxiliares legados existentes de runtime com até 50 MiB
- arquivos de sessão: 50 MiB
- eventos de runtime por exportação: 200,000
- total de eventos exportados: 250,000
- linhas individuais de eventos de runtime são truncadas acima de 256 KiB

Revise os pacotes antes de compartilhá-los fora da sua equipe. A ocultação é feita com o melhor esforço
e não consegue identificar todos os segredos específicos de cada aplicação.

## Solução de problemas

Se a exportação não tiver eventos de runtime:

- confirme que o OpenClaw foi iniciado sem `OPENCLAW_TRAJECTORY=0`
- execute outra mensagem na sessão e exporte novamente
- inspecione `manifest.json` para verificar `runtimeEventCount`

Se o comando rejeitar o caminho de saída:

- use um nome relativo como `bug-1234`
- não forneça `/tmp/...` nem `~/...`
- mantenha a exportação dentro de `.openclaw/trajectory-exports/`

Se a exportação falhar com um erro de tamanho, a sessão ou o arquivo auxiliar excedeu os
limites de segurança de exportação acima. Inicie uma nova sessão ou exporte uma
reprodução menor.

## Relacionados

- [Diffs](/pt-BR/tools/diffs)
- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Ferramenta de execução](/pt-BR/tools/exec)
