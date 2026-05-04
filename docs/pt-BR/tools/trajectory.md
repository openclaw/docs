---
read_when:
    - Depuração do motivo pelo qual um agente respondeu, falhou ou invocou ferramentas de determinada forma
    - Exportando um pacote de suporte para uma sessão do OpenClaw
    - Investigando o contexto do prompt, chamadas de ferramenta, erros de tempo de execução ou metadados de uso
    - Desabilitando ou realocando a captura de trajetória
summary: Exporte pacotes de trajetória com dados sensíveis removidos para depurar uma sessão de agente do OpenClaw
title: Pacotes de trajetórias
x-i18n:
    generated_at: "2026-05-04T09:37:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8b1256e52d27185a48ceddaf7937b4f37ad6d57d075fea0d0b6d3abb871f1d8
    source_path: tools/trajectory.md
    workflow: 16
---

A captura de trajetória é o gravador de voo por sessão do OpenClaw. Ela registra uma
linha do tempo estruturada para cada execução de agente; depois, `/export-trajectory` empacota a
sessão atual em um pacote de suporte com informações sensíveis ocultadas.

Use-a quando precisar responder a perguntas como:

- Qual prompt, prompt do sistema e ferramentas foram enviados ao modelo?
- Quais mensagens da transcrição e chamadas de ferramenta levaram a esta resposta?
- A execução atingiu tempo limite, foi abortada, compactada ou encontrou um erro de provedor?
- Qual modelo, plugins, Skills e configurações de runtime estavam ativos?
- Quais metadados de uso e de cache de prompt o provedor retornou?

