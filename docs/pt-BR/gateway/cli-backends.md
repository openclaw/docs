---
read_when:
    - Você quer uma alternativa confiável quando os provedores de API falham
    - Você está executando CLIs de IA locais e quer reutilizá-las
    - Você quer entender a ponte de local loopback do MCP para acesso às ferramentas do backend da CLI
summary: 'Backends de CLI: fallback local de CLI de IA com ponte opcional para ferramentas MCP'
title: Back-ends de CLI
x-i18n:
    generated_at: "2026-07-11T23:54:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119b503d3107672c1bd7ccc39b464f253138d0d63d175018e91cbaeb720c462f
    source_path: gateway/cli-backends.md
    workflow: 16
---

O OpenClaw pode executar uma CLI de IA local como alternativa somente de texto quando os provedores de API estiverem indisponíveis, com limitação de taxa ou apresentando comportamento incorreto. Essa opção é intencionalmente conservadora:

- As ferramentas do OpenClaw não são injetadas diretamente, mas um backend com `bundleMcp: true` pode receber ferramentas do Gateway por meio de uma ponte MCP de local loopback.
- Streaming JSONL para CLIs que oferecem suporte.
- Há suporte a sessões, portanto, os turnos subsequentes permanecem coerentes.
- As imagens são encaminhadas se a CLI aceitar caminhos de imagens.

Use essa opção como uma rede de segurança para respostas de texto que "sempre funcionam", não como caminho principal. Para um runtime de infraestrutura completo com controles de sessão ACP, tarefas em segundo plano, vinculação de thread/conversa e sessões externas persistentes de programação, use [Agentes ACP](/pt-BR/tools/acp-agents); backends de CLI não são ACP.

<Tip>
  Está criando um novo Plugin de backend? Consulte [Plugins de backend de CLI](/pt-BR/plugins/cli-backend-plugins). Esta página aborda a configuração e a operação de um backend já registrado.
</Tip>

## Início rápido

