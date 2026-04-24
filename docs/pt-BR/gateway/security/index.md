---
read_when:
    - Adicionar recursos que ampliam acesso ou automação
summary: Considerações de segurança e modelo de ameaça para executar um gateway de IA com acesso ao shell
title: Segurança
x-i18n:
    generated_at: "2026-04-24T05:53:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d0e79f3fd76d75e545f8e58883bd06ffbf48f909b4987e90d6bae72ad9808b3
    source_path: gateway/security/index.md
    workflow: 15
---

<Warning>
  **Modelo de confiança de assistente pessoal.** Esta orientação presume um
  limite de operador confiável por gateway (modelo de usuário único, assistente pessoal).
  O OpenClaw **não** é um limite de segurança multi-inquilino hostil para múltiplos
  usuários adversariais compartilhando um agente ou gateway. Se você precisar de operação
  com confiança mista ou usuários adversariais, separe os limites de confiança (gateway +
  credenciais separados, idealmente usuários de SO ou hosts separados).
</Warning>

## Escopo primeiro: modelo de segurança de assistente pessoal

A orientação de segurança do OpenClaw presume uma implantação de **assistente pessoal**: um limite de operador confiável, potencialmente muitos agentes.

- Postura de segurança compatível: um usuário/limite de confiança por gateway (prefira um usuário de SO/host/VPS por limite).
- Não é um limite de segurança compatível: um gateway/agente compartilhado usado por usuários mutuamente não confiáveis ou adversariais.
- Se for necessário isolamento entre usuários adversariais, separe por limite de confiança (gateway + credenciais separados, e idealmente usuários/hosts separados de SO).
- Se múltiplos usuários não confiáveis puderem enviar mensagens a um agente com ferramentas ativadas, trate-os como compartilhando a mesma autoridade delegada de ferramentas para esse agente.

Esta página explica o reforço de segurança **dentro desse modelo**. Ela não afirma isolamento hostil multi-inquilino em um único gateway compartilhado.

## Verificação rápida: `openclaw security audit`

Consulte também: [Verificação formal (modelos de segurança)](/pt-BR/security/formal-verification)

