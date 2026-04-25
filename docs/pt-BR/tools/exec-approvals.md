---
read_when:
    - Configurando aprovações de execução ou listas de permissão
    - Implementando a UX de aprovação de execução no app macOS
    - Revisando prompts de escape do sandbox e implicações
summary: Aprovações de execução, listas de permissão e prompts de escape do sandbox
title: Aprovações de execução
x-i18n:
    generated_at: "2026-04-25T13:57:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44bf7af57d322280f6d0089207041214b1233d0c9eca99656d51fc4aed88941b
    source_path: tools/exec-approvals.md
    workflow: 15
---

As aprovações de execução são a **proteção do app complementar / host do node** para permitir que um
agente em sandbox execute comandos em um host real (`gateway` ou `node`). Um
intertravamento de segurança: os comandos são permitidos somente quando política + lista de permissão + (opcional) aprovação do usuário
concordam. As aprovações de execução ficam **por cima de** política de ferramenta e gating elevado (a menos que elevated esteja definido como `full`, o que ignora aprovações).

<Note>
A política efetiva é a **mais restritiva** entre os padrões de `tools.exec.*` e de aprovações;
se um campo de aprovações for omitido, será usado o valor de `tools.exec`. A execução no host
também usa o estado local de aprovações naquela máquina — um `ask: "always"` local
em `~/.openclaw/exec-approvals.json` continua exibindo prompts mesmo se a sessão ou os padrões de configuração
solicitarem `ask: "on-miss"`.
</Note>

## Inspecionando a política efetiva

- `openclaw approvals get`, `... --gateway`, `... --node <id|name|ip>` — mostram a política solicitada, as fontes de política do host e o resultado efetivo.
- `openclaw exec-policy show` — visão mesclada da máquina local.
- `openclaw exec-policy set|preset` — sincroniza a política local solicitada com o arquivo de aprovações do host local em uma única etapa.

Quando um escopo local solicita `host=node`, `exec-policy show` informa esse escopo
como gerenciado pelo node em tempo de execução em vez de fingir que o arquivo local de aprovações é
a fonte da verdade.

Se a UI do app complementar **não estiver disponível**, qualquer solicitação que normalmente
exibiria um prompt será resolvida pelo **fallback de ask** (padrão: negar).

<Tip>
Clientes nativos de aprovação por chat podem semear affordances específicas do canal na
mensagem de aprovação pendente. Por exemplo, o Matrix semeia atalhos de reação (`✅`
permitir uma vez, `❌` negar, `♾️` permitir sempre) e ainda mantém os comandos
`/approve ...` na mensagem como fallback.
</Tip>

## Onde se aplica

As aprovações de execução são impostas localmente no host de execução:

- **host do gateway** → processo `openclaw` na máquina do gateway
- **host do node** → executor do node (app complementar macOS ou host do node sem interface)

Observação sobre o modelo de confiança:

- Chamadores autenticados no Gateway são operadores confiáveis para esse Gateway.
- Nodes pareados estendem essa capacidade de operador confiável ao host do node.
- As aprovações de execução reduzem o risco de execução acidental, mas não são um limite de autenticação por usuário.
- Execuções aprovadas no host do node vinculam o contexto canônico de execução: `cwd` canônico, `argv` exato, vínculo de `env`
  quando presente e caminho do executável fixado, quando aplicável.
- Para scripts de shell e invocações diretas de arquivos de interpretador/runtime, o OpenClaw também tenta vincular
  um operando concreto de arquivo local. Se esse arquivo vinculado mudar após a aprovação, mas antes da execução,
  a execução será negada em vez de executar conteúdo alterado.
- Esse vínculo de arquivo é intencionalmente um best-effort, não um modelo semântico completo de todos os
  caminhos de carregamento de interpretadores/runtime. Se o modo de aprovação não puder identificar exatamente um arquivo local concreto
  para vincular, ele se recusa a emitir uma execução respaldada por aprovação em vez de fingir cobertura total.