O Plugin Anthropic incluído registra um backend `claude-cli` padrão, portanto, ele funciona sem nenhuma configuração além de ter o Claude Code instalado e com login realizado:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` é o id de agente padrão quando nenhuma lista explícita de agentes está configurada; caso contrário, substitua-o pelo id do seu agente.

Se o Gateway for executado por launchd/systemd com um `PATH` mínimo, indique explicitamente o binário:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

Se você usar um backend de CLI incluído como provedor principal de mensagens em um host do Gateway, o OpenClaw carregará automaticamente o Plugin incluído proprietário quando sua configuração referenciar esse backend em uma referência de modelo ou em `agents.defaults.cliBackends`.

## Uso como alternativa

Adicione o backend de CLI à sua lista de alternativas para que ele seja executado somente quando os modelos principais falharem:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

Se você usar `agents.defaults.models` como lista de permissões, inclua nela também os modelos do seu backend de CLI. Quando o provedor principal falhar (autenticação, limites de taxa, tempos limite), o OpenClaw tentará o backend de CLI em seguida.

## Configuração

Todos os backends de CLI ficam em `agents.defaults.cliBackends`, identificados pelo id do provedor (por exemplo, `claude-cli`, `my-cli`). O id do provedor torna-se o lado esquerdo da referência de modelo: `<provider>/<model>`.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // Sinalizador dedicado para arquivo de prompt:
          // systemPromptFileArg: "--system-file",
          // Ou, em vez disso, sinalizador de substituição de configuração no estilo do Codex:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Habilite somente se este backend puder repopular sessões invalidadas a partir
          // do histórico bruto e limitado da transcrição do OpenClaw antes da Compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Como funciona

1. Seleciona um backend pelo prefixo do provedor (`claude-cli/...`).
2. Cria um prompt de sistema usando o mesmo prompt e o contexto do espaço de trabalho do OpenClaw.
3. Executa a CLI com um id de sessão (se houver suporte) para manter a consistência do histórico. O backend `claude-cli` incluído mantém um processo stdio do Claude ativo por sessão do OpenClaw e envia os turnos subsequentes por stdin em formato stream-json.
4. Analisa a saída (JSON ou texto simples) e retorna o texto final.
5. Persiste os ids de sessão por backend para que os turnos subsequentes reutilizem a mesma sessão da CLI.

### Detalhes específicos da CLI do Claude

O backend `claude-cli` incluído dá preferência ao resolvedor nativo de Skills do Claude Code. Quando o instantâneo atual de Skills contém pelo menos uma Skill selecionada com um caminho materializado, o OpenClaw transmite um Plugin temporário do Claude Code por meio de `--plugin-dir` e omite o catálogo duplicado de Skills do OpenClaw do prompt de sistema anexado. Sem uma Skill de Plugin materializada, o OpenClaw mantém o catálogo do prompt como alternativa. As substituições de variáveis de ambiente/chaves de API da Skill ainda são aplicadas ao ambiente do processo filho durante a execução.

A CLI do Claude tem seu próprio modo de permissão não interativo; o OpenClaw o mapeia para a política de execução existente, em vez de adicionar uma configuração específica do Claude. Nas sessões ativas do Claude gerenciadas pelo OpenClaw, a política de execução efetiva é determinante: YOLO (`tools.exec.security: "full"` e `tools.exec.ask: "off"`) inicia o Claude com `--permission-mode bypassPermissions`, enquanto uma política restritiva o inicia com `--permission-mode default`. As configurações `agents.list[].tools.exec` por agente substituem o `tools.exec` global para esse agente. Os argumentos brutos do backend ainda podem incluir `--permission-mode`, mas as inicializações ativas do Claude normalizam esse sinalizador para corresponder à política efetiva.

O backend também mapeia os níveis de `/think` do OpenClaw para o sinalizador nativo `--effort` do Claude Code: `minimal`/`low` -> `low`, `medium` -> `medium`, e `high`/`xhigh`/`max` são transmitidos diretamente. `adaptive` remove os sinalizadores `--effort` configurados e não fornece substituição, portanto, o Claude Code determina o nível de esforço efetivo com base em seu próprio ambiente, configurações e padrões do modelo. Outros backends de CLI precisam que seu Plugin proprietário declare um mapeador de argv equivalente antes que `/think` afete a CLI iniciada.

Antes que o OpenClaw possa usar `claude-cli`, é necessário que o próprio Claude Code tenha login realizado no mesmo host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

As instalações do Docker precisam ter o Claude Code instalado e com login realizado dentro do diretório inicial persistente do contêiner, não apenas no host; consulte [Backend da CLI do Claude no Docker](/pt-BR/install/docker#claude-cli-backend-in-docker).

Defina `agents.defaults.cliBackends.claude-cli.command` somente quando o binário `claude` ainda não estiver no `PATH`.

## Sessões

- Se a CLI oferecer suporte a sessões, defina `sessionArg` (por exemplo, `--session-id`) ou `sessionArgs` (espaço reservado `{sessionId}`) quando o id precisar aparecer em vários sinalizadores.
- Se a CLI usar um subcomando de retomada com sinalizadores diferentes, defina `resumeArgs` (substitui `args` na retomada) e, opcionalmente, `resumeOutput` para retomadas que não usem JSON.
- `sessionMode`:
  - `always`: sempre envia um id de sessão (um novo UUID se não houver nenhum armazenado).
  - `existing`: envia um id de sessão somente se algum tiver sido armazenado anteriormente.
  - `none`: nunca envia um id de sessão.
- `claude-cli` usa como padrão `liveSession: "claude-stdio"`, `output: "jsonl"` e `input: "stdin"`, portanto, os turnos subsequentes reutilizam o processo ativo do Claude enquanto ele estiver em execução, inclusive em configurações personalizadas que omitam campos de transporte. Se o Gateway for reiniciado ou o processo ocioso for encerrado, o OpenClaw retomará a partir do id de sessão armazenado do Claude. Os ids de sessão armazenados são verificados em relação a uma transcrição legível do projeto antes da retomada; a ausência da transcrição limpa a vinculação (registrada como `reason=transcript-missing`) em vez de iniciar silenciosamente uma nova sessão com `--resume`.
- As sessões ativas do Claude mantêm limites de proteção para a saída JSONL: 8 MiB e 20.000 linhas JSONL brutas por turno, por padrão. Aumente-os por backend com `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` e `maxTurnLines`; o OpenClaw limita essas configurações a 64 MiB e 100.000 linhas.
- As sessões de CLI armazenadas representam a continuidade mantida pelo provedor. A redefinição diária implícita da sessão não as interrompe; `/reset` e políticas explícitas de `session.reset` ainda as interrompem.
- Normalmente, novas sessões de CLI são repopuladas apenas com o resumo da Compaction do OpenClaw e com a parte posterior à Compaction. Para recuperar sessões curtas invalidadas antes da Compaction, um backend pode habilitar `reseedFromRawTranscriptWhenUncompacted: true`. A repopulação a partir da transcrição bruta permanece limitada e restrita a invalidações seguras, como uma transcrição de CLI ausente, uma parte final órfã de uso de ferramenta, alterações de política de mensagens/prompt de sistema/cwd/MCP ou uma nova tentativa após expiração da sessão; alterações de perfil de autenticação ou de época das credenciais nunca repopulam o histórico bruto da transcrição.

Serialização: `serialize: true` mantém em ordem as execuções na mesma via (a maioria das CLIs serializa em uma via do provedor). O OpenClaw também descarta a reutilização da sessão de CLI armazenada quando a identidade de autenticação selecionada muda, incluindo alterações no id do perfil de autenticação, na chave de API estática, no token estático ou na identidade da conta OAuth quando a CLI expõe uma; apenas a rotação de tokens de acesso/atualização OAuth não interrompe a sessão. Se uma CLI não tiver um id estável de conta OAuth, o OpenClaw permitirá que essa CLI aplique suas próprias permissões de retomada.

## Preâmbulo de alternativa proveniente de sessões do claude-cli

Quando uma tentativa com `claude-cli` transfere a execução para um candidato que não é CLI em [`agents.defaults.model.fallbacks`](/pt-BR/concepts/model-failover), o OpenClaw fornece à tentativa seguinte um preâmbulo de contexto extraído da transcrição JSONL local do Claude Code (em `~/.claude/projects/`, identificada por espaço de trabalho). Sem essa informação inicial, o provedor alternativo começa sem contexto, pois a transcrição de sessão do próprio OpenClaw fica vazia nas execuções com `claude-cli`.

- O preâmbulo dá preferência ao resumo mais recente de `/compact` ou ao marcador `compact_boundary` e, em seguida, anexa os turnos mais recentes posteriores ao limite, respeitando um limite de caracteres. Os turnos anteriores ao limite são descartados porque o resumo já os representa.
- Os blocos de ferramentas são combinados em indicações compactas `(tool call: name)` e `(tool result: …)` para manter o orçamento do prompt preciso; um resumo grande demais é truncado e marcado como `(truncated)`.
- Alternativas de `claude-cli` para `claude-cli` com o mesmo provedor dependem do próprio `--resume` do Claude e ignoram o preâmbulo.
- A informação inicial reutiliza a validação existente do caminho do arquivo de sessão do Claude, portanto, caminhos arbitrários não podem ser lidos.

## Imagens

Se sua CLI aceitar caminhos de imagens, defina `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

