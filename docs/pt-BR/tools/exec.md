---
read_when:
    - Usar ou modificar a ferramenta exec
    - Depurar comportamento de stdin ou TTY
summary: Uso da ferramenta exec, modos de stdin e suporte a TTY
title: Ferramenta exec
x-i18n:
    generated_at: "2026-04-24T06:16:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cad17fecfaf7d6a523282ef4f0090e4ffaab89ab53945b5cd831e426f3fc3ac
    source_path: tools/exec.md
    workflow: 15
---

Execute comandos de shell no workspace. Oferece suporte a execução em primeiro plano + segundo plano por meio de `process`.
Se `process` não for permitido, `exec` será executado de forma síncrona e ignorará `yieldMs`/`background`.
Sessões em segundo plano têm escopo por agente; `process` só vê sessões do mesmo agente.

## Parâmetros

<ParamField path="command" type="string" required>
Comando de shell a ser executado.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Diretório de trabalho do comando.
</ParamField>

<ParamField path="env" type="object">
Sobrescritas de ambiente chave/valor mescladas sobre o ambiente herdado.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Envia automaticamente o comando para segundo plano após esse atraso (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Envia o comando imediatamente para segundo plano em vez de esperar `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="1800">
Mata o comando após esse número de segundos.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Executa em um pseudo-terminal quando disponível. Use para CLIs que exigem TTY, agentes de programação e interfaces de terminal.
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
ID/nome do Node quando `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Solicita modo elevado — sai do sandbox para o caminho de host configurado. `security=full` só é forçado quando o modo elevado resolve para `full`.
</ParamField>

Observações:

- `host` usa `auto` por padrão: sandbox quando o runtime de sandbox está ativo para a sessão, caso contrário gateway.
- `auto` é a estratégia padrão de roteamento, não um curinga. `host=node` por chamada é permitido a partir de `auto`; `host=gateway` por chamada só é permitido quando nenhum runtime de sandbox está ativo.
- Sem configuração extra, `host=auto` ainda “simplesmente funciona”: sem sandbox, ele resolve para `gateway`; com sandbox ativa, permanece no sandbox.
- `elevated` escapa do sandbox para o caminho de host configurado: `gateway` por padrão, ou `node` quando `tools.exec.host=node` (ou o padrão da sessão é `host=node`). Ele só está disponível quando o acesso elevado está ativado para a sessão/provedor atual.
- Aprovações de `gateway`/`node` são controladas por `~/.openclaw/exec-approvals.json`.
- `node` requer um Node pareado (app complementar ou host Node headless).
- Se houver múltiplos Nodes disponíveis, defina `exec.node` ou `tools.exec.node` para selecionar um.
- `exec host=node` é o único caminho de execução de shell para Nodes; o wrapper legado `nodes.run` foi removido.
- Em hosts não Windows, exec usa `SHELL` quando definido; se `SHELL` for `fish`, ele prefere `bash` (ou `sh`)
  do `PATH` para evitar scripts incompatíveis com fish e então recua para `SHELL` se nenhum dos dois existir.
- Em hosts Windows, exec prefere descobrir o PowerShell 7 (`pwsh`) (Program Files, ProgramW6432 e depois PATH),
  depois recua para o Windows PowerShell 5.1.
- Execução em host (`gateway`/`node`) rejeita sobrescritas de `env.PATH` e de loader (`LD_*`/`DYLD_*`) para
  evitar sequestro de binário ou injeção de código.
- O OpenClaw define `OPENCLAW_SHELL=exec` no ambiente do comando iniciado (incluindo execução PTY e sandbox) para que regras de shell/profile possam detectar o contexto da ferramenta exec.
- Importante: o sandboxing está **desativado por padrão**. Se o sandboxing estiver desativado, `host=auto`
  implícito resolve para `gateway`. `host=sandbox` explícito ainda falha em modo fail-closed, em vez de
  executar silenciosamente no host do gateway. Ative o sandboxing ou use `host=gateway` com aprovações.
- Verificações de preflight de script (para erros comuns de sintaxe de shell em Python/Node) só inspecionam arquivos dentro do
  limite efetivo de `workdir`. Se um caminho de script resolver para fora de `workdir`, o preflight será ignorado para
  esse arquivo.
- Para trabalhos de longa duração que começam agora, inicie-os uma vez e confie no
  acionamento automático de conclusão quando ele estiver ativado e o comando emitir saída ou falhar.
  Use `process` para logs, status, entrada ou intervenção; não emule
  agendamento com loops de sleep, loops de timeout ou polling repetido.
- Para trabalhos que devem acontecer depois ou em uma agenda, use Cron em vez de
  padrões de sleep/atraso com `exec`.

## Configuração

- `tools.exec.notifyOnExit` (padrão: true): quando verdadeiro, sessões exec em segundo plano colocam um evento de sistema na fila e solicitam um Heartbeat ao sair.
- `tools.exec.approvalRunningNoticeMs` (padrão: 10000): emite um único aviso “running” quando um exec controlado por aprovação executa por mais tempo do que isso (0 desativa).
- `tools.exec.host` (padrão: `auto`; resolve para `sandbox` quando o runtime de sandbox está ativo, `gateway` caso contrário)
- `tools.exec.security` (padrão: `deny` para sandbox, `full` para gateway + node quando não definido)
- `tools.exec.ask` (padrão: `off`)
- Exec em host sem aprovação é o padrão para gateway + node. Se você quiser comportamento de aprovações/allowlist, torne mais rígidos tanto `tools.exec.*` quanto o host `~/.openclaw/exec-approvals.json`; consulte [Aprovações de exec](/pt-BR/tools/exec-approvals#no-approval-yolo-mode).
- O modo YOLO vem dos padrões da política de host (`security=full`, `ask=off`), não de `host=auto`. Se quiser forçar roteamento para gateway ou node, defina `tools.exec.host` ou use `/exec host=...`.
- Em modo `security=full` mais `ask=off`, exec em host segue diretamente a política configurada; não há camada extra de pré-filtro heurístico de ofuscação de comando nem rejeição de preflight de script.
- `tools.exec.node` (padrão: não definido)
- `tools.exec.strictInlineEval` (padrão: false): quando verdadeiro, formas inline de eval de interpretador, como `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` e `osascript -e`, sempre exigem aprovação explícita. `allow-always` ainda pode persistir invocações benignas de interpretador/script, mas formas inline de eval continuarão pedindo aprovação a cada vez.
- `tools.exec.pathPrepend`: lista de diretórios a prefixar ao `PATH` para execuções exec (apenas gateway + sandbox).
- `tools.exec.safeBins`: binários seguros somente stdin que podem ser executados sem entradas explícitas de allowlist. Para detalhes de comportamento, consulte [Safe bins](/pt-BR/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: diretórios explícitos adicionais confiáveis para verificações de caminho de executável de `safeBins`. Entradas de `PATH` nunca são confiadas automaticamente. Os padrões internos são `/bin` e `/usr/bin`.
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

- `host=gateway`: mescla o `PATH` do seu shell de login ao ambiente exec. Sobrescritas de `env.PATH`
  são rejeitadas para execução em host. O próprio daemon ainda é executado com um `PATH` mínimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: executa `sh -lc` (shell de login) dentro do contêiner, então `/etc/profile` pode redefinir `PATH`.
  O OpenClaw prefixa `env.PATH` após o profile sourcing por meio de uma env var interna (sem interpolação de shell);
  `tools.exec.pathPrepend` também se aplica aqui.
- `host=node`: apenas sobrescritas de env não bloqueadas que você passar são enviadas ao Node. Sobrescritas de `env.PATH`
  são rejeitadas para execução em host e ignoradas por hosts Node. Se você precisar de entradas adicionais de PATH em um Node,
  configure o ambiente do serviço do host Node (systemd/launchd) ou instale ferramentas em locais padrão.

Binding de Node por agente (use o índice da lista de agentes na configuração):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: a aba Nodes inclui um pequeno painel “Exec node binding” para as mesmas configurações.

## Sobrescritas de sessão (`/exec`)

Use `/exec` para definir padrões **por sessão** para `host`, `security`, `ask` e `node`.
Envie `/exec` sem argumentos para mostrar os valores atuais.

Exemplo:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modelo de autorização

`/exec` só é respeitado para **remetentes autorizados** (allowlists/pareamento do canal mais `commands.useAccessGroups`).
Ele atualiza **apenas o estado da sessão** e não grava configuração. Para desativar rigidamente exec, negue-o por política de ferramenta (`tools.deny: ["exec"]` ou por agente). Aprovações de host ainda se aplicam, a menos que você defina explicitamente `security=full` e `ask=off`.

## Aprovações de exec (app complementar / host Node)

Agentes em sandbox podem exigir aprovação por requisição antes que `exec` seja executado no gateway ou host node.
Consulte [Aprovações de exec](/pt-BR/tools/exec-approvals) para a política, allowlist e fluxo de UI.

Quando aprovações são exigidas, a ferramenta exec retorna imediatamente com
`status: "approval-pending"` e um ID de aprovação. Uma vez aprovada (ou negada / expirada),
o Gateway emite eventos de sistema (`Exec finished` / `Exec denied`). Se o comando ainda
estiver em execução após `tools.exec.approvalRunningNoticeMs`, um único aviso `Exec running` será emitido.
Em canais com cards/botões nativos de aprovação, o agente deve confiar primeiro nessa
UI nativa e incluir um comando manual `/approve` apenas quando o resultado da
ferramenta disser explicitamente que aprovações via chat não estão disponíveis ou que a aprovação manual é o único caminho.

## Allowlist + safe bins

A aplicação manual de allowlist corresponde apenas a **caminhos resolvidos de binário** (sem correspondência por basename). Quando
`security=allowlist`, comandos de shell só são permitidos automaticamente se cada segmento do pipeline estiver
na allowlist ou for um safe bin. Encadeamento (`;`, `&&`, `||`) e redirecionamentos são rejeitados em
modo allowlist, a menos que cada segmento de nível superior satisfaça a allowlist (incluindo safe bins).
Redirecionamentos continuam não compatíveis.
A confiança durável de `allow-always` não contorna essa regra: um comando encadeado ainda exige que cada
segmento de nível superior corresponda.

`autoAllowSkills` é um caminho separado de conveniência em aprovações de exec. Não é o mesmo que
entradas manuais de allowlist por caminho. Para confiança estritamente explícita, mantenha `autoAllowSkills` desativado.

Use os dois controles para funções diferentes:

- `tools.exec.safeBins`: pequenos filtros de stream somente stdin.
- `tools.exec.safeBinTrustedDirs`: diretórios extras explicitamente confiáveis para caminhos de executável de safe-bin.
- `tools.exec.safeBinProfiles`: política explícita de argv para safe bins personalizadas.
- allowlist: confiança explícita para caminhos de executável.

Não trate `safeBins` como allowlist genérica e não adicione binários de interpretador/runtime (por exemplo `python3`, `node`, `ruby`, `bash`). Se você precisar deles, use entradas explícitas de allowlist e mantenha prompts de aprovação ativados.
`openclaw security audit` avisa quando entradas de `safeBins` para interpretador/runtime estão sem perfis explícitos, e `openclaw doctor --fix` pode gerar entradas ausentes de `safeBinProfiles`.
`openclaw security audit` e `openclaw doctor` também avisam quando você adiciona explicitamente bins de comportamento amplo, como `jq`, de volta a `safeBins`.
Se você explicitamente colocar interpretadores na allowlist, ative `tools.exec.strictInlineEval` para que formas inline de avaliação de código ainda exijam uma nova aprovação.

Para detalhes completos de política e exemplos, consulte [Aprovações de exec](/pt-BR/tools/exec-approvals-advanced#safe-bins-stdin-only) e [Safe bins versus allowlist](/pt-BR/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Exemplos

Primeiro plano:

```json
{ "tool": "exec", "command": "ls -la" }
```

Segundo plano + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Polling é para status sob demanda, não loops de espera. Se o acionamento automático de conclusão
estiver ativado, o comando pode despertar a sessão quando emitir saída ou falhar.

Enviar teclas (estilo tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Submit (enviar apenas CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Paste (com bracket por padrão):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` é uma subferramenta de `exec` para edições estruturadas em vários arquivos.
Ela é ativada por padrão para modelos OpenAI e OpenAI Codex. Use configuração apenas
quando quiser desativá-la ou restringi-la a modelos específicos:

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
- `tools.exec.applyPatch.enabled` usa `true` por padrão; defina como `false` para desativar a ferramenta para modelos OpenAI.
- `tools.exec.applyPatch.workspaceOnly` usa `true` por padrão (contido no workspace). Defina como `false` apenas se você quiser intencionalmente que `apply_patch` grave/exclua fora do diretório do workspace.

## Relacionado

- [Aprovações de exec](/pt-BR/tools/exec-approvals) — controles de aprovação para comandos de shell
- [Sandboxing](/pt-BR/gateway/sandboxing) — executar comandos em ambientes com sandbox
- [Processo em segundo plano](/pt-BR/gateway/background-process) — exec de longa duração e ferramenta de processo
- [Segurança](/pt-BR/gateway/security) — política de ferramenta e acesso elevado
