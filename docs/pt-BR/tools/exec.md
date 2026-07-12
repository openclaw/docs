---
read_when:
    - Como usar ou modificar a ferramenta exec
    - Depuração do comportamento de stdin ou TTY
summary: Uso da ferramenta exec, modos de stdin e suporte a TTY
title: Ferramenta de execução
x-i18n:
    generated_at: "2026-07-12T15:48:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b8d7c3fcaa670851635cbd029d73f529a50be8c8c4df69565a1f96ea28757d04
    source_path: tools/exec.md
    workflow: 16
---

Execute comandos de shell no workspace. `exec` é uma superfície de shell mutável: os comandos podem criar, editar ou excluir arquivos onde quer que o sistema de arquivos do host ou sandbox selecionado permita. Desabilitar ferramentas de sistema de arquivos do OpenClaw, como `write`, `edit` ou `apply_patch`, não torna `exec` somente leitura.

Oferece suporte à execução em primeiro e segundo plano por meio de `process`. Se `process` não for permitido, `exec` será executado de forma síncrona e ignorará `yieldMs`/`background`. As sessões em segundo plano têm escopo por agente; `process` só vê sessões do mesmo agente.

## Parâmetros

<ParamField path="command" type="string" required>
Comando de shell a ser executado.
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
Coloca o comando em segundo plano imediatamente, em vez de aguardar `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Substitui o tempo limite de exec configurado para esta chamada, em segundos. Aplica-se à execução em primeiro plano, em segundo plano, com `yieldMs`, no gateway, no sandbox e em `system.run` do node. `timeout: 0` desabilita o tempo limite do processo exec para essa chamada.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Executa em um pseudoterminal quando disponível. Use para CLIs exclusivas de TTY, agentes de programação e interfaces de terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Onde executar. `auto` é resolvido como `sandbox` quando um runtime de sandbox está ativo e como `gateway` caso contrário.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Ignorado em chamadas normais de ferramentas. A segurança de `gateway`/`node` é controlada por `tools.exec.security` e pelo arquivo de aprovações do host; o modo elevado pode forçar `security=full` somente quando o operador concede explicitamente acesso elevado.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
O modo básico de solicitação vem de `tools.exec.ask` e das aprovações do host. Para chamadas de modelo originadas em canais, o `ask` por chamada é ignorado quando a solicitação efetiva do host é `off`; caso contrário, ele só pode restringir para um modo mais rigoroso. Chamadores internos/de API confiáveis que constroem ferramentas exec com um valor `ask` explícito permanecem inalterados.
</ParamField>

<ParamField path="node" type="string">
ID/nome do Node quando `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Solicita o modo elevado: sai do sandbox para o caminho configurado do host. `security=full` só é forçado quando o modo elevado é resolvido como `full`.
</ParamField>

Observações:

- `host` aceita somente `auto`, `sandbox`, `gateway` ou `node`. Ele não é um seletor de nome de host; valores semelhantes a nomes de host são rejeitados antes da execução do comando.
- `host=node` por chamada é permitido a partir de `auto`; `host=gateway` por chamada só é permitido quando nenhum runtime de sandbox está ativo.
- Sem configuração adicional, `host=auto` ainda "simplesmente funciona": sem sandbox, ele é resolvido como `gateway`; com um sandbox ativo, permanece no sandbox.
- `elevated` sai do sandbox para o caminho configurado do host: `gateway` por padrão ou `node` quando `tools.exec.host=node` (ou o padrão da sessão é `host=node`). Ele só está disponível quando o acesso elevado está habilitado para a sessão/o provedor atual.
- As aprovações de `gateway`/`node` são controladas pelo arquivo de aprovações do host.
- `node` requer um Node pareado (aplicativo complementar ou host de Node sem interface gráfica). Se vários Nodes estiverem disponíveis, defina `exec.node` ou `tools.exec.node` para selecionar um.
- `exec host=node` é o único caminho de execução de shell para Nodes; o wrapper legado `nodes.run` foi removido.
- Em hosts que não sejam Windows, exec usa `SHELL` quando definido; se `SHELL` for `fish`, ele prefere `bash` (ou `sh`) do `PATH` para evitar construções de bash incompatíveis com fish e, em seguida, recorre a `SHELL` se nenhum deles existir.
- Em hosts Windows, exec prioriza a descoberta do PowerShell 7 (`pwsh`) (Program Files, ProgramW6432 e depois PATH) e, em seguida, recorre ao Windows PowerShell 5.1.
- Em hosts Gateway que não sejam Windows, comandos exec de bash e zsh usam um snapshot de inicialização. O OpenClaw captura aliases/funções que podem ser carregados e um pequeno conjunto seguro de variáveis de ambiente dos arquivos de inicialização do shell em `$OPENCLAW_STATE_DIR/cache/shell-snapshots/` e, em seguida, carrega esse snapshot antes de cada comando exec. Variáveis que aparentam conter segredos são excluídas; exec no sandbox e no Node não usa esse snapshot. Defina `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` no ambiente do processo do Gateway para desabilitar esse caminho de snapshot.
- A execução no host (`gateway`/`node`) rejeita `env.PATH` e substituições do carregador (`LD_*`/`DYLD_*`) para evitar sequestro de binários ou código injetado.
- O OpenClaw define `OPENCLAW_SHELL=exec` no ambiente do comando iniciado (incluindo execução em PTY e sandbox) para que as regras do shell/perfil possam detectar o contexto da ferramenta exec.
- Para execuções originadas em canais, o OpenClaw também expõe uma carga JSON restrita de identidade do remetente/chat em `OPENCLAW_CHANNEL_CONTEXT` quando o canal fornece esses IDs.
- `exec` não pode executar comandos de shell `openclaw channels login` ou `/approve`: `openclaw channels login` é um fluxo interativo de autenticação de canal, e `/approve` precisa passar pelo manipulador de comandos de aprovação, não por um shell. Execute o login do canal em um terminal no host Gateway ou use uma ferramenta de agente de login específica do canal quando houver uma (por exemplo, `whatsapp_login`).
- Importante: o sandbox está **desativado por padrão**. Se o sandbox estiver desativado, `host=auto` implícito será resolvido como `gateway`. `host=sandbox` explícito ainda falhará de forma segura, em vez de executar silenciosamente no host Gateway. Habilite o sandbox ou use `host=gateway` com aprovações.
- As verificações preliminares de scripts (para erros comuns de sintaxe de shell em Python/Node) inspecionam somente arquivos dentro do limite efetivo de `workdir`. Se o caminho de um script for resolvido fora de `workdir`, a verificação preliminar será ignorada para esse arquivo. A verificação preliminar também será totalmente ignorada quando `host=gateway` e a política efetiva for `security=full` com `ask=off`.
- Para trabalhos de longa duração iniciados agora, inicie-os uma vez e confie no acionamento automático de conclusão quando ele estiver habilitado e o comando produzir saída ou falhar. Use `process` para logs, status, entrada ou intervenção; não simule agendamento com loops de suspensão, loops de tempo limite ou sondagens repetidas.
- Para trabalhos que devem ocorrer posteriormente ou de forma agendada, use cron em vez de padrões de suspensão/atraso com `exec`.

## Configuração