Se você estiver registrando um relatório de suporte amplo para um problema em um Gateway ativo, comece com
[`/diagnostics`](/pt-BR/gateway/diagnostics#chat-command). O Diagnostics coleta o
pacote sanitizado do Gateway e, para sessões do harness do OpenAI Codex, também pode enviar
feedback do Codex aos servidores da OpenAI após aprovação. Use `/export-trajectory` quando
precisar especificamente da linha do tempo detalhada por sessão de prompts, ferramentas e transcrição.

## Início rápido

Envie isto na sessão ativa:

```text
/export-trajectory
```

Alias:

```text
/trajectory
```

O OpenClaw grava o pacote no workspace:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Você pode escolher um nome de diretório de saída relativo:

```text
/export-trajectory bug-1234
```

O caminho personalizado é resolvido dentro de `.openclaw/trajectory-exports/`. Caminhos
absolutos e caminhos com `~` são rejeitados.

Pacotes de trajetória podem conter prompts, mensagens do modelo, esquemas de ferramentas, resultados de ferramentas,
eventos de runtime e caminhos locais. Portanto, o comando de barra do chat passa
por aprovação de execução todas as vezes. Aprove a exportação uma vez quando pretender
criar o pacote; não use permitir tudo. Em chats em grupo, o OpenClaw envia o
prompt de aprovação e o resultado da exportação para o proprietário em privado, em vez de publicar os
detalhes da trajetória de volta na sala compartilhada.

Para inspeção local ou fluxos de suporte, você também pode executar diretamente o caminho
do comando aprovado:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Acesso

A exportação de trajetória é um comando do proprietário. O remetente precisa passar pelas verificações normais
de autorização de comando e pelas verificações de proprietário do canal.

## O que é registrado

A captura de trajetória fica ativada por padrão para execuções de agente do OpenClaw.

Eventos de runtime incluem:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, incluindo o modelo de origem, próximo modelo, motivo/detalhe da falha, posição na cadeia e se o fallback avançou, teve sucesso ou esgotou a cadeia
- `model.completed`
- `trace.artifacts`
- `session.ended`

Eventos de transcrição também são reconstruídos a partir do branch de sessão ativo:

- mensagens do usuário
- mensagens do assistente
- chamadas de ferramenta
- resultados de ferramentas
- compactions
- mudanças de modelo
- rótulos e entradas de sessão personalizadas

Os eventos são gravados como JSON Lines com este marcador de schema:

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
| `manifest.json`       | Schema do pacote, arquivos de origem, contagens de eventos e lista de arquivos gerados         |
| `events.jsonl`        | Linha do tempo ordenada de runtime e transcrição                                                |
| `session-branch.json` | Branch de transcrição ativo com informações sensíveis ocultadas e cabeçalho da sessão          |
| `metadata.json`       | Versão do OpenClaw, SO/runtime, modelo, snapshot de configuração, plugins, Skills e metadados de prompt |
| `artifacts.json`      | Status final, erros, uso, cache de prompt, contagem de compaction, texto do assistente e metadados de ferramentas |
| `prompts.json`        | Prompts enviados e detalhes selecionados de construção de prompt                               |
| `system-prompt.txt`   | Prompt do sistema compilado mais recente, quando capturado                                     |
| `tools.json`          | Definições de ferramentas enviadas ao modelo, quando capturadas                                |

`manifest.json` lista os arquivos presentes naquele pacote. Alguns arquivos são omitidos
quando a sessão não capturou os dados de runtime correspondentes.

## Local de captura

Por padrão, eventos de trajetória de runtime são gravados ao lado do arquivo de sessão:

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

Quando essa variável é definida, o OpenClaw grava um arquivo JSONL por id de sessão nesse
diretório.

A manutenção de sessões remove sidecars de trajetória quando sua entrada de sessão proprietária
é podada, limitada ou removida pelo orçamento de disco de sessões. Arquivos de runtime fora
do diretório de sessões são removidos somente quando o destino do ponteiro ainda comprova que
pertence àquela sessão.

## Desativar captura

Defina `OPENCLAW_TRAJECTORY=0` antes de iniciar o OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

Isso desativa a captura de trajetória de runtime. `/export-trajectory` ainda pode exportar
o branch da transcrição, mas arquivos apenas de runtime, como contexto compilado,
artefatos do provedor e metadados de prompt, podem estar ausentes.

## Privacidade e limites

Pacotes de trajetória são projetados para suporte e depuração, não para publicação pública.
O OpenClaw oculta valores sensíveis antes de gravar arquivos de exportação:

- credenciais e campos de payload conhecidos com aparência de segredo
- dados de imagem
- caminhos de estado local
- caminhos do workspace, substituídos por `$WORKSPACE_DIR`
- caminhos do diretório inicial, quando detectados

O exportador também limita o tamanho da entrada:

- arquivos sidecar de runtime: a captura ativa para em 10 MiB e registra um evento de truncamento quando ainda há espaço; a exportação aceita sidecars de runtime existentes de até 50 MiB
- arquivos de sessão: 50 MiB
- eventos de runtime: 200.000
- total de eventos exportados: 250.000
- linhas individuais de eventos de runtime são truncadas acima de 256 KiB

Revise os pacotes antes de compartilhá-los fora da sua equipe. A ocultação é de melhor esforço
e não consegue conhecer todos os segredos específicos de cada aplicação.

## Solução de problemas

Se a exportação não tiver eventos de runtime:

- confirme que o OpenClaw foi iniciado sem `OPENCLAW_TRAJECTORY=0`
- verifique se `OPENCLAW_TRAJECTORY_DIR` aponta para um diretório gravável
- execute outra mensagem na sessão e exporte novamente
- inspecione `manifest.json` em busca de `runtimeEventCount`

Se o comando rejeitar o caminho de saída:

- use um nome relativo como `bug-1234`
- não passe `/tmp/...` ou `~/...`
- mantenha a exportação dentro de `.openclaw/trajectory-exports/`

Se a exportação falhar com um erro de tamanho, a sessão ou o sidecar excedeu os
limites de segurança da exportação. Inicie uma nova sessão ou exporte uma reprodução menor.

## Relacionado

- [Diffs](/pt-BR/tools/diffs)
- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Ferramenta exec](/pt-BR/tools/exec)
