---
read_when:
    - Usar ou modificar a ferramenta exec
    - Depuração do comportamento de stdin ou TTY
summary: Uso da ferramenta exec, modos stdin e suporte a TTY
title: Ferramenta Exec
x-i18n:
    generated_at: "2026-06-27T18:15:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2831d9e66b25ce251f90e59a41b25234e22106d865466e61b878e3999e849dc
    source_path: tools/exec.md
    workflow: 16
---

Execute comandos shell no workspace. `exec` é uma superfície shell mutável: comandos podem criar, editar ou excluir arquivos onde quer que o host selecionado ou o sistema de arquivos do sandbox permita. Desabilitar ferramentas de sistema de arquivos do OpenClaw como `write`, `edit` ou `apply_patch` não torna `exec` somente leitura.

Aceita execução em primeiro plano + segundo plano via `process`. Se `process` não for permitido, `exec` roda de forma síncrona e ignora `yieldMs`/`background`.
Sessões em segundo plano têm escopo por agente; `process` só vê sessões do mesmo agente.

## Parâmetros

<ParamField path="command" type="string" required>
Comando shell a executar.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Diretório de trabalho para o comando.
</ParamField>

<ParamField path="env" type="object">
Substituições de ambiente chave/valor mescladas sobre o ambiente herdado.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Coloca o comando automaticamente em segundo plano após este atraso (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Coloca o comando em segundo plano imediatamente em vez de aguardar `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Substitui o timeout de exec configurado para esta chamada. Defina `timeout: 0` somente quando o comando deve rodar sem o timeout do processo exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Executa em um pseudoterminal quando disponível. Use para CLIs exclusivas de TTY, agentes de codificação e UIs de terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Onde executar. `auto` resolve para `sandbox` quando um runtime de sandbox está ativo e para `gateway` caso contrário.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Ignorado para chamadas normais de ferramenta. A segurança de `gateway` / `node` é controlada por
`tools.exec.security` e pelo arquivo de aprovações do host; o modo elevado pode
forçar `security=full` somente quando o operador concede explicitamente acesso elevado.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
O modo base de solicitação vem de `tools.exec.ask` e das aprovações do host.
Para chamadas de modelo originadas de canais, `ask` por chamada é ignorado quando o
ask efetivo do host é `off`; caso contrário, ele só pode endurecer para um modo
mais estrito. Chamadores internos/API confiáveis que constroem ferramentas exec com um
valor `ask` explícito permanecem inalterados.
</ParamField>

<ParamField path="node" type="string">
ID/nome do Node quando `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Solicita modo elevado — escapa do sandbox para o caminho de host configurado. `security=full` é forçado somente quando elevated resolve para `full`.
</ParamField>

Observações:

- `host` usa `auto` por padrão: sandbox quando o runtime de sandbox está ativo para a sessão; caso contrário, Gateway.
- `host` aceita somente `auto`, `sandbox`, `gateway` ou `node`. Ele não é um seletor de hostname; valores semelhantes a hostnames são rejeitados antes de o comando rodar.
- `auto` é a estratégia de roteamento padrão, não um curinga. `host=node` por chamada é permitido a partir de `auto`; `host=gateway` por chamada só é permitido quando nenhum runtime de sandbox está ativo.
- `tools.exec.mode` é o controle de política normalizado. Os valores são `deny`, `allowlist`, `ask`, `auto` e `full`. `auto` executa correspondências determinísticas de allowlist/safe-bin diretamente e roteia todos os casos restantes de aprovação de exec pelo revisor automático nativo do OpenClaw antes de perguntar a um humano. `ask` / `ask=always` ainda pergunta a um humano todas as vezes.
- Sem configuração extra, `host=auto` ainda "simplesmente funciona": sem sandbox, ele resolve para `gateway`; com sandbox ativo, permanece no sandbox.
- `elevated` escapa do sandbox para o caminho de host configurado: `gateway` por padrão, ou `node` quando `tools.exec.host=node` (ou o padrão da sessão é `host=node`). Ele só está disponível quando o acesso elevado está habilitado para a sessão/provedor atual.
- Aprovações de `gateway`/`node` são controladas pelo arquivo de aprovações do host.
- `node` requer um Node pareado (app companheiro ou host Node headless).
- Se vários Nodes estiverem disponíveis, defina `exec.node` ou `tools.exec.node` para selecionar um.
- `exec host=node` é o único caminho de execução shell para Nodes; o wrapper legado `nodes.run` foi removido.
- `timeout` se aplica a execução em primeiro plano, em segundo plano, `yieldMs`, Gateway, sandbox e `system.run` do Node. Se omitido, o OpenClaw usa `tools.exec.timeoutSec`; `timeout: 0` explícito desabilita o timeout do processo exec para essa chamada.
- Em hosts não Windows, exec usa `SHELL` quando definido; se `SHELL` for `fish`, ele prefere `bash` (ou `sh`)
  de `PATH` para evitar scripts incompatíveis com fish, depois volta para `SHELL` se nenhum deles existir.
- Em hosts Windows, exec prefere a descoberta do PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, depois PATH),
  depois volta para o Windows PowerShell 5.1.