Separação no macOS:

- o **serviço host do node** encaminha `system.run` para o **app macOS** por IPC local.
- o **app macOS** impõe aprovações + executa o comando no contexto da UI.

## Configurações e armazenamento

As aprovações ficam em um arquivo JSON local no host de execução:

`~/.openclaw/exec-approvals.json`

Exemplo de esquema:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Modo "YOLO" sem aprovação

Se você quiser que a execução no host rode sem prompts de aprovação, é preciso abrir **ambas** as camadas de política:

- a política de execução solicitada na configuração do OpenClaw (`tools.exec.*`)
- a política local de aprovações no host em `~/.openclaw/exec-approvals.json`

Este agora é o comportamento padrão no host, a menos que você o torne mais restritivo explicitamente:

- `tools.exec.security`: `full` em `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Distinção importante:

- `tools.exec.host=auto` escolhe onde a execução acontece: sandbox quando disponível, caso contrário gateway.
- YOLO escolhe como a execução no host é aprovada: `security=full` mais `ask=off`.
- Providers com suporte a CLI que expõem seu próprio modo de permissão não interativo podem seguir essa política.
  Claude CLI adiciona `--permission-mode bypassPermissions` quando a política de execução solicitada pelo OpenClaw é
  YOLO. Substitua esse comportamento do backend com argumentos explícitos do Claude em
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs`, por exemplo
  `--permission-mode default`, `acceptEdits` ou `bypassPermissions`.
- No modo YOLO, o OpenClaw não adiciona uma porta de aprovação heurística separada para ofuscação de comandos nem uma camada de rejeição preventiva de scripts por cima da política configurada de execução no host.
- `auto` não torna o roteamento para gateway uma substituição livre a partir de uma sessão em sandbox. Uma solicitação por chamada `host=node` é permitida a partir de `auto`, e `host=gateway` só é permitido a partir de `auto` quando não há runtime de sandbox ativo. Se você quiser um padrão estável não automático, defina `tools.exec.host` ou use `/exec host=...` explicitamente.

Se você quiser uma configuração mais conservadora, torne qualquer uma das camadas mais restritiva novamente para `allowlist` / `on-miss`
ou `deny`.

Configuração persistente de host do gateway para "nunca perguntar":

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Em seguida, defina o arquivo de aprovações do host para corresponder:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Atalho local para a mesma política de host do gateway na máquina atual:

```bash
openclaw exec-policy preset yolo
```

Esse atalho local atualiza ambos:

- `tools.exec.host/security/ask` local
- padrões locais de `~/.openclaw/exec-approvals.json`

Ele é intencionalmente apenas local. Se você precisar alterar aprovações do host do gateway ou do host do node
remotamente, continue usando `openclaw approvals set --gateway` ou
`openclaw approvals set --node <id|name|ip>`.

Para um host do node, aplique no lugar o mesmo arquivo de aprovações nesse node:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Limitação importante somente local:

- `openclaw exec-policy` não sincroniza aprovações do node
- `openclaw exec-policy set --host node` é rejeitado
- as aprovações de execução do node são buscadas do node em tempo de execução, portanto atualizações direcionadas ao node devem usar `openclaw approvals --node ...`

Atalho somente para a sessão:

- `/exec security=full ask=off` altera apenas a sessão atual.
- `/elevated full` é um atalho de emergência que também ignora aprovações de execução para essa sessão.

Se o arquivo de aprovações do host continuar mais restritivo do que a configuração, a política mais restritiva do host ainda prevalece.

## Controles de política

### Security (`exec.security`)

- **deny**: bloqueia todas as solicitações de execução no host.
- **allowlist**: permite apenas comandos na lista de permissão.
- **full**: permite tudo (equivalente a elevated).

### Ask (`exec.ask`)

