---
read_when:
    - O OpenClaw não está funcionando e você precisa do caminho mais rápido para uma correção
    - Você quer um fluxo de triagem antes de mergulhar em runbooks detalhados
summary: Hub de solução de problemas do OpenClaw orientado primeiro pelo sintoma
title: Solução de problemas gerais
x-i18n:
    generated_at: "2026-06-27T17:37:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae1236c73e3a5c9237bd81d603e8dca18c595a8bcbb71f5931bfbf2389b342cd
    source_path: help/troubleshooting.md
    workflow: 16
---

Se você tem apenas 2 minutos, use esta página como porta de entrada para triagem.

## Primeiros 60 segundos

Execute esta sequência exata em ordem:

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw gateway status
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

Boa saída em uma linha:

- `openclaw status` → mostra os canais configurados e nenhum erro óbvio de autenticação.
- `openclaw status --all` → o relatório completo está presente e pode ser compartilhado.
- `openclaw gateway probe` → o destino esperado do gateway está acessível (`Reachable: yes`). `Capability: ...` informa qual nível de autenticação a sondagem conseguiu provar, e `Read probe: limited - missing scope: operator.read` indica diagnóstico degradado, não uma falha de conexão.
- `openclaw gateway status` → `Runtime: running`, `Connectivity probe: ok` e uma linha `Capability: ...` plausível. Use `--require-rpc` se também precisar de prova de RPC com escopo de leitura.
- `openclaw doctor` → nenhum erro bloqueante de configuração/serviço.
- `openclaw channels status --probe` → um Gateway acessível retorna estado de transporte
  ativo por conta, além de resultados de sondagem/auditoria como `works` ou `audit ok`; se o
  Gateway estiver inacessível, o comando volta para resumos baseados apenas na configuração.
- `openclaw logs --follow` → atividade estável, sem erros fatais repetidos.

## Assistente parece limitado ou sem ferramentas

Se o assistente não consegue inspecionar arquivos, executar comandos, usar automação de navegador ou
ver as ferramentas esperadas, verifique primeiro o perfil efetivo de ferramentas:

```bash
openclaw status
openclaw status --all
openclaw doctor
```

Causas comuns:

- `tools.profile: "messaging"` é intencionalmente restrito para agentes somente de chat.
- `tools.profile: "coding"` é o perfil usual para fluxos de trabalho com repositório, arquivos, shell
  e runtime.
- `tools.profile: "full"` expõe o conjunto mais amplo de ferramentas e deve ser limitado
  a agentes confiáveis controlados pelo operador.
- Sobrescritas por agente em `agents.list[].tools` podem restringir ou expandir o perfil
  raiz para um agente.

Altere o perfil de ferramentas raiz ou por agente, depois reinicie ou recarregue o Gateway
e execute `openclaw status --all` novamente. Consulte [Ferramentas](/pt-BR/tools) para o modelo
de perfis e sobrescritas de permissão/bloqueio.

## Contexto longo da Anthropic com 429

