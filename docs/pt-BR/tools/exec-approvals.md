---
read_when:
    - Configurando aprovações de exec ou allowlists
    - Implementando a UX de aprovação de exec no app macOS
    - Revisando prompts de escape de sandbox e implicações
summary: Aprovações de exec, allowlists e prompts de escape de sandbox
title: Aprovações de exec
x-i18n:
    generated_at: "2026-04-24T06:16:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d7c5cd24e7c1831d5a865da6fa20f4c23280a0ec12b9e8f7f3245170a05a37d
    source_path: tools/exec-approvals.md
    workflow: 15
---

Aprovações de exec são a **proteção do app complementar / host de node** para permitir que um
agente em sandbox execute comandos em um host real (`gateway` ou `node`). É um
intertravamento de segurança: comandos só são permitidos quando política + allowlist + (opcional) aprovação do usuário concordam. As aprovações de exec ficam **por cima** da política de ferramentas e do gating de elevação (a menos que elevated esteja em `full`, que ignora aprovações).

<Note>
A política efetiva é a **mais restritiva** entre `tools.exec.*` e os padrões de aprovações;
se um campo de aprovações for omitido, o valor de `tools.exec` será usado. Exec no host
também usa o estado local de aprovações naquela máquina — um `ask: "always"` local em
`~/.openclaw/exec-approvals.json` continua solicitando confirmação mesmo se a sessão ou os padrões de configuração pedirem `ask: "on-miss"`.
</Note>

## Inspecionando a política efetiva

- `openclaw approvals get`, `... --gateway`, `... --node <id|name|ip>` — mostram a política solicitada, as fontes de política do host e o resultado efetivo.
- `openclaw exec-policy show` — visão mesclada da máquina local.
- `openclaw exec-policy set|preset` — sincroniza a política local solicitada com o arquivo local de aprovações do host em uma única etapa.

Quando um escopo local solicita `host=node`, `exec-policy show` informa esse escopo
como gerenciado por node em runtime, em vez de fingir que o arquivo local de aprovações é a fonte da verdade.

Se a UI do app complementar **não estiver disponível**, qualquer solicitação que normalmente
pediria confirmação é resolvida pelo **fallback de ask** (padrão: negar).

<Tip>
Clientes nativos de aprovação de chat podem preparar affordances específicas do canal na
mensagem de aprovação pendente. Por exemplo, o Matrix prepara atalhos de reação (`✅`
permitir uma vez, `❌` negar, `♾️` permitir sempre), ainda deixando comandos `/approve ...`
na mensagem como fallback.
</Tip>

## Onde isso se aplica

As aprovações de exec são aplicadas localmente no host de execução:

- **host do gateway** → processo `openclaw` na máquina do gateway
- **host do node** → executor de node (app complementar do macOS ou host de node headless)

Observação sobre o modelo de confiança:

- Chamadores autenticados no Gateway são operadores confiáveis para aquele Gateway.
- Nodes pareados estendem essa capacidade confiável de operador até o host do node.
- Aprovações de exec reduzem o risco de execução acidental, mas não são um limite de autenticação por usuário.
- Execuções aprovadas no host do node vinculam o contexto canônico de execução: `cwd` canônico, `argv` exato, vínculo de env quando presente e caminho fixado do executável quando aplicável.
- Para scripts shell e invocações diretas de arquivos por interpretador/runtime, o OpenClaw também tenta vincular um operando concreto de arquivo local. Se esse arquivo vinculado mudar após a aprovação, mas antes da execução, a execução é negada em vez de executar conteúdo alterado.
- Esse vínculo de arquivo é intencionalmente por melhor esforço, não um modelo semântico completo de todos os caminhos de carregamento de interpretador/runtime. Se o modo de aprovação não puder identificar exatamente um arquivo local concreto para vincular, ele se recusa a emitir uma execução com suporte de aprovação, em vez de fingir cobertura total.

Divisão no macOS:

- **serviço de host do node** encaminha `system.run` para o **app macOS** por IPC local.
- **app macOS** aplica aprovações + executa o comando no contexto da UI.

## Configurações e armazenamento

As aprovações ficam em um arquivo JSON local no host de execução:

`~/.openclaw/exec-approvals.json`

Exemplo de schema:

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

Se você quiser que exec no host rode sem prompts de aprovação, precisa abrir **as duas** camadas de política:

- política de exec solicitada na configuração do OpenClaw (`tools.exec.*`)
- política local de aprovações do host em `~/.openclaw/exec-approvals.json`

Este agora é o comportamento padrão do host, a menos que você o restrinja explicitamente:

- `tools.exec.security`: `full` em `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Distinção importante:

- `tools.exec.host=auto` escolhe onde o exec roda: sandbox quando disponível, senão gateway.
- YOLO escolhe como o exec no host é aprovado: `security=full` mais `ask=off`.
- Provedores com suporte de CLI que expõem seu próprio modo não interativo de permissão podem seguir essa política.
  O Claude CLI adiciona `--permission-mode bypassPermissions` quando a política solicitada de exec do OpenClaw é
  YOLO. Substitua esse comportamento de backend com args explícitos do Claude em
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs`, por exemplo
  `--permission-mode default`, `acceptEdits` ou `bypassPermissions`.
