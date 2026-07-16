---
read_when:
    - Você quer uma alternativa confiável quando os provedores de API falham
    - Você está executando CLIs de IA locais e quer reutilizá-las
    - Você quer entender a ponte de loopback MCP para acesso às ferramentas de backend da CLI
summary: 'Backends de CLI: fallback de CLI de IA local com ponte opcional para ferramentas MCP'
title: Backends de CLI
x-i18n:
    generated_at: "2026-07-16T12:26:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ffeb19e582819f511212326da83381ba2c52e9f5743263f1ef9e0dc0fbbaf08e
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw pode executar uma CLI de IA local como alternativa somente de texto quando os provedores de API estão indisponíveis, sujeitos a limites de taxa ou apresentando mau funcionamento. Essa alternativa é intencionalmente conservadora:

- As ferramentas do OpenClaw não são injetadas diretamente, mas um backend com `bundleMcp: true` pode receber ferramentas do Gateway por meio de uma ponte MCP de loopback.
- Streaming JSONL para CLIs compatíveis.
- Há suporte a sessões, portanto, os turnos subsequentes permanecem coerentes.
- As imagens são repassadas se a CLI aceitar caminhos de imagem.

Use essa alternativa como uma rede de segurança para respostas de texto que "sempre funcionam", não como caminho principal. Para um runtime de harness completo com controles de sessão ACP, tarefas em segundo plano, vinculação de thread/conversa e sessões externas persistentes de programação, use [Agentes ACP](/pt-BR/tools/acp-agents); backends de CLI não são ACP.

<Tip>
  Está criando um novo Plugin de backend? Consulte [Plugins de backend de CLI](/pt-BR/plugins/cli-backend-plugins). Esta página aborda a configuração e a operação de um backend já registrado.
</Tip>

## Início rápido