- **off**: nunca exibe prompt.
- **on-miss**: exibe prompt somente quando a lista de permissão não corresponde.
- **always**: exibe prompt para todo comando.
- confiança durável `allow-always` não suprime prompts quando o modo efetivo de ask é `always`

### Ask fallback (`askFallback`)

Se um prompt for necessário, mas nenhuma UI estiver acessível, o fallback decide:

- **deny**: bloqueia.
- **allowlist**: permite apenas se a lista de permissão corresponder.
- **full**: permite.

### Endurecimento de eval inline de interpretador (`tools.exec.strictInlineEval`)

Quando `tools.exec.strictInlineEval=true`, o OpenClaw trata formas de avaliação de código inline como dependentes de aprovação mesmo que o binário do interpretador em si esteja na lista de permissão.

Exemplos:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Isto é defense-in-depth para carregadores de interpretador que não se mapeiam de forma limpa para um único operando estável de arquivo. No modo estrito:

- esses comandos ainda exigem aprovação explícita;
- `allow-always` não persiste automaticamente novas entradas de lista de permissão para eles.

## Lista de permissão (por agente)

As listas de permissão são **por agente**. Se houver vários agentes, alterne qual agente você está
editando no app macOS. Os padrões são correspondências de glob.
Os padrões podem ser globs de caminho resolvido do binário ou globs simples de nome de comando. Nomes simples
correspondem apenas a comandos invocados via PATH, então `rg` pode corresponder a `/opt/homebrew/bin/rg`
quando o comando é `rg`, mas não a `./rg` ou `/tmp/rg`. Use um glob de caminho quando
quiser confiar em um local específico do binário.
Entradas legadas `agents.default` são migradas para `agents.main` no carregamento.
Encadeamentos de shell como `echo ok && pwd` ainda exigem que cada segmento de nível superior satisfaça as regras da lista de permissão.

Exemplos:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Cada entrada da lista de permissão rastreia:

- **id** UUID estável usado para identidade na UI (opcional)
- **último uso** carimbo de data e hora
- **último comando usado**
- **último caminho resolvido**

## Permitir automaticamente CLIs de Skills

Quando **Permitir automaticamente CLIs de Skills** está ativado, executáveis referenciados por Skills conhecidos
são tratados como estando na lista de permissão em nodes (node macOS ou host do node sem interface). Isso usa
`skills.bins` sobre o RPC do Gateway para buscar a lista de bins de Skills. Desative isso se quiser listas de permissão manuais estritas.

Observações importantes de confiança:

- Esta é uma **lista de permissão implícita de conveniência**, separada das entradas manuais de lista de permissão por caminho.
- Ela se destina a ambientes de operador confiável em que o Gateway e o node estão no mesmo limite de confiança.
- Se você exigir confiança explícita estrita, mantenha `autoAllowSkills: false` e use apenas entradas manuais de lista de permissão por caminho.

## Bins seguros e encaminhamento de aprovação

Para bins seguros (o caminho rápido somente com stdin), detalhes de vínculo de interpretador e como
encaminhar prompts de aprovação para Slack/Discord/Telegram (ou executá-los como clientes nativos
de aprovação), consulte [Exec approvals — advanced](/pt-BR/tools/exec-approvals-advanced).

<!-- movido para /tools/exec-approvals-advanced -->

## Edição na UI de controle

Use o cartão **Control UI → Nodes → Exec approvals** para editar padrões, substituições
por agente e listas de permissão. Escolha um escopo (Padrões ou um agente), ajuste a política,
adicione/remova padrões de lista de permissão e depois clique em **Salvar**. A UI mostra metadados de **último uso**
por padrão para que você mantenha a lista organizada.

O seletor de destino escolhe **Gateway** (aprovações locais) ou um **Node**. Os nodes
precisam anunciar `system.execApprovals.get/set` (app macOS ou host do node sem interface).
Se um node ainda não anunciar aprovações de execução, edite seu
`~/.openclaw/exec-approvals.json` local diretamente.