- Em hosts Gateway não Windows, comandos exec bash e zsh usam um snapshot de inicialização. O OpenClaw captura
  aliases/funções passíveis de source e um pequeno conjunto seguro de ambiente de arquivos de inicialização do shell em
  `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`, depois faz source desse snapshot antes de cada comando exec.
  Variáveis que parecem secretas são excluídas; exec em sandbox e Node não usa esse snapshot. Defina
  `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` no ambiente do processo Gateway para desabilitar esse caminho de snapshot.
- Execução no host (`gateway`/`node`) rejeita `env.PATH` e substituições de loader (`LD_*`/`DYLD_*`) para
  impedir sequestro de binário ou código injetado.
- O OpenClaw define `OPENCLAW_SHELL=exec` no ambiente do comando gerado (incluindo execução em PTY e sandbox) para que regras de shell/profile possam detectar o contexto da ferramenta exec.
- Para execuções originadas de canal, o OpenClaw também expõe uma carga JSON estreita de identidade de remetente/chat em
  `OPENCLAW_CHANNEL_CONTEXT` quando o canal forneceu esses IDs.
- `openclaw channels login` é bloqueado de `exec` porque é um fluxo interativo de autenticação de canal; rode-o em um terminal no host Gateway ou use a ferramenta de login nativa do canal pelo chat quando existir.
- Importante: sandboxing vem **desativado por padrão**. Se sandboxing estiver desativado, `host=auto` implícito
  resolve para `gateway`. `host=sandbox` explícito ainda falha fechado em vez de rodar silenciosamente
  no host Gateway. Habilite sandboxing ou use `host=gateway` com aprovações.
- Verificações de preflight de scripts (para erros comuns de sintaxe shell em Python/Node) inspecionam apenas arquivos dentro do
  limite efetivo de `workdir`. Se um caminho de script resolve fora de `workdir`, o preflight é ignorado para
  esse arquivo.
- Para trabalho de longa duração que começa agora, inicie-o uma vez e conte com o despertar automático
  de conclusão quando ele estiver habilitado e o comando emitir saída ou falhar.
  Use `process` para logs, status, entrada ou intervenção; não emule
  agendamento com loops de sleep, loops de timeout ou polling repetido.
- Para trabalho que deve acontecer depois ou em uma agenda, use Cron em vez de
  padrões de sleep/atraso com `exec`.

## Configuração