O Plugin Anthropic incluído registra um backend `claude-cli` padrão, portanto, ele funciona sem nenhuma configuração além de ter o Claude Code instalado e com login realizado:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` é o ID de agente padrão quando nenhuma lista explícita de agentes está configurada; caso contrário, substitua-o pelo seu próprio ID de agente.

Se o Gateway for executado pelo launchd/systemd com um `PATH` mínimo, especifique explicitamente o caminho para o binário:

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

Se você usar um backend de CLI incluído como provedor principal de mensagens em um host do Gateway, o OpenClaw carregará automaticamente o Plugin incluído que o controla quando sua configuração referenciar esse backend em uma referência de modelo ou em `agents.defaults.cliBackends`.

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

Se você usar `agents.defaults.models` como lista de permissões, inclua também nela os modelos do seu backend de CLI. Quando o provedor principal falha (autenticação, limites de taxa, tempos limite), o OpenClaw tenta o backend de CLI em seguida.

## Configuração

Todos os backends de CLI ficam em `agents.defaults.cliBackends`, indexados pelo ID do provedor (por exemplo, `claude-cli`, `my-cli`). O ID do provedor se torna o lado esquerdo da referência do modelo: `<provider>/<model>`.

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
          // Sinalizador dedicado de arquivo de prompt:
          // systemPromptFileArg: "--system-file",
          // Em vez disso, sinalizador de substituição de configuração no estilo do Codex:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Ative somente se este backend puder reinicializar sessões invalidadas
          // usando o histórico bruto e limitado da transcrição do OpenClaw antes da Compaction.
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
2. Cria um prompt de sistema usando o mesmo prompt e contexto do espaço de trabalho do OpenClaw.
3. Executa a CLI com um ID de sessão (se houver suporte) para manter o histórico consistente. O backend `claude-cli` incluído mantém um processo stdio do Claude ativo por sessão do OpenClaw e envia turnos subsequentes pela entrada padrão stream-json.
4. Analisa a saída (JSON ou texto simples) e retorna o texto final.
5. Persiste IDs de sessão por backend para que os turnos subsequentes reutilizem a mesma sessão da CLI.

### Particularidades da CLI do Claude

O backend `claude-cli` incluído prioriza o resolvedor nativo de Skills do Claude Code. Quando o snapshot atual de Skills tem pelo menos uma Skill selecionada com um caminho materializado, o OpenClaw transmite um Plugin temporário do Claude Code por meio de `--plugin-dir` e omite do prompt de sistema anexado o catálogo duplicado de Skills do OpenClaw. Sem uma Skill de Plugin materializada, o OpenClaw mantém o catálogo do prompt como alternativa. As substituições de variáveis de ambiente/chaves de API das Skills ainda se aplicam ao ambiente do processo filho durante a execução.

A CLI do Claude tem seu próprio modo de permissão não interativo; o OpenClaw o mapeia para a política de execução existente, em vez de adicionar uma configuração específica do Claude. Para sessões ativas do Claude gerenciadas pelo OpenClaw, a política de execução efetiva é determinante: YOLO (`tools.exec.security: "full"` e `tools.exec.ask: "off"`) normalmente inicia o Claude com `--permission-mode bypassPermissions`, enquanto uma política restritiva o inicia com `--permission-mode default`. Gateways executados como root também usam `default`, pois o Claude Code rejeita o modo de desvio para root; o OpenClaw ainda responde às solicitações de controle de ferramentas via stdio do Claude de acordo com a política de execução configurada. As configurações `agents.list[].tools.exec` por agente substituem o `tools.exec` global para esse agente. Os argumentos brutos do backend ainda podem incluir `--permission-mode`, mas as inicializações ativas do Claude normalizam esse sinalizador para corresponder à política efetiva e à restrição do host.

O backend também mapeia os níveis `/think` do OpenClaw para o sinalizador nativo `--effort` do Claude Code: `minimal`/`low` -> `low`, `medium` -> `medium`, e `high`/`xhigh`/`max` são repassados diretamente. Isso mantém os níveis de esforço compatíveis do Fable 5 iguais nas rotas da CLI do Claude baseadas em assinatura e nas rotas de chave de API. `adaptive` remove os sinalizadores `--effort` configurados e não fornece substituto, portanto, o Claude Code determina o esforço efetivo com base em seu próprio ambiente, suas configurações e os padrões do modelo. Outros backends de CLI precisam que o Plugin responsável declare um mapeador de argv equivalente antes que `/think` afete a CLI iniciada.

Antes que o OpenClaw possa usar `claude-cli`, o próprio Claude Code precisa estar autenticado no mesmo host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Instalações com Docker precisam ter o Claude Code instalado e autenticado no diretório inicial persistente do contêiner, não apenas no host; consulte [Backend da CLI do Claude no Docker](/pt-BR/install/docker#claude-cli-backend-in-docker).

Defina `agents.defaults.cliBackends.claude-cli.command` somente quando o binário `claude` ainda não estiver em `PATH`.

## Sessões

- Se a CLI for compatível com sessões, defina `sessionArg` (por exemplo, `--session-id`) ou `sessionArgs` (placeholder `{sessionId}`) quando o ID precisar ser inserido em vários sinalizadores.
- Se a CLI usar um subcomando de retomada com sinalizadores diferentes, defina `resumeArgs` (substitui `args` ao retomar) e, opcionalmente, `resumeOutput` para retomadas que não sejam JSON.
- `sessionMode`:
  - `always`: sempre envia um ID de sessão (um novo UUID se nenhum estiver armazenado).
  - `existing`: envia um ID de sessão somente se já houver um armazenado.
  - `none`: nunca envia um ID de sessão.
- `claude-cli` usa por padrão `liveSession: "claude-stdio"`, `output: "jsonl"` e `input: "stdin"`, portanto, os turnos subsequentes reutilizam o processo ativo do Claude enquanto ele estiver em execução, inclusive em configurações personalizadas que omitam campos de transporte. Se o Gateway for reiniciado ou o processo ocioso for encerrado, o OpenClaw retomará a partir do ID de sessão armazenado do Claude. Os IDs de sessão armazenados são verificados em relação a uma transcrição de projeto legível antes da retomada; a ausência de uma transcrição remove a vinculação (registrada como `reason=transcript-missing`) em vez de iniciar silenciosamente uma nova sessão em `--resume`.
- As sessões ativas do Claude mantêm proteções limitadas para a saída JSONL: 8 MiB e 20,000 linhas JSONL brutas por turno, por padrão. Aumente esses valores por backend com `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` e `maxTurnLines`; o OpenClaw limita essas configurações a 64 MiB e 100,000 linhas.
- As sessões de CLI armazenadas são uma continuidade controlada pelo provedor. A redefinição diária implícita da sessão não as interrompe; `/reset` e políticas explícitas de `session.reset` ainda o fazem.
- Novas sessões de CLI normalmente são reinicializadas somente com o resumo de Compaction do OpenClaw e o trecho posterior à Compaction. Para recuperar sessões curtas invalidadas antes da Compaction, um backend pode ativar `reseedFromRawTranscriptWhenUncompacted: true`. A reinicialização pela transcrição bruta permanece limitada e restrita a invalidações seguras, como ausência de transcrição da CLI, trecho órfão de uso de ferramenta, alterações na política de mensagens/no prompt de sistema/no cwd/no MCP ou uma nova tentativa após expiração da sessão; alterações no perfil de autenticação ou na época das credenciais nunca reinicializam o histórico bruto da transcrição.

Serialização: `serialize: true` mantém as execuções da mesma faixa em ordem (a maioria das CLIs serializa em uma única faixa do provedor). O OpenClaw também deixa de reutilizar a sessão de CLI armazenada quando a identidade de autenticação selecionada muda, incluindo alteração do ID do perfil de autenticação, da chave de API estática, do token estático ou da identidade da conta OAuth quando a CLI disponibiliza uma; a simples rotação de tokens OAuth de acesso/atualização não interrompe a sessão. Se uma CLI não tiver um ID estável de conta OAuth, o OpenClaw permite que essa CLI aplique suas próprias permissões de retomada.

## Preâmbulo de alternativa proveniente de sessões claude-cli

Quando uma tentativa `claude-cli` alterna para um candidato que não seja CLI em [`agents.defaults.model.fallbacks`](/pt-BR/concepts/model-failover), o OpenClaw inicializa a próxima tentativa com um preâmbulo de contexto coletado da transcrição JSONL local do Claude Code (em `~/.claude/projects/`, indexado por espaço de trabalho). Sem essa inicialização, o provedor alternativo começa sem contexto, pois a própria transcrição de sessão do OpenClaw está vazia para execuções `claude-cli`.

- O preâmbulo prioriza o resumo `/compact` ou o marcador `compact_boundary` mais recente e, em seguida, anexa os turnos mais recentes após o limite até atingir um orçamento de caracteres. Os turnos anteriores ao limite são descartados porque o resumo já os representa.
- Os blocos de ferramentas são agrupados em dicas compactas `(tool call: name)` e `(tool result: …)` para manter o orçamento do prompt preciso; um resumo grande demais é truncado e rotulado como `(truncated)`.
- Alternativas do mesmo provedor de `claude-cli` para `claude-cli` dependem do próprio `--resume` do Claude e ignoram o preâmbulo.
- A inicialização reutiliza a validação existente do caminho do arquivo de sessão do Claude, portanto, não é possível ler caminhos arbitrários.

## Imagens

Se sua CLI aceitar caminhos de imagem, defina `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