- No modo YOLO, o OpenClaw não adiciona uma barreira separada de aprovação heurística por ofuscação de comando nem uma camada de rejeição de preflight de script por cima da política configurada de exec no host.
- `auto` não transforma o roteamento para gateway em uma substituição gratuita a partir de uma sessão em sandbox. Uma solicitação por chamada `host=node` é permitida a partir de `auto`, e `host=gateway` só é permitido a partir de `auto` quando nenhum runtime de sandbox está ativo. Se você quiser um padrão estável e não automático, defina `tools.exec.host` ou use `/exec host=...` explicitamente.

Se você quiser uma configuração mais conservadora, restrinja qualquer uma das camadas de volta para `allowlist` / `on-miss`
ou `deny`.

Configuração persistente de host de gateway "nunca pedir confirmação":

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Depois configure o arquivo de aprovações do host para corresponder:

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

Atalho local para a mesma política de host de gateway na máquina atual:

```bash
openclaw exec-policy preset yolo
```

Esse atalho local atualiza ambos:

- `tools.exec.host/security/ask` local
- padrões locais de `~/.openclaw/exec-approvals.json`

Ele é intencionalmente apenas local. Se você precisar alterar aprovações de host de gateway ou host de node
remotamente, continue usando `openclaw approvals set --gateway` ou
`openclaw approvals set --node <id|name|ip>`.

Para um host de node, aplique o mesmo arquivo de aprovações nesse node:

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

Limitação importante apenas local:

- `openclaw exec-policy` não sincroniza aprovações de node
- `openclaw exec-policy set --host node` é rejeitado
- aprovações de exec de node são buscadas do node em runtime, então atualizações direcionadas a node devem usar `openclaw approvals --node ...`

Atalho apenas de sessão:

- `/exec security=full ask=off` altera apenas a sessão atual.
- `/elevated full` é um atalho de emergência que também ignora aprovações de exec para aquela sessão.

Se o arquivo de aprovações do host continuar mais restritivo do que a configuração, a política mais restritiva do host ainda vence.

## Controles de política

### Segurança (`exec.security`)

- **deny**: bloqueia todas as solicitações de exec no host.
- **allowlist**: permite apenas comandos na allowlist.
- **full**: permite tudo (equivalente a elevated).

### Ask (`exec.ask`)

- **off**: nunca pedir confirmação.
- **on-miss**: pedir confirmação apenas quando a allowlist não corresponder.
- **always**: pedir confirmação para todo comando.
- `allow-always` durável não suprime prompts quando o modo efetivo de ask é `always`

### Ask fallback (`askFallback`)

Se for necessária uma confirmação, mas nenhuma UI estiver acessível, o fallback decide:

- **deny**: bloquear.
- **allowlist**: permitir apenas se a allowlist corresponder.
- **full**: permitir.

### Endurecimento de eval inline de interpretador (`tools.exec.strictInlineEval`)

Quando `tools.exec.strictInlineEval=true`, o OpenClaw trata formas inline de eval de código como apenas-aprovação, mesmo que o binário do interpretador em si esteja na allowlist.

Exemplos:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Isso é defesa em profundidade para carregadores de interpretador que não se mapeiam claramente a um único operando estável de arquivo. Em modo estrito:

- esses comandos ainda precisam de aprovação explícita;
- `allow-always` não persiste automaticamente novas entradas de allowlist para eles.

## Allowlist (por agente)

Allowlists são **por agente**. Se existirem vários agentes, alterne qual agente você está
editando no app macOS. Os padrões são correspondências **glob sem diferenciação entre maiúsculas e minúsculas**.
Os padrões devem resolver para **caminhos de binário** (entradas apenas com basename são ignoradas).
Entradas legadas `agents.default` são migradas para `agents.main` ao carregar.
Encadeamentos shell como `echo ok && pwd` ainda exigem que todo segmento de nível superior satisfaça regras de allowlist.

Exemplos:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Cada entrada de allowlist rastreia:

- **id** UUID estável usado para identidade na UI (opcional)
- **last used** timestamp
- **last used command**
- **last resolved path**

## Auto-allow de CLIs de Skill

Quando **Auto-allow skill CLIs** está habilitado, executáveis referenciados por Skills conhecidas
são tratados como allowlisted em nodes (node macOS ou host de node headless). Isso usa
`skills.bins` pelo RPC do Gateway para buscar a lista de bins da Skill. Desabilite isso se quiser allowlists manuais estritas.

Observações importantes sobre confiança:

- Isso é uma **allowlist implícita de conveniência**, separada das entradas manuais de allowlist por caminho.
- Isso se destina a ambientes de operador confiável, nos quais Gateway e node estão no mesmo limite de confiança.
- Se você exigir confiança explícita e estrita, mantenha `autoAllowSkills: false` e use apenas entradas manuais de allowlist por caminho.