Execute isso regularmente (especialmente após alterar a configuração ou expor superfícies de rede):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` permanece intencionalmente limitado: ele troca políticas abertas comuns de grupo
por allowlists, restaura `logging.redactSensitive: "tools"`, reforça
permissões de estado/configuração/arquivo incluído e usa redefinições de ACL do Windows em vez de
`chmod` do POSIX ao executar no Windows.

Ele sinaliza armadilhas comuns (exposição de autenticação do Gateway, exposição de controle do navegador, allowlists elevadas, permissões de sistema de arquivos, aprovações permissivas de exec e exposição de ferramentas de canal aberto).

O OpenClaw é tanto um produto quanto um experimento: você está conectando o comportamento de modelos de fronteira a superfícies reais de mensagens e ferramentas reais. **Não existe configuração “perfeitamente segura”.** O objetivo é ser deliberado sobre:

- quem pode falar com seu bot
- onde o bot tem permissão para agir
- no que o bot pode tocar

Comece com o menor acesso que ainda funcione e depois amplie à medida que ganhar confiança.

### Implantação e confiança no host

O OpenClaw assume que o host e o limite de configuração são confiáveis:

- Se alguém puder modificar o estado/configuração do host do Gateway (`~/.openclaw`, incluindo `openclaw.json`), trate essa pessoa como um operador confiável.
- Executar um Gateway para múltiplos operadores mutuamente não confiáveis/adversariais **não é uma configuração recomendada**.
- Para equipes com confiança mista, separe os limites de confiança com gateways separados (ou pelo menos usuários/hosts separados de SO).
- Padrão recomendado: um usuário por máquina/host (ou VPS), um gateway para esse usuário e um ou mais agentes nesse gateway.
- Dentro de uma instância de Gateway, o acesso autenticado de operador é um papel confiável do plano de controle, não um papel de inquilino por usuário.
- Identificadores de sessão (`sessionKey`, IDs de sessão, rótulos) são seletores de roteamento, não tokens de autorização.
- Se várias pessoas puderem enviar mensagens a um agente com ferramentas ativadas, cada uma delas poderá conduzir esse mesmo conjunto de permissões. O isolamento de sessão/memória por usuário ajuda na privacidade, mas não transforma um agente compartilhado em autorização por usuário no host.

### Workspace Slack compartilhado: risco real

Se “todos no Slack podem mandar mensagem para o bot”, o risco central é a autoridade delegada de ferramentas:

- qualquer remetente permitido pode induzir chamadas de ferramenta (`exec`, navegador, ferramentas de rede/arquivo) dentro da política do agente;
- injeção de prompt/conteúdo de um remetente pode causar ações que afetam estado, dispositivos ou saídas compartilhadas;
- se um agente compartilhado tiver credenciais/arquivos sensíveis, qualquer remetente permitido poderá potencialmente conduzir exfiltração via uso de ferramenta.

Use agentes/gateways separados com o mínimo de ferramentas para fluxos de trabalho de equipe; mantenha privados os agentes com dados pessoais.

### Agente compartilhado da empresa: padrão aceitável

Isso é aceitável quando todos que usam esse agente estão no mesmo limite de confiança (por exemplo, uma equipe da empresa) e o agente tem escopo estritamente empresarial.

- execute-o em uma máquina/VM/contêiner dedicada;
- use um usuário de SO dedicado + navegador/perfil/contas dedicados para esse runtime;
- não faça login desse runtime em contas pessoais Apple/Google ou em perfis pessoais de gerenciador de senhas/navegador.

Se você misturar identidades pessoais e empresariais no mesmo runtime, você colapsa a separação e aumenta o risco de exposição de dados pessoais.

## Conceito de confiança de Gateway e Node

Trate Gateway e Node como um único domínio de confiança de operador, com papéis diferentes:

- **Gateway** é o plano de controle e a superfície de política (`gateway.auth`, política de ferramenta, roteamento).
- **Node** é a superfície de execução remota pareada a esse Gateway (comandos, ações do dispositivo, capacidades locais do host).
- Um chamador autenticado no Gateway é confiável no escopo do Gateway. Após o pareamento, ações do Node são ações de operador confiável nesse Node.
- `sessionKey` é seleção de roteamento/contexto, não autenticação por usuário.
- Aprovações de exec (allowlist + ask) são proteções para intenção do operador, não isolamento hostil multi-inquilino.
- O padrão do produto OpenClaw para configurações confiáveis de operador único é que exec no host em `gateway`/`node` seja permitido sem prompts de aprovação (`security="full"`, `ask="off"` a menos que você torne mais rígido). Esse padrão é uma decisão intencional de UX, não uma vulnerabilidade por si só.
- Aprovações de exec vinculam contexto exato da solicitação e operandos diretos de arquivo local em best-effort; elas não modelam semanticamente todos os caminhos de carregador de runtime/interpretador. Use sandboxing e isolamento de host para limites fortes.

Se você precisar de isolamento entre usuários hostis, separe os limites de confiança por usuário/host de SO e execute gateways separados.

## Matriz de limites de confiança

Use isto como modelo rápido ao triar riscos:

| Limite ou controle                                           | O que significa                                  | Leitura equivocada comum                                                     |
| ------------------------------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------------------- |
| `gateway.auth` (token/senha/trusted-proxy/autenticação de dispositivo) | Autentica chamadores nas APIs do gateway         | “Precisa de assinaturas por mensagem em cada frame para ser seguro”         |
| `sessionKey`                                                 | Chave de roteamento para seleção de contexto/sessão | “A chave de sessão é um limite de autenticação de usuário”                  |
| Proteções de prompt/conteúdo                                 | Reduzem o risco de abuso do modelo               | “Apenas injeção de prompt já prova bypass de autenticação”                  |
| `canvas.eval` / evaluate do navegador                        | Capacidade intencional do operador quando ativada | “Qualquer primitiva JS eval é automaticamente uma vuln neste modelo de confiança” |
| Shell local `!` da TUI                                       | Execução local explicitamente acionada pelo operador | “Comando conveniente de shell local é injeção remota”                       |
| Pareamento de Node e comandos de Node                        | Execução remota em nível de operador em dispositivos pareados | “Controle remoto de dispositivo deve ser tratado como acesso de usuário não confiável por padrão” |

## Não são vulnerabilidades por design

<Accordion title="Achados comuns que estão fora de escopo">
  Esses padrões são relatados com frequência e normalmente são encerrados sem ação, a menos
  que um bypass real de limite seja demonstrado:

- Cadeias apenas de injeção de prompt sem bypass de política, autenticação ou sandbox.
- Alegações que assumem operação hostil multi-inquilino em um único host ou
  configuração compartilhados.
- Alegações que classificam acesso normal de operador em caminho de leitura (por exemplo
  `sessions.list` / `sessions.preview` / `chat.history`) como IDOR em uma
  configuração de gateway compartilhado.
- Achados de implantação somente localhost (por exemplo HSTS em um gateway apenas loopback).
- Achados sobre assinatura de Webhook de entrada do Discord para caminhos de entrada que não
  existem neste repositório.
- Relatórios que tratam metadados de pareamento de Node como uma segunda camada oculta de aprovação por comando para `system.run`, quando o limite real de execução ainda é
  a política global de comandos de Node do gateway mais as próprias
  aprovações de exec do Node.
- Achados de “autorização por usuário ausente” que tratam `sessionKey` como um
  token de autenticação.
  </Accordion>

## Linha de base reforçada em 60 segundos

Use esta linha de base primeiro e depois reative seletivamente ferramentas por agente confiável:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "substitua-por-um-token-longo-e-aleatório" },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

Isso mantém o Gateway somente local, isola DMs e desativa por padrão ferramentas de runtime/plano de controle.

## Regra rápida para caixa de entrada compartilhada

Se mais de uma pessoa puder enviar DM para o seu bot:

- Defina `session.dmScope: "per-channel-peer"` (ou `"per-account-channel-peer"` para canais com múltiplas contas).
- Mantenha `dmPolicy: "pairing"` ou allowlists rigorosas.
- Nunca combine DMs compartilhadas com acesso amplo a ferramentas.
- Isso reforça caixas de entrada cooperativas/compartilhadas, mas não foi projetado como isolamento hostil entre co-inquilinos quando usuários compartilham acesso de gravação no host/configuração.

## Modelo de visibilidade de contexto

O OpenClaw separa dois conceitos:

- **Autorização de acionamento**: quem pode acionar o agente (`dmPolicy`, `groupPolicy`, allowlists, bloqueios por menção).
- **Visibilidade de contexto**: qual contexto suplementar é injetado na entrada do modelo (corpo de resposta, texto citado, histórico de thread, metadados de encaminhamento).

Allowlists controlam acionamentos e autorização de comando. A configuração `contextVisibility` controla como o contexto suplementar (respostas citadas, raízes de thread, histórico buscado) é filtrado:

- `contextVisibility: "all"` (padrão) mantém o contexto suplementar como recebido.
- `contextVisibility: "allowlist"` filtra o contexto suplementar para remetentes permitidos pelas verificações ativas de allowlist.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, mas ainda mantém uma resposta citada explícita.

Defina `contextVisibility` por canal ou por sala/conversa. Consulte [Chats em grupo](/pt-BR/channels/groups#context-visibility-and-allowlists) para detalhes de configuração.

Orientação para triagem de advisories:

- Alegações que apenas mostram que “o modelo pode ver texto citado ou histórico de remetentes fora da allowlist” são achados de reforço de segurança tratáveis com `contextVisibility`, não bypass de limite de autenticação ou sandbox por si só.
- Para ter impacto de segurança, os relatórios ainda precisam demonstrar um bypass de limite de confiança (autenticação, política, sandbox, aprovação ou outro limite documentado).

## O que a auditoria verifica (alto nível)

- **Acesso de entrada** (políticas de DM, políticas de grupo, allowlists): estranhos podem acionar o bot?
- **Raio de impacto das ferramentas** (ferramentas elevadas + salas abertas): a injeção de prompt poderia virar ações de shell/arquivo/rede?
- **Deriva de aprovação de exec** (`security=full`, `autoAllowSkills`, allowlists de interpretador sem `strictInlineEval`): as proteções de exec no host ainda estão fazendo o que você pensa?
  - `security="full"` é um aviso amplo de postura, não prova de bug. É o padrão escolhido para configurações confiáveis de assistente pessoal; torne-o mais rígido apenas quando seu modelo de ameaça exigir aprovações ou proteções por allowlist.
- **Exposição de rede** (bind/auth do Gateway, Tailscale Serve/Funnel, tokens de autenticação fracos/curtos).
- **Exposição de controle do navegador** (Nodes remotos, portas de relay, endpoints CDP remotos).
- **Higiene de disco local** (permissões, symlinks, includes de configuração, caminhos de “pasta sincronizada”).
- **Plugins** (Plugins carregam sem uma allowlist explícita).
- **Deriva de política/configuração incorreta** (configurações Docker do sandbox configuradas, mas modo sandbox desativado; padrões ineficazes de `gateway.nodes.denyCommands` porque a correspondência é exata apenas por nome de comando, por exemplo `system.run`, e não inspeciona texto de shell; entradas perigosas em `gateway.nodes.allowCommands`; `tools.profile="minimal"` global sobrescrito por perfis por agente; ferramentas controladas por Plugin alcançáveis sob política de ferramenta permissiva).
- **Deriva de expectativa de runtime** (por exemplo, assumir que exec implícito ainda significa `sandbox` quando `tools.exec.host` agora usa `auto` por padrão, ou definir explicitamente `tools.exec.host="sandbox"` enquanto o modo sandbox está desativado).
- **Higiene de modelo** (avisa quando os modelos configurados parecem legados; não é um bloqueio rígido).

Se você executar `--deep`, o OpenClaw também tentará um probe live do Gateway em best-effort.

## Mapa de armazenamento de credenciais

Use isto ao auditar acesso ou decidir o que fazer backup:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token de bot do Telegram**: config/env ou `channels.telegram.tokenFile` (somente arquivo regular; symlinks são rejeitados)
- **Token de bot do Discord**: config/env ou SecretRef (provedores env/file/exec)
- **Tokens do Slack**: config/env (`channels.slack.*`)
- **Allowlists de pareamento**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (conta padrão)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (contas não padrão)
- **Perfis de autenticação de modelo**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Carga útil de segredos com suporte a arquivo (opcional)**: `~/.openclaw/secrets.json`
- **Importação legada de OAuth**: `~/.openclaw/credentials/oauth.json`

## Checklist de auditoria de segurança

Quando a auditoria imprimir achados, trate esta como a ordem de prioridade:

1. **Qualquer coisa “open” + ferramentas ativadas**: primeiro restrinja DMs/grupos (pareamento/allowlists) e depois torne mais rígida a política de ferramenta/sandboxing.
2. **Exposição de rede pública** (bind LAN, Funnel, autenticação ausente): corrija imediatamente.
3. **Exposição remota de controle do navegador**: trate como acesso de operador (somente tailnet, pareie Nodes deliberadamente, evite exposição pública).
4. **Permissões**: garanta que estado/configuração/credenciais/autenticação não sejam legíveis por grupo/mundo.
5. **Plugins**: carregue apenas o que você confia explicitamente.
6. **Escolha de modelo**: prefira modelos modernos e reforçados para instruções para qualquer bot com ferramentas.

## Glossário da auditoria de segurança

Cada achado da auditoria é identificado por um `checkId` estruturado (por exemplo
`gateway.bind_no_auth` ou `tools.exec.security_full_configured`). Classes comuns de severidade crítica:

- `fs.*` — permissões de sistema de arquivos em estado, configuração, credenciais, perfis de autenticação.
- `gateway.*` — modo de bind, autenticação, Tailscale, Control UI, configuração de trusted-proxy.
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` — reforço por superfície.
- `plugins.*`, `skills.*` — cadeia de suprimentos e achados de varredura de Plugin/Skill.
- `security.exposure.*` — verificações transversais em que a política de acesso encontra o raio de impacto das ferramentas.

Consulte o catálogo completo com níveis de severidade, chaves de correção e suporte a correção automática em
[Verificações da auditoria de segurança](/pt-BR/gateway/security/audit-checks).

## Control UI por HTTP

A Control UI precisa de um **contexto seguro** (HTTPS ou localhost) para gerar identidade
de dispositivo. `gateway.controlUi.allowInsecureAuth` é uma chave de compatibilidade local:

- Em localhost, ela permite autenticação da Control UI sem identidade de dispositivo quando a página
  é carregada por HTTP não seguro.
- Ela não contorna verificações de pareamento.
- Ela não relaxa requisitos remotos (não localhost) de identidade de dispositivo.

Prefira HTTPS (Tailscale Serve) ou abra a interface em `127.0.0.1`.

Somente para cenários de emergência, `gateway.controlUi.dangerouslyDisableDeviceAuth`
desativa completamente as verificações de identidade de dispositivo. Isso é um rebaixamento severo de segurança;
mantenha desativado, a menos que você esteja depurando ativamente e possa reverter rapidamente.

Separadamente dessas flags perigosas, um `gateway.auth.mode: "trusted-proxy"` bem-sucedido
pode admitir sessões **de operador** da Control UI sem identidade de dispositivo. Esse é um
comportamento intencional do modo de autenticação, não um atalho de `allowInsecureAuth`, e ainda assim
não se estende a sessões da Control UI com papel de node.

`openclaw security audit` avisa quando essa configuração está ativada.

## Resumo de flags inseguras ou perigosas

`openclaw security audit` gera `config.insecure_or_dangerous_flags` quando
chaves de depuração conhecidas como inseguras/perigosas estão ativadas. Mantenha-as desativadas em
produção.