| Chave                                | Padrão                                                 | Observações                                                                                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSec`              | `1800`                                                 | Tempo limite padrão por comando exec, em segundos. O `timeout` por chamada o substitui; `timeout: 0` por chamada desabilita o tempo limite do processo exec.                                         |
| `tools.exec.host`                    | `auto`                                                 | É resolvido como `sandbox` quando um runtime de sandbox está ativo e como `gateway` caso contrário.                                                                                                  |
| `tools.exec.security`                | `deny` para sandbox, `full` para gateway/node quando não definido |                                                                                                                                                                                                      |
| `tools.exec.ask`                     | `off`                                                  |                                                                                                                                                                                                      |
| `tools.exec.mode`                    | não definido                                           | Controle de política normalizado. Consulte [Modos](#modes) abaixo. Não pode ser combinado com `tools.exec.security`/`tools.exec.ask`.                                                                |
| `tools.exec.reviewer.model`          | modelo principal configurado do agente                 | Substituição opcional de provedor/modelo para a revisão de `mode=auto`.                                                                                                                              |
| `tools.exec.reviewer.timeoutMs`      | `30000`                                                | Tempo limite por etapa para a preparação e a conclusão do modelo revisor antes de recorrer a uma pessoa.                                                                                             |
| `tools.exec.node`                    | não definido                                           |                                                                                                                                                                                                      |
| `tools.exec.notifyOnExit`            | `true`                                                 | Quando verdadeiro, as sessões exec em segundo plano enfileiram um evento de sistema e solicitam um Heartbeat ao sair.                                                                                |
| `tools.exec.approvalRunningNoticeMs` | `10000`                                                | Emite uma única notificação de "em execução" quando uma execução exec sujeita a aprovação dura mais do que esse valor (`0` desabilita).                                                             |
| `tools.exec.strictInlineEval`        | `false`                                                | Consulte [Avaliação inline](#inline-eval-strictinlineeval).                                                                                                                                          |
| `tools.exec.commandHighlighting`     | `false`                                                | Quando verdadeiro, as solicitações de aprovação podem destacar trechos de comando derivados do analisador no texto do comando. Defina globalmente ou por agente; não altera a política de aprovação. |
| `tools.exec.pathPrepend`             | não definido                                           | Lista de diretórios a serem adicionados ao início de `PATH` para execuções exec (somente gateway + sandbox).                                                                                         |
| `tools.exec.safeBins`                | não definido                                           | Binários seguros somente para stdin que podem ser executados sem entradas explícitas na lista de permissões. Consulte [Binários seguros](/pt-BR/tools/exec-approvals-advanced#safe-bins-stdin-only).        |
| `tools.exec.safeBinTrustedDirs`      | `/bin`, `/usr/bin`                                     | Diretórios explícitos adicionais considerados confiáveis nas verificações de caminho de `safeBins`. Entradas de `PATH` nunca são consideradas confiáveis automaticamente.                           |
| `tools.exec.safeBinProfiles`         | não definido                                           | Política argv personalizada opcional por binário seguro (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).                                                                      |

A execução no host sem aprovação é o padrão para gateway e Node (`security=full`, `ask=off`) — isso vem dos padrões da política do host, não de `host=auto`. Se você quiser comportamento de aprovação/lista de permissões, restrinja tanto `tools.exec.*` quanto o arquivo de aprovações do host; consulte [Aprovações de exec](/pt-BR/tools/exec-approvals#yolo-mode-no-approval). Para forçar o roteamento para gateway ou Node independentemente do estado do sandbox, defina `tools.exec.host` ou use `/exec host=...`.

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

### Modos

`tools.exec.mode` é o controle de política normalizado. Defini-lo deriva `security`/`ask` e ele não pode ser combinado com `tools.exec.security`/`tools.exec.ask`.

| Modo        | security    | ask       | Comportamento                                                                                                                               |
| ----------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | `deny`      | `off`     | A execução é negada.                                                                                                                        |
| `allowlist` | `allowlist` | `off`     | Somente comandos da lista de permissões ou de bins seguros são executados; nenhum outro solicita aprovação.                                 |
| `ask`       | `allowlist` | `on-miss` | As correspondências da lista de permissões são executadas diretamente; todo o restante solicita aprovação humana.                           |
| `auto`      | `allowlist` | `on-miss` | As correspondências da lista de permissões ou de bins seguros são executadas diretamente; todo o restante passa pelo revisor automático nativo do OpenClaw antes de solicitar aprovação humana. |
| `full`      | `full`      | `off`     | Não há controle de aprovação.                                                                                                               |

`ask`/`ask=always` ainda solicita aprovação humana todas as vezes, independentemente do modo.

A aprovação da revisão automática é de uso único. No Gateway, o OpenClaw fornece ao revisor o caminho resolvido do executável e vincula a execução a esse mesmo caminho. Comandos que não podem ser reduzidos a um único plano de execução aplicável — como heredocs, expansões de shell ou uso de aspas não compatível em wrappers — voltam para a aprovação humana, mesmo que o modelo normalmente os permitisse.

As aprovações de comandos do app-server do Codex que ainda não tenham sido decididas por uma política explícita do runtime ou por uma política nativa usam a rota de aprovação humana. O OpenClaw não executa o revisor de execução configurado para essas solicitações porque o Codex não expõe um executável resolvido aplicável que possa vincular a decisão da revisão ao comando executado pelo Codex.

### Avaliação inline (`strictInlineEval`)

Quando `tools.exec.strictInlineEval` é `true`, formas de avaliação inline do interpretador exigem aprovação do revisor ou aprovação explícita: `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, `osascript -e` e formas semelhantes em outros interpretadores e transportadores de comandos compatíveis (`awk`, `find -exec`, `make`, `sed`, `xargs` e outros). Em `mode=auto`, o fluxo normal de aprovação de execução pode permitir que o revisor automático nativo aprove um comando pontual claramente de baixo risco; chamadas diretas de `system.run` no host Node ainda exigem aprovação explícita porque não podem encaminhar o comando para uma rota de aprovação humana. Se o revisor solicitar, a solicitação será encaminhada a uma pessoa. `allow-always` ainda pode persistir invocações benignas de interpretadores/scripts, mas as formas de avaliação inline não se tornam regras de permissão permanentes.