O OpenClaw grava imagens em base64 em arquivos temporários. Se `imageArg` estiver definido, esses caminhos serão transmitidos como argumentos da CLI; caso contrário, o OpenClaw anexará os caminhos dos arquivos ao prompt (injeção de caminho), o que funciona com CLIs que carregam automaticamente arquivos locais a partir de caminhos simples.

## Entradas e saídas

- `output: "text"` (padrão) trata stdout como a resposta final.
- `output: "json"` tenta analisar JSON e extrair o texto e um id de sessão.
- `output: "jsonl"` analisa um fluxo JSONL e extrai a mensagem final do agente e os identificadores de sessão, quando presentes.
- Para a saída JSON da CLI do Gemini, o OpenClaw lê o texto da resposta em `response` e o uso em `stats` quando `usage` está ausente ou vazio. O padrão da CLI do Gemini incluída usa `stream-json`; substituições antigas por `--output-format json` continuam usando o analisador de JSON.

Modos de entrada:

- `input: "arg"` (padrão) transmite o prompt como o último argumento da CLI.
- `input: "stdin"` envia o prompt via stdin.
- Se o prompt for muito longo e `maxPromptArgChars` estiver definido, stdin será usado em seu lugar.

## Padrões mantidos pelo Plugin

Os padrões do backend de CLI fazem parte da superfície do Plugin:

