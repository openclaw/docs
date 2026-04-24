---
read_when:
    - Depurando por que um agente respondeu, falhou ou chamou tools de determinada forma
    - Exportando um bundle de suporte para uma sessão do OpenClaw
    - Investigando contexto de prompt, chamadas de tools, erros de runtime ou metadados de uso
    - Desabilitando ou realocando a captura de trajetória
summary: Exportar bundles de trajetória com redação para depurar uma sessão de agente do OpenClaw
title: Bundles de trajetória
x-i18n:
    generated_at: "2026-04-24T06:19:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: be799691e0c3375efd24e3bec9ce8f9ab22f01a0f8a9ce4288b7e6e952c29da4
    source_path: tools/trajectory.md
    workflow: 15
---

A captura de trajetória é o registrador de voo por sessão do OpenClaw. Ela registra uma
linha do tempo estruturada para cada execução do agente, e então `/export-trajectory` empacota a
sessão atual em um bundle de suporte com redação.

Use isso quando precisar responder a perguntas como:

- Qual prompt, prompt de sistema e tools foram enviados ao modelo?
- Quais mensagens de transcrição e chamadas de tools levaram a esta resposta?
- A execução expirou, foi abortada, compactada ou encontrou um erro de provider?
- Quais modelo, plugins, Skills e configurações de runtime estavam ativos?
- Quais metadados de uso e de cache de prompt o provider retornou?

## Início rápido

Envie isto na sessão ativa:

```text
/export-trajectory
```

Alias:

```text
/trajectory
```

O OpenClaw grava o bundle no workspace:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Você pode escolher um nome relativo para o diretório de saída:

```text
/export-trajectory bug-1234
```

O caminho personalizado é resolvido dentro de `.openclaw/trajectory-exports/`. Caminhos absolutos
e caminhos com `~` são rejeitados.

## Acesso

A exportação de trajetória é um comando de proprietário. O remetente deve passar pelas verificações normais
de autorização de comando e verificações de proprietário do canal.

## O que é registrado

A captura de trajetória fica ativada por padrão para execuções de agente do OpenClaw.

Eventos de runtime incluem:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

Eventos de transcrição também são reconstruídos a partir do branch de sessão ativo:

- mensagens do usuário
- mensagens do assistente
- chamadas de tools
- resultados de tools
- compactions
- mudanças de modelo
- labels e entradas personalizadas de sessão

Os eventos são gravados como JSON Lines com este marcador de schema:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Arquivos do bundle

Um bundle exportado pode conter:

| Arquivo               | Conteúdo                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `manifest.json`       | Schema do bundle, arquivos de origem, contagens de eventos e lista de arquivos gerados           |
| `events.jsonl`        | Linha do tempo ordenada de runtime e transcrição                                                 |
| `session-branch.json` | Branch ativo da transcrição com redação e cabeçalho da sessão                                    |
| `metadata.json`       | Versão do OpenClaw, SO/runtime, modelo, snapshot de config, plugins, Skills e metadados de prompt |
| `artifacts.json`      | Status final, erros, uso, cache de prompt, contagem de compaction, texto do assistente e metadados de tools |
| `prompts.json`        | Prompts enviados e detalhes selecionados de construção do prompt                                 |
| `system-prompt.txt`   | Prompt de sistema compilado mais recente, quando capturado                                       |
| `tools.json`          | Definições de tools enviadas ao modelo, quando capturadas                                        |

`manifest.json` lista os arquivos presentes naquele bundle. Alguns arquivos são omitidos
quando a sessão não capturou os dados de runtime correspondentes.

## Local da captura

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

Quando essa variável está definida, o OpenClaw grava um arquivo JSONL por ID de sessão nesse
diretório.

## Desabilitar a captura

Defina `OPENCLAW_TRAJECTORY=0` antes de iniciar o OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

Isso desabilita a captura de trajetória de runtime. `/export-trajectory` ainda pode exportar
o branch da transcrição, mas arquivos apenas de runtime, como contexto compilado,
artefatos do provider e metadados de prompt, podem estar ausentes.

## Privacidade e limites

Bundles de trajetória são projetados para suporte e depuração, não para publicação pública.
O OpenClaw redige valores sensíveis antes de gravar arquivos de exportação:

- credenciais e campos de payload conhecidos com aparência de segredo
- dados de imagem
- caminhos de estado local
- caminhos de workspace, substituídos por `$WORKSPACE_DIR`
- caminhos do diretório home, quando detectados

O exportador também limita o tamanho de entrada:

- arquivos sidecar de runtime: 50 MiB
- arquivos de sessão: 50 MiB
- eventos de runtime: 200.000
- total de eventos exportados: 250.000
- linhas individuais de evento de runtime são truncadas acima de 256 KiB

Revise os bundles antes de compartilhá-los fora da sua equipe. A redação é por melhor esforço
e não consegue conhecer todos os segredos específicos da sua aplicação.

## Solução de problemas

Se a exportação não tiver eventos de runtime:

- confirme que o OpenClaw foi iniciado sem `OPENCLAW_TRAJECTORY=0`
- verifique se `OPENCLAW_TRAJECTORY_DIR` aponta para um diretório gravável
- execute outra mensagem na sessão e depois exporte novamente
- inspecione `manifest.json` para `runtimeEventCount`

Se o comando rejeitar o caminho de saída:

- use um nome relativo como `bug-1234`
- não passe `/tmp/...` ou `~/...`
- mantenha a exportação dentro de `.openclaw/trajectory-exports/`

Se a exportação falhar com um erro de tamanho, a sessão ou sidecar excedeu os
limites de segurança da exportação. Inicie uma nova sessão ou exporte uma reprodução menor.

## Relacionado

- [Diffs](/pt-BR/tools/diffs)
- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Tool Exec](/pt-BR/tools/exec)
