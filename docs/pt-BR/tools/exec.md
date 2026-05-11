---
read_when:
    - Usando ou modificando a ferramenta exec
    - Depuração do comportamento de stdin ou TTY
summary: Uso da ferramenta Exec, modos de stdin e suporte a TTY
title: Ferramenta Exec
x-i18n:
    generated_at: "2026-05-11T20:36:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43ed3dc70d1998f2f2a3eed70aaf20da61ba93d23b7fa7d378f22e8635c6ec68
    source_path: tools/exec.md
    workflow: 16
---

Execute comandos shell no workspace. `exec` é uma superfície shell mutável: comandos podem criar, editar ou excluir arquivos onde quer que o host selecionado ou o sistema de arquivos do sandbox permita. Desabilitar ferramentas de sistema de arquivos do OpenClaw, como `write`, `edit` ou `apply_patch`, não torna `exec` somente leitura.

Oferece suporte à execução em primeiro plano + segundo plano via `process`. Se `process` não for permitido, `exec` executa de forma síncrona e ignora `yieldMs`/`background`.
Sessões em segundo plano têm escopo por agente; `process` só vê sessões do mesmo agente.

## Parâmetros

<ParamField path="command" type="string" required>
Comando shell a executar.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Diretório de trabalho do comando.
</ParamField>