### Tratamento de PATH

- `host=gateway`: mescla o `PATH` do seu shell de login no ambiente de execução. Substituições de `env.PATH` são rejeitadas para execução no host. O próprio daemon ainda é executado com um `PATH` mínimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
  - Para impedir que a configuração do shell do usuário (como `~/.zshenv` ou `/etc/zshenv`) substitua caminhos prioritários durante a inicialização, as entradas de `tools.exec.pathPrepend` são adicionadas com segurança ao início do `PATH` final dentro do comando de shell imediatamente antes da execução.
- `host=sandbox`: executa `sh -lc` (shell de login) dentro do contêiner, portanto `/etc/profile` pode redefinir o `PATH`. O OpenClaw adiciona `env.PATH` ao início após carregar o perfil por meio de uma variável de ambiente interna (sem interpolação do shell); `tools.exec.pathPrepend` também se aplica aqui.
- `host=node`: somente as substituições de ambiente não bloqueadas que você fornecer serão enviadas ao Node. Substituições de `env.PATH` são rejeitadas para execução no host e ignoradas pelos hosts Node. Se precisar de entradas adicionais no PATH de um Node, configure o ambiente do serviço do host Node (systemd/launchd) ou instale as ferramentas em locais padrão.

Vinculação de Node por agente (use o índice da lista de agentes na configuração):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Interface de controle: a página **Dispositivos** inclui um pequeno painel "Vinculação de Node de execução" para as mesmas configurações.

## Substituições da sessão (`/exec`)

Use `/exec` para definir os padrões **por sessão** de `host`, `security`, `ask` e `node`. Envie `/exec` sem argumentos para exibir os valores atuais.

Exemplo:

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

`/exec` só é respeitado para **remetentes autorizados** (listas de permissões/pareamento do canal mais `commands.useAccessGroups`). Ele atualiza **somente o estado da sessão** e não grava a configuração. Remetentes autorizados de canais externos podem definir esses padrões de sessão. Clientes internos do Gateway/webchat precisam de `operator.admin` para persisti-los.

Para desativar completamente a execução, negue-a por meio da política de ferramentas (`tools.deny: ["exec"]` ou por agente). As aprovações do host ainda se aplicam, a menos que você defina explicitamente `security=full` e `ask=off`.

## Aprovações de execução (aplicativo complementar/host Node)

Agentes em sandbox podem exigir aprovação por solicitação antes que `exec` seja executado no Gateway ou no host Node. Consulte [Aprovações de execução](/pt-BR/tools/exec-approvals) para conhecer a política, a lista de permissões e o fluxo da interface.

Quando uma aprovação humana é necessária, os fluxos do host Node e os fluxos não nativos do Gateway retornam imediatamente com `status: "approval-pending"` e um ID de aprovação. Os fluxos nativos de chat e da interface Web no Gateway podem, em vez disso, aguardar no próprio fluxo e retornar o resultado final do comando após a aprovação. Um resultado `approval-pending` significa que o comando ainda não foi iniciado; portanto, os avisos de fallback de primeiro plano só aparecem se o comando aprovado realmente for executado no próprio fluxo. Execuções assíncronas aprovadas emitem eventos de sistema de progresso e conclusão do comando (`Exec running` / `Exec finished`); aprovações negadas ou expiradas são terminais e não reativam a sessão do agente com um evento de sistema de negação.

Em canais com cartões/botões de aprovação nativos, o agente deve priorizar essa interface nativa e incluir um comando manual `/approve` somente quando o resultado da ferramenta disser explicitamente que as aprovações pelo chat não estão disponíveis ou que a aprovação manual é o único caminho.

## Lista de permissões + bins seguros

A aplicação manual da lista de permissões corresponde a globs de caminhos resolvidos de binários e a globs de nomes simples de comandos. Nomes simples correspondem apenas a comandos invocados por meio do PATH; portanto, `rg` pode corresponder a `/opt/homebrew/bin/rg` quando o comando é `rg`, mas não a `./rg` ou `/tmp/rg`.

