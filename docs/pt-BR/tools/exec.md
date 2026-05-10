---
read_when:
    - Usar ou modificar a ferramenta exec
    - Depuração do comportamento de stdin ou TTY
summary: Uso da ferramenta Exec, modos de stdin e suporte a TTY
title: Ferramenta de execução
x-i18n:
    generated_at: "2026-05-10T19:51:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 445b09c1c6cdc1998c1c2a6b1223fdef438011413d246c4de0de0436465b448f
    source_path: tools/exec.md
    workflow: 16
---

Execute comandos de shell no workspace. `exec` é uma superfície de shell mutável: os comandos podem criar, editar ou excluir arquivos onde quer que o host selecionado ou o sistema de arquivos da sandbox permita. Desabilitar ferramentas de sistema de arquivos do OpenClaw, como `write`, `edit` ou `apply_patch`, não torna `exec` somente leitura.

Oferece suporte a execução em primeiro plano + segundo plano via `process`. Se `process` não for permitido, `exec` executa de forma síncrona e ignora `yieldMs`/`background`.
Sessões em segundo plano têm escopo por agente; `process` vê apenas sessões do mesmo agente.

## Parâmetros

<ParamField path="command" type="string" required>
Comando de shell a executar.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Diretório de trabalho para o comando.
</ParamField>

<ParamField path="env" type="object">
Substituições de ambiente de chave/valor mescladas sobre o ambiente herdado.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Coloque o comando automaticamente em segundo plano após esse atraso (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Coloque o comando em segundo plano imediatamente em vez de aguardar `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Substitui o timeout de exec configurado para esta chamada. Defina `timeout: 0` somente quando o comando deve executar sem o timeout do processo exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Executa em um pseudoterminal quando disponível. Use para CLIs que exigem TTY, agentes de codificação e UIs de terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Onde executar. `auto` resolve para `sandbox` quando um runtime de sandbox está ativo e para `gateway` caso contrário.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Modo de aplicação para execução em `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Comportamento do prompt de aprovação para execução em `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
ID/nome do Node quando `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Solicita modo elevado — sai da sandbox para o caminho de host configurado. `security=full` é forçado somente quando elevated resolve para `full`.
</ParamField>

Observações:

- `host` tem como padrão `auto`: sandbox quando o runtime de sandbox está ativo para a sessão, caso contrário gateway.
- `host` aceita apenas `auto`, `sandbox`, `gateway` ou `node`. Ele não é um seletor de hostname; valores semelhantes a hostname são rejeitados antes da execução do comando.
- `auto` é a estratégia de roteamento padrão, não um curinga. `host=node` por chamada é permitido a partir de `auto`; `host=gateway` por chamada só é permitido quando nenhum runtime de sandbox está ativo.
- Sem configuração extra, `host=auto` ainda "simplesmente funciona": sem sandbox, resolve para `gateway`; com uma sandbox ativa, permanece na sandbox.
- `elevated` sai da sandbox para o caminho de host configurado: `gateway` por padrão, ou `node` quando `tools.exec.host=node` (ou o padrão da sessão é `host=node`). Ele só está disponível quando o acesso elevado está habilitado para a sessão/provedor atual.
- Aprovações de `gateway`/`node` são controladas por `~/.openclaw/exec-approvals.json`.
- `node` requer um Node pareado (app complementar ou host de Node headless).
- Se vários Nodes estiverem disponíveis, defina `exec.node` ou `tools.exec.node` para selecionar um.
- `exec host=node` é o único caminho de execução de shell para Nodes; o wrapper legado `nodes.run` foi removido.
- `timeout` se aplica a execução em primeiro plano, em segundo plano, `yieldMs`, gateway, sandbox e Node `system.run`. Se omitido, o OpenClaw usa `tools.exec.timeoutSec`; `timeout: 0` explícito desabilita o timeout do processo exec para essa chamada.
- Em hosts que não são Windows, exec usa `SHELL` quando definido; se `SHELL` for `fish`, ele prefere `bash` (ou `sh`)
  de `PATH` para evitar scripts incompatíveis com fish, depois volta para `SHELL` se nenhum existir.
- Em hosts Windows, exec prefere a descoberta do PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, depois PATH),
  depois volta para Windows PowerShell 5.1.
- A execução no host (`gateway`/`node`) rejeita `env.PATH` e substituições de loader (`LD_*`/`DYLD_*`) para
  evitar sequestro de binários ou código injetado.
- O OpenClaw define `OPENCLAW_SHELL=exec` no ambiente do comando gerado (incluindo execução em PTY e sandbox) para que regras de shell/profile possam detectar o contexto da ferramenta exec.
- `openclaw channels login` é bloqueado em `exec` porque é um fluxo interativo de autenticação de canal; execute-o em um terminal no host Gateway ou use a ferramenta de login nativa do canal pelo chat quando existir.
- Importante: sandboxing fica **desativado por padrão**. Se sandboxing estiver desativado, `host=auto`
  implícito resolve para `gateway`. `host=sandbox` explícito ainda falha de forma fechada em vez de executar silenciosamente
  no host Gateway. Habilite sandboxing ou use `host=gateway` com aprovações.