<ParamField path="env" type="object">
Substituições de ambiente de chave/valor mescladas sobre o ambiente herdado.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Coloca automaticamente o comando em segundo plano após este atraso (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Coloca o comando em segundo plano imediatamente em vez de esperar por `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Substitui o tempo limite de exec configurado para esta chamada. Defina `timeout: 0` somente quando o comando deve executar sem o tempo limite do processo exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Executa em um pseudoterminal quando disponível. Use para CLIs somente TTY, agentes de codificação e UIs de terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Onde executar. `auto` resolve para `sandbox` quando um runtime de sandbox está ativo e para `gateway` caso contrário.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Ignorado para chamadas normais de ferramentas. A segurança de `gateway` / `node` é controlada por
`tools.exec.security` e `~/.openclaw/exec-approvals.json`; o modo elevado pode
forçar `security=full` somente quando o operador concede explicitamente acesso elevado.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Comportamento do prompt de aprovação para execução em `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
ID/nome do Node quando `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Solicita modo elevado — escapa do sandbox para o caminho de host configurado. `security=full` é forçado somente quando elevated resolve para `full`.
</ParamField>

Observações:

- `host` tem `auto` como padrão: sandbox quando o runtime de sandbox está ativo para a sessão, caso contrário gateway.
- `host` aceita apenas `auto`, `sandbox`, `gateway` ou `node`. Ele não é um seletor de nome de host; valores parecidos com nomes de host são rejeitados antes de o comando executar.
- `auto` é a estratégia de roteamento padrão, não um curinga. `host=node` por chamada é permitido a partir de `auto`; `host=gateway` por chamada só é permitido quando nenhum runtime de sandbox está ativo.
- Sem configuração extra, `host=auto` ainda "simplesmente funciona": sem sandbox, resolve para `gateway`; com um sandbox ativo, permanece no sandbox.
- `elevated` escapa do sandbox para o caminho de host configurado: `gateway` por padrão, ou `node` quando `tools.exec.host=node` (ou o padrão da sessão é `host=node`). Ele só está disponível quando o acesso elevado está habilitado para a sessão/provedor atual.
- Aprovações de `gateway`/`node` são controladas por `~/.openclaw/exec-approvals.json`.
- `node` requer um node pareado (aplicativo companheiro ou host de node headless).
- Se vários nodes estiverem disponíveis, defina `exec.node` ou `tools.exec.node` para selecionar um.
- `exec host=node` é o único caminho de execução shell para nodes; o wrapper legado `nodes.run` foi removido.
- `timeout` se aplica à execução em primeiro plano, segundo plano, `yieldMs`, gateway, sandbox e node `system.run`. Se omitido, o OpenClaw usa `tools.exec.timeoutSec`; `timeout: 0` explícito desabilita o tempo limite do processo exec para essa chamada.
- Em hosts não Windows, exec usa `SHELL` quando definido; se `SHELL` for `fish`, ele prefere `bash` (ou `sh`)
  de `PATH` para evitar scripts incompatíveis com fish, depois recorre a `SHELL` se nenhum deles existir.
- Em hosts Windows, exec prefere a descoberta do PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, depois PATH),
  depois recorre ao Windows PowerShell 5.1.
- A execução no host (`gateway`/`node`) rejeita substituições de `env.PATH` e de loader (`LD_*`/`DYLD_*`) para
  impedir sequestro de binário ou código injetado.
- O OpenClaw define `OPENCLAW_SHELL=exec` no ambiente do comando gerado (incluindo execução PTY e sandbox) para que regras de shell/perfil possam detectar o contexto da ferramenta exec.
- `openclaw channels login` é bloqueado em `exec` porque é um fluxo interativo de autenticação de canal; execute-o em um terminal no host gateway ou use a ferramenta de login nativa do canal no chat quando existir.
- Importante: o sandboxing fica **desativado por padrão**. Se o sandboxing estiver desativado, `host=auto` implícito
  resolve para `gateway`. `host=sandbox` explícito ainda falha fechado em vez de executar silenciosamente
  no host gateway. Habilite o sandboxing ou use `host=gateway` com aprovações.
- Verificações de pré-voo de scripts (para erros comuns de sintaxe shell em Python/Node) inspecionam apenas arquivos dentro do
  limite efetivo de `workdir`. Se um caminho de script resolver para fora de `workdir`, o pré-voo é ignorado para
  esse arquivo.
- Para trabalho de longa duração que começa agora, inicie-o uma vez e conte com o despertar automático de
  conclusão quando ele estiver habilitado e o comando emitir saída ou falhar.
  Use `process` para logs, status, entrada ou intervenção; não emule
  agendamento com loops de sleep, loops de timeout ou polling repetido.
- Para trabalho que deve acontecer depois ou em uma agenda, use cron em vez de
  padrões de sleep/atraso com `exec`.

## Configuração

- `tools.exec.notifyOnExit` (padrão: true): quando true, sessões exec em segundo plano enfileiram um evento do sistema e solicitam um Heartbeat ao sair.
- `tools.exec.approvalRunningNoticeMs` (padrão: 10000): emite um único aviso de "em execução" quando um exec com aprovação obrigatória executa por mais tempo que isso (0 desabilita).
- `tools.exec.timeoutSec` (padrão: 1800): tempo limite exec padrão por comando em segundos. `timeout` por chamada o substitui; `timeout: 0` por chamada desabilita o tempo limite do processo exec.
- `tools.exec.host` (padrão: `auto`; resolve para `sandbox` quando o runtime de sandbox está ativo, `gateway` caso contrário)
- `tools.exec.security` (padrão: `deny` para sandbox, `full` para gateway + node quando não definido)
- `tools.exec.ask` (padrão: `off`)
- Exec de host sem aprovação é o padrão para gateway + node. Se quiser comportamento de aprovações/allowlist, restrinja tanto `tools.exec.*` quanto o `~/.openclaw/exec-approvals.json` do host; consulte [Aprovações de exec](/pt-BR/tools/exec-approvals#yolo-mode-no-approval).
- YOLO vem dos padrões de política do host (`security=full`, `ask=off`), não de `host=auto`. Se quiser forçar o roteamento por gateway ou node, defina `tools.exec.host` ou use `/exec host=...`.
- No modo `security=full` mais `ask=off`, exec de host segue diretamente a política configurada; não há camada extra de pré-filtro heurístico de ofuscação de comando nem rejeição de pré-voo de script.
- `tools.exec.node` (padrão: não definido)
- `tools.exec.strictInlineEval` (padrão: false): quando true, formas de eval inline de interpretador, como `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` e `osascript -e`, sempre exigem aprovação explícita. `allow-always` ainda pode persistir invocações benignas de interpretador/script, mas formas de inline-eval ainda solicitam aprovação a cada vez.
- `tools.exec.commandHighlighting` (padrão: false): quando true, prompts de aprovação podem destacar spans de comando derivados do parser no texto do comando. Defina como `true` globalmente ou por agente para habilitar o destaque de texto de comando sem alterar a política de aprovação de exec.
- `tools.exec.pathPrepend`: lista de diretórios a antepor a `PATH` para execuções de exec (somente gateway + sandbox).
- `tools.exec.safeBins`: binários seguros somente stdin que podem executar sem entradas explícitas de allowlist. Para detalhes de comportamento, consulte [Bins seguros](/pt-BR/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: diretórios explícitos adicionais confiáveis para verificações de caminho de `safeBins`. Entradas de `PATH` nunca são automaticamente confiáveis. Os padrões integrados são `/bin` e `/usr/bin`.
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

- `host=gateway`: mescla o `PATH` do seu shell de login ao ambiente de exec. Substituições de `env.PATH` são
  rejeitadas para execução no host. O daemon em si ainda executa com um `PATH` mínimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: executa `sh -lc` (shell de login) dentro do contêiner, então `/etc/profile` pode redefinir `PATH`.
  O OpenClaw antepõe `env.PATH` após carregar o perfil por meio de uma variável de ambiente interna (sem interpolação de shell);
  `tools.exec.pathPrepend` também se aplica aqui.
- `host=node`: apenas substituições de ambiente não bloqueadas que você passa são enviadas ao node. Substituições de `env.PATH` são
  rejeitadas para execução no host e ignoradas por hosts de node. Se precisar de entradas PATH adicionais em um node,
  configure o ambiente de serviço do host de node (systemd/launchd) ou instale ferramentas em locais padrão.

Vinculação de node por agente (use o índice da lista de agentes na configuração):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

UI de controle: a aba Nodes inclui um pequeno painel "Vinculação de node de exec" para as mesmas configurações.

## Substituições de sessão (`/exec`)

Use `/exec` para definir padrões **por sessão** para `host`, `security`, `ask` e `node`.
Envie `/exec` sem argumentos para mostrar os valores atuais.

Exemplo:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modelo de autorização

`/exec` só é honrado para **remetentes autorizados** (allowlists/pareamento de canais mais `commands.useAccessGroups`).
Ele atualiza **apenas o estado da sessão** e não grava configuração. Para desabilitar exec de forma rígida, negue-o via política de ferramenta
(`tools.deny: ["exec"]` ou por agente). Aprovações de host ainda se aplicam, a menos que você defina explicitamente
`security=full` e `ask=off`.

## Aprovações de exec (aplicativo companheiro / host de node)

Agentes em sandbox podem exigir aprovação por solicitação antes que `exec` execute no gateway ou no host de node.
Consulte [Aprovações de exec](/pt-BR/tools/exec-approvals) para a política, allowlist e fluxo de UI.

Quando aprovações são exigidas, a ferramenta exec retorna imediatamente com
`status: "approval-pending"` e um ID de aprovação. Depois de aprovado (ou negado / expirado),
o Gateway emite eventos do sistema (`Exec finished` / `Exec denied`). Se o comando ainda estiver
em execução após `tools.exec.approvalRunningNoticeMs`, um único aviso `Exec running` será emitido.
Em canais com cartões/botões de aprovação nativos, o agente deve confiar primeiro nessa
UI nativa e incluir apenas um comando manual `/approve` quando o resultado da ferramenta
disser explicitamente que aprovações por chat não estão disponíveis ou que a aprovação manual é o
único caminho.

## Allowlist + bins seguros

A aplicação manual de allowlist corresponde a globs de caminho de binário resolvido e globs de nome
de comando puro. Nomes puros correspondem apenas a comandos invocados por meio de PATH, então `rg` pode corresponder a
`/opt/homebrew/bin/rg` quando o comando é `rg`, mas não a `./rg` ou `/tmp/rg`.
Quando `security=allowlist`, comandos shell são permitidos automaticamente somente se cada segmento
do pipeline estiver na allowlist ou for um bin seguro. Encadeamento (`;`, `&&`, `||`) e redirecionamentos
são rejeitados no modo allowlist, a menos que cada segmento de nível superior satisfaça a
allowlist (incluindo bins seguros). Redirecionamentos continuam sem suporte.
A confiança durável `allow-always` não contorna essa regra: um comando encadeado ainda exige que cada
segmento de nível superior corresponda.

`autoAllowSkills` é um caminho de conveniência separado nas aprovações de exec. Ele não é o mesmo que
entradas manuais de allowlist de caminho. Para confiança explícita estrita, mantenha `autoAllowSkills` desabilitado.

Use os dois controles para tarefas diferentes:

- `tools.exec.safeBins`: filtros de fluxo pequenos, somente via stdin.
- `tools.exec.safeBinTrustedDirs`: diretórios confiáveis extras explícitos para caminhos de executáveis safe-bin.
- `tools.exec.safeBinProfiles`: política argv explícita para safe bins personalizados.
- lista de permissões: confiança explícita para caminhos de executáveis.

Não trate `safeBins` como uma lista de permissões genérica e não adicione binários de intérprete/runtime (por exemplo, `python3`, `node`, `ruby`, `bash`). Se você precisar deles, use entradas explícitas de lista de permissões e mantenha os prompts de aprovação habilitados.
`openclaw security audit` avisa quando entradas `safeBins` de intérprete/runtime não têm perfis explícitos, e `openclaw doctor --fix` pode estruturar entradas `safeBinProfiles` personalizadas ausentes.
`openclaw security audit` e `openclaw doctor` também avisam quando você adiciona explicitamente bins de comportamento amplo, como `jq`, de volta a `safeBins`.
Se você permitir intérpretes explicitamente na lista de permissões, habilite `tools.exec.strictInlineEval` para que formas de avaliação de código inline ainda exijam uma nova aprovação.

Para detalhes completos da política e exemplos, consulte [Aprovações de Exec](/pt-BR/tools/exec-approvals-advanced#safe-bins-stdin-only) e [Safe bins versus lista de permissões](/pt-BR/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

A consulta é para status sob demanda, não para loops de espera. Se a ativação automática ao concluir
estiver habilitada, o comando pode ativar a sessão quando emitir saída ou falhar.

Enviar teclas (estilo tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Enviar (somente CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Colar (entre colchetes por padrão):

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
- `tools.exec.applyPatch.enabled` usa `true` como padrão; defina como `false` para desabilitar a ferramenta para modelos OpenAI.
- `tools.exec.applyPatch.workspaceOnly` usa `true` como padrão (contido no workspace). Defina como `false` somente se você quiser intencionalmente que `apply_patch` grave/exclua fora do diretório do workspace.

## Relacionados

- [Aprovações de Exec](/pt-BR/tools/exec-approvals) — gates de aprovação para comandos de shell
- [Sandboxing](/pt-BR/gateway/sandboxing) — execução de comandos em ambientes sandbox
- [Processo em segundo plano](/pt-BR/gateway/background-process) — exec de longa duração e ferramenta de processo
- [Segurança](/pt-BR/gateway/security) — política de ferramentas e acesso elevado