- Os Plugins os registram com `api.registerCliBackend(...)`.
- O `id` do backend torna-se o prefixo do provedor nas referências de modelo.
- A configuração do usuário em `agents.defaults.cliBackends.<id>` ainda substitui o padrão do Plugin.
- A limpeza da configuração específica do backend permanece sob responsabilidade do Plugin por meio do hook opcional `normalizeConfig`.

A Anthropic mantém `claude-cli`, e o Google mantém `google-gemini-cli`. As execuções do agente OpenAI Codex usam a infraestrutura de app-server do Codex por meio de `openai/*`; o OpenClaw não registra mais um backend `codex-cli` incluído.

O Plugin Anthropic incluído registra para `claude-cli`:

| Chave                 | Valor                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`             | `claude`                                                                                                                                                                                                      |
| `args`                | `-p --output-format stream-json --include-partial-messages --verbose --setting-sources user --allowedTools mcp__openclaw__* --disallowedTools ScheduleWakeup,CronCreate,Bash(run_in_background:true),Monitor` |
| `output`              | `jsonl`                                                                                                                                                                                                       |
| `input`               | `stdin`                                                                                                                                                                                                       |
| `modelArg`            | `--model`                                                                                                                                                                                                     |
| `sessionArg`          | `--session-id`                                                                                                                                                                                                |
| `sessionMode`         | `always`                                                                                                                                                                                                      |
| `imageArg`            | `@`                                                                                                                                                                                                           |
| `imagePathScope`      | `workspace`                                                                                                                                                                                                   |
| `systemPromptFileArg` | `--append-system-prompt-file`                                                                                                                                                                                 |
| `systemPromptMode`    | `append`                                                                                                                                                                                                      |

O Plugin integrado do Google é registrado para `google-gemini-cli`:

| Chave                     | Valor                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | igual, com `--resume {sessionId}`                                                      |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

Pré-requisito: a Gemini CLI local deve estar instalada e disponível no `PATH` como `gemini` (`brew install gemini-cli` ou `npm install -g @google/gemini-cli`).

Observações sobre a saída da Gemini CLI:

- O analisador padrão de `stream-json` lê eventos `message` do assistente, eventos de ferramentas, o uso do `result` final e eventos de erro fatal do Gemini.
- Se você substituir os argumentos do Gemini por `--output-format json`, o OpenClaw normalizará esse backend novamente para `output: "json"` e lerá o texto da resposta no campo `response` do JSON.
- O uso recorre a `stats` quando `usage` está ausente ou vazio; `stats.cached` é normalizado para `cacheRead` do OpenClaw e, se `stats.input` estiver ausente, os tokens de entrada serão derivados de `stats.input_tokens - stats.cached`.

Substitua os padrões somente se necessário (mais comumente, por um caminho absoluto em `command`).

## Sobreposições de transformação de texto

Plugins que precisam de pequenos adaptadores de compatibilidade para prompts/mensagens podem declarar transformações de texto bidirecionais sem substituir um provedor ou backend de CLI:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` reescreve o prompt do sistema e o prompt do usuário enviados à CLI. `output` reescreve o texto transmitido pelo assistente e o texto final analisado antes que o OpenClaw processe seus próprios marcadores de controle e a entrega ao canal; em chamadas de modelo apoiadas por um provedor, também restaura valores de string dentro de argumentos estruturados de chamadas de ferramentas após o reparo do fluxo e antes da execução da ferramenta. Fragmentos JSON brutos do provedor permanecem inalterados; os consumidores devem usar o payload estruturado parcial, final ou de resultado.

Para CLIs que emitem eventos JSONL específicos do provedor, defina `jsonlDialect` na configuração desse backend: `claude-stream-json` para fluxos compatíveis com o Claude Code e `gemini-stream-json` para eventos `stream-json` da Gemini CLI.

## Propriedade da Compaction nativa

Alguns backends de CLI executam um agente que realiza a Compaction da própria transcrição; portanto, o OpenClaw não deve executar seu sumarizador de proteção nesses backends — isso entra em conflito com a Compaction do próprio backend e pode causar uma falha definitiva na execução.