Se você vir:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`,
vá para [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pt-BR/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

## Backend local compatível com OpenAI funciona diretamente, mas falha no OpenClaw

Se seu backend `/v1` local ou auto-hospedado responde a pequenas sondagens diretas de
`/v1/chat/completions`, mas falha em `openclaw infer model run` ou em turnos normais
do agente:

1. Se o erro mencionar que `messages[].content` esperava uma string, defina
   `models.providers.<provider>.models[].compat.requiresStringContent: true`.
2. Se o backend ainda falhar apenas em turnos de agente do OpenClaw, defina
   `models.providers.<provider>.models[].compat.supportsTools: false` e tente novamente.
3. Se chamadas diretas pequenas ainda funcionam, mas prompts maiores do OpenClaw derrubam o
   backend, trate o problema restante como uma limitação do modelo/servidor upstream e
   continue no runbook detalhado:
   [/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail](/pt-BR/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)

## Instalação de Plugin falha por falta de extensões openclaw

Se a instalação falhar com `package.json missing openclaw.extensions`, o pacote do plugin
está usando um formato antigo que o OpenClaw não aceita mais.

Corrija no pacote do plugin:

1. Adicione `openclaw.extensions` ao `package.json`.
2. Aponte as entradas para arquivos de runtime compilados (geralmente `./dist/index.js`).
3. Republique o plugin e execute `openclaw plugins install <package>` novamente.

Exemplo:

```json
{
  "name": "@openclaw/my-plugin",
  "version": "1.2.3",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Referência: [Arquitetura de Plugin](/pt-BR/plugins/architecture)

## Política de instalação bloqueia instalações ou atualizações de plugins

Se uma atualização termina, mas os plugins estão desatualizados, desabilitados ou mostram mensagens como
`blocked by install policy`, `install policy failed closed` ou
`Disabled "<plugin>" after plugin update failure`, verifique
`security.installPolicy`.

A política de instalação roda em instalações e atualizações de plugins. Versões de plugins
mantidos pelo OpenClaw normalmente acompanham a versão do OpenClaw, então uma atualização do OpenClaw
também pode precisar de atualizações correspondentes de plugins `@openclaw/*` durante a sincronização pós-atualização.

Evite estes formatos amplos de política, a menos que você também mantenha a regra de upgrade
correspondente:

- Congelar plugins mantidos pelo OpenClaw em uma única versão antiga exata, como permitir
  apenas `@openclaw/*@2026.5.3`.
- Bloquear somente por tipo de origem, como toda solicitação de plugin npm, rede ou
  `request.mode: "update"`.
- Tratar o comando de política como opcional. Quando `security.installPolicy` está
  habilitado, um executável de política ausente, lento, ilegível ou bloqueado por permissão
  falha de modo fechado.
- Aprovar versões de plugins sem considerar o `openclawVersion` da solicitação de política
  e os metadados do candidato a plugin.

Regras de política mais seguras permitem atualizações de plugins confiáveis mantidos pelo OpenClaw quando o
candidato é compatível com o host OpenClaw atual, em vez de fixar uma
única versão para sempre. Se você bloqueia npm por padrão, crie uma exceção restrita
para os pacotes de plugins `@openclaw/*` confiáveis ou ids de plugins que você usa. Se você
diferencia solicitações de instalação e atualização, aplique a mesma regra de confiança a
`request.mode: "update"`.

Recuperação:

```bash
openclaw doctor --deep
openclaw plugins update --all
openclaw status --all
```

Se a política for intencionalmente rígida, relaxe-a para a janela de upgrade confiável do OpenClaw,
execute novamente `openclaw plugins update --all` e então restaure a regra mais rígida.
Se um plugin foi desabilitado após falha de atualização, inspecione-o e reabilite-o somente
depois que a atualização tiver sucesso:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
openclaw plugins enable <plugin-id>
```

Referência: [Política de instalação do operador](/pt-BR/tools/skills-config#operator-install-policy-securityinstallpolicy)

## Plugin presente, mas bloqueado por propriedade suspeita

Se `openclaw doctor`, a configuração ou os avisos de inicialização mostrarem:

```text
blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)
plugin present but blocked
```

os arquivos do plugin pertencem a um usuário Unix diferente do processo que os carrega.
Não remova a configuração do plugin. Corrija a propriedade dos arquivos ou execute o OpenClaw como
o mesmo usuário que possui o diretório de estado.

Instalações Docker normalmente rodam como `node` (uid `1000`). Para a configuração Docker
padrão, repare os bind mounts do host:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
openclaw doctor --fix
```

Se você executa intencionalmente o OpenClaw como root, repare a raiz gerenciada de plugins para
propriedade root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
openclaw doctor --fix
```

Documentação detalhada:

- [Propriedade do caminho do Plugin](/pt-BR/tools/plugin#blocked-plugin-path-ownership)
- [Permissões Docker](/pt-BR/install/docker#permissions-and-eacces)

## Árvore de decisão

```mermaid
flowchart TD
  A[OpenClaw is not working] --> B{What breaks first}
  B --> C[No replies]
  B --> D[Dashboard or Control UI will not connect]
  B --> E[Gateway will not start or service not running]
  B --> F[Channel connects but messages do not flow]
  B --> G[Cron or heartbeat did not fire or did not deliver]
  B --> H[Node is paired but camera canvas screen exec fails]
  B --> I[Browser tool fails]

  C --> C1[/No replies section/]
  D --> D1[/Control UI section/]
  E --> E1[/Gateway section/]
  F --> F1[/Channel flow section/]
  G --> G1[/Automation section/]
  H --> H1[/Node tools section/]
  I --> I1[/Browser section/]