<AccordionGroup>
  <Accordion title="Flags monitoradas hoje pela auditoria">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`
  </Accordion>

  <Accordion title="Todas as chaves `dangerous*` / `dangerously*` no schema de configuração">
    Control UI e navegador:

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    Correspondência de nome de canal (canais empacotados e de Plugin; também disponível por
    `accounts.<accountId>` quando aplicável):

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching` (canal de Plugin)
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (canal de Plugin)
    - `channels.zalouser.dangerouslyAllowNameMatching` (canal de Plugin)
    - `channels.irc.dangerouslyAllowNameMatching` (canal de Plugin)
    - `channels.mattermost.dangerouslyAllowNameMatching` (canal de Plugin)

    Exposição de rede:

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork` (também por conta)

    Docker do sandbox (padrões + por agente):

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## Configuração de proxy reverso

Se você executar o Gateway atrás de um proxy reverso (nginx, Caddy, Traefik etc.), configure
`gateway.trustedProxies` para tratamento correto de IP de cliente encaminhado.

Quando o Gateway detecta cabeçalhos de proxy vindos de um endereço que **não** está em `trustedProxies`, ele **não** trata as conexões como clientes locais. Se a autenticação do gateway estiver desativada, essas conexões serão rejeitadas. Isso evita bypass de autenticação em que conexões com proxy, de outra forma, pareceriam vir de localhost e receberiam confiança automática.

`gateway.trustedProxies` também alimenta `gateway.auth.mode: "trusted-proxy"`, mas esse modo de autenticação é mais rígido:

- a autenticação trusted-proxy **falha em modo fail-closed em proxies com origem em loopback**
- proxies reversos no mesmo host em loopback ainda podem usar `gateway.trustedProxies` para detecção de cliente local e tratamento de IP encaminhado
- para proxies reversos em loopback no mesmo host, use autenticação por token/senha em vez de `gateway.auth.mode: "trusted-proxy"`

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # IP do proxy reverso
  # Opcional. Padrão false.
  # Ative apenas se seu proxy não puder fornecer X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

Quando `trustedProxies` está configurado, o Gateway usa `X-Forwarded-For` para determinar o IP do cliente. `X-Real-IP` é ignorado por padrão, a menos que `gateway.allowRealIpFallback: true` seja definido explicitamente.

Bom comportamento de proxy reverso (sobrescrever cabeçalhos de encaminhamento recebidos):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

Mau comportamento de proxy reverso (anexar/preservar cabeçalhos de encaminhamento não confiáveis):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## Observações sobre HSTS e origem

- O gateway OpenClaw é local/loopback primeiro. Se você terminar TLS em um proxy reverso, defina HSTS no domínio HTTPS voltado ao proxy.
- Se o próprio gateway terminar HTTPS, você pode definir `gateway.http.securityHeaders.strictTransportSecurity` para emitir o cabeçalho HSTS nas respostas do OpenClaw.
- A orientação detalhada de implantação está em [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth#tls-termination-and-hsts).
- Para implantações da Control UI fora de loopback, `gateway.controlUi.allowedOrigins` é obrigatório por padrão.
- `gateway.controlUi.allowedOrigins: ["*"]` é uma política explícita de permitir todas as origens do navegador, não um padrão reforçado. Evite isso fora de testes locais rigidamente controlados.
- Falhas de autenticação de origem do navegador em loopback ainda são limitadas por taxa, mesmo quando a
  isenção geral de loopback está ativada, mas a chave de bloqueio é delimitada por
  valor `Origin` normalizado em vez de um bucket compartilhado de localhost.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` ativa o modo de fallback de origem por cabeçalho Host; trate isso como uma política perigosa escolhida pelo operador.
- Trate rebinding de DNS e comportamento de cabeçalho host de proxy como preocupações de reforço de implantação; mantenha `trustedProxies` estrito e evite expor o gateway diretamente à internet pública.

## Logs de sessão locais vivem em disco

O OpenClaw armazena transcrições de sessão em disco em `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
Isso é necessário para continuidade de sessão e (opcionalmente) indexação de memória da sessão, mas também significa que
**qualquer processo/usuário com acesso ao sistema de arquivos pode ler esses logs**. Trate o acesso ao disco como o limite
de confiança e restrinja permissões em `~/.openclaw` (consulte a seção de auditoria abaixo). Se você precisar de
isolamento mais forte entre agentes, execute-os sob usuários de SO separados ou em hosts separados.

## Execução de Node (`system.run`)

Se um Node macOS estiver pareado, o Gateway poderá invocar `system.run` nesse Node. Isso é **execução remota de código** no Mac:

- Requer pareamento de Node (aprovação + token).
- O pareamento de Node do Gateway não é uma superfície de aprovação por comando. Ele estabelece identidade/confiança do Node e emissão de token.
- O Gateway aplica uma política global grosseira de comandos de Node via `gateway.nodes.allowCommands` / `denyCommands`.
- Controlado no Mac por **Configurações → Aprovações de exec** (security + ask + allowlist).
- A política `system.run` por Node é o próprio arquivo de aprovações de exec do Node (`exec.approvals.node.*`), que pode ser mais rígido ou mais flexível que a política global do Gateway por ID de comando.
- Um Node executando com `security="full"` e `ask="off"` está seguindo o modelo padrão de operador confiável. Trate isso como comportamento esperado, a menos que sua implantação exija explicitamente uma postura mais rígida de aprovação ou allowlist.
- O modo de aprovação vincula contexto exato da solicitação e, quando possível, um operando concreto de script/arquivo local. Se o OpenClaw não conseguir identificar exatamente um arquivo local direto para um comando de interpretador/runtime, a execução com suporte de aprovação será negada em vez de prometer cobertura semântica total.
- Para `host=node`, execuções com suporte de aprovação também armazenam um `systemRunPlan`
  canônico preparado; encaminhamentos aprovados posteriores reutilizam esse plano armazenado, e a
  validação do gateway rejeita edições do chamador em comando/cwd/contexto de sessão após a
  criação da solicitação de aprovação.
- Se você não quiser execução remota, defina security como **deny** e remova o pareamento de Node desse Mac.

Essa distinção importa para triagem:

- Um Node pareado que se reconecta anunciando uma lista diferente de comandos não é, por si só, uma vulnerabilidade se a política global do Gateway e as aprovações locais de exec do Node ainda impuserem o limite real de execução.
- Relatórios que tratam metadados de pareamento de Node como uma segunda camada oculta de aprovação por comando normalmente são confusão de política/UX, não bypass de limite de segurança.

## Skills dinâmicas (watcher / Nodes remotos)

O OpenClaw pode atualizar a lista de Skills no meio da sessão:

- **Watcher de Skills**: alterações em `SKILL.md` podem atualizar o snapshot de Skills no próximo turno do agente.
- **Nodes remotos**: conectar um Node macOS pode tornar Skills exclusivos de macOS elegíveis (com base em sondagem de binários).

Trate pastas de Skill como **código confiável** e restrinja quem pode modificá-las.

## O modelo de ameaça

Seu assistente de IA pode:

- Executar comandos arbitrários de shell
- Ler/gravar arquivos
- Acessar serviços de rede
- Enviar mensagens para qualquer pessoa (se você der acesso ao WhatsApp)

Pessoas que mandam mensagem para você podem:

- Tentar enganar sua IA para fazer coisas ruins
- Fazer engenharia social para acessar seus dados
- Sondar detalhes da infraestrutura

## Conceito central: controle de acesso antes da inteligência

A maioria das falhas aqui não são exploits sofisticados — são “alguém mandou mensagem para o bot e o bot fez o que pediram”.

A postura do OpenClaw:

- **Identidade primeiro:** decida quem pode falar com o bot (pareamento de DM / allowlists / “open” explícito).
- **Escopo depois:** decida onde o bot tem permissão para agir (allowlists de grupo + bloqueio por menção, ferramentas, sandboxing, permissões de dispositivo).
- **Modelo por último:** presuma que o modelo pode ser manipulado; projete de modo que a manipulação tenha raio de impacto limitado.

## Modelo de autorização de comandos

Comandos slash e diretivas só são respeitados para **remetentes autorizados**. A autorização é derivada de
allowlists/pareamento do canal mais `commands.useAccessGroups` (consulte [Configuration](/pt-BR/gateway/configuration)
e [Comandos slash](/pt-BR/tools/slash-commands)). Se a allowlist de um canal estiver vazia ou incluir `"*"`,
os comandos ficam efetivamente abertos para esse canal.

`/exec` é uma conveniência apenas de sessão para operadores autorizados. Ele **não** grava configuração nem
altera outras sessões.

## Risco de ferramentas do plano de controle

Duas ferramentas internas podem fazer alterações persistentes no plano de controle:

- `gateway` pode inspecionar configuração com `config.schema.lookup` / `config.get`, e pode fazer alterações persistentes com `config.apply`, `config.patch` e `update.run`.
- `cron` pode criar trabalhos agendados que continuam executando depois que o chat/tarefa original termina.

A ferramenta de runtime `gateway` somente para o proprietário ainda se recusa a regravar
`tools.exec.ask` ou `tools.exec.security`; aliases legados `tools.bash.*` são
normalizados para os mesmos caminhos protegidos de exec antes da gravação.

Para qualquer agente/superfície que lide com conteúdo não confiável, negue essas ferramentas por padrão:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` bloqueia apenas ações de reinicialização. Ele não desativa ações de configuração/atualização do `gateway`.