O OpenClaw grava imagens em base64 em arquivos temporários. Se `imageArg` estiver definido, esses caminhos serão transmitidos como argumentos da CLI; caso contrário, o OpenClaw anexará os caminhos dos arquivos ao prompt (injeção de caminho), o que funciona com CLIs que carregam automaticamente arquivos locais a partir de caminhos simples.

## Entradas e saídas

- `output: "text"` (padrão) trata stdout como a resposta final.
- `output: "json"` tenta analisar JSON e extrair o texto e um ID de sessão.
- `output: "jsonl"` analisa um fluxo JSONL e extrai a mensagem final do agente e os identificadores de sessão, quando presentes.
- Para a saída JSON da CLI do Gemini, o OpenClaw lê o texto da resposta em `response` e o uso em `stats` quando `usage` está ausente ou vazio. O padrão incluído da CLI do Gemini usa `stream-json`; substituições antigas de `--output-format json` ainda usam o analisador JSON.

Modos de entrada:

- `input: "arg"` (padrão) passa o prompt como o último argumento da CLI.
- `input: "stdin"` envia o prompt via stdin.
- Se o prompt for muito longo e `maxPromptArgChars` estiver definido, stdin será usado em vez disso.

## Padrões pertencentes ao plugin

Os padrões do backend da CLI fazem parte da superfície do plugin:

- Os plugins os registram com `api.registerCliBackend(...)`.
- O `id` do backend se torna o prefixo do provedor nas referências de modelo.
- A configuração do usuário em `agents.defaults.cliBackends.<id>` ainda substitui o padrão do plugin.
- A limpeza de configuração específica do backend continua pertencendo ao plugin por meio do gancho opcional `normalizeConfig`.

A Anthropic é responsável por `claude-cli`, e o Google é responsável por `google-gemini-cli`. As execuções do agente OpenAI Codex usam o harness do servidor de aplicativo Codex por meio de `openai/*`; o OpenClaw não registra mais um backend `codex-cli` incluído.

O plugin Anthropic incluído registra o seguinte para `claude-cli`:

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

O plugin Google incluído registra o seguinte para `google-gemini-cli`:

| Chave                     | Valor                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | o mesmo, com `--resume {sessionId}`                                                      |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

Pré-requisito: a Gemini CLI local deve estar instalada e disponível em `PATH` como `gemini` (`brew install gemini-cli` ou `npm install -g @google/gemini-cli`).

Observações sobre a saída da Gemini CLI:

- O analisador `stream-json` padrão lê eventos `message` do assistente, eventos de ferramentas, o uso final de `result` e eventos de erros fatais do Gemini.
- Se os argumentos do Gemini forem substituídos por `--output-format json`, o OpenClaw normalizará esse backend de volta para `output: "json"` e lerá o texto da resposta no campo JSON `response`.
- O uso recorrerá a `stats` quando `usage` estiver ausente ou vazio; `stats.cached` será normalizado para `cacheRead` do OpenClaw e, se `stats.input` estiver ausente, os tokens de entrada serão derivados de `stats.input_tokens - stats.cached`.

Substitua os padrões somente se necessário (mais comumente, por um caminho absoluto em `command`).

## Sobreposições de transformação de texto

