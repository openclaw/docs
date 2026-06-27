---
read_when:
    - Depurando por que um agente respondeu, falhou ou chamou ferramentas de determinada forma
    - Exportando um pacote de suporte para uma sessão do OpenClaw
    - Investigando contexto de prompt, chamadas de ferramenta, erros de runtime ou metadados de uso
    - Desativar ou realocar a captura de trajetória
summary: Exporte pacotes de trajetória editados para depurar uma sessão de agente do OpenClaw
title: Pacotes de trajetória
x-i18n:
    generated_at: "2026-06-27T18:19:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf48616c29a1055f26d39a88869c025db7e6261b13dcaa0cd35be438c6a86a88
    source_path: tools/trajectory.md
    workflow: 16
---

A captura de trajetória é o gravador de voo por sessão do OpenClaw. Ela registra uma
linha do tempo estruturada para cada execução de agente; depois, `/export-trajectory` empacota a
sessão atual em um pacote de suporte com redação.

Use-a quando precisar responder a perguntas como:

- Qual prompt, prompt de sistema e ferramentas foram enviados ao modelo?
- Quais mensagens de transcrição e chamadas de ferramentas levaram a esta resposta?
- A execução atingiu tempo limite, foi abortada, passou por compactação ou encontrou um erro de provedor?
- Quais modelo, plugins, skills e configurações de runtime estavam ativos?
- Quais metadados de uso e cache de prompt o provedor retornou?