## Plugins

Plugins são executados **em processo** com o Gateway. Trate-os como código confiável:

- Instale apenas Plugins de fontes nas quais você confia.
- Prefira allowlists explícitas em `plugins.allow`.
- Revise a configuração do Plugin antes de ativá-lo.
- Reinicie o Gateway após alterações de Plugin.
- Se você instalar ou atualizar Plugins (`openclaw plugins install <package>`, `openclaw plugins update <id>`), trate isso como execução de código não confiável:
  - O caminho de instalação é o diretório por Plugin sob a raiz ativa de instalação de Plugin.
  - O OpenClaw executa uma varredura interna de código perigoso antes da instalação/atualização. Achados `critical` bloqueiam por padrão.
  - O OpenClaw usa `npm pack` e depois executa `npm install --omit=dev` nesse diretório (scripts de ciclo de vida do npm podem executar código durante a instalação).
  - Prefira versões fixadas e exatas (`@scope/pkg@1.2.3`) e inspecione o código desempacotado em disco antes de ativar.
  - `--dangerously-force-unsafe-install` é apenas para emergência em falsos positivos da varredura interna em fluxos de instalação/atualização de Plugin. Ele não contorna bloqueios de política do hook `before_install` do Plugin e não contorna falhas de varredura.
  - Instalações de dependências de Skill com suporte do Gateway seguem a mesma divisão perigoso/suspeito: achados `critical` internos bloqueiam, a menos que o chamador defina explicitamente `dangerouslyForceUnsafeInstall`, enquanto achados suspeitos continuam apenas emitindo aviso. `openclaw skills install` continua sendo o fluxo separado de download/instalação de Skill do ClawHub.

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Modelo de acesso por DM: pairing, allowlist, open, disabled

Todos os canais atuais com suporte a DM oferecem uma política de DM (`dmPolicy` ou `*.dm.policy`) que controla DMs de entrada **antes** do processamento da mensagem:

- `pairing` (padrão): remetentes desconhecidos recebem um código curto de pareamento e o bot ignora a mensagem até aprovação. Os códigos expiram após 1 hora; DMs repetidas não reenviam um código até que uma nova solicitação seja criada. Solicitações pendentes têm limite padrão de **3 por canal**.
- `allowlist`: remetentes desconhecidos são bloqueados (sem handshake de pareamento).
- `open`: permite que qualquer pessoa envie DM (público). **Exige** que a allowlist do canal inclua `"*"` (opt-in explícito).
- `disabled`: ignora completamente DMs de entrada.

Aprove via CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Detalhes + arquivos em disco: [Pareamento](/pt-BR/channels/pairing)

## Isolamento de sessão de DM (modo multiusuário)

Por padrão, o OpenClaw roteia **todas as DMs para a sessão principal** para que seu assistente tenha continuidade entre dispositivos e canais. Se **múltiplas pessoas** puderem enviar DM ao bot (DMs abertas ou uma allowlist com várias pessoas), considere isolar sessões de DM:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

Isso evita vazamento de contexto entre usuários, mantendo chats em grupo isolados.

Esse é um limite de contexto de mensagens, não um limite de administração do host. Se os usuários forem mutuamente adversariais e compartilharem o mesmo host/configuração do Gateway, execute gateways separados por limite de confiança.

### Modo de DM seguro (recomendado)

Trate o snippet acima como **modo de DM seguro**:

- Padrão: `session.dmScope: "main"` (todas as DMs compartilham uma sessão para continuidade).
- Padrão do onboarding da CLI local: grava `session.dmScope: "per-channel-peer"` quando não definido (mantém valores explícitos existentes).
- Modo de DM seguro: `session.dmScope: "per-channel-peer"` (cada par canal+remetente recebe um contexto de DM isolado).
- Isolamento de peer entre canais: `session.dmScope: "per-peer"` (cada remetente recebe uma sessão em todos os canais do mesmo tipo).

Se você executar múltiplas contas no mesmo canal, use `per-account-channel-peer`. Se a mesma pessoa entrar em contato com você por múltiplos canais, use `session.identityLinks` para recolher essas sessões de DM em uma identidade canônica. Consulte [Gerenciamento de sessão](/pt-BR/concepts/session) e [Configuration](/pt-BR/gateway/configuration).

## Allowlists para DMs e grupos

O OpenClaw tem duas camadas separadas de “quem pode me acionar?”:

- **Allowlist de DM** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; legado: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): quem tem permissão para falar com o bot em mensagens diretas.
  - Quando `dmPolicy="pairing"`, as aprovações são gravadas no armazenamento de allowlist de pareamento com escopo de conta em `~/.openclaw/credentials/` (`<channel>-allowFrom.json` para a conta padrão, `<channel>-<accountId>-allowFrom.json` para contas não padrão), mesclado com as allowlists da configuração.