Os plugins que precisam de pequenos shims de compatibilidade de prompts/mensagens podem declarar transformações de texto bidirecionais sem substituir um provedor ou backend da CLI:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` reescreve o prompt do sistema e o prompt do usuário passados para a CLI. `output` reescreve o texto transmitido do assistente e o texto final analisado antes que o OpenClaw processe seus próprios marcadores de controle e faça a entrega ao canal; em chamadas de modelo apoiadas por provedores, também restaura valores de string dentro dos argumentos estruturados de chamadas de ferramenta após o reparo do fluxo e antes da execução da ferramenta. Os fragmentos JSON brutos do provedor permanecem inalterados; os consumidores devem usar a carga útil estruturada parcial, final ou de resultado.

Para CLIs que emitem eventos JSONL específicos do provedor, defina `jsonlDialect` na configuração desse backend: `claude-stream-json` para fluxos compatíveis com Claude Code, `gemini-stream-json` para eventos `stream-json` da Gemini CLI.

## Propriedade da compactação nativa

Alguns backends da CLI executam um agente que compacta a própria transcrição, portanto o OpenClaw não deve executar seu sumarizador de proteção sobre eles — isso entra em conflito com a própria compactação do backend e pode causar uma falha irrecuperável no turno.

`claude-cli` não tem endpoint de harness (o Claude Code compacta internamente), portanto declara `ownsNativeCompaction: true`, e o caminho de compactação do OpenClaw retorna a entrada da sessão sem alterações. O OpenClaw passa o orçamento de contexto efetivo da execução pela variável [`CLAUDE_CODE_AUTO_COMPACT_WINDOW`](https://code.claude.com/docs/en/env-vars) documentada do Claude Code, mantendo a compactação automática nativa alinhada aos limites configurados de `contextTokens` da Anthropic. Sessões com harness nativo, como o Codex, continuam sendo encaminhadas ao endpoint de compactação do harness.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Declare `ownsNativeCompaction` somente para um backend que realmente seja responsável pela compactação: ele deve limitar de forma confiável sua própria transcrição nas proximidades da janela de contexto e persistir uma sessão retomável (por exemplo, `--resume` / `--session-id`); caso contrário, uma sessão adiada pode permanecer acima do orçamento.

## Sobreposições de MCP do pacote

Os backends da CLI não recebem chamadas de ferramenta do OpenClaw diretamente, mas um backend pode optar por uma sobreposição de configuração MCP gerada com `bundleMcp: true`. Comportamento atual dos componentes incluídos:

- `claude-cli`: arquivo de configuração MCP estrita gerado.
- `google-gemini-cli`: arquivo de configurações do sistema Gemini gerado.

Quando o MCP do pacote está ativado, o OpenClaw:

- inicia um servidor MCP HTTP de loopback que expõe ferramentas do Gateway ao processo da CLI, autenticado com uma concessão de contexto por execução (`OPENCLAW_MCP_TOKEN`) ativa somente para a tentativa de execução atual;
- vincula o acesso às ferramentas à sessão, à conta e ao contexto do canal selecionados pelo Gateway, em vez de confiar nos cabeçalhos do processo filho;
- carrega os servidores MCP do pacote ativados para o workspace atual e os combina com qualquer formato existente de configuração/definições MCP do backend;
- reescreve a configuração de inicialização usando o modo de integração pertencente ao backend, definido pelo plugin responsável.

Se nenhum servidor MCP estiver ativado, o OpenClaw ainda injetará uma configuração estrita quando um backend optar pelo MCP do pacote, para que as execuções em segundo plano permaneçam isoladas.

Os runtimes MCP incluídos com escopo de sessão são armazenados em cache para reutilização dentro de uma sessão e, em seguida, encerrados após `mcp.sessionIdleTtlMs` milissegundos de inatividade (padrão de 10 minutos; defina `0` para desativar). Execuções incorporadas de uso único, como sondagens de autenticação, geração de slugs e recuperação da Active Memory, solicitam limpeza ao final da execução para que processos filhos stdio e fluxos HTTP/SSE Streamable não sobrevivam à execução.

## Limite do histórico de reinicialização

Quando uma nova sessão da CLI é inicializada a partir de uma transcrição anterior do OpenClaw (por exemplo, após uma nova tentativa de `session_expired`), o bloco `<conversation_history>` renderizado é limitado para impedir que os prompts de reinicialização cresçam excessivamente. O padrão é 12.288 caracteres (cerca de 3.000 tokens).

Os backends da CLI do Claude dimensionam esse limite de acordo com a janela de contexto resolvida do Claude: janelas de contexto maiores recebem uma fatia maior do histórico anterior, até um teto fixo; outros backends da CLI mantêm o padrão conservador. Esse limite controla somente o bloco de histórico anterior do prompt de reinicialização — os limites de saída da sessão ativa são ajustados separadamente em `reliability.outputLimits` (consulte [Sessões](#sessions)).

## Limitações

- Sem chamadas diretas de ferramentas do OpenClaw: o OpenClaw não injeta chamadas de ferramentas no protocolo do backend da CLI. Os backends só veem ferramentas do Gateway quando optam por `bundleMcp: true`.
- A transmissão é específica do backend: alguns backends transmitem JSONL, enquanto outros armazenam em buffer até a saída.
- As saídas estruturadas dependem do formato JSON da própria CLI.

## Solução de problemas

| Sintoma                  | Correção                                                                   |
| ------------------------ | ------------------------------------------------------------------------- |
| CLI não encontrada       | Defina `command` como um caminho completo.                                     |
| Nome de modelo incorreto | Use `modelAliases` para mapear `provider/model` para o ID de modelo da CLI. |
| Sem continuidade de sessão | Verifique se `sessionArg` está definido e se `sessionMode` não é `none`.       |
| Imagens ignoradas        | Defina `imageArg` e verifique se a CLI oferece suporte a caminhos de arquivos.            |

## Relacionados

- [Manual operacional do Gateway](/pt-BR/gateway)
- [Modelos locais](/pt-BR/gateway/local-models)