```

<AccordionGroup>
  <Accordion title="Sem respostas">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw channels status --probe
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    ```

    Uma boa saída se parece com:

    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` ou `admin-capable`
    - Seu canal mostra transporte conectado e, quando houver suporte, `works` ou `audit ok` em `channels status --probe`
    - O remetente aparece como aprovado (ou a política de DM está aberta/em lista de permissões)

    Assinaturas comuns nos logs:

    - `drop guild message (mention required` → o bloqueio por menção impediu a mensagem no Discord.
    - `pairing request` → o remetente não está aprovado e está aguardando aprovação de pareamento por DM.
    - `blocked` / `allowlist` nos logs do canal → remetente, sala ou grupo está filtrado.

    Páginas detalhadas:

    - [/gateway/troubleshooting#no-replies](/pt-BR/gateway/troubleshooting#no-replies)
    - [/channels/troubleshooting](/pt-BR/channels/troubleshooting)
    - [/channels/pairing](/pt-BR/channels/pairing)

  </Accordion>

  <Accordion title="Painel ou UI de Controle não conecta">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Uma boa saída se parece com:

    - `Dashboard: http://...` é mostrado em `openclaw gateway status`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` ou `admin-capable`
    - Nenhum loop de autenticação nos logs

    Assinaturas comuns nos logs:

    - `device identity required` → contexto HTTP/não seguro não consegue concluir a autenticação do dispositivo.
    - `origin not allowed` → o `Origin` do navegador não é permitido para o destino do gateway da UI de Controle.
    - `AUTH_TOKEN_MISMATCH` com dicas de nova tentativa (`canRetryWithDeviceToken=true`) → uma nova tentativa confiável com token de dispositivo pode ocorrer automaticamente.
    - Essa nova tentativa com token em cache reutiliza o conjunto de escopos em cache armazenado com o token do dispositivo
      pareado. Chamadores com `deviceToken` explícito / `scopes` explícitos mantêm
      o conjunto de escopos solicitado.
    - No caminho assíncrono da UI de Controle via Tailscale Serve, tentativas com falha para o mesmo
      `{scope, ip}` são serializadas antes de o limitador registrar a falha, então uma
      segunda nova tentativa ruim simultânea já pode mostrar `retry later`.
    - `too many failed authentication attempts (retry later)` de uma origem de navegador localhost → falhas repetidas dessa mesma `Origin` são temporariamente
      bloqueadas; outra origem localhost usa um bucket separado.
    - `unauthorized` repetido depois dessa nova tentativa → token/senha incorreto, incompatibilidade de modo de autenticação ou token de dispositivo pareado obsoleto.
    - `gateway connect failed:` → a UI está apontando para a URL/porta errada ou para um Gateway inacessível.

    Páginas detalhadas:

    - [/gateway/troubleshooting#dashboard-control-ui-connectivity](/pt-BR/gateway/troubleshooting#dashboard-control-ui-connectivity)
    - [/web/control-ui](/pt-BR/web/control-ui)
    - [/gateway/authentication](/pt-BR/gateway/authentication)

  </Accordion>

  <Accordion title="Gateway não inicia ou serviço instalado não está em execução">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Uma boa saída se parece com:

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` ou `admin-capable`

    Assinaturas comuns nos logs:

    - `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → o modo do Gateway é remoto, ou o arquivo de configuração não tem o carimbo de modo local e deve ser reparado.
    - `refusing to bind gateway ... without auth` → bind fora de local loopback sem um caminho válido de autenticação do Gateway (token/senha, ou proxy confiável quando configurado).
    - `another gateway instance is already listening` ou `EADDRINUSE` → porta já em uso.

    Páginas detalhadas:

    - [/gateway/troubleshooting#gateway-service-not-running](/pt-BR/gateway/troubleshooting#gateway-service-not-running)
    - [/gateway/background-process](/pt-BR/gateway/background-process)
    - [/gateway/configuration](/pt-BR/gateway/configuration)

  </Accordion>

  <Accordion title="Canal conecta, mas as mensagens não fluem">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Uma boa saída se parece com:

    - O transporte do canal está conectado.
    - As verificações de pareamento/lista de permissões passam.
    - As menções são detectadas onde necessário.

    Assinaturas comuns de log:

    - `mention required` → o bloqueio por menção em grupo impediu o processamento.
    - `pairing` / `pending` → o remetente da DM ainda não foi aprovado.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → problema no token de permissão do canal.

    Páginas detalhadas:

    - [/gateway/troubleshooting#channel-connected-messages-not-flowing](/pt-BR/gateway/troubleshooting#channel-connected-messages-not-flowing)
    - [/channels/troubleshooting](/pt-BR/channels/troubleshooting)

  </Accordion>

  <Accordion title="Cron ou Heartbeat não disparou ou não entregou">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw cron status
    openclaw cron list
    openclaw cron runs --id <jobId> --limit 20
    openclaw logs --follow
    ```

    Uma boa saída se parece com:

    - `cron.status` mostra habilitado com um próximo despertar.
    - `cron runs` mostra entradas `ok` recentes.
    - Heartbeat está habilitado e não está fora do horário ativo.

    Assinaturas comuns de log:

    - `cron: scheduler disabled; jobs will not run automatically` → Cron está desabilitado.
    - `heartbeat skipped` com `reason=quiet-hours` → fora do horário ativo configurado.
    - `heartbeat skipped` com `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe, mas contém apenas estrutura vazia, como linhas em branco, comentários, cabeçalho, cerca de código ou checklist vazio.
    - `heartbeat skipped` com `reason=no-tasks-due` → o modo de tarefas de `HEARTBEAT.md` está ativo, mas nenhum dos intervalos de tarefa venceu ainda.
    - `heartbeat skipped` com `reason=alerts-disabled` → toda a visibilidade do Heartbeat está desabilitada (`showOk`, `showAlerts` e `useIndicator` estão todos desligados).
    - `requests-in-flight` → via principal ocupada; o despertar do Heartbeat foi adiado.
    - `unknown accountId` → a conta de destino da entrega do Heartbeat não existe.

    Páginas detalhadas:

    - [/gateway/troubleshooting#cron-and-heartbeat-delivery](/pt-BR/gateway/troubleshooting#cron-and-heartbeat-delivery)
    - [/automation/cron-jobs#troubleshooting](/pt-BR/automation/cron-jobs#troubleshooting)
    - [/gateway/heartbeat](/pt-BR/gateway/heartbeat)

  </Accordion>

  <Accordion title="Node está pareado, mas a ferramenta falha: câmera, canvas, tela ou exec">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw nodes status
    openclaw nodes describe --node <idOrNameOrIp>
    openclaw logs --follow
    ```

    Uma boa saída se parece com:

    - Node está listado como conectado e pareado para a função `node`.
    - A capacidade existe para o comando que você está invocando.
    - O estado de permissão está concedido para a ferramenta.

    Assinaturas comuns de log:

    - `NODE_BACKGROUND_UNAVAILABLE` → traga o aplicativo do Node para primeiro plano.
    - `*_PERMISSION_REQUIRED` → a permissão do SO foi negada/está ausente.
    - `SYSTEM_RUN_DENIED: approval required` → a aprovação de exec está pendente.
    - `SYSTEM_RUN_DENIED: allowlist miss` → comando não está na lista de permissões de exec.

    Páginas detalhadas:

    - [/gateway/troubleshooting#node-paired-tool-fails](/pt-BR/gateway/troubleshooting#node-paired-tool-fails)
    - [/nodes/troubleshooting](/pt-BR/nodes/troubleshooting)
    - [/tools/exec-approvals](/pt-BR/tools/exec-approvals)

  </Accordion>

  <Accordion title="Exec de repente pede aprovação">
    ```bash
    openclaw config get tools.exec.host
    openclaw config get tools.exec.security
    openclaw config get tools.exec.ask
    openclaw gateway restart
    ```

    O que mudou:

    - Se `tools.exec.host` não estiver definido, o padrão é `auto`.
    - `host=auto` resolve para `sandbox` quando um runtime de sandbox está ativo; caso contrário, para `gateway`.
    - `host=auto` é apenas roteamento; o comportamento "YOLO" sem prompt vem de `security=full` mais `ask=off` em gateway/node.
    - Em `gateway` e `node`, `tools.exec.security` não definido usa `full` como padrão.
    - `tools.exec.ask` não definido usa `off` como padrão.
    - Resultado: se você está vendo aprovações, alguma política local do host ou por sessão restringiu o exec em relação aos padrões atuais.

    Restaure o comportamento padrão atual sem aprovação:

    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```

    Alternativas mais seguras:

    - Defina apenas `tools.exec.host=gateway` se você só quiser roteamento estável do host.
    - Use `security=allowlist` com `ask=on-miss` se quiser exec no host, mas ainda quiser revisão em falhas da lista de permissões.
    - Habilite o modo sandbox se quiser que `host=auto` volte a resolver para `sandbox`.

    Assinaturas comuns de log:

    - `Approval required.` → comando está aguardando `/approve ...`.
    - `SYSTEM_RUN_DENIED: approval required` → a aprovação de exec no host do node está pendente.
    - `exec host=sandbox requires a sandbox runtime for this session` → seleção implícita/explícita de sandbox, mas o modo sandbox está desligado.

    Páginas detalhadas:

    - [/tools/exec](/pt-BR/tools/exec)
    - [/tools/exec-approvals](/pt-BR/tools/exec-approvals)
    - [/gateway/security#what-the-audit-checks-high-level](/pt-BR/gateway/security#what-the-audit-checks-high-level)

  </Accordion>

  <Accordion title="Ferramenta de navegador falha">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw browser status
    openclaw logs --follow
    openclaw doctor
    ```

    Uma boa saída se parece com:

    - O status do navegador mostra `running: true` e um navegador/perfil escolhido.
    - `openclaw` inicia, ou `user` consegue ver abas locais do Chrome.

    Assinaturas comuns de log:

    - `unknown command "browser"` ou `unknown command 'browser'` → `plugins.allow` está definido e não inclui `browser`.
    - `Failed to start Chrome CDP on port` → a inicialização do navegador local falhou.
    - `browser.executablePath not found` → o caminho do binário configurado está incorreto.
    - `browser.cdpUrl must be http(s) or ws(s)` → a URL CDP configurada usa um esquema não compatível.
    - `browser.cdpUrl has invalid port` → a URL CDP configurada tem uma porta inválida ou fora do intervalo.
    - `No Chrome tabs found for profile="user"` → o perfil de anexação Chrome MCP não tem abas locais abertas do Chrome.
    - `Remote CDP for profile "<name>" is not reachable` → o endpoint CDP remoto configurado não é acessível a partir deste host.
    - `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → o perfil somente anexação não tem alvo CDP ativo.
    - substituições obsoletas de viewport / modo escuro / localidade / offline em perfis somente anexação ou CDP remoto → execute `openclaw browser stop --browser-profile <name>` para fechar a sessão de controle ativa e liberar o estado de emulação sem reiniciar o Gateway.

    Páginas detalhadas:

    - [/gateway/troubleshooting#browser-tool-fails](/pt-BR/gateway/troubleshooting#browser-tool-fails)
    - [/tools/browser#missing-browser-command-or-tool](/pt-BR/tools/browser#missing-browser-command-or-tool)
    - [/tools/browser-linux-troubleshooting](/pt-BR/tools/browser-linux-troubleshooting)
    - [/tools/browser-wsl2-windows-remote-cdp-troubleshooting](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

  </Accordion>

</AccordionGroup>

## Relacionados

- [FAQ](/pt-BR/help/faq) — perguntas frequentes
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting) — problemas específicos do gateway
- [Doctor](/pt-BR/gateway/doctor) — verificações de integridade e reparos automatizados
- [Solução de problemas de canais](/pt-BR/channels/troubleshooting) — problemas de conectividade de canais
- [Solução de problemas de automação](/pt-BR/automation/cron-jobs#troubleshooting) — problemas de Cron e Heartbeat
