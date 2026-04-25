---
read_when:
    - Usando ou modificando a ferramenta Exec
    - Depurando comportamento de stdin ou TTY
summary: Uso da ferramenta Exec, modos de stdin e suporte a TTY
title: Ferramenta Exec
x-i18n:
    generated_at: "2026-04-25T13:57:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 358f9155120382fa2b03b22e22408bdb9e51715f80c8b1701a1ff7fd05850188
    source_path: tools/exec.md
    workflow: 15
---

Execute comandos de shell no workspace. Oferece suporte a execução em primeiro plano + em segundo plano via `process`.
Se `process` não for permitido, `exec` é executado de forma síncrona e ignora `yieldMs`/`background`.
Sessões em segundo plano têm escopo por agente; `process` vê apenas sessões do mesmo agente.

## Parâmetros

<ParamField path="command" type="string" required>
Comando shell a executar.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Diretório de trabalho do comando.
</ParamField>

<ParamField path="env" type="object">
Substituições de ambiente chave/valor mescladas sobre o ambiente herdado.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Coloca automaticamente o comando em segundo plano após esse atraso (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Coloca o comando em segundo plano imediatamente em vez de esperar por `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="1800">
Encerra o comando após esse número de segundos.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Executa em um pseudo-terminal quando disponível. Use para CLIs que exigem TTY, agentes de programação e UIs de terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Onde executar. `auto` resolve para `sandbox` quando um runtime de sandbox está ativo e `gateway` caso contrário.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Modo de aplicação para execução em `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Comportamento do prompt de aprovação para execução em `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Id/nome do nó quando `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Solicita modo elevado — sai do sandbox para o caminho de host configurado. `security=full` é forçado apenas quando elevated resolve para `full`.
</ParamField>

Observações:

- `host` usa `auto` por padrão: sandbox quando um runtime de sandbox está ativo para a sessão; caso contrário, gateway.
- `auto` é a estratégia de roteamento padrão, não um curinga. `host=node` por chamada é permitido a partir de `auto`; `host=gateway` por chamada só é permitido quando nenhum runtime de sandbox está ativo.
- Sem configuração extra, `host=auto` ainda “simplesmente funciona”: sem sandbox, resolve para `gateway`; com sandbox ativo, permanece no sandbox.
- `elevated` sai do sandbox para o caminho de host configurado: `gateway` por padrão, ou `node` quando `tools.exec.host=node` (ou o padrão da sessão é `host=node`). Só está disponível quando o acesso elevado está habilitado para a sessão/provedor atual.
- Aprovações de `gateway`/`node` são controladas por `~/.openclaw/exec-approvals.json`.
- `node` exige um nó pareado (app complementar ou host Node headless).
- Se vários nós estiverem disponíveis, defina `exec.node` ou `tools.exec.node` para selecionar um.
- `exec host=node` é o único caminho de execução de shell para nós; o wrapper legado `nodes.run` foi removido.
- Em hosts não Windows, exec usa `SHELL` quando definido; se `SHELL` for `fish`, ele prefere `bash` (ou `sh`)
  do `PATH` para evitar scripts incompatíveis com fish, e depois recorre a `SHELL` se nenhum dos dois existir.
- Em hosts Windows, exec prefere descobrir PowerShell 7 (`pwsh`) (Program Files, ProgramW6432 e depois PATH),
  e depois recorre ao Windows PowerShell 5.1.
- Execução no host (`gateway`/`node`) rejeita `env.PATH` e substituições de loader (`LD_*`/`DYLD_*`) para
  evitar sequestro de binário ou injeção de código.
- O OpenClaw define `OPENCLAW_SHELL=exec` no ambiente do comando iniciado (incluindo execução em PTY e sandbox) para que regras de shell/perfil possam detectar o contexto da ferramenta exec.
- Importante: o sandbox fica **desativado por padrão**. Se o sandbox estiver desativado, `host=auto`
  implícito resolve para `gateway`. `host=sandbox` explícito ainda falha de forma fechada em vez de executar silenciosamente
  no host do gateway. Habilite o sandbox ou use `host=gateway` com aprovações.
- Verificações preliminares de script (para erros comuns de sintaxe shell em Python/Node) inspecionam apenas arquivos dentro
  do limite efetivo de `workdir`. Se um caminho de script resolver para fora de `workdir`, a verificação preliminar será ignorada para
  esse arquivo.
- Para trabalho de longa duração que começa agora, inicie-o uma vez e conte com o
  wake automático na conclusão quando ele estiver habilitado e o comando emitir saída ou falhar.
  Use `process` para logs, status, entrada ou intervenção; não emule
  agendamento com loops de sleep, loops de timeout ou polling repetido.
- Para trabalho que deve acontecer depois ou em uma agenda, use Cron em vez de
  padrões de sleep/delay com `exec`.

## Configuração

- `tools.exec.notifyOnExit` (padrão: true): quando true, sessões exec em segundo plano colocam um evento de sistema na fila e solicitam um Heartbeat ao terminar.
- `tools.exec.approvalRunningNoticeMs` (padrão: 10000): emite um único aviso “running” quando um exec com controle de aprovação fica em execução por mais tempo do que isso (0 desabilita).
- `tools.exec.host` (padrão: `auto`; resolve para `sandbox` quando o runtime de sandbox está ativo, `gateway` caso contrário)
- `tools.exec.security` (padrão: `deny` para sandbox, `full` para gateway + node quando não definido)
- `tools.exec.ask` (padrão: `off`)
- Execução no host sem aprovação é o padrão para gateway + node. Se você quiser comportamento com aprovações/lista de permissões, restrinja `tools.exec.*` e também a política do host em `~/.openclaw/exec-approvals.json`; consulte [Aprovações de Exec](/pt-BR/tools/exec-approvals#no-approval-yolo-mode).
- YOLO vem dos padrões da política do host (`security=full`, `ask=off`), não de `host=auto`. Se quiser forçar roteamento para gateway ou node, defina `tools.exec.host` ou use `/exec host=...`.
- No modo `security=full` mais `ask=off`, a execução no host segue diretamente a política configurada; não há camada extra de pré-filtro heurístico para ofuscação de comando nem rejeição de verificação preliminar de script.
- `tools.exec.node` (padrão: não definido)
- `tools.exec.strictInlineEval` (padrão: false): quando true, formas de eval inline de interpretador, como `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` e `osascript -e`, sempre exigem aprovação explícita. `allow-always` ainda pode persistir invocações benignas de interpretador/script, mas formas inline-eval continuam pedindo confirmação a cada vez.
- `tools.exec.pathPrepend`: lista de diretórios a antepor ao `PATH` para execuções exec (apenas gateway + sandbox).
- `tools.exec.safeBins`: binários seguros somente-stdin que podem ser executados sem entradas explícitas na lista de permissões. Para detalhes do comportamento, consulte [Safe bins](/pt-BR/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: diretórios explícitos adicionais confiáveis para verificações de caminho de `safeBins`. Entradas de `PATH` nunca são automaticamente confiáveis. Os padrões integrados são `/bin` e `/usr/bin`.
- `tools.exec.safeBinProfiles`: política opcional personalizada de argv por safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: mescla seu `PATH` do shell de login ao ambiente do exec. Substituições de
  `env.PATH` são rejeitadas para execução no host. O próprio daemon ainda roda com um `PATH` mínimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: executa `sh -lc` (shell de login) dentro do contêiner, então `/etc/profile` pode redefinir `PATH`.
  O OpenClaw antepõe `env.PATH` após o carregamento do perfil por meio de uma variável env interna (sem interpolação shell);
  `tools.exec.pathPrepend` também se aplica aqui.
- `host=node`: apenas substituições de ambiente não bloqueadas que você passar são enviadas ao nó. Substituições de `env.PATH`
  são rejeitadas para execução no host e ignoradas por hosts Node. Se você precisar de entradas adicionais de PATH em um nó,
  configure o ambiente do serviço de host Node (systemd/launchd) ou instale ferramentas em locais padrão.

Vinculação de nó por agente (use o índice da lista de agentes na configuração):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: a aba Nodes inclui um pequeno painel “Exec node binding” para as mesmas configurações.

## Substituições por sessão (`/exec`)

Use `/exec` para definir padrões **por sessão** para `host`, `security`, `ask` e `node`.
Envie `/exec` sem argumentos para mostrar os valores atuais.

Exemplo:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modelo de autorização

`/exec` só é aceito para **remetentes autorizados** (listas de permissões/pareamento do canal mais `commands.useAccessGroups`).
Ele atualiza apenas o **estado da sessão** e não grava configuração. Para desabilitar completamente exec, negue-o via
política de ferramenta (`tools.deny: ["exec"]` ou por agente). Aprovações de host ainda se aplicam, a menos que você defina explicitamente
`security=full` e `ask=off`.

## Aprovações de Exec (app complementar / host Node)

Agentes com sandbox podem exigir aprovação por solicitação antes que `exec` seja executado no gateway ou no host Node.
Consulte [Aprovações de Exec](/pt-BR/tools/exec-approvals) para política, lista de permissões e fluxo da UI.

Quando aprovações são exigidas, a ferramenta exec retorna imediatamente com
`status: "approval-pending"` e um id de aprovação. Depois que aprovado (ou negado / expirado),
o Gateway emite eventos de sistema (`Exec finished` / `Exec denied`). Se o comando ainda estiver
em execução após `tools.exec.approvalRunningNoticeMs`, um único aviso `Exec running` é emitido.
Em canais com cartões/botões nativos de aprovação, o agente deve contar com essa
UI nativa primeiro e só incluir um comando manual `/approve` quando o
resultado da ferramenta disser explicitamente que aprovações pelo chat não estão disponíveis ou que a aprovação manual é o
único caminho.

## Lista de permissões + safe bins

A aplicação manual de lista de permissões corresponde a globs de caminho resolvido de binário e globs simples de nome de comando.
Nomes simples correspondem apenas a comandos invocados via PATH, então `rg` pode corresponder a
`/opt/homebrew/bin/rg` quando o comando é `rg`, mas não a `./rg` nem `/tmp/rg`.
Quando `security=allowlist`, comandos shell são permitidos automaticamente apenas se cada segmento do pipeline
estiver na lista de permissões ou for um safe bin. Encadeamento (`;`, `&&`, `||`) e redirecionamentos
são rejeitados no modo allowlist, a menos que cada segmento de nível superior satisfaça a
lista de permissões (incluindo safe bins). Redirecionamentos continuam não compatíveis.
Confiança persistente `allow-always` não contorna essa regra: um comando encadeado ainda exige que cada
segmento de nível superior corresponda.

`autoAllowSkills` é um caminho separado de conveniência nas aprovações de exec. Não é o mesmo que
entradas manuais de lista de permissões por caminho. Para confiança explícita estrita, mantenha `autoAllowSkills` desabilitado.

Use os dois controles para trabalhos diferentes:

- `tools.exec.safeBins`: pequenos filtros de stream somente-stdin.
- `tools.exec.safeBinTrustedDirs`: diretórios extras explicitamente confiáveis para caminhos executáveis de safe-bin.
- `tools.exec.safeBinProfiles`: política explícita de argv para safe bins personalizados.
- allowlist: confiança explícita para caminhos executáveis.

Não trate `safeBins` como uma lista de permissões genérica e não adicione binários de interpretador/runtime (por exemplo `python3`, `node`, `ruby`, `bash`). Se precisar deles, use entradas explícitas de lista de permissões e mantenha prompts de aprovação habilitados.
`openclaw security audit` avisa quando entradas `safeBins` de interpretador/runtime não têm perfis explícitos, e `openclaw doctor --fix` pode criar entradas ausentes de `safeBinProfiles`.
`openclaw security audit` e `openclaw doctor` também avisam quando você adiciona explicitamente binários de comportamento amplo como `jq` de volta a `safeBins`.
Se você permitir explicitamente intérpretes na lista de permissões, habilite `tools.exec.strictInlineEval` para que formas de avaliação de código inline ainda exijam uma nova aprovação.

Para detalhes completos da política e exemplos, consulte [Aprovações de Exec](/pt-BR/tools/exec-approvals-advanced#safe-bins-stdin-only) e [Safe bins versus allowlist](/pt-BR/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Exemplos

Primeiro plano:

```json
{ "tool": "exec", "command": "ls -la" }
```

Segundo plano + polling:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Polling é para status sob demanda, não para loops de espera. Se o wake automático na conclusão
estiver habilitado, o comando pode despertar a sessão quando emitir saída ou falhar.

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

Colar (entre colchetes por padrão):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` é uma subferramenta de `exec` para edições estruturadas em vários arquivos.
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
- A política de ferramenta ainda se aplica; `allow: ["write"]` permite implicitamente `apply_patch`.
- A configuração fica em `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` usa `true` por padrão; defina como `false` para desabilitar a ferramenta para modelos OpenAI.
- `tools.exec.applyPatch.workspaceOnly` usa `true` por padrão (contido no workspace). Defina como `false` apenas se você intencionalmente quiser que `apply_patch` grave/exclua fora do diretório de workspace.

## Relacionado

- [Aprovações de Exec](/pt-BR/tools/exec-approvals) — bloqueios de aprovação para comandos shell
- [Sandboxing](/pt-BR/gateway/sandboxing) — executando comandos em ambientes com sandbox
- [Processo em segundo plano](/pt-BR/gateway/background-process) — execução de longa duração e ferramenta process
- [Segurança](/pt-BR/gateway/security) — política de ferramentas e acesso elevado