## Bins seguros e encaminhamento de aprovação

Para safe bins (o caminho rápido apenas com stdin), detalhes de vínculo de interpretador e como
encaminhar prompts de aprovação para Slack/Discord/Telegram (ou executá-los como clientes nativos de aprovação), consulte [Exec approvals — avançado](/pt-BR/tools/exec-approvals-advanced).

<!-- moved to /tools/exec-approvals-advanced -->

## Edição na UI de Controle

Use o cartão **UI de Controle → Nodes → Exec approvals** para editar padrões, substituições por agente
e allowlists. Escolha um escopo (Padrões ou um agente), ajuste a política,
adicione/remova padrões da allowlist e então **Save**. A UI mostra metadados de **last used** por
padrão para ajudar a manter a lista limpa.

O seletor de destino escolhe **Gateway** (aprovações locais) ou um **Node**. Nodes
devem anunciar `system.execApprovals.get/set` (app macOS ou host de node headless).
Se um node ainda não anunciar exec approvals, edite diretamente o arquivo local
`~/.openclaw/exec-approvals.json`.

CLI: `openclaw approvals` oferece suporte à edição de gateway ou node (consulte [CLI de Approvals](/pt-BR/cli/approvals)).

## Fluxo de aprovação

Quando uma confirmação é necessária, o gateway transmite `exec.approval.requested` para clientes operadores.
A UI de Controle e o app macOS resolvem isso via `exec.approval.resolve`, então o gateway encaminha a
solicitação aprovada para o host do node.

Para `host=node`, solicitações de aprovação incluem um payload canônico `systemRunPlan`. O gateway usa
esse plano como o contexto autoritativo de comando/cwd/sessão ao encaminhar solicitações aprovadas de `system.run`.

Isso importa para latência de aprovação assíncrona:

- o caminho de exec do node prepara um plano canônico antecipadamente
- o registro de aprovação armazena esse plano e seus metadados de vínculo
- uma vez aprovado, a chamada final encaminhada de `system.run` reutiliza o plano armazenado
  em vez de confiar em edições posteriores do chamador
- se o chamador mudar `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` depois que a solicitação de aprovação tiver sido criada, o gateway rejeita a
  execução encaminhada como incompatibilidade de aprovação

## Eventos de sistema

O ciclo de vida de exec é exposto como mensagens de sistema:

- `Exec running` (somente se o comando exceder o limite de aviso de execução)
- `Exec finished`
- `Exec denied`

Elas são publicadas na sessão do agente após o node informar o evento.
Aprovações de exec no host do gateway emitem os mesmos eventos de ciclo de vida quando o comando termina (e opcionalmente quando está em execução por mais tempo do que o limite).
Execs protegidos por aprovação reutilizam o ID da aprovação como `runId` nessas mensagens para correlação fácil.

## Comportamento de aprovação negada

Quando uma aprovação assíncrona de exec é negada, o OpenClaw impede o agente de reutilizar
saída de qualquer execução anterior do mesmo comando na sessão. O motivo da negação
é passado com orientação explícita de que nenhuma saída de comando está disponível, o que impede
o agente de alegar que há nova saída ou de repetir o comando negado com
resultados obsoletos de uma execução anterior bem-sucedida.

## Implicações

- **full** é poderoso; prefira allowlists quando possível.
- **ask** mantém você no circuito enquanto ainda permite aprovações rápidas.
- Allowlists por agente evitam que aprovações de um agente vazem para outros.
- Aprovações se aplicam apenas a solicitações de exec no host vindas de **remetentes autorizados**. Remetentes não autorizados não podem emitir `/exec`.
- `/exec security=full` é uma conveniência em nível de sessão para operadores autorizados e ignora aprovações por design. Para bloquear rigidamente exec no host, defina a segurança das aprovações como `deny` ou negue a ferramenta `exec` via política de ferramentas.

## Relacionado

<CardGroup cols={2}>
  <Card title="Exec approvals — avançado" href="/pt-BR/tools/exec-approvals-advanced" icon="gear">
    Safe bins, vínculo de interpretador e encaminhamento de aprovação para chat.
  </Card>
  <Card title="Ferramenta exec" href="/pt-BR/tools/exec" icon="terminal">
    Ferramenta de execução de comando shell.
  </Card>
  <Card title="Modo elevated" href="/pt-BR/tools/elevated" icon="shield-exclamation">
    Caminho de emergência que também ignora aprovações.
  </Card>
  <Card title="Sandboxing" href="/pt-BR/gateway/sandboxing" icon="box">
    Modos de sandbox e acesso ao workspace.
  </Card>
  <Card title="Segurança" href="/pt-BR/gateway/security" icon="lock">
    Modelo de segurança e endurecimento.
  </Card>
  <Card title="Sandbox vs política de ferramenta vs elevated" href="/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Quando recorrer a cada controle.
  </Card>
  <Card title="Skills" href="/pt-BR/tools/skills" icon="sparkles">
    Comportamento de auto-allow com suporte de Skill.
  </Card>
</CardGroup>