- **Allowlist de grupo** (específica do canal): de quais grupos/canais/guilds o bot aceitará mensagens.
  - Padrões comuns:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: padrões por grupo como `requireMention`; quando definidos, também atuam como allowlist de grupo (inclua `"*"` para manter o comportamento de permitir tudo).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: restringe quem pode acionar o bot _dentro_ de uma sessão de grupo (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: allowlists por superfície + padrões de menção.
  - Verificações de grupo são executadas nesta ordem: `groupPolicy`/allowlists de grupo primeiro, ativação por menção/resposta depois.
  - Responder a uma mensagem do bot (menção implícita) **não** contorna allowlists de remetente como `groupAllowFrom`.
  - **Observação de segurança:** trate `dmPolicy="open"` e `groupPolicy="open"` como configurações de último recurso. Elas devem ser raramente usadas; prefira pairing + allowlists, a menos que você confie totalmente em todos os membros da sala.

Detalhes: [Configuration](/pt-BR/gateway/configuration) e [Grupos](/pt-BR/channels/groups)

## Injeção de prompt (o que é, por que importa)

Injeção de prompt ocorre quando um atacante cria uma mensagem que manipula o modelo para fazer algo inseguro (“ignore suas instruções”, “despeje seu sistema de arquivos”, “siga este link e execute comandos” etc.).

Mesmo com prompts de sistema fortes, **injeção de prompt não está resolvida**. Proteções de prompt de sistema são apenas orientação suave; a aplicação rígida vem da política de ferramenta, aprovações de exec, sandboxing e allowlists de canal (e os operadores podem desativá-las por design). O que ajuda na prática:

- Mantenha DMs de entrada restritas (pairing/allowlists).
- Prefira bloqueio por menção em grupos; evite bots “sempre ativos” em salas públicas.
- Trate links, anexos e instruções coladas como hostis por padrão.
- Execute ferramentas sensíveis em sandbox; mantenha segredos fora do sistema de arquivos alcançável pelo agente.
- Observação: o sandboxing é opt-in. Se o modo sandbox estiver desativado, `host=auto` implícito resolve para o host do gateway. `host=sandbox` explícito ainda falha em modo fail-closed porque não há runtime de sandbox disponível. Defina `host=gateway` se quiser que esse comportamento fique explícito na configuração.
- Limite ferramentas de alto risco (`exec`, `browser`, `web_fetch`, `web_search`) a agentes confiáveis ou allowlists explícitas.
- Se você usar allowlist de interpretadores (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), ative `tools.exec.strictInlineEval` para que formas de avaliação inline ainda exijam aprovação explícita.
- A análise de aprovação de shell também rejeita formas de expansão de parâmetros POSIX (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) dentro de **heredocs sem aspas**, para que um corpo de heredoc em allowlist não consiga esconder expansão de shell na revisão da allowlist como texto simples. Coloque aspas no terminador do heredoc (por exemplo `<<'EOF'`) para optar por semântica literal do corpo; heredocs sem aspas que expandiriam variáveis são rejeitados.
- **A escolha do modelo importa:** modelos antigos/menores/legados são significativamente menos robustos contra injeção de prompt e uso indevido de ferramentas. Para agentes com ferramentas ativadas, use o modelo mais forte, da geração mais recente e reforçado para instruções.

Sinais de alerta a tratar como não confiáveis:

- “Leia este arquivo/URL e faça exatamente o que ele diz.”
- “Ignore seu prompt de sistema ou suas regras de segurança.”
- “Revele suas instruções ocultas ou saídas de ferramenta.”
- “Cole o conteúdo completo de ~/.openclaw ou dos seus logs.”

## Sanitização de tokens especiais em conteúdo externo

O OpenClaw remove literais comuns de tokens especiais de templates de chat de LLM auto-hospedados de conteúdo externo encapsulado e metadados antes que eles cheguem ao modelo. As famílias de marcadores cobertas incluem tokens de papel/turno de Qwen/ChatML, Llama, Gemma, Mistral, Phi e GPT-OSS.

Por quê:

- Backends compatíveis com OpenAI que ficam na frente de modelos auto-hospedados às vezes preservam tokens especiais que aparecem no texto do usuário, em vez de mascará-los. Um atacante que possa gravar em conteúdo externo de entrada (uma página buscada, corpo de email, saída de ferramenta de conteúdo de arquivo) poderia, de outra forma, injetar um limite sintético de papel `assistant` ou `system` e escapar das proteções de encapsulamento de conteúdo.
- A sanitização acontece na camada de encapsulamento de conteúdo externo, então se aplica uniformemente a ferramentas de fetch/read e conteúdo de canal de entrada, em vez de ser por provedor.
- Respostas de modelo de saída já têm um sanitizador separado que remove `<tool_call>`, `<function_calls>` e estruturas semelhantes vazadas das respostas visíveis ao usuário. O sanitizador de conteúdo externo é a contraparte de entrada.

Isso não substitui os outros reforços desta página — `dmPolicy`, allowlists, aprovações de exec, sandboxing e `contextVisibility` ainda fazem o trabalho principal. Isso fecha um bypass específico na camada do tokenizer contra stacks auto-hospedadas que encaminham texto do usuário com tokens especiais intactos.

## Flags de bypass de conteúdo externo inseguro

O OpenClaw inclui flags explícitas de bypass que desativam o encapsulamento seguro de conteúdo externo:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Campo de payload de Cron `allowUnsafeExternalContent`

Orientação:

- Mantenha isso desativado/false em produção.
- Ative apenas temporariamente para depuração com escopo bem restrito.
- Se ativado, isole esse agente (sandbox + ferramentas mínimas + namespace de sessão dedicado).

Observação de risco para hooks:

- Payloads de hook são conteúdo não confiável, mesmo quando a entrega vem de sistemas que você controla (conteúdo de email/documentos/web pode carregar injeção de prompt).
- Tiers de modelo fracas aumentam esse risco. Para automação dirigida por hook, prefira tiers modernas e fortes de modelo e mantenha a política de ferramenta rígida (`tools.profile: "messaging"` ou mais rígida), além de sandboxing quando possível.

### Injeção de prompt não exige DMs públicas

Mesmo que **só você** possa mandar mensagem para o bot, injeção de prompt ainda pode acontecer por
qualquer **conteúdo não confiável** que o bot leia (resultados de busca/fetch na web, páginas do navegador,
emails, documentos, anexos, logs/código colados). Em outras palavras: o remetente não é
a única superfície de ameaça; o **próprio conteúdo** pode carregar instruções adversariais.

Quando ferramentas estão ativadas, o risco típico é exfiltrar contexto ou disparar
chamadas de ferramenta. Reduza o raio de impacto:

- Usando um **agente leitor** somente leitura ou sem ferramentas para resumir conteúdo não confiável,
  e então passando o resumo para o agente principal.
- Mantendo `web_search` / `web_fetch` / `browser` desativados para agentes com ferramentas ativadas, a menos que sejam necessários.
- Para entradas de URL do OpenResponses (`input_file` / `input_image`), defina
  `gateway.http.endpoints.responses.files.urlAllowlist` e
  `gateway.http.endpoints.responses.images.urlAllowlist` de forma rígida, e mantenha `maxUrlParts` baixo.
  Allowlists vazias são tratadas como não definidas; use `files.allowUrl: false` / `images.allowUrl: false`
  se quiser desativar totalmente a busca por URL.
- Para entradas de arquivo do OpenResponses, o texto decodificado de `input_file` ainda é injetado como
  **conteúdo externo não confiável**. Não presuma que o texto do arquivo seja confiável só porque
  o Gateway o decodificou localmente. O bloco injetado ainda carrega marcadores explícitos de limite
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` mais metadados `Source: External`,
  embora esse caminho omita o banner mais longo `SECURITY NOTICE:`.
- O mesmo encapsulamento baseado em marcadores é aplicado quando o entendimento de mídia extrai texto
  de documentos anexados antes de acrescentar esse texto ao prompt de mídia.
- Ativando sandboxing e allowlists rígidas de ferramentas para qualquer agente que toque entrada não confiável.
- Mantendo segredos fora dos prompts; passe-os por env/config no host do gateway.

### Backends LLM auto-hospedados

Backends auto-hospedados compatíveis com OpenAI, como vLLM, SGLang, TGI, LM Studio
ou stacks personalizadas de tokenizer do Hugging Face, podem diferir de provedores hospedados em como
tokens especiais de template de chat são tratados. Se um backend tokenizar strings literais
como `<|im_start|>`, `<|start_header_id|>` ou `<start_of_turn>` como
tokens estruturais do template de chat dentro de conteúdo do usuário, texto não confiável pode tentar
forjar limites de papel na camada do tokenizer.

O OpenClaw remove literais comuns de tokens especiais de famílias de modelos de
conteúdo externo encapsulado antes de enviá-lo ao modelo. Mantenha o encapsulamento de conteúdo
externo ativado e prefira configurações de backend que dividam ou escapem
tokens especiais em conteúdo fornecido pelo usuário quando disponíveis. Provedores hospedados como OpenAI
e Anthropic já aplicam sua própria sanitização no lado da requisição.

### Força do modelo (observação de segurança)

A resistência à injeção de prompt **não** é uniforme entre tiers de modelo. Modelos menores/mais baratos são geralmente mais suscetíveis a uso indevido de ferramentas e sequestro de instruções, especialmente sob prompts adversariais.

<Warning>
Para agentes com ferramentas ativadas ou agentes que leem conteúdo não confiável, o risco de injeção de prompt com modelos antigos/menores costuma ser alto demais. Não execute essas cargas de trabalho em tiers fracas de modelo.
</Warning>

Recomendações:

- **Use o modelo da geração mais recente e da melhor tier disponível** para qualquer bot que possa executar ferramentas ou tocar arquivos/redes.
- **Não use tiers antigas/mais fracas/menores** para agentes com ferramentas ativadas ou caixas de entrada não confiáveis; o risco de injeção de prompt é alto demais.
- Se você precisar usar um modelo menor, **reduza o raio de impacto** (ferramentas somente leitura, sandboxing forte, acesso mínimo ao sistema de arquivos, allowlists rígidas).
- Ao executar modelos pequenos, **ative sandboxing para todas as sessões** e **desative web_search/web_fetch/browser**, a menos que as entradas sejam rigidamente controladas.
- Para assistentes pessoais apenas de chat com entrada confiável e sem ferramentas, modelos menores costumam ser suficientes.

## Raciocínio e saída detalhada em grupos

`/reasoning`, `/verbose` e `/trace` podem expor raciocínio interno, saída de ferramenta
ou diagnósticos de Plugin que
não deveriam aparecer em um canal público. Em configurações de grupo, trate-os como **apenas
depuração** e mantenha-os desativados, a menos que você precise explicitamente deles.

Orientação:

- Mantenha `/reasoning`, `/verbose` e `/trace` desativados em salas públicas.
- Se ativá-los, faça isso apenas em DMs confiáveis ou salas rigidamente controladas.
- Lembre-se: saída verbose e trace pode incluir args de ferramentas, URLs, diagnósticos de Plugin e dados que o modelo viu.

## Exemplos de reforço de configuração

### Permissões de arquivo

Mantenha configuração + estado privados no host do gateway:

- `~/.openclaw/openclaw.json`: `600` (somente leitura/gravação do usuário)
- `~/.openclaw`: `700` (somente usuário)

`openclaw doctor` pode avisar e oferecer apertar essas permissões.

### Exposição de rede (bind, porta, firewall)

O Gateway multiplexa **WebSocket + HTTP** em uma única porta:

- Padrão: `18789`
- Configuração/flags/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

Essa superfície HTTP inclui a Control UI e o host do canvas:

- Control UI (assets SPA) (caminho base padrão `/`)
- Host do canvas: `/__openclaw__/canvas/` e `/__openclaw__/a2ui/` (HTML/JS arbitrário; trate como conteúdo não confiável)

Se você carregar conteúdo de canvas em um navegador comum, trate-o como qualquer outra página web não confiável:

- Não exponha o host do canvas a redes/usuários não confiáveis.
- Não faça o conteúdo do canvas compartilhar a mesma origem que superfícies web privilegiadas, a menos que você entenda totalmente as implicações.

O modo de bind controla onde o Gateway escuta:

- `gateway.bind: "loopback"` (padrão): somente clientes locais podem se conectar.
- Binds fora de loopback (`"lan"`, `"tailnet"`, `"custom"`) ampliam a superfície de ataque. Use-os apenas com autenticação do gateway (token/senha compartilhados ou um trusted proxy fora de loopback corretamente configurado) e um firewall real.

Regras práticas:

- Prefira Tailscale Serve a binds LAN (Serve mantém o Gateway em loopback, e o Tailscale cuida do acesso).
- Se precisar fazer bind em LAN, coloque a porta atrás de firewall com uma allowlist rigorosa de IPs de origem; não faça port-forward amplo.
- Nunca exponha o Gateway sem autenticação em `0.0.0.0`.

### Publicação de porta Docker com UFW

Se você executar o OpenClaw com Docker em uma VPS, lembre-se de que portas publicadas de contêiner
(`-p HOST:CONTAINER` ou `ports:` do Compose) são roteadas pelas cadeias de encaminhamento do Docker,
não apenas por regras `INPUT` do host.

Para manter o tráfego do Docker alinhado à sua política de firewall, imponha regras em
`DOCKER-USER` (essa cadeia é avaliada antes das próprias regras de accept do Docker).
Em muitas distros modernas, `iptables`/`ip6tables` usam o frontend `iptables-nft`
e ainda aplicam essas regras ao backend nftables.

Exemplo mínimo de allowlist (IPv4):

```bash
# /etc/ufw/after.rules (anexe como sua própria seção *filter)
*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
-A DOCKER-USER -s 127.0.0.0/8 -j RETURN
-A DOCKER-USER -s 10.0.0.0/8 -j RETURN
-A DOCKER-USER -s 172.16.0.0/12 -j RETURN
-A DOCKER-USER -s 192.168.0.0/16 -j RETURN
-A DOCKER-USER -s 100.64.0.0/10 -j RETURN
-A DOCKER-USER -p tcp --dport 80 -j RETURN
-A DOCKER-USER -p tcp --dport 443 -j RETURN
-A DOCKER-USER -m conntrack --ctstate NEW -j DROP
-A DOCKER-USER -j RETURN
COMMIT
```

O IPv6 tem tabelas separadas. Adicione uma política correspondente em `/etc/ufw/after6.rules` se
o IPv6 do Docker estiver ativado.

Evite fixar nomes de interface como `eth0` em snippets de documentação. Nomes de interface
variam entre imagens de VPS (`ens3`, `enp*` etc.) e incompatibilidades podem acabar
pulando sua regra de negação.

Validação rápida após o reload:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

As portas externas esperadas devem ser apenas aquelas que você expõe intencionalmente (na maioria das
configurações: SSH + portas do seu proxy reverso).

### Descoberta mDNS/Bonjour

O Gateway transmite sua presença via mDNS (`_openclaw-gw._tcp` na porta 5353) para descoberta local de dispositivos. No modo full, isso inclui registros TXT que podem expor detalhes operacionais:

- `cliPath`: caminho completo no sistema de arquivos para o binário da CLI (revela nome de usuário e local de instalação)
- `sshPort`: anuncia disponibilidade de SSH no host
- `displayName`, `lanHost`: informações de hostname

**Consideração de segurança operacional:** transmitir detalhes da infraestrutura facilita reconhecimento para qualquer pessoa na rede local. Até informações “inofensivas” como caminhos do sistema de arquivos e disponibilidade de SSH ajudam atacantes a mapear seu ambiente.

**Recomendações:**

1. **Modo minimal** (padrão, recomendado para gateways expostos): omita campos sensíveis das transmissões mDNS:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. **Desative totalmente** se você não precisar de descoberta local de dispositivos:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **Modo full** (opt-in): inclui `cliPath` + `sshPort` em registros TXT:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **Variável de ambiente** (alternativa): defina `OPENCLAW_DISABLE_BONJOUR=1` para desativar mDNS sem alterar a configuração.

No modo minimal, o Gateway ainda transmite o suficiente para descoberta de dispositivos (`role`, `gatewayPort`, `transport`), mas omite `cliPath` e `sshPort`. Apps que precisarem de informações sobre o caminho da CLI podem buscá-las pela conexão WebSocket autenticada.

### Restrinja o WebSocket do Gateway (autenticação local)

A autenticação do Gateway é **obrigatória por padrão**. Se nenhum caminho válido de autenticação do gateway estiver configurado,
o Gateway recusará conexões WebSocket (modo fail‑closed).

O onboarding gera um token por padrão (mesmo para loopback), então
clientes locais devem se autenticar.

Defina um token para que **todos** os clientes WS precisem se autenticar:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

O Doctor pode gerar um para você: `openclaw doctor --generate-gateway-token`.

Observação: `gateway.remote.token` / `.password` são fontes de credenciais do cliente. Eles
**não** protegem por si só o acesso WS local.
Caminhos locais de chamada podem usar `gateway.remote.*` como fallback apenas quando `gateway.auth.*`
não estiver definido.
Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via
SecretRef e não resolvido, a resolução falha em modo fail-closed (sem fallback remoto mascarando).
Opcional: fixe o TLS remoto com `gateway.remote.tlsFingerprint` ao usar `wss://`.
`ws://` em plaintext é somente loopback por padrão. Para caminhos confiáveis em rede privada,
defina `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` no processo cliente como medida de emergência.

Pareamento de dispositivo local:

- O pareamento de dispositivo é aprovado automaticamente para conexões diretas locais em loopback, para manter
  os clientes no mesmo host fluidos.
- O OpenClaw também tem um caminho estreito de auto-conexão local de backend/contêiner para
  fluxos auxiliares confiáveis com segredo compartilhado.
- Conexões de tailnet e LAN, incluindo binds de tailnet no mesmo host, são tratadas como
  remotas para pareamento e ainda exigem aprovação.
- Evidência de cabeçalho encaminhado em uma requisição loopback desqualifica a
  localidade de loopback. A aprovação automática de upgrade de metadados é delimitada de forma estreita. Consulte
  [Pareamento do Gateway](/pt-BR/gateway/pairing) para ambas as regras.

Modos de autenticação:

- `gateway.auth.mode: "token"`: token bearer compartilhado (recomendado para a maioria das configurações).
- `gateway.auth.mode: "password"`: autenticação por senha (prefira definir via env: `OPENCLAW_GATEWAY_PASSWORD`).
- `gateway.auth.mode: "trusted-proxy"`: confia em um proxy reverso ciente de identidade para autenticar usuários e passar a identidade por cabeçalhos (consulte [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth)).

Checklist de rotação (token/senha):

1. Gere/defina um novo segredo (`gateway.auth.token` ou `OPENCLAW_GATEWAY_PASSWORD`).
2. Reinicie o Gateway (ou reinicie o app do macOS se ele supervisionar o Gateway).
3. Atualize quaisquer clientes remotos (`gateway.remote.token` / `.password` nas máquinas que chamam o Gateway).
4. Verifique se você não consegue mais se conectar com as credenciais antigas.

### Cabeçalhos de identidade do Tailscale Serve

Quando `gateway.auth.allowTailscale` é `true` (padrão para Serve), o OpenClaw
aceita cabeçalhos de identidade do Tailscale Serve (`tailscale-user-login`) para autenticação da Control
UI/WebSocket. O OpenClaw verifica a identidade resolvendo o endereço
`x-forwarded-for` por meio do daemon local do Tailscale (`tailscale whois`)
e comparando-o com o cabeçalho. Isso só é acionado para requisições que atingem loopback
e incluem `x-forwarded-for`, `x-forwarded-proto` e `x-forwarded-host`, como
injetado pelo Tailscale.
Para esse caminho assíncrono de verificação de identidade, tentativas com falha para o mesmo `{scope, ip}`
são serializadas antes que o limitador registre a falha. Repetições inválidas concorrentes
de um cliente Serve podem, portanto, bloquear a segunda tentativa imediatamente
em vez de passar em corrida como duas incompatibilidades simples.
Endpoints da API HTTP (por exemplo `/v1/*`, `/tools/invoke` e `/api/channels/*`)
**não** usam autenticação por cabeçalho de identidade do Tailscale. Eles continuam seguindo o
modo de autenticação HTTP configurado do gateway.

Observação importante sobre o limite:

- A autenticação bearer HTTP do Gateway é efetivamente acesso total ou nada de operador.
- Trate credenciais que possam chamar `/v1/chat/completions`, `/v1/responses` ou `/api/channels/*` como segredos de operador de acesso total para esse gateway.
- Na superfície HTTP compatível com OpenAI, a autenticação bearer com segredo compartilhado restaura os escopos padrão completos de operador (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) e a semântica de proprietário para turnos do agente; valores mais estreitos em `x-openclaw-scopes` não reduzem esse caminho com segredo compartilhado.
- A semântica de escopo por requisição em HTTP só se aplica quando a requisição vem de um modo com identidade, como autenticação por trusted proxy ou `gateway.auth.mode="none"` em uma entrada privada.
- Nesses modos com identidade, omitir `x-openclaw-scopes` faz fallback para o conjunto normal de escopos padrão de operador; envie o cabeçalho explicitamente quando quiser um conjunto de escopos mais estreito.
- `/tools/invoke` segue a mesma regra de segredo compartilhado: autenticação bearer por token/senha também é tratada ali como acesso total de operador, enquanto modos com identidade ainda respeitam os escopos declarados.
- Não compartilhe essas credenciais com chamadores não confiáveis; prefira gateways separados por limite de confiança.

**Hipótese de confiança:** autenticação Serve sem token presume que o host do gateway é confiável.
Não trate isso como proteção contra processos hostis no mesmo host. Se código local
não confiável puder ser executado no host do gateway, desative `gateway.auth.allowTailscale`
e exija autenticação explícita com segredo compartilhado em `gateway.auth.mode: "token"` ou
`"password"`.

**Regra de segurança:** não encaminhe esses cabeçalhos a partir do seu próprio proxy reverso. Se
você terminar TLS ou usar proxy na frente do gateway, desative
`gateway.auth.allowTailscale` e use autenticação com segredo compartilhado (`gateway.auth.mode:
"token"` ou `"password"`) ou [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth)
no lugar.

Trusted proxies:

- Se você terminar TLS na frente do Gateway, defina `gateway.trustedProxies` para os IPs do seu proxy.
- O OpenClaw confiará em `x-forwarded-for` (ou `x-real-ip`) desses IPs para determinar o IP do cliente em verificações locais de pareamento e verificações locais/de autenticação HTTP.
- Certifique-se de que seu proxy **sobrescreve** `x-forwarded-for` e bloqueia acesso direto à porta do Gateway.

Consulte [Tailscale](/pt-BR/gateway/tailscale) e [Visão geral da web](/pt-BR/web).

### Controle de navegador via host Node (recomendado)

Se o seu Gateway for remoto, mas o navegador rodar em outra máquina, execute um **host Node**
na máquina do navegador e deixe o Gateway fazer proxy das ações do navegador (consulte [Ferramenta browser](/pt-BR/tools/browser)).
Trate o pareamento de Node como acesso de administrador.

Padrão recomendado:

- Mantenha o Gateway e o host Node na mesma tailnet (Tailscale).
- Pareie o Node intencionalmente; desative o roteamento por proxy do navegador se não precisar dele.

Evite:

- Expor portas de relay/controle por LAN ou internet pública.
- Tailscale Funnel para endpoints de controle de navegador (exposição pública).

### Segredos em disco

Presuma que qualquer coisa em `~/.openclaw/` (ou `$OPENCLAW_STATE_DIR/`) pode conter segredos ou dados privados:

- `openclaw.json`: a configuração pode incluir tokens (gateway, gateway remoto), configurações de provedor e allowlists.
- `credentials/**`: credenciais de canal (exemplo: credenciais do WhatsApp), allowlists de pareamento, importações legadas de OAuth.
- `agents/<agentId>/agent/auth-profiles.json`: chaves de API, perfis de token, tokens OAuth e opcionais `keyRef`/`tokenRef`.
- `secrets.json` (opcional): carga útil de segredo com suporte a arquivo usada por provedores SecretRef `file` (`secrets.providers`).
- `agents/<agentId>/agent/auth.json`: arquivo legado de compatibilidade. Entradas estáticas `api_key` são removidas ao serem descobertas.
- `agents/<agentId>/sessions/**`: transcrições de sessão (`*.jsonl`) + metadados de roteamento (`sessions.json`) que podem conter mensagens privadas e saída de ferramenta.
- pacotes de Plugin empacotados: Plugins instalados (mais seus `node_modules/`).
- `sandboxes/**`: workspaces de sandbox de ferramenta; podem acumular cópias de arquivos que você lê/grava dentro do sandbox.

Dicas de reforço:

- Mantenha permissões rígidas (`700` em diretórios, `600` em arquivos).
- Use criptografia de disco completo no host do gateway.
- Prefira uma conta de usuário de SO dedicada para o Gateway se o host for compartilhado.

### Arquivos `.env` do workspace

O OpenClaw carrega arquivos `.env` locais do workspace para agentes e ferramentas, mas nunca deixa esses arquivos sobrescreverem silenciosamente controles de runtime do gateway.

- Qualquer chave que comece com `OPENCLAW_*` é bloqueada em arquivos `.env` não confiáveis do workspace.
- Configurações de endpoint de canal para Matrix, Mattermost, IRC e Synology Chat também são bloqueadas para sobrescritas vindas de `.env` do workspace, para que workspaces clonados não possam redirecionar o tráfego de conectores empacotados por configuração local de endpoint. Chaves de env de endpoint (como `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`) devem vir do ambiente do processo do gateway ou de `env.shellEnv`, não de um `.env` carregado pelo workspace.
- O bloqueio é fail-closed: uma nova variável de controle de runtime adicionada em uma versão futura não poderá ser herdada de um `.env` versionado ou fornecido por atacante; a chave será ignorada e o gateway manterá seu próprio valor.
- Variáveis de ambiente confiáveis do processo/SO (o próprio shell do gateway, unidade launchd/systemd, app bundle) continuam se aplicando — isso restringe apenas o carregamento de arquivo `.env`.

Por quê: arquivos `.env` de workspace frequentemente ficam ao lado do código do agente, são commitados por acidente ou são gravados por ferramentas. Bloquear todo o prefixo `OPENCLAW_*` significa que adicionar um novo sinalizador `OPENCLAW_*` depois nunca poderá regredir para herança silenciosa do estado do workspace.

### Logs e transcrições (redação e retenção)

Logs e transcrições podem vazar informações sensíveis mesmo quando os controles de acesso estão corretos:

- Logs do Gateway podem incluir resumos de ferramentas, erros e URLs.
- Transcrições de sessão podem incluir segredos colados, conteúdos de arquivo, saída de comando e links.

Recomendações:

- Mantenha ativada a redação de resumos de ferramenta (`logging.redactSensitive: "tools"`; padrão).
- Adicione padrões personalizados para seu ambiente via `logging.redactPatterns` (tokens, nomes de host, URLs internas).
- Ao compartilhar diagnósticos, prefira `openclaw status --all` (copiável, com segredos redigidos) em vez de logs brutos.
- Remova transcrições antigas de sessão e arquivos de log se você não precisar de retenção longa.

Detalhes: [Logging](/pt-BR/gateway/logging)

### DMs: pairing por padrão

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### Grupos: exigir menção em todos os lugares

```json
{
  "channels": {
    "whatsapp": {
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "groupChat": { "mentionPatterns": ["@openclaw", "@mybot"] }
      }
    ]
  }
}
```

Em chats em grupo, responda apenas quando houver menção explícita.

### Números separados (WhatsApp, Signal, Telegram)

Para canais baseados em número de telefone, considere executar sua IA em um número separado do seu número pessoal:

- Número pessoal: suas conversas permanecem privadas
- Número do bot: a IA lida com elas, com limites apropriados

### Modo somente leitura (via sandbox e ferramentas)

Você pode construir um perfil somente leitura combinando:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (ou `"none"` para nenhum acesso ao workspace)
- listas allow/deny de ferramentas que bloqueiam `write`, `edit`, `apply_patch`, `exec`, `process` etc.

Opções adicionais de reforço:

- `tools.exec.applyPatch.workspaceOnly: true` (padrão): garante que `apply_patch` não possa gravar/excluir fora do diretório do workspace, mesmo quando o sandboxing estiver desativado. Defina como `false` apenas se você quiser intencionalmente que `apply_patch` toque arquivos fora do workspace.
- `tools.fs.workspaceOnly: true` (opcional): restringe caminhos de `read`/`write`/`edit`/`apply_patch` e caminhos nativos de carregamento automático de imagem em prompt ao diretório do workspace (útil se você permite caminhos absolutos hoje e quer uma única proteção).
- Mantenha raízes de sistema de arquivos estreitas: evite raízes amplas como seu diretório home para workspaces do agente/workspaces de sandbox. Raízes amplas podem expor arquivos locais sensíveis (por exemplo estado/configuração em `~/.openclaw`) às ferramentas de sistema de arquivos.

### Linha de base segura (copiar/colar)

Uma configuração “segura por padrão” que mantém o Gateway privado, exige pareamento por DM e evita bots sempre ativos em grupo:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    auth: { mode: "token", token: "your-long-random-token" },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

Se você quiser também execução de ferramenta “mais segura por padrão”, adicione um sandbox + negue ferramentas perigosas para qualquer agente não proprietário (exemplo abaixo em “Perfis de acesso por agente”).

Linha de base interna para turnos de agente acionados por chat: remetentes que não são proprietários não podem usar as ferramentas `cron` ou `gateway`.

## Sandboxing (recomendado)

Documento dedicado: [Sandboxing](/pt-BR/gateway/sandboxing)

Duas abordagens complementares:

- **Executar o Gateway inteiro em Docker** (limite de contêiner): [Docker](/pt-BR/install/docker)
- **Sandbox de ferramenta** (`agents.defaults.sandbox`, gateway no host + ferramentas isoladas por sandbox; Docker é o backend padrão): [Sandboxing](/pt-BR/gateway/sandboxing)

Observação: para evitar acesso entre agentes, mantenha `agents.defaults.sandbox.scope` em `"agent"` (padrão)
ou `"session"` para isolamento mais rígido por sessão. `scope: "shared"` usa um
único contêiner/workspace.

Considere também o acesso ao workspace do agente dentro do sandbox:

- `agents.defaults.sandbox.workspaceAccess: "none"` (padrão) mantém o workspace do agente fora do alcance; as ferramentas executam contra um workspace de sandbox em `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` monta o workspace do agente somente leitura em `/agent` (desativa `write`/`edit`/`apply_patch`)
- `agents.defaults.sandbox.workspaceAccess: "rw"` monta o workspace do agente com leitura/gravação em `/workspace`
- `sandbox.docker.binds` extras são validados em relação a caminhos de origem normalizados e canonizados. Truques com symlink de pai e aliases canônicos do diretório home ainda falham em modo fail-closed se resolverem para raízes bloqueadas como `/etc`, `/var/run` ou diretórios de credenciais sob o home do SO.

Importante: `tools.elevated` é a rota de escape global de linha de base que executa exec fora do sandbox. O host efetivo é `gateway` por padrão, ou `node` quando o alvo exec está configurado como `node`. Mantenha `tools.elevated.allowFrom` restrito e não o ative para estranhos. Você pode restringir ainda mais o modo elevado por agente via `agents.list[].tools.elevated`. Consulte [Modo elevado](/pt-BR/tools/elevated).

### Proteção de delegação de subagente

Se você permitir ferramentas de sessão, trate execuções delegadas de subagente como outra decisão de limite:

- Negue `sessions_spawn`, a menos que o agente realmente precise de delegação.
- Mantenha `agents.defaults.subagents.allowAgents` e quaisquer sobrescritas por agente em `agents.list[].subagents.allowAgents` restritas a agentes-alvo sabidamente seguros.
- Para qualquer fluxo de trabalho que deva permanecer em sandbox, chame `sessions_spawn` com `sandbox: "require"` (o padrão é `inherit`).
- `sandbox: "require"` falha rapidamente quando o runtime filho de destino não está em sandbox.

## Riscos de controle do navegador

Ativar controle do navegador dá ao modelo a capacidade de dirigir um navegador real.
Se esse perfil do navegador já contiver sessões autenticadas, o modelo poderá
acessar essas contas e dados. Trate perfis de navegador como **estado sensível**:

- Prefira um perfil dedicado para o agente (o perfil padrão `openclaw`).
- Evite apontar o agente para seu perfil pessoal de uso diário.
- Mantenha o controle de navegador no host desativado para agentes em sandbox, a menos que você confie neles.
- A API independente de controle de navegador em loopback só aceita autenticação por segredo compartilhado
  (autenticação bearer por token do gateway ou senha do gateway). Ela não consome
  cabeçalhos de identidade de trusted-proxy ou Tailscale Serve.
- Trate downloads do navegador como entrada não confiável; prefira um diretório de downloads isolado.
- Desative sincronização/gerenciadores de senha do navegador no perfil do agente, se possível (reduz o raio de impacto).
- Para gateways remotos, presuma que “controle do navegador” é equivalente a “acesso de operador” a tudo o que esse perfil puder alcançar.
- Mantenha o Gateway e os hosts Node apenas na tailnet; evite expor portas de controle do navegador à LAN ou internet pública.
- Desative o roteamento por proxy do navegador quando não precisar dele (`gateway.nodes.browser.mode="off"`).
- O modo Chrome MCP de sessão existente **não** é “mais seguro”; ele pode agir como você em tudo o que esse perfil do Chrome no host puder alcançar.

### Política SSRF do navegador (estrita por padrão)

A política de navegação do navegador do OpenClaw é estrita por padrão: destinos privados/internos permanecem bloqueados, a menos que você opte explicitamente por permiti-los.

- Padrão: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` não está definido, então a navegação do navegador mantém destinos privados/internos/de uso especial bloqueados.
- Alias legado: `browser.ssrfPolicy.allowPrivateNetwork` ainda é aceito por compatibilidade.
- Modo opt-in: defina `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` para permitir destinos privados/internos/de uso especial.
- No modo estrito, use `hostnameAllowlist` (padrões como `*.example.com`) e `allowedHostnames` (exceções de host exatas, incluindo nomes bloqueados como `localhost`) para exceções explícitas.
- A navegação é verificada antes da requisição e rechecada em best-effort na URL final `http(s)` após a navegação para reduzir pivôs baseados em redirecionamento.

Exemplo de política estrita:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"],
    },
  },
}
```

## Perfis de acesso por agente (multiagente)

Com roteamento multiagente, cada agente pode ter sua própria política de sandbox + ferramenta:
use isso para conceder **acesso total**, **somente leitura** ou **nenhum acesso** por agente.
Consulte [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools) para detalhes completos
e regras de precedência.

Casos de uso comuns:

- Agente pessoal: acesso total, sem sandbox
- Agente de família/trabalho: em sandbox + ferramentas somente leitura
- Agente público: em sandbox + sem ferramentas de sistema de arquivos/shell

### Exemplo: acesso total (sem sandbox)

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

### Exemplo: ferramentas somente leitura + workspace somente leitura

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### Exemplo: sem acesso a sistema de arquivos/shell (mensagens do provedor permitidas)

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none",
        },
        // Ferramentas de sessão podem revelar dados sensíveis de transcrições. Por padrão, o OpenClaw limita essas ferramentas
        // à sessão atual + sessões de subagentes geradas, mas você pode restringir ainda mais se necessário.
        // Consulte `tools.sessions.visibility` na referência de configuração.
        tools: {
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

## Resposta a incidentes

Se sua IA fizer algo ruim:

### Conter

1. **Pare-a:** pare o app do macOS (se ele supervisiona o Gateway) ou encerre o processo `openclaw gateway`.
2. **Feche a exposição:** defina `gateway.bind: "loopback"` (ou desative Tailscale Funnel/Serve) até entender o que aconteceu.
3. **Congele o acesso:** mude DMs/grupos arriscados para `dmPolicy: "disabled"` / exigência de menção e remova entradas `"*"` de permitir tudo, se você as tiver.

### Rotacionar (presuma comprometimento se segredos vazaram)

1. Rotacione a autenticação do Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) e reinicie.
2. Rotacione segredos de clientes remotos (`gateway.remote.token` / `.password`) em qualquer máquina que possa chamar o Gateway.
3. Rotacione credenciais de provedor/API (credenciais do WhatsApp, tokens de Slack/Discord, chaves de modelo/API em `auth-profiles.json` e valores de payload de segredos criptografados quando usados).