`claude-cli` não tem um endpoint de harness (o Claude Code realiza a Compaction internamente), portanto declara `ownsNativeCompaction: true`, e o caminho de Compaction do OpenClaw retorna a entrada da sessão sem alterações. Sessões com harness nativo, como o Codex, continuam sendo encaminhadas ao endpoint de Compaction do respectivo harness.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Declare `ownsNativeCompaction` somente para um backend que realmente seja responsável pela Compaction: ele deve limitar de forma confiável a própria transcrição próximo à janela de contexto e persistir uma sessão retomável (por exemplo, `--resume` / `--session-id`), caso contrário, uma sessão adiada poderá permanecer acima do limite.

## Sobreposições de MCP integrado

Os backends de CLI não recebem chamadas de ferramentas do OpenClaw diretamente, mas um backend pode optar por uma sobreposição de configuração MCP gerada com `bundleMcp: true`. Comportamento integrado atual:

- `claude-cli`: arquivo de configuração MCP estrito gerado.
- `google-gemini-cli`: arquivo de configurações de sistema do Gemini gerado.

Quando o MCP integrado está habilitado, o OpenClaw:

- inicia um servidor HTTP MCP em local loopback que expõe as ferramentas do Gateway ao processo da CLI, autenticado com uma concessão de contexto por execução (`OPENCLAW_MCP_TOKEN`), ativa somente durante a tentativa de execução atual;
- vincula o acesso às ferramentas ao contexto de sessão, conta e canal selecionado pelo Gateway, em vez de confiar nos cabeçalhos do processo filho;
- carrega os servidores MCP integrados habilitados para o workspace atual e os combina com qualquer formato existente de configuração/definições MCP do backend;
- reescreve a configuração de inicialização usando o modo de integração pertencente ao backend, definido pelo Plugin responsável.

Se nenhum servidor MCP estiver habilitado, o OpenClaw ainda injetará uma configuração estrita quando um backend optar pelo MCP integrado, para que as execuções em segundo plano permaneçam isoladas.

Os runtimes MCP integrados com escopo de sessão são armazenados em cache para reutilização dentro de uma sessão e, depois, encerrados após `mcp.sessionIdleTtlMs` milissegundos de inatividade (padrão de 10 minutos; defina `0` para desabilitar). Execuções incorporadas únicas, como sondagens de autenticação, geração de slugs e recuperação da Active Memory, solicitam limpeza ao final da execução para que processos filhos stdio e fluxos HTTP/SSE transmitíveis não permaneçam ativos além da execução.

## Limite do histórico de reinicialização

Quando uma nova sessão de CLI é inicializada com base em uma transcrição anterior do OpenClaw (por exemplo, após uma nova tentativa por `session_expired`), o bloco `<conversation_history>` renderizado é limitado para impedir que os prompts de reinicialização cresçam excessivamente. O padrão é 12.288 caracteres (cerca de 3.000 tokens).

Os backends da Claude CLI dimensionam esse limite de acordo com a janela de contexto resolvida do Claude: janelas de contexto maiores recebem uma parte maior do histórico anterior, até um teto fixo; outros backends de CLI mantêm o padrão conservador. Esse limite controla somente o bloco de histórico anterior do prompt de reinicialização — os limites de saída da sessão ativa são ajustados separadamente em `reliability.outputLimits` (consulte [Sessões](#sessions)).

## Limitações

- Nenhuma chamada direta de ferramentas do OpenClaw: o OpenClaw não injeta chamadas de ferramentas no protocolo do backend de CLI. Os backends só veem as ferramentas do Gateway quando optam por `bundleMcp: true`.
- A transmissão é específica de cada backend: alguns backends transmitem JSONL, enquanto outros armazenam a saída até o encerramento.
- As saídas estruturadas dependem do formato JSON da própria CLI.

## Solução de problemas

| Sintoma                    | Correção                                                                           |
| -------------------------- | --------------------------------------------------------------------------------- |
| CLI não encontrada         | Defina `command` como um caminho completo.                                         |
| Nome de modelo incorreto   | Use `modelAliases` para mapear `provider/model` para o ID de modelo da CLI.        |
| Sem continuidade da sessão | Verifique se `sessionArg` está definido e se `sessionMode` não é `none`.           |
| Imagens ignoradas          | Defina `imageArg` e verifique se a CLI oferece suporte a caminhos de arquivos.     |

## Relacionado

- [Manual operacional do Gateway](/pt-BR/gateway)
- [Modelos locais](/pt-BR/gateway/local-models)