Se você estiver abrindo um relatório de suporte amplo para um problema ativo do Gateway, comece com
[`/diagnostics`](/pt-BR/gateway/diagnostics#chat-command). O Diagnostics coleta o
pacote sanitizado do Gateway e, para sessões do harness OpenAI Codex, também pode enviar
feedback do Codex aos servidores da OpenAI após aprovação. Use `/export-trajectory` quando
você precisar especificamente da linha do tempo detalhada por sessão de prompt, ferramenta e
transcrição.

## Início rápido

Envie isto na sessão ativa:

```text
/export-trajectory
```

Alias:

```text
/trajectory
```

O OpenClaw grava o pacote dentro do workspace:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Você pode escolher um nome de diretório de saída relativo:

```text
/export-trajectory bug-1234
```

O caminho personalizado é resolvido dentro de `.openclaw/trajectory-exports/`. Caminhos
absolutos e caminhos com `~` são rejeitados.

Pacotes de trajetória podem conter prompts, mensagens de modelo, esquemas de ferramentas, resultados de
ferramentas, eventos de runtime e caminhos locais. Portanto, o comando slash do chat passa por
aprovação de exec todas as vezes. Aprove a exportação uma vez quando você pretende
criar o pacote; não use permitir tudo. Em chats em grupo, o OpenClaw envia o
prompt de aprovação e o resultado da exportação ao proprietário em privado, em vez de publicar os
detalhes da trajetória de volta na sala compartilhada.

Para inspeção local ou workflows de suporte, você também pode executar diretamente o caminho
do comando aprovado:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Acesso

A exportação de trajetória é um comando de proprietário. O remetente deve passar pelas verificações normais de
autorização de comando e pelas verificações de proprietário do canal.

## O que é registrado

A captura de trajetória fica ativada por padrão para execuções de agentes do OpenClaw.

Eventos de runtime incluem:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, incluindo o modelo de origem, o próximo modelo, o motivo/detalhe da falha, a posição na cadeia e se o fallback avançou, teve sucesso ou esgotou a cadeia
- `model.completed`
- `trace.artifacts`
- `session.ended`

Eventos de transcrição também são reconstruídos a partir do branch ativo da sessão:

- mensagens de usuário
- mensagens do assistente
- chamadas de ferramentas
- resultados de ferramentas
- compactions
- mudanças de modelo
- rótulos e entradas personalizadas da sessão

Eventos são gravados como JSON Lines com este marcador de esquema:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Arquivos do pacote

Um pacote exportado pode conter:

| Arquivo               | Conteúdo                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Esquema do pacote, arquivos de origem, contagens de eventos e lista de arquivos gerada         |
| `events.jsonl`        | Linha do tempo ordenada de runtime e transcrição                                                |
| `session-branch.json` | Branch de transcrição ativa com redação e cabeçalho da sessão                                  |
| `metadata.json`       | Versão do OpenClaw, SO/runtime, modelo, snapshot de configuração, plugins, skills e metadados de prompt |
| `artifacts.json`      | Status final, erros, uso, cache de prompt, contagem de compactações, texto do assistente e metadados de ferramentas |
| `prompts.json`        | Prompts enviados e detalhes selecionados da construção de prompts                              |
| `system-prompt.txt`   | Prompt de sistema compilado mais recente, quando capturado                                     |
| `tools.json`          | Definições de ferramentas enviadas ao modelo, quando capturadas                                |

`manifest.json` lista os arquivos presentes nesse pacote. Alguns arquivos são omitidos
quando a sessão não capturou os dados de runtime correspondentes.

## Local de captura

Por padrão, os eventos de trajetória de runtime são gravados ao lado do arquivo de sessão:

```text
<session>.trajectory.jsonl
```

O OpenClaw também grava um arquivo de ponteiro de melhor esforço ao lado da sessão:

```text
<session>.trajectory-path.json
```

Defina `OPENCLAW_TRAJECTORY_DIR` para armazenar sidecars de trajetória de runtime em um
diretório dedicado:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Quando essa variável é definida, o OpenClaw grava um arquivo JSONL por ID de sessão nesse
diretório.

A manutenção de sessões remove sidecars de trajetória quando a entrada da sessão proprietária
é podada, limitada ou despejada pelo orçamento de disco das sessões. Arquivos de runtime fora
do diretório de sessões são removidos somente quando o destino do ponteiro ainda prova que ele
pertence a essa sessão.

## Desativar captura

Defina `OPENCLAW_TRAJECTORY=0` antes de iniciar o OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

Isso desativa a captura de trajetória de runtime. `/export-trajectory` ainda pode exportar
o branch de transcrição, mas arquivos apenas de runtime, como contexto compilado,
artefatos do provedor e metadados de prompt, podem estar ausentes.

## Ajustar tempo limite de flush

O OpenClaw faz flush dos sidecars de trajetória de runtime durante a limpeza do agente. O tempo limite
padrão de limpeza é 10.000 ms. Em discos lentos ou stores grandes, defina
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` antes de iniciar o OpenClaw:

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

Isso controla quando o OpenClaw registra um tempo limite `openclaw-trajectory-flush` e continua.
Isso não altera os limites de tamanho da trajetória. Para ajustar todas as etapas de limpeza de agente
que não passam um tempo limite explícito, defina `OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`.

## Privacidade e limites

Pacotes de trajetória são projetados para suporte e depuração, não para publicação pública.
O OpenClaw remove valores sensíveis antes de gravar arquivos de exportação:

- credenciais e campos de payload conhecidos com aparência de segredo
- dados de imagem
- caminhos de estado local
- caminhos do workspace, substituídos por `$WORKSPACE_DIR`
- caminhos do diretório home, quando detectados

O exportador também limita o tamanho da entrada:

- arquivos sidecar de runtime: a captura ativa para em 10 MiB e registra um evento de truncamento quando resta espaço; a exportação aceita sidecars de runtime existentes até 50 MiB
- arquivos de sessão: 50 MiB
- eventos de runtime: 200.000
- total de eventos exportados: 250.000
- linhas individuais de eventos de runtime são truncadas acima de 256 KiB

Revise os pacotes antes de compartilhá-los fora da sua equipe. A redação é de melhor esforço
e não pode conhecer todos os segredos específicos de cada aplicação.

## Solução de problemas

Se a exportação não tiver eventos de runtime:

- confirme que o OpenClaw foi iniciado sem `OPENCLAW_TRAJECTORY=0`
- verifique se `OPENCLAW_TRAJECTORY_DIR` aponta para um diretório gravável
- execute outra mensagem na sessão e exporte novamente
- inspecione `manifest.json` para `runtimeEventCount`

Se o comando rejeitar o caminho de saída:

- use um nome relativo como `bug-1234`
- não passe `/tmp/...` nem `~/...`
- mantenha a exportação dentro de `.openclaw/trajectory-exports/`

Se a exportação falhar com um erro de tamanho, a sessão ou o sidecar excedeu os
limites de segurança de exportação. Inicie uma nova sessão ou exporte uma reprodução menor.

## Relacionado

- [Diffs](/pt-BR/tools/diffs)
- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Ferramenta exec](/pt-BR/tools/exec)
