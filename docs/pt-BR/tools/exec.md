---
read_when:
    - Usar ou modificar a ferramenta exec
    - Depurar comportamento de stdin ou TTY
summary: Uso da ferramenta exec, modos de stdin e suporte a TTY
title: Ferramenta Exec
x-i18n:
    generated_at: "2026-04-06T03:12:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 28388971c627292dba9bf65ae38d7af8cde49a33bb3b5fc8b20da4f0e350bedd
    source_path: tools/exec.md
    workflow: 15
---

# Ferramenta exec

Execute comandos de shell no workspace. Oferece suporte à execução em primeiro plano + em segundo plano via `process`.
Se `process` não for permitido, `exec` será executado de forma síncrona e ignorará `yieldMs`/`background`.
As sessões em segundo plano têm escopo por agente; `process` só vê sessões do mesmo agente.

## Parâmetros

- `command` (obrigatório)
- `workdir` (o padrão é cwd)
- `env` (sobrescritas de chave/valor)
- `yieldMs` (padrão 10000): envia automaticamente para segundo plano após um atraso
- `background` (bool): enviar imediatamente para segundo plano
- `timeout` (segundos, padrão 1800): encerra ao expirar
- `pty` (bool): executa em um pseudo-terminal quando disponível (CLIs somente TTY, agentes de coding, UIs de terminal)
- `host` (`auto | sandbox | gateway | node`): onde executar
- `security` (`deny | allowlist | full`): modo de aplicação para `gateway`/`node`
- `ask` (`off | on-miss | always`): prompts de aprovação para `gateway`/`node`
- `node` (string): id/nome do node para `host=node`
- `elevated` (bool): solicita modo elevado (sair do sandbox para o caminho de host configurado); `security=full` só é forçado quando elevated é resolvido para `full`

Observações:

- `host` usa `auto` por padrão: sandbox quando o runtime de sandbox está ativo para a sessão, caso contrário gateway.
- `auto` é a estratégia de roteamento padrão, não um curinga. `host=node` por chamada é permitido a partir de `auto`; `host=gateway` por chamada só é permitido quando nenhum runtime de sandbox estiver ativo.
- Sem configuração extra, `host=auto` ainda “simplesmente funciona”: sem sandbox ele é resolvido para `gateway`; com um sandbox ativo ele permanece no sandbox.
- `elevated` sai do sandbox para o caminho de host configurado: `gateway` por padrão, ou `node` quando `tools.exec.host=node` (ou o padrão da sessão é `host=node`). Só está disponível quando o acesso elevado está habilitado para a sessão/provider atual.
- Aprovações de `gateway`/`node` são controladas por `~/.openclaw/exec-approvals.json`.
- `node` exige um node pareado (app complementar ou host node headless).
- Se vários nodes estiverem disponíveis, defina `exec.node` ou `tools.exec.node` para selecionar um.
- `exec host=node` é o único caminho de execução de shell para nodes; o wrapper legado `nodes.run` foi removido.
- Em hosts que não sejam Windows, exec usa `SHELL` quando definido; se `SHELL` for `fish`, ele prefere `bash` (ou `sh`)
  do `PATH` para evitar scripts incompatíveis com fish, e depois usa `SHELL` se nenhum deles existir.
- Em hosts Windows, exec prefere descobrir o PowerShell 7 (`pwsh`) (Program Files, ProgramW6432 e depois PATH),
  e então recua para o Windows PowerShell 5.1.
- A execução no host (`gateway`/`node`) rejeita `env.PATH` e sobrescritas de loader (`LD_*`/`DYLD_*`) para
  evitar sequestro de binários ou injeção de código.
- O OpenClaw define `OPENCLAW_SHELL=exec` no ambiente do comando gerado (incluindo PTY e execução em sandbox) para que regras de shell/profile possam detectar o contexto da ferramenta exec.
- Importante: o sandboxing está **desativado por padrão**. Se o sandboxing estiver desativado, `host=auto`
  implícito será resolvido para `gateway`. `host=sandbox` explícito ainda falha em modo fechado em vez de
  executar silenciosamente no host do gateway. Ative o sandboxing ou use `host=gateway` com aprovações.
- As verificações preliminares de script (para erros comuns de sintaxe de shell em Python/Node) inspecionam apenas arquivos dentro do
  limite efetivo de `workdir`. Se um caminho de script for resolvido fora de `workdir`, a verificação preliminar será ignorada para
  esse arquivo.