CLI: `openclaw approvals` oferece suporte à edição de gateway ou node (consulte [Approvals CLI](/pt-BR/cli/approvals)).

## Fluxo de aprovação

Quando um prompt é necessário, o gateway transmite `exec.approval.requested` para clientes operadores.
A Control UI e o app macOS resolvem isso via `exec.approval.resolve`, então o gateway encaminha a
solicitação aprovada para o host do node.

Para `host=node`, as solicitações de aprovação incluem uma carga `systemRunPlan` canônica. O gateway usa
esse plano como o contexto autoritativo de comando/cwd/sessão ao encaminhar solicitações
`system.run` aprovadas.

Isso importa para a latência de aprovação assíncrona:

- o caminho de execução do node prepara um plano canônico logo no início
- o registro de aprovação armazena esse plano e seus metadados de vínculo
- uma vez aprovado, a chamada final encaminhada de `system.run` reutiliza o plano armazenado
  em vez de confiar em edições posteriores do chamador
- se o chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` após a criação da solicitação de aprovação, o gateway rejeitará a
  execução encaminhada como incompatibilidade de aprovação

## Eventos do sistema

O ciclo de vida da execução é exposto como mensagens do sistema:

- `Exec em execução` (somente se o comando exceder o limite de aviso de execução)
- `Exec concluído`
- `Exec negado`

Essas mensagens são publicadas na sessão do agente depois que o node relata o evento.
As aprovações de execução no host do gateway emitem os mesmos eventos de ciclo de vida quando o comando termina (e opcionalmente quando fica em execução por mais tempo do que o limite).
Execuções controladas por aprovação reutilizam o id da aprovação como `runId` nessas mensagens para facilitar a correlação.

## Comportamento de aprovação negada

Quando uma aprovação assíncrona de execução é negada, o OpenClaw impede que o agente reutilize
a saída de qualquer execução anterior do mesmo comando na sessão. O motivo da negação
é transmitido com orientação explícita de que nenhuma saída de comando está disponível, o que impede
o agente de alegar que há nova saída ou repetir o comando negado com
resultados obsoletos de uma execução anterior bem-sucedida.

## Implicações

- **full** é poderoso; prefira listas de permissão quando possível.
- **ask** mantém você no circuito e ainda permite aprovações rápidas.
- Listas de permissão por agente evitam que aprovações de um agente vazem para outros.
- As aprovações se aplicam apenas a solicitações de execução no host de **remetentes autorizados**. Remetentes não autorizados não podem emitir `/exec`.
- `/exec security=full` é uma conveniência no nível da sessão para operadores autorizados e ignora aprovações por design. Para bloquear rigidamente a execução no host, defina a segurança de aprovações como `deny` ou negue a ferramenta `exec` via política de ferramenta.

## Relacionado

<CardGroup cols={2}>
  <Card title="Exec approvals — advanced" href="/pt-BR/tools/exec-approvals-advanced" icon="gear">
    Bins seguros, vínculo de interpretador e encaminhamento de aprovação para o chat.
  </Card>
  <Card title="Ferramenta Exec" href="/pt-BR/tools/exec" icon="terminal">
    Ferramenta de execução de comandos de shell.
  </Card>
  <Card title="Modo elevated" href="/pt-BR/tools/elevated" icon="shield-exclamation">
    Caminho de emergência que também ignora aprovações.
  </Card>
  <Card title="Sandboxing" href="/pt-BR/gateway/sandboxing" icon="box">
    Modos de sandbox e acesso ao workspace.
  </Card>
  <Card title="Segurança" href="/pt-BR/gateway/security" icon="lock">
    Modelo de segurança e hardening.
  </Card>
  <Card title="Sandbox vs política de ferramenta vs elevated" href="/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Quando recorrer a cada controle.
  </Card>
  <Card title="Skills" href="/pt-BR/tools/skills" icon="sparkles">
    Comportamento de permissão automática sustentado por Skill.
  </Card>
</CardGroup>