### Auditar

1. Verifique os logs do Gateway: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (ou `logging.file`).
2. Revise a(s) transcrição(ões) relevante(s): `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Revise alterações recentes de configuração (qualquer coisa que possa ter ampliado acesso: `gateway.bind`, `gateway.auth`, políticas de dm/grupo, `tools.elevated`, alterações de Plugin).
4. Execute novamente `openclaw security audit --deep` e confirme que os achados críticos foram resolvidos.

### Coletar para um relatório

- Timestamp, SO do host do gateway + versão do OpenClaw
- A(s) transcrição(ões) de sessão + uma cauda curta de log (após redação)
- O que o atacante enviou + o que o agente fez
- Se o Gateway estava exposto além de loopback (LAN/Tailscale Funnel/Serve)

## Varredura de segredos com detect-secrets

O CI executa o hook pre-commit `detect-secrets` no job `secrets`.
Pushes para `main` sempre executam uma varredura em todos os arquivos. Pull requests usam um caminho rápido de arquivos alterados quando um commit base está disponível e recuam para uma varredura em todos os arquivos caso contrário. Se falhar, há novos candidatos ainda não presentes na linha de base.

### Se o CI falhar

1. Reproduza localmente:

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. Entenda as ferramentas:
   - `detect-secrets` no pre-commit executa `detect-secrets-hook` com a
     linha de base e exclusões do repositório.
   - `detect-secrets audit` abre uma revisão interativa para marcar cada item da linha de base
     como real ou falso positivo.
3. Para segredos reais: rotacione/remova-os e depois execute novamente a varredura para atualizar a linha de base.
4. Para falsos positivos: execute a auditoria interativa e marque-os como falsos:

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. Se precisar de novas exclusões, adicione-as a `.detect-secrets.cfg` e regenere a
   linha de base com flags correspondentes `--exclude-files` / `--exclude-lines` (o arquivo
   de configuração é apenas de referência; o detect-secrets não o lê automaticamente).

Faça commit da `.secrets.baseline` atualizada quando ela refletir o estado pretendido.

## Relatando problemas de segurança

Encontrou uma vulnerabilidade no OpenClaw? Relate de forma responsável:

1. Email: [security@openclaw.ai](mailto:security@openclaw.ai)
2. Não publique publicamente até que seja corrigido
3. Daremos crédito a você (a menos que prefira anonimato)