- Para trabalhos de longa duração que começam agora, inicie uma vez e conte com o
  despertar automático na conclusão quando isso estiver habilitado e o comando emitir saída ou falhar.
  Use `process` para logs, status, entrada ou intervenção; não emule
  agendamento com loops de sleep, loops de timeout ou polling repetido.
- Para trabalho que deve acontecer depois ou em um agendamento, use cron em vez de
  padrões de sleep/delay com `exec`.

## Configuração

- `tools.exec.notifyOnExit` (padrão: true): quando true, sessões de exec em segundo plano colocam um evento do sistema na fila e solicitam um heartbeat ao sair.
- `tools.exec.approvalRunningNoticeMs` (padrão: 10000): emite um único aviso de “em execução” quando um exec protegido por aprovação roda por mais tempo que isso (0 desativa).
- `tools.exec.host` (padrão: `auto`; resolve para `sandbox` quando o runtime de sandbox está ativo, `gateway` caso contrário)
- `tools.exec.security` (padrão: `deny` para sandbox, `full` para gateway + node quando não definido)
- `tools.exec.ask` (padrão: `off`)
- Execução no host sem aprovação é o padrão para gateway + node. Se você quiser comportamento com aprovações/allowlist, restrinja tanto `tools.exec.*` quanto o `~/.openclaw/exec-approvals.json` do host; consulte [Aprovações do exec](/pt-BR/tools/exec-approvals#no-approval-yolo-mode).
- O modo YOLO vem dos padrões da política do host (`security=full`, `ask=off`), não de `host=auto`. Se você quiser forçar o roteamento por gateway ou node, defina `tools.exec.host` ou use `/exec host=...`.
- No modo `security=full` mais `ask=off`, a execução no host segue diretamente a política configurada; não há filtro heurístico extra de pré-verificação de ofuscação de comando.
- `tools.exec.node` (padrão: não definido)
- `tools.exec.strictInlineEval` (padrão: false): quando true, formas inline de avaliação por interpretador como `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` e `osascript -e` sempre exigem aprovação explícita. `allow-always` ainda pode persistir invocações benignas de interpretador/script, mas formas inline-eval continuam solicitando aprovação a cada vez.
- `tools.exec.pathPrepend`: lista de diretórios a acrescentar no início de `PATH` para execuções de exec (apenas gateway + sandbox).
- `tools.exec.safeBins`: binários seguros somente-stdin que podem ser executados sem entradas explícitas de allowlist. Para detalhes do comportamento, consulte [Safe bins](/pt-BR/tools/exec-approvals#safe-bins-stdin-only).
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

- `host=gateway`: mescla o `PATH` do seu shell de login no ambiente do exec. Sobrescritas de `env.PATH`
  são rejeitadas para execução no host. O próprio daemon ainda roda com um `PATH` mínimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: executa `sh -lc` (shell de login) dentro do contêiner, então `/etc/profile` pode redefinir `PATH`.
  O OpenClaw acrescenta `env.PATH` no início após o carregamento do profile por meio de uma variável de ambiente interna (sem interpolação de shell);
  `tools.exec.pathPrepend` também se aplica aqui.
- `host=node`: apenas sobrescritas de env não bloqueadas que você passar são enviadas ao node. Sobrescritas de `env.PATH`
  são rejeitadas para execução no host e ignoradas por hosts node. Se você precisar de entradas adicionais em PATH em um node,
  configure o ambiente do serviço do host node (systemd/launchd) ou instale ferramentas em locais padrão.

Vínculo de node por agente (use o índice da lista de agentes na configuração):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: a aba Nodes inclui um pequeno painel “Exec node binding” para as mesmas configurações.

## Sobrescritas por sessão (`/exec`)

Use `/exec` para definir padrões **por sessão** para `host`, `security`, `ask` e `node`.
Envie `/exec` sem argumentos para mostrar os valores atuais.

Exemplo:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modelo de autorização

`/exec` só é respeitado para **remetentes autorizados** (allowlists/pareamento de canais mais `commands.useAccessGroups`).
Ele atualiza **apenas o estado da sessão** e não grava configuração. Para desativar exec de forma rígida, negue-o via
política de ferramentas (`tools.deny: ["exec"]` ou por agente). Aprovações do host ainda se aplicam, a menos que você defina explicitamente
`security=full` e `ask=off`.

## Aprovações do exec (app complementar / host node)

Agentes em sandbox podem exigir aprovação por solicitação antes que `exec` rode no host gateway ou node.
Consulte [Aprovações do exec](/pt-BR/tools/exec-approvals) para ver a política, allowlist e fluxo de UI.

Quando aprovações são exigidas, a ferramenta exec retorna imediatamente com
`status: "approval-pending"` e um id de aprovação. Depois que for aprovada (ou negada / expirada),
o Gateway emite eventos do sistema (`Exec finished` / `Exec denied`). Se o comando ainda estiver
em execução após `tools.exec.approvalRunningNoticeMs`, um único aviso `Exec running` será emitido.
Em canais com cartões/botões nativos de aprovação, o agente deve contar primeiro com essa
UI nativa e só incluir um comando manual `/approve` quando o resultado da ferramenta
disser explicitamente que aprovações por chat não estão disponíveis ou que aprovação manual é o
único caminho.

## Allowlist + safe bins

A aplicação manual da allowlist corresponde apenas a **caminhos de binário resolvidos** (sem correspondência por basename). Quando
`security=allowlist`, comandos de shell só são permitidos automaticamente se cada segmento do pipeline estiver
na allowlist ou for um safe bin. Encadeamento (`;`, `&&`, `||`) e redirecionamentos são rejeitados em
modo allowlist, a menos que cada segmento de nível superior satisfaça a allowlist (incluindo safe bins).
Redirecionamentos continuam sem suporte.
A confiança durável `allow-always` não contorna essa regra: um comando encadeado ainda exige que cada
segmento de nível superior corresponda.

`autoAllowSkills` é um caminho de conveniência separado em aprovações do exec. Não é o mesmo que
entradas manuais de allowlist por caminho. Para confiança estrita e explícita, mantenha `autoAllowSkills` desativado.

Use os dois controles para funções diferentes:

- `tools.exec.safeBins`: pequenos filtros de stream somente-stdin.
- `tools.exec.safeBinTrustedDirs`: diretórios extras explicitamente confiáveis para caminhos executáveis de safe bins.
- `tools.exec.safeBinProfiles`: política explícita de argv para safe bins personalizados.
- allowlist: confiança explícita para caminhos executáveis.

Não trate `safeBins` como uma allowlist genérica e não adicione binários de interpretador/runtime (por exemplo `python3`, `node`, `ruby`, `bash`). Se você precisar deles, use entradas explícitas de allowlist e mantenha prompts de aprovação habilitados.
`openclaw security audit` avisa quando entradas de interpretador/runtime em `safeBins` não têm perfis explícitos, e `openclaw doctor --fix` pode criar entradas personalizadas ausentes em `safeBinProfiles`.
`openclaw security audit` e `openclaw doctor` também avisam quando você adiciona explicitamente bins de comportamento amplo, como `jq`, de volta em `safeBins`.
Se você permitir explicitamente interpretadores por allowlist, ative `tools.exec.strictInlineEval` para que formas inline de avaliação de código ainda exijam uma nova aprovação.

Para detalhes completos de política e exemplos, consulte [Aprovações do exec](/pt-BR/tools/exec-approvals#safe-bins-stdin-only) e [Safe bins versus allowlist](/pt-BR/tools/exec-approvals#safe-bins-versus-allowlist).

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

Polling serve para status sob demanda, não para loops de espera. Se o despertar automático na conclusão
estiver habilitado, o comando pode despertar a sessão quando emitir saída ou falhar.

Enviar teclas (estilo tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Enviar (mandar apenas CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Colar (com brackets por padrão):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` é uma subferramenta de `exec` para edições estruturadas em vários arquivos.
Ela vem habilitada por padrão para modelos OpenAI e OpenAI Codex. Use configuração apenas
quando quiser desativá-la ou restringi-la a modelos específicos:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

Observações:

- Disponível apenas para modelos OpenAI/OpenAI Codex.
- A política de ferramentas ainda se aplica; `allow: ["write"]` permite implicitamente `apply_patch`.
- A configuração fica em `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` usa `true` por padrão; defina `false` para desativar a ferramenta para modelos OpenAI.
- `tools.exec.applyPatch.workspaceOnly` usa `true` por padrão (contido no workspace). Defina `false` apenas se você quiser intencionalmente que `apply_patch` grave/exclua fora do diretório do workspace.

## Relacionado

- [Aprovações do exec](/pt-BR/tools/exec-approvals) — gates de aprovação para comandos de shell
- [Sandboxing](/pt-BR/gateway/sandboxing) — execução de comandos em ambientes com sandbox
- [Processo em segundo plano](/pt-BR/gateway/background-process) — exec de longa duração e ferramenta process
- [Segurança](/pt-BR/gateway/security) — política de ferramentas e acesso elevado