Quando `security=allowlist`, comandos de shell são permitidos automaticamente somente se cada segmento do pipeline estiver na lista de permissões ou for um bin seguro. Encadeamentos (`;`, `&&`, `||`) e redirecionamentos são rejeitados no modo de lista de permissões, a menos que cada segmento de nível superior satisfaça a lista de permissões (incluindo bins seguros). Redirecionamentos continuam sem suporte. A confiança permanente de `allow-always` não ignora essa regra: um comando encadeado ainda exige que cada segmento de nível superior corresponda.

`autoAllowSkills` é um caminho de conveniência separado nas aprovações de execução e não equivale às entradas manuais de caminhos na lista de permissões. Para uma confiança explícita rigorosa, mantenha `autoAllowSkills` desativado.

Use os dois controles para finalidades diferentes:

- `tools.exec.safeBins`: filtros pequenos de fluxo, somente por stdin.
- `tools.exec.safeBinTrustedDirs`: diretórios confiáveis adicionais explícitos para caminhos de executáveis de bins seguros.
- `tools.exec.safeBinProfiles`: política explícita de argv para bins seguros personalizados.
- lista de permissões: confiança explícita em caminhos de executáveis.

Não trate `safeBins` como uma lista de permissões genérica e não adicione binários de interpretadores/runtimes (por exemplo, `python3`, `node`, `ruby`, `bash`). Se precisar deles, use entradas explícitas na lista de permissões e mantenha as solicitações de aprovação ativadas.

`openclaw security audit` avisa quando entradas de interpretadores/runtimes em `safeBins` não têm perfis explícitos, e `openclaw doctor --fix` pode criar a estrutura das entradas personalizadas ausentes em `safeBinProfiles`. `openclaw security audit` e `openclaw doctor` também avisam quando você adiciona explicitamente bins de comportamento amplo, como `jq`, novamente a `safeBins` (`jq` pode ler dados do ambiente e carregar código jq de módulos ou arquivos de inicialização; portanto, prefira entradas explícitas na lista de permissões ou execuções controladas por aprovação). `jq` é negado como bin seguro mesmo quando está explicitamente listado. Se você adicionar interpretadores explicitamente à lista de permissões, ative `tools.exec.strictInlineEval` para que as formas de avaliação inline de código ainda exijam aprovação do revisor ou aprovação explícita.

Para obter detalhes completos da política e exemplos, consulte [Aprovações de execução](/pt-BR/tools/exec-approvals-advanced#safe-bins-stdin-only) e [Bins seguros versus lista de permissões](/pt-BR/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

A consulta serve para verificar o status sob demanda, não para loops de espera. Se a reativação automática na conclusão estiver ativada, o comando poderá reativar a sessão quando emitir uma saída ou falhar.

Enviar teclas (estilo tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Enviar (envia somente CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Colar (com delimitadores por padrão):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` é uma subferramenta de `exec` para edições estruturadas em vários arquivos. Ela é ativada por padrão e está disponível para qualquer provedor de modelo; `allowModels` pode restringi-la. Use a configuração somente quando quiser desativá-la ou restringi-la a modelos específicos:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.6-sol"] },
    },
  },
}
```

Observações:

- A política de ferramentas ainda se aplica; `allow: ["write"]` permite implicitamente `apply_patch`.
- `deny: ["write"]` não nega `apply_patch`; negue `apply_patch` explicitamente ou use `deny: ["group:fs"]` quando as gravações de patches também precisarem ser bloqueadas.
- A configuração fica em `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` assume `true` por padrão; defina como `false` para desativar a ferramenta.
- `tools.exec.applyPatch.workspaceOnly` assume `true` por padrão (restrito ao espaço de trabalho). Defina como `false` somente se quiser intencionalmente que `apply_patch` grave/exclua fora do diretório do espaço de trabalho.
- `tools.exec.applyPatch.allowModels` é uma lista de permissões opcional de IDs de modelos (simples, como `gpt-5.4`, ou completos, como `openai/gpt-5.4`). Quando definida, somente os modelos correspondentes recebem a ferramenta; quando não definida, todos os modelos a recebem.

## Relacionado

- [Aprovações de execução](/pt-BR/tools/exec-approvals) — controles de aprovação para comandos de shell
- [Sandbox](/pt-BR/gateway/sandboxing) — execução de comandos em ambientes em sandbox
- [Processo em segundo plano](/pt-BR/gateway/background-process) — ferramentas de execução e processo de longa duração
- [Segurança](/pt-BR/gateway/security) — política de ferramentas e acesso elevado