- Verificações de preflight de script (para erros comuns de sintaxe de shell em Python/Node) inspecionam apenas arquivos dentro do
  limite efetivo de `workdir`. Se um caminho de script resolve para fora de `workdir`, o preflight é ignorado para
  esse arquivo.
- Para trabalho de longa duração que começa agora, inicie-o uma vez e confie no
  acionamento automático de conclusão quando ele estiver habilitado e o comando emitir saída ou falhar.
  Use `process` para logs, status, entrada ou intervenção; não emule
  agendamento com loops de sleep, loops de timeout ou polling repetido.
- Para trabalho que deve acontecer depois ou em um cronograma, use Cron em vez de
  padrões de sleep/atraso com `exec`.

## Configuração

- `tools.exec.notifyOnExit` (padrão: true): quando true, sessões exec em segundo plano enfileiram um evento de sistema e solicitam um Heartbeat ao sair.
- `tools.exec.approvalRunningNoticeMs` (padrão: 10000): emite um único aviso de "em execução" quando um exec condicionado a aprovação executa por mais tempo que isso (0 desabilita).
- `tools.exec.timeoutSec` (padrão: 1800): timeout padrão de exec por comando em segundos. `timeout` por chamada o substitui; `timeout: 0` por chamada desabilita o timeout do processo exec.
- `tools.exec.host` (padrão: `auto`; resolve para `sandbox` quando o runtime de sandbox está ativo, `gateway` caso contrário)
- `tools.exec.security` (padrão: `deny` para sandbox, `full` para gateway + Node quando não definido)
- `tools.exec.ask` (padrão: `off`)
- Exec no host sem aprovação é o padrão para gateway + Node. Se você quiser comportamento de aprovações/allowlist, restrinja tanto `tools.exec.*` quanto o `~/.openclaw/exec-approvals.json` do host; consulte [Aprovações de exec](/pt-BR/tools/exec-approvals#yolo-mode-no-approval).
- YOLO vem dos padrões de política do host (`security=full`, `ask=off`), não de `host=auto`. Se você quiser forçar roteamento para gateway ou Node, defina `tools.exec.host` ou use `/exec host=...`.
- No modo `security=full` mais `ask=off`, o exec no host segue a política configurada diretamente; não há nenhuma camada extra de pré-filtro heurístico de ofuscação de comando nem rejeição de preflight de script.
- `tools.exec.node` (padrão: não definido)
- `tools.exec.strictInlineEval` (padrão: false): quando true, formas de eval inline de interpretadores, como `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` e `osascript -e`, sempre exigem aprovação explícita. `allow-always` ainda pode persistir invocações benignas de interpretador/script, mas formas de eval inline ainda exibem prompt a cada vez.
- `tools.exec.pathPrepend`: lista de diretórios a acrescentar ao início de `PATH` para execuções exec (gateway + sandbox somente).
- `tools.exec.safeBins`: binários seguros somente stdin que podem executar sem entradas explícitas de allowlist. Para detalhes de comportamento, consulte [Bins seguros](/pt-BR/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: diretórios explícitos adicionais confiáveis para verificações de caminho de `safeBins`. Entradas de `PATH` nunca são confiáveis automaticamente. Os padrões integrados são `/bin` e `/usr/bin`.
- `tools.exec.safeBinProfiles`: política argv personalizada opcional por bin seguro (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: mescla o `PATH` do seu shell de login ao ambiente exec. Substituições de `env.PATH` são
  rejeitadas para execução no host. O daemon em si ainda executa com um `PATH` mínimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: executa `sh -lc` (shell de login) dentro do contêiner, então `/etc/profile` pode redefinir `PATH`.
  O OpenClaw acrescenta `env.PATH` ao início depois do carregamento do profile via uma variável de ambiente interna (sem interpolação de shell);
  `tools.exec.pathPrepend` também se aplica aqui.
- `host=node`: somente substituições de env não bloqueadas que você passar são enviadas ao Node. Substituições de `env.PATH` são
  rejeitadas para execução no host e ignoradas por hosts de Node. Se você precisar de entradas PATH adicionais em um Node,
  configure o ambiente do serviço do host de Node (systemd/launchd) ou instale ferramentas em locais padrão.

Vinculação de Node por agente (use o índice da lista de agentes na configuração):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

UI de controle: a aba Nodes inclui um pequeno painel "Vinculação de Node exec" para as mesmas configurações.

## Substituições de sessão (`/exec`)

Use `/exec` para definir padrões **por sessão** para `host`, `security`, `ask` e `node`.
Envie `/exec` sem argumentos para mostrar os valores atuais.

Exemplo:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modelo de autorização

`/exec` só é respeitado para **remetentes autorizados** (allowlists/pareamento de canal mais `commands.useAccessGroups`).
Ele atualiza **somente o estado da sessão** e não grava configuração. Para desabilitar exec rigidamente, negue-o via política de ferramenta
(`tools.deny: ["exec"]` ou por agente). Aprovações de host ainda se aplicam, a menos que você defina explicitamente
`security=full` e `ask=off`.

## Aprovações de exec (app complementar / host de Node)

Agentes em sandbox podem exigir aprovação por solicitação antes que `exec` execute no Gateway ou no host de Node.
Consulte [Aprovações de exec](/pt-BR/tools/exec-approvals) para a política, allowlist e fluxo de UI.

Quando aprovações são exigidas, a ferramenta exec retorna imediatamente com
`status: "approval-pending"` e um ID de aprovação. Depois de aprovada (ou negada / expirada),
o Gateway emite eventos de sistema (`Exec finished` / `Exec denied`). Se o comando ainda estiver
em execução depois de `tools.exec.approvalRunningNoticeMs`, um único aviso `Exec running` é emitido.
Em canais com cartões/botões de aprovação nativos, o agente deve confiar primeiro nessa
UI nativa e incluir um comando manual `/approve` somente quando o resultado da ferramenta
disser explicitamente que aprovações por chat estão indisponíveis ou que a aprovação manual é o
único caminho.

## Allowlist + bins seguros

A aplicação manual de allowlist corresponde a globs de caminho de binário resolvido e globs
de nome de comando simples. Nomes simples correspondem apenas a comandos invocados por PATH, então `rg` pode corresponder a
`/opt/homebrew/bin/rg` quando o comando é `rg`, mas não a `./rg` ou `/tmp/rg`.
Quando `security=allowlist`, comandos de shell são permitidos automaticamente somente se todos os segmentos de pipeline
estiverem na allowlist ou forem um bin seguro. Encadeamento (`;`, `&&`, `||`) e redirecionamentos
são rejeitados no modo allowlist, a menos que todos os segmentos de nível superior satisfaçam a
allowlist (incluindo bins seguros). Redirecionamentos continuam sem suporte.
Confiança durável `allow-always` não ignora essa regra: um comando encadeado ainda exige que todos os
segmentos de nível superior correspondam.

`autoAllowSkills` é um caminho de conveniência separado em aprovações de exec. Não é o mesmo que
entradas manuais de allowlist de caminho. Para confiança explícita estrita, mantenha `autoAllowSkills` desabilitado.

Use os dois controles para trabalhos diferentes:

- `tools.exec.safeBins`: filtros de fluxo pequenos, somente stdin.
- `tools.exec.safeBinTrustedDirs`: diretórios confiáveis extras explícitos para caminhos executáveis de bin seguro.
- `tools.exec.safeBinProfiles`: política argv explícita para bins seguros personalizados.
- allowlist: confiança explícita para caminhos executáveis.

Não trate `safeBins` como uma lista de permissões genérica, e não adicione binários de interpretador/runtime (por exemplo `python3`, `node`, `ruby`, `bash`). Se precisar deles, use entradas explícitas de lista de permissões e mantenha as solicitações de aprovação habilitadas.
`openclaw security audit` avisa quando entradas de interpretador/runtime em `safeBins` não têm perfis explícitos, e `openclaw doctor --fix` pode criar a estrutura de entradas personalizadas ausentes em `safeBinProfiles`.
`openclaw security audit` e `openclaw doctor` também avisam quando você adiciona explicitamente bins de comportamento amplo, como `jq`, de volta a `safeBins`.
Se você colocar interpretadores explicitamente na lista de permissões, habilite `tools.exec.strictInlineEval` para que formas de avaliação de código inline ainda exijam uma nova aprovação.

Para detalhes completos da política e exemplos, consulte [Aprovações de exec](/pt-BR/tools/exec-approvals-advanced#safe-bins-stdin-only) e [Bins seguros versus lista de permissões](/pt-BR/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

A consulta é para status sob demanda, não para loops de espera. Se o despertar
por conclusão automática estiver habilitado, o comando pode despertar a sessão quando emitir saída ou falhar.

Enviar teclas (estilo tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Enviar (enviar apenas CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Colar (entre delimitadores por padrão):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` é uma subferramenta de `exec` para edições estruturadas em múltiplos arquivos.
Ela é habilitada por padrão para modelos OpenAI e OpenAI Codex. Use configuração apenas
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
- `tools.exec.applyPatch.enabled` assume `true` por padrão; defina como `false` para desabilitar a ferramenta para modelos OpenAI.
- `tools.exec.applyPatch.workspaceOnly` assume `true` por padrão (contido no workspace). Defina como `false` apenas se você quiser intencionalmente que `apply_patch` grave/exclua fora do diretório do workspace.

## Relacionados

- [Aprovações de Exec](/pt-BR/tools/exec-approvals) — barreiras de aprovação para comandos shell
- [Sandboxing](/pt-BR/gateway/sandboxing) — execução de comandos em ambientes isolados
- [Processo em segundo plano](/pt-BR/gateway/background-process) — exec de longa duração e ferramenta de processo
- [Segurança](/pt-BR/gateway/security) — política de ferramentas e acesso elevado