- `tools.exec.notifyOnExit` (padrão: true): quando true, sessões exec colocadas em segundo plano enfileiram um evento do sistema e solicitam um Heartbeat ao sair.
- `tools.exec.approvalRunningNoticeMs` (padrão: 10000): emite um único aviso "em execução" quando um exec bloqueado por aprovação roda por mais tempo que isso (0 desabilita).
- `tools.exec.timeoutSec` (padrão: 1800): timeout exec padrão por comando em segundos. `timeout` por chamada o substitui; `timeout: 0` por chamada desabilita o timeout do processo exec.
- `tools.exec.host` (padrão: `auto`; resolve para `sandbox` quando o runtime de sandbox está ativo, `gateway` caso contrário)
- `tools.exec.security` (padrão: `deny` para sandbox, `full` para Gateway + Node quando não definido)
- `tools.exec.ask` (padrão: `off`)
- Exec de host sem aprovação é o padrão para Gateway + Node. Se você quiser comportamento de aprovações/allowlist, endureça tanto `tools.exec.*` quanto o arquivo de aprovações do host; veja [Aprovações de exec](/pt-BR/tools/exec-approvals#yolo-mode-no-approval).
- YOLO vem dos padrões de política do host (`security=full`, `ask=off`), não de `host=auto`. Se quiser forçar roteamento por Gateway ou Node, defina `tools.exec.host` ou use `/exec host=...`.
- No modo `security=full` mais `ask=off`, o exec de host segue diretamente a política configurada; não há camada extra de pré-filtro heurístico de ofuscação de comandos nem rejeição por preflight de script.
- `tools.exec.node` (padrão: não definido)
- `tools.exec.strictInlineEval` (padrão: false): quando true, formas inline de eval de interpretador como `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` e `osascript -e` exigem revisor ou aprovação explícita. Em `mode=auto`, o caminho normal de aprovação de exec pode permitir que o revisor automático nativo autorize um comando pontual claramente de baixo risco; chamadas diretas `system.run` em host Node ainda exigem uma aprovação explícita porque não conseguem entregar o comando a uma rota de aprovação humana. Se o revisor perguntar, a solicitação vai para um humano. `allow-always` ainda pode persistir invocações benignas de interpretador/script, mas formas inline-eval não se tornam regras allow duráveis.
- `tools.exec.commandHighlighting` (padrão: false): quando true, prompts de aprovação podem destacar trechos de comando derivados do parser no texto do comando. Defina como `true` globalmente ou por agente para habilitar o destaque do texto do comando sem alterar a política de aprovação de exec.
- `tools.exec.pathPrepend`: lista de diretórios para antepor a `PATH` em execuções exec (somente Gateway + sandbox).
- `tools.exec.safeBins`: binários seguros somente stdin que podem rodar sem entradas explícitas de allowlist. Para detalhes de comportamento, veja [Binários seguros](/pt-BR/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: diretórios explícitos adicionais confiáveis para verificações de caminho de `safeBins`. Entradas de `PATH` nunca são confiadas automaticamente. Os padrões integrados são `/bin` e `/usr/bin`.
- `tools.exec.safeBinProfiles`: política argv personalizada opcional por binário seguro (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

Exemplo:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### Tratamento de PATH

- `host=gateway`: mescla o `PATH` do seu login-shell no ambiente exec. Substituições de `env.PATH` são
  rejeitadas para execução no host. O daemon em si ainda roda com um `PATH` mínimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
    - Para impedir que a configuração do shell do usuário (como `~/.zshenv` ou `/etc/zshenv`) substitua caminhos prioritários durante a inicialização, entradas de `tools.exec.pathPrepend` são antepostas com segurança ao `PATH` final dentro do comando shell logo antes da execução.
- `host=sandbox`: roda `sh -lc` (login shell) dentro do contêiner, então `/etc/profile` pode redefinir `PATH`.
  O OpenClaw antepõe `env.PATH` após o source do profile por meio de uma variável de ambiente interna (sem interpolação de shell);
  `tools.exec.pathPrepend` também se aplica aqui.
- `host=node`: somente substituições de env não bloqueadas que você passar são enviadas ao Node. Substituições de `env.PATH` são
  rejeitadas para execução no host e ignoradas por hosts Node. Se você precisar de entradas PATH adicionais em um Node,
  configure o ambiente do serviço do host Node (systemd/launchd) ou instale ferramentas em locais padrão.

Vinculação de Node por agente (use o índice da lista de agentes na configuração):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI: a aba Nodes inclui um pequeno painel "Vinculação de Node exec" para as mesmas configurações.

## Substituições de sessão (`/exec`)

Use `/exec` para definir padrões **por sessão** para `host`, `security`, `ask` e `node`.
Envie `/exec` sem argumentos para mostrar os valores atuais.

Exemplo:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modelo de autorização

`/exec` só é respeitado para **remetentes autorizados** (listas de permissão/pareamento de canais mais `commands.useAccessGroups`).
Ele atualiza **somente o estado da sessão** e não grava a configuração. Remetentes autorizados de canais externos podem
definir esses padrões da sessão. Clientes internos de gateway/webchat precisam de `operator.admin` para persistir esses padrões.
Para desabilitar exec de forma rígida, negue-o pela política de ferramentas (`tools.deny: ["exec"]` ou por agente). Aprovações do host
ainda se aplicam, a menos que você defina explicitamente `security=full` e `ask=off`.

## Aprovações de exec (aplicativo complementar / host node)

Agentes em sandbox podem exigir aprovação por solicitação antes que `exec` seja executado no gateway ou no host node.
Consulte [Aprovações de exec](/pt-BR/tools/exec-approvals) para a política, a lista de permissão e o fluxo da UI.

Quando aprovações são exigidas, a ferramenta exec retorna imediatamente com
`status: "approval-pending"` e um id de aprovação. Depois de aprovada (ou negada / expirada),
o Gateway emite eventos de sistema de progresso e conclusão do comando apenas para execuções aprovadas
(`Exec running` / `Exec finished`). Aprovações negadas ou expiradas são terminais e não
acordam a sessão do agente com um evento de sistema de negação.
Em canais com cartões/botões nativos de aprovação, o agente deve depender primeiro dessa
UI nativa e incluir um comando manual `/approve` somente quando o resultado da ferramenta
disser explicitamente que aprovações pelo chat não estão disponíveis ou que a aprovação manual é o
único caminho.

## Lista de permissão + bins seguros

A aplicação manual da lista de permissão corresponde a globs de caminho binário resolvido e globs de nome de comando
sem caminho. Nomes sem caminho correspondem apenas a comandos invocados por PATH, portanto `rg` pode corresponder a
`/opt/homebrew/bin/rg` quando o comando é `rg`, mas não a `./rg` ou `/tmp/rg`.
Quando `security=allowlist`, comandos shell são permitidos automaticamente apenas se cada segmento de pipeline
estiver na lista de permissão ou for um bin seguro. Encadeamento (`;`, `&&`, `||`) e redirecionamentos
são rejeitados no modo de lista de permissão, a menos que cada segmento de nível superior satisfaça a
lista de permissão (incluindo bins seguros). Redirecionamentos continuam sem suporte.
A confiança durável `allow-always` não contorna essa regra: um comando encadeado ainda exige que cada
segmento de nível superior corresponda.

`autoAllowSkills` é um caminho de conveniência separado nas aprovações de exec. Não é o mesmo que
entradas manuais de lista de permissão de caminhos. Para confiança explícita estrita, mantenha `autoAllowSkills` desabilitado.

Use os dois controles para trabalhos diferentes:

- `tools.exec.safeBins`: filtros de fluxo pequenos, somente stdin.
- `tools.exec.safeBinTrustedDirs`: diretórios confiáveis extras explícitos para caminhos executáveis de bins seguros.
- `tools.exec.safeBinProfiles`: política argv explícita para bins seguros personalizados.
- lista de permissão: confiança explícita para caminhos executáveis.

Não trate `safeBins` como uma lista de permissão genérica e não adicione binários de interpretador/runtime (por exemplo, `python3`, `node`, `ruby`, `bash`). Se você precisar deles, use entradas explícitas de lista de permissão e mantenha prompts de aprovação habilitados.
`openclaw security audit` avisa quando entradas `safeBins` de interpretador/runtime estão sem perfis explícitos, e `openclaw doctor --fix` pode estruturar entradas `safeBinProfiles` personalizadas ausentes.
`openclaw security audit` e `openclaw doctor` também avisam quando você adiciona explicitamente bins de comportamento amplo, como `jq`, de volta a `safeBins`.
Se você permitir explicitamente interpretadores na lista de permissão, habilite `tools.exec.strictInlineEval` para que formas de avaliação de código inline ainda exijam revisor ou aprovação explícita.

Para detalhes e exemplos completos da política, consulte [Aprovações de exec](/pt-BR/tools/exec-approvals-advanced#safe-bins-stdin-only) e [Bins seguros versus lista de permissão](/pt-BR/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Exemplos

Primeiro plano:

```json
{ "tool": "exec", "command": "ls -la" }
```

Segundo plano + consulta:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

A consulta é para status sob demanda, não para loops de espera. Se o despertar automático por conclusão
estiver habilitado, o comando pode acordar a sessão quando emitir saída ou falhar.

Enviar teclas (estilo tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Enviar (envia apenas CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Colar (com delimitadores por padrão):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` é uma subferramenta de `exec` para edições estruturadas em vários arquivos.
Ela é habilitada por padrão para modelos OpenAI e OpenAI Codex. Use configuração somente
quando quiser desabilitá-la ou restringi-la a modelos específicos:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

Observações:

- Disponível apenas para modelos OpenAI/OpenAI Codex.
- A política de ferramentas ainda se aplica; `allow: ["write"]` permite implicitamente `apply_patch`.
- `deny: ["write"]` não nega `apply_patch`; negue `apply_patch` explicitamente ou use `deny: ["group:fs"]` quando gravações de patch também devem ser bloqueadas.
- A configuração fica em `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` tem padrão `true`; defina como `false` para desabilitar a ferramenta para modelos OpenAI.
- `tools.exec.applyPatch.workspaceOnly` tem padrão `true` (contido no workspace). Defina como `false` somente se você quiser intencionalmente que `apply_patch` grave/exclua fora do diretório do workspace.

## Relacionados

- [Aprovações de Exec](/pt-BR/tools/exec-approvals) — portões de aprovação para comandos shell
- [Sandboxing](/pt-BR/gateway/sandboxing) — execução de comandos em ambientes em sandbox
- [Processo em Segundo Plano](/pt-BR/gateway/background-process) — exec de longa duração e ferramenta process
- [Segurança](/pt-BR/gateway/security) — política de ferramentas e acesso elevado
